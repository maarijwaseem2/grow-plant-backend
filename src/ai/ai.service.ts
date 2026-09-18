import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuyPlant } from '../buy-plant/entities/buy-plant.entity';
import { firstValueFrom } from 'rxjs';
import { PlantationSpotService } from '../plantation-spot/plantation-spot.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly base = process.env.AI_SERVICE_URL || 'http://localhost:8000';

  constructor(
    private readonly http: HttpService,
    private readonly spots: PlantationSpotService,
    @InjectRepository(BuyPlant) private readonly plants: Repository<BuyPlant>,
  ) {}

  async suggestSpots(lat: number, lng: number, radius: number, limit: number) {
    try {
      const res = await firstValueFrom(
        this.http.get(`${this.base}/suggest-spots`, { params: { lat, lng, radius, limit } }),
      );
      const geojson = res.data;

      // Cache the suggested spots into PostGIS (deduped by proximity).
      const features = (geojson.features || []).map((f: any) => ({
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        name: f.properties?.name,
        category: f.properties?.category,
        score: f.properties?.score,
      }));
      let cachedNew = 0;
      try {
        cachedNew = await this.spots.saveMany(features);
      } catch (e: any) {
        this.logger.warn(`Could not cache spots: ${e?.message || e}`);
      }
      geojson.meta = { ...(geojson.meta || {}), cachedNew };
      return geojson;
    } catch (e: any) {
      this.logger.error(`AI service unreachable: ${e?.message || e}`);
      throw new InternalServerErrorException('AI service is unavailable. Is it running on ' + this.base + '?');
    }
  }

  async verifyPlant(file: Express.Multer.File) {
    try {
      const fd = new FormData();
      fd.append('file', new Blob([file.buffer]), file.originalname);
      const res = await firstValueFrom(this.http.post(`${this.base}/verify-plant`, fd));
      return res.data;
    } catch (e: any) {
      throw new InternalServerErrorException('AI service is unavailable.');
    }
  }

  /**
   * Go Green Assistant chatbot. Calls OpenAI's chat-completions API using the key
   * from OPENAI_API_KEY. Degrades gracefully (a helpful message) when no key is set
   * or the call fails, so the widget never crashes the app.
   */
  async chat(messages: { role: string; content: string }[]) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        reply:
          "The Go Green Assistant isn't configured yet. Add OPENAI_API_KEY to the backend .env file to enable it.",
        configured: false,
      };
    }
    // RAG: pull the live shop catalog so the assistant answers availability/price accurately.
    let catalog = '';
    try {
      const items = await this.plants.find();
      if (items.length) {
        catalog =
          '\n\nLIVE SHOP CATALOG (answer availability and price questions ONLY from this list; ' +
          'if an item is here it is available — give its price and stock; if not, say we do not ' +
          'stock it yet and suggest a close alternative from the list):\n' +
          items
            .slice(0, 80)
            .map(
              (p) =>
                `- ${p.name} [${p.category || 'plant'}] - Rs ${p.price}, ${p.quantity > 0 ? p.quantity + ' in stock' : 'out of stock'}`,
            )
            .join('\n');
      }
    } catch {
      /* catalog is optional */
    }

    const system = {
      role: 'system',
      content:
        'You are the Go Green Assistant, a friendly helper for "Go Green", a tree-plantation ' +
        'and plant shop in Pakistan. Help users with tree planting, plant care, native Pakistani ' +
        'species, watering and soil tips, and the platform features (buying plants and garden ' +
        'supplies, donations, booking a gardener, home services, and finding public plantation ' +
        'spots). When a user asks whether a plant or product is available or its price, use the ' +
        'live shop catalog below. Keep answers short, practical and encouraging. If a question is ' +
        'unrelated to plants, gardening or the environment, gently steer back to how Go Green can help.' +
        catalog,
    };
    // Keep only the fields the API expects, and cap history length.
    const clean = (messages || [])
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
      .slice(-10)
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
    try {
      const res = await firstValueFrom(
        this.http.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [system, ...clean],
            max_tokens: 500,
            temperature: 0.7,
          },
          { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } },
        ),
      );
      const reply =
        res.data?.choices?.[0]?.message?.content?.trim() ||
        "Sorry, I couldn't generate a response.";
      return { reply, configured: true };
    } catch (e: any) {
      const apiErr = e?.response?.data?.error;
      const msg = apiErr?.message || e?.message || 'unknown error';
      this.logger.error(`Chat failed: ${msg}`);
      let hint = 'Sorry, the assistant is temporarily unavailable. Please try again.';
      const code = apiErr?.code || apiErr?.type;
      if (code === 'invalid_api_key' || code === 'invalid_request_error')
        hint = 'Assistant key looks invalid — check OPENAI_API_KEY in the backend env.';
      else if (code === 'insufficient_quota')
        hint = 'The assistant OpenAI account is out of credit. Add billing/credit at platform.openai.com/account/billing.';
      else if (e?.response?.status === 401)
        hint = 'OpenAI rejected the key (401). Re-check OPENAI_API_KEY.';
      return { reply: hint, configured: true, error: msg };
    }
  }

  /**
   * Rule-based plant recommender — suggests in-stock items from the catalog that
   * suit the user's sunlight/space (free, no external ML). Returns reasons too.
   */
  async recommend(prefs: { sunlight?: string; space?: string; province?: string }) {
    const items = await this.plants.find();
    const inStock = items.filter((p) => (p.quantity ?? 0) > 0);
    const sun = (prefs.sunlight || '').toLowerCase();
    const space = (prefs.space || '').toLowerCase();

    const scored = inStock.map((p) => {
      const cat = (p.category || '').toLowerCase();
      let score = 1;
      const reasons: string[] = [];
      if (sun.includes('shade') && (cat.includes('indoor') || cat.includes('herb'))) {
        score += 3; reasons.push('thrives in low light');
      }
      if (sun.includes('full') && (cat.includes('outdoor') || cat.includes('fruit') || cat.includes('flower') || cat.includes('vegetable'))) {
        score += 3; reasons.push('loves full sun');
      }
      if (sun.includes('partial')) score += 1;
      if (space.includes('small') && (cat.includes('indoor') || cat.includes('herb') || cat.includes('pot'))) {
        score += 3; reasons.push('perfect for small spaces / pots');
      }
      if (space.includes('large') && (cat.includes('outdoor') || cat.includes('fruit'))) {
        score += 3; reasons.push('great for open ground');
      }
      if (reasons.length === 0) reasons.push('an easy, popular choice');
      return { p, score, reason: reasons[0] };
    });

    scored.sort((a, b) => b.score - a.score);
    return {
      data: scored.slice(0, 6).map((s) => ({
        id: s.p.id,
        name: s.p.name,
        category: s.p.category,
        price: s.p.price,
        image: s.p.image,
        reason: s.reason,
      })),
    };
  }


  /** Proxy to the AI service's satellite greenness/suitability estimate for a spot. */
  async spotGreenness(lat: number, lng: number) {
    try {
      const res = await firstValueFrom(
        this.http.get(`${this.base}/spot-greenness`, { params: { lat, lng } }),
      );
      return res.data;
    } catch {
      return { greenness: null, note: 'Suitability check is unavailable right now.' };
    }
  }

}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlantationSpot } from './entities/plantation-spot.entity';
import { RedisCacheService } from '../shared/redis/redis.service';

@Injectable()
export class PlantationSpotService {
  constructor(
    @InjectRepository(PlantationSpot)
    private readonly repo: Repository<PlantationSpot>,
    private readonly cache: RedisCacheService,
  ) {}

  private point(lat: number, lng: number): object {
    return { type: 'Point', coordinates: [lng, lat] };
  }

  /** Insert spots, skipping any that already exist within ~25m (simple cache). */
  async saveMany(
    features: Array<{ lat: number; lng: number; name: string; category?: string; score?: number }>,
  ): Promise<number> {
    let saved = 0;
    for (const f of features) {
      const exists = await this.repo
        .createQueryBuilder('s')
        .where(
          'ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, 25)',
          { lat: f.lat, lng: f.lng },
        )
        .getExists();
      if (exists) continue;
      await this.repo.save(
        this.repo.create({
          name: f.name,
          category: f.category,
          score: f.score ?? 0,
          location: this.point(f.lat, f.lng),
        }),
      );
      saved += 1;
    }
    return saved;
  }

  /** Nearby spots within `radius` metres, closest first (uses the spatial index). */
  async findNearby(lat: number, lng: number, radius: number): Promise<any[]> {
    const cacheKey = `nearby:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;
    const cached = await this.cache.get<any[]>(cacheKey);
    if (cached) return cached;

    const rows = await this.repo
      .createQueryBuilder('s')
      .select('s.id', 'id')
      .addSelect('s.name', 'name')
      .addSelect('s.category', 'category')
      .addSelect('s.score', 'score')
      .addSelect('ST_Y(s.location::geometry)', 'lat')
      .addSelect('ST_X(s.location::geometry)', 'lng')
      .addSelect(
        'ST_Distance(s.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)',
        'distance',
      )
      .where(
        'ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)',
        { lat, lng, radius },
      )
      .orderBy('distance', 'ASC')
      .setParameters({ lat, lng, radius })
      .getRawMany();

    await this.cache.set(cacheKey, rows, 60);
    return rows;
  }

  async count(): Promise<number> {
    return this.repo.count();
  }
}

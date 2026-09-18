import { Controller, Get, Post, Query, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  /** GET /ai/suggest-spots?lat=&lng=&radius=&limit= — proxies the AI service + caches results. */
  @Get('suggest-spots')
  suggest(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius = '3000',
    @Query('limit') limit = '30',
  ) {
    return this.ai.suggestSpots(parseFloat(lat), parseFloat(lng), parseInt(radius, 10), parseInt(limit, 10));
  }

  /** POST /ai/verify-plant (multipart `file`) — proxies to the AI photo check. */
  @Post('verify-plant')
  @UseInterceptors(FileInterceptor('file'))
  verify(@UploadedFile() file: Express.Multer.File) {
    return this.ai.verifyPlant(file);
  }

  /** POST /ai/chat { messages: [{ role, content }] } — Go Green Assistant (OpenAI). */
  @Post('chat')
  chat(@Body() body: { messages: { role: string; content: string }[] }) {
    return this.ai.chat(body?.messages || []);
  }

  /** POST /ai/recommend { sunlight, space, province } — suggest suitable plants. */
  @Post('recommend')
  recommend(@Body() body: { sunlight?: string; space?: string; province?: string }) {
    return this.ai.recommend(body || {});
  }

  /** GET /ai/spot-greenness?lat&lng — satellite greenness/suitability estimate. */
  @Get('spot-greenness')
  greenness(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.ai.spotGreenness(Number(lat), Number(lng));
  }
}

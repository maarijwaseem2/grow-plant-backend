import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Thin optional cache. If REDIS_HOST is set it uses Redis; otherwise every call
 * is a safe no-op, so the app runs fine locally without Redis and uses Redis
 * automatically under Docker Compose.
 */
@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis | null = null;

  constructor() {
    const host = process.env.REDIS_HOST;
    if (!host) {
      this.logger.log('REDIS_HOST not set — caching disabled (no-op).');
      return;
    }
    try {
      this.client = new Redis({
        host,
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      this.client.on('error', (e) => this.logger.warn(`Redis error: ${e.message}`));
      this.logger.log(`Redis cache enabled at ${host}`);
    } catch (e: any) {
      this.logger.warn(`Redis init failed: ${e?.message || e}`);
      this.client = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const v = await this.client.get(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      /* ignore cache write failures */
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}

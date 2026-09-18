import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';

/**
 * Optional background job queue (BullMQ). Active only when REDIS_HOST is set
 * (BullMQ needs Redis), otherwise enqueue() is a safe no-op so local dev runs
 * without Redis. Under Docker (REDIS_HOST=redis) the worker processes jobs
 * off the request thread — ready for heavier tasks (image/satellite processing).
 */
@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;

  onModuleInit() {
    const host = process.env.REDIS_HOST;
    if (!host) {
      this.logger.log('REDIS_HOST not set — background queue disabled (no-op).');
      return;
    }
    const connection = {
      host,
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    };
    try {
      this.queue = new Queue('background', { connection });
      this.worker = new Worker(
        'background',
        async (job) => {
          // Handle background jobs here. For now we log; heavy work goes here.
          this.logger.log(`Processed job "${job.name}" -> ${JSON.stringify(job.data)}`);
          return { ok: true };
        },
        { connection },
      );
      this.worker.on('failed', (job, err) => this.logger.warn(`Job failed: ${err?.message}`));
      this.logger.log(`Background queue enabled (Redis ${host}).`);
    } catch (e: any) {
      this.logger.warn(`Queue init failed: ${e?.message || e}`);
      this.queue = null;
    }
  }

  async enqueue(name: string, data: any) {
    if (!this.queue) return;
    try {
      await this.queue.add(name, data, { removeOnComplete: true, attempts: 2 });
    } catch (e: any) {
      this.logger.warn(`enqueue failed: ${e?.message || e}`);
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }
}

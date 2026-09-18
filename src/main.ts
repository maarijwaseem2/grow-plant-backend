import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { JwtAuthGuard } from './shared/guards/jwt.guard';
import * as multer from 'multer';
import * as bodyParser from 'body-parser';
import { join } from 'path';
import * as express from 'express';
import { Client } from 'pg';

// Ensure PostGIS exists BEFORE TypeORM synchronizes (geometry columns need it).
async function ensurePostgis() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    await client.connect();
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
    // Convert buy_plant.category from a Postgres enum to varchar so new product
    // categories (Seeds, Tools, Soil, etc.) work without ALTER TYPE headaches.
    // No-op on a fresh DB (table not created yet); idempotent on an existing one.
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'buy_plant' AND column_name = 'category' AND data_type = 'USER-DEFINED'
        ) THEN
          UPDATE buy_plant SET category = 'Indoor Plants'::buy_plant_category_enum WHERE category IS NULL;
          ALTER TABLE buy_plant ALTER COLUMN category TYPE varchar(255) USING category::text;
        END IF;
      END $$;
    `);
    console.log('PostGIS ensured before schema sync.');
  } catch (e: any) {
    console.warn('Could not ensure PostGIS:', e?.message || e);
  } finally {
    try { await client.end(); } catch {}
  }
}
// Node 18+ (this project runs on Node 22) provides a native global fetch,
// so the previous `global.fetch = require('node-fetch')` line was both
// unnecessary and crashed on boot because node-fetch was never installed.
async function bootstrap() {
  dotenv.config();
  await ensurePostgis();

  const app = await NestFactory.create(AppModule);

  const frontendOrigins = (
    process.env.FRONTEND_URL ||
    'http://localhost:5173,http://localhost:5174'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.enableCors({
    origin: frontendOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Accept',
    credentials: true,
  });
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  await app.init();
  app.use(multer);
  app.use(bodyParser.urlencoded({ extended: true, limit: '15mb' }));
  app.use(bodyParser.text({ type: 'text/html', limit: '15mb' }));
  app.use(bodyParser.json({ limit: '15mb' }));
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  // app.useGlobalGuards(new JwtAuthGuard());

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();

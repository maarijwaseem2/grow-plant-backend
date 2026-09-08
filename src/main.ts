import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { JwtAuthGuard } from './shared/guards/jwt.guard';
import * as multer from 'multer';
import * as bodyParser from 'body-parser';
import { join } from 'path';
import * as express from 'express';
// Node 18+ (this project runs on Node 22) provides a native global fetch,
// so the previous `global.fetch = require('node-fetch')` line was both
// unnecessary and crashed on boot because node-fetch was never installed.
async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create(AppModule);

  const frontendOrigins = (
    process.env.FRONTEND_URL ||
    'http://localhost:5173,http://localhost:5174'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: frontendOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Accept',
    credentials: true,
  });
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  await app.init();
  app.use(multer);
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.text({ type: 'text/html' }));
  app.use(bodyParser.json());
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // app.useGlobalGuards(new JwtAuthGuard());

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
}
bootstrap();

import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter';

describe('Go Green API (e2e)', () => {
  let app: INestApplication;
  const rnd = Date.now();
  const custEmail = `cust${rnd}@test.com`;
  let custToken: string;
  let adminToken: string;
  const ok = (s: number) => expect([200, 201]).toContain(s);

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  }, 40000);

  afterAll(async () => { await app.close(); });

  it('signs up a customer (with province/city/mobile)', async () => {
    const res = await request(app.getHttpServer()).post('/user').send({
      username: `Test Customer ${rnd}`, email: custEmail, mobile: '03001234567',
      province: 'Sindh', city: 'Karachi', password: 'pass123', rePassword: 'pass123', role: 'Customer',
    });
    ok(res.status);
  });

  it('rejects a duplicate email', async () => {
    const res = await request(app.getHttpServer()).post('/user').send({
      username: `Duplicate User ${rnd}`, email: custEmail, mobile: '03001234567',
      province: 'Sindh', city: 'Karachi', password: 'pass123', rePassword: 'pass123', role: 'Customer',
    });
    expect(res.status).toBe(400);
  });

  it('blocks admin self-signup', async () => {
    const res = await request(app.getHttpServer()).post('/user').send({
      username: `Hacker ${rnd}`, email: `hack${rnd}@test.com`, mobile: '03001234567',
      province: 'Sindh', city: 'Karachi', password: 'pass123', rePassword: 'pass123', role: 'Admin',
    });
    expect(res.status).toBe(400);
  });

  it('logs in the customer', async () => {
    const res = await request(app.getHttpServer()).post('/auth').send({ email: custEmail, password: 'pass123' });
    ok(res.status);
    custToken = res.body.data.token;
    expect(custToken).toBeTruthy();
  });

  it('logs in the seeded admin', async () => {
    const res = await request(app.getHttpServer()).post('/auth')
      .send({ email: process.env.ADMIN_EMAIL || 'admin@gogreen.pk', password: process.env.ADMIN_PASSWORD || 'Admin@12345' });
    ok(res.status);
    adminToken = res.body.data.token;
    expect(res.body.data.role).toBe('Admin');
  });

  it('blocks a customer from the admin dashboard (403)', async () => {
    const res = await request(app.getHttpServer()).get('/auth/dashboard').set('Authorization', `Bearer ${custToken}`);
    expect(res.status).toBe(403);
  });

  it('allows the admin into the admin dashboard (200)', async () => {
    const res = await request(app.getHttpServer()).get('/auth/dashboard').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('rejects gardener tasks without a token (401)', async () => {
    const res = await request(app.getHttpServer()).get('/services/gardener/tasks');
    expect(res.status).toBe(401);
  });

  it('lists plants (public)', async () => {
    const res = await request(app.getHttpServer()).get('/plants');
    ok(res.status);
  });
});

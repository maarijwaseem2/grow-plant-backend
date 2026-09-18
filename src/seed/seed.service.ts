import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/userRole.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // 1) Enable PostGIS (safe if already enabled) — ready for the Phase 3 geo layer.
    try {
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS postgis');
      this.logger.log('PostGIS extension is enabled.');
    } catch (e: any) {
      this.logger.warn(`Could not enable PostGIS automatically: ${e?.message || e}`);
    }

    // 2) Seed the admin from environment variables (replaces the old hardcoded admin).
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      this.logger.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin seed.');
      return;
    }

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      this.logger.log(`Admin already present (${email}).`);
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const admin = this.userRepo.create({
      username: 'Administrator',
      email,
      password: hashed,
      role: UserRole.Admin,
    });
    await this.userRepo.save(admin);
    this.logger.log(`Seeded admin account: ${email}`);
  }
}

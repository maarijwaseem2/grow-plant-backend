import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';

import { PaymentModule } from './payment/payment.module';
import { BuyPlantModule } from './buy-plant/buy-plant.module';
import { ServicesModule } from './services/services.module';
import { HomeServiceModule } from './home-service/home-service.module';
import { OrderModule } from './order/order.module';
import { DonationModule } from './donation/donation.module';
import { ComplainModule } from './complain/complain.module';
import { NotificationModule } from './notification/notification.module';
import { SeedModule } from './seed/seed.module';
import { RedisModule } from './shared/redis/redis.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ChatModule } from './chat/chat.module';
import { ContactModule } from './contact/contact.module';
import { QueueModule } from './queue/queue.module';
import { AiModule } from './ai/ai.module';
import { PlantationSpotModule } from './plantation-spot/plantation-spot.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting (in-memory): 100 requests per minute per IP.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    UserModule,
    AuthModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: false,
        // Neon / managed Postgres need SSL — set DB_SSL=true in production
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    RealtimeModule,
    ChatModule,
    ContactModule,
    QueueModule,
    SeedModule,
    PlantationSpotModule,
    AiModule,
    PaymentModule,
    BuyPlantModule,
    NotificationModule,
    ServicesModule,
    HomeServiceModule,
    OrderModule,
    DonationModule,
    ComplainModule,
  ],
  controllers: [],
  providers: [
    // Global rate-limiter (replaces the previous no-op LocalAuthGuard).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}

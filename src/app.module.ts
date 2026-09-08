import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { LocalAuthGuard } from './shared/guards/local.guard';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';

import { PaymentModule } from './payment/payment.module';

import { BuyPlantModule } from './buy-plant/buy-plant.module';
import { ServicesModule } from './services/services.module';
import { HomeServiceModule } from './home-service/home-service.module';
import { OrderModule } from './order/order.module';
import { DonationModule } from './donation/donation.module';
import { ComplainModule } from './complain/complain.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UserModule,
    AuthModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),

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
    {
      provide: APP_GUARD,
      useClass: LocalAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { HomeServiceService } from './home-service.service';
import { HomeServiceController } from './home-service.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeService } from './entities/home-service.entity';
import { BuyPlant } from 'src/buy-plant/entities/buy-plant.entity';
import { User } from 'src/users/entities/user.entity';
import { Notification } from 'src/notification/entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HomeService, BuyPlant, User, Notification])],
  controllers: [HomeServiceController],
  providers: [HomeServiceService],
})
export class HomeServiceModule {}

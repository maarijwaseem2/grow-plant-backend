import { Module, forwardRef } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { BuyPlantModule } from 'src/buy-plant/buy-plant.module';
import { BuyPlant } from 'src/buy-plant/entities/buy-plant.entity';
import { BuyPlantService } from 'src/buy-plant/buy-plant.service';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, BuyPlant, Notification]),
    forwardRef(() => BuyPlantModule),
  ],
  controllers: [ServicesController],
  providers: [ServicesService, NotificationService],
  exports: [ServicesService],
})
export class ServicesModule {}

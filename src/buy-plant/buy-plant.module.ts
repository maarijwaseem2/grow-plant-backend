import { Module } from '@nestjs/common';
import { BuyPlantService } from './buy-plant.service';
import { BuyPlantController } from './buy-plant.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyPlant } from './entities/buy-plant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BuyPlant])],
  controllers: [BuyPlantController],
  providers: [BuyPlantService],
})
export class BuyPlantModule {}

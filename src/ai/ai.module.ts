import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PlantationSpotModule } from '../plantation-spot/plantation-spot.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyPlant } from '../buy-plant/entities/buy-plant.entity';

@Module({
  imports: [HttpModule, PlantationSpotModule, TypeOrmModule.forFeature([BuyPlant])],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}

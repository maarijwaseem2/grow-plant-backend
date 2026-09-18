import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantationSpot } from './entities/plantation-spot.entity';
import { PlantationSpotService } from './plantation-spot.service';
import { PlantationSpotController } from './plantation-spot.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlantationSpot])],
  controllers: [PlantationSpotController],
  providers: [PlantationSpotService],
  exports: [PlantationSpotService],
})
export class PlantationSpotModule {}

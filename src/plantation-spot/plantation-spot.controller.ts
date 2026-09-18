import { Controller, Get, Query } from '@nestjs/common';
import { PlantationSpotService } from './plantation-spot.service';

@Controller('plantation-spots')
export class PlantationSpotController {
  constructor(private readonly service: PlantationSpotService) {}

  /** GET /plantation-spots/nearby?lat=&lng=&radius= — PostGIS ST_DWithin query. */
  @Get('nearby')
  async nearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius = '3000',
  ) {
    const spots = await this.service.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      parseInt(radius, 10),
    );
    return { message: 'Nearby plantation spots', data: spots };
  }

  @Get('count')
  async total() {
    return { count: await this.service.count() };
  }
}

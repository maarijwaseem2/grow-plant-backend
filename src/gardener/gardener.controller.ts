import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../shared/guards/jwt.guard';
import { GardenerGuard } from '../shared/guards/gardener.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from 'src/services/entities/service.entity';

@Controller('gardener')
export class GardenerController {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  @UseGuards(JwtAuthGuard, GardenerGuard)
  @Get('tasks')
  async getGardenerTasks(@Request() req) {
    // req.user.id contains the authenticated gardener's user id
    return await this.serviceRepository.find({
      where: { gardenerId: req.user.id },
    });
  }
}
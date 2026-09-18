import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { HomeServiceService } from './home-service.service';
import { CreateHomeServiceDto } from './dto/create-home-service.dto';
import { UpdateHomeServiceDto } from './dto/update-home-service.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';
import { AdminGuard } from 'src/shared/guards/admin.guard';
import { GardenerGuard } from 'src/shared/guards/gardener.guard';
import { Request as ExpressRequest } from 'express';

interface User {
  userId: string;
  username: string;
  // Add other user properties if needed
}
@Controller('home-service')
@UseGuards(JwtAuthGuard)
export class HomeServiceController {
  constructor(private readonly homeServiceService: HomeServiceService) {}

  // @Post()
  // async create(
  //   @Body() createHomeServiceDto: CreateHomeServiceDto,
  //   @Request() req: ExpressRequest,
  // ) {
  //   const user = req.user as User; // Cast `req.user` to your `User` type
  //   const userId = user.userId;
  //   return this.homeServiceService.create(createHomeServiceDto);
  // }

  @Post()
  create(@Body() createHomeServiceDto: CreateHomeServiceDto) {
    return this.homeServiceService.create(createHomeServiceDto);
  }

  @Get()
  findAll() {
    return this.homeServiceService.findAll();
  }

  @Get('mine')
  getMine(@Request() req) {
    return this.homeServiceService.getMyHomeServices(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.homeServiceService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHomeServiceDto: UpdateHomeServiceDto,
  ) {
    return this.homeServiceService.update(id, updateHomeServiceDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.homeServiceService.remove(id);
  }

  // ---- Gardener workflow ----
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('assign-gardener/:id')
  assignGardener(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('gardenerId') gardenerId: string,
  ) {
    return this.homeServiceService.assignGardener(id, gardenerId);
  }

  @UseGuards(JwtAuthGuard, GardenerGuard)
  @Get('gardener/tasks')
  gardenerTasks(@Request() req) {
    return this.homeServiceService.getGardenerTasks(req.user.id);
  }

  @UseGuards(JwtAuthGuard, GardenerGuard)
  @Patch('gardener/tasks/:id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
    @Request() req,
  ) {
    return this.homeServiceService.updateTaskStatus(id, req.user.id, status);
  }
}

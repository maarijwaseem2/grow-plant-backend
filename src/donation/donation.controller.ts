import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  BadRequestException,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DonationService } from './donation.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { UpdateDonationDto } from './dto/update-donation.dto';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';

interface User {
  userId: string;
  username: string;
}

@Controller('donation')
@UseGuards(JwtAuthGuard)
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  @Post()
  create(@Body() createDonationDto: CreateDonationDto) {
    try {
      return this.donationService.create(createDonationDto);
    } catch (error) {
      console.error('Error in OrderController.create:', error);
      throw error;
    }
  }

  @Get()
  findAll() {
    return this.donationService.findAll();
  }

  // @Get(':id')
  // findOne(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.donationService.findOne(id);
  // }

  // @Patch(':id')
  // update(@Param('id',ParseUUIDPipe) id: string, @Body() updateDonationDto: UpdateDonationDto) {
  //   return this.donationService.update(id, updateDonationDto);
  // }

  // @Delete(':id')
  // remove(@Param('id',ParseUUIDPipe) id: string) {
  //   return this.donationService.remove(id);
  // }
}

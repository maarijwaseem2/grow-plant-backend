import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Request, BadRequestException, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';
import { AdminGuard } from 'src/shared/guards/admin.guard';

interface User {
  userId: string;
  username: string;
}

@Controller('order')
// @UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // @Post()
  // create(
  //   @Body() createOrderDto: CreateOrderDto,
  //   @Request() req: ExpressRequest,
  // ) {
  //   try {
  //     const user = req.user as User; // Cast `req.user` to your `User` type
  //     if (!user) {
  //       throw new BadRequestException('User ID is missing in the request');
  //     }
  //     const userId = user.userId;
  //     return this.orderService.create(createOrderDto, userId); // Pass user ID
  //   } catch (error) {
  //     console.error('Error in OrderController.create:', error);
  //     throw error;
  //   }
  // }
  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.orderService.findAll(); // Fetch user-specific orders
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  getMine(@Request() req) {
    return this.orderService.getMyOrders(req.user.id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.orderService.updateStatus(id, body.status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.remove(id);
  }
}

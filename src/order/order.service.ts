import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { BuyPlant } from 'src/buy-plant/entities/buy-plant.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(BuyPlant)
    private plantRepository: Repository<BuyPlant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
  //   const { plantId, quantity } = createOrderDto;
  //   const plant = await this.plantRepository.findOne({
  //     where: { id: plantId },
  //   });
  //   if (!plant) {
  //     throw new NotFoundException('Plant not found');
  //   }
  //   const user = await this.userRepository.findOne({ where: { id: userId } });
  //   if (!user) {
  //     throw new Error('User not found');
  //   }
  //   const totalPrice = plant.price * quantity;

  //   const order = this.orderRepository.create({
  //     ...createOrderDto,
  //     totalPrice,
  //   });
  //   return await this.orderRepository.save(order);
  // }

  async create(createOrderDto: CreateOrderDto) {
    const {
      plants,
      userId,
      total,
      firstName,
      lastName,
      email,
      phone,
      address,
      postcode,
    } = createOrderDto;

    const orders = [];
    for (const { plantId, quantity, name } of plants) {
      const plant = await this.plantRepository.findOne({
        where: { id: plantId },
      });
      if (!plant) {
        throw new Error(`Plant with ID ${plantId} not found`);
      }

      const order = this.orderRepository.create({
        userId,
        plantId,
        quantity,
        name,
        total,
        firstName,
        lastName,
        email,
        phone,
        address,
        postcode,
      });

      orders.push(order);
    }

    return await this.orderRepository.save(orders);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find();
  }

  async findOne(id: string): Promise<Order> {
    return this.orderRepository.findOne({ where: { id: id } });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    await this.orderRepository.update(id, updateOrderDto);
    return this.orderRepository.findOne({ where: { id: id } });
  }

  async remove(id: string): Promise<void> {
    await this.orderRepository.delete(id);
  }
}

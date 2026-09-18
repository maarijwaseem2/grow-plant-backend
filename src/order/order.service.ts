import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

    // Pass 1: validate stock for every line (reject over-ordering / invalid quantities)
    const validated: { plant: any; qty: number; name: string }[] = [];
    for (const { plantId, quantity, name } of plants) {
      const plant = await this.plantRepository.findOne({ where: { id: plantId } });
      if (!plant) throw new BadRequestException(`Plant with ID ${plantId} not found`);
      const qty = Number(quantity);
      if (!qty || qty < 1) {
        throw new BadRequestException(`Quantity for ${plant.name} must be at least 1.`);
      }
      const available = Number(plant.quantity ?? 0);
      if (qty > available) {
        throw new BadRequestException(
          `Only ${available} of "${plant.name}" left in stock — you asked for ${qty}.`,
        );
      }
      validated.push({ plant, qty, name });
    }

    // Pass 2: decrement stock + build orders
    const orders = [];
    for (const { plant, qty, name } of validated) {
      plant.quantity = Number(plant.quantity ?? 0) - qty;
      await this.plantRepository.save(plant);
      orders.push(
        this.orderRepository.create({
          userId,
          plantId: plant.id,
          quantity: qty,
          name,
          total,
          firstName,
          lastName,
          email,
          phone,
          address,
          postcode,
        }),
      );
    }

    return await this.orderRepository.save(orders);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getMyOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, status: string) {
    await this.orderRepository.update(id, { status });
    return this.orderRepository.findOne({ where: { id } });
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

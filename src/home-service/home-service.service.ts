import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHomeServiceDto } from './dto/create-home-service.dto';
import { UpdateHomeServiceDto } from './dto/update-home-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HomeService } from './entities/home-service.entity';
import { Repository } from 'typeorm';
import { BuyPlant } from 'src/buy-plant/entities/buy-plant.entity';
import { User } from 'src/users/entities/user.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class HomeServiceService {
  constructor(
    @InjectRepository(HomeService)
    private readonly serviceRepository: Repository<HomeService>,
    @InjectRepository(BuyPlant)
    private buyplantRepository: Repository<BuyPlant>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly realtime: RealtimeGateway,
  ) {}

  async getMyHomeServices(userId: string) {
    return this.serviceRepository.find({ where: { userId } });
  }

  // ---- Gardener workflow (home services) ----
  async assignGardener(id: string, gardenerId: string) {
    const hs = await this.serviceRepository.findOne({ where: { id } });
    if (!hs) throw new NotFoundException('Home service not found');
    if (hs.gardenerId === gardenerId) return hs; // already assigned -> no duplicate notification
    hs.gardenerId = gardenerId;
    hs.status = 'Assigned';
    await this.serviceRepository.save(hs);
    await this.notificationRepository.save({
      userId: gardenerId,
      message: `You have been assigned a new home service at ${hs.location}`,
      read: false,
    });
    this.realtime.notifyUser(gardenerId, 'notification', {
      message: `New home service at ${hs.location}`,
    });
    return { message: 'Gardener assigned and notified', data: hs };
  }

  async getGardenerTasks(gardenerId: string) {
    return this.serviceRepository.find({ where: { gardenerId } });
  }

  async updateTaskStatus(id: string, gardenerId: string, status: string) {
    const hs = await this.serviceRepository.findOne({ where: { id, gardenerId } });
    if (!hs) throw new NotFoundException('Task not found');
    hs.status = status;
    await this.serviceRepository.save(hs);
    this.realtime.notifyUser(hs.userId, 'task-updated', { id: hs.id, status });
    return { message: 'Task status updated', data: hs };
  }
  // async create(createHomeServiceDto: CreateHomeServiceDto) {
  //   const { plants, userId, total, location, address } = createHomeServiceDto;
  //   const user = await this.userRepository.findOne({ where: { id: userId } });
  //   if (!user) {
  //     throw new Error('User not found');
  //   }
  //   const plant = await this.plantRepository.findOne({
  //     where: { id: plantId },
  //   });

  //   if (!plant) {
  //     throw new Error('Plant not found');
  //   }

  //   const service = this.serviceRepository.create({
  //     location: location,
  //     address: address,
  //     plantId: plant,
  //     user,
  //   });

  //   const savedHomeService = await this.serviceRepository.save(service);
  //   return {
  //     id: savedHomeService.id,
  //     location: savedHomeService.location,
  //     address: savedHomeService.address,
  //     userId: user,
  //     plantId: plant,
  //   };
  // }

  async create(createHomeServiceDto: CreateHomeServiceDto) {
    const { plants, userId, total, address, location } = createHomeServiceDto;

    const orders = [];
    for (const { plantId, quantity, name } of plants) {
      const plant = await this.buyplantRepository.findOne({
        where: { id: plantId },
      });
      if (!plant) {
        throw new Error(`Plant with ID ${plantId} not found`);
      }

      const order = this.serviceRepository.create({
        userId,
        plantId,
        quantity,
        name,
        total,
        address,
        location,
      });

      orders.push(order);
    }

    return await this.serviceRepository.save(orders);
  }

  findAll() {
    return this.serviceRepository.find();
  }

  findOne(id: string) {
    return this.serviceRepository.findOne({ where: { id } });
  }

  update(id: string, updateHomeServiceDto: UpdateHomeServiceDto) {
    return `This action updates a #${id} homeService`;
  }

  remove(id: string) {
    return `This action removes a #${id} homeService`;
  }
}

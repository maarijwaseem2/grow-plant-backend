import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { BuyPlant } from 'src/buy-plant/entities/buy-plant.entity';
import { Notification } from '../notification/entities/notification.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(BuyPlant)
    private buyplantRepository: Repository<BuyPlant>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  private formatResponse(message: string, data: any) {
    return { message, data };
  }

  async create(
    createServiceDto: CreateServiceDto,
    file?: Express.Multer.File,
  ): Promise<{ message: string; data: Service[] }> {
    if (!file) {
      throw new InternalServerErrorException('No file uploaded');
    }

    try {
      // Parse plants array if it's a string (happens with FormData)
      let plants = createServiceDto.plants;
      if (typeof plants === 'string') {
        try {
          plants = JSON.parse(plants);
        } catch (error) {
          throw new InternalServerErrorException('Invalid plants data format');
        }
      }

      const {
        userId,
        total,
        latitude,
        longitude,
        locationName,
        isSubscription,
        subscriptionMonths,
      } = createServiceDto;

      // Convert boolean string to actual boolean
      const isSubscriptionBool = isSubscription === true;

      if (isSubscriptionBool && !subscriptionMonths) {
        throw new InternalServerErrorException(
          'Subscription months must be provided for subscription orders',
        );
      }

      const orders: Service[] = [];

      for (const { plantId, quantity, name } of plants) {
        const plant = await this.buyplantRepository.findOne({
          where: { id: plantId },
        });
        if (!plant) {
          throw new NotFoundException(`Plant with ID ${plantId} not found`);
        }

        const order = this.serviceRepository.create({
          userId,
          plantId,
          quantity,
          name: name || plant.name, // Use plant name from database as fallback
          total: Number(total),
          latitude: Number(latitude),
          longitude: Number(longitude),
          locationName,
          isSubscription: isSubscriptionBool,
          subscriptionMonths: isSubscriptionBool
            ? Number(subscriptionMonths)
            : undefined,
          image: `/uploads/${file.filename}`,
          status: 'Pending', // Default status
        });

        orders.push(order);
      }

      const savedOrders = await this.serviceRepository.save(orders);
      return this.formatResponse('Service Created Successfully', savedOrders);
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  async findAll() {
    return await this.serviceRepository.find();
  }

  async findOne(id: string) {
    const order = await this.serviceRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    const order = await this.findOne(id);
    Object.assign(order, updateServiceDto);
    return this.serviceRepository.save(order);
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    return this.serviceRepository.remove(order);
  }

  // ----------- ADMIN ASSIGN GARDENER -----------
  async assignGardener(serviceId: string, gardenerId: string) {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');

    service.gardenerId = gardenerId;
    service.status = 'Assigned';
    await this.serviceRepository.save(service);

    // Notify gardener about new task
    await this.notificationRepository.save({
      userId: gardenerId,
      message: `You have been assigned a new planting task at ${service.locationName}`,
      read: false,
    });

    return this.formatResponse('Gardener assigned and notified', service);
  }

  // ----------- GARDENER GET ASSIGNED TASKS -----------
  async getGardenerTasks(gardenerId: string) {
    return await this.serviceRepository.find({ where: { gardenerId } });
  }

  // ----------- GARDENER UPDATE TASK STATUS -----------
  async updateTaskStatus(id: string, gardenerId: string, status: string) {
    const service = await this.serviceRepository.findOne({
      where: { id, gardenerId },
    });
    if (!service) throw new NotFoundException('Task not found');

    service.status = status;
    await this.serviceRepository.save(service);

    // Optional: Notify admin or customer about status update here

    return this.formatResponse('Task status updated', service);
  }
}

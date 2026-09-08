import { Injectable } from '@nestjs/common';
import { CreateHomeServiceDto } from './dto/create-home-service.dto';
import { UpdateHomeServiceDto } from './dto/update-home-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HomeService } from './entities/home-service.entity';
import { Repository } from 'typeorm';
import { BuyPlant } from 'src/buy-plant/entities/buy-plant.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class HomeServiceService {
  constructor(
    @InjectRepository(HomeService)
    private readonly serviceRepository: Repository<HomeService>,
    @InjectRepository(BuyPlant)
    private buyplantRepository: Repository<BuyPlant>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}
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
    return `This action returns all homeService`;
  }

  findOne(id: string) {
    return `This action returns a #${id} homeService`;
  }

  update(id: string, updateHomeServiceDto: UpdateHomeServiceDto) {
    return `This action updates a #${id} homeService`;
  }

  remove(id: string) {
    return `This action removes a #${id} homeService`;
  }
}

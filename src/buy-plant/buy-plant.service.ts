import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBuyPlantDto } from './dto/create-buy-plant.dto';
import { UpdateBuyPlantDto } from './dto/update-buy-plant.dto';
import { BuyPlant } from './entities/buy-plant.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BuyPlantService {
  constructor(
    @InjectRepository(BuyPlant)
    private readonly plantRepository: Repository<BuyPlant>,
  ) {}

  private formatResponse(message: string, data: any) {
    return { message, data };
  }

  async create(
    createBuyPlantDto: CreateBuyPlantDto,
    file?: Express.Multer.File,
  ): Promise<{ message: string; data: BuyPlant }> {
    try {
      console.log(
        'Service - Create DTO:',
        JSON.stringify(createBuyPlantDto, null, 2),
      );
      console.log('Service - File:', file);

      const newPlant = this.plantRepository.create({
        name: createBuyPlantDto.name,
        price: createBuyPlantDto.price,
        quantity: createBuyPlantDto.quantity,
        description: createBuyPlantDto.description,
        category: createBuyPlantDto.category,
        // prefer a base64 image in the body (persists in DB); else an uploaded file name
        image:
          typeof createBuyPlantDto.image === 'string' && createBuyPlantDto.image
            ? createBuyPlantDto.image
            : file
              ? file.filename
              : null,
      });

      const savedPlant = await this.plantRepository.save(newPlant);
      return this.formatResponse('Plant created successfully', savedPlant);
    } catch (error) {
      console.error('Create Plant Error:', error);
      throw new InternalServerErrorException(
        `Failed to create plant: ${error}`,
      );
    }
  }
  // // Get all plants
  async findAll(page?: string, limit?: string): Promise<any> {
    try {
      const wantsPage = page !== undefined || limit !== undefined;
      // hard cap protects the API from a request pulling the whole table
      const take = Math.min(Number(limit) || (wantsPage ? 12 : 200), 200);
      const currentPage = Math.max(Number(page) || 1, 1);
      const skip = (currentPage - 1) * take;
      const [plants, total] = await this.plantRepository.findAndCount({
        take,
        skip,
        order: { id: 'ASC' },
      });
      return {
        ...this.formatResponse('Plants retrieved successfully', plants),
        pagination: {
          total,
          page: currentPage,
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch plants');
    }
  }

  // // Get plant by ID
  async findOne(id: string): Promise<{ message: string; data: BuyPlant }> {
    try {
      const plant = await this.plantRepository.findOne({
        where: { id },
      });
      if (!plant) {
        throw new NotFoundException('Plant not found');
      }
      return this.formatResponse('Plant retrieved successfully', plant);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch plant');
    }
  }

  // Update plant details
  async update(
    id: string,
    updateBuyPlantDto: UpdateBuyPlantDto,
    file: Express.Multer.File,
  ): Promise<{ message: string; data: BuyPlant }> {
    try {
      const plant = await this.plantRepository.findOne({ where: { id } });
      if (!plant) {
        throw new NotFoundException('Plant not found');
      }

      // Update plant properties
      plant.name = updateBuyPlantDto.name;
      plant.price = updateBuyPlantDto.price;
      plant.quantity = updateBuyPlantDto.quantity;
      plant.description = updateBuyPlantDto.description;
      plant.category = updateBuyPlantDto.category;

      // base64 image in the body wins; else an uploaded file
      if (typeof updateBuyPlantDto.image === 'string' && updateBuyPlantDto.image) {
        plant.image = updateBuyPlantDto.image;
      } else if (file) {
        plant.image = file.filename;
      }

      const updatedPlant = await this.plantRepository.save(plant);
      return this.formatResponse('Plant updated successfully', updatedPlant);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update plant');
    }
  }

  // Delete plant by ID
  async remove(id: string): Promise<{ message: string }> {
    try {
      const plant = await this.plantRepository.findOne({ where: { id } });
      if (!plant) {
        throw new NotFoundException('Plant not found');
      }

      await this.plantRepository.remove(plant);
      return this.formatResponse('Plant deleted successfully', null);
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete plant');
    }
  }

    async reserveStock(id: string, quantity: number): Promise<boolean> {
    const plant = await this.plantRepository.findOne({ where: { id } });
    if (!plant || plant.quantity < quantity) {
      return false;
    }
    plant.quantity -= quantity;
    plant.reservedQuantity += quantity;
    await this.plantRepository.save(plant); // Save changes
    return true;
  }

  async releaseStock(id: string, quantity: number): Promise<boolean> {
    const plant = await this.plantRepository.findOne({ where: { id } });
    if (!plant || plant.reservedQuantity < quantity) {
      return false;
    }
    plant.quantity += quantity;
    plant.reservedQuantity -= quantity;
    await this.plantRepository.save(plant); // Save changes
    return true;
  }

  async purchaseStock(id: string, quantity: number): Promise<boolean> {
    const plant = await this.plantRepository.findOne({ where: { id } });
    if (!plant || plant.reservedQuantity < quantity) {
      return false;
    }
    plant.reservedQuantity -= quantity;
    await this.plantRepository.save(plant); // Save changes
    return true;
  }
}

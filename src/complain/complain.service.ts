import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateComplainDto } from './dto/create-complain.dto';
import { UpdateComplainDto } from './dto/update-complain.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Complain } from './entities/complain.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ComplainService {
  constructor(
    @InjectRepository(Complain)
    private readonly complainRepository: Repository<Complain>,
  ) {}

  private formatResponse(message: string, data: any) {
    return { message, data };
  }
  async create(createComplainDto: CreateComplainDto,
    file?: Express.Multer.File,): Promise<{ message: string; data: Complain }>  {
      if (!file) {
        throw new InternalServerErrorException('No file uploaded');
      }
      try {
        const newReport = this.complainRepository.create({
          userId: createComplainDto.userId,
          fullname: createComplainDto.fullname,
          phoneNumber: createComplainDto.phoneNumber,
          cnic: createComplainDto.cnic,
          address: createComplainDto.address,
          image: file ? file.filename : null, // Handle case when no file is uploaded
        });
  
        const savedReport = await this.complainRepository.save(newReport);
        return this.formatResponse('Report created successfully', savedReport);
      } catch (error) {
        throw new InternalServerErrorException(
          `Failed to create Report: ${error}`,
        );
      }
    }

  async findAll(): Promise<{ message: string; data: Complain[] }> {
    try {
      const report = await this.complainRepository.find();
      return this.formatResponse("Report Generate Successfully",report)
    }catch (error) {
      throw new InternalServerErrorException('Failed to fetch Report');
    }
  }

  async findOne(id: string): Promise<{ message: string; data: Complain }>  {
    try {
      const report = await this.complainRepository.findOne({
        where: { id },
      });
      if (!report) {
        throw new NotFoundException('report not found');
      }
      return this.formatResponse('Report Generate successfully', report);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch Report');
    }  
  }

  async update(id: string, updateComplainDto: UpdateComplainDto,file: Express.Multer.File,
    ): Promise<{ message: string; data: Complain }> {
      try {
        const report = await this.complainRepository.findOne({ where: { id } });
        if (!report) {
          throw new NotFoundException('report not found');
        }
  
        // Update report properties
        report.fullname = updateComplainDto.fullname;
        report.phoneNumber = updateComplainDto.phoneNumber;
        report.cnic = updateComplainDto.cnic;
        report.address = updateComplainDto.address;
  
        // If a file is provided, update the image
        if (file) {
          report.image = file.filename;
        }
  
        const updateReport = await this.complainRepository.save(report);
        return this.formatResponse('Report updated successfully', updateReport);
      } catch (error) {
        throw new InternalServerErrorException('Failed to update report');
      }  }

  async remove(id: string) : Promise<{ message: string }> {
    try {
      const report = await this.complainRepository.findOne({ where: { id } });
      if (!report) {
        throw new NotFoundException('report not found');
      }

      await this.complainRepository.remove(report);
      return this.formatResponse('Report deleted successfully', null);
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete Report');
    }
  }
}

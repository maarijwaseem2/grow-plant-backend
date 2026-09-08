import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from './entities/donation.entity';
import { CreateDonationDto } from './dto/create-donation.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DonationService {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createDonationDto: CreateDonationDto): Promise<Donation> {
    const { userId, quantity, total } = createDonationDto;

    // Validate plant quantity
    if (quantity < 1 || quantity > 100) {
      throw new BadRequestException(
        'Plant quantity must be between 1 and 100.',
      );
    }

    const donation = this.donationRepository.create({
      userId,
      quantity,
      total,
    });

    return this.donationRepository.save(donation);
  }

  async findAll(): Promise<Donation[]> {
    return this.donationRepository.find();
  }
}

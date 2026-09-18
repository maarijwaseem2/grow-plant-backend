import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { validate } from 'class-validator';
import { ValidationError } from 'class-validator';
import { UpdateUserDto } from './dto/update-user.dto';
import { errorMessages, userMessages } from 'src/shared/constant/constant';
import { UserRole } from './userRole.enum';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private formatResponse(message: string, data: any) {
    return { message, data };
  }

  async signup(
    createUserDto: CreateUserDto,
  ): Promise<{ message: string; data: any }> {
    try {
      const userDto = Object.assign(new CreateUserDto(), createUserDto);

      const errors: ValidationError[] = await validate(userDto);
      if (errors.length > 0) {
        const errorMessage = errors
          .map((error) => Object.values(error.constraints || {}))
          .join(', ');
        throw new BadRequestException(
          this.formatResponse(errorMessages.failed, errorMessage),
        );
      }
      // Check repassword match
      if (createUserDto.password !== createUserDto.rePassword) {
        throw new BadRequestException(
          this.formatResponse(
            errorMessages.passwordMismatch,
            'Passwords do not match.',
          ),
        );
      }

      // Check if username already exists
      const existingUsername = await this.userRepository.findOne({
        where: { username: createUserDto.username },
      });
      if (existingUsername) {
        throw new BadRequestException(
          this.formatResponse(
            errorMessages.invalidInput,
            'Username already exists.',
          ),
        );
      }

      const existingUser = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingUser) {
        const errorMessage = errorMessages.invalidInput;
        throw new BadRequestException(
          this.formatResponse(
            errorMessages.invalidEmail,
            'Email already exists.',
          ),
        );
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const newUser = this.userRepository.create({
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role,
        mobile: createUserDto.mobile,
        province: createUserDto.province,
        city: createUserDto.city,
        nic: createUserDto.nic,
        address: createUserDto.address,
        bikeDetails: createUserDto.bikeDetails,
      });

      const savedUser = await this.userRepository.save(newUser);

      const firstWithId = await this.userRepository.findOne({
        where: { id: savedUser.id },
      });
      return this.formatResponse(userMessages.userCreate, {
        User: {
          id: firstWithId.id,
          username: firstWithId.username,
          email: firstWithId.email,
          role: firstWithId.role,
        },
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Something went wrong.');
    }
  }
  async findOne(criteria: Partial<User>) {
    return this.userRepository.findOne({ where: criteria });
  }

  // User Get All
  async getAllUsers(): Promise<{ message: string; data: User[] }> {
    const users = await this.userRepository.find({
      select: ['id', 'username', 'email', 'role'],
    });
    return this.formatResponse(userMessages.allDetail, users);
  }

  // Server-side guard so private details (CNIC/phone/address) never leak.
  private validateImage(dataUrl: string) {
    if (!dataUrl) return;
    if (!/^data:image\/(png|jpe?g|webp|gif);base64,/.test(dataUrl)) {
      throw new BadRequestException('Profile image must be a PNG, JPG, WEBP or GIF.');
    }
    const b64 = dataUrl.split(',')[1] || '';
    const bytes = Math.floor(b64.length * 0.75);
    if (bytes > 2 * 1024 * 1024) {
      throw new BadRequestException('Profile image must be under 2 MB.');
    }
  }

  // User get only 1 — full detail only for the owner or an admin; otherwise a
  // safe public subset (no email / phone / CNIC / address).
  async getUserById(
    id: string,
    requesterId?: string,
    requesterRole?: string,
  ): Promise<{ message: string; data: any }> {
    const user = await this.userRepository.findOne({ where: { id: id } });
    if (!user) {
      const errorMessage = errorMessages.userNotFound;
      throw new BadRequestException(
        this.formatResponse(errorMessage, errorMessage),
      );
    }
    const isSelf = !!requesterId && requesterId === id;
    const isAdmin = requesterRole === 'Admin';
    if (isSelf || isAdmin) {
      return this.formatResponse(userMessages.detailById, {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        province: user.province,
        city: user.city,
        nic: user.nic,
        address: user.address,
        bikeDetails: user.bikeDetails,
        bikeName: user.bikeName,
        bikeNumber: user.bikeNumber,
        image: user.image,
        experience: user.experience,
        services: user.services,
        approved: user.approved,
      });
    }
    // public view — no private contact details
    return this.formatResponse(userMessages.detailById, {
      id: user.id,
      username: user.username,
      role: user.role,
      city: user.city,
      image: user.image,
      experience: user.experience,
      services: user.services,
      approved: user.approved,
    });
  }

  // User update all detail except password
  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{ message: string; data: any }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      const errorMessage = errorMessages.userNotFound;
      throw new BadRequestException(
        this.formatResponse(errorMessage, errorMessage),
      );
    }

    const updatedFields: Partial<User> = {};

    if (updateUserDto.username) {
      updatedFields.username = updateUserDto.username;
    }
    if (updateUserDto.email) {
      if (updateUserDto.email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: updateUserDto.email },
        });
        if (existingUser) {
          throw new ConflictException(errorMessages.invalidInput);
        }
      }
      updatedFields.email = updateUserDto.email;
    }
    if (updateUserDto.password) {
      updatedFields.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    if (updateUserDto.mobile !== undefined) updatedFields.mobile = updateUserDto.mobile;
    if (updateUserDto.province !== undefined) updatedFields.province = updateUserDto.province;
    if (updateUserDto.city !== undefined) updatedFields.city = updateUserDto.city;
    if (updateUserDto.nic !== undefined) updatedFields.nic = updateUserDto.nic;
    if (updateUserDto.address !== undefined) updatedFields.address = updateUserDto.address;
    if (updateUserDto.bikeDetails !== undefined) updatedFields.bikeDetails = updateUserDto.bikeDetails;
    if (updateUserDto.bikeName !== undefined) updatedFields.bikeName = updateUserDto.bikeName;
    if (updateUserDto.bikeNumber !== undefined) updatedFields.bikeNumber = updateUserDto.bikeNumber;
    if (updateUserDto.image !== undefined) { this.validateImage(updateUserDto.image); updatedFields.image = updateUserDto.image; }
    if (updateUserDto.experience !== undefined) updatedFields.experience = updateUserDto.experience;
    if (updateUserDto.services !== undefined) updatedFields.services = updateUserDto.services;
    if (Object.keys(updatedFields).length > 0) {
      await this.userRepository.update(id, updatedFields);
    }
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    return this.formatResponse(userMessages.userUpdate, {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      mobile: updatedUser.mobile,
      province: updatedUser.province,
      city: updatedUser.city,
      nic: updatedUser.nic,
      address: updatedUser.address,
      bikeDetails: updatedUser.bikeDetails,
      bikeName: updatedUser.bikeName,
      bikeNumber: updatedUser.bikeNumber,
      image: updatedUser.image,
      experience: updatedUser.experience,
      services: updatedUser.services,
      approved: updatedUser.approved,
    });
  }

  // User delete account
  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      const errorMessage = errorMessages.userNotFound;
      throw new BadRequestException(
        this.formatResponse(errorMessage, errorMessage),
      );
    }
    await this.userRepository.remove(user);
    return this.formatResponse(userMessages.userDelete, {});
  }

  // ---- Gardener approval + listing ----
  async setGardenerApproval(id: string, approved: boolean) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new BadRequestException(errorMessages.userNotFound);
    if (String(user.role) !== 'Gardener') {
      throw new BadRequestException('Only gardener accounts can be approved.');
    }
    user.approved = approved;
    await this.userRepository.save(user);
    return this.formatResponse('Gardener approval updated', {
      id: user.id,
      username: user.username,
      approved: user.approved,
    });
  }

  // Public: approved gardeners only, with NO private contact details
  async listApprovedGardeners() {
    const gardeners = await this.userRepository.find({
      where: { role: UserRole.Gardener, approved: true },
    });
    return gardeners.map((g) => ({
      id: g.id,
      username: g.username,
      image: g.image,
      experience: g.experience,
      services: g.services,
      city: g.city,
    }));
  }

  // Admin: every gardener with full detail + approval status (for review)
  async listAllGardeners() {
    const gardeners = await this.userRepository.find({
      where: { role: UserRole.Gardener },
      order: { approved: 'ASC' },
    });
    return gardeners.map((g) => ({
      id: g.id,
      username: g.username,
      email: g.email,
      mobile: g.mobile,
      city: g.city,
      nic: g.nic,
      address: g.address,
      bikeDetails: g.bikeDetails,
      bikeName: g.bikeName,
      bikeNumber: g.bikeNumber,
      image: g.image,
      experience: g.experience,
      services: g.services,
      approved: g.approved,
    }));
  }

}

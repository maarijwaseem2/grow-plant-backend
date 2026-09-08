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

  // User get only 1
  async getUserById(id: string): Promise<{ message: string; data: any }> {
    const user = await this.userRepository.findOne({ where: { id: id } });
    if (!user) {
      const errorMessage = errorMessages.userNotFound;
      throw new BadRequestException(
        this.formatResponse(errorMessage, errorMessage),
      );
    }
    return this.formatResponse(userMessages.detailById, {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
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
    await this.userRepository.update(id, updatedFields);
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    return this.formatResponse(userMessages.userUpdate, {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
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
}

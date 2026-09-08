import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Patch,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './userRole.enum';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // User Signup
  @Post()
  async signup(@Body() createUserDto: CreateUserDto) {
    const existingAdmin = await this.userService.findOne({ role: UserRole.Admin });
    if (createUserDto.role === 'Admin' && existingAdmin) {
        throw new BadRequestException('Admin already exists. Only one admin is allowed.');
    }
    return await this.userService.signup(createUserDto);
  }

  // User Get All
  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  // User Get Only 1
  @Get(':id')
  async getUserById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.userService.getUserById(id);
  }

  // User Update all detail except password
  @Patch(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  // User delete your account
  @Delete(':id')
  async deleteUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userService.deleteUser(id);
  }
}

import { Controller, Post, Delete, Get, Body, Param, Patch, ParseUUIDPipe, BadRequestException, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';
import { AdminGuard } from 'src/shared/guards/admin.guard';
import { UserRole } from './userRole.enum';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // User Signup
  @Post()
  async signup(@Body() createUserDto: CreateUserDto) {
    // Admin accounts must never be creatable through the public signup
    // endpoint. Previously the first person to POST role=Admin simply became
    // the admin, so any visitor could claim the admin seat. The admin is now
    // seeded directly in the database (or by an existing admin) instead.
    if (createUserDto.role === UserRole.Admin) {
      throw new BadRequestException(
        'Admin accounts cannot be self-registered.',
      );
    }
    return await this.userService.signup(createUserDto);
  }

  // User Get All
  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  // Public: approved gardeners (shown to customers when booking). MUST be before :id
  @Get('gardeners')
  async listApprovedGardeners() {
    return this.userService.listApprovedGardeners();
  }

  // Admin: all gardeners with approval status. MUST be before :id
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('gardeners/all')
  async listAllGardeners() {
    return this.userService.listAllGardeners();
  }

  // User Get Only 1 (auth required; private fields only for self/admin)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req,
  ) {
    return await this.userService.getUserById(id, req.user.id, req.user.role);
  }

  // Admin: approve / unapprove a gardener
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/approve')
  async approveGardener(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { approved?: boolean },
  ) {
    return this.userService.setGardenerApproval(id, body?.approved ?? true);
  }

  // User Update all detail except password
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    if (req.user.id !== id && req.user.role !== 'Admin') {
      throw new ForbiddenException('You can only update your own profile.');
    }
    return this.userService.updateUser(id, updateUserDto);
  }

  // User delete your account
  @Delete(':id')
  async deleteUser(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userService.deleteUser(id);
  }
}

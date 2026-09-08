import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../shared/guards/jwt.guard';
import { AdminGuard } from 'src/shared/guards/admin.guard';
// import { ChangePasswordDto } from './dto/change-password.dto';
// import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post()
  async login(@Body() loginUserDto: LoginUserDto) {
    return await this.authService.login(loginUserDto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('dashboard')
  getDashboard(@Request() req) {
    const user = req.user;
    return { message: 'Admin dashboard data: ', data: user };
  }

  //   @Post('/change-password')
  //   @UseGuards(AuthGuard) // Protect this route with AuthGuard
  //   async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
  //     return this.authService.changePassword(
  //       changePasswordDto.userId,
  //       changePasswordDto.oldPassword,
  //       changePasswordDto.newPassword,
  //     );
  //   }
  //   @Post('forgot-password')
  //   async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
  //     return this.authService.forgotPassword(forgotPasswordDto.email);
  //   }
  // }
}

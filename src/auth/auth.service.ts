import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { errorMessages, userMessages } from 'src/shared/constant/constant';
// import { ResetToken } from './entities/reset-token.entity';
// import { MailService } from 'src/services/mail.service';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
    //     @InjectRepository(ResetToken)
    //     private resetTokenRepository: Repository<ResetToken>,
    //     private jwtService: JwtService,
    //     private mailService: MailService,
  ) {}
  private formatResponse(message: string, data: any) {
    return { message, data };
  }
  // User Login
  async login(loginUserDto: LoginUserDto): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email: loginUserDto.email },
    });
    if (!user) {
      const errorMessage = errorMessages.invalidEmail;
      throw new UnauthorizedException(
        this.formatResponse(errorMessage, errorMessage),
      );
    }
    const passwordMatch = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );
    if (!passwordMatch || !user) {
      const errorMessage = errorMessages.invalidPassword;
      throw new UnauthorizedException(
        this.formatResponse(errorMessage, errorMessage),
      );
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);
    return this.formatResponse(userMessages.userAuthenticated, {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { ...result } = user;
      return result;
    }
    const errorMessage = errorMessages.invalidAuth;
    throw new UnauthorizedException(
      this.formatResponse(errorMessage, errorMessage),
    );
  }
}

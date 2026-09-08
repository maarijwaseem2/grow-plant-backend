import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyNotifications(@Request() req) {
    return this.notificationService.getUserNotifications(req.user.id);
  }
}
import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ContactService } from './contact.service';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';
import { AdminGuard } from 'src/shared/guards/admin.guard';

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  // Public: anyone can send a message
  @Post()
  create(@Body() dto: { name: string; email: string; subject?: string; message: string }) {
    return this.contact.create(dto);
  }

  // Admin: view + mark handled
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll() {
    return this.contact.findAll();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/handled')
  markHandled(@Param('id') id: string) {
    return this.contact.markHandled(id);
  }
}

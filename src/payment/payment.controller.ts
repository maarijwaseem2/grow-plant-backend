import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt.guard';
import { AdminGuard } from 'src/shared/guards/admin.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Legacy gateway endpoint (coming soon)
  @Post()
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.processPayment(createPaymentDto);
  }

  // User submits a manual payment (EasyPaisa/JazzCash/bank) for admin approval
  @UseGuards(JwtAuthGuard)
  @Post('manual')
  async submitManual(@Body() body: any, @Request() req) {
    return this.paymentsService.submitManualPayment({
      ...body,
      userId: req.user.id,
    });
  }

  // The logged-in user's own payments
  @UseGuards(JwtAuthGuard)
  @Get('my')
  async myPayments(@Request() req) {
    return this.paymentsService.getMyPayments(req.user.id);
  }

  // Admin: list all payments
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  async findAll() {
    return this.paymentsService.findAll();
  }

  // Admin: approve / reject a payment (notifies the user)
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/approve')
  async approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.approvePayment(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/reject')
  async reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.rejectPayment(id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }
}

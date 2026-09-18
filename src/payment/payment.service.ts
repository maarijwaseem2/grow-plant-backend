import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as QRCode from 'qrcode';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/userRole.enum';
import { Notification } from '../notification/entities/notification.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import * as nodemailer from 'nodemailer';

@Injectable()
export class PaymentsService {
  private transporter: any;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly realtime: RealtimeGateway,
  ) {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  async processPayment(createPaymentDto: CreatePaymentDto) {
    const {
      paymentMethod,
      amount,
      cardToken,
      phone,
      bankAccountNumber,
      email,
      name,
      userId,
    } = createPaymentDto;

    let result: any;

    switch (paymentMethod) {
      case 'jazzcash':
        result = await this.processJazzCashPayment(amount, phone);
        break;
      case 'easypaisa':
        result = await this.processEasyPaisaPayment(amount, phone);
        break;
      case 'sadapay':
        result = await this.processSadaPayPayment(amount, phone);
        break;
      case 'bank':
        result = await this.processBankTransfer(amount, bankAccountNumber);
        break;
      default:
        result = { status: 'failure', message: 'Invalid payment method' };
    }

    if (result.status === 'success') {
      // Save payment record
      const payment = this.paymentRepository.create({
        amount,
        paymentMethodId: result.paymentMethodId || paymentMethod,
        phone,
        status: result.status,
        userId, // Store user ID if provided
      });
      await this.paymentRepository.save(payment);

      // Send confirmation email if email is provided
      if (email) {
        await this.sendPaymentConfirmationEmail(
          email,
          name,
          amount,
          payment.id,
          paymentMethod,
        );
      }
    }

    return result;
  }

  async sendPaymentConfirmationEmail(
    email: string,
    name: string,
    amount: number,
    paymentId: string,
    paymentMethod: string,
  ) {
    try {
      const date = new Date().toLocaleDateString();
      const mailOptions = {
        from: this.configService.get('EMAIL_USER'),
        to: email,
        subject: 'Payment Confirmation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
            <div style="background: linear-gradient(to right, #fcdfeb, #8df19c); padding: 15px; border-radius: 5px 5px 0 0;">
              <h2 style="color: #00000; margin: 0; text-align: center;">Payment Confirmation</h2>
            </div>
            <div style="padding: 20px;">
              <p>Dear ${name || 'Customer'},</p>
              <p>Thank you for your payment. Your transaction has been processed successfully.</p>
              <div style="background-color: #f9f9f9; border-radius: 5px; padding: 15px; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>Payment Details:</strong></p>
                <p style="margin: 5px 0;">Amount: Rs.${amount}</p>
                <p style="margin: 5px 0;">Payment Method: ${paymentMethod}</p>
                <p style="margin: 5px 0;">Transaction ID: ${paymentId}</p>
                <p style="margin: 5px 0;">Date: ${date}</p>
              </div>
              <p>If you have any questions regarding this payment, please contact our support team.</p>
              <p>Thank you for your business!</p>
              <p style="margin-top: 20px;">Regards,<br>Grow Green</p>
            </div>
            <div style="background-color: #f5f5f5; padding: 10px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; color: #666;">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Payment confirmation email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending payment confirmation email:', error);
      return false;
    }
  }

  // JazzCash payment
  async processJazzCashPayment(amount: number, phone: string) {
    try {
      const response = await axios.post(
        'https://sandbox.jazzcash.com.pk/paymentApi',
        {
          merchant_id: this.configService.get('JAZZCASH_MERCHANT_ID'),
          amount,
          phone,
        },
      );
      return {
        status: 'success',
        message: 'JazzCash payment processed',
        data: response.data,
      };
    } catch (error) {
      return { status: 'failure', message: 'JazzCash payment failed', error };
    }
  }

  // EasyPaisa payment
  async processEasyPaisaPayment(amount: number, phone: string) {
    try {
      const response = await axios.post('https://easypaisa-api-url.com', {
        secret_key: this.configService.get('EASYPAY_SECRET_KEY'),
        amount,
        phone,
      });
      return {
        status: 'success',
        message: 'EasyPaisa payment processed',
        data: response.data,
      };
    } catch (error) {
      return { status: 'failure', message: 'EasyPaisa payment failed', error };
    }
  }

  // SadaPay payment
  async processSadaPayPayment(amount: number, phone: string) {
    // Implement SadaPay API request logic here
    return { status: 'success', message: 'SadaPay payment processed', amount };
  }

  // Bank transfer
  async processBankTransfer(amount: number, bankAccountNumber: string) {
    // Implement bank transfer logic here
    return { status: 'success', message: 'Bank transfer processed', amount };
  }

  // QR Code processing
  async processQRCode(qrCodeData: string) {
    // Generate QR code
    const qrCode = await QRCode.toDataURL(qrCodeData);
    return { status: 'success', message: 'QR Code generated', qrCode };
  }

  async findAll() {
    return await this.paymentRepository.find({ order: { createdAt: 'DESC' } });
  }

  // ---- Manual payment approval flow ----
  async submitManualPayment(dto: any) {
    const payment = this.paymentRepository.create({
      amount: dto.amount,
      method: dto.method,
      reference: dto.reference,
      phone: dto.phone,
      userId: dto.userId,
      status: 'Pending',
    });
    const saved = await this.paymentRepository.save(payment);
    const admins = await this.userRepository.find({ where: { role: UserRole.Admin } });
    for (const admin of admins) {
      await this.notificationRepository.save({
        userId: admin.id,
        message: `New payment of Rs ${dto.amount} via ${dto.method} is awaiting approval.`,
        read: false,
      });
      this.realtime.notifyUser(admin.id, 'notification', {
        message: 'New payment awaiting approval',
      });
    }
    return { message: 'Payment submitted for approval', data: saved };
  }

  async approvePayment(id: string) {
    const p = await this.paymentRepository.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Payment not found');
    p.status = 'Approved';
    await this.paymentRepository.save(p);
    if (p.userId) {
      await this.notificationRepository.save({
        userId: p.userId,
        message: `Your payment of Rs ${p.amount} has been approved. Thank you!`,
        read: false,
      });
      this.realtime.notifyUser(p.userId, 'notification', { message: 'Payment approved' });
    }
    return { message: 'Payment approved', data: p };
  }

  async rejectPayment(id: string) {
    const p = await this.paymentRepository.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Payment not found');
    p.status = 'Rejected';
    await this.paymentRepository.save(p);
    if (p.userId) {
      await this.notificationRepository.save({
        userId: p.userId,
        message: `Your payment of Rs ${p.amount} was rejected. Please contact support.`,
        read: false,
      });
      this.realtime.notifyUser(p.userId, 'notification', { message: 'Payment rejected' });
    }
    return { message: 'Payment rejected', data: p };
  }

  async getMyPayments(userId: string) {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return await this.paymentRepository.findOne({ where: { id } });
  }
}

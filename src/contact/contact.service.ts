import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './entities/contact.entity';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly repo: Repository<ContactMessage>,
  ) {}

  async create(dto: { name: string; email: string; subject?: string; message: string }) {
    const saved = await this.repo.save(this.repo.create({ ...dto, handled: false }));
    return { message: 'Thanks! We received your message and will reply by email.', data: saved };
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async markHandled(id: string) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Message not found');
    c.handled = true;
    await this.repo.save(c);
    return { message: 'Marked as handled', data: c };
  }
}

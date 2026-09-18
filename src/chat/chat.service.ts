import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from '../users/entities/user.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly repo: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly realtime: RealtimeGateway,
  ) {}

  /**
   * "AI" safety filter: blocks phone numbers so gardener/customer can't take the
   * deal off-platform. Allows small numbers (prices, quantities) but catches any
   * run of 7+ digits or a Pakistani mobile pattern, even when spaced/dashed.
   */
  private containsPhone(text: string): boolean {
    if (!text) return false;
    const compact = text.replace(/[\s\-().]/g, '');
    if (/(\+?92|0)?3\d{9}/.test(compact)) return true; // 03xxxxxxxxx / +923xxxxxxxxx
    if (/\d{7,}/.test(compact)) return true; // any long digit run
    // spaced-out digits like "0 3 0 0 ..." — count digits overall
    const digitCount = (text.match(/\d/g) || []).length;
    if (digitCount >= 8) return true;
    return false;
  }

  async sendMessage(
    senderId: string,
    senderRole: string,
    dto: { toUserId: string; type?: string; content: string },
  ) {
    const type = dto.type || 'text';
    if (type === 'text' && this.containsPhone(dto.content)) {
      throw new BadRequestException(
        "For your safety, phone numbers can't be shared in chat. Please coordinate through Go Green — we've got you covered.",
      );
    }
    const customerId = senderRole === 'Customer' ? senderId : dto.toUserId;
    const gardenerId = senderRole === 'Gardener' ? senderId : dto.toUserId;
    const msg = this.repo.create({
      customerId,
      gardenerId,
      senderId,
      senderRole,
      type,
      content: dto.content,
    });
    const saved = await this.repo.save(msg);
    // push live to the recipient (they've joined their user room via the socket)
    this.realtime.notifyUser(dto.toUserId, 'chat-message', saved);
    return saved;
  }

  async getConversation(meId: string, otherId: string) {
    return this.repo.find({
      where: [
        { customerId: meId, gardenerId: otherId },
        { customerId: otherId, gardenerId: meId },
      ],
      order: { createdAt: 'ASC' },
    });
  }

  async getMyConversations(meId: string, meRole: string) {
    const where = meRole === 'Gardener' ? { gardenerId: meId } : { customerId: meId };
    const rows = await this.repo.find({ where, order: { createdAt: 'DESC' } });
    const map = new Map<string, any>();
    for (const m of rows) {
      const otherId = meRole === 'Gardener' ? m.customerId : m.gardenerId;
      if (!map.has(otherId)) {
        map.set(otherId, {
          otherId,
          lastMessage: m.type === 'text' ? m.content : `[${m.type}]`,
          lastAt: m.createdAt,
        });
      }
    }
    const convos = Array.from(map.values());
    // attach names in ONE query (was N+1 before)
    const otherIds = convos.map((c) => c.otherId);
    if (otherIds.length > 0) {
      const users = await this.users.find({ where: { id: In(otherIds) } });
      const nameById = new Map(users.map((u) => [u.id, u.username]));
      for (const c of convos) c.otherName = nameById.get(c.otherId) || 'User';
    }
    return convos;
  }

}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Index(['customerId'])
@Index(['gardenerId'])
@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  gardenerId: string;

  @Column()
  senderId: string;

  @Column()
  senderRole: string; // 'Customer' | 'Gardener'

  @Column({ default: 'text' })
  type: string; // text | voice | location

  @Column({ type: 'text' })
  content: string; // text, base64 audio (voice), or "lat,lng" (location)

  @CreateDateColumn()
  createdAt: Date;
}

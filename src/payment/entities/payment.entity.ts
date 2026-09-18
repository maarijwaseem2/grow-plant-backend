import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Index(['userId'])
@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  paymentMethodId: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  method: string; // easypaisa / jazzcash / bank

  @Column({ nullable: true })
  reference: string; // transaction ID / proof reference

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

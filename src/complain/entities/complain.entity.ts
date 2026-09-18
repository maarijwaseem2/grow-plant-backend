import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Complain {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;
  
  @Column()
  fullname: string;

  @Column()
  phoneNumber: number;

  @Column()
  cnic: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'text', nullable: true })
  complaintDetails: string;

  @CreateDateColumn()
  createdAt: Date;
}

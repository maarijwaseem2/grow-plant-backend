import { BuyPlant } from 'src/buy-plant/entities/buy-plant.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';

@Index(['userId'])
@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  plantId: string;

  @Column()
  quantity: number;

  @Column()
  name: string;

  @Column('decimal')
  total: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column({ length: 15, nullable: true })
  phone: string;

  @Column('text', { nullable: true })
  address: string;

  @Column({ length: 10, nullable: true })
  postcode: string;

  @Column({ default: 'Pending' })
  status: string; // Pending -> Confirmed -> Dispatched -> Delivered

  @CreateDateColumn()
  createdAt: Date;

  // @ManyToOne(() => User, (user) => user.order)
  // user: User;

  // @ManyToOne(() => BuyPlant, (buyPlant)=> buyPlant.orders, {eager:true})
  // @JoinColumn({ name: 'plantId' })
  // plant: BuyPlant;
}

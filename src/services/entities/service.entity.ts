import { BuyPlant } from 'src/buy-plant/entities/buy-plant.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Index } from 'typeorm';

@Index(['userId'])
@Entity()
export class Service {
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

  @Column('float')
  latitude: number;

  @Column('float')
  longitude: number;

  @Column({ type: 'varchar', length: 255 })
  locationName: string;

  @Column({ default: false })
  isSubscription: boolean;

  @Column({ nullable: true })
  subscriptionMonths: number;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  gardenerId: string; // Assigned gardener

  @Column({ default: 'Pending' })
  status: string; // Pending, Assigned, In Progress, Completed

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => BuyPlant, (plant) => plant.services, {
    eager: true,
    onDelete: 'CASCADE',
  })
  plant: BuyPlant;
}

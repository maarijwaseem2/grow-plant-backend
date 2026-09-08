import { BuyPlant } from 'src/buy-plant/entities/buy-plant.entity';
import { User } from 'src/users/entities/user.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity()
export class HomeService {
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
  location: string;

  @Column()
  address: string;

  // @ManyToOne(() => BuyPlant, (plant) => plant.services)
  // plantId: BuyPlant;

  @ManyToOne(() => User, (user) => user.homeServices)
  user: User;
}

import { Service } from 'src/services/entities/service.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { PlantCategory } from '../dto/create-buy-plant.dto';

@Entity()
export class BuyPlant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column()
  quantity: number;

  @Column()
  description: string;

  @Column('int', { default: 0 })
  reservedQuantity: number;

  @Column({ type: 'varchar', nullable: true })
  category: string;

  @Column({ nullable: true })
  image: string;

  @OneToMany(() => Service, (service) => service.plantId)
  services: Service[];
}

import { HomeService } from 'src/home-service/entities/home-service.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { Service } from 'src/services/entities/service.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../userRole.enum';
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Customer })
  role: UserRole;

  @OneToMany(() => HomeService, (homeService) => homeService.user)
  homeServices: HomeService[];

  // @OneToMany(() => Service, (service) => service.user)
  // services: Service[];

  // @OneToMany(() => Payment, (payment) => payment.user)
  // payments: Payment[];
}

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

  @Column({ nullable: true })
  mobile: string;

  @Column({ nullable: true })
  province: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  nic: string; // gardener CNIC (on record with the platform)

  @Column({ nullable: true })
  address: string; // gardener full address

  @Column({ nullable: true })
  bikeDetails: string; // legacy combined field (kept for old data)

  @Column({ nullable: true })
  bikeName: string; // make/model, e.g. "Honda CD70"

  @Column({ nullable: true })
  bikeNumber: string; // registration plate, e.g. "ABC-123"

  @Column({ type: 'text', nullable: true })
  image: string; // profile picture (base64 data URL). optional for customers, required for gardeners

  @Column({ type: 'text', nullable: true })
  experience: string; // gardener: years / description of experience

  @Column({ type: 'text', nullable: true })
  services: string; // gardener: what they can do (skills / services offered)

  @Column({ default: false })
  approved: boolean; // gardener: admin-approved & visible for booking

  @OneToMany(() => HomeService, (homeService) => homeService.user)
  homeServices: HomeService[];

  // @OneToMany(() => Service, (service) => service.user)
  // services: Service[];

  // @OneToMany(() => Payment, (payment) => payment.user)
  // payments: Payment[];
}

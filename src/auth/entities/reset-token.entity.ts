// // src/auth/entities/reset-token.entity.ts

// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   CreateDateColumn,
// } from 'typeorm';
// import { User } from '../../customer/entities/customer.entity';

// @Entity()
// export class ResetToken {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column()
//   token: string;

//   @Column()
//   expiryDate: Date;

//   @ManyToOne(() => User, (user) => user.resetTokens)
//   user: User;

//   @CreateDateColumn()
//   createdAt: Date;
// }

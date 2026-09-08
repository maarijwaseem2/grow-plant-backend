// import * as nodemailer from 'nodemailer';
// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class MailService {
//   private transporter: nodemailer.Transporter;

//   constructor() {
//     this.transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: 'aw933244@gmail.com',
//         pass: 'udgz uumg nfof flnf',
//       },
//     });
//   }

//   async sendPasswordResetEmail(to: string, token: string) {
//     const resetLink = `http://yourapp.com/reset-password?token=${token}`;
//     const mailOptions = {
//       from: 'aw933244@gmail.com',
//       to: to,
//       subject: 'Password Reset Request',
//       html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p>`,
//     };

//     await this.transporter.sendMail(mailOptions);
//   }
// }

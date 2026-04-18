import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4,
  auth: {
    user: 'ordersome2020@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: '"OrderSome 宇聯國際" <ordersome2020@gmail.com>',
    to,
    subject,
    html,
  });
}

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: '74.125.133.108',
  port: 465,
  secure: true,
  auth: {
    user: 'ordersome2020@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: {
    servername: 'smtp.gmail.com',
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
  const result = await transporter.sendMail({
    from: '"宇聯國際 OrderSome" <ordersome2020@gmail.com>',
    to,
    subject,
    html,
  });
  return result;
}

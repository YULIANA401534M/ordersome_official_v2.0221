import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
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

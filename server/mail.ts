import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  family: 4,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({ to, subject, html }: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@ordersome.com.tw',
    to,
    subject,
    html,
  });
}

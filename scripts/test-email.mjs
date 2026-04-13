import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const result = await transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: 'ordersome2020@gmail.com',
  subject: '測試信件 - Ordersome',
  html: '<p>這是測試信，如果你看到這封信代表 Email 設定正確！</p>',
});

console.log('發送結果：', result);

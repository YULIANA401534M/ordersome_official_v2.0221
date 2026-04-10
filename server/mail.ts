import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail({ to, subject, html }: {
  to: string;
  subject: string;
  html: string;
}) {
  await resend.emails.send({
    from: '來點什麼 <onboarding@resend.dev>',
    to,
    subject,
    html,
  });
}

/**
 * Email notification helper using Nodemailer (Gmail SMTP).
 * Credentials are injected via environment variables.
 * Falls back gracefully when credentials are not configured.
 */
import nodemailer from "nodemailer";
import { ENV } from "./env";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Send an email notification.
 * Returns true on success, false when credentials are missing or sending fails.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.warn("[Email] GMAIL_USER or GMAIL_APP_PASSWORD not configured, skipping email.");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    await transporter.sendMail({
      from: `"來點什麼 Ordersome" <${gmailUser}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    console.log(`[Email] Sent to ${payload.to}: ${payload.subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

/**
 * Notify admin when a new member registers via OAuth (Google or LINE).
 */
export async function notifyAdminNewMember(params: {
  name: string;
  email: string | null;
  provider: "google" | "line";
  registeredAt: Date;
}): Promise<void> {
  const adminEmail = "ordersome2020@gmail.com";
  const appUrl = ENV.appUrl || "https://ordersome.com.tw";
  const providerLabel = params.provider === "google" ? "Google" : "LINE";
  const timeStr = params.registeredAt.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
      <div style="background: #D4A017; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">🎉 新會員加入通知</h1>
      </div>
      <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p style="color: #374151; font-size: 16px;">有一位新會員透過 <strong>${providerLabel}</strong> 完成註冊！</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #f3f4f6;">
            <td style="padding: 10px 16px; font-weight: bold; color: #6b7280; width: 120px;">姓名</td>
            <td style="padding: 10px 16px; color: #111827;">${params.name || "（未提供）"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; font-weight: bold; color: #6b7280;">Email</td>
            <td style="padding: 10px 16px; color: #111827;">${params.email || "（未提供）"}</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="padding: 10px 16px; font-weight: bold; color: #6b7280;">登入方式</td>
            <td style="padding: 10px 16px; color: #111827;">${providerLabel}</td>
          </tr>
          <tr>
            <td style="padding: 10px 16px; font-weight: bold; color: #6b7280;">註冊時間</td>
            <td style="padding: 10px 16px; color: #111827;">${timeStr}</td>
          </tr>
        </table>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${appUrl}/dashboard/admin/users" style="background: #D4A017; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">前往用戶管理</a>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; text-align: center;">此為系統自動發送通知，請勿直接回覆</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `🎉 新會員加入 - ${params.name || "新用戶"} (${providerLabel})`,
    html,
  });
}

import "server-only";
import nodemailer from "nodemailer";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/**
 * Email-сервис с двумя транспортами:
 *  - "console" (по умолчанию): письмо логируется и сохраняется в .emails/ —
 *    удобно для разработки, не требует SMTP;
 *  - "smtp": реальная отправка через SMTP (настройки в .env).
 *
 * Отправка всегда fire-and-forget: сбой почты не должен ломать оформление заказа.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
};

async function sendViaConsole(msg: EmailMessage): Promise<void> {
  const dir = path.join(process.cwd(), ".emails");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}-${msg.to.replace(/[^a-z0-9@.]/gi, "_")}.html`);
  await writeFile(file, `<!-- To: ${msg.to} | Subject: ${msg.subject} -->\n${msg.html}`);
  console.log(`[email:console] → ${msg.to} | ${msg.subject} | saved: ${file}`);
}

async function sendViaSmtp(msg: EmailMessage): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "Styleberries <noreply@styleberries.example>",
    to: msg.to,
    subject: msg.subject,
    html: msg.html,
  });
}

export async function sendEmail(msg: EmailMessage): Promise<void> {
  try {
    if (process.env.EMAIL_PROVIDER === "smtp") await sendViaSmtp(msg);
    else await sendViaConsole(msg);
  } catch (err) {
    console.error("[email] send failed:", err);
  }
}

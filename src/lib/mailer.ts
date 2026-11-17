import nodemailer from "nodemailer"

let transporter: nodemailer.Transporter | null = null

export function isEmailConfigured(): boolean {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS)
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  }
  return transporter
}

export async function sendEmail(to: string, subject: string, html: string, csv?: { filename: string; content: string }) {
  await getTransporter().sendMail({
    from: `"Attendify" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments: csv ? [{ filename: csv.filename, content: csv.content, contentType: "text/csv" }] : undefined,
  })
}

/** Escape user-provided text before placing it in an HTML email. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

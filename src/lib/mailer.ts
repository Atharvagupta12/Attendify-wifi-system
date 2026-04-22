import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: `"Attendance System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  })
}
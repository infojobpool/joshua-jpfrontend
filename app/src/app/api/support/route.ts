import { NextResponse } from "next/server"

interface SupportRequestBody {
  name: string
  email: string
  phone?: string
  category?: string
  priority?: string
  subject: string
  description: string
  attachments?: { name: string; content: string; type: string }[]
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SupportRequestBody>

    const { name, email, phone, category, priority, subject, description, attachments } = body

    if (!name || !email || !subject || !description) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      )
    }

    const supportEmail = process.env.SUPPORT_EMAIL || "info@jobpool.in"

    const lines = [
      `New support request submitted on JobPool:`,
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      category ? `Category: ${category}` : null,
      priority ? `Priority: ${priority}` : null,
      "",
      `Subject: ${subject}`,
      "",
      `Description:`,
      description,
      "",
      attachments && attachments.length
        ? `Attachments: ${attachments.map((a) => a.name).join(", ")} (${attachments.length} file${attachments.length > 1 ? "s" : ""} attached)`
        : null,
    ].filter(Boolean)

    const textBody = lines.join("\n")

    // Basic email sending with nodemailer-style transport via SMTP.
    // Configure your SMTP credentials in environment variables.
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.error("SMTP environment variables are not fully configured")
      return NextResponse.json(
        {
          success: false,
          message: "Support email service is not configured. Please try again later.",
        },
        { status: 500 },
      )
    }

    const nodemailer = await import("nodemailer")

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    // Prepare email attachments from base64
    const emailAttachments =
      attachments && attachments.length > 0
        ? attachments.map((att) => ({
            filename: att.name,
            content: att.content,
            encoding: "base64" as const,
            contentType: att.type || "application/octet-stream",
          }))
        : []

    await transporter.sendMail({
      from: process.env.SUPPORT_FROM_EMAIL || smtpUser,
      to: supportEmail,
      replyTo: email,
      subject: `[JobPool Support] ${subject}`,
      text: textBody,
      attachments: emailAttachments,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error handling support request", error)
    return NextResponse.json(
      { success: false, message: "Failed to submit support request" },
      { status: 500 },
    )
  }
}


import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { generateOTPEmail } from "@/lib/email/templates/otp-email"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, code, shareInfo } = await request.json()

    const { data, error } = await resend.emails.send({
      from: "Petrobras Compartilhamento Seguro <noreply@petrobras.com.br>",
      to: [email],
      subject: `🔒 Código de Acesso - Arquivo Compartilhado por ${shareInfo.senderName}`,
      html: generateOTPEmail(email, code, shareInfo),
    })

    if (error) {
      console.error("Erro ao enviar email:", error)
      return NextResponse.json({ error: "Falha ao enviar email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error("Erro no endpoint de email:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

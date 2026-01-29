import { NextResponse } from "next/server"
import { microsoftGraphMailService } from "@/lib/services/microsoft-graph-mail"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code, shareInfo } = body

    const result = await microsoftGraphMailService.sendEmail(
      microsoftGraphMailService.createExternalUserOTPEmail({
        recipientEmail: email,
        otpCode: code,
        senderName: shareInfo.senderName,
        fileName: shareInfo.fileName,
        expirationHours: shareInfo.expirationHours || 72,
      }),
    )

    if (!result.success) {
      console.error("[API] Erro ao enviar email OTP:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error("[API] Erro crítico ao enviar email OTP:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 })
  }
}

import { useAuditLogStore } from "@/lib/stores/audit-log-store"

interface OTPData {
  code: string
  email: string
  expiresAt: number
  attempts: number
}

const OTP_EXPIRATION_TIME = 3 * 60 * 1000 // 3 minutos em ms
const MAX_ATTEMPTS = 3

class OTPService {
  private otps: Map<string, OTPData> = new Map()

  generateOTP(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    const otpData: OTPData = {
      code,
      email,
      expiresAt: Date.now() + OTP_EXPIRATION_TIME,
      attempts: 0,
    }

    this.otps.set(email, otpData)

    useAuditLogStore.getState().addLog({
      action: "generate_otp",
      level: "info",
      user: {
        id: "external-user",
        name: "Usuário Externo",
        email,
        type: "external",
      },
      details: {
        description: "Código OTP gerado para acesso de usuário externo",
        metadata: {
          expiresIn: "3 minutos",
        },
      },
    })

    return code
  }

  validateOTP(email: string, code: string): { valid: boolean; message: string } {
    const otpData = this.otps.get(email)

    if (!otpData) {
      return { valid: false, message: "Código não encontrado. Solicite um novo código." }
    }

    if (Date.now() > otpData.expiresAt) {
      this.otps.delete(email)
      useAuditLogStore.getState().addLog({
        action: "otp_expired",
        level: "warning",
        user: {
          id: "external-user",
          name: "Usuário Externo",
          email,
          type: "external",
        },
        details: {
          description: "Código OTP expirou (3 minutos)",
        },
      })
      return { valid: false, message: "Código expirado. Solicite um novo código." }
    }

    if (otpData.attempts >= MAX_ATTEMPTS) {
      this.otps.delete(email)
      useAuditLogStore.getState().addLog({
        action: "otp_max_attempts",
        level: "error",
        user: {
          id: "external-user",
          name: "Usuário Externo",
          email,
          type: "external",
        },
        details: {
          description: "Máximo de tentativas de validação OTP excedido",
          metadata: {
            attempts: MAX_ATTEMPTS,
          },
        },
      })
      return { valid: false, message: "Máximo de tentativas excedido. Solicite um novo código." }
    }

    otpData.attempts++

    if (otpData.code !== code) {
      useAuditLogStore.getState().addLog({
        action: "otp_invalid",
        level: "warning",
        user: {
          id: "external-user",
          name: "Usuário Externo",
          email,
          type: "external",
        },
        details: {
          description: "Código OTP inválido informado",
          metadata: {
            attempt: otpData.attempts,
            maxAttempts: MAX_ATTEMPTS,
          },
        },
      })
      return {
        valid: false,
        message: `Código incorreto. ${MAX_ATTEMPTS - otpData.attempts} tentativa(s) restante(s).`,
      }
    }

    this.otps.delete(email)

    useAuditLogStore.getState().addLog({
      action: "otp_validated",
      level: "success",
      user: {
        id: "external-user",
        name: "Usuário Externo",
        email,
        type: "external",
      },
      details: {
        description: "Código OTP validado com sucesso",
      },
    })

    return { valid: true, message: "Código validado com sucesso!" }
  }

  getTimeRemaining(email: string): number {
    const otpData = this.otps.get(email)
    if (!otpData) return 0

    const remaining = otpData.expiresAt - Date.now()
    return Math.max(0, Math.floor(remaining / 1000))
  }
}

export const otpService = new OTPService()

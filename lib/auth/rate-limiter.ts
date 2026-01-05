/**
 * Rate Limiter - Previne ataques de força bruta
 *
 * Limita tentativas de login por IP e email
 */

interface LoginAttempt {
  count: number
  firstAttempt: number
  lastAttempt: number
  blocked: boolean
  blockUntil?: number
}

const MAX_ATTEMPTS = 5 // Máximo de tentativas
const WINDOW_MS = 15 * 60 * 1000 // Janela de 15 minutos
const BLOCK_DURATION_MS = 30 * 60 * 1000 // Bloqueio de 30 minutos

class RateLimiter {
  private attempts: Map<string, LoginAttempt> = new Map()

  /**
   * Verificar se o IP ou email está bloqueado
   */
  isBlocked(identifier: string): boolean {
    const attempt = this.attempts.get(identifier)

    if (!attempt || !attempt.blocked) {
      return false
    }

    // Verificar se o bloqueio expirou
    if (attempt.blockUntil && Date.now() >= attempt.blockUntil) {
      this.attempts.delete(identifier)
      return false
    }

    return true
  }

  /**
   * Registrar tentativa de login
   */
  recordAttempt(identifier: string): {
    allowed: boolean
    attemptsRemaining: number
    retryAfter?: number
  } {
    // Verificar se está bloqueado
    if (this.isBlocked(identifier)) {
      const attempt = this.attempts.get(identifier)!
      const retryAfter = attempt.blockUntil ? Math.ceil((attempt.blockUntil - Date.now()) / 1000) : 0

      return {
        allowed: false,
        attemptsRemaining: 0,
        retryAfter,
      }
    }

    const now = Date.now()
    const attempt = this.attempts.get(identifier)

    // Nova tentativa ou janela expirada
    if (!attempt || now - attempt.firstAttempt > WINDOW_MS) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false,
      })

      return {
        allowed: true,
        attemptsRemaining: MAX_ATTEMPTS - 1,
      }
    }

    // Incrementar contador
    attempt.count += 1
    attempt.lastAttempt = now

    // Verificar se ultrapassou o limite
    if (attempt.count >= MAX_ATTEMPTS) {
      attempt.blocked = true
      attempt.blockUntil = now + BLOCK_DURATION_MS

      this.attempts.set(identifier, attempt)

      return {
        allowed: false,
        attemptsRemaining: 0,
        retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000),
      }
    }

    this.attempts.set(identifier, attempt)

    return {
      allowed: true,
      attemptsRemaining: MAX_ATTEMPTS - attempt.count,
    }
  }

  /**
   * Resetar tentativas (após login bem-sucedido)
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }

  /**
   * Obter informações sobre tentativas
   */
  getAttemptInfo(identifier: string): LoginAttempt | null {
    return this.attempts.get(identifier) || null
  }

  /**
   * Limpar tentativas antigas (cleanup)
   */
  cleanup(): void {
    const now = Date.now()

    for (const [identifier, attempt] of this.attempts.entries()) {
      // Remover tentativas antigas (mais de 1 hora)
      if (now - attempt.lastAttempt > 60 * 60 * 1000) {
        this.attempts.delete(identifier)
      }
    }
  }
}

// Instância global
export const rateLimiter = new RateLimiter()

// Cleanup automático a cada 10 minutos
if (typeof window !== "undefined") {
  setInterval(
    () => {
      rateLimiter.cleanup()
    },
    10 * 60 * 1000,
  )
}

/**
 * Gerar identificador único baseado em IP + Email
 */
export function generateIdentifier(ip: string, email?: string): string {
  return email ? `${ip}:${email}` : ip
}

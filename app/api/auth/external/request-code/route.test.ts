import { POST } from './route'
import { verifyExternalUser } from '@/lib/auth/user-verification'
import { handleProxyResponse, proxyHeaders, serverError } from '@/lib/api/route-handler-utils'

global.fetch = jest.fn()

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      body,
      status: init?.status ?? 200,
    })),
  },
}))

jest.mock('@/lib/auth/user-verification', () => ({
  verifyExternalUser: jest.fn(),
}))

jest.mock('@/lib/api/route-handler-utils', () => ({
  BACKEND_URL: 'http://backend',
  proxyHeaders: jest.fn(() => ({ 'content-type': 'application/json' })),
  handleProxyResponse: jest.fn(),
  serverError: jest.fn(() => ({
    body: { success: false },
    status: 500,
  })),
}))

describe('POST /api/auth/external/request-code', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar 400 quando email não for enviado', async () => {
    const request = {
      json: async () => ({}),
    } as any

    const response = await POST(request)

    expect(response).toEqual({
      body: {
        success: false,
        error: {
          code: 'EMAIL_REQUIRED',
          message: 'E-mail é obrigatório',
        },
      },
      status: 400,
    })
    expect(verifyExternalUser).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('deve retornar 403 quando usuário não for autorizado', async () => {
    ;(verifyExternalUser as jest.Mock).mockResolvedValue({
      verified: false,
      reason: 'Usuário não autorizado',
    })

    const request = {
      json: async () => ({ email: 'teste@empresa.com' }),
    } as any

    const response = await POST(request)

    expect(verifyExternalUser).toHaveBeenCalledWith('teste@empresa.com')
    expect(response).toEqual({
      body: {
        success: false,
        error: {
          code: 'USER_NOT_AUTHORIZED',
          message: 'Usuário não autorizado',
        },
      },
      status: 403,
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('deve chamar o backend quando usuário for autorizado', async () => {
    const backendResponse = { ok: true }
    const handledResponse = { body: { success: true }, status: 200 }

    ;(verifyExternalUser as jest.Mock).mockResolvedValue({
      verified: true,
    })
    ;(fetch as jest.Mock).mockResolvedValue(backendResponse)
    ;(handleProxyResponse as jest.Mock).mockReturnValue(handledResponse)

    const request = {
      json: async () => ({
        email: 'teste@empresa.com',
        validity_minutes: 10,
      }),
    } as any

    const response = await POST(request)

    expect(proxyHeaders).toHaveBeenCalledWith(request, {
      withAuth: false,
      withContentType: true,
    })
    expect(fetch).toHaveBeenCalledWith('http://backend/api/v1/auth/external/request-code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'teste@empresa.com',
        validity_minutes: 10,
      }),
    })
    expect(handleProxyResponse).toHaveBeenCalledWith(backendResponse)
    expect(response).toBe(handledResponse)
  })

  it('deve retornar serverError quando ocorrer exceção', async () => {
    const error = new Error('falha inesperada')
    ;(verifyExternalUser as jest.Mock).mockRejectedValue(error)

    const request = {
      json: async () => ({ email: 'teste@empresa.com' }),
    } as any

    const response = await POST(request)

    expect(serverError).toHaveBeenCalledWith('POST /api/auth/external/request-code', error)
    expect(response).toEqual({
      body: { success: false },
      status: 500,
    })
  })
})
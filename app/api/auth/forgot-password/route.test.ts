import { POST } from './route'
import { proxyHeaders, serverError } from '@/lib/api/route-handler-utils'

global.fetch = jest.fn()

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body) => ({
      body,
      status: 200,
    })),
  },
}))

jest.mock('@/lib/api/route-handler-utils', () => ({
  BACKEND_URL: 'http://backend',
  proxyHeaders: jest.fn(() => ({ 'content-type': 'application/json' })),
  serverError: jest.fn(() => ({
    body: { success: false },
    status: 500,
  })),
}))

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar sucesso com a mensagem vinda do backend', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        message: 'Email enviado com sucesso',
      }),
    })

    const request = {
      json: async () => ({
        email: 'teste@empresa.com',
      }),
    } as any

    const response = await POST(request)

    expect(proxyHeaders).toHaveBeenCalledWith(request, {
      withAuth: false,
      withContentType: true,
    })

    expect(fetch).toHaveBeenCalledWith('http://backend/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'teste@empresa.com',
      }),
    })

    expect(response).toEqual({
      body: {
        success: true,
        message: 'Email enviado com sucesso',
      },
      status: 200,
    })
  })

  it('deve retornar a mensagem padrão quando o backend não enviar message', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      json: async () => ({}),
    })

    const request = {
      json: async () => ({
        email: 'teste@empresa.com',
      }),
    } as any

    const response = await POST(request)

    expect(response).toEqual({
      body: {
        success: true,
        message: 'Se o email estiver cadastrado, você receberá instruções',
      },
      status: 200,
    })
  })

  it('deve retornar serverError quando ocorrer exceção', async () => {
    const error = new Error('network')
    ;(fetch as jest.Mock).mockRejectedValue(error)

    const request = {
      json: async () => ({
        email: 'teste@empresa.com',
      }),
    } as any

    const response = await POST(request)

    expect(serverError).toHaveBeenCalledWith('POST /api/v1/auth/forgot-password', error)
    expect(response).toEqual({
      body: { success: false },
      status: 500,
    })
  })
})
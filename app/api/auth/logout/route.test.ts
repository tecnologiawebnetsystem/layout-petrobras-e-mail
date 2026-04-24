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

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar sucesso com mensagem do backend', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        message: 'Logout ok',
      }),
    })

    const request = {} as any

    const response = await POST(request)

    expect(proxyHeaders).toHaveBeenCalledWith(request, {
      withContentType: true,
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://backend/api/v1/auth/logout',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }
    )

    expect(response).toEqual({
      body: {
        success: true,
        message: 'Logout ok',
      },
      status: 200,
    })
  })

  it('deve usar mensagem padrão quando backend não enviar message', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      json: async () => ({}),
    })

    const request = {} as any

    const response = await POST(request)

    expect(response).toEqual({
      body: {
        success: true,
        message: 'Logout realizado com sucesso',
      },
      status: 200,
    })
  })

  it('deve retornar serverError quando ocorrer exceção', async () => {
    const error = new Error('network')
    ;(fetch as jest.Mock).mockRejectedValue(error)

    const request = {} as any

    const response = await POST(request)

    expect(serverError).toHaveBeenCalledWith(
      'POST /api/v1/auth/logout',
      error
    )

    expect(response).toEqual({
      body: { success: false },
      status: 500,
    })
  })
})
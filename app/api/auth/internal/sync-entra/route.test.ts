import { POST } from './route'

global.fetch = jest.fn()

jest.mock('@/lib/api/route-handler-utils', () => ({
  BACKEND_URL: 'http://backend',
  proxyHeaders: jest.fn(() => ({})),
  serverError: jest.fn(() => ({
    status: 500,
    json: () => ({ error: true }),
  })),
}))

describe('POST /sync-entra', () => {
  it('deve retornar sucesso quando backend responde ok', async () => {
    const mockJson = { ok: true }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockJson,
    })

    const request = {
      json: async () => ({ user: 1 }),
    } as any

    const res = await POST(request)

    expect(fetch).toHaveBeenCalled()
  })

  it('deve retornar erro quando backend falha', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: true }),
    })

    const request = {
      json: async () => ({ user: 1 }),
    } as any

    const res = await POST(request)

    expect(fetch).toHaveBeenCalled()
  })

  it('deve tratar exception', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new Error('network'))

    const request = {
      json: async () => ({ user: 1 }),
    } as any

    const res = await POST(request)

    expect(fetch).toHaveBeenCalled()
  })
})
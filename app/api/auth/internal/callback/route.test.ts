import { GET } from './route'
import { proxyGET } from '@/lib/api/route-handler-utils'

jest.mock('@/lib/api/route-handler-utils', () => ({
  proxyGET: jest.fn(),
}))

describe('GET /api/auth/internal/callback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve delegar para proxyGET com os parâmetros corretos', async () => {
    const mockedResponse = { status: 200 }
    ;(proxyGET as jest.Mock).mockResolvedValue(mockedResponse)

    const request = {} as any
    const response = await GET(request)

    expect(proxyGET).toHaveBeenCalledWith(
      request,
      '/api/v1/auth/internal/callback',
      { withAuth: false }
    )
    expect(response).toBe(mockedResponse)
  })
})
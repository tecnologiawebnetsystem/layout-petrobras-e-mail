import { POST } from './route'
import { proxyJSON } from '@/lib/api/route-handler-utils'

jest.mock('@/lib/api/route-handler-utils', () => ({
  proxyJSON: jest.fn(),
}))

describe('POST /api/auth/external/verify-code', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve delegar para proxyJSON com os parâmetros corretos', async () => {
    const mockedResponse = { status: 200 }
    ;(proxyJSON as jest.Mock).mockResolvedValue(mockedResponse)

    const request = {} as any
    const response = await POST(request)

    expect(proxyJSON).toHaveBeenCalledWith(
      'POST',
      request,
      '/api/v1/auth/external/verify-code',
      { withAuth: false }
    )
    expect(response).toBe(mockedResponse)
  })
})
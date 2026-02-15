/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera output standalone para deploy em container Docker
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://graph.microsoft.com https://login.microsoftonline.com https://*.msauth.net https://*.msauthimages.net https://vercel.live",
              "frame-src 'self' https://login.microsoftonline.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gera output standalone para deploy em container Docker
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://graph.microsoft.com https://login.microsoftonline.com https://*.msauth.net https://*.msauthimages.net https://vercel.live",
              "frame-src 'self' https://login.microsoftonline.com",
            ].join("; "),
          },
          // HSTS
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },

          // Anti MIME sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          // Clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },

          // Referrer policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          // Permissões de browser
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

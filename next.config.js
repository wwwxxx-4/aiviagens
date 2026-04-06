/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.serpapi.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '**.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  // ── Headers de segurança HTTP ──────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Impede que o site seja carregado em iframes (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Impede que o browser "adivinhe" o tipo de conteúdo
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Força HTTPS por 1 ano (só ativo em produção)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Bloqueia envio de Referrer para sites externos
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Restringe acesso a APIs do browser por domínio
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // Proteção XSS para browsers legados
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        // Para rotas de API: impede cache de dados sensíveis
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
}

module.exports = nextConfig

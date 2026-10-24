import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Quando o navegador do utilizador chamar /api/...
        source: '/api/:path*',
        // O servidor do front-end fará o pedido no back-end via rede privada
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Apontamos diretamente para o IP Privado da EC2 do Back-end
        destination: 'http://10.0.1.10:25000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
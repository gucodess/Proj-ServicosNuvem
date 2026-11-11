import type { NextConfig } from 'next';

// Sem "rewrites" com IP fixo: a ponte front -> back agora e feita em
// app/api/[...path]/route.ts, que le BACKEND_URL do ambiente em tempo de execucao.
const nextConfig: NextConfig = {};

export default nextConfig;

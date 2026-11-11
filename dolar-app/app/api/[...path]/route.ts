// Proxy do front-end para a API do back-end (RF-05 / RNF-03).
//
// Por que existe: o navegador do usuario NAO consegue falar com a EC2 do back-end
// (o Security Group so libera a porta 25000 para o SG do front-end). Entao o navegador
// chama /api/... no proprio front-end, e ESTE codigo, rodando no servidor Next.js
// dentro da EC2 do front-end, repassa a chamada para o back-end pela rede privada da VPC.
//
// Por que nao usar "rewrites" no next.config.ts: rewrites sao gravados no build
// (.next/routes-manifest.json). Trocar o IP exigiria rebuild da imagem. Aqui o endereco
// e lido de process.env.BACKEND_URL A CADA REQUISICAO: mudou o IP, basta editar o .env
// e reiniciar o container.
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, ctx: Ctx) {
  const backend = process.env.BACKEND_URL;
  if (!backend) {
    return NextResponse.json(
      { error: 'BACKEND_URL nao configurada no .env do front-end' }, { status: 500 });
  }

  const { path } = await ctx.params;
  const destino = `${backend.replace(/\/$/, '')}/api/${path.join('/')}${req.nextUrl.search}`;

  const init: RequestInit = {
    method: req.method,
    headers: { 'content-type': req.headers.get('content-type') ?? 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') init.body = await req.arrayBuffer();

  try {
    const r = await fetch(destino, init);
    return new NextResponse(r.body, {
      status: r.status,
      headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
    });
  } catch (e) {
    console.error(`[proxy] falha ao chamar ${destino}:`, e);
    return NextResponse.json(
      { error: 'Back-end inacessivel', destino, detalhe: String(e) }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE };

import { NextResponse } from 'next/server';

export async function GET() {
  // A variável de ambiente apontará para o IP privado da EC2 do backend
  const backendUrl = process.env.BACKEND_URL; // definido no .env (sem IP fixo no codigo)
  
  try {
    // Faz a requisição de servidor (Frontend) para servidor (Backend)
    const res = await fetch(`${backendUrl}/api/cotacoes`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Falha na comunicação com o backend' }, { status: 500 });
  }
}
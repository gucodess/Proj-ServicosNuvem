"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [dolar, setDolar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDolar = async () => {
    try {
      // Agora o frontend chama a própria rota interna
      const response = await fetch("/api/dolar");
      const data = await response.json();
      setDolar(data.valor);
    } catch (error) {
      console.error("Erro ao buscar a cotação do dólar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDolar();
    
    // Atualiza a cotação a cada 30 segundos
    const intervalo = setInterval(fetchDolar, 30000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
      <h1 className="text-2xl md:text-4xl font-bold mb-8 text-center">
        Dólar em Tempo Real
      </h1>
      
      {loading ? (
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-32 bg-gray-700 rounded rounded-full"></div>
        </div>
      ) : (
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 flex flex-col items-center">
          <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">
            USD 1,00 = BRL
          </p>
          <p className="text-6xl font-mono font-semibold text-emerald-400">
            R$ {Number(dolar).toFixed(2).replace(".", ",")}
          </p>
          
          <div className="mt-6 flex items-center space-x-2 text-xs text-gray-500">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span>Atualizando a cada 30s</span>
          </div>
        </div>
      )}
    </div>
  );
}
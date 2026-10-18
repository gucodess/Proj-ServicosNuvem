"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Calculator, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [cotacoes, setCotacoes] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [valorInput, setValorInput] = useState("100");
  
  // NOVO ESTADO: Guarda a moeda selecionada na calculadora
  const [moedaSelecionada, setMoedaSelecionada] = useState("USD"); 
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:25000";

  const carregarDados = async () => {
    try {
      const resCotacoes = await fetch(`${BACKEND_URL}/api/cotacoes`);
      const dataCotacoes = await resCotacoes.json();
      setCotacoes(dataCotacoes);

      const resHistorico = await fetch(`${BACKEND_URL}/api/historico`);
      const dataHistorico = await resHistorico.json();
      setHistorico(dataHistorico);
    } catch (error) {
      console.error("Erro na comunicação com o backend:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    const intervalo = setInterval(carregarDados, 30000);
    return () => clearInterval(intervalo);
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-emerald-400">Carregando Dashboard...</div>;
  }

  // NOVA LÓGICA DA CALCULADORA: Busca o preço dinamicamente com base na seleção
  const cotacaoAtual = cotacoes && cotacoes[`${moedaSelecionada}BRL`] 
    ? parseFloat(cotacoes[`${moedaSelecionada}BRL`].bid) 
    : 0;
    
  const valorConvertido = (parseFloat(valorInput || "0") * cotacaoAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Define o símbolo dinamicamente para o input
  const simbolosMoedas: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", BTC: "₿" };
  const simboloAtual = simbolosMoedas[moedaSelecionada] || "$";

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-6">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
          <TrendingUp className="text-emerald-400" />
          Mercado Global
        </h1>
        <p className="text-gray-400 mt-2">Dados atualizados em tempo real via AWS EC2</p>
      </header>

      {/* Cards de Cotações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { nome: "Dólar (USD)", dados: cotacoes?.USDBRL },
          { nome: "Euro (EUR)", dados: cotacoes?.EURBRL },
          { nome: "Libra (GBP)", dados: cotacoes?.GBPBRL },
          { nome: "Bitcoin (BTC)", dados: cotacoes?.BTCBRL }
        ].map((moeda, index) => (
          <div key={index} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
            <h3 className="text-gray-400 text-sm font-medium">{moeda.nome}</h3>
            <p className="text-3xl font-mono mt-2 text-white">
              R$ {moeda.dados?.bid ? parseFloat(moeda.dados.bid).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "0,00"}
            </p>
            <span className={`text-xs mt-2 inline-block px-2 py-1 rounded ${moeda.dados?.pctChange && parseFloat(moeda.dados.pctChange) > 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
              {moeda.dados?.pctChange || "0"}% (Hoje)
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Histórico */}
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h2 className="text-xl font-semibold mb-6">Histórico do Dólar (Últimos 7 dias)</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="data" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" domain={['dataMin - 0.05', 'auto']} fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#34d399' }}
                />
                <Line type="monotone" dataKey="valor" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NOVA CALCULADORA */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex flex-col">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Calculator size={20} className="text-emerald-400"/>
            Calculadora de Câmbio
          </h2>
          
          <div className="flex-1 flex flex-col justify-center">
            
            <div className="flex gap-4 mb-6">
              {/* Seletor de Moeda */}
              <div className="w-1/3">
                <label className="text-gray-400 text-sm mb-2 block">Moeda</label>
                <select 
                  value={moedaSelecionada}
                  onChange={(e) => setMoedaSelecionada(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-2 text-white focus:outline-none focus:border-emerald-500 font-mono appearance-none"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="BTC">BTC</option>
                </select>
              </div>

              {/* Input de Valor */}
              <div className="w-2/3">
                <label className="text-gray-400 text-sm mb-2 block">Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-mono">{simboloAtual}</span>
                  <input 
                    type="number" 
                    value={valorInput}
                    onChange={(e) => setValorInput(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <label className="text-gray-400 text-sm mb-2">Valor em Reais (BRL)</label>
            <div className="w-full bg-gray-900 border border-gray-700 rounded-lg py-4 px-4 text-center">
              <span className="text-3xl font-mono text-emerald-400">
                R$ {valorConvertido}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
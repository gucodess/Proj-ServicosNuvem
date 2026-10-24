"use client"
import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [cotacoes, setCotacoes] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [moedaGrafico, setMoedaGrafico] = useState('USD');
  
  // States da Calculadora
  const [calcValor, setCalcValor] = useState('');
  const [calcMoeda, setCalcMoeda] = useState('USD');
  const [resultado, setResultado] = useState<number | null>(null);

  // Força o uso do Proxy do Next.js para comunicar com a EC2 privada
  const API_URL = '/api';

  useEffect(() => {
    // 1. Busca Cotações Múltiplas com fallback visual
    axios.get(`${API_URL}/cotacoes`)
      .then(res => setCotacoes(res.data))
      .catch(err => console.error("Erro ao buscar cotações:", err));
  }, []);

  useEffect(() => {
    // 2. Busca Histórico
    axios.get(`${API_URL}/historico?moeda=${moedaGrafico}&dias=7`)
      .then(res => {
        const formatado = res.data.map((item: any) => ({
          data: new Date(item.timestamp * 1000).toLocaleDateString('pt-BR'),
          valor: parseFloat(item.bid)
        })).reverse();
        setHistorico(formatado);
      })
      .catch(err => console.error("Erro ao buscar histórico:", err));
  }, [moedaGrafico]);

  const realizarConversao = async () => {
    if (!calcValor) return;
    try {
      const res = await axios.get(`${API_URL}/converter?moeda=${calcMoeda}&valor=${calcValor}`);
      setResultado(res.data.valorConvertido);
    } catch (error) {
      console.error("Erro ao converter:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Inspirado na Referência */}
        <div className="text-center py-6 space-y-4">
          <div className="inline-block px-4 py-1 rounded-full border border-slate-700 bg-slate-800/50 text-xs font-semibold text-emerald-400 mb-2">
            ● Projeto Acadêmico - Deploy em Nuvem
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight">
            Cotação do Dólar em <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Tempo Real</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Uma aplicação web moderna hospedada na AWS. Utilizando instâncias EC2 e comunicação isolada via VPC.
          </p>
        </div>

        {/* Cards de Cotações */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {cotacoes ? Object.keys(cotacoes).map((key) => (
            <div key={key} className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg backdrop-blur-sm hover:border-emerald-500/50 transition duration-300">
              <h3 className="text-sm font-medium text-slate-400">{cotacoes[key].name}</h3>
              <p className="text-3xl font-bold text-white mt-2">R$ {parseFloat(cotacoes[key].bid).toFixed(2)}</p>
              <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${parseFloat(cotacoes[key].pctChange) > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {parseFloat(cotacoes[key].pctChange) > 0 ? '↑' : '↓'} {cotacoes[key].pctChange}%
              </span>
            </div>
          )) : (
            <div className="col-span-4 flex items-center justify-center py-12 text-emerald-400 font-medium animate-pulse">
              A buscar dados financeiros atualizados...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Gráfico de Tendência */}
          <div className="md:col-span-2 p-6 bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Histórico (7 dias)</h2>
              <select 
                className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                value={moedaGrafico} 
                onChange={(e) => setMoedaGrafico(e.target.value)}
              >
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">Libra (GBP)</option>
                <option value="BTC">Bitcoin (BTC)</option>
              </select>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="data" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={4} dot={{ fill: '#0F172A', stroke: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 7, fill: '#10b981', stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Calculadora Interativa */}
          <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-2xl shadow-lg backdrop-blur-sm flex flex-col space-y-6">
            <h2 className="text-xl font-bold text-white">Conversor</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Moeda de Origem</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                  value={calcMoeda}
                  onChange={(e) => setCalcMoeda(e.target.value)}
                >
                  <option value="USD">Dólar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">Libra (GBP)</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Valor a converter</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-3 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                  placeholder="Ex: 150"
                  value={calcValor}
                  onChange={(e) => setCalcValor(e.target.value)}
                />
              </div>

              <button 
                onClick={realizarConversao}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg transition duration-300 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)]"
              >
                Converter para BRL
              </button>
            </div>

            {/* Resultado da Conversão */}
            {resultado !== null && (
              <div className="mt-auto p-5 bg-slate-900 border border-emerald-500/30 rounded-xl text-center shadow-inner">
                <p className="text-sm font-medium text-slate-400 mb-1">Resultado em Reais</p>
                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                  R$ {resultado.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
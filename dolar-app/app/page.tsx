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

  const API_URL = 'http://localhost:3001/api';

  useEffect(() => {
    // 1. Busca Cotações Múltiplas
    axios.get(`${API_URL}/cotacoes`).then(res => setCotacoes(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    // 2. Busca Histórico (Reativo à moeda escolhida)
    axios.get(`${API_URL}/historico?moeda=${moedaGrafico}&dias=7`)
      .then(res => {
        // Formatando para o Recharts (Data e Valor)
        const formatado = res.data.map((item: any) => ({
          data: new Date(item.timestamp * 1000).toLocaleDateString('pt-BR'),
          valor: parseFloat(item.bid)
        })).reverse(); // Inverte para mostrar ordem cronológica
        setHistorico(formatado);
      }).catch(console.error);
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
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-sans">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard Financeiro</h1>

      {/* Cards de Cotações */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cotacoes && Object.keys(cotacoes).map((key) => (
          <div key={key} className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition">
            <h3 className="text-sm text-gray-500">{cotacoes[key].name}</h3>
            <p className="text-2xl font-bold text-blue-600">R$ {parseFloat(cotacoes[key].bid).toFixed(2)}</p>
            <span className={`text-sm ${parseFloat(cotacoes[key].pctChange) > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {cotacoes[key].pctChange}%
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Gráfico de Tendência */}
        <div className="md:col-span-2 p-6 bg-white border rounded-xl shadow-sm">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Tendência (Últimos 7 dias)</h2>
            <select 
              className="border rounded p-2"
              value={moedaGrafico} 
              onChange={(e) => setMoedaGrafico(e.target.value)}
            >
              <option value="USD">Dólar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="GBP">Libra (GBP)</option>
              <option value="BTC">Bitcoin (BTC)</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="data" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="valor" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calculadora Interativa */}
        <div className="p-6 bg-white border rounded-xl shadow-sm flex flex-col space-y-4">
          <h2 className="text-xl font-semibold">Calculadora</h2>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">Moeda</label>
            <select 
              className="w-full border rounded p-2"
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
            <label className="block text-sm text-gray-600 mb-1">Valor a converter</label>
            <input 
              type="number" 
              className="w-full border rounded p-2"
              placeholder="Ex: 150"
              value={calcValor}
              onChange={(e) => setCalcValor(e.target.value)}
            />
          </div>

          <button 
            onClick={realizarConversao}
            className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition"
          >
            Converter para BRL
          </button>

          {resultado !== null && (
            <div className="mt-4 p-4 bg-gray-50 rounded text-center">
              <p className="text-sm text-gray-500">Valor em Reais (BRL)</p>
              <p className="text-2xl font-bold text-gray-800">R$ {resultado.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
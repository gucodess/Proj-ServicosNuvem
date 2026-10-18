const express = require('express');
const cors = require('cors');
// const { Pool } = require('pg'); // Descomente quando o RDS estiver pronto

const app = express();
app.use(cors()); // Permite o frontend Next.js acessar

const PORT = 25000;

// Configuração futura do seu RDS (AWS)
/*
const pool = new Pool({
  host: 'seu-endpoint-rds.amazonaws.com',
  user: 'postgres',
  password: 'sua-senha',
  database: 'cotacoes_db',
  port: 5432,
});
*/

// Sistema de Cache simples (30 segundos)
let cacheCotacoes = { data: null, timestamp: 0 };

// ROTA 1: Múltiplas Moedas (Dólar, Euro, Libra e Bitcoin)
app.get('/api/cotacoes', async (req, res) => {
  const agora = Date.now();
  
  // Retorna do cache se tiver menos de 30 segundos
  if (cacheCotacoes.data && (agora - cacheCotacoes.timestamp < 30000)) {
    return res.json(cacheCotacoes.data);
  }

  try {
    const response = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,GBP-BRL,BTC-BRL");
    const data = await response.json();
    
    // Atualiza o cache
    cacheCotacoes = { data, timestamp: agora };
    
    // Exemplo de como você salvaria no RDS em background:
    // pool.query('INSERT INTO historico_diario (moeda, valor) VALUES ($1, $2)', ['USD', data.USDBRL.bid]);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cotações' });
  }
});

// ROTA 2: Histórico de 7 dias do Dólar para o Gráfico
app.get('/api/historico', async (req, res) => {
  try {
    const response = await fetch("https://economia.awesomeapi.com.br/json/daily/USD-BRL/7");
    const data = await response.json();
    
    // Formata os dados para o gráfico do frontend
    const historicoFormatado = data.map(item => ({
      data: new Date(item.timestamp * 1000).toLocaleDateString('pt-BR'),
      valor: parseFloat(item.bid)
    })).reverse(); // Inverte para ordem cronológica

    res.json(historicoFormatado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// ROTA 3: Calculadora de Conversão
app.get('/api/converter', async (req, res) => {
  const { moeda, valor } = req.query; // ex: ?moeda=USD&valor=100
  if (!moeda || !valor) return res.status(400).json({ error: "Parâmetros inválidos" });

  try {
    const response = await fetch(`https://economia.awesomeapi.com.br/last/${moeda}-BRL`);
    const data = await response.json();
    const cotacaoAtual = data[`${moeda}BRL`].bid;
    
    const valorConvertido = (parseFloat(valor) * parseFloat(cotacaoAtual)).toFixed(2);
    res.json({ valorConvertido, cotacaoAtual });
  } catch (error) {
    res.status(500).json({ error: 'Erro na conversão' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Robusto rodando na porta ${PORT}`);
});
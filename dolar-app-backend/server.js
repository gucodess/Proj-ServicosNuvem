const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
app.use(cors());
app.use(express.json());

// Cache configurado para 30 segundos
const cache = new NodeCache({ stdTTL: 600 });
const BASE_URL = 'https://economia.awesomeapi.com.br';

// 1. Rota de Múltiplas Moedas (Dashboard)
app.get('/api/cotacoes', async (req, res) => {
    try {
        const cacheKey = 'todas-cotacoes';
        const cachedData = cache.get(cacheKey);
        
        if (cachedData) {
            return res.json(cachedData); // Retorna do cache se existir
        }

        const response = await axios.get(`${BASE_URL}/last/USD-BRL,EUR-BRL,GBP-BRL,BTC-BRL`);
        cache.set(cacheKey, response.data);
        res.json(response.data);

    } catch (error) {
        console.error("Erro na rota /api/cotacoes:", error.message);
        res.status(500).json({ error: 'Falha ao buscar cotações múltiplas. Tente novamente mais tarde.' });
    }
});

// 2. Rota de Histórico
app.get('/api/historico', async (req, res) => {
    try {
        const { moeda = 'USD', dias = '7' } = req.query;
        const cacheKey = `historico-${moeda}-${dias}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            return res.json(cachedData);
        }

        const response = await axios.get(`${BASE_URL}/json/daily/${moeda}-BRL/${dias}`);
        cache.set(cacheKey, response.data);
        res.json(response.data);

    } catch (error) {
        console.error(`Erro na rota /api/historico para ${req.query.moeda}:`, error.message);
        res.status(500).json({ error: 'Falha ao buscar o histórico de dias.' });
    }
});

// 3. Rota de Conversão Segura
app.get('/api/converter', async (req, res) => {
    try {
        const { moeda, valor } = req.query;
        
        if (!moeda || !valor || isNaN(valor)) {
            return res.status(400).json({ error: 'Parâmetros inválidos. Envie a moeda e um valor numérico.' });
        }

        const cacheKey = `cotacao-${moeda}`;
        let cotacaoAtual = cache.get(cacheKey);

        if (!cotacaoAtual) {
            const response = await axios.get(`${BASE_URL}/last/${moeda}-BRL`);
            const dadosMoeda = response.data[`${moeda}BRL`];
            
            if (!dadosMoeda) return res.status(404).json({ error: 'Moeda não encontrada.' });
            
            cotacaoAtual = parseFloat(dadosMoeda.bid);
            cache.set(cacheKey, cotacaoAtual);
        }

        const valorConvertido = (parseFloat(valor) * cotacaoAtual).toFixed(2);
        
        res.json({
            moedaOriginal: moeda,
            moedaDestino: 'BRL',
            valorOriginal: parseFloat(valor),
            valorConvertido: parseFloat(valorConvertido),
            taxaUtilizada: cotacaoAtual
        });

    } catch (error) {
        console.error("Erro na conversão:", error.message);
        res.status(500).json({ error: 'Erro interno ao realizar a conversão matemática.' });
    }
});

const PORT = 25000;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
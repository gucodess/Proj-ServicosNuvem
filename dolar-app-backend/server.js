const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
app.use(cors());
app.use(express.json());

const cache = new NodeCache({ stdTTL: 900 }); 

axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const getYahooSymbol = (moeda) => moeda === 'BTC' ? 'BTC-BRL' : `${moeda}BRL=X`;
const getMoedaName = (moeda) => {
    const names = { USD: 'Dólar', EUR: 'Euro', GBP: 'Libra', BTC: 'Bitcoin' };
    return names[moeda] || moeda;
};

// 1. Rota de Múltiplas Moedas (Resiliente)
app.get('/api/cotacoes', async (req, res) => {
    try {
        const cacheKey = 'todas-cotacoes-yahoo';
        const cachedData = cache.get(cacheKey);
        if (cachedData) return res.json(cachedData);

        const moedas = ['USD', 'EUR', 'GBP', 'BTC'];
        const cotacoes = {};

        // Busca uma a uma. Se uma falhar, o bloco catch isola o erro e o sistema continua.
        for (const moeda of moedas) {
            const symbol = getYahooSymbol(moeda);
            try {
                const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`);
                
                const result = response.data.chart.result[0];
                const price = result.meta.regularMarketPrice;
                const prevClose = result.meta.chartPreviousClose;
                const pctChange = (((price - prevClose) / prevClose) * 100).toFixed(2);

                cotacoes[moeda] = {
                    name: getMoedaName(moeda),
                    bid: price.toString(),
                    pctChange: pctChange
                };
            } catch (err) {
                console.error(`Erro ao buscar ${moeda} (${symbol}):`, err.message);
                // Preenche com zeros para não quebrar os cards do painel
                cotacoes[moeda] = {
                    name: getMoedaName(moeda),
                    bid: "0.00",
                    pctChange: "0.00"
                };
            }
        }

        cache.set(cacheKey, cotacoes);
        res.json(cotacoes);

    } catch (error) {
        console.error("Erro /cotacoes geral:", error.message);
        res.status(500).json({ error: 'Falha ao buscar cotações.' });
    }
});

// 2. Rota de Histórico
app.get('/api/historico', async (req, res) => {
    try {
        const { moeda = 'USD', dias = '7' } = req.query;
        const cacheKey = `historico-${moeda}-${dias}`;
        const cachedData = cache.get(cacheKey);
        if (cachedData) return res.json(cachedData);

        const symbol = getYahooSymbol(moeda);
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${dias}d&interval=1d`);
        
        const result = response.data.chart.result[0];
        const timestamps = result.timestamp || [];
        const closes = result.indicators.quote[0].close || [];

        const historico = timestamps.map((ts, index) => ({
            timestamp: ts,
            bid: closes[index] ? closes[index].toFixed(4) : 0
        })).filter(item => item.bid > 0);

        cache.set(cacheKey, historico);
        res.json(historico);

    } catch (error) {
        console.error(`Erro /historico para ${req.query.moeda}:`, error.message);
        res.status(500).json({ error: 'Falha ao buscar o histórico.' });
    }
});

// 3. Rota de Conversão
app.get('/api/converter', async (req, res) => {
    try {
        const { moeda, valor } = req.query;
        if (!moeda || !valor || isNaN(valor)) {
            return res.status(400).json({ error: 'Parâmetros inválidos.' });
        }

        const cacheKey = `cotacao-${moeda}`;
        let cotacaoAtual = cache.get(cacheKey);

        if (!cotacaoAtual) {
            const symbol = getYahooSymbol(moeda);
            const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`);
            cotacaoAtual = response.data.chart.result[0].meta.regularMarketPrice;
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
        res.status(500).json({ error: 'Erro interno na conversão matemática.' });
    }
});

const PORT = 25000;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT} conectado ao Yahoo Finance`));
const express = require('express');
const app = express();
const PORT = 25000;

app.get('/api/cotacao', async (req, res) => {
  try {
    const response = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL");
    const data = await response.json();
    // Retorna apenas o valor necessário
    res.json({ valor: data.USDBRL.bid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar cotação' });
  }
});

// O '0.0.0.0' garante que o servidor aceite conexões externas da VPC
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
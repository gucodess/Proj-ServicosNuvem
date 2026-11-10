const { Client } = require('pg');

exports.handler = async (event) => {
    // 1. Extração dos parâmetros da Query String do API Gateway
    const queryParams = event.queryStringParameters || {};
    const dataInicio = queryParams.data_inicio; // Ex: '2026-10-25 00:00:00' (Domingo)
    const dataFim = queryParams.data_fim;       // Ex: '2026-10-31 23:59:59' (Sábado)
    const codigoMoeda = queryParams.moeda;      // Ex: 'USD'

    if (!dataInicio || !dataFim || !codigoMoeda) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Parâmetros 'data_inicio', 'data_fim' e 'moeda' são obrigatórios." })
        };
    }

    console.log("Host recebido:", process.env.DB_HOST);
    console.log("Tipo da senha recebida:", typeof process.env.DB_PASSWORD);

    // 2. Configuração do Client do PostgreSQL (Use variáveis de ambiente na AWS)
    const client = new Client({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME, // Continua como 'postgres'
        port: 5432,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();

        // 3. Execução da Query
        const query = `
            SELECT 
                m.codigo,
                m.nome,
                AVG(c.valor_compra) AS media_compra,
                AVG(c.valor_venda) AS media_venda
            FROM cambio.cotacao c
            INNER JOIN cambio.moeda m ON c.moeda_id = m.id
            WHERE c.coletado_em >= $1::timestamp 
              AND c.coletado_em <= $2::timestamp
              AND m.codigo = $3
            GROUP BY m.codigo, m.nome;
        `;
        
        const values = [dataInicio, dataFim, codigoMoeda];
        const res = await client.query(query, values);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(res.rows)
        };

    } catch (error) {
        console.error("Erro ao executar consulta:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erro interno ao gerar o relatório." })
        };
    } finally {
        await client.end();
    }
};
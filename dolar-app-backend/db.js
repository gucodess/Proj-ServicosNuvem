// Conexao com o RDS PostgreSQL (RF-01).
// Nenhuma credencial fica no codigo: tudo vem de variaveis de ambiente (.env, fora do Git).
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'cambio',
  port: Number(process.env.DB_PORT || 5432),
  max: 10,
  ssl: { rejectUnauthorized: false }, // o RDS exige SSL (PostgreSQL 15+)
});

module.exports = pool;

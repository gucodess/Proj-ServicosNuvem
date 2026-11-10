const { Pool } = require('pg');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const pool = new Pool({
  host: process.env.DB_HOST, user: process.env.DB_USER,
  password: process.env.DB_PASS, database: process.env.DB_NAME,
  port: 5432, ssl: { rejectUnauthorized: false },
});
const s3 = new S3Client({ region: 'us-east-1' });

const streamToString = async (stream) => {
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks).toString('utf-8');
};

exports.handler = async (event) => {
  const rec = event.Records[0].s3;
  const bucket = rec.bucket.name;
  const key = decodeURIComponent(rec.object.key.replace(/\+/g, ' '));
  const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const csv = await streamToString(obj.Body);
  const linhas = csv.trim().split('\n').filter(l => l.trim());
  let inseridas = 0;
  for (const linha of linhas) {
    const [codigo, compra, venda] = linha.split(',').map(s => s.trim());
    if (!codigo) continue;
    const m = await pool.query('SELECT id FROM moeda WHERE codigo = $1', [codigo]);
    if (m.rows.length === 0) continue;
    await pool.query(
      'INSERT INTO cotacao (moeda_id, valor_compra, valor_venda, fonte) VALUES ($1,$2,$3,$4)',
      [m.rows[0].id, compra, venda, 'csv-lambda']);
    inseridas++;
  }
  return { statusCode: 200, inseridas };
};

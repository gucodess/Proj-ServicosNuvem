// RF-02: upload de arquivo no S3 via URL pre-assinada, ligado a uma moeda.
// O arquivo NAO passa pelo backend: o backend so assina a URL e o cliente envia direto ao S3.
// Credenciais AWS vem da role da EC2 (LabInstanceProfile), nunca de chave no codigo.
const express = require('express');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const pool = require('../db');

const router = express.Router();

// ids sao inteiros: "abc" vira 400 em vez de erro 500 do PostgreSQL
router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'id deve ser numero inteiro' });
  next();
});
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET = process.env.S3_BUCKET;
const EXPIRA_SEG = 300; // 5 minutos

// 1) Gera a URL pre-assinada de PUT
router.post('/moedas/:id/upload-url', async (req, res) => {
  try {
    if (!BUCKET) return res.status(500).json({ error: 'S3_BUCKET nao configurado no .env' });
    const { filename, contentType } = req.body || {};
    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Envie "filename" e "contentType" no corpo JSON' });
    }
    const existe = await pool.query('SELECT 1 FROM moeda WHERE id = $1', [req.params.id]);
    if (existe.rows.length === 0) return res.status(404).json({ error: 'Moeda nao encontrada' });

    const nomeSeguro = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `moedas/${req.params.id}/${Date.now()}-${nomeSeguro}`;
    const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: EXPIRA_SEG });
    res.json({ uploadUrl, key, expiraEmSegundos: EXPIRA_SEG });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2) Depois do PUT no S3 dar 200, o cliente confirma e o backend grava a key na moeda
router.put('/moedas/:id/arquivo', async (req, res) => {
  try {
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ error: 'Envie "key" no corpo JSON' });
    const r = await pool.query(
      'UPDATE moeda SET arquivo_key = $1 WHERE id = $2 RETURNING id, codigo, arquivo_key',
      [key, req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Moeda nao encontrada' });
    res.json({ ok: true, ...r.rows[0] });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// 3) (verificacao) URL pre-assinada de GET para baixar o arquivo da moeda
router.get('/moedas/:id/arquivo-url', async (req, res) => {
  try {
    const r = await pool.query('SELECT arquivo_key FROM moeda WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Moeda nao encontrada' });
    if (!r.rows[0].arquivo_key) return res.status(404).json({ error: 'Moeda sem arquivo' });
    const url = await getSignedUrl(s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: r.rows[0].arquivo_key }), { expiresIn: EXPIRA_SEG });
    res.json({ downloadUrl: url, key: r.rows[0].arquivo_key });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

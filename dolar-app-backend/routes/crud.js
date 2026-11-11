// RF-01: CRUD das duas entidades relacionadas (moeda 1:N cotacao) no RDS.
const express = require('express');
const pool = require('../db');

const router = express.Router();

// ids sao inteiros: "abc" vira 400 em vez de erro 500 do PostgreSQL
router.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'id deve ser numero inteiro' });
  next();
});

// ---------- MOEDA ----------
router.get('/moedas', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM moeda ORDER BY id');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/moedas/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM moeda WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Moeda nao encontrada' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/moedas', async (req, res) => {
  try {
    const { codigo, nome, simbolo } = req.body || {};
    if (!codigo) return res.status(400).json({ error: 'Campo "codigo" e obrigatorio' });
    const r = await pool.query(
      'INSERT INTO moeda (codigo, nome, simbolo) VALUES ($1, $2, $3) RETURNING *',
      [codigo, nome || null, simbolo || null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/moedas/:id', async (req, res) => {
  try {
    const { codigo, nome, simbolo, ativo } = req.body || {};
    const r = await pool.query(
      `UPDATE moeda SET codigo = COALESCE($1, codigo), nome = COALESCE($2, nome),
              simbolo = COALESCE($3, simbolo), ativo = COALESCE($4, ativo)
        WHERE id = $5 RETURNING *`,
      [codigo, nome, simbolo, ativo, req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Moeda nao encontrada' });
    res.json(r.rows[0]);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/moedas/:id', async (req, res) => {
  try {
    // ON DELETE CASCADE na FK apaga as cotacoes da moeda junto
    const r = await pool.query('DELETE FROM moeda WHERE id = $1', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Moeda nao encontrada' });
    res.status(204).end();
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ---------- COTACAO (filha de moeda) ----------
router.get('/moedas/:id/cotacoes', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM cotacao WHERE moeda_id = $1 ORDER BY coletado_em DESC', [req.params.id]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/moedas/:id/cotacoes', async (req, res) => {
  try {
    const { valor_compra, valor_venda, fonte } = req.body || {};
    const r = await pool.query(
      `INSERT INTO cotacao (moeda_id, valor_compra, valor_venda, fonte)
       VALUES ($1, $2, $3, COALESCE($4, 'manual')) RETURNING *`,
      [req.params.id, valor_compra, valor_venda, fonte]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(400).json({ error: e.message }); } // FK invalida cai aqui
});

router.get('/cotacao/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM cotacao WHERE id = $1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Cotacao nao encontrada' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/cotacao/:id', async (req, res) => {
  try {
    const { valor_compra, valor_venda, fonte } = req.body || {};
    const r = await pool.query(
      `UPDATE cotacao SET valor_compra = COALESCE($1, valor_compra),
              valor_venda = COALESCE($2, valor_venda), fonte = COALESCE($3, fonte)
        WHERE id = $4 RETURNING *`,
      [valor_compra, valor_venda, fonte, req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Cotacao nao encontrada' });
    res.json(r.rows[0]);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/cotacao/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM cotacao WHERE id = $1', [req.params.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Cotacao nao encontrada' });
    res.status(204).end();
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;

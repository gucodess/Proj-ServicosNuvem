-- =====================================================================
-- Tabela: moeda  (lado "1" do relacionamento 1:N com cotacao)
-- Banco: postgres, schema public (PostgreSQL) - RDS cambio-pg
-- Projeto: dolar-app (Servicos em Nuvem - Mackenzie)
-- =====================================================================

CREATE TABLE moeda (
    id          SERIAL        PRIMARY KEY,
    codigo      VARCHAR(10)   NOT NULL,
    nome        VARCHAR(100),
    simbolo     VARCHAR(10),
    ativo       BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_em   TIMESTAMP     NOT NULL DEFAULT NOW(),
    arquivo_key VARCHAR(255)
);

-- Garante que nao existam duas moedas com o mesmo codigo (ex: 'USD')
ALTER TABLE moeda ADD CONSTRAINT uq_moeda_codigo UNIQUE (codigo);

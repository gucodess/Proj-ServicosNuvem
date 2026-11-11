-- =====================================================================
-- Tabela: cotacao  (lado "N" do relacionamento 1:N com moeda)
-- Banco: postgres, schema public (PostgreSQL) - RDS cambio-pg
-- Projeto: dolar-app (Servicos em Nuvem - Mackenzie)
-- =====================================================================

CREATE TABLE cotacao (
    id           BIGSERIAL      PRIMARY KEY,
    moeda_id     INTEGER        NOT NULL,
    valor_compra NUMERIC(14,4),
    valor_venda  NUMERIC(14,4),
    fonte        VARCHAR(50)    NOT NULL DEFAULT 'manual',
    coletado_em  TIMESTAMP      NOT NULL DEFAULT NOW(),

    -- Chave estrangeira: cada cotacao pertence a uma moeda.
    -- ON DELETE CASCADE: ao apagar a moeda, suas cotacoes somem junto.
    CONSTRAINT fk_cotacao_moeda
        FOREIGN KEY (moeda_id)
        REFERENCES moeda (id)
        ON DELETE CASCADE
);

-- Indice para acelerar as consultas por moeda (GET /moedas/:id/cotacoes)
CREATE INDEX idx_cotacao_moeda_id ON cotacao (moeda_id);

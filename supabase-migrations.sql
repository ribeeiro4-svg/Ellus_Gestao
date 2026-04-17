-- ============================================================
-- 001_create_tenants.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  contabilidade TEXT,
  logo_url    TEXT,
  plano       TEXT NOT NULL DEFAULT 'basico' CHECK (plano IN ('basico','pro','multi')),
  ativo       BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','tesoureiro','viewer')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: cada usuário só vê dados do seu tenant
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_own" ON tenants
  USING (id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "usuario_own_tenant" ON usuarios
  USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- ============================================================
-- 002_create_financeiro.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS lancamentos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  descricao   TEXT NOT NULL,
  categoria   TEXT NOT NULL DEFAULT 'Outros',
  tipo        TEXT NOT NULL CHECK (tipo IN ('receita','despesa')),
  valor       NUMERIC(12,2) NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('pago','aberto','parcial','cancelado')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lancamentos_tenant ON lancamentos(tenant_id);
CREATE INDEX idx_lancamentos_data ON lancamentos(data);
CREATE INDEX idx_lancamentos_tipo ON lancamentos(tipo);

ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lancamentos_tenant" ON lancamentos
  USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- ============================================================
-- 003_create_associados.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS associados (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo            TEXT NOT NULL,
  nome              TEXT NOT NULL,
  categoria         TEXT NOT NULL DEFAULT 'Associado',
  email             TEXT,
  telefone          TEXT,
  data_ingresso     DATE,
  mensalidade       NUMERIC(10,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo','inadimplente')),
  meses_atraso      INTEGER DEFAULT 0,
  ultimo_pagamento  DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, codigo)
);

CREATE INDEX idx_associados_tenant ON associados(tenant_id);
CREATE INDEX idx_associados_status ON associados(status);

ALTER TABLE associados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "associados_tenant" ON associados
  USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- ============================================================
-- 004_create_metas.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS metas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  meta             TEXT NOT NULL,
  responsavel      TEXT,
  prazo            DATE,
  valor_meta       NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_realizado  NUMERIC(12,2) NOT NULL DEFAULT 0,
  unidade          TEXT DEFAULT 'R$',
  status           TEXT NOT NULL DEFAULT 'nao_iniciada'
    CHECK (status IN ('atingida','em_andamento','nao_iniciada')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metas_tenant" ON metas
  USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- ============================================================
-- 005_create_projetos.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS projetos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  projeto     TEXT NOT NULL,
  responsavel TEXT,
  data_inicio DATE,
  prazo       DATE,
  orcamento   NUMERIC(12,2) NOT NULL DEFAULT 0,
  gasto       NUMERIC(12,2) NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'planejado'
    CHECK (status IN ('concluido','em_andamento','planejado','atrasado','cancelado')),
  descricao   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projetos_tenant" ON projetos
  USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- ============================================================
-- Trigger: auto-update updated_at em todas as tabelas
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lancamentos_updated BEFORE UPDATE ON lancamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_associados_updated BEFORE UPDATE ON associados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_metas_updated BEFORE UPDATE ON metas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projetos_updated BEFORE UPDATE ON projetos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 006_create_tenant_mapping.sql
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_id_mapping (
  id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir o ID padrão do Bruno para garantir que as Cron Jobs funcionem no MVP
INSERT INTO tenants (id, nome, slug) 
VALUES ('971f92af-a72b-4bc4-a8e0-333d712ce6a7', 'ACPROBEC', 'acprobec')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_id_mapping (id)
VALUES ('971f92af-a72b-4bc4-a8e0-333d712ce6a7')
ON CONFLICT (id) DO NOTHING;
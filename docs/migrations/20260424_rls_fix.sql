-- ============================================================
-- SPRINT 2 & 3: POLÍTICAS DE SEGURANÇA (RLS) PARA NOVAS TABELAS
-- Data: 24/04/2026
-- ============================================================

-- 1. Tabela de Períodos Contábeis
CREATE TABLE IF NOT EXISTS periodos_contabeis (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    competencia       DATE NOT NULL, -- Ex: 2026-04-01
    status            VARCHAR(20) DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
    data_fechamento   TIMESTAMPTZ,
    usuario_fechou    VARCHAR(120),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, competencia)
);

ALTER TABLE periodos_contabeis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "periodos_contabeis_tenant" ON periodos_contabeis;
CREATE POLICY "periodos_contabeis_tenant" ON periodos_contabeis
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- 2. Tabela de Centros de Custo (Contabil)
CREATE TABLE IF NOT EXISTS centros_custo_contabil (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    codigo            VARCHAR(30) NOT NULL,
    nome              VARCHAR(120) NOT NULL,
    tipo              VARCHAR(20) DEFAULT 'centro_custo' CHECK (tipo IN ('centro_custo', 'projeto', 'rubrica')),
    status            VARCHAR(20) DEFAULT 'ativo',
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, codigo)
);

ALTER TABLE centros_custo_contabil ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "centros_custo_tenant" ON centros_custo_contabil;
CREATE POLICY "centros_custo_tenant" ON centros_custo_contabil
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- 3. Adicionar coluna centro_custo_id em lancamentos_partidas se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lancamentos_partidas' AND column_name='centro_custo_id') THEN
        ALTER TABLE lancamentos_partidas ADD COLUMN centro_custo_id UUID REFERENCES centros_custo_contabil(id);
    END IF;
END $$;

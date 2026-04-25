-- SQL PARA CRIAR A TABELA DE PRESETS NO SUPABASE
-- Execute este comando no "SQL Editor" do seu painel Supabase para habilitar a persistência em nuvem.

CREATE TABLE IF NOT EXISTS fiscal_tributacao_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cfop TEXT,
    icms TEXT,
    pis TEXT,
    cofins TEXT,
    ipi TEXT,
    dest TEXT,
    conta TEXT,
    credito BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE fiscal_tributacao_presets ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam apenas presets do seu tenant
CREATE POLICY "fiscal_presets_tenant" ON fiscal_tributacao_presets
    FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Índices para performance
CREATE INDEX idx_fiscal_presets_tenant ON fiscal_tributacao_presets(tenant_id);

-- ============================================================
-- Fix: adicionar tenant_id em cobranca_configuracoes e cobranca_templates
-- Permite isolamento multi-tenant e políticas RLS corretas
-- ============================================================

-- 1. Adicionar tenant_id às tabelas que não tinham
ALTER TABLE cobranca_configuracoes
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE cobranca_templates
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE cobranca_acoes
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE cobranca_acordos
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 2. Preencher tenant_id com o tenant padrão ACPROBEC nas linhas existentes
UPDATE cobranca_configuracoes
  SET tenant_id = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  WHERE tenant_id IS NULL;

UPDATE cobranca_templates
  SET tenant_id = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  WHERE tenant_id IS NULL;

UPDATE cobranca_acoes
  SET tenant_id = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  WHERE tenant_id IS NULL;

UPDATE cobranca_acordos
  SET tenant_id = '971f92af-a72b-4bc4-a8e0-333d712ce6a7'
  WHERE tenant_id IS NULL;

-- 3. Habilitar RLS
ALTER TABLE cobranca_configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobranca_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobranca_acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobranca_acordos ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
DROP POLICY IF EXISTS "cobranca_config_tenant" ON cobranca_configuracoes;
CREATE POLICY "cobranca_config_tenant" ON cobranca_configuracoes
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "cobranca_templates_tenant" ON cobranca_templates;
CREATE POLICY "cobranca_templates_tenant" ON cobranca_templates
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "cobranca_acoes_tenant" ON cobranca_acoes;
CREATE POLICY "cobranca_acoes_tenant" ON cobranca_acoes
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

DROP POLICY IF EXISTS "cobranca_acordos_tenant" ON cobranca_acordos;
CREATE POLICY "cobranca_acordos_tenant" ON cobranca_acordos
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

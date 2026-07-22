-- Tabela para auditoria detalhada de ações no módulo financeiro (ex: Inadimplência)
CREATE TABLE IF NOT EXISTS financeiro_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  acao TEXT NOT NULL,
  detalhes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index para performance em buscas por tenant e data
CREATE INDEX IF NOT EXISTS idx_financeiro_logs_tenant_date ON financeiro_logs(tenant_id, created_at DESC);

-- ============================================================
-- create_adiantamentos.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS diretoria_adiantamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  diretor_id UUID NOT NULL REFERENCES diretoria(id) ON DELETE CASCADE,
  numero SERIAL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ADIANTAMENTO', 'EMPRESTIMO')),
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  parcelas INTEGER DEFAULT 1,
  valor_parcela NUMERIC(12,2),
  motivo TEXT,
  observacao TEXT,
  data_solicitacao TIMESTAMPTZ DEFAULT NOW(),
  data_aprovacao TIMESTAMPTZ,
  data_pagamento TIMESTAMPTZ,
  data_prevista_desconto TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'SOLICITADO' CHECK (status IN ('SOLICITADO', 'APROVADO', 'RECUSADO', 'PAGO', 'DESCONTADO', 'CANCELADO')),
  aprovado_por TEXT,
  forma_pagamento TEXT,
  conta_financeira_id UUID,
  lancamento_financeiro_id UUID,
  recibo_emitido BOOLEAN DEFAULT false,
  guia_emitida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX idx_dir_adiantamentos_tenant ON diretoria_adiantamentos(tenant_id);
CREATE INDEX idx_dir_adiantamentos_diretor ON diretoria_adiantamentos(diretor_id);

ALTER TABLE diretoria_adiantamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diretoria_adiantamentos_tenant" ON diretoria_adiantamentos
  USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS diretoria_config (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  max_percent_adiantamento NUMERIC(5,2) DEFAULT 40.00,
  permitir_emprestimo BOOLEAN DEFAULT true,
  max_valor_emprestimo NUMERIC(12,2),
  exigir_aprovacao_presidencia BOOLEAN DEFAULT true,
  exigir_aprovacao_tesouraria BOOLEAN DEFAULT true,
  permitir_parcelamento BOOLEAN DEFAULT true,
  max_parcelas INTEGER DEFAULT 12,
  categoria_adiantamento TEXT DEFAULT 'Adiantamento de Pró-labore',
  categoria_emprestimo TEXT DEFAULT 'Empréstimo à Diretoria',
  modelo_guia TEXT,
  modelo_recibo TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE diretoria_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diretoria_config_tenant" ON diretoria_config
  USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

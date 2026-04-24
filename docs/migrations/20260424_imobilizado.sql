-- ============================================================
-- SPRINT 1: MÓDULO DE ATIVO IMOBILIZADO
-- Data: 24/04/2026
-- ============================================================

-- 1. Criar Tabela de Parâmetros Contábeis Gerais
CREATE TABLE IF NOT EXISTS parametros_contabeis (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    regime_tributario     VARCHAR(20) DEFAULT 'imune' CHECK (regime_tributario IN ('imune', 'isenta', 'lucro_presumido')),
    
    -- Contas Padrão para Automações
    conta_fornecedores_id UUID REFERENCES plano_contas(id),
    conta_caixa_padrao_id UUID REFERENCES plano_contas(id),
    conta_banco_padrao_id UUID REFERENCES plano_contas(id),
    conta_superavit_id    UUID REFERENCES plano_contas(id),
    conta_deficit_id      UUID REFERENCES plano_contas(id),
    
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id)
);

-- RLS para parâmetros
ALTER TABLE parametros_contabeis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parametros_contabeis_tenant" ON parametros_contabeis
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- 2. Tabela de Ativos Imobilizados
CREATE TABLE IF NOT EXISTS ativos_imobilizados (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    codigo_patrimonio           VARCHAR(30) NOT NULL, -- Tombamento
    nome                        VARCHAR(120) NOT NULL,
    descricao                   TEXT,
    
    -- Valores e Datas
    data_aquisicao              DATE NOT NULL,
    valor_aquisicao             NUMERIC(15,2) NOT NULL CHECK (valor_aquisicao > 0),
    valor_residual              NUMERIC(15,2) DEFAULT 0 CHECK (valor_residual >= 0),
    
    -- Vida Útil (conforme NBC TG 27)
    vida_util_meses             INTEGER NOT NULL CHECK (vida_util_meses > 0),
    taxa_depreciacao_anual      NUMERIC(5,2), -- Opcional, cálculo automático se não houver
    
    -- Mapeamento Contábil (Analíticas)
    conta_imobilizado_id        UUID NOT NULL REFERENCES plano_contas(id),
    conta_depreciacao_acum_id   UUID NOT NULL REFERENCES plano_contas(id),
    conta_despesa_deprec_id     UUID NOT NULL REFERENCES plano_contas(id),
    
    -- Vinculação
    centro_custo_id             UUID REFERENCES centros_custo_contabil(id),
    projeto_id                  UUID REFERENCES centros_custo_contabil(id), -- Projetos são CCs tipo 'projeto'
    
    status                      VARCHAR(20) DEFAULT 'ativo'
        CHECK (status IN ('ativo', 'baixado', 'em_manutencao', 'alienado')),
    
    -- Auditoria
    usuario_id                  UUID,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, codigo_patrimonio)
);

CREATE INDEX IF NOT EXISTS idx_ativos_tenant ON ativos_imobilizados(tenant_id);

-- 3. Log de Depreciações Mensais (para evitar duplicidade)
CREATE TABLE IF NOT EXISTS ativos_depreciacoes_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    ativo_id        UUID NOT NULL REFERENCES ativos_imobilizados(id) ON DELETE CASCADE,
    competencia     DATE NOT NULL, -- Ex: 2026-04-01
    valor_cota      NUMERIC(15,2) NOT NULL,
    lancamento_id   UUID REFERENCES lancamentos_contabeis(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ativo_id, competencia)
);

-- Trigger para updated_at
CREATE TRIGGER trg_ativos_imobilizados_updated BEFORE UPDATE ON ativos_imobilizados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE ativos_imobilizados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ativos_imobilizados_tenant" ON ativos_imobilizados
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

ALTER TABLE ativos_depreciacoes_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ativos_logs_tenant" ON ativos_depreciacoes_logs
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- ============================================================
-- MIGRAÇÃO: MÓDULOS FISCAL E CONTÁBIL
-- Versão: 1.1 | Data: Abril/2026
-- Aplicar manualmente no Supabase SQL Editor
-- ============================================================

-- Função utilitária para atualizar o timestamp de 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================

-- ============================================================
-- MÓDULO FISCAL — TABELAS
-- ============================================================

-- NF-e importadas (cabeçalho)
CREATE TABLE IF NOT EXISTS nfe_entradas (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  periodo_apuracao        DATE NOT NULL,
  chave_acesso            VARCHAR(44),
  numero_nf               VARCHAR(9) NOT NULL,
  serie                   VARCHAR(3),
  data_emissao            DATE NOT NULL,
  data_entrada            DATE,
  cnpj_emitente           VARCHAR(14) NOT NULL,
  nome_emitente           VARCHAR(120),
  uf_emitente             CHAR(2),
  crt_emitente            CHAR(1),
  nat_operacao            VARCHAR(120),
  valor_produtos          NUMERIC(15,2) DEFAULT 0,
  valor_frete             NUMERIC(15,2) DEFAULT 0,
  valor_seguro            NUMERIC(15,2) DEFAULT 0,
  valor_desconto          NUMERIC(15,2) DEFAULT 0,
  valor_ipi               NUMERIC(15,2) DEFAULT 0,
  valor_total             NUMERIC(15,2) NOT NULL DEFAULT 0,
  valor_icms              NUMERIC(15,2) DEFAULT 0,
  valor_pis               NUMERIC(15,2) DEFAULT 0,
  valor_cofins            NUMERIC(15,2) DEFAULT 0,
  inf_complementar        TEXT,
  xml_original            TEXT,
  status_escrituracao     VARCHAR(30) DEFAULT 'pendente'
    CHECK (status_escrituracao IN ('pendente','em_andamento','escriturada','com_inconsistencia')),
  status_conciliacao      VARCHAR(30) DEFAULT 'pendente'
    CHECK (status_conciliacao IN ('pendente','conciliada','parcial','divergencia')),
  status_sefaz            VARCHAR(20) DEFAULT 'autorizada',
  protocolo_autorizacao   VARCHAR(60),
  financeiro_lancamento_id UUID,
  observacoes_fiscais     TEXT,
  usuario_escriturou      UUID,
  data_escrituracao       TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nfe_entradas_tenant ON nfe_entradas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nfe_entradas_periodo ON nfe_entradas(periodo_apuracao);
CREATE INDEX IF NOT EXISTS idx_nfe_entradas_status ON nfe_entradas(status_escrituracao);
CREATE INDEX IF NOT EXISTS idx_nfe_entradas_cnpj ON nfe_entradas(cnpj_emitente);

ALTER TABLE nfe_entradas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nfe_entradas_tenant" ON nfe_entradas
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Itens das NF-e (um registro por produto)
CREATE TABLE IF NOT EXISTS nfe_entradas_itens (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nfe_entrada_id          UUID NOT NULL REFERENCES nfe_entradas(id) ON DELETE CASCADE,
  numero_item             INTEGER NOT NULL,
  codigo_produto          VARCHAR(60),
  codigo_ean              VARCHAR(14),
  descricao_produto       VARCHAR(200) NOT NULL,
  ncm                     VARCHAR(8),
  cest                    VARCHAR(7),
  cfop_nfe                VARCHAR(4),
  cfop_escrituracao       VARCHAR(4),
  unidade_comercial       VARCHAR(6),
  quantidade              NUMERIC(15,4) DEFAULT 0,
  valor_unitario          NUMERIC(21,10) DEFAULT 0,
  valor_produto           NUMERIC(15,2) DEFAULT 0,
  valor_frete             NUMERIC(15,2) DEFAULT 0,
  valor_seguro            NUMERIC(15,2) DEFAULT 0,
  valor_desconto          NUMERIC(15,2) DEFAULT 0,
  valor_outro             NUMERIC(15,2) DEFAULT 0,
  -- ICMS
  orig_icms               CHAR(1),
  cst_icms                VARCHAR(3),
  valor_bc_icms           NUMERIC(15,2) DEFAULT 0,
  aliq_icms               NUMERIC(5,2) DEFAULT 0,
  valor_icms              NUMERIC(15,2) DEFAULT 0,
  valor_icms_st           NUMERIC(15,2) DEFAULT 0,
  -- IPI
  cst_ipi                 VARCHAR(2),
  aliq_ipi                NUMERIC(5,2) DEFAULT 0,
  valor_ipi               NUMERIC(15,2) DEFAULT 0,
  -- PIS
  cst_pis                 VARCHAR(2),
  aliq_pis                NUMERIC(5,2) DEFAULT 0,
  valor_pis               NUMERIC(15,2) DEFAULT 0,
  -- COFINS
  cst_cofins              VARCHAR(2),
  aliq_cofins             NUMERIC(5,2) DEFAULT 0,
  valor_cofins            NUMERIC(15,2) DEFAULT 0,
  -- Classificação fiscal
  destinacao_item         VARCHAR(2),
  aproveitamento_credito  BOOLEAN DEFAULT FALSE,
  motivo_nao_aproveitamento VARCHAR(100),
  obs_fiscal              TEXT,
  conta_contabil_id       UUID,
  centro_custo_ref        TEXT,
  -- Status
  classificado            BOOLEAN DEFAULT FALSE,
  data_classificacao      TIMESTAMPTZ,
  UNIQUE(nfe_entrada_id, numero_item)
);

CREATE INDEX IF NOT EXISTS idx_nfe_itens_nfe ON nfe_entradas_itens(nfe_entrada_id);

-- Regras de memorização fiscal (motor de sugestões)
CREATE TABLE IF NOT EXISTS regras_classificacao_fiscal (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cnpj_emitente           VARCHAR(14),
  ncm                     VARCHAR(8),
  codigo_produto_emitente VARCHAR(60),
  cfop_sugerido           VARCHAR(4),
  cst_icms_sugerido       VARCHAR(3),
  cst_ipi_sugerido        VARCHAR(2),
  cst_pis_sugerido        VARCHAR(2),
  cst_cofins_sugerido     VARCHAR(2),
  destinacao_sugerida     VARCHAR(2),
  total_usos              INTEGER DEFAULT 1,
  total_confirmacoes      INTEGER DEFAULT 0,
  confianca               NUMERIC(5,2) DEFAULT 0,
  ultima_atualizacao      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE regras_classificacao_fiscal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regras_fiscal_tenant" ON regras_classificacao_fiscal
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Períodos de apuração fiscal
CREATE TABLE IF NOT EXISTS periodos_apuracao (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  competencia             DATE NOT NULL,
  status                  VARCHAR(20) DEFAULT 'aberto'
    CHECK (status IN ('aberto','em_escrituracao','fechado','transmitido')),
  data_fechamento         TIMESTAMPTZ,
  usuario_fechou          UUID,
  arquivo_sped_gerado     BOOLEAN DEFAULT FALSE,
  data_geracao_sped       TIMESTAMPTZ,
  observacoes             TEXT,
  UNIQUE(tenant_id, competencia)
);

ALTER TABLE periodos_apuracao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "periodos_apuracao_tenant" ON periodos_apuracao
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- ============================================================
-- MÓDULO ESTOQUE — TABELAS
-- ============================================================

-- Depósitos/almoxarifados
CREATE TABLE IF NOT EXISTS depositos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome          VARCHAR(60) NOT NULL,
  descricao     TEXT,
  responsavel   VARCHAR(60),
  ativo         BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE depositos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "depositos_tenant" ON depositos
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Cadastro de produtos
CREATE TABLE IF NOT EXISTS produtos (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo_interno              VARCHAR(30) NOT NULL,
  codigo_fornecedor           VARCHAR(60),
  codigo_ean                  VARCHAR(14),
  descricao                   VARCHAR(200) NOT NULL,
  descricao_complementar      TEXT,
  ncm                         VARCHAR(8),
  cest                        VARCHAR(7),
  origem_fiscal               CHAR(1) DEFAULT '0',
  unidade_medida              VARCHAR(6) NOT NULL DEFAULT 'UN',
  tipo_produto                VARCHAR(30) NOT NULL DEFAULT 'consumo'
    CHECK (tipo_produto IN ('consumo','distribuicao','insumo_projeto','ativo_imobilizado')),
  destinacao_padrao           VARCHAR(2) DEFAULT '3',
  controla_estoque            BOOLEAN DEFAULT TRUE,
  estoque_minimo              NUMERIC(15,4) DEFAULT 0,
  estoque_maximo              NUMERIC(15,4),
  ponto_pedido                NUMERIC(15,4),
  custo_medio_ponderado       NUMERIC(21,10) DEFAULT 0,
  ultimo_custo_compra         NUMERIC(21,10) DEFAULT 0,
  data_ultima_compra          DATE,
  cnpj_ultimo_fornecedor      VARCHAR(14),
  controla_lote               BOOLEAN DEFAULT FALSE,
  controla_validade           BOOLEAN DEFAULT FALSE,
  ativo                       BOOLEAN DEFAULT TRUE,
  observacoes                 TEXT,
  criado_via                  VARCHAR(20) DEFAULT 'manual',
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, codigo_interno)
);

CREATE INDEX IF NOT EXISTS idx_produtos_tenant ON produtos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ncm ON produtos(ncm);

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produtos_tenant" ON produtos
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Saldos de estoque (posição atual)
CREATE TABLE IF NOT EXISTS estoque_saldo (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  produto_id      UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  deposito_id     UUID REFERENCES depositos(id),
  quantidade      NUMERIC(15,4) NOT NULL DEFAULT 0,
  custo_medio     NUMERIC(21,10) NOT NULL DEFAULT 0,
  data_ultima_mov DATE,
  UNIQUE(tenant_id, produto_id, deposito_id)
);

ALTER TABLE estoque_saldo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estoque_saldo_tenant" ON estoque_saldo
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Movimentações (Kardex)
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  produto_id          UUID NOT NULL REFERENCES produtos(id),
  deposito_id         UUID REFERENCES depositos(id),
  tipo_mov            VARCHAR(10) NOT NULL CHECK (tipo_mov IN ('ENTRADA','SAIDA','AJUSTE','TRANSFERENCIA')),
  natureza            VARCHAR(40) NOT NULL,
  quantidade          NUMERIC(15,4) NOT NULL,
  custo_unitario      NUMERIC(21,10) NOT NULL DEFAULT 0,
  saldo_qtd_antes     NUMERIC(15,4),
  cmp_antes           NUMERIC(21,10),
  saldo_qtd_depois    NUMERIC(15,4),
  cmp_depois          NUMERIC(21,10),
  origem_tipo         VARCHAR(30),
  nfe_entrada_id      UUID REFERENCES nfe_entradas(id),
  historico           VARCHAR(200),
  documento_referencia VARCHAR(60),
  usuario_nome        VARCHAR(120),
  projeto_ref         VARCHAR(60),
  beneficiario_nome   VARCHAR(120),
  data_movimento      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estoque_mov_tenant ON estoque_movimentacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_produto ON estoque_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_data ON estoque_movimentacoes(data_movimento);

ALTER TABLE estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estoque_mov_tenant" ON estoque_movimentacoes
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Baixas/Requisições de saída
CREATE TABLE IF NOT EXISTS estoque_baixas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero_requisicao   VARCHAR(20) NOT NULL,
  tipo                VARCHAR(30) NOT NULL
    CHECK (tipo IN ('consumo_interno','distribuicao_associado','insumo_projeto','devolucao_fornecedor','ajuste_inventario')),
  data_baixa          DATE NOT NULL DEFAULT CURRENT_DATE,
  solicitante         VARCHAR(120),
  aprovador           VARCHAR(120),
  projeto_ref         VARCHAR(60),
  beneficiario_nome   VARCHAR(120),
  beneficiario_cpf    VARCHAR(11),
  status              VARCHAR(20) DEFAULT 'rascunho'
    CHECK (status IN ('rascunho','aprovada','atendida','cancelada')),
  observacoes         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, numero_requisicao)
);

ALTER TABLE estoque_baixas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estoque_baixas_tenant" ON estoque_baixas
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Itens das baixas
CREATE TABLE IF NOT EXISTS estoque_baixas_itens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baixa_id        UUID NOT NULL REFERENCES estoque_baixas(id) ON DELETE CASCADE,
  produto_id      UUID NOT NULL REFERENCES produtos(id),
  quantidade      NUMERIC(15,4) NOT NULL,
  custo_unitario  NUMERIC(21,10) DEFAULT 0,
  observacao      VARCHAR(200)
);

-- ============================================================
-- MÓDULO CONTÁBIL — TABELAS
-- ============================================================

-- Plano de Contas (ITG 2002 R1)
CREATE TABLE IF NOT EXISTS plano_contas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo                VARCHAR(30) NOT NULL,
  codigo_reduzido       VARCHAR(10),
  descricao             VARCHAR(200) NOT NULL,
  nivel                 INTEGER NOT NULL CHECK (nivel BETWEEN 1 AND 7),
  conta_pai_id          UUID REFERENCES plano_contas(id),
  tipo                  VARCHAR(12) NOT NULL DEFAULT 'sintetica'
    CHECK (tipo IN ('sintetica','analitica')),
  natureza              VARCHAR(10) NOT NULL DEFAULT 'devedora'
    CHECK (natureza IN ('devedora','credora')),
  classificacao         VARCHAR(25) NOT NULL
    CHECK (classificacao IN ('ativo','passivo','patrimonio_social','ingresso','despesa')),
  grupo_bp              VARCHAR(30),
  grupo_dsd             VARCHAR(40),
  codigo_referencial_rfb VARCHAR(30),
  aceita_lancamentos    BOOLEAN DEFAULT FALSE,
  ativa                 BOOLEAN DEFAULT TRUE,
  UNIQUE(tenant_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_plano_contas_tenant ON plano_contas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_plano_contas_pai ON plano_contas(conta_pai_id);

ALTER TABLE plano_contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plano_contas_tenant" ON plano_contas
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Centros de Custo e Projetos Contábeis
CREATE TABLE IF NOT EXISTS centros_custo_contabil (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo      VARCHAR(20) NOT NULL,
  descricao   VARCHAR(120) NOT NULL,
  tipo        VARCHAR(20) DEFAULT 'administrativo'
    CHECK (tipo IN ('atividade_fim','administrativo','projeto','evento')),
  numero_convenio    VARCHAR(60),
  orgao_financiador  VARCHAR(120),
  data_inicio        DATE,
  data_termino       DATE,
  valor_aprovado     NUMERIC(15,2),
  status      VARCHAR(20) DEFAULT 'ativo'
    CHECK (status IN ('ativo','encerrado','suspenso','em_prestacao_contas')),
  ativo       BOOLEAN DEFAULT TRUE,
  UNIQUE(tenant_id, codigo)
);

ALTER TABLE centros_custo_contabil ENABLE ROW LEVEL SECURITY;
CREATE POLICY "centros_custo_tenant" ON centros_custo_contabil
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Períodos Contábeis
CREATE TABLE IF NOT EXISTS periodos_contabeis (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  competencia     DATE NOT NULL,
  tipo            VARCHAR(10) NOT NULL DEFAULT 'mensal',
  status          VARCHAR(30) DEFAULT 'aberto'
    CHECK (status IN ('aberto','em_escrituracao','fechado','ecd_transmitida')),
  data_fechamento TIMESTAMPTZ,
  usuario_fechou  VARCHAR(120),
  UNIQUE(tenant_id, competencia)
);

ALTER TABLE periodos_contabeis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "periodos_contabeis_tenant" ON periodos_contabeis
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Lançamentos Contábeis (Livro Diário)
CREATE TABLE IF NOT EXISTS lancamentos_contabeis (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero_lancamento VARCHAR(20) NOT NULL,
  data_lancamento   DATE NOT NULL,
  data_competencia  DATE NOT NULL,
  tipo              VARCHAR(20) DEFAULT 'normal'
    CHECK (tipo IN ('normal','estorno','provisao','encerramento','ajuste','abertura')),
  historico         VARCHAR(255) NOT NULL,
  documento_tipo    VARCHAR(20),
  documento_numero  VARCHAR(60),
  origem_tipo       VARCHAR(30),
  origem_id         UUID,
  centro_custo_id   UUID REFERENCES centros_custo_contabil(id),
  status            VARCHAR(20) DEFAULT 'confirmado'
    CHECK (status IN ('rascunho','confirmado','estornado')),
  estorno_do_id     UUID REFERENCES lancamentos_contabeis(id),
  usuario_nome      VARCHAR(120),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lanc_cont_tenant ON lancamentos_contabeis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lanc_cont_data ON lancamentos_contabeis(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lanc_cont_competencia ON lancamentos_contabeis(data_competencia);

ALTER TABLE lancamentos_contabeis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lanc_contabeis_tenant" ON lancamentos_contabeis
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Partidas dos Lançamentos (D/C)
CREATE TABLE IF NOT EXISTS lancamentos_partidas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id     UUID NOT NULL REFERENCES lancamentos_contabeis(id) ON DELETE CASCADE,
  conta_id          UUID NOT NULL REFERENCES plano_contas(id),
  tipo_partida      CHAR(1) NOT NULL CHECK (tipo_partida IN ('D','C')),
  valor             NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  centro_custo_id   UUID REFERENCES centros_custo_contabil(id),
  historico_partida VARCHAR(255),
  ordem             INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_partidas_lancamento ON lancamentos_partidas(lancamento_id);
CREATE INDEX IF NOT EXISTS idx_partidas_conta ON lancamentos_partidas(conta_id);

-- Saldos Mensais por Conta (cache de performance)
CREATE TABLE IF NOT EXISTS saldos_contas_mensais (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conta_id        UUID NOT NULL REFERENCES plano_contas(id),
  competencia     DATE NOT NULL,
  saldo_anterior  NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_debitos   NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_creditos  NUMERIC(15,2) NOT NULL DEFAULT 0,
  UNIQUE(tenant_id, conta_id, competencia)
);

ALTER TABLE saldos_contas_mensais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saldos_contas_tenant" ON saldos_contas_mensais
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Configurações Contábeis por Tenant
CREATE TABLE IF NOT EXISTS configuracoes_contabeis (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conta_fornecedores_id UUID REFERENCES plano_contas(id),
  conta_caixa_padrao_id UUID REFERENCES plano_contas(id),
  conta_banco_padrao_id UUID REFERENCES plano_contas(id),
  conta_superavit_id    UUID REFERENCES plano_contas(id),
  conta_deficit_id      UUID REFERENCES plano_contas(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

ALTER TABLE configuracoes_contabeis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_contabeis_tenant" ON configuracoes_contabeis
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE TRIGGER trg_nfe_entradas_updated BEFORE UPDATE ON nfe_entradas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_produtos_updated BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_config_contabeis_updated BEFORE UPDATE ON configuracoes_contabeis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FIM DA MIGRAÇÃO
-- Aplique este arquivo no Supabase SQL Editor
-- ============================================================

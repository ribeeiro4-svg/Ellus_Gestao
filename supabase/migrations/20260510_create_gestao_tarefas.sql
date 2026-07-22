-- ============================================================
-- 20260510_create_gestao_tarefas.sql
-- ============================================================

-- Tarefas
CREATE TABLE IF NOT EXISTS tarefas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  descricao       TEXT,
  responsavel_id  UUID, -- Removido FK para permitir vincular a Diretores ou Usuários
  status          TEXT NOT NULL DEFAULT 'A Fazer' CHECK (status IN ('A Fazer', 'Em Andamento', 'Aguardando', 'Concluído')),
  prioridade      TEXT NOT NULL DEFAULT 'Média' CHECK (prioridade IN ('Alta', 'Média', 'Baixa')),
  categoria       TEXT,
  prazo           DATE,
  criado_por      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tarefas_tenant ON tarefas(tenant_id);
CREATE INDEX idx_tarefas_status ON tarefas(status);
CREATE INDEX idx_tarefas_responsavel ON tarefas(responsavel_id);

ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tarefas_tenant" ON tarefas
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Comentários das tarefas
CREATE TABLE IF NOT EXISTS tarefa_comentarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tarefa_id   UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
  autor_id    UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  texto       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comentarios_tarefa ON tarefa_comentarios(tarefa_id);

ALTER TABLE tarefa_comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tarefa_comentarios_tenant" ON tarefa_comentarios
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Modelos de mensagem
CREATE TABLE IF NOT EXISTS modelos_mensagem (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  categoria       TEXT,
  texto           TEXT NOT NULL,
  variaveis_json  JSONB DEFAULT '[]',
  criado_por      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_modelos_tenant ON modelos_mensagem(tenant_id);

ALTER TABLE modelos_mensagem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modelos_mensagem_tenant" ON modelos_mensagem
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Formas de resolução
CREATE TABLE IF NOT EXISTS resolucoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  categoria       TEXT,
  conteudo        TEXT NOT NULL,
  tags_json       JSONB DEFAULT '[]',
  favorito        BOOLEAN DEFAULT FALSE,
  visualizacoes   INTEGER DEFAULT 0,
  criado_por      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resolucoes_tenant ON resolucoes(tenant_id);

ALTER TABLE resolucoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resolucoes_tenant" ON resolucoes
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER trg_tarefas_updated BEFORE UPDATE ON tarefas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_modelos_mensagem_updated BEFORE UPDATE ON modelos_mensagem
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_resolucoes_updated BEFORE UPDATE ON resolucoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

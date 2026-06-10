
-- ============================================================
-- 20260510_fix_gestao_tarefas_rls.sql
-- ============================================================

-- Remover FKs restritivas para permitir Diretores também
ALTER TABLE tarefas DROP CONSTRAINT IF EXISTS tarefas_criado_por_fkey;
ALTER TABLE tarefa_comentarios DROP CONSTRAINT IF EXISTS tarefa_comentarios_autor_id_fkey;
ALTER TABLE modelos_mensagem DROP CONSTRAINT IF EXISTS modelos_mensagem_criado_por_fkey;
ALTER TABLE resolucoes DROP CONSTRAINT IF EXISTS resolucoes_criado_por_fkey;

-- Atualizar Políticas RLS para incluir Diretores
-- Tarefas
DROP POLICY IF EXISTS "tarefas_tenant" ON tarefas;
CREATE POLICY "tarefas_tenant" ON tarefas
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid())
    OR
    tenant_id IN (SELECT tenant_id FROM diretoria WHERE id = auth.uid())
  );

-- Comentários
DROP POLICY IF EXISTS "tarefa_comentarios_tenant" ON tarefa_comentarios;
CREATE POLICY "tarefa_comentarios_tenant" ON tarefa_comentarios
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid())
    OR
    tenant_id IN (SELECT tenant_id FROM diretoria WHERE id = auth.uid())
  );

-- Modelos
DROP POLICY IF EXISTS "modelos_mensagem_tenant" ON modelos_mensagem;
CREATE POLICY "modelos_mensagem_tenant" ON modelos_mensagem
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid())
    OR
    tenant_id IN (SELECT tenant_id FROM diretoria WHERE id = auth.uid())
  );

-- Resoluções
DROP POLICY IF EXISTS "resolucoes_tenant" ON resolucoes;
CREATE POLICY "resolucoes_tenant" ON resolucoes
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid())
    OR
    tenant_id IN (SELECT tenant_id FROM diretoria WHERE id = auth.uid())
  );

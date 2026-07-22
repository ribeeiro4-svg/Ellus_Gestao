-- Remover políticas antigas
DROP POLICY IF EXISTS "tenant_isolation_templates" ON public.comunicados_templates;
DROP POLICY IF EXISTS "tenant_isolation_historico" ON public.comunicados_historico;

-- Templates
CREATE POLICY "tenant_isolation_templates_select" ON public.comunicados_templates
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "tenant_isolation_templates_insert" ON public.comunicados_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tenant_isolation_templates_update" ON public.comunicados_templates
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "tenant_isolation_templates_delete" ON public.comunicados_templates
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

-- Histórico
CREATE POLICY "tenant_isolation_historico_select" ON public.comunicados_historico
  FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "tenant_isolation_historico_insert" ON public.comunicados_historico
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tenant_isolation_historico_update" ON public.comunicados_historico
  FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "tenant_isolation_historico_delete" ON public.comunicados_historico
  FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

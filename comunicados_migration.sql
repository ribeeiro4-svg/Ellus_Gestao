-- Tabela de Templates de Comunicados
CREATE TABLE IF NOT EXISTS public.comunicados_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'geral',
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  criado_por TEXT
);

-- Tabela de Histórico de Comunicados
CREATE TABLE IF NOT EXISTS public.comunicados_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  data_envio TIMESTAMPTZ DEFAULT now(),
  associado_id TEXT,
  associado_nome TEXT NOT NULL,
  associado_telefone TEXT NOT NULL,
  template_id UUID REFERENCES public.comunicados_templates(id) ON DELETE SET NULL,
  template_nome TEXT NOT NULL,
  conteudo_enviado TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'whatsapp_wame',
  status TEXT NOT NULL DEFAULT 'iniciado',
  usuario_nome TEXT NOT NULL,
  usuario_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.comunicados_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicados_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_templates" ON public.comunicados_templates
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "tenant_isolation_historico" ON public.comunicados_historico
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));

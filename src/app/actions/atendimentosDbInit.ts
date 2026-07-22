'use server'

export async function initAtendimentosDbAction() {
  const { createServerSupabase } = await import('@/lib/supabase/server')
  const sb = await createServerSupabase()

  const sql = `
    CREATE TABLE IF NOT EXISTS atendimentos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL,
      associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
      data_agendamento TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'agendado',
      responsavel_setor TEXT,
      previsao_inclusao_hgu TEXT,
      pagamento_adesao_forma TEXT,
      checklist_titular JSONB DEFAULT '{}'::jsonb,
      dependentes JSONB DEFAULT '[]'::jsonb,
      etapas_concluidas JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE atendimentos ENABLE ROW LEVEL SECURITY;

    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'atendimentos' AND policyname = 'atendimentos_tenant') THEN
        CREATE POLICY "atendimentos_tenant" ON atendimentos FOR ALL USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));
      END IF;
    END $$;

    NOTIFY pgrst, 'reload schema';
  `

  try {
    const { error } = await sb.rpc('execute_sql', { sql })
    if (error) {
      console.error('Erro ao inicializar banco de atendimentos:', error)
      return { error: error.message }
    }
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

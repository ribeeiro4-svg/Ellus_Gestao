import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const sbAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const sql = `
      CREATE TABLE IF NOT EXISTS historico_novos_associados (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL,
        nome_completo TEXT NOT NULL,
        cpf TEXT NOT NULL,
        telefone TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE historico_novos_associados ENABLE ROW LEVEL SECURITY;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'historico_novos_associados' AND policyname = 'historico_adesao_tenant'
        ) THEN
          CREATE POLICY "historico_adesao_tenant"
          ON historico_novos_associados FOR ALL
          USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));
        END IF;
      END $$;

      GRANT ALL ON TABLE historico_novos_associados TO authenticated;
      GRANT ALL ON TABLE historico_novos_associados TO service_role;

      NOTIFY pgrst, 'reload schema';
    `

    const { error } = await sbAdmin.rpc('exec_sql', { sql_query: sql })

    if (error) {
      return NextResponse.json({
        error: error.message,
        tip: 'Execute o SQL manualmente no Supabase SQL Editor.',
        sql
      })
    }

    return NextResponse.json({ success: true, message: 'Tabela historico_novos_associados criada com sucesso!' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}

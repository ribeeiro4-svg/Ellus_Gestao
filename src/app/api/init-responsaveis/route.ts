import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const sbAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const sql = `
      CREATE TABLE IF NOT EXISTS responsaveis_atendimento (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL,
        nome TEXT NOT NULL,
        telefone TEXT,
        tipo TEXT DEFAULT 'Atendimento Presencial',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE responsaveis_atendimento ENABLE ROW LEVEL SECURITY;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE tablename = 'responsaveis_atendimento' AND policyname = 'responsaveis_tenant'
        ) THEN
          CREATE POLICY "responsaveis_tenant"
          ON responsaveis_atendimento FOR ALL
          USING (tenant_id IN (SELECT tenant_id FROM usuarios WHERE id = auth.uid()));
        END IF;
      END $$;

      GRANT ALL ON TABLE responsaveis_atendimento TO authenticated;
      GRANT ALL ON TABLE responsaveis_atendimento TO service_role;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'atendimentos' AND column_name = 'responsavel_id'
        ) THEN
          ALTER TABLE atendimentos
          ADD COLUMN responsavel_id UUID REFERENCES responsaveis_atendimento(id) ON DELETE SET NULL;
        END IF;
      END $$;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'responsaveis_atendimento' AND column_name = 'tipo'
        ) THEN
          ALTER TABLE responsaveis_atendimento
          ADD COLUMN tipo TEXT DEFAULT 'Atendimento Presencial';
        END IF;
      END $$;

      NOTIFY pgrst, 'reload schema';
    `

    const { error } = await sbAdmin.rpc('exec_sql', { sql_query: sql })

    if (error) {
      return NextResponse.json({
        error: error.message,
        tip: "Execute o SQL manualmente no Supabase SQL Editor.",
        sql
      })
    }

    return NextResponse.json({ success: true, message: 'Tabela responsaveis_atendimento criada com sucesso!' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}

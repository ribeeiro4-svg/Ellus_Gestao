const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    console.error('URL ou chave não encontradas no .env.local')
    process.exit(1)
  }

  const sbAdmin = createClient(url, key)

  const sql = `
    CREATE TABLE IF NOT EXISTS responsaveis_atendimento (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      nome TEXT NOT NULL,
      telefone TEXT,
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

    NOTIFY pgrst, 'reload schema';
  `

  console.log('Executando query no Supabase...')
  const { data, error } = await sbAdmin.rpc('exec_sql', { sql_query: sql })

  if (error) {
    console.error('ERRO:', error.message)
    console.log('\\nPor favor, execute o código SQL contido neste script manualmente no Supabase.')
  } else {
    console.log('SUCESSO! Tabela responsaveis_atendimento criada e configurada com sucesso.')
  }
}

run()

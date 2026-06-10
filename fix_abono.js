const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    -- Adicionar colunas se não existirem
    ALTER TABLE associados ADD COLUMN IF NOT EXISTS abono_motivo TEXT;
    ALTER TABLE associados ADD COLUMN IF NOT EXISTS abono_usuario TEXT;

    -- Comentários para documentação
    COMMENT ON COLUMN associados.abono_motivo IS 'Motivo pelo qual o associado foi abonado (01, 02 ou 03)';
    COMMENT ON COLUMN associados.abono_usuario IS 'Usuário que realizou o abono';
    
    -- Atualizar o check constraint para permitir abonado
    ALTER TABLE associados DROP CONSTRAINT IF EXISTS associados_status_check;
    ALTER TABLE associados ADD CONSTRAINT associados_status_check CHECK (status = ANY (ARRAY['ativo'::text, 'inativo'::text, 'inadimplente'::text, 'pendente'::text, 'suspenso'::text, 'abonado'::text]));
    
    -- Recarrega o cache do PostgREST
    NOTIFY pgrst, 'reload schema';
  `;

  const { data, error } = await supabase.rpc('execute_sql', { sql });
  
  if (error) {
    console.error('Erro ao executar SQL:', error);
  } else {
    console.log('SQL executado com sucesso:', data);
  }
}

run();

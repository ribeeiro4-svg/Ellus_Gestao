import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const sbAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const sql = `
      CREATE TABLE IF NOT EXISTS bens_duraveis (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL,
        nfe_id UUID,
        nfe_item_id UUID,
        descricao VARCHAR NOT NULL,
        codigo_interno VARCHAR,
        data_aquisicao DATE,
        valor_aquisicao NUMERIC(15,2),
        vida_util_meses INTEGER,
        status VARCHAR DEFAULT 'pendente_analise',
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bens_duraveis_manutencoes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL,
        bem_id UUID REFERENCES bens_duraveis(id) ON DELETE CASCADE,
        data_ocorrencia DATE NOT NULL,
        tipo VARCHAR NOT NULL,
        descricao TEXT NOT NULL,
        custo NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Correção de limites de caracteres que causam erro na escrituração
      ALTER TABLE nfe_entradas_itens ALTER COLUMN cst_icms TYPE VARCHAR(10);
      ALTER TABLE nfe_entradas_itens ALTER COLUMN cst_ipi TYPE VARCHAR(10);
      ALTER TABLE nfe_entradas_itens ALTER COLUMN cst_pis TYPE VARCHAR(10);
      ALTER TABLE nfe_entradas_itens ALTER COLUMN cst_cofins TYPE VARCHAR(10);
      ALTER TABLE nfe_entradas_itens ALTER COLUMN destinacao_item TYPE VARCHAR(10);
      ALTER TABLE nfe_entradas_itens ALTER COLUMN cfop_escrituracao TYPE VARCHAR(10);
      -- Tabela de vínculos (caso não exista)
      CREATE TABLE IF NOT EXISTS nfse_financeiro_vinculo (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID NOT NULL,
        nfe_id UUID REFERENCES nfe_entradas(id),
        nfse_id UUID REFERENCES nfse_entradas(id),
        financeiro_id UUID,
        tipo_vinculo VARCHAR,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Garantir que a FK de nfe_id existe se a tabela já existia
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nfse_financeiro_vinculo_nfe_id_fkey') THEN
          ALTER TABLE nfse_financeiro_vinculo ADD CONSTRAINT nfse_financeiro_vinculo_nfe_id_fkey FOREIGN KEY (nfe_id) REFERENCES nfe_entradas(id);
        END IF;
      END $$;

    `

    const { error } = await sbAdmin.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Falha provável por não existir 'exec_sql' rpc ou erro de sintaxe.
      // Vamos tentar um retorno informativo.
      return NextResponse.json({ error: error.message, tip: "Se 'exec_sql' não existe, rode este SQL manualmente no Supabase SQL Editor.", sql })
    }

    // DEBUG: Verificar itens da nota 463625
    const { data: nfe } = await sbAdmin.from('nfe_entradas').select('id').eq('numero_nf', '463625').single()
    let itens463625 = []
    if (nfe) {
      const { data: itens } = await sbAdmin.from('nfe_entradas_itens').select('*').eq('nfe_entrada_id', nfe.id)
      itens463625 = itens || []
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tabelas criadas com sucesso.',
      debug: {
        nfe_found: !!nfe,
        itens: itens463625.map((i: any) => ({ desc: i.descricao_produto, dest: i.destinacao_item, class: i.classificado }))
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}

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
    `

    const { error } = await sbAdmin.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Falha provável por não existir 'exec_sql' rpc ou erro de sintaxe.
      // Vamos tentar um retorno informativo.
      return NextResponse.json({ error: error.message, tip: "Se 'exec_sql' não existe, rode este SQL manualmente no Supabase SQL Editor.", sql })
    }

    return NextResponse.json({ success: true, message: 'Tabelas criadas com sucesso.' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PLANO_CONTAS_ITG2002 } from '@/features/contabil/data/planoContasITG2002'

const SENHA_MESTRA = 'MIGRAR_PLANO_2026'

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId, senha } = await req.json()

    if (!tenantId || senha !== SENHA_MESTRA) {
      return NextResponse.json({ error: 'Credenciais inválidas ou Tenant ID ausente.' }, { status: 401 })
    }

    const client = sb()

    // 1. Buscar e Renomear todas as contas atuais para evitar conflito de constraint (Unique Index)
    const { data: antigas, error: fetchErr } = await client
      .from('plano_contas')
      .select('id, codigo, descricao')
      .eq('tenant_id', tenantId)

    if (fetchErr) throw new Error('Erro ao buscar contas antigas: ' + fetchErr.message)

    if (antigas && antigas.length > 0) {
      const ts = new Date().getTime()
      console.log(`Renomeando ${antigas.length} contas antigas para o tenant ${tenantId}...`)
      
      for (const conta of antigas) {
        // Só renomeia se já não for uma conta "_OLD"
        if (!conta.codigo.includes('_OLD_')) {
          const { error: renomearErr } = await client
            .from('plano_contas')
            .update({ 
              ativa: false, 
              codigo: `${conta.codigo}_OLD_${ts}`,
              descricao: `[ANTIGA] ${conta.descricao}`
            })
            .eq('id', conta.id)
          
          if (renomearErr) console.error(`Erro ao renomear conta ${conta.codigo}:`, renomearErr)
        } else {
          // Se já for OLD, apenas garante que está inativa
          await client.from('plano_contas').update({ ativa: false }).eq('id', conta.id)
        }
      }
    }

    // 2. Preparar linhas para inserção
    const rows = PLANO_CONTAS_ITG2002.map(c => ({
      tenant_id: tenantId,
      codigo: c.codigo,
      descricao: c.descricao,
      nivel: c.nivel,
      tipo: c.tipo,
      natureza: c.natureza,
      classificacao: c.classificacao,
      aceita_lancamentos: c.aceita_lancamentos ?? false,
      ativa: true,
    }))

    // 3. Inserir novas contas
    const { data: inserted, error: insErr } = await client
      .from('plano_contas')
      .insert(rows)
      .select('id, codigo')

    if (insErr) throw new Error('Erro ao inserir novo plano: ' + insErr.message)
    if (!inserted) throw new Error('Nenhuma conta foi inserida.')

    // 4. Vincular conta_pai_id
    let vinculadas = 0
    for (const conta of inserted) {
      const partes = conta.codigo.split('.')
      if (partes.length > 1) {
        const paiCodigo = partes.slice(0, -1).join('.')
        const pai = inserted.find(c => c.codigo === paiCodigo)
        if (pai) {
          await client.from('plano_contas').update({ conta_pai_id: pai.id }).eq('id', conta.id)
          vinculadas++
        }
      }
    }

    // 5. Mapeamento Inteligente (Seed)
    const { seedAccountingConfigAction } = await import('@/features/contabil/actions/seedAccountingConfig')
    await seedAccountingConfigAction(tenantId)

    // 6. Registrar no log
    await client.from('contabil_logs').insert({
      tenant_id: tenantId,
      acao: 'MIGRAÇÃO PLANO CONTAS',
      detalhes: `Migração total para o novo padrão ITG 2002 concluída com Mapeamento Inteligente. ${rows.length} contas criadas.`
    })

    return NextResponse.json({
      success: true,
      message: 'Migração concluída com sucesso.',
      stats: {
        criadas: rows.length,
        vinculadas
      }
    })

  } catch (err: any) {
    console.error('Erro na migração:', err)
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}

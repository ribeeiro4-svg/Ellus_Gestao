/**
 * PASSO 1 — AUDITORIA (SOMENTE LEITURA)
 * =======================================
 * Este script NÃO deleta nada. Apenas lista os lançamentos com:
 *   - status = 'atrasado'
 *   - banco_transacao_id IS NULL (sem confirmação bancária)
 *   - tenant_id = ACPROBEC (Bruno Matos)
 *
 * Execute: node scratch_audit_atrasados.js
 * Revise o output ANTES de executar o script de exclusão.
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function auditarAtrasados() {
  console.log('='.repeat(60))
  console.log('  AUDITORIA — LANÇAMENTOS "ATRASADO" SEM CONFIRMAÇÃO BANCÁRIA')
  console.log('  ⚠️  MODO SOMENTE LEITURA — NENHUM DADO SERÁ ALTERADO')
  console.log('='.repeat(60))

  // 1. Buscar o tenant_id da ACPROBEC
  const { data: tenants, error: tenantError } = await sb
    .from('tenants')
    .select('id, nome, slug')
    .ilike('slug', '%acprobec%')

  if (tenantError) {
    console.error('❌ Erro ao buscar tenant:', tenantError.message)
    process.exit(1)
  }

  if (!tenants || tenants.length === 0) {
    console.error('❌ Tenant ACPROBEC não encontrado!')
    process.exit(1)
  }

  console.log('\n📋 Tenants encontrados:')
  tenants.forEach(t => console.log(`   - ${t.nome} | slug: ${t.slug} | id: ${t.id}`))

  // Usa o primeiro tenant encontrado (ACPROBEC)
  const TENANT_ID = tenants[0].id
  console.log(`\n✅ Usando tenant: ${tenants[0].nome} (${TENANT_ID})\n`)

  // 2. Buscar TODOS os lançamentos atrasados sem confirmação bancária (paginado)
  let todosCandidatos = []
  let from = 0
  const PAGE = 1000

  while (true) {
    const { data, error } = await sb
      .from('lancamentos')
      .select(`
        id,
        data,
        descricao,
        categoria,
        tipo,
        valor,
        status,
        banco_transacao_id,
        conciliado,
        competencia_mes,
        competencia_ano,
        associado_id,
        associados ( nome )
      `)
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'atrasado')
      .is('banco_transacao_id', null)
      .order('data', { ascending: true })
      .range(from, from + PAGE - 1)

    if (error) {
      console.error('❌ Erro ao buscar lançamentos:', error.message)
      process.exit(1)
    }

    if (!data || data.length === 0) break
    todosCandidatos = [...todosCandidatos, ...data]
    if (data.length < PAGE) break
    from += PAGE
  }

  // 3. Verificar se algum está conciliado (segurança extra)
  const conciliados = todosCandidatos.filter(l => l.conciliado === true)
  const semConciliacao = todosCandidatos.filter(l => !l.conciliado)

  // 4. Exibir resumo
  console.log('='.repeat(60))
  console.log('  RESUMO DA AUDITORIA')
  console.log('='.repeat(60))
  console.log(`Total candidatos à exclusão (status=atrasado + sem banco_transacao_id): ${todosCandidatos.length}`)
  console.log(`  ✅ Sem conciliação (seriam excluídos):  ${semConciliacao.length}`)
  console.log(`  ⚠️  Com conciliado=true (SERÃO PROTEGIDOS): ${conciliados.length}`)

  // 5. Calcular valor total
  const valorTotal = semConciliacao.reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
  console.log(`  💰 Valor total a remover: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

  // 6. Exibir tabela de registros que SERIAM EXCLUÍDOS
  if (semConciliacao.length > 0) {
    console.log('\n' + '='.repeat(60))
    console.log('  LISTA DE LANÇAMENTOS QUE SERIAM EXCLUÍDOS:')
    console.log('='.repeat(60))

    // Agrupar por ano/mês para facilitar leitura
    const porAno = {}
    semConciliacao.forEach(l => {
      const ano = l.data ? l.data.substring(0, 4) : 'SEM DATA'
      const mes = l.data ? l.data.substring(0, 7) : 'SEM DATA'
      if (!porAno[ano]) porAno[ano] = {}
      if (!porAno[ano][mes]) porAno[ano][mes] = []
      porAno[ano][mes].push(l)
    })

    Object.keys(porAno).sort().forEach(ano => {
      console.log(`\n📅 ANO: ${ano}`)
      Object.keys(porAno[ano]).sort().forEach(mes => {
        const registros = porAno[ano][mes]
        const subtotal = registros.reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
        console.log(`  🗓️  ${mes} — ${registros.length} registro(s) — R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
        registros.forEach(l => {
          const nomeAssoc = l.associados?.nome || '(sem associado)'
          console.log(`       [${l.id}] ${l.data} | ${l.tipo.toUpperCase()} | R$ ${parseFloat(l.valor).toFixed(2)} | ${l.descricao.substring(0, 50)} | Assoc: ${nomeAssoc}`)
        })
      })
    })
  }

  // 7. Se há conciliados protegidos, listá-los
  if (conciliados.length > 0) {
    console.log('\n' + '='.repeat(60))
    console.log('  ⚠️  REGISTROS PROTEGIDOS (conciliado=true — NÃO serão excluídos):')
    console.log('='.repeat(60))
    conciliados.forEach(l => {
      console.log(`  [${l.id}] ${l.data} | R$ ${parseFloat(l.valor).toFixed(2)} | ${l.descricao.substring(0, 50)}`)
    })
  }

  console.log('\n' + '='.repeat(60))
  console.log('  FIM DA AUDITORIA — NENHUM DADO FOI ALTERADO')
  console.log('  ✅ Revise o output acima antes de executar o delete.')
  console.log('='.repeat(60))
}

auditarAtrasados().catch(err => {
  console.error('❌ Erro inesperado:', err)
  process.exit(1)
})

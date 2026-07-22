/**
 * PASSO 2 — EXCLUSÃO SEGURA COM BACKUP
 * =======================================
 * ⚠️  EXECUTE SOMENTE APÓS REVISAR O OUTPUT DO PASSO 1 (scratch_audit_atrasados.js)
 *
 * Este script:
 *   1. Busca TODOS os candidatos (status=atrasado + sem banco_transacao_id + sem conciliação)
 *   2. Salva um backup JSON completo ANTES de deletar
 *   3. Executa o DELETE com filtros estritos
 *   4. Confirma o count deletado vs auditado
 *
 * Execute: node scratch_delete_atrasados.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function deletarAtrasadosSeguros() {
  console.log('='.repeat(60))
  console.log('  EXCLUSÃO SEGURA — LANÇAMENTOS "ATRASADO" SEM CONFIRMAÇÃO BANCÁRIA')
  console.log('='.repeat(60))

  // 1. Buscar tenant ACPROBEC
  const { data: tenants, error: tenantError } = await sb
    .from('tenants')
    .select('id, nome, slug')
    .ilike('slug', '%acprobec%')

  if (tenantError || !tenants || tenants.length === 0) {
    console.error('❌ Tenant ACPROBEC não encontrado! Abortando.')
    process.exit(1)
  }

  const TENANT_ID = tenants[0].id
  console.log(`\n✅ Tenant confirmado: ${tenants[0].nome} (${TENANT_ID})`)

  // 2. Buscar TODOS os candidatos (mesma lógica do script de auditoria)
  let candidatos = []
  let from = 0
  const PAGE = 1000

  while (true) {
    const { data, error } = await sb
      .from('lancamentos')
      .select('*')   // Seleciona TUDO para o backup ser completo
      .eq('tenant_id', TENANT_ID)
      .eq('status', 'atrasado')
      .is('banco_transacao_id', null)
      .eq('conciliado', false)   // Proteção extra: só os não-conciliados
      .order('data', { ascending: true })
      .range(from, from + PAGE - 1)

    if (error) {
      console.error('❌ Erro ao buscar candidatos:', error.message)
      process.exit(1)
    }

    if (!data || data.length === 0) break
    candidatos = [...candidatos, ...data]
    if (data.length < PAGE) break
    from += PAGE
  }

  console.log(`\n📊 Total de candidatos à exclusão: ${candidatos.length}`)

  if (candidatos.length === 0) {
    console.log('✅ Nenhum lançamento encontrado com esses critérios. Nada a fazer.')
    process.exit(0)
  }

  const valorTotal = candidatos.reduce((acc, l) => acc + parseFloat(l.valor || 0), 0)
  console.log(`💰 Valor total acumulado: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

  // 3. SALVAR BACKUP COMPLETO ANTES DE DELETAR
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
  const backupFileName = `backup_atrasados_${timestamp}.json`
  const backupPath = path.join(__dirname, backupFileName)

  const backupPayload = {
    gerado_em: new Date().toISOString(),
    tenant_id: TENANT_ID,
    tenant_nome: tenants[0].nome,
    criterios: {
      status: 'atrasado',
      banco_transacao_id: null,
      conciliado: false,
    },
    total_registros: candidatos.length,
    valor_total: valorTotal,
    registros: candidatos,
  }

  fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 2), 'utf-8')
  console.log(`\n💾 Backup salvo em: ${backupFileName}`)
  console.log('   ⚠️  GUARDE ESTE ARQUIVO. Ele é o único registro dos dados excluídos.')

  // 4. Coletar os IDs para o DELETE (mais seguro que filtrar por status novamente)
  const idsParaDeletar = candidatos.map(l => l.id)

  console.log(`\n🗑️  Iniciando exclusão de ${idsParaDeletar.length} registro(s)...`)

  // 5. Executar DELETE em lotes de 100 IDs (segurança extra — evita timeout)
  const BATCH_SIZE = 100
  let totalDeletado = 0
  let erros = []

  for (let i = 0; i < idsParaDeletar.length; i += BATCH_SIZE) {
    const lote = idsParaDeletar.slice(i, i + BATCH_SIZE)
    const loteNum = Math.floor(i / BATCH_SIZE) + 1

    const { error: deleteError, count } = await sb
      .from('lancamentos')
      .delete({ count: 'exact' })
      .in('id', lote)
      .eq('tenant_id', TENANT_ID)   // Segurança tripla: confirma tenant_id mesmo deletando por ID
      .eq('status', 'atrasado')      // Segurança tripla: confirma status mesmo deletando por ID

    if (deleteError) {
      console.error(`  ❌ Erro no lote ${loteNum}:`, deleteError.message)
      erros.push({ lote: loteNum, ids: lote, erro: deleteError.message })
    } else {
      totalDeletado += count || 0
      console.log(`  ✅ Lote ${loteNum}: ${count} registro(s) removido(s)`)
    }
  }

  // 6. Relatório final
  console.log('\n' + '='.repeat(60))
  console.log('  RELATÓRIO FINAL')
  console.log('='.repeat(60))
  console.log(`Candidatos identificados: ${candidatos.length}`)
  console.log(`Registros efetivamente deletados: ${totalDeletado}`)
  console.log(`Erros: ${erros.length}`)

  if (totalDeletado !== candidatos.length) {
    console.warn(`\n⚠️  ATENÇÃO: Count deletado (${totalDeletado}) != candidatos (${candidatos.length}).`)
    console.warn('   Verifique o backup e o banco de dados.')
  } else {
    console.log('\n✅ Exclusão concluída com sucesso. Counts conferem.')
  }

  if (erros.length > 0) {
    console.log('\n❌ Lotes com erro:')
    erros.forEach(e => console.log(`  Lote ${e.lote}: ${e.erro}`))
  }

  console.log(`\n📁 Backup permanente: ${backupFileName}`)
  console.log('='.repeat(60))
}

deletarAtrasadosSeguros().catch(err => {
  console.error('❌ Erro inesperado:', err)
  process.exit(1)
})

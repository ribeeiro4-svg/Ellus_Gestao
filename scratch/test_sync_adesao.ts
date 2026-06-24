import { createClient } from '@supabase/supabase-js'
import { syncAdesaoFinanceiraAction } from '../src/app/actions/zapsign'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

const tenantId = '6662ad78-cb75-4740-b68c-7fcdbfa6c2dc'

async function run() {
  const { data: updatedAssocs } = await sb.from('associados').select('*').eq('tenant_id', tenantId)
  
  if (!updatedAssocs) {
    console.log('No associados found.')
    return
  }

  console.log(`Found ${updatedAssocs.length} associados.`)

  const { data: lancamentosExistentes } = await sb.from('lancamentos')
    .select('associado_id, categoria, descricao')
    .eq('tenant_id', tenantId)
    .or('categoria.ilike.%ADESÃO%,descricao.ilike.%ADESÃO%')

  console.log(`Found ${lancamentosExistentes?.length} adesões in DB.`)

  const idsComAdesao = new Set<string>()
  const nomesComAdesao = new Set<string>()

  function normalizar(str: string): string {
    return (str || '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  }

  lancamentosExistentes?.forEach(l => {
    if (l.associado_id) idsComAdesao.add(l.associado_id)
    
    if (l.descricao) {
      const partes = l.descricao.split(' - ')
      let nomeExtraido = partes.length > 1 ? partes[1] : l.descricao
      nomeExtraido = nomeExtraido.split('[')[0].split('(')[0].trim()
      nomesComAdesao.add(normalizar(nomeExtraido))
    }
  })

  let toCreate = 0
  for (const assoc of updatedAssocs) {
    if ((assoc.status || '').toLowerCase() !== 'ativo') continue

    const nomeNorm = normalizar(assoc.nome)
    const jaExistePorId = idsComAdesao.has(assoc.id)
    const jaExistePorNome = nomesComAdesao.has(nomeNorm)

    if (!jaExistePorId && !jaExistePorNome) {
      toCreate++
    }
  }

  console.log(`Will create: ${toCreate} new adesões.`)
  
  if (toCreate === 0) {
    console.log("No new adesões to create! This means they all matched an existing one.")
    console.log("Let's check why...")
    
    let activeWithNoId = 0
    let matchedByName = 0
    for (const assoc of updatedAssocs) {
      if ((assoc.status || '').toLowerCase() !== 'ativo') continue
      const nomeNorm = normalizar(assoc.nome)
      const jaExistePorId = idsComAdesao.has(assoc.id)
      const jaExistePorNome = nomesComAdesao.has(nomeNorm)
      
      if (!jaExistePorId && jaExistePorNome) {
        matchedByName++
      }
    }
    console.log(`Matched by ID: ${idsComAdesao.size}`)
    console.log(`Matched by NAME ONLY: ${matchedByName}`)
  }

}

run().catch(console.error)

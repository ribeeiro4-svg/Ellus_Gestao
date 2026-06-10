const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

function getEnv(key) {
  try {
    const content = fs.readFileSync('.env', 'utf8')
    const lines = content.split('\n')
    for (const line of lines) {
      if (line.trim().startsWith(key + '=')) {
        return line.split('=')[1].trim().replace(/^"|"$/g, '')
      }
    }
  } catch (e) {}
  return null
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const sb = createClient(url, key)

async function run() {
  console.log('--- AUDITORIA DE TENANTS ---')
  const { data: users } = await sb.from('usuarios').select('email, tenant_id')
  console.log('Usuários/Tenants encontrados:', JSON.stringify(users, null, 2))

  console.log('\n--- BUSCANDO LANÇAMENTOS DE PEDRO FELIPE (EM TODOS OS TENANTS) ---')
  const { data: lancs } = await sb.from('lancamentos')
    .select('id, tenant_id, data, valor, status, conciliado, banco_transacao_id, descricao')
    .ilike('descricao', '%PEDRO FELIPE%')

  if (lancs && lancs.length > 0) {
    console.log('Lançamentos encontrados:', JSON.stringify(lancs, null, 2))
  } else {
    console.log('Nenhum lançamento encontrado para Pedro Felipe em toda a base.')
  }
}

run()

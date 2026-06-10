import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ukfgrjcflhlgeuarxtmt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc'
const sb = createClient(supabaseUrl, supabaseKey)

const coraId = '066ec451-264c-44f5-ab8e-b140aa62b368'

async function run() {
  const { data: receitas } = await sb.from('lancamentos')
    .select('id, valor, descricao, forma_pagamento, data, banco_transacao_id, conciliado, status')
    .eq('conta_id', coraId)
    .eq('tipo', 'receita')
    .gte('data', '2026-05-01')
    .lte('data', '2026-05-31')

  if (!receitas) return

  const realizedReceitas = receitas.filter(l => {
    const st = (l.status || '').toLowerCase()
    return st === 'pago' || st === 'recebido' || l.conciliado === true
  })

  let totalRealized = 0
  realizedReceitas.forEach(l => totalRealized += Math.abs(Number(l.valor) || 0))
  console.log(`Total realizadas no DB: R$ ${totalRealized.toFixed(2)}`)
  console.log(`Meta (Extrato): R$ 17968.27`)
  console.log(`Diferenca real: R$ ${(17968.27 - totalRealized).toFixed(2)}`)

  // Boletos = 50
  const boletos50 = realizedReceitas.filter(l => l.forma_pagamento === 'Boleto' && Number(l.valor) === 50)
  console.log(`Boletos realizados com valor 50: ${boletos50.length}`)
  
  // What if we update these boletos50?
  // 17968.27 - 16966.11 = 1002.16
  // But totalRealized might be 16194.30 ? Let's see the output.
}

run().catch(console.error)

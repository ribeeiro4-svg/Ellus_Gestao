
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const supabaseKey = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb" // Anon key might be enough to read config_categorias if public

async function check() {
  const sb = createClient(supabaseUrl, supabaseKey)
  
  console.log("Fetching config_categorias...")
  const { data: configCats } = await sb.from('config_categorias').select('nome, tipo').order('nome')
  console.log("Config Categories:", configCats?.map(c => `${c.nome} (${c.tipo})`))

  console.log("\nFetching unique categories from lancamentos...")
  const { data: lancs } = await sb.from('lancamentos').select('categoria, tipo')
  const uniqueLancs = [...new Set(lancs?.map(l => `${l.categoria}|${l.tipo}`))].map(s => {
    const [nome, tipo] = s.split('|')
    return { nome, tipo }
  })
  console.log("Unique Lancamentos Categories:", uniqueLancs)
}

check()

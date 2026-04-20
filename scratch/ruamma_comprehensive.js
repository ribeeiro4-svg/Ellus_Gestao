const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb"

async function run() {
  const query = `${URL}/rest/v1/lancamentos?select=*&descricao=ilike.*RUAMMA*&order=created_at.desc&limit=20`
  const res = await fetch(query, { headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` } })
  const data = await res.json()
  console.log("Found:", data.length, "Ruamma records (latest first)")
  data.forEach(l => {
    console.log(`Created: ${l.created_at} | Data: ${l.data} | Desc: ${l.descricao} | Valor: ${l.valor}`)
  })
}

run()

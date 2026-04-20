const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb"

async function run() {
  const query = `${URL}/rest/v1/lancamentos?select=*&data=eq.2026-02-10&order=created_at.desc`
  const res = await fetch(query, { headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` } })
  const data = await res.json()
  data.forEach(l => {
    console.log(`ID: ${l.id} | Desc: ${l.descricao} | Valor: ${l.valor} | Cat: ${l.categoria} | Status: ${l.status}`)
  })
}

run()

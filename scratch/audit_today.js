const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb"

async function run() {
  const today = "2026-04-19" // or 2026-04-20
  console.log("Searching for ALL records created today...")
  const query = `${URL}/rest/v1/lancamentos?select=*&created_at=gte.2026-04-19T00:00:00Z`
  const res = await fetch(query, { headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` } })
  const data = await res.json()
  console.log("Found:", data.length, "total new records.")
  data.forEach(l => {
    console.log(`Created: ${l.created_at} | Data: ${l.data} | Desc: ${l.descricao} | Valor: ${l.valor}`)
  })
}

run()

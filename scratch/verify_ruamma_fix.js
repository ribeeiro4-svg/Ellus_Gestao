const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb"

async function run() {
  // Search by name and exact date they typed
  const query = `${URL}/rest/v1/lancamentos?select=*&descricao=ilike.*RUAMMA*&data=eq.2026-02-10`
  const res = await fetch(query, { headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` } })
  const data = await res.json()
  console.log("Records matching Ruamma on 2026-02-10:", data.length)
  console.log(JSON.stringify(data, null, 2))
}

run()

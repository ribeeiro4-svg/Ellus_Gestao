const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb"

async function run() {
  const query = `${URL}/rest/v1/lancamentos?select=*&descricao=ilike.*RUAMMA*&data=eq.2026-10-02`
  const res = await fetch(query, { headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` } })
  const data = await res.json()
  console.log("Records matching Ruamma on 2026-10-02 (potential parsing bug):", data.length)
  console.log(JSON.stringify(data, null, 2))
}

run()

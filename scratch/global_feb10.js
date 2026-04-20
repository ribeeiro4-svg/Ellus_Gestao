const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb"

async function run() {
  const query = `${URL}/rest/v1/lancamentos?select=*&data=eq.2026-02-10`
  const res = await fetch(query, { headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` } })
  const data = await res.json()
  console.log("Total records found for Feb 10:", data.length)
  data.forEach(l => {
    console.log(`ID: ${l.id} | Tenant: ${l.tenant_id} | Desc: ${l.descricao}`)
  })
}

run()

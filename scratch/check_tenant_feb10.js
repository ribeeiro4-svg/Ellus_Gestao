const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb"
const TENANT = "971f92af-a72b-4bc4-a8e0-333d712ce6a7"

async function run() {
  const query = `${URL}/rest/v1/lancamentos?select=*&tenant_id=eq.${TENANT}&data=eq.2026-02-10`
  const res = await fetch(query, { headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` } })
  const data = await res.json()
  console.log("Total records for tenant on 10/02:", data.length)
  data.forEach(l => {
    console.log(`ID: ${l.id} | Desc: ${l.descricao} | Valor: ${l.valor}`)
  })
}

run()

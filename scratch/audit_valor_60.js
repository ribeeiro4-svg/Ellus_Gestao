const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb"

async function run() {
  console.log("Searching for any record with Valor around 60 created today...")
  const query = `${URL}/rest/v1/lancamentos?select=*&valor=gt.58&valor=lt.62&created_at=gte.2026-04-19T00:00:00Z`
  const res = await fetch(query, { headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` } })
  const data = await res.json()
  console.log("Found:", data.length, "matching records.")
  console.log(JSON.stringify(data, null, 2))
}

run()

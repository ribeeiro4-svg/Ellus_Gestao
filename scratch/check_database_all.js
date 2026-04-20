const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb"

async function run() {
  console.log("Searching for ALL launches on 2026-02-10...")
  const query = `${URL}/rest/v1/lancamentos?select=*&data=eq.2026-02-10`
  
  const res = await fetch(query, {
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
  })
  
  const data = await res.json()
  console.log("Found:", data.length, "records")
  console.log(JSON.stringify(data, null, 2))
}

run()

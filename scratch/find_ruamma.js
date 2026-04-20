const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb"

async function run() {
  console.log("Searching for Ruamma ANYWHERE...")
  const query = `${URL}/rest/v1/lancamentos?select=*&descricao=ilike.*Ruamma*`
  
  const res = await fetch(query, {
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
  })
  
  const data = await res.json()
  console.log("Found:", data.length, "records")
  console.log(JSON.stringify(data, null, 2))
}

run()

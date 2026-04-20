const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb" // Attempting with the key from .env

async function run() {
  console.log("Searching for RUAMMA in database...")
  
  // 1. Search launches
  const query = `${URL}/rest/v1/lancamentos?select=*&data=eq.2026-02-10&descricao=ilike.*RUAMMA*`
  
  const res = await fetch(query, {
    headers: {
      "apikey": KEY,
      "Authorization": `Bearer ${KEY}`
    }
  })
  
  if (!res.ok) {
    console.error("Error response:", res.status, await res.text())
    return
  }
  
  const data = await res.json()
  console.log("Results found:", JSON.stringify(data, null, 2))
}

run()

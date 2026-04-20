const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb"

async function run() {
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  console.log("Searching for launches created after:", tenMinsAgo)
  
  const query = `${URL}/rest/v1/lancamentos?select=*&created_at=gte.${tenMinsAgo}`
  
  const res = await fetch(query, {
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
  })
  
  const data = await res.json()
  console.log("Found:", data.length, "records recently created.")
  console.log(JSON.stringify(data, null, 2))
}

run()

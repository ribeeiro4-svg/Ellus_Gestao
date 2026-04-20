const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb"

async function run() {
  console.log("Checking for fechamentos (closed periods)...")
  const query = `${URL}/rest/v1/fechamentos_periodo?select=*`
  
  const res = await fetch(query, {
    headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` }
  })
  
  const data = await res.json()
  console.log("Fechamentos found:", JSON.stringify(data, null, 2))
}

run()

const URL = "https://ukfgrjcflhlgeuarxtmt.supabase.co"
const KEY = "sb_publishable_ANxkicVQPt2SxrkjxH35jg_rifD9CGb"

async function run() {
  const query = `${URL}/rest/v1/lancamentos?select=*&associado_id=eq.a396539b-9236-4c5d-b58e-b57709f5fee8`
  const res = await fetch(query, { headers: { "apikey": KEY, "Authorization": `Bearer ${KEY}` } })
  const data = await res.json()
  console.log("Total records for Ruamma ID:", data.length)
  data.forEach(l => {
    console.log(`Data: ${l.data} | Desc: ${l.descricao} | Valor: ${l.valor}`)
  })
}

run()

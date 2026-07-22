const fs = require('fs');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/comunicados_historico?usuario_nome=not.is.null';
fetch(url, { 
  method: 'PATCH',
  headers: { 
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 
    'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  },
  body: JSON.stringify({ usuario_nome: 'ACPROBEC' })
})
.then(r => {
  if (r.ok) console.log("Atualizado com sucesso!");
  else r.text().then(console.log);
});

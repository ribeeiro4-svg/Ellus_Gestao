const fs = require('fs');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/comunicados_historico?select=usuario_nome,usuario_email';
fetch(url, { headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY } })
.then(r => r.json())
.then(data => {
  const map = {};
  if (Array.isArray(data)) {
    data.forEach(d => {
      const key = `${d.usuario_nome} | ${d.usuario_email}`;
      map[key] = (map[key] || 0) + 1;
    });
    console.log(map);
  } else { console.log(data); }
});

const {createClient}=require('@supabase/supabase-js');
const f=require('fs');
const c=f.readFileSync('.env','utf8').split('\n');
let u,k;
for(let l of c){
  if(l.startsWith('NEXT_PUBLIC_SUPABASE_URL='))u=l.split('=')[1].trim().replace(/^"|"$/g,'');
  if(l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY='))k=l.split('=')[1].trim().replace(/^"|"$/g,'');
}
const sb=createClient(u,k);
sb.from('lancamentos').select('*').limit(1).order('data_vencimento').then(r=>{
  console.log('Error ordering by data_vencimento:', r.error?.message);
});

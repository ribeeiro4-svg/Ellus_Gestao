const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const url = fs.readFileSync('.env.local', 'utf8').match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const key = fs.readFileSync('.env.local', 'utf8').match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const sb = createClient(url, key);

sb.from('contas').select('*').ilike('nome', '%cora%').then(res => {
  console.log('contas:', JSON.stringify(res.data, null, 2));
});

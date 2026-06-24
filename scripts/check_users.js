const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const url = fs.readFileSync('.env.local', 'utf8').match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim().replace(/^"|"$/g, '');
const key = fs.readFileSync('.env.local', 'utf8').match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim().replace(/^"|"$/g, '');
const sb = createClient(url, key);

sb.auth.admin.listUsers().then(res => {
  console.log(JSON.stringify(res.data.users.slice(0, 3).map(u => ({ email: u.email, metadata: u.user_metadata })), null, 2));
});

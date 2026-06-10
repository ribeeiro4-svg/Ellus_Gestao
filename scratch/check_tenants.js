
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: users, error } = await supabase
    .from('usuarios')
    .select('id, nome, email, tenant_id');
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log('--- List of Users and Tenants ---');
  users.forEach(u => {
    console.log(`User: ${u.nome} (${u.email}) - ID: ${u.id} - Tenant: ${u.tenant_id}`);
  });
}

check();

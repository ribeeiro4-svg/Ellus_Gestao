const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("No Supabase URL or Key");
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);

async function testCora() {
  const tenantId = '971f92af-a72b-4bc4-a8e0-333d712ce6a7';
  console.log('Buscando config do tenant:', tenantId);
  const { data: tenant, error } = await sb.from('tenants').select('cora_id, cora_cert, cora_key').eq('id', tenantId).single();
  
  if (error) {
    console.error('Erro buscando tenant:', error);
    return;
  }
  
  if (!tenant || !tenant.cora_id || !tenant.cora_cert || !tenant.cora_key) {
    console.log('Tenant nao possui config da Cora completa.');
    return;
  }
  
  console.log('Cert:', tenant.cora_cert.substring(0, 50) + '...');
  
  const normalize = (val, label) => {
    let cleaned = val.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
    const matchHeader = cleaned.match(/-----BEGIN ([^-]+)-----/);
    const headerType = matchHeader ? matchHeader[1] : label;
    let body = cleaned
      .replace(/-----BEGIN [^-]+-----/g, '')
      .replace(/-----END [^-]+-----/g, '')
      .replace(/\s/g, ''); 
    body = body.replace(/ /g, '+');
    const lines = body.match(/.{1,64}/g) || [];
    return `-----BEGIN ${headerType}-----\n${lines.join('\n')}\n-----END ${headerType}-----`;
  };

  const finalCert = normalize(tenant.cora_cert, 'CERTIFICATE');
  const finalKey = normalize(tenant.cora_key, 'PRIVATE KEY');
  
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: tenant.cora_id,
  }).toString();

  const options = {
    hostname: 'matls-clients.api.cora.com.br',
    path: '/token',
    method: 'POST',
    cert: finalCert,
    key: finalKey,
    rejectUnauthorized: true,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  console.log('Tentando pegar token...');
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });
  
  req.on('error', e => console.error('Request Error:', e));
  req.write(body);
  req.end();
}

testCora();

// Migration via Supabase Management API
const fs = require('fs');
const https = require('https');
const path = require('path');

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc';
const PROJECT_REF = 'ukfgrjcflhlgeuarxtmt';

// Lê o arquivo SQL de migração da EIP
const sqlPath = path.join(__dirname, 'supabase', 'migrations', 'eip_financeiro.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const body = JSON.stringify({ query: sql });

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log('Running migration from:', sqlPath);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});
req.on('error', (err) => console.error('Error:', err));
req.write(body);
req.end();

const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = 'https://ukfgrjcflhlgeuarxtmt.supabase.co/rest/v1/rpc/execute_sql';

if (!key) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const sql = `
  ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS is_ec_destino BOOLEAN DEFAULT false;
  NOTIFY pgrst, 'reload schema';
`;

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`
  },
  body: JSON.stringify({ sql })
})
.then(res => {
  if (res.ok) {
    console.log('SQL executed successfully');
  } else {
    res.text().then(text => {
      console.error('Failed to execute SQL:', text);
      process.exit(1);
    });
  }
})
.catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

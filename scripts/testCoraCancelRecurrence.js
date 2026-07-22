const https = require('https');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim();
});

const coraCert = env.CORA_CERT;
const coraKey = env.CORA_KEY;
const clientId = env.CORA_CLIENTE_ID;

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

const cert = normalize(coraCert, 'CERTIFICATE');
const key = normalize(coraKey, 'PRIVATE KEY');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ ...options, cert, key, rejectUnauthorized: true }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  console.log('Fetching token...');
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, scope: 'all' }).toString();
  const tokenRes = await request({
    hostname: 'matls-clients.api.cora.com.br',
    path: '/oauth/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }, body);
  
  if (tokenRes.status >= 400) {
    console.log('Failed to get token:', tokenRes.data);
    return;
  }
  const token = JSON.parse(tokenRes.data).access_token;
  
  console.log('Listing recurrences...');
  const recRes = await request({
    hostname: 'api.cora.com.br',
    path: '/v2/recurrences',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('List status:', recRes.status);
  
  // Try sending DELETE to a fake recurrence ID
  console.log('Testing DELETE /v2/recurrences/fake_id...');
  const delRes = await request({
    hostname: 'api.cora.com.br',
    path: '/v2/recurrences/fake_id',
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Delete status:', delRes.status);
  console.log('Delete data:', delRes.data);
}

run();

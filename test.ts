import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value) acc[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
  return acc;
}, {} as any);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL || '', env.SUPABASE_SERVICE_ROLE_KEY || '');

async function run() {
  const { data, error } = await supabase.from('lancamentos').select('id, data, descricao, categoria, status').ilike('descricao', '%D_BORA VANESSA%');
  console.log(JSON.stringify(data, null, 2), error);
}

run();

const { createClient } = require('@supabase/supabase-js')
const sb = createClient(
  'https://ukfgrjcfihlguwarxiwt.supabase.co',
  'YOUR_KEY' // I will fetch it dynamically using fetch or something. Wait, I can't.
)

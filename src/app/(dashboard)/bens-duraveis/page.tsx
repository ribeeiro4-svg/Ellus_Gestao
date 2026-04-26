import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BensDuraveisHub from '@/features/bens_duraveis/components/BensDuraveisHub'

export const metadata = {
  title: 'Bens Duráveis | ACPROBEC'
}

export default async function BensDuraveisPage() {
  const sb = await createServerSupabase()
  
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: userData } = await sb.from('usuarios').select('tenant_id').eq('id', user.id).single()

  return <BensDuraveisHub tenantId={userData?.tenant_id} />
}

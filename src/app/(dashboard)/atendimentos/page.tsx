import { Metadata } from 'next'
import AtendimentosHub from '@/features/atendimentos/components/AtendimentosHub'

export const metadata: Metadata = {
  title: 'Atendimentos & Agendamentos | ACPROBEC',
  description: 'Gestão de atendimentos presenciais e agendamentos',
}

export default function AtendimentosPage() {
  return <AtendimentosHub />
}

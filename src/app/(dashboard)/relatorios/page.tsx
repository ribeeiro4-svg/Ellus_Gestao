import { redirect } from 'next/navigation'



export default function RelatoriosHubPage() {
  // Redireciona por padrão para o primeiro módulo da EIP
  redirect('/relatorios/financeiro')
}

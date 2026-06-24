'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DiagnosticoPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const sb = createClient()

  useEffect(() => {
    async function audit() {
      const results: any = {}
      
      // 1. Verificar Tenant Atual (pelo usuário logado)
      const { data: { user } } = await sb.auth.getUser()
      results.user = user
      
      const { data: profile } = await sb.from('usuarios').select('*').eq('email', user?.email).single()
      results.profile = profile

      const tenantId = profile?.tenant_id
      results.tenantIdFound = tenantId

      // 2. Buscar TODOS de 2026 para encontrar o erro
      const { data: all2026 } = await sb.from('lancamentos')
        .select('id, data, valor, status, descricao, conciliado')
        .eq('tenant_id', tenantId)
        .gte('data', '2026-01-01')
        .lte('data', '2026-12-31')
        .order('data', { ascending: true })
      results.all2026 = all2026

      // 3. Buscar resumo de Fevereiro
      const { data: resumoFev } = await sb.from('lancamentos')
        .select('status, valor, conciliado')
        .eq('tenant_id', tenantId)
        .gte('data', '2026-02-01')
        .lte('data', '2026-02-28')
      results.resumoFev = resumoFev

      setData(results)
      setLoading(false)
    }
    audit()
  }, [])

  if (loading) return <div className="p-20">Analisando banco de dados...</div>

  return (
    <div className="p-10 font-mono text-xs bg-slate-900 text-emerald-400 min-h-screen">
      <h1 className="text-xl mb-5 font-bold">RAIO-X DO SISTEMA</h1>
      
      <section className="mb-8">
        <h2 className="text-white border-b border-white/20 mb-2 pb-1">DADOS DE ACESSO</h2>
        <pre>{JSON.stringify({ 
          email: data.user?.email, 
          tenantId: data.tenantIdFound 
        }, null, 2)}</pre>
      </section>

      <section className="mb-8">
        <h2 className="text-white border-b border-white/20 mb-2 pb-1">LANÇAMENTOS 2026 (DATABASE)</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="text-white/50 border-b border-white/10">
              <th className="py-1">Data</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Conc.</th>
            </tr>
          </thead>
          <tbody>
            {data.all2026?.map((l: any) => (
              <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-1">{l.data}</td>
                <td>{l.descricao}</td>
                <td className={l.valor > 0 ? 'text-emerald-400' : 'text-rose-400'}>{l.valor}</td>
                <td>{l.status}</td>
                <td>{l.conciliado ? 'SIM' : 'NÃO'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-8">
        <h2 className="text-white border-b border-white/20 mb-2 pb-1">RESUMO FEVEREIRO (DATABASE)</h2>
        <p>Total de lançamentos: {data.resumoFev?.length}</p>
        <p>Total PAGOS: {data.resumoFev?.filter((l:any) => l.status === 'pago').reduce((acc:any, l:any) => acc + l.valor, 0)}</p>
        <p>Total CONCILIADOS: {data.resumoFev?.filter((l:any) => l.conciliado).length}</p>
      </section>
      
      <button 
        onClick={() => window.location.reload()}
        className="bg-emerald-600 text-white px-4 py-2 rounded font-bold"
      >
        ATUALIZAR DIAGNÓSTICO
      </button>
    </div>
  )
}

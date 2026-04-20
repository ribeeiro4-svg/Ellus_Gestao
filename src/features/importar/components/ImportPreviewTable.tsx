import React from 'react'

interface ImportPreviewTableProps {
  type: 'financeiro' | 'associados' | 'prolabore'
  data: any[]
}

export default function ImportPreviewTable({ type, data }: ImportPreviewTableProps) {
  return (
    <div className="overflow-auto max-h-[600px]">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
          <tr>
            {type === 'associados' && (
              <>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase">Código</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase">Nome</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase">CPF/CNPJ</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase">Categoria</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase">Ingresso</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase">Mensalidade</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase">Status</th>
              </>
            )}
            {type === 'financeiro' && (
              <>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase">Data</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase">Descrição</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase">Valor</th>
              </>
            )}
            {type === 'prolabore' && (
              <>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase">Diretor</th>
                <th className="p-3 text-[10px] font-black text-gray-400 uppercase">Períodos</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
              {type === 'associados' && (
                <>
                  <td className="p-3 text-xs text-gray-400 font-mono">{item.codigo}</td>
                  <td className="p-3 text-xs font-bold text-gray-700">{item.nome}</td>
                  <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{item.cpf || '-'}</td>
                  <td className="p-3 text-xs text-gray-500">{item.categoria}</td>
                  <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{new Date(item.data_ingresso).toLocaleDateString()}</td>
                  <td className="p-3 text-xs font-black text-emerald-600">R$ {item.mensalidade}</td>
                  <td className="p-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${item.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
                  </td>
                </>
              )}
              {type === 'financeiro' && (
                <>
                  <td className="p-3 text-xs text-gray-500">{new Date(item.data).toLocaleDateString()}</td>
                  <td className="p-3 text-xs font-medium text-gray-700">{item.descricao}</td>
                  <td className="p-3 text-xs font-black text-emerald-600">R$ {item.valor}</td>
                </>
              )}
              {type === 'prolabore' && (
                <>
                  <td className="p-3 text-xs font-bold text-gray-700">{item.nome}</td>
                  <td className="p-3 text-xs text-gray-500">{item.periodos?.length} períodos</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import { ReactNode } from 'react'

interface DataTableProps<T> {
  columns: {
    header: string
    key: keyof T | string
    render?: (item: T) => ReactNode
    className?: string
  }[]
  data: T[]
  loading?: boolean
  getRowClassName?: (item: T) => string
}

export default function DataTable<T>({ columns, data, loading, getRowClassName }: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200">
        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={`px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 text-sm">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`hover:bg-slate-50/50 transition-colors group ${getRowClassName ? getRowClassName(item) : ''}`}
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 ${col.className || ''}`}>
                      {col.render ? col.render(item) : (item[col.key as keyof T] as ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

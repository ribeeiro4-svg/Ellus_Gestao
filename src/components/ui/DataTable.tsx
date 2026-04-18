import { ReactNode, useMemo } from 'react'
import { Check } from 'lucide-react'

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
  selectedIds?: string[]
  onSelectChange?: (ids: string[]) => void
  onRowClick?: (item: T) => void
  idKey?: keyof T // Chave que identifica o registro (default: 'id')
}

export default function DataTable<T>({ 
  columns, 
  data, 
  loading, 
  getRowClassName,
  selectedIds = [],
  onSelectChange,
  onRowClick,
  idKey = 'id' as keyof T
}: DataTableProps<T>) {
  
  const allSelected = useMemo(() => {
    return data.length > 0 && data.every(item => selectedIds.includes(String(item[idKey])))
  }, [data, selectedIds, idKey])

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectChange?.([])
    } else {
      onSelectChange?.(data.map(item => String(item[idKey])))
    }
  }

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange?.(selectedIds.filter(sid => sid !== id))
    } else {
      onSelectChange?.([...selectedIds, id])
    }
  }

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
              {onSelectChange && (
                <th className="px-6 py-4 w-10">
                  <div 
                    onClick={handleSelectAll}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${allSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}
                  >
                    {allSelected && <Check size={10} className="text-white" />}
                  </div>
                </th>
              )}
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
                <td colSpan={columns.length + (onSelectChange ? 1 : 0)} className="px-6 py-12 text-center text-slate-400 text-sm">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => {
                const id = String(item[idKey])
                const isSelected = selectedIds.includes(id)
                return (
                  <tr 
                    key={rowIndex} 
                    onClick={() => onRowClick?.(item)}
                    className={`transition-colors group ${isSelected ? 'bg-blue-50/30' : ''} ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/50'} ${getRowClassName ? getRowClassName(item) : ''}`}
                  >
                    {onSelectChange && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div 
                          onClick={() => handleSelectOne(id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}
                        >
                          {isSelected && <Check size={10} className="text-white" />}
                        </div>
                      </td>
                    )}
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className={`px-6 py-4 ${col.className || ''}`} onClick={col.key === 'acoes' ? (e) => e.stopPropagation() : undefined}>
                        {col.render ? col.render(item) : (item[col.key as keyof T] as ReactNode)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

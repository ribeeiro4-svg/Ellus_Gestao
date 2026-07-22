import { ReactNode, useMemo, useState } from 'react'
import { Check, ArrowUpDown, ChevronUp, ChevronDown, Search as SearchIcon, Download, Type } from 'lucide-react'

interface DataTableProps<T> {
  columns: {
    header: string
    key: keyof T | string
    render?: (item: T) => ReactNode
    filterValue?: (item: T) => string
    className?: string
    sortable?: boolean
    filterable?: boolean
    stopClickPropagation?: boolean
  }[]
  data: T[]
  loading?: boolean
  getRowClassName?: (item: T) => string
  selectedIds?: string[]
  onSelectChange?: (ids: string[]) => void
  onRowClick?: (item: T) => void
  idKey?: keyof T // Chave que identifica o registro (default: 'id')
  showFilterInputs?: boolean
  headerActions?: ReactNode
  exportable?: boolean
  exportFilename?: string
}

export default function DataTable<T>({ 
  columns, 
  data, 
  loading, 
  getRowClassName,
  selectedIds = [],
  onSelectChange,
  onRowClick,
  idKey = 'id' as keyof T,
  showFilterInputs: initialShowFilters = false,
  headerActions,
  exportable = false,
  exportFilename = 'Exportacao'
}: DataTableProps<T>) {
  
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [showFilterInputs, setShowFilterInputs] = useState(initialShowFilters)
  const [compactFont, setCompactFont] = useState(false)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }))
  }

  const processedData = useMemo(() => {
    let result = [...data]

    // 1. Column Filtering
    Object.keys(columnFilters).forEach(key => {
      const val = columnFilters[key].toLowerCase()
      if (val) {
        const col = columns.find(c => c.key === key)
        result = result.filter(item => {
          const content = col?.filterValue 
            ? String(col.filterValue(item) || '').toLowerCase()
            : String((item as any)[key] || '').toLowerCase()
          return content.includes(val)
        })
      }
    })

    // 2. Sorting
    if (sortKey) {
      result.sort((a: any, b: any) => {
        let valA = a[sortKey]
        let valB = b[sortKey]
        
        // Tratar null/undefined empurrando sempre para o final ou inicio dependendo do sortDir, ou apenas tratando como vazio
        if (valA === null || valA === undefined) valA = ''
        if (valB === null || valB === undefined) valB = ''

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDir === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA)
        }
        
        if (valA < valB) return sortDir === 'asc' ? -1 : 1
        if (valA > valB) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, sortKey, sortDir, columnFilters])

  const allSelected = useMemo(() => {
    return processedData.length > 0 && processedData.every(item => selectedIds.includes(String(item[idKey])))
  }, [processedData, selectedIds, idKey])

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (allSelected) {
      onSelectChange?.([])
    } else {
      onSelectChange?.(processedData.map(item => String(item[idKey])))
    }
  }

  const handleSelectOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (selectedIds.includes(id)) {
      onSelectChange?.(selectedIds.filter(sid => sid !== id))
    } else {
      onSelectChange?.([...selectedIds, id])
    }
  }

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-[200px]">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[2px] transition-all animate-in fade-in duration-300 no-print print:hidden">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-inner"></div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">Sincronizando...</span>
          </div>
        </div>
      )}
      {/* Table Header with Global Filter Toggle */}
      <div className="px-6 py-2 border-b border-slate-100 bg-slate-50/20 flex justify-end items-center gap-3">
        {headerActions}
        {exportable && (
          <button 
            onClick={async () => {
              const XLSX = await import('xlsx')
              const exportColumns = columns.filter(c => c.header && c.header.trim() !== '')
              const excelData = processedData.map(row => {
                const rowData: any = {}
                exportColumns.forEach(col => {
                  let value = col.filterValue ? col.filterValue(row) : (row as any)[col.key as string]
                  if (typeof value === 'object' && value !== null) value = JSON.stringify(value)
                  rowData[col.header] = value
                })
                return rowData
              })
              const worksheet = XLSX.utils.json_to_sheet(excelData)
              const workbook = XLSX.utils.book_new()
              XLSX.utils.book_append_sheet(workbook, worksheet, "Dados")
              const now = new Date()
              const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`
              XLSX.writeFile(workbook, `${exportFilename}_${dateStr}.xlsx`)
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
            title="Exportar para Excel"
          >
            <Download size={12} />
            Exportar Excel
          </button>
        )}
        <button 
          onClick={() => setCompactFont(!compactFont)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${compactFont ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
          title="Alternar tamanho da fonte e espaçamentos"
        >
          <Type size={12} />
          {compactFont ? 'Fonte Normal' : 'Reduzir Fonte'}
        </button>
        <button 
          onClick={() => setShowFilterInputs(!showFilterInputs)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showFilterInputs ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
        >
          <SearchIcon size={12} />
          {showFilterInputs ? 'Ocultar Filtros' : 'Filtrar Colunas'}
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {onSelectChange && (
                <th className="px-6 py-4 w-16 align-middle">
                  <div 
                    onClick={handleSelectAll}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${allSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}
                  >
                    {allSelected && <Check size={10} className="text-white" />}
                  </div>
                </th>
              )}
              {columns.map((col, i) => {
                const isSorted = sortKey === col.key
                return (
                  <th 
                    key={i} 
                    className={`whitespace-nowrap ${compactFont ? 'px-3 py-1.5' : 'px-6 py-4'} text-[11px] font-bold text-slate-400 uppercase tracking-widest group ${col.className || ''}`}
                  >
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:text-slate-600"
                      onClick={() => handleSort(col.key as string)}
                    >
                      {col.header}
                      {isSorted ? (
                        sortDir === 'asc' ? <ChevronUp size={12} className="text-blue-600" /> : <ChevronDown size={12} className="text-blue-600" />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 text-slate-300 transition-opacity" />
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>

            {/* Filter Inputs Row */}
            {showFilterInputs && (
              <tr className="bg-slate-50 border-b border-slate-100 animate-in slide-in-from-top-2 duration-200">
                {onSelectChange && <th className="px-6 py-2"></th>}
                {columns.map((col, i) => (
                  <th key={i} className="px-6 py-2">
                    {col.key !== 'acoes' && (
                      <input 
                        type="text" 
                        placeholder={`Filtrar ${col.header}...`}
                        className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] outline-none focus:ring-2 ring-blue-500/10 focus:border-blue-500 font-medium"
                        value={columnFilters[col.key as string] || ''}
                        onChange={(e) => handleFilterChange(col.key as string, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-50">
            {processedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectChange ? 1 : 0)} className="px-6 py-12 text-center text-slate-400 text-sm">
                  Nenhum registro encontrado para os filtros aplicados.
                </td>
              </tr>
            ) : (
              processedData.map((item, rowIndex) => {
                const id = String(item[idKey])
                const isSelected = selectedIds.includes(id)
                return (
                  <tr 
                    key={rowIndex} 
                    onClick={() => onRowClick?.(item)}
                    className={`transition-colors group ${isSelected ? 'bg-blue-50/30' : ''} ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : 'hover:bg-slate-50/50'} ${getRowClassName ? getRowClassName(item) : ''}`}
                  >
                    {onSelectChange && (
                      <td className={`${compactFont ? 'px-4 py-2' : 'px-6 py-4'}`} onClick={(e) => e.stopPropagation()}>
                        <div 
                          onClick={(e) => handleSelectOne(e, id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}
                        >
                          {isSelected && <Check size={10} className="text-white" />}
                        </div>
                      </td>
                    )}
                    {columns.map((col, colIndex) => (
                      <td 
                        key={colIndex} 
                        className={`${compactFont ? 'px-3 py-1.5 text-[10px] [&_*]:!text-[10px] [&_*]:!leading-tight' : 'px-6 py-4'} ${col.className || ''}`} 
                        onClick={(e) => {
                          if (col.key === 'acoes' || col.stopClickPropagation) {
                            e.stopPropagation()
                          }
                        }}
                      >
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

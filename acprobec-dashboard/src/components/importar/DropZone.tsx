'use client'
import { useState, useCallback } from 'react'
import { Upload, FileType, CheckCircle2, AlertCircle, X } from 'lucide-react'

interface DropZoneProps {
  onFileSelect: (file: File) => void
  accept?: string
}

export default function DropZone({ onFileSelect, accept = ".csv, .xlsx, .xls" }: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      onFileSelect(droppedFile)
    }
  }, [onFileSelect])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      onFileSelect(selectedFile)
    }
  }

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
  }

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsDragActive(true) }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={onDrop}
      className={`relative group h-64 border-2 border-dashed rounded-[32px] transition-all duration-300 flex flex-col items-center justify-center p-8 text-center cursor-pointer overflow-hidden ${
        isDragActive 
          ? 'border-blue-600 bg-blue-50/50 scale-[0.99]' 
          : file 
            ? 'border-emerald-200 bg-emerald-50/30' 
            : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50/50'
      }`}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity transition-all duration-500"></div>
      
      <input 
        id="fileInput" 
        type="file" 
        className="hidden" 
        accept={accept} 
        onChange={onInputChange} 
      />

      {file ? (
        <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm border border-emerald-100">
            <FileType size={32} />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold text-slate-800 tracking-tight">{file.name}</p>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1 justify-center">
              <CheckCircle2 size={10} /> Arquivo selecionado
            </p>
          </div>
          <button 
            onClick={removeFile}
            className="mt-2 p-2 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className={`p-5 rounded-3xl transition-all duration-300 ${isDragActive ? 'bg-blue-600 text-white scale-110 shadow-xl' : 'bg-blue-50 text-blue-600 group-hover:scale-110 group-hover:shadow-lg'}`}>
            <Upload size={32} />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800 tracking-tight">Arraste seu arquivo aqui</p>
            <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">
              ou clique para selecionar no seu computador
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200 uppercase tracking-widest">CSV</span>
            <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 border border-slate-200 uppercase tracking-widest">XLSX</span>
          </div>
        </div>
      )}
    </div>
  )
}

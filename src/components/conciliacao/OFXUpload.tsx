'use client'
import React, { useRef } from 'react'
import { Upload, FileText, X } from 'lucide-react'

interface OFXUploadProps {
  onUpload: (data: string) => void
}

export default function OFXUpload({ onUpload }: OFXUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      onUpload(content)
    }
    reader.readAsText(file)
  }

  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      className="flex flex-col items-center justify-center p-20 bg-white rounded-[40px] border-2 border-dashed border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".ofx" 
        className="hidden" 
      />
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Upload size={32} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Importar Extrato OFX</h3>
      <p className="text-sm text-gray-500 font-medium max-w-xs text-center">Clique aqui ou arraste seu arquivo .ofx para iniciar a conciliação automática.</p>
    </div>
  )
}

'use client'
import React from 'react'
import InadimplenciaTab from '@/features/financeiro/components/InadimplenciaTab'

export default function InadimplenciaPage() {
  return (
    <div className="table-card p-10 bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40">
      <InadimplenciaTab />
    </div>
  )
}

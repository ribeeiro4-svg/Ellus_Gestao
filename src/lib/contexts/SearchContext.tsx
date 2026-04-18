'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react'

interface SearchContextType {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterType: 'todos' | 'receita' | 'despesa'
  setFilterType: (type: 'todos' | 'receita' | 'despesa') => void
  filterStatus: 'todos' | 'pago' | 'aberto' | 'parcial' | 'cancelado'
  setFilterStatus: (status: 'todos' | 'pago' | 'aberto' | 'parcial' | 'cancelado') => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'todos' | 'receita' | 'despesa'>('todos')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pago' | 'aberto' | 'parcial' | 'cancelado'>('todos')

  return (
    <SearchContext.Provider value={{ 
      searchTerm, setSearchTerm, 
      filterType, setFilterType,
      filterStatus, setFilterStatus
    }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export interface ParseResult<T> {
  data: T[]
  errors: string[]
}

export async function parseCSV<T>(file: File): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          data: results.data as T[],
          errors: results.errors.map(e => e.message)
        })
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [error.message]
        })
      }
    })
  })
}

export async function parseExcel<T>(file: File): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        resolve({
          data: json as T[],
          errors: []
        })
      } catch (error: any) {
        resolve({
          data: [],
          errors: [error.message || 'Erro ao processar Excel.']
        })
      }
    }
    reader.onerror = () => resolve({ data: [], errors: ['Erro ao ler arquivo.'] })
    reader.readAsArrayBuffer(file)
  })
}

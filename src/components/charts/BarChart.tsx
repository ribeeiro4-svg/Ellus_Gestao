'use client'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// Configuração Global de Eixos e Fontes
ChartJS.defaults.font.family = "'DM Sans', sans-serif";

interface BarChartProps {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string
    borderRadius?: number
  }[]
  stacked?: boolean
}

export default function BarChart({ labels, datasets, stacked = false }: BarChartProps) {
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 25,
          color: '#64748b',
          font: { size: 11, weight: 700 },
        },
      },
      tooltip: {
        backgroundColor: '#0f1829',
        bodyFont: { size: 12, weight: 500 },
        titleFont: { size: 13, weight: 700 },
        padding: 12,
        cornerRadius: 12,
        usePointStyle: true,
        boxPadding: 8,
      },
    },
    scales: {
      x: {
        stacked,
        grid: { display: false },
        ticks: { 
          color: '#94a3b8',
          font: { size: 10, weight: 500 } 
        },
      },
      y: {
        stacked,
        grid: { color: '#f1f5f9', drawTicks: false },
        border: { display: false },
        ticks: { 
          color: '#94a3b8',
          font: { size: 10, weight: 500 },
          padding: 10
        },
      },
    },
  }

  const data = {
    labels,
    datasets: datasets.map(ds => ({
      ...ds,
      barThickness: 24,
      borderRadius: 6,
      maxBarThickness: 32,
    })),
  }

  return <Bar options={options} data={data} />
}

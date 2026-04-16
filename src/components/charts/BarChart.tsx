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
          padding: 20,
          font: { size: 11, weight: 'bold' },
        },
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#0f172a',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        stacked,
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
      y: {
        stacked,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 10 } },
      },
    },
  }

  const data = {
    labels,
    datasets: datasets.map(ds => ({
      ...ds,
      barThickness: 24,
      maxBarThickness: 32,
    })),
  }

  return <Bar options={options} data={data} />
}

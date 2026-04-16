'use client'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DoughnutChartProps {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string[]
    borderWidth?: number
  }[]
}

export default function DoughnutChart({ labels, datasets }: DoughnutChartProps) {
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
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
      },
    },
  }

  const data = {
    labels,
    datasets: datasets.map(ds => ({
      ...ds,
      borderWidth: ds.borderWidth || 0,
      hoverOffset: 12,
    })),
  }

  return <Doughnut options={options} data={data} />
}

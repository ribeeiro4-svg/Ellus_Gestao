'use client'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  ChartOptions
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
)

interface LineChartProps {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    fill?: boolean
  }[]
}

export default function LineChart({ labels, datasets }: LineChartProps) {
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: {
        tension: 0.45,
        borderWidth: 3,
        borderCapStyle: 'round',
      },
      point: {
        radius: 0,
        hoverRadius: 8,
        borderWidth: 2,
        hoverBorderWidth: 4,
        hoverBackgroundColor: '#fff',
      },
    },
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
        grid: { display: false },
        ticks: { 
          color: '#94a3b8',
          font: { size: 10, weight: 500 } 
        },
      },
      y: {
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

  const data = { labels, datasets }

  return <Line options={options} data={data} />
}

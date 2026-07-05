import React from 'react';
import { AlignLeft } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { fmtR } from '@/lib/utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function SlideWaterfall() {
  // Mock data para o Waterfall. Isso vira do Context/Backend futuramente.
  const waterfallData = [
    { label: 'Receitas (Bruto)', value: 125000, type: 'start' },
    { label: '(-) Inadimplência', value: -15000, type: 'loss' },
    { label: '(-) Despesas Operac.', value: -45000, type: 'loss' },
    { label: '(-) Folha/Impostos', value: -35000, type: 'loss' },
    { label: '(+) Rendimentos', value: 5000, type: 'gain' },
    { label: 'Resultado Final', value: 35000, type: 'total' },
  ];

  // Calcular arrays [start, end] para o ChartJS (Floating Bars)
  const labels = waterfallData.map(d => d.label);
  const dataPairs: [number, number][] = [];
  const backgroundColors: string[] = [];
  const borderColors: string[] = [];

  let currentTotal = 0;

  waterfallData.forEach((item) => {
    if (item.type === 'start') {
      dataPairs.push([0, item.value]);
      currentTotal = item.value;
      backgroundColors.push('rgba(52, 211, 153, 0.2)'); // Emerald
      borderColors.push('rgba(52, 211, 153, 1)');
    } else if (item.type === 'total') {
      dataPairs.push([0, item.value]);
      backgroundColors.push('rgba(96, 165, 250, 0.2)'); // Blue
      borderColors.push('rgba(96, 165, 250, 1)');
    } else {
      const nextTotal = currentTotal + item.value;
      dataPairs.push([currentTotal, nextTotal]);
      currentTotal = nextTotal;
      if (item.value >= 0) {
        backgroundColors.push('rgba(52, 211, 153, 0.2)'); // Emerald
        borderColors.push('rgba(52, 211, 153, 1)');
      } else {
        backgroundColors.push('rgba(244, 63, 94, 0.2)'); // Rose
        borderColors.push('rgba(244, 63, 94, 1)');
      }
    }
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Valor',
        data: dataPairs,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false, // Arredondar todas as bordas
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#ccc',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const item = waterfallData[index];
            return `${item.label}: ${fmtR(item.value)}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { 
          color: 'rgba(255,255,255,0.5)',
          callback: (value: any) => fmtR(value)
        }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.5)' }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#020806] text-white p-12">
      <h1 className="text-4xl font-black mb-4 flex items-center gap-3">
        <AlignLeft className="text-amber-400" size={36} /> Resultado Financeiro (Waterfall)
      </h1>
      <p className="text-white/50 text-lg mb-8 max-w-3xl">
        Entenda exatamente onde o dinheiro foi investido e como chegamos ao saldo final do período, passo a passo.
      </p>
      
      <div className="flex-1 flex gap-8">
        {/* Gráfico Chart.js (Floating Bars) */}
        <div className="flex-[3] bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="h-full w-full relative">
            <Bar data={chartData} options={options} />
          </div>
        </div>

        {/* Resumo Lateral */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
            <h3 className="text-emerald-400/80 text-sm font-bold uppercase tracking-wider mb-2">Entradas Brutas</h3>
            <p className="text-3xl font-black text-emerald-400">{fmtR(130000)}</p>
          </div>
          
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6">
            <h3 className="text-rose-400/80 text-sm font-bold uppercase tracking-wider mb-2">Saídas Totais</h3>
            <p className="text-3xl font-black text-rose-400">{fmtR(95000)}</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mt-auto">
            <h3 className="text-blue-400/80 text-sm font-bold uppercase tracking-wider mb-2">Resultado Final</h3>
            <p className="text-4xl font-black text-blue-400">{fmtR(35000)}</p>
            <p className="text-xs text-white/40 mt-2">Margem Líquida de 26.9%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

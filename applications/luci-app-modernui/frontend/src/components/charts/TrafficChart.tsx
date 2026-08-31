import { useRef, useEffect } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Filler,
  Tooltip,
  type ChartData,
} from 'chart.js';
import { formatBytes } from '@/lib/utils';
import { t } from '@/i18n';

Chart.register(LineController, LineElement, PointElement, LinearScale, TimeScale, Filler, Tooltip);

interface TrafficPoint {
  ts: number;
  rx: number;
  tx: number;
}

interface TrafficChartProps {
  data: TrafficPoint[];
  className?: string;
}

export function TrafficChart({ data, className }: TrafficChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#a1a1aa' : '#71717a';

    const chartData: ChartData<'line'> = {
      labels: data.map((d) => new Date(d.ts * 1000).toLocaleTimeString()),
      datasets: [
        {
          label: t('dashboard.rx'),
          data: data.map((d) => d.rx),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
        {
          label: t('dashboard.tx'),
          data: data.map((d) => d.tx),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    };

    if (chartRef.current) {
      chartRef.current.data = chartData;
      chartRef.current.update('none');
      return;
    }

    chartRef.current = new Chart(canvas, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${formatBytes(ctx.parsed.y ?? 0)}/s`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: textColor, maxTicksLimit: 6, maxRotation: 0 },
            grid: { color: gridColor },
          },
          y: {
            ticks: {
              color: textColor,
              callback: (v) => formatBytes(Number(v)) + '/s',
            },
            grid: { color: gridColor },
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data]);

  return (
    <div className={className} style={{ position: 'relative', height: '200px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
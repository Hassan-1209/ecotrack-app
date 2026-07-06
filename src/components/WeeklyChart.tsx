import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import type { DailyLog } from '../lib/types';
import { formatCO2 } from '../lib/co2';
import { localDateStr } from '../lib/date';

interface Props {
  logs: DailyLog[];
  goalKg: number;
}

export default function WeeklyChart({ logs, goalKg }: Props) {
  // Build last 7 days, filling gaps with 0
  const chartData = useMemo(() => {
    const days: { date: string; label: string; total: number; isGoal: boolean; hasData: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = localDateStr(d);
      const log = logs.find((l) => l.log_date === dateStr);
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        total: log?.total_kg ?? 0,
        isGoal: log ? log.total_kg < goalKg : false,
        hasData: !!log,
      });
    }
    return days;
  }, [logs, goalKg]);

  const maxVal = Math.max(...chartData.map((d) => d.total), goalKg, 1) * 1.2;
  const daysWithData = chartData.filter((d) => d.total > 0);
  const avg = daysWithData.length > 0
    ? daysWithData.reduce((s, d) => s + d.total, 0) / daysWithData.length
    : 0;

  // SVG dimensions — use a wider viewBox for smoother rendering
  const width = 700;
  const height = 240;
  const padX = 40;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;
  const barSlot = chartW / chartData.length;
  const barWidth = barSlot * 0.55;
  const goalY = height - padY - (goalKg / maxVal) * chartH;

  // Build smooth area path for the trend line
  const points = chartData.map((d, i) => ({
    x: padX + i * barSlot + barSlot / 2,
    y: height - padY - (d.total / maxVal) * chartH,
    total: d.total,
  }));

  // Smooth line using cubic bezier
  const linePath = points.length > 0
    ? points.map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const cpX = (prev.x + p.x) / 2;
        return `C ${cpX} ${prev.y}, ${cpX} ${p.y}, ${p.x} ${p.y}`;
      }).join(' ')
    : '';

  // Area fill path (line + close to bottom)
  const areaPath = linePath
    ? `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`
    : '';

  return (
    <div className="card p-5 card-hover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-forest-600 dark:text-forest-300 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-forest-100 dark:bg-forest-700/60 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-forest-600 dark:text-forest-300" />
          </span>
          Weekly Trend
        </h3>
        <div className="text-right">
          <div className="text-xs text-forest-400">7-day avg</div>
          <div className="text-sm font-bold text-forest-600 dark:text-forest-300 tabular-nums">{formatCO2(avg)} kg</div>
        </div>
      </div>

      {/* SVG Chart with gradient fill + smooth line */}
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Gradient for area fill under the line */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a9843" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3a9843" stopOpacity="0.02" />
            </linearGradient>
            {/* Gradient for bars */}
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5cb465" />
              <stop offset="100%" stopColor="#3a9843" />
            </linearGradient>
            <linearGradient id="barOverGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e3a82f" />
              <stop offset="100%" stopColor="#d18d1a" />
            </linearGradient>
          </defs>

          {/* Y-axis grid lines (subtle) */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = height - padY - t * chartH;
            const val = (t * maxVal).toFixed(0);
            return (
              <g key={t}>
                <line
                  x1={padX} y1={y} x2={width - padX} y2={y}
                  className="stroke-forest-100 dark:stroke-forest-700/40"
                  strokeWidth={1}
                />
                <text x={padX - 8} y={y + 3} textAnchor="end" className="fill-forest-300 dark:fill-forest-500 text-[10px]">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Goal line */}
          <line
            x1={padX} y1={goalY} x2={width - padX} y2={goalY}
            className="stroke-earth-400"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
          <text x={width - padX} y={goalY - 6} textAnchor="end" className="fill-earth-500 dark:fill-earth-400 text-[10px] font-medium">
            Goal {goalKg}kg
          </text>

          {/* Area fill under the line */}
          {areaPath && (
            <path d={areaPath} fill="url(#areaGradient)" />
          )}

          {/* Smooth trend line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              className="stroke-forest-500"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Bars (behind the line, subtle) */}
          {chartData.map((d, i) => {
            if (d.total === 0) return null;
            const barH = (d.total / maxVal) * chartH;
            const x = padX + i * barSlot + (barSlot - barWidth) / 2;
            const y = height - padY - barH;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={6}
                fill={d.isGoal ? 'url(#barGradient)' : 'url(#barOverGradient)'}
                opacity={0.15}
              />
            );
          })}

          {/* Data point dots */}
          {points.map((p, i) => {
            if (p.total === 0) return null;
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={5} className="fill-white dark:fill-forest-800 stroke-forest-500" strokeWidth={2.5} />
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-1" style={{ paddingLeft: padX, paddingRight: padX }}>
          {chartData.map((d, i) => (
            <div key={i} className={`text-[11px] text-center flex-1 ${d.hasData ? 'text-forest-500 dark:text-forest-400 font-medium' : 'text-forest-300 dark:text-forest-600'}`}>
              {d.label}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-forest-500" />
          <span className="text-forest-500 dark:text-forest-400">Under goal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-earth-400" />
          <span className="text-forest-500 dark:text-forest-400">Over goal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-earth-400" style={{ borderTop: '2px dashed' }} />
          <span className="text-forest-500 dark:text-forest-400">Your goal ({goalKg} kg)</span>
        </div>
      </div>
    </div>
  );
}

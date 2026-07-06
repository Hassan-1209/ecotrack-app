import { Sparkles, Car, Salad, Zap, ArrowDown } from 'lucide-react';
import type { Insight } from '../lib/insights';

const CATEGORY_ICONS = {
  transport: Car,
  food: Salad,
  energy: Zap,
};

const CATEGORY_BG = {
  transport: 'bg-teal2-100 dark:bg-teal2-900/40 text-teal2-600 dark:text-teal2-400',
  food: 'bg-earth-100 dark:bg-earth-900/40 text-earth-600 dark:text-earth-400',
  energy: 'bg-forest-100 dark:bg-forest-700/60 text-forest-600 dark:text-forest-300',
};

export default function InsightCard({ insight }: { insight: Insight | null }) {
  if (!insight) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-8 h-8 rounded-full bg-forest-100 dark:bg-forest-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-forest-500" />
          </span>
          <h3 className="text-sm font-semibold text-forest-600 dark:text-forest-300">AI Insight</h3>
        </div>
        <p className="text-sm text-forest-400 dark:text-forest-500">
          Log a few days of activity to unlock personalized insights.
        </p>
      </div>
    );
  }

  const Icon = CATEGORY_ICONS[insight.category];
  const bgClass = CATEGORY_BG[insight.category];

  return (
    <div className="card p-5 card-hover animate-fade-in-up">
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`w-9 h-9 rounded-full flex items-center justify-center ${bgClass}`}>
          <Sparkles className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-forest-600 dark:text-forest-300">AI Insight</h3>
          <p className="text-xs text-forest-400">Personalized recommendation</p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 mb-3">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${bgClass}`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        <p className="text-sm font-semibold text-forest-700 dark:text-forest-50">
          {insight.headline}
        </p>
      </div>

      <p className="text-sm text-forest-600 dark:text-forest-200 leading-relaxed mb-3 pl-[34px]">
        {insight.tip}
      </p>

      <div className="flex items-center gap-2 text-xs pl-[34px]">
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-forest-100 dark:bg-forest-700 text-forest-600 dark:text-forest-300">
          <ArrowDown className="w-3 h-3" />
          <span className="font-bold">{insight.potentialReductionPct.toFixed(0)}% reduction</span>
        </div>
        <span className="text-forest-400 dark:text-forest-500">
          ~{insight.potentialReductionKg.toFixed(1)} kg CO₂/day
        </span>
      </div>
    </div>
  );
}

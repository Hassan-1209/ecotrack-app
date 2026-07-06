import { useState, useEffect } from 'react';
import { Car, Bus, Bike, Footprints, Plane, Salad, Zap, Save, Loader2, Check, Minus, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { calcTotalCO2, formatCO2, type DailyLogData } from '../lib/co2';
import { localDateStr } from '../lib/date';
import type { DailyLog } from '../lib/types';

// Icon background colors per category
const ICON_BG = {
  car: 'bg-teal2-100 dark:bg-teal2-900/40 text-teal2-600 dark:text-teal2-400',
  bus: 'bg-sky2-100 dark:bg-sky2-900/40 text-sky2-600 dark:text-sky2-400',
  bike: 'bg-forest-100 dark:bg-forest-700/60 text-forest-600 dark:text-forest-300',
  walk: 'bg-sage-100 dark:bg-sage-800/40 text-sage-600 dark:text-sage-300',
  flight: 'bg-earth-100 dark:bg-earth-900/40 text-earth-600 dark:text-earth-400',
  energy: 'bg-earth-100 dark:bg-earth-900/40 text-earth-600 dark:text-earth-400',
  food: 'bg-teal2-100 dark:bg-teal2-900/40 text-teal2-600 dark:text-teal2-400',
};

export default function ActivityLog() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  const [data, setData] = useState<DailyLogData>({
    car_km: 0, bus_km: 0, bike_km: 0, walk_km: 0, flight_km: 0,
    meat_heavy_meals: 0, mixed_meals: 0, vegetarian_meals: 0, vegan_meals: 0,
    ac_hours: 0, appliance_kwh: 0,
  });

  const breakdown = calcTotalCO2(data);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: existing } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', localDateStr())
        .maybeSingle();

      if (existing) {
        const log = existing as DailyLog;
        setExistingId(log.id);
        setData({
          car_km: log.car_km, bus_km: log.bus_km, bike_km: log.bike_km,
          walk_km: log.walk_km, flight_km: log.flight_km,
          meat_heavy_meals: log.meat_heavy_meals, mixed_meals: log.mixed_meals,
          vegetarian_meals: log.vegetarian_meals, vegan_meals: log.vegan_meals,
          ac_hours: log.ac_hours, appliance_kwh: log.appliance_kwh,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);

    const payload = {
      user_id: user.id,
      log_date: localDateStr(),
      ...data,
      total_kg: breakdown.total,
    };

    if (existingId) {
      const { error } = await supabase.from('daily_logs').update(payload).eq('id', existingId);
      if (error) console.error(error);
    } else {
      const { data: inserted, error } = await supabase.from('daily_logs').insert(payload).select().maybeSingle();
      if (inserted) setExistingId((inserted as DailyLog).id);
      if (error) console.error(error);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // Trigger dashboard refresh — numbers update immediately
    window.dispatchEvent(new CustomEvent('ecotrack-log-updated'));
  };

  const update = (field: keyof DailyLogData, value: number) => {
    setData((prev) => ({ ...prev, [field]: Math.max(0, value) }));
  };

  if (loading) {
    return (
      <div className="card p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-forest-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-forest-700 dark:text-forest-50">Today's Activity</h2>
          <p className="text-sm text-forest-500 dark:text-forest-300">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="text-right">
          <div key={breakdown.total} className="stat-number text-2xl text-forest-600 dark:text-forest-300 animate-count-up">
            {formatCO2(breakdown.total)}
          </div>
          <div className="text-xs text-forest-400">kg CO₂ today</div>
        </div>
      </div>

      {/* Transport */}
      <div className="card p-5 card-hover">
        <h3 className="text-sm font-semibold text-forest-600 dark:text-forest-300 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-teal2-100 dark:bg-teal2-900/40 flex items-center justify-center">
            <Car className="w-3.5 h-3.5 text-teal2-600 dark:text-teal2-400" />
          </span>
          Transport
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField icon={Car} iconBg={ICON_BG.car} label="Car (km)" value={data.car_km} onChange={(v) => update('car_km', v)} step={1} />
          <NumberField icon={Bus} iconBg={ICON_BG.bus} label="Bus (km)" value={data.bus_km} onChange={(v) => update('bus_km', v)} step={1} />
          <NumberField icon={Bike} iconBg={ICON_BG.bike} label="Bike (km)" value={data.bike_km} onChange={(v) => update('bike_km', v)} step={1} />
          <NumberField icon={Footprints} iconBg={ICON_BG.walk} label="Walk (km)" value={data.walk_km} onChange={(v) => update('walk_km', v)} step={0.5} />
          <NumberField icon={Plane} iconBg={ICON_BG.flight} label="Flight (km)" value={data.flight_km} onChange={(v) => update('flight_km', v)} step={100} />
        </div>
        <div className="mt-3 text-xs text-forest-400 dark:text-forest-500">
          Transport subtotal: <span className="font-semibold text-teal2-600 dark:text-teal2-400">{formatCO2(breakdown.transport)}</span> kg CO₂
        </div>
      </div>

      {/* Food */}
      <div className="card p-5 card-hover">
        <h3 className="text-sm font-semibold text-forest-600 dark:text-forest-300 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-teal2-100 dark:bg-teal2-900/40 flex items-center justify-center">
            <Salad className="w-3.5 h-3.5 text-teal2-600 dark:text-teal2-400" />
          </span>
          Food (meals today)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StepperField label="Meat-heavy" value={data.meat_heavy_meals} onChange={(v) => update('meat_heavy_meals', v)} />
          <StepperField label="Mixed" value={data.mixed_meals} onChange={(v) => update('mixed_meals', v)} />
          <StepperField label="Vegetarian" value={data.vegetarian_meals} onChange={(v) => update('vegetarian_meals', v)} />
          <StepperField label="Vegan" value={data.vegan_meals} onChange={(v) => update('vegan_meals', v)} />
        </div>
        <div className="mt-3 text-xs text-forest-400 dark:text-forest-500">
          Food subtotal: <span className="font-semibold text-earth-600 dark:text-earth-400">{formatCO2(breakdown.food)}</span> kg CO₂
        </div>
      </div>

      {/* Energy */}
      <div className="card p-5 card-hover">
        <h3 className="text-sm font-semibold text-forest-600 dark:text-forest-300 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-earth-100 dark:bg-earth-900/40 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-earth-600 dark:text-earth-400" />
          </span>
          Energy Use
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField icon={Zap} iconBg={ICON_BG.energy} label="AC/Heating (hours)" value={data.ac_hours} onChange={(v) => update('ac_hours', v)} step={0.5} />
          <NumberField icon={Zap} iconBg={ICON_BG.energy} label="Appliances (kWh)" value={data.appliance_kwh} onChange={(v) => update('appliance_kwh', v)} step={0.5} />
        </div>
        <div className="mt-3 text-xs text-forest-400 dark:text-forest-500">
          Energy subtotal: <span className="font-semibold text-forest-600 dark:text-forest-400">{formatCO2(breakdown.energy)}</span> kg CO₂
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <Check className="w-4 h-4" />
            Saved!
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Today's Log
          </>
        )}
      </button>
    </div>
  );
}

function NumberField({
  icon: Icon,
  iconBg,
  label,
  value,
  onChange,
  step,
}: {
  icon: typeof Car;
  iconBg: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-forest-500 dark:text-forest-400 mb-1.5">
        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${iconBg}`}>
          <Icon className="w-3 h-3" />
        </span>
        {label}
      </label>
      <input
        type="number"
        min={0}
        step={step}
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="input-base"
        placeholder="0"
      />
    </div>
  );
}

function StepperField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <label className="text-xs font-medium text-forest-500 dark:text-forest-400 mb-2 text-center">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value === 0}
          className="w-9 h-9 rounded-xl bg-forest-100 dark:bg-forest-700 text-forest-600 dark:text-forest-200 font-bold hover:bg-forest-200 dark:hover:bg-forest-600 active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span key={value} className="w-8 text-center text-lg font-bold text-forest-700 dark:text-forest-50 tabular-nums animate-count-up">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-xl bg-forest-500 text-white font-bold hover:bg-forest-600 active:scale-90 transition-all flex items-center justify-center shadow-sm"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

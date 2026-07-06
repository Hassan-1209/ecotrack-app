import { useState, useEffect } from 'react';
import { Heart, Sun, Battery, Save, Loader2, Check, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { localDateStr, daysAgoStr } from '../lib/date';
import type { WellbeingLog, DailyLog } from '../lib/types';

const ENERGY_LABELS = ['Exhausted', 'Tired', 'Okay', 'Good', 'Energized'];
const ENERGY_COLORS = [
  'bg-earth-500',
  'bg-earth-400',
  'bg-forest-400',
  'bg-forest-500',
  'bg-teal2-500',
];

export default function WellbeingCheckIn() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);

  const [energyLevel, setEnergyLevel] = useState(3);
  const [outdoorMinutes, setOutdoorMinutes] = useState(30);
  const [mood, setMood] = useState('');

  const [weekData, setWeekData] = useState<{ outdoor: number; energy: number; co2: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: existing } = await supabase
        .from('wellbeing_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', localDateStr())
        .maybeSingle();

      if (existing) {
        const log = existing as WellbeingLog;
        setExistingId(log.id);
        setEnergyLevel(log.energy_level);
        setOutdoorMinutes(log.outdoor_minutes);
        setMood(log.mood ?? '');
      }

      const startDate = daysAgoStr(6);

      const [{ data: wellbeing }, { data: daily }] = await Promise.all([
        supabase.from('wellbeing_logs').select('*').eq('user_id', user.id).gte('log_date', startDate).order('log_date'),
        supabase.from('daily_logs').select('*').eq('user_id', user.id).gte('log_date', startDate).order('log_date'),
      ]);

      if (wellbeing && daily) {
        const combined = (wellbeing as WellbeingLog[]).map((w) => {
          const d = (daily as DailyLog[]).find((dl) => dl.log_date === w.log_date);
          return {
            outdoor: w.outdoor_minutes,
            energy: w.energy_level,
            co2: d?.total_kg ?? 0,
          };
        });
        setWeekData(combined);
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
      energy_level: energyLevel,
      outdoor_minutes: outdoorMinutes,
      mood: mood || null,
    };

    if (existingId) {
      await supabase.from('wellbeing_logs').update(payload).eq('id', existingId);
    } else {
      const { data: inserted } = await supabase.from('wellbeing_logs').insert(payload).select().maybeSingle();
      if (inserted) setExistingId((inserted as WellbeingLog).id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.dispatchEvent(new CustomEvent('ecotrack-wellbeing-updated'));
  };

  if (loading) {
    return (
      <div className="card p-5 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-forest-500" />
      </div>
    );
  }

  const hasCorrelation = weekData.length >= 3;
  const avgOutdoor = hasCorrelation ? weekData.reduce((s, d) => s + d.outdoor, 0) / weekData.length : 0;
  const avgEnergy = hasCorrelation ? weekData.reduce((s, d) => s + d.energy, 0) / weekData.length : 0;

  return (
    <div className="card p-5 card-hover animate-fade-in-up">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-9 h-9 rounded-full bg-sky2-100 dark:bg-sky2-900/40 flex items-center justify-center">
          <Heart className="w-4 h-4 text-sky2-500" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-forest-600 dark:text-forest-300">Wellbeing Check-In</h3>
          <p className="text-xs text-forest-400">Connecting sustainable habits with health</p>
        </div>
      </div>

      {/* Energy level selector */}
      <div className="mb-4">
        <label className="flex items-center gap-1.5 text-xs font-medium text-forest-500 dark:text-forest-400 mb-2">
          <span className="w-5 h-5 rounded-full bg-sky2-100 dark:bg-sky2-900/40 flex items-center justify-center">
            <Battery className="w-3 h-3 text-sky2-500" />
          </span>
          Energy Level
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setEnergyLevel(lvl)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-90 ${
                energyLevel === lvl
                  ? `${ENERGY_COLORS[lvl - 1]} text-white shadow-sm`
                  : 'bg-forest-50 dark:bg-forest-700 text-forest-400 hover:bg-forest-100 dark:hover:bg-forest-600'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <p key={energyLevel} className="text-xs text-forest-400 dark:text-forest-500 mt-1.5 text-center animate-fade-in">
          {ENERGY_LABELS[energyLevel - 1]}
        </p>
      </div>

      {/* Outdoor time */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-forest-500 dark:text-forest-400">
            <span className="w-5 h-5 rounded-full bg-earth-100 dark:bg-earth-900/40 flex items-center justify-center">
              <Sun className="w-3 h-3 text-earth-500" />
            </span>
            Outdoor Time
          </label>
          <span className="text-sm font-bold text-forest-600 dark:text-forest-300 tabular-nums">{outdoorMinutes} min</span>
        </div>
        <input
          type="range"
          min={0}
          max={240}
          step={5}
          value={outdoorMinutes}
          onChange={(e) => setOutdoorMinutes(parseInt(e.target.value))}
          className="w-full accent-sky2-500 cursor-pointer"
        />
      </div>

      {/* Mood (optional) */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-forest-500 dark:text-forest-400 mb-1.5">
          How are you feeling? (optional)
        </label>
        <input
          type="text"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="e.g. Great, motivated, tired..."
          className="input-base"
        />
      </div>

      {/* Correlation insight */}
      {hasCorrelation && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-sky2-50 dark:bg-sky2-900/20 mb-4">
          <TrendingUp className="w-4 h-4 text-sky2-500 mt-0.5 shrink-0" />
          <p className="text-xs text-sky2-700 dark:text-sky2-300">
            This week you averaged <strong>{avgOutdoor.toFixed(0)} min</strong> outdoors with energy level{' '}
            <strong>{avgEnergy.toFixed(1)}/5</strong>. More outdoor time often means more active transport — and a lower footprint.
          </p>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-secondary w-full flex items-center justify-center gap-2"
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
            Save Check-In
          </>
        )}
      </button>
    </div>
  );
}

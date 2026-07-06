import { useState } from 'react';
import { Leaf, Car, Bus, Bike, Footprints, Salad, Zap, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { localDateStr } from '../lib/date';
import type { DietType } from '../lib/types';

const DIET_OPTIONS: { value: DietType; label: string; icon: typeof Salad }[] = [
  { value: 'meat_heavy', label: 'Meat-heavy', icon: Salad },
  { value: 'mixed', label: 'Mixed', icon: Salad },
  { value: 'vegetarian', label: 'Vegetarian', icon: Salad },
  { value: 'vegan', label: 'Vegan', icon: Salad },
];

export default function Onboarding() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding data
  const [carKm, setCarKm] = useState(50);
  const [busKm, setBusKm] = useState(20);
  const [bikeKm, setBikeKm] = useState(10);
  const [walkKm, setWalkKm] = useState(5);
  const [diet, setDiet] = useState<DietType>('mixed');
  const [acHours, setAcHours] = useState(4);
  const [goalKg, setGoalKg] = useState(14);

  const steps = ['Transport', 'Diet', 'Energy', 'Goal'];

  const handleFinish = async () => {
    setLoading(true);
    setError(null);

    // 1. Create/update profile
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user!.id,
      typical_car_km: carKm,
      typical_bus_km: busKm,
      typical_bike_km: bikeKm,
      typical_walk_km: walkKm,
      typical_diet: diet,
      typical_ac_hours: acHours,
      daily_goal_kg: goalKg,
      onboarded: true,
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    // 2. Seed 7 days of sample data so charts are populated immediately
    //    Pass the client's local date so seeded dates match the frontend
    const { error: seedError } = await supabase.rpc('seed_sample_data', {
      p_end_date: localDateStr(),
    });
    if (seedError) {
      // Non-fatal — user can still use the app without seed data
      console.warn('Seed failed:', seedError.message);
    }

    setLoading(false);
    // The app will re-render when onboarded flag is checked by parent
    window.location.reload();
  };

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-forest-50 via-forest-100 to-sage-100 dark:from-forest-950 dark:via-forest-900 dark:to-sage-900">
      <div className="w-full max-w-lg animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center shadow-lg shadow-forest-500/30 mb-3">
            <Leaf className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-forest-700 dark:text-forest-50">Welcome to EcoTrack</h1>
          <p className="text-forest-500 dark:text-forest-200 text-sm mt-1 text-center">
            Let's set up your personalized baseline in {steps.length} quick steps.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
                i <= step ? 'bg-forest-500' : 'bg-forest-200 dark:bg-forest-700'
              }`}
            />
          ))}
        </div>

        <div className="card p-8">
          {/* Step 0: Transport */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-forest-700 dark:text-forest-50 mb-1">
                  Your typical weekly transport
                </h2>
                <p className="text-sm text-forest-500 dark:text-forest-300">
                  How do you usually get around in a week?
                </p>
              </div>

              <SliderField icon={Car} label="Car (km/week)" value={carKm} onChange={setCarKm} min={0} max={300} step={5} />
              <SliderField icon={Bus} label="Bus (km/week)" value={busKm} onChange={setBusKm} min={0} max={200} step={5} />
              <SliderField icon={Bike} label="Bike (km/week)" value={bikeKm} onChange={setBikeKm} min={0} max={150} step={5} />
              <SliderField icon={Footprints} label="Walking (km/week)" value={walkKm} onChange={setWalkKm} min={0} max={100} step={1} />
            </div>
          )}

          {/* Step 1: Diet */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-forest-700 dark:text-forest-50 mb-1">
                  Your typical diet
                </h2>
                <p className="text-sm text-forest-500 dark:text-forest-300">
                  Which best describes your usual eating habits?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {DIET_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = diet === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setDiet(opt.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? 'border-forest-500 bg-forest-50 dark:bg-forest-700'
                          : 'border-forest-200 dark:border-forest-600 hover:border-forest-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${selected ? 'text-forest-600 dark:text-forest-300' : 'text-forest-400'}`} />
                      <span className={`text-sm font-medium ${selected ? 'text-forest-700 dark:text-forest-50' : 'text-forest-500 dark:text-forest-300'}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Energy */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-forest-700 dark:text-forest-50 mb-1">
                  Your home energy use
                </h2>
                <p className="text-sm text-forest-500 dark:text-forest-300">
                  How many hours/day do you typically run AC or heating?
                </p>
              </div>

              <SliderField icon={Zap} label="AC/Heating (hours/day)" value={acHours} onChange={setAcHours} min={0} max={24} step={0.5} />
            </div>
          )}

          {/* Step 3: Goal */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-forest-700 dark:text-forest-50 mb-1">
                  Set your daily CO₂ goal
                </h2>
                <p className="text-sm text-forest-500 dark:text-forest-300">
                  The national average is ~16 kg CO₂/day. Aim lower to make an impact!
                </p>
              </div>

              <div className="text-center py-4">
                <div className="text-5xl font-bold text-forest-600 dark:text-forest-300">
                  {goalKg}
                </div>
                <div className="text-sm text-forest-500 dark:text-forest-400 mt-1">kg CO₂ / day</div>
              </div>

              <SliderField icon={Leaf} label="Daily goal" value={goalKg} onChange={setGoalKg} min={5} max={25} step={0.5} />

              <div className="text-xs text-forest-400 dark:text-forest-400 bg-forest-50 dark:bg-forest-700/50 rounded-lg p-3">
                We'll pre-seed 7 days of sample data so your charts and insights are ready to go immediately.
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-earth-700 dark:text-earth-300 bg-earth-50 dark:bg-earth-900/30 rounded-lg p-3 mt-4 animate-fade-in">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={back} className="btn-secondary flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={next} className="btn-primary flex-1 flex items-center justify-center gap-2">
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleFinish} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Start Tracking
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderField({
  icon: Icon,
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  icon: typeof Car;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-forest-500" />
          <label className="text-sm font-medium text-forest-700 dark:text-forest-200">{label}</label>
        </div>
        <span className="text-sm font-semibold text-forest-600 dark:text-forest-300 tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-forest-500 cursor-pointer"
      />
    </div>
  );
}

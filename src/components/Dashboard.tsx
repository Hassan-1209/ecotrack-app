import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { calcTotalCO2, EMISSION_FACTORS, type DailyLogData } from '../lib/co2';
import { generateInsight, calculateStreak, type Insight } from '../lib/insights';
import { localDateStr } from '../lib/date';
import type { DailyLog, Profile } from '../lib/types';
import Header from './Header';
import FootprintSummary from './FootprintSummary';
import WeeklyChart from './WeeklyChart';
import InsightCard from './InsightCard';
import ActivityLog from './ActivityLog';
import WellbeingCheckIn from './WellbeingCheckIn';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;

    const [{ data: profileData }, { data: logsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('daily_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }).limit(30),
    ]);

    if (profileData) setProfile(profileData as Profile);
    if (logsData) setLogs(logsData as DailyLog[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();

    const handler = () => loadData();
    window.addEventListener('ecotrack-log-updated', handler);
    window.addEventListener('ecotrack-wellbeing-updated', handler);
    return () => {
      window.removeEventListener('ecotrack-log-updated', handler);
      window.removeEventListener('ecotrack-wellbeing-updated', handler);
    };
  }, [loadData]);

  // Today's log data (for footprint summary) — uses local date to match DB
  const today = localDateStr();
  const todayLog = logs.find((l) => l.log_date === today);

  const todayData: DailyLogData = todayLog
    ? {
        car_km: todayLog.car_km, bus_km: todayLog.bus_km, bike_km: todayLog.bike_km,
        walk_km: todayLog.walk_km, flight_km: todayLog.flight_km,
        meat_heavy_meals: todayLog.meat_heavy_meals, mixed_meals: todayLog.mixed_meals,
        vegetarian_meals: todayLog.vegetarian_meals, vegan_meals: todayLog.vegan_meals,
        ac_hours: todayLog.ac_hours, appliance_kwh: todayLog.appliance_kwh,
      }
    : {
        car_km: 0, bus_km: 0, bike_km: 0, walk_km: 0, flight_km: 0,
        meat_heavy_meals: 0, mixed_meals: 0, vegetarian_meals: 0, vegan_meals: 0,
        ac_hours: 0, appliance_kwh: 0,
      };

  const breakdown = calcTotalCO2(todayData);
  const goalKg = profile?.daily_goal_kg ?? 16;

  // Streak: consecutive days under goal
  const streak = calculateStreak(
    logs.map((l) => ({ log_date: l.log_date, total_kg: l.total_kg })),
    goalKg,
  );

  // AI insight: use last 7 days of logs
  const last7 = logs.slice(0, 7).map((l) => ({
    car_km: l.car_km, bus_km: l.bus_km, bike_km: l.bike_km, walk_km: l.walk_km,
    flight_km: l.flight_km, meat_heavy_meals: l.meat_heavy_meals, mixed_meals: l.mixed_meals,
    vegetarian_meals: l.vegetarian_meals, vegan_meals: l.vegan_meals, ac_hours: l.ac_hours,
    appliance_kwh: l.appliance_kwh,
  }));
  // Average breakdown across last 7 days for insight
  const avgBreakdown = last7.length > 0
    ? {
        transport: last7.reduce((s, l) => s + (l.car_km * EMISSION_FACTORS.car + l.bus_km * EMISSION_FACTORS.bus + l.flight_km * EMISSION_FACTORS.flight), 0) / last7.length,
        food: last7.reduce((s, l) => s + (l.meat_heavy_meals * EMISSION_FACTORS.meat_heavy + l.mixed_meals * EMISSION_FACTORS.mixed + l.vegetarian_meals * EMISSION_FACTORS.vegetarian + l.vegan_meals * EMISSION_FACTORS.vegan), 0) / last7.length,
        energy: last7.reduce((s, l) => s + (l.ac_hours * EMISSION_FACTORS.ac_heating + l.appliance_kwh * EMISSION_FACTORS.appliance), 0) / last7.length,
        total: 0,
      }
    : { transport: 0, food: 0, energy: 0, total: 0 };
  avgBreakdown.total = avgBreakdown.transport + avgBreakdown.food + avgBreakdown.energy;

  const insight: Insight | null = generateInsight(last7, avgBreakdown);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest-50 dark:bg-forest-950">
        <div className="w-8 h-8 border-2 border-forest-200 border-t-forest-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-forest-50 dark:bg-forest-950 transition-colors duration-300">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome */}
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold text-forest-700 dark:text-forest-50">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
          </h2>
          <p className="text-sm text-forest-500 dark:text-forest-300 mt-1">
            Track your impact, build sustainable habits, and see how they connect to your wellbeing.
          </p>
        </div>

        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Summary + Chart */}
          <div className="lg:col-span-2 space-y-6">
            <FootprintSummary breakdown={breakdown} streak={streak} goalKg={goalKg} />
            <WeeklyChart logs={logs} goalKg={goalKg} />
            <InsightCard insight={insight} />
          </div>

          {/* Right column: Activity log + Wellbeing */}
          <div className="space-y-6">
            <ActivityLog />
            <WellbeingCheckIn />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-forest-100 dark:border-forest-700 text-center">
          <p className="text-xs text-forest-400 dark:text-forest-500">
            EcoTrack — CO₂ estimates use public emission factors (EPA, DEFRA, Poore & Nemecek 2018).
            Built for demonstration purposes.
          </p>
        </footer>
      </main>
    </div>
  );
}

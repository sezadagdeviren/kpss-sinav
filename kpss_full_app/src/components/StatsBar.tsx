import type { Stats } from '../types';

interface StatsBarProps {
  stats: Stats | null;
}

export const StatsBar = ({ stats }: StatsBarProps) => {
  if (!stats) return null;

  return (
    <div className="flex items-center gap-2 p-1 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
      <StatItem label="Doğru" value={stats.correct_count} color="text-emerald-400" />
      <StatItem label="Yanlış" value={stats.wrong_count} color="text-rose-400" />
      <StatItem label="Boş" value={stats.empty_count} color="text-slate-500" />
    </div>
  );
};

const StatItem = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex flex-col items-center px-4 py-1.5 min-w-[65px]">
    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{label}</span>
    <span className={`text-lg font-black ${color}`}>{value}</span>
  </div>
);

import { useNavigate } from 'react-router-dom';

interface CategoryCardProps {
  name: string;
  onClick: () => void;
  iconColor?: string;
  badgeCount?: number;
  description?: string;
}

export function SelectionCategoryCard({ name, onClick, iconColor = 'indigo', badgeCount, description = 'Çıkmış Sorular' }: CategoryCardProps) {
  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-400 group-hover:bg-indigo-500',
    rose: 'text-rose-400 group-hover:bg-rose-500',
    amber: 'text-amber-400 group-hover:bg-amber-500',
  };

  return (
    <button onClick={onClick} className="glass-card group p-8 rounded-[2rem] text-left hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
      <div className={`w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 transition-all font-black text-xl shadow-lg group-hover:text-white ${colorMap[iconColor]}`}>
        {name[0]}
      </div>
      <h2 className="text-2xl font-black">{name}</h2>
      <p className="text-slate-500 text-[10px] mt-2 font-black uppercase tracking-widest">{description}</p>
      
      {badgeCount !== undefined && badgeCount > 0 && (
        <div className="absolute top-8 right-8 bg-white/10 px-3 py-1 rounded-full text-xs font-black text-white backdrop-blur-md">
          {badgeCount}
        </div>
      )}
    </button>
  );
}

interface YearCardProps {
  year: string;
  onClick: () => void;
  count?: number;
  countColor?: string;
  summary?: {
    last_time: number;
    last_correct: number;
    last_wrong: number;
    last_empty: number;
  };
}

export function SelectionYearCard({ year, onClick, count, countColor = 'indigo', summary }: YearCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const badgeColors: Record<string, string> = {
    indigo: 'bg-indigo-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
  };

  return (
    <button 
      onClick={onClick} 
      className="glass-card relative p-12 rounded-[2.5rem] text-3xl font-black hover:bg-white/5 hover:border-indigo-500/20 transition-all group overflow-hidden"
    >
      {year}

      {/* STATS OVERLAY FOR REGULAR EXAMS */}
      {summary && (
        <>
          <div className="absolute top-4 left-6 flex flex-col items-start opacity-60">
            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Süre</span>
            <span className="text-[11px] font-black text-white leading-none">{formatTime(summary.last_time)}</span>
          </div>
          <div className="absolute top-4 right-6 flex items-center gap-1.5 opacity-80">
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-emerald-500">D</span>
              <span className="text-[10px] font-black text-white leading-none">{summary.last_correct}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-rose-500">Y</span>
              <span className="text-[10px] font-black text-white leading-none">{summary.last_wrong}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-black text-slate-500">B</span>
              <span className="text-[10px] font-black text-white leading-none">{summary.last_empty}</span>
            </div>
          </div>
        </>
      )}

      {/* BADGE FOR REVIEW MODES */}
      {count !== undefined && (
        <div className={`absolute -top-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black shadow-2xl border-2 border-slate-950 transition-transform group-hover:scale-110 ${count > 0 ? `${badgeColors[countColor]} text-white animate-pulse` : 'bg-slate-800 text-slate-500'}`}>
          {count}
        </div>
      )}

      <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/[0.02] transition-colors pointer-events-none"></div>
    </button>
  );
}

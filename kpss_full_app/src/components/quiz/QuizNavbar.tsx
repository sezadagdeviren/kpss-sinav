import { useNavigate } from 'react-router-dom';
import { StatsBar } from '../StatsBar';
import type { Stats } from '../../types';

interface QuizNavbarProps {
  category?: string;
  year?: string;
  isReview: boolean;
  isFavoritesMode: boolean;
  isGlobalReview: boolean;
  timer: number;
  formatTime: (s: number) => string;
  currentIdx: number;
  totalQuestions: number;
  stats: Stats | null;
  shouldShowTimer: boolean;
}

export function QuizNavbar({
  category,
  year,
  isReview,
  isFavoritesMode,
  isGlobalReview,
  timer,
  formatTime,
  currentIdx,
  totalQuestions,
  stats,
  shouldShowTimer
}: QuizNavbarProps) {
  const navigate = useNavigate();

  return (
    <nav className="min-h-16 flex-shrink-0 flex flex-wrap items-center justify-between px-4 md:px-6 py-2 md:py-0 glass-card border-b border-white/5 z-50 gap-y-2">
      <div className="flex items-center gap-2 md:gap-4 order-1">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">←</button>
        <div className="flex flex-col">
          <span className="text-[7px] md:text-[9px] text-indigo-400 font-black tracking-widest uppercase truncate max-w-[80px] md:max-w-none">{isFavoritesMode ? '★ FAVORİLERİM' : (isReview ? 'HATA MERKEZİ' : category)}</span>
          <h2 className="text-[11px] md:text-sm font-black leading-none">{isGlobalReview ? 'Tüm Kayıtlar' : `${year} Sınavı`}</h2>
        </div>
      </div>

      {shouldShowTimer && (
        <div className="flex flex-col items-center glass-card px-4 md:px-8 py-1 rounded-2xl border-indigo-500/10 order-3 md:order-2 mx-auto md:mx-0">
          <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">KRONOMETRE</span>
          <span className="text-sm md:text-xl font-black tracking-tighter text-indigo-400 tabular-nums">
            {formatTime(timer)}
          </span>
        </div>
      )}

      <div className="hidden lg:block order-2">
        {!isReview && !isFavoritesMode && <StatsBar stats={stats} />}
      </div>

      <div className="flex items-center gap-2 md:gap-4 order-2 md:order-4">
        <div className="px-3 md:px-5 py-2 glass-card rounded-xl text-[10px] md:text-xs font-black text-indigo-300 shadow-lg shadow-indigo-500/5">
          {currentIdx + 1} / {totalQuestions}
        </div>
      </div>
    </nav>
  );
}

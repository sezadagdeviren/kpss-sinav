import type { Stats } from '../../types';

interface QuizSummaryProps {
  timer: number;
  formatTime: (s: number) => string;
  totalQuestions: number;
  stats: Stats | null;
  onJumpToStart: () => void;
  onClose: () => void;
}

export function QuizSummary({
  timer,
  formatTime,
  totalQuestions,
  stats,
  onJumpToStart,
  onClose
}: QuizSummaryProps) {
  return (
    <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 fade-in">
      <div className="glass-card max-w-[500px] w-full p-10 rounded-[3rem] text-center space-y-8 border-indigo-500/30">
        <div className="text-6xl text-gradient">📊</div>
        <h2 className="text-3xl font-black">Sınav Özeti</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
            <p className="text-[10px] text-slate-500 font-black uppercase">Toplam Süre</p>
            <p className="text-2xl font-black text-indigo-400">{formatTime(timer)}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
            <p className="text-[10px] text-slate-500 font-black uppercase">Çözülen Soru</p>
            <p className="text-2xl font-black text-white">{totalQuestions}</p>
          </div>
        </div>
        {stats && (
          <div className="flex justify-around p-6 bg-white/5 rounded-3xl border border-white/5 gap-2">
            <div className="text-center"><p className="text-[9px] text-emerald-500 font-black uppercase">Doğru</p><p className="text-2xl font-black text-emerald-400">{stats.correct_count}</p></div>
            <div className="text-center"><p className="text-[9px] text-rose-500 font-black uppercase">Yanlış</p><p className="text-2xl font-black text-rose-400">{stats.wrong_count}</p></div>
            <div className="text-center"><p className="text-[9px] text-slate-500 font-black uppercase">Boş</p><p className="text-2xl font-black text-slate-400">{stats.empty_count}</p></div>
          </div>
        )}
        <div className="flex gap-4 pt-4">
          <button onClick={onJumpToStart} className="flex-1 py-4 glass-card rounded-2xl font-black text-indigo-400">Tekrar Çöz</button>
          <button onClick={onClose} className="flex-1 py-4 btn-primary rounded-2xl">Kapat</button>
        </div>
      </div>
    </div>
  );
}

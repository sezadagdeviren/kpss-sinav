import type { Question, Stats } from '../../types';

interface QuizSummaryProps {
  timer: number;
  formatTime: (s: number) => string;
  totalQuestions: number;
  stats: Stats | null;
  questions: Question[];
  questionTimes: Record<number, number>;
  questionStatuses?: Record<number, string>; // Dondurulmuş soru durumları (sınav bittiğindeki snapshot)
  onJumpToStart: () => void;
  onClose: () => void;
}

export function QuizSummary({
  timer,
  formatTime,
  totalQuestions,
  stats,
  questions,
  questionTimes,
  questionStatuses,
  onJumpToStart,
  onClose
}: QuizSummaryProps) {
  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 fade-in">
      <div className="glass-card max-w-[500px] w-full p-8 md:p-10 rounded-[3rem] text-center space-y-6 border-indigo-500/30 max-h-[90vh] flex flex-col justify-between">
        <div className="space-y-4">
          <div className="text-5xl text-gradient">📊</div>
          <h2 className="text-3xl font-black">Sınav Özeti</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-shrink-0">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] text-slate-500 font-black uppercase">Toplam Süre</p>
            <p className="text-xl font-black text-indigo-400">{formatTime(timer)}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] text-slate-500 font-black uppercase">Çözülen Soru</p>
            <p className="text-xl font-black text-white">{totalQuestions}</p>
          </div>
        </div>

        {stats && (
          <div className="flex justify-around p-4 bg-white/5 rounded-2xl border border-white/5 gap-2 flex-shrink-0">
            <div className="text-center"><p className="text-[9px] text-emerald-500 font-black uppercase">Doğru</p><p className="text-xl font-black text-emerald-400">{stats.correct_count}</p></div>
            <div className="text-center"><p className="text-[9px] text-rose-500 font-black uppercase">Yanlış</p><p className="text-xl font-black text-rose-400">{stats.wrong_count}</p></div>
            <div className="text-center"><p className="text-[9px] text-slate-500 font-black uppercase">Boş</p><p className="text-xl font-black text-slate-400">{stats.empty_count}</p></div>
          </div>
        )}

        {/* Scroll edilebilir Soru Süre Detayları */}
        <div className="flex-1 min-h-[150px] max-h-[220px] overflow-y-auto custom-scrollbar border border-white/5 rounded-2xl bg-black/20 p-2 space-y-1 text-left">
          {questions.map((q, idx) => {
            const time = questionTimes[q.id] || 0;
            // Dondurulmuş snapshot varsa onu kullan, yoksa q.status'a dön (eski sınavlar)
            const frozenStatus = questionStatuses ? (questionStatuses[q.id] || 'empty') : (q.status || 'empty');
            const isCorrect = frozenStatus === 'correct';
            const isWrong = frozenStatus === 'wrong';

            let statusText = 'Boş';
            let statusClass = 'text-slate-400 bg-slate-400/10 border-slate-500/20';
            if (isCorrect) {
              statusText = 'Doğru';
              statusClass = 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
            } else if (isWrong) {
              // Yanlış cevap: snapshot'taki user_choice bilgisi yok ama q.user_choice gösterilebilir
              statusText = `Yanlış`;
              statusClass = 'text-rose-400 bg-rose-400/10 border-rose-500/20';
            }

            return (
              <div key={q.id} className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-xs gap-4 hover:bg-white/[0.05] transition-all">
                <span className="font-bold text-slate-300">{idx + 1}. Soru</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-indigo-300 bg-indigo-500/5 border border-indigo-500/15 px-2 py-0.5 rounded-md">⏱️ {formatSeconds(time)}</span>
                  <span className={`px-2 py-0.5 border rounded-md text-[10px] font-black uppercase tracking-wider ${statusClass}`}>{statusText}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 pt-2 flex-shrink-0">
          <button onClick={onJumpToStart} className="flex-1 py-3.5 glass-card rounded-2xl font-black text-indigo-400 transition-colors hover:bg-white/5">Tekrar Çöz</button>
          <button onClick={onClose} className="flex-1 py-3.5 btn-primary rounded-2xl transition-all">Kapat</button>
        </div>
      </div>
    </div>
  );
}

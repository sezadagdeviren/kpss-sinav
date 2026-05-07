import { api } from '../../services/api';
import type { Question } from '../../types';

interface QuestionDisplayProps {
  currentQuestion: Question;
  onJumpToStart: () => void;
  onFinish: () => void;
  isFavoritesMode: boolean;
  shouldShowTimer: boolean;
}

export function QuestionDisplay({
  currentQuestion,
  onJumpToStart,
  onFinish,
  isFavoritesMode,
  shouldShowTimer
}: QuestionDisplayProps) {
  return (
    <div className="flex-[1.2] flex flex-col p-6 overflow-hidden border-r border-white/5 bg-slate-900/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${currentQuestion?.zorluk_seviyesi === 'Zor' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/10' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'}`}>
            {currentQuestion?.zorluk_seviyesi || 'Orta'}
          </span>
          <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
            {currentQuestion?.kategori}
          </span>
          <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-white/5 text-slate-400 border border-white/5">
            SINAV YILI: {currentQuestion?.yil}
          </span>
          <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-white/5 text-slate-500">
            KONU: {currentQuestion?.konu}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-slate-700 tracking-widest uppercase">SORU NO: {currentQuestion?.soru_no}</span>
        </div>
      </div>

      <div className="flex-1 glass-card rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center p-4 md:p-8 bg-slate-900/40 relative overflow-hidden group border-white/5 h-0">
        {currentQuestion ? (
          <img src={api.getImageUrl(currentQuestion.soru_resmi)} className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 group-hover:scale-[1.02]" alt="Question" />
        ) : (
          <div className="text-center space-y-8 fade-in flex flex-col items-center">
            <div className="text-7xl drop-shadow-2xl">🏆</div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter">İşlem Tamamlandı</h2>
              <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest">
                {isFavoritesMode ? 'Tüm favori sorularını gözden geçirdin' : 'Soru bankası seansını başarıyla bitirdin'}
              </p>
            </div>
            <div className="flex gap-4 justify-center w-full max-w-sm">
              <button onClick={onJumpToStart} className="flex-1 py-5 glass-card rounded-3xl font-black text-indigo-400 border-indigo-500/10">Başa Dön</button>
              {shouldShowTimer && (
                <button onClick={onFinish} className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-500/20">Sınavı Bitir</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

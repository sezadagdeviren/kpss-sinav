import { api } from '../../services/api';
import type { Question } from '../../types';

interface QuestionDisplayProps {
  currentQuestion: Question;
}

export function QuestionDisplay({ currentQuestion }: QuestionDisplayProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Meta badges */}
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 flex-wrap flex-shrink-0">
        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${currentQuestion?.zorluk_seviyesi === 'Zor' ? 'bg-rose-500/15 text-rose-400' : currentQuestion?.zorluk_seviyesi === 'Kolay' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
          {currentQuestion?.zorluk_seviyesi || 'Orta'}
        </span>
        <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase bg-indigo-500/15 text-indigo-400">
          {currentQuestion?.kategori}
        </span>
        <span className="px-2.5 py-1 rounded-md text-[9px] font-bold bg-white/5 text-slate-500">
          {currentQuestion?.yil}
        </span>
        {currentQuestion?.konu && (
          <span className="px-2.5 py-1 rounded-md text-[9px] font-bold bg-white/5 text-slate-400">
            {currentQuestion.konu}
          </span>
        )}
        {currentQuestion?.alt_konu && (
          <span className="px-2.5 py-1 rounded-md text-[9px] font-bold bg-violet-500/15 text-violet-400 border border-violet-500/10">
            {currentQuestion.alt_konu}
          </span>
        )}
        <span className="ml-auto text-[9px] font-black text-slate-600 tracking-widest">SORU {currentQuestion?.soru_no}</span>
      </div>

      {/* Question Image - fills remaining space */}
      <div className="flex-1 flex items-center justify-center px-4 pb-3 min-h-0 overflow-hidden">
        {currentQuestion ? (
          <img 
            src={api.getImageUrl(currentQuestion.soru_resmi)} 
            className="max-w-full max-h-full object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)]" 
            alt="Question" 
          />
        ) : null}
      </div>
    </div>
  );
}

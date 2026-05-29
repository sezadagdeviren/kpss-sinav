import { useState, useEffect } from 'react';
import type { Question } from '../../types';

interface SolutionPanelProps {
  currentQuestion: Question;
  isQuestionSolved: boolean;
}

export function SolutionPanel({ currentQuestion, isQuestionSolved }: SolutionPanelProps) {
  const [showSolution, setShowSolution] = useState(false);
  const hasSolution = currentQuestion?.cozum && currentQuestion.cozum.trim().length > 0;

  // Reset state when question changes
  useEffect(() => {
    setShowSolution(false);
  }, [currentQuestion?.id]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 flex-shrink-0 border-b border-white/5">
        <span className="text-sm">📝</span>
        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em]">Çözüm Analizi</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar min-h-0 flex flex-col justify-center">
        {!hasSolution ? (
          /* Çözüm yok */
          <div className="flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <div className="text-4xl">📋</div>
            <div className="space-y-1">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Çözüm Bekleniyor</p>
              <p className="text-[10px] text-slate-600">Bu soru için henüz çözüm eklenmemiş</p>
            </div>
          </div>
        ) : !showSolution ? (
          /* Çözümü Göster Butonu */
          <div className="flex flex-col items-center justify-center space-y-2">
            <button 
              onClick={() => setShowSolution(true)}
              disabled={!isQuestionSolved}
              className={`px-6 py-3 glass-card border font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 ${
                isQuestionSolved 
                  ? 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 active:scale-95 shadow-lg shadow-indigo-500/10'
                  : 'border-white/5 text-slate-500 opacity-50 cursor-not-allowed'
              }`}
            >
              <span>👁️</span>
              {isQuestionSolved ? 'Çözümü Göster' : 'Önce Soruyu Cevaplayın'}
            </button>
          </div>
        ) : (
          /* Çözüm var ve göster */
          <div className="fade-in space-y-3 h-full flex flex-col justify-start">
            {/* Konu / Alt Konu Badges */}
            {(currentQuestion.konu || currentQuestion.alt_konu) && (
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-white/5">
                {currentQuestion.konu && (
                  <span className="px-2.5 py-1 rounded-md text-[9px] font-bold bg-white/5 text-slate-400 uppercase">
                    {currentQuestion.konu}
                  </span>
                )}
                {currentQuestion.alt_konu && (
                  <span className="px-2.5 py-1 rounded-md text-[9px] font-bold bg-violet-500/15 text-violet-400 border border-violet-500/10 uppercase">
                    {currentQuestion.alt_konu}
                  </span>
                )}
              </div>
            )}

            {/* Çözüm Metni */}
            <p className="text-[12px] text-slate-300 leading-[1.8] whitespace-pre-line">
              {currentQuestion.cozum}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

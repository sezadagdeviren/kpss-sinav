import React from 'react';
import type { Question } from '../../types';

interface QuestionGridProps {
  questions: Question[];
  currentIdx: number;
  onJump: (idx: number) => void;
}

export function QuestionGrid({ questions, currentIdx, onJump }: QuestionGridProps) {
  return (
    <div className="glass-card rounded-[0.5rem] md:rounded-[1rem] p-1 md:p-2 border-white/5 flex flex-col overflow-hidden flex-shrink-0">
      {/* Başlığı her yerde gizliyoruz - Maksimum alan */}
      <div className="grid grid-cols-10 sm:grid-cols-15 lg:grid-cols-20 gap-0.5 overflow-y-auto max-h-[60px] md:max-h-[100px] custom-scrollbar">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIdx;
          const status = q.status;
          
          let colorClass = "bg-white/5 border-white/10 text-slate-500 opacity-40"; // Boş Soru (Gri)
          
          if (status === 'correct') {
            colorClass = "bg-emerald-500/40 border-emerald-500/50 text-emerald-200 opacity-100";
          } else if (status === 'wrong') {
            colorClass = "bg-rose-500/40 border-rose-500/50 text-rose-200 opacity-100";
          }
          
          if (isCurrent) {
            colorClass += " ring-1 ring-white/50 border-white text-white z-10 scale-110 opacity-100";
          }

          return (
            <button
              key={idx}
              onClick={() => onJump(idx)}
              className={`h-5 w-full md:h-7 md:w-full flex items-center justify-center rounded-sm text-[8px] md:text-[9px] font-black transition-all duration-200 border ${colorClass}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

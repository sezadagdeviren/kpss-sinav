import type { Question } from '../../types';

interface AnswerPanelProps {
  currentQuestion: Question;
  selectedAnswer: string | null;
  isQuestionSolved: boolean;
  handleAnswer: (choice: string) => void;
  isReview: boolean;
  isFavoritesMode: boolean;
}

export function AnswerPanel({
  currentQuestion,
  selectedAnswer,
  isQuestionSolved,
  handleAnswer,
  isReview,
  isFavoritesMode
}: AnswerPanelProps) {
  return (
    <div className="flex-shrink-0 md:flex-1 flex flex-col w-full overflow-hidden">
      {/* Şık Butonları Alanı - Mobilde Yan Yana, Masaüstünde Alt Alta */}
      <div className="glass-card rounded-[1.5rem] md:rounded-[2.5rem] p-2 md:p-8 flex flex-col shadow-premium border-white/5 overflow-hidden transition-all duration-500">
        <div className="grid grid-cols-5 md:grid-cols-1 gap-1 md:gap-3 flex-1 justify-center">
          {['A', 'B', 'C', 'D', 'E'].map(choice => {
            const isCorrect = choice === currentQuestion?.dogru_cevap;
            const show = isQuestionSolved;
            const myChoice = selectedAnswer || (currentQuestion?.status !== 'empty' && !isReview && !isFavoritesMode ? currentQuestion.user_choice : null);

            return (
              <button
                key={choice}
                onClick={() => handleAnswer(choice)}
                disabled={show}
                className={`h-8 md:h-12 flex items-center justify-center rounded-lg md:rounded-xl font-black text-sm md:text-xl border transition-all duration-200 active:opacity-70 ${show
                  ? (isCorrect ? 'bg-emerald-500 border-transparent text-white shadow-lg' : (myChoice === choice ? 'bg-rose-500 border-transparent text-white shadow-lg' : 'opacity-10 grayscale'))
                  : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                  }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
    <div className="flex gap-1.5 w-full">
      {['A', 'B', 'C', 'D', 'E'].map(choice => {
        const isCorrect = choice === currentQuestion?.dogru_cevap;
        const show = isQuestionSolved;
        const myChoice = selectedAnswer || (currentQuestion?.status !== 'empty' && !isReview && !isFavoritesMode ? currentQuestion.user_choice : null);

        return (
          <button
            key={choice}
            onClick={() => handleAnswer(choice)}
            disabled={show}
            className={`flex-1 h-10 flex items-center justify-center rounded-lg font-black text-sm border transition-all duration-200 active:scale-95 ${show
              ? (isCorrect ? 'bg-emerald-500 border-transparent text-white shadow-lg shadow-emerald-500/30' : (myChoice === choice ? 'bg-rose-500 border-transparent text-white shadow-lg shadow-rose-500/30' : 'opacity-15 border-white/5'))
              : 'bg-white/5 border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/10 text-slate-300 hover:text-white'
              }`}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}

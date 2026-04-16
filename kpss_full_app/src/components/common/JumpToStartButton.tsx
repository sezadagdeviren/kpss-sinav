interface JumpToStartButtonProps {
  onClick: () => void;
  className?: string;
}

export const JumpToStartButton = ({ onClick, className = "" }: JumpToStartButtonProps) => {
  return (
    <button 
      onClick={onClick} 
      className={`p-4 glass-card rounded-xl text-indigo-400 font-extrabold text-[10px] tracking-widest uppercase hover:text-white transition-all flex items-center justify-center gap-2 ${className}`}
    >
      <svg xmlns="http://www.w3.org/2003/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      </svg>
      Başa Dön
    </button>
  );
};

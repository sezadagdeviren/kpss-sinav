import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  label?: string;
}

export const BackButton = ({ label = "Geri" }: BackButtonProps) => {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(-1)} className="back-button group">
      <svg 
        xmlns="http://www.w3.org/2003/svg" 
        className="h-4 w-4 transition-transform group-hover:-translate-x-1" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
      </svg>
      <span>{label}</span>
    </button>
  );
};

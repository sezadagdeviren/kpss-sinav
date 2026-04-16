import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { BackButton } from '../components/common/BackButton';

export default function YearsView() {
  const { category } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isHataMerkezi = location.pathname.includes('/hata-merkezi');
  
  const [mistakesPerYear, setMistakesPerYear] = useState<Record<string, number>>({});
  const [examSummaries, setExamSummaries] = useState<any[]>([]);

  useEffect(() => {
    if (category) {
      if (isHataMerkezi) {
        api.fetchMistakesByYear(category).then(data => {
          const mapping = data.reduce((acc: any, curr: any) => ({ ...acc, [curr.yil]: curr.count }), {});
          setMistakesPerYear(mapping);
        });
      } else {
        api.fetchExamSummaries(category).then(setExamSummaries);
      }
    }
  }, [category, isHataMerkezi]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="view-container">
      <BackButton label={isHataMerkezi ? "Hata Merkezi" : "Kategoriler"} />
      
      <div className="max-w-[1000px] mx-auto space-y-12 fade-in">
        <header className="text-center border-b border-white/5 pb-10">
          <h1 className="text-6xl font-black tracking-tighter">{category}</h1>
          <p className="text-slate-500 mt-2 font-bold tracking-widest uppercase text-xs">
            {isHataMerkezi ? 'Hatalı Soruların Bulunduğu Yılı Seçin' : 'Sınav Yılını Seçin'}
          </p>
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 20 }, (_, i) => (2025 - i).toString()).map(y => {
            const mCount = mistakesPerYear[y] || 0;
            const summary = examSummaries.find(s => s.yil === y);

            return (
              <button 
                key={y} 
                onClick={() => navigate(isHataMerkezi ? `/hata-merkezi/${category}/${y}` : `/ders/${category}/${y}`)} 
                className="glass-card relative p-12 rounded-[2.5rem] text-3xl font-black hover:bg-white/5 hover:border-indigo-500/20 transition-all group overflow-hidden"
              >
                {y}

                {/* TOP LEFT: LAST TIME */}
                {summary && !isHataMerkezi && (
                   <div className="absolute top-4 left-6 flex flex-col items-start opacity-60">
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Süre</span>
                      <span className="text-[11px] font-black text-white leading-none">{formatTime(summary.last_time)}</span>
                   </div>
                )}

                {/* TOP RIGHT: LAST STATS */}
                {summary && !isHataMerkezi && (
                  <div className="absolute top-4 right-6 flex items-center gap-1.5 opacity-80">
                    <div className="flex flex-col items-center">
                      <span className="text-[7px] font-black text-emerald-500">D</span>
                      <span className="text-[10px] font-black text-white leading-none">{summary.last_correct}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[7px] font-black text-rose-500">Y</span>
                      <span className="text-[10px] font-black text-white leading-none">{summary.last_wrong}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[7px] font-black text-slate-500">B</span>
                      <span className="text-[10px] font-black text-white leading-none">{summary.last_empty}</span>
                    </div>
                  </div>
                )}

                {/* HATA MERKEZİ BADGE */}
                {isHataMerkezi && (
                  <div className={`absolute -top-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black shadow-2xl border-2 border-slate-950 transition-transform group-hover:scale-110 ${mCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                    {mCount}
                  </div>
                )}

                {/* Hover Background Hint */}
                <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/[0.02] transition-colors pointer-events-none"></div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

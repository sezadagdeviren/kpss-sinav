import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { BackButton } from '../components/common/BackButton';
import { SelectionYearCard } from '../components/SelectionComponents';

interface YearsViewProps {
  mode?: 'exam' | 'mistakes' | 'favorites';
}

export default function YearsView({ mode }: YearsViewProps) {
  const { category } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Backward compatibility or direct route check
  const actualMode = mode || (location.pathname.includes('/hata-merkezi') ? 'mistakes' : 'exam');
  const isHataMerkezi = actualMode === 'mistakes';
  const isFavorites = actualMode === 'favorites';
  
  const [countsPerYear, setCountsPerYear] = useState<Record<string, number>>({});
  const [examSummaries, setExamSummaries] = useState<any[]>([]);

  useEffect(() => {
    if (category) {
      console.log(`📡 Fetching data for category: ${category}, mode: ${actualMode}`);
      if (isHataMerkezi) {
        api.fetchMistakesByYear(category).then(data => {
          console.log('📝 Mistakes Data:', data);
          const mapping = data.reduce((acc: any, curr: any) => ({ ...acc, [String(curr.yil)]: Number(curr.count) }), {});
          setCountsPerYear(mapping);
        });
      } else if (isFavorites) {
        api.fetchFavoritesByYear(category).then(data => {
          console.log('📝 Favorites Data:', data);
          const mapping = data.reduce((acc: any, curr: any) => ({ ...acc, [String(curr.yil)]: Number(curr.count) }), {});
          setCountsPerYear(mapping);
        });
      } else {
        api.fetchExamSummaries(category).then(data => {
          console.log('📝 Exam Summaries:', data);
          setExamSummaries(data);
        });
      }
    }
  }, [category, actualMode]);

  const getTargetUrl = (year: string) => {
    if (isHataMerkezi) return `/hata-merkezi/${category}/${year}`;
    if (isFavorites) return `/favorilerim/${category}/${year}`;
    return `/ders/${category}/${year}`;
  };

  return (
    <div className="view-container">
      <BackButton label={isHataMerkezi ? "Hata Merkezi" : isFavorites ? "Favorilerim" : "Kategoriler"} />
      
      <div className="max-w-[1000px] mx-auto space-y-12 fade-in">
        <header className="text-center border-b border-white/5 pb-10">
          <h1 className="text-6xl font-black tracking-tighter">{category}</h1>
          <p className="text-slate-500 mt-2 font-bold tracking-widest uppercase text-xs">
            {isHataMerkezi ? 'Hatalı Soruların Bulunduğu Yılı Seçin' : isFavorites ? 'Favori Soruların Bulunduğu Yılı Seçin' : 'Sınav Yılını Seçin'}
          </p>
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 20 }, (_, i) => (2025 - i).toString()).map(y => {
            const count = countsPerYear[y];
            const summary = examSummaries.find(s => s.yil === y);

            return (
              <SelectionYearCard 
                key={y}
                year={y}
                onClick={() => navigate(getTargetUrl(y))}
                count={isHataMerkezi || isFavorites ? (count || 0) : undefined}
                countColor={isFavorites ? 'amber' : 'rose'}
                summary={actualMode === 'exam' ? summary : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
  
  const queryParams = new URLSearchParams(location.search);
  const sinavTuru = queryParams.get('sinav_turu') || 'Lisans';

  // Backward compatibility or direct route check
  const actualMode = mode || (location.pathname.includes('/hata-merkezi') ? 'mistakes' : 'exam');
  const isHataMerkezi = actualMode === 'mistakes';
  const isFavorites = actualMode === 'favorites';
  
  const [years, setYears] = useState<string[]>([]);
  const [countsPerYear, setCountsPerYear] = useState<Record<string, number>>({});
  const [examSummaries, setExamSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (category) {
      setLoading(true);
      console.log(`📡 Fetching data for category: ${category}, mode: ${actualMode}, sinavTuru: ${sinavTuru}`);
      if (isHataMerkezi) {
        api.fetchMistakesByYear(category, sinavTuru).then(data => {
          console.log('📝 Mistakes Data:', data);
          const mapping = data.reduce((acc: any, curr: any) => ({ ...acc, [String(curr.yil)]: Number(curr.count) }), {});
          setCountsPerYear(mapping);
          setYears(data.map((d: any) => d.yil.toString()));
        }).finally(() => setLoading(false));
      } else if (isFavorites) {
        api.fetchFavoritesByYear(category, sinavTuru).then(data => {
          console.log('📝 Favorites Data:', data);
          const mapping = data.reduce((acc: any, curr: any) => ({ ...acc, [String(curr.yil)]: Number(curr.count) }), {});
          setCountsPerYear(mapping);
          setYears(data.map((d: any) => d.yil.toString()));
        }).finally(() => setLoading(false));
      } else {
        Promise.all([
          api.fetchYears(category, sinavTuru).then(loadedYears => {
            setYears(loadedYears);
          }),
          api.fetchExamSummaries(category, sinavTuru).then(data => {
            console.log('📝 Exam Summaries:', data);
            setExamSummaries(data);
          })
        ]).finally(() => setLoading(false));
      }
    }
  }, [category, actualMode, sinavTuru]);

  const getTargetUrl = (year: string) => {
    const base = isHataMerkezi 
      ? `/hata-merkezi/${category}/${year}` 
      : isFavorites 
        ? `/favorilerim/${category}/${year}` 
        : `/ders/${category}/${year}`;
    return `${base}?sinav_turu=${encodeURIComponent(sinavTuru)}`;
  };

  const getSinavTuruColorClass = (turu: string) => {
    const norm = turu.toLowerCase();
    if (norm.includes('lisans') && !norm.includes('ön')) {
      return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
    }
    if (norm.includes('önlisans')) {
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
    if (norm.includes('ortaöğretim') || norm.includes('ortaogretim')) {
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
    return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
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
          <span className={`inline-block mt-3 px-3 py-1 text-[10px] uppercase tracking-widest font-black rounded-full ${getSinavTuruColorClass(sinavTuru)}`}>
            {sinavTuru}
          </span>
        </header>
        
        {loading ? (
          <div className="text-center py-12 text-indigo-400 font-bold tracking-widest animate-pulse">
            YÜKLENİYOR...
          </div>
        ) : years.length === 0 && (isHataMerkezi || isFavorites) ? (
          <div className="glass-card rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto border border-white/10 shadow-2xl">
            <div className="text-5xl">🎉</div>
            <h3 className="text-xl font-black text-white">
              {isFavorites ? 'Favori Soru Kalmadı' : 'Hata Sorusu Kalmadı'}
            </h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              {isFavorites 
                ? `"${category}" dersine ait favorilere eklenmiş soru bulunmuyor.` 
                : `Tebrikler! "${category}" dersindeki tüm hatalı soruları temizlediniz.`}
            </p>
            <button 
              onClick={() => navigate(`${isFavorites ? '/favorilerim' : '/hata-merkezi'}?sinav_turu=${encodeURIComponent(sinavTuru)}`)}
              className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
            >
              {isFavorites ? '← Favorilerime Dön' : '← Hata Merkezine Dön'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {years.map(y => {
              const count = countsPerYear[y];
              const summary = examSummaries.find(s => s.yil === y || String(s.yil) === String(y));

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
        )}
      </div>
    </div>
  );
}

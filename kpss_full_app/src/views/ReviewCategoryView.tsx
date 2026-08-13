import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { BackButton } from '../components/common/BackButton';
import { SelectionCategoryCard } from '../components/SelectionComponents';

interface ReviewCategoryViewProps {
  mode?: 'mistakes' | 'favorites';
}

export default function ReviewCategoryView({ mode = 'mistakes' }: ReviewCategoryViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<string[]>([]);
  const isFavorites = mode === 'favorites';
  const basePath = isFavorites ? '/favorilerim' : '/hata-merkezi';

  const queryParams = new URLSearchParams(location.search);
  const sinavTuru = queryParams.get('sinav_turu') || 'Lisans';

  useEffect(() => {
    api.fetchCategories(sinavTuru).then(setCategories);
  }, [sinavTuru]);

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
      <BackButton label="Anasayfa" />
      
      <div className="max-w-[1000px] mx-auto space-y-12 fade-in">
        <header className="text-center space-y-3">
          <h1 className={`text-5xl sm:text-7xl font-black bg-gradient-to-r bg-clip-text text-transparent tracking-tighter uppercase ${isFavorites ? 'from-amber-400 to-orange-400' : 'from-rose-400 to-orange-400'}`}>
            {isFavorites ? 'Favorilerim' : 'Hata Merkezi'}
          </h1>
          <p className="text-slate-500 font-semibold tracking-wide uppercase text-xs">
            {isFavorites ? 'Kaydettiğin Soruları Derslere Göre İncele' : 'Temizlemek İstediğin Dersi Seç'}
          </p>
          <span className={`inline-block mt-3 px-3 py-1 text-[10px] uppercase tracking-widest font-black rounded-full ${getSinavTuruColorClass(sinavTuru)}`}>
            {sinavTuru}
          </span>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <SelectionCategoryCard 
              key={cat} 
              name={cat} 
              onClick={() => navigate(`${basePath}/${cat}?sinav_turu=${encodeURIComponent(sinavTuru)}`)}
              iconColor={isFavorites ? 'amber' : 'rose'}
              description={isFavorites ? 'Favori Soruların' : 'Hataları Gözden Geçir'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { BackButton } from '../components/common/BackButton';

export default function ReviewCategoryView() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    api.fetchCategories().then(setCategories);
  }, []);

  return (
    <div className="view-container">
      <BackButton label="Anasayfa" />
      
      <div className="max-w-[1000px] mx-auto space-y-12 fade-in">
        <header className="text-center space-y-3">
          <h1 className="text-5xl sm:text-7xl font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent tracking-tighter uppercase">
            Hata Merkezi
          </h1>
          <p className="text-slate-500 font-semibold tracking-wide uppercase text-xs">Temizlemek İstediğin Dersi Seç</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => navigate(`/hata-merkezi/${cat}`)} 
              className="glass-card group p-8 rounded-[2rem] text-left hover:scale-[1.02] border-rose-500/10 hover:border-rose-500/40 bg-rose-500/5 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center mb-6 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-all font-black text-xl shadow-lg">
                {cat[0]}
              </div>
              <h2 className="text-2xl font-black">{cat}</h2>
              <p className="text-slate-500 text-[10px] mt-2 font-black uppercase tracking-widest">Hataları Gözden Geçir</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

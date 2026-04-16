import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Stats } from '../types';

export default function HomeView() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.fetchCategories().then(setCategories);
    api.fetchStats().then(setStats);
  }, []);

  return (
    <div className="view-container">
      <div className="max-w-[1000px] mx-auto space-y-12 fade-in">
        <header className="text-center space-y-3">
          <h1 className="text-5xl sm:text-7xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tighter">
            KPSS HUB
          </h1>
          <p className="text-slate-500 font-semibold tracking-wide uppercase text-xs">Profesyonel Çalışma Platformu</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickCard 
            title="Hata Merkezi" 
            desc="Yanlışlarını temizle" 
            count={stats?.mistake_count} 
            color="red" 
            onClick={() => navigate('/hata-merkezi')} 
          />
          <QuickCard 
            title="Favorilerim" 
            desc="Kaydettiğin sorular" 
            count={stats?.favorite_count} 
            color="amber" 
            onClick={() => navigate('/favorilerim')} 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <CategoryCard key={cat} name={cat} onClick={() => navigate(`/ders/${cat}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickCard({ title, desc, count, color, onClick }: any) {
  const themes: any = { 
    red: 'border-rose-500/20 bg-rose-500/5 text-rose-400', 
    amber: 'border-amber-500/20 bg-amber-500/5 text-amber-400' 
  };
  return (
    <button onClick={onClick} className={`glass-card p-8 rounded-[2rem] border group hover:scale-[1.02] flex items-center justify-between transition-all duration-300 ${themes[color]}`}>
      <div className="text-left">
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="text-slate-500 text-sm font-medium mt-1">{desc}</p>
      </div>
      <div className="text-5xl font-black opacity-30 group-hover:opacity-60 transition-opacity">{count || 0}</div>
    </button>
  );
}

function CategoryCard({ name, onClick }: any) {
  return (
    <button onClick={onClick} className="glass-card group p-8 rounded-[2rem] text-left hover:scale-[1.02] transition-all duration-300">
      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all font-black text-xl shadow-lg">
        {name[0]}
      </div>
      <h2 className="text-2xl font-black">{name}</h2>
      <p className="text-slate-500 text-[10px] mt-2 font-black uppercase tracking-widest">Çıkmış Sorular</p>
    </button>
  );
}

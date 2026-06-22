import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { Stats } from '../types';
import { SelectionCategoryCard } from '../components/SelectionComponents';

const EXAM_TYPES = ['Lisans', 'Önlisans', 'Ortaöğretim', 'AGS'];

export default function HomeView() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedExamType, setSelectedExamType] = useState(() => {
    return localStorage.getItem('selectedExamType') || 'Lisans';
  });
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    localStorage.setItem('selectedExamType', selectedExamType);
    api.fetchCategories(selectedExamType).then(setCategories);
    api.fetchStats(undefined, undefined, selectedExamType).then(setStats);
  }, [selectedExamType]);

  return (
    <div className="view-container">
      <div className="max-w-[1000px] mx-auto space-y-12 fade-in">
        <header className="text-center space-y-3">
          <h1 className="text-5xl sm:text-7xl font-black bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tighter">
            KPSS HUB
          </h1>
          <p className="text-slate-500 font-semibold tracking-wide uppercase text-xs">Profesyonel Çalışma Platformu</p>
        </header>

        {/* Sınav Türü Seçimi */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider text-center sm:text-left">Sınav Türü Seçin</h3>
          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            {EXAM_TYPES.map(type => {
              const isActive = selectedExamType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedExamType(type)}
                  className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-300 border ${
                    isActive 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105' 
                      : 'glass-card border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickCard 
            title="Hata Merkezi" 
            desc="Yanlışlarını temizle" 
            count={stats?.mistake_count} 
            color="red" 
            onClick={() => navigate(`/hata-merkezi?sinav_turu=${encodeURIComponent(selectedExamType)}`)} 
          />
          <QuickCard 
            title="Favorilerim" 
            desc="Kaydettiğin sorular" 
            count={stats?.favorite_count} 
            color="amber" 
            onClick={() => navigate(`/favorilerim?sinav_turu=${encodeURIComponent(selectedExamType)}`)} 
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider text-center sm:text-left">Dersler</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(cat => (
              <SelectionCategoryCard 
                key={cat} 
                name={cat} 
                onClick={() => navigate(`/ders/${cat}?sinav_turu=${encodeURIComponent(selectedExamType)}`)} 
                iconColor="indigo"
              />
            ))}
          </div>
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

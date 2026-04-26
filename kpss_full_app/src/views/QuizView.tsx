import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Question, Stats } from '../types';
import { api } from '../services/api';
import { StatsBar } from '../components/StatsBar';
import { BackButton } from '../components/common/BackButton';
import { JumpToStartButton } from '../components/common/JumpToStartButton';

export default function QuizView() {
  const { category, year } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isReview = location.pathname.includes('/hata-merkezi');
  const isFavoritesMode = location.pathname.includes('/favorilerim');
  const isGlobalReview = isFavoritesMode || (isReview && !category);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const [timer, setTimer] = useState(() => {
    if (isReview || isFavoritesMode) return 0;
    const saved = localStorage.getItem(`timer_${category}_${year}`);
    return saved ? parseInt(saved) : 0;
  });
  const [isActive, setIsActive] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [lastSession, setLastSession] = useState<{ time: number, stats: Stats } | null>(null);

  // Timer only runs in Regular Exam Mode
  const shouldShowTimer = !isReview && !isFavoritesMode;

  useEffect(() => {
    let interval: any = null;
    if (isActive && !showSummary && shouldShowTimer) {
      interval = setInterval(() => {
        setTimer(t => {
          const newTime = t + 1;
          localStorage.setItem(`timer_${category}_${year}`, newTime.toString());
          localStorage.setItem(`timer_ts_${category}_${year}`, Date.now().toString());
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, showSummary, shouldShowTimer, category, year]);

  // Sync timer on visibility change (handles sleep mode)
  useEffect(() => {
    if (!shouldShowTimer) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive && !showSummary) {
        const savedTs = localStorage.getItem(`timer_ts_${category}_${year}`);
        if (savedTs) {
          const diff = Math.floor((Date.now() - parseInt(savedTs)) / 1000);
          if (diff > 1) { // Only sync if gap is more than 1s
            setTimer(t => {
              const syncedTime = t + diff;
              localStorage.setItem(`timer_${category}_${year}`, syncedTime.toString());
              return syncedTime;
            });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [category, year, isActive, shouldShowTimer, showSummary]);

  useEffect(() => {
    const load = async () => {
      try {
        let data: Question[];
        if (isFavoritesMode) {
          data = await api.fetchReview('favorites');
          if (category && year) data = data.filter(q => q.kategori === category && q.yil.toString() === year);
        } else if (isReview) {
          const allReview = await api.fetchReview('wrong');
          data = (category && year) ? allReview.filter(q => q.kategori === category && q.yil.toString() === year) : allReview;
          data = data.map(q => ({ ...q, status: null }));
        } else {
          if (!category || !year) return;
          data = await api.fetchQuestions(category, year);
        }
        setQuestions(data);
        if (category && year) api.fetchStats(category, year).then(setStats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category, year, isReview, isFavoritesMode]);

  const currentQuestion = useMemo(() => questions[currentIdx], [questions, currentIdx]);

  const handleAnswer = async (choice: string) => {
    const isAnsweredInDb = currentQuestion?.status && currentQuestion.status !== 'empty';
    const allowReSolve = isReview || isFavoritesMode;
    if (!currentQuestion || selectedAnswer || (isAnsweredInDb && !allowReSolve)) return;

    setSelectedAnswer(choice);
    const status = choice === currentQuestion.dogru_cevap ? 'correct' : 'wrong';

    const updated = [...questions];
    updated[currentIdx].status = status;
    updated[currentIdx].user_choice = choice;
    setQuestions(updated);

    if (!isReview && !isFavoritesMode) {
      await api.updateActivity(currentQuestion.id, status, undefined, choice);
      api.fetchStats(category, year).then(setStats);
    }
  };

  const handleFinish = async () => {
    setIsActive(false);
    if (stats) {
      const summary = {
        category,
        year,
        last_time: timer,
        last_correct: stats.correct_count,
        last_wrong: stats.wrong_count,
        last_empty: stats.empty_count
      };
      await api.saveExamSummary(summary);
      setLastSession({ time: timer, stats: { ...stats } });
    }
    setShowSummary(true);
    localStorage.removeItem(`timer_${category}_${year}`);
    localStorage.removeItem(`timer_ts_${category}_${year}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFavorite = async () => {
    if (!currentQuestion) return;
    const newFav = !currentQuestion.is_favorite;
    const updated = [...questions];
    updated[currentIdx].is_favorite = newFav;
    if (isFavoritesMode && !newFav) {
      const filtered = updated.filter(q => q.id !== currentQuestion.id);
      setQuestions(filtered);
      if (currentIdx >= filtered.length) setCurrentIdx(Math.max(0, filtered.length - 1));
    } else {
      setQuestions(updated);
    }
    await api.updateActivity(currentQuestion.id, undefined, newFav);
  };

  const removeMistake = async () => {
    if (!currentQuestion) return;
    await api.removeMistakeFromPool(currentQuestion.id);
    const updated = questions.filter(q => q.id !== currentQuestion.id);
    setQuestions(updated);
    if (currentIdx >= updated.length) setCurrentIdx(Math.max(0, updated.length - 1));
  };

  const resetProgress = async () => {
    if (!category || !year || !window.confirm('Bu yıla ait ilerlemeyi tamamen sıfırlamak istiyor musunuz?')) return;
    await api.resetPool(category, year);
    localStorage.removeItem(`timer_${category}_${year}`);
    localStorage.removeItem(`timer_ts_${category}_${year}`);
    window.location.reload();
  };

  const handleJumpToStart = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setTimer(0);
    localStorage.removeItem(`timer_${category}_${year}`);
    localStorage.removeItem(`timer_ts_${category}_${year}`);
    setIsActive(true);
    setShowSummary(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-400 font-extrabold tracking-widest animate-pulse">KPSS HUB YÜKLENİYOR...</div>;

  const isQuestionSolved = !!selectedAnswer || (currentQuestion?.status && currentQuestion.status !== 'empty' && !isReview && !isFavoritesMode);

  return (
    <div className="h-screen w-screen bg-slate-950 overflow-hidden flex flex-col font-sans relative">

      {showSummary && (
        <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 fade-in">
          <div className="glass-card max-w-[500px] w-full p-10 rounded-[3rem] text-center space-y-8 border-indigo-500/30">
            <div className="text-6xl text-gradient">📊</div>
            <h2 className="text-3xl font-black">Sınav Özeti</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-black uppercase">Toplam Süre</p>
                <p className="text-2xl font-black text-indigo-400">{formatTime(timer)}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-black uppercase">Çözülen Soru</p>
                <p className="text-2xl font-black text-white">{questions.length}</p>
              </div>
            </div>
            {stats && (
              <div className="flex justify-around p-6 bg-white/5 rounded-3xl border border-white/5 gap-2">
                <div className="text-center"><p className="text-[9px] text-emerald-500 font-black uppercase">Doğru</p><p className="text-2xl font-black text-emerald-400">{stats.correct_count}</p></div>
                <div className="text-center"><p className="text-[9px] text-rose-500 font-black uppercase">Yanlış</p><p className="text-2xl font-black text-rose-400">{stats.wrong_count}</p></div>
                <div className="text-center"><p className="text-[9px] text-slate-500 font-black uppercase">Boş</p><p className="text-2xl font-black text-slate-400">{stats.empty_count}</p></div>
              </div>
            )}
            <div className="flex gap-4 pt-4">
              <button onClick={handleJumpToStart} className="flex-1 py-4 glass-card rounded-2xl font-black text-indigo-400">Tekrar Çöz</button>
              <button onClick={() => setShowSummary(false)} className="flex-1 py-4 btn-primary rounded-2xl">Kapat</button>
            </div>
          </div>
        </div>
      )}

      <nav className="h-16 flex-shrink-0 flex items-center justify-between px-6 glass-card border-b border-white/5 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">←</button>
          <div className="flex flex-col">
            <span className="text-[9px] text-indigo-400 font-black tracking-widest uppercase">{isFavoritesMode ? '★ FAVORİLERİM' : (isReview ? 'HATA MERKEZİ' : category)}</span>
            <h2 className="text-sm font-black leading-none">{isGlobalReview ? 'Tüm Kayıtlar' : `${year} Sınavı`}</h2>
          </div>
        </div>

        {shouldShowTimer && (
          <div className="flex flex-col items-center glass-card px-8 py-1 rounded-2xl border-indigo-500/10">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">KRONOMETRE</span>
            <span className="text-xl font-black tracking-tighter text-indigo-400 tabular-nums">
              {formatTime(timer)}
            </span>
          </div>
        )}

        {!isReview && !isFavoritesMode && <StatsBar stats={stats} />}

        <div className="flex items-center gap-4">
          <div className="px-5 py-2 glass-card rounded-xl text-xs font-black text-indigo-300 shadow-lg shadow-indigo-500/5">
            {currentIdx + 1} / {questions.length}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-[1.2] flex flex-col p-6 overflow-hidden border-r border-white/5 bg-slate-900/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${currentQuestion?.zorluk_seviyesi === 'Zor' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/10' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'}`}>
                {currentQuestion?.zorluk_seviyesi || 'Orta'}
              </span>
              <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                {currentQuestion?.kategori}
              </span>
              <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-white/5 text-slate-400 border border-white/5">
                SINAV YILI: {currentQuestion?.yil}
              </span>
              <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-white/5 text-slate-500">
                KONU: {currentQuestion?.konu}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {shouldShowTimer && lastSession && (
                <div className="px-4 py-1.5 rounded-xl bg-indigo-500/5 text-indigo-400/60 text-[10px] font-bold border border-indigo-500/5">
                  Önceki: {formatTime(lastSession.time)} | D: {lastSession.stats.correct_count} Y: {lastSession.stats.wrong_count}
                </div>
              )}
              <span className="text-[10px] font-black text-slate-700 tracking-widest uppercase">SORU NO: {currentQuestion?.soru_no}</span>
            </div>
          </div>

          <div className="flex-1 glass-card rounded-[2.5rem] flex items-center justify-center p-8 bg-slate-900/40 relative overflow-hidden group border-white/5">
            {currentQuestion ? (
              <img src={api.getImageUrl(currentQuestion.soru_resmi)} className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 group-hover:scale-[1.02]" alt="Question" />
            ) : (
              <EmptyState onJumpToStart={handleJumpToStart} onFinish={handleFinish} isFavorites={isFavoritesMode} showTimer={shouldShowTimer} />
            )}
          </div>
        </div>

        <div className="flex-[0.8] flex flex-col p-6 space-y-4 max-w-[500px]">
          <div className="glass-card rounded-[2.5rem] p-8 flex flex-col flex-1 shadow-premium border-white/5">
            <h3 className="text-[10px] font-black text-slate-500 tracking-[0.5em] text-center mb-8 uppercase opacity-40">CEVAP PANELİ</h3>
            <div className="grid grid-cols-1 gap-2.5 flex-1">
              {['A', 'B', 'C', 'D', 'E'].map(choice => {
                const isCorrect = choice === currentQuestion?.dogru_cevap;
                const show = isQuestionSolved;
                const myChoice = selectedAnswer || (currentQuestion?.status !== 'empty' && !isReview && !isFavoritesMode ? currentQuestion.user_choice : null);

                return (
                  <button
                    key={choice}
                    onClick={() => handleAnswer(choice)}
                    disabled={show}
                    className={`flex-1 flex items-center justify-center rounded-[1.25rem] font-black text-2xl border transition-all duration-300 active:scale-95 ${show
                      ? (isCorrect ? 'bg-emerald-500 border-transparent text-white shadow-xl shadow-emerald-500/20' : (myChoice === choice ? 'bg-rose-500 border-transparent text-white shadow-xl shadow-rose-500/20' : 'opacity-10 grayscale scale-[0.98]'))
                      : 'bg-white/5 border-white/10 hover:border-indigo-500/40 hover:bg-indigo-500/5'
                      }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-1/5 glass-card rounded-[2rem] p-6 overflow-y-auto border-white/5">
            {isQuestionSolved ? (
              <div className="fade-in space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                  <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Çözüm Analizi</h4>
                </div>
                <p className="text-xs leading-loose text-slate-300 font-medium">{currentQuestion?.cozum || "Bu soru için detaylı çözüm analizi henüz veritabanına eklenmemiş."}</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 text-[10px] font-black tracking-[0.2em] uppercase space-y-2">
                <span className="opacity-30">Analiz Bekleniyor</span>
                <div className="w-12 h-1 bg-white/5 rounded-full"></div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={toggleFavorite} className={`p-5 rounded-2xl border font-black text-[10px] transition-all flex items-center justify-center gap-2 tracking-widest ${currentQuestion?.is_favorite ? 'bg-amber-600 border-transparent text-white shadow-lg shadow-amber-500/20' : 'glass-card text-slate-500 hover:text-slate-200'}`}>
              {currentQuestion?.is_favorite ? '★ FAVORİ' : '☆ FAVORİ'}
            </button>
            {!isReview && !isFavoritesMode ? (
              <button onClick={handleFinish} className="p-5 rounded-2xl bg-indigo-600/5 border border-indigo-500/20 text-indigo-400 font-black text-[10px] tracking-[0.2em] uppercase hover:bg-indigo-500/10 transition-colors">SINAVI BİTİR</button>
            ) : (
              <JumpToStartButton onClick={handleJumpToStart} className="!p-5 !rounded-2xl" />
            )}
            {isReview && currentQuestion && (
              <button onClick={removeMistake} className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/20 col-span-2 transition-colors">Hata Listesinden Sil</button>
            )}
          </div>

          <div className="flex gap-3 h-16">
            <button onClick={() => { setCurrentIdx(i => Math.max(0, i - 1)); setSelectedAnswer(null); }} className="flex-1 glass-card rounded-2xl font-black text-slate-500 hover:text-white disabled:opacity-5 transition-all flex items-center justify-center border-white/5" disabled={currentIdx === 0}>← Geri</button>
            <button onClick={() => { setCurrentIdx(i => Math.min(questions.length - 1, i + 1)); setSelectedAnswer(null); }} className="flex-[1.5] bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center">Sonraki Soru →</button>
          </div>

          {!isReview && !isFavoritesMode && (
            <button onClick={resetProgress} className="text-[10px] text-rose-500/30 hover:text-rose-500 font-black uppercase tracking-[0.3em] underline transition-colors w-full text-center pb-2">Tüm İlerlemeyi Sıfırla</button>
          )}

        </div>
      </main>
    </div>
  );
}

function EmptyState({ onJumpToStart, onFinish, isFavorites, showTimer }: any) {
  return (
    <div className="text-center space-y-8 fade-in flex flex-col items-center">
      <div className="text-7xl drop-shadow-2xl">🏆</div>
      <div className="space-y-2">
        <h2 className="text-4xl font-black tracking-tighter">İşlem Tamamlandı</h2>
        <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest">
          {isFavorites ? 'Tüm favori sorularını gözden geçirdin' : 'Soru bankası seansını başarıyla bitirdin'}
        </p>
      </div>
      <div className="flex gap-4 justify-center w-full max-w-sm">
        <button onClick={onJumpToStart} className="flex-1 py-5 glass-card rounded-3xl font-black text-indigo-400 border-indigo-500/10">Başa Dön</button>
        {showTimer && (
          <button onClick={onFinish} className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-500/20">Sınavı Bitir</button>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useQuiz } from '../hooks/useQuiz';
import { useTimer } from '../hooks/useTimer';

// Components
import { QuizNavbar } from '../components/quiz/QuizNavbar';
import { AnswerPanel } from '../components/quiz/AnswerPanel';
import { QuestionDisplay } from '../components/quiz/QuestionDisplay';
import { QuizSummary } from '../components/quiz/QuizSummary';
import { QuestionGrid } from '../components/quiz/QuestionGrid';
import { SolutionPanel } from '../components/quiz/SolutionPanel';
import { JumpToStartButton } from '../components/common/JumpToStartButton';

export default function QuizView() {
  const { category, year } = useParams();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const sinavTuru = queryParams.get('sinav_turu') || 'Lisans';

  const isReview = location.pathname.includes('/hata-merkezi');
  const isFavoritesMode = location.pathname.includes('/favorilerim');
  const isGlobalReview = isFavoritesMode || (isReview && !category);

  const {
    questions, currentIdx, currentQuestion, loading, selectedAnswer,
    handleAnswer, toggleFavorite, removeMistake, nextQuestion, prevQuestion, jumpToQuestion, jumpToStart
  } = useQuiz({ category, year, isReview, isFavoritesMode, sinavTuru });

  const storageKey = `kpss_q_times_${sinavTuru}_${category}_${year}`;
  const submittedKey = `kpss_exam_submitted_${sinavTuru}_${category}_${year}`;
  const resultKey = `kpss_exam_result_${sinavTuru}_${category}_${year}`;
  const statusesKey = `kpss_exam_statuses_${sinavTuru}_${category}_${year}`;

  // Sınav daha önce "SINAVI BİTİR" ile tamamlanmış mı?
  const [isExamSubmitted, setIsExamSubmitted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`kpss_exam_submitted_${sinavTuru}_${category}_${year}`) === 'true';
    } catch {
      return false;
    }
  });

  // Sınavın ilk bitirildiği andaki dondurulmuş sonuçları
  const [savedResult, setSavedResult] = useState<{ correct_count: number, wrong_count: number, empty_count: number, timer: number } | null>(() => {
    try {
      const saved = localStorage.getItem(`kpss_exam_result_${sinavTuru}_${category}_${year}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sınavın ilk bitirildiği andaki soru bazlı dondurulmuş durumlar (id → 'correct'|'wrong'|'empty')
  const [savedQuestionStatuses, setSavedQuestionStatuses] = useState<Record<number, string> | null>(() => {
    try {
      const saved = localStorage.getItem(`kpss_exam_statuses_${sinavTuru}_${category}_${year}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Kategori / yıl değişince submitted, savedResult ve soru durumu snapshot'larını güncelle
  useEffect(() => {
    try {
      const submitted = localStorage.getItem(submittedKey) === 'true';
      setIsExamSubmitted(submitted);

      // Soru bazlı snapshot yükle
      const savedStatuses = localStorage.getItem(statusesKey);
      setSavedQuestionStatuses(savedStatuses ? JSON.parse(savedStatuses) : null);

      // Toplam istatistik snapshot yükle (yoksa backend'den çek)
      const saved = localStorage.getItem(resultKey);
      if (saved) {
        setSavedResult(JSON.parse(saved));
      } else if (submitted && category && year) {
        // Eski sınav: resultKey yok ama sınav bitirilmiş → backend'den toplam istatistik çek
        api.fetchExamSummaries(category, sinavTuru).then((summaries: any[]) => {
          const match = summaries.find((s: any) => String(s.yil) === String(year));
          if (match) {
            const backendResult = {
              correct_count: match.last_correct,
              wrong_count: match.last_wrong,
              empty_count: match.last_empty,
              timer: match.last_time
            };
            setSavedResult(backendResult);
            try {
              localStorage.setItem(resultKey, JSON.stringify(backendResult));
            } catch (e) {}
          }
        }).catch(() => {});
      } else {
        setSavedResult(null);
      }
    } catch {
      setIsExamSubmitted(false);
      setSavedResult(null);
      setSavedQuestionStatuses(null);
    }
  }, [category, year, sinavTuru, submittedKey, resultKey, statusesKey]);

  // Sınav daha önce bitirilmiş veya submitted edilmiş mi?
  const isExamCompletedBefore = useMemo(() => {
    return isExamSubmitted;
  }, [isExamSubmitted]);

  const [isExamFinished, setIsExamFinished] = useState(false);

  // Sınav bitti mi / inceleniyor mu (Kilitli durum)?
  const isFinished = isExamFinished || isExamCompletedBefore;

  const shouldShowTimer = !isReview && !isFavoritesMode && !isFinished;

  const { timer, setIsActive, resetTimer } = useTimer({ category, year, enabled: shouldShowTimer });

  const localStats = useMemo(() => {
    const s = { correct_count: 0, wrong_count: 0, empty_count: 0, mistake_count: 0, favorite_count: 0 };
    questions.forEach(q => {
      if (q.status === 'correct') s.correct_count++;
      else if (q.status === 'wrong') s.wrong_count++;
      else s.empty_count++;
      if (q.is_favorite) s.favorite_count++;
    });
    return s;
  }, [questions]);

  const [showSummary, setShowSummary] = useState(false);
  const [finalResult, setFinalResult] = useState<{ stats: any, timer: number } | null>(null);
  
  const [questionTimes, setQuestionTimes] = useState<{ [id: number]: number }>(() => {
    try {
      const saved = localStorage.getItem(`kpss_q_times_${sinavTuru}_${category}_${year}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Kategori, Yıl veya Sınav Türü değişince ilgili süreleri localStorage'dan yükle
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setQuestionTimes(saved ? JSON.parse(saved) : {});
    } catch {
      setQuestionTimes({});
    }
  }, [category, year, sinavTuru, storageKey]);

  const isQuestionSolved = !!selectedAnswer || (currentQuestion?.status && currentQuestion.status !== 'empty');

  // Soru bazlı süre takibi (Sınav bitti/çözüldüyse veya soru cevaplandıysa dondurur, BOŞ sorular dahil akmaz)
  useEffect(() => {
    if (!currentQuestion?.id || showSummary || isFinished) return;

    if (isQuestionSolved) return;

    const interval = setInterval(() => {
      setQuestionTimes(prev => {
        const nextTimes = {
          ...prev,
          [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1
        };
        try {
          localStorage.setItem(storageKey, JSON.stringify(nextTimes));
        } catch (e) {
          console.error("Timer save error", e);
        }
        return nextTimes;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion?.id, isQuestionSolved, showSummary, isFinished, storageKey]);

  // Sınav bittiğinde veya daha önce çözüldüğünde toplam harcanan süreyi hesapla
  const totalSpentTime = useMemo(() => {
    if (savedResult?.timer !== undefined) return savedResult.timer;
    if (finalResult?.timer) return finalResult.timer;
    return Object.values(questionTimes).reduce((sum, current) => sum + current, 0);
  }, [finalResult, questionTimes, savedResult]);

  const handleFinish = async () => {
    setIsActive(false);
    setIsExamFinished(true);
    setIsExamSubmitted(true);

    const resultToSave = {
      stats: { ...localStats },
      timer: timer
    };
    setFinalResult(resultToSave);

    const initialResultData = {
      correct_count: localStats.correct_count,
      wrong_count: localStats.wrong_count,
      empty_count: localStats.empty_count,
      timer: timer
    };
    setSavedResult(initialResultData);

    // Sınav bittiği an: soru bazlı durum snapshot'ı oluştur ve kaydet
    const statusSnapshot: Record<number, string> = {};
    questions.forEach(q => {
      statusSnapshot[q.id] = q.status || 'empty';
    });
    setSavedQuestionStatuses(statusSnapshot);

    // Sınav bittiği an süreleri, bitiş durumunu, soru durumlarını ve ilk sınav sonucunu kaydet
    try {
      localStorage.setItem(storageKey, JSON.stringify(questionTimes));
      localStorage.setItem(submittedKey, 'true');
      localStorage.setItem(resultKey, JSON.stringify(initialResultData));
      localStorage.setItem(statusesKey, JSON.stringify(statusSnapshot));
    } catch (e) {}
    
    try {
      await api.saveExamSummary({
        kategori: category, 
        yil: year, 
        sinav_turu: sinavTuru,
        last_time: resultToSave.timer,
        last_correct: resultToSave.stats.correct_count, 
        last_wrong: resultToSave.stats.wrong_count, 
        last_empty: resultToSave.stats.empty_count
      });
      setShowSummary(true);
      resetTimer();
    } catch (err) {
      console.error('❌ Sınav kaydedilirken hata oluştu:', err);
      setShowSummary(true);
    }
  };

  const resetProgress = async () => {
    if (!category || !year || !window.confirm('Bu yıla ait ilerlemeyi tamamen sıfırlamak istiyor musunuz?')) return;
    await api.resetPool(category, year, sinavTuru);
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(submittedKey);
      localStorage.removeItem(resultKey);
      localStorage.removeItem(statusesKey);
    } catch (e) {}
    setIsExamSubmitted(false);
    setIsExamFinished(false);
    setSavedResult(null);
    setSavedQuestionStatuses(null);
    resetTimer();
    window.location.reload();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-400 font-extrabold tracking-widest animate-pulse">KPSS HUB YÜKLENİYOR...</div>;

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col font-sans relative overflow-hidden">
      {showSummary && (
        <QuizSummary 
          timer={totalSpentTime} 
          formatTime={formatTime} 
          totalQuestions={questions.length} 
          stats={savedResult || finalResult?.stats || localStats} 
          questions={questions}
          questionTimes={questionTimes}
          questionStatuses={savedQuestionStatuses ?? undefined}
          onJumpToStart={() => { jumpToStart(); resetTimer(); setIsActive(true); setShowSummary(false); }} 
          onClose={() => setShowSummary(false)} 
        />
      )}

      <QuizNavbar 
        category={category} year={year} isReview={isReview} isFavoritesMode={isFavoritesMode}
        isGlobalReview={isGlobalReview} timer={timer} formatTime={formatTime}
        currentIdx={currentIdx} totalQuestions={questions.length} stats={localStats} shouldShowTimer={shouldShowTimer}
      />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden gap-4 p-4">
        {/* Sol Kolon: Soru Resmi (Geniş) */}
        <div className="flex-[1.5] glass-card rounded-[2rem] overflow-hidden flex flex-col border-white/5">
          <QuestionDisplay 
            currentQuestion={currentQuestion} 
            questionTime={currentQuestion ? (questionTimes[currentQuestion.id] || 0) : 0} 
          />
        </div>

        {/* Sağ Kolon: Kontroller, Şıklar ve Çözüm (Kaydırılabilir) */}
        <div className="flex-[1] md:max-w-[450px] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 h-full">
          <QuestionGrid 
            questions={questions}
            currentIdx={currentIdx}
            onJump={jumpToQuestion}
          />
          <div className="glass-card rounded-[1.5rem] p-4 flex flex-col shadow-premium border-white/5 flex-shrink-0">
            <AnswerPanel 
              currentQuestion={currentQuestion} selectedAnswer={selectedAnswer} 
              isQuestionSolved={isQuestionSolved} handleAnswer={handleAnswer}
              isReview={isReview} isFavoritesMode={isFavoritesMode}
            />
          </div>

          {/* Çözüm Paneli Şıkların Altında */}
          <div className="glass-card rounded-[1.5rem] overflow-hidden flex flex-col border-white/5 flex-shrink-0 min-h-[250px]">
            <SolutionPanel 
              currentQuestion={currentQuestion} 
              isQuestionSolved={isQuestionSolved} 
            />
          </div>

          <div className="grid grid-cols-2 gap-3 flex-shrink-0 mt-2">
            <button onClick={toggleFavorite} className={`p-4 rounded-xl border font-black text-[10px] transition-all flex items-center justify-center gap-2 tracking-widest ${currentQuestion?.is_favorite ? 'bg-amber-600 border-transparent text-white shadow-lg shadow-amber-500/20' : 'glass-card text-slate-500 hover:text-slate-200'}`}>
              {currentQuestion?.is_favorite ? '★ FAVORİ' : '☆ FAVORİ'}
            </button>
            {!isReview && !isFavoritesMode ? (
              isFinished ? (
                <button onClick={() => setShowSummary(true)} className="p-4 rounded-xl bg-emerald-600 border border-emerald-500 text-white font-black text-[10px] tracking-[0.2em] uppercase hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20">📊 SINAV ÖZETİ</button>
              ) : (
                <button onClick={handleFinish} className="p-4 rounded-xl bg-indigo-600/5 border border-indigo-500/20 text-indigo-400 font-black text-[10px] tracking-[0.2em] uppercase hover:bg-indigo-500/10 transition-colors">SINAVI BİTİR</button>
              )
            ) : (
              <JumpToStartButton onClick={jumpToStart} className="!p-4 !rounded-xl" />
            )}
            {isReview && currentQuestion && (
              <button onClick={removeMistake} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500/20 col-span-2 transition-colors">Hata Listesinden Sil</button>
            )}
          </div>

          <div className="flex gap-3 h-14 flex-shrink-0 mt-2">
            <button onClick={prevQuestion} className="flex-1 glass-card rounded-xl font-black text-slate-500 hover:text-white disabled:opacity-5 transition-all flex items-center justify-center border-white/5" disabled={currentIdx === 0}>← Geri</button>
            <button onClick={nextQuestion} className="flex-[1.5] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center">Sonraki Soru →</button>
          </div>

          {!isReview && !isFavoritesMode && (
            <button onClick={resetProgress} className="text-[10px] text-rose-500/30 hover:text-rose-500 font-black uppercase tracking-[0.3em] underline transition-colors w-full text-center pb-6 pt-4 flex-shrink-0 mt-auto">Tüm İlerlemeyi Sıfırla</button>
          )}
        </div>
      </main>
    </div>
  );
}

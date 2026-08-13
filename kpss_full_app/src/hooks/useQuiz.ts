import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { Question, Stats } from '../types';

interface UseQuizProps {
  category?: string;
  year?: string;
  isReview: boolean;
  isFavoritesMode: boolean;
  sinavTuru?: string;
}

export function useQuiz({ category, year, isReview, isFavoritesMode, sinavTuru }: UseQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Business Logic: Veri yükleme stratejileri
  const loadQuestions = async () => {
    setLoading(true);
    try {
      let data: Question[] = [];
      
      if (isFavoritesMode) {
        data = await api.fetchReview('favorites', sinavTuru);
        if (category && year) {
          data = data.filter(q => 
            q.kategori?.toLowerCase().trim() === category.toLowerCase().trim() && 
            String(q.yil).trim() === String(year).trim()
          );
        }
        // Favorilerden açıldığında eski şık ve durum temizlenir — tekrar çözülebilsin
        data = data.map(q => ({ ...q, status: null, user_choice: null }));
      } else if (isReview) {
        const allReview = await api.fetchReview('wrong', sinavTuru);
        if (category && year) {
          data = allReview.filter(q => 
            q.kategori?.toLowerCase().trim() === category.toLowerCase().trim() && 
            String(q.yil).trim() === String(year).trim()
          );
        } else {
          data = allReview;
        }
        // Hata listesinden açıldığında eski şık ve durum temizlenir — tekrar çözülebilsin
        data = data.map(q => ({ ...q, status: null, user_choice: null }));
      } else if (category && year) {
        data = await api.fetchQuestions(category, year, sinavTuru);
      }

      console.log(`🔍 Quiz Modu: ${isReview ? 'Hata' : isFavoritesMode ? 'Favori' : 'Normal'} | Sınav Türü: ${sinavTuru} | Kategori: ${category} | Yıl: ${year} | Bulunan Soru: ${data.length}`);

      setQuestions(data);
      if (category && year) refreshStats();
    } catch (err) {
      console.error('❌ Quiz Load Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    if (category && year) api.fetchStats(category, year, sinavTuru).then(setStats).catch(console.error);
  };

  useEffect(() => {
    loadQuestions();
  }, [category, year, isReview, isFavoritesMode, sinavTuru]);

  const currentQuestion = useMemo(() => questions[currentIdx], [questions, currentIdx]);

  useEffect(() => {
    if (currentQuestion) {
      // Hata listesi ve favorilerde eski şık gösterilmez — her soru taze başlar
      setSelectedAnswer((isReview || isFavoritesMode) ? null : (currentQuestion.user_choice || null));
    } else {
      setSelectedAnswer(null);
    }
  }, [currentIdx, currentQuestion]);

  // Actions
  const handleAnswer = async (choice: string) => {
    if (!currentQuestion || selectedAnswer) return;
    
    // İş kuralı: Çözülmüş soru tekrar çözülemez (Review/Favorite hariç)
    const isAnsweredInDb = currentQuestion.status && currentQuestion.status !== 'empty';
    if (isAnsweredInDb && !isReview && !isFavoritesMode) return;

    setSelectedAnswer(choice);
    const status = choice === currentQuestion.dogru_cevap ? 'correct' : 'wrong';

    // UI Güncelleme (Optimistic)
    const updated = [...questions];
    updated[currentIdx] = { ...currentQuestion, status, user_choice: choice };
    setQuestions(updated);

    // DB Güncelleme
    if (!isReview && !isFavoritesMode) {
      await api.updateActivity(currentQuestion.id, status, undefined, choice);
      refreshStats();
    }
  };

  const toggleFavorite = async () => {
    if (!currentQuestion) return;
    const newFav = !currentQuestion.is_favorite;
    
    const updated = [...questions];
    updated[currentIdx] = { ...currentQuestion, is_favorite: newFav };
    
    if (isFavoritesMode && !newFav) {
      const filtered = updated.filter(q => q.id !== currentQuestion.id);
      setQuestions(filtered);
      if (currentIdx >= filtered.length) setCurrentIdx(Math.max(0, filtered.length - 1));
    } else {
      setQuestions(updated);
    }
    
    await api.updateActivity(currentQuestion.id, undefined, newFav).catch(console.error);
  };

  const removeMistake = async () => {
    if (!currentQuestion) return;
    await api.removeMistakeFromPool(currentQuestion.id);
    const updated = questions.filter(q => q.id !== currentQuestion.id);
    setQuestions(updated);
    setSelectedAnswer(null);
    if (currentIdx >= updated.length) setCurrentIdx(Math.max(0, updated.length - 1));
  };

  const jumpToQuestion = (idx: number) => {
    if (idx >= 0 && idx < questions.length) {
      setCurrentIdx(idx);
      setSelectedAnswer(null);
    }
  };

  return {
    questions, currentIdx, currentQuestion, stats, loading, selectedAnswer,
    handleAnswer, toggleFavorite, removeMistake, 
    nextQuestion: () => { if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1); },
    prevQuestion: () => { if (currentIdx > 0) setCurrentIdx(i => i - 1); },
    jumpToStart: () => jumpToQuestion(0),
    jumpToQuestion,
    refreshStats,
    loadQuestions
  };
}

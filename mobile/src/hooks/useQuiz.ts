import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { Question } from '../types';

interface UseQuizProps {
  category?: string;
  year?: string;
  mode?: 'wrong' | 'favorites' | 'exam';
  initialIdx?: number;
}

export function useQuiz({ category, year, mode = 'exam', initialIdx = 0 }: UseQuizProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const isReview = mode === 'wrong';
  const isFavoritesMode = mode === 'favorites';

  const loadQuestions = async () => {
    if (!category || !year) {
      if (!isFavoritesMode && !isReview) {
        setLoading(false);
        return;
      }
    }
    
    setLoading(true);
    try {
      let data: Question[] = [];
      if (isFavoritesMode) {
        data = await api.fetchReview('favorites');
        if (category && year) {
          data = data.filter(q => 
            q.kategori?.toLowerCase().trim() === category.toLowerCase().trim() && 
            String(q.yil).trim() === String(year).trim()
          );
        }
      } else if (isReview) {
        data = await api.fetchReview('wrong');
        if (category && year) {
          data = data.filter(q => 
            q.kategori?.toLowerCase().trim() === category.toLowerCase().trim() && 
            String(q.yil).trim() === String(year).trim()
          );
        }
      } else {
        data = await api.fetchQuestions(category!, year!);
      }
      console.log(`🔍 [Mobile] Mod: ${mode} | Soru: ${data.length}`);
      setQuestions(data);
    } catch (err) {
      console.error('❌ Soru yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [category, year, mode]);

  const currentQuestion = useMemo(() => questions[currentIdx], [questions, currentIdx]);

  const handleAnswer = async (choice: string) => {
    if (!currentQuestion || selectedAnswer) return;
    
    setSelectedAnswer(choice);
    const status = choice === currentQuestion.dogru_cevap ? 'correct' : 'wrong';
    
    const updated = [...questions];
    updated[currentIdx].status = status;
    updated[currentIdx].user_choice = choice;
    setQuestions(updated);
    
    api.updateActivity(currentQuestion.id, status, undefined, choice).catch(console.error);
  };

  const toggleFavorite = async () => {
    if (!currentQuestion) return;
    const newState = !currentQuestion.is_favorite;
    const updated = [...questions];
    updated[currentIdx].is_favorite = newState;
    setQuestions(updated);
    api.updateActivity(currentQuestion.id, undefined, newState).catch(console.error);
  };

  const removeMistake = async () => {
    if (!currentQuestion) return;
    await api.removeMistakeFromPool(currentQuestion.id);
    const updated = questions.filter(q => q.id !== currentQuestion.id);
    if (updated.length === 0) return true; // Signal empty list
    
    setQuestions(updated);
    setSelectedAnswer(null);
    if (currentIdx >= updated.length) setCurrentIdx(updated.length - 1);
    return false;
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedAnswer(null);
    }
  };

  const prevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx(i => i - 1);
      setSelectedAnswer(null);
    }
  };

  const jumpToQuestion = (idx: number) => {
    if (idx >= 0 && idx < questions.length) {
      setCurrentIdx(idx);
      setSelectedAnswer(null);
    }
  };

  const jumpToStart = () => jumpToQuestion(0);

  return {
    questions, currentIdx, currentQuestion, loading, selectedAnswer,
    handleAnswer, toggleFavorite, removeMistake, nextQuestion, prevQuestion, loadQuestions,
    setCurrentIdx, jumpToQuestion, jumpToStart
  };
}

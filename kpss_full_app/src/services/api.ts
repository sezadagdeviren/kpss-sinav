import type { Question, Stats } from '../types';

const API_BASE = 'http://localhost:3001';

export const api = {
  fetchCategories: async (): Promise<string[]> => {
    const res = await fetch(`${API_BASE}/api/categories`);
    if (!res.ok) throw new Error('Categories fetch failed');
    const data = await res.json();
    return data.map((c: any) => c.kategori);
  },

  fetchQuestions: async (category: string, year: string): Promise<Question[]> => {
    const res = await fetch(`${API_BASE}/api/questions/${encodeURIComponent(category)}/${year}`);
    if (!res.ok) throw new Error('Questions fetch failed');
    return res.json();
  },

  fetchReview: async (type: 'wrong' | 'favorites'): Promise<Question[]> => {
    const res = await fetch(`${API_BASE}/api/review/${type}/all`);
    if (!res.ok) throw new Error('Review fetch failed');
    return res.json();
  },

  fetchStats: async (category?: string, year?: string): Promise<Stats> => {
    let url = `${API_BASE}/api/stats/${category || 'all'}`;
    if (year) url += `?year=${year}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Stats fetch failed');
    return res.json();
  },

  updateActivity: async (questionId: number, status?: string, isFavorite?: boolean, userChoice?: string) => {
    const res = await fetch(`${API_BASE}/api/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId, status, is_favorite: isFavorite, user_choice: userChoice })
    });
    return res.json();
  },

  resetPool: async (category: string, year: string) => {
    const res = await fetch(`${API_BASE}/api/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, year })
    });
    return res.json();
  },

  saveExamSummary: async (summary: any) => {
    const res = await fetch(`${API_BASE}/api/exam-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary)
    });
    return res.json();
  },

  fetchExamSummaries: async (category: string) => {
    const res = await fetch(`${API_BASE}/api/exam-summaries/${category}`);
    return res.json();
  },

  resetSingle: async (questionId: number) => {
    await fetch(`${API_BASE}/api/activity/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId })
    });
  },

  removeMistakeFromPool: async (questionId: number) => {
    await fetch(`${API_BASE}/api/activity/mistake-remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId })
    });
  },

  fetchMistakesByYear: async (category: string): Promise<{ yil: string, count: number }[]> => {
    const res = await fetch(`${API_BASE}/api/mistakes-by-year/${encodeURIComponent(category)}`);
    if (!res.ok) throw new Error('Mistakes per year fetch failed');
    return res.json();
  },
  
  fetchFavoritesByYear: async (category: string): Promise<{ yil: string, count: number }[]> => {
    const res = await fetch(`${API_BASE}/api/favorites-by-year/${encodeURIComponent(category)}`);
    if (!res.ok) throw new Error('Favorites per year fetch failed');
    return res.json();
  },

  getImageUrl: (path: string) => `${API_BASE}/images/${path}`
};

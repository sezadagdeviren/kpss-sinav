import { API_CONFIG } from '../config/constants';
import type { Question, Stats } from '../types';

const API_BASE = API_CONFIG.BASE_URL;

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }
  return res.json();
};

export const api = {
  fetchCategories: async (): Promise<string[]> => {
    const data = await fetch(`${API_BASE}/api/categories`).then(handleResponse);
    return data.map((c: any) => c.kategori);
  },

  fetchQuestions: async (category: string, year: string): Promise<Question[]> => {
    return fetch(`${API_BASE}/api/questions/${encodeURIComponent(category)}/${year}`).then(handleResponse);
  },

  fetchReview: async (type: 'wrong' | 'favorites'): Promise<Question[]> => {
    return fetch(`${API_BASE}/api/review/${type}/all`).then(handleResponse);
  },

  fetchStats: async (category?: string, year?: string): Promise<Stats> => {
    let url = `${API_BASE}/api/stats`;
    if (category) url += `/${encodeURIComponent(category)}`;
    if (year) url += `/${year}`;
    return fetch(url).then(handleResponse);
  },

  updateActivity: async (questionId: number, status?: 'correct' | 'wrong' | 'empty', isFavorite?: boolean, userChoice?: string): Promise<any> => {
    return fetch(`${API_BASE}/api/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId, status, is_favorite: isFavorite, user_choice: userChoice })
    }).then(handleResponse);
  },

  resetPool: async (category: string, year: string) => {
    return fetch(`${API_BASE}/api/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, year })
    }).then(handleResponse);
  },

  resetSingle: async (questionId: number) => {
    return fetch(`${API_BASE}/api/activity/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId })
    }).then(handleResponse);
  },

  removeMistakeFromPool: async (questionId: number) => {
    return fetch(`${API_BASE}/api/activity/mistake-remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId })
    }).then(handleResponse);
  },

  fetchMistakesByYear: async (category: string): Promise<{ yil: string, count: number }[]> => {
    return fetch(`${API_BASE}/api/mistakes-by-year/${encodeURIComponent(category)}`).then(handleResponse);
  },

  fetchFavoritesByYear: async (category: string): Promise<{ yil: string, count: number }[]> => {
    return fetch(`${API_BASE}/api/favorites-by-year/${encodeURIComponent(category)}`).then(handleResponse);
  },

  saveExamSummary: async (summary: any) => {
    return fetch(`${API_BASE}/api/exam-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary)
    }).then(handleResponse);
  },

  fetchExamSummaries: async (category: string) => {
    return fetch(`${API_BASE}/api/exam-summaries/${encodeURIComponent(category)}`).then(handleResponse);
  },

  getImageUrl: (path: string) => `${API_BASE}/images/${path}`
};

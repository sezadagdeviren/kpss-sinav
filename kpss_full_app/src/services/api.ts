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
  fetchCategories: async (sinavTuru?: string): Promise<string[]> => {
    const url = new URL(`${API_BASE}/api/categories`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    const data = await fetch(url.toString()).then(handleResponse);
    return data.map((c: any) => c.kategori);
  },

  fetchYears: async (category: string, sinavTuru?: string): Promise<string[]> => {
    const url = new URL(`${API_BASE}/api/years/${encodeURIComponent(category)}`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return fetch(url.toString()).then(handleResponse);
  },

  fetchQuestions: async (category: string, year: string, sinavTuru?: string): Promise<Question[]> => {
    const url = new URL(`${API_BASE}/api/questions/${encodeURIComponent(category)}/${year}`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return fetch(url.toString()).then(handleResponse);
  },

  fetchReview: async (type: 'wrong' | 'favorites', sinavTuru?: string): Promise<Question[]> => {
    const url = new URL(`${API_BASE}/api/review/${type}/all`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return fetch(url.toString()).then(handleResponse);
  },

  fetchStats: async (category?: string, year?: string, sinavTuru?: string): Promise<Stats> => {
    let baseUrl = `${API_BASE}/api/stats`;
    if (category) {
      baseUrl += `/${encodeURIComponent(category)}`;
      if (year) baseUrl += `/${year}`;
    }
    const url = new URL(baseUrl);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return fetch(url.toString()).then(handleResponse);
  },

  updateActivity: async (questionId: number, status?: 'correct' | 'wrong' | 'empty', isFavorite?: boolean, userChoice?: string): Promise<any> => {
    return fetch(`${API_BASE}/api/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId, status, is_favorite: isFavorite, user_choice: userChoice })
    }).then(handleResponse);
  },

  resetPool: async (category: string, year: string, sinavTuru?: string) => {
    return fetch(`${API_BASE}/api/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, year, sinav_turu: sinavTuru })
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

  fetchMistakesByYear: async (category: string, sinavTuru?: string): Promise<{ yil: string, count: number }[]> => {
    const url = new URL(`${API_BASE}/api/mistakes-by-year/${encodeURIComponent(category)}`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return fetch(url.toString()).then(handleResponse);
  },

  fetchFavoritesByYear: async (category: string, sinavTuru?: string): Promise<{ yil: string, count: number }[]> => {
    const url = new URL(`${API_BASE}/api/favorites-by-year/${encodeURIComponent(category)}`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return fetch(url.toString()).then(handleResponse);
  },

  saveExamSummary: async (summary: any) => {
    return fetch(`${API_BASE}/api/exam-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary)
    }).then(handleResponse);
  },

  fetchExamSummaries: async (category: string, sinavTuru?: string) => {
    const url = new URL(`${API_BASE}/api/exam-summaries/${encodeURIComponent(category)}`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return fetch(url.toString()).then(handleResponse);
  },

  getImageUrl: (path: string) => `${API_BASE}/images/${path}`
};

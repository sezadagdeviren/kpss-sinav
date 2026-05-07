import axios from 'axios';
import { API_CONFIG } from '../config/constants';
import type { Question, Stats } from '../types';

const API_BASE = API_CONFIG.BASE_URL;

const client = axios.create({
  baseURL: API_BASE,
  timeout: API_CONFIG.TIMEOUT
});

export const api = {
  fetchCategories: async (): Promise<string[]> => {
    const res = await client.get('/api/categories');
    return res.data.map((c: any) => c.kategori);
  },

  fetchQuestions: async (category: string, year: string): Promise<Question[]> => {
    const res = await client.get(`/api/questions/${encodeURIComponent(category)}/${year}`);
    return res.data;
  },

  fetchReview: async (type: 'wrong' | 'favorites'): Promise<Question[]> => {
    const res = await client.get(`/api/review/${type}/all`);
    return res.data;
  },

  fetchStats: async (category: string, year: string): Promise<Stats> => {
    const res = await client.get(`/api/stats/${encodeURIComponent(category)}/${year}`);
    return res.data;
  },

  fetchExamSummaries: async (category: string): Promise<any[]> => {
    const { data } = await client.get(`/api/exam-summaries/${encodeURIComponent(category)}`);
    return data;
  },

  fetchMistakesByYear: async (category: string): Promise<any[]> => {
    const { data } = await client.get(`/api/mistakes-by-year/${encodeURIComponent(category)}`);
    return data;
  },

  updateActivity: async (questionId: number, status?: string, isFavorite?: boolean, userChoice?: string) => {
    const { data } = await client.post('/api/activity', { question_id: questionId, status, is_favorite: isFavorite, user_choice: userChoice });
    return data;
  },

  resetPool: async (category: string, year: string) => {
    const { data } = await client.post('/api/reset', { category, year });
    return data;
  },

  saveExamSummary: async (summary: any) => {
    const { data } = await client.post('/api/exam-summary', summary);
    return data;
  },

  removeMistakeFromPool: async (questionId: number) => {
    const { data } = await client.post('/api/activity/mistake-remove', { question_id: questionId });
    return data;
  },

  getImageUrl: (path: string) => `${API_BASE}/images/${path}`
};

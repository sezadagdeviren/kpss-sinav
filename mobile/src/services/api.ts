import axios from 'axios';
import type { Question, Stats } from '../types';

// Android Emulator: 10.0.2.2
// iOS Simulator: localhost
// Gerçek Cihaz: Bilgisayarınızın yerel IP adresi (örn: 192.168.1.50)
const YOUR_IP = '192.168.1.100'; // Kendi IP adresinizle degistirin
const API_BASE = `http://${YOUR_IP}:3001`;

const client = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
});

export const api = {
  fetchCategories: async (): Promise<string[]> => {
    const { data } = await client.get('/api/categories');
    return data.map((c: any) => c.kategori);
  },

  fetchQuestions: async (category: string, year: string): Promise<Question[]> => {
    const { data } = await client.get(`/api/questions/${encodeURIComponent(category)}/${year}`);
    return data;
  },

  fetchReview: async (type: 'wrong' | 'favorites'): Promise<Question[]> => {
    const { data } = await client.get(`/api/review/${type}/all`);
    return data;
  },

  fetchStats: async (category?: string, year?: string): Promise<Stats> => {
    let url = `/api/stats/${category || 'all'}`;
    if (year) url += `?year=${year}`;
    const { data } = await client.get(url);
    return data;
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
    const { data } = await client.post('/api/activity', {
      question_id: questionId,
      status,
      is_favorite: isFavorite,
      user_choice: userChoice
    });
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

  getImageUrl: (path: string) => `${API_BASE}/images/${path}`
};

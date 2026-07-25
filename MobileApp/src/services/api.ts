import axios from 'axios';
import { API_CONFIG } from '../config/constants';
import type { Question, Stats } from '../types';

const IPS = [
  '10.21.106.104',
  '192.168.1.106', // Son Termux IP
  '10.116.244.104',
  '10.0.2.2',      // Android Emulator
  '127.0.0.1',     // Localhost
  'localhost'
];

const subnets = ['192.168.1', '10.21.106', '10.116.244'];
subnets.forEach(subnet => {
  for (let i = 100; i <= 115; i++) {
    const ip = `${subnet}.${i}`;
    if (!IPS.includes(ip)) IPS.push(ip);
  }
});

const PORTS = [3001, 3002, 3003, 3004, 3005];

const CANDIDATES: string[] = [];
IPS.forEach(ip => {
  PORTS.forEach(port => {
    CANDIDATES.push(`http://${ip}:${port}`);
  });
});

let activeBaseUrl = `http://localhost:3001`;

const client = axios.create({
  baseURL: activeBaseUrl,
  timeout: API_CONFIG.TIMEOUT,
});

// Polyfill-like implementation for Promise.any to prevent crashes on Hermes
async function anyPromise<T>(promises: Promise<T>[]): Promise<T> {
  if (Promise.any) {
    return Promise.any(promises);
  }
  return new Promise<T>((resolve, reject) => {
    let rejectedCount = 0;
    const errors: any[] = [];
    if (promises.length === 0) {
      reject(new TypeError('All promises were rejected'));
      return;
    }
    promises.forEach((p) => {
      Promise.resolve(p).then(
        (val) => resolve(val),
        (err) => {
          errors.push(err);
          rejectedCount++;
          if (rejectedCount === promises.length) {
            reject(new TypeError('All promises were rejected'));
          }
        }
      );
    });
  });
}

let resolveInit: (url: string) => void;
const initPromise = new Promise<string>((resolve) => {
  resolveInit = resolve;
});

// Axios request interceptor: Auto-detection tamamlanana kadar tüm istekleri bekletir
client.interceptors.request.use(async (config) => {
  const finalBaseUrl = await initPromise;
  config.baseURL = finalBaseUrl;
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Uygulama açılışında aktif backend'i otomatik tespit et
async function detectActiveBaseUrl(): Promise<void> {
  try {
    const promises = CANDIDATES.map(async (url) => {
      await axios.get(`${url}/api/categories`, { timeout: 2000 });
      return url;
    });
    const workingUrl = await anyPromise(promises);
    activeBaseUrl = workingUrl;
    resolveInit(workingUrl);
    console.log('✅ Backend bulundu:', workingUrl);
  } catch {
    console.warn('⚠️ Hiçbir backend bulunamadı, varsayılan kullanılıyor:', activeBaseUrl);
    resolveInit(activeBaseUrl);
  }
}

detectActiveBaseUrl();


export const api = {
  fetchCategories: async (sinavTuru?: string): Promise<string[]> => {
    const res = await client.get('/api/categories', {
      params: { sinav_turu: sinavTuru }
    });
    return res.data.map((c: any) => c.kategori);
  },

  fetchYears: async (category: string, sinavTuru?: string): Promise<string[]> => {
    const res = await client.get(`/api/years/${encodeURIComponent(category)}`, {
      params: { sinav_turu: sinavTuru }
    });
    return res.data;
  },

  fetchQuestions: async (category: string, year: string, sinavTuru?: string): Promise<Question[]> => {
    const res = await client.get(`/api/questions/${encodeURIComponent(category)}/${year}`, {
      params: { sinav_turu: sinavTuru }
    });
    return res.data;
  },

  fetchReview: async (type: 'wrong' | 'favorites', sinavTuru?: string): Promise<Question[]> => {
    const res = await client.get(`/api/review/${type}/all`, {
      params: { sinav_turu: sinavTuru }
    });
    return res.data;
  },

  fetchStats: async (category: string, year: string, sinavTuru?: string): Promise<Stats> => {
    const res = await client.get(`/api/stats/${encodeURIComponent(category)}/${year}`, {
      params: { sinav_turu: sinavTuru }
    });
    return res.data;
  },

  fetchExamSummaries: async (category: string, sinavTuru?: string): Promise<any[]> => {
    const { data } = await client.get(`/api/exam-summaries/${encodeURIComponent(category)}`, {
      params: { sinav_turu: sinavTuru }
    });
    return data;
  },

  fetchMistakesByYear: async (category: string, sinavTuru?: string): Promise<any[]> => {
    const { data } = await client.get(`/api/mistakes-by-year/${encodeURIComponent(category)}`, {
      params: { sinav_turu: sinavTuru }
    });
    return data;
  },

  updateActivity: async (questionId: number, status?: string, isFavorite?: boolean, userChoice?: string) => {
    const { data } = await client.post('/api/activity', { question_id: questionId, status, is_favorite: isFavorite, user_choice: userChoice });
    return data;
  },

  resetPool: async (category: string, year: string, sinavTuru?: string) => {
    const { data } = await client.post('/api/reset', { category, year, sinav_turu: sinavTuru });
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

  getImageUrl: (path: string) => `${activeBaseUrl}/images/${path}`
};

import axios from 'axios';
import { API_CONFIG } from '../config/constants';
import type { Question, Stats } from '../types';



// Hızlı test için aday sunucu adresleri
const CANDIDATES = [
  'http://10.0.2.2:3001',       // Android Emulator için öncelikli
  'http://192.168.1.103:3001',  // Fiziksel cihazlar için öncelikli
  'http://localhost:3001'       // Fallback
];

const client = axios.create({
  timeout: API_CONFIG.TIMEOUT,
});

import { Platform } from 'react-native';

// Polyfill-like Promise.any to avoid early rejects from closed IPs
async function anyPromise<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let rejectedCount = 0;
    const errors: any[] = [];
    if (promises.length === 0) {
      reject(new Error('No promises provided'));
      return;
    }
    promises.forEach((p) => {
      Promise.resolve(p).then(
        (val) => resolve(val),
        (err) => {
          errors.push(err);
          rejectedCount++;
          if (rejectedCount === promises.length) {
            reject(new Error('All connections failed'));
          }
        }
      );
    });
  });
}

// Arayüzlerin bekleme yapması için çözümlenecek Promise
let resolveInit: (url: string) => void = () => {};
const initPromise = new Promise<string>((resolve) => {
  resolveInit = resolve;
});

// Axios interceptor: IP tespiti tamamlanana kadar tüm istekleri kuyrukta bekletir
client.interceptors.request.use(async (config) => {
  const finalBaseUrl = await initPromise;
  config.baseURL = finalBaseUrl;
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Hızlıca hangi IP'nin aktif olduğunu tespit et
(async () => {
  try {
    const promises = CANDIDATES.map(async (url) => {
      // Zaman aşımını daha güvenli bir süreye (2.5 sn) çıkarıyoruz
      await axios.get(`${url}/api/categories`, { timeout: 2500 });
      return url;
    });
    
    // İlk BAŞARILI dönen adresi al (Hatalı olanları es geç)
    const fastestUrl = await anyPromise(promises);
    client.defaults.baseURL = fastestUrl;
    resolveInit(fastestUrl); // Bekleyen tüm istekleri yolla
    console.log('✅ Aktif Backend IP Adresi Ayarlandı:', fastestUrl);
  } catch (err) {
    // Ping testi başarısız olursa platforma göre güvenli varsayılanı seç
    const fallbackUrl = Platform.OS === 'android' 
      ? 'http://10.0.2.2:3001' 
      : 'http://192.168.1.103:3001';
      
    client.defaults.baseURL = fallbackUrl;
    resolveInit(fallbackUrl); // Bekleyen tüm istekleri yolla
    console.warn(`⚠️ Hızlı IP tespiti yapılamadı. Varsayılan IP kullanılıyor: ${fallbackUrl}`);
  }
})();




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

  getImageUrl: (path: string) => `${client.defaults.baseURL || 'http://192.168.1.103:3001'}/images/${path}`
};

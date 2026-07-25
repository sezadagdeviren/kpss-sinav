import { API_CONFIG } from '../config/constants';
import type { Question, Stats } from '../types';

let discoveredBaseUrl = API_CONFIG.BASE_URL;
let resolveInit: (url: string) => void;
const initPromise = new Promise<string>((resolve) => {
  resolveInit = resolve;
});

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }
  return res.json();
};

async function detectBackend() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const savedIp = typeof window !== 'undefined' ? localStorage.getItem('kpss_backend_ip') : null;

  // Bilgisayarın bulunduğu alt ağ grubunu tespit edip 100-115 aralığını tara (Termux genellikle bu gruptadır)
  let subnetBase = '192.168.1';
  if (hostname.includes('.') && !hostname.startsWith('localhost') && !hostname.startsWith('127.0.0.')) {
    subnetBase = hostname.split('.').slice(0, 3).join('.');
  }

  const ports = [3001, 3002, 3003, 3004, 3005];
  const ips = [
    hostname,
    ...(savedIp ? [savedIp] : []),
    '127.0.0.1',
    'localhost',
    '192.168.1.106', // Güncel Termux IP'si
    '192.168.1.105',
    '10.21.106.104',
    '10.116.244.104'
  ];

  // Alt ağdaki olası IP'leri de listeye ekleyelim
  for (let i = 100; i <= 115; i++) {
    const ip = `${subnetBase}.${i}`;
    if (!ips.includes(ip)) ips.push(ip);
  }

  // Benzersiz IP listesi oluştur
  const uniqueIps = [...new Set(ips)];

  // Paralel olarak ping at
  const scanPromises: Promise<string>[] = [];
  uniqueIps.forEach(ip => {
    ports.forEach(port => {
      const url = `${protocol}//${ip}:${port}`;
      scanPromises.push(
        (async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 600); // 600ms hızlı ping
          const res = await fetch(`${url}/api/ping`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data && data.project === 'kpss_sinav') {
              return url;
            }
          }
          throw new Error('Not match');
        })()
      );
    });
  });

  try {
    const workingUrl = await Promise.any(scanPromises);
    discoveredBaseUrl = workingUrl;
    
    // Bulunan IP'yi localStorage'a kaydet (bir dahaki sefere anında bağlanır)
    const urlObj = new URL(workingUrl);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kpss_backend_ip', urlObj.hostname);
    }

    resolveInit(workingUrl);
    console.log('✅ Web API Backend bulundu:', workingUrl);
  } catch {
    console.warn('⚠️ Hiçbir backend bulunamadı, varsayılan kullanılıyor:', discoveredBaseUrl);
    resolveInit(API_CONFIG.BASE_URL);
  }
}

detectBackend();

const smartFetch = async (input: string | URL, init?: RequestInit) => {
  const base = await initPromise;
  const urlStr = typeof input === 'string' ? input : input.toString();
  // Replace the default config URL with the discovered base URL
  const finalUrl = urlStr.replace(API_CONFIG.BASE_URL, base);
  return fetch(finalUrl, init).then(handleResponse);
};

export const api = {
  fetchCategories: async (sinavTuru?: string): Promise<string[]> => {
    const url = new URL(`${API_CONFIG.BASE_URL}/api/categories`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    const data = await smartFetch(url.toString());
    return data.map((c: any) => c.kategori);
  },

  fetchYears: async (category: string, sinavTuru?: string): Promise<string[]> => {
    const url = new URL(`${API_CONFIG.BASE_URL}/api/years/${encodeURIComponent(category)}`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return smartFetch(url.toString());
  },

  fetchQuestions: async (category: string, year: string, sinavTuru?: string): Promise<Question[]> => {
    const url = new URL(`${API_CONFIG.BASE_URL}/api/questions/${encodeURIComponent(category)}/${year}`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return smartFetch(url.toString());
  },

  fetchReview: async (type: 'wrong' | 'favorites', sinavTuru?: string): Promise<Question[]> => {
    const url = new URL(`${API_CONFIG.BASE_URL}/api/review/${type}/all`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return smartFetch(url.toString());
  },

  fetchStats: async (category?: string, year?: string, sinavTuru?: string): Promise<Stats> => {
    let baseUrl = `${API_CONFIG.BASE_URL}/api/stats`;
    if (category) {
      baseUrl += `/${encodeURIComponent(category)}`;
      if (year) baseUrl += `/${year}`;
    }
    const url = new URL(baseUrl);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return smartFetch(url.toString());
  },

  updateActivity: async (questionId: number, status?: 'correct' | 'wrong' | 'empty', isFavorite?: boolean, userChoice?: string): Promise<any> => {
    return smartFetch(`${API_CONFIG.BASE_URL}/api/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId, status, is_favorite: isFavorite, user_choice: userChoice })
    });
  },

  resetPool: async (category: string, year: string, sinavTuru?: string) => {
    return smartFetch(`${API_CONFIG.BASE_URL}/api/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, year, sinav_turu: sinavTuru })
    });
  },

  resetSingle: async (questionId: number) => {
    return smartFetch(`${API_CONFIG.BASE_URL}/api/activity/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId })
    });
  },

  removeMistakeFromPool: async (questionId: number) => {
    return smartFetch(`${API_CONFIG.BASE_URL}/api/activity/mistake-remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId })
    });
  },

  fetchMistakesByYear: async (category: string, sinavTuru?: string): Promise<{ yil: string, count: number }[]> => {
    const url = new URL(`${API_CONFIG.BASE_URL}/api/mistakes-by-year/${encodeURIComponent(category)}`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return smartFetch(url.toString());
  },

  fetchFavoritesByYear: async (category: string, sinavTuru?: string): Promise<{ yil: string, count: number }[]> => {
    const url = new URL(`${API_CONFIG.BASE_URL}/api/favorites-by-year/${encodeURIComponent(category)}`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return smartFetch(url.toString());
  },

  saveExamSummary: async (summary: any) => {
    return smartFetch(`${API_CONFIG.BASE_URL}/api/exam-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summary)
    });
  },

  fetchExamSummaries: async (category: string, sinavTuru?: string) => {
    const url = new URL(`${API_CONFIG.BASE_URL}/api/exam-summaries/${encodeURIComponent(category)}`);
    if (sinavTuru) url.searchParams.append('sinav_turu', sinavTuru);
    return smartFetch(url.toString());
  },

  getImageUrl: (path: string) => `${discoveredBaseUrl}/images/${path}`
};

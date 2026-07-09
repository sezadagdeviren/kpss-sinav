export const API_CONFIG = {
  BASE_URL: typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : 'http://localhost:3001',
  TIMEOUT: 10000,
};

export const QUIZ_CONFIG = {
  DEFAULT_YEAR: '2025',
  MAX_MISTAKE_POOL: 100,
};

export const COLORS = {
  CORRECT: 'emerald',
  WRONG: 'rose',
  EMPTY: 'slate',
};

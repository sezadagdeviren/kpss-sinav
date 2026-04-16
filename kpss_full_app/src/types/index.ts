export interface Question {
  id: number;
  yil: string;
  soru_no: number;
  dogru_cevap: string;
  kategori: string;
  konu: string;
  zorluk_seviyesi: string;
  cozum: string;
  soru_resmi: string;
  status: 'correct' | 'wrong' | 'empty' | null;
  is_favorite: boolean;
  user_choice: string | null;
}

export interface Stats {
  correct_count: number;
  wrong_count: number;
  mistake_count: number;
  empty_count: number;
  favorite_count: number;
}

export type ViewState = 'home' | 'years' | 'questions' | 'review';

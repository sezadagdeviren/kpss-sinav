import type { Question } from '../types';

/**
 * Soruları kategori ve yıla göre gruplar.
 */
export const groupQuestions = (questions: Question[]) => {
  const data: Record<string, Record<string, Question[]>> = {};
  questions.forEach(q => {
    if (!data[q.kategori]) data[q.kategori] = {};
    if (!data[q.kategori][q.yil]) data[q.kategori][q.yil] = [];
    data[q.kategori][q.yil].push(q);
  });
  return data;
};

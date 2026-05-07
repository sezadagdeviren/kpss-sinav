import express from 'express';
import cors from 'cors';
import pool from './db';
import path from 'path';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, '../../kpss_hub')));

app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT kategori FROM questions ORDER BY kategori');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Kategoriler yüklenemedi' });
  }
});

app.get('/api/questions/:category/:year', async (req, res) => {
  try {
    const { category, year } = req.params;
    const [rows] = await pool.query(`
      SELECT q.*, ua.status, ua.is_favorite, ua.user_choice 
      FROM questions q 
      LEFT JOIN user_activity ua ON q.id = ua.question_id 
      WHERE LOWER(q.kategori) = LOWER(?) AND q.yil = ?
      ORDER BY q.soru_no
    `, [category, year]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Sorular yüklenemedi' });
  }
});

app.post('/api/activity', async (req, res) => {
  try {
    const { question_id, status, is_favorite, is_in_mistake_pool, user_choice } = req.body;
    let finalMistakePool = is_in_mistake_pool;
    if (status === 'wrong') finalMistakePool = 1;
    if (status === 'correct') finalMistakePool = 0;

    const pStatus = status || null;
    const pFav = is_favorite !== undefined ? (is_favorite ? 1 : 0) : null;
    const pPool = finalMistakePool !== undefined ? (finalMistakePool ? 1 : 0) : null;
    const pChoice = user_choice || null;

    await pool.query(`
      INSERT INTO user_activity (question_id, status, is_favorite, is_in_mistake_pool, user_choice)
      VALUES (?, IFNULL(?, 'empty'), IFNULL(?, 0), IFNULL(?, 0), ?)
      ON DUPLICATE KEY UPDATE 
        status = IF(? IS NOT NULL, ?, status),
        is_favorite = IF(? IS NOT NULL, ?, is_favorite),
        is_in_mistake_pool = IF(? IS NOT NULL, ?, is_in_mistake_pool),
        user_choice = IF(? IS NOT NULL, ?, user_choice)
    `, [
      question_id, pStatus, pFav, pPool, pChoice,
      pStatus, pStatus, pFav, pFav, pPool, pPool, pChoice, pChoice
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Aktivite güncellenemedi' });
  }
});

app.get('/api/stats/:category?/:year?', async (req, res) => {
  try {
    const { category, year } = req.params;
    let query = `
      SELECT 
        SUM(CASE WHEN ua.status = 'correct' THEN 1 ELSE 0 END) as correct_count,
        SUM(CASE WHEN ua.status = 'wrong' THEN 1 ELSE 0 END) as wrong_count,
        SUM(CASE WHEN ua.status = 'empty' OR ua.status IS NULL THEN 1 ELSE 0 END) as empty_count,
        SUM(CASE WHEN ua.is_favorite = 1 THEN 1 ELSE 0 END) as favorite_count,
        SUM(CASE WHEN ua.is_in_mistake_pool = 1 THEN 1 ELSE 0 END) as mistake_count
      FROM questions q
      LEFT JOIN user_activity ua ON q.id = ua.question_id
      WHERE 1=1
    `;
    const params = [];
    if (category && category !== 'undefined' && category !== 'all') {
      query += " AND LOWER(q.kategori) = LOWER(?)";
      params.push(category);
    }
    if (year && year !== 'undefined' && year !== 'all') {
      query += " AND q.yil = ?";
      params.push(year);
    }

    const [rows]: any = await pool.query(query, params);
    res.json(rows[0] || { correct_count: 0, wrong_count: 0, empty_count: 0, favorite_count: 0, mistake_count: 0 });
  } catch (err) {
    res.status(500).json({ error: 'İstatistikler yüklenemedi' });
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    const { category, kategori, year, yil } = req.body;
    const finalCategory = category || kategori;
    const finalYear = year || yil;
    await pool.query(`
      UPDATE user_activity ua
      JOIN questions q ON q.id = ua.question_id
      SET ua.status = 'empty', ua.user_choice = NULL
      WHERE LOWER(q.kategori) = LOWER(?) AND q.yil = ?
    `, [finalCategory, finalYear]);
    
    await pool.query('DELETE FROM user_exam_summaries WHERE LOWER(kategori) = LOWER(?) AND yil = ?', [finalCategory, finalYear]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Sıfırlama işlemi başarısız' });
  }
});

app.post('/api/exam-summary', async (req, res) => {
  try {
    const { category, kategori, year, yil, last_time, last_correct, last_wrong, last_empty } = req.body;
    const finalCategory = category || kategori;
    const finalYear = year || yil;
    
    if (!finalCategory || !finalYear) {
      return res.status(400).json({ error: 'Kategori veya Yıl bilgisi eksik' });
    }
    await pool.query(`
      INSERT INTO user_exam_summaries (kategori, yil, last_time, last_correct, last_wrong, last_empty)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        last_time = VALUES(last_time),
        last_correct = VALUES(last_correct),
        last_wrong = VALUES(last_wrong),
        last_empty = VALUES(last_empty)
    `, [finalCategory, finalYear, last_time, last_correct, last_wrong, last_empty]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Sınav özeti kaydedilemedi' });
  }
});

app.get('/api/exam-summaries/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const [rows] = await pool.query('SELECT * FROM user_exam_summaries WHERE LOWER(kategori) = LOWER(?)', [category]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Özetler yüklenemedi' });
  }
});

app.get('/api/review/:type/:category?', async (req, res) => {
  try {
    const { type, category } = req.params;
    let query = "SELECT q.*, ua.status, ua.is_favorite, ua.user_choice FROM questions q LEFT JOIN user_activity ua ON q.id = ua.question_id WHERE 1=1";
    const params = [];
    if (type === 'wrong') query += " AND ua.is_in_mistake_pool = 1";
    else if (type === 'favorites') query += " AND ua.is_favorite = 1";
    
    if (category && category !== 'all' && category !== 'undefined') { 
      query += " AND LOWER(q.kategori) = LOWER(?)"; 
      params.push(category); 
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Gözden geçirme listesi yüklenemedi' });
  }
});

app.post('/api/activity/mistake-remove', async (req, res) => {
  try {
    const { question_id } = req.body;
    await pool.query(`
      UPDATE user_activity 
      SET is_in_mistake_pool = 0, status = 'empty', user_choice = NULL
      WHERE question_id = ?
    `, [question_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Hata havuzundan silme başarısız' });
  }
});

app.get('/api/mistakes-by-year/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const [rows] = await pool.query(`
      SELECT q.yil, COUNT(*) as count 
      FROM user_activity ua 
      JOIN questions q ON q.id = ua.question_id 
      WHERE LOWER(q.kategori) = LOWER(?) AND ua.is_in_mistake_pool = 1 
      GROUP BY q.yil
    `, [category]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Yıl bazlı hatalar yüklenemedi' });
  }
});

app.get('/api/favorites-by-year/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const [rows] = await pool.query(`
      SELECT q.yil, COUNT(*) as count 
      FROM user_activity ua 
      JOIN questions q ON q.id = ua.question_id 
      WHERE LOWER(q.kategori) = LOWER(?) AND ua.is_favorite = 1 
      GROUP BY q.yil
    `, [category]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Yıl bazlı favoriler yüklenemedi' });
  }
});

app.listen(port, '0.0.0.0', () => console.log(`Backend running on http://0.0.0.0:${port}`));

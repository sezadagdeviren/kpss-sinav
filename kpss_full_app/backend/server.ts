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
  const [rows] = await pool.query('SELECT DISTINCT kategori FROM questions ORDER BY kategori');
  res.json(rows);
});

app.get('/api/questions/:category/:year', async (req, res) => {
  const { category, year } = req.params;
  const [rows] = await pool.query(`
    SELECT q.*, ua.status, ua.is_favorite, ua.user_choice 
    FROM questions q 
    LEFT JOIN user_activity ua ON q.id = ua.question_id 
    WHERE q.kategori = ? AND q.yil = ?
    ORDER BY q.soru_no
  `, [category, year]);
  res.json(rows);
});

app.post('/api/activity', async (req, res) => {
  const { question_id, status, is_favorite, is_in_mistake_pool, user_choice } = req.body;
  let finalMistakePool = is_in_mistake_pool;
  if (status === 'wrong') finalMistakePool = 1;

  const pStatus = status || null;
  const pFav = is_favorite !== undefined ? is_favorite : null;
  const pPool = finalMistakePool !== undefined ? finalMistakePool : null;
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
});

app.get('/api/stats/:category?', async (req, res) => {
  const { category } = req.params;
  const { year } = req.query;
  let query = `
    SELECT 
      COUNT(CASE WHEN ua.status = 'correct' THEN 1 END) as correct_count,
      COUNT(CASE WHEN ua.status = 'wrong' THEN 1 END) as wrong_count,
      COUNT(CASE WHEN ua.is_in_mistake_pool = 1 THEN 1 END) as mistake_count,
      COUNT(CASE WHEN ua.status = 'empty' OR ua.status IS NULL THEN 1 END) as empty_count,
      COUNT(CASE WHEN ua.is_favorite = 1 THEN 1 END) as favorite_count
    FROM questions q
    LEFT JOIN user_activity ua ON q.id = ua.question_id
    WHERE 1=1
  `;
  const params = [];
  if (category && category !== 'all') { query += ' AND q.kategori = ?'; params.push(category); }
  if (year) { query += ' AND q.yil = ?'; params.push(year); }
  const [rows]: any = await pool.query(query, params);
  res.json(rows[0]);
});

app.post('/api/reset', async (req, res) => {
  const { category, year } = req.body;
  await pool.query(`
    UPDATE user_activity ua
    JOIN questions q ON q.id = ua.question_id
    SET ua.status = 'empty', ua.user_choice = NULL
    WHERE q.kategori = ? AND q.yil = ?
  `, [category, year]);
  
  // Also clear the exam summary on reset
  await pool.query('DELETE FROM user_exam_summaries WHERE kategori = ? AND yil = ?', [category, year]);
  
  res.json({ success: true });
});

/** EXAM SUMMARIES **/
app.post('/api/exam-summary', async (req, res) => {
  const { category, year, last_time, last_correct, last_wrong, last_empty } = req.body;
  await pool.query(`
    INSERT INTO user_exam_summaries (kategori, yil, last_time, last_correct, last_wrong, last_empty)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      last_time = VALUES(last_time),
      last_correct = VALUES(last_correct),
      last_wrong = VALUES(last_wrong),
      last_empty = VALUES(last_empty)
  `, [category, year, last_time, last_correct, last_wrong, last_empty]);
  res.json({ success: true });
});

app.get('/api/exam-summaries/:category', async (req, res) => {
  const { category } = req.params;
  const [rows] = await pool.query('SELECT * FROM user_exam_summaries WHERE kategori = ?', [category]);
  res.json(rows);
});

app.post('/api/activity/mistake-remove', async (req, res) => {
  const { question_id } = req.body;
  await pool.query('UPDATE user_activity SET is_in_mistake_pool = 0 WHERE question_id = ?', [question_id]);
  res.json({ success: true });
});

app.get('/api/review/:type/:category?', async (req, res) => {
  const { type, category } = req.params;
  let query = "SELECT q.*, ua.status, ua.is_favorite, ua.user_choice FROM questions q LEFT JOIN user_activity ua ON q.id = ua.question_id WHERE 1=1";
  const params = [];
  if (type === 'wrong') query += " AND ua.is_in_mistake_pool = 1";
  else if (type === 'favorites') query += " AND ua.is_favorite = 1";
  if (category && category !== 'all') { query += " AND q.kategori = ?"; params.push(category); }
  const [rows] = await pool.query(query, params);
  res.json(rows);
});

app.get('/api/mistakes-by-year/:category', async (req, res) => {
  const { category } = req.params;
  const [rows] = await pool.query(`SELECT q.yil, COUNT(*) as count FROM user_activity ua JOIN questions q ON q.id = ua.question_id WHERE q.kategori = ? AND ua.is_in_mistake_pool = 1 GROUP BY q.yil`, [category]);
  res.json(rows);
});

app.get('/api/favorites-by-year/:category', async (req, res) => {
  const { category } = req.params;
  const [rows] = await pool.query(`SELECT q.yil, COUNT(*) as count FROM user_activity ua JOIN questions q ON q.id = ua.question_id WHERE q.kategori = ? AND ua.is_favorite = 1 GROUP BY q.yil`, [category]);
  res.json(rows);
});

app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));

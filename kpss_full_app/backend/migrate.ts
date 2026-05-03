import fs from 'fs';
import path from 'path';
import pool from './db';

async function migrate() {
  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Create Tables (Excluding soru_metni for lightweight DB)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        yil YEAR NOT NULL,
        soru_no INT NOT NULL,
        dogru_cevap VARCHAR(10) NOT NULL,
        kategori VARCHAR(50) NOT NULL,
        konu VARCHAR(100),
        zorluk_seviyesi VARCHAR(50),
        cozum TEXT,
        soru_resmi VARCHAR(255) NOT NULL,
        UNIQUE KEY unique_question (yil, soru_no, kategori)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        status ENUM('correct', 'wrong', 'empty') DEFAULT 'empty',
        is_favorite BOOLEAN DEFAULT FALSE,
        is_in_mistake_pool BOOLEAN DEFAULT FALSE,
        user_choice VARCHAR(10) DEFAULT NULL,
        last_answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_question (question_id),
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_exam_summaries (
        kategori VARCHAR(50),
        yil YEAR,
        last_time INT,
        last_correct INT,
        last_wrong INT,
        last_empty INT,
        PRIMARY KEY (kategori, yil)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

    console.log('📦 Database structures ensured (soru_metni excluded).');

    // 2. Load JSON Data
    const hubDir = path.join(__dirname, '../../kpss_hub');
    const datasets = [
      'Turkce_2006_2025_Full_Dataset.json',
      'Matematik_2006_2025_Full_Dataset.json',
      'Genel_Kultur_2006_2025_Full_Dataset.json'
    ];

    for (const fileName of datasets) {
      const filePath = path.join(hubDir, fileName);
      if (!fs.existsSync(filePath)) continue;

      console.log(`📡 Migrating ${fileName}...`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      let count = 0;
      for (const item of data) {
        // Map "Anayasa" -> "Vatandaşlık" for consistent subject naming
        let category = item.kategori;
        if (category === 'Anayasa') category = 'Vatandaşlık';

        await connection.query(`
          INSERT INTO questions (yil, soru_no, dogru_cevap, kategori, konu, zorluk_seviyesi, cozum, soru_resmi)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            dogru_cevap = VALUES(dogru_cevap),
            konu = VALUES(konu),
            zorluk_seviyesi = VALUES(zorluk_seviyesi),
            cozum = VALUES(cozum),
            soru_resmi = VALUES(soru_resmi)
        `, [
          item.yil,
          parseInt(item.soru_no),
          item.dogru_cevap,
          category,
          item.konu || '',
          item.zorluk_seviyesi || 'Orta',
          item.cozum || '',
          item.soru_resmi
        ]);
        count++;
      }
      console.log(`✅ ${fileName}: ${count} items synced.`);
    }

    console.log('🏁 Migration process finished successfully.');
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

migrate();

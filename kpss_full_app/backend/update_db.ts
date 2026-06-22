import fs from 'fs';
import path from 'path';
import pool from './db';

async function updateDb() {
  let connection;
  try {
    connection = await pool.getConnection();

    // Ensure alt_konu column exists
    try {
      await connection.query('ALTER TABLE questions ADD COLUMN alt_konu VARCHAR(150);');
      console.log('✅ Added alt_konu column to questions table.');
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚡ alt_konu column already exists.');
      } else {
        throw e;
      }
    }

    // Ensure sinav_turu column exists in questions
    try {
      await connection.query("ALTER TABLE questions ADD COLUMN sinav_turu VARCHAR(50) DEFAULT 'Lisans' AFTER alt_konu;");
      console.log('✅ Added sinav_turu column to questions table.');
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚡ sinav_turu column already exists in questions table.');
      } else {
        throw e;
      }
    }

    // Alter unique index unique_question on questions
    try {
      await connection.query('ALTER TABLE questions DROP INDEX unique_question;');
      console.log('✅ Dropped old unique_question index.');
    } catch (e: any) {
      console.log('⚡ Old unique_question index could not be dropped or did not exist.');
    }

    try {
      await connection.query('ALTER TABLE questions ADD UNIQUE KEY unique_question (yil, soru_no, kategori, sinav_turu);');
      console.log('✅ Created new unique_question index (including sinav_turu).');
    } catch (e: any) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('⚡ New unique_question index already exists.');
      } else {
        throw e;
      }
    }

    // Ensure sinav_turu column exists in user_exam_summaries
    try {
      await connection.query("ALTER TABLE user_exam_summaries ADD COLUMN sinav_turu VARCHAR(50) DEFAULT 'Lisans';");
      console.log('✅ Added sinav_turu column to user_exam_summaries table.');
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚡ sinav_turu column already exists in user_exam_summaries table.');
      } else {
        throw e;
      }
    }

    // Alter primary key on user_exam_summaries
    try {
      await connection.query('ALTER TABLE user_exam_summaries DROP PRIMARY KEY;');
      console.log('✅ Dropped old primary key on user_exam_summaries.');
    } catch (e: any) {
      console.log('⚡ Old primary key could not be dropped or did not exist.');
    }

    try {
      await connection.query('ALTER TABLE user_exam_summaries ADD PRIMARY KEY (kategori, yil, sinav_turu);');
      console.log('✅ Created new primary key on user_exam_summaries (including sinav_turu).');
    } catch (e: any) {
      if (e.code === 'ER_MULTIPLE_PRI_KEY') {
        console.log('⚡ Primary key already exists on user_exam_summaries.');
      } else {
        throw e;
      }
    }

    console.log('📡 Okunuyor: data.json ...');
    const dataPath = path.join(__dirname, '../../kpss_hub/data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    let count = 0;
    for (const item of data) {
      let category = item.kategori;
      if (category === 'Anayasa') category = 'Vatandaşlık';

      await connection.query(`
        INSERT INTO questions (yil, soru_no, dogru_cevap, kategori, konu, alt_konu, sinav_turu, zorluk_seviyesi, cozum, soru_resmi)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          konu = VALUES(konu),
          alt_konu = VALUES(alt_konu),
          cozum = VALUES(cozum),
          dogru_cevap = VALUES(dogru_cevap),
          zorluk_seviyesi = VALUES(zorluk_seviyesi),
          soru_resmi = VALUES(soru_resmi)
      `, [
        item.yil,
        parseInt(item.soru_no),
        item.dogru_cevap || '',
        category,
        item.konu || '',
        item.alt_konu || '',
        item.sinav_turu || 'Lisans',
        item.zorluk_seviyesi || 'Orta',
        item.cozum || '',
        item.soru_resmi || ''
      ]);
      count++;
    }
    
    console.log(`✅ ${count} soru güncellendi (konu, alt_konu, cozum).`);
    console.log('🏁 Veritabanı başarıyla güncellendi. Eski veriler (hata havuzu, favoriler vb.) aynen korundu.');

  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

updateDb();

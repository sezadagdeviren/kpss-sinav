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
      // Ignore if column already exists
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⚡ alt_konu column already exists.');
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
        INSERT INTO questions (yil, soru_no, dogru_cevap, kategori, konu, alt_konu, zorluk_seviyesi, cozum, soru_resmi)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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

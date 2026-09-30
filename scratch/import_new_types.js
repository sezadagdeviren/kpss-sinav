#!/usr/bin/env node
/**
 * Yeni sınav türlerini (Adalet, Ekpss-*, Hakimlik, Kaymakamlık, Sayıştay)
 * data.json'dan MySQL veritabanına aktarır.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DATA_JSON = path.join(__dirname, '../data.json');

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_JSON, 'utf-8'));
  
  // Sadece veritabanında olmayan yeni türleri aktar
  const NEW_TYPES = ['Adalet', 'Ekpss-Lisans', 'Ekpss-Onlisans', 'Ekpss-Ortaogretim', 
                     'Hakimlik', 'Kaymakamlık', 'Sayıştay', 'ALES'];
  
  const newQuestions = data.filter(q => NEW_TYPES.some(t => 
    q.sinav_turu?.toLowerCase() === t.toLowerCase()
  ));
  
  console.log(`📊 Aktarılacak yeni soru sayısı: ${newQuestions.length}`);
  
  // Sınav türü başına özet
  const typeCounts = {};
  newQuestions.forEach(q => {
    typeCounts[q.sinav_turu] = (typeCounts[q.sinav_turu] || 0) + 1;
  });
  console.log('Tür bazında dağılım:', typeCounts);
  
  // DB bağlantısı
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'kpss_hub_db',
      multipleStatements: false
    });
    console.log('✅ MySQL bağlantısı kuruldu');
  } catch(e) {
    try {
      connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'kpss_hub_db',
        multipleStatements: false
      });
      console.log('✅ MySQL bağlantısı kuruldu (root/root)');
    } catch(e2) {
      console.error('❌ MySQL bağlantı hatası:', e2.message);
      process.exit(1);
    }
  }

  // Önce mevcut yeni türleri sil (temiz aktarım için)
  for (const t of NEW_TYPES) {
    await connection.execute(
      'DELETE FROM questions WHERE LOWER(sinav_turu) = LOWER(?)',
      [t]
    );
    console.log(`🗑️  Eski kayıtlar silindi: ${t}`);
  }

  // Toplu insert
  let inserted = 0;
  const BATCH = 100;
  
  for (let i = 0; i < newQuestions.length; i += BATCH) {
    const batch = newQuestions.slice(i, i + BATCH);
    
    for (const q of batch) {
      const soru_no = q.soru_no !== undefined ? String(q.soru_no) : null;
      const img = q.img || q.image || q.resim || null;
      const kategori = q.kategori || q.ders || 'Genel';
      const yil = q.yil !== undefined ? String(q.yil) : null;
      const alt_kategori = q.alt_kategori || q.altKategori || null;
      
      await connection.execute(
        `INSERT INTO questions 
         (sinav_turu, kategori, alt_kategori, yil, soru_no, img, dogru_cevap, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [q.sinav_turu, kategori, alt_kategori, yil, soru_no, img, q.dogru_cevap || null]
      );
      inserted++;
    }
    
    process.stdout.write(`\r⏳ ${inserted}/${newQuestions.length} soru aktarıldı...`);
  }
  
  console.log(`\n✅ Toplam ${inserted} soru başarıyla aktarıldı!`);
  
  // Son durum özeti
  const [rows] = await connection.execute(
    'SELECT sinav_turu, COUNT(*) as count FROM questions GROUP BY sinav_turu ORDER BY sinav_turu'
  );
  console.log('\n📊 Güncel veritabanı durumu:');
  rows.forEach(r => console.log(`  ${r.sinav_turu}: ${r.count} soru`));
  
  await connection.end();
}

main().catch(e => {
  console.error('❌ Hata:', e);
  process.exit(1);
});

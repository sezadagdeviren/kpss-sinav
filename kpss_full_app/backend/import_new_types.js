#!/usr/bin/env node
/**
 * Yeni sınav türlerini (Adalet, Ekpss-*, Hakimlik, Kaymakamlık, Sayıştay)
 * data.json'dan MySQL veritabanına aktarır.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DATA_JSON = '/Users/seza/Desktop/kpss_sinav/data.json';

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_JSON, 'utf-8'));
  
  // Tüm türleri yeniden aktar (yıl/kategori karışıklığını düzeltmek için)
  const ALL_TYPES = [
    'Lisans', 'Onlisans', 'Ortaogretim', 'AGS', 'ALES', 'DGS',
    'Adalet', 'Ekpss-Lisans', 'Ekpss-Onlisans', 'Ekpss-Ortaogretim',
    'Hakimlik', 'Kaymakamlık', 'Sayıştay'
  ];
  
  const newQuestions = data.filter(q => ALL_TYPES.some(t => 
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

  // Önce mevcut tüm türleri sil (temiz aktarım için)
  for (const t of ALL_TYPES) {
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
      const soru_no = parseInt(q.soru_no) || 0;
      const soru_resmi = q.img || q.image || q.resim || q.soru_resmi || '';
      const kategori = q.kategori || q.ders || 'Genel';
      const yil = q.yil !== undefined ? String(q.yil) : '';
      const dogru_cevap = q.dogru_cevap || '';
      
      await connection.execute(
        `INSERT INTO questions 
         (sinav_turu, kategori, yil, soru_no, soru_resmi, dogru_cevap)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           soru_resmi = VALUES(soru_resmi),
           dogru_cevap = VALUES(dogru_cevap)`,
        [q.sinav_turu, kategori, yil, soru_no, soru_resmi, dogru_cevap]
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

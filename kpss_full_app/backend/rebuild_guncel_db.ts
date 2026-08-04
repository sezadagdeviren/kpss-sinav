import pool from './db';
import fs from 'fs';
import path from 'path';

async function fullRebuildGuncel() {
  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Kalan tüm yanlış Güncel Bilgiler kayıtlarını temizle
    console.log('🧹 Kalan yanlış pathli Güncel Bilgiler kayıtları siliniyor...');
    const [del1]: any = await connection.query(`
      DELETE FROM questions
      WHERE kategori = 'Güncel Bilgiler'
        AND soru_resmi NOT LIKE '%GuncelBilgiler%'
        AND soru_resmi NOT LIKE 'AGS/%'
    `);
    console.log(`✅ ${del1.affectedRows} adet kalan hatalı kayıt silindi.`);

    // 2. data.json'dan Güncel Bilgiler kayıtlarını ekle/güncelle
    console.log('📡 data.json okunuyor...');
    const dataPath = path.join(__dirname, '../../data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const guncelItems = data.filter((d: any) => d.kategori === 'Güncel Bilgiler');
    console.log(`   ${guncelItems.length} Güncel Bilgiler kaydı bulundu.`);

    let inserted = 0;
    for (const item of guncelItems) {
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
        'Güncel Bilgiler',
        item.konu || '',
        item.alt_konu || '',
        item.sinav_turu || 'Lisans',
        item.zorluk_seviyesi || 'Orta',
        item.cozum || '',
        item.soru_resmi || ''
      ]);
      inserted++;
    }
    console.log(`✅ ${inserted} Güncel Bilgiler kaydı INSERT/UPDATE edildi.`);

    // 3. Son kontrol
    const [total]: any = await connection.query(`SELECT COUNT(*) as cnt FROM questions WHERE kategori = 'Güncel Bilgiler'`);
    console.log(`📊 MySQL'de toplam Güncel Bilgiler: ${total[0].cnt}`);

    const [bad]: any = await connection.query(`
      SELECT COUNT(*) as cnt FROM questions
      WHERE kategori = 'Güncel Bilgiler'
        AND soru_resmi NOT LIKE '%GuncelBilgiler%'
        AND soru_resmi NOT LIKE 'AGS/%'
    `);
    if (bad[0].cnt > 0) {
      console.log(`⚠️  Hâlâ ${bad[0].cnt} hatalı path var!`);
    } else {
      console.log('✅ Tüm Güncel Bilgiler kayıtları doğru path içeriyor!');
    }

    // 4. Konu dağılımı
    const [konular]: any = await connection.query(`
      SELECT konu, COUNT(*) as cnt FROM questions 
      WHERE kategori = 'Güncel Bilgiler' 
      GROUP BY konu ORDER BY cnt DESC
    `);
    console.log('\n📋 Konu Dağılımı:');
    for (const k of konular) {
      console.log(`  ${(k.konu || 'BOŞ').padEnd(55)} → ${k.cnt} soru`);
    }

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

fullRebuildGuncel();

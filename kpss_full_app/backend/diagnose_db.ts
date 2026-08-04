import pool from './db';
import fs from 'fs';
import path from 'path';

async function diagnoseAll() {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('=' .repeat(65));
    console.log('1) VERİTABANI DUPLIKAT KAYIT ANALİZİ');
    console.log('='.repeat(65));

    // Duplikat: aynı (sinav_turu, yil, soru_no, kategori) kombinasyonu
    const [dups]: any = await connection.query(`
      SELECT sinav_turu, yil, soru_no, kategori, COUNT(*) as cnt
      FROM questions
      GROUP BY sinav_turu, yil, soru_no, kategori
      HAVING cnt > 1
      ORDER BY cnt DESC, sinav_turu, yil, soru_no+0
      LIMIT 50
    `);

    if (dups.length === 0) {
      console.log('✅ Veritabanında duplikat kayıt yok.');
    } else {
      console.log(`⚠️  ${dups.length} adet duplikat kombinasyon:`);
      for (const d of dups) {
        console.log(`  [${d.sinav_turu} | ${d.yil} | Soru ${d.soru_no} | ${d.kategori}] → ${d.cnt} kayıt`);
      }
    }

    console.log('\n' + '='.repeat(65));
    console.log('2) VERİTABANI EKSİK PATH ANALİZİ');
    console.log('='.repeat(65));

    const [emptyPath]: any = await connection.query(`
      SELECT sinav_turu, yil, soru_no, kategori, soru_resmi
      FROM questions
      WHERE soru_resmi IS NULL OR soru_resmi = ''
      ORDER BY sinav_turu, yil, soru_no+0
    `);

    if (emptyPath.length === 0) {
      console.log('✅ Veritabanında eksik path yok.');
    } else {
      console.log(`⚠️  ${emptyPath.length} adet eksik path:`);
      for (const r of emptyPath.slice(0, 20)) {
        console.log(`  [${r.sinav_turu} | ${r.yil} | Soru ${r.soru_no} | ${r.kategori}]`);
      }
      if (emptyPath.length > 20) console.log(`  ... ve ${emptyPath.length - 20} kayıt daha`);
    }

    console.log('\n' + '='.repeat(65));
    console.log('3) AGS 2025 Soru 33 — DETAY KONTROL');
    console.log('='.repeat(65));

    const [ags33]: any = await connection.query(`
      SELECT id, sinav_turu, yil, soru_no, kategori, konu, soru_resmi, dogru_cevap
      FROM questions
      WHERE sinav_turu = 'AGS' AND yil = '2025' AND soru_no = 33
    `);
    console.log(`AGS 2025 Soru 33 kayıt sayısı: ${ags33.length}`);
    for (const r of ags33) {
      console.log(`  ID:${r.id} | ${r.kategori} | ${r.konu} | path: ${r.soru_resmi} | cevap: ${r.dogru_cevap}`);
    }

    console.log('\n' + '='.repeat(65));
    console.log('4) TOPLAM KAYIT SAYILARI');
    console.log('='.repeat(65));
    const [totals]: any = await connection.query(`SELECT sinav_turu, COUNT(*) as cnt FROM questions GROUP BY sinav_turu`);
    for (const t of totals) console.log(`  ${t.sinav_turu}: ${t.cnt} soru`);
    const [grandTotal]: any = await connection.query(`SELECT COUNT(*) as cnt FROM questions`);
    console.log(`  TOPLAM: ${grandTotal[0].cnt}`);

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

diagnoseAll();

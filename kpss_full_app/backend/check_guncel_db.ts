import pool from './db';

async function checkGuncelBilgiler() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Güncel Bilgiler kayıtlarını çek
    const [rows]: any = await connection.query(`
      SELECT sinav_turu, yil, soru_no, konu, soru_resmi
      FROM questions 
      WHERE kategori = 'Güncel Bilgiler'
      ORDER BY sinav_turu, yil+0, soru_no+0
      LIMIT 30
    `);
    
    console.log(`\n✅ MySQL'deki Güncel Bilgiler (ilk 30):`);
    console.log(`${'Tür'.padEnd(14)} ${'Yıl'.padEnd(6)} ${'No'.padEnd(4)} ${'Konu'.padEnd(45)} ${'Path'}`);
    console.log('─'.repeat(120));
    for (const r of rows) {
      console.log(
        `${(r.sinav_turu || '').padEnd(14)} ${String(r.yil).padEnd(6)} ${String(r.soru_no).padEnd(4)} ${(r.konu || '').substring(0,43).padEnd(45)} ${r.soru_resmi || ''}`
      );
    }
    
    // Toplam sayı
    const [total]: any = await connection.query(`SELECT COUNT(*) as cnt FROM questions WHERE kategori = 'Güncel Bilgiler'`);
    console.log(`\n📊 MySQL'de toplam Güncel Bilgiler: ${total[0].cnt}`);
    
    // Konu dağılımı
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

checkGuncelBilgiler();

import pool from './db';

async function cleanOldGuncelRecords() {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('🔍 Eski Vatandaslik/ pathli Güncel Bilgiler kayıtları siliniyor...');

    // Eski path pattern'i olan kayıtları sil:
    // soru_resmi LIKE 'Vatandaslik/%' veya LIKE '%/Vatandaslik/%'
    // VE kategori = 'Güncel Bilgiler'
    const [result]: any = await connection.query(`
      DELETE FROM questions
      WHERE kategori = 'Güncel Bilgiler'
        AND (
          soru_resmi LIKE 'Vatandaslik/%'
          OR soru_resmi LIKE '%/Vatandaslik/%'
        )
    `);

    console.log(`✅ ${result.affectedRows} adet eski Vatandaslik/ pathli Güncel Bilgiler kaydı silindi.`);

    // Kalan toplam kontrol
    const [total]: any = await connection.query(`SELECT COUNT(*) as cnt FROM questions WHERE kategori = 'Güncel Bilgiler'`);
    console.log(`📊 MySQL'de kalan Güncel Bilgiler: ${total[0].cnt}`);

    // Path kontrolü — hâlâ bozuk olanlar var mı?
    const [bad]: any = await connection.query(`
      SELECT sinav_turu, yil, soru_no, soru_resmi FROM questions
      WHERE kategori = 'Güncel Bilgiler'
        AND soru_resmi NOT LIKE '%GuncelBilgiler%'
        AND soru_resmi NOT LIKE 'AGS/%'
    `);

    if (bad.length > 0) {
      console.log(`\n⚠️  Hâlâ GuncelBilgiler path içermeyen ${bad.length} kayıt:`);
      for (const r of bad) {
        console.log(`  [${r.sinav_turu} | ${r.yil} | Soru ${r.soru_no}] → ${r.soru_resmi}`);
      }
    } else {
      console.log('\n✅ Tüm Güncel Bilgiler kayıtları doğru GuncelBilgiler/ path içeriyor!');
    }

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    if (connection) connection.release();
    process.exit();
  }
}

cleanOldGuncelRecords();

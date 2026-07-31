const mysql = require('mysql2/promise');

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: '10.21.106.104',
      port: 3306,
      user: 'root',
      password: '',
      database: 'kpss_hub_db',
      connectTimeout: 5000,
    });
    
    const [rows] = await conn.query('SELECT COUNT(*) as total FROM questions');
    console.log('✅ Termux MySQL bağlantısı BAŞARILI!');
    console.log('Toplam soru:', rows[0].total);
    
    const [favs] = await conn.query('SELECT COUNT(*) as favs FROM user_activity WHERE is_favorite=1');
    console.log('Favoriler:', favs[0].favs);
    
    const [mistakes] = await conn.query('SELECT COUNT(*) as m FROM user_activity WHERE is_in_mistake_pool=1');
    console.log('Hata havuzu:', mistakes[0].m);
    
    await conn.end();
  } catch (err) {
    console.error('❌ Bağlantı hatası:', err.message);
  }
}

test();

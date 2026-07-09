import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend folder or root
dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.DB_NAME) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'kpss_hub_db';
const DB_HOST_ENV = process.env.DB_HOST || '127.0.0.1';

// Öncelik sırası:
// 1. .env'deki host (Termux IP) — asıl güncel veri orada
// 2. localhost — eğer Termux'ta çalışıyorsa bu zaten Termux MySQL'i
const DB_HOSTS = [DB_HOST_ENV, '127.0.0.1'].filter(
  (h, i, arr) => arr.indexOf(h) === i // deduplicate
);

async function tryConnect(host: string): Promise<mysql.Pool | null> {
  try {
    const testPool = mysql.createPool({
      host,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
      connectTimeout: 3000,
    });

    const conn = await testPool.getConnection();
    conn.release();
    await testPool.end();
    return null; // just testing — create real pool below
  } catch {
    return null;
  }
}

async function createSmartPool(): Promise<mysql.Pool> {
  for (const host of DB_HOSTS) {
    try {
      const testPool = mysql.createPool({
        host,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0,
        connectTimeout: 3000,
      });

      const conn = await testPool.getConnection();
      conn.release();
      await testPool.end();

      console.log(`🗄️  MySQL bağlantısı kuruldu: ${host} → ${DB_NAME}`);

      // Return full-capacity pool
      return mysql.createPool({
        host,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000,
      });
    } catch {
      console.warn(`⚠️  MySQL ${host} erişilemedi, sıradaki deneniyor...`);
    }
  }

  // Hiçbirine bağlanamazsa — hata mesajını göster ama çökmesine izin ver
  console.error(`\n❌  MySQL bağlantısı kurulamadı!`);
  console.error(`    Denenen hostlar: ${DB_HOSTS.join(', ')}`);
  console.error(`    Termux açık ve MySQL çalışıyor mu? Aynı WiFi ağında mısın?`);
  console.error(`    → Termux'ta: mysqld_safe & (MySQL başlat)`);
  console.error(`    → Termux IP: ip addr show wlan0 | grep inet\n`);

  // Son çare — fallback pool (hata verecek ama uygulama başlayacak)
  return mysql.createPool({
    host: DB_HOST_ENV,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

const poolPromise = createSmartPool();

// Proxy: her sorguyu pool hazır olana kadar bekletir
const handler: mysql.Pool = new Proxy({} as mysql.Pool, {
  get(_target, prop) {
    return async (...args: any[]) => {
      const pool = await poolPromise;
      return (pool as any)[prop](...args);
    };
  },
});

export default handler;

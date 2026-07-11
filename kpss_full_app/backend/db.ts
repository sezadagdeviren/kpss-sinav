import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import net from 'net';
import os from 'os';

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });
if (!process.env.DB_NAME) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'kpss_hub_db';
const DB_HOST_HINT = process.env.DB_HOST; // Optional hint from .env

function getLocalSubnets(): string[] {
  const ifaces = os.networkInterfaces();
  const subnets: string[] = [];
  for (const iface of Object.values(ifaces)) {
    if (!iface) continue;
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        const parts = alias.address.split('.');
        subnets.push(`${parts[0]}.${parts[1]}.${parts[2]}`);
      }
    }
  }
  return [...new Set(subnets)];
}

function checkPort(host: string, port: number, timeout = 500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    socket.setTimeout(timeout);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.once('error', () => resolve(false));
  });
}

async function tryMysqlConnect(host: string): Promise<boolean> {
  try {
    const testPool = mysql.createPool({
      host,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
      connectTimeout: 2000,
    });
    const conn = await testPool.getConnection();
    conn.release();
    await testPool.end();
    return true;
  } catch {
    return false;
  }
}

async function discoverMySQLHost(): Promise<string> {
  const isTermux = process.env.PREFIX !== undefined || process.cwd().includes('com.termux');

  // 1. Termux'ta çalışıyorsak doğrudan localhost'a bağlan
  if (isTermux) {
    const localOk = await tryMysqlConnect('127.0.0.1');
    if (localOk) return '127.0.0.1';
  }

  // 2. .env'deki hint'i dene (varsa ve 127.0.0.1 değilse)
  if (DB_HOST_HINT && DB_HOST_HINT !== '127.0.0.1') {
    const hintOk = await tryMysqlConnect(DB_HOST_HINT);
    if (hintOk) {
      return DB_HOST_HINT;
    }
    console.warn(`⚠️  Kayıtlı IP (${DB_HOST_HINT}) çevrimdışı, ağ taranıyor...`);
  }

  // 3. Yerel ağda Termux MySQL'i ara (Soket limitlerini aşmamak için 32'lik gruplarla tara)
  const subnets = getLocalSubnets();
  if (subnets.length > 0) {
    console.log(`🔍 Termux MySQL aranıyor... Ağlar: ${subnets.join(', ')}.0/24`);
    const startTime = Date.now();

    for (const subnet of subnets) {
      const openHosts: string[] = [];
      const ips = Array.from({ length: 254 }, (_, i) => `${subnet}.${i + 1}`);
      const chunkSize = 32;

      for (let i = 0; i < ips.length; i += chunkSize) {
        const chunk = ips.slice(i, i + chunkSize);
        const scanPromises = chunk.map(async (ip) => {
          const open = await checkPort(ip, 3306, 1200); // 1.2s timeout
          return open ? ip : null;
        });
        const chunkResults = await Promise.all(scanPromises);
        openHosts.push(...(chunkResults.filter(Boolean) as string[]));
      }

      if (openHosts.length > 0) {
        for (const host of openHosts) {
          const ok = await tryMysqlConnect(host);
          if (ok) {
            const elapsed = Date.now() - startTime;
            console.log(`✅ Dinamik Termux MySQL bulundu: ${host} (${elapsed}ms)`);
            
            // .env dosyasını otomatik güncelle
            const envPath = path.join(__dirname, '../.env');
            try {
              const fs = require('fs');
              let envContent = fs.readFileSync(envPath, 'utf8');
              envContent = envContent.replace(/^DB_HOST=.*/m, `DB_HOST=${host}`);
              fs.writeFileSync(envPath, envContent);
              console.log(`📝 .env güncellendi: DB_HOST=${host}`);
            } catch {}
            return host;
          }
        }
      }
    }
  }

  // 4. PC'de son çare localhost'u dene (Termux yoksa yerel DB'ye bağlan)
  if (!isTermux) {
    console.log('ℹ️  Ağda Termux bulunamadı, localhost (PC yerel) deneniyor...');
    const localOk = await tryMysqlConnect('127.0.0.1');
    if (localOk) return '127.0.0.1';
  }

  throw new Error('Termux MySQL veya yerel MySQL sunucusu bulunamadı.');
}

async function createSmartPool(): Promise<mysql.Pool> {
  let host: string;
  try {
    host = await discoverMySQLHost();
  } catch (err: any) {
    console.error(`\n❌ MySQL bulunamadı: ${err.message}`);
    console.warn('⚠️  Termux çevrimdışı, yerel MySQL (127.0.0.1) fallback olarak kullanılıyor.\n');
    host = '127.0.0.1';
  }

  console.log(`🗄️  MySQL bağlantısı kuruldu: ${host} → ${DB_NAME}`);

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
}

const poolPromise = createSmartPool();

const handler: mysql.Pool = new Proxy({} as mysql.Pool, {
  get(_target, prop) {
    return async (...args: any[]) => {
      const pool = await poolPromise;
      return (pool as any)[prop](...args);
    };
  },
});

export default handler;

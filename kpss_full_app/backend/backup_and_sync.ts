/**
 * backup_and_sync.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Önce veritabanının TAM YEDEĞINI alır (questions + user_activity + user_exam_summaries)
 * 2. Ardından data.json → questions tablosunu günceller
 *
 * KORUNAN VERİLER (kesinlikle silinmez/değiştirilmez):
 *   - user_activity.is_favorite         → Favori sorular ⭐
 *   - user_activity.status              → Doğru/yanlış/boş bilgisi
 *   - user_activity.user_choice         → Seçilen cevap
 *   - user_activity.is_in_mistake_pool  → Yanlış havuzu
 *   - user_exam_summaries.last_time     → Kaç dakikada çözdüğün
 *
 * Çalıştır:
 *   npx ts-node backup_and_sync.ts
 *   npx ts-node backup_and_sync.ts --skip-answers    → dogru_cevap ATLANIR
 *   npx ts-node backup_and_sync.ts --no-delete       → Fazla sorular silinmez
 */

import fs from 'fs';
import path from 'path';
import pool from './db';

const SKIP_ANSWERS = process.argv.includes('--skip-answers');
const NO_DELETE    = process.argv.includes('--no-delete');

const DATA_JSON_PATH = path.join(__dirname, '../../data.json');
const BACKUP_DIR     = path.join(__dirname, '../../');
const BACKUP_FILE    = path.join(BACKUP_DIR, `kpss_hub_db_backup_${timestamp()}.sql`);

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function normalize(s: string | null | undefined): string {
  return (s ?? '').trim();
}

function normalizeAnswer(s: string | null | undefined): string {
  return normalize(s).toUpperCase();
}

// ─── YEDEK ───────────────────────────────────────────────────────────────────

async function backup(conn: any): Promise<void> {
  console.log('\n💾 VERİTABANI YEDEĞİ ALINIYOR...');
  console.log(`   Hedef: ${BACKUP_FILE}`);

  let sql = `-- kpss_hub_db backup — ${new Date().toISOString()}\n`;
  sql += `-- ÖNEMLİ: user_activity ve user_exam_summaries KORUNMAKTADIR\n\n`;
  sql += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

  const tables = ['questions', 'user_activity', 'user_exam_summaries'];

  for (const table of tables) {
    process.stdout.write(`   📦 ${table} yedekleniyor...`);

    // CREATE TABLE
    const [[createRow]]: any = await conn.query(`SHOW CREATE TABLE ${table}`);
    const createSql = (createRow['Create Table'] || createRow['Create View']) as string;
    sql += `DROP TABLE IF EXISTS \`${table}\`;\n`;
    sql += createSql + ';\n\n';

    // INSERT DATA
    const [rows]: any = await conn.query(`SELECT * FROM ${table}`);
    if (rows.length === 0) {
      sql += `-- ${table}: kayıt yok\n\n`;
      console.log(` 0 kayıt`);
      continue;
    }

    const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
    const chunkSize = 500;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const vals = chunk.map((row: any) => {
        const escaped = Object.values(row).map((v: any) => {
          if (v === null || v === undefined) return 'NULL';
          if (typeof v === 'number' || typeof v === 'boolean') return v;
          return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
        });
        return `(${escaped.join(', ')})`;
      }).join(',\n  ');
      sql += `INSERT INTO \`${table}\` (${cols}) VALUES\n  ${vals};\n\n`;
    }
    console.log(` ${rows.length.toLocaleString()} kayıt ✅`);
  }

  sql += `SET FOREIGN_KEY_CHECKS=1;\n`;
  fs.writeFileSync(BACKUP_FILE, sql, 'utf8');

  const sizeMB = (fs.statSync(BACKUP_FILE).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Yedek başarıyla alındı: ${sizeMB} MB`);
  console.log(`   ${BACKUP_FILE}\n`);
}

// ─── SYNC ────────────────────────────────────────────────────────────────────

async function sync(conn: any): Promise<void> {
  if (!fs.existsSync(DATA_JSON_PATH)) {
    console.error(`❌ data.json bulunamadı: ${DATA_JSON_PATH}`);
    process.exit(1);
  }

  if (SKIP_ANSWERS) console.log('ℹ️  --skip-answers: dogru_cevap güncellemesi ATLANACAK');

  console.log(`📂 JSON okunuyor: ${DATA_JSON_PATH}`);
  const items = JSON.parse(fs.readFileSync(DATA_JSON_PATH, 'utf8'));
  console.log(`   ${items.length.toLocaleString()} kayıt yüklendi.\n`);

  const UPDATABLE = ['dogru_cevap', 'cozum', 'konu', 'alt_konu', 'zorluk_seviyesi'] as const;
  let updated = 0, alreadyCorrect = 0, notFound = 0, noImage = 0;
  const fieldCounts: Record<string, number> = {};
  for (const f of UPDATABLE) fieldCounts[f] = 0;
  const notFoundList: string[] = [];
  const changedAnswers: { resmi: string; from: string; to: string }[] = [];

  let i = 0;
  for (const item of items) {
    i++;
    if (i % 1000 === 0) process.stdout.write(`\r   İşleniyor: ${i.toLocaleString()} / ${items.length.toLocaleString()}...`);

    if (!item.soru_resmi) { noImage++; continue; }

    const [rows]: any = await conn.query(
      'SELECT id, dogru_cevap, cozum, konu, alt_konu, zorluk_seviyesi FROM questions WHERE soru_resmi = ? LIMIT 1',
      [item.soru_resmi]
    );

    if (rows.length === 0) {
      notFound++;
      if (notFoundList.length < 20) notFoundList.push(item.soru_resmi);
      continue;
    }

    const db = rows[0];
    const updates: Record<string, string> = {};

    // dogru_cevap
    if (!SKIP_ANSWERS) {
      const ja = normalizeAnswer(item.dogru_cevap);
      const da = normalizeAnswer(db.dogru_cevap);
      if (ja.length > 0 && ja !== da) {
        updates['dogru_cevap'] = ja;
        fieldCounts['dogru_cevap']++;
        changedAnswers.push({ resmi: item.soru_resmi, from: da, to: ja });
      }
    }

    // Diğer alanlar
    for (const field of ['cozum', 'konu', 'alt_konu', 'zorluk_seviyesi'] as const) {
      const jv = normalize(item[field]);
      const dv = normalize(db[field]);
      if (jv !== dv) {
        updates[field] = jv;
        fieldCounts[field]++;
      }
    }

    if (Object.keys(updates).length === 0) { alreadyCorrect++; continue; }

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    await conn.query(`UPDATE questions SET ${setClauses} WHERE id = ?`, [...Object.values(updates), db.id]);
    updated++;
  }

  process.stdout.write('\r' + ' '.repeat(70) + '\r');

  // Fazla soruları sil
  if (!NO_DELETE) {
    console.log('🗑️  data.json\'da olmayan eski sorular tespit ediliyor...');
    const validImages = new Set(items.map((q: any) => q.soru_resmi).filter(Boolean));
    const [allDbRows]: any = await conn.query('SELECT id, soru_resmi FROM questions');
    const toDelete: number[] = allDbRows.filter((r: any) => r.soru_resmi && !validImages.has(r.soru_resmi)).map((r: any) => r.id);

    if (toDelete.length > 0) {
      const chunkSize = 100;
      for (let idx = 0; idx < toDelete.length; idx += chunkSize) {
        await conn.query('DELETE FROM questions WHERE id IN (?)', [toDelete.slice(idx, idx + chunkSize)]);
      }
      console.log(`   🗑️  ${toDelete.length} adet atıl soru silindi.`);
    } else {
      console.log('   ✅ Silinecek atıl soru yok.');
    }
  }

  // ─── RAPOR ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SENKRONIZASYON RAPORU');
  console.log('═'.repeat(60));
  console.log(`✅ Güncellenen          : ${updated.toLocaleString()}`);
  console.log(`⏭️  Zaten doğru (atlandı): ${alreadyCorrect.toLocaleString()}`);
  console.log(`❓ DB'de bulunamayan    : ${notFound.toLocaleString()}`);
  console.log(`🖼️  Resim yolu eksik    : ${noImage.toLocaleString()}`);
  console.log('─'.repeat(60));
  console.log('📝 Alan bazlı güncelleme:');
  for (const f of UPDATABLE) {
    if (fieldCounts[f] > 0) console.log(`   ${f.padEnd(22)}: ${fieldCounts[f]} kayıt`);
  }
  if (changedAnswers.length > 0) {
    console.log('─'.repeat(60));
    console.log(`🔑 Değişen dogru_cevap (ilk ${Math.min(changedAnswers.length, 10)}):`);
    for (const c of changedAnswers.slice(0, 10)) {
      console.log(`   "${c.resmi}": "${c.from || '(boş)'}" → "${c.to}"`);
    }
  }
  if (notFoundList.length > 0) {
    console.log('─'.repeat(60));
    console.log(`⚠️  DB'de bulunamayan (ilk ${notFoundList.length}):`);
    for (const r of notFoundList) console.log(`   ${r}`);
  }

  console.log('═'.repeat(60));
  console.log('\n🔒 KORUNAN VERİLER (değiştirilmedi):');
  console.log('   ⭐ user_activity.is_favorite       → Favori sorular');
  console.log('   ❌ user_activity.status             → Doğru/Yanlış geçmişi');
  console.log('   📝 user_activity.user_choice        → Seçilen cevaplar');
  console.log('   🎯 user_activity.is_in_mistake_pool → Yanlış havuzu');
  console.log('   ⏱️  user_exam_summaries.last_time   → Çözüm süreleri');
  console.log('═'.repeat(60));
  console.log('🏁 Tamamlandı!');
}

// ─── ANA AKIŞ ────────────────────────────────────────────────────────────────

async function main() {
  let conn: any;
  try {
    conn = await (pool as any).getConnection();
    console.log('🔌 Veritabanına bağlandı.\n');

    // 1. Yedek al
    await backup(conn);

    // 2. Sync yap
    console.log('🔄 SENKRONIZASYON BAŞLIYOR...\n');
    await sync(conn);

  } catch (err) {
    console.error('\n❌ Hata:', err);
    process.exit(1);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

main();

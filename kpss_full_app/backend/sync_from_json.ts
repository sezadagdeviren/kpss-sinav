/**
 * sync_from_json.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * data.json → MySQL veritabanı senkronizasyonu.
 *
 * Çalıştır:
 *   npm run sync                  → dogru_cevap dahil tüm alanları güncelle ve eksik soruları sil
 *   npm run sync -- --skip-answers → dogru_cevap HARİÇ güncelle (güvenli mod)
 *   npm run sync -- --no-delete   → DB'de olup JSON'da olmayan soruları silme
 */

import fs from 'fs';
import path from 'path';
import pool from './db';

// ─── Config ──────────────────────────────────────────────────────────────────

// --skip-answers flag: dogru_cevap güncellemesini atla
const SKIP_ANSWERS = process.argv.includes('--skip-answers');
const NO_DELETE = process.argv.includes('--no-delete');

// Varsayılan data.json yolu; komut satırından override edilebilir.
const DATA_JSON_PATH =
  process.argv.filter(a => !a.startsWith('-'))[2] || path.join(__dirname, '../../data.json');

// Boş/null olmayan herhangi bir cevap geçerlidir (F = iptal sorusu dahil)
function isValidAnswer(s: string): boolean {
  return s.trim().length > 0;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface JsonQuestion {
  soru_resmi?: string;
  dogru_cevap?: string;
  cozum?: string;
  konu?: string;
  alt_konu?: string;
  zorluk_seviyesi?: string;
}

interface DbRow {
  id: number;
  dogru_cevap: string;
  cozum: string | null;
  konu: string | null;
  alt_konu: string | null;
  zorluk_seviyesi: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalize(s: string | null | undefined): string {
  return (s ?? '').trim();
}

function normalizeAnswer(s: string | null | undefined): string {
  return normalize(s).toUpperCase();
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function syncWithReport() {
  if (!fs.existsSync(DATA_JSON_PATH)) {
    console.error(`❌ data.json bulunamadı: ${DATA_JSON_PATH}`);
    process.exit(1);
  }

  if (SKIP_ANSWERS) {
    console.log('ℹ️  --skip-answers modu: dogru_cevap güncellemesi ATLANACAK');
  }

  console.log(`📂 JSON okunuyor: ${DATA_JSON_PATH}`);
  const raw = fs.readFileSync(DATA_JSON_PATH, 'utf8');
  const items: JsonQuestion[] = JSON.parse(raw);
  console.log(`   ${items.length.toLocaleString()} kayıt yüklendi.\n`);

  const UPDATABLE_FIELDS = ['dogru_cevap', 'cozum', 'konu', 'alt_konu', 'zorluk_seviyesi'] as const;
  let updated = 0;
  let alreadyCorrect = 0;
  let notFound = 0;
  let noImage = 0;
  let invalidAnswerSkipped = 0;
  const fieldCounts: Record<string, number> = {};
  for (const f of UPDATABLE_FIELDS) fieldCounts[f] = 0;
  const notFoundList: string[] = [];
  const changedLog: { resmi: string; field: string; from: string; to: string }[] = [];
  const invalidAnswers: { resmi: string; value: string }[] = [];

  let connection: any;
  try {
    connection = await (pool as any).getConnection();

    let i = 0;
    for (const item of items) {
      i++;

      if (i % 1000 === 0) {
        process.stdout.write(`\r   İşleniyor: ${i.toLocaleString()} / ${items.length.toLocaleString()}...`);
      }

      if (!item.soru_resmi) { noImage++; continue; }

      const [rows]: [DbRow[], any] = await connection.query(
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

      // ── dogru_cevap ──────────────────────────────────────────────────────
      if (!SKIP_ANSWERS) {
        const jsonAnswer = normalizeAnswer(item.dogru_cevap);
        const dbAnswer = normalizeAnswer(db.dogru_cevap);

        if (!isValidAnswer(jsonAnswer)) {
          // Boş değer — yazma
          invalidAnswerSkipped++;
          if (invalidAnswers.length < 20) invalidAnswers.push({ resmi: item.soru_resmi, value: '(boş)' });
        } else if (jsonAnswer !== dbAnswer) {
          updates['dogru_cevap'] = jsonAnswer;
          fieldCounts['dogru_cevap']++;
          changedLog.push({ resmi: item.soru_resmi, field: 'dogru_cevap', from: dbAnswer, to: jsonAnswer });
        }
      }

      // ── Diğer alanlar ────────────────────────────────────────────────────
      const others = ['cozum', 'konu', 'alt_konu', 'zorluk_seviyesi'] as const;
      for (const field of others) {
        const jsonVal = normalize((item as any)[field]);
        const dbVal = normalize((db as any)[field]);
        if (jsonVal !== dbVal) {
          updates[field] = jsonVal;
          fieldCounts[field]++;
        }
      }

      if (Object.keys(updates).length === 0) { alreadyCorrect++; continue; }

      const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
      const values = [...Object.values(updates), db.id];
      await connection.query(`UPDATE questions SET ${setClauses} WHERE id = ?`, values);
      updated++;
    }

    process.stdout.write('\r' + ' '.repeat(70) + '\r');

    // ─── Rapor ──────────────────────────────────────────────────────────────
    console.log('═'.repeat(58));
    console.log('📊 SENKRONIZASYON RAPORU');
    if (SKIP_ANSWERS) console.log('   (dogru_cevap güncellemesi ATLANDI — --skip-answers modu)');
    console.log('═'.repeat(58));
    console.log(`✅ Güncellenen kayıt        : ${updated.toLocaleString()}`);
    console.log(`⏭️  Zaten doğru (atlanan)   : ${alreadyCorrect.toLocaleString()}`);
    console.log(`❓ DB'de bulunamayan        : ${notFound.toLocaleString()}`);
    console.log(`🖼️  Resim yolu eksik        : ${noImage.toLocaleString()}`);
    if (invalidAnswerSkipped > 0) {
      console.log(`🚫 Geçersiz cevap atlandı  : ${invalidAnswerSkipped} (A-E dışı, yazılmadı)`);
    }
    console.log('─'.repeat(58));
    console.log('📝 Alan bazlı güncelleme:');
    for (const f of UPDATABLE_FIELDS) {
      if (fieldCounts[f] > 0) {
        console.log(`   ${f.padEnd(22)}: ${fieldCounts[f]} kayıt`);
      }
    }

    if (changedLog.length > 0) {
      console.log('─'.repeat(58));
      console.log(`🔑 Değişen dogru_cevap (ilk ${Math.min(changedLog.length, 10)}):`);
      for (const c of changedLog.slice(0, 10)) {
        console.log(`   "${c.resmi}"`);
        console.log(`      "${c.from || '(boş)'}" → "${c.to}"`);
      }
    }

    if (invalidAnswers.length > 0) {
      console.log('─'.repeat(58));
      console.log(`🚫 Geçersiz cevap içeren kayıtlar (ilk ${invalidAnswers.length}):`);
      for (const ia of invalidAnswers) {
        console.log(`   "${ia.resmi}" → değer: "${ia.value}"`);
      }
    }

    if (notFoundList.length > 0) {
      console.log('─'.repeat(58));
      console.log(`⚠️  DB'de bulunamayan (ilk ${notFoundList.length}):`);
      for (const r of notFoundList) console.log(`   ${r}`);
    }

    // ─── Veritabanındaki Fazla Soruları Silme ─────────────
    if (!NO_DELETE) {
      console.log('\n🗑️  data.json\'da olmayan eski sorular tespit ediliyor...');
      const validImages = new Set(items.map(q => q.soru_resmi).filter(Boolean));

      const [allDbRows]: [{ id: number; soru_resmi: string }[], any] = await connection.query(
        'SELECT id, soru_resmi FROM questions'
      );

      const toDeleteIds: number[] = [];

      for (const dbRow of allDbRows) {
        if (dbRow.soru_resmi && !validImages.has(dbRow.soru_resmi)) {
          toDeleteIds.push(dbRow.id);
        }
      }

      if (toDeleteIds.length > 0) {
        console.log(`   💡 DB'de olup JSON'da bulunmayan ${toDeleteIds.length} soru siliniyor...`);
        // chunk halinde sil
        const chunkSize = 100;
        for (let idx = 0; idx < toDeleteIds.length; idx += chunkSize) {
          const chunk = toDeleteIds.slice(idx, idx + chunkSize);
          await connection.query('DELETE FROM questions WHERE id IN (?)', [chunk]);
        }
        console.log(`   🗑️  ${toDeleteIds.length} adet atıl soru veritabanından silindi.`);
      } else {
        console.log('   ✅ Veritabanında atıl/silinmesi gereken soru bulunmadı.');
      }
    } else {
      console.log('\n⏭️  --no-delete flag\'i algılandı: DB\'de olup JSON\'da olmayan sorular silinmedi.');
    }

    console.log('═'.repeat(58));
    console.log('🏁 Senkronizasyon tamamlandı.');

  } catch (err) {
    console.error('❌ Hata:', err);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

syncWithReport();

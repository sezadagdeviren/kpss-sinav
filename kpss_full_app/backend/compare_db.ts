/**
 * compare_db.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * data.json ↔ MySQL karşılaştırma (READ-ONLY, hiçbir şeyi değiştirmez).
 *
 * Çalıştır:
 *   npm run compare
 *   veya: npx ts-node compare_db.ts [/path/to/data.json]
 */

import fs from 'fs';
import path from 'path';
import pool from './db';

const DATA_JSON_PATH =
  process.argv[2] || path.join(__dirname, '../../data.json');

interface JsonQuestion {
  soru_resmi?: string;
  dogru_cevap?: string;
  cozum?: string;
  konu?: string;
  alt_konu?: string;
  zorluk_seviyesi?: string;
  kategori?: string;
  sinav_turu?: string;
  yil?: string | number;
  soru_no?: string | number;
}

interface DbRow {
  id: number;
  dogru_cevap: string;
  cozum: string | null;
  konu: string | null;
  alt_konu: string | null;
  zorluk_seviyesi: string | null;
}

type Diff = {
  soru_resmi: string;
  field: string;
  json: string;
  db: string;
};

function normalize(s: string | null | undefined): string {
  return (s ?? '').trim();
}

function normalizeAnswer(s: string | null | undefined): string {
  return normalize(s).toUpperCase();
}

async function compare() {
  if (!fs.existsSync(DATA_JSON_PATH)) {
    console.error(`❌ data.json bulunamadı: ${DATA_JSON_PATH}`);
    process.exit(1);
  }

  console.log(`📂 JSON okunuyor: ${DATA_JSON_PATH}`);
  const raw = fs.readFileSync(DATA_JSON_PATH, 'utf8');
  const items: JsonQuestion[] = JSON.parse(raw);
  console.log(`   ${items.length.toLocaleString()} kayıt yüklendi.\n`);

  const FIELDS = ['dogru_cevap', 'cozum', 'konu', 'alt_konu', 'zorluk_seviyesi'] as const;

  let matched = 0;
  let notFound = 0;
  let noImage = 0;
  let diffCount = 0;
  const diffs: Diff[] = [];
  const notFoundList: string[] = [];
  const fieldCounts: Record<string, number> = {};
  for (const f of FIELDS) fieldCounts[f] = 0;

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
        if (notFoundList.length < 30) notFoundList.push(item.soru_resmi);
        continue;
      }

      const db = rows[0];
      let hasDiff = false;

      // dogru_cevap karşılaştır (büyük harf normalize)
      const jsonAnswer = normalizeAnswer(item.dogru_cevap);
      const dbAnswer   = normalizeAnswer(db.dogru_cevap);
      if (jsonAnswer !== dbAnswer) {
        hasDiff = true;
        fieldCounts['dogru_cevap']++;
        diffs.push({ soru_resmi: item.soru_resmi, field: 'dogru_cevap', json: jsonAnswer, db: dbAnswer });
      }

      const others = ['cozum', 'konu', 'alt_konu', 'zorluk_seviyesi'] as const;
      for (const field of others) {
        const jsonVal = normalize((item as any)[field]);
        const dbVal   = normalize((db as any)[field]);
        if (jsonVal !== dbVal) {
          hasDiff = true;
          fieldCounts[field]++;
          // cozum için sadece ilk 80 karakteri göster (çok uzun olabilir)
          const jsonShow = field === 'cozum' ? jsonVal.slice(0, 80) + (jsonVal.length > 80 ? '…' : '') : jsonVal;
          const dbShow   = field === 'cozum' ? dbVal.slice(0, 80)   + (dbVal.length   > 80 ? '…' : '') : dbVal;
          diffs.push({ soru_resmi: item.soru_resmi, field, json: jsonShow, db: dbShow });
        }
      }

      if (hasDiff) diffCount++;
      else matched++;
    }

    process.stdout.write('\r' + ' '.repeat(70) + '\r');

    // ─── Rapor ──────────────────────────────────────────────────────────────
    const allOk = diffCount === 0 && notFound === 0;

    console.log('═'.repeat(60));
    console.log('🔍 KARŞILAŞTIRMA RAPORU (READ-ONLY — hiçbir şey değiştirilmedi)');
    console.log('═'.repeat(60));
    console.log(`✅ Tamamen eşleşen       : ${matched.toLocaleString()}`);
    console.log(`❌ Farklı kayıt sayısı   : ${diffCount.toLocaleString()}`);
    console.log(`❓ DB'de bulunamayan     : ${notFound.toLocaleString()}`);
    console.log(`🖼️  Resim yolu eksik     : ${noImage.toLocaleString()}`);
    console.log('─'.repeat(60));

    if (Object.values(fieldCounts).some(v => v > 0)) {
      console.log('📝 Alan bazlı fark özeti:');
      for (const f of FIELDS) {
        if (fieldCounts[f] > 0) {
          console.log(`   ${f.padEnd(20)}: ${fieldCounts[f]} kayıt farklı`);
        }
      }
      console.log('─'.repeat(60));
    }

    if (diffs.length > 0) {
      const answerDiffs = diffs.filter(d => d.field === 'dogru_cevap');
      if (answerDiffs.length > 0) {
        console.log(`🔑 FARKLI DOĞRU CEVAPLAR (${answerDiffs.length} adet):`);
        for (const d of answerDiffs) {
          console.log(`   ${d.soru_resmi}`);
          console.log(`      JSON: "${d.json}"  ←→  DB: "${d.db}"`);
        }
        console.log('─'.repeat(60));
      }

      const otherDiffs = diffs.filter(d => d.field !== 'dogru_cevap' && d.field !== 'cozum');
      if (otherDiffs.length > 0) {
        const shown = otherDiffs.slice(0, 20);
        console.log(`📋 DİĞER FARKLAR (${otherDiffs.length} adet, ilk ${shown.length} gösteriliyor):`);
        for (const d of shown) {
          console.log(`   [${d.field}] ${d.soru_resmi}`);
          console.log(`      JSON: "${d.json}"`);
          console.log(`      DB  : "${d.db}"`);
        }
        console.log('─'.repeat(60));
      }

      const cozumDiffs = diffs.filter(d => d.field === 'cozum');
      if (cozumDiffs.length > 0) {
        console.log(`📄 FARKLI ÇÖZÜMLER (${cozumDiffs.length} adet) — sadece soru_resmi listesi:`);
        for (const d of cozumDiffs.slice(0, 20)) {
          console.log(`   ${d.soru_resmi}`);
        }
        if (cozumDiffs.length > 20) console.log(`   ... ve ${cozumDiffs.length - 20} tane daha`);
        console.log('─'.repeat(60));
      }
    }

    if (notFoundList.length > 0) {
      console.log(`⚠️  DB'de bulunamayan kayıtlar (ilk ${notFoundList.length}):`);
      for (const r of notFoundList) console.log(`   ${r}`);
      console.log('─'.repeat(60));
    }

    console.log('═'.repeat(60));
    if (allOk) {
      console.log('🎉 SONUÇ: data.json ve veritabanı TAMAMEN EŞLEŞİYOR!');
    } else {
      console.log(`⚠️  SONUÇ: ${diffCount} farklı kayıt var. "npm run sync" ile düzeltebilirsiniz.`);
    }
    console.log('═'.repeat(60));

  } catch (err) {
    console.error('❌ Hata:', err);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

compare();

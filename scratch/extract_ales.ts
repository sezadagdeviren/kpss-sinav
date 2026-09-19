import fs from 'fs';
import path from 'path';
import pool from '../kpss_full_app/backend/db';

const ALES_DIR = path.join(__dirname, '../tüm sınavlar/Ales');
const DATA_JSON_PATH = path.join(__dirname, '../data.json');

interface QuestionItem {
  yil: string;
  soru_no: string;
  dogru_cevap: string;
  kategori: string;
  soru_resmi: string;
  sinav_turu: string;
  konu?: string;
  alt_konu?: string;
  zorluk_seviyesi?: string;
  cozum?: string;
}

function findCevaplarJson(dir: string): Record<string, string> | null {
  const jsonPath = path.join(dir, 'cevaplar.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const content = fs.readFileSync(jsonPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  return null;
}

function scanDir(currentDir: string, relativePath: string, results: QuestionItem[]) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  const cevaplarMap = findCevaplarJson(currentDir);

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      scanDir(fullPath, relPath, results);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
      // Örnek relPath: Ales/2024/2024-1/Sozel/Soru_1.png
      // veya Ales/2018/Sayisal/Soru_1.png
      const parts = relPath.split(path.sep); // ['Ales', '2024', '2024-1', 'Sozel', 'Soru_1.png']

      let yil = '';
      let kategori = '';
      const filename = entry.name; // Soru_1.png

      const matchSoruNo = filename.match(/\d+/);
      if (!matchSoruNo) continue;
      const soruNo = matchSoruNo[0];

      // Kategori ve Yıl tespiti
      if (parts.length >= 4) {
        // En içteki klasör kategori (Sozel / Sayisal)
        kategori = parts[parts.length - 2];
        // Bir üstteki klasör dönem veya yıl
        yil = parts[parts.length - 3];
      }

      let dogruCevap = '';
      if (cevaplarMap) {
        // "Soru_1", "soru_1", "1", "Soru 1" gibi key'ler
        const keysToTry = [
          `Soru_${soruNo}`,
          `soru_${soruNo}`,
          `Soru ${soruNo}`,
          `soru ${soruNo}`,
          soruNo,
          `Soru_${soruNo.padStart(2, '0')}`
        ];

        for (const k of keysToTry) {
          if (cevaplarMap[k]) {
            dogruCevap = cevaplarMap[k].trim().toUpperCase();
            break;
          }
        }
      }

      if (!dogruCevap) dogruCevap = 'A'; // Varsayılan/boş kalmasın

      results.push({
        yil,
        soru_no: soruNo,
        dogru_cevap: dogruCevap,
        kategori,
        soru_resmi: relPath.replace(/\\/g, '/'),
        sinav_turu: 'ALES'
      });
    }
  }
}

async function run() {
  console.log('🔍 Ales klasörü taranıyor...');
  const newQuestions: QuestionItem[] = [];
  scanDir(ALES_DIR, 'Ales', newQuestions);

  console.log(`✅ Toplam ${newQuestions.length} ALES sorusu görüntüsü tespit edildi.`);

  if (!fs.existsSync(DATA_JSON_PATH)) {
    console.error('❌ data.json bulunamadı');
    process.exit(1);
  }

  const existingData: any[] = JSON.parse(fs.readFileSync(DATA_JSON_PATH, 'utf8'));
  console.log(`📂 Mevcut data.json soru sayısı: ${existingData.length}`);

  const existingMap = new Map<string, any>();
  for (const item of existingData) {
    if (item.soru_resmi) {
      existingMap.set(item.soru_resmi, item);
    }
  }

  let added = 0;
  let updated = 0;

  for (const q of newQuestions) {
    if (existingMap.has(q.soru_resmi)) {
      // Mevcut veride eksik alanlar varsa güncelle
      const current = existingMap.get(q.soru_resmi);
      current.sinav_turu = 'ALES';
      if (!current.dogru_cevap || current.dogru_cevap === '') current.dogru_cevap = q.dogru_cevap;
      if (!current.yil) current.yil = q.yil;
      if (!current.kategori) current.kategori = q.kategori;
      updated++;
    } else {
      existingData.push(q);
      existingMap.set(q.soru_resmi, q);
      added++;
    }
  }

  console.log(`➕ Yeni eklenen ALES sorusu: ${added}`);
  console.log(`🔄 Güncellenen ALES sorusu: ${updated}`);
  console.log(`📊 Yeni data.json toplam soru sayısı: ${existingData.length}`);

  fs.writeFileSync(DATA_JSON_PATH, JSON.stringify(existingData, null, 2), 'utf8');
  console.log('💾 data.json başarıyla kaydedildi.');
}

run();

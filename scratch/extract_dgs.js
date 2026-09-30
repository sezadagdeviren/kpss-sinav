const fs = require('fs');
const path = require('path');

const DGS_DIR = path.join(__dirname, '../tüm sınavlar/DGS');
const DATA_JSON_PATH = path.join(__dirname, '../data.json');

function findCevaplarJson(dir) {
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

function scanDir(currentDir, relativePath, results) {
  if (!fs.existsSync(currentDir)) return;
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  const cevaplarMap = findCevaplarJson(currentDir);

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      scanDir(fullPath, relPath, results);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
      const parts = relPath.split(path.sep);

      let yil = '';
      let kategori = '';
      const filename = entry.name;

      const matchSoruNo = filename.match(/\d+/);
      if (!matchSoruNo) continue;
      const soruNo = matchSoruNo[0];

      // Örnek relPath: DGS/Sozel/2024/soru_1.png veya DGS/Sayisal/2020/soru_10.png
      if (parts.length >= 4) {
        kategori = parts[1]; // Sozel / Sayisal
        yil = parts[2];      // 2024
      }

      let dogruCevap = '';
      if (cevaplarMap) {
        const keysToTry = [
          `soru_${soruNo}`,
          `Soru_${soruNo}`,
          `Soru ${soruNo}`,
          `soru ${soruNo}`,
          soruNo,
          `soru_${soruNo.padStart(2, '0')}`,
          `Soru_${soruNo.padStart(2, '0')}`
        ];

        for (const k of keysToTry) {
          if (cevaplarMap[k]) {
            dogruCevap = cevaplarMap[k].trim().toUpperCase();
            break;
          }
        }
      }

      if (!dogruCevap) dogruCevap = 'A';

      results.push({
        yil,
        soru_no: soruNo,
        dogru_cevap: dogruCevap,
        kategori,
        soru_resmi: relPath.replace(/\\/g, '/'),
        sinav_turu: 'DGS'
      });
    }
  }
}

function run() {
  console.log('🔍 DGS klasörü taranıyor...');
  const newQuestions = [];
  scanDir(DGS_DIR, 'DGS', newQuestions);

  console.log(`✅ Toplam ${newQuestions.length} DGS sorusu resmi bulundu.`);

  if (!fs.existsSync(DATA_JSON_PATH)) {
    console.error('❌ data.json bulunamadı');
    process.exit(1);
  }

  const existingData = JSON.parse(fs.readFileSync(DATA_JSON_PATH, 'utf8'));
  console.log(`📂 Mevcut data.json soru sayısı: ${existingData.length.toLocaleString()}`);

  const existingMap = new Map();
  for (const item of existingData) {
    if (item.soru_resmi) {
      existingMap.set(item.soru_resmi, item);
    }
  }

  let added = 0;
  let updated = 0;

  for (const q of newQuestions) {
    if (existingMap.has(q.soru_resmi)) {
      const current = existingMap.get(q.soru_resmi);
      current.sinav_turu = 'DGS';
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

  console.log(`➕ Yeni eklenen DGS sorusu: ${added.toLocaleString()}`);
  console.log(`🔄 Güncellenen DGS sorusu: ${updated.toLocaleString()}`);
  console.log(`📊 Yeni data.json toplam soru sayısı: ${existingData.length.toLocaleString()}`);

  fs.writeFileSync(DATA_JSON_PATH, JSON.stringify(existingData, null, 2), 'utf8');
  console.log('💾 data.json başarıyla güncellendi.');
}

run();

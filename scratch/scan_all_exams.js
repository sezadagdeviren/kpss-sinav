const fs = require('fs');
const path = require('path');

const TUM_SINAVLAR_DIR = path.join(__dirname, '../tüm sınavlar');
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

      // Örnek relPath:
      // Lisans/Tarih/2025/soru_1.png -> sinav_turu: Lisans, kategori: Tarih, yil: 2025
      // Ales/2026/2026-1/Sozel/Soru_1.png -> sinav_turu: ALES, yil: 2026-1, kategori: Sozel
      // DGS/Sozel/2024/soru_1.png -> sinav_turu: DGS, kategori: Sozel, yil: 2024
      // Ekpss/Lisans/Tarih/2024/soru_1.png -> sinav_turu: Ekpss-Lisans, kategori: Tarih
      // Hakimlik/2024/soru_1.png -> sinav_turu: Hakimlik, yil: 2024

      let sinavTuru = parts[0];
      let kategori = 'Genel';
      let yil = '2024';

      const filename = entry.name;
      const matchSoruNo = filename.match(/\d+/);
      if (!matchSoruNo) continue;
      const soruNo = matchSoruNo[0];

      if (sinavTuru.toLowerCase() === 'ales') {
        sinavTuru = 'ALES';
        if (parts.length >= 4) {
          kategori = parts[parts.length - 2];
          yil = parts[parts.length - 3];
        }
      } else if (sinavTuru.toLowerCase() === 'dgs') {
        sinavTuru = 'DGS';
        if (parts.length >= 4) {
          kategori = parts[1];
          yil = parts[2];
        }
      } else if (sinavTuru.toLowerCase() === 'ekpss') {
        // Ekpss/Lisans/Tarih/2024/soru_1.png -> sinav_turu: Ekpss-Lisans
        if (parts.length >= 5) {
          sinavTuru = `Ekpss-${parts[1]}`;
          kategori = parts[2];
          yil = parts[3];
        } else if (parts.length >= 4) {
          sinavTuru = `Ekpss-${parts[1]}`;
          kategori = parts[2];
        }
      } else {
        // Klasik yapı veya Adalet / Hakimlik / Kaymakamlık / Sayıştay / Lisans / Onlisans / Ortaogretim / AGS
        if (parts.length === 4) {
          // Örn: Lisans/Tarih/2025/soru_1.png
          kategori = parts[1];
          yil = parts[2];
        } else if (parts.length === 3) {
          // Örn: Hakimlik/2024/soru_1.png
          kategori = 'Genel Kültür';
          yil = parts[1];
        } else if (parts.length >= 5) {
          kategori = parts[parts.length - 3];
          yil = parts[parts.length - 2];
        }
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
        sinav_turu: sinavTuru
      });
    }
  }
}

function run() {
  console.log('🔍 tüm sınavlar klasörü taranıyor...');
  const scannedQuestions = [];

  const rootEntries = fs.readdirSync(TUM_SINAVLAR_DIR, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (entry.isDirectory()) {
      scanDir(path.join(TUM_SINAVLAR_DIR, entry.name), entry.name, scannedQuestions);
    }
  }

  console.log(`✅ Taramada toplam ${scannedQuestions.length.toLocaleString()} soru resmi bulundu.`);

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

  for (const q of scannedQuestions) {
    if (existingMap.has(q.soru_resmi)) {
      const current = existingMap.get(q.soru_resmi);
      if (!current.sinav_turu) current.sinav_turu = q.sinav_turu;
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

  console.log(`➕ Yeni eklenen soru: ${added.toLocaleString()}`);
  console.log(`🔄 Güncellenen soru: ${updated.toLocaleString()}`);
  console.log(`📊 Yeni data.json toplam soru sayısı: ${existingData.length.toLocaleString()}`);

  fs.writeFileSync(DATA_JSON_PATH, JSON.stringify(existingData, null, 2), 'utf8');
  console.log('💾 data.json başarıyla güncellendi.');
}

run();

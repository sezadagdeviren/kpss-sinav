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

      /**
       * Klasör yapıları:
       * Lisans/Ders/Yil/Soru_X.png           -> parts.length=4
       * Ortaogretim/Ders/Yil/Soru_X.png      -> parts.length=4
       * Onlisans/Ders/Yil/Soru_X.png         -> parts.length=4
       * AGS/Ders/Yil/Soru_X.png              -> parts.length=4
       * 
       * Ales/YIL/SINAV_ADI/KATEGORI/Soru_X.png -> parts.length=5
       * DGS/KATEGORI/YIL/Soru_X.png            -> parts.length=4
       * 
       * YENİ FORMAT (yıl önce, ders sonra):
       * Adalet/YIL/DERS/Soru_X.png           -> parts.length=4
       * Hakimlik/YIL/DERS/Soru_X.png         -> parts.length=4
       * Kaymakamlık/YIL/DERS/Soru_X.png      -> parts.length=4
       * Sayıştay/YIL/DERS/Soru_X.png         -> parts.length=4
       * Ekpss/Lisans/YIL/DERS/Soru_X.png     -> parts.length=5
       */

      let sinavTuru = parts[0];
      let kategori = 'Genel';
      let yil = '2024';

      const filename = entry.name;
      const matchSoruNo = filename.match(/\d+/);
      if (!matchSoruNo) continue;
      const soruNo = matchSoruNo[0];

      const normTur = sinavTuru.toLowerCase();

      if (normTur === 'ales') {
        // Ales/2026/2026-1/Sozel/Soru_1.png -> sinav_turu: ALES, yil: 2026-1, kategori: Sozel
        sinavTuru = 'ALES';
        if (parts.length >= 4) {
          kategori = parts[parts.length - 2];
          yil = parts[parts.length - 3];
        }
      } else if (normTur === 'dgs') {
        // DGS/Sozel/2024/soru_1.png
        sinavTuru = 'DGS';
        if (parts.length >= 4) {
          kategori = parts[1];
          yil = parts[2];
        }
      } else if (normTur === 'ekpss') {
        // Ekpss/Lisans/2024/Ders/soru_1.png -> sinav_turu: Ekpss-Lisans, yil: 2024, kategori: Ders
        if (parts.length >= 5) {
          sinavTuru = `Ekpss-${parts[1]}`;
          yil = parts[2];
          kategori = parts[3];
        } else if (parts.length >= 4) {
          sinavTuru = `Ekpss-${parts[1]}`;
          yil = parts[2];
          kategori = 'Genel';
        }
      } else if (['adalet', 'hakimlik', 'kaymakamlık', 'kaymakamlik', 'sayıştay', 'sayistay'].includes(normTur)) {
        // YENİ FORMAT: TürAdı/YIL/DERS/Soru_X.png
        if (parts.length >= 4) {
          yil = parts[1];
          kategori = parts[2];
        } else if (parts.length === 3) {
          yil = parts[1];
          kategori = 'Genel';
        }
      } else {
        // Klasik: Lisans/Ders/Yil/Soru_X.png veya AGS/Ders/Yil/...
        if (parts.length === 4) {
          kategori = parts[1];
          yil = parts[2];
        } else if (parts.length === 3) {
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

        // cevaplar.json iç içe (ders bazlı) ise
        if (!dogruCevap && typeof cevaplarMap === 'object') {
          for (const dersKey of Object.keys(cevaplarMap)) {
            if (typeof cevaplarMap[dersKey] === 'object' &&
                (dersKey.toLowerCase() === kategori.toLowerCase() || parts.includes(dersKey))) {
              const innerMap = cevaplarMap[dersKey];
              for (const k of keysToTry) {
                if (innerMap[k]) {
                  dogruCevap = innerMap[k].trim().toUpperCase();
                  break;
                }
              }
              if (dogruCevap) break;
            }
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

  // Örnek kontrol — her sınav türü için 1 örnek göster
  const samplePerType = {};
  for (const q of scannedQuestions) {
    if (!samplePerType[q.sinav_turu]) samplePerType[q.sinav_turu] = q;
  }
  console.log('\n📋 Sınav türü bazında örnekler:');
  for (const [tur, q] of Object.entries(samplePerType)) {
    console.log(`  [${tur}] yil=${q.yil}, kategori=${q.kategori}, resmi=${q.soru_resmi}`);
  }
  console.log('');

  // SORU: Yıl alanı gerçekten 4 haneli rakam mı?
  const badYil = scannedQuestions.filter(q => !/^[0-9]{4}(-\d+)?$/.test(String(q.yil)));
  if (badYil.length > 0) {
    console.warn(`⚠️  Yıl alanı hatalı ${badYil.length} kayıt var. Örnek:`, badYil[0]);
  } else {
    console.log('✅ Tüm yıl alanları doğru formatında.');
  }

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
      // Mevcut kaydı güncelle (yil/kategori yanlışsa düzelt)
      const current = existingMap.get(q.soru_resmi);
      current.sinav_turu = q.sinav_turu;
      current.dogru_cevap = q.dogru_cevap || current.dogru_cevap;
      current.yil = q.yil;
      current.kategori = q.kategori;
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

/**
 * sync_datasets.js
 * 
 * data.json'daki konu, alt_konu ve cozum bilgilerini
 * ilgili dataset dosyalarına (Genel_Kultur, Turkce, Matematik) aktarır.
 * 
 * Kullanım: node sync_datasets.js
 */

const fs = require('fs');
const path = require('path');

const HUB_DIR = path.join(__dirname, '../../kpss_hub');
const DATA_PATH = path.join(HUB_DIR, 'data.json');

const DATASET_FILES = [
  'Genel_Kultur_2006_2025_Full_Dataset.json',
  'Turkce_2006_2025_Full_Dataset.json',
  'Matematik_2006_2025_Full_Dataset.json'
];

// data.json'u yükle
console.log('📡 data.json okunuyor...');
const sourceData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

// Hızlı arama için lookup map oluştur (yil-soru_no-kategori -> kayıt)
const lookupMap = new Map();
sourceData.forEach(item => {
  let cat = item.kategori;
  if (cat === 'Anayasa') cat = 'Vatandaşlık';
  const key = `${item.yil}-${item.soru_no}-${cat}`;
  lookupMap.set(key, item);
});

console.log(`📦 data.json: ${sourceData.length} kayıt yüklendi.\n`);

let totalUpdated = 0;

DATASET_FILES.forEach(fileName => {
  const filePath = path.join(HUB_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${fileName} bulunamadı, atlanıyor.`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updated = 0;

  data.forEach(q => {
    let cat = q.kategori;
    if (cat === 'Anayasa') cat = 'Vatandaşlık';
    const key = `${q.yil}-${q.soru_no}-${cat}`;
    const source = lookupMap.get(key);

    if (source) {
      if (source.konu) q.konu = source.konu;
      if (source.alt_konu) q.alt_konu = source.alt_konu;
      if (source.cozum) q.cozum = source.cozum;
      updated++;
    }
  });

  if (updated > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    console.log(`✅ ${fileName}: ${updated} soru güncellendi.`);
    totalUpdated += updated;
  } else {
    console.log(`➖ ${fileName}: Güncellenecek kayıt bulunamadı.`);
  }
});

console.log(`\n🏁 Toplam ${totalUpdated} soru, dataset dosyalarına senkronize edildi.`);

const fs = require('fs');

const files = [
  '/Users/seza/Desktop/kpss_sinav/kpss_hub/Genel_Kultur_2006_2025_Full_Dataset.json',
  '/Users/seza/Desktop/kpss_sinav/kpss_hub/Matematik_2006_2025_Full_Dataset.json',
  '/Users/seza/Desktop/kpss_sinav/kpss_hub/Turkce_2006_2025_Full_Dataset.json'
];

let totalFixed = 0;

files.forEach(file => {
  let data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let fixed = 0;
  data.forEach(q => {
    if (!q.dogru_cevap || !/^[A-E]$/.test(q.dogru_cevap)) {
      if (q.dogru_cevap && /^[a-e]$/.test(q.dogru_cevap)) {
        q.dogru_cevap = q.dogru_cevap.toUpperCase();
        fixed++;
      } else if (q.cozum) {
        const match = q.cozum.match(/Doğru cevap ([A-Ea-e])/);
        if (match) {
          q.dogru_cevap = match[1].toUpperCase();
          fixed++;
        }
      }
    }
  });
  if (fixed > 0) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
    console.log(`Fixed ${fixed} answers in ${file}`);
    totalFixed += fixed;
  }
});
console.log('Total fixed in JSON:', totalFixed);

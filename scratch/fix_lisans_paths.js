const fs = require('fs');
const path = require('path');

const dataPath = '/Users/seza/Desktop/kpss_sinav/data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let count = 0;
data.forEach(q => {
  if (q.sinav_turu === 'Lisans') {
    if (!q.soru_resmi.startsWith('Lisans/')) {
      q.soru_resmi = 'Lisans/' + q.soru_resmi;
      count++;
    }
  }
});

console.log(`Will fix ${count} question image paths in data.json.`);

if (count > 0) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Saved data.json successfully.');
}

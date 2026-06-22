const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('/Users/seza/Desktop/kpss_sinav/data.json', 'utf8'));

const samples = {};
data.forEach(q => {
  const key = `${q.sinav_turu}_${q.kategori}`;
  if (!samples[key]) {
    samples[key] = q.soru_resmi;
  }
});
console.log('Sample soru_resmi values per exam type and category:');
console.log(samples);

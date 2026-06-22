const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('/Users/seza/Desktop/kpss_sinav/data.json', 'utf8'));
const lisansQuestions = data.filter(q => q.sinav_turu === 'Lisans');

const samples = {};
lisansQuestions.forEach(q => {
  if (!samples[q.kategori]) {
    samples[q.kategori] = q.soru_resmi;
  }
});
console.log('Sample soru_resmi values for Lisans:', samples);

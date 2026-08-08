import Tesseract from 'tesseract.js';
import path from 'path';

const imagePath = 'c:\\Users\\oelahmadi\\Documents\\claude\\banquesys\\mock_cnie.png';

console.log('Starting OCR on:', imagePath);
Tesseract.recognize(
  imagePath,
  'fra+eng'
).then(({ data: { text } }) => {
  console.log('--- EXTRACTED TEXT START ---');
  console.log(text);
  console.log('--- EXTRACTED TEXT END ---');
  
  // Test regexes
  const cnieRegex = /\b([A-Z]{1,2}\d{5,7})\b/i;
  const cnieMatch = text.match(cnieRegex);
  console.log('CNIE Match:', cnieMatch ? cnieMatch[1] : 'null');

  const passRegex = /\b([A-Z]{2}\d{7})\b/i;
  const passMatch = text.match(passRegex);
  console.log('PASSPORT Match:', passMatch ? passMatch[1] : 'null');
  
  process.exit(0);
}).catch(err => {
  console.error('OCR Error:', err);
  process.exit(1);
});

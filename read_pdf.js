const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const filePath = path.join(__dirname, 'docs/MODULOS FISCAL E CONTABIL/ACPROBEC_Modulos_Complementares.pdf');
const fileBuffer = fs.readFileSync(filePath);
const data = new Uint8Array(fileBuffer);

// PDFParse constructor accepts pdfjs-dist getDocument options — pass `data` directly
const parser = new PDFParse({ verbosity: -1, data });

parser.load().then(async () => {
  const result = await parser.getText();
  const text = result.pages.map(p => p.text).join('\n');
  fs.writeFileSync('complementar_text.txt', text, { encoding: 'utf8' });
  console.log('Done. Pages:', result.pages.length, '| Chars:', text.length);
}).catch(err => {
  console.error('Error:', err.message);
});

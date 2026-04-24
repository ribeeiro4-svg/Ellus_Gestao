const fs = require('fs');
const pdfParse = require('pdf-parse');

console.log('Type:', typeof pdfParse);
if (typeof pdfParse === 'function') {
  let dataBuffer = fs.readFileSync('docs/MODULOS FISCAL E CONTABIL/ACPROBEC_Plano_Evolucao_v3.pdf');
  pdfParse(dataBuffer).then(data => {
    console.log(data.text);
  }).catch(err => console.error(err));
} else if (pdfParse.default) {
  let dataBuffer = fs.readFileSync('docs/MODULOS FISCAL E CONTABIL/ACPROBEC_Plano_Evolucao_v3.pdf');
  pdfParse.default(dataBuffer).then(data => {
    console.log(data.text);
  }).catch(err => console.error(err));
} else {
  console.log('Keys:', Object.keys(pdfParse));
}

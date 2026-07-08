const xlsx = require('xlsx');

const workbook = xlsx.readFile('docs/ACPROBEC_Mensalidades_Vencidas_Jun2026.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

for (let i = 0; i < 10; i++) {
  console.log(`Row ${i}:`, data[i]);
}

const xlsx = require('xlsx'); 
const workbook = xlsx.readFile('docs/ACPROBEC_Rotina_Tesoureiro.xlsx'); 
const result = {}; 
workbook.SheetNames.forEach(sheetName => { 
  result[sheetName] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 1}); 
}); 
console.log(JSON.stringify(result, null, 2));

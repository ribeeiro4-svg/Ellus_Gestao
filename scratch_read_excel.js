const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'docs', 'ZapSign_Documents_2026_07_03.xlsx');
const workbook = xlsx.readFile(filePath);
console.log('Sheets:', workbook.SheetNames);
if (workbook.SheetNames.length > 1) {
    const sheet2 = workbook.Sheets[workbook.SheetNames[1]];
    const data2 = xlsx.utils.sheet_to_json(sheet2);
    if (data2.length > 0) {
        console.log('Columns sheet 2:', Object.keys(data2[0]));
        console.log('First row sheet 2:', data2[0]);
    }
}

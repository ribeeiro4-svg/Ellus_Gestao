const fs = require('fs');
const path = require('path');

const ofxPath = path.join('c:', 'GRUPO ÁUREA', 'DEV', 'InovacontACPROBEC', 'docs', 'associacao-colaborativa-de-profissionais-liberais-comercio-e-setor-de-beleza_01042026_a_30042026_be64fa9a.ofx');
const content = fs.readFileSync(ofxPath, 'utf-8');

const transactions = [];
const stmtRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
let match;

while ((match = stmtRegex.exec(content)) !== null) {
  const trn = match[1];
  const type = (trn.match(/<TRNTYPE>(.*?)<\/TRNTYPE>/) || [])[1];
  const amount = parseFloat((trn.match(/<TRNAMT>(.*?)<\/TRNAMT>/) || [])[1]);
  const memo = (trn.match(/<MEMO>(.*?)<\/MEMO>/) || [])[1];
  const date = (trn.match(/<DTPOSTED>(.*?)<\/DTPOSTED>/) || [])[1];

  transactions.push({ type, amount, memo, date });
}

let totalCredit = 0;
let totalDebit = 0;
let countCredit = 0;
let countDebit = 0;

transactions.forEach(t => {
  if (t.amount > 0) {
    totalCredit += t.amount;
    countCredit++;
  } else {
    totalDebit += Math.abs(t.amount);
    countDebit++;
  }
});

console.log('--- OFX AUDIT ---');
console.log(`Total Transactions: ${transactions.length}`);
console.log(`Credits: ${countCredit} | Total: R$ ${totalCredit.toFixed(2)}`);
console.log(`Debits: ${countDebit} | Total: R$ ${totalDebit.toFixed(2)}`);
console.log(`Balance Change: R$ ${(totalCredit - totalDebit).toFixed(2)}`);

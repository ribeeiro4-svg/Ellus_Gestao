import fs from 'fs';

const ofxPath = 'docs/associacao-colaborativa-de-profissionais-liberais-comercio-e-setor-de-beleza_01042026_a_30042026_ac0df6e7.ofx';
const content = fs.readFileSync(ofxPath, 'utf8');

const transactions = content.split('<STMTTRN>');
let totalCredit = 0;
let totalDebit = 0;
let creditCount = 0;
let debitCount = 0;

transactions.forEach(tr => {
    if (!tr.includes('</STMTTRN>')) return;
    
    const typeMatch = tr.match(/<TRNTYPE>(.*?)<\/TRNTYPE>/);
    const amtMatch = tr.match(/<TRNAMT>(.*?)<\/TRNAMT>/);
    const dateMatch = tr.match(/<DTPOSTED>(.*?)<\/DTPOSTED>/);
    
    if (typeMatch && amtMatch && dateMatch) {
        const type = typeMatch[1];
        const amount = parseFloat(amtMatch[1]);
        const date = dateMatch[1];
        
        // Filter for April 2026
        if (date.startsWith('202604')) {
            if (type === 'CREDIT' || amount > 0) {
                totalCredit += amount;
                creditCount++;
            } else if (type === 'DEBIT' || amount < 0) {
                totalDebit += amount;
                debitCount++;
            }
        }
    }
});

console.log('--- OFX SUMMARY (APRIL 2026) ---');
console.log(`Total Credits: R$ ${totalCredit.toFixed(2)} (${creditCount} transações)`);
console.log(`Total Debits: R$ ${totalDebit.toFixed(2)} (${debitCount} transações)`);
console.log(`Net Balance: R$ ${(totalCredit + totalDebit).toFixed(2)}`);

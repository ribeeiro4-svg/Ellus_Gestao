
function extractTag(xml, tag) {
  const regex = new RegExp(`<([\\w\\d]+:)?${tag}\\b[^>]*>(.*?)<\\/([\\w\\d]+:)?${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[2].trim() : '';
}

function extractValue(xml, tags) {
  for (const tag of tags) {
    const val = extractTag(xml, tag);
    if (val) {
      let normalized = val.trim();
      if (normalized.includes(',')) {
        normalized = normalized.replace(/\./g, '').replace(',', '.');
      } 
      const num = parseFloat(normalized);
      if (!isNaN(num)) return num;
    }
  }
  return 0;
}

const testXml1 = `<vServ>50.00</vServ><vLiq>44.90</vLiq>`;
const testXml2 = `<ns2:ValorServicos>50.00</ns2:ValorServicos><ns2:ValorLiquido>44.90</ns2:ValorLiquido>`;
const testXml3 = `<ValorServicos>1.234,56</ValorServicos>`;
const testXml4 = `<vServ>1234.56</vServ>`;

console.log("Test 1 (Standard):", extractValue(testXml1, ['vServ']), "Expected: 50");
console.log("Test 2 (Namespace):", extractValue(testXml2, ['ValorServicos']), "Expected: 50");
console.log("Test 3 (BR Format):", extractValue(testXml3, ['ValorServicos']), "Expected: 1234.56");
console.log("Test 4 (Float Format):", extractValue(testXml4, ['vServ']), "Expected: 1234.56");
console.log("Test Liquid (Namespace):", extractValue(testXml2, ['ValorLiquido']), "Expected: 44.9");

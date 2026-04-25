
function extractValue(val) {
  if (val) {
    // Current logic in nfseParser.ts
    const normalized = val.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(normalized);
    return num;
  }
  return 0;
}

console.log("Original value: '50.00'");
console.log("Parsed: ", extractValue('50.00'));

console.log("Original value: '44.90'");
console.log("Parsed: ", extractValue('44.90'));

console.log("Original value: '1.234,56'");
console.log("Parsed: ", extractValue('1.234,56'));

function improvedExtractValue(val) {
  if (val) {
    let normalized = val.trim();
    // Se tem vírgula, assume formato brasileiro 1.234,56 ou 1234,56
    if (normalized.includes(',')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } 
    // Se não tem vírgula mas tem ponto, assumimos que o ponto é decimal (padrão XML)
    // Então NÃO removemos o ponto.
    
    const num = parseFloat(normalized);
    return num;
  }
  return 0;
}

console.log("\nImproved logic:");
console.log("Original value: '50.00'");
console.log("Parsed: ", improvedExtractValue('50.00'));

console.log("Original value: '44.90'");
console.log("Parsed: ", improvedExtractValue('44.90'));

console.log("Original value: '1.234,56'");
console.log("Parsed: ", improvedExtractValue('1.234,56'));

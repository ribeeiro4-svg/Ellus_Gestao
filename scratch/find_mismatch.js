const fs = require('fs');
const content = fs.readFileSync('c:/GRUPO ÁUREA/DEV/InovacontACPROBEC/docs/associacao-colaborativa-de-profissionais-liberais-comercio-e-setor-de-beleza_01042026_a_30042026_ac0df6e7.ofx', 'utf8');

const cashNames = [
  "MIRELLY DOS SANTOS",
  "MARIA ELIZANGELA",
  "MANOEL OLEGARIO",
  "ANA MARIA GOMES",
  "LEDYONEIDE",
  "GRAZIELA FEITOZA",
  "CLAUDIVANIA BENICIA",
  "CAIO GABRIEL",
  "YARLA FERNANDA",
  "CANDIDO AUGUSTO",
  "MARIA DELCELENE",
  "LUIS FELIPE"
];

cashNames.forEach(name => {
  if (content.toUpperCase().includes(name.toUpperCase())) {
    const start = content.toUpperCase().indexOf(name.toUpperCase());
    console.log(`MATCH FOUND: ${name} at index ${start}`);
    console.log(content.substring(start - 200, start + 200));
  }
});

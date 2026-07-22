const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'src/features/associados/components/PreviewAdesoesModal.tsx');
const dstFile = path.join(__dirname, 'src/features/associados/components/PreviewMensalidadesModal.tsx');

let content = fs.readFileSync(srcFile, 'utf8');

content = content.replace(/PreviewAdesoesModalProps/g, 'PreviewMensalidadesModalProps');
content = content.replace(/PreviewAdesoesModal/g, 'PreviewMensalidadesModal');
content = content.replace(/Lançar Adesões/g, 'Lançar Mensalidades');
content = content.replace(/adesão/g, 'mensalidade');
content = content.replace(/ADESÃO DE ASSOCIADO/g, 'MENSALIDADE');

fs.writeFileSync(dstFile, content, 'utf8');
console.log('Created PreviewMensalidadesModal.tsx successfully in utf-8');

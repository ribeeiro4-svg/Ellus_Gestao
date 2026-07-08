const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/(dashboard)/financeiro/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const componentsToDynamic = [
  'InadimplenciaTab',
  'RelatoriosFinanceirosTab',
  'CalendarioConciliacao',
  'CrudModal',
  'ManualMatchModal',
  'SupplierMatchModal',
  'SupplierCreateModal',
  'IndicarCompetenciaModal',
  'FichaAssociadoModal',
  'RemanejarModal',
  'ConciliacaoLogModal',
  'ConciliacaoHistoryModal',
  'AbonoLancamentoModal',
  'NFSeLinkModal',
  'ManualLinkLancamentoModal',
  'AuditRecorrenciaModal',
  'ConfirmModal'
];

let importsToAdd = "import dynamic from 'next/dynamic';\n";

for (const comp of componentsToDynamic) {
  // Find the import line
  const regex = new RegExp(`import\\s+${comp}(?:\\s*,\\s*\\{[^}]+\\})?\\s+from\\s+['"]([^'"]+)['"]`);
  const match = content.match(regex);
  if (match) {
    const importPath = match[1];
    // Remove original import
    content = content.replace(match[0], '');
    
    // Check if it imported other things as well
    // It's mostly default imports. Let's assume default imports for these components.
    importsToAdd += `const ${comp} = dynamic(() => import('${importPath}'), { ssr: false });\n`;
  }
}

// Special case for CrudModal, { Field }
content = content.replace(/import\s+CrudModal\s*,\s*\{\s*Field\s*\}\s*from\s+['"]([^'"]+)['"]/, "import type { Field } from '$1';");

content = content.replace("import React, { useMemo, useState, useEffect, useCallback, useRef, Suspense } from 'react'", 
  "import React, { useMemo, useState, useEffect, useCallback, useRef, Suspense } from 'react'\n" + importsToAdd);

// Also let's wrap Modals conditionally
const modalWraps = [
  { comp: 'ManualMatchModal', state: 'isManualLinkModalOpen' },
  { comp: 'SupplierMatchModal', state: 'isSupplierLinkModalOpen' },
  { comp: 'SupplierCreateModal', state: 'isSupplierCreateOpen' },
  { comp: 'NFSeLinkModal', state: 'isNFSeLinkModalOpen' },
  { comp: 'ManualLinkLancamentoModal', state: 'isReconciliarModalOpen' },
  { comp: 'AuditRecorrenciaModal', state: 'isAuditRecorrenciaModalOpen' },
  { comp: 'ConfirmModal', state: 'isConfirmDeleteOpen' },
  { comp: 'AbonoLancamentoModal', state: 'isAbonoModalOpen' }
];

for (const wrap of modalWraps) {
  // Search for <Comp
  const regex = new RegExp(`<${wrap.comp}\\b([^]*?)\\/>`, 'g');
  content = content.replace(regex, (match) => {
    return `{${wrap.state} && (\n${match}\n)}`;
  });
}

// And CrudModal
content = content.replace(/<CrudModal\s+isOpen=\{isModalOpen\}([^]*?)\/>/, (match) => {
    return `{isModalOpen && (\n${match}\n)}`;
});
content = content.replace(/<CrudModal\s+isOpen=\{isCobrancaDateModalOpen\}([^]*?)\/>/, (match) => {
    return `{isCobrancaDateModalOpen && (\n${match}\n)}`;
});
content = content.replace(/<CrudModal\s+isOpen=\{isSyncModalOpen\}([^]*?)\/>/, (match) => {
    return `{isSyncModalOpen && (\n${match}\n)}`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');

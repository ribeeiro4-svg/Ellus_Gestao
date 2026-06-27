const fs = require('fs');
let path = 'c:/ÁUREA TECH - EM DEV/Éllus Gestão Estratégica/Ellus_Gestao/src/app/(dashboard)/financeiro/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Rename FinanceiroPage to FinanceiroPageContent
content = content.replace("export default function FinanceiroPage() {", "function FinanceiroPageContent() {");

// 2. Import useSearchParams from next/navigation if it's not there
if (!content.includes('useSearchParams')) {
  content = content.replace("import { useSearchParams, useRouter } from 'next/navigation'", "import { useSearchParams, useRouter } from 'next/navigation'");
  if (!content.includes('next/navigation')) {
    content = content.replace("import { useFechamento } from '@/lib/hooks/useFechamento'", "import { useFechamento } from '@/lib/hooks/useFechamento'\nimport { useSearchParams } from 'next/navigation'");
  }
}
if (!content.includes('import { Suspense }')) {
  content = content.replace("import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'", "import React, { useMemo, useState, useEffect, useCallback, useRef, Suspense } from 'react'");
}

// 3. Add useSearchParams logic inside FinanceiroPageContent
const searchParamsLogic = `
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab') as any
    if (tab) setActiveTab(tab)
    
    // Status is handled differently? Wait, if we are in receitas or despesas, filterStatus is used? 
    // Wait, the status filter for in the page? Let me check where it is.
  }, [searchParams])
`;
// Let's just insert it after `const { currentUser } = useCurrentUser()`
content = content.replace("const { currentUser } = useCurrentUser()", "const { currentUser } = useCurrentUser()\n  const searchParams = useSearchParams()\n\n  useEffect(() => {\n    const tab = searchParams.get('tab') as any\n    if (tab) setActiveTab(tab)\n  }, [searchParams])");

// 4. Create the new default export
const exportWrapper = `
export default function FinanceiroPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Carregando Módulo Financeiro...</div>}>
      <FinanceiroPageContent />
    </Suspense>
  )
}
`;
content = content + "\n" + exportWrapper;

fs.writeFileSync(path, content);
console.log('done');

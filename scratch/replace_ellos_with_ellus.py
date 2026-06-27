import os

files_to_update = [
    "src/features/associados/components/AssociadosTab.tsx",
    "src/features/contabil/components/DFC.tsx",
    "src/features/contabil/components/Demonstracoes.tsx",
    "src/features/contabil/components/LivroRazao.tsx",
    "src/features/contabil/components/RelatoriosExport.tsx",
    "src/features/financeiro/components/RelatoriosFinanceirosTab.tsx",
    "src/features/fiscal/components/RelatoriosFiscais.tsx",
    "scripts/update_tenant.js"
]

for filepath in files_to_update:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace image path from ellos to ellus
        new_content = content.replace('/ellos_logo_v2.svg', '/ellus_logo_v2.svg')
        new_content = new_content.replace('/ellos_logo_dark.svg', '/ellus_logo_dark.svg')
        new_content = new_content.replace('/ellos_logo_v2_white.svg', '/ellus_logo_v2_white.svg')
        new_content = new_content.replace('Éllos', 'Éllus')
        new_content = new_content.replace('ellos', 'ellus') # also cover lowercase check
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
        else:
            print(f"No changes: {filepath}")
    else:
        print(f"File not found: {filepath}")

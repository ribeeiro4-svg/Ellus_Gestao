import re
import os

svg_file = 'ellus_logo.svg'
with open(svg_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract path d attribute
match = re.search(r'd="([^"]+)"', content)
if not match:
    print("Error: path d attribute not found")
    exit(1)

path_d = match.group(1)

# Generate public/ellos_logo_v2.svg (Dark Green on Transparent)
v2_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 545" width="100%" height="100%">
  <title>Éllus — Gestão Estratégica</title>
  <path d="{path_d}" fill="#0A2618" fill-rule="evenodd" />
</svg>"""

# Generate public/ellos_logo_v2_white.svg (White on Transparent)
v2_white_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 545" width="100%" height="100%">
  <title>Éllus — Gestão Estratégica (Branco)</title>
  <path d="{path_d}" fill="#ffffff" fill-rule="evenodd" />
</svg>"""

# Generate public/ellos_logo_dark.svg (White on Dark Green background)
dark_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 545" width="100%" height="100%">
  <title>Éllus — Gestão Estratégica (Fundo Escuro)</title>
  <rect width="1024" height="545" fill="#0A2618" rx="24" />
  <path d="{path_d}" fill="#ffffff" fill-rule="evenodd" />
</svg>"""

os.makedirs('public', exist_ok=True)

with open('public/ellos_logo_v2.svg', 'w', encoding='utf-8') as f:
    f.write(v2_content)

with open('public/ellos_logo_v2_white.svg', 'w', encoding='utf-8') as f:
    f.write(v2_white_content)

with open('public/ellos_logo_dark.svg', 'w', encoding='utf-8') as f:
    f.write(dark_content)

# Update src/components/ui/LogoV2.tsx
logo_component_content = f"""export default function LogoV2({{ className, variant = 'default' }}: {{ className?: string, variant?: 'default' | 'white' }}) {{
  const fillColor = variant === 'white' ? '#ffffff' : '#0A2618'

  return (
    <svg 
      viewBox="0 0 1024 545" 
      role="img" 
      xmlns="http://www.w3.org/2000/svg" 
      className={{className}}
    >
      <title>Éllus — Gestão Estratégica</title>
      <path 
        d="{path_d}" 
        fill={{fillColor}} 
        fillRule="evenodd" 
      />
    </svg>
  )
}}
"""

with open('src/components/ui/LogoV2.tsx', 'w', encoding='utf-8') as f:
    f.write(logo_component_content)

print("Success: SVGs and LogoV2.tsx updated.")

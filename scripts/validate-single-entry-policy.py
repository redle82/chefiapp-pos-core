#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🔒 Single Entry Policy Validator

PROTEÇÃO ARQUITETURAL: Landing Page NUNCA pode linkar para /login ou /onboarding

Este script valida que TODOS os links na landing page apontam para /app
FlowGate é a única autoridade que decide rotas.

Referências:
- ADR_001_SOVEREIGN_NAVIGATION_AUTHORITY.md
- ARCHITECTURE_FLOW_LOCKED.md
- CANON.md (Law 0: Navigation Sovereignty)
"""

import os
import re
import sys
from pathlib import Path

# Diretórios da landing page
LANDING_DIRS = [
    "landing-page/src/components",
    "merchant-portal/src/pages/Landing/components"
]

# Padrões proibidos
FORBIDDEN_PATTERNS = [
    r'to="/login"',
    r'to="/onboarding"',
    r'href="/login"',
    r'href="/onboarding"',
    r"to={'/login'}",
    r"to={'/onboarding'}",
    r"href={'/login'}",
    r"href={'/onboarding'}",
    r'getMerchantPortalUrl\(["\']/login',
    r'getMerchantPortalUrl\(["\']/onboarding',
]

# Extensões de arquivo para verificar
FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js']

def main():
    print("🔍 Validando Single Entry Policy...")
    print("")
    
    errors = 0
    
    for dir_path in LANDING_DIRS:
        if not os.path.isdir(dir_path):
            continue
        
        print(f"📁 Verificando: {dir_path}")
        
        for root, dirs, files in os.walk(dir_path):
            for file in files:
                if not any(file.endswith(ext) for ext in FILE_EXTENSIONS):
                    continue
                
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        lines = content.split('\n')
                        
                        for line_num, line in enumerate(lines, 1):
                            # Ignora comentários de proteção
                            if 'ALERTA ARQUITETURAL' in line or 'NUNCA' in line or 'PROTEÇÃO' in line:
                                continue
                            
                            # Verifica cada padrão proibido
                            for pattern in FORBIDDEN_PATTERNS:
                                if re.search(pattern, line):
                                    print("")
                                    print("❌ VIOLAÇÃO ARQUITETURAL encontrada:")
                                    print(f"   {file_path}:{line_num}")
                                    print(f"   {line.strip()}")
                                    print("")
                                    print("🚨 Landing Page NUNCA pode linkar para /login ou /onboarding.")
                                    print("   Use /app. FlowGate decide o resto.")
                                    print("   Ver: ADR_001_SOVEREIGN_NAVIGATION_AUTHORITY.md")
                                    print("")
                                    errors += 1
                                    break
                except Exception as e:
                    print(f"⚠️  Erro ao ler {file_path}: {e}")
    
    print("")
    if errors == 0:
        print("✅ Single Entry Policy validada com sucesso!")
        print("   Todos os links na landing page apontam para /app")
        print("   FlowGate é a única autoridade de navegação.")
        return 0
    else:
        print(f"❌ {errors} violação(ões) arquitetural(is) encontrada(s)")
        print("   Corrija antes de fazer commit.")
        return 1

if __name__ == '__main__':
    sys.exit(main())

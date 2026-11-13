#!/usr/bin/env python3
"""
Monta o app-plus.js a partir das partes em fonte/app-plus/ e confere as versões.

Uso (na pasta do projeto, onde fica o index.html):
    python3 fonte/montar.py              → monta o app-plus.js e confere tudo
    python3 fonte/montar.py --versao 25  → troca a versão para "2027.1 Beta 25" em todos os lugares e monta

As partes entram em ordem alfabética (00-, 01-, 02-...). A ORDEM IMPORTA: uma parte
pode usar o que as anteriores definiram. Parte nova → próximo número livre.
"""
import os, re, sys, glob, subprocess, shutil

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTES = os.path.join(RAIZ, 'fonte', 'app-plus')

def ler(p): return open(os.path.join(RAIZ, p), encoding='utf-8').read()
def gravar(p, s): open(os.path.join(RAIZ, p), 'w', encoding='utf-8').write(s)

def trocar_versao(n):
    v_ponto, v_espaco = f'2027.1-beta.{n}', f'2027.1 Beta {n}'
    s = ler('app.js')
    s = re.sub(r'^// ===== MetaTreino 2027\.1 Beta \d+ =====', f'// ===== MetaTreino {v_espaco} =====', s, count=1, flags=re.M)
    s = re.sub(r"const APP_VERSION = '2027\.1-beta\.\d+';", f"const APP_VERSION = '{v_ponto}';", s, count=1)
    gravar('app.js', s)
    s = ler('service-worker.js'); s = re.sub(r"const APP_VERSION = '2027\.1-beta\.\d+';", f"const APP_VERSION = '{v_ponto}';", s, count=1); gravar('service-worker.js', s)
    s = ler('index.html'); s = re.sub(r'\?v=2027\.1-beta\.\d+', f'?v={v_ponto}', s); s = re.sub(r'2027\.1 Beta \d+</span>', f'{v_espaco}</span>', s); gravar('index.html', s)
    p = os.path.join(PARTES, '00-base-utilitarios-ganchos.js'); s = open(p, encoding='utf-8').read()
    s = re.sub(r'// MetaTreino 2027\.1 Beta \d+ — app-plus\.js', f'// MetaTreino {v_espaco} — app-plus.js', s, count=1)
    s = re.sub(r"const MTP = \{ versao: '2027\.1-beta\.\d+' \};", f"const MTP = {{ versao: '{v_ponto}' }};", s, count=1)
    open(p, 'w', encoding='utf-8').write(s)
    print('versão trocada para', v_espaco)

def conferir():
    achados = {
        'app.js (APP_VERSION)': re.search(r"APP_VERSION = '([^']+)'", ler('app.js')).group(1),
        'service-worker.js': re.search(r"APP_VERSION = '([^']+)'", ler('service-worker.js')).group(1),
        'app-plus (MTP.versao)': re.search(r"versao: '([^']+)'", ler('app-plus.js')).group(1),
    }
    for v in re.findall(r'\?v=([0-9a-z.\-]+)', ler('index.html')): achados['index.html (?v=)'] = v
    rod = re.search(r'id="pf-version"[^>]*>2027\.1 Beta (\d+)<', ler('index.html'))
    if rod: achados['index.html (rodapé)'] = '2027.1-beta.' + rod.group(1)
    vs = set(achados.values())
    for k, v in achados.items(): print(f'  {k:24} {v}')
    if len(vs) != 1: print('⚠️  VERSÕES DIFERENTES — o app pode não atualizar sozinho nos celulares.'); return False
    print('✅ versões iguais'); return True

def montar():
    arqs = sorted(glob.glob(os.path.join(PARTES, '*.js')))
    if not arqs: sys.exit('nenhuma parte em fonte/app-plus/')
    saida = ''.join(open(a, encoding='utf-8').read() for a in arqs)
    gravar('app-plus.js', saida)
    print(f'app-plus.js montado: {len(arqs)} partes, {len(saida)//1024} KB')
    if shutil.which('node'):
        for f in ['app.js', 'app-plus.js']:
            r = subprocess.run(['node', '--check', os.path.join(RAIZ, f)], capture_output=True, text=True)
            print(('✅ ' if r.returncode == 0 else '❌ ') + f + (' sem erro de sintaxe' if r.returncode == 0 else '\n' + r.stderr))
            if r.returncode: sys.exit(1)
    else:
        print('(node não encontrado: pulei a conferência de sintaxe)')

if __name__ == '__main__':
    if '--versao' in sys.argv: trocar_versao(int(sys.argv[sys.argv.index('--versao') + 1]))
    montar()
    if not conferir(): sys.exit(1)

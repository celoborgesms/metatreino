#!/usr/bin/env python3
"""Atualização automática e modo offline com o service worker DE VERDADE (Firebase simulado).
1) abre a versão ANTIGA duas vezes (fica instalada e controlada pelo service worker);
2) troca os arquivos do servidor pela versão NOVA, como numa publicação;
3) volta ao app: ele tem que trocar sozinho para a versão nova (sem botão);
4) desliga a internet e reabre: o app tem que abrir (antes da Beta 33 podia abrir em branco).
Uso: python3 testes/atualizacao.py PASTA_ANTIGA PASTA_NOVA"""
import asyncio, sys, os, shutil, subprocess, time, tempfile
from playwright.async_api import async_playwright
ANT, NOVA = sys.argv[1], sys.argv[2]
import re
ALVO = re.search(r"beta\.\d+", open(os.path.join(NOVA, 'service-worker.js'), encoding='utf-8').read()).group(0)   # versão esperada = a da pasta nova
SITE = tempfile.mkdtemp(prefix='mt-site-'); PORTA = 8799
def publica(pasta):
    for f in os.listdir(SITE):
        p = os.path.join(SITE, f); shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
    for f in os.listdir(pasta):
        s = os.path.join(pasta, f)
        if os.path.isfile(s): shutil.copy(s, SITE)
async def versao(pg):
    return await pg.evaluate("(typeof APP_VERSION!=='undefined'?APP_VERSION:'?') + ' | tela: ' + ((document.querySelector('.screen.active')||{}).id||'nenhuma')")
async def main():
    publica(ANT)
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORTA), '--directory', SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(0.8)
    url = f'http://localhost:{PORTA}/index.html'
    falhas = []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
            ctx = await b.new_context(viewport={'width':390,'height':844})
            pg = await ctx.new_page()
            await pg.goto(url); await pg.wait_for_timeout(3000)
            await pg.reload(); await pg.wait_for_timeout(3000)
            v1 = await versao(pg); print('1. versão instalada:', v1)
            ctl = await pg.evaluate("!!navigator.serviceWorker.controller"); print('   controlada pelo service worker:', ctl)
            publica(NOVA); print('2. servidor agora com a versão nova')
            # volta ao app (aba volta a ficar visível) → procura atualização
            await pg.evaluate("localStorage.removeItem('mt_upd_chk2'); navigator.serviceWorker.getRegistration().then(r=>r&&r.update())")
            await pg.wait_for_timeout(4000)
            await pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
            for i in range(20):
                await pg.wait_for_timeout(1000)
                try:
                    v = await versao(pg)
                    if ALVO in v: break
                except Exception: pass
            v2 = await versao(pg); print('3. depois da atualização automática:', v2)
            if ALVO not in v2: falhas.append('não atualizou sozinho para a ' + ALVO)
            await ctx.set_offline(True); print('4. sem internet')
            await pg.reload(); await pg.wait_for_timeout(4000)
            v3 = await versao(pg); print('   reaberto offline:', v3)
            if ALVO not in v3: falhas.append('offline depois de atualizar não abriu a ' + ALVO + ': ' + v3)
            # um aparelho que nunca abriu a versão nova online (só o service worker instalou) — o caso que abria em branco
            ctx2 = await b.new_context(viewport={'width':390,'height':844}); pg2 = await ctx2.new_page()
            await pg2.goto(url); await pg2.wait_for_timeout(3500)          # 1ª visita: instala, mas a página não é controlada
            await ctx2.set_offline(True); await pg2.reload(); await pg2.wait_for_timeout(4000)
            v4 = await versao(pg2); print('5. 1ª visita e já sem internet:', v4)
            if ALVO not in v4: falhas.append('primeira abertura offline falhou: ' + v4)
            await b.close()
    finally:
        srv.terminate(); shutil.rmtree(SITE, ignore_errors=True)
    print('✅ atualização e offline aprovados' if not falhas else '❌ ' + ' | '.join(falhas))
    sys.exit(1 if falhas else 0)
asyncio.run(main())

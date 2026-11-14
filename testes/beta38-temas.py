#!/usr/bin/env python3
"""Beta 38: cada etapa do cadastro nos 8 temas, em 360 px e no computador.
Confere contraste de texto (WCAG AA, mesma regra do navegador.py), página mais larga que a tela e erros de JavaScript.
Uso: python3 testes/beta38-temas.py http://localhost:8765/index.html"""
import asyncio, sys, re, os
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
CONTRASTE_JS = re.search(r'CONTRASTE_JS = r"""(.*?)"""', open(os.path.join(os.path.dirname(__file__), 'navegador.py'), encoding='utf-8').read(), re.S).group(1)
TEMAS = ['zepp','aurora','classico','oceano','claro','amoled','rubi','areia']
async def main():
    falhas = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for nome, vp, mob in [('360', {'width':360,'height':740}, True), ('computador', {'width':1366,'height':800}, False)]:
            ctx = await b.new_context(viewport=vp, is_mobile=mob, has_touch=mob, locale='pt-BR')
            pg = await ctx.new_page(); erros = []
            pg.on('pageerror', lambda e: erros.append(str(e)))
            await pg.goto(URL); await pg.wait_for_function("document.querySelector('.screen.active') && document.querySelector('.screen.active').id==='scr-quiz'", timeout=15000)
            # perfil mínimo para chegar a todas as telas do cadastro (sem plano: continua bloqueado)
            await pg.evaluate("""document.getElementById('q-nick').value='Teste'; document.querySelector('#q-sex .opt[data-val="m"]').click();
              document.getElementById('q-birth').value='1990-01-01'; document.getElementById('q-height').value='175'; document.getElementById('q-weight').value='80';
              document.querySelector('#q-goal .opt[data-val="massa"]').click();""")
            telas = [('scr-quiz', i) for i in range(4)] + [('scr-pick', 0)] + [('scr-setup-lift', i) for i in range(5)] + [('scr-setup-run', i) for i in range(5)]
            for tema in TEMAS:
                await pg.evaluate(f"applyTheme('{tema}', true)")
                for tela, i in telas:
                    if tela == 'scr-quiz': await pg.evaluate(f"showScreen('scr-quiz'); wzIr('scr-quiz', {i})")
                    elif tela == 'scr-pick': await pg.evaluate("saveQuiz(); showPickScreen()")
                    else:
                        m = tela.replace('scr-setup-','')
                        await pg.evaluate(f"openSetupScreen('{m}'); " + ("document.querySelector('#lift-modalidade .opt[data-val=\"hibrido\"]').click(); document.querySelector('#lift-equip .opt[data-val=\"custom\"]').click();" if m=='lift' else '') + f" setTimeout(()=>wzIr('{tela}', {i}), 80)")
                    await pg.wait_for_timeout(260)
                    ruins = await pg.evaluate(CONTRASTE_JS)
                    larga = await pg.evaluate("document.documentElement.scrollWidth > innerWidth + 1")
                    if ruins: falhas.append(f'[{nome}] {tema} {tela} etapa {i+1}: contraste {ruins[:3]}')
                    if larga: falhas.append(f'[{nome}] {tema} {tela} etapa {i+1}: página mais larga que a tela')
            if erros: falhas.append(f'[{nome}] erros: {erros[:3]}')
            await ctx.close()
        await b.close()
    print(f'{len(TEMAS)} temas × 15 etapas × 2 tamanhos')
    for f in falhas: print('  ❌', f)
    print('✅ nenhum problema' if not falhas else f'{len(falhas)} problema(s)')
    sys.exit(1 if falhas else 0)
asyncio.run(main())

#!/usr/bin/env python3
"""Beta 35: botões só com ícone ganham nome, clicáveis respondem ao teclado, avisos não ficam atrás das janelas,
ações destrutivas pedem confirmação. Uso: python3 testes/acessibilidade.py http://localhost:8765/index.html"""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
ok = falhou = 0
def confere(nome, cond, info=''):
    global ok, falhou
    if cond: ok += 1; print('  ✅', nome)
    else: falhou += 1; print('  ❌', nome, info)
SEM_NOME = """(() => [...document.querySelectorAll('button, a, [role=button]')].filter(el => {
  const r = el.getBoundingClientRect(); if(r.width < 2 || r.height < 2 || getComputedStyle(el).visibility==='hidden') return false;
  const tx = (el.textContent||'').trim(); return !/[A-Za-zÀ-ÿ0-9]{2,}/.test(tx) && !el.getAttribute('aria-label') && !el.getAttribute('title');
}).map(el => (el.outerHTML||'').slice(0,90)))()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':390,'height':844}); erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.goto(URL); await pg.wait_for_function("document.querySelector('.screen.active') && document.querySelector('.screen.active').id==='scr-quiz'", timeout=15000)
        await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500)
        await pg.evaluate("try{closeAwards()}catch(e){}; try{closeModal()}catch(e){}")
        sem = []
        for aba in ['home','sessions','library','plan','perf','history','challenges','profile']:
            await pg.evaluate(f"goTab('{aba}')"); await pg.wait_for_timeout(450)
            sem += [aba + ': ' + x for x in await pg.evaluate(SEM_NOME)]
        for j in ['openAssistant()', 'openAparencia()', "openSetLog(state.modules.lift.plan.workouts[0].exercises[0].id, state.modules.lift.plan.workouts[0].exercises[0].name)"]:
            await pg.evaluate(j); await pg.wait_for_timeout(500)
            sem += [j[:12] + ': ' + x for x in await pg.evaluate(SEM_NOME)]
            await pg.evaluate("try{closeSetLog&&closeSetLog()}catch(e){}; try{closeModal()}catch(e){}"); await pg.wait_for_timeout(300)
        confere('botões e clicáveis visíveis têm nome para leitor de tela', not sem, sem[:8])
        await pg.evaluate("goTab('home')"); await pg.wait_for_timeout(400)
        n = await pg.evaluate("document.querySelectorAll('.screen.active [role=button][tabindex]').length")
        confere('cartões clicáveis da tela inicial alcançáveis pelo Tab', n > 0, n)
        # Enter num role=button dispara o clique
        r = await pg.evaluate("""(() => { const el = document.querySelector('.screen.active [role=button][tabindex]'); if(!el) return 'nenhum';
            let c = 0; const f = ()=>c++; el.addEventListener('click', f); el.focus(); el.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter', bubbles:true})); el.removeEventListener('click', f); return c; })()""")
        confere('Enter aciona o elemento clicável', r == 1, r)
        await pg.evaluate("try{closeModal()}catch(e){}; goTab('home')"); await pg.wait_for_timeout(300)
        # aviso com janela aberta fica no topo (não atrás da janela)
        await pg.evaluate("openAparencia()"); await pg.wait_for_timeout(400); await pg.evaluate("toast('teste de aviso')"); await pg.wait_for_timeout(300)
        topo = await pg.evaluate("(() => { const w = document.getElementById('toast-wrap'); return w ? w.getBoundingClientRect().top : -1; })()")
        confere('aviso aparece no topo quando há janela aberta', 0 <= topo < 120, topo)
        await pg.evaluate("closeModal()"); await pg.wait_for_timeout(300)
        # limpar conversa pede confirmação
        await pg.evaluate("openAssistant()"); await pg.wait_for_timeout(500)
        await pg.evaluate("maThread.push({r:'u',t:'oi'}, {r:'a',t:'oi'}); maClearThread()"); await pg.wait_for_timeout(300)
        txt = await pg.evaluate("document.getElementById('modal-inner').innerText")
        confere('limpar conversa abre confirmação', 'Limpar a conversa' in txt, txt[:80])
        confere('conversa não foi apagada antes de confirmar', await pg.evaluate("maThread.length >= 2"))
        await pg.evaluate("try{closeModal()}catch(e){}")
        confere('sem erros de página', not erros, erros[:3])
        await b.close()
    print(f'\n{ok} verificações aprovadas, {falhou} reprovadas.')
    sys.exit(1 if falhou else 0)
asyncio.run(main())

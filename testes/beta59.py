#!/usr/bin/env python3
"""Beta 59 — Progresso da corrida sem plano (só registros avulsos), personalização do Progresso por modalidade
e o atalho "Tem o treino no relógio?" sem quebra. Uso: python3 testes/beta59.py URL"""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
OK = [0]; F = []
def confere(n, c, x=None):
    if c: OK[0] += 1; print('  ✅', n)
    else: F.append(n); print('  ❌', n, x if x is not None else '')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); err = []
        for w in [320, 390]:
            pg = await (await b.new_context(viewport={'width':w,'height':900})).new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
            await pg.add_init_script("window.__MOCK_USER = {uid:'t59', email:'t59@example.com', displayName:'Teste', emailVerified:true};")
            await pg.goto(URL); await pg.wait_for_timeout(2000); await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
            await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); state.active='lift'; openActivityLog()"); await pg.wait_for_timeout(200)
            r = await pg.evaluate("(()=>{ const a = document.getElementById('integ-atalho'); const s = a.querySelector('.ia-seta').getBoundingClientRect(), t = a.querySelector('.ia-tx b').getBoundingClientRect(); return [Math.abs((s.top+s.bottom)/2 - (a.getBoundingClientRect().top + a.getBoundingClientRect().bottom)/2) < 8, s.left > t.left] })()")
            confere(f'{w}px: atalho do relógio com a seta ao lado, centralizada (sem "›" sozinho embaixo)', r == [True, True], r)
            await pg.evaluate("closeModal()"); await pg.close()
        pg = await (await b.new_context(viewport={'width':390,'height':900})).new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
        await pg.add_init_script("window.__MOCK_USER = {uid:'t59b', email:'t59b@example.com', displayName:'Teste', emailVerified:true};")
        await pg.goto(URL); await pg.wait_for_timeout(2000); await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
        await pg.evaluate("try{closeAwards()}catch(e){}; closeModal()")
        r = await pg.evaluate("""(()=>{ const H=Date.now(); state.modules.run = { plan:null, history:[5,3,1].map(d=>({id:'ma', name:'🏃 Corrida — 5km', at:H-d*86400000, duration:30, distance:5, pace:'6:00/km', module:'run', activity:'corrida'})) };
          state.active='run'; goTab('perf'); return [document.getElementById('scr-perf').classList.contains('active') || getComputedStyle(document.getElementById('scr-perf')).display !== 'none', document.getElementById('s2-val').innerText, document.getElementById('goals-box').innerText] })()""")
        confere('corrida sem plano, com registros: Progresso abre com os números (não manda montar plano)', r[0] and '15' in r[1], r)
        confere('sem plano: Metas sem "3/0" — explica que não há meta de semana e mês', '/0' not in r[2] and 'sem plano' in r[2], r[2])
        await pg.evaluate("goTab('history')"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("(()=>{ const l = document.getElementById('history-list'); return [l.children.length, l.textContent] })()")
        confere('Histórico da corrida sem plano mostra as atividades', r[0] >= 3 and 'km' in r[1], r)
        r = await pg.evaluate("""(()=>{ state.modules.run.history = []; goTab('perf'); return getComputedStyle(document.getElementById('scr-runlog')).display !== 'none' })()""")
        confere('corrida sem plano e sem nenhum registro: continua a tela de começar', r is True, r)
        r = await pg.evaluate("""(()=>{ window._planoConhecido = ()=>false; state.progressoOcultos = ['metas']; state.progressoMod = null;
          state.active='run'; goTab('perf'); openPersonalizarProgresso(); const t = document.querySelector('#modal-inner h3').textContent;
          const ks = [...document.querySelectorAll('#perf-lista .pi-sw')].map(i=>i.dataset.k);
          const c = document.querySelector('#perf-lista .pi-sw[data-k=calendario]'); c.checked = false; pfAlterar(c); closeModal();
          const run = perfOcultos().slice(); state.active='lift'; const lift = perfOcultos().slice(); return [t, ks, run, lift] })()""")
        confere('personalizar mostra a modalidade no título', 'Corrida' in r[0], r[0])
        confere('lista só com os blocos da corrida (sem "Mapa muscular")', 'anatomia' not in r[1] and 'corrida' in r[1], r[1])
        confere('esconder um bloco na corrida NÃO muda a musculação', 'calendario' in r[2] and 'calendario' not in r[3], r[2:])
        confere('quem já tinha personalizado mantém a escolha antiga nas duas modalidades', 'metas' in r[2] and 'metas' in r[3], r[2:])
        confere('sem erros de página', not err, err[:3])
        await b.close()
    print(f'\nBeta 59: {OK[0]} ok, {len(F)} falha(s)'); sys.exit(1 if F else 0)
asyncio.run(main())

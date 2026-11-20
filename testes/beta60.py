#!/usr/bin/env python3
"""Beta 60 — Evolução só com gráficos da modalidade ativa; "Calistenia" fora da personalização da corrida;
"Dicas para esta sessão" removido; "Personalizar treinos" independente por modalidade. Uso: python3 testes/beta60.py URL"""
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
        pg = await (await b.new_context(viewport={'width':390,'height':900})).new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
        await pg.add_init_script("window.__MOCK_USER = {uid:'t60', displayName:'Teste', emailVerified:true};")
        await pg.goto(URL); await pg.wait_for_timeout(2000); await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
        await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); state.weights=[{date:Date.now(),weight:80}]")
        r = await pg.evaluate("(()=>{ state.active='lift'; const a = mtMetricas().map(m=>m.k); state.active='run'; const r = mtMetricas().map(m=>m.k); state.active='lift'; return [a,r] })()")
        confere('Evolução da corrida sem Peso, Volume, Calistenia e Isometria', not any(k in r[1] for k in ['peso','volume','cali_reps','cali_iso']) and 'run' in r[1], r[1])
        confere('Evolução da musculação sem Corrida, Ritmo, Caminhada e Bike', not any(k in r[0] for k in ['run','pace','walk','bike','bikev']) and 'volume' in r[0], r[0])
        r = await pg.evaluate("""(()=>{ const H=Date.now(); const a=[1,2,3].map(d=>({at:H-d*86400000, duration:40})); state.modules.lift.history = a.slice(); state.modules.run.history=[{at:H-5*86400000, duration:30, distance:5, activity:'corrida'}];
          const bs=[{a:H-30*86400000, b:H+1}]; state.active='run'; const fr = mtMetricas().find(m=>m.k==='freq').serie(bs)[0].v; state.active='lift'; const fl = mtMetricas().find(m=>m.k==='freq').serie(bs)[0].v; return [fr, fl] })()""")
        confere('Frequência conta só os dias da modalidade ativa', r == [1, 3], r)
        r = await pg.evaluate("(()=>{ window._planoConhecido=()=>false; state.active='run'; goTab('perf'); openPersonalizarProgresso(); const k=[...document.querySelectorAll('#perf-lista .pi-sw')].map(i=>i.dataset.k); closeModal(); state.active='lift'; return k })()")
        confere('personalizar progresso da corrida sem "Calistenia"', 'calistenia' not in r and 'anatomia' not in r, r)
        r = await pg.evaluate("(()=>{ goTab('sessions'); return document.getElementById('scr-sessions').innerText.includes('Dicas para esta sessão') })()")
        confere('"Dicas para esta sessão" removido (musculação)', r is False)
        r = await pg.evaluate("(()=>{ state.active='run'; goTab('sessions'); const t = document.getElementById('scr-sessions').innerText.includes('Dicas para esta sessão'); state.active='lift'; goTab('sessions'); return t })()")
        confere('"Dicas para esta sessão" removido (corrida)', r is False)
        r = await pg.evaluate("""(()=>{ openPersonalizarTreinos(); const ks=[...document.querySelectorAll('#modal-inner .pi-sw')].map(i=>i.dataset.k);
          ['programacao','orientacoes','foco'].forEach(k=>{ const i=document.querySelector(`#modal-inner .pi-sw[data-k=${k}]`); i.checked=false; tpAlterar(i); }); closeModal(); goTab('sessions');
          const vis = s=>{ const e=document.querySelector(s); return !!e && e.offsetParent!==null };
          const L=[vis('#weekly-info'), vis('#session-detail-slot .mg-card'), vis('#session-detail-slot .today-desc'), vis('#session-detail-slot .block'), [...document.querySelectorAll('#session-detail-slot button')].some(b=>/Salvar treino/.test(b.textContent) && b.offsetParent)];
          state.active='run'; goTab('sessions'); const R=[vis('#weekly-info'), vis('#session-detail-slot .today-desc')];
          openPersonalizarTreinos(); const rk=[...document.querySelectorAll('#modal-inner .pi-sw')].map(i=>i.dataset.k); const t=document.querySelector('#modal-inner h3').textContent; closeModal(); state.active='lift';
          return {ks, L, R, rk, t} })()""")
        confere('musculação: esconder Programação, Orientações e Foco funciona', r['L'][:3] == [False, False, False], r['L'])
        confere('exercícios e "Salvar treino" nunca somem', r['L'][3] and r['L'][4], r['L'])
        confere('corrida não muda quando a musculação é personalizada', r['R'] == [True, True], r['R'])
        confere('lista da corrida só com blocos da corrida (Por que este treino, Orientações da corrida)', 'porque' in r['rk'] and 'orientacoes' not in r['rk'] and 'andamento' not in r['rk'] and 'Corrida' in r['t'], r['rk'])
        confere('"Como fazer o circuito" só aparece na lista para o objetivo Resistência', 'circuito' not in r['ks'], r['ks'])
        r = await pg.evaluate("""(()=>{ state.modules.lift.setup.goal='resistencia'; goTab('sessions'); const ok = !!document.getElementById('tp-circuito'); return ok })()""")
        confere('objetivo Resistência: o formato em circuito continua explicado no treino', r is True)
        confere('sem erros de página', not err, err[:3])
        await b.close()
    print(f'\nBeta 60: {OK[0]} ok, {len(F)} falha(s)'); sys.exit(1 if F else 0)
asyncio.run(main())

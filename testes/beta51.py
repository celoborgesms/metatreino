#!/usr/bin/env python3
"""Beta 51 — Progresso › Desempenho organizado pela modalidade e "Personalizar progresso" (Básico × Premium).
Uso: python3 testes/beta51.py URL_DO_APP"""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
OK = [0]; FALHA = []
def confere(nome, cond, extra=None):
    if cond: OK[0] += 1; print('  ✅', nome)
    else: FALHA.append(nome); print('  ❌', nome, extra if extra is not None else '')
VIS = """(sel=>{ const e = document.querySelector('#scr-perf .wrap > ' + sel); return !!e && getComputedStyle(e).display !== 'none'; })"""
ORD = """(()=>[...document.querySelector('#scr-perf .wrap').children].filter(c=>getComputedStyle(c).display!=='none').map(c=>({c, o:+getComputedStyle(c).order})).sort((a,b)=>a.o-b.o).map(x=>x.c.id || x.c.dataset.pb || (x.c.dataset.pbTopo ? 'topo' : x.c.className)))()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Sao_Paulo')
        pg = await ctx.new_page(); erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.add_init_script("window.__MOCK_USER = {uid:'u51', email:'u51@example.com', displayName:'Teste', emailVerified:true};")
        await pg.goto(URL); await pg.wait_for_timeout(2000)
        await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
        await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); state.active='lift'; window.mtTem = ()=>true; goTab('perf'); 0"); await pg.wait_for_timeout(700)
        print('1. Ordem fixa (o cartão de anatomia não "desce" mais)')
        o1 = await pg.evaluate(ORD)
        await pg.evaluate("perfReorganiza(); renderPerf(); 0"); await pg.wait_for_timeout(400)
        o2 = await pg.evaluate(ORD)
        confere('anatomia logo depois do resumo, antes da evolução', o1.index('mm-entrada') == o1.index('perf-resumo') + 1 and o1.index('mm-entrada') < o1.index('perf-evo'), o1)
        confere('a ordem continua igual depois de redesenhar e reorganizar a tela', o1 == o2, (o1, o2))
        confere('"Personalizar progresso" no fim da tela', o1[-1] == 'perf-personalizar' and 'Personalizar progresso' in await pg.evaluate("document.getElementById('perf-personalizar').textContent"), o1[-3:])
        print('2. A tela segue a modalidade')
        r = await pg.evaluate(f"""(()=>{{ const V = {VIS}; return {{ run: V('#perf-run-card'), anat: V('#mm-entrada'), recRun: [...document.querySelectorAll('#card-records .rec-row[data-pb-mod=run]')].some(r=>getComputedStyle(r).display!=='none'),
          chipRun: [...document.querySelectorAll('#perf-evo button')].some(b=>/^Corrida/.test(b.textContent.trim()) && getComputedStyle(b).display!=='none'), cal: V('[data-pb=calendario]'), dist: V('[data-pb=distribuicao]') }}; }})()""")
        confere('musculação: sem "Evolução da corrida", recordes de corrida nem gráfico de km', not r['run'] and not r['recRun'] and not r['chipRun'], r)
        confere('musculação: anatomia, calendário e distribuição continuam', r['anat'] and r['cal'] and r['dist'], r)
        confere('Beta 55: sem seletor no Progresso (a modalidade vem do Início/Perfil)', await pg.evaluate("!document.getElementById('perf-mod')"))
        await pg.evaluate("state.active='run'; goTab('perf')"); await pg.wait_for_timeout(600)
        r = await pg.evaluate(f"""(()=>{{ const V = {VIS}; return {{ ativo: state.active, tela: document.querySelector('.screen.active').id, run: V('#perf-run-card'), anat: V('#mm-entrada'),
          recLift: [...document.querySelectorAll('#card-records .rec-row[data-pb-mod=lift]')].some(r=>getComputedStyle(r).display!=='none'), recRun: [...document.querySelectorAll('#card-records .rec-row[data-pb-mod=run]')].some(r=>getComputedStyle(r).display!=='none') }}; }})()""")
        confere('trocar para Corrida fica no Progresso e mostra só corrida', r['ativo'] == 'run' and r['tela'] == 'scr-perf' and r['run'] and not r['anat'] and not r['recLift'], r)
        await pg.evaluate("perfModulo('lift')"); await pg.wait_for_timeout(500)
        confere('o "Perfil" não é afetado (id próprio do seletor)', await pg.evaluate("goTab('profile'); document.querySelectorAll('#pf-mod').length === 1"))
        await pg.evaluate("goTab('perf')"); await pg.wait_for_timeout(400)
        print('3. Premium: bloco por bloco e ordem')
        await pg.evaluate("openPersonalizarProgresso()"); await pg.wait_for_timeout(200)
        confere('janela com interruptores e alças de arrastar', await pg.evaluate("document.querySelectorAll('#perf-lista .pi-row .pi-alca').length === PERF_BLOCOS.length && document.querySelectorAll('#perf-lista .pi-sw').length === PERF_BLOCOS.length"))
        await pg.evaluate("const i = document.querySelector('#perf-lista .pi-sw[data-k=calendario]'); i.checked = false; i.dispatchEvent(new Event('change'))"); await pg.wait_for_timeout(200)
        confere('desligar o Calendário esconde o bloco e é salvo', await pg.evaluate(f"!({VIS})('[data-pb=calendario]') && state.progressoOcultos.includes('calendario')"))
        await pg.evaluate("const l = document.getElementById('perf-lista'); l.prepend(l.querySelector('[data-ordem=recordes]')); _piSalvaOrdem(l)"); await pg.wait_for_timeout(200)
        o = await pg.evaluate(ORD)
        confere('mudar a ordem (Recordes primeiro) vale na hora', o.index('card-records') < o.index('perf-resumo') and state_ok(o), o)
        confere('a ordem do Início não foi mexida', await pg.evaluate("!Array.isArray(state.inicioOrdem) || !state.inicioOrdem.includes('recordes')"))
        await pg.evaluate("state.progressoOrdem = null; state.progressoOcultos = []; perfAplica(); closeModal()")
        print('4. Básico: Completo ou Só o essencial, com o selo Premium')
        await pg.evaluate("window.mtTem = r=>r !== 'inicioCompleto'; window._planoConhecido = ()=>true; state.progressoOcultos = ['metas']; state.progressoOrdem = ['distribuicao']; perfAplica(); openPersonalizarProgresso()"); await pg.wait_for_timeout(200)
        t = await pg.evaluate("document.getElementById('modal-inner').textContent")
        confere('janela do Básico: Completo, Só o essencial e o selo Premium', 'Completo' in t and 'Só o essencial' in t and 'Premium' in t and not await pg.evaluate("!!document.getElementById('perf-lista')"), t[:200])
        o = await pg.evaluate(ORD)
        confere('no Básico, ocultos e ordem do Premium ficam guardados mas não valem', 'metas' in o and o.index('distribuicao') > o.index('perf-resumo'), o)
        await pg.evaluate("pfBasico('essencial')"); await pg.wait_for_timeout(200)
        r = await pg.evaluate(f"""(()=>{{ const V = {VIS}; return {{ cal: V('[data-pb=calendario]'), dist: V('[data-pb=distribuicao]'), res: V('#perf-resumo'), evo: V('#perf-evo'), rec: V('#card-records'), metas: V('[data-pb=metas]') }}; }})()""")
        confere('"Só o essencial": resumo, evolução, recordes e metas', r['res'] and r['evo'] and r['rec'] and r['metas'] and not r['cal'] and not r['dist'], r)
        await pg.evaluate("pfAlterar({ dataset:{k:'resumo'}, checked:false })"); await pg.wait_for_timeout(200)
        confere('no Básico, esconder bloco a bloco abre o aviso do Premium (nada muda)', await pg.evaluate(f"({VIS})('#perf-resumo')"))
        await pg.evaluate("closeModal(); pfBasico('completo'); closeModal()")
        print('5. Planos')
        await pg.evaluate("openPlanos()"); await pg.wait_for_timeout(200)
        confere('tabela de planos cita o Progresso', 'Início e do Progresso' in await pg.evaluate("document.getElementById('modal-inner').textContent"))
        confere('sem erros', not erros, erros[:3])
        await b.close()
    print(f"\nBeta 51: {OK[0]} ok, {len(FALHA)} falha(s)")
    sys.exit(1 if FALHA else 0)
def state_ok(o): return 'perf-personalizar' in o
asyncio.run(main())

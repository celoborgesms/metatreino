# 2027 RC 8 — sono: tempo acordado no meio da noite e cochilos (Firebase simulado, Chromium sem tela, relógio controlado).
# Uso: python3 testes/rc8.py [URL]
import asyncio, sys, os
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rc4.py'), encoding='utf-8').read()
_ns = {'__name__': 'rc4_aux'}; argv0 = sys.argv[:]; sys.argv = sys.argv[:2]; exec(compile(_src[:_src.index('async def vai(')], 'rc4.py', 'exec'), _ns); sys.argv = argv0
from playwright.async_api import async_playwright
ts, PLANOS, pagina = _ns['ts'], _ns['PLANOS'], _ns['pagina']
ok = fal = 0
def confere(n, c, d=''):
    global ok, fal
    if c: ok += 1; print('  ✅', n)
    else: fal += 1; print('  ❌', n, str(d)[:700])

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
        pg, err = await pagina(ctx, 's8', tempo=ts(2026,11,27,18))
        await pg.evaluate(PLANOS + "(%d)" % ts(2026,11,2,8))
        print('1. Tempo acordado no meio da noite')
        await pg.evaluate("(()=>{ state.sono = { on:true, n:{ '2026-11-25':{ dor:'23:00', aco:'07:00', min:480, h:8 } } }; saveData(); })()")
        confere('noite antiga (sem tempo acordado) continua igual: 8 h', await pg.evaluate("sonoMinDe(sonoNoite('2026-11-25'))") == 480)
        await pg.evaluate("sonoRegistrar()"); await pg.clock.run_for(200)
        r = await pg.evaluate("""(()=>{ const box = document.getElementById('sono-acor-box'); return { vis: !box.hidden, rot: box.innerText }; })()""")
        confere('campo "Acordado no meio da noite (min)" aparece no modo Dormi / acordei', r['vis'] and 'Acordado no meio da noite' in r['rot'], r)
        t = await pg.evaluate("""(()=>{ document.getElementById('sono-dor').value='23:00'; document.getElementById('sono-aco').value='07:00'; document.getElementById('sono-acor').value='25'; _sonoTotal(); return document.getElementById('sono-total').innerText; })()""")
        confere('total desconta o tempo acordado: 8 h na cama − 25 min = 7 h 35', 'Dormiu 7 h 35' in t and '8 h na cama' in t and '25 min acordado' in t, t)
        t = await pg.evaluate("""(()=>{ document.getElementById('sono-acor').value='500'; _sonoTotal(); const a = document.getElementById('sono-total').innerText; document.getElementById('sono-acor').value='490'; return a; })()""")
        confere('tempo acordado inválido (> 300 min) é recusado com explicação', 'de 0 a 300 minutos' in t, t)
        t = await pg.evaluate("""(()=>{ document.getElementById('sono-dor').value='23:00'; document.getElementById('sono-aco').value='01:00'; document.getElementById('sono-acor').value='130'; _sonoTotal(); return document.getElementById('sono-total').innerText; })()""")
        confere('acordado maior que o tempo na cama: aviso, sem total negativo', 'maior que o tempo entre dormir e acordar' in t, t)
        await pg.evaluate("""(()=>{ document.getElementById('sono-dor').value='23:00'; document.getElementById('sono-aco').value='07:00'; document.getElementById('sono-acor').value='25'; _sonoMarca5('q5',4); sonoRegSalva(); })()"""); await pg.clock.run_for(200)
        r = await pg.evaluate("(()=>{ const x = sonoNoite(_sonoHoje()); return { min: x.min, acor: x.acor, calc: sonoMinDe(x), dor: x.dor }; })()")
        confere('salvo: 455 min de sono, 25 min acordado, horários guardados', r == {'min': 455, 'acor': 25, 'calc': 455, 'dor': '23:00'}, r)
        await pg.evaluate("sonoRegistrar()"); await pg.clock.run_for(200)
        r = await pg.evaluate("({ acor: document.getElementById('sono-acor').value, tot: document.getElementById('sono-total').innerText })")
        confere('reabrir mostra o tempo acordado e o mesmo total', r['acor'] == '25' and 'Dormiu 7 h 35' in r['tot'], r)
        r = await pg.evaluate("(()=>{ _sonoModo('h'); return document.getElementById('sono-acor-box').hidden; })()")
        confere('modo "Só o total": campo de tempo acordado some (a pessoa já informa o que dormiu)', r is True)
        await pg.evaluate("_sonoModo('hor')")

        print('2. Cochilos')
        await pg.evaluate("""(()=>{ _sonoCochAdd(); _sonoCochAdd(); const L = document.querySelectorAll('#sono-coch .sono-coch-l');
          L[0].querySelector('.sc-min').value = '30'; L[1].querySelector('.sc-min').value = '20'; L[1].querySelector('.sc-ini').value = '14:10'; _sonoTotal(); })()""")
        t = await pg.evaluate("document.getElementById('sono-total').innerText")
        confere('total mostra os cochilos à parte e o total do dia', 'cochilos 50 min' in t and '8 h 25 no dia' in t, t)
        n = await pg.evaluate("(()=>{ _sonoCochAdd(); _sonoCochAdd(); return { linhas: document.querySelectorAll('#sono-coch .sono-coch-l').length, botao: document.getElementById('sono-coch-add').hidden }; })()")
        confere('no máximo 3 cochilos por dia (botão some no terceiro)', n == {'linhas': 3, 'botao': True}, n)
        await pg.evaluate("document.querySelectorAll('#sono-coch .sono-coch-l')[2].querySelector('.sc-x').click()")
        await pg.evaluate("sonoRegSalva()"); await pg.clock.run_for(300)
        r = await pg.evaluate("(()=>{ const dk = _sonoHoje(); return { c: state.sono.c[dk].l, noite: sonoMinDe(sonoNoite(dk)), soma: sonoCochiloMin(dk) }; })()")
        confere('cochilos guardados separados da noite; a noite continua 7 h 35', r['c'] == [{'min': 30}, {'min': 20, 'ini': '14:10'}] and r['noite'] == 455 and r['soma'] == 50, r)
        r = await pg.evaluate("(()=>{ const R = _sonoResumo(7); return { med: R.medMin, ruim: sonoRuim(sonoNoite(_sonoHoje())) }; })()")
        confere('média da semana e "noite ruim" não mudam com o cochilo', r['med'] == (455 + 480) / 2 and r['ruim'] is False, r)
        await pg.evaluate("goTab('home')"); await pg.clock.run_for(300)
        t = await pg.evaluate("document.querySelector('#home-metrics .met-sono').innerText")
        confere('atalho do Início: "+ cochilo 50 min"', '+ cochilo 50 min' in t, t)
        t = await pg.evaluate("openSono(); document.getElementById('modal-inner').innerText")
        confere('histórico: "25 min acordado", "+ cochilo 50 min" e o resumo dos cochilos', '25 min acordado' in t and '+ cochilo 50 min' in t and 'COCHILOS (30 DIAS)' in t.upper() and 'não entram na média' in t, t[:300])
        # só cochilo num dia sem noite
        await pg.evaluate("(()=>{ sonoRegistrar('2026-11-26'); _sonoCochAdd(); document.querySelector('#sono-coch .sc-min').value = '40'; sonoRegSalva(); })()"); await pg.clock.run_for(200)
        r = await pg.evaluate("({ noite: sonoNoite('2026-11-26'), c: sonoCochiloMin('2026-11-26'), reg: _sonoResumo(7).n })")
        confere('só um cochilo num dia: não vira noite registrada (contagem de noites igual)', r['noite'] is None and r['c'] == 40 and r['reg'] == 2, r)
        # apagar os cochilos de hoje e conferir a junção
        await pg.evaluate("(()=>{ sonoRegistrar(); document.querySelectorAll('#sono-coch .sc-x').forEach(b=>b.click()); sonoRegSalva(); })()"); await pg.clock.run_for(200)
        r = await pg.evaluate("""(()=>{ const dk = _sonoHoje(); const out = { agora: sonoCochiloMin(dk), lista: state.sono.c[dk].l.length };
          const base = JSON.parse(JSON.stringify(state)); const velha = { sono:{ n:{}, c:{ [dk]:{ l:[{ min:30 }], em: 1 } } } };
          mesclaEstado(base, velha); out.depois = (base.sono.c[dk].l||[]).length;
          const nova = { sono:{ n:{}, c:{ '2026-11-20':{ l:[{ min:15 }], em: Date.now() } } } }; mesclaEstado(base, nova); out.veio = base.sono.c['2026-11-20'].l.length; return out; })()""")
        confere('cochilos apagados não voltam de uma cópia antiga; cochilo de outro aparelho entra', r == {'agora': 0, 'lista': 0, 'depois': 0, 'veio': 1}, r)
        await pg.screenshot(path='/tmp/rc8-sono.png')
        await pg.evaluate("closeModal(); sonoRegistrar(); _sonoCochAdd()"); await pg.clock.run_for(200); await pg.wait_for_timeout(300)
        await pg.screenshot(path='/tmp/rc8-form.png', full_page=False)
        confere('sem erros de página', not err, err[:2])
        await b.close()
    print(f'\nRC 8: {ok} ok, {fal} falha(s)')
asyncio.run(main())

#!/usr/bin/env python3
"""Beta 61 — excluir atividade (importada ou manual) tira conquistas e desafios das últimas 48 h que ela liberou;
conquistas antigas ficam; "Personalizar treinos" retirado; sem emoji de parte do corpo nos treinos.
Uso: python3 testes/beta61.py URL"""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
OK = [0]; F = []
def confere(n, c, x=None):
    if c: OK[0] += 1; print('  ✅', n)
    else: F.append(n); print('  ❌', n, x if x is not None else '')
DIA = 86400000
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); err = []
        pg = await (await b.new_context(viewport={'width':390,'height':900})).new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
        await pg.add_init_script("window.__MOCK_USER = {uid:'t61', displayName:'Teste', emailVerified:true};")
        await pg.goto(URL); await pg.wait_for_timeout(2000); await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
        await pg.evaluate("try{closeAwards()}catch(e){}; closeModal()")
        print('1. Caminhada importada e excluída')
        r = await pg.evaluate(f"""(async ()=>{{ const H = Date.now(); const R = state.modules.run;
          R.history = R.history.filter(x=>x.activity !== 'caminhada');
          state.trophies = state.trophies.filter(t=>!/^walk/.test(t)); state.stats.walkTotal = 0; state.stats.walkKmTotal = 0;
          R.history.push({{id:'imp', name:'Caminhada', at:H-40*{DIA}, duration:40, distance:3.4, module:'run', activity:'caminhada', imp:{{id:'imp_w1', esporte:'caminhada', fmt:'fit'}}}});
          ensureStats(); checkTrophies(); const antes = state.trophies.filter(t=>/^walk/.test(t));
          state.conqPend.push({{k:'t_walk_1', tid:'walk_1', kind:'trofeu'}});
          const idx = R.history.length-1; atvExcluir('run', idx); await new Promise(r=>setTimeout(r,150)); document.getElementById('appconfirm-ok').click(); await new Promise(r=>setTimeout(r,500));
          return [antes, state.trophies.filter(t=>/^walk/.test(t)), state.conqPend.some(p=>p.tid==='walk_1'), state.stats.walkTotal] }})()""")
        confere('importar a caminhada libera as conquistas de caminhada', 'walk_1' in r[0], r[0])
        confere('excluir a caminhada importada tira as conquistas dela (ganhas agora)', r[1] == [], r[1])
        confere('some também da fila de "novas conquistas"', r[2] is False, r)
        confere('o contador vitalício de caminhadas desce', r[3] == 0, r[3])
        print('2. Conquista antiga (mais de 48 h) fica')
        r = await pg.evaluate(f"""(async ()=>{{ const H = Date.now(); const R = state.modules.run;
          R.history.push({{id:'ma', name:'Caminhada', at:H-10*{DIA}, duration:40, distance:3.4, module:'run', activity:'caminhada'}});
          ensureStats(); checkTrophies(); state.trophyDates.walk_1 = H - 5*{DIA};
          state.active = 'run'; goTab('history'); deleteHistoryEntry(R.history.length-1); await new Promise(r=>setTimeout(r,150)); document.getElementById('appconfirm-ok').click(); await new Promise(r=>setTimeout(r,400));
          return [state.trophies.includes('walk_1'), R.history.some(x=>x.activity==='caminhada')] }})()""")
        confere('excluir depois de 48 h: a conquista antiga continua', r == [True, False], r)
        print('3. Manual recente com data antiga')
        r = await pg.evaluate(f"""(async ()=>{{ const H = Date.now(); const R = state.modules.run; state.trophies = state.trophies.filter(t=>!/^bike/.test(t)); state.stats.bikeTotal = 0; state.stats.bikeKmTotal = 0;
          R.history.push({{id:'ma', name:'Bike', at:H-20*{DIA}, duration:60, distance:20, module:'run', activity:'bike'}}); ensureStats(); checkTrophies(); const a = state.trophies.includes('bike_1');
          deleteHistoryEntry(R.history.length-1); await new Promise(r=>setTimeout(r,150)); document.getElementById('appconfirm-ok').click(); await new Promise(r=>setTimeout(r,400));
          return [a, state.trophies.includes('bike_1')] }})()""")
        confere('registro com data antiga, conquista ganha agora: excluir tira a conquista', r == [True, False], r)
        r = await pg.evaluate("(()=>{ state.trophies.push('capicua'); state.trophyDates.capicua = Date.now(); mtRevisaConquistas(); return state.trophies.includes('capicua') })()")
        confere('conquista de evento (não recalculável) não é tocada', r is True)
        print('4. Treinos')
        r = await pg.evaluate("(()=>{ state.active='lift'; goTab('sessions'); const t = document.getElementById('scr-sessions').innerText; return [typeof openPersonalizarTreinos, !!document.getElementById('treinos-personalizar'), /[🍑🧗🙆🦵🦶🦾🧱🤷]/u.test(t), /🔥/u.test([...document.querySelectorAll('#session-detail-slot .block-head')].map(e=>e.textContent).join(''))] })()")
        confere('"Personalizar treinos" retirado', r[0] == 'undefined' and r[1] is False, r)
        confere('sem emoji de parte do corpo na tela de treino', r[2] is False, r)
        confere('grupos sem o 🔥 repetido (número do grupo)', r[3] is False, r)
        r = await pg.evaluate("Object.values(PART_CUES).concat(EX_BANK.map(c=>c.emo)).some(t=>/\\p{Extended_Pictographic}/u.test(t))")
        confere('dicas e grupos da biblioteca sem emoji', r is False)
        confere('sem erros de página', not err, err[:3])
        await b.close()
    print(f'\nBeta 61: {OK[0]} ok, {len(F)} falha(s)'); sys.exit(1 if F else 0)
asyncio.run(main())

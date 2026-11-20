#!/usr/bin/env python3
"""Beta 53 — Calorias do dia pelo gasto real dos treinos (musculação + corrida, previsto × feito).
Uso: python3 testes/beta53.py URL_DO_APP [pasta_para_prints]"""
import asyncio, sys, os
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
OK = [0]; FALHA = []
def confere(nome, cond, extra=None):
    if cond: OK[0] += 1; print('  ✅', nome)
    else: FALHA.append(nome); print('  ❌', nome, extra if extra is not None else '')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Sao_Paulo')
        pg = await ctx.new_page(); erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.add_init_script("window.__MOCK_USER = {uid:'u53', email:'u53@example.com', displayName:'Teste', emailVerified:true};")
        await pg.goto(URL); await pg.wait_for_timeout(2000)
        await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
        await pg.evaluate("""try{closeAwards()}catch(e){}; closeModal(); window.mtPremium = ()=>true; window.mtTem = ()=>true;
          state.weights = [{ date: Date.now(), weight: 80 }]; state.user.profile = Object.assign(state.user.profile||{}, { weight:80, height:178, age:30, sex:'m' });
          state.nutri = null; nutriConfig(); state.nutri.objetivo = 'manter'; saveData(); 0""")
        hoje = await pg.evaluate("getDayIdx()")
        kg = await pg.evaluate("nutriDados().peso")
        print('1. Modelo: base + treinos do dia')
        r = await pg.evaluate("""(()=>{ const c = nutriCalcular(); const dias = [1,2,3,4,5,6,7].map(d=>nutriDiaEnergia(d, chaveDia(new Date(Date.now() + (7 + d - getDayIdx())*86400000)), c));
          const media = dias.reduce((t,e)=>t+e.kcal,0)/7; return { c: c.kcal, modelo: c.modelo, media: Math.round(media), base: dias[0].base, bmr: c.bmr }; })()""")
        confere('meta da semana = média dos dias do plano (mesmo modelo)', r['modelo'] == 'b53' and abs(r['c'] - r['media']) <= r['c']*0.02, r)
        confere('rotina sem exercício = metabolismo basal × 1,4', abs(r['base'] - r['bmr']*1.4) <= 1, r)
        print('2. Musculação + corrida no mesmo dia somam; longão vale mais')
        r = await pg.evaluate(f"""(()=>{{ const L = state.modules.lift.plan.workouts, R = state.modules.run.plan.workouts;
          const dia = ({hoje} % 7) + 1; const dk = chaveDia(new Date(Date.now() + 86400000));
          L.forEach(w=>{{ if(w.dayIdx === dia) w.dayIdx = 0; }}); R.forEach(w=>{{ if(w.dayIdx === dia) w.dayIdx = 0; }});
          const so = nutriDiaEnergia(dia, dk).kcal;
          L[0].dayIdx = dia; L[0].duration = 60; const lift = nutriDiaEnergia(dia, dk);
          R[0].dayIdx = dia; R[0].duration = 45; R[0].name = 'Corrida leve'; const duplo = nutriDiaEnergia(dia, dk);
          L[0].dayIdx = 0; R[0].name = 'Longão'; R[0].duration = 120; R[0].distance = '20'; const longo = nutriDiaEnergia(dia, dk);
          const leve = (R[0].name = 'Corrida leve', R[0].duration = 20, R[0].distance = '3', nutriDiaEnergia(dia, dk));
          const pl = (R[0].name = 'Longão', R[0].duration = 120, R[0].distance = '20', nutriMontarPlano(dia, dk));
          return {{ so, lift: lift.kcal, liftEx: lift.ex, duplo: duplo.kcal, duploTipo: duplo.tipo, duploEx: duplo.ex, n: duplo.sessoes.length, longo: longo.kcal, longoEx: longo.ex, longoTipo: longo.tipo, leve: leve.kcal, leveEx: leve.ex,
            dica: pl.dicas[0], carbL: pl.calc.carb, prot: pl.calc.prot }}; }})()""")
        confere('dia de descanso < dia de musculação < musculação + corrida', r['so'] < r['lift'] < r['duplo'] and r['duploTipo'] == 'duplo' and r['n'] == 2, r)
        confere('as duas sessões somam (gasto do dia duplo = musculação + corrida)', r['duploEx'] > r['liftEx'] * 1.5, r)
        confere(f'longão de 20 km ≈ 0,95 × {kg} kg × 20 km; 3 km leves ≈ 0,95 × {kg} × 3', abs(r['longoEx'] - 0.95*kg*20) <= 5 and abs(r['leveEx'] - 0.95*kg*3) <= 5 and r['longoTipo'] == 'longao', r)
        confere('dia de longão: meta bem maior (≈ a diferença de gasto) e dica de carboidrato', abs((r['longo'] - r['leve']) - 0.95*kg*17) <= 25 and 'longão de 20 km' in r['dica'], r)
        r2 = await pg.evaluate("(()=>{ const c = nutriCalcular(); return { prot: c.prot }; })()")
        confere('proteína igual todo dia; o que sobe é o carboidrato', r['prot'] == r2['prot'] and r['carbL'] > 400, (r['prot'], r2, r['carbL']))
        print('3. Previsto × feito')
        r = await pg.evaluate(f"""(()=>{{ const L = state.modules.lift.plan.workouts; const R = state.modules.run.plan.workouts;
          const ontem = ((({hoje} + 5) % 7) + 1); const dkOntem = chaveDia(new Date(Date.now() - 86400000)); const ini = new Date(dkOntem + 'T00:00:00').getTime();
          L.forEach(w=>{{ if(w.dayIdx === ontem) w.dayIdx = 0; }}); R.forEach(w=>{{ if(w.dayIdx === ontem) w.dayIdx = 0; }});
          L[1].dayIdx = ontem;
          state.modules.lift.history = (state.modules.lift.history||[]).filter(h=>!(h.at >= ini && h.at < ini + 86400000));
          (state.modules.run.history||[]).forEach(h=>{{ if(h.at >= ini && h.at < ini + 86400000) h.at -= 3*86400000; }});
          const semReg = nutriDiaEnergia(ontem, dkOntem);
          state.modules.run.history.push({{ id:'ma', name:'🏃 Corrida — 10km', at: ini + 8*3600000, duration: 60, distance: 10, module:'run', activity:'corrida' }});
          const comReg = nutriDiaEnergia(ontem, dkOntem);
          return {{ semTipo: semReg.tipo, semEx: semReg.ex, comEx: comReg.ex, real: comReg.sessoes.every(s=>s.real) }}; }})()""")
        confere('dia que passou sem registro = descanso (mesmo com treino previsto)', r['semTipo'] == 'descanso' and r['semEx'] == 0, r)
        confere('dia que passou com registro usa o que foi feito (corrida de 10 km)', abs(r['comEx'] - 0.95*kg*10) <= 5 and r['real'], r)
        r = await pg.evaluate(f"""(()=>{{ const L = state.modules.lift.plan.workouts; const dk = chaveDia(new Date()); const ini = new Date(dk + 'T00:00:00').getTime();
          L.forEach(w=>{{ if(w.dayIdx === {hoje}) w.dayIdx = 0; }}); state.modules.run.plan.workouts.forEach(w=>{{ if(w.dayIdx === {hoje}) w.dayIdx = 0; }});
          L[2].dayIdx = {hoje}; state.modules.lift.history = state.modules.lift.history.filter(h=>h.at < ini); state.skips = [];
          const prev = nutriDiaEnergia({hoje}, dk);
          state.skips = [{{ at: ini, module:'lift', k: L[2].k, dayIdx:{hoje} }}]; const pulou = nutriDiaEnergia({hoje}, dk);
          state.skips = []; state.modules.run.history.push({{ id:'ma', name:'🚴 Bike — 20km', at: Date.now() - 60000, duration: 60, distance: 20, module:'run', activity:'bike' }});
          const extra = nutriDiaEnergia({hoje}, dk);
          return {{ prev: prev.tipo, pulou: pulou.tipo, n: extra.sessoes.length, bike: (extra.sessoes.find(s=>s.ativ==='bike')||{{}}).kcal }}; }})()""")
        confere('hoje: treino previsto conta até ser pulado', r['prev'] == 'treino' and r['pulou'] == 'descanso', r)
        confere('hoje: atividade avulsa (bike 20 km/h) soma com o treino ainda previsto', r['n'] == 2 and abs(r['bike'] - 7*kg*1) <= 5, r)
        print('4. Segurança e tela')
        r = await pg.evaluate("""(()=>{ state.nutri.objetivo = 'emagrecer'; const c = nutriCalcular(); const ks = [1,2,3,4,5,6,7].map(d=>nutriDiaEnergia(d).kcal); state.nutri.objetivo = 'manter'; return { min: Math.min(...ks), bmr: c.bmr }; })()""")
        confere('emagrecer: nenhum dia abaixo do metabolismo basal (mínimo seguro)', r['min'] >= r['bmr'] - 10, r)
        await pg.evaluate("openNutri()"); await pg.wait_for_timeout(300)
        t = await pg.evaluate("(document.getElementById('en-dia')||{}).innerText || ''")
        confere('tela do plano: de onde vêm as calorias do dia', 'Rotina do dia' in t and 'Gasto estimado do dia' in t and 'meta' in t, t)
        if SAIDA: os.makedirs(SAIDA, exist_ok=True); await pg.evaluate("document.getElementById('en-dia').scrollIntoView({block:'center'})"); await pg.screenshot(path=os.path.join(SAIDA, 'b53-energia.png'))
        confere('sem erros', not erros, erros[:3])
        await b.close()
    print(f"\nBeta 53: {OK[0]} ok, {len(FALHA)} falha(s)")
    sys.exit(1 if FALHA else 0)
asyncio.run(main())

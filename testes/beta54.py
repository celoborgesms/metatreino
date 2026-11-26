#!/usr/bin/env python3
"""Beta 54 — Integrações e atividades: importação de GPX, TCX e FIT integrada a histórico, recordes,
gráficos, musculação, calorias do dia e Meta Assistente.
Amostras em testes/amostras-atividades/ (FIT gerados com o SDK oficial da Garmin: gerar-fit.mjs).
Uso: python3 testes/beta54.py URL_DO_APP [pasta_para_prints]"""
import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'amostras-atividades')
OK = [0]; FALHA = []
def confere(nome, cond, extra=None):
    if cond: OK[0] += 1; print('  ✅', nome)
    else: FALHA.append(nome); print('  ❌', nome, extra if extra is not None else '')
async def importa(pg, arquivos, salvar=True, antes=None):
    await pg.evaluate("openIntegracoes()"); await pg.wait_for_timeout(150)
    await pg.set_input_files('#integ-arq', [os.path.join(D, a) for a in arquivos])
    res = []
    for a in arquivos:
        for _ in range(80):
            await pg.wait_for_timeout(100)
            st = await pg.evaluate("document.getElementById('integ-previa') ? 'previa' : (/Não deu para importar/.test(document.getElementById('modal-inner').innerText) ? 'erro' : (document.getElementById('integ-tela') ? 'tela' : 'proc'))")
            if st in ('previa', 'erro'): break
        txt = await pg.evaluate("document.getElementById('modal-inner').innerText")
        if antes and st == 'previa': await pg.evaluate(antes)
        res.append((st, txt))
        if st == 'previa':
            if salvar and await pg.evaluate("!![...document.querySelectorAll('#integ-previa .btn-primary')].length"): await pg.evaluate("atvConfirma()")
            else: await pg.evaluate("atvCancela()")
        else: await pg.evaluate("atvProximo()")
        await pg.wait_for_timeout(250)
    return res
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Manaus')
        pg = await ctx.new_page(); erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.add_init_script("window.__MOCK_USER = {uid:'u54', email:'u54@example.com', displayName:'Teste', emailVerified:true};")
        await pg.goto(URL); await pg.wait_for_timeout(2000)
        await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
        await pg.evaluate("""try{closeAwards()}catch(e){}; closeModal(); window.mtTem = ()=>true; window.mtPremium = ()=>true;
          state.modules.run.history = state.modules.run.history.filter(x=>x.at < Date.parse('2026-11-01')); state.modules.lift.history = state.modules.lift.history.filter(x=>x.at < Date.parse('2026-11-01'));
          Object.keys(state.progress).forEach(k=>{ state.progress[k] = state.progress[k].filter(p=>p.date < Date.parse('2026-11-01')); if(!state.progress[k].length) delete state.progress[k]; }); saveData(); 0""")
        print('1. Onde fica (uma tela, dois atalhos)')
        await pg.evaluate("state.active='run'; goTab('history')"); await pg.wait_for_timeout(400)
        confere('Progresso › Histórico: "Integrações e atividades"', await pg.evaluate("!!document.getElementById('integ-hist')"))
        await pg.evaluate("openActivityLog()"); await pg.wait_for_timeout(150)
        confere('"Registrar atividade" tem o atalho "Importar arquivo"', await pg.evaluate("!!document.getElementById('integ-atalho')"))
        await pg.evaluate("document.getElementById('integ-atalho').click()"); await pg.wait_for_timeout(150)
        t = await pg.evaluate("document.getElementById('modal-inner').textContent")
        confere('a tela explica GPX, TCX e FIT e que depende do dispositivo', all(x in t for x in ['GPX — percurso', 'TCX — dados de treino', 'FIT — dados esportivos', 'depende do relógio']), t[:200])
        confere('a tela explica como exportar (Garmin, Zepp, Strava…) e a situação das integrações automáticas', 'Exportar dados' in t and 'Strava' in t and 'Sincronização automática' in t)
        print('2. Corrida, caminhada e bike em GPX, TCX e FIT')
        r = await importa(pg, ['corrida.fit', 'corrida.gpx', 'corrida-com-fc.tcx', 'corrida-sem-fc.fit', 'caminhada.fit', 'caminhada-sem-tipo-sem-altitude.gpx', 'bike.fit', 'bike.gpx', 'bike.tcx'])
        confere('9 prévias abertas (nenhum erro)', [s for s,_ in r] == ['previa']*9, [s for s,_ in r])
        confere('prévia mostra FC, ritmo, parciais e o que o arquivo não trouxe', 'FC média' in r[0][1] and 'Ritmo médio' in r[0][1] and 'Parciais' in r[0][1] and 'não trouxe: frequência cardíaca' in r[3][1], r[3][1][:300])
        h = await pg.evaluate("state.modules.run.history.filter(x=>x.imp).map(x=>({ a:x.activity, km:x.distance, d:x.duration, p:x.pace, fc:x.imp.fcMed, fmt:x.imp.fmt, ini:new Date(x.at).toLocaleString('pt-BR',{timeZone:'America/Manaus'}), mel:x.imp.melhores, n:JSON.stringify(x).length }))")
        por = lambda a, f: [x for x in h if x['a'] == a and x['fmt'] == f]
        c = por('corrida','fit')[0] if por('corrida','fit') else {}
        confere('FIT de corrida: 8,2 km, FC 145, ritmo e início 17/11 06:10 (Manaus)', c.get('km') == 8.2 and c.get('fc') == 145 and c.get('p') and '17/11/2026, 06:10' in c.get('ini',''), c)
        confere('TCX de corrida com FC: 10,2 km, FC e melhores 1/5/10 km', any(x['fmt']=='tcx' and x['a']=='corrida' and abs(x['km']-10.19) < 0.05 and x['fc'] and set(x['mel'].keys()) >= {'1','5','10'} for x in h), h)
        confere('caminhadas e bikes entram como caminhada/bike (bike em km/h)', len([x for x in h if x['a']=='caminhada']) == 2 and len([x for x in h if x['a']=='bike']) == 3 and all('km/h' in x['p'] for x in h if x['a']=='bike'), [(x['a'], x['p']) for x in h])
        confere('na nuvem vai pouco por atividade (< 4 KB, sem o percurso)', max(x['n'] for x in h) < 4096, max(x['n'] for x in h))
        loc = await pg.evaluate("(async()=>{ const x = state.modules.run.history.find(y=>y.imp && y.imp.fmt==='fit' && y.activity==='corrida'); const l = await atvLocalLe(x.imp.id); return { track: l && l.track && l.track.length, raw: !!(l && l.raw), naNuvem: JSON.stringify(x).includes('track') }; })()")
        confere('percurso e arquivo original guardados só no aparelho (IndexedDB)', loc['track'] >= 2 and loc['raw'] and not loc['naNuvem'], loc)
        print('3. Recordes, gráficos, histórico')
        await pg.evaluate("state.active='run'; goTab('perf')"); await pg.wait_for_timeout(500)
        t = await pg.evaluate("document.getElementById('records-list').innerText")
        confere('recordes: melhor 5 km e 10 km (de dentro das atividades)', 'Melhor 5 km' in t and 'Melhor 10 km' in t, t)
        rec = await pg.evaluate("(()=>{ const t = document.getElementById('records-list').innerText; const m = t.match(/Maior distância[\\s\\S]*?(\\d+[.,]?\\d*) km/); return m ? m[1] : ''; })()")
        confere('caminhada e bike não entram no "Maior distância" da corrida', rec and float(rec.replace(',', '.')) < 11, rec)
        await pg.evaluate("openCardio('corrida')"); await pg.wait_for_timeout(200)
        g = await pg.evaluate("[document.querySelectorAll('#cd-tela .cd-svg rect').length, document.getElementById('cd-tela').innerText]")
        confere('Cardio › corrida: barras de distância e resumo do período', g[0] >= 1 and 'Atividades' in g[1] and 'Distância' in g[1], g[1][:200])
        for met in ['fc', '5k', 'ritmo', 'subida']:
            n = await pg.evaluate(f"_cdEst.per=0; _cdEst.met='{met}'; openCardio('corrida'); document.querySelectorAll('#cd-tela .cd-svg circle, #cd-tela .cd-svg rect').length")
            confere(f'gráfico "{met}" com pontos', n >= 1, n)
        n = await pg.evaluate("_cdEst.met='vel'; openCardio('bike'); document.querySelectorAll('#cd-tela .cd-svg circle').length")
        confere('bike: velocidade média por atividade (km/h)', n == 3, n)
        await pg.evaluate("closeModal(); goTab('history')"); await pg.wait_for_timeout(300)
        confere('histórico mostra a origem (⌚ FIT/GPX/TCX)', await pg.evaluate("document.querySelectorAll('#history-list .hist-orig').length") >= 5)
        await pg.evaluate("const c = [...document.querySelectorAll('#history-list .hist-card')].find(x=>x.querySelector('.hist-orig')); c.click()"); await pg.wait_for_timeout(300)
        t = await pg.evaluate("document.getElementById('modal-inner').innerText")
        confere('abrir a atividade mostra detalhe, origem e excluir', 'Importado de arquivo' in t and 'Excluir atividade' in t, t[:200])
        if SAIDA: os.makedirs(SAIDA, exist_ok=True); await pg.screenshot(path=os.path.join(SAIDA, 'b54-detalhe.png'))
        bad = await pg.evaluate("""(async()=>{ let s = '<?xml version="1.0"?><gpx version="1.1" creator="t" xmlns="http://www.topografix.com/GPX/1/1"><trk><type>running</type><trkseg>'; const t0 = Date.parse('2026-10-20T06:00:00Z');
          for(let i=0;i<400;i++){ s += `<trkpt lat="${(-12.5 + i*0.0006).toFixed(6)}" lon="-55.7"><time>${new Date(t0 + i*5000).toISOString()}</time></trkpt>`; }
          s += '</trkseg></trk></gpx>'; const R = await atvProcessaArquivo(new File([s], 'gps-ruim.gpx')); _atvAtual = R; atvConfirma(); await new Promise(r=>setTimeout(r, 400));
          goTab('perf'); await new Promise(r=>setTimeout(r, 300)); const t = document.getElementById('records-list').innerText.replace(/\\s+/g,' '); return { valido: R.A.valido, km: R.A.km, aviso: R.A.avisos.join(' '), rec: t }; })()""")
        confere('GPS com saltos (26 km em 33 min): entra, mas não conta para recordes', bad['valido'] is False and 'recordes' in bad['aviso'] and '26.' not in bad['rec'] and '26,' not in bad['rec'], bad['rec'])
        print('4. Duplicidade')
        n0 = await pg.evaluate("state.modules.run.history.length")
        r = await importa(pg, ['corrida.fit'])
        confere('importar o mesmo arquivo de novo: avisa e não salva', 'já foi importada' in r[0][1] and 'Salvar atividade' not in r[0][1] and await pg.evaluate("state.modules.run.history.length") == n0, r[0][1][:200])
        # registro manual no mesmo dia de uma caminhada → complementar
        await pg.evaluate("maLogActivity('caminhada', 3.6, 36, 4); const x = state.modules.run.history[state.modules.run.history.length-1]; x.at = Date.parse('2026-11-14T21:00:00-04:00'); state.modules.run.history = state.modules.run.history.filter(y=>!(y.imp && y.imp.fmt==='fit' && y.activity==='caminhada')); saveData()")
        n1 = await pg.evaluate("state.modules.run.history.length")
        r = await importa(pg, ['caminhada.fit'])
        res = await pg.evaluate("(()=>{ const l = state.modules.run.history.filter(x=>x.activity==='caminhada' && new Date(x.at).getDate()===14); return { n: l.length, imp: l.map(x=>!!x.imp) }; })()")
        confere('registro manual + mesmo treino importado: pergunta e complementa (não duplica)', 'registrou esta atividade à mão' in r[0][1] and await pg.evaluate("state.modules.run.history.length") == n1 and res['n'] == 1 and res['imp'] == [True], (r[0][1][:150], res))
        print('5. Musculação (RC 2: importação de força retirada)')
        n_lift = await pg.evaluate("state.modules.lift.history.length")
        r = await importa(pg, ['musculacao.fit', 'musculacao-so-fc.fit', 'forca-so-fc.tcx'])
        confere('arquivos de musculação/força: não importam e explicam para registrar em Treinos', [s for s,_ in r] == ['erro']*3 and all('Registre o treino em Treinos' in t for _,t in r), [t[:160] for _,t in r])
        confere('nada entra no histórico de musculação', await pg.evaluate("state.modules.lift.history.length") == n_lift)
        print('6. Arquivos com problema')
        r = await importa(pg, ['rota-sem-horario.gpx', 'cortado.gpx', 'corrida-cortada.fit', 'nao-e-atividade.fit', 'planilha.txt'])
        confere('5 arquivos ruins: mensagens simples, sem erro técnico', [s for s,_ in r] == ['erro']*5 and all(not any(w in t for w in ['undefined', 'TypeError', 'null', 'Exception']) for _,t in r), [t.split('\n')[2:4] for _,t in r])
        lg = await pg.evaluate("(state.importLog||[]).filter(l=>!l.ok).length")
        confere('histórico de importações registra as falhas', lg >= 5, lg)
        print('7. Calorias do dia, Meta Assistente, exclusão e desempenho')
        e = await pg.evaluate("(()=>{ const dk = '2026-11-17'; const s = _enFeitas(dk).find(s=>s.mod==='run'); return { kcalRel: s && s.kcalRel, kcal: s && Math.round(enSessaoKcal(s, nutriDados().peso)) }; })()")
        confere('calorias do dia usam as calorias do relógio (414 kcal menos o repouso)', e['kcalRel'] == 414 and 300 < e['kcal'] < 414, e)
        k = await pg.evaluate("maInterpret('como está a evolução das minhas atividades do relógio?')")
        confere('Meta Assistente entende perguntas sobre as atividades importadas', k == 'atividades', k)
        t = await pg.evaluate("maAtividades()")
        confere('análise usa os dados (volume, ritmo/FC, bike ou cargas) com ressalva', ('km' in t or 'kg' in t) and ('atividades parecidas' in t or 'parecid' in t or 'ritmo' in t), t[:400])
        await pg.evaluate("openAssistant()"); await pg.wait_for_timeout(200)
        confere('sugestão "Análise das minhas atividades" no assistente', await pg.evaluate("MA_SUGGESTIONS.some(s=>s.key==='atividades')"))
        await pg.evaluate("try{closeAssistant()}catch(e){}")
        r = await pg.evaluate("""(async()=>{ const i = state.modules.run.history.findIndex(x=>x.imp && x.activity==='bike'); const id = state.modules.run.history[i].imp.id; const n = state.modules.run.history.length;
          window.appConfirm = (m, f)=>f(); await atvExcluir('run', i); await new Promise(r=>setTimeout(r, 300));
          return { menos: n - state.modules.run.history.length, local: !!(await atvLocalLe(id)) }; })()""")
        confere('excluir uma atividade importada: sai do histórico e apaga o arquivo local', r['menos'] == 1 and not r['local'], r)
        t0 = time.time()
        big = await pg.evaluate("""(async()=>{ let s = '<?xml version="1.0"?><gpx version="1.1" creator="t" xmlns="http://www.topografix.com/GPX/1/1"><trk><type>running</type><trkseg>'; const t0 = Date.parse('2026-10-01T06:00:00Z');
          for(let i=0;i<30000;i++){ s += `<trkpt lat="${(-12.5 + i*0.00002).toFixed(6)}" lon="${(-55.7 + i*0.00002).toFixed(6)}"><ele>380</ele><time>${new Date(t0 + i*1000).toISOString()}</time></trkpt>`; }
          s += '</trkseg></trk></gpx>'; const ini = performance.now(); const R = await atvProcessaArquivo(new File([s], 'grande.gpx')); return { ms: Math.round(performance.now() - ini), km: R.A.km, track: R.A.track.length, mb: Math.round(s.length/1048576*10)/10 }; })()""")
        confere(f"arquivo grande ({big['mb']} MB, 30 mil pontos) processado em < 4 s, percurso simplificado", big['ms'] < 4000 and big['track'] <= 400, big)
        confere('sem erros', not erros, erros[:3])
        await b.close()
    print(f"\nBeta 54: {OK[0]} ok, {len(FALHA)} falha(s)")
    sys.exit(1 if FALHA else 0)
asyncio.run(main())

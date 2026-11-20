#!/usr/bin/env python3
"""Beta 55 — auditoria: retomada por modalidade, importação integrada (conquistas, compartilhar, detalhes,
PDF), conquistas novas vistas uma a uma, novidades em Desafios, Progresso pela modalidade ativa, atalho de
importação em Treinos, números impossíveis, substituição de alimentos, login sem piscar o cadastro e
responsividade.
Uso: python3 testes/beta55.py URL_DO_APP [pasta_para_prints]"""
import asyncio, sys, os
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'amostras-atividades')
OK = [0]; FALHA = []
def confere(nome, cond, extra=None):
    if cond: OK[0] += 1; print('  ✅', nome)
    else: FALHA.append(nome); print('  ❌', nome, extra if extra is not None else '')
DIA = 86400000
async def nova(b, w=390, uid='u55'):
    ctx = await b.new_context(viewport={'width':w,'height':844}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Manaus')
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    await pg.add_init_script(f"window.__MOCK_USER = {{uid:'{uid}', email:'{uid}@example.com', displayName:'Teste', emailVerified:true}};")
    await pg.goto(URL); await pg.wait_for_timeout(2000)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
    await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); window.mtTem = ()=>true; window.mtPremium = ()=>true; 0")
    return pg, erros
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg, erros = await nova(b)

        print('1. Retomada: cada modalidade com o seu histórico')
        # o caso do vídeo: musculação ontem + um treino de força importado de meses atrás; caminhada importada há 53 dias
        r = await pg.evaluate(f"""(()=>{{ const H = Date.now();
          state.modules.lift.history = [{{id:'imp', name:'⌚ Treino de força importado', at:H-143*{DIA}, duration:12, module:'lift', imp:{{id:'imp_x', esporte:'musculacao'}}}}, {{id:'D', name:'Treino D', at:H-1*{DIA}, duration:32, module:'lift'}}];
          state.modules.run.history = [{{id:'imp', name:'Caminhada', at:H-53*{DIA}, duration:36, distance:3.62, module:'run', activity:'caminhada', imp:{{id:'imp_y', esporte:'caminhada'}}}}, {{id:'ma', name:'Corrida', at:H-1*{DIA}, duration:148, distance:24, module:'run', activity:'corrida'}}];
          state.active = 'lift'; goTab('home'); return [estadoTreino().tipo, (document.getElementById('home-smart')||{{}}).innerText||''] }})()""")
        confere('caminhada importada há 53 dias NÃO aciona retomada da musculação', r[0] == 'normal', r)
        confere('Início não fala em "53 dias" nem corta carga', '53 dias' not in r[1] and 'das cargas' not in r[1], r[1][:200])
        confere('treino isolado e antigo não vira "condição de antes" (sem retomada)', await pg.evaluate("estadoTreino().tipo") == 'normal')
        r = await pg.evaluate(f"""(()=>{{ const H = Date.now();
          state.modules.lift.history = [30,28,26,24,1].map((d,i)=>({{id:'A', name:'Treino', at:H-d*{DIA}, duration:40, module:'lift'}}));
          const e = estadoTreino(); return [e.tipo, e.pausa] }})()""")
        confere('musculação regular e depois 23 dias parada → retomada da musculação', r[0] == 'retomada' and r[1] == 23, r)
        r = await pg.evaluate("""(()=>{ state.active = 'run'; goTab('home'); const t = (document.getElementById('home-smart')||{}).innerText||''; return t })()""")
        confere('no módulo de corrida, a retomada da musculação não aparece (sem "cargas")', 'cargas' not in r and 'série a menos' not in r, r[:200])
        r = await pg.evaluate("(()=>{ state.active='run'; const t = MA_ANSWERS.retomada(); state.active='lift'; const u = MA_ANSWERS.retomada(); return [t, u] })()")
        confere('Meta Assistente: retomada da musculação não dá ordem para a corrida', 'Corrida/caminhada:' not in r[1], r[1][-200:])
        r = await pg.evaluate(f"""(()=>{{ const H = Date.now(); const R = state.modules.run.history;
          state.modules.run.history = [{{at:H-40*{DIA}, distance:5, duration:30, activity:'corrida'}}, {{at:H-38*{DIA}, distance:5, duration:30, activity:'corrida'}}, {{at:H-2*{DIA}, distance:5, duration:30, activity:'caminhada'}}];
          const e = estadoTreinoCorrida(); state.modules.run.history = R; return e.tipo }})()""")
        confere('retomada da corrida (sem plano) olha só corridas: caminhada não "zera" a pausa', r == 'retomada', r)

        print('2. Importação integrada ao resto do app')
        await pg.evaluate("state.modules.run.history = []; state.modules.lift.history = state.modules.lift.history.slice(0,0); state.trophies = (state.trophies||[]).filter(t=>!/^walk_|first_walk|primeira_cam/.test(t)); state.conqPend = []; saveData(); state.active='run'; goTab('history'); 0")
        await pg.evaluate("openIntegracoes()"); await pg.wait_for_timeout(150)
        confere('Integrações tem o registro à mão (um lugar central)', await pg.evaluate("!!document.querySelector('.integ-manual')"))
        n0 = await pg.evaluate("(state.trophies||[]).length")
        await pg.set_input_files('#integ-arq', [os.path.join(D, 'caminhada.fit')])
        for _ in range(60):
            await pg.wait_for_timeout(100)
            if await pg.evaluate("!!document.getElementById('integ-previa')"): break
        await pg.evaluate("atvConfirma()"); await pg.wait_for_timeout(3500)
        r = await pg.evaluate("[(state.trophies||[]).length, !!document.querySelector('.cq-cel'), (document.getElementById('modal-inner')||{}).innerText||'']")
        confere('importar desbloqueia conquistas pela regra normal (caminhada de 3 km+)', r[0] > n0, r[:2])
        confere('e a janela de conquistas aparece como no registro manual', r[1], r[2][:160])
        await pg.evaluate("closeModal()")
        r = await pg.evaluate("(()=>{ const i = state.modules.run.history.findIndex(x=>x.imp); openAtividade('run', i); return i })()"); await pg.wait_for_timeout(400)
        t = await pg.evaluate("document.getElementById('modal-inner').innerText")
        confere('detalhe da importada: compartilhar, dados do arquivo e excluir', 'Compartilhar como imagem' in t and 'Dados do arquivo original' in t and 'Excluir atividade' in t, t[:300])
        await pg.evaluate(f"atvCompartilhar('run', {r})"); await pg.wait_for_timeout(1200)
        r2 = await pg.evaluate("[!!(window.MTS && MTS.d), MTS && MTS.d && MTS.d.tipo, MTS && MTS.d && (MTS.d.nums||[]).map(n=>n.l).join(','), MTS && MTS.d && !!MTS.d.rota]")
        confere('importada abre a Central de compartilhamento (mesmo visual do manual)', r2[0] and r2[1] == 'caminhada', r2)
        confere('card usa só dados que existem (FC do relógio entra; nada inventado)', 'FC média' in (r2[2] or '') or 'Ritmo' in (r2[2] or ''), r2)
        await pg.evaluate("closeModal(); openIntegracoes()"); await pg.wait_for_timeout(200)
        confere('histórico técnico de importações: cada arquivo abre a atividade', await pg.evaluate("!!document.querySelector('.integ-log-btn')"))
        r = await pg.evaluate(f"[_atvTreinoDoDia('corrida', Date.now() - 30*{DIA}), _atvTreinoDoDia('musculacao', Date.now() - 140*{DIA})]")
        confere('arquivo antigo não vira "treino do plano" de hoje (Treino B de 5 meses atrás)', r == [None, None], r)

        print('3. Registro à mão: números impossíveis não viram recorde')
        await pg.evaluate("closeModal(); state.active='run'; openActivityLog(); setActLogType('corrida'); document.getElementById('act-km').value='8'; document.getElementById('act-min').value='10:25'; saveActivityLog()")
        await pg.wait_for_timeout(300)
        t = await pg.evaluate("document.getElementById('modal-inner').innerText")
        confere('8 km em 10:25 → pergunta antes de salvar', 'Esses números estão certos' in t or 'recorde mundial' in t, t[:200])
        n1 = await pg.evaluate("(state.trophies||[]).length")
        await pg.evaluate("[...document.querySelectorAll('#modal-inner button')].find(b=>/Salvar assim/.test(b.textContent)).click()"); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("[state.modules.run.history.length, (state.trophies||[]).length, mtAtvInvalida(state.modules.run.history[state.modules.run.history.length-1])]")
        confere('salvou no histórico, marcada como impossível, sem conquistas novas', r[2] is True and r[1] == n1, r)
        await pg.evaluate("closeModal(); goTab('perf')"); await pg.wait_for_timeout(500)
        t = await pg.evaluate("(document.getElementById('records-list')||{}).innerText||''")
        confere('"Melhor ritmo" não usa o 1:18/km', '1:18' not in t, t[:200])
        r = await pg.evaluate("(()=>{ const i = state.modules.run.history.length-1; goTab('history'); openHistoryEntry(i); return document.getElementById('modal-inner').innerText })()")
        confere('detalhe da atividade manual: modalidade, ritmo, origem e aviso', 'Registro manual' in r and 'Modalidade' in r and 'recorde mundial' in r, r[:300])

        print('4. Conquistas novas: cada uma some só quando é tocada')
        await pg.evaluate("closeModal(); state.conqPend = []; ['first_lift','streak_3','pr_1'].forEach((id,i)=>state.conqPend.push({k:'t_'+id+'_x'+i, tid:null, kind:'medalha', nome:'Teste '+i, desc:'d', at:Date.now()})); const t = TROPHIES.slice(0,2); t.forEach((x,i)=>state.conqPend.push({k:'t_'+x.id, tid:x.id, kind:'trofeu', at:Date.now()})); saveData(); 0")
        await pg.evaluate("openTrophies()"); await pg.wait_for_timeout(400)
        r = await pg.evaluate("[document.querySelectorAll('.cq-novo').length, state.conqPend.length]")
        confere('abrir Conquistas NÃO marca todas como vistas', r == [5, 5], r)
        await pg.evaluate("document.querySelectorAll('.cq-novo')[1].click()"); await pg.wait_for_timeout(500)
        await pg.evaluate("window.__cqSemAnim=true; openTrophies()"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("[document.querySelectorAll('.cq-novo').length, state.conqPend.length]")
        confere('tocar em uma tira só aquela (4 continuam)', r == [4, 4], r)
        await pg.evaluate("closeModal(); goTab('challenges')"); await pg.wait_for_timeout(400)
        r = await pg.evaluate("[!!document.getElementById('mt-novidades'), (document.querySelector('.tab[data-tab=challenges] .cq-dot')||{}).textContent, document.querySelectorAll('#mt-novidades .nov-l').length]")
        confere('Desafios: seção "Novidades" mostra o que é novo e onde está', r[0] and r[2] >= 4, r)
        confere('indicador da aba é um número (sem dois pontos diferentes)', r[1] in ('4', '5'), r)
        await pg.evaluate("openTrophies(); cqTodasVistas(); closeModal(); goTab('challenges')"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("[!!document.querySelector('.tab[data-tab=challenges] .cq-dot'), state.conqPend.length, (state.conqVistas||[]).length > 0]")
        confere('depois de ver tudo, o indicador some (e a conquista continua na coleção)', r == [False, 0, True], r)

        print('5. Progresso e Treinos seguem a modalidade ativa')
        await pg.evaluate("state.active='lift'; goTab('perf')"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("[!!document.getElementById('perf-mod'), document.querySelector('#scr-perf .wrap h1 ~ .text-dim').textContent, [...document.querySelectorAll('#perf-evo .nxchip')].filter(b=>/Caminhada|Corrida|Ritmo/.test(b.textContent) && getComputedStyle(b).display!=='none').length]")
        confere('sem seletor Musculação | Corrida dentro do Progresso', r[0] is False, r)
        confere('subtítulo diz qual modalidade está sendo mostrada', 'Musculação' in r[1], r)
        confere('na musculação, os gráficos de corrida/caminhada não aparecem', r[2] == 0, r)
        r = await pg.evaluate("[...document.querySelectorAll('#calendar .cal-dot')].filter(d=>/--run/.test(d.getAttribute('style'))).length")
        confere('calendário mostra só a musculação (sem pontos de corrida)', r == 0, r)
        await pg.evaluate("goTab('sessions')"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("[...document.querySelectorAll('#sess-qlinks .qlink')].map(b=>b.textContent.trim()+'|'+b.getAttribute('onclick'))")
        confere('Treinos (musculação): "Importar do relógio" no lugar do registro de corrida', any('Importar do relógio|openIntegracoes()' in x for x in r) and not any('Registrar atividade' in x for x in r), r)
        await pg.evaluate("state.active='run'; goTab('sessions')"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("[...document.querySelectorAll('#sess-qlinks .qlink')].map(b=>b.textContent.trim())")
        confere('Treinos (corrida): o registro de atividade continua', any('Registrar atividade' in x for x in r), r)

        print('6. Substituição inteligente de alimentos')
        await pg.evaluate("state.active='lift'; state.nutri = state.nutri || {}; state.nutri.vegetariano=false; state.nutri.semLactose=false; state.nutri.semGluten=false; openNutri()"); await pg.wait_for_timeout(400)
        r = await pg.evaluate("""(()=>{ const pl = nutriMontarPlano(nutriDiaSel()); for(const m of pl.refeicoes){ for(const i of m.itens){ if(NUTRI_CATEG.frutas[1].includes(i.id)) return [m.id, i.id]; } } return null })()""")
        confere('cardápio tem uma fruta para testar', bool(r), r)
        if r:
            mid, fid = r
            antes = await pg.evaluate("JSON.stringify(nutriMontarPlano(nutriDiaSel()).refeicoes.map(m=>m.itens.map(i=>i.id)))")
            await pg.evaluate(f"nutriEditar('{mid}','{fid}')"); await pg.wait_for_timeout(200)
            confere('editor do alimento tem "Trocar por outro alimento"', await pg.evaluate("!!document.getElementById('sub-btn')"))
            await pg.evaluate(f"subAbrir('{mid}','{fid}')"); await pg.wait_for_timeout(200)
            r2 = await pg.evaluate("[window.__sub.R.lista.map(c=>c.id), window.__sub.R.lista.every(c=>NUTRI_CATEG.frutas[1].includes(c.id)), window.__sub.R.lista.every(c=>Math.abs(c.dk) <= Math.max(25, window.__sub.R.o.kcal*0.2))]")
            confere('sugere frutas (mesmo grupo) com calorias equivalentes', len(r2[0]) >= 1 and r2[1] and r2[2], r2)
            await pg.evaluate("subVer(0)"); await pg.wait_for_timeout(150)
            t = await pg.evaluate("document.getElementById('modal-inner').textContent")
            confere('mostra original × sugerido, quantidades e diferença antes de confirmar', all(x in t for x in ['Original','Sugerido','Dif.','Qtd.','Calorias']), t[:200])
            await pg.evaluate("subConfirmar(0)"); await pg.wait_for_timeout(300)
            r3 = await pg.evaluate(f"(()=>{{ const m = nutriMealLog('{mid}', false); return [!!(m.adj['{fid}'] && m.adj['{fid}'].x && m.adj['{fid}'].sub), (m.add||[]).filter(a=>a.subDe==='{fid}').length] }})()")
            confere('troca salva só no registro do dia (original fora, substituto dentro)', r3 == [True, 1], r3)
            depois = await pg.evaluate("JSON.stringify(nutriMontarPlano(nutriDiaSel()).refeicoes.map(m=>m.itens.map(i=>i.id)))")
            confere('o cardápio original não muda', antes == depois)
            idx = await pg.evaluate(f"nutriMealLog('{mid}', false).add.findIndex(a=>a.subDe==='{fid}')")
            await pg.evaluate(f"subDesfazer('{mid}', {idx})"); await pg.wait_for_timeout(200)
            r4 = await pg.evaluate(f"(()=>{{ const m = nutriMealLog('{mid}', false); return [!!(m.adj && m.adj['{fid}']), (m.add||[]).length] }})()")
            confere('desfazer devolve o alimento original', r4[0] is False, r4)
        r = await pg.evaluate("""(()=>{ state.nutri.vegetariano = true; const R = subCandidatos('almoco', 'ovo', 2); state.nutri.vegetariano = false; return R.lista.map(c=>c.id) })()""")
        confere('vegetariano: nenhuma carne entre as sugestões', not any(x in ['frango','patinho','peixe','atum','sardinha','acem','lombo','peru','presunto','sobrecoxa','figado'] for x in r), r)
        r = await pg.evaluate("subCandidatos('cafe', 'mel', 10).lista.length")
        confere('sem troca equivalente (mel) → não sugere qualquer coisa', r == 0, r)
        await pg.evaluate("window.__sub=null; subAbrir && 0"); 
        r = await pg.evaluate("""(()=>{ const pl = nutriMontarPlano(nutriDiaSel()); for(const m of pl.refeicoes){ for(const i of m.itens){ if(subCandidatos(m.id, i.id, i.un||i.gramas).lista.length===0){ subAbrir(m.id, i.id); return document.getElementById('modal-inner').innerText } } } return 'todos têm troca' })()""")
        confere('sem equivalente, a tela diz isso em vez de sugerir', 'Não encontrei uma troca equivalente' in r or r == 'todos têm troca', r[:160])

        print('7. Login: o cadastro não pisca antes da tela inicial')
        r = await pg.evaluate("""(()=>{ const p = state.user.profile; state.user.profile = null; window.__mtCarregandoConta = Date.now();
          goTab('home'); const tela = document.querySelector('.screen.active').id; window.__mtCarregandoConta = 0; state.user.profile = p; return tela })()""")
        confere('enquanto a conta carrega, nenhuma troca de aba leva ao cadastro', r != 'scr-quiz', r)
        html = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'index.html'), encoding='utf-8').read()
        confere('aviso "o app demorou" não conta o tempo escolhendo a conta e some quando o app abre', "__mtCarregandoConta" in html and "visibilityState" in html and "d.remove()" in html)

        print('8. Responsividade (360 px e 320 px): nada escondido para o lado')
        JS = """(()=>{ const W = innerWidth; const fora = [];
          document.querySelectorAll('.screen.active *, #modal-inner *').forEach(el=>{ const cs = getComputedStyle(el); if(cs.display==='none' || cs.visibility==='hidden') return;
            if(/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 4 && !el.classList.contains('ma-sugs')) fora.push((el.id||el.className)+'');
            const r = el.getBoundingClientRect(); if(r.width && r.right > W + 1 && !el.closest('.ma-sugs')) fora.push('fora:'+(el.className||el.tagName)); });
          return [...new Set(fora)].slice(0,6) })()"""
        for w in (360, 320):
            pq, _ = await nova(b, w, 'u55r' + str(w))
            ruins = {}
            for n, c in [('perf', "goTab('perf')"), ('sessions', "goTab('sessions')"), ('challenges', "goTab('challenges')"), ('trofeus', "openTrophies()"), ('cardio', "openCardio('corrida')"), ('mapa', "mmAbrir({modo:'semana'})"), ('integ', "openIntegracoes()"), ('nutri', "openNutri()"), ('run-perf', "state.active='run'; goTab('perf')")]:
                await pq.evaluate("closeModal(); " + c); await pq.wait_for_timeout(450)
                f = await pq.evaluate(JS)
                if f: ruins[n] = f
            confere(f'{w} px: Desempenho, Treinos, Desafios, Conquistas, Cardio, Anatomia, Integrações e Alimentação sem rolagem lateral', not ruins, ruins)
            await pq.context.close()

        confere('nenhum erro de página', not erros, erros[:3])
        if SAIDA:
            os.makedirs(SAIDA, exist_ok=True)
            await pg.evaluate("closeModal(); state.active='lift'; goTab('challenges')"); await pg.wait_for_timeout(400)
            await pg.screenshot(path=os.path.join(SAIDA, 'b55-desafios.png'))
        await b.close()
    print(f'\nBeta 55: {OK[0]} ok, {len(FALHA)} falha(s)')
    if FALHA: print('Falhas:', FALHA); sys.exit(1)
asyncio.run(main())

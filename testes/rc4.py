# 2027 RC 4 — testes automatizados (Firebase simulado, navegador Chromium sem tela, relógio controlado).
# Etapa 1: sono em minutos inteiros, tempo h:m:s em todos os registros, análise do mês pela data de início,
#          mensagens do assistente, recuperação × atividade feita, musculação × corrida no Início, Atividade da
#          semana (detalhe de cada parte), volume no card (opcional), sessões separadas no mesmo dia, volta à aba
#          Treinos e sono × atividade física.
# Etapa 2: ver a função etapa2 (conquistas, desafios, cards, compartilhamento, ilustração, textos, larguras e temas).
# Uso: python3 testes/rc4.py [URL] [etapas]   (padrão http://localhost:8765/index.html, etapas "1,2")
import asyncio, sys, json, datetime
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
ok = fal = 0
def confere(n, c, d=''):
    global ok, fal
    if c: ok += 1; print('  ✅', n)
    else: fal += 1; print('  ❌', n, str(d)[:700])
TZ = datetime.timezone(datetime.timedelta(hours=-4))
def ts(a, m, d, h=8, mi=0): return int(datetime.datetime(a, m, d, h, mi, tzinfo=TZ).timestamp()*1000)
SEG = ts(2026, 11, 23, 8)   # segunda-feira, última semana de novembro
USER = "window.__MOCK_USER = {uid:'%s', displayName:'%s', email:'%s@example.com', emailVerified:true}; window.__MOCK_SEM_DOC = false;"
PLANOS = """((ini)=>{ const d0 = new Date(ini); d0.setHours(0,0,0,0); const st = d0.getTime();
 state.user.profile={nickname:'Teste',sex:'m',birth:'1996-01-01',age:30,height:175,currentWeight:80,goal:'massa',level:'iniciante',quiz_done:true};
 const setupL={goal:'hipertrofia',days:3,equip:'academia',level:'iniciante',selectedDays:[1,3,5]};
 state.modules.lift={setup:setupL,plan:generatePlan('lift',setupL),week:1,createdAt:st,startAt:st,history:[]};
 const setupR={goal:'5km',days:2,selectedDays:[2,4],terrain:'asfalto',aval:{exp:'nunca',continuo:'0',kmSemana:0,tempo:30,tempoLongo:30,lim:[],em:st}};
 state.modules.run={setup:setupR,plan:generatePlan('run',setupR),week:1,createdAt:st,startAt:st,history:[]};
 state.active='lift'; saveData(); goTab('home'); return { lift: state.modules.lift.plan.workouts.map(w=>[w.k,w.dayIdx]), run: state.modules.run.plan.workouts.map(w=>[w.k||null,w.dayIdx,w.name]) }; })"""
SERIES = """((k, cargas, idx)=>{ const w=state.modules.lift.plan.workouts.find(x=>x.k===k);
 (idx||[0,1]).forEach(i=>{ const ex=w.exercises[i]; openSetLog(ex.id, ex.name); curLog.entry.sets=(cargas||[20,22]).map(c=>({peso:c,reps:10})); closeSetLog(true); }); return w.exercises[0].id; })"""
SALVA = "((k, rpe)=>{ finishLiftWorkout(k); window.__rpe = rpe; confirmLiftWorkout(k); try{closeAwards()}catch(e){}; closeModal(); return state.modules.lift.history.length; })"

async def pagina(ctx, uid, nome='T', tempo=None):
    pg = await ctx.new_page(); err = []; pg.on('pageerror', lambda e: err.append(str(e)))
    await pg.clock.install(time=(tempo or SEG)/1000)
    await pg.add_init_script(USER % (uid, nome, uid))
    await pg.goto(URL); await pg.clock.run_for(3500)
    await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); window.mtTem=()=>true; window.mtPremium=()=>true")
    return pg, err
async def vai(pg, dias, hora=None):
    await pg.clock.fast_forward(int(dias*86400000)); await pg.clock.run_for(600)

# ============================================================================ ETAPA 1
async def sono(b):
    print('1. Sono: minutos inteiros nos dois modos, sem arredondar')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'sono1')
    await pg.evaluate(PLANOS + "(%d)" % SEG)
    await pg.evaluate("sonoRegistrar(); _sonoModo('h')"); await pg.clock.run_for(200)
    r = await pg.evaluate("({ step: document.getElementById('sono-mm').getAttribute('step'), max: document.getElementById('sono-mm').max })")
    confere('campo de minutos aceita qualquer valor de 0 a 59 (sem step=5)', r['step'] in (None, '1') and r['max'] == '59', r)
    await pg.evaluate("document.getElementById('sono-hh').value='6'; document.getElementById('sono-mm').value='37'; _sonoTotal()")
    t = await pg.evaluate("document.getElementById('sono-total').textContent")
    confere('"Só o total" 6 h 37: o total mostrado é 6 h 37', t == 'Total: 6 h 37 de sono', t)
    await pg.evaluate("sonoRegSalva()"); await pg.clock.run_for(300)
    r = await pg.evaluate("(()=>{ const x = sonoNoite(chaveDia(new Date())); return { min: x.min, h: x.h, lido: sonoMinDe(x), fmt: sonoFmtMin(sonoMinDe(x)) }; })()")
    confere('6 h 37 gravado como 397 minutos (inteiro) e lido como 6 h 37', r['min'] == 397 and r['lido'] == 397 and r['fmt'] == '6 h 37', r)
    await pg.evaluate("sonoRegistrar()"); await pg.clock.run_for(200)
    r = await pg.evaluate("({ modo: !document.getElementById('sono-h').hidden, hh: document.getElementById('sono-hh').value, mm: document.getElementById('sono-mm').value })")
    confere('reabrir a noite mostra 6 h e 37 min (sem 36 nem 40)', r == {'modo': True, 'hh': '6', 'mm': '37'}, r)
    await pg.evaluate("closeModal()")
    # dormi / acordei, passando da meia-noite
    await pg.evaluate("(()=>{ const dk = chaveDia(new Date(Date.now()-86400000)); sonoRegistrar(dk); _sonoModo('hor'); document.getElementById('sono-dor').value='23:40'; document.getElementById('sono-aco').value='06:55'; _sonoTotal(); })()")
    t = await pg.evaluate("document.getElementById('sono-total').textContent")
    await pg.evaluate("sonoRegSalva()"); await pg.clock.run_for(300)
    r = await pg.evaluate("(()=>{ const x = sonoNoite(chaveDia(new Date(Date.now()-86400000))); return { min: x.min, lido: sonoMinDe(x) }; })()")
    confere('23:40 → 06:55 (passa da meia-noite) = 435 min nos dois lugares (tela e registro)', t == 'Total: 7 h 15 de sono' and r == {'min': 435, 'lido': 435}, [t, r])
    # minuto inválido
    await pg.evaluate("sonoRegistrar(); _sonoModo('h'); document.getElementById('sono-hh').value='7'; document.getElementById('sono-mm').value='75'; _sonoTotal()")
    t = await pg.evaluate("document.getElementById('sono-total').textContent")
    await pg.evaluate("sonoRegSalva()"); await pg.clock.run_for(200)
    r = await pg.evaluate("sonoMinDe(sonoNoite(chaveDia(new Date())))")
    confere('75 minutos é recusado (aviso) e a noite continua 397 min', 'de 0 a 59' in t and r == 397, [t, r])
    await pg.evaluate("closeModal()")
    # registro antigo (h em décimos) é lido sem reescrever
    r = await pg.evaluate("(()=>{ const S = sonoEst(); const dk = chaveDia(new Date(Date.now()-3*86400000)); S.n[dk] = { h:6.6, q:2 }; saveData(); const x = sonoNoite(dk); return { lido: sonoMinDe(x), intacto: JSON.stringify(x) }; })()")
    confere('registro antigo { h: 6.6 } é lido como 396 min e não é reescrito', r['lido'] == 396 and r['intacto'] == '{"h":6.6,"q":2}', r)
    # tile, lista e aviso usam o mesmo formato
    await pg.evaluate("goTab('home')"); await pg.clock.run_for(300)
    t = await pg.evaluate("(document.querySelector('#home-metrics .met-sono')||{}).innerText||''")
    confere('atalho do Início mostra 6 h 37', '6' in t and '37' in t and ',6' not in t, t)
    r = await pg.evaluate("(()=>{ const S = sonoEst(); const dk = chaveDia(new Date()); const ant = S.n[dk]; S.n[dk] = { min:336, h:5.6 }; S.on = true; const s = sonoSinal(); S.n[dk] = ant; return s && s.txt; })()")
    confere('aviso de noite curta em horas e minutos ("5 h 36"), não "5,6 h"', r and '5 h 36' in r and '5,6' not in r, r)
    await pg.evaluate("openSono()"); await pg.clock.run_for(300)
    t = await pg.evaluate("document.getElementById('sono-tela').innerText")
    confere('lista de noites da tela do sono mostra 6 h 37 e 7 h 15', '6 h 37' in t and '7 h 15' in t, t[:400])
    src = await pg.evaluate("String(window.sonoRegSalva) + String(window.sonoRegistrar)")
    confere('formulário e gravação únicos (parte 81): sem décimos de hora nem step=5', '*10)/10' not in src and 'step="5"' not in src, '')
    confere('sem erros de página (sono)', not err, err[:2])
    await ctx.close()

async def tempos(b):
    print('2. Tempo h:m:s em todos os registros e na edição')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'tempo1')
    P = await pg.evaluate(PLANOS + "(%d)" % SEG)
    dRun = P['run'][0][1]
    # registro avulso (Início, sem plano de corrida também usa este)
    await pg.evaluate("openActivityLog(); setActLogType('caminhada'); document.getElementById('act-km').value='6,11'; ['h','m','s'].forEach((k,i)=>{ const e=document.getElementById('act-'+k); e.value=['1','19','20'][i]; e.dispatchEvent(new Event('input',{bubbles:true})); })")
    r = await pg.evaluate("({ h: !!document.getElementById('act-h'), m: !!document.getElementById('act-m'), s: !!document.getElementById('act-s'), oculto: document.getElementById('act-min').value })")
    confere('registro avulso pede horas : minutos : segundos', r['h'] and r['m'] and r['s'] and r['oculto'] == '1:19:20', r)
    await pg.evaluate("saveActivityLog()"); await pg.clock.run_for(300)
    r = await pg.evaluate("(()=>{ const x = state.modules.run.history.slice(-1)[0]; return { d: Math.round(x.duration*3600)/3600, s: Math.round(x.duration*60), fmt: fmtDur(x.duration) }; })()")
    confere('1:19:20 gravado sem perda (4760 s) e exibido como 1 h 19 min 20 s', r['s'] == 4760 and r['fmt'] == '1 h 19 min 20 s', r)
    # edição pelo histórico
    await pg.evaluate("state.active='run'; goTab('history')"); await pg.clock.run_for(300)
    idx = await pg.evaluate("state.modules.run.history.length-1")
    await pg.evaluate("openHistoryEntry(%d)" % idx); await pg.clock.run_for(200)
    r = await pg.evaluate("({ h: (document.getElementById('he-h')||{}).value, m: (document.getElementById('he-m')||{}).value, s: (document.getElementById('he-s')||{}).value, rotulo: document.getElementById('modal-inner').innerText.toLowerCase().includes('horas : minutos : segundos') })")
    confere('edição de atividade: campos h:m:s preenchidos (1 · 19 · 20)', r == {'h':'1','m':'19','s':'20','rotulo':True}, r)
    await pg.evaluate("document.getElementById('he-m').value='75'; document.getElementById('he-m').dispatchEvent(new Event('input',{bubbles:true})); saveHistoryEntry(%d)" % idx); await pg.clock.run_for(200)
    r = await pg.evaluate("Math.round(state.modules.run.history[%d].duration*60)" % idx)
    confere('minuto 75 na edição: recusado, nada muda', r == 4760, r)
    await pg.evaluate("document.getElementById('he-h').value='2'; document.getElementById('he-m').value='03'; document.getElementById('he-s').value='07'; document.getElementById('he-s').dispatchEvent(new Event('input',{bubbles:true})); saveHistoryEntry(%d)" % idx); await pg.clock.run_for(300)
    r = await pg.evaluate("Math.round(state.modules.run.history[%d].duration*60)" % idx)
    confere('edição 2:03:07 gravada (7387 s)', r == 7387, r)
    # registro do plano de corrida (já tinha h:m:s) continua igual
    await pg.evaluate("closeModal(); openRunLog('%s')" % dRun); await pg.clock.run_for(200)
    r = await pg.evaluate("!!document.getElementById('rl-h') && !!document.getElementById('rl-m') && !!document.getElementById('rl-s')")
    confere('registro da corrida planejada: h:m:s (sem mudança)', r)
    await pg.evaluate("closeModal()")
    confere('sem erros de página (tempos)', not err, err[:2])
    await ctx.close()

async def sessoes(b):
    print('3. Dois treinos de musculação no mesmo dia com exercício repetido')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'sess1')
    P = await pg.evaluate(PLANOS + "(%d)" % SEG)
    kA, kB = P['lift'][0][0], P['lift'][1][0]
    ex = await pg.evaluate("(()=>{ const ws = state.modules.lift.plan.workouts; const A = ws[0], B = ws[1]; const e = JSON.parse(JSON.stringify(A.exercises[0])); B.exercises.unshift(e); saveData(); return e.id; })()")
    await pg.evaluate(SERIES + "('%s',[20,20],[0,1])" % kA); await pg.evaluate(SALVA + "('%s', 6)" % kA)
    await pg.clock.run_for(60000)
    r = await pg.evaluate("(()=>{ const B = state.modules.lift.plan.workouts[1]; return { feitoB: checkLiftDone(B), aberto: !!mtEntradaAbertaHoje('%s') }; })()" % ex)
    confere('depois de salvar o treino A, o treino B não aparece "feito" no exercício repetido', r == {'feitoB': False, 'aberto': False}, r)
    await pg.evaluate("openSession('%s')" % kB); await pg.clock.run_for(300)
    t = await pg.evaluate("[...document.querySelectorAll('#session-detail-slot .ex')].slice(0,1).map(e=>e.innerText).join('|')")
    confere('treino B: o exercício repetido está para registrar (sem as séries do A)', 'Registrar' in t and 'Hoje:' not in t, t[:200])
    await pg.evaluate(SERIES + "('%s',[30,32],[0])" % kB); await pg.evaluate(SALVA + "('%s', 7)" % kB)
    r = await pg.evaluate("""(()=>{ const H = state.modules.lift.history; const A = H[0], B = H[1];
      const sa = mtEntradasDoTreino(A).find(e=>e.exId==='%s'), sb = mtEntradasDoTreino(B).find(e=>e.exId==='%s');
      return { sids: [A.sid, B.sid], difer: A.sid !== B.sid, a: sa && sa.sets.map(s=>s.peso), b: sb && sb.sets.map(s=>s.peso), entradas: state.progress['%s'].length,
        volA: mtVolumeTreino(A).kg, volB: mtVolumeTreino(B).kg, seriesB: mtVolumeTreino(B).series, pr: state.prs['%s'] }; })()""" % (ex, ex, ex, ex))
    confere('cada treino tem identificador próprio (sid)', r['difer'] and all(r['sids']), r['sids'])
    confere('séries do exercício repetido separadas por treino (A: 20/20, B: 30/32)', r['a'] == [20,20] and r['b'] == [30,32] and r['entradas'] == 2, r)
    confere('volume de cada treino só com as próprias séries', r['volA'] == 20*10*2 + 20*10*2 and r['volB'] == 30*10 + 32*10, r)
    confere('recorde: o 2º treino do dia é outra sessão (32 kg supera a referência de 20 kg)', r['pr'] and not r['pr'].get('ref') and r['pr']['peso'] == 32, r['pr'])
    r = await pg.evaluate("(()=>{ const H = state.modules.lift.history; const d = mtsDeHistorico(H[1]); const a = mtsDeHistorico(H[0]); return { b: d.hero.v, a: a.hero.v }; })()")
    confere('card de compartilhar: séries de cada treino (A: 4, B: 2)', r == {'a':'4','b':'2'}, r)
    t = await pg.evaluate("(()=>{ state.active='lift'; openHistoryEntry(1); return [...document.querySelectorAll('#modal-inner .hd-ex')].map(e=>e.textContent).join(' | '); })()")
    confere('detalhe do treino B mostra 30 kg e 32 kg, sem 20 kg', '30 kg × 10' in t and '32 kg × 10' in t and '20 kg × 10' not in t and '620 kg de volume' in t, t[:300])
    await pg.evaluate("closeModal()")
    pdf = await pg.evaluate("mtPdfSessoesSeries(0, Date.now()+86400000).map(l=>l.join(' '))")
    confere('PDF (séries registradas): uma linha por treino para o exercício repetido', len([l for l in pdf if '30 kg' in l]) == 1 and len([l for l in pdf if '20 kg × 10 · 2ª: 20 kg' in l]) >= 1, pdf)
    # sincronização de dois aparelhos: a outra cópia traz a sessão B
    r = await pg.evaluate("""(()=>{ const base = JSON.parse(JSON.stringify(state)); const outra = JSON.parse(JSON.stringify(state));
      base.modules.lift.history.pop(); base.progress['%s'] = base.progress['%s'].filter(p=>p.sid !== outra.modules.lift.history[1].sid);
      mesclaEstado(base, outra); return { n: base.progress['%s'].length, h: base.modules.lift.history.length }; })()""" % (ex, ex, ex))
    confere('juntar duas cópias: a sessão B volta como entrada própria (não some por ser do mesmo dia)', r == {'n': 2, 'h': 2}, r)
    # excluir o treino B limpando as séries: o A fica intacto
    await pg.evaluate("deleteHistoryEntry(1)"); await pg.clock.run_for(100)
    await pg.evaluate("document.getElementById('appconfirm-ok').click()"); await pg.clock.run_for(200)
    await pg.evaluate("document.getElementById('appconfirm-ok').click()"); await pg.clock.run_for(300)
    r = await pg.evaluate("({ n: state.modules.lift.history.length, arr: (state.progress['%s']||[]).map(p=>p.sets.map(s=>s.peso)) })" % ex)
    confere('excluir o treino B (limpando séries) não apaga as séries do A', r == {'n': 1, 'arr': [[20,20]]}, r)
    # migração: registro antigo sem sid
    r = await pg.evaluate("""(()=>{ const H = state.modules.lift.history; const A = H[0]; const s0 = A.sid; delete A.sid; Object.values(state.progress).forEach(a=>a.forEach(p=>delete p.sid));
      const m = mtSessaoMigrar(); return { m, novo: !!A.sid, igual: mtEntradasDoTreino(A).length, aberto: !!mtEntradaAbertaHoje('%s') }; })()""" % ex)
    confere('migração: treino antigo ganha sid e as séries dele são reconhecidas (nada apagado)', r['m'] and r['novo'] and r['igual'] >= 2 and not r['aberto'], r)
    confere('sem erros de página (sessões)', not err, err[:2])
    await ctx.close()

async def treinos_volta(b):
    print('4. Aba Treinos: volta previsível, sem perder o treino em andamento')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'volta1')
    P = await pg.evaluate(PLANOS + "(%d)" % SEG)
    kA, kC = P['lift'][0][0], P['lift'][2][0]
    await pg.evaluate("selectSession('%s'); goTab('sessions')" % kC); await pg.clock.run_for(300)
    confere('escolher um treino e abrir a aba vai direto nele', await pg.evaluate("state.ui.selectedSession") == kC)
    await pg.evaluate("goTab('home')"); await pg.clock.run_for(5000)
    await pg.evaluate("goTab('sessions')"); await pg.clock.run_for(300)
    confere('voltar à aba depois: abre o treino de HOJE (não o de outro dia que ficou selecionado)', await pg.evaluate("state.ui.selectedSession") == kA)
    # treino em andamento (C antecipado) não se perde
    await pg.evaluate(SERIES + "('%s',[15],[0])" % kC)
    await pg.evaluate("goTab('profile')"); await pg.clock.run_for(5000); await pg.evaluate("goTab('sessions')"); await pg.clock.run_for(300)
    r = await pg.evaluate("({ sel: state.ui.selectedSession, sets: (mtEntradaAbertaHoje(state.modules.lift.plan.workouts[2].exercises[0].id)||{sets:[]}).sets.length })")
    confere('treino em andamento: a aba volta nele, com as séries intactas', r == {'sel': kC, 'sets': 1}, r)
    # dia seguinte (terça, sem musculação): tela padrão = próximo treino
    await pg.evaluate("(()=>{ const ws = state.modules.lift.plan.workouts; Object.keys(state.progress).forEach(k=>{ state.progress[k] = state.progress[k].filter(p=>p.sid); if(!state.progress[k].length) delete state.progress[k]; }); saveData(); })()")
    await pg.evaluate("goTab('home')"); await vai(pg, 1); await pg.clock.run_for(4000)
    await pg.evaluate("goTab('sessions')"); await pg.clock.run_for(300)
    r = await pg.evaluate("({ sel: state.ui.selectedSession, ws: state.modules.lift.plan.workouts.map(w=>[w.k, w.dayIdx]) })")
    confere('dia sem treino: abre o próximo treino da semana', r['sel'] == P['lift'][1][0], r)
    confere('sem erros de página (volta)', not err, err[:2])
    await ctx.close()

async def inicio_duas(b):
    print('5. Início: musculação × corrida, recuperação das pernas e atividade já feita')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'duas1', tempo=ts(2026,11,24,18))   # terça: corrida no plano, musculação descansa
    P = await pg.evaluate(PLANOS + "(%d)" % SEG)
    dRun = [d for (_, d, _) in P['run']]
    confere('plano de teste: corrida na terça, musculação não', 2 in dRun and 2 not in [d for (_, d) in P['lift']], P)
    await pg.evaluate("state.active='lift'; goTab('home')"); await pg.clock.run_for(400)
    r = await pg.evaluate("({ slot: document.getElementById('today-slot').innerText, hero: (document.getElementById('hero-sub')||{}).innerText + ' ' + (document.getElementById('home-greet-row')||{}).innerText, duo: (document.getElementById('hoje-duo')||{}).innerText||'' })")
    confere('cartão de descanso diz qual modalidade descansa e o que a outra tem hoje', 'Musculação: descanso hoje' in r['slot'] and 'Hoje tem' in r['slot'], r['slot'][:300])
    confere('saudação não fala em descanso geral com corrida no plano', 'Dia de recarregar' not in r['hero'] and 'Descanso também' not in r['hero'], r['hero'][:300])
    confere('RC 5: sem a linha extra Musculação/Corrida embaixo do seletor (só o seletor, como antes)', r['duo'] == '' and await pg.evaluate("!!document.getElementById('mod-toggle')"), r['duo'])
    # pernas carregadas + corrida hoje (ainda não feita)
    await pg.evaluate("window.fatigueOf = p=>p==='Pernas' ? 85 : 0; state.active='run'; goTab('home')"); await pg.clock.run_for(400)
    t = await pg.evaluate("(()=>{ const c = document.getElementById('card-plan-alert'); return c && !c.classList.contains('hidden') ? c.innerText : ''; })()")
    confere('antes da corrida: sugestão de ritmo leve, dita como sugestão', 'corrida de hoje' in t and 'sugestão' in t, t)
    # caminhada leve registrada
    await pg.evaluate("openRunLog('%s'); document.querySelector('#rl-type .opt[data-val=caminhada]').click()" % dRun[0]); await pg.clock.run_for(100)
    await pg.evaluate("document.getElementById('rl-h').value='1'; document.getElementById('rl-m').value='2'; document.getElementById('rl-s').value='42'; document.getElementById('rl-km').value='5,42'; window.__rpe=4; saveRunLog('%s')" % dRun[0]); await pg.clock.run_for(600)
    await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); goTab('home')"); await pg.clock.run_for(400)
    r = await pg.evaluate("(()=>{ const c = document.getElementById('card-plan-alert'); return { vis: !!(c && !c.classList.contains('hidden')), t: c ? c.innerText : '', dur: Math.round(state.modules.run.history.slice(-1)[0].duration*60) }; })()")
    confere('caminhada leve feita (esforço 4): o aviso da corrida "de hoje" some', not r['vis'] or 'corrida de hoje' not in r['t'], r)
    confere('tempo da caminhada 1:02:42 gravado exato (3762 s)', r['dur'] == 3762, r)
    r = await pg.evaluate("(()=>{ const h = state.modules.run.history.slice(-1)[0]; h.rpe = 8; goTab('home'); const c = document.getElementById('card-plan-alert'); return c && !c.classList.contains('hidden') ? c.innerText : ''; })()")
    confere('atividade intensa já feita: o cartão fala de recuperação, não da corrida por fazer', 'já foi registrada' in r and 'faça a corrida' not in r, r)
    confere('sem erros de página (início)', not err, err[:2])
    await ctx.close()

async def mes_assistente(b):
    print('6. Análise do mês pela data de início e mensagens do assistente')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'mes1', tempo=ts(2026,11,27,19))   # sexta 27; plano começou na segunda 23
    P = await pg.evaluate(PLANOS + "(%d)" % SEG)
    kA = P['lift'][0][0]
    await pg.evaluate("(()=>{ const H = state.modules.lift.history; H.push({ id:'%s', name:'Treino', at: new Date(2026,10,23,19).getTime(), duration:50, module:'lift', parts:['Pernas'], exercisesDone:[], rpe:6 }); saveData(); })()" % kA)
    r = await pg.evaluate("(()=>{ const ini = new Date(2026,10,1).getTime(); const A = mtAdesao(ini, Date.now()+1); return { plan: A.planejados, ini: new Date(A.inicio).getDate(), t: analiseMes() }; })()")
    confere('adesão do mês conta só os treinos desde o início do plano (23/11)', r['ini'] == 23 and r['plan'] <= 6, r)
    confere('análise: diz quando o plano começou e não acusa "abaixo do planejado"', 'começou em <b>23/11</b>' in r['t'] and 'abaixo do planejado' not in r['t'] and 'planejar muito' not in r['t'], r['t'][-400:])
    confere('poucos dias de plano: mensagem neutra', 'poucos dias de plano' in r['t'], r['t'][-300:])
    # assistente: balão só com a dica de verdade
    r = await pg.evaluate("""(()=>{ for(let i=0;i<4;i++) state.modules.run.history.push({ id:'ma', name:'Caminhada', at: Date.now()-(i+2)*86400000, duration:30, distance:3, module:'run', activity:'caminhada' });
      state.ui.nudgeSeen = null; window.fatigueMap = ()=>({ Pernas: 85 }); const n = maNudge(); return n ? { t: n.text, c: n.dica && n.dica.completa } : null; })()""")
    confere('balão do assistente traz a dica concreta (não "dei uma olhada… tenho uma dica")', r and 'Dei uma olhada' not in r['t'] and r['c'] and 'pernas' in r['c'].lower(), r)
    r = await pg.evaluate("(()=>{ state.modules.lift.history.push({ id:'%s', name:'Treino', at: Date.now()-600000, duration:40, module:'lift', parts:['Peito'], exercisesDone:[], rpe:6 }); state.ui.nudgeSeen = null; const n = maNudge(); return n ? n.text : ''; })()" % kA)
    confere('treino de hoje já feito: sem balão de dica "para hoje"', 'Pernas' not in r and 'tenho uma dica' not in r, r)
    r = await pg.evaluate("(()=>{ state.prs = { x:{ peso:20, reps:10, at: Date.now(), ref:true } }; state.ui.nudgeSeen = null; const n = maNudge(); return n ? n.text : ''; })()")
    confere('referência do 1º registro não vira "Você bateu um recorde hoje!"', 'recorde hoje' not in r, r)
    confere('sem erros de página (mês/assistente)', not err, err[:2])
    await ctx.close()

async def semana_volume_sono(b):
    print('7. Atividade da semana, volume no card e sono × atividade física')
    ctx = await b.new_context(viewport={'width':360,'height':760}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'sem1', tempo=ts(2026,11,26,20))
    P = await pg.evaluate(PLANOS + "(%d)" % (ts(2026,11,2,8)))
    kA = P['lift'][0][0]
    await pg.evaluate(SERIES + "('%s',[20,25],[0,1])" % kA); await pg.evaluate(SALVA + "('%s', 6)" % kA)
    await pg.evaluate("state.modules.run.history.push({ id:'ma', name:'Bike', at: Date.now()-86400000, duration:40, distance:12, module:'run', activity:'bike' }); saveData(); goTab('home')"); await pg.clock.run_for(400)
    r = await pg.evaluate("({ aneis: document.querySelectorAll('#home-quick .act-rings circle.bar, #home-quick .act-rings .bar').length, dias: document.querySelectorAll('#home-quick .aw-d').length, centro: document.querySelector('#home-quick .act-center').innerText, larg: document.documentElement.scrollWidth <= innerWidth })")
    confere('RC 5: Atividade da semana volta em anéis (sem repetir os 7 dias do quadro Semana), placar real no centro, cabe em 360 px', r['aneis'] >= 2 and r['dias'] == 0 and '/' in r['centro'] and 'TREINOS' in r['centro'].upper() and r['larg'], r)
    tit = await pg.evaluate("""(()=>{ const out = {}; const abre = el=>{ el.click(); const h = document.querySelector('#modal-inner h3'); const t = h ? h.innerText : ''; closeModal(); return t; };
      out.anel = abre(document.querySelector('#home-quick .act-rings'));
      document.querySelectorAll('#home-quick .aw-row').forEach(k=>{ out[k.querySelector('.act-lbl').innerText.trim()] = abre(k); });
      const ex = document.querySelector('#home-quick .aw-extra'); if(ex) out.extra = abre(ex); return out; })()""")
    confere('cada linha abre o próprio detalhe (plano, séries, semanas, extras)', tit.get('anel') == 'Treinos do plano nesta semana' and tit.get('Treinos do plano') == 'Treinos do plano nesta semana' and tit.get('Séries') == 'Séries da semana' and 'Semanas na meta' in tit.values() and tit.get('extra') == 'Extras da semana', tit)
    t = await pg.evaluate("openAwDetalhe('extras'); document.getElementById('modal-inner').innerText")
    confere('extras: lista a bike fora do plano', 'Bike' in t, t[:200])
    await pg.evaluate("closeModal()")
    # volume no card
    r = await pg.evaluate("""(async()=>{ const x = state.modules.lift.history.slice(-1)[0]; const d = mtsDeHistorico(x); mtsAbrir(d); const cb = [...document.querySelectorAll('#modal-inner .mts-nome input')].length;
      MTS.vol = false; await mtsDesenhar(document.createElement('canvas'), d, MTS); const sem = d.desc; MTS.vol = true; await mtsDesenhar(document.createElement('canvas'), d, MTS); const com = d.desc; MTS.vol = false; closeModal();
      return { hero: d.hero, sem, com, cb }; })()""")
    confere('card: séries como número principal; volume em kg só se o aluno ligar, com explicação', r['hero']['u'].startswith('séries') and 'Volume registrado' not in (r['sem'] or '') and 'Volume registrado: 900 kg (soma de carga × repetições)' in r['com'] and r['cb'] == 2, r)
    # sono × atividade
    await pg.evaluate("""(()=>{ const S = sonoEst(); S.on = true; for(let i=1;i<=24;i++){ const dk = chaveDia(new Date(Date.now()-i*86400000)); const boa = i%2===0; S.n[dk] = boa ? { min:470, h:470/60, q5:5, q:3 } : { min:320, h:320/60, q5:2, q:1 };
      if(i%2===0 || i%4===1) state.modules.run.history.push({ id:'ma', name:'Corrida', at: new Date(dk+'T18:00:00').getTime(), duration:30, distance:4, rpe: boa ? 5 : 7, module:'run', activity:'corrida' }); } saveData(); })()""")
    await pg.clock.run_for(3000); await pg.evaluate("closeModal(); openSono()"); await pg.clock.run_for(300)
    t = await pg.evaluate("(document.getElementById('sono-tela')||{innerText:''}).innerText")
    confere('sono × atividade: dias com treino depois de noite boa × ruim e esforço, dito como associação', 'Depois de noite boa' in t and 'Não prova' in t and 'Treinos' in t, t[-700:])
    r = await pg.evaluate("Object.values(SONO_Q5).map(x=>x[1])")
    confere('cores dos 5 níveis de qualidade são todas diferentes (sem dois verdes parecidos)', len(set(r)) == 5 and '#5cc19f' not in r and '#3fbfa6' not in r, r)
    confere('sem erros de página (semana/volume/sono)', not err, err[:2])
    await ctx.close()

# ============================================================================ ETAPA 2
async def etapa2(b):
    print('8. Início sem conquistas, indicadores alinhados e desafio do mês enxuto')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'e2a', tempo=ts(2026,11,26,18))
    P = await pg.evaluate(PLANOS + "(%d)" % SEG)
    await pg.evaluate("goTab('home')"); await pg.clock.run_for(500)
    r = await pg.evaluate("""(()=>{ const m = document.getElementById('home-metrics'); const vis = [...m.children].filter(t=>getComputedStyle(t).display!=='none');
      return { conq: !!m.querySelector('.met[onclick*="openTrophies"]'), trof: getComputedStyle(document.getElementById('home-trofeus')).display, n: m.dataset.n, full: vis.map(t=>t.classList.contains('met-full')),
        pers: INICIO_BLOCOS.some(b=>b.k==='conquistas') }; })()""")
    confere('Início: sem atalho nem cartão de conquistas (e fora de "Personalizar início")', not r['conq'] and r['trof'] == 'none' and not r['pers'], r)
    confere('3 indicadores: o último ocupa a linha inteira (sem buraco)', r['n'] == '3' and r['full'] == [False, False, True], r)
    for ocultos, n in ((['peso'], '2'), (['peso','alimentacao'], '1'), ([], '3')):
        r = await pg.evaluate("(()=>{ state.inicioOcultos = %s; aplicaInicio(); const m = document.getElementById('home-metrics'); const vis = [...m.children].filter(t=>getComputedStyle(t).display!=='none'); const rs = vis.map(t=>t.getBoundingClientRect()); return { n: m.dataset.n, full: vis.map(t=>t.classList.contains('met-full')), larg: rs.map(x=>Math.round(x.width)), mw: Math.round(m.getBoundingClientRect().width), topo: rs.map(x=>Math.round(x.top)) }; })()" % json.dumps(ocultos))
        okl = (n == '2' and r['full'] == [False, False] and r['topo'][0] == r['topo'][1]) or (n == '1' and abs(r['larg'][0] - r['mw']) <= 2) or (n == '3' and r['full'][-1])
        confere(f'{n} indicador(es): ocupam o espaço sem buraco nem desalinhamento', r['n'] == n and okl, r)
    r = await pg.evaluate("(()=>{ const c = document.getElementById('card-monthly'); return { cls: c.className, h: Math.round(c.getBoundingClientRect().height), t: c.innerText }; })()")
    linha = 'hm-desafio' in r['cls'] and r['h'] < 90 and ('restante' in r['t'] or 'último dia' in r['t'])
    confere('desafio do mês no Início: uma linha só (o resto fica em Desafios)', linha or 'hidden' in r['cls'], r)
    confere('sem erros de página (início)', not err, err[:2])
    await ctx.close()

    print('9. Conquista nova depois de registrar: aviso discreto, sem janela grande')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'e2b', tempo=ts(2026,11,23,18))
    P = await pg.evaluate(PLANOS + "(%d)" % SEG)
    kA = P['lift'][0][0]
    await pg.evaluate(SERIES + "('%s',[20,22],[0,1])" % kA)
    await pg.evaluate("((k)=>{ finishLiftWorkout(k); window.__rpe = 6; confirmLiftWorkout(k); })('%s')" % kA)
    await pg.clock.run_for(1500); await pg.evaluate("closeModal()"); await pg.clock.run_for(2500)
    r = await pg.evaluate("({ aviso: (document.getElementById('cq-aviso')||{}).innerText||'', janela: /novas? conquistas?!/i.test(document.getElementById('modal-inner').innerText), pend: (state.conqPend||[]).length, ganhou: state.trophies.includes('first_workout') })")
    confere('conquista ganha, sem janela grande; aviso pequeno "Nova conquista desbloqueada"', r['ganhou'] and not r['janela'] and 'desbloqueada' in r['aviso'], r)
    confere('a conquista continua "nova" para ver em Desafios', r['pend'] >= 1, r)
    await pg.evaluate("document.getElementById('cq-aviso').click()"); await pg.clock.run_for(400)
    confere('tocar no aviso abre a aba Desafios', await pg.evaluate("document.querySelector('.screen.active').id") == 'scr-challenges')
    confere('sem erros de página (aviso)', not err, err[:2])
    await ctx.close()

    print('10. Aba Desafios organizada')
    ctx = await b.new_context(viewport={'width':360,'height':780}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'e2c', tempo=ts(2026,11,26,18))
    P = await pg.evaluate(PLANOS + "(%d)" % SEG)
    await pg.evaluate("goTab('challenges')"); await pg.clock.run_for(500)
    r = await pg.evaluate("""(()=>{ const root = document.getElementById('chal-root'); return { secs: [...root.querySelectorAll(':scope > .chal-sec > .chal-h')].map(h=>h.firstChild.textContent.trim()),
      tiles: root.querySelectorAll('.chal-tile').length, nov: !!root.querySelector('#mt-novidades'), cq: (root.querySelector('.chal-cq')||{}).innerText||'', metas: !!root.querySelector('.chal-linha[onclick="openMonthly()"]'),
      antes: [...root.querySelectorAll('.ev-mission.antes-inicio')].length, larg: document.documentElement.scrollWidth <= innerWidth }; })()""")
    confere('ordem: Desafio atual → Conquistas → Histórico (+ Em breve), sem os 4 atalhos repetidos', r['secs'][:3] == ['Desafio atual','Conquistas','Histórico'] and r['tiles'] == 0 and not r['nov'] and r['metas'], r)
    confere('semanas do desafio antes do início do plano aparecem como "antes do início" (não cobradas)', r['antes'] >= 2, r)
    confere('cartão de conquistas com contagem e atalhos (desbloqueadas / disponíveis)', 'Desbloqueadas' in r['cq'] and 'Disponíveis' in r['cq'], r['cq'])
    confere('Desafios cabe em 360 px', r['larg'], r)
    await pg.evaluate("document.querySelectorAll('.chal-cq-bts button')[1].click()"); await pg.clock.run_for(300)
    r = await pg.evaluate("(document.querySelector('#cq-filtros .on')||{dataset:{}}).dataset.f")
    confere('"Disponíveis" abre as conquistas já filtradas', r == 'and', r)
    await pg.evaluate("closeModal(); window.famAtiva = ()=>true; window.famMembros = ()=>[{uid:'a'},{uid:'b'}]; renderChallenges()"); await pg.clock.run_for(300)
    r = await pg.evaluate("[...document.querySelectorAll('#chal-root > .chal-sec > .chal-h')].map(h=>h.firstChild.textContent.trim())")
    confere('conta em dupla/grupo: seção "Em grupo" com o desafio juntos', 'Em grupo' in r, r)
    r = await pg.evaluate("(()=>{ const g = desafiosDoMes(); const b = g.find(x=>x.base==='dias'); openMonthly(); const t = document.getElementById('modal-inner').innerText; closeModal(); return { alvo: b.niveis[0].alvo, prop: b.proporcional, mais: /Mais metas do mês/.test(t), nota: /proporcionais/.test(t) }; })()")
    confere('metas do mês proporcionais para quem começou no fim do mês; foco primeiro, resto recolhido', r['prop'] and r['alvo'] < 8 and r['mais'] and r['nota'], r)
    confere('sem erros de página (desafios)', not err, err[:2])
    await ctx.close()

    print('11. Ícones, compartilhamento com logo e posição, boneco da corrida e textos')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'e2d', tempo=ts(2026,11,24,18))
    P = await pg.evaluate(PLANOS + "(%d)" % SEG)
    r = await pg.evaluate("""(()=>{ const ico = id=>trophyIco(TROPHIES.find(t=>t.id===id)); return { rain: TROPHY_ICO.rain_check[0], walk: ico('walk_km_10'), run: ico('run_km_10'), walk10: ico('walk_10'), humble: TROPHY_ICO.humble[0], wk: TROPHY_ICO.weekend[0],
      longo: /textLength/.test(ico('run_km_500')), dupla: TROPHY_ICO.jun_semana1[0] !== TROPHY_ICO.dupla_1[0], todos: TROPHIES.every(t=>TROPHY_GLYPH[(TROPHY_ICO[t.id]||['medal'])[0]]) }; })()""")
    confere('ícones: cada conquista com desenho próprio (cansaço → bateria; km caminhados ≠ km corridos; juntos ≠ dupla)', r['rain'] == 'batt' and r['walk'] != r['run'] and r['walk'] != r['walk10'] and r['humble'] == 'shieldheart' and r['wk'] == 'calfds' and r['dupla'] and r['todos'], {k:v for k,v in r.items() if k not in ('walk','run','walk10')})
    confere('rótulos longos (500km) cabem no selo', r['longo'], r)
    r = await pg.evaluate("""(()=>{ weatherData = { temp:22, code:63, wind:5 }; state.active='run'; goTab('home'); const d = document.querySelector('#today-slot details.note-clima'); return { tem: !!d, aberto: !!(d && d.open), t: d ? d.innerText : '', h: d ? Math.round(d.getBoundingClientRect().height) : 0 }; })()""")
    confere('dicas de clima recolhidas: uma linha + "mais dicas" (não ocupam espaço demais)', r['tem'] and not r['aberto'] and 'dicas' in r['t'] and r['h'] < 130, r)
    logo = "data:image/svg+xml," + "%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23ff00ff'/%3E%3C/svg%3E"
    r = await pg.evaluate("""async (logo)=>{ coachMural = { foto: logo }; const x = { id:'ma', name:'Caminhada', at: Date.now(), duration:62.7, distance:5.42, module:'run', activity:'caminhada' };
      state.modules.run.history.push(x); const d = mtsDeHistorico(x); mtsAbrir(d); const chips = document.getElementById('modal-inner').innerText;
      MTS.logo = 'app'; const cv = document.createElement('canvas'); await mtsDesenhar(cv, d, MTS); const F = MTS_FORMATOS[MTS.fmt]; const W = F.w; const pad = W*0.075, ms = W*0.075, my = pad*0.9;
      const px = Array.from(cv.getContext('2d').getImageData(Math.round(pad+ms/2), Math.round(my+ms/2), 1, 1).data);
      MTS.logo = 'm'; await mtsDesenhar(cv, d, MTS); const px2 = Array.from(cv.getContext('2d').getImageData(Math.round(pad+ms/2), Math.round(my+ms*0.15), 1, 1).data);
      const foto = document.createElement('canvas'); foto.width = 800; foto.height = 1200; foto.getContext('2d').fillStyle = '#888'; foto.getContext('2d').fillRect(0,0,800,1200);
      MTS.foto = foto; mtsAbrir(d); const temPos = /posição dos dados/i.test(document.getElementById('modal-inner').innerText); MTS.pos = 'topo'; await mtsDesenhar(cv, d, MTS);
      let blob = null; try{ blob = await new Promise(r=>cv.toBlob(r, 'image/jpeg', .9)); }catch(e){}
      MTS.foto = null; MTS.pos = 'baixo'; closeModal(); return { marca: /Logo do MetaTreino/.test(chips), px, px2, temPos, blob: !!blob }; }""", logo)
    confere('compartilhar: usa a logo cadastrada no painel (sem cadastro novo) ou o "M", à escolha', r['marca'] and r['px'][0] > 200 and r['px'][2] > 200 and r['px'][1] < 60 and not (r['px2'][0] > 200 and r['px2'][2] > 200 and r['px2'][1] < 60), r)
    confere('com foto: escolhe a posição dos dados (embaixo / em cima) e a imagem continua exportável', r['temPos'] and r['blob'], r)
    r = await pg.evaluate("ICO_SVG.run")
    confere('boneco da corrida com duas pernas e dois braços (6 segmentos)', r.count('M11.6 13.1') == 2 and 'M9 21l2.5-5' not in r, r)
    r = await pg.evaluate("document.body.innerText")
    confere('texto: nada de "Depois do dia corrido"', 'Depois do dia corrido' not in r)
    confere('sem erros de página (ícones/compartilhar)', not err, err[:2])
    await ctx.close()

    print('12. Larguras 360 / 390 / 412 px × todos os temas')
    for w in (360, 390, 412):
        ctx = await b.new_context(viewport={'width':w,'height':800}, locale='pt-BR', timezone_id='America/Manaus')
        pg, err = await pagina(ctx, 'larg%d' % w, tempo=ts(2026,11,26,18))
        await pg.evaluate("mtSemente()"); await pg.clock.run_for(1500); await pg.evaluate("try{closeAwards()}catch(e){}; closeModal()")
        temas = await pg.evaluate("Object.keys(THEMES)")
        falhas = []
        for t in temas:
            await pg.evaluate("applyTheme('%s')" % t); await pg.clock.run_for(100)
            for aba in ('home','challenges','sessions','perf'):
                await pg.evaluate("goTab('%s')" % aba); await pg.clock.run_for(250)
                r = await pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1 && [...document.querySelectorAll('.screen.active .aw-anel, .screen.active .chal-sec, .screen.active #home-metrics')].every(e=>{ const r = e.getBoundingClientRect(); return r.right <= innerWidth + 1 && r.left >= -1; })")
                if not r: falhas.append((t, aba))
            if t in ('zepp','claro') and w in (360, 412):
                await pg.evaluate("goTab('home')"); await pg.clock.run_for(200); await pg.screenshot(path='/tmp/rc4-home-%s-%d.png' % (t, w), full_page=True)
                await pg.evaluate("goTab('challenges')"); await pg.clock.run_for(200); await pg.screenshot(path='/tmp/rc4-desafios-%s-%d.png' % (t, w), full_page=True)
        confere(f'{w} px: {len(temas)} temas × Início, Desafios, Treinos e Progresso sem nada vazando da tela', not falhas, falhas[:6])
        confere(f'{w} px: sem erros de página', not err, err[:2])
        await ctx.close()

async def main():
    etapas = sys.argv[2].split(',') if len(sys.argv) > 2 else ['1','2']
    async with async_playwright() as p:
        b = await p.chromium.launch()
        if '1' in etapas:
            print('===== ETAPA 1 — lógica, informações e confiabilidade')
            for f in [sono, tempos, sessoes, treinos_volta, inicio_duas, mes_assistente, semana_volume_sono]: await f(b)
        if '2' in etapas and 'etapa2' in globals():
            print('===== ETAPA 2 — conquistas, desafios e experiência'); await globals()['etapa2'](b)
        await b.close()
    print(f'\nRC 4: {ok} ok, {fal} falha(s)')
asyncio.run(main())

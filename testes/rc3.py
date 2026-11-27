# 2027 RC 3 — testes automatizados (Firebase simulado, navegador Chromium sem tela).
# Etapa 1: contas no mesmo aparelho, login estável, treino adicional, treino feito em outro dia, recordes,
#          esforço × cansaço, mensagens do assistente, descanso, equipamentos e dupla.
# Etapa 2: PDF série por série, volume de carga, compartilhamento, registro de atividades, cronômetro,
#          carga extra, duração, conquistas (visual).
# Etapa 3: sono, água em Alimentação, gráfico da Atividade da semana.
# Uso: python3 testes/rc3.py [URL]   (padrão http://localhost:8765/index.html)
# O relógio do navegador é controlado (page.clock) para simular dias seguidos.
import asyncio, sys, json
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
ok = fal = 0
def confere(n, c, d=''):
    global ok, fal
    if c: ok += 1; print('  ✅', n)
    else: fal += 1; print('  ❌', n, str(d)[:600])
FAM = "Object.keys(window.__mockFS).find(k=>k.startsWith('familias/'))"
USER = "window.__MOCK_USER = {uid:'%s', displayName:'%s', email:'%s@example.com', emailVerified:true}; window.__MOCK_SEM_DOC = false;"
PLANO = """(()=>{ const agora=Date.now();
 state.user.profile={nickname:'Teste',sex:'m',birth:'1996-01-01',age:30,height:175,currentWeight:80,goal:'massa',level:'iniciante',quiz_done:true};
 const setupL={goal:'hipertrofia',days:3,equip:'academia',level:'iniciante',selectedDays:[1,3,5]};
 state.modules.lift={setup:setupL,plan:generatePlan('lift',setupL),week:1,createdAt:agora-3*864e5,startAt:agora-3*864e5,history:[]};
 state.active='lift'; saveData(); goTab('home'); return 1; })()"""
SERIES = """((k, cargas)=>{ const w=state.modules.lift.plan.workouts.find(x=>x.k===k);
 w.exercises.slice(0,3).forEach((ex,i)=>{ openSetLog(ex.id, ex.name); curLog.entry.sets=(cargas||[20,22]).map(c=>({peso:c+i,reps:10})); closeSetLog(true); }); return w.exercises[0].id; })"""
SALVA = "((k, rpe)=>{ finishLiftWorkout(k); window.__rpe = rpe; confirmLiftWorkout(k); return state.modules.lift.history.length; })"

async def pagina(ctx, uid, nome='T', tempo=None, semente=False):
    pg = await ctx.new_page(); err = []; pg.on('pageerror', lambda e: err.append(str(e)))
    if tempo: await pg.clock.install(time=tempo)
    await pg.add_init_script(USER % (uid, nome, uid))
    await pg.goto(URL)
    if tempo: await pg.clock.run_for(3500)
    else: await pg.wait_for_timeout(2000)
    if semente: await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1200)
    await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); window.mtTem=()=>true; window.mtPremium=()=>true")
    return pg, err
async def espera(pg, ms, relogio):
    if relogio: await pg.clock.run_for(ms)
    else: await pg.wait_for_timeout(ms)

# ============================================================================ ETAPA 1
async def contas(b):
    print('1. Duas contas no mesmo aparelho (tema, conversa, dados) e saída limpa')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR')
    pg, err = await pagina(ctx, 'contaA', 'Ana', semente=True)
    await pg.evaluate("setTheme('oceano'); openAssistant()"); await pg.wait_for_timeout(1500)
    await pg.evaluate("maAskText ? null : null; maThread.push({who:'me', txt:'SEGREDO-DA-ANA'}); maSaveThread(); localStorage.setItem('mt_smart_fechado','x'); localStorage.setItem('mt_share_nome','1'); closeModal()")
    r = await pg.evaluate("({ tema: currentTheme(), thread: Object.keys(localStorage).filter(k=>k.startsWith('mt_ma_thread')) })")
    confere('conta A: tema Oceano e conversa guardada com a chave da conta', r['tema'] == 'oceano' and r['thread'] == ['mt_ma_thread_contaA'], r)
    await pg.add_init_script("if(sessionStorage.getItem('teste_saiu')) window.__MOCK_LOGGED_OUT = true;")
    await pg.evaluate("sessionStorage.setItem('teste_saiu','1'); doLogout()"); await pg.wait_for_timeout(3500)
    r = await pg.evaluate("({ tela: document.querySelector('.screen.active') && document.querySelector('.screen.active').id, tema: document.documentElement.getAttribute('data-theme'), salvo: localStorage.getItem('metatreino_theme'), pess: ['mt_smart_fechado','mt_share_nome','mt_ma_thread_contaA'].filter(k=>localStorage.getItem(k)!==null) })")
    confere('sair: página recarregada na tela de entrada, aparelho no tema padrão e marcas pessoais limpas', r['tela'] == 'scr-auth' and r['tema'] == 'zepp' and not r['salvo'] and r['pess'] == [], r)
    await pg.close()
    pg, err2 = await pagina(ctx, 'contaB', 'Bruno', semente=True)
    r = await pg.evaluate("(()=>{ openAssistant(); const t = document.getElementById('modal-inner') ? document.body.innerText : ''; return { tema: currentTheme(), email: state.user.email, nome: state.user.profile.nickname, conversaAna: /SEGREDO-DA-ANA/.test(JSON.stringify(maThread)) || /SEGREDO-DA-ANA/.test(t), smart: localStorage.getItem('mt_smart_fechado') }; })()")
    confere('conta B no mesmo aparelho: tema padrão, sem a conversa da A, sem marcas da A', r['tema'] == 'zepp' and r['email'] == 'contab@example.com' and not r['conversaAna'] and r['smart'] is None, r)
    await pg.evaluate("closeModal(); setTheme('rubi')"); await pg.wait_for_timeout(300)
    await pg.evaluate("doLogout()"); await pg.wait_for_timeout(3500); await pg.close()
    pg, err3 = await pagina(ctx, 'contaA', 'Ana')
    r = await pg.evaluate("({ tema: currentTheme(), email: state.user.email })")
    confere('A volta: tema da conta A (Oceano) restaurado pela conta, não o Rubi de B', r['tema'] == 'oceano' and r['email'] == 'contaa@example.com', r)
    confere('sem erros de página (contas)', not (err + err2 + err3), (err + err2 + err3)[:3])
    await ctx.close()

async def login(b):
    print('2. Login estável: aviso repetido do Firebase e versão nova não derrubam a sessão')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR')
    pg, err = await pagina(ctx, 'login1', semente=True)
    await pg.evaluate("goTab('profile')"); await pg.wait_for_timeout(300)
    await pg.evaluate("window.__boots = 0; const o = window.afterGoogleSignIn; window.afterGoogleSignIn = function(){ window.__boots++; return o.apply(this, arguments); }; fbAuth.__reemitir()"); await pg.wait_for_timeout(1500)
    r = await pg.evaluate("({ boots: window.__boots, tela: document.querySelector('.screen.active') && document.querySelector('.screen.active').id })")
    confere('Firebase avisa o mesmo login de novo: não refaz a entrada nem mostra a tela de login', r['boots'] == 0 and r['tela'] == 'scr-profile', r)
    r = await pg.evaluate("(()=>{ const vis = _podeAtualizarAgora(); Object.defineProperty(document, 'visibilityState', {value:'hidden', configurable:true}); const oculto = _podeAtualizarAgora(); curLog = {exId:'x', entry:{sets:[]}}; const emSerie = _podeAtualizarAgora(); curLog = null; Object.defineProperty(document, 'visibilityState', {value:'visible', configurable:true}); return { vis, oculto, emSerie }; })()")
    confere('versão nova: nunca recarrega com o app na tela; em segundo plano só fora de série/descanso', r == {'vis': False, 'oculto': True, 'emSerie': False}, r)
    src = await pg.evaluate("String(fbAuth.onAuthStateChanged)")
    confere('sem erros de página (login)', not err, err[:2])
    await ctx.close()

async def musculacao(b):
    print('3. Musculação: treino normal, adicional, dois dias depois, recordes e esforço')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Cuiaba')
    pg, err = await pagina(ctx, 'musc1', tempo='2026-11-23T18:00:00-04:00')   # segunda
    await pg.evaluate(PLANO)
    kA = await pg.evaluate("state.modules.lift.plan.workouts.find(w=>w.dayIdx===1).k")
    kB = await pg.evaluate("state.modules.lift.plan.workouts.find(w=>w.dayIdx===3).k")
    # cargas diferentes por série no primeiro treino
    ex0 = await pg.evaluate(SERIES + "('%s',[21,27,27])" % kA)
    pr = await pg.evaluate("state.prs['%s']" % ex0)
    confere('1º registro (21, 27, 27 kg) é a REFERÊNCIA de 27 kg, não recorde', pr and pr.get('ref') and pr['peso'] == 27, pr)
    await pg.evaluate(SALVA + "('%s', 8)" % kA)
    r = await pg.evaluate("({ t: state.trophies||[], total: mtPrTotal() })")
    confere('nenhuma conquista de recorde no primeiro treino (Primeiro PR / 5 PRs)', 'first_pr' not in r['t'] and 'pr_5' not in r['t'] and r['total'] == 0, r)
    await pg.evaluate("goTab('home')"); await espera(pg, 400, True)
    t = await pg.evaluate("document.getElementById('today-slot').innerText")
    confere('cartão do treino concluído mostra o ESFORÇO (8/10), não "Cansado"', 'Esforço 8/10' in t and 'Cansado' not in t, t[:300])
    # terça: o mesmo treino A de novo = adicional
    await pg.clock.fast_forward(86400000); await pg.clock.run_for(800)
    await pg.evaluate("selectSession('%s'); goTab('sessions')" % kA); await pg.clock.run_for(400)
    t = await pg.evaluate("document.getElementById('session-detail-slot').innerText")
    confere('treino já feito na semana: explica como fazer um treino adicional', 'treino adicional' in t, t[-300:])
    await pg.evaluate(SERIES + "('%s',[22,22])" % kA); await pg.evaluate("renderSessions()"); await pg.clock.run_for(300)
    t = await pg.evaluate("document.getElementById('session-detail-slot').innerText")
    confere('com séries registradas hoje aparece "Salvar treino adicional"', 'Salvar treino adicional' in t, t[-200:])
    n = await pg.evaluate(SALVA + "('%s', 6)" % kA)
    r = await pg.evaluate("(()=>{ const h = state.modules.lift.history; const x = h[h.length-1]; return { n: h.length, adicional: x.adicional, nome: x.name, total: state.stats.liftTotal, sem: mtAdesao(mtSemanaIni(Date.now()), Date.now()+1) }; })()")
    confere('treino adicional salvo como atividade real (histórico e total), marcado como adicional', r['n'] == 2 and r['adicional'] is True and r['total'] == 2, r)
    confere('adicional não conta como sessão do plano em dobro (vira "extra" na adesão)', r['sem']['feitos'] == 1 and r['sem']['extras'] == 1, r['sem'])
    pr = await pg.evaluate("state.prs['%s']" % ex0)
    confere('22 kg depois de referência 27 kg: não é recorde', pr.get('ref') and pr['peso'] == 27, pr)
    # treino B antecipado na terça
    await pg.evaluate(SERIES + "('%s')" % kB); await pg.evaluate(SALVA + "('%s', 6)" % kB)
    # quarta e quinta
    await pg.clock.fast_forward(86400000); await pg.clock.run_for(800); await pg.evaluate("goTab('home')"); await pg.clock.run_for(400)
    r = await pg.evaluate("({ hoje: document.getElementById('today-slot').innerText, smart: (document.getElementById('home-smart')||{}).innerText||'' })")
    confere('quarta (dia do B, feito na terça): Início mostra "treino da semana feito", não treino pendente', 'TREINO DA SEMANA FEITO' in r['hoje'] and 'ainda está em aberto' not in r['smart'], r)
    await pg.clock.fast_forward(86400000); await pg.clock.run_for(800); await pg.evaluate("goTab('home')"); await pg.clock.run_for(400)
    g = await pg.evaluate("[...document.querySelectorAll('#week-grid .day')].map(d=>d.innerText.replace(/\\n/g,' '))")
    confere('dois dias depois: segunda e quarta não aparecem como "faltou" (–)', not g[0].strip().endswith('–') and not g[2].strip().endswith('–'), g)
    await pg.evaluate("selectSession('%s'); goTab('sessions')" % kA); await pg.clock.run_for(300)
    t = await pg.evaluate("document.getElementById('session-detail-slot').innerText")
    confere('treino A continua "concluído" dois dias depois', 'Treino concluído' in t, t[-200:])
    # recorde real: semana seguinte, 28 kg
    await pg.clock.fast_forward(4*86400000); await pg.clock.run_for(800)   # segunda seguinte
    await pg.evaluate("selectSession('%s'); goTab('sessions')" % kA); await pg.clock.run_for(300)
    await pg.evaluate(SERIES + "('%s',[27,28])" % kA)
    pr = await pg.evaluate("state.prs['%s']" % ex0)
    confere('28 kg depois da referência 27 kg: recorde de verdade (1 quebra)', not pr.get('ref') and pr['peso'] == 28 and pr.get('quebras') == 1, pr)
    await pg.evaluate(SALVA + "('%s', 7)" % kA)
    r = await pg.evaluate("({ t: state.trophies||[], total: mtPrTotal() })")
    confere('"Primeiro PR" só agora, com um recorde real', 'first_pr' in r['t'] and 'pr_5' not in r['t'], r)
    # 3 dias seguidos com esforço alto, sem relato de cansaço → sem "Nem a Preguiça"
    for d in range(2):
        await pg.clock.fast_forward(86400000); await pg.clock.run_for(500)
        k = await pg.evaluate("state.modules.lift.plan.workouts[%d].k" % (d+1))
        await pg.evaluate("selectSession('%s')" % k); await pg.evaluate(SERIES + "('%s')" % k); await pg.evaluate(SALVA + "('%s', 8)" % k)
    r = await pg.evaluate("({ t: (state.trophies||[]).includes('rain_check'), seq: calcStreak(mtAllHist()) })")
    confere('3+ dias seguidos com esforço 8, sem relatar cansaço: sem "Nem a Preguiça"', r['t'] is False and r['seq'] >= 3, r)
    # relato real de cansaço + 3 dias seguidos depois
    await pg.evaluate("maTired()")
    for d in range(3):
        await pg.clock.fast_forward(86400000); await pg.clock.run_for(500)
        k = await pg.evaluate("state.modules.lift.plan.workouts[%d].k" % (d % 3))
        await pg.evaluate("selectSession('%s')" % k); await pg.evaluate(SERIES + "('%s',[30,31])" % k); await pg.evaluate(SALVA + "('%s', 6)" % k)
    r = await pg.evaluate("(state.trophies||[]).includes('rain_check')")
    confere('relatou cansaço ao assistente e treinou 3 dias seguidos depois: conquista liberada', r is True, r)
    confere('sem erros de página (musculação)', not err, err[:2])
    await ctx.close()

async def correcao(b):
    print('4. Conta com conquistas ganhas pelas regras antigas (correção única)')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR')
    pg, err = await pagina(ctx, 'corr1')
    await pg.evaluate(PLANO)
    r = await pg.evaluate("""(()=>{ const w = state.modules.lift.plan.workouts[0]; const t = Date.now() - 2*864e5;
      w.exercises.forEach((e,i)=>{ state.progress[e.id] = [{ date:t, sets:[{peso:20,reps:10}] }]; state.prs[e.id] = { peso:20, reps:10, at:t }; });
      state.modules.lift.history.push({ id:w.k, name:'Treino', at:t, duration:50, module:'lift', feel:'cansado', rpe:8, parts:w.parts, exercisesDone:[] });
      state.trophies = ['first_workout','first_pr','pr_5','rain_check']; state.trophyDates = { first_pr:t, pr_5:t, rain_check:t, first_workout:t }; delete state.rc3Corr;
      mtCorrecaoRC3(); return { t: state.trophies, rev: Object.keys(state.conqRevogadas||{}).sort(), refs: Object.values(state.prs).every(p=>p.ref) }; })()""")
    confere('correção: recordes viram referência e "Primeiro PR", "5 PRs" e "Nem a Preguiça" saem; o resto fica', r['t'] == ['first_workout'] and r['rev'] == ['first_pr','pr_5','rain_check'] and r['refs'], r)
    r = await pg.evaluate("(()=>{ const base = JSON.parse(JSON.stringify(state)); const velha = JSON.parse(JSON.stringify(state)); velha.trophies = ['first_workout','first_pr','pr_5']; delete velha.conqRevogadas; mesclaEstado(base, velha); return base.trophies; })()")
    confere('cópia antiga de outro aparelho não devolve as conquistas corrigidas', r == ['first_workout'], r)
    confere('sem erros de página (correção)', not err, err[:2])
    await ctx.close()

async def assistente(b):
    print('5. Meta Assistente: mensagem certa para o momento e atalhos que têm resposta')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR')
    pg, err = await pagina(ctx, 'ma1')
    await pg.evaluate(PLANO)
    k = await pg.evaluate("state.modules.lift.plan.workouts[0].k")
    r = await pg.evaluate("({ sug: maSugsHTML(), smart: (document.getElementById('home-smart')||{}).innerText||'' })")
    confere('conta nova: sem atalho "Minhas cargas estagnaram?" nem "Plano de retomada"', 'cargas estagnaram' not in r['sug'] and 'retomada' not in r['sug'], r['sug'][:300])
    await pg.evaluate(SERIES + "('%s',[60,62])" % k); await pg.evaluate(SALVA + "('%s', 9)" % k)
    r = await pg.evaluate("(()=>{ const m = fatigueMap(); return { fi: fatigueInsight(), alta: Object.keys(m).filter(x=>m[x]>=70) }; })()")
    confere('depois do treino: análise e recuperação (não "se notar queda de força hoje")', (not r['alta']) or (r['fi'] and 'Treino de hoje concluído' in r['fi'] and 'queda de força hoje' not in r['fi']), r)
    await pg.evaluate("goTab('home')"); await pg.wait_for_timeout(300)
    t = await pg.evaluate("(document.getElementById('home-smart')||{}).innerText||''")
    confere('Início sem "Ver minhas cargas" enquanto não há 3 sessões para analisar', 'Ver minhas cargas' not in t, t)
    confere('sem erros de página (assistente)', not err, err[:2])
    await ctx.close()

async def descanso(b):
    print('6. "Não vou treinar hoje": só o treino do dia, descanso ≠ falta')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Cuiaba')
    pg, err = await pagina(ctx, 'desc1', tempo='2026-11-24T10:00:00-04:00')   # terça (dia livre no plano 1-3-5)
    await pg.evaluate(PLANO)
    await pg.evaluate("goTab('sessions')"); await pg.clock.run_for(300)
    t = await pg.evaluate("document.getElementById('session-detail-slot').innerText")
    confere('dia sem treino no plano: não há "Não vou treinar hoje" (o treino mostrado é de outro dia)', 'Não vou treinar hoje' not in t, t[-200:])
    await pg.clock.fast_forward(86400000); await pg.clock.run_for(500)   # quarta: treino B
    kB = await pg.evaluate("state.modules.lift.plan.workouts.find(w=>w.dayIdx===3).k")
    await pg.evaluate("selectSession('%s'); skipWorkout('%s')" % (kB, kB)); await pg.clock.run_for(300)
    s = await pg.evaluate("state.skips[state.skips.length-1]")
    confere('pulo guarda o dia real do descanso e o treino', s['dayIdx'] == 3 and s['k'] == kB and s['planDay'] == 3, s)
    await pg.clock.fast_forward(86400000); await pg.clock.run_for(500); await pg.evaluate("goTab('home')"); await pg.clock.run_for(400)
    g = await pg.evaluate("[...document.querySelectorAll('#week-grid .day')].map(d=>d.innerText.replace(/\\n/g,' '))")
    confere('quinta: quarta aparece como descanso escolhido (não "faltou")', 'desc.' in g[2] and not g[2].strip().endswith('–'), g)
    kC = await pg.evaluate("state.modules.lift.plan.workouts.find(w=>w.dayIdx===5).k")
    r = await pg.evaluate("isSkippedToday(state.modules.lift.plan.workouts.find(w=>w.dayIdx===5))")
    confere('o treino de sexta não fica marcado como pulado', r is False, r)
    confere('sem erros de página (descanso)', not err, err[:2])
    await ctx.close()

async def dupla(b):
    print('7. Equipamentos e treino em dupla')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR')
    pg, err = await pagina(ctx, 'dp1', semente=True)
    await pg.evaluate("openTreinoDupla(); document.querySelector('.dp-eq').open = true"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("({ nomes: [...document.querySelectorAll('.dp-q > span')].map(s=>s.textContent), lista: EQUIP_LISTA.map(e=>e.nome) })")
    confere('lista de equipamentos da dupla = a mesma do cadastro (mesmos nomes, sem repetição)', sorted(r['nomes']) == sorted(r['lista']) and len(set(r['nomes'])) == len(r['nomes']), r)
    r = await pg.evaluate("(()=>{ duplaQtd('smith', 0); const su = state.modules.lift.setup; return { equip: su.equip, temSmith: (su.equipList||[]).includes('smith'), temPolia: (su.equipList||[]).includes('polia'), q: mtEquipQtd('smith') }; })()")
    confere('marcar Smith = 0 na dupla tira o Smith do plano (uma resposta só)', r['equip'] == 'custom' and not r['temSmith'] and r['temPolia'] and r['q'] == 0, r)
    r = await pg.evaluate("(()=>{ duplaQtd('smith', 1); return (state.modules.lift.setup.equipList||[]).includes('smith') && mtEquipQtd('smith') === 1; })()")
    confere('voltar para 1 devolve o Smith ao plano', r is True, r)
    # troca "só neste treino" não muda o que é publicado nem gera pendência
    r = await pg.evaluate("""(()=>{ const w = state.modules.lift.plan.workouts[0]; const i = w.exercises.findIndex(e=>exEstacao(e)); const orig = w.exercises[i];
        const stOrig = exEstacao(orig); const novo = Object.assign({}, orig, { id:'supino-reto-com-barra', name:'Supino Reto com Barra', troca:{ orig: JSON.parse(JSON.stringify(orig)), motivo:'ocupado' } });
        w.exercises[i] = novo; _duplaCfg().on = true; const pub = mtDuplaPublica(); const d = pub.d[String(w.dayIdx)];
        w.exercises[i] = orig; return { d, stOrig, temOrig: d.indexOf(stOrig + '@') >= 0 }; })()""")
    confere('troca "só neste treino" (equipamento ocupado) não muda o plano publicado para a outra pessoa', r['temOrig'], r)
    # parceiro com o mesmo aparelho, mas em fase diferente do treino → sem pendência; mesma fase → pendência
    r = await pg.evaluate("""(()=>{ const ws = state.modules.lift.plan.workouts; const w = ws[0]; const n = w.exercises.length; const i = w.exercises.findIndex(e=>exEstacao(e)); const st = exEstacao(w.exercises[i]);
        const fakeP = (pos)=>({ uid:'uB', nome:'Emilly', tr:{ on:true, q:{}, d:{ [String(w.dayIdx)]: st + '@' + pos.toFixed(2) } } });
        const orig = window._duplaParceiro; window._duplaParceiro = ()=>fakeP(i/n); const mesma = mtDuplaConflitos().filter(c=>!c.falta).length;
        window._duplaParceiro = ()=>fakeP(i/n < .5 ? .95 : 0); const longe = mtDuplaConflitos().filter(c=>!c.falta && c.dia===w.dayIdx && c.st===st).length;
        _duplaCfg().on = false; window._duplaParceiro = ()=>fakeP(i/n); const desligado = mtDuplaConflitos().filter(c=>!c.falta).length;
        window._duplaParceiro = orig; return { mesma, longe, desligado }; })()""")
    confere('mesmo aparelho na mesma fase do treino = pendência; em fases distantes = sem pendência', r['mesma'] >= 1 and r['longe'] == 0, r)
    confere('verificação de dupla desligada: nenhuma pendência de disputa', r['desligado'] == 0, r)
    # conquista em dupla: a outra pessoa publica horários que cruzam com os meus → desbloqueia aqui sem eu salvar nada
    await pg.evaluate("openNutri(); openFamilia(); famCriar()"); await pg.wait_for_timeout(1500)
    await pg.evaluate("closeModal(); _duplaCfg().on = true; _duplaCfg().conq = true; state.trophies = (state.trophies||[]).filter(t=>!/^dupla_|^sec_dupla/.test(t)); saveData()")
    r = await pg.evaluate(f"""(()=>{{ const x = state.modules.lift.history[state.modules.lift.history.length-1]; const ini = new Date(_mtInicio(x)); const p = v=>String(v).padStart(2,'0');
        const s = `${{ini.getFullYear()}}${{p(ini.getMonth()+1)}}${{p(ini.getDate())}}:${{p(ini.getHours())}}${{p(ini.getMinutes())}}:50:m`;
        const k = {FAM}; const d = window.__mockFS[k]; d.membros.push('uB'); d.nomes.uB = 'Emilly'; d.perfis.uB = {{ veg:false, lac:false, glu:false, tr:{{ on:true, d:{{}}, q:{{}}, s }} }}; window.__mockAvisa(k); return s; }})()""")
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("(state.trophies||[]).includes('dupla_1')")
    confere('conquista em dupla aparece no aparelho que não registrou nada (sincroniza pelo grupo)', r is True, r)
    confere('sem erros de página (dupla)', not err, err[:2])
    await ctx.close()

# ============================================================================ ETAPA 2
async def etapa2(b):
    print('8. Volume de carga, cards de compartilhamento e duração')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR')
    pg, err = await pagina(ctx, 'e2a', semente=True)
    r = await pg.evaluate("""(()=>{ const iso = (()=>{ for(const c of EX_BANK) for(const e of c.items) if(e.iso) return slug(e.name); })();
      const carga = 'remada-baixa-no-cabo'; const corpo = (()=>{ for(const c of EX_BANK) for(const e of c.items){ const id = slug(e.name); if(!e.iso && exTipoRegistro(id) !== 'carga') return id; } })();
      const V = mtVolumeEntradas([{exId:carga, sets:[{peso:21,reps:15},{peso:27,reps:15},{peso:27,reps:15},{peso:30,reps:0}]}, {exId:corpo, sets:[{peso:0,reps:12},{peso:10,reps:10}]}, {exId:iso, sets:[{peso:5,reps:45}]}]);
      return { V, iso, corpo }; })()""")
    V = r['V']
    confere('volume: só carga registrada × repetições (21/27/27 × 15 = 1.125 kg), sem inventar nem dobrar', V['kg'] == 1125, V)
    confere('peso do corpo não entra; carga extra entra separada (10 kg × 10)', V['kgExtra'] == 100, V)
    confere('exercício por tempo fora do volume; série sem repetições ignorada; séries e exercícios contados à parte', V['series'] == 6 and V['exercicios'] == 3 and V['reps'] == 45+12+10, V)
    r = await pg.evaluate("(()=>{ const h = state.modules.lift.history; const x = h[h.length-1]; const d = mtsDeHistorico(x); return { d, json: JSON.stringify(d) }; })()")
    confere('card de musculação: número principal = séries concluídas, sem "toneladas levantadas"', 'séries concluídas' in r['d']['hero']['u'] and 'tonelada' not in r['json'] and [n['l'] for n in r['d']['nums']] == ['Duração','Exercícios','Repetições'], r['d'])
    r = await pg.evaluate("(()=>{ const d = mtsDeSemana(); return d; })()")
    confere('card da semana: período da semana (sem data única) e cada atividade com o seu dia', r and r.get('data') is None and r['periodo'].startswith('Semana de') and len(r['lista']) == len(set(x['dia']+x['txt'] for x in r['lista'])) and all(x['dia'][:3] in ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'] for x in r['lista']), r)
    r = await pg.evaluate("(async()=>{ const cv = document.createElement('canvas'); await mtsDesenhar(cv, mtsDeSemana(), { fmt:'story', estilo:'escuro', disp:'destaque' }); await mtsDesenhar(cv, mtsDeSemana(), { fmt:'quadrado', estilo:'claro', disp:'compacto', nome:true }); return cv.width; })()")
    confere('card da semana desenha nos formatos (story/quadrado) sem erro', r > 0, r)
    r = await pg.evaluate("({ a: fmtDur(52), b: fmtDur(183, true), c: fmtDur(36+20/60), d: JSON.stringify(_mtsDur(183)), e: _fmtHoras(183), f: _atvFmtDur(3780) })")
    confere('duração no mesmo formato em todo lugar ("52 min", "3 h 03 min", "36 min 20 s")', r == {'a':'52 min','b':'3 h 03 min','c':'36 min 20 s','d':'{"v":"3 h 03","u":"min"}','e':'3 h 03 min','f':'1 h 03 min'}, r)
    await pg.evaluate("goTab('history')"); await pg.wait_for_timeout(400)
    t = await pg.evaluate("document.getElementById('history-list').innerText.slice(0,400)")
    confere('histórico usa o mesmo formato de duração', ' min' in t and not __import__('re').search(r'\d+min\b', t), t[:200])
    confere('sem erros de página (volume/cards)', not err, err[:2])
    await ctx.close()

    print('9. PDF série por série')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR')
    pg, err = await pagina(ctx, 'e2pdf')
    await pg.evaluate(PLANO)
    k = await pg.evaluate("state.modules.lift.plan.workouts[0].k")
    await pg.evaluate("""((k)=>{ const w = state.modules.lift.plan.workouts.find(x=>x.k===k); const ex = w.exercises[0]; openSetLog(ex.id, ex.name); curLog.entry.sets = [{peso:21,reps:15},{peso:27,reps:15},{peso:27,reps:15}]; closeSetLog(true); })('%s')""" % k)
    await pg.evaluate(SALVA + "('%s', 6)" % k)
    r = await pg.evaluate("""(async()=>{ const jsPDF = await _carregaJsPDF(); const txt = [];
      const J = function(o){ const d = new jsPDF(o); const t = d.text.bind(d); d.text = function(s){ [].concat(s).forEach(v=>txt.push(String(v))); return t.apply(d, arguments); }; return d; };
      arqMontarPDF(J, { per:'3m', lift:true, run:false, sess:true }, '', null); return txt.join('¦'); })()""")
    confere('PDF tem "Séries registradas" com 21 kg × 15, 27 kg × 15, 27 kg × 15 (cada série com a sua carga)', 'Séries registradas' in r and '1ª: 21 kg × 15 · 2ª: 27 kg × 15 · 3ª: 27 kg × 15' in r, [l for l in r.split('¦') if 'kg ×' in l][:3])
    confere('tabela de evolução diz que é a maior carga da sessão (não "Primeira/Última" série)', 'Maior na 1ª sessão' in r and 'Recorde' in r, '')
    confere('sem erros de página (PDF)', not err, err[:2])
    await ctx.close()

    print('10. Onde registrar atividades e importação do relógio')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR')
    pg, err = await pagina(ctx, 'e2reg', semente=True)   # musculação + corrida
    await pg.evaluate("state.active='lift'; goTab('sessions')"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("({ top: [...document.querySelectorAll('#sess-qlinks .qlink')].map(b=>b.textContent.trim()), rel: /Importar do relógio/.test(document.getElementById('scr-sessions').innerText) })")
    confere('Treinos sem o botão de registrar no topo; musculação sem "Importar do relógio"', not any('Registrar' in t or 'relógio' in t for t in r['top']) and not r['rel'], r)
    await pg.evaluate("goTab('history')"); await pg.wait_for_timeout(300)
    confere('histórico da musculação sem atalho de importar do relógio', await pg.evaluate("!document.getElementById('integ-hist')"))
    await pg.evaluate("state.active='run'; goTab('sessions')"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("(()=>{ const t = document.getElementById('session-detail-slot').innerText; const w = state.modules.run.plan.workouts[0]; openRunLog(String(w.dayIdx)); const imp = !!document.querySelector('#modal-inner #integ-atalho'); closeModal(); return { t: /Registrar/.test(t), imp, txt: t.slice(-160) }; })()")
    confere('com plano de corrida: registrar fica no treino (embaixo) e a tela tem "Importar do relógio"', r['t'] and r['imp'], r)
    await pg.evaluate("goTab('home')"); await pg.wait_for_timeout(300)
    confere('com plano de corrida: o Início não repete o botão de registrar', await pg.evaluate("!document.getElementById('home-registrar')"))
    await pg.evaluate("state.modules.run = null; state.active='lift'; saveData(); goTab('home')"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("(()=>{ const b = document.getElementById('home-registrar'); if(!b) return null; b.querySelector('button').click(); return { txt: b.innerText, imp: !!document.querySelector('#modal-inner #integ-atalho') }; })()")
    confere('sem plano de corrida: Início tem "Registrar atividade" avulsa, com importação do relógio', r and 'Registrar atividade' in r['txt'] and r['imp'], r)
    confere('sem erros de página (registro)', not err, err[:2])
    await ctx.close()

    print('11. Cronômetro dos exercícios por tempo e carga extra')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR')
    pg, err = await pagina(ctx, 'e2cron', tempo='2026-11-25T18:00:00-03:00', semente=True)
    iso = await pg.evaluate("(()=>{ for(const c of EX_BANK) for(const e of c.items) if(e.iso) return [slug(e.name), e.name]; })()")
    await pg.evaluate("openSetLog('%s', '%s'); addSet()" % (iso[0], iso[1])); await pg.clock.run_for(200)
    confere('série de exercício por tempo tem o botão ▶ de cronometrar', await pg.evaluate("!!document.querySelector('#modal-inner .set-cron')"))
    await pg.evaluate("mtCronIniciar(0)"); await pg.clock.run_for(32300)
    r = await pg.evaluate("({ seg: document.getElementById('cron-seg').textContent, feita: curLog.feitas[0] })")
    confere('contando: mostra o tempo e a série ainda não está concluída', r['seg'] == '32s' and r['feita'] is False, r)
    await pg.evaluate("mtCronPausar()"); await pg.clock.run_for(10000)
    r = await pg.evaluate("({ seg: _cronSeg(), st: document.getElementById('cron-st').textContent })")
    confere('pausado: o tempo para e o painel diz que ainda não foi registrado', r['seg'] == 32 and 'não registrado' in r['st'], r)
    await pg.evaluate("mtCronRetomar()"); await pg.clock.run_for(8000); await pg.evaluate("mtCronConcluir()"); await pg.clock.run_for(200)
    r = await pg.evaluate("({ reps: curLog.entry.sets[0].reps, feita: curLog.feitas[0] })")
    confere('concluir grava o tempo REAL contado (40 s) e só então marca a série', r == {'reps': 40, 'feita': True}, r)
    await pg.evaluate("addSet(); mtCronIniciar(1)"); await pg.clock.run_for(5000); await pg.evaluate("mtCronDescartar()")
    r = await pg.evaluate("({ feita: curLog.feitas[1], ativo: !!MT_CRON.exId })")
    confere('descartar não grava nem conclui a série', r == {'feita': False, 'ativo': False}, r)
    await pg.evaluate("mtCronIniciar(1)"); await pg.clock.run_for(3000)
    confere('contagem aberta fica guardada para detectar interrupção', await pg.evaluate("!!localStorage.getItem('mt_cron_ex')"))
    await pg.evaluate("closeSetLog(false)"); await pg.clock.run_for(300)
    confere('fechar o registro no meio da contagem = interrompida (nada concluído)', await pg.evaluate("!MT_CRON.exId && !localStorage.getItem('mt_cron_ex')"))
    corpo = await pg.evaluate("(()=>{ for(const c of EX_BANK) for(const e of c.items){ const id = slug(e.name); if(!e.iso && exTipoRegistro(id) === 'corpo') return [id, e.name]; } })()")
    await pg.evaluate("openSetLog('%s', '%s'); addSet()" % (corpo[0], corpo[1])); await pg.clock.run_for(200)
    r = await pg.evaluate("({ btn: !!document.querySelector('.sl-extra-btn'), campos: document.querySelectorAll('#modal-inner .set-row:not([style]) input').length })")
    confere('peso do corpo: botão "+ Usei carga extra" visível', r['btn'], r)
    await pg.evaluate("document.querySelector('.sl-extra-btn').click()"); await pg.clock.run_for(200)
    r = await pg.evaluate("({ campos: document.querySelectorAll('#modal-inner .set-row:not([style]) input').length, nota: !!document.querySelector('.sl-extra-nota') })")
    confere('carga extra abre o campo de kg com a explicação (peso do corpo não entra na conta)', r['campos'] >= 2 and r['nota'], r)
    await pg.evaluate("closeSetLog(false); openSetLog('%s', '%s'); mtCargaExtraOcultar(true)" % (corpo[0], corpo[1])); await pg.clock.run_for(200)
    r = await pg.evaluate("({ btn: !!document.querySelector('.sl-extra-btn'), pref: state.prefs.ocultarCargaExtra })")
    confere('"Ocultar": o botão some e a escolha fica na conta (state.prefs)', not r['btn'] and r['pref'] is True, r)
    await pg.evaluate("closeSetLog(false); goTab('profile')"); await pg.clock.run_for(300)
    t = await pg.evaluate("(document.getElementById('pf-cargaextra-row')||{}).textContent||''")
    confere('Perfil › Treino tem a opção para mostrar de novo', 'oculto' in t, t)
    confere('sem erros de página (cronômetro/carga extra)', not err, err[:2])
    await ctx.close()

    print('12. Conquistas: alinhamento em telas pequenas')
    for w in [360, 412]:
        ctx = await b.new_context(viewport={'width':w,'height':800}, locale='pt-BR')
        pg, err = await pagina(ctx, 'e2cq%d' % w, semente=True)
        await pg.evaluate("openTrophies()"); await pg.wait_for_timeout(900)
        r = await pg.evaluate("""(()=>{ const ch = [...document.querySelectorAll('.cq-filtros .filter-chip')].map(c=>c.scrollWidth <= c.clientWidth + 1);
          const tiles = [...document.querySelectorAll('#cq-grade-box .cq-grade')].flatMap(g=>{ const t = [...g.querySelectorAll('.cq-tile')]; const out = []; for(let i=0;i+1<t.length;i+=2){ const a = t[i], b = t[i+1];
            const m = x=>x.querySelector('.cq-med').getBoundingClientRect().top, n = x=>x.querySelector('.cq-nome').getBoundingClientRect().top, h = x=>x.getBoundingClientRect().height;
            out.push(Math.abs(m(a)-m(b)) < 1.5 && Math.abs(n(a)-n(b)) < 1.5 && Math.abs(h(a)-h(b)) < 1.5); } return out; });
          return { chips: ch.every(Boolean), pares: tiles.length, alinhados: tiles.filter(Boolean).length, larg: document.documentElement.scrollWidth <= innerWidth }; })()""")
        confere(f'{w}px: filtros sem corte, cartões lado a lado com medalha, nome e altura alinhados, sem rolagem lateral', r['chips'] and r['pares'] > 3 and r['alinhados'] == r['pares'] and r['larg'], r)
        await ctx.close()

# ============================================================================ ETAPA 3
async def etapa3(b):
    print('13. Sono: registro completo, incompleto, horários, histórico e gráficos')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR')
    pg, err = await pagina(ctx, 'e3sono', tempo='2026-11-26T08:00:00-03:00', semente=True)
    await pg.evaluate("goTab('home')"); await pg.clock.run_for(400)
    r = await pg.evaluate("({ agua: !!document.querySelector('#home-metrics .met[onclick*=\"openAgua\"]'), sono: (document.querySelector('#home-metrics .met-sono')||{}).innerText||'' })")
    confere('Início: o atalho da Água virou o do Sono', not r['agua'] and 'Sono' in r['sono'], r)
    await pg.evaluate("document.querySelector('#home-metrics .met-sono').click()"); await pg.clock.run_for(300)
    confere('tocar no Sono abre o registro da noite (com horário, qualidade e disposição)', await pg.evaluate("!!document.getElementById('sono-reg') && document.querySelectorAll('#sono-q5 button').length === 5 && document.querySelectorAll('#sono-d5 button').length === 5"))
    await pg.evaluate("document.getElementById('sono-dor').value='23:40'; document.getElementById('sono-aco').value='06:55'; _sonoTotal()")
    t = await pg.evaluate("document.getElementById('sono-total').textContent")
    confere('dormiu 23:40 e acordou 06:55 (passa da meia-noite): total 7 h 15 calculado na hora', t == 'Total: 7 h 15 de sono', t)
    await pg.evaluate("_sonoMarca5('q5',4); _sonoMarca5('d5',2); sonoRegSalva()"); await pg.clock.run_for(300)
    r = await pg.evaluate("sonoNoite(_sonoHoje())")
    confere('salva horários, total, qualidade (4 = Boa) e disposição (2 = Cansado), com os campos antigos coerentes', (r['h'] == 7.25 and r['q5'] == 4 and r['q'] == 3 and r['d5'] == 2 and r['d'] == 1), r)
    r = await pg.evaluate("(document.querySelector('#home-metrics .met-sono')||{}).innerText||''")
    confere('atalho do Início mostra a noite registrada', '7' in r and 'Boa' in r, r)
    r = await pg.evaluate("(()=>{ const dk = chaveDia(new Date(Date.now()-86400000)); sonoRegistrar(dk); _sonoMarca5('q5',2); sonoRegSalva(); return sonoNoite(dk); })()")
    confere('registro incompleto (só a qualidade) é aceito, sem inventar horas', {k:v for k,v in r.items() if k != 'em'} == {'q5':2,'q':1}, r)   # RC 6: 'em' = quando foi gravada
    r = await pg.evaluate("(()=>{ const dk = chaveDia(new Date(Date.now()-2*86400000)); sonoRegistrar(dk); document.getElementById('sono-dor').value='01:10'; sonoRegSalva(); return sonoNoite(dk); })()")
    confere('só o horário de dormir: guardado, sem total estimado', {k:v for k,v in r.items() if k != 'em'} == {'dor':'01:10'}, r)
    await pg.evaluate("""(()=>{ const S = sonoEst(); for(let i=3;i<40;i++){ const dk = chaveDia(new Date(Date.now()-i*86400000)); const dor = (i%3===0)?'00:30':'23:'+String(10+i%40).padStart(2,'0'); S.n[dk] = { dor, aco:'07:00', h: sonoHorasDe(dor,'07:00'), q5: 1+(i%5), q: [0,1,1,2,3,3][1+(i%5)], d5: 3, d:2 }; } saveData(); })()""")
    await pg.evaluate("openSono()"); await pg.clock.run_for(300)
    t = (await pg.evaluate("document.getElementById('sono-tela').innerText")).lower()
    confere('tela do sono: médias por semana e por mês, regularidade e sono × treinos', 'esta semana' in t and 'semana passada' in t and 'regularidade' in t and 'dormir (média)' in t and 'sono e atividade física' in t, t[:300])
    r = await pg.evaluate("(()=>{ const g = document.querySelector('#sono-tela .cd-graf svg'); return { barras: g.querySelectorAll('rect').length, linha: !!g.querySelector('polyline') }; })()")
    confere('gráfico: barras das noites e linha da média de 7 dias', r['barras'] > 20 and r['linha'], r)
    r = await pg.evaluate("(()=>{ const A = sonoAnalise(); return { boa:A.boa.length, ruim:A.ruim.length, tend:A.tend, dp:A.dpDor }; })()")
    confere('análise usa só os registros (sem valores inventados)', r['dp'] is not None, r)
    # uma noite ruim não muda o plano
    r = await pg.evaluate("(()=>{ const antes = JSON.stringify(state.modules.lift.plan); const dk = _sonoHoje(); sonoEst().n[dk] = { q5:1, q:1, h:4.5 }; saveData(); const s = sonoSinal(); goTab('home'); return { s: s && s.k, igual: antes === JSON.stringify(state.modules.lift.plan) }; })()")
    confere('uma noite ruim: só orientação, o plano de treino não muda', r['igual'] and r['s'] in ('noite','varias'), r)
    r = await pg.evaluate("(()=>{ const dk = chaveDia(new Date(Date.now()-3*86400000)); sonoRegistrar(dk); _sonoMarca5('d5',1); sonoRegSalva(); return mtRelatosCansaco().length; })()")
    confere('"acordei cansado(a)" conta como relato de cansaço (é o aluno que disse)', r >= 1, r)
    confere('sem erros de página (sono)', not err, err[:2])
    await ctx.close()

    print('14. Água em Alimentação e Atividade da semana')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR')
    pg, err = await pagina(ctx, 'e3ag', semente=True)
    await pg.evaluate("openNutri()"); await pg.wait_for_timeout(500)
    r = await pg.evaluate("({ bloco: !!document.getElementById('nutri-agua'), txt: (document.getElementById('nutri-agua')||{}).innerText||'' })")
    confere('Alimentação tem o bloco de hidratação (meta, progresso, +250/+500, 7 dias)', r['bloco'] and '+250' in r['txt'] and '+500' in r['txt'], r)
    await pg.evaluate("document.querySelectorAll('#nutri-agua .aguabtn')[1].click()"); await pg.wait_for_timeout(500)
    r = await pg.evaluate("({ ml: aguaHoje(), txt: (document.getElementById('nutri-agua')||{}).innerText||'' })")
    confere('+500 ml soma e o bloco atualiza dentro de Alimentação', r['ml'] == 500 and '0,5' in r['txt'], r)
    await pg.evaluate("closeModal(); goTab('home')"); await pg.wait_for_timeout(500)
    r = await pg.evaluate("(()=>{ const S = mtSemanaAtiv(); const el = document.getElementById('home-quick'); return { S, txt: el.innerText, cols: el.querySelectorAll('.aw-d').length, aneis: el.querySelectorAll('.act-rings').length }; })()")
    S = r['S']
    confere('Atividade da semana (RC 5): anéis de volta, sem repetir os 7 dias do quadro Semana', r['cols'] == 0 and r['aneis'] == 1, r['txt'][:200])
    confere('placar = treinos do PLANO (extras à parte), igual à regra do resto do app', S['feitos'] <= S['plan'] and f"{S['feitos']} de {S['plan']} treinos" in r['txt'], S)
    r = await pg.evaluate("(()=>{ const h = state.modules.lift.history; const ini = mtSemanaIni(Date.now()); const antes = mtSemanaAtiv(); h.push({ id:'X', name:'Treino A (adicional)', at: Date.now()-3600000, duration:30, module:'lift', adicional:true, exercisesDone:[] }); const depois = mtSemanaAtiv(); h.pop(); return { a: antes.feitos, d: depois.feitos, ex: depois.extras - antes.extras }; })()")
    confere('treino adicional não infla o placar do plano (entra como extra)', r['a'] == r['d'] and r['ex'] == 1, r)
    # RC 4: cada parte do cartão abre o próprio detalhe (dia, plano, semanas na meta)
    t = await pg.evaluate("(()=>{ let s=''; openAwDetalhe('dia',1); s+=document.getElementById('modal-inner').innerText; openAwDetalhe('dia',7); s+=document.getElementById('modal-inner').innerText; openAwDetalhe('semanas'); s+=document.getElementById('modal-inner').innerText; closeModal(); return s; })()")
    confere('detalhes: dia a dia (feito, faltou, descanso) e explicação das contas', 'Segunda' in t and 'Domingo' in t and 'Semanas na meta' in t, t[:200])
    for tema in ['claro','amoled','areia']:
        await pg.evaluate("closeModal(); applyTheme('%s', true); goTab('home')" % tema); await pg.wait_for_timeout(300)
        r = await pg.evaluate("(()=>{ const el = document.querySelector('#home-quick .act-card'); const r = el.getBoundingClientRect(); return { w: r.width, larg: document.documentElement.scrollWidth <= innerWidth }; })()")
        confere(f'tema {tema}: cartão da semana cabe na tela', r['w'] > 250 and r['larg'], r)
    confere('sem erros de página (água/semana)', not err, err[:2])
    await ctx.close()

async def main():
    etapas = sys.argv[2].split(',') if len(sys.argv) > 2 else ['1','2','3']
    async with async_playwright() as p:
        b = await p.chromium.launch()
        if '1' in etapas:
            print('===== ETAPA 1 — estabilidade e integridade dos dados')
            for f in [contas, login, musculacao, correcao, assistente, descanso, dupla]: await f(b)
        if '2' in etapas and 'etapa2' in globals():
            print('===== ETAPA 2 — cálculos, registros e experiência de treino'); await globals()['etapa2'](b)
        if '3' in etapas and 'etapa3' in globals():
            print('===== ETAPA 3 — sono, refinamento'); await globals()['etapa3'](b)
        await b.close()
    print(f'\nRC 3: {ok} ok, {fal} falha(s)')
asyncio.run(main())

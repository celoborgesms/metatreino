# 2027 RC 2 — vibração (casos separados), importação com esforço, corridas extras, sono, alcance no cardápio,
# desafio juntos, início enxuto, cadastro, Premium, Home e painel administrativo (verificações dirigidas).
# Uso: python3 testes/rc2.py [URL]   (padrão http://localhost:8765/index.html, Firebase simulado)
# Arquivo .fit com esforço: gerado na hora a partir de testes/amostras-atividades/corrida.fit (fit_com_rpe.py).
import asyncio, sys, json, os, subprocess, tempfile
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AM = os.path.join(RAIZ, 'testes', 'amostras-atividades')
ok = fal = 0
def confere(n, c, d=''):
    global ok, fal
    if c: ok += 1; print('  ✅', n)
    else: fal += 1; print('  ❌', n, str(d)[:500])
FAM = "Object.keys(window.__mockFS).find(k=>k.startsWith('familias/'))"

async def pagina(b, uid, init='', semente=True):
    ctx = await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True, locale='pt-BR', timezone_id='America/Sao_Paulo')
    if init: await ctx.add_init_script(init)
    pg = await ctx.new_page(); err = []; pg.on('pageerror', lambda e: err.append(str(e)))
    await pg.add_init_script("window.__MOCK_USER = {uid:'%s', displayName:'T', email:'%s@example.com', emailVerified:true}; window.__MOCK_SEM_DOC = false;" % (uid, uid))
    await pg.goto(URL); await pg.wait_for_timeout(1900)
    if semente: await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
    await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); window.mtTem=()=>true; window.mtPremium=()=>true")
    return ctx, pg, err

# ---------------------------------------------------------------- 1. vibração
async def vibracao(b):
    print('1. Vibração: casos separados')
    # (1) API inexistente
    ctx, pg, err = await pagina(b, 'v1', "delete Navigator.prototype.vibrate;")
    r = await pg.evaluate("(()=>{ openSomFim(); const mi = document.getElementById('modal-inner'); const vis = [...mi.querySelectorAll('button,.opt,.seg')].filter(b=>/^\\s*(Vibrar|Sem vibrar)\\s*$/.test(b.textContent) && b.offsetParent !== null).length; return { est: mtVibEstado(), vis, txt: mi.innerText, liga: restVibrarLigado() }; })()")
    confere('(1) API inexistente: estado "sem-api", sem botões de vibrar, aviso honesto', r['est'] == 'sem-api' and r['vis'] == 0 and 'não oferece vibração' in r['txt'] and r['liga'] is False, r)
    await ctx.close()
    # (2/3) API presente mas recusada pelo navegador
    ctx, pg, err = await pagina(b, 'v2', "Navigator.prototype.vibrate = function(){ return false; };")
    await pg.evaluate("openSomFim()"); await pg.click('#mt-vib-teste .btn'); await pg.wait_for_timeout(200)
    r = await pg.evaluate("document.getElementById('mt-vib-status').textContent")
    confere('(2/3) chamada recusada pelo navegador: diz que foi recusada (não finge que vibrou)', 'recusou' in r, r)
    await ctx.close()
    # (4) aceita pelo navegador, sem efeito físico → o aluno diz "não senti"
    GRAVA = "window.__vibs = []; Navigator.prototype.vibrate = function(p){ window.__vibs.push(JSON.stringify(p)); return true; };"
    ctx, pg, err = await pagina(b, 'v4', GRAVA)
    await pg.evaluate("localStorage.removeItem('mt_vib_ok'); openSomFim()"); await pg.click('#mt-vib-teste .btn'); await pg.wait_for_timeout(200)
    r = await pg.evaluate("({ t: document.getElementById('mt-vib-status').textContent, v: __vibs.slice(-1)[0] })")
    confere('(4) chamada aceita: pergunta "Sentiu?" (o navegador não sabe se o motor girou)', 'Sentiu' in r['t'] and r['v'] == '400', r)
    await pg.click('text=Não senti'); await pg.wait_for_timeout(300)
    r = await pg.evaluate("(()=>{ const mi = document.getElementById('modal-inner'); const vis = [...mi.querySelectorAll('button,.opt,.seg')].filter(b=>/^\\s*(Vibrar|Sem vibrar)\\s*$/.test(b.textContent) && b.offsetParent !== null).length; return { ok: localStorage.getItem('mt_vib_ok'), vis, liga: restVibrarLigado(), txt: mi.innerText }; })()")
    confere('"Não senti": vibração some deste aparelho (sem controle enganoso) e fica "Testar de novo"', r['ok'] == '0' and r['vis'] == 0 and r['liga'] is False and 'Testar de novo' in r['txt'], r)
    await pg.evaluate("closeModal(); __vibs = []; startRestTimer(30,'X')"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("getComputedStyle(document.querySelector('#rest-timer-banner .rt2-vib')).display")
    confere('cronômetro sem o botão de vibração neste aparelho', r == 'none', r)
    await pg.evaluate("restFimEm = Date.now() - 5"); await pg.wait_for_timeout(700)
    r = await pg.evaluate("__vibs")
    confere('fim do descanso não pede vibração quando ela não funciona aqui (som e tela continuam)', r == [], r)
    await pg.evaluate("openSomFim()"); await pg.click('text=Testar de novo'); await pg.wait_for_timeout(200)
    confere('"Testar de novo" volta a oferecer', await pg.evaluate("mtVibEstado() === 'nao-testado' && !!document.querySelector('#mt-vib-teste .btn')"))
    # (5) integração do cronômetro quando funciona
    await pg.click('#mt-vib-teste .btn'); await pg.click('text=Sim, vibrou'); await pg.wait_for_timeout(200)
    await pg.evaluate("closeModal(); localStorage.removeItem('mt_descanso_vibrar'); __vibs = []; startRestTimer(30,'X'); restFimEm = Date.now() - 5"); await pg.wait_for_timeout(700)
    r = await pg.evaluate("({ v: __vibs, d: (window.__vibDiag||[]).slice(-1)[0] })")
    confere('(5) cronômetro: no fim chama a vibração 1 vez, com a página visível e após interação', r['v'] == ['[300,120,300,120,300]'] and r['d'] and r['d']['vis'] == 'visible', r)
    confere('sem erros de página (vibração)', not err, err[:2])
    await ctx.close()

# ---------------------------------------------------------------- 2. importação com esforço
async def importacao(b):
    print('2. Importação: esforço percebido, plano e musculação')
    rpe7 = os.path.join(tempfile.gettempdir(), 'rc2-corrida-rpe7.fit')
    subprocess.run([sys.executable, os.path.join(RAIZ, 'testes', 'fit_com_rpe.py'), os.path.join(AM, 'corrida.fit'), rpe7, '7'], check=True)
    ctx, pg, err = await pagina(b, 'imp1')
    await pg.evaluate("openIntegracoes()"); await pg.set_input_files('#integ-arq', os.path.join(AM, 'corrida.fit')); await pg.wait_for_timeout(2500)
    r = await pg.evaluate("({ caixa: !!document.getElementById('ip-rpe'), marcado: document.querySelectorAll('#ip-rpe .rpe2-c.on').length, txt: (document.getElementById('ip-rpe')||{}).textContent || '', musc: !!document.querySelector('#ip-esp option[value=musculacao]') })")
    confere('FIT sem esforço: mostra a régua 1–10 do registro manual, sem nada marcado', r['caixa'] and r['marcado'] == 0 and 'opcional' in r['txt'], r)
    confere('modalidade "Musculação" saiu da importação', not r['musc'], r)
    await pg.click('text=Salvar atividade'); await pg.wait_for_timeout(1200)
    r = await pg.evaluate("(()=>{ const e = state.modules.run.history.find(x=>x.imp); return e ? { rpe: e.rpe === undefined ? 'nenhum' : e.rpe, id: e.id } : null; })()")
    confere('salvar sem responder: atividade sem esforço (nenhum valor inventado)', r and r['rpe'] == 'nenhum', r)
    idx = await pg.evaluate("state.modules.run.history.findIndex(x=>x.imp)")
    await pg.evaluate(f"openAtividade('run', {idx})"); await pg.wait_for_timeout(300)
    confere('detalhe da importação oferece "Informar o esforço percebido"', await pg.evaluate("/Informar o esforço percebido/.test(document.getElementById('modal-inner').innerText)"))
    await pg.evaluate(f"atvRpeDepois('run', {idx}); rpeSet(6); atvRpeDepoisSalva()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate(f"[state.modules.run.history[{idx}].rpe, state.modules.run.history[{idx}].rpeFonte]")
    confere('RPE manual depois da importação fica salvo (6/10, informado pelo aluno)', r == [6, 'aluno'], r)
    # duplicação
    await pg.evaluate("openIntegracoes()"); await pg.set_input_files('#integ-arq', os.path.join(AM, 'corrida.fit')); await pg.wait_for_timeout(2500)
    r = await pg.evaluate("({ dup: /já foi importada/.test(document.getElementById('modal-inner').innerText), salvar: [...document.querySelectorAll('#modal-inner .btn')].some(b=>/Salvar atividade/.test(b.textContent)) })")
    confere('mesmo arquivo de novo: avisa duplicata e não oferece salvar', r['dup'] and not r['salvar'], r)
    await pg.evaluate("atvCancela(); closeModal()")
    # musculação recusada
    r = await pg.evaluate("""(async()=>{ const o = ATV_FIT_SPORT.running; ATV_FIT_SPORT.running = 'musculacao';
       try{ const buf = await (await fetch('testes/amostras-atividades/corrida.fit')).arrayBuffer(); await atvProcessaArquivo(new File([buf], 'forca.fit')); return 'aceitou'; }
       catch(e){ return (e && e.usuario) || String(e); } finally{ ATV_FIT_SPORT.running = o; } })()""")
    confere('arquivo de musculação: explica que a importação saiu e manda registrar em Treinos', 'Registre o treino em Treinos' in r, r)
    confere('sem erros de página (importação 1)', not err, err[:2])
    await ctx.close()
    # FIT com workout_rpe
    ctx, pg, err = await pagina(b, 'imp2')
    await pg.evaluate("openIntegracoes()"); await pg.set_input_files('#integ-arq', rpe7); await pg.wait_for_timeout(2500)
    r = await pg.evaluate("({ txt: document.getElementById('modal-inner').innerText, regua: !!document.getElementById('ip-rpe') })")
    confere('FIT com esforço do relógio: mostra "7/10 · informado no relógio" e não pergunta', '7/10' in r['txt'] and 'informado no relógio' in r['txt'] and not r['regua'], r['txt'][-400:])
    await pg.click('text=Salvar atividade'); await pg.wait_for_timeout(1200)
    r = await pg.evaluate("(()=>{ const e = state.modules.run.history.find(x=>x.imp); return [e.rpe, e.rpeFonte]; })()")
    confere('esforço do relógio salvo (7, fonte relógio)', r == [7, 'relogio'], r)
    # treino do plano: iniciante importa a caminhada+corrida → leva tipo de sessão e estágio
    r = await pg.evaluate("""(()=>{ const run = state.modules.run; const w = run.plan.workouts[0]; w.motor = Object.assign({}, w.motor, { tipo:'camcorre', estagio:2 });
       const A = { formato:'fit', esporte:'corrida', inicio: Date.now() - 3600000, elapsedS:1800, movS:1800, km:3.2, melhores:{}, parciais:[], valido:true, avisos:[], track:[] };
       _atvAtual = { A, planoK: w.k, rpe: 6, rpeArq: null };
       const res = atvSalvar(A, { origem:'arquivo', hash:'teste-plano-rc2' });
       const e = run.history.find(x=>x.imp && x.imp.id === res.id); _atvAtual = null;
       return { id: e.id, k: w.k, tipo: e.tipoSessao, est: e.estagio, rpe: e.rpe }; })()""")
    confere('importação ligada ao plano leva tipo de sessão e estágio (conta para o iniciante avançar)', r['id'] == r['k'] and r['tipo'] == 'camcorre' and r['est'] == 2 and r['rpe'] == 6, r)
    confere('sem erros de página (importação 2)', not err, err[:2])
    await ctx.close()

# ---------------------------------------------------------------- 3. corridas extras
AVAL = """((cen)=>{
  const sem = rSem() - 7*DIA_MS; const D = 86400000;
  const M = JSON.parse(JSON.stringify(state.modules.run.plan.motor)); M.nivel = cen.nivel ?? 2; M.semanas = {}; M.semanas[sem] = { planejado: 3, fase:'base', vol: 120 }; M.hist = [];
  const H = cen.h.map(([dia, dur, km, rpe, extra, act])=>({ at: sem + dia*D + 18*3600000, duration: dur, distance: km, rpe, activity: act || 'corrida', id: extra ? 'livre' : 'S'+(dia+1), tipoSessao: extra ? undefined : 'leve', concluiu: extra ? undefined : 'sim', module:'run' }));
  const ctx = Object.assign({}, runCtx(), { run: Object.assign({}, state.modules.run, { history: H }) });
  const r = rAvaliarSemana(ctx, M, sem); return { d: r.decisao, m: r.motivo, cump: r.cump, ex: r.extras || null, rem: r.remanejados || 0 }; })"""
async def extras(b):
    print('3. Corrida: atividades fora do plano (alunos e intensidades diferentes)')
    ctx, pg, err = await pagina(b, 'ext1')
    cen = lambda h, nivel=2: pg.evaluate(AVAL, {'h': h, 'nivel': nivel})
    base = [[0,40,6,6,0],[2,40,6,6,0],[4,40,6,6,0]]
    r0 = await cen(base)
    confere('A — 3 de 3 treinos, esforço 6, sem extras: avança (motor igual ao de antes)', r0['d'] == 'avancar' and not r0['ex'], r0)
    r = await cen(base + [[5,45,7,8,1]])
    confere('B — + corrida extra de 7 km com esforço 8 no sábado: não conta como treino, mas a carga segura o avanço e é explicada', r['d'] == 'manter' and 'somaram bastante carga' in r['m'] and r['ex']['n'] == 1 and r['cump'] == 100, r)
    r = await cen(base + [[5,30,2.5,3,1,'caminhada']])
    confere('C — + caminhada leve: avança, a caminhada só aparece como extra (sem alerta)', r['d'] == 'avancar' and 'atividade extra' in r['m'], r)
    r = await cen([[0,40,6,6,0],[2,40,6,6,0],[5,40,6,6,1]])
    confere('D — faltou 1 treino, corrida extra parecida noutro dia: conta como remanejado (sem punir)', r['d'] == 'avancar' and r['rem'] == 1 and 'em outro dia' in r['m'], r)
    r = await cen([[0,40,6,6,0],[2,40,6,6,0],[5,10,1.5,5,1]])
    confere('E — faltou 1 treino, extra curto (10 min) não substitui: não avança', r['d'] == 'manter' and r['rem'] == 0, r)
    r = await cen(base + [[5,50,8,9,1]])
    confere('F — extra com esforço 9 não derruba o plano (não recua), só segura o avanço', r['d'] == 'manter', r)
    r = await cen([[0,30,3,5,0],[2,30,3,5,0],[4,30,3,5,0],[5,40,4,8,1]], 0)
    confere('G — iniciante (nível 0) com extra pesado: carga explicada, sem recuar', r['d'] in ('manter','avancar') and ('extra' in r['m'] or 'além do plano' in r['m']), r)
    r = await cen([[0,40,6,6,0],[2,40,6,6,0],[4,40,6,6,0],[5,40,6,6,0],[6,40,6,6,0]])
    confere('H — 5 treinos planejados (sem extra): igual ao motor de antes', r['d'] == 'avancar' and not r['ex'], r)
    # orientação do próximo treino
    # "agora" = terça desta semana, 20h; o treino é na quarta; o extra foi 6 h antes
    ori = """((x)=>{ const run = state.modules.run; const agora = rSem() + 86400000 + 20*3600000;
        run.plan.workouts = [{ k:'S9', name:x.nome, dayIdx: 3, duration:45, motor:{ tipo:x.tipo } }];
        run.history = run.history.filter(h=>h.id !== 'livre');
        run.history.push({ at: agora - 6*3600000, duration: x.dur, distance: x.km, rpe: x.rpe, activity: x.act, id:'livre', module:'run' });
        const o = rxOrientacao(agora); return o ? o.nivel + '|' + o.txt : null; })"""
    r = await pg.evaluate(ori, {'nome':'Treino de limiar','tipo':'limiar','dur':45,'km':7,'rpe':8,'act':'corrida'})
    confere('extra 7 km esforço 8 na véspera de treino intenso → atenção à recuperação (sem cortar)', r and r.startswith('atencao') and 'mais exigente fora do plano' in r and 'não foi cortado' in r, r)
    r = await pg.evaluate(ori, {'nome':'Treino de limiar','tipo':'limiar','dur':30,'km':4.5,'rpe':6,'act':'corrida'})
    confere('extra moderado na véspera de treino intenso → orientação leve', r and r.startswith('info') and 'atenção à recuperação' in r, r)
    r = await pg.evaluate(ori, {'nome':'Treino de limiar','tipo':'limiar','dur':40,'km':3.5,'rpe':3,'act':'caminhada'})
    confere('caminhada leve: nenhum aviso', r is None, r)
    r = await pg.evaluate(ori, {'nome':'Corrida leve','tipo':'leve','dur':45,'km':7,'rpe':8,'act':'corrida'})
    confere('extra pesado antes de treino leve: nenhum aviso desnecessário', r is None, r)
    confere('sem erros de página (extras)', not err, err[:2])
    await ctx.close()

# ---------------------------------------------------------------- 4. sono
async def sono(b):
    print('4. Sono e recuperação (opcional)')
    ctx, pg, err = await pagina(b, 'sono1')
    r = await pg.evaluate("(()=>{ const _gh = Date.prototype.getHours; Date.prototype.getHours = function(){ return 8; }; goTab('home'); _sonoHomeDesenha(); Date.prototype.getHours = _gh; return { on: sonoLigado(), card: !!document.getElementById('sono-manha'), st: runStatusCard ? 1 : 0 }; })()")
    confere('desligado por padrão: nada na Home', r['on'] is False and not r['card'], r)
    await pg.evaluate("goTab('perf')"); await pg.wait_for_timeout(300)
    confere('entrada discreta em Progresso › Sono e recuperação', await pg.evaluate("!!document.getElementById('sono-entrada')"))
    await pg.evaluate("openSono()"); await pg.wait_for_timeout(200)
    confere('tela explica antes de ligar (opcional, não médico, não corta treino)', await pg.evaluate("/nunca<\\/b> corta um treino|nunca corta um treino/.test(document.getElementById('modal-inner').innerHTML) && /não faz avaliação médica/.test(document.getElementById('modal-inner').innerText)"))
    await pg.evaluate("sonoLigar(true); closeModal()")
    r = await pg.evaluate("(()=>{ const _gh = Date.prototype.getHours; Date.prototype.getHours = function(){ return 8; }; goTab('home'); _sonoHomeDesenha(); const c = !!document.getElementById('sono-manha'); Date.prototype.getHours = function(){ return 20; }; _sonoHomeDesenha(); const noite = !!document.getElementById('sono-manha'); Date.prototype.getHours = _gh; return [c, noite]; })()")
    confere('ligado: pergunta de manhã na Home; à noite não aparece', r == [True, False], r)
    r = await pg.evaluate("(()=>{ const _gh = Date.prototype.getHours; Date.prototype.getHours = function(){ return 8; }; _sonoHomeDesenha(); sonoRapido(5); const some = !document.getElementById('sono-manha'); Date.prototype.getHours = _gh; const x = sonoNoite(chaveDia(new Date())); return [some, x.q, x.q5]; })()")
    confere('um toque registra a qualidade e o cartão some (RC 3: escala de 5; "Ótima" = q 3)', r == [True, 3, 5], r)
    r = await pg.evaluate("(()=>{ const a = chaveDia(new Date(Date.now() - 5*86400000)), b = chaveDia(new Date(Date.now() - 4*86400000)); sonoSalvar(a, { dor:'23:30', aco:'06:00' }); sonoSalvar(b, { h:7.5 }); return [sonoNoite(a).h, sonoNoite(b).h, sonoHorasDe('01:00','08:15')]; })()")
    confere('horas diretas ou horários (atravessando a meia-noite; RC 3: minutos exatos, 7 h 15 = 7,25)', r == [6.5, 7.5, 7.25], r)
    r = await pg.evaluate("(()=>{ const S = sonoEst(); const dk = i=>chaveDia(new Date(Date.now() - i*86400000)); S.n = {}; S.n[dk(0)] = { h:5.2, q:1 }; return [sonoSinal() && sonoSinal().k]; })()")
    confere('uma noite ruim → aviso de "noite", sem mexer no plano', r == ['noite'], r)
    planA = await pg.evaluate("JSON.stringify(state.modules.run.plan.workouts.map(w=>[w.k,w.duration,w.motor&&w.motor.tipo]))")
    r = await pg.evaluate("(()=>{ const S = sonoEst(); const dk = i=>chaveDia(new Date(Date.now() - i*86400000)); S.n[dk(1)] = { q:1, d:1 }; const s = sonoSinal(); const h = runStatusCard(); return [s.k, /🌙/.test(h || '')]; })()")
    planB = await pg.evaluate("JSON.stringify(state.modules.run.plan.workouts.map(w=>[w.k,w.duration,w.motor&&w.motor.tipo]))")
    confere('duas noites ruins → orientação de recuperação no cartão da corrida', r == ['varias', True], r)
    confere('o plano não mudou por causa do sono', planA == planB)
    r = await pg.evaluate("""(()=>{ const sem = rSem() - 7*DIA_MS; const S = sonoEst(); for(let i=0;i<5;i++){ S.n[chaveDia(new Date(sem + i*86400000 + 12*3600000))] = i < 3 ? { q:1 } : { q:3, h:8 }; }
        const M = JSON.parse(JSON.stringify(state.modules.run.plan.motor)); M.nivel = 2; M.semanas = {}; M.semanas[sem] = { planejado:3, fase:'base' }; M.hist = [];
        const H = [0,2,4].map(d=>({ at: sem + d*86400000 + 18*3600000, duration:40, distance:6, rpe:6, activity:'corrida', id:'S'+(d+1), tipoSessao:'leve', concluiu:'sim' }));
        const ctx = Object.assign({}, runCtx(), { run: Object.assign({}, state.modules.run, { history: H }) }); const r = rAvaliarSemana(ctx, M, sem); return [r.decisao, r.motivo]; })()""")
    confere('semana com 3 de 5 noites ruins: corrida mantém em vez de avançar, explicando', r[0] == 'manter' and 'noites registradas foram ruins' in r[1], r)
    await pg.evaluate("openSono()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("({ barras: document.querySelectorAll('#sono-tela svg rect').length, cards: document.getElementById('sono-tela').innerText })")
    confere('gráfico de 30 noites com barras e resumo (média, noites ruins, regularidade)', r['barras'] >= 3 and 'Média' in r['cards'] and 'Noites ruins' in r['cards'], r)
    r = await pg.evaluate("!!limpaParaNuvem(JSON.parse(JSON.stringify(state)),'estado',[]).sono.n")
    confere('sono vai para a nuvem (campo novo passa pela limpeza)', r)
    await pg.evaluate("closeModal(); sonoLigar(false); closeModal()")
    r = await pg.evaluate("[sonoSinal(), /🌙/.test(runStatusCard() || '')]")
    confere('desligado: sem sinais nem avisos (os registros ficam guardados)', r == [None, False], r)
    confere('sem erros de página (sono)', not err, err[:2])
    await ctx.close()

# ---------------------------------------------------------------- 5. alcance no cardápio compartilhado
async def alcance(b):
    print('5. Cardápio compartilhado: alcance das mudanças do administrador')
    ctx, pg, err = await pagina(b, 'adm1')
    await pg.evaluate("openNutri(); openFamilia(); famCriar()"); await pg.wait_for_timeout(1500)
    await pg.evaluate(f"""(()=>{{ const k = {FAM}; const d = window.__mockFS[k]; d.membros.push('uB'); d.nomes.uB = 'Emilly'; d.perfis.uB = {{ veg:false, lac:false, glu:false }}; window.__mockAvisa(k); }})()""")
    await pg.wait_for_timeout(600)
    # dia de hoje, refeição compartilhada com alimentos
    info = await pg.evaluate("(()=>{ const pl = nutriMontarPlano(nutriDiaSel()); const m = pl.refeicoes.find(x=>x.compartilhada); return m ? { mid:m.id, fid:m.itens[0].id, fid2:m.itens[1] && m.itens[1].id, chave:m.chave } : null; })()")
    confere('refeição compartilhada disponível', bool(info), info)
    await pg.evaluate("openNutri()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.querySelectorAll('#modal-inner .fam-alc').length, [...document.querySelectorAll('#modal-inner .fam-alc-b.on')].map(b=>b.dataset.v)]")
    confere('linha "Suas mudanças valem para" dentro das refeições compartilhadas (padrão: Perguntar)', r[0] >= 1 and set(r[1]) == {'perguntar'}, r)
    # perguntar com "lembrar"
    await pg.evaluate(f"nutriRemover('{info['mid']}','{info['fid']}')"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('sem preferência: pergunta uma vez, com "Lembrar esta escolha"', 'Lembrar esta escolha' in r, r[:200])
    await pg.click('text=Tirar do prato do grupo (todos)'); await pg.wait_for_timeout(800)
    r = await pg.evaluate(f"(()=>{{ const k = {FAM}; const d = window.__mockFS[k]; const dk = nutriKeyDia(nutriDiaSel()); return {{ alc: famAlcance(), x: ((d.cardapio||{{}})[dk]||{{}})['{info['mid']}'] }}; }})()")
    confere('escolha lembrada (grupo) e alimento tirado do prato do grupo', r['alc'] == 'grupo' and r['x'] and info['fid'] in r['x']['x'], r)
    confere('"Desfazer" aparece depois da mudança coletiva', await pg.evaluate("document.getElementById('mt-desfazer').classList.contains('on')"))
    await pg.evaluate("famDesfazerAgora()"); await pg.wait_for_timeout(800)
    r = await pg.evaluate(f"(()=>{{ const k = {FAM}; const d = window.__mockFS[k]; const dk = nutriKeyDia(nutriDiaSel()); const c = ((d.cardapio||{{}})[dk]||{{}})['{info['mid']}']; return c ? c.x : []; }})()")
    confere('Desfazer devolve o alimento ao prato do grupo', info['fid'] not in (r or []), r)
    # com preferência "grupo": não pergunta de novo
    await pg.evaluate(f"nutriRemover('{info['mid']}','{info['fid2']}')"); await pg.wait_for_timeout(600)
    r = await pg.evaluate("/Lembrar esta escolha/.test(document.getElementById('modal-inner').innerText)")
    confere('com a preferência definida, não pergunta de novo', not r, r)
    # mudar para "só para mim" com um toque
    await pg.evaluate("openNutri()"); await pg.wait_for_timeout(300)
    await pg.evaluate("document.querySelector('#modal-inner .fam-alc-b[data-v=eu]').click()"); await pg.wait_for_timeout(200)
    antes = await pg.evaluate(f"JSON.stringify(window.__mockFS[{FAM}].cardapio||{{}})")
    await pg.evaluate(f"nutriRemover('{info['mid']}','{info['fid']}')"); await pg.wait_for_timeout(600)
    r = await pg.evaluate(f"({{ alc: famAlcance(), grupo: JSON.stringify(window.__mockFS[{FAM}].cardapio||{{}}), meu: (nutriMealLog('{info['mid']}', false)||{{}}).adj }})")
    confere('"Só para mim": tira só do seu prato; o prato do grupo não muda', r['alc'] == 'eu' and r['grupo'] == antes and r['meu'] and r['meu'].get(info['fid'], {}).get('x'), r)
    # trocar prato com "só para mim" → fora só neste dia
    await pg.evaluate(f"nutriTrocar('{info['chave']}')"); await pg.wait_for_timeout(600)
    r = await pg.evaluate(f"(()=>{{ const dk = nutriKeyDia(nutriDiaSel()); return {{ fora: famFora(dk, '{info['mid']}'), trocas: JSON.stringify(((window.__mockFS[{FAM}].config||{{}}).trocas)||{{}}) }}; }})()")
    confere('trocar o prato com "Só para mim": troca só o seu, neste dia; o grupo não muda', r['fora'] and r['trocas'] in ('{}', 'null'), r)
    # membro comum não altera o prato do grupo
    r = await pg.evaluate(f"(()=>{{ const k = {FAM}; window.__mockFS[k].dono = 'uB'; window.__mockAvisa(k); return 1; }})()")
    await pg.wait_for_timeout(600)
    r = await pg.evaluate(f"(()=>{{ openNutri(); return {{ adm: famSouAdm(), linha: document.querySelectorAll('#modal-inner .fam-alc').length }}; }})()")
    confere('quem não é administrador não vê o controle de alcance', r['adm'] is False and r['linha'] == 0, r)
    confere('sem erros de página (cardápio)', not err, err[:2])
    await ctx.close()

# ---------------------------------------------------------------- 6. desafio juntos
async def desafio(b):
    print('6. Desafio juntos e conquistas cooperativas')
    ctx, pg, err = await pagina(b, 'dj1')
    await pg.evaluate("openNutri(); openFamilia(); famCriar()"); await pg.wait_for_timeout(1500)
    await pg.evaluate(f"""(()=>{{ const k = {FAM}; const d = window.__mockFS[k]; d.membros.push('uB'); d.nomes.uB = 'Emilly'; d.perfis.uB = {{ veg:false, lac:false, glu:false }}; window.__mockAvisa(k); }})()""")
    await pg.wait_for_timeout(600)
    await pg.evaluate("openFamilia()"); await pg.wait_for_timeout(300)
    confere('seção "Desafio juntos" dentro de Meu grupo, com explicação de privacidade', await pg.evaluate("/Desafio juntos/.test(document.getElementById('modal-inner').innerText) && /Nada de cargas, distâncias, peso ou alimentação/.test(document.getElementById('modal-inner').innerText)"))
    await pg.evaluate("djEntrar()"); await pg.wait_for_timeout(200)
    await pg.click('text=3 dias por semana'); await pg.wait_for_timeout(1500)
    r = await pg.evaluate(f"(()=>{{ const k = {FAM}; const p = window.__mockFS[k].perfis[_famUid()]; return p && p.dj ? Object.keys(p.dj).sort() : null; }})()")
    confere('o grupo recebe só meta, semanas (contagem), início e prova (nada de treino detalhado)', r and set(r) <= {'on','m','d','s','p'}, r)
    # Emilly entra com meta própria (outra modalidade) e as duas semanas passadas bateram
    r = await pg.evaluate(f"""(()=>{{ const D = djEst(); const sem = rSem(); D.desde = sem - 28*86400000; D.meta = 2; saveData();
        const run = state.modules.run; run.history = run.history || [];
        for(let w=4; w>=1; w--){{ for(let i=0;i<3;i++) run.history.push({{ at: sem - w*7*86400000 + i*2*86400000 + 3600000, duration:30, distance:4, rpe:5, activity:'corrida', id:'livre', module:'run' }}); }}
        const s = {{}}; for(let w=1; w<=4; w++) s[String(sem - w*7*86400000)] = 4; s[String(sem)] = 1;
        const k = {FAM}; window.__mockFS[k].perfis.uB.dj = {{ on:1, m:3, d: sem - 28*86400000, s }}; window.__mockAvisa(k); return 1; }})()""")
    await pg.wait_for_timeout(700)
    r = await pg.evaluate("(()=>{ const W = djSemanas(); return { n: W.P.length, juntas: W.juntas.length, seg: W.seguidas, minhas: djMinhasSessoes() }; })()")
    confere('cada um com a própria meta: semanas juntos contadas quando todos bateram', r['n'] == 2 and r['juntas'] == 4 and r['seg'] == 4, r)
    await pg.evaluate("checkTrophies()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("['jun_semana1','jun_10','jun_4sem'].map(id=>!!(state.trophies||{})[id] || !!(state.stats && state.stats.trophies && state.stats.trophies[id]) || (typeof hasTrophy==='function' && hasTrophy(id)))")
    r2 = await pg.evaluate("['jun_semana1','jun_10','jun_4sem'].filter(id=>JSON.stringify(state).includes('\"'+id+'\"'))")
    confere('conquistas: Primeira Semana Juntos, Dez no Desafio e Quatro Semanas Juntos', len(r2) == 3, [r, r2])
    await pg.evaluate("openFamilia()"); await pg.wait_for_timeout(300)
    t = await pg.evaluate("document.getElementById('dj-box').innerText")
    confere('tela mostra "Você" e a outra pessoa só com contagem/meta (sem ranking)', 'Você' in t and 'Emilly' in t and '/3' in t and 'ranking' not in t.lower(), t)
    confere('sem erros de página (desafio)', not err, err[:2])
    await ctx.close()

# ---------------------------------------------------------------- 7. início, cadastro, Premium, admin (dirigidos)
async def areas(b):
    print('7. Início enxuto, cadastro, Premium e painel (verificações dirigidas)')
    ctx, pg, err = await pagina(b, 'novo1', semente=False)
    await pg.wait_for_timeout(800)
    r0 = await pg.evaluate("Array.isArray(state.inicioOcultos)")
    confere('abrir o app não mexe na Home (o padrão enxuto só vale ao concluir o cadastro)', r0 is False, r0)
    r = await pg.evaluate("(()=>{ state.modules.lift && (state.modules.lift.history = []); state.modules.run && (state.modules.run.history = []); delete state.inicioPadraoRC2; mtInicioPadraoNovo(); return { oc: state.inicioOcultos, flag: state.inicioPadraoRC2 }; })()")
    confere('conta nova: Home começa enxuta (Água, Frase e Fase do plano desligados; dá para ligar)', isinstance(r['oc'], list) and set(r['oc']) == {'agua','frase','plano'}, r)
    await ctx.close()
    ctx, pg, err = await pagina(b, 'velho1')
    r = await pg.evaluate("(()=>{ delete state.inicioPadraoRC2; mtInicioPadraoNovo(); return { oc: state.inicioOcultos || [], hist: state.modules.run.history.length + state.modules.lift.history.length }; })()")
    confere('conta com histórico: a Home não muda', 'agua' not in r['oc'] and r['hist'] > 0, r)
    # Premium: ao perder o acesso, os dados ficam e o treino continua executável
    r = await pg.evaluate("""(()=>{ const antes = JSON.stringify({ h: state.modules.lift.history.length, r: state.modules.run.history.length, p: Object.keys(state.progress||{}).length });
        delete window.mtTem; delete window.mtPremium;
        try{ state.user.plano = 'gratuito'; state.user.premiumAte = Date.now() - 86400000; }catch(e){}
        const depois = JSON.stringify({ h: state.modules.lift.history.length, r: state.modules.run.history.length, p: Object.keys(state.progress||{}).length });
        const e = state.modules.lift.plan.workouts[0].exercises[0]; let abriu = false; try{ openSetLog(e.id, e.name); abriu = !!document.querySelector('#modal-inner'); closeModal(); }catch(x){}
        return { igual: antes === depois, abriu }; })()""")
    confere('Premium encerrado: histórico preservado e o registro do treino continua abrindo', r['igual'] and r['abriu'], r)
    confere('sem erros de página (áreas)', not err, err[:2])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for f in (vibracao, importacao, extras, sono, alcance, desafio, areas):
            try: await f(b)
            except Exception as e: confere(f'{f.__name__}: execução sem exceção', False, repr(e)[:400])
        await b.close()
    print(f'\nRC 2: {ok} ok, {fal} falha(s)')
asyncio.run(main())

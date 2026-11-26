# 2027 RC 0 — cardápio compartilhado (nome), alimentos novos, cronômetro circular/minimizado,
# jornada do iniciante na corrida e orientação de progressão na musculação.
# Uso: python3 testes/rc0.py [URL]   (padrão http://localhost:8765/index.html, Firebase simulado)
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
FOTOS = sys.argv[2] if len(sys.argv) > 2 else None
ok = fal = 0
def confere(n, c, d=''):
    global ok, fal
    if c: ok += 1; print('  ✅', n)
    else: fal += 1; print('  ❌', n, str(d)[:400])

SOM = """
window.__sons = 0; window.__vib = 0;
const _AC = window.AudioContext; window.AudioContext = function(){ const c = new _AC(); const o = c.createOscillator.bind(c); c.createOscillator = function(){ window.__sons++; return o(); }; return c; };
navigator.vibrate = function(){ window.__vib++; return true; };
"""

async def pagina(b, uid, w=390, h=844):
    ctx = await b.new_context(viewport={'width':w,'height':h}, device_scale_factor=2, is_mobile=True, has_touch=True)
    await ctx.add_init_script(SOM)
    pg = await ctx.new_page()
    err = []; pg.on('pageerror', lambda e: err.append(str(e)))
    await pg.add_init_script("window.__MOCK_USER = {uid:'%s', displayName:'T', emailVerified:true};" % uid)
    await pg.goto(URL); await pg.wait_for_timeout(1800); await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
    await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); window.mtTem=()=>true; window.mtPremium=()=>true")
    return pg, err

async def alimentacao(pg):
    print('1. Cardápio compartilhado e alimentos novos')
    r = await pg.evaluate("""(()=>{ const src = [openFamilia, openMinhaCasa, mtPerfilCasa, famCriar, famSair, nutriListaCompras].map(f=>String(f)).join('\\n');
      return (src.match(/[^\\w](da casa|Minha casa|grupo da casa|Alimentação da casa)/g)||[]); })()""")
    confere('nenhum texto "da casa" nas telas do grupo', len(r) == 0, r)
    await pg.evaluate("goTab('profile')"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("(document.getElementById('pf-casa-row')||{}).textContent || ''")
    confere('Perfil mostra "Meu grupo"', 'Meu grupo' in r, r)
    await pg.evaluate("openMinhaCasa()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('tela do grupo sem "casa" e com "Criar o grupo"', 'Criar o grupo' in r and 'casa' not in r.lower().replace('em casa',''), r[:300])
    await pg.evaluate("closeModal()")
    novos_s = ['batataair','batatadoceair','quinoa','chia','linhaca','iogurtegrego','kefir','frangoassado','ovopoche','abobrinha','berinjela','espinafre','couve','beterraba','pepino','kiwi','ameixa','melao','paofermnat','crepioca','leitesemi','leitezero','vitamina']
    novos_f = ['miojo','calabresa','bacon','bala','pipocamicro','salsicha','nuggets','empada','esfiha','picoleleite','pirulito','chiclete','achocpo','achoccaixa','leitecondensado']
    r = await pg.evaluate("(ids)=>ids.filter(id=>!NUTRI_ALIMENTOS[id])", novos_s + novos_f)
    confere('todos os alimentos pedidos existem', r == [], r)
    r = await pg.evaluate("(ids)=>ids.filter(id=>NUTRI_FORA_IDS.has(id) || NUTRI_CATEG.fora[1].includes(id))", novos_s)
    confere('saudáveis NÃO estão em "fora da rotina"', r == [], r)
    r = await pg.evaluate("(ids)=>ids.filter(id=>!(NUTRI_FORA_IDS.has(id) && NUTRI_CATEG.fora[1].includes(id)))", novos_f)
    confere('ultraprocessados estão em "fora da rotina"', r == [], r)
    r = await pg.evaluate("(ids)=>ids.filter(id=>!Object.entries(NUTRI_CATEG).some(([k,v])=>k!=='fora' && v[1].includes(id)))", novos_s)
    confere('saudáveis estão numa categoria normal', r == [], r)
    r = await pg.evaluate("""(ids)=>ids.map(id=>{ const f=NUTRI_ALIMENTOS[id]; const k=f[2]*4+f[3]*4+f[4]*9; return [id, f[1], Math.round(k)]; }).filter(([id,a,b])=>Math.abs(a-b) > Math.max(8, a*0.15))""", novos_s + novos_f)
    confere('calorias batem com os macros (até 15%, fibra das sementes e verduras)', r == [], r)
    # nunca no cardápio nem na lista de compras
    r = await pg.evaluate("""(ids)=>{ const s = new Set(); NUTRI_REFEICOES.forEach(r=>[...(r.opcoes||[]), ...(r.veg||[])].forEach(o=>o.i.forEach(([id])=>s.add(id)))); return ids.filter(id=>s.has(id)); }""", novos_f)
    confere('ultraprocessados nunca aparecem no cardápio', r == [], r)
    # troca por equivalente: saudáveis podem aparecer; ultraprocessados não
    r = await pg.evaluate("""(()=>{ const out = new Set(); const fora = [];
      [['almoco','arroz',150],['almoco','batataing',200],['almoco','frango',120],['cafe','pao',1],['cafe','iogurte',170],['lanche1','banana',1],['almoco','legumes',120],['cafe','leite',200],['lanche1','maca',1]].forEach(([m,id,q])=>{
        subCandidatos(m,id,q).lista.forEach(c=>{ out.add(c.id); if(NUTRI_FORA_IDS.has(c.id)) fora.push(c.id); }); });
      return {novos:[...out].filter(id=>NUTRI_RC0_SAUDAVEIS[id]), fora}; })()""")
    confere('troca por equivalente sugere alimentos novos saudáveis', len(r['novos']) >= 3, r)
    confere('troca nunca sugere "fora da rotina"', r['fora'] == [], r)
    r = await pg.evaluate("NUTRI_LACTOSE.includes('leitezero') ? 'erro' : (NUTRI_LACTOSE.includes('kefir') && NUTRI_LACTOSE.includes('iogurtegrego') && NUTRI_GLUTEN.includes('paofermnat') && NUTRI_GLUTEN.includes('miojo') ? 'ok' : 'falta')")
    confere('lactose/glúten marcados (leite sem lactose liberado)', r == 'ok', r)
    r = await pg.evaluate("""(()=>{ window.__nutriAddBusca='miojo'; window.__nutriAddCat='todos'; const d=document.createElement('div'); d.id='nadd-lista'; document.body.appendChild(d);
       nutriAddFiltra(); const a = d.textContent; window.__nutriAddBusca='air fryer'; nutriAddFiltra(); const b = d.textContent; window.__nutriAddBusca='toddynho'; nutriAddFiltra(); const c = d.textContent; d.remove(); return [a.includes('Miojo'), b.includes('air fryer'), c.includes('achocolatada')]; })()""")
    confere('busca acha miojo, "air fryer" e toddynho', all(r), r)
    r = await pg.evaluate("nutriEquivalencias().map(g=>g.l.join('|')).join('||')")
    confere('equivalências incluem quinoa e frango assado', 'Quinoa' in r and 'Frango assado' in r, r[:200])

async def cronometro(pg):
    print('2. Cronômetro circular')
    await pg.evaluate("localStorage.removeItem('mt_descanso_mudo'); restMuted=false; localStorage.removeItem('mt_descanso_auto'); goTab('sessions')")
    await pg.evaluate("window.__ints = 0; const _si = window.setInterval; window.setInterval = function(f,ms){ if(ms===250) window.__ints++; return _si(f,ms); }")
    await pg.evaluate("(()=>{ const e = state.modules.lift.plan.workouts[0].exercises[0]; window.__ex = e; openSetLog(e.id, e.name); addSet(); concluirSerie(0); })()"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("(()=>{ const el = document.getElementById('rest-timer-banner'); return el ? { doca: el.classList.contains('doca'), dentro: !!el.closest('#modal-inner'), anel: !!el.querySelector('.rt2-arco'), t: el.querySelector('.rt-tempo').textContent } : null; })()")
    confere('no registro de séries o cronômetro fica dentro da tela, com anel e tempo', r and r['doca'] and r['dentro'] and r['anel'] and ':' in r['t'], r)
    r = await pg.evaluate("(()=>{ const el = document.getElementById('rest-timer-banner').getBoundingClientRect(); const s = [...document.querySelectorAll('#modal-inner .btn')].find(b=>b.textContent.trim()==='Salvar').getBoundingClientRect(); return el.bottom <= s.top; })()")
    confere('não cobre o botão Salvar', r, r)
    fim1 = await pg.evaluate("restFimEm")
    await pg.evaluate("updateSet(0,'reps','12'); renderSetLogModal()"); await pg.wait_for_timeout(400)
    r = await pg.evaluate(f"({{ n: document.querySelectorAll('#rest-timer-banner').length, dentro: !!document.querySelector('#modal-inner #rest-timer-banner'), mesmo: restFimEm === {fim1} }})")
    confere('redesenhar o registro mantém um cronômetro só, no lugar, sem reiniciar', r['n'] == 1 and r['dentro'] and r['mesmo'], r)
    await pg.evaluate("closeModal()"); await pg.wait_for_timeout(450)
    r = await pg.evaluate("(()=>{ const el = document.getElementById('rest-timer-banner'); const b = el.querySelector('.rt2-mini').getBoundingClientRect(); const f = document.getElementById('ma-fab'); const fr = f ? f.getBoundingClientRect() : null; return { min: el.classList.contains('min'), alt: Math.round(b.height), larg: Math.round(b.width), cobreFab: fr ? !(b.right <= fr.left || b.left >= fr.right || b.bottom <= fr.top || b.top >= fr.bottom) : false }; })()")
    confere('ao sair do registro vira a pílula pequena, sem cobrir o assistente', r['min'] and r['alt'] <= 48 and r['larg'] <= 160 and not r['cobreFab'], r)
    r = await pg.evaluate(f"restFimEm === {fim1} && !!restTimerInt")
    confere('minimizar não reinicia a contagem', r, r)
    await pg.evaluate("goTab('home')"); await pg.wait_for_timeout(300)
    await pg.evaluate("rtExpandir()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("(()=>{ const el = document.getElementById('rest-timer-banner'); return { exp: el.classList.contains('exp'), voltar: getComputedStyle(el.querySelector('.rt2-voltar')).display !== 'none', w: el.getBoundingClientRect().width }; })()")
    confere('tocar na pílula expande, com "Voltar ao treino"', r['exp'] and r['voltar'], r)
    if FOTOS: await pg.screenshot(path=FOTOS + '/rc0-cronometro-expandido.png')
    # cores: normal → amarelo → vermelho
    fases = []
    for s in (60, 8, 2):
        await pg.evaluate(f"restFimEm = Date.now() + {s}*1000; restTotalSeg = 90; restDesenha()")
        fases.append(await pg.evaluate("['ok','aviso','fim'].find(f=>document.getElementById('rest-timer-banner').classList.contains('f-'+f))"))
    confere('cor muda no fim (normal → amarelo → vermelho)', fases == ['ok','aviso','fim'], fases)
    r = await pg.evaluate("(()=>{ const c = document.querySelector('#rest-timer-banner .rt2-svg .rt2-arco'); return [+c.dataset.c, parseFloat(c.style.strokeDashoffset)]; })()")
    confere('anel mostra o tempo que falta (progresso contínuo)', r[1] > r[0]*0.9, r)
    await pg.evaluate("restPausa()"); a = await pg.evaluate("restRestante()"); await pg.wait_for_timeout(1200); b2 = await pg.evaluate("restRestante()")
    p = await pg.evaluate("document.getElementById('rest-timer-banner').classList.contains('f-pausa') && /Continuar/.test(document.querySelector('#rest-timer-banner .rt-pausa').textContent)")
    confere('pausa congela e o botão vira "Continuar"', a == b2 and p, (a, b2, p))
    await pg.evaluate("restPausa(); restFimEm = Date.now() + 40000; restTotalSeg = 90"); await pg.wait_for_timeout(300)
    await pg.evaluate("rtMinimizar()"); await pg.wait_for_timeout(200)
    confere('chevron minimiza de novo', await pg.evaluate("document.getElementById('rest-timer-banner').classList.contains('min')"))
    await pg.evaluate("rtVoltarTreino()"); await pg.wait_for_timeout(500)
    r = await pg.evaluate("({ aba: state.ui.tab, reg: !!document.getElementById('rt-dock'), doca: document.getElementById('rest-timer-banner').classList.contains('doca'), ex: curLog && curLog.exId === __ex.id })")
    confere('"Voltar ao treino" reabre o registro do exercício com o cronômetro dentro', r['aba'] == 'sessions' and r['reg'] and r['doca'] and r['ex'], r)
    # som e vibração: preferências preservadas
    await pg.evaluate("document.querySelector('#rest-timer-banner .rt-som').click()")
    r = await pg.evaluate("[restMuted, localStorage.getItem('mt_descanso_mudo')]")
    await pg.evaluate("document.querySelector('#rest-timer-banner .rt-som').click()")
    confere('botão de som usa a preferência de sempre (mt_descanso_mudo)', r[0] is True and r[1] in ('1','true'), r)
    await pg.evaluate("document.querySelector('#rest-timer-banner .rt2-vib').click()")
    r = await pg.evaluate("localStorage.getItem('mt_descanso_vibrar')")
    await pg.evaluate("document.querySelector('#rest-timer-banner .rt2-vib').click()")
    confere('botão de vibração usa a preferência de sempre (mt_descanso_vibrar)', r == '0', r)
    # pular: encerra sem tocar
    await pg.evaluate("__sons = 0; __vib = 0; rtPular()"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("({ el: !!document.getElementById('rest-timer-banner'), int: !!restTimerInt, s: __sons, v: __vib, ls: localStorage.getItem('mt_descanso') })")
    confere('"Pular" encerra sem som nem vibração e limpa o descanso guardado', not r['el'] and not r['int'] and r['s'] == 0 and r['v'] == 0 and r['ls'] is None, r)
    # um alarme só no fim, com o cronômetro minimizado
    await pg.evaluate("closeModal(); startRestTimer(30, 'Remada'); __sons = 0; __vib = 0"); await pg.wait_for_timeout(300)
    await pg.evaluate("restFimEm = Date.now() - 10"); await pg.wait_for_timeout(900)
    r = await pg.evaluate("({ v: __vib, el: !!document.getElementById('rest-timer-banner'), n: __ints })")
    confere('no fim (minimizado) vibra uma vez e some', r['v'] == 1 and not r['el'], r)
    confere('nenhum intervalo extra além do tique do núcleo', r['n'] <= 3, r)
    # tela pequena
    await pg.set_viewport_size({'width':320, 'height':640})
    await pg.evaluate("(()=>{ const e = __ex; openSetLog(e.id, e.name); startRestTimer(90, e.name); })()"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("[document.documentElement.scrollWidth, window.innerWidth, Math.round(document.getElementById('rest-timer-banner').getBoundingClientRect().right)]")
    confere('cabe em 320 px (registro aberto)', r[0] <= r[1] and r[2] <= r[1], r)
    await pg.evaluate("closeModal(); rtExpandir()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("[document.documentElement.scrollWidth, window.innerWidth, Math.round(document.getElementById('rest-timer-banner').getBoundingClientRect().right)]")
    confere('cabe em 320 px (expandido)', r[0] <= r[1] and r[2] <= r[1], r)
    await pg.evaluate("stopRestTimer()"); await pg.set_viewport_size({'width':390, 'height':844})

async def corrida(pg):
    print('3. Corrida: jornada do primeiro passo e "última mudança"')
    await pg.evaluate("closeModal(); state.active='run'")
    r = await pg.evaluate("""(()=>{ const M = state.modules.run.plan.motor; window.__M0 = JSON.stringify(M);
      M.nivel = 0; M.estagio = 2; delete state.runJornada;
      M.hist = (M.hist||[]).concat([{ sem: rSem()-7*DIA_MS, decisao:'avancar', motivo:'3 de 3 treinos completos com esforço médio de 6/10', mudou:'próximo estágio: '+rEstagioTxt(2), planejado:3, feitos:3 }]);
      goTab('sessions'); const c = document.getElementById('rj-card'); const st = document.getElementById('run-st');
      return { card: c ? c.textContent : '', dec: st ? st.textContent : '' }; })()""")
    confere('iniciante vê a jornada com o estágio atual e o que falta para avançar', 'Jornada do primeiro passo' in r['card'] and 'Estágio 2' in r['card'] and 'Para avançar' in r['card'] and '0 de 2' in r['card'], r['card'][:300])
    confere('cartão de status explica a última mudança com o motivo real', 'Última mudança' in r['dec'] and 'Avançou' in r['dec'] and '3 de 3 treinos' in r['dec'], r['dec'][:300])
    r = await pg.evaluate("RUN_JORNADA.map(l=>l.id)")
    confere('9 lições: começar, caminhar, aquecer, esforço, intercalar, respirar, sinais, evoluir, compensar', r == ['comecar','caminhar','aquecer','esforco','intercalar','respirar','sinais','evoluir','compensar'], r)
    r = await pg.evaluate("RUN_JORNADA.find(l=>l.id==='sinais').c.join(' ')")
    confere('lição de sinais manda parar e procurar atendimento (sem diagnóstico)', 'procure atendimento' in r.lower() and 'peito' in r, r[:200])
    # registro que vale para o estágio conta; registro com esforço alto não conta e sugere a lição de sinais
    r = await pg.evaluate("""(()=>{ const H = state.modules.run.history; const agora = Date.now();
      H.push({ at: agora-60000, duration: 30, activity:'corrida', tipoSessao:'camcorre', estagio:2, concluiu:'sim', rpe:6 });
      const a = rjSemana(runCtx(), state.modules.run.plan.motor).validos;
      H.push({ at: agora-30000, duration: 30, activity:'corrida', tipoSessao:'camcorre', estagio:2, concluiu:'sim', rpe:9 });
      const S = rjSemana(runCtx(), state.modules.run.plan.motor); const sug = rjSugestao(S);
      H.splice(-2, 2); return { a, b: S.validos, sug: sug && sug.id }; })()""")
    confere('só conta treino completo do estágio com esforço até 7/10 (mesma regra do motor)', r['a'] == 1 and r['b'] == 1, r)
    confere('depois de treino puxado, sugere a lição "sinais de excesso"', r['sug'] == 'sinais', r)
    await pg.evaluate("rjAbrir('comecar')"); await pg.wait_for_timeout(200)
    await pg.evaluate("[...document.querySelectorAll('#modal-inner .btn')].find(b=>/Entendi/.test(b.textContent)).click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("({ lida: !!(state.runJornada && state.runJornada.lidas.comecar), titulo: (document.querySelector('#modal-inner h3')||{}).textContent })")
    confere('"Entendi" marca como lida e abre a próxima', r['lida'] and r['titulo'] == 'Por que começamos caminhando', r)
    await pg.evaluate("closeModal(); rjOcultar()"); await pg.wait_for_timeout(200)
    confere('dá para ocultar a jornada', await pg.evaluate("!document.getElementById('rj-card')"))
    await pg.evaluate("rjMostrar()"); await pg.wait_for_timeout(300)
    confere('e mostrar de novo', await pg.evaluate("!!document.getElementById('rj-card')"))
    await pg.evaluate("state.modules.run.plan.motor.nivel = 3; renderSessions()"); await pg.wait_for_timeout(200)
    confere('nível intermediário em diante não vê a jornada no topo', await pg.evaluate("!document.getElementById('rj-card')"))
    # o motor não foi alterado
    r = await pg.evaluate("[typeof rAvaliarSemana, String(rAplicarDecisao).includes('noEstagio >= 2')]")
    confere('regra do motor intacta (2 treinos no estágio para avançar)', r == ['function', True], r)
    await pg.evaluate("Object.assign(state.modules.run.plan.motor, JSON.parse(__M0)); delete state.runJornada; closeModal()")

async def musculacao(pg):
    print('4. Musculação: progressão pelo desempenho')
    await pg.evaluate("state.active='lift'")
    r = await pg.evaluate("""(()=>{ const id = 'teste-rc0-supino'; const D = 86400000, h = Date.now();
      const mk = (dias, sets)=>({ date: h - dias*D, sets: sets.map(([peso,reps])=>({peso,reps})) });
      const out = {};
      // platô: 4 sessões em 4 semanas, mesma carga, reps paradas, sem fechar a faixa
      state.progress[id] = [mk(28,[[40,8],[40,7],[40,7]]), mk(19,[[40,8],[40,7],[40,6]]), mk(10,[[40,8],[40,7],[40,7]]), mk(3,[[40,8],[40,7],[40,6]])];
      window.repRangeFor = (function(f){ return function(x){ return x===id ? {lo:8, hi:12} : f(x); }; })(window.repRangeFor);
      out.plato = mtPlato(id); out.h = smartProgressionHint(id);
      // evoluindo: ganhou repetições → não é platô
      state.progress[id] = [mk(28,[[40,8]]), mk(19,[[40,9]]), mk(10,[[40,9]]), mk(3,[[40,10]])];
      out.evolui = mtPlato(id);
      // subiu carga → não é platô
      state.progress[id] = [mk(28,[[40,8]]), mk(19,[[42.5,8]]), mk(10,[[42.5,8]]), mk(3,[[42.5,8]])];
      out.subiu = mtPlato(id);
      // poucas semanas → não é platô
      state.progress[id] = [mk(9,[[40,8]]), mk(6,[[40,8]]), mk(4,[[40,8]]), mk(2,[[40,8]])];
      out.curto = mtPlato(id);
      // topo da faixa 2x → subir (prioridade sobre platô)
      state.progress[id] = [mk(28,[[40,12],[40,12]]), mk(19,[[40,12],[40,12]]), mk(10,[[40,12],[40,12]]), mk(3,[[40,12],[40,12]])];
      out.topo = smartProgressionHint(id);
      delete state.progress[id];
      return out; })()""")
    confere('4 sessões em 3+ semanas sem evolução → "rever o exercício"', r['plato'] and r['h'].get('rever') and 'Saídas' in r['h']['txt'] and '36kg' in r['h']['txt'], r['h'])
    confere('ganhando repetições não é platô', r['evolui'] is None, r['evolui'])
    confere('subiu carga não é platô', r['subiu'] is None, r['subiu'])
    confere('menos de 3 semanas não é platô', r['curto'] is None, r['curto'])
    confere('topo da faixa continua sendo "subir"', r['topo']['cls'] == 'card-ok' and not r['topo'].get('rever'), r['topo'])
    await pg.evaluate("goTab('sessions')"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("(document.getElementById('pg-entrada')||{}).innerText || ''")
    confere('entrada "Progressão das cargas" na aba Treinos (musculação)', 'Progressão das cargas' in r, r)
    await pg.evaluate("openProgressaoCargas()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("({ n: document.querySelectorAll('#modal-inner .pg-item').length, como: document.querySelector('#modal-inner .pg-como') ? document.querySelector('#modal-inner .pg-como').textContent : '', ex: new Set(state.modules.lift.plan.workouts.flatMap(w=>w.exercises.map(e=>e.id))).size })")
    confere('painel lista cada exercício do plano e explica a regra (sem aumentar volume sozinho)', r['n'] == r['ex'] and 'nunca aumenta séries' in r['como'], r)
    planA = await pg.evaluate("JSON.stringify(state.modules.lift.plan.workouts.map(w=>w.exercises.map(e=>[e.id,e.sets,e.reps])))")
    await pg.evaluate("closeModal(); renderSessions(); openProgressaoCargas(); closeModal()")
    planB = await pg.evaluate("JSON.stringify(state.modules.lift.plan.workouts.map(w=>w.exercises.map(e=>[e.id,e.sets,e.reps])))")
    confere('abrir o painel não muda o plano', planA == planB)
    await pg.evaluate("state.active='run'; goTab('sessions')"); await pg.wait_for_timeout(200)
    confere('na corrida a entrada não aparece', await pg.evaluate("!document.getElementById('pg-entrada')"))
    await pg.evaluate("state.active='lift'")

async def offline_pdf(b):
    print('5. Sem internet: gerador de PDF guardado na instalação')
    ctx = await b.new_context(); pg = await ctx.new_page()
    await pg.add_init_script("window.__MOCK_USER = {uid:'rc0sw', displayName:'T', emailVerified:true};")
    await pg.goto(URL); await pg.wait_for_timeout(1500)
    await pg.evaluate("navigator.serviceWorker.ready.then(()=>1)"); await pg.wait_for_timeout(2500)
    await pg.reload(); await pg.wait_for_timeout(1500)
    await ctx.set_offline(True)
    r = await pg.evaluate("""new Promise(ok=>{ const s = document.createElement('script'); s.src = './jspdf.umd.min.js?v=' + APP_VERSION;
        s.onload = ()=>ok('carregou'); s.onerror = ()=>ok('falhou'); document.head.appendChild(s); })""")
    confere('sem internet, o jsPDF guardado na instalação carrega mesmo pedido com "?v=" (antes falhava)', r == 'carregou', r)
    r = await pg.evaluate("[APP_VERSION, appVersaoLabel(), (document.getElementById('pf-version')||{}).textContent]")
    confere('versão 2027 RC (identificador e texto)', r[0].startswith('2027-rc.') and r[1].startswith('2027 RC '), r)
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg, err = await pagina(b, 'rc0a')
        await alimentacao(pg)
        await cronometro(pg)
        await corrida(pg)
        await musculacao(pg)
        r = await pg.evaluate("state.runJornada={lidas:{comecar:1}}; const x = limpaParaNuvem(JSON.parse(JSON.stringify(state)),'estado',[]).runJornada; delete state.runJornada; JSON.stringify(x)")
        confere('lições lidas vão para a nuvem (campo novo opcional passa pela limpeza)', '"comecar":1' in (r or ''), r)
        await offline_pdf(b)
        confere('sem erros de página', not err, err[:3])
        await b.close()
    print(f'\nRC 0: {ok} ok, {fal} falha(s)')
asyncio.run(main())

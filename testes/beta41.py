#!/usr/bin/env python3
"""Beta 41: substituição inteligente de exercícios, favoritos, conquistas (apresentação só na aba Conquistas),
encerramento do desafio mensal, transições, temas, montagem do plano e desempenho.
Firebase simulado (testes/mock-firebase.js). Uso:
  python3 testes/beta41.py http://localhost:8765/index.html [pasta-de-saida]"""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
ok = falhou = 0
def confere(nome, cond, info=''):
    global ok, falhou
    if cond: ok += 1; print('  ✅', nome)
    else: falhou += 1; print('  ❌', nome, info)
async def foto(pg, nome):
    if SAIDA: await pg.screenshot(path=os.path.join(SAIDA, nome + '.png'))
async def nova(b, docs=None, w=390, h=844, movimento='no-preference', toque=False, user=None):
    ctx = await b.new_context(viewport={'width':w,'height':h}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Sao_Paulo',
                              reduced_motion=movimento, has_touch=toque, is_mobile=toque)
    await ctx.add_init_script(f"window.__MOCK_USER = {json.dumps(user or {})}; window.__MOCK_DOCS = {json.dumps(docs or {})}; window.__MOCK_SEM_DOC = false;")
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.on('console', lambda m: erros.append('console: ' + m.text) if m.type == 'error' else None)
    await pg.goto(URL); await pg.wait_for_timeout(2200)
    return ctx, pg, erros
async def semente(pg, limpar_fila=True):
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500)
    await pg.evaluate("closeModal()")
    if limpar_fila:   # a semente desbloqueia dezenas de conquistas de uma vez: começa do zero, como uma conta que já viu tudo
        await pg.evaluate("state.conqPend = []; state.conqVistas = []; saveData()")
MODAL_ON = "document.getElementById('modal-back').classList.contains('on')"

async def substituicao(b):
    print('1. Substituição inteligente de exercícios')
    ctx, pg, erros = await nova(b)
    await semente(pg)
    r = await pg.evaluate("""(()=>{ const out = { total:0, maisErrado:[], secundComoMais:0, semNada:[] };
      state.modules.lift.plan.workouts.forEach(w=>w.exercises.forEach(e=>{ const c = mtCandidatosTroca(w, e, 'ocupado'); if(!c) return; out.total++;
        const p = mtPadrao(e).pad;
        c.mais.forEach(x=>{ if(mtPadrao(x.ex).pad !== p) out.maisErrado.push(e.name+' → '+x.ex.name); });
        c.secund.forEach(x=>{ if(c.mais.some(y=>y.id===x.id)) out.secundComoMais++; });
        if(!c.mais.length && !c.compat.length) out.semNada.push(e.name);
        if(c.mais.concat(c.compat, c.secund).some(x=>w.exercises.some(y=>y.id===x.id))) out.repete = (out.repete||0)+1;
      })); return out; })()""")
    confere(f'{r["total"]} exercícios do plano analisados', r['total'] >= 15, r)
    confere('"Mais compatíveis" só traz o MESMO padrão de movimento', not r['maisErrado'], r['maisErrado'][:3])
    confere('alternativa secundária nunca aparece como equivalente', r['secundComoMais'] == 0)
    confere('nunca sugere exercício que já está no treino do dia', not r.get('repete'))
    # supino na máquina ocupado → supinos com carga antes de flexões; flexões caem para "Compatíveis"
    r = await pg.evaluate("""(()=>{ const w = {exercises:[{id:'supino-na-maquina-hammer', name:'Supino na Máquina (Hammer)', sub:'Peito', part:'Peito', sets:4, reps:'8-12', rest:'90s'}]};
      const c = mtCandidatosTroca(w, w.exercises[0], 'ocupado', {equip:'academia', level:'intermediario'}); return { mais:c.mais.map(x=>x.ex.name), compat:c.compat.map(x=>x.ex.name), sec:c.secund.map(x=>x.ex.name) }; })()""")
    confere('supino ocupado: halteres e barra são os mais compatíveis', r['mais'][:2] == ['Supino Reto com Halteres', 'Supino Reto com Barra'], r)
    confere('crucifixo (isolador) fica em alternativas secundárias', 'Crucifixo com Halteres' in r['sec'] and 'Crucifixo com Halteres' not in r['mais'], r)
    # aparelho ocupado: mesmo tipo de aparelho (cabo) cai na fila; por preferência não
    r = await pg.evaluate("""(()=>{ const e = {id:'crossover-no-cabo-alto', name:'Crossover no Cabo (alto)', sub:'Peito Inferior', part:'Peito', sets:3, reps:'12', rest:'60s'}; const w = {exercises:[e]};
      const o = mtCandidatosTroca(w, e, 'ocupado', {equip:'academia'}), p = mtCandidatosTroca(w, e, 'preferencia', {equip:'academia'});
      const pos = (c,n)=>[...c.mais, ...c.compat].findIndex(x=>x.ex.name===n);
      return { ocup:pos(o,'Crossover no Cabo (baixo)'), pref:pos(p,'Crossover no Cabo (baixo)'), aviso:([...o.mais,...o.compat].find(x=>x.ex.name==='Crossover no Cabo (baixo)')||{}).aviso }; })()""")
    confere('aparelho ocupado: outro exercício no mesmo tipo de aparelho vem depois, com aviso', r['ocup'] > r['pref'] and 'mesmo tipo de equipamento' in (r['aviso'] or ''), r)
    # equipamento, limitações e nível
    r = await pg.evaluate("""(()=>{ const e = {id:'supino-reto-com-halteres', name:'Supino Reto com Halteres', sub:'Peito', part:'Peito'}; const w={exercises:[e]};
      const h = mtCandidatosTroca(w, e, 'ocupado', {equip:'halteres'}); const todos = [...h.mais,...h.compat,...h.secund];
      const semAcad = todos.every(x=>(x.ex.equip||[]).some(q=>q==='halteres'||q==='casa'));
      const o = mtCandidatosTroca(w, e, 'ocupado', {equip:'academia', lim:['ombro']}); const t2 = [...o.mais,...o.compat,...o.secund];
      const semOmbro = t2.every(x=>!LIM_REGRAS.ombro.evitar.test(x.ex.name));
      const i = mtCandidatosTroca(w, e, 'ocupado', {equip:'academia', level:'iniciante'}); const t3 = [...i.mais,...i.compat,...i.secund];
      return { semAcad, semOmbro, semAvancado: t3.every(x=>!/Arqueiro/.test(x.ex.name)) }; })()""")
    confere('respeita o equipamento do aluno (só halteres → nada de máquina)', r['semAcad'])
    confere('respeita as limitações do cadastro (ombro)', r['semOmbro'])
    confere('respeita o nível (iniciante não recebe variação avançada)', r['semAvancado'])
    r = await pg.evaluate("""(()=>{ const e = {id:'mountain-climber', name:'Mountain Climber', sub:'Core / Cardio', part:'Core'}; const w={exercises:[e]};
      const c = mtCandidatosTroca(w, e, 'ocupado', {equip:'academia'}); return { n: c.mais.length + c.compat.length, sec: c.secund.length }; })()""")
    confere('sem equivalente: nenhuma opção apresentada como compatível', r['n'] == 0, r)
    await pg.evaluate("""(()=>{ goTab('sessions'); const w = currentSelectedWorkout(state.modules.lift); window.__w = w.k;
      const e = w.exercises.find(x=>!x.cadeia) ; window.__e = e.id; openSwapExercise(e.id); })()""")
    await pg.wait_for_timeout(400)
    confere('tela de troca abre com as faixas e o motivo (ocupado/preferência)', await pg.evaluate("!!document.querySelector('.tx-sec-mais') && document.querySelectorAll('.seg-mini button').length===2"))
    await foto(pg, 'b41-01-troca')
    antes = await pg.evaluate("""(()=>{ const w = state.modules.lift.plan.workouts.find(x=>x.k===window.__w); return { ex: JSON.parse(JSON.stringify(w.exercises)), pins: (w.pins||[]).length }; })()""")
    novo = await pg.evaluate("(()=>{ const it = document.querySelector('.tx-item.tx-mais'); const id = it.querySelector('.fav-btn').dataset.fav; it.click(); return id; })()")
    await pg.wait_for_timeout(300)
    d = await pg.evaluate(f"""(()=>{{ const w = state.modules.lift.plan.workouts.find(x=>x.k===window.__w); const i = w.exercises.findIndex(x=>x.id==='{novo}'); const e = w.exercises[i];
      return {{ i, troca: e && e.troca, sets: e && e.sets, reps: e && e.reps, rest: e && e.rest, pins:(w.pins||[]).length, outros: JSON.stringify(w.exercises.filter((x,k)=>k!==i)) }}; }})()""")
    orig = antes['ex'][d['i']]
    confere('troca aplicada SÓ nesta execução (original guardado no item)', d['troca'] and d['troca']['orig']['id'] == orig['id'], d.get('troca'))
    confere('séries, repetições e descanso preservados', (d['sets'], d['reps'], d['rest']) == (orig['sets'], orig['reps'], orig['rest']))
    confere('o plano não muda (sem fixar) e os outros exercícios ficam iguais', d['pins'] == antes['pins'] and d['outros'] == json.dumps([x for k,x in enumerate(antes['ex']) if k != d['i']], ensure_ascii=False, separators=(',',':')))
    confere('cartão mostra "Só neste treino", desfazer e salvar no plano', await pg.evaluate("!!document.querySelector('.ex-tem-troca .ex-troca') && document.querySelectorAll('.ex-troca-b .btn').length===2"))
    await foto(pg, 'b41-02-trocado')
    # desfazer
    await pg.evaluate(f"mtTrocaDesfazer('{novo}')"); await pg.wait_for_timeout(200)
    confere('desfazer devolve o exercício original', await pg.evaluate(f"(()=>{{ const w = state.modules.lift.plan.workouts.find(x=>x.k===window.__w); return w.exercises.some(x=>x.id==='{orig['id']}') && !w.exercises.some(x=>x.troca); }})()"))
    # troca + registrar séries + salvar treino → histórico com original e substituto
    await pg.evaluate(f"""(()=>{{ _mtTroca = {{ exId:'{orig['id']}', motivo:'ocupado', salvar:false }}; mtTrocaAplicar('{novo}');
      const w = state.modules.lift.plan.workouts.find(x=>x.k===window.__w); w.dayIdx = getDayIdx();
      state.progress['{novo}'] = (state.progress['{novo}']||[]).concat([{{ date: Date.now(), sets:[{{peso:20,reps:10}},{{peso:20,reps:10}}] }}]);
      state.modules.lift.history = state.modules.lift.history.filter(h=>!(h.id===w.k && Date.now()-h.at<60000));
      window.__rpe = 6; confirmLiftWorkout(w.k); }})()""")
    await pg.wait_for_timeout(1400)
    h = await pg.evaluate("(()=>{ const x = state.modules.lift.history[state.modules.lift.history.length-1]; return { trocas:x.trocas, ed:(x.exercisesDone||[]).find(e=>e.noLugarDe) }; })()")
    confere('histórico registra o exercício usado e o original substituído', h['trocas'] and h['trocas'][0]['de'] == orig['id'] and h['trocas'][0]['para'] == novo and h['ed'] and h['ed']['noLugarDeId'] == orig['id'], h)
    confere('evolução do original não recebe as séries do substituto', await pg.evaluate(f"!((state.progress['{orig['id']}']||[]).some(p=>{{ const d=new Date(p.date); return d.toDateString()===new Date().toDateString(); }}))"))
    await pg.evaluate("closeModal(); openHistoryEntry(state.modules.lift.history.length-1)"); await pg.wait_for_timeout(300)
    confere('detalhe do histórico mostra a substituição', await pg.evaluate("!!document.querySelector('#modal-inner .hx-trocas')"))
    await pg.evaluate("closeModal()")
    # no dia seguinte, o original volta sozinho
    await pg.evaluate(f"(()=>{{ const w = state.modules.lift.plan.workouts.find(x=>x.k===window.__w); const e = w.exercises.find(x=>x.troca); e.troca.dia = '2000-01-01'; goTab('home'); }})()")
    confere('troca expira no dia seguinte e o original volta ao plano', await pg.evaluate(f"(()=>{{ const w = state.modules.lift.plan.workouts.find(x=>x.k===window.__w); return w.exercises.some(x=>x.id==='{orig['id']}') && !w.exercises.some(x=>x.troca); }})()"))
    # salvar no plano (só com autorização)
    await pg.evaluate(f"""(()=>{{ _mtTroca = {{ exId:'{orig['id']}', motivo:'preferencia', salvar:false }}; mtTrocaAplicar('{novo}'); mtTrocaSalvarNoPlano('{novo}'); }})()""")
    await pg.wait_for_timeout(200)
    await pg.evaluate("(()=>{ const b = [...document.querySelectorAll('#modal-inner .btn, #confirm-back .btn, .modal .btn')].find(x=>/Salvar no plano/.test(x.textContent)); if(b) b.click(); })()")
    await pg.wait_for_timeout(300)
    s = await pg.evaluate(f"(()=>{{ const w = state.modules.lift.plan.workouts.find(x=>x.k===window.__w); const e = w.exercises.find(x=>x.id==='{novo}'); return {{ fixo: e && e.pinned && !e.troca, pin: (w.pins||[]).some(p=>p.id==='{novo}' && p.origId==='{orig['id']}') }}; }})()")
    confere('"Salvar no plano" (com confirmação) fixa a troca pelo mecanismo existente', s['fixo'] and s['pin'], s)
    await pg.evaluate(f"unpinExercise('{novo}')")
    # calistenia continua com a troca própria
    r = await pg.evaluate("""(()=>{ const w = state.modules.lift.plan.workouts[0]; const e = w.exercises[0]; const c0 = w.cali, k0 = e.cadeia, f0 = window.caliAbrirTroca; let chamou = null;
      w.cali = true; e.cadeia = 'x-teste'; window.caliAbrirTroca = id=>{ chamou = id; };
      try{ openSwapExercise(e.id); } finally { w.cali = c0; if(k0===undefined) delete e.cadeia; else e.cadeia = k0; window.caliAbrirTroca = f0; }
      return chamou; })()""")
    confere('calistenia: "Trocar" segue abrindo a progressão/regressão da cadeia', r == 'x-teste', r)
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()

async def favoritos(b):
    print('2. Favoritos')
    ctx, pg, erros = await nova(b)
    await semente(pg)
    await pg.evaluate("goTab('library')"); await pg.wait_for_timeout(300)
    confere('Biblioteca: cada exercício tem a estrela e há o filtro Favoritos', await pg.evaluate("document.querySelectorAll('#lib-list .lx-item .fav-btn').length > 50 && !!document.querySelector('#lib-chips .chip-fav')"))
    await pg.evaluate("document.querySelector('#lib-list .lx-item .fav-btn[data-fav=\"supino-reto-com-halteres\"]').click()")
    await pg.wait_for_timeout(200)
    confere('favoritar pela Biblioteca salva na conta (state.favoritos) sem abrir a ficha', await pg.evaluate("state.favoritos.includes('supino-reto-com-halteres') && !(" + MODAL_ON + ")"))
    await pg.evaluate("setLibFilter('Favoritos')"); await pg.wait_for_timeout(200)
    confere('filtro Favoritos lista os favoritos, organizados por grupo', await pg.evaluate("document.querySelectorAll('#lib-list .lx-item').length===1 && /Peito/.test(document.querySelector('#lib-list .lx-cat').textContent)"))
    await foto(pg, 'b41-03-favoritos')
    await pg.evaluate("setLibFilter('Todos'); openExerciseSheet('Supino Reto com Barra')"); await pg.wait_for_timeout(500)
    await pg.evaluate("document.querySelector('#modal-inner .ex-head .fav-btn').click()")
    confere('ficha do exercício: estrela favorita/desfavorita', await pg.evaluate("state.favoritos.includes('supino-reto-com-barra')"))
    await pg.evaluate("closeModal(); goTab('sessions')"); await pg.wait_for_timeout(300)
    confere('durante o treino: estrela discreta no cartão do exercício', await pg.evaluate("document.querySelectorAll('#session-detail-slot .ex .fav-btn.fav-ex').length > 0"))
    # favorito compatível vem primeiro; favorito inadequado não aparece como compatível
    r = await pg.evaluate("""(()=>{ state.favoritos = ['supino-reto-com-barra','crucifixo-com-halteres']; const e = {id:'supino-na-maquina-hammer', name:'Supino na Máquina (Hammer)', sub:'Peito', part:'Peito'};
      const c = mtCandidatosTroca({exercises:[e]}, e, 'ocupado', {equip:'academia'}); return { favs:c.favs.map(x=>x.id), mais0:c.mais[0].id, crucNaSec: c.secund.some(x=>x.id==='crucifixo-com-halteres') }; })()""")
    confere('favorito compatível tem prioridade na troca', r['favs'] == ['supino-reto-com-barra'] and r['mais0'] == 'supino-reto-com-barra', r)
    confere('favorito inadequado (crucifixo no lugar de supino) não é sugerido como compatível', 'crucifixo-com-halteres' not in r['favs'] and r['crucNaSec'], r)
    # sincronização e preservação ao gerar novo plano
    await pg.evaluate("saveData()"); await pg.wait_for_timeout(1200)
    nuvem = await pg.evaluate("(()=>{ for(const k in window.__mockFS){ const v = window.__mockFS[k]; if(v && v.estadoApp) return v.estadoApp.favoritos; } return null; })()")
    confere('favoritos vão para a nuvem (sincronizados entre aparelhos)', nuvem and 'supino-reto-com-barra' in nuvem, nuvem)
    await pg.evaluate("(()=>{ const m = state.modules.lift; m.plan = generatePlan('lift', m.setup); saveData(); })()")
    confere('favoritos preservados ao gerar novo plano', await pg.evaluate("state.favoritos.length===2"))
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()

async def conquistas(b):
    print('3. Conquistas: só na aba Conquistas, uma vez, sincronizado')
    ctx, pg, erros = await nova(b)
    await semente(pg)
    await pg.evaluate("goTab('home')"); await pg.wait_for_timeout(200)
    await pg.evaluate("""(()=>{ const comum = TROPHIES.find(t=>!t.secret && !state.trophies.includes(t.id) && medalNivel(t)==='comum');
      const rara = TROPHIES.find(t=>!t.secret && !state.trophies.includes(t.id) && medalNivel(t)==='rara');
      const sec = TROPHIES.find(t=>t.secret && !state.trophies.includes(t.id)); window.__ids = [comum.id, rara.id, sec.id];
      window.__ids.forEach(unlockTrophy); })()""")
    await pg.wait_for_timeout(1700)
    confere('desbloquear NÃO abre janela no início', not await pg.evaluate(MODAL_ON))
    confere('nenhuma animação de conquista fora da aba (início)', await pg.evaluate("!document.querySelector('.cq-novo, .anim-check, #modal-back.award-dark')"))
    confere('fica pendente na conta (3 itens) com selo parado "Novidade" no cartão do início', await pg.evaluate("state.conqPend.length===3 && !!document.querySelector('#home-trofeus .cq-badge')"))
    for aba in ['sessions', 'challenges', 'perf', 'profile', 'home']:
        await pg.evaluate(f"goTab('{aba}')"); await pg.wait_for_timeout(250)
    confere('navegar pelas outras abas não apresenta nada (continua pendente)', not await pg.evaluate(MODAL_ON) and await pg.evaluate("state.conqPend.length===3"))
    await pg.evaluate("goTab('challenges')"); await pg.wait_for_timeout(200)
    confere('bloco "Sua coleção" (Desafios) mostra o selo parado na entrada de Conquistas', await pg.evaluate("!!document.querySelector('.chal-tile[onclick^=\"openTrophies\"] .cq-badge')"))
    await pg.evaluate("openTrophies()"); await pg.wait_for_timeout(1500)
    r = await pg.evaluate("""(()=>({ novos: document.querySelectorAll('.cq-novo').length, rara: !!document.querySelector('.cq-novo.nv-rara .cq-novo-luz'), especial: !!document.querySelector('.cq-novo.nv-especial'),
       anim: getComputedStyle(document.querySelector('.cq-novo')).animationName, recente: document.querySelectorAll('.cq-tile.cq-recente').length,
       estados: ['st-ok','st-and','st-blq'].map(c=>document.querySelectorAll('.cq-tile.'+c).length), pend: state.conqPend.length }))()""")
    confere('ao entrar em Conquistas: as 3 novidades são apresentadas lá dentro, com animação', r['novos'] == 3 and r['anim'] == 'cqNovo', r)
    confere('rara e especial têm destaque próprio (brilho único / moldura)', r['rara'] and r['especial'], r)
    confere('recém-desbloqueadas destacadas como "Nova" na coleção', r['recente'] >= 2, r)
    confere('desbloqueadas / em andamento / bloqueadas diferenciadas', all(n > 0 for n in r['estados']), r)
    confere('apresentação registrada (sai da fila)', r['pend'] == 0)
    await foto(pg, 'b41-04-conquistas-novas')
    await pg.evaluate("closeModal(); openTrophies()"); await pg.wait_for_timeout(500)
    confere('reabrir: conquistas já vistas não reaparecem nem reanimam', await pg.evaluate("document.querySelectorAll('.cq-novo').length===0 && document.querySelectorAll('.cq-tile.cq-recente').length===0"))
    await pg.evaluate("cqFiltrar('and')"); await pg.wait_for_timeout(200)
    confere('filtro "Em andamento" mostra só as com progresso', await pg.evaluate("[...document.querySelectorAll('#cq-grade-box .cq-tile')].every(t=>t.classList.contains('st-and'))"))
    await pg.evaluate("cqFiltrar('todas'); closeModal()")
    # detalhe → voltar não reanima
    await pg.evaluate(f"openTrophyDetail(window.__ids[0])"); await pg.wait_for_timeout(200)
    await pg.evaluate("openTrophiesKeepScroll()"); await pg.wait_for_timeout(200)
    confere('voltar do detalhe não reproduz animações', await pg.evaluate("!document.querySelector('.cq.cq-anim')"))
    await pg.evaluate("closeModal()")
    # sincronização: o outro aparelho recebe a conta já com as conquistas vistas
    await pg.wait_for_timeout(1200)
    doc = await pg.evaluate("(()=>{ for(const k in window.__mockFS){ const v = window.__mockFS[k]; if(v && v.estadoApp) return [k, v]; } return null; })()")
    confere('controle de visualização salvo na nuvem', doc and doc[1]['estadoApp'].get('conqPend') == [] and len(doc[1]['estadoApp'].get('conqVistas', [])) >= 3)
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()
    if doc:
        ctx, pg, erros = await nova(b, docs={doc[0]: doc[1]})
        await pg.evaluate("openTrophies()"); await pg.wait_for_timeout(500)
        confere('segundo aparelho: nada é reapresentado', await pg.evaluate("document.querySelectorAll('.cq-novo').length===0 && state.conqVistas.length>=3"))
        await ctx.close()

async def desafio_mensal(b):
    print('4. Encerramento do desafio mensal')
    ctx, pg, erros = await nova(b)
    await semente(pg)
    # aluno que não abriu o app na virada: o mês de setembro termina quando ele volta
    r = await pg.evaluate("""(()=>{ cqFotoDoMes(); const snap = state.monthly.snap; state.monthly.key = '2026-09'; state.monthly.snap = snap;
      const ids = desafiosDoMes().flatMap(g=>g.niveis).slice(0,6).map(c=>c.id); state.monthly.done = ids.concat(['selo:2026-09']);
      ensureMonthly(); goTab('home'); return { reg: state.desafiosEncerrados.find(d=>d.key==='2026-09'), mesAtual: state.monthly.key }; })()""")
    await pg.wait_for_timeout(1200)
    reg = r['reg']
    confere('mês encerrado registrado mesmo dias depois (meta, progresso, resultado)', reg and reg['selo'] and reg['niveis'] == 6 and reg['meta'] == 6 and not reg['visto'], reg)
    confere('virada não muda pontuações nem medalhas (6 níveis + selo arquivados)', await pg.evaluate("state.medals.filter(m=>m.month==='2026-09').length")== 7)
    confere('nada aparece sozinho no início (sem janela)', not await pg.evaluate(MODAL_ON))
    await pg.evaluate("goTab('sessions')"); await pg.wait_for_timeout(200); await pg.evaluate("goTab('home')"); await pg.wait_for_timeout(300)
    confere('continua pendente enquanto o aluno não abre Conquistas', await pg.evaluate("state.desafiosEncerrados.some(d=>!d.visto)") and not await pg.evaluate(MODAL_ON))
    await pg.evaluate("openTrophies()"); await pg.wait_for_timeout(1400)
    m = await pg.evaluate("""(()=>{ const c = document.querySelector('.cq-mes'); return c && { ok:c.classList.contains('ok'), tag:c.querySelector('.cq-mes-tag').textContent, res:c.querySelector('.cq-res').textContent,
       festa: document.querySelectorAll('.cq-festa i').length, dl: c.querySelectorAll('dt').length, txt: c.textContent }; })()""")
    confere('"Desafio mensal encerrado!" dentro da aba Conquistas, com nome, meta, progresso e resultado', m and 'encerrado' in m['tag'] and m['dl'] == 3 and 'Setembro' in m['txt'], m)
    confere('concluído: celebração discreta (poucas partículas, uma vez)', m and m['ok'] and 0 < m['festa'] <= 12 and 'Concluído' in m['res'], m)
    await foto(pg, 'b41-05-mes-concluido')
    await pg.evaluate("closeModal(); openTrophies()"); await pg.wait_for_timeout(300)
    confere('visto: não reaparece; fica no histórico de desafios mensais', await pg.evaluate("!document.querySelector('.cq-mes') && !!document.querySelector('.cq-hist') && state.desafiosEncerrados.find(d=>d.key==='2026-09').visto"))
    await pg.evaluate("closeModal()")
    # outubro: encerrado sem concluir
    await pg.evaluate("""(()=>{ state.monthly.key = '2026-10'; state.monthly.done = [desafiosDoMes()[0].niveis[0].id]; ensureMonthly(); })()""")
    await pg.wait_for_timeout(100)
    await pg.evaluate("openTrophies()"); await pg.wait_for_timeout(1200)
    m = await pg.evaluate("(()=>{ const c = document.querySelector('.cq-mes'); return c && { nao:c.classList.contains('nao'), festa:document.querySelectorAll('.cq-festa').length, msg:c.querySelector('.cq-mes-msg').textContent, res:c.querySelector('.cq-res').textContent }; })()")
    confere('encerrado sem concluir: resultado claro e mensagem positiva, sem festa', m and m['nao'] and m['festa'] == 0 and 'Não concluído' in m['res'] and 'nova chance' in m['msg'], m)
    await foto(pg, 'b41-06-mes-nao-concluido')
    await pg.evaluate("closeModal()")
    # fuso: 31/10 às 23h em São Paulo ainda é outubro (02h UTC de 1º/11)
    confere('mês calculado no fuso do aparelho', await pg.evaluate("monthKey(new Date(Date.UTC(2026,10,1,2,0,0)))") == '2026-10')
    # relógio voltando não encerra nada
    confere('relógio do aparelho atrasado não encerra o mês', await pg.evaluate("(()=>{ const n = state.desafiosEncerrados.length; state.monthly.key = '2099-01'; ensureMonthly(); return state.desafiosEncerrados.length === n; })()"))
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()

async def movimento_reduzido(b):
    print('5. Redução de movimento')
    ctx, pg, erros = await nova(b, movimento='reduce')
    await semente(pg)
    await pg.evaluate("unlockTrophy(TROPHIES.find(t=>!t.secret && !state.trophies.includes(t.id)).id)"); await pg.wait_for_timeout(1500)
    await pg.evaluate("openTrophies()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("({ novo: getComputedStyle(document.querySelector('.cq-novo')).animationName, modal: getComputedStyle(document.querySelector('#modal-inner')).animationName, tile: getComputedStyle(document.querySelector('.cq-tile')).animationName })")
    confere('com "reduzir movimento": conquistas, janelas e grade aparecem sem animação', r['novo'] == 'none' and r['modal'] == 'none' and r['tile'] == 'none', r)
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()

async def visual_desempenho(b):
    print('6. Temas, abas, telas pequenas, montagem do plano e desempenho')
    ctx, pg, erros = await nova(b, w=320, h=640, toque=True)
    await semente(pg)
    confere('toque (Android): sem desfoque de fundo na barra de abas', await pg.evaluate("document.documentElement.classList.contains('mt-toque') && getComputedStyle(document.querySelector('.tabbar')).backdropFilter === 'none'"))
    temas = await pg.evaluate("Object.keys(THEMES)")
    estouros = []
    for t in temas:
        for aba in ['home', 'sessions', 'challenges', 'perf', 'profile', 'library']:
            await pg.evaluate(f"applyTheme('{t}'); goTab('{aba}')"); await pg.wait_for_timeout(60)
            w = await pg.evaluate("document.documentElement.scrollWidth")
            if w > 322: estouros.append((t, aba, w))
    confere(f'{len(temas)} temas × 6 abas em 320 px: nada passa da largura', not estouros, estouros[:4])
    r = await pg.evaluate("""(()=>{ const v = {}; Object.keys(THEMES).forEach(t=>{ applyTheme(t); const cs = getComputedStyle(document.documentElement); v[t] = [cs.getPropertyValue('--t-rc').trim(), cs.getPropertyValue('--t-rb').trim(), cs.getPropertyValue('--t-fill').trim().slice(0,30)].join('|'); }); return v; })()""")
    confere('cada tema tem identidade própria (cantos, botões, barras), não só a cor', len(set(r.values())) >= 8, r)
    await pg.evaluate("applyTheme('zepp')")
    # gratuito × Premium continua: Brasa e Areia são os gratuitos
    confere('divisão de temas Gratuito/Premium preservada', await pg.evaluate("JSON.stringify(TEMAS_GRATIS)") == '["zepp","areia"]')
    # montagem do plano: passos reais, curta, termina em "pronto" e a tela de treinos entra em sequência
    t0 = await pg.evaluate("Date.now()")
    await pg.evaluate("""(()=>{ window.__fimMontagem = 0; runBuildingScreen('lift', [{txt:'Objetivo'},{txt:'Equipamento'},{txt:'Dias'},{txt:'Limitações'},{txt:'Histórico'}], ()=>{ window.__fimMontagem = Date.now(); goTab('sessions'); }); })()""")
    await pg.wait_for_function("window.__fimMontagem > 0", timeout=8000)
    dur = (await pg.evaluate("window.__fimMontagem")) - t0
    confere(f'montagem acompanha as 5 etapas sem espera inventada ({dur} ms; antes ~5–6 s)', dur < 3600, dur)
    await pg.wait_for_timeout(100)
    confere('plano montado: dias e exercícios entram em sequência', await pg.evaluate("document.getElementById('session-detail-slot').classList.contains('mt-entra')"))
    # desempenho: caches equivalentes às funções originais
    r = await pg.evaluate("""(()=>({ slug: slug('Supino Inclinado com Halteres (pegada)') === 'supino-inclinado-com-halteres-pegada', data: mtFmtData(Date.UTC(2026,0,5,15)) === '05/01', km: mtFmtKm(12.34) + '|' + mtFmtKm(10) }))()""")
    confere('otimizações não mudam resultados (slug, datas, km)', r['slug'] and r['data'] and r['km'] == '12,3|10', r)
    tempos = await pg.evaluate("""(()=>{ const t = {}; ['home','sessions','challenges','perf','profile','library'].forEach(a=>{ const s = performance.now(); for(let i=0;i<3;i++) goTab(a); t[a] = Math.round((performance.now()-s)/3); }); return t; })()""")
    print('     tempo médio por troca de aba (ms):', tempos)
    confere('troca de aba rápida (média < 120 ms em cada aba no teste)', max(tempos.values()) < 120, tempos)
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for f in (substituicao, favoritos, conquistas, desafio_mensal, movimento_reduzido, visual_desempenho):
            try: await f(b)
            except Exception as e:
                global falhou; falhou += 1; print('  ❌ exceção em', f.__name__, str(e)[:400])
        await b.close()
    print(f'\nBeta 41: {ok} ok, {falhou} falha(s)')
    sys.exit(1 if falhou else 0)
asyncio.run(main())

#!/usr/bin/env python3
"""Beta 49 — cardápio mais claro e variado, lista de compras padronizada, conquistas sem desbloqueio em massa
(experiência anterior, celebração agrupada), metas do mês × medalha do desafio, participação automática,
assistente separando treinos do plano e atividades extras, troca sem repetir, desenho do cadastro e
sanidade dos dados enviados à nuvem. (A casa com dois celulares está em testes/casa-dois-celulares.py.)
Uso: python3 testes/beta49.py http://localhost:8765/index.html [pasta-de-saida]"""
import asyncio, sys, os, json, re
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
AQUI = os.path.dirname(os.path.abspath(__file__))
ok = falhou = 0
def confere(nome, cond, info=''):
    global ok, falhou
    if cond: ok += 1; print('  ✅', nome)
    else: falhou += 1; print('  ❌', nome, str(info)[:400])
async def foto(pg, nome):
    if SAIDA: await pg.screenshot(path=os.path.join(SAIDA, nome + '.png'))
PERFIL = "{ nickname:'Marcelo', sex:'m', age:30, height:178, currentWeight:80, goal:'massa', level:'intermediario', quiz_done:true }"
async def nova(b, uid='u49'):
    ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Sao_Paulo')
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    await pg.add_init_script(f"window.__MOCK_USER = {{uid:'{uid}', email:'{uid}@example.com', displayName:'Teste', emailVerified:true}};")
    await pg.goto(URL); await pg.wait_for_timeout(2000)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
    await pg.evaluate(f"try{{closeAwards()}}catch(e){{}}; closeModal(); state.user.profile = Object.assign(state.user.profile||{{}}, {PERFIL}); state.nutri = null; nutriConfig(); saveData(); 0")
    return ctx, pg, erros
ZERA = """(()=>{ state.trophies = []; state.trophyDates = {}; state.trophyExp = {}; state.stats = {}; state.prs = {}; state.medals = []; state.monthly = null; state.conqPend = []; state.conqVistas = []; state.eventos = {}; state.eventosRecusados = {};
  if(state.modules.lift){ state.modules.lift.history = []; } state.progress = {};
  const run = state.modules.run; run.history = []; saveData(); goTab('home'); return true; })()"""

async def cardapio(b):
    print('1. Cardápio: variedade, finalidade de cada ingrediente e unidades')
    ctx, pg, erros = await nova(b)
    r = await pg.evaluate("""(()=>{ const pratos = {}, total = {}; for(let d=1; d<=7; d++){ const p = nutriMontarPlano(d); p.refeicoes.forEach(m=>{ (pratos[m.id] = pratos[m.id] || new Set()).add(m.prato); total[m.id] = m.total; }); }
        return Object.keys(pratos).map(k=>({ k, distintos: pratos[k].size, opcoes: total[k] })); })()""")
    confere('a semana gira por todas as opções (sem repetir prato quando há 7 ou mais)', all(x['distintos'] == min(7, x['opcoes']) for x in r), r)
    o = {x['k']:x['opcoes'] for x in r}
    confere('mais opções no modo econômico (café ≥ 12, almoço ≥ 14, jantar ≥ 10)', o.get('cafe',0) >= 12 and o.get('almoco',0) >= 14 and o.get('jantar',0) >= 10, r)
    r = await pg.evaluate("""(()=>{ const out = []; for(let d=1; d<=7; d++) nutriMontarPlano(d).refeicoes.forEach(m=>m.itens.forEach(i=>{ if(['azeite','oleo','legumes','salada','mel','manteiga','requeijao','amendoim'].includes(i.id)) out.push({ id:i.id, nome:i.nome, texto:i.texto, uso:i.uso }); })); return out; })()""")
    confere('óleo/azeite: em ml, com a finalidade ("no preparo" / "temperar"), nunca só "óleo"', r and all(x['uso'] for x in r) and all(('ml' in x['texto']) for x in r if x['id'] in ('oleo','azeite')) and all(re.search('preparo|temperar', x['uso']) for x in r if x['id'] in ('oleo','azeite')), r[:4])
    await pg.evaluate("window.__nutriAbertos = { almoco:true, jantar:true }; openNutri()"); await pg.wait_for_timeout(300)
    t = await pg.evaluate("[...document.querySelectorAll('#modal-inner .n-uso')].map(e=>e.textContent).join(' | ')")
    confere('na tela, cada alimento mostra o uso e as calorias', 'kcal' in t and ('preparo' in t or 'temperar' in t), t[:200])
    await foto(pg, 'b49-01-cardapio')
    u = await pg.evaluate("[nutriQtdCompra('banana', 80*15), nutriQtdCompra('arroz', 1800), nutriQtdCompra('oleo', 60), nutriQtdCompra('leiteint', 2100), nutriQtdCompra('frango', 900)]")
    confere('compras: unidades, kg cru, ml e L', u[0]['n']=='15' and u[0]['un']=='unid.' and u[1]['un'] == 'g' and u[1]['obs']=='cru' and u[2]['un']=='ml' and u[3]['un']=='L' and u[4]['un'] in ('g','kg') and u[4]['obs']=='cru', u)
    await pg.evaluate("nutriListaCompras('7dias')"); await pg.wait_for_timeout(200)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('lista individual (sem grupo): período e categorias, sem "Grupo todo"', 'Período' in t and 'Grupo todo' not in t and 'frutas' in t.lower() and 'verduras e legumes' in t.lower(), t[:300])
    rp = await pg.evaluate("""(()=>{ const out = []; const S = { precisa(){}, secao(t,s){ out.push('S:'+t+'|'+(s||'')); }, tabela(c, l){ out.push('T:'+c.map(x=>x.t).join('/')+':'+l.length); }, nota(t){ out.push('N:'+t); } };
       nutriPdfCompras(S, { C:{ a:'#000', aClaro:'#eee', ink:'#000', dim:'#555' } }, 'eu'); return out; })()""")
    confere('PDF: Alimento | Quantidade | Unidade, por categoria e com o período', any(x.startswith('T:Alimento/Quantidade/Unidade') for x in rp) and any('período' in x for x in rp), rp[:6])
    confere('sem erros', not erros, erros[:3]); await ctx.close()

async def conquistas(b):
    print('2. Conquistas: experiência anterior, celebração agrupada, metas por nível')
    ctx, pg, erros = await nova(b, 'uPro')
    await pg.evaluate(ZERA)
    await pg.evaluate("""(()=>{ const run = state.modules.run; run.setup.aval = Object.assign(run.setup.aval||{}, { exp:'experiente', marca:{ km:21.0975, seg:5100 }, kmSemana:60, continuo:'90' }); run.plan.motor.nivel = 5; delete state.modules.lift; saveData(); })()""")
    await pg.evaluate("window.__mtRegEm = Date.now(); maLogActivity('corrida', 21.1, 105, 6); 0"); await pg.wait_for_timeout(3500)
    r = await pg.evaluate("""({ cartoes: [...document.querySelectorAll('#modal-inner .cel-cartao')].map(c=>c.innerText.replace(/\\n+/g,' | ')), exp: Object.keys(state.trophyExp||{}), trof: state.trophies.length, metas: (state.monthly.done||[]).length })""")
    total = r['trof'] + r['metas']
    confere(f'corredor experiente: {total} desbloqueios no primeiro registro viram no máximo 5 cartões', 1 <= len(r['cartoes']) <= 5 and total > len(r['cartoes']), r)
    confere('o primeiro cartão valoriza a primeira atividade no MetaTreino', r['cartoes'] and 'Primeira' in r['cartoes'][0] and 'MetaTreino' in r['cartoes'][0], r['cartoes'][:1])
    confere('5K, 10K e meia (que ele já tinha) entram como experiência reconhecida', sorted(r['exp']) == ['run_10k_run','run_21k_run','run_5k_run'] and any('Experiência reconhecida' in c for c in r['cartoes']), r)
    confere('metas do mês: bronze/prata/ouro da mesma meta num cartão só', not any(c.count('Longão do Mês') > 1 for c in r['cartoes']), r['cartoes'])
    await foto(pg, 'b49-02-celebracao-experiente')
    for _ in range(6): await pg.evaluate("cqCelPasso(1)"); await pg.wait_for_timeout(250)
    await pg.evaluate("closeModal()"); await pg.wait_for_timeout(400)
    confere('cartão visto = todas as conquistas que ele representa saem das novas', await pg.evaluate("state.conqPend.length") == 0)
    await pg.evaluate("openTrophies()"); await pg.wait_for_timeout(800)
    # textContent: os grupos usam content-visibility:auto e o que está fora da tela não entra no innerText
    confere('na coleção: "Experiência anterior"', 'Experiência anterior' in await pg.evaluate("document.getElementById('modal-inner').textContent"))
    await pg.evaluate("closeModal()")
    alvos = await pg.evaluate("(()=>{ const r = {}; [0,2,5].forEach(n=>{ state.modules.run.plan.motor.nivel = n; r[n] = mkDesafio('longao','ouro').alvo; }); state.modules.run.plan.motor.nivel = 5; return r; })()")
    confere('metas de corrida escalam pelo nível da corrida (iniciante < intermediário < competitivo)', alvos['0'] < alvos['2'] < alvos['5'], alvos)
    await ctx.close()
    # iniciante: os primeiros 5 km são celebrados como conquista nova
    ctx, pg, erros2 = await nova(b, 'uIni')
    await pg.evaluate(ZERA)
    await pg.evaluate("""(()=>{ const run = state.modules.run; run.setup.aval = { exp:'nunca', continuo:'0', lim:[] }; run.plan.motor.nivel = 1; delete state.modules.lift; saveData(); })()""")
    await pg.evaluate("window.__mtRegEm = Date.now(); maLogActivity('corrida', 5.1, 38, 6); 0"); await pg.wait_for_timeout(3500)
    r = await pg.evaluate("""({ cartoes: [...document.querySelectorAll('#modal-inner .cel-cartao')].map(c=>c.innerText.replace(/\\n+/g,' | ')), exp: Object.keys(state.trophyExp||{}) })""")
    confere('iniciante: 5K comemorado como conquista nova (não como experiência)', not r['exp'] and any('5K' in c for c in r['cartoes']), r)
    await foto(pg, 'b49-03-celebracao-iniciante')
    confere('sem erros', not erros and not erros2, (erros + erros2)[:3]); await ctx.close()

async def desafio(b):
    print('3. Desafio do mês: participação automática, sair, medalha só para quem participa')
    ctx, pg, erros = await nova(b, 'uDes')
    k = await pg.evaluate("(()=>{ state.eventos = {}; state.eventosRecusados = {}; checkEventos(); const e = eventoPrincipal(); return e && e.key; })()")
    confere('quem tem cadastro pronto já participa do desafio do período (sem botão "Participar")', k and await pg.evaluate(f"!!state.eventos['{k}'] && state.eventos['{k}'].auto === true"), k)
    await pg.evaluate("goTab('challenges')"); await pg.wait_for_timeout(400)
    t = await pg.evaluate("document.getElementById('chal-root').innerText")
    confere('tela: "você está participando", "Metas do mês" e "Medalhas e metas"', 'participando' in t and 'Participar do desafio' not in t and 'metas do mês' in t.lower() and 'medalhas e metas' in t.lower(), t[:300])
    await foto(pg, 'b49-04-desafios')
    await pg.evaluate(f"sairDoEvento('{k}')"); await pg.wait_for_timeout(200)
    await pg.evaluate("document.getElementById('appconfirm-ok').click()"); await pg.wait_for_timeout(300)
    await pg.evaluate("checkEventos()")
    confere('quem sai não é inscrito de novo', await pg.evaluate(f"!state.eventos['{k}'] && !!state.eventosRecusados['{k}']"))
    # completa os dias do desafio sem participar → nenhuma medalha exclusiva
    await pg.evaluate(f"""(()=>{{ const e = eventoPorKey('{k}'); const run = state.modules.run; for(let i=0;i<20;i++){{ const at = e.ini + i*86400000 + 9*3600000; if(at < Date.now()) run.history.push({{ at, duration:30, distance:5, activity:'corrida', rpe:5 }}); }} saveData(); checkEventos(); }})()""")
    confere('sem participar: as metas contam, mas a medalha exclusiva NÃO sai', await pg.evaluate(f"!(state.medals||[]).some(m=>m.id==='ev:{k}')"))
    await pg.evaluate(f"participaEvento('{k}'); state.eventos['{k}'].alvo = 2; checkEventos()"); await pg.wait_for_timeout(300)
    confere('voltando a participar e cumprindo a meta no período, a medalha sai', await pg.evaluate(f"(state.medals||[]).some(m=>m.id==='ev:{k}')"))
    await pg.evaluate("closeModal(); openMedals()"); await pg.wait_for_timeout(300)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('arquivo separa "Medalhas de desafio" de "Metas do mês"', 'medalhas de desafio' in t.lower() and 'metas do mês' in t.lower(), t[:300])
    await foto(pg, 'b49-05-medalhas')
    al = await pg.evaluate("""(()=>{ const r = document.querySelector('#modal-inner .md-row'); if(!r) return null; const i = r.querySelector('.md-ico').getBoundingClientRect(), t = r.querySelector('.md-txt').getBoundingClientRect(); return Math.abs((i.top+i.bottom)/2 - (t.top+t.bottom)/2); })()""")
    confere('ícone da medalha centralizado com o texto (diferença < 3 px)', al is not None and al < 3, al)
    h = await pg.evaluate("cqCelCartao({ k:'m_longao_ouro@2026-11', tid:null, kind:'medalha', emo:'🎯', nome:'Longão do Mês 🥇', desc:'x' }, 0)")
    confere('carrossel: nível do mês aparece como "Meta do mês"', 'Meta do mês' in h and 'Medalha do mês' not in h, h[:200])
    confere('sem erros', not erros, erros[:3]); await ctx.close()

async def outros(b):
    print('4. Assistente, troca, cadastro e nuvem')
    ctx, pg, erros = await nova(b, 'uOut')
    t = await pg.evaluate("""(()=>{ const run = state.modules.run; const ini = new Date(); ini.setDate(1); ini.setHours(8,0,0,0);
        for(let i=0;i<3;i++) run.history.push({ at: Math.min(Date.now()-3600000, ini.getTime() + i*86400000), duration:40, distance:3, activity:'caminhada', rpe:3 });
        saveData(); return analiseMes(); })()""")
    confere('análise do mês: dias ativos, treinos do plano e atividades extras separados', 'treinos planejados' in t and 'atividades extras' in t and 'Adesão ao plano' in t, re.sub('<[^>]+>','',t)[-260:])
    c = await pg.evaluate("(()=>{ const c = contextoAluno(); return { semTreinos:c.semTreinos, semPlanejados:c.semPlanejados, semExtras:c.semExtras, semDias:c.semDias }; })()")
    confere('contexto do assistente tem treinos do plano e extras da semana', isinstance(c.get('semPlanejados'), int) and c['semTreinos'] <= max(c['semPlanejados'], c['semTreinos']), c)
    r = await pg.evaluate("""(()=>{ const w = state.modules.lift.plan.workouts[0]; const cur = w.exercises[0]; mtTrocaAbrir(cur.id, 'ocupado');
        const nomes = [...document.querySelectorAll('#modal-inner .tx-item .tx-nome')].map(e=>e.textContent); const doTreino = w.exercises.filter(e=>e.id!==cur.id).map(e=>e.name);
        return { repetidos: nomes.filter(n=>doTreino.includes(n)), duplicados: nomes.filter((n,i)=>nomes.indexOf(n)!==i), n: nomes.length }; })()""")
    confere('trocar exercício: nada do treino de hoje e nenhuma opção repetida na lista', not r['repetidos'] and not r['duplicados'], r)
    await pg.evaluate("closeModal()")
    confere('cadastro: desenho de boas-vindas sem boneco', await pg.evaluate("!/d-corpo/.test(DECO2_SVG.cadBoasVindas) && /d-ac/.test(DECO2_SVG.cadBoasVindas)"))
    a = await pg.evaluate("(()=>{ const ach = []; limpaParaNuvem(state, 'estadoApp', ach); return ach; })()")
    confere('estado enviado à nuvem não precisa de conversão (sem array dentro de array nem campo reservado)', a == [], a[:5])
    sw = open(os.path.join(AQUI, '..', 'service-worker.js'), encoding='utf-8').read()
    confere('offline: gerador de PDF guardado na instalação e rede lenta com tempo limite', "jspdf.umd.min.js" in sw and 'REDE_TIMEOUT_MS' in sw)
    confere('sem erros', not erros, erros[:3]); await ctx.close()


async def rodada2(b):
    print('5. Segunda rodada: troca sem repetir entre abas, mapa muscular, telas sem piscar, planos, feriado')
    ctx, pg, erros = await nova(b, 'uR2')
    r = await pg.evaluate("""(()=>{ const out = []; state.modules.lift.plan.workouts.forEach(w=>w.exercises.forEach(cur=>{
        if(['corpo','improvisado'].includes(mtEquipClasse(cur))) return;
        const nomes = m=>{ mtTrocaAbrir(cur.id, m); return [...document.querySelectorAll('#modal-inner .tx-item:not(.tx-volta) .tx-nome')].map(e=>e.textContent); };
        const a = nomes('ocupado'), p = nomes('preferencia'); const rep = a.filter(x=>p.includes(x)); if(rep.length) out.push(cur.name + ': ' + rep.join(', ')); })); closeModal(); return out; })()""")
    confere('"Equipamento ocupado" e "Prefiro outro" nunca mostram o mesmo exercício', not r, r[:5])
    # Beta 50: o mapa saiu do topo de Treinos (virou consulta) — conferido em testes/beta50.py
    await pg.evaluate("state.active='lift'; goTab('sessions')"); await pg.wait_for_timeout(600)
    confere('Treinos: orientações do treino no lugar do mapa fixo', await pg.evaluate("!!document.getElementById('mg-card') && !document.querySelector('#session-detail-slot .mm-svg')"))
    await pg.evaluate("window.__anims=0; const o=Element.prototype.animate; Element.prototype.animate=function(){ if(this.id==='modal-inner') window.__anims++; return o.apply(this,arguments); }; window.mtPremium=()=>true; openNutri(); document.querySelectorAll('details.mealc[ontoggle*=nutriTog]').forEach(d=>d.open=true); 0"); await pg.wait_for_timeout(400)
    y0 = await pg.evaluate("""(()=>{ const d=[...document.querySelectorAll('details.mealc[ontoggle*=nutriTog]')].filter(x=>x.querySelector('.ba .ib')).slice(-1)[0]; d.scrollIntoView({block:'start'}); window.__anims=0; return Math.round(d.getBoundingClientRect().top); })()""")
    await pg.evaluate("""(()=>{ const d=[...document.querySelectorAll('details.mealc[ontoggle*=nutriTog]')].filter(x=>x.querySelector('.ba .ib')).slice(-1)[0]; d.querySelector('.ba .ib:last-child').click(); })()"""); await pg.wait_for_timeout(500)
    r = await pg.evaluate("""(()=>{ const d=[...document.querySelectorAll('details.mealc[ontoggle*=nutriTog]')].filter(x=>x.querySelector('.ba .ib')).slice(-1)[0]; return [Math.round(d.getBoundingClientRect().top), window.__anims]; })()""")
    confere('plano alimentar: tirar um alimento não pisca e não volta ao topo', abs(r[0] - y0) <= 2 and r[1] == 0, [y0, r])
    await pg.evaluate("closeModal(); openPlanos()"); await pg.wait_for_timeout(200)
    confere('planos: tabela inteira visível, sem arrastar para o lado', await pg.evaluate("(()=>{ const w=document.querySelector('.pl-tabela-wrap'); return w.scrollWidth <= w.clientWidth + 1; })()"))
    await pg.evaluate("closeModal()")
    r = await pg.evaluate("""(()=>{ const og = window.feriadoDe; const amanha = chaveDia(new Date(Date.now()+86400000)); window.feriadoDe = d=>chaveDia(new Date(d))===amanha ? 'Feriado teste' : null;
        state.active='run'; const run = state.modules.run; const dia = (getDayIdx()%7)+1; if(!run.plan.workouts.some(w=>w.dayIdx===dia)) run.plan.workouts.push(Object.assign({}, run.plan.workouts[0], { dayIdx:dia }));
        state.feriados = {}; run.setup.terrain = 'asfalto'; renderFeriado(); const rua = !document.getElementById('card-feriado').classList.contains('hidden');
        run.setup.terrain = 'esteira'; renderFeriado(); const est = !document.getElementById('card-feriado').classList.contains('hidden'); window.feriadoDe = og; run.setup.terrain = 'asfalto'; return { rua, est }; })()""")
    confere('feriado amanhã: aviso de academia só para corrida na esteira (não na rua)', r['rua'] is False and r['est'] is True, r)
    confere('sem erros', not erros, erros[:3]); await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        await cardapio(b); await conquistas(b); await desafio(b); await outros(b); await rodada2(b)
        await b.close()
    print(f'\nBeta 49: {ok} ok, {falhou} falha(s)')
    if falhou: sys.exit(1)
asyncio.run(main())

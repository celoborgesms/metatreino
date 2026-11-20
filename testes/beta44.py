#!/usr/bin/env python3
"""Beta 44 — carrossel de temas só deslizando (cadastro e Perfil), conquistas no fim do registro + ponto na aba
Desafios + novas que não somem ao abrir uma, trocar exercício com listas diferentes por motivo, primeiros passos
sem botões inúteis e "não vou treinar hoje" coerente com o registro.
Uso: python3 testes/beta44.py http://localhost:8765/index.html [pasta-de-saida]"""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
ok = falhou = 0
def confere(nome, cond, info=''):
    global ok, falhou
    if cond: ok += 1; print('  ✅', nome)
    else: falhou += 1; print('  ❌', nome, str(info)[:300])
async def foto(pg, nome):
    if SAIDA: await pg.screenshot(path=os.path.join(SAIDA, nome + '.png'))
async def nova(b, w=390, h=844, user=None, docs=None, extra=''):
    ctx = await b.new_context(viewport={'width':w,'height':h}, device_scale_factor=2, has_touch=True, is_mobile=True, locale='pt-BR', timezone_id='America/Sao_Paulo')
    await ctx.add_init_script(f"window.__MOCK_USER = {json.dumps(user or {})}; window.__MOCK_DOCS = {json.dumps(docs or {})}; window.__MOCK_SEM_DOC = false; {extra}")
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(2200)
    return ctx, pg, erros
MODAL_ON = "document.getElementById('modal-back').classList.contains('on')"
async def semente(pg):
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
    await pg.evaluate("try{closeAwards()}catch(e){}; try{closeModal()}catch(e){}; state.conqPend=[]; saveData(); 0")

async def carrossel(b):
    print('1. Carrossel de temas no cadastro')
    for w, h in [(390, 844), (360, 740), (320, 640)]:
        ctx, pg, erros = await nova(b, w, h)
        await pg.wait_for_function("document.querySelector('.screen.active') && document.querySelector('.screen.active').id==='scr-quiz'", timeout=15000)
        await pg.wait_for_timeout(600)
        r = await pg.evaluate("""(()=>{ const bt=[...document.querySelectorAll('#scr-quiz button')].find(b=>/Continuar/.test(b.textContent)&&b.offsetParent).getBoundingClientRect();
          const tit=[...document.querySelectorAll('#scr-quiz *')].find(e=>/^estilo dos ícones$/i.test(e.textContent.trim()) && e.children.length===0);
          return { setas: document.querySelectorAll('#wz-temas .tc-seta').length, usar: document.querySelectorAll('#wz-temas .tc-usar').length,
            esq: Math.round(bt.left), dir: Math.round(innerWidth-bt.right), icTop: tit ? Math.round(tit.getBoundingClientRect().top) : 9999, btTop: Math.round(bt.top),
            lateral: document.documentElement.scrollWidth - innerWidth }; })()""")
        if w == 390:
            confere('sem setas e sem botão "Usar este tema" (só deslizar)', r['setas'] == 0 and r['usar'] == 0, r)
            confere('"Continuar" centralizado', abs(r['esq'] - r['dir']) <= 2, r)
            confere('"Estilo dos ícones" aparece sem rolar a tela', r['icTop'] < r['btTop'], r)
            await foto(pg, 'b44-01-cadastro')
        confere(f'{w}px: sem rolagem lateral', r['lateral'] <= 1, r)
        t0 = await pg.evaluate("currentTheme()")
        await pg.evaluate("(()=>{ const tr=document.querySelector('#wz-temas .tc-trilho'); tr.scrollBy({left: tr.children[0].clientWidth*2+24, behavior:'smooth'}); })()")
        await pg.wait_for_timeout(1500)
        r2 = await pg.evaluate("({ tema: currentTheme(), foco: document.querySelector('#wz-temas .tc-slide.foco').dataset.k, on: (document.querySelector('#wz-temas .tc-slide.on')||{dataset:{}}).dataset.k, n: document.querySelectorAll('#wz-temas .tc').length })")
        confere(f'{w}px: deslizar e soltar aplica o tema do centro sozinho', r2['tema'] == r2['foco'] == r2['on'] and r2['tema'] != t0, [t0, r2])
        confere(f'{w}px: o carrossel não é recriado a cada troca (não trava)', r2['n'] == 1)
        # toque em um tema ao lado: centraliza e aplica
        await pg.evaluate("(()=>{ const f=document.querySelector('#wz-temas .tc-slide.foco'); (f.nextElementSibling||f.previousElementSibling).click(); })()")
        await pg.wait_for_timeout(1500)
        r3 = await pg.evaluate("({ tema: currentTheme(), foco: document.querySelector('#wz-temas .tc-slide.foco').dataset.k })")
        confere(f'{w}px: tocar no tema ao lado centraliza e aplica', r3['tema'] == r3['foco'] and r3['tema'] != r2['tema'], [r2, r3])
        confere(f'{w}px: sem erros', not erros, erros[:3]); await ctx.close()

    print('2. Perfil › Aparência com o mesmo carrossel')
    ctx, pg, erros = await nova(b)
    await semente(pg)
    await pg.evaluate("goTab('profile'); openAparencia()"); await pg.wait_for_timeout(500)
    r = await pg.evaluate("({ tc: document.querySelectorAll('#modal-inner .tc').length, setas: document.querySelectorAll('#modal-inner .tc-seta').length, grades: document.querySelectorAll('#modal-inner .ap-grid').length })")
    confere('Aparência usa o carrossel (sem grades e sem setas)', r['tc'] == 1 and r['setas'] == 0 and r['grades'] == 0, r)
    t0 = await pg.evaluate("currentTheme()")
    await pg.evaluate("(()=>{ const tr=document.querySelector('#modal-inner .tc-trilho'); tr.scrollBy({left: tr.children[0].clientWidth+12, behavior:'smooth'}); })()")
    await pg.wait_for_timeout(1500)
    r = await pg.evaluate("({ tema: currentTheme(), foco: document.querySelector('#modal-inner .tc-slide.foco').dataset.k, salvo: (state.settings||{}).theme || state.theme || null })")
    confere('Aparência: deslizar aplica o tema', r['tema'] == r['foco'] and r['tema'] != t0, [t0, r])
    await foto(pg, 'b44-02-aparencia')
    await pg.evaluate("closeModal()"); await pg.wait_for_timeout(200)
    confere('Aparência: modal continua abrível e fechável (sem travar)', not await pg.evaluate(MODAL_ON))
    confere('sem erros', not erros, erros[:3]); await ctx.close()

async def conquistas(b):
    print('3. Conquistas: carrossel no fim do registro, um aviso só, nada preso')
    ctx, pg, erros = await nova(b)
    await semente(pg)
    await pg.evaluate("goTab('home')"); await pg.wait_for_timeout(300)
    # Beta 49: etapas da mesma família (5K → 10K) viram um cartão só; o teste usa conquistas de famílias diferentes
    ids = await pg.evaluate("(()=>{ const fam = id=>{ const i = CQ_FAMILIAS.findIndex(f=>f.includes(id)); return i < 0 ? 'u'+id : 'f'+i; }; const out = [], usadas = new Set(); TROPHIES.filter(t=>!t.secret && !state.trophies.includes(t.id) && !CQ_PRIMEIRAS.includes(t.id)).forEach(t=>{ const f = fam(t.id); if(out.length < 4 && !usadas.has(f)){ usadas.add(f); out.push(t.id); } }); return out; })()")
    await pg.evaluate(f"unlockTrophy('{ids[0]}')"); await pg.wait_for_timeout(2000)
    confere('fora do fim de um registro: nada abre por cima', not await pg.evaluate(MODAL_ON))
    confere('um aviso só: ponto na aba Desafios, sem selo no cartão do Início', await pg.evaluate("!!document.querySelector('.tab[data-tab=\"challenges\"] .cq-dot') && !document.querySelector('#home-trofeus .cq-badge')"))
    await pg.evaluate("goTab('challenges')"); await pg.wait_for_timeout(300)
    confere('dentro de Desafios: "1 nova" escrito no cartão Conquistas (sem selo extra)', await pg.evaluate("(document.querySelector('.chal-tile[onclick^=\"openTrophies\"] .cq-novas-txt')||{}).textContent==='1 nova' && !document.querySelector('.chal-tile .cq-badge')"))
    await foto(pg, 'b44-03-ponto-desafios')
    await pg.evaluate("goTab('home')"); await pg.wait_for_timeout(200)
    # registro: carrossel depois do resumo
    await pg.evaluate("appConfirm('Resumo do registro (simulado)', ()=>{}, {title:'Treino salvo'}); window.__mtRegEm = Date.now(); 0")
    await pg.evaluate(f"unlockTrophy('{ids[1]}'); unlockTrophy('{ids[2]}')"); await pg.evaluate("state.conqPend.push({k:'medalha-teste', tid:null, kind:'medalha', emo:'🏅', nome:'Medalha teste', desc:'Sem detalhe', at:Date.now()}); 0")
    await pg.wait_for_timeout(2200)
    confere('espera a tela de resumo do registro fechar', 'Treino salvo' in await pg.evaluate("document.getElementById('modal-inner').innerText"))
    await pg.evaluate("closeModal()"); await pg.wait_for_timeout(1600)
    r = await pg.evaluate("({ cel: !!document.querySelector('#modal-inner .cq-cel'), n: document.querySelectorAll('#modal-inner .cel-cartao').length, pos: (document.getElementById('cel-pos')||{}).textContent, pend: state.conqPend.length })")
    confere('carrossel com uma conquista por vez ("1 de 2")', r['cel'] and r['n'] == 2 and r['pos'] == '1 de 2', r)
    confere('o cartão que aparece conta como visto', r['pend'] == 3, r)
    await foto(pg, 'b44-04-celebracao')
    await pg.evaluate("cqCelPasso(1)"); await pg.wait_for_timeout(600)
    r = await pg.evaluate("({ pos: document.getElementById('cel-pos').textContent, pend: state.conqPend.length })")
    confere('passar para o lado mostra a próxima e marca como vista', r['pos'] == '2 de 2' and r['pend'] == 2, r)
    await pg.evaluate("(()=>{ const tr=document.getElementById('cel-trilho'); tr.scrollTo({left:0}); })()"); await pg.wait_for_timeout(500)
    confere('deslizar de volta também funciona', await pg.evaluate("document.getElementById('cel-pos').textContent") == '1 de 2')
    await pg.evaluate("closeModal()"); await pg.wait_for_timeout(1800)
    confere('não repete a mesma celebração', not await pg.evaluate(MODAL_ON))
    confere('o ponto continua enquanto houver novidade não vista', await pg.evaluate("!!document.querySelector('.tab[data-tab=\"challenges\"] .cq-dot')"))
    await pg.evaluate("openTrophies()"); await pg.wait_for_timeout(1200)
    n1 = await pg.evaluate("document.querySelectorAll('.cq-novos .cq-novo').length")
    confere('aba Conquistas mostra as não vistas (inclusive a medalha sem detalhe)', n1 == 2, n1)
    confere('Beta 55: abrir a aba não marca nada; o indicador continua até tocar em cada uma', await pg.evaluate("!!document.querySelector('.tab[data-tab=\"challenges\"] .cq-dot') && state.conqPend.length===2"))
    await pg.evaluate(f"openTrophyDetail('{ids[0]}')"); await pg.wait_for_timeout(300)
    await pg.evaluate("openTrophiesKeepScroll()"); await pg.wait_for_timeout(500)
    confere('abrir uma e voltar: só a que foi vista sai das novas', await pg.evaluate("document.querySelectorAll('.cq-novos .cq-novo').length") == 1)
    confere('voltar não reanima', await pg.evaluate("!document.querySelector('.cq.cq-anim')"))
    confere('sem botão "Marcar todas como vistas" (não precisa)', not await pg.evaluate("!!document.querySelector('.cq-vistas')"))
    await pg.evaluate("document.querySelector('.cq-novos .cq-novo').click()"); await pg.wait_for_timeout(500)
    await pg.evaluate("closeModal(); openTrophies()"); await pg.wait_for_timeout(400)
    confere('fechar e abrir de novo: as já vistas saem (nenhuma fica presa)', not await pg.evaluate("!!document.querySelector('.cq-novos')"))
    confere('sem erros', not erros, erros[:3]); await ctx.close()

async def troca(b):
    print('4. Trocar exercício: "Equipamento ocupado" × "Prefiro outro"')
    ctx, pg, erros = await nova(b)
    await semente(pg)
    r = await pg.evaluate("""(()=>{ const out = []; const mod = state.modules.lift; if(!mod || !mod.plan) return {erro:'sem plano'};
      let dif = 0, tot = 0, ocupMesmoEqNoTopo = 0, prefMesmoEq = 0, prefTemMesmo = 0;
      mod.plan.workouts.forEach(w=>w.exercises.forEach(e=>{
        if(['corpo','improvisado'].includes(mtEquipClasse(e))) return;
        const o = mtCandidatosTroca(w, e, 'ocupado', {equip:'academia', level:'intermediario'}), p = mtCandidatosTroca(w, e, 'preferencia', {equip:'academia', level:'intermediario'});
        if(!o || !p) return; tot++;
        const lo = [...o.mais, ...o.compat, ...o.mesmoEq].slice(0,3).map(x=>x.id).join(), lp = [...p.mesmoEq, ...p.mais, ...p.compat].slice(0,3).map(x=>x.id).join();
        if(lo !== lp) dif++;
        const eq = mtEquipClasse(e);
        if(['cabo','maquina','smith','barra'].includes(eq) && [...o.mais, ...o.compat].some(x=>mtEquipClasse(x.ex)===eq && x.id!==((e.troca&&e.troca.orig&&e.troca.orig.id)||e.id))) ocupMesmoEqNoTopo++;
        const mp = [...p.mesmoEq, ...p.mais, ...p.compat]; if(mp.some(x=>mtEquipClasse(x.ex)===eq && (x.pad===mtPadrao(e).pad || (MT_VIZINHOS[mtPadrao(e).pad]||[]).includes(x.pad)))){ prefTemMesmo++; if(mtEquipClasse(mp[0].ex)===eq) prefMesmoEq++; }
      }));
      return { tot, dif, ocupMesmoEqNoTopo, prefMesmoEq, prefTemMesmo }; })()""")
    confere('as duas abas mudam a ordem quando existe opção no mesmo equipamento', r.get('tot', 0) > 0 and r['dif'] >= r['prefTemMesmo'], r)
    confere('"Equipamento ocupado": o mesmo tipo de aparelho não fica entre os principais', r.get('ocupMesmoEqNoTopo', 1) == 0, r)
    confere('"Prefiro outro": quando existe, o mesmo tipo de equipamento vem primeiro', r.get('prefMesmoEq', 0) == r.get('prefTemMesmo', -1), r)
    # tela: as duas abas mostram textos e seções diferentes
    ex = await pg.evaluate("(()=>{ const w = state.modules.lift.plan.workouts.find(w=>w.exercises.some(e=>mtEquipClasse(e)==='maquina')) || state.modules.lift.plan.workouts[0]; const e = w.exercises.find(e=>mtEquipClasse(e)==='maquina') || w.exercises[0]; return e.id; })()")
    await pg.evaluate(f"mtTrocaAbrir('{ex}', 'ocupado')"); await pg.wait_for_timeout(200)
    t1 = await pg.evaluate("document.getElementById('modal-inner').innerText")
    await pg.evaluate(f"mtTrocaAbrir('{ex}', 'preferencia')"); await pg.wait_for_timeout(200)
    t2 = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('cada aba explica o critério', 'outro equipamento' in t1 and 'mesmo tipo de equipamento' in t2, [t1[:200], t2[:200]])
    confere('telas diferentes entre as abas', t1 != t2)
    await foto(pg, 'b44-05-troca')
    await pg.evaluate("closeModal()")
    confere('sem erros', not erros, erros[:3]); await ctx.close()

async def inicio_e_descanso(b):
    print('5. Primeiros passos e "não vou treinar hoje"')
    ctx, pg, erros = await nova(b)
    await semente(pg)
    await pg.evaluate("state.modules.lift.history = []; (state.modules.run||{}).history = []; localStorage.removeItem('mt_smart_fechado'); goTab('home'); renderHomeSmart(); 0"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("(()=>{ const s = document.querySelector('#home-smart .smart'); return s ? { txt: s.innerText, botoes: [...s.querySelectorAll('.smart-a button')].map(b=>b.textContent.trim()) } : null; })()")
    confere('card "Primeiros passos" sem "Ver treino" e sem "Como executar"', r and 'Primeiros passos' in r['txt'].title() or (r and 'PRIMEIROS PASSOS' in r['txt'].upper()) and not r['botoes'], r)
    # pular o treino e tentar registrar
    await pg.evaluate("""(()=>{ state.active='lift'; const mod = state.modules.lift; const w = currentSelectedWorkout(mod) || mod.plan.workouts[0];
      window.__w = w; const d = new Date(); d.setHours(0,0,0,0); state.skips = [{at:d.getTime(), module:'lift', k:w.k, dayIdx:w.dayIdx}]; goTab('sessions'); renderSessions(); })()""")
    await pg.wait_for_timeout(400)
    r = await pg.evaluate("(()=>{ const slot = document.getElementById('session-detail-slot'); const f = slot.firstElementChild; return { topo: !!(f && f.querySelector('button[onclick^=\"unskipWorkout\"]')), classe: slot.classList.contains('mt-pulado'), w: !!isSkippedToday(window.__w) }; })()")
    confere('treino pulado: o aviso "Voltar atrás" fica no topo da sessão', r['topo'] and r['classe'] and r['w'], r)
    await foto(pg, 'b44-06-pulado')
    await pg.evaluate("document.querySelector('#session-detail-slot button[onclick^=\"openSetLog\"]').click(); 0"); await pg.wait_for_timeout(300)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('"Registrar" com treino pulado pergunta se quer voltar a treinar', 'Voltar a treinar hoje?' in t, t[:200])
    await pg.evaluate("document.getElementById('appconfirm-cancel').click(); 0"); await pg.wait_for_timeout(300)
    confere('"Continuar descansando" mantém o dia pulado', await pg.evaluate("isSkippedToday(window.__w) && !document.getElementById('modal-back').classList.contains('on')"))
    await pg.evaluate("document.querySelector('#session-detail-slot button[onclick^=\"openSetLog\"]').click(); 0"); await pg.wait_for_timeout(300)
    await pg.evaluate("document.getElementById('appconfirm-ok').click(); 0"); await pg.wait_for_timeout(900)
    r = await pg.evaluate("({ pulado: isSkippedToday(window.__w), modal: document.getElementById('modal-back').classList.contains('on'), txt: document.getElementById('modal-inner').innerText.slice(0,120) })")
    confere('"Sim, vou treinar" reativa o treino e abre o registro da série', not r['pulado'] and r['modal'] and 'Voltar a treinar' not in r['txt'], r)
    await pg.evaluate("closeModal()")
    confere('sem erros', not erros, erros[:3]); await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        await carrossel(b); await conquistas(b); await troca(b); await inicio_e_descanso(b)
        await b.close()
    print(f'\nBeta 44: {ok} ok, {falhou} falha(s)'); sys.exit(1 if falhou else 0)
asyncio.run(main())

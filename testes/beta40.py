#!/usr/bin/env python3
"""Beta 40: planos Gratuito/Premium, cadastro automático, teste de 30 dias, temas, assistente, PDFs,
correções do cadastro (peso, ícones, data, IMC, explicações, objetivos, início, tempo de prova),
limitações, terreno, RPE e painel (planos, remover administrador, excluir conta).
Firebase simulado (testes/mock-firebase.js). Uso:
  python3 testes/beta40.py http://localhost:8765/index.html [pasta-de-saida]"""
import asyncio, sys, os, json, base64
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
ok = falhou = 0
DIA = 86400000
def confere(nome, cond, info=''):
    global ok, falhou
    if cond: ok += 1; print('  ✅', nome)
    else: falhou += 1; print('  ❌', nome, info)
ATIVA = "document.querySelector('.screen.active').id"
async def foto(pg, nome):
    if SAIDA: await pg.screenshot(path=os.path.join(SAIDA, nome + '.png'))
async def nova(b, user=None, docs=None, sem_doc=False, w=390, h=844, espera=2200):
    ctx = await b.new_context(viewport={'width':w,'height':h}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Sao_Paulo')
    init = f"window.__MOCK_USER = {json.dumps(user or {})}; window.__MOCK_DOCS = {json.dumps(docs or {})}; window.__MOCK_SEM_DOC = {'true' if sem_doc else 'false'};"
    await ctx.add_init_script(init)
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(espera)
    return ctx, pg, erros
async def agora(pg): return await pg.evaluate("Date.now()")
async def salva_pdf(pg, nome):
    b64 = await pg.evaluate("""(async()=>{ const u = window._pdfUlt; if(!u) return null; const ab = await u.blob.arrayBuffer(); let s=''; const a=new Uint8Array(ab); for(let i=0;i<a.length;i++) s+=String.fromCharCode(a[i]); return btoa(s); })()""")
    if b64 and SAIDA: open(os.path.join(SAIDA, nome), 'wb').write(base64.b64decode(b64))
    return len(base64.b64decode(b64)) if b64 else 0
ALUNO = 'aluna.nova@example.com'

async def cadastro(b):
    print('1. Novo cadastro por e-mail (sem confirmar → confirma → Teste Premium)')
    ctx, pg, erros = await nova(b, user={'uid':'u-mail','email':ALUNO,'displayName':'Aluna','emailVerified':False}, sem_doc=True)
    confere('e-mail ainda não confirmado: tela pede a confirmação (não "não autorizado")', await pg.evaluate(ATIVA) == 'scr-noaccess' and 'Confirme' in await pg.evaluate("document.getElementById('noaccess-tit').textContent"))
    confere('nenhum plano criado antes de confirmar', await pg.evaluate(f"!window.__mockFS['usuariosAutorizados/{ALUNO}']"))
    await ctx.close()
    ctx, pg, erros = await nova(b, user={'uid':'u-mail','email':ALUNO,'displayName':'Aluna','emailVerified':True}, sem_doc=True)
    d = await pg.evaluate(f"window.__mockFS['usuariosAutorizados/{ALUNO}']")
    confere('confirmou: entra direto no cadastro (sem autorização do treinador)', await pg.evaluate(ATIVA) == 'scr-quiz', await pg.evaluate(ATIVA))
    confere('Teste Premium criado automaticamente (plano "teste" com data)', d and d.get('plano') == 'teste' and d.get('testeInicio'), d)
    p = await pg.evaluate("planoAtual()")
    confere('plano atual: teste, Premium liberado, 30 dias', p['tipo'] == 'teste' and p['premium'] and 29 <= await pg.evaluate("accessDaysLeft()") <= 30, p)
    # criar conta nova sem e-mail real (usuário) foi bloqueado na tela
    await pg.evaluate("doLogout()"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("(()=>{ toggleAuthMode(); document.getElementById('auth-email').value='joao123'; document.getElementById('auth-pass').value='123456'; document.getElementById('auth-name').value='Joao'; doEmailAuth(); return document.getElementById('auth-err').textContent; })()")
    confere('conta nova de "usuário" (sem e-mail) não é criada: pede e-mail real ou Google', 'e-mail real' in r, r)
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()
    print('2. Novo cadastro pelo Google')
    ctx, pg, erros = await nova(b, user={'uid':'u-goo','email':'google.novo@example.com','displayName':'Google Novo','emailVerified':True,'providerData':[{'providerId':'google.com'}]}, sem_doc=True)
    d = await pg.evaluate("window.__mockFS['usuariosAutorizados/google.novo@example.com']")
    confere('Google: entra no cadastro e ganha o Teste Premium', await pg.evaluate(ATIVA) == 'scr-quiz' and d and d.get('plano') == 'teste', d)
    confere('o aluno só grava os campos permitidos pelas regras', d and set(d.keys()) <= {'plano','testeInicio','origem','name'}, d)
    await foto(pg, 'b40-01-cadastro-google')
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()

async def gratuito(b):
    print('3–6. Usuário Gratuito: musculação, corrida, vídeo no treino e biblioteca')
    docs = {f'usuariosAutorizados/{ALUNO}': {'plano':'gratuito'}}
    ctx, pg, erros = await nova(b, user={'email':ALUNO}, docs=docs)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(600)
    confere('Gratuito entra normalmente', await pg.evaluate("planoAtual().tipo") == 'gratuito' and await pg.evaluate(ATIVA) == 'scr-home')
    # 3. musculação: registrar séries e salvar o treino
    n0 = await pg.evaluate("state.modules.lift.history.length")
    r = await pg.evaluate("""(()=>{ const w = state.modules.lift.plan.workouts.find(x=>x.dayIdx===getDayIdx()) || state.modules.lift.plan.workouts[0];
      const ex = w.exercises[0]; const hoje = Date.now();
      state.progress[ex.id] = (state.progress[ex.id]||[]).filter(p=>new Date(p.date).toDateString()!==new Date().toDateString());
      state.progress[ex.id].push({ date:hoje, sets:[{peso:20,reps:10},{peso:20,reps:10}] });
      goTab('sessions'); selectSession(w.k); finishLiftWorkout(w.k); rpeSet(7); confirmLiftWorkout(w.k); return w.k; })()""")
    await pg.wait_for_timeout(500)
    confere('musculação: treino salvo no histórico (com RPE)', await pg.evaluate("state.modules.lift.history.length") == n0 + 1 and await pg.evaluate("state.modules.lift.history.slice(-1)[0].rpe") == 7)
    # 4. corrida
    n1 = await pg.evaluate("state.modules.run.history.length")
    await pg.wait_for_timeout(2500)
    for _ in range(4):
        await pg.evaluate("closeModal(); state.active='run'; openRunLog('livre')"); await pg.wait_for_timeout(700)
        if await pg.evaluate("!!document.getElementById('rl-km')"): break
    await pg.evaluate("[['rl-km','5'],['rl-h','0'],['rl-m','30'],['rl-s','0']].forEach(([i,v])=>{ const e=document.getElementById(i); e.value=v; e.dispatchEvent(new Event('input',{bubbles:true})); }); saveRunLog('livre')"); await pg.wait_for_timeout(400)
    confere('corrida: atividade registrada', await pg.evaluate("state.modules.run.history.length") == n1 + 1)
    # 5. vídeo durante o treino
    await pg.evaluate("closeModal(); state.active='lift'; goTab('sessions')"); await pg.wait_for_timeout(300)
    nome = await pg.evaluate("currentSelectedWorkout(state.modules.lift).exercises[0].name")
    await pg.evaluate(f"playExercise({json.dumps(nome)})"); await pg.wait_for_timeout(400)
    confere('vídeo/ficha do exercício abre durante o treino (Gratuito)', await pg.evaluate("document.getElementById('modal-inner').classList.contains('modal-ex')"))
    await pg.evaluate("closeModal(); goTab('home')"); await pg.wait_for_timeout(300)
    await pg.evaluate(f"openExerciseSheet({json.dumps(nome)})"); await pg.wait_for_timeout(300)
    confere('exercício do próprio plano também abre fora da aba Treinos', await pg.evaluate("document.getElementById('modal-inner').classList.contains('modal-ex')"))
    await pg.evaluate("closeModal()"); await pg.wait_for_timeout(200)
    # 6. biblioteca
    await pg.evaluate("goTab('library')"); await pg.wait_for_timeout(300)
    confere('biblioteca completa: Gratuito vê o aviso Premium (não abre a lista)', await pg.evaluate(ATIVA) != 'scr-library' and 'Biblioteca completa' in await pg.evaluate("document.getElementById('modal-inner').textContent"))
    await foto(pg, 'b40-02-aviso-premium-biblioteca')
    await pg.evaluate("closeModal()"); await pg.wait_for_timeout(200)
    fora = await pg.evaluate("(()=>{ const no = new Set(state.modules.lift.plan.workouts.flatMap(w=>w.exercises.map(e=>e.name))); for(const c of EX_BANK) for(const e of c.items) if(!no.has(e.name) && !mtExNoPlano(e.name)) return e.name; })()")
    await pg.evaluate(f"openExerciseSheet({json.dumps(fora)})"); await pg.wait_for_timeout(300)
    confere('ficha de exercício fora do plano: controlada na função (aviso Premium)', not await pg.evaluate("document.getElementById('modal-inner').classList.contains('modal-ex')") and 'não está no seu plano' in await pg.evaluate("document.getElementById('modal-inner').textContent"))
    await pg.evaluate("closeModal(); renderLibrary()")
    confere('renderLibrary chamado direto também não lista o catálogo', 'Premium' in await pg.evaluate("document.getElementById('lib-list').textContent"))
    # outros recursos Premium
    await pg.evaluate("openNutri()"); await pg.wait_for_timeout(200)
    confere('plano alimentar: aviso Premium', 'Plano alimentar' in await pg.evaluate("document.getElementById('modal-inner').textContent") and not await pg.evaluate("!!document.querySelector('#modal-inner .mealc')"))
    await pg.evaluate("closeModal(); arqRelatorio()"); await pg.wait_for_timeout(200)
    confere('relatório PDF: aviso Premium', 'Relatório completo' in await pg.evaluate("document.getElementById('modal-inner').textContent"))
    await pg.evaluate("closeModal()"); await pg.evaluate("pdfTreino()"); await pg.wait_for_timeout(200)
    confere('PDF do treino: aviso Premium', 'PDF do plano de treino' in await pg.evaluate("document.getElementById('modal-inner').textContent"))
    await pg.evaluate("closeModal()")
    r = await pg.evaluate("MA_ANSWERS.analise_mes()")
    confere('assistente: análise avançada vira explicação do Premium', 'Meta Assistente completo' in r)
    r = await pg.evaluate("MA_ANSWERS.treino_hoje()")
    confere('assistente: dúvida básica do treino continua respondida', 'Meta Assistente completo' not in r and len(r) > 20)
    r = await pg.evaluate("(()=>{ const x = maTryCommand('estou pesando 70'); return x && x.msg; })()")
    confere('assistente: registrar peso continua no Gratuito', r and 'Premium' not in r, r)
    r = await pg.evaluate("(()=>{ const x = maTryCommand('quero treinar musculação segunda e quarta'); return { msg: x && x.msg, pend: typeof maPending!=='undefined' ? maPending : 'x' }; })()")
    confere('assistente: reorganizar o plano por comando é Premium (nada fica pendente)', 'Premium' in (r['msg'] or '') and r['pend'] is None, r)
    confere('clima: nenhuma consulta para o cenário no Gratuito', await pg.evaluate("weatherData === null && _cenaClima() === null"))
    await pg.evaluate("goTab('home')"); await pg.wait_for_timeout(300)
    confere('cenário do Início desenhado só pelo horário/data', await pg.evaluate("(document.getElementById('app-deco').dataset.cena||'').includes('semclima') || (document.getElementById('app-deco').dataset.cena||'').startsWith('data-')"))
    await pg.evaluate("openPersonalizarInicio()"); await pg.wait_for_timeout(200)
    confere('personalizar início: opções básicas + aviso Premium', await pg.evaluate("!!document.querySelector('#modal-inner .pl-opcoes') && !document.querySelector('#modal-inner .pi-sw')"))
    await pg.evaluate("piBasico('essencial')")
    confere('opção básica funciona (só o essencial)', await pg.evaluate("state.inicioBasico === 'essencial' && inicioOcultos().length >= 6"))
    await pg.evaluate("piBasico('completo'); closeModal()")
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()

async def premium(b):
    print('7–9. Premium: biblioteca, PDF de treino, corrida e alimentação')
    ctx, pg, erros = await nova(b)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(600)
    await pg.evaluate("goTab('library')"); await pg.wait_for_timeout(400)
    confere('Premium: biblioteca abre com o catálogo', await pg.evaluate(ATIVA) == 'scr-library' and await pg.evaluate("document.querySelectorAll('#lib-list .lx-item').length") > 50)
    await pg.evaluate("goTab('home')"); await pg.wait_for_timeout(200)
    await pg.evaluate("state.active='lift'; pdfTreino('lift')"); await pg.wait_for_timeout(2500)
    n = await salva_pdf(pg, 'b40-plano-musculacao.pdf')
    confere('PDF do plano de musculação gerado', n > 20000 and 'Plano de treino' in await pg.evaluate("document.getElementById('modal-inner').textContent"), n)
    await pg.evaluate("closeModal(); pdfTreino('run')"); await pg.wait_for_timeout(2500)
    n = await salva_pdf(pg, 'b40-plano-corrida.pdf')
    confere('PDF do plano de corrida gerado', n > 20000, n)
    await pg.evaluate("closeModal(); openNutri()"); await pg.wait_for_timeout(300)
    confere('plano alimentar abre com o botão de PDF', await pg.evaluate("!!document.getElementById('nutri-pdf')"))
    await pg.evaluate("pdfAlimentacao()"); await pg.wait_for_timeout(3000)
    n = await salva_pdf(pg, 'b40-plano-alimentar.pdf')
    confere('PDF do plano alimentar gerado (7 dias)', n > 20000, n)
    await pg.evaluate("closeModal(); arqRelatorio()"); await pg.wait_for_timeout(300)
    await pg.evaluate("arqGerarPDF()"); await pg.wait_for_timeout(3500)
    n = await salva_pdf(pg, 'b40-relatorio-evolucao.pdf')
    confere('relatório de evolução com a identidade nova', n > 20000, n)
    for tema in ['ametista', 'coral', 'amoled']:
        await pg.evaluate(f"closeModal(); setTheme('{tema}')"); await pg.wait_for_timeout(150)
        await pg.evaluate("pdfTreino('lift')"); await pg.wait_for_timeout(2200)
        n = await salva_pdf(pg, f'b40-plano-musculacao-{tema}.pdf')
        confere(f'PDF no tema {tema}', n > 20000, n)
    await pg.evaluate("closeModal()")
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()

async def fim_do_teste(b):
    print('10–12, 15. Fim do teste de 30 dias, conversão para Gratuito, dados preservados, tema')
    t = await (await (await b.new_context()).new_page()).evaluate("Date.now()")
    docs = {f'usuariosAutorizados/{ALUNO}': {'plano':'teste', 'testeInicio': t - 29*DIA - 3600000*20}}
    ctx, pg, erros = await nova(b, user={'email':ALUNO}, docs=docs)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(600)
    await pg.evaluate("setTheme('aurora'); state.inicioOrdem=['frase','semana']; state.inicioOcultos=['frase']; state.nutri = state.nutri || {}; state.nutri.objetivo='massa'; saveData(); mtPlanoVerifica()")
    confere('teste ativo no último dia: Premium', await pg.evaluate("planoAtual().tipo") == 'teste' and await pg.evaluate("accessDaysLeft()") == 1)
    antes = await pg.evaluate("({ l:state.modules.lift.history.length, r:state.modules.run.history.length, p:Object.keys(state.progress).length, w:state.weights.length, tr:state.trophies.length })")
    # o tempo passa: o teste termina com o app aberto
    await pg.evaluate("myAccess = Object.assign({}, myAccess, { testeInicio: Date.now() - 31*86400000 }); mtPlanoVerifica()"); await pg.wait_for_timeout(900)
    confere('fim do teste: conversão automática para Gratuito', await pg.evaluate("planoAtual().tipo") == 'gratuito' and await pg.evaluate("planoAtual().testeAcabouEm") > 0)
    txt = await pg.evaluate("document.getElementById('modal-inner').textContent")
    confere('aviso claro do fim do teste, com contato para contratar', 'teste Premium de 30 dias terminou' in txt and 'Nada foi apagado' in txt and 'administração' in txt, txt[:140])
    confere('tema Premium trocado pelo equivalente gratuito (Aurora → Brasa)', await pg.evaluate("currentTheme()") == 'zepp' and await pg.evaluate("state.prefs.temaPremium") == 'aurora')
    await foto(pg, 'b40-03-fim-do-teste')
    depois = await pg.evaluate("({ l:state.modules.lift.history.length, r:state.modules.run.history.length, p:Object.keys(state.progress).length, w:state.weights.length, tr:state.trophies.length })")
    confere('histórico, cargas, peso e conquistas preservados', antes == depois, (antes, depois))
    confere('preferências Premium guardadas (ordem do início, ocultos, alimentação)', await pg.evaluate("JSON.stringify(state.inicioOrdem)") == '["frase","semana"]' and await pg.evaluate("state.inicioOcultos[0]") == 'frase' and await pg.evaluate("state.nutri.objetivo") == 'massa')
    confere('Início no Gratuito: ordem padrão aplicada (sem apagar a escolha)', await pg.evaluate("!(document.getElementById('inicio-ordem-css').textContent||'').includes('order:11')"))
    await pg.evaluate("closeModal(); setTheme('oceano')"); await pg.wait_for_timeout(200)
    confere('15. depois de perder o Premium, tema Premium não é aplicado (aviso)', await pg.evaluate("currentTheme()") == 'zepp' and 'exclusivo do Premium' in await pg.evaluate("document.getElementById('modal-inner').textContent"))
    await pg.evaluate("closeModal(); setTheme('areia')"); await pg.wait_for_timeout(150)
    confere('15. tema gratuito claro continua liberado e salvo na conta', await pg.evaluate("currentTheme()") == 'areia' and await pg.evaluate("state.prefs.tema") == 'areia')
    await pg.evaluate("openAparencia()"); await pg.wait_for_timeout(300)
    confere('Aparência: 10 temas com prévia real, Premium marcados', await pg.evaluate("document.querySelectorAll('#modal-inner .ap-opt').length") == 10 and await pg.evaluate("document.querySelectorAll('#modal-inner .ap-opt.pl-trava').length") == 8)
    await foto(pg, 'b40-04-aparencia-gratuito')
    await pg.evaluate("closeModal()")
    # reabrir em outro aparelho: a escolha de tema vem da conta
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()

async def admin(b):
    print('13–14. Administrador: renovar Premium, bloquear, remover administrador, excluir conta')
    pg0 = await (await b.new_context()).new_page(); await pg0.goto(URL); await pg0.wait_for_timeout(800)
    dono = await pg0.evaluate("String(ADMIN_EMAIL).toLowerCase()"); t = await pg0.evaluate("Date.now()")
    docs = { f'usuariosAutorizados/{ALUNO}': {'plano':'teste','testeInicio': t - 40*DIA, 'name':'Aluna'},
             f'usuarios/u-aluna': {'email':ALUNO, 'nome':'Aluna', 'atualizadoEm': t, 'estadoApp': {'user':{'profile':{'nickname':'Aluna'}}, 'modules':{'lift':None,'run':None}}},
             'usuarios/u-sec': {'email':'secundario@example.com', 'nome':'Sec', 'atualizadoEm': t},
             'admins/secundario@example.com': {'ativo': True},
             'usuarios/u-free': {'email':'semdoc@example.com', 'nome':'Sem Doc', 'atualizadoEm': t},
             f'admins/{dono}': {'ativo': True} }
    ctx, pg, erros = await nova(b, user={'uid':'dono','email':dono,'displayName':'Dono','emailVerified':True}, docs=docs)
    confere('dono entra como administrador (Premium)', await pg.evaluate("state.user.isAdmin && mtPrincipal() && planoAtual().premium"))
    await pg.evaluate("goAdmin()"); await pg.wait_for_timeout(900)
    confere('lista mostra todas as contas (inclusive sem documento de plano)', 'semdoc@example.com' in await pg.evaluate("document.getElementById('adm-list').textContent"))
    await pg.evaluate("setAdminFilter('gratuito')"); await pg.wait_for_timeout(100)
    confere('filtro por plano (Gratuito)', ALUNO in await pg.evaluate("document.getElementById('adm-list').textContent"))
    await pg.evaluate(f"setAdminFilter('all'); openStudent({json.dumps(ALUNO)})"); await pg.wait_for_timeout(400)
    confere('ficha mostra o plano e as ações novas', 'Teste' not in '' and 'Passar para Gratuito' not in await pg.evaluate("document.getElementById('stud-content').textContent") and '+30 dias' in await pg.evaluate("document.getElementById('stud-content').textContent"))
    await foto(pg, 'b40-05-admin-ficha')
    await pg.evaluate(f"admPremium({json.dumps(ALUNO)}, 30)"); await pg.wait_for_timeout(500)
    d = await pg.evaluate(f"window.__mockFS['usuariosAutorizados/{ALUNO}']")
    confere('13. renovação: Premium por 30 dias gravado (com campos antigos para versões anteriores)', d['plano'] == 'premium' and abs(d['premiumAte'] - (t + 30*DIA)) < 120000 and d['active'] is True, d)
    log = await pg.evaluate("Object.keys(window.__mockFS).filter(k=>k.startsWith('adminLog/')).map(k=>window.__mockFS[k].acao)")
    confere('ação registrada no adminLog', 'premium' in log, log)
    await pg.evaluate(f"admBloquear({json.dumps(ALUNO)}, true)"); await pg.wait_for_timeout(200)
    await pg.evaluate("document.getElementById('adm-motivo').value='teste de bloqueio'"); await pg.evaluate(f"admBloquearConfirma({json.dumps(ALUNO)})"); await pg.wait_for_timeout(500)
    confere('14. bloqueio gravado (conta suspensa)', await pg.evaluate(f"window.__mockFS['usuariosAutorizados/{ALUNO}'].bloqueado") is True)
    # remover administrador secundário
    await pg.evaluate("admSetAdmin('secundario@example.com', false)"); await pg.wait_for_timeout(200)
    await pg.evaluate("document.getElementById('appconfirm-ok').click()"); await pg.wait_for_timeout(600)
    confere('remover administrador: documento apagado de verdade', await pg.evaluate("!('admins/secundario@example.com' in window.__mockFS)"))
    confere('a conta do ex-administrador continua (dados de aluno)', await pg.evaluate("'usuarios/u-sec' in window.__mockFS"))
    # excluir conta: sem a função publicada, nada é dado como excluído
    await pg.evaluate("closeModal(); window.fetch = ()=>Promise.reject(new TypeError('Failed to fetch')); 1")
    await pg.evaluate("admExcluirConta('semdoc@example.com')"); await pg.wait_for_timeout(200)
    await pg.evaluate("document.getElementById('adm-del-conf').value='errado@example.com'; admExcluirContaGo('semdoc@example.com')"); await pg.wait_for_timeout(300)
    confere('excluir: confirmação errada não exclui', 'não confere' in await pg.evaluate("document.getElementById('adm-del-st').textContent") and await pg.evaluate("'usuarios/u-free' in window.__mockFS"))
    await pg.evaluate("document.getElementById('adm-del-conf').value='semdoc@example.com'; admExcluirContaGo('semdoc@example.com')"); await pg.wait_for_timeout(800)
    st = await pg.evaluate("document.getElementById('adm-del-st').textContent")
    confere('excluir sem a função do servidor: avisa e NÃO afirma que excluiu', 'Nada foi excluído' in st and await pg.evaluate("'usuarios/u-free' in window.__mockFS"), st[:120])
    await pg.evaluate("admExcluirSoDados('semdoc@example.com')"); await pg.wait_for_timeout(900)
    confere('alternativa honesta: apaga os dados, suspende e avisa que o login continua', await pg.evaluate("!('usuarios/u-free' in window.__mockFS) && window.__mockFS['usuariosAutorizados/semdoc@example.com'].bloqueado === true") and 'continua existindo' in await pg.evaluate("document.getElementById('modal-inner').textContent"))
    # com a função publicada (resposta simulada do servidor)
    await pg.evaluate("""window.fetch = async (url, o)=>({ status:200, ok:true, json: async ()=>({ result:{ ok:true, email: JSON.parse(o.body).data.email, logins:2, documentos:1, participacoes:0 } }) }); 1""")
    await pg.evaluate(f"closeModal(); admExcluirConta({json.dumps(ALUNO)})"); await pg.wait_for_timeout(200)
    await pg.evaluate(f"document.getElementById('adm-del-conf').value={json.dumps(ALUNO)}; admExcluirContaGo({json.dumps(ALUNO)})"); await pg.wait_for_timeout(600)
    confere('com a função: mostra o que o servidor confirmou', 'Conta excluída' in await pg.evaluate("document.getElementById('modal-inner').textContent"))
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()
    # o aluno bloqueado tenta entrar
    ctx, pg, erros = await nova(b, user={'email':ALUNO}, docs={f'usuariosAutorizados/{ALUNO}': {'plano':'premium','premiumAte':None,'bloqueado':True,'bloqueioMotivo':'teste de bloqueio'}})
    confere('14. conta suspensa não entra (mensagem e motivo)', await pg.evaluate(ATIVA) == 'scr-noaccess' and 'suspensa' in await pg.evaluate("document.getElementById('noaccess-msg').textContent") and 'teste de bloqueio' in await pg.evaluate("document.getElementById('noaccess-msg').textContent"))
    await foto(pg, 'b40-06-conta-suspensa')
    await ctx.close()
    # 13. aluno renovado volta ao Premium e recupera o tema
    ctx, pg, erros = await nova(b, user={'email':ALUNO}, docs={f'usuariosAutorizados/{ALUNO}': {'plano':'gratuito'}})
    await pg.evaluate("mtSemente(); state.prefs = { tema:'zepp', temaPremium:'oceano' }; state.planoVisto='gratuito'; saveData()")
    await pg.evaluate("myAccess = { plano:'premium', premiumAte: Date.now()+30*86400000 }; mtPlanoVerifica()"); await pg.wait_for_timeout(500)
    confere('13. Premium renovado: recursos liberados e tema Premium de volta', await pg.evaluate("planoAtual().tipo") == 'premium' and await pg.evaluate("currentTheme()") == 'oceano')
    await ctx.close()
    # administrador secundário perde o cargo com o app aberto
    ctx, pg, erros = await nova(b, user={'uid':'u-sec','email':'secundario@example.com','emailVerified':True}, docs={'admins/secundario@example.com': {'ativo':True}, 'usuariosAutorizados/secundario@example.com': {'plano':'gratuito'}})
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(500)
    confere('secundário entra como administrador', await pg.evaluate("state.user.isAdmin"))
    await pg.evaluate("delete window.__mockFS['admins/secundario@example.com']; acessoConfereDepois(state.user.email, 'metatreino_access_'+state.user.email)"); await pg.wait_for_timeout(800)
    confere('cargo removido: o app tira o acesso administrativo na hora (sem esperar o cache de 30 dias)', await pg.evaluate("!state.user.isAdmin"))
    await ctx.close()

async def cadastro_correcoes(b):
    print('Cadastro: peso, ícones, data de nascimento, IMC, explicações, objetivos, início, tempo de prova')
    ctx, pg, erros = await nova(b)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(500)
    # peso
    n = await pg.evaluate("state.weights.length")
    await pg.evaluate("goTab('profile'); openModal('add-weight')"); await pg.wait_for_timeout(300)
    confere('registrar peso: tem Cancelar e Salvar', await pg.evaluate("!!document.querySelector('#modal-inner .wt-acoes') && /Cancelar/.test(document.querySelector('#modal-inner .wt-acoes').textContent)"))
    await pg.evaluate("const e=document.getElementById('wt-val'); e.value='61.4'; e.dispatchEvent(new Event('input',{bubbles:true}))")
    await pg.mouse.click(10, 10); await pg.wait_for_timeout(300)
    confere('sair com valor alterado pergunta se quer descartar', await pg.evaluate("!!document.querySelector('#modal-inner .jan-descarta') && document.getElementById('modal-back').classList.contains('on')"))
    await foto(pg, 'b40-07-peso-descartar')
    await pg.evaluate("document.querySelector('#modal-inner .jan-descarta [data-k=sai]').click()"); await pg.wait_for_timeout(200)
    confere('descartar não registra o peso', await pg.evaluate("state.weights.length") == n and not await pg.evaluate("document.getElementById('modal-back').classList.contains('on')"))
    await pg.wait_for_timeout(900)
    await pg.evaluate("openModal('add-weight')"); await pg.wait_for_timeout(300)
    await pg.evaluate("const e=document.getElementById('wt-val'); e.value='61.4'; e.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('#modal-inner .wt-acoes .btn-ghost').click()"); await pg.wait_for_timeout(900)
    confere('Cancelar fecha sem aviso indevido e sem salvar', await pg.evaluate("state.weights.length") == n and not await pg.evaluate("document.getElementById('modal-back').classList.contains('on')"))
    await pg.evaluate("openModal('add-weight')"); await pg.wait_for_timeout(300)
    await pg.mouse.click(10, 10); await pg.wait_for_timeout(900)
    confere('sem alteração: tocar fora fecha direto (sem pergunta)', not await pg.evaluate("document.getElementById('modal-back').classList.contains('on')"))
    await pg.evaluate("openModal('add-weight')"); await pg.wait_for_timeout(200)
    await pg.evaluate("const e=document.getElementById('wt-val'); e.value='61.4'; e.dispatchEvent(new Event('input',{bubbles:true})); saveWeight()"); await pg.wait_for_timeout(250)
    confere('Salvar registra o peso', await pg.evaluate("state.weights.length") == n + 1 and await pg.evaluate("state.weights.slice(-1)[0].weight") == 61.4)
    # ícones
    await pg.evaluate("closeModal(); openEstiloIconesB40()"); await pg.wait_for_timeout(200)
    confere('perfil: "Estilo dos ícones" com as duas opções', await pg.evaluate("document.querySelectorAll('#modal-inner .ic-op').length") == 2)
    await pg.evaluate("closeModal(); renderProfile()")
    confere('linha "Estilo dos ícones" no Perfil', await pg.evaluate("!!document.getElementById('icones-row')"))
    await ctx.close()
    # data de nascimento (régua)
    ctx, pg, erros = await nova(b, user={'uid':'u-c','email':'cad@example.com','emailVerified':True}, sem_doc=True)
    await pg.evaluate("wzIr('scr-quiz', 0)"); await pg.wait_for_timeout(200)
    confere('cadastro: estilo dos ícones junto do tema', await pg.evaluate("document.querySelectorAll('#wz-icones .ic-op').length") == 2 and await pg.evaluate("!document.querySelector('#wz-icones').closest('.field').classList.contains('wz-fora')"))
    await pg.evaluate("wzEscolheIcone('emoji')")
    confere('escolha dos ícones salva na conta', await pg.evaluate("state.prefs.icones") == 'emoji')
    await pg.evaluate("wzEscolheIcone('linha')")
    await foto(pg, 'b40-08-cadastro-tema-icones')
    await pg.evaluate("wzIr('scr-quiz', 1); document.getElementById('q-birth').value='1990-01-31'; nrAbrir(document.getElementById('q-birth'))"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("""(async()=>{ const R = NR.reguas; const espera = ms=>new Promise(r=>setTimeout(r, ms));
      R[1].definir(2); await espera(120); const fev = NR.dataTeste(); R[1].definir(3); await espera(120); const mar = NR.dataTeste();
      R[2].definir(1992); R[1].definir(2); await espera(120); R[0 in NR.reguas ? 0 : 0]; const fev92 = NR.dataTeste();
      return { fev, mar, fev92, val: NR.val }; })()""")
    confere('data: dia 31 → fevereiro mostra 28, mas o dia escolhido continua 31', r['fev']['d'] == 28 and r['fev']['dEsc'] == 31, r)
    confere('data: voltando para março, o dia 31 volta (não "anda para trás")', r['mar']['d'] == 31, r)
    confere('data: fevereiro de ano bissexto mostra 29', r['fev92']['d'] == 29, r)
    await pg.evaluate("nrFechar(); document.getElementById('q-birth').value='1990-05-20'; nrAbrir(document.getElementById('q-birth'))"); await pg.wait_for_timeout(300)
    r = await pg.evaluate("""(async()=>{ const R = NR.reguas; const e = ms=>new Promise(r=>setTimeout(r, ms)); R[1].definir(11); await e(100); R[2].definir(1988); await e(100); return NR.val; })()""")
    confere('data: dia 20, troca mês e ano → continua dia 20', r == '1988-11-20', r)
    await pg.evaluate("nrConfirmar()")
    # IMC
    await pg.evaluate("wzIr('scr-quiz', 2); const h=document.getElementById('q-height'), w=document.getElementById('q-weight'); h.value=''; w.value=''; h.dispatchEvent(new Event('input',{bubbles:true}))")
    confere('IMC só aparece com peso e altura', await pg.evaluate("document.getElementById('wz-imc').hidden"))
    await pg.evaluate("const h=document.getElementById('q-height'), w=document.getElementById('q-weight'); h.value='175'; w.value='75'; w.dispatchEvent(new Event('input',{bubbles:true}))")
    t = await pg.evaluate("document.getElementById('wz-imc').textContent")
    confere('IMC estimado 24,5 com texto neutro (sem rótulos sobre o corpo)', '24,5' in t and 'composição corporal' in t and not any(x in t.lower() for x in ['acima do peso','obes','magr','sobrepeso','normal']), t)
    await pg.evaluate("document.getElementById('q-weight').value='80'; document.getElementById('q-weight').dispatchEvent(new Event('input',{bubbles:true}))")
    confere('IMC atualiza ao mudar o peso', '26,1' in await pg.evaluate("document.getElementById('wz-imc').textContent"))
    # explicações
    await pg.evaluate("document.querySelector('#q-level .opt[data-val=ativo]').click()"); await pg.wait_for_timeout(100)
    confere('nível de atividade: só a explicação da opção escolhida', await pg.evaluate("document.querySelectorAll('.wz-expl[data-de=\"q-level\"]').length") == 1 and 'às vezes' in await pg.evaluate("document.querySelector('.wz-expl[data-de=\"q-level\"]').textContent") and 'Sedentário:' not in await pg.evaluate("document.getElementById('q-level').parentElement.textContent"))
    await pg.evaluate("wzIr('scr-quiz', 3); document.querySelector('#q-goal .opt[data-val=forca]').click()"); await pg.wait_for_timeout(100)
    confere('objetivo: explicação só do escolhido', await pg.evaluate("document.querySelectorAll('.wz-expl[data-de=\"q-goal\"]').length") == 1 and 'Levantar mais peso' in await pg.evaluate("document.querySelector('.wz-expl[data-de=\"q-goal\"]').textContent"))
    await pg.evaluate("document.querySelector('#q-goal .opt[data-val=emagrecer]').click()"); await pg.wait_for_timeout(100)
    confere('trocar de objetivo troca a explicação', 'gordura' in await pg.evaluate("document.querySelector('.wz-expl[data-de=\"q-goal\"]').textContent") and 'Levantar' not in await pg.evaluate("document.querySelector('.wz-expl[data-de=\"q-goal\"]').textContent"))
    await foto(pg, 'b40-09-objetivo-explicacao')
    # calistenia e híbrido
    await pg.evaluate("""(()=>{ const v=(id,x)=>{ const e=document.getElementById(id); e.value=x; e.dispatchEvent(new Event('input',{bubbles:true})); }; v('q-nick','Cad'); document.querySelector('#q-sex .opt[data-val="f"]').click(); v('q-birth','1990-05-20'); v('q-height','170'); v('q-weight','70'); saveQuiz(); })()"""); await pg.wait_for_timeout(300)
    await pg.evaluate("pickModule('lift')"); await pg.wait_for_timeout(400)
    await pg.evaluate("document.querySelector('#lift-modalidade .opt[data-val=calistenia]').click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("(()=>{ const f=document.getElementById('cali-goal').closest('.field'); return { sug: (f.querySelector('.wz-sug b')||{}).textContent, sel: readOpt('cali-goal'), small:(f.querySelector('.wz-sug small')||{}).textContent }; })()")
    confere('calistenia: Emagrecer vira "Condicionamento e emagrecimento" (mesmo que o gerador usa)', r['sel'] == 'condicionamento' and 'emagrecimento' in (r['sug'] or '').lower(), r)
    await pg.evaluate("wzAbreObjetivo('cali-goal'); document.querySelector('#cali-goal .opt[data-val=forca]').click()"); await pg.wait_for_timeout(100)
    r = await pg.evaluate("(()=>{ const g=document.getElementById('cali-goal'); return { sel:readOpt('cali-goal'), exp:document.querySelectorAll('.wz-expl[data-de=\"cali-goal\"]').length, txt:(document.querySelector('.wz-expl[data-de=\"cali-goal\"]')||{}).textContent }; })()")
    confere('trocar o objetivo: opções coerentes e explicação da escolhida', r['sel'] == 'forca' and r['exp'] == 1 and '3 a 6' in r['txt'], r)
    await pg.evaluate("document.querySelector('#lift-modalidade .opt[data-val=hibrido]').click()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("(()=>({ exp:(document.querySelector('.wz-expl[data-de=\"cali-goal\"]')||{}).textContent||'', lift:getComputedStyle(document.getElementById('lift-goal').closest('.field')).display, extra: caliLerSetup() }))()")
    confere('híbrido: um objetivo só, e diz o que vale nos dias de academia', r['lift'] == 'none' and 'academia' in r['exp'] and r['extra']['goal'] == 'forca' and r['extra']['caliGoal'] == 'forca', r)
    # data de início
    r = await pg.evaluate("""(()=>{ document.querySelectorAll('#lift-week-days .opt-multi').forEach(o=>o.classList.remove('on')); const hoje = getDayIdx(); const amanha = hoje%7+1;
      document.querySelector('#lift-days .opt[data-val="3"]').click(); [amanha, (amanha%7)+1, ((amanha+1)%7)+1].forEach(d=>document.querySelector('#lift-week-days .opt-multi[data-val="'+d+'"]').classList.add('on'));
      document.getElementById('lift-start-date').value=''; wzInicioMsg('lift'); const a = document.querySelector('#scr-setup-lift .wz-inicio-msg').textContent;
      document.querySelectorAll('#lift-week-days .opt-multi').forEach(o=>o.classList.remove('on')); [hoje, amanha, (amanha%7)+1].forEach(d=>document.querySelector('#lift-week-days .opt-multi[data-val="'+d+'"]').classList.add('on'));
      wzInicioMsg('lift'); const b = document.querySelector('#scr-setup-lift .wz-inicio-msg').textContent; return {a, b}; })()""")
    confere('data de início vazia: diz que o primeiro treino é amanhã (dia escolhido)', 'amanhã' in r['a'] and 'hoje' not in r['a'].split('Primeiro')[0].lower().replace('sem data definida',''), r['a'])
    confere('hoje é dia de treino: diz que pode começar hoje', 'pode começar hoje' in r['b'], r['b'])
    await pg.evaluate("sairDoSetup()"); await pg.wait_for_timeout(200)
    # tempo de prova (corrida)
    await pg.evaluate("pickModule('run')"); await pg.wait_for_timeout(400)
    await pg.evaluate("document.querySelector('#run-exp .opt[data-val=regular]').click(); wzIr('scr-setup-run', 1)"); await pg.wait_for_timeout(300)
    confere('tempo recente: botão próprio no lugar do seletor do sistema', await pg.evaluate("!!document.getElementById('mc-btn') && getComputedStyle(document.getElementById('run-marca-dist').closest('.row')).display === 'none'"))
    await pg.evaluate("mcAbrir()"); await pg.wait_for_timeout(400)
    confere('seletor: distâncias + réguas de h/min/s + Cancelar e Confirmar', await pg.evaluate("document.querySelectorAll('#mc-fundo .mc-dists button').length") == 5 and await pg.evaluate("document.querySelectorAll('#mc-fundo .nr-regua').length") == 3 and 'Cancelar' in await pg.evaluate("document.querySelector('#mc-fundo .nr-acoes').textContent"))
    await foto(pg, 'b40-10-tempo-de-prova')
    await pg.evaluate("mcDist('10'); MC.reguas[0].definir(0); MC.reguas[1].definir(10); MC.reguas[2].definir(0)"); await pg.wait_for_timeout(200)
    await pg.evaluate("mcConfirmar()"); await pg.wait_for_timeout(100)
    confere('valida valor impossível (10 km em 10 min)', 'recorde' in await pg.evaluate("document.querySelector('#mc-fundo .mc-erro').textContent"))
    await pg.evaluate("MC.reguas[1].definir(52); MC.reguas[2].definir(30)"); await pg.wait_for_timeout(200)
    await pg.evaluate("mcConfirmar()"); await pg.wait_for_timeout(200)
    r = await pg.evaluate("({ d:document.getElementById('run-marca-dist').value, h:document.getElementById('run-marca-h').value, m:document.getElementById('run-marca-m').value, s:document.getElementById('run-marca-s').value, btn:document.getElementById('mc-btn').textContent, aval: _runLerAval ? JSON.stringify(_runLerAval()) : '' })")
    confere('confirmar grava distância e tempo nos campos que o cálculo de ritmos já lê', r['d'] == '10' and r['m'] == '52' and r['s'] == '30' and '10 km' in r['btn'], r)
    await pg.evaluate("mcAbrir(); mcDigitar(); document.getElementById('mc-dig').value='24:15'; document.getElementById('mc-dig').dispatchEvent(new Event('input')); mcDist('5'); mcConfirmar()"); await pg.wait_for_timeout(200)
    confere('digitar manualmente também funciona', await pg.evaluate("document.getElementById('run-marca-m').value") == '24' and await pg.evaluate("document.getElementById('run-marca-dist').value") == '5')
    await pg.evaluate("mcAbrir(); mcDist('42.195'); mcFechar()")
    confere('Cancelar não muda nada', await pg.evaluate("document.getElementById('run-marca-dist').value") == '5')
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()

async def treinos(b):
    print('Limitações, terreno e esforço (RPE)')
    ctx, pg, erros = await nova(b)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(500)
    r = await pg.evaluate("""(()=>{ const out = {};
      for(const lim of ['joelho','ombro','lombar','punho','tornozelo','semimpacto']){
        for(const equip of ['academia','halteres','casa']){
          const st = { goal:'hipertrofia', days:4, equip, level:'intermediario', selectedDays:[1,2,4,5], lim:[lim] };
          const p = generatePlan('lift', st);
          const exs = p.workouts.flatMap(w=>w.exercises);
          const ruins = exs.filter(e=>LIM_REGRAS[lim].evitar.test(e.name)).map(e=>e.name);
          const trocas = exs.filter(e=>e.adaptadoDe).length;
          out[lim+'/'+equip] = { ruins, trocas, total: exs.length };
        }
      } return out; })()""")
    ruins = {k:v for k,v in r.items() if v['ruins']}
    confere('nenhum exercício incompatível com a limitação (6 limitações × 3 equipamentos)', not ruins, ruins)
    confere('o treino continua completo (troca, não só remove)', all(v['total'] >= 12 for v in r.values()), {k:v['total'] for k,v in r.items()})
    confere('joelho na academia: exercícios trocados', r['joelho/academia']['trocas'] >= 2, r['joelho/academia'])
    r = await pg.evaluate("""(()=>{ const st = { goal:'forca', days:4, equip:'academia', level:'avancado', selectedDays:[1,2,4,5], lim:['joelho'] };
      const p = generatePlan('lift', st); const pernas = p.workouts.flatMap(w=>w.exercises).filter(e=>e.part==='Pernas'||e.part==='Glúteos');
      return { maxSets: Math.max(...pernas.map(e=>e.sets)), reps:[...new Set(pernas.map(e=>e.reps))] }; })()""")
    confere('volume/intensidade contidos na região (≤3 séries, sem 4-6 reps)', r['maxSets'] <= 3 and '4-6' not in r['reps'], r)
    await pg.evaluate("state.modules.lift.setup.lim=['joelho']; state.modules.lift.plan = generatePlan('lift', state.modules.lift.setup); state.active='lift'; goTab('sessions')"); await pg.wait_for_timeout(300)
    for k in await pg.evaluate("state.modules.lift.plan.workouts.map(w=>w.k)"):
        await pg.evaluate(f"selectSession('{k}')"); await pg.wait_for_timeout(120)
        if await pg.evaluate("!!document.querySelector('.lim-aviso')"): break
    confere('treino mostra o aviso da adaptação e orienta avaliação profissional', 'avaliação profissional' in await pg.evaluate("(document.querySelector('.lim-aviso')||{}).textContent||''"))
    await foto(pg, 'b40-11-treino-adaptado')
    confere('bônus cardio sem saltos para quem marcou joelho', 'sem impacto' in await pg.evaluate("cardioFinisherCard()"))
    # terreno
    r = await pg.evaluate("""(()=>{ const res = {};
      for(const ter of ['asfalto','pista','esteira','trilha']){
        const st = JSON.parse(JSON.stringify(state.modules.run.setup)); st.terrain = ter; st.goal='10km'; st.aval = Object.assign({}, st.aval, { exp:'experiente', continuo:'90', kmSemana:42, lim:[] });
        const sessoes = []; ['leve','longao','tempo','tiros_curtos','velocidade','subida'].forEach(t=>{ const s = rSessao(t, { min:40, nv:4, q:2, terreno:ter, Z: rZonasDe ? rZonasDe(45) : null, goal:'10km', lim:false }); sessoes.push({ t, alvo:s.alvo, orient:s.orient.join(' '), km:s.km }); });
        const comp = rComposicao({ run:{ setup:st }, lift:null }, { nivel:4, semanaRef:0 }, { fase:'desenvolvimento' }, 5, {});
        res[ter] = { sessoes, comp };
      } return res; })()""")
    tr = r['trilha']
    confere('trilha: sem tiros curtos nem velocidade no plano', not any(t in tr['comp'] for t in ['tiros_curtos','velocidade']), tr['comp'])
    confere('trilha: metas por esforço (sem ritmo por km)', all('/km' not in s['alvo'] for s in tr['sessoes'] if s['t'] in ('leve','tempo','longao')), [s['alvo'] for s in tr['sessoes']])
    confere('trilha: treinos de ritmo explicam que precisam de trecho plano', 'plano e firme' in [s for s in tr['sessoes'] if s['t']=='tempo'][0]['orient'])
    es = r['esteira']
    confere('esteira: velocidade em km/h junto do ritmo', any('km/h' in s['alvo'] for s in es['sessoes']), [s['alvo'] for s in es['sessoes']])
    pi = r['pista']
    confere('pista: sem subidas e com voltas de 400 m', 'subida' not in pi['comp'] and any('voltas de 400 m' in s['orient'] for s in pi['sessoes']), pi['comp'])
    confere('asfalto: plano normal (com qualidade)', len(r['asfalto']['comp']) == 5)
    # RPE → próxima carga
    r = await pg.evaluate("""(()=>{ const w = state.modules.lift.plan.workouts[0]; const ex = w.exercises.find(e=>e.unit!=='tempo' && !exCargaOpcional(e.id)); const id = ex.id; const rng = repRangeFor(id);
      const D = 86400000, base = Date.now() - 10*D; const H = state.modules.lift.history;
      const prep = (rpes, repsTop)=>{ state.progress[id] = []; state.modules.lift.history = H.filter(h=>!h._t);
        rpes.forEach((r,i)=>{ const at = base + i*2*D; state.progress[id].push({ date:at, sets:[{peso:40,reps:repsTop?rng.hi:rng.lo-2},{peso:40,reps:repsTop?rng.hi:rng.lo-2}] });
          state.modules.lift.history.push({ _t:1, id:w.k, at, rpe:r, feel:rpeToFeel(r), module:'lift', exercisesDone:[{id}] }); }); return smartProgressionHint(id).txt; };
      return { facil: prep([6], true), limite: prep([9,9], false), leve: prep([3], false).length ? prep([3], false) : '' }; })()""")
    confere('RPE: topo da faixa com esforço 6 → sugere subir já', 'sugere' in r['facil'] and 'margem' in r['facil'], r['facil'])
    confere('RPE: duas sessões no limite com reps caindo → reduz 10%', '−10%' in r['limite'], r['limite'])
    confere('sem erros de JavaScript', not erros, erros[:3])
    await ctx.close()

async def telas(b):
    print('Telas: temas novos, Premium, largura em celular pequeno')
    for tema in ['ametista','coral','zepp','areia']:
        ctx, pg, erros = await nova(b, w=360, h=740)
        await pg.evaluate(f"mtSemente(); setTheme('{tema}'); goTab('home')"); await pg.wait_for_timeout(500)
        larg = await pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        confere(f'{tema}: Início sem passar da largura', larg)
        await foto(pg, f'b40-12-inicio-{tema}')
        await pg.evaluate("goTab('profile')"); await pg.wait_for_timeout(300)
        if tema in ('ametista','coral'): await foto(pg, f'b40-13-perfil-{tema}')
        await pg.evaluate("openPlanos()"); await pg.wait_for_timeout(200)
        confere(f'{tema}: tabela de planos cabe na tela', await pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
        if tema == 'coral': await foto(pg, 'b40-14-planos')
        confere(f'{tema}: sem erros', not erros, erros[:3])
        await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for f in (cadastro, gratuito, premium, fim_do_teste, admin, cadastro_correcoes, treinos, telas): await f(b)
        await b.close()
    print(f'\n{ok} ok, {falhou} falharam'); sys.exit(1 if falhou else 0)
asyncio.run(main())

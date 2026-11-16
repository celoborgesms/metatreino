#!/usr/bin/env python3
"""Beta 42 — confirmação de e-mail, Google × e-mail e senha, teste Premium, exclusão pelo painel, backup
protegido, carrossel de temas, ilustrações e tela de montagem. Firebase simulado (testes/mock-firebase.js).
Uso: python3 testes/beta42-conta.py http://localhost:8765/index.html [pasta-de-saida]"""
import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
DIA = 86400000
ok = falhou = 0
def confere(nome, cond, info=''):
    global ok, falhou
    if cond: ok += 1; print('  ✅', nome)
    else: falhou += 1; print('  ❌', nome, str(info)[:300])
async def foto(pg, nome):
    if SAIDA: await pg.screenshot(path=os.path.join(SAIDA, nome + '.png'))
async def nova(b, user=None, docs=None, sem_doc=False, extra='', w=390, h=844, espera=2200):
    ctx = await b.new_context(viewport={'width':w,'height':h}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Sao_Paulo', accept_downloads=True)
    await ctx.add_init_script(f"window.__MOCK_USER = {json.dumps(user or {})}; window.__MOCK_DOCS = {json.dumps(docs or {})}; window.__MOCK_SEM_DOC = {'true' if sem_doc else 'false'}; {extra}")
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(espera)
    return ctx, pg, erros
TELA = "(document.querySelector('.screen.active')||{}).id"

async def verificacao(b):
    print('1. Confirmação de e-mail sem novo login')
    U = {'uid':'u-novo','email':'novo.aluno@example.com','displayName':'Novo','emailVerified':False}
    ctx, pg, erros = await nova(b, user=U, sem_doc=True)
    confere('conta nova sem confirmar: tela "Confirme seu e-mail"', await pg.evaluate(TELA) == 'scr-noaccess' and 'Confirme' in await pg.evaluate("document.body.innerText"))
    await pg.evaluate("window.__marcaPagina = 'mesma'")
    await pg.click('#noaccess-retry'); await pg.wait_for_timeout(700)
    confere('"Já confirmei" antes de confirmar: mensagem clara, continua na tela', await pg.evaluate(TELA) == 'scr-noaccess' and 'Ainda não recebemos' in await pg.evaluate("document.getElementById('noaccess-st').textContent"))
    await pg.evaluate("window.__MOCK_SERVIDOR_VERIFICOU = true")
    await pg.click('#noaccess-retry'); await pg.click('#noaccess-retry', no_wait_after=True, timeout=500) if False else None
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate("({ tela: (document.querySelector('.screen.active')||{}).id, mesma: window.__marcaPagina, reloads: window.__mockReloads, token: window.__mockTokenNovo, verif: fbUser.emailVerified })")
    confere('depois de confirmar: entra sem novo login e sem recarregar a página', r['mesma'] == 'mesma' and r['tela'] in ('scr-quiz','scr-pick','scr-home') and r['verif'], r)
    confere('Firebase atualizado: reload() do usuário e token novo (regras passam a ver e-mail verificado)', r['reloads'] >= 2 and r['token'] >= 1, r)
    usuarios = await pg.evaluate("Object.keys(window.__mockFS).filter(k=>/^usuarios\\/[^/]+$/.test(k))")
    confere('nenhuma conta duplicada (no máximo 1 documento de dados)', len(usuarios) <= 1, usuarios)
    confere('teste Premium AINDA não começou (só ao concluir o perfil)', not await pg.evaluate("!!window.__mockFS['usuariosAutorizados/novo.aluno@example.com']"))
    confere('durante o cadastro, quem vai ganhar o teste já pode escolher os temas Premium', await pg.evaluate("mtTestePendente() && mtPremium() && temaLiberado('aurora')"))
    await pg.evaluate("state.user.profile = { nickname:'Novo', sex:'m', age:30, height:175, currentWeight:80, goal:'massa', level:'iniciante', quiz_done:true }; mtTesteIniciar('perfil')")
    await pg.wait_for_timeout(900)
    d = await pg.evaluate("window.__mockFS['usuariosAutorizados/novo.aluno@example.com']")
    confere('teste Premium começa ao concluir o perfil (plano teste, data de hoje)', d and d.get('plano') == 'teste' and abs(d.get('testeInicio') - time.time()*1000) < 120000, d)
    confere('plano em vigor: Teste Premium de 30 dias', await pg.evaluate("planoAtual().tipo === 'teste' && accessDaysLeft() >= 29"))
    t0 = d['testeInicio']
    await pg.evaluate("myAccess = null; mtTesteIniciar('perfil')"); await pg.wait_for_timeout(600)
    confere('"Começar do zero"/nova chamada não reinicia o teste', await pg.evaluate("window.__mockFS['usuariosAutorizados/novo.aluno@example.com'].testeInicio") == t0)
    confere('saveQuiz dispara o início do teste', await pg.evaluate("String(window.saveQuiz).length > 0 && !!_MT_GANCHOS.saveQuiz && _MT_GANCHOS.saveQuiz.depois.length > 0"))
    confere('sem erros de JavaScript', not erros, erros[:3]); await ctx.close()
    # token velho com objeto já atualizado (o caso do print "permission-denied")
    ctx, pg, erros = await nova(b, user={'uid':'u-tv','email':'tokenvelho@example.com','emailVerified':True}, extra="window.__MOCK_TOKEN_VERIFICADO = false;")
    confere('token antigo é renovado na entrada: não aparece "recusou a leitura"', await pg.evaluate(TELA) != 'scr-noaccess' and await pg.evaluate("window.__mockTokenNovo") >= 1, await pg.evaluate(TELA))
    await ctx.close()

async def fim_do_teste(b):
    print('2. Fim do teste → Básico, com os dados preservados')
    t = int(time.time()*1000)
    docs = {'usuariosAutorizados/fim.teste@example.com': {'plano':'teste','testeInicio': t - 31*DIA}}
    ctx, pg, erros = await nova(b, user={'uid':'u-fim','email':'fim.teste@example.com','emailVerified':True}, docs=docs)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500)
    n0 = await pg.evaluate("state.modules.lift.history.length")
    r = await pg.evaluate("({ tipo: planoAtual().tipo, rot: accessLabel(0), hist: state.modules.lift.history.length })")
    confere('teste vencido: conta no plano Básico automaticamente', r['tipo'] == 'gratuito' and 'Básico' in r['rot'], r)
    confere('treinos e histórico preservados', r['hist'] == n0 and n0 > 0)
    await pg.evaluate("closeModal(); openPlanos()"); await pg.wait_for_timeout(200)
    txt = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('tabela de planos: Básico × Premium (troca e histórico no Básico)', 'BÁSICO' in txt.upper() and 'Troca inteligente' in txt and 'Gratuito' not in txt, txt[:200])
    await ctx.close()

async def google_email(b):
    print('3. Google × e-mail e senha na mesma conta')
    U = {'uid':'u-mesmo','email':'conta.email@example.com','emailVerified':True,'providerData':[{'providerId':'password'}]}
    ctx, pg, erros = await nova(b, user=U, extra="window.__MOCK_LOGGED_OUT = true; window.__MOCK_GOOGLE_CONFLITO = true; window.__MOCK_SENHA = 'senha-certa';")
    await pg.evaluate("doGoogleSignIn()"); await pg.wait_for_timeout(500)
    confere('Google com e-mail que já tem senha: pede a senha da conta existente (não cria outra)', 'mesma conta' in await pg.evaluate("document.getElementById('modal-inner').innerText"))
    await pg.fill('#lk-pass', 'errada'); await pg.click('#lk-go'); await pg.wait_for_timeout(400)
    confere('senha errada: não vincula', 'incorreta' in await pg.evaluate("document.getElementById('lk-st').textContent") and not await pg.evaluate("(window.__mockLinks||[]).length"))
    await pg.fill('#lk-pass', 'senha-certa'); await pg.click('#lk-go'); await pg.wait_for_timeout(2500)
    r = await pg.evaluate("({ links: window.__mockLinks, prov: (fbAuth.currentUser||{}).providerData.map(p=>p.providerId), uid: fbAuth.currentUser && fbAuth.currentUser.uid, docs: Object.keys(window.__mockFS).filter(k=>/^usuarios\\/[^/]+$/.test(k)) })")
    confere('senha certa: Google vinculado ao MESMO UID (linkWithCredential)', r['links'] == ['google.com'] and 'google.com' in r['prov'] and r['uid'] == 'u-mesmo', r)
    confere('nenhum aluno duplicado', len(r['docs']) <= 1, r['docs'])
    await ctx.close()
    # conta criada pelo Google: entrar com e-mail e senha → mensagem; criar senha no perfil
    U = {'uid':'u-google','email':'conta.google@example.com','emailVerified':True,'providerData':[{'providerId':'google.com'}]}
    ctx, pg, erros = await nova(b, user=U)
    m = await pg.evaluate("authModo = 'entrar'; authMsgErro('auth/invalid-credential')")
    confere('conta do Google tentando senha: orienta a entrar pelo Google e criar senha no Perfil', 'Google' in m and 'Formas de entrar' in m)
    confere('"Criar conta" com e-mail que já existe: não cria outra e explica', 'Nenhuma conta nova' in await pg.evaluate("authMsgErro('auth/email-already-in-use')"))
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500); await pg.evaluate("closeModal(); goTab('profile')"); await pg.wait_for_timeout(300)
    confere('Perfil tem "Formas de entrar"', await pg.evaluate("!!document.getElementById('formas-row')"))
    await pg.evaluate("openFormasDeEntrar()"); await pg.wait_for_timeout(200)
    await foto(pg, 'b42-01-formas-de-entrar')
    await pg.evaluate("mtCriarSenha()"); await pg.fill('#cs-1', 'nova123'); await pg.fill('#cs-2', 'nova123'); await pg.click('#cs-go'); await pg.wait_for_timeout(500)
    confere('criar senha vincula e-mail/senha ao MESMO UID', await pg.evaluate("fbAuth.currentUser.uid === 'u-google' && fbAuth.currentUser.providerData.some(p=>p.providerId==='password')"))
    await ctx.close()
    U = {'uid':'u-sen','email':'so.senha@example.com','emailVerified':True,'providerData':[{'providerId':'password'}]}
    ctx, pg, erros = await nova(b, user=U, extra="window.__MOCK_GOOGLE_EMAIL = 'outra.pessoa@example.com';")
    await pg.evaluate("openFormasDeEntrar(); mtVincularGoogle()"); await pg.wait_for_timeout(500)
    confere('Google de OUTRO e-mail: vínculo desfeito e aviso (não junta por engano)', await pg.evaluate("!fbAuth.currentUser.providerData.some(p=>p.providerId==='google.com')") and 'outro e-mail' in await pg.evaluate("document.getElementById('fe-st').textContent"))
    confere('sem erros de JavaScript', not erros, erros[:3]); await ctx.close()

async def exclusao(b):
    print('4. Exclusão de aluno pelo painel')
    pg0 = await (await b.new_context()).new_page(); await pg0.goto(URL); await pg0.wait_for_timeout(800)
    dono = await pg0.evaluate("String(ADMIN_EMAIL).toLowerCase()"); t = int(time.time()*1000)
    AL = 'aluno.x@example.com'
    docs = { f'usuariosAutorizados/{AL}': {'plano':'teste','testeInicio': t - 2*DIA, 'name':'Aluno X'},
             'usuarios/u-x': {'email':AL, 'nome':'Aluno X', 'atualizadoEm': t, 'estadoApp': {'user':{'profile':{'nickname':'Aluno X'}}, 'modules':{'lift':None,'run':None}}},
             'usuarios/u-x/arquivo/2026-2': {'x':1},
             'usuarios/u-outra': {'email':'outra@example.com', 'nome':'Outra', 'atualizadoEm': t},
             f'contas/{AL}': {'uid':'u-x'},
             f'admins/{dono}': {'ativo': True} }
    ctx, pg, erros = await nova(b, user={'uid':'dono','email':dono,'displayName':'Dono','emailVerified':True}, docs=docs)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500); await pg.evaluate("closeModal(); saveData(); syncToCloud()"); await pg.wait_for_timeout(1200)
    meu0 = await pg.evaluate("JSON.stringify((window.__mockFS['usuarios/'+uidDados()]||{}).estadoApp && window.__mockFS['usuarios/'+uidDados()].estadoApp.modules.lift.history.length)")
    await pg.evaluate("goAdmin()"); await pg.wait_for_timeout(900)
    await pg.evaluate(f"openStudent('{AL}')"); await pg.wait_for_timeout(300)
    # armadilha: um documento de outra pessoa entra por engano na lista de documentos do aluno
    await pg.evaluate(f"usuariosCache['{AL}']._uids = ['u-x','u-outra', uidDados()]")
    await pg.evaluate(f"admExcluirConta('{AL}')"); await pg.wait_for_timeout(200)
    t2 = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('confirmação simples: nome, e-mail, aviso permanente, Cancelar e "Excluir aluno" (sem digitar o e-mail)', 'Aluno X' in t2 and AL in t2 and 'permanente' in t2 and 'Cancelar' in t2 and 'Excluir aluno' in t2 and not await pg.evaluate("!!document.querySelector('#modal-inner input')"), t2[:200])
    await foto(pg, 'b42-02-excluir-aluno')
    await pg.evaluate("window.__fnChamadas = 0; window.fnChamar = (n,d)=>{ window.__fnChamadas++; return new Promise((_,r)=>setTimeout(()=>r({code:'sem-funcao'}), 300)); }; 0")
    await pg.evaluate("for(let i=0;i<4;i++) document.getElementById('adm-del-go').click(); closeModal();")   # cliques repetidos + toque fora
    await pg.wait_for_timeout(200)
    confere('durante a exclusão: botão bloqueado e janela não fecha', await pg.evaluate("document.getElementById('modal-back').classList.contains('on') && (document.getElementById('adm-del-go')||{disabled:true}).disabled"))
    await pg.wait_for_timeout(2500)
    r = await pg.evaluate(f"""({{ chamadas: window.__fnChamadas, marcas: Object.keys(window.__mockFS).filter(k=>k==='contasExcluidas/{AL}').length,
        logs: Object.keys(window.__mockFS).filter(k=>k.startsWith('adminLog/') && /excluir/.test(window.__mockFS[k].acao)).length,
        aluno: 'usuarios/u-x' in window.__mockFS, arq: 'usuarios/u-x/arquivo/2026-2' in window.__mockFS, outra: 'usuarios/u-outra' in window.__mockFS,
        meu: !!window.__mockFS['usuarios/'+uidDados()], bloq: (window.__mockFS['usuariosAutorizados/{AL}']||{{}}).bloqueado,
        tela: (document.querySelector('.screen.active')||{{}}).id, admin: state.user && state.user.email, logado: !!fbUser,
        lista: document.getElementById('adm-list').textContent.includes('{AL}'), res: document.getElementById('modal-inner').innerText }})""")
    confere('exclusão executada UMA vez (1 chamada, 1 marca, 1 registro)', r['chamadas'] == 1 and r['marcas'] == 1 and r['logs'] == 1, r)
    confere('dados do aluno e arquivo anual apagados; marca de conta excluída e bloqueio gravados', not r['aluno'] and not r['arq'] and r['bloq'] is True, r)
    confere('documento de OUTRA conta e o do administrador não são apagados', r['outra'] and r['meu'], r)
    confere('painel continua aberto e administrador continua conectado', r['tela'] in ('scr-admin','scr-admin-student') and r['admin'] == dono and r['logado'], r)
    confere('resultado completo (documentos de outras contas preservados, não contam como falha)', 'parcial' not in r['res'] and 'preservados' in r['res'], r['res'][:200])
    await pg.evaluate("admVoltarLista()"); await pg.wait_for_timeout(300)
    confere('"Voltar ao painel" leva à lista, sem sair do painel', await pg.evaluate(TELA) == 'scr-admin')
    confere('aluno some da lista na hora e o resultado é honesto (login segue no Authentication)', not r['lista'] and 'Authentication' in r['res'], r['res'][:200])
    meu1 = await pg.evaluate("JSON.stringify((window.__mockFS['usuarios/'+uidDados()]||{}).estadoApp && window.__mockFS['usuarios/'+uidDados()].estadoApp.modules.lift.history.length)")
    confere('dados de treino do administrador intactos', meu0 == meu1 and meu0 not in ('null', 'undefined'), (meu0, meu1))
    # o app antigo do aluno recria o documento → não volta para a lista (nem depois de recarregar o painel)
    await pg.evaluate(f"window.__MOCK_ADMIN_GRAVA = true; window.__mockFS['usuarios/u-x'] = {{ email:'{AL}', nome:'Aluno X', atualizadoEm: Date.now() }}; closeModal(); goAdmin()")
    await pg.wait_for_timeout(900)
    confere('aluno excluído não reaparece ao recarregar o painel', AL not in await pg.evaluate("document.getElementById('adm-list').textContent"))
    await pg.evaluate("openContasExcluidas()"); await pg.wait_for_timeout(200)
    confere('lista de contas excluídas com opção de liberar o e-mail', AL in await pg.evaluate("document.getElementById('modal-inner').innerText"))
    await pg.evaluate("closeModal()")
    confere('principal não exclui a própria conta', await pg.evaluate("admExcluirConta(state.user.email); !/Excluir aluno/.test(document.getElementById('modal-inner').innerText) || !document.getElementById('modal-back').classList.contains('on')"))
    confere('sem erros de JavaScript', not erros, erros[:3]); await ctx.close()
    # administrador secundário: não exclui
    ctx, pg, erros = await nova(b, user={'uid':'u-sec','email':'secundario@example.com','emailVerified':True}, docs={'admins/secundario@example.com': {'ativo':True}, f'usuariosAutorizados/{AL}': {'plano':'gratuito'}})
    await pg.evaluate("closeModal()")
    await pg.evaluate(f"admExcluirConta('{AL}')"); await pg.wait_for_timeout(200)
    confere('administrador secundário não consegue excluir alunos', not await pg.evaluate("/Excluir aluno/.test(document.getElementById('modal-inner').innerText) && document.getElementById('modal-back').classList.contains('on')"))
    await ctx.close()
    # app do aluno excluído (ainda logado) não recria os dados
    ctx, pg, erros = await nova(b, user={'uid':'u-x','email':AL,'emailVerified':True}, docs={f'contasExcluidas/{AL}': {'em':t}, f'usuariosAutorizados/{AL}': {'plano':'gratuito','bloqueado':True,'contaExcluidaEm':t}})
    await pg.evaluate("try{ state.user = state.user || {email:'x'}; saveData(); syncToCloud(); }catch(e){}"); await pg.wait_for_timeout(1500)
    confere('conta excluída: app antigo não recria o documento e mostra a conta encerrada', not await pg.evaluate("'usuarios/u-x' in window.__mockFS") and await pg.evaluate(TELA) == 'scr-noaccess')
    await ctx.close()

async def backup(b):
    print('5. Backup ligado à conta')
    A = {'uid':'u-a','email':'aluno.a@example.com','emailVerified':True}
    ctx, pg, erros = await nova(b, user=A)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500); await pg.evaluate("closeModal()")
    async with pg.expect_download() as dl: await pg.evaluate("exportMyData()")
    caminho = await (await dl.value).path(); arq = json.load(open(caminho, encoding='utf-8'))
    confere('backup novo leva dono e resumo (SHA-256) e fica registrado na conta', arq.get('formato') == 2 and arq.get('dono') == 'u-a' and len(arq.get('hash','')) == 64 and await pg.evaluate(f"!!window.__mockFS['usuarios/u-a/backups/{arq['hash']}']"))
    docA = await pg.evaluate("Object.fromEntries(Object.entries(window.__mockFS).filter(([k])=>k.startsWith('usuarios/u-a/backups/')))")
    async def importa(page, dados, nome='b.json'):
        p = os.path.join('/tmp', nome); json.dump(dados, open(p, 'w', encoding='utf-8'))
        await page.evaluate("closeModal()")
        await page.set_input_files('#restore-input', p) if await page.evaluate("!!document.getElementById('restore-input')") else await page.evaluate("0")
        await page.wait_for_timeout(900)
        return await page.evaluate("document.getElementById('modal-back').classList.contains('on') ? document.getElementById('modal-inner').innerText : ''")
    await pg.evaluate("openDataManager ? 0 : 0") if False else None
    await pg.evaluate("document.body.insertAdjacentHTML('beforeend', '<input type=\"file\" id=\"restore-input\" style=\"display:none\" onchange=\"importMyData(event)\">')")
    t = await importa(pg, arq)
    confere('o próprio dono restaura normalmente (pede confirmação antes de substituir)', 'Restaurar backup' in t and 'SUBSTITUÍDOS' in t, t[:120])
    mexido = json.loads(json.dumps(arq)); mexido['dados']['estado']['trophies'] = ['x']
    t = await importa(pg, mexido, 'mexido.json')
    confere('arquivo alterado: recusado sem mexer nos dados', 'alterado' in t, t[:120])
    await ctx.close()
    B = {'uid':'u-b','email':'aluno.b@example.com','emailVerified':True}
    ctx, pg, erros = await nova(b, user=B)
    await pg.evaluate("document.body.insertAdjacentHTML('beforeend', '<input type=\"file\" id=\"restore-input\" style=\"display:none\" onchange=\"importMyData(event)\">')")
    hist0 = await pg.evaluate("JSON.stringify(state.trophies||[])")
    t = await importa(pg, arq)
    confere('outra conta: importação bloqueada ("criado em outra conta")', 'outra conta' in t and 'não foram alterados' in t, t[:160])
    falso = json.loads(json.dumps(arq)); falso['dono'] = 'u-b'
    t = await importa(pg, falso, 'dono.json')
    confere('trocar o "dono" dentro do JSON não adianta', 'outra conta' in t, t[:120])
    confere('dados da outra conta continuam como estavam', await pg.evaluate("JSON.stringify(state.trophies||[])") == hist0)
    antigo = {'app':'MetaTreino','versao':'x','estado': arq['dados']['estado']}
    t = await importa(pg, antigo, 'antigo.json')
    confere('backup antigo de outra conta: bloqueado', 'outra conta' in t, t[:120])
    antigo2 = json.loads(json.dumps(antigo)); antigo2['estado']['user']['email'] = 'aluno.b@example.com'
    t = await importa(pg, antigo2, 'antigo2.json')
    confere('backup antigo da própria conta: aceito (compatibilidade)', 'Restaurar backup' in t, t[:120])
    await pg.evaluate("window.__mockFS['liberacoesBackup/aluno.b@example.com'] = { ate: Date.now() + 3600000 }")
    t = await importa(pg, arq)
    confere('liberação do suporte (24 h): restauração permitida com aviso', 'Restaurar backup' in t and 'suporte' in t, t[:160])
    confere('sem erros de JavaScript', not erros, erros[:3]); await ctx.close()

async def temas(b):
    print('6. Temas: carrossel, Premium, persistência')
    for w, h in ((320, 640), (1024, 900)):
        ctx, pg, erros = await nova(b, w=w, h=h)
        await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500); await pg.evaluate("closeModal(); goTab('profile'); openAparencia()"); await pg.wait_for_timeout(400)
        r = await pg.evaluate("({ slides: document.querySelectorAll('#modal-inner .tc-slide').length, grades: document.querySelectorAll('#modal-inner .ap-grid').length, exclusivo: /Exclusivo/.test(document.body.innerText), larg: document.documentElement.scrollWidth })")
        confere(f'{w}px: Aparência mostra um carrossel com os 10 temas (sem lista de 10 de uma vez)', r['slides'] == 10 and r['grades'] == 0 and r['larg'] <= w + 2, r)
        if w == 320:
            confere('nenhum tema identificado como "Exclusivo"', not r['exclusivo'])
            k0 = await pg.evaluate("document.querySelector('#modal-inner .tc')._idx")
            await pg.evaluate("document.querySelectorAll('#modal-inner .tc-ponto')[document.querySelector('#modal-inner .tc')._idx + 1].click(); 0"); await pg.wait_for_timeout(900)
            confere('pontos navegam entre os temas (Beta 44: sem setas)', await pg.evaluate("document.querySelector('#modal-inner .tc')._idx") == k0 + 1 and await pg.evaluate("document.querySelectorAll('#modal-inner .tc-seta').length") == 0)
            await pg.evaluate("mtTcIr(document.querySelector('#modal-inner .tc'), _tcOrdem().indexOf('coral'))"); await pg.wait_for_timeout(500)
            info = await pg.evaluate("[document.querySelector('#modal-inner .tc-nome').innerText, !!document.querySelector('#modal-inner .tc-nome .tc-prem svg, #modal-inner .tc-nome .tc-prem')]")
            confere('Coral aparece com a estrela Premium (Beta 48: só a estrela)', 'Coral' in info[0] and info[1], info)
            # gesto lateral: rolar o trilho atualiza o tema em foco
            await pg.evaluate("const tr = document.querySelector('#modal-inner .tc-trilho'); tr.scrollTo({left:0}); tr.dispatchEvent(new Event('scroll'))"); await pg.wait_for_timeout(400)
            confere('deslizar para o lado troca o tema em foco', await pg.evaluate("document.querySelector('#modal-inner .tc')._idx") == 0)
            await pg.evaluate("mtTcIr(document.querySelector('#modal-inner .tc'), _tcOrdem().indexOf('aurora'))"); await pg.wait_for_timeout(1200)
            await foto(pg, 'b42-03-carrossel')
            confere('ao parar no tema ele é aplicado e a preferência salva (Beta 44: sem botão "Usar")', await pg.evaluate("currentTheme()==='aurora' && state.prefs.tema==='aurora'"))
            confere('prévia fiel: cada slide usa as cores do próprio tema', await pg.evaluate("getComputedStyle(document.querySelector('#modal-inner .tc-slide[data-k=\"claro\"] .tc-prev')).backgroundColor !== getComputedStyle(document.querySelector('#modal-inner .tc-slide[data-k=\"amoled\"] .tc-prev')).backgroundColor"))
        await ctx.close()
    # plano Básico: tema Premium travado, preferência mantida
    t = int(time.time()*1000)
    ctx, pg, erros = await nova(b, user={'uid':'u-basico','email':'basico@example.com','emailVerified':True}, docs={'usuariosAutorizados/basico@example.com': {'plano':'gratuito'}})
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500); await pg.evaluate("closeModal(); openAparencia(); mtTcIr(document.querySelector('#modal-inner .tc'), _tcOrdem().indexOf('rubi'))"); await pg.wait_for_timeout(1200)
    txb = await pg.evaluate("document.querySelector('#modal-inner .tc-nome').innerText")
    confere('Básico: tema Premium mostra "Disponível no Premium" e não é aplicado', 'Disponível no Premium' in txb and await pg.evaluate("document.querySelector('#modal-inner .tc-slide.foco').click(), currentTheme() !== 'rubi'"), txb)
    await ctx.close()
    # cadastro
    ctx, pg, erros = await nova(b, user={'uid':'u-cad','email':'cadastro@example.com','emailVerified':True}, sem_doc=True)
    await pg.wait_for_timeout(500)
    r = await pg.evaluate("({ tela:(document.querySelector('.screen.active')||{}).id, slides: document.querySelectorAll('#wz-temas .tc-slide').length })")
    confere('cadastro: escolha do visual em carrossel (10 temas)', r['slides'] == 10, r)
    await foto(pg, 'b42-04-cadastro-temas')
    confere('sem erros de JavaScript', not erros, erros[:3]); await ctx.close()

async def ilustracoes_montagem(b):
    print('7. Ilustrações e tela de montagem')
    ctx, pg, erros = await nova(b)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500); await pg.evaluate("closeModal()")
    r = await pg.evaluate("({ perfil: /M134 104c3-20/.test(DECO2_SVG.perfil), desafios: /M168 58.5l3.4 7/.test(DECO2_SVG.desafios), corrida: /translate\\(150 44\\)/.test(DECO2_SVG.corrida) && /a124 124/.test(DECO2_SVG.corrida), hist: /M134 38l4 4 7-8/.test(DECO2_SVG.historico) })")
    confere('Perfil (pessoa) e Desafios (medalha) voltaram aos desenhos anteriores', r['perfil'] and r['desafios'], r)
    confere('Corrida: pista com corredor · Histórico: registros e evolução', r['corrida'] and r['hist'], r)
    for tema in ('zepp', 'areia', 'aurora', 'claro'):
        await pg.evaluate(f"applyTheme('{tema}')")
        for aba in ('profile', 'history', 'challenges'):
            await pg.evaluate(f"goTab('{aba}')"); await pg.wait_for_timeout(250)
            if tema in ('zepp', 'claro'): await foto(pg, f'b42-05-{aba}-{tema}')
    await pg.evaluate("applyTheme('zepp')")
    # montagem: etapas legíveis, "Plano pronto" e só depois o plano
    t0 = await pg.evaluate("Date.now()")
    await pg.evaluate("window.__fim = 0; runBuildingScreen('lift', [{txt:'Objetivo'},{txt:'Equipamento'},{txt:'Dias'},{txt:'Limitações'},{txt:'Histórico'}], ()=>{ window.__fim = Date.now(); })")
    await pg.wait_for_timeout(2400)
    meio = await pg.evaluate("({ ok: document.querySelectorAll('#building-ov .mb-list li.ok').length, fim: window.__fim })")
    await foto(pg, 'b42-06-montagem')
    await pg.wait_for_function("window.__fim > 0", timeout=12000)
    dur = (await pg.evaluate("window.__fim")) - t0
    confere(f'cada etapa fica ~1 s na tela (2,4 s → {meio["ok"]} etapa(s) concluída(s)) e a tela não some antes do fim', 1 <= meio['ok'] <= 2 and meio['fim'] == 0, meio)
    confere(f'tempo total proporcional às etapas reais ({dur} ms), sem carregamento infinito', 5500 < dur < 9000, dur)
    # erro na geração: mensagem com "Tentar de novo"
    await pg.evaluate("window.__gp = generatePlan; window.__se = setupErroDias; setupErroDias = ()=>''; generatePlan = ()=>{ throw new Error('teste de falha'); }; 0")
    await pg.evaluate("try{ finishSetup('lift'); }catch(e){}"); await pg.wait_for_timeout(300)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('falha ao gerar o plano: mensagem clara e "Tentar de novo" (nada perdido)', 'Não consegui montar' in t and 'Tentar de novo' in t, t[:120])
    await pg.evaluate("generatePlan = window.__gp; setupErroDias = window.__se; closeModal()")
    confere('sem erros de JavaScript', not erros, erros[:3]); await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for f in (verificacao, fim_do_teste, google_email, exclusao, backup, temas, ilustracoes_montagem):
            try: await f(b)
            except Exception as e:
                global falhou; falhou += 1; print('  ❌ exceção em', f.__name__, str(e)[:500])
        await b.close()
    print(f'\nBeta 42 (conta): {ok} ok, {falhou} falha(s)')
    sys.exit(1 if falhou else 0)
asyncio.run(main())

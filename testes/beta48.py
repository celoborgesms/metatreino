#!/usr/bin/env python3
"""Beta 48 — cupons de Premium, selo Premium no plano Básico, conquistas do Início em dia,
ilustração do Início no horário certo e tempo da atividade avulsa com o seletor do app.
Uso: python3 testes/beta48.py http://localhost:8765/index.html [pasta-de-saida]"""
import asyncio, sys, os, json, re, time
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
async def pagina(ctx, user, docs=None, semente=True):
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    await pg.add_init_script(f"window.__MOCK_USER = {json.dumps(user)}; window.__MOCK_DOCS = {json.dumps(docs or {})}; window.__MOCK_SEM_DOC = false;")
    await pg.goto(URL); await pg.wait_for_timeout(2200)
    if semente:
        await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
        await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); 0")
    return pg, erros

async def basico(b):
    print('1. Plano Básico: selo Premium certo (sem "${PL_EST}")')
    ctx = await b.new_context(viewport={'width':390,'height':844})
    email = 'basico@example.com'
    pg, erros = await pagina(ctx, {'uid':'uBas','email':email,'emailVerified':True}, {f'usuariosAutorizados/{email}': {'plano':'gratuito','name':'Básico'}})
    achados = []
    for aba in ['home','sessions','challenges','perf','profile']:
        await pg.evaluate(f"goTab('{aba}')"); await pg.wait_for_timeout(500)
        t = await pg.evaluate("document.body.innerText")
        if '${' in t: achados.append(aba + ': ' + t[t.index('${')-30:t.index('${')+30])
    for f in ['openPlanos()', "mtPremiumAviso('alimentacao')", 'openAparencia()', 'openTrophies()']:
        await pg.evaluate(f"closeModal(); {f}; 0"); await pg.wait_for_timeout(350)
        t = await pg.evaluate("document.getElementById('modal-inner').innerText")
        if '${' in t: achados.append(f + ': ' + t[t.index('${')-30:t.index('${')+30])
    confere('nenhum "${...}" aparece como texto (abas e telas de plano)', not achados, achados)
    await pg.evaluate("closeModal(); goTab('profile')"); await pg.wait_for_timeout(400)
    confere('linhas Premium do Perfil mostram só a estrela (sem a palavra)', await pg.evaluate("[...document.querySelectorAll('#scr-profile .pl-mini')].every(e=>!!e.querySelector('svg') && !e.textContent.trim())") and await pg.evaluate("document.querySelectorAll('#scr-profile .pl-mini').length") >= 2)
    await foto(pg, 'b48-01-perfil-basico')
    confere('sem erros', not erros, erros[:3]); await ctx.close()

async def ajustes(b):
    print('2. Conquistas do Início, ilustração e tempo da atividade')
    ctx = await b.new_context(viewport={'width':390,'height':844})
    pg, erros = await pagina(ctx, {'uid':'uAj','email':'aj@example.com','emailVerified':True})
    await pg.evaluate("goTab('home')"); await pg.wait_for_timeout(300)
    n0 = await pg.evaluate("(document.querySelector('#home-metrics .met[onclick=\"openTrophies()\"] .met-v')||{}).textContent")
    tid = await pg.evaluate("TROPHIES.find(t=>!state.trophies.includes(t.id) && !t.secret).id")
    await pg.evaluate(f"unlockTrophy('{tid}')"); await pg.wait_for_timeout(500)
    n1 = await pg.evaluate("(document.querySelector('#home-metrics .met[onclick=\"openTrophies()\"] .met-v')||{}).textContent")
    tot = await pg.evaluate("state.trophies.length")
    confere('cartão Conquistas do Início atualiza na hora', n1 and n1.startswith(str(tot)) and n1 != n0, [n0, n1, tot])
    h = await pg.evaluate("""(()=>{ const og = Date.prototype.getHours; const r = {}; [6,12,17,18,19,23].forEach(x=>{ Date.prototype.getHours = ()=>x; r[x] = _cenaHora() + '/' + greetTime(); }); Date.prototype.getHours = og; return r; })()""")
    confere('ilustração segue a saudação: 18h já é noite (lua), 17h pôr do sol', h['18'].startswith('noite') and h['19'].startswith('noite') and h['17'].startswith('tarde') and h['12'].startswith('dia'), h)
    await pg.evaluate("openActivityLog ? openActivityLog() : 0; 0") if await pg.evaluate("typeof openActivityLog === 'function'") else None
    if not await pg.evaluate("!!document.getElementById('act-min')"):
        await pg.evaluate("(()=>{ const f = Object.keys(window).find(k=>/^open.*Activ/i.test(k) && typeof window[k]==='function'); if(f) window[f](); })()"); await pg.wait_for_timeout(300)
    cfg = await pg.evaluate("(()=>{ const el = document.getElementById('act-min'); return el ? nrConfig(el) : null; })()")
    confere('tempo da atividade avulsa usa o seletor numérico do app', cfg and cfg.get('tipo') == 'dur', cfg)
    # celebração também pelo registro avulso de atividade
    await pg.evaluate("closeModal(); state.conqPend = []; 0")
    await pg.evaluate("maLogActivity('caminhada', 6, 60, 4); 0"); await pg.wait_for_timeout(2600)
    r = await pg.evaluate("({ cel: !!document.querySelector('#modal-inner .cq-cel'), n: document.querySelectorAll('#modal-inner .cel-cartao').length })")
    confere('registro avulso (caminhada) também mostra as conquistas novas', r['cel'] and r['n'] >= 1, r)
    confere('sem erros', not erros, erros[:3]); await ctx.close()

async def cupons(b):
    print('3. Cupons de Premium')
    ctx = await b.new_context(viewport={'width':390,'height':844})
    pg0 = await ctx.new_page(); await pg0.goto(URL); await pg0.wait_for_timeout(800)
    dono = await pg0.evaluate("String(ADMIN_EMAIL).toLowerCase()"); await pg0.close()
    pg, erros = await pagina(ctx, {'uid':'dono','email':dono,'displayName':'Dono','emailVerified':True}, {f'admins/{dono}': {'ativo':True}})
    await pg.evaluate("goAdmin()"); await pg.wait_for_timeout(1500)
    confere('linha "Cupons de Premium" no painel', await pg.evaluate("!!document.getElementById('adm-cupom-row')"))
    await pg.evaluate("openCupons()"); await pg.wait_for_timeout(500)
    await pg.fill('#cup-nome', 'Instagram teste'); await pg.evaluate("$('cup-qtd').value='3'; $('cup-dias').value='15'; 0")
    await pg.evaluate("cuponsCriar()"); await pg.wait_for_timeout(900)
    cs = await pg.evaluate("Object.entries(window.__mockFS).filter(([k])=>k.startsWith('cupons/')).map(([k,v])=>({id:k.split('/')[1], ...v}))")
    confere('cria 3 cupons de 15 dias, livres, na campanha', len(cs) == 3 and all(c['dias'] == 15 and c['usadoPor'] is None and c['campanha'] == 'Instagram teste' and re.fullmatch(r'[A-Z2-9]{8}', c['id']) for c in cs), cs)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    ta = await pg.evaluate("(document.querySelector('.cup-novos textarea')||{}).value || ''")
    confere('mostra os códigos para copiar e a campanha com "0 de 3 usados"', '0 de 3 usados' in t and all((c['id'][:4] + '-' + c['id'][4:]) in ta for c in cs), t[:200])
    await foto(pg, 'b48-02-admin-cupons')
    # um cupom vencido para testar
    await pg.evaluate("window.__mockFS['cupons/VENCIDO2'] = { campanha:'Velha', dias:10, validoAte: Date.now()-86400000, usadoPor:null, usadoEm:null, criadoEm: Date.now() }; 0")
    confere('sem erros (admin)', not erros, erros[:3]); await pg.close()
    # aluno em teste Premium usa um cupom
    email = 'cupom@example.com'
    ini = int(time.time()*1000) - 10*86400000
    pg, erros = await pagina(ctx, {'uid':'uCup','email':email,'displayName':'Aluno Cupom','emailVerified':True}, {f'usuariosAutorizados/{email}': {'plano':'teste','testeInicio':ini,'name':'Aluno Cupom'}})
    await pg.evaluate("openPlanos()"); await pg.wait_for_timeout(300)
    confere('"Tenho um cupom" na tela de planos', await pg.evaluate("!!document.getElementById('cupom-btn')"))
    await pg.evaluate("openCupom()"); await pg.wait_for_timeout(200)
    await pg.fill('#cupom-cod', 'ZZZZ-ZZZZ'); await pg.evaluate("cupomResgatar()"); await pg.wait_for_timeout(500)
    confere('código inexistente: mensagem clara', 'não encontrado' in await pg.evaluate("document.getElementById('cupom-msg').textContent"))
    await pg.fill('#cupom-cod', 'VENC-IDO2'); await pg.evaluate("cupomResgatar()"); await pg.wait_for_timeout(500)
    confere('cupom vencido: mensagem com a data', 'venceu' in await pg.evaluate("document.getElementById('cupom-msg').textContent"))
    cod = cs[0]['id']
    await pg.fill('#cupom-cod', (cod[:4] + '-' + cod[4:]).lower()); await pg.evaluate("cupomResgatar()"); await pg.wait_for_timeout(900)
    a = await pg.evaluate(f"window.__mockFS['usuariosAutorizados/{email}']")
    c = await pg.evaluate(f"window.__mockFS['cupons/{cod}']")
    esperado = ini + 30*86400000 + 15*86400000
    confere('Premium liberado somando aos dias do teste (30 + 15)', a['plano'] == 'premium' and abs(a['premiumAte'] - esperado) < 120000 and a['cupom'] == cod, [a, esperado])
    confere('cupom marcado como usado pela pessoa (sem e-mail no cupom)', c['usadoPor'] == 'uCup' and email not in json.dumps(c), c)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('confirmação mostra os dias e até quando', '15 dias de Premium' in t and 'até' in t, t[:200])
    confere('o app passa a tratar a conta como Premium', await pg.evaluate("planoAtual().tipo === 'premium' && mtPremium()"))
    await foto(pg, 'b48-03-cupom-ok')
    await pg.evaluate("openCupom()"); await pg.wait_for_timeout(200)
    await pg.fill('#cupom-cod', cod); await pg.evaluate("cupomResgatar()"); await pg.wait_for_timeout(500)
    confere('o mesmo cupom não vale duas vezes', 'já usou' in await pg.evaluate("document.getElementById('cupom-tela').innerText"))
    confere('segundo cupom antes de 30 dias: bloqueado com a data de liberação', await pg.evaluate("document.getElementById('cupom-ok').disabled") and 'a partir de' in await pg.evaluate("document.getElementById('cupom-tela').innerText"))
    await pg.evaluate("$('cupom-ok').disabled=false; 0"); await pg.fill('#cupom-cod', cs[2]['id']); await pg.evaluate("cupomResgatar()"); await pg.wait_for_timeout(500)
    confere('nem forçando o botão: segundo cupom recusado e continua livre', 'a partir de' in await pg.evaluate("document.getElementById('cupom-msg').textContent") and await pg.evaluate(f"window.__mockFS['cupons/{cs[2]['id']}'].usadoPor") is None)
    await pg.evaluate(f"myAccess.cupomEm = Date.now() - 31*86400000; window.__mockFS['usuariosAutorizados/{email}'].cupomEm = myAccess.cupomEm; openCupom(); 0"); await pg.wait_for_timeout(200)
    await pg.fill('#cupom-cod', cs[2]['id']); await pg.evaluate("cupomResgatar()"); await pg.wait_for_timeout(900)
    a2 = await pg.evaluate(f"window.__mockFS['usuariosAutorizados/{email}']")
    confere('depois de 30 dias: novo cupom aceito e soma ao prazo', a2['cupom'] == cs[2]['id'] and abs(a2['premiumAte'] - (esperado + 15*86400000)) < 120000, a2)
    confere('sem erros (aluno)', not erros, erros[:3]); await pg.close()
    # aluno sem documento (Básico) usa outro cupom → documento criado só com os campos do resgate
    email2 = 'semdoc@example.com'
    pg, erros = await pagina(ctx, {'uid':'uSem','email':email2,'emailVerified':True}, {})
    await pg.evaluate(f"delete window.__mockFS['usuariosAutorizados/{email2}']; myAccess = null; openCupom(); 0"); await pg.wait_for_timeout(200)
    await pg.fill('#cupom-cod', cs[1]['id']); await pg.evaluate("cupomResgatar()"); await pg.wait_for_timeout(900)
    a = await pg.evaluate(f"window.__mockFS['usuariosAutorizados/{email2}']")
    confere('Básico sem documento: cria o plano só com os campos do resgate', a and a['plano'] == 'premium' and set(a.keys()) <= {'plano','premiumAte','cupom','cupomEm','name'} and abs(a['premiumAte'] - (time.time()*1000 + 15*86400000)) < 300000, a)
    await pg.evaluate("openCupom(); 0"); await pg.wait_for_timeout(200)
    await pg.evaluate("$('cupom-ok').disabled=false; window.__mockFS['usuariosAutorizados/semdoc@example.com'].cupomEm = Date.now()-40*86400000; myAccess.cupomEm = Date.now()-40*86400000; 0")
    await pg.fill('#cupom-cod', cs[0]['id']); await pg.evaluate("cupomResgatar()"); await pg.wait_for_timeout(500)
    confere('cupom usado por outra pessoa: "já foi usado"', 'já foi usado' in await pg.evaluate("document.getElementById('cupom-msg').textContent"))
    confere('sem erros (Básico)', not erros, erros[:3])
    await pg.close()
    print('4. Admin: quem usou cupom, liberar extra, sem limite, apagar histórico')
    pg, erros = await pagina(ctx, {'uid':'dono','email':dono,'displayName':'Dono','emailVerified':True}, {f'admins/{dono}': {'ativo':True}})
    await pg.evaluate("openCupons()"); await pg.wait_for_timeout(900)
    t = await pg.evaluate("document.getElementById('cup-pessoas').innerText")
    confere('lista quem usou cupom e quando libera o próximo', email in t and email2 in t and 'a partir de' in t, t[:300])
    i = await pg.evaluate(f"window.__cupomPessoas.findIndex(x=>x.email==='{email}')")
    await pg.evaluate(f"cupomLiberarPessoa({i})"); await pg.wait_for_timeout(600)
    a = await pg.evaluate(f"window.__mockFS['usuariosAutorizados/{email}']")
    confere('"Liberar 1 cupom agora" apaga só a marca do último resgate (Premium mantido)', 'cupomEm' not in a and a['plano'] == 'premium' and a['premiumAte'] > 0 and dono not in json.dumps(a), a)
    j = await pg.evaluate(f"window.__cupomPessoas.findIndex(x=>x.email==='{email2}')")
    await pg.evaluate(f"cupomSemLimitePessoa({j})"); await pg.wait_for_timeout(600)
    confere('"Sem limite" marca a pessoa', await pg.evaluate(f"window.__mockFS['usuariosAutorizados/{email2}'].cupomSemLimite") is True)
    confere('lista mostra "sem limite"', 'sem limite' in await pg.evaluate("document.getElementById('cup-pessoas').innerText"))
    antes = await pg.evaluate(f"window.__mockFS['usuariosAutorizados/{email}'].premiumAte")
    await pg.evaluate("cuponsApagarHistorico('Instagram teste')"); await pg.wait_for_timeout(300)
    await pg.evaluate("document.getElementById('appconfirm-ok').click()"); await pg.wait_for_timeout(900)
    resta = await pg.evaluate("Object.entries(window.__mockFS).filter(([k,v])=>k.startsWith('cupons/') && v.campanha==='Instagram teste').length")
    confere('"Apagar histórico" remove a campanha inteira (usados e livres)', resta == 0, resta)
    confere('quem usou continua com o Premium e o mesmo prazo', await pg.evaluate(f"window.__mockFS['usuariosAutorizados/{email}'].premiumAte") == antes)
    confere('campanha some da lista', 'Instagram teste' not in await pg.evaluate("document.getElementById('modal-inner').innerText"))
    await foto(pg, 'b48-04-admin-pessoas')
    await pg.evaluate("window.__mockFS['cupons/EXTRA234'] = { campanha:'Extra', dias:5, validoAte:null, usadoPor:null, usadoEm:null, criadoEm: Date.now() }; window.__mockFS['cupons/EXTRA567'] = { campanha:'Extra', dias:5, validoAte:null, usadoPor:null, usadoEm:null, criadoEm: Date.now() }; 0")
    confere('sem erros (admin 2)', not erros, erros[:3]); await pg.close()
    print('5. Pessoa liberada usa outro cupom no mesmo mês; sem limite usa dois seguidos')
    pg, erros = await pagina(ctx, {'uid':'uCup','email':email,'displayName':'Aluno Cupom','emailVerified':True}, {})
    await pg.evaluate("openCupom()"); await pg.wait_for_timeout(600)
    confere('liberada: botão ativo (lê o acesso de novo)', not await pg.evaluate("document.getElementById('cupom-ok').disabled"))
    await pg.fill('#cupom-cod', 'EXTRA234'); await pg.evaluate("cupomResgatar()"); await pg.wait_for_timeout(900)
    confere('cupom extra aceito', await pg.evaluate("window.__mockFS['cupons/EXTRA234'].usadoPor") == 'uCup')
    await pg.evaluate("openCupom()"); await pg.wait_for_timeout(600)
    confere('depois do extra, volta o limite de 30 dias', await pg.evaluate("document.getElementById('cupom-ok').disabled"))
    await pg.close()
    pg, erros2 = await pagina(ctx, {'uid':'uSem','email':email2,'emailVerified':True}, {})
    await pg.evaluate("openCupom()"); await pg.wait_for_timeout(600)
    await pg.fill('#cupom-cod', 'EXTRA567'); await pg.evaluate("cupomResgatar()"); await pg.wait_for_timeout(900)
    confere('sem limite: usa outro cupom logo em seguida', await pg.evaluate("window.__mockFS['cupons/EXTRA567'].usadoPor") == 'uSem')
    confere('sem erros (alunos)', not erros and not erros2, (erros+erros2)[:3])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        await basico(b); await ajustes(b); await cupons(b)
        await b.close()
    print(f'\nBeta 48: {ok} ok, {falhou} falha(s)'); sys.exit(1 if falhou else 0)
asyncio.run(main())

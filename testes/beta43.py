#!/usr/bin/env python3
"""Beta 43 — mensagem amigável na falha de acesso (sem detalhe técnico para o aluno), renovação da credencial
antes de tentar de novo, diagnóstico seguro para o administrador e a seção "Lanches para sair da rotina"
do plano alimentar (porção ajustada ao plano, restrições, favoritos, telas pequenas).
Uso: python3 testes/beta43.py http://localhost:8765/index.html [pasta-de-saida]"""
import asyncio, sys, os, json, re
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
ok = falhou = 0
def confere(nome, cond, info=''):
    global ok, falhou
    if cond: ok += 1; print('  ✅', nome)
    else: falhou += 1; print('  ❌', nome, str(info)[:300])
async def foto(pg, nome):
    if SAIDA: await pg.screenshot(path=os.path.join(SAIDA, nome + '.png'), full_page=False)
async def nova(b, user=None, docs=None, extra='', w=390, h=844, espera=2200):
    ctx = await b.new_context(viewport={'width':w,'height':h}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Sao_Paulo')
    await ctx.add_init_script(f"window.__MOCK_USER = {json.dumps(user or {})}; window.__MOCK_DOCS = {json.dumps(docs or {})}; window.__MOCK_SEM_DOC = false; {extra}")
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    await pg.goto(URL); await pg.wait_for_timeout(espera)
    return ctx, pg, erros
TELA = "(document.querySelector('.screen.active')||{}).id"
PROIBIDO = re.compile(r'firestore|banco de dados|cole[cç][aã]o|cole[cç][oõ]es|regras|permission|denied|insufficient|uid|firebase|detalhe t[eé]cnico|usuariosAutorizados', re.I)

async def acesso(b):
    print('1. Falha ao verificar o acesso: mensagem para o aluno')
    U = {'uid':'u-falha','email':'falha.aluno@example.com','displayName':'Falha','emailVerified':True}
    ctx, pg, erros = await nova(b, user=U, extra="window.__MOCK_NEGA_AUTORIZACAO = true;", espera=6500)
    r = await pg.evaluate("({ tela:(document.querySelector('.screen.active')||{}).id, tit:document.getElementById('noaccess-tit').textContent, msg:document.getElementById('noaccess-msg').textContent, tudo:document.getElementById('scr-noaccess').innerText, btn:(document.getElementById('noaccess-retry')||{}).textContent||'' })")
    confere('fica na tela de acesso (não entra sem autorização)', r['tela'] == 'scr-noaccess', r['tela'])
    confere('título: "Não foi possível acessar sua conta."', r['tit'].strip() == 'Não foi possível acessar sua conta.', r['tit'])
    confere('mensagem exata pedida', r['msg'].strip() == 'Não conseguimos verificar seu acesso neste momento. Tente novamente em alguns instantes. Se o problema continuar, entre em contato com nosso suporte.', r['msg'])
    confere('nenhum termo técnico na tela do aluno (Firestore, regras, permission-denied, UID…)', not PROIBIDO.search(r['tudo']), PROIBIDO.findall(r['tudo']))
    confere('nenhum e-mail na mensagem (nem o do aluno, nem de outra pessoa)', '@' not in r['msg'] and '@' not in r['tit'])
    confere('botão "Tentar novamente" presente', 'Tentar novamente' in r['btn'], r['btn'])
    confere('contato do suporte disponível', 'suporte' in r['tudo'].lower())
    confere('credencial renovada antes da 2ª tentativa (reload + token novo)', await pg.evaluate("(window.__mockReloads||0) >= 1 && (window.__mockTokenNovo||0) >= 1"), await pg.evaluate("[window.__mockReloads, window.__mockTokenNovo]"))
    await foto(pg, 'b43-01-acesso-amigavel')
    d = await pg.evaluate("Object.entries(window.__mockFS).filter(([k])=>k.startsWith('diagnosticoAcesso/')).map(([k,v])=>v)")
    confere('falha registrada no diagnóstico do administrador', len(d) == 1 and d[0].get('codigo') == 'permission-denied' and d[0].get('etapa') == 'verificar-acesso', d)
    txt = json.dumps(d)
    confere('diagnóstico sem e-mail, sem UID e sem nome', 'falha.aluno' not in txt and 'u-falha' not in txt and 'Falha' not in txt and '@' not in txt, txt)
    chaves = set(d[0].keys()) if d else set()
    confere('diagnóstico só com os campos permitidos pelas regras', chaves <= {'codigo','etapa','versao','em','plataforma','emailVerificado','tokenVerificado','provedor','conta','online'}, chaves)
    confere('"conta" é um resumo de 12 caracteres (hash), não o e-mail', d and re.fullmatch(r'[0-9a-f]{12}', d[0].get('conta','')), d and d[0].get('conta'))
    await pg.click('#noaccess-retry'); await pg.wait_for_timeout(2500)
    r2 = await pg.evaluate("({ tela:(document.querySelector('.screen.active')||{}).id, tudo:document.getElementById('scr-noaccess').innerText })")
    confere('"Tentar novamente" sem sucesso: continua amigável', r2['tela'] == 'scr-noaccess' and not PROIBIDO.search(r2['tudo']), PROIBIDO.findall(r2['tudo']))
    await pg.click('#noaccess-retry'); await pg.wait_for_timeout(2000)
    confere('mesma falha repetida não enche o diagnóstico (1 registro a cada 10 min)', await pg.evaluate("Object.keys(window.__mockFS).filter(k=>k.startsWith('diagnosticoAcesso/')).length") == 1)
    confere('botão continua "Tentar novamente" depois das tentativas', 'Tentar novamente' in await pg.evaluate("document.getElementById('noaccess-retry').textContent"))
    # a causa real: depois que a leitura volta a ser permitida, "Tentar novamente" entra
    await pg.evaluate("window.__MOCK_NEGA_AUTORIZACAO = false"); await pg.click('#noaccess-retry'); await pg.wait_for_timeout(3000)
    confere('quando a autorização volta a ser lida, "Tentar novamente" entra no app', await pg.evaluate(TELA) != 'scr-noaccess', await pg.evaluate(TELA))
    confere('sem erros de JavaScript', not erros, erros[:3]); await ctx.close()

    print('2. Sem internet: mensagem própria, também sem termos técnicos')
    ctx, pg, erros = await nova(b, user={'uid':'u-rede','email':'rede@example.com','emailVerified':True}, extra="window.__MOCK_NEGA_AUTORIZACAO = true;", espera=6500)
    await pg.evaluate("window.__acessoErro = 'unavailable'")
    await ctx.set_offline(True); await pg.click('#noaccess-retry'); await pg.wait_for_timeout(2500)
    t = await pg.evaluate("document.getElementById('scr-noaccess').innerText")
    confere('sem termos técnicos com o aparelho offline', not PROIBIDO.search(t), PROIBIDO.findall(t))
    await ctx.set_offline(False); await ctx.close()

    print('3. E-mail não confirmado continua com a tela própria')
    ctx, pg, erros = await nova(b, user={'uid':'u-nv','email':'naoverif@example.com','emailVerified':False}, espera=3000)
    confere('pede a confirmação do e-mail (não mostra falha genérica)', 'Confirme' in await pg.evaluate("document.getElementById('noaccess-tit').textContent"))
    await ctx.close()

    print('4. Credencial antiga (causa do permission-denied) se resolve sozinha')
    ctx, pg, erros = await nova(b, user={'uid':'u-tv','email':'tokenvelho2@example.com','emailVerified':True}, extra="window.__MOCK_TOKEN_VERIFICADO = false;", espera=3500)
    confere('entra sem mostrar erro (token renovado)', await pg.evaluate(TELA) != 'scr-noaccess', await pg.evaluate(TELA))
    confere('nenhum diagnóstico gravado quando a renovação resolve', await pg.evaluate("Object.keys(window.__mockFS).filter(k=>k.startsWith('diagnosticoAcesso/')).length") == 0)
    await ctx.close()

async def admin(b):
    print('5. Painel do administrador principal: diagnóstico de acesso')
    pg0 = await (await b.new_context()).new_page(); await pg0.goto(URL); await pg0.wait_for_timeout(800)
    dono = await pg0.evaluate("String(ADMIN_EMAIL).toLowerCase()")
    hash_aluno = await pg0.evaluate("_diagHash('Fulano@Example.com')")
    docs = { 'usuariosAutorizados/fulano@example.com': {'plano':'premium','name':'Fulano'}, f'admins/{dono}': {'ativo':True},
             'diagnosticoAcesso/a1': {'codigo':'permission-denied','etapa':'verificar-acesso','versao':'2027.1-beta.43','plataforma':'android-app','provedor':'password','emailVerificado':True,'tokenVerificado':False,'conta':hash_aluno,'online':True,'em':1700000000000},
             'diagnosticoAcesso/a2': {'codigo':'unavailable','etapa':'tentar-novamente','versao':'2027.1-beta.43','plataforma':'ios-navegador','provedor':'google.com','emailVerificado':True,'conta':'ffffffffffff','online':False,'em':1700000100000} }
    ctx, pg, erros = await nova(b, user={'uid':'dono','email':dono,'displayName':'Dono','emailVerified':True}, docs=docs)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1200); await pg.evaluate("closeModal(); goAdmin()"); await pg.wait_for_timeout(2500)
    confere('linha "Diagnóstico de acesso" no painel do principal', await pg.evaluate("!!document.getElementById('adm-diag-row')"))
    await pg.evaluate("openDiagnosticoAcesso()"); await pg.wait_for_timeout(1200)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('lista os registros com código e etapa', 'permission-denied' in t and 'unavailable' in t and 'Ao entrar no app' in t, t[:200])
    confere('liga o resumo ao aluno da lista (só no aparelho do admin)', 'fulano@example.com' in t)
    confere('explica a causa (credencial desatualizada / conexão)', 'Credencial desatualizada' in t and 'conexão' in t)
    confere('registro de conta fora da lista não mostra e-mail', 'não está na sua lista' in t)
    await foto(pg, 'b43-02-admin-diagnostico')
    await pg.evaluate("diagLimpar()"); await pg.wait_for_timeout(300)
    await pg.evaluate("(document.querySelector('#modal-inner .btn-primary, #modal-inner button[onclick*=\"ok\"]')||{click(){}}).click(); 0"); await pg.wait_for_timeout(300)
    btn = await pg.evaluate("[...document.querySelectorAll('button')].filter(b=>b.offsetParent && /^Apagar$/.test(b.textContent.trim())).length")
    if btn: await pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.offsetParent && /^Apagar$/.test(b.textContent.trim())).click(); 0"); await pg.wait_for_timeout(800)
    confere('principal consegue apagar os registros', await pg.evaluate("Object.keys(window.__mockFS).filter(k=>k.startsWith('diagnosticoAcesso/')).length") == 0)
    confere('sem erros de JavaScript', not erros, erros[:3]); await ctx.close()
    # aluno comum não vê o painel nem consegue abrir o diagnóstico
    ctx, pg, erros = await nova(b)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1000); await pg.evaluate("closeModal(); openDiagnosticoAcesso()"); await pg.wait_for_timeout(500)
    confere('aluno comum não abre o diagnóstico', 'Diagnóstico de acesso' not in await pg.evaluate("document.getElementById('modal-inner').innerText"))
    await ctx.close()

PERFIS = {
  'emagrecer_f': "{ nickname:'Ana', sex:'f', age:34, height:160, currentWeight:72, goal:'emagrecer', level:'iniciante', quiz_done:true }",
  'massa_m': "{ nickname:'Bruno', sex:'m', age:24, height:182, currentWeight:78, goal:'massa', level:'intermediario', quiz_done:true }",
}
async def receitas(b):
    print('6. Lanches para sair da rotina')
    ctx, pg, erros = await nova(b)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1200)
    await pg.evaluate(f"closeModal(); state.user.profile = Object.assign(state.user.profile||{{}}, {PERFIS['massa_m']}); state.nutri = null; nutriConfig(); openNutri()"); await pg.wait_for_timeout(400)
    r = await pg.evaluate("(()=>{ const e = document.getElementById('rc-entrada'); const ds = [...document.querySelectorAll('#modal-inner details.mealc')]; return { tem: !!e, depoisDicas: e && ds.length && e.previousElementSibling === ds[ds.length-1], refeicoes: document.querySelectorAll('#modal-inner .mealc').length }; })()")
    confere('entrada "Lanches para sair da rotina" no plano alimentar (discreta, depois das dicas)', r['tem'] and r['depoisDicas'], r)
    await foto(pg, 'b43-03-entrada-plano')
    await pg.evaluate("openReceitas()"); await pg.wait_for_timeout(300)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('título e subtítulo pedidos', 'Lanches para sair da rotina' in t and 'Receitas gostosas, práticas e econômicas para aproveitar o fim de semana sem deixar seu planejamento de lado.' in t)
    cats = await pg.evaluate("[...document.querySelectorAll('#modal-inner .rc-chip')].map(b=>b.textContent.trim())")
    confere('6 categorias pedidas + Todas e Favoritas', all(any(c in x for x in cats) for c in ['Hambúrgueres e sanduíches','Pizzas e massas','Salgados e AirFryer','Refeições rápidas','Doces e sobremesas','Opções econômicas']) and any('Favoritas' in x for x in cats), cats)
    n = await pg.evaluate("document.querySelectorAll('#modal-inner .rc-card').length")
    confere('receitas listadas (qualidade, não catálogo: até ~20)', 12 <= n <= 20, n)
    confere('aviso: estimativa (TACO/rótulos) e não substitui nutricionista', 'TACO' in t and 'nutricionista' in t and 'estimad' in t.lower())
    confere('nenhum preço inventado na lista', not re.search(r'R\$\s*\d', t), re.findall(r'R\$\s*\d+', t))
    confere('sem promessas de "saudável"/"fit"/"zero culpa"', not re.search(r'saud[aá]ve|\bfit\b|zero culpa|emagrece', t, re.I), re.findall(r'saud[aá]ve\w*|\bfit\b|zero culpa', t, re.I))
    await foto(pg, 'b43-04-lista-receitas')
    for nome in ['hamb_caseiro','hamb_pastel','mini_pizza','batata_rech']:
        await pg.evaluate(f"openReceita('{nome}')"); await pg.wait_for_timeout(200)
        tt = await pg.evaluate("document.getElementById('modal-inner').innerText")
        partes = ['Ingredientes','Modo de preparo','Substituições','kcal','rende','min']
        confere(f'{nome}: nome, tempo, dificuldade, rendimento, ingredientes, preparo, substituições, porção', all(p in tt for p in partes) and re.search(r'Fácil|Média', tt), [p for p in partes if p not in tt])
    await pg.evaluate("openReceita('hamb_caseiro')"); await pg.wait_for_timeout(200)
    tt = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('hambúrguer: patinho, coxão mole e coxão duro como opções', all(x in tt for x in ['Patinho','Coxão mole','Coxão duro']))
    confere('hambúrguer: avisa que corte magro não é automático', 'não é automático' in tt)
    await foto(pg, 'b43-05-hamburguer')
    await pg.evaluate("openReceita('hamb_pastel')"); await pg.wait_for_timeout(200)
    tt = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('massa de pastel: versões econômica e mais completa; AirFryer não é "baixa caloria"', 'Econômica' in tt and 'Mais completa' in tt and 'não vira "baixa caloria"' in tt)
    confere('massa de pastel: hambúrguer grelhado antes (segurança)', 'ANTES de embrulhar' in tt)
    print('7. Porção ajustada ao plano individual')
    k = await pg.evaluate("""(()=>{ const p = nutriMontarPlano(nutriDiaSel()); const r = RC_RECEITAS.find(x=>x.id==='hamb_caseiro');
       const rs = rcRestricao(r, 0); const j = p.refeicoes.find(m=>m.id==='jantar'); const e = rcEncaixe(r, rs.itens, j.tot.kcal);
       return { alvo:j.tot.kcal, kcal:e.tot.kcal, nao:!!e.naoCabe, esc:e.escala }; })()""")
    confere('ganhar massa: porção do hambúrguer próxima do jantar do plano (±15%)', not k['nao'] and abs(k['kcal'] - k['alvo']) <= k['alvo']*0.15, k)
    await pg.evaluate(f"state.user.profile = Object.assign(state.user.profile, {PERFIS['emagrecer_f']}); state.nutri.objetivo = 'emagrecer'; state.nutri.refeicoes = 6; openReceita('hamb_pastel')"); await pg.wait_for_timeout(200)
    k2 = await pg.evaluate("""(()=>{ const p = nutriMontarPlano(nutriDiaSel()); const r = RC_RECEITAS.find(x=>x.id==='hamb_caseiro');
       const j = p.refeicoes.find(m=>m.id==='jantar'); const e = rcEncaixe(r, rcRestricao(r,0).itens, j.tot.kcal); return { alvo:j.tot.kcal, kcal:e.tot.kcal, nao:!!e.naoCabe, esc:e.escala }; })()""")
    confere('emagrecer: porção menor que a de quem ganha massa', k2['kcal'] < k['kcal'], [k2, k])
    confere('nunca encolhe o recheio abaixo de 60% (não "descaracteriza")', (k2['esc'] or 1) >= 0.6, k2)
    # caso de não caber: lanche pequeno para uma refeição grande
    e3 = await pg.evaluate("""(()=>{ const r = RC_RECEITAS.find(x=>x.id==='hamb_pastel'); const e = rcEncaixe(r, rcRestricao(r,1).itens, 180); return { nao:!!e.naoCabe, kcal:e.tot.kcal }; })()""")
    confere('quando não cabe, marca como incompatível (não reduz até virar "nada")', e3['nao'] and e3['kcal'] > 180, e3)
    await pg.evaluate("window.__rc.ref = (nutriMontarPlano(nutriDiaSel()).refeicoes.find(m=>m.id==='ceia')||{}).id || 'lanche1'; window.__rc.vi = 1; rcRenderReceita()"); await pg.wait_for_timeout(200)
    tt = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('explica a incompatibilidade e sugere alternativas (com o artigo certo)', 'não cabe bem' in tt and 'prefira' in tt and 'seu ceia' not in tt.lower(), tt[:400])
    await foto(pg, 'b43-06-nao-cabe')
    n_pecas = await pg.evaluate("""(()=>{ const p = nutriMontarPlano(nutriDiaSel()); const r = RC_RECEITAS.find(x=>x.id==='esfiha'); const l = p.refeicoes.find(m=>/lanche/.test(m.id));
       const e = rcEncaixe(r, rcRestricao(r,0).itens, l.tot.kcal); return { n:e.n, kcal:e.tot.kcal, alvo:l.tot.kcal, peca:e.porPeca.kcal }; })()""")
    confere('receitas em unidades: quantidade de esfihas calculada para o lanche', n_pecas['n'] >= 1 and abs(n_pecas['kcal'] - n_pecas['alvo']) <= n_pecas['peca'], n_pecas)
    print('8. Restrições do plano')
    rr = await pg.evaluate("""(()=>{ const n = nutriConfig(); n.semGluten = true; n.semLactose = false; n.vegetariano = false;
       const ok = RC_RECEITAS.filter(rcCompativel).map(r=>r.id); n.semGluten = false; n.semLactose = true;
       const lac = rcRestricao(RC_RECEITAS.find(x=>x.id==='hamb_caseiro'), 0); const brig = rcCompativel(RC_RECEITAS.find(x=>x.id==='brigadeiro'));
       n.semLactose = false; n.vegetariano = true; const veg = RC_RECEITAS.filter(rcCompativel).map(r=>r.id); const vi = rcVarInicial(RC_RECEITAS.find(x=>x.id==='pastel_af'));
       n.vegetariano = false; return { ok, lacItens: lac.itens.map(i=>i.id), lacNota: lac.notas.join(' '), brig, veg, vi }; })()""")
    confere('sem glúten: só receitas sem pão/massa de trigo (batata, crepioca, bolinho, doces…)', 'batata_rech' in rr['ok'] and 'crepioca' in rr['ok'] and 'hamb_caseiro' not in rr['ok'] and 'mini_pizza' not in rr['ok'] and 'banana_assada' in rr['ok'], rr['ok'])
    confere('sem lactose: queijo opcional sai e a tela avisa', 'mucarela' not in rr['lacItens'] and 'Sem lactose' in rr['lacNota'], rr)
    confere('sem lactose: brigadeiro (leite condensado é base) não aparece como compatível', rr['brig'] is False)
    confere('vegetariano: receitas com carne ficam de fora; pastel abre na versão sem carne', 'hamb_caseiro' not in rr['veg'] and 'pastel_af' in rr['veg'] and rr['vi'] == 2, rr)
    await pg.evaluate("nutriConfig().semGluten = true; openReceitas('todas')"); await pg.wait_for_timeout(200)
    tt = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('lista mostra à parte as que não combinam (com o motivo)', 'Não combinam com suas restrições' in tt)
    await pg.evaluate("nutriConfig().semGluten = false")
    print('9. Favoritas e registro no plano')
    await pg.evaluate("openReceita('crepioca'); rcFav('crepioca')"); await pg.wait_for_timeout(300)
    confere('favoritar guarda em state.nutri.receitasFav e salva', await pg.evaluate("state.nutri.receitasFav.includes('crepioca') && Object.keys(localStorage).some(k=>(localStorage.getItem(k)||'').includes('receitasFav'))"))
    await pg.evaluate("rcCat('fav')"); await pg.wait_for_timeout(200)
    confere('categoria Favoritas mostra a receita', 'Crepioca' in await pg.evaluate("[...document.querySelectorAll('#modal-inner .rc-card')].map(c=>c.textContent).join('|')"))
    await pg.evaluate("openNutri()"); await pg.wait_for_timeout(200)
    confere('entrada do plano mostra quantas favoritas', '1 favorita' in await pg.evaluate("document.getElementById('rc-entrada').textContent"))
    # registrar no lugar do jantar
    await pg.evaluate("state.nutri.objetivo='massa'; state.user.profile = Object.assign(state.user.profile, " + PERFIS['massa_m'] + "); openReceita('hamb_caseiro', 'jantar')"); await pg.wait_for_timeout(200)
    tem = await pg.evaluate("!!document.querySelector('#modal-inner button[onclick=\"rcRegistrar()\"]')")
    confere('botão "Usar no lugar do jantar" disponível', tem)
    antes = await pg.evaluate("Math.round(nutriMontarPlano(nutriDiaSel()).dia.kcal)")
    await pg.evaluate("rcRegistrar()"); await pg.wait_for_timeout(300)
    reg = await pg.evaluate("""(()=>{ const m = nutriMealLog('jantar', false); return { add:(m.add||[]).filter(a=>a.receita).map(a=>a.nome), x:Object.values(m.adj||{}).filter(a=>a.x).length, tela:!!document.querySelector('#modal-inner [onclick="nutriListaCompras()"]') }; })()""")
    confere('registro troca os itens do jantar pela receita (reversível)', reg['add'] == ['Hambúrguer caseiro'] and reg['x'] >= 1 and reg['tela'], reg)
    await pg.evaluate("nutriResetRefeicao('jantar')"); await pg.wait_for_timeout(200)
    confere('"Voltar ao recomendado" desfaz o registro', await pg.evaluate("!(nutriMealLog('jantar', false).add||[]).length"))
    confere('plano alimentar continua igual (sem regressão no cardápio)', await pg.evaluate("Math.round(nutriMontarPlano(nutriDiaSel()).dia.kcal)") == antes)
    print('10. Custo honesto e doces')
    await pg.evaluate("openReceita('pastel_af')"); await pg.wait_for_timeout(200)
    await pg.evaluate("document.querySelector('.rc-custo').open = true; document.getElementById('rc-gasto').value = '18'; document.getElementById('rc-deliv').value = '20'; rcCusto(); 0"); await pg.wait_for_timeout(200)
    c = await pg.evaluate("document.getElementById('rc-custo-res').textContent")
    confere('custo por porção calculado só com o valor que a pessoa digitou', 'por porção' in c and 'R$' in c and 'delivery' in c, c)
    await pg.evaluate("openReceita('brigadeiro')"); await pg.wait_for_timeout(200)
    tt = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('doce: porção em unidades, % do dia e sem culpa', 'brigadeiros pequenos' in tt and '% do seu dia' in tt and 'Sem culpa' in tt)
    await pg.evaluate("openReceitas('doces')"); await pg.wait_for_timeout(200)
    tt = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('doces: bombom, quadradinho, brigadeiro, sobremesa porcionada; sem quantidade universal', all(x in tt for x in ['bombom','quadradinho de chocolate','brigadeiro pequeno','sobremesa caseira porcionada','Não existe uma quantidade certa']))
    await foto(pg, 'b43-07-doces')
    print('11. Valores nutricionais conferidos com a tabela')
    v = await pg.evaluate("""(()=>{ const r = RC_RECEITAS.find(x=>x.id==='hamb_caseiro'); const t = rcNutri(rcItensDe(r,0)); return Math.round(t.kcal); })()""")
    confere('hambúrguer de patinho (porção-base) ≈ 390 kcal pela soma dos ingredientes', 370 <= v <= 410, v)
    falta = await pg.evaluate("RC_RECEITAS.flatMap(r=>r.i.map(i=>i[0])).filter(id=>!rcAli(id))")
    confere('todos os ingredientes têm composição na tabela', not falta, falta)
    await pg.evaluate("closeModal()")
    confere('sem erros de JavaScript', not erros, erros[:3]); await ctx.close()

async def pequenas(b):
    print('12. Telas pequenas (320 px) e Android')
    for w, h in [(320, 640), (360, 740)]:
        ctx, pg, erros = await nova(b, w=w, h=h)
        await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1000)
        await pg.evaluate("closeModal(); openReceitas()"); await pg.wait_for_timeout(300)
        confere(f'{w}px: a janela das receitas abre de fora do plano', await pg.evaluate("document.getElementById('modal-back').classList.contains('on') && !!document.querySelector('#modal-inner .rc-card svg')"))
        lx = await pg.evaluate("(()=>{ const mi = document.getElementById('modal-inner'); return mi.scrollWidth - mi.clientWidth; })()")
        confere(f'{w}px: lista sem rolagem lateral', lx <= 1, lx)
        if w == 320: await foto(pg, 'b43-08-lista-320')
        await pg.evaluate("openReceita('mini_pizza')"); await pg.wait_for_timeout(300)
        lx = await pg.evaluate("(()=>{ const mi = document.getElementById('modal-inner'); return mi.scrollWidth - mi.clientWidth; })()")
        al = await pg.evaluate("Math.min(...[...document.querySelectorAll('#modal-inner .rc-chip, #modal-inner .btn')].filter(e=>e.offsetParent).map(e=>e.getBoundingClientRect().height))")
        confere(f'{w}px: receita sem rolagem lateral e botões com altura de toque (≥ 34 px)', lx <= 1 and al >= 34, [lx, al])
        if w == 320: await foto(pg, 'b43-09-receita-320')
        confere(f'{w}px: sem erros', not erros, erros[:3]); await ctx.close()
    print('13. Plano Básico: receitas fazem parte do plano alimentar Premium')
    t = await (await b.new_context()).new_page(); await t.goto(URL); await t.wait_for_timeout(500)
    ctx, pg, erros = await nova(b, docs={'usuariosAutorizados/aluno.teste@example.com': {'plano':'gratuito','name':'Aluno Teste'}})
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(800); await pg.evaluate("closeModal(); openReceitas()"); await pg.wait_for_timeout(300)
    confere('Básico: abre o aviso Premium (não a lista)', not await pg.evaluate("!!document.querySelector('#modal-inner .rc-card')") and 'Premium' in await pg.evaluate("document.getElementById('modal-inner').innerText"))
    await pg.evaluate("closeModal(); rcFav('crepioca')"); await pg.wait_for_timeout(200)
    confere('Básico: favoritar também é controlado', not await pg.evaluate("((state.nutri||{}).receitasFav||[]).includes('crepioca')"))
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        await acesso(b); await admin(b); await receitas(b); await pequenas(b)
        await b.close()
    print(f'\nBeta 43: {ok} ok, {falhou} falha(s)'); sys.exit(1 if falhou else 0)
asyncio.run(main())

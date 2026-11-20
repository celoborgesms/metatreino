#!/usr/bin/env python3
"""Beta 49 — Alimentação da casa com DOIS celulares de pessoas diferentes, na mesma nuvem simulada
(testes/nuvem-simulada.py) com as regras de "familias" traduzidas de firestore.rules.
Cobre: o erro "Não consegui gerar um código livre" (criar sem ler antes), entrar pelo código, administrador,
mesmo prato com porção de cada um, composição (tirar/acrescentar) só pelo administrador, gravações proibidas
negadas pelas regras, registro pessoal, lista de compras individual e da casa, PDF da casa, passar a
administração e sair.
Uso: python3 testes/casa-dois-celulares.py PASTA_DO_PROJETO [porta]"""
import asyncio, sys, os, shutil, re, subprocess, time, tempfile, json, urllib.request
from playwright.async_api import async_playwright
PROJ = sys.argv[1]; PORTA = int(sys.argv[2]) if len(sys.argv) > 2 else 8791
AQUI = os.path.dirname(os.path.abspath(__file__))
A = {'uid':'uA', 'email':'pessoa.a@example.com', 'emailVerified':True, 'displayName':'Pessoa A', 'providerData':[{'providerId':'google.com'}]}
B = {'uid':'uB', 'email':'pessoa.b@example.com', 'emailVerified':True, 'displayName':'Pessoa B', 'providerData':[{'providerId':'password'}]}
PERFIL_A = "{ nickname:'Marcelo', sex:'m', age:30, height:178, currentWeight:84, goal:'massa', level:'intermediario', quiz_done:true }"
PERFIL_B = "{ nickname:'Emilly', sex:'f', age:28, height:162, currentWeight:58, goal:'emagrecer', level:'iniciante', quiz_done:true }"
ok = 0; falhas = []
def confere(nome, cond, info=''):
    global ok
    if cond: ok += 1; print('  ✅', nome)
    else: falhas.append(nome); print('  ❌', nome, str(info)[:400])
def prepara():
    site = tempfile.mkdtemp(prefix='mt-casa-')
    for f in os.listdir(PROJ):
        s = os.path.join(PROJ, f)
        if os.path.isfile(s): shutil.copy(s, site)
    for f in ('mock-firebase-rede.js', 'semente.js'): shutil.copy(os.path.join(AQUI, f), site)
    p = os.path.join(site, 'index.html'); s = open(p, encoding='utf-8').read()
    s = re.sub(r'<script src="https://www.gstatic.com/firebasejs/[^"]+"></script>\n?', '', s); s = re.sub(r'<link href="https://fonts.googleapis.com[^>]+>', '', s)
    s = s.replace('<title>', '<script src="./mock-firebase-rede.js"></script>\n<title>', 1).replace('</body>', '<script src="./semente.js"></script>\n</body>', 1)
    s = s.replace("navigator.serviceWorker.register('./service-worker.js')", "Promise.reject('sem sw no teste')")
    open(p, 'w', encoding='utf-8').write(s); return site
def semear(dados):
    req = urllib.request.Request(f'http://127.0.0.1:{PORTA}/__fs/semear', data=json.dumps({'op':'semear', 'dados':dados}).encode(), headers={'Content-Type':'application/json'}); urllib.request.urlopen(req).read()
def nuvem(): return json.loads(urllib.request.urlopen(f'http://127.0.0.1:{PORTA}/__fs/estado').read())
def familia_doc():
    l = nuvem()['loja']; ks = [k for k in l if k.startswith('familias/')]
    return (ks[0], l[ks[0]]) if ks else (None, None)
async def abre(b, user, perfil):
    ctx = await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True, locale='pt-BR', timezone_id='America/Sao_Paulo')
    await ctx.add_init_script('window.__MOCK_USER = ' + json.dumps(user) + ';')
    pg = await ctx.new_page(); pg.erros = []; pg.toasts = []
    pg.on('pageerror', lambda e: pg.erros.append(str(e)))
    await pg.goto(f'http://127.0.0.1:{PORTA}/index.html')
    await pg.wait_for_function("document.querySelector('.screen.active') && !['scr-auth'].includes(document.querySelector('.screen.active').id)", timeout=40000)
    await pg.wait_for_timeout(1200)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500)
    await pg.evaluate(f"try{{closeAwards()}}catch(e){{}}; try{{closeModal()}}catch(e){{}}; state.user.profile = Object.assign(state.user.profile||{{}}, {perfil}); state.nutri = null; nutriConfig(); saveData(); 0")
    await pg.evaluate("window.__toasts = []; const _t = window.toast; window.toast = function(m){ window.__toasts.push(String(m)); return _t.apply(this, arguments); }")
    return ctx, pg
async def espera(pg, js, ms=12000):
    try: await pg.wait_for_function(js, timeout=ms); return True
    except Exception: return False
ALMOCO = "(()=>{ const p = nutriMontarPlano(getDayIdx()); const m = p.refeicoes.find(x=>x.id==='almoco'); return m ? { prato:m.prato, casa:!!m.compartilhada, ids:m.itens.map(i=>i.id), g:m.itens.map(i=>Math.round(i.gramas)), kcal:Math.round(m.tot.kcal), fator:m.fator } : null; })()"
async def tenta(pg, js):
    return await pg.evaluate(f"(async()=>{{ try{{ await ({js}); return 'ok'; }}catch(e){{ return e && e.code || String(e); }} }})()")

async def main():
    site = prepara()
    srv = subprocess.Popen([sys.executable, os.path.join(AQUI, 'nuvem-simulada.py'), site, str(PORTA)]); time.sleep(1)
    try:
        semear({ 'usuariosAutorizados/' + A['email']: {'active':True, 'expiresAt':None, 'name':'A'}, 'usuariosAutorizados/' + B['email']: {'active':True, 'expiresAt':None, 'name':'B'} })
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
            ca, pa = await abre(b, A, PERFIL_A)
            cb, pb = await abre(b, B, PERFIL_B)

            print('1. Causa do "Não consegui gerar um código livre"')
            r = await tenta(pb, "db.collection('familias').doc('K7M2QX').get()")
            confere('ler um código que não existe é negado para quem não é o administrador principal (era o que o app fazia antes de criar)', r == 'permission-denied', r)
            await pb.evaluate("openNutri(); openFamilia(); famCriar()")
            okB = await espera(pb, "!!(state.nutri.familia && state.nutri.familia.id)")
            idB = await pb.evaluate("state.nutri.familia && state.nutri.familia.id")
            confere('o segundo celular (conta comum) cria o grupo sem erro', okB and idB and len(idB) == 6, idB)
            k, d = familia_doc()
            confere('grupo criado na nuvem com ela como única pessoa e administradora', d and d.get('membros') == ['uB'] and d.get('dono') == 'uB', d)
            await pb.evaluate("famSair()"); await pb.wait_for_timeout(300)
            await pb.evaluate("document.querySelector('#modal-inner .btn-primary').click()"); await pb.wait_for_timeout(1200)
            confere('o último a sair apaga o grupo', familia_doc()[0] is None, familia_doc())

            print('2. Criar e entrar pelo código')
            await pa.evaluate("openNutri(); openFamilia(); famCriar()")
            await espera(pa, "!!(state.nutri.familia && state.nutri.familia.id)")
            cod = await pa.evaluate("state.nutri.familia.id")
            await pb.evaluate(f"openFamilia(); document.getElementById('fam-codigo').value = '{cod.lower()}'; famEntrar()")
            okJ = await espera(pb, "!!(state.nutri.familia && state.nutri.familia.id) && famAtiva()")
            k, d = familia_doc()
            confere('quem recebe o código entra no grupo', okJ and d and sorted(d['membros']) == ['uA','uB'] and d['dono'] == 'uA', d)
            txt = json.dumps(d)
            confere('no grupo: nada de e-mail, peso, idade ou altura', 'example.com' not in txt and 'currentWeight' not in txt and '"84"' not in txt and 'height' not in txt and 'age' not in txt.replace('ageEm',''), txt[:300])
            await espera(pa, "famMembros().length === 2")
            confere('A tela da casa mostra o administrador', 'administrador' in (await pa.evaluate("openFamilia(), document.getElementById('modal-inner').innerText")).lower())

            print('3. Mesmo prato, quantidade de cada um')
            await espera(pb, "(()=>{ const p = nutriMontarPlano(getDayIdx()); return p.refeicoes.some(m=>m.compartilhada); })()")
            la, lb = await pa.evaluate(ALMOCO), await pb.evaluate(ALMOCO)
            confere('almoço da casa: o mesmo prato e os mesmos alimentos nos dois celulares', la and lb and la['prato'] == lb['prato'] and la['ids'] == lb['ids'] and la['casa'] and lb['casa'], [la, lb])
            confere('quantidades e calorias diferentes (plano de cada um)', la['g'] != lb['g'] and la['kcal'] != lb['kcal'], [la, lb])

            print('4. Só o administrador muda o cardápio')
            await pb.evaluate("nutriTrocar('almoco')"); await pb.wait_for_timeout(600)
            t = await pb.evaluate("window.__toasts.join(' | ')")
            k, d = familia_doc()
            confere('quem não administra não troca o prato da casa (avisa quem decide)', 'administrador' in t and not (d.get('config',{}).get('trocas') or {}).get('almoco'), t)
            r1 = await tenta(pb, f"db.collection('familias').doc('{cod}').update({{ 'config.trocas.almoco': 5 }})")
            r2 = await tenta(pb, f"db.collection('familias').doc('{cod}').update({{ 'nomes.uA': 'Outro nome' }})")
            r3 = await tenta(pb, f"db.collection('familias').doc('{cod}').update({{ dono: 'uB' }})")
            r4 = await tenta(pb, f"db.collection('familias').doc('{cod}').update({{ 'perfis.uA': {{ veg:true }} }})")
            confere('regras negam: mexer no cardápio, no apelido/perfil do outro e virar administrador', [r1,r2,r3,r4] == ['permission-denied']*4, [r1,r2,r3,r4])
            r5 = await tenta(pb, f"db.collection('familias').doc('{cod}').update({{ 'nomes.uB': 'Emi' }})")
            confere('regras deixam alterar o próprio apelido', r5 == 'ok', r5)
            antes = la['prato']
            await pa.evaluate("nutriTrocar('almoco')"); await pa.wait_for_timeout(300)
            okT = await espera(pb, f"(()=>{{ const m = nutriMontarPlano(getDayIdx()).refeicoes.find(x=>x.id==='almoco'); return m && m.prato !== {json.dumps(antes)}; }})()")
            la, lb = await pa.evaluate(ALMOCO), await pb.evaluate(ALMOCO)
            confere('o administrador troca o prato e ele muda no outro celular', okT and la['prato'] == lb['prato'] and la['prato'] != antes, [antes, la, lb])
            kcalB = lb['kcal']
            tirar = next((i for i in la['ids'] if i in ('salada','legumes','brocolis','cenoura','feijao','feijaopreto')), la['ids'][-1])
            await pa.evaluate(f"famTirarDaCasa('almoco','{tirar}')"); await pa.wait_for_timeout(300)
            okR = await espera(pb, f"!nutriMontarPlano(getDayIdx()).refeicoes.find(x=>x.id==='almoco').itens.some(i=>i.id==='{tirar}')")
            lb2 = await pb.evaluate(ALMOCO)
            confere(f'tirar "{tirar}" do prato da casa vale para todos', okR, lb2)
            # Beta 52: sem "manter as calorias", o outro vê as calorias a menos (recomendado × com o ajuste)
            dB = await pb.evaluate("(()=>{ const m = nutriMontarPlano(getDayIdx()).refeicoes.find(x=>x.id==='almoco'); return { d: m.casaDelta, rec: m.recKcal, k: Math.round(m.tot.kcal) }; })()")
            confere('e o outro vê no plano dele as calorias a menos (recomendado → com o ajuste)', dB['d'] < 0 and abs(dB['rec'] - kcalB) <= kcalB*0.08 and dB['k'] < dB['rec'], [kcalB, dB])
            await pa.evaluate("window.__famAddCasa = true; window.__ned = { mode:'add', mid:'almoco', fid:'tomate', base:0, un:false, passo:5, q:60 }; nutriEdSalvar()"); await pa.wait_for_timeout(300)
            okA = await espera(pb, "nutriMontarPlano(getDayIdx()).refeicoes.find(x=>x.id==='almoco').itens.some(i=>i.id==='tomate')")
            confere('acrescentar ao prato da casa aparece no outro celular, na porção dele', okA)
            k, d = familia_doc()
            confere('na nuvem fica só a composição do prato (sem quantidade pessoal de ninguém)', any('tomate' in json.dumps(v) for v in (d.get('cardapio') or {}).values()) and 'registro' not in d, d.get('cardapio'))

            print('5. Registro é pessoal')
            await pb.evaluate("nutriComi('almoco')"); await pb.wait_for_timeout(2500)
            ca_ = await pa.evaluate("(()=>{ const d = (state.nutriLog||{})[chaveDia(new Date())]||{}; const m = d.almoco; return !!(m && (m===true || m.ok)); })()")
            confere('"comi" de uma pessoa não marca a refeição da outra', ca_ is False, ca_)

            print('6. Lista de compras individual e da casa')
            await espera(pa, "(()=>{ const c = famCache(); return !!(c.perfis && c.perfis.uB && c.perfis.uB.compras && Object.keys(c.perfis.uB.compras.dias||{}).length); })()", 15000)
            r = await pa.evaluate("""(()=>{ const eu = nutriComprasTotais('7dias','eu'), casa = nutriComprasTotais('7dias','casa'); const c = famCache();
                const dias = (c.perfis.uB.compras||{}).dias||{}; const per = casa.periodo; let somaB = 0; Object.keys(dias).forEach(dk=>{ if(dk>=per.de && dk<=per.ate) Object.values(dias[dk]).forEach(g=>somaB+=g); });
                const tEu = Object.values(eu.tot).reduce((s,t)=>s+t.g,0), tCasa = Object.values(casa.tot).reduce((s,t)=>s+t.g,0);
                const id = Object.keys(casa.tot).find(i=>casa.tot[i].por.uA && casa.tot[i].por.uB);
                return { pessoas: casa.pessoas, tEu, tCasa, somaB, id, linha: id && casa.tot[id], per }; })()""")
            confere('a lista da casa soma as duas pessoas (todas as refeições, porção de cada uma)', r['pessoas'] == 2 and abs(r['tCasa'] - (r['tEu'] + r['somaB'])) < 2, r)
            confere('cada alimento guarda a parte de cada pessoa (ex.: 6 + 9 = 15)', r['linha'] and abs(r['linha']['g'] - r['linha']['por']['uA'] - r['linha']['por']['uB']) < 0.5, r['linha'])
            await pa.evaluate("nutriListaCompras('7dias','casa')"); await pa.wait_for_timeout(200)
            t = await pa.evaluate("document.getElementById('modal-inner').innerText")
            confere('tela: "Só eu" e "Casa toda", período e unidades', 'Só eu' in t and 'Casa toda' in t and 'Período' in t and re.search(r'\d+ (g|kg|unid\.|ml|L)', t), t[:400])
            u = await pa.evaluate("[nutriQtdCompra('banana', 80*15), nutriQtdCompra('arroz', 750), nutriQtdCompra('azeite', 56), nutriQtdCompra('leite', 1400)]")
            confere('unidades padronizadas: 15 unid., arroz cru em g, azeite em ml, leite em L', u[0]['n']=='15' and u[0]['un']=='unid.' and u[1]['un']=='g' and u[1]['obs']=='cru' and u[2]['un']=='ml' and u[3]['un']=='L', u)
            await pa.evaluate("window._pdfUlt = null; pdfAlimentacaoCasa()")
            okP = await espera(pa, "!!window._pdfUlt", 20000)
            confere('PDF da casa gerado', okP)
            await pa.evaluate("closeModal(); window._pdfUlt = null; pdfAlimentacao()")
            okP2 = await espera(pa, "!!window._pdfUlt", 20000)
            confere('PDF individual continua funcionando', okP2)

            print('7. Passar a administração e sair')
            await pa.evaluate("closeModal(); openFamilia(); famPassarAdm('uB')"); await pa.wait_for_timeout(200)
            await pa.evaluate("document.querySelector('#modal-inner .btn-primary').click()"); await pa.wait_for_timeout(800)
            k, d = familia_doc()
            confere('administração passada para a outra pessoa', d and d['dono'] == 'uB', d and d.get('dono'))
            okAdm = await espera(pb, "famSouAdm()")
            antes = (await pb.evaluate(ALMOCO))['prato']
            await pb.evaluate("nutriTrocar('almoco')"); await pb.wait_for_timeout(300)
            okT2 = await espera(pa, f"nutriMontarPlano(getDayIdx()).refeicoes.find(x=>x.id==='almoco').prato !== {json.dumps(antes)}")
            confere('a nova administradora troca o prato e o outro celular acompanha', okAdm and okT2)
            await pa.evaluate("closeModal(); famSair()"); await pa.wait_for_timeout(300)
            await pa.evaluate("document.querySelector('#modal-inner .btn-primary').click()"); await pa.wait_for_timeout(1200)
            k, d = familia_doc()
            confere('quem sai tira só a si mesmo; o grupo continua com quem ficou', d and d['membros'] == ['uB'] and 'uA' not in (d.get('nomes') or {}), d)
            confere('quem saiu mantém o cardápio (prato guardado)', await pa.evaluate("!famAtiva() && !!state.nutri.cardapioFixo"))
            neg = nuvem()['negados']
            confere('as únicas gravações negadas foram as tentativas proibidas do teste', all(x[1].startswith('familias/') for x in neg) and len([x for x in neg if x[0] in ('update','set')]) == 4, neg)
            confere('sem erros de JavaScript', not pa.erros and not pb.erros, pa.erros + pb.erros)
            await b.close()
    finally:
        srv.terminate()
    print(f'\nCasa (dois celulares): {ok} ok, {len(falhas)} falha(s)')
    if falhas: sys.exit(1)
asyncio.run(main())

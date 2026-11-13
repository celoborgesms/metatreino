#!/usr/bin/env python3
"""Celular (login Google) e computador (login e-mail e senha) na MESMA conta, com UIDs diferentes,
como acontece neste projeto do Firebase. Uma nuvem simulada compartilhada (testes/nuvem-simulada.py)
com as regras da Beta 34. Cenários: histórico do celular no PC, treino no PC aparece no celular, perfil,
treino completo e estatísticas, os dois abertos ao mesmo tempo, internet instável, sair e entrar.
Uso: python3 testes/dois-aparelhos.py PASTA_DO_PROJETO [porta]"""
import asyncio, sys, os, shutil, re, subprocess, time, tempfile, json, urllib.request
from playwright.async_api import async_playwright
PROJ = sys.argv[1]; PORTA = int(sys.argv[2]) if len(sys.argv) > 2 else 8790
AQUI = os.path.dirname(os.path.abspath(__file__))
EMAIL = 'ana.teste@example.com'
CEL = {'uid':'uid-google-ana', 'email':EMAIL, 'emailVerified':True, 'displayName':'Ana', 'providerData':[{'providerId':'google.com'}]}
PC  = {'uid':'uid-senha-ana',  'email':EMAIL, 'emailVerified':True, 'displayName':'Ana', 'providerData':[{'providerId':'password'}]}
ok = 0; falhas = []
def confere(nome, cond, info=''):
    global ok
    if cond: ok += 1; print('  ✅', nome)
    else: falhas.append(nome); print('  ❌', nome, info)
def prepara():
    site = tempfile.mkdtemp(prefix='mt2-')
    for f in os.listdir(PROJ):
        s = os.path.join(PROJ, f)
        if os.path.isfile(s): shutil.copy(s, site)
    for f in ('mock-firebase-rede.js', 'semente.js'): shutil.copy(os.path.join(AQUI, f), site)
    p = os.path.join(site, 'index.html'); s = open(p, encoding='utf-8').read()
    s = re.sub(r'<script src="https://www.gstatic.com/firebasejs/[^"]+"></script>\n?', '', s); s = re.sub(r'<link href="https://fonts.googleapis.com[^>]+>', '', s)
    s = s.replace('<title>', '<script src="./mock-firebase-rede.js"></script>\n<title>', 1).replace('</body>', '<script src="./semente.js"></script>\n</body>', 1)
    s = s.replace("navigator.serviceWorker.register('./service-worker.js')", "Promise.reject('sem sw no teste')")   # o service worker não entra neste teste
    open(p, 'w', encoding='utf-8').write(s); return site
def semear(dados):
    req = urllib.request.Request(f'http://127.0.0.1:{PORTA}/__fs/semear', data=json.dumps({'op':'semear', 'dados':dados}).encode(), headers={'Content-Type':'application/json'}); urllib.request.urlopen(req).read()
def nuvem():
    return json.loads(urllib.request.urlopen(f'http://127.0.0.1:{PORTA}/__fs/estado').read())
async def abre(b, user, vp, mobile):
    ctx = await b.new_context(viewport=vp, is_mobile=mobile, has_touch=mobile, locale='pt-BR', timezone_id='America/Sao_Paulo')
    await ctx.add_init_script('window.__MOCK_USER = ' + json.dumps(user) + ';')
    pg = await ctx.new_page(); pg.erros = []
    pg.on('pageerror', lambda e: pg.erros.append(str(e)))
    await pg.goto(f'http://127.0.0.1:{PORTA}/index.html')
    await pg.wait_for_function("document.querySelector('.screen.active') && !['scr-auth'].includes(document.querySelector('.screen.active').id)", timeout=40000)
    await pg.wait_for_timeout(1200)
    return ctx, pg
async def tela(pg): return await pg.evaluate("document.querySelector('.screen.active').id")
async def hist(pg): return await pg.evaluate("[(state.modules.lift&&state.modules.lift.history||[]).length, (state.modules.run&&state.modules.run.history||[]).length]")
async def espera(pg, js, ms=12000):
    try: await pg.wait_for_function(js, timeout=ms); return True
    except Exception: return False
async def main():
    site = prepara()
    srv = subprocess.Popen([sys.executable, os.path.join(AQUI, 'nuvem-simulada.py'), site, str(PORTA)]); time.sleep(1)
    try:
        semear({ 'usuariosAutorizados/' + EMAIL: {'active':True, 'expiresAt':None, 'name':'Ana'} })
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
            print('\n1. Celular (Google) cria a conta e registra 68 dias de treinos')
            cctx, cel = await abre(b, CEL, {'width':390,'height':844}, True)
            await cel.evaluate("mtSemente()"); await cel.wait_for_timeout(2500)
            await cel.evaluate("try{closeAwards()}catch(e){}; try{closeModal()}catch(e){}")
            hc = await hist(cel); print('   celular:', hc)
            print('2. Computador (e-mail e senha, outro UID) abre a mesma conta')
            pctx, pc = await abre(b, PC, {'width':1366,'height':800}, False)
            t = await tela(pc); hp = await hist(pc)
            confere('PC não cai no questionário (reconhece a conta)', t != 'scr-quiz', t)
            confere('PC mostra o MESMO histórico do celular', hp == hc, (hp, hc))
            confere('PC usa o mesmo documento de dados que o celular', await pc.evaluate("uidDados()") == await cel.evaluate("uidDados()"), await pc.evaluate("[uidDados(), fbUser.uid]"))
            await pc.evaluate("goTab('history')"); n_lista = await pc.evaluate("document.querySelectorAll('#history-list .hist-card').length")
            confere('Histórico do PC lista os treinos na tela', n_lista > 0, n_lista)
            print('3. Treino registrado no PC aparece no celular (os dois abertos)')
            await pc.evaluate("maLogActivity('corrida', 6.2, 37, 5)")
            ok3 = await espera(cel, "(state.modules.run.history||[]).some(x=>x.distance===6.2)", 15000)
            confere('corrida feita no PC chega ao celular em segundos', ok3)
            print('4. Perfil alterado no celular aparece no PC')
            await cel.evaluate("openModal('edit-profile'); document.getElementById('ep-nick').value='Aninha'; saveProfileEdit()")
            ok4 = await espera(pc, "state.user.profile && state.user.profile.nickname==='Aninha'", 15000)
            confere('apelido novo aparece no PC', ok4, await pc.evaluate("state.user.profile && state.user.profile.nickname"))
            print('5. Treino de musculação concluído no celular: histórico e estatísticas iguais nos dois')
            await cel.evaluate("""(()=>{ const w = state.modules.lift.plan.workouts.find(x=>x.dayIdx===getDayIdx()) || state.modules.lift.plan.workouts[0];
                const e = w.exercises[0]; openSetLog(e.id, e.name); addSet(); closeSetLog(true); stopRestTimer(); finishLiftWorkout(w.k); confirmLiftWorkout(w.k); })()""")
            await cel.wait_for_timeout(1500)
            alvo = await hist(cel)
            ok5 = await espera(pc, f"(state.modules.lift.history||[]).length==={alvo[0]}", 15000)
            confere('treino concluído aparece no PC', ok5, (await hist(pc), alvo))
            st = await cel.evaluate("[state.stats.liftTotal, state.stats.runTotal, state.trophies.length]"); st2 = await pc.evaluate("ensureStats(), [state.stats.liftTotal, state.stats.runTotal, state.trophies.length]")
            confere('totais e conquistas iguais nos dois', st == st2, (st, st2))
            print('6. Internet instável: PC sem internet registra uma corrida; celular registra outra; a internet volta')
            await pc.evaluate("window.__mockOffline = true")
            await pc.evaluate("maLogActivity('corrida', 3.3, 20, 4)")
            await cel.wait_for_timeout(500)
            await cel.evaluate("maLogActivity('caminhada', 4.4, 50, 3)")
            await cel.wait_for_timeout(2000)
            await pc.evaluate("window.__mockOffline = false; window.dispatchEvent(new Event('online'))")
            alvo6 = "(state.modules.run.history||[]).some(x=>x.distance===3.3) && (state.modules.run.history||[]).some(x=>x.distance===4.4)"
            c6 = await espera(cel, alvo6, 20000); p6 = await espera(pc, alvo6, 20000)
            confere('nada se perdeu: as duas atividades estão no celular', c6, await hist(cel))
            confere('nada se perdeu: as duas atividades estão no PC', p6, await hist(pc))
            await cel.wait_for_timeout(3000)
            n = nuvem(); doc = n['loja'].get('usuarios/' + await cel.evaluate('uidDados()'), {})
            runs = [x for x in doc.get('estadoApp',{}).get('modules',{}).get('run',{}).get('history',[])]
            chaves = [x['at'] for x in runs]
            confere('na nuvem, sem duplicados', len(chaves) == len(set(chaves)), len(chaves) - len(set(chaves)))
            confere('na nuvem, as duas atividades', any(x.get('distance')==3.3 for x in runs) and any(x.get('distance')==4.4 for x in runs))
            print('7. Excluir no celular não volta pelo PC')
            await cel.evaluate("state.active='run'; const h=state.modules.run.history; const i=h.findIndex(x=>x.distance===4.4); marcaExcluido('run', h[i]); h.splice(i,1); saveData()")
            p7 = await espera(pc, "!(state.modules.run.history||[]).some(x=>x.distance===4.4)", 15000)
            await pc.wait_for_timeout(2500)
            confere('exclusão chega ao PC e não volta', p7 and not await cel.evaluate("(state.modules.run.history||[]).some(x=>x.distance===4.4)"))
            print('8. Sair e entrar de novo no PC: tudo volta')
            antes = await hist(pc)
            await pc.evaluate("doLogout()"); await pc.wait_for_timeout(800)
            await pc.evaluate("localStorage.clear()")   # nem o cache do aparelho ajuda: tem que vir da nuvem
            await pc.reload(); await pc.wait_for_function("document.querySelector('.screen.active') && document.querySelector('.screen.active').id!=='scr-auth'", timeout=40000); await pc.wait_for_timeout(1500)
            depois = await hist(pc)
            confere('depois de sair e entrar (sem cache), o PC recupera tudo', depois == antes, (antes, depois))
            confere('apelido continua', await pc.evaluate("state.user.profile.nickname") == 'Aninha')
            print('9. Aparelho novo sem internet no primeiro acesso: não pode começar uma conta vazia')
            tctx = await b.new_context(viewport={'width':390,'height':844})
            await tctx.add_init_script('window.__MOCK_USER = ' + json.dumps(dict(CEL, uid='uid-tablet')) + '; window.__mockOffline = true;')
            tab = await tctx.new_page(); await tab.goto(f'http://127.0.0.1:{PORTA}/index.html')
            await tab.wait_for_function("document.querySelector('.screen.active') && document.querySelector('.screen.active').id!=='scr-auth'", timeout=60000)
            tt = await tela(tab)
            confere('mostra "não consegui buscar seus dados" (e não o questionário)', tt == 'scr-noaccess', tt)
            await tctx.close()
            neg = [x for x in nuvem()['negados'] if x[1].startswith(('usuarios', 'contas'))]
            confere('nenhuma operação do app negada pelas regras simuladas', not neg, neg[:5])
            confere('sem erros de página', not (cel.erros + pc.erros), (cel.erros + pc.erros)[:3])
            await b.close()
    finally:
        srv.terminate(); shutil.rmtree(site, ignore_errors=True)
    print(f'\n{ok} verificações aprovadas, {len(falhas)} reprovadas.')
    sys.exit(1 if falhas else 0)
asyncio.run(main())

#!/usr/bin/env python3
"""Beta 36: acabamento visual em todos os temas e larguras — fundos decorativos (sem cobrir cartões),
cena do Início (sol/lua visíveis e fora do texto), paletas iguais em qualquer lugar, contraste do botão do
assistente, seleção de texto, rolagem (sem ouvintes que travam, posição mantida ao abrir/fechar janelas).
Uso: python3 testes/acabamento.py http://localhost:8765/index.html"""
import asyncio, sys, json
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
TEMAS = ['zepp','aurora','classico','oceano','claro','amoled','rubi','areia']
COM_DESENHO = {'sessions':'#sess-qlinks','library':'#lib-count','plan':'#plan-title','challenges':'#chal-root','profile':'.card-info','history':'.stat-grid','perf':'#perf-resumo'}
ok = falhou = 0
def confere(nome, cond, info=''):
    global ok, falhou
    if cond: ok += 1; print('  ✅', nome)
    else: falhou += 1; print('  ❌', nome, str(info)[:300])
LUM = """const _lum = c => { const m = String(c).match(/rgba?\\(([^)]+)\\)/); if(!m) return null; const p = m[1].split(',').map(parseFloat); const f = v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }; return 0.2126*f(p[0])+0.7152*f(p[1])+0.0722*f(p[2]); };
const _cr = (a,b) => { const x=_lum(a), y=_lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); };"""
async def abre(b, w):
    pg = await b.new_page(viewport={'width':w,'height':844}); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    await pg.goto(URL); await pg.wait_for_function("document.querySelector('.screen.active') && document.querySelector('.screen.active').id==='scr-quiz'", timeout=15000)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500); await pg.evaluate("try{closeAwards()}catch(e){}; try{closeModal()}catch(e){}")
    return pg, erros
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for largura in [360, 390, 430]:
            pg, erros = await abre(b, largura)
            print(f'\n=== {largura} px ===')
            probs_deco, probs_cena, probs_larg = [], [], []
            for t in TEMAS:
                await pg.evaluate(f"applyTheme('{t}')")
                for aba in ['home','sessions','library','plan','challenges','perf','history','profile']:
                    await pg.evaluate(f"goTab('{aba}'); window.scrollTo(0,0)"); await pg.wait_for_timeout(330)
                    r = await pg.evaluate("""(sel)=>{ const d=document.getElementById('app-deco'); const cs=getComputedStyle(d); const rd=d.getBoundingClientRect();
                        const vis = cs.display!=='none' && rd.height>20 && d.innerHTML.length>0;
                        const f = sel ? document.querySelector('.screen.active '+sel) : null; const rf = f ? f.getBoundingClientRect() : null;
                        return { vis, bottom: rd.bottom, top: rd.top, fTop: rf ? rf.top : null, larg: document.documentElement.scrollWidth - innerWidth }; }""", COM_DESENHO.get(aba))
                    if r['larg'] > 0: probs_larg.append(f'{t}/{aba}: +{r["larg"]}px')
                    if aba in COM_DESENHO:
                        if not r['vis']: probs_deco.append(f'{t}/{aba}: desenho não aparece')
                        elif r['fTop'] is not None and r['bottom'] > r['fTop'] + 1: probs_deco.append(f'{t}/{aba}: desenho passa do topo do conteúdo ({r["bottom"]:.0f} > {r["fTop"]:.0f})')
                    elif False and r['vis']: probs_deco.append(f'{t}/{aba}: deveria estar sem desenho')
                    if aba == 'home':
                        for code in [0, 2, 63, 95]:
                            g = await pg.evaluate(f"""(()=>{{ weatherData={{v:2,temp:30,code:{code},at:Date.now()}}; climaChip(); const br=document.getElementById('home-brand-row');
                                const nome=[...br.children].find(e=>!e.classList.contains('brand-logo')&&!e.classList.contains('avatar')&&e.id!=='home-clima');
                                const r=document.createRange(); r.selectNodeContents(nome); const fim=Math.max(...[...r.getClientRects()].map(x=>x.right));
                                const c=document.getElementById('home-clima'); return c ? c.getBoundingClientRect().left - fim : 99; }})()""")
                            if g < 12: probs_cena.append(f'{t}/clima {code}: chip a {g:.0f}px do nome do app')
                        await pg.evaluate("weatherData={v:2,temp:28,code:1,at:Date.now()}; climaChip()")
                        for hora in ['dia','noite','amanhecer','tarde']:
                            c = await pg.evaluate("""(hora)=>{ window._cenaHora=()=>hora; updateDeco('home');
                                const d=document.getElementById('app-deco'); const a=d.querySelector('.c-astro'); if(!a) return {sem:true};
                                const ra=a.getBoundingClientRect(); const op=+getComputedStyle(a).strokeOpacity;
                                const txt=[...document.querySelectorAll('#home-greet-row h1, #home-goal, #home-brand-row .avatar, #home-clima')].filter(e=>e.offsetHeight).map(e=>{const r=e.getBoundingClientRect(); return r;});
                                const range=document.createRange(); const sobre=[];
                                for(const el of document.querySelectorAll('#home-greet-row h1, #home-goal')){ range.selectNodeContents(el); for(const r of range.getClientRects()){ if(r.right>ra.left && r.left<ra.right && r.bottom>ra.top && r.top<ra.bottom) sobre.push(el.id||el.tagName); } }
                                for(const e of document.querySelectorAll('#home-brand-row .avatar, #home-clima')){ const r=e.getBoundingClientRect(); if(r.right>ra.left && r.left<ra.right && r.bottom>ra.top && r.top<ra.bottom) sobre.push(e.id); }
                                return { w:ra.width, op, sobre, dentro: ra.right <= innerWidth+1 && ra.left >= 0 && ra.top >= 0 }; }""", hora)
                            if c.get('sem'): probs_cena.append(f'{t}/{hora}: sem sol/lua'); continue
                            if c['w'] < 12 or c['op'] < .5: probs_cena.append(f'{t}/{hora}: astro pequeno/fraco {c}')
                            if c['sobre']: probs_cena.append(f'{t}/{hora}: astro embaixo de {c["sobre"]}')
                            if not c['dentro']: probs_cena.append(f'{t}/{hora}: astro cortado pela borda')
            confere('desenhos das abas aparecem e terminam antes do conteúdo (8 temas)', not probs_deco, probs_deco[:6])
            confere('sol/lua do Início visível, inteiro e fora de textos, foto e clima; clima nunca encosta no nome do app (8 temas)', not probs_cena, probs_cena[:6])
            confere('nenhuma tela mais larga que o celular', not probs_larg, probs_larg[:6])
            confere('sem erros de página', not erros, erros[:3])
            if largura != 390: await pg.close(); continue
            # ---------- Desafios no AMOLED ----------
            await pg.evaluate("applyTheme('amoled'); goTab('challenges'); scrollTo(0,0)"); await pg.wait_for_timeout(400)
            r = await pg.evaluate("""(()=>{ const d=document.getElementById('app-deco'); const rd=d.getBoundingClientRect(); const c=document.querySelector('#chal-root .card, #chal-root > *'); const rc=c.getBoundingClientRect();
               const fundo=d.querySelector('.d-fundo'); return { op: getComputedStyle(fundo).fillOpacity, sep: rd.bottom <= rc.top + 1, vis: getComputedStyle(d).display!=='none' }; })()""")
            confere('AMOLED: medalha dos Desafios visível e separada do cartão com a bandeira', r['vis'] and r['sep'] and float(r['op']) >= .1, r)
            # ---------- paletas ----------
            cores = {}
            for t in TEMAS:
                await pg.evaluate(f"applyTheme('{t}'); goTab('profile'); openAparencia()"); await pg.wait_for_timeout(350)
                cores[t] = await pg.evaluate("[...document.querySelectorAll('.ap-prev')].map(p=>[getComputedStyle(p).backgroundColor, ...[...p.querySelectorAll('i,b')].map(i=>getComputedStyle(i).backgroundColor), getComputedStyle(p).opacity, getComputedStyle(p).filter].join('|'))")
                await pg.evaluate("closeModal()")
            iguais = all(cores[t] == cores['zepp'] for t in TEMAS)
            confere('paletas com as mesmas cores em qualquer tema e sem filtro/opacidade', iguais and all('|1|none' in x for x in cores['zepp']), [t for t in TEMAS if cores[t] != cores['zepp']])
            esperado = await pg.evaluate("Object.keys(THEMES).length")
            confere('uma amostra por tema', len(cores['zepp']) == esperado, len(cores['zepp']))
            # pixel da amostra = cor do tema, com o tema atual escuro e claro
            pix = {}
            for t in ['zepp','claro']:
                await pg.evaluate(f"applyTheme('{t}'); openAparencia()"); await pg.wait_for_timeout(500)
                el = await pg.query_selector('.ap-prev i')
                bb = await el.bounding_box(); shot = await pg.screenshot(clip={'x':bb['x']+bb['width']/2-1,'y':bb['y']+bb['height']/2-1,'width':2,'height':2})
                from PIL import Image; import io
                pix[t] = Image.open(io.BytesIO(shot)).convert('RGB').getpixel((1,1))
                await pg.evaluate("closeModal()")
            confere('pixel da mesma amostra igual com tema escuro e claro', pix['zepp'] == pix['claro'], pix)
            # ---------- botão do assistente ----------
            ruins = []
            for t in TEMAS:
                await pg.evaluate(f"applyTheme('{t}'); goTab('home')"); await pg.wait_for_timeout(250)
                r = await pg.evaluate(LUM + """(()=>{ const f=document.getElementById('ma-fab'); const cs=getComputedStyle(f); const ic=f.querySelector('.ico svg')||f.querySelector('.ico')||f;
                    let bg = cs.backgroundColor; const m = cs.backgroundImage.match(/rgba?\\([^)]+\\)/g); if(m) bg = m[m.length-1];
                    if(!_lum(bg) && bg.includes('0, 0, 0, 0')) bg = getComputedStyle(document.body).backgroundColor;
                    const page = getComputedStyle(document.body).backgroundColor;
                    const borda = cs.borderTopColor;
                    return { ic: _cr(getComputedStyle(ic).color, bg), fundo: _cr(bg, page), borda: _cr(borda, page) }; })()""")
                if r['ic'] < 3: ruins.append(f"{t}: ícone {r['ic']:.2f}:1")
                if max(r['fundo'], r['borda']) < 1.5: ruins.append(f"{t}: botão some no fundo {r}")
            confere('botão do assistente: ícone com contraste ≥ 3:1 e botão destacado do fundo (8 temas)', not ruins, ruins)
            # ---------- seleção de texto ----------
            await pg.evaluate("applyTheme('zepp'); goTab('home'); scrollTo(0,0)"); await pg.wait_for_timeout(300)
            r = await pg.evaluate("""(()=>{ const us = s => { const e=document.querySelector(s); return e ? getComputedStyle(e).userSelect : 'ausente'; };
              return { clima: us('#home-clima'), saud: us('#home-hi'), sub: us('#home-goal'), semana: us('.week'), card: us('#home-smart'), aba: us('.tabbar .tab'), indic: us('#home-metrics'), frase: us('.quote') }; })()""")
            confere('Início: clima, saudação, semana, cartões, indicadores e abas não abrem o menu de copiar', all(v in ('none','ausente') for v in r.values()), r)
            await pg.evaluate("openAssistant()"); await pg.wait_for_timeout(500)
            r = await pg.evaluate("""(()=>({ msg: getComputedStyle(document.querySelector('#ma-thread div')).userSelect, campo: getComputedStyle(document.querySelector('#modal-inner input, #modal-inner textarea')).userSelect }))()""")
            confere('assistente: mensagens e campo continuam copiáveis', r['msg'] in ('text','auto') and r['campo'] in ('text','auto'), r)
            await pg.evaluate("closeModal(); const e=state.modules.lift.plan.workouts[0].exercises[0]; openExerciseSheet(e.name)"); await pg.wait_for_timeout(600)
            r = await pg.evaluate("(()=>{ const s=document.querySelector('.ex-sec'); return s ? getComputedStyle(s).userSelect : 'sem .ex-sec'; })()")
            confere('ficha do exercício: instruções continuam copiáveis', r in ('text','auto'), r)
            await pg.evaluate("closeModal()")
            # ---------- rolagem ----------
            cdp = await pg.context.new_cdp_session(pg)
            fontes = {}
            cdp.on('Debugger.scriptParsed', lambda e: fontes.__setitem__(e['scriptId'], e.get('url') or 'inline'))
            await cdp.send('Debugger.enable'); await pg.wait_for_timeout(300)
            ruins = []
            # só código do app (o Playwright injeta scripts próprios na página, sem endereço)
            for alvo in ['window', 'document', 'document.body', 'document.documentElement']:
                obj = await cdp.send('Runtime.evaluate', {'expression': alvo})
                ls = await cdp.send('DOMDebugger.getEventListeners', {'objectId': obj['result']['objectId']})
                for l in ls['listeners']:
                    if l['type'] in ('touchstart','touchmove','wheel','mousewheel') and not l.get('passive') and 'localhost' in fontes.get(l['scriptId'],''): ruins.append(f"{alvo}:{l['type']} ({fontes.get(l['scriptId'],'?')}:{l['lineNumber']})")
            await cdp.send('Debugger.disable'); await cdp.detach()   # o depurador ligado atrasa a rolagem da página e falseia o teste seguinte
            confere('nenhum ouvinte de toque/roda do app que trava a rolagem (não passivo) na página', not ruins, ruins)
            ob = await pg.evaluate("[getComputedStyle(document.documentElement).overscrollBehaviorY, getComputedStyle(document.body).overscrollBehaviorY, getComputedStyle(document.documentElement).scrollBehavior]")
            confere('rolagem nativa: sem puxar-para-atualizar, com efeito de fim de tela, sem rolagem "suave" forçada', ob == ['contain','contain','auto'], ob)
            perdas = []
            for aba, abrir in [('profile', "openAparencia()"), ('library', "openExerciseSheet(state.modules.lift.plan.workouts[0].exercises[0].name)"), ('history', "openHistoryEntry(state.modules[state.active].history.length-1)"), ('home', "openWeekSummary()"), ('perf', "openTrophies()")]:
                await pg.evaluate(f"goTab('{aba}')"); await pg.wait_for_timeout(350)
                await pg.mouse.move(195, 420)
                for _ in range(6): await pg.mouse.wheel(0, 120); await pg.wait_for_timeout(30)
                await pg.wait_for_timeout(300); antes = await pg.evaluate("scrollY")
                await pg.evaluate(abrir); await pg.wait_for_timeout(450); await pg.evaluate("closeModal()"); await pg.wait_for_timeout(450)
                depois = await pg.evaluate("scrollY")
                if abs(depois - antes) > 2 or antes < 50: perdas.append(f'{aba}: {antes}→{depois}')
            confere('posição da rolagem mantida ao abrir e fechar janelas (5 abas)', not perdas, perdas)
            await pg.evaluate("goTab('profile')"); await pg.wait_for_timeout(300)
            await pg.evaluate("scrollTo(0, 600)"); await pg.wait_for_timeout(200); antes = await pg.evaluate("scrollY")
            await pg.evaluate("const d=document.querySelector('details.pf-grp:not([open])'); if(d) d.open=true"); await pg.wait_for_timeout(200)
            confere('abrir um grupo do Perfil não faz a tela pular', abs(await pg.evaluate("scrollY") - antes) <= 2)
            # ---------- desligar o fundo decorativo ----------
            await pg.evaluate("goTab('home'); toggleDeco()"); await pg.wait_for_timeout(300)
            r = await pg.evaluate("[getComputedStyle(document.getElementById('app-deco')).display, getComputedStyle(document.querySelector('#home-greet-row > div:not(.avatar)')).paddingRight]")
            confere('"Fundo decorativo" desligado: nada desenhado e a saudação usa a largura toda', r == ['none','0px'], r)
            await pg.evaluate("toggleDeco()")
            confere('sem erros de página (testes extras)', not erros, erros[:3])
            await pg.close()
        await b.close()
    print(f'\n{ok} verificações aprovadas, {falhou} reprovadas.')
    sys.exit(1 if falhou else 0)
asyncio.run(main())

#!/usr/bin/env python3
"""Teste de navegador do MetaTreino com Firebase simulado (sem conta real).
Passa por todas as abas, janelas principais e os 8 temas, no celular (360 e 390 px) e no computador.
Confere: erros de console, página mais larga que a tela, texto com pouco contraste e IDs repetidos.
Uso: python3 testes/navegador.py http://localhost:8765/index.html [pasta-das-fotos]
"""
import asyncio, json, sys, os
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
FOTOS = sys.argv[2] if len(sys.argv) > 2 else None
TEMAS = ['zepp','aurora','classico','oceano','claro','amoled','rubi','areia']
ABAS = ['home','sessions','library','plan','perf','history','challenges','profile']
JANELAS = ['openTrophies()','openSomFim()','openAparencia()','openPersonalizarInicio()','openWeekSummary()','openMonthly()','openMedals()','openAgua()','openNutri()','openAssistant()',
           "openSetLog(state.modules.lift.plan.workouts[0].exercises[0].id, state.modules.lift.plan.workouts[0].exercises[0].name)",
           "openExerciseSheet(state.modules.lift.plan.workouts[0].exercises[0].name)", "openHistoryEntry(state.modules[state.active].history.length-1)"]
CONTRASTE_JS = r"""
(() => {
  const lum = c => { const m = c.match(/rgba?\(([^)]+)\)/); if(!m) return null; const p = m[1].split(',').map(x=>parseFloat(x)); const a = p.length>3 ? p[3] : 1;
    const f = v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }; return { L: 0.2126*f(p[0])+0.7152*f(p[1])+0.0722*f(p[2]), a, rgb:p.slice(0,3) }; };
  const mistura = (fg, bg) => fg.a >= 1 ? fg : { L: null, rgb: fg.rgb.map((v,i)=>v*fg.a + bg.rgb[i]*(1-fg.a)), a:1 };
  const L2 = o => { if(o.L!=null) return o.L; const f = v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }; return 0.2126*f(o.rgb[0])+0.7152*f(o.rgb[1])+0.0722*f(o.rgb[2]); };
  const fundo = el => { let e = el; const pilha = [];
    while(e && e.nodeType===1){ const cs = getComputedStyle(e); if(cs.backgroundImage && cs.backgroundImage!=='none' && !/^url/.test(cs.backgroundImage)) return null; const b = lum(cs.backgroundColor); if(b && b.a>0){ pilha.push(b); if(b.a>=0.99) break; } e = e.parentElement; }
    if(!pilha.length) return lum(getComputedStyle(document.body).backgroundColor) || { L:0, a:1, rgb:[0,0,0] };
    let base = pilha.pop(); if(base.a < 1) base = { rgb: base.rgb, a:1, L:null };
    while(pilha.length){ const c = pilha.pop(); base = { rgb: c.rgb.map((v,i)=>v*c.a + base.rgb[i]*(1-c.a)), a:1, L:null }; }
    return base; };
  const ruins = []; const vistos = new Set();
  const tela = document.querySelector('.screen.active') || document.body; const modal = document.querySelector('#modal-back.on');
  const raizes = modal ? [modal] : [tela, document.getElementById('tabbar')].filter(Boolean);
  raizes.forEach(r => r.querySelectorAll('*').forEach(el => {
    if(!el.childNodes || ![...el.childNodes].some(n=>n.nodeType===3 && n.textContent.trim().length>1)) return;
    const rc = el.getBoundingClientRect(); if(rc.width<2 || rc.height<2 || rc.bottom<0 || rc.top>innerHeight*3) return;
    const cs = getComputedStyle(el); if(cs.visibility==='hidden' || +cs.opacity < 0.35 || cs.display==='none') return;
    let op = 1, e = el; while(e && e.nodeType===1){ op *= +getComputedStyle(e).opacity; e = e.parentElement; } if(op < 0.35) return;
    const fg0 = lum(cs.color); const bg = fundo(el); if(!fg0 || !bg) return;
    const fg = mistura(fg0, bg); const a = L2(fg), b = L2(bg); const ratio = (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
    const grande = parseFloat(cs.fontSize) >= 18.5 || (parseFloat(cs.fontSize) >= 14 && +cs.fontWeight >= 700);
    const min = grande ? 3 : 4.5;
    if(ratio < min - 0.0001){ const txt = [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ').slice(0,40);
      const k = txt + '|' + el.className; if(vistos.has(k)) return; vistos.add(k);
      ruins.push({ txt, ratio: Math.round(ratio*100)/100, min, cor: cs.color, fundo: 'rgb('+bg.rgb.map(Math.round).join(',')+')', classe: String(el.className||el.tagName).slice(0,40) }); }
  }));
  return ruins.sort((x,y)=>x.ratio-y.ratio).slice(0, 12);
})()
"""
async def main():
    res = { 'erros':[], 'largura':[], 'contraste':{}, 'ids':[], 'janelas_falharam':[] }
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        for nome, vp, mobile in [('celular-360', {'width':360,'height':740}, True), ('celular-390', {'width':390,'height':844}, True), ('computador', {'width':1366,'height':800}, False)]:
            ctx = await b.new_context(viewport=vp, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile, locale='pt-BR', timezone_id='America/Sao_Paulo')
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e, n=nome: res['erros'].append(f'[{n}] {e}'))
            pg.on('console', lambda m, n=nome: res['erros'].append(f'[{n}] console.{m.type}: {m.text[:200]}') if m.type == 'error' else None)
            await pg.goto(URL); await pg.wait_for_function("document.querySelector('.screen.active') && document.querySelector('.screen.active').id==='scr-quiz'", timeout=15000)
            await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500)
            await pg.evaluate("try{closeModal()}catch(e){}; document.querySelectorAll('.sa-stage,#special-reveal').forEach(e=>e.remove())")
            for tema in (TEMAS if nome != 'celular-360' else ['zepp','claro']):
                await pg.evaluate(f"applyTheme('{tema}')"); await pg.wait_for_timeout(150)
                for mod in ['lift','run']:
                    await pg.evaluate(f"state.active='{mod}'")
                    for aba in ABAS:
                        if mod == 'run' and aba in ('library',): continue
                        await pg.evaluate(f"try{{closeModal()}}catch(e){{}}; goTab('{aba}')"); await pg.wait_for_timeout(120)
                        larg = await pg.evaluate("[document.documentElement.scrollWidth, innerWidth]")
                        if larg[0] > larg[1] + 1: res['largura'].append(f'[{nome}/{tema}/{mod}] aba {aba}: página {larg[0]}px numa tela de {larg[1]}px')
                        if tema in ('zepp','claro','areia','oceano','rubi','aurora','classico','amoled') and mod=='lift':
                            r = await pg.evaluate(CONTRASTE_JS)
                            for x in r: res['contraste'].setdefault(f'{tema}', []).append(dict(x, onde=f'{nome}/{aba}'))
                        if FOTOS and aba in ('home','sessions','profile') and nome!='celular-360' and mod=='lift':
                            await pg.screenshot(path=os.path.join(FOTOS, f'{nome}-{tema}-{aba}.png'))
                    if mod=='lift':
                        for j in JANELAS:
                            await pg.evaluate("try{closeModal()}catch(e){}; goTab('sessions')"); await pg.wait_for_timeout(80)
                            try:
                                await pg.evaluate(j); await pg.wait_for_timeout(450)   # espera a janela terminar de deslizar
                            except Exception as e:
                                res['janelas_falharam'].append(f'[{nome}/{tema}] {j}: {str(e)[:160]}'); continue
                            larg = await pg.evaluate("[document.documentElement.scrollWidth, innerWidth, (()=>{const m=document.getElementById('modal-inner'); if(!m) return 0; const r=m.getBoundingClientRect(); return Math.round(r.right)})()]")
                            if larg[0] > larg[1] + 1 or larg[2] > larg[1] + 1: res['largura'].append(f'[{nome}/{tema}] janela {j[:40]}: {larg}')
                            r = await pg.evaluate(CONTRASTE_JS)
                            for x in r: res['contraste'].setdefault(f'{tema}', []).append(dict(x, onde=f'{nome}/{j[:30]}'))
                            if FOTOS and nome=='celular-390' and tema in ('zepp','claro'):
                                await pg.screenshot(path=os.path.join(FOTOS, f'janela-{tema}-{JANELAS.index(j)}.png'))
                            await pg.evaluate("try{closeAssistant()}catch(e){}; try{closeSetLog(false)}catch(e){}; try{closeModal()}catch(e){}")
            dup = await pg.evaluate("(()=>{const c={}; document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1); return Object.keys(c).filter(k=>c[k]>1)})()")
            if dup: res['ids'].append(f'[{nome}] {dup}')
            await ctx.close()
        await b.close()
    # resumo
    print('ERROS DE CONSOLE/PÁGINA:', len(res['erros']));  [print('  ', e) for e in sorted(set(res['erros']))[:40]]
    print('PÁGINA MAIS LARGA QUE A TELA:', len(res['largura'])); [print('  ', e) for e in res['largura'][:40]]
    print('JANELAS QUE FALHARAM AO ABRIR:', len(res['janelas_falharam'])); [print('  ', e) for e in res['janelas_falharam'][:20]]
    print('IDS REPETIDOS NO DOM:', res['ids'] or 'nenhum')
    tot = sum(len(v) for v in res['contraste'].values())
    print('TEXTO COM POUCO CONTRASTE (WCAG AA):', tot)
    for tema, lst in res['contraste'].items():
        uniq = {}
        for x in lst: uniq.setdefault((x['txt'], x['classe']), x)
        print(f'  tema {tema}: {len(uniq)} ocorrências distintas')
        for x in sorted(uniq.values(), key=lambda y: y['ratio'])[:8]: print(f"     {x['ratio']}:1 (mín {x['min']}) «{x['txt']}» cor {x['cor']} sobre {x['fundo']} [{x['classe']}] em {x['onde']}")
    json.dump(res, open('/tmp/resultado-navegador.json','w'), ensure_ascii=False, indent=1)
asyncio.run(main())

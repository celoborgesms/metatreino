# 2027 RC 5 — testes automatizados das correções pequenas (Firebase simulado, Chromium sem tela, relógio controlado).
# 1. Horário (sono e demais campos de hora): régua de minutos de 1 em 1 e digitação sem ":" (11.52, 1152, 11,52, 11h52).
# 2. Compartilhar: em todos os formatos e disposições, nenhum texto do bloco sobe por cima da logo / cabeçalho.
# 3. Conquistas: medalha do mês / marco / desafio concluído abrem a própria tela (não somem ao tocar).
# 4. Clima: a cena do Início é redesenhada assim que o clima chega (sem precisar trocar de aba).
# 5. Início: Atividade da semana em anéis, sem a linha duplicada Musculação/Corrida.
# Uso: python3 testes/rc5.py [URL]
import asyncio, sys, importlib.util, os
# reaproveita os auxiliares do rc4.py (planos, séries, abrir página), sem rodar os testes dele
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rc4.py'), encoding='utf-8').read()
_ns = {'__name__': 'rc4_aux'}; argv0 = sys.argv[:]; sys.argv = sys.argv[:2]; exec(compile(_src[:_src.index('async def vai(')], 'rc4.py', 'exec'), _ns); sys.argv = argv0
class _R: pass
rc4 = _R(); rc4.__dict__.update(_ns)
from playwright.async_api import async_playwright
ts, SEG, PLANOS, SERIES, SALVA, pagina = rc4.ts, rc4.SEG, rc4.PLANOS, rc4.SERIES, rc4.SALVA, rc4.pagina
ok = fal = 0
def confere(n, c, d=''):
    global ok, fal
    if c: ok += 1; print('  ✅', n)
    else: fal += 1; print('  ❌', n, str(d)[:700])

async def horario(b):
    print('1. Horário: qualquer minuto, arrastando ou digitando')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'hora1', tempo=ts(2026,11,27,9))
    await pg.evaluate("sonoRegistrar()"); await pg.clock.run_for(200)
    r = await pg.evaluate("""(()=>{ nrAbrir(document.getElementById('sono-aco')); const f = document.getElementById('nr-fundo');
      const tit = f.querySelector('.nr-tit, h3, .nr-titulo'); const reg = NR.reguas.map(x=>x.el.getAttribute('aria-label')||'');
      return { tit: f.innerText.slice(0, 80), n: NR.reguas.length }; })()""")
    confere('seletor abre com o nome do campo (não "Valor")', 'ACORDEI' in r['tit'].upper() and 'VALOR' not in r['tit'].upper(), r)
    # arrastar: a régua de minutos tem 60 posições (0..59)
    r = await pg.evaluate("""(()=>{ const rg = NR.reguas[1]; const rot = [...rg.el.querySelectorAll('.nr-r')].map(x=>x.textContent); rg.definir ? rg.definir(52) : null; return { rot: rot.slice(0, 4), ultimo: rot[rot.length-1], val: NR.val }; })()""")
    confere('régua de minutos de 1 em 1 (00 a 59, rótulos de 5 em 5)', r['rot'][:3] == ['00','05','10'] and r['ultimo'] == '55', r)
    casos = [('11.52','11:52'), ('1152','11:52'), ('11,52','11:52'), ('11h52','11:52'), ('6:07','06:07'), ('0631','06:31'), ('7','07:00'), ('25.10',None), ('11.75',None)]
    falhas = []
    for txt, esperado in casos:
        v = await pg.evaluate("(t)=>{ nrDigitar(); const i = document.getElementById('nr-dig-in'); i.value = t; return nrDigitado(true) ? NR.val : null; }", txt)
        if v != esperado: falhas.append((txt, v, esperado))
    confere('digitação aceita 11.52 / 1152 / 11,52 / 11h52 / 6:07 e recusa hora ou minuto inválido', not falhas, falhas)
    r = await pg.evaluate("""(()=>{ const i = document.getElementById('nr-dig-in'); i.value = '11.52'; nrDigitado(true); nrConfirmar(); return document.getElementById('sono-aco').value; })()""")
    confere('confirmar grava 11:52 no campo', r == '11:52', r)
    r = await pg.evaluate("""(()=>{ nrAbrir(document.getElementById('sono-dor')); const i = document.getElementById('nr-dig-in'); nrDigitar(); i.value = '2337'; nrDigitado(true); nrConfirmar(); _sonoTotal(); return document.getElementById('sono-total').innerText; })()""")
    confere('total do sono com minutos quebrados (23:37 → 11:52 = 12 h 15)', '12 h 15' in r, r)
    # régua: valor vindo do campo não é mais arredondado para 5
    r = await pg.evaluate("""(()=>{ nrAbrir(document.getElementById('sono-aco')); const v = NR.val; nrFechar(); return v; })()""")
    confere('reabrir o seletor mantém 11:52 (antes arredondava para 11:50)', r == '11:52', r)
    confere('sem erros de página', not err, err[:2])
    await ctx.close()

async def compartilhar(b):
    print('2. Compartilhar: nada por cima da logo em nenhum formato')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'mts1', tempo=ts(2026,11,26,20))
    P = await pg.evaluate(PLANOS + "(%d)" % ts(2026,11,2,8))
    kA = P['lift'][0][0]
    await pg.evaluate(SERIES + "('%s',[20,25],[0,1])" % kA); await pg.evaluate(SALVA + "('%s', 6)" % kA)
    await pg.evaluate("""(()=>{ const H = state.modules.run.history; const d = 86400000;
      H.push({ id:'c1', name:'Caminhada', at: Date.now()-2*d, duration:79, distance:6.1, module:'run', activity:'caminhada' });
      H.push({ id:'c2', name:'Caminhada', at: Date.now()-1*d, duration:63, distance:5.4, module:'run', activity:'caminhada' });
      H.push({ id:'c3', name:'Bike', at: Date.now()-3*d, duration:40, distance:12, module:'run', activity:'bike' }); saveData(); })()""")
    r = await pg.evaluate("""(async()=>{
      const casos = []; const fontes = { semana: mtsDeSemana(), treino: mtsDeHistorico(state.modules.lift.history.slice(-1)[0]) };
      for(const [nome, d] of Object.entries(fontes)) for(const fmt of ['story','feed','quadrado']) for(const disp of ['destaque','grade','compacto']) for(const nomeOn of [false, true]){
        const cv = document.createElement('canvas'); const ctx = cv.getContext('2d'); const textos = []; const ft = ctx.fillText.bind(ctx);
        ctx.fillText = function(t, x, y){ const m = ctx.getTransform(); textos.push({ t: String(t), y: m.d*y + m.f, sz: parseFloat((ctx.font.match(/(\\d+(?:\\.\\d+)?)px/)||[])[1]) * m.d }); return ft(t, x, y); };
        await mtsDesenhar(cv, d, { fmt, estilo:'escuro', disp, nome:nomeOn, logo:'m', vol:false, pos:'baixo' });
        const W = cv.width, H = cv.height; const pad = W*0.075; const cab = pad*0.9 + W*0.075;
        const cabecalho = new Set(['M','METATREINO']);
        const corpo = textos.filter(o=>!cabecalho.has(o.t) && o.t !== 'metatreino.app' && !/^\\d{1,2} de /.test(o.t));
        const topo = Math.min(...corpo.map(o=>o.y - o.sz*0.8));
        const fundo = Math.max(...corpo.map(o=>o.y));
        casos.push({ nome, fmt, disp, nomeOn, ok: topo >= cab - 1 && fundo <= H - pad*0.75, topo: Math.round(topo), cab: Math.round(cab), fundo: Math.round(fundo), H });
      }
      return casos; })()""")
    ruins = [c for c in r if not c['ok']]
    confere(f'{len(r)} combinações (semana e treino × 3 formatos × 3 disposições × com/sem nome): bloco sempre abaixo da logo e acima do rodapé', not ruins, ruins[:4])
    import base64
    for fmt, disp in (('quadrado','destaque'), ('quadrado','compacto'), ('quadrado','grade'), ('feed','destaque'), ('story','grade')):
        u = await pg.evaluate("(a)=>{ const cv = document.createElement('canvas'); return mtsDesenhar(cv, mtsDeSemana(), { fmt:a[0], estilo:'escuro', disp:a[1], nome:true, logo:'m', vol:false, pos:'baixo' }).then(c=>c.toDataURL('image/png')); }", [fmt, disp])
        open('/tmp/rc5-card-%s-%s.png' % (fmt, disp), 'wb').write(base64.b64decode(u.split(',')[1]))
    confere('sem erros de página', not err, err[:2])
    await ctx.close()

async def conquistas(b):
    print('3. Conquistas: medalha do mês abre a própria tela')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'cq1', tempo=ts(2026,11,27,15))
    await pg.evaluate("""(()=>{ const s = cqEstado(); s.conqPend = (s.conqPend||[]).concat([
        { k:'med_horas@2026-11', tid:null, kind:'medalha', emo:'⏱️', tipo:'', nome:'Horas Suadas', desc:'450 minutos de treino no mês', at: Date.now() },
        { k:'evt_x', tid:null, kind:'evento', emo:'🏁', tipo:'', nome:'Reta Final', desc:'Desafio concluído', at: Date.now() } ]); saveData(); openTrophies(); })()""")
    await pg.clock.run_for(400)
    r = await pg.evaluate("""(()=>{ const c = document.querySelector('.cq-novo[data-k="med_horas@2026-11"]'); if(!c) return { erro:'sem item' }; c.click();
      const m = document.getElementById('modal-inner'); return { txt: m.innerText, aberto: document.getElementById('modal-back').classList.contains('on'), pend: cqEstado().conqPend.some(p=>p.k==='med_horas@2026-11') }; })()""")
    confere('tocar na medalha do mês abre a tela dela (nome, tipo, descrição, data)', r.get('aberto') and 'Horas Suadas' in r.get('txt','') and ('MEDALHA DO MÊS' in r.get('txt','').upper() or 'META DO MÊS' in r.get('txt','').upper()) and '450 minutos' in r.get('txt','') and 'Conquistada em' in r.get('txt',''), r)
    confere('depois de vista, sai das novas (fica só na coleção)', r.get('pend') is False, r)
    r = await pg.evaluate("""(()=>{ [...document.querySelectorAll('#modal-inner button')].find(b=>/Voltar às conquistas/.test(b.innerText)).click();
      return { lista: !!document.querySelector('#modal-inner .cq-resumo'), outra: !!document.querySelector('.cq-novo[data-k="evt_x"]'), mesma: !!document.querySelector('.cq-novo[data-k="med_horas@2026-11"]') }; })()""")
    confere('"Voltar às conquistas" volta à lista; só a vista saiu das novas', r['lista'] and r['outra'] and not r['mesma'], r)
    r = await pg.evaluate("""(()=>{ document.querySelector('.cq-novo[data-k="evt_x"]').click(); const t = document.getElementById('modal-inner').innerText; return t; })()""")
    confere('desafio concluído também abre a sua tela, com atalho para Desafios', 'Reta Final' in r and 'Ver desafios' in r, r[:200])
    confere('sem erros de página', not err, err[:2])
    await ctx.close()

async def clima(b):
    print('4. Clima: cena do Início atualiza assim que o clima chega')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'cl1', tempo=ts(2026,11,27,14,40))
    await pg.evaluate(PLANOS + "(%d)" % ts(2026,11,2,8)); await pg.evaluate("goTab('home')"); await pg.clock.run_for(400)
    antes = await pg.evaluate("(document.getElementById('app-deco')||{dataset:{}}).dataset.cena||''")
    # a busca termina alguns segundos depois do Início aparecer (como no celular)
    await pg.evaluate("loadWeather(); setTimeout(()=>{ weatherData = { v:2, temp:32, code:3, wind:5, at: Date.now() }; }, 2500)")
    await pg.clock.run_for(4000)
    depois = await pg.evaluate("(document.getElementById('app-deco')||{dataset:{}}).dataset.cena||''")
    confere('sem trocar de aba: a cena passa a mostrar o tempo nublado em poucos segundos', 'semclima' in antes and 'nublado' in depois, (antes, depois))
    await pg.evaluate("setTimeout(()=>{ weatherData = { v:2, temp:24, code:63, wind:5, at: Date.now() }; }, 1000); loadWeather()")
    await pg.clock.run_for(2500)
    depois = await pg.evaluate("(document.getElementById('app-deco')||{dataset:{}}).dataset.cena||''")
    confere('nova busca com chuva: a cena muda de novo sem trocar de aba', 'chuva' in depois, depois)
    confere('sem erros de página', not err, err[:2])
    await ctx.close()

async def inicio(b):
    print('5. Início: anéis na Atividade da semana e um seletor só')
    for w in (360, 390, 412):
        ctx = await b.new_context(viewport={'width':w,'height':800}, locale='pt-BR', timezone_id='America/Manaus')
        pg, err = await pagina(ctx, 'in%d' % w, tempo=ts(2026,11,27,14))
        P = await pg.evaluate(PLANOS + "(%d)" % ts(2026,11,2,8))
        await pg.evaluate(SERIES + "('%s',[20,25],[0,1])" % P['lift'][0][0]); await pg.evaluate(SALVA + "('%s', 6)" % P['lift'][0][0])
        await pg.evaluate("goTab('home')"); await pg.clock.run_for(400)
        r = await pg.evaluate("""(()=>{ const q = document.getElementById('home-quick'); const c = q.querySelector('.act-card'); const r = c.getBoundingClientRect();
          return { duo: !!document.getElementById('hoje-duo'), toggles: document.querySelectorAll('#mod-toggle button, #mod-toggle .opt').length, aneis: q.querySelectorAll('.act-rings .bar').length,
            linhas: [...q.querySelectorAll('.aw-row .act-lbl')].map(x=>x.innerText.trim()), dentro: r.left >= 0 && r.right <= innerWidth + 1, semana: !!document.querySelector('#scr-home .week') }; })()""")
        confere(f'{w} px: sem linha duplicada, anéis com Treinos do plano / Séries / Semanas na meta, cabe na tela', not r['duo'] and r['aneis'] >= 2 and r['linhas'][:2] == ['Treinos do plano','Séries'] and r['dentro'], r)
        if w == 390:
            await pg.screenshot(path='/tmp/rc5-inicio-390.png', full_page=False)
            await pg.evaluate("document.getElementById('home-quick').scrollIntoView()"); await pg.screenshot(path='/tmp/rc5-semana-390.png')
        confere(f'{w} px: sem erros de página', not err, err[:2])
        await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for f in (horario, compartilhar, conquistas, clima, inicio): await f(b)
        await b.close()
    print(f'\nRC 5: {ok} ok, {fal} falha(s)')
asyncio.run(main())

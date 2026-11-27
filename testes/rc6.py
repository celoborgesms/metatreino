# 2027 RC 6 — testes automatizados (Firebase simulado, Chromium sem tela, relógio controlado).
# 1. Meta do mês nova: a tela dela mostra a medalha desenhada (antes ficava vazia).
# 2. Dia com musculação e corrida: feito um, o cartão diz o que falta (não "Agora é recuperação").
# 3. Dica "corrida + musculação hoje" logo abaixo do seletor, antes do treino de hoje.
# 4. Aniversário: bolo desenhado (sem estrelas/emoji) e 5 frases, uma por ano.
# 5. Sono no Início: histórico acessível sem registrar hoje; 7 noites ao lado quando o cartão ocupa a linha.
# Uso: python3 testes/rc6.py [URL]
import asyncio, sys, os
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'rc4.py'), encoding='utf-8').read()
_ns = {'__name__': 'rc4_aux'}; argv0 = sys.argv[:]; sys.argv = sys.argv[:2]; exec(compile(_src[:_src.index('async def vai(')], 'rc4.py', 'exec'), _ns); sys.argv = argv0
from playwright.async_api import async_playwright
ts, PLANOS, SERIES, SALVA, pagina = _ns['ts'], _ns['PLANOS'], _ns['SERIES'], _ns['SALVA'], _ns['pagina']
ok = fal = 0
def confere(n, c, d=''):
    global ok, fal
    if c: ok += 1; print('  ✅', n)
    else: fal += 1; print('  ❌', n, str(d)[:700])
SEXTA = ts(2026, 11, 27, 15)
DOIS = """(()=>{ const hj = getDayIdx(); const r = state.modules.run.plan.workouts[0]; r.dayIdx = hj; r.dayName = 'Sexta';
  const l = state.modules.lift.plan.workouts.find(w=>w.dayIdx === hj); saveData(); goTab('home'); return { lift: l && l.k, run: r.name }; })()"""

async def medalha(b):
    print('1. Meta do mês: tela com a medalha desenhada')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'md1', tempo=SEXTA)
    await pg.evaluate(PLANOS + "(%d)" % ts(2026,11,2,8))
    await pg.evaluate("(()=>{ const n = desafiosDoMes()[0].niveis[0]; const c = desafioPorId(n.id); awardQueue = [{ id:'m_'+c.id, emo:c.emo, tipo:'DESAFIO DO MÊS CONCLUÍDO', nome:c.nome, desc:c.desc, medalha:true }]; showAwards(); openTrophies(); })()")
    await pg.clock.run_for(400)
    await pg.evaluate("document.querySelector('.cq-novo').click()"); await pg.clock.run_for(1200)
    r = await pg.evaluate("""(()=>{ const b = document.querySelector('.cq-item .tr-ico .tbadge svg'); const rc = b && b.getBoundingClientRect();
      return { svg: !!b, w: b ? b.parentNode.offsetWidth : 0, h: b ? b.parentNode.offsetHeight : 0, tipo: (document.querySelector('.cq-item-tipo')||{}).innerText || '', aneis: b ? b.querySelectorAll('.tb-ring').length : 0 }; })()""")
    confere('medalha desenhada e visível (≥ 90 px), com o nível (Bronze/Prata/Ouro) no rótulo', r['svg'] and r['w'] >= 90 and r['h'] >= 90 and r['aneis'] >= 1 and 'META DO MÊS' in r['tipo'].upper() and any(n in r['tipo'].upper() for n in ('BRONZE','PRATA','OURO')), r)
    await pg.wait_for_timeout(1500); await pg.screenshot(path='/tmp/rc6-medalha.png')
    confere('sem erros de página', not err, err[:2])
    await ctx.close()

async def dois_treinos(b):
    print('2–3. Musculação e corrida no mesmo dia')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'dt1', tempo=SEXTA)
    await pg.evaluate(PLANOS + "(%d)" % ts(2026,11,2,8))
    P = await pg.evaluate(DOIS); await pg.clock.run_for(400)
    confere('plano de teste: os dois hoje', bool(P['lift']) and bool(P['run']), P)
    r = await pg.evaluate("""(()=>{ const c = document.getElementById('card-combo'); const t = document.getElementById('today-slot'); const g = document.getElementById('mod-toggle');
      return { vis: c && !c.classList.contains('hidden'), acimaHoje: c.getBoundingClientRect().top < t.getBoundingClientRect().top, abaixoSeletor: c.getBoundingClientRect().top > g.getBoundingClientRect().top }; })()""")
    confere('dica "corrida + musculação" logo abaixo do seletor, antes do treino de hoje', r['vis'] and r['acimaHoje'] and r['abaixoSeletor'], r)
    await pg.evaluate(SERIES + "('%s',[20,25],[0,1])" % P['lift']); await pg.evaluate(SALVA + "('%s', 6)" % P['lift'])
    await pg.evaluate("goTab('home')"); await pg.clock.run_for(400)
    t = await pg.evaluate("(document.getElementById('home-smart')||{}).innerText||''")
    confere('musculação feita, corrida pendente: diz que falta a corrida (sem "Agora é recuperação")', 'Ainda falta a corrida' in t and 'recuperação' not in t and 'Próxima sessão' not in t, t)
    await pg.evaluate("(()=>{ state.modules.run.history.push({ id: state.modules.run.plan.workouts[0].k || 'r1', name:'Corrida', at: Date.now()-60000, duration:30, distance:5, module:'run', activity:'corrida' }); saveData(); goTab('home'); })()"); await pg.clock.run_for(400)
    t = await pg.evaluate("(document.getElementById('home-smart')||{}).innerText||''")
    confere('os dois feitos: agora sim, "Feito por hoje"', ('Feito por hoje' in t or 'dias seguidos' in t) and 'Ainda falta' not in t, t)
    confere('sem erros de página', not err, err[:2])
    await ctx.close()

async def aniversario(b):
    print('4. Aniversário: bolo desenhado e frase por ano')
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'an1', tempo=SEXTA)
    await pg.evaluate(PLANOS + "(%d)" % ts(2026,11,2,8))
    await pg.evaluate("state.user.profile.birth = '1996-11-27'; saveData(); goTab('home')"); await pg.clock.run_for(400)
    r = await pg.evaluate("""(()=>{ const c = document.getElementById('card-birthday'); return { vis: !c.classList.contains('hidden'), bolo: !!c.querySelector('.bday-bolo svg'),
      estrelas: c.querySelectorAll('[data-i="star"], .ico').length, txt: c.innerText }; })()""")
    import re
    emoji = re.findall(r'[\U0001F300-\U0001FAFF☀-➿]', r['txt'])
    confere('cartão com o bolo desenhado, sem estrelas e sem emoji no texto', r['vis'] and r['bolo'] and r['estrelas'] == 0 and not emoji, r)
    frases = await pg.evaluate("[0,1,2,3,4].map(i=>BDAY_FRASES_COM[i]('3 treinos registrados')).concat([0,1,2,3,4].map(i=>BDAY_FRASES_SEM[i]()))")
    confere('5 frases diferentes com treinos e 5 sem treinos, nenhuma infantil (sem emoji)', len(set(frases[:5])) == 5 and len(set(frases[5:])) == 5 and not any(re.search(r'[\U0001F300-\U0001FAFF]', f) for f in frases), frases[:2])
    confere('sem erros de página', not err, err[:2])
    await ctx.close()

async def sono(b):
    print('5. Sono no Início')
    for w in (360, 412):
        ctx = await b.new_context(viewport={'width':w,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
        pg, err = await pagina(ctx, 'so%d' % w, tempo=SEXTA)
        await pg.evaluate(PLANOS + "(%d)" % ts(2026,11,2,8))
        await pg.evaluate("""(()=>{ state.sono = state.sono || {}; state.sono.n = state.sono.n || {};
          for(let i=1;i<=5;i++){ const dk = chaveDia(new Date(Date.now()-i*86400000)); state.sono.n[dk] = { min: 380 + i*7, h:(380+i*7)/60, q5: 1 + (i % 5) }; }
          saveData(); goTab('home'); })()"""); await pg.clock.run_for(400)
        r = await pg.evaluate("""(()=>{ const t = document.querySelector('#home-metrics .met-sono'); const rc = t.getBoundingClientRect(); const m = t.querySelector('.sm7');
          return { on: t.getAttribute('onclick'), txt: t.innerText, full: t.classList.contains('met-full'), mini: m ? getComputedStyle(m).display : 'none', barras: t.querySelectorAll('.sm7 i').length,
            dentro: rc.right <= innerWidth + 1 && rc.left >= -1 }; })()""")
        confere(f'{w} px: sem a noite de hoje, o atalho abre o histórico e mostra a média', r['on'] == 'openSono()' and 'média 7 dias' in r['txt'] and 'registrar' in r['txt'], r)
        if r['full']:
            confere(f'{w} px: ocupando a linha inteira, mostra as 7 noites ao lado (5 com registro), sem vazar', r['mini'] == 'flex' and r['barras'] == 5 and r['dentro'], r)
        else:
            confere(f'{w} px: em meia linha, sem o gráfico (não aperta o cartão)', r['mini'] == 'none' and r['dentro'], r)
        # força o caso de linha inteira (só Sono e Peso visíveis + Alimentação oculta é o caso comum: 3 indicadores)
        await pg.evaluate("document.querySelector('#home-metrics .met-sono').scrollIntoView()"); await pg.screenshot(path='/tmp/rc6-sono-%d.png' % w)
        t = await pg.evaluate("openSono(); document.getElementById('modal-inner').innerText")
        confere(f'{w} px: o histórico lista as noites anteriores e oferece registrar a de hoje', 'REGISTRAR A NOITE DE HOJE' in t.upper() and 'ÚLTIMAS NOITES' in t.upper() and 'Opcional. Se ligar' not in t, t[:200])
        if w == 360:
            r = await pg.evaluate("""(()=>{ const out = {};
              // nuvem com noites que este aparelho não tem (dados do navegador limpos)
              let base = { sono:{ n:{} } }, outra = { sono:{ on:true, n:{ '2026-11-20':{ min:400, em:1 }, '2026-11-21':{ min:410, em:1 } } } };
              mesclaEstado(base, outra); out.vieram = Object.keys(base.sono.n).length; out.on = base.sono.on;
              // noite editada nos dois: vale a gravada por último
              base = { sono:{ n:{ '2026-11-20':{ min:300, em:5 } } } }; outra = { sono:{ n:{ '2026-11-20':{ min:400, em:9 } } } };
              mesclaEstado(base, outra); out.editada = base.sono.n['2026-11-20'].min;
              // noite apagada aqui não volta da cópia antiga
              base = { sono:{ n:{}, apagadas:{ '2026-11-20': 10 } } }; outra = { sono:{ n:{ '2026-11-20':{ min:400, em:5 } } } };
              mesclaEstado(base, outra); out.apagada = !!base.sono.n['2026-11-20'];
              return out; })()""")
            confere('sono na junção das cópias: noites da nuvem entram, edição mais nova vale, apagada não volta', r == {'vieram': 2, 'on': True, 'editada': 400, 'apagada': False}, r)
        confere(f'{w} px: sem erros de página', not err, err[:2])
        await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for f in (medalha, dois_treinos, aniversario, sono): await f(b)
        await b.close()
    print(f'\nRC 6: {ok} ok, {fal} falha(s)')
asyncio.run(main())

# 2027 RC 7 — testes automatizados (Firebase simulado, Chromium sem tela, relógio controlado).
# 1. Personalizar início: sem a opção "Desafio temático" (o bloco não existe mais no Início).
# 2. Desempenho: o desenho de fundo termina antes do primeiro bloco (não invade as Metas).
# 3. Painel: desafio criado pode ser apagado; personalização apagada devolve o automático; artes com nome.
# 4. Início: sem "Ocultar" na Atividade da semana e sem a seta em Seus treinos; tudo aberto, mesmo para quem tinha recolhido.
# Uso: python3 testes/rc7.py [URL]
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
HOJE = ts(2026, 11, 27, 17)

async def tudo(b):
    ctx = await b.new_context(viewport={'width':390,'height':844}, locale='pt-BR', timezone_id='America/Manaus')
    pg, err = await pagina(ctx, 'r7', tempo=HOJE)
    P = await pg.evaluate(PLANOS + "(%d)" % ts(2026,11,2,8))
    await pg.evaluate(SERIES + "('%s',[20,25],[0,1])" % P['lift'][0][0]); await pg.evaluate(SALVA + "('%s', 6)" % P['lift'][0][0])

    print('1. Personalizar início')
    t = await pg.evaluate("openPersonalizarInicio ? openPersonalizarInicio() : null; document.getElementById('modal-inner').innerText")
    confere('sem "Desafio temático" na lista; "Desafio do mês" continua', 'Desafio temático' not in t and 'Desafio do mês' in t, t[:300])
    await pg.evaluate("closeModal()")

    print('2. Desempenho: desenho de fundo')
    falhas = []
    for w in (360, 390, 412):
        await pg.set_viewport_size({'width': w, 'height': 844})
        await pg.evaluate("goTab('perf'); window.scrollTo(0,0)"); await pg.clock.run_for(600); await pg.wait_for_timeout(300)
        r = await pg.evaluate("""(()=>{ const el = document.getElementById('app-deco'); const cs = getComputedStyle(el);
          const top = parseFloat(el.style.getPropertyValue('--deco-top')), h = parseFloat(el.style.getPropertyValue('--deco-h'));
          const w = document.querySelector('#scr-perf .wrap'); const t = w.querySelector('h1').getBoundingClientRect().bottom;
          const primeiro = [...w.children].filter(e=>e.offsetHeight > 40 && !e.contains(w.querySelector('h1')) && !e.classList.contains('seg-nav') && e.getBoundingClientRect().top >= t - 1).sort((a,b)=>a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
          return { fim: top + h, bloco: primeiro.getBoundingClientRect().top + scrollY, id: primeiro.id || primeiro.className, tem: !!el.innerHTML }; })()""")
        if not (r['tem'] and r['fim'] <= r['bloco'] + 1): falhas.append((w, r))
    confere('360/390/412 px: a faixa do desenho termina antes do primeiro bloco do Desempenho', not falhas, falhas)
    await pg.set_viewport_size({'width': 390, 'height': 844})

    print('3. Painel: apagar desafio')
    await pg.evaluate("window.mtAdmin = ()=>true; window.mtPrincipal = ()=>true")
    await pg.evaluate("""db.collection('desafiosTematicos').doc('dteste').set({ nome:'Teste Beta', descricao:'', inicio:'2026-11-27', fim:'2026-11-30', arte:'natal', fator:1, missoes:[], ativo:true, substitui:'' })""")
    await pg.evaluate("openAdminEventos()"); await pg.clock.run_for(400)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('lista explica Criar, Personalizar e Participação', 'Personalizar' in t and 'o original volta' in t, t[:300])
    await pg.evaluate("openAdminEventoForm('adm-dteste')"); await pg.clock.run_for(300)
    r = await pg.evaluate("""({ txt: document.getElementById('modal-inner').innerText, arte: document.querySelector('#ef-arte option:checked').textContent, prev: !!document.querySelector('#ef-arte-prev svg') })""")
    confere('editar: botão "Apagar desafio", arte com nome legível e prévia da medalha', 'Apagar desafio' in r['txt'] and r['arte'].startswith('Natal') and r['prev'], {'arte': r['arte'], 'prev': r['prev']})
    await pg.evaluate("[...document.querySelectorAll('#modal-inner button')].find(b=>/Apagar desafio/.test(b.innerText)).click()"); await pg.clock.run_for(200)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('pede confirmação, dizendo que quem concluiu mantém a medalha', 'mantém a medalha' in t, t[:200])
    await pg.evaluate("document.getElementById('appconfirm-ok').click()"); await pg.clock.run_for(800); await pg.wait_for_timeout(300)
    r = await pg.evaluate("(async()=>{ const d = await db.collection('desafiosTematicos').doc('dteste').get(); return { existe: d.exists, txt: document.getElementById('modal-inner').innerText }; })()")
    confere('apagado no banco e some da lista', not r['existe'] and 'Teste Beta' not in r['txt'], r['txt'][:200])
    # personalização de um automático
    key = await pg.evaluate("eventosDoAno(2026).find(e=>e.arte==='natal').key")
    await pg.evaluate("(k)=>db.collection('desafiosTematicos').doc('dpers').set({ nome:'Natal Personalizado', descricao:'', inicio:'2026-12-01', fim:'2026-12-31', arte:'natal', fator:1, missoes:[], ativo:true, substitui:k })", key)
    await pg.evaluate("openAdminEventos()"); await pg.clock.run_for(400)
    await pg.evaluate("openAdminEventoForm('adm-dpers')"); await pg.clock.run_for(300)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('personalização: o botão diz que o automático volta', 'volta o automático' in t, t[-300:])
    await pg.evaluate("[...document.querySelectorAll('#modal-inner button')].find(b=>/Apagar a personaliza/.test(b.innerText)).click()"); await pg.clock.run_for(200)
    await pg.evaluate("document.getElementById('appconfirm-ok').click()"); await pg.clock.run_for(800); await pg.wait_for_timeout(300)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('depois de apagar, o automático do calendário volta à lista', 'Natal Personalizado' not in t and 'Natal em Movimento' in t, t[:400])
    await pg.evaluate("closeModal()")

    print('4. Início sem botões de recolher')
    await pg.evaluate("localStorage.setItem('mt_col_semana','0'); localStorage.setItem('mt_col_treinos','0'); goTab('home')"); await pg.clock.run_for(400)
    r = await pg.evaluate("""(()=>{ const q = document.getElementById('home-quick-body'); const l = document.getElementById('your-list'); const res = document.getElementById('home-tr-resumo');
      return { botoes: document.querySelectorAll('#scr-home .col-txt, #scr-home .col-chev, #scr-home .col-btn').length, ativ: !!q && getComputedStyle(q).display !== 'none',
        lista: !!l && getComputedStyle(l).display !== 'none' && l.children.length > 0, resumo: !res || getComputedStyle(res).display === 'none' }; })()""")
    confere('sem "Ocultar" e sem seta; Atividade da semana e Seus treinos abertos (mesmo quem tinha recolhido)', r['botoes'] == 0 and r['ativ'] and r['lista'] and r['resumo'], r)
    await pg.screenshot(path='/tmp/rc7-inicio.png', full_page=True)
    await pg.evaluate("goTab('perf'); window.scrollTo(0,0)"); await pg.clock.run_for(600); await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/rc7-perf.png')
    confere('sem erros de página', not err, err[:2])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        await tudo(b)
        await b.close()
    print(f'\nRC 7: {ok} ok, {fal} falha(s)')
asyncio.run(main())

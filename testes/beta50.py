#!/usr/bin/env python3
"""Beta 50 — Anatomia muscular como consulta, orientações do treino geradas pelo treino do dia e
ilustrações anatômicas (masculina, feminina e neutra; frente e costas).
Uso: python3 testes/beta50.py URL_DO_APP [pasta_para_prints]"""
import asyncio, sys, os
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
OK = [0]; FALHA = []
def confere(nome, cond, extra=None):
    if cond: OK[0] += 1; print('  ✅', nome)
    else: FALHA.append(nome); print('  ❌', nome, extra if extra is not None else '')

async def nova(b, uid, w=390, h=844):
    ctx = await b.new_context(viewport={'width':w,'height':h}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Sao_Paulo')
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    await pg.add_init_script(f"window.__MOCK_USER = {{uid:'{uid}', email:'{uid}@example.com', displayName:'Teste', emailVerified:true}};")
    await pg.goto(URL); await pg.wait_for_timeout(2000)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
    await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); state.active='lift'; 0")
    return ctx, pg, erros

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, pg, erros = await nova(b, 'u50')
        print('1. Localização: Treinos sem mapa fixo; orientações compactas')
        await pg.evaluate("goTab('sessions')"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("""(()=>{ const s = document.getElementById('session-detail-slot'); const g = document.getElementById('mg-card');
          const ex = s.querySelector('.block'); return { svg: !!s.querySelector('.mm-svg'), g: !!g, antes: !!(g && ex && (g.compareDocumentPosition(ex) & 4)), alt: g ? Math.round(g.getBoundingClientRect().height) : 0,
          nomes: g ? [...g.querySelectorAll('.mg-f b')].map(x=>x.textContent) : [], link: !!(g && g.querySelector('.mg-mapa')) }; })()""")
        confere('o mapa não aparece mais automaticamente na aba Treinos', not r['svg'], r)
        confere('cartão "Orientações do treino" antes dos exercícios, compacto (< 190 px)', r['g'] and r['antes'] and r['alt'] < 190, r)
        confere('nomes: Preparação, Sessão de treino, Finalização', r['nomes'] == ['Preparação', 'Sessão de treino', 'Finalização'], r['nomes'])
        confere('link discreto "Ver músculos trabalhados"', r['link'])
        print('2. Orientações geradas pelo treino do dia')
        g = await pg.evaluate("""state.modules.lift.plan.workouts.map(w=>{ const g = mmGuia(w); return { nome:w.name, parts:(w.parts||[]).join(' '), prep:g.prep.join(' '), sessao:g.sessao.join(' '), fim:g.fim.join(' '), n:w.exercises.length, primeiro:w.exercises[0].name }; })""")
        peito = next(x for x in g if 'Peito' in x['parts']); perna = next(x for x in g if 'Pernas' in x['parts'])
        confere('peito: preparação de ombros/peito, sem glúteo nem tornozelo', 'ombros' in peito['prep'] and 'glúte' not in peito['prep'] and 'tornozelo' not in peito['prep'], peito['prep'])
        confere('pernas: preparação de quadril/tornozelos', 'quadril' in perna['prep'] and 'tornozelos' in perna['prep'], perna['prep'])
        confere('as orientações mudam entre os treinos', len({x['prep'] for x in g}) >= 2 and len({x['sessao'] for x in g}) == len(g))
        confere('sessão: tempo, quantidade, ordem, foco, registro e intervalos', all(f"{x['n']} exercício" in x['sessao'] and x['primeiro'] in x['sessao'] and 'Foco em' in x['sessao'] and 'intervalos' in x['sessao'] and 'registre' in x['sessao'] and 'min' in x['sessao'] for x in g))
        confere('séries de aquecimento separadas: não são registradas nem entram na evolução', all('não são registradas' in x['prep'] or 'peso do corpo' in x['prep'] for x in g))
        confere('finalização simples, alongamento opcional ("se quiser", "sem forçar")', all('Se quiser' in x['fim'] and 'sem forçar' in x['fim'] for x in g))
        confere('textos curtos (preparação ≤ 360 caracteres, sessão ≤ 360, finalização ≤ 220)', all(len(x['prep']) <= 360 and len(x['sessao']) <= 360 and len(x['fim']) <= 220 for x in g), [(len(x['prep']), len(x['sessao']), len(x['fim'])) for x in g])
        # treino só com peso do corpo
        r = await pg.evaluate("""(()=>{ const w = { name:'Casa', duration:30, exercises:[ {name:'Flexão de Braço', part:'Peito', sub:'Peito', rest:'60s', sets:3}, {name:'Prancha', part:'Core', sub:'Core', rest:'45s', sets:3} ] }; return mmGuia(w).prep.join(' '); })()""")
        confere('treino com peso do corpo: sem séries extras obrigatórias', 'peso do corpo' in r and 'séries leves' not in r, r)
        await pg.evaluate("mmGuiaFase('prep')"); await pg.wait_for_timeout(150)
        confere('tocar na etapa abre o texto; tocar de novo fecha', await pg.evaluate("!document.getElementById('mg-txt').hidden") and await pg.evaluate("mmGuiaFase('prep'); document.getElementById('mg-txt').hidden"))
        print('3. Registro de séries não mudou (aquecimento fica fora)')
        r = await pg.evaluate("""(()=>{ const w = currentSelectedWorkout(state.modules.lift); const e = w.exercises[0]; const id = e.id || slug(e.name); const antes = JSON.stringify(state.progress[id]||[]); mmGuia(w); mmAbrir({modo:'hoje'}); closeModal(); return antes === JSON.stringify(state.progress[id]||[]); })()""")
        confere('abrir orientações e mapa não grava nada no progresso de carga', r)
        print('4. Mapa: um corpo por vez, pelo sexo do perfil; frente e costas')
        for sexo, rot in [('m', 'masculino'), ('f', 'feminino'), ('', None)]:
            r = await pg.evaluate(f"""(()=>{{ state.user.profile.sex = '{sexo}'; mmAbrir({{modo:'hoje'}}); const n = document.querySelectorAll('#mm-palco .mm-svg').length; const lab = document.querySelector('#mm-palco .mm-svg').getAttribute('aria-label');
              mmVista('costas'); const lab2 = document.querySelector('#mm-palco .mm-svg').getAttribute('aria-label'); const cab = document.querySelectorAll('#mm-palco .mm-cab').length; closeModal(); return {{ n, lab, lab2, cab }}; }})()""")
            confere(f'perfil "{sexo or "sem sexo"}": um corpo só, {"versão " + rot if rot else "versão neutra"}, frente e costas', r['n'] == 1 and (rot is None or rot in r['lab']) and 'de frente' in r['lab'] and 'de costas' in r['lab2'] and (r['cab'] > 0) == (sexo == 'f'), r)
        r = await pg.evaluate("""(()=>{ const a = mmCorpoSVG('frente','m'), b = mmCorpoSVG('frente','f'), c = mmCorpoSVG('frente', null), d = mmCorpoSVG('costas','m');
          const vb = s=>s.match(/viewBox="([^"]+)"/)[1]; return { dif: a !== b && a !== c && b !== c, vb: new Set([a,b,c,d].map(vb)).size === 1 }; })()""")
        confere('masculino, feminino e neutro são desenhos diferentes, com o mesmo enquadramento', r['dif'] and r['vb'], r)
        r = await pg.evaluate("""(()=>{ const pesos = [50, 120]; const out = pesos.map(p=>{ state.user.profile.weight = p; state.user.profile.height = 170; return mmCorpoSVG('frente','m'); }); return out[0] === out[1]; })()""")
        confere('o corpo não muda com peso e altura', r)
        print('5. Seleção e ficha do músculo')
        await pg.evaluate("state.user.profile.sex='m'; mmAbrir({modo:'hoje'})"); await pg.wait_for_timeout(200)
        r = await pg.evaluate("""(()=>{ const el = [...document.querySelectorAll('#mm-palco .mm-m.prim')][0]; const k = el.dataset.m; const bb = el.getBoundingClientRect();
          el.dispatchEvent(new MouseEvent('click', { bubbles:true, clientX: bb.x + bb.width/2, clientY: bb.y + bb.height/2 }));
          const f = document.getElementById('mm-ficha'); return { k, aberta: !f.hidden, txt: f.textContent, sel: document.querySelectorAll('#mm-palco .mm-m.sel').length }; })()""")
        confere('tocar num músculo destaca a região e abre a ficha', r['aberta'] and r['sel'] >= 1, r['k'])
        confere('ficha: nome, localização, função, movimentos, exercícios do MetaTreino e papel', all(x in r['txt'] for x in ['Localização', 'Função', 'Movimentos', 'Exercícios do MetaTreino', 'Como principal']) and ('Principal' in r['txt']), r['txt'][:300])
        r = await pg.evaluate("""(()=>{ const s = document.querySelector('#mm-palco .mm-m'); const bb = document.querySelector('#mm-palco .mm-svg').getBoundingClientRect();
          // toque numa costura (borda entre músculos): ainda seleciona o mais próximo
          mmSel(null); const el = document.querySelector('#mm-palco .mm-m[data-m="peito"]') ? 'peito' : null; const p = document.querySelector('#mm-palco .mm-m[data-m="abdomen"]').getBoundingClientRect();
          document.getElementById('mm-palco').dispatchEvent(new MouseEvent('click', { bubbles:true, clientX: p.x + p.width + 1.5, clientY: p.y + p.height/2 }));
          return !!document.querySelector('#mm-palco .mm-m.sel'); })()""")
        confere('toque na costura entre dois músculos ainda seleciona (área de toque ampliada)', r)
        r = await pg.evaluate("""(()=>{ mmModo('livre'); mmVista('frente'); mmSel('posteriores'); const v = document.querySelector('#mm-palco .mm-svg').getAttribute('aria-label'); return v; })()""")
        confere('escolher um músculo da outra vista pela lista troca para essa vista (Explorar; no treino, só os do treino — Beta 58)', 'de costas' in r, r)
        r = await pg.evaluate("""(()=>{ mmModo('semana'); const a = document.querySelectorAll('#mm-chips .mm-chip').length; mmModo('livre'); const b = document.querySelectorAll('#mm-chips .mm-chip').length; return [a, b, Object.keys(MM_INFO).length]; })()""")
        confere('"Últimos 7 dias" e "Explorar" (todos os músculos)', r[0] > 0 and r[1] == r[2], r)
        await pg.evaluate("closeModal()")
        print('6. Principal, secundário e estabilizador pela biblioteca de exercícios')
        r = await pg.evaluate("""(()=>{ const K={peito:/peitora/,deltoide:/deltoide|ombro/,trapezio:/trapezio/,costas:/romboide|infraespinal|trapezio|costas|redondo/,dorsal:/dorsal|latissimo/,lombar:/lombar|eretor/,biceps:/biceps/,triceps:/triceps/,antebraco:/antebraco|braquiorradial|flexores|punho/,abdomen:/abdom|reto|core/,obliquos:/obliquo/,serratil:/serratil/,gluteos:/gluteo/,quadriceps:/quadriceps/,adutores:/adutor/,posteriores:/posterior|isquio/,panturrilha:/panturrilha|gastrocnemio|soleo/,tibial:/tibial/};
          let n = 0, div = [], dup = [], semP = []; EX_BANK.forEach(c=>c.items.forEach(it=>{ n++; const m = mmMusculosDe(Object.assign({part:c.name}, it)); const f = mtNorm(fichaExercicio(it, c.name).m || '');
            m.prim.filter(k=>!K[k].test(f)).forEach(k=>div.push(it.name + ':' + k)); const all = [...m.prim, ...m.sec, ...m.est]; if(new Set(all).size !== all.length) dup.push(it.name); if(!m.prim.length) semP.push(it.name); }));
          const agach = mmMusculosDe({ name:'Agachamento Livre com Barra', part:'Pernas', sub:'Quadríceps / Glúteos' });
          return { n, div, dup, semP, agach }; })()""")
        confere(f"{r['n']} exercícios: o músculo principal do mapa aparece na ficha do exercício", not r['div'], r['div'][:5])
        confere('nenhum músculo em dois papéis ao mesmo tempo; todo exercício tem principal', not r['dup'] and not r['semP'], (r['dup'][:3], r['semP'][:3]))
        confere('agachamento: abdômen e lombar como estabilizadores (não principais)', 'abdomen' in r['agach']['est'] and 'lombar' in r['agach']['est'] and 'abdomen' not in r['agach']['prim'], r['agach'])
        print('7. Ficha do exercício e Progresso')
        await pg.evaluate("openExerciseSheet('Supino Reto com Barra')"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("(()=>{ const b = document.querySelector('#modal-inner .mm-fx-box'); return b ? b.innerText : ''; })()")
        confere('ficha do exercício mostra principal/secundário e "Ver no mapa"', 'Principal' in r and 'Secundário' in r and 'Ver no mapa' in r, r)
        await pg.evaluate("document.querySelector('#modal-inner .mm-fx-mapa').click()"); await pg.wait_for_timeout(200)
        r = await pg.evaluate("[document.getElementById('mm-sub').textContent, document.querySelectorAll('#mm-palco .mm-m.prim[data-m=peito]').length, document.querySelectorAll('.mm-svg').length]")
        confere('abre o mesmo mapa, com os músculos do exercício (sem duplicar o mapa na tela)', r[0] == 'Supino Reto com Barra' and r[1] > 0 and r[2] == 1, r)
        await pg.evaluate("mmVoltar()"); await pg.wait_for_timeout(200)
        confere('o ✕ volta para a ficha do exercício', await pg.evaluate("!!document.querySelector('#modal-inner .ex-sec')"))
        await pg.evaluate("closeModal(); goTab('perf')"); await pg.wait_for_timeout(400)
        confere('Progresso › Desempenho: entrada "Anatomia muscular"', await pg.evaluate("!!document.getElementById('mm-entrada')"))
        await pg.evaluate("document.getElementById('mm-entrada').click()"); await pg.wait_for_timeout(200)
        confere('abre na visão "Últimos 7 dias"', await pg.evaluate("document.querySelector('.mm-modos button.on').dataset.modo === 'semana'"))
        if SAIDA: os.makedirs(SAIDA, exist_ok=True); await pg.screenshot(path=os.path.join(SAIDA, 'b50-progresso-mapa.png'))
        await pg.evaluate("closeModal(); state.active='run'; goTab('perf')"); await pg.wait_for_timeout(300)
        confere('na corrida a entrada não aparece', await pg.evaluate("!document.getElementById('mm-entrada')"))
        confere('sem erros', not erros, erros[:3]); await ctx.close()
        print('8. Desempenho: tamanho e telas')
        for w, h, nome in [(360, 740, 'Android pequeno'), (390, 844, 'iPhone'), (1280, 800, 'computador')]:
            ctx, pg, erros = await nova(b, 'u50t' + str(w), w, h)
            r = await pg.evaluate("""(async()=>{ goTab('sessions'); const t0 = performance.now(); mmAbrir({modo:'hoje'}); mmVista('costas'); mmVista('frente'); const t = performance.now() - t0;
              const s = document.querySelector('#mm-palco .mm-svg').getBoundingClientRect(); const mi = document.getElementById('modal-inner');
              const menor = Math.min(...[...document.querySelectorAll('#mm-palco .mm-m')].map(e=>{ const r = e.getBoundingClientRect(); return Math.max(r.width, r.height); }));
              return { t: Math.round(t), w: Math.round(s.width), h: Math.round(s.height), cabe: s.right <= innerWidth + 1, scroll: mi.scrollWidth <= mi.clientWidth + 1, menor: Math.round(menor), kb: Math.round(document.querySelector('#mm-palco').innerHTML.length/1024) }; })()""")
            confere(f"{nome}: abre em < 150 ms, cabe sem rolagem lateral, SVG leve (< 40 KB)", r['t'] < 150 and r['cabe'] and r['scroll'] and r['kb'] < 40, r)
            if SAIDA: await pg.screenshot(path=os.path.join(SAIDA, f'b50-mapa-{w}.png'))
            confere(f'{nome}: sem erros', not erros, erros[:3]); await ctx.close()
        await b.close()
    print(f"\nBeta 50: {OK[0]} ok, {len(FALHA)} falha(s)")
    sys.exit(1 if FALHA else 0)
asyncio.run(main())

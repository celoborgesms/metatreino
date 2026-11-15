#!/usr/bin/env python3
"""Beta 42: motivo da troca diferenciado — "Equipamento ocupado" (com equipamento) × "Alternativa para este grupo
muscular" (sem equipamento / peso do corpo), com a mesma lógica de compatibilidade e favoritos da Beta 41.
Uso: python3 testes/beta42.py http://localhost:8765/index.html [pasta-de-saida]"""
import asyncio, sys, os, json
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
ok = falhou = 0
def confere(nome, cond, info=''):
    global ok, falhou
    if cond: ok += 1; print('  ✅', nome)
    else: falhou += 1; print('  ❌', nome, info)
# adiciona ao treino selecionado um exercício do catálogo (só para o teste) e devolve o id
ADD = """(nome)=>{ const w = currentSelectedWorkout(state.modules.lift); const a = mtExPorId(slug(nome));
  if(!w.exercises.some(e=>e.id===slug(nome))) w.exercises.push({ id:slug(nome), name:a.ex.name, sub:a.ex.sub, part:a.grupo, sets:3, reps:'12', rest:'60s', equip:a.ex.equip, unit:a.ex.iso?'tempo':'reps' });
  window.__w = w.k; return slug(nome); }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Sao_Paulo')
        await ctx.add_init_script("window.__MOCK_USER={}; window.__MOCK_DOCS={}; window.__MOCK_SEM_DOC=false;")
        pg = await ctx.new_page(); erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        pg.on('console', lambda m: erros.append(m.text) if m.type == 'error' else None)
        await pg.goto(URL); await pg.wait_for_timeout(2200)
        await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500); await pg.evaluate("closeModal(); goTab('sessions')")
        print('1. Exercício com equipamento')
        eid = await pg.evaluate("(()=>{ const w = currentSelectedWorkout(state.modules.lift); const e = w.exercises.find(x=>!mtSemEquipamento(x) && !x.cadeia); window.__w = w.k; return e.id; })()")
        await pg.evaluate(f"openSwapExercise('{eid}')"); await pg.wait_for_timeout(300)
        bt = await pg.evaluate("[...document.querySelectorAll('.seg-mini button')].map(b=>b.textContent.trim())")
        confere('mantém "Equipamento ocupado" (e "Prefiro outro")', bt == ['Equipamento ocupado', 'Prefiro outro'], bt)
        confere('não mostra "Alternativa para este grupo muscular"', not await pg.evaluate("/Alternativa para este grupo/.test(document.getElementById('modal-inner').textContent)"))
        if SAIDA: await pg.screenshot(path=os.path.join(SAIDA, 'b42-01-com-equipamento.png'))
        await pg.evaluate("closeModal()")
        print('2. Exercício sem equipamento / peso do corpo')
        fid = await pg.evaluate(f"({ADD})('Flexão de Braço')")
        await pg.evaluate("state.favoritos = ['flexao-com-maos-elevadas','flexao-diamante']")
        await pg.evaluate(f"openSwapExercise('{fid}')"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("""(()=>({ bt:[...document.querySelectorAll('.seg-mini button')].map(b=>b.textContent.trim()), txt: document.getElementById('modal-inner').textContent,
           motivo: _mtTroca.motivo, favs:[...document.querySelectorAll('.tx-sec-fav .tx-item .fav-btn')].map(b=>b.dataset.fav) }))()""")
        confere('mostra só "Alternativa para este grupo muscular"', r['bt'] == ['Alternativa para este grupo muscular'] and r['motivo'] == 'grupo', r['bt'])
        confere('não usa o termo "ocupado"', 'ocupado' not in r['txt'].lower())
        if SAIDA: await pg.screenshot(path=os.path.join(SAIDA, 'b42-02-sem-equipamento.png'))
        c = await pg.evaluate(f"""(()=>{{ const w = state.modules.lift.plan.workouts.find(x=>x.k===window.__w); const e = w.exercises.find(x=>x.id==='{fid}');
          const g = mtCandidatosTroca(w, e, 'grupo'), o = mtCandidatosTroca(w, e, 'ocupado');
          const ids = c=>JSON.stringify([c.mais,c.compat,c.secund].map(l=>l.map(x=>x.id)));
          const grupo = mtExPorId('{fid}').grupo; const pad = mtPadrao(e).pad;
          const fora = [...g.mais,...g.compat,...g.secund].filter(x=>mtExPorId(x.id).grupo!==grupo && mtPadrao(x.ex).pad!==pad).map(x=>x.ex.name);
          return {{ igual: ids(g)===ids(o), fora, n: g.mais.length+g.compat.length }}; }})()""")
        confere('mesma lógica de compatibilidade da Beta 41 (mesmas opções e faixas)', c['igual'])
        confere('nenhuma opção de outro grupo muscular (fora do mesmo movimento)', not c['fora'], c['fora'])
        confere('favorito compatível priorizado; favorito de outro movimento não', r['favs'] == ['flexao-com-maos-elevadas'], r['favs'])
        await pg.evaluate("document.querySelector('.tx-item.tx-fav, .tx-item.tx-mais, .tx-item.tx-compat').click()"); await pg.wait_for_timeout(300)
        t = await pg.evaluate(f"""(()=>{{ const w = state.modules.lift.plan.workouts.find(x=>x.k===window.__w); const e = w.exercises.find(x=>x.troca && x.troca.orig.id==='{fid}');
          return e && {{ motivo:e.troca.motivo, id:e.id, card:(document.querySelector('.ex-tem-troca .ex-troca-t')||{{}}).textContent }}; }})()""")
        confere('troca registrada com o motivo "alternativa para o grupo muscular"', t and t['motivo'] == 'grupo' and 'grupo muscular' in (t['card'] or ''), t)
        await pg.evaluate(f"""(()=>{{ const w = state.modules.lift.plan.workouts.find(x=>x.k===window.__w); w.dayIdx = getDayIdx();
          state.modules.lift.history = state.modules.lift.history.filter(h=>!(h.id===w.k && Date.now()-h.at<60000));
          state.progress['{t['id']}'] = (state.progress['{t['id']}']||[]).concat([{{ date:Date.now(), sets:[{{peso:0,reps:12}}] }}]); window.__rpe = 6; confirmLiftWorkout(w.k); }})()""")
        await pg.wait_for_timeout(1400)
        h = await pg.evaluate("(()=>{ const x = state.modules.lift.history[state.modules.lift.history.length-1]; closeModal(); openHistoryEntry(state.modules.lift.history.length-1); return { tr:x.trocas, txt:(document.querySelector('#modal-inner .hx-trocas')||{}).textContent||'' }; })()")
        confere('histórico registra a substituição com o motivo certo', h['tr'] and h['tr'][0]['de'] == fid and h['tr'][0]['motivo'] == 'grupo' and 'grupo muscular' in h['txt'], h)
        await pg.evaluate("closeModal()")
        print('3. Sem alternativa compatível')
        mid = await pg.evaluate(f"({ADD})('Mountain Climber')")
        await pg.evaluate(f"openSwapExercise('{mid}')"); await pg.wait_for_timeout(300)
        v = await pg.evaluate("(()=>({ vazio:(document.querySelector('.tx-vazio')||{}).textContent||'', compat:document.querySelectorAll('.tx-sec-mais .tx-item, .tx-sec-compat .tx-item, .tx-sec-fav .tx-item').length }))()")
        confere('informa que não há alternativa compatível neste grupo muscular (sem sugerir como equivalente)', v['compat'] == 0 and 'neste grupo muscular' in v['vazio'] and 'equipamento' not in v['vazio'], v)
        await pg.evaluate("closeModal()")
        confere('outros exercícios do treino não mudaram', await pg.evaluate("state.modules.lift.plan.workouts.every(w=>w.exercises.filter(e=>e.troca).length<=1)"))
        confere('sem erros de JavaScript', not erros, erros[:3])
        await b.close()
    print(f'\nBeta 42: {ok} ok, {falhou} falha(s)'); sys.exit(1 if falhou else 0)
asyncio.run(main())

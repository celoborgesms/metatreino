#!/usr/bin/env python3
"""Beta 52 — Ajustes do prato da casa com calorias (recomendado × com ajuste), semana de cada pessoa no
grupo, PDF da casa por pessoa, lista de compras somada, cardápio mais amplo e alimentos "fora da rotina".
Uso: python3 testes/beta52.py URL_DO_APP [pasta_para_prints]"""
import asyncio, sys, os, base64, io
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
OK = [0]; FALHA = []
def confere(nome, cond, extra=None):
    if cond: OK[0] += 1; print('  ✅', nome)
    else: FALHA.append(nome); print('  ❌', nome, extra if extra is not None else '')
CASA = """(()=>{ const eu = _famUid(); state.nutri.familia = { id:'F52' }; window.__mtTesteSemRede = true;
  _famGuardaCache({ membros:[eu,'u2'], dono:eu, nomes:{ [eu]:'Marcelo', u2:'Emilly' }, config:{ refeicoes:['almoco','jantar'], seed:3 }, cardapio:{}, perfis:{} });
  const s = famMinhaSemana(); const o = {}; Object.keys(s).forEach(dk=>{ const d = JSON.parse(JSON.stringify(s[dk])); d.r = Math.round(d.r*0.8); d.k = Math.round(d.k*0.8); Object.values(d.m).forEach(m=>m.i = m.i.map(([id,g])=>[id, Math.round(g*0.8)])); o[dk] = d; });
  const c = famCache(); c.perfis.u2 = { veg:false, lac:false, glu:false, compras:{ de: chaveDia(new Date()), dias:{} }, semana:o, em:Date.now() }; _famGuardaCache(c); return eu; })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Sao_Paulo', accept_downloads=True)
        pg = await ctx.new_page(); erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.add_init_script("window.__MOCK_USER = {uid:'u52', email:'u52@example.com', displayName:'Marcelo', emailVerified:true};")
        await pg.goto(URL); await pg.wait_for_timeout(2000)
        await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
        await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); window.mtPremium = ()=>true; window.mtTem = ()=>true; state.user.profile = Object.assign(state.user.profile||{}, { weight:80, height:178, age:30, sex:'m' }); state.nutri = null; nutriConfig(); saveData(); 0")
        print('1. Cardápio mais amplo e "fora da rotina"')
        r = await pg.evaluate("NUTRI_REFEICOES.map(x=>[x.id, x.opcoes.length, (x.veg||[]).length])")
        confere('mais pratos em todas as refeições (café ≥ 25, almoço ≥ 29, jantar ≥ 21, ceia ≥ 14)', dict((a,b) for a,b,c in r)['cafe'] >= 25 and dict((a,b) for a,b,c in r)['almoco'] >= 29 and dict((a,b) for a,b,c in r)['jantar'] >= 21 and dict((a,b) for a,b,c in r)['ceia'] >= 14, r)
        r = await pg.evaluate("""(()=>{ const ids = new Set(); for(let d=1; d<=7; d++){ const pl = nutriMontarPlano(d); pl.refeicoes.forEach(m=>m.itens.forEach(i=>ids.add(i.id))); }
          const nomes = new Set(); NUTRI_REFEICOES.forEach(r=>r.opcoes.forEach(o=>{ nomes.add(r.id+o.n); }));
          return { fora: [...ids].filter(id=>NUTRI_FORA_IDS.has(id)), ok: NUTRI_REFEICOES.every(r=>r.opcoes.every(o=>o.i.every(([id])=>NUTRI_ALIMENTOS[id]))), cat: !!NUTRI_CATEG.fora }; })()""")
        confere('pratos novos só com alimentos da tabela; "fora da rotina" nunca entra no cardápio', r['ok'] and not r['fora'] and r['cat'], r)
        await pg.evaluate("openNutri(); nutriAddAbrir('almoco'); window.__nutriAddCat='fora'; nutriAddRender()"); await pg.wait_for_timeout(200)
        t = await pg.evaluate("document.getElementById('nadd-lista').innerText")
        confere('"Adicionar alimento" › Fora da rotina: pizza, hambúrguer, refrigerante, cerveja…', all(x in t for x in ['Pizza', 'Hambúrguer', 'Refrigerante', 'Cerveja', 'Brigadeiro']), t[:200])
        await pg.evaluate("nutriAddEscolher('almoco','pizza')"); await pg.wait_for_timeout(150)
        t = await pg.evaluate("document.getElementById('modal-inner').innerText")
        confere('ao registrar: calorias e % da meta, em tom neutro', '% da sua meta' in t and 'kcal' in t and not any(w in t.lower() for w in ['culpa', 'cuidado', 'evite', 'não deveria']), t[:300])
        await pg.evaluate("nutriEdSalvar()"); await pg.wait_for_timeout(200)
        r = await pg.evaluate("(()=>{ const R = nutriComprasTotais('7dias','eu'); return Object.keys(R.tot).filter(id=>NUTRI_FORA_IDS.has(id)); })()")
        confere('o que foi registrado "fora da rotina" não vai para a lista de compras', not r, r)
        await pg.evaluate("nutriLimpa && (state.nutriLog = {}); saveData(); closeModal()")
        print('2. Ajuste do prato da casa: calorias a mais e a menos')
        eu = await pg.evaluate(CASA)
        r = await pg.evaluate("""(()=>{ const d = getDayIdx(); nutriSet && 0; window.__dSel = d; const pl0 = nutriMontarPlano(d); const m0 = pl0.refeicoes.find(m=>m.id==='almoco');
          return { casa: m0.compartilhada, itens: m0.itens.map(i=>i.id), k: Math.round(m0.tot.kcal), mudou: m0.mudouCasa }; })()""")
        confere('almoço é da casa e começa sem ajuste', r['casa'] and not r['mudou'], r)
        tirar = r['itens'][0]
        r = await pg.evaluate(f"""(()=>{{ openNutri(); famTirarDaCasa('almoco','{tirar}'); const pl = nutriMontarPlano(getDayIdx()); const m = pl.refeicoes.find(m=>m.id==='almoco');
          return {{ mudou: m.mudouCasa, delta: m.casaDelta, rec: m.recKcal, k: Math.round(m.tot.kcal), diaDelta: pl.casaDelta, diaRec: pl.diaRec, dia: Math.round(pl.dia.kcal) }}; }})()""")
        confere('tirar um alimento: o almoço fica com menos calorias que o recomendado (sem recalcular o resto)', r['mudou'] and r['delta'] < 0 and r['rec'] > r['k'], r)
        confere('o dia mostra o mesmo saldo (recomendado − ajuste)', r['diaDelta'] == r['delta'] and abs(r['dia'] - (r['diaRec'] + r['diaDelta'])) <= 1, r)
        await pg.evaluate("openNutri(); document.querySelectorAll('details.mealc').forEach(d=>d.open=true); 0"); await pg.wait_for_timeout(300)
        t = await pg.evaluate("[document.getElementById('fam-ajuste-dia')?.innerText||'', [...document.querySelectorAll('.fam-ajuste')].map(e=>e.innerText).join(' | ')]")
        confere('tela: aviso do dia "recomendado → com os ajustes" e linha na refeição', 'Recomendado' in t[0] and '−' in t[0] and 'sem ' in t[0] and 'Recomendado' in t[1], t)
        if SAIDA: os.makedirs(SAIDA, exist_ok=True); await pg.evaluate("document.getElementById('fam-ajuste-dia').scrollIntoView({block:'start'})"); await pg.screenshot(path=os.path.join(SAIDA, 'b52-ajuste-casa.png'))
        r = await pg.evaluate("""(()=>{ window.__ned = { mode:'add', mid:'almoco', fid:'ovo', base:0, un:true, passo:1, q:2 }; window.__famAddCasa = true; nutriEdSalvar();
          const m = nutriMontarPlano(getDayIdx()).refeicoes.find(m=>m.id==='almoco'); return { delta: m.casaDelta, nomes: famAjusteNomes(m) }; })()""")
        confere('acrescentar um alimento entra no saldo (e aparece "+ ovo" no motivo)', any('+ ovo' in n for n in r['nomes']), r)
        r = await pg.evaluate("""(()=>{ famAlternaCompensa(); const m = nutriMontarPlano(getDayIdx()).refeicoes.find(m=>m.id==='almoco'); const on = { delta: m.casaDelta, comp: m.compensada, k: Math.round(m.tot.kcal), alvo: m.alvoKcal };
          famAlternaCompensa(); return on; })()""")
        confere('"Manter as calorias de cada um": porções recalculadas, sem saldo', r['comp'] and r['delta'] == 0, r)
        await pg.evaluate("openFamilia()"); await pg.wait_for_timeout(200)
        confere('opção "Manter as calorias de cada um" na tela da casa (administrador)', await pg.evaluate("!!document.getElementById('fam-compensa') && !document.querySelector('#fam-compensa input').disabled"))
        print('3. Semana de cada pessoa e PDF da casa')
        r = await pg.evaluate("""(()=>{ famEnviar(); const p = famCache().perfis[_famUid()]; const dks = Object.keys(p.semana||{}); const d = p.semana[dks[0]];
          return { n: dks.length, campos: d && Object.keys(d).sort().join(','), meal: d && Object.keys(d.m).length, sem: JSON.stringify(p).match(/weight|height|idade|altura|peso|email/i) }; })()""")
        confere('perfil publicado leva a semana (r, c, k e refeições), sem dados pessoais', r['n'] == 7 and r['campos'] == 'c,k,m,r' and r['meal'] >= 3 and not r['sem'], r)
        await pg.evaluate("closeModal(); nutriListaCompras('7dias','casa')"); await pg.wait_for_timeout(200)
        t = await pg.evaluate("[document.querySelectorAll('#fam-compras .fam-por').length, document.getElementById('fam-compras').innerText]")
        confere('lista de compras da casa: tudo junto (sem divisão por pessoa) e indica o PDF da lista (Beta 58)', t[0] == 0 and 'PDF da lista' in t[1], t[1][:200])
        await pg.evaluate("window._pdfUlt = null; pdfAlimentacaoCasa()")
        ok = False
        for _ in range(60):
            await pg.wait_for_timeout(300)
            if await pg.evaluate("!!window._pdfUlt"): ok = True; break
        confere('PDF da casa gerado', ok)
        if ok:
            b64 = await pg.evaluate("new Promise(r=>{ const f = new FileReader(); f.onload = ()=>r(f.result.split(',')[1]); f.readAsDataURL(window._pdfUlt.blob); })")
            import pypdf
            txt = '\n'.join(pg_.extract_text() for pg_ in pypdf.PdfReader(io.BytesIO(base64.b64decode(b64))).pages)
            confere('PDF: resumo por dia com recomendado × planejado e o motivo', 'Recomendado' in txt and 'Planejado' in txt and 'Casa:' in txt, txt[:300])
            confere('PDF: cardápio separado de cada pessoa', '(você)' in txt and txt.count('Cardápio de ') >= 2 and 'Cardápio de Emilly' in txt, [l for l in txt.split('\n') if 'Cardápio' in l][:4])
            confere('PDF da casa é só o cardápio (Beta 58: a lista tem PDF próprio)', 'Lista de compras' not in txt, [l for l in txt.split('\n') if 'compras' in l.lower()][:5])
            await pg.evaluate("window._pdfUlt = null; window.__comprasModo='casa'; pdfListaCompras()")
            for _ in range(60):
                await pg.wait_for_timeout(300)
                if await pg.evaluate("!!window._pdfUlt"): break
            b64 = await pg.evaluate("new Promise(r=>{ const f = new FileReader(); f.onload = ()=>r(f.result.split(',')[1]); f.readAsDataURL(window._pdfUlt.blob); })")
            txt2 = '\n'.join(pg_.extract_text() for pg_ in pypdf.PdfReader(io.BytesIO(base64.b64decode(b64))).pages)
            confere('PDF da lista de compras da casa: somada, com a parte de cada um', 'Lista de compras do grupo' in txt2 and 'Emilly:' in txt2, txt2[:300])
            if SAIDA: open(os.path.join(SAIDA, 'b52-casa.pdf'), 'wb').write(base64.b64decode(b64))
        confere('sem erros', not erros, erros[:3])
        await b.close()
    print(f"\nBeta 52: {OK[0]} ok, {len(FALHA)} falha(s)")
    sys.exit(1 if FALHA else 0)
asyncio.run(main())

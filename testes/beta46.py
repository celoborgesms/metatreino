#!/usr/bin/env python3
"""Beta 46 — alimentação da casa (grupo de 2 a 6 pessoas), assistente sem corrida para quem só faz musculação
e avisos do primeiro acesso sem sobreposição.
Uso: python3 testes/beta46.py http://localhost:8765/index.html [pasta-de-saida]"""
import asyncio, sys, os, json, re
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
ok = falhou = 0
def confere(nome, cond, info=''):
    global ok, falhou
    if cond: ok += 1; print('  ✅', nome)
    else: falhou += 1; print('  ❌', nome, str(info)[:300])
async def foto(pg, nome):
    if SAIDA: await pg.screenshot(path=os.path.join(SAIDA, nome + '.png'))
PERFIL = "{ nickname:'Marcelo', sex:'m', age:30, height:178, currentWeight:80, goal:'massa', level:'intermediario', quiz_done:true }"
async def nova(ctx, user):
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    await pg.add_init_script(f"window.__MOCK_USER = {json.dumps(user)}; window.__MOCK_SEM_DOC = false;")
    await pg.goto(URL); await pg.wait_for_timeout(2000)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
    await pg.evaluate(f"try{{closeAwards()}}catch(e){{}}; closeModal(); state.user.profile = Object.assign(state.user.profile||{{}}, {PERFIL}); state.nutri = null; nutriConfig(); saveData(); 0")
    return pg, erros
FAM = "Object.keys(window.__mockFS).find(k=>k.startsWith('familias/'))"

async def casa(b):
    print('1. Alimentação da casa')
    ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Sao_Paulo')
    pg, erros = await nova(ctx, {'uid':'uA','email':'a@example.com','displayName':'Marcelo','emailVerified':True})
    antes = await pg.evaluate("nutriMontarPlano(3).refeicoes.map(m=>m.id+':'+m.prato).join('|')")
    await pg.evaluate("openNutri()"); await pg.wait_for_timeout(300)
    confere('entrada "Cardápio compartilhado" no plano alimentar', await pg.evaluate("!!document.getElementById('fam-entrada')"))
    await pg.evaluate("openFamilia()"); await pg.wait_for_timeout(200)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('explica: mesmo prato, porção de cada um, até 6 pessoas, o que é compartilhado', 'mesmo prato' in t and 'própria quantidade' in t and '6 pessoas' in t and 'Peso, idade, altura e e-mail não são compartilhados' in t, t[:300])
    await foto(pg, 'b46-01-casa-inicio')
    await pg.evaluate("famCriar()"); await pg.wait_for_timeout(800)
    r = await pg.evaluate(f"(()=>{{ const k = {FAM}; const d = window.__mockFS[k]; return {{ k, membros:d && d.membros, dono:d && d.dono, id: state.nutri.familia && state.nutri.familia.id, refs: d && d.config.refeicoes, txt: document.getElementById('modal-inner').innerText }}; }})()")
    confere('cria o grupo com código de 6 caracteres e o criador como membro', r['id'] and len(r['id']) == 6 and r['membros'] == ['uA'] and r['dono'] == 'uA' and r['k'] == 'familias/' + r['id'], r)
    confere('padrão: almoço e jantar são da casa; código aparece para convidar', r['refs'] == ['almoco','jantar'] and r['id'] in r['txt'] and 'Convidar' in r['txt'], r)
    await foto(pg, 'b46-02-casa-grupo')
    await pg.wait_for_timeout(1500)
    d = await pg.evaluate(f"window.__mockFS[{FAM}]")
    txt = json.dumps(d)
    confere('no grupo: só apelido, restrições e proporção da porção (sem peso, idade, e-mail)', 'a@example.com' not in txt and '"80"' not in txt and 'currentWeight' not in txt and 'fatores' in json.dumps(d.get('perfis',{})), list((d.get('perfis') or {}).get('uA',{}).keys()))
    pl = await pg.evaluate("nutriMontarPlano(3).refeicoes.map(m=>({id:m.id, casa:!!m.compartilhada, prato:m.prato}))")
    confere('almoço e jantar marcados como refeições da casa; o resto é individual', all(m['casa'] == (m['id'] in ('almoco','jantar')) for m in pl), pl)
    await pg.evaluate("openNutri()"); await pg.wait_for_timeout(300)
    confere('selo "Compartilhada" nas refeições compartilhadas', await pg.evaluate("document.querySelectorAll('#modal-inner .fam-selo').length") == 2)
    solo = await pg.evaluate("Object.values(nutriComprasTotais('7dias').tot).reduce((s,t)=>s+t.g,0)")
    # outra pessoa entra (simula o celular dela): vegetariana, porção 20% maior
    await pg.evaluate(f"""(()=>{{ const k = {FAM}; const d = window.__mockFS[k]; d.membros.push('uB'); d.nomes.uB = 'Emilly';
        const fat = {{}}; for(let i=1;i<=7;i++) fat[i] = {{ almoco:1.2, jantar:1.1 }};
        d.perfis.uB = {{ veg:true, lac:false, glu:false, fatores:fat }}; window.__mockAvisa(k); }})()""")
    await pg.wait_for_timeout(600)
    r = await pg.evaluate("(()=>{ const p = nutriMontarPlano(3); const R = nutriComprasTotais('7dias','casa'); return { chaves: p.refeicoes.filter(m=>m.compartilhada).map(m=>m.chave), outras: p.refeicoes.filter(m=>!m.compartilhada).map(m=>m.chave), pessoas: R.pessoas, total: Object.values(R.tot).reduce((s,t)=>s+t.g,0) }; })()")
    confere('restrição de alguém da casa vale nas refeições da casa (vegetariano)', all(c.endswith('v') for c in r['chaves']) and not any(c.endswith('v') for c in r['outras']), r)
    confere('lista de compras soma as porções das 2 pessoas', r['pessoas'] == 2 and r['total'] > solo * 1.15, [solo, r])
    await pg.evaluate("nutriListaCompras('7dias')"); await pg.wait_for_timeout(200)
    t = await pg.evaluate("document.getElementById('modal-inner').innerText")
    confere('tela da lista mostra "para 2 pessoas"', 'do grupo' in t and '2 pessoas' in t, t[:200])
    await foto(pg, 'b46-03-lista-casa')
    # Beta 49: "comi" é pessoal (a alimentação é individual) — não vai para o grupo
    await pg.evaluate("openNutri(); nutriComi('almoco'); 0"); await pg.wait_for_timeout(1600)
    hoje = await pg.evaluate("chaveDia(new Date())")
    reg = await pg.evaluate(f"window.__mockFS[{FAM}].registro || null")
    confere('Beta 49: "comi" numa refeição da casa é pessoal (não vai para o grupo)', reg is None, reg)
    # a composição do prato decidida pelo administrador (outro celular) aparece aqui, na minha porção
    item = await pg.evaluate("(()=>{ const it = nutriMontarPlano(getDayIdx()).refeicoes.find(m=>m.id==='jantar').itens; return it[it.length-1].id; })()")
    kcal0 = await pg.evaluate("Math.round(nutriMontarPlano(getDayIdx()).refeicoes.find(m=>m.id==='jantar').tot.kcal)")
    await pg.evaluate(f"""(()=>{{ const k = {FAM}; const d = window.__mockFS[k]; d.cardapio = d.cardapio || {{}}; d.cardapio['{hoje}'] = {{ jantar: {{ x:['{item}'], add:[] }} }}; window.__mockAvisa(k); }})()""")
    await pg.wait_for_timeout(600)
    r = await pg.evaluate(f"(()=>{{ const m = nutriMontarPlano(getDayIdx()).refeicoes.find(m=>m.id==='jantar'); return {{ tem: m.itens.some(i=>i.id==='{item}'), kcal: Math.round(m.tot.kcal) }}; }})()")
    confere('o alimento tirado do prato da casa sai daqui também', not r['tem'], r)
    confere('e a minha porção é recalculada (calorias do meu plano, ±8%)', abs(r['kcal'] - kcal0) <= kcal0*0.08, [kcal0, r])
    # trocar o prato da casa troca para todos
    ch = await pg.evaluate("nutriMontarPlano(3).refeicoes.find(m=>m.id==='almoco').chave")
    p0 = await pg.evaluate("nutriMontarPlano(3).refeicoes.find(m=>m.id==='almoco').prato")
    await pg.evaluate(f"famAlcanceDefine('grupo'); nutriTrocar('{ch}')"); await pg.wait_for_timeout(500)   # RC 2: o administrador escolheu "Grupo todo"
    r = await pg.evaluate(f"({{ tr: window.__mockFS[{FAM}].config.trocas, prato: nutriMontarPlano(3).refeicoes.find(m=>m.id==='almoco').prato }})")
    confere('"Outro prato" numa refeição da casa troca para todos', (r['tr'] or {}).get(ch) == 1 and r['prato'] != p0, [p0, r])
    # quantidade é pessoal (não sincroniza)
    confere('quantidade editada não vai para o grupo (é a porção de cada um)', 'adj' not in json.dumps((await pg.evaluate(f"window.__mockFS[{FAM}]"))))
    # refeições da casa configuráveis
    await pg.evaluate("openFamilia(); famAlternaRefeicao('cafe')"); await pg.wait_for_timeout(300)
    confere('dá para escolher outras refeições da casa (ex.: café)', await pg.evaluate(f"window.__mockFS[{FAM}].config.refeicoes.includes('cafe')"))
    await pg.evaluate("famAlternaRefeicao('cafe')"); await pg.wait_for_timeout(300)
    # PDF: lista de compras da casa
    rp = await pg.evaluate("""(()=>{ const out = []; const S = { precisa(){}, secao(t,s){ out.push('S:'+t+'|'+(s||'')); }, tabela(c, l){ out.push('T:'+l.length); }, nota(t){ out.push('N:'+t); } };
       nutriPdfCompras(S, { C:{ a:'#000', aClaro:'#eee', ink:'#000', dim:'#555' } }, 'casa'); return out; })()""")
    confere('PDF ganha a lista de compras com a casa (2 pessoas)', any('2 pessoas' in x for x in rp) and any(x.startswith('T:') for x in rp), rp)
    # sair mantém o cardápio
    antesSair = await pg.evaluate("nutriMontarPlano(3).refeicoes.map(m=>m.id+':'+m.prato).join('|')")
    await pg.evaluate("famSair()"); await pg.wait_for_timeout(200); await pg.evaluate("document.getElementById('appconfirm-ok').click(); 0"); await pg.wait_for_timeout(1200)
    r = await pg.evaluate(f"(()=>{{ const d = window.__mockFS[{FAM}]; return {{ membros: d && d.membros, dono: d && d.dono, fam: !!(state.nutri.familia), fixo: !!state.nutri.cardapioFixo, plano: nutriMontarPlano(3).refeicoes.map(m=>m.id+':'+m.prato).join('|') }}; }})()")
    confere('sair: tira só a mim do grupo e passa o grupo para quem ficou', r['membros'] == ['uB'] and r['dono'] == 'uB' and not r['fam'], r)
    confere('sair mantém o cardápio atual', r['fixo'] and r['plano'] == antesSair, [antesSair, r['plano']])
    confere('sem erros de JavaScript', not erros, erros[:3])
    codigo = await pg.evaluate(f"{FAM}.split('/')[1]")
    await pg.close()
    # outra pessoa entra pelo código (mesmo navegador = mesma "nuvem" simulada)
    pg, erros = await nova(ctx, {'uid':'uC','email':'c@example.com','displayName':'Carla','emailVerified':True})
    await pg.evaluate("openFamilia()"); await pg.wait_for_timeout(200)
    await pg.fill('#fam-codigo', 'zzzzzz'); await pg.evaluate("famEntrar()"); await pg.wait_for_timeout(400)
    confere('código inexistente: mensagem clara', 'não encontrado' in await pg.evaluate("document.getElementById('fam-msg').textContent"))
    await pg.fill('#fam-codigo', codigo.lower()); await pg.evaluate("famEntrar()"); await pg.wait_for_timeout(1200)
    r = await pg.evaluate(f"({{ membros: window.__mockFS['familias/{codigo}'].membros, fam: state.nutri.familia && state.nutri.familia.id, casa: famAtiva() }})")
    confere('entrar com o código (maiúsculas ou minúsculas)', r['membros'] == ['uB','uC'] and r['fam'] == codigo and r['casa'], r)
    confere('sem erros de JavaScript (quem entra)', not erros, erros[:3])
    await pg.close(); await ctx.close()

async def assistente_avisos(b):
    print('2. Assistente e avisos do primeiro acesso')
    ctx = await b.new_context(viewport={'width':390,'height':844})
    pg, erros = await nova(ctx, {'uid':'uL','email':'l@example.com','emailVerified':True})
    await pg.evaluate("delete state.modules.run; state.active='lift'; saveData(); openAssistant(); 0"); await pg.wait_for_timeout(400)
    chips = await pg.evaluate("MA_SUGGESTIONS.map(s=>s.key)")
    confere('só musculação: sem perguntas de corrida nas sugestões', not any(k.startswith('run_') for k in chips) and 'corrida_analise' not in chips, chips)
    a = await pg.evaluate("[MA_ANSWERS.run_hoje(), MA_ANSWERS.run_avancar()].join(' || ')")
    confere('"Por que o treino de hoje?" / "Quando vou avançar?" respondem sobre a musculação', 'plano de corrida' not in a and ('musculação' in a or 'Hoje' in a), a[:200])
    await pg.evaluate("closeModal(); state.modules.run = { plan:{ workouts:[], motor:null } }; openAssistant(); 0"); await pg.wait_for_timeout(300)
    confere('com plano de corrida as perguntas de corrida voltam', any(k.startswith('run_') for k in await pg.evaluate("MA_SUGGESTIONS.map(s=>s.key)")))
    await pg.evaluate("closeModal(); delete state.modules.run; localStorage.removeItem('mt_fab_vistos'); window.maNudge = ()=>({ text:'Bem-vindo! Toque aqui para conversar.', tone:'important' }); goTab('home'); 0"); await pg.wait_for_timeout(300)
    await pg.evaluate("document.getElementById('toast-wrap') && (document.getElementById('toast-wrap').innerHTML=''); toast('🎉 Plano criado!'); updateFabNudge(); 0"); await pg.wait_for_timeout(500)
    v1 = await pg.evaluate("(()=>{ const b = document.getElementById('fab-bubble'); return !!(b && b.classList.contains('on') && b.style.display !== 'none'); })()")
    confere('com um aviso na tela, o balão do assistente espera', not v1)
    v2 = False
    for _ in range(24):
        await pg.wait_for_timeout(500)
        st = await pg.evaluate("(()=>{ const b = document.getElementById('fab-bubble'); const w = document.getElementById('toast-wrap'); return { on: !!(b && b.classList.contains('on')), avisos: w ? w.children.length : 0 }; })()")
        if st['on']:
            v2 = st['avisos'] == 0; break
    confere('quando o aviso some, o balão aparece', v2)
    confere('sem erros', not erros, erros[:3])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        await casa(b); await assistente_avisos(b)
        await b.close()
    print(f'\nBeta 46: {ok} ok, {falhou} falha(s)'); sys.exit(1 if falhou else 0)
asyncio.run(main())

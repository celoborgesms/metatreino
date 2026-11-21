# Beta 64 — equipamentos 0/1/2+, link discreto, Minha casa no Perfil, barra de macros, alimentos e busca,
# plano respeita o tempo sem esconder grupos, volta da dor devolve o mesmo treino, restauração de backup.
# Uso: python3 testes/beta64.py   (site de teste em http://localhost:8765)
import asyncio, json, os, time
from playwright.async_api import async_playwright
URL = 'http://localhost:8765/index.html'
ok = fal = 0
def confere(n, c, d=''):
    global ok, fal
    if c: ok += 1; print('  ✅', n)
    else: fal += 1; print('  ❌', n, str(d)[:300])

async def pagina(b, uid):
    pg = await (await b.new_context(viewport={'width':390,'height':844})).new_page()
    err = []; pg.on('pageerror', lambda e: err.append(str(e)))
    await pg.add_init_script("window.__MOCK_USER = {uid:'%s', displayName:'T', emailVerified:true};" % uid)
    await pg.goto(URL); await pg.wait_for_timeout(1800); await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
    await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); window.mtTem=()=>true; window.mtPremium=()=>true")
    return pg, err

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg, err = await pagina(b, 'b64')
        print('1. Equipamentos (0 / 1 / 2+) e link discreto')
        await pg.evaluate("state.active='lift'; goTab('sessions')"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("(()=>{ const l=document.getElementById('dupla-linha'); const w=document.querySelector('#scr-sessions .wrap'); return l ? {t:l.textContent, ultimo: w.lastElementChild===l} : null; })()")
        confere('link "Equipamentos" no fim da aba Treinos, sem botão grande', r and 'Equipamentos' in r['t'] and r['ultimo'], r)
        await pg.evaluate("openTreinoDupla(); document.querySelector('.dp-eq').open = true"); await pg.wait_for_timeout(200)
        r = await pg.evaluate("[...document.querySelector('.dp-q3').querySelectorAll('.seg')].map(b=>b.textContent)")
        confere('cada aparelho tem 0, 1 e 2+', r == ['0','1','2+'], r)
        await pg.evaluate("document.querySelector('#modal-inner').scrollTop = 300; duplaQtd('polia',0)"); await pg.wait_for_timeout(200)
        r = await pg.evaluate("({aberto: document.querySelector('.dp-eq').open, rol: document.querySelector('#modal-inner').scrollTop, q: state.modules.lift.setup.dupla.q.polia})")
        confere('escolher a quantidade não fecha a lista nem pula a tela', r['aberto'] and r['rol'] >= 250 and r['q'] == 0, r)
        r = await pg.evaluate("(mtDuplaConflitos()||[]).filter(c=>c.falta).length")
        confere('"0" vira pendência mesmo sem parceiro', r > 0, r)
        r = await pg.evaluate("mtDuplaOrganizar()")
        usa = await pg.evaluate("state.modules.lift.plan.workouts.flatMap(w=>w.exercises).filter(e=>exEstacao(e)==='polia').length")
        confere('"Organizar" troca o que usa aparelho que falta (o que não tem substituto fica avisado)', r.get('ok') and len(r.get('trocas',[])) > 0 and usa == len(r.get('mantidos',[])), (r, usa))
        await pg.evaluate("duplaDesfazer ? duplaDesfazer() : 0; closeModal()")
        print('2. Minha casa no Perfil')
        await pg.evaluate("goTab('profile')"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("(document.getElementById('pf-casa-row')||{}).textContent || ''")
        confere('linha "Minha casa" no Perfil', 'Minha casa' in r, r)
        await pg.evaluate("openMinhaCasa()"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("document.getElementById('modal-inner').innerText")
        confere('abre a casa (criar grupo / entrar com código) com "Fechar"', 'Criar o grupo da casa' in r and 'Fechar' in r, r[:120])
        await pg.evaluate("famCriar()"); await pg.wait_for_timeout(1500); await pg.evaluate("openMinhaCasa()"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("({b:document.querySelectorAll('#modal-inner details.fam-bloco').length, pes: !!document.querySelector('#modal-inner details.fam-bloco[open]'), sair: !!document.querySelector('#modal-inner .fam-sair'), dois: document.querySelectorAll('#modal-inner .fam-2b .btn').length})")
        confere('casa ativa organizada: Pessoas aberto, Refeições recolhido, 2 botões e "Sair" discreto', r['b'] >= 2 and r['pes'] and r['sair'] and r['dois'] == 2, r)
        await pg.evaluate("closeModal(); goTab('profile')"); await pg.wait_for_timeout(200)
        r = await pg.evaluate("document.getElementById('pf-casa-val').textContent")
        confere('Perfil mostra quantas pessoas (singular certo)', r.startswith('1 pessoa '), r)
        print('3. Barra de macros e alimentos')
        await pg.evaluate("openNutri()"); await pg.wait_for_timeout(400)
        a = await pg.evaluate("document.querySelector('.maclg').innerText")
        await pg.evaluate("nutriTrocar(nutriMontarPlano(nutriDiaSel()).refeicoes[2].chave)"); await pg.wait_for_timeout(400)
        b2 = await pg.evaluate("document.querySelector('.maclg').innerText")
        confere('barra de proteína/carbo/gordura muda quando o prato muda', a != b2, (a, b2))
        await pg.evaluate("nutriAddAbrir('almoco')"); await pg.wait_for_timeout(200)
        # com grupo da casa o app pergunta antes: "prato da casa" ou "só para mim"
        await pg.evaluate("(()=>{ const b=[...document.querySelectorAll('#modal-inner button')].find(b=>/Só para mim/.test(b.textContent)); if(b) b.click(); })()"); await pg.wait_for_timeout(250)
        busca = {}
        for q in ['ovo frito','refri zero','pinga','garapa','frango frito','cafe com leite','agua de coco','feijoada']:
            await pg.evaluate(f"window.__nutriAddBusca={json.dumps(q)}; nutriAddFiltra()")
            busca[q] = await pg.evaluate("(document.querySelector('#nadd-lista .n')||{}).innerText || ''")
        confere('busca sem acento, por apelido e por várias palavras', all(busca.values()) and 'frito' in busca['ovo frito'].lower() and 'zero' in busca['refri zero'].lower() and 'Destilado' in busca['pinga'] and 'cana' in busca['garapa'].lower(), busca)
        r = await pg.evaluate("Object.values(NUTRI_MAIS).filter(v=>!/Destilado|Chope|Vinho|Caipirinha|zero|sem açúcar|Chá|Energético zero/i.test(v[0])).filter(v=>{ const c=v[2]*4+v[3]*4+v[4]*9; return Math.abs(c-v[1])/v[1] > .15; }).map(v=>v[0])")
        confere('alimentos novos: calorias batem com os macros (exceto álcool)', not r, r)
        r = await pg.evaluate("({beb: (NUTRI_CATEG.bebidas||[])[1]?.length, pra:(NUTRI_CATEG.pratos||[])[1]?.length, ovos: Object.values(NUTRI_ALIMENTOS).filter(v=>/^Ovo|^Omelete|^Clara/.test(v[0])).length})")
        confere('categorias Bebidas e Pratos; 6+ tipos de ovo', r['beb'] >= 15 and r['pra'] >= 15 and r['ovos'] >= 6, r)
        await pg.evaluate("closeModal()")
        print('4. Plano respeita o tempo pedido sem esconder grupo do nome')
        r = await pg.evaluate("""(()=>{ const P=[]; const dd={3:[1,3,5],4:[1,2,4,5],5:[1,2,3,4,5],6:[1,2,3,4,5,6]};
          for(const goal of ['hipertrofia','forca','emagrecimento','resistencia']) for(const level of ['iniciante','intermediario','avancado']) for(const equip of ['academia','halteres','casa']) for(const days of [3,4,5,6]) for(const tempo of [30,45,60,90]){
            const pl=generatePlan('lift',{goal,days,equip,level,selectedDays:dd[days],tempo,prioridades:[]});
            if(pl.workouts.length!==days) P.push('dias '+days);
            pl.workouts.forEach(w=>{ const d=estimateLiftDuration(w.exercises, goal); if(d > tempo + 5) P.push(`${goal}/${level}/${equip}/${days}/${tempo}: ${w.name} ${d} min`);
              const ids=w.exercises.map(e=>e.id); if(new Set(ids).size!==ids.length) P.push('repetido '+w.name);
              w.exercises.forEach(e=>{ if(e.equip && !e.equip.includes(equip) && !e.equip.includes('casa')) P.push('equip '+e.name); });
              if(tempo>=45) w.parts.forEach(p=>{ if(!w.exercises.some(e=>e.part===p)) P.push(`${goal}/${level}/${equip}/${days}/${tempo}: ${w.name} sem ${p}`); });
              if(/\\+/.test(w.name) && tempo===30 && days>=4) w.name.split(' + ').forEach(p=>{ if(!w.exercises.some(e=>e.part===p)) P.push(`30min ${w.name} sem ${p}`); }); }); }
          return P; })()""")
        confere('576 combinações: dias, tempo (+5 min), sem repetir, equipamento certo e grupos do nome presentes', not r, r[:8])
        print('5. Dor: "Estou sem dor" devolve o mesmo treino')
        r = await pg.evaluate("""(()=>{ const ids=()=>JSON.stringify(state.modules.lift.plan.workouts.map(w=>w.exercises.map(e=>e.id))); const a=ids();
          state.user.pain=['Ombro']; regenAllPlans(); const b=ids(); const ombro=state.modules.lift.plan.workouts.flatMap(w=>w.exercises).filter(e=>e.part==='Ombro').length;
          state.user.pain=[]; regenAllPlans(); return {adaptou:a!==b && ombro===0, volta:ids()===a, sobra: 'antesAdapt' in state.modules.lift}; })()""")
        confere('dor adapta e, ao tirar a dor, voltam os mesmos exercícios', r['adaptou'] and r['volta'] and not r['sobra'], r)
        r = await pg.evaluate("""(()=>{ state.user.pain=['Joelho']; regenAllPlans(); state.modules.lift.setup.equip='halteres'; state.user.pain=[]; regenAllPlans();
          return state.modules.lift.plan.workouts.flatMap(w=>w.exercises).every(e=>!e.equip || e.equip.includes('halteres') || e.equip.includes('casa')); })()""")
        confere('se o equipamento mudou durante a dor, monta de novo (não devolve plano antigo)', r, r)
        print('6. Restauração de backup')
        r = await pg.evaluate("_mtRestauraBackup.length === 3 && _mtRestaura.length === 4")
        confere('função de restaurar backup não é mais sobrescrita pela de rolagem', r, r)
        confere('sem erros de página', not err, err[:4])
        await b.close()
    print(f'\nBeta 64: {ok} ok, {fal} falha(s)')
asyncio.run(main())

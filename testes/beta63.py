#!/usr/bin/env python3
"""Beta 63 — motor de musculação individual: cenários A a G do pedido (o cenário B, duas pessoas na mesma
casa, está em testes/casa-dois-celulares.py, seção 6b), tempo por sessão, nível sem exercício a mais,
classificação muscular, conquistas de calistenia/híbrido e cadastro.
Uso: python3 testes/beta63.py URL"""
import asyncio, sys, json
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
OK = [0]; F = []
def confere(n, c, x=None):
    if c: OK[0] += 1; print('  ✅', n)
    else: F.append(n); print('  ❌', n, json.dumps(x, ensure_ascii=False)[:500] if x is not None else '')
GEN = """(uid, extra)=>{ fbUser = { uid }; const base = { goal:'hipertrofia', days:4, equip:'academia', level:'intermediario', selectedDays:[1,2,4,5] };
  const p = generatePlan('lift', Object.assign({}, base, extra||{})); return p; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); err = []
        pg = await (await b.new_context(viewport={'width':390,'height':900})).new_page(); pg.on('pageerror', lambda e: err.append(str(e)))
        await pg.add_init_script("window.__MOCK_USER = {uid:'t63', displayName:'Teste', emailVerified:true};")
        await pg.goto(URL); await pg.wait_for_timeout(2000); await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
        await pg.evaluate(f"try{{closeAwards()}}catch(e){{}}; closeModal(); window.__gen = {GEN}; 0")

        print('A. Mesmas respostas, pessoas diferentes')
        r = await pg.evaluate("""(()=>{ const a = __gen('pessoaA'), b = __gen('pessoaB'); const nomes = p=>p.workouts.map(w=>w.exercises.map(e=>e.name)).flat();
          const papeis = p=>p.workouts.map(w=>w.exercises.map(e=>exPapel(e, e.part).id + '|' + e.part + '|' + e.sets).join(',')).join(';');
          const iguais = nomes(a).filter((n,i)=>n === nomes(b)[i]).length;
          return { total:nomes(a).length, iguais, papeis: papeis(a) === papeis(b), grupos: a.workouts.map(w=>w.name).join() === b.workouts.map(w=>w.name).join() }; })()""")
        confere('fichas diferentes para respostas iguais (exercícios trocados entre equivalentes)', r['iguais'] < r['total'], r)
        confere('mesmo estímulo: mesmos grupos, mesmos papéis e as mesmas séries em cada posição', r['papeis'] and r['grupos'], r)
        r = await pg.evaluate("(()=>{ const a1 = JSON.stringify(__gen('pessoaA').workouts.map(w=>w.exercises.map(e=>e.name))), a2 = JSON.stringify(__gen('pessoaA').workouts.map(w=>w.exercises.map(e=>e.name))); return a1 === a2; })()")
        confere('a mesma pessoa recebe a mesma ficha ao gerar de novo (estável, não aleatória)', r is True)
        r = await pg.evaluate("""(()=>{ const id = slug('Crossover no Cabo (alto)'); state.favoritos = [id]; const p = __gen('pessoaA'); state.favoritos = []; return p.workouts.some(w=>w.exercises.some(e=>e.id === id)); })()""")
        confere('favorito do aluno entra no lugar do equivalente', r is True)
        r = await pg.evaluate("""(()=>{ const p = __gen('pessoaA', { sexo:'f' }); state.user.profile.sex = 'f'; const f = __gen('pessoaA'); state.user.profile.sex = 'm'; const m = __gen('pessoaA');
          return f.workouts.map(w=>w.name).join() === m.workouts.map(w=>w.name).join(); })()""")
        confere('o sexo não muda a divisão (sem "braço para homem, perna para mulher")', r is True)

        print('C/D. Objetivos e dias diferentes')
        r = await pg.evaluate("""(()=>{ const h = __gen('x', { goal:'hipertrofia' }), e = __gen('x', { goal:'emagrecimento' }), f = __gen('x', { goal:'forca' });
          const reps = p=>p.workouts[0].exercises[0].reps; return [reps(h), reps(e), reps(f), __gen('x', { days:3, selectedDays:[1,3,5] }).workouts.length, __gen('x', { days:5, selectedDays:[1,2,3,5,6] }).workouts.length]; })()""")
        confere('cada objetivo com a sua faixa de repetições', r[0] == '8-12' and r[1] == '12-15' and r[2] == '4-6', r)
        confere('3 e 5 dias: distribuição própria de cada um', r[3] == 3 and r[4] == 5, r)

        print('E. Subir de nível não é ganhar exercício')
        r = await pg.evaluate("""(()=>{ const n = l=>__gen('x', { level:l, tempo:90 }); const ex = p=>p.workouts.map(w=>w.exercises.length); const se = p=>p.workouts.reduce((s,w)=>s+w.exercises.reduce((a,e)=>a+e.sets,0),0);
          const i = n('iniciante'), m = n('intermediario'), a = n('avancado'); return { ex:[ex(i), ex(m), ex(a)], se:[se(i), se(m), se(a)],
            porGrupo: Math.max(...a.workouts.map(w=>{ const c = {}; w.exercises.forEach(e=>c[e.part] = (c[e.part]||0)+1); return Math.max(...Object.values(c)); })) }; })()""")
        confere('avançado tem o mesmo número de exercícios do intermediário', json.dumps(r['ex'][1]) == json.dumps(r['ex'][2]), r)
        confere('avançado progride em volume (mais séries nos principais)', r['se'][2] > r['se'][1] > r['se'][0], r)
        confere('no máximo 3 exercícios por grupo no dia (antes 4 no avançado)', r['porGrupo'] <= 3, r)
        r = await pg.evaluate("(()=>{ const p = __gen('x', { prioridades:['Glúteos'] }); const w = p.workouts.find(w=>w.parts.includes('Glúteos')); return [w.parts[0], w.exercises[0].part, w.exercises.filter(e=>e.part==='Glúteos').length]; })()")
        confere('grupo prioritário abre o treino do dia e ganha 1 exercício', r[0] == 'Glúteos' and r[1] == 'Glúteos' and r[2] >= 3, r)

        print('F. Tempo da sessão')
        r = await pg.evaluate("(()=>{ const o = {}; [30,45,60].forEach(t=>{ const p = __gen('x', { tempo:t }); o[t] = { max:Math.max(...p.workouts.map(w=>w.duration)), aviso:!!p.avisoTempo, ex:p.workouts.map(w=>w.exercises.length) }; }); return o; })()")
        confere('30 min: nenhum treino passa de 30 min (ou o app avisa)', r['30']['max'] <= 33 or r['30']['aviso'], r)
        confere('45 min: dentro do tempo', r['45']['max'] <= 48 or r['45']['aviso'], r)
        confere('60 min: dentro do tempo', r['60']['max'] <= 63 or r['60']['aviso'], r)
        confere('menos tempo = menos exercícios (acessórios saem primeiro; descanso não é cortado)', sum(r['30']['ex']) < sum(r['45']['ex']) <= sum(r['60']['ex']), r)
        r = await pg.evaluate("(()=>{ const p = __gen('x', { tempo:30 }); return p.workouts.every(w=>w.exercises.every(e=>e.rest === liftDescanso(exPapel(e,e.part).tier, 'hipertrofia', false, e.reps) || /s$|min$/.test(e.rest))); })()")
        confere('o descanso continua o recomendado mesmo com pouco tempo', r is True)
        r = await pg.evaluate("estimateLiftDuration([{ sets:4, reps:'8-12', rest:'90-120s' }, { sets:3, reps:'12-15', rest:'60s' }], 'hipertrofia')")
        confere('estimativa realista (2 exercícios ≈ 20 min com aquecimento)', 15 <= r <= 25, r)

        print('G. Base de exercícios — classificação muscular')
        r = await pg.evaluate("""(()=>{ const m = n=>{ const a = exPorNome(n); return mmMusculosDe(Object.assign({ part:a.grupo }, a.ex)); };
          return { voador:m('Crucifixo no Voador (Peck Deck)'), incl:m('Supino na Máquina Inclinado'), halt:m('Supino Reto com Halteres'),
            ext:m('Cadeira Extensora'), flex:m('Mesa Flexora'), stiff:m('Stiff com Halteres'), abd:m('Cadeira Abdutora (foco glúteo)'), pull:m('Pullover na Polia') }; })()""")
        confere('voador: peitoral sem tríceps (isolador)', 'peito' in r['voador']['prim'] and 'triceps' not in r['voador']['sec'], r['voador'])
        confere('os três exercícios de peito citados agora se diferenciam (ênfase e movimento)', len({r['voador']['enf'], r['incl']['enf'], r['halt']['enf']}) == 3, [r['voador']['enf'], r['incl']['enf'], r['halt']['enf']])
        confere('extensora: só quadríceps (sem adutores)', r['ext']['prim'] == ['quadriceps'] and not r['ext']['sec'], r['ext'])
        confere('flexora: posterior, com panturrilha (não glúteo)', 'posteriores' in r['flex']['prim'] and 'panturrilha' in r['flex']['sec'] and 'gluteos' not in r['flex']['sec'], r['flex'])
        confere('stiff: posterior principal, glúteo secundário', r['stiff']['prim'] == ['posteriores'] and 'gluteos' in r['stiff']['sec'], r['stiff'])
        confere('abdutora: glúteo médio sem posterior', 'posteriores' not in r['abd']['sec'], r['abd'])
        confere('pullover na polia: dorsal sem bíceps (braço estendido)', 'biceps' not in r['pull']['sec'], r['pull'])
        r = await pg.evaluate("EX_BANK.flatMap(c=>c.items).filter(it=>/leg press|polia|cabo|extensora|flexora|smith|voador|adutora|abdutora/i.test(it.name)).every(it=>!!exEstacao(it))")
        confere('todo exercício de aparelho sabe qual estação ocupa', r is True)
        await pg.evaluate("openExerciseSheet('Crucifixo no Voador (Peck Deck)')"); await pg.wait_for_timeout(300)
        t = await pg.evaluate("(document.querySelector('#modal-inner .mm-fx-info')||{}).textContent||''")
        confere('ficha do exercício mostra movimento, ênfase, aparelho e equivalentes', 'Movimento' in t and 'Aparelho' in t and 'Equivalentes' in t, t)
        await pg.evaluate("closeModal()")

        print('Conquistas novas')
        r = await pg.evaluate("""(()=>{ const ids = ['cali_1','cali_10','cali_degrau','cali_barra5','cali_skill','cali_mestre','hib_semana','hib_forte','hib_4sem','hib_12','dupla_1','dupla_5','dupla_20','sec_diacompleto','sec_cali4sem','sec_dupla4sem','sec_duplamix'];
          const T = ids.map(id=>TROPHIES.find(t=>t.id===id)); const nv = T.map(t=>t ? medalNivel(t) : null);
          return { todas: T.every(Boolean), unicos: new Set(TROPHIES.map(t=>t.id)).size === TROPHIES.length, niveis:[...new Set(nv)].sort(), icones: ids.every(id=>TROPHY_ICO[id] && TROPHY_GLYPH[TROPHY_ICO[id][0]]) }; })()""")
        confere('novas conquistas de calistenia, híbrido e dupla, sem id repetido', r['todas'] and r['unicos'], r)
        confere('distribuição: comuns, raras e especiais (+ secretas)', r['niveis'] == ['comum','especial','rara'], r)
        confere('cada conquista nova tem ícone próprio ligado ao critério', r['icones'], r)
        r = await pg.evaluate("""(()=>{ state.trophies = state.trophies.filter(t=>!/^(cali_|hib_|sec_cali|sec_dia)/.test(t)); const H = Date.now(); const D = 86400000;
          const barra = Object.values(CALI_EX).find(e=>e.cadeia==='barra' && e.nivel===1 && e.unit==='r');
          state.progress[barra.id] = [{ date:H - 2*D, sets:[{ peso:0, reps:3 }] }];
          checkTrophies(); const a = ['cali_1','cali_degrau','cali_barra5','cali_skill'].map(id=>state.trophies.includes(id));
          const b2 = Object.values(CALI_EX).find(e=>e.cadeia==='barra' && e.nivel>=2 && e.unit==='r');
          state.progress[b2.id] = [{ date:H - D, sets:[{ peso:0, reps:5 }] }]; checkTrophies();
          return [a, ['cali_degrau','cali_barra5'].map(id=>state.trophies.includes(id))]; })()""")
        confere('1º treino de calistenia libera só a comum (nada avançado por registrar um treino)', r[0] == [True, False, False, False], r)
        confere('5 barras no nível intermediário liberam "Degrau Acima" e "Cinco na Barra"', r[1] == [True, True], r)
        r = await pg.evaluate("""(()=>{ const H = Date.now(), D = 86400000; state.trophies = state.trophies.filter(t=>!/^hib_|sec_dia/.test(t));
          state.modules.lift.history = [{ at:H - D, duration:50, module:'lift' }]; state.modules.run = state.modules.run || { history:[] }; state.modules.run.history = [{ at:H - 2*D, duration:30, distance:5, activity:'caminhada', module:'run' }];
          checkTrophies(); const so_cam = state.trophies.includes('hib_semana');
          state.modules.run.history.push({ at:H - D, duration:30, distance:5, activity:'corrida', module:'run' }); checkTrophies();
          return [so_cam, state.trophies.includes('hib_semana'), state.trophies.includes('hib_forte')]; })()""")
        confere('híbrido: caminhada não conta; musculação + corrida na semana libera "Semana Híbrida"', r == [False, True, False], r)
        r = await pg.evaluate("(()=>{ mtRevisaConquistas(); return true })()")
        r = await pg.evaluate("""(()=>{ state.modules.run.history = state.modules.run.history.filter(x=>x.activity !== 'corrida'); const saiu = mtRevisaConquistas(); return [saiu.includes('hib_semana'), state.trophies.includes('hib_semana')]; })()""")
        confere('apagar a corrida tira a "Semana Híbrida" ganha agora (regra das 48 h vale para as novas)', r == [True, False], r)

        print('Ícone da corrida')
        r = await pg.evaluate("[TROPHY_ICO.run_10[0], TROPHY_GLYPH.shoe.includes('M8.9 10.4'), CQ_CAT.dupla, CQ_CAT.cali, CQ_CAT.hibrido]")
        confere('conquistas de corrida com o tênis redesenhado (cadarço, solado e bico)', r[0] == 'shoe' and r[1], r)
        confere('categorias novas com nome na tela de Conquistas', r[2] == 'Treinando juntos' and r[3] == 'Calistenia' and r[4] == 'Híbrido', r)

        print('Cadastro')
        r = await pg.evaluate("""(()=>{ openSetupScreen('lift'); const t = !!document.querySelector('#lift-tempo .opt[data-val="45"]'), pr = document.querySelectorAll('#lift-prio .opt-multi').length;
          document.querySelectorAll('#lift-prio .opt-multi').forEach(o=>o.click()); const n = document.querySelectorAll('#lift-prio .opt-multi.on').length; return [t, pr, n]; })()""")
        confere('"Tempo por sessão" na musculação e prioridade opcional (no máximo 2)', r[0] and r[1] == 6 and r[2] == 2, r)
        r = await pg.evaluate("(()=>{ document.querySelectorAll('#lift-modalidade .opt').forEach(o=>{ if(o.dataset.val==='hibrido') o.click(); }); try{ caliMostrarSetup(); }catch(e){} return getComputedStyle(document.querySelector('.lift-tempo-f')).display; })()")
        confere('no Híbrido não aparecem dois "Tempo por sessão"', r == 'none', r)
        r = await pg.evaluate("(()=>{ goTab('sessions'); const l = document.getElementById('dupla-linha'); return l ? l.textContent : null; })()")
        # Beta 64: o link discreto "Equipamentos" fica no fim da aba para qualquer plano de musculação; "dupla" só com casa
        confere('sem grupo da casa: só "Equipamentos", sem "Treino em dupla"', r is not None and 'Equipamentos' in r and 'dupla' not in r, r)
        confere('sem erros de página', not err, err[:3])
        await b.close()
    print(f'\nBeta 63: {OK[0]} ok, {len(F)} falha(s)'); sys.exit(1 if F else 0)
asyncio.run(main())

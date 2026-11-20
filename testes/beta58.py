#!/usr/bin/env python3
"""Beta 58 — auditoria: pausa/volta só com rotina de verdade (por modalidade e pela agenda), conquista
"A Volta por Cima", registro técnico de importações (30 dias, todo item abre e remove), duplicata depois do
arquivo anual, vínculo da casa preservado no "Começar do zero", mapa muscular por treino, série por série no
detalhe do treino, calendário enxuto, PDFs separados (cardápio × lista de compras × treino) e responsividade.
Uso: python3 testes/beta58.py URL_DO_APP [pasta_para_prints]"""
import asyncio, sys, os
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else None
OK = [0]; FALHA = []
def confere(nome, cond, extra=None):
    if cond: OK[0] += 1; print('  ✅', nome)
    else: FALHA.append(nome); print('  ❌', nome, extra if extra is not None else '')
DIA = 86400000
async def nova(b, w=390, uid='u58'):
    ctx = await b.new_context(viewport={'width':w,'height':844}, device_scale_factor=2, locale='pt-BR', timezone_id='America/Manaus', accept_downloads=True)
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    await pg.add_init_script(f"window.__MOCK_USER = {{uid:'{uid}', email:'{uid}@example.com', displayName:'Teste', emailVerified:true}};")
    await pg.goto(URL); await pg.wait_for_timeout(2000)
    await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1300)
    await pg.evaluate("try{closeAwards()}catch(e){}; closeModal(); window.mtTem = ()=>true; window.mtPremium = ()=>true; 0")
    return pg, erros

HOME = "(()=>{ goTab('home'); return (document.getElementById('home-smart')||{}).innerText||'' })()"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg, erros = await nova(b)

        print('1. Conta nova (cenários 1 e 2)')
        r = await pg.evaluate(f"""(()=>{{ const H = Date.now(); const L = state.modules.lift;
          L.history = []; L.startAt = mtDia0() + 3*{DIA}; state.modules.run = null; state.active = 'lift';
          state.trophies = (state.trophies||[]).filter(t=>t !== 'comeback'); goTab('home');
          return [(document.getElementById('home-smart')||{{}}).innerText||'', contextoAluno().pausaReal, contextoAluno().planFuturo] }})()""")
        confere('conta nova, plano daqui a 3 dias: sem "Pausa"/"Retomada"/"dias sem treinar"', not any(k in r[0] for k in ['Pausa','PAUSA','Retomada','dias sem treinar']), r[0][:200])
        confere('contexto: plano futuro, sem pausa real', r[2] is True and r[1] is False, r[1:])
        # o caso da tela: treino de força importado de 17 dias atrás numa conta nova
        r = await pg.evaluate(f"""(()=>{{ const H = Date.now(); const L = state.modules.lift;
          L.history = [{{id:'imp', name:'⌚ Treino de força', at:H-17*{DIA}, duration:30, module:'lift', imp:{{id:'imp_f', esporte:'musculacao', fmt:'fit'}}}}];
          goTab('home'); const t = (document.getElementById('home-smart')||{{}}).innerText||'';
          const nud = (typeof maNudges === 'function') ? JSON.stringify(maNudges()) : '';
          return [t, contextoAluno().pausaReal, nud, MA_ANSWERS.retomada ? MA_ANSWERS.retomada() : analiseRetomada()] }})()""")
        confere('importado isolado de 17 dias + plano futuro: nada de "PAUSA CURTA — 17 dias"', '17 dias' not in r[0] and 'Pausa' not in r[0], r[0][:200])
        confere('sem pausa real → nenhum aviso de retorno do Meta Assistente', 'retorno_' not in r[2], r[2][:200])
        confere('"Plano de retomada" explica que é começo, não retomada', 'não é retomada' in r[3].lower() or 'começo' in r[3], r[3][:200])
        r = await pg.evaluate("(()=>{ const n = dayAutoNotes(mtDia0()); return n.map(x=>x.k) })()")
        confere('calendário: sem "Voltou a treinar" para conta nova', 'volta' not in r, r)
        r = await pg.evaluate(f"""(()=>{{ const H = Date.now(); const L = state.modules.lift; L.startAt = mtDia0() - 2*{DIA};
          L.history.push({{id:'A', name:'Treino A', at:H, duration:40, module:'lift'}});
          return [mtVoltaReal(10), mtVoltaNoDia(mtDia0(), 7)] }})()""")
        confere('importado isolado + treino hoje: NÃO é "A Volta por Cima"', r[0] is False and r[1] is None, r)

        print('2. Conta antiga (cenários 3, 4 e 6)')
        r = await pg.evaluate(f"""(()=>{{ const H = Date.now(); const L = state.modules.lift; L.startAt = mtDia0() - 90*{DIA};
          L.history = [44,42,40,37,35,33,30].map(d=>({{id:'A', name:'Treino A', at:H-d*{DIA}, duration:40, module:'lift'}}));
          goTab('home'); const t = (document.getElementById('home-smart')||{{}}).innerText||'';
          return [t, contextoAluno().pausaReal, contextoAluno().diasSem] }})()""")
        confere('musculação regular e 30 dias parada: pausa real reconhecida', r[1] is True and r[2] == 30, r[1:])
        confere('Início mostra a retomada (com a pausa da musculação)', 'retomada' in r[0].lower() or '30 dias' in r[0], r[0][:160])
        r = await pg.evaluate(f"""(()=>{{ const H = Date.now(); state.modules.lift.history.push({{id:'A', name:'Treino A', at:H, duration:40, module:'lift'}});
          return [mtVoltaReal(10), mtVoltaNoDia(mtDia0(), 7)] }})()""")
        confere('voltou hoje depois de 30 dias com rotina antes → "A Volta por Cima" liberada', r[0] is True, r)
        confere('calendário: "Voltou à musculação depois de 30 dias"', bool(r[1]) and r[1]['dias'] == 30 and r[1]['mod'] == 'lift', r[1])
        r = await pg.evaluate(f"""(()=>{{ const H = Date.now(); state.modules.lift.history = [3,2].map(d=>({{id:'A', at:H-d*{DIA}, duration:40, module:'lift'}}));
          state.modules.run = {{ plan:{{workouts:[]}}, history:[40,38,35,33].map(d=>({{at:H-d*{DIA}, distance:5, duration:30, activity:'corrida', module:'run'}})).concat([{{at:H, distance:5, duration:30, activity:'corrida', module:'run'}}]), startAt: H-90*{DIA} }};
          return [mtVoltaReal(10), (mtVoltaNoDia(mtDia0(), 7)||{{}}).mod] }})()""")
        confere('corrida: pausa e volta contam só as corridas (musculação recente não "apaga" a pausa)', r[0] is True and r[1] == 'run', r)
        r = await pg.evaluate(f"""(()=>{{ const H = Date.now(); state.active='run'; const c = contextoAluno(); state.active='lift'; return [c.diasSem, contextoAluno().diasSem] }})()""")
        confere('"dias sem treinar" é da modalidade ativa', r == [0, 2], r)
        r = await pg.evaluate(f"""(()=>{{ const H = Date.now(); const L = state.modules.lift;
          L.history = [30,28,26,8].map(d=>({{id:'A', at:H-d*{DIA}, duration:40, module:'lift'}})); L.startAt = mtDia0() - 90*{DIA};
          const hoje = (new Date().getDay()||7); const dias = [1,2,3,4,5,6,7].filter(d=>d!==hoje);
          const W = L.plan.workouts; L.plan.workouts = [{{...W[0], dayIdx: hoje}}];
          const p1 = mtPausaInfo('lift'); L.plan.workouts = W; return [p1.perdidas, p1.real] }})()""")
        confere('agenda real: só o dia de hoje no plano (sem sessão perdida ainda) → contagem coerente', r[0] is not None and r[0] >= 0, r)
        await pg.evaluate("state.modules.run = null; state.active='lift'; 0")

        print('3. Importações e registro técnico (cenários 5, 9–12)')
        r = await pg.evaluate(f"""(async ()=>{{ const H = Date.now();
          state.importLog = [
            {{arq:'velho.fit', ok:false, res:'cancelado', em:H-40*{DIA}}},
            {{arq:'erro.gpx', ok:false, res:'arquivo sem pontos', em:H-3*{DIA}}},
            {{arq:'cancel.fit', ok:false, res:'cancelado', em:H-2*{DIA}}},
            {{arq:'excluida.fit', ok:true, res:'corrida 5 km', id:'imp_zz', em:H-1*{DIA}}} ];
          openIntegracoes(); await new Promise(r=>setTimeout(r,200));
          const rows = [...document.querySelectorAll('.mt-log .integ-log-btn')];
          return [state.importLog.length, rows.length, rows.map(b=>b.textContent.replace(/\\n/g,' | ')).join(' // ')] }})()""")
        confere('registro técnico: entradas com mais de 30 dias saem (qualquer resultado)', r[0] == 3, r[0])
        confere('todo registro é um botão (erro, cancelado, excluída)', r[1] == 3, r[2])
        confere('situação clara em cada linha (Não importada / Cancelada / Atividade excluída)', 'Cancelada' in r[2] and 'Não importada' in r[2] and 'Atividade excluída' in r[2], r[2])
        await pg.evaluate("document.querySelector('.mt-log').open = true; [...document.querySelectorAll('.mt-log .integ-log-btn')][1].click()")
        await pg.wait_for_timeout(200)
        t = await pg.evaluate("document.getElementById('modal-inner').innerText")
        confere('tocar num registro abre o detalhe com "Remover este registro"', 'Registro de importação' in t and 'Remover este registro' in t, t[:200])
        await pg.evaluate("[...document.querySelectorAll('#integ-logdet button')].find(b=>/Remover/.test(b.textContent)).click()")
        await pg.wait_for_timeout(200)
        r = await pg.evaluate("[state.importLog.length, !!document.getElementById('integ-tela')]")
        confere('remover apaga só o registro e volta para a tela de Integrações', r == [2, True], r)
        # duplicata de atividade já arquivada (mais de 90 dias)
        r = await pg.evaluate(f"""(()=>{{ const H = Date.now(); state.modules.run = state.modules.run || {{history:[]}};
          state.modules.run.history = [{{id:'imp', name:'Corrida', at:H-120*{DIA}, duration:30, distance:5, module:'run', activity:'corrida', imp:{{id:'imp_old', hash:'HASH_OLD', chave:'corrida|1|50|30', esporte:'corrida'}}}}];
          state.impHashes = []; window.__mtArqOff = true;
          _mtGuardaHashes(H - 85*{DIA}); state.modules.run.history = [];
          const d = atvDuplicata({{esporte:'corrida', inicio:H-120*{DIA}+999999999, km:7, movS:1}}, 'HASH_OLD');
          return [state.impHashes.length, d && d.tipo, d && d.arquivada] }})()""")
        confere('importação arquivada deixa só a impressão digital (hash, chave, data)', r[0] == 1, r)
        confere('reimportar o mesmo arquivo depois do arquivo anual é detectado', r[1] == 'importada' and r[2] is True, r)
        r = await pg.evaluate("(()=>{ atvLocalApaga('imp_old'); return state.impHashes.length })()")
        confere('excluir a atividade libera a impressão digital (dá para importar de novo)', r == 0, r)
        r = await pg.evaluate("(()=>{ try{ return [atvPercursoSVG([[null,null],[0,0],[-3.1,-60.0]]), atvPercursoSVG([[-3.1,-60.0],[-3.11,-60.01],[NaN,1]]).length > 20] }catch(e){ return 'erro:'+e } })()")
        confere('percurso à prova de pontos vazios (não quebra a tela da atividade)', r[0] == '' and r[1] is True, r)
        r = await pg.evaluate(f"""(async ()=>{{ const H = Date.now(); state.modules.run.history = [{{id:'imp', name:'Corrida', at:H-2*{DIA}, duration:30, distance:5, module:'run', activity:'corrida', imp:{{id:'imp_q', esporte:'corrida', fmt:'gpx', serie:[[0,1],[null,2],[3,null],[4,5],[5,6]]}}}}];
          state.active = 'run'; const t0 = Date.now(); await openAtividade('run', 0); return [Date.now()-t0 < 3000, !!document.getElementById('integ-det')] }})()""")
        confere('atividade importada abre mesmo com série de dados incompleta', r == [True, True], r)
        await pg.evaluate("closeModal(); state.active='lift'; 0")

        print('4. "Começar do zero" mantém a casa (cenários 7 e 8)')
        r = await pg.evaluate("""(async ()=>{ state.nutri = state.nutri || {}; state.nutri.familia = { id:'FAM_TESTE', desde: 1 };
          state.nutri.prefs = { x:1 }; doRestart(); await new Promise(r=>setTimeout(r,150)); document.getElementById('appconfirm-ok').click();
          await new Promise(r=>setTimeout(r,300)); return [state.nutri && state.nutri.familia && state.nutri.familia.id, state.nutri && state.nutri.prefs, (state.modules.lift)] })()""")
        confere('vínculo da casa (id do grupo) continua depois de "Começar do zero"', r[0] == 'FAM_TESTE', r)
        confere('o resto da alimentação (individual) recomeça', not r[1] and r[2] is None, r)
        await pg.close()

        pg, erros = await nova(b, uid='u58b')
        print('5. Séries diferentes por série (cenário 13)')
        r = await pg.evaluate(f"""(()=>{{ const H = Date.now(); const L = state.modules.lift; state.active='lift';
          const ex = L.plan.workouts[0].exercises[0];
          state.progress[ex.id] = [{{date:H-3600000, sets:[{{peso:30,reps:12}},{{peso:35,reps:10}},{{peso:40,reps:8}},{{peso:0,reps:15}}]}}];
          L.history.push({{id:'A', name:'Treino A — teste', at:H, duration:40, module:'lift', exercisesDone:[{{id:ex.id, name:ex.name, part:ex.part, sets:4, best:'40kg×8'}}]}});
          goTab('history'); openHistoryEntry(L.history.length-1);
          return [document.querySelectorAll('#modal-inner .hd-s').length, (document.querySelector('#modal-inner .hd-ss')||{{}}).innerText||'', (document.querySelector('#modal-inner .hd-n small')||{{}}).innerText||''] }})()""")
        confere('detalhe mostra cada série (4 chips)', r[0] == 4, r)
        confere('cargas reais de cada série, inclusive sem carga', '30 kg × 12' in r[1] and '40 kg × 8' in r[1] and '15 rep' in r[1], r[1])
        confere('volume calculado com os valores reais (30×12+35×10+40×8 = 1.030)', '1.030' in r[2], r[2])
        r = await pg.evaluate(f"""(()=>{{ const L = state.modules.lift; L.history.push({{id:'B', name:'Treino antigo', at:Date.now()-5*{DIA}, duration:40, module:'lift', exercisesDone:[{{id:'nao_existe', name:'Supino', sets:3, best:'30kg×10'}}]}});
          openHistoryEntry(L.history.length-1); return (document.querySelector('#modal-inner .hd-ss')||{{}}).innerText||'' }})()""")
        confere('registro antigo (sem séries guardadas) continua aparecendo com o resumo', '3× · 30kg×10' in r, r)
        await pg.evaluate("closeModal()")

        print('6. Mapa muscular')
        r = await pg.evaluate("""(()=>{ mmAbrir({modo:'livre'}); const t = document.querySelector('#mm-jan h3').textContent;
          const off = document.querySelectorAll('#mm-palco .mm-off').length; closeModal(); return [t, off] })()""")
        confere('nome novo: "Mapa muscular"', r[0] == 'Mapa muscular', r)
        confere('Explorar: corpo inteiro ativo', r[1] == 0, r)
        r = await pg.evaluate("""(()=>{ window._mmTreinoAtual = ()=>state.modules.lift.plan.workouts[0]; mmAbrir({modo:'hoje'});
          const P = _mmPapeis(); const off = [...document.querySelectorAll('#mm-palco .mm-m.mm-off')].map(e=>e.dataset.m);
          const fora = Object.keys(MM_INFO).find(k=>!P[k]); mmSel(fora); const sel1 = _mm.sel;
          const dentro = Object.keys(P)[0]; mmSel(dentro); return [off.length > 0, sel1, _mm.sel === dentro, Object.keys(P).some(k=>off.includes(k))] })()""")
        confere('Treino de hoje: músculos fora do treino apagados', r[0] is True, r)
        confere('tocar num músculo fora do treino não abre a ficha', r[1] is None, r)
        confere('músculos do treino continuam abrindo a ficha', r[2] is True and r[3] is False, r)
        await pg.evaluate("closeModal()")

        print('7. Calendário enxuto')
        r = await pg.evaluate("""(()=>{ const ts = mtDia0(); state.trophyDates = state.trophyDates || {}; const ids = (TROPHIES||[]).slice(0,5).map(t=>t.id);
          ids.forEach(id=>{ state.trophyDates[id] = ts + 3600000; if(!state.trophies.includes(id)) state.trophies.push(id); });
          openDayDetail(ts); const box = document.getElementById('dn-auto'); const c = box && box.querySelector('details.dn-conq');
          return [!!c, c && c.open, c && c.querySelectorAll('.dn-item').length, box ? box.querySelectorAll(':scope > .dn-item').length : -1] })()""")
        confere('conquistas do dia numa área própria, recolhida', r[0] is True and not r[1], r)
        confere('área mostra todas as conquistas do dia ao abrir', (r[2] or 0) >= 5, r)
        confere('destaques principais limitados (no máximo 4 visíveis)', r[3] <= 4, r)
        await pg.evaluate("closeModal()")

        print('8. PDFs (cenários 14, 15 e 16)')
        for nome, js in [('cardápio', 'pdfAlimentacao'), ('lista de compras', 'pdfListaCompras'), ('treino', 'pdfTreino')]:
            r = await pg.evaluate(f"typeof {js}")
            confere(f'função do PDF de {nome} existe', r == 'function', r)
        async def pdf_texto(js, arq):
            await pg.evaluate(f"window._pdfUlt = null; closeModal(); {js}")
            for _ in range(60):
                await pg.wait_for_timeout(250)
                if await pg.evaluate("!!window._pdfUlt"): break
            else: return 'ERRO: não gerou'
            b64 = await pg.evaluate("new Promise(r=>{ const f = new FileReader(); f.onload = ()=>r(f.result.split(',')[1]); f.readAsDataURL(window._pdfUlt.blob); })")
            import pypdf, io, base64
            dados = base64.b64decode(b64)
            if SAIDA: open(os.path.join(SAIDA, arq), 'wb').write(dados)
            return '\n'.join(x.extract_text() for x in pypdf.PdfReader(io.BytesIO(dados)).pages)
        r = await pdf_texto('pdfAlimentacao()', 'b58-cardapio.pdf')
        confere('PDF do cardápio NÃO traz a lista de compras', 'Lista de compras' not in r and 'ERRO' not in r, r[:300])
        confere('PDF do cardápio organizado por dia e refeição', 'Segunda' in r and ('Café' in r or 'Almoço' in r), r[:300])
        r = await pdf_texto("window.__comprasEsc='7dias'; window.__comprasModo='eu'; pdfListaCompras()", 'b58-compras.pdf')
        confere('PDF da lista de compras é outro documento (categorias, sem refeições do plano)', 'Lista de compras' in r and 'Café da manhã' not in r and 'Segunda' not in r and 'ERRO' not in r, r[:300])
        confere('lista de compras com total de itens e período', 'itens a comprar' in r and 'Período' in r, r[:300])
        r = await pdf_texto("pdfTreino('lift')", 'b58-treino.pdf')
        confere('PDF do treino: séries × repetições, descanso e anotações separados', 'SÉRIES' in r.upper() and 'DESCANSO' in r.upper() and 'ANOTA' in r.upper() and 'ERRO' not in r, r[:300])
        confere('PDF do treino: músculos da semana', 'Músculos trabalhados na semana' in r, r[:400])
        r = await pg.evaluate("(()=>{ const C = pdfCores(); return [pdfArteCab('alimentacao', C), pdfArteCab('musculacao', C)] })()")
        confere('cabeçalhos sem desenho infantil (sem maçã/brócolis coloridos, sem boneco de palito)', '#5fae6c' not in r[0] and '#e8893a' not in r[0] and 'circle cx="505" cy="47"' not in r[1], [len(x) for x in r])
        await pg.evaluate("closeModal()")

        print('9. Responsividade (cenário 17)')
        for w in [320, 360, 390, 430, 1280]:
            await pg.set_viewport_size({'width':w, 'height':800})
            ruins = []
            for tab in ['home', 'sessions', 'history', 'perf', 'profile']:
                o = await pg.evaluate(f"(()=>{{ closeModal(); goTab('{tab}'); return document.documentElement.scrollWidth - window.innerWidth }})()")
                if o > 1: ruins.append((tab, o))
            await pg.evaluate("openTrophies()")
            await pg.wait_for_timeout(150)
            lin = await pg.evaluate("(()=>{ const b = [...document.querySelectorAll('#cq-filtros button')]; return b.length ? new Set(b.map(x=>x.getBoundingClientRect().top)).size : 0 })()")
            vaza = await pg.evaluate("(()=>{ const m = document.getElementById('modal-inner'); return m ? m.scrollWidth - m.clientWidth : 0 })()")
            confere(f'{w}px: sem rolagem horizontal escondida nas abas', not ruins, ruins)
            confere(f'{w}px: filtros de conquistas numa linha só e sem vazar', lin == 1 and vaza <= 1, (lin, vaza))
        await pg.set_viewport_size({'width':360, 'height':800})
        await pg.evaluate("document.documentElement.style.fontSize = '125%'; closeModal(); goTab('sessions')")
        o = await pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        confere('fonte 125% (360px): Treinos sem rolagem horizontal', o <= 1, o)
        await pg.evaluate("document.documentElement.style.fontSize = ''")

        confere('nenhum erro de JavaScript na página', not erros, erros[:3])
        await b.close()
    print(f'\n{OK[0]} ok, {len(FALHA)} falha(s)')
    for f in FALHA: print('   -', f)
    sys.exit(1 if FALHA else 0)
asyncio.run(main())

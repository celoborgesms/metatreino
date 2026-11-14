#!/usr/bin/env python3
"""Beta 37: grupos do Perfil fecham ao reabrir o app; grupos de músculo sem repetição (Glúteo/Glúteos);
quadro do vídeo vertical deitado (evita a interface de Shorts); resposta de peso em formato brasileiro.
Uso: python3 testes/beta37.py http://localhost:8765/index.html"""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
ok = falhou = 0
def confere(nome, cond, info=''):
    global ok, falhou
    if cond: ok += 1; print('  ✅', nome)
    else: falhou += 1; print('  ❌', nome, info)
async def entra(pg):
    await pg.wait_for_function("document.querySelector('.screen.active')", timeout=15000)
    if await pg.evaluate("document.querySelector('.screen.active').id==='scr-quiz'"):
        await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500)
    await pg.evaluate("try{closeAwards()}catch(e){}; try{closeModal()}catch(e){}")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width':390,'height':844}); erros = []
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.goto(URL); await entra(pg)
        print('1. Grupos do Perfil')
        await pg.evaluate("goTab('profile')"); await pg.wait_for_timeout(400)
        gid = await pg.evaluate("(()=>{ const d=document.querySelector('#scr-profile details.pf-grp'); d.open=true; d.dispatchEvent(new Event('toggle')); return d.id; })()")
        await pg.evaluate("goTab('home')"); await pg.wait_for_timeout(200); await pg.evaluate("goTab('profile')"); await pg.wait_for_timeout(300)
        confere('trocar de aba e voltar mantém o grupo aberto', await pg.evaluate(f"document.getElementById('{gid}').open"))
        # "fechar o app e abrir de novo" = nova aba/janela (sessão nova), mesmo aparelho
        pg2 = await ctx.new_page(); await pg2.goto(URL); await entra(pg2)
        await pg2.evaluate("goTab('profile')"); await pg2.wait_for_timeout(400)
        confere('ao reabrir o app, todos os grupos começam fechados', await pg2.evaluate("[...document.querySelectorAll('#scr-profile details.pf-grp')].every(d=>!d.open)"))
        confere('nada fica gravado no aparelho', await pg2.evaluate("localStorage.getItem('mt_pf_grupos')===null"))
        print('2. Grupos de músculo do treino')
        r = await pg2.evaluate("""(()=>{ const w={k:'T',exercises:[{id:'a',sub:'Glúteos',name:'Ponte'},{id:'b',sub:'Glúteo Médio',name:'Abdutora'},{id:'c',sub:'Quadríceps',name:'Agach'},{id:'d',sub:'Posterior',name:'Stiff'}]};
           return [...renderLiftBlocksBase(w).matchAll(/class="block-name">([^<]*)/g)].map(m=>m[1].trim()); })()""")
        confere('Glúteo e Glúteos viram um grupo só, na ordem do treino', r == ['Glúteos','Quadríceps','Posterior'], r)
        dup = await pg2.evaluate("""(()=>{ const out=[]; (state.modules.lift.plan.workouts||[]).forEach(w=>{ const n=[...renderLiftBlocksBase(w).matchAll(/class="block-name">([^<]*)/g)].map(m=>m[1].trim().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/s$/,'')); if(new Set(n).size!==n.length) out.push(w.name+': '+n.join(',')); }); return out; })()""")
        confere('nenhum treino do plano com grupo repetido', not dup, dup)
        print('3. Quadro do vídeo vertical')
        await pg2.evaluate("""(()=>{ const s=document.createElement('div'); s.className='ex-stage v ok'; s.id='t-stage'; s.innerHTML='<iframe></iframe>'; document.body.appendChild(s); })()""")
        r = await pg2.evaluate("(()=>{ const s=document.getElementById('t-stage'), f=s.querySelector('iframe').getBoundingClientRect(), rs=s.getBoundingClientRect(); return [Math.round(f.width), Math.round(f.height), Math.round(rs.height), getComputedStyle(s).overflow]; })()")
        confere('quadro do vídeo é deitado (mais largo que alto) e da altura da área', r[0] > r[1] and abs(r[1]-r[2]) <= 1 and r[3] == 'hidden', r)
        print('4. Peso no assistente')
        t = await pg2.evaluate("state.weights=[{date:'2026-08-01',weight:122.85},{date:'2026-11-01',weight:125}]; MA_ANSWERS.peso_mudanca()")
        confere('números com vírgula (122,9 kg) e comentário pelo objetivo', ('122,9' in t or '122,85' in t) and '2,2' in t and '122.85' not in t, t[:160])
        confere('sem erros de página', not erros, erros[:3])
        await b.close()
    print(f'\n{ok} verificações aprovadas, {falhou} reprovadas.')
    sys.exit(1 if falhou else 0)
asyncio.run(main())

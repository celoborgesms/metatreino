#!/usr/bin/env python3
"""Beta 36: compartilhar conquistas sempre abre a central atual (nunca a interface antiga), várias vezes seguidas,
com conquistas diferentes; o estado do card anterior não passa para o próximo; nome dentro da faixa.
Uso: python3 testes/compartilhar.py http://localhost:8765/index.html"""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
ok = falhou = 0
def confere(nome, cond, info=''):
    global ok, falhou
    if cond: ok += 1; print('  ✅', nome)
    else: falhou += 1; print('  ❌', nome, info)
CENTRAL = "(()=>{ const mi=document.getElementById('modal-inner'); return document.getElementById('modal-back').classList.contains('on') && !!mi.querySelector('#mts-cv') && !/doShareNow|Modelo clássico/.test(mi.innerHTML); })()"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width':390,'height':844}); erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.goto(URL); await pg.wait_for_function("document.querySelector('.screen.active') && document.querySelector('.screen.active').id==='scr-quiz'", timeout=15000)
        await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1500); await pg.evaluate("try{closeAwards()}catch(e){}; try{closeModal()}catch(e){}")
        ids = await pg.evaluate("state.trophies.slice(0,6)")
        print('1. Conquistas diferentes em sequência, pelo botão da janela da conquista')
        certos = 0; titulos_ok = 0
        for k in range(12):
            tid = ids[k % len(ids)]
            await pg.evaluate("openTrophies()"); await pg.wait_for_timeout(120)
            await pg.evaluate(f"openTrophyDetail('{tid}')"); await pg.wait_for_timeout(120)
            await pg.evaluate("[...document.querySelectorAll('#modal-inner button')].find(b=>/Compartilhar esta conquista/.test(b.textContent)).click()")
            await pg.wait_for_timeout(350)
            if await pg.evaluate(CENTRAL): certos += 1
            nome = await pg.evaluate(f"TROPHIES.find(t=>t.id==='{tid}').name")
            if await pg.evaluate("MTS.d && MTS.d.titulo") == nome: titulos_ok += 1
            if k % 3 == 0: await pg.evaluate("history.back()")      # fecha pelo Voltar do Android
            else: await pg.evaluate("closeModal()")
            await pg.wait_for_timeout(250)
        confere('as 12 aberturas usaram a central atual', certos == 12, certos)
        confere('cada abertura mostrou a conquista certa', titulos_ok == 12, titulos_ok)
        confere('janela fechada no fim', not await pg.evaluate("document.getElementById('modal-back').classList.contains('on')"))
        print('2. Sem atalho para a interface antiga')
        await pg.evaluate(f"shareTrophyImage('{ids[0]}')"); await pg.wait_for_timeout(300)
        confere('não existe mais o link "Modelo clássico"', not await pg.evaluate("/Modelo clássico/.test(document.getElementById('modal-inner').innerHTML)"))
        print('3. Estado limpo entre itens diferentes')
        await pg.evaluate("MTS.foto = { width:100, height:100 }; MTS.zoom = 2.2; MTS.px = .5")
        await pg.evaluate("mtsFmt('feed')"); await pg.wait_for_timeout(200)
        confere('trocar o formato mantém a foto do mesmo card', await pg.evaluate("!!MTS.foto && MTS.zoom===2.2"))
        await pg.evaluate("closeModal()"); await pg.wait_for_timeout(150)
        await pg.evaluate(f"shareTrophyImage('{ids[1]}')"); await pg.wait_for_timeout(300)
        confere('abrir outra conquista começa sem a foto/zoom do card anterior', await pg.evaluate("MTS.foto===null && MTS.zoom===1 && MTS.px===0"))
        await pg.evaluate("closeModal()")
        print('4. Coleção e conquista inexistente')
        await pg.evaluate("shareTrophiesImage()"); await pg.wait_for_timeout(300)
        confere('coleção abre a central atual', await pg.evaluate(CENTRAL))
        await pg.evaluate("closeModal()"); await pg.wait_for_timeout(150)
        await pg.evaluate("shareTrophyImage('nao-existe')"); await pg.wait_for_timeout(200)
        confere('conquista desconhecida: aviso, nenhuma janela antiga', not await pg.evaluate("document.getElementById('modal-back').classList.contains('on')"))
        print('5. Nome na faixa (formatos × nomes)')
        res = await pg.evaluate("""(async()=>{ const out=[]; const nomes=['Ana','Maximiliano','Wolfgangamadeusxx'];
          for(const n of nomes){ state.user.name = n; if(state.user.profile) state.user.profile.nickname='';
            for(const fmt of ['story','feed','quadrado']) for(const d of [mtsDeConquista(state.trophies[0]), mtsDeHistorico(state.modules.lift.history.slice(-1)[0]), mtsDeSemana()]){
              const cv=document.createElement('canvas'); await mtsDesenhar(cv, d, Object.assign({}, MTS, {fmt, disp:'compacto', nome:true, foto:null, estilo:'escuro'}));
              out.push(cv.width>0); } }
          return out; })()""")
        confere('cards com faixa + nome gerados sem erro (27 combinações)', len(res) == 27 and all(res), len(res))
        confere('sem erros de página', not erros, erros[:3])
        await b.close()
    print(f'\n{ok} verificações aprovadas, {falhou} reprovadas.')
    sys.exit(1 if falhou else 0)
asyncio.run(main())

#!/usr/bin/env python3
"""Teste do cronômetro de descanso, da tela ligada (Wake Lock) e do som, no navegador, com relógio e Wake Lock simulados.
Uso: python3 testes/cronometro.py http://localhost:8765/index.html [foto.png]"""
import asyncio, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
FOTO = sys.argv[2] if len(sys.argv) > 2 else None
WL = """
window.__wl = { pedidos:0, ativos:0, soltos:0 };
Object.defineProperty(navigator, 'wakeLock', { configurable:true, value:{ request: async (t)=>{ __wl.pedidos++; __wl.ativos++; const ouv=[]; const s = { released:false, type:t,
  addEventListener:(e,f)=>ouv.push(f), release: async ()=>{ if(s.released) return; s.released=true; __wl.ativos--; __wl.soltos++; ouv.forEach(f=>f()); } }; window.__wlUltima = s; return s; } } });
window.__sons = 0; window.__vib = 0;
const _AC = window.AudioContext; window.AudioContext = function(){ const c = new _AC(); const o = c.createOscillator.bind(c); c.createOscillator = function(){ window.__sons++; return o(); }; return c; };
navigator.vibrate = function(){ window.__vib++; return true; };
"""
ok = 0; falhas = []
def confere(nome, cond, info=''):
    global ok
    if cond: ok += 1
    else: falhas.append(f'{nome} {info}')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script(WL)
        pg = await ctx.new_page()
        erros = []; pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.goto(URL); await pg.wait_for_function("document.querySelector('.screen.active').id==='scr-quiz'")
        await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(800)
        await pg.evaluate("closeModal(); localStorage.removeItem('mt_descanso_mudo'); restMuted=false;")
        # 1) inicia, mostra o tempo, pede a tela ligada
        await pg.evaluate("startRestTimer(60, 'Supino Reto')"); await pg.wait_for_timeout(400)
        t = await pg.evaluate("document.querySelector('#rest-timer-banner .rt-tempo').textContent")
        confere('mostra 1:00 ou 0:59 ao iniciar', t in ('1:00','0:59'), t)
        confere('pede a tela ligada', await pg.evaluate("__wl.ativos") == 1)
        if FOTO: await pg.screenshot(path=FOTO)
        # 2) +15 s e −15 s
        await pg.evaluate("restAjusta(15)"); r1 = await pg.evaluate("restRestante()")
        await pg.evaluate("restAjusta(-15)"); r2 = await pg.evaluate("restRestante()")
        confere('+15 s soma', 73 <= r1 <= 75, r1); confere('−15 s tira', 58 <= r2 <= 60, r2)
        await pg.evaluate("for(let i=0;i<10;i++) restAjusta(-15)"); r3 = await pg.evaluate("restRestante()")
        confere('nunca fica negativo (mínimo 1 s)', 0 < r3 <= 1, r3)
        await pg.evaluate("restAjusta(30)")
        # 3) pausa congela
        await pg.evaluate("restPausa()"); a = await pg.evaluate("restRestante()"); await pg.wait_for_timeout(1300); bb = await pg.evaluate("restRestante()")
        confere('pausado não anda', a == bb, (a, bb))
        await pg.evaluate("restPausa()"); await pg.wait_for_timeout(1300); c = await pg.evaluate("restRestante()")
        confere('continua depois de retomar', c < bb, (bb, c))
        # 4) relógio real: simula 25 s com o JavaScript "dormindo" (tela bloqueada)
        await pg.evaluate("restFimEm -= 25000"); await pg.evaluate("restTick()"); d = await pg.evaluate("restRestante()")
        confere('desconta o tempo que passou com a tela bloqueada', d <= c - 24, (c, d))
        # 5) um só intervalo, mesmo iniciando várias vezes
        await pg.evaluate("window.__ints = 0; const _si = window.setInterval; window.setInterval = function(f,ms){ if(ms===250) window.__ints++; return _si(f,ms); }")
        await pg.evaluate("startRestTimer(30,'A'); startRestTimer(30,'B'); startRestTimer(30,'C')")
        n = await pg.evaluate("document.querySelectorAll('#rest-timer-banner').length")
        confere('um banner só', n == 1, n)
        confere('trava da tela continua única', await pg.evaluate("__wl.ativos") <= 1, await pg.evaluate("__wl"))
        # 6) termina: some o banner, solta o motivo "descanso", toca e vibra UMA vez
        await pg.evaluate("__sons=0; __vib=0; restFimEm = Date.now()-10"); await pg.wait_for_timeout(600)
        confere('banner some no fim', await pg.evaluate("!document.getElementById('rest-timer-banner')"))
        confere('vibra uma vez', await pg.evaluate("__vib") == 1, await pg.evaluate("__vib"))
        # 7) som desligado: nada toca
        await pg.evaluate("restMuted=true; __sons=0; startRestTimer(20,'X')"); await pg.wait_for_timeout(200)
        await pg.evaluate("restFimEm = Date.now()-10"); await pg.wait_for_timeout(600)
        confere('com som desligado não toca nada', await pg.evaluate("__sons") <= 1, await pg.evaluate("__sons"))   # 1 = destravar o áudio (silencioso)
        await pg.evaluate("restMuted=false")
        # 8) treino ativo: na aba Treinos mantém a tela ligada; fora dela solta; salvar encerra
        await pg.evaluate("goTab('sessions'); treinoAtivoIniciar()"); await pg.wait_for_timeout(150)
        confere('treino ativo segura a tela na aba Treinos', await pg.evaluate("telaLigada.motivos.has('treino')"))
        await pg.evaluate("goTab('home')"); await pg.wait_for_timeout(150)
        confere('fora da aba Treinos solta a tela', await pg.evaluate("!telaLigada.motivos.has('treino')"))
        await pg.evaluate("goTab('sessions')"); await pg.wait_for_timeout(150)
        confere('volta para Treinos e pede de novo', await pg.evaluate("telaLigada.motivos.has('treino')"))
        await pg.evaluate("treinoAtivo.toque = Date.now() - 21*60000; treinoAtivoAvaliar()")
        confere('20 min sem tocar na tela: solta', await pg.evaluate("!treinoAtivo && !telaLigada.motivos.has('treino')"))
        # 9) app em segundo plano e de volta: o navegador solta a trava e o app pede de novo
        await pg.evaluate("treinoAtivoIniciar(); goTab('sessions')"); await pg.wait_for_timeout(150)
        await pg.evaluate("__wlUltima.release()"); await pg.wait_for_timeout(50)
        antes = await pg.evaluate("__wl.pedidos")
        await pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(150)
        confere('pede a tela de novo ao voltar para o app', await pg.evaluate("__wl.pedidos") == antes + 1 and await pg.evaluate("__wl.ativos") == 1, await pg.evaluate("__wl"))
        # 10) salvar o treino encerra tudo
        await pg.evaluate("startRestTimer(60,'Y'); treinoAtivoEncerrar(); stopRestTimer()"); await pg.wait_for_timeout(150)
        confere('sem motivo, a tela é liberada', await pg.evaluate("telaLigada.motivos.size===0 && __wl.ativos===0"), await pg.evaluate("[...telaLigada.motivos]"))
        # 11) app fechado no meio do descanso: volta com o tempo certo
        await pg.evaluate("startRestTimer(90,'Remada')"); await pg.wait_for_timeout(200)
        await pg.evaluate("localStorage.setItem('mt_descanso', JSON.stringify({fim: Date.now()+40000, pausa:null, nome:'Remada', total:90}))")
        await pg.reload(); await pg.wait_for_timeout(2500)
        tt = await pg.evaluate("(document.querySelector('#rest-timer-banner .rt-tempo')||{}).textContent")
        confere('retoma o descanso depois de reabrir o app', tt in ('0:38','0:37','0:36','0:39'), tt)
        confere('sem erros na página', not erros, erros[:3])
        await b.close()
    print(f'{ok} verificações aprovadas, {len(falhas)} reprovadas.')
    for f in falhas: print('  ❌', f)
    sys.exit(1 if falhas else 0)
asyncio.run(main())

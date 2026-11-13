#!/usr/bin/env python3
"""Player limpo e créditos de parceiros, com a nuvem simulada (regras da Beta 34) e um YouTube simulado
(a API real do YouTube não é acessível no ambiente de teste).
Uso: python3 testes/videos-creditos.py PASTA_DO_PROJETO [porta] [pasta-das-fotos]"""
import asyncio, sys, os, json, time, subprocess, shutil
from playwright.async_api import async_playwright
sys.argv += [] ; PROJ = sys.argv[1]; PORTA = int(sys.argv[2]) if len(sys.argv) > 2 else 8795; FOTOS = sys.argv[3] if len(sys.argv) > 3 else None
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import importlib.util
spec = importlib.util.spec_from_file_location('dois', os.path.join(AQUI, 'dois-aparelhos.py'))
src = open(os.path.join(AQUI, 'dois-aparelhos.py'), encoding='utf-8').read().split('async def main')[0]
ns = {'__file__': os.path.join(AQUI, 'dois-aparelhos.py')}; sys_argv = sys.argv; sys.argv = ['x', PROJ, str(PORTA)]; exec(src, ns); sys.argv = sys_argv
ADM = {'uid':'uid-adm', 'email':'celoborgesms@gmail.com', 'emailVerified':True, 'displayName':'Marcelo', 'providerData':[{'providerId':'google.com'}]}
ALU = {'uid':'uid-aluno', 'email':'bia@example.com', 'emailVerified':True, 'displayName':'Bia', 'providerData':[{'providerId':'google.com'}]}
YT = """
window.__ytVars = null; window.__ytCalls = [];
window.YT = { Player: function(id, cfg){ window.__ytVars = cfg.playerVars; window.__ytHost = cfg.host; const el = document.getElementById(id); const f = document.createElement('iframe'); f.src='about:blank'; el.replaceWith(f);
  let est = 1, t = 0; const p = this; ['mute','unMute','playVideo','pauseVideo','seekTo','setVolume','setPlaybackRate','destroy'].forEach(m=>p[m]=function(){ window.__ytCalls.push([m].concat([].slice.call(arguments))); if(m==='playVideo') est=1; if(m==='pauseVideo') est=2; if(m==='seekTo') t=arguments[0]; });
  p.getPlayerState=()=>est; p.getCurrentTime=()=>t; p.getDuration=()=>40; p.getVolume=()=>80; p.getIframe=()=>f;
  setTimeout(()=>cfg.events.onReady({target:p}), 50); } };
"""
ok = 0; falhas = []
def confere(nome, cond, info=''):
    global ok
    if cond: ok += 1; print('  ✅', nome)
    else: falhas.append(nome); print('  ❌', nome, info)
async def abre(b, user, vp=None):
    ctx = await b.new_context(viewport=vp or {'width':390,'height':844}, locale='pt-BR')
    await ctx.add_init_script('window.__MOCK_USER = ' + json.dumps(user) + ';' + YT)
    pg = await ctx.new_page(); pg.erros = []; pg.on('pageerror', lambda e: pg.erros.append(str(e)))
    await pg.goto(f'http://127.0.0.1:{PORTA}/index.html')
    await pg.wait_for_function("document.querySelector('.screen.active') && document.querySelector('.screen.active').id!=='scr-auth'", timeout=40000)
    await pg.evaluate("if(document.querySelector('.screen.active').id==='scr-quiz'){ mtSemente(); }"); await pg.wait_for_timeout(1500)
    await pg.evaluate("try{closeAwards()}catch(e){}; try{closeModal()}catch(e){}; loadVideoLinks()"); await pg.wait_for_timeout(600)
    return ctx, pg
async def main():
    site = ns['prepara']()
    srv = subprocess.Popen([sys.executable, os.path.join(AQUI, 'nuvem-simulada.py'), site, str(PORTA)]); time.sleep(1)
    V = lambda nome, url, extra=None: dict({'nome':nome, 'url':url, 'atualizadoEm':1}, **(extra or {}))
    try:
        ns['semear']({
          'usuariosAutorizados/bia@example.com': {'active':True}, 'usuariosAutorizados/celoborgesms@gmail.com': {'active':True}, 'admins/celoborgesms@gmail.com': {'ativo':True},
          'videosExercicios/supino-reto-com-barra': V('Supino Reto com Barra', 'https://www.youtube.com/watch?v=AAAAAAAAAAA'),
          'videosExercicios/leg-press-45': V('Leg Press 45°', 'https://youtube.com/shorts/BBBBBBBBBBB'),
          'videosExercicios/remada-baixa-no-cabo': V('Remada Baixa no Cabo', 'https://youtu.be/CCCCCCCCCCC'),
          'videosExercicios/puxada-frontal-no-pulley': V('Puxada Frontal no Pulley', 'https://youtu.be/DDDDDDDDDDD', {'credito':'https://instagram.com/antigo'}),
        })
        async with async_playwright() as p:
            b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
            print('\n1. Administrador cadastra parceiros pelo painel')
            actx, adm = await abre(b, ADM)
            confere('administrador reconhecido', await adm.evaluate("!!state.user.isAdmin"))
            await adm.evaluate("openVideoAdmin()"); await adm.wait_for_timeout(1200)
            confere('painel de vídeos tem o atalho de parceiros', await adm.evaluate("!!document.getElementById('pc-atalho')"))
            async def novo(nome, campos, marcar, vis, onde=('ficha',)):
                await adm.evaluate("openParceiros()"); await adm.wait_for_timeout(900)
                await adm.evaluate("openParceiroForm(null)"); await adm.wait_for_timeout(300)
                for k, v in campos.items(): await adm.fill('#pc-' + k, v)
                await adm.fill('#pc-nome', nome)
                await adm.evaluate("""(a)=>{ document.querySelectorAll('.pc-grade input[type=checkbox]').forEach(i=>i.checked=false);
                    a.onde.forEach(o=>document.getElementById('pc-o-'+o).checked=true);
                    a.vis.forEach(([k,o])=>document.getElementById('pc-v-'+k+'-'+o).checked=true);
                    document.querySelectorAll('.pc-vchk').forEach(i=>i.checked=a.marcar.includes(i.value)); }""", {'onde':list(onde), 'vis':vis, 'marcar':marcar})
                await adm.evaluate("salvarParceiro()"); await adm.wait_for_timeout(1500)
            await novo('João Silva', {'empresa':'JS Training', 'instagram':'@joaosilva', 'whatsapp':'(67) 99999-1234', 'site':'https://joaosilva.com.br', 'texto':'Personal trainer · CREF 000000-G/MS'},
                       ['supino-reto-com-barra'], [['empresa','ficha'],['instagram','ficha'],['contato','ficha'],['site','ficha'],['texto','ficha'],['instagram','biblioteca']], ('ficha','biblioteca'))
            await novo('Carla Souza', {'instagram':'carla.fit', 'whatsapp':'67988887777'}, ['leg-press-45'], [['instagram','ficha']])
            await novo('Equipe Parceira', {'whatsapp':'6733334444'}, ['remada-baixa-no-cabo'], [['contato','ficha']])
            loja = ns['nuvem']()['loja']
            sup = loja.get('videosExercicios/supino-reto-com-barra', {}); leg = loja.get('videosExercicios/leg-press-45', {})
            confere('link do vídeo continua igual depois dos créditos', sup.get('url') == 'https://www.youtube.com/watch?v=AAAAAAAAAAA' and leg.get('url') == 'https://youtube.com/shorts/BBBBBBBBBBB')
            confere('vídeo guarda só o que foi liberado (Carla: sem WhatsApp)', 'contato' not in json.dumps(leg.get('creditos',{})) and leg['creditos']['ficha'].get('instagram') == 'carla.fit', leg.get('creditos'))
            confere('cadastro completo do parceiro fica em "parceiros" (com o WhatsApp)', any(v.get('whatsapp') == '67988887777' for k, v in loja.items() if k.startswith('parceiros/')))
            print('2. Aluno vê os créditos na ficha e na Biblioteca (sem poder alterar)')
            lctx, alu = await abre(b, ALU)
            async def ficha(nome):
                await alu.evaluate(f"closeModal(); openExerciseSheet({json.dumps(nome)})"); await alu.wait_for_timeout(500)
                return await alu.evaluate("(document.querySelector('#modal-inner .vc-cred')||{}).innerText || ''")
            f1 = await ficha('Supino Reto com Barra')
            confere('crédito completo: nome, empresa, Instagram, contato, site e texto', all(x in f1 for x in ['João Silva','JS Training','@joaosilva','(67) 99999-1234','joaosilva.com.br','CREF']), f1)
            if FOTOS: await alu.screenshot(path=os.path.join(FOTOS, 'ficha-creditos.png'))
            f2 = await ficha('Leg Press 45°')
            confere('só Instagram (contato não liberado não aparece)', '@carla.fit' in f2 and 'Contato' not in f2, f2)
            f3 = await ficha('Remada Baixa no Cabo')
            confere('só contato profissional', 'Contato profissional' in f3 and 'Instagram' not in f3, f3)
            f4 = await ficha('Puxada Frontal no Pulley')
            confere('vídeo antigo com o crédito antigo (link) continua igual', f4 == '' and await alu.evaluate("!!document.querySelector('#modal-inner .ex-credit')"))
            f5 = await ficha('Agachamento Livre com Barra')
            confere('exercício sem vídeo continua normal', f5 == '' and await alu.evaluate("!!document.querySelector('#modal-inner .ex-noVideo')"))
            await alu.evaluate("closeModal(); goTab('library')"); await alu.wait_for_timeout(500)
            bib = await alu.evaluate("[...document.querySelectorAll('.lx-cred')].map(e=>e.innerText)")
            confere('Biblioteca: só o parceiro liberado para lá (João, com Instagram)', len(bib) == 1 and 'João Silva' in bib[0] and '@joaosilva' in bib[0] and '99999' not in bib[0], bib)
            print('3. Player limpo')
            await alu.evaluate("closeModal(); openExerciseSheet('Supino Reto com Barra')"); await alu.wait_for_timeout(700)
            pv = await alu.evaluate("window.__ytVars")
            confere('parâmetros oficiais do modo limpo (sem controles do YouTube, sem sugestões, sem anotações, repetindo)', pv and pv.get('controls')==0 and pv.get('rel')==0 and pv.get('iv_load_policy')==3 and pv.get('loop')==1 and pv.get('playlist')=='AAAAAAAAAAA' and pv.get('playsinline')==1, pv)
            confere('domínio sem cookies (youtube-nocookie)', await alu.evaluate("window.__ytHost") == 'https://www.youtube-nocookie.com')
            confere('barra de controles do MetaTreino abaixo do vídeo', await alu.evaluate("(()=>{ const c=document.getElementById('mtv-ctrl'), s=document.getElementById('ex-stage'); return !!c && !!s && c.getBoundingClientRect().top >= s.getBoundingClientRect().bottom-1; })()"))
            confere('aluno não vê o botão que abre o YouTube', await alu.evaluate("![...document.querySelectorAll('#modal-inner a')].some(a=>/YouTube/.test(a.textContent))"))
            confere('o toque na imagem não vai para o YouTube', await alu.evaluate("getComputedStyle(document.querySelector('#ex-stage iframe')).pointerEvents") == 'none')
            await alu.evaluate("window.__ytCalls=[]; mtTocarPausar(); mtVelocidade(); mtVolume(30); mtBuscar(0.5)")
            calls = [c[0] for c in await alu.evaluate("window.__ytCalls")]
            confere('pausar, velocidade, volume e posição funcionam', all(x in calls for x in ['pauseVideo','setPlaybackRate','setVolume','seekTo']), calls)
            await alu.evaluate("window.__ytCalls=[]; document.getElementById('ex-stage').click()")
            confere('tocar na imagem pausa/continua', 'playVideo' in [c[0] for c in await alu.evaluate("window.__ytCalls")] )
            if FOTOS: await alu.screenshot(path=os.path.join(FOTOS, 'player-limpo.png'))
            await alu.evaluate("closeModal(); openExerciseSheet('Leg Press 45°')"); await alu.wait_for_timeout(600)
            confere('vídeo vertical (Shorts) mantém a proporção', await alu.evaluate("document.getElementById('ex-stage').classList.contains('v')"))
            await alu.evaluate("closeModal()"); await alu.wait_for_timeout(200)
            confere('fechar a ficha remove os controles e o player', await alu.evaluate("!document.getElementById('mtv-ctrl')"))
            print('4. Permissões')
            neg1 = await alu.evaluate("db.collection('parceiros').get().then(()=>'leu',e=>e.code)")
            neg2 = await alu.evaluate("db.collection('videosExercicios').doc('supino-reto-com-barra').set({creditos:{nome:'hack'}},{merge:true}).then(()=>'gravou',e=>e.code)")
            confere('aluno não lê o cadastro de parceiros', neg1 == 'permission-denied', neg1)
            confere('aluno não altera créditos', neg2 == 'permission-denied', neg2)
            print('5. Editar e excluir')
            await adm.evaluate("openParceiros()"); await adm.wait_for_timeout(900)
            pid = await adm.evaluate("(_pcLista.find(x=>x.nome==='João Silva')||{}).id")
            await adm.evaluate(f"openParceiroForm('{pid}')"); await adm.wait_for_timeout(200)
            await adm.evaluate("document.getElementById('pc-v-contato-ficha').checked=false; document.getElementById('pc-texto').value=''")
            await adm.evaluate("salvarParceiro()"); await adm.wait_for_timeout(1500)
            sup = ns['nuvem']()['loja'].get('videosExercicios/supino-reto-com-barra', {})
            confere('edição: contato some do vídeo e o link continua', 'contato' not in json.dumps(sup.get('creditos')) and 'texto' not in json.dumps(sup.get('creditos')) and sup.get('url','').endswith('AAAAAAAAAAA'), sup.get('creditos'))
            await adm.evaluate(f"excluirParceiro('{pid}')"); await adm.wait_for_timeout(400)
            await adm.evaluate("document.getElementById('appconfirm-ok').click()"); await adm.wait_for_timeout(1500)
            loja = ns['nuvem']()['loja']; sup = loja.get('videosExercicios/supino-reto-com-barra', {})
            confere('exclusão: créditos saem do vídeo, link continua', 'creditos' not in sup and sup.get('url','').endswith('AAAAAAAAAAA'), sup)
            confere('exclusão: cadastro do parceiro sai', not any(v.get('nome') == 'João Silva' for k, v in loja.items() if k.startswith('parceiros/')))
            print('6. Responsividade')
            for vp in ({'width':360,'height':740}, {'width':1366,'height':800}):
                await alu.set_viewport_size(vp); await alu.evaluate("closeModal(); openExerciseSheet('Leg Press 45°')"); await alu.wait_for_timeout(600)
                larg = await alu.evaluate("[document.documentElement.scrollWidth, innerWidth, Math.round(document.getElementById('mtv-ctrl').getBoundingClientRect().right)]")
                confere(f'ficha com vídeo cabe na tela ({vp["width"]} px)', larg[0] <= larg[1] and larg[2] <= larg[1] + 1, larg)
            await adm.set_viewport_size({'width':360,'height':740}); await adm.evaluate("openParceiros()"); await adm.wait_for_timeout(900); await adm.evaluate("openParceiroForm(null)"); await adm.wait_for_timeout(300)
            larg = await adm.evaluate("[document.documentElement.scrollWidth, innerWidth]")
            confere('formulário de parceiro cabe em 360 px', larg[0] <= larg[1], larg)
            if FOTOS: await adm.screenshot(path=os.path.join(FOTOS, 'form-parceiro.png'))
            confere('sem erros de página', not (adm.erros + alu.erros), (adm.erros + alu.erros)[:3])
            await b.close()
    finally:
        srv.terminate(); shutil.rmtree(site, ignore_errors=True)
    print(f'\n{ok} verificações aprovadas, {len(falhas)} reprovadas.'); sys.exit(1 if falhas else 0)
asyncio.run(main())

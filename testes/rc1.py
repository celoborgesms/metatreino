# 2027 RC 1 — vibração (pulsos curtos sentidos, alarme não cortado, teste no Som do cronômetro) e arquivos do APK.
# Uso: python3 testes/rc1.py [URL]   (padrão http://localhost:8765/index.html, Firebase simulado)
import asyncio, sys, json, os, xml.dom.minidom
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/index.html'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ok = fal = 0
def confere(n, c, d=''):
    global ok, fal
    if c: ok += 1; print('  ✅', n)
    else: fal += 1; print('  ❌', n, str(d)[:300])
GRAVA = "window.__vibs = []; navigator.vibrate = function(p){ window.__vibs.push(JSON.stringify(p)); return true; };"
async def main():
    print('1. Arquivos do APK (TWA)')
    al = json.load(open(os.path.join(RAIZ, '.well-known/assetlinks.json')))
    t = al[0]['target']
    confere('assetlinks.json com o pacote app.metatreino e a impressão SHA-256', t['package_name'] == 'app.metatreino' and len(t['sha256_cert_fingerprints'][0]) == 95, t)
    m = xml.dom.minidom.parse(os.path.join(RAIZ, 'android-twa/app/src/main/AndroidManifest.xml'))
    acts = [a.getAttribute('android:name') for a in m.getElementsByTagName('activity')]
    confere('manifesto Android abre pelo LauncherActivity do TWA', 'com.google.androidbrowserhelper.trusted.LauncherActivity' in acts, acts)
    s = open(os.path.join(RAIZ, 'android-twa/app/src/main/res/values/strings.xml'), encoding='utf-8').read()
    confere('o app aponta para https://metatreino.app', 'https://metatreino.app' in s)
    g = open(os.path.join(RAIZ, 'android-twa/app/build.gradle'), encoding='utf-8').read()
    confere('chave de assinatura só por secrets (nenhuma senha no código)', "System.getenv('KEYSTORE_PASSWORD')" in g and not any(f.endswith('.jks') for f in os.listdir(os.path.join(RAIZ, 'android-twa'))))
    print('2. Vibração')
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True)
        await ctx.add_init_script(GRAVA)
        pg = await ctx.new_page(); err = []; pg.on('pageerror', lambda e: err.append(str(e)))
        await pg.add_init_script("window.__MOCK_USER = {uid:'rc1', displayName:'T', emailVerified:true};")
        await pg.goto(URL); await pg.wait_for_timeout(1800); await pg.evaluate("mtSemente()"); await pg.wait_for_timeout(1200)
        await pg.evaluate("try{closeAwards()}catch(e){}; closeModal()")
        r = await pg.evaluate("__vibs = []; navigator.vibrate(3); navigator.vibrate(8); navigator.vibrate([6, 50, 6]); __vibs")
        confere('toques de 3–8 ms viram 25 ms (sentidos)', r == ['25','25','[25,50,25]'], r)
        r = await pg.evaluate("__vibs = []; localStorage.removeItem('mt_descanso_vibrar'); startRestTimer(30,'X'); restFimEm = Date.now() - 5; new Promise(ok=>setTimeout(()=>{ navigator.vibrate(3); ok(__vibs); }, 700))")
        confere('fim do descanso vibra o alarme e um toque curto logo depois não o corta', r == ['[300,120,300,120,300]'], r)
        r = await pg.evaluate("navigator.vibrate(0); __vibs.slice(-1)")
        confere('cancelar (0) sempre passa', r == ['0'], r)
        await pg.evaluate("__vibs = []; localStorage.removeItem('mt_vib_ok'); openSomFim()"); await pg.wait_for_timeout(300)
        tem = await pg.evaluate("!!document.getElementById('mt-vib-teste')")
        await pg.evaluate("[...document.querySelectorAll('#mt-vib-teste .btn')][0].click()"); await pg.wait_for_timeout(200)
        r = await pg.evaluate("({ v: __vibs, t: document.getElementById('mt-vib-status').textContent })")
        confere('"Testar vibração" no Som do cronômetro vibra 400 ms e pergunta se sentiu (RC 2)', tem and r['v'] == ['400'] and 'Sentiu' in r['t'], r)
        r = await pg.evaluate("[APP_VERSION, appVersaoLabel()]")
        confere('versão 2027 RC', r[0].startswith('2027-rc.') and r[1].startswith('2027 RC '), r)
        confere('sem erros de página', not err, err[:3])
        await b.close()
    print(f'\nRC 1: {ok} ok, {fal} falha(s)')
asyncio.run(main())

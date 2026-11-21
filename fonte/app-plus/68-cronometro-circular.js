
// =====================================================================
// 68. 2027 RC 0 — cronômetro de descanso circular (expandido, minimizado e dentro do registro de séries)
// ---------------------------------------------------------------------
// O QUE NÃO MUDA (núcleo, app.js "TIMER DE DESCANSO"): a contagem continua pelo horário real de término
// (restFimEm), com um único intervalo de desenho (restTimerInt), o som agendado no relógio do áudio
// (restAgendaSom), a vibração e o som do fim (restTermina, um alarme só), a pausa (restPausaRestante),
// ±15 s (restAjusta), a retomada ao reabrir o app (localStorage "mt_descanso") e as preferências de som
// (restMuted / "mt_descanso_mudo") e vibração ("mt_descanso_vibrar").
// O QUE ESTA PARTE FAZ: só o DESENHO.
//  • Um elemento só (#rest-timer-banner, classe .rt2) com dois jeitos de aparecer:
//    - cheio: anel com o tempo no centro, progresso contínuo e cor que muda no fim (normal → amarelo → vermelho),
//      −15 s, pausar/continuar, +15 s, pular, som e vibração;
//    - mini (pílula): anel pequeno + tempo, ao lado do botão do assistente. Tocar expande.
//  • Com o registro de séries aberto, o cronômetro fica DENTRO dele (#rt-dock), sem cobrir "Salvar".
//    Ao sair do registro, vira a pílula; o cartão expandido tem "Voltar ao treino".
//  • Nada de intervalo novo: o desenho roda no mesmo tique de 250 ms do núcleo (restDesenha embrulhada).
//  • O elemento é guardado em _rtEl: se uma tela redesenhar o modal (innerHTML), ele volta para o lugar
//    certo no próximo tique, com o mesmo tempo (a contagem nunca dependeu do elemento).
// LIMITE REAL: com o app fechado ou o celular suspenso, o navegador pode parar o JavaScript. O som
// agendado no áudio costuma tocar se a página continuar viva (Android), mas não há garantia; no iPhone,
// em segundo plano, não toca. Notificação agendada (Notification Triggers) não existe nos navegadores
// atuais e push exigiria servidor; por isso, ao voltar, o app mostra o tempo certo ou avisa que terminou.
// =====================================================================
let _rtEl = null;             // o elemento do descanso (sobrevive a redesenhos do modal)
let _rtModo = 'min';          // fora do registro: 'min' (pílula) ou 'exp' (cartão)
let _rtEx = null;             // exercício do descanso, para "Voltar ao treino"
const RT_R = 52, RT_C = +(2*Math.PI*RT_R).toFixed(2);
const RT_ICO = {
  min:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  pausa:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg>',
  play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>',
  pular:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5l9 7-9 7zM18 5v14"/></svg>',
  som:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10zM16.5 8.5a5 5 0 010 7"/></svg>',
  mudo:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10zM17 9l4 6M21 9l-4 6"/></svg>',
  vib:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4 9v6M20 9v6"/></svg>',
  ampulheta:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10M7 20h10M8 4c0 5 8 5 8 8s-8 3-8 8M16 4c0 5-8 5-8 8"/></svg>'
};
function _rtAnel(cls, r){ const c = +(2*Math.PI*r).toFixed(2); const s = (r+8)*2;
  return `<svg class="${cls}" viewBox="0 0 ${s} ${s}" aria-hidden="true"><circle class="rt2-trilho" cx="${s/2}" cy="${s/2}" r="${r}"/><circle class="rt2-arco" cx="${s/2}" cy="${s/2}" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="0" data-c="${c}"/></svg>`; }
function _rtMarkup(){
  return `<div class="rt2-cheio">
      <div class="rt2-topo"><span class="rt2-tit">${RT_ICO.ampulheta}<span>Descanso${restNomeEx ? ' · ' + escHtml(restNomeEx) : ''}</span></span>
        <button type="button" class="rt2-ic rt2-btmin" onclick="rtMinimizar()" aria-label="Minimizar o cronômetro">${RT_ICO.min}</button></div>
      <div class="rt2-corpo">
        <div class="rt2-anel">${_rtAnel('rt2-svg', RT_R)}<div class="rt2-centro"><div class="rt-tempo mono" aria-label="Tempo restante"></div><div class="rt-sub"></div></div></div>
        <div class="rt2-lado">
          <div class="rt2-prox"></div>
          <div class="rt2-botoes">
            <button type="button" class="rt2-b" onclick="restAjusta(-15)" aria-label="Tirar 15 segundos">−15s</button>
            <button type="button" class="rt2-b rt-pausa" onclick="restPausa()"></button>
            <button type="button" class="rt2-b" onclick="restAjusta(15)" aria-label="Somar 15 segundos">+15s</button>
            <button type="button" class="rt2-b rt2-pular" onclick="rtPular()" aria-label="Pular o descanso">${RT_ICO.pular}<span>Pular</span></button>
          </div>
          <div class="rt2-linha">
            <button type="button" class="rt2-ic rt-som" onclick="toggleRestMute();restDesenha()"></button>
            <button type="button" class="rt2-ic rt2-vib" onclick="rtVibrar()"></button>
            <button type="button" class="rt2-voltar" onclick="rtVoltarTreino()">Voltar ao treino</button>
          </div>
        </div>
      </div>
    </div>
    <button type="button" class="rt2-mini" onclick="rtExpandir()" aria-label="Abrir o cronômetro do descanso">${_rtAnel('rt2-msvg', 13)}<span class="rt2-mt mono"></span></button>`;
}
// lugar do cronômetro: dentro do registro de séries (se aberto) ou flutuando
function rtPosiciona(){
  const el = _rtEl; if(!el || !restTimerInt) return;
  const dock = document.getElementById('rt-dock');
  const mb = $('modal-back'); const modalOn = !!(mb && mb.classList.contains('on'));
  if(dock && modalOn){
    if(el.parentNode !== dock) dock.appendChild(el);
    el.classList.add('doca'); el.classList.remove('min', 'exp');
    el.style.right = ''; el.style.bottom = '';
    return;
  }
  if(el.parentNode !== document.body){
    if(el.classList.contains('doca')) _rtModo = 'min';      // saiu do registro de séries: vira a pílula
    document.body.appendChild(el);
  }
  el.classList.remove('doca');
  el.classList.toggle('min', _rtModo === 'min'); el.classList.toggle('exp', _rtModo !== 'min');
  // pílula ao lado do botão do assistente (sem cobrir), ou no canto quando ele não aparece
  if(_rtModo === 'min'){
    const fab = document.getElementById('ma-fab'); let r = null;
    try{ if(fab){ const cs = getComputedStyle(fab); r = fab.getBoundingClientRect(); if(cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.1 || !(r.width > 0) || r.top > window.innerHeight) r = null; } }catch(e){ r = null; }
    if(r){ el.style.right = Math.round(window.innerWidth - r.left + 10) + 'px'; el.style.bottom = Math.round(window.innerHeight - r.bottom + (r.height - 44)/2) + 'px'; }
    else { el.style.right = ''; el.style.bottom = ''; }
  } else { el.style.right = ''; el.style.bottom = ''; }
}
function _rtFase(left, total){
  const aviso = Math.min(10, Math.max(3, Math.round(total*0.5)));
  const fim = Math.min(3, Math.max(1, Math.round(total*0.2)));
  return left <= fim ? 'fim' : left <= aviso ? 'aviso' : 'ok';
}
function _rtProx(){
  try{
    if(!_rtEx || !curLog || curLog.exId !== _rtEx.id) return _rtEx && _rtEx.name ? `Próximo: ${escHtml(_rtEx.name)}` : '';
    const plan = seriesPlanejadas(curLog.exId); const feitas = (curLog.feitas||[]).filter(Boolean).length;
    if(plan && feitas < plan) return `Próxima: série ${feitas + 1} de ${plan}`;
    return 'Próxima série';
  }catch(e){ return ''; }
}
function _rtDesenha(el){
  const left = restRestante(), total = Math.max(1, restTotalSeg || left || 1);
  const pausado = restPausaRestante != null;
  const mm = Math.floor(left/60), ss = left % 60, txt = `${mm}:${String(ss).padStart(2,'0')}`;
  const frac = Math.max(0, Math.min(1, left/total));
  el.querySelectorAll('.rt2-arco').forEach(c=>{ const C = +c.dataset.c; c.style.strokeDashoffset = (C*(1-frac)).toFixed(2); });
  const t = el.querySelector('.rt-tempo'); if(t && t.textContent !== txt) t.textContent = txt;
  const mt = el.querySelector('.rt2-mt'); if(mt && mt.textContent !== txt) mt.textContent = txt;
  const fase = pausado ? 'pausa' : _rtFase(left, total);
  ['ok','aviso','fim','pausa'].forEach(f=>el.classList.toggle('f-' + f, f === fase));
  const sub = el.querySelector('.rt-sub'); if(sub) sub.textContent = pausado ? 'Pausado' : 'Descanso';
  const bp = el.querySelector('.rt-pausa'); if(bp){ const h = pausado ? `${RT_ICO.play}<span>Continuar</span>` : `${RT_ICO.pausa}<span>Pausar</span>`;
    if(bp.dataset.h !== h){ bp.innerHTML = h; bp.dataset.h = h; } bp.setAttribute('aria-label', pausado ? 'Continuar o descanso' : 'Pausar o descanso'); }
  const bm = el.querySelector('.rt-som'); if(bm){ const h = restMuted ? RT_ICO.mudo : RT_ICO.som; if(bm.dataset.h !== h){ bm.innerHTML = h; bm.dataset.h = h; }
    bm.classList.toggle('off', !!restMuted); bm.setAttribute('aria-pressed', restMuted ? 'false' : 'true'); bm.setAttribute('aria-label', restMuted ? 'Som desligado: tocar para ligar' : 'Som ligado: tocar para desligar'); }
  const bv = el.querySelector('.rt2-vib'); if(bv){ const on = restVibrarLigado(); if(bv.dataset.h !== String(on)){ bv.innerHTML = RT_ICO.vib; bv.dataset.h = String(on); }
    bv.classList.toggle('off', !on); bv.setAttribute('aria-pressed', on ? 'true' : 'false'); bv.setAttribute('aria-label', on ? 'Vibração ligada: tocar para desligar' : 'Vibração desligada: tocar para ligar'); }
  const px = el.querySelector('.rt2-prox'); if(px){ const h = _rtProx(); if(px.innerHTML !== h) px.innerHTML = h; }
  const mini = el.querySelector('.rt2-mini'); if(mini) mini.setAttribute('aria-label', `Descanso: faltam ${mm ? mm + ' min ' : ''}${ss} s. Tocar para abrir o cronômetro`);
  rtPosiciona();
}
// o desenho do núcleo continua valendo para qualquer elemento antigo; o novo (.rt2) é desenhado aqui
(function(){
  const _desenha = window.restDesenha;
  window.restDesenha = function(){
    const el = _rtEl || $('rest-timer-banner');
    if(el && el.classList.contains('rt2')) return _rtDesenha(el);
    return _desenha.apply(this, arguments);
  };
  const _inicia = window.startRestTimer;
  window.startRestTimer = function(seconds, exName){
    const r = _inicia.apply(this, arguments);
    try{
      const el = $('rest-timer-banner'); if(!el) return r;
      _rtEl = el;
      try{ _rtEx = (curLog && curLog.exId) ? { id:curLog.exId, name:curLog.exName || exName || '' } : (exName ? { id:null, name:exName } : null); }catch(e){ _rtEx = null; }
      const noRegistro = !!document.getElementById('rt-dock');
      if(!noRegistro) _rtModo = 'min';
      el.className = 'rt2' + (noRegistro ? ' doca' : ' min');
      el.innerHTML = _rtMarkup();
      restDesenha();
    }catch(e){ console.log('cronômetro (desenho):', e); }
    return r;
  };
  const _para = window.stopRestTimer;
  window.stopRestTimer = function(){
    const el = _rtEl; _rtEl = null;
    const r = _para.apply(this, arguments);
    try{ if(el && el.parentNode) el.remove(); }catch(e){}
    return r;
  };
})();
function rtExpandir(){ _rtModo = 'exp'; restDesenha(); }
function rtMinimizar(){ _rtModo = 'min'; restDesenha(); }
function rtPular(){ if(!restTimerInt) return; stopRestTimer(); toast('Descanso encerrado. Bora para a próxima série!'); }
function rtVibrar(){ setRestVibrar(!restVibrarLigado()); restDesenha(); }
function rtVoltarTreino(){
  const ex = _rtEx; _rtModo = 'min';
  try{
    goTab('sessions');
    const ws = ((state.modules.lift||{}).plan||{}).workouts || [];
    const existe = ex && ex.id && (ws.some(w=>(w.exercises||[]).some(e=>e.id === ex.id)) || (typeof extrasDeHoje === 'function' && extrasDeHoje().some(e=>e.id === ex.id)));
    if(existe) openSetLog(ex.id, ex.name);
  }catch(e){ console.log('voltar ao treino:', e); }
  restDesenha();
}
// lugar do cronômetro dentro do registro de séries: logo abaixo das séries (sem cobrir "Salvar")
mtGancho('renderSetLogModal', { depois(){
  try{
    const mi = $('modal-inner'); if(!mi || document.getElementById('rt-dock')) return;
    const ref = mi.querySelector('.sl-auto') || mi.querySelector('.row:last-child');
    const d = document.createElement('div'); d.id = 'rt-dock';
    if(ref) ref.parentNode.insertBefore(d, ref); else mi.appendChild(d);
    if(restTimerInt) restDesenha();
  }catch(e){}
}});
mtGancho('closeModal', { depois(){ try{ if(restTimerInt) restDesenha(); }catch(e){} }});
window.addEventListener('resize', ()=>{ try{ if(restTimerInt) rtPosiciona(); }catch(e){} }, { passive:true });

(function(){ if(document.getElementById('rt2-css')) return; const s = document.createElement('style'); s.id = 'rt2-css';
s.textContent = `
.rt2{--rt-cor:var(--primary);color:var(--text);font-variant-numeric:tabular-nums}
.rt2.f-aviso{--rt-cor:#f2b705}
.rt2.f-fim{--rt-cor:var(--danger)}
.rt2.f-pausa{--rt-cor:var(--text-mute)}
[data-theme="claro"] .rt2.f-aviso,[data-theme="areia"] .rt2.f-aviso{--rt-cor:#b7791f}
.rt2 svg{display:block}
.rt2 .rt2-ic svg,.rt2 .rt2-b svg,.rt2-tit svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.rt2-trilho{fill:none;stroke:var(--surface-2);stroke-width:8}
.rt2-arco{fill:none;stroke:var(--rt-cor);stroke-width:8;stroke-linecap:round;transition:stroke-dashoffset .26s linear,stroke .6s ease}
.rt2-svg,.rt2-msvg{transform:rotate(-90deg)}
.rt2-msvg .rt2-trilho,.rt2-msvg .rt2-arco{stroke-width:4}
/* cartão (flutuando ou dentro do registro) */
.rt2:not(.min){background:var(--bg-2);border:1.5px solid var(--rt-cor);border:1.5px solid color-mix(in srgb,var(--rt-cor) 70%,transparent);border-radius:var(--radius-card,18px);padding:12px 14px;box-shadow:var(--shadow-md);transition:border-color .6s ease}
.rt2.exp{position:fixed;left:12px;right:12px;bottom:calc(86px + env(safe-area-inset-bottom));z-index:350;max-width:520px;margin:0 auto}
.rt2.doca{position:relative;margin:12px 0 4px;box-shadow:none}
.rt2-topo{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.rt2-tit{flex:1;min-width:0;display:flex;align-items:center;gap:6px;font-weight:800;font-size:13.5px;color:var(--text-dim)}
.rt2-tit span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rt2-tit svg{color:var(--rt-cor);flex:none}
.rt2.doca .rt2-btmin{display:none}
.rt2-ic{width:40px;height:40px;flex:none;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--text);display:grid;place-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent}
.rt2-ic.off{color:var(--text-mute)}
.rt2-corpo{display:flex;align-items:center;gap:14px}
.rt2-anel{position:relative;width:124px;height:124px;flex:none}
.rt2-anel .rt2-svg{width:100%;height:100%}
.rt2-centro{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
.rt2 .rt-tempo{font-weight:900;font-size:32px;line-height:1;color:var(--text-strong,var(--text));letter-spacing:-.5px}
.rt2 .rt-sub{font-size:11.5px;color:var(--text-dim);margin-top:4px;font-weight:700}
.rt2.f-fim .rt-tempo{color:var(--rt-cor);animation:rt2Pulso 1s ease-in-out infinite}
@keyframes rt2Pulso{50%{transform:scale(1.07)}}
.rt2-lado{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
.rt2-prox{font-size:12.5px;color:var(--text-dim);min-height:16px}
.rt2-prox:empty{display:none}
.rt2-botoes{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.rt2-b{min-height:42px;padding:6px 4px;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--text);font:inherit;font-size:13px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;-webkit-tap-highlight-color:transparent}
.rt2-b:active,.rt2-ic:active,.rt2-mini:active{transform:scale(.96)}
.rt2-b.rt-pausa{background:var(--surface-2);border-color:var(--rt-cor);background:color-mix(in srgb,var(--rt-cor) 16%,var(--surface));border-color:color-mix(in srgb,var(--rt-cor) 45%,transparent)}
.rt2-linha{display:flex;gap:6px;align-items:center}
.rt2-voltar{flex:1;min-height:40px;border-radius:12px;border:none;background:var(--primary);color:var(--on-primary,#000);font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.rt2.doca .rt2-voltar{display:none}
/* dentro do registro: anel maior, centralizado */
.rt2.doca .rt2-corpo{flex-direction:column;gap:10px}
.rt2.doca .rt2-anel{width:150px;height:150px}
.rt2.doca .rt-tempo{font-size:38px}
.rt2.doca .rt2-lado{width:100%}
.rt2.doca .rt2-prox{text-align:center}
.rt2.doca .rt2-botoes{grid-template-columns:repeat(4,1fr)}
.rt2.doca .rt2-linha{justify-content:center}
/* pílula */
.rt2-mini{display:none}
.rt2.min{position:fixed;right:12px;bottom:calc(92px + env(safe-area-inset-bottom));z-index:350}
.rt2.min .rt2-cheio{display:none}
.rt2.min .rt2-mini{display:flex;align-items:center;gap:8px;height:44px;padding:0 14px 0 8px;border-radius:99px;border:1.5px solid var(--rt-cor);border:1.5px solid color-mix(in srgb,var(--rt-cor) 65%,transparent);background:var(--bg-2);color:var(--text);box-shadow:var(--shadow-md);font:inherit;font-weight:900;font-size:16px;cursor:pointer;transition:border-color .6s ease;-webkit-tap-highlight-color:transparent}
.rt2-msvg{width:30px;height:30px}
.rt2.f-fim .rt2-mt{color:var(--rt-cor)}
@media (max-width:360px){ .rt2-anel{width:104px;height:104px} .rt2 .rt-tempo{font-size:27px} .rt2-b{font-size:12px} .rt2.doca .rt2-botoes{grid-template-columns:1fr 1fr} }
@media (prefers-reduced-motion:reduce){ .rt2-arco{transition:none} .rt2.f-fim .rt-tempo{animation:none} }
body:has(#rest-timer-banner.min) #toast-wrap{bottom:calc(150px + env(safe-area-inset-bottom))}
body:has(#modal-back.on):has(#rest-timer-banner) #toast-wrap{bottom:auto}
html.mt-desk .rt2.exp{left:auto;right:24px;width:420px}
`; document.head.appendChild(s); })();


// =====================================================================
// 43. Beta 41 — Transições, montagem do plano, fundos decorativos novos e desempenho
// =====================================================================
// Um sistema só de movimento (tokens --mt-* no CSS "Beta 41"): entradas curtas, a mesma curva em tudo e
// nada quando o aparelho pede menos movimento (prefers-reduced-motion). Nenhuma espera inventada: a tela de
// montagem acompanha as etapas reais e ficou mais curta.

const MT_POUCO_MOV = (()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)'); }catch(e){ return { matches:false }; } })();
function mtMovimentoOk(){ return !MT_POUCO_MOV.matches; }
// celulares/tablets (toque): sem desfoque de fundo atrás da barra e das janelas — é o efeito que mais
// pesa na GPU de Androids simples, e a barra já é quase opaca
try{ if(matchMedia('(pointer:coarse)').matches) document.documentElement.classList.add('mt-toque'); }catch(e){}

// ---------- desempenho: funções chamadas centenas de vezes por tela ----------
// slug(): o mesmo nome era normalizado repetidas vezes (≈20% do tempo de troca de aba no perfil medido)
const _slugCache = new Map(); const _slugOrig = window.slug;
window.slug = function(s){
  const k = String(s == null ? '' : s);
  let v = _slugCache.get(k);
  if(v === undefined){ v = _slugOrig(k); if(_slugCache.size > 6000) _slugCache.clear(); _slugCache.set(k, v); }
  return v;
};
// datas e números: um formatador por formato, em vez de criar um novo a cada chamada
const _fmtData = new Map();
window.mtFmtData = function(t, opt){
  const k = opt ? JSON.stringify(opt) : '';
  let f = _fmtData.get(k);
  if(!f){ try{ f = new Intl.DateTimeFormat('pt-BR', opt || { day:'2-digit', month:'2-digit' }); }catch(e){ f = null; } _fmtData.set(k, f); }
  return f ? f.format(new Date(t)) : new Date(t).toLocaleDateString('pt-BR', opt||{day:'2-digit', month:'2-digit'});
};
const _fmtKm = [new Intl.NumberFormat('pt-BR',{minimumFractionDigits:0, maximumFractionDigits:1}), new Intl.NumberFormat('pt-BR',{minimumFractionDigits:1, maximumFractionDigits:1})];
window.mtFmtKm = function(v){ const r = Math.round((+v||0)*10)/10; return _fmtKm[(Math.round(v*10)%10) ? 1 : 0].format(r); };
// tamanho em bytes sem criar um Blob do estado inteiro a cada vez
function _utf8Len(s){ let n = s.length; for(let i=0;i<s.length;i++){ const c = s.charCodeAt(i); if(c > 0x7f){ if(c <= 0x7ff) n += 1; else if(c >= 0xd800 && c <= 0xdbff) n += 2; else if(c >= 0xdc00 && c <= 0xdfff) n += 0; else n += 2; } } return n; }
if(typeof window._bytesDe === 'function') window._bytesDe = function(obj){ try{ return _utf8Len(JSON.stringify(obj)); }catch(e){ return 0; } };
if(typeof window.arqTamanhoDoc === 'function'){
  const _tamOrig = window.arqTamanhoDoc; let _tamK = null, _tamV = 0;
  window.arqTamanhoDoc = function(){ const k = state && state._savedAt; if(k && k === _tamK) return _tamV; _tamV = _tamOrig(); _tamK = k; return _tamV; };
}
// fundo decorativo: uma medição por quadro (antes eram três seguidas, cada uma forçando o layout)
window._decoAgenda = function(){
  cancelAnimationFrame(window.__decoRaf); clearTimeout(window.__decoTo);
  window.__decoRaf = requestAnimationFrame(()=>{ decoPosiciona(); window.__decoTo = setTimeout(decoPosiciona, 220); });
};

// ---------- transições ----------
// troca de conteúdo dentro da mesma janela (ex.: lista de conquistas → detalhe): entrada curta, sem piscar
(function(){
  const mi = document.getElementById('modal-inner'); if(!mi || !window.MutationObserver) return;
  let ult = 0;
  new MutationObserver(()=>{
    if(!mtMovimentoOk() || !mi.animate) return;
    const back = document.getElementById('modal-back'); if(!back || !back.classList.contains('on')) return;
    const t = performance.now(); if(t - ult < 120) return; ult = t;
    try{ mi.animate([{ opacity:.55, transform:'translateY(6px)' }, { opacity:1, transform:'none' }], { duration:180, easing:'cubic-bezier(.2,.8,.2,1)' }); }catch(e){}
  }).observe(mi, { childList:true });
})();
// mudança de tema: cores passam suavemente (só nas superfícies principais, por 350 ms)
const _setThemeB41 = window.setTheme;
window.setTheme = function(){
  const h = document.documentElement;
  if(mtMovimentoOk()){ h.classList.add('tema-transicao'); clearTimeout(window.__temaTo); window.__temaTo = setTimeout(()=>h.classList.remove('tema-transicao'), 380); }
  return _setThemeB41.apply(this, arguments);
};

// ---------- montagem do plano ----------
// As etapas são as mesmas (reais). Antes eram até 6 × 0,9–1,1 s (~6 s de espera); agora cada etapa
// marca em ~1,1 s (Beta 42) — tempo de ler o que foi considerado, sem fingir processamento. No fim, o título vira
// "Plano pronto" e a tela de treinos entra com os dias e exercícios em sequência.
const _buildB41 = window.runBuildingScreen;
window.runBuildingScreen = function(m, steps, done, opts){
  opts = Object.assign({}, opts || {});
  // Beta 42: 0,36 s por etapa era rápido demais para ler. Cada etapa fica ~1,1 s (o máximo da tela de
  // montagem) e o "Plano pronto" fica ~1 s visível antes de abrir o plano. Continua sem espera inventada:
  // são as mesmas etapas reais, e o plano já está gerado quando a tela aparece.
  opts.passo = 1100; opts.final = 1000;
  const fim = function(){
    window.__mtPlanoNovo = Date.now();
    if(typeof done === 'function') return done.apply(this, arguments);
  };
  const r = _buildB41.call(this, m, steps, fim, opts);
  try{
    const ov = document.getElementById('building-ov'); const bar = document.getElementById('mb-bar');
    if(ov && bar && window.MutationObserver){
      const t = ov.querySelector('.mb-t');
      const obs = new MutationObserver(()=>{ if(parseFloat(bar.style.width) >= 100){ ov.classList.add('mb-pronto'); if(t) t.textContent = m === 'run' ? 'Plano de corrida pronto' : 'Plano pronto'; obs.disconnect(); } });
      obs.observe(bar, { attributes:true, attributeFilter:['style'] });
    }
  }catch(e){}
  return r;
};
mtGancho('renderSessions', { depois(){
  const novo = window.__mtPlanoNovo && Date.now() - window.__mtPlanoNovo < 4000;
  if(!novo || !mtMovimentoOk()) return;
  window.__mtPlanoNovo = 0;
  ['sessions-chips', 'session-detail-slot'].forEach(id=>{ const el = document.getElementById(id); if(!el) return; el.classList.remove('mt-entra'); void el.offsetWidth; el.classList.add('mt-entra'); });
}});
// trocar de dia na tela de treinos: os exercícios entram em sequência curta (não ao reabrir a mesma)
mtGancho('selectSession', { depois(){
  if(!mtMovimentoOk()) return;
  const el = document.getElementById('session-detail-slot'); if(!el) return;
  el.classList.remove('mt-entra'); void el.offsetWidth; el.classList.add('mt-entra');
}});

// ---------- fundos decorativos (Beta 41) ----------
// Linguagem nova, abstrata e esportiva: um brilho suave na cor do tema, linhas de movimento (raias, curvas
// de nível, traços de velocidade), uma trama de pontos e UM elemento de destaque ligado à aba. Tudo vetorial,
// parado (sem gasto de bateria), translúcido e preso à faixa do topo — nunca atrás de cartões.
const _dpt = (x0,y0,cols,rows,step)=>{ let s=''; for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) s += `<circle cx="${x0+c*step}" cy="${y0+r*step}" r="1.15"/>`; return `<g class="d-pt">${s}</g>`; };
const _arcos = (cx,cy,r0,n,gap,a0,a1)=>{ let s=''; for(let i=0;i<n;i++){ const r=r0+i*gap; const p=(a)=>[cx+r*Math.cos(a*Math.PI/180), cy+r*Math.sin(a*Math.PI/180)].map(v=>v.toFixed(1)).join(' ');
  s += `<path class="d-linha" stroke-opacity="${(0.55-i*0.1).toFixed(2)}" d="M${p(a0)}A${r} ${r} 0 0 1 ${p(a1)}"/>`; } return s; };
const _vel = (x,y,n,len,dx)=>{ let s=''; for(let i=0;i<n;i++){ s += `<path class="d-linha" stroke-opacity="${(0.5-i*0.1).toFixed(2)}" d="M${x+i*dx} ${y+i*9}h${len-i*8}"/>`; } return s; };
const _B41 = (corpo)=>DECO3(corpo);
// Beta 42: Perfil, Desafios, Corrida e Histórico voltam a usar os desenhos da Beta 40 (parte 22) — pessoa,
// medalha e pista — e o Histórico ganha um desenho de registros (parte 45). Estes daqui ficam para as outras abas.
Object.assign(DECO2_SVG, {
  musculacao: _B41(`<circle class="d-fundo" cx="176" cy="58" r="54"/>${_dpt(130,14,6,3,9)}${_arcos(188,70,30,3,12,190,330)}
    ${_vel(92,58,3,46,6)}
    <g transform="rotate(-18 172 66)"><path class="d-linha" d="M140 66h64" stroke-width="3"/><rect class="d-acf" x="146" y="50" width="8" height="32" rx="3" stroke="none"/><rect class="d-acf" x="190" y="50" width="8" height="32" rx="3" stroke="none"/><rect class="d-fill" x="138" y="56" width="6" height="20" rx="2.5"/><rect class="d-fill" x="200" y="56" width="6" height="20" rx="2.5"/></g>`),
  biblioteca: _B41(`<circle class="d-fundo" cx="168" cy="58" r="52"/>${_dpt(126,12,7,2,9)}
    <rect class="d-fill" x="140" y="30" width="46" height="34" rx="8" transform="rotate(-8 163 47)"/><rect class="d-fill" x="160" y="40" width="48" height="36" rx="8"/>
    <circle class="d-ac" cx="184" cy="58" r="10" stroke-width="2"/><path class="d-acf" stroke="none" d="M181 53.5l8 4.5-8 4.5z"/>${_vel(100,86,3,44,5)}`),
  plano: _B41(`<circle class="d-fundo" cx="170" cy="60" r="52"/>
    ${[0,1,2,3].map(c=>[0,1,2].map(r=>{ const on = (c+r)%3===0; return `<rect class="${on?'d-acf':'d-fill'}" ${on?'stroke="none"':''} x="${134+c*18}" y="${30+r*18}" width="12" height="12" rx="3.5"/>`; }).join('')).join('')}
    ${_arcos(170,60,46,2,10,200,330)}${_dpt(110,22,3,4,9)}`),
  progresso: _B41(`<circle class="d-fundo" cx="172" cy="58" r="50"/>${_dpt(124,14,7,2,9)}
    <path class="d-fill" stroke="none" d="M112 98L138 80l20 8 24-22 26-24V98z"/><path class="d-ac" d="M112 98L138 80l20 8 24-22 26-24" stroke-width="2.4"/>
    <circle class="d-acf" cx="208" cy="42" r="3.5" stroke="none"/><path class="d-linha" d="M112 98h96" stroke-opacity=".5"/>`),
  admin: _B41(`<circle class="d-fundo" cx="170" cy="58" r="50"/>${_dpt(118,14,4,3,9)}
    <rect class="d-fill" x="146" y="22" width="52" height="70" rx="9"/><path class="d-ac" d="M155 42l4 4 8-9M155 60l4 4 8-9" stroke-width="2.2"/><path class="d-linha" d="M172 43h18M172 61h18M155 78h34" stroke-opacity=".7"/>`),
  montarMusculacao: _B41(`<circle class="d-fundo" cx="170" cy="60" r="50"/>${_dpt(116,16,4,4,9)}
    <rect class="d-fill" x="138" y="24" width="64" height="74" rx="10"/><path class="d-linha" d="M150 42h28M150 54h40" stroke-opacity=".7"/>
    <path class="d-ac" d="M152 78h28M148 72v12M184 72v12" stroke-width="2.4"/>`),
  montarCorrida: _B41(`<circle class="d-fundo" cx="170" cy="60" r="50"/>${_dpt(112,16,3,4,9)}
    <path class="d-ac" d="M128 96c18-6 24-26 42-28s26-16 28-38" stroke-width="2.2" stroke-dasharray="2 7"/>
    <circle class="d-acf" cx="128" cy="96" r="4.5" stroke="none"/><path class="d-ac" d="M198 30V12" stroke-width="2.2"/><path class="d-acf" stroke="none" d="M198 12h15l-4 5 4 5h-15z"/>`)
});
// desenhos já montados na tela trocam na próxima atualização
try{ const el = document.getElementById('app-deco'); if(el) delete el.dataset.k; }catch(e){}

Object.assign(window, { mtMovimentoOk });

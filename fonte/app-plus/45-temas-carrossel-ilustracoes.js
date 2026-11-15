
// =====================================================================
// 45. Beta 42 — Escolha de tema em carrossel e ilustrações de Histórico e Corrida
// =====================================================================
// Um componente só (mtTemaCarrossel) no cadastro e em Perfil › Aparência: um tema por vez, deslizando para
// os lados (ou pelas setas/pontos/teclado), com uma prévia grande do próprio app naquele tema. A prévia usa
// as variáveis do tema (data-theme), então é fiel e instantânea; "Usar este tema" aplica no app. Regras de
// Básico × Premium, cores dos temas e a preferência salva continuam as mesmas (setTheme de sempre).

function _tcOrdem(){
  const base = (typeof TEMA_ORDEM_CAD !== 'undefined' ? TEMA_ORDEM_CAD : Object.keys(THEMES)).filter(k=>THEMES[k]);
  Object.keys(THEMES).forEach(k=>{ if(!base.includes(k)) base.push(k); });
  return base;
}
function _tcPrevia(k){
  return `<div class="tc-prev" data-theme="${k}" aria-hidden="true">
    <div class="tcp-top"><i class="tcp-logo"></i><span><b></b><em></em></span><i class="tcp-av"></i></div>
    <div class="tcp-ola"><b></b><em></em></div>
    <div class="tcp-card"><div class="tcp-l1"><b></b><i class="tcp-chip"></i></div><div class="tcp-barra"><i></i></div>
      <div class="tcp-stats"><span><b></b><em></em></span><span><b></b><em></em></span><span><b></b><em></em></span></div></div>
    <div class="tcp-btn"></div>
    <div class="tcp-tab"><i class="on"></i><i></i><i></i><i></i><i></i></div>
  </div>`;
}
function mtTemaCarrossel(host, ctx){
  if(!host) return;
  const ordem = _tcOrdem(), cur = currentTheme();
  const premiumOk = k=>(typeof temaLiberado === 'function') ? temaLiberado(k) : true;
  const ehPrem = k=>(typeof temaPremium === 'function') ? temaPremium(k) : !!THEMES[k].premium;
  host.classList.add('tc-host');
  host.innerHTML = `<div class="tc" data-ctx="${ctx}">
    <div class="tc-trilho" role="listbox" aria-label="Temas do app — deslize para os lados" tabindex="0">
      ${ordem.map((k,i)=>`<div class="tc-slide${k===cur?' on':''}${premiumOk(k)?'':' trava'}" role="option" aria-selected="${k===cur}" aria-label="Tema ${mtEsc(THEMES[k].nome)}${ehPrem(k)?' (Premium)':''}" data-k="${k}" data-i="${i}" onclick="mtTcToque(this)">
        ${_tcPrevia(k)}${k===cur?'<span class="tc-sel" aria-hidden="true">✓</span>':''}${ctx==='cadastro' && k==='areia'?'<span class="tc-sug">Sugerido</span>':''}</div>`).join('')}
    </div>
    <div class="tc-info">
      <button type="button" class="tc-seta" aria-label="Tema anterior" onclick="mtTcPasso(this,-1)">‹</button>
      <div class="tc-nome" aria-live="polite"></div>
      <button type="button" class="tc-seta" aria-label="Próximo tema" onclick="mtTcPasso(this,1)">›</button>
    </div>
    <div class="tc-pontos">${ordem.map((k,i)=>`<button type="button" class="tc-ponto" aria-label="${mtEsc(THEMES[k].nome)}" onclick="mtTcIr(this,${i})"></button>`).join('')}</div>
    <button type="button" class="btn btn-primary btn-block tc-usar" onclick="mtTcUsar(this)"></button>
  </div>`;
  const tc = host.querySelector('.tc'), tr = tc.querySelector('.tc-trilho');
  tc._ordem = ordem; tc._idx = Math.max(0, ordem.indexOf(cur));
  let raf = 0;
  tr.addEventListener('scroll', ()=>{ cancelAnimationFrame(raf); raf = requestAnimationFrame(()=>_tcAtualiza(tc)); }, { passive:true });
  tr.addEventListener('keydown', e=>{ if(e.key === 'ArrowRight'){ e.preventDefault(); _tcVai(tc, tc._idx+1); } else if(e.key === 'ArrowLeft'){ e.preventDefault(); _tcVai(tc, tc._idx-1); } else if(e.key === 'Enter'){ e.preventDefault(); mtTcUsar(tc); } });
  requestAnimationFrame(()=>{ _tcVai(tc, tc._idx, true); _tcInfo(tc); });
}
function _tcDe(el){ return el && el.closest ? el.closest('.tc') : el; }
function _tcVai(tc, i, instant){
  const n = tc._ordem.length; i = Math.max(0, Math.min(n-1, i));
  const tr = tc.querySelector('.tc-trilho'), s = tr.children[i]; if(!s) return;
  const alvo = s.offsetLeft - (tr.clientWidth - s.clientWidth)/2;
  try{ tr.scrollTo({ left:alvo, behavior: instant || !(typeof mtMovimentoOk!=='function' || mtMovimentoOk()) ? 'auto' : 'smooth' }); }catch(e){ tr.scrollLeft = alvo; }
  tc._idx = i; _tcInfo(tc);
}
function _tcAtualiza(tc){
  const tr = tc.querySelector('.tc-trilho'); const meio = tr.scrollLeft + tr.clientWidth/2;
  let melhor = 0, dist = 1e9;
  [...tr.children].forEach((s,i)=>{ const d = Math.abs(s.offsetLeft + s.clientWidth/2 - meio); if(d < dist){ dist = d; melhor = i; } });
  if(melhor !== tc._idx){ tc._idx = melhor; _tcInfo(tc); }
}
function _tcInfo(tc){
  const k = tc._ordem[tc._idx]; const t = THEMES[k]; if(!t) return;
  const cur = currentTheme(); const livre = (typeof temaLiberado === 'function') ? temaLiberado(k) : true;
  const prem = (typeof temaPremium === 'function') ? temaPremium(k) : !!t.premium;
  tc.querySelector('.tc-nome').innerHTML = `<b>${mtEsc(t.nome)}</b>${tc.dataset.ctx==='cadastro' && k==='areia'?'<span class="tc-atual">Sugerido</span>':''}${prem?`<span class="pl-mini tc-prem">${typeof PL_EST!=='undefined'?PL_EST:''}Premium</span>`:''}${k===cur?'<span class="tc-atual">Selecionado</span>':''}<small>${mtEsc(t.sub||'')}</small>`;
  tc.querySelectorAll('.tc-ponto').forEach((p,i)=>{ p.classList.toggle('on', i===tc._idx); p.setAttribute('aria-current', i===tc._idx ? 'true' : 'false'); });
  [...tc.querySelectorAll('.tc-slide')].forEach((s,i)=>s.classList.toggle('foco', i===tc._idx));
  const b = tc.querySelector('.tc-usar');
  b.disabled = false; b.classList.toggle('btn-ghost', k===cur || !livre); b.classList.toggle('btn-primary', !(k===cur || !livre));
  b.textContent = k===cur ? '✓ Tema em uso' : (!livre ? 'Disponível no Premium' : 'Usar este tema');
  const setas = tc.querySelectorAll('.tc-seta'); setas[0].disabled = tc._idx === 0; setas[1].disabled = tc._idx === tc._ordem.length-1;
}
function mtTcPasso(el, d){ const tc = _tcDe(el); _tcVai(tc, tc._idx + d); }
function mtTcIr(el, i){ _tcVai(_tcDe(el), i); }
function mtTcToque(slide){ const tc = _tcDe(slide); const i = +slide.dataset.i; if(i !== tc._idx) return _tcVai(tc, i); mtTcUsar(tc); }
function mtTcUsar(el){
  const tc = _tcDe(el); const k = tc._ordem[tc._idx]; if(!k || k === currentTheme()) return;
  const ctx = tc.dataset.ctx; const host = tc.parentNode; const idx = tc._idx;
  if(ctx === 'cadastro' && typeof wzEscolheTema === 'function') wzEscolheTema(k);   // setTheme + guarda na conta
  else setTheme(k);                                                                   // aviso Premium se travado
  if(currentTheme() !== k) return;                                                    // não aplicou (Premium)
  mtTemaCarrossel(host, ctx);
  const novo = host.querySelector('.tc'); if(novo){ novo._idx = idx; requestAnimationFrame(()=>_tcVai(novo, idx, true)); }
  try{ const rv = $('theme-row-val'); if(rv) rv.textContent = (temaClaro(k)?'Tema Claro':'Tema Noturno')+' · '+THEMES[k].nome+' ›'; }catch(e){}
}
// cadastro: o carrossel no lugar da grade de 10
window.wzRenderTemas = function(){ const box = $('wz-temas'); if(box) mtTemaCarrossel(box, 'cadastro'); try{ if(typeof wzRenderIcones === 'function') wzRenderIcones(); }catch(e){} };   // o estilo dos ícones continua junto
window.wzEscolheTema = function(k){ setTheme(k); };
// Perfil › Aparência: o carrossel no lugar das duas grades (Noturno/Claro)
const _openAparenciaB42 = window.openAparencia;
window.openAparencia = function(){
  _openAparenciaB42.apply(this, arguments);
  try{
    const mi = $('modal-inner'); const grades = mi.querySelectorAll('.ap-grid'); if(!grades.length) return;
    grades.forEach(g=>{ const t = g.previousElementSibling; if(t && t.classList.contains('mt-sec')) t.remove(); });
    const host = document.createElement('div'); grades[0].before(host); grades.forEach(g=>g.remove());
    const tit = document.createElement('div'); tit.className = 'mt-sec'; tit.style.marginTop = '6px'; tit.textContent = 'Tema'; host.before(tit);
    mtTemaCarrossel(host, 'perfil');
  }catch(e){ console.log('aparência (carrossel):', e); }
};

// ---------- Ilustrações ----------
// Histórico: registros e evolução (ficha com treinos feitos e a linha de progresso subindo); Corrida: a pista
// da Beta 40 com um corredor. Perfil e Desafios voltaram aos desenhos da Beta 40 (pessoa; medalha).
Object.assign(DECO2_SVG, {
  historico: DECO3(`<circle class="d-fundo" cx="166" cy="60" r="50"/>
    <rect class="d-fill" x="124" y="18" width="66" height="84" rx="10"/>
    <path class="d-ac" d="M134 38l4 4 7-8M134 56l4 4 7-8M134 74l4 4 7-8" stroke-width="2.1"/>
    <path class="d-linha" d="M152 38h26M152 56h20M152 74h24" stroke-opacity=".7"/>
    <path class="d-ac" d="M150 96l14-10 12 4 20-18" stroke-width="2.4"/><path class="d-acf" stroke="none" d="M201 68l-1 11-9-6z"/>`),
  corrida: DECO3(`<circle class="d-fundo" cx="172" cy="64" r="48"/>
    <path class="d-fill" d="M96 120a124 124 0 0 1 124-124v26a98 98 0 0 0-98 98z"/>
    <path class="d-linha" d="M96 120a124 124 0 0 1 124-124M122 120a98 98 0 0 1 98-98"/>
    <path class="d-ac" d="M109 120a111 111 0 0 1 111-111" stroke-width="2.2" stroke-dasharray="2 7"/>
    <g transform="translate(150 44)"><circle class="d-acf" cx="14" cy="4" r="5" stroke="none"/>
      <path class="d-ac" d="M12 11l-5 13 9 5 -4 13M7 24l-9 9M12 13l10 6 7-4M10 15l-8 2-5 7" stroke-width="3"/></g>`)
});
try{ const el = document.getElementById('app-deco'); if(el) delete el.dataset.k; }catch(e){}

Object.assign(window, { mtTemaCarrossel, mtTcPasso, mtTcIr, mtTcToque, mtTcUsar });

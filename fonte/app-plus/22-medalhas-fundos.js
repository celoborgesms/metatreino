
// =====================================================================
// 37. Beta 25 — Medalhas maiores e com profundidade; fundos decorativos novos
// =====================================================================

// ---------- Medalhas ----------
// Mesmo desenho de cada conquista (o glifo e o rótulo próprios de cada uma), agora:
//  • símbolo ~25% maior dentro da moldura;
//  • profundidade: brilho no alto do disco, sombra interna e aro duplo;
//  • três níveis visuais:
//      comum    → aro simples
//      rara     → aro duplo (as conquistas mais difíceis de cada categoria: o último terço)
//      especial → aro com ornamento dourado (conquistas secretas)
//  Nada muda nos critérios ou nos ids — só o desenho.
function medalNivel(t){
  if(!t) return 'comum';
  if(t.secret) return 'especial';
  const mesma = TROPHIES.filter(x=>!x.secret && x.cat===t.cat);
  const i = mesma.findIndex(x=>x.id===t.id);
  return (mesma.length >= 3 && i >= Math.ceil(mesma.length*2/3)) ? 'rara' : 'comum';
}
window.medalSvg = function(glyph, label, extra, nivel){
  const g = TROPHY_GLYPH[glyph] || TROPHY_GLYPH.medal;
  // glifo de 24 u. ampliado: 30 u. sem rótulo, 25 u. com rótulo (o número fica embaixo)
  const esc = label ? 1.05 : 1.25, tam = 24*esc;
  const gx = 24 - tam/2, gy = label ? 4.6 : 24 - tam/2;
  const aro = nivel === 'especial'
    ? `<circle class="tb-orn" cx="24" cy="24" r="23.2"/><circle class="tb-ring" cx="24" cy="24" r="21.6"/>`
    : nivel === 'rara'
      ? `<circle class="tb-ring" cx="24" cy="24" r="22.4"/><circle class="tb-ring2" cx="24" cy="24" r="20.3"/>`
      : `<circle class="tb-ring" cx="24" cy="24" r="22"/>`;
  return `<svg viewBox="0 0 48 48">${extra||''}${aro}<circle class="tb-in" cx="24" cy="24" r="18.5"/>`
    + `<path class="tb-luz" d="M8.2 21.5A16 16 0 0 1 39.8 21.5A19 14 0 0 0 8.2 21.5Z"/><circle class="tb-sombra" cx="24" cy="24" r="18"/>`
    + `<g class="tb-g" transform="translate(${gx.toFixed(2)} ${gy.toFixed(2)}) scale(${esc})">${g}</g>`
    + `${label?`<text x="24" y="41.6" class="tb-l">${mtEsc(label)}</text>`:''}</svg>`;
};
window.trophyIco = function(t, dim){
  if(!t) return '';
  const def = TROPHY_ICO[t.id] || ['medal'];
  const cat = t.secret ? 'secret' : (t.cat||'geral');
  const nv = medalNivel(t);
  return `<span class="tbadge ${cat} nv-${nv}${dim?' dim':''}" role="img" aria-label="${mtEsc(t.name||'')}">${medalSvg(def[0], def[1], '', nv)}</span>`;
};
// detalhe da conquista: medalha bem maior e selo do nível
mtGancho('openTrophyDetail', { depois(id){
  const t = TROPHIES.find(x=>x.id===id); const box = $('modal-inner'); if(!t || !box) return;
  const med = box.querySelector('.tr-medal'); if(med) med.classList.add('tr-grande');
  const nome = box.querySelector('h3'); const nv = medalNivel(t);
  if(nome && !box.querySelector('.tr-nivel')){
    const s = document.createElement('div'); s.className = 'tr-nivel nv-' + nv;
    s.textContent = nv === 'especial' ? 'Especial' : nv === 'rara' ? 'Rara' : 'Comum';
    nome.before(s);
  }
}});

// ---------- Fundos decorativos (Beta 36: nova linguagem visual e curadoria por aba) ----------
// Cada desenho fica numa "faixa" no topo da aba, à direita, entre o cabeçalho e o primeiro cartão:
// a altura é medida na hora (decoPosiciona), então o desenho nunca passa por trás de cartões, bandeiras
// ou listas. Linguagem comum: um disco suave na cor principal (profundidade), formas com preenchimento
// translúcido na cor do texto e um único detalhe na cor principal. SVG parado: sem animação, sem gasto
// de bateria, e some com a opção "Fundo decorativo".
// Curadoria (Beta 36):
//   Início ........ melhorado (cena do horário/clima, parte 28)
//   Treinos ....... substituído (barra e anilhas; corrida: pista em curva)
//   Biblioteca .... substituído (fichas empilhadas com o vídeo)
//   Plano ......... melhorado (calendário com os dias de treino)
//   Desafios ...... melhorado (medalha só na faixa do título; não cruza mais a bandeira do desafio)
//   Perfil ........ mantido (pessoa e arco de evolução), redesenhado na nova linguagem e só na faixa do topo
//   Histórico ..... mantido (relógio voltando no tempo), pequeno, ao lado do título
//   Progresso ..... mantido (gráfico subindo), pequeno, ao lado do título — nunca atrás dos gráficos
const DECO3 = (corpo, vb)=>`<svg viewBox="${vb||'0 0 220 120'}" preserveAspectRatio="xMaxYMid meet" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${corpo}</svg>`;
// classes: .d-fundo (disco na cor principal) · .d-fill (preenchimento translúcido) · .d-ac (traço na cor principal) · .d-acf (preenchimento na cor principal)
const DECO2_SVG = {
  musculacao: DECO3(`<circle class="d-fundo" cx="164" cy="60" r="50"/>
    <path class="d-linha" d="M70 60h142" stroke-width="3.2"/>
    <rect class="d-fill" x="98" y="30" width="14" height="60" rx="4.5"/><rect class="d-fill" x="114" y="39" width="9" height="42" rx="3.5"/>
    <rect class="d-fill" x="180" y="30" width="14" height="60" rx="4.5"/><rect class="d-fill" x="169" y="39" width="9" height="42" rx="3.5"/>
    <path class="d-ac" d="M105 40v40M187 40v40" stroke-width="2.2"/><path class="d-linha" d="M126 56v8M166 56v8" stroke-width="2.4"/>`),
  corrida: DECO3(`<circle class="d-fundo" cx="172" cy="64" r="48"/>
    <path class="d-fill" d="M96 120a124 124 0 0 1 124-124v26a98 98 0 0 0-98 98z"/>
    <path class="d-linha" d="M96 120a124 124 0 0 1 124-124M122 120a98 98 0 0 1 98-98"/>
    <path class="d-ac" d="M109 120a111 111 0 0 1 111-111" stroke-width="2.2" stroke-dasharray="2 7"/>
    <path class="d-linha" d="M150 30l14 8M141 41l14 8" stroke-opacity=".7"/><path class="d-ac" d="M176 8v24" stroke-width="2.2"/><path class="d-acf" d="M176 8h18l-5 6 5 6h-18z" stroke="none"/>`),
  biblioteca: DECO3(`<circle class="d-fundo" cx="160" cy="58" r="50"/>
    <rect class="d-fill" x="130" y="16" width="76" height="54" rx="10" transform="rotate(8 168 43)"/>
    <rect class="d-fill" x="116" y="28" width="80" height="58" rx="11"/>
    <path class="d-linha" d="M130 72h34M130 80h22" stroke-opacity=".7"/>
    <circle class="d-ac" cx="156" cy="50" r="13" stroke-width="2"/><path class="d-acf" d="M152 44l11 6-11 6z" stroke="none"/>`),
  plano: DECO3(`<circle class="d-fundo" cx="166" cy="60" r="50"/>
    <rect class="d-fill" x="112" y="22" width="96" height="80" rx="12"/><path class="d-linha" d="M112 42h96M134 14v16M186 14v16"/>
    <rect class="d-fill" x="124" y="54" width="14" height="12" rx="3"/><rect class="d-acf" x="146" y="54" width="14" height="12" rx="3" stroke="none"/><rect class="d-fill" x="168" y="54" width="14" height="12" rx="3"/><rect class="d-fill" x="190" y="54" width="10" height="12" rx="3"/>
    <rect class="d-acf" x="124" y="76" width="14" height="12" rx="3" stroke="none"/><rect class="d-fill" x="146" y="76" width="14" height="12" rx="3"/><rect class="d-acf" x="168" y="76" width="14" height="12" rx="3" stroke="none"/>`),
  desafios: DECO3(`<circle class="d-fundo" cx="168" cy="62" r="50"/>
    <path class="d-fill" d="M146 8h18l12 30h-18zM190 8h-18l-12 30h18z"/>
    <circle class="d-fill" cx="168" cy="70" r="30"/><circle class="d-ac" cx="168" cy="70" r="21" stroke-width="2"/>
    <path class="d-acf" stroke="none" d="M168 58.5l3.4 7 7.7 1.1-5.6 5.4 1.3 7.7-6.8-3.6-6.8 3.6 1.3-7.7-5.6-5.4 7.7-1.1z"/>`),
  perfil: DECO3(`<circle class="d-fundo" cx="166" cy="62" r="50"/>
    <circle class="d-fill" cx="166" cy="46" r="17"/><path class="d-fill" d="M134 104c3-20 16-32 32-32s29 12 32 32z"/>
    <path class="d-ac" d="M120 84a48 48 0 0 1 78-50" stroke-width="2.4"/><path class="d-acf" stroke="none" d="M203 28l1 15-14-5z"/>`),
  progresso: DECO3(`<circle class="d-fundo" cx="166" cy="60" r="48"/>
    <rect class="d-fill" x="128" y="66" width="14" height="30" rx="3"/><rect class="d-fill" x="150" y="52" width="14" height="44" rx="3"/><rect class="d-fill" x="172" y="38" width="14" height="58" rx="3"/>
    <path class="d-linha" d="M120 96h80" stroke-opacity=".6"/><path class="d-ac" d="M124 56l22-16 20 10 30-24" stroke-width="2.4"/><path class="d-acf" stroke="none" d="M203 21l-2 15-11-10z"/>`),
  historico: DECO3(`<circle class="d-fundo" cx="168" cy="60" r="48"/>
    <circle class="d-fill" cx="168" cy="60" r="32"/><path class="d-linha" d="M168 33v5M168 82v5M141 60h5M190 60h5" stroke-opacity=".7"/>
    <path class="d-ac" d="M168 44v17l11 7" stroke-width="2.4"/><path class="d-ac" d="M126 60a42 42 0 1 0 12-30" stroke-width="2.2"/><path class="d-acf" stroke="none" d="M131 20l11 14-15 3z"/>`)
};
// faixa do topo de cada aba: onde termina (o primeiro bloco de conteúdo) — o desenho fica acima dele
const DECO_FAIXA = {
  sessions:  { fim:'#sess-qlinks' },
  library:   { ini:'.brand', fim:'#lib-count' },
  plan:      { ini:'.brand', fim:'#plan-title' },
  challenges:{ fim:'#chal-root' },
  profile:   { fim:'.profile-head', fimBase:true },
  history:   { ini:'.seg-nav', fim:'.stat-grid' },
  perf:      { ini:'.seg-nav', fim:'#perf-resumo' },
  home:      { ini:'#home-brand-row', fim:'#home-greet-row', fimBase:true }
};
function decoPosiciona(tab){
  const el = document.getElementById('app-deco'); if(!el) return;
  const f = DECO_FAIXA[tab]; const tela = document.querySelector('.screen.active');
  if(!f || !tela || !el.innerHTML){ el.style.removeProperty('--deco-top'); el.style.removeProperty('--deco-h'); return; }
  const sy = window.scrollY || 0;
  const fimEl = tela.querySelector(f.fim), iniEl = f.ini ? tela.querySelector(f.ini) : null;
  if(!fimEl || !fimEl.offsetHeight){ el.style.removeProperty('--deco-top'); el.style.removeProperty('--deco-h'); return; }
  const rf = fimEl.getBoundingClientRect();
  const topo = iniEl && iniEl.offsetHeight ? iniEl.getBoundingClientRect().bottom + sy + 2 : 4;
  const fim = (f.fimBase ? rf.bottom + 4 : rf.top - 6) + sy;
  const h = Math.max(0, Math.round(fim - topo));
  // encosta na borda direita da coluna de conteúdo (no celular é a borda da tela; no computador e no tablet, a coluna)
  const wrap = tela.querySelector('.wrap'); const dir = wrap ? Math.max(0, Math.round(innerWidth - wrap.getBoundingClientRect().right)) : 0;
  el.style.setProperty('--deco-dir', dir + 'px');
  el.style.setProperty('--deco-top', Math.round(topo) + 'px');
  el.style.setProperty('--deco-h', h + 'px');
  el.classList.toggle('deco-baixa', h < 40);   // faixa muito baixa (fonte grande, tela pequena): o desenho some
}
function _decoAgenda(tab){ cancelAnimationFrame(window.__decoRaf); window.__decoRaf = requestAnimationFrame(()=>{ decoPosiciona(tab); setTimeout(()=>decoPosiciona(tab), 180); }); }
window.updateDeco = function(tab){
  const el = document.getElementById('app-deco'); if(!el) return;
  const on = decoEnabled();
  document.body.classList.toggle('no-deco', !on);
  el.classList.add('deco36');
  if(!on){ el.innerHTML = ''; delete el.dataset.k; return; }
  const corrida = state && state.active === 'run';
  const map = { sessions: corrida ? 'corrida' : 'musculacao', challenges:'desafios', library:'biblioteca', plan:'plano', profile:'perfil', history:'historico', perf:'progresso' };
  const k = map[tab];
  if(!k){ el.innerHTML = ''; el.dataset.k = 'sem'; decoPosiciona(tab); return; }   // abas sem desenho
  if(el.dataset.k !== k || !el.innerHTML){ el.dataset.k = k; el.innerHTML = DECO2_SVG[k]; }
  _decoAgenda(tab);
};
window.addEventListener('resize', ()=>{ try{ _decoAgenda(state.ui.tab || 'home'); }catch(e){} }, { passive:true });
Object.assign(window, { decoPosiciona });

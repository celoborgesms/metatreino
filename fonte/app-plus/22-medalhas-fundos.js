
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

// ---------- Fundos decorativos ----------
// Ilustrações em linha (SVG), uma por aba, com dois tons: o traço segue a cor do texto do
// tema e os detalhes seguem a cor principal. Ficam bem discretas (a opacidade do fundo é
// a mesma de antes), não recebem toques e somem com a opção "Fundo decorativo".
const DECO2 = (corpo)=>`<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${corpo}</svg>`;
const DECO2_SVG = {
  // Início (Beta 28): montanha com a bandeira da meta no topo, trilha subindo e o sol nascendo
  inicio: DECO2(`<circle cx="52" cy="50" r="14"/><path d="M52 24v-8M30 34l-6-5M74 34l6-5" stroke-opacity=".7"/>
    <path d="M6 168 58 104l22 22 44-72 70 114"/><path d="M110 76l14-22 14 22-8-4-6 6-6-6z" stroke-opacity=".8"/>
    <path class="dk-a" d="M124 54V18" stroke-width="3"/><path class="dk-a" d="M124 18h30l-8 8 8 8h-30" stroke-width="3"/>
    <path class="dk-a" d="M34 168c22-6 40-14 52-26s20-20 30-30 12-22 6-34" stroke-width="3.2" stroke-dasharray="3 8"/>`),
  // Treinos (musculação): barra com anilhas e um kettlebell
  musculacao: DECO2(`<path d="M30 86h140"/><rect x="40" y="58" width="14" height="56" rx="4"/><rect x="56" y="66" width="10" height="40" rx="3"/><rect x="146" y="58" width="14" height="56" rx="4"/><rect x="134" y="66" width="10" height="40" rx="3"/>
    <path d="M24 80v12M176 80v12"/><path class="dk-a" d="M113 130c-15 0-24 11-24 24 0 12 9 22 24 22s24-10 24-22c0-13-9-24-24-24z" stroke-width="3"/><path class="dk-a" d="M101 136c-2-12 4-21 12-21s14 9 12 21" stroke-width="3"/>`),
  // Corrida: pista em curva, marcação de chegada e linhas de velocidade
  corrida: DECO2(`<path d="M20 170c0-60 40-110 110-110h50"/><path d="M44 170c0-46 30-86 86-86h50"/><path class="dk-a" d="M68 170c0-32 22-62 62-62h50" stroke-width="3.2"/>
    <path d="M164 60v48" stroke-dasharray="4 6"/><path class="dk-a" d="M40 40h34M28 54h30M48 26h20" stroke-width="3"/><circle cx="150" cy="150" r="16"/><path d="M150 140v10l7 5M144 128h12"/>`),
  // Progresso: grade, barras e curva de evolução com destaque no ponto mais alto
  progresso: DECO2(`<path d="M30 170h150M30 170V40" stroke-opacity=".7"/><path d="M30 130h150M30 90h150" stroke-dasharray="3 8" stroke-opacity=".6"/>
    <rect x="46" y="128" width="18" height="42" rx="4"/><rect x="78" y="112" width="18" height="58" rx="4"/><rect x="110" y="96" width="18" height="74" rx="4"/><rect x="142" y="70" width="18" height="100" rx="4"/>
    <path class="dk-a" d="M40 124c26-8 40-14 58-30s38-30 70-46" stroke-width="3.4"/><path class="dk-a" d="M168 34l2.8 6 6.5.8-4.8 4.4 1.3 6.4-5.8-3.2-5.8 3.2 1.3-6.4-4.8-4.4 6.5-.8z" stroke-width="2.4"/>`),
  // Histórico: relógio com seta de "voltar no tempo" (Beta 27: sem formas que pareçam cartões ou botões)
  historico: DECO2(`<circle cx="104" cy="104" r="62"/><path d="M104 54v8M104 146v8M54 104h8M146 104h8" stroke-opacity=".7"/>
    <path class="dk-a" d="M104 72v34l22 14" stroke-width="3.4"/><path class="dk-a" d="M34 104a70 70 0 1 0 20-49" stroke-width="3.2"/><path class="dk-a" d="M38 40l16 15-21 6" stroke-width="3.2"/>`),
  // Desafios: medalha com fita, estrela e louros
  desafios: DECO2(`<path d="M76 30l24 48 24-48M60 30h32M108 30h32" /><circle cx="100" cy="122" r="44"/><circle class="dk-a" cx="100" cy="122" r="32" stroke-width="3"/>
    <path class="dk-a" d="M100 104l5.6 11.4 12.6 1.8-9.1 8.9 2.2 12.5-11.3-5.9-11.3 5.9 2.2-12.5-9.1-8.9 12.6-1.8z" stroke-width="3"/>
    <path d="M44 150c-10-16-10-36 0-52M156 150c10-16 10-36 0-52"/><path d="M40 132l-10-4M40 116l-10-6M160 132l10-4M160 116l10-6"/>`),
  // Biblioteca: livro aberto e vídeo
  biblioteca: DECO2(`<path d="M100 66c-18-12-42-14-66-10v100c24-4 48-2 66 10 18-12 42-14 66-10V56c-24-4-48-2-66 10z"/><path d="M100 66v100"/>
    <path d="M50 84c14-2 28 0 38 6M50 104c14-2 28 0 38 6M50 124c14-2 28 0 38 6" stroke-opacity=".7"/><circle class="dk-a" cx="136" cy="110" r="20" stroke-width="3"/><path class="dk-a" d="M131 101l14 9-14 9z" stroke-width="3"/>`),
  // Perfil: pessoa e um arco de evolução pessoal
  perfil: DECO2(`<circle cx="100" cy="78" r="26"/><path d="M52 164c4-28 24-44 48-44s44 16 48 44"/><path class="dk-a" d="M40 100a62 62 0 0 1 106-58" stroke-width="3.2"/><path class="dk-a" d="M140 30l8 12-14 3" stroke-width="3.2"/>`),
  // Plano: calendário com dias marcados
  plano: DECO2(`<rect x="36" y="44" width="128" height="120" rx="14"/><path d="M36 72h128M68 32v22M132 32v22"/>
    <path d="M60 96h12M94 96h12M128 96h12M60 122h12M94 122h12M60 146h12" stroke-opacity=".7"/><path class="dk-a" d="M124 120l7 7 14-15M124 144l7 7 14-15" stroke-width="3.2"/>`)
};
window.updateDeco = function(tab){
  const el = document.getElementById('app-deco'); if(!el) return;
  const on = decoEnabled();
  document.body.classList.toggle('no-deco', !on);
  if(!on){ el.innerHTML = ''; return; }
  const corrida = state && state.active === 'run';
  const map = { home:'inicio', sessions: corrida ? 'corrida' : 'musculacao', perf:'progresso', history:'historico', challenges:'desafios', library:'biblioteca', profile:'perfil', plan:'plano' };
  const k = map[tab] || (corrida ? 'corrida' : 'musculacao');
  if(el.dataset.k === k && el.innerHTML) return;
  el.dataset.k = k; el.innerHTML = DECO2_SVG[k];
};

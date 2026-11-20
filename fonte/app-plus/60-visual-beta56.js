
// =====================================================================
// 60. Beta 56 — acabamento visual: gráficos da atividade, percurso, desenho da corrida e contraste
// =====================================================================
//  • Gráfico da atividade importada: em vez de três linhas sobrepostas sem escala (ritmo, FC e altitude com
//    cores parecidas em alguns temas), um painel por medida, cada um com nome, unidade, média, mínimo/máximo e o
//    eixo (km ou min). Ritmo suavizado (o GPS oscila) e invertido: mais alto = mais rápido.
//  • Percurso: marcadores maiores e com nome (Início / Fim, ou "Início e fim" quando é ida e volta), setas de
//    sentido e a marca de cada km. Sem mapa de fundo (o app não envia o GPS para serviços de mapa).
//  • Desenho decorativo da corrida (Treinos/Início): sai o bonequinho, entra a pista com um percurso e marcas
//    de km — mais sóbrio, no mesmo traço dos outros desenhos.
//  • Contraste: textos com azul-claro fixo (#7dd3fc) ficavam quase invisíveis nos temas claros — agora usam a
//    cor de informação do tema (--info-soft). No tema Ametista, o selo "próxima" ficava escuro sobre escuro.

// ---------- gráfico da atividade ----------
function _gfSuave(v, n){ return v.map((x,i)=>{ if(x == null) return null; let s = 0, c = 0; for(let j=Math.max(0,i-n); j<=Math.min(v.length-1,i+n); j++){ if(v[j] != null){ s += v[j]; c++; } } return c ? s/c : null; }); }
function _gfPainel(tit, valores, xs, o){
  const pts = valores.map((v,i)=>v == null ? null : [xs[i], v]).filter(Boolean); if(pts.length < 3) return '';
  const vs = pts.map(p=>p[1]); let mn = Math.min(...vs), mx = Math.max(...vs); if(mx - mn < (o.minRng||1)){ const c = (mx+mn)/2; mn = c - (o.minRng||1)/2; mx = c + (o.minRng||1)/2; }
  const x0 = xs[0] || 0, x1 = xs[xs.length-1] || 1; const W = 300, H = 56, pad = 4;
  const X = x=>((x - x0)/((x1 - x0) || 1)*W).toFixed(1);
  const Y = v=>{ const t = (v - mn)/((mx - mn) || 1); return (o.inverte ? pad + t*(H-2*pad) : H - pad - t*(H-2*pad)).toFixed(1); };
  const linha = pts.map(p=>`${X(p[0])},${Y(p[1])}`).join(' ');
  const area = o.area ? `<polygon points="0,${H} ${linha} ${W},${H}" fill="${o.cor}" fill-opacity=".16" stroke="none"/>` : '';
  const med = o.media != null ? `<line x1="0" x2="${W}" y1="${Y(o.media)}" y2="${Y(o.media)}" stroke="${o.cor}" stroke-opacity=".55" stroke-width="1" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>` : '';
  return `<div class="gf-p">
    <div class="gf-cab"><span class="gf-t"><i style="background:${o.cor}"></i>${tit}</span><span class="gf-v">${o.resumo || ''}</span></div>
    <div class="gf-area"><span class="gf-ymax">${o.fmtY(o.inverte ? mn : mx)}</span><span class="gf-ymin">${o.fmtY(o.inverte ? mx : mn)}</span>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${area}${med}<polyline points="${linha}" fill="none" stroke="${o.cor}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></div>
  </div>`;
}
window.atvGraficoSerie = function(I){
  try{
    const s = (I.serie||[]).filter(p=>p && p.length); if(s.length < 4) return '';
    const bike = I.esporte === 'bike';
    const ultX = s[s.length-1][0];
    // a série é por distância quando o arquivo tem GPS/distância (o x final ≈ km); senão, por tempo (min)
    const kmEst = I.km || (I.parciais && I.parciais.length ? I.parciais.length : 0) || (I.velMed && I.totalMin ? I.velMed*I.totalMin/60 : 0);
    const porKm = !!(kmEst && Math.abs(ultX - kmEst) <= Math.max(1.2, kmEst*0.35) && !(I.totalMin && Math.abs(ultX - I.totalMin) < Math.abs(ultX - kmEst)));
    const xs = s.map(p=>p[0]); const eixo = porKm ? 'km' : 'min';
    const fmtX = v=>porKm ? (Math.round(v*10)/10).toString().replace('.', ',') + ' km' : Math.round(v) + ' min';
    const fmtPace = v=>{ const m = Math.floor(v), sg = Math.round((v-m)*60); return sg === 60 ? `${m+1}:00` : `${m}:${String(sg).padStart(2,'0')}`; };
    let h = '';
    // ritmo (corrida/caminhada) ou velocidade (bike)
    const vel = _gfSuave(s.map(p=>p[1] > 0 ? p[1] : null), 2);
    if(bike){
      h += _gfPainel('Velocidade', vel, xs, { cor:'var(--info)', minRng:2, media: I.velMed || null, resumo: I.velMed ? `média ${String(I.velMed).replace('.', ',')} km/h` : '', fmtY: v=>Math.round(v) + ' km/h' });
    } else {
      const pace = vel.map(v=>v ? Math.min(30, 60/v) : null);
      const pm = I.velMed ? 60/I.velMed : null;
      h += _gfPainel('Ritmo', pace, xs, { cor:'var(--info)', inverte:true, minRng:0.5, media: pm, resumo: pm ? `média ${fmtPace(pm)}/km` : '', fmtY: v=>fmtPace(v) + '/km' });
    }
    if(s.some(p=>p[2])) h += _gfPainel('Frequência cardíaca', _gfSuave(s.map(p=>p[2] || null), 1), xs, { cor:'#e5484d', minRng:10, media: I.fcMed || null, resumo: I.fcMed ? `média ${I.fcMed} · máx. ${I.fcMax || '—'} bpm` : '', fmtY: v=>Math.round(v) + ' bpm' });
    if(s.filter(p=>p[3] != null).length > 3) h += _gfPainel('Altitude', s.map(p=>p[3] != null ? p[3] : null), xs, { cor:'var(--text-mute)', area:true, minRng:10, resumo: I.subida != null ? `${I.subida} m de subida` : '', fmtY: v=>Math.round(v) + ' m' });
    if(!h) return '';
    return `<div class="gf"><div class="gf-sec">Ao longo da atividade</div>${h}<div class="gf-x"><span>0</span><span>${eixo === 'km' ? 'distância' : 'tempo'}</span><span>${fmtX(ultX)}</span></div>
      ${bike ? '' : '<p class="gf-nota">No ritmo, mais alto = mais rápido. A linha tracejada é a média.</p>'}</div>`;
  }catch(e){ console.log('gráfico atividade:', e); return ''; }
};

// ---------- percurso ----------
function _pcDist(a, b){ const R = 6371000, r = Math.PI/180; const dLa = (b[0]-a[0])*r, dLo = (b[1]-a[1])*r; const x = Math.sin(dLa/2)**2 + Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dLo/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }
window.atvPercursoSVG = function(tr){
  if(!tr || tr.length < 2) return '';
  const lats = tr.map(p=>p[0]), lons = tr.map(p=>p[1]); const la0 = Math.min(...lats), la1 = Math.max(...lats), lo0 = Math.min(...lons), lo1 = Math.max(...lons);
  const k = Math.cos((la0+la1)/2*Math.PI/180); const w = Math.max(1e-6, (lo1-lo0)*k), h = Math.max(1e-6, la1-la0);
  const M = 26, L = 280; const s = L/Math.max(w, h); const W = Math.max(80, w*s), H = Math.max(80, h*s);
  const ox = M + (W - w*s)/2, oy = M + (H - h*s)/2;
  const P = tr.map(([la,lo])=>[ox + (lo-lo0)*k*s, oy + (la1-la)*s]);
  const pts = P.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  // marcas de km e setas de sentido
  let acc = 0; const marcas = []; const cum = [0];
  for(let i=1;i<tr.length;i++){ acc += _pcDist(tr[i-1], tr[i]); cum.push(acc); }
  const total = acc; const passo = total > 25000 ? 5 : total > 12000 ? 2 : 1;
  // ponto (e direção) a uma distância D do início, interpolando dentro do trecho
  const em = D=>{ let i = cum.findIndex(c=>c >= D); if(i < 1) i = 1; const a = P[i-1], b = P[i]; const seg = (cum[i]-cum[i-1]) || 1; const f = Math.min(1, Math.max(0, (D - cum[i-1])/seg));
    return { p:[a[0] + (b[0]-a[0])*f, a[1] + (b[1]-a[1])*f], ang: Math.atan2(b[1]-a[1], b[0]-a[0])*180/Math.PI }; };
  for(let d = passo*1000; d < total - 150; d += passo*1000) marcas.push([em(d).p, Math.round(d/1000)]);
  const setas = [0.18, 0.5, 0.82].map(f=>{ const e = em(total*f); return `<path d="M-5 -4.5 L4 0 L-5 4.5" transform="translate(${e.p[0].toFixed(1)} ${e.p[1].toFixed(1)}) rotate(${e.ang.toFixed(0)})" fill="none" stroke="var(--bg-2,#fff)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`; }).join('');
  const a = P[0], z = P[P.length-1]; const junto = Math.hypot(a[0]-z[0], a[1]-z[1]) < 16;
  const rot = (p, txt, cor)=>{ const dx = p[0] > (W+2*M)/2 ? -10 : 10, anc = dx < 0 ? 'end' : 'start'; return `<text x="${(p[0]+dx).toFixed(1)}" y="${(p[1]-9).toFixed(1)}" text-anchor="${anc}" class="pc-rot" fill="${cor}">${txt}</text>`; };
  const km = marcas.map(([p, n])=>`<g transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})"><circle r="8" fill="var(--bg-2,#fff)" stroke="var(--primary)" stroke-width="1.6"/><text y="3.3" text-anchor="middle" class="pc-km">${n}</text></g>`).join('');
  return `<svg viewBox="0 0 ${(W+2*M).toFixed(0)} ${(H+2*M).toFixed(0)}" class="ip-svg pc-svg" role="img" aria-label="Percurso: ${junto ? 'começa e termina no mesmo ponto' : 'do início ao fim'}${marcas.length ? ', com marcas de km' : ''}">
    <polyline points="${pts}" fill="none" stroke="var(--primary)" stroke-opacity=".25" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
    <polyline points="${pts}" fill="none" stroke="var(--primary)" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>
    ${setas}${km}
    <circle cx="${z[0].toFixed(1)}" cy="${z[1].toFixed(1)}" r="${junto ? 10 : 7}" fill="var(--text-strong,#111)" stroke="var(--bg-2,#fff)" stroke-width="2.5"/>
    <circle cx="${a[0].toFixed(1)}" cy="${a[1].toFixed(1)}" r="7" fill="#2fbf71" stroke="var(--bg-2,#fff)" stroke-width="2.5"/>
    ${junto ? rot(a, 'Início e fim', 'var(--text)') : rot(a, 'Início', '#1f9d5a') + rot(z, 'Fim', 'var(--text)')}
  </svg>
  <div class="pc-leg"><span><i class="pc-i pc-ini"></i>Início</span><span><i class="pc-i pc-fim"></i>Fim</span>${marcas.length ? `<span><i class="pc-i pc-k"></i>km ${passo > 1 ? `(a cada ${passo})` : ''}</span>` : ''}<span>➜ sentido</span></div>`;
};

// ---------- desenho da corrida ----------
try{
  if(typeof DECO2_SVG !== 'undefined' && typeof DECO3 === 'function'){
    DECO2_SVG.corrida = DECO3(`<circle class="d-fundo" cx="170" cy="62" r="50"/>
      <path class="d-fill" d="M96 120a124 124 0 0 1 124-124v26a98 98 0 0 0-98 98z"/>
      <path class="d-linha" d="M96 120a124 124 0 0 1 124-124M122 120a98 98 0 0 1 98-98"/>
      <path class="d-ac" d="M109 120a111 111 0 0 1 111-111" stroke-width="2" stroke-dasharray="2 7"/>
      <path class="d-ac" d="M136 92c10-2 12-14 22-16s14 8 24 4 8-18 18-22" stroke-width="3.2"/>
      <circle class="d-acf" cx="136" cy="92" r="4.5" stroke="none"/>
      <path class="d-ac" d="M200 38v-16l10 4-10 4" stroke-width="2.2"/>
      <path class="d-linha" d="M146 104h8M160 104h8M174 104h8" stroke-width="2.6" stroke-opacity=".75"/>`);
    const el = document.getElementById('app-deco'); if(el) delete el.dataset.k;
  }
}catch(e){}

// ---------- dias da semana em Treinos ----------
// Antes: pílulas com o nome inteiro ("Caminhada ativa") — cortavam o texto ou, quebrando linha, ficavam grandes.
// Agora: uma faixa de dias, todos do mesmo tamanho, numa linha: dia abreviado + rótulo curto (Treino A, Leve,
// Longão, Tiros…). O nome completo continua no cartão da sessão, logo abaixo, e no title/aria-label.
const DIA_CURTO = { 1:'SEG', 2:'TER', 3:'QUA', 4:'QUI', 5:'SEX', 6:'SÁB', 7:'DOM' };
const TIPO_CURTO = { leve:'Leve', continua:'Contínua', longao:'Longão', regenerativo:'Recup.', caminhada:'Caminhar', camcorre:'Misto', fartlek:'Fartlek', subida:'Subidas', tempo:'Ritmo', limiar:'Limiar', tiros_longos:'Tiros', tiros_curtos:'Tiros', velocidade:'Veloc.', ritmo_prova:'Ritmo', prova:'Prova' };
function mtDiasChips(){
  try{
    const box = $('sessions-chips'); if(!box) return;
    const mod = state.modules[state.active]; const ws = (mod && mod.plan && mod.plan.workouts) || [];
    const chips = [...box.children]; if(!chips.length || chips.length !== ws.length) return;
    const lift = state.active !== 'run';
    box.classList.add('dias-faixa'); const n = ws.length; box.style.setProperty('--n', String(n <= 5 ? n : n === 6 ? 3 : 4)); box.classList.toggle('dias-5', n === 5);
    chips.forEach((c, i)=>{
      const w = ws[i]; if(!w || c.dataset.b56) return;
      const nome = lift ? 'Treino ' + w.k : String(w.name || 'Treino').split('(')[0].trim();
      const feito = /✅/.test(c.textContent);
      const rot = lift ? 'Treino ' + w.k : (TIPO_CURTO[(w.motor||{}).tipo] || nome.split(/\s+/)[0]);
      c.classList.add('dia-chip'); c.dataset.b56 = '1';
      c.innerHTML = `<span class="dc-dia">${DIA_CURTO[w.dayIdx] || String(w.dayName||'').slice(0,3).toUpperCase()}</span><span class="dc-rot">${mtEsc(rot)}</span>${feito ? '<span class="dc-ok" aria-hidden="true">✓</span>' : ''}`;
      c.title = `${w.dayName || ''}: ${nome}${feito ? ' (feito)' : ''}`;
      c.setAttribute('role', 'button'); c.setAttribute('aria-label', c.title); c.setAttribute('aria-pressed', c.classList.contains('on') ? 'true' : 'false');
    });
  }catch(e){ console.log('dias:', e); }
}
mtGancho('renderSessions', { depois(){ mtDiasChips(); } });
mtGancho('selectSession', { depois(){ mtDiasChips(); } });
mtGancho('goTab', { depois(t){ if(t === 'sessions') mtDiasChips(); } });

(function(){
  const st = document.createElement('style'); st.id = 'b56-css';
  st.textContent = `
.gf{margin:10px 0}
.gf-sec{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text-mute);margin:0 2px 6px}
.gf-p{padding:10px 12px 8px;border-radius:12px;background:rgba(127,127,127,.06);margin-bottom:8px}
.gf-cab{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:6px}
.gf-t{font-size:12.5px;font-weight:700;color:var(--text);display:inline-flex;align-items:center;gap:6px}
.gf-t i{width:10px;height:10px;border-radius:3px;display:inline-block}
.gf-v{font-size:12px;color:var(--text-dim)}
.gf-area{position:relative;padding-left:52px}
.gf-area svg{display:block;width:100%;height:64px}
.gf-ymax,.gf-ymin{position:absolute;left:0;width:48px;font-size:10.5px;color:var(--text-mute);text-align:right;font-variant-numeric:tabular-nums}
.gf-ymax{top:-2px}.gf-ymin{bottom:-2px}
.gf-x{display:flex;justify-content:space-between;font-size:10.5px;color:var(--text-mute);padding:0 2px 0 54px}
.gf-nota{font-size:11px;color:var(--text-mute);margin:6px 2px 0}
.pc-svg{max-height:260px}
.pc-rot{font:700 12px var(--font,system-ui);paint-order:stroke;stroke:var(--bg-2,#fff);stroke-width:3px}
.pc-km{font:800 9px var(--font,system-ui);fill:var(--text)}
.pc-leg{display:flex;flex-wrap:wrap;gap:6px 12px;justify-content:center;font-size:11px;color:var(--text-mute);margin-top:4px}
.pc-leg span{display:inline-flex;align-items:center;gap:5px}
.pc-i{width:10px;height:10px;border-radius:50%;display:inline-block}.pc-ini{background:#2fbf71}.pc-fim{background:var(--text-strong,#111)}.pc-k{background:var(--bg-2,#fff);border:1.6px solid var(--primary)}
.ip-mapa{flex-direction:column;align-items:center}
[data-theme="ametista"] .pill.on{background:var(--primary)!important}
#sessions-chips.dias-faixa{display:grid!important;grid-template-columns:repeat(var(--n,4),minmax(0,1fr));gap:6px!important;overflow:visible!important;padding:0!important}
#sessions-chips .dia-chip{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-width:0;margin:0!important;padding:8px 4px!important;border-radius:14px!important;white-space:nowrap;text-align:center}
#sessions-chips .dc-dia{font-size:10.5px;font-weight:800;letter-spacing:.08em;color:var(--text-mute)}
#sessions-chips .dc-rot{max-width:100%;overflow:hidden;text-overflow:ellipsis;font-size:12.5px;font-weight:700;color:var(--text)}
#sessions-chips .dia-chip.on .dc-dia,#sessions-chips .dia-chip.on .dc-rot{color:var(--on-primary,#fff)}
#sessions-chips .dc-ok{position:absolute;top:3px;right:5px;font-size:10px;font-weight:900;color:var(--primary-2)}
#sessions-chips .dia-chip.on .dc-ok{color:var(--on-primary,#fff)}
#sessions-chips.dias-5 .dc-rot{font-size:11.5px}
@media (max-width:359px){#sessions-chips .dc-rot{font-size:11.5px}}
`;
  document.head.appendChild(st);
})();
Object.assign(window, { _gfPainel, mtDiasChips });

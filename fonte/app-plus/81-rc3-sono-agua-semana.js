// ===================================================================================================
// RC 3 — Etapa 3: sono completo, água em Alimentação e o novo gráfico da Atividade da semana
// ===================================================================================================

// ---------- 1. Sono: registro mais completo (aproveita a parte 76; nada de dependência nova) ----------
// O que muda: qualidade em 5 níveis (antes: Mal / Ok / Bem) e disposição ao acordar em 5 níveis; horários
// de dormir e acordar como forma principal (o total é calculado e mostrado na hora); médias da semana e do
// mês; regularidade (variação do horário de dormir e de acordar, e a tendência); relação com os treinos.
// Os campos antigos continuam (q e d de 1–3, derivados) — todo o resto do app (avisos de recuperação, corrida,
// "acordei cansado") segue funcionando igual. Tudo é opcional; nada é estimado: horas só existem se a pessoa
// informou horas ou os dois horários. Uma noite ruim nunca muda o treino (regra da parte 76, mantida).
// Relógio: o app é um PWA e o navegador não tem acesso aos dados de sono do Health Connect / Apple Saúde /
// Zepp; os arquivos de atividade (GPX/TCX/FIT) não trazem o sono. Integração automática exigiria um app nativo
// — avaliada e não feita (ver relatório). O registro manual leva poucos segundos.
const SONO_Q5 = { 1:['Péssima','#d9534f'], 2:['Ruim','#e07a6a'], 3:['Razoável','#e2b13c'], 4:['Boa','#5cc19f'], 5:['Ótima','#3fbfa6'] };
const SONO_D5 = { 1:'Muito baixa', 2:'Baixa', 3:'Normal', 4:'Boa', 5:'Ótima' };   // disposição ao acordar (1–2 = acordou cansado)
const _q3de5 = v=>v ? (v <= 2 ? 1 : v === 3 ? 2 : 3) : null;
const _q5de3 = v=>v ? ({1:2, 2:3, 3:4})[v] : null;
function _sonoQ5(x){ return x ? (x.q5 || _q5de3(x.q)) : null; }
function _sonoD5(x){ return x ? (x.d5 || _q5de3(x.d)) : null; }
function _sonoFmtH(h){ if(h == null) return '—'; const hh = Math.floor(h), mm = Math.round((h - hh)*60); return mm ? `${hh} h ${String(mm).padStart(2,'0')}` : `${hh} h`; }
window.sonoRegistrar = function(dk){
  dk = dk || _sonoHoje(); const x = sonoNoite(dk) || {};
  window.__sonoDk = dk; window.__sonoQ5 = _sonoQ5(x); window.__sonoD5 = _sonoD5(x);
  const modo = (x.h != null && !x.dor) ? 'h' : 'hor';
  const hh = x.h != null && !x.dor ? Math.floor(x.h) : '', mm = x.h != null && !x.dor ? Math.round((x.h % 1)*60) : '';
  const dt = new Date(dk + 'T12:00:00');
  $('modal-inner').innerHTML = `<div id="sono-reg"><h3>🌙 Como foi a noite?</h3>
    <p class="mt-muted" style="margin:2px 0 6px">Noite que terminou em ${dt.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'2-digit' })}. Preencha só o que quiser.</p>
    <div class="sono-lbl">Horário</div>
    <div class="sono-tri sono-modo"><button type="button" class="${modo==='hor'?'on':''}" onclick="_sonoModo('hor')">Dormi / acordei</button><button type="button" class="${modo==='h'?'on':''}" onclick="_sonoModo('h')">Só o total</button></div>
    <div id="sono-hor" ${modo==='hor'?'':'hidden'} class="sono-campos"><label>Fui dormir<input class="input mono" type="time" id="sono-dor" value="${x.dor||''}" oninput="_sonoTotal()"></label><label>Acordei<input class="input mono" type="time" id="sono-aco" value="${x.aco||''}" oninput="_sonoTotal()"></label></div>
    <div id="sono-h" ${modo==='h'?'':'hidden'} class="sono-campos"><label>Horas<input class="input mono" type="number" min="0" max="16" inputmode="numeric" id="sono-hh" value="${hh}" placeholder="7"></label><label>Minutos<input class="input mono" type="number" min="0" max="59" step="5" inputmode="numeric" id="sono-mm" value="${mm}" placeholder="30"></label></div>
    <div class="sono-total" id="sono-total"></div>
    <div class="sono-lbl">Qualidade do sono</div>
    <div class="sono-5" id="sono-q5">${[1,2,3,4,5].map(v=>`<button type="button" class="${window.__sonoQ5===v?'on':''}" data-v="${v}" aria-pressed="${window.__sonoQ5===v}" onclick="_sonoMarca5('q5',${v})"><i style="background:${SONO_Q5[v][1]}"></i>${SONO_Q5[v][0]}</button>`).join('')}</div>
    <div class="sono-lbl">Disposição ao acordar</div>
    <div class="sono-5" id="sono-d5">${[1,2,3,4,5].map(v=>`<button type="button" class="${window.__sonoD5===v?'on':''}" data-v="${v}" aria-pressed="${window.__sonoD5===v}" onclick="_sonoMarca5('d5',${v})">${SONO_D5[v]}</button>`).join('')}</div>
    <div class="row" style="gap:8px;margin-top:16px"><button class="btn btn-ghost btn-block" onclick="closeModal()">Cancelar</button><button class="btn btn-primary btn-block" onclick="sonoRegSalva()">Salvar</button></div>
    ${sonoNoite(dk) ? `<button class="link-mais" style="margin-top:10px" onclick="sonoApaga('${dk}')">Apagar esta noite</button>` : ''}</div>`;
  $('modal-back').classList.add('on'); _sonoTotal();
};
// total exato em minutos (o cálculo antigo arredondava a 0,1 h: 7 h 15 aparecia como 7 h 18)
function sonoHorasExatas(dor, aco){ const a = _sonoMin(dor), b = _sonoMin(aco); if(a == null || b == null) return null; let d = b - a; if(d <= 0) d += 1440; return Math.round(d/60*100)/100; }
function _sonoTotal(){ const el = $('sono-total'); if(!el) return; const a = $('sono-dor') && $('sono-dor').value, b = $('sono-aco') && $('sono-aco').value;
  const h = (a && b) ? sonoHorasExatas(a, b) : null; el.textContent = h != null ? `Total: ${_sonoFmtH(h)} de sono` : ''; }
function _sonoMarca5(k, v){ const cur = window['__sono' + (k==='q5'?'Q5':'D5')]; const nv = cur === v ? null : v; window['__sono' + (k==='q5'?'Q5':'D5')] = nv;
  document.querySelectorAll(`#sono-${k} button`).forEach(b=>{ const on = +b.dataset.v === nv; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); }
window._sonoModo = function(m){ $('sono-h').hidden = m !== 'h'; $('sono-hor').hidden = m !== 'hor'; document.querySelectorAll('.sono-modo button').forEach((b,i)=>b.classList.toggle('on', (i===0) === (m==='hor'))); _sonoTotal(); };
window.sonoRegSalva = function(){
  const dk = window.__sonoDk || _sonoHoje();
  const q5 = window.__sonoQ5 || null, d5 = window.__sonoD5 || null;
  const d = { q5, d5, q:_q3de5(q5), d:_q3de5(d5), h:null, dor:null, aco:null };
  if(!$('sono-hor').hidden){ d.dor = $('sono-dor').value || null; d.aco = $('sono-aco').value || null;
    if((d.dor && !d.aco) || (!d.dor && d.aco)){ /* só um horário: guarda, sem inventar o total */ }
    if(d.dor && d.aco) d.h = sonoHorasExatas(d.dor, d.aco); }
  else { const h = +$('sono-hh').value || 0, m = +$('sono-mm').value || 0; if(h > 16 || m > 59 || h < 0 || m < 0){ toast('Confira as horas e os minutos'); return; } if(h || m) d.h = Math.round((h + m/60)*10)/10; }
  if(d.h != null && (d.h < 0.5 || d.h > 16)){ toast('Confira o horário: o total ficou em ' + _sonoFmtH(d.h)); return; }
  const S = sonoEst(); const ant = S.n[dk] || {}; const novo = Object.assign({}, ant);
  ['q5','d5','q','d','h','dor','aco'].forEach(k=>{ if(d[k] == null) delete novo[k]; else novo[k] = d[k]; });
  if(!Object.keys(novo).length){ closeModal(); return; }
  S.n[dk] = novo; if(!S.on) S.on = true;   // registrar uma noite liga o acompanhamento
  saveData(); closeModal(); toast('Noite registrada.'); try{ _sonoHomeDesenha(); renderHomeMetrics(); }catch(e){}
  try{ if($('sono-tela')) openSono(); }catch(e){}
};
// linha da manhã: 5 níveis num toque (o detalhe continua em "detalhes")
window.sonoRapido = function(v){ const q5 = Math.min(5, Math.max(1, Math.round(+v) || 3)); sonoSalvar(_sonoHoje(), { q5, q:_q3de5(q5) }); toast(`Anotado: noite ${SONO_Q5[q5][0].toLowerCase()}.`); try{ _sonoHomeDesenha(); renderHomeMetrics(); }catch(e){} };
const _sonoHomeDesenhaRC2 = window._sonoHomeDesenha;
window._sonoHomeDesenha = function(){
  _sonoHomeDesenhaRC2.apply(this, arguments);
  try{ const el = $('sono-manha'); if(!el) return; const b = el.querySelector('.sm-b'); if(b) b.innerHTML = [1,2,3,4,5].map(v=>`<button type="button" onclick="sonoRapido(${v})" aria-label="Noite ${SONO_Q5[v][0]}">${SONO_Q5[v][0]}</button>`).join(''); el.classList.add('sm5'); }catch(e){}
};

// ---------- 2. Sono: médias, regularidade e relação com os treinos ----------
function _sonoMedia(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null; }
function _sonoMinsDe(hhmm, noite){ let m = _sonoMin(hhmm); if(m == null) return null; if(noite && m < 12*60) m += 1440; return m; }
function _sonoDp(v){ if(v.length < 3) return null; const md = _sonoMedia(v); return Math.round(Math.sqrt(v.reduce((t,x)=>t + (x-md)**2, 0)/v.length)); }
function _sonoFmtMin(m){ if(m == null) return '—'; m = Math.round(m) % 1440; return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; }
function sonoAnalise(){
  const S = state.sono || {}; const N = S.n || {};
  const semIni = mtSemanaIni(Date.now());
  const noites = (a, b)=>Object.keys(N).filter(dk=>{ const t = new Date(dk + 'T12:00:00').getTime(); return t >= a && t < b; }).map(dk=>({ dk, x:N[dk] }));
  // médias por semana (4 semanas) e por mês (3 meses), só com o que foi registrado
  const semanas = [0,1,2,3].map(k=>{ const a = semIni - k*7*86400000; const L = noites(a, a + 7*86400000); const hs = L.filter(o=>o.x.h != null).map(o=>o.x.h);
    return { a, n:L.length, nh:hs.length, med:_sonoMedia(hs), ruins:L.filter(o=>sonoRuim(o.x)).length }; });
  const hoje = new Date(); const meses = [0,1,2].map(k=>{ const d0 = new Date(hoje.getFullYear(), hoje.getMonth()-k, 1).getTime(), d1 = new Date(hoje.getFullYear(), hoje.getMonth()-k+1, 1).getTime();
    const L = noites(d0, d1); const hs = L.filter(o=>o.x.h != null).map(o=>o.x.h); return { d0, n:L.length, nh:hs.length, med:_sonoMedia(hs) }; });
  // regularidade (30 dias): variação do horário de dormir e de acordar; tendência = 2 semanas recentes × 2 anteriores
  const L30 = noites(Date.now() - 30*86400000, Date.now() + 86400000);
  const dor = L30.filter(o=>o.x.dor).map(o=>_sonoMinsDe(o.x.dor, true)), aco = L30.filter(o=>o.x.aco).map(o=>_sonoMinsDe(o.x.aco, false));
  const rec = noites(Date.now() - 14*86400000, Date.now() + 86400000).filter(o=>o.x.dor).map(o=>_sonoMinsDe(o.x.dor, true));
  const antes = noites(Date.now() - 28*86400000, Date.now() - 14*86400000).filter(o=>o.x.dor).map(o=>_sonoMinsDe(o.x.dor, true));
  const dpR = _sonoDp(rec), dpA = _sonoDp(antes);
  const tend = (dpR != null && dpA != null) ? (dpR + 10 < dpA ? 'melhorando' : dpR > dpA + 10 ? 'piorando' : 'estável') : null;
  // sono × treinos (90 dias): esforço médio dos treinos depois de noite boa × noite ruim
  const boa = [], ruim = [];
  [...(((state.modules.lift||{}).history)||[]), ...(((state.modules.run||{}).history)||[])].filter(x=>x && x.at >= Date.now() - 90*86400000 && +x.rpe > 0).forEach(x=>{
    const n = N[chaveDia(new Date(x.at))]; if(!n) return;
    if(sonoRuim(n)) ruim.push(+x.rpe); else if((_sonoQ5(n)||0) >= 4 || (n.h != null && n.h >= 7)) boa.push(+x.rpe);
  });
  return { semanas, meses, dorMed:_sonoMedia(dor), acoMed:_sonoMedia(aco), dpDor:_sonoDp(dor), dpAco:_sonoDp(aco), tend, boa, ruim };
}
function sonoAnaliseHTML(){
  const A = sonoAnalise(); const fmtD = t=>new Date(t).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
  const MES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const linhaSem = (s, i)=>`<tr><td>${i===0 ? 'Esta semana' : i===1 ? 'Semana passada' : 'Semana de ' + fmtD(s.a)}</td><td>${s.n}</td><td>${s.nh ? _sonoFmtH(s.med) : '—'}</td><td>${s.n ? s.ruins : '—'}</td></tr>`;
  const linhaMes = m=>`<tr><td>${MES[new Date(m.d0).getMonth()]}/${String(new Date(m.d0).getFullYear()).slice(2)}</td><td>${m.n}</td><td>${m.nh ? _sonoFmtH(m.med) : '—'}</td><td></td></tr>`;
  const reg = dp=>dp == null ? 'poucos registros' : dp <= 30 ? `regular (±${dp} min)` : dp <= 60 ? `varia um pouco (±${dp} min)` : `irregular (±${dp} min)`;
  const rel = (A.boa.length >= 3 && A.ruim.length >= 3)
    ? `Treinos depois de <b>noite boa</b>: esforço médio <b>${(_sonoMedia(A.boa)).toFixed(1).replace('.',',')}/10</b> (${A.boa.length} treinos). Depois de <b>noite ruim</b>: <b>${(_sonoMedia(A.ruim)).toFixed(1).replace('.',',')}/10</b> (${A.ruim.length} treinos). É uma associação nos seus registros, não prova de causa.`
    : `Ainda não dá para comparar: são precisos pelo menos 3 treinos com esforço registrado depois de noites boas e 3 depois de noites ruins (agora: ${A.boa.length} e ${A.ruim.length}).`;
  return `<div class="sono-an">
    <div class="section-lbl" style="margin:16px 0 6px">Médias</div>
    <table class="sono-tab"><thead><tr><th></th><th>Noites</th><th>Média</th><th>Ruins</th></tr></thead><tbody>${A.semanas.map(linhaSem).join('')}${A.meses.map(linhaMes).join('')}</tbody></table>
    <p class="integ-mini">A média usa só as noites com horas informadas. Noites sem registro não contam.</p>
    <div class="section-lbl" style="margin:14px 0 6px">Regularidade (30 dias)</div>
    <div class="ip-cards"><div class="ip-c"><small>Dormir (média)</small><b>${_sonoFmtMin(A.dorMed)}</b><small>${reg(A.dpDor)}</small></div><div class="ip-c"><small>Acordar (média)</small><b>${_sonoFmtMin(A.acoMed)}</b><small>${reg(A.dpAco)}</small></div></div>
    ${A.tend ? `<p class="integ-mini">Tendência do horário de dormir (2 semanas × 2 anteriores): <b>${A.tend}</b>.</p>` : ''}
    <div class="section-lbl" style="margin:14px 0 6px">Sono e treinos</div>
    <p class="integ-mini" style="font-size:12.5px">${rel}</p>
  </div>`;
}
const _openSonoRC2 = window.openSono;
window.openSono = function(){
  _openSonoRC2.apply(this, arguments);
  try{
    if(!sonoLigado()) return;
    const tela = $('sono-tela'); if(!tela) return;
    const det = tela.querySelector('details.integ-sec'); if(det) det.insertAdjacentHTML('beforebegin', sonoAnaliseHTML());
    // lista: mostra a qualidade e a disposição de 5 níveis
    tela.querySelectorAll('.integ-item').forEach(b=>{ const m = /sonoRegistrar\('([\d-]+)'\)/.exec(b.getAttribute('onclick')||''); if(!m) return; const x = sonoNoite(m[1]); const sm = b.querySelector('small'); if(!x || !sm) return;
      sm.textContent = [x.h != null ? _sonoFmtH(x.h) : '', x.dor && x.aco ? `${x.dor}–${x.aco}` : (x.dor ? `dormiu ${x.dor}` : x.aco ? `acordou ${x.aco}` : ''), _sonoQ5(x) ? SONO_Q5[_sonoQ5(x)][0] : '', _sonoD5(x) ? 'disposição ' + SONO_D5[_sonoD5(x)].toLowerCase() : ''].filter(Boolean).join(' · '); });
    const leg = [...tela.querySelectorAll('.integ-mini')].find(p=>/Barras: horas da noite/.test(p.textContent));
    if(leg) leg.innerHTML = `Barras: horas de cada noite (cor = qualidade: ${[5,4,3,2,1].map(v=>`<span style="color:${SONO_Q5[v][1]}">${SONO_Q5[v][0].toLowerCase()}</span>`).join(', ')}). Faixa clara: 7 a 9 h (recomendação geral para adultos). Linha: média dos últimos 7 dias registrados.`;
    const int = `<details class="integ-sec"><summary>Relógio e outros apps</summary><p class="integ-mini">O MetaTreino funciona no navegador e o navegador não tem acesso aos dados de sono do relógio (Health Connect, Apple Saúde, Zepp). Por isso o registro é manual e leva poucos segundos. Nenhum valor é estimado pelo app.</p></details>`;
    if(det) det.insertAdjacentHTML('afterend', int);
  }catch(e){ console.log('sono (tela):', e); }
};
// gráfico: cor pelos 5 níveis e linha da média móvel de 7 dias (só com noites registradas)
const _sonoGraficoRC2 = window.sonoGrafico;
window.sonoGrafico = function(dias){
  let svg = _sonoGraficoRC2.apply(this, arguments);
  try{
    const L = _sonoUltimas(dias).reverse(); const W = 330, H = 170, pl = 26, pb = 22, pt = 8, max = 11; const bw = (W - pl - 6)/dias;
    const Y = h=>pt + (1 - Math.min(h, max)/max)*(H - pt - pb);
    L.forEach(o=>{ if(!o.x || o.x.h == null) return; const q5 = _sonoQ5(o.x); if(q5) svg = svg.replace(new RegExp(`(<rect [^>]*fill=")[^"]*("><title>${new Date(o.dk + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }).replace('/', '\\/')}:)`), `$1${SONO_Q5[q5][1]}$2`); });
    const pts = []; L.forEach((o,i)=>{ const janela = L.slice(Math.max(0, i-6), i+1).filter(z=>z.x && z.x.h != null); if(janela.length >= 3 && o.x) pts.push(`${(pl + i*bw + bw/2).toFixed(1)},${Y(_sonoMedia(janela.map(z=>z.x.h))).toFixed(1)}`); });
    if(pts.length >= 2) svg = svg.replace('</svg>', `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--text)" stroke-opacity=".55" stroke-width="1.6" stroke-linejoin="round"/></svg>`);
  }catch(e){}
  return svg;
};

// ---------- 3. Início: o atalho da Água vira o do Sono; a Água vai para Alimentação ----------
function _sonoTile(){
  const S = state.sono || {}; const x = sonoNoite(_sonoHoje()); const R = (typeof _sonoResumo === 'function') ? _sonoResumo(7) : null;
  const q5 = _sonoQ5(x);
  const v = x && x.h != null ? `${_sonoFmtH(x.h).replace(' h', '<small>h</small>').replace(/ (\d\d)$/, '<small>$1</small>')}` : (x && q5 ? `<span style="font-size:20px">${SONO_Q5[q5][0]}</span>` : '–');
  const sub = x ? [q5 && x.h != null ? SONO_Q5[q5][0] : '', R && R.med && R.n >= 2 ? `média 7 dias ${_sonoFmtH(R.med)}` : ''].filter(Boolean).join(' · ') || 'Noite registrada'
    : (S.on ? 'Toque para registrar a noite' : 'Registre seu sono');
  return `<div class="met met-sono" onclick="${x ? 'openSono()' : 'sonoRegistrar()'}"><div class="met-h"><i>🌙</i>Sono</div><div class="met-v">${v}</div><div class="met-s">${mtEsc(sub)}</div></div>`;
}
const _renderHomeMetricsRC3 = window.renderHomeMetrics;
window.renderHomeMetrics = function(){
  const r = _renderHomeMetricsRC3.apply(this, arguments);
  try{ const el = $('home-metrics'); const ag = el && el.querySelector('.met[onclick*="openAgua"]'); if(ag) ag.outerHTML = _sonoTile(); }catch(e){ console.log('sono (início):', e); }
  try{ if(typeof aplicaInicio === 'function') aplicaInicio(); }catch(e){}
  return r;
};
// personalização do Início: o bloco "Água" sai; o "Sono" passa a cobrir a linha da manhã e o atalho
try{
  if(typeof INICIO_BLOCOS !== 'undefined'){
    const i = INICIO_BLOCOS.findIndex(b=>b.k === 'agua'); if(i >= 0) INICIO_BLOCOS.splice(i, 1);
    const s = INICIO_BLOCOS.find(b=>b.k === 'sono');
    if(s){ s.nome = 'Sono'; s.desc = 'atalho para registrar e ver o sono (e a pergunta da manhã, se ligada)'; s.grupo = 'ind'; s.sel = ['#home-metrics .met-sono', '#sono-manha']; }
    else INICIO_BLOCOS.splice(4, 0, { k:'sono', nome:'Sono', grupo:'ind', desc:'atalho para registrar e ver o sono', sel:['#home-metrics .met-sono', '#sono-manha'] });
  }
}catch(e){}
// Alimentação: bloco de hidratação completo (meta, progresso, +250/+500, desfazer, histórico)
function _aguaNutriHTML(){
  const meta = aguaMeta(), ml = aguaHoje(), pct = Math.min(100, Math.round(ml/meta*100));
  return `<div class="nutri-agua" id="nutri-agua"><div class="na-top"><b>💧 Hidratação de hoje</b><span class="mono">${fmtL(ml)} / ${fmtL(meta)} L</span></div>
    <div class="act-bar" style="height:8px;margin:8px 0 10px"><i style="width:${pct}%;background:var(--accent)"></i></div>
    <div class="na-bts"><button type="button" class="aguabtn" onclick="aguaAdd(250)">+250 ml</button><button type="button" class="aguabtn" onclick="aguaAdd(500)">+500 ml</button><button type="button" class="na-link" onclick="aguaAdd(-250)" ${ml ? '' : 'disabled'}>desfazer</button><button type="button" class="na-link" onclick="openAgua()">7 dias ›</button></div></div>`;
}
mtGancho('openNutri', { depois(){
  try{
    const mi = $('modal-inner'); if(!mi || mi.querySelector('#nutri-agua')) return;
    const velho = mi.querySelector('.aguabtn'); const linha = velho && velho.closest('div');
    if(linha && linha.parentNode){ linha.outerHTML = _aguaNutriHTML(); return; }
    const h = mi.querySelector('h3'); if(h) h.insertAdjacentHTML('afterend', _aguaNutriHTML());
  }catch(e){ console.log('água (alimentação):', e); }
}});

// ---------- 4. Atividade da semana: gráfico novo ----------
// Antes: três anéis (treinos, séries/minutos, semanas na meta) e um "% da meta" que era a MÉDIA dos três —
// um número difícil de entender (41% com 3 de 5 treinos feitos), e "treinos" contava qualquer atividade
// da semana (extra e treino adicional inclusive) contra os treinos do plano.
// Agora: os 7 dias da semana em colunas (feito, planejado, hoje, descanso escolhido, faltou), o placar de
// treinos do PLANO (mesma regra do resto do app: mtAdesao) com as atividades extras à parte, séries da
// semana (musculação) e semanas seguidas na meta. Nenhum número inventado: sem plano, mostra só o que fez.
function mtSemanaAtiv(){
  const ini = mtSemanaIni(Date.now()); const DIA = 86400000;
  const A = mtAdesao(ini, Date.now() + 1);
  const planejadoDia = {}, feitoDia = {};
  ['lift','run'].forEach(m=>{ const mod = state.modules[m]; ((mod && mod.plan && mod.plan.workouts) || []).forEach(w=>{ if(w && w.dayIdx) planejadoDia[w.dayIdx] = (planejadoDia[w.dayIdx]||0) + 1; }); });
  mtHist().filter(x=>x.at >= ini).forEach(x=>{ const d = new Date(x.at).getDay() || 7; feitoDia[d] = (feitoDia[d]||0) + 1; });
  // treino do plano feito em outro dia cobre o dia planejado (mesma regra do quadro da semana)
  const movido = {};
  const L = state.modules.lift; ((L && L.plan && L.plan.workouts) || []).forEach(w=>{ if((L.history||[]).some(h=>h.id===w.k && h.at>=ini && !h.adicional && ((new Date(h.at).getDay()||7) !== w.dayIdx))) movido[w.dayIdx] = (movido[w.dayIdx]||0) + 1; });
  const hoje = getDayIdx(); let st0 = 0; try{ st0 = new Date(new Date(planStartTs()).setHours(0,0,0,0)).getTime(); }catch(e){}
  const dias = [1,2,3,4,5,6,7].map(d=>{
    const t = ini + (d-1)*DIA; const p = planejadoDia[d]||0, f = feitoDia[d]||0, mv = movido[d]||0;
    const desc = (state.skips||[]).some(s=>s.at === t); const ferias = typeof isVacationDay === 'function' && isVacationDay(new Date(t));
    let st = 'livre';
    if(f > 0) st = 'feito'; else if(mv > 0 && mv >= p) st = 'movido'; else if(desc && p) st = 'desc'; else if(d === hoje) st = p ? 'hoje' : 'livre-hoje';
    else if(d < hoje && p && !ferias && t >= st0) st = 'faltou'; else if(p) st = 'plan';
    return { d, p, f, st };
  });
  let setsFeitas = 0; Object.values(state.progress||{}).forEach(arr=>(arr||[]).forEach(q=>{ if(q && q.date >= ini) setsFeitas += (q.sets||[]).filter(s=>+s.reps > 0).length; }));
  const temLift = !!(L && L.plan);
  const setsPlan = temLift ? (L.plan.workouts||[]).reduce((s,w)=>s+(w.exercises||[]).reduce((t,e)=>t+(parseInt(e.sets,10)||0),0),0) : 0;
  const metaSem = A.porSem ? Math.max(1, Math.ceil(A.porSem*0.75)) : 0;
  let semanas = 0;
  if(metaSem){ if(Math.min(A.feitos, A.porSem) >= metaSem) semanas++; for(let k=1; k<=26; k++){ const a = ini - k*7*DIA; const B = mtAdesao(a, a + 7*DIA); if(Math.min(B.feitos, B.porSem) >= metaSem) semanas++; else break; } }
  return { feitos: Math.min(A.feitos, A.porSem || A.feitos), plan: A.porSem, extras: A.extras, dias, setsFeitas, setsPlan, temLift, semanas, metaSem, hoje };
}
window.renderQuickStats = function(){
  const el = $('home-quick'); if(!el) return;
  try{
    const S = mtSemanaAtiv(); const DN = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
    const pct = S.plan ? Math.min(100, Math.round(S.feitos/S.plan*100)) : 0;
    const titSt = { feito:'feito', movido:'feito em outro dia', desc:'descanso escolhido', hoje:'hoje', 'livre-hoje':'hoje (livre)', faltou:'faltou', plan:'planejado', livre:'livre' };
    const col = o=>`<div class="aw-d st-${o.st}${o.d===S.hoje?' hj':''}" title="${DN[o.d-1]}: ${titSt[o.st]}"><div class="aw-cap"><i style="height:${o.st==='feito'||o.st==='movido' ? 100 : o.p ? 100 : 0}%"></i>${o.f > 1 ? `<em>${o.f}</em>` : ''}</div><span>${DN[o.d-1]}</span></div>`;
    const kpi = (lbl, val, sub, p)=>`<div class="aw-k"><small>${lbl}</small><b>${val}</b>${sub ? `<span>${sub}</span>` : ''}${p != null ? `<div class="aw-bar"><i style="width:${Math.min(100, Math.round(p*100))}%"></i></div>` : ''}</div>`;
    el.innerHTML = `
      <div class="act-head"><h3>Atividade da semana</h3><span>${S.plan ? `${S.feitos} de ${S.plan} treinos` : `${S.dias.filter(o=>o.f).length} ${S.dias.filter(o=>o.f).length===1?'dia ativo':'dias ativos'}`}</span></div>
      <div class="aw">
        <div class="aw-top"><div class="aw-placar"><b>${S.plan ? S.feitos : S.dias.reduce((t,o)=>t+o.f,0)}</b><span>${S.plan ? `/${S.plan} treinos do plano` : ' atividades'}</span></div>
          ${S.plan ? `<div class="aw-pct" aria-label="${pct}% dos treinos do plano">${pct}%</div>` : ''}</div>
        ${S.plan ? `<div class="aw-meter" role="progressbar" aria-valuemin="0" aria-valuemax="${S.plan}" aria-valuenow="${S.feitos}"><i style="width:${pct}%"></i></div>` : ''}
        <div class="aw-dias">${S.dias.map(col).join('')}</div>
        <div class="aw-leg"><span><i class="lg-f"></i>feito</span><span><i class="lg-p"></i>planejado</span><span><i class="lg-x"></i>faltou</span><span><i class="lg-d"></i>descanso</span></div>
        <div class="aw-ks">
          ${S.temLift && S.setsPlan ? kpi('Séries', `${S.setsFeitas}<small>/${S.setsPlan}</small>`, 'na semana', S.setsFeitas/S.setsPlan) : ''}
          ${S.plan ? kpi('Semanas na meta', `${S.semanas}`, `seguidas · ${S.metaSem}+ treinos`, null) : ''}
          ${S.extras ? kpi('Extras', `${S.extras}`, S.extras===1 ? 'atividade fora do plano' : 'atividades fora do plano', null) : ''}
        </div>
      </div>`;
    el.onclick = openAtividadeDetalhes;
  }catch(e){ console.log('atividade da semana:', e); el.innerHTML = ''; }
  try{ renderHomeMetrics(); }catch(e){}
};
window.openAtividadeDetalhes = function(){
  const S = mtSemanaAtiv(); const DN = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const prox = (typeof proximoTreino==='function') ? proximoTreino() : null; const falta = Math.max(0, S.plan - S.feitos);
  const txtSt = { feito:'✅ feito', movido:'✅ feito em outro dia', desc:'😴 descanso escolhido', hoje:'🟡 hoje', 'livre-hoje':'hoje · livre', faltou:'– faltou', plan:'planejado', livre:'livre' };
  $('modal-inner').innerHTML = `<h3>📊 Atividade da semana</h3>
    <div class="aw-lista">${S.dias.map(o=>`<div class="aw-li st-${o.st}"><b>${DN[o.d-1]}</b><span>${txtSt[o.st]}${o.f > 1 ? ` · ${o.f} atividades` : ''}</span></div>`).join('')}</div>
    <p class="integ-p" style="margin-top:10px">${S.plan ? (falta ? `Faltam <b>${falta}</b> ${falta===1?'treino':'treinos'} do plano para fechar a semana${prox ? `. Próximo: <b>${mtEsc(prox.nome)}</b> (${mtEsc(prox.quando)}).` : '.'}` : 'Semana do plano completa. 🎉') : 'Sem plano ativo: aqui aparece só o que você registrou.'}</p>
    ${S.temLift && S.setsPlan ? `<p class="integ-mini"><b>Séries</b>: ${S.setsFeitas} registradas na semana, contra ${S.setsPlan} previstas no seu plano de musculação.</p>` : ''}
    ${S.plan ? `<p class="integ-mini"><b>Semanas na meta</b>: semanas seguidas com pelo menos ${S.metaSem} dos ${S.plan} treinos do plano (75%). Descanso escolhido não conta como falta. Treino adicional e atividades fora do plano aparecem como extras e não inflam o placar.</p>` : ''}
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
};

(function(){ if(document.getElementById('rc3-e3-css')) return; const s = document.createElement('style'); s.id = 'rc3-e3-css';
s.textContent = `
.sono-5{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}
.sono-5 button{min-height:44px;border-radius:12px;border:1px solid var(--border);background:var(--bg-2);color:var(--text);font:inherit;font-weight:700;font-size:11.5px;line-height:1.15;padding:4px 2px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
.sono-5 button i{width:9px;height:9px;border-radius:50%;display:block}
.sono-5 button.on{border-color:var(--primary);background:rgba(var(--primary-rgb),.16)}
.sono-campos[hidden]{display:none!important}
.sono-total{font-size:12.5px;color:var(--primary-2);font-weight:700;min-height:16px;margin-top:6px}
.sono-manha.sm5 .sm-b{flex:1 1 100%;display:grid;grid-template-columns:repeat(5,minmax(0,1fr))}
.sono-manha.sm5 .sm-b button{font-size:11.5px;padding:0 2px;min-height:36px}
.sono-tab{width:100%;border-collapse:collapse;font-size:12.5px}
.sono-tab th{font-size:11px;color:var(--text-mute);font-weight:700;text-align:right;padding:4px 6px}
.sono-tab td{padding:6px;border-top:1px solid var(--border);text-align:right}.sono-tab td:first-child,.sono-tab th:first-child{text-align:left;color:var(--text-dim)}
.sono-an .ip-cards{grid-template-columns:repeat(2,minmax(0,1fr))}
.sono-an .ip-c small:last-child{display:block;margin-top:2px}
.met-sono .met-v small{font-size:13px}
.nutri-agua{margin:10px 0 12px;padding:12px 14px;border-radius:var(--radius-card,16px);border:1px solid var(--border);background:var(--surface)}
.nutri-agua .na-top{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13.5px}
.nutri-agua .na-bts{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.nutri-agua .na-link{border:0;background:none;color:var(--text-dim);font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer;padding:6px 2px}
.nutri-agua .na-link:disabled{opacity:.4;cursor:default}
.nutri-agua .na-link:last-child{margin-left:auto}
/* Atividade da semana */
.aw{padding:14px 14px 12px;border-radius:var(--radius-card,18px);border:1px solid var(--border);background:linear-gradient(160deg,rgba(var(--primary-rgb),.10),transparent 55%),var(--surface)}
.aw-top{display:flex;align-items:flex-end;justify-content:space-between;gap:10px}
.aw-placar b{font-size:38px;line-height:1;font-weight:800;letter-spacing:-1px}.aw-placar span{font-size:13px;color:var(--text-dim);font-weight:600;margin-left:3px}
.aw-pct{font-size:13px;font-weight:800;color:var(--primary-2);padding:4px 10px;border-radius:99px;background:var(--tint-primary)}
.aw-meter{height:8px;border-radius:99px;background:var(--surface-2);overflow:hidden;margin:10px 0 14px}.aw-meter i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--primary),var(--primary-2));transition:width .5s var(--mt-ease,ease)}
.aw-dias{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;align-items:end}
.aw-d{display:flex;flex-direction:column;align-items:center;gap:5px}
.aw-d span{font-size:10.5px;color:var(--text-dim);font-weight:600}
.aw-d.hj span{color:var(--primary-2);font-weight:800}
.aw-cap{position:relative;width:100%;max-width:30px;height:46px;border-radius:10px;background:var(--surface-2);overflow:hidden;display:flex;align-items:flex-end}
.aw-cap i{display:block;width:100%;border-radius:inherit}
.aw-cap em{position:absolute;top:3px;left:0;right:0;text-align:center;font-style:normal;font-size:10px;font-weight:800;color:var(--on-primary)}
.aw-d.st-feito .aw-cap i,.aw-d.st-movido .aw-cap i{background:linear-gradient(180deg,var(--primary-2),var(--primary))}
.aw-d.st-movido .aw-cap i{opacity:.65}
.aw-d.st-plan .aw-cap,.aw-d.st-hoje .aw-cap{background:transparent;border:1.5px dashed var(--line-primary,var(--border))}
.aw-d.st-plan .aw-cap i,.aw-d.st-hoje .aw-cap i{height:0!important}
.aw-d.st-hoje .aw-cap{border-style:solid;border-color:var(--primary);box-shadow:0 0 0 3px rgba(var(--primary-rgb),.15)}
.aw-d.st-faltou .aw-cap{background:transparent;border:1.5px solid var(--border)}.aw-d.st-faltou .aw-cap i{height:2px!important;background:var(--text-mute);margin:0 25% 50%;width:50%}
.aw-d.st-desc .aw-cap{background:var(--surface-2)}.aw-d.st-desc .aw-cap i{height:30%!important;background:var(--text-mute);opacity:.35}
.aw-d.st-livre .aw-cap i,.aw-d.st-livre-hoje .aw-cap i{height:0!important}
.aw-leg{display:flex;flex-wrap:wrap;gap:4px 12px;margin:10px 0 2px;font-size:10.5px;color:var(--text-mute)}
.aw-leg span{display:flex;align-items:center;gap:5px}.aw-leg i{width:9px;height:9px;border-radius:3px;display:block}
.aw-leg .lg-f{background:var(--primary)}.aw-leg .lg-p{border:1.5px dashed var(--line-primary,var(--border))}.aw-leg .lg-x{border:1.5px solid var(--border)}.aw-leg .lg-d{background:var(--text-mute);opacity:.4}
.aw-ks{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin-top:12px}
.aw-k{padding:9px 10px;border-radius:12px;background:var(--bg-2,var(--surface-2));min-width:0}
.aw-k small{display:block;font-size:10.5px;color:var(--text-mute);font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.aw-k b{display:block;font-size:19px;font-weight:800;margin-top:2px}.aw-k b small{display:inline;font-size:12px;text-transform:none;letter-spacing:0}
.aw-k span{display:block;font-size:11px;color:var(--text-dim);margin-top:1px;line-height:1.3}
.aw-bar{height:4px;border-radius:99px;background:var(--surface-2);overflow:hidden;margin-top:6px}.aw-bar i{display:block;height:100%;background:var(--accent)}
.aw-lista{display:flex;flex-direction:column;gap:2px;margin-top:6px}
.aw-li{display:flex;justify-content:space-between;padding:9px 2px;border-bottom:1px solid var(--border);font-size:13.5px}.aw-li span{color:var(--text-dim)}
.aw-li.st-faltou span{color:var(--text-mute)}.aw-li.st-feito span,.aw-li.st-movido span{color:var(--primary-2)}
@media (prefers-reduced-motion:reduce){.aw-meter i{transition:none}}
`; document.head.appendChild(s); })();

Object.assign(window, { sonoAnalise, sonoAnaliseHTML, mtSemanaAtiv, _sonoTotal, _sonoMarca5, _sonoTile });

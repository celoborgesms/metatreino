
// =====================================================================
// 76. RC 2 — Sono e recuperação (opcional, desligado por padrão)
// ---------------------------------------------------------------------
// Por que assim: um registro que pede atenção várias vezes ao dia (como a água) acaba abandonado.
// O sono pede UMA resposta por dia, de manhã, e só para quem ligou.
//  • Ligar/desligar e ver tudo em Progresso › "Sono e recuperação" (gráfico de 30 noites: horas por noite,
//    cor pela qualidade, faixa de 7–9 h; média, regularidade do horário de dormir e qualidade).
//  • Ligado: na Home, de manhã (4h–14h), uma linha "Como você dormiu?" com Mal / Ok / Bem num toque,
//    "detalhes" (horas OU horários de dormir/acordar, disposição ao acordar) e ✕ para pular o dia.
//    Some depois de responder ou pular. Dias sem registro não contam nada (nem para o bem nem para o mal).
//  • Qualquer campo é opcional: só horas, só horários, só qualidade.
//  • Na recuperação (sem mudar treino por uma noite):
//      - uma noite ruim (qualidade "mal", menos de 6 h ou acordou cansado) → aviso discreto no treino do dia;
//      - 2 das últimas 3 noites ruins → sugestão de priorizar recuperação (versão leve se o corpo pedir);
//      - na avaliação semanal da corrida: 3+ noites ruins na semana (com 4+ registradas) seguram um AVANÇO
//        (mantém, explicando). Nunca recua o plano por causa do sono;
//      - musculação: com 2+ noites ruins, a orientação "subir carga" ganha "se o aquecimento pesar, mantenha".
//  • Horas de sono não são garantia de recuperação nem diagnóstico: o texto diz isso.
// Dados: state.sono = { on, n:{ 'AAAA-MM-DD':{ h, dor, aco, q, d } }, pulou } (campo novo e opcional;
// passa pela limpeza da nuvem). Guarda 180 noites.
// =====================================================================
const SONO_Q = { 1:['Mal','#e07a6a'], 2:['Ok','#e2b13c'], 3:['Bem','#3fbfa6'] };
const SONO_D = { 1:'Cansado(a)', 2:'Normal', 3:'Disposto(a)' };
function sonoEst(){ state.sono = state.sono && typeof state.sono === 'object' ? state.sono : { on:false, n:{} }; state.sono.n = state.sono.n || {}; return state.sono; }
function sonoLigado(){ return !!(state.sono && state.sono.on); }
function _sonoHoje(){ return chaveDia(new Date()); }
function _sonoMin(hhmm){ const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm||'')); return m ? (+m[1])*60 + (+m[2]) : null; }
function sonoHorasDe(dor, aco){ const a = _sonoMin(dor), b = _sonoMin(aco); if(a == null || b == null) return null; let d = b - a; if(d <= 0) d += 1440; return Math.round(d/60*100)/100; }   // RC 3: em minutos exatos (antes 0,1 h)
function sonoNoite(dk){ return ((state.sono||{}).n||{})[dk] || null; }
function sonoRuim(x){ return !!x && (x.q === 1 || (x.h != null && x.h < 6) || x.d === 1); }
function _sonoUltimas(dias){ const out = []; for(let i=0; i<dias; i++){ const dk = chaveDia(new Date(Date.now() - i*86400000)); out.push({ dk, x:sonoNoite(dk) }); } return out; }
// sinal de recuperação (null quando não há registro suficiente)
function sonoSinal(){
  if(!sonoLigado()) return null;
  const u3 = _sonoUltimas(3); const hoje = u3[0].x;
  const ruins3 = u3.filter(o=>sonoRuim(o.x)).length;
  if(ruins3 >= 2) return { k:'varias', txt:'Duas ou mais noites ruins nos últimos dias. Priorize a recuperação: se o treino de hoje for intenso e o corpo pedir, faça a versão leve. Isso é orientação, não regra.' };
  if(sonoRuim(hoje)) return { k:'noite', txt:`Noite ${hoje.h != null && hoje.h < 6 ? `curta (${String(hoje.h).replace('.',',')} h)` : 'ruim'}. Uma noite só não muda o plano: faça o treino de hoje no esforço mais baixo da faixa e aqueça com calma.` };
  return null;
}
function sonoSemanaRuins(semTs){
  if(!sonoLigado()) return null; let reg = 0, ruins = 0;
  for(let i=0; i<7; i++){ const dk = chaveDia(new Date(semTs + i*86400000 + 12*3600000)); const x = sonoNoite(dk); if(x){ reg++; if(sonoRuim(x)) ruins++; } }
  return { reg, ruins };
}
// ---------- registrar ----------
function sonoSalvar(dk, dados){
  const S = sonoEst(); const ant = S.n[dk] || {};
  const x = Object.assign({}, ant, dados);
  if(x.dor && x.aco){ const h = sonoHorasDe(x.dor, x.aco); if(h) x.h = h; }
  Object.keys(x).forEach(k=>{ if(x[k] == null || x[k] === '') delete x[k]; });
  if(!Object.keys(x).length) delete S.n[dk]; else S.n[dk] = x;
  const lim = chaveDia(new Date(Date.now() - 180*86400000)); Object.keys(S.n).forEach(k=>{ if(k < lim) delete S.n[k]; });
  saveData();
}
function sonoRapido(q){ sonoSalvar(_sonoHoje(), { q }); toast(`Anotado: dormiu ${SONO_Q[q][0].toLowerCase()}.`); _sonoHomeDesenha(); }
function sonoPular(){ const S = sonoEst(); S.pulou = _sonoHoje(); saveData(); _sonoHomeDesenha(); }
function sonoRegistrar(dk){
  dk = dk || _sonoHoje(); const x = sonoNoite(dk) || {}; window.__sonoDk = dk; window.__sonoQ = x.q || null; window.__sonoD = x.d || null;
  const modo = x.dor || x.aco ? 'hor' : 'h';
  const hh = x.h != null && !x.dor ? Math.floor(x.h) : '', mm = x.h != null && !x.dor ? Math.round((x.h % 1)*60) : '';
  const dt = new Date(dk + 'T12:00:00');
  $('modal-inner').innerHTML = `<div id="sono-reg"><h3>Como você dormiu?</h3>
    <p class="mt-muted" style="margin:2px 0 12px">Noite que terminou em ${dt.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'2-digit' })}. Tudo é opcional.</p>
    <div class="sono-lbl">Qualidade</div>
    <div class="sono-tri" id="sono-q">${[1,2,3].map(q=>`<button type="button" class="${x.q===q?'on':''}" data-v="${q}" onclick="_sonoMarca('q',${q})">${SONO_Q[q][0]}</button>`).join('')}</div>
    <div class="sono-lbl">Quanto dormiu</div>
    <div class="sono-tri sono-modo"><button type="button" class="${modo==='h'?'on':''}" onclick="_sonoModo('h')">Horas</button><button type="button" class="${modo==='hor'?'on':''}" onclick="_sonoModo('hor')">Horários</button></div>
    <div id="sono-h" ${modo==='h'?'':'hidden'} class="sono-campos"><label>Horas<input class="input mono" type="number" min="0" max="16" inputmode="numeric" id="sono-hh" value="${hh}" placeholder="7"></label><label>Minutos<input class="input mono" type="number" min="0" max="59" step="5" inputmode="numeric" id="sono-mm" value="${mm}" placeholder="30"></label></div>
    <div id="sono-hor" ${modo==='hor'?'':'hidden'} class="sono-campos"><label>Dormi<input class="input mono" type="time" id="sono-dor" value="${x.dor||''}"></label><label>Acordei<input class="input mono" type="time" id="sono-aco" value="${x.aco||''}"></label></div>
    <div class="sono-lbl">Ao acordar</div>
    <div class="sono-tri" id="sono-d">${[1,2,3].map(v=>`<button type="button" class="${x.d===v?'on':''}" data-v="${v}" onclick="_sonoMarca('d',${v})">${SONO_D[v]}</button>`).join('')}</div>
    <div class="row" style="gap:8px;margin-top:16px"><button class="btn btn-ghost btn-block" onclick="closeModal()">Cancelar</button><button class="btn btn-primary btn-block" onclick="sonoRegSalva()">Salvar</button></div>
    ${sonoNoite(dk) ? `<button class="link-mais" style="margin-top:10px" onclick="sonoApaga('${dk}')">Apagar esta noite</button>` : ''}</div>`;
  $('modal-back').classList.add('on');
}
function _sonoMarca(k, v){ const cur = k === 'q' ? window.__sonoQ : window.__sonoD; const nv = cur === v ? null : v; if(k === 'q') window.__sonoQ = nv; else window.__sonoD = nv;
  document.querySelectorAll(`#sono-${k} button`).forEach(b=>b.classList.toggle('on', +b.dataset.v === nv)); }
function _sonoModo(m){ $('sono-h').hidden = m !== 'h'; $('sono-hor').hidden = m !== 'hor'; document.querySelectorAll('.sono-modo button').forEach((b,i)=>b.classList.toggle('on', (i===0) === (m==='h'))); }
function sonoRegSalva(){
  const dk = window.__sonoDk || _sonoHoje(); const d = { q: window.__sonoQ || null, d: window.__sonoD || null, h:null, dor:null, aco:null };
  if(!$('sono-hor').hidden){ d.dor = $('sono-dor').value || null; d.aco = $('sono-aco').value || null; if(d.dor && d.aco) d.h = sonoHorasDe(d.dor, d.aco); }
  else { const h = +$('sono-hh').value || 0, m = +$('sono-mm').value || 0; if(h > 16 || m > 59 || h < 0 || m < 0){ toast('Confira as horas e os minutos'); return; } if(h || m) d.h = Math.round((h + m/60)*10)/10; }
  if(d.h != null && (d.h < 0.5 || d.h > 16)){ toast('Confira o tempo de sono'); return; }
  const S = sonoEst(); const ant = S.n[dk] || {}; const novo = Object.assign({}, ant);
  ['q','d','h','dor','aco'].forEach(k=>{ if(d[k] == null) delete novo[k]; else novo[k] = d[k]; });
  if(!Object.keys(novo).length){ closeModal(); return; }
  S.n[dk] = novo; saveData(); closeModal(); toast('Noite registrada.'); _sonoHomeDesenha();
  try{ if($('sono-tela')) openSono(); }catch(e){}
}
function sonoApaga(dk){ const S = sonoEst(); delete S.n[dk]; saveData(); openSono(); }
function sonoLigar(on){ const S = sonoEst(); S.on = !!on; saveData(); _sonoHomeDesenha(); sonoEntrada(); if($('modal-back').classList.contains('on')) openSono(); toast(on ? 'Sono ligado: uma pergunta rápida de manhã, na Home.' : 'Sono desligado. Os registros ficam guardados.'); }
// ---------- Home: uma linha de manhã ----------
function _sonoHomeDesenha(){
  try{
    const v = $('sono-manha'); if(v) v.remove();
    if(!sonoLigado()) return;
    const S = sonoEst(); const dk = _sonoHoje(); const h = new Date().getHours();
    if(S.n[dk] || S.pulou === dk || h < 4 || h >= 14) return;
    const scr = $('scr-home'); const wrap = scr && scr.querySelector('.wrap'); if(!wrap) return;
    // logo abaixo da saudação (antes dos blocos que a parte 28 reordena)
    const ref = $('home-greet-row') ? $('home-greet-row').nextElementSibling : ($('home-quick') || wrap.querySelector('.week'));
    const html = `<div class="sono-manha" id="sono-manha" role="group" aria-label="Como você dormiu?"><span class="sm-t">Como você dormiu?</span>
      <span class="sm-b">${[1,2,3].map(q=>`<button type="button" onclick="sonoRapido(${q})">${SONO_Q[q][0]}</button>`).join('')}</span>
      <button type="button" class="sm-det" onclick="sonoRegistrar()">detalhes</button><button type="button" class="sm-x" onclick="sonoPular()" aria-label="Pular hoje">✕</button></div>`;
    if(ref) ref.insertAdjacentHTML('beforebegin', html); else wrap.insertAdjacentHTML('afterbegin', html);
  }catch(e){}
}
mtGancho('renderHome', { depois(){ _sonoHomeDesenha(); } });
try{ if(typeof INICIO_BLOCOS !== 'undefined' && !INICIO_BLOCOS.some(b=>b.k === 'sono')) INICIO_BLOCOS.splice(2, 0, { k:'sono', nome:'Sono (de manhã)', desc:'só para quem ligou em Progresso › Sono', sel:['#sono-manha'] }); }catch(e){}
// ---------- Progresso: entrada e tela ----------
function sonoEntrada(){
  try{
    const scr = $('scr-perf'); if(!scr) return; const wrap = scr.querySelector('.wrap'); if(!wrap) return;
    const v = $('sono-entrada'); if(v) v.remove();
    const S = state.sono || {}; const regs = Object.keys(S.n||{}).length;
    const sub = sonoLigado() ? (regs ? `${_sonoResumo(14).txt}` : 'Ligado: responda de manhã na Home') : 'Opcional: registre como dormiu e veja a recuperação';
    const html = `<button type="button" class="card integ-hist" id="sono-entrada" onclick="openSono()"><span class="ii-ico">🌙</span><span class="ii-tx"><b>Sono e recuperação</b><small>${mtEsc(sub)}</small></span><span class="ii-seta">›</span></button>`;
    const cd = $('cd-entrada'); if(cd) cd.insertAdjacentHTML('afterend', html); else wrap.insertAdjacentHTML('beforeend', html);
  }catch(e){}
}
mtGancho('renderPerf', { depois(){ sonoEntrada(); } });
mtGancho('goTab', { depois(t){ if(t === 'perf') sonoEntrada(); } });
try{ if(typeof PERF_BLOCOS !== 'undefined' && !PERF_BLOCOS.some(b=>b.k === 'sono')){ PERF_BLOCOS.push({ k:'sono', nome:'Sono e recuperação', desc:'opcional', sel:['#sono-entrada'] }); if(typeof PERF_PADRAO !== 'undefined') PERF_PADRAO.push('sono'); } }catch(e){}
function _sonoResumo(dias){
  const L = _sonoUltimas(dias).filter(o=>o.x);
  const hs = L.filter(o=>o.x.h != null).map(o=>o.x.h); const med = hs.length ? hs.reduce((a,b)=>a+b,0)/hs.length : null;
  const ruins = L.filter(o=>sonoRuim(o.x)).length;
  const dor = L.filter(o=>o.x.dor).map(o=>{ let m = _sonoMin(o.x.dor); if(m < 12*60) m += 1440; return m; });
  let dp = null; if(dor.length >= 3){ const md = dor.reduce((a,b)=>a+b,0)/dor.length; dp = Math.round(Math.sqrt(dor.reduce((t,v)=>t + (v-md)**2, 0)/dor.length)); }
  const q = { 1:0, 2:0, 3:0 }; L.forEach(o=>{ if(o.x.q) q[o.x.q]++; });
  const txt = L.length ? `${L.length} ${L.length===1?'noite':'noites'} em ${dias} dias${med ? ` · média ${String(Math.round(med*10)/10).replace('.',',')} h` : ''}` : 'Nenhuma noite registrada ainda';
  return { n:L.length, med, ruins, dp, q, txt };
}
function sonoGrafico(dias){
  const L = _sonoUltimas(dias).reverse();
  const W = 330, H = 170, pl = 26, pb = 22, pt = 8; const max = 11;
  const bw = (W - pl - 6) / dias; const Y = h=>pt + (1 - Math.min(h, max)/max) * (H - pt - pb);
  let barras = '';
  L.forEach((o,i)=>{ const x = pl + i*bw + bw*0.15, w = Math.max(2, bw*0.7);
    if(!o.x) return;
    const cor = o.x.q ? SONO_Q[o.x.q][1] : 'var(--text-mute)';
    const dt = new Date(o.dk + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
    if(o.x.h != null) barras += `<rect x="${x.toFixed(1)}" y="${Y(o.x.h).toFixed(1)}" width="${w.toFixed(1)}" height="${(H - pb - Y(o.x.h)).toFixed(1)}" rx="2" fill="${cor}"><title>${dt}: ${String(o.x.h).replace('.',',')} h${o.x.q ? ' · ' + SONO_Q[o.x.q][0] : ''}</title></rect>`;
    else barras += `<circle cx="${(x + w/2).toFixed(1)}" cy="${(H - pb - 6).toFixed(1)}" r="${Math.min(4, w/2+1).toFixed(1)}" fill="${cor}"><title>${dt}: ${o.x.q ? SONO_Q[o.x.q][0] : 'registrada'} (sem horas)</title></circle>`;
  });
  const faixa = `<rect x="${pl}" y="${Y(9).toFixed(1)}" width="${W-pl-6}" height="${(Y(7)-Y(9)).toFixed(1)}" fill="var(--primary)" opacity=".08"/><line x1="${pl}" x2="${W-6}" y1="${Y(7).toFixed(1)}" y2="${Y(7).toFixed(1)}" stroke="var(--text-mute)" stroke-dasharray="3 3" stroke-width="1"/>`;
  const eixo = [0, 4, 7, 9].map(h=>`<text x="2" y="${(Y(h)+4).toFixed(1)}" class="cd-t">${h}h</text>`).join('')
    + `<text x="${pl}" y="${H-4}" class="cd-t">${new Date(L[0].dk + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}</text><text x="${W-6}" y="${H-4}" class="cd-t" text-anchor="end">hoje</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="cd-svg" role="img" aria-label="Horas de sono nas últimas ${dias} noites">${faixa}${eixo}${barras}</svg>`;
}
let _sonoDias = 30;
function openSono(){
  const mi = $('modal-inner'); mi.classList.remove('modal-video','modal-ex');
  const S = state.sono || {};
  if(!sonoLigado()){
    mi.innerHTML = `<div id="sono-tela"><h3>🌙 Sono e recuperação</h3>
      <p class="integ-p">Opcional. Se ligar, o app pergunta de manhã, na Home, como você dormiu (um toque: Mal, Ok ou Bem). Horas, horários e disposição ao acordar são opcionais.</p>
      <p class="integ-p">Com isso, o MetaTreino passa a <b>orientar</b> a recuperação: avisa depois de noites ruins e não acelera a progressão da corrida numa semana de sono ruim. Ele <b>nunca</b> corta um treino por causa de uma noite só.</p>
      <p class="integ-mini">Horas de sono não garantem recuperação e o app não faz avaliação médica. Os dados ficam na sua conta e não são compartilhados com o grupo.</p>
      ${Object.keys(S.n||{}).length ? `<p class="integ-mini">Você tem ${Object.keys(S.n).length} noite(s) guardada(s).</p>` : ''}
      <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="sonoLigar(true)">Ligar o acompanhamento do sono</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Agora não</button></div>`;
    $('modal-back').classList.add('on'); return;
  }
  const R = _sonoResumo(_sonoDias); const sinal = sonoSinal();
  const lista = _sonoUltimas(14).filter(o=>o.x);
  const card = (r, v)=>`<div class="ip-c"><small>${r}</small><b>${v}</b></div>`;
  mi.innerHTML = `<div id="sono-tela"><h3>🌙 Sono e recuperação</h3>
    <div class="cd-chips cd-per">${[[7,'7 noites'],[30,'30 noites'],[90,'90 noites']].map(([d,n])=>`<button type="button" class="${_sonoDias===d?'on':''}" onclick="_sonoDias=${d};openSono()">${n}</button>`).join('')}</div>
    <div class="ip-cards">${card('Registradas', `${R.n} de ${_sonoDias}`)}${card('Média', R.med ? `${String(Math.round(R.med*10)/10).replace('.',',')} h` : '—')}${card('Noites ruins', R.n ? `${R.ruins}` : '—')}${card('Horário de dormir', R.dp != null ? (R.dp <= 30 ? 'regular' : R.dp <= 60 ? 'varia um pouco' : 'irregular') : '—')}</div>
    <div class="cd-graf">${sonoGrafico(_sonoDias)}</div>
    <p class="integ-mini">Barras: horas da noite (cor = qualidade: <span style="color:${SONO_Q[3][1]}">bem</span>, <span style="color:${SONO_Q[2][1]}">ok</span>, <span style="color:${SONO_Q[1][1]}">mal</span>). Faixa clara: 7 a 9 h, a recomendação geral para adultos. Pontos: noite com qualidade, sem horas.</p>
    ${sinal ? `<div class="run-st-dec rx-ori rx-atencao" style="margin-top:10px">${sinal.txt}</div>` : ''}
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="sonoRegistrar()">${sonoNoite(_sonoHoje()) ? 'Editar a noite de hoje' : 'Registrar a noite de hoje'}</button>
    ${lista.length ? `<div class="section-lbl" style="margin:14px 0 4px">Últimas noites</div>${lista.map(o=>`<button type="button" class="integ-item" onclick="sonoRegistrar('${o.dk}')"><span class="ii-tx"><b>${new Date(o.dk+'T12:00:00').toLocaleDateString('pt-BR',{ weekday:'short', day:'2-digit', month:'2-digit' })}</b><small>${[o.x.h != null ? String(o.x.h).replace('.',',') + ' h' : '', o.x.dor && o.x.aco ? `${o.x.dor}–${o.x.aco}` : '', o.x.q ? SONO_Q[o.x.q][0] : '', o.x.d ? SONO_D[o.x.d] : ''].filter(Boolean).join(' · ')}</small></span><span class="ii-seta">›</span></button>`).join('')}` : ''}
    <details class="integ-sec"><summary>Como o app usa o sono</summary>
      <p class="integ-mini">Noite ruim = qualidade "mal", menos de 6 h ou acordou cansado(a). Uma noite ruim: aviso no treino do dia. Duas nas últimas três: sugestão de priorizar a recuperação. Três ou mais na semana (com pelo menos 4 registradas): a corrida não avança naquela semana, mantém. A musculação lembra de não forçar carga nova se o aquecimento pesar. Nada é alterado por uma noite só, e noites sem registro não contam.</p></details>
    <button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button>
    <button class="link-mais" style="margin-top:8px" onclick="sonoLigar(false)">Desligar o acompanhamento</button></div>`;
  $('modal-back').classList.add('on');
}
// ---------- influência na recuperação ----------
(function(){
  const _st = window.runStatusCard; if(typeof _st === 'function') window.runStatusCard = function(){
    let h = _st.apply(this, arguments);
    try{ const s = sonoSinal(); if(s && h) h = h.replace('<div class="run-st-a">', `<div class="run-st-dec rx-ori rx-info">🌙 ${s.txt}</div><div class="run-st-a">`); }catch(e){}
    return h;
  };
  const _av = window.rAvaliarSemana; if(typeof _av === 'function') window.rAvaliarSemana = function(ctx, motor, semTs){
    const res = _av.apply(this, arguments);
    try{
      const s = sonoSemanaRuins(semTs);
      if(res && res.decisao === 'avancar' && s && s.reg >= 4 && s.ruins >= 3){ res.decisao = 'manter'; res.motivo += `; ${s.ruins} de ${s.reg} noites registradas foram ruins — o plano mantém esta semana para você recuperar (não é castigo)`; }
    }catch(e){}
    return res;
  };
  const _hint = window.smartProgressionHint; if(typeof _hint === 'function') window.smartProgressionHint = function(exId){
    const h = _hint.apply(this, arguments);
    try{ const s = sonoSinal(); if(h && h.cls === 'card-ok' && s && s.k === 'varias') return Object.assign({}, h, { txt: h.txt + ' 🌙 Seu sono andou ruim: se o aquecimento pesar, mantenha a carga de antes hoje.' }); }catch(e){}
    return h;
  };
})();
(function(){ if(document.getElementById('sono-css')) return; const s = document.createElement('style'); s.id = 'sono-css';
s.textContent = `#scr-home .wrap > .sono-manha{order:11}
.sono-manha{display:flex;align-items:center;flex-wrap:wrap;gap:6px 8px;margin:10px 0;padding:10px 12px;border-radius:var(--radius-card,16px);border:1px solid var(--border);background:var(--surface)}
.sono-manha .sm-t{font-weight:800;font-size:13.5px;flex:1 1 100%}
.sono-manha .sm-b{display:flex;gap:6px;flex:1}
.sono-manha .sm-b button,.sono-tri button{flex:1;min-height:38px;border-radius:12px;border:1px solid var(--border);background:var(--bg-2);color:var(--text);font:inherit;font-weight:800;font-size:13px;cursor:pointer}
.sono-manha .sm-det{border:none;background:none;color:var(--text-dim);font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer;padding:6px}
.sono-manha .sm-x{border:none;background:none;color:var(--text-mute);font-size:15px;cursor:pointer;padding:6px 4px}
.sono-lbl{font-size:12px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;color:var(--text-mute);margin:12px 0 6px}
.sono-tri{display:flex;gap:6px}
.sono-tri button.on{border-color:var(--primary);background:rgba(var(--primary-rgb),.16)}
.sono-campos{display:flex;gap:10px;margin-top:8px}
.sono-campos label{flex:1;display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--text-dim)}`; document.head.appendChild(s); })();

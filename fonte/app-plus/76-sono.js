
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
// Dados: state.sono = { on, n:{ 'AAAA-MM-DD':{ min, h, dor, aco, acor, q, d, q5, d5, em } }, c:{ 'AAAA-MM-DD':{ l:[{min, ini}], em } } (RC 8: acor = min acordado na noite; c = cochilos),  (RC 4: min = minutos inteiros), pulou } (campo novo e opcional;
// passa pela limpeza da nuvem). Guarda 180 noites.
// =====================================================================
const SONO_Q = { 1:['Mal','#d64545'], 2:['Ok','#d4b62c'], 3:['Bem','#2fa86e'] };   // mesmas cores da escala de 5 (parte 81)
const SONO_D = { 1:'Cansado(a)', 2:'Normal', 3:'Disposto(a)' };
function sonoEst(){ state.sono = state.sono && typeof state.sono === 'object' ? state.sono : { on:false, n:{} }; state.sono.n = state.sono.n || {}; return state.sono; }
function sonoLigado(){ return !!(state.sono && state.sono.on); }
function _sonoHoje(){ return chaveDia(new Date()); }
function _sonoMin(hhmm){ const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm||'')); return m ? (+m[1])*60 + (+m[2]) : null; }
// RC 4 — FONTE ÚNICA da duração do sono, em MINUTOS INTEIROS (6 h 37 = 397 min em todo o app).
// Dados: a noite guarda `min` (inteiro). `h` continua sendo gravado (= min/60, sem arredondar) só para quem ainda
// estiver numa versão antiga ler alguma coisa; ninguém nesta versão lê `h` direto. Registros antigos (sem `min`)
// não são reescritos: a leitura converte `round(h × 60)`. Com os dois horários, o total vem SEMPRE dos horários.
function sonoMinutosDe(dor, aco){ const a = _sonoMin(dor), b = _sonoMin(aco); if(a == null || b == null) return null; let d = b - a; if(d <= 0) d += 1440; return d; }   // passa da meia-noite: 23:40 → 07:05 = 445 min
function sonoHorasDe(dor, aco){ const m = sonoMinutosDe(dor, aco); return m == null ? null : m/60; }   // compatibilidade (horas sem arredondar)
function sonoMinDe(x){
  if(!x) return null;
  // RC 8: com os dois horários, desconta o tempo acordado no meio da noite (x.acor, minutos). Sem acor: igual a antes.
  if(x.dor && x.aco){ const m = sonoMinutosDe(x.dor, x.aco); if(m != null) return Math.max(0, m - sonoAcordado(x)); }
  if(x.min != null && isFinite(+x.min)) return Math.round(+x.min);
  if(x.h != null && isFinite(+x.h)) return Math.round(+x.h*60);
  return null;
}
function sonoAcordado(x){ const v = x && +x.acor; return v > 0 && isFinite(v) ? Math.round(v) : 0; }
// RC 8: cochilos ficam fora da noite, em state.sono.c = { 'AAAA-MM-DD': { l:[{ min, ini }], em } } (dia do cochilo).
// Separados de propósito: médias, "noite ruim" e a análise continuam medindo a NOITE; o cochilo aparece ao lado.
// Lista vazia com 'em' = cochilos apagados (não voltam de outra cópia na junção).
function sonoCochilos(dk){ const c = ((state.sono||{}).c||{})[dk]; return c && Array.isArray(c.l) ? c.l.filter(o=>o && +o.min > 0) : []; }
function sonoCochiloMin(dk){ return sonoCochilos(dk).reduce((t,o)=>t + Math.round(+o.min), 0); }
function sonoFmtMin(m){ if(m == null) return '—'; m = Math.round(m); const hh = Math.floor(m/60), mm = m % 60; return mm ? `${hh} h ${String(mm).padStart(2,'0')}` : `${hh} h`; }
function sonoNoite(dk){ return ((state.sono||{}).n||{})[dk] || null; }
function sonoRuim(x){ const m = sonoMinDe(x); return !!x && (x.q === 1 || (m != null && m < 360) || x.d === 1); }
function _sonoUltimas(dias){ const out = []; for(let i=0; i<dias; i++){ const dk = chaveDia(new Date(Date.now() - i*86400000)); out.push({ dk, x:sonoNoite(dk) }); } return out; }
// sinal de recuperação (null quando não há registro suficiente)
function sonoSinal(){
  if(!sonoLigado()) return null;
  const u3 = _sonoUltimas(3); const hoje = u3[0].x;
  const ruins3 = u3.filter(o=>sonoRuim(o.x)).length;
  if(ruins3 >= 2) return { k:'varias', txt:'Duas ou mais noites ruins nos últimos dias. Priorize a recuperação: se o treino de hoje for intenso e o corpo pedir, faça a versão leve. Isso é orientação, não regra.' };
  if(sonoRuim(hoje)){ const m = sonoMinDe(hoje); return { k:'noite', txt:`Noite ${m != null && m < 360 ? `curta (${sonoFmtMin(m)})` : 'ruim'}. Uma noite só não muda o plano: faça o treino de hoje no esforço mais baixo da faixa e aqueça com calma.` }; }
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
  if(x.dor && x.aco){ const m = sonoMinutosDe(x.dor, x.aco); if(m){ const r = Math.max(0, m - sonoAcordado(x)); x.min = r; x.h = r/60; } }
  Object.keys(x).forEach(k=>{ if(x[k] == null || x[k] === '') delete x[k]; });
  if(!Object.keys(x).length) delete S.n[dk]; else { x.em = Date.now(); S.n[dk] = x; }   // RC 6: 'em' = quando foi gravada (junção entre aparelhos)
  const lim = chaveDia(new Date(Date.now() - 180*86400000)); Object.keys(S.n).forEach(k=>{ if(k < lim) delete S.n[k]; });
  saveData();
}
// sonoRapido (5 níveis): parte 81.
function sonoPular(){ const S = sonoEst(); S.pulou = _sonoHoje(); saveData(); _sonoHomeDesenha(); }
// RC 4: o formulário de registro (sonoRegistrar / sonoRegSalva / _sonoModo) existe SÓ na parte 81.
// O formulário antigo desta parte (3 níveis, minutos de 5 em 5, total em décimos de hora) era sobrescrito
// pela 81 e foi retirado, para não existirem duas lógicas de gravação do sono.
function sonoApaga(dk){ const S = sonoEst(); delete S.n[dk];
  // RC 6: lembra a exclusão para a noite não voltar de uma cópia antiga de outro aparelho
  S.apagadas = S.apagadas || {}; S.apagadas[dk] = Date.now();
  const ks = Object.keys(S.apagadas).sort(); if(ks.length > 120) ks.slice(0, ks.length - 120).forEach(k=>delete S.apagadas[k]);
  saveData(); openSono(); }
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
  const ms = L.map(o=>sonoMinDe(o.x)).filter(m=>m != null); const medMin = ms.length ? ms.reduce((a,b)=>a+b,0)/ms.length : null; const med = medMin != null ? medMin/60 : null;
  const ruins = L.filter(o=>sonoRuim(o.x)).length;
  const dor = L.filter(o=>o.x.dor).map(o=>{ let m = _sonoMin(o.x.dor); if(m < 12*60) m += 1440; return m; });
  let dp = null; if(dor.length >= 3){ const md = dor.reduce((a,b)=>a+b,0)/dor.length; dp = Math.round(Math.sqrt(dor.reduce((t,v)=>t + (v-md)**2, 0)/dor.length)); }
  const q = { 1:0, 2:0, 3:0 }; L.forEach(o=>{ if(o.x.q) q[o.x.q]++; });
  const txt = L.length ? `${L.length} ${L.length===1?'noite':'noites'} em ${dias} dias${medMin != null ? ` · média ${sonoFmtMin(medMin)}` : ''}` : 'Nenhuma noite registrada ainda';
  return { n:L.length, med, medMin, ruins, dp, q, txt };
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
    const hN = sonoMinDe(o.x) != null ? sonoMinDe(o.x)/60 : null;
    if(hN != null) barras += `<rect x="${x.toFixed(1)}" y="${Y(hN).toFixed(1)}" width="${w.toFixed(1)}" height="${(H - pb - Y(hN)).toFixed(1)}" rx="2" fill="${cor}"><title>${dt}: ${sonoFmtMin(sonoMinDe(o.x))}${o.x.q ? ' · ' + SONO_Q[o.x.q][0] : ''}</title></rect>`;
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
  if(!sonoLigado() && !Object.keys(S.n||{}).length){   // RC 6: com noites guardadas, o histórico abre mesmo com a pergunta da manhã desligada
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
    <div class="ip-cards">${card('Registradas', `${R.n} de ${_sonoDias}`)}${card('Média', R.medMin != null ? sonoFmtMin(R.medMin) : '—')}${card('Noites ruins', R.n ? `${R.ruins}` : '—')}${card('Horário de dormir', R.dp != null ? (R.dp <= 30 ? 'regular' : R.dp <= 60 ? 'varia um pouco' : 'irregular') : '—')}</div>
    <div class="cd-graf">${sonoGrafico(_sonoDias)}</div>
    <p class="integ-mini">Barras: horas da noite (cor = qualidade: <span style="color:${SONO_Q[3][1]}">bem</span>, <span style="color:${SONO_Q[2][1]}">ok</span>, <span style="color:${SONO_Q[1][1]}">mal</span>). Faixa clara: 7 a 9 h, a recomendação geral para adultos. Pontos: noite com qualidade, sem horas.</p>
    ${sinal ? `<div class="run-st-dec rx-ori rx-atencao" style="margin-top:10px">${sinal.txt}</div>` : ''}
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="sonoRegistrar()">${sonoNoite(_sonoHoje()) ? 'Editar a noite de hoje' : 'Registrar a noite de hoje'}</button>
    ${lista.length ? `<div class="section-lbl" style="margin:14px 0 4px">Últimas noites</div>${lista.map(o=>`<button type="button" class="integ-item" onclick="sonoRegistrar('${o.dk}')"><span class="ii-tx"><b>${new Date(o.dk+'T12:00:00').toLocaleDateString('pt-BR',{ weekday:'short', day:'2-digit', month:'2-digit' })}</b><small>${[sonoMinDe(o.x) != null ? sonoFmtMin(sonoMinDe(o.x)) : '', o.x.dor && o.x.aco ? `${o.x.dor}–${o.x.aco}` : '', o.x.q ? SONO_Q[o.x.q][0] : '', o.x.d ? SONO_D[o.x.d] : ''].filter(Boolean).join(' · ')}</small></span><span class="ii-seta">›</span></button>`).join('')}` : ''}
    <details class="integ-sec"><summary>Como o app usa o sono</summary>
      <p class="integ-mini">Noite ruim = qualidade "mal", menos de 6 h ou acordou cansado(a). Uma noite ruim: aviso no treino do dia. Duas nas últimas três: sugestão de priorizar a recuperação. Três ou mais na semana (com pelo menos 4 registradas): a corrida não avança naquela semana, mantém. A musculação lembra de não forçar carga nova se o aquecimento pesar. Nada é alterado por uma noite só, e noites sem registro não contam.</p></details>
    <button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button>
    ${sonoLigado() ? `<button class="link-mais" style="margin-top:8px" onclick="sonoLigar(false)">Desligar o acompanhamento</button>` : `<button class="link-mais" style="margin-top:8px" onclick="sonoLigar(true)">Ligar a pergunta da manhã no Início</button>`}</div>`;
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


// ---------- RC 6: o sono entra na junção das cópias (aparelho × nuvem) ----------
// mesclaEstado (app.js) junta histórico, pesos, recordes e conquistas, mas não o sono: a cópia que ficava como base
// mantinha só as noites dela. Ex.: com os dados do navegador limpos, as noites da nuvem podiam ficar de fora até a
// próxima gravação. Agora: noite que só uma cópia tem entra; nas duas, vale a gravada por último ('em');
// noite apagada (S.apagadas) não volta, a não ser que tenha sido registrada de novo depois da exclusão.
function mtSonoMescla(base, outra){
  try{
    if(!base || !outra || !outra.sono || typeof outra.sono !== 'object') return;
    if((+base.zeradoEm||0) > (+outra.zeradoEm||0)) return;          // "começar do zero" nesta cópia: nada de antes volta
    const B = base.sono = base.sono || {}; B.n = B.n || {};
    const O = outra.sono; const On = O.n || {};
    const apag = Object.assign({}, O.apagadas||{}, B.apagadas||{}); Object.keys(O.apagadas||{}).forEach(k=>{ apag[k] = Math.max(apag[k]||0, O.apagadas[k]); });
    if(Object.keys(apag).length) B.apagadas = apag;
    const vale = (x, dk)=>x && !(apag[dk] && !((+x.em||0) > apag[dk]));
    Object.keys(On).forEach(dk=>{ const o = On[dk], b = B.n[dk];
      if(!vale(o, dk)) return;
      if(!b || (+o.em||0) > (+b.em||0)) B.n[dk] = JSON.parse(JSON.stringify(o)); });
    Object.keys(B.n).forEach(dk=>{ if(!vale(B.n[dk], dk)) delete B.n[dk]; });
    if(B.on == null && O.on != null) B.on = O.on;
    // RC 8: cochilos por dia; vale a lista gravada por último (lista vazia = apagados)
    const Oc = O.c || {}; if(Object.keys(Oc).length){ B.c = B.c || {};
      Object.keys(Oc).forEach(dk=>{ const o = Oc[dk], b = B.c[dk]; if(!o || !Array.isArray(o.l)) return; if(!b || (+o.em||0) > (+b.em||0)) B.c[dk] = JSON.parse(JSON.stringify(o)); }); }
  }catch(e){ console.log('sono (junção):', e); }
}
mtGancho('mesclaEstado', { depois(base, outra){ mtSonoMescla(base, outra); } });
window.mtSonoMescla = mtSonoMescla;

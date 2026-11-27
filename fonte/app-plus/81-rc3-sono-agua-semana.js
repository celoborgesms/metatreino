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
// RC 4: cinco matizes bem distintos (antes: dois vermelhos e dois verdes quase iguais) — vermelho, laranja, amarelo, verde, azul.
const SONO_Q5 = { 1:['Péssima','#d64545'], 2:['Ruim','#ee8a2e'], 3:['Razoável','#d4b62c'], 4:['Boa','#2fa86e'], 5:['Ótima','#3b82e0'] };
const SONO_D5 = { 1:'Muito baixa', 2:'Baixa', 3:'Normal', 4:'Boa', 5:'Ótima' };   // disposição ao acordar (1–2 = acordou cansado)
const _q3de5 = v=>v ? (v <= 2 ? 1 : v === 3 ? 2 : 3) : null;
const _q5de3 = v=>v ? ({1:2, 2:3, 3:4})[v] : null;
function _sonoQ5(x){ return x ? (x.q5 || _q5de3(x.q)) : null; }
function _sonoD5(x){ return x ? (x.d5 || _q5de3(x.d)) : null; }
function _sonoFmtH(h){ return h == null ? '—' : sonoFmtMin(Math.round(h*60)); }   // compatibilidade: o app usa sonoFmtMin (parte 76)
window.sonoRegistrar = function(dk){
  dk = dk || _sonoHoje(); const x = sonoNoite(dk) || {};
  window.__sonoDk = dk; window.__sonoQ5 = _sonoQ5(x); window.__sonoD5 = _sonoD5(x);
  const tot = sonoMinDe(x); const soTotal = tot != null && !(x.dor && x.aco);
  const modo = (soTotal && !x.dor && !x.aco) ? 'h' : 'hor';
  const hh = soTotal ? Math.floor(tot/60) : '', mm = soTotal ? tot % 60 : '';
  const dt = new Date(dk + 'T12:00:00');
  $('modal-inner').innerHTML = `<div id="sono-reg"><h3>🌙 Como foi a noite?</h3>
    <p class="mt-muted" style="margin:2px 0 6px">Noite que terminou em ${dt.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'2-digit' })}. Preencha só o que quiser.</p>
    <div class="sono-lbl">Horário</div>
    <div class="sono-tri sono-modo"><button type="button" class="${modo==='hor'?'on':''}" onclick="_sonoModo('hor')">Dormi / acordei</button><button type="button" class="${modo==='h'?'on':''}" onclick="_sonoModo('h')">Só o total</button></div>
    <div id="sono-hor" ${modo==='hor'?'':'hidden'} class="sono-campos"><label>Fui dormir<input class="input mono" type="time" aria-label="Fui dormir" id="sono-dor" value="${x.dor||''}" oninput="_sonoTotal()"></label><label>Acordei<input class="input mono" type="time" aria-label="Acordei" id="sono-aco" value="${x.aco||''}" oninput="_sonoTotal()"></label></div>
    <div id="sono-acor-box" ${modo==='hor'?'':'hidden'} class="sono-campos sono-acor"><label>Acordado no meio da noite (min)<input class="input mono" type="number" min="0" max="300" step="1" inputmode="numeric" id="sono-acor" value="${sonoAcordado(x) || ''}" placeholder="0" oninput="_sonoTotal()"></label></div>
    <div id="sono-h" ${modo==='h'?'':'hidden'} class="sono-campos"><label>Horas<input class="input mono" type="number" min="0" max="16" inputmode="numeric" id="sono-hh" value="${hh}" placeholder="7" oninput="_sonoTotal()"></label><label>Minutos<input class="input mono" type="number" min="0" max="59" step="1" inputmode="numeric" id="sono-mm" value="${mm}" placeholder="30" oninput="_sonoTotal()"></label></div>
    <div class="sono-total" id="sono-total"></div>
    <div class="sono-lbl">Cochilos <span class="sono-opc">opcional · no dia ${dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}</span></div>
    <div id="sono-coch">${sonoCochilos(dk).map(o=>_sonoCochLinha(o)).join('')}</div>
    <button type="button" class="link-mais" id="sono-coch-add" onclick="_sonoCochAdd()">+ Adicionar cochilo</button>
    <div class="sono-lbl">Qualidade do sono</div>
    <div class="sono-5" id="sono-q5">${[1,2,3,4,5].map(v=>`<button type="button" class="${window.__sonoQ5===v?'on':''}" data-v="${v}" aria-pressed="${window.__sonoQ5===v}" onclick="_sonoMarca5('q5',${v})"><i style="background:${SONO_Q5[v][1]}"></i>${SONO_Q5[v][0]}</button>`).join('')}</div>
    <div class="sono-lbl">Disposição ao acordar</div>
    <div class="sono-5" id="sono-d5">${[1,2,3,4,5].map(v=>`<button type="button" class="${window.__sonoD5===v?'on':''}" data-v="${v}" aria-pressed="${window.__sonoD5===v}" onclick="_sonoMarca5('d5',${v})">${SONO_D5[v]}</button>`).join('')}</div>
    <div class="row" style="gap:8px;margin-top:16px"><button class="btn btn-ghost btn-block" onclick="closeModal()">Cancelar</button><button class="btn btn-primary btn-block" onclick="sonoRegSalva()">Salvar</button></div>
    ${sonoNoite(dk) ? `<button class="link-mais" style="margin-top:10px" onclick="sonoApaga('${dk}')">Apagar esta noite</button>` : ''}</div>`;
  $('modal-back').classList.add('on'); _sonoCochBotao(); _sonoTotal();
};
const _sonoMinTxt = m=>m < 60 ? `${m} min` : sonoFmtMin(m);
// RC 8: resumo dos cochilos (30 dias), separado da noite. Não entra nas médias nem na regra de "noite ruim".
function _sonoCochResumo(){
  const L = []; for(let i=0; i<30; i++){ const dk = chaveDia(new Date(Date.now() - i*86400000)); const c = sonoCochilos(dk); if(c.length) L.push({ dk, c }); }
  if(!L.length) return '';
  const tot = L.reduce((t,o)=>t + o.c.reduce((a,b)=>a + +b.min, 0), 0); const n = L.reduce((t,o)=>t + o.c.length, 0);
  const ult = L.slice(0, 5).map(o=>`<div class="aw-li"><b>${new Date(o.dk + 'T12:00:00').toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'2-digit' })}</b><span>${o.c.map(z=>_sonoMinTxt(+z.min) + (z.ini ? ' às ' + z.ini : '')).join(' + ')}</span></div>`).join('');
  return `<div class="section-lbl" style="margin:14px 0 4px">Cochilos (30 dias)</div>
    <p class="integ-mini">${n} ${n===1?'cochilo':'cochilos'} em ${L.length} ${L.length===1?'dia':'dias'} · média de ${_sonoMinTxt(Math.round(tot/n))}. Ficam separados da noite: não entram na média nem na conta de noite ruim.</p><div class="aw-lista">${ult}</div>`;
}
// RC 8: cochilos — duração (min) e, se quiser, a hora em que começou; até 3 por dia
function _sonoCochLinha(o){ o = o || {}; return `<div class="sono-campos sono-coch-l"><label>Duração (min)<input class="input mono sc-min" type="number" min="5" max="240" step="1" inputmode="numeric" value="${o.min||''}" placeholder="20" oninput="_sonoTotal()"></label><label>Começou (opcional)<input class="input mono sc-ini" type="time" aria-label="Cochilo: começou" value="${o.ini||''}"></label><button type="button" class="sc-x" aria-label="Tirar este cochilo" onclick="this.parentNode.remove();_sonoCochBotao();_sonoTotal()">✕</button></div>`; }
function _sonoCochBotao(){ const b = $('sono-coch-add'); if(b) b.hidden = document.querySelectorAll('#sono-coch .sono-coch-l').length >= 3; }
function _sonoCochAdd(){ const box = $('sono-coch'); if(!box || box.children.length >= 3) return; box.insertAdjacentHTML('beforeend', _sonoCochLinha()); _sonoCochBotao(); try{ if(typeof nrVarre === 'function') nrVarre(box.lastElementChild); }catch(e){} const i = box.lastElementChild.querySelector('.sc-min'); if(i) try{ i.focus(); }catch(e){} }
function _sonoCochLe(){   // { l:[...] } ou { erro }
  const l = []; let erro = null;
  document.querySelectorAll('#sono-coch .sono-coch-l').forEach(r=>{ const v = String(r.querySelector('.sc-min').value||'').trim(); const ini = r.querySelector('.sc-ini').value || null; if(!v) return;
    const m = +v; if(!Number.isInteger(m) || m < 5 || m > 240){ erro = 'Cochilo: de 5 a 240 minutos (número inteiro).'; return; } l.push(ini ? { min:m, ini } : { min:m }); });
  return erro ? { erro } : { l };
}
// total exato em minutos (o cálculo antigo arredondava a 0,1 h: 7 h 15 aparecia como 7 h 18)
function sonoHorasExatas(dor, aco){ return sonoHorasDe(dor, aco); }   // compatibilidade; a conta é sonoMinutosDe (parte 76)
function _sonoLeTotal(){   // { min } do que está na tela, ou { erro }
  if($('sono-hor') && !$('sono-hor').hidden){ const a = $('sono-dor') && $('sono-dor').value, b = $('sono-aco') && $('sono-aco').value;
    // RC 8: tempo acordado no meio da noite sai do total (a cama não é o sono)
    const av = String(($('sono-acor')||{}).value||'').trim(); const ac = av ? +av : 0;
    if(av && (!Number.isInteger(ac) || ac < 0 || ac > 300)) return { erro:'Tempo acordado: de 0 a 300 minutos (número inteiro).' };
    if(!(a && b)) return { min:null, acor:ac };
    const cama = sonoMinutosDe(a, b); if(ac && ac >= cama) return { erro:'O tempo acordado ficou maior que o tempo entre dormir e acordar.' };
    return { min: cama - ac, cama, acor:ac }; }
  const hv = String(($('sono-hh')||{}).value||'').trim(), mv = String(($('sono-mm')||{}).value||'').trim(); if(!hv && !mv) return { min:null };
  const h = +hv || 0, m = +mv || 0; if(!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 16 || m < 0 || m > 59) return { erro:'Horas de 0 a 16 e minutos de 0 a 59 (números inteiros).' };
  return { min: h*60 + m };
}
function _sonoTotal(){ const el = $('sono-total'); if(!el) return; const T = _sonoLeTotal(); if(T.erro){ el.textContent = T.erro; return; }
  const C = $('sono-coch') ? _sonoCochLe() : { l:[] }; const cm = C.erro ? 0 : C.l.reduce((t,o)=>t + o.min, 0);
  const partes = [];
  if(T.min != null) partes.push(T.acor ? `Dormiu ${sonoFmtMin(T.min)} (${sonoFmtMin(T.cama)} na cama − ${T.acor} min acordado)` : `Total: ${sonoFmtMin(T.min)} de sono`);
  if(cm) partes.push(`cochilos ${sonoFmtMin(cm).replace(/^0 h (\d+)$/, '$1 min')}` + (T.min != null ? ` · ${sonoFmtMin(T.min + cm)} no dia` : ''));
  el.textContent = C.erro || partes.join(' · '); }
function _sonoMarca5(k, v){ const cur = window['__sono' + (k==='q5'?'Q5':'D5')]; const nv = cur === v ? null : v; window['__sono' + (k==='q5'?'Q5':'D5')] = nv;
  document.querySelectorAll(`#sono-${k} button`).forEach(b=>{ const on = +b.dataset.v === nv; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); }
window._sonoModo = function(m){ $('sono-h').hidden = m !== 'h'; $('sono-hor').hidden = m !== 'hor'; if($('sono-acor-box')) $('sono-acor-box').hidden = m !== 'hor'; document.querySelectorAll('.sono-modo button').forEach((b,i)=>b.classList.toggle('on', (i===0) === (m==='hor'))); _sonoTotal(); };
window.sonoRegSalva = function(){
  const dk = window.__sonoDk || _sonoHoje();
  const q5 = window.__sonoQ5 || null, d5 = window.__sonoD5 || null;
  const d = { q5, d5, q:_q3de5(q5), d:_q3de5(d5), min:null, h:null, dor:null, aco:null };
  // os dois modos usam a mesma base: minutos inteiros (só um horário: guarda, sem inventar o total)
  if(!$('sono-hor').hidden){ d.dor = $('sono-dor').value || null; d.aco = $('sono-aco').value || null; }
  const T = _sonoLeTotal(); if(T.erro){ toast(T.erro); return; }
  d.acor = (!$('sono-hor').hidden && T.acor) ? T.acor : null;   // RC 8: só no modo horários (no "só o total" a pessoa já informa o que dormiu)
  const C = _sonoCochLe(); if(C.erro){ toast(C.erro); return; }
  if(T.min != null && T.min > 0){ d.min = T.min; d.h = T.min/60; }
  if(d.min != null && (d.min < 30 || d.min > 960)){ toast('Confira o horário: o total ficou em ' + sonoFmtMin(d.min)); return; }
  const S = sonoEst(); const ant = S.n[dk] || {}; const novo = Object.assign({}, ant);
  ['q5','d5','q','d','min','h','dor','aco','acor'].forEach(k=>{ if(d[k] == null) delete novo[k]; else novo[k] = d[k]; });
  delete novo.em;
  // cochilos do dia (separados da noite): grava só se mudou; lista vazia com data = apagados
  const antC = sonoCochilos(dk); const mudouC = JSON.stringify(antC) !== JSON.stringify(C.l);
  if(mudouC){ S.c = S.c || {}; S.c[dk] = { l:C.l, em:Date.now() }; const lim = chaveDia(new Date(Date.now() - 180*86400000)); Object.keys(S.c).forEach(k=>{ if(k < lim) delete S.c[k]; }); }
  if(!Object.keys(novo).length){ if(mudouC){ saveData(); toast(C.l.length ? 'Cochilo registrado.' : 'Cochilos apagados.'); try{ renderHomeMetrics(); }catch(e){} } closeModal(); try{ if(mudouC && $('sono-tela')) openSono(); }catch(e){} return; }
  novo.em = Date.now(); S.n[dk] = novo; if(!S.on) S.on = true;   // registrar uma noite liga o acompanhamento
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
  const S = state.sono || {}; const N = S.n || {}; const DIA = 86400000;
  const semIni = mtSemanaIni(Date.now());
  const noites = (a, b)=>Object.keys(N).filter(dk=>{ const t = new Date(dk + 'T12:00:00').getTime(); return t >= a && t < b; }).map(dk=>({ dk, x:N[dk], m:sonoMinDe(N[dk]) }));
  // atividades (musculação, corrida, caminhada, bike) com a noite ANTERIOR: a noite é guardada no dia em que a pessoa acordou
  const ativ = [...(((state.modules.lift||{}).history)||[]).map(x=>Object.assign({ _m:'musculacao' }, x)),
                ...(((state.modules.run||{}).history)||[]).map(x=>Object.assign({ _m: x.activity === 'bike' ? 'bike' : x.activity === 'caminhada' ? 'caminhada' : 'corrida' }, x))].filter(x=>x && x.at);
  const ativEm = (a, b)=>ativ.filter(x=>x.at >= a && x.at < b);
  // médias por semana (4) e por mês (3), só com o que foi registrado; treinos da mesma semana ao lado (associação, não causa)
  const semanas = [0,1,2,3].map(k=>{ const a = semIni - k*7*DIA; const L = noites(a, a + 7*DIA); const ms = L.map(o=>o.m).filter(m=>m != null);
    return { a, n:L.length, nh:ms.length, med:_sonoMedia(ms), ruins:L.filter(o=>sonoRuim(o.x)).length, treinos:ativEm(a, Math.min(a + 7*DIA, Date.now()+1)).length }; });
  const hoje = new Date(); const meses = [0,1,2].map(k=>{ const d0 = new Date(hoje.getFullYear(), hoje.getMonth()-k, 1).getTime(), d1 = new Date(hoje.getFullYear(), hoje.getMonth()-k+1, 1).getTime();
    const L = noites(d0, d1); const ms = L.map(o=>o.m).filter(m=>m != null); return { d0, n:L.length, nh:ms.length, med:_sonoMedia(ms), ruins:L.filter(o=>sonoRuim(o.x)).length, treinos:ativEm(d0, Math.min(d1, Date.now()+1)).length }; });
  // regularidade (30 dias): variação do horário de dormir e de acordar; tendência = 2 semanas recentes × 2 anteriores
  const L30 = noites(Date.now() - 30*DIA, Date.now() + DIA);
  const dor = L30.filter(o=>o.x.dor).map(o=>_sonoMinsDe(o.x.dor, true)), aco = L30.filter(o=>o.x.aco).map(o=>_sonoMinsDe(o.x.aco, false));
  const rec = noites(Date.now() - 14*DIA, Date.now() + DIA).filter(o=>o.x.dor).map(o=>_sonoMinsDe(o.x.dor, true));
  const antes = noites(Date.now() - 28*DIA, Date.now() - 14*DIA).filter(o=>o.x.dor).map(o=>_sonoMinsDe(o.x.dor, true));
  const dpR = _sonoDp(rec), dpA = _sonoDp(antes);
  const tend = (dpR != null && dpA != null) ? (dpR + 10 < dpA ? 'mais regular' : dpR > dpA + 10 ? 'menos regular' : 'estável') : null;
  // qualidade e disposição (30 dias): quantas noites em cada nível
  const qual = {1:0,2:0,3:0,4:0,5:0}, disp = {1:0,2:0,3:0,4:0,5:0}; L30.forEach(o=>{ const q = _sonoQ5(o.x), d = _sonoD5(o.x); if(q) qual[q]++; if(d) disp[d]++; });
  // sono × atividade (90 dias). Noite boa = qualidade boa/ótima ou 7 h+ sem ser ruim; noite ruim = regra do app (sonoRuim)
  const boaN = x=>!!x && !sonoRuim(x) && ((_sonoQ5(x)||0) >= 4 || (sonoMinDe(x) != null && sonoMinDe(x) >= 420));
  const G = { boa:{ noites:0, comAtiv:0, ativ:0, rpe:[], mod:{} }, ruim:{ noites:0, comAtiv:0, ativ:0, rpe:[], mod:{} } };
  noites(Date.now() - 90*DIA, Date.now() + DIA).forEach(o=>{
    const g = sonoRuim(o.x) ? G.ruim : boaN(o.x) ? G.boa : null; if(!g) return;
    const t0 = new Date(o.dk + 'T00:00:00').getTime(); if(t0 > Date.now()) return;
    const doDia = ativEm(t0, t0 + DIA); g.noites++; if(doDia.length) g.comAtiv++;
    doDia.forEach(x=>{ g.ativ++; g.mod[x._m] = (g.mod[x._m]||0) + 1; if(+x.rpe > 0) g.rpe.push(+x.rpe); });
  });
  return { semanas, meses, dorMed:_sonoMedia(dor), acoMed:_sonoMedia(aco), dpDor:_sonoDp(dor), dpAco:_sonoDp(aco), tend, qual, disp, n30:L30.length,
    boa:G.boa.rpe, ruim:G.ruim.rpe, G };
}
function sonoAnaliseHTML(){
  const A = sonoAnalise(); const fmtD = t=>new Date(t).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
  const MES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const linhaSem = (s, i)=>`<tr><td>${i===0 ? 'Esta semana' : i===1 ? 'Semana passada' : 'Semana de ' + fmtD(s.a)}</td><td>${s.n}</td><td>${s.nh ? sonoFmtMin(s.med) : '—'}</td><td>${s.n ? s.ruins : '—'}</td><td>${s.treinos}</td></tr>`;
  const linhaMes = m=>`<tr><td>${MES[new Date(m.d0).getMonth()]}/${String(new Date(m.d0).getFullYear()).slice(2)}</td><td>${m.n}</td><td>${m.nh ? sonoFmtMin(m.med) : '—'}</td><td>${m.n ? m.ruins : '—'}</td><td>${m.treinos}</td></tr>`;
  const reg = dp=>dp == null ? 'poucos registros' : dp <= 30 ? `regular (±${dp} min)` : dp <= 60 ? `varia um pouco (±${dp} min)` : `irregular (±${dp} min)`;
  const dist = (o, rot, cor)=>{ const tot = [1,2,3,4,5].reduce((t,v)=>t+o[v],0); if(!tot) return '<p class="integ-mini">Sem registros nos últimos 30 dias.</p>';
    return `<div class="sono-dist" role="img" aria-label="${[1,2,3,4,5].filter(v=>o[v]).map(v=>`${rot(v)}: ${o[v]}`).join(', ')}">${[1,2,3,4,5].filter(v=>o[v]).map(v=>`<i style="flex:${o[v]};background:${cor(v)}"></i>`).join('')}</div>
      <div class="sono-leg">${[1,2,3,4,5].filter(v=>o[v]).map(v=>`<span><i style="background:${cor(v)}"></i>${rot(v)} <b>${o[v]}</b></span>`).join('')}</div>`; };
  const NOME_M = { musculacao:'musculação', corrida:'corrida', caminhada:'caminhada', bike:'bike' };
  const mods = g=>Object.keys(g.mod).sort((a,b)=>g.mod[b]-g.mod[a]).map(k=>`${g.mod[k]} de ${NOME_M[k]}`).join(', ');
  const B = A.G.boa, R = A.G.ruim; const pct = g=>Math.round(g.comAtiv/g.noites*100);
  const lin = [];
  if(B.noites >= 5 && R.noites >= 5) lin.push(`Depois de <b>noite boa</b> você se exercitou em <b>${pct(B)}%</b> dos dias (${B.comAtiv} de ${B.noites}); depois de <b>noite ruim</b>, em <b>${pct(R)}%</b> (${R.comAtiv} de ${R.noites}).`);
  if(B.ativ) lin.push(`Atividades depois de noite boa: ${mods(B)}.`);
  if(R.ativ) lin.push(`Depois de noite ruim: ${mods(R)}.`);
  if(B.rpe.length >= 3 && R.rpe.length >= 3) lin.push(`Esforço registrado (1–10): <b>${_sonoMedia(B.rpe).toFixed(1).replace('.',',')}</b> depois de noite boa (${B.rpe.length} treinos) e <b>${_sonoMedia(R.rpe).toFixed(1).replace('.',',')}</b> depois de noite ruim (${R.rpe.length}).`);
  const rel = lin.length && (B.noites + R.noites) >= 8
    ? `${lin.map(l=>`<p class="integ-mini" style="font-size:12.5px;margin:4px 0">${l}</p>`).join('')}<p class="integ-mini">Isso mostra o que aconteceu junto nos seus registros dos últimos 90 dias. Não prova que o sono causou a diferença: agenda, clima e o tipo de treino do dia também pesam.</p>`
    : `<p class="integ-mini" style="font-size:12.5px">Ainda não dá para comparar com segurança: são precisas pelo menos 5 noites boas e 5 ruins registradas, ou 3 treinos com esforço registrado depois de cada uma (agora: ${B.noites} noites boas, ${R.noites} ruins; ${B.rpe.length} e ${R.rpe.length} treinos com esforço).</p>`;
  return `<div class="sono-an">
    <div class="section-lbl" style="margin:16px 0 6px">Médias</div>
    <table class="sono-tab"><thead><tr><th></th><th>Noites</th><th>Média</th><th>Ruins</th><th>Treinos</th></tr></thead><tbody>${A.semanas.map(linhaSem).join('')}${A.meses.map(linhaMes).join('')}</tbody></table>
    <p class="integ-mini">A média usa só as noites com duração (horas ou os dois horários). Noites sem registro não contam. "Treinos" = musculação, corrida, caminhada e bike registradas no período.</p>
    <div class="section-lbl" style="margin:14px 0 6px">Regularidade (30 dias)</div>
    <div class="ip-cards"><div class="ip-c"><small>Dormir (média)</small><b>${_sonoFmtMin(A.dorMed)}</b><small>${reg(A.dpDor)}</small></div><div class="ip-c"><small>Acordar (média)</small><b>${_sonoFmtMin(A.acoMed)}</b><small>${reg(A.dpAco)}</small></div></div>
    ${A.tend ? `<p class="integ-mini">Horário de dormir nas 2 últimas semanas, comparado às 2 anteriores: <b>${A.tend}</b>.</p>` : ''}
    <div class="section-lbl" style="margin:14px 0 6px">Qualidade do sono (30 dias)</div>
    ${dist(A.qual, v=>SONO_Q5[v][0], v=>SONO_Q5[v][1])}
    <div class="section-lbl" style="margin:14px 0 6px">Disposição ao acordar (30 dias)</div>
    ${dist(A.disp, v=>SONO_D5[v], v=>SONO_Q5[v][1])}
    <div class="section-lbl" style="margin:14px 0 6px">Sono e atividade física</div>
    ${rel}
  </div>`;
}
const _openSonoRC2 = window.openSono;
window.openSono = function(){
  _openSonoRC2.apply(this, arguments);
  try{
    if(!sonoLigado() && !Object.keys((state.sono||{}).n||{}).length) return;
    const tela = $('sono-tela'); if(!tela) return;
    const det = tela.querySelector('details.integ-sec'); if(det) det.insertAdjacentHTML('beforebegin', sonoAnaliseHTML() + _sonoCochResumo());
    // lista: mostra a qualidade e a disposição de 5 níveis
    tela.querySelectorAll('.integ-item').forEach(b=>{ const m = /sonoRegistrar\('([\d-]+)'\)/.exec(b.getAttribute('onclick')||''); if(!m) return; const x = sonoNoite(m[1]); const sm = b.querySelector('small'); if(!x || !sm) return;
      sm.textContent = [sonoMinDe(x) != null ? sonoFmtMin(sonoMinDe(x)) : '', x.dor && x.aco ? `${x.dor}–${x.aco}` : (x.dor ? `dormiu ${x.dor}` : x.aco ? `acordou ${x.aco}` : ''), sonoAcordado(x) ? `${sonoAcordado(x)} min acordado` : '', sonoCochiloMin(m[1]) ? `+ cochilo ${_sonoMinTxt(sonoCochiloMin(m[1]))}` : '', _sonoQ5(x) ? SONO_Q5[_sonoQ5(x)][0] : '', _sonoD5(x) ? 'disposição ' + SONO_D5[_sonoD5(x)].toLowerCase() : ''].filter(Boolean).join(' · '); });
    const leg = [...tela.querySelectorAll('.integ-mini')].find(p=>/Barras: horas da noite/.test(p.textContent));
    if(leg) leg.innerHTML = `<span class="sono-leg">${[5,4,3,2,1].map(v=>`<span><i style="background:${SONO_Q5[v][1]}"></i>${SONO_Q5[v][0]}</span>`).join('')}<span><i class="sl-sem"></i>sem qualidade</span></span>Barras: duração de cada noite; a cor é a qualidade. Faixa clara: 7 a 9 h (recomendação geral para adultos). Linha: média dos últimos 7 dias registrados.`;
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
    L.forEach(o=>{ if(!o.x || sonoMinDe(o.x) == null) return; const q5 = _sonoQ5(o.x); if(q5) svg = svg.replace(new RegExp(`(<rect [^>]*fill=")[^"]*("><title>${new Date(o.dk + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }).replace('/', '\\/')}:)`), `$1${SONO_Q5[q5][1]}$2`); });
    const pts = []; L.forEach((o,i)=>{ const janela = L.slice(Math.max(0, i-6), i+1).filter(z=>z.x && sonoMinDe(z.x) != null); if(janela.length >= 3 && o.x) pts.push(`${(pl + i*bw + bw/2).toFixed(1)},${Y(_sonoMedia(janela.map(z=>sonoMinDe(z.x)))/60).toFixed(1)}`); });
    if(pts.length >= 2) svg = svg.replace('</svg>', `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--text)" stroke-opacity=".55" stroke-width="1.6" stroke-linejoin="round"/></svg>`);
  }catch(e){}
  return svg;
};

// ---------- 3. Início: o atalho da Água vira o do Sono; a Água vai para Alimentação ----------
function _sonoTile(){
  const S = state.sono || {}; const x = sonoNoite(_sonoHoje()); const R = (typeof _sonoResumo === 'function') ? _sonoResumo(7) : null;
  const q5 = _sonoQ5(x);
  const xm = sonoMinDe(x);
  // RC 5: com noites anteriores registradas, o atalho mostra a média e abre o histórico mesmo antes de registrar
  // a noite de hoje (antes só abria o formulário, e o histórico parecia sumido até registrar hoje).
  const temHist = !!(R && R.n);
  const v = x && xm != null ? `${sonoFmtMin(xm).replace(' h', '<small>h</small>').replace(/ (\d\d)$/, '<small>$1</small>')}` : (x && q5 ? `<span style="font-size:20px">${SONO_Q5[q5][0]}</span>` : '–');
  const media = R && R.medMin != null && R.n >= 2 ? `média 7 dias ${sonoFmtMin(R.medMin)}` : '';
  const cochHoje = sonoCochiloMin(_sonoHoje());
  const sub = x ? [q5 && xm != null ? SONO_Q5[q5][0] : '', cochHoje ? `+ cochilo ${_sonoMinTxt(cochHoje)}` : '', media].filter(Boolean).join(' · ') || 'Noite registrada'
    : temHist ? ['Hoje: toque para registrar', media].filter(Boolean).join(' · ')
    : (S.on ? 'Toque para registrar a noite' : 'Registre seu sono');
  return `<div class="met met-sono" onclick="${x || temHist ? 'openSono()' : 'sonoRegistrar()'}"><div class="met-sono-a"><div class="met-h"><i>🌙</i>Sono</div><div class="met-v">${v}</div><div class="met-s">${mtEsc(sub)}</div></div>${_sonoMini()}</div>`;
}
// RC 5: as 7 últimas noites em barras, ao lado dos números. Só aparece quando o Sono ocupa a linha inteira
// dos indicadores (número ímpar de indicadores): antes sobrava meio cartão vazio.
function _sonoMini(){
  const L = _sonoUltimas(7).reverse(); const DN = ['D','S','T','Q','Q','S','S'];
  if(!L.some(o=>o.x && sonoMinDe(o.x) != null)) return '';
  const barras = L.map(o=>{ const m = o.x ? sonoMinDe(o.x) : null; const q = o.x ? _sonoQ5(o.x) : null;
    const h = m != null ? Math.max(8, Math.min(100, Math.round(m/600*100))) : 0;
    const cor = q ? SONO_Q5[q][1] : 'var(--primary)';
    const dia = new Date(o.dk + 'T12:00:00');
    return `<span class="sm7-c" title="${dia.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}: ${m != null ? sonoFmtMin(m) : 'sem registro'}"><span class="sm7-b">${m != null ? `<i style="height:${h}%;background:${cor}"></i>` : '<em></em>'}</span><small>${DN[dia.getDay()]}</small></span>`; }).join('');
  return `<div class="sm7" aria-label="Últimas 7 noites">${barras}</div>`;
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
// RC 4: cada parte do cartão abre o SEU detalhe (antes o cartão inteiro abria a mesma janela genérica):
//  • placar/barra → treinos do plano desta semana (planejados e concluídos, com o dia em que foram feitos);
//  • um dia → o que aconteceu naquele dia (atividades, o que estava planejado, descanso escolhido);
//  • Séries → as séries registradas na semana, por exercício;  • Semanas na meta → como a sequência foi contada;
//  • Extras → as atividades que ficaram fora do plano.
// Visual: feito (cheio), feito em outro dia (contorno cheio + ✓), planejado (tracejado), hoje (anel), descanso
// escolhido (cinza), faltou (contorno cinza com –), sem treino (só o fundo). Cores: só a do tema e tons neutros.
function _awPlanoSemana(){
  const ini = mtSemanaIni(Date.now()); const fim = ini + 7*DIA_MS; const hj = getDayIdx(); const DIAS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const H = mtHist().filter(x=>x.at >= ini && x.at < fim);
  const itens = [];
  ['lift','run'].forEach(m=>{ const mod = state.modules[m]; ((mod && mod.plan && mod.plan.workouts)||[]).forEach(w=>{
    if(w.motor && w.motor.tipo === 'prova') return;
    const mH = (mod.history||[]).filter(h=>h.at >= ini && h.at < fim && !h.adicional);
    // musculação: pelo treino (A, B…), em qualquer dia; corrida: pelo treino ou pela atividade feita no dia dele
    const feito = (w.k != null ? mH.find(h=>h.id === w.k) : null) || (m === 'run' ? mH.find(h=>(new Date(h.at).getDay()||7) === w.dayIdx) : null);
    const t = ini + (w.dayIdx-1)*DIA_MS;
    const pulado = (state.skips||[]).some(s=>s.at === t && s.module === m && (typeof skipEDoTreino !== 'function' || skipEDoTreino(s, w)));
    const st = feito ? ((new Date(feito.at).getDay()||7) === w.dayIdx ? 'feito' : 'movido') : pulado ? 'desc' : w.dayIdx < hj ? 'faltou' : w.dayIdx === hj ? 'hoje' : 'plan';
    itens.push({ m, w, dia: DIAS[w.dayIdx-1], nome: m === 'lift' ? `Treino ${w.k} — ${w.name}` : w.name, st, feito });
  }); });
  return itens.sort((a,b)=>a.w.dayIdx - b.w.dayIdx || (a.m < b.m ? -1 : 1));
}
function _awExtras(){
  const ini = mtSemanaIni(Date.now());
  const planos = { lift: !!(state.modules.lift && state.modules.lift.plan), run: !!(state.modules.run && state.modules.run.plan) };
  const runWs = (planos.run && state.modules.run.plan.workouts) || []; const cc = runWs.some(w=>w.motor && ['caminhada','camcorre'].includes(w.motor.tipo));
  const modDe = x=>x._t === 'musculacao' ? (planos.lift ? 'lift' : null) : (x._t === 'corrida' || (x._t === 'caminhada' && cc)) ? (planos.run ? 'run' : null) : null;
  const vistos = new Set(); const out = [];
  mtHist().filter(x=>x.at >= ini).forEach(x=>{ if(x.adicional){ out.push(x); return; } const m = modDe(x); const k = m + '|' + mtDia0(x.at); if(m && !vistos.has(k)) vistos.add(k); else out.push(x); });
  return out;
}
const _awNomeAtv = x=>x._t === 'musculacao' ? String(x.name||'Musculação') : ({ corrida:'Corrida', caminhada:'Caminhada', bike:'Bike' }[x._t] || 'Atividade');
const _awDetAtv = x=>[x.duration ? fmtDur(x.duration) : '', x.distance ? `${mtFmtKm(x.distance)} km` : '', +x.rpe > 0 ? `esforço ${x.rpe}/10` : ''].filter(Boolean).join(' · ');
// RC 5: volta o visual em anéis (o dos dias da semana repetia o quadro "Semana", logo abaixo).
// Os números continuam os corrigidos no RC 4: treinos do PLANO (mtAdesao), extras à parte, séries da semana e
// semanas seguidas na meta. O centro mostra o placar real (3/5 treinos), não mais a média dos três anéis.
// Cada linha abre o seu detalhe (openAwDetalhe), como no RC 4.
function _awMinutos(){
  const ini = mtSemanaIni(Date.now()); const R = state.modules.run;
  const min = Math.round(mtHist().filter(x=>x.at >= ini && x._t !== 'musculacao').reduce((t,x)=>t + (+x.duration||0), 0));
  const plan = R && R.plan ? Math.round((R.plan.workouts||[]).reduce((t,w)=>t + (+w.duration||0), 0)) : 0;
  return { min, plan };
}
window.renderQuickStats = function(){
  const el = $('home-quick'); if(!el) return;
  try{
    const S = mtSemanaAtiv();
    const ativos = S.dias.filter(o=>o.f).length;
    const pT = S.plan ? S.feitos/S.plan : (ativos ? 1 : 0);
    const usaSeries = S.temLift && S.setsPlan > 0;
    const M = usaSeries ? null : _awMinutos();
    const n2 = usaSeries ? S.setsFeitas : M.min, m2 = usaSeries ? S.setsPlan : M.plan;
    const pM = m2 ? n2/m2 : 0;
    const pS = S.metaSem ? Math.min(1, S.semanas/4) : 0;
    const pc = v=>Math.round(Math.min(1, v)*100);
    const linha = (tipo, cor, lbl, val, sub, p)=>`<button type="button" class="act-row aw-row" onclick="event.stopPropagation();openAwDetalhe('${tipo}')"><div class="act-line"><div class="act-lbl"><i class="act-dot" style="background:${cor}"></i>${lbl}</div>${p != null ? `<span class="act-pct">${pc(p)}%</span>` : ''}</div><div class="act-val">${val}<small>${sub}</small></div>${p != null ? `<div class="act-bar"><i style="width:${pc(p)}%;background:${cor}"></i></div>` : ''}</button>`;
    const centro = S.plan ? `<b>${S.feitos}<small>/${S.plan}</small></b><span>treinos</span>` : `<b>${ativos}</b><span>${ativos === 1 ? 'dia ativo' : 'dias ativos'}</span>`;
    el.innerHTML = `
      <div class="act-head"><h3>Atividade da semana</h3><span>${S.plan ? `${S.feitos} de ${S.plan} treinos` : `${ativos} ${ativos===1?'dia ativo':'dias ativos'}`}</span></div>
      <div class="act-card aw-anel">
        <button type="button" class="act-rings" onclick="event.stopPropagation();openAwDetalhe('${S.plan ? 'plano' : 'extras'}')" aria-label="Ver os treinos da semana"><svg viewBox="0 0 120 120">${_anel(52, pT, 'var(--primary)')}${m2 ? _anel(40, pM, 'var(--accent)') : ''}${S.metaSem ? _anel(28, pS, 'var(--prep)') : ''}</svg>
          <div class="act-center">${centro}</div></button>
        <div class="act-legend">
          ${S.plan ? linha('plano', 'var(--primary)', 'Treinos do plano', S.feitos, ` / ${S.plan}`, pT) : linha('extras', 'var(--primary)', 'Atividades', S.dias.reduce((t,o)=>t+o.f,0), ' na semana', null)}
          ${m2 ? (usaSeries ? linha('series', 'var(--accent)', 'Séries', n2, ` / ${m2}`, pM) : linha('plano', 'var(--accent)', 'Minutos', n2, ` / ${m2} min`, pM)) : ''}
          ${S.metaSem ? linha('semanas', 'var(--prep)', 'Semanas na meta', S.semanas, ` ${S.semanas === 1 ? 'semana' : 'semanas'} · meta 4`, pS) : ''}
          ${S.extras && S.plan ? `<button type="button" class="aw-extra" onclick="event.stopPropagation();openAwDetalhe('extras')">+ ${S.extras} ${S.extras === 1 ? 'atividade' : 'atividades'} fora do plano ›</button>` : ''}
        </div>
      </div>`;
    el.onclick = null;
  }catch(e){ console.log('atividade da semana:', e); el.innerHTML = ''; }
  try{ renderHomeMetrics(); }catch(e){}
};
window.openAwDetalhe = function(tipo, d){
  const S = mtSemanaAtiv(); const DN = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']; const DC = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const ini = mtSemanaIni(Date.now());
  const stTxt = { feito:'✓ feito', movido:'✓ feito em outro dia', desc:'descanso escolhido', hoje:'hoje · a fazer', faltou:'faltou', plan:'planejado' };
  const linha = (a, b, cls)=>`<div class="aw-li${cls ? ' ' + cls : ''}"><b>${a}</b><span>${b}</span></div>`;
  let tit = '', corpo = '';
  if(tipo === 'plano'){
    const P = _awPlanoSemana(); const falta = Math.max(0, S.plan - S.feitos);
    const prox = (typeof proximoTreino==='function') ? proximoTreino() : null;
    tit = 'Treinos do plano nesta semana';
    corpo = `<div class="aw-lista">${P.map(i=>linha(`${i.dia} · ${mtEsc(i.nome)}`, i.st === 'movido' && i.feito ? `✓ feito na ${['domingo','segunda','terça','quarta','quinta','sexta','sábado'][new Date(i.feito.at).getDay()]}` : stTxt[i.st], 'st-' + i.st)).join('') || '<p class="integ-mini">Sem treinos no plano.</p>'}</div>
      <p class="integ-p" style="margin-top:10px">${falta ? `Faltam <b>${falta}</b> ${falta===1?'treino':'treinos'} do plano para fechar a semana${prox ? `. Próximo: <b>${mtEsc(prox.nome)}</b> (${mtEsc(prox.quando)}).` : '.'}` : 'Semana do plano completa.'}</p>
      <p class="integ-mini">Conta no máximo um treino por modalidade por dia. Treino adicional e atividades fora do plano aparecem em "Extras".</p>`;
  } else if(tipo === 'dia'){
    const t0 = ini + (d-1)*DIA_MS; const o = S.dias.find(x=>x.d === d) || {};
    const H = mtHist().filter(x=>x.at >= t0 && x.at < t0 + DIA_MS);
    const P = _awPlanoSemana().filter(i=>i.w.dayIdx === d);
    tit = `${DN[d-1]}, ${mtFmtData(t0)}`;
    corpo = `<div class="section-lbl" style="margin:6px 0 4px">O que você fez</div>${H.length ? `<div class="aw-lista">${H.map(x=>linha(`${new Date(x.at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · ${mtEsc(_awNomeAtv(x))}${x.adicional ? ' (adicional)' : ''}`, mtEsc(_awDetAtv(x)))).join('')}</div>` : `<p class="integ-mini">${t0 > mtDia0() ? 'Este dia ainda não chegou.' : 'Nenhuma atividade registrada.'}</p>`}
      <div class="section-lbl" style="margin:12px 0 4px">No plano</div>${P.length ? `<div class="aw-lista">${P.map(i=>linha(mtEsc(i.nome), i.st === 'movido' && i.feito ? `✓ feito na ${['domingo','segunda','terça','quarta','quinta','sexta','sábado'][new Date(i.feito.at).getDay()]}` : stTxt[i.st], 'st-' + i.st)).join('')}</div>` : '<p class="integ-mini">Sem treino planejado neste dia.</p>'}
      ${o.st === 'desc' ? '<p class="integ-mini">Você marcou descanso neste dia: não conta como falta.</p>' : ''}`;
  } else if(tipo === 'series'){
    const porEx = [];
    Object.keys(state.progress||{}).forEach(id=>(state.progress[id]||[]).forEach(p=>{ if(p && p.date >= ini && (p.sets||[]).length){ let nome = id; try{ nome = nomeDoEx(id) || id; }catch(e){}
      const tempo = typeof exUsaTempo === 'function' && exUsaTempo(id);
      porEx.push({ t:p.date, nome, n:p.sets.filter(s=>+s.reps > 0).length, txt:p.sets.filter(s=>+s.reps > 0).map(s=>tempo ? fmtTempo(s.reps) : `${+s.peso > 0 ? String(+s.peso).replace('.',',') + ' kg × ' : ''}${s.reps}`).join(' · '), aberto: !p.sid }); } }));
    porEx.sort((a,b)=>a.t - b.t);
    tit = 'Séries da semana';
    corpo = `<p class="integ-p">${S.setsFeitas} séries registradas; o plano de musculação prevê ${S.setsPlan} por semana.</p>
      ${porEx.length ? `<div class="aw-lista">${porEx.map(e=>linha(`${DC[(new Date(e.t).getDay()||7)-1]} · ${mtEsc(e.nome)}`, `${e.n} ${e.n===1?'série':'séries'}${e.aberto ? ' (treino em andamento)' : ''}<br><small>${mtEsc(e.txt)}</small>`)).join('')}</div>` : '<p class="integ-mini">Nenhuma série registrada nesta semana.</p>'}`;
  } else if(tipo === 'semanas'){
    const linhas = [];
    for(let k=0; k<8; k++){ const a = ini - k*7*DIA_MS; const B = mtAdesao(a, a + 7*DIA_MS); const f = Math.min(B.feitos, B.porSem);
      const antesDoPlano = B.inicio != null && B.inicio >= a + 7*DIA_MS; const ok = f >= S.metaSem;
      linhas.push(linha(k === 0 ? 'Esta semana' : `Semana de ${mtFmtData(a)}`, antesDoPlano ? 'antes do plano' : `${f} de ${B.porSem} · ${ok ? '✓ na meta' : k === 0 ? 'em andamento' : 'abaixo'}`, ok ? 'st-feito' : ''));
      if(antesDoPlano) break; }
    tit = 'Semanas na meta';
    corpo = `<p class="integ-p">Meta da semana: pelo menos <b>${S.metaSem}</b> dos ${S.plan} treinos do plano (75%). A sequência conta semanas seguidas na meta, de trás para a frente; a primeira semana abaixo da meta encerra a contagem. A semana atual entra quando já bateu a meta.</p>
      <div class="aw-lista">${linhas.join('')}</div>
      <p class="integ-mini">Descanso escolhido não conta como falta. Treino adicional e atividades fora do plano não entram no placar.</p>`;
  } else {
    const E = _awExtras();
    tit = 'Extras da semana';
    corpo = E.length ? `<p class="integ-p">Atividades que não são sessões do plano: treino adicional, caminhada ou bike avulsa e um segundo treino da mesma modalidade no mesmo dia. Contam como atividade (dias ativos, conquistas, estatísticas), mas não no placar do plano.</p>
      <div class="aw-lista">${E.map(x=>linha(`${DC[(new Date(x.at).getDay()||7)-1]} · ${mtEsc(_awNomeAtv(x))}${x.adicional ? ' (adicional)' : ''}`, mtEsc(_awDetAtv(x)))).join('')}</div>` : '<p class="integ-mini">Nenhuma atividade fora do plano nesta semana.</p>';
  }
  $('modal-inner').innerHTML = `<h3>${tit}</h3>${corpo}<button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
};
window.openAtividadeDetalhes = function(){ return openAwDetalhe(mtSemanaAtiv().plan ? 'plano' : 'extras'); };   // compatibilidade

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
.sono-dist{display:flex;height:12px;border-radius:99px;overflow:hidden;gap:2px;margin:4px 0 6px}.sono-dist i{display:block;min-width:4px}
.sono-leg{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11.5px;color:var(--text-dim);margin:2px 0 6px}.sono-leg span{display:inline-flex;align-items:center;gap:5px}.sono-leg i{width:10px;height:10px;border-radius:3px;display:inline-block;flex:none}.sono-leg i.sl-sem{background:var(--text-mute)}
.sono-leg b{color:var(--text);font-weight:800}
.met-sono .met-v small{font-size:13px}
.nutri-agua{margin:10px 0 12px;padding:12px 14px;border-radius:var(--radius-card,16px);border:1px solid var(--border);background:var(--surface)}
.nutri-agua .na-top{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13.5px}
.nutri-agua .na-bts{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.nutri-agua .na-link{border:0;background:none;color:var(--text-dim);font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer;padding:6px 2px}
.nutri-agua .na-link:disabled{opacity:.4;cursor:default}
.nutri-agua .na-link:last-child{margin-left:auto}
/* Sono (RC 8): tempo acordado e cochilos */
.sono-opc{font-weight:600;text-transform:none;letter-spacing:0;color:var(--text-mute)}
.sono-coch-l{align-items:flex-end}
.sono-coch-l .sc-x{flex:0 0 auto;width:36px;height:42px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text-dim);font-size:15px;cursor:pointer}
#sono-coch-add{margin-top:6px}
/* Sono no Início (RC 5): 7 noites ao lado quando o cartão ocupa a linha inteira */
.met-sono .sm7{display:none}
.met-sono-a{display:flex;flex-direction:column;gap:6px;flex:1;min-width:0}
.met-sono.met-full{flex-direction:row!important;align-items:stretch;gap:14px}
.met-sono.met-full .met-sono-a{flex:1;min-width:0}
.met-sono.met-full .sm7{display:flex;align-items:flex-end;gap:6px;flex:0 0 auto;width:46%;max-width:210px}
.sm7-c{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0}
.sm7-b{position:relative;display:block;width:100%;max-width:16px;height:64px;border-radius:6px;background:var(--surface-2);overflow:hidden}
.sm7-b i{position:absolute;left:0;right:0;bottom:0;border-radius:6px}
.sm7-c small{font-size:10px;color:var(--text-mute);font-weight:600}
/* Atividade da semana (RC 5: anéis; cada linha abre o seu detalhe) */
.act-card.aw-anel::after{content:none}
.aw-anel button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:left;-webkit-tap-highlight-color:transparent}
.aw-anel .act-legend{display:flex;flex-direction:column;gap:10px;min-width:0;flex:1}
.aw-anel .aw-row{display:block;width:100%;border-radius:10px}
.aw-anel .aw-row:active,.aw-anel .act-rings:active{transform:scale(.985)}
.act-center b small{font-size:15px;color:var(--text-dim);font-weight:400}
.aw-extra{font-size:12px!important;font-weight:700!important;color:var(--primary-2)!important;margin-top:-2px}
.aw-anel .act-rings:focus-visible,.aw-anel .aw-row:focus-visible,.aw-extra:focus-visible{outline:2px solid var(--primary);outline-offset:2px;border-radius:12px}
@media (max-width:370px){.aw-anel{gap:12px;padding:14px}.aw-anel .act-rings{flex-basis:108px;width:108px;height:108px}}
.aw-lista{display:flex;flex-direction:column;gap:2px;margin-top:6px}
.aw-li{display:flex;justify-content:space-between;gap:10px;padding:9px 2px;border-bottom:1px solid var(--border);font-size:13.5px}.aw-li b{font-weight:700;min-width:0}.aw-li span{color:var(--text-dim);text-align:right;flex:none;max-width:55%}
.aw-li span small{color:var(--text-mute);font-size:11.5px}
.aw-li.st-faltou span{color:var(--text-mute)}.aw-li.st-feito span,.aw-li.st-movido span{color:var(--primary-2)}
`; document.head.appendChild(s); })();

Object.assign(window, { sonoAnalise, sonoAnaliseHTML, mtSemanaAtiv, _sonoTotal, _sonoMarca5, _sonoTile, _awPlanoSemana, _awExtras });

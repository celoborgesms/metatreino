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
    <div id="sono-hor" ${modo==='hor'?'':'hidden'} class="sono-campos"><label>Fui dormir<input class="input mono" type="time" id="sono-dor" value="${x.dor||''}" oninput="_sonoTotal()"></label><label>Acordei<input class="input mono" type="time" id="sono-aco" value="${x.aco||''}" oninput="_sonoTotal()"></label></div>
    <div id="sono-h" ${modo==='h'?'':'hidden'} class="sono-campos"><label>Horas<input class="input mono" type="number" min="0" max="16" inputmode="numeric" id="sono-hh" value="${hh}" placeholder="7" oninput="_sonoTotal()"></label><label>Minutos<input class="input mono" type="number" min="0" max="59" step="1" inputmode="numeric" id="sono-mm" value="${mm}" placeholder="30" oninput="_sonoTotal()"></label></div>
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
function sonoHorasExatas(dor, aco){ return sonoHorasDe(dor, aco); }   // compatibilidade; a conta é sonoMinutosDe (parte 76)
function _sonoLeTotal(){   // { min } do que está na tela, ou { erro }
  if($('sono-hor') && !$('sono-hor').hidden){ const a = $('sono-dor') && $('sono-dor').value, b = $('sono-aco') && $('sono-aco').value; return { min: (a && b) ? sonoMinutosDe(a, b) : null }; }
  const hv = String(($('sono-hh')||{}).value||'').trim(), mv = String(($('sono-mm')||{}).value||'').trim(); if(!hv && !mv) return { min:null };
  const h = +hv || 0, m = +mv || 0; if(!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 16 || m < 0 || m > 59) return { erro:'Horas de 0 a 16 e minutos de 0 a 59 (números inteiros).' };
  return { min: h*60 + m };
}
function _sonoTotal(){ const el = $('sono-total'); if(!el) return; const T = _sonoLeTotal(); el.textContent = T.erro ? T.erro : (T.min != null ? `Total: ${sonoFmtMin(T.min)} de sono` : ''); }
function _sonoMarca5(k, v){ const cur = window['__sono' + (k==='q5'?'Q5':'D5')]; const nv = cur === v ? null : v; window['__sono' + (k==='q5'?'Q5':'D5')] = nv;
  document.querySelectorAll(`#sono-${k} button`).forEach(b=>{ const on = +b.dataset.v === nv; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); }
window._sonoModo = function(m){ $('sono-h').hidden = m !== 'h'; $('sono-hor').hidden = m !== 'hor'; document.querySelectorAll('.sono-modo button').forEach((b,i)=>b.classList.toggle('on', (i===0) === (m==='hor'))); _sonoTotal(); };
window.sonoRegSalva = function(){
  const dk = window.__sonoDk || _sonoHoje();
  const q5 = window.__sonoQ5 || null, d5 = window.__sonoD5 || null;
  const d = { q5, d5, q:_q3de5(q5), d:_q3de5(d5), min:null, h:null, dor:null, aco:null };
  // os dois modos usam a mesma base: minutos inteiros (só um horário: guarda, sem inventar o total)
  if(!$('sono-hor').hidden){ d.dor = $('sono-dor').value || null; d.aco = $('sono-aco').value || null; }
  const T = _sonoLeTotal(); if(T.erro){ toast(T.erro); return; }
  if(T.min != null && T.min > 0){ d.min = T.min; d.h = T.min/60; }
  if(d.min != null && (d.min < 30 || d.min > 960)){ toast('Confira o horário: o total ficou em ' + sonoFmtMin(d.min)); return; }
  const S = sonoEst(); const ant = S.n[dk] || {}; const novo = Object.assign({}, ant);
  ['q5','d5','q','d','min','h','dor','aco'].forEach(k=>{ if(d[k] == null) delete novo[k]; else novo[k] = d[k]; });
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
    if(!sonoLigado()) return;
    const tela = $('sono-tela'); if(!tela) return;
    const det = tela.querySelector('details.integ-sec'); if(det) det.insertAdjacentHTML('beforebegin', sonoAnaliseHTML());
    // lista: mostra a qualidade e a disposição de 5 níveis
    tela.querySelectorAll('.integ-item').forEach(b=>{ const m = /sonoRegistrar\('([\d-]+)'\)/.exec(b.getAttribute('onclick')||''); if(!m) return; const x = sonoNoite(m[1]); const sm = b.querySelector('small'); if(!x || !sm) return;
      sm.textContent = [sonoMinDe(x) != null ? sonoFmtMin(sonoMinDe(x)) : '', x.dor && x.aco ? `${x.dor}–${x.aco}` : (x.dor ? `dormiu ${x.dor}` : x.aco ? `acordou ${x.aco}` : ''), _sonoQ5(x) ? SONO_Q5[_sonoQ5(x)][0] : '', _sonoD5(x) ? 'disposição ' + SONO_D5[_sonoD5(x)].toLowerCase() : ''].filter(Boolean).join(' · '); });
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
  const v = x && xm != null ? `${sonoFmtMin(xm).replace(' h', '<small>h</small>').replace(/ (\d\d)$/, '<small>$1</small>')}` : (x && q5 ? `<span style="font-size:20px">${SONO_Q5[q5][0]}</span>` : '–');
  const sub = x ? [q5 && xm != null ? SONO_Q5[q5][0] : '', R && R.medMin != null && R.n >= 2 ? `média 7 dias ${sonoFmtMin(R.medMin)}` : ''].filter(Boolean).join(' · ') || 'Noite registrada'
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
window.renderQuickStats = function(){
  const el = $('home-quick'); if(!el) return;
  try{
    const S = mtSemanaAtiv(); const DN = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
    const pct = S.plan ? Math.min(100, Math.round(S.feitos/S.plan*100)) : 0;
    const titSt = { feito:'feito', movido:'treino feito em outro dia', desc:'descanso escolhido', hoje:'hoje, a fazer', 'livre-hoje':'hoje, sem treino', faltou:'faltou', plan:'planejado', livre:'sem treino' };
    const marca = { feito:'✓', movido:'✓', faltou:'–' };
    const col = o=>`<button type="button" class="aw-d st-${o.st}${o.d===S.hoje?' hj':''}" onclick="event.stopPropagation();openAwDetalhe('dia',${o.d})" aria-label="${DN[o.d-1]}: ${titSt[o.st]}${o.f > 1 ? `, ${o.f} atividades` : ''}"><span class="aw-cap">${marca[o.st] ? `<i>${marca[o.st]}</i>` : ''}${o.f > 1 ? `<em>${o.f}</em>` : ''}</span><span class="aw-dn">${DN[o.d-1]}</span></button>`;
    const kpi = (tipo, lbl, val, sub, p)=>`<button type="button" class="aw-k" onclick="event.stopPropagation();openAwDetalhe('${tipo}')"><small>${lbl}</small><b>${val}</b>${sub ? `<span>${sub}</span>` : ''}${p != null ? `<span class="aw-bar"><i style="width:${Math.min(100, Math.round(p*100))}%"></i></span>` : ''}</button>`;
    const ativos = S.dias.filter(o=>o.f).length;
    el.innerHTML = `
      <div class="act-head"><h3>Atividade da semana</h3><span>${S.plan ? `${S.feitos} de ${S.plan} treinos` : `${ativos} ${ativos===1?'dia ativo':'dias ativos'}`}</span></div>
      <div class="aw">
        <button type="button" class="aw-top" onclick="event.stopPropagation();openAwDetalhe('${S.plan ? 'plano' : 'extras'}')" aria-label="Ver os treinos da semana">
          <span class="aw-placar"><b>${S.plan ? S.feitos : S.dias.reduce((t,o)=>t+o.f,0)}</b><span>${S.plan ? `/${S.plan} treinos do plano` : ' atividades'}</span></span>
          ${S.plan ? `<span class="aw-pct">${pct}%</span>` : ''}
          ${S.plan ? `<span class="aw-meter" role="progressbar" aria-valuemin="0" aria-valuemax="${S.plan}" aria-valuenow="${S.feitos}"><i style="width:${pct}%"></i></span>` : ''}
        </button>
        <div class="aw-dias">${S.dias.map(col).join('')}</div>
        <div class="aw-leg"><span><i class="lg-f"></i>feito</span><span><i class="lg-m"></i>outro dia</span><span><i class="lg-p"></i>planejado</span><span><i class="lg-x"></i>faltou</span><span><i class="lg-d"></i>descanso</span></div>
        <div class="aw-ks">
          ${S.temLift && S.setsPlan ? kpi('series', 'Séries', `${S.setsFeitas}<small>/${S.setsPlan}</small>`, 'na semana', S.setsFeitas/S.setsPlan) : ''}
          ${S.plan ? kpi('semanas', 'Semanas na meta', `${S.semanas}`, `seguidas · ${S.metaSem}+ treinos`, null) : ''}
          ${S.extras ? kpi('extras', 'Extras', `${S.extras}`, S.extras===1 ? 'fora do plano' : 'fora do plano', null) : ''}
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
/* Atividade da semana (RC 4) */
.aw{padding:14px 14px 12px;border-radius:var(--radius-card,18px);border:1px solid var(--border);background:var(--surface)}
.aw button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;text-align:left}
.aw-top{display:grid!important;grid-template-columns:1fr auto;align-items:end;gap:6px 10px;width:100%}
.aw-placar b{font-size:36px;line-height:1;font-weight:800;letter-spacing:-1px}.aw-placar span{font-size:13px;color:var(--text-dim);font-weight:600;margin-left:3px}
.aw-pct{font-size:13px;font-weight:800;color:var(--primary-2);padding:4px 10px;border-radius:99px;background:var(--tint-primary)}
.aw-meter{grid-column:1/-1;display:block;height:8px;border-radius:99px;background:var(--surface-2);overflow:hidden;margin:6px 0 12px}.aw-meter i{display:block;height:100%;border-radius:inherit;background:var(--primary);transition:width .5s var(--mt-ease,ease)}
.aw-dias{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;align-items:end}
.aw-d{display:flex!important;flex-direction:column;align-items:center;gap:5px;min-width:0;min-height:44px}
.aw-dn{font-size:11px;color:var(--text-dim);font-weight:600}
.aw-d.hj .aw-dn{color:var(--primary-2);font-weight:800}
.aw-cap{position:relative;display:flex;align-items:center;justify-content:center;width:100%;max-width:34px;height:40px;border-radius:10px;background:var(--surface-2);box-sizing:border-box}
.aw-cap i{font-style:normal;font-size:15px;font-weight:800;line-height:1}
.aw-cap em{position:absolute;top:-6px;right:-4px;min-width:16px;height:16px;padding:0 3px;border-radius:99px;font-style:normal;font-size:10px;font-weight:800;line-height:16px;text-align:center;background:var(--text);color:var(--bg)}
.aw-d.st-feito .aw-cap{background:var(--primary);color:var(--on-primary)}
.aw-d.st-movido .aw-cap{background:transparent;border:2px solid var(--primary);color:var(--primary-2)}
.aw-d.st-plan .aw-cap{background:transparent;border:1.5px dashed var(--text-mute)}
.aw-d.st-hoje .aw-cap{background:transparent;border:2px solid var(--primary);box-shadow:0 0 0 3px rgba(var(--primary-rgb),.16)}
.aw-d.st-faltou .aw-cap{background:transparent;border:1.5px solid var(--border);color:var(--text-mute)}
.aw-d.st-desc .aw-cap{background:var(--surface-2);opacity:.75}
.aw-d.st-livre .aw-cap,.aw-d.st-livre-hoje .aw-cap{background:var(--surface-2);opacity:.45}
.aw-d.st-livre-hoje .aw-cap{opacity:.7;box-shadow:inset 0 0 0 1.5px var(--text-mute)}
.aw-leg{display:flex;flex-wrap:wrap;gap:4px 12px;margin:10px 0 2px;font-size:11px;color:var(--text-mute)}
.aw-leg span{display:flex;align-items:center;gap:5px}.aw-leg i{width:10px;height:10px;border-radius:3px;display:block;box-sizing:border-box}
.aw-leg .lg-f{background:var(--primary)}.aw-leg .lg-m{border:2px solid var(--primary)}.aw-leg .lg-p{border:1.5px dashed var(--text-mute)}.aw-leg .lg-x{border:1.5px solid var(--text-mute)}.aw-leg .lg-d{background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--border)}
.aw-ks{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin-top:12px}
.aw-k{display:block!important;padding:9px 10px!important;border-radius:12px;background:var(--bg-2,var(--surface-2))!important;min-width:0}
.aw-k small{display:block;font-size:10.5px;color:var(--text-mute);font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.aw-k b{display:block;font-size:19px;font-weight:800;margin-top:2px}.aw-k b small{display:inline;font-size:12px;text-transform:none;letter-spacing:0}
.aw-k span{display:block;font-size:11px;color:var(--text-dim);margin-top:1px;line-height:1.3}
.aw-bar{height:4px;border-radius:99px;background:var(--surface-2);overflow:hidden;margin-top:6px}.aw-bar i{display:block;height:100%;background:var(--primary)}
.aw-d:focus-visible,.aw-k:focus-visible,.aw-top:focus-visible{outline:2px solid var(--primary);outline-offset:2px;border-radius:12px}
.aw-lista{display:flex;flex-direction:column;gap:2px;margin-top:6px}
.aw-li{display:flex;justify-content:space-between;gap:10px;padding:9px 2px;border-bottom:1px solid var(--border);font-size:13.5px}.aw-li b{font-weight:700;min-width:0}.aw-li span{color:var(--text-dim);text-align:right;flex:none;max-width:55%}
.aw-li span small{color:var(--text-mute);font-size:11.5px}
.aw-li.st-faltou span{color:var(--text-mute)}.aw-li.st-feito span,.aw-li.st-movido span{color:var(--primary-2)}
@media (max-width:370px){.aw-cap{height:36px}.aw-dias{gap:4px}.aw-leg{gap:3px 9px}}
@media (prefers-reduced-motion:reduce){.aw-meter i{transition:none}}
`; document.head.appendChild(s); })();

Object.assign(window, { sonoAnalise, sonoAnaliseHTML, mtSemanaAtiv, _sonoTotal, _sonoMarca5, _sonoTile, _awPlanoSemana, _awExtras });

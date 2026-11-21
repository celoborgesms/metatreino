
// =====================================================================
// 70. 2027 RC 0 — Musculação: progressão pelo desempenho real (subir, manter, aliviar ou rever)
// ---------------------------------------------------------------------
// O que JÁ existia e continua igual (app.js, smartProgressionHint): progressão dupla — fechou o topo da
// faixa de repetições em todas as séries (2 sessões, ou 1 com esforço até 7/10) → próximo degrau de carga
// (proxCarga); abaixo da faixa → mantém; duas sessões no limite (9–10) com reps caindo → −10%.
// O que esta parte acrescenta:
//  • "Rever o exercício": 4 sessões em 3+ semanas sem evolução (mesma carga e repetições paradas ou
//    caindo, sem fechar a faixa) → explica o que conferir (sono, comida, intervalo) e as saídas (aliviar
//    ~10% e reconstruir, ou trocar por uma variação pelo botão de troca). Só entra quando a dica de sempre
//    não é "subir" nem "aliviar" (essas têm prioridade).
//  • Painel "Progressão das cargas" (aba Treinos, musculação): cada exercício do plano com a situação
//    (subir / manter / aliviar / rever / primeira vez), a última série de referência e a orientação do dia.
//    É o mesmo texto que aparece no registro de séries — uma regra só.
//  • Nada muda sozinho no plano: séries, exercícios e volume não aumentam automaticamente.
// =====================================================================
function _pgDia0(t){ const d = new Date(t); d.setHours(0,0,0,0); return d.getTime(); }
function _pgSessoes(exId){
  const hoje = _pgDia0(Date.now());
  return (state.progress[exId]||[]).filter(p=>p && p.sets && p.sets.length && _pgDia0(p.date) < hoje).slice().sort((a,b)=>a.date-b.date);
}
function _pgTopo(sess){ // melhor série: maior carga; empate → mais repetições
  return sess.sets.reduce((b,s)=>{ const kg = +s.peso||0, r = +s.reps||0; return (kg > b.kg || (kg === b.kg && r > b.reps)) ? { kg, reps:r } : b; }, { kg:0, reps:0 });
}
// platô: 4 sessões, 3+ semanas, a última nas 3 últimas semanas, sem subir carga nem repetições e sem fechar a faixa
function mtPlato(exId){
  try{
    if(exUsaTempo(exId)) return null;
    const L = _pgSessoes(exId); if(L.length < 4) return null;
    const u = L.slice(-4);
    const dias = (u[3].date - u[0].date)/DIA_MS;
    if(dias < 20 || Date.now() - u[3].date > 21*DIA_MS) return null;
    const range = repRangeFor(exId);
    if(u[3].sets.every(s=>(+s.reps||0) >= range.hi)) return null;       // já no topo: é caso de subir, não de rever
    const T = u.map(_pgTopo);
    const corpo = T.every(t=>t.kg === 0);   // carga opcional (panturrilha, core) com carga registrada conta como carga
    if(corpo){
      const tot = u.map(s=>s.sets.reduce((t,x)=>t+(+x.reps||0),0));
      if(Math.max(...tot.slice(1)) > tot[0] || Math.max(...T.slice(1).map(t=>t.reps)) > T[0].reps) return null;
      return { sessoes:4, semanas:Math.round(dias/7), corpo:true, reps:T[3].reps };
    }
    if(T.some(t=>t.kg > T[0].kg)) return null;                              // subiu carga em algum momento
    if(T[3].reps > T[0].reps) return null;                                  // ganhou repetição: está evoluindo
    return { sessoes:4, semanas:Math.round(dias/7), corpo:false, kg:T[3].kg, reps:T[3].reps, caiu: T[3].kg < T[0].kg || T[3].reps < T[0].reps };
  }catch(e){ return null; }
}
function _pgReverTxt(exId, P){
  const nome = (typeof nomeDoEx === 'function' ? nomeDoEx(exId) : '') || 'este exercício';
  const ref = P.corpo ? `${P.reps} repetições` : `${String(P.kg).replace('.',',')}kg × ${P.reps}`;
  return `🔁 ${P.sessoes} sessões em cerca de ${P.semanas} semanas sem evoluir ${P.caiu ? '(e caindo um pouco) ' : ''}no ${mtEsc(nome)} — referência: ${ref}. `
    + `Antes de forçar, confira sono, alimentação e se há pelo menos 48 h entre treinos do mesmo músculo. Saídas: `
    + (P.corpo ? 'uma variação um pouco mais fácil para voltar a ganhar repetições, ou trocar o exercício pelo botão de troca por 4 a 6 semanas.'
               : `hoje use ~${String(Math.max(0, Math.round(P.kg*0.9*2)/2)).replace('.',',')}kg (−10%) e volte a subir aos poucos, ou troque por uma variação pelo botão de troca por 4 a 6 semanas.`);
}
(function(){
  const _hint = window.smartProgressionHint; if(typeof _hint !== 'function') return;
  window.smartProgressionHint = function(exId){
    const h = _hint.apply(this, arguments);
    try{
      if(!h || h.cls === 'card-ok' || /🔋|exaust/.test(h.txt || '')) return h;   // subir e aliviar têm prioridade
      const P = mtPlato(exId);
      if(P) return { cls:'card-warn', txt:_pgReverTxt(exId, P), rever:true };
    }catch(e){}
    return h;
  };
})();
// situação de um exercício (usa a mesma dica do registro de séries)
function mtProgSituacao(exId){
  const L = _pgSessoes(exId);
  if(!L.length) return { k:'novo', h: smartProgressionHint(exId), ult:null };
  const h = smartProgressionHint(exId);
  const k = h.rever ? 'rever' : h.cls === 'card-ok' ? 'subir' : /🔋|exaust/.test(h.txt||'') ? 'aliviar' : 'manter';
  const ult = L[L.length-1]; const T = _pgTopo(ult);
  return { k, h, ult: { quando: ult.date, txt: T.kg > 0 ? `${String(T.kg).replace('.',',')}kg × ${T.reps}` : (exUsaTempo(exId) ? fmtTempo(T.reps) : `${T.reps} reps`), n: L.length } };
}
const PG_K = { aliviar:['Aliviar','pg-aliviar'], rever:['Rever','pg-rever'], subir:['Subir','pg-subir'], manter:['Manter','pg-manter'], novo:['Primeira vez','pg-novo'] };
function _pgExerciciosDoPlano(){
  const ws = ((state.modules.lift||{}).plan||{}).workouts || []; const vistos = new Set(); const out = [];
  ws.forEach(w=>(w.exercises||[]).forEach(e=>{ if(e && e.id && !vistos.has(e.id)){ vistos.add(e.id); out.push({ id:e.id, name:e.name, treino:w.name }); } }));
  return out;
}
function mtProgResumo(){
  const r = { aliviar:0, rever:0, subir:0, manter:0, novo:0, lista:[] };
  _pgExerciciosDoPlano().forEach(e=>{ const s = mtProgSituacao(e.id); r[s.k]++; r.lista.push(Object.assign({}, e, s)); });
  return r;
}
function openProgressaoCargas(){
  const R = mtProgResumo();
  const ordem = ['aliviar','rever','subir','manter','novo'];
  const lista = R.lista.slice().sort((a,b)=>ordem.indexOf(a.k) - ordem.indexOf(b.k) || a.name.localeCompare(b.name,'pt'));
  const linha = x=>`<div class="pg-item"><div class="pg-l1"><b>${mtEsc(x.name)}</b><span class="pg-pill ${PG_K[x.k][1]}">${PG_K[x.k][0]}</span></div>
    ${x.ult ? `<div class="pg-ref">Última: ${x.ult.txt} · ${mtFmtData(x.ult.quando)} · ${x.ult.n} ${x.ult.n===1?'sessão':'sessões'} registradas</div>` : ''}
    <div class="pg-txt">${x.h && x.h.txt ? x.h.txt : ''}</div></div>`;
  $('modal-inner').innerHTML = `<h3>Progressão das cargas</h3>
    <p class="mt-muted" style="margin:4px 0 10px">A orientação de cada exercício vem dos seus registros: carga, repetições e o esforço que você informou ao salvar o treino.</p>
    <div class="pg-res">${ordem.filter(k=>R[k]).map(k=>`<span class="pg-pill ${PG_K[k][1]}">${R[k]} ${PG_K[k][0].toLowerCase()}</span>`).join('')}</div>
    ${lista.length ? lista.map(linha).join('') : '<p class="mt-muted">Seu plano ainda não tem exercícios.</p>'}
    <details class="pg-como"><summary><b>Como o app decide</b></summary><ul>
      <li><b>Subir:</b> todas as séries no topo da faixa de repetições em 2 sessões (ou em 1, com esforço até 7/10). A carga sobe um degrau; é normal as repetições caírem um pouco na primeira vez.</li>
      <li><b>Manter:</b> ainda buscando o topo da faixa. Tente +1 repetição por série com a mesma carga.</li>
      <li><b>Aliviar:</b> duas sessões no limite (esforço 9–10) com repetições caindo: cerca de −10% por um treino, caprichando na técnica.</li>
      <li><b>Rever:</b> 4 sessões em 3 semanas ou mais sem evolução. Confira sono, alimentação e descanso; depois alivie e reconstrua, ou troque por uma variação.</li>
      <li>O app nunca aumenta séries ou exercícios sozinho. Mais volume só faz sentido se você estiver recuperando bem.</li>
    </ul></details>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
mtGancho('renderSessions', { depois(){
  try{
    const v = $('pg-entrada'); if(v) v.remove();
    if(state.active !== 'lift' || !((state.modules.lift||{}).plan)) return;
    const R = mtProgResumo(); if(!R.lista.some(x=>x.k !== 'novo')) return;   // sem histórico ainda: nada a mostrar
    const partes = [R.subir ? `${R.subir} para subir` : '', R.aliviar ? `${R.aliviar} para aliviar` : '', R.rever ? `${R.rever} para rever` : ''].filter(Boolean);
    const slot = $('sess-prestart'); if(!slot) return;
    slot.insertAdjacentHTML('afterend', `<button class="pg-entrada" id="pg-entrada" onclick="openProgressaoCargas()"><span><b>Progressão das cargas</b><small>${partes.length ? partes.join(' · ') : 'tudo no ritmo: siga as orientações de cada exercício'}</small></span><span class="rc-seta">›</span></button>`);
  }catch(e){ console.log('progressão:', e); }
}});
(function(){ if(document.getElementById('pg-css')) return; const s = document.createElement('style'); s.id = 'pg-css';
s.textContent = `
.pg-entrada{width:100%;display:flex;align-items:center;gap:10px;text-align:left;margin:10px 0;padding:12px 14px;border-radius:var(--radius-card,18px);border:1px solid var(--border);background:var(--surface);color:var(--text);font:inherit;cursor:pointer}
.pg-entrada span:first-child{flex:1;display:flex;flex-direction:column;gap:2px}
.pg-entrada small{font-size:12px;color:var(--text-dim)}
.pg-res{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.pg-item{padding:11px 0;border-bottom:1px solid var(--border)}
.pg-l1{display:flex;align-items:center;justify-content:space-between;gap:8px}
.pg-ref{font-size:12px;color:var(--text-mute);margin-top:2px}
.pg-txt{font-size:12.5px;color:var(--text-dim);line-height:1.5;margin-top:4px}
.pg-pill{flex:none;font-size:11px;font-weight:800;padding:3px 9px;border-radius:99px;border:1px solid var(--border);white-space:nowrap}
.pg-subir{color:var(--prep-soft,#99f6e4);border-color:rgba(var(--prep-rgb,45,212,191),.45);background:rgba(var(--prep-rgb,45,212,191),.1)}
.pg-aliviar{color:var(--danger-soft);border-color:var(--line-danger,rgba(244,63,94,.35));background:var(--tint-danger,rgba(244,63,94,.08))}
.pg-rever{color:#f2b705;border-color:rgba(242,183,5,.45);background:rgba(242,183,5,.08)}
[data-theme="claro"] .pg-rever,[data-theme="areia"] .pg-rever{color:#975a16}
.pg-manter{color:var(--text-dim)}
.pg-novo{color:var(--text-mute)}
.pg-como{margin-top:12px;font-size:13px;line-height:1.55}
.pg-como ul{padding-left:18px;display:flex;flex-direction:column;gap:6px;margin:8px 0 0}
`; document.head.appendChild(s); })();

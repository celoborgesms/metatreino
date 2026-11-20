
// =====================================================================
// 58. Beta 55 — auditoria: dados coerentes entre módulos, novidades em Desafios,
//     Progresso pela modalidade ativa, importação no lugar certo e recuperação informativa
// =====================================================================
// O que esta parte faz (o resto da Beta 55 está nas partes 10, 11, 15, 26, 33, 42, 54 e 57):
//  1. Atividade impossível (ritmo mais rápido que recorde mundial, bike a 90 km/h) não vira recorde nem
//     conquista. No registro à mão o app pergunta antes de salvar. Importação já tinha essa regra (imp.valido).
//  2. Desafios: seção "Novidades" no topo, com cada coisa nova e onde ela está. O indicador da aba é um número
//     pequeno (quantas novidades) e some quando tudo foi visto.
//  3. Progresso › Desempenho: sem o seletor Musculação | Corrida (a modalidade vem do Início/Perfil). O calendário
//     mostra só a modalidade ativa; os chips de cardio não aparecem na musculação.
//  4. Treinos (musculação): o atalho "Registrar atividade" vira "Importar do relógio" (abre Integrações e
//     atividades, que também tem o registro à mão). Na corrida, o registro continua no plano e no atalho.
//  5. Detalhe de uma atividade registrada à mão: o mesmo resumo das importadas (modalidade, ritmo, esforço, origem).
//  6. Anatomia muscular: "Seu histórico com este músculo" — último estímulo, séries da semana, próximo treino
//     previsto e se uma corrida recente também usou o músculo. Informativo; sem percentual de recuperação.

// ---------- 1. atividade com números impossíveis ----------
const MT_RITMO_MIN = { corrida: 2.6, caminhada: 4.0 };   // min/km mais rápidos que isso não são humanos (recorde mundial ~2:50/km nos 10 km)
const MT_BIKE_MAX = 75;                                   // km/h de média
function mtAtvRitmoImpossivel(tipo, km, min){
  km = +km; min = +min; if(!(km > 0) || !(min > 0)) return false;
  if(tipo === 'bike') return km / (min/60) > MT_BIKE_MAX;
  const lim = MT_RITMO_MIN[tipo === 'caminhada' ? 'caminhada' : 'corrida'];
  return km >= 0.4 && (min / km) < lim;
}
function mtAtvInvalida(x){
  if(!x) return false;
  if(x.imp && x.imp.valido === false) return true;
  if(x.module === 'lift' || x.activity === 'forca') return false;
  return mtAtvRitmoImpossivel(x.activity || 'corrida', x.distance, x.duration);
}
// registro à mão: pergunta antes de salvar um número impossível
const _saveActivityLogB55 = window.saveActivityLog;
window.saveActivityLog = function(){
  try{
    const km = parseFloat((($('act-km')||{}).value||'').replace(',','.')); const min = parseTimeToMin((($('act-min')||{}).value)||'');
    if(!window.__mtRitmoOk && mtAtvRitmoImpossivel(actLogType, km, min)){
      const rit = actLogType === 'bike' ? `${(km/(min/60)).toFixed(1).replace('.',',')} km/h de média` : `ritmo de ${fmtPaceMin(min/km)}`;
      appConfirm(`${String(km).replace('.',',')} km em ${fmtDur(min)} dá ${rit} — mais rápido que o recorde mundial. Confira a distância e o tempo (minutos:segundos).<br><br>Se salvar assim, a atividade fica no histórico, mas <b>não conta para recordes nem conquistas</b>.`,
        ()=>{ // a janela de confirmação já substituiu o formulário: salva com os números lidos antes
          window.__mtRegEm = Date.now();
          let r; window.__mtSemConquista = true;
          try{ r = maLogActivity(actLogType, km, min, window.__rpe || 5); } finally { window.__mtSemConquista = false; }
          closeModal(); toast(r && r.msg ? r.msg.replace(/<[^>]+>/g,'') : '✅ Atividade registrada!');
          if(state.ui.tab) goTab(state.ui.tab); },
        { title:'Esses números estão certos?', okLabel:'Salvar assim mesmo', cancelLabel:'Corrigir' });
      return;
    }
  }catch(e){}
  return _saveActivityLogB55.apply(this, arguments);
};
// enquanto salva uma atividade com números impossíveis (o aluno confirmou), nenhuma conquista é desbloqueada
const _unlockTrophyB55 = window.unlockTrophy;
window.unlockTrophy = function(){ if(window.__mtSemConquista) return false; return _unlockTrophyB55.apply(this, arguments); };
// conquistas de corrida: nada a partir de números impossíveis (a parte 57 já filtrava os importados inválidos)
const _checkRunEvolutionB55 = window.checkRunEvolution;
window.checkRunEvolution = function(km, pace){
  try{ const p = parsePace(pace); if(p && p < MT_RITMO_MIN.corrida) return; }catch(e){}
  const R = state.modules.run; const orig = R && R.history;
  if(!orig) return _checkRunEvolutionB55.apply(this, arguments);
  const ult = orig[orig.length-1];
  R.history = orig.filter(x=>x === ult || !mtAtvInvalida(x));
  try{ return _checkRunEvolutionB55.apply(this, arguments); } finally { R.history = orig; }
};
// recordes: refeitos sem as atividades impossíveis (a parte 57 já faz isso para as importadas)
mtGancho('renderRecords', { depois(){
  try{
    const list = $('records-list'); const R = state.modules.run; if(!list || !R) return;
    const todas = R.history || []; if(!todas.some(x=>mtAtvInvalida(x) && !(x.imp && x.imp.valido === false))) return;
    const H = todas.filter(x=>!mtAtvInvalida(x)); const dt = ts=>new Date(ts).toLocaleDateString('pt-BR');
    const linha = t=>[...list.querySelectorAll('.rec-row')].find(r=>{ const e = r.querySelector(':scope > div > div'); return e && e.textContent.trim() === t; });
    const acerta = (t, x, val)=>{ const r = linha(t); if(!r) return; if(!x){ r.remove(); return; } const d = r.querySelectorAll(':scope > div > div')[1]; if(d) d.textContent = dt(x.at); const v = r.querySelector('.rec-val'); if(v) v.textContent = val; };
    const cor = H.filter(x=>!x.activity || x.activity === 'corrida');
    const maior = cor.filter(x=>x.distance).reduce((a,x)=>!a || x.distance > a.distance ? x : a, null); acerta('Maior distância', maior, maior && `${maior.distance} km`);
    const pace = cor.filter(x=>x.pace && x.distance >= 1).reduce((a,x)=>!a || parsePace(x.pace) < parsePace(a.pace) ? x : a, null); acerta('Melhor ritmo', pace, pace && pace.pace);
    [['bike','Maior pedalada'],['caminhada','Maior caminhada']].forEach(([t, tit])=>{ const m = H.filter(x=>x.activity === t && x.distance).reduce((a,x)=>!a || x.distance > a.distance ? x : a, null); acerta(tit, m, m && `${m.distance} km`); });
  }catch(e){}
}});
// histórico: um selo discreto avisa por que a atividade não conta para recordes
mtGancho('renderHistory', { depois(){
  try{
    if(state.active !== 'run') return; const h = ((state.modules.run||{}).history)||[];
    document.querySelectorAll('#history-list .hist-card[onclick^="openHistoryEntry"]').forEach(c=>{
      const i = +((c.getAttribute('onclick').match(/\d+/)||[])[0]); const x = h[i]; if(!x || !mtAtvInvalida(x) || c.querySelector('.hist-susp')) return;
      const meta = c.querySelector('.hist-meta'); if(meta) meta.insertAdjacentHTML('beforeend', '<span class="hist-orig hist-susp" title="Ritmo ou velocidade impossível: não conta para recordes">⚠️ confira</span>');
    });
  }catch(e){}
}});

// ---------- 5. detalhe de uma atividade registrada à mão ----------
const _openHistoryEntryB55 = window.openHistoryEntry;
window.openHistoryEntry = function(idx){
  const r = _openHistoryEntryB55.apply(this, arguments);
  try{
    if(state.active !== 'run') return r;
    const x = (((state.modules.run||{}).history)||[])[idx]; if(!x || x.imp) return r;
    const mi = $('modal-inner'); const h3 = mi && mi.querySelector('h3'); if(!h3 || mi.querySelector('.he-resumo')) return r;
    const tipo = x.activity === 'bike' ? 'Bike' : x.activity === 'caminhada' ? 'Caminhada' : x.activity === 'forca' ? 'Força' : 'Corrida';
    const km = +x.distance || 0, min = +x.duration || 0;
    const ritmo = km && min ? (x.activity === 'bike' ? `${(km/(min/60)).toFixed(1).replace('.',',')} km/h` : fmtPaceMin(min/km)) : '';
    const c = (l, v)=>v ? `<div class="ip-c"><small>${l}</small><b>${v}</b></div>` : '';
    h3.insertAdjacentHTML('afterend', `<div class="he-resumo"><p class="integ-mini">${new Date(x.at).toLocaleString('pt-BR', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })} · <span class="ii-orig">${x.id === 'ma' ? 'Registro manual' : 'Registrado no plano'}</span></p>
      <div class="ip-cards">${c('Modalidade', tipo)}${c('Distância', km ? `${mtFmtKm(km)} km` : '')}${c('Duração', min ? fmtDur(min) : '')}${c(x.activity === 'bike' ? 'Velocidade' : 'Ritmo', ritmo)}${c('Esforço (RPE)', x.rpe ? `${x.rpe}/10` : '')}${x.isRace ? c('Tipo', 'Prova') : ''}</div>
      ${mtAtvInvalida(x) ? '<p class="ip-aviso">⚠️ Esse ritmo é mais rápido que o recorde mundial: confira a distância e o tempo. Enquanto isso, a atividade não conta para recordes.</p>' : ''}
      <div class="section-lbl" style="margin:12px 0 0">Editar</div></div>`);
  }catch(e){}
  return r;
};

// ---------- 2. Desafios: novidades num lugar só ----------
function mtEventoNovo(){
  try{ const e = eventoPrincipal(); if(!e) return null; return mtLS('mt_chal_visto') !== e.key ? e : null; }catch(e){ return null; }
}
const MT_NOV_TIPO = { trofeu:'Nova conquista', secreto:'Segredo revelado', medalha:'Nova medalha', marco:'Marco alcançado', evento:'Desafio concluído' };
let _mtEvNovoAntes = null;
mtGancho('renderChallenges', { antes(){ _mtEvNovoAntes = mtEventoNovo(); }, depois(){
  try{
    const root = $('chal-root'); if(!root) return; const velho = $('mt-novidades'); if(velho) velho.remove();
    const p = cqPendentes(); const itens = p.itens.slice().reverse();
    const linhas = [];
    if(_mtEvNovoAntes) linhas.push(`<div class="nov-l nov-ev"><span class="nov-ico">🆕</span><span class="nov-tx"><b>Novo desafio: ${mtEsc(_mtEvNovoAntes.nome || 'desafio temático')}</b><small>Está logo abaixo, no topo desta aba.</small></span></div>`);
    p.meses.forEach(d=>linhas.push(`<button type="button" class="nov-l" onclick="openTrophies()"><span class="nov-ico">🏁</span><span class="nov-tx"><b>Desafio do mês encerrado</b><small>${mtEsc((d.tema||{}).nome || '')} · veja o resultado em Conquistas</small></span><span class="ii-seta">›</span></button>`));
    itens.slice(0, 4).forEach(it=>{
      const t = it.tid ? TROPHIES.find(x=>x.id === it.tid) : null;
      linhas.push(`<button type="button" class="nov-l" onclick="mtNovAbre('${mtJsStr(it.k)}')"><span class="nov-ico">${it.kind === 'medalha' ? '🥇' : it.kind === 'evento' ? '✅' : '🏆'}</span><span class="nov-tx"><b>${mtEsc(MT_NOV_TIPO[it.kind] || 'Novidade')}: ${mtEsc(t ? t.name : it.nome)}</b><small>${mtEsc(t ? t.desc : (it.desc || ''))}</small></span><span class="ii-seta">›</span></button>`);
    });
    if(itens.length > 4) linhas.push(`<button type="button" class="nov-l nov-mais" onclick="openTrophies()">Ver as outras ${itens.length - 4} em Conquistas ›</button>`);
    if(!linhas.length) return;
    root.insertAdjacentHTML('afterbegin', `<section class="nov-box" id="mt-novidades" aria-label="Novidades"><div class="nov-t">Novidades <span>${linhas.length > 5 ? itens.length + p.meses.length + (_mtEvNovoAntes?1:0) : ''}</span></div>${linhas.join('')}</section>`);
  }catch(e){ console.log('novidades:', e); }
}});
function mtNovAbre(k){
  const it = ((state.conqPend)||[]).find(x=>x.k === k);
  if(it && it.tid && TROPHIES.some(t=>t.id === it.tid)){ cqMarcaVista(x=>x.k === k); try{ renderChallenges(); }catch(e){} openTrophyDetail(it.tid); return; }
  openTrophies();
}
// o indicador da aba: um número pequeno, que soma tudo o que ainda não foi visto (sem dois pontos diferentes)
const _cqIndicadoresB55 = window.cqIndicadores;
window.cqIndicadores = function(){
  const r = _cqIndicadoresB55 ? _cqIndicadoresB55.apply(this, arguments) : undefined;
  try{
    const n = cqTemNovidade() + (mtEventoNovo() ? 1 : 0);
    const old = $('tab-dot-chal'); if(old) old.classList.remove('on');
    document.querySelectorAll('.tab[data-tab="challenges"]').forEach(t=>{
      let d = t.querySelector('.cq-dot');
      if(n && !d){ d = document.createElement('span'); d.className = 'cq-dot'; d.setAttribute('aria-hidden','true'); t.appendChild(d); }
      if(!n){ if(d) d.remove(); }
      else { const tx = n > 9 ? '9+' : String(n); if(d.textContent !== tx) d.textContent = tx; d.classList.add('cq-num'); }
      t.setAttribute('aria-label', n ? `Desafios — ${n} ${n===1?'novidade':'novidades'}` : 'Desafios');
    });
  }catch(e){}
  return r;
};
mtGancho('renderMonthlyCard', { depois(){ try{ cqIndicadores(); }catch(e){} } });
mtGancho('renderChallenges', { depois(){ try{ cqIndicadores(); }catch(e){} } });

// ---------- 3. Progresso: a modalidade vem do Início/Perfil ----------
mtGancho('renderPerf', { depois(){ mtPerfModInfo(); } });
mtGancho('goTab', { depois(t){ if(t === 'perf') mtPerfModInfo(); } });
function mtPerfModInfo(){
  try{
    const scr = $('scr-perf'); if(!scr) return; const sub = scr.querySelector('.wrap h1 + .text-dim, .wrap h1 ~ .text-dim'); if(!sub) return;
    const ambas = !!(state.modules.lift && state.modules.run);
    const mod = state.active === 'run' ? 'Corrida e cardio' : 'Musculação';
    const tx = ambas ? `Últimos 7 dias · ${mod}` : 'Últimos 7 dias';
    if(sub.textContent !== tx) sub.textContent = tx;
    sub.title = ambas ? 'Para ver a outra modalidade, troque o módulo no Início ou no Perfil.' : '';
  }catch(e){}
}
// calendário: só a modalidade ativa (com as duas modalidades)
const _renderCalendarB55 = window.renderCalendar;
window.renderCalendar = function(){
  const L = state && state.modules && state.modules.lift, R = state && state.modules && state.modules.run;
  if(!L || !R) return _renderCalendarB55.apply(this, arguments);
  const outro = state.active === 'run' ? L : R; const h = outro.history;
  outro.history = [];
  try{ return _renderCalendarB55.apply(this, arguments); } finally { outro.history = h; }
};

// ---------- 4. Treinos: o atalho certo para cada modalidade ----------
const MT_ICO_RELOGIO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="3"/><path d="M9 6.5l.8-3h4.4l.8 3M9 17.5l.8 3h4.4l.8-3M12 9.5V12l1.6 1.2"/></svg>';
function mtTreinosAtalho(){
  try{
    const box = $('sess-qlinks'); if(!box) return;
    const b = [...box.querySelectorAll('.qlink')].find(x=>/openActivityLog|openIntegracoes/.test(x.getAttribute('onclick')||'')); if(!b) return;
    const lift = state.active !== 'run';
    const html = lift ? `<span class="ql-ico">${MT_ICO_RELOGIO}</span>Importar do relógio` : null;
    if(lift){ if(b.dataset.b55 !== 'lift'){ b.innerHTML = html; b.setAttribute('onclick', 'openIntegracoes()'); b.setAttribute('aria-label', 'Importar atividade do relógio (GPX, TCX ou FIT)'); b.dataset.b55 = 'lift'; } }
    else if(b.dataset.b55 === 'lift'){ b.innerHTML = '<span>➕</span>Registrar atividade'; b.setAttribute('onclick', 'openActivityLog()'); b.removeAttribute('aria-label'); b.dataset.b55 = 'run'; }
  }catch(e){}
}
mtGancho('goTab', { depois(t){ if(t === 'sessions') mtTreinosAtalho(); } });
mtGancho('renderSessions', { depois(){ mtTreinosAtalho(); } });

// ---------- 6. anatomia: histórico do músculo (informativo, sem "% recuperado") ----------
const MM_PERNAS_CORRIDA = { quadriceps:1, posteriores:1, gluteos:1, panturrilha:1, tibial:1 };
function mmHistoricoMusculo(k){
  const out = { ultimo:null, proximo:null, corrida:null };
  try{
    Object.entries(state.progress || {}).forEach(([id, arr])=>{
      const ex = _mmExDoBanco(id); if(!ex) return; const m = mmMusculosDe(ex);
      if(!m.prim.includes(k) && !m.sec.includes(k)) return;
      (arr||[]).forEach(p=>{ if((p.sets||[]).length && (!out.ultimo || p.date > out.ultimo)) out.ultimo = p.date; });
    });
    const mod = state.modules.lift;
    if(mod && mod.plan){
      const hoje = (new Date().getDay() || 7); const feitoHoje = (mod.history||[]).some(h=>mtDia0(h.at) === mtDia0());
      for(let d = feitoHoje ? 1 : 0; d <= 7; d++){
        const di = ((hoje - 1 + d) % 7) + 1;
        const w = (mod.plan.workouts||[]).find(x=>x.dayIdx === di); if(!w) continue;
        const M = _mmMusculosDoTreino(w); if(M.prim[k] || M.sec[k]){ out.proximo = { d, w }; break; }
      }
    }
    if(MM_PERNAS_CORRIDA[k]){
      const R = (((state.modules.run||{}).history)||[]).filter(x=>(!x.activity || x.activity === 'corrida') && x.at >= Date.now() - 3*DIA_MS && !mtAtvInvalida(x));
      if(R.length) out.corrida = R.reduce((a,x)=>x.at > a.at ? x : a);
    }
  }catch(e){}
  return out;
}
function _mmQuando(ts){ const d = Math.round((mtDia0() - mtDia0(ts))/DIA_MS); return d === 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`; }
const _mmFichaB55 = window.mmFicha;
window.mmFicha = function(){
  const r = _mmFichaB55.apply(this, arguments);
  try{
    const box = $('mm-ficha'); const k = _mm.sel; if(!box || box.hidden || !k) return r;
    const H = mmHistoricoMusculo(k); const DN = ['','segunda','terça','quarta','quinta','sexta','sábado','domingo'];
    const linhas = [];
    linhas.push(H.ultimo ? `Último estímulo registrado: <b>${_mmQuando(H.ultimo)}</b>.` : 'Nenhuma série registrada para este músculo ainda.');
    if(H.corrida){ const q = _mmQuando(H.corrida.at); linhas.push(`${/^h[áa] /.test(q) ? 'A corrida feita ' + q : 'A corrida de ' + q} (${mtFmtKm(H.corrida.distance||0)} km) também exigiu este músculo.`); }
    if(H.proximo) linhas.push(`Próximo estímulo previsto: <b>${H.proximo.d === 0 ? 'hoje' : H.proximo.d === 1 ? 'amanhã' : DN[(((new Date().getDay()||7) - 1 + H.proximo.d) % 7) + 1]}</b> (${mtEsc(H.proximo.w.name || '')}).`);
    const html = `<div class="mm-f-sec mm-hist"><h5>Seu histórico com este músculo</h5><p>${linhas.join('<br>')}</p><p class="mm-mute">A recuperação depende do volume, da intensidade, do sono e da sua experiência — não só das horas. Use isto como referência, não como regra.</p></div>`;
    const ult = box.querySelector('p.mm-mute:last-child'); if(ult) ult.insertAdjacentHTML('beforebegin', html); else box.insertAdjacentHTML('beforeend', html);
  }catch(e){}
  return r;
};

// ---------- estilos ----------
(function(){
  const st = document.createElement('style'); st.id = 'b55-css';
  st.textContent = `
.cq-dot.cq-num{min-width:16px;height:16px;padding:0 4px;border-radius:99px;font-size:10px;font-weight:800;line-height:16px;text-align:center;color:#fff;box-sizing:border-box;top:2px!important}
#tab-dot-chal{display:none!important}
.nov-box{margin:4px 0 16px;padding:12px 14px;border-radius:18px;background:var(--surface,var(--card));border:1px solid rgba(var(--primary-rgb),.35)}
.nov-t{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--primary-2);margin-bottom:6px}
.nov-l{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:none;border:0;border-top:1px solid var(--border);padding:10px 0;color:var(--text);font:inherit;cursor:pointer}
.nov-l:first-of-type{border-top:0}
.nov-ico{font-size:20px;flex:0 0 auto}.nov-tx{flex:1;min-width:0}.nov-tx b{display:block;font-size:13.5px;overflow-wrap:anywhere}.nov-tx small{display:block;font-size:12px;color:var(--text-dim);margin-top:2px}
.nov-mais{justify-content:center;font-weight:700;color:var(--primary-2);font-size:13px}
.cq-novos-dica{font-size:12px;color:var(--text-dim);margin:0 0 8px}
.cq-novo{cursor:pointer;transition:opacity .2s, transform .2s}.cq-novo.cq-saindo{opacity:0;transform:scale(.96)}
.cq-todas-vistas{display:block;margin:8px auto 0;background:none;border:0;color:var(--text-dim);font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer}
.he-resumo .ip-cards{margin-top:8px}
.hist-susp{background:rgba(245,158,11,.14)!important;color:#f5b041!important}
.integ-manual{display:block;width:100%;margin-top:12px;padding:12px;border-radius:14px;border:1px dashed var(--border);background:none;color:var(--text-dim);font:inherit;font-size:13px;text-align:center;cursor:pointer}
.integ-manual b{color:var(--text)}
.integ-log-btn{display:flex!important;align-items:center;gap:8px;width:100%;text-align:left;background:none;border:0;color:inherit;font:inherit;cursor:pointer}
.integ-log-btn > b, .integ-log-btn > small{flex:1 1 100%}
.ip-orig{display:grid;gap:4px;margin-top:6px}.ip-orig div{display:flex;justify-content:space-between;gap:10px;font-size:12.5px}.ip-orig span{color:var(--text-dim)}.ip-orig b{text-align:right;overflow-wrap:anywhere}
.ql-ico svg{width:16px;height:16px;vertical-align:-3px}
.mm-hist p{margin:4px 0}
/* responsividade: nada importante escondido para o lado em telas pequenas */
#perf-evo .chip-row, #perf-evo .chips, #perf-evo .seg-row, .evo-chips, .cd-chips, .mm-modos{flex-wrap:wrap!important;overflow-x:visible!important}
.evo-chips .nxchip, .cd-chips > *, .mm-modos > *{flex:0 1 auto!important}
.cal-grid{grid-template-columns:repeat(7,minmax(0,1fr))!important}
.mod-toggle{min-width:0}.mod-toggle .seg{min-width:0;overflow-wrap:anywhere;white-space:normal}
.cq-conts{min-width:0;grid-template-columns:repeat(3,minmax(0,1fr))!important}.cq-cont{min-width:0;padding-left:3px!important;padding-right:3px!important}.cq-cont span{font-size:clamp(9.5px,2.7vw,11px)!important;white-space:nowrap}
@media (max-width:340px){.cq-resumo{flex-wrap:wrap;justify-content:center}.cq-conts{flex:1 1 100%}}
/* dias da semana em Treinos: estilo na parte 60 (Beta 56) */
.cq-filtros{flex-wrap:wrap!important;overflow-x:visible!important}
.cq-filtros .filter-chip{flex:0 1 auto}
.qlinks{flex-wrap:wrap}
`;
  document.head.appendChild(st);
})();

Object.assign(window, { mtAtvInvalida, mtAtvRitmoImpossivel, mtNovAbre, mtEventoNovo, mtTreinosAtalho, mmHistoricoMusculo, mtPerfModInfo });

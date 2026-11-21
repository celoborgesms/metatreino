// =====================================================================
// 64. Beta 61 — apagar uma atividade tira as conquistas e desafios que ela tinha liberado
// ---------------------------------------------------------------------
// Regra: ao excluir (ou editar) um registro — manual ou importado —, as conquistas e os desafios do mês
// ganhos nas ÚLTIMAS 48 HORAS que deixam de ser comprovados pelo que sobrou saem da coleção (e da fila de
// "novas"). O que foi ganho há mais de 48 h fica: depois de dois dias a conquista já foi vista, comemorada
// e compartilhada, e tirar de repente pareceria erro do app.
// Só são revistas as conquistas que o app sabe recalcular pelos dados (checkTrophies, checkWeightTrophies,
// desafios do mês). As de evento (horário curioso, data especial, "A Volta por Cima"…) não são tocadas.
// Antes: a exclusão de importação só chamava ensureStats() (o contador nunca descia) e a exclusão manual
// dependia da DATA do treino (3 dias), então apagar uma caminhada importada deixava "Primeira caminhada" e
// "Caminhada 3K" na coleção.
// =====================================================================
const CONQ_REVOGA_H = 48;
function _conqRecalculaveis(){
  const ids = new Set();
  [window.checkTrophies, window.checkWeightTrophies].forEach(f=>{
    try{ String(f || '').replace(/unlockTrophy\('([^']+)'\)/g, (_, id)=>{ ids.add(id); return ''; }); }catch(e){}
  });
  return ids;
}
function mtRevisaConquistas(){
  if(!state || typeof recomputeAchievements !== 'function') return [];
  const limite = Date.now() - CONQ_REVOGA_H*3600000;
  const antesT = (state.trophies||[]).slice(), datasT = Object.assign({}, state.trophyDates||{});
  try{ ensureMonthly(); }catch(e){}
  const antesM = ((state.monthly||{}).done||[]).slice(), datasM = Object.assign({}, (state.monthly||{}).doneAt||{});
  const recalc = _conqRecalculaveis();
  try{ recomputeAchievements(); }catch(e){ console.log('revisão de conquistas:', e); }
  const saiT = [], saiM = [];
  // conquistas: o que sumiu no recálculo volta, salvo se for recalculável E recente
  antesT.forEach(id=>{
    if(state.trophies.includes(id)) return;
    const recente = (datasT[id]||0) >= limite;
    if(recente && recalc.has(id)) saiT.push(id);
    else { state.trophies.push(id); if(datasT[id]) state.trophyDates[id] = datasT[id]; }
  });
  // desafios do mês corrente: mesma regra (recomputeAchievements já os recalculou)
  if(state.monthly){
    antesM.forEach(id=>{
      if(state.monthly.done.includes(id)) return;
      const recente = (datasM[id]||0) >= limite;
      if(recente) saiM.push(id);
      else { state.monthly.done.push(id); if(datasM[id]) state.monthly.doneAt[id] = datasM[id]; }
    });
  }
  if(saiT.length || saiM.length){
    // some também da fila de "novas conquistas" e das celebrações ainda não mostradas
    const tira = new Set([...saiT.map(id=>'t_'+id), ...saiT, ...saiM]);
    const bate = k=>{ const b = String(k||'').split('@')[0]; return tira.has(b) || [...tira].some(t=>b.endsWith(':'+t) || b === 'm_'+t); };
    try{ state.conqPend = (state.conqPend||[]).filter(p=>!bate(p.k) && !(p.tid && saiT.includes(p.tid))); }catch(e){}
    try{ if(typeof awardQueue !== 'undefined' && Array.isArray(awardQueue)) awardQueue = awardQueue.filter(a=>!bate(a.id)); }catch(e){}
    const nomes = saiT.map(id=>((TROPHIES||[]).find(t=>t.id===id)||{}).name).filter(Boolean);
    const n = saiT.length + saiM.length;
    setTimeout(()=>{ try{ toast(`${n === 1 ? 'Saiu 1 conquista' : `Saíram ${n} conquistas`} que dependiam deste registro${nomes.length ? `: ${nomes.slice(0,2).join(', ')}${nomes.length > 2 ? '…' : ''}` : ''}`); }catch(e){} }, 900);
  }
  try{ if(typeof cqIndicadores === 'function') cqIndicadores(); }catch(e){}
  return saiT.concat(saiM);
}
window.mtRevisaConquistas = mtRevisaConquistas;

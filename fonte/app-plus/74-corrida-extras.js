
// =====================================================================
// 74. RC 2 — Corrida: atividades fora do plano (extras) e orientação do próximo treino
// ---------------------------------------------------------------------
// Como era (parte 11, rAvaliarSemana): a semana contava QUALQUER dia com corrida como "treino feito".
// Uma corrida extra no sábado "cobria" um treino perdido na quarta, e o esforço dela entrava na média
// (podendo até segurar ou recuar o plano). Corrida extra intensa na véspera de um intervalado não gerava
// nenhuma orientação (só esforço 9+ disparava a fadiga existente).
// O que muda (motor NÃO reconstruído — a avaliação original continua decidindo):
//  • Planejado × extra: planejado = registro ligado a um treino do plano (tipo de sessão ou id "S1".."S7");
//    extra = registro avulso ("livre", importado sem ligação, sem tipo de sessão).
//  • Semana SEM extras: nada muda (mesma função, mesmos dados).
//  • Semana COM extras: a avaliação original roda só com os planejados + "remanejados":
//      remanejado = extra de corrida (ou caminhada/corrida para o nível iniciante) com duração de pelo menos
//      60% do treino mais curto da semana, quando faltou treino planejado — "trocou o dia", conta e é explicado.
//    Os outros extras não contam como treino feito e não entram na média de esforço (não punem), mas a CARGA
//    deles (duração × esforço) é somada: se a decisão era avançar e a carga extra foi grande (≥ 35% da carga
//    planejada) com esforço 7+, o plano MANTÉM e explica. Extras aparecem no motivo da semana.
//  • Próximo treino: extra exigente (esforço 8+, ou 7+ com 45 min ou mais, ou bem mais longo que o habitual)
//    nas últimas 36 h antes de um treino de qualidade ou longão → orientação de recuperação no cartão de status
//    e no resumo do registro. Extra moderado na véspera de treino de qualidade → atenção à recuperação.
//    Caminhada leve não gera aviso. Nada é cortado automaticamente por aqui (a fadiga original — esforço 9+
//    num treino leve/extra — continua como era).
//  • Sem esforço informado (importação antiga) não se inventa valor: a carga usa 5/10 só para o cálculo
//    interno e o texto diz "sem esforço informado".
// =====================================================================
function rxEhExtra(r){
  if(!r) return false;
  if(r.tipoSessao) return false;
  if(r.isRace) return false;
  const id = String(r.id == null ? '' : r.id);
  return !id || id === 'livre' || id === 'imp' || id === 'extra' || id === 'activity';
}
function _rxCarga(r){ return (+r.duration||0) * ((+r.rpe||0) || 5); }
function _rxExigente(r, ref){
  const rpe = +r.rpe || 0, dur = +r.duration || 0;
  if(r.activity === 'bike') return rpe >= 8 && dur >= 45;
  if(r.activity === 'caminhada') return rpe >= 8;
  return rpe >= 8 || (rpe >= 7 && dur >= 45) || (ref && dur >= ref * 1.5 && dur >= 40);
}
// a semana separada em planejados, remanejados e extras
function rxSemana(ctx, motor, semTs){
  const a = semTs, b = semTs + 7*DIA_MS; const nv = motor.nivel;
  const todas = rAtividades(ctx).filter(r=>r.at >= a && r.at < b);
  const extras = todas.filter(rxEhExtra);
  const plan = todas.filter(r=>!rxEhExtra(r) && r.activity !== 'bike' && (nv === 0 || _ehCorrida(r)));
  const info = (motor.semanas||{})[semTs] || null; const planejado = info ? info.planejado : 0;
  const diasPlan = new Set(plan.map(r=>mtDia0(r.at))).size;
  let faltam = Math.max(0, planejado - diasPlan);
  // duração de referência: o treino planejado mais curto da semana (se for a semana atual), senão 20 min
  let ref = 20;
  try{ if(semTs === rSem()){ const ds = ((state.modules.run||{}).plan||{}).workouts||[]; const v = ds.filter(w=>w.motor && w.motor.tipo !== 'prova').map(w=>+w.duration||0).filter(Boolean); if(v.length) ref = Math.min(...v); } }catch(e){}
  const candidatos = extras.filter(r=>r.activity !== 'bike' && (nv === 0 ? true : _ehCorrida(r)) && (+r.duration||0) >= ref*0.6)
    .sort((x,y)=>(+y.duration||0) - (+x.duration||0));
  const diasUsados = new Set(plan.map(r=>mtDia0(r.at)));
  const remanejados = [];
  candidatos.forEach(r=>{ const d = mtDia0(r.at); if(faltam > 0 && !diasUsados.has(d)){ remanejados.push(r); diasUsados.add(d); faltam--; } });
  const soExtras = extras.filter(r=>!remanejados.includes(r));
  const cargaExtra = soExtras.reduce((t,r)=>t + _rxCarga(r), 0);
  const cargaPlan = plan.concat(remanejados).reduce((t,r)=>t + _rxCarga(r), 0);
  return { plan, remanejados, extras: soExtras, cargaExtra, cargaPlan, ref };
}
function _rxDescr(r){
  const km = +r.distance > 0 ? `${String(Math.round(r.distance*10)/10).replace('.',',')} km` : `${Math.round(+r.duration||0)} min`;
  const tipo = r.activity === 'caminhada' ? 'caminhada' : r.activity === 'bike' ? 'pedalada' : 'corrida';
  return `${tipo} de ${km}${r.rpe ? ` com esforço ${r.rpe}/10` : ' (sem esforço informado)'}`;
}
// avaliação semanal: sem extras → igual; com extras → original com planejados + remanejados, e a carga extra explicada
(function(){
  const _av = window.rAvaliarSemana; if(typeof _av !== 'function') return;
  window.rAvaliarSemana = function(ctx, motor, semTs){
    let X = null; try{ X = rxSemana(ctx, motor, semTs); }catch(e){ X = null; }
    if(!X || (!X.extras.length && !X.remanejados.length)) return _av.apply(this, arguments);
    const tira = new Set(X.extras.filter(r=>r.activity !== 'bike' && !(r.activity === 'caminhada' && motor.nivel > 0)));
    const ctx2 = Object.assign({}, ctx, { run: Object.assign({}, ctx.run, { history: ((ctx.run||{}).history||[]).filter(r=>!tira.has(r)) }) });
    const res = _av.call(this, ctx2, motor, semTs);
    try{
      res.extras = { n:X.extras.length, min:Math.round(X.extras.reduce((t,r)=>t+(+r.duration||0),0)), km:Math.round(X.extras.reduce((t,r)=>t+(+r.distance||0),0)*10)/10,
        rpeMax: Math.max(0, ...X.extras.map(r=>+r.rpe||0)) || null };
      res.remanejados = X.remanejados.length;
      if(X.remanejados.length) res.motivo += `; ${X.remanejados.length === 1 ? '1 treino feito em outro dia contou' : X.remanejados.length + ' treinos feitos em outros dias contaram'} no lugar do que faltou`;
      const fortes = X.extras.filter(r=>(+r.rpe||0) >= 7);
      if(res.decisao === 'avancar' && X.cargaPlan > 0 && X.cargaExtra >= 0.35*X.cargaPlan && fortes.length){
        res.decisao = 'manter';
        res.motivo += `; além do plano, ${_rxDescr(fortes[0])}${X.extras.length > 1 ? ` e mais ${X.extras.length-1} atividade(s)` : ''} somaram bastante carga — o plano mantém esta semana para você assimilar, sem cortar nada`;
      } else if(X.extras.length){
        res.motivo += `; + ${X.extras.length === 1 ? '1 atividade extra' : X.extras.length + ' atividades extras'} (${res.extras.min} min) entrou na carga, sem contar como treino do plano`;
      }
    }catch(e){}
    return res;
  };
})();
// orientação para o próximo treino planejado (não altera o plano)
function rxOrientacao(agora){
  try{
    const run = state.modules.run; const M = run && run.plan && run.plan.motor; if(!M) return null;
    agora = agora || Date.now();
    const ctx = runCtx();
    const recentes = rAtividades(ctx).filter(r=>rxEhExtra(r) && r.at <= agora && agora - r.at <= 36*3600000);
    if(!recentes.length) return null;
    const hoje = (d=>d === 0 ? 7 : d)(new Date(agora).getDay());
    const feitosHoje = new Set((run.history||[]).filter(h=>mtDia0(h.at) === mtDia0(agora)).map(h=>h.id));
    const prox = (run.plan.workouts||[]).filter(w=>w && w.motor && w.motor.tipo !== 'prova' && (w.dayIdx === hoje || w.dayIdx === hoje+1) && !feitosHoje.has(w.k)).sort((a,b)=>a.dayIdx-b.dayIdx)[0];
    if(!prox) return null;
    const t = prox.motor.tipo; const qual = !!((typeof RT !== 'undefined' && RT[t]) || {}).q; const longo = t === 'longao';
    const ref = Math.max(20, ...((run.plan.workouts||[]).map(w=>+w.duration||0)).filter(Boolean)) || 30;
    const e = recentes.sort((a,b)=>_rxCarga(b) - _rxCarga(a))[0];
    const quando = mtDia0(e.at) === mtDia0(agora) ? 'hoje' : 'ontem';
    const diaProx = prox.dayIdx === hoje ? 'de hoje' : 'de amanhã';
    if(_rxExigente(e, ref * 0.6) && (qual || longo)){
      return { nivel:'atencao', txt:`Você fez uma atividade mais exigente fora do plano ${quando} (${_rxDescr(e)}). Antes do treino ${diaProx} (${prox.name.toLowerCase()}), avalie como está: se as pernas estiverem pesadas, faça a versão leve ou troque pelo próximo dia leve. O plano não foi cortado — a decisão é sua.` };
    }
    if(e.activity !== 'caminhada' && (+e.rpe||0) >= 6 && qual){
      return { nivel:'info', txt:`Percebemos uma corrida extra ${quando} (${_rxDescr(e)}). Considerando o treino ${diaProx}, vale atenção à recuperação: aquecimento mais longo e, se o corpo pedir, menos intensidade.` };
    }
    return null;
  }catch(e){ return null; }
}
(function(){
  const _st = window.runStatusCard; if(typeof _st !== 'function') return;
  window.runStatusCard = function(){
    let h = _st.apply(this, arguments);
    try{ const o = rxOrientacao(); if(o && h) h = h.replace('<div class="run-st-a">', `<div class="run-st-dec rx-ori rx-${o.nivel}">${o.txt}</div><div class="run-st-a">`); }catch(e){}
    return h;
  };
  const _fb = window.runFeedbackMotor; if(typeof _fb !== 'function') return;
  window.runFeedbackMotor = function(e){
    const out = _fb.apply(this, arguments);
    try{
      if(e && rxEhExtra(e) && e.activity !== 'bike'){
        out.push(`Atividade extra: não conta como treino do plano, mas a carga dela entra na análise da semana${e.rpe ? '' : ' (informe o esforço para a análise ficar melhor)'}.`);
        const o = rxOrientacao(); if(o) out.push((o.nivel === 'atencao' ? '🟡 ' : '') + o.txt);
      }
    }catch(er){}
    return out;
  };
})();
(function(){ if(document.getElementById('rx-css')) return; const s = document.createElement('style'); s.id = 'rx-css';
s.textContent = `.rx-ori.rx-atencao{border-left:3px solid #f2b705}.rx-ori.rx-info{border-left:3px solid var(--primary)}`; document.head.appendChild(s); })();

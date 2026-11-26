
// =====================================================================
// 56. Beta 53 — Calorias do dia pelo gasto real dos treinos (musculação + corrida)
// =====================================================================
// Antes: um fator de atividade pela quantidade de DIAS com treino na semana (1,2 a 1,725) e ±5% entre dia de
// treino e de descanso. Um longão de 20 km valia o mesmo que 3 km leves, e musculação + corrida no mesmo
// dia valia o mesmo que só uma delas.
// Agora, para cada dia:
//   gasto do dia = metabolismo basal × 1,4 (rotina sem exercício) + gasto LÍQUIDO dos treinos desse dia
//   • musculação: (MET − 1) × peso × horas, pela duração prevista ou registrada (MET 5; 6 no emagrecimento
//     e resistência, porque os descansos são curtos);
//   • corrida com distância: ~0,95 kcal por kg por km; sem distância: (MET − 1) × peso × horas pelo tipo
//     (leve/longão 9, regenerativo 7,5, intervalado 9,5, ritmo 10,5, corre-e-caminha 6);
//   • caminhada: ~0,5 kcal por kg por km; bike: pela velocidade (MET 6, 8 ou 10).
//   As duas sessões do mesmo dia SOMAM.
// Previsto × feito: dia que já passou usa o que foi registrado (sem registro = descanso); hoje usa o
// registrado + o que ainda está previsto (menos o que foi pulado); dias futuros usam o plano.
// Depois vem o objetivo, como antes: emagrecer = 80% do gasto do dia; ganhar massa = gasto + 10% (mín. 250);
// manter = gasto. O ajuste pelo peso real (±100 kcal) e o mínimo seguro continuam valendo.
// Proteína e gordura ficam iguais todos os dias; o que muda é o carboidrato (dia de longão = mais carbo).

const MM_NEAT = 1.4;            // nível de atividade de quem trabalha sentado e não treina (FAO: 1,40 a 1,69)
function _enMetLift(){
  const g = (((state.modules.lift||{}).setup)||{}).goal || 'hipertrofia';
  return (g === 'emagrecimento' || g === 'resistencia') ? 6 : 5;
}
function _enTipoRun(nome, tipo){
  const t = mtNorm(String(tipo || '') + ' ' + String(nome || ''));
  if(/longao|longo/.test(t)) return 'longao';
  if(/interval|tiro|fartlek|subida/.test(t)) return 'intervalado';
  if(/ritmo|limiar|tempo run|progressiv/.test(t)) return 'ritmo';
  if(/regener/.test(t)) return 'regenerativo';
  if(/camin|alterna|corre e/.test(t)) return 'alternado';
  return 'leve';
}
const EN_MET_RUN = { leve:9, longao:9, regenerativo:7.5, intervalado:9.5, ritmo:10.5, alternado:6 };
const EN_NOME_RUN = { leve:'corrida leve', longao:'longão', regenerativo:'corrida regenerativa', intervalado:'intervalado', ritmo:'treino de ritmo', alternado:'corre e caminha' };
function _enNum(v){ const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) && n > 0 ? n : 0; }
// gasto líquido (kcal) de uma sessão
function enSessaoKcal(s, kg){
  const h = (s.min || 0) / 60;
  if(s.mod === 'lift') return Math.max(0, (_enMetLift() - 1) * kg * h);
  if(s.ativ === 'caminhada') return s.km ? 0.5 * kg * s.km : 2.8 * kg * h;
  if(s.ativ === 'bike'){ const v = s.km && h ? s.km / h : 16; const met = v < 16 ? 6 : v <= 20 ? 8 : 10; return (met - 1) * kg * (h || 0.75); }
  if(s.km) return 0.95 * kg * s.km;
  return (EN_MET_RUN[s.tipo || 'leve'] - 1) * kg * h;
}
function _enInicioDia(dk){ return new Date(dk + 'T00:00:00').getTime(); }
// sessões previstas no plano para um dia da semana
function _enPlanejadas(diaIdx){
  const out = [];
  const L = state.modules.lift, R = state.modules.run;
  ((L && L.plan && L.plan.workouts) || []).filter(w=>w.dayIdx === diaIdx).forEach(w=>out.push({ mod:'lift', k:w.k, nome:w.name || 'Musculação', min:+w.duration || 50 }));
  ((R && R.plan && R.plan.workouts) || []).filter(w=>w.dayIdx === diaIdx).forEach(w=>{
    const tipo = _enTipoRun(w.name, (w.motor||{}).tipo);
    out.push({ mod:'run', ativ:'corrida', k:w.k, tipo, nome:EN_NOME_RUN[tipo], min:+w.duration || 40, km:_enNum(w.distance) });
  });
  return out;
}
// sessões registradas numa data
function _enFeitas(dk){
  const ini = _enInicioDia(dk), fim = ini + 86400000; const out = [];
  const L = state.modules.lift, R = state.modules.run;
  ((L && L.history) || []).filter(h=>h.at >= ini && h.at < fim).forEach(h=>out.push({ mod:'lift', k:h.id, nome:h.name || 'Musculação', min:+h.duration || +h.plannedDuration || 50, real:true }));
  ((R && R.history) || []).filter(h=>h.at >= ini && h.at < fim).forEach(h=>{
    const ativ = h.activity || 'corrida'; const tipo = _enTipoRun(h.name, h.tipoSessao);
    out.push({ mod:'run', ativ, k:h.id, tipo, nome: ativ === 'corrida' ? EN_NOME_RUN[tipo] : ativ, min:+h.duration || 0, km:_enNum(h.distance), real:true });
  });
  return out;
}
function _enPulada(dk, mod, k, diaIdx){
  const ini = _enInicioDia(dk);
  return (state.skips || []).some(s=>s.at === ini && s.module === mod && skipEDoTreino(s, { k, dayIdx:diaIdx }));
}
// sessões que contam para o dia (previsto × feito)
function enSessoesDoDia(diaIdx, dk){
  const hoje = chaveDia(new Date());
  if(dk < hoje) return _enFeitas(dk);
  const plan = _enPlanejadas(diaIdx);
  if(dk > hoje) return plan;
  const feitas = _enFeitas(dk);
  const faltam = plan.filter(p=>!feitas.some(f=>f.mod === p.mod) && !_enPulada(dk, p.mod, p.k, diaIdx));
  return feitas.concat(faltam);
}
// calorias do dia (meta) e o porquê
function nutriDiaEnergia(diaIdx, dk, calc0){
  try{
    calc0 = calc0 || nutriCalcular(); if(!calc0 || calc0.erro) return null;
    const { peso, sexo } = nutriDados();
    dk = dk || nutriKeyDia(diaIdx);
    const sess = enSessoesDoDia(diaIdx, dk).map(s=>Object.assign(s, { kcal: Math.round(enSessaoKcal(s, peso)) }));
    const ex = Math.min(2500, sess.reduce((t,s)=>t + s.kcal, 0));
    const gasto = calc0.bmr * MM_NEAT + ex;
    const obj = calc0.objetivo;
    let kcal = obj === 'emagrecer' ? gasto * 0.80 : obj === 'massa' ? gasto + Math.max(250, gasto * 0.10) : gasto;
    kcal += (calc0.ajusteKcal || 0);
    const piso = Math.max(sexo === 'f' ? 1200 : 1500, obj === 'emagrecer' ? calc0.bmr : 0);
    kcal = Math.round(Math.max(piso, kcal) / 10) * 10;
    const run = sess.filter(s=>s.mod === 'run' && s.ativ === 'corrida');
    const tipo = sess.length >= 2 ? 'duplo'
      : run.some(s=>s.tipo === 'longao' || (s.km || 0) >= 15 || (s.min || 0) >= 80) ? 'longao'
      : run.some(s=>s.tipo === 'intervalado' || s.tipo === 'ritmo') ? 'intenso'
      : sess.length ? 'treino' : 'descanso';
    return { kcal, gasto: Math.round(gasto), base: Math.round(calc0.bmr * MM_NEAT), ex: Math.round(ex), sessoes: sess, tipo, treino: sess.length > 0, dk };
  }catch(e){ console.log('energia do dia:', e); return null; }
}
// a meta "da semana" (média) vem do mesmo modelo, pelos treinos previstos
const _nutriCalcularB53 = window.nutriCalcular;
window.nutriCalcular = function(){
  const c = _nutriCalcularB53.apply(this, arguments); if(!c || c.erro) return c;
  try{
    const { peso, sexo } = nutriDados();
    let soma = 0; for(let d=1; d<=7; d++) soma += Math.min(2500, _enPlanejadas(d).reduce((t,s)=>t + enSessaoKcal(s, peso), 0));
    const tdee = c.bmr * MM_NEAT + soma / 7;
    const aj = nutriAjustePeso(c.objetivo).kcal || 0;
    let kcal = c.objetivo === 'emagrecer' ? tdee * 0.80 : c.objetivo === 'massa' ? tdee + Math.max(250, tdee * 0.10) : tdee;
    kcal += aj;
    const piso = Math.max(sexo === 'f' ? 1200 : 1500, c.objetivo === 'emagrecer' ? c.bmr : 0);
    kcal = Math.round(Math.max(piso, kcal) / 10) * 10;
    const gord = Math.round(Math.max(peso * 0.9, kcal * 0.22 / 9) / 5) * 5;
    const carb = Math.max(100, Math.round((kcal - c.prot * 4 - gord * 9) / 4 / 5) * 5);
    return Object.assign(c, { kcal, gord, carb, tdee: Math.round(tdee), ajusteKcal: aj, modelo:'b53' });
  }catch(e){ return c; }
};

// dica do dia conforme o tipo de treino
const _nutriMontarPlanoB53 = window.nutriMontarPlano;
window.nutriMontarPlano = function(){
  const pl = _nutriMontarPlanoB53.apply(this, arguments);
  try{
    const E = pl && pl.calc && pl.calc.energia; if(!E) return pl;
    const longao = E.sessoes.find(s=>s.tipo === 'longao' || (s.km || 0) >= 15);
    const dica = E.tipo === 'duplo' ? 'Hoje tem dois treinos: as calorias já somam os dois. Se puder, separe as sessões por algumas horas e faça um lanche com carboidrato e proteína entre elas.'
      : E.tipo === 'longao' ? `Hoje é ${longao && longao.km ? `longão de ${String(longao.km).replace('.', ',')} km` : 'longão'}: mais carboidrato no café e no pré-treino; se passar de 75 min, leve água e algo com carboidrato. Depois, almoço com proteína.`
      : E.tipo === 'intenso' ? 'Treino intenso de corrida hoje: carboidrato no pré-treino (1 a 2 h antes) ajuda a manter o ritmo dos tiros.'
      : null;
    if(dica) pl.dicas.unshift(dica);
    pl.energia = E;
  }catch(e){}
  return pl;
};

// tela do plano: de onde vêm as calorias do dia
function enResumoHTML(E){
  if(!E) return '';
  const fmt = v=>String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const linhas = E.sessoes.map(s=>`<li>${s.mod === 'lift' ? 'Musculação' : (s.ativ && s.ativ !== 'corrida' ? s.ativ[0].toUpperCase() + s.ativ.slice(1) : s.nome[0].toUpperCase() + s.nome.slice(1))}${s.km ? ` ${String(Math.round(s.km*10)/10).replace('.', ',')} km` : ''}${s.min ? ` · ${Math.round(s.min)} min` : ''}: <b>+${fmt(s.kcal)} kcal</b>${s.real ? ' <span class="en-feito">feito</span>' : ''}</li>`).join('');
  return `<div class="en-dia en-${E.tipo}" id="en-dia"><div class="en-t">${E.tipo === 'descanso' ? 'Dia de descanso' : E.tipo === 'duplo' ? (E.sessoes.some(s=>s.mod === 'lift') && E.sessoes.some(s=>s.ativ === 'corrida') ? 'Dia com musculação e corrida' : 'Dia com dois treinos') : E.tipo === 'longao' ? 'Dia de longão' : E.tipo === 'intenso' ? 'Dia de corrida intensa' : 'Dia de treino'}</div>
    <ul><li>Rotina do dia (sem exercício): ${fmt(E.base)} kcal</li>${linhas}</ul>
    <div class="en-tot">Gasto estimado do dia: <b>${fmt(E.gasto)} kcal</b> → meta <b>${fmt(E.kcal)} kcal</b></div></div>`;
}
mtGancho('openNutri', { depois(){
  try{
    const mi = $('modal-inner'); if(!mi || mi.querySelector('#en-dia')) return;
    const pl = nutriMontarPlano(nutriDiaSel()); if(!pl || pl.erro || !pl.energia) return;
    const alvo = mi.querySelector('#fam-ajuste-dia') || mi.querySelector('details.mealc'); if(!alvo) return;
    alvo.insertAdjacentHTML('beforebegin', enResumoHTML(pl.energia));
  }catch(e){ console.log('energia (tela):', e); }
}});

(function(){ if(document.getElementById('en-css')) return; const s = document.createElement('style'); s.id = 'en-css';
  s.textContent = `
.en-dia{margin:8px 0;padding:10px 12px;border-radius:12px;background:rgba(127,127,127,.08);font-size:12.5px;line-height:1.5;color:var(--text-dim);border-left:3px solid var(--text-mute)}
.en-dia.en-treino{border-color:var(--primary)}.en-dia.en-duplo,.en-dia.en-longao,.en-dia.en-intenso{border-color:#e9c46a}
.en-t{font-weight:800;color:var(--text);font-size:13px;margin-bottom:2px}
.en-dia ul{margin:2px 0 4px;padding-left:16px}.en-dia li{margin:1px 0}.en-dia b{color:var(--text)}
.en-feito{font-size:10.5px;font-weight:700;padding:1px 6px;border-radius:999px;background:rgba(127,127,127,.2)}
.en-tot{border-top:1px solid var(--border);padding-top:5px}
`; document.head.appendChild(s); })();

Object.assign(window, { nutriDiaEnergia, enSessoesDoDia, enSessaoKcal, enResumoHTML });

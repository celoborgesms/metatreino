// "Semana com menos tempo" na corrida: aplica de verdade, prioriza o longão e a qualidade, não aumenta
// a carga dos outros dias, não junta treinos fortes em dias seguidos e volta ao normal na semana seguinte.
'use strict';
const { carregar } = require('./ambiente');
let ok = 0, falhou = 0; const t = (n, c, d)=>{ if(c) ok++; else { falhou++; console.log('❌ ' + n + (d!==undefined?' → '+JSON.stringify(d):'')); } };
function cenario(goal, perfil, diasNormais, livres, diaHoje){
  const app = carregar(); const D = app.Date; const RT = app.__get('RT');
  const s = app.estado(); s.user = { name:'T', email:'t@t', profile:{ age:32, quiz_done:true } };
  const base = new D(2027,0,4,6,0).getTime(); let agora = base; D.now = ()=>agora;
  const setup = { goal, days:diasNormais.length, selectedDays:diasNormais, terrain:'asfalto', aval:perfil };
  s.modules.run = { setup, plan: app.generatePlan('run', setup), week:1, createdAt:base, startAt:base, history:[] }; s.active='run';
  const loga = semIni=>s.modules.run.plan.workouts.forEach(x=>{ agora = semIni+(x.dayIdx-1)*86400000+12*3600000; s.modules.run.history.push({at:agora,duration:x.duration,distance:+(x.duration/6).toFixed(1),rpe:5,module:'run',activity:'corrida',tipoSessao:x.motor.tipo,concluiu:'sim'}); });
  for(let w=0; w<6; w++){ const semIni = base + w*7*86400000; agora = semIni+3600000; app.runSync(true); loga(semIni); }
  const semIni = base + 6*7*86400000; agora = semIni + (diaHoje-1)*86400000 + 7*3600000; app.runSync(true);
  const antes = s.modules.run.plan.workouts.map(w=>({ d:w.dayIdx, t:w.motor.tipo, min:w.duration }));
  const M = s.modules.run.plan.motor;
  const passados = antes.map(w=>w.d).filter(d=>d < diaHoje);
  M.especial = { sem: app.rSem(), dias: [...new Set(passados.concat(livres))] };
  app.runSync(false, true);
  const depois = s.modules.run.plan.workouts.map(w=>({ d:w.dayIdx, t:w.motor.tipo, min:w.duration, nota:w.motor.nota }));
  loga(semIni);
  agora = semIni + 7*86400000 + 3600000; app.runSync();
  const proxima = s.modules.run.plan.workouts.map(w=>w.dayIdx);
  return { antes, depois, proxima, RT };
}
const regular = { exp:'regular', continuo:'60', kmSemana:25, tempo:60, tempoLongo:90, lim:[] };
const casos = [
  ['4 dias → 3 (seg, qua, sáb)', '10km', [1,3,5,7], [1,3,6], 1],
  ['4 dias → 3 dias seguidos (sex, sáb, dom)', '10km', [1,3,5,7], [5,6,7], 1],
  ['4 dias → 2 dias seguidos (sáb, dom)', '21km', [1,3,5,7], [6,7], 1],
  ['5 dias → 3', '21km', [1,2,4,5,7], [2,4,7], 1],
  ['meio da semana: já é quinta, só sábado', '10km', [1,3,5,7], [6], 4],
];
for(const [nome, goal, normais, livres, hoje] of casos){
  const r = cenario(goal, regular, normais, livres, hoje);
  const fut = r.depois.filter(w=>w.d >= hoje);
  console.log(`\n${nome}\n  antes : ${r.antes.map(w=>`${w.d}:${w.t} ${w.min}′`).join(' | ')}\n  depois: ${r.depois.map(w=>`${w.d}:${w.t} ${w.min}′`).join(' | ')}`);
  t(`${nome}: aplicou nos dias escolhidos`, fut.every(w=>livres.includes(w.d)) && livres.every(d=>fut.some(w=>w.d===d)), fut.map(w=>w.d));
  t(`${nome}: dias que já passaram não mudam`, r.antes.filter(w=>w.d < hoje).every(a=>r.depois.some(d=>d.d===a.d && d.t===a.t)));
  if(fut.length >= 2) t(`${nome}: longão preservado`, fut.some(w=>w.t==='longao'));
  const forte = w=>w.t==='longao' || (r.RT[w.t]||{}).q;
  const fortes = fut.filter(forte).map(w=>w.d).sort((a,b)=>a-b);
  t(`${nome}: sem dois treinos fortes em dias seguidos`, fortes.every((d,i)=>!i || d - fortes[i-1] > 1), fortes);
  const maxAntes = Math.max(...r.antes.map(w=>w.min));
  t(`${nome}: nenhum treino fica mais longo que o mesmo tipo na semana normal`, fut.every(w=>{ const n = r.antes.filter(a=>a.t===w.t || (w.t==='leve' && ['leve','regenerativo'].includes(a.t))).map(a=>a.min); return !n.length || w.min <= Math.max(...n) + 2; }), fut.map(w=>w.t+' '+w.min));
  t(`${nome}: tempo total não aumenta`, fut.reduce((a,w)=>a+w.min,0) <= r.antes.filter(w=>w.d>=hoje).reduce((a,w)=>a+w.min,0) + 2);
  t(`${nome}: semana seguinte volta ao normal`, JSON.stringify(r.proxima) === JSON.stringify(normais), r.proxima);
}
console.log(`\n${ok} testes aprovados, ${falhou} reprovados.`); process.exitCode = falhou ? 1 : 0;

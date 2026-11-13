// Simula 20 semanas de um aluno seguindo o plano de corrida e confere a progressão.
// Uso: node testes/simulacao-corrida.js [--detalhe]
'use strict';
const { carregar } = require('./ambiente');
const det = process.argv.includes('--detalhe');
const PERFIS = {
  nunca:        { exp:'nunca', continuo:'0', tempo:45, tempoLongo:60 },
  pouco:        { exp:'pouco', continuo:'10', tempo:45, tempoLongo:60 },
  regular:      { exp:'regular', continuo:'60', kmSemana:20, tempo:60, tempoLongo:90 },
  experiente:   { exp:'experiente', continuo:'90', kmSemana:45, tempo:75, tempoLongo:150, marca:{ km:10, seg:46*60 } }
};
const GOALS = ['comecar','5km','10km','21km','42km'];
const DIAS = { 3:[2,4,6], 4:[1,3,5,7], 5:[1,2,4,5,7] };
const problemas = {}; const add = (k, v)=>{ (problemas[k] = problemas[k] || []).push(v); };
let casos = 0;
for(const perfil of Object.keys(PERFIS)) for(const goal of GOALS) for(const nd of [3,4,5]){
  const app = carregar(); const D = app.Date; app.RT = app.__get('RT');
  const s = app.estado();
  s.user = { name:'T', email:'t@t', profile:{ age:32, sex:'m', height:175, currentWeight:72, quiz_done:true } };
  // começa numa segunda-feira, 6h
  const base = new D(2027, 0, 4, 6, 0).getTime(); let agora = base; D.now = ()=>agora;
  const comProva = ['10km','21km','42km','5km'].includes(goal);
  const prova = new D(base + 18*7*86400000 + 6*86400000);   // domingo da 19ª semana
  const setup = { goal, days:nd, selectedDays:DIAS[nd], terrain:'asfalto', aval:Object.assign({ em:base, lim:[] }, PERFIS[perfil]),
    raceDate: comProva ? `${prova.getFullYear()}-${String(prova.getMonth()+1).padStart(2,'0')}-${String(prova.getDate()).padStart(2,'0')}` : null };
  const plan = app.generatePlan('run', setup);
  s.modules.run = { setup, plan, week:1, createdAt:base, startAt:base, history:[] };
  s.active = 'run';
  casos++;
  const tag = `${perfil}/${goal}/${nd}d`;
  let antVol = null, antFase = null; const linhas = [];
  for(let w=0; w<20; w++){
    const semIni = base + w*7*86400000;
    agora = semIni + 3600000; app.runSync(true);
    const P = s.modules.run.plan, M = P.motor, info = M.semanas[app.rSem(agora)] || {};
    const ws = P.workouts;
    // checagens da semana
    ws.forEach(x=>{ if(!isFinite(x.duration) || x.duration<=0) add('duracao-invalida', `${tag} sem${w+1} ${x.name} ${x.duration}`);
      if(x.distance && /NaN|undefined/.test(x.distance)) add('distancia-invalida', `${tag} sem${w+1} ${x.distance}`);
      if(/NaN|undefined/.test(JSON.stringify(x.blocks))) add('bloco-com-NaN', `${tag} sem${w+1} ${x.name}`); });
    const q = ws.filter(x=>x.motor && app.RT && app.RT[x.motor.tipo] && app.RT[x.motor.tipo].q).map(x=>x.dayIdx).sort((a,b)=>a-b);
    for(let i=1;i<q.length;i++) if(q[i]-q[i-1]===1) add('qualidade-em-dias-seguidos', `${tag} sem${w+1}: dias ${q.join(',')}`);
    const longo = ws.find(x=>x.motor && x.motor.tipo==='longao'); const qd = new Set(q);
    if(longo && (qd.has(longo.dayIdx-1) || qd.has(longo.dayIdx+1))) add('qualidade-colada-no-longao', `${tag} sem${w+1}`);
    const vol = ws.filter(x=>!x.motor || x.motor.tipo!=='prova').reduce((a,x)=>a+(+x.duration||0),0);   // tempo total da semana (com aquecimento)
    if(antVol && vol > antVol*1.2 + 5 && !['retomada'].includes(antFase) && info.fase !== 'taper') add('salto-de-volume(>20%)', `${tag} sem${w+1}: ${antVol} → ${vol} min (${antFase} → ${info.fase})`);
    linhas.push(`sem${String(w+1).padStart(2)} nv${M.nivel} ${String(info.fase).padEnd(15)} vol ${String(vol).padStart(3)} min · ${ws.map(x=>`${x.dayName.slice(0,3)} ${x.motor?x.motor.tipo:x.name} ${x.duration}′`).join(' | ')}`);
    if(info.fase !== 'recuperacao' && info.fase !== 'taper') { antVol = vol; antFase = info.fase; }
    // o aluno faz tudo, com esforço confortável
    ws.forEach(x=>{
      const t = x.motor ? x.motor.tipo : 'leve';
      agora = semIni + (x.dayIdx-1)*86400000 + 12*3600000;
      const min = x.duration, pace = M.nivel>=3 ? 5.3 : M.nivel>=2 ? 6.3 : 7.2;
      s.modules.run.history.push({ id:x.k, name:x.name, at:agora, duration:min, distance: t==='caminhada' ? +(min/11).toFixed(2) : +(min/pace).toFixed(2), rpe: app.RT[t] && app.RT[t].q ? 7 : 5, module:'run',
        activity: t==='caminhada' ? 'caminhada' : 'corrida', tipoSessao:t, concluiu:'sim', continuo: t!=='camcorre' && t!=='caminhada', estagio:x.motor && x.motor.estagio, isRace: t==='prova' || undefined });
    });
  }
  if(comProva){ const ult = linhas.slice(16).join('\n'); if(!/taper/.test(ult)) add('sem-polimento-antes-da-prova', tag); }
  if(det && (process.env.CASO ? tag===process.env.CASO : ((perfil==='regular' || perfil==='nunca') && nd===4 && (goal==='10km' || goal==='comecar')))){ console.log('\n== ' + tag); linhas.forEach(l=>console.log('  ' + l)); }
}
console.log(`\nCenários simulados: ${casos} (4 perfis × 5 objetivos × 3 opções de dias, 20 semanas cada)`);
const ks = Object.keys(problemas);
if(!ks.length) console.log('✅ Nenhum problema encontrado.');
ks.forEach(k=>{ console.log(`❌ ${k}: ${problemas[k].length}`); problemas[k].slice(0, det?20:4).forEach(x=>console.log('     ' + x)); });
process.exitCode = ks.length ? 1 : 0;

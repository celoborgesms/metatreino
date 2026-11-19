// Beta 49 — o tempo escolhido no cadastro (20, 30, 45, 60 min) é LIMITE real para todo treino da semana
// (o longão respeita o "treino mais longo"), em todos os níveis, objetivos, fases e dias; e cada limitação
// tira os estímulos incompatíveis com ela.
// Uso: node testes/corrida-tempo-limite.js
'use strict';
const { carregar } = require('./ambiente');
let ok = 0, falhou = 0; const exemplos = {};
function t(nome, cond, det){ if(cond) ok++; else { falhou++; (exemplos[nome] = exemplos[nome] || []).push(det); } }
const PERFIS = {
  nunca:      { exp:'nunca', continuo:'0' },
  pouco:      { exp:'pouco', continuo:'10' },
  regular:    { exp:'regular', continuo:'60', kmSemana:20 },
  experiente: { exp:'experiente', continuo:'90', kmSemana:50, marca:{ km:10, seg:42*60 } }
};
const GOALS = ['comecar','5km','10km','21km','42km'];
const DIAS = { 3:[2,4,6], 4:[1,3,5,7], 5:[1,2,4,5,7] };
const TEMPOS = [20, 30, 45, 60];
let casos = 0, sessoes = 0, trocas = 0;
for(const perfil of Object.keys(PERFIS)) for(const goal of GOALS) for(const nd of [3,4,5]) for(const tempo of TEMPOS) for(const lim of [[], ['joelho'], ['tornozelo','canela']]){
  const app = carregar(); const D = app.Date;
  const s = app.estado();
  s.user = { name:'T', email:'t@t', profile:{ age:32, sex:'m', height:175, currentWeight:72, quiz_done:true } };
  const base = new D(2027, 0, 4, 6, 0).getTime(); let agora = base; D.now = ()=>agora;
  const comProva = goal !== 'comecar';
  const prova = new D(base + 14*7*86400000 + 6*86400000);
  const tempoLongo = tempo <= 30 ? 45 : Math.round(tempo*1.5);
  const setup = { goal, days:nd, selectedDays:DIAS[nd], terrain:'asfalto', aval:Object.assign({ em:base, lim, tempo, tempoLongo }, PERFIS[perfil]),
    raceDate: comProva ? `${prova.getFullYear()}-${String(prova.getMonth()+1).padStart(2,'0')}-${String(prova.getDate()).padStart(2,'0')}` : null };
  const plan = app.generatePlan('run', setup);
  s.modules.run = { setup, plan, week:1, createdAt:base, startAt:base, history:[] };
  s.active = 'run'; casos++;
  const tag = `${perfil}/${goal}/${nd}d/${tempo}min/${lim.join('+')||'sem lim'}`;
  const RT = app.__get('RT');
  for(let w=0; w<16; w++){
    agora = base + w*7*86400000 + 3600000; app.runSync(true);
    const P = s.modules.run.plan; const nv = P.motor.nivel;
    P.workouts.forEach(x=>{
      const tipo = x.motor && x.motor.tipo; if(!tipo || tipo === 'prova') return; sessoes++;
      const teto = tipo === 'longao' ? tempoLongo : tempo;
      t('nenhum treino passa do tempo escolhido', x.duration <= teto, `${tag} sem${w+1} nv${nv} ${tipo} ${x.duration}′ > ${teto}′`);
      if(x.motor.nota && /não cabe/.test(x.motor.nota)) trocas++;
      if(lim.includes('joelho')) t('joelho: sem subida, velocidade, tiros curtos ou longos', !['subida','velocidade','tiros_curtos','tiros_longos'].includes(tipo), `${tag} sem${w+1} ${tipo}`);
      if(lim.length >= 2) t('duas limitações: só treinos leves', !(RT[tipo] && RT[tipo].q), `${tag} sem${w+1} ${tipo}`);
      if(lim.length && RT[tipo] && tipo !== 'caminhada') t('orientação de parar quando a dor muda a passada', (x.motor.orient||[]).some(o=>/mudar sua passada/.test(o)), `${tag} ${tipo}`);
      if(lim.includes('joelho') && RT[tipo] && !['caminhada','camcorre'].includes(tipo)) t('orientação específica do joelho', (x.motor.orient||[]).some(o=>/^Joelho:/.test(o)), `${tag} ${tipo}`);
    });
    P.workouts.forEach(x=>{ if(!x.motor || x.motor.tipo === 'prova') return;
      s.modules.run.history.push({ at: agora + (x.dayIdx-1)*86400000, duration:x.duration, distance:+(x.targetKm||3), rpe:5, concluiu:'sim', tipoSessao:x.motor.tipo, activity:'corrida' }); });
  }
}
console.log(`Corrida — tempo como limite: ${casos} planos, ${sessoes} sessões, ${trocas} trocadas por sessão mais curta`);
Object.keys(exemplos).forEach(k=>console.log('❌ ' + k + ' (' + exemplos[k].length + '): ' + exemplos[k].slice(0,6).join(' | ')));
console.log(`${ok} ok, ${falhou} falha(s)`);
if(falhou) process.exit(1);

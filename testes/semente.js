// Cria um aluno de teste completo (perfil, plano de musculação e de corrida, 70 dias de histórico).
// Usado pelos testes de navegador (testes/navegador.py). Roda DENTRO da página, depois do login simulado.
window.mtSemente = function(){
  const DIA = 86400000, agora = Date.now();
  state.user.profile = { nickname:'Ana', sex:'f', birth:'1994-05-10', age:32, height:165, currentWeight:63, whatsapp:'', goal:'massa', level:'intermediario', quiz_done:true };
  state.weights = [{ date: agora-60*DIA, weight:65 }, { date: agora-30*DIA, weight:64 }, { date: agora-2*DIA, weight:63 }];
  const setupL = { goal:'hipertrofia', days:4, equip:'academia', level:'intermediario', selectedDays:[1,2,4,5] };
  state.modules.lift = { setup:setupL, plan: generatePlan('lift', setupL), week:1, createdAt: agora-70*DIA, startAt: agora-70*DIA, history:[] };
  const setupR = { goal:'10km', days:3, selectedDays:[3,6,7], terrain:'asfalto', aval:{ exp:'regular', continuo:'60', kmSemana:15, tempo:60, tempoLongo:80, lim:[], em:agora-70*DIA } };
  state.modules.run = { setup:setupR, plan: generatePlan('run', setupR), week:1, createdAt: agora-70*DIA, startAt: agora-70*DIA, history:[] };
  const H = state.modules.lift.history, R = state.modules.run.history;
  for(let d=68; d>=1; d--){
    const t = new Date(agora - d*DIA); t.setHours(18, 10, 0, 0); const wd = t.getDay()===0?7:t.getDay();
    const w = state.modules.lift.plan.workouts.find(x=>x.dayIdx===wd);
    if(w && d%9!==0){
      const ex = w.exercises.map((e,i)=>{ const peso = 10 + i*5 + Math.floor((68-d)/7); const sets = [{peso, reps:10},{peso, reps:9},{peso, reps:8}];
        (state.progress[e.id] = state.progress[e.id] || []).push({ date:t.getTime(), sets });
        return { id:e.id, name:e.name, part:e.part, sets:3, best:`${peso}kg×10` }; });
      H.push({ id:w.k, name:'Treino '+w.k+' — '+w.name, at:t.getTime(), duration:55, plannedDuration:w.duration, module:'lift', feel:'bem', rpe:6, parts:[...w.parts], exercisesDone:ex });
    }
    if(wd===3 || wd===6){ const km = wd===6 ? 8 + (68-d)/20 : 5; const min = km*6.1; R.push({ id:'S1', name:'Corrida leve', at:t.getTime()+3600000, duration:+min.toFixed(1), distance:+km.toFixed(1), pace:fmtPaceMin(min/km), rpe:5, rating:3, module:'run', activity:'corrida', tipoSessao:'leve', concluiu:'sim' }); }
    if(wd===7 && d%14===0) R.push({ id:'livre', name:'🚴 Bike — 20km', at:t.getTime(), duration:50, distance:20, pace:'24.0 km/h', rpe:4, module:'run', activity:'bike' });
  }
  ensureStats(); try{ checkTrophies(); }catch(e){}
  state.active = 'lift';
  saveData();
  goTab('home');
  return { treinos:H.length, corridas:R.length };
};

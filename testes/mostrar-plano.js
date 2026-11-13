// Mostra um plano gerado. Uso: node testes/mostrar-plano.js academia iniciante hipertrofia 4 [idade] [semana]
const { carregar } = require('./ambiente'); const app = carregar();
const [equip='academia', level='iniciante', goal='hipertrofia', days='4', idade='30', sem='0'] = process.argv.slice(2);
app.estado().user = { name:'T', email:'t@t', profile:{ age:+idade, quiz_done:true } };
const real = app.Date.now; app.Date.now = ()=>real() + (+sem)*7*86400000;
const p = app.generatePlan('lift', { equip, level, goal, days:+days });
p.workouts.forEach(w=>{ console.log(`\n${w.k} · ${w.dayName} · ${w.name} · ~${w.duration} min · ${w.exercises.reduce((a,e)=>a+e.sets,0)} séries`);
  w.exercises.forEach(e=>console.log(`   ${e.part.padEnd(11)} ${e.name.padEnd(44)} ${e.sets}x${e.reps}  desc. ${e.rest}  [${app.exPapel(e,e.part).id}]`)); });

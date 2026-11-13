// Confere a correção única dos planos salvos (Beta 33): gera planos com o código da Beta 32
// e aplica a correção da versão nova. Uso: node testes/migracao-fichas.js /pasta/da/beta32
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
const { carregar } = require('./ambiente');
const pastaVelha = process.argv[2];
if(!pastaVelha || !fs.existsSync(path.join(pastaVelha, 'app.js'))){ console.log('Informe a pasta da Beta 32 (com app.js e app-plus.js).'); process.exit(0); }
// carrega a versão antiga com o mesmo ambiente
const amb = require('./ambiente');
function carregarDe(pasta){
  const original = amb.RAIZ; const m = require.cache[require.resolve('./ambiente')];
  const src = fs.readFileSync(path.join(__dirname, 'ambiente.js'), 'utf8').replace("const RAIZ = path.join(__dirname, '..');", `const RAIZ = ${JSON.stringify(pasta)};`);
  const mod = { exports:{} }; new Function('require','module','__dirname', src)(require, mod, __dirname); return mod.exports.carregar();
}
const velho = carregarDe(pastaVelha), novo = carregar();
let total = 0, comProblemaAntes = 0, comProblemaDepois = 0, principaisMantidos = 0, principaisAntes = 0, historicoIgual = true;
for(const equip of ['casa','halteres','academia']) for(const level of ['iniciante','intermediario','avancado']) for(const goal of ['hipertrofia','forca','emagrecimento']) for(const days of [3,4,5,6]){
  velho.estado().user = { name:'T', email:'t@t', profile:{ age:30, quiz_done:true } };
  const setup = { equip, level, goal, days };
  const planoVelho = JSON.parse(JSON.stringify(velho.generatePlan('lift', setup)));
  const s = novo.estado();
  s.user = { name:'T', email:'t@t', profile:{ age:30, quiz_done:true } };
  s.modules.lift = { setup, plan: planoVelho, history:[{ at:1, id:'A', module:'lift' }], createdAt:1, startAt:1 };
  s.b33Fichas = false;
  const antes = planoVelho.workouts.filter(w=>novo.b33FichaComProblema(w, level)).length;
  const lideres = planoVelho.workouts.map(w=>{ const L={}; w.exercises.forEach(e=>{ if(!L[e.part] && novo.exPapel(e,e.part).tier==='principal') L[e.part]=e.id; }); return L; });
  novo.b33CorrigeFichas();
  const depois = s.modules.lift.plan.workouts.filter(w=>novo.b33FichaComProblema(w, level)).length;
  s.modules.lift.plan.workouts.forEach((w,i)=>Object.entries(lideres[i]).forEach(([g,id])=>{ principaisAntes++; if(w.exercises.some(e=>e.id===id)) principaisMantidos++; }));
  if(s.modules.lift.history.length !== 1) historicoIgual = false;
  total++; if(antes) comProblemaAntes++; if(depois) comProblemaDepois++;
}
console.log(`Planos da Beta 32 testados: ${total}`);
console.log(`Com problema antes da correção: ${comProblemaAntes} · depois: ${comProblemaDepois}`);
console.log(`Exercícios principais mantidos: ${principaisMantidos} de ${principaisAntes}`);
console.log(`Histórico preservado: ${historicoIgual ? 'sim' : 'NÃO'}`);
process.exitCode = (comProblemaDepois || !historicoIgual) ? 1 : 0;

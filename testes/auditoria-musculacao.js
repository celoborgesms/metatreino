// Gera TODOS os planos de musculação possíveis e confere a qualidade das fichas.
// Uso: node testes/auditoria-musculacao.js [--detalhe]
'use strict';
const { carregar } = require('./ambiente');
const app = carregar();
const s = app.estado();
s.user = { name:'Teste', email:'t@t', profile:{ age:30, sex:'M', quiz_done:true } };
const EQUIPS = ['casa','halteres','basico','academia'], NIVEIS = ['iniciante','intermediario','avancado'], OBJ = ['hipertrofia','forca','emagrecimento','resistencia'], DIAS = [3,4,5,6];
const det = process.argv.includes('--detalhe');
const papel = app.exPapel || (()=>null);
const problemas = {}; const add = (k, txt)=>{ (problemas[k] = problemas[k] || []).push(txt); };
let total = 0; const volume = {};
// as 4 semanas de rotação do gerador
const semanas = [0,1,2,3];
const agoraReal = Date.now;
for(const sem of semanas){
  app.Date.now = ()=>agoraReal() + sem*7*86400000;
  for(const equip of EQUIPS) for(const level of NIVEIS) for(const goal of OBJ) for(const days of DIAS){
    const setup = { equip, level, goal, days };
    const plan = app.generatePlan('lift', setup); total++;
    const tag = `${equip}/${level}/${goal}/${days}d/sem${sem}`;
    const vol = {};
    plan.workouts.forEach(w=>{
      const ids = w.exercises.map(e=>e.id);
      const dup = ids.filter((x,i)=>ids.indexOf(x)!==i);
      if(dup.length) add('exercicio-duplicado-no-treino', `${tag} ${w.k}: ${dup.join(', ')}`);
      if(!w.exercises.length) add('treino-vazio', `${tag} ${w.k}`);
      const series = w.exercises.reduce((a,e)=>a+(+e.sets||0),0);
      if(series > 32) add('series-demais-por-sessao(>32)', `${tag} ${w.k}: ${series} séries`);
      if(w.duration >= 100) add('duracao-no-teto(100min)', `${tag} ${w.k}`);
      // grupo principal do dia começa com isolador?
      const porGrupo = {};
      w.exercises.forEach(e=>{ (porGrupo[e.part] = porGrupo[e.part] || []).push(e); vol[e.part] = (vol[e.part]||0) + (+e.sets||0); });
      Object.entries(porGrupo).forEach(([g, exs])=>{
        if(['Peito','Costas','Pernas','Ombro','Glúteos'].includes(g)){
          const p0 = papel(exs[0], g);
          if(p0 && p0.tier !== 'principal') add('grupo-grande-sem-exercicio-principal-no-inicio', `${tag} ${w.k} ${g}: ${exs[0].name}`);
        }
        if(g==='Peito' && equip!=='casa' && !exs.some(e=>/supino|flex[aã]o/i.test(e.name))) add('peito-sem-supino-ou-flexao', `${tag} ${w.k}: ${exs.map(e=>e.name).join(', ')}`);
        if(g==='Costas' && exs.length>=2 && !(exs.some(e=>app.exPattern(e.name)==='puxar_v') && exs.some(e=>app.exPattern(e.name)==='puxar_h')) && equip!=='casa') add('costas-sem-puxada-e-remada', `${tag} ${w.k}: ${exs.map(e=>e.name).join(', ')}`);
        if(g==='Pernas' && exs.length>=2 && !exs.some(e=>/agach|leg press|hack|afundo|b[uú]lgaro|step/i.test(e.name))) add('pernas-sem-agachamento-ou-similar', `${tag} ${w.k}: ${exs.map(e=>e.name).join(', ')}`);
        // papel repetido no mesmo grupo (só academia, onde sempre há alternativa). Repetições previstas na sequência: remada, desenvolvimento e crucifixo
        const previstos = { Costas:['remada'], Ombro:['desenvolvimento'], Peito:['crucifixo'], Panturrilha:['em-pe'] };
        const pats = exs.map(e=>papel(e,g)).filter(Boolean).map(x=>x.id);
        const rp = pats.filter((x,i)=>pats.indexOf(x)!==i && !(previstos[g]||[]).includes(x));
        if(rp.length && equip==='academia') add('mesmo-papel-repetido-no-grupo', `${tag} ${w.k} ${g}: ${exs.map(e=>e.name).join(', ')}`);
        if(equip!=='casa' && exs.length && /contra parede|peso corporal\)/i.test(exs[0].name) && ['Pernas'].includes(g)) add('principal-sem-carga-para-quem-tem-carga', `${tag} ${w.k} ${g}: ${exs[0].name}`);
        exs.forEach(e=>{ if((g==='Core'||g==='Panturrilha') && /^[1-6]-/.test(String(e.reps))) add('core-ou-panturrilha-com-poucas-reps', `${tag} ${w.k}: ${e.name} ${e.reps}`); });
        if(/Encolhimento/.test(exs.map(e=>e.name).join()) && exs.filter(e=>/Encolhimento/.test(e.name)).length>1) add('dois-encolhimentos', `${tag} ${w.k}`);
      });
      // descanso: o principal nunca descansa menos que o acessório do mesmo treino
      const seg = r=>app.parseRestSeconds(r);
      const pr = w.exercises.filter(e=>papel(e,e.part).tier==='principal').map(e=>seg(e.rest)), ac = w.exercises.filter(e=>papel(e,e.part).tier==='acessorio' && !['Core','Panturrilha','Trapézio'].includes(e.part)).map(e=>seg(e.rest));
      if(pr.length && ac.length && Math.min(...pr) < Math.max(...ac)) add('principal-descansa-menos-que-acessorio', `${tag} ${w.k}`);
      if(series > ({iniciante:20,intermediario:26,avancado:30})[level] + 2) add('acima-do-teto-de-series', `${tag} ${w.k}: ${series}`);
    });
    Object.entries(vol).forEach(([g,v])=>{ const k = `${level}/${goal}/${days}d`; volume[k] = volume[k] || {}; volume[k][g] = Math.max(volume[k][g]||0, v); });
    // treinos do mesmo grupo em dias seguidos (dias padrão do app)
    const ws = [...plan.workouts].sort((a,b)=>a.dayIdx-b.dayIdx);
    for(let i=0;i<ws.length;i++){ const a=ws[i], b=ws[(i+1)%ws.length]; const gap=((b.dayIdx-a.dayIdx)+7)%7 || 7;
      if(gap===1){ const comum = a.parts.filter(p=>b.parts.includes(p) && !['Core','Panturrilha'].includes(p)); if(comum.length) add('mesmo-grupo-em-dias-seguidos', `${tag} ${a.k}->${b.k}: ${comum.join(',')}`); } }
  }
}
app.Date.now = agoraReal;
// dias escolhidos pelo aluno: todas as combinações de dias da semana
function combina(n, k, ini=1, atual=[], out=[]){ if(atual.length===k){ out.push(atual.slice()); return out; } for(let d=ini; d<=n; d++){ atual.push(d); combina(n,k,d+1,atual,out); atual.pop(); } return out; }
let combDias = 0; const seguidos = {};
for(const days of DIAS) for(const sel of combina(7, days)){
  const plan = app.generatePlan('lift', { equip:'academia', level:'intermediario', goal:'hipertrofia', days, selectedDays:sel }); combDias++;
  const ws = [...plan.workouts].sort((a,b)=>a.dayIdx-b.dayIdx);
  for(let i=0;i<ws.length;i++){ const a=ws[i], b=ws[(i+1)%ws.length]; const gap=((b.dayIdx-a.dayIdx)+7)%7 || 7;
    if(gap===1){ const comum = a.parts.filter(p=>b.parts.includes(p) && !['Core','Panturrilha'].includes(p)); if(comum.length){ const k=`${days}d ${a.k}->${b.k} (${comum.join(',')})`; seguidos[k]=(seguidos[k]||0)+1; } } }
}
console.log(`Combinações de dias da semana testadas: ${combDias}`);
Object.entries(seguidos).forEach(([k,n])=>console.log(`   ⚠️  mesmo grupo em dias seguidos: ${k} em ${n} combinações`));
console.log(`Planos gerados: ${total} (4 equipamentos × 3 níveis × 4 objetivos × 4 opções de dias × 4 semanas de rotação)\n`);
const chaves = Object.keys(problemas);
if(!chaves.length) console.log('✅ Nenhum problema encontrado.');
chaves.forEach(k=>{ console.log(`❌ ${k}: ${problemas[k].length}`); problemas[k].slice(0, det?999:3).forEach(t=>console.log('     ' + t)); });
if(det){ console.log('\nSéries semanais diretas por grupo (máximo entre equipamentos/semanas):'); Object.entries(volume).forEach(([k,v])=>console.log(k.padEnd(28), Object.entries(v).map(([g,n])=>g+':'+n).join('  '))); }
process.exitCode = chaves.length ? 1 : 0;

// Beta 49 — "Trocar exercício" nunca sugere o que já está no treino de hoje (nem o original de outra troca,
// nem variação com o mesmo nome) e cada opção aparece uma vez só, nos dois motivos (ocupado / prefiro outro).
// Uso: node testes/troca-sem-repetir.js
'use strict';
const { carregar } = require('./ambiente');
const app = carregar();
let ok = 0, falhou = 0; const ex = {};
function t(nome, cond, det){ if(cond) ok++; else { falhou++; (ex[nome] = ex[nome] || []).push(det); } }
const norm = s=>app.mtNorm(String(s||'')).replace(/\([^)]*\)/g,'').replace(/\s+/g,' ').trim();
const EQUIPS = ['academia','casa_halteres','casa_basico','peso_corpo'], NIVEIS = ['iniciante','intermediario','avancado'], OBJ = ['hipertrofia','forca','emagrecimento','resistencia'];
let casos = 0;
for(const equip of EQUIPS) for(const level of NIVEIS) for(const goal of OBJ) for(const days of [3,4,5]){
  const setup = { equip, level, goal, days };
  let plan; try{ plan = app.generatePlan('lift', setup); }catch(e){ continue; }
  plan.workouts.forEach(w=>{
    // simula uma troca já feita em outro exercício do treino
    const w2 = JSON.parse(JSON.stringify(w));
    if(w2.exercises.length >= 3){ const o = w2.exercises[1]; w2.exercises[1] = Object.assign({}, w2.exercises[2], { id:'troca-'+o.id, name:'Exercício trocado', troca:{ orig:o, dia:'2099-01-01' } }); }
    w2.exercises.forEach(cur=>{
      ['ocupado','preferencia','grupo'].forEach(mot=>{
        const r = app.mtCandidatosTroca(w2, cur, mot, setup); if(!r) return; casos++;
        const lista = [...r.mais, ...r.compat, ...r.mesmoEq, ...r.secund];
        const ids = lista.map(x=>x.id);
        const doTreino = new Set(w2.exercises.filter(e=>e.id!==cur.id).map(e=>e.id)); w2.exercises.forEach(e=>{ if(e.troca && e.troca.orig) doTreino.add(e.troca.orig.id); });
        const nomes = new Set(w2.exercises.filter(e=>e.id!==cur.id).map(e=>norm(e.name))); w2.exercises.forEach(e=>{ if(e.troca && e.troca.orig) nomes.add(norm(e.troca.orig.name)); });
        t('nenhuma sugestão repete exercício do treino de hoje', !lista.concat(r.favs).some(x=>doTreino.has(x.id)), `${equip}/${level} ${w.k} ${cur.name} [${mot}]`);
        t('nenhuma sugestão repete o mesmo exercício com outro nome', !lista.concat(r.favs).some(x=>nomes.has(norm(x.ex.name))), `${equip}/${level} ${w.k} ${cur.name} [${mot}] ${lista.filter(x=>nomes.has(norm(x.ex.name))).map(x=>x.ex.name)}`);
        t('cada opção aparece uma vez só', new Set(ids).size === ids.length, `${equip}/${level} ${w.k} ${cur.name} [${mot}] ${ids.filter((x,i)=>ids.indexOf(x)!==i)}`);
        t('o próprio exercício nunca aparece', !ids.includes(cur.id), `${cur.name}`);
      });
    });
  });
}
console.log(`Troca sem repetir: ${casos} listas analisadas`);
Object.keys(ex).forEach(k=>console.log('❌ ' + k + ' (' + ex[k].length + '): ' + ex[k].slice(0,5).join(' | ')));
console.log(`${ok} ok, ${falhou} falha(s)`);
if(falhou) process.exit(1);

// Dois aparelhos com a mesma conta: confere que nada se perde nem duplica ao juntar as cópias.
'use strict';
const { carregar } = require('./ambiente');
const app = carregar(); const D = app.Date;
let ok = 0, falhou = 0; const t = (n, c, d)=>{ if(c) ok++; else { falhou++; console.log('❌ ' + n + (d!==undefined?' → '+JSON.stringify(d):'')); } };
const agora = Date.now(), DIA = 86400000;
const base = ()=>({ user:{ name:'A' }, modules:{ lift:{ history:[{ at:agora-5*DIA, id:'A', module:'lift' }, { at:agora-3*DIA, id:'B', module:'lift' }] }, run:{ history:[{ at:agora-4*DIA, module:'run', distance:5 }] } },
  progress:{ supino:[{ date:agora-5*DIA, sets:[{peso:40,reps:10}] }] }, prs:{ supino:{ peso:40, reps:10 } }, trophies:['first_workout'], weights:[{ date:agora-10*DIA, weight:70 }] });
const J = o=>app.__get('(' + JSON.stringify(o) + ')');   // objetos criados dentro do app
// aparelho 1 registrou um treino offline; aparelho 2 registrou outro na nuvem
const a1 = J(base()), a2 = J(base());
a1.modules.lift.history.push({ at:agora-1*DIA, id:'C', module:'lift', exercisesDone:[{id:'agacha'}] }); a1.progress.agacha = [{ date:agora-1*DIA, sets:[{peso:60,reps:8}] }];
a2.modules.lift.history.push({ at:agora-2*DIA, id:'D', module:'lift' }); a2.progress.remada = [{ date:agora-2*DIA, sets:[{peso:30,reps:12}] }];
a2.modules.run.history.push({ at:agora-2*DIA+3600000, module:'run', distance:8 }); a2.trophies.push('run_5k'); a2.prs.supino = { peso:45, reps:8 };
const r = app.mesclaEstado(a1, a2);
t('treino do outro aparelho entra', a1.modules.lift.history.some(x=>x.id==='D'));
t('treino offline continua', a1.modules.lift.history.some(x=>x.id==='C'));
t('sem duplicar', a1.modules.lift.history.length === 4, a1.modules.lift.history.map(x=>x.id));
t('corrida do outro aparelho entra', a1.modules.run.history.length === 2);
t('séries do dia do treino que veio', !!(a1.progress.remada && a1.progress.remada.length===1));
t('recorde fica o melhor', a1.prs.supino.peso === 45);
t('conquista do outro aparelho entra', a1.trophies.includes('run_5k'));
t('histórico em ordem de data', a1.modules.lift.history.every((x,i,arr)=>!i || arr[i-1].at <= x.at));
t('informa o que veio da outra cópia', r.daOutra >= 4, r);
// juntar de novo não muda nada (converge)
const r2 = app.mesclaEstado(a1, J(JSON.parse(JSON.stringify(a1))));
t('juntar a mesma cópia não muda nada', r2.daOutra === 0 && a1.modules.lift.history.length === 4, r2);
// exclusão não ressuscita
const b1 = J(base()), b2 = J(base());
b1.histExcluidos = ['lift|' + (agora-3*DIA)]; b1.modules.lift.history = b1.modules.lift.history.filter(x=>x.id!=='B');
app.mesclaEstado(b1, b2); t('treino excluído não volta', !b1.modules.lift.history.some(x=>x.id==='B'));
const c1 = J(base()), c2 = J(base()); c2.histExcluidos = ['lift|' + (agora-3*DIA)]; c2.modules.lift.history = c2.modules.lift.history.filter(x=>x.id!=='B');
app.mesclaEstado(c1, c2); t('exclusão feita no outro aparelho também vale aqui', !c1.modules.lift.history.some(x=>x.id==='B'));
// histórico com mais de 90 dias (já foi para o arquivo anual) não volta para o app
const d1 = J(base()), d2 = J(base()); d2.modules.lift.history.unshift({ at:agora-120*DIA, id:'V', module:'lift' });
app.mesclaEstado(d1, d2); t('registro antigo (arquivo anual) não volta', !d1.modules.lift.history.some(x=>x.id==='V'));
// cópia antiga deste aparelho: só entra o que foi registrado depois da última gravação confirmada na nuvem
const e1 = J(base()), e2 = J(base());   // e1 = nuvem (mais nova), e2 = cache antigo do aparelho
e2.modules.lift.history.push({ at:agora-20*DIA, id:'EXCL', module:'lift' });          // foi excluído em outro aparelho antes da Beta 33 (sem marca)
e2.modules.lift.history.push({ at:agora-1*DIA+5000, id:'OFF', module:'lift' });       // feito offline depois da última gravação
app.mesclaEstado(e1, e2, { desde: agora-1*DIA });
t('excluído antes da Beta 33 não volta pelo cache antigo', !e1.modules.lift.history.some(x=>x.id==='EXCL'));
t('treino offline depois da última gravação entra', e1.modules.lift.history.some(x=>x.id==='OFF'));
console.log(`\n${ok} testes aprovados, ${falhou} reprovados.`); process.exitCode = falhou ? 1 : 0;

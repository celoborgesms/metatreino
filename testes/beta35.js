// Beta 35: plano editado em outro aparelho, corrida adaptada por dor, divisão de 3 dias, confirmações.
'use strict';
const { carregar } = require('./ambiente');
const app = carregar();
let ok = 0, falhou = 0; const t = (n, c, d)=>{ if(c) ok++; else { falhou++; console.log('❌ ' + n + (d!==undefined?' → '+JSON.stringify(d):'')); } };
const J = o=>app.__get('(' + JSON.stringify(o) + ')');
const agora = Date.now(), DIA = 86400000;

// 1) plano trocado em outro aparelho: o mais recente vence; o histórico continua sendo somado
const base = (nome, at)=>({ user:{ name:'A' }, modules:{ lift:{ setup:{ days:4, goal:'hipertrofia' }, plan:{ type:'lift', workouts:[{ k:'A', name:nome }] }, planAt:at, history:[{ at:agora-3*DIA, id:'H1', module:'lift' }] } } });
let a = J(base('Antigo', agora-2*DIA)), b = J(base('Novo', agora-DIA));
b.modules.lift.history.push({ at:agora-DIA, id:'H2', module:'lift' });
let r = app.mesclaEstado(a, b);
t('plano mais recente do outro aparelho entra', a.modules.lift.plan.workouts[0].name === 'Novo', a.modules.lift.plan);
t('planAt acompanha o plano', a.modules.lift.planAt === agora-DIA);
t('histórico continua sendo somado', a.modules.lift.history.length === 2);
t('conta como mudança vinda da outra cópia', r.daOutra >= 1, r);
a = J(base('Novo', agora-DIA)); b = J(base('Antigo', agora-2*DIA));
app.mesclaEstado(a, b);
t('plano mais antigo do outro aparelho não sobrescreve', a.modules.lift.plan.workouts[0].name === 'Novo');
a = J(base('Local', undefined)); b = J(base('Remoto', undefined));
app.mesclaEstado(a, b);
t('sem marca de data (versões antigas) mantém o plano local', a.modules.lift.plan.workouts[0].name === 'Local');
b = J(base('Novo', agora-DIA)); a = J(base('Velho', agora-2*DIA));
app.mesclaEstado(a, b); b.modules.lift.plan.workouts[0].name = 'Mexido';
t('cópia independente (não compartilha objeto)', a.modules.lift.plan.workouts[0].name === 'Novo');

// 2) salvar marca planAt só quando o plano muda
app.trocarEstado(J({ user:{ name:'A' }, modules:{ lift:{ setup:{ days:4 }, plan:{ workouts:[{ name:'X' }] }, history:[] } }, active:'lift' }));
app.__set('fbUser', app.__get('({ uid:"u1", email:"a@a.com" })'));
app.__get('planoMarcaBase')();
try{ app.__get('saveData')(); }catch(e){}
t('salvar sem mudar o plano não marca data', !app.estado().modules.lift.planAt);
app.estado().modules.lift.plan.workouts[0].name = 'Y';
try{ app.__get('saveData')(); }catch(e){}
t('salvar com plano alterado marca a data', app.estado().modules.lift.planAt > agora - 5000, app.estado().modules.lift.planAt);

// 3) corrida com dor de joelho: o conteúdo vira caminhada; ao tirar a dor, volta o original
const plano = app.__get('generatePlan')('run', { goal:'5km', days:3, level:'iniciante' });
app.trocarEstado(J({ user:{ name:'A', pain:['Joelho'] }, modules:{ run:{ setup:{ goal:'5km', days:3 }, plan:plano, history:[] } }, active:'run' }));
const antes = JSON.stringify(app.estado().modules.run.plan.workouts.map(w=>w.blocks));
app.__get('regenRunPlan')();
const ws = app.estado().modules.run.plan.workouts;
const textoBlocos = w=>JSON.stringify(w.blocks||[]).toLowerCase();
t('todos os treinos viram caminhada', ws.every(w=>w.adapted && /caminhada/i.test(w.name)));
t('blocos não falam mais de tiros/ritmo', ws.every(w=>!/tiro|interval|fartlek|ritmo de prova|longão/.test(textoBlocos(w))), ws.map(textoBlocos));
t('sem ritmo-alvo de corrida', ws.every(w=>w.targetPace == null));
t('motor marca caminhada', ws.every(w=>!w.motor || w.motor.tipo === 'caminhada'));
app.estado().user.pain = [];
app.__get('regenRunPlan')();
t('sem dor: blocos originais voltam', JSON.stringify(app.estado().modules.run.plan.workouts.map(w=>w.blocks)) === antes);
t('sem dor: nada de cópia guardada sobrando', app.estado().modules.run.plan.workouts.every(w=>!w.originalBlocks));

// 4) musculação 3 dias: com folga entre os dias, cada grupo grande 2×; dias seguidos mantém a divisão antiga
const gp = app.__get('generatePlan');
const contaGrupo = (p, g)=>p.workouts.filter(w=>w.parts.includes(g)).length;
let p = gp('lift', { days:3, selectedDays:[1,3,5], goal:'hipertrofia', level:'intermediario', equip:'academia' });
t('3 dias alternados: peito 2× na semana', contaGrupo(p,'Peito') === 2, p.workouts.map(w=>w.name));
t('3 dias alternados: pernas 2× na semana', contaGrupo(p,'Pernas') === 2);
t('3 dias alternados: duração até 90 min', p.workouts.every(w=>w.duration <= 90), p.workouts.map(w=>w.duration));
p = gp('lift', { days:3, selectedDays:[1,2,3], goal:'hipertrofia', level:'intermediario', equip:'academia' });
t('3 dias seguidos: divisão clássica', p.workouts[0].name === 'Peito + Tríceps', p.workouts.map(w=>w.name));
p = gp('lift', { days:3, selectedDays:[1,3,5], split3:'classico', goal:'hipertrofia', level:'intermediario', equip:'academia' });
t('opção clássica respeitada', p.workouts[0].name === 'Peito + Tríceps');
p = gp('lift', { days:3, selectedDays:[1,4,6], goal:'hipertrofia', level:'intermediario', equip:'academia' });
t('folga contando a virada da semana (sáb→seg)', p.workouts[0].name === 'Superior', p.workouts.map(w=>w.name));

// 5) ações destrutivas pedem confirmação
const chamadas = []; app.__set('appConfirm', (msg, ok, o)=>chamadas.push({ msg, titulo:o && o.title }));
app.__set('maThread', app.__get('[{r:"a",t:"oi"},{r:"u",t:"oi"}]'));
try{ app.__get('maClearThread')(); }catch(e){}
t('limpar conversa pede confirmação', chamadas.length === 1 && /Limpar/.test(chamadas[0].titulo||''), chamadas);
t('conversa só é apagada depois de confirmar', app.__get('maThread').length === 2);

console.log(`\nBeta 35 — ${ok} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);

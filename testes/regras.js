// Testes de regras de negócio que não dependem de conta real nem de navegador.
// Uso: node testes/regras.js
'use strict';
const { carregar } = require('./ambiente');
const app = carregar();
let ok = 0, falhou = 0;
function t(nome, cond, detalhe){ if(cond){ ok++; } else { falhou++; console.log('❌ ' + nome + (detalhe!==undefined ? ' → ' + JSON.stringify(detalhe) : '')); } }
const perto = (a, b, tol) => Math.abs(a - b) <= tol;

// ---------- tempo de descanso ----------
const P = app.parseRestSeconds;
t('descanso 60-90s = 75 s', P('60-90s') === 75, P('60-90s'));
t('descanso 2-3min = 150 s', P('2-3min') === 150, P('2-3min'));
t('descanso 90-120s = 105 s', P('90-120s') === 105);
t('descanso 3min = 180 s', P('3min') === 180);
t('descanso 1:30 = 90 s', P('1:30') === 90, P('1:30'));
t('descanso vazio = 60 s', P('') === 60 && P(null) === 60);
t('descanso nunca < 5 s', P('0s') === 5);

// ---------- ritmo e formatação ----------
t('ritmo 5,995 min/km não vira 5:60', app.fmtPaceMin(5.995) === '6:00/km', app.fmtPaceMin(5.995));
t('ritmo 4,5 min/km = 4:30/km', app.fmtPaceMin(4.5) === '4:30/km');
t('mtPaceStr arredonda 59,7 s para o minuto seguinte', app.mtPaceStr(5.995) === '6:00/km', app.mtPaceStr(5.995));
t('mtPaceStr de valor inválido', app.mtPaceStr(0) === '—' && app.mtPaceStr(Infinity) === '—');
t('parseTimeToMin 25:30 = 25,5', app.parseTimeToMin('25:30') === 25.5);
t('parseTimeToMin 1:02:03', perto(app.parseTimeToMin('1:02:03'), 62.05, 1e-9));
t('rFmtSeg 3725 s = 1:02:05', app.rFmtSeg(3725) === '1:02:05', app.rFmtSeg(3725));
t('rFmtSeg 59,6 s = 1:00', app.rFmtSeg(59.6) === '1:00', app.rFmtSeg(59.6));
t('mtFmtKm 5 = "5" e 5,25 = "5,3"', app.mtFmtKm(5) === '5' && app.mtFmtKm(5.25) === '5,3', [app.mtFmtKm(5), app.mtFmtKm(5.25)]);

// ---------- VDOT (Jack Daniels) — valores da tabela oficial ----------
const V = app.rVdot;
t('VDOT 5 km em 25:00 ≈ 38,3', perto(V(5, 25), 38.3, 0.3), V(5,25));
t('VDOT 5 km em 20:00 ≈ 49,8', perto(V(5, 20), 49.8, 0.3), V(5,20));
t('VDOT 10 km em 50:00 ≈ 39,9', perto(V(10, 50), 39.9, 0.4), V(10,50));
t('VDOT maratona 3:30:00 ≈ 44,6', perto(V(42.195, 210), 44.6, 0.4), V(42.195,210));
t('previsão 10 km com VDOT 50 ≈ 41:2x', perto(app.rPrevisto(50, 10), 41.35, 0.5), app.rPrevisto(50,10));
t('previsão 5 km com VDOT 38,3 ≈ 25:00', perto(app.rPrevisto(38.3, 5), 25, 0.3), app.rPrevisto(38.3,5));
t('VDOT inválido = null', V(0, 25) === null && V(5, 0) === null);
const Z = app.rZonasDe(45);
t('zonas VDOT 45: leve > maratona > limiar > intervalado (min/km)', Z.leve.a > Z.maratona.a && Z.maratona.a > Z.limiar.a && Z.limiar.a > Z.intervalado.a);
t('zona limiar VDOT 45 ≈ 4:37/km (tabela de Daniels)', perto(Z.limiar.a, 4.62, 0.08), Z.limiar);

// ---------- datas e semana ----------
const D = app.Date;
const sem = app.semanaLocalId;
const seg = new D(2026, 10, 9, 0, 5).getTime(), dom = new D(2026, 10, 15, 23, 55).getTime(), segSeg = new D(2026, 10, 16, 0, 5).getTime();
t('semana começa na segunda e termina no domingo', sem(seg) === sem(dom) && sem(segSeg) === sem(dom) + 1, [sem(seg), sem(dom), sem(segSeg)]);
const qua = new D(2026, 10, 11, 12).getTime();
t('número da semana igual ao antigo de segunda a quarta (sem troca extra ao atualizar)', sem(qua) === Math.floor(qua/(7*86400000)), [sem(qua), Math.floor(qua/(7*86400000))]);
t('chaveDia usa a data local', app.chaveDia(new D(2026, 0, 1, 23, 59)) === '2026-01-01');
t('mtSemanaIni = segunda-feira 00:00', new D(app.mtSemanaIni(dom)).getDay() === 1 && new D(app.mtSemanaIni(dom)).getHours() === 0);
t('proxCarga: degraus 1/2/2,5/5', app.proxCarga(10)===11 && app.proxCarga(20)===22 && app.proxCarga(60)===62.5 && app.proxCarga(120)===125);

// ---------- dados para o Firestore ----------
const achados = [];
// o objeto é criado DENTRO do app (mesmo "Object" que ele usa)
const sujo = app.__get(`({ a: undefined, b: NaN, c: Infinity, d: [[1,2],[3]], __x__: 1, '': 2, e: new Date(0), f: ()=>1, g: { h: [ { i: undefined } ] } })`);
const limpo = app.limpaParaNuvem(sujo, 'estado', achados);
t('limpeza remove undefined e funções', !('a' in limpo) && !('f' in limpo));
t('limpeza troca NaN/Infinity por null', limpo.b === null && limpo.c === null);
t('limpeza desfaz array dentro de array', Array.isArray(limpo.d) && !Array.isArray(limpo.d[0]));
t('limpeza renomeia campo reservado e vazio', !('__x__' in limpo) && !('' in limpo));
t('limpeza converte Date em número', limpo.e === 0);
t('limpeza troca undefined dentro de array por null', limpo.g.h[0] && !('i' in limpo.g.h[0]));

// ---------- escape (segurança) ----------
t('escHtml escapa < > " &', app.escHtml('<a href="x">&</a>') === '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
t('jsAttr escapa aspas simples e HTML', app.jsAttr("a'b<c>") === "a\\'b&lt;c&gt;");
t('mtEsc escapa aspas simples', app.mtEsc("'") === '&#39;');

// ---------- escala de esforço ----------
t('RPE → sensação', app.rpeToFeel(2)==='otimo' && app.rpeToFeel(5)==='bem' && app.rpeToFeel(8)==='cansado' && app.rpeToFeel(10)==='exausto');

// ---------- papéis dos exercícios ----------
const pp = (n, g) => app.exPapel({ name:n }, g);
t('supino reto é principal do peito', pp('Supino Reto com Barra','Peito').tier === 'principal');
t('crossover é acessório do peito', pp('Crossover no Cabo (alto)','Peito').tier === 'acessorio');
t('crossover não é mais "empurrar"', app.exPattern('Crossover no Cabo (alto)') === 'isolador');
t('cadeira extensora é isolador', app.exPattern('Cadeira Extensora') === 'isolador');
t('pike é empurrar vertical', app.exPattern('Flexão Pike Elevada') === 'empurrar_v');

// ---------- sequência de dias ----------
app.estado().user = { profile:{} };
const hoje12 = new D(); hoje12.setHours(12,0,0,0); const DIA = 86400000;
const h3 = app.__get(`([{at:${hoje12.getTime()-1*DIA}},{at:${hoje12.getTime()-2*DIA}},{at:${hoje12.getTime()-3*DIA}}])`);
t('sequência conta até ontem quando hoje ainda não treinou', app.calcStreak(h3) === 3, app.calcStreak(h3));
const h4 = app.__get(`([{at:${hoje12.getTime()}},{at:${hoje12.getTime()-1*DIA}}])`);
t('sequência inclui hoje quando treinou hoje', app.calcStreak(h4) === 2, app.calcStreak(h4));
const h0 = app.__get(`([{at:${hoje12.getTime()-3*DIA}}])`);
t('sequência zera com 2 dias sem treinar', app.calcStreak(h0) === 0, app.calcStreak(h0));

// ---------- descanso por exercício e intensidade (Beta 34) ----------
const DS = (tier, goal, senior, reps)=>app.parseRestSeconds(app.liftDescanso(tier, goal, senior, reps));
t('composto pesado (4-6) descansa mais que composto moderado (8-12)', DS('principal','forca',false,'4-6') > DS('principal','hipertrofia',false,'8-12'));
t('isolado descansa menos que composto no mesmo objetivo', DS('acessorio','hipertrofia',false,'8-12') < DS('principal','hipertrofia',false,'8-12'));
t('emagrecimento NÃO dá descanso curto automático no composto (≥ 75 s)', DS('principal','emagrecimento',false,'12-15') >= 75, DS('principal','emagrecimento',false,'12-15'));
t('hipertrofia NÃO dá descanso longo automático no isolado (≤ 75 s)', DS('acessorio','hipertrofia',false,'8-12') <= 75, DS('acessorio','hipertrofia',false,'8-12'));
t('mesmo exercício e repetições: o objetivo não muda o descanso', DS('principal','emagrecimento',false,'8-12') === DS('principal','hipertrofia',false,'8-12'));
t('50+ anos descansa mais', DS('principal','hipertrofia',true,'8-12') > DS('principal','hipertrofia',false,'8-12'));
// ---------- tipo de registro (Beta 34) ----------
const TR = id=>app.exTipoRegistro(id);
t('agachamento com barra: carga', TR('agachamento-livre-com-barra') === 'carga', TR('agachamento-livre-com-barra'));
t('flexão de braço: peso do corpo', TR('flexao-de-braco') === 'corpo', TR('flexao-de-braco'));
t('barra fixa: peso do corpo', TR('barra-fixa') === 'corpo');
t('prancha: tempo', TR('prancha-plank') === 'tempo', TR('prancha-plank'));
t('mountain climber: cardio', TR('mountain-climber') === 'cardio', TR('mountain-climber'));
t('supino com halteres: carga', TR('supino-reto-com-halteres') === 'carga');
t('mobilidade: mobilidade', TR('mob-quadril') === 'mobilidade');

console.log(`\n${ok} testes aprovados, ${falhou} reprovados.`);
process.exitCode = falhou ? 1 : 0;


// =====================================================================
// 23. CORRIDA — DO PRIMEIRO PASSO À PREPARAÇÃO PARA PROVAS (Beta 14)
// Camada sobre o módulo de corrida que já existia: mesmo formato de plano
// (workouts com blocks), mesmo histórico, mesmas telas. O plano passa a ser
// gerado SEMANA A SEMANA por um "motor" que avalia a semana anterior antes
// de mudar qualquer coisa. Tudo é calculado em MINUTOS de corrida (tempo em
// movimento); km e ritmos só aparecem quando há dados confiáveis do aluno.
// Hierarquia (igual ao resto do app): retomada > recuperação/fadiga > progressão > normal.
// =====================================================================
const RN = ['iniciante','iniciante_avancado','intermediario','intermediario_avancado','avancado','competitivo'];
const RN_NOME = ['Iniciante','Iniciante avançado','Intermediário','Intermediário avançado','Avançado','Competitivo'];
const RN_LEG = ['iniciante','iniciante','intermediario','intermediario','avancado','avancado'];
const RN_FOCO = [
  'criar o hábito e a resistência básica, alternando caminhada e corrida',
  'correr sem parar por mais tempo, sempre em ritmo de conversa',
  'resistência e distância, com os primeiros treinos de ritmo',
  'velocidade e limiar: sustentar ritmos mais fortes por mais tempo',
  'treinos estruturados, volume maior e preparação específica para provas',
  'metas de desempenho, com controle fino de volume, intensidade e recuperação'];
const RGOAL = { comecar:{nome:'Começar a correr', km:null}, condicionamento:{nome:'Condicionamento', km:null},
  '5km':{nome:'5 km', km:5}, '10km':{nome:'10 km', km:10}, '21km':{nome:'Meia maratona', km:21.0975}, '42km':{nome:'Maratona', km:42.195} };
const RFASE = {
  adaptacao:{nome:'Adaptação', desc:'acostumar o corpo e a rotina ao treino, sem pressa'},
  base:{nome:'Resistência', desc:'construir a base aeróbica: mais tempo correndo em ritmo leve'},
  desenvolvimento:{nome:'Velocidade e ritmo', desc:'treinos de qualidade para correr mais forte por mais tempo'},
  especifica:{nome:'Preparação para a prova', desc:'treinos no ritmo e na distância da prova'},
  taper:{nome:'Polimento', desc:'volume menor para chegar descansado e afiado na prova'},
  pos_prova:{nome:'Recuperação pós-prova', desc:'corridas leves para o corpo se recuperar da prova'},
  recuperacao:{nome:'Semana de recuperação', desc:'volume menor para o corpo assimilar as últimas semanas'},
  retomada:{nome:'Retomada', desc:'volta gradual depois da pausa: só treinos leves e volume reduzido'}
};
// estágios de caminhada + corrida (nível Iniciante). O 6 fecha com 10 min sem parar.
const RUN_EST = [
  {rep:0, corre:0, anda:0, cam:25, nome:'Caminhada ativa'},
  {rep:8, corre:1, anda:2}, {rep:6, corre:2, anda:2}, {rep:5, corre:3, anda:2},
  {rep:4, corre:4, anda:2}, {rep:4, corre:5, anda:2}, {rep:3, corre:7, anda:2}, {rep:2, corre:10, anda:2}
];
const RUN_DIAS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
const _clamp = (v,a,b)=>Math.max(a, Math.min(b, v));
const _r5 = v=>Math.round(v/5)*5;

// ---------- contexto (o mesmo motor serve para o aluno logado e para o painel do admin) ----------
function runCtx(data){
  data = data || state;
  const mods = (data && data.modules) || {};
  return { run: mods.run || null, lift: mods.lift || null, user: (data && data.user) || {}, stats: (data && data.corridaStats) || {}, agora: Date.now() };
}
function _ehCorrida(r){ return r && (!r.activity || r.activity==='corrida'); }
function rCorridas(ctx){ return (((ctx.run||{}).history)||[]).filter(r=>_ehCorrida(r) && r.at && (+r.duration||0)>0).sort((a,b)=>a.at-b.at); }
function rAtividades(ctx){ return (((ctx.run||{}).history)||[]).filter(r=>r && r.at && (+r.duration||0)>0).sort((a,b)=>a.at-b.at); }
function rSem(t){ return mtSemanaIni(t==null?Date.now():t); }
function rPace(r){ return (+r.distance>0 && +r.duration>0) ? (+r.duration)/(+r.distance) : null; }
function rContinua(r){
  if(r.continuo === false) return false;
  if(r.tipoSessao === 'camcorre' || r.tipoSessao === 'caminhada') return r.continuo === true;
  return true;   // registros antigos: corrida registrada como corrida
}
function rFmtSeg(seg){ seg = Math.round(seg||0); const h = Math.floor(seg/3600), m = Math.floor(seg%3600/60), s = seg%60; return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`; }
function rFmtMin(min){ return rFmtSeg((min||0)*60); }
function rKmh(paceMin){ return paceMin>0 ? (60/paceMin) : 0; }
function rFmtKmh(paceMin){ return rKmh(paceMin).toLocaleString('pt-BR',{maximumFractionDigits:1, minimumFractionDigits:1})+' km/h'; }
function rFmtDurCurta(min){ min = Math.round(min); return min>=60 ? `${Math.floor(min/60)}h${String(min%60).padStart(2,'0')}` : `${min} min`; }

// ---------- ciência do ritmo: VDOT (Jack Daniels) ----------
function _pctMax(t){ return 0.8 + 0.1894393*Math.exp(-0.012778*t) + 0.2989558*Math.exp(-0.1932605*t); }
function rVdot(km, min){ if(!(km>0 && min>0)) return null; const v = km*1000/min; const vo2 = -4.6 + 0.182258*v + 0.000104*v*v; return vo2/_pctMax(min); }
function _velVo2(vo2){ const a = 0.000104, b = 0.182258, c = -4.6 - vo2; return (-b + Math.sqrt(b*b - 4*a*c))/(2*a); } // m/min
function rPrevisto(vdot, km){ let t = km*6; for(let i=0;i<40;i++){ const v = _velVo2(vdot*_pctMax(t)); t = km*1000/v; } return t; }
function _paceFrac(vdot, f){ return 1000/_velVo2(vdot*f); } // min/km
// zonas a partir do VDOT (min/km) — faixas: [rápido, lento]
function rZonasDe(vdot){
  const M = rPrevisto(vdot, 42.195)/42.195, T = _paceFrac(vdot, 0.88), I = _paceFrac(vdot, 0.975), R = I*0.94;
  return {
    regenerativo:{ a:_paceFrac(vdot,0.60)+0.25, b:_paceFrac(vdot,0.56)+0.5 },
    leve:{ a:_paceFrac(vdot,0.74), b:_paceFrac(vdot,0.64) },
    maratona:{ a:M-0.05, b:M+0.05 },
    limiar:{ a:T-0.05, b:T+0.05 },
    intervalado:{ a:I-0.04, b:I+0.04 },
    velocidade:{ a:R-0.05, b:R+0.03 },
    meia:{ a:rPrevisto(vdot,21.0975)/21.0975-0.04, b:rPrevisto(vdot,21.0975)/21.0975+0.04 },
    p10:{ a:rPrevisto(vdot,10)/10-0.04, b:rPrevisto(vdot,10)/10+0.04 },
    p5:{ a:rPrevisto(vdot,5)/5-0.04, b:rPrevisto(vdot,5)/5+0.04 }
  };
}
const RZ_INFO = {
  regenerativo:{nome:'Regenerativo', rpe:'2–3', txt:'Muito leve, para soltar. Mais devagar que o seu leve.'},
  leve:{nome:'Leve / longão', rpe:'3–4', txt:'Ritmo de conversa: frases inteiras sem perder o fôlego.'},
  maratona:{nome:'Ritmo de maratona', rpe:'5–6', txt:'Firme mas controlado; dá para falar frases curtas.'},
  limiar:{nome:'Limiar', rpe:'7', txt:'"Confortavelmente difícil": fala só palavras soltas.'},
  intervalado:{nome:'Intervalado', rpe:'8–9', txt:'Forte, sustentável por 3–5 min. Sem fala.'},
  velocidade:{nome:'Velocidade', rpe:'9', txt:'Rápido e solto, em tiros curtos, sem travar a passada.'}
};
function rFaixa(z){ return z ? `${mtPaceStr(z.a).replace('/km','')}–${mtPaceStr(z.b)}` : ''; }

// ---------- perfil real do aluno (só dados registrados) ----------
function rPerfil(ctx){
  const runs = rCorridas(ctx), ativ = rAtividades(ctx);
  const agora = ctx.agora, s0 = rSem(agora);
  const p = { temHist: runs.length >= 3, nCorridas: runs.length };
  const semanas = [];
  for(let i=1;i<=6;i++){ const a = s0 - i*7*DIA_MS, b = a + 7*DIA_MS;
    const rs = runs.filter(r=>r.at>=a && r.at<b);
    semanas.push({ a, n: rs.length, min: rs.reduce((t,r)=>t+(+r.duration||0),0), km: rs.reduce((t,r)=>t+(+r.distance||0),0) }); }
  p.semanas = semanas;
  const comDados = semanas.filter(w=>w.n>0);
  p.regular = semanas.filter(w=>w.n>=2).length;                     // semanas com 2+ corridas (de 6)
  const ult4 = semanas.slice(0,4);
  p.minSemana = ult4.filter(w=>w.n>0).length >= 2 ? ult4.reduce((t,w)=>t+w.min,0)/Math.max(1, ult4.filter(w=>w.n>0).length) : null;
  p.kmSemana = ult4.filter(w=>w.n>0).length >= 2 ? ult4.reduce((t,w)=>t+w.km,0)/Math.max(1, ult4.filter(w=>w.n>0).length) : null;
  const rec = runs.filter(r=>r.at >= agora - 56*DIA_MS);
  p.contMin = rec.filter(rContinua).reduce((m,r)=>Math.max(m, +r.duration||0), 0);
  p.maiorKm = rec.reduce((m,r)=>Math.max(m, +r.distance||0), 0);
  const leves = rec.filter(r=>['leve','continua','longao','regenerativo'].includes(r.tipoSessao) || (!r.tipoSessao && (+r.rpe||5)<=5));
  p.rpeLeve = leves.length >= 3 ? leves.slice(-6).reduce((t,r)=>t+(+r.rpe||5),0)/Math.min(6, leves.length) : null;
  const paces = leves.map(rPace).filter(Boolean).slice(-8).sort((a,b)=>a-b);
  p.paceLeve = paces.length >= 3 ? paces[Math.floor(paces.length/2)] : null;
  p.ultima = runs.length ? runs[runs.length-1] : null;
  p.ultimaAtiv = ativ.length ? ativ[ativ.length-1] : null;
  p.diasSemCorrer = p.ultima ? Math.round((mtDia0(agora) - mtDia0(p.ultima.at))/DIA_MS) : null;
  return p;
}

// ---------- pausa e retomada (só corrida; caminhada conta para quem está no nível Iniciante) ----------
function rPausa(ctx, nivel){
  const lista = nivel===0 ? rAtividades(ctx).filter(r=>r.activity!=='bike') : rCorridas(ctx);
  if(!lista.length) return null;
  const dias = [...new Set(lista.map(r=>mtDia0(r.at)))].sort((a,b)=>a-b);
  const hoje = mtDia0(ctx.agora), ult = dias[dias.length-1];
  const desde = Math.round((hoje-ult)/DIA_MS);
  if(desde >= 7) return { pausa:desde, voltou:false, ultimoAntes:ult, retorno:null };
  for(let i=dias.length-1;i>0;i--){
    if(hoje - dias[i] > 35*DIA_MS) break;
    const gap = Math.round((dias[i]-dias[i-1])/DIA_MS);
    if(gap >= 7) return { pausa:gap, voltou:true, ultimoAntes:dias[i-1], retorno:dias[i] };
  }
  return null;
}
function rRetomadaSemanas(pausa){ return pausa>=60 ? 4 : pausa>=28 ? 3 : pausa>=14 ? 2 : 1; }
const RET_FAT = [[0.7],[0.6,0.8],[0.5,0.65,0.8],[0.4,0.55,0.7,0.85]];

// ---------- referência de ritmo (nunca inventada) ----------
// confiança: alta = prova ou tempo informado recente · média = treino forte registrado · baixa = ritmo dos treinos leves
function rReferencia(ctx){
  const runs = rCorridas(ctx); const agora = ctx.agora; const setup = (ctx.run||{}).setup||{}; const aval = setup.aval||{};
  const cand = [];
  if(aval.marca && aval.marca.km && aval.marca.seg && (!aval.em || agora - aval.em < 120*DIA_MS)){
    const v = rVdot(aval.marca.km, aval.marca.seg/60); if(v) cand.push({ vdot:v, conf:'alta', fonte:`do seu tempo informado de ${rFmtSeg(aval.marca.seg)} nos ${String(aval.marca.km).replace('.',',').replace(',0975','').replace(',195','')} km`, at:aval.em||agora });
  }
  const st = ctx.stats || {};
  (st.provas||[]).concat(runs.filter(r=>r.isRace).map(r=>({at:r.at, km:+r.distance, min:+r.duration}))).forEach(pv=>{
    if(pv.km>=1.5 && pv.min>0 && agora - pv.at < 140*DIA_MS){ const v = rVdot(pv.km, pv.min); if(v) cand.push({ vdot:v, conf:'alta', fonte:`da sua prova de ${mtFmtKm(pv.km)} km em ${mtFmtData(pv.at)}`, at:pv.at }); }
  });
  runs.filter(r=>!r.isRace && +r.distance>=3 && (+r.rpe||0)>=8 && agora - r.at < 70*DIA_MS && (!r.tipoSessao || ['tempo','limiar','ritmo_prova','leve','continua','longao'].includes(r.tipoSessao))).forEach(r=>{
    const v = rVdot(+r.distance, +r.duration); if(v) cand.push({ vdot:v, conf:'media', fonte:`do seu treino forte de ${mtFmtKm(r.distance)} km em ${mtFmtData(r.at)}`, at:r.at });
  });
  let best = null;
  cand.forEach(c=>{ if(!best || (c.conf==='alta' && best.conf!=='alta') || (c.conf===best.conf && c.vdot>best.vdot) || (c.conf==='media' && best.conf==='alta' && c.vdot > best.vdot*1.03)) best = c; });
  if(!best){
    const p = rPerfil(ctx);
    if(p.paceLeve){ // ritmo leve observado ≈ 66% do VO2max (aproximação)
      const vel = 1000/p.paceLeve; const vo2 = -4.6 + 0.182258*vel + 0.000104*vel*vel; const v = vo2/0.66;
      if(v>20 && v<80) best = { vdot:v, conf:'baixa', fonte:'do ritmo das suas corridas leves recentes', at:agora };
    }
  }
  if(!best || !(best.vdot>20 && best.vdot<85)) return null;
  // depois de pausas longas o condicionamento cai — a referência acompanha
  const pz = rPausa(ctx, 2);
  let fator = 1;
  if(pz && pz.ultimoAntes >= best.at - DIA_MS){ fator = pz.pausa>=56 ? 0.88 : pz.pausa>=28 ? 0.93 : pz.pausa>=14 ? 0.97 : 1; }
  return Object.assign({}, best, { vdot: best.vdot*fator, reduzida: fator<1, zonas: rZonasDe(best.vdot*fator) });
}

// ---------- nível ----------
const RUN_CONT_AVAL = { '0':0, '5':3, '10':7, '20':15, '30':25, '60':45, '90':70 };
function rNivelPotencial(ctx, aval){
  aval = aval || (((ctx.run||{}).setup||{}).aval) || {};
  const p = rPerfil(ctx);
  const cont = Math.max(RUN_CONT_AVAL[String(aval.continuo||'0')]||0, p.contMin||0);
  if(cont < 10) return 0;
  if(cont < 30) return 1;
  const exp = aval.exp || 'pouco';
  const kmAval = +aval.kmSemana || 0;
  const minSem = (p.minSemana!=null && p.temHist) ? p.minSemana : (kmAval ? kmAval*6.2 : cont*2);
  const ref = rReferencia(ctx);
  const regularOk = !p.temHist || p.regular >= 3;
  let n = 2;
  if(minSem >= 150 && cont >= 40 && ['regular','experiente'].includes(exp)) n = 3;
  if(n===3 && minSem >= 210 && cont >= 60 && regularOk) n = 4;
  if(n===4 && minSem >= 300 && cont >= 70 && exp==='experiente' && ref && ref.conf!=='baixa' && ref.vdot >= 45) n = 5;
  if(p.rpeLeve != null && p.rpeLeve >= 7 && n > 2) n--;   // treino leve vindo pesado = recuperação ainda não acompanha
  return n;
}
function rEstagioInicial(ctx, aval){
  const c = RUN_CONT_AVAL[String(aval.continuo||'0')]||0;
  if(c >= 7) return 5; if(c >= 3) return 3;
  const pr = ctx.user && ctx.user.profile; let imc = null; try{ const r = calcIMC(); imc = r ? parseFloat(r.value) : null; }catch(e){}
  if(aval.exp==='nunca' && ((imc && imc>=32) || (pr && pr.age>=60) || (aval.lim||[]).length)) return 0;
  return 1;
}

// ---------- metas de volume (minutos de corrida por semana) ----------
const RUN_PICO = { // [nível 0..5]
  comecar:[75,110,150,180,210,240], condicionamento:[75,120,160,200,240,280],
  '5km':[75,110,150,190,240,300], '10km':[75,120,175,220,280,350],
  '21km':[75,120,190,260,330,420], '42km':[75,120,190,280,390,500] };
const RUN_LONGO_CAP = { comecar:[30,40,60,75,80,90], condicionamento:[30,45,65,80,90,100], '5km':[30,40,60,75,90,90],
  '10km':[30,50,75,90,100,110], '21km':[30,50,90,120,135,150], '42km':[30,50,90,150,180,195] };
// semanas mínimas para chegar bem em cada prova, por nível
const RUN_PRAZO = { '5km':[10,6,4,4,3,3], '10km':[18,12,8,6,5,5], '21km':[30,22,16,12,10,10], '42km':[45,36,26,20,16,14] };
// nível mínimo para tratar a prova como objetivo específico (abaixo disso, o plano prepara a base primeiro)
const RUN_NIVEL_MIN = { '5km':0, '10km':1, '21km':2, '42km':3, comecar:0, condicionamento:0 };

function rGoal(setup){ return RGOAL[(setup||{}).goal] ? setup.goal : '5km'; }
function rTempos(setup){ const a = (setup||{}).aval||{}; const t = +a.tempo || 45; const tl = +a.tempoLongo || 0; return { sessao:t, longo: Math.max(t, tl || Math.round(t*1.35)) }; }
function rDiasPerna(ctx){
  const L = ctx.lift && ctx.lift.plan; if(!L) return [];
  return (L.workouts||[]).filter(w=>/Pernas|Glúteos|Inferior|Full|Corpo inteiro|Lower|Panturrilha/i.test(((w.parts||[]).join(' '))+' '+(w.name||''))).map(w=>w.dayIdx);
}

// fase da semana (sem retomada — ela é tratada antes)
function rFase(ctx, motor, semTs){
  const setup = (ctx.run||{}).setup||{}; const goal = rGoal(setup); const nv = motor.nivel;
  // depois de uma prova: recuperação
  const provas = ((ctx.stats||{}).provas||[]).concat(rCorridas(ctx).filter(r=>r.isRace).map(r=>({at:r.at, km:+r.distance})));
  const ultProva = provas.sort((a,b)=>b.at-a.at)[0];
  if(ultProva){ const semProva = rSem(ultProva.at); const n = ultProva.km>=30 ? 3 : ultProva.km>=15 ? 2 : 1;
    const k = Math.round((semTs - semProva)/(7*DIA_MS)); if(k>=1 && k<=n) return { fase:'pos_prova', k, n }; }
  const semanaDoPlano = Math.max(1, Math.round((semTs - (motor.inicio||semTs))/(7*DIA_MS))+1);
  const rd = setup.raceDate ? new Date(setup.raceDate+'T12:00:00').getTime() : null;
  // Beta 33: a prova marcada já passou (o aluno pode ter registrado no dia seguinte, sem marcar como prova,
  // e a data só é limpa no próximo login): a semana seguinte é de recuperação, não de "polimento" com longão.
  if(rd && rSem(rd) < semTs){
    const kmP = (RGOAL[goal]||{}).km || 5; const nP = kmP>=30 ? 3 : kmP>=15 ? 2 : 1;
    const kP = Math.round((semTs - rSem(rd))/(7*DIA_MS)); if(kP>=1 && kP<=nP) return { fase:'pos_prova', k:kP, n:nP };
  }
  if(rd && rSem(rd) >= semTs){
    const W = Math.round((rSem(rd) - semTs)/(7*DIA_MS));      // 0 = semana da prova
    const km = (RGOAL[goal]||{}).km || 5;
    const tap = km>=40 ? 3 : km>=20 ? 2 : 1, esp = km>=40 ? 6 : km>=20 ? 5 : km>=10 ? 4 : 3;
    if(W < tap) return { fase:'taper', W, tap };
    if(nv >= 2 && W < tap+esp && nv >= (RUN_NIVEL_MIN[goal]||0)) return { fase:'especifica', W };
    if(nv >= 2 && W < tap+esp+4) return { fase:'desenvolvimento', W };
    if(nv <= 1 || semanaDoPlano <= 2) return { fase: nv===0 ? 'adaptacao' : 'base', W };
    return { fase:'base', W };
  }
  if(nv === 0) return { fase:'adaptacao' };
  if(nv === 1) return { fase: semanaDoPlano<=2 ? 'adaptacao' : 'base' };
  if(semanaDoPlano <= 2) return { fase:'adaptacao' };
  if(motor.nivelDesde && semTs - motor.nivelDesde < 4*7*DIA_MS && semTs > motor.inicio) return { fase:'base' };
  // sem prova: blocos de 4 semanas — 2 de resistência, 1 de velocidade/ritmo, e repete
  const bloco = Math.floor((semanaDoPlano-3)/4) % 3;
  return { fase: bloco===2 ? 'desenvolvimento' : 'base' };
}

// ---------- motor ----------
function rMotorNovo(ctx, setup, inicioTs){
  let aval = setup.aval;
  if(!aval){ // plano criado antes da Beta 14: parte do nível antigo e do histórico real
    aval = ({ iniciante:{exp:'pouco', continuo:'5'}, intermediario:{exp:'regular', continuo:'60', kmSemana:15}, avancado:{exp:'regular', continuo:'90', kmSemana:42} })[setup.level||'iniciante'] || {exp:'pouco', continuo:'5'};
  }
  const nv = rNivelPotencial(ctx, aval);
  const p = rPerfil(ctx);
  const tempos = rTempos(setup);
  const m = { v:1, nivel:nv, nivelDesde: rSem(inicioTs), inicio: rSem(inicioTs), q:0, ultimaVar:'intensidade', semanas:{}, hist:[], estagio:null, contMin:null, vol:null, retomada:null };
  if(nv === 0) m.estagio = rEstagioInicial(ctx, aval);
  const cont = Math.max(RUN_CONT_AVAL[String(aval.continuo||'0')]||0, p.contMin||0);
  if(nv === 1) m.contMin = _clamp(_r5(cont*0.9), 10, 30);
  // volume inicial: o que a pessoa já faz (histórico > resposta), sem passar do que cabe na agenda
  const dias = setup.days || 3;
  let vol;
  if(p.minSemana && p.temHist) vol = p.minSemana;
  else if(+aval.kmSemana) vol = (+aval.kmSemana) * 6.2;
  else vol = cont * Math.min(dias, 3) * 0.8;
  const pico = RUN_PICO[rGoal(setup)][nv];
  m.vol = Math.round(_clamp(vol, nv<=1 ? 60 : 90, Math.max(90, Math.min(pico, (dias-1)*(tempos.sessao-11) + (tempos.longo-12)))));
  // parado agora (resposta) sem histórico que mostre outra coisa → começa em retomada
  const parado = +aval.parado || 0;
  if(parado >= 7 && !(p.diasSemCorrer!=null && p.diasSemCorrer < 7)) m.retomadaDecl = { pausa: parado, desde: rSem(inicioTs) };
  return m;
}
function _rPush(motor, item){ motor.hist = (motor.hist||[]).concat([item]).slice(-26); }

// avaliação da semana que terminou → decide UMA mudança (ou nenhuma)
function rAvaliarSemana(ctx, motor, semTs){
  const info = (motor.semanas||{})[semTs] || null;
  const a = semTs, b = semTs + 7*DIA_MS;
  const nv = motor.nivel;
  const ativ = rAtividades(ctx).filter(r=>r.at>=a && r.at<b && (r.activity!=='bike') && (nv===0 || _ehCorrida(r)));
  const planejado = info ? info.planejado : 0;
  const diasFeitos = new Set(ativ.map(r=>mtDia0(r.at))).size;
  const cump = planejado ? Math.min(1, diasFeitos/planejado) : (diasFeitos ? 1 : 0);
  const rpes = ativ.map(r=>+r.rpe||null).filter(Boolean);
  const rpeMed = rpes.length ? rpes.reduce((x,y)=>x+y,0)/rpes.length : null;
  const naoConc = ativ.filter(r=>r.concluiu==='nao').length;
  const parcial = ativ.filter(r=>r.concluiu==='parcial').length;
  const levesPesados = ativ.filter(r=>['leve','continua','longao','regenerativo','camcorre','caminhada'].includes(r.tipoSessao) && (+r.rpe||0) >= 8).length;
  const bikeCam = rAtividades(ctx).filter(r=>r.at>=a && r.at<b && (r.activity==='bike' || (r.activity==='caminhada' && nv>0)));
  const minComp = bikeCam.reduce((t,r)=>t+(+r.duration||0),0);
  const rpeTxt = rpeMed ? String(Math.round(rpeMed*10)/10).replace('.',',') : '';
  const res = { sem:semTs, planejado, feitos:diasFeitos, cump:Math.round(cump*100), rpe: rpeMed ? Math.round(rpeMed*10)/10 : null, naoConc, parcial, minComp: Math.round(minComp), decisao:'manter', motivo:'', mudou:'' };
  if(info && info.fase==='retomada'){ res.decisao = 'retomada'; res.motivo = 'semana de retomada: o volume segue a volta gradual, sem avaliação de progresso'; return res; }
  if(!planejado && !diasFeitos){ res.motivo = 'semana sem treinos planejados'; return res; }
  const anterior = (motor.hist||[]).slice(-1)[0];
  if(naoConc >= 2 || levesPesados >= 2 || (rpeMed && rpeMed >= 8 && nv <= 2) || (naoConc && rpeMed && rpeMed >= 7.5)){
    res.decisao = 'recuar';
    res.motivo = naoConc ? `${naoConc} treino${naoConc>1?'s':''} não ${naoConc>1?'foram completados':'foi completado'}` : levesPesados ? 'treinos leves saíram com esforço alto (8+ de 10)' : `esforço médio de ${rpeTxt}/10, acima do esperado`;
  } else if(cump < 0.5){
    res.decisao = (anterior && anterior.cump < 50 && anterior.decisao!=='recuar') ? 'recuar' : 'manter';
    res.motivo = `${diasFeitos} de ${planejado} treinos feitos — ${res.decisao==='recuar'?'segunda semana assim: o plano fica um pouco mais leve para caber na sua rotina':'a semana se repete, sem compensar o que faltou'}`;
  } else if(cump >= 0.75 && (rpeMed==null || rpeMed <= (nv>=3 ? 7 : 6.5)) && !naoConc && parcial <= 1 && info && info.fase!=='recuperacao' && info.fase!=='taper' && info.fase!=='pos_prova'){
    res.decisao = 'avancar';
    res.motivo = `${diasFeitos} de ${planejado} treinos completos${rpeMed?` com esforço médio de ${rpeTxt}/10`:''}`;
  } else {
    res.motivo = info && ['recuperacao','taper','pos_prova'].includes(info.fase) ? ({recuperacao:'semana de recuperação planejada', taper:'semana de polimento', pos_prova:'recuperação depois da prova'})[info.fase] : `${diasFeitos} de ${planejado} treinos${rpeMed?`, esforço ${rpeTxt}/10`:''}${parcial?`, ${parcial} incompleto${parcial>1?'s':''}`:''}`;
  }
  // bike e caminhada contam como carga complementar (não como corrida): muito volume extra + esforço alto segura a progressão
  if(res.decisao==='avancar' && minComp > 0 && minComp >= (info && info.vol || 60) && rpeMed && rpeMed >= 6){ res.decisao = 'manter'; res.motivo += `; ${Math.round(minComp)} min de bike/caminhada na semana somaram carga`; }
  return res;
}
// aplica a decisão: muda uma variável por vez
function rAplicarDecisao(ctx, motor, res){
  const setup = (ctx.run||{}).setup||{}; const goal = rGoal(setup); const nv = motor.nivel;
  const tempos = rTempos(setup); const dias = setup.days || 3;
  const pico = Math.min(RUN_PICO[goal][nv], Math.max(60, (dias-1)*(tempos.sessao-11) + (tempos.longo-12)));
  const rs = rCorridas(ctx).filter(r=>r.at>=res.sem && r.at<res.sem+7*DIA_MS);
  if(res.decisao==='avancar'){
    if(nv === 0){
      const noEstagio = rAtividades(ctx).filter(r=>r.at>=res.sem && r.at<res.sem+7*DIA_MS && (r.tipoSessao==='camcorre' || r.tipoSessao==='caminhada') && (r.estagio===motor.estagio) && r.concluiu!=='nao' && r.concluiu!=='parcial' && (+r.rpe||5)<=7).length;
      if(noEstagio >= 2 && motor.estagio < RUN_EST.length-1){ motor.estagio++; res.mudou = `próximo estágio: ${rEstagioTxt(motor.estagio)}`; }
      else if(noEstagio >= 2 && motor.estagio === RUN_EST.length-1){ motor.nivel = 1; motor.nivelDesde = res.sem+7*DIA_MS; motor.contMin = 12; res.mudou = `você correu 10 min sem parar: agora é ${RN_NOME[1]}`; }
      else { res.decisao = 'manter'; res.motivo = `para avançar de estágio são 2 treinos completos com esforço até 7/10 no estágio atual (feitos: ${noEstagio})`; }
    } else if(nv === 1){
      const ok = rs.filter(r=>rContinua(r) && (+r.duration||0) >= (motor.contMin||10)*0.95 && r.concluiu!=='nao' && (+r.rpe||5)<=6).length;
      if(ok >= 2){
        if((motor.contMin||10) >= 30){ motor.nivel = 2; motor.nivelDesde = res.sem+7*DIA_MS; motor.vol = Math.max(motor.vol||0, 100); res.mudou = `30 min contínuos com folga: agora é ${RN_NOME[2]}`; }
        else { const de = motor.contMin; motor.contMin = Math.min(30, (motor.contMin||10) + ((motor.contMin||10) < 20 ? 3 : 5)); res.mudou = `corrida contínua: ${de} → ${motor.contMin} min`; }
      } else { res.decisao = 'manter'; res.motivo = `para aumentar, são 2 corridas de ${motor.contMin} min sem parar com esforço até 6/10 (feitas: ${ok})`; }
    } else {
      const podeIntens = !['adaptacao','base'].includes((motor.semanas[res.sem]||{}).fase) || nv >= 3;
      if(motor.ultimaVar==='volume' && podeIntens && motor.q < 5){ motor.q++; motor.ultimaVar = 'intensidade'; res.mudou = 'treinos de qualidade um pouco mais longos (volume semanal mantido)'; }
      else if(motor.vol < pico){ const de = motor.vol; motor.vol = Math.round(Math.min(pico, motor.vol*1.08 + 2)); motor.ultimaVar = 'volume'; res.mudou = `volume semanal ${de} → ${motor.vol} min (+${Math.round((motor.vol/de-1)*100)}%)`; }
      else if(motor.q < 5){ motor.q++; motor.ultimaVar = 'intensidade'; res.mudou = 'volume no limite do seu objetivo/agenda: evolução pela qualidade'; }
      else { res.decisao = 'manter'; res.motivo += ' — você está no pico planejado para o seu nível e agenda'; }
    }
  } else if(res.decisao==='recuar'){
    if(nv === 0){ if(motor.estagio > 1){ motor.estagio--; res.mudou = `volta para ${rEstagioTxt(motor.estagio)}`; } else res.mudou = 'repete o estágio, sem pressa'; }
    else if(nv === 1){ const de = motor.contMin; motor.contMin = Math.max(10, (motor.contMin||10) - 3); res.mudou = de!==motor.contMin ? `corrida contínua ${de} → ${motor.contMin} min` : 'repete a semana'; }
    else { const de = motor.vol; motor.vol = Math.round(Math.max(60, motor.vol*0.88)); if(motor.q>0) motor.q--; res.mudou = `volume ${de} → ${motor.vol} min e qualidade mais leve`; }
  }
  // promoção de nível (≥2): só com evolução comprovada — nunca por tempo de uso
  if(nv >= 2 && res.decisao!=='recuar'){
    const crit = rCriteriosNivel(ctx, motor);
    const rdP = setup.raceDate ? new Date(setup.raceDate+'T12:00:00').getTime() : null;
    const pertoDaProva = rdP && rdP > res.sem && rdP - res.sem < 5*7*DIA_MS;
    if(crit && crit.todos && !pertoDaProva && (res.sem - (motor.nivelDesde||0)) >= 3*7*DIA_MS){ motor.nivel++; motor.nivelDesde = res.sem+7*DIA_MS; motor.q = Math.max(0, motor.q-2); res.mudou = (res.mudou?res.mudou+'; ':'') + `nível ${RN_NOME[motor.nivel]}`; }
  }
  return res;
}
function rEstagioTxt(i){ const e = RUN_EST[i]; return !e ? '' : e.rep ? `${e.rep}× (${e.corre} min correndo + ${e.anda} min caminhando)` : `${e.cam} min de caminhada ativa`; }
// critérios para subir de nível (também usados pelo Meta Assistente para explicar "quando avançar")
function rCriteriosNivel(ctx, motor){
  const nv = motor.nivel; const p = rPerfil(ctx); const ref = rReferencia(ctx);
  const runs8 = rCorridas(ctx).filter(r=>r.at >= ctx.agora - 56*DIA_MS);
  const longo = runs8.filter(rContinua).reduce((m,r)=>Math.max(m,+r.duration||0),0);
  const cumpr = rCumprimento(ctx, motor, 4);
  const sem3 = p.semanas.slice(0,4).filter(w=>w.n>=3).length;
  const C = [];
  if(nv === 0){ C.push({ok: motor.estagio>=RUN_EST.length-1, txt:`chegar ao último estágio (${rEstagioTxt(RUN_EST.length-1)})`}); C.push({ok:false, txt:'completar 2 treinos desse estágio com esforço até 7/10'}); }
  else if(nv === 1){ C.push({ok:(motor.contMin||0)>=30, txt:`corrida contínua prescrita de 30 min (hoje: ${motor.contMin} min)`}); C.push({ok:p.contMin>=30, txt:`correr 30 min sem parar com esforço até 6/10 (seu maior: ${Math.round(p.contMin)} min)`}); C.push({ok:p.regular>=3, txt:`3 semanas com 2+ corridas (das últimas 6: ${p.regular})`}); }
  else if(nv === 2){ C.push({ok:(p.minSemana||0)>=150, txt:`média de 150 min/semana nas últimas 4 (hoje: ${Math.round(p.minSemana||0)})`}); C.push({ok:longo>=60, txt:`longão de 60 min (maior recente: ${Math.round(longo)} min)`}); C.push({ok:sem3>=3, txt:`3 semanas com 3+ corridas (últimas 4: ${sem3})`}); C.push({ok:cumpr==null||cumpr>=75, txt:`cumprir 75% do plano (últimas 4 semanas: ${cumpr==null?'—':cumpr+'%'})`}); }
  else if(nv === 3){ C.push({ok:(p.minSemana||0)>=210, txt:`média de 210 min/semana (hoje: ${Math.round(p.minSemana||0)})`}); C.push({ok:longo>=80, txt:`longão de 80 min (maior recente: ${Math.round(longo)} min)`}); C.push({ok:cumpr!=null&&cumpr>=80, txt:`cumprir 80% do plano (últimas 4 semanas: ${cumpr==null?'—':cumpr+'%'})`}); }
  else if(nv === 4){ C.push({ok:(p.minSemana||0)>=300, txt:`média de 300 min/semana (hoje: ${Math.round(p.minSemana||0)})`}); C.push({ok:longo>=95, txt:`longão de 95 min (maior recente: ${Math.round(longo)} min)`}); C.push({ok:!!(ref && ref.conf!=='baixa' && ref.vdot>=45), txt:'resultado de prova ou teste que mostre nível competitivo'}); C.push({ok:cumpr!=null&&cumpr>=85, txt:`cumprir 85% do plano (hoje: ${cumpr==null?'—':cumpr+'%'})`}); const g = rGoal((ctx.run||{}).setup); C.push({ok:!!RGOAL[g].km, txt:'ter uma prova (5 a 42 km) como objetivo'}); }
  else return { todos:false, lista:[], topo:true };
  if(nv === 0) C[1].ok = C[0].ok && rAtividades(ctx).filter(r=>r.tipoSessao==='camcorre' && r.estagio===RUN_EST.length-1 && r.concluiu!=='nao' && r.concluiu!=='parcial' && (+r.rpe||5)<=7).length >= 2;
  return { todos: C.every(c=>c.ok), lista:C };
}
function rCumprimento(ctx, motor, n){
  const hs = (motor.hist||[]).filter(h=>h.planejado>0 && h.decisao!=='retomada').slice(-n);
  if(!hs.length) return null;
  const pl = hs.reduce((t,h)=>t+h.planejado,0), fe = hs.reduce((t,h)=>t+Math.min(h.feitos,h.planejado),0);
  return pl ? Math.round(fe/pl*100) : null;
}

// ---------- biblioteca de sessões ----------
const RT = {
  caminhada:{nome:'Caminhada ativa', int:'Leve', zona:null, obj:'criar o hábito e preparar articulações para o impacto da corrida'},
  camcorre:{nome:'Caminhada + corrida', int:'Leve', zona:null, obj:'ensinar o corpo a correr aos poucos, com pausas planejadas'},
  regenerativo:{nome:'Regenerativo', int:'Muito leve', zona:'regenerativo', obj:'soltar a musculatura e acelerar a recuperação'},
  continua:{nome:'Corrida contínua', int:'Leve', zona:'leve', obj:'aumentar o tempo que você corre sem parar'},
  leve:{nome:'Corrida leve', int:'Leve', zona:'leve', obj:'base aeróbica: o coração e as pernas ficam mais eficientes'},
  longao:{nome:'Longão', int:'Leve', zona:'leve', obj:'resistência: aguentar mais tempo correndo'},
  fartlek:{nome:'Fartlek', int:'Moderado', zona:null, q:true, obj:'primeiro contato com ritmo mais forte, de forma solta'},
  subida:{nome:'Treino de subida', int:'Forte', zona:null, q:true, obj:'força nas pernas e potência, com menos impacto que tiros no plano'},
  tempo:{nome:'Treino de ritmo (tempo run)', int:'Moderado a forte', zona:'limiar', q:true, obj:'sustentar um ritmo firme por mais tempo'},
  limiar:{nome:'Treino de limiar', int:'Forte', zona:'limiar', q:true, obj:'subir o limiar: o ritmo que você aguenta sem "estourar"'},
  tiros_longos:{nome:'Tiros longos', int:'Forte', zona:'intervalado', q:true, obj:'capacidade aeróbica máxima (VO2máx)'},
  tiros_curtos:{nome:'Tiros curtos', int:'Muito forte', zona:'intervalado', q:true, obj:'velocidade sustentada e economia de corrida'},
  velocidade:{nome:'Treino de velocidade', int:'Muito forte', zona:'velocidade', q:true, obj:'técnica e velocidade, com passada solta'},
  ritmo_prova:{nome:'Ritmo de prova', int:'Moderado a forte', zona:null, q:true, obj:'acostumar o corpo ao ritmo exato da prova'},
  prova:{nome:'Dia da prova', int:'Prova', zona:null, obj:'aplicar tudo o que você treinou'}
};
const RT_NIVEL_MIN = { caminhada:0, camcorre:0, regenerativo:1, continua:1, leve:1, longao:1, fartlek:2, subida:2, tempo:2, limiar:3, tiros_longos:3, velocidade:3, tiros_curtos:4, ritmo_prova:2, prova:0 };
const RT_IMPACTO = ['subida','velocidade','tiros_curtos'];
function _alvo(Z, k, fallback){
  if(Z && Z[k]) return `${rFaixa(Z[k])} · esforço ${RZ_INFO[k].rpe}/10`;
  const i = RZ_INFO[k]; return fallback || (i ? `esforço ${i.rpe}/10 — ${i.txt.toLowerCase()}` : '');
}
function _ritmoProva(Z, goal){ if(!Z) return null; return goal==='42km' ? Z.maratona : goal==='21km' ? Z.meia : goal==='10km' ? Z.p10 : Z.p5; }
function rSessao(tipo, o){
  // o: {min, nv, q, terreno, Z, est, goal, lim, strides, contMin, raceKm}
  const T = RT[tipo]; const Z = o.Z; const q = _clamp(o.q||0, 0, 5); const ter = o.terreno || 'asfalto';
  const pista = ter==='pista', esteira = ter==='esteira', trilha = ter==='trilha';
  let warm, main = [], cool, alvo = '', orient = [], kmMain = null;
  const warmLeve = n => ({name:'Aquecimento', exs:[{name:'Caminhada rápida', desc:'Comece andando e aumente o passo aos poucos.', min:n||5}, {name:'Mobilidade', desc:'10 círculos de tornozelo, 10 elevações de joelho e 10 balanços de perna para cada lado.', min:2}]});
  const warmQual = ()=>({name:'Aquecimento', exs:[{name:'Trote leve', desc:'Bem devagar no começo, soltando aos poucos.', min:o.nv>=4?15:10}, {name:'Educativos e acelerações', desc:'Skipping baixo, anfersen e dribling (20 m cada) e 4 acelerações progressivas de 20 s, voltando caminhando.', min:5}]});
  const coolLeve = ()=>({name:'Desaquecimento', exs:[{name:'Caminhada', desc:'Desacelere andando até a respiração normalizar.', min:5}]});
  const coolQual = ()=>({name:'Desaquecimento', exs:[{name:'Trote bem leve', desc:'Deixe o coração baixar aos poucos.', min:8}, {name:'Alongamento leve', desc:'Panturrilha, posterior de coxa, quadríceps e quadril: 30 s de cada lado, sem forçar.', min:4}]});
  const repTxt = (n, x)=>`${n}× ${x}`;
  if(tipo==='caminhada'){
    const m = Math.round(o.min||25);
    warm = {name:'Aquecimento', exs:[{name:'Caminhada leve', desc:'Ritmo natural, soltando o corpo.', min:5}]};
    main = [{name:`${m} min de caminhada em ritmo firme`, desc:'Passo rápido, braços acompanhando. Dá para conversar, mas a respiração fica mais acelerada.', min:m}];
    cool = {name:'Desaquecimento', exs:[{name:'Caminhada leve + alongamento', desc:'Diminua o passo e alongue panturrilha e coxas por 30 s.', min:4}]};
    alvo = 'caminhada firme · esforço 3–4/10';
    orient = ['O objetivo é constância: complete o tempo sem pressa.', 'Tênis confortável e superfície regular ajudam muito no começo.'];
  } else if(tipo==='camcorre'){
    const e = RUN_EST[_clamp(o.est||1,1,RUN_EST.length-1)];
    const curto = o.maxTotal && (e.rep*(e.corre+e.anda) + 12) > o.maxTotal;
    warm = curto ? {name:'Aquecimento', exs:[{name:'Caminhada rápida + mobilidade', desc:'Ande aumentando o passo e solte tornozelos e quadris.', min:3}]} : warmLeve(5);
    main = [{name:repTxt(e.rep, `(${e.corre} min correndo leve + ${e.anda} min caminhando)`), desc:`Corra devagar — tão devagar que daria para conversar. Se faltar ar, diminua a velocidade antes de parar. A caminhada faz parte do treino: mantenha o passo firme.`, min:e.rep*(e.corre+e.anda)}];
    cool = curto ? {name:'Desaquecimento', exs:[{name:'Caminhada', desc:'Desacelere andando.', min:3}]} : coolLeve();
    alvo = 'corrida em ritmo de conversa · esforço até 6/10';
    orient = ['Se não conseguir completar um bloco, caminhe e retome no próximo — registre como "quase todo".', 'Avança de estágio só depois de 2 treinos completos com esforço até 7/10.'];
  } else if(tipo==='regenerativo'){
    const m = Math.round(o.min||20);
    warm = {name:'Aquecimento', exs:[{name:'Caminhada', desc:'Solte o corpo andando.', min:3}]};
    main = [{name:`${m} min de trote muito leve`, desc:'Mais devagar que o seu leve. Serve para soltar, não para treinar — se estiver cansado, pode ser caminhada.', min:m}];
    cool = coolLeve(); alvo = _alvo(Z,'regenerativo');
    orient = ['Se terminar mais cansado do que começou, foi rápido demais.'];
    kmMain = Z ? m/((Z.regenerativo.a+Z.regenerativo.b)/2) : null;
  } else if(tipo==='continua' || tipo==='leve' || tipo==='longao'){
    const m = Math.round(o.min||30);
    warm = warmLeve(tipo==='longao'?5:4);
    const dica = trilha ? 'Na trilha vá por esforço, não por ritmo; atenção a raízes e pedras.' : esteira ? 'Na esteira use 1% de inclinação para simular a rua.' : pista ? 'Na pista, troque o sentido a cada 15 min.' : 'Escolha um percurso plano e seguro.';
    if(tipo==='longao' && o.mp){
      const mpMin = Math.min(Math.round(m*0.45), [15,20,25,30,35,40][q]);
      const zp = _ritmoProva(Z, o.goal);
      main = [{name:`${m-mpMin} min de corrida leve`, desc:`Comece mais devagar do que parece necessário. ${dica}`, min:m-mpMin},
        {name:`${mpMin} min no ritmo da prova`, desc:`Termine o longão no ritmo planejado para a prova${zp?` (${rFaixa(zp)})`:''}, sem acelerar além dele.`, min:mpMin}];
      alvo = _alvo(Z,'leve') + (zp ? ` · final: ${rFaixa(zp)}` : '');
    } else {
      main = [{name: tipo==='continua' ? `${m} min correndo sem parar` : `${m} min de corrida ${tipo==='longao'?'leve contínua':'leve'}`, desc:`Ritmo de conversa: você fala frases inteiras sem perder o fôlego. ${dica}`, min:m}];
      alvo = _alvo(Z,'leve','esforço 3–4/10 — ritmo de conversa');
    }
    if(o.strides) main.push({name:'4–6 acelerações de 20 s', desc:'No fim, acelere até uns 85% da velocidade, solto e sem tensionar; volte caminhando 40 s entre elas.', min:4});
    cool = coolLeve();
    kmMain = Z ? m/((Z.leve.a+Z.leve.b)/2) : null;
    orient = tipo==='longao'
      ? ['Hidrate-se a cada 20–25 min em treinos acima de 1 hora.', 'O longão é sobre tempo em movimento, não velocidade.']
      : tipo==='continua' ? ['Se precisar caminhar, tudo bem — registre "precisei caminhar" para o plano ajustar.'] : ['A maior parte da evolução vem de treinos leves feitos com regularidade.'];
  } else if(tipo==='fartlek'){
    const n = [5,6,7,8,9,10][q]; const forte = o.nv>=3 ? 2 : 1;
    warm = warmQual(); cool = coolQual();
    main = [{name:repTxt(n, `(${forte} min forte + 2 min leve)`), desc:'O "forte" é esforço 7/10 — firme, mas controlado. O leve é trote de recuperação, sem parar.', min:n*(forte+2)}];
    alvo = 'forte: esforço 7/10 · leve: 3/10';
    orient = ['Não precisa de ritmo exato: vá pela sensação.'];
  } else if(tipo==='subida'){
    const n = [5,6,7,8,9,10][q];
    warm = warmQual(); cool = coolQual();
    main = [{name:repTxt(n, esteira ? '45 s com 5–6% de inclinação, forte' : '45 s subindo forte'), desc: esteira ? 'Suba a inclinação e mantenha a velocidade; entre os tiros, volte para 1% e trote 90 s.' : 'Ladeira moderada (não íngreme). Suba com passada curta e braços ativos; volte descendo trotando devagar.', min:Math.round(n*2.2)}];
    alvo = 'subidas: esforço 8/10 · descida: trote leve';
    orient = ['Descer devagar protege joelhos e canelas.'];
  } else if(tipo==='tempo'){
    warm = warmQual(); cool = coolQual();
    if(o.nv <= 2){ const opts = [[2,6],[2,8],[3,7],[2,10],[1,15],[1,18]][q];
      main = [{name: opts[0]>1 ? repTxt(opts[0], `${opts[1]} min em ritmo firme (2 min trote entre)`) : `${opts[1]} min contínuos em ritmo firme`, desc:'Ritmo "confortavelmente difícil": você fala só palavras soltas. Não é tiro.', min:opts[0]*opts[1] + (opts[0]-1)*2}];
    } else { const m = [15,18,20,22,25,30][q]; main = [{name:`${m} min contínuos em ritmo de limiar`, desc:'Ritmo constante do início ao fim. Se o fim ficar muito difícil, você começou rápido demais.', min:m}]; }
    alvo = _alvo(Z,'limiar'); kmMain = Z ? main[0].min/((Z.limiar.a+Z.limiar.b)/2) : null;
    orient = trilha ? ['Na trilha, mantenha o ESFORÇO constante — o ritmo varia com o terreno.'] : ['Use um percurso plano ou a esteira para manter o ritmo estável.'];
  } else if(tipo==='limiar'){
    const [n, m] = [[3,6],[4,6],[3,8],[4,8],[5,8],[4,10]][q];
    warm = warmQual(); cool = coolQual();
    main = [{name:repTxt(n, `${m} min em ritmo de limiar (1 min de trote entre)`), desc:'Todos os blocos no mesmo ritmo. Recuperação curta de propósito.', min:n*m + (n-1)}];
    alvo = _alvo(Z,'limiar'); kmMain = Z ? n*m/((Z.limiar.a+Z.limiar.b)/2) : null;
    orient = ['Se o último bloco sair muito mais lento, reduza um bloco na próxima vez.'];
  } else if(tipo==='tiros_longos'){
    warm = warmQual(); cool = coolQual();
    if(pista && Z){ const [n, mt] = [[4,1000],[5,1000],[4,1200],[6,1000],[5,1200],[4,1600]][q]; const p = (Z.intervalado.a+Z.intervalado.b)/2; const tt = mt/1000*p;
      main = [{name:repTxt(n, `${mt} m (recuperação: ${rFmtMin(tt*0.8)} trotando)`), desc:`Cada tiro em ${rFmtMin(mt/1000*Z.intervalado.a)}–${rFmtMin(mt/1000*Z.intervalado.b)}.`, min:Math.round(n*tt*1.8)}]; kmMain = n*mt/1000;
    } else { const [n, m] = [[4,3],[5,3],[4,4],[6,3],[5,4],[4,5]][q];
      main = [{name:repTxt(n, `${m} min forte (${m} min de trote entre)`), desc: trilha ? 'Por esforço (8/10): o terreno muda muito o ritmo.' : 'Escolha um trecho plano e sem cruzamentos.', min:n*m*2}]; kmMain = Z ? n*m/((Z.intervalado.a+Z.intervalado.b)/2) : null; }
    alvo = _alvo(Z,'intervalado');
    orient = ['Os tiros têm que sair parecidos: o último não pode ser bem mais lento que o primeiro.'];
  } else if(tipo==='tiros_curtos'){
    warm = warmQual(); cool = coolQual();
    if(pista && Z){ const [n, mt] = [[8,400],[10,400],[12,400],[8,500],[10,500],[12,500]][q]; const p = (Z.intervalado.a*0.97);
      main = [{name:repTxt(n, `${mt} m (90 s trotando entre)`), desc:`Cada tiro em ~${rFmtMin(mt/1000*p)}.`, min:Math.round(n*(mt/1000*p + 1.5))}]; kmMain = n*mt/1000;
    } else { const n = [8,10,12,8,10,12][q], s = q>=3 ? 120 : 90;
      main = [{name:repTxt(n, `${s===120?'2 min':'1 min 30 s'} rápido (1 min 30 s de trote entre)`), desc:'Rápido e controlado (esforço 8–9/10). Pare a série se a técnica desmontar.', min:Math.round(n*(s/60+1.5))}]; kmMain = null; }
    alvo = _alvo(Z,'intervalado');
    orient = ['Tiro curto exige aquecimento completo — não pule.'];
  } else if(tipo==='velocidade'){
    warm = warmQual(); cool = coolQual();
    if(pista && Z){ const [n, mt] = [[6,200],[8,200],[10,200],[6,300],[8,300],[10,300]][q];
      main = [{name:repTxt(n, `${mt} m rápidos (${mt} m caminhando/trotando entre)`), desc:`Cada um em ~${rFmtMin(mt/1000*Z.velocidade.a)}. Passada solta, sem travar.`, min:Math.round(n*(mt/1000*Z.velocidade.a + 1.6))}]; kmMain = n*mt*2/1000;
    } else { const n = [6,8,10,6,8,10][q], s = q>=3 ? 45 : 30;
      main = [{name:repTxt(n, `${s} s rápidos (recuperação completa caminhando)`), desc:'Rápido, mas relaxado: ombros soltos, passada leve.', min:Math.round(n*(s/60+1.5))}]; }
    alvo = _alvo(Z,'velocidade');
    orient = ['Recuperação completa entre os tiros: a qualidade importa mais que o cansaço.'];
  } else if(tipo==='ritmo_prova'){
    warm = warmQual(); cool = coolQual(); const zp = _ritmoProva(Z, o.goal);
    if(o.taper){ main = [{name:'4× 2 min no ritmo da prova (2 min de trote entre)', desc:'Só para lembrar o corpo do ritmo. Termine com sensação de "podia mais".', min:14}]; }
    else if(o.goal==='21km' || o.goal==='42km'){ const [n, m] = [[2,10],[3,10],[2,15],[3,12],[2,20],[3,15]][q];
      main = [{name:repTxt(n, `${m} min no ritmo da prova (3 min de trote entre)`), desc:'Ritmo constante, o mesmo que você pretende sustentar na prova.', min:n*m + (n-1)*3}];
    } else if(o.nv <= 2){ const n = [4,5,6,6,7,8][q];
      main = [{name:repTxt(n, '2 min no ritmo que você quer na prova (2 min leve entre)'), desc:'Use para descobrir e treinar o seu ritmo de prova.', min:n*4}];
    } else { const [n, km] = [[3,1],[4,1],[3,2],[5,1],[4,2],[3,3]][q];
      main = [{name:repTxt(n, `${km} km no ritmo da prova (90 s de trote entre)`), desc:'Cada bloco no ritmo-alvo, sem acelerar no fim.', min:Math.round(n*km*(zp?(zp.a+zp.b)/2:6) + (n-1)*1.5)}]; kmMain = n*km; }
    alvo = zp ? `${rFaixa(zp)} (ritmo de prova estimado)` : 'ritmo que você pretende manter na prova';
    orient = zp ? ['O ritmo de prova é uma estimativa a partir dos seus dados — ajuste pela sensação.'] : ['Sem dados suficientes para um ritmo exato: vá pelo esforço que conseguiria sustentar na prova.'];
  } else if(tipo==='prova'){
    const km = o.raceKm || 5; const zp = _ritmoProva(Z, o.goal);
    warm = {name:'Aquecimento', exs:[{name:'Trote leve + 3 acelerações curtas', desc:'10–15 min antes da largada.', min:12}]};
    main = [{name:`Prova: ${mtFmtKm(km)} km`, desc: zp ? `Largue no ritmo-alvo (${rFaixa(zp)}), não mais rápido. Se sobrar energia, acelere na segunda metade.` : 'Largue mais devagar do que parece necessário; acelere só se sobrar energia na segunda metade.', min: Math.round(zp ? km*(zp.a+zp.b)/2 : km*6.5)}];
    cool = {name:'Depois da prova', exs:[{name:'Caminhada + hidratação', desc:'Caminhe 10 min, hidrate-se e coma algo em até 1 hora.', min:10}]};
    alvo = zp ? `${rFaixa(zp)} (estimativa)` : 'pelo esforço';
    orient = ['Nada de novo no dia da prova: tênis, roupa e café da manhã já testados.', 'Intercalar caminhada não é fracasso — é estratégia.'];
  }
  if(o.lim && (tipo!=='caminhada')) orient.push('Com a limitação que você informou: se a dor aparecer e mudar sua passada, pare e caminhe. Dor que persiste precisa de avaliação profissional.');
  const blocks = [warm, {name:'Principal', exs:main}, cool];
  const duration = blocks.reduce((s,b)=>s+b.exs.reduce((x,e)=>x+(e.min||0),0),0);
  let km = null;
  if(kmMain != null && Z){ const kmAq = (warm.exs.reduce((s,e)=>s+(/Trote/.test(e.name)?e.min:0),0) + cool.exs.reduce((s,e)=>s+(/Trote/.test(e.name)?e.min:0),0)) / ((Z.leve.a+Z.leve.b)/2); km = kmMain + kmAq; }
  return { tipo, blocks, duration, km, int:T.int, objetivo:T.obj, alvo, orient };
}

// ---------- semana ----------
function rSemanaFase(ctx, M, semTs){
  if(M.retomada && !M.retomada.cancelada){
    const k = Math.round((semTs - M.retomada.inicio)/(7*DIA_MS));
    if(k >= 0 && k < M.retomada.N) return { fase:'retomada', k:k+1, N:M.retomada.N, fator:RET_FAT[M.retomada.N-1][k], pausa:M.retomada.pausa };
  }
  const f = rFase(ctx, M, semTs);
  const semanaDoPlano = Math.max(1, Math.round((semTs - (M.inicio||semTs))/(7*DIA_MS))+1);
  if(M.nivel >= 2 && ['base','desenvolvimento','especifica'].includes(f.fase) && semanaDoPlano >= 4 && semanaDoPlano % 4 === 0 && !(f.W!=null && f.W <= 3)) return Object.assign({}, f, { fase:'recuperacao', faseBase:f.fase });
  return f;
}
function rComposicao(ctx, M, F, n, opts){
  const setup = (ctx.run||{}).setup||{}; const goal = rGoal(setup); const nv = M.nivel;
  const lim = ((setup.aval||{}).lim||[]).length > 0;
  const ter = setup.terrain || 'asfalto';
  const hib = !!(ctx.lift && ctx.lift.plan && (ctx.lift.plan.workouts||[]).length >= 3);
  if(nv === 0){
    const base = M.estagio === 0 ? 'caminhada' : 'camcorre';
    return Array.from({length:n}, (_,i)=> i < 3 ? base : 'caminhada');
  }
  if(nv === 1){
    const L = [];
    const semLongo = ['retomada','pos_prova'].includes(F.fase);
    if(n === 1) return ['continua'];
    L.push(semLongo ? 'continua' : 'longao');
    for(let i=1;i<n;i++) L.push(i <= 2 ? 'continua' : (i===3 ? 'regenerativo' : 'caminhada'));
    return L;
  }
  // nível 2+
  let Q = 0;
  const fase = F.fase;
  if(fase==='adaptacao' || fase==='retomada' || fase==='pos_prova') Q = 0;
  else if(fase==='taper') Q = (F.W===0 ? 0 : 1);
  else if(fase==='recuperacao') Q = nv >= 4 ? 1 : 0;
  else if(fase==='base') Q = nv >= 4 && n >= 5 ? 2 : 1;
  else Q = nv === 2 ? 1 : (nv === 3 ? (n >= 4 ? 2 : 1) : 2);
  if(n <= 2) Q = Math.min(Q, nv >= 3 ? 1 : 0);
  if(n === 3 && nv <= 3) Q = Math.min(Q, 1);
  if(hib && nv <= 3) Q = Math.min(Q, 1);
  if(lim) Q = Math.min(Q, 1);
  if(opts && opts.fadiga) Q = 0;
  // tipos de qualidade por fase / nível / objetivo (o rodízio semanal evita repetir sempre o mesmo)
  const listas = {
    base: nv===2 ? ['fartlek','subida'] : nv===3 ? ['subida','fartlek','tempo'] : ['subida','tempo','fartlek'],
    desenvolvimento: nv===2 ? ['fartlek','tempo','subida'] : nv===3 ? ['limiar','tiros_longos','tempo','velocidade'] : ['limiar','tiros_longos','tiros_curtos','tempo','velocidade'],
    especifica: nv===2 ? ['ritmo_prova','fartlek','tempo'] : ({ '5km':['tiros_curtos','tiros_longos','tempo','ritmo_prova'], '10km':['tiros_longos','limiar','ritmo_prova','tempo'], '21km':['limiar','ritmo_prova','tempo','tiros_longos'], '42km':['limiar','ritmo_prova','tempo'] })[goal] || ['limiar','tiros_longos','tempo'],
    taper:['ritmo_prova'], recuperacao:['fartlek']
  };
  let lista = (listas[fase] || listas.base).filter(t=>RT_NIVEL_MIN[t] <= nv && !(lim && RT_IMPACTO.includes(t)) && !(t==='subida' && ter==='pista'));
  if(!lista.length) lista = ['fartlek'];
  const rot = Math.round((M.semanaRef||0)/(7*DIA_MS)) % lista.length;
  lista = lista.slice(rot).concat(lista.slice(0, rot));
  const quals = []; for(let i=0;i<Q && i<lista.length;i++) quals.push(lista[i]);
  const L = [];
  if(n >= 2 || nv >= 3) L.push(fase==='taper' && F.W===0 ? 'leve' : 'longao');
  quals.forEach(t=>L.push(t));
  while(L.length < n) L.push(n >= 5 && nv <= 4 && !L.includes('regenerativo') && L.length === n-1 ? 'regenerativo' : 'leve');
  return L.slice(0, n);
}
function rAtribuirDias(tipos, dias, pernas, nota){
  // dias ordenados; pernas = dias com treino de pernas na musculação
  const livres = dias.slice();
  const out = {};
  const pen = d => (pernas.includes(d-1) || (d===1 && pernas.includes(7)) ? 3 : 0) + (pernas.includes(d) ? 2 : 0);
  const pega = (tipo, score)=>{ let best = null, bs = -1e9; livres.forEach(d=>{ const s = score(d); if(s > bs){ bs = s; best = d; } }); if(best==null) return null; livres.splice(livres.indexOf(best),1); out[best] = tipo; return best; };
  const iLongo = tipos.indexOf('longao');
  let dLongo = null;
  if(iLongo >= 0) dLongo = pega('longao', d=> (d>=6?3:0) + (d===dias[dias.length-1]?1:0) - pen(d)*1.5);
  const ocupados = ()=>Object.keys(out).map(Number);
  tipos.forEach((t,i)=>{ if(i===iLongo || !RT[t].q) return;
    pega(t, d=>{ const dist = Math.min(...ocupados().map(o=>Math.min(Math.abs(o-d), 7-Math.abs(o-d))), 7); return dist*2 - pen(d)*2 - (dist<=1?4:0); }); });
  tipos.forEach((t,i)=>{ if(i===iLongo || RT[t].q) return;
    if(t==='regenerativo' && dLongo){ const prox = dLongo===7 ? 1 : dLongo+1; if(livres.includes(prox)){ livres.splice(livres.indexOf(prox),1); out[prox] = t; return; } }
    pega(t, d=>-Math.abs(d-4)*0.1); });
  // Beta 34: dois treinos fortes em dias seguidos (qualidade colada no longão ou em outra qualidade, o que
  // acontece quando o aluno só tem dias seguidos): o segundo vira corrida leve, com aviso
  const forte = t => t==='longao' || (RT[t] && RT[t].q);
  Object.keys(out).map(Number).sort((a,b)=>a-b).forEach(d=>{
    const t = out[d]; if(!(RT[t] && RT[t].q)) return;
    const viz = [d-1, d+1].filter(x=>out[x] && forte(out[x]));
    if(viz.length){ nota[d] = `${RT[t].nome} virou corrida leve: com ${out[viz[0]]==='longao'?'o longão':'outro treino forte'} no dia ${viz[0]<d?'anterior':'seguinte'}, dois esforços seguidos aumentam o risco de lesão.`; out[d] = 'leve'; }
  });
  // conflito inevitável com pernas: troca a qualidade de impacto por leve e avisa
  Object.keys(out).forEach(k=>{ const d = +k; const t = out[d];
    if(RT[t].q && pen(d) >= 3){ nota[d] = `Ontem tem treino de pernas na musculação: ${RT[t].nome.toLowerCase()} virou corrida leve para não somar cansaço nas pernas.`; out[d] = 'leve'; }
    else if(RT[t].q && pen(d) >= 2){ nota[d] = 'Hoje também tem pernas na musculação: faça a corrida antes ou com pelo menos 6 horas de intervalo.'; }
    else if(t==='longao' && pen(d) >= 3){ nota[d] = 'Ontem foi dia de pernas: comece o longão bem leve e encurte se as pernas estiverem pesadas.'; } });
  return out;
}
function rMontarSemana(ctx, M, semTs, opts){
  opts = opts || {};
  const setup = (ctx.run||{}).setup||{}; const goal = rGoal(setup); const nv = M.nivel;
  const ref = rReferencia(ctx); const Z = (nv >= 2 && ref) ? ref.zonas : null;   // iniciantes treinam por esforço e tempo
  const tempos = rTempos(setup);
  const F = rSemanaFase(ctx, M, semTs);
  let dias = (setup.selectedDays && setup.selectedDays.length) ? setup.selectedDays.slice() : ({2:[3,6],3:[2,4,6],4:[1,3,5,7],5:[1,2,4,5,7],6:[1,2,3,4,5,6]}[setup.days] || [2,4,6]);
  // Beta 34: na semana com menos tempo, nenhum treino fica mais longo que o mesmo tipo de treino na semana normal
  // (os dias que sobram não compensam os que saíram)
  let tetoTipo = null;
  if(M.especial && M.especial.sem === semTs && (M.especial.dias||[]).length){
    dias = M.especial.dias.slice();
    try{ const S0 = rMontarSemana(ctx, Object.assign({}, M, { especial:null }), semTs, opts); tetoTipo = {};
      S0.workouts.forEach(w=>{ const t = w.motor && w.motor.tipo; const mn = (w.blocks && w.blocks[1]) ? w.blocks[1].exs.reduce((x,e)=>x+(e.min||0),0) : 0; if(t){ tetoTipo[t] = Math.max(tetoTipo[t]||0, mn); tetoTipo['dur_'+t] = Math.max(tetoTipo['dur_'+t]||0, +w.duration||0); } }); }catch(e){ tetoTipo = null; }
  }
  const teto = (t, v)=> (tetoTipo && tetoTipo[t]) ? Math.min(v, tetoTipo[t]) : v;
  dias.sort((a,b)=>a-b);
  // semana da prova
  const rd = setup.raceDate ? new Date(setup.raceDate+'T12:00:00') : null;
  let diaProva = null;
  if(rd && rSem(rd.getTime()) === semTs){ diaProva = rd.getDay()===0 ? 7 : rd.getDay(); dias = dias.filter(d=>d < diaProva-1 || d===diaProva); if(!dias.includes(diaProva)) dias.push(diaProva); dias.sort((a,b)=>a-b); }
  const diasTreino = diaProva ? dias.filter(d=>d!==diaProva) : dias;
  const tipos = rComposicao(ctx, M, F, diasTreino.length, opts);
  const nota = {};
  const mapa = rAtribuirDias(tipos, diasTreino, rDiasPerna(ctx), nota);
  if(diaProva) mapa[diaProva] = 'prova';
  // volume da semana
  let V = M.vol || 90;
  // o volume nunca passa do que cabe na agenda (tempo por treino × dias)
  const capAgenda = Object.keys(mapa).reduce((t,k)=>{ const ty = mapa[k]; return t + (ty==='longao' ? Math.min(RUN_LONGO_CAP[goal][nv], tempos.longo-12) : ty==='regenerativo' ? 40 : RT[ty].q ? 30 : ty==='prova' ? 0 : tempos.sessao-11); }, 0);
  V = Math.min(V, Math.max(60, capAgenda));
  // semanas mais leves partem do volume REAL planejado nas últimas semanas normais (não da meta teórica)
  const normais = Object.keys(M.semanas||{}).map(Number).filter(k=>k < semTs && k >= semTs - 6*7*DIA_MS && ['base','desenvolvimento','especifica'].includes((M.semanas[k]||{}).fase)).map(k=>M.semanas[k].vol||0).filter(v=>v>0);
  if(normais.length && ['recuperacao','taper','pos_prova'].includes(F.fase)) V = Math.min(V, Math.max(...normais));
  if(F.fase==='retomada') V = Math.min(M.retomada.volBase||V, Math.max(60, capAgenda)) * F.fator;
  else if(F.fase==='recuperacao') V *= 0.7;
  else if(F.fase==='taper') V *= ({1:[0.6], 2:[0.5,0.75], 3:[0.45,0.65,0.8]})[F.tap][F.W];
  else if(F.fase==='pos_prova') V *= [0.4,0.6,0.8][F.k-1] || 0.6;
  if(opts.fadiga) V *= 0.85;
  const lim = ((setup.aval||{}).lim||[]).length > 0;
  const q = F.fase==='recuperacao' || F.fase==='taper' ? 0 : M.q;
  const longCap = Math.min(RUN_LONGO_CAP[goal][nv], tempos.longo - 12);
  const share = (({2:0.45, 3:0.4, 4:0.34, 5:0.3, 6:0.27})[diasTreino.length] || 0.35) + (goal==='42km' ? 0.08 : goal==='21km' ? 0.05 : 0);
  const sess = {};
  // primeiro as fixas (qualidade, prova, iniciante), depois longão e leves com o que sobra
  let usado = 0;
  const base = { nv, q, terreno: setup.terrain, Z, est: M.estagio, goal, lim, raceKm: (RGOAL[goal]||{}).km };
  Object.keys(mapa).forEach(k=>{ const t = mapa[k];
    if(RT[t].q || t==='prova' || t==='camcorre'){
      let o = Object.assign({}, base, { taper: F.fase==='taper', maxTotal: tempos.sessao });
      let s = rSessao(t, o);
      while(RT[t].q && s.duration > tempos.sessao + 2 && o.q > 0){ o = Object.assign({}, o, { q:o.q-1 }); s = rSessao(t, o); }   // cabe no tempo disponível
      sess[k] = s; usado += s.blocks[1].exs.reduce((x,e)=>x+e.min,0); } });
  if(nv === 0){
    Object.keys(mapa).forEach(k=>{ if(mapa[k]==='caminhada') sess[k] = rSessao('caminhada', Object.assign({}, base, { min: Math.min(tempos.sessao-9, M.estagio===0 ? 25 : 30) })); });
  } else if(nv === 1){
    let c = M.contMin || 10; if(F.fase==='retomada') c = Math.max(Math.min(c, 15), _r5(c*Math.max(F.fator, 0.6))); if(opts.fadiga) c = Math.max(10, c-3);
    c = Math.min(c, tempos.sessao - 11);
    Object.keys(mapa).forEach(k=>{ const t = mapa[k];
      const min = t==='longao' ? Math.min(longCap, c + (c < 20 ? 5 : 10)) : t==='regenerativo' ? Math.max(12, Math.round(c*0.6)) : t==='caminhada' ? 30 : c;
      sess[k] = rSessao(t, Object.assign({}, base, { min })); });
  } else {
    const kLongo = Object.keys(mapa).find(k=>mapa[k]==='longao');
    let longo = 0;
    if(kLongo){ longo = teto('longao', _clamp(Math.round(V*share), 30, longCap)); if(opts.fadiga) longo = Math.round(longo*0.85);
      const mp = nv >= 3 && (goal==='42km' || goal==='21km') && F.fase==='especifica' && !opts.fadiga;
      sess[kLongo] = rSessao('longao', Object.assign({}, base, { min: longo, mp })); usado += longo; }
    const leves = Object.keys(mapa).filter(k=>mapa[k]==='leve' || mapa[k]==='regenerativo');
    const pesos = leves.map(k=>mapa[k]==='regenerativo' ? 0.6 : 1); const somaP = pesos.reduce((a,b)=>a+b,0) || 1;
    const resto = Math.max(0, V - usado);
    leves.forEach((k,i)=>{ const t = mapa[k];
      let min = Math.round(resto * pesos[i]/somaP);
      min = t==='regenerativo' ? _clamp(min, 20, 40) : _clamp(min, nv>=4 ? 30 : 20, Math.min(tempos.sessao - 11, longo ? longo-5 : 90));
      if(tetoTipo) min = Math.min(min, Math.max(tetoTipo.leve||0, tetoTipo.regenerativo||0, 20));
      const strides = t==='leve' && nv >= 2 && i===0 && ['adaptacao','base','recuperacao'].includes(F.fase) && !lim && !opts.fadiga;
      sess[k] = rSessao(t, Object.assign({}, base, { min: Math.round(min), strides }));
      const tetoDur = tetoTipo ? Math.max(tetoTipo.dur_leve||0, tetoTipo.dur_regenerativo||0) : 0;
      if(tetoDur && sess[k].duration > tetoDur){ sess[k] = rSessao(t, Object.assign({}, base, { min: Math.max(20, Math.round(min - (sess[k].duration - tetoDur))), strides })); } });
  }
  // por que cada treino
  const pernas = rDiasPerna(ctx);
  const dLongo = Object.keys(mapa).map(Number).find(d=>mapa[d]==='longao');
  const ws = Object.keys(sess).map(Number).sort((a,b)=>a-b).map((d,i)=>{
    const s = sess[d]; const t = s.tipo;
    let porque = `${RT[t].obj.charAt(0).toUpperCase()+RT[t].obj.slice(1)}.`;
    if(F.fase==='retomada') porque = `Semana ${F.k} de ${F.N} da retomada (pausa de ${F.pausa} dias): só ritmo leve e cerca de ${Math.round(F.fator*100)}% do volume de antes. ` + porque;
    else if(opts.fadiga && (d >= (opts.aPartir||1))) porque = `Ajustado pelo cansaço registrado (${opts.fadiga}). ` + porque;
    else if(t==='longao') porque = 'O treino mais longo da semana. ' + porque;
    else if(t==='regenerativo' && dLongo && (d===dLongo+1 || (dLongo===7 && d===1))) porque = 'Dia seguinte ao longão: só para soltar. ' + porque;
    else if(RT[t].q) porque = `Treino de qualidade da fase de ${RFASE[F.fase==='recuperacao'?(F.faseBase||'base'):F.fase].nome.toLowerCase()}. ` + porque;
    if(F.fase==='recuperacao') porque += ' Semana de recuperação: menos volume para o corpo assimilar o treino.';
    if(F.fase==='taper') porque += ' Polimento: menos volume, mantendo um pouco de ritmo.';
    if(t==='camcorre') porque += ` Estágio ${M.estagio} de ${RUN_EST.length-1}.`;
    const nm = t==='camcorre' ? `Caminhada + corrida · estágio ${M.estagio}` : t==='prova' ? `🏁 Prova — ${RGOAL[goal].nome}` : RT[t].nome;
    const km = s.km ? Math.round(s.km*2)/2 : null;
    return { k:'S'+(i+1), name:nm, dayIdx:d, dayName:RUN_DIAS[d-1], duration:Math.round(s.duration), distance: km ? '~'+String(km).replace('.',',')+' km' : '', targetKm: km || undefined, targetPace: s.alvo, blocks:s.blocks,
      motor:{ tipo:t, int:s.int, objetivo:s.objetivo, alvo:s.alvo, orient:s.orient, fase:F.fase, porque, nota: nota[d] || '', estagio: t==='camcorre'||t==='caminhada' ? M.estagio : undefined, pernasHoje: pernas.includes(d) } };
  });
  const volPlan = ws.reduce((t,w)=>t + (w.blocks[1].exs.reduce((x,e)=>x+e.min,0)), 0);
  return { workouts: ws, info:{ fase:F.fase, F, planejado: ws.filter(w=>w.motor.tipo!=='prova').length, vol: Math.round(volPlan), V: Math.round(V), nivel:nv, ref: ref ? { vdot: Math.round(ref.vdot*10)/10, conf: ref.conf } : null } };
}

// ---------- cansaço registrado (vale para o resto da semana) ----------
function rFadiga(ctx){
  const rs = rCorridas(ctx).filter(r=>!r.isRace && r.at >= ctx.agora - 5*DIA_MS);
  if(!rs.length) return null;
  const u = rs[rs.length-1], pen = rs[rs.length-2];
  const leve = t => ['leve','continua','longao','regenerativo','camcorre'].includes(t);
  if(u.concluiu==='nao') return { motivo:'treino não completado', at:u.at };
  if((+u.rpe||0) >= 9 && !(RT[u.tipoSessao]||{}).q) return { motivo:`esforço ${u.rpe}/10 num treino leve`, at:u.at };
  if((+u.rpe||0) >= 10) return { motivo:'esforço máximo no último treino', at:u.at };
  if(leve(u.tipoSessao) && (+u.rpe||0) >= 8) return { motivo:`treino leve com esforço ${u.rpe}/10`, at:u.at };
  if(pen && (+u.rpe||0) >= 8 && (+pen.rpe||0) >= 8) return { motivo:'dois treinos seguidos com esforço 8+', at:u.at };
  return null;
}

// ---------- estatísticas que sobrevivem à limpeza de 90 dias ----------
const RUN_REC_D = [{k:'3', km:3, nome:'3 km'}, {k:'5', km:5, nome:'5 km'}, {k:'10', km:10, nome:'10 km'}, {k:'21', km:21.0975, nome:'21 km'}, {k:'42', km:42.195, nome:'42 km'}];
function rRecordesDe(lista){
  const out = {};
  RUN_REC_D.forEach(D=>{
    lista.filter(r=>_ehCorrida(r) && +r.distance >= D.km*0.995 && +r.distance <= D.km*1.06 && +r.duration > 0).forEach(r=>{
      const cur = out[D.k]; if(!cur || +r.duration < cur.min) out[D.k] = { min:+r.duration, at:r.at, km:+r.distance, prova:!!r.isRace };
    });
  });
  return out;
}
function runAtualizaStats(){
  try{
    const run = state.modules.run; if(!run) return;
    const S = state.corridaStats = state.corridaStats || { recordes:{}, semanas:{}, provas:[] };
    const hist = (run.history||[]).filter(r=>r && r.at);
    const maisAntigo = hist.length ? Math.min(...hist.map(r=>r.at)) : Date.now();
    // recordes: os do histórico atual + os guardados de registros que já saíram da janela de 90 dias
    const atuais = rRecordesDe(hist); const novo = {};
    RUN_REC_D.forEach(D=>{ const g = (S.recordes||{})[D.k]; const a = atuais[D.k];
      const gValido = g && g.at < maisAntigo;    // o registro original já foi limpo: o guardado é a única fonte
      const c = [a, gValido ? g : null].filter(Boolean).sort((x,y)=>x.min-y.min)[0]; if(c) novo[D.k] = c; });
    S.recordes = novo;
    // provas
    const provasHist = hist.filter(r=>r.isRace && _ehCorrida(r)).map(r=>({ at:r.at, km:+r.distance||0, min:+r.duration||0 }));
    S.provas = (S.provas||[]).filter(p=>p.at < maisAntigo).concat(provasHist).sort((a,b)=>a.at-b.at).slice(-40);
    // semanas (km, minutos, corridas, maior corrida contínua, caminhada e bike)
    const sem = S.semanas || {};
    const ini = rSem(maisAntigo);
    Object.keys(sem).forEach(k=>{ if(+k >= ini) delete sem[k]; });
    hist.forEach(r=>{ const k = rSem(r.at); const w = sem[k] = sem[k] || { km:0, min:0, n:0, cont:0, kmP:0, minP:0, cam:0, bike:0 };
      if(_ehCorrida(r)){ w.km += +r.distance||0; w.min += +r.duration||0; w.n++; if(rContinua(r)) w.cont = Math.max(w.cont, +r.duration||0); if(+r.distance>0){ w.kmP += +r.distance; w.minP += +r.duration||0; } }
      else if(r.activity==='caminhada') w.cam += +r.duration||0; else if(r.activity==='bike') w.bike += +r.duration||0; });
    Object.keys(sem).forEach(k=>{ const w = sem[k]; ['km','min','kmP','minP','cam','bike','cont'].forEach(f=>w[f] = Math.round((w[f]||0)*100)/100); });
    const chaves = Object.keys(sem).map(Number).sort((a,b)=>a-b); chaves.slice(0, Math.max(0, chaves.length-110)).forEach(k=>delete sem[k]);
    S.semanas = sem;
    // metas conquistadas (ficam guardadas para sempre)
    S.metas = S.metas || {};
    const corr = hist.filter(r=>_ehCorrida(r) && +r.duration>0).sort((a,b)=>a.at-b.at);
    RUN_METAS.forEach(mt=>{
      if(S.metas[mt.k] || mt.tipo==='t5') return;
      const ok = corr.find(r=>mt.tipo==='cont' ? (rContinua(r) && +r.duration >= mt.alvo) : (+r.distance >= mt.alvo*0.98));
      if(ok) S.metas[mt.k] = ok.at;
    });
    const r5 = S.recordes['5'];
    if(r5 && !S.metas.t5base) S.metas.t5base = { min:r5.min, at:r5.at };
    if(r5 && S.metas.t5base && r5.min <= S.metas.t5base.min*0.97 && !S.metas.t5) S.metas.t5 = r5.at;
  }catch(e){ console.log('corrida stats', e); }
}

// ---------- sincronização semanal ----------
let _rSyncAt = 0;
// refazer (Beta 34): remonta a semana atual mantendo os dias que já passaram (usado pela "semana com menos tempo")
function runSync(force, refazer){
  const run = state && state.modules && state.modules.run;
  if(!run || !run.plan || run.plan.type!=='run' || (run.setup||{}).logOnly) return false;
  if(!force && !refazer && Date.now() - _rSyncAt < 1500) return false;
  _rSyncAt = Date.now();
  const ctx = runCtx();
  let M = run.plan.motor, mudou = false, rebuild = !!force || !!refazer;
  const semanaJaMontada = !!(M && M.semanaRef);   // conferido antes de avançar as semanas (abaixo)
  const inicioPlano = (typeof planStartTs==='function' && planStartTs(run)) || run.createdAt || Date.now();
  if(!M){ M = run.plan.motor = rMotorNovo(ctx, run.setup||{}, inicioPlano); M.migrado = !(run.setup||{}).aval; mudou = rebuild = true; }
  const semAtual = rSem(Math.max(Date.now(), inicioPlano));
  const eraEstaSemana = semanaJaMontada && M.semanaRef === semAtual;   // Beta 34: semana nova não herda os dias da anterior
  // 1) avalia cada semana que terminou
  let guard = 0;
  while(M.semanaRef && M.semanaRef < semAtual && guard++ < 60){
    const a = M.semanaRef;
    const teveAtiv = rAtividades(ctx).some(r=>r.at>=a && r.at<a+7*DIA_MS);
    const pz = rPausa(ctx, M.nivel);
    if(!teveAtiv && pz && pz.ultimoAntes < a){ _rPush(M, { sem:a, planejado:(M.semanas[a]||{}).planejado||0, feitos:0, cump:0, decisao:'pausa', motivo:'semana sem treinos (pausa)', mudou:'' }); }
    else _rPush(M, rAplicarDecisao(ctx, M, rAvaliarSemana(ctx, M, a)));
    M.semanaRef += 7*DIA_MS; mudou = rebuild = true;
  }
  // 2) retomada: pausa de 7+ dias de corrida tem prioridade sobre tudo
  const pz = rPausa(ctx, M.nivel);
  const chave = pz ? pz.ultimoAntes : null;
  if(pz && pz.pausa >= 7 && (!M.retomada || M.retomada.chave !== chave)){
    const N = rRetomadaSemanas(pz.pausa);
    const inicio = pz.voltou ? rSem(pz.retorno) : semAtual;
    if(semAtual < inicio + N*7*DIA_MS){
      const antes = { nivel:M.nivel, estagio:M.estagio, contMin:M.contMin, vol:M.vol };
      // pausas longas: o nível desce (o corpo perde parte do condicionamento), mas ninguém volta a ser "iniciante absoluto"
      if(M.nivel >= 2 && pz.pausa >= 90){ M.nivel = Math.max(1, M.nivel - (pz.pausa >= 180 ? 2 : 1)); if(M.nivel===1) M.contMin = 20; }
      if(M.nivel >= 2 && pz.pausa >= 28) M.q = 0;
      else if(M.nivel === 1 && pz.pausa >= 60){ M.contMin = Math.max(10, _r5((M.contMin||15)*0.7)); }
      else if(M.nivel === 0 && M.estagio > 1){ M.estagio = Math.max(1, M.estagio - (pz.pausa >= 60 ? 3 : pz.pausa >= 28 ? 2 : 1)); }
      M.retomada = { chave, pausa:pz.pausa, N, inicio, volBase: antes.vol || M.vol, antes, voltou: pz.voltou };
      M.nivelDesde = inicio;
      mudou = rebuild = true;
    }
  } else if(!pz && !M.retomada && M.retomadaDecl && !M.retomadaDecl.aplicada){
    const N = rRetomadaSemanas(M.retomadaDecl.pausa);
    M.retomada = { chave:'decl', pausa:M.retomadaDecl.pausa, N, inicio:M.retomadaDecl.desde, volBase:M.vol, antes:{ nivel:M.nivel }, declarada:true };
    M.retomadaDecl.aplicada = true; mudou = rebuild = true;
  }
  if(M.retomada && !M.retomada.fim && semAtual >= M.retomada.inicio + M.retomada.N*7*DIA_MS){
    M.retomada.fim = true; M.vol = Math.round((M.retomada.volBase||M.vol) * 0.85); mudou = rebuild = true;
  }
  // a data da prova mudou (marcada, trocada ou removida): refaz a semana na hora
  const rk = ((run.setup||{}).raceDate||'') + '|' + ((run.setup||{}).raceTime||'');
  if(M.raceKey === undefined) M.raceKey = rk;
  else if(M.raceKey !== rk){ M.raceKey = rk; mudou = rebuild = true; }
  // 3) cansaço registrado nesta semana: o resto da semana fica leve
  const fad = rFadiga(ctx);
  const infoSem = M.semanas[semAtual] || {};
  const fadKey = fad ? fad.at : null;
  if(fad && infoSem.fadigaAt !== fadKey && rSem(fad.at) === semAtual){ rebuild = true; }
  // 4) monta a semana
  if(rebuild || M.semanaRef !== semAtual || !(run.plan.workouts||[]).length || !(run.plan.workouts[0]||{}).motor){
    const mesmaSemana = eraEstaSemana && (run.plan.workouts||[]).length && (run.plan.workouts[0]||{}).motor;
    const hoje = getDayIdx();
    const fadAtiva = fad && rSem(fad.at) === semAtual;
    const S = rMontarSemana(ctx, Object.assign(M, { semanaRef: semAtual }), semAtual, fadAtiva ? { fadiga: fad.motivo, aPartir: hoje+1 } : {});
    let ws = S.workouts;
    if(mesmaSemana && !force){
      // não reescreve o passado: dias que já passaram (ou registrados hoje) continuam como estavam
      const feitosHoje = (run.history||[]).some(h=>mtDia0(h.at)===mtDia0());
      const velhos = run.plan.workouts.filter(w=>w.dayIdx < hoje || (w.dayIdx===hoje && feitosHoje));
      const novos = ws.filter(w=>!velhos.some(v=>v.dayIdx===w.dayIdx) && (w.dayIdx > hoje || (w.dayIdx===hoje && !feitosHoje)));
      ws = velhos.concat(novos).sort((a,b)=>a.dayIdx-b.dayIdx);
      if(fadAtiva) ws.forEach(w=>{ if(w.dayIdx > hoje && w.motor) w.motor.ajusteFadiga = fad.motivo; });
    }
    ws.forEach((w,i)=>w.k = 'S'+(i+1));
    run.plan.workouts = ws;
    M.semanas[semAtual] = Object.assign({}, S.info, { fadigaAt: fadAtiva ? fadKey : (infoSem.fadigaAt||null), planejado: ws.filter(w=>w.motor && w.motor.tipo!=='prova').length });
    const ks = Object.keys(M.semanas).map(Number).sort((a,b)=>a-b); ks.slice(0, Math.max(0, ks.length-30)).forEach(k=>delete M.semanas[k]);
    // número de semanas do plano (para a barra de progresso)
    const rdT = (run.setup||{}).raceDate ? new Date(run.setup.raceDate+'T12:00:00').getTime() : null;
    run.plan.totalWeeks = rdT && rdT > M.inicio ? Math.max(1, Math.round((rSem(rdT) - M.inicio)/(7*DIA_MS))+1) : 12;
    run.plan.level = RN_LEG[M.nivel]; if(run.setup) run.setup.level = RN_LEG[M.nivel];
    try{ regenRunPlan(); }catch(e){}
    mudou = true;
  }
  runAtualizaStats();
  if(mudou){ try{ saveData(); }catch(e){} }
  return mudou;
}

// =====================================================================
// 24. INTEGRAÇÃO COM AS TELAS E FUNÇÕES QUE JÁ EXISTIAM
// =====================================================================
function _runLerAval(){
  const multi = id=>[...document.querySelectorAll('#'+id+' .opt-multi.on')].map(o=>o.dataset.val);
  const exp = readOpt('run-exp') || 'caminho';
  const dist = parseFloat(($('run-marca-dist')||{}).value||'');
  const seg = (+($('run-marca-h')||{}).value||0)*3600 + (+($('run-marca-m')||{}).value||0)*60 + (+($('run-marca-s')||{}).value||0);
  const aval = { exp, continuo: readOpt('run-cont') || '0', kmSemana: ['regular','experiente'].includes(exp) ? (+readOpt('run-kmsem')||0) : 0,
    tempo: +readOpt('run-tempo') || 45, tempoLongo: +readOpt('run-tempolongo') || 0, parado: +readOpt('run-parado') || 0, lim: multi('run-lim'), em: Date.now() };
  if(dist > 0 && seg > 0 && exp!=='nunca'){
    const pace = seg/60/dist;
    if(pace >= 2.6 && pace <= 15) aval.marca = { km:dist, seg };
  }
  return aval;
}
function _runCtxSetup(setup){ const ctx = runCtx(); ctx.run = Object.assign({}, ctx.run||{ history:[] }, { setup }); return ctx; }
function runAtualizaDicaNivel(){
  const el = $('run-nivel-hint'); if(!el) return;
  const aval = _runLerAval(); const goal = readOpt('run-goal') || '5km';
  const exp = aval.exp;
  document.querySelectorAll('#scr-setup-run .run-exp-mais').forEach(f=>{
    const id = f.id;
    const mostra = id==='run-kmsem-wrap' ? ['regular','experiente'].includes(exp) : id==='run-marca-wrap' ? exp!=='nunca' && exp!=='caminho' : ['20','30','60','90'].includes(aval.continuo);
    f.style.display = mostra ? '' : 'none';
  });
  const setup = { goal, aval, days: parseInt(readOpt('run-days'))||3, terrain: readOpt('run-terrain'), raceDate: ($('run-race-date')||{}).value || null };
  const ctx = _runCtxSetup(setup);
  const nv = rNivelPotencial(ctx, aval);
  const linhas = [`Seu ponto de partida: <b>${RN_NOME[nv]}</b> — ${RN_FOCO[nv]}.`];
  if(nv === 0) linhas.push(`Primeira semana: ${rEstagioTxt(rEstagioInicial(ctx, aval))}${aval.continuo==='0' && aval.exp==='nunca' ? '' : ''}. Nada de treino difícil: o importante agora é constância.`);
  const minNv = RUN_NIVEL_MIN[goal] || 0;
  if(nv < minNv) linhas.push(`Para ${RGOAL[goal].nome.toLowerCase()}, primeiro vamos construir a base. Os treinos específicos da prova só entram quando você estiver pronto(a) — escolher a meta não pula etapas.`);
  if(setup.raceDate && RUN_PRAZO[goal]){
    const sem = Math.round((new Date(setup.raceDate+'T12:00:00') - Date.now())/(7*DIA_MS));
    const precisa = RUN_PRAZO[goal][nv];
    if(sem >= 0 && sem < precisa) linhas.push(`⚠️ Faltam ${sem} semana${sem===1?'':'s'} para a prova; para o seu nível, o ideal seriam ${precisa}. O plano não vai acelerar o volume para compensar — se for correr, intercalar caminhada é uma estratégia segura.`);
  }
  if(aval.lim.length) linhas.push('Com a limitação marcada, ficam fora subidas e tiros fortes, e o impacto cresce devagar.');
  el.innerHTML = linhas.map(l=>`<div>${l}</div>`).join('');
}
const _openSetupRunB14 = window.openSetupScreen;
window.openSetupScreen = function(m){
  const r = _openSetupRunB14.apply(this, arguments);
  if(m === 'run'){
    try{
      const st = (state.modules.run && state.modules.run.setup) || {}; const a = st.aval || {};
      const setOn = (gid,val)=>{ const g=$(gid); if(!g||val==null) return; const t=g.querySelector(`.opt[data-val="${val}"]`); if(!t) return; g.querySelectorAll('.opt:not(.opt-multi)').forEach(o=>o.classList.remove('on')); t.classList.add('on'); };
      if(st.goal) setOn('run-goal', st.goal);
      if(st.aval){ setOn('run-exp', a.exp); setOn('run-cont', a.continuo); setOn('run-kmsem', a.kmSemana); setOn('run-tempo', a.tempo); setOn('run-tempolongo', a.tempoLongo||0); setOn('run-parado', 0);
        document.querySelectorAll('#run-lim .opt-multi').forEach(o=>o.classList.toggle('on', (a.lim||[]).includes(o.dataset.val)));
        if(a.marca){ $('run-marca-dist').value = String(a.marca.km); $('run-marca-h').value = Math.floor(a.marca.seg/3600)||''; $('run-marca-m').value = Math.floor(a.marca.seg%3600/60); $('run-marca-s').value = a.marca.seg%60; } }
      else if(state.user && state.user.profile && state.user.profile.level==='sedentario') setOn('run-exp','nunca');
      // limitações: seleção livre (o padrão da tela limita pelos dias da semana)
      document.querySelectorAll('#run-lim .opt-multi').forEach(o=>{ o.onclick = ()=>{ o.classList.toggle('on'); runAtualizaDicaNivel(); }; });
      ['run-goal','run-exp','run-cont','run-kmsem','run-days','run-tempo','run-tempolongo','run-parado'].forEach(id=>{ const g = $(id); if(g && !g._b14){ g._b14 = true; g.addEventListener('click', ()=>setTimeout(runAtualizaDicaNivel, 20)); } });
      ['run-marca-dist','run-marca-h','run-marca-m','run-marca-s','run-race-date'].forEach(id=>{ const e = $(id); if(e && !e._b14){ e._b14 = true; e.addEventListener('input', runAtualizaDicaNivel); e.addEventListener('change', runAtualizaDicaNivel); } });
      runAtualizaDicaNivel();
    }catch(e){ console.log('setup corrida', e); }
  }
  return r;
};
const _finishSetupRunB14 = window.finishSetup;
window.finishSetup = function(m){
  if(m === 'run'){
    try{
      const aval = _runLerAval();
      const setup = { goal: readOpt('run-goal'), aval, days: parseInt(readOpt('run-days'))||3 };
      const nv = rNivelPotencial(_runCtxSetup(setup), aval);
      const g = $('run-level'); if(g){ g.querySelectorAll('.opt').forEach(o=>o.classList.toggle('on', o.dataset.val===RN_LEG[nv])); }
      window.__runAval = aval;
    }catch(e){ window.__runAval = null; }
  }
  return _finishSetupRunB14.apply(this, arguments);
};
const _generatePlanRunB14 = window.generatePlan;
window.generatePlan = function(module, setup){
  if(module !== 'run') return _generatePlanRunB14.apply(this, arguments);
  try{
    if(window.__runAval){ setup.aval = window.__runAval; window.__runAval = null; }
    const old = state.modules.run;
    const ctx = _runCtxSetup(setup);
    const si = $('run-start-date'); let ini = mtDia0();
    if(si && si.value){ const d = new Date(si.value+'T00:00:00'); if(!isNaN(d) && d.getTime() > ini) ini = d.getTime(); }
    const M = rMotorNovo(ctx, setup, ini);
    if(old && old.plan && old.plan.motor){ M.hist = (old.plan.motor.hist||[]).slice(-26); }
    const semAtual = rSem(Math.max(Date.now(), ini));
    M.semanaRef = semAtual;
    const S = rMontarSemana(ctx, M, semAtual, {});
    S.workouts.forEach((w,i)=>w.k = 'S'+(i+1));
    M.semanas[semAtual] = S.info;
    setup.level = RN_LEG[M.nivel];
    const rdT = setup.raceDate ? new Date(setup.raceDate+'T12:00:00').getTime() : null;
    return { type:'run', goal:setup.goal, terrain:setup.terrain, level:RN_LEG[M.nivel], workouts:S.workouts, totalWeeks: rdT && rdT > M.inicio ? Math.max(1, Math.round((rSem(rdT)-M.inicio)/(7*DIA_MS))+1) : 12, motor:M };
  }catch(e){ console.log('motor de corrida — usando o gerador antigo', e); return _generatePlanRunB14.apply(this, arguments); }
};
const _buildingStepsRunB14 = window.buildingSteps;
window.buildingSteps = function(m, setup, prev){
  if(m !== 'run' || !setup || !setup.aval) return _buildingStepsRunB14.apply(this, arguments);
  try{
    const ctx = _runCtxSetup(setup); const nv = rNivelPotencial(ctx, setup.aval); const ref = rReferencia(ctx);
    const steps = [
      {pri:1, txt:`Avaliando seu ponto de partida: <b>${RN_NOME[nv]}</b>`},
      {pri:1, txt:`Objetivo: <b>${RGOAL[rGoal(setup)].nome}</b>${setup.raceDate?` · prova em ${new Date(setup.raceDate+'T12:00:00').toLocaleDateString('pt-BR')}`:''}`},
      {pri:2, txt:`Organizando ${setup.days} treinos por semana, até ${rTempos(setup).sessao} min cada`},
      {pri:2, txt: ref ? `Calculando seus ritmos a partir ${ref.fonte}` : 'Treinos por esforço até eu ter dados seus para calcular ritmos'}
    ];
    if(rDiasPerna(ctx).length) steps.push({pri:2, txt:'Encaixando a corrida longe dos dias de pernas da musculação'});
    if((setup.aval.lim||[]).length) steps.push({pri:1, txt:'Respeitando suas limitações: <b>sem subidas nem tiros fortes</b>'});
    if(prev) steps.push({pri:1, txt:'Preservando seu <b>histórico</b> e seus <b>recordes</b>'});
    steps.push({pri:1, txt:'<b>Sua primeira semana está pronta!</b> As próximas se ajustam ao que você registrar.'});
    return steps;
  }catch(e){ return _buildingStepsRunB14.apply(this, arguments); }
};
const _currentWeekB14 = currentWeek;
window.currentWeek = function(mod){
  if(mod && mod.plan && mod.plan.type==='run' && mod.plan.motor){
    const M = mod.plan.motor; const n = Math.max(1, Math.round((rSem(Date.now()) - M.inicio)/(7*DIA_MS))+1); const tot = mod.plan.totalWeeks || 12;
    if((mod.setup||{}).raceDate) return { wk: Math.min(n, tot), total: tot, cycle:1 };
    return { wk: ((n-1)%tot)+1, total: tot, cycle: Math.floor((n-1)/tot)+1 };
  }
  return _currentWeekB14.apply(this, arguments);
};
const _labelGoalB14 = labelGoal;
window.labelGoal = function(mod){ if(mod && mod.plan && mod.plan.type==='run' && RGOAL[(mod.setup||{}).goal]) return RGOAL[mod.setup.goal].nome; return _labelGoalB14.apply(this, arguments); };
// descrição e blocos da sessão
const _runDescB14 = runDesc;
window.runDesc = function(w){
  if(!w || !w.motor) return _runDescB14.apply(this, arguments);
  const m = w.motor; const main = (w.blocks||[])[1]; const ex = main && main.exs[0];
  return `${ex ? `<b>${mtEsc(ex.name)}</b><br>` : ''}🎯 ${mtEsc(m.alvo||'')}${m.ajusteFadiga ? `<br>🟡 Ajustado: ${mtEsc(m.ajusteFadiga)} — se o corpo ainda estiver pesado, troque por caminhada.` : ''}${m.nota ? `<br>🦵 ${mtEsc(m.nota)}` : ''}`;
};
const _renderRunBlocksB14 = renderRunBlocks;
window.renderRunBlocks = function(w){
  if(!w || !w.motor) return _renderRunBlocksB14.apply(this, arguments);
  const m = w.motor;
  const topo = `<div class="run-why"><div class="run-why-row"><span class="run-int run-int-${mtNorm(m.int).replace(/[^a-z]/g,'')}">${mtEsc(m.int)}</span><span class="run-fase">${mtEsc((RFASE[m.fase]||{}).nome||'')}</span></div>
    <div class="run-why-t">Por que este treino</div><div class="run-why-p">${mtEsc(m.porque)}</div>
    <div class="run-why-t">Intensidade</div><div class="run-why-p">${mtEsc(m.alvo)}</div></div>`;
  const orient = (m.orient||[]).length ? `<div class="run-orient"><div class="run-why-t">Orientações</div>${m.orient.map(o=>`<div class="run-orient-l">• ${mtEsc(o)}</div>`).join('')}<div class="run-orient-l">• Dor que muda sua passada, tontura ou dor no peito: pare o treino.</div></div>` : '';
  return topo + _renderRunBlocksB14.apply(this, arguments) + orient;
};
// "Sugestão de hoje" no card do treino: a mesma hierarquia do resto do app
const _runSugB14 = window.runSmartSuggestion;
window.runSmartSuggestion = function(w){
  const run = state.modules.run; const M = run && run.plan && run.plan.motor;
  if(!M) return _runSugB14.apply(this, arguments);
  try{
    const ctx = runCtx(); const sem = rSem(); const F = rSemanaFase(ctx, M, sem);
    if(F.fase==='retomada') return { emo:'🔁', txt:`Retomada (semana ${F.k} de ${F.N}, depois de ${F.pausa} dias): só ritmo leve, cerca de ${Math.round(F.fator*100)}% do volume de antes. Mesmo que fique fácil, não acelere nem estique o treino.` };
    const fad = rFadiga(ctx);
    if(fad && rSem(fad.at)===sem) return { emo:'🟡', txt:`Último treino: ${fad.motivo}. O resto da semana ficou leve. Se ainda estiver cansado(a) ou com dor, troque por caminhada ou descanse — recuperar também é treino.` };
    if(w && w.motor && w.motor.nota) return { emo:'🦵', txt: w.motor.nota };
    // treino perdido: não compensa
    const hoje = getDayIdx();
    const ontem = (run.plan.workouts||[]).find(x=>x.dayIdx === hoje-1);
    if(ontem && !(run.history||[]).some(h=>mtDia0(h.at)===mtDia0(Date.now()-DIA_MS))){
      const eraLongo = ontem.motor && ontem.motor.tipo==='longao';
      return { emo:'📅', txt: eraLongo && w && w.motor && w.motor.tipo!=='longao' ? 'O longão de ontem ficou para trás. Se quiser, faça o longão hoje NO LUGAR deste treino — nunca os dois. Sem compensar volume.' : 'O treino de ontem ficou para trás — sem problema. Siga o de hoje normalmente, sem somar o que faltou.' };
    }
    if(F.fase==='recuperacao') return { emo:'🌿', txt:'Semana de recuperação: volume menor de propósito. É aqui que o corpo assimila o treino das últimas semanas.' };
    if(F.fase==='taper') return { emo:'🎯', txt:'Polimento: menos volume para chegar descansado(a). Não invente treino extra nesta reta.' };
    // leves rápidos demais (erro clássico): o perfil mostra se o ritmo leve está acima da faixa
    const ref = rReferencia(ctx); const p = rPerfil(ctx);
    if(ref && ref.conf!=='baixa' && p.paceLeve && p.paceLeve < ref.zonas.leve.a - 0.15 && w && w.motor && ['leve','longao','continua'].includes(w.motor.tipo))
      return { emo:'🐢', txt:`Seus treinos leves estão saindo rápidos (${mtPaceStr(p.paceLeve)}) para a sua faixa (${rFaixa(ref.zonas.leve)}). Leve de verdade rende mais evolução e menos lesão.` };
    return null;
  }catch(e){ return null; }
};
// ---------- registro com horas, minutos e segundos ----------
function _rlTipoPlan(dayIdx){ const run = state.modules.run; const w = run && run.plan ? (run.plan.workouts||[]).find(x=>String(x.dayIdx)===String(dayIdx)) : null; return w; }
const _openRunLogB14 = window.openRunLog;
window.openRunLog = function(dayIdx){
  const run = state.modules.run; if(!run) return _openRunLogB14.apply(this, arguments);
  const w = _rlTipoPlan(dayIdx); const livre = !w || String(dayIdx)==='livre';
  const t = w && w.motor ? w.motor.tipo : null;
  const tipoAtiv = t==='caminhada' ? 'caminhada' : 'corrida';
  const semKmOk = livre || t==='caminhada' || t==='camcorre' || (t && (state.modules.run.plan.motor||{}).nivel <= 1);
  const planejado = w ? `<b>${mtEsc(w.name)}</b> · planejado: ${rFmtDurCurta(w.duration)}${w.distance?' · '+w.distance:''}` : 'Corrida, caminhada ou pedalada — mesmo em dia de descanso, todo movimento conta.';
  $('modal-inner').innerHTML = `<h3>📝 Registrar atividade</h3>
    <p style="color:var(--text-dim);font-size:13px;margin:4px 0 10px">${planejado}</p>
    <div class="field"><label>O que você fez?</label><div class="radio-grid g3" id="rl-type">
      <div class="opt ${tipoAtiv==='corrida'?'on':''}" data-val="corrida">🏃 Corrida</div><div class="opt ${tipoAtiv==='caminhada'?'on':''}" data-val="caminhada">🚶 Caminhada</div><div class="opt" data-val="bike">🚴 Bike</div></div></div>
    <div class="field"><label>Tempo total</label>
      <div class="tempo-hms"><input class="input mono" type="number" min="0" max="23" inputmode="numeric" id="rl-h" placeholder="h" aria-label="horas"><span>:</span><input class="input mono" type="number" min="0" max="59" inputmode="numeric" id="rl-m" placeholder="min" aria-label="minutos"><span>:</span><input class="input mono" type="number" min="0" max="59" inputmode="numeric" id="rl-s" placeholder="seg" aria-label="segundos"></div></div>
    <div class="field"><label>Distância (km)</label><input class="input mono" type="text" inputmode="decimal" id="rl-km" placeholder="Ex: 5,25">
      ${semKmOk ? `<label class="rl-chk"><input type="checkbox" id="rl-semkm"> Não medi a distância</label>` : ''}</div>
    <div class="rl-calc" id="rl-calc">Preencha o tempo e a distância para ver ritmo e velocidade.</div>
    ${!livre ? `<div class="field"><label>Você completou o treino?</label><div class="radio-grid g3" id="rl-conc"><div class="opt on" data-val="sim">✅ Completo</div><div class="opt" data-val="parcial">🟡 Quase todo</div><div class="opt" data-val="nao">❌ Não consegui</div></div></div>` : ''}
    ${t!=='caminhada' ? `<div class="field" id="rl-cont-wrap"><label>Correu sem parar para caminhar?</label><div class="radio-grid g3" id="rl-cont"><div class="opt ${t==='camcorre'?'':'on'}" data-val="1">Sim</div><div class="opt ${t==='camcorre'?'on':''}" data-val="0">Precisei caminhar</div></div></div>` : ''}
    <div class="field"><label>Esforço percebido (1 a 10)</label>${rpeHtml(t && RT[t] && RT[t].q ? 7 : 4)}</div>
    <input type="hidden" id="rl-min">
    <div class="row" style="gap:8px;margin-top:14px"><button class="btn btn-ghost btn-block" onclick="closeModal()">Cancelar</button><button class="btn btn-primary btn-block" onclick="saveRunLog('${livre?'livre':dayIdx}')">💾 Salvar</button></div>`;
  $('modal-back').classList.add('on');
  bindOpts('modal-inner');
  const upd = ()=>runLogCalc();
  ['rl-h','rl-m','rl-s','rl-km'].forEach(id=>{ const e = $(id); if(e) e.addEventListener('input', upd); });
  const sk = $('rl-semkm'); if(sk) sk.addEventListener('change', ()=>{ $('rl-km').disabled = sk.checked; if(sk.checked) $('rl-km').value = ''; upd(); });
  document.querySelectorAll('#rl-type .opt').forEach(o=>o.addEventListener('click', ()=>setTimeout(()=>{ const ty = readOpt('rl-type'); const cw = $('rl-cont-wrap'); if(cw) cw.style.display = ty==='corrida' ? '' : 'none'; upd(); }, 10)));
};
function _rlSeg(){ return (+($('rl-h')||{}).value||0)*3600 + (+($('rl-m')||{}).value||0)*60 + (+($('rl-s')||{}).value||0); }
function _rlKm(){ const v = parseFloat(String(($('rl-km')||{}).value||'').replace(',','.')); return v > 0 ? v : 0; }
function runLogCalc(){
  const el = $('rl-calc'); if(!el) return;
  const seg = _rlSeg(), km = _rlKm(), ty = readOpt('rl-type') || 'corrida';
  if(!seg){ el.textContent = 'Preencha o tempo e a distância para ver ritmo e velocidade.'; return; }
  if(!km){ el.innerHTML = `Tempo: <b>${rFmtSeg(seg)}</b>${$('rl-semkm') && $('rl-semkm').checked ? ' · sem distância: o plano usa o tempo' : ''}`; return; }
  const pace = seg/60/km;
  el.innerHTML = ty==='bike' ? `Tempo <b>${rFmtSeg(seg)}</b> · <b>${mtFmtKm(km)} km</b> · velocidade <b>${rFmtKmh(pace)}</b>`
    : `Tempo <b>${rFmtSeg(seg)}</b> · ritmo médio <b>${mtPaceStr(pace)}</b> · <b>${rFmtKmh(pace)}</b>`;
}
const _saveRunLogB14 = window.saveRunLog;
window.saveRunLog = function(dayIdx){
  if(!$('rl-h')) return _saveRunLogB14.apply(this, arguments);
  const h = +$('rl-h').value||0, m = +$('rl-m').value||0, s = +$('rl-s').value||0;
  if(m > 59 || s > 59 || h < 0 || m < 0 || s < 0){ toast('Minutos e segundos vão de 0 a 59'); return; }
  const seg = h*3600 + m*60 + s;
  if(seg <= 0){ toast('Informe o tempo (horas, minutos e segundos)'); return; }
  const ty = readOpt('rl-type') || 'corrida';
  const semKm = $('rl-semkm') && $('rl-semkm').checked;
  const km = _rlKm();
  if(!semKm && !km){ toast($('rl-semkm') ? 'Informe a distância ou marque "Não medi a distância"' : 'Informe a distância'); return; }
  if(km){
    const pace = seg/60/km;
    if(ty==='corrida' && pace < 2.6){ toast('Confira os dados: esse ritmo é mais rápido que o recorde mundial'); return; }
    if(ty==='caminhada' && pace < 4.5){ toast('Confira os dados: ritmo rápido demais para caminhada — foi corrida?'); return; }
    if(ty==='bike' && km/(seg/3600) > 70){ toast('Confira os dados: velocidade acima de 70 km/h'); return; }
  }
  const w = _rlTipoPlan(dayIdx); const t = w && w.motor ? w.motor.tipo : null;
  const contV = readOpt('rl-cont');
  const extra = { durSeg: seg, concluiu: $('rl-conc') ? (readOpt('rl-conc')||'sim') : undefined, continuo: ty==='corrida' && contV!=null ? contV==='1' : undefined,
    tipoSessao: String(dayIdx)==='livre' ? undefined : (t || undefined), estagio: w && w.motor ? w.motor.estagio : undefined };
  $('rl-min').value = `${h}:${m}:${s}`;
  if(semKm){ _rSalvarSemKm(dayIdx, ty, seg/60, extra); return; }
  $('rl-km').value = String(km);
  window.__runLogExtra = extra;
  return _saveRunLogB14.apply(this, arguments);
};
function _rSalvarSemKm(dayIdx, type, min, extra){
  const mod = state.modules.run; const livre = String(dayIdx)==='livre';
  const w = livre ? null : _rlTipoPlan(dayIdx);
  const rpe = window.__rpe || 5; const rate = rpe<=3 ? 5 : (rpe<=7 ? 3 : 1);
  const meta = ACTIVITY_META[type] || ACTIVITY_META.corrida;
  mod.history = mod.history || [];
  const e = { id: w ? w.k : 'livre', name: (w && type!=='bike') ? w.name : `${meta.emo} ${meta.lbl} — ${rFmtDurCurta(min)}`, at:Date.now(), duration:min, distance:0, pace:'', rating:rate, rpe, module:'run', activity:type };
  Object.keys(extra).forEach(k=>{ if(extra[k]!==undefined) e[k] = extra[k]; });
  mod.history.push(e);
  ensureStats();
  try{ adjustStartIfEarly(mod); }catch(er){}
  window.__runLogExtra = null;
  recalibrateRunPlan();
  saveData(); closeModal();
  const linhas = [`<b>${rFmtSeg(min*60)}</b> de ${type==='caminhada'?'caminhada':type==='bike'?'pedalada':'treino'} registrados.`].concat(runFeedbackMotor(e));
  $('modal-inner').innerHTML = `<div style="text-align:center"><div style="font-size:44px;line-height:1">${meta.emo}</div><h3 style="margin:10px 0 4px">Atividade registrada!</h3></div>
    <div class="card" style="margin-top:12px;padding:13px 15px">${linhas.map(l=>`<div style="font-size:13.5px;line-height:1.6;color:var(--text-dim);margin:5px 0">${l}</div>`).join('')}</div>
    <button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal();goTab('home')">Continuar</button>`;
  try{ trofeuPendente = true; }catch(er){}
  $('modal-back').classList.add('on');
}
// depois que o registro original grava, os dados extras entram no mesmo item do histórico
const _recalB14 = window.recalibrateRunPlan;
window.recalibrateRunPlan = function(){
  const run = state.modules.run;
  try{
    const ex = window.__runLogExtra;
    if(ex && run && (run.history||[]).length){ const u = run.history[run.history.length-1]; if(Date.now() - u.at < 60000) Object.keys(ex).forEach(k=>{ if(ex[k]!==undefined) u[k] = ex[k]; }); }
    window.__runLogExtra = null;
  }catch(e){}
  if(run && run.plan && run.plan.motor){ _rSyncAt = 0; runSync(); return; }
  return _recalB14.apply(this, arguments);
};
// o que o registro significa para o plano (aparece no resumo depois de salvar)
function runFeedbackMotor(e){
  const out = [];
  try{
    const run = state.modules.run; const M = run && run.plan && run.plan.motor; if(!M) return out;
    const ctx = runCtx();
    if(e.distance > 0 && e.duration > 0 && e.activity!=='bike') out.push(`Velocidade média: <b>${rFmtKmh(e.duration/e.distance)}</b>.`);
    const fad = rFadiga(ctx);
    if(fad && fad.at === e.at) out.push(`🟡 Anotado: ${fad.motivo}. Os próximos treinos desta semana ficaram leves — sem compensar nada depois.`);
    if(e.tipoSessao==='camcorre' && M.nivel===0){
      const n = rAtividades(ctx).filter(r=>r.tipoSessao==='camcorre' && r.estagio===M.estagio && rSem(r.at)===rSem() && r.concluiu==='sim' && (+r.rpe||5)<=7).length;
      out.push(n >= 2 ? `✅ ${n} treinos completos no estágio ${M.estagio}: na próxima semana você avança.` : `Estágio ${M.estagio}: ${n} de 2 treinos completos (esforço até 7/10) para avançar.`);
    }
    if(M.nivel===1 && e.activity==='corrida' && e.continuo!==false && e.duration >= (M.contMin||10)*0.95 && (+e.rpe||5) <= 6) out.push(`✅ ${Math.round(e.duration)} min sem parar com esforço ${e.rpe}/10 — conta para aumentar a corrida contínua.`);
    if(e.continuo===false && M.nivel===1) out.push('Precisou caminhar? Normal. O plano só aumenta quando você completar o tempo sem parar.');
  }catch(er){}
  return out;
}
const _runFeedbackB14 = runFeedback;
window.runFeedback = function(km, min, type, ehProva){
  const fb = _runFeedbackB14.apply(this, arguments);
  try{
    const run = state.modules.run; const u = run && (run.history||[]).slice(-1)[0];
    const extra = u ? runFeedbackMotor(Object.assign({}, u, window.__runLogExtra||{})) : [];
    if(fb && extra.length) fb.linhas = fb.linhas.concat(extra);
  }catch(e){}
  return fb;
};
// os recordes e o resumo semanal são guardados antes da limpeza de 90 dias
const _cleanupB14 = cleanupOldHistory;
window.cleanupOldHistory = function(){ try{ runAtualizaStats(); }catch(e){} return _cleanupB14.apply(this, arguments); };

// ---------- metas progressivas (só se conquistam com registros reais) ----------
const RUN_METAS = [
  {k:'c10', nome:'Correr 10 min sem parar', tipo:'cont', alvo:10},
  {k:'c20', nome:'Correr 20 min sem parar', tipo:'cont', alvo:20},
  {k:'c30', nome:'Correr 30 min sem parar', tipo:'cont', alvo:30},
  {k:'k3', nome:'Completar os primeiros 3 km', tipo:'km', alvo:3},
  {k:'k5', nome:'Completar 5 km', tipo:'km', alvo:5},
  {k:'t5', nome:'Melhorar o tempo nos 5 km', tipo:'t5'},
  {k:'k10', nome:'Completar 10 km', tipo:'km', alvo:10},
  {k:'k21', nome:'Completar 21 km', tipo:'km', alvo:21.0975},
  {k:'k42', nome:'Completar 42 km', tipo:'km', alvo:42.195}
];
function rMetas(ctx){
  const S = ctx.stats || {}; const MS = S.metas || {}; const p = rPerfil(ctx);
  const runs = rCorridas(ctx); const recentes = runs.filter(r=>r.at >= ctx.agora - 42*DIA_MS);
  const longoMin = recentes.filter(rContinua).reduce((m,r)=>Math.max(m,+r.duration||0),0);
  const sem3 = p.semanas.slice(0,6).filter(w=>w.n>=3).length;
  const M = (((ctx.run||{}).plan)||{}).motor || {};
  const lista = RUN_METAS.map(mt=>{
    const o = Object.assign({}, mt, { feita: !!MS[mt.k], quando: MS[mt.k] || null });
    if(mt.tipo==='t5'){
      const r5 = (S.recordes||{})['5'];
      if(!MS.t5base){ o.req = [{ok:!!MS.k5, txt:'ter um 5 km registrado'}]; o.prog = 0; }
      else { o.alvoMin = MS.t5base.min*0.97; o.txtAlvo = `abaixo de ${rFmtMin(o.alvoMin)} (seu primeiro: ${rFmtMin(MS.t5base.min)})`; o.prog = r5 ? _clamp((MS.t5base.min - r5.min)/(MS.t5base.min - o.alvoMin), 0, 1) : 0; o.req = [{ok:true, txt:'treinar ritmo por algumas semanas (o plano cuida disso)'}]; }
      return o;
    }
    o.prog = mt.tipo==='cont' ? _clamp(p.contMin/mt.alvo, 0, 1) : _clamp(p.maiorKm/mt.alvo, 0, 1);
    // preparação exigida para tentar a meta com segurança (nunca liberada só por tempo de uso)
    if(mt.k==='k5') o.req = [{ok:!!MS.c30 || p.contMin>=30, txt:'correr 30 min sem parar'}];
    if(mt.k==='k10') o.req = [{ok:!!MS.k5, txt:'5 km concluídos'}, {ok:longoMin>=60, txt:`longão de 60 min nas últimas 6 semanas (maior: ${Math.round(longoMin)} min)`}];
    if(mt.k==='k21') o.req = [{ok:!!MS.k10, txt:'10 km concluídos'}, {ok:longoMin>=95, txt:`longão de 95 min nas últimas 6 semanas (maior: ${Math.round(longoMin)} min)`}, {ok:sem3>=3, txt:`3 semanas com 3+ corridas (últimas 6: ${sem3})`}];
    if(mt.k==='k42') o.req = [{ok:!!MS.k21, txt:'21 km concluídos'}, {ok:longoMin>=150, txt:`longão de 2h30 nas últimas 6 semanas (maior: ${Math.round(longoMin)} min)`}, {ok:(M.nivel||0)>=3, txt:'nível Intermediário avançado ou acima'}];
    return o;
  });
  const prox = lista.find(m=>!m.feita) || null;
  if(prox) prox.proxima = true;
  return { lista, prox };
}

// ---------- status no topo da tela de Treinos ----------
function runStatusCard(){
  const run = state.modules.run; const M = run && run.plan && run.plan.motor; if(!M) return '';
  const ctx = runCtx(); const F = rSemanaFase(ctx, M, rSem()); const info = M.semanas[rSem()] || {};
  const ref = rReferencia(ctx);
  const vol = info.vol ? (ref ? `~${rFmtDurCurta(info.vol)} correndo (≈${mtFmtKm(info.vol/((ref.zonas.leve.a+ref.zonas.leve.b)/2))} km)` : `~${rFmtDurCurta(info.vol)} de treino`) : '';
  const extra = M.nivel===0 ? `Estágio ${M.estagio} de ${RUN_EST.length-1}` : M.nivel===1 ? `Corrida contínua: ${M.contMin} min` : vol;
  const mig = M.migrado ? `<div class="run-st-mig">Seu plano agora evolui semana a semana. <button class="link-mais" onclick="openSetupScreen('run')">Refazer a avaliação</button> deixa tudo mais preciso.</div>` : '';
  return `<div class="run-st" id="run-st">
    <div class="run-st-top"><div><div class="run-st-k">Nível</div><div class="run-st-v">${RN_NOME[M.nivel]}</div></div><div><div class="run-st-k">Fase</div><div class="run-st-v">${RFASE[F.fase].nome}${F.fase==='retomada'?` ${F.k}/${F.N}`:''}</div></div></div>
    <div class="run-st-p">${RFASE[F.fase].desc.charAt(0).toUpperCase()+RFASE[F.fase].desc.slice(1)}. ${extra ? `<b>Esta semana:</b> ${extra}.` : ''}</div>
    ${mig}
    <div class="run-st-a"><button class="btn btn-primary" onclick="openRunPainel()">📈 Evolução</button><button class="btn btn-ghost" onclick="openRunSemana()">📅 Semana com menos tempo</button></div>
  </div>`;
}
function openRunSemana(){
  const run = state.modules.run; const M = run && run.plan && run.plan.motor; if(!M) return;
  const hoje = getDayIdx(); const atuais = (run.plan.workouts||[]).map(w=>w.dayIdx);
  $('modal-inner').innerHTML = `<h3>📅 Semana com menos tempo</h3>
    <p class="mt-muted" style="margin:4px 0 10px">Marque os dias em que você <b>consegue</b> treinar até domingo. Eu reorganizo a semana priorizando o mais importante — sem empilhar treinos e sem compensar depois.</p>
    <div class="radio-grid" id="rs-dias" style="grid-template-columns:repeat(4,1fr)">${RUN_DIAS.map((d,i)=>{ const di = i+1; const pass = di < hoje; return `<div class="opt opt-multi ${!pass && atuais.includes(di)?'on':''} ${pass?'opt-off':''}" data-val="${di}" ${pass?'aria-disabled="true"':''}>${d.slice(0,3)}</div>`; }).join('')}</div>
    <div class="row" style="gap:8px;margin-top:14px"><button class="btn btn-ghost btn-block" onclick="runSemanaNormal()">Voltar ao normal</button><button class="btn btn-primary btn-block" onclick="runSemanaPrevia()">Ver como fica</button></div>`;
  $('modal-back').classList.add('on');
  document.querySelectorAll('#rs-dias .opt-multi').forEach(o=>{ if(o.classList.contains('opt-off')) return; o.onclick = ()=>o.classList.toggle('on'); });
}
// Beta 34: antes de aplicar, mostra como a semana fica (o que continua, o que muda e o que sai).
// Antes, "Reorganizar" não remontava a semana (a mudança só aparecia num recálculo posterior).
function _rsDiasEscolhidos(){
  const hoje = getDayIdx();
  return [...document.querySelectorAll('#rs-dias .opt-multi.on')].map(o=>+o.dataset.val).filter(d=>d >= hoje).sort((a,b)=>a-b);
}
function _rsSessaoTxt(w){ const t = w.motor ? w.motor.tipo : ''; return `${(RT[t]||{}).nome || w.name} · ${w.duration} min${w.distance?` · ${w.distance}`:''}`; }
function runSemanaPrevia(){
  const run = state.modules.run; const M = run.plan.motor; const hoje = getDayIdx();
  const dias = _rsDiasEscolhidos();
  if(!dias.length){ toast('Marque pelo menos um dia a partir de hoje'); return; }
  const feitosHoje = (run.history||[]).some(h=>mtDia0(h.at)===mtDia0());
  const passados = (run.plan.workouts||[]).map(w=>w.dayIdx).filter(d=>d < hoje || (d===hoje && feitosHoje));
  const sem = rSem();
  const teste = JSON.parse(JSON.stringify(M)); teste.especial = { sem, dias: [...new Set(passados.concat(dias))] };
  let S; try{ S = rMontarSemana(runCtx(), teste, sem, {}); }catch(e){ console.log('prévia da semana:', e); toast('Não consegui montar a prévia agora'); return; }
  const futuro = ws => ws.filter(w=>w.dayIdx > hoje || (w.dayIdx===hoje && !feitosHoje));
  const antes = futuro(run.plan.workouts||[]), depois = futuro(S.workouts||[]);
  const tiposDepois = depois.map(w=>w.motor && w.motor.tipo);
  const saem = antes.filter(w=>w.motor && !tiposDepois.includes(w.motor.tipo));
  const minA = antes.reduce((t,w)=>t+(+w.duration||0),0), minD = depois.reduce((t,w)=>t+(+w.duration||0),0);
  const notas = depois.filter(w=>w.motor && w.motor.nota).map(w=>`${w.dayName}: ${w.motor.nota}`);
  window.__rsDias = teste.especial.dias;
  $('modal-inner').innerHTML = `<h3>📅 Como fica a semana</h3>
    <div class="section-lbl" style="margin:6px 0 4px">Antes</div>
    ${antes.length ? antes.map(w=>`<div class="mrow"><span>${w.dayName}</span><b style="text-align:right">${mtEsc(_rsSessaoTxt(w))}</b></div>`).join('') : '<p class="mt-muted">Nenhum treino restante.</p>'}
    <div class="section-lbl" style="margin:12px 0 4px">Depois</div>
    ${depois.length ? depois.map(w=>`<div class="mrow"><span>${w.dayName}</span><b style="text-align:right">${mtEsc(_rsSessaoTxt(w))}</b></div>`).join('') : '<p class="mt-muted">Nenhum treino.</p>'}
    <div class="note note-info" style="margin-top:12px"><div class="note-line" style="font-size:12.5px;line-height:1.55">
      ${tiposDepois.includes('longao') ? 'O <b>longão</b> continua: é o treino que mais sustenta a sua evolução. ' : ''}${tiposDepois.some(t=>RT[t]&&RT[t].q) ? 'O treino de <b>qualidade</b> continua, longe do longão. ' : ''}
      ${saem.length ? `Sai${saem.length>1?'em':''}: ${saem.map(w=>mtEsc((RT[w.motor.tipo]||{}).nome||w.name).toLowerCase()).join(', ')} — ${saem.length>1?'os de menor prioridade':'o de menor prioridade'}. ` : ''}
      Tempo total: ${minA} → ${minD} min. Os outros dias <b>não</b> ficam mais longos para compensar, e a semana que vem volta ao plano normal.
      ${notas.length ? '<br><br>' + notas.map(mtEsc).join('<br>') : ''}</div></div>
    <div class="row" style="gap:8px;margin-top:14px"><button class="btn btn-ghost btn-block" onclick="openRunSemana()">Escolher outros dias</button><button class="btn btn-primary btn-block" onclick="runSemanaAplicar()">Aplicar</button></div>`;
}
function runSemanaAplicar(){
  const run = state.modules.run; const M = run.plan.motor;
  const dias = window.__rsDias; if(!dias || !dias.length){ runSemanaPrevia(); return; }
  M.especial = { sem: rSem(), dias };
  window.__rsDias = null;
  runSync(false, true); closeModal(); toast('Semana reorganizada ✅'); try{ goTab(state.ui.tab||'sessions'); }catch(e){}
}
function runSemanaNormal(){ const M = state.modules.run.plan.motor; M.especial = null; runSync(false, true); closeModal(); toast('Semana normal de volta'); try{ goTab(state.ui.tab||'sessions'); }catch(e){} }

// ---------- painel de evolução ----------
function openRunPainel(dados){
  const ctx = runCtx(dados); const run = ctx.run; if(!run){ toast('Você ainda não tem o módulo de corrida.'); return; }
  if(!dados) runAtualizaStats();
  const S = (dados ? dados.corridaStats : state.corridaStats) || {}; const sem = S.semanas || {};
  const M = (run.plan||{}).motor || null; const p = rPerfil(ctx); const ref = rReferencia(ctx);
  const s0 = rSem(); const ks = []; for(let i=11;i>=0;i--) ks.push(s0 - i*7*DIA_MS);
  const W = k=>sem[k] || {km:0,min:0,n:0,cont:0,kmP:0,minP:0};
  const mes0 = new Date(); mes0.setDate(1); mes0.setHours(0,0,0,0);
  const hist = rCorridas(ctx);
  const doMes = hist.filter(r=>r.at >= mes0.getTime());
  const tot = Object.values(sem).reduce((t,w)=>({km:t.km+(w.km||0), min:t.min+(w.min||0), n:t.n+(w.n||0)}), {km:0,min:0,n:0});
  const freq = ks.slice(4).reduce((t,k)=>t+W(k).n,0)/8;
  const cump = M ? rCumprimento(ctx, M, 4) : null;
  const tile = (k,v,s)=>`<div class="rp-tile"><div class="rp-k">${k}</div><div class="rp-v">${v}</div>${s?`<div class="rp-s">${s}</div>`:''}</div>`;
  const tiles = `<div class="rp-tiles">
    ${tile('Esta semana', mtFmtKm(W(s0).km)+' km', rFmtDurCurta(W(s0).min)+' correndo')}
    ${tile('Este mês', mtFmtKm(doMes.reduce((t,r)=>t+(+r.distance||0),0))+' km', rFmtDurCurta(doMes.reduce((t,r)=>t+(+r.duration||0),0))+' correndo')}
    ${tile('Tempo total correndo', rFmtDurCurta(tot.min), `${tot.n} corridas registradas`)}
    ${tile('Frequência', freq.toLocaleString('pt-BR',{maximumFractionDigits:1})+'×/sem', 'média das últimas 8 semanas')}
    ${tile('Cumprimento do plano', cump==null?'—':cump+'%', cump==null?'aparece após a 1ª semana avaliada':'últimas 4 semanas')}
    ${tile('Maior corrida contínua', p.contMin ? rFmtDurCurta(p.contMin) : '—', 'últimas 8 semanas')}
  </div>`;
  const ptsKm = ks.map(k=>({v:Math.round(W(k).km*10)/10, rot:mtFmtData(k), tip:`<b>${mtFmtKm(W(k).km)} km</b> · ${rFmtDurCurta(W(k).min)} · ${W(k).n} corrida${W(k).n===1?'':'s'} · semana de ${mtFmtData(k)}`}));
  const comKm = ptsKm.filter(x=>x.v>0).length;
  const ptsPace = ks.map(k=>{ const w = W(k); const v = w.kmP>=1 ? w.minP/w.kmP : null; return {v, rot:mtFmtData(k), tip: v?`<b>${mtPaceStr(v)}</b> · ${rFmtKmh(v)} · semana de ${mtFmtData(k)}`:''}; });
  const ptsCont = ks.map(k=>{ const w = W(k); return {v: w.cont>0 ? Math.round(w.cont) : null, rot:mtFmtData(k), tip: w.cont>0 ? `<b>${Math.round(w.cont)} min</b> sem parar · semana de ${mtFmtData(k)}` : ''}; });
  const graf = (tit, corpo, nota)=>`<div class="rp-card"><div class="rp-t">${tit}</div>${corpo}${nota?`<div class="mt-muted" style="font-size:11.5px;margin-top:4px">${nota}</div>`:''}</div>`;
  const vazio = txt=>`<div class="ch-empty"><b>Ainda não há dados suficientes</b><span>${txt}</span></div>`;
  const charts = graf('Quilômetros por semana', comKm>=2 ? mtChart({tipo:'bar', pts:ptsKm, un:'km', dec:1}) : vazio('São necessárias corridas com distância em pelo menos 2 semanas.'))
    + graf('Ritmo médio por semana', ptsPace.filter(x=>x.v).length>=2 ? mtChart({tipo:'line', pts:ptsPace, un:'min/km', dec:2, fmt:v=>mtPaceStr(v).replace('/km',''), axFmt:v=>mtPaceStr(v).replace('/km','')}) : vazio('Aparece com corridas de 1 km ou mais em pelo menos 2 semanas.'), 'Ritmo mistura treinos leves e fortes; compare semanas parecidas.')
    + graf('Resistência — maior corrida sem parar', ptsCont.filter(x=>x.v).length>=2 ? mtChart({tipo:'line', pts:ptsCont, un:'min', dec:0}) : vazio('Aparece com corridas contínuas em pelo menos 2 semanas.'));
  // recordes x estimativas
  const rec = S.recordes || {};
  const linhasRec = RUN_REC_D.map(D=>{ const r = rec[D.k]; const est = ref && (D.km <= 21.1 || (M && M.nivel>=3)) ? rPrevisto(ref.vdot, D.km) : null;
    return `<tr><td>${D.nome}</td><td>${r ? `<b>${rFmtMin(r.min)}</b>${r.prova?' 🏅':''}<small>${mtFmtData(r.at,{day:'2-digit',month:'2-digit',year:'2-digit'})}${Math.abs(r.km-D.km)>0.05?` · ${mtFmtKm(r.km)} km`:''}</small>` : '<span class="mt-muted">—</span>'}</td><td>${est ? `${rFmtMin(est)}<small>estimativa</small>` : '<span class="mt-muted">—</span>'}</td></tr>`; }).join('');
  const recs = `<div class="rp-card"><div class="rp-t">Melhores marcas</div><table class="rp-tab"><tr><th></th><th>Registrado</th><th>Estimado</th></tr>${linhasRec}</table>
    <div class="mt-muted" style="font-size:11.5px;margin-top:6px">"Registrado" é só o que você correu de fato na distância (🏅 = prova). "Estimado" é cálculo${ref?` a partir ${ref.fonte}${ref.conf==='baixa'?' — aproximado':''}`:''}${ref && ref.reduzida?', já descontando a pausa recente':''}${ref?'':' e aparece quando houver dados confiáveis'}.</div></div>`;
  // zonas
  const zonas = ref ? `<div class="rp-card"><div class="rp-t">Seus ritmos de treino</div>${['regenerativo','leve','maratona','limiar','intervalado','velocidade'].map(k=>`<div class="rp-z"><div><b>${RZ_INFO[k].nome}</b><small>esforço ${RZ_INFO[k].rpe}/10 · ${RZ_INFO[k].txt}</small></div><div class="mono">${rFaixa(ref.zonas[k])}</div></div>`).join('')}
    <div class="mt-muted" style="font-size:11.5px;margin-top:6px">Calculados a partir ${ref.fonte}. Confiança: <b>${({alta:'alta',media:'média',baixa:'baixa (aproximação)'})[ref.conf]}</b>. Calor, subida e cansaço mudam o ritmo — nesses dias vale o esforço.</div></div>`
    : `<div class="rp-card"><div class="rp-t">Seus ritmos de treino</div><div class="run-orient-l">Ainda não há dados confiáveis para calcular ritmos — então os treinos vão por <b>esforço</b> (escala de 1 a 10) e pelo teste da conversa. Para liberar: registre algumas corridas leves com distância ou informe um tempo recente na avaliação.</div></div>`;
  // metas
  const MT = rMetas(ctx);
  const metas = `<div class="rp-card"><div class="rp-t">Metas</div>${MT.lista.map(m=>`<div class="rp-meta ${m.feita?'ok':''} ${m.proxima?'prox':''}"><div class="rp-meta-ic">${m.feita?'✓':m.proxima?'▶':''}</div><div style="flex:1"><div>${m.nome}${m.txtAlvo && !m.feita?` <small>${m.txtAlvo}</small>`:''}</div>${m.feita?`<small>conquistada em ${mtFmtData(m.quando,{day:'2-digit',month:'2-digit',year:'2-digit'})}</small>`:''}${m.proxima?`<div class="rp-bar"><i style="width:${Math.round((m.prog||0)*100)}%"></i></div>${(m.req||[]).length?`<div class="rp-req">${m.req.map(r=>`<span class="${r.ok?'ok':''}">${r.ok?'✓':'○'} ${r.txt}</span>`).join('')}</div>${m.req.every(r=>r.ok)?'<small style="color:var(--primary-2)">Preparação ok — o plano leva você até lá.</small>':''}`:''}`:''}</div></div>`).join('')}</div>`;
  // próximo nível
  let prox = '';
  if(M){ const c = rCriteriosNivel(ctx, M); if(c && !c.topo && c.lista.length) prox = `<div class="rp-card"><div class="rp-t">Para avançar para ${RN_NOME[Math.min(5, M.nivel+1)]}</div><div class="rp-req">${c.lista.map(r=>`<span class="${r.ok?'ok':''}">${r.ok?'✓':'○'} ${r.txt}</span>`).join('')}</div><div class="mt-muted" style="font-size:11.5px;margin-top:6px">O nível sobe por evolução comprovada nos registros — nunca só por tempo de uso.</div></div>`; }
  // provas e decisões
  const provas = (S.provas||[]).slice().reverse();
  const provasH = `<div class="rp-card"><div class="rp-t">Histórico de provas</div>${provas.length ? provas.map(pv=>`<div class="rp-z"><div><b>${mtFmtKm(pv.km)} km</b><small>${new Date(pv.at).toLocaleDateString('pt-BR')}</small></div><div class="mono">${rFmtMin(pv.min)}${pv.km>0?` · ${mtPaceStr(pv.min/pv.km)}`:''}</div></div>`).join('') : '<div class="mt-muted">Nenhuma prova registrada. No dia da prova, registre a corrida normalmente: ela entra aqui.</div>'}</div>`;
  const dec = M ? (M.hist||[]).slice(-6).reverse().filter(h=>h.decisao!=='pausa' || h===M.hist[M.hist.length-1]) : [];
  const decH = dec.length ? `<div class="rp-card"><div class="rp-t">Como o plano se ajustou</div>${dec.map(h=>`<div class="rp-dec"><small>semana de ${mtFmtData(h.sem)}</small><div>${({avancar:'⬆️ Avançou',manter:'➡️ Manteve',recuar:'⬇️ Aliviou',retomada:'🔁 Retomada',pausa:'⏸️ Pausa'})[h.decisao]||h.decisao}${h.mudou?`: ${mtEsc(h.mudou)}`:''}</div><small>${mtEsc(h.motivo||'')}</small></div>`).join('')}</div>` : '';
  const cab = M ? `<div class="rp-head"><div><small>Nível</small><b>${RN_NOME[M.nivel]}</b></div><div><small>Objetivo</small><b>${(RGOAL[rGoal(run.setup)]||{}).nome||'—'}</b></div></div>` : '';
  $('modal-inner').innerHTML = `<h3>📈 Evolução da corrida${dados?' — aluno':''}</h3>${cab}${tiles}${charts}${recs}${zonas}${metas}${prox}${provasH}${decH}
    <button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
// ---------- telas existentes ----------
// selos "Fácil" fixos (card do dia e detalhe da sessão) viram a intensidade real do treino
function _runSelos(){
  if(state.active !== 'run') return;
  const ws = ((state.modules.run||{}).plan||{}).workouts||[];
  document.querySelectorAll('.today, .detail-hero').forEach(card=>{
    const tit = card.querySelector('.today-title, h2'); if(!tit) return;
    const w = ws.find(x=>x.motor && x.name===tit.textContent.trim()); if(!w) return;
    card.querySelectorAll('.today-diff, .plan-badge').forEach(b=>{ b.textContent = w.motor.int; if(b.classList.contains('today-diff')) b.className = 'today-diff ' + (RT[w.motor.tipo].q ? 'diff-med' : 'diff-easy'); });
  });
}
function _runPosRender(){
  try{
    if(state.active !== 'run') return;
    const run = state.modules.run; const M = run && run.plan && run.plan.motor; if(!M) return;
    const ctx = runCtx(); const F = rSemanaFase(ctx, M, rSem());
    _runSelos();
    const ph = $('plan-phase'); if(ph) ph.textContent = RFASE[F.fase].nome;
    const pf = $('plan-foot');
    if(pf && !/primeiro treino|ainda não começou/.test(pf.textContent)){
      const rd = (run.setup||{}).raceDate; const dias = rd ? Math.round((new Date(rd+'T12:00:00') - Date.now())/DIA_MS) : null;
      pf.textContent = `${RN_NOME[M.nivel]} · ${RFASE[F.fase].desc}.${dias!=null && dias>=0 ? ` Prova em ${dias} dia${dias===1?'':'s'}.` : ''}`;
    }
  }catch(e){}
}
const _runSyncAntes = ()=>{ try{ if(state && state.modules && state.modules.run && state.modules.run.plan) runSync(); }catch(e){ console.log('runSync', e); } };
mtGancho('renderHome', { antes: _runSyncAntes, depois(){ _runPosRender(); } });
mtGancho('renderSessions', { antes: _runSyncAntes, depois(){
  try{
    const slot = $('sess-prestart');
    const velho = $('run-st'); if(velho) velho.remove();
    if(state.active==='run' && slot) slot.insertAdjacentHTML('afterend', runStatusCard());
    _runSelos();
  }catch(e){}
}});
// Progresso: atalho para o painel da corrida
mtGancho('renderPerf', { depois(){
  try{
    const old = $('perf-run-card'); if(old) old.remove();
    if(state.modules.run && ((state.modules.run.history||[]).length || state.modules.run.plan)){
      const evo = $('perf-evo');
      const html = `<div class="chart-card" id="perf-run-card" onclick="openRunPainel()" style="cursor:pointer"><div class="chart-head"><div class="chart-title">🏃 Evolução da corrida</div><span class="mt-muted" style="font-size:12px">abrir ›</span></div><div class="mt-muted" style="font-size:12.5px">Km por semana, ritmo, resistência, melhores marcas (registradas e estimadas), metas e provas.</div></div>`;
      if(evo) evo.insertAdjacentHTML('afterend', html);
    }
  }catch(e){}
}});

// =====================================================================
// 25. META ASSISTENTE — explica a corrida com os dados reais do aluno
// =====================================================================
function _rMA(){ const run = state.modules.run; const M = run && run.plan && run.plan.motor; if(!M) return null; const ctx = runCtx(); return { run, M, ctx, F: rSemanaFase(ctx, M, rSem()), p: rPerfil(ctx), ref: rReferencia(ctx) }; }
const RUN_SEM_PLANO = 'Você ainda não tem um plano de corrida. Em <b>Treinos → Montar plano de corrida</b> eu faço uma avaliação rápida e monto a primeira semana a partir do seu nível de hoje. 🏃';
function _rProximoTreino(run){
  const hoje = getDayIdx(); const ws = (run.plan.workouts||[]).slice().sort((a,b)=>a.dayIdx-b.dayIdx);
  return ws.find(w=>w.dayIdx===hoje) || ws.find(w=>w.dayIdx>hoje) || ws[0];
}
MA_ANSWERS.run_hoje = function(){
  const D = _rMA(); if(!D) return RUN_SEM_PLANO;
  const w = _rProximoTreino(D.run); if(!w || !w.motor) return 'Não há treino de corrida planejado para esta semana.';
  const ehHoje = w.dayIdx===getDayIdx();
  let t = `${ehHoje?'Hoje':`O próximo (${w.dayName.toLowerCase()})`} é <b>${mtEsc(w.name)}</b> — ${rFmtDurCurta(w.duration)}${w.distance?`, ${w.distance}`:''}.<br><br><b>Por quê:</b> ${mtEsc(w.motor.porque)}<br><br><b>Intensidade:</b> ${mtEsc(w.motor.alvo)}`;
  if(w.motor.nota) t += `<br><br>🦵 ${mtEsc(w.motor.nota)}`;
  if(w.motor.ajusteFadiga) t += `<br><br>🟡 Ajustado porque o último treino teve ${mtEsc(w.motor.ajusteFadiga)}.`;
  t += `<br><br>Você está no nível <b>${RN_NOME[D.M.nivel]}</b>, fase de <b>${RFASE[D.F.fase].nome.toLowerCase()}</b>.`;
  return t;
};
MA_ANSWERS.run_desenvolve = function(){
  const D = _rMA(); if(!D) return RUN_SEM_PLANO;
  const tipos = [...new Set((D.run.plan.workouts||[]).map(w=>w.motor && w.motor.tipo).filter(Boolean))];
  let t = `Agora você está desenvolvendo: <b>${RN_FOCO[D.M.nivel]}</b>.<br><br>Fase atual — <b>${RFASE[D.F.fase].nome}</b>: ${RFASE[D.F.fase].desc}.<br><br>Nesta semana:`;
  tipos.forEach(k=>{ t += `<br>• <b>${RT[k].nome}</b>: ${RT[k].obj}.`; });
  return t;
};
MA_ANSWERS.run_carga = function(){
  const D = _rMA(); if(!D) return RUN_SEM_PLANO;
  if(D.F.fase==='retomada') return `🔁 Você está em <b>retomada</b> (semana ${D.F.k} de ${D.F.N}, depois de ${D.F.pausa} dias sem correr). O volume está em ~${Math.round(D.F.fator*100)}% do que era antes e não tem treino forte. Isso vem antes de qualquer progressão: mesmo que fique fácil, a carga não sobe até a retomada terminar.`;
  const ult = (D.M.hist||[]).filter(h=>h.decisao!=='pausa').slice(-1)[0];
  if(!ult) return `Seu plano ainda está na primeira semana — a primeira avaliação acontece quando ela terminar. Eu olho: quantos treinos você fez, se completou, o esforço que marcou e se houve cansaço. Só então mudo <b>uma</b> coisa por vez (volume ou intensidade).`;
  const verbo = {avancar:'⬆️ subiu', manter:'➡️ ficou igual', recuar:'⬇️ ficou mais leve', retomada:'🔁 seguiu a retomada'}[ult.decisao] || ult.decisao;
  let t = `Na avaliação da semana de ${mtFmtData(ult.sem)}, a carga <b>${verbo}</b>.<br><br><b>Motivo:</b> ${mtEsc(ult.motivo)}.`;
  if(ult.mudou) t += `<br><b>O que mudou:</b> ${mtEsc(ult.mudou)}.`;
  t += `<br><br>Regra do plano: aumentos graduais (no máximo ~10% por semana), uma variável por vez, e nenhum aumento se o corpo mostrar cansaço.`;
  if(D.F.fase==='recuperacao') t += '<br><br>Esta semana é de <b>recuperação</b>: o volume menor é planejado, não é retrocesso.';
  return t;
};
MA_ANSWERS.run_avancar = function(){
  const D = _rMA(); if(!D) return RUN_SEM_PLANO;
  if(D.F.fase==='retomada') return `Primeiro termina a retomada (semana ${D.F.k} de ${D.F.N}). Depois disso eu volto a avaliar a sua evolução normalmente.`;
  const c = rCriteriosNivel(D.ctx, D.M);
  if(c.topo) return `Você já está no nível mais alto (<b>${RN_NOME[5]}</b>). A evolução agora vem de ajustes finos de volume, intensidade e recuperação.`;
  let t = `Você está no nível <b>${RN_NOME[D.M.nivel]}</b>. Para avançar para <b>${RN_NOME[D.M.nivel+1]}</b>:`;
  c.lista.forEach(r=>{ t += `<br>${r.ok?'✅':'⬜'} ${mtEsc(r.txt)}`; });
  if(D.M.nivel===0) t += `<br><br>Estágio atual: <b>${D.M.estagio}</b> de ${RUN_EST.length-1} (${rEstagioTxt(D.M.estagio)}). Cada estágio avança com 2 treinos completos e esforço até 7/10.`;
  if(D.M.nivel===1) t += `<br><br>Corrida contínua atual: <b>${D.M.contMin} min</b>. Ela aumenta quando você faz 2 corridas desse tempo sem parar, com esforço até 6/10.`;
  t += c.todos ? '<br><br>Tudo pronto: a mudança acontece na próxima avaliação semanal (mínimo de 3 semanas no nível).' : '<br><br>Não depende de tempo de app — depende do que os seus registros mostram.';
  return t;
};
MA_ANSWERS.run_recuperar = function(){
  const D = _rMA(); if(!D) return RUN_SEM_PLANO;
  const fad = rFadiga(D.ctx);
  if(D.F.fase==='retomada') return `Você está em retomada: já é uma fase de recuperação. Treinos leves, ~${Math.round(D.F.fator*100)}% do volume de antes.`;
  if(fad) return `Sim, agora é hora de <b>recuperar</b>: ${mtEsc(fad.motivo)}. O resto da semana já ficou leve. Se houver dor que muda sua passada ou que piora correndo, não corra — e procure avaliação se ela persistir.`;
  const ult = rCorridas(D.ctx).slice(-3);
  const rpe = ult.length ? ult.reduce((t,r)=>t+(+r.rpe||5),0)/ult.length : null;
  if(rpe && rpe >= 7.5) return `Seus últimos treinos ficaram com esforço médio de ${Math.round(rpe*10)/10}/10. Vale um dia extra de descanso ou um regenerativo curto antes do próximo treino forte.`;
  return `Pelos seus registros, não há sinal de cansaço acumulado${rpe?` (esforço médio recente: ${Math.round(rpe*10)/10}/10)`:''}. Siga o plano — ${D.F.fase==='recuperacao'?'e esta já é uma semana de recuperação planejada.':'a próxima semana de recuperação vem no ciclo.'}`;
};
MA_ANSWERS.run_meta = function(){
  const D = _rMA(); if(!D) return RUN_SEM_PLANO;
  const MT = rMetas(D.ctx); const goal = rGoal(D.run.setup);
  let t = `Objetivo: <b>${RGOAL[goal].nome}</b>.`;
  const rd = (D.run.setup||{}).raceDate;
  if(rd){ const dias = Math.round((new Date(rd+'T12:00:00') - Date.now())/DIA_MS); if(dias >= 0) t += ` Prova em <b>${dias} dia${dias===1?'':'s'}</b>.`; }
  if(MT.prox) t += `<br><br>Próxima meta: <b>${MT.prox.nome}</b> — ${Math.round((MT.prox.prog||0)*100)}% do caminho.${(MT.prox.req||[]).map(r=>`<br>${r.ok?'✅':'⬜'} ${mtEsc(r.txt)}`).join('')}`;
  const feitas = MT.lista.filter(m=>m.feita);
  if(feitas.length) t += `<br><br>Conquistadas: ${feitas.map(m=>m.nome.replace('Completar ','').replace('Correr ','')).join(' · ')}.`;
  if(D.ref && RGOAL[goal].km && D.M.nivel >= 2){ const est = rPrevisto(D.ref.vdot, RGOAL[goal].km); t += `<br><br>Estimativa hoje para ${RGOAL[goal].nome}: <b>${rFmtMin(est)}</b> (${mtPaceStr(est/RGOAL[goal].km)}) — calculada a partir ${D.ref.fonte}${D.ref.conf==='baixa'?', aproximada':''}.`; }
  else if(RGOAL[goal].km) t += '<br><br>Ainda não tenho dados confiáveis para estimar seu tempo de prova — nada de chute.';
  if(D.M.nivel < (RUN_NIVEL_MIN[goal]||0)) t += `<br><br>Para essa distância o plano ainda está construindo a base (nível atual: ${RN_NOME[D.M.nivel]}). Os treinos específicos entram quando você estiver pronto(a).`;
  return t;
};
MA_ANSWERS.run_ritmos = function(){
  const D = _rMA(); const ctx = D ? D.ctx : runCtx(); const ref = rReferencia(ctx);
  if(!ref) return 'Ainda não tenho dados confiáveis para calcular seus ritmos — e não vou inventar. Por enquanto: <b>leve</b> = você conversa em frases inteiras (esforço 3–4/10); <b>forte</b> = só palavras soltas (7–8/10). Registre corridas com distância e tempo, ou informe um tempo recente na avaliação, que eu calculo.';
  let t = `Seus ritmos (a partir ${ref.fonte}; confiança <b>${({alta:'alta',media:'média',baixa:'baixa — aproximação'})[ref.conf]}</b>):<br>`;
  ['regenerativo','leve','maratona','limiar','intervalado','velocidade'].forEach(k=>{ t += `<br>• <b>${RZ_INFO[k].nome}</b>: ${rFaixa(ref.zonas[k])} (esforço ${RZ_INFO[k].rpe}/10)`; });
  if(ref.reduzida) t += '<br><br>Já descontei a perda de condicionamento da sua pausa recente.';
  t += '<br><br>Calor, subida e cansaço mudam o ritmo: nesses dias, vale o esforço.';
  return t;
};
// perguntas em texto livre
const _maInterpretRunB14 = maInterpret;
maInterpret = function(txt){
  const t = mtNorm(txt);
  const run = /corr|longao|tiro|ritmo|pace|prova|5 ?km|10 ?km|21 ?km|42 ?km|maratona|caminhada/.test(t) || state.active==='run';
  if(run){
    if(/por ?que .*(treino|hoje)|por que (esse|este|o) treino|motivo do treino|explica.*treino/.test(t)) return 'run_hoje';
    if(/(o que|oque) (estou|to|eu estou) (desenvolvendo|trabalhando|treinando)|desenvolv/.test(t)) return 'run_desenvolve';
    if(/(aument|diminu|baix|sub|reduz)\w* (a |o )?(carga|volume|treino|km|minutos)|por que .*(mais leve|mais pesado|aumentou|diminuiu)/.test(t)) return 'run_carga';
    if(/quando .*(avanc|subir de nivel|proximo nivel|evoluir|aumentar)|hora de avancar|proximo estagio/.test(t)) return 'run_avancar';
    if(/(devo|preciso|hora de) (descansar|recuperar|parar)|estou cansad|to cansad|recupera/.test(t)) return 'run_recuperar';
    if(/(minha|a) meta|evolucao .*meta|falta .*(meta|prova)|como (estou|esta) .*(evolu|meta)/.test(t)) return 'run_meta';
    if(/zona|meus ritmos|qual (meu|o) ritmo|ritmo de treino|pace de treino/.test(t)) return 'run_ritmos';
  }
  return _maInterpretRunB14.apply(this, arguments);
};
[['🏃 Por que o treino de hoje?','run_hoje'],['📈 Quando vou avançar?','run_avancar'],['🎯 Como estou na meta?','run_meta'],['⏱️ Meus ritmos','run_ritmos']].forEach(([lbl,key])=>{ if(!MA_SUGGESTIONS.some(s=>s.key===key)) MA_SUGGESTIONS.push({lbl, key}); });

// =====================================================================
// 26. ADMINISTRAÇÃO — acompanhamento da corrida do aluno (somente leitura,
// mesmas permissões de antes: quem já via o aluno vê também isto)
// =====================================================================
mtGancho('openStudent', { depois(email){
  try{
    const u = usuariosCache[email]; const data = u && u.estadoApp; const run = data && data.modules && data.modules.run;
    const box = $('stud-content'); if(!box || !run) return;
    const ctx = runCtx(data); const M = run.plan && run.plan.motor; const p = rPerfil(ctx); const ref = rReferencia(ctx);
    const F = M ? rSemanaFase(ctx, M, rSem()) : null; const cump = M ? rCumprimento(ctx, M, 4) : null;
    const MT = rMetas(ctx); const fad = rFadiga(ctx);
    const lin = (k,v)=>`<div class="list-row" style="cursor:default"><span>${k}</span><b style="text-align:right">${mtEsc(v)}</b></div>`;   // Beta 33: dados do aluno escapados
    window.__admRunData = data;
    box.insertAdjacentHTML('beforeend', `<div class="section-lbl">🏃 Corrida</div><div class="card" style="padding:4px 12px">
      ${lin('Plano', run.plan ? `${(RGOAL[(run.setup||{}).goal]||{}).nome||'—'}${(run.setup||{}).raceDate?' · prova '+new Date(run.setup.raceDate+'T12:00:00').toLocaleDateString('pt-BR'):''}` : 'só registro de atividades')}
      ${M ? lin('Nível / fase', `${RN_NOME[M.nivel]} · ${RFASE[F.fase].nome}${F.fase==='retomada'?` ${F.k}/${F.N}`:''}`) : ''}
      ${M && M.nivel===0 ? lin('Estágio', `${M.estagio} de ${RUN_EST.length-1}`) : ''}${M && M.nivel===1 ? lin('Corrida contínua', `${M.contMin} min`) : ''}
      ${lin('Última corrida', p.ultima ? `${new Date(p.ultima.at).toLocaleDateString('pt-BR')} (${p.diasSemCorrer} dia${p.diasSemCorrer===1?'':'s'})` : '—')}
      ${lin('Média semanal (4 sem.)', p.minSemana!=null ? `${rFmtDurCurta(p.minSemana)}${p.kmSemana?` · ${mtFmtKm(p.kmSemana)} km`:''}` : '—')}
      ${lin('Cumprimento do plano', cump==null?'—':cump+'%')}
      ${lin('Próxima meta', MT.prox ? MT.prox.nome : 'todas conquistadas')}
      ${lin('Ritmos', ref ? `${({alta:'confiança alta',media:'confiança média',baixa:'aproximados'})[ref.conf]}` : 'por esforço (sem dados)')}
      ${fad ? lin('Alerta', `🟡 ${fad.motivo}`) : ''}
    </div><button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openRunPainel(window.__admRunData)">📈 Ver evolução da corrida</button>`);
  }catch(e){ console.log('admin corrida', e); }
}});

Object.assign(window, { runSync, openRunPainel, openRunSemana, runSemanaPrevia, runSemanaAplicar, runSemanaNormal, runLogCalc, runAtualizaDicaNivel, rMontarSemana, rNivelPotencial, rReferencia, rPerfil, rMetas, runCtx, rCriteriosNivel, rSemanaFase });
const _selectSessionRunB14 = window.selectSession;
window.selectSession = function(){ const r = _selectSessionRunB14.apply(this, arguments); try{ _runSelos(); }catch(e){} return r; };

// Retomada para quem está no módulo de corrida: o cartão da Home e o assistente usam o MESMO
// cálculo do plano de corrida (antes falavam em cargas e séries, que são da musculação).
function runTextoRetomada(F, M){
  return `Retomada da corrida depois de ${F.pausa} dias: semana ${F.k} de ${F.N}, com cerca de <b>${Math.round(F.fator*100)}%</b> do volume de antes e só ritmo leve, sem tiros. Mesmo que fique fácil, não acelere nem estique os treinos — a progressão volta depois da retomada.`;
}
const _renderHomeSmartRunB14 = renderHomeSmart;
renderHomeSmart = function(){
  _renderHomeSmartRunB14.apply(this, arguments);
  try{
    if(state.active !== 'run') return;
    const run = state.modules.run; const M = run && run.plan && run.plan.motor; if(!M) return;
    const el = $('home-smart'); if(!el) return;
    const F = rSemanaFase(runCtx(), M, rSem());
    const k = el.querySelector('.smart-k'), p = el.querySelector('.smart-p'), t = el.querySelector('.smart-t');
    if(F.fase === 'retomada'){
      if(!k || !/retomada/i.test(k.textContent)){
        el.innerHTML = `<div class="smart alert"><div style="display:flex;align-items:flex-start;gap:8px"><div class="smart-k" style="flex:1">Em retomada · semana ${F.k} de ${F.N}</div><button onclick="mtLS('mt_smart_fechado', String(mtDia0()));renderHomeSmart()" aria-label="Ocultar hoje" style="background:none;border:0;color:var(--text-mute);font-size:15px;padding:0 2px;cursor:pointer">✕</button></div>
          <div class="smart-t">De volta à corrida, com calma</div><div class="smart-p"></div>
          <div class="smart-a"><button class="btn btn-primary" onclick="goTab('sessions')">Ver treinos</button><button class="btn btn-ghost" onclick="mtPergunta('retomada')">Plano de retomada</button></div></div>`;
      } else if(k) k.textContent = `Em retomada · semana ${F.k} de ${F.N}`;
      const pp = el.querySelector('.smart-p'); if(pp) pp.innerHTML = runTextoRetomada(F, M);
    } else if(k && /retomada/i.test(k.textContent) && p){
      // retomada geral (musculação) mas a corrida já voltou ao normal: avisa sem contradizer o plano de corrida
      p.innerHTML = 'A corrida já saiu da retomada e segue o plano normal. ' + (state.modules.lift ? 'Na musculação, siga a orientação de cargas reduzidas desta semana.' : '');
    }
  }catch(e){}
};
const _maRetomadaRunB14 = MA_ANSWERS.retomada;
MA_ANSWERS.retomada = function(){
  try{
    const run = state.modules.run; const M = run && run.plan && run.plan.motor;
    if(M && (state.active === 'run' || !state.modules.lift)){
      const ctx = runCtx(); const F = rSemanaFase(ctx, M, rSem());
      if(F.fase !== 'retomada'){
        const p = rPerfil(ctx);
        return p.diasSemCorrer == null ? 'Você ainda não tem corridas registradas — então não é retomada, é começo! Siga a primeira semana do plano. 🏃'
          : `Sua última corrida foi há ${p.diasSemCorrer} dia${p.diasSemCorrer===1?'':'s'}. ${p.diasSemCorrer >= 4 ? 'É uma pausa curta: siga o plano normal, começando o primeiro treino bem leve.' : 'Isso é descanso normal.'} A retomada vale para pausas de 7 dias ou mais. ✅`;
      }
      const fat = RET_FAT[F.N-1];
      let t = `${M.retomada && M.retomada.voltou ? 'Você voltou depois de' : 'Faz'} <b>${F.pausa} dias</b> ${M.retomada && M.retomada.voltou ? 'sem correr' : 'sem correr'}. Plano de retomada da corrida:<br>`;
      fat.forEach((f,i)=>{ t += `<br><b>Semana ${i+1}</b> — ~${Math.round(f*100)}% do volume de antes, só treinos leves.${i+1===F.k?' ← <i>você está aqui</i>':''}`; });
      t += `<br><b>Depois</b> — eu avalio como foram essas semanas e só então volto a progredir, uma variável por vez.`;
      const ws = (run.plan.workouts||[]).filter(w=>w.motor);
      if(ws.length) t += `<br><br>Esta semana: ${ws.map(w=>`${w.dayName.toLowerCase()}, ${mtEsc(w.name.toLowerCase())} de ${rFmtDurCurta(w.duration)}`).join(' · ')}.`;
      if(M.retomada && M.retomada.antes && M.retomada.antes.nivel > M.nivel) t += `<br><br>Pela duração da pausa, o nível foi ajustado de ${RN_NOME[M.retomada.antes.nivel]} para ${RN_NOME[M.nivel]}. Você não começa do zero — o corpo recupera rápido o que já conquistou.`;
      else t += '<br><br>Você não começa do zero: o corpo recupera rápido o que já conquistou. Mas mesmo que fique fácil, não acelere nem estique os treinos durante a retomada.';
      if(state.modules.lift) t += '<br><br>Na musculação, a retomada tem regra própria de cargas — pergunte com o módulo de musculação ativo.';
      return t;
    }
  }catch(e){}
  return _maRetomadaRunB14.apply(this, arguments);
};

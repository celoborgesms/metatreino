
// ---------- 8. HOME INTELIGENTE ----------
// Um único card no topo que muda conforme o momento do aluno (iniciante, voltando, consistente,
// treino concluído, perto da prova). Não repete avisos que o app já mostra (dor, férias, pendências).
function contextoAluno(){
  const h = mtHist();
  const total = h.length;
  const last = total ? h[total-1].at : 0;
  const diasSem = last ? Math.round((mtDia0()-mtDia0(last))/DIA_MS) : null;
  const hojeFeito = h.some(x=>mtDia0(x.at)===mtDia0());
  // Beta 33: musculação + corrida contam os DIAS planejados das duas (antes: o maior dos dois números)
  const diasPlan = new Set(); ['lift','run'].forEach(m=>{ const mod = state.modules[m]; ((mod&&mod.plan&&mod.plan.workouts)||[]).forEach(w=>{ if(w && w.dayIdx) diasPlan.add(+w.dayIdx); }); });
  const planejados = diasPlan.size || Math.max(((state.modules.lift&&state.modules.lift.setup&&+state.modules.lift.setup.days)||0), ((state.modules.run&&state.modules.run.setup&&+state.modules.run.setup.days)||0)) || 3;
  const semIni = mtSemanaIni(Date.now());
  const semDias = mtDiasAtivos(semIni).size;
  const diaSemana = new Date().getDay()===0?7:new Date().getDay();
  let streak = 0; try{ streak = calcStreak(mtAllHist()); }catch(e){}
  let prova = null; try{ prova = daysToRace(); }catch(e){}
  const dor = !!(state.user && state.user.pain && state.user.pain.length);
  const ferias = (typeof vacationActive==='function') && vacationActive();
  const prs14 = Object.values(state.prs||{}).filter(p=>p && p.at >= Date.now()-14*DIA_MS).length;
  const hora = new Date().getHours();
  const nome = (typeof maName==='function') ? maName() : 'atleta';
  return { h, total, last, diasSem, hojeFeito, planejados, semDias, diaSemana, streak, prova, dor, ferias, prs14, hora, nome };
}
function _proxTreinoTxt(){
  try{
    const dias = ['segunda','terça','quarta','quinta','sexta','sábado','domingo'];
    const hoje = getDayIdx(); const set = new Set();
    ['lift','run'].forEach(m=>{ const mod = state.modules[m]; (mod&&mod.plan&&mod.plan.workouts||[]).forEach(w=>set.add(w.dayIdx)); });
    const ord = [...set].sort((a,b)=>a-b); if(!ord.length) return '';
    // Beta 33: o treino de hoje ainda não feito é o próximo (antes dizia "amanhã")
    const feitoHoje = mtHist().some(x=>mtDia0(x.at)===mtDia0());
    if(set.has(hoje) && !feitoHoje) return 'hoje';
    const prox = ord.find(d=>d>hoje) || ord[0];
    const dif = prox>hoje ? prox-hoje : prox+7-hoje;
    return dif===1 ? 'amanhã' : (dif<7 ? (prox===6||prox===7?'no ':'na ')+dias[prox-1] : 'na próxima semana');
  }catch(e){ return ''; }
}
function renderHomeSmart(){
  const wrap = document.querySelector('#scr-home .wrap'); if(!wrap) return;
  let el = $('home-smart');
  if(!el){ el = document.createElement('div'); el.id = 'home-smart'; wrap.appendChild(el); }
  const c = contextoAluno();
  const fechado = mtLS('mt_smart_fechado') === mtDia0()+'';
  if(c.ferias || c.dor || fechado){ el.innerHTML = ''; return; }
  let k = '', t = '', p = '', a = '', cls = '';
  const prox = _proxTreinoTxt();
  if(c.total === 0){
    k = 'Primeiros passos'; t = 'Seu primeiro treino é o mais importante';
    p = 'Comece com cargas leves e foque na técnica. Registre as séries: é com elas que o MetaTreino aprende o seu ritmo e ajusta as próximas sugestões.';
    a = `<button class="btn btn-primary" onclick="goTab('sessions')">Ver treino</button><button class="btn btn-ghost" onclick="goTab('library')">Como executar</button>`;
  } else if(c.hojeFeito){
    k = 'Treino concluído'; t = c.streak>=3 ? `Feito! São ${c.streak} dias seguidos.` : 'Feito por hoje. Agora é recuperação.';
    p = `Hidratação, uma refeição com proteína e uma boa noite de sono completam o treino.${prox?` Próxima sessão ${prox}.`:''}`;
    a = `<button class="btn btn-ghost" onclick="openWeekSummary()">Resumo da semana</button>`;
    cls = 'info';
  } else if(c.diasSem !== null && c.diasSem >= 4){
    k = 'Retomada'; t = `${c.diasSem} dias sem treinar — vamos voltar com calma`;
    p = 'Na primeira semana, use cerca de 70% das cargas de antes e menos séries. Voltar bem vale mais que voltar forte.';
    a = `<button class="btn btn-primary" onclick="goTab('sessions')">Treinar hoje</button><button class="btn btn-ghost" onclick="mtPergunta('retomada')">Plano de retomada</button>`;
    cls = 'alert';
  } else if(c.prova !== null && c.prova >= 0 && c.prova <= 21){
    k = 'Prova'; t = c.prova===0 ? 'É hoje! Boa prova.' : `Faltam ${c.prova} ${c.prova===1?'dia':'dias'} para a sua prova`;
    p = c.prova<=7 ? 'Semana de polimento: volume menor, sono em dia e nada de novidade no tênis ou na alimentação.' : 'Fase de manter: os treinos-chave continuam, o volume começa a cair perto da data.';
    a = `<button class="btn btn-ghost" onclick="mtPergunta('corrida_analise')">Como estou na corrida?</button>`;
    cls = 'warn';
  } else if(c.diaSemana >= 4 && c.semDias + (8-c.diaSemana) < c.planejados){
    k = 'Frequência'; t = `${c.semDias} de ${c.planejados} dias nesta semana`;
    p = 'A semana ainda dá para salvar parcialmente. Uma sessão hoje, mesmo curta, mantém o hábito vivo.';
    a = `<button class="btn btn-primary" onclick="goTab('sessions')">Treinar agora</button>`;
    cls = 'alert';
  } else if(c.prs14 > 0){
    k = 'Evolução'; t = `${c.prs14} ${c.prs14===1?'recorde pessoal':'recordes pessoais'} nas últimas duas semanas`;
    p = 'O trabalho está aparecendo. Mantenha a técnica e a progressão gradual — é ela que sustenta os próximos recordes.';
    a = `<button class="btn btn-ghost" onclick="mtPergunta('cargas')">Ver minhas cargas</button>`;
  } else if(c.semDias >= Math.min(c.planejados, c.diaSemana) || c.streak >= 3){
    k = 'Consistência'; t = c.streak>=3 ? `${c.streak} dias seguidos ativos` : `Semana em dia: ${c.semDias} de ${c.planejados}`;
    p = `Disciplina é isso: aparecer mesmo sem vontade.${prox&&!c.hojeFeito?` Seu próximo treino é ${prox}.`:''}`;
    a = `<button class="btn btn-ghost" onclick="mtPergunta('consistencia')">Ver minha consistência</button>`;
  } else {
    k = 'Para você hoje'; t = c.semDias ? `${c.semDias} ${c.semDias===1?'dia ativo':'dias ativos'} nesta semana` : 'Semana nova, página em branco';
    p = prox==='hoje' ? 'Seu treino de hoje ainda está em aberto. Mesmo uma sessão mais curta mantém o hábito.' : prox ? `Seu próximo treino é ${prox}. Se der para encaixar algo hoje, uma caminhada leve já ajuda na recuperação.` : 'Que tal começar hoje?';
    a = `<button class="btn btn-ghost" onclick="mtPergunta('analise_semana')">Análise da semana</button>`;
  }
  el.innerHTML = `<div class="smart ${cls}"><div style="display:flex;align-items:flex-start;gap:8px"><div class="smart-k" style="flex:1">${k}</div><button onclick="mtLS('mt_smart_fechado', String(mtDia0()));renderHomeSmart()" aria-label="Ocultar hoje" style="background:none;border:0;color:var(--text-mute);font-size:15px;padding:0 2px;cursor:pointer">✕</button></div><div class="smart-t">${t}</div><div class="smart-p">${p}</div><div class="smart-a">${a}</div></div>`;
}
function mtPergunta(key){
  try{ openAssistant(); }catch(e){}
  setTimeout(()=>{ try{ maAsk(key); }catch(e){} }, 350);
}
mtGancho('renderHome', { depois(){
  try{ renderHomeSmart(); }catch(e){ console.log('home smart:', e); }
}});

// ---------- 9. META ASSISTENTE ----------
// Tudo aqui é calculado por regras, com os dados reais do aluno. O assistente não finge
// ser uma IA externa (veja "quem é você", que já explica isso).
const MOTIVA = {
  retorno_longo:[
    'Faz {dias} dias desde o último treino, {nome}. Ninguém perde tudo nesse tempo: a memória muscular está aí, esperando.',
    'Pausa longa não apaga o que você já construiu. Hoje não é dia de recuperar o tempo perdido — é dia de reabrir a porta.',
    '{dias} dias parado? Acontece com todo mundo que treina de verdade. O que separa quem volta é só isto: voltar.',
    'O treino mais difícil é o primeiro depois da pausa. Depois dele, o segundo já parece normal.',
    'Volte pequeno, {nome}. Vinte minutos hoje valem mais que um treino perfeito que nunca acontece.',
    'Você já provou que consegue — são {n} treinos no histórico. Agora é só reconectar.',
    'O corpo lembra. Os primeiros minutos vão ser estranhos, os últimos vão parecer casa.'
  ],
  retorno_curto:[
    '{dias} dias sem treinar ainda é só uma pausa. Hoje é o dia de não deixar virar hábito.',
    'Dois ou três dias de descanso fazem bem. O quarto já começa a pesar — vamos quebrar isso hoje?',
    'Você não precisa de motivação para começar; a motivação aparece depois do aquecimento.',
    'Sem drama: retome do ponto onde parou. O plano continua te esperando.',
    'Um treino curto hoje mantém a corrente que você vem construindo.'
  ],
  consistente:[
    '{streak} dias seguidos ativos, {nome}. Isso não é sorte: é disciplina virando identidade.',
    'Semana com {sem} de {alvo} dias feitos. Você está fazendo o que a maioria só planeja.',
    'Consistência é o recurso mais subestimado do treino — e você está usando muito bem.',
    'Ninguém vê os dias em que você treinou sem vontade. Mas o resultado vai mostrar todos eles.',
    'Você está no ritmo. Agora o desafio é manter a qualidade, não aumentar a quantidade.',
    'Rotina construída é liberdade: você já não precisa decidir se vai treinar, só quando.',
    'Mais uma semana firme. O seu eu de três meses atrás ficaria orgulhoso.'
  ],
  evoluindo:[
    '{pr} {prTxt} nas últimas duas semanas. O progresso está deixando rastro, {nome}.',
    'Carga subindo com técnica é o melhor sinal que um treino pode dar. Continue assim.',
    'Você está mais forte do que estava no mês passado — e os números provam.',
    'Evolução não é linear, mas a sua linha está apontando para cima. Proteja isso com bom descanso.',
    'Cada recorde é a soma de treinos comuns bem feitos. Siga fazendo o comum muito bem.'
  ],
  iniciante:[
    'Todo atleta já esteve no treino número {n1}. O que importa é chegar ao próximo.',
    'No começo, o objetivo é um só: aprender o movimento e criar o hábito. A carga vem depois.',
    'Você está construindo a base, {nome}. Base bem feita é o que permite crescer sem se machucar.',
    'Os primeiros treinos ensinam mais sobre você do que sobre o exercício. Preste atenção em como o corpo responde.',
    'Comece leve e termine querendo mais. Essa é a receita para voltar amanhã.'
  ],
  treinou_hoje:[
    'Treino de hoje feito. A parte mais difícil já passou — agora é recuperar bem.',
    'Missão cumprida por hoje, {nome}. Água, comida de verdade e sono: é aí que o músculo cresce.',
    'Mais um treino no histórico. São {n} ao todo — cada um contou.',
    'Hoje você fez a sua parte. Amanhã o corpo faz a dele.',
    'Feito! Agora não estrague com uma noite mal dormida. 😉'
  ],
  desanimado:[
    'Dia sem vontade é normal. Combina comigo: faça só o aquecimento. Se depois dele quiser parar, pode.',
    'Motivação vai e volta; o plano fica. Hoje, cumpra a versão mínima do treino.',
    'Você não precisa estar animado para treinar — precisa só começar. A cabeça segue o corpo.',
    'Desânimo passa mais rápido em movimento do que no sofá. Dez minutos e a gente conversa.',
    'Treino ruim ainda é treino. Treino que não aconteceu não é nada.'
  ],
  prova:[
    'Faltam {prova} dias para a prova. O trabalho pesado já está guardado nas pernas — agora é chegar inteiro.',
    'Reta final para a prova: confie no treino que você fez. Não é hora de inventar.',
    'A prova é só a festa. O treino de verdade foi tudo o que você fez até aqui.'
  ],
  geral:[
    'O melhor treino é o que você faz, não o que você planeja.',
    'Pequeno hoje, grande amanhã. Confie no processo.',
    'Força não é só carga na barra: é aparecer quando ninguém está cobrando.',
    'Seu único adversário é quem você era no mês passado.',
    'Treinar é um presente que você dá para o seu futuro.',
    'Corpo forte, cabeça leve. Vamos?',
    'Disciplina é lembrar o que você quer de verdade.',
    'Um dia de cada vez. Hoje é o dia que importa.'
  ]
};
const MOTIVA_ACAO = {
  retorno_longo:'Sugestão prática: faça o treino de hoje com cerca de 70% das cargas de antes e 2 séries por exercício.',
  retorno_curto:'Sugestão prática: escolha o treino mais curto da semana e faça hoje.',
  consistente:'Sugestão prática: nesta semana, tente melhorar a técnica de um exercício em vez de subir carga em todos.',
  evoluindo:'Sugestão prática: mantenha a progressão pequena (2,5 a 5%) e respeite o descanso entre séries.',
  iniciante:'Sugestão prática: anote a carga de cada série — em duas semanas você vai ver a diferença.',
  treinou_hoje:'Sugestão prática: registre como se sentiu no treino; isso ajuda o app a ajustar as próximas sugestões.',
  desanimado:'Sugestão prática: coloque a roupa de treino agora. Só isso. O resto fica mais fácil.',
  prova:'Sugestão prática: durma bem nas duas noites antes da prova — a noite anterior costuma ser agitada.',
  geral:''
};
function _motivaCategorias(c){
  const out = [];
  let animo = null; try{ animo = (typeof maCtxGet==='function') ? maCtxGet('animo') : null; }catch(e){}
  if(animo === 'baixo') out.push('desanimado');
  if(c.hojeFeito) out.push('treinou_hoje');
  if(c.diasSem !== null && c.diasSem >= 8) out.push('retorno_longo');
  else if(c.diasSem !== null && c.diasSem >= 3) out.push('retorno_curto');
  if(c.prova !== null && c.prova >= 0 && c.prova <= 14) out.push('prova');
  if(c.prs14 > 0) out.push('evoluindo');
  if(c.total < 6) out.push('iniciante');
  if(c.streak >= 3 || (c.semDias >= Math.min(c.planejados, c.diaSemana) && c.semDias>0)) out.push('consistente');
  out.push('geral');
  return out;
}
function motivacaoContextual(){
  const c = contextoAluno();
  const cats = _motivaCategorias(c);
  let hist = []; try{ hist = JSON.parse(mtLS('mt_motiva_hist')||'[]'); }catch(e){}
  // primeira categoria é a mais relevante; às vezes (30%) usa a segunda, para variar sem perder contexto
  let cat = cats[0];
  if(cats.length > 2 && Math.random() < 0.3) cat = cats[1];
  const pool = MOTIVA[cat].map((m,i)=>({id:cat+':'+i, m})).filter(x=>!hist.includes(x.id));
  let escolha = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
  if(!escolha){ // todas desta categoria já foram vistas: pega a menos recente
    const ids = MOTIVA[cat].map((m,i)=>cat+':'+i);
    const id = ids.sort((a,b)=>hist.indexOf(a)-hist.indexOf(b))[0];
    escolha = {id, m: MOTIVA[cat][+id.split(':')[1]]};
  }
  hist = [escolha.id, ...hist.filter(x=>x!==escolha.id)].slice(0, 40);
  mtLS('mt_motiva_hist', JSON.stringify(hist));
  const prTxt = c.prs14===1?'recorde pessoal':'recordes pessoais';
  const txt = escolha.m.replace(/\{nome\}/g, c.nome).replace(/\{dias\}/g, c.diasSem).replace(/\{streak\}/g, c.streak).replace(/\{sem\}/g, c.semDias).replace(/\{alvo\}/g, c.planejados)
    .replace(/\{n\}/g, c.total).replace(/\{n1\}/g, c.total+1).replace(/\{pr\}/g, c.prs14).replace(/\{prTxt\}/g, prTxt).replace(/\{prova\}/g, c.prova);
  let acao = MOTIVA_ACAO[cat];
  if(!acao){ const px = _proxTreinoTxt(); if(px && !c.hojeFeito) acao = 'Seu próximo treino é '+px+'. Deixe a roupa separada desde já.'; }
  return txt + (acao ? '<br><br>' + acao : '');
}
// --- análise do mês (mês atual até hoje × mesmo período do mês anterior) ---
function _resumoPeriodo(a, b){
  const h = mtHist().filter(x=>x.at>=a && x.at<b);
  const km = t=>h.filter(x=>x._t===t).reduce((s,x)=>s+(+x.distance||0),0);
  return { sessoes:h.length, dias:new Set(h.map(x=>mtDia0(x.at))).size, min:Math.round(h.reduce((s,x)=>s+(+x.duration||0),0)), lift:h.filter(x=>x._t==='musculacao').length,
    kmRun:km('corrida'), kmWalk:km('caminhada'), kmBike:km('bike'), prs:Object.values(state.prs||{}).filter(p=>p&&p.at>=a&&p.at<b).length };
}
function _seta(a, b, un){ if(!b && !a) return ''; const d = a-b; if(Math.abs(d) < 0.05) return ' <span style="color:var(--text-mute)">(igual)</span>'; const ad = Math.abs(d); const v = un==='km' ? mtFmtKm(ad)+' km' : un==='min' ? (ad>=60 ? Math.floor(ad/60)+'h'+String(Math.round(ad%60)).padStart(2,'0') : Math.round(ad)+' min') : Math.round(ad); return ` <span style="color:${d>0?'var(--accent)':'var(--text-mute)'}">(${d>0?'+':'−'}${v})</span>`; }
function analiseMes(){
  const now = new Date(); const ini = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const iniAnt = new Date(now.getFullYear(), now.getMonth()-1, 1).getTime();
  const decorrido = Date.now() - ini;
  const A = _resumoPeriodo(ini, Date.now()+1), B = _resumoPeriodo(iniAnt, Math.min(ini, iniAnt+decorrido));
  if(!A.sessoes && !B.sessoes) return 'Ainda não tenho treinos suficientes neste mês ou no anterior para comparar. Registre alguns treinos e me pergunte de novo. 📆';
  const mes = now.toLocaleDateString('pt-BR',{month:'long'});
  const planejados = contextoAluno().planejados;
  const semanas = Math.max(1, (Date.now()-ini)/(7*DIA_MS));
  const adesao = Math.min(100, Math.round(A.dias/(planejados*semanas)*100));
  let t = `<b>Análise de ${mes} até hoje</b> (comparando com o mesmo período do mês passado):<br><br>`;
  t += `• Dias ativos: <b>${A.dias}</b>${_seta(A.dias,B.dias)}<br>• Sessões: <b>${A.sessoes}</b>${_seta(A.sessoes,B.sessoes)}<br>• Tempo de treino: <b>${Math.floor(A.min/60)}h${String(A.min%60).padStart(2,'0')}</b>${_seta(A.min,B.min,'min')}<br>`;
  if(state.modules.lift) t += `• Musculação: <b>${A.lift}</b> treinos${_seta(A.lift,B.lift)} · recordes: <b>${A.prs}</b><br>`;
  if(A.kmRun||B.kmRun) t += `• Corrida: <b>${mtFmtKm(A.kmRun)} km</b>${_seta(A.kmRun,B.kmRun,'km')}<br>`;
  if(A.kmWalk||B.kmWalk) t += `• Caminhada: <b>${mtFmtKm(A.kmWalk)} km</b>${_seta(A.kmWalk,B.kmWalk,'km')}<br>`;
  if(A.kmBike||B.kmBike) t += `• Bike: <b>${mtFmtKm(A.kmBike)} km</b>${_seta(A.kmBike,B.kmBike,'km')}<br>`;
  t += `<br>Adesão ao plano: <b>${adesao}%</b> dos dias planejados (${planejados} por semana).`;
  t += '<br><br>' + (adesao>=85 ? 'Mês muito consistente. Se quiser evoluir mais, o caminho agora é qualidade: técnica, progressão de carga e sono.'
    : adesao>=60 ? 'Boa base. O próximo passo é proteger os dias de treino na agenda — os que mais falham costumam ser sempre os mesmos.'
    : 'A frequência está abaixo do planejado. Vale ajustar o plano para menos dias por semana e cumprir 100% deles, em vez de planejar muito e fazer pouco.');
  return t;
}
// --- cargas: evolução, manutenção e estagnação por exercício (dados reais das séries) ---
function _e1rm(peso, reps){ peso=+peso||0; reps=+reps||0; if(!peso||!reps) return 0; return peso*(1+Math.min(reps,12)/30); }
function analiseCargas(){
  const desde = Date.now() - 49*DIA_MS;
  const res = [];
  Object.keys(state.progress||{}).forEach(id=>{
    const sess = (state.progress[id]||[]).filter(p=>p.date>=desde && p.sets && p.sets.length).sort((a,b)=>a.date-b.date);
    if(sess.length < 3) return;
    const best = sess.map(p=>({d:p.date, v:Math.max(0,...p.sets.map(s=>_e1rm(s.peso,s.reps))), peso:Math.max(0,...p.sets.map(s=>+s.peso||0))})).filter(x=>x.v>0);
    if(best.length < 3) return;
    const ini = best.slice(0,2).reduce((s,x)=>s+x.v,0)/2, fim = best.slice(-2).reduce((s,x)=>s+x.v,0)/2;
    const dif = (fim-ini)/ini*100;
    const span = (best[best.length-1].d - best[0].d)/DIA_MS;
    let nome = id; try{ nome = nomeDoEx(id) || id; }catch(e){}
    res.push({ id, nome, dif, span, n:best.length, pesoIni:best[0].peso, pesoFim:best[best.length-1].peso });
  });
  if(!res.length) return 'Ainda não tenho séries suficientes para analisar suas cargas. Preciso de pelo menos 3 sessões do mesmo exercício nas últimas semanas, com carga e repetições registradas. 📒';
  const sobe = res.filter(r=>r.dif>=2.5).sort((a,b)=>b.dif-a.dif);
  const parado = res.filter(r=>r.dif>-2.5 && r.dif<2.5 && r.span>=21);
  const cai = res.filter(r=>r.dif<=-5);
  const fmt = r=>`${mtEsc(r.nome)} (${r.pesoIni}→${r.pesoFim} kg)`;
  let t = `Analisei <b>${res.length}</b> ${res.length===1?'exercício':'exercícios'} das últimas 7 semanas (força estimada pela carga × repetições):<br><br>`;
  if(sobe.length) t += `📈 <b>Evoluindo:</b> ${sobe.slice(0,4).map(fmt).join(', ')}.<br><br>`;
  if(parado.length) t += `➖ <b>Estáveis há 3+ semanas:</b> ${parado.slice(0,4).map(fmt).join(', ')}.<br>Para destravar: mude a faixa de repetições por 3 semanas (ex.: de 8–10 para 12–15), ou troque por uma variação do mesmo movimento. Se o sono ou a alimentação estiverem fracos, comece por eles.<br><br>`;
  if(cai.length) t += `📉 <b>Em queda:</b> ${cai.slice(0,3).map(fmt).join(', ')}.<br>Pode ser fadiga acumulada. Uma semana com cerca de 10% menos carga costuma resolver. Se houver dor, priorize a recuperação.<br><br>`;
  if(!sobe.length && !parado.length && !cai.length) t += 'Os exercícios ainda têm pouco tempo de histórico para dizer se estagnaram. Continue registrando. ';
  t += 'Regra de ouro: só suba a carga quando completar todas as séries com boa técnica e ainda sobrar 1–2 repetições.';
  return t;
}
function analiseRetomada(){
  const c = contextoAluno();
  if(c.diasSem === null) return 'Você ainda não tem treinos registrados — então não é retomada, é começo! Comece pelo treino de hoje com cargas leves. 💪';
  if(c.diasSem < 4) return `Seu último treino foi há ${c.diasSem===0?'menos de um dia':c.diasSem+' '+(c.diasSem===1?'dia':'dias')}. Isso é descanso normal, não precisa de plano de retomada. Siga o plano como está. ✅`;
  const longa = c.diasSem >= 21;
  let t = `Faz <b>${c.diasSem} dias</b> desde o seu último treino. Plano de retomada sugerido:<br><br>`;
  t += `<b>Semana 1</b> — ${longa?'2 a 3':'3'} sessões, cerca de ${longa?'60%':'70%'} das cargas de antes, 2 séries por exercício, terminando cada série com folga (dava para fazer mais 3–4 repetições).<br>`;
  t += `<b>Semana 2</b> — ${longa?'75 a 85%':'85 a 90%'} das cargas, volte ao número normal de séries.<br>`;
  t += `<b>Semana ${longa?'3–4':'3'}</b> — volta ao plano normal. Aumente a carga só quando o exercício estiver confortável.<br>`;
  if(state.modules.run) t += `<br>Na corrida/caminhada: comece com ${longa?'metade':'cerca de 70%'} do volume semanal de antes, em ritmo de conversa. Aumente no máximo 10% por semana.`;
  t += '<br><br>Dor muscular nos primeiros dias é esperada. Dor articular ou pontual não é — nesse caso, pare e use o “Estou com dor”.';
  return t;
}
function analiseConsistencia(){
  const c = contextoAluno();
  const semanas = []; let ws = mtSemanaIni(Date.now()) - 7*7*DIA_MS;
  for(let i=0;i<8;i++){ semanas.push(mtDiasAtivos(ws, ws+7*DIA_MS).size); ws += 7*DIA_MS; }
  const completas = semanas.slice(0,7).filter(n=>n>=c.planejados).length;
  if(!c.total) return 'Ainda não há treinos para medir consistência. Volte a me perguntar depois da primeira semana. 🙂';
  const porDia = [0,0,0,0,0,0,0]; c.h.filter(x=>x.at>=Date.now()-56*DIA_MS).forEach(x=>{ const d=new Date(x.at).getDay(); porDia[d===0?6:d-1]++; });
  const nomes = ['segunda','terça','quarta','quinta','sexta','sábado','domingo'];
  const melhor = porDia.indexOf(Math.max(...porDia));
  const media = semanas.slice(0,7).reduce((s,n)=>s+n,0)/7;
  let t = `<b>Consistência das últimas 7 semanas completas:</b><br><br>`;
  t += `• Semanas cumprindo o plano (${c.planejados} dias): <b>${completas} de 7</b><br>• Média: <b>${media.toLocaleString('pt-BR',{maximumFractionDigits:1})}</b> dias ativos por semana<br>• Sequência atual: <b>${c.streak}</b> ${c.streak===1?'dia':'dias'}<br>• Dia em que você mais treina: <b>${nomes[melhor]}</b><br>`;
  t += `• Semana atual: <b>${semanas[7]}</b> de ${c.planejados} dias<br><br>`;
  t += completas>=6 ? 'Excelente regularidade. Esse é o fator que mais pesa no resultado a longo prazo.'
    : completas>=4 ? 'Boa regularidade, com algumas semanas incompletas. Ver quais dias costumam falhar ajuda a ajustar o plano.'
    : `Mais da metade das semanas ficou abaixo do plano. Talvez ${Math.max(2, Math.round(media))} dias por semana seja um plano mais realista agora — e cumprir 100% motiva mais do que planejar demais.`;
  return t;
}
function analiseCorrida(){
  const runs = mtHist().filter(x=>x._t==='corrida' && +x.distance>0 && +x.duration>0);
  if(runs.length < 3) return 'Preciso de pelo menos 3 corridas registradas com distância e tempo para analisar seu desempenho. 🏃';
  const pace = x=>(+x.duration)/(+x.distance);
  const ult = runs.slice(-4), ant = runs.slice(-8,-4);
  const pU = ult.reduce((s,x)=>s+pace(x),0)/ult.length;
  const pA = ant.length ? ant.reduce((s,x)=>s+pace(x),0)/ant.length : null;
  const sem = t0=>runs.filter(x=>x.at>=t0 && x.at<t0+7*DIA_MS).reduce((s,x)=>s+(+x.distance),0);
  const agora = Date.now();
  const km7 = runs.filter(x=>x.at>=agora-7*DIA_MS).reduce((s,x)=>s+(+x.distance),0);
  const km28 = runs.filter(x=>x.at>=agora-28*DIA_MS && x.at<agora-7*DIA_MS).reduce((s,x)=>s+(+x.distance),0)/3;
  const longa = runs.reduce((m,x)=>(+x.distance>+m.distance?x:m), runs[0]);
  let t = `<b>Sua corrida em números</b> (${runs.length} corridas registradas):<br><br>`;
  t += `• Ritmo médio das últimas ${ult.length}: <b>${mtPaceStr(pU)}</b>`;
  if(pA){ const d = (pA-pU)*60; t += Math.abs(d)<3 ? ' (estável)' : d>0 ? ` — <span style="color:var(--accent)">${Math.round(d)}s/km mais rápido</span> que as ${ant.length} anteriores` : ` — ${Math.round(-d)}s/km mais lento que as anteriores`; }
  t += `<br>• Volume nos últimos 7 dias: <b>${mtFmtKm(km7)} km</b>${km28?` (média das 3 semanas anteriores: ${mtFmtKm(km28)} km)`:''}<br>• Corrida mais longa: <b>${mtFmtKm(longa.distance)} km</b> em ${mtFmtData(longa.at)}<br><br>`;
  if(km28 > 0 && km7 > km28*1.5 && km7 >= 10) t += '⚠️ O volume desta semana está bem acima do seu normal (mais de 50%). Aumentos bruscos são uma causa comum de lesão — segure o crescimento perto de 10% por semana.';
  else if(pA && pA-pU > 0.05) t += 'O ritmo está melhorando. Mantenha a maioria das corridas leves (ritmo de conversa) — é ela que sustenta essa evolução.';
  else t += 'Para evoluir o ritmo: 80% das corridas leves e 1 treino de qualidade por semana (tiros ou ritmo forte controlado).';
  let prova = null; try{ prova = daysToRace(); }catch(e){}
  if(prova !== null && prova >= 0) t += `<br><br>🏁 Faltam <b>${prova}</b> dias para a prova.${prova<=10?' Fase de polimento: reduza o volume e mantenha um pouco de intensidade.':''}`;
  return t;
}
function respostaDesafio(){
  const e = eventoPrincipal(); if(!e) return 'Nenhum desafio temático ativo agora. Os níveis do mês continuam valendo na aba Desafios. 🎖️';
  const p = progressoEvento(e); const reg = (state.eventos||{})[e.key];
  const prox = missoesDoEvento(e).find(m=>!m.ok && !m.passou);
  let t = `O desafio de agora é <b>${mtEsc(e.nome)}</b> (${p.restam===0?'último dia':p.restam+' dias restantes'}).<br><br>`;
  t += reg ? `Você está com <b>${p.dias} de ${p.alvo}</b> dias ativos.${p.dias>=p.alvo?' Meta cumprida! 🎉':` Faltam ${p.alvo-p.dias}.`}` : `Você ainda não está participando. A meta prevista para você é de <b>${p.alvo}</b> dias ativos, calculada a partir do seu histórico — qualquer modalidade conta.`;
  if(prox) t += `<br><br>Próxima missão: <b>${mtEsc(prox.titulo)}</b> — ${mtEsc(prox.desc)}.`;
  t += `<br><br><button class="btn btn-primary" style="padding:8px 14px;font-size:13px" onclick="closeAssistant();goTab('challenges')">Abrir desafios</button>`;
  return t;
}
function ajudaApp(){
  return `Como o app está organizado:<br><br><b>Início</b> — treino de hoje, semana e recomendações.<br><b>Treinos</b> — suas sessões, o plano e a <b>Biblioteca</b> de exercícios (com vídeos e ficha técnica).<br><b>Desafios</b> — desafio temático, níveis do mês, conquistas e medalhas.<br><b>Progresso</b> — desempenho, gráficos e histórico.<br><b>Perfil</b> — peso, fotos de evolução, aparência, backup e conta.<br><br>E eu fico no botão redondo do canto. Pode me perguntar “análise do mês”, “minhas cargas estagnaram?”, “plano de retomada” ou “me motive”.`;
}
Object.assign(MA_ANSWERS, {
  motiva: motivacaoContextual,
  analise_mes: analiseMes,
  cargas: analiseCargas,
  retomada: analiseRetomada,
  consistencia: analiseConsistencia,
  corrida_analise: analiseCorrida,
  desafio_tematico: respostaDesafio,
  ajuda_app: ajudaApp
});
MA_SUGGESTIONS.unshift(
  {lbl:'📆 Análise do mês', key:'analise_mes'},
  {lbl:'📉 Minhas cargas estagnaram?', key:'cargas'},
  {lbl:'🎯 Minha consistência', key:'consistencia'},
  {lbl:'🏃 Análise da corrida', key:'corrida_analise'},
  {lbl:'🔁 Plano de retomada', key:'retomada'},
  {lbl:'🎖️ Desafio temático', key:'desafio_tematico'}
);
MA_SUGGESTIONS.push({lbl:'🧭 Onde fica cada coisa?', key:'ajuda_app'});
const _maInterpretOrig = maInterpret;
maInterpret = function(txt){
  const t = mtNorm(txt);
  const has = (...w)=>w.some(x=>t.includes(x));
  if(has('analise do mes','analise mensal','resumo do mes','como foi meu mes','como foi o mes','relatorio do mes','relatorio mensal','meu mes')) return 'analise_mes';
  if(!has('aumentar','subir','quando aument') && has('estagn','cargas','minha carga','minhas cargas','travei','travado','parei de evoluir','nao evoluo','evolucao de carga','plato')) return 'cargas';
  if(has('retomada','voltar a treinar','voltando a treinar','voltei a treinar','fiquei parado','muito tempo parado','recomecar','recomeçar')) return 'retomada';
  if(!has('cardiac','batimento') && has('consistencia','frequencia','regularidade','quantas semanas')) return 'consistencia';
  if(has('analise da corrida','analise de corrida','meu pace','meu ritmo','ritmo melhorou','pace melhorou','evolucao na corrida','evolui na corrida')) return 'corrida_analise';
  if(has('desafio tematico','desafio do mes','desafio atual','qual o desafio','desafios')) return 'desafio_tematico';
  if(has('onde fica','onde encontro','como uso o app','como usar o app','onde esta a biblioteca','cade a biblioteca','onde ficou','mudou de lugar')) return 'ajuda_app';
  if(has('me motiva','me motive','motivacao','estou desanimad','to desanimad','sem vontade de treinar','preguica de treinar')) return 'motiva';
  return _maInterpretOrig(txt);
};
// proatividade discreta: só quando o assistente não tem nada mais importante para dizer (máx. 1x/dia, regra original)
const _maNudgeOrig = maNudge;
maNudge = function(){
  const n = _maNudgeOrig();
  if(n) return n;
  try{
    if((state.ui&&state.ui.nudgeSeen) === new Date().toDateString()) return null;
    const e = eventoPrincipal(); const reg = e && (state.eventos||{})[e.key];
    if(e && reg && !reg.concluidoEm){ const p = progressoEvento(e); const falta = p.alvo - p.dias; if(falta>0 && falta<=2 && p.restam>=falta) return {text:`🎖️ Falta${falta>1?'m':''} ${falta} ${falta===1?'dia':'dias'} para concluir ${e.nome}`, tone:'important', dica:{completa: respostaDesafio()}}; }
  }catch(err){}
  return null;
};

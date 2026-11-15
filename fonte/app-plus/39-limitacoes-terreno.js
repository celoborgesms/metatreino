
// =====================================================================
// 39. Beta 40 — Treinos que respeitam as dores/limitações e o terreno da corrida
// =====================================================================
// Musculação (todas as modalidades): setup.lim = regiões marcadas no cadastro. Cada exercício que força a
// região é TROCADO por outro do mesmo grupo que o aluno consegue fazer com o equipamento dele (ou sai, se
// não houver), e o volume dos grupos envolvidos é contido. O aluno vê o que mudou (montagem do plano e
// tela do treino). Não é diagnóstico: o texto orienta a procurar avaliação se a dor persistir.
// Corrida: o terreno passa a mudar o plano de verdade (tipos de treino, metas de ritmo/velocidade, km).

const LIM_NOME = { joelho:'joelho', ombro:'ombro', lombar:'costas/lombar', punho:'punho/cotovelo', quadril:'quadril', tornozelo:'tornozelo/pé', semimpacto:'saltos e impacto' };
const LIM_REGRAS = {
  joelho:    { evitar:/agachamento (livre|no smith|b[uú]lgaro|jump|goblet|sum[ôo])|leg press|hack machine|cadeira extensora|afundo|step-up|nordic|cadeira contra parede|mountain climber/i,
               prefer:/flexora|stiff|eleva[çc][aã]o p[ée]lvica|ponte|coice|abdu|concha|adutora|panturrilha sentada/i, grupos:['Pernas','Glúteos'] },
  ombro:     { evitar:/desenvolvimento|arnold|pike|eleva[çc][aã]o (y|frontal)|mergulho|supino inclinado|supino reto com barra|crucifixo|pullover|crossover no cabo \(alto\)|flex[aã]o (arqueiro|inclinada)|tr[íi]ceps testa|acima da cabe[çc]a|tr[íi]ceps franc[êe]s|puxada aberta|encolhimento com barra/i,
               prefer:/supino na m[aá]quina \(hammer\)|supino reto com halteres|m[aã]os elevadas|crossover no cabo \(baixo\)|eleva[çc][aã]o lateral|face pull|posterior|corda|polia com barra|coice|puxada (frontal|com tri[aâ]ngulo)|remada/i, grupos:['Ombro','Peito','Tríceps'] },
  lombar:    { evitar:/levantamento terra|stiff|remada curvada|agachamento livre com barra|agachamento no smith|hack machine|nordic|superman|farmer|russian twist|abdominal (crunch|bicicleta)|eleva[çc][aã]o de pernas|remada cavalinho|desenvolvimento com barra|good morning/i,
               prefer:/m[aá]quina|cabo|polia|articulada|extensora|flexora|leg press horizontal|prancha|dead bug|pallof|ponte/i, grupos:['Costas','Pernas','Core'] },
  punho:     { evitar:/flex[aã]o|mountain climber|rosca direta com barra|rosca scott no banco|tr[íi]ceps testa \(barra|supino (reto|inclinado) com barra|supino pegada fechada|mergulho|pike|remada curvada com barra|farmer|encolhimento com barra/i,
               prefer:/m[aá]quina|cabo|polia|martelo|corda|halteres/i, grupos:['Bíceps','Tríceps','Peito'] },
  quadril:   { evitar:/agachamento (sum[ôo]|b[uú]lgaro|jump|livre com barra)|afundo|step-up|levantamento terra|mountain climber|nordic/i,
               prefer:/leg press horizontal|cadeira|mesa flexora|ponte|eleva[çc][aã]o p[ée]lvica/i, grupos:['Pernas','Glúteos'] },
  tornozelo: { evitar:/jump|step-up|afundo|panturrilha em p[ée]|panturrilha unilateral|panturrilha donkey|mountain climber|farmer|b[uú]lgaro/i,
               prefer:/panturrilha sentada|panturrilha no leg press|cadeira|mesa flexora|leg press/i, grupos:['Panturrilha','Pernas'] },
  semimpacto:{ evitar:/jump|mountain climber|burpee|salto|polichinelo|pliom/i, prefer:null, grupos:[] }
};
function limDoSetup(setup){ return ((setup && setup.lim) || []).filter(k=>LIM_REGRAS[k]); }
function limEquipOk(setup){
  const equip = (setup && setup.equip) || 'academia';
  const ef = equip==='basico' ? ['casa','halteres'] : equip==='academia' ? ['academia','halteres','casa'] : equip==='halteres' ? ['halteres','casa'] : ['casa'];
  return ex => equip === 'custom' ? (typeof podeFazerCom === 'function' ? podeFazerCom(ex, setup.equipList||[]) : true)
    : (ex.equip||[]).some(q=>ef.includes(q)) && (equip==='casa' || !ex.improv);
}
function limAdapta(list, setup){
  const lims = limDoSetup(setup); if(!lims.length || !Array.isArray(list)) return list;
  const qualLim = ex=>lims.find(k=>LIM_REGRAS[k].evitar.test(ex.name||''));
  const ok = limEquipOk(setup);
  const usados = new Set(list.map(e=>e.id));
  const out = []; const log = window.__limLog = window.__limLog || [];
  list.forEach(e=>{
    const k = qualLim(e); if(!k){ out.push(e); return; }
    const cat = EX_BANK.find(c=>c.name===e.part);
    let cands = cat ? cat.items.filter(x=>!qualLim(x) && ok(x) && !usados.has(slug(x.name))) : [];
    const pref = LIM_REGRAS[k].prefer;
    if(pref) cands = [...cands].sort((a,b)=>(pref.test(b.name)?1:0)-(pref.test(a.name)?1:0));
    const alt = cands[0];
    if(alt){
      usados.add(slug(alt.name));
      const reps = alt.iso ? (e.unit==='tempo' ? e.reps : '20-30s') : (e.unit==='tempo' ? '10-12' : e.reps);
      out.push(Object.assign({}, e, { id:slug(alt.name), name:alt.name, sub:alt.sub, equip:alt.equip, unit:alt.iso?'tempo':'reps', reps, lim:k, adaptadoDe:e.name }));
      log.push({ de:e.name, para:alt.name, lim:k });
    } else log.push({ de:e.name, para:null, lim:k });
  });
  // volume e intensidade dos grupos da região: no máximo 3 séries e nada de faixa de força pura (4–6)
  const grupos = new Set(lims.flatMap(k=>LIM_REGRAS[k].grupos));
  out.forEach(e=>{ if(!grupos.has(e.part)) return; if(+e.sets > 3) e.sets = 3; if(/^4-6$|^3-6$/.test(String(e.reps))) e.reps = '8-10'; });
  return out.length ? out : list.filter(e=>!qualLim(e));
}
const _buildLiftB40 = window.buildLiftExercises;
window.buildLiftExercises = function(parts, setup){
  const list = _buildLiftB40.apply(this, arguments);
  try{ return limAdapta(list, setup); }catch(e){ console.log('limitações:', e); return list; }
};
// o cardio "bônus" do fim do treino tinha agachamento com salto e polichinelo: sem impacto para quem marcou limitação
const _cardioFinB40 = window.cardioFinisherCard;
window.cardioFinisherCard = function(){
  const lims = limDoSetup(state.modules.lift && state.modules.lift.setup);
  if(!lims.some(k=>['joelho','tornozelo','quadril','semimpacto','lombar'].includes(k))) return _cardioFinB40.apply(this, arguments);
  return `<div class="card card-info card-row hl-warn" style="margin-top:14px;background:rgba(var(--accent-rgb),0.06)"><div class="card-icon">🔥</div><div><div class="card-title" style="color:var(--accent)">Bônus cardio (opcional, sem impacto)</div><div class="card-sub">Quer turbinar? Finalize com ~8 min de <b>bike ergométrica, elíptico ou caminhada rápida</b>, alternando 1 min mais forte e 1 min leve. Sem saltos, respeitando a limitação que você informou.</div></div></div>`;
};
// cadastro: lê o campo de limitações, leva para a calistenia (mesmas regiões) e grava no plano
function limLerTela(){ return [...document.querySelectorAll('#lift-lim .opt-multi.on')].map(o=>o.dataset.val); }
const _finishSetupB40 = window.finishSetup;
window.finishSetup = function(m){
  if(m === 'lift'){
    try{
      const lim = limLerTela(); window.__liftLim = lim; window.__limLog = [];
      const caliMap = new Set(); lim.forEach(k=>{ if(['joelho','ombro','punho'].includes(k)) caliMap.add(k); if(['joelho','tornozelo','semimpacto','quadril'].includes(k)) caliMap.add('semimpacto'); });
      document.querySelectorAll('#cali-limites .opt-multi').forEach(o=>o.classList.toggle('on', caliMap.has(o.dataset.val)));
    }catch(e){}
  }
  return _finishSetupB40.apply(this, arguments);
};
const _generatePlanB40 = window.generatePlan;
window.generatePlan = function(module, setup){
  if(module === 'lift' && setup && Array.isArray(window.__liftLim)){ setup.lim = window.__liftLim; window.__liftLim = null; }
  return _generatePlanB40.apply(this, arguments);
};
mtGancho('openSetupScreen', { depois(m){
  if(m !== 'lift') return;
  try{
    const st = state.modules.lift && state.modules.lift.setup;
    const lista = (st && (st.lim || (st.caliLimites||[]).filter(x=>x!=='semimpacto').concat((st.caliLimites||[]).includes('semimpacto')?['semimpacto']:[]))) || [];
    document.querySelectorAll('#lift-lim .opt-multi').forEach(o=>{ o.classList.toggle('on', lista.includes(o.dataset.val)); o.onclick = ()=>o.classList.toggle('on'); });
  }catch(e){}
}});
// a montagem do plano conta o que foi adaptado
const _buildingStepsB40 = window.buildingSteps;
window.buildingSteps = function(m, setup){
  const steps = _buildingStepsB40.apply(this, arguments);
  try{
    const lims = m === 'lift' ? limDoSetup(setup) : [];
    if(lims.length){
      const log = (window.__limLog||[]); const trocas = [...new Map(log.filter(x=>x.para).map(x=>[x.de, x])).values()];
      const txt = trocas.length ? `${trocas.length} ${trocas.length===1?'exercício trocado':'exercícios trocados'} (ex.: ${mtEsc(trocas[0].de)} → <b>${mtEsc(trocas[0].para)}</b>)` : 'nenhum exercício precisou ser trocado';
      const pos = Math.max(1, steps.length-1);
      steps.splice(pos, 0, { pri:1, txt:`Adaptando ao que você informou (${lims.map(k=>LIM_NOME[k]).join(', ')}): ${txt}` });
    }
  }catch(e){}
  return steps;
};
// tela do treino: aviso do que mudou por causa da limitação
mtGancho('renderSessionDetail', { depois(w){
  try{
    if(state.active !== 'lift' || !w) return;
    const ad = (w.exercises||[]).filter(e=>e.lim && e.adaptadoDe);
    const slot = $('session-detail-slot'); if(!slot || !ad.length || slot.querySelector('.lim-aviso')) return;
    const regs = [...new Set(ad.map(e=>LIM_NOME[e.lim]))].join(', ');
    slot.insertAdjacentHTML('afterbegin', `<div class="note note-info lim-aviso" style="margin-top:0"><div class="note-title">🩹 Treino adaptado (${mtEsc(regs)})</div>
      <div class="note-line">${ad.slice(0,4).map(e=>`<b>${mtEsc(e.name)}</b> no lugar de ${mtEsc(e.adaptadoDe)}`).join(' · ')}${ad.length>4?` · +${ad.length-4}`:''}.</div>
      <div class="note-line" style="margin-top:4px">Use cargas que não provoquem dor. Se a dor for persistente, forte ou piorar com o treino, procure avaliação profissional — o app não faz diagnóstico.</div></div>`);
  }catch(e){ console.log('aviso de limitação:', e); }
}});

// ---------- Corrida: o terreno muda o plano ----------
// Trilha: sem tiros curtos/velocidade (precisam de chão regular) → fartlek ou subidas; metas por ESFORÇO;
//         km previstos menores (o mesmo tempo rende menos na trilha). Treinos que dependem de ritmo
//         constante dizem que o melhor é um trecho plano e firme.
// Esteira: cada ritmo ganha a velocidade equivalente em km/h; subidas pela inclinação.
// Pista:   tiros em metros (já era), voltas de 400 m nos treinos contínuos; longão: sugestão de rua/parque.
// Asfalto: como antes (percurso plano, ladeira moderada para as subidas).
const _rComposicaoB40 = window.rComposicao;
window.rComposicao = function(ctx, M, F, n, opts){
  const L = _rComposicaoB40.apply(this, arguments);
  try{
    const setup = (ctx.run||{}).setup||{}; const ter = setup.terrain || 'asfalto';
    const lim = ((setup.aval||{}).lim||[]).length > 0;
    if(ter === 'trilha') return L.map(t=>['velocidade','tiros_curtos'].includes(t) ? (!L.includes('fartlek') ? 'fartlek' : (!lim && !L.includes('subida') ? 'subida' : 'tempo')) : t);
  }catch(e){}
  return L;
};
const RT_ZONA = { leve:'leve', longao:'leve', continua:'leve', regenerativo:'regenerativo', tempo:'limiar', limiar:'limiar', tiros_longos:'intervalado', tiros_curtos:'intervalado', velocidade:'velocidade' };
function _kmh(p){ return p > 0 ? (60/p).toFixed(1).replace('.',',') : null; }
const _rSessaoB40 = window.rSessao;
window.rSessao = function(tipo, o){
  const r = _rSessaoB40.apply(this, arguments);
  try{
    const ter = (o && o.terreno) || 'asfalto'; const Z = o && o.Z;
    const z = tipo === 'ritmo_prova' ? (typeof _ritmoProva === 'function' ? _ritmoProva(Z, o.goal) : null) : (Z && RT_ZONA[tipo] ? Z[RT_ZONA[tipo]] : null);
    r.terreno = ter;
    if(ter === 'trilha' && !['caminhada','camcorre'].includes(tipo)){
      const esf = (RZ_INFO[RT_ZONA[tipo]]||{}).rpe;
      if(esf) r.alvo = `por esforço: ${esf}/10 (na trilha o ritmo varia com o terreno)`;
      if(r.km) r.km = Math.round(r.km*0.85*10)/10;
      if(['ritmo_prova','tiros_longos','limiar','tempo'].includes(tipo)) r.orient.unshift('Este treino depende de ritmo constante: faça no trecho mais plano e firme da trilha (estrada de terra ou parque). Se não houver, vale o asfalto só neste dia.');
      if(tipo === 'longao' || tipo === 'leve') r.orient.push('Trilha: passos curtos nas descidas, olhar 3–4 m à frente e tênis com boa aderência. Caminhar nas subidas íngremes faz parte.');
    } else if(ter === 'esteira' && z && z.a && z.b){
      const v1 = _kmh(z.b), v2 = _kmh(z.a);
      if(v1 && v2) r.alvo = `${r.alvo} · na esteira: ${v1}–${v2} km/h`;
      if(!r.orient.some(t=>/inclina/.test(t))) r.orient.push('Na esteira, deixe 1% de inclinação para compensar a falta de vento.');
    } else if(ter === 'pista'){
      if(['tempo','limiar','leve','continua','regenerativo'].includes(tipo) && z && z.a){
        const min = (r.blocks[1].exs[0]||{}).min || 0; const p = (z.a + z.b)/2; const voltas = min && p ? Math.round(min/(p*0.4)) : 0;
        if(voltas >= 3) r.orient.push(`Na pista: ${min} min ≈ ${voltas} voltas de 400 m nesse ritmo.`);
      }
      if(tipo === 'longao') r.orient.push('Longões muito longos na pista cansam a cabeça: se puder, faça este na rua ou num parque — o plano não depende disso.');
    }
  }catch(e){ console.log('terreno:', e); }
  return r;
};

Object.assign(window, { limAdapta, limDoSetup, LIM_REGRAS, LIM_NOME });

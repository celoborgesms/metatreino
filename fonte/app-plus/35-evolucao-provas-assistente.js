// ---------- 35. META ASSISTENTE: EVOLUÇÃO DE NÍVEL, PREPARAÇÃO PARA PROVAS E BOAS-VINDAS (Beta 39) ----------
// 1. Evolução de nível. O app não sobe o nível sozinho: quando os critérios são cumpridos, o Meta Assistente
//    pergunta (balão + cartão no Início + conversa). "Aceitar" aplica pela lógica real do app; "Continuar como
//    está" mantém tudo e a mesma oferta só volta depois de um tempo (6 semanas; 12 na segunda recusa...).
//    Dá para mudar de ideia pedindo ao assistente ("quero subir de nível").
//    • Corrida: os critérios são os do motor (rCriteriosNivel / progressão de estágio e minutos contínuos,
//      parte 11). O motor só marca motor.ofertaNivel; a subida é rAplicarNivel, na semana seguinte, com as
//      4 semanas de base que o motor já dá a um nível novo.
//    • Musculação: critérios próprios (evoLiftAvaliar): tempo no nível, sessões, regularidade, aderência,
//      evolução das cargas nos exercícios principais, esforço (RPE 1–10 e relatos de "está fácil"),
//      recuperação (dor, pausas) e, para Avançado, força relativa. Facilidade sozinha nunca basta.
//      Ao aceitar: setup.level novo + generatePlan (o mesmo do app), histórico intacto, 2 semanas de
//      transição com as séries do nível anterior (buildLiftExercises) e depois o plano completo.
//    • Calistenia: continua com o nível recalculado pelas séries (parte 09) — não entra aqui.
// 2. Provas: orientação em marcos que dependem da distância (5/10/21/42 km), com os números do plano do aluno
//    (volume da semana, maior corrida recente, esforço). Cada marco aparece uma vez. Depois da prova, um pedido
//    para registrar o resultado (marcado como prova, entra nos recordes).
// 3. Boas-vindas: conta nova ou "Começar do zero" → o assistente se apresenta de novo, com os dados novos.

const EVO_NIV_LIFT = ['iniciante','intermediario','avancado'];
const EVO_NOME_LIFT = { iniciante:'Iniciante', intermediario:'Intermediário', avancado:'Avançado' };
const EVO_PAUSA_DIAS = 42;
const EVO_SEM = 7*DIA_MS;

function evoE(){
  state.evolucao = state.evolucao || {};
  ['lift','run'].forEach(m=>{ if(!state.evolucao[m]) state.evolucao[m] = {}; });
  if(!Array.isArray(state.evolucao.log)) state.evolucao.log = [];
  return state.evolucao;
}
function evoPodeOferecer(m, para){
  const r = state.evolucao && state.evolucao[m] && state.evolucao[m].recusa;
  return !(r && r.para === para && Date.now() < (+r.ate||0));
}

// ---- musculação: avaliação ----
function evoE1rm(entry){
  return Math.max(0, ...((entry && entry.sets)||[]).map(s=>{ const p = +s.peso||0, r = +s.reps||0; return p > 0 ? p*(1 + Math.min(r,12)/30) : r; }));
}
function evoLiftPrincipais(mod){
  const ids = new Map();
  ((mod.plan && mod.plan.workouts)||[]).forEach(w=>{ if(w.cali) return; (w.exercises||[]).forEach(e=>{
    try{ const ex = exBySlug(e.id) || e; const p = exPapel(Object.assign({}, ex, { name: ex.name || e.name }), e.part || ex.part);
      if(p && p.tier === 'principal') ids.set(e.id, e.name || ex.name); }catch(_){}
  }); });
  return ids;
}
function evoLiftProgressao(mod, desde){
  const out = { com:0, subiram:0, cairam:0, lista:[] };
  evoLiftPrincipais(mod).forEach((nome, id)=>{
    const ent = ((state.progress||{})[id]||[]).filter(p=>p && p.date >= desde && p.sets && p.sets.length).sort((a,b)=>a.date-b.date);
    if(ent.length < 4) return;
    const ini = Math.max(evoE1rm(ent[0]), evoE1rm(ent[1])), fim = Math.max(evoE1rm(ent[ent.length-1]), evoE1rm(ent[ent.length-2]));
    if(!(ini > 0)) return;
    const g = fim/ini - 1; out.com++; out.lista.push({ id, nome, ganho:g, fim });
    if(g >= mod.__evoProg) out.subiram++; if(g <= -0.05) out.cairam++;
  });
  return out;
}
// força relativa (só para Avançado): agachamento, supino e terra comparados com o peso do corpo
function evoForcaRelativa(lista){
  const pc = (typeof latestWeight === 'function' && latestWeight()) || (state.user && state.user.profile && state.user.profile.currentWeight) || 0;
  if(!(pc > 0)) return { achou:0, bate:0 };
  const fem = state.user && state.user.profile && state.user.profile.sex === 'f';
  const P = [ { re:/agachamento/, m: fem ? 0.9 : 1.25 }, { re:/supino/, m: fem ? 0.6 : 1.0 }, { re:/terra/, m: fem ? 1.1 : 1.5 } ];
  let achou = 0, bate = 0;
  P.forEach(p=>{ const c = lista.filter(x=>p.re.test(x.id)); if(!c.length) return; achou++; if(Math.max(...c.map(x=>x.fim)) >= pc*p.m) bate++; });
  return { achou, bate };
}
function evoLiftAvaliar(){
  const mod = state.modules && state.modules.lift; if(!mod || !mod.plan || !mod.setup) return null;
  const st = mod.setup; if(st.modalidade === 'calistenia') return null;
  const de = st.level || 'iniciante'; const i = EVO_NIV_LIFT.indexOf(de); if(i < 0 || i >= EVO_NIV_LIFT.length-1) return null;
  const para = EVO_NIV_LIFT[i+1];
  const cfg = i === 0
    ? { sem:8,  janela:8,  sessoes:16, regOk:5,  regDe:6,  porSem:2, ader:0.70, prog:0.075, nProg:3 }
    : { sem:16, janela:12, sessoes:36, regOk:10, regDe:12, porSem:3, ader:0.80, prog:0.05,  nProg:4 };
  const agora = Date.now(), dias = Math.max(1, +st.days || 3);
  const desde = +st.levelDesde || +mod.createdAt || agora;
  const semanasNivel = (agora - desde)/EVO_SEM;
  const hist = (mod.history||[]).filter(h=>h && h.at).sort((a,b)=>a.at-b.at);
  const iniJ = Math.max(agora - cfg.janela*EVO_SEM, desde);
  const sessoes = new Set(hist.filter(h=>h.at >= iniJ).map(h=>mtDia0(h.at))).size;
  const s0 = mtSemanaIni(agora);
  let reg = 0;
  for(let k = 1; k <= cfg.regDe; k++){ const a = s0 - k*EVO_SEM; const n = new Set(hist.filter(h=>h.at>=a && h.at<a+EVO_SEM).map(h=>mtDia0(h.at))).size; if(n >= Math.min(cfg.porSem, dias)) reg++; }
  const feitos4 = new Set(hist.filter(h=>h.at >= s0-4*EVO_SEM && h.at < s0).map(h=>mtDia0(h.at))).size;
  const ader = feitos4/(dias*4);
  const ult = hist.slice(-6);
  const rpes = ult.map(h=>+h.rpe).filter(n=>n >= 1 && n <= 10);
  const rpeMed = rpes.length >= 3 ? rpes.reduce((a,b)=>a+b,0)/rpes.length : null;
  const relatos = ((state.evolucao && state.evolucao.lift && state.evolucao.lift.facilEm) || []).filter(t=>t >= agora-21*DIA_MS).length;
  const facil = ult.filter(h=>+h.rpe && +h.rpe <= 4).length + relatos;
  const rpeAlto = hist.slice(-3).some(h=>+h.rpe >= 9);
  mod.__evoProg = cfg.prog;
  const pg = evoLiftProgressao(mod, iniJ); delete mod.__evoProg;
  const precisa = Math.min(cfg.nProg, Math.max(2, pg.com));
  const dor = !!(state.user && state.user.pain && state.user.pain.length);
  const datas = hist.filter(h=>h.at >= agora-28*DIA_MS).map(h=>h.at).concat([agora]);
  let maiorPausa = 0; for(let k = 1; k < datas.length; k++) maiorPausa = Math.max(maiorPausa, (datas[k]-datas[k-1])/DIA_MS);
  const pct = n=>Math.round(n*100);
  const C = [
    { ok: semanasNivel >= cfg.sem, txt:`${cfg.sem} semanas no nível atual (você está há ${Math.floor(semanasNivel)})` },
    { ok: sessoes >= cfg.sessoes, txt:`${cfg.sessoes} treinos nas últimas ${cfg.janela} semanas (feitos: ${sessoes})` },
    { ok: reg >= cfg.regOk, txt:`regularidade: ${cfg.porSem}+ treinos em ${cfg.regOk} das últimas ${cfg.regDe} semanas (cumpridas: ${reg})` },
    { ok: ader >= cfg.ader, txt:`${pct(cfg.ader)}% dos treinos planejados nas últimas 4 semanas (você: ${pct(ader)}%)` },
    { ok: pg.subiram >= precisa && pg.cairam === 0 && pg.com >= 2, txt:`cargas subindo em ${precisa}+ exercícios principais, sem nenhum caindo (subiram: ${pg.subiram} de ${pg.com} com dados)` },
    { ok: !rpeAlto && (rpeMed != null ? rpeMed <= 7 : facil >= 2), txt: rpeMed != null ? `esforço médio até 7/10 nos últimos treinos (você: ${String(Math.round(rpeMed*10)/10).replace('.',',')})` : 'treinos avaliados como fáceis ou moderados' },
    { ok: !dor && maiorPausa < 10, txt: dor ? 'sem dor registrada (há uma dor registrada agora)' : `recuperação em dia, sem pausas de 10+ dias (maior: ${Math.round(maiorPausa)} dias)` }
  ];
  if(i === 1){ const fr = evoForcaRelativa(pg.lista);
    C.push(fr.achou ? { ok: fr.bate >= Math.min(2, fr.achou), txt:`força em relação ao peso do corpo nos básicos (agachamento, supino, terra): ${fr.bate} de ${fr.achou} na referência` }
                    : { ok: pg.subiram >= cfg.nProg+1, txt:`sem agachamento/supino/terra registrados: evolução em ${cfg.nProg+1}+ principais` }); }
  const motivos = [];
  if(pg.subiram) motivos.push(`cargas subindo em ${pg.subiram} exercícios principais`);
  if(rpeMed != null && rpeMed <= 6) motivos.push(`esforço médio de ${String(Math.round(rpeMed*10)/10).replace('.',',')}/10`); else if(facil >= 2) motivos.push('treinos saindo fáceis');
  motivos.push(`${sessoes} treinos em ${cfg.janela} semanas`);
  return { de, para, pronto: C.every(c=>c.ok), lista:C, motivos };
}

// ---- ofertas (as duas modalidades) ----
let _evoAt = 0;
function evoAtualizar(forcar){
  if(!forcar && Date.now() - _evoAt < 60000) return;
  _evoAt = Date.now();
  try{
    if(typeof cadastroPronto === 'function' && !cadastroPronto()) return;
    const E = evoE(); let mudou = false;
    // musculação
    const r = evoLiftAvaliar();
    if(r && r.pronto && !E.lift.oferta && evoPodeOferecer('lift', r.para)){ E.lift.oferta = { de:r.de, para:r.para, em:Date.now(), motivos:r.motivos }; mudou = true; }
    else if(E.lift.oferta && (!r || !r.pronto || r.para !== E.lift.oferta.para)){ delete E.lift.oferta; mudou = true; }   // a evidência sumiu: a oferta sai
    // corrida (quem decide é o motor)
    const M = state.modules.run && state.modules.run.plan && state.modules.run.plan.motor;
    if(M && M.ofertaNivel != null){
      if(!E.run.oferta || E.run.oferta.para !== M.ofertaNivel){ E.run.oferta = { de:M.nivel, para:M.ofertaNivel, em:M.ofertaEm || Date.now(), motivos: M.ofertaMotivo ? [M.ofertaMotivo] : [] }; mudou = true; }
    } else if(E.run.oferta){ delete E.run.oferta; mudou = true; }
    if(mudou) saveData();
    evoTransicaoFim();
  }catch(e){ console.log('evolução:', e); }
}
function evoNomeNivel(m, n){ return m === 'run' ? (RN_NOME[n] || '') : (EVO_NOME_LIFT[n] || n); }
function evoOfertaPendente(){
  const E = state.evolucao || {}; if(state.user && state.user.pain && state.user.pain.length) return null;
  if(typeof vacationActive === 'function' && vacationActive()) return null;
  const m = (E[state.active] && E[state.active].oferta) ? state.active : (E.lift && E.lift.oferta) ? 'lift' : (E.run && E.run.oferta) ? 'run' : null;
  return m ? { m, o: E[m].oferta } : null;
}
function evoOfertaHtml(m){
  const o = state.evolucao && state.evolucao[m] && state.evolucao[m].oferta; if(!o) return '';
  const mod = m === 'run' ? 'corrida' : 'musculação';
  const muda = m === 'run'
    ? `A partir da próxima semana, foco em ${RN_FOCO[o.para] || 'um degrau a mais'}. As 4 primeiras semanas do nível novo são de base, sem salto de volume.`
    : `O plano ganha a seleção de exercícios do nível ${EVO_NOME_LIFT[o.para]}. Nas 2 primeiras semanas as séries continuam as de hoje; depois o plano fica completo. Suas cargas seguem o seu histórico.`;
  return `Percebi que seus treinos de ${mod} estão ficando mais fáceis e que você vem evoluindo bem${o.motivos && o.motivos.length ? ` (${o.motivos.join(', ')})` : ''}. Que tal avançarmos para o nível <b>${evoNomeNivel(m, o.para)}</b>?<br><br>
    <b>O que muda:</b> ${muda} Seu histórico e suas conquistas não mudam.
    <div class="evo-acoes"><button class="btn btn-primary" onclick="evoResponder('${m}',true)">Aceitar</button><button class="btn btn-ghost" onclick="evoResponder('${m}',false)">Continuar como está</button></div>
    <button class="link-mais" style="margin-top:6px" onclick="evoPorque('${m}')">Por que agora?</button>`;
}
function evoResponder(m, aceitar){
  const E = evoE(); const o = E[m] && E[m].oferta;
  const aberto = !!document.getElementById('ma-input');
  const diz = t=>{ if(aberto){ try{ maThread.push({ who:'user', txt: aceitar ? 'Aceitar' : 'Continuar como está' }); renderAssistant(); maReply(t); }catch(e){ toast(t.replace(/<[^>]+>/g,'')); } } else toast(t.replace(/<[^>]+>/g,'').slice(0,140)); };
  if(!o){ diz('Essa sugestão já foi respondida. Se quiser rever, me peça "quero subir de nível".'); return; }
  E.log.push({ m, de:o.de, para:o.para, d: aceitar ? 'aceitou' : 'continuar', em:Date.now() }); E.log = E.log.slice(-30);
  delete E[m].oferta;
  let msg;
  if(aceitar){
    delete E[m].recusa;
    msg = m === 'run' ? evoRunAplicar(o.para) : evoLiftAplicar(o.para);
  } else {
    E[m].recusas = (E[m].recusas||0) + 1;
    E[m].recusa = { para:o.para, em:Date.now(), ate: Date.now() + EVO_PAUSA_DIAS*E[m].recusas*DIA_MS };
    const M = m === 'run' && state.modules.run && state.modules.run.plan && state.modules.run.plan.motor;
    if(M){ delete M.ofertaNivel; delete M.ofertaMotivo; delete M.ofertaEm; }
    msg = `Combinado: seguimos no nível <b>${evoNomeNivel(m, o.de)}</b>, sem mudar nada. Não vou insistir nisso; se mudar de ideia, é só me dizer "quero subir de nível".`;
  }
  saveData();
  try{ if(typeof renderHome === 'function' && state.ui && state.ui.tab === 'home') renderHome(); }catch(e){}
  diz(msg);
}
function evoLiftAplicar(para){
  const mod = state.modules.lift; const de = mod.setup.level || 'iniciante';
  mod.setup = Object.assign({}, mod.setup, { level:para, levelDesde:Date.now(), transicao:{ de, para, ate: Date.now() + 14*DIA_MS } });
  mod.plan = generatePlan('lift', mod.setup);
  try{ state.lastVarWeek = semanaLocalId(); }catch(e){}
  regenAllPlans();
  return `Pronto: musculação no nível <b>${EVO_NOME_LIFT[para]}</b>. Nas próximas 2 semanas as séries continuam as de hoje enquanto você se adapta aos exercícios novos; depois disso o plano fica completo. Seu histórico e suas cargas continuam.`;
}
function evoTransicaoFim(){
  const mod = state.modules.lift; const t = mod && mod.setup && mod.setup.transicao;
  if(!t || t.fim || Date.now() < (+t.ate||0)) return;
  mod.setup.transicao = Object.assign({}, t, { fim:true });
  mod.plan = generatePlan('lift', mod.setup);
  try{ state.lastVarWeek = semanaLocalId(); }catch(e){}
  regenAllPlans(); saveData();
  try{ toast(`Transição concluída: seu plano ${EVO_NOME_LIFT[mod.setup.level]||''} agora está completo.`); }catch(e){}
}
function evoRunAplicar(para){
  const run = state.modules.run; const M = run.plan.motor;
  rAplicarNivel(M, para, rSem(Date.now()) + 7*DIA_MS);
  run.setup.level = RN_LEG[para]; run.plan.level = RN_LEG[para];
  return `Pronto: corrida no nível <b>${RN_NOME[para]}</b> a partir da próxima semana. Foco: ${RN_FOCO[para]}. As primeiras semanas são de base, sem salto de volume.`;
}
function evoPorque(m){
  let L = [];
  if(m === 'run'){
    const M = state.modules.run && state.modules.run.plan && state.modules.run.plan.motor;
    if(M && M.nivel >= 2){ const c = rCriteriosNivel(runCtx(), M); L = (c.lista||[]).map(x=>(x.ok?'✓ ':'✗ ')+x.txt); }
    else if(M && M.ofertaMotivo) L = ['✓ ' + M.ofertaMotivo];
  } else { const r = evoLiftAvaliar(); if(r) L = r.lista.map(x=>(x.ok?'✓ ':'✗ ')+x.txt); }
  const t = L.length ? `Eu não olho só a quantidade de treinos. Para sugerir o próximo nível, tudo isto precisa estar em dia:<br>${L.join('<br>')}` : 'No momento não há uma sugestão de nível em aberto.';
  if(document.getElementById('ma-input')){ maThread.push({ who:'user', txt:'Por que agora?' }); renderAssistant(); maReply(t); }
  else { try{ openAssistant(); setTimeout(()=>maReply(t), 400); }catch(e){} }
}
// "quero subir de nível", "mudei de ideia", "está fácil demais"
function evoComando(t){
  const m = state.active === 'run' ? 'run' : 'lift';
  if(!state.modules[m]) return null;
  const E = evoE();
  if(/f[aá]ce?il demais|t[aá] f[aá]cil|est[aá] (muito )?f[aá]cil|muito f[aá]cil|treino (est[aá] )?leve demais/.test(t)){
    E[m].facilEm = (E[m].facilEm||[]).concat([Date.now()]).slice(-10); saveData();
    evoAtualizar(true);
    if(E[m].oferta) return { done:true, msg:'Anotado. E os números confirmam: ' + evoOfertaHtml(m) };
    const falta = evoFaltam(m);
    return { done:true, msg:`Anotei que está fácil. Isso entra na conta, mas sozinho não basta para subir de nível — facilidade num dia não é prontidão do corpo.${falta?`<br><br>Ainda falta:<br>${falta}`:''}<br><br>${m==='lift'?'Enquanto isso, quando a última série sair com 2+ repetições sobrando, suba a carga no próximo treino.':'Enquanto isso, o plano já aumenta volume e qualidade quando a semana sai completa e confortável.'}` };
  }
  if(/(subir|avan[cç]ar|passar) (de |o |para o pr[oó]ximo )?n[ií]vel|pr[oó]ximo n[ií]vel|mudei de ideia/.test(t)){
    if(E[m].oferta) return { done:true, msg: evoOfertaHtml(m) };
    // mudou de ideia depois de "continuar como está": se os critérios continuam valendo, a oferta volta já
    const M = m === 'run' && state.modules.run.plan && state.modules.run.plan.motor;
    let pronto = false, para = null;
    if(m === 'lift'){ const r = evoLiftAvaliar(); pronto = !!(r && r.pronto); para = r && r.para; }
    else if(M){ if(M.nivel >= 2 && M.nivel < RN_NOME.length-1){ const c = rCriteriosNivel(runCtx(), M); pronto = !!c.todos; } else if(E.run.recusa){ pronto = E.run.recusa.para === M.nivel+1; } para = M.nivel + 1; }
    if(pronto && para != null){
      delete E[m].recusa;
      if(m === 'run'){ M.ofertaNivel = para; M.ofertaMotivo = 'você pediu para rever'; M.ofertaEm = Date.now(); }
      _evoAt = 0; evoAtualizar(true);
      if(m === 'lift' && !E.lift.oferta){ const r = evoLiftAvaliar(); if(r) E.lift.oferta = { de:r.de, para:r.para, em:Date.now(), motivos:r.motivos }; }
      saveData();
      return { done:true, msg: evoOfertaHtml(m) };
    }
    const falta = evoFaltam(m);
    return { done:true, msg:`Ainda não é a hora de subir com segurança.${falta?`<br><br>Falta:<br>${falta}`:''}<br><br>Assim que estiver tudo em dia eu te aviso — e a decisão continua sendo sua.` };
  }
  return null;
}
function evoFaltam(m){
  if(m === 'lift'){ const r = evoLiftAvaliar(); return r ? r.lista.filter(c=>!c.ok).map(c=>'• '+c.txt).join('<br>') : ''; }
  const M = state.modules.run && state.modules.run.plan && state.modules.run.plan.motor; if(!M) return '';
  const c = rCriteriosNivel(runCtx(), M); return (c.lista||[]).filter(x=>!x.ok).map(x=>'• '+x.txt).join('<br>');
}

// ---- 2. preparação para provas ----
const PROVA_MARCOS = { '5km':[7,3,1], '10km':[10,4,1], '21km':[14,7,2], '42km':[21,10,3,1] };
const PROVA_CHEGADA = { '5km':'45 min', '10km':'45 min', '21km':'1 hora', '42km':'1 hora a 1h30' };
function provaDist(){ const g = ((state.modules.run||{}).setup||{}).goal; return PROVA_MARCOS[g] ? g : '5km'; }
function provaKm(d){ return ({ '5km':'5 km', '10km':'10 km', '21km':'meia maratona', '42km':'maratona' })[d]; }
function provaMarcoAtual(dias, d){
  const mk = PROVA_MARCOS[d]; if(dias == null || dias < 0 || dias > mk[0]) return null;
  return mk.filter(x=>dias <= x).sort((a,b)=>a-b)[0];
}
function provaDados(){
  const ctx = runCtx(); const runs = rCorridas(ctx).filter(r=>r.at >= Date.now()-42*DIA_MS);
  const maiorKm = runs.reduce((m,r)=>Math.max(m, +r.distance||0), 0);
  const rp = runs.slice(-5).map(r=>+r.rpe).filter(Boolean);
  const rpe = rp.length >= 3 ? rp.reduce((a,b)=>a+b,0)/rp.length : null;
  const M = state.modules.run && state.modules.run.plan && state.modules.run.plan.motor;
  const s = rSem(Date.now());
  const volAgora = M && M.semanas && M.semanas[s] ? M.semanas[s].vol : null;
  const volAntes = M && M.semanas && M.semanas[s-7*DIA_MS] ? M.semanas[s-7*DIA_MS].vol : null;
  const fase = M && M.semanas && M.semanas[s] && M.semanas[s].F ? M.semanas[s].F.fase : null;
  const porSem = Math.round(runs.filter(r=>r.at >= Date.now()-28*DIA_MS).length/4*10)/10;
  return { maiorKm, rpe, volAgora, volAntes, fase, porSem };
}
function provaOrientacao(dias){
  const d = provaDist(); const marco = provaMarcoAtual(dias, d); if(marco == null) return null;
  const D = provaDados(); const nome = provaKm(d);
  const vespera = `<b>Véspera:</b> descanso ou trote de 10–15 min com 3 acelerações curtas. Separe tudo hoje (número de peito, chip, tênis e roupa já testados). Jantar conhecido, sem exagero, e cama cedo. Chegue ${PROVA_CHEGADA[d]} antes e aqueça ${d==='5km'||d==='10km'?'10 min de trote + 3 acelerações':'5–10 min bem leve'}.`;
  const T = {
    '5km': { 7:'Semana da prova: o volume cai cerca de 20–30%. Mantenha um treino curto com 4–6 acelerações de 20 s; nada de treino longo ou forte novo.',
             3:'Faltam 3 dias: só rodagens leves e curtas (20–30 min). Último estímulo: 4 acelerações de 15–20 s. Use o tênis e a roupa da prova num treino.',
             1: vespera },
    '10km':{ 10:'Começa o polimento: nos próximos dias o volume cai uns 30%. O último treino de ritmo acontece até 5–6 dias antes da prova, mais curto que o normal.',
             4:'Faltam 4 dias: rodagens leves de 25–40 min e, no máximo, uma sessão curta com trechos no ritmo de prova. Nada de treino de pernas pesado na musculação.',
             1: vespera },
    '21km':{ 14:'Duas semanas para a meia: o último longão (mais curto que o seu maior) fica para este fim de semana. Depois disso o volume cai uns 40% até a prova, mantendo trechos curtos de ritmo.',
             7:'Semana da meia: volume perto de metade do normal e um treino curto no ritmo de prova (ex.: 3 × 1 km). Nos 2 dias antes, aumente os carboidratos nas refeições.',
             2:'Faltam 2 dias: trote de 20–30 min ou descanso; carboidrato em todas as refeições e boa hidratação. Planeje os primeiros 5 km mais devagar que o ritmo-alvo.<br><br>' + vespera },
    '42km':{ 21:'Três semanas para a maratona: começa o polimento. O volume cai aos poucos: cerca de −20% nesta semana, −35% na próxima e −50 a 60% na semana da prova.',
             10:'Polimento em andamento: mantenha a frequência e reduza a duração; ritmo de prova só em blocos curtos. Teste agora os géis e a hidratação que vai usar na prova.',
             3:'Carga de carboidratos: nos 3 dias antes, mais massas, arroz, pão e frutas; menos fibras e gorduras. Hidrate bem e evite qualquer novidade.',
             1: vespera }
  };
  const L = [`<b>${dias===0?'É hoje':dias===1?'Amanhã é a prova':`Faltam ${dias} dias para a prova`} (${nome}).</b> ${T[d][marco]}`];
  // números do plano do aluno
  if(D.volAgora && D.volAntes && D.volAgora < D.volAntes) L.push(`Seu plano desta semana já reduz o volume: ${D.volAgora} min planejados, contra ${D.volAntes} na semana passada.`);
  else if(D.volAgora && marco >= 7) L.push(`Seu plano desta semana tem ${D.volAgora} min de corrida: siga ele, sem compensar treino perdido.`);
  if(D.rpe && D.rpe >= 7.5) L.push(`Seus últimos treinos saíram pesados (esforço médio ${String(Math.round(D.rpe*10)/10).replace('.',',')}/10). Nestes dias, priorize descanso: uma folga a mais não tira condicionamento.`);
  try{ const tip = raceSmartTip(dias); if(tip) L.push(tip); }catch(e){}
  if(state.modules.lift && marco <= 4 && d !== '42km') L.push('Musculação: nos dias antes da prova, deixe as pernas de fora ou bem leves.');
  return { marco, d, html: L.join('<br><br>') };
}
function provaAviso(){
  try{
    const ri = typeof raceInfo === 'function' ? raceInfo() : null; if(!ri || ri.passou) return null;
    const o = provaOrientacao(ri.dias); if(!o) return null;
    state.provaAvisos = state.provaAvisos || {};
    const k = ((state.modules.run||{}).setup||{}).raceDate;
    const reg = state.provaAvisos[k] = state.provaAvisos[k] || { km:o.d, vistos:{} };
    const hoje = new Date().toDateString(); const v = reg.vistos[o.marco];
    if(v && v !== hoje) return null;                    // esse marco já foi mostrado em outro dia
    if(!v){ reg.vistos[o.marco] = hoje; reg.km = o.d; saveData(); }
    return { text: ri.dias <= 1 ? '🏁 Prova chegando: veja o que fazer até a largada' : `🏁 Faltam ${ri.dias} dias para a prova: ajuste da semana`, tone:'important', dica:{ completa:o.html } };
  }catch(e){ return null; }
}
// depois da prova: pede o resultado (uma vez), com a recuperação certa para a distância
function provaPosAviso(){
  try{
    const lp = state.ui && state.ui.lastRacePrompt; if(!lp || !lp.data) return null;
    const dataTs = new Date(lp.data+'T00:00:00').getTime(); const dias = Math.round((mtDia0() - dataTs)/DIA_MS);
    if(dias < 0 || dias > 3) return null;
    state.provaAvisos = state.provaAvisos || {}; const reg = state.provaAvisos[lp.data] = state.provaAvisos[lp.data] || { vistos:{} };
    const hoje = new Date().toDateString();
    if(reg.pos && reg.pos !== hoje) return null;
    const registrou = (((state.modules.run||{}).history)||[]).some(r=>r.isRace && r.at >= dataTs);
    if(registrou) return null;
    if(!reg.pos){ reg.pos = hoje; saveData(); }
    const d = reg.km || provaDist();
    const rec = ({ '5km':'2–3 dias só leves', '10km':'3–4 dias leves', '21km':'cerca de 1 semana leve', '42km':'umas 2 semanas de recuperação' })[d];
    return { text:'🏅 Como foi a prova? Registre o resultado', tone:'important', dica:{ completa:`Como foi a prova? Registre o resultado: ele atualiza seus recordes e ajuda a planejar o próximo ciclo.<div class="evo-acoes"><button class="btn btn-primary" onclick="provaRegistrar('${lp.data}')">Registrar resultado</button></div><br>Recuperação: ${rec}. O plano já segue com treinos mais leves nesses dias.` } };
  }catch(e){ return null; }
}
function provaRegistrar(data){
  window.__provaAtrasada = data;
  try{ closeAssistant(); }catch(e){}
  setTimeout(()=>{ try{ openRunLog('livre'); }catch(e){} }, 220);
}
const _saveRunLogEvo = window.saveRunLog;
if(typeof _saveRunLogEvo === 'function') window.saveRunLog = function(){
  const pend = window.__provaAtrasada; const n0 = (((state.modules.run||{}).history)||[]).length;
  const r = _saveRunLogEvo.apply(this, arguments);
  try{
    const h = (state.modules.run||{}).history || [];
    if(pend && h.length > n0){
      const u = h[h.length-1];
      if(u && (!u.activity || u.activity === 'corrida')){ u.isRace = true; u.provaData = pend; u.name = '🏅 Prova — ' + u.distance + 'km'; try{ runAtualizaStats(); }catch(e){} saveData(); }
      window.__provaAtrasada = null;
    }
  }catch(e){}
  return r;
};

// ---- 3. boas-vindas (conta nova e "Começar do zero") ----
function maJornada(){ return String(+state.zeradoEm || (state.modules.lift && state.modules.lift.createdAt) || (state.modules.run && state.modules.run.createdAt) || ''); }
function maPrecisaBoasVindas(){
  if(typeof cadastroPronto === 'function' && !cadastroPronto()) return false;
  const tot = ((state.modules.lift||{}).history||[]).length + ((state.modules.run||{}).history||[]).length;
  return tot === 0 && state.maBoasVindas !== maJornada();
}
function maBoasVindasTexto(){
  const p = (state.user && state.user.profile) || {};
  const G = { emagrecer:'emagrecer', massa:'ganhar massa', forca:'ganhar força', condicionamento:'melhorar o condicionamento', tonificar:'tonificar', saude:'cuidar da saúde' };
  const DIAS = ['seg','ter','qua','qui','sex','sáb','dom'];
  const planos = [];
  ['lift','run'].forEach(m=>{
    const mod = state.modules[m]; if(!mod || !mod.setup) return; const st = mod.setup;
    const dias = (st.selectedDays||[]).map(d=>DIAS[d-1]).filter(Boolean).join(', ');
    const nome = m === 'run' ? 'corrida' : (st.modalidade === 'calistenia' ? 'calistenia' : st.modalidade === 'hibrido' ? 'treino híbrido' : 'musculação');
    const nivel = m === 'run' ? (RN_NOME[((mod.plan||{}).motor||{}).nivel] || EVO_NOME_LIFT[st.level] || '') : (EVO_NOME_LIFT[st.level] || '');
    planos.push(`<b>${nome}</b>${nivel?` (nível ${nivel})`:''}${dias?`, ${st.days} dias por semana (${dias})`:''}`);
  });
  const prova = ((state.modules.run||{}).setup||{}).raceDate;
  return `Olá, <b>${maName()}</b>! 👋 Eu sou o Meta Assistente e vou te acompanhar a partir de agora.<br><br>`
    + `Vi que seu objetivo é <b>${G[p.goal] || 'evoluir com constância'}</b> e montamos seu plano de ${planos.join(' e ') || 'treino'}.${prova?` Também anotei sua prova em ${new Date(prova+'T12:00:00').toLocaleDateString('pt-BR',{day:'numeric',month:'long'})}: vou te orientando conforme ela chegar.`:''}<br><br>`
    + `O que eu faço por você: acompanho cada treino registrado, ajusto o plano quando algo pesa ou fica fácil, aviso quando for hora de subir de nível (a decisão é sempre sua) e respondo dúvidas. Também dá para registrar coisas por aqui, como "pesei 70 kg".<br><br>`
    + `Para começar: registre o primeiro treino com calma, cargas leves e foco na técnica. 💪`;
}
const _maNudgeEvo = window.maNudge;
window.maNudge = function(){
  try{
    if(maPrecisaBoasVindas()) return { text:`👋 Olá, ${maName()}! Sou o Meta Assistente. Toque para conhecer seu plano.`, tone:'curio', dica:{ completa: maBoasVindasTexto(), boasVindas:true } };
    const pa = provaAviso(); if(pa) return pa;
    const pp = provaPosAviso(); if(pp) return pp;
    evoAtualizar();
    const of = evoOfertaPendente();
    if(of){
      const dias = of.o.diasAviso = of.o.diasAviso || []; const hoje = new Date().toDateString();
      if(dias.includes(hoje) || dias.length < 2){   // o balão aparece em no máximo 2 dias; o cartão do Início continua até a resposta
        if(!dias.includes(hoje)){ dias.push(hoje); saveData(); }
        return { text:`📈 Você vem evoluindo: que tal o próximo nível?`, tone:'important', dica:{ completa: evoOfertaHtml(of.m) } };
      }
    }
  }catch(e){ console.log('assistente (avisos):', e); }
  return _maNudgeEvo.apply(this, arguments);
};
// abrir o assistente: as boas-vindas da jornada nova vêm primeiro (e só uma vez)
const _openAssistantEvo = window.openAssistant;
window.openAssistant = function(){
  try{
    if(!(typeof cadBloqueado === 'function' && cadBloqueado()) && maPrecisaBoasVindas()){
      state.maBoasVindas = maJornada(); saveData();
      try{ localStorage.removeItem('mt_ma_thread'); if(typeof maThreadChave==='function' && maThreadChave()) localStorage.removeItem(maThreadChave()); }catch(e){}
      maNudgeAtivo = { text:'', tone:'curio', dica:{ completa: maBoasVindasTexto() } };
    }
  }catch(e){}
  return _openAssistantEvo.apply(this, arguments);
};
// resumo de abertura: oferta de nível e orientação da prova aparecem no topo
const _maOpeningEvo = window.maOpeningSummary;
window.maOpeningSummary = function(){
  let base = _maOpeningEvo.apply(this, arguments);
  try{
    const ri = typeof raceInfo === 'function' ? raceInfo() : null;
    const o = ri && !ri.passou ? provaOrientacao(ri.dias) : null;
    if(o) base += '<br><br>' + o.html;
    const of = evoOfertaPendente(); if(of) base += '<br><br>' + evoOfertaHtml(of.m);
  }catch(e){}
  return base;
};
const _maTryCommandEvo = window.maTryCommand;
window.maTryCommand = function(txt){
  if(!(typeof cadBloqueado === 'function' && cadBloqueado())){
    try{ const r = evoComando(String(txt||'').toLowerCase().trim()); if(r) return r; }catch(e){ console.log('evolução (comando):', e); }
  }
  return _maTryCommandEvo.apply(this, arguments);
};
// Início: a oferta pendente vira o cartão do topo (com as duas respostas); perto da prova, o cartão da prova
// passa a trazer a orientação daquele momento
const _renderHomeSmartEvo = window.renderHomeSmart;
window.renderHomeSmart = function(){
  const r = _renderHomeSmartEvo.apply(this, arguments);
  try{
    evoAtualizar();
    const el = $('home-smart'); if(!el) return r;
    const fechado = typeof mtLS === 'function' && mtLS('mt_smart_fechado') === mtDia0()+'';
    const of = fechado ? null : evoOfertaPendente();
    if(of){
      el.innerHTML =`<div class="smart evo-card"><div class="smart-k">Evolução · ${of.m==='run'?'Corrida':'Musculação'}</div><div class="smart-t">Pronto para o nível ${evoNomeNivel(of.m, of.o.para)}?</div>
        <div class="smart-p">Seus últimos treinos mostram evolução de verdade${of.o.motivos&&of.o.motivos.length?`: ${of.o.motivos.join(', ')}`:''}. Avançar é opcional.</div>
        <div class="smart-a"><button class="btn btn-primary" onclick="evoResponder('${of.m}',true)">Aceitar</button><button class="btn btn-ghost" onclick="evoResponder('${of.m}',false)">Continuar como está</button><button class="btn btn-ghost" onclick="evoPorque('${of.m}')">Por quê?</button></div></div>`;
      return r;
    }
    const ri = typeof raceInfo === 'function' ? raceInfo() : null;
    const o = ri && !ri.passou ? provaOrientacao(ri.dias) : null;
    const p = o && el.querySelector('.smart-p');
    if(p){ const txt = o.html.split('<br><br>')[0].replace(/<b>.*?<\/b>\s*/, ''); p.textContent = txt.replace(/<[^>]+>/g,''); }
  }catch(e){ console.log('início (evolução):', e); }
  return r;
};
Object.assign(window, { evoResponder, evoPorque, evoAtualizar, evoLiftAvaliar, evoPodeOferecer, provaOrientacao, provaRegistrar, maBoasVindasTexto });

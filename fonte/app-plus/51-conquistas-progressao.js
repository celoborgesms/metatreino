
// =====================================================================
// 51. Beta 49 — Conquistas com progressão (sem desbloqueio em massa), metas do mês × medalha do desafio,
//     participação automática no desafio do mês e visual das medalhas
// =====================================================================
// O QUE MUDA
//  1) Nada é removido nem fica mais difícil de propósito. O que muda é COMO a conquista é reconhecida e
//     apresentada:
//     • Experiência anterior: marcos de distância numa corrida (5K, 10K, meia, maratona) que a pessoa JÁ
//       declarou no cadastro (tempo recente numa distância, nível, km por semana, tempo contínuo) entram na
//       coleção como "Experiência reconhecida" — sem festa de "você acabou de evoluir". Um iniciante que corre
//       os primeiros 5 km recebe a celebração normal.
//     • Celebração agrupada: um registro que destrava várias etapas da mesma família (5K → 10K → meia, ou
//       bronze → prata → ouro de uma meta do mês) vira UM cartão com a etapa mais alta e "inclui: ...".
//       "Primeiro treino" + "Primeira corrida" viram "Primeira atividade no MetaTreino", sempre o primeiro
//       cartão. No máximo 5 cartões; o resto (comuns) cabe num cartão-resumo.
//     • Metas do mês escalam pelo nível da MODALIDADE (corrida pelo nível do motor de corrida: iniciante a
//       competitivo; musculação pelo nível do plano). Antes a corrida usava o nível da musculação quando a
//       pessoa tinha os dois planos.
//  2) "Medalha do mês" × "medalha do desafio": os níveis bronze/prata/ouro (automáticos, para todos) passam a
//     se chamar METAS DO MÊS. A MEDALHA exclusiva é só a do desafio temático e só sai para quem participa,
//     cumpre a meta e dentro do período (já era assim no código; o nome confundia).
//  3) Participação automática: quem tem o cadastro pronto entra sozinho no desafio do período (meta calculada
//     pela própria rotina). Dá para sair; quem saiu não é inscrito de novo naquele desafio.

// ---------- 1a. metas do mês: escala por modalidade ----------
const CQ_ESC_RUN = [0.6, 0.75, 1.0, 1.15, 1.35, 1.6];          // nível do motor de corrida 0..5
const CQ_ESC_LIFT = { iniciante:0.75, intermediario:1, avancado:1.3 };
function cqEscalaBase(baseId){
  try{
    const b = DESAFIO_BASES[baseId]; const cat = b && b.cat;
    const run = state.modules.run, lift = state.modules.lift;
    const nvRun = run && run.plan && run.plan.motor && Number.isFinite(+run.plan.motor.nivel) ? +run.plan.motor.nivel : null;
    const escRun = nvRun != null ? CQ_ESC_RUN[Math.max(0, Math.min(5, nvRun))] : ({iniciante:0.75, intermediario:1, avancado:1.3})[(run && run.setup && run.setup.level) || ''];
    const escLift = CQ_ESC_LIFT[(lift && lift.setup && lift.setup.level) || ''];
    if(cat === 'run' && escRun) return escRun;
    if(cat === 'lift' && escLift) return escLift;
  }catch(e){}
  return _escalaDesafio();
}
window.mkDesafio = function(baseId, nivel){
  const b = DESAFIO_BASES[baseId]; const idx = NIVEIS_DESAFIO.findIndex(n=>n.id===nivel);
  const alvo = Math.max(1, Math.round(b.tiers[idx]*cqEscalaBase(baseId)));
  return { id: baseId+'_'+nivel, base: baseId, nivel, emo: b.emo, cat: b.cat, nome: b.nome+' '+NIVEIS_DESAFIO[idx].emo, desc: b.desc(alvo), alvo,
           prog: ()=>[ b.val(), alvo ] };
};

// ---------- 1b. experiência anterior ----------
const CQ_KM_MARCO = { run_5k_run:5, run_10k_run:10, run_21k_run:21, run_42k_run:42 };
function cqExpReconhece(id){
  try{
    const km = CQ_KM_MARCO[id]; if(!km) return false;
    const run = state.modules.run; if(!run) return false;
    const aval = (run.setup||{}).aval || {}; const M = (run.plan||{}).motor || {}; const nv = +M.nivel || 0;
    const marca = aval.marca && +aval.marca.km || 0;
    if(marca && marca + 0.25 >= km) return true;                          // já correu essa distância (tempo informado)
    const cont = (typeof RUN_CONT_AVAL !== 'undefined' ? RUN_CONT_AVAL[String(aval.continuo||'0')] : 0) || 0;
    const kmSem = +aval.kmSemana || 0;
    if(km <= 10 && nv >= 4) return true;                                  // avançado/competitivo
    if(km <= 5 && (nv >= 3 || kmSem >= 20 || cont >= 45)) return true;
    if(km <= 10 && (kmSem >= 35 || cont >= 70)) return true;
  }catch(e){}
  return false;
}
const _unlockTrophyB49 = window.unlockTrophy;
window.unlockTrophy = function(id){
  try{ if(state && !state.trophies.includes(id) && cqExpReconhece(id)){ state.trophyExp = state.trophyExp || {}; state.trophyExp[id] = Date.now(); } }catch(e){}
  return _unlockTrophyB49.apply(this, arguments);
};
// na coleção: a data vira "Experiência anterior"
const _cqTileB49 = window.cqTile;
window.cqTile = function(t, i){
  let h = _cqTileB49.apply(this, arguments);
  try{ if(state.trophyExp && state.trophyExp[t.id] && state.trophies.includes(t.id)) h = h.replace(/<div class="cq-data">([^<]*)<\/div>/, '<div class="cq-data cq-exp">Experiência anterior · registrada em $1</div>'); }catch(e){}
  return h;
};

// ---------- 1c. celebração agrupada ----------
const CQ_FAMILIAS = [
  ['run_5k_run','run_10k_run','run_21k_run','run_42k_run'], ['run_1','run_10','run_25','run_50'], ['run_km_10','run_km_50','run_km_100','run_km_500'],
  ['walk_1','walk_10','walk_25'], ['walk_km_10','walk_km_50','walk_km_100'], ['walk_3k','walk_5k'],
  ['bike_1','bike_10','bike_25'], ['bike_km_50','bike_km_100','bike_km_500'], ['bike_20k','bike_50k'],
  ['streak_3','streak_7','streak_14','streak_30'], ['lift_10','lift_25','lift_50','lift_100'], ['first_pr','pr_5','pr_20'],
  ['weight_down_1','weight_down_3','weight_down_5','weight_down_10'], ['weight_up_2','weight_up_5','weight_up_10']
];
const CQ_PRIMEIRAS = ['run_1','walk_1','bike_1','first_workout'];
const CQ_MAX_CARTOES = 5;
const _cqNomeDe = p=>{ const t = p.tid ? TROPHIES.find(x=>x.id===p.tid) : null; return t ? t.name : String(p.nome||'').replace(/\s*[🥉🥈🥇]\s*$/u,''); };
function _cqMetaBase(p){ const m = String(p.k||'').match(/^m_(.+)_(bronze|prata|ouro)@/); return m ? { base:m[1], nivel:m[2] } : null; }
function cqAgrupar(pend){
  const exp = [], prim = [], resto = [];
  pend.forEach(p=>{
    if(p.tid && state.trophyExp && state.trophyExp[p.tid]) exp.push(p);
    else if(p.tid && CQ_PRIMEIRAS.includes(p.tid)) prim.push(p);
    else resto.push(p);
  });
  const cartoes = [];
  if(prim.length){
    const ord = prim.slice().sort((a,b)=>CQ_PRIMEIRAS.indexOf(a.tid) - CQ_PRIMEIRAS.indexOf(b.tid));
    const main = ord[0];
    cartoes.push({ p:main, ks:prim.map(x=>x.k), ordem:0, primeira:true, extras: ord.slice(1).map(_cqNomeDe),
      nome: prim.length > 1 ? 'Primeira atividade no MetaTreino' : _cqNomeDe(main) + ' no MetaTreino' });
  }
  // famílias de troféus e metas do mês (bronze → prata → ouro): fica a etapa mais alta
  const grupos = {};
  resto.forEach(p=>{
    let g = null, peso = 0;
    if(p.tid){ const fi = CQ_FAMILIAS.findIndex(f=>f.includes(p.tid)); if(fi >= 0){ g = 'f' + fi; peso = CQ_FAMILIAS[fi].indexOf(p.tid); } }
    else { const mb = _cqMetaBase(p); if(mb){ g = 'm' + mb.base; peso = ['bronze','prata','ouro'].indexOf(mb.nivel); } }
    if(!g) g = 'u' + p.k;
    (grupos[g] = grupos[g] || []).push({ p, peso });
  });
  const ordemKind = p=>{ const t = p.tid ? TROPHIES.find(x=>x.id===p.tid) : null; const nv = t ? medalNivel(t) : null;
    return p.kind === 'secreto' || nv === 'especial' ? 1 : p.kind === 'evento' ? 2 : (nv === 'rara' || p.kind === 'marco') ? 4 : p.kind === 'medalha' ? 6 : 5; };
  Object.values(grupos).forEach(arr=>{
    arr.sort((a,b)=>b.peso - a.peso);
    const main = arr[0].p;
    const meta = !main.tid && !!_cqMetaBase(main);
    const extras = meta ? arr.slice(1).map(x=>({bronze:'bronze', prata:'prata', ouro:'ouro'})[_cqMetaBase(x.p).nivel]).reverse() : arr.slice(1).map(x=>_cqNomeDe(x.p)).reverse();
    cartoes.push({ p:main, ks:arr.map(x=>x.p.k), ordem:ordemKind(main), extras, meta });
  });
  if(exp.length) cartoes.push({ p:exp[exp.length-1], ks:exp.map(x=>x.k), ordem:3, exp:true, nome:'Experiência reconhecida', extras: exp.map(_cqNomeDe) });
  cartoes.sort((a,b)=>a.ordem - b.ordem);
  if(cartoes.length > CQ_MAX_CARTOES){
    const fica = cartoes.slice(0, CQ_MAX_CARTOES - 1), sobra = cartoes.slice(CQ_MAX_CARTOES - 1);
    fica.push({ p:sobra[0].p, ks:[].concat(...sobra.map(c=>c.ks)), ordem:9, resumo:true, nome:`E mais ${sobra.length} ${sobra.length===1?'conquista':'conquistas'}`, extras: sobra.map(c=>c.nome || _cqNomeDe(c.p)) });
    return fica;
  }
  return cartoes;
}
const _cqCelCartaoB49 = window.cqCelCartao;
function cqCelCartaoGrupo(c, i){
  if(c.exp || c.resumo){
    const t = c.p.tid ? TROPHIES.find(x=>x.id===c.p.tid) : null;
    const ico = t ? trophyIco(t) : '<span class="cq-emo">🏅</span>';
    const desc = c.exp ? `Pelo que você informou no cadastro, estes marcos já faziam parte da sua história: <b>${c.extras.map(mtEsc).join(', ')}</b>. Ficam na coleção como experiência anterior — as próximas metas partem do seu nível.`
      : `${c.extras.map(mtEsc).join(' · ')}. Veja todas na aba Conquistas.`;
    return `<div class="cel-cartao nv-comum${c.exp?' cel-exp':''}" role="option" aria-label="${mtEsc(c.nome)}" data-i="${i}">
      <div class="cel-med">${ico}</div><small class="cel-tipo">${c.exp ? 'Experiência anterior' : 'Também desbloqueadas'}</small>
      <b class="cel-nome">${mtEsc(c.nome)}</b><span class="cel-desc">${desc}</span></div>`;
  }
  let h = _cqCelCartaoB49(c.p, i);
  if(c.nome) h = h.replace(/<b class="cel-nome">[^<]*<\/b>/, `<b class="cel-nome">${mtEsc(c.nome)}</b>`);
  if(c.meta) h = h.replace(/<small class="cel-tipo">[^<]*/, '<small class="cel-tipo">Meta do mês');
  if(c.primeira) h = h.replace(/<small class="cel-tipo">[^<]*/, '<small class="cel-tipo">Começo da jornada');
  if(c.extras && c.extras.length) h = h.replace(/<\/div>\s*$/, `<span class="cel-extra">${c.primeira ? 'Junto com' : c.meta ? 'Inclui os níveis' : 'Inclui'}: ${c.extras.map(mtEsc).join(c.meta ? ' e ' : ' · ')}</span></div>`);
  return h;
}
// RC 4: a janela de conquistas do fim do registro (que esta parte redesenhava por cima da versão da parte 48)
// saiu. Há uma implementação só: _cqCelTenta, na parte 48, que mostra o aviso pequeno (mtAvisoConquista).
// cqAgrupar e cqCelCartaoGrupo continuam disponíveis para quem quiser montar o resumo agrupado.
// cartão visto = todas as conquistas que ele representa saem das "novas"
window._cqCelVer = function(i){
  const c = _cqCelLista[i];
  if(c){ (c.ks || [c.k]).forEach(k=>{ try{ _cqCelMarca(k); }catch(e){} }); }
  const pos = document.getElementById('cel-pos'); if(pos) pos.textContent = `${i+1} de ${_cqCelLista.length}`;
  document.querySelectorAll('.cel-pontos i').forEach((d,k)=>d.classList.toggle('on', k===i));
  document.querySelectorAll('.cel-seta').forEach((b,k)=>{ b.disabled = k===0 ? i===0 : i===_cqCelLista.length-1; });
};

// ---------- 2. nomes: "meta do mês" (automática) × "medalha" (desafio com participação) ----------
const _cqCelCartaoNome = window.cqCelCartao;
window.cqCelCartao = function(p, i){
  let h = _cqCelCartaoNome.apply(this, arguments);
  if(p && p.kind === 'medalha' && !String(p.k||'').startsWith('ev_')) h = h.replace('Medalha do mês', 'Meta do mês');
  return h;
};
// arquivo: medalhas de desafio (exclusivas) separadas das metas do mês; cada meta numa linha com bronze/prata/ouro
function openMedals(){
  ensureMonthly();
  const meds = (state.medals||[]).slice();
  const atuais = (state.monthly.done||[]).map(id=>({ id, month:state.monthly.key, at:(state.monthly.doneAt||{})[id] }));
  const todas = meds.concat(atuais.filter(a=>!meds.some(m=>m.id===a.id && m.month===a.month)));
  const desafios = todas.filter(m=>String(m.id).startsWith('ev:')).sort((a,b)=>(b.at||0)-(a.at||0));
  const metas = todas.filter(m=>!String(m.id).startsWith('ev:'));
  const porMes = {}; metas.forEach(m=>{ (porMes[m.month] = porMes[m.month] || []).push(m); });
  const meses = Object.keys(porMes).sort().reverse();
  const fData = t=>t ? new Date(t).toLocaleDateString('pt-BR') : '';
  const linhaDesafio = m=>{ const c = desafioPorId(m.id) || {}; return `<div class="md-row"><span class="md-ico md-ico-ev">${c.emo||'🎖️'}</span><div class="md-txt"><b>${mtEsc(c.nome||'Desafio')}</b><small>${mtEsc(c.desc||'')}</small></div><span class="md-data">${fData(m.at)}</span></div>`; };
  const blocoMes = mk=>{
    const lista = porMes[mk]; const em = mk === state.monthly.key;
    const bases = {}; const selos = [];
    lista.forEach(m=>{ if(String(m.id).startsWith('selo:')){ selos.push(m); return; } const mm = String(m.id).match(/^(.+)_(bronze|prata|ouro)$/); const b = mm ? mm[1] : m.id; (bases[b] = bases[b] || []).push({ m, nivel: mm ? mm[2] : null }); });
    const linhas = Object.keys(bases).map(b=>{
      const arr = bases[b]; const ult = arr.slice().sort((x,y)=>(y.m.at||0)-(x.m.at||0))[0];
      const c = desafioPorId(ult.m.id) || {}; const tem = n=>arr.some(x=>x.nivel===n);
      const nome = String(c.nome||b).replace(/\s*[🥉🥈🥇]\s*$/u,'');
      const niveis = arr.some(x=>x.nivel) ? `<span class="md-niveis" aria-label="Níveis conquistados">${NIVEIS_DESAFIO.map(n=>`<i class="md-nv ${tem(n.id)?'on':''} nv-${n.id}" title="${n.lbl}">${n.lbl[0]}</i>`).join('')}</span>` : '';
      const maior = ['ouro','prata','bronze'].find(tem); const cMaior = maior ? (desafioPorId(b + '_' + maior) || c) : c;
      return `<div class="md-row"><span class="md-ico">${c.emo||'🏅'}</span><div class="md-txt"><b>${mtEsc(nome)}</b><small>${mtEsc(cMaior.desc||'')}</small></div>${niveis}</div>`;
    }).join('') + selos.map(s=>{ const c = desafioPorId(s.id) || {}; return `<div class="md-row"><span class="md-ico">${c.emo||'🎖️'}</span><div class="md-txt"><b>${mtEsc(c.nome||'Selo')}</b><small>${mtEsc(c.desc||'')}</small></div><span class="md-data">${fData(s.at)}</span></div>`; }).join('');
    return `<div class="card md-mes"><div class="md-mes-t"><b>${monthName(mk)}</b>${em?' <span class="md-and">em andamento</span>':''}</div>${linhas}</div>`;
  };
  $('modal-inner').innerHTML = `<div class="md">
    <div class="cq-topo"><h3>🏅 Medalhas e metas</h3><button class="cq-x" onclick="closeModal()" aria-label="Fechar">✕</button></div>
    <div style="max-height:62vh;overflow-y:auto;margin-top:6px">
      <div class="mt-sec" style="margin-top:4px">Medalhas de desafio</div>
      <p class="md-p">Exclusivas de cada desafio do mês: só para quem participou e cumpriu a meta dentro do período.</p>
      ${desafios.length ? `<div class="card md-mes">${desafios.map(linhaDesafio).join('')}</div>` : '<div class="card md-vazio">Nenhuma medalha de desafio ainda. A deste mês está em <b>Desafios</b>.</div>'}
      <div class="mt-sec">Metas do mês</div>
      <p class="md-p">Bronze, prata e ouro, automáticas para todos. Zeram no dia 1º; o que você conquistou fica guardado.</p>
      ${meses.length ? meses.map(blocoMes).join('') : '<div class="card md-vazio">Nenhuma meta do mês concluída ainda.</div>'}
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button></div>`;
  $('modal-back').classList.add('on');
}
window.openMedals = openMedals;
// "Sua coleção" em Desafios: Níveis do mês → Metas do mês; Medalhas → Medalhas e metas
mtGancho('renderChallenges', { depois(){
  try{
    const root = $('chal-root'); if(!root) return;
    root.querySelectorAll('.chal-tile').forEach(t=>{
      const b = t.querySelector('b'); if(!b) return;
      if(b.textContent === 'Níveis do mês') b.textContent = 'Metas do mês';
      if(b.textContent === 'Medalhas'){ b.textContent = 'Medalhas e metas'; const s = t.querySelector('small'); const n = (state.medals||[]).filter(m=>String(m.id).startsWith('ev:')).length; if(s) s.textContent = `${n} ${n===1?'medalha de desafio':'medalhas de desafio'}`; }
    });
  }catch(e){}
}});

// ---------- 3. participação automática no desafio do período ----------
function cqAutoParticipa(){
  try{
    if(typeof cadastroPronto === 'function' && !cadastroPronto()) return false;
    state.eventos = state.eventos || {};
    const rec = state.eventosRecusados || {};
    let mudou = false;
    eventosAtivos().forEach(e=>{
      if(state.eventos[e.key] || rec[e.key]) return;
      // conta nova no meio do período (nenhuma atividade antes do início): a meta é proporcional aos dias que restam
      let alvo = metaDoEvento(e);
      const novo = !mtHist().some(x=>x.at < e.ini);
      const total = Math.round((e.fim - e.ini)/DIA_MS), resta = Math.max(1, Math.round((e.fim - mtDia0())/DIA_MS));
      if(novo && Date.now() > e.ini + 2*DIA_MS && !e.alvoFixo) alvo = Math.max(2, Math.min(alvo, Math.round(alvo * resta / total)));
      state.eventos[e.key] = { alvo, entrouEm: Date.now(), nome: e.nome, arte: e.arte, ini: e.ini, fim: e.fim, auto:true };
      mudou = true;
      try{ syncParticipacao(e); }catch(err){}
    });
    return mudou;
  }catch(e){ return false; }
}
const _checkEventosB49 = window.checkEventos;
window.checkEventos = function(){ const novo = cqAutoParticipa(); const r = _checkEventosB49.apply(this, arguments); if(novo) try{ saveData(); }catch(e){} return r; };
window.sairDoEvento = function(key){
  appConfirm('Você deixa de participar deste desafio e não recebe a medalha dele. Seus treinos continuam no histórico e nas metas do mês normalmente.', ()=>{
    if(state.eventos && state.eventos[key] && !state.eventos[key].concluidoEm){
      delete state.eventos[key];
      state.eventosRecusados = state.eventosRecusados || {}; state.eventosRecusados[key] = Date.now();
      // guarda só os do último ano
      const lim = Date.now() - 400*86400000; Object.keys(state.eventosRecusados).forEach(k=>{ if(state.eventosRecusados[k] < lim) delete state.eventosRecusados[k]; });
      saveData();
      try{ db.collection('desafiosTematicos').doc(key).collection('participantes').doc(uidDados()).delete().catch(()=>{}); }catch(e){}
    }
    renderChallenges();
  }, {title:'Sair do desafio?', emo:'🚪', okLabel:'Sair', onCancel:()=>renderChallenges()});
};
const _participaEventoB49 = window.participaEvento;
window.participaEvento = function(key){ try{ if(state.eventosRecusados) delete state.eventosRecusados[key]; }catch(e){} return _participaEventoB49.apply(this, arguments); };
const _evHeroB49 = window._evHero;
window._evHero = function(e, opts){
  let h = _evHeroB49.apply(this, arguments);
  try{
    const reg = (state.eventos||{})[e.key];
    const recusou = !!((state.eventosRecusados||{})[e.key]);
    if(reg && !reg.concluidoEm) h = h.replace(/<small>dias ativos<\/small>/, '<small>dias ativos · você está participando</small>');
    if(!reg && recusou) h = h.replace('>Participar do desafio<', '>Voltar a participar<').replace('dias ativos (meta prevista)', 'dias ativos (você saiu deste desafio)');
  }catch(err){}
  return h;
};

// ---------- 4. cadastro: desenho de boas-vindas sem boneco (anéis de progresso, linguagem de relógio) ----------
try{
  DECO2_SVG.cadBoasVindas = DECO3(`<circle class="d-fundo" cx="168" cy="62" r="50"/>
    <circle class="d-linha" cx="168" cy="62" r="38" stroke-opacity=".35"/>
    <path class="d-ac" d="M168 24a38 38 0 1 1-36.1 49.8" stroke-width="5"/>
    <circle class="d-linha" cx="168" cy="62" r="27" stroke-opacity=".3"/>
    <path class="d-ac" d="M168 35a27 27 0 0 1 25.7 35.3" stroke-width="5" stroke-opacity=".75"/>
    <circle class="d-linha" cx="168" cy="62" r="16" stroke-opacity=".25"/>
    <path class="d-ac" d="M168 46a16 16 0 1 1-13.9 23.9" stroke-width="5" stroke-opacity=".55"/>
    <path class="d-linha" d="M112 104h44" stroke-opacity=".45"/><path class="d-linha" d="M112 112h28" stroke-opacity=".3"/>`);
}catch(e){ console.log('arte boas-vindas:', e); }

(function(){ if(document.getElementById('cq49-css')) return; const s = document.createElement('style'); s.id = 'cq49-css';
  s.textContent = `
.cel-extra{display:block;font-size:12px;line-height:1.45;color:var(--text-mute);max-width:280px;margin-top:2px}
.cel-cartao.cel-exp .cel-med{opacity:.85}
.cq-data.cq-exp{color:var(--text-dim)}
.md .cq-topo{display:flex;align-items:center;justify-content:space-between}
.md-p{font-size:12px;line-height:1.5;color:var(--text-dim);margin:-2px 0 8px}
.md-mes{padding:6px 14px;margin-bottom:10px}
.md-mes-t{display:flex;align-items:center;gap:8px;padding:8px 0 4px;font-size:14px}
.md-and{font-size:10.5px;color:var(--accent);font-weight:700}
.md-row{display:grid;grid-template-columns:40px minmax(0,1fr) auto;align-items:center;gap:10px;padding:9px 0;border-top:1px dashed var(--border)}
.md-mes-t + .md-row{border-top:1px dashed var(--border)}
.md-ico{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(var(--primary-rgb),.10);font-size:20px;line-height:1;overflow:hidden}
.md-ico > *{max-width:34px;max-height:34px}
.md-ico svg{width:22px;height:22px}
.md-ico-ev{background:transparent}.md-ico-ev .tbadge{width:40px!important;height:40px!important}
.md-ico-ev .tbadge svg{width:100%;height:100%}
.md-txt{min-width:0}.md-txt b{display:block;font-size:13.5px;line-height:1.3}.md-txt small{display:block;font-size:11.5px;color:var(--text-mute);line-height:1.35;margin-top:1px}
.md-data{font-size:11px;color:var(--text-dim);font-family:ui-monospace,monospace;white-space:nowrap}
.md-niveis{display:flex;gap:4px}
.md-nv{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-style:normal;font-weight:800;border:1.5px solid var(--border);color:var(--text-mute);opacity:.55}
.md-nv.on{opacity:1;color:#1a1208}
.md-nv.on.nv-bronze{background:#c98a52;border-color:#c98a52}.md-nv.on.nv-prata{background:#c9ced6;border-color:#c9ced6}.md-nv.on.nv-ouro{background:#f2c14e;border-color:#f2c14e}
.md-vazio{padding:14px;font-size:12.5px;color:var(--text-dim);margin-bottom:10px}
/* recompensa do desafio e coleção: ícone centrado no próprio quadro, texto alinhado ao centro do ícone */
.card.ev-medal{display:grid!important;grid-template-columns:58px minmax(0,1fr);align-items:center;gap:14px}
.card.ev-medal > .tbadge{width:58px!important;height:58px!important;align-self:center;justify-self:center;flex:none}
.ev-mini{display:grid!important;grid-template-columns:44px minmax(0,1fr) auto;align-items:center;gap:12px}
.ev-mini > .tbadge{width:44px!important;height:44px!important;justify-self:center}
.chal-tile .tbadge{display:flex;align-items:center;justify-content:center;flex:none}
`; document.head.appendChild(s); })();

Object.assign(window, { cqEscalaBase, cqExpReconhece, cqAgrupar, cqAutoParticipa });

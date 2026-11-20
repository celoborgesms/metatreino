
// =====================================================================
// 49. Alimentação da casa (Beta 46, refeita na Beta 49), assistente sem corrida para quem só faz musculação
//     e avisos do primeiro acesso sem um em cima do outro
// =====================================================================
// REGRA DA CASA (Beta 49): a COMIDA é compartilhada, a ALIMENTAÇÃO é individual.
//  • Um cria o grupo e recebe um código de 6 letras; quem mora junto digita o código (até 6 pessoas).
//  • O ADMINISTRADOR da casa (quem criou, ou quem recebeu a administração) decide o cardápio compartilhado:
//    quais refeições são da casa, em quais dias e horários, o prato (trocar), tirar ou acrescentar alimentos
//    no prato da casa e se cada pessoa pode trocar o prato só para si.
//  • Todos veem o MESMO prato. A QUANTIDADE e as calorias são de cada um, calculadas pelo plano de cada pessoa
//    (peso, objetivo, calorias). Nada é copiado de um celular para o outro: só a composição do prato.
//  • "Comi", quantidade editada e alimento acrescentado "só para mim" são pessoais (não vão para o grupo).
//  • Lista de compras e PDF: individual (só o seu) ou da casa (soma o que cada pessoa vai comer de verdade,
//    agrupado por alimento, com unidade e período).
//  • Na nuvem (familias/{código}): membros, administrador, apelidos, restrições (sim/não), a configuração e a
//    composição do prato da casa, e o total de compras de cada pessoa nos próximos dias. Nada de peso, idade,
//    altura ou e-mail. As regras do Firestore deixam cada pessoa alterar só o próprio apelido/perfil, e só o
//    administrador alterar cardápio e configuração.

const FAM_MAX = 6, FAM_REF_PADRAO = ['almoco','jantar'], FAM_DIAS_CARDAPIO = 14, FAM_DIAS_COMPRAS = 8;
const FAM_LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FAM_NOMES_REF = { cafe:'Café da manhã', lanche1:'Lanche da manhã', almoco:'Almoço', lanche2:'Lanche da tarde', jantar:'Jantar', ceia:'Ceia' };
const FAM_NOMES_REF_MIN = { cafe:'café', lanche1:'lanche da manhã', almoco:'almoço', lanche2:'lanche da tarde', jantar:'jantar', ceia:'ceia' };
const FAM_DIAS_CURTO = ['S','T','Q','Q','S','S','D'];
let _famUnsub = null, _famPushT = 0;

function _famUid(){ try{ return (fbUser && fbUser.uid) || (fbAuth && fbAuth.currentUser && fbAuth.currentUser.uid) || null; }catch(e){ return null; } }
function famId(){ try{ const f = state && state.nutri && state.nutri.familia; return f && f.id ? f.id : null; }catch(e){ return null; } }
function _famCacheKey(){ return 'mt_familia_' + (famId() || ''); }
function famCache(){
  if(!famId()) return null;
  if(window.__famCache && window.__famCache.__id === famId()) return window.__famCache;
  try{ const c = JSON.parse(localStorage.getItem(_famCacheKey()) || 'null'); if(c){ c.__id = famId(); window.__famCache = c; return c; } }catch(e){}
  return null;
}
function _famGuardaCache(d){ d = d || {}; d.__id = famId(); window.__famCache = d; try{ localStorage.setItem(_famCacheKey(), JSON.stringify(d)); }catch(e){} }
function famAtiva(){ const c = famCache(); return !!(c && Array.isArray(c.membros) && c.membros.includes(_famUid())); }
function famRefs(){ const c = famCache(); return (c && c.config && Array.isArray(c.config.refeicoes)) ? c.config.refeicoes : FAM_REF_PADRAO; }
function famMembros(){ const c = famCache(); return (c && c.membros) || []; }
function famNome(uid){ const c = famCache(); return (c && c.nomes && c.nomes[uid]) || 'Pessoa da casa'; }
function famAdmUid(){ const c = famCache(); return (c && c.dono) || null; }
function famSouAdm(){ return famAtiva() && famAdmUid() === _famUid(); }
function _famCfg(){ const c = famCache(); return (c && c.config) || {}; }
function famDiasRef(mid){ const d = (_famCfg().dias || {})[mid]; return Array.isArray(d) && d.length ? d : [1,2,3,4,5,6,7]; }
function famHoraRef(mid){ const h = (_famCfg().horas || {})[mid]; return /^\d{2}:\d{2}$/.test(h||'') ? h : null; }
function famTrocaPropria(){ return _famCfg().trocaPropria === true; }
function _famMeuPerfilRestr(){ const n = nutriConfig(); return { veg:!!n.vegetariano, lac:!!n.semLactose, glu:!!n.semGluten }; }

// parâmetros do prato compartilhado (família ativa) ou do cardápio guardado ao sair do grupo
function famParams(){
  try{
    const n = nutriConfig();
    if(famAtiva()){
      const c = famCache(), cf = c.config || {}, eu = _famMeuPerfilRestr();
      const ps = Object.values(c.perfis || {});
      const algum = k=>eu[k] || ps.some(p=>p && p[k]);
      return { refeicoes: famRefs(), seed: +cf.seed || 0, trocas: cf.trocas || {}, veg: algum('veg'), lac: algum('lac'), glu: algum('glu'), economico: cf.economico !== false,
        dias: cf.dias || {}, horas: cf.horas || {}, cardapio: c.cardapio || {}, compensa: !!cf.compensa, casa:true };
    }
    if(n.cardapioFixo && Array.isArray(n.cardapioFixo.refeicoes)) return Object.assign({ trocas:{}, dias:{}, horas:{}, cardapio:{} }, n.cardapioFixo, { casa:false });
  }catch(e){}
  return null;
}
function _famForaKey(dk, mid){ return dk + '|' + mid; }
function famFora(dk, mid){ try{ const f = nutriConfig().famFora || {}; const v = f[_famForaKey(dk, mid)]; return v ? +v : 0; }catch(e){ return 0; } }
// a refeição é da casa NESTE dia? (refeição marcada, dia marcado e a pessoa não trocou só para ela)
function famDaCasaNoDia(P, mid, diaIdx, dk){
  if(!P || !P.refeicoes.includes(mid)) return false;
  const d = (P.dias || {})[mid]; if(Array.isArray(d) && d.length && !d.includes(diaIdx)) return false;
  if(P.casa && dk && famFora(dk, mid)) return false;
  return true;
}
function famCompartilhada(mid, diaIdx){ const P = famParams(); diaIdx = diaIdx || nutriDiaSel(); return !!(P && P.casa && famDaCasaNoDia(P, mid, diaIdx, nutriKeyDia(diaIdx))); }
function _famComposicao(P, dk, mid){ const x = ((P && P.cardapio) || {})[dk]; const m = x && x[mid]; return { x:(m && Array.isArray(m.x)) ? m.x : [], add:(m && Array.isArray(m.add)) ? m.add : [] }; }

// ---------- cardápio: o prato das refeições da casa sai dos parâmetros comuns ----------
const _nutriMontarPlanoB46 = window.nutriMontarPlano;
function famPrato(r, diaIdx, P, n, idxSlot, dk){
  dk = dk || nutriKeyDia(diaIdx);
  const comp = famDaCasaNoDia(P, r.id, diaIdx, dk);
  const veg = comp ? P.veg : n.vegetariano, lac = comp ? P.lac : n.semLactose, glu = comp ? P.glu : n.semGluten, eco = comp ? P.economico : n.economico;
  let lista = (veg && r.veg) ? r.veg : r.opcoes;
  const proib = new Set([...(lac?NUTRI_LACTOSE:[]), ...(glu?NUTRI_GLUTEN:[])]);
  if(proib.size){ const livre = lista.filter(op=>!op.i.some(([id])=>proib.has(id))); if(livre.length) lista = livre; }
  if(eco){ const barato = lista.filter(op=>!op.i.some(([id])=>NUTRI_CARO.includes(id))); if(barato.length>=2) lista = barato; }
  const chave = r.id + (veg?'v':'');
  const idxUse = comp ? NUTRI_REFEICOES.findIndex(x=>x.id===r.id) : idxSlot;
  // quem saiu do prato da casa só neste dia segue o próprio cardápio, deslocado pelas trocas que fez
  const fora = (!comp && P && P.casa && P.refeicoes.includes(r.id)) ? famFora(dk, r.id) : 0;
  const seed = comp ? P.seed : n.seed, tr = comp ? ((P.trocas||{})[chave]||0) : ((n.trocas[chave]||0) + fora);
  const v = nutriVarIdx(diaIdx, idxUse, seed, tr, lista.length);
  const op = lista[v];
  const trocaId = id=>(eco && id==='azeite') ? 'oleo' : id;
  // composição: o prato + o que o administrador acrescentou − o que ele tirou (só nas refeições da casa)
  let itens = op.i.map(([id,q])=>[trocaId(id), q]);
  const orig = itens.map(([id,q])=>[id,q]);
  const cp = (comp && P.casa) ? _famComposicao(P, dk, r.id) : { x:[], add:[] };
  if(cp.x.length) itens = itens.filter(([id])=>!cp.x.includes(id));
  cp.add.forEach(a=>{ if(!a || !NUTRI_ALIMENTOS[a.id] || !(+a.q > 0)) return; const ex = itens.find(([id])=>id===a.id); if(ex) ex[1] += +a.q; else itens.push([a.id, +a.q]); });
  if(!itens.length) itens = op.i.map(([id,q])=>[trocaId(id), q]);          // prato vazio não existe: volta ao original
  const kc = l=>l.reduce((s,[id,q])=>{ const a=NUTRI_ALIMENTOS[id]; return s + a[1]*(a[5]? q*a[5] : q)/100; },0) || 1;
  const k0 = kc(itens), k0orig = kc(orig);
  const acrescentados = cp.add.filter(a=>a && NUTRI_ALIMENTOS[a.id] && +a.q > 0).map(a=>a.id);
  const mudou = !!(comp && P.casa && (cp.x.some(id=>orig.some(([o])=>o===id)) || acrescentados.length));
  return { comp, op, v, total:lista.length, chave, eco, k0, k0orig, orig, itens, tirados: cp.x.slice(), acrescentados, mudou, fora };
}
window.nutriMontarPlano = function(diaIdx, dkData){
  const P = famParams();
  if(!P) return _nutriMontarPlanoB46.call(this, diaIdx);
  const calc0 = nutriCalcular(); if(calc0.erro) return calc0;
  const n = nutriConfig();
  const hojeIdx = (typeof getDayIdx==='function') ? getDayIdx() : 1;
  diaIdx = diaIdx || hojeIdx;
  const dk = dkData || nutriKeyDia(diaIdx);      // dkData: o mesmo dia da semana na semana que vem (lista de 7 dias)
  const diasT = nutriDiasTreino();
  const _E = (typeof nutriDiaEnergia==='function') ? nutriDiaEnergia(diaIdx, dk, calc0) : null;     // Beta 53 (parte 56)
  const treino = _E ? _E.treino : diasT.has(diaIdx);
  const nT = diasT.size, y = nT>=1 && nT<=6 ? Math.min(0.05, 0.08*(7-nT)/nT) : 0;
  const fDia = nT>=1 && nT<=6 ? (treino ? 1+y : 1 - y*nT/(7-nT)) : 1;
  const kcalDia = _E ? _E.kcal : Math.round(calc0.kcal*fDia/10)*10;
  const carbDia = Math.max(80, Math.round((kcalDia - calc0.prot*4 - calc0.gord*9)/4/5)*5);
  const calc = {...calc0, kcal:kcalDia, carb:carbDia, energia:_E};
  const shares = NUTRI_SHARE[n.refeicoes] || NUTRI_SHARE[5];
  const slots = NUTRI_REFEICOES.filter(r => shares[r.id]);
  const montar = (gf)=> slots.map((r,idx)=>{
    const pr = famPrato(r, diaIdx, P, n, idx, dk);
    const alvo = calc.kcal * shares[r.id];
    // Beta 52: o que o administrador tira ou acrescenta muda as calorias de cada um (o resto do prato não é
    // recalculado), a não ser que ele ligue "manter as calorias de cada um" (config.compensa)
    const compensa = !!(P.casa && P.compensa);
    const f = Math.min(2.4, Math.max(.55, alvo*gf/((pr.mudou && !compensa) ? pr.k0orig : pr.k0)));       // a porção é SEMPRE a desta pessoa
    const itens = pr.itens.map(([id,q])=>nutriItem(id, q, f));
    const tot = itens.reduce((t,i)=>({kcal:t.kcal+i.kcal,p:t.p+i.p,c:t.c+i.c,g:t.g+i.g}),{kcal:0,p:0,c:0,g:0});
    const recKcal = (pr.mudou && !compensa) ? pr.orig.reduce((s,[id,q])=>s + nutriItem(id, q, f).kcal, 0) : tot.kcal;
    const preTreino = treino && r.id==='lanche2';
    const daCasa = pr.comp && P.casa;
    const hora = (daCasa && (P.horas||{})[r.id] && /^\d{2}:\d{2}$/.test(P.horas[r.id])) ? P.horas[r.id] : r.hora;
    return { id:r.id, chave:pr.chave, nome: preTreino ? 'Pré-treino' : r.nome, icone: preTreino ? '⚡' : r.icone, hora, prato:pr.op.n, itens, tot, variante:pr.v+1, total:pr.total, preTreino,
      compartilhada: daCasa, foraDaCasa: !!pr.fora, tiradosCasa: daCasa ? pr.tirados : [], acrescentadosCasa: daCasa ? pr.acrescentados : [], mudouCasa: !!(daCasa && pr.mudou), compensada: !!(daCasa && pr.mudou && compensa),
      recKcal: Math.round(recKcal), casaDelta: Math.round(tot.kcal - recKcal), fator:f, alvoKcal: Math.round(alvo) };
  });
  let refeicoes = montar(1);
  const somaK = rs => rs.reduce((s,m)=>s+m.recKcal,0);
  if(Math.abs(somaK(refeicoes)-calc.kcal)/calc.kcal > 0.03) refeicoes = montar(Math.min(1.35, Math.max(.75, calc.kcal/somaK(refeicoes))));
  const dia = refeicoes.reduce((t,m)=>({kcal:t.kcal+m.tot.kcal,p:t.p+m.tot.p,c:t.c+m.tot.c,g:t.g+m.tot.g}),{kcal:0,p:0,c:0,g:0});
  const dicas = [];
  const faltaP = calc.prot - dia.p;
  if(faltaP > calc.prot*0.12) dicas.push(`Para fechar sua proteína, faltam ~${Math.round(faltaP/5)*5} g: some 1 scoop de whey (≈ 24 g) ou ${Math.ceil(faltaP/6.5)} ovos ao longo do dia.`);
  if(treino) dicas.push('Hoje é dia de treino: faça o lanche pré-treino 1 a 2 h antes e capriche na proteína depois.');
  else dicas.push('Dia de descanso: calorias um pouco menores, mas mantenha a proteína. É nela que o músculo se recupera.');
  if(calc.objetivo==='emagrecer') dicas.push('Priorize proteína em toda refeição e legumes à vontade: ajudam a manter a saciedade e a massa muscular.');
  if(calc.objetivo==='massa') dicas.push('Não pule refeições: para ganhar massa, o difícil costuma ser comer o suficiente todo dia.');
  if(P.casa && refeicoes.some(m=>m.compartilhada)) dicas.push('Nas refeições da casa o prato é o mesmo para todos; a quantidade e as calorias são as do seu plano.');
  dicas.push('Beba água ao longo do dia, não só nas refeições. Em dia de treino, some uns 500 ml.');
  const casaDelta = refeicoes.reduce((s,m)=>s + (m.casaDelta||0), 0);
  return { calc, refeicoes, dia, dicas, treino, diaIdx, casaDelta, diaRec: Math.round(dia.kcal - casaDelta) };
};

// ---------- gravação no grupo ----------
function _famTempo(p, ms){ return Promise.race([p, new Promise((_,rej)=>setTimeout(()=>rej({ code:'timeout' }), ms || 12000))]); }
async function _famAtualiza(campos){
  const id = famId(); if(!id || !campos || !Object.keys(campos).length) return false;
  try{ await _famTempo(db.collection('familias').doc(id).update(campos)); return true; }
  catch(e){
    console.log('casa (gravar):', e && (e.code || e.message));
    if(e && e.code === 'permission-denied') toast('Não foi possível salvar no grupo da casa: só o administrador muda o cardápio compartilhado.');
    return false;
  }
}
const _famMeuMeal = (pl, mid)=> pl && !pl.erro ? pl.refeicoes.find(m=>m.id===mid) : null;

// ---------- trocar o prato ----------
const _nutriTrocarB46 = window.nutriTrocar;
window.nutriTrocar = function(chave){
  const mid = String(chave).replace(/v$/,'');
  const P = famParams(); const d = nutriDiaSel(), dk = nutriKeyDia(d);
  const n = nutriConfig();
  // fora da casa só neste dia: a pessoa troca dentro do próprio cardápio (contador do dia)
  if(P && P.casa && famFora(dk, mid)){
    n.famFora = n.famFora || {}; n.famFora[_famForaKey(dk, mid)] = famFora(dk, mid) + 1;
    try{ const dia = (state.nutriLog||{})[dk]; if(dia) delete dia[mid]; }catch(e){}
    nutriAbrirRef(chave); saveData(); return openNutri();
  }
  if(!P || !famDaCasaNoDia(P, mid, d, dk)) return _nutriTrocarB46.apply(this, arguments);
  if(!P.casa){   // cardápio guardado depois de sair do grupo
    n.cardapioFixo.trocas = n.cardapioFixo.trocas || {}; n.cardapioFixo.trocas[chave] = (n.cardapioFixo.trocas[chave]||0) + 1;
    try{ const dia = (state.nutriLog||{})[dk]; if(dia) delete dia[mid]; }catch(e){}
    nutriAbrirRef(chave); saveData(); return openNutri();
  }
  if(famSouAdm()){
    const c = famCache(); c.config = c.config || {}; c.config.trocas = c.config.trocas || {};
    c.config.trocas[chave] = (c.config.trocas[chave]||0) + 1;
    const campos = { ['config.trocas.' + chave]: c.config.trocas[chave] };
    // o que foi tirado/acrescentado era do prato anterior (só no dia escolhido)
    if(c.cardapio && c.cardapio[dk] && c.cardapio[dk][mid]){ delete c.cardapio[dk][mid]; campos['cardapio.' + dk + '.' + mid] = firebase.firestore.FieldValue.delete(); }
    _famGuardaCache(c); _famAtualiza(campos);
    try{ const dia = (state.nutriLog||{})[dk]; if(dia) delete dia[mid]; }catch(e){}
    nutriAbrirRef(chave); saveData(); famAgendaEnvio(); toast('🏠 Prato da casa trocado para todos. Cada um continua com a própria porção.');
    return openNutri();
  }
  if(famTrocaPropria()){
    return famEscolha('Trocar o prato', `O ${FAM_NOMES_REF_MIN[mid]||'prato'} de ${NUTRI_DIAS[d-1].toLowerCase()} é da casa. Você pode comer outro prato só neste dia; para os outros nada muda.`, [
      { t:'Trocar só para mim neste dia', f:()=>{ n.famFora = n.famFora || {}; n.famFora[_famForaKey(dk, mid)] = 1; try{ const dia = (state.nutriLog||{})[dk]; if(dia) delete dia[mid]; }catch(e){} nutriAbrirRef(chave); saveData(); openNutri(); } }
    ]);
  }
  toast(`Só ${famNome(famAdmUid())} (administrador da casa) troca o prato da casa. Você pode ajustar a sua quantidade ou usar as trocas equivalentes.`);
};
function famVoltarCasa(mid){
  const dk = nutriKeyDia(nutriDiaSel()); const n = nutriConfig();
  if(n.famFora){ delete n.famFora[_famForaKey(dk, mid)]; if(!Object.keys(n.famFora).length) delete n.famFora; }
  try{ const dia = (state.nutriLog||{})[dk]; if(dia) delete dia[mid]; }catch(e){}
  nutriAbrirRef(mid); saveData(); openNutri();
}
// limpa marcações "fora da casa" de dias que já passaram
function _famPodaFora(){ try{ const n = nutriConfig(); if(!n.famFora) return; const lim = chaveDia(new Date(Date.now() - 8*86400000)); Object.keys(n.famFora).forEach(k=>{ if(k.split('|')[0] < lim) delete n.famFora[k]; }); if(!Object.keys(n.famFora).length) delete n.famFora; }catch(e){} }

// ---------- escolha simples (2 ou 3 caminhos) ----------
function famEscolha(titulo, texto, opcoes){
  window.__famOpc = opcoes; const _mi = $('modal-inner'); if(_mi) _mi.dataset.tela = 'nutri-sub';
  $('modal-inner').innerHTML = `<div id="fam-escolha"><h3>${mtEsc(titulo)}</h3><p class="fam-p">${texto}</p>
    ${opcoes.map((o,i)=>`<button class="btn ${i===0?'btn-primary':'btn-ghost'} btn-block" style="margin-top:8px" onclick="famEscolhaOk(${i})">${mtEsc(o.t)}</button>`).join('')}
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openNutri()">Cancelar</button></div>`;
  $('modal-back').classList.add('on');
}
function famEscolhaOk(i){ const o = (window.__famOpc||[])[i]; window.__famOpc = null; if(o && o.f) o.f(); }

// ---------- administrador: tirar e acrescentar alimentos no prato da casa ----------
function _famComposicaoSalva(dk, mid, cp){
  const c = famCache(); c.cardapio = c.cardapio || {}; c.cardapio[dk] = c.cardapio[dk] || {};
  const vazio = !cp.x.length && !cp.add.length;
  if(vazio) delete c.cardapio[dk][mid]; else c.cardapio[dk][mid] = { x:cp.x.slice(), add:cp.add.map(a=>({ id:a.id, q:a.q })) };
  if(!Object.keys(c.cardapio[dk]).length) delete c.cardapio[dk];
  _famGuardaCache(c);
  _famAtualiza({ ['cardapio.' + dk + '.' + mid]: vazio ? firebase.firestore.FieldValue.delete() : c.cardapio[dk][mid] });
  famAgendaEnvio();
}
function famTirarDaCasa(mid, fid){
  const dk = nutriKeyDia(nutriDiaSel()); const P = famParams(); const cp = _famComposicao(P, dk, mid);
  const cp2 = { x:cp.x.slice(), add:cp.add.filter(a=>a.id !== fid) };
  if(cp2.add.length === cp.add.length && !cp2.x.includes(fid)) cp2.x.push(fid);
  try{ const m = nutriMealLog(mid, false); if(m && m.adj) delete m.adj[fid]; }catch(e){}
  _famComposicaoSalva(dk, mid, cp2); nutriAbrirRef(mid); saveData();
  toast(famParams().compensa ? '🏠 Tirado do prato da casa. As porções foram recalculadas para manter as calorias de cada um.' : '🏠 Tirado do prato da casa. Cada pessoa vê no próprio plano quantas calorias a menos ficou.');
  openNutri();
}
function famVoltarNaCasa(mid, fid){
  const dk = nutriKeyDia(nutriDiaSel()); const P = famParams(); const cp = _famComposicao(P, dk, mid);
  _famComposicaoSalva(dk, mid, { x:cp.x.filter(x=>x!==fid), add:cp.add }); nutriAbrirRef(mid); saveData(); openNutri();
}
const _nutriRemoverB49 = window.nutriRemover;
window.nutriRemover = function(mid, fid){
  if(!famSouAdm() || !famCompartilhada(mid)) return _nutriRemoverB49.apply(this, arguments);
  const m = nutriMealLog(mid, false);
  if(m && m.adj && m.adj[fid] && m.adj[fid].x) return _nutriRemoverB49.apply(this, arguments);     // desfazer o "só eu"
  const nome = (NUTRI_ALIMENTOS[fid]||[''])[0];
  famEscolha('Tirar ' + nome, 'Você administra a alimentação da casa. Isso vale para todos ou só para você?', [
    { t:'Tirar do prato da casa (todos)', f:()=>famTirarDaCasa(mid, fid) },
    { t:'Só eu não vou comer', f:()=>_nutriRemoverB49(mid, fid) }
  ]);
};
const _nutriAddAbrirB49 = window.nutriAddAbrir;
window.nutriAddAbrir = function(mid){
  window.__famAddCasa = false;
  if(!famSouAdm() || !famCompartilhada(mid)) return _nutriAddAbrirB49.apply(this, arguments);
  famEscolha('Acrescentar alimento', 'Acrescentar ao prato da casa (todos recebem, cada um na própria proporção) ou só para você?', [
    { t:'Acrescentar ao prato da casa', f:()=>{ window.__famAddCasa = true; _nutriAddAbrirB49(mid); } },
    { t:'Só para mim', f:()=>{ window.__famAddCasa = false; _nutriAddAbrirB49(mid); } }
  ]);
};
const _nutriAddCustomB49 = window.nutriAddCustom;
window.nutriAddCustom = function(){
  if(window.__famAddCasa){ window.__famAddCasa = false; toast('Alimento digitado à mão vale só para você (não tem a tabela nutricional para calcular a porção de cada um).'); }
  return _nutriAddCustomB49.apply(this, arguments);
};
const _nutriEdRenderB49 = window.nutriEdRender;
window.nutriEdRender = function(){
  const r = _nutriEdRenderB49.apply(this, arguments);
  try{ const e = window.__ned; if(e && e.mode === 'add' && window.__famAddCasa){ const p = document.querySelector('#modal-inner p'); if(p) p.innerHTML = 'Quanto <b>você</b> vai comer? Os outros recebem a quantidade proporcional à porção de cada um, e as porções da refeição são recalculadas para manter as calorias de todos.'; const b = document.querySelector('#modal-inner .btn-primary'); if(b) b.textContent = 'Acrescentar ao prato da casa'; } }catch(err){}
  return r;
};
const _nutriEdSalvarB49 = window.nutriEdSalvar;
window.nutriEdSalvar = function(reset){
  const e = window.__ned;
  if(e && e.mode === 'add' && window.__famAddCasa && famSouAdm() && famCompartilhada(e.mid)){
    window.__famAddCasa = false;
    if(!(e.q > 0)) return openNutri();
    const pl = nutriMontarPlano(nutriDiaSel()); const meal = _famMeuMeal(pl, e.mid); const f = (meal && meal.fator) || 1;
    const qBase = NUTRI_ALIMENTOS[e.fid][5] ? Math.max(0.5, Math.round(e.q/f*2)/2) : Math.max(1, Math.round(e.q/f));
    const dk = nutriKeyDia(nutriDiaSel()); const cp = _famComposicao(famParams(), dk, e.mid);
    const add = cp.add.slice(); const ex = add.find(a=>a.id===e.fid); if(ex) ex.q = +ex.q + qBase; else add.push({ id:e.fid, q:qBase });
    _famComposicaoSalva(dk, e.mid, { x:cp.x.filter(x=>x!==e.fid), add });
    nutriAbrirRef(e.mid); saveData(); toast('🏠 Acrescentado ao prato da casa.'); return openNutri();
  }
  return _nutriEdSalvarB49.apply(this, arguments);
};

// ---------- publicar o MEU perfil no grupo (só a minha chave) ----------
// compras = o que eu vou comer de cada alimento nos próximos dias (já com as minhas edições). É o que a lista
// da casa soma. Não leva peso, idade, altura nem calorias.
function nutriComprasMinhas(dias){
  const out = {}; dias = dias || FAM_DIAS_COMPRAS;
  const hojeIdx = getDayIdx();
  for(let k=0; k<dias; k++){
    const d = ((hojeIdx-1+k)%7)+1, dk = chaveDia(new Date(Date.now()+k*86400000));
    const pl = nutriMontarPlanoData(d, dk); if(!pl || pl.erro) continue;
    const lg = nutriLogDe(dk); const dia = {};
    const soma = (id,g)=>{ if(!(g>0) || (window.NUTRI_FORA_IDS && window.NUTRI_FORA_IDS.has(id))) return; dia[id] = Math.round((dia[id]||0) + g); };
    pl.refeicoes.forEach(m=>{ const l = lg(m.id);
      m.itens.forEach(i=>{ const e = nutriEfetivo(i, l.adj[i.id]); if(!e.removido) soma(e.id, e.gramas); });
      (l.add||[]).forEach((a,idx)=>{ const x = nutriItemExtra(a,idx); if(x && !x.custom) soma(x.id, x.gramas); }); });
    if(Object.keys(dia).length) out[dk] = dia;
  }
  return out;
}
// o plano de um dia da semana que pode estar na semana que vem (lista de "próximos 7 dias")
function nutriMontarPlanoData(d, dk){ return nutriMontarPlano(d, dk); }
function _famMeuPerfil(){
  const r = _famMeuPerfilRestr(); const fatores = {};
  try{
    for(let d=1; d<=7; d++){ const pl = nutriMontarPlano(d); if(pl.erro) continue;
      pl.refeicoes.forEach(m=>{ if(m.compartilhada){ fatores[d] = fatores[d] || {}; fatores[d][m.id] = Math.round(m.fator*1000)/1000; } }); }
  }catch(e){}
  let compras = {}; try{ compras = nutriComprasMinhas(); }catch(e){}
  let semana = {}; try{ semana = famMinhaSemana(); }catch(e){}
  return { veg:r.veg, lac:r.lac, glu:r.glu, fatores, compras:{ de: chaveDia(new Date()), dias: compras }, semana };
}
function famEnviar(){
  try{
    if(!famAtiva()) return;
    const c = famCache(), uid = _famUid(); const campos = {};
    const meu = _famMeuPerfil(); const ant = (c.perfis||{})[uid] || null;
    const sem = p=>p ? JSON.stringify({ veg:p.veg, lac:p.lac, glu:p.glu, fatores:p.fatores, compras:p.compras, semana:p.semana||null }) : '';
    if(sem(ant) !== sem(meu)){ meu.em = Date.now(); campos['perfis.' + uid] = meu; c.perfis = c.perfis || {}; c.perfis[uid] = meu; }
    const apelido = _famMeuApelido(); if((c.nomes||{})[uid] !== apelido){ campos['nomes.' + uid] = apelido; c.nomes = c.nomes || {}; c.nomes[uid] = apelido; }
    if(famSouAdm()){
      // poda do cardápio antigo e do registro da Beta 46–48 (o "comi" deixou de ser compartilhado)
      const lim = chaveDia(new Date(Date.now() - FAM_DIAS_CARDAPIO*86400000));
      Object.keys(c.cardapio||{}).forEach(dk=>{ if(dk < lim){ campos['cardapio.' + dk] = firebase.firestore.FieldValue.delete(); delete c.cardapio[dk]; } });
      if(c.registro){ campos.registro = firebase.firestore.FieldValue.delete(); delete c.registro; }
    }
    _famGuardaCache(c);
    if(Object.keys(campos).length) _famAtualiza(campos);
  }catch(e){ console.log('casa (enviar):', e); }
}
function famAgendaEnvio(ms){ clearTimeout(_famPushT); _famPushT = setTimeout(famEnviar, ms || 900); }
mtGancho('saveData', { depois(){ if(!famAtiva()) return; _famPodaFora(); famAgendaEnvio(); } });

// recebe o que mudou nos outros aparelhos: só configuração, composição, membros e perfis (nada de registro)
function _famAplica(doc){
  const uid = _famUid(); const ant = famCache() || {};
  if(!doc || !Array.isArray(doc.membros) || !doc.membros.includes(uid)){ famSaiuLocal('removido'); return; }
  // comparação estável (a nuvem pode devolver as chaves dos mapas em outra ordem: antes isso redesenhava a tela
  // a cada gravação própria, e ela "piscava" e voltava ao topo)
  const ord = v=>Array.isArray(v) ? v.map(ord) : (v && typeof v === 'object') ? Object.keys(v).sort().reduce((o,k)=>{ if(k !== '__id') o[k] = ord(v[k]); return o; }, {}) : v;
  const J = x=>JSON.stringify(ord(x || null));
  const cardapioMudou = J(doc.config) !== J(ant.config) || J(doc.cardapio) !== J(ant.cardapio);
  const perfisMudaram = J(doc.perfis) !== J(ant.perfis);
  const mudou = cardapioMudou || J(doc.membros) !== J(ant.membros) || J(doc.nomes) !== J(ant.nomes) || doc.dono !== ant.dono
    || (perfisMudaram && _famRestricoesMudaram(doc, ant));
  _famGuardaCache(doc);
  if(cardapioMudou || J(doc.perfis && doc.perfis[uid]) === 'null') famAgendaEnvio(1500);      // o prato mudou: minha lista também
  if(mudou) _famRedesenha();
  else if(perfisMudaram){ try{ const mi = $('modal-inner'); if($('modal-back').classList.contains('on') && mi && mi.querySelector('#fam-compras') && window.__comprasModo === 'casa') nutriListaCompras(); }catch(e){} }
}
// restrições (vegetariano, sem lactose, sem glúten) de alguém mudaram → o prato da casa pode mudar
function _famRestricoesMudaram(doc, ant){
  const r = d=>Object.keys((d && d.perfis) || {}).sort().map(u=>{ const p = d.perfis[u] || {}; return u + ':' + (!!p.veg) + (!!p.lac) + (!!p.glu); }).join('|');
  return r(doc) !== r(ant);
}
function _famRedesenha(){
  try{
    const mi = $('modal-inner'), back = $('modal-back');
    const aberto = back && back.classList.contains('on') && mi;
    if(aberto && mi.dataset.tela === 'nutri') openNutri();
    else if(aberto && mi.querySelector('#fam-tela')) openFamilia();
    else if(aberto && mi.querySelector('#fam-compras')) nutriListaCompras();
    if(state.ui && state.ui.tab === 'home') try{ renderHome(); }catch(e){}
  }catch(e){}
}
function famOuvir(){
  try{
    if(_famUnsub){ _famUnsub(); _famUnsub = null; }
    const id = famId(); if(!id || !_famUid() || typeof db === 'undefined') return;
    _famUnsub = db.collection('familias').doc(id).onSnapshot(s=>{
      if(!s.exists){ famSaiuLocal('apagado'); return; }
      _famAplica(s.data());
    }, e=>{ console.log('casa (ouvir):', e && e.code); if(e && e.code === 'permission-denied') famSaiuLocal('removido'); });
  }catch(e){ console.log('casa:', e); }
}
mtGancho('bootAfterAuth', { depois(){ setTimeout(()=>{ if(famId()){ famOuvir(); famAgendaEnvio(3000); } }, 1500); } });

// ---------- criar, entrar, sair ----------
function _famCodigo(){ let s = ''; const r = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint32Array(6)) : Array.from({length:6}, ()=>Math.floor(Math.random()*1e9)); for(let i=0;i<6;i++) s += FAM_LETRAS[r[i] % FAM_LETRAS.length]; return s; }
function _famMeuApelido(){ const p = (state.user && state.user.profile) || {}; return String(p.nickname || (fbUser && fbUser.displayName) || 'Eu').trim().split(' ')[0].slice(0, 24) || 'Eu'; }
// Beta 49: a criação NÃO lê o código antes. Ler um documento que ainda não existe é negado pelas regras para
// quem não é membro (a regra de leitura olha a lista de membros) — o app achava que todo código estava
// "ocupado" e desistia com "Não consegui gerar um código livre" (só funcionava na conta do administrador
// principal). Agora grava direto: as regras só aceitam CRIAR (um documento novo com a pessoa como único
// membro); se o código já existir, a gravação vira alteração, é negada, e o app tenta outro código.
async function famCriar(){
  if(!mtTem('alimentacao')) return mtPremiumAviso('alimentacao');
  const uid = _famUid(); if(!uid) return toast('Entre na sua conta para criar o grupo da casa.');
  if(navigator.onLine === false) return toast('Sem internet agora. Conecte-se para criar o grupo da casa.');
  const n = nutriConfig();
  const msg = t=>{ const e = $('fam-msg'); if(e) e.textContent = t; };
  msg('Criando o grupo…');
  let negadas = 0;
  for(let t=0; t<6; t++){
    const id = _famCodigo();
    const doc = { membros:[uid], dono:uid, nomes:{ [uid]: _famMeuApelido() }, perfis:{}, config:{ refeicoes: FAM_REF_PADRAO.slice(), economico: n.economico !== false, seed: +n.seed || 0, trocas:{}, dias:{}, horas:{}, trocaPropria:false }, cardapio:{}, criadoEm: Date.now(), v:2 };
    try{
      await _famTempo(db.collection('familias').doc(id).set(doc));
      n.familia = { id, desde: Date.now() }; delete n.cardapioFixo; delete n.famFora;
      _famGuardaCache(doc); saveData(); famOuvir(); famAgendaEnvio(300);
      toast('🏠 Grupo da casa criado. Você é o administrador. Mande o código para quem mora com você.');
      return openFamilia();
    }catch(e){
      const code = e && e.code;
      console.log('casa (criar):', code || e);
      if(code === 'permission-denied'){ negadas++; continue; }     // código já usado: tenta outro
      if(code === 'timeout' || code === 'unavailable') return msg('Sem conexão com o servidor agora. Tente de novo em instantes.');
      return msg('Não consegui criar o grupo agora. Confira a internet e tente de novo.');
    }
  }
  msg(negadas ? 'O servidor recusou a criação do grupo. Se isso continuar, avise o suporte do MetaTreino (regras do servidor desatualizadas).' : 'Não consegui criar o grupo agora. Tente de novo.');
}
async function famEntrar(){
  if(!mtTem('alimentacao')) return mtPremiumAviso('alimentacao');
  const uid = _famUid(); if(!uid) return toast('Entre na sua conta para participar.');
  const inp = $('fam-codigo'); const id = String((inp && inp.value) || '').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const msg = t=>{ const e = $('fam-msg'); if(e) e.textContent = t; };
  if(id.length !== 6) return msg('O código tem 6 letras e números.');
  if(navigator.onLine === false) return msg('Sem internet agora. Conecte-se para entrar no grupo.');
  msg('Entrando…');
  try{
    await _famTempo(db.collection('familias').doc(id).update({ membros: firebase.firestore.FieldValue.arrayUnion(uid), ['nomes.' + uid]: _famMeuApelido() }));
    const s = await _famTempo(db.collection('familias').doc(id).get());
    const d = s.data();
    if(!d || !(d.membros||[]).includes(uid)) return msg('Não consegui entrar. Confira o código.');
    const n = nutriConfig(); n.familia = { id, desde: Date.now() }; delete n.cardapioFixo; delete n.famFora;
    _famGuardaCache(d); saveData(); famOuvir(); famAgendaEnvio(300);
    toast('🏠 Pronto! O prato das refeições da casa é o mesmo para todos; a sua porção continua a sua.');
    openFamilia();
  }catch(e){
    const code = e && e.code;
    console.log('casa (entrar):', code || (e && e.message));
    msg(code === 'not-found' ? 'Código não encontrado. Confira com quem criou o grupo.'
      : code === 'permission-denied' ? `Não foi possível entrar: o grupo já tem ${FAM_MAX} pessoas.`
      : 'Sem conexão agora. Tente de novo em instantes.');
  }
}
// sai mantendo o cardápio: o prato da casa vira o "cardápio guardado" desta pessoa
function _famCongela(){
  const P = famParams(); const n = nutriConfig();
  if(P && P.casa) n.cardapioFixo = { refeicoes:P.refeicoes.slice(), seed:P.seed, trocas:Object.assign({}, P.trocas), veg:P.veg, lac:P.lac, glu:P.glu, economico:P.economico, dias:Object.assign({}, P.dias) };
}
function famSaiuLocal(motivo){
  if(!famId()) return;
  try{ if(_famUnsub){ _famUnsub(); _famUnsub = null; } }catch(e){}
  _famCongela();
  try{ localStorage.removeItem(_famCacheKey()); }catch(e){}
  const n = nutriConfig(); delete n.familia; delete n.famFora; window.__famCache = null;
  saveData();
  if(motivo === 'removido' || motivo === 'apagado') toast('🏠 Você não faz mais parte do grupo da casa. Seu cardápio atual foi mantido.');
  _famRedesenha();
}
function famSair(){
  const c = famCache() || {}, uid = _famUid();
  const outros = (c.membros||[]).filter(x=>x!==uid);
  if(c.dono === uid && outros.length > 1){
    return famEscolha('Antes de sair, escolha o novo administrador', 'Quem fica cuidando do cardápio da casa?', outros.map(o=>({ t:famNome(o), f:()=>_famSairConfirma(o) })));
  }
  _famSairConfirma(outros[0] || null);
}
function _famSairConfirma(novoAdm){
  appConfirm('Você sai do grupo da casa. O cardápio que está agora continua igual no seu app; as próximas mudanças deixam de aparecer para os outros.', async ()=>{
    const id = famId(), uid = _famUid(), c = famCache() || {};
    const outros = (c.membros||[]).filter(x=>x!==uid);
    try{
      if(!outros.length) await _famTempo(db.collection('familias').doc(id).delete());
      else {
        const campos = { membros: firebase.firestore.FieldValue.arrayRemove(uid), ['nomes.' + uid]: firebase.firestore.FieldValue.delete(), ['perfis.' + uid]: firebase.firestore.FieldValue.delete() };
        if(c.dono === uid) campos.dono = (novoAdm && outros.includes(novoAdm)) ? novoAdm : outros[0];
        await _famTempo(db.collection('familias').doc(id).update(campos));
      }
      famSaiuLocal('saiu'); toast('Você saiu do grupo da casa. Seu cardápio foi mantido.'); openNutri();
    }catch(e){ console.log('casa (sair):', e); toast('Não consegui sair agora (sem conexão?). Tente de novo.'); }
  }, { title:'Sair do grupo da casa?', emo:'🏠', okLabel:'Sair e manter meu cardápio' });
}
function famPassarAdm(outro){
  if(!famSouAdm() || !famMembros().includes(outro) || outro === _famUid()) return;
  appConfirm(`${famNome(outro)} passa a administrar o cardápio da casa (trocar pratos, tirar e acrescentar alimentos, dias e horários). Você continua no grupo com a sua porção.`, async ()=>{
    const ok = await _famAtualiza({ dono: outro });
    if(ok){ const c = famCache(); c.dono = outro; _famGuardaCache(c); toast('Administração passada para ' + famNome(outro) + '.'); }
    openFamilia();
  }, { title:'Passar a administração?', emo:'🏠', okLabel:'Passar', onCancel:()=>openFamilia() });
}
function famRemoverMembro(outro){
  if(!famSouAdm() || outro === _famUid()) return;
  appConfirm(`${famNome(outro)} sai do grupo da casa. O cardápio atual continua no app dessa pessoa, só deixa de acompanhar a casa.`, async ()=>{
    const ok = await _famAtualiza({ membros: firebase.firestore.FieldValue.arrayRemove(outro), ['nomes.' + outro]: firebase.firestore.FieldValue.delete(), ['perfis.' + outro]: firebase.firestore.FieldValue.delete() });
    if(ok) toast(famNome(outro) + ' saiu do grupo da casa.');
    openFamilia();
  }, { title:'Tirar do grupo da casa?', emo:'🏠', okLabel:'Tirar do grupo', onCancel:()=>openFamilia() });
}
// configuração (só o administrador)
function _famCfgGrava(campo, valor){
  if(!famSouAdm()) return toast('Só o administrador da casa muda essa configuração.');
  const c = famCache(); c.config = c.config || {}; c.config[campo] = valor; _famGuardaCache(c);
  _famAtualiza({ ['config.' + campo]: valor }); famAgendaEnvio(); openFamilia();
}
function famAlternaRefeicao(mid){
  const refs = famRefs().slice(); const i = refs.indexOf(mid);
  if(i >= 0){ if(refs.length === 1) return toast('Deixe pelo menos uma refeição da casa (ou saia do grupo).'); refs.splice(i,1); } else refs.push(mid);
  _famCfgGrava('refeicoes', refs);
}
function famAlternaEconomico(){ _famCfgGrava('economico', !(_famCfg().economico !== false)); }
function famAlternaTrocaPropria(){ _famCfgGrava('trocaPropria', !famTrocaPropria()); }
function famAlternaDia(mid, d){
  const dias = famDiasRef(mid).slice(); const i = dias.indexOf(d);
  if(i >= 0){ if(dias.length === 1) return toast('Deixe pelo menos um dia (ou tire a refeição da casa).'); dias.splice(i,1); } else dias.push(d);
  const todos = Object.assign({}, _famCfg().dias || {}); dias.sort((a,b)=>a-b);
  if(dias.length === 7) delete todos[mid]; else todos[mid] = dias;
  _famCfgGrava('dias', todos);
}
function famHora(mid, v){
  const todos = Object.assign({}, _famCfg().horas || {});
  if(/^\d{2}:\d{2}$/.test(v||'')) todos[mid] = v; else delete todos[mid];
  _famCfgGrava('horas', todos);
}
function famCompartilharCodigo(){
  const id = famId(); if(!id) return;
  const t = `Vamos usar o mesmo cardápio no MetaTreino? Em Plano alimentar › Alimentação da casa, digite o código: ${id}`;
  if(navigator.share){ navigator.share({ text:t }).catch(()=>{}); return; }
  try{ navigator.clipboard.writeText(id).then(()=>toast('📋 Código copiado')); }catch(e){ toast('Código: ' + id); }
}

// ---------- tela ----------
function openFamilia(){
  if(!mtTem('alimentacao')) return mtPremiumAviso('alimentacao');
  const mi = $('modal-inner'); if(mi.dataset.tela === 'nutri') mi.dataset.tela = 'nutri-sub';
  const n = nutriConfig();
  const volta = `<button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openNutri()">← Voltar ao plano alimentar</button>`;
  if(!famAtiva()){
    mi.innerHTML = `<div id="fam-tela"><h3>🏠 Alimentação da casa</h3>
      <p class="fam-p">Para quem mora junto e come a mesma comida. <b>A comida é compartilhada, a alimentação é individual:</b> todos veem o mesmo prato, cada um com a <b>própria quantidade e calorias</b>, calculadas pelo plano de cada pessoa.</p>
      <ul class="fam-ul"><li>Quem cria o grupo é o administrador: decide o prato, os dias e os horários das refeições da casa. Dá para passar a administração depois.</li><li>A lista de compras e o PDF da casa somam o que cada pessoa vai comer.</li><li>Até ${FAM_MAX} pessoas. Cada uma precisa do plano alimentar (Premium).</li></ul>
      ${n.cardapioFixo ? '<p class="fam-mini">Você saiu de um grupo e manteve o cardápio daquela época nas refeições da casa.</p>' : ''}
      <button class="btn btn-primary btn-block" onclick="famCriar()">Criar o grupo da casa</button>
      <div class="fam-entrar"><label for="fam-codigo">Já tem um código?</label>
        <div class="fam-linha"><input id="fam-codigo" class="input" maxlength="6" autocomplete="off" autocapitalize="characters" placeholder="Ex.: K7M2QX" oninput="this.value=this.value.toUpperCase()" data-teclado>
        <button class="btn btn-ghost" onclick="famEntrar()">Entrar</button></div></div>
      <div id="fam-msg" class="fam-msg" aria-live="polite"></div>
      <p class="fam-mini">No grupo ficam só o apelido, as restrições alimentares (vegetariano, sem lactose, sem glúten), o cardápio da casa e o total de compras de cada um. Peso, idade, altura e e-mail não são compartilhados.</p>
      ${volta}</div>`;
    $('modal-back').classList.add('on'); mi.scrollTop = 0; return;
  }
  const c = famCache(), uid = _famUid(), P = famParams(), adm = famSouAdm(), admUid = famAdmUid();
  const restr = [P.veg?'vegetariano':'', P.lac?'sem lactose':'', P.glu?'sem glúten':''].filter(Boolean);
  const dis = adm ? '' : 'disabled aria-disabled="true"';
  const membros = famMembros().map(m=>`<div class="fam-membro"><span class="fam-pessoa">${m===uid?'Você':mtEsc(famNome(m))}${m===admUid?' <small>administrador</small>':''}</span>${adm && m!==uid ? `<span class="fam-acoes"><button class="fam-link" onclick="famPassarAdm('${mtJsStr(m)}')">Tornar administrador</button><button class="fam-link" onclick="famRemoverMembro('${mtJsStr(m)}')">Tirar</button></span>` : ''}</div>`).join('');
  const refsCasa = famRefs();
  const blocoRef = refsCasa.map(mid=>{ const dias = famDiasRef(mid); const h = famHoraRef(mid) || (NUTRI_REFEICOES.find(r=>r.id===mid)||{}).hora || '';
    return `<div class="fam-ref"><div class="fam-ref-t"><b>${FAM_NOMES_REF[mid]}</b>${adm ? `<input type="time" class="input fam-hora" value="${h}" aria-label="Horário do ${FAM_NOMES_REF_MIN[mid]}" onchange="famHora('${mid}', this.value)">` : `<span class="fam-mini">${h}</span>`}</div>
      <div class="fam-dias" role="group" aria-label="Dias em que o ${FAM_NOMES_REF_MIN[mid]} é da casa">${FAM_DIAS_CURTO.map((t,i)=>`<button class="fam-dia ${dias.includes(i+1)?'on':''}" ${dis} aria-pressed="${dias.includes(i+1)}" aria-label="${NUTRI_DIAS[i]}" onclick="famAlternaDia('${mid}',${i+1})">${t}</button>`).join('')}</div></div>`; }).join('');
  mi.innerHTML = `<div id="fam-tela"><h3>🏠 Alimentação da casa</h3>
    <div class="fam-codigo-box"><small>Código do grupo</small><b>${mtEsc(famId())}</b><button class="btn btn-ghost" onclick="famCompartilharCodigo()">Convidar</button></div>
    <p class="fam-p"><b>A comida é compartilhada, a alimentação é individual.</b> O prato é o mesmo para todos; a quantidade e as calorias de cada um vêm do próprio plano.</p>
    <div class="fam-sec">Quem está na casa (${famMembros().length}/${FAM_MAX})</div>
    <div class="fam-membros">${membros}</div>
    <p class="fam-mini">${adm ? 'Você é o administrador: troca o prato, tira ou acrescenta alimentos no prato da casa e define dias e horários.' : `${mtEsc(famNome(admUid))} administra o cardápio da casa. Você vê o prato da casa com a sua porção e pode ajustar a sua quantidade.`}</p>
    <div class="fam-sec">Refeições da casa</div>
    <div class="fam-chips">${Object.keys(FAM_NOMES_REF).map(k=>`<button class="rc-chip ${refsCasa.includes(k)?'on':''}" ${dis} aria-pressed="${refsCasa.includes(k)}" onclick="famAlternaRefeicao('${k}')">${FAM_NOMES_REF[k]}</button>`).join('')}</div>
    <div class="fam-refs">${blocoRef}</div>
    <p class="fam-mini">Quem usa menos refeições por dia (por exemplo 4) segue só as que existem no plano dele. Nos dias desmarcados, a refeição volta a ser individual.</p>
    <div class="mod-toggle" style="margin:8px 0 0"><button class="seg ${P.economico?'on':''}" ${dis} style="font-size:12px;padding:10px 4px" onclick="famAlternaEconomico()">💰 Pratos econômicos na casa</button><button class="seg ${famTrocaPropria()?'on':''}" ${dis} style="font-size:12px;padding:10px 4px" onclick="famAlternaTrocaPropria()">🔄 Cada um pode trocar só para si</button></div>
    ${restr.length ? `<p class="fam-p" style="margin-top:10px">As refeições da casa respeitam as restrições de todos: <b>${restr.join(', ')}</b>.</p>` : ''}
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="nutriListaCompras(null,'casa')">🛒 Lista de compras da casa</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="pdfAlimentacaoCasa()">📄 Cardápio da casa em PDF</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="famSair()">Sair do grupo (mantém meu cardápio)</button>
    ${volta}</div>`;
  $('modal-back').classList.add('on'); mi.scrollTop = 0;
}

// entrada no plano alimentar + selo "Casa" e informações da casa em cada refeição compartilhada
mtGancho('openNutri', { depois(){
  try{
    if(!mtTem('alimentacao')) return;
    const mi = $('modal-inner'); if(!mi) return;
    const bt = mi.querySelector('[onclick="nutriListaCompras()"]'); if(!bt) return;
    if(!mi.querySelector('#fam-entrada')){
      const ativo = famAtiva();
      const sub = ativo ? `${famMembros().length} pessoas · ${famRefs().map(k=>FAM_NOMES_REF_MIN[k]).join(' e ')} da casa${famSouAdm()?' · você administra':''}` : 'mesmo prato, porção de cada um';
      bt.insertAdjacentHTML('afterend', `<button class="mealc rc-entrada" id="fam-entrada" onclick="openFamilia()"><span class="mi">🏠</span><span class="mt"><b>Alimentação da casa</b><small>${mtEsc(sub)}</small></span><span class="rc-seta">›</span></button>`);
    }
    if(!famAtiva()) return;
    bt.textContent = `🛒 Lista de compras (só eu ou da casa)`;
    const pdf = mi.querySelector('#nutri-pdf');
    if(pdf && !mi.querySelector('#nutri-pdf-casa')) pdf.insertAdjacentHTML('afterend', `<button class="btn btn-ghost btn-block" id="nutri-pdf-casa" style="margin:0 0 8px" onclick="pdfAlimentacaoCasa()">📄 Cardápio da casa em PDF</button>`);
    const pl = nutriMontarPlano(nutriDiaSel()); if(!pl || pl.erro) return;
    const adm = famSouAdm(), editavel = nutriDiaSel() >= getDayIdx();
    pl.refeicoes.forEach(m=>{
      const d = mi.querySelector(`details.mealc[ontoggle*="nutriTog('${m.chave}'"]`); if(!d) return;
      const t = d.querySelector('summary .mt b');
      if(m.compartilhada && t && !t.querySelector('.fam-selo')) t.insertAdjacentHTML('beforeend', ' <span class="fam-selo">Casa</span>');
      const mb = d.querySelector('.mb'); if(!mb || mb.querySelector('.fam-info')) return;
      if(m.compartilhada){
        const tir = (m.tiradosCasa||[]).filter(id=>NUTRI_ALIMENTOS[id]);
        mb.insertAdjacentHTML('afterbegin', `<div class="fam-info">🏠 Prato da casa${adm ? ' — você administra' : ` — decidido por ${mtEsc(famNome(famAdmUid()))}`}. A quantidade abaixo é a <b>sua</b>: ${Math.round(m.tot.kcal)} kcal.
          ${famAjusteHTML(m)}
          ${tir.length ? `<div class="fam-tirados">Fora do prato da casa hoje: ${tir.map(id=>`${mtEsc(NUTRI_ALIMENTOS[id][0])}${adm && editavel ? ` <button class="fam-link" onclick="famVoltarNaCasa('${m.id}','${id}')">devolver</button>` : ''}`).join(' · ')}</div>` : ''}</div>`);
      } else if(m.foraDaCasa){
        mb.insertAdjacentHTML('afterbegin', `<div class="fam-info">Neste dia você está com outro prato, só para você. ${editavel ? `<button class="fam-link" onclick="famVoltarCasa('${m.id}')">Voltar ao prato da casa</button>` : ''}</div>`);
      }
    });
  }catch(e){ console.log('casa (tela):', e); }
}});

// Beta 52: o que mudou no prato da casa e quanto isso muda as calorias DESTA pessoa
function famAjusteNomes(m){
  const tir = (m.tiradosCasa||[]).filter(id=>NUTRI_ALIMENTOS[id]).map(id=>'sem ' + NUTRI_ALIMENTOS[id][0].toLowerCase());
  const add = (m.acrescentadosCasa||[]).filter(id=>NUTRI_ALIMENTOS[id]).map(id=>'+ ' + NUTRI_ALIMENTOS[id][0].toLowerCase());
  return tir.concat(add);
}
function famAjusteHTML(m){
  if(!m || !m.mudouCasa) return '';
  const o = famAjusteNomes(m).join(', ');
  if(m.compensada) return `<div class="fam-ajuste">Ajuste da casa: ${mtEsc(o)}. As porções foram recalculadas para manter as suas ${Math.round(m.tot.kcal)} kcal.</div>`;
  const d = m.casaDelta || 0; const sinal = d > 0 ? '+' : d < 0 ? '−' : '';
  return `<div class="fam-ajuste ${d > 0 ? 'mais' : d < 0 ? 'menos' : ''}">Ajuste da casa: ${mtEsc(o)}.<br>Recomendado <b>${m.recKcal} kcal</b> → com o ajuste <b>${Math.round(m.tot.kcal)} kcal</b> (${d ? `${sinal}${Math.abs(d)} kcal` : 'igual'}).</div>`;
}

// ---------- lista de compras (e PDF): individual ou da casa ----------
// quantidade de compra padronizada: unidade, ml/L, g/kg (grãos e carnes em peso cru)
const NUTRI_LIQ = ['leite','leiteint','iogurte'];
function nutriQtdCompra(id, g){
  const a = NUTRI_ALIMENTOS[id]; if(!a) return { n:'', un:'', obs:'' };
  const br = v=>String(v).replace('.',',');
  if(a[5]) return { n:String(Math.max(1, Math.round(g/a[5]))), un:'unid.', obs:'' };
  if(id==='azeite' || id==='oleo'){ const ml = Math.max(10, Math.round(g/0.92/10)*10); return ml >= 1000 ? { n:br((ml/1000).toFixed(1)), un:'L', obs:'' } : { n:String(ml), un:'ml', obs:'' }; }
  if(NUTRI_LIQ.includes(id)){ const ml = Math.max(50, Math.round(g/50)*50); return ml >= 1000 ? { n:br((ml/1000).toFixed(1)), un:'L', obs:'' } : { n:String(ml), un:'ml', obs:'' }; }
  let gg = g, obs = '';
  if(NUTRI_CRU[id]){ gg = g/NUTRI_CRU[id]; obs = 'cru'; }
  gg = Math.max(50, Math.round(gg/50)*50);
  return gg >= 1000 ? { n:br((gg/1000).toFixed(gg % 1000 ? 1 : 0)), un:'kg', obs } : { n:String(gg), un:'g', obs };
}
// nome para comprar: sem "cozido/grelhado/assado" (compra-se o alimento cru; a quantidade já está convertida)
function nutriNomeCompra(id){ return String((NUTRI_ALIMENTOS[id]||[''])[0]).replace(/\s+(cozid[oa]|grelhad[oa]|assad[oa]|refogad[oa])\b/gi,'').replace(/\s*\(fatia\)/,'').replace(/\s{2,}/g,' ').trim(); }
function _nutriFmtCompra(id, t){ const q = nutriQtdCompra(id, t.g); return `${q.n} ${q.un}${q.obs ? ` (${q.obs})` : ''}`; }
function _nutriDiasJanela(escopo){
  const hojeIdx = getDayIdx(); const dias = [];
  if(escopo==='semana'){ for(let d=hojeIdx; d<=7; d++) dias.push({d, dk:nutriKeyDia(d)}); }
  else { for(let k=0; k<7; k++) dias.push({d:((hojeIdx-1+k)%7)+1, dk:chaveDia(new Date(Date.now()+k*86400000))}); }
  return dias;
}
function nutriComprasTotais(escopo, modo){
  escopo = escopo || 'semana';
  const dias = _nutriDiasJanela(escopo);
  const uid = _famUid() || 'eu';
  const tot = {}; const soma = (id, g, quem)=>{ if(!(g>0) || !NUTRI_ALIMENTOS[id] || (window.NUTRI_FORA_IDS && window.NUTRI_FORA_IDS.has(id))) return; const t = tot[id] = tot[id] || { g:0, por:{} }; t.g += g; t.por[quem] = (t.por[quem]||0) + g; };
  let editados = 0, diasOk = 0;
  dias.forEach(({d,dk})=>{
    const pl = nutriMontarPlanoData(d, dk); if(!pl || pl.erro) return; diasOk++;
    const lg = nutriLogDe(dk);
    pl.refeicoes.forEach(m=>{
      const l = lg(m.id);
      m.itens.forEach(i=>{ const e = nutriEfetivo(i, l.adj[i.id]); if(e.removido){ editados++; return; } if(e.editado) editados++; soma(e.id, e.gramas, uid); });
      (l.add||[]).forEach((a,idx)=>{ const x = nutriItemExtra(a,idx); if(x && !x.custom){ editados++; soma(x.id, x.gramas, uid); } });
    });
  });
  const casa = modo === 'casa' && famAtiva();
  const pessoas = [uid], avisos = [];
  if(casa){
    const c = famCache(), P = famParams();
    famMembros().filter(o=>o!==uid).forEach(o=>{
      const pf = (c.perfis||{})[o] || {};
      pessoas.push(o);
      const cp = pf.compras && pf.compras.dias;
      if(cp){
        let cobertos = 0;
        dias.forEach(({dk})=>{ const dia = cp[dk]; if(dia){ cobertos++; Object.keys(dia).forEach(id=>soma(id, +dia[id]||0, o)); } });
        if(cobertos < diasOk) avisos.push(`${famNome(o)}: a lista dessa pessoa foi atualizada em ${pf.em ? mtFmtData(pf.em) : 'data desconhecida'} e cobre ${cobertos} de ${diasOk} dias. Abrir o app no celular dela atualiza.`);
        return;
      }
      // versão antiga do app (sem "compras"): só o prato da casa, pela proporção da porção publicada
      avisos.push(`${famNome(o)} está com uma versão antiga do app: só as refeições da casa dessa pessoa entram na conta.`);
      dias.forEach(({d,dk})=>{
        NUTRI_REFEICOES.forEach(r=>{
          const f = ((pf.fatores||{})[d]||{})[r.id]; if(!f || !famDaCasaNoDia(P, r.id, d, dk)) return;
          const pr = famPrato(r, d, P, nutriConfig(), 0, dk);
          pr.itens.forEach(([id,q])=>soma(id, nutriItem(id, q, f).gramas, o));
        });
      });
    });
  }
  const per = dias.length ? { de: dias[0].dk, ate: dias[dias.length-1].dk, n: diasOk } : { de:'', ate:'', n:0 };
  return { tot, editados, diasOk, pessoas: pessoas.length, quem: pessoas, casa, avisos, periodo: per };
}
function _famPeriodoTxt(per){ const f = dk=>{ const [y,m,d] = String(dk).split('-'); return `${d}/${m}`; }; return per.n ? `${f(per.de)} a ${f(per.ate)} (${per.n} ${per.n===1?'dia':'dias'})` : 'nenhum dia'; }
window.nutriListaCompras = function(escopo, modo){
  if(!mtTem('alimentacao')) return mtPremiumAviso('alimentacao');
  const _mi = $('modal-inner'); if(_mi) _mi.dataset.tela = 'nutri-sub';
  escopo = escopo || window.__comprasEsc || 'semana'; window.__comprasEsc = escopo;
  modo = modo || window.__comprasModo || (famAtiva() ? 'casa' : 'eu'); if(!famAtiva()) modo = 'eu'; window.__comprasModo = modo;
  const R = nutriComprasTotais(escopo, modo); const tot = R.tot;
  const semKey = chaveDia(nutriDataDia(1)) + (R.casa ? '-casa' : ''); state.comprasOk = state.comprasOk || {}; const ok = state.comprasOk[semKey] = state.comprasOk[semKey] || {};
  const fmt = id=>_nutriFmtCompra(id, tot[id]);
  const porPessoa = id=>'';     // Beta 52: a lista mostra tudo junto; a parte de cada pessoa fica no PDF da casa
  const blocos = Object.values(NUTRI_CATEG).map(([titulo, ids])=>{
    const itens = ids.filter(id=>tot[id]).map(id=>`<div class="mrow ${ok[id]?'rm':''}" style="cursor:pointer" onclick="nutriCompraOk('${id}')"><span class="n">${ok[id]?'☑':'☐'} ${nutriNomeCompra(id)}${porPessoa(id)}</span><span class="q">${fmt(id)}</span></div>`).join('');
    return itens ? `<div class="section-lbl" style="margin:14px 0 2px">${titulo}</div>${itens}` : '';
  }).join('');
  window.__nutriTextoCompras = `🛒 Lista de compras (MetaTreino)${R.casa ? ` — casa, ${R.pessoas} pessoas` : ''}\nPeríodo: ${_famPeriodoTxt(R.periodo)}\n\n` + Object.values(NUTRI_CATEG).map(([titulo, ids])=>{
    const l = ids.filter(id=>tot[id] && !ok[id]).map(id=>`• ${nutriNomeCompra(id)}: ${fmt(id)}`); return l.length ? titulo+'\n'+l.join('\n') : '';
  }).filter(Boolean).join('\n\n');
  $('modal-inner').innerHTML = `<div id="fam-compras"><h3>🛒 Lista de compras${R.casa ? ' da casa' : ''}</h3>
    ${famAtiva() ? `<div class="mod-toggle" style="margin:8px 0 0">
      <button class="seg ${modo==='eu'?'on':''}" style="font-size:12px;padding:10px 4px" onclick="nutriListaCompras(null,'eu')">Só eu</button>
      <button class="seg ${modo==='casa'?'on':''}" style="font-size:12px;padding:10px 4px" onclick="nutriListaCompras(null,'casa')">Casa toda (${famMembros().length})</button></div>` : ''}
    <div class="mod-toggle" style="margin:8px 0 6px">
      <button class="seg ${escopo==='semana'?'on':''}" style="font-size:12px;padding:10px 4px" onclick="nutriListaCompras('semana')">Até domingo</button>
      <button class="seg ${escopo==='7dias'?'on':''}" style="font-size:12px;padding:10px 4px" onclick="nutriListaCompras('7dias')">Próximos 7 dias</button>
    </div>
    <p class="fam-p" style="margin:4px 0">Período: <b>${_famPeriodoTxt(R.periodo)}</b>${R.casa ? ` · <b>${R.pessoas} pessoas</b>: soma o que cada uma vai comer, na porção do próprio plano (todas as refeições, não só as da casa). A parte de cada pessoa está no <b>PDF da lista</b>.` : '.'}</p>
    ${R.avisos.map(a=>`<p class="fam-aviso">${mtEsc(a)}</p>`).join('')}
    <p style="color:var(--text-dim);font-size:12px;line-height:1.55;margin:4px 0 0">${R.editados?`Já com ${R.editados===1?'a sua 1 edição':'as suas '+R.editados+' edições'}. `:''}Dias que já passaram não entram. Toque num item para marcar “já tenho”. Grãos e carnes em peso cru; óleos e leite em ml/L; frutas e pães em unidades.</p>
    <div style="max-height:50vh;overflow-y:auto">${blocos || '<div class="text-dim" style="padding:14px 0;font-size:13px">Nada a comprar neste período.</div>'}</div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="nutriCopiarCompras()">📋 Copiar / compartilhar lista</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="${R.casa ? 'pdfAlimentacaoCasa()' : 'pdfAlimentacao()'}">📄 PDF ${R.casa ? 'da casa' : 'do meu plano'}</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openNutri()">‹ Voltar ao plano</button></div>`;
  $('modal-back').classList.add('on');
};
const _nutriCompraOkB49 = window.nutriCompraOk;
window.nutriCompraOk = function(id){
  if(window.__comprasModo === 'casa' && famAtiva()){
    const semKey = chaveDia(nutriDataDia(1)) + '-casa'; state.comprasOk = state.comprasOk || {}; const ok = state.comprasOk[semKey] = state.comprasOk[semKey] || {};
    if(ok[id]) delete ok[id]; else ok[id] = true;
    Object.keys(state.comprasOk).sort().slice(0,-8).forEach(k=>delete state.comprasOk[k]);
    saveData(); return nutriListaCompras();
  }
  return _nutriCompraOkB49.apply(this, arguments);
};
// tabela de compras no PDF: Alimento | Quantidade | Unidade (| por pessoa), por categoria, com o período
function nutriPdfCompras(S, arte, modo){
  try{
    const R = nutriComprasTotais('7dias', modo === 'casa' ? 'casa' : 'eu'); const tot = R.tot;
    if(!Object.keys(tot).length) return;
    S.precisa(60);
    S.secao(`Lista de compras${R.casa ? ` da casa · ${R.pessoas} pessoas` : ''}`, `período: ${_famPeriodoTxt(R.periodo)}`, arte.C.a);
    const porPessoa = R.casa && R.pessoas > 1 && R.pessoas <= 4;
    const cols = [{t:'Alimento', w:62, negrito:true, quebra:true}, {t:'Quantidade', w:22, dir:1}, {t:'Unidade', w:18}];
    if(porPessoa) cols.push({t:'Por pessoa', w:74, quebra:true, cor:arte.C.dim});
    Object.values(NUTRI_CATEG).forEach(([titulo, ids])=>{
      const l = ids.filter(id=>tot[id]).map(id=>{ const q = nutriQtdCompra(id, tot[id].g);
        const linha = [nutriNomeCompra(id) + (q.obs ? ` (${q.obs})` : ''), q.n, q.un];
        if(porPessoa) linha.push(R.quem.filter(u=>tot[id].por[u]).map(u=>`${u===_famUid()?'Você':famNome(u)}: ${_nutriFmtCompra(id, { g:tot[id].por[u] })}`).join(' · '));
        return linha; });
      if(!l.length) return;
      S.nota(titulo.replace(/^[^\wÀ-ú]+/,''), { e:'bold', cor:arte.C.ink, t:8.6 });
      S.tabela(cols, l, { cabCor:arte.C.aClaro, cabTxt:arte.C.a, t:7.8 });
    });
    R.avisos.forEach(a=>S.nota(a, { t:7.4 }));
    S.nota(R.casa ? 'Cada pessoa entra com a porção calculada pelo próprio plano (as calorias não são somadas como se fossem uma meta só). Grãos e carnes em peso cru; quantidades arredondadas para facilitar a compra.'
      : 'Já com as suas edições. Grãos e carnes em peso cru; quantidades arredondadas para facilitar a compra.');
  }catch(e){ console.log('pdf compras:', e); }
}
// PDF da casa: cardápio compartilhado da semana (o prato, sem quantidades — elas são de cada um) + compras somadas
function pdfMontarCasa(jsPDF, arte){
  if(!famAtiva()) throw new Error('Você não está num grupo da casa');
  const P = famParams(); const n = nutriConfig();
  const nomes = famMembros().map(u=>u===_famUid()?'você':famNome(u)).join(', ');
  const S = pdfDoc(jsPDF, arte, { titulo:'Cardápio da casa', sub:`${famMembros().length} pessoas: ${nomes}`, sub2:`Refeições da casa: ${famRefs().map(k=>FAM_NOMES_REF_MIN[k]).join(', ')} · administrador: ${famSouAdm()?'você':famNome(famAdmUid())}` });
  S.nota('A comida é compartilhada, a alimentação é individual: o prato abaixo é o mesmo para todos, e cada pessoa vê no app a própria quantidade e calorias, calculadas pelo plano dela.', { caixa:true, cor:arte.C.ink });
  const DN = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const linhas = [];
  _nutriDiasJanela('7dias').forEach(({d,dk})=>{
    NUTRI_REFEICOES.forEach((r,idx)=>{
      if(!famDaCasaNoDia(P, r.id, d, dk)) return;
      const pr = famPrato(r, d, P, n, idx, dk);
      const hora = (P.horas||{})[r.id] || r.hora;
      linhas.push([`${DN[d-1]} ${dk.slice(8,10)}/${dk.slice(5,7)}`, `${r.nome}\n${hora}`, pr.op.n, pr.itens.map(([id])=>{ const u = nutriUso(id, true); return NUTRI_ALIMENTOS[id][0] + (u ? ` (${u})` : ''); }).join(' · ')]);
    });
  });
  if(linhas.length){
    S.secao('Cardápio da casa — próximos 7 dias', 'quantidades individuais no app de cada pessoa');
    S.tabela([{t:'Dia', w:24, negrito:true, quebra:true}, {t:'Refeição', w:24, quebra:true}, {t:'Prato', w:44, quebra:true, negrito:true}, {t:'Ingredientes e uso', w:84, quebra:true}], linhas, { t:7.6 });
  }
  // Beta 58: as compras somadas da casa estão no PDF da lista de compras (parte 62)
  S.nota('Valores aproximados (tabelas brasileiras de composição de alimentos). É uma orientação geral e não substitui um nutricionista; se alguém da casa tem doença, alergia ou usa medicação, procure um profissional.');
  return S.fim(`metatreino-casa-${chaveDia(new Date())}.pdf`, _pdfAluno());
}
function pdfAlimentacaoCasa(){ if(!famAtiva()) return toast('Entre num grupo da casa para gerar o PDF da casa.'); return _pdfGerar('pdfAlimentacao', 'alimentacao', pdfMontarCasa, 'Alimentação da casa'); }

// ---------- assistente: perguntas de corrida só para quem tem plano de corrida ----------
const _MA_RUN_GUARDADAS = [];
function maAjustaSugestoesCorrida(){
  try{
    const temRun = !!(state.modules && state.modules.run && state.modules.run.plan);
    const ehRun = s=>/^run_/.test(s.key);
    if(!temRun){
      for(let i=MA_SUGGESTIONS.length-1; i>=0; i--) if(ehRun(MA_SUGGESTIONS[i])){ _MA_RUN_GUARDADAS.unshift(MA_SUGGESTIONS[i]); MA_SUGGESTIONS.splice(i,1); }
      const temHistRun = !!(((state.modules.run||{}).history)||[]).length;
      for(let i=MA_SUGGESTIONS.length-1; i>=0; i--) if(MA_SUGGESTIONS[i].key === 'corrida_analise' && !temHistRun){ _MA_RUN_GUARDADAS.unshift(MA_SUGGESTIONS[i]); MA_SUGGESTIONS.splice(i,1); }
    } else if(_MA_RUN_GUARDADAS.length){
      _MA_RUN_GUARDADAS.splice(0).forEach(s=>{ if(!MA_SUGGESTIONS.some(x=>x.key===s.key)) MA_SUGGESTIONS.push(s); });
    }
  }catch(e){}
}
const _openAssistantB46 = window.openAssistant;
window.openAssistant = function(){ maAjustaSugestoesCorrida(); return _openAssistantB46.apply(this, arguments); };
// "por que o treino de hoje?" de quem só faz musculação: explica o treino de musculação, não a corrida
const _maRunHojeB46 = MA_ANSWERS.run_hoje;
MA_ANSWERS.run_hoje = function(){
  const temRun = !!(state.modules.run && state.modules.run.plan);
  const lift = state.modules.lift && state.modules.lift.plan;
  if(temRun || !lift) return _maRunHojeB46.apply(this, arguments);
  const w = (lift.workouts||[]).find(x=>x.dayIdx===getDayIdx());
  if(!w) return 'Hoje não tem musculação no seu plano: é dia de descanso, e é nele que o músculo se recupera e cresce. Se quiser, adiante um treino em <b>Treinos</b>.';
  const grupos = [...new Set((w.exercises||[]).map(e=>e.part).filter(Boolean))].slice(0,4).join(', ');
  return `Hoje é o <b>${mtEsc(w.name || 'treino do dia')}</b>${grupos ? ` (${mtEsc(grupos)})` : ''}. Ele segue a divisão do seu plano, para cada grupo descansar uns dias antes de treinar de novo. Registre as séries: é com elas que eu ajusto as cargas das próximas semanas.`;
};
const _maRunAvancarB46 = MA_ANSWERS.run_avancar;
MA_ANSWERS.run_avancar = function(){
  const temRun = !!(state.modules.run && state.modules.run.plan);
  if(temRun || !(state.modules.lift && state.modules.lift.plan)) return _maRunAvancarB46.apply(this, arguments);
  return 'Na musculação você avança quando completa todas as repetições do alvo com boa técnica: aí eu sugiro subir a carga no próximo treino daquele exercício. Toque em <b>📉 Minhas cargas estagnaram?</b> para ver como estão as suas.';
};

// ---------- primeiro acesso: um aviso de cada vez ----------
function _temAviso(){ const w = document.getElementById('toast-wrap'); return !!(w && w.children.length); }
const _updateFabNudgeB46 = window.updateFabNudge;
window.updateFabNudge = function(){
  if(_temAviso()){
    clearTimeout(window.__fabEsperaT);
    const ini = window.__fabEsperaIni || (window.__fabEsperaIni = Date.now());
    if(Date.now() - ini < 20000){ window.__fabEsperaT = setTimeout(()=>window.updateFabNudge(), 1200); return; }
  }
  window.__fabEsperaIni = 0;
  return _updateFabNudgeB46.apply(this, arguments);
};
const _toastB46 = window.toast;
window.toast = function(){
  try{
    const b = document.getElementById('fab-bubble');
    if(b && b.classList.contains('on')){
      const chave = String(b.textContent||'').slice(0,120);
      _fabEsconde(true);
      try{ const o = JSON.parse(localStorage.getItem(FAB_VISTOS_KEY)||'{}'); delete o[chave]; localStorage.setItem(FAB_VISTOS_KEY, JSON.stringify(o)); }catch(e){}
      clearTimeout(window.__fabEsperaT); window.__fabEsperaIni = Date.now(); window.__fabEsperaT = setTimeout(()=>window.updateFabNudge(), 1500);
    }
  }catch(e){}
  return _toastB46.apply(this, arguments);
};

(function(){ if(document.getElementById('fam-css')) return; const s = document.createElement('style'); s.id = 'fam-css';
  s.textContent = `
.fam-p{font-size:13px;line-height:1.55;color:var(--text-dim);margin:6px 0 8px}
.fam-ul{font-size:12.5px;line-height:1.6;color:var(--text-dim);padding-left:18px;margin:0 0 12px}
.fam-mini{font-size:11.5px;line-height:1.5;color:var(--text-mute);margin:6px 0}
.fam-msg{font-size:12.5px;line-height:1.5;color:var(--text-strong);margin:8px 0 0;min-height:1em}
.fam-aviso{font-size:11.5px;line-height:1.5;color:var(--text-dim);margin:4px 0;padding:6px 10px;border-radius:10px;background:rgba(var(--primary-rgb),.08)}
.fam-entrar{margin:14px 0 6px}.fam-entrar label{font-size:12.5px;font-weight:700;display:block;margin-bottom:6px}
.fam-linha{display:flex;gap:8px}.fam-linha .input{flex:1;text-transform:uppercase;letter-spacing:3px;font-weight:800;text-align:center;min-width:0}
.fam-codigo-box{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:14px;background:rgba(var(--primary-rgb),.10);margin:6px 0 10px}
.fam-codigo-box small{font-size:11px;color:var(--text-dim)}.fam-codigo-box b{font-size:22px;letter-spacing:4px;font-family:ui-monospace,monospace;flex:1}
.fam-sec{font-size:11.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--text-dim);margin:12px 0 6px}
.fam-membros{display:flex;flex-direction:column;gap:6px}
.fam-membro{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.fam-pessoa{padding:6px 10px;border-radius:999px;background:rgba(127,127,127,.14);font-size:12.5px}.fam-pessoa small{color:var(--primary-2);font-weight:700;margin-left:4px}
.fam-acoes{display:flex;gap:10px}
.fam-link{background:none;border:none;padding:4px 2px;color:var(--primary-2);font-size:12px;font-weight:700;cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.fam-chips{display:flex;flex-wrap:wrap;gap:6px}
.fam-chips button[disabled],.fam-dia[disabled],.seg[disabled]{opacity:.65;cursor:default}
.fam-refs{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.fam-ref{padding:10px 12px;border-radius:12px;background:rgba(127,127,127,.08)}
.fam-ref-t{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-size:13px}
.fam-hora{width:auto;max-width:120px;padding:6px 10px;font-size:13px}
.fam-dias{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.fam-dia{height:34px;border-radius:9px;border:1px solid var(--border);background:transparent;color:var(--text-dim);font-weight:800;font-size:12px}
.fam-dia.on{background:rgba(var(--primary-rgb),.18);border-color:rgba(var(--primary-rgb),.55);color:var(--text-strong)}
.fam-selo{display:inline-block;font-size:10px;font-weight:800;padding:1px 7px;border-radius:99px;background:rgba(var(--primary-rgb),.16);color:var(--primary-2);vertical-align:middle;margin-left:4px}
.fam-info{font-size:12px;line-height:1.5;color:var(--text-dim);padding:8px 10px;border-radius:10px;background:rgba(var(--primary-rgb),.07);margin:2px 0 8px}
.fam-tirados{margin-top:4px}
.fam-por{display:block;font-size:11px;color:var(--text-mute);margin-top:2px}
.mrow .n .n-uso{display:block;font-size:11px;line-height:1.35;color:var(--text-mute);margin-top:2px;font-weight:400}
.mealc .mb .mrow{align-items:flex-start}
.mealc .mb .mrow .q{white-space:normal;max-width:36%;text-align:right;line-height:1.35}
.mealc .mb .mrow .ba{align-self:center}
`; document.head.appendChild(s); })();

Object.assign(window, { openFamilia, famCriar, famEntrar, famSair, famAlternaRefeicao, famAlternaEconomico, famAlternaTrocaPropria, famAlternaDia, famHora, famCompartilharCodigo, famOuvir, famEnviar,
  famParams, nutriComprasTotais, nutriPdfCompras, famAtiva, famSouAdm, famPassarAdm, famRemoverMembro, famEscolha, famEscolhaOk, famTirarDaCasa, famVoltarNaCasa, famVoltarCasa,
  pdfAlimentacaoCasa, pdfMontarCasa, nutriQtdCompra, nutriComprasMinhas, famCompartilhada });

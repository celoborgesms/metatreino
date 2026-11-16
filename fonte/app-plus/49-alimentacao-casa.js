
// =====================================================================
// 49. Beta 46 — Alimentação da casa (2 a 6 pessoas), assistente sem corrida para quem só faz musculação
//     e avisos do primeiro acesso sem um em cima do outro
// =====================================================================
// ALIMENTAÇÃO DA CASA
//  • Um cria o grupo e recebe um código de 6 letras; quem mora junto digita o código (até 6 pessoas).
//  • As refeições escolhidas (padrão: almoço e jantar) têm o MESMO prato para todos; a PORÇÃO continua sendo
//    a de cada um (calculada pelo peso, objetivo e calorias de cada pessoa).
//  • Restrições: o prato da casa respeita as restrições de todos (se alguém é vegetariano ou sem lactose, a
//    refeição da casa também é). As outras refeições continuam individuais.
//  • Registro nas refeições da casa: "comi", "não vou comer", alimento acrescentado e troca de prato aparecem
//    igual em todos os celulares. Mudar a QUANTIDADE de um alimento é pessoal (é a porção de cada um).
//  • Lista de compras e PDF: somam as porções de todos nas refeições da casa.
//  • Sair do grupo mantém o cardápio atual (o prato da casa continua o mesmo, agora só seu).
//  • Na nuvem: coleção familias/{código}. Só os membros leem. Guarda apelido, restrições, a proporção da
//    porção de cada um nas refeições da casa e o registro dessas refeições — nada de peso, idade ou e-mail.

const FAM_MAX = 6, FAM_REF_PADRAO = ['almoco','jantar'], FAM_DIAS_REGISTRO = 14;
const FAM_LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let _famUnsub = null, _famAplicando = false, _famPushT = 0;

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
function _famMeuPerfilRestr(){ const n = nutriConfig(); return { veg:!!n.vegetariano, lac:!!n.semLactose, glu:!!n.semGluten }; }

// parâmetros do prato compartilhado (família ativa) ou do cardápio guardado ao sair do grupo
function famParams(){
  try{
    const n = nutriConfig();
    if(famAtiva()){
      const c = famCache(), cf = c.config || {}, eu = _famMeuPerfilRestr();
      const ps = Object.values(c.perfis || {});
      const algum = k=>eu[k] || ps.some(p=>p && p[k]);
      return { refeicoes: famRefs(), seed: +cf.seed || 0, trocas: cf.trocas || {}, veg: algum('veg'), lac: algum('lac'), glu: algum('glu'), economico: cf.economico !== false, casa:true };
    }
    if(n.cardapioFixo && Array.isArray(n.cardapioFixo.refeicoes)) return Object.assign({ trocas:{} }, n.cardapioFixo, { casa:false });
  }catch(e){}
  return null;
}
function famCompartilhada(mid){ const P = famParams(); return !!(P && P.casa && P.refeicoes.includes(mid)); }

// ---------- cardápio: o prato das refeições da casa sai dos parâmetros comuns ----------
// (cópia fiel da montagem original; só muda, nas refeições da casa, de onde vêm restrições, semente e trocas)
const _nutriMontarPlanoB46 = window.nutriMontarPlano;
function famPrato(r, diaIdx, P, n, idxSlot){
  const comp = !!(P && P.refeicoes.includes(r.id));
  const veg = comp ? P.veg : n.vegetariano, lac = comp ? P.lac : n.semLactose, glu = comp ? P.glu : n.semGluten, eco = comp ? P.economico : n.economico;
  let lista = (veg && r.veg) ? r.veg : r.opcoes;
  const proib = new Set([...(lac?NUTRI_LACTOSE:[]), ...(glu?NUTRI_GLUTEN:[])]);
  if(proib.size){ const livre = lista.filter(op=>!op.i.some(([id])=>proib.has(id))); if(livre.length) lista = livre; }
  if(eco){ const barato = lista.filter(op=>!op.i.some(([id])=>NUTRI_CARO.includes(id))); if(barato.length>=2) lista = barato; }
  const chave = r.id + (veg?'v':'');
  const idxUse = comp ? NUTRI_REFEICOES.findIndex(x=>x.id===r.id) : idxSlot;
  const seed = comp ? P.seed : n.seed, tr = comp ? ((P.trocas||{})[chave]||0) : (n.trocas[chave]||0);
  const v = (diaIdx*3 + idxUse*2 + seed + tr) % lista.length;
  const op = lista[v];
  const k0 = op.i.reduce((s,[id,q])=>{ const a=NUTRI_ALIMENTOS[id]; return s + a[1]*(a[5]? q*a[5] : q)/100; },0);
  return { comp, op, v, total:lista.length, chave, eco, k0 };
}
window.nutriMontarPlano = function(diaIdx){
  const P = famParams();
  if(!P) return _nutriMontarPlanoB46.apply(this, arguments);
  const calc0 = nutriCalcular(); if(calc0.erro) return calc0;
  const n = nutriConfig();
  const hojeIdx = (typeof getDayIdx==='function') ? getDayIdx() : 1;
  diaIdx = diaIdx || hojeIdx;
  const diasT = nutriDiasTreino();
  const treino = diasT.has(diaIdx);
  const nT = diasT.size, y = nT>=1 && nT<=6 ? Math.min(0.05, 0.08*(7-nT)/nT) : 0;
  const fDia = nT>=1 && nT<=6 ? (treino ? 1+y : 1 - y*nT/(7-nT)) : 1;
  const kcalDia = Math.round(calc0.kcal*fDia/10)*10;
  const carbDia = Math.max(80, Math.round((kcalDia - calc0.prot*4 - calc0.gord*9)/4/5)*5);
  const calc = {...calc0, kcal:kcalDia, carb:carbDia};
  const shares = NUTRI_SHARE[n.refeicoes] || NUTRI_SHARE[5];
  const slots = NUTRI_REFEICOES.filter(r => shares[r.id]);
  const montar = (gf)=> slots.map((r,idx)=>{
    const pr = famPrato(r, diaIdx, P, n, idx);
    const alvo = calc.kcal * shares[r.id];
    const f = Math.min(2.4, Math.max(.55, alvo*gf/pr.k0));
    const itens = pr.op.i.map(([id,q])=>nutriItem((pr.eco && id==='azeite') ? 'oleo' : id, q, f));
    const tot = itens.reduce((t,i)=>({kcal:t.kcal+i.kcal,p:t.p+i.p,c:t.c+i.c,g:t.g+i.g}),{kcal:0,p:0,c:0,g:0});
    const preTreino = treino && r.id==='lanche2';
    return { id:r.id, chave:pr.chave, nome: preTreino ? 'Pré-treino' : r.nome, icone: preTreino ? '⚡' : r.icone, hora:r.hora, prato:pr.op.n, itens, tot, variante:pr.v+1, total:pr.total, preTreino, compartilhada: pr.comp && P.casa, fator:f };
  });
  let refeicoes = montar(1);
  const somaK = rs => rs.reduce((s,m)=>s+m.tot.kcal,0);
  if(Math.abs(somaK(refeicoes)-calc.kcal)/calc.kcal > 0.03) refeicoes = montar(Math.min(1.35, Math.max(.75, calc.kcal/somaK(refeicoes))));
  const dia = refeicoes.reduce((t,m)=>({kcal:t.kcal+m.tot.kcal,p:t.p+m.tot.p,c:t.c+m.tot.c,g:t.g+m.tot.g}),{kcal:0,p:0,c:0,g:0});
  const dicas = [];
  const faltaP = calc.prot - dia.p;
  if(faltaP > calc.prot*0.12) dicas.push(`Para fechar sua proteína, faltam ~${Math.round(faltaP/5)*5} g: some 1 scoop de whey (≈ 24 g) ou ${Math.ceil(faltaP/6.5)} ovos ao longo do dia.`);
  if(treino) dicas.push('Hoje é dia de treino: faça o lanche pré-treino 1 a 2 h antes e capriche na proteína depois.');
  else dicas.push('Dia de descanso: calorias um pouco menores, mas mantenha a proteína. É nela que o músculo se recupera.');
  if(calc.objetivo==='emagrecer') dicas.push('Priorize proteína em toda refeição e legumes à vontade: ajudam a manter a saciedade e a massa muscular.');
  if(calc.objetivo==='massa') dicas.push('Não pule refeições: para ganhar massa, o difícil costuma ser comer o suficiente todo dia.');
  if(P.casa && refeicoes.some(m=>m.compartilhada)) dicas.push('Nas refeições da casa o prato é o mesmo para todos; a porção de cada um continua a sua.');
  dicas.push('Beba água ao longo do dia, não só nas refeições. Em dia de treino, some uns 500 ml.');
  return { calc, refeicoes, dia, dicas, treino, diaIdx };
};

// trocar o prato de uma refeição da casa troca para todos
const _nutriTrocarB46 = window.nutriTrocar;
window.nutriTrocar = function(chave){
  const mid = String(chave).replace(/v$/,'');
  const P = famParams();
  if(!P || !P.refeicoes.includes(mid)) return _nutriTrocarB46.apply(this, arguments);
  try{ const dia = (state.nutriLog||{})[nutriKeyDia(nutriDiaSel())]; if(dia) delete dia[mid]; }catch(e){}
  window.__nutriAbertos = window.__nutriAbertos || {}; window.__nutriAbertos[chave] = true;
  if(P.casa){
    const c = famCache(); c.config = c.config || {}; c.config.trocas = c.config.trocas || {};
    c.config.trocas[chave] = (c.config.trocas[chave]||0) + 1; _famGuardaCache(c);
    _famAtualiza({ ['config.trocas.' + chave]: c.config.trocas[chave] });
  } else {
    const n = nutriConfig(); n.cardapioFixo.trocas = n.cardapioFixo.trocas || {}; n.cardapioFixo.trocas[chave] = (n.cardapioFixo.trocas[chave]||0) + 1;
  }
  saveData(); openNutri();
};

// ---------- registro das refeições da casa ----------
function _famDerivado(dk, mid){
  const m = ((state.nutriLog||{})[dk]||{})[mid];
  if(!m) return null;
  if(m === true) return { ok:true, x:[], add:[] };
  const x = Object.keys(m.adj||{}).filter(id=>m.adj[id] && m.adj[id].x).sort();
  const add = (m.add||[]).slice();
  if(!m.ok && !x.length && !add.length) return null;
  return { ok:!!m.ok, x, add };
}
const _famIgual = (a, b)=>JSON.stringify(a ? { ok:!!a.ok, x:(a.x||[]).slice().sort(), add:a.add||[] } : null) === JSON.stringify(b ? { ok:!!b.ok, x:(b.x||[]).slice().sort(), add:b.add||[] } : null);
function _famDiasJanela(){
  const out = new Set(); const d0 = new Date(); d0.setHours(12,0,0,0);
  for(let k=-2; k<=8; k++) out.add(chaveDia(new Date(d0.getTime() + k*86400000)));
  return [...out];
}
async function _famAtualiza(campos){
  const id = famId(); if(!id || !campos || !Object.keys(campos).length) return false;
  try{ await db.collection('familias').doc(id).update(campos); return true; }
  catch(e){ console.log('casa (gravar):', e && (e.code || e.message)); return false; }
}
// publica o que mudou neste aparelho (só nas refeições da casa)
function famEnviar(){
  try{
    if(!famAtiva() || _famAplicando) return;
    const c = famCache(), uid = _famUid(), reg = c.registro || {}; const campos = {};
    _famDiasJanela().forEach(dk=>{
      famRefs().forEach(mid=>{
        const loc = _famDerivado(dk, mid), rem = (reg[dk]||{})[mid] || null;
        if(_famIgual(loc, rem)) return;
        if(!loc && !rem) return;
        campos['registro.' + dk + '.' + mid] = loc ? Object.assign({}, loc, { em: Date.now(), por: uid }) : firebase.firestore.FieldValue.delete();
        reg[dk] = reg[dk] || {}; if(loc) reg[dk][mid] = Object.assign({}, loc, { em: Date.now(), por: uid }); else delete reg[dk][mid];
      });
    });
    // poda: registros com mais de 14 dias
    const lim = chaveDia(new Date(Date.now() - FAM_DIAS_REGISTRO*86400000));
    Object.keys(reg).forEach(dk=>{ if(dk < lim){ campos['registro.' + dk] = firebase.firestore.FieldValue.delete(); delete reg[dk]; } });
    // meu perfil na casa: apelido, restrições e a proporção da minha porção (para a lista de compras dos outros)
    const meu = _famMeuPerfil();
    if(JSON.stringify((c.perfis||{})[uid] || null) !== JSON.stringify(meu)){ campos['perfis.' + uid] = meu; c.perfis = c.perfis || {}; c.perfis[uid] = meu; }
    c.registro = reg; _famGuardaCache(c);
    if(Object.keys(campos).length) _famAtualiza(campos);
  }catch(e){ console.log('casa (enviar):', e); }
}
function _famMeuPerfil(){
  const r = _famMeuPerfilRestr(); const fatores = {};
  try{
    for(let d=1; d<=7; d++){ const pl = nutriMontarPlano(d); if(pl.erro) continue;
      pl.refeicoes.forEach(m=>{ if(m.compartilhada){ fatores[d] = fatores[d] || {}; fatores[d][m.id] = Math.round(m.fator*1000)/1000; } }); }
  }catch(e){}
  return { veg:r.veg, lac:r.lac, glu:r.glu, fatores };
}
mtGancho('saveData', { depois(){ if(_famAplicando || !famAtiva()) return; clearTimeout(_famPushT); _famPushT = setTimeout(famEnviar, 900); } });

// recebe o que mudou nos outros aparelhos
function _famAplica(doc){
  const uid = _famUid(); const ant = famCache() || {};
  if(!doc || !Array.isArray(doc.membros) || !doc.membros.includes(uid)){ famSaiuLocal('removido'); return; }
  _famAplicando = true; let mudou = false;
  try{
    const reg = doc.registro || {}, regAnt = ant.registro || {};
    const refs = (doc.config && doc.config.refeicoes) || FAM_REF_PADRAO;
    _famDiasJanela().forEach(dk=>{
      refs.forEach(mid=>{
        const rem = (reg[dk]||{})[mid] || null, loc = _famDerivado(dk, mid), antes = (regAnt[dk]||{})[mid] || null;
        if(_famIgual(loc, rem)) return;
        if(!rem && !antes) return;                     // nunca existiu lá: é mudança minha ainda não enviada
        if(rem && rem.por === uid && antes && _famIgual(antes, rem)) return;
        const m = nutriMealLog(mid, true, dk);
        if(!rem){ Object.keys(m.adj).forEach(id=>{ if(m.adj[id] && m.adj[id].x) delete m.adj[id]; }); m.add = []; m.ok = false; }
        else {
          Object.keys(m.adj).forEach(id=>{ if(m.adj[id] && m.adj[id].x && !rem.x.includes(id)) delete m.adj[id]; });
          (rem.x||[]).forEach(id=>{ m.adj[id] = { x:1 }; });
          m.add = (rem.add||[]).slice(); m.ok = !!rem.ok;
        }
        const dia = state.nutriLog[dk]; if(dia && !m.ok && !Object.keys(m.adj).length && !m.add.length) delete dia[mid];
        if(dia && !Object.keys(dia).length) delete state.nutriLog[dk];
        mudou = true;
      });
    });
    const trocasMudaram = JSON.stringify((doc.config||{}).trocas||{}) !== JSON.stringify((ant.config||{}).trocas||{}) || JSON.stringify(refs) !== JSON.stringify(famRefs()) || JSON.stringify(doc.perfis||{}) !== JSON.stringify(ant.perfis||{});
    _famGuardaCache(doc);
    if(mudou){ try{ saveData(); }catch(e){} }
    if(mudou || trocasMudaram) _famRedesenha();
  }finally{ _famAplicando = false; }
}
function _famRedesenha(){
  try{
    const mi = $('modal-inner'), back = $('modal-back');
    if(back && back.classList.contains('on') && mi && mi.querySelector('[onclick="nutriListaCompras()"]')) openNutri();
    else if(back && back.classList.contains('on') && mi && mi.querySelector('#fam-tela')) openFamilia();
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
mtGancho('bootAfterAuth', { depois(){ setTimeout(()=>{ if(famId()) famOuvir(); }, 1500); } });

// ---------- criar, entrar, sair ----------
function _famCodigo(){ let s = ''; const r = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint32Array(6)) : Array.from({length:6}, ()=>Math.floor(Math.random()*1e9)); for(let i=0;i<6;i++) s += FAM_LETRAS[r[i] % FAM_LETRAS.length]; return s; }
function _famMeuApelido(){ const p = (state.user && state.user.profile) || {}; return String(p.nickname || (fbUser && fbUser.displayName) || 'Eu').split(' ')[0].slice(0, 24); }
async function famCriar(){
  if(!mtTem('alimentacao')) return mtPremiumAviso('alimentacao');
  const uid = _famUid(); if(!uid) return toast('Entre na sua conta para criar o grupo da casa.');
  const n = nutriConfig();
  for(let t=0; t<5; t++){
    const id = _famCodigo();
    try{
      const s = await db.collection('familias').doc(id).get();
      if(s.exists) continue;
    }catch(e){ if(e && e.code === 'permission-denied') continue; return toast('Sem conexão agora. Tente de novo em instantes.'); }
    const doc = { membros:[uid], dono:uid, nomes:{ [uid]: _famMeuApelido() }, perfis:{}, config:{ refeicoes: FAM_REF_PADRAO.slice(), economico: n.economico !== false, seed: +n.seed || 0, trocas:{} }, registro:{}, criadoEm: Date.now() };
    try{
      await db.collection('familias').doc(id).set(doc);
      n.familia = { id, desde: Date.now() }; delete n.cardapioFixo;
      _famGuardaCache(doc); saveData(); famOuvir(); setTimeout(famEnviar, 300);
      toast('🏠 Grupo da casa criado. Mande o código para quem mora com você.');
      return openFamilia();
    }catch(e){ console.log('casa (criar):', e); return toast('Não consegui criar o grupo agora. Confira a internet e tente de novo.'); }
  }
  toast('Não consegui gerar um código livre. Tente de novo.');
}
async function famEntrar(){
  if(!mtTem('alimentacao')) return mtPremiumAviso('alimentacao');
  const uid = _famUid(); if(!uid) return toast('Entre na sua conta para participar.');
  const inp = $('fam-codigo'); const id = String((inp && inp.value) || '').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const msg = t=>{ const e = $('fam-msg'); if(e) e.textContent = t; };
  if(id.length !== 6) return msg('O código tem 6 letras e números.');
  msg('Entrando…');
  try{
    await db.collection('familias').doc(id).update({ membros: firebase.firestore.FieldValue.arrayUnion(uid), ['nomes.' + uid]: _famMeuApelido() });
    const s = await db.collection('familias').doc(id).get();
    const d = s.data();
    if(!d || !(d.membros||[]).includes(uid)) return msg('Não consegui entrar. Confira o código.');
    if((d.membros||[]).length > FAM_MAX){ await db.collection('familias').doc(id).update({ membros: firebase.firestore.FieldValue.arrayRemove(uid) }); return msg(`O grupo já tem ${FAM_MAX} pessoas.`); }
    const n = nutriConfig(); n.familia = { id, desde: Date.now() }; delete n.cardapioFixo;
    _famGuardaCache(d); saveData(); famOuvir(); setTimeout(famEnviar, 300);
    toast('🏠 Pronto! As refeições da casa agora são iguais para todos.');
    openFamilia();
  }catch(e){
    console.log('casa (entrar):', e && (e.code || e.message));
    msg(e && e.code === 'not-found' ? 'Código não encontrado. Confira com quem criou o grupo.' : e && e.code === 'permission-denied' ? `Não foi possível entrar: o grupo pode estar cheio (máximo ${FAM_MAX}).` : 'Sem conexão agora. Tente de novo em instantes.');
  }
}
// sai mantendo o cardápio: o prato da casa vira o "cardápio guardado" desta pessoa
function _famCongela(){
  const P = famParams(); const n = nutriConfig();
  if(P && P.casa) n.cardapioFixo = { refeicoes:P.refeicoes.slice(), seed:P.seed, trocas:Object.assign({}, P.trocas), veg:P.veg, lac:P.lac, glu:P.glu, economico:P.economico };
}
function famSaiuLocal(motivo){
  if(!famId()) return;
  try{ if(_famUnsub){ _famUnsub(); _famUnsub = null; } }catch(e){}
  _famCongela();
  try{ localStorage.removeItem(_famCacheKey()); }catch(e){}
  const n = nutriConfig(); delete n.familia; window.__famCache = null;
  saveData();
  if(motivo === 'removido' || motivo === 'apagado') toast('🏠 Você não faz mais parte do grupo da casa. Seu cardápio atual foi mantido.');
  _famRedesenha();
}
function famSair(){
  appConfirm('Você sai do grupo da casa. O cardápio que está agora continua igual no seu app; as próximas mudanças deixam de aparecer para os outros.', async ()=>{
    const id = famId(), uid = _famUid(), c = famCache() || {};
    const outros = (c.membros||[]).filter(x=>x!==uid);
    try{
      if(!outros.length) await db.collection('familias').doc(id).delete();
      else {
        const campos = { membros: firebase.firestore.FieldValue.arrayRemove(uid), ['nomes.' + uid]: firebase.firestore.FieldValue.delete(), ['perfis.' + uid]: firebase.firestore.FieldValue.delete() };
        if(c.dono === uid) campos.dono = outros[0];
        await db.collection('familias').doc(id).update(campos);
      }
      famSaiuLocal('saiu'); toast('Você saiu do grupo da casa. Seu cardápio foi mantido.'); openNutri();
    }catch(e){ console.log('casa (sair):', e); toast('Não consegui sair agora (sem conexão?). Tente de novo.'); }
  }, { title:'Sair do grupo da casa?', emo:'🏠', okLabel:'Sair e manter meu cardápio' });
}
function famAlternaRefeicao(mid){
  const c = famCache(); if(!c) return;
  const refs = famRefs().slice(); const i = refs.indexOf(mid);
  if(i >= 0){ if(refs.length === 1) return toast('Deixe pelo menos uma refeição da casa (ou saia do grupo).'); refs.splice(i,1); } else refs.push(mid);
  c.config = c.config || {}; c.config.refeicoes = refs; _famGuardaCache(c);
  _famAtualiza({ 'config.refeicoes': refs }); saveData(); openFamilia();
}
function famAlternaEconomico(){
  const c = famCache(); if(!c) return; c.config = c.config || {}; c.config.economico = !(c.config.economico !== false); _famGuardaCache(c);
  _famAtualiza({ 'config.economico': c.config.economico }); saveData(); openFamilia();
}
function famCompartilharCodigo(){
  const id = famId(); if(!id) return;
  const t = `Vamos usar o mesmo cardápio no MetaTreino? Em Alimentação › Alimentação da casa, toque em "Entrar com código" e digite: ${id}`;
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
      <p class="fam-p">Para quem mora junto e come a mesma comida. Vocês escolhem as refeições da casa (por exemplo almoço e jantar): o <b>prato</b> é o mesmo para todos e a <b>porção</b> continua a de cada um.</p>
      <ul class="fam-ul"><li>A lista de compras e o PDF somam as porções de todos.</li><li>"Comi", "não vou comer", alimento acrescentado e troca de prato aparecem igual em todos os celulares.</li><li>Até ${FAM_MAX} pessoas. Cada um precisa do plano alimentar (Premium).</li></ul>
      ${n.cardapioFixo ? '<p class="fam-mini">Você saiu de um grupo e manteve o cardápio daquela época nas refeições da casa.</p>' : ''}
      <button class="btn btn-primary btn-block" onclick="famCriar()">Criar o grupo da casa</button>
      <div class="fam-entrar"><label for="fam-codigo">Já tem um código?</label>
        <div class="fam-linha"><input id="fam-codigo" class="input" maxlength="6" autocomplete="off" autocapitalize="characters" placeholder="Ex.: K7M2QX" oninput="this.value=this.value.toUpperCase()">
        <button class="btn btn-ghost" onclick="famEntrar()">Entrar</button></div><div id="fam-msg" class="fam-mini" aria-live="polite"></div></div>
      <p class="fam-mini">No grupo ficam só o apelido, as restrições alimentares (vegetariano, sem lactose, sem glúten) e o registro das refeições da casa. Peso, idade e e-mail não são compartilhados.</p>
      ${volta}</div>`;
    $('modal-back').classList.add('on'); mi.scrollTop = 0; return;
  }
  const c = famCache(), uid = _famUid(), P = famParams();
  const nomesRef = { cafe:'Café da manhã', lanche1:'Lanche da manhã', almoco:'Almoço', lanche2:'Lanche da tarde', jantar:'Jantar', ceia:'Ceia' };
  const restr = [P.veg?'vegetariano':'', P.lac?'sem lactose':'', P.glu?'sem glúten':''].filter(Boolean);
  mi.innerHTML = `<div id="fam-tela"><h3>🏠 Alimentação da casa</h3>
    <div class="fam-codigo-box"><small>Código do grupo</small><b>${mtEsc(famId())}</b><button class="btn btn-ghost" onclick="famCompartilharCodigo()">Convidar</button></div>
    <div class="fam-sec">Quem está na casa (${famMembros().length}/${FAM_MAX})</div>
    <div class="fam-membros">${famMembros().map(m=>`<span class="fam-pessoa">${m===uid?'Você':mtEsc(famNome(m))}${m===c.dono?' <small>criou</small>':''}</span>`).join('')}</div>
    <div class="fam-sec">Refeições da casa (mesmo prato para todos)</div>
    <div class="fam-chips">${Object.keys(nomesRef).map(k=>`<button class="rc-chip ${famRefs().includes(k)?'on':''}" aria-pressed="${famRefs().includes(k)}" onclick="famAlternaRefeicao('${k}')">${nomesRef[k]}</button>`).join('')}</div>
    <p class="fam-mini">Quem usa menos refeições por dia (por exemplo 4) segue só as que existem no plano dele.</p>
    <div class="mod-toggle" style="margin:8px 0 0"><button class="seg ${P.economico?'on':''}" style="font-size:12px;padding:10px 4px" onclick="famAlternaEconomico()">💰 Pratos econômicos nas refeições da casa</button></div>
    ${restr.length ? `<p class="fam-p" style="margin-top:10px">As refeições da casa respeitam as restrições de todos: <b>${restr.join(', ')}</b>.</p>` : ''}
    <p class="fam-mini">Trocar o prato, marcar "comi", tirar ou acrescentar um alimento numa refeição da casa vale para todos. Mudar a quantidade é só sua (é a sua porção).</p>
    <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="nutriListaCompras()">🛒 Lista de compras da casa</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="famSair()">Sair do grupo (mantém meu cardápio)</button>
    ${volta}</div>`;
  $('modal-back').classList.add('on'); mi.scrollTop = 0;
}

// entrada no plano alimentar + selo "Casa" nas refeições compartilhadas
mtGancho('openNutri', { depois(){
  try{
    if(!mtTem('alimentacao')) return;
    const mi = $('modal-inner'); if(!mi) return;
    const bt = mi.querySelector('[onclick="nutriListaCompras()"]'); if(!bt) return;
    if(!mi.querySelector('#fam-entrada')){
      const ativo = famAtiva(); const nomesRef = { cafe:'café', lanche1:'lanche da manhã', almoco:'almoço', lanche2:'lanche da tarde', jantar:'jantar', ceia:'ceia' };
      const sub = ativo ? `${famMembros().length} pessoas · ${famRefs().map(k=>nomesRef[k]).join(' e ')} iguais` : 'mesmo cardápio para quem mora junto';
      bt.insertAdjacentHTML('afterend', `<button class="mealc rc-entrada" id="fam-entrada" onclick="openFamilia()"><span class="mi">🏠</span><span class="mt"><b>Alimentação da casa</b><small>${mtEsc(sub)}</small></span><span class="rc-seta">›</span></button>`);
    }
    if(famAtiva()){
      bt.textContent = `🛒 Lista de compras da casa (${famMembros().length} pessoas)`;
      famRefs().forEach(mid=>{
        mi.querySelectorAll(`details.mealc[ontoggle*="nutriTog('${mid}"]`).forEach(d=>{
          const t = d.querySelector('summary .mt b'); if(t && !t.querySelector('.fam-selo')) t.insertAdjacentHTML('beforeend', ' <span class="fam-selo">Casa</span>');
        });
      });
    }
  }catch(e){ console.log('casa (tela):', e); }
}});

// ---------- lista de compras (e PDF): soma as porções de todos nas refeições da casa ----------
function nutriComprasTotais(escopo){
  const hojeIdx = getDayIdx();
  const dias = []; if(escopo==='semana'){ for(let d=hojeIdx; d<=7; d++) dias.push({d, dk:nutriKeyDia(d)}); }
  else { for(let k=0; k<7; k++) dias.push({d:((hojeIdx-1+k)%7)+1, dk:chaveDia(new Date(Date.now()+k*86400000))}); }
  const tot = {}; const soma = (id,g)=>{ const t = tot[id] = tot[id] || {g:0}; t.g += g; };
  let editados = 0, diasOk = 0;
  const casa = famAtiva(), c = famCache(), uid = _famUid();
  const outros = casa ? famMembros().filter(m=>m!==uid) : [];
  dias.forEach(({d,dk})=>{
    const pl = nutriMontarPlano(d); if(pl.erro) return; diasOk++;
    const lg = nutriLogDe(dk);
    pl.refeicoes.forEach(m=>{
      const l = lg(m.id);
      m.itens.forEach(i=>{ const e = nutriEfetivo(i, l.adj[i.id]); if(e.removido){ editados++; return; } if(e.editado) editados++; soma(e.id, e.gramas); });
      (l.add||[]).forEach((a,idx)=>{ const x = nutriItemExtra(a,idx); if(x && !x.custom){ editados++; soma(x.id, x.gramas); } });
      if(!m.compartilhada || !outros.length) return;
      // a parte de cada pessoa da casa: o mesmo prato, na proporção da porção dela
      const r = NUTRI_REFEICOES.find(x=>x.id===m.id); const pr = famPrato(r, d, famParams(), nutriConfig(), 0);
      const remov = Object.keys(l.adj||{}).filter(id=>l.adj[id] && l.adj[id].x);
      outros.forEach(o=>{
        const f = (((c.perfis||{})[o]||{}).fatores||{})[d] && c.perfis[o].fatores[d][m.id];
        if(!f) return;                                  // essa pessoa não tem essa refeição no plano dela
        pr.op.i.forEach(([id,q])=>{ const idUse = (pr.eco && id==='azeite') ? 'oleo' : id; if(remov.includes(idUse)) return; soma(idUse, nutriItem(idUse, q, f).gramas); });
        (l.add||[]).forEach((a,idx)=>{ const x = nutriItemExtra(a,idx); if(x && !x.custom) soma(x.id, x.gramas); });
      });
    });
  });
  return { tot, editados, diasOk, pessoas: 1 + outros.length };
}
function _nutriFmtCompra(id, t){
  const a = NUTRI_ALIMENTOS[id];
  if(a[5]) return `${Math.max(1,Math.round(t.g/a[5]))} unid.`;
  if(id==='leite'||id==='iogurte') return t.g>=1000 ? `${(t.g/1000).toFixed(1).replace('.',',')} L` : `${Math.max(50,Math.round(t.g/50)*50)} ml`;
  let g = t.g, nota = '';
  if(NUTRI_CRU[id]){ g = t.g/NUTRI_CRU[id]; nota = ' (cru)'; }
  g = Math.max(50, Math.round(g/50)*50);
  return (g>=1000 ? `${(g/1000).toFixed(1).replace('.',',')} kg` : `${g} g`) + nota;
}
window.nutriListaCompras = function(escopo){
  escopo = escopo || window.__comprasEsc || 'semana'; window.__comprasEsc = escopo;
  const R = nutriComprasTotais(escopo); const tot = R.tot;
  const semKey = chaveDia(nutriDataDia(1)); state.comprasOk = state.comprasOk || {}; const ok = state.comprasOk[semKey] = state.comprasOk[semKey] || {};
  const fmt = id=>_nutriFmtCompra(id, tot[id]);
  const blocos = Object.values(NUTRI_CATEG).map(([titulo, ids])=>{
    const itens = ids.filter(id=>tot[id]).map(id=>`<div class="mrow ${ok[id]?'rm':''}" style="cursor:pointer" onclick="nutriCompraOk('${id}')"><span class="n">${ok[id]?'☑':'☐'} ${NUTRI_ALIMENTOS[id][0]}</span><span class="q">${fmt(id)}</span></div>`).join('');
    return itens ? `<div class="section-lbl" style="margin:14px 0 2px">${titulo}</div>${itens}` : '';
  }).join('');
  const casa = R.pessoas > 1;
  window.__nutriTextoCompras = `🛒 Lista de compras (MetaTreino)${casa ? ` — casa, ${R.pessoas} pessoas` : ''}\n\n` + Object.values(NUTRI_CATEG).map(([titulo, ids])=>{
    const l = ids.filter(id=>tot[id] && !ok[id]).map(id=>`• ${NUTRI_ALIMENTOS[id][0]}: ${fmt(id)}`); return l.length ? titulo+'\n'+l.join('\n') : '';
  }).filter(Boolean).join('\n\n');
  const nomesRef = { cafe:'café', lanche1:'lanche da manhã', almoco:'almoço', lanche2:'lanche da tarde', jantar:'jantar', ceia:'ceia' };
  $('modal-inner').innerHTML = `<h3>🛒 Lista de compras${casa ? ' da casa' : ''}</h3>
    <div class="mod-toggle" style="margin:8px 0 6px">
      <button class="seg ${escopo==='semana'?'on':''}" style="font-size:12px;padding:10px 4px" onclick="nutriListaCompras('semana')">Até domingo</button>
      <button class="seg ${escopo==='7dias'?'on':''}" style="font-size:12px;padding:10px 4px" onclick="nutriListaCompras('7dias')">Próximos 7 dias</button>
    </div>
    ${casa ? `<p class="fam-p" style="margin:4px 0">Para <b>${R.pessoas} pessoas</b> no ${famRefs().map(k=>nomesRef[k]).join(' e ')} (a porção de cada um); as outras refeições são só as suas.</p>` : ''}
    <p style="color:var(--text-dim);font-size:12px;line-height:1.55;margin:4px 0 0">${R.diasOk} ${R.diasOk===1?'dia':'dias'} a partir de hoje${R.editados?`, já com ${R.editados===1?'a sua 1 edição':'as suas '+R.editados+' edições'}`:''}. Dias que já passaram não entram. Remova um alimento do cardápio e ele sai daqui. Toque num item para marcar “já tenho”. Arroz, feijão, macarrão, soja e carnes estão em peso cru.</p>
    <div style="max-height:54vh;overflow-y:auto">${blocos || '<div class="text-dim" style="padding:14px 0;font-size:13px">Nada a comprar neste período.</div>'}</div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="nutriCopiarCompras()">📋 Copiar / compartilhar lista</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openNutri()">‹ Voltar ao plano</button>`;
  $('modal-back').classList.add('on');
};
// PDF do plano alimentar: lista de compras dos próximos 7 dias (com a casa, se houver)
function nutriPdfCompras(S, arte){
  try{
    const R = nutriComprasTotais('7dias'); const tot = R.tot;
    const linhas = [];
    Object.values(NUTRI_CATEG).forEach(([titulo, ids])=>{ const l = ids.filter(id=>tot[id]).map(id=>`${NUTRI_ALIMENTOS[id][0]}: ${_nutriFmtCompra(id, tot[id])}`); if(l.length) linhas.push([titulo.replace(/^[^\wÀ-ú]+/,''), l.join(' · ')]); });
    if(!linhas.length) return;
    S.precisa(60);
    S.secao(`Lista de compras — próximos 7 dias${R.pessoas > 1 ? ` · casa com ${R.pessoas} pessoas` : ''}`, R.pessoas > 1 ? 'refeições da casa somam a porção de cada um' : 'já com as suas edições', arte.C.a);
    S.tabela([{t:'Grupo', w:34, negrito:true, quebra:true}, {t:'Itens e quantidades', w:142, quebra:true}], linhas, { cabCor:arte.C.aClaro, cabTxt:arte.C.a, t:7.8 });
    S.nota('Arroz, feijão, macarrão, soja e carnes estão em peso cru. Quantidades arredondadas para facilitar a compra.');
  }catch(e){ console.log('pdf compras:', e); }
}

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
// O balão do assistente esperava só o tempo dele e aparecia por cima de "Plano criado!" / "teste Premium".
// Agora ele espera os avisos da tela sumirem (até 20 s) e, se um aviso chega com o balão aberto, o balão sai
// e volta depois.
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
.fam-entrar{margin:14px 0 6px}.fam-entrar label{font-size:12.5px;font-weight:700;display:block;margin-bottom:6px}
.fam-linha{display:flex;gap:8px}.fam-linha .input{flex:1;text-transform:uppercase;letter-spacing:3px;font-weight:800;text-align:center;min-width:0}
.fam-codigo-box{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:14px;background:rgba(var(--primary-rgb),.10);margin:6px 0 10px}
.fam-codigo-box small{font-size:11px;color:var(--text-dim)}.fam-codigo-box b{font-size:22px;letter-spacing:4px;font-family:ui-monospace,monospace;flex:1}
.fam-sec{font-size:11.5px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--text-dim);margin:12px 0 6px}
.fam-membros{display:flex;flex-wrap:wrap;gap:6px}.fam-pessoa{padding:6px 10px;border-radius:999px;background:rgba(127,127,127,.14);font-size:12.5px}.fam-pessoa small{color:var(--text-mute)}
.fam-chips{display:flex;flex-wrap:wrap;gap:6px}
.fam-selo{display:inline-block;font-size:10px;font-weight:800;padding:1px 7px;border-radius:99px;background:rgba(var(--primary-rgb),.16);color:var(--primary-2);vertical-align:middle;margin-left:4px}
`; document.head.appendChild(s); })();

Object.assign(window, { openFamilia, famCriar, famEntrar, famSair, famAlternaRefeicao, famAlternaEconomico, famCompartilharCodigo, famOuvir, famEnviar, famParams, nutriComprasTotais, nutriPdfCompras, famAtiva });

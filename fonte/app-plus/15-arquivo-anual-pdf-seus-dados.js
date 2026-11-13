
// =====================================================================
// 30. Beta 19 — arquivo anual (sem perder o passado), histórico completo,
//     relatório em PDF, "Seus dados" (espaço) e Início enxuto
// =====================================================================
// Como funciona o arquivo:
//  • O documento principal (usuarios/{uid}) continua leve: detalhe dos últimos 90 dias.
//  • ANTES da limpeza de 90 dias apagar algo, esse dado é gravado em
//    usuarios/{uid}/arquivo/{AAAA-S} (um documento por semestre). A regra
//    "usuarios/{userId}/{subdocumentos=**}" já cobre esse caminho: só o próprio
//    aluno e os administradores leem e gravam. Nenhuma regra nova.
//  • Só sai do app o que a nuvem CONFIRMOU que gravou. Se a gravação falhar
//    (sem internet etc.), o dado fica no app e tenta de novo depois. Se falhar
//    por muito tempo (365 dias) ou o documento passar de 85% do limite de 1 MB,
//    volta à limpeza original para proteger o documento.
//  • O arquivo só é lido quando o aluno pede (Histórico completo, gráficos do
//    ano, relatório em PDF) — não pesa na abertura do app.
const ARQ_FALLBACK_DIAS = 365;
const DOC_LIMITE = 1048576;            // 1 MiB por documento no Firestore
let _arqMem = null;                    // { uid, docs:{id:dados}, em }
let _arqRodando = false;

function _arqCol(uid){ return db.collection('usuarios').doc(uid).collection('arquivo'); }
function _arqSem(ts){ const d = new Date(ts); return d.getFullYear() + '-' + (d.getMonth() < 6 ? 1 : 2); }
function _arqInfo(){ if(!state.arquivo || typeof state.arquivo !== 'object' || Array.isArray(state.arquivo)) state.arquivo = {}; return state.arquivo; }
function _comPrazo(p, ms){ return Promise.race([p, new Promise((_, rej)=>setTimeout(()=>rej(new Error('tempo esgotado')), ms))]); }
function arqTemArquivo(){ const i = (state && state.arquivo) || {}; return !!((i.docs||[]).length); }
function _arqCarregado(){ return !!(_arqMem && fbUser && _arqMem.uid === fbUser.uid); }

// separa por semestre tudo o que é mais antigo que os cortes
function arqColetar(alvo, alvoResumo){
  const docs = {};
  const D = ts => { const k = _arqSem(ts); return docs[k] = docs[k] || { lift:{}, run:{}, prog:{}, resumo:{} }; };
  ['lift','run'].forEach(m=>{
    const vistos = {};
    ((((state.modules||{})[m])||{}).history||[]).forEach(x=>{
      if(!x || !(+x.at) || x.at >= alvo) return;
      let k = String(x.at); vistos[k] = (vistos[k]||0) + 1; if(vistos[k] > 1) k += '_' + vistos[k];
      D(x.at)[m][k] = x;
    });
  });
  Object.keys(state.progress||{}).forEach(ex=>{
    (state.progress[ex]||[]).forEach(p=>{ if(!p || !(+p.date) || p.date >= alvo) return; const o = D(p.date).prog; (o[ex] = o[ex] || {})[String(p.date)] = p; });
  });
  Object.keys(state.progResumo||{}).forEach(ex=>{
    (state.progResumo[ex]||[]).forEach(r=>{
      if(Array.isArray(r)) r = {d:r[0], p:r[1], v:r[2], r:r[3]};
      if(!r || !(+r.d) || r.d >= alvoResumo) return; const o = D(r.d).resumo; (o[ex] = o[ex] || {})[String(r.d)] = r;
    });
  });
  return docs;
}

// grava na nuvem e, só depois da confirmação, libera a limpeza
async function arqArquivar(){
  if(_arqRodando || !fbUser || !fbUser.uid || !state || !state.user || !state.modules) return false;
  const agora = Date.now();
  const alvo = agora - HISTORY_RETENTION_DAYS*DIA_MS, alvoR = agora - 730*DIA_MS;
  const info = _arqInfo();
  const docs = arqColetar(alvo, alvoR); const ids = Object.keys(docs);
  if(!ids.length){ info.ate = alvo; info.ateResumo = alvoR; return true; }   // nada a guardar
  _arqRodando = true; const uid = fbUser.uid;
  try{
    const escritas = ids.map(id=>{
      return _arqCol(uid).doc(id).set(Object.assign(_arqCompacto(docs[id]), { periodo:id, v:2, atualizadoEm:agora }), { merge:true });
    });
    await _comPrazo(Promise.all(escritas), 45000);
    if(!fbUser || fbUser.uid !== uid) return false;            // trocou de conta no meio
    info.ate = alvo; info.ateResumo = alvoR; info.em = agora; info.falhas = 0; delete info.erro; delete info.pendDesde;
    info.docs = [...new Set([...(info.docs||[]), ...ids])].sort();
    if(_arqCarregado()) ids.forEach(id=>{ _arqMem.docs[id] = _arqMescla(_arqMem.docs[id], JSON.parse(JSON.stringify(docs[id]))); });
    _arqRodando = false;
    window.cleanupOldHistory();                                 // agora pode limpar (e salva)
    return true;
  }catch(e){
    info.falhas = (info.falhas||0) + 1; info.pendDesde = info.pendDesde || agora; info.erro = String((e && e.message) || e).slice(0, 120);
    console.log('arquivo anual: vai tentar de novo depois —', e);
    return false;
  }finally{ _arqRodando = false; }
}
// cada registro vira um texto JSON: o Firestore indexa 1 campo por registro (e não cada
// subcampo), longe do limite de 40 mil entradas de índice por documento
function _arqCompacto(d){
  const js = v=>JSON.stringify(limpaParaNuvem(v, 'arquivo', []));
  const out = { lift:{}, run:{}, prog:{}, resumo:{} };
  ['lift','run'].forEach(m=>Object.keys(d[m]||{}).forEach(k=>{ out[m][k] = js(d[m][k]); }));
  ['prog','resumo'].forEach(m=>Object.keys(d[m]||{}).forEach(ex=>{ out[m][ex] = {}; Object.keys(d[m][ex]).forEach(k=>{ out[m][ex][k] = js(d[m][ex][k]); }); }));
  return out;
}
function _arqV(v){ if(typeof v === 'string'){ try{ return JSON.parse(v); }catch(e){ return null; } } return v; }
function _arqMescla(a, b){
  a = a || {}; b = b || {};
  const out = Object.assign({}, a, b);
  ['lift','run'].forEach(m=>{ out[m] = Object.assign({}, a[m]||{}, b[m]||{}); });
  ['prog','resumo'].forEach(m=>{ out[m] = Object.assign({}, a[m]||{}); Object.keys(b[m]||{}).forEach(ex=>{ out[m][ex] = Object.assign({}, (a[m]||{})[ex]||{}, b[m][ex]); }); });
  return out;
}

// a limpeza de 90 dias passa a respeitar o arquivo
const _cleanupB19 = window.cleanupOldHistory;
window.cleanupOldHistory = function(){
  try{
    const info = _arqInfo(); const agora = Date.now();
    // Proteções: arquivamento falhando há mais de 365 dias, ou documento perto do limite (85% de 1 MB) → limpeza original
    const falhaLonga = !!(info.pendDesde && (agora - info.pendDesde) > ARQ_FALLBACK_DIAS*DIA_MS);
    const pesado = arqTamanhoDoc() > DOC_LIMITE*0.85;
    const r = (falhaLonga || pesado)
      ? _cleanupB19.call(this)
      : _cleanupB19.call(this, Math.max(1, Math.min(agora - HISTORY_RETENTION_DAYS*DIA_MS, +info.ate||1)), Math.max(1, Math.min(agora - 730*DIA_MS, +info.ateResumo||1)));
    if(!_arqRodando) setTimeout(()=>{ arqArquivar().catch(()=>{}); }, 6000);
    return r;
  }catch(e){ console.log('limpeza com arquivo:', e); return _cleanupB19.apply(this, arguments); }
};

async function arqCarregar(forcar){
  if(_arqCarregado() && !forcar) return _arqMem;
  if(!fbUser) throw new Error('sem login');
  const uid = fbUser.uid;
  // direto do servidor: o cache local pode estar vazio e dar a falsa impressão de arquivo vazio
  const snap = await _comPrazo(_arqCol(uid).get({ source:'server' }), 20000);
  const docs = {}; snap.forEach(d=>{ docs[d.id] = d.data(); });
  _arqMem = { uid, docs, em:Date.now() };
  const info = _arqInfo(); const ids = Object.keys(docs).sort();
  if(ids.join() !== (info.docs||[]).join()) info.docs = ids;
  return _arqMem;
}
// apaga o arquivo (Começar do zero / Excluir conta). Dispara na hora, antes do login sair.
function arqApagarTudo(uid){
  if(!uid) return;
  const ids = new Set(((state && state.arquivo && state.arquivo.docs) || []));
  for(let a = 2025; a <= new Date().getFullYear(); a++){ ids.add(a+'-1'); ids.add(a+'-2'); }
  ids.forEach(id=>{ try{ _arqCol(uid).doc(id).delete().catch(()=>{}); }catch(e){} });
  if(_arqMem && _arqMem.uid === uid) _arqMem = null;
  try{ if(state && state.arquivo) state.arquivo = {}; }catch(e){}
}
function _arqLer(d){
  const out = { lift:{}, run:{}, prog:{}, resumo:{} }; d = d || {};
  ['lift','run'].forEach(m=>Object.keys(d[m]||{}).forEach(k=>{ const v = _arqV(d[m][k]); if(v) out[m][k] = v; }));
  ['prog','resumo'].forEach(m=>Object.keys(d[m]||{}).forEach(ex=>{ out[m][ex] = {}; Object.keys(d[m][ex]||{}).forEach(k=>{ const v = _arqV(d[m][ex][k]); if(v) out[m][ex][k] = v; }); }));
  return out;
}
// restaurar backup (.json) que trouxe o arquivo junto
function arqRestaurar(arq){
  if(!fbUser || !arq || typeof arq !== 'object') return;
  const uid = fbUser.uid; const ids = Object.keys(arq).filter(id=>/^\d{4}-[12]$/.test(id));
  ids.forEach(id=>{ try{ _arqCol(uid).doc(id).set(Object.assign(_arqCompacto(_arqLer(arq[id])), { periodo:id, v:2, atualizadoEm:Date.now() }), { merge:true }).catch(e=>console.log('restaurar arquivo', e)); }catch(e){} });
  const info = _arqInfo(); info.docs = [...new Set([...(info.docs||[]), ...ids])].sort();
  _arqMem = null; saveData();
}

// ---------- tudo junto: app + arquivo, sem duplicar ----------
function arqDados(){
  const lift = new Map(), run = new Map(), prog = {}, resumo = {};
  const addH = (map, x)=>{ if(x && +x.at) map.set(x.at + '|' + (x.name||'') + '|' + (x.duration||''), x); };
  const addP = (ex, p)=>{ if(p && +p.date) (prog[ex] = prog[ex] || new Map()).set(+p.date, p); };
  const addR = (ex, r)=>{ if(Array.isArray(r)) r = {d:r[0], p:r[1], v:r[2], r:r[3]}; if(r && +r.d) (resumo[ex] = resumo[ex] || new Map()).set(+r.d, r); };
  if(_arqCarregado()) Object.values(_arqMem.docs).forEach(d=>{
    Object.values(d.lift||{}).forEach(x=>addH(lift, _arqV(x))); Object.values(d.run||{}).forEach(x=>addH(run, _arqV(x)));
    Object.entries(d.prog||{}).forEach(([ex,o])=>Object.values(o||{}).forEach(p=>addP(ex, _arqV(p))));
    Object.entries(d.resumo||{}).forEach(([ex,o])=>Object.values(o||{}).forEach(r=>addR(ex, _arqV(r))));
  });
  (((state.modules.lift)||{}).history||[]).forEach(x=>addH(lift, x));
  (((state.modules.run)||{}).history||[]).forEach(x=>addH(run, x));
  Object.entries(state.progress||{}).forEach(([ex,a])=>(a||[]).forEach(p=>addP(ex, p)));
  Object.entries(state.progResumo||{}).forEach(([ex,a])=>(a||[]).forEach(r=>addR(ex, r)));
  const ord = m=>[...m.values()].sort((a,b)=>a.at-b.at);
  const P = {}, R = {};
  Object.keys(prog).forEach(ex=>{ P[ex] = [...prog[ex].values()].sort((a,b)=>a.date-b.date); });
  Object.keys(resumo).forEach(ex=>{ R[ex] = [...resumo[ex].values()].sort((a,b)=>a.d-b.d); });
  return { lift:ord(lift), run:ord(run), prog:P, resumo:R };
}
// pontos de um exercício: série completa quando existe, resumo quando não
function arqPontosEx(D, ex){
  const pts = []; const vistos = new Set();
  (D.prog[ex]||[]).filter(p=>p.sets && p.sets.length).forEach(p=>{ vistos.add(+p.date); pts.push({ date:+p.date, peso:Math.max(0, ...p.sets.map(s=>+s.peso||0)), vol:p.sets.reduce((t,x)=>t+(+x.peso||0)*(+x.reps||0), 0), reps:p.sets.reduce((t,x)=>t+(+x.reps||0), 0), sets:p.sets }); });
  (D.resumo[ex]||[]).forEach(r=>{ if(!vistos.has(+r.d)) pts.push({ date:+r.d, peso:+r.p||0, vol:+r.v||0, reps:+r.r||0, sets:null }); });
  return pts.sort((a,b)=>a.date-b.date);
}
function _volumeArq(D, a, b){
  let v = 0;
  Object.keys(D.prog).forEach(ex=>{ const vistos = new Set();
    D.prog[ex].forEach(p=>{ vistos.add(+p.date); if(p.date>=a && p.date<b) v += (p.sets||[]).reduce((t,s)=>t+(+s.peso||0)*(+s.reps||0), 0); });
    (D.resumo[ex]||[]).forEach(r=>{ if(r.d>=a && r.d<b && !vistos.has(+r.d)) v += (+r.v||0); });
  });
  Object.keys(D.resumo).forEach(ex=>{ if(D.prog[ex]) return; D.resumo[ex].forEach(r=>{ if(r.d>=a && r.d<b) v += (+r.v||0); }); });
  return Math.round(v);
}

// gráfico de evolução de carga do exercício: inclui o arquivo quando carregado
const _pontosExB19 = window._pontosEx;
window._pontosEx = function(exId){
  const base = _pontosExB19.apply(this, arguments);
  if(!_arqCarregado()) return base;
  try{
    const datas = new Set(base.map(p=>+p.date));
    const extra = arqPontosEx(arqDados(), exId).filter(p=>!datas.has(+p.date));
    return extra.length ? base.concat(extra).sort((a,b)=>a.date-b.date) : base;
  }catch(e){ return base; }
};
const _openExProgressB19 = window.openExProgress;
window.openExProgress = function(exId){
  const r = _openExProgressB19.apply(this, arguments);
  try{
    if(arqTemArquivo() && !_arqCarregado()){
      const mi = $('modal-inner'); const fechar = mi && [...mi.querySelectorAll('button')].pop();
      if(fechar && /Fechar/.test(fechar.textContent)){
        const b = document.createElement('button'); b.className = 'btn btn-outline btn-block'; b.style.marginTop = '10px';
        b.textContent = '📚 Incluir anos anteriores';
        b.onclick = ()=>{ b.disabled = true; b.textContent = '⏳ Buscando seu arquivo...';
          arqCarregar().then(()=>openExProgress(exId)).catch(()=>{ b.disabled = false; b.textContent = '📚 Incluir anos anteriores'; toast('📶 Sem conexão — tente de novo com internet'); }); };
        fechar.before(b);
      }
    }
  }catch(e){}
  return r;
};

// gráficos de Evolução (Progresso): no período "ano", usa o arquivo quando carregado
function arqNotaRetencao(){
  if(_arqCarregado()) return '';
  if(arqTemArquivo()) return `Treinos com mais de 90 dias estão no seu arquivo. <a href="#" onclick="arqCarregarEvo();return false" style="color:var(--primary);font-weight:600">Carregar arquivo</a>`;
  return 'Treinos com mais de 90 dias passam a ficar no seu arquivo anual (Histórico → Histórico completo).';
}
function arqCarregarEvo(){
  toast('📚 Buscando seu arquivo...');
  arqCarregar().then(()=>{ try{ renderEvolucao(); }catch(e){} }).catch(()=>toast('📶 Sem conexão — tente de novo com internet'));
}
const _renderEvolucaoB19 = window.renderEvolucao;
if(typeof _renderEvolucaoB19 === 'function') window.renderEvolucao = function(){
  if(!_arqCarregado()) return _renderEvolucaoB19.apply(this, arguments);
  const oH = window.mtHist, oV = window._volumeEntre, oA = window.mtAllHist;
  let D = null; try{ D = arqDados(); }catch(e){}
  if(!D) return _renderEvolucaoB19.apply(this, arguments);
  window.mtHist = function(){
    const L = D.lift.map(x=>Object.assign({}, x, {_t:'musculacao'}));
    const R = D.run.map(x=>Object.assign({}, x, {_t:(!x.activity || x.activity==='corrida') ? 'corrida' : x.activity}));
    return [...L, ...R].filter(x=>x && x.at).sort((a,b)=>a.at-b.at);
  };
  window.mtAllHist = function(){ return [...D.lift, ...D.run].filter(x=>x && x.at).sort((a,b)=>a.at-b.at); };
  window._volumeEntre = (a, b)=>_volumeArq(D, a, b);
  try{ return _renderEvolucaoB19.apply(this, arguments); }
  finally{ window.mtHist = oH; window._volumeEntre = oV; window.mtAllHist = oA; }
};

// ---------- Histórico: cartão "Histórico completo" ----------
mtGancho('renderHistory', { depois(){
  try{ arqCartaoHistorico(); }catch(e){ console.log('cartão do arquivo', e); }
}});
function arqCartaoHistorico(){
  const el = $('hist-arq'); if(!el || !state.user) return;
  const tem = arqTemArquivo();
  el.innerHTML = `<div class="arq-card">
    <h4>📚 Histórico completo</h4>
    <p>${tem ? 'Os treinos com mais de 90 dias ficam guardados no seu arquivo anual na nuvem. Veja ano a ano como você evoluiu.' : 'Aqui ficam os últimos 90 dias em detalhe. A partir desta versão, o que passar disso vai para o seu arquivo anual — nada se perde.'}</p>
    <div class="arq-btns">
      <button class="btn btn-outline" onclick="arqAbrirHistorico()">📈 Ver evolução ano a ano</button>
      <button class="btn btn-ghost" onclick="arqRelatorio()">📄 Relatório em PDF</button>
    </div></div>`;
}
function _anoDe(t){ return new Date(t).getFullYear(); }
function _fmtHoras(min){ min = Math.round(min||0); if(min < 60) return min + ' min'; const h = Math.floor(min/60), m = min%60; return h + 'h' + (m ? String(m).padStart(2,'0') : ''); }
function _fmtN(v, dec){ return (+v||0).toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits:dec||0}); }
function _ehCorr(r){ return r && (!r.activity || r.activity==='corrida'); }
function arqResumoAnos(D){
  const anos = {};
  const A = y => anos[y] = anos[y] || { y, lift:0, liftMin:0, vol:0, run:0, km:0, runMin:0, melhorPace:null, maiorKm:0, cam:0, bike:0, camKm:0, bikeKm:0, dias:new Set() };
  D.lift.forEach(x=>{ const a = A(_anoDe(x.at)); a.lift++; a.liftMin += +x.duration||0; a.dias.add(mtDia0(x.at)); });
  D.run.forEach(x=>{ const a = A(_anoDe(x.at)); a.dias.add(mtDia0(x.at));
    if(_ehCorr(x)){ a.run++; a.km += +x.distance||0; a.runMin += +x.duration||0; a.maiorKm = Math.max(a.maiorKm, +x.distance||0);
      if(+x.distance >= 3 && +x.duration > 0){ const p = x.duration/x.distance; if(!a.melhorPace || p < a.melhorPace) a.melhorPace = p; } }
    else if(x.activity==='caminhada'){ a.cam++; a.camKm += +x.distance||0; } else if(x.activity==='bike'){ a.bike++; a.bikeKm += +x.distance||0; } });
  Object.keys(anos).forEach(y=>{ anos[y].vol = _volumeArq(D, new Date(+y,0,1).getTime(), new Date(+y+1,0,1).getTime()); });
  // anos que só têm resumo de cargas (sem sessões) também aparecem
  Object.values(D.resumo).forEach(a=>a.forEach(r=>{ const y = _anoDe(r.d); if(!anos[y]){ A(y); anos[y].vol = _volumeArq(D, new Date(y,0,1).getTime(), new Date(y+1,0,1).getTime()); } }));
  return Object.values(anos).sort((a,b)=>b.y-a.y);
}
// exercícios com registro em mais de um ano: carga máxima do primeiro ano x do último
function arqEvolucaoCargas(D){
  const out = [];
  const exs = new Set([...Object.keys(D.prog), ...Object.keys(D.resumo)]);
  exs.forEach(ex=>{
    const pts = arqPontosEx(D, ex).filter(p=>p.peso > 0); if(pts.length < 2) return;
    const porAno = {}; pts.forEach(p=>{ const y = _anoDe(p.date); porAno[y] = Math.max(porAno[y]||0, p.peso); });
    const ys = Object.keys(porAno).map(Number).sort();
    const prim = pts[0], ult = pts[pts.length-1];
    const melhor = Math.max(...pts.map(p=>p.peso));
    out.push({ ex, nome:(typeof nomeDoEx==='function' ? nomeDoEx(ex) : ex), n:pts.length, ini:prim.peso, iniT:prim.date, fim:ult.peso, fimT:ult.date, melhor, anos:ys.length, porAno });
  });
  return out.sort((a,b)=>(b.anos - a.anos) || (b.n - a.n));
}
async function arqAbrirHistorico(){
  const mi = $('modal-inner'); if(!mi) return;
  mi.classList.remove('modal-video'); $('modal-back').classList.add('on');
  let aviso = '';
  if(arqTemArquivo() && !_arqCarregado()){
    mi.innerHTML = `<h3>📚 Histórico completo</h3><div class="rest-card"><div style="font-size:34px">⏳</div><div class="rest-sub">Buscando seu arquivo anual...</div></div>`;
    try{ await arqCarregar(); }catch(e){ aviso = '📶 Não deu para buscar o arquivo agora (sem conexão?). Mostrando o que está no aparelho.'; }
  }
  const D = arqDados(); const anos = arqResumoAnos(D); const evoTodos = arqEvolucaoCargas(D); const evo = evoTodos.slice(0, 6);
  const info = _arqInfo();
  const desde = (()=>{ const t = [D.lift[0]&&D.lift[0].at, D.run[0]&&D.run[0].at].filter(Boolean); Object.values(D.resumo).forEach(a=>a[0]&&t.push(a[0].d)); return t.length ? Math.min(...t) : null; })();
  const cartao = a=>`<div class="arq-ano"><h4>${a.y}<small>${a.dias.size} ${a.dias.size===1?'dia ativo':'dias ativos'}</small></h4>
    ${(a.lift || a.vol) ? `<div class="arq-sub">🏋️ Musculação</div><div class="arq-grid">
      <div class="qs"><div class="qs-v">${a.lift}</div><div class="qs-l">treinos</div></div>
      <div class="qs"><div class="qs-v">${_fmtHoras(a.liftMin)}</div><div class="qs-l">de treino</div></div>
      <div class="qs"><div class="qs-v">${a.vol>=1000?_fmtN(a.vol/1000,1)+' t':_fmtN(a.vol)+' kg'}</div><div class="qs-l">volume</div></div></div>` : ''}
    ${a.run ? `<div class="arq-sub">🏃 Corrida</div><div class="arq-grid">
      <div class="qs"><div class="qs-v">${a.run}</div><div class="qs-l">corridas</div></div>
      <div class="qs"><div class="qs-v">${_fmtN(a.km,1)} km</div><div class="qs-l">${_fmtHoras(a.runMin)}</div></div>
      <div class="qs"><div class="qs-v">${a.melhorPace ? fmtPaceMin(a.melhorPace).replace('/km','') : '–'}</div><div class="qs-l">melhor ritmo/km</div></div>
      <div class="qs"><div class="qs-v">${_fmtN(a.maiorKm,1)} km</div><div class="qs-l">maior corrida</div></div></div>` : ''}
    ${(a.cam || a.bike) ? `<div class="mt-muted" style="font-size:12px;margin-top:6px">${a.cam?`🚶 ${a.cam} caminhadas · ${_fmtN(a.camKm,1)} km`:''}${a.cam&&a.bike?' · ':''}${a.bike?`🚴 ${a.bike} pedais · ${_fmtN(a.bikeKm,1)} km`:''}</div>` : ''}
  </div>`;
  const linhaEvo = e=>{ const d = e.fim - e.ini; const pct = e.ini > 0 ? Math.round(d/e.ini*100) : 0;
    return `<div class="arq-evo" onclick="openExProgress('${String(e.ex).replace(/'/g,"\\'")}')"><b>${mtEsc(e.nome)}</b><span>${_fmtN(e.ini,1)} → ${_fmtN(e.fim,1)} kg ${d>0?`<span class="up">+${pct}%</span>`:(d<0?`${pct}%`:'')} ›</span></div>`; };
  mi.innerHTML = `<h3>📚 Histórico completo</h3>
    <p class="mt-muted" style="margin:0 0 6px;font-size:12.5px;line-height:1.5">${desde ? `Seus registros desde <b>${new Date(desde).toLocaleDateString('pt-BR',{month:'long', year:'numeric'})}</b>.` : 'Ainda não há registros.'} ${arqTemArquivo() ? 'Inclui o arquivo anual.' : 'O arquivo anual começa a guardar os treinos que passarem de 90 dias a partir desta versão (registros anteriores a isso já tinham sido resumidos — as cargas por exercício dos últimos 2 anos continuam nos gráficos).'}</p>
    ${aviso ? `<div class="mt-muted" style="font-size:12px;color:var(--accent-2);margin-bottom:6px">${aviso}</div>` : ''}
    ${evo.length ? `<div class="arq-sub" style="margin-top:12px">📈 Evolução de carga (primeiro → último registro)</div><div class="card" style="padding:4px 12px;margin-top:6px">${evo.map(linhaEvo).join('')}${evoTodos.length > evo.length ? `<div id="arq-evo-mais" style="display:none">${evoTodos.slice(6, 40).map(linhaEvo).join('')}</div><div class="arq-evo" style="justify-content:center;color:var(--primary);font-weight:600" onclick="this.previousElementSibling.style.display='';this.remove()">Ver mais ${Math.min(34, evoTodos.length - 6)} exercícios</div>` : ''}</div>` : ''}
    <div style="max-height:46vh;overflow-y:auto;margin-top:6px">${anos.map(cartao).join('') || '<div class="mt-muted" style="padding:14px 2px">Nenhum treino registrado ainda.</div>'}</div>
    ${info.em ? `<div class="mt-muted" style="font-size:11px;margin-top:8px">Último arquivamento: ${new Date(info.em).toLocaleDateString('pt-BR')}</div>` : ''}
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="arqRelatorio()">📄 Gerar relatório em PDF</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
}

// ---------- Seus dados (espaço usado) ----------
function _bytesDe(obj){ try{ return new Blob([JSON.stringify(obj)]).size; }catch(e){ return JSON.stringify(obj||{}).length; } }
function arqTamanhoDoc(){
  try{ return _bytesDe({ email:(fbUser&&fbUser.email)||'', nome:'', atualizadoEm:0, estadoApp:limpaParaNuvem(state, 'estadoApp', []) }); }catch(e){ return 0; }
}
// do que é feito o documento: quase tudo é custo fixo (plano e foto), que não cresce com o uso
function _composicaoDoc(){
  try{
    const st = limpaParaNuvem(state, 'estadoApp', []); const B = v=>_bytesDe(v||{});
    const total = B(st) || 1;
    const foto = ((st.user||{}).profile||{}).photo ? String(st.user.profile.photo).length : 0;
    const plano = ['lift','run'].reduce((s,m)=>s + (((st.modules||{})[m]||{}).plan ? B(st.modules[m].plan) : 0), 0);
    const hist = ['lift','run'].reduce((s,m)=>s + (((st.modules||{})[m]||{}).history ? B(st.modules[m].history) : 0), 0) + B(st.progress) + B(st.progResumo) + B(st.corridaStats) + B(st.weights);
    const outros = Math.max(0, total - foto - plano - hist);
    const linha = (n, v, d)=>`<div class="mrow" style="font-size:12.5px"><span>${n}${d?`<small style="display:block;color:var(--text-mute);font-size:11px">${d}</small>`:''}</span><span>${_fmtKB(v)}</span></div>`;
    return `<div class="arq-sub" style="margin-top:10px">Do que é feito</div>
      ${linha('Plano de treino', plano, 'exercícios, séries e descansos de cada treino (tamanho fixo)')}
      ${foto ? linha('Foto do perfil', foto, 'tamanho fixo') : ''}
      ${linha('Histórico, séries e pesos', hist, 'cresce com os treinos; o que passa de 90 dias vai para o arquivo')}
      ${linha('Configurações e o resto', outros, 'preferências, metas, conquistas, água, notas')}`;
  }catch(e){ return ''; }
}
function _fmtKB(b){ return b >= 1048576 ? _fmtN(b/1048576, 2) + ' MB' : _fmtN(Math.max(1, Math.round(b/1024))) + ' KB'; }
function _nivelTam(pct){ return pct >= 85 ? 'critico' : pct >= 60 ? 'alerta' : ''; }
function arqSeusDados(){
  const b = arqTamanhoDoc(); const pct = Math.min(100, Math.round(b/DOC_LIMITE*100));
  const info = _arqInfo(); const docs = info.docs || [];
  const nH = (((state.modules.lift)||{}).history||[]).length + (((state.modules.run)||{}).history||[]).length;
  const msg = pct >= 85 ? 'Perto do limite. O app arquiva automaticamente o que passa de 90 dias; se continuar alto, fale com o treinador.'
            : pct >= 60 ? 'Tudo certo, mas acima do normal. O arquivamento automático mantém o espaço sob controle.'
            : 'Tranquilo. Bem abaixo do limite.';
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `<h3>📦 Seus dados</h3>
    <p class="mt-muted" style="margin:0 0 10px;font-size:12.5px;line-height:1.55">Tudo fica salvo na nuvem, na sua conta. O app guarda <b>os últimos 90 dias em detalhe</b> no documento principal (é ele que abre junto com o app) e manda o que for mais antigo para o seu <b>arquivo anual</b>, que só é lido quando você pede. Assim o app continua leve e nada se perde.</p>
    <div class="card" style="padding:12px 14px">
      <div style="display:flex;justify-content:space-between;font-size:13px"><b>Documento principal</b><span>${_fmtKB(b)} de 1 MB</span></div>
      <div class="dados-barra ${_nivelTam(pct)}"><i style="width:${Math.max(2,pct)}%"></i></div>
      <div class="mt-muted" style="font-size:12px">${pct}% · ${msg}</div>
      ${_composicaoDoc()}
    </div>
    <div class="card" style="padding:12px 14px;margin-top:8px;font-size:13px;line-height:1.6">
      <div class="mrow"><span>Sessões nos últimos 90 dias</span><span>${nH}</span></div>
      <div class="mrow"><span>Arquivo anual</span><span>${docs.length ? (()=>{ const ys = [...new Set(docs.map(d=>d.slice(0,4)))]; return `${docs.length} ${docs.length===1?'semestre':'semestres'} (${ys[0]}${ys.length>1?'–'+ys[ys.length-1]:''})`; })() : 'ainda vazio'}</span></div>
      <div class="mrow"><span>Último arquivamento</span><span>${info.em ? new Date(info.em).toLocaleDateString('pt-BR') : '—'}</span></div>
      ${info.falhas ? `<div class="mrow"><span>Arquivamento pendente</span><span style="color:var(--accent-2)">tenta de novo ao abrir com internet</span></div>` : ''}
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="arqRelatorio()">📄 Relatório em PDF (gráficos e dados)</button>
    <button class="btn btn-outline btn-block" style="margin-top:8px" onclick="exportMyData()">💾 Backup completo (.json, inclui o arquivo)</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}

// backup .json passa a levar o arquivo anual junto
window.exportMyData = async function(){
  let arquivo = null;
  if(arqTemArquivo()){
    toast('📦 Juntando seu arquivo anual...');
    try{ const docs = (await arqCarregar()).docs; arquivo = {}; Object.keys(docs).forEach(id=>{ arquivo[id] = _arqLer(docs[id]); }); }catch(e){ toast('📶 Sem conexão: o backup vai sem o arquivo anual (os últimos 90 dias vão completos)'); }
  }
  const data = { app:'MetaTreino', versao:APP_VERSION, exportadoEm:new Date().toISOString(), estado:state };
  if(arquivo) data.arquivo = arquivo;
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `metatreino-backup-${chaveDia(new Date())}.json`;
  a.click();
  toast('📥 Backup baixado — guarde em local seguro');
};

// ---------- Painel ADM: tamanho dos dados por aluno ----------
mtGancho('goAdmin', { depois(){
  try{
    if(!$('adm-tam-row')){
      const ref = $('adm-perm-row') || $('adm-ev-row') || [...document.querySelectorAll('#scr-admin .list-row')].find(r=>/Mensagens dos alunos|Feedback/.test(r.textContent));
      if(ref){ const d = document.createElement('div'); d.className = 'list-row'; d.id = 'adm-tam-row'; d.onclick = admTamanhos;
        d.innerHTML = '📦 <span>Tamanho dos dados</span><span style="margin-left:auto;font-size:11px;color:var(--text-dim)">limite e consumo</span>'; ref.after(d); }
    }
  }catch(e){}
}});
function admTamanhos(){
  const lista = Object.entries(usuariosCache||{}).map(([email,u])=>({ email, nome:(u && u.nome) || '', b:_bytesDe(u), sem:!admTemAcesso(email) })).sort((a,b)=>(b.sem - a.sem) || (b.b - a.b));
  const semAcesso = lista.filter(x=>x.sem); const princ = mtPrincipal();
  const total = lista.reduce((s,x)=>s+x.b, 0);
  const media = lista.length ? total/lista.length : 0;
  const alerta = lista.filter(x=>x.b/DOC_LIMITE >= .6).length;
  // estimativa grosseira de download mensal: cada aluno abre o app 2x/dia e baixa o próprio documento
  const mes = total*2*30; const gb = mes/1073741824;
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `<h3>📦 Tamanho dos dados</h3>
    <p class="mt-muted" style="margin:0 0 10px;font-size:12.5px;line-height:1.5">Cada aluno tem um documento principal (limite do Firestore: 1 MB por documento). Os treinos com mais de 90 dias vão para o arquivo anual do aluno, que só é lido sob demanda.</p>
    <div class="adm-kpis">
      <div class="adm-kpi"><b>${_fmtKB(total)}</b><small>somando ${lista.length} ${lista.length===1?'aluno':'alunos'}</small></div>
      <div class="adm-kpi"><b>${_fmtKB(media)}</b><small>média por aluno</small></div>
      <div class="adm-kpi"><b>${alerta}</b><small>acima de 60% do limite</small></div>
    </div>
    <div class="mt-muted" style="font-size:12px;margin:8px 2px 10px;line-height:1.5">Estimativa de download (se cada aluno abrir o app 2× por dia): <b>~${_fmtN(gb, 2)} GB/mês</b> de 10 GB gratuitos. Abrir este painel baixa todos os documentos (${_fmtKB(total)}) de uma vez.</div>
    ${semAcesso.length ? `<div class="mt-muted" style="font-size:12px;margin:0 2px 8px;line-height:1.5"><b>${semAcesso.length}</b> ${semAcesso.length===1?'aluno sem acesso ainda ocupa':'alunos sem acesso ainda ocupam'} ${_fmtKB(semAcesso.reduce((s,x)=>s+x.b,0))}.${princ ? ' Dá para apagar (com backup automático antes).' : ' Só o administrador principal pode apagar.'}</div>` : ''}
    <div style="max-height:46vh;overflow-y:auto">${lista.map(x=>{ const pct = Math.min(100, Math.round(x.b/DOC_LIMITE*100));
      return `<div class="adm-tam"><b>${mtEsc(x.nome || x.email)}${x.sem?' <span class="adm-sem">sem acesso</span>':''}</b><span>${_fmtKB(x.b)} · ${pct}%${x.sem && princ ? ` <button class="adm-apagar" title="Apagar dados" onclick="admApagarAluno('${String(x.email).replace(/'/g,"\\'")}')">Apagar</button>` : ''}</span><div class="dados-barra ${_nivelTam(pct)}"><i style="width:${Math.max(2,pct)}%"></i></div></div>`; }).join('') || '<div class="mt-muted">Nenhum aluno com dados ainda.</div>'}</div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}

// =====================================================================
// RELATÓRIO EM PDF (jsPDF 2.5.2, MIT — arquivo local jspdf.umd.min.js,
// carregado só quando o aluno pede o relatório)
// =====================================================================
let _pdfOpt = { per:'6m', lift:true, run:true, sess:true };
function _temLift(){ return !!(state.modules.lift || (((state.modules.lift)||{}).history||[]).length || Object.keys(state.progress||{}).length); }
function _temRun(){ return !!(state.modules.run || (((state.modules.run)||{}).history||[]).length); }
function arqRelatorio(){
  const L = _temLift(), R = _temRun();
  const per = [['3m','3 meses'],['6m','6 meses'],['1a','1 ano'],['tudo','Tudo']];
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `<h3>📄 Relatório em PDF</h3>
    <p class="mt-muted" style="margin:0 0 8px;font-size:12.5px;line-height:1.5">Gráficos e dados dos seus treinos para guardar, imprimir ou mandar pro treinador. Dá pra salvar no Google Drive pelo botão Compartilhar.</p>
    <div class="arq-sub">Período</div>
    <div class="pdf-opts" id="pdf-per">${per.map(([k,l])=>`<button type="button" class="${_pdfOpt.per===k?'on':''}" onclick="_pdfOpt.per='${k}';document.querySelectorAll('#pdf-per button').forEach(b=>b.classList.toggle('on', b===this))">${l}</button>`).join('')}</div>
    <div class="arq-sub">Incluir</div>
    ${L ? `<label class="pdf-chk"><input type="checkbox" id="pdf-lift" ${_pdfOpt.lift?'checked':''}> 🏋️ Musculação (volume, cargas, recordes)</label>` : ''}
    ${R ? `<label class="pdf-chk"><input type="checkbox" id="pdf-run" ${_pdfOpt.run?'checked':''}> 🏃 Corrida (km, ritmo, recordes, provas)</label>` : ''}
    <label class="pdf-chk"><input type="checkbox" id="pdf-sess" ${_pdfOpt.sess?'checked':''}> 📋 Lista de todas as sessões</label>
    <div id="pdf-status" class="mt-muted" style="font-size:12px;min-height:16px;margin-top:4px"></div>
    <button class="btn btn-primary btn-block" id="pdf-go" style="margin-top:8px" onclick="arqGerarPDF()">📄 Gerar PDF</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function _carregaJsPDF(){
  if(window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  return _comPrazo(new Promise((res, rej)=>{
    const s = document.createElement('script'); s.src = './jspdf.umd.min.js?v=' + APP_VERSION; s.async = true;
    s.onload = ()=> (window.jspdf && window.jspdf.jsPDF) ? res(window.jspdf.jsPDF) : rej(new Error('jsPDF indisponível'));
    s.onerror = ()=>rej(new Error('não carregou o gerador de PDF'));
    document.head.appendChild(s);
  }), 25000);
}
async function arqGerarPDF(){
  const g = id=>document.getElementById(id);
  _pdfOpt.lift = g('pdf-lift') ? g('pdf-lift').checked : false;
  _pdfOpt.run = g('pdf-run') ? g('pdf-run').checked : false;
  _pdfOpt.sess = g('pdf-sess') ? g('pdf-sess').checked : false;
  const st = g('pdf-status'), bt = g('pdf-go');
  const fala = t=>{ if(st) st.textContent = t; };
  if(!_pdfOpt.lift && !_pdfOpt.run){ fala('Marque musculação ou corrida.'); return; }
  if(bt){ bt.disabled = true; bt.textContent = '⏳ Gerando...'; }
  let aviso = '';
  try{
    if(_pdfOpt.per !== '3m' && arqTemArquivo() && !_arqCarregado()){
      fala('Buscando seu arquivo anual...');
      try{ await arqCarregar(); }catch(e){ aviso = 'Sem conexão: o arquivo anual não entrou neste relatório.'; }
    }
    fala('Montando gráficos...');
    const jsPDF = await _carregaJsPDF();
    const { doc, nome } = arqMontarPDF(jsPDF, _pdfOpt, aviso);
    const blob = doc.output('blob');
    _pdfMostrar(blob, nome);
  }catch(e){
    console.log('PDF:', e);
    fala('⚠️ Não foi possível gerar o PDF' + (navigator.onLine ? '.' : ' — abra o app com internet uma vez para baixar o gerador.'));
    if(bt){ bt.disabled = false; bt.textContent = '📄 Gerar PDF'; }
  }
}
function _pdfMostrar(blob, nome){
  window._pdfUlt = { blob, nome };
  let podeComp = false;
  try{ podeComp = !!(navigator.canShare && navigator.canShare({ files:[new File([blob], nome, {type:'application/pdf'})] })); }catch(e){}
  $('modal-inner').innerHTML = `<h3>✅ Relatório pronto</h3>
    <p class="mt-muted" style="margin:0 0 10px;font-size:12.5px;line-height:1.5"><b>${mtEsc(nome)}</b> · ${_fmtKB(blob.size)}</p>
    <button class="btn btn-primary btn-block" onclick="pdfBaixar()">📥 Baixar PDF</button>
    ${podeComp ? `<button class="btn btn-outline btn-block" style="margin-top:8px" onclick="pdfCompartilhar()">📤 Compartilhar (Drive, WhatsApp, e-mail...)</button>` : ''}
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
}
function pdfBaixar(){
  const u = window._pdfUlt; if(!u) return;
  const a = document.createElement('a'); a.href = URL.createObjectURL(u.blob); a.download = u.nome;
  document.body.appendChild(a); a.click(); setTimeout(()=>{ try{ URL.revokeObjectURL(a.href); a.remove(); }catch(e){} }, 4000);
  toast('📥 PDF baixado');
}
function pdfCompartilhar(){
  const u = window._pdfUlt; if(!u) return;
  const f = new File([u.blob], u.nome, {type:'application/pdf'});
  navigator.share({ files:[f], title:'Relatório MetaTreino' }).catch(()=>{});
}

// texto seguro para as fontes padrão do PDF (Latin-1): sem emoji
function _T(s){
  return String(s==null?'':s).replace(/[\u2014\u2013]/g,'-').replace(/\u2026/g,'...').replace(/[\u201C\u201D]/g,'"').replace(/[\u2018\u2019]/g,"'").replace(/\u2192/g,'->')
    .replace(/[^\x00-\xFF]/g,'').replace(/\s{2,}/g,' ').trim();
}
// _niceMax: a mesma função dos gráficos da Beta 11 (08-home-alimentacao-graficos.js)
function _dataBR(t, ano){ return new Date(t).toLocaleDateString('pt-BR', ano ? {day:'2-digit', month:'2-digit', year:'2-digit'} : {day:'2-digit', month:'2-digit'}); }
const _MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function arqMontarPDF(jsPDF, opt, aviso){
  const doc = new jsPDF({ unit:'mm', format:'a4', compress:true });
  const PW = 210, PH = 297, M = 14, W = PW - 2*M;
  const C = { ink:[22,27,34], dim:[96,106,118], linha:[222,226,232], fundo:[245,247,249], lift:[86,130,20], run:[14,116,144], acc:[217,95,24], band:[11,15,20], lime:[182,242,58], peso:[124,58,237] };
  let y = 0;
  const cor = c=>doc.setTextColor(c[0], c[1], c[2]);
  const fonte = (tam, est)=>{ doc.setFont('helvetica', est||'normal'); doc.setFontSize(tam); };
  const nova = ()=>{ doc.addPage(); y = M + 2; };
  const precisa = h=>{ if(y + h > PH - 16) nova(); };
  const txt = (s, x, yy, o)=>doc.text(_T(s), x, yy, o);

  // ----- dados do período -----
  const agora = Date.now();
  const D = arqDados();
  const dias = { '3m':91, '6m':182, '1a':365 }[opt.per];
  const primeiro = (()=>{ const t = [D.lift[0]&&D.lift[0].at, D.run[0]&&D.run[0].at].filter(Boolean); if(opt.lift) Object.values(D.resumo).forEach(a=>a[0]&&t.push(a[0].d)); return t.length ? Math.min(...t) : agora; })();
  const ini = dias ? mtDia0(agora - dias*DIA_MS) : mtDia0(primeiro);
  const span = agora - ini;
  const mensal = span > 130*DIA_MS;
  const L = D.lift.filter(x=>x.at >= ini);
  const R = D.run.filter(x=>x.at >= ini);
  const corr = R.filter(_ehCorr);
  // baldes (semana ou mês)
  const baldes = [];
  if(mensal){ const d = new Date(ini); d.setDate(1); d.setHours(0,0,0,0); while(d.getTime() <= agora){ const a = d.getTime(); d.setMonth(d.getMonth()+1); baldes.push({ a, b:d.getTime(), rot:_MESES[new Date(a).getMonth()] + (span > 400*DIA_MS ? '/' + String(new Date(a).getFullYear()).slice(2) : '') }); } }
  else { let a = mtSemanaIni(ini); while(a <= agora){ baldes.push({ a, b:a + 7*DIA_MS, rot:_dataBR(a) }); a += 7*DIA_MS; } }
  const porBalde = (lista, f)=>baldes.map(b=>({ rot:b.rot, v:lista.filter(x=>x.at>=b.a && x.at<b.b).reduce((s,x)=>s+f(x), 0) }));
  const nomeAluno = (state.user && state.user.profile && state.user.profile.nickname) || state.user.name || (fbUser && fbUser.displayName) || 'Aluno';
  const perTxt = { '3m':'últimos 3 meses', '6m':'últimos 6 meses', '1a':'último ano', 'tudo':'todo o histórico' }[opt.per];

  // ----- componentes -----
  function secao(t, c){
    precisa(16); y += 2;
    doc.setFillColor(c[0], c[1], c[2]); doc.rect(M, y, 1.6, 7, 'F');
    fonte(13.5, 'bold'); cor(C.ink); txt(t, M + 4.5, y + 5.6);
    y += 11;
  }
  function tiles(itens, c){
    const n = itens.length, gap = 3, w = (W - gap*(n-1)) / n, h = 17;
    precisa(h + 4);
    itens.forEach((it, i)=>{
      const x = M + i*(w + gap);
      doc.setFillColor(...C.fundo); doc.roundedRect(x, y, w, h, 2.5, 2.5, 'F');
      doc.setFillColor(c[0], c[1], c[2]); doc.rect(x, y + 3, 0.9, h - 6, 'F');
      fonte(n > 4 ? 11.5 : 13, 'bold'); cor(C.ink); txt(it.v, x + 4, y + 8);
      fonte(7.5); cor(C.dim); txt(it.l, x + 4, y + 13);
    });
    y += h + 5;
  }
  function barras(dados, o){
    const h = o.h || 44, topo = 8;
    precisa(h + topo + 10);
    fonte(9.5, 'bold'); cor(C.ink); txt(o.titulo, M, y + 4);
    if(o.sub){ fonte(7.5); cor(C.dim); txt(o.sub, PW - M, y + 4, {align:'right'}); }
    const y0 = y + topo, x0 = M + 11, w = W - 11;
    const max = _niceMax(Math.max(0, ...dados.map(d=>d.v)));
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.2);
    fonte(6.5); cor(C.dim);
    for(let i = 0; i <= 4; i++){ const yy = y0 + h - h*i/4; doc.line(x0, yy, x0 + w, yy); txt(o.fmt ? o.fmt(max*i/4) : _fmtN(max*i/4, 1), x0 - 1.5, yy + 1.1, {align:'right'}); }
    const n = Math.max(1, dados.length), slot = w / n, bw = Math.min(10, slot*0.62);
    const passo = Math.ceil(n / 13);
    dados.forEach((d, i)=>{
      const bh = max ? h * d.v / max : 0; const x = x0 + slot*i + (slot - bw)/2;
      if(bh > 0){ doc.setFillColor(o.cor[0], o.cor[1], o.cor[2]); doc.rect(x, y0 + h - bh, bw, bh, 'F'); }
      if(n <= 14 && d.v > 0){ fonte(6.2); cor(C.ink); txt(o.fmt ? o.fmt(d.v) : _fmtN(d.v, 1), x + bw/2, y0 + h - bh - 1.2, {align:'center'}); }
      if(i % passo === 0){ fonte(6.2); cor(C.dim); txt(d.rot, x + bw/2, y0 + h + 4, {align:'center'}); }
    });
    y = y0 + h + 9;
  }
  function linhaGraf(pts, o){
    const h = o.h || 40, topo = 8, larg = o.w || W, x00 = o.x || M;
    if(!o.x) precisa(h + topo + 10);
    const yIni = o.y != null ? o.y : y;
    fonte(o.pequeno ? 8.5 : 9.5, 'bold'); cor(C.ink); txt(o.titulo, x00, yIni + 4);
    if(o.sub){ fonte(7); cor(C.dim); txt(o.sub, x00 + larg, yIni + 4, {align:'right'}); }
    const y0 = yIni + topo, x0 = x00 + 10, w = larg - 12;
    const vs = pts.map(p=>p.v); let lo = Math.min(...vs), hi = Math.max(...vs);
    if(hi === lo){ hi += 1; lo = Math.max(0, lo - 1); } const pad = (hi - lo)*0.12; lo = Math.max(0, lo - pad); hi += pad;
    const t0 = pts[0].t, t1 = pts[pts.length-1].t;
    const X = t=>x0 + (t1 === t0 ? w/2 : w*(t - t0)/(t1 - t0));
    const Y = v=>o.inverter ? y0 + h*(v - lo)/(hi - lo) : y0 + h - h*(v - lo)/(hi - lo);
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.2);
    fonte(6.2); cor(C.dim);
    [lo, (lo+hi)/2, hi].forEach(v=>{ const yy = Y(v); doc.line(x0, yy, x0 + w, yy); txt(o.fmt ? o.fmt(v) : _fmtN(v, (hi - lo) > 10 ? 0 : 1), x0 - 1.5, yy + 1.1, {align:'right'}); });
    doc.setDrawColor(o.cor[0], o.cor[1], o.cor[2]); doc.setLineWidth(0.7);
    for(let i = 1; i < pts.length; i++) doc.line(X(pts[i-1].t), Y(pts[i-1].v), X(pts[i].t), Y(pts[i].v));
    doc.setFillColor(o.cor[0], o.cor[1], o.cor[2]);
    if(pts.length <= 60) pts.forEach(p=>doc.circle(X(p.t), Y(p.v), 0.75, 'F'));
    fonte(6.2); cor(C.dim);
    const comAno = (t1 - t0) > 300*DIA_MS;
    txt(_dataBR(t0, comAno), x0, y0 + h + 4); txt(_dataBR(t1, comAno), x0 + w, y0 + h + 4, {align:'right'});
    if(!o.x) y = y0 + h + 9;
  }
  function tabela(cols, linhas, o){
    o = o || {};
    const larg = cols.map(c=>c.w); const tot = larg.reduce((a,b)=>a+b, 0); const k = W / tot;
    const xs = []; let acc = M; larg.forEach(w=>{ xs.push(acc); acc += w*k; });
    const cab = ()=>{ precisa(8); doc.setFillColor(...C.fundo); doc.rect(M, y, W, 6.5, 'F'); fonte(7.5, 'bold'); cor(C.dim);
      cols.forEach((c, i)=>txt(c.t, c.dir ? xs[i] + c.w*k - 1.5 : xs[i] + 1.5, y + 4.4, c.dir ? {align:'right'} : undefined)); y += 7.5; };
    cab();
    linhas.forEach(l=>{
      if(y + 6 > PH - 16){ nova(); cab(); }
      fonte(7.8); cor(C.ink);
      l.forEach((v, i)=>{ const c = cols[i]; let s = _T(v); const maxW = c.w*k - 3;
        while(s.length > 3 && doc.getTextWidth(s) > maxW) s = s.slice(0, -2);
        if(s !== _T(v)) s = s.replace(/.$/, '.');
        doc.text(s, c.dir ? xs[i] + c.w*k - 1.5 : xs[i] + 1.5, y + 3.6, c.dir ? {align:'right'} : undefined); });
      doc.setDrawColor(...C.linha); doc.setLineWidth(0.15); doc.line(M, y + 5.4, M + W, y + 5.4);
      y += 5.8;
    });
    y += 4;
  }
  function nota(s){ precisa(8); fonte(7.5, 'italic'); cor(C.dim); const ls = doc.splitTextToSize(_T(s), W); doc.text(ls, M, y + 3); y += ls.length*3.6 + 3; }

  // ----- capa -----
  doc.setFillColor(...C.band); doc.rect(0, 0, PW, 42, 'F');
  fonte(9, 'bold'); doc.setTextColor(...C.lime); txt('METATREINO', M, 13);
  fonte(21, 'bold'); doc.setTextColor(255, 255, 255); txt('Relatório de treinos', M, 25);
  fonte(9.5); doc.setTextColor(200, 206, 214);
  txt(`${nomeAluno} · ${perTxt} (${_dataBR(ini, true)} a ${_dataBR(agora, true)})`, M, 33);
  txt(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, PW - M, 13, {align:'right'});
  y = 50;
  if(aviso) nota(aviso);

  const diasAtivos = new Set([...(opt.lift ? L : []), ...(opt.run ? R : [])].map(x=>mtDia0(x.at))).size;
  const horas = [...(opt.lift ? L : []), ...(opt.run ? R : [])].reduce((s,x)=>s+(+x.duration||0), 0);
  const trofPer = Object.entries(state.trophyDates||{}).filter(([,t])=>t >= ini).length;
  tiles([
    { v:_fmtN(diasAtivos), l:'dias ativos' },
    { v:_fmtN((opt.lift ? L.length : 0) + (opt.run ? R.length : 0)), l:'sessões registradas' },
    { v:_fmtHoras(horas), l:'de treino' },
    { v:_fmtN(trofPer), l:'conquistas no período' }
  ], C.acc);

  // ----- musculação -----
  if(opt.lift){
    secao('Musculação', C.lift);
    const volTotal = _volumeArq(D, ini, agora + DIA_MS);
    const prsPer = Object.values(state.prs||{}).filter(p=>p && p.at >= ini).length;
    const exsPer = Object.keys(D.prog).filter(ex=>D.prog[ex].some(p=>p.date >= ini)).length || Object.keys(D.resumo).filter(ex=>D.resumo[ex].some(r=>r.d >= ini)).length;
    tiles([
      { v:_fmtN(L.length), l:'treinos' },
      { v:_fmtHoras(L.reduce((s,x)=>s+(+x.duration||0), 0)), l:'de musculação' },
      { v:volTotal >= 1000 ? _fmtN(volTotal/1000, 1) + ' t' : _fmtN(volTotal) + ' kg', l:'volume (carga x reps)' },
      { v:_fmtN(prsPer), l:'recordes pessoais' }
    ], C.lift);
    if(L.length || volTotal){
      barras(porBalde(L, ()=>1), { titulo:`Treinos por ${mensal?'mês':'semana'}`, cor:C.lift, h:34, fmt:v=>_fmtN(v) });
      const vb = baldes.map(b=>({ rot:b.rot, v:_volumeArq(D, b.a, b.b)/1000 }));
      if(vb.some(b=>b.v > 0)) barras(vb, { titulo:`Volume por ${mensal?'mês':'semana'}`, sub:'toneladas (carga x repetições)', cor:C.lift, h:38, fmt:v=>_fmtN(v, 1) });
      // evolução de carga
      const evo = Object.keys({...D.prog, ...D.resumo}).map(ex=>{
        const pts = arqPontosEx(D, ex).filter(p=>p.date >= ini && p.peso > 0);
        return pts.length ? { ex, nome:(typeof nomeDoEx==='function' ? nomeDoEx(ex) : ex), pts } : null;
      }).filter(Boolean).sort((a,b)=>b.pts.length - a.pts.length);
      if(evo.length){
        precisa(30);
        fonte(9.5, 'bold'); cor(C.ink); txt('Evolução de carga por exercício', M, y + 4); y += 7;
        tabela([{t:'Exercício', w:62}, {t:'Sessões', w:16, dir:1}, {t:'Primeira', w:20, dir:1}, {t:'Última', w:20, dir:1}, {t:'Melhor', w:20, dir:1}, {t:'Variação', w:20, dir:1}],
          evo.slice(0, 15).map(e=>{ const a = e.pts[0].peso, b = e.pts[e.pts.length-1].peso, m = Math.max(...e.pts.map(p=>p.peso)); const pct = a > 0 ? Math.round((b - a)/a*100) : 0;
            return [e.nome, e.pts.length, _fmtN(a,1) + ' kg', _fmtN(b,1) + ' kg', _fmtN(m,1) + ' kg', (pct > 0 ? '+' : '') + pct + '%']; }));
        const graf = evo.filter(e=>e.pts.length >= 2).slice(0, 4);
        for(let i = 0; i < graf.length; i += 2){
          const hh = 30; precisa(hh + 18); const w2 = (W - 6)/2; const yy = y;
          [graf[i], graf[i+1]].forEach((e, j)=>{ if(!e) return;
            linhaGraf(e.pts.map(p=>({t:p.date, v:p.peso})), { titulo:e.nome, sub:'carga máx. (kg)', cor:C.lift, h:hh, w:w2, x:M + j*(w2 + 6), y:yy, pequeno:true }); });
          y = yy + hh + 17;
        }
      }
    } else nota('Nenhum treino de musculação neste período.');
  }

  // ----- corrida -----
  if(opt.run){
    secao('Corrida', C.run);
    const km = corr.reduce((s,x)=>s+(+x.distance||0), 0), min = corr.reduce((s,x)=>s+(+x.duration||0), 0);
    const comPace = corr.filter(x=>+x.distance >= 1 && +x.duration > 0);
    const melhor = comPace.filter(x=>+x.distance >= 3).map(x=>x.duration/x.distance).sort((a,b)=>a-b)[0];
    tiles([
      { v:_fmtN(corr.length), l:'corridas' },
      { v:_fmtN(km, 1) + ' km', l:'percorridos' },
      { v:_fmtHoras(min), l:'correndo' },
      { v:melhor ? fmtPaceMin(melhor) : '-', l:'melhor ritmo (3 km+)' }
    ], C.run);
    if(corr.length){
      barras(porBalde(corr, x=>+x.distance||0), { titulo:`Quilômetros por ${mensal?'mês':'semana'}`, cor:C.run, h:36, fmt:v=>_fmtN(v, 1) });
      if(comPace.length >= 2) linhaGraf(comPace.map(x=>({ t:x.at, v:x.duration/x.distance })), { titulo:'Ritmo médio por corrida', sub:'min/km (mais alto no gráfico = mais rápido)', cor:C.run, h:36, inverter:true, fmt:v=>fmtPaceMin(v).replace('/km','') });
      const longas = porBalde(corr, x=>0).map((b, i)=>({ rot:b.rot, v:Math.max(0, ...corr.filter(x=>x.at>=baldes[i].a && x.at<baldes[i].b).map(x=>+x.distance||0)) }));
      if(longas.some(b=>b.v > 0)) barras(longas, { titulo:`Maior corrida de cada ${mensal?'mês':'semana'}`, sub:'km', cor:[56,152,180], h:30, fmt:v=>_fmtN(v, 1) });
    } else nota('Nenhuma corrida registrada neste período.');
    const recs = (state.corridaStats && state.corridaStats.recordes) || {};
    const RD = (typeof RUN_REC_D !== 'undefined') ? RUN_REC_D : [];
    const linhasRec = RD.filter(d=>recs[d.k]).map(d=>{ const r = recs[d.k]; return [d.nome, rFmtMin(r.min), fmtPaceMin(r.min/(r.km||d.km)), _dataBR(r.at, true), r.prova ? 'prova' : 'treino']; });
    if(linhasRec.length){ precisa(24); fonte(9.5, 'bold'); cor(C.ink); txt('Recordes pessoais (todos os tempos)', M, y + 4); y += 7;
      tabela([{t:'Distância', w:30}, {t:'Tempo', w:28, dir:1}, {t:'Ritmo', w:28, dir:1}, {t:'Data', w:26, dir:1}, {t:'Onde', w:24, dir:1}], linhasRec); }
    const provas = corr.filter(x=>x.isRace);
    if(provas.length){ precisa(20); fonte(9.5, 'bold'); cor(C.ink); txt('Provas no período', M, y + 4); y += 7;
      tabela([{t:'Data', w:24}, {t:'Prova', w:60}, {t:'Distância', w:22, dir:1}, {t:'Tempo', w:24, dir:1}, {t:'Ritmo', w:24, dir:1}],
        provas.map(p=>[_dataBR(p.at, true), p.name || 'Prova', _fmtN(p.distance, 2) + ' km', rFmtMin(p.duration), +p.distance > 0 ? fmtPaceMin(p.duration/p.distance) : '-'])); }
    const outras = R.filter(x=>!_ehCorr(x));
    if(outras.length){ const cam = outras.filter(x=>x.activity==='caminhada'), bk = outras.filter(x=>x.activity==='bike');
      nota(`Também no período: ${cam.length} caminhada(s) (${_fmtN(cam.reduce((s,x)=>s+(+x.distance||0),0),1)} km) e ${bk.length} pedal(is) de bike (${_fmtN(bk.reduce((s,x)=>s+(+x.distance||0),0),1)} km).`); }
  }

  // ----- peso corporal -----
  const pesos = (state.weights||[]).filter(w=>w.weight > 0 && w.date >= ini).sort((a,b)=>a.date-b.date);
  if(pesos.length >= 2){
    secao('Peso corporal', C.peso);
    linhaGraf(pesos.map(w=>({ t:w.date, v:+w.weight })), { titulo:'Peso registrado', sub:`${_fmtN(pesos[0].weight,1)} kg -> ${_fmtN(pesos[pesos.length-1].weight,1)} kg`, cor:C.peso, h:34 });
  }

  // ----- conquistas -----
  const trof = Object.entries(state.trophyDates||{}).filter(([,t])=>t >= ini).sort((a,b)=>b[1]-a[1]);
  if(trof.length){
    secao('Conquistas no período', C.acc);
    tabela([{t:'Conquista', w:80}, {t:'Descrição', w:76}, {t:'Data', w:24, dir:1}], trof.map(([id, t])=>{ const T0 = (TROPHIES||[]).find(x=>x.id===id) || {}; return [T0.name || id, T0.desc || '', _dataBR(t, true)]; }));
  }

  // ----- sessões -----
  if(opt.sess){
    const lista = [...(opt.lift ? L : []), ...(opt.run ? R : [])].sort((a,b)=>b.at-a.at);
    if(lista.length){
      secao('Todas as sessões', C.ink);
      const MAX = 600;
      tabela([{t:'Data', w:20}, {t:'Tipo', w:22}, {t:'Treino', w:70}, {t:'Duração', w:20, dir:1}, {t:'Detalhe', w:40, dir:1}],
        lista.slice(0, MAX).map(x=>{
          const isRun = x.module === 'run' || D.run.includes(x);
          const tipo = isRun ? (x.activity==='caminhada' ? 'Caminhada' : x.activity==='bike' ? 'Bike' : (x.isRace ? 'Prova' : 'Corrida')) : 'Musculação';
          const det = isRun ? (+x.distance > 0 ? `${_fmtN(x.distance, 2)} km · ${fmtPaceMin(x.duration/x.distance)}` : '') : ((x.exercisesDone||[]).length ? `${x.exercisesDone.length} exercícios` : '');
          return [_dataBR(x.at, true), tipo, x.name || '', x.duration ? _fmtHoras(x.duration) : '-', det];
        }));
      if(lista.length > MAX) nota(`Mostrando as ${MAX} sessões mais recentes de ${lista.length}.`);
    }
  }

  nota('Relatório gerado pelo MetaTreino a partir dos treinos registrados no app. É uma ferramenta de apoio e não substitui avaliação médica nem acompanhamento profissional.');

  // rodapé
  const n = doc.getNumberOfPages();
  for(let i = 1; i <= n; i++){
    doc.setPage(i); fonte(7); cor(C.dim);
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.2); doc.line(M, PH - 11, PW - M, PH - 11);
    txt(`MetaTreino · ${nomeAluno}`, M, PH - 7); txt(`Página ${i} de ${n}`, PW - M, PH - 7, {align:'right'});
  }
  const nome = `metatreino-relatorio-${chaveDia(new Date())}.pdf`;
  return { doc, nome };
}

Object.assign(window, { arqArquivar, arqCarregar, arqApagarTudo, arqRestaurar, arqDados, arqAbrirHistorico, arqSeusDados, arqRelatorio, arqGerarPDF, arqCarregarEvo, arqNotaRetencao,
  pdfBaixar, pdfCompartilhar, admTamanhos, arqTamanhoDoc });

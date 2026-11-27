
// =====================================================================
// 42. Beta 41 — Conquistas remodeladas e encerramento do desafio mensal (só na aba Conquistas)
// =====================================================================
// O QUE MUDA
//  • Desbloquear algo NÃO abre mais janela por cima de nada (nem no início, nem no fim do treino, nem
//    em outra aba). O que foi conquistado entra numa fila salva na conta (state.conqPend, sincronizada)
//    e é apresentado — com animação — quando o aluno abre a aba Conquistas. Depois de apresentado, sai da
//    fila e entra em state.conqVistas: não se repete, nem em outro aparelho.
//  • O fim do mês grava um resumo do desafio mensal (tema, meta, progresso, resultado) em
//    state.desafiosEncerrados (histórico permanente). O aviso "Desafio mensal encerrado!" fica pendente
//    até o aluno entrar em Conquistas; aí aparece lá dentro, uma vez, e fica registrado como visto.
//  • Critérios, ids, datas, contagens e medalhas: tudo igual. Nenhuma conquista é apagada.
//  • A Conquista Especial (configurada pelo administrador, com momento próprio de revelação) mantém o
//    comportamento dela.
// Os pontos de entrada (cartão do início, bloco "Sua coleção" em Desafios) mostram só um selo PARADO
// "Novidade" quando há algo pendente — nada animado fora da aba.

const CQ_MAX_VISTAS = 400, CQ_MAX_NOVOS = 5;
function cqEstado(){
  if(!state) return null;
  if(!Array.isArray(state.conqPend)) state.conqPend = [];
  if(!Array.isArray(state.conqVistas)) state.conqVistas = [];
  if(!Array.isArray(state.desafiosEncerrados)) state.desafiosEncerrados = [];
  return state;
}
// leitura sem tocar no estado (criar campos vazios aqui faria o app regravar a conta na nuvem sem motivo)
// Beta 45: modelo simples e sem item "preso".
//  • "Nova" = ainda não vista. Vê-se de dois jeitos: no carrossel do fim do registro (cada cartão que aparece
//    conta como visto) ou abrindo a aba Conquistas (todas as novas contam como vistas ao abrir).
//  • Enquanto a aba fica aberta — inclusive indo ao detalhe e voltando — a seção "Novas conquistas" continua
//    a mesma (guardada só na memória desta visita). Fechou a aba, ela some. Nada depende de tocar em cada uma.
function cqPendentes(){ if(!state) return { itens:[], meses:[] };
  return { itens: (state.conqPend||[]).slice(), meses: (state.desafiosEncerrados||[]).filter(d=>!d.visto) }; }
function cqTemNovidade(){ const p = cqPendentes(); return p.itens.length + p.meses.length; }
// marca como vistas (sai da fila) — usado pelo carrossel do fim do registro
function cqMarcaVista(pred){
  const s = cqEstado(); if(!s) return false;
  const sai = s.conqPend.filter(pred); if(!sai.length) return false;
  s.conqVistas = s.conqVistas.concat(sai.map(p=>p.k)).slice(-CQ_MAX_VISTAS);
  s.conqPend = s.conqPend.filter(p=>!sai.includes(p));
  try{ saveData(); }catch(e){} cqIndicadores(); return true;
}
let _cqSessao = null;   // novas mostradas nesta visita à aba (memória; recomeça a cada abertura nova)

// ---------- a fila de celebrações vira a fila de "a apresentar" ----------
window.showAwards = function(){
  try{
    const s = cqEstado(); if(!s || !awardQueue.length){ awardQueue = []; return; }
    const mes = monthKey();
    awardQueue.forEach(a=>{
      const k = String(a.id) + (a.medalha ? '@' + mes : '');
      if(s.conqVistas.includes(k) || s.conqPend.some(p=>p.k===k)) return;
      const tid = /^t_/.test(a.id) ? a.id.slice(2) : null;
      const kind = a.secreto ? 'secreto' : a.medalha ? 'medalha' : a.marco ? 'marco' : tid ? 'trofeu' : 'evento';
      const emo = (!tid && typeof a.emo === 'string' && a.emo.length < 1200) ? a.emo : '';
      s.conqPend.push({ k, tid, kind, emo, tipo:a.tipo||'', nome:a.nome||'', desc:a.desc||'', at:Date.now() });
    });
    if(s.conqPend.length > 60) s.conqPend = s.conqPend.slice(-60);
    awardQueue = []; awardIdx = 0;
    // guarda no aparelho agora; a nuvem recebe junto com a próxima gravação normal (o desbloqueio em si já
    // gravou). Uma gravação extra aqui, 1 s depois, competia com a mudança vinda do outro aparelho.
    try{ salvarLocal(); }catch(e){}
    cqIndicadores();
  }catch(e){ awardQueue = []; }
};
// a janela de "o mês fechou" ao abrir o app sai: o resumo agora aparece dentro de Conquistas
window.showMesFechado = function(){ try{ if(state.ui && state.ui.mesFechado) state.ui.mesFechado.visto = true; }catch(e){} return false; };

// ---------- resumo do desafio mensal ----------
// durante o mês, guarda o progresso de cada desafio (o cálculo depois que o mês vira já é do mês novo)
function cqFotoDoMes(){
  try{
    if(!state || !state.monthly) return;
    const grupos = desafiosDoMes();
    const snap = {
      total: grupos.length * NIVEIS_DESAFIO.length,
      grupos: grupos.map(g=>{ let v = 0; try{ v = +g.info.val() || 0; }catch(e){}
        return { nome:g.info.nome, emo:g.info.emo||'', val:Math.round(v*10)/10, feitos:g.niveis.filter(c=>state.monthly.done.includes(c.id)).length, alvoMax:(g.niveis[g.niveis.length-1]||{}).alvo||0 }; })
    };
    // só grava quando o progresso mudou de verdade (senão cada tela redesenhada viraria uma gravação na nuvem)
    if(JSON.stringify(state.monthly.snap||null) !== JSON.stringify(snap)) state.monthly.snap = snap;
  }catch(e){}
}
mtGancho('checkMonthly', { depois(){ cqFotoDoMes(); } });
mtGancho('renderMonthlyCard', { depois(){ cqFotoDoMes(); } });
mtGancho('ensureMonthly', { antes(){
  try{
    if(!state || !state.monthly || !state.monthly.key) return;
    const k = monthKey();
    if(state.monthly.key === k) return;                       // o mês ainda não terminou (fuso do aparelho)
    if(state.monthly.key > k) return;                         // relógio do aparelho voltou: não encerra nada
    if((state.desafiosEncerrados||[]).some(d=>d.key===state.monthly.key)) return;   // já registrado (outro aparelho)
    const s = cqEstado();
    const m = state.monthly, done = m.done || [];
    const niveis = done.filter(id=>!String(id).startsWith('selo:')).length;
    let tema = {}; try{ tema = mesTema(m.key) || {}; }catch(e){}
    s.desafiosEncerrados.push({ key:m.key, tema:{ nome:tema.nome||'Desafio do mês', emo:tema.emo||'', foco:tema.foco||'' },
      meta: SELO_MIN_NIVEIS, niveis, total:(m.snap && m.snap.total) || null, selo: done.includes('selo:'+m.key),
      grupos:(m.snap && m.snap.grupos) || [], encerradoEm: Date.now(), visto:false });
    if(s.desafiosEncerrados.length > 36) s.desafiosEncerrados = s.desafiosEncerrados.slice(-36);
    setTimeout(()=>{ try{ salvarLocal(); cqIndicadores(); }catch(e){} }, 0);
  }catch(e){}
}});
// antes de qualquer desbloqueio, garante a estrutura (contas antigas não "re-celebram" nada: a fila começa vazia)
mtGancho('unlockTrophy', { antes(){ cqEstado(); } });

// ---------- indicadores parados nos pontos de entrada ----------
// Beta 45: um aviso só. O ponto fica na aba Desafios (parte 48); aqui, dentro de Desafios, o cartão
// "Conquistas" ganha só o texto "· N novas" — sem outro selo no Início nem em "Sua coleção".
function cqIndicadores(){
  try{
    const n = cqTemNovidade();
    document.querySelectorAll('#home-trofeus .cq-badge, .chal-tile .cq-badge').forEach(b=>b.remove());
    document.querySelectorAll('.chal-tile[onclick^="openTrophies"]').forEach(el=>{
      let t = el.querySelector('.cq-novas-txt');
      if(!n){ if(t) t.remove(); return; }
      if(!t){ t = document.createElement('span'); t.className = 'cq-novas-txt'; el.appendChild(t); }
      t.textContent = n === 1 ? '1 nova' : n + ' novas';
    });
  }catch(e){}
}
mtGancho('goTab', { depois(){ cqIndicadores(); } });
mtGancho('renderChallenges', { depois(){ cqIndicadores(); } });

// ---------- a aba Conquistas ----------
const CQ_CAT = { geral:'Gerais', streak:'Consistência', lift:'Musculação', run:'Corrida', walk:'Caminhada', bike:'Bike', body:'Corpo' };
const CQ_NV = { comum:'Comum', rara:'Rara', especial:'Especial' };
const CQ_CADEADO = '<svg class="cq-cad" viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2.2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>';
let _cqFiltro = 'todas', _cqRecentes = new Set();
function cqStatus(t){
  if(state.trophies.includes(t.id)) return 'ok';
  const pr = trophyProgress(t.id);
  return (pr && pr[0] > 0) ? 'and' : 'blq';
}
function cqTile(t, i){
  const st = cqStatus(t), nv = medalNivel(t);
  if(st !== 'ok' && t.secret){
    return `<div class="cq-tile st-blq nv-especial cq-oculta" style="--i:${i}"><div class="cq-med">${trophyIcoLocked()}</div><div class="cq-nome">Conquista secreta</div><div class="cq-desc">Descubra treinando</div></div>`;
  }
  let extra = '';
  if(st === 'ok'){
    const q = (state.trophyDates||{})[t.id];
    extra = `<div class="cq-data">${q ? new Date(q).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).replace(/\./g,'') : 'Desbloqueada'}</div>`;
  } else {
    const pr = trophyProgress(t.id);
    if(pr && pr[1]){
      const pct = Math.min(99, Math.round(pr[0]/pr[1]*100));
      extra = `<div class="cq-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div><div class="cq-prog">${Math.floor(pr[0])}/${pr[1]}</div>`;
    }
  }
  const rec = _cqRecentes.has(t.id) ? ' cq-recente' : '';
  const clique = st === 'ok' ? ` role="button" tabindex="0" onclick="openTrophyDetail('${t.id}')" onkeydown="if(event.key==='Enter')openTrophyDetail('${t.id}')"` : '';
  return `<div class="cq-tile st-${st} nv-${nv}${rec}" style="--i:${i}"${clique}>
    ${nv!=='comum'?`<span class="cq-rar">${CQ_NV[nv]}</span>`:''}${rec?'<span class="cq-novo-tag">Nova</span>':''}
    <div class="cq-med">${trophyIco(t, st!=='ok')}${st==='blq'?CQ_CADEADO:''}</div>
    <div class="cq-nome">${mtEsc(t.name)}</div><div class="cq-desc">${mtEsc(t.desc)}</div>${extra}</div>`;
}
function cqResumoMes(d, animar){
  const ok = !!d.selo;
  const pct = Math.min(100, Math.round(Math.min(d.niveis, d.meta) / d.meta * 100));
  const mes = (typeof monthName==='function' ? monthName(d.key) : d.key);
  const mesAtual = (typeof monthName==='function' ? monthName(monthKey()).split('/')[0] : '');
  const msg = ok
    ? `Você fechou o desafio de ${mtEsc(mes.split('/')[0])}. O selo ${mtEsc(d.tema.nome)} fica na sua coleção para sempre.`
    : (d.niveis > 0 ? `Você fechou ${d.niveis} ${d.niveis===1?'nível':'níveis'} — cada treino contou e ficou registrado.` : 'Este mês não deu, e tudo bem: o que importa é seguir.')
      + ` Os desafios de ${mtEsc(mesAtual)} já começaram — é uma nova chance.`;
  const grupos = (d.grupos||[]).filter(g=>g.feitos>0).slice(0,4);
  return `<section class="cq-mes ${ok?'ok':'nao'}${animar?' cq-anim':''}" aria-label="Desafio mensal encerrado">
    ${ok && animar ? '<span class="cq-festa" aria-hidden="true">' + Array.from({length:10},(_,i)=>`<i style="--a:${i*36}deg;--d:${(i%4)*50}ms"></i>`).join('') + '</span>' : ''}
    <div class="cq-mes-tag">Desafio mensal encerrado!</div>
    <div class="cq-mes-top"><div class="cq-mes-emb">${typeof medalSvg==='function' ? `<span class="tbadge ${ok?'':'dim'} nv-${ok?'especial':'comum'}">${medalSvg(ok?'crown':'medal','', '', ok?'especial':'comum')}</span>` : ''}</div>
      <div style="min-width:0"><h4>${mtEsc(d.tema.emo||'')} ${mtEsc(d.tema.nome)}</h4><div class="cq-mes-sub">${mtEsc(mes)}</div></div></div>
    <dl class="cq-mes-dl">
      <div><dt>Meta</dt><dd>Fechar ${d.meta} níveis dos desafios do mês e ganhar o selo</dd></div>
      <div><dt>Progresso</dt><dd>${Math.min(d.niveis,d.meta)} de ${d.meta} níveis${d.total?` <small>(${d.niveis} de ${d.total} no total)</small>`:''}<div class="cq-barra lg"><i style="width:${pct}%"></i></div></dd></div>
      <div><dt>Resultado</dt><dd class="cq-res">${ok?'Concluído — selo conquistado':'Não concluído'}</dd></div>
    </dl>
    ${grupos.length?`<div class="cq-mes-g">${grupos.map(g=>`<span>${mtEsc(g.emo)} ${mtEsc(g.nome)} · ${g.feitos}/3</span>`).join('')}</div>`:''}
    <p class="cq-mes-msg">${msg}</p>
    <button class="btn btn-ghost btn-block" onclick="closeModal();openMedals()">Ver medalhas e selos</button>
  </section>`;
}
function cqNovoItem(p, i){
  const t = p.tid ? TROPHIES.find(x=>x.id===p.tid) : null;
  const nv = t ? medalNivel(t) : (p.kind==='medalha' || p.kind==='marco' ? 'rara' : p.kind==='secreto' ? 'especial' : 'comum');
  const ico = t ? trophyIco(t) : (p.emo && /<svg|<span/.test(p.emo) ? p.emo : `<span class="cq-emo">${mtEsc(p.emo||'')}</span>`);
  const tipo = { trofeu:'Conquista desbloqueada', secreto:'Segredo revelado', medalha:'Medalha do mês', marco:'Marco alcançado', evento:'Desafio concluído' }[p.kind] || p.tipo;
  return `<div class="cq-novo nv-${nv}" style="--i:${i}" data-k="${mtEsc(p.k)}" role="button" tabindex="0" onclick="cqVerNova('${mtJsStr(p.k)}')" onkeydown="if(event.key==='Enter')cqVerNova('${mtJsStr(p.k)}')">
    <span class="cq-novo-luz" aria-hidden="true"></span>
    <div class="cq-med">${ico}</div>
    <div class="cq-novo-txt"><small>${mtEsc(tipo)}${nv!=='comum'?' · '+CQ_NV[nv]:''}</small><b>${mtEsc(t ? t.name : p.nome)}</b><span>${mtEsc(t ? t.desc : p.desc)}</span></div></div>`;
}
function cqGrade(){
  const cats = ['streak','lift','cali','hibrido','run','walk','bike','dupla','body','geral'];   // Beta 63: calistenia, híbrido e treinando juntos
  const filtro = t=>{ const st = cqStatus(t); return _cqFiltro==='todas' || (_cqFiltro==='ok'&&st==='ok') || (_cqFiltro==='and'&&st==='and') || (_cqFiltro==='blq'&&st==='blq'); };
  let i = 0, h = '';
  cats.forEach(c=>{
    const itens = ordenarTrofeus(TROPHIES.filter(t=>t.cat===c && !t.secret)).filter(filtro);
    if(!itens.length) return;
    const tot = TROPHIES.filter(t=>t.cat===c && !t.secret), u = tot.filter(t=>state.trophies.includes(t.id)).length;
    h += `<div class="cq-grupo"><div class="cq-grupo-t">${CQ_CAT[c]}<span>${u}/${tot.length}</span></div><div class="cq-grade">${itens.map(t=>cqTile(t, Math.min(i++, 14))).join('')}</div></div>`;
  });
  const sec = TROPHIES.filter(t=>t.secret), rev = ordenarTrofeus(sec.filter(t=>state.trophies.includes(t.id)));
  if(_cqFiltro==='todas' || _cqFiltro==='ok' || _cqFiltro==='blq'){
    const mostrar = _cqFiltro==='blq' ? [] : rev;
    const falta = sec.length - rev.length;
    h += `<div class="cq-grupo"><div class="cq-grupo-t">Secretas<span>${rev.length}/${sec.length}</span></div>
      ${mostrar.length?`<div class="cq-grade">${mostrar.map(t=>cqTile(t, Math.min(i++,14))).join('')}</div>`:''}
      ${falta && _cqFiltro!=='ok'?`<div class="cq-segredo">${CQ_CADEADO}<span>Ainda há <b>${falta}</b> ${falta===1?'segredo':'segredos'} por descobrir — eles aparecem sozinhos quando você os merece.</span></div>`:''}</div>`;
  }
  return h || `<div class="cq-vazio">Nada por aqui neste filtro.</div>`;
}
function cqFiltrar(f){
  _cqFiltro = f;
  const g = document.getElementById('cq-grade-box'); if(!g) return;
  document.querySelectorAll('#cq-filtros button').forEach(b=>{ const on = b.dataset.f===f; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  g.classList.remove('cq-entra'); g.innerHTML = cqGrade(); void g.offsetWidth; g.classList.add('cq-entra');
}
window.openTrophies = function(){
  const back = document.getElementById('modal-back'); back.classList.remove('award-dark');
  const s = { desafiosEncerrados: (state.desafiosEncerrados||[]) };   // leitura; a gravação abaixo usa cqEstado()
  const semAnim = !!window.__cqSemAnim; window.__cqSemAnim = false;
  const pend = cqPendentes();
  // Beta 55: cada conquista nova fica em "Novas" até o aluno tocar NELA (cqVerNova). Abrir a aba não marca
  // nada como visto, e tocar em uma não marca as outras. A fila (state.conqPend) é da conta: vale em todos os aparelhos.
  _cqSessao = pend.itens.slice();
  const novas = _cqSessao;
  _cqRecentes = new Set(novas.map(p=>p.tid).filter(Boolean));
  const animar = !semAnim && (pend.itens.some(p=>!_cqJaAnimadas.has(p.k)) || pend.meses.length > 0);
  pend.itens.forEach(p=>_cqJaAnimadas.add(p.k));
  const tot = TROPHIES.length, tenho = state.trophies.length;
  const porNv = { comum:[0,0], rara:[0,0], especial:[0,0] };
  TROPHIES.forEach(t=>{ const n = medalNivel(t); porNv[n][1]++; if(state.trophies.includes(t.id)) porNv[n][0]++; });
  const pctAll = Math.round(tenho/tot*100);
  const encerrados = s.desafiosEncerrados.slice().sort((a,b)=>b.key.localeCompare(a.key));
  const antigos = encerrados.filter(d=>d.visto);
  const meses = pend.meses.slice().sort((a,b)=>b.key.localeCompare(a.key));
  const contagem = (n,l)=>`<div class="cq-cont nv-${n}"><b>${porNv[n][0]}<small>/${porNv[n][1]}</small></b><span>${l}</span></div>`;
  // Beta 58: rótulos curtos — os quatro cabem numa linha até em 320 px (antes "Desbloqueadas" e "Em andamento" quebravam)
  const filtros = [['todas','Todas'],['ok','Ganhas'],['and','Em curso'],['blq','Bloqueadas']];
  $('modal-inner').innerHTML = `<div class="cq${animar?' cq-anim':''}">
    <div class="cq-topo"><h3>Conquistas</h3><button class="cq-x" onclick="closeModal()" aria-label="Fechar">✕</button></div>
    <div class="cq-resumo"><div class="cq-anel" style="--p:${pctAll}"><b>${tenho}</b><small>de ${tot}</small></div>
      <div class="cq-conts">${contagem('comum','Comuns')}${contagem('rara','Raras')}${contagem('especial','Especiais')}</div></div>
    ${meses.map(d=>cqResumoMes(d, animar)).join('')}
    ${novas.length?`<section class="cq-novos"><div class="cq-sec-t">${novas.length===1?'Nova conquista':'Novas conquistas · '+novas.length}</div><p class="cq-novos-dica">Toque em cada uma para ver. Depois de vista, ela fica só na coleção.</p>${novas.slice().reverse().slice(0,CQ_MAX_NOVOS).map((p,i)=>cqNovoItem(p, i)).join('')}${novas.length>CQ_MAX_NOVOS?`<div class="cq-mais-novos">E mais ${novas.length-CQ_MAX_NOVOS} — destacadas com “Nova” na coleção abaixo.</div>`:''}${novas.length>1?`<button type="button" class="cq-todas-vistas" onclick="cqTodasVistas()">Marcar todas como vistas</button>`:''}</section>`:''}
    <div class="cq-filtros" id="cq-filtros" role="group" aria-label="Filtrar conquistas">${filtros.map(([f,l])=>`<button type="button" data-f="${f}" class="filter-chip ${_cqFiltro===f?'on':''}" aria-pressed="${_cqFiltro===f}" onclick="cqFiltrar('${f}')">${l}</button>`).join('')}</div>
    <div id="cq-grade-box" class="${animar?'cq-entra':''}">${cqGrade()}</div>
    ${state.specialTrophy ? `<div class="sa-card cq-eterna" role="button" tabindex="0" onclick="openSpecialTrophy()" onkeydown="if(event.key==='Enter')openSpecialTrophy()">
      <div class="cq-eterna-emo">${mtEsc(state.specialTrophy.emo||'💍')}</div><small>Conquista eterna</small><b>${mtEsc(state.specialTrophy.titulo||'')}</b>
      <span>${mtEsc(state.specialTrophy.descricao||'')}</span><em>Toque para ver sua conquista · a história completa é opcional</em></div>` : ''}
    <div class="cq-links"><button class="btn btn-ghost" onclick="closeModal();openMonthly()">Desafios do mês</button><button class="btn btn-ghost" onclick="closeModal();openMedals()">Medalhas e selos</button></div>
    ${antigos.length?`<details class="cq-hist"><summary>Desafios mensais anteriores (${antigos.length})</summary>${antigos.map(d=>`<div class="cq-hist-l ${d.selo?'ok':''}"><span>${mtEsc(d.tema.emo||'')} ${mtEsc(d.tema.nome)} · ${mtEsc(typeof monthName==='function'?monthName(d.key):d.key)}</span><b>${d.selo?'Concluído':'Não concluído'} · ${Math.min(d.niveis,d.meta)}/${d.meta}</b></div>`).join('')}</details>`:''}
    <button class="btn btn-outline btn-block hl-primary" style="margin-top:14px" onclick="shareTrophiesImage()">Compartilhar minhas conquistas</button>
    <button class="btn btn-primary btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button></div>`;
  back.classList.add('on');
  // o resumo do desafio mensal encerrado é apresentado uma vez (as conquistas novas, não: ver cqVerNova)
  if(meses.length){
    const s = cqEstado();
    const agora = Date.now();
    s.desafiosEncerrados.forEach(d=>{ if(!d.visto && meses.some(m=>m.key===d.key)){ d.visto = true; d.vistoEm = agora; } });
    saveData();
    cqIndicadores();
  }
};
window.openTrophiesKeepScroll = function(){
  const sc = window._trophyScroll || 0; window.__cqSemAnim = true; openTrophies();
  try{ document.getElementById('modal-inner').scrollTop = sc; }catch(e){}
};
// o cartão do início mostra as três medalhas mais recentes (sem animação)
function cqCartaoInicio(){
  try{
    const card = document.getElementById('home-trofeus'); if(!card) return;
    const datas = state.trophyDates || {};
    const rec = TROPHIES.filter(t=>state.trophies.includes(t.id)).sort((a,b)=>(datas[b.id]||0)-(datas[a.id]||0)).slice(0,3);
    let m = card.querySelector('.cq-mini');
    if(!rec.length){ if(m) m.remove(); return; }
    const html = rec.map(t=>trophyIco(t)).join('');
    if(!m){ m = document.createElement('div'); m.className = 'cq-mini'; m.setAttribute('aria-hidden','true'); const ch = card.querySelector('.card-chev'); (ch||card).before(m); }
    if(m.dataset.k !== rec.map(t=>t.id).join()){ m.innerHTML = html; m.dataset.k = rec.map(t=>t.id).join(); }
  }catch(e){}
}
mtGancho('goTab', { depois(t){ if((t||'home')==='home') cqCartaoInicio(); } });

// Beta 55: ver UMA conquista nova — só ela sai das "novas"
const _cqJaAnimadas = new Set();
function cqVerNova(k){
  const p = ((state && state.conqPend) || []).find(x=>x.k === k);
  cqMarcaVista(x=>x.k === k);
  if(p && p.tid && TROPHIES.some(t=>t.id === p.tid)){ try{ window._trophyScroll = ($('modal-inner')||{}).scrollTop || 0; }catch(e){} openTrophyDetail(p.tid); return; }
  // RC 5: medalha do mês, marco e desafio concluído também abrem a sua tela (antes só sumiam da lista ao tocar)
  if(p){ cqVerItem(p); return; }
  const c = document.querySelector(`.cq-novo[data-k="${CSS.escape(k)}"]`);
  if(c){ c.classList.add('cq-saindo'); setTimeout(()=>{ try{ window.__cqSemAnim = true; const sc = $('modal-inner').scrollTop; openTrophies(); $('modal-inner').scrollTop = sc; }catch(e){} }, 220); }
}
function cqVerItem(p){
  try{ window._trophyScroll = ($('modal-inner')||{}).scrollTop || 0; }catch(e){}
  const nv = p.kind==='medalha' || p.kind==='marco' ? 'rara' : p.kind==='secreto' ? 'especial' : 'comum';
  const tipo = { secreto:'Segredo revelado', medalha:'Medalha do mês', marco:'Marco alcançado', evento:'Desafio concluído' }[p.kind] || p.tipo || 'Conquista';
  const ico = p.emo && /<svg|<span|<img/.test(p.emo) ? p.emo : `<span class="cq-emo">${mtEsc(p.emo||'🏅')}</span>`;
  const quando = p.at ? new Date(p.at).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' }) : '';
  const ir = p.kind==='evento' ? `<button class="btn btn-primary btn-block" onclick="closeModal();goTab('challenges')">Ver desafios</button>`
    : `<button class="btn btn-primary btn-block" onclick="closeModal();openMedals()">Ver medalhas e selos</button>`;
  $('modal-inner').innerHTML = `<div class="cq-item nv-${nv}">
    <div style="display:flex;justify-content:flex-end;margin:-4px -4px 0 0"><button class="cq-x" onclick="cqVoltarLista()" aria-label="Voltar às conquistas">✕</button></div>
    <div class="cq-item-med tr-medal"><span class="tr-glow" aria-hidden="true"></span><span class="tr-ring" aria-hidden="true"></span><div class="tr-ico">${ico}</div></div>
    <div class="cq-item-tipo">${mtEsc(tipo)}${nv!=='comum' ? ' · ' + CQ_NV[nv] : ''}</div>
    <h3 class="tr-nome">${mtEsc(p.nome || '')}</h3>
    ${p.desc ? `<p class="cq-item-desc">${mtEsc(p.desc)}</p>` : ''}
    ${quando ? `<div class="cq-item-data">Conquistada em ${quando}</div>` : ''}
    <div style="display:grid;gap:8px;margin-top:16px">${ir}<button class="btn btn-ghost btn-block" onclick="cqVoltarLista()">← Voltar às conquistas</button></div></div>`;
  $('modal-back').classList.add('on');
}
function cqVoltarLista(){ window.__cqSemAnim = true; openTrophies(); try{ $('modal-inner').scrollTop = window._trophyScroll || 0; }catch(e){} }
function cqTodasVistas(){ cqMarcaVista(()=>true); window.__cqSemAnim = true; const sc = $('modal-inner').scrollTop; openTrophies(); try{ $('modal-inner').scrollTop = sc; }catch(e){} }
// tocar na medalha "Nova" da coleção também conta como vista (só aquela)
mtGancho('openTrophyDetail', { antes(id){ try{ if(((state && state.conqPend)||[]).some(x=>x.tid === id)) cqMarcaVista(x=>x.tid === id); }catch(e){} } });
Object.assign(window, { cqVerNova, cqVerItem, cqVoltarLista, cqTodasVistas, cqFiltrar, cqTemNovidade, cqPendentes, cqIndicadores, cqFotoDoMes });

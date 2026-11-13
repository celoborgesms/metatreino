
// ---------- 10. PAINEL ADMINISTRATIVO ----------
// Indicadores calculados a partir dos dados reais que o painel já carrega (usuarios.estadoApp).
function _admResumoAluno(u){
  const st = u && u.estadoApp; if(!st || !st.modules) return null;
  const h = [...((st.modules.lift&&st.modules.lift.history)||[]), ...((st.modules.run&&st.modules.run.history)||[])].filter(x=>x&&x.at);
  const ultimo = h.reduce((m,x)=>Math.max(m,x.at),0);
  return { ultimo, sem7: h.filter(x=>x.at>=Date.now()-7*DIA_MS).length, eventos: st.eventos||{} };
}
function renderAdminKpis(){
  const anchor = document.querySelector('#scr-admin .stat-grid'); if(!anchor) return;
  let box = $('adm-kpis'); if(!box){ box = document.createElement('div'); box.id = 'adm-kpis'; anchor.after(box); }
  const resumos = Object.values(usuariosCache||{}).map(_admResumoAluno).filter(Boolean);
  const ativos7 = resumos.filter(r=>r.ultimo>=Date.now()-7*DIA_MS).length;
  const parados = resumos.filter(r=>r.ultimo && r.ultimo<Date.now()-14*DIA_MS).length;
  const treinos7 = resumos.reduce((s,r)=>s+r.sem7,0);
  const e = eventoPrincipal();
  const noDesafio = e ? resumos.filter(r=>r.eventos[e.key]).length : 0;
  box.innerHTML = `<div class="section-lbl" style="margin:16px 0 0">Engajamento (dados reais)</div><div class="adm-kpis">
    <div class="adm-kpi"><b>${ativos7}</b><small>treinaram nos últimos 7 dias</small></div>
    <div class="adm-kpi"><b>${treinos7}</b><small>sessões registradas em 7 dias</small></div>
    <div class="adm-kpi"><b>${parados}</b><small>sem treinar há 14+ dias</small></div>
  </div>${e?`<div class="mt-muted" style="margin:6px 2px 0">${noDesafio} ${noDesafio===1?'aluno participa':'alunos participam'} de <b>${mtEsc(e.nome)}</b>.</div>`:''}`;
}
function renderAdminTools(){
  const rows = [...document.querySelectorAll('#scr-admin .list-row')];
  const ref = rows.find(r=>/Feedback|Mensagens dos alunos/.test(r.textContent)); if(!ref) return;
  if(!$('adm-ev-row')){
    const a = document.createElement('div'); a.className = 'list-row'; a.id = 'adm-ev-row'; a.onclick = openAdminEventos;
    a.innerHTML = '🎖️ <span>Desafios temáticos</span><span style="margin-left:auto;font-size:11px;color:var(--text-dim)">criar e acompanhar</span>';
    ref.after(a);
  }
  if(!$('adm-perm-row')){
    const b = document.createElement('div'); b.className = 'list-row'; b.id = 'adm-perm-row'; b.onclick = openAdminPermissoes;
    b.innerHTML = '🛡️ <span>Administradores e permissões</span>';
    $('adm-ev-row').after(b);
  }
  $('adm-perm-row').classList.toggle('hidden', !mtPrincipal());
}
mtGancho('goAdmin', { depois(){
  try{ renderAdminTools(); renderAdminKpis(); }catch(e){ console.log('admin extras:', e); }
}});
// --- desafios temáticos (admin) ---
async function openAdminEventos(){
  await loadEventosCustom();
  const Y = new Date().getFullYear(); const agora = Date.now();
  const lista = [...eventosDoAno(Y), ...eventosDoAno(Y+1)].filter(e=>e.fim>agora-30*DIA_MS).sort((a,b)=>a.ini-b.ini).slice(0,10);
  const custom = evCustom.map(_evDeCustom).sort((a,b)=>b.ini-a.ini);
  const subst = new Set(custom.map(c=>c.substitui).filter(Boolean));
  const linha = (e, extra)=>{ const ativo = agora>=e.ini && agora<e.fim; return `<div class="ev-list-item">${eventoMedalha(e,38)}<div style="flex:1;min-width:0"><b style="font-size:13.5px">${mtEsc(e.nome)}</b><div class="mt-muted" style="font-size:11.5px">${mtFmtData(e.ini)} – ${mtFmtData(e.fim-1)}${ativo?' · <span style="color:var(--accent)">em andamento</span>':''}${extra||''}</div></div>${_admEvBotoes(e)}</div>`; };
  const princ = mtAdmin();
  $('modal-inner').innerHTML = `<h3>Desafios temáticos</h3>
    <p class="mt-muted" style="margin:0 0 10px">O calendário anual é automático (inclusive Carnaval e Páscoa, que mudam de data). ${princ?'Você pode personalizar qualquer desafio, desativá-lo ou criar um novo — sem mexer no código.':'Somente administradores podem criar ou editar desafios.'}</p>
    ${princ?`<button class="btn btn-primary btn-block" onclick="openAdminEventoForm()">➕ Criar desafio</button>`:''}
    ${custom.length?`<div class="mt-sec">Criados ou personalizados</div><div class="card" style="padding:6px 12px">${custom.map(e=>linha(e, e.ativo?'':' · <b>desativado</b>')).join('')}</div>`:''}
    <div class="mt-sec">Calendário automático</div><div class="card" style="padding:6px 12px">${lista.map(e=>subst.has(e.key)?'':linha(e)).join('')}</div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function _admEvBotoes(e){
  const b = [`<button class="btn btn-ghost" style="padding:6px 9px;font-size:11.5px" onclick="openAdminEventoPart('${e.key}')">Participação</button>`];
  if(mtAdmin()) b.push(`<button class="btn btn-ghost" style="padding:6px 9px;font-size:11.5px" onclick="openAdminEventoForm('${e.key}')">${e.custom?'Editar':'Personalizar'}</button>`);
  return `<div style="display:flex;flex-direction:column;gap:4px">${b.join('')}</div>`;
}
function openAdminEventoForm(key){
  if(!mtAdmin()){ toast('🔒 Somente administradores.'); return; }
  const e = key ? eventoPorKey(key) || evCustom.map(_evDeCustom).find(x=>x.key===key) : null;
  const doc = e && e.custom ? evCustom.find(c=>'adm-'+c.id===key) : null;
  const iso = t=>{ const d = new Date(t); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  const v = doc || (e ? { nome:e.nome, descricao:e.desc, inicio:iso(e.ini), fim:iso(e.fim-1), arte:e.arte, fator:e.fator, alvoFixo:'', missoes:(e.extra||[]).map(t=>({tipo:t})), recompensa:'', ativo:true, substitui:e.key } : { nome:'', descricao:'', inicio:iso(Date.now()), fim:iso(Date.now()+13*DIA_MS), arte:'evolucao', fator:1, alvoFixo:'', missoes:[], recompensa:'', ativo:true, substitui:'' });
  const tiposM = (v.missoes||[]).map(m=>m.tipo);
  $('modal-inner').innerHTML = `<h3>${doc?'Editar desafio':e?'Personalizar desafio':'Novo desafio'}</h3>
    ${v.substitui?`<p class="mt-muted" style="margin:0">Substitui o desafio automático <b>${mtEsc(v.substitui)}</b>.</p>`:''}
    <div class="adm-form">
      <label>Nome</label><input class="input" id="ef-nome" maxlength="40" value="${mtEsc(v.nome)}">
      <label>Descrição / objetivo</label><textarea class="input" id="ef-desc" maxlength="220">${mtEsc(v.descricao||'')}</textarea>
      <div style="display:flex;gap:8px"><div style="flex:1"><label>Início</label><input class="input" type="date" id="ef-ini" value="${v.inicio}"></div><div style="flex:1"><label>Fim (inclusive)</label><input class="input" type="date" id="ef-fim" value="${v.fim}"></div></div>
      <label>Arte e cor</label><select class="input" id="ef-arte">${Object.keys(EV_ARTE).map(k=>`<option value="${k}" ${k===v.arte?'selected':''}>${k}</option>`).join('')}</select>
      <label>Intensidade da meta</label><select class="input" id="ef-fator">${[[0.8,'Leve (80% da frequência habitual)'],[0.9,'Moderada (90%)'],[1,'Padrão (100%)'],[1.1,'Puxada (110%)']].map(([f,l])=>`<option value="${f}" ${(+v.fator||1)===f?'selected':''}>${l}</option>`).join('')}</select>
      <label>Meta fixa de dias ativos (opcional)</label><input class="input" type="number" min="1" max="60" id="ef-alvo" placeholder="em branco = meta personalizada por aluno" value="${v.alvoFixo||''}">
      <label>Missões extras</label>${Object.entries(EV_MISSOES).map(([k,m])=>`<label style="display:flex;gap:8px;align-items:center;text-transform:none;letter-spacing:0;font-size:13px;color:var(--text);font-weight:600;margin:6px 0"><input type="checkbox" class="ef-m" value="${k}" ${tiposM.includes(k)?'checked':''}> ${m.titulo} <span style="color:var(--text-mute);font-weight:500">— ${m.desc}</span></label>`).join('')}
      <label>Recompensa (texto exibido)</label><input class="input" id="ef-rec" maxlength="80" value="${mtEsc(v.recompensa||'')}" placeholder="Ex.: medalha exclusiva + destaque no mural">
      <label style="display:flex;gap:8px;align-items:center;text-transform:none;letter-spacing:0;font-size:13.5px;color:var(--text)"><input type="checkbox" id="ef-ativo" ${v.ativo!==false?'checked':''}> Desafio ativo</label>
    </div>
    <p class="mt-muted" style="font-size:11.5px;margin-top:8px">A meta de cada aluno é calculada pela frequência real dele nas 6 semanas anteriores e não passa de 1 dia além do plano por semana. Participações e conclusões só existem quando o aluno entra e cumpre de verdade.</p>
    <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="salvarEventoAdmin('${doc?doc.id:''}','${mtJsStr(v.substitui||'')}')">Salvar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openAdminEventos()">Voltar</button>`;
  $('modal-back').classList.add('on');
}
async function salvarEventoAdmin(idDoc, substitui){
  if(!mtAdmin()){ toast('🔒 Somente administradores.'); return; }
  const nome = $('ef-nome').value.trim(); const ini = $('ef-ini').value, fim = $('ef-fim').value;
  if(!nome){ toast('Dê um nome ao desafio'); return; }
  if(!ini || !fim || fim < ini){ toast('Confira as datas de início e fim'); return; }
  const dados = { nome, descricao:$('ef-desc').value.trim(), inicio:ini, fim, arte:$('ef-arte').value, fator:+$('ef-fator').value||1,
    alvoFixo: Math.max(0, Math.min(60, parseInt($('ef-alvo').value,10)||0)) || null,
    missoes:[...document.querySelectorAll('.ef-m:checked')].map(x=>({tipo:x.value})), recompensa:$('ef-rec').value.trim(), ativo:$('ef-ativo').checked,
    substitui: substitui||'', atualizadoEm: Date.now(), atualizadoPor: (state.user&&state.user.email)||'' };
  try{
    const ref = idDoc ? db.collection('desafiosTematicos').doc(idDoc) : db.collection('desafiosTematicos').doc('d'+Date.now().toString(36));
    if(!idDoc) dados.criadoEm = Date.now();
    await ref.set(dados, {merge:true});
    toast('✅ Desafio salvo'); await loadEventosCustom(); openAdminEventos();
  }catch(e){ console.log(e); toast('⚠️ Não foi possível salvar. Confira as regras do Firestore (desafiosTematicos).'); }
}
async function openAdminEventoPart(key){
  $('modal-inner').innerHTML = `<h3>Participação</h3><div class="mt-muted">Carregando…</div>`;
  $('modal-back').classList.add('on');
  try{
    const snap = await db.collection('desafiosTematicos').doc(key).collection('participantes').get();
    // Beta 35: a mesma pessoa com dois logins podia aparecer duas vezes: fica o registro mais adiantado por e-mail
    const porEmail = {}; const arr = [];
    snap.forEach(d=>{ const x = d.data(); const k = String(x.email||'').toLowerCase() || d.id; const a = porEmail[k];
      if(!a || (x.concluidoEm && !a.concluidoEm) || ((+x.progresso||0) > (+a.progresso||0) && !a.concluidoEm)) porEmail[k] = x; });
    Object.values(porEmail).forEach(x=>arr.push(x));
    arr.sort((a,b)=>(b.progresso||0)-(a.progresso||0));
    const concl = arr.filter(x=>x.concluidoEm).length;
    const e = eventoPorKey(key);
    $('modal-inner').innerHTML = `<h3>${mtEsc(e?e.nome:key)}</h3>
      <div class="adm-kpis"><div class="adm-kpi"><b>${arr.length}</b><small>participantes</small></div><div class="adm-kpi"><b>${concl}</b><small>concluíram</small></div><div class="adm-kpi"><b>${arr.length?Math.round(concl/arr.length*100):0}%</b><small>taxa de conclusão</small></div></div>
      <div class="card" style="padding:6px 12px;margin-top:10px;max-height:46vh;overflow:auto">${arr.map(x=>`<div class="ev-list-item"><div style="flex:1;min-width:0"><b style="font-size:13px">${mtEsc(x.nome||x.email||'Aluno')}</b><div class="mt-muted" style="font-size:11.5px">${mtEsc(x.email||'')}</div></div><span class="mono" style="font-size:12px">${x.progresso||0}/${x.alvo||'?'}</span>${x.concluidoEm?' <span class="pill on">✓</span>':''}</div>`).join('') || '<div class="mt-muted" style="padding:10px 0">Ninguém entrou neste desafio ainda.</div>'}</div>
      <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openAdminEventos()">Voltar</button>`;
  }catch(err){
    $('modal-inner').innerHTML = `<h3>Participação</h3><p class="mt-muted">Não consegui ler os participantes. Publique as regras do Firestore incluídas nesta versão (firestore.rules).</p><button class="btn btn-ghost btn-block" onclick="openAdminEventos()">Voltar</button>`;
  }
}
// --- administradores (só o principal) ---
async function openAdminPermissoes(){
  if(!mtPrincipal()){ toast('🔒 Somente o administrador principal gerencia permissões.'); return; }
  $('modal-inner').innerHTML = `<h3>Administradores</h3><div class="mt-muted">Carregando…</div>`; $('modal-back').classList.add('on');
  let lista = [];
  try{ const snap = await db.collection('admins').get(); snap.forEach(d=>lista.push(Object.assign({email:d.id}, d.data()))); }
  catch(e){
    // diagnóstico real: mostra o motivo e a identificação que o Firestore recebeu desta conta
    const negado = e && (e.code==='permission-denied' || /permission/i.test(e.message||''));
    const uid = (fbUser && fbUser.uid) || '—'; const em = (fbUser && fbUser.email) || '—';
    const verif = fbUser && fbUser.emailVerified ? 'sim' : 'não';
    $('modal-inner').innerHTML = `<h3>Administradores</h3>
      <p class="mt-muted">${negado ? 'O Firestore recusou a leitura da coleção <b>admins</b> para esta conta. As regras reconhecem o administrador principal pelo UID ou pelo e-mail verificado — confira se batem com os dados abaixo.' : (navigator.onLine===false ? 'Sem conexão no momento.' : 'Não consegui ler a coleção <b>admins</b> agora ('+mtEsc((e&&e.code)||'erro')+').')}</p>
      <div class="card" style="font-size:12.5px;line-height:1.7;word-break:break-all"><b>UID desta conta:</b> ${mtEsc(uid)}<br><b>E-mail:</b> ${mtEsc(em)}<br><b>E-mail verificado:</b> ${verif}</div>
      <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="openAdminPermissoes()">Tentar de novo</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
    return;
  }
  const principal = String(ADMIN_EMAIL).toLowerCase();
  if(!lista.some(a=>a.email===principal)) lista.unshift({email:principal, ativo:true});
  $('modal-inner').innerHTML = `<h3>Administradores</h3>
    <p class="mt-muted" style="margin:0 0 10px">Administradores autorizados acessam o painel e gerenciam alunos, exercícios, vídeos, desafios e conteúdo. Só o principal muda permissões e cuida da Conquista Especial — e isso é garantido pelas regras do Firestore, não só pela tela.</p>
    <div class="card" style="padding:6px 12px">${lista.map(a=>`<div class="ev-list-item"><div style="flex:1;min-width:0"><b style="font-size:13px">${mtEsc(a.email)}</b><div class="mt-muted" style="font-size:11.5px">${a.email===principal?'Administrador principal':(a.ativo?'Autorizado':'Removido')}</div></div>${a.email===principal?'<span class="pill on">principal</span>':`<button class="btn btn-ghost" style="padding:6px 10px;font-size:12px" onclick="admSetAdmin('${mtJsStr(a.email)}', ${a.ativo?'false':'true'})">${a.ativo?'Remover':'Reativar'}</button>`}</div>`).join('')}</div>
    <div class="adm-form"><label>Adicionar administrador (e-mail)</label><input class="input" id="adm-novo" type="email" autocomplete="off" placeholder="email@exemplo.com"></div>
    <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="admSetAdmin(document.getElementById('adm-novo').value, true)">Autorizar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
}
async function admSetAdmin(email, ativo){
  email = String(email||'').trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ toast('E-mail inválido'); return; }
  if(email === String(ADMIN_EMAIL).toLowerCase()){ toast('O administrador principal não pode ser alterado'); return; }
  const go = async ()=>{
    try{ await db.collection('admins').doc(email).set({ ativo: !!ativo, atualizadoEm: Date.now(), atualizadoPor: state.user.email }, {merge:true}); toast(ativo?'✅ Administrador autorizado':'Permissão removida'); }
    catch(e){ toast('⚠️ O Firestore recusou. Confira as regras publicadas.'); }
    openAdminPermissoes();
  };
  if(!ativo) appConfirm(`${email} perde o acesso ao painel administrativo.`, go, {title:'Remover administrador?', emo:'🛡️', okLabel:'Remover', danger:true, onCancel:openAdminPermissoes});
  else go();
}

// ---------- 11. ATUALIZAÇÃO AUTOMÁTICA (sem botão) ----------
// O service worker novo é instalado em segundo plano. Ele é ativado:
//  • na hora, se o app acabou de abrir ou não há nada em andamento; ou
//  • quando o aluno sai do app (aba oculta) — nunca no meio de um treino ou de um formulário.
// Quando assume, o index.html recarrega a página uma vez (controllerchange).
const MT_UPD = { pendente:false, desde:0, avisou:false, abriuEm: Date.now() };
function _podeAtualizarAgora(){
  if(document.visibilityState === 'hidden') return true;
  const modal = document.getElementById('modal-back');
  const ocupado = (modal && modal.classList.contains('on')) || (state && state.ui && state.ui.tab==='sessions') ||
    (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) || !!document.getElementById('rest-timer-banner') || !!document.getElementById('rest-timer-on');   // Beta 33: o id certo do descanso
  // nos primeiros 20 s após abrir, ninguém começou nada ainda: pode aplicar
  return !ocupado || (Date.now() - MT_UPD.abriuEm < 20000 && !(modal && modal.classList.contains('on')));
}
async function mtAplicarAtualizacao(){
  try{
    if(!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration(); if(!reg || !reg.waiting) return;
    if(_podeAtualizarAgora()){ reg.waiting.postMessage('skipWaiting'); MT_UPD.pendente = false; }
    else {
      if(!MT_UPD.pendente){ MT_UPD.pendente = true; MT_UPD.desde = Date.now(); }
      // situação rara: atualização pronta há mais de 1 dia e o app nunca ficou livre — um aviso discreto, sem botão
      if(!MT_UPD.avisou && Date.now()-MT_UPD.desde > DIA_MS){ MT_UPD.avisou = true; toast('Uma atualização do MetaTreino está pronta e será aplicada quando você fechar o app.'); }
    }
  }catch(e){}
}
document.addEventListener('mt:update-available', ()=>mtAplicarAtualizacao());
document.addEventListener('visibilitychange', async ()=>{
  if(document.visibilityState === 'hidden'){ if(MT_UPD.pendente) mtAplicarAtualizacao(); return; }
  // voltou ao app (PWA instalada fica dias aberta): procura versão nova no máximo a cada 30 min
  try{ const ult = +mtLS('mt_upd_chk2')||0; if(Date.now()-ult > 30*60000){ mtLS('mt_upd_chk2', String(Date.now())); const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if(reg) reg.update().catch(()=>{}); } }catch(e){}
});
window.addEventListener('load', ()=>{ setTimeout(mtAplicarAtualizacao, 1500); });
setInterval(()=>{ if(MT_UPD.pendente) mtAplicarAtualizacao(); }, 60000);
// os antigos pontos de "atualizar" ficam inertes (compatibilidade com chamadas antigas)
renderUpdateCard = function(){};

// ---------- BOOT ----------
const _bootAfterAuthOrig = bootAfterAuth;
bootAfterAuth = function(){
  const r = _bootAfterAuthOrig.apply(this, arguments);
  setTimeout(()=>{ loadEventosCustom().then(()=>{ try{ checkEventos(); if(state.ui.tab==='challenges') renderChallenges(); else if(state.ui.tab==='home') renderMonthlyCard(); }catch(e){} }); }, 1800);
  return r;
};
Object.assign(window, { renderLibrary, setLibEquip, openExercise, openExerciseSheet, exTelaCheia, exVideoOk, openAparencia, setPacote, setTheme, openFotos, fotoToggleSel, fotoApagarSelConfirma, fotoApagarConfirma, fotoApagarTudoConfirma, fotoApagarTudoAgora, fotoVer,
  renderChallenges, participaEvento, sairDoEvento, shareEventoImagem, openHistoricoEventos, mtEvFoco, renderHomeSmart, mtPergunta, openAdminEventos, openAdminEventoForm, salvarEventoAdmin, openAdminEventoPart, openAdminPermissoes, admSetAdmin, trophyIco, trophyIcoLocked, mtLS, mtDia0 });

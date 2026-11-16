
// =====================================================================
// 37. Beta 40 — Painel: plano de cada aluno, remover administrador, excluir conta
// =====================================================================
// • A lista mostra TODAS as contas (com ou sem documento de plano), com o plano de cada uma.
// • Plano: conceder/renovar Premium, encerrar, suspender (bloquear) e desbloquear — tudo em
//   usuariosAutorizados/{email}, que só administradores gravam (firestore.rules).
// • Remover administrador: APAGA admins/{email} (antes só marcava ativo:false). As regras leem esse
//   documento em cada pedido, então o acesso cai na hora no servidor; o app da pessoa também percebe
//   na hora (escuta o próprio documento) e sai do painel. A conta e os dados de aluno continuam.
//   O app não usa custom claims — não há nada a revogar além do documento.
// • Excluir conta: Cloud Function adminExcluirConta (functions/index.js), com Admin SDK. Sem a função
//   publicada, o painel oferece só o que o navegador pode fazer de verdade (apagar os dados e suspender)
//   e diz com todas as letras que o login continua no Authentication.
// • Toda ação vai para adminLog (quem, o quê, em quem, quando).

const FN_REGIAO = 'southamerica-east1';
function admEu(){ return String((fbUser && fbUser.email) || (state.user && state.user.email) || '').toLowerCase(); }
async function admRegistrar(acao, alvo, detalhe){
  try{ await db.collection('adminLog').add({ acao, alvo: alvo||null, detalhe: detalhe||null, por: admEu(), em: firebase.firestore.FieldValue.serverTimestamp() }); }
  catch(e){ console.log('adminLog:', e); }
}
function admPlanoDe(email){ return planoDe(false, allowCache[email] || null); }
function admPlanoSelo(p){
  const nome = { premium:'Premium', teste:'Teste', gratuito:'Básico', bloqueado:'Bloqueado' }[p.tipo] || p.tipo;
  return `<span class="adm-plano ${p.tipo}">${p.tipo==='premium'||p.tipo==='teste'?'⭐ ':''}${nome}</span>`;
}
function admDias(p){ if(!p.premium) return p.tipo === 'bloqueado' ? '🔒' : '—'; if(!p.ate) return '∞'; return Math.max(0, Math.ceil((p.ate - Date.now())/DIA_MS)) + 'd'; }

// ---------- 1. Carregar: contas com e sem documento de plano ----------
const _loadAdminDataB40 = window.loadAdminData;
window.loadAdminData = async function(){
  const r = await _loadAdminDataB40.apply(this, arguments);
  try{ Object.keys(usuariosCache||{}).forEach(em=>{ if(!allowCache[em]) allowCache[em] = { _semDoc:true }; }); }catch(e){}
  return r;
};
renderAdminStats = function(){
  const ps = Object.keys(allowCache).filter(e=>!allowCache[e].contaExcluidaEm).map(admPlanoDe);
  $('adm-active').textContent = ps.filter(p=>p.tipo==='premium').length;
  $('adm-exp').textContent = ps.filter(p=>p.tipo==='teste').length;
  $('adm-total').textContent = ps.length;
  $('adm-vencidos').textContent = ps.filter(p=>p.tipo==='gratuito').length;
};
renderAdminList = function(){
  const q = ($('adm-search').value||'').toLowerCase();
  let items = Object.entries(allowCache).filter(([,a])=>!a.contaExcluidaEm).map(([email,a])=>({ email, a, user:usuariosCache[email], p:admPlanoDe(email) }));
  items = items.filter(x=>{
    if(q && !x.email.includes(q) && !String(x.user&&x.user.nome||'').toLowerCase().includes(q) && !String(x.a.name||'').toLowerCase().includes(q)) return false;
    const vence = x.p.premium && x.p.ate && x.p.ate - Date.now() < 7*DIA_MS;
    return admFilter==='all' || x.p.tipo===admFilter || (admFilter==='vence' && vence);
  });
  items.sort((x,y)=>(+(y.user&&y.user.atualizadoEm)||msDe(y.a.addedAt)||msDe(y.a.testeInicio)||0) - (+(x.user&&x.user.atualizadoEm)||msDe(x.a.addedAt)||msDe(x.a.testeInicio)||0));
  $('adm-list-count').textContent = items.length + (items.length===1?' conta':' contas');
  const pager = $('adm-pager'); if(pager) pager.innerHTML = '';
  if(!items.length){ $('adm-list').innerHTML = `<div class="rest-card"><div style="font-size:44px">👥</div><div class="rest-title">Nenhuma conta</div><div class="rest-sub">As contas aparecem aqui assim que a pessoa se cadastra.</div></div>`; return; }
  const total = Math.max(1, Math.ceil(items.length/ADM_PAGE_SIZE)); admPage = Math.min(Math.max(0, admPage), total-1);
  $('adm-list').innerHTML = items.slice(admPage*ADM_PAGE_SIZE, admPage*ADM_PAGE_SIZE+ADM_PAGE_SIZE).map(x=>{
    const cls = !x.p.premium ? (x.p.tipo==='bloqueado'?'off':'') : (x.p.ate && x.p.ate-Date.now() < 7*DIA_MS ? 'warn' : 'on');
    return `<div class="stud" onclick="openStudent('${jsAttr(x.email)}')">
      <div class="stud-top"><div><div class="stud-name">${escHtml(x.user&&x.user.nome || x.a.name || x.email.split('@')[0])}</div><div class="stud-email">${escHtml(x.email)}</div></div><div class="stud-days ${cls}">${admDias(x.p)}</div></div>
      <div class="stud-meta">${admPlanoSelo(x.p)}${x.a.phone?`<span>📱 <b>${escHtml(x.a.phone)}</b></span>`:''}${x.a.notes?`<span>📝 ${escHtml(x.a.notes)}</span>`:''}</div></div>`;
  }).join('');
  if(pager && total > 1){
    pager.innerHTML = `<div class="row" style="justify-content:space-between;align-items:center;margin-top:12px;gap:8px">
      <button class="btn btn-ghost" style="padding:8px 14px" onclick="admGoPage(${admPage-1})" ${admPage===0?'disabled':''}>‹ Anterior</button>
      <span class="text-dim" style="font-size:12.5px;white-space:nowrap">pág. ${admPage+1}/${total}</span>
      <button class="btn btn-ghost" style="padding:8px 14px" onclick="admGoPage(${admPage+1})" ${admPage>=total-1?'disabled':''}>Próximo ›</button></div>`;
  }
};
mtGancho('goAdmin', { depois(){ try{ const r = $('adm-log-row'); if(r) r.classList.toggle('hidden', !mtPrincipal()); }catch(e){} } });

// ---------- 2. Ficha do aluno: plano e gestão ----------
mtGancho('openStudent', { depois(email){
  try{
    const box = $('stud-content'); if(!box) return;
    const a = allowCache[email] || {}; const p = admPlanoDe(email); const eJs = jsAttr(email);
    const tag = box.querySelector('.profile-tag'); if(tag) tag.innerHTML = admPlanoSelo(p) + ' · ' + mtEsc(admDiasLongo(p));
    // tira os blocos antigos (tempo de acesso / bloquear / remover) — a gestão agora é pelo plano
    const kids = [...box.children]; let apagando = false;
    kids.forEach(k=>{
      if(k.classList && k.classList.contains('section-lbl')) apagando = /Ajustar tempo de acesso|^Gerenciar$/.test(k.textContent.trim());
      if(apagando) k.remove();
    });
    const eu = email === admEu();
    const ehAdm = !!(window.__admListaCache && window.__admListaCache[email]);
    const principal = mtPrincipal();
    box.insertAdjacentHTML('beforeend', `
      <div class="section-lbl">Plano</div>
      <div class="card" style="font-size:13px;line-height:1.55">${mtEsc(admPlanoTexto(a, p))}</div>
      ${eu ? '<div class="mt-muted" style="text-align:center;font-size:12.5px;margin:8px 0">🛡️ Sua própria conta não é alterada por aqui.</div>' : `
      <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">
        <button class="btn btn-ghost" style="flex:1" onclick="admPremium('${eJs}',30)">+30 dias</button>
        <button class="btn btn-ghost" style="flex:1" onclick="admPremium('${eJs}',90)">+90 dias</button>
        <button class="btn btn-ghost" style="flex:1" onclick="admPremium('${eJs}',365)">+1 ano</button>
      </div>
      <div class="row" style="gap:6px;margin-top:8px">
        <button class="btn btn-outline" style="flex:1" onclick="admPremium('${eJs}',0)">♾️ Premium sem prazo</button>
        ${p.premium ? `<button class="btn btn-ghost" style="flex:1" onclick="admEncerrar('${eJs}')">Passar para Básico</button>` : ''}
      </div>
      <div class="mt-muted" style="font-size:11.5px;margin-top:6px;line-height:1.45">Os dias somam a partir do fim do Premium atual (ou de hoje, se não houver). Trocar de plano nunca apaga treinos nem histórico.</div>
      <div class="section-lbl">Gerenciar</div>
      ${p.tipo==='bloqueado'
        ? `<button class="btn btn-ghost btn-block" onclick="admBloquear('${eJs}', false)">🔓 Desbloquear conta</button>`
        : `<button class="btn btn-ghost btn-block" onclick="admBloquear('${eJs}', true)">🔒 Suspender conta (bloquear)</button>`}
      ${principal && ehAdm ? `<button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="admSetAdmin('${eJs}', false)">🛡️ Remover cargo de administrador</button>` : ''}
      ${principal ? `<button class="btn btn-ghost btn-block" style="margin-top:8px;color:var(--danger-soft);border-color:var(--line-danger)" onclick="admExcluirConta('${eJs}')">🗑️ Excluir conta…</button>` : ''}`}`);
  }catch(e){ console.log('ficha do aluno (plano):', e); }
}});
function admDiasLongo(p){
  if(p.tipo==='bloqueado') return 'conta suspensa';
  if(!p.premium) return p.testeAcabouEm ? 'teste encerrado' : 'sem Premium';
  if(!p.ate) return 'sem prazo';
  const d = Math.max(0, Math.ceil((p.ate - Date.now())/DIA_MS)); return `${d} ${d===1?'dia':'dias'}`;
}
function admPlanoTexto(a, p){
  const f = t=>new Date(t).toLocaleDateString('pt-BR');
  if(p.tipo==='bloqueado') return `Conta suspensa${a.bloqueioMotivo?' — '+a.bloqueioMotivo:''}${a.bloqueadoEm?' (desde '+f(msDe(a.bloqueadoEm))+')':''}. A pessoa não entra no app; os dados continuam guardados.`;
  if(p.tipo==='teste') return `Teste Premium até ${f(p.ate)} (começou em ${f(p.inicio)}). Ao terminar, passa sozinho para o Básico.`;
  if(p.tipo==='premium') return p.ate ? `Premium até ${f(p.ate)}.` : 'Premium sem data de término.';
  if(p.testeAcabouEm) return `Básico (teste encerrado em ${f(p.testeAcabouEm)}).`;
  if(p.premiumAcabouEm) return `Básico (Premium encerrado em ${f(p.premiumAcabouEm)}).`;
  return a._semDoc ? 'Básico (conta criada sem teste — ex.: login de usuário sem e-mail).' : 'Básico.';
}
async function admGravarPlano(email, dados, acao, detalhe){
  if(email === admEu()){ toast('🛡️ Sua própria conta não é alterada por aqui.'); return false; }
  dados = Object.assign({}, dados, { atualizadoEm: Date.now(), atualizadoPor: admEu() });
  try{
    await db.collection('usuariosAutorizados').doc(email).set(dados, { merge:true });
    allowCache[email] = Object.assign({}, allowCache[email]||{}, dados); delete allowCache[email]._semDoc;
    await admRegistrar(acao, email, detalhe);
    return true;
  }catch(e){
    console.log('plano (admin):', e);
    toast('⚠️ O Firestore recusou (' + ((e && e.code) || 'erro') + '). Nada foi alterado.');
    return false;
  }
}
async function admPremium(email, dias){
  const p = admPlanoDe(email);
  const base = (p.premium && p.ate && p.ate > Date.now()) ? p.ate : Date.now();
  const ate = dias ? base + dias*DIA_MS : null;
  // active/expiresAt continuam preenchidos: versões antigas do app (ainda não atualizadas) leem esses campos
  const ok = await admGravarPlano(email, { plano:'premium', premiumAte:ate, active:true, expiresAt:ate, bloqueado:false }, 'premium', { dias: dias||'sem prazo', ate });
  if(ok){ toast(dias ? `⭐ Premium até ${new Date(ate).toLocaleDateString('pt-BR')}` : '⭐ Premium sem prazo'); openStudent(email); }
}
function admEncerrar(email){
  appConfirm(`${email} passa para o plano Básico agora. Treinos, histórico e dados continuam; o que é Premium fica guardado.`, async ()=>{
    const ok = await admGravarPlano(email, { plano:'gratuito', premiumAte:null, active:true, expiresAt:Date.now()-1000 }, 'gratuito');
    if(ok){ toast('Plano Básico'); openStudent(email); }
  }, { title:'Encerrar o Premium?', okLabel:'Passar para Básico', onCancel:()=>setTimeout(()=>openStudent(email), 80) });
}
function admBloquear(email, bloquear){
  if(!bloquear){
    admGravarPlano(email, { bloqueado:false, bloqueioMotivo:null }, 'desbloquear').then(ok=>{ if(ok){ toast('🔓 Conta desbloqueada'); openStudent(email); } });
    return;
  }
  $('modal-inner').innerHTML = `<h3>🔒 Suspender conta</h3>
    <p class="mt-muted" style="font-size:13px;line-height:1.5">A pessoa deixa de entrar no app até você desbloquear. Os dados continuam guardados. Conta: <b>${mtEsc(email)}</b></p>
    <div class="field"><label>Motivo (aparece para a pessoa — opcional)</label><input class="input" id="adm-motivo" maxlength="120" placeholder="Ex.: uso indevido da conta"></div>
    <button class="btn btn-perigo btn-block" onclick="admBloquearConfirma('${jsAttr(email)}')">Suspender conta</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal();setTimeout(()=>openStudent('${jsAttr(email)}'),60)">Cancelar</button>`;
  $('modal-back').classList.add('on');
}
async function admBloquearConfirma(email){
  const motivo = String(($('adm-motivo')||{}).value||'').trim().slice(0,120);
  closeModal();
  const ok = await admGravarPlano(email, { bloqueado:true, bloqueioMotivo:motivo||null, bloqueadoEm:Date.now() }, 'bloquear', { motivo });
  if(ok){ toast('🔒 Conta suspensa'); openStudent(email); }
}
// "Conceder Premium" (antigo "Liberar acesso"): grava o plano novo + os campos antigos
const _doAddStudentB40 = window.doAddStudent;
window.doAddStudent = async function(){
  const email = normalizaLogin($('as-email').value); const dur = parseInt(readOpt('as-dur'));
  const err = $('as-err'); if(err) err.innerHTML = '';
  if(!email || !email.includes('@')){ if(err) err.innerHTML = '<div class="err">Digite um e-mail válido (ou o usuário de uma conta antiga).</div>'; return; }
  if(!dur){ if(err) err.innerHTML = '<div class="err">Selecione a duração.</div>'; return; }
  const p = admPlanoDe(email); const base = (p.premium && p.ate && p.ate > Date.now()) ? p.ate : Date.now();
  const ate = dur >= 9999 ? null : base + dur*DIA_MS;
  const ok = await admGravarPlano(email, { plano:'premium', premiumAte:ate, active:true, expiresAt:ate, bloqueado:false, addedAt: msDe((allowCache[email]||{}).addedAt) || Date.now(),
    name: $('as-name').value.trim() || (allowCache[email]||{}).name || '', phone: $('as-whats').value.trim(), notes: $('as-notes').value.trim() }, 'premium', { dias: dur>=9999?'sem prazo':dur, ate });
  if(ok){ toast('⭐ Premium concedido'); closeModal(); goAdmin(); }
};
// funções antigas (botões que não existem mais): passam pelo plano novo, sem gravar campos soltos
adjustDays = function(email, d){ return d > 0 ? admPremium(email, d) : admEncerrar(email); };
setLifetime = function(email){ return admPremium(email, 0); };
unsetLifetime = function(email){ return admPremium(email, 30); };
toggleStudent = function(email){ return admBloquear(email, admPlanoDe(email).tipo !== 'bloqueado'); };
removeStudent = function(email){ return admEncerrar(email); };

// ---------- 3. Administradores ----------
const _openAdminPermissoesB40 = window.openAdminPermissoes;
window.openAdminPermissoes = async function(){
  const r = await _openAdminPermissoesB40.apply(this, arguments);
  try{
    const box = $('modal-inner'); if(!box) return r;
    const ajuda = box.querySelector('p.mt-muted');
    if(ajuda && !box.querySelector('.adm-nota-b40')) ajuda.insertAdjacentHTML('afterend', `<p class="mt-muted adm-nota-b40" style="margin:0 0 10px;font-size:12px;line-height:1.5">Remover tira só o cargo: a conta e os dados de aluno continuam. O acesso ao painel cai na hora, no servidor e no app da pessoa.</p>`);
    // registros antigos "Removido" (ativo:false) podem ser apagados de vez
    box.querySelectorAll('.ev-list-item').forEach(li=>{
      const st = li.querySelector('.mt-muted'); const bt = li.querySelector('button');
      if(st && bt && /Removido/.test(st.textContent)){ bt.textContent = 'Apagar registro'; const em = li.querySelector('b').textContent.trim(); bt.setAttribute('onclick', `admApagarRegistroAdmin('${mtJsStr(em)}')`); }
    });
  }catch(e){}
  return r;
};
admSetAdmin = async function(email, ativo){
  email = String(email||'').trim().toLowerCase();
  if(!mtPrincipal()){ toast('🔒 Somente o administrador principal gerencia administradores.'); return; }
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ toast('E-mail inválido'); return; }
  if(email === String(ADMIN_EMAIL).toLowerCase() || email === admEu()){ toast('🛡️ O administrador principal não pode ser alterado'); return; }
  const volta = ()=>{ const f = $('scr-admin-student') && $('scr-admin-student').classList.contains('active') ? ()=>openStudent(email) : openAdminPermissoes; setTimeout(f, 80); };
  if(ativo){
    try{ await db.collection('admins').doc(email).set({ ativo:true, atualizadoEm:Date.now(), atualizadoPor:admEu() }); await admRegistrar('admin-conceder', email); (window.__admListaCache = window.__admListaCache || {})[email] = true; toast('✅ Administrador autorizado'); }
    catch(e){ toast('⚠️ O Firestore recusou (' + ((e&&e.code)||'erro') + '). Nada mudou.'); }
    openAdminPermissoes(); return;
  }
  appConfirm(`${email} perde o acesso ao painel administrativo agora.\n\nA conta e os dados de aluno dessa pessoa NÃO são apagados.`, async ()=>{
    try{
      await db.collection('admins').doc(email).delete();
      // confere de verdade: o documento sumiu?
      const d = await db.collection('admins').doc(email).get();
      if(d.exists) throw Object.assign(new Error('o documento continua no Firestore'), { code:'nao-removido' });
      if(window.__admListaCache) delete window.__admListaCache[email];
      await admRegistrar('admin-remover', email);
      toast('🛡️ Cargo de administrador removido');
    }catch(e){ console.log('remover admin:', e); toast('⚠️ Não foi possível remover (' + ((e&&e.code)||'erro') + '). Confira as regras publicadas.'); }
    volta();
  }, { title:'Remover administrador?', emo:'🛡️', okLabel:'Remover cargo', danger:true, onCancel:volta });
};
async function admApagarRegistroAdmin(email){
  try{ await db.collection('admins').doc(email).delete(); await admRegistrar('admin-apagar-registro', email); toast('Registro apagado'); }
  catch(e){ toast('⚠️ O Firestore recusou (' + ((e&&e.code)||'erro') + ').'); }
  openAdminPermissoes();
}
// quem é administrador (para o botão "Remover cargo" na ficha do aluno)
mtGancho('goAdmin', { depois(){
  if(!mtPrincipal()) return;
  db.collection('admins').get().then(s=>{ const m = {}; s.forEach(d=>{ if(d.data() && d.data().ativo === true) m[d.id] = true; }); window.__admListaCache = m; }).catch(()=>{});
}});
// app do administrador secundário: perdeu o cargo → sai do painel na hora
let _admOuvinte = null;
mtGancho('bootAfterAuth', { depois(){
  try{
    if(_admOuvinte || !state.user || !state.user.isAdmin || mtPrincipal()) return;
    const em = admEu(); if(!em) return;
    _admOuvinte = db.collection('admins').doc(em).onSnapshot(d=>{
      const ok = !!(d && d.exists && d.data() && d.data().ativo === true);
      if(ok || !state.user || !state.user.isAdmin) return;
      if(d && d.metadata && d.metadata.fromCache) return;
      state.user.isAdmin = false;
      try{ const k = 'metatreino_access_' + em; const c = JSON.parse(localStorage.getItem(k)||'null'); if(c){ c.isAdmin = false; localStorage.setItem(k, JSON.stringify(c)); } }catch(e){}
      toast('Seu acesso de administrador foi removido.');
      try{ if(document.querySelector('#scr-admin.active, #scr-admin-student.active')) sairDoPainel(); else renderProfile(); }catch(e){}
      try{ _admOuvinte(); }catch(e){} _admOuvinte = null;
    }, ()=>{ _admOuvinte = null; });
  }catch(e){}
}});

// ---------- 4. Excluir conta (administrador principal) ----------
async function fnChamar(nome, dados){
  if(!fbUser) throw Object.assign(new Error('Sessão expirada'), { code:'unauthenticated' });
  const token = await fbUser.getIdToken();
  const url = `https://${FN_REGIAO}-${firebaseConfig.projectId}.cloudfunctions.net/${nome}`;
  let resp;
  try{ resp = await _comPrazo(fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer ' + token }, body: JSON.stringify({ data: dados }) }), 30000); }
  catch(e){ throw Object.assign(new Error('A função do servidor não respondeu (não publicada ou sem internet).'), { code:'sem-funcao' }); }
  let j = null; try{ j = await resp.json(); }catch(e){}
  if(resp.status === 404 || (!j && !resp.ok)) throw Object.assign(new Error('A função do servidor ainda não foi publicada.'), { code:'sem-funcao' });
  if(j && j.error) throw Object.assign(new Error(j.error.message || 'erro'), { code: j.error.status || 'erro' });
  return j ? j.result : null;
}
// Beta 42: confirmação por janela (sem digitar o e-mail), uma exclusão por vez, painel e sessão do
// administrador preservados, e marca permanente contasExcluidas/{email}:
//  • o app de quem foi excluído (se ainda estiver aberto ou logado) NÃO consegue recriar os dados nem um
//    novo teste Premium (firestore.rules), e a lista do painel não mostra mais a conta;
//  • a exclusão só apaga documentos cujo e-mail é o da conta excluída — nunca o do administrador.
// Sem a função do servidor publicada (plano Blaze), o painel faz o que o navegador pode fazer de verdade
// (dados + bloqueio + marca) e diz claramente que o login segue no Authentication.
let _admExcluindo = false;
function _admNomeDe(email){ const u = usuariosCache[email]; const d = u && u.estadoApp; const p = d && d.user && d.user.profile; return (p && p.nickname) || (u && u.nome) || (allowCache[email]||{}).name || email.split('@')[0]; }
function _admProtegido(email){
  const e = String(email||'').toLowerCase();
  return !e || e === admEu() || e === String(ADMIN_EMAIL).toLowerCase();
}
function admExcluirConta(email){
  if(!mtPrincipal()){ toast('🔒 Somente o administrador principal exclui contas.'); return; }
  if(_admProtegido(email)){ toast('🛡️ Esta conta não pode ser excluída por aqui.'); return; }
  if(_admExcluindo){ toast('Já existe uma exclusão em andamento.'); return; }
  $('modal-inner').innerHTML = `<div class="adm-del">
    <div class="adm-del-ico" aria-hidden="true">🗑️</div>
    <h3>Excluir aluno?</h3>
    <div class="adm-del-quem"><b>${mtEsc(_admNomeDe(email))}</b><span>${mtEsc(email)}</span></div>
    <p class="adm-del-aviso"><b>Esta operação é permanente.</b> Apaga os treinos, o histórico, o arquivo anual, as participações em desafios e o acesso desta conta. Não pode ser desfeita.</p>
    <div id="adm-del-st" class="adm-del-st" role="status" aria-live="polite"></div>
    <div class="adm-del-bts"><button class="btn btn-ghost" id="adm-del-cancel" onclick="closeModal();setTimeout(()=>openStudent('${jsAttr(email)}'),60)">Cancelar</button>
    <button class="btn btn-perigo" id="adm-del-go" onclick="admExcluirContaGo('${jsAttr(email)}')">Excluir aluno</button></div></div>`;
  $('modal-back').classList.add('on');
}
function _admBloqueiaBotoes(on, txt){
  ['adm-del-go','adm-del-cancel'].forEach(id=>{ const b = $(id); if(b){ b.disabled = on; if(id==='adm-del-go' && txt) b.textContent = txt; } });
  const back = $('modal-back'); if(back) back.classList.toggle('adm-ocupado', on);
}
async function admExcluirContaGo(email){
  if(_admExcluindo) return;                         // um clique só (toques repetidos são ignorados)
  if(!mtPrincipal() || _admProtegido(email)) return;
  _admExcluindo = true;
  const st = $('adm-del-st'); const fala = (t, cor)=>{ if(st){ st.innerHTML = t; st.style.color = cor || ''; } };
  _admBloqueiaBotoes(true, 'Excluindo…'); fala('Excluindo… não feche esta janela.');
  try{
    let r = null, semFuncao = false;
    if(!window.__admSemFuncao){
      try{ r = await fnChamar('adminExcluirConta', { email, confirmacao: email, confirmado: true }); }
      catch(e){ if(e && e.code === 'sem-funcao'){ semFuncao = true; window.__admSemFuncao = true; } else throw e; }
    } else semFuncao = true;
    if(r && r.ok){
      await _admMarcaExcluida(email, { origem:'servidor', logins:r.logins });
      await _admDepoisDeExcluir(email);
      $('modal-inner').innerHTML = `<h3>✅ Aluno excluído</h3><p class="mt-muted" style="font-size:13px;line-height:1.55"><b>${mtEsc(email)}</b>: ${r.logins} login(s) excluído(s) do Authentication, ${r.documentos} documento(s) de dados e ${r.participacoes} participação(ões) em desafios apagados.</p><button class="btn btn-primary btn-block" onclick="admVoltarLista()">Voltar ao painel</button>`;
      return;
    }
    if(!semFuncao) throw new Error('resposta inesperada do servidor');
    // sem a função do servidor: dados + bloqueio + marca de excluída
    const res = await admExcluirSoDados(email, true);
    await _admDepoisDeExcluir(email);
    $('modal-inner').innerHTML = `<h3>${res.falhou.length ? '⚠️ Exclusão parcial' : '✅ Dados do aluno excluídos'}</h3>
      <p class="mt-muted" style="font-size:13px;line-height:1.55">${res.feito.length ? 'Feito: ' + mtEsc([...new Set(res.feito)].join(', ')) + '.' : ''}${res.falhou.length ? '<br><b>Não foi possível:</b> ' + mtEsc(res.falhou.join(', ')) + '. Toque em Excluir de novo para tentar o que faltou.' : ''}</p>
      ${res.ignorados && res.ignorados.length ? `<p class="mt-muted" style="font-size:12px;line-height:1.5">${res.ignorados.length} documento(s) ligado(s) a este e-mail pertencem a outra conta e foram preservados.</p>` : ''}
      <p class="mt-muted" style="font-size:12.5px;line-height:1.55">A conta está bloqueada e não consegue recriar dados nem ganhar outro teste. <b>O login (Firebase Authentication) só é apagado com a função do servidor publicada</b> (plano Blaze) ou pelo Console do Firebase › Authentication.</p>
      <button class="btn btn-primary btn-block" onclick="admVoltarLista()">Voltar ao painel</button>`;
  }catch(e){
    console.log('excluir conta:', e);
    _admBloqueiaBotoes(false, 'Excluir aluno');
    fala('⚠️ Não foi possível excluir: ' + mtEsc((e && e.message) || 'erro') + '. <b>Nada foi dado como excluído.</b>', 'var(--danger-soft)');
  }finally{ _admExcluindo = false; const back = $('modal-back'); if(back) back.classList.remove('adm-ocupado'); }
}
// enquanto exclui, a janela não fecha (toque fora, voltar do Android) — o painel fica onde está
const _closeModalB42 = window.closeModal;
window.closeModal = function(){ if(_admExcluindo) return; return _closeModalB42.apply(this, arguments); };
// volta para a lista do painel SEM recarregar tudo (a sessão e a tela do administrador continuam)
function admVoltarLista(){ closeModal(); try{ showScreen('scr-admin'); renderAdminStats(); renderAdminList(); window.scrollTo(0,0); }catch(e){ goAdmin(); } }
async function _admMarcaExcluida(email, extra){
  await db.collection('contasExcluidas').doc(email).set(Object.assign({ em:Date.now(), por:admEu() }, extra||{}));
}
// depois de excluir: tira da lista NA HORA (sem recarregar o painel), confere que os dados do administrador
// continuam na nuvem e regrava se algo faltar
async function _admDepoisDeExcluir(email){
  delete allowCache[email]; delete usuariosCache[email];
  window.__admExcluidas = Object.assign(window.__admExcluidas || {}, { [email]: { em:Date.now() } });
  try{ renderAdminStats(); renderAdminList(); }catch(e){}
  try{
    const meu = await db.collection('usuarios').doc(uidDados()).get();
    if(!meu.exists){ console.log('documento do administrador ausente: regravando'); try{ _assinaturaNuvem = ''; }catch(x){} saveData(); syncToCloud(); }
  }catch(e){}
}
async function admExcluirSoDados(email, interno){
  if(!mtPrincipal() || _admProtegido(email)) return { feito:[], falhou:['conta protegida'] };
  const u = usuariosCache[email] || {};
  const proibidos = new Set([fbUser && fbUser.uid, uidDados()].filter(Boolean));
  const candidatos = [...new Set([...(u._uids||[]), u._uid].filter(Boolean))].filter(x=>!proibidos.has(x));
  const feito = []; const falhou = []; const ignorados = [...proibidos].filter(x=>(u._uids||[]).includes(x));
  const tenta = async (nome, f)=>{ try{ await f(); feito.push(nome); }catch(e){ falhou.push(nome + ' (' + ((e&&e.code)||'erro') + ')'); } };
  // marca ANTES de apagar: a partir daqui o app do aluno já não recria nada
  await tenta('marca de conta excluída', ()=>_admMarcaExcluida(email, { origem:'painel' }));
  await tenta('bloqueio', ()=>db.collection('usuariosAutorizados').doc(email).set({ plano:'gratuito', bloqueado:true, bloqueioMotivo:'Conta excluída pela administração', contaExcluidaEm:Date.now(), atualizadoPor:admEu() }));
  for(const uid of candidatos){
    // só apaga documento que é MESMO desta conta (o e-mail gravado no documento confere)
    let ok = false;
    try{ const d = await db.collection('usuarios').doc(uid).get(); ok = !d.exists || String((d.data()||{}).email||'').toLowerCase() === email; }catch(e){}
    if(!ok){ ignorados.push(uid); continue; }   // documento de outra pessoa: não é tocado
    for(const sub of ['arquivo','backups']){
      await tenta(sub === 'arquivo' ? 'arquivo anual' : 'registros de backup', async ()=>{ const s = await db.collection('usuarios').doc(uid).collection(sub).get(); for(const d of s.docs || []) await db.collection('usuarios').doc(uid).collection(sub).doc(d.id).delete(); });
    }
    await tenta('participações', async ()=>{ const ds = await db.collection('desafiosTematicos').get(); for(const d of ds.docs || []){ const r = db.collection('desafiosTematicos').doc(d.id).collection('participantes').doc(uid); const x = await r.get(); if(x.exists) await r.delete(); } });
    await tenta('dados do aluno', ()=>db.collection('usuarios').doc(uid).delete());
  }
  await tenta('vínculo da conta', ()=>db.collection('contas').doc(email).delete());
  await tenta('cargo de administrador', ()=>db.collection('admins').doc(email).delete());
  await admRegistrar(falhou.length ? 'excluir-dados-parcial' : 'excluir-dados', email, { feito, falhou, ignorados });
  return { feito, falhou, ignorados };
}
// lista: contas marcadas como excluídas não aparecem (mesmo que o app antigo do aluno tenha regravado algo)
const _loadAdminDataB42 = window.loadAdminData;
window.loadAdminData = async function(){
  const r = await _loadAdminDataB42.apply(this, arguments);
  try{
    const s = await db.collection('contasExcluidas').get();
    const m = {}; s.forEach(d=>{ m[d.id] = d.data() || {}; }); window.__admExcluidas = m;
  }catch(e){}
  Object.keys(window.__admExcluidas || {}).forEach(em=>{ delete allowCache[em]; delete usuariosCache[em]; });
  return r;
};
// contas excluídas: o principal pode liberar o e-mail para um cadastro novo (sem novo teste Premium)
function openContasExcluidas(){
  if(!mtPrincipal()) return;
  const m = window.__admExcluidas || {}; const L = Object.keys(m).sort();
  $('modal-inner').innerHTML = `<h3>Contas excluídas</h3>
    <p class="mt-muted" style="font-size:12.5px;line-height:1.5">Estes e-mails não aparecem na lista e não conseguem recriar dados. "Liberar" permite que a pessoa volte a usar o app com este e-mail (no plano Básico, sem novo teste).</p>
    <div style="max-height:55vh;overflow:auto">${L.map(em=>`<div class="adm-log" style="display:flex;align-items:center;gap:8px"><span style="flex:1;min-width:0;word-break:break-all">${mtEsc(em)}<br><small>${m[em].em?new Date(+m[em].em).toLocaleString('pt-BR'):''}</small></span><button class="btn btn-ghost" style="padding:6px 10px;font-size:12px" onclick="admLiberarEmail('${jsAttr(em)}')">Liberar</button></div>`).join('') || '<div class="mt-muted">Nenhuma conta excluída.</div>'}</div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function admLiberarEmail(email){
  appConfirm(`Liberar ${email} para usar o app de novo? A conta volta no plano Básico (sem novo teste Premium).`, async ()=>{
    try{
      await db.collection('contasExcluidas').doc(email).delete();
      await db.collection('usuariosAutorizados').doc(email).set({ plano:'gratuito', bloqueado:false, exclusaoAnteriorEm:Date.now(), atualizadoPor:admEu() });
      await admRegistrar('liberar-email', email);
      delete (window.__admExcluidas||{})[email]; toast('E-mail liberado'); goAdmin();
    }catch(e){ toast('⚠️ O Firestore recusou (' + ((e&&e.code)||'erro') + ').'); }
  }, { title:'Liberar e-mail?', okLabel:'Liberar' });
}
mtGancho('goAdmin', { depois(){
  try{
    if(!mtPrincipal() || $('adm-excl-row')) return;
    const ref = $('adm-tam-row') || $('adm-log-row'); if(!ref) return;
    const d = document.createElement('div'); d.className = 'list-row'; d.id = 'adm-excl-row'; d.onclick = openContasExcluidas;
    d.innerHTML = '🗂️ <span>Contas excluídas</span><span style="margin-left:auto;font-size:11px;color:var(--text-dim)">liberar e-mail</span>'; ref.after(d);
  }catch(e){}
}});
// suporte: liberar a restauração de um backup que não é desta conta (24 h), depois de conferir a identidade
function admLiberarBackup(email){
  appConfirm(`Liberar ${email} para restaurar um backup que não foi criado nesta conta, pelas próximas 24 horas?\n\nFaça isso só depois de confirmar que os dados são da própria pessoa.`, async ()=>{
    try{ await db.collection('liberacoesBackup').doc(email).set({ ate:Date.now()+24*3600000, por:admEu(), em:Date.now() }); await admRegistrar('liberar-backup', email); toast('Restauração liberada por 24 h'); }
    catch(e){ toast('⚠️ O Firestore recusou (' + ((e&&e.code)||'erro') + '). Publique as regras da Beta 42.'); }
  }, { title:'Liberar restauração de backup?', okLabel:'Liberar por 24 h' });
}
mtGancho('openStudent', { depois(email){
  try{ const box = $('stud-content'); if(!box || box.querySelector('#adm-lib-bkp') || email === admEu()) return;
    box.insertAdjacentHTML('beforeend', `<button class="btn btn-ghost btn-block" id="adm-lib-bkp" style="margin-top:8px" onclick="admLiberarBackup('${jsAttr(email)}')">📥 Liberar restauração de backup (24 h)</button>`);
  }catch(e){}
}});

// ---------- 5. Registro das ações ----------
async function openAdminLog(){
  if(!mtPrincipal()) return;
  $('modal-inner').innerHTML = `<h3>🧾 Registro de ações</h3><div class="mt-muted">Carregando…</div>`; $('modal-back').classList.add('on');
  try{
    const s = await db.collection('adminLog').orderBy('em','desc').limit(80).get();
    const L = []; s.forEach(d=>L.push(d.data()));
    L.sort((a,b)=>msDe(b.em)-msDe(a.em));
    const nome = { premium:'Premium concedido/renovado', gratuito:'Passou para Básico', bloquear:'Conta suspensa', desbloquear:'Conta desbloqueada', 'admin-conceder':'Administrador autorizado', 'admin-remover':'Administrador removido', 'admin-apagar-registro':'Registro de admin apagado', 'excluir-conta':'Conta excluída', 'excluir-conta-parcial':'Exclusão parcial', 'excluir-dados':'Dados apagados e conta suspensa', 'excluir-dados-parcial':'Dados apagados (parcial)', 'liberar-email':'E-mail liberado após exclusão', 'liberar-backup':'Restauração de backup liberada', cupons:'Cupons', 'registro-limpo':'Registro de ações limpo' };
    $('modal-inner').innerHTML = `<h3>🧾 Registro de ações</h3><div style="max-height:60vh;overflow:auto">${L.map(x=>`<div class="adm-log"><b>${mtEsc(nome[x.acao]||x.acao)}</b> · ${mtEsc(x.alvo||'')}<br>${mtEsc(msDe(x.em)?new Date(msDe(x.em)).toLocaleString('pt-BR'):'')} · por ${mtEsc(x.por||'')}${x.origem==='servidor'?' (servidor)':''}</div>`).join('') || '<div class="mt-muted">Nenhuma ação registrada ainda.</div>'}</div>
      ${L.length ? `<div class="mt-sec">Limpar registro</div><div class="cup-acoes"><button class="btn btn-ghost" onclick="admLimparLog(30)">Apagar mais antigos que 30 dias</button><button class="btn btn-ghost" onclick="admLimparLog(0)">🗑️ Apagar tudo</button></div>` : ''}
      <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  }catch(e){ $('modal-inner').innerHTML = `<h3>🧾 Registro de ações</h3><p class="mt-muted">Não consegui ler o registro (${mtEsc((e&&e.code)||'erro')}). Publique as regras desta versão (coleção adminLog).</p><button class="btn btn-ghost btn-block" onclick="closeModal()">Fechar</button>`; }
}

// Beta 48: limpar o registro (só o administrador principal). Fica uma linha dizendo quem limpou e quando.
function admLimparLog(dias){
  if(!mtPrincipal()) return;
  const txt = dias ? `Apagar as ações com mais de ${dias} dias? As mais recentes continuam.` : 'Apagar todo o registro de ações do painel? Não dá para desfazer.';
  appConfirm(txt, async ()=>{
    const corte = dias ? Date.now() - dias*86400000 : Infinity; let n = 0;
    try{
      const s = await db.collection('adminLog').get();
      const ids = []; s.forEach(d=>{ const em = msDe(d.data().em); if(!dias || (em && em < corte)) ids.push(d.id); });
      for(let i=0; i<ids.length; i+=400){ const b = db.batch(); ids.slice(i, i+400).forEach(id=>b.delete(db.collection('adminLog').doc(id))); await b.commit(); n += Math.min(400, ids.length - i); }
      if(n) await admRegistrar('registro-limpo', dias ? `mais antigos que ${dias} dias` : 'tudo', `${n} ${n===1?'ação apagada':'ações apagadas'}`);
      toast(n ? `🗑️ ${n} ${n===1?'ação apagada':'ações apagadas'}` : 'Nada para apagar');
    }catch(e){ toast('Não consegui limpar agora (' + ((e&&e.code)||'erro') + '). Publique as regras da Beta 48.'); }
    openAdminLog();
  }, { title:'Limpar registro?', emo:'🧾', okLabel:'Apagar', danger:true });
}

Object.assign(window, { admLimparLog, admPremium, admEncerrar, admBloquear, admBloquearConfirma, admExcluirConta, admExcluirContaGo, admExcluirSoDados, admApagarRegistroAdmin, openAdminLog, admRegistrar, fnChamar, openContasExcluidas, admLiberarEmail, admLiberarBackup, admVoltarLista });

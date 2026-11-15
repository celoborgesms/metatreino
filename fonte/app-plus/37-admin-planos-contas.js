
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
  const nome = { premium:'Premium', teste:'Teste', gratuito:'Gratuito', bloqueado:'Bloqueado' }[p.tipo] || p.tipo;
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
        ${p.premium ? `<button class="btn btn-ghost" style="flex:1" onclick="admEncerrar('${eJs}')">Passar para Gratuito</button>` : ''}
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
  if(p.tipo==='teste') return `Teste Premium até ${f(p.ate)} (começou em ${f(p.inicio)}). Ao terminar, passa sozinho para o Gratuito.`;
  if(p.tipo==='premium') return p.ate ? `Premium até ${f(p.ate)}.` : 'Premium sem data de término.';
  if(p.testeAcabouEm) return `Gratuito (teste encerrado em ${f(p.testeAcabouEm)}).`;
  if(p.premiumAcabouEm) return `Gratuito (Premium encerrado em ${f(p.premiumAcabouEm)}).`;
  return a._semDoc ? 'Gratuito (conta criada sem teste — ex.: login de usuário sem e-mail).' : 'Gratuito.';
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
  appConfirm(`${email} passa para o plano Gratuito agora. Treinos, histórico e dados continuam; o que é Premium fica guardado.`, async ()=>{
    const ok = await admGravarPlano(email, { plano:'gratuito', premiumAte:null, active:true, expiresAt:Date.now()-1000 }, 'gratuito');
    if(ok){ toast('Plano Gratuito'); openStudent(email); }
  }, { title:'Encerrar o Premium?', okLabel:'Passar para Gratuito', onCancel:()=>setTimeout(()=>openStudent(email), 80) });
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
function admExcluirConta(email){
  if(!mtPrincipal()){ toast('🔒 Somente o administrador principal exclui contas.'); return; }
  if(email === admEu() || email === String(ADMIN_EMAIL).toLowerCase()){ toast('🛡️ Esta conta não pode ser excluída por aqui.'); return; }
  const u = usuariosCache[email]; const d = u && u.estadoApp; const p = d && d.user && d.user.profile;
  const treinos = ((d&&d.modules&&d.modules.lift&&d.modules.lift.history)||[]).length + ((d&&d.modules&&d.modules.run&&d.modules.run.history)||[]).length;
  const ult = u && +u.atualizadoEm ? new Date(+u.atualizadoEm).toLocaleString('pt-BR') : '—';
  $('modal-inner').innerHTML = `<h3>🗑️ Excluir conta</h3>
    <div class="card" style="font-size:13px;line-height:1.7;word-break:break-word">
      <b>E-mail:</b> ${mtEsc(email)}<br><b>Nome:</b> ${mtEsc((p&&p.nickname) || (u&&u.nome) || (allowCache[email]||{}).name || '—')}<br>
      <b>Documentos de dados:</b> ${(u&&u._uids||[]).length || 0} · <b>Treinos registrados:</b> ${treinos}<br><b>Último uso:</b> ${mtEsc(ult)}<br><b>Plano:</b> ${admPlanoSelo(admPlanoDe(email))}</div>
    <p class="mt-muted" style="font-size:12.5px;line-height:1.5">Apaga o login (Authentication), os dados do aluno, o arquivo anual, as participações em desafios, o vínculo da conta e o cargo de administrador, se houver. <b>Não pode ser desfeito.</b> Fica só a marca de conta excluída no plano, para o mesmo e-mail não ganhar outro teste Premium.</p>
    <div class="field"><label>Para confirmar, digite o e-mail da conta</label><input class="input" id="adm-del-conf" autocapitalize="none" spellcheck="false" autocomplete="off" placeholder="${mtEsc(email)}" data-teclado></div>
    <div id="adm-del-st" class="mt-muted" style="font-size:12.5px;min-height:18px"></div>
    <button class="btn btn-perigo btn-block" id="adm-del-go" onclick="admExcluirContaGo('${jsAttr(email)}')">Excluir conta definitivamente</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal();setTimeout(()=>openStudent('${jsAttr(email)}'),60)">Cancelar</button>`;
  $('modal-back').classList.add('on');
}
async function admExcluirContaGo(email){
  const conf = String(($('adm-del-conf')||{}).value||'').trim().toLowerCase();
  const st = $('adm-del-st'), bt = $('adm-del-go'); const fala = (t, cor)=>{ if(st){ st.innerHTML = t; st.style.color = cor || ''; } };
  if(conf !== email){ fala('O e-mail digitado não confere. Nada foi excluído.', 'var(--danger-soft)'); return; }
  if(bt){ bt.disabled = true; bt.textContent = 'Excluindo…'; }
  try{
    const r = await fnChamar('adminExcluirConta', { email, confirmacao: conf });
    if(!r || !r.ok) throw new Error('resposta inesperada do servidor');
    delete allowCache[email]; delete usuariosCache[email];
    $('modal-inner').innerHTML = `<h3>✅ Conta excluída</h3><p class="mt-muted" style="font-size:13px;line-height:1.55"><b>${mtEsc(email)}</b>: ${r.logins} login(s) excluído(s) do Authentication, ${r.documentos} documento(s) de dados e ${r.participacoes} participação(ões) em desafios apagados.</p><button class="btn btn-primary btn-block" onclick="closeModal();goAdmin()">Voltar ao painel</button>`;
  }catch(e){
    console.log('excluir conta:', e);
    if(bt){ bt.disabled = false; bt.textContent = 'Excluir conta definitivamente'; }
    if(e && e.code === 'sem-funcao'){
      fala(`<b>A exclusão completa precisa da função do servidor</b> (functions/, plano Blaze do Firebase), e ela ainda não respondeu. <b>Nada foi excluído.</b><br><br>Sem ela, o navegador só consegue apagar os dados e suspender a conta — o login continua no Authentication até você apagar no Console.
        <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="admExcluirSoDados('${jsAttr(email)}')">Apagar só os dados e suspender</button>`, 'var(--text-dim)');
    } else fala('⚠️ O servidor recusou: ' + mtEsc(e && e.message || 'erro') + '. <b>Nada foi dado como excluído.</b>', 'var(--danger-soft)');
  }
}
async function admExcluirSoDados(email){
  const st = $('adm-del-st'); const fala = t=>{ if(st) st.innerHTML = t; };
  const u = usuariosCache[email] || {}; const uids = [...new Set([...(u._uids||[]), u._uid].filter(Boolean))];
  const feito = []; const falhou = [];
  const tenta = async (nome, f)=>{ try{ await f(); feito.push(nome); }catch(e){ falhou.push(nome + ' (' + ((e&&e.code)||'erro') + ')'); } };
  fala('Apagando…');
  for(const uid of uids){
    await tenta('arquivo anual', async ()=>{ const s = await db.collection('usuarios').doc(uid).collection('arquivo').get(); for(const d of s.docs || []) await db.collection('usuarios').doc(uid).collection('arquivo').doc(d.id).delete(); });
    await tenta('participações', async ()=>{ const ds = await db.collection('desafiosTematicos').get(); for(const d of ds.docs || []){ const r = db.collection('desafiosTematicos').doc(d.id).collection('participantes').doc(uid); const x = await r.get(); if(x.exists) await r.delete(); } });
    await tenta('dados do aluno', ()=>db.collection('usuarios').doc(uid).delete());
  }
  await tenta('vínculo da conta', ()=>db.collection('contas').doc(email).delete());
  await tenta('cargo de administrador', ()=>db.collection('admins').doc(email).delete());
  await tenta('suspensão', ()=>db.collection('usuariosAutorizados').doc(email).set({ plano:'gratuito', bloqueado:true, bloqueioMotivo:'Conta excluída pela administração', contaExcluidaEm:Date.now(), atualizadoPor:admEu() }));
  await admRegistrar(falhou.length ? 'excluir-dados-parcial' : 'excluir-dados', email, { feito, falhou });
  $('modal-inner').innerHTML = `<h3>${falhou.length ? '⚠️ Exclusão parcial' : '✅ Dados apagados e conta suspensa'}</h3>
    <p class="mt-muted" style="font-size:13px;line-height:1.55">${feito.length ? 'Feito: ' + mtEsc([...new Set(feito)].join(', ')) + '.' : ''}${falhou.length ? '<br><b>Não foi possível:</b> ' + mtEsc(falhou.join(', ')) + '.' : ''}</p>
    <p class="mt-muted" style="font-size:12.5px;line-height:1.55"><b>O login da pessoa continua existindo no Firebase Authentication.</b> Para apagá-lo: Console do Firebase › Authentication › Usuários › ${mtEsc(email)} › Excluir. Ou publique a função (functions/) para que o painel faça tudo sozinho.</p>
    <button class="btn btn-primary btn-block" onclick="closeModal();goAdmin()">Voltar ao painel</button>`;
}

// ---------- 5. Registro das ações ----------
async function openAdminLog(){
  if(!mtPrincipal()) return;
  $('modal-inner').innerHTML = `<h3>🧾 Registro de ações</h3><div class="mt-muted">Carregando…</div>`; $('modal-back').classList.add('on');
  try{
    const s = await db.collection('adminLog').orderBy('em','desc').limit(80).get();
    const L = []; s.forEach(d=>L.push(d.data()));
    L.sort((a,b)=>msDe(b.em)-msDe(a.em));
    const nome = { premium:'Premium concedido/renovado', gratuito:'Passou para Gratuito', bloquear:'Conta suspensa', desbloquear:'Conta desbloqueada', 'admin-conceder':'Administrador autorizado', 'admin-remover':'Administrador removido', 'admin-apagar-registro':'Registro de admin apagado', 'excluir-conta':'Conta excluída', 'excluir-conta-parcial':'Exclusão parcial', 'excluir-dados':'Dados apagados e conta suspensa', 'excluir-dados-parcial':'Dados apagados (parcial)' };
    $('modal-inner').innerHTML = `<h3>🧾 Registro de ações</h3><div style="max-height:60vh;overflow:auto">${L.map(x=>`<div class="adm-log"><b>${mtEsc(nome[x.acao]||x.acao)}</b> · ${mtEsc(x.alvo||'')}<br>${mtEsc(msDe(x.em)?new Date(msDe(x.em)).toLocaleString('pt-BR'):'')} · por ${mtEsc(x.por||'')}${x.origem==='servidor'?' (servidor)':''}</div>`).join('') || '<div class="mt-muted">Nenhuma ação registrada ainda.</div>'}</div>
      <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  }catch(e){ $('modal-inner').innerHTML = `<h3>🧾 Registro de ações</h3><p class="mt-muted">Não consegui ler o registro (${mtEsc((e&&e.code)||'erro')}). Publique as regras desta versão (coleção adminLog).</p><button class="btn btn-ghost btn-block" onclick="closeModal()">Fechar</button>`; }
}

Object.assign(window, { admPremium, admEncerrar, admBloquear, admBloquearConfirma, admExcluirConta, admExcluirContaGo, admExcluirSoDados, admApagarRegistroAdmin, openAdminLog, admRegistrar, fnChamar });

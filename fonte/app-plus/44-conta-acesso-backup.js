
// =====================================================================
// 44. Beta 42 — Confirmação de e-mail, Google × e-mail e senha, teste Premium, backup protegido
// =====================================================================

// ---------- 1. Confirmação de e-mail sem precisar sair e entrar de novo ----------
// CAUSA: depois que o aluno clica no link, o Firebase só muda o estado no servidor. No aparelho, o objeto
// do usuário (emailVerified) e o TOKEN de acesso continuam os antigos até o login seguinte — e as regras
// do Firestore olham o token (email_verified). O botão "Já confirmei" só recarregava a página: o app subia
// com o mesmo token antigo, a leitura do plano era recusada (permission-denied) e aparecia "Não foi
// possível entrar". Sair e entrar gerava um token novo — por isso "funcionava" assim.
// AGORA: user.reload() busca o estado no servidor e getIdToken(true) troca o token na hora; a checagem de
// acesso roda de novo sem recarregar a página e sem criar nada novo.
function _mtPrazo(p, ms){ return Promise.race([p, new Promise((_, r)=>setTimeout(()=>r(Object.assign(new Error('timeout'), { code:'timeout' })), ms))]); }
function _mtEmailReal(u){ const em = String((u && u.email) || '').toLowerCase(); return !!em && !ehLoginInterno(em); }
async function mtAtualizaVerificacao(user){
  if(!user || !_mtEmailReal(user)) return user;
  try{
    if(!user.emailVerified && typeof user.reload === 'function'){ await _mtPrazo(user.reload(), 9000); user = fbAuth.currentUser || user; }
    if(user.emailVerified && typeof user.getIdTokenResult === 'function'){
      const r = await _mtPrazo(user.getIdTokenResult(), 9000);
      if(!r || !r.claims || r.claims.email_verified !== true) await _mtPrazo(user.getIdToken(true), 9000);
    }
  }catch(e){ console.log('verificação do e-mail:', e); }
  return user;
}
const _afterSignInB42 = window.afterGoogleSignIn;
window.afterGoogleSignIn = async function(user){
  user = await mtAtualizaVerificacao(user);
  return _afterSignInB42.call(this, user);
};
let _mtConferindo = false;
window.retryAccessCheck = async function(){
  if(_mtConferindo) return;                       // um toque só: nada de checagens em paralelo
  const b = $('noaccess-retry'); const st = mtNoaccessStatus();
  let u = fbAuth.currentUser || fbUser;
  if(!u){ try{ location.reload(); }catch(e){} return; }
  _mtConferindo = true;
  if(b){ b.disabled = true; b.dataset.txt = b.dataset.txt || b.textContent; b.textContent = 'Verificando...'; }
  if(st) st.textContent = '';
  try{
    try{ localStorage.removeItem('metatreino_access_' + String(u.email||'').toLowerCase()); }catch(e){}
    u = await mtAtualizaVerificacao(u);
    if(_mtEmailReal(u) && !u.emailVerified){
      if(st) st.innerHTML = 'Ainda não recebemos a confirmação deste e-mail. Abra o link que enviamos (veja também o spam) e toque de novo. Se o link expirou, use <b>Reenviar</b>.';
      return;
    }
    window.__acessoErro = '';
    await window.afterGoogleSignIn(u);            // segue direto para o app, sem novo login
  }catch(e){
    console.log('conferir acesso:', e); try{ if(window.mtLogAcesso) mtLogAcesso((e && (e.code||e.message)) || 'erro', 'tentar-novamente', u); }catch(x){}
    if(st) st.textContent = 'Não conseguimos verificar seu acesso agora. Confira sua internet e tente novamente em alguns instantes.';
  }finally{
    _mtConferindo = false;
    if(b){ b.disabled = false; b.textContent = b.dataset.txt || 'Tentar de novo'; }
  }
};
function mtNoaccessStatus(){
  let st = $('noaccess-st');
  if(!st){ const rt = $('noaccess-retry'); if(!rt) return null; st = document.createElement('div'); st.id = 'noaccess-st'; st.className = 'na-status'; st.setAttribute('role','status'); st.setAttribute('aria-live','polite'); rt.before(st); }
  return st;
}

// ---------- 2. Google × e-mail e senha: a MESMA conta ----------
// O app já junta os dados de logins diferentes com o mesmo e-mail VERIFICADO (contas/{email}, Beta 34).
// Isso falhava quando a primeira sessão por e-mail ficava com o token antigo (item 1): o vínculo não era
// gravado e o login pelo Google, sem achar nada, abria um cadastro novo. Corrigido o item 1, o vínculo
// nasce na primeira entrada confirmada. Além disso, agora os métodos são VINCULADOS no Firebase
// Authentication (um UID só), sempre provando a posse dos dois lados:
//   • Google com e-mail que já tem senha (erro account-exists-with-different-credential): pede a senha
//     da conta existente, entra nela e liga o Google a ela (linkWithCredential).
//   • Perfil › Formas de entrar: "Vincular Google" (linkWithPopup) e "Criar senha" (linkWithCredential),
//     com nova autenticação quando o Firebase pede (requires-recent-login).
// Nunca junta contas só porque o texto do e-mail é igual.
function _mtGoogleProvider(){ const p = new firebase.auth.GoogleAuthProvider(); try{ p.setCustomParameters({ prompt:'select_account' }); }catch(e){} return p; }
function _mtProvedores(u){ return ((u && u.providerData) || []).map(p=>p && p.providerId).filter(Boolean); }
window.doGoogleSignIn = function(){
  const btn = $('google-btn'), lbl = $('google-btn-lbl'), err = $('auth-err');
  if(btn && btn.dataset.ocupado === '1') return;
  if(err) err.innerHTML = '';
  if(btn){ btn.style.opacity = '0.7'; btn.dataset.ocupado = '1'; }
  if(lbl) lbl.textContent = 'Entrando...';
  const volta = ()=>{ if(btn){ btn.style.opacity = '1'; btn.dataset.ocupado = ''; } if(lbl) lbl.textContent = 'Continuar com Google'; };
  fbAuth.signInWithPopup(_mtGoogleProvider()).then(volta, e=>{
    console.log('Erro no login Google:', e); volta();
    if(e && e.code === 'auth/account-exists-with-different-credential') return mtVincularGoogleNaContaExistente(e);
    if(err && e && e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request')
      err.innerHTML = '<div class="err">' + (e.code === 'auth/popup-blocked' ? 'O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente de novo.' : 'Não foi possível entrar com o Google. Tente novamente.') + '</div>';
  });
};
function mtVincularGoogleNaContaExistente(e){
  const pend = e.credential || (firebase.auth.GoogleAuthProvider.credentialFromError ? firebase.auth.GoogleAuthProvider.credentialFromError(e) : null);
  const email = String(e.email || (e.customData && e.customData.email) || '').toLowerCase();
  window.__mtGooglePendente = pend;
  $('modal-inner').innerHTML = `<h3>Este e-mail já tem conta</h3>
    <p class="mt-muted" style="font-size:13.5px;line-height:1.55">A conta <b>${mtEsc(email)}</b> foi criada com e-mail e senha. Para entrar também pelo Google <b>na mesma conta</b> (com seus treinos, plano e histórico), confirme a senha uma vez.</p>
    <div class="field"><label>Senha da conta</label><input class="input" type="password" id="lk-pass" autocomplete="current-password"></div>
    <div id="lk-st" class="na-status" role="status" aria-live="polite"></div>
    <button class="btn btn-primary btn-block" id="lk-go" onclick="mtVincularGoogleConfirma('${jsAttr(email)}')">Confirmar e vincular o Google</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="mtEsqueciSenhaVinculo('${jsAttr(email)}')">Esqueci a senha</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`;
  $('modal-back').classList.add('on');
}
async function mtVincularGoogleConfirma(email){
  const b = $('lk-go'), st = $('lk-st'); if(b && b.disabled) return;
  const pass = ($('lk-pass')||{}).value || '';
  if(pass.length < 6){ if(st) st.textContent = 'Digite a senha da conta.'; return; }
  if(b){ b.disabled = true; b.textContent = 'Vinculando...'; }
  try{
    const cred = await fbAuth.signInWithEmailAndPassword(email, pass);   // prova que é o dono da conta
    if(window.__mtGooglePendente) await cred.user.linkWithCredential(window.__mtGooglePendente);   // e liga o Google a ela (mesmo UID)
    window.__mtGooglePendente = null;
    closeModal(); toast('Google vinculado: agora você entra pelos dois jeitos na mesma conta.');
  }catch(e){
    console.log('vincular Google:', e);
    if(b){ b.disabled = false; b.textContent = 'Confirmar e vincular o Google'; }
    if(st) st.textContent = (e && (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential')) ? 'Senha incorreta.' : authMsgErro(e && e.code);
  }
}
function mtEsqueciSenhaVinculo(email){
  fbAuth.sendPasswordResetEmail(email).then(()=>toast('Enviamos o link para criar uma nova senha. Depois volte e vincule o Google.'), e=>toast(authMsgErro(e && e.code)));
}
// mensagens: conta criada pelo Google e tentativa com e-mail e senha
const _authMsgErroB42 = window.authMsgErro;
window.authMsgErro = function(code){
  if(code === 'auth/email-already-in-use') return 'Já existe uma conta com esse e-mail — talvez criada pelo <b>Google</b>. Toque em <b>Continuar com Google</b> ou em <b>Já tenho conta</b>. Nenhuma conta nova foi criada.';
  if((code === 'auth/invalid-credential' || code === 'auth/wrong-password') && typeof authModo !== 'undefined' && authModo === 'entrar')
    return 'E-mail ou senha incorretos. <span style="display:block;margin-top:6px;font-size:12.5px;opacity:.9">Criou a conta pelo <b>Google</b>? Entre pelo botão do Google. Depois, em <b>Perfil › Formas de entrar</b>, você pode criar uma senha para a mesma conta (ou use <b>Esqueci a senha</b>).</span>';
  return _authMsgErroB42.apply(this, arguments);
};
// Perfil › Formas de entrar
function openFormasDeEntrar(){
  const u = fbAuth.currentUser || fbUser; if(!u) return;
  const prov = _mtProvedores(u); const temG = prov.includes('google.com'), temS = prov.includes('password');
  const linha = (nome, ok, acao)=>`<div class="fe-linha"><div><b>${nome}</b><small>${ok ? 'ativo nesta conta' : 'não vinculado'}</small></div>${ok ? '<span class="fe-ok">✓</span>' : acao}</div>`;
  $('modal-inner').innerHTML = `<h3>Formas de entrar</h3>
    <p class="mt-muted" style="font-size:13px;line-height:1.5">Todas levam à <b>mesma conta</b> (${mtEsc(u.email||'')}), com os mesmos treinos, plano e histórico.</p>
    ${linha('Google', temG, `<button class="btn btn-ghost" onclick="mtVincularGoogle()">Vincular</button>`)}
    ${linha('E-mail e senha', temS, `<button class="btn btn-ghost" onclick="mtCriarSenha()">Criar senha</button>`)}
    <div id="fe-st" class="na-status" role="status" aria-live="polite"></div>
    <button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function _feFala(t){ const s = $('fe-st'); if(s) s.innerHTML = t; }
async function mtVincularGoogle(){
  const u = fbAuth.currentUser; if(!u) return;
  try{
    const r = await u.linkWithPopup(_mtGoogleProvider());
    const g = ((r && r.user && r.user.providerData) || []).find(p=>p.providerId === 'google.com');
    if(g && g.email && u.email && g.email.toLowerCase() !== u.email.toLowerCase()){
      await r.user.unlink('google.com');            // conta Google de outro e-mail: desfaz para não confundir
      _feFala('Essa conta Google usa outro e-mail (' + mtEsc(g.email) + '). Escolha a conta Google de <b>' + mtEsc(u.email) + '</b>.'); return;
    }
    toast('Google vinculado à sua conta.'); openFormasDeEntrar();
  }catch(e){
    console.log('vincular Google (perfil):', e);
    if(e && (e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use'))
      _feFala('Esse Google já tem um login próprio no MetaTreino. Entre com ele uma vez: com o mesmo e-mail confirmado, o app usa os <b>mesmos dados</b> desta conta.');
    else if(e && e.code === 'auth/requires-recent-login') _feFala('Por segurança, saia e entre de novo e tente outra vez.');
    else if(e && e.code !== 'auth/popup-closed-by-user') _feFala('Não foi possível vincular agora. Tente novamente em alguns instantes.');
  }
}
function mtCriarSenha(){
  const u = fbAuth.currentUser; if(!u) return;
  $('modal-inner').innerHTML = `<h3>Criar senha</h3>
    <p class="mt-muted" style="font-size:13px;line-height:1.5">Para entrar também com <b>${mtEsc(u.email||'')}</b> e senha, na mesma conta.</p>
    <div class="field"><label>Nova senha (mín. 6)</label><input class="input" type="password" id="cs-1" autocomplete="new-password"></div>
    <div class="field"><label>Repita a senha</label><input class="input" type="password" id="cs-2" autocomplete="new-password"></div>
    <div id="cs-st" class="na-status" role="status" aria-live="polite"></div>
    <button class="btn btn-primary btn-block" id="cs-go" onclick="mtCriarSenhaGo()">Criar senha</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openFormasDeEntrar()">Voltar</button>`;
}
async function mtCriarSenhaGo(){
  const u = fbAuth.currentUser; const b = $('cs-go'), st = $('cs-st'); if(!u || (b && b.disabled)) return;
  const p1 = ($('cs-1')||{}).value || '', p2 = ($('cs-2')||{}).value || '';
  if(p1.length < 6) return st && (st.textContent = 'A senha precisa ter pelo menos 6 caracteres.');
  if(p1 !== p2) return st && (st.textContent = 'As duas senhas não são iguais.');
  if(b){ b.disabled = true; b.textContent = 'Criando...'; }
  const cred = firebase.auth.EmailAuthProvider.credential(u.email, p1);
  const liga = ()=>u.linkWithCredential(cred);
  try{
    try{ await liga(); }
    catch(e){
      if(e && e.code === 'auth/requires-recent-login'){ await u.reauthenticateWithPopup(_mtGoogleProvider()); await liga(); }   // prova a identidade pelo Google
      else throw e;
    }
    toast('Senha criada: agora você também entra com e-mail e senha.'); openFormasDeEntrar();
  }catch(e){
    console.log('criar senha:', e);
    if(b){ b.disabled = false; b.textContent = 'Criar senha'; }
    if(st) st.innerHTML = (e && (e.code === 'auth/email-already-in-use' || e.code === 'auth/credential-already-in-use' || e.code === 'auth/provider-already-linked'))
      ? 'Já existe um login com e-mail e senha para este endereço. Entre com ele uma vez: com o e-mail confirmado, o app usa os <b>mesmos dados</b>. Esqueceu a senha? Use "Esqueci a senha" na tela de entrada.'
      : authMsgErro(e && e.code);
  }
}
// trocar senha: quem tem Google E senha também pode trocar a senha
const _openChangePasswordB42 = window.openChangePassword;
window.openChangePassword = function(){
  const u = fbAuth.currentUser || fbUser; const prov = _mtProvedores(u);
  if(prov.includes('google.com') && !prov.includes('password')){
    $('modal-inner').innerHTML = `<h3>Senha</h3><p class="mt-muted" style="font-size:13px;line-height:1.5">Sua conta entra pelo <b>Google</b>. Se quiser entrar também com e-mail e senha, crie uma senha para esta mesma conta.</p>
      <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="mtCriarSenha()">Criar senha</button><button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
    $('modal-back').classList.add('on'); return;
  }
  if(prov.includes('google.com')){   // tem as duas: o formulário de troca de senha de sempre
    $('modal-inner').innerHTML = `<h3>🔑 Trocar minha senha</h3>
      <p style="color:var(--text-dim);font-size:13px;line-height:1.5">Sua conta: <b>${mtEsc(u.email||'')}</b> (entra também pelo Google)</p>
      <div class="field" style="margin-top:12px"><label>Senha atual</label><input class="input" type="password" id="cp-old" autocomplete="current-password"></div>
      <div class="field"><label>Nova senha (mín. 6)</label><input class="input" type="password" id="cp-new" autocomplete="new-password"></div>
      <div class="field"><label>Repita a nova senha</label><input class="input" type="password" id="cp-new2" autocomplete="new-password"></div>
      <div id="cp-err"></div>
      <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="doChangePassword()">Salvar nova senha</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`;
    $('modal-back').classList.add('on'); return;
  }
  return _openChangePasswordB42.apply(this, arguments);
};
mtGancho('renderProfile', { depois(){
  try{
    if($('formas-row')) return;
    const ref = [...document.querySelectorAll('#scr-profile .list-row')].find(r=>/openChangePassword/.test(r.getAttribute('onclick')||''));
    const row = document.createElement('div'); row.className = 'list-row'; row.id = 'formas-row'; row.setAttribute('onclick', 'openFormasDeEntrar()');
    row.innerHTML = '<span>🔐</span> <span>Formas de entrar</span><span style="margin-left:auto;color:var(--text-mute);font-size:12px">Google · e-mail ›</span>';
    if(ref) ref.before(row);
  }catch(e){}
}});

// ---------- 3. Teste Premium de 30 dias: começa ao concluir o perfil ----------
// Regra: a contagem começa quando o aluno conclui a configuração inicial do perfil (antes começava na primeira
// entrada com e-mail confirmado, ainda no meio do cadastro). Uma vez por e-mail: o documento do plano já
// existir impede um novo teste (regras do Firestore) — "Começar do zero" não reinicia nada.
// Durante o cadastro, quem ainda vai ganhar o teste já pode escolher os temas Premium.
const _criaTesteB42 = window.criaTestePremium;
window.__mtPodeCriarTeste = false;
window.criaTestePremium = async function(){
  if(!window.__mtPodeCriarTeste) return null;          // login: não cria; quem cria é o fim do perfil
  return _criaTesteB42.apply(this, arguments);
};
function mtPerfilPronto(){ return !!(state && state.user && state.user.profile && state.user.profile.quiz_done); }
function mtTestePendente(){
  try{
    const u = fbAuth.currentUser || fbUser;
    return !!(u && _mtEmailReal(u) && u.emailVerified && !myAccess && state && state.user && !state.user.isAdmin && !mtPerfilPronto());
  }catch(e){ return false; }
}
const _mtPremiumB42 = window.mtPremium;
window.mtPremium = function(){ return _mtPremiumB42.apply(this, arguments) || mtTestePendente(); };
let _mtTesteCriando = false;
async function mtTesteIniciar(origem){
  const u = fbAuth.currentUser || fbUser;
  if(_mtTesteCriando || !u || !_mtEmailReal(u) || !u.emailVerified || !state.user || state.user.isAdmin || !mtPerfilPronto()) return null;
  if(myAccess) return null;
  _mtTesteCriando = true;
  try{
    const email = String(u.email).toLowerCase();
    const d = await _mtPrazo(db.collection('usuariosAutorizados').doc(email).get(), 9000);
    if(d.exists){ myAccess = d.data(); return null; }           // já teve teste/plano: nunca cria outro
    window.__mtPodeCriarTeste = true;
    const al = await window.criaTestePremium(email, (state.user.profile && state.user.profile.nickname) || u.displayName);
    myAccess = al;
    try{ localStorage.setItem('metatreino_access_' + email, JSON.stringify({ v:40, isAdmin:false, allowData:al, at:Date.now() })); }catch(e){}
    try{ mtPlanoVerifica(); }catch(e){}
    const ate = new Date(Date.now() + TESTE_PREMIUM_DIAS*86400000).toLocaleDateString('pt-BR');
    setTimeout(()=>toast(`⭐ Seu teste Premium de 30 dias começou hoje e vai até ${ate}.`, 5000), origem === 'perfil' ? 900 : 2500);
    return al;
  }catch(e){ console.log('teste Premium (segue no Básico):', e); return null; }
  finally{ window.__mtPodeCriarTeste = false; _mtTesteCriando = false; }
}
mtGancho('saveQuiz', { depois(){ if(mtPerfilPronto()) mtTesteIniciar('perfil'); } });
mtGancho('bootAfterAuth', { depois(){ setTimeout(()=>{ if(mtPerfilPronto()) mtTesteIniciar('entrada'); }, 1200); } });

// texto do cadastro: fica no index.html (#auth-teste), logo abaixo do botão do Google — vale para as duas formas de criar conta
function mtComoFuncionaTeste(){
  const inc = ['biblioteca','alimentacao','relatorio','assistente','temas','inicioCompleto','clima'].map(k=>MT_RECURSOS[k] && `<li>${mtEsc(MT_RECURSOS[k].nome)}</li>`).filter(Boolean).join('');
  $('modal-inner').innerHTML = `<h3>Como funciona o teste gratuito</h3>
    <div class="tf-lista">
      <div><b>Quando começa</b><span>Os 30 dias começam a contar quando você conclui a configuração inicial do seu perfil (depois de confirmar o e-mail). O app avisa a data de término.</span></div>
      <div><b>O que está incluído</b><span>Tudo do plano Básico e mais:</span><ul>${inc}</ul></div>
      <div><b>Quando termina</b><span>A conta passa sozinha para o plano Básico, que é gratuito. Não existe cobrança automática nem cartão de crédito.</span></div>
      <div><b>Seus dados</b><span>Treinos, histórico, cargas, evolução e conquistas continuam todos com você. O que é Premium fica guardado e volta se você contratar.</span></div>
      <div><b>Uma vez por conta</b><span>O teste vale uma vez por e-mail. Usar "Começar do zero" não reinicia a contagem.</span></div>
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal()">Entendi</button>`;
  $('modal-back').classList.add('on');
}

// ---------- 4. Backup ligado à conta que o criou ----------
// O arquivo leva o UID do dono e um resumo (SHA-256) do conteúdo; o mesmo resumo é registrado na nuvem em
// usuarios/{uid}/backups/{resumo}, que só a própria conta lê (regras do Firestore). Para importar:
//   1) o resumo tem que bater com o conteúdo (arquivo editado = recusado);
//   2) o registro tem que existir NA CONTA DE QUEM IMPORTA — editar o "dono" dentro do JSON não adianta.
// Backups antigos (sem resumo) entram se forem da mesma conta (e-mail do backup = e-mail da conta).
// Exceção: o suporte (administrador) libera a restauração para um e-mail por 24 h (liberacoesBackup/{email}).
async function _mtSha256(txt){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
window.exportMyData = async function(){
  let arquivo = null;
  if(typeof arqTemArquivo === 'function' && arqTemArquivo()){
    toast('📦 Juntando seu arquivo anual...');
    try{ const docs = (await arqCarregar()).docs; arquivo = {}; Object.keys(docs).forEach(id=>{ arquivo[id] = _arqLer(docs[id]); }); }catch(e){ toast('📶 Sem conexão: o backup vai sem o arquivo anual (os últimos 90 dias vão completos)'); }
  }
  const dados = JSON.parse(JSON.stringify(arquivo ? { estado:state, arquivo } : { estado:state }));
  const hash = await _mtSha256(JSON.stringify(dados));
  const dono = uidDados();
  try{ await _mtPrazo(db.collection('usuarios').doc(dono).collection('backups').doc(hash).set({ em:Date.now(), versao:APP_VERSION, tam:JSON.stringify(dados).length }), 9000); }
  catch(e){ console.log('registro do backup (fica na fila e sobe quando a internet voltar):', e); }
  const data = { app:'MetaTreino', versao:APP_VERSION, formato:2, exportadoEm:new Date().toISOString(), dono, hash, dados };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `metatreino-backup-${chaveDia(new Date())}.json`;
  a.click();
  toast('📥 Backup baixado — ele só pode ser restaurado nesta conta');
};
async function mtBackupLiberado(){
  try{ const em = String((fbUser && fbUser.email) || '').toLowerCase(); if(!em) return false;
    const d = await _mtPrazo(db.collection('liberacoesBackup').doc(em).get(), 8000);
    return d.exists && +d.data().ate > Date.now(); }catch(e){ return false; }
}
function mtBackupRecusado(motivo){
  const c = (typeof coachContact !== 'undefined' && coachContact) || {};
  const n = String(c.whatsapp||'').replace(/\D/g,'');
  const msg = encodeURIComponent('Olá! Preciso restaurar um backup do MetaTreino na minha conta' + (fbUser && fbUser.email ? ' (' + fbUser.email + ')' : '') + '.');
  $('modal-inner').innerHTML = `<h3>Backup não pode ser restaurado</h3>
    <p class="mt-muted" style="font-size:13.5px;line-height:1.55">${motivo}</p>
    <p class="mt-muted" style="font-size:12.5px;line-height:1.5">Seus dados atuais <b>não foram alterados</b>. Se este backup é realmente seu (por exemplo, de uma conta antiga), o suporte pode confirmar sua identidade e liberar a restauração.</p>
    ${n ? `<a class="btn btn-ghost btn-block" href="https://wa.me/${n}?text=${msg}" target="_blank" rel="noopener">Falar com o suporte</a>` : ''}
    <button class="btn btn-primary btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function _mtRestaura(est, data, liberado){
  appConfirm(`Seus dados atuais serão SUBSTITUÍDOS pelos do arquivo.${liberado ? '\n\nRestauração liberada pelo suporte.' : ''}`, ()=>{
    const keepUser = { ...est.user, email: state.user.email, isAdmin: state.user.isAdmin };
    state = {...state, ...est, user:keepUser, ui:{tab:'home',selectedSession:null}};
    if(!state.modules || typeof state.modules !== 'object') state.modules = {lift:null, run:null};
    try{ migrateExerciseIds(); }catch(e){ console.log('Erro ao sanear o backup:', e); }
    ensureStats(); saveData(); syncToCloud();
    const arq = (data.dados && data.dados.arquivo) || data.arquivo;
    try{ if(arq && typeof arqRestaurar==='function') arqRestaurar(arq); }catch(e){ console.log('arquivo do backup:', e); }
    toast('✅ Backup restaurado com sucesso!'); goTab('home');
  }, {title:'Restaurar backup?', emo:'📥', okLabel:'Sim, restaurar', danger:true});
}
window.importMyData = function(ev){
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async ()=>{
    let data;
    try{ data = JSON.parse(reader.result); }catch(e){ toast('⚠️ Não foi possível ler o arquivo'); return; }
    const est = (data && data.dados && data.dados.estado) || (data && data.estado) || data;
    if(!est || !est.user){ toast('⚠️ Arquivo inválido — não parece um backup do MetaTreino'); return; }
    if('modules' in est && (est.modules === null || typeof est.modules !== 'object')){ toast('⚠️ Backup corrompido: a parte dos treinos está inválida'); return; }
    if(navigator.onLine === false){ toast('📶 Para restaurar um backup é preciso internet (a conta dona do arquivo é conferida na nuvem).'); return; }
    toast('Conferindo o backup...');
    try{
      if(data.formato === 2 && data.dados){
        const h = await _mtSha256(JSON.stringify(data.dados));
        if(h !== data.hash) return mtBackupRecusado('O conteúdo deste arquivo foi <b>alterado</b> depois de ser criado.');
        const reg = await _mtPrazo(db.collection('usuarios').doc(uidDados()).collection('backups').doc(h).get(), 9000);
        if(reg.exists) return _mtRestaura(est, data, false);
        if(await mtBackupLiberado()) return _mtRestaura(est, data, true);
        return mtBackupRecusado('Este backup foi criado em <b>outra conta</b> do MetaTreino e só pode ser restaurado nela.');
      }
      // formato antigo (antes da Beta 42): sem resumo — vale se for desta mesma conta
      const emArq = String((est.user && est.user.email) || '').toLowerCase();
      const meu = String((state.user && state.user.email) || '').toLowerCase();
      if(emArq && emArq === meu) return _mtRestaura(est, data, false);
      if(await mtBackupLiberado()) return _mtRestaura(est, data, true);
      return mtBackupRecusado(emArq ? 'Este backup antigo pertence a <b>outra conta</b> do MetaTreino.' : 'Não foi possível confirmar a conta dona deste backup antigo.');
    }catch(e){ console.log('importar backup:', e); toast('⚠️ Não consegui conferir o backup agora. Confira a internet e tente de novo — nada foi alterado.'); }
  };
  reader.readAsText(file);
  ev.target.value = '';
};

// ---------- 5. Montagem do plano: erro vira mensagem com "Tentar de novo" ----------
// O plano é gerado ANTES da tela de montagem aparecer (ela mostra o que foi feito de verdade), então a tela
// nunca some antes do resultado. Se a geração falhar, antes nada acontecia (o botão parecia não funcionar).
const _finishSetupB42 = window.finishSetup;
window.finishSetup = function(m){
  try{ return _finishSetupB42.apply(this, arguments); }
  catch(e){
    console.log('montar plano:', e);
    try{ const ov = $('building-ov'); if(ov){ ov.className = ''; ov.innerHTML = ''; ov.setAttribute('style','display:none'); } }catch(x){}
    $('modal-inner').innerHTML = `<h3>Não consegui montar seu plano</h3>
      <p class="mt-muted" style="font-size:13.5px;line-height:1.55">Algo deu errado ao preparar o planejamento. Suas respostas continuam aqui — nada foi perdido.</p>
      <button class="btn btn-primary btn-block" onclick="closeModal();setTimeout(()=>finishSetup('${m==='run'?'run':'lift'}'),80)">Tentar de novo</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Voltar e revisar</button>`;
    $('modal-back').classList.add('on');
  }
};

// o plano já foi gerado e salvo; se a abertura dele falhar no fim da tela de montagem, o aluno não fica preso
function mtMontagemErro(m, e){
  try{ const ov = $('building-ov'); if(ov){ ov.className = ''; ov.innerHTML = ''; ov.setAttribute('style','display:none'); } }catch(x){}
  $('modal-inner').innerHTML = `<h3>Seu plano está pronto</h3>
    <p class="mt-muted" style="font-size:13.5px;line-height:1.55">O plano foi montado e salvo, mas não consegui abrir a tela dele agora.</p>
    <button class="btn btn-primary btn-block" onclick="closeModal();goTab('home')">Abrir meu plano</button>`;
  $('modal-back').classList.add('on');
}

Object.assign(window, { mtMontagemErro, mtAtualizaVerificacao, openFormasDeEntrar, mtVincularGoogle, mtCriarSenha, mtCriarSenhaGo, mtVincularGoogleConfirma, mtEsqueciSenhaVinculo,
  mtTesteIniciar, mtTestePendente, mtComoFuncionaTeste, mtBackupLiberado });

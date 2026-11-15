
// =====================================================================
// Beta 43 — Diagnóstico seguro das falhas de acesso
// =====================================================================
// O aluno vê só uma mensagem simples ("Não foi possível acessar sua conta").
// O detalhe técnico vai para a coleção diagnosticoAcesso, que só o
// administrador principal lê. Nada de e-mail, UID, nome ou dados de treino:
//   codigo   → código do erro (ex.: permission-denied), cortado em 80 letras
//   etapa    → em que momento falhou (verificar-acesso, tentar-novamente…)
//   versao, plataforma, provedor (google.com / password), online
//   emailVerificado / tokenVerificado → as duas visões do "e-mail confirmado"
//     (quando divergem, a credencial estava desatualizada: causa do permission-denied)
//   conta    → 12 primeiros caracteres do SHA-256 do e-mail em minúsculas.
//              O principal compara esse resumo com a lista de alunos no próprio
//              aparelho; o e-mail em si nunca sai do celular do aluno.
// A mesma falha (código + etapa) é registrada no máximo uma vez a cada 10 min.

async function _diagHash(txt){
  try{
    if(!(window.crypto && crypto.subtle && window.TextEncoder)) return null;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(txt||'').trim().toLowerCase()));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,12);
  }catch(e){ return null; }
}
function _diagPlataforma(){
  const ua = navigator.userAgent || '';
  const so = /android/i.test(ua) ? 'android' : /iphone|ipad|ipod/i.test(ua) ? 'ios' : /windows/i.test(ua) ? 'windows' : /mac os/i.test(ua) ? 'mac' : /linux/i.test(ua) ? 'linux' : 'outro';
  let pwa = false; try{ pwa = !!(window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }catch(e){}
  return so + (pwa ? '-app' : '-navegador');
}
function _diagCodigo(c){
  // tira qualquer coisa que pareça e-mail ou identificador longo, por garantia
  return String(c||'erro').replace(/[^\s@]+@[^\s@]+/g,'[email]').replace(/[A-Za-z0-9_-]{24,}/g,'[id]').slice(0,80);
}
async function mtLogAcesso(codigo, etapa, user){
  try{
    if(typeof db === 'undefined' || !db || !db.collection) return false;
    const u = user || (typeof fbUser !== 'undefined' ? fbUser : null);
    if(!u) return false;                      // sem login as regras recusam; não insiste
    const cod = _diagCodigo(codigo), et = String(etapa||'acesso').slice(0,40);
    const chave = 'mtDiag:' + cod + ':' + et;
    try{ const ult = +localStorage.getItem(chave) || 0; if(Date.now() - ult < 10*60*1000) return false; localStorage.setItem(chave, String(Date.now())); }catch(e){}
    let tokenVerificado = null;
    try{ if(u.getIdTokenResult){ const t = await u.getIdTokenResult(); tokenVerificado = !!(t && t.claims && t.claims.email_verified); } }catch(e){}
    const doc = {
      codigo: cod, etapa: et,
      versao: String((typeof APP_VERSION !== 'undefined' && APP_VERSION) || (window.MTP && MTP.versao) || '').slice(0,30),
      plataforma: _diagPlataforma().slice(0,40),
      provedor: String((u.providerData && u.providerData[0] && u.providerData[0].providerId) || (u.isAnonymous ? 'anonimo' : 'desconhecido')).slice(0,30),
      emailVerificado: !!u.emailVerified,
      tokenVerificado,
      online: navigator.onLine !== false,
      em: firebase.firestore.FieldValue.serverTimestamp()
    };
    const h = u.email ? await _diagHash(u.email) : null; if(h) doc.conta = h;
    if(tokenVerificado === null) delete doc.tokenVerificado;
    await db.collection('diagnosticoAcesso').add(doc);
    return true;
  }catch(e){ console.log('diagnóstico de acesso não registrado:', e && (e.code || e.message)); return false; }
}

// o botão da tela de acesso usa o mesmo texto da mensagem ("Tentar novamente")
function _diagRotuloRetry(){
  try{ const b = $('noaccess-retry'); if(b && /^\s*(🔄\s*)?Tentar de novo\s*$/.test(b.textContent)){ b.textContent = '🔄 Tentar novamente'; if(b.dataset.txt) b.dataset.txt = b.textContent; } }catch(e){}
}
const _afterSignInB43 = window.afterGoogleSignIn;
if(typeof _afterSignInB43 === 'function'){
  window.afterGoogleSignIn = async function(){
    try{ return await _afterSignInB43.apply(this, arguments); }
    finally{ _diagRotuloRetry(); }
  };
}

// ---------- painel do administrador principal ----------
const DIAG_ETAPA = { 'verificar-acesso':'Ao entrar no app', 'tentar-novamente':'Ao tocar em Tentar novamente' };
function _diagExplica(x){
  const c = String(x.codigo||'');
  if(/permission|insufficient/i.test(c)){
    if(x.emailVerificado && x.tokenVerificado === false) return 'Credencial desatualizada: o e-mail já foi confirmado, mas o login ainda carregava o estado antigo. A Beta 43 renova a credencial e tenta de novo sozinha.';
    if(!x.emailVerificado) return 'E-mail ainda não confirmado: as regras só liberam a leitura da autorização para e-mail verificado (correto).';
    return 'O Firestore recusou a leitura. Confira se as regras publicadas são as da Beta 43 e se a conta não está excluída.';
  }
  if(/unavailable|network|offline|timeout|deadline/i.test(c) || x.online === false) return 'Falha de conexão no aparelho do aluno (internet fraca ou sem sinal).';
  return 'Erro não classificado: anote o código e a versão.';
}
async function openDiagnosticoAcesso(){
  if(!mtPrincipal()) return;
  $('modal-inner').innerHTML = `<h3>🩺 Diagnóstico de acesso</h3><div class="mt-muted">Carregando…</div>`; $('modal-back').classList.add('on');
  try{
    const s = await db.collection('diagnosticoAcesso').orderBy('em','desc').limit(60).get();
    const L = []; s.forEach(d=>L.push({ id:d.id, ...d.data() }));
    L.sort((a,b)=>msDe(b.em)-msDe(a.em));
    // liga o resumo ao aluno, só neste aparelho (o resumo é calculado aqui a partir da lista que o admin já vê)
    const mapa = {};
    try{ const emails = Object.keys((typeof allowCache !== 'undefined' && allowCache) || {}); for(const em of emails){ const h = await _diagHash(em); if(h) mapa[h] = em; } }catch(e){}
    window.__diagIds = L.map(x=>x.id);
    $('modal-inner').innerHTML = `<h3>🩺 Diagnóstico de acesso</h3>
      <p class="mt-muted" style="font-size:12px;line-height:1.5">Falhas técnicas que o aluno não vê na tela. Não guardam e-mail nem UID; o nome do aluno aparece só quando o resumo da conta bate com alguém da sua lista.</p>
      <div style="max-height:55vh;overflow:auto">${L.map(x=>`<div class="adm-log"><b>${mtEsc(x.codigo||'erro')}</b> · ${mtEsc(DIAG_ETAPA[x.etapa]||x.etapa||'')}<br>
        <small>${mtEsc(msDe(x.em)?new Date(msDe(x.em)).toLocaleString('pt-BR'):'')} · ${mtEsc(x.versao||'')} · ${mtEsc(x.plataforma||'')} · ${mtEsc(x.provedor||'')}</small><br>
        <small>Conta: ${x.conta ? (mapa[x.conta] ? mtEsc(mapa[x.conta]) : 'não está na sua lista (' + mtEsc(x.conta) + ')') : '—'} · e-mail confirmado: ${x.emailVerificado?'sim':'não'}${x.tokenVerificado===undefined?'':' (credencial: '+(x.tokenVerificado?'sim':'não')+')'}</small>
        <div style="font-size:12px;margin-top:4px;line-height:1.45">${mtEsc(_diagExplica(x))}</div></div>`).join('') || '<div class="mt-muted">Nenhuma falha registrada.</div>'}</div>
      ${L.length?`<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="diagLimpar()">🧹 Apagar estes registros</button>`:''}
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
  }catch(e){
    $('modal-inner').innerHTML = `<h3>🩺 Diagnóstico de acesso</h3><p class="mt-muted">Não consegui ler os registros (${mtEsc((e&&e.code)||'erro')}). Publique as regras da Beta 43 (coleção diagnosticoAcesso).</p><button class="btn btn-ghost btn-block" onclick="closeModal()">Fechar</button>`;
  }
}
function diagLimpar(){
  const ids = (window.__diagIds||[]).slice(); if(!ids.length) return;
  appConfirm(`Apagar ${ids.length} registro(s) de diagnóstico?`, async ()=>{
    let ok = 0; for(const id of ids){ try{ await db.collection('diagnosticoAcesso').doc(id).delete(); ok++; }catch(e){} }
    toast(ok === ids.length ? 'Registros apagados' : `Apaguei ${ok} de ${ids.length}`); openDiagnosticoAcesso();
  }, { title:'Apagar diagnóstico?', okLabel:'Apagar' });
}
mtGancho('goAdmin', { depois(){
  try{
    if(!mtPrincipal() || $('adm-diag-row')) return;
    const ref = $('adm-excl-row') || $('adm-tam-row') || $('adm-log-row'); if(!ref) return;
    const d = document.createElement('div'); d.className = 'list-row'; d.id = 'adm-diag-row'; d.onclick = openDiagnosticoAcesso;
    d.innerHTML = '🩺 <span>Diagnóstico de acesso</span><span style="margin-left:auto;font-size:11px;color:var(--text-dim)">falhas técnicas</span>'; ref.after(d);
  }catch(e){}
}});
Object.assign(window, { mtLogAcesso, openDiagnosticoAcesso, diagLimpar });

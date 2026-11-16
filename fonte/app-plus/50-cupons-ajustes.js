
// =====================================================================
// 50. Beta 48 — Cupons de Premium (divulgação) e ajustes vistos nos prints
// =====================================================================
// CUPONS
//  • Admin (Painel › 🎟️ Cupons de Premium): cria uma campanha com N cupons (até 100), cada um vale X dias de
//    Premium (1 a 365) e pode ter data-limite para resgate. Copia a lista para divulgar; acompanha quantos já
//    foram usados; apaga os que ninguém usou.
//  • Aluno (Planos ou aviso de recurso Premium › "Tenho um cupom"): digita o código. Cada cupom vale UMA vez.
//    Os dias somam ao que a pessoa já tem (teste ou Premium com prazo). Quem tem Premium sem prazo não precisa.
//  • Segurança (firestore.rules): o aluno só consegue se dar Premium junto com o uso de um cupom válido e livre,
//    na mesma gravação, e com no máximo os dias daquele cupom. Tudo no plano gratuito do Firebase (sem Functions).

const CUPOM_LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function _cupomNorm(c){ return String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12); }
function _cupomFmt(c){ c = _cupomNorm(c); return c.length === 8 ? c.slice(0,4) + '-' + c.slice(4) : c; }
function _cupomNovo(){ const r = crypto.getRandomValues(new Uint32Array(8)); let s = ''; for(let i=0;i<8;i++) s += CUPOM_LETRAS[r[i] % CUPOM_LETRAS.length]; return s; }
const _cupData = ms => new Date(ms).toLocaleDateString('pt-BR');

const CUPOM_INTERVALO = 30*86400000;
function _cupomLiberaEm(acc){ if(acc && acc.cupomSemLimite === true) return 0; const em = acc && acc.cupomEm ? msDe(acc.cupomEm) : 0; return em ? em + CUPOM_INTERVALO : 0; }
// lê de novo o próprio acesso (o administrador pode ter liberado um cupom extra)
async function _cupomAtualizaAcesso(){
  try{
    const u = (typeof fbUser !== 'undefined' && fbUser) || null; if(!u || !u.email) return false;
    const d = await db.collection('usuariosAutorizados').doc(String(u.email).toLowerCase()).get();
    if(!d.exists) return false;
    const antes = _cupomLiberaEm(myAccess); myAccess = d.data(); return _cupomLiberaEm(myAccess) !== antes;
  }catch(e){ return false; }
}
// ---------- aluno: resgatar ----------
function openCupom(fresco){
  if(!fresco) _cupomAtualizaAcesso().then(mudou=>{ if(mudou && $('cupom-tela') && !(($('cupom-cod')||{}).value)) openCupom(true); });
  const p = planoAtual(); const libera = _cupomLiberaEm(myAccess), espera = libera > Date.now();
  $('modal-inner').innerHTML = `<div id="cupom-tela"><h3>🎟️ Tenho um cupom</h3>
    <p class="fam-p">Digite o código do cupom. Ele libera dias de Premium na sua conta. Cada pessoa usa um cupom a cada 30 dias.</p>
    ${p.premium && p.vitalicio ? '<p class="fam-p"><b>Você já tem Premium sem prazo</b>, então não precisa de cupom.</p>' : ''}
    ${espera && !(p.premium && p.vitalicio) ? `<p class="fam-p"><b>Você já usou um cupom.</b> O próximo pode ser usado a partir de <b>${_cupData(libera)}</b>.</p>` : ''}
    <input id="cupom-cod" class="input" maxlength="10" autocomplete="off" autocapitalize="characters" placeholder="Ex.: K7M2-QX4P" style="text-align:center;letter-spacing:3px;font-weight:800;text-transform:uppercase" oninput="this.value=this.value.toUpperCase()" data-teclado>
    <div id="cupom-msg" class="fam-mini" aria-live="polite" style="min-height:18px"></div>
    <button class="btn btn-primary btn-block" id="cupom-ok" onclick="cupomResgatar()" ${(p.premium && p.vitalicio) || espera ? 'disabled' : ''}>Usar cupom</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Voltar</button></div>`;
  $('modal-back').classList.add('on');
}
async function cupomResgatar(){
  const msg = t=>{ const e = $('cupom-msg'); if(e) e.textContent = t; };
  const bt = $('cupom-ok');
  const cod = _cupomNorm(($('cupom-cod')||{}).value);
  if(cod.length !== 8) return msg('O código tem 8 letras e números (ex.: K7M2-QX4P).');
  const u = (typeof fbUser !== 'undefined' && fbUser) || null;
  const email = String((u && u.email) || (state.user && state.user.email) || '').toLowerCase();
  if(!u || !email) return msg('Entre na sua conta para usar o cupom.');
  if(/@aluno\.metatreino\.app$/.test(email)) return msg('Contas criadas pelo treinador recebem o Premium direto com ele.');
  if(!u.emailVerified) return msg('Confirme seu e-mail antes de usar um cupom.');
  const p = planoAtual();
  if(p.premium && p.vitalicio) return msg('Você já tem Premium sem prazo.');
  if(bt){ bt.disabled = true; bt.textContent = 'Conferindo…'; }
  const volta = ()=>{ if(bt){ bt.disabled = false; bt.textContent = 'Usar cupom'; } };
  try{
    // um cupom por pessoa a cada 30 dias (as regras do Firestore conferem o mesmo)
    await _cupomAtualizaAcesso();
    const libera = _cupomLiberaEm(myAccess);
    if(libera > Date.now()){ if(bt) bt.textContent = 'Usar cupom'; return msg('Você já usou um cupom. O próximo pode ser usado a partir de ' + _cupData(libera) + '.'); }
    const cRef = db.collection('cupons').doc(cod);
    const cs = await cRef.get();
    if(!cs.exists){ volta(); return msg('Cupom não encontrado. Confira as letras e números.'); }
    const c = cs.data();
    if(c.usadoPor){ volta(); return msg(c.usadoPor === u.uid ? 'Você já usou este cupom.' : 'Este cupom já foi usado.'); }
    if(c.validoAte && Date.now() > msDe(c.validoAte)){ volta(); return msg('Este cupom venceu em ' + _cupData(msDe(c.validoAte)) + '.'); }
    const dias = Math.max(1, Math.min(365, parseInt(c.dias, 10) || 0));
    const base = Math.max(Date.now(), (p.premium && p.ate) ? p.ate : 0);
    const ate = Math.round(base + dias*86400000);
    const aRef = db.collection('usuariosAutorizados').doc(email);
    const as = await aRef.get();
    const b = db.batch();
    b.update(cRef, { usadoPor: u.uid, usadoEm: firebase.firestore.FieldValue.serverTimestamp() });
    const dadosPlano = { plano:'premium', premiumAte: ate, cupom: cod, cupomEm: firebase.firestore.FieldValue.serverTimestamp() };
    if(as.exists) b.update(aRef, dadosPlano);
    else b.set(aRef, Object.assign({ name: String((u.displayName)||'').slice(0,60) }, dadosPlano));
    await b.commit();
    try{ const d = await aRef.get(); if(d.exists) myAccess = d.data(); }catch(e){ myAccess = Object.assign({}, myAccess||{}, dadosPlano, { premiumAte: ate }); }
    try{ localStorage.removeItem('mt_acesso_' + email); }catch(e){}
    try{ mtPlanoVerifica(); }catch(e){}
    $('modal-inner').innerHTML = `<div class="pl-aviso"><div class="pl-selo">${PL_EST}Premium</div><h3>🎉 Cupom aplicado!</h3>
      <p class="pl-txt">Você ganhou <b>${dias} ${dias===1?'dia':'dias'} de Premium</b>. Seu Premium vai até <b>${_cupData(ate)}</b>.</p>
      <button class="btn btn-primary btn-block" onclick="closeModal();goTab(state.ui.tab||'home')">Continuar</button></div>`;
  }catch(e){
    console.log('cupom:', e && (e.code || e.message)); volta();
    msg(e && e.code === 'permission-denied' ? 'Não foi possível usar este cupom. Confira se a data e a hora do celular estão certas e tente de novo.' : 'Sem conexão agora. Tente de novo em instantes.');
  }
}
// "Tenho um cupom" na tela de planos e no aviso de recurso Premium
mtGancho('openPlanos', { depois(){ try{ _cupomBotao(); }catch(e){} } });
mtGancho('mtPremiumAviso', { depois(){ setTimeout(()=>{ try{ _cupomBotao(); }catch(e){} }, 90); } });
function _cupomBotao(){
  const p = planoAtual(); if(p.premium && p.vitalicio) return;
  const mi = $('modal-inner'); if(!mi || mi.querySelector('#cupom-btn')) return;
  const ref = [...mi.querySelectorAll('button')].pop(); if(!ref) return;
  ref.insertAdjacentHTML('beforebegin', '<button class="btn btn-ghost btn-block" id="cupom-btn" style="margin-top:8px" onclick="openCupom()">🎟️ Tenho um cupom</button>');
}

// ---------- admin: campanhas ----------
async function openCupons(){
  if(!mtAdmin()) return;
  $('modal-inner').innerHTML = `<h3>🎟️ Cupons de Premium</h3><div class="mt-muted">Carregando…</div>`; $('modal-back').classList.add('on');
  let L = [];
  try{ const s = await db.collection('cupons').get(); s.forEach(d=>L.push({ id:d.id, ...d.data() })); }
  catch(e){ $('modal-inner').innerHTML = `<h3>🎟️ Cupons de Premium</h3><p class="fam-p">Não consegui ler os cupons (${mtEsc((e&&e.code)||'erro')}). Publique as regras da Beta 48.</p><button class="btn btn-ghost btn-block" onclick="closeModal()">Fechar</button>`; return; }
  const camp = {};
  L.forEach(c=>{ const k = c.campanha || 'Sem nome'; const g = camp[k] = camp[k] || { nome:k, total:0, usados:0, dias:c.dias, validoAte:c.validoAte, criadoEm:0, livres:[], ids:[] }; g.total++; g.ids.push(c.id); if(c.usadoPor) g.usados++; else g.livres.push(c.id); g.criadoEm = Math.max(g.criadoEm, msDe(c.criadoEm)); });
  window.__cupomCamp = camp;
  const lista = Object.values(camp).sort((a,b)=>b.criadoEm-a.criadoEm);
  $('modal-inner').innerHTML = `<h3>🎟️ Cupons de Premium</h3>
    <p class="fam-p">Cada cupom libera dias de Premium e vale uma vez. Bom para divulgar em redes sociais.</p>
    <div class="cup-form">
      <label>Nome da campanha<input class="input" id="cup-nome" maxlength="40" placeholder="Ex.: Instagram novembro" data-teclado></label>
      <div class="cup-linha"><label>Quantidade<input class="input" id="cup-qtd" type="number" min="1" max="100" step="1" value="30"></label>
      <label>Dias de Premium<input class="input" id="cup-dias" type="number" min="1" max="365" step="1" value="30"></label></div>
      <label>Usar até (opcional)<input class="input" id="cup-ate" type="date"></label>
      <button class="btn btn-primary btn-block" onclick="cuponsCriar()">Criar cupons</button>
      <div id="cup-msg" class="fam-mini" aria-live="polite"></div>
    </div>
    <div class="fam-sec">Campanhas</div>
    ${lista.map(g=>`<div class="adm-log"><b>${mtEsc(g.nome)}</b> · ${g.dias} dias${g.validoAte?` · até ${_cupData(msDe(g.validoAte))}`:''}<br>
      <small>${g.usados} de ${g.total} usados · ${g.livres.length} livres</small>
      <div class="cup-acoes">${g.livres.length?`<button class="btn btn-ghost" onclick="cuponsCopiar('${mtJsStr(g.nome)}')">📋 Copiar livres</button><button class="btn btn-ghost" onclick="cuponsApagarLivres('${mtJsStr(g.nome)}')">Apagar livres</button>`:''}<button class="btn btn-ghost" onclick="cuponsApagarHistorico('${mtJsStr(g.nome)}')">🗑️ Apagar histórico</button></div></div>`).join('') || '<div class="mt-muted" style="font-size:13px">Nenhuma campanha ainda.</div>'}
    <div class="fam-sec">Quem usou cupom</div>
    <p class="fam-mini" style="margin-top:-4px">Cada pessoa usa 1 cupom a cada 30 dias. Aqui você libera um cupom extra ou tira o limite de alguém.</p>
    <div id="cup-pessoas"><div class="mt-muted" style="font-size:13px">Carregando…</div></div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  cuponsPessoas();
}
async function cuponsPessoas(){
  const box = $('cup-pessoas'); if(!box) return;
  let P = [];
  try{ const s = await db.collection('usuariosAutorizados').where('cupom', '>', '').get(); s.forEach(d=>{ const x = d.data(); if(x && x.cupom) P.push({ email:d.id, ...x }); }); }
  catch(e){ box.innerHTML = `<div class="mt-muted" style="font-size:13px">Não consegui ler (${mtEsc((e&&e.code)||'erro')}).</div>`; return; }
  P.sort((a,b)=>msDe(b.cupomEm)-msDe(a.cupomEm));
  window.__cupomPessoas = P;
  box.innerHTML = P.map((x,i)=>{
    const em = msDe(x.cupomEm), libera = _cupomLiberaEm(x);
    const st = x.cupomSemLimite ? '♾️ sem limite de 30 dias' : libera > Date.now() ? `próximo cupom a partir de ${_cupData(libera)}` : 'já pode usar outro cupom';
    return `<div class="adm-log" id="cup-p-${i}"><b>${mtEsc(x.name || x.email)}</b>${x.name ? `<br><small>${mtEsc(x.email)}</small>` : ''}<br>
      <small>último cupom: ${em ? _cupData(em) : '—'} · ${st}</small>
      <div class="cup-acoes">${!x.cupomSemLimite && libera > Date.now() ? `<button class="btn btn-ghost" onclick="cupomLiberarPessoa(${i})">🔓 Liberar 1 cupom agora</button>` : ''}
      <button class="btn btn-ghost" onclick="cupomSemLimitePessoa(${i})">${x.cupomSemLimite ? 'Voltar ao limite de 30 dias' : '♾️ Sem limite'}</button></div></div>`;
  }).join('') || '<div class="mt-muted" style="font-size:13px">Ninguém usou cupom ainda.</div>';
}
async function cupomLiberarPessoa(i){
  const x = (window.__cupomPessoas||[])[i]; if(!x || !mtAdmin()) return;
  try{
    await db.collection('usuariosAutorizados').doc(x.email).update({ cupomEm: firebase.firestore.FieldValue.delete(), cupomLiberadoEm: Date.now() });
    try{ if(typeof admRegistrar === 'function') admRegistrar('cupons', x.email, 'cupom extra liberado'); }catch(e){}
    toast('🔓 Liberado: a pessoa já pode usar outro cupom'); cuponsPessoas();
  }catch(e){ toast('Não consegui liberar agora (' + ((e&&e.code)||'erro') + ').'); }
}
async function cupomSemLimitePessoa(i){
  const x = (window.__cupomPessoas||[])[i]; if(!x || !mtAdmin()) return;
  const liga = !x.cupomSemLimite;
  try{
    await db.collection('usuariosAutorizados').doc(x.email).update({ cupomSemLimite: liga ? true : firebase.firestore.FieldValue.delete(), cupomLiberadoEm: Date.now() });
    try{ if(typeof admRegistrar === 'function') admRegistrar('cupons', x.email, liga ? 'cupons sem limite' : 'limite de 30 dias de volta'); }catch(e){}
    toast(liga ? '♾️ Essa pessoa pode usar cupons sem esperar 30 dias' : 'Limite de 30 dias de volta'); cuponsPessoas();
  }catch(e){ toast('Não consegui mudar agora (' + ((e&&e.code)||'erro') + ').'); }
}
function cuponsApagarHistorico(nome){
  const g = (window.__cupomCamp||{})[nome]; if(!g || !g.ids.length) return;
  appConfirm(`Apagar a campanha "${nome}" inteira (${g.total} cupons, ${g.usados} usados)? Quem já usou continua com o Premium e com o prazo que ganhou. Os códigos livres deixam de funcionar.`, async ()=>{
    try{
      for(let i=0; i<g.ids.length; i+=400){ const b = db.batch(); g.ids.slice(i, i+400).forEach(id=>b.delete(db.collection('cupons').doc(id))); await b.commit(); }
      try{ if(typeof admRegistrar === 'function') admRegistrar('cupons', nome, 'histórico apagado'); }catch(e){}
      toast('🗑️ Histórico da campanha apagado');
    }catch(e){ toast('Não consegui apagar agora (' + ((e&&e.code)||'erro') + ').'); }
    openCupons();
  }, { title:'Apagar histórico?', emo:'🗑️', okLabel:'Apagar', danger:true });
}
async function cuponsCriar(){
  const msg = t=>{ const e = $('cup-msg'); if(e) e.textContent = t; };
  const nome = String(($('cup-nome')||{}).value || '').trim().slice(0,40) || 'Campanha ' + new Date().toLocaleDateString('pt-BR');
  const qtd = parseInt(($('cup-qtd')||{}).value, 10), dias = parseInt(($('cup-dias')||{}).value, 10);
  const ateTxt = ($('cup-ate')||{}).value;
  if(!(qtd >= 1 && qtd <= 100)) return msg('Quantidade: de 1 a 100 por vez.');
  if(!(dias >= 1 && dias <= 365)) return msg('Dias de Premium: de 1 a 365.');
  let validoAte = null; if(ateTxt){ const d = new Date(ateTxt + 'T23:59:59'); if(isNaN(d) || d.getTime() < Date.now()) return msg('A data-limite precisa ser hoje ou depois.'); validoAte = d.getTime(); }
  msg('Criando…');
  const codigos = new Set(); while(codigos.size < qtd) codigos.add(_cupomNovo());
  try{
    const b = db.batch(); const agora = firebase.firestore.FieldValue.serverTimestamp();
    codigos.forEach(c=>b.set(db.collection('cupons').doc(c), { campanha:nome, dias, validoAte, usadoPor:null, usadoEm:null, criadoEm:agora }));
    await b.commit();
    try{ if(typeof admRegistrar === 'function') admRegistrar('cupons', nome, `${qtd} cupons de ${dias} dias`); }catch(e){}
    window.__cupomNovos = [...codigos];
    await openCupons();
    const txt = [...codigos].map(_cupomFmt).join('\n');
    $('modal-inner').insertAdjacentHTML('afterbegin', `<div class="cup-novos"><b>✅ ${qtd} cupons criados</b><textarea class="input" readonly rows="5" data-teclado>${mtEsc(txt)}</textarea><button class="btn btn-primary btn-block" onclick="cuponsCopiarTexto(window.__cupomNovos)">📋 Copiar os ${qtd} códigos</button></div>`);
  }catch(e){ console.log('cupons:', e); msg('Não consegui criar (' + ((e&&e.code)||'erro') + '). Confira se publicou as regras da Beta 48.'); }
}
function cuponsCopiarTexto(lista){
  const t = (lista||[]).map(_cupomFmt).join('\n');
  try{ navigator.clipboard.writeText(t).then(()=>toast('📋 Códigos copiados'), ()=>toast('Não consegui copiar; selecione o texto.')); }catch(e){ toast('Não consegui copiar; selecione o texto.'); }
}
function cuponsCopiar(nome){ const g = (window.__cupomCamp||{})[nome]; if(g) cuponsCopiarTexto(g.livres); }
function cuponsApagarLivres(nome){
  const g = (window.__cupomCamp||{})[nome]; if(!g || !g.livres.length) return;
  appConfirm(`Apagar os ${g.livres.length} cupons ainda não usados de "${nome}"? Quem já usou continua com o Premium.`, async ()=>{
    try{ const b = db.batch(); g.livres.forEach(id=>b.delete(db.collection('cupons').doc(id))); await b.commit(); toast('Cupons livres apagados'); }
    catch(e){ toast('Não consegui apagar agora.'); }
    openCupons();
  }, { title:'Apagar cupons livres?', emo:'🎟️', okLabel:'Apagar', danger:true });
}
mtGancho('goAdmin', { depois(){
  try{
    if(!mtAdmin() || $('adm-cupom-row')) return;
    const ref = $('adm-diag-row') || $('adm-excl-row') || $('adm-tam-row') || $('adm-log-row'); if(!ref) return;
    const d = document.createElement('div'); d.className = 'list-row'; d.id = 'adm-cupom-row'; d.onclick = openCupons;
    d.innerHTML = '🎟️ <span>Cupons de Premium</span><span style="margin-left:auto;font-size:11px;color:var(--text-dim)">divulgação</span>'; ref.after(d);
  }catch(e){}
}});

// ---------- ajustes ----------
// 1) cartão "Conquistas" do Início fica em dia assim que uma conquista é desbloqueada
let _b48MetT = 0;
mtGancho('unlockTrophy', { depois(){ clearTimeout(_b48MetT); _b48MetT = setTimeout(()=>{ try{ if(state.ui && state.ui.tab === 'home') renderHomeMetrics(); }catch(e){} }, 150); } });
mtGancho('goTab', { depois(t){ if(t === 'home') try{ renderHomeMetrics(); }catch(e){} } });
// 2) mais caminhos de registro contam como "fim do registro" para a janela de conquistas
['markRunDone','maLogLift','maLogActivity','_rSalvarSemKm'].forEach(n=>{ if(typeof window[n] === 'function') mtGancho(n, { antes(){ window.__mtRegEm = Date.now(); } }); });
// conquistas que esperavam o fim do feedback do treino (o app confere de novo ao fechar a janela)
mtGancho('closeModal', { antes(){ try{ if(typeof trofeuPendente !== 'undefined' && trofeuPendente) window.__mtRegEm = Date.now(); }catch(e){} } });
// 3) a ilustração do início segue o mesmo horário da saudação ("Boa noite" a partir das 18h = lua)
window._cenaHora = function(){ const h = new Date().getHours(); return h>=5 && h<9 ? 'amanhecer' : h>=9 && h<17 ? 'dia' : h>=17 && h<18 ? 'tarde' : 'noite'; };
// 4) tempo da atividade avulsa usa o seletor do app (números), não o teclado de texto
try{ if(typeof NR_CAMPOS !== 'undefined') NR_CAMPOS['act-min'] = { tipo:'dur', tit:'Tempo', h:false, maxMin:600 }; }catch(e){}

// 5) resposta atrasada do Meta Assistente não passa por cima de outra janela (ex.: "Limpar a conversa?")
const _maRefreshB48 = window.maRefreshThread;
window.maRefreshThread = function(){
  const mb = $('modal-back');
  if(!$('ma-thread') && mb && mb.classList.contains('on')){ try{ maSaveThread(); }catch(e){} return; }
  return _maRefreshB48.apply(this, arguments);
};

// 6) Tom de pele dos emojis de volta na tela "Estilo dos ícones" (some quando a Aparência foi refeita).
//    As amostras de cada tom mostram o próprio tom (não recebem o tom escolhido por cima).
window.aplicaTomEmoji = function(root){
  const mod = (EMOJI_TONES.find(x=>x.id===_emojiTone)||EMOJI_TONES[0]).mod;
  const w = document.createTreeWalker(root||document.body, NodeFilter.SHOW_TEXT, { acceptNode:n=>{ const pe = n.parentNode; const p = pe && pe.nodeName;
    if(p==='SCRIPT'||p==='STYLE'||p==='TEXTAREA'||p==='NOSCRIPT') return NodeFilter.FILTER_REJECT;
    if(pe && pe.closest && pe.closest('[data-tom-fixo]')) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT; } });
  const lista = []; let n; while(n = w.nextNode()) lista.push(n);
  lista.forEach(t=>{ const novo = _aplicaTomTexto(t.nodeValue, mod); if(novo !== t.nodeValue) t.nodeValue = novo; });
};
const _setEmojiToneB48 = window.setEmojiTone;
window.setEmojiTone = function(id){
  document.querySelectorAll('.tom-op').forEach(b=>{ const on = b.getAttribute('onclick') === `setEmojiTone('${id}')`; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  return _setEmojiToneB48.apply(this, arguments);
};

(function(){ if(document.getElementById('cup-css')) return; const s = document.createElement('style'); s.id = 'cup-css';
  s.textContent = `
.cup-form{display:flex;flex-direction:column;gap:8px;margin:6px 0 12px}
.cup-form label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--text-dim);flex:1}
.cup-linha{display:flex;gap:8px}
.cup-acoes{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}.cup-acoes .btn{padding:8px 10px;font-size:12px}
.cup-novos{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:14px;background:rgba(var(--primary-rgb),.10);margin-bottom:12px}
.tom-grade{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:4px}
.tom-op{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 4px;border-radius:14px;border:1px solid var(--border);background:var(--card,transparent);color:var(--text);cursor:pointer;font:inherit}
.tom-op.on{border-color:var(--primary);box-shadow:0 0 0 2px rgba(var(--primary-rgb),.25)}
.tom-op .tom-emo{font-size:26px;line-height:1}.tom-op small{font-size:11px;color:var(--text-dim);text-align:center}
.cup-novos textarea{font-family:ui-monospace,monospace;letter-spacing:2px;resize:vertical}
`; document.head.appendChild(s); })();

Object.assign(window, { cuponsPessoas, cupomLiberarPessoa, cupomSemLimitePessoa, cuponsApagarHistorico, openCupom, cupomResgatar, openCupons, cuponsCriar, cuponsCopiar, cuponsCopiarTexto, cuponsApagarLivres });

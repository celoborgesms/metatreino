
// =====================================================================
// 32. Beta 21 — desafios (aviso final e resgate), apagar dados de ex-alunos,
//     foto do perfil mais leve
// =====================================================================

// ---------- Desafios: ninguém perde a medalha por esquecer de clicar ----------
// A contagem sempre valeu desde o 1º dia do desafio (inclusive antes de clicar em "Participar").
// Agora: (1) nos últimos 3 dias, quem ainda não entrou vê quanto já tem;
//        (2) até 7 dias depois do fim, quem cumpriu a meta sem ter entrado pode resgatar a medalha.
const EV_RESGATE_DIAS = 7;
function evResgataveis(){
  try{
    const t = Date.now();
    return todosEventos().filter(e=>t >= e.fim && t < e.fim + EV_RESGATE_DIAS*DIA_MS && !((state.eventos||{})[e.key]))
      .filter(e=>mtDiasAtivos(e.ini, e.fim).size >= metaDoEvento(e));
  }catch(err){ return []; }
}
function resgatarEvento(key){
  const e = eventoPorKey(key); if(!e) return;
  if(Date.now() >= e.fim + EV_RESGATE_DIAS*DIA_MS){ toast('O prazo para resgatar esta medalha acabou'); return; }
  participaEvento(key);   // a contagem é do período do desafio; a medalha sai na hora se a meta foi cumprida
}
function _evAvisoFinal(e){
  const reg = (state.eventos||{})[e.key]; if(reg) return '';
  const p = progressoEvento(e); if(p.terminou || !p.comecou || p.restam > 3) return '';
  const quando = p.restam === 0 ? 'Hoje é o último dia' : (p.restam === 1 ? 'Falta 1 dia' : `Faltam ${p.restam} dias`);
  return p.dias >= p.alvo
    ? `${quando}: você <b>já cumpriu a meta</b> (${p.dias} de ${p.alvo} dias). Entre no desafio para receber a medalha.`
    : `${quando}: você já tem <b>${p.dias} de ${p.alvo}</b> dias ativos. Entre no desafio para garantir a medalha — os treinos que já fez contam.`;
}
const _evHeroB21 = window._evHero;
window._evHero = function(e, opts){
  let h = _evHeroB21.apply(this, arguments);
  try{ const av = _evAvisoFinal(e); if(av && !(opts && opts.semBotoes)) h = h.replace('<div class="ev-cta">', `<div class="ev-aviso">⏳ ${av}</div><div class="ev-cta">`); }catch(err){}
  return h;
};
const _renderChallengesB21 = window.renderChallenges;
window.renderChallenges = function(){
  const r = _renderChallengesB21.apply(this, arguments);
  try{
    const root = $('chal-root'); const rs = evResgataveis();
    if(root && rs.length){
      const box = document.createElement('div'); box.id = 'ev-resgate';
      box.innerHTML = `<div class="mt-sec">Medalha para resgatar</div>` + rs.map(e=>{
        const ate = mtFmtData(e.fim + EV_RESGATE_DIAS*DIA_MS - 1);
        return `<div class="card ev-medal ev-resg">${eventoMedalha(e, 52)}<div style="flex:1;min-width:0"><b style="font-size:14.5px">${mtEsc(e.nome)}</b>
          <div class="mt-muted" style="font-size:12px;line-height:1.45">O desafio terminou e você cumpriu a meta (${mtDiasAtivos(e.ini, e.fim).size} dias ativos), mas não tinha entrado. Resgate até ${ate}.</div>
          <button class="btn btn-primary" style="margin-top:8px;padding:9px 14px;font-size:13px" onclick="resgatarEvento('${e.key}')">🏅 Resgatar medalha</button></div></div>`;
      }).join('');
      root.insertBefore(box, root.firstChild);
    }
  }catch(err){ console.log('resgate', err); }
  return r;
};
mtGancho('renderMonthlyCard', { depois(){
  try{
    const card = $('card-monthly'); if(!card) return;
    const e = eventoPrincipal(); const row = $('home-ev-row');
    const av = e && _evAvisoFinal(e);
    if(row){ let a = $('home-ev-aviso'); if(av){ if(!a){ a = document.createElement('div'); a.id = 'home-ev-aviso'; a.className = 'ev-aviso'; row.appendChild(a); } a.innerHTML = '⏳ ' + av; } else if(a) a.remove(); }
    const rs = evResgataveis(); let rb = $('home-ev-resgate');
    if(rs.length){
      if(!rb){ rb = document.createElement('div'); rb.id = 'home-ev-resgate'; card.insertBefore(rb, card.firstChild); }
      rb.innerHTML = `<div class="ev-aviso" style="margin:0 0 12px">🏅 Você cumpriu a meta de <b>${mtEsc(rs[0].nome)}</b>. <a href="#" onclick="event.stopPropagation();resgatarEvento('${rs[0].key}');return false">Resgatar medalha</a></div>`;
      card.classList.remove('hidden');
    } else if(rb) rb.remove();
  }catch(err){ console.log('aviso desafio', err); }
}});

// ---------- Painel ADM: apagar dados de quem não é mais aluno ----------
function admTemAcesso(email){
  const a = (typeof allowCache !== 'undefined' && allowCache) ? allowCache[email] : null;
  return !!(a && a.active && (!a.expiresAt || a.expiresAt > Date.now()));
}
function _semAcento(s){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim(); }
function admApagarAluno(email){
  if(!mtPrincipal()){ toast('🛡️ Só o administrador principal pode apagar dados'); return; }
  const u = usuariosCache[email]; if(!u || !u._uid){ toast('Aluno não encontrado'); return; }
  const meu = String((fbUser && fbUser.email) || '').toLowerCase();
  if(email === meu || email === String(ADMIN_EMAIL).toLowerCase()){ toast('🛡️ Esta conta não pode ser apagada'); return; }
  if(admTemAcesso(email)){ toast('Este aluno ainda tem acesso. Bloqueie ou remova o acesso antes.'); return; }
  const nome = u.nome || (u.estadoApp && u.estadoApp.user && u.estadoApp.user.profile && u.estadoApp.user.profile.nickname) || email;
  const st = u.estadoApp || {}; const nH = (((st.modules||{}).lift||{}).history||[]).length + (((st.modules||{}).run||{}).history||[]).length;
  window._admApagar = { email, nome };
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `<h3>🗑️ Apagar dados do aluno</h3>
    <div class="card" style="padding:12px 14px;font-size:13px;line-height:1.6">
      <div class="mrow"><span>Aluno</span><b>${mtEsc(nome)}</b></div>
      <div class="mrow"><span>E-mail</span><span>${mtEsc(email)}</span></div>
      <div class="mrow"><span>Sessões (últimos 90 dias)</span><span>${nH}</span></div>
      <div class="mrow"><span>Tamanho</span><span>${_fmtKB(_bytesDe(u))} + arquivo anual</span></div>
    </div>
    <p class="mt-muted" style="font-size:12.5px;line-height:1.55;margin:10px 0">
      1. O app <b>baixa um backup</b> completo neste aparelho (inclui o arquivo anual). Se o backup não sair, nada é apagado.<br>
      2. Apaga da nuvem: treinos, histórico, arquivo anual, participação nos desafios e o cadastro de acesso.<br>
      Se a pessoa voltar, é só liberar o acesso de novo e restaurar o backup no Perfil dela.<br>
      <b>O login</b> (e-mail/senha ou Google) só pode ser apagado no Console do Firebase → Authentication; sem acesso liberado, ele não entra em nada.</p>
    <div class="field"><label>Para confirmar, digite o nome: <b>${mtEsc(nome)}</b></label><input class="input" id="adm-apagar-conf" autocomplete="off"></div>
    <div id="adm-apagar-st" class="mt-muted" style="font-size:12px;min-height:16px"></div>
    <button class="btn btn-perigo btn-block" id="adm-apagar-go" style="margin-top:8px" onclick="admApagarConfirma()">Baixar backup e apagar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="admTamanhos()">Cancelar</button>`;
  $('modal-back').classList.add('on');
}
async function admApagarConfirma(){
  const ctx = window._admApagar; if(!ctx) return;
  const { email, nome } = ctx; const u = usuariosCache[email]; if(!u) return;
  const st = $('adm-apagar-st'), bt = $('adm-apagar-go'); const fala = t=>{ if(st) st.innerHTML = t; };
  if(_semAcento(($('adm-apagar-conf')||{}).value) !== _semAcento(nome)){ fala('O nome digitado não confere.'); return; }
  if(!mtPrincipal() || admTemAcesso(email)) return;
  const uid = u._uid;
  if(bt){ bt.disabled = true; bt.textContent = '⏳ Fazendo backup...'; }
  // 1) backup — sem backup, não apaga
  let docsArq = {};
  try{
    const snap = await _comPrazo(_arqCol(uid).get({ source:'server' }), 20000);
    snap.forEach(d=>{ docsArq[d.id] = d.data(); });
    const arquivo = {}; Object.keys(docsArq).forEach(id=>{ arquivo[id] = _arqLer(docsArq[id]); });
    const data = { app:'MetaTreino', versao:APP_VERSION, exportadoEm:new Date().toISOString(), aluno:{ email, nome }, estado:u.estadoApp || {}, arquivo };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `metatreino-backup-${_semAcento(nome).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'aluno'}-${chaveDia(new Date())}.json`;
    document.body.appendChild(a); a.click(); setTimeout(()=>{ try{ URL.revokeObjectURL(a.href); a.remove(); }catch(e){} }, 4000);
  }catch(e){
    console.log('backup do aluno', e);
    fala('⚠️ Não consegui fazer o backup (sem conexão?). <b>Nada foi apagado.</b>');
    if(bt){ bt.disabled = false; bt.textContent = 'Baixar backup e apagar'; }
    return;
  }
  // 2) apagar
  if(bt) bt.textContent = '⏳ Apagando...';
  const extras = [];
  Object.keys(docsArq).forEach(id=>extras.push(_arqCol(uid).doc(id).delete()));
  Object.keys((u.estadoApp && u.estadoApp.eventos) || {}).forEach(k=>extras.push(db.collection('desafiosTematicos').doc(k).collection('participantes').doc(uid).delete()));
  const resExtras = await Promise.allSettled(extras);
  const falhasExtras = resExtras.filter(x=>x.status === 'rejected').length;
  try{
    await _comPrazo(db.collection('usuarios').doc(uid).delete(), 20000);
  }catch(e){
    console.log('apagar aluno', e);
    fala('⚠️ O backup foi baixado, mas não consegui apagar o documento principal. Confira a conexão e tente de novo.');
    if(bt){ bt.disabled = false; bt.textContent = 'Tentar de novo'; }
    return;
  }
  try{ if(allowCache[email]) await db.collection('usuariosAutorizados').doc(email).delete(); delete allowCache[email]; }catch(e){ console.log('acesso', e); }
  delete usuariosCache[email];
  window._admApagar = null;
  toast(`🗑️ Dados de ${nome} apagados. O backup foi baixado.` + (falhasExtras ? ' (algumas participações em desafios ficaram — publique as regras novas do Firestore)' : ''), 5000);
  try{ renderAdminStats(); renderAdminList(); renderAdminKpis(); }catch(e){}
  admTamanhos();
}
// no perfil do aluno (painel): botão de apagar para quem está sem acesso
mtGancho('openStudent', { depois(email){
  try{
    if(mtPrincipal() && !admTemAcesso(email) && usuariosCache[email]){
      const c = $('stud-content');
      if(c && !$('stud-apagar')){ const b = document.createElement('button'); b.id = 'stud-apagar'; b.className = 'btn btn-ghost btn-block'; b.style.cssText = 'margin-top:8px;color:var(--danger-soft);border-color:var(--line-danger)';
        b.textContent = '🧹 Apagar dados do aluno (com backup)'; b.onclick = ()=>admApagarAluno(email); c.appendChild(b); }
    }
  }catch(e){}
}});

// ---------- Foto do perfil mais leve ----------
// Aparece no máximo a ~80 px. 160 px já fica nítida em tela de alta densidade
// e ocupa cerca de metade da foto antiga de 240 px. Fotos novas já saem em 160 px
// (app.js); as antigas são reduzidas uma vez, ao abrir o Perfil.
function fotoPerfilLeve(data, cb){
  const img = new Image();
  img.onload = ()=>{
    try{
      const c = document.createElement('canvas'); const sz = 160; c.width = c.height = sz;
      const s = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width-s)/2, (img.height-s)/2, s, s, 0, 0, sz, sz);
      const out = c.toDataURL('image/jpeg', 0.82);
      cb(out.length < data.length ? out : data);
    }catch(e){ cb(data); }
  };
  img.onerror = ()=>cb(data);
  img.src = data;
}
function _encolheFotoAntiga(){
  try{
    const p = state && state.user && state.user.profile;
    if(!p || !p.photo || String(p.photo).length < 14000 || p.fotoLeve) return;
    fotoPerfilLeve(p.photo, nova=>{ if(state.user && state.user.profile === p){ p.photo = nova; p.fotoLeve = 1; saveData(); try{ renderProfile(); }catch(e){} } });
  }catch(e){}
}
mtGancho('renderProfile', { depois(){ setTimeout(_encolheFotoAntiga, 800); }});

Object.assign(window, { resgatarEvento, admApagarAluno, admApagarConfirma, admTemAcesso, evResgataveis });

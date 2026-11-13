// =====================================================================
// 45. Beta 34 — Sincronização entre aparelhos, vídeos e créditos de parceiros
// =====================================================================

// ---------- 1. Arquivo anual dos documentos antigos da mesma pessoa ----------
// Na unificação da conta (resolveContaUnica, app.js), o histórico RECENTE dos outros documentos já é
// juntado no carregamento. O histórico com mais de 90 dias fica no arquivo anual (usuarios/{uid}/arquivo):
// aqui ele é copiado, uma vez, para o arquivo do documento principal. Nada é apagado dos antigos.
async function syncJuntarArquivosAntigos(){
  const antigos = (window.__uidsAntigos || []).filter(u=>u && u !== uidDados());
  if(!antigos.length || !fbUser) return;
  window.__uidsAntigos = [];
  let n = 0;
  for(const velho of antigos){
    try{
      const snap = await _comPrazo(db.collection('usuarios').doc(velho).collection('arquivo').get(), 20000);
      const destino = db.collection('usuarios').doc(uidDados()).collection('arquivo');
      const escritas = [];
      snap.forEach(d=>{ if(/^\d{4}-[12]$/.test(d.id)){ escritas.push(destino.doc(d.id).set(d.data(), { merge:true })); n++; } });   // merge: registros com a mesma chave não duplicam
      await Promise.all(escritas);
      if(escritas.length){ const info = _arqInfo(); snap.forEach(d=>{ if(/^\d{4}-[12]$/.test(d.id)) info.docs = [...new Set([...(info.docs||[]), d.id])].sort(); }); _arqMem = null; saveData(); }
    }catch(e){ console.log('arquivo do outro login:', e); window.__uidsAntigos = (window.__uidsAntigos||[]).concat([velho]); }
  }
  if(n) toast('🔄 Histórico antigo dos seus outros logins reunido nesta conta.');
}
mtGancho('renderHome', { depois(){ if((window.__uidsAntigos||[]).length && !window.__arqJuntando){ window.__arqJuntando = true; setTimeout(()=>{ syncJuntarArquivosAntigos().finally(()=>{ window.__arqJuntando = false; }); }, 5000); } }});

// ---------- 2. Diagnóstico da sincronização (Perfil → Conta e dados) ----------
function _syncQuando(t){ if(!t) return 'nunca'; const d = Date.now() - t; if(d < 60000) return 'agora há pouco'; if(d < 3600000) return `há ${Math.round(d/60000)} min`; return new Date(t).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); }
function openSincronizacao(){
  if(!fbUser || !state.user) return;
  const ack = +mtLS('mt_nuvem_ok_' + uidDados()) || 0;
  const provedores = ((fbUser.providerData || []).map(p=>p && p.providerId) || []).map(p=>p==='google.com' ? 'Google' : p==='password' ? 'e-mail e senha' : p).filter(Boolean);
  const unificado = uidDados() !== fbUser.uid;
  const nL = (((state.modules||{}).lift||{}).history||[]).length, nR = (((state.modules||{}).run||{}).history||[]).length;
  const pend = (+state._savedAt||0) > ack;
  const linha = (k, v)=>`<div class="mrow"><span>${k}</span><b style="text-align:right">${v}</b></div>`;
  $('modal-inner').innerHTML = `<h3>🔄 Sincronização</h3>
    <p class="mt-muted" style="margin:0 0 10px">Seus treinos, perfil, conquistas e progresso ficam na sua conta na nuvem. Qualquer aparelho em que você entrar com este e-mail mostra os mesmos dados.</p>
    <div class="card" style="padding:6px 14px">
      ${linha('Conta', mtEsc(state.user.email || fbUser.email || '—'))}
      ${linha('Entrou com', mtEsc(provedores.join(' + ') || '—'))}
      ${linha('Documento de dados', `${mtEsc(String(uidDados()).slice(0,8))}…${unificado ? ' · unificado' : ''}`)}
      ${linha('Internet', navigator.onLine === false ? '📴 sem conexão' : '✅ conectado')}
      ${linha('Última gravação confirmada', _syncQuando(ack))}
      ${linha('Alterações aguardando envio', pend ? 'sim — serão enviadas assim que possível' : 'nenhuma')}
      ${linha('Registros no aparelho', `${nL} musculação · ${nR} corrida/bike/caminhada`)}
    </div>
    ${unificado ? `<div class="note note-info" style="margin-top:10px"><div class="note-line" style="font-size:12.5px">Você já entrou de mais de uma forma (Google e e-mail/senha). Os dados foram reunidos num único documento, usado em todos os aparelhos.</div></div>` : ''}
    <p class="mt-muted" style="font-size:12px;margin:10px 0 0">O Histórico mostra uma modalidade por vez (musculação ou corrida): troque no seletor do topo para ver a outra. Registros com mais de 90 dias ficam em Histórico → Histórico completo.</p>
    <button class="btn btn-primary btn-block" id="sync-agora" style="margin-top:12px" onclick="syncAgora()">Sincronizar agora</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
// envia o que falta e busca a versão da nuvem, juntando as duas (nada é apagado)
async function syncAgora(){
  const b = $('sync-agora'); if(b){ b.disabled = true; b.textContent = 'Sincronizando…'; }
  try{
    if(navigator.onLine === false){ toast('📴 Sem internet agora. Tudo fica guardado e sincroniza quando a conexão voltar.'); return; }
    const doc = await _comPrazo(db.collection('usuarios').doc(uidDados()).get({ source:'server' }), 15000);
    const remoto = doc.exists && doc.data().estadoApp;
    let novos = 0;
    if(remoto){
      if((+remoto._savedAt||0) > (+state._savedAt||0)){
        const base = JSON.parse(JSON.stringify(remoto)); novos = mesclaEstado(base, state).daOutra;
        state = Object.assign({}, state, base, { ui: state.ui, user: Object.assign({}, base.user||{}, { email: state.user.email, isAdmin: state.user.isAdmin }) });
      } else novos = mesclaEstado(state, remoto).daOutra;
    }
    try{ ensureStats(); }catch(e){}
    _assinaturaNuvem = ''; state._savedAt = Date.now(); saveData(); syncToCloud();
    toast('✅ Sincronizado com a nuvem.');
    closeModal(); goTab(state.ui.tab || 'home');
  }catch(e){ console.log('sincronizar agora:', e); toast('⚠️ A nuvem não respondeu. Tente de novo em instantes.'); }
  finally{ const b2 = $('sync-agora'); if(b2){ b2.disabled = false; b2.textContent = 'Sincronizar agora'; } }
}
// a internet voltou: envia o que ficou pendente (o Firestore também reenvia sozinho; isto cobre o
// caso em que o app foi aberto offline e nada foi gravado na nuvem ainda)
window.addEventListener('online', ()=>{ setTimeout(()=>{ try{ if(fbUser && state && state.user && !state.user.blocked){ _assinaturaNuvem = ''; syncToCloud(); ouveNuvem(); } }catch(e){} }, 2500); });
mtGancho('renderProfile', { depois(){ try{ const el = $('pf-sync-val'); if(el){ const ack = +mtLS('mt_nuvem_ok_' + uidDados()) || 0; el.textContent = navigator.onLine === false ? 'sem internet ›' : (ack ? 'sincronizado ' + _syncQuando(ack) + ' ›' : 'ver status ›'); } }catch(e){} }});

// ---------- 3. Parceiros e créditos dos vídeos (administradores) ----------
// parceiros/{id}: cadastro completo (inclui contato privado) — só administradores leem e gravam.
// videosExercicios/{exercicio}.creditos: o que os alunos veem — só os campos que o admin marcou para
// cada lugar (ficha do exercício e Biblioteca). Editar créditos nunca mexe no link do vídeo.
const PC_CAMPOS = [ ['empresa','Empresa ou marca'], ['instagram','Instagram'], ['contato','WhatsApp / telefone'], ['site','Site ou link'], ['texto','Texto do crédito'] ];
let _pcLista = [];
function _pcVideos(){
  const out = [];
  try{ Object.keys(MOB).forEach(k=>{ const id = 'mob-'+k; if(videoLinks[id]) out.push({ id, nome: MOB[k].nome }); }); }catch(e){}
  EX_BANK.forEach(c=>c.items.forEach(ex=>{ const id = slug(ex.name); if(videoLinks[id]) out.push({ id, nome: ex.name, grupo: c.name }); }));
  return out;
}
function _pcNormaliza(d){
  const ig = String(d.instagram||'').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/[/?#].*$/,'').replace(/^@/,'');
  const fone = String(d.whatsapp||'').replace(/\D/g,'');
  return { nome: String(d.nome||'').trim().replace(/\s+/g,' ').slice(0,80), empresa: String(d.empresa||'').trim().slice(0,80), instagram: ig.slice(0,40),
    whatsapp: fone.slice(0,15), site: String(d.site||'').trim().slice(0,200), texto: String(d.texto||'').trim().slice(0,160) };
}
// o que vai para o documento do vídeo (público para os alunos)
function pcProjecao(id, p){
  const vis = p.mostrar || {};
  const lugar = onde=>{
    if(!(p.onde||{})[onde]) return null;
    const o = {};
    if((vis.empresa||{})[onde] && p.empresa) o.empresa = p.empresa;
    if((vis.instagram||{})[onde] && p.instagram) o.instagram = p.instagram;
    if((vis.contato||{})[onde] && p.whatsapp) o.contato = p.whatsapp;
    if((vis.site||{})[onde] && /^https?:\/\//i.test(p.site||'')) o.site = p.site;
    if((vis.texto||{})[onde] && p.texto) o.texto = p.texto;
    return o;
  };
  return { parceiroId:id, nome:p.nome, ficha: lugar('ficha'), biblioteca: lugar('biblioteca'), atualizadoEm: Date.now() };
}
async function openParceiros(){
  if(!mtAdmin()){ toast('🔒 Recurso restrito a administradores.'); return; }
  $('modal-inner').innerHTML = `<h3>🤝 Parceiros e créditos</h3><p class="mt-muted">Carregando…</p>`; $('modal-back').classList.add('on');
  try{
    await loadVideoLinks();
    const snap = await _comPrazo(db.collection('parceiros').get(), 12000);
    _pcLista = []; snap.forEach(d=>_pcLista.push(Object.assign({ id:d.id }, d.data())));
    _pcLista.sort((a,b)=>String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
  }catch(e){ console.log('parceiros:', e); $('modal-inner').innerHTML = `<h3>🤝 Parceiros e créditos</h3><p class="mt-muted">Não foi possível carregar. Confira a internet e se as regras do Firestore da Beta 34 foram publicadas (coleção "parceiros").</p><button class="btn btn-ghost btn-block" onclick="openVideoAdmin()">Voltar</button>`; return; }
  const conta = id=>Object.values(videoCreditos).filter(c=>c && c.parceiroId===id).length;
  $('modal-inner').innerHTML = `<h3>🤝 Parceiros e créditos</h3>
    <p class="mt-muted" style="margin:0 0 10px">Cadastre uma vez quem gravou ou cedeu os vídeos e escolha em quais vídeos o crédito aparece. Os contatos só aparecem para os alunos se você marcar.</p>
    ${_pcLista.length ? _pcLista.map(p=>`<div class="list-row" onclick="openParceiroForm('${mtJsStr(p.id)}')"><span style="flex:1;min-width:0"><b>${mtEsc(p.nome)}</b>${p.empresa?` <span class="mt-muted">· ${mtEsc(p.empresa)}</span>`:''}</span><span style="color:var(--text-mute);font-size:12px">${conta(p.id)} vídeo${conta(p.id)===1?'':'s'} ›</span></div>`).join('') : '<p class="mt-muted">Nenhum parceiro cadastrado ainda.</p>'}
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="openParceiroForm(null)">➕ Novo parceiro</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openVideoAdmin()">Voltar aos vídeos</button>`;
}
function openParceiroForm(id){
  if(!mtAdmin()) return;
  const p = (id && _pcLista.find(x=>x.id===id)) || { nome:'', onde:{ ficha:true, biblioteca:false }, mostrar:{ empresa:{ficha:true,biblioteca:false}, instagram:{ficha:true,biblioteca:false}, contato:{ficha:false,biblioteca:false}, site:{ficha:true,biblioteca:false}, texto:{ficha:true,biblioteca:false} } };
  const vis = p.mostrar || {}; const onde = p.onde || {};
  const inp = (k, ph, extra)=>`<input class="input" id="pc-${k}" placeholder="${ph}" value="${mtEsc(p[k]||'')}" style="margin-top:8px" ${extra||''}>`;
  const marc = (k, o)=>`<input type="checkbox" id="pc-v-${k}-${o}" ${((vis[k]||{})[o])?'checked':''} aria-label="${k} na ${o}">`;
  const vids = _pcVideos();
  window.__pcId = id;
  $('modal-inner').innerHTML = `<h3>${id ? 'Editar parceiro' : 'Novo parceiro'}</h3>
    <div style="max-height:66vh;overflow-y:auto;padding-right:2px">
      <div class="section-lbl" style="margin:4px 0 0">Dados</div>
      ${inp('nome','Nome do profissional ou criador *')}
      ${inp('empresa','Empresa ou marca (opcional)')}
      ${inp('instagram','Instagram, ex.: @joaosilva (opcional)')}
      ${inp('whatsapp','WhatsApp ou telefone com DDD (opcional)', 'inputmode="tel"')}
      ${inp('site','Site ou outro link, com https:// (opcional)', 'inputmode="url"')}
      ${inp('texto','Texto do crédito, ex.: Personal trainer, CREF 000000 (opcional)')}
      <div class="section-lbl" style="margin:16px 0 6px">O que os alunos veem</div>
      <div class="pc-grade">
        <span></span><span class="h">Ficha</span><span class="h">Biblioteca</span>
        <span><b>Mostrar créditos</b> (nome)</span><input type="checkbox" id="pc-o-ficha" ${onde.ficha?'checked':''} aria-label="Créditos na ficha"><input type="checkbox" id="pc-o-biblioteca" ${onde.biblioteca?'checked':''} aria-label="Créditos na Biblioteca">
        ${PC_CAMPOS.map(([k,l])=>`<span>${l}</span>${marc(k,'ficha')}${marc(k,'biblioteca')}`).join('')}
      </div>
      <p class="mt-muted" style="font-size:11.5px;margin:6px 0 0">Campos vazios nunca aparecem. O WhatsApp só fica visível para os alunos se você marcar. Na Biblioteca aparece uma linha curta (nome, empresa e Instagram).</p>
      <div class="section-lbl" style="margin:16px 0 6px">Vídeos com este crédito · ${vids.length} vídeos cadastrados</div>
      <input class="input" id="pc-busca" placeholder="Filtrar vídeos…" oninput="pcFiltrar(this.value)">
      <div id="pc-vids" style="margin-top:6px">${vids.map(v=>{ const c = videoCreditos[v.id]; const outro = c && c.parceiroId && c.parceiroId !== id; return `<label class="pc-vid" data-n="${mtEsc(mtNorm(v.nome+' '+(v.grupo||'')))}"><input type="checkbox" class="pc-vchk" value="${mtEsc(v.id)}" ${c && id && c.parceiroId===id ? 'checked':''}><span style="flex:1">${mtEsc(v.nome)}${v.grupo?` <span class="mt-muted">· ${mtEsc(v.grupo)}</span>`:''}</span>${outro?`<span class="mt-muted" style="font-size:11px">de ${mtEsc(c.nome)}</span>`:''}</label>`; }).join('') || '<p class="mt-muted">Nenhum exercício tem vídeo cadastrado ainda.</p>'}</div>
    </div>
    <button class="btn btn-primary btn-block" id="pc-salvar" style="margin-top:12px" onclick="salvarParceiro()">💾 Salvar</button>
    ${id ? `<button class="btn btn-ghost btn-block hl-danger" style="margin-top:8px" onclick="excluirParceiro('${mtJsStr(id)}')">🗑️ Excluir parceiro e tirar os créditos</button>` : ''}
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openParceiros()">Voltar</button>`;
}
function pcFiltrar(q){ const n = mtNorm(q||''); document.querySelectorAll('#pc-vids .pc-vid').forEach(el=>{ el.style.display = !n || (el.dataset.n||'').includes(n) ? '' : 'none'; }); }
async function salvarParceiro(){
  if(!mtAdmin()) return;
  const id0 = window.__pcId;
  const d = _pcNormaliza({ nome:$('pc-nome').value, empresa:$('pc-empresa').value, instagram:$('pc-instagram').value, whatsapp:$('pc-whatsapp').value, site:$('pc-site').value, texto:$('pc-texto').value });
  if(d.nome.length < 2){ toast('⚠️ Informe o nome do profissional ou criador'); return; }
  if(d.site && !/^https?:\/\//i.test(d.site)){ toast('⚠️ O site precisa começar com http:// ou https://'); return; }
  if(d.whatsapp && d.whatsapp.length < 10){ toast('⚠️ Telefone incompleto: use DDD + número'); return; }
  if(d.instagram && !/^[A-Za-z0-9._]{1,30}$/.test(d.instagram)){ toast('⚠️ Instagram inválido: use só o @usuário'); return; }
  const p = Object.assign({}, d, {
    onde: { ficha: !!$('pc-o-ficha').checked, biblioteca: !!$('pc-o-biblioteca').checked },
    mostrar: Object.fromEntries(PC_CAMPOS.map(([k])=>[k, { ficha: !!$(`pc-v-${k}-ficha`).checked, biblioteca: !!$(`pc-v-${k}-biblioteca`).checked }])),
    atualizadoEm: Date.now(), atualizadoPor: (state.user && state.user.email) || ''
  });
  const marcados = new Set([...document.querySelectorAll('#pc-vids .pc-vchk:checked')].map(i=>i.value));
  await mtComBotao('pc-salvar', 'Salvando…', async ()=>{
    try{
      const ref = id0 ? db.collection('parceiros').doc(id0) : db.collection('parceiros').doc();
      const id = ref.id;
      const batch = db.batch();
      batch.set(ref, p);
      const proj = pcProjecao(id, p);
      const del = firebase.firestore.FieldValue.delete();
      Object.keys(videoLinks).forEach(vid=>{
        const atual = videoCreditos[vid];
        if(marcados.has(vid)) batch.set(db.collection('videosExercicios').doc(vid), { creditos: proj }, { merge:true });
        else if(atual && atual.parceiroId === id) batch.set(db.collection('videosExercicios').doc(vid), { creditos: del }, { merge:true });
      });
      await _comPrazo(batch.commit(), 20000);
      Object.keys(videoLinks).forEach(vid=>{ if(marcados.has(vid)) videoCreditos[vid] = proj; else if(videoCreditos[vid] && videoCreditos[vid].parceiroId === id) delete videoCreditos[vid]; });
      mtLS('metatreino_video_creditos', JSON.stringify(videoCreditos));
      toast(`✅ Créditos salvos em ${marcados.size} vídeo${marcados.size===1?'':'s'}`);
      openParceiros();
    }catch(e){ console.log('salvar parceiro:', e); toast('⚠️ Não foi possível salvar. Confira a internet e as regras do Firestore (Beta 34).'); }
  });
}
function excluirParceiro(id){
  if(!mtAdmin()) return;
  appConfirm('O cadastro sai e os créditos dele somem dos vídeos. Os vídeos e os links continuam.', async ()=>{
    try{
      const batch = db.batch(); const del = firebase.firestore.FieldValue.delete();
      Object.keys(videoCreditos).forEach(vid=>{ if(videoCreditos[vid] && videoCreditos[vid].parceiroId === id) batch.set(db.collection('videosExercicios').doc(vid), { creditos: del }, { merge:true }); });
      batch.delete(db.collection('parceiros').doc(id));
      await _comPrazo(batch.commit(), 20000);
      Object.keys(videoCreditos).forEach(vid=>{ if(videoCreditos[vid] && videoCreditos[vid].parceiroId === id) delete videoCreditos[vid]; });
      mtLS('metatreino_video_creditos', JSON.stringify(videoCreditos));
      toast('🗑️ Parceiro excluído'); openParceiros();
    }catch(e){ console.log('excluir parceiro:', e); toast('⚠️ Não foi possível excluir agora.'); }
  }, { title:'Excluir parceiro?', emo:'🗑️', okLabel:'Sim, excluir', danger:true });
}
// atalho no painel de vídeos
mtGancho('openVideoAdmin', { depois(){
  try{
    const mi = $('modal-inner'); if(!mi || mi.querySelector('#pc-atalho')) return;
    const h = mi.querySelector('h3'); if(!h) return;
    h.insertAdjacentHTML('afterend', `<button class="btn btn-outline btn-block" id="pc-atalho" style="margin:6px 0 4px" onclick="openParceiros()">🤝 Parceiros e créditos dos vídeos</button>`);
  }catch(e){}
}});

// ---------- 4. Descanso por exercício e intensidade nos planos já salvos (uma vez) ----------
// A regra nova (liftDescanso, app.js) olha o tipo do exercício e a faixa de repetições; os planos salvos
// recebem o descanso novo uma vez. Exercícios, séries e repetições não mudam. Calistenia tem regra própria.
function b34AtualizaDescansos(){
  try{
    const mod = state.modules && state.modules.lift;
    if(!mod || !mod.plan || !mod.setup || state.b34Descanso || !Array.isArray(mod.plan.workouts)) return;
    const prof = state.user && state.user.profile; const senior = !!(prof && prof.age >= 50); const goal = mod.setup.goal || 'hipertrofia';
    mod.plan.workouts.forEach(w=>{
      if(!w || w.cali || !Array.isArray(w.exercises)) return;
      w.exercises.forEach(e=>{
        if(!e || e.cali) return;
        if(['Core','Panturrilha','Trapézio'].includes(e.part)) e.rest = LIFT_DESC_PEQUENOS[senior?'senior':'adulto'][goal] || '45-60s';
        else e.rest = liftDescanso(exPapel(e, e.part).tier, goal, senior, e.unit==='tempo' ? null : e.reps);
      });
      w.duration = estimateLiftDuration(w.exercises, goal);
    });
    state.b34Descanso = true; saveData();
  }catch(e){ console.log('descansos (Beta 34)', e); }
}
mtGancho('renderHome', { depois(){ b34AtualizaDescansos(); }});

Object.assign(window, { b34AtualizaDescansos, exTipoRegistro, descansoDoExercicio, runSemanaPrevia, openSincronizacao, syncAgora, syncJuntarArquivosAntigos, openParceiros, openParceiroForm, salvarParceiro, excluirParceiro, pcFiltrar, pcProjecao, creditosHtml, mtTocarPausar, mtVelocidade, mtVolume, mtBuscar });

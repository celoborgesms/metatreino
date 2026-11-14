
// =====================================================================
// 12. ÁUDIO DOS VÍDEOS + 13. VÍDEOS INDISPONÍVEIS (Beta 11)
// =====================================================================
// Preferência por aluno: fica em state.prefs (vai junto com o estadoApp para a nuvem,
// então vale em qualquer aparelho e depois de sair/entrar) e num cache local.
function videoMudoPref(){
  try{ const p = state.prefs && state.prefs.videoAudio; if(p) return p === 'mudo'; }catch(e){}
  return mtLS('mt_video_audio') === 'mudo';
}
function setVideoAudio(v){
  state.prefs = state.prefs || {};
  state.prefs.videoAudio = v === 'mudo' ? 'mudo' : 'som';
  mtLS('mt_video_audio', state.prefs.videoAudio);
  saveData();
  openAudioVideos();
  try{ renderProfile(); }catch(e){}
}
function openAudioVideos(){
  const mudo = videoMudoPref();
  const op = (k, t, d)=>`<div class="ap-pack ${((k==='mudo')===mudo)?'on':''}" onclick="setVideoAudio('${k}')"><div style="flex:1"><b style="font-size:14px">${t}</b>${((k==='mudo')===mudo)?' <span style="color:var(--primary-2)">✓</span>':''}<div style="font-size:12px;color:var(--text-mute);line-height:1.45;margin-top:2px">${d}</div></div></div>`;
  $('modal-inner').innerHTML = `<h3>Áudio dos vídeos</h3>
    <p class="mt-muted" style="margin:0 0 12px">Vale para os vídeos de demonstração dos exercícios. Você pode ligar ou desligar o som de cada vídeo a qualquer momento no próprio player.</p>
    ${op('mudo','Iniciar vídeos no mudo','O vídeo começa sem som. Ideal para continuar ouvindo sua música enquanto confere a execução.')}
    ${op('som','Manter áudio original','O vídeo toca normalmente, com o som do criador.')}
    <div class="note" style="margin-top:10px"><div class="note-line" style="font-size:12px">O MetaTreino não mexe no volume do celular. Com o vídeo no mudo, o Android normalmente mantém a música de outros apps tocando — mas isso depende do aparelho, da versão do Android e do navegador. Ao ligar o som de um vídeo, o sistema pode pausar a música.</div></div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal()">Pronto</button>`;
  $('modal-back').classList.add('on');
}

// --- Player com a API oficial do YouTube (IFrame Player API) ---
// Carrega https://www.youtube.com/iframe_api só quando um vídeo é aberto (nada no início do app).
let _ytApi = null;
function mtCarregarYTApi(){
  if(window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if(_ytApi) return _ytApi;
  _ytApi = new Promise((res, rej)=>{
    const anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function(){ try{ anterior && anterior(); }catch(e){} res(window.YT); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
    s.onerror = ()=>{ _ytApi = null; s.remove(); rej(new Error('api')); };
    document.head.appendChild(s);
    setTimeout(()=>{ if(!(window.YT && window.YT.Player)){ _ytApi = null; rej(new Error('timeout')); } }, 9000);
  });
  return _ytApi;
}
const MT_PLAYER = { p:null, v:null, info:null, mudo:false, pronto:false, t:null, prog:null, vel:1 };
// Beta 34 — MODO LIMPO: o player do YouTube vem sem os controles dele (controls=0) e o MetaTreino mostra
// os seus, numa barra ABAIXO do vídeo (nada por cima da imagem): tocar/pausar, tempo, som, volume,
// velocidade e tela cheia. O vídeo repete sozinho (loop), então a tela final de "outros vídeos" não
// aparece. Tocar na imagem pausa/continua; o toque não vai para o YouTube, então o aluno não é levado
// para fora do app por engano. Limitação oficial: o YouTube não permite esconder o título e o
// logotipo por parâmetro (o "showinfo" foi desativado em 2018) — eles podem aparecer por alguns
// segundos no início ou ao pausar, sem dar para remover sem infringir os termos do YouTube.
function _mtPlayerVars(v, mudo){
  return { autoplay:1, playsinline:1, controls:0, rel:0, modestbranding:1, iv_load_policy:3, disablekb:1, fs:0, cc_load_policy:0, cc_lang_pref:'pt', hl:'pt-BR',
    loop:1, playlist:v.id, mute: mudo ? 1 : 0, origin: location.origin };
}
const MTV_PAUSA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
const MTV_PLAY = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
function _mtFmt(s){ s = Math.max(0, Math.floor(+s||0)); return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0'); }
function mtTocarPausar(){
  const p = MT_PLAYER.p; if(!p || !MT_PLAYER.pronto) return;
  try{ (p.getPlayerState && p.getPlayerState() === 1) ? p.pauseVideo() : p.playVideo(); }catch(e){}
}
function mtBuscar(frac){ const p = MT_PLAYER.p; if(!p || !MT_PLAYER.pronto) return; try{ const d = p.getDuration(); if(d > 0) p.seekTo(d * Math.max(0, Math.min(1, frac)), true); }catch(e){} }
function mtVolume(v){
  const p = MT_PLAYER.p; if(!p || !MT_PLAYER.pronto) return;
  try{ v = Math.max(0, Math.min(100, +v)); p.setVolume(v); if(v === 0){ p.mute(); MT_PLAYER.mudo = true; } else if(MT_PLAYER.mudo){ p.unMute(); MT_PLAYER.mudo = false; } }catch(e){}
  _mtBotaoSom();
}
function mtVelocidade(){
  const p = MT_PLAYER.p; if(!p || !MT_PLAYER.pronto) return;
  const ops = [1, 0.75, 0.5]; MT_PLAYER.vel = ops[(ops.indexOf(MT_PLAYER.vel) + 1) % ops.length];
  try{ p.setPlaybackRate(MT_PLAYER.vel); }catch(e){}
  const b = $('mtv-vel'); if(b) b.textContent = String(MT_PLAYER.vel).replace('.', ',') + '×';
}
function _mtAtualizaBarra(){
  const p = MT_PLAYER.p; if(!p || !MT_PLAYER.pronto) return;
  try{
    const t = p.getCurrentTime() || 0, d = p.getDuration() || 0, est = p.getPlayerState && p.getPlayerState();
    const i = document.querySelector('#mtv-barra i'); if(i) i.style.width = (d ? Math.min(100, t/d*100) : 0) + '%';
    const tt = $('mtv-tempo'); if(tt) tt.textContent = d ? `${_mtFmt(t)} / ${_mtFmt(d)}` : '';
    const bp = $('mtv-play'); if(bp){ const tocando = est === 1 || est === 3; if(bp.dataset.t !== String(tocando)){ bp.dataset.t = String(tocando); bp.innerHTML = tocando ? MTV_PAUSA : MTV_PLAY; } bp.setAttribute('aria-label', tocando ? 'Pausar o vídeo' : 'Tocar o vídeo'); }
  }catch(e){}
}
function _mtControlesHtml(){
  return `<div class="mtv-ctrl" id="mtv-ctrl">
      <button type="button" class="mtv-b" id="mtv-play" onclick="mtTocarPausar()" aria-label="Pausar o vídeo">${MTV_PAUSA}</button>
      <div class="mtv-barra" id="mtv-barra" role="slider" aria-label="Posição do vídeo" tabindex="0"><i></i></div>
      <span class="mtv-tempo" id="mtv-tempo"></span>
      <button type="button" class="mtv-b" id="mtv-vel" onclick="mtVelocidade()" aria-label="Velocidade do vídeo">1×</button>
      <input type="range" class="mtv-vol" id="mtv-vol" min="0" max="100" value="100" aria-label="Volume do vídeo" oninput="mtVolume(this.value)">
    </div>`;
}
function _mtLigaControles(){
  const stage = $('ex-stage'); if(!stage || stage.querySelector('#mtv-ctrl')) return;
  stage.insertAdjacentHTML('afterend', _mtControlesHtml());
  const barra = $('mtv-barra');
  if(barra){
    const ir = e=>{ const r = barra.getBoundingClientRect(); mtBuscar(((e.clientX||0) - r.left) / r.width); };
    barra.addEventListener('pointerdown', ir);
    barra.addEventListener('keydown', e=>{ const p = MT_PLAYER.p; if(!p) return; try{ if(e.key==='ArrowRight') p.seekTo(p.getCurrentTime()+5, true); if(e.key==='ArrowLeft') p.seekTo(Math.max(0, p.getCurrentTime()-5), true); }catch(x){} });
  }
  // tocar na imagem pausa/continua (o iframe não recebe o toque: veja .ex-stage iframe no CSS)
  stage.addEventListener('click', e=>{ if(e.target.closest('button,a')) return; mtTocarPausar(); });
  clearInterval(MT_PLAYER.prog); MT_PLAYER.prog = setInterval(_mtAtualizaBarra, 400);
}
function mtDestruirPlayer(){
  clearTimeout(MT_PLAYER.t); clearInterval(MT_PLAYER.prog); MT_PLAYER.prog = null; MT_PLAYER.vel = 1;
  try{ const c = $('mtv-ctrl'); if(c) c.remove(); }catch(e){}
  try{ MT_PLAYER.p && MT_PLAYER.p.destroy && MT_PLAYER.p.destroy(); }catch(e){}
  MT_PLAYER.p = null; MT_PLAYER.pronto = false; MT_PLAYER.v = null;
}
// Fallback sem a API (bloqueada/lenta): iframe simples; o parâmetro mute=1 ainda respeita a preferência.
function _mtIframeSimples(v, mudo){
  const alvo = $('ex-yt'); if(!alvo) return;
  // sem a API não há como pôr controles próprios: o player do YouTube fica com os dele, no modo mais enxuto permitido
  const src = `https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1&playsinline=1&autoplay=1&iv_load_policy=3&cc_load_policy=0&loop=1&playlist=${v.id}&mute=${mudo?1:0}`;
  const st = $('ex-stage'); if(st) st.classList.add('nativo');
  alvo.outerHTML = `<iframe src="${src}" title="Vídeo do exercício" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen onload="exVideoOk()"></iframe>`;
  const b = $('ex-som'); if(b){ b.disabled = true; b.title = 'Use o botão de som do próprio player'; b.style.opacity = '.5'; }
}
function mtMontarPlayer(v, info){
  mtDestruirPlayer();
  MT_PLAYER.v = v; MT_PLAYER.info = info; MT_PLAYER.mudo = videoMudoPref();
  if(navigator.onLine === false){ mtVideoFalha(v, 'offline'); return; }
  mtCarregarYTApi().then(YT=>{
    if(MT_PLAYER.v !== v || !$('ex-yt')) return;   // o aluno já fechou ou abriu outro
    MT_PLAYER.p = new YT.Player('ex-yt', {
      videoId: v.id,
      host: 'https://www.youtube-nocookie.com',
      playerVars: _mtPlayerVars(v, MT_PLAYER.mudo),
      events: {
        onReady: e=>{
          MT_PLAYER.pronto = true; clearTimeout(MT_PLAYER.t);
          try{ MT_PLAYER.mudo ? e.target.mute() : e.target.unMute(); e.target.playVideo(); }catch(err){}
          // Beta 37: legenda nunca liga sozinha (o YouTube às vezes segue a preferência da conta do aparelho)
          try{ e.target.unloadModule && e.target.unloadModule('captions'); e.target.unloadModule && e.target.unloadModule('cc'); }catch(err){}
          exVideoOk(); _mtBotaoSom(); _mtLigaControles();
          try{ const vol = $('mtv-vol'); if(vol) vol.value = MT_PLAYER.mudo ? 0 : (e.target.getVolume ? e.target.getVolume() : 100); }catch(err){}
        },
        onError: e=>{ clearTimeout(MT_PLAYER.t); mtVideoFalha(v, e && e.data); }
      }
    });
    const ifr = MT_PLAYER.p.getIframe && MT_PLAYER.p.getIframe(); if(ifr) ifr.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
    // pronto não chegou em 15 s: trata como conexão lenta, nunca como "vídeo removido"
    MT_PLAYER.t = setTimeout(()=>{ if(!MT_PLAYER.pronto && MT_PLAYER.v===v) mtVideoFalha(v, 'lento'); }, 15000);
  }).catch(()=>{
    if(MT_PLAYER.v !== v) return;
    if(navigator.onLine === false) mtVideoFalha(v, 'offline');
    else _mtIframeSimples(v, MT_PLAYER.mudo);   // API indisponível: mostra o vídeo do jeito antigo
  });
}
function _mtBotaoSom(){ const b = $('ex-som'); if(b) b.textContent = MT_PLAYER.mudo ? '🔇 Sem som' : '🔊 Com som'; const vol = $('mtv-vol'); if(vol && MT_PLAYER.mudo) vol.value = 0; }
// liga/desliga o som SÓ deste vídeo (a preferência geral continua a mesma)
function mtAlternarSom(){
  const p = MT_PLAYER.p; if(!p || !MT_PLAYER.pronto) return;
  try{ if(MT_PLAYER.mudo){ p.unMute(); if(p.getVolume && p.getVolume()===0) p.setVolume(100); MT_PLAYER.mudo = false; const vol = $('mtv-vol'); if(vol) vol.value = p.getVolume ? (p.getVolume()||100) : 100; } else { p.mute(); MT_PLAYER.mudo = true; } }catch(e){}
  _mtBotaoSom();
}
// Códigos oficiais de erro do player do YouTube:
//   2 = parâmetro/ID inválido · 5 = erro do player HTML5 (geralmente temporário)
//   100 = vídeo não encontrado (removido ou privado) · 101 e 150 = dono não permite incorporar
const VID_MOTIVO = {
  '2':   {lbl:'Link inválido', confirmado:true},
  '5':   {lbl:'Erro no player (pode ser temporário)', confirmado:false},
  '100': {lbl:'Removido ou privado', confirmado:true},
  '101': {lbl:'Incorporação desativada pelo dono', confirmado:true},
  '150': {lbl:'Incorporação desativada pelo dono', confirmado:true},
  'offline': {lbl:'Sem conexão', confirmado:false},
  'lento': {lbl:'Demorou para carregar', confirmado:false},
  'manual': {lbl:'Informado pelo aluno', confirmado:false}
};
function _buscaSemelhante(info){
  const eq = (info.equip||[]).includes('academia') ? '' : (info.equip||[]).includes('halteres') ? 'com halteres' : (info.equip||[]).includes('casa') ? 'em casa' : '';
  const q = ['como fazer', info.nome, info.grupo, eq, 'execução correta'].filter(Boolean).join(' ');
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
}
function mtVideoFalha(v, cod){
  const st = $('ex-stage'); if(!st) return;
  const info = MT_PLAYER.info || {nome:'', grupo:'', equip:[]};
  const m = VID_MOTIVO[String(cod)] || VID_MOTIVO['5'];
  const conexao = cod==='offline' || cod==='lento';
  st.classList.remove('ok'); st.classList.add('falha');
  st.innerHTML = `<div class="ex-fail">
    <div class="ex-fail-t">${conexao ? 'Não foi possível carregar o vídeo agora.' : 'Este vídeo não está disponível no momento.'}</div>
    <div class="ex-fail-s">${conexao ? (cod==='offline' ? 'Você parece estar sem internet. Isso não significa que o vídeo foi removido.' : 'A conexão está lenta. Tente de novo em instantes.') : m.lbl+'.'}</div>
    <div class="ex-fail-a">
      ${conexao ? `<button class="btn btn-primary" onclick="mtTentarVideo()">Tentar de novo</button>` : ''}
      <a class="btn ${conexao?'btn-ghost':'btn-primary'}" href="${mtEsc(_buscaSemelhante(info))}" target="_blank" rel="noopener">Buscar vídeo semelhante</a>
      ${conexao ? '' : `<button class="btn btn-ghost" id="ex-rep-btn" onclick="mtReportarVideo('${mtJsStr(v.k)}','${mtJsStr(info.nome)}','${mtJsStr(String(cod))}')">Avisar o treinador</button>`}
    </div></div>`;
  const b = $('ex-som'); if(b) b.style.display = 'none';
}
function mtTentarVideo(){
  const v = MT_PLAYER.v, info = MT_PLAYER.info; if(!v) return;
  const st = $('ex-stage'); if(!st) return;
  st.classList.remove('falha'); st.innerHTML = `<div class="ex-load" id="ex-load"><div class="ex-spin"></div><span>Carregando vídeo…</span></div><div id="ex-yt"></div>`;
  const b = $('ex-som'); if(b) b.style.display = '';
  mtMontarPlayer(v, info);
}

// --- Denúncia de vídeo indisponível ---
// Firestore:
//   videosReportados/{exId}               → 1 documento por exercício (agrupa as denúncias; sem dados pessoais)
//   videosReportados/{exId}/relatos/{uid} → 1 por aluno (o mesmo aluno não conta duas vezes no mesmo ciclo)
// "ciclo" aumenta quando o administrador principal marca como resolvido: um relato novo depois disso conta de novo.
async function mtReportarVideo(exId, nome, cod){
  const url = videoLinks[exId] || '';
  const chaveLocal = 'mt_vrep_'+exId+'_'+(ytVideoId(url)||'x');
  if(mtLS(chaveLocal)){ toast('Você já avisou o treinador sobre este vídeo. Obrigado!'); return; }
  if(!fbUser){ toast('Entre na sua conta para avisar o treinador.'); return; }
  if(navigator.onLine === false){ toast('Sem conexão agora. Tente avisar quando a internet voltar.'); return; }
  const aberto = $('modal-back').classList.contains('on');
  const btn = aberto ? $('ex-rep-btn') : null; if(btn){ if(btn.disabled){ toast('O aviso já foi enviado.'); return; } btn.disabled = true; btn.textContent = 'Enviando…'; }
  const ref = db.collection('videosReportados').doc(exId);
  try{
    const [pai, meu] = await Promise.all([ ref.get(), ref.collection('relatos').doc(fbUser.uid).get() ]);
    const d = pai.exists ? pai.data() : null;
    const ciclo = (d && d.ciclo) || 1;
    const jaContou = meu.exists && (meu.data().ciclo||1) === ciclo;
    const agora = Date.now();
    const achado = (typeof exPorNome==='function') ? exPorNome(nome) : null;
    const inc = firebase.firestore.FieldValue && firebase.firestore.FieldValue.increment;
    const batch = db.batch();
    batch.set(ref.collection('relatos').doc(fbUser.uid), {
      uid: fbUser.uid, email: (state.user&&state.user.email)||'', nome: (state.user&&state.user.profile&&state.user.profile.nickname)||(state.user&&state.user.name)||'',
      em: agora, ciclo, motivo: String(cod||'manual'), url
    });
    const dados = { exId, exercicio: nome, grupo: (achado&&achado.grupo)||'', url, videoId: ytVideoId(url)||'', status:'pendente', ultimoEm: agora, ultimoMotivo: String(cod||'manual') };
    if(!d){ dados.primeiroEm = agora; dados.ciclo = 1; dados.contagem = 1; }
    else if(!jaContou){ dados.contagem = inc ? inc(1) : ((d.contagem||0)+1); }
    batch.set(ref, dados, {merge:true});
    await batch.commit();
    mtLS(chaveLocal, String(agora));
    toast('✅ Treinador avisado. Obrigado por ajudar!');
    if(btn){ btn.textContent = 'Treinador avisado ✓'; }
  }catch(e){
    console.log('denúncia de vídeo:', e);
    toast('⚠️ Não consegui enviar agora. Tente de novo em instantes.');
    if(btn){ btn.disabled = false; btn.textContent = 'Avisar o treinador'; }
  }
}

// --- Painel do administrador: vídeos reportados ---
let vidRepCache = [];
async function loadVideosReportados(){
  const snap = await db.collection('videosReportados').get();
  const arr = []; snap.forEach(d=>arr.push(Object.assign({id:d.id}, d.data())));
  vidRepCache = arr; return arr;
}
function _admVidBadge(){
  const n = vidRepCache.filter(x=>x.status!=='resolvido').length;
  const el = $('adm-vid-badge'); if(el){ el.textContent = n; el.style.display = n ? '' : 'none'; }
}
async function openVideosReportados(filtro){
  filtro = filtro || window.__vrFiltro || 'pendente'; window.__vrFiltro = filtro;
  $('modal-inner').innerHTML = `<h3>Vídeos reportados</h3><div class="mt-loading"><div class="ex-spin"></div><span>Carregando ocorrências…</span></div>`;
  $('modal-back').classList.add('on');
  try{ await loadVideosReportados(); }
  catch(e){
    $('modal-inner').innerHTML = `<h3>Vídeos reportados</h3><p class="mt-muted">Não consegui ler as ocorrências. Confira a conexão e se as regras do Firestore desta versão foram publicadas (coleção <b>videosReportados</b>).</p><button class="btn btn-primary btn-block" onclick="openVideosReportados()">Tentar de novo</button><button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
    return;
  }
  _admVidBadge();
  const princ = mtAdmin();
  const lista = vidRepCache.filter(x=> filtro==='todos' ? true : filtro==='resolvido' ? x.status==='resolvido' : x.status!=='resolvido')
    .sort((a,b)=> (a.status==='resolvido') - (b.status==='resolvido') || (b.contagem||0)-(a.contagem||0) || (b.ultimoEm||0)-(a.ultimoEm||0));
  const pend = vidRepCache.filter(x=>x.status!=='resolvido').length;
  const chip = (k,l)=>`<button type="button" class="nxchip ${k===filtro?'on':''}" onclick="openVideosReportados('${k}')">${l}</button>`;
  const linha = x=>{
    const m = VID_MOTIVO[String(x.ultimoMotivo)] || {lbl:x.ultimoMotivo||'—'};
    const mudou = x.url && videoLinks[x.id] && videoLinks[x.id] !== x.url;
    return `<div class="vr-item">
      <div style="display:flex;gap:10px;align-items:flex-start">
        <div class="vr-n">${x.contagem||1}</div>
        <div style="flex:1;min-width:0"><b style="font-size:14px">${mtEsc(x.exercicio||x.id)}</b>
          <div class="mt-muted" style="font-size:11.5px">${mtEsc(x.grupo||'')}${x.grupo?' · ':''}${mtEsc(m.lbl)} · último aviso ${x.ultimoEm?mtFmtData(x.ultimoEm,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—'}</div>
          <div style="font-size:11.5px;margin-top:3px;word-break:break-all"><a href="${mtEsc(x.url||'#')}" target="_blank" rel="noopener" style="color:var(--primary-2)">${mtEsc(x.url||'sem link')}</a></div>
          ${mudou?`<div style="font-size:11.5px;color:var(--accent);margin-top:3px">O link deste exercício já foi trocado depois dos avisos.</div>`:''}
        </div>
        <span class="pill ${x.status==='resolvido'?'':'on'}">${x.status==='resolvido'?'resolvido':'pendente'}</span>
      </div>
      <div class="vr-a">
        <button class="btn btn-ghost" onclick="mtVerRelatos('${mtJsStr(x.id)}')">Quem avisou</button>
        <button class="btn btn-ghost" onclick="closeModal();setTimeout(()=>openExerciseSheet('${mtJsStr(x.exercicio||x.id)}','${mtJsStr(x.id)}'),80)">Abrir exercício</button>
        ${princ?`<button class="btn btn-ghost" onclick="mtEditarLinkVideo('${mtJsStr(x.id)}')">Trocar link</button>`:''}
        ${princ && x.status!=='resolvido'?`<button class="btn btn-primary" onclick="mtResolverVideo('${mtJsStr(x.id)}')">Marcar resolvido</button>`:''}
      </div></div>`;
  };
  $('modal-inner').innerHTML = `<h3>Vídeos reportados</h3>
    <p class="mt-muted" style="margin:0 0 10px">${pend ? `<b>${pend}</b> ${pend===1?'vídeo com problema':'vídeos com problema'}. Cada exercício aparece uma vez só, com o número de alunos que avisaram.` : 'Nenhum vídeo pendente. 👌'}</p>
    <div class="nxchips" style="margin-bottom:10px">${chip('pendente','Pendentes')}${chip('resolvido','Resolvidos')}${chip('todos','Todos')}</div>
    <div style="max-height:56vh;overflow-y:auto">${lista.map(linha).join('') || '<div class="mt-muted" style="padding:14px 0;text-align:center">Nada por aqui.</div>'}</div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
}
async function mtVerRelatos(exId){
  $('modal-inner').innerHTML = `<h3>Quem avisou</h3><div class="mt-loading"><div class="ex-spin"></div><span>Carregando…</span></div>`;
  try{
    const snap = await db.collection('videosReportados').doc(exId).collection('relatos').get();
    const arr = []; snap.forEach(d=>arr.push(d.data())); arr.sort((a,b)=>(b.em||0)-(a.em||0));
    const x = vidRepCache.find(v=>v.id===exId) || {};
    $('modal-inner').innerHTML = `<h3>${mtEsc(x.exercicio||exId)}</h3>
      <div class="card" style="padding:6px 12px;max-height:50vh;overflow:auto">${arr.map(r=>`<div class="ev-list-item"><div style="flex:1;min-width:0"><b style="font-size:13px">${mtEsc(r.nome||r.email||'Aluno')}</b><div class="mt-muted" style="font-size:11.5px">${mtEsc(r.email||'')} · ${r.em?mtFmtData(r.em,{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):''}</div></div><span class="pill">${mtEsc((VID_MOTIVO[String(r.motivo)]||{lbl:r.motivo}).lbl)}</span>${(r.ciclo||1)!==(x.ciclo||1)?'<span class="pill" style="margin-left:4px">antes da última correção</span>':''}</div>`).join('') || '<div class="mt-muted" style="padding:10px 0">Sem relatos.</div>'}</div>
      <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openVideosReportados()">Voltar</button>`;
  }catch(e){ toast('⚠️ Não consegui carregar os relatos.'); openVideosReportados(); }
}
function mtEditarLinkVideo(exId){
  if(!mtAdmin()){ toast('🔒 Somente administradores.'); return; }
  const x = vidRepCache.find(v=>v.id===exId) || {id:exId};
  $('modal-inner').innerHTML = `<h3>Trocar vídeo</h3><p class="mt-muted" style="margin:0 0 6px"><b>${mtEsc(x.exercicio||exId)}</b></p>
    <div class="adm-form"><label>Link atual</label><div style="font-size:12px;word-break:break-all;color:var(--text-dim)">${mtEsc(videoLinks[exId]||x.url||'—')}</div>
    <label>Novo link do YouTube</label><input class="input" id="vr-url" inputmode="url" placeholder="https://youtube.com/..." value="">
    <label>Perfil do criador (crédito, opcional)</label><input class="input" id="vr-cred" inputmode="url" value="${mtEsc(videoCredits[exId]||'')}"></div>
    <a class="btn btn-ghost btn-block" style="margin-top:10px" href="${mtEsc(_buscaSemelhante({nome:x.exercicio||exId, grupo:x.grupo, equip:(exPorNome(x.exercicio||'')||{ex:{}}).ex.equip||[]}))}" target="_blank" rel="noopener">Procurar no YouTube ↗</a>
    <button class="btn btn-primary btn-block" style="margin-top:8px" id="vr-salvar" onclick="mtSalvarLinkVideo('${mtJsStr(exId)}')">Salvar e marcar resolvido</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openVideosReportados()">Voltar</button>`;
}
async function mtSalvarLinkVideo(exId){
  if(!mtAdmin()) return;
  const url = $('vr-url').value.trim(), cred = $('vr-cred').value.trim();
  if(!ytVideoId(url)){ toast('⚠️ Cole um link de vídeo do YouTube válido'); return; }
  if(cred && !/^https?:\/\//i.test(cred)){ toast('⚠️ O link do perfil precisa começar com http:// ou https://'); return; }
  await mtComBotao('vr-salvar', 'Salvando…', async ()=>{
    const x = vidRepCache.find(v=>v.id===exId) || {};
    const data = { nome: x.exercicio || exId, url, atualizadoEm: Date.now() }; if(cred) data.credito = cred;
    await db.collection('videosExercicios').doc(exId).set(data, {merge:true});
    videoLinks[exId] = url; if(cred) videoCredits[exId] = cred;
    mtLS('metatreino_videos', JSON.stringify(videoLinks));
    await _resolver(exId, 'link substituído');
    toast('✅ Vídeo trocado e ocorrência resolvida');
    openVideosReportados();
  });
}
async function _resolver(exId, como){
  const x = vidRepCache.find(v=>v.id===exId) || {};
  await db.collection('videosReportados').doc(exId).set({ status:'resolvido', resolvidoEm: Date.now(), resolvidoPor: state.user.email, resolucao: como||'', ciclo: (x.ciclo||1)+1, contagem: 0, contagemAnterior: x.contagem||0 }, {merge:true});
}
function mtResolverVideo(exId){
  if(!mtAdmin()) return;
  appConfirm('Marque como resolvido depois de corrigir ou substituir o vídeo. Se algum aluno avisar de novo, a ocorrência volta como pendente.', async ()=>{
    try{ await _resolver(exId, 'marcado como resolvido'); toast('✅ Ocorrência resolvida'); }catch(e){ toast('⚠️ O Firestore recusou. Confira as regras publicadas.'); }
    openVideosReportados();
  }, {title:'Marcar como resolvido?', emo:'🎬', okLabel:'Resolvido', onCancel:()=>openVideosReportados()});
}
// (Beta 13) manutenção dos links volta a ser de todos os administradores — sem trava extra aqui.

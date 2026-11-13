
// =====================================================================
// 29. AJUSTES DA BETA 18
//   a. balão do Meta Assistente: cada aviso aparece uma vez, por alguns segundos
//   b. mural e logo: enquadramento, prévias no tamanho real e proporções recomendadas
//   c. anotações automáticas do dia no calendário (calculadas, sem gravar nada novo)
// =====================================================================

// ---------- a. balão do Meta Assistente ----------
// Antes: o balão voltava a cada troca de aba (a função roda em toda navegação), ficando quase fixo.
// Agora: cada aviso aparece UMA vez por alguns segundos e some; o botão continua colorido e, ao tocar,
// o assistente abre começando pelo aviso.
const FAB_VISTOS_KEY = 'mt_fab_vistos';
function _fabVistos(){ try{ const o = JSON.parse(localStorage.getItem(FAB_VISTOS_KEY)||'{}'); const lim = Date.now() - 24*3600000; Object.keys(o).forEach(k=>{ if(o[k] < lim) delete o[k]; }); return o; }catch(e){ return {}; } }
function _fabEsconde(imediato){
  const b = document.getElementById('fab-bubble'); if(!b) return;
  clearTimeout(window._fabBubbleT);
  if(imediato){ b.classList.remove('on'); b.style.display = 'none'; return; }
  b.classList.remove('on'); setTimeout(()=>{ if(!b.classList.contains('on')) b.style.display = 'none'; }, 320);
}
window.updateFabNudge = function(){
  const fab = document.getElementById('ma-fab'); if(!fab) return;
  let n = null; try{ n = maNudge(); }catch(e){}
  fab.classList.remove('fab-curio','fab-important','fab-rare','fab-special','fab-alert');
  if(!n){ maNudgeAtivo = null; _fabEsconde(true); return; }
  fab.classList.add('fab-alert','fab-'+(n.tone||'important'));
  maNudgeAtivo = n;
  const naSessao = (state.ui && state.ui.tab) === 'sessions';
  const vistos = _fabVistos();
  const chave = String(n.text||'').slice(0,120);
  if(naSessao || vistos[chave]) return;               // já mostrado: só o botão colorido indica que há algo
  vistos[chave] = Date.now(); try{ localStorage.setItem(FAB_VISTOS_KEY, JSON.stringify(vistos)); }catch(e){}
  let bubble = document.getElementById('fab-bubble');
  if(!bubble){ bubble = document.createElement('div'); bubble.id = 'fab-bubble'; bubble.setAttribute('role','status'); document.body.appendChild(bubble); bubble.onclick = function(){ _fabEsconde(true); openAssistant(); }; }
  bubble.textContent = n.text;
  bubble.style.display = 'block';
  requestAnimationFrame(()=>bubble.classList.add('on'));
  clearTimeout(window._fabBubbleT);
  const dur = Math.min(9000, Math.max(5000, 3500 + String(n.text).length*45));   // tempo de leitura
  window._fabBubbleT = setTimeout(()=>_fabEsconde(false), dur);
};
// abrir o assistente também recolhe o balão
const _openAssistantB18 = window.openAssistant;
window.openAssistant = function(){ _fabEsconde(true); return _openAssistantB18.apply(this, arguments); };

// ---------- b. mural e logo ----------
const MUR = { LOGO:256, CAPA_W:1440, CAPA_H:600, CAPA_AR:2.4, LIMITE_KB:900 };
let _murEd = null;
function _murAtuais(){
  const m = coachMural || {};
  // dados antigos: uma única foto servia de logo e de capa
  const capa = m.capaFoto || (m.capa ? m.foto : null);
  const logo = m.capaFoto ? (m.foto || null) : (m.capa ? null : (m.foto || null));
  return { capa, logo, usarCapa: !!(m.capa && capa) };
}
window.openMuralAdmin = function(){
  const m = coachMural || {}; const at = _murAtuais();
  _murEd = { logo:{ img:null, out:undefined, atual:at.logo, modo:'preencher', zoom:1, x:50, y:50, w:0, h:0 },
             capa:{ img:null, out:undefined, atual:at.capa, zoom:1, x:50, y:50, w:0, h:0 }, usarCapa: at.usarCapa };
  const sl = (id, rot, min, max, val, step)=>`<label class="mur-sl"><span>${rot}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step||1}" value="${val}"></label>`;
  $('modal-inner').innerHTML = `
    <h3>📢 Mural e logo do app</h3>
    <p style="color:var(--text-dim);font-size:13px;line-height:1.5;margin-top:4px">A mensagem fica fixada na tela Hoje de todos os alunos. O logo substitui o "M" dos cabeçalhos; a capa (opcional) vira um banner na tela Hoje.</p>
    <div class="field" style="margin-top:12px"><label>Mensagem fixada (vazio = sem mensagem)</label><textarea class="input" id="mural-msg" rows="3" style="resize:vertical">${(m.mensagem||'').replace(/</g,'&lt;')}</textarea></div>

    <div class="mur-sec">
      <div class="mur-h">Logo do app</div>
      <div class="mur-logo-row">
        <div class="mur-logo-big" id="mur-logo-big"></div>
        <div class="mur-logo-real"><div class="mur-logo-mini" id="mur-logo-mini"></div><div class="mur-logo-hdr"><div class="mur-logo-mini sm" id="mur-logo-mini2"></div><b>METATREINO</b></div><small>como aparece no app</small></div>
      </div>
      <div class="mur-dica">📐 <b>Quadrada (1:1)</b>, de <b>512 × 512 px</b> ou maior. PNG com fundo transparente fica melhor. Abaixo de 160 × 160 px a imagem fica borrada.</div>
      <div class="mur-info" id="mur-logo-info"></div>
      <div id="mur-logo-aj" class="mur-aj" hidden>
        <div class="mod-toggle" style="margin:0 0 8px"><button class="seg on" id="mur-logo-m1" onclick="murLogoModo('preencher')">Preencher (corta)</button><button class="seg" id="mur-logo-m2" onclick="murLogoModo('inteira')">Inteira (sem cortar)</button></div>
        <div id="mur-logo-sls">${sl('mur-logo-z','Zoom',100,300,100)}${sl('mur-logo-x','Horizontal',0,100,50)}${sl('mur-logo-y','Vertical',0,100,50)}</div>
      </div>
      <div class="row" style="gap:8px;margin-top:8px"><button class="btn btn-ghost" style="flex:1" onclick="$('mur-logo-file').click()">📷 Escolher logo</button><button class="btn btn-ghost" id="mur-logo-rm" onclick="murRemover('logo')">🗑️ Remover</button></div>
      <input type="file" id="mur-logo-file" accept="image/*" style="display:none" onchange="murArquivo(event,'logo')">
    </div>

    <div class="mur-sec">
      <div class="list-row" style="margin:0;padding:10px 0;border:0;background:none" onclick="murToggleCapa()">
        <span style="font-size:17px">🖼️</span>
        <div style="flex:1"><div style="font-weight:700;font-size:13.5px">Capa larga na tela Hoje</div><div style="font-size:11.5px;color:var(--text-mute);line-height:1.45">Banner com a saudação por cima. Usa uma imagem própria, separada do logo.</div></div>
        <input type="checkbox" id="mur-capa-on" ${_murEd.usarCapa?'checked':''} style="pointer-events:none">
      </div>
      <div id="mur-capa-box" ${_murEd.usarCapa?'':'hidden'}>
        <div class="mur-capa-prev" id="mur-capa-prev"><div class="mur-capa-bg" id="mur-capa-bg"></div><div class="hero-scrim"></div><div class="mur-capa-txt"><b>Bom dia, ${mtEsc(((state.user&&state.user.name)||'Aluno').split(' ')[0])}! 👋</b><small>Treino de hoje: Peito e Tríceps</small></div></div>
        <div class="mur-dica">📐 <b>Horizontal, proporção 2,4 : 1</b> — por exemplo <b>1440 × 600 px</b> (2 : 1 também serve). Deixe o assunto principal no centro e no alto: a parte de baixo recebe a saudação, e as bordas podem variar um pouco entre celulares. Evite textos na imagem.</div>
        <div class="mur-info" id="mur-capa-info"></div>
        <div id="mur-capa-aj" class="mur-aj" hidden>${sl('mur-capa-z','Zoom',100,300,100)}${sl('mur-capa-x','Horizontal',0,100,50)}${sl('mur-capa-y','Vertical',0,100,50)}</div>
        <div class="row" style="gap:8px;margin-top:8px"><button class="btn btn-ghost" style="flex:1" onclick="$('mur-capa-file').click()">📷 Escolher capa</button><button class="btn btn-ghost" id="mur-capa-rm" onclick="murRemover('capa')">🗑️ Remover</button></div>
        <input type="file" id="mur-capa-file" accept="image/*" style="display:none" onchange="murArquivo(event,'capa')">
      </div>
    </div>
    <div class="mur-info" id="mur-peso" style="text-align:center"></div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="saveMural()">💾 Publicar pra todos os alunos</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`;
  $('modal-back').classList.add('on');
  ['logo','capa'].forEach(t=>['z','x','y'].forEach(c=>{ const el = $(`mur-${t}-${c}`); if(el) el.addEventListener('input', ()=>{ const E = _murEd[t]; E[c==='z'?'zoom':c] = c==='z' ? (+el.value)/100 : +el.value; murProcessar(t); }); }));
  murPrevias();
};
function murToggleCapa(){ const c = $('mur-capa-on'); c.checked = !c.checked; _murEd.usarCapa = c.checked; $('mur-capa-box').hidden = !c.checked; murPrevias(); }
function murLogoModo(m){ _murEd.logo.modo = m; $('mur-logo-m1').classList.toggle('on', m==='preencher'); $('mur-logo-m2').classList.toggle('on', m==='inteira'); $('mur-logo-sls').style.display = m==='preencher' ? '' : 'none'; murProcessar('logo'); }
function murRemover(t){ const E = _murEd[t]; E.out = null; E.img = null; const aj = $(`mur-${t}-aj`); if(aj) aj.hidden = true; const i = $(`mur-${t}-info`); if(i) i.textContent = t==='logo' ? 'Logo removido: os cabeçalhos voltam a mostrar o "M".' : 'Capa removida.'; murPrevias(); }
function murArquivo(ev, t){
  const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{ const img = new Image(); img.onload = ()=>{ const E = _murEd[t]; E.img = img; E.w = img.naturalWidth; E.h = img.naturalHeight; E.png = /png|webp|gif|svg/i.test(f.type); E.zoom = 1; E.x = 50; E.y = 50;
      ['z','x','y'].forEach(c=>{ const el = $(`mur-${t}-${c}`); if(el) el.value = c==='z' ? 100 : 50; });
      const aj = $(`mur-${t}-aj`); if(aj) aj.hidden = false; murProcessar(t); };
    img.onerror = ()=>toast('Não consegui abrir essa imagem. Tente JPG ou PNG.'); img.src = r.result; };
  r.readAsDataURL(f);
}
// recorte: maior área com a proporção pedida (cobre), com zoom e posição escolhidos pelo admin
function _murRecorte(E, ar){
  let cw = E.w, ch = cw/ar; if(ch > E.h){ ch = E.h; cw = ch*ar; }
  cw /= E.zoom; ch /= E.zoom;
  return { sx:(E.w-cw)*E.x/100, sy:(E.h-ch)*E.y/100, cw, ch };
}
function _murTemAlfa(cv){ try{ const d = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data; for(let i=3;i<d.length;i+=16) if(d[i] < 250) return true; }catch(e){} return false; }
let _murT = null;
function murProcessar(t){ clearTimeout(_murT); _murT = setTimeout(()=>_murProcessarJa(t), 60); }
function _murProcessarJa(t){
  const E = _murEd && _murEd[t]; if(!E || !E.img) return;
  const cv = document.createElement('canvas'); const g = cv.getContext('2d');
  const info = $(`mur-${t}-info`); const msgs = [];
  if(t === 'logo'){
    cv.width = MUR.LOGO; cv.height = MUR.LOGO;
    if(E.modo === 'inteira'){
      const esc = Math.min(MUR.LOGO/E.w, MUR.LOGO/E.h); const w = E.w*esc, h = E.h*esc;
      g.drawImage(E.img, (MUR.LOGO-w)/2, (MUR.LOGO-h)/2, w, h);
      if(Math.min(E.w, E.h) < 160) msgs.push(`⚠️ Imagem pequena (${E.w} × ${E.h} px): pode ficar borrada. Ideal: 512 × 512 px ou maior.`);
    } else {
      const c = _murRecorte(E, 1); g.drawImage(E.img, c.sx, c.sy, c.cw, c.ch, 0, 0, MUR.LOGO, MUR.LOGO);
      if(c.cw < 160) msgs.push(`⚠️ A área usada tem ${Math.round(c.cw)} × ${Math.round(c.ch)} px: vai ficar borrada. Ideal: 512 × 512 px ou maior.`);
      if(Math.abs(E.w/E.h - 1) > 0.08) msgs.push(`ℹ️ A imagem não é quadrada (${E.w} × ${E.h} px): parte dela fica de fora. Ajuste o enquadramento ou use "Inteira".`);
    }
    const alfa = E.png && _murTemAlfa(cv);
    E.out = alfa ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.86);
    if(!msgs.length) msgs.push(`✅ Boa resolução (${E.w} × ${E.h} px)${alfa ? ' · fundo transparente mantido' : ''}.`);
  } else {
    const c = _murRecorte(E, MUR.CAPA_AR);
    const W = Math.round(Math.min(MUR.CAPA_W, Math.max(720, c.cw))), H = Math.round(W/MUR.CAPA_AR);
    cv.width = W; cv.height = H; g.drawImage(E.img, c.sx, c.sy, c.cw, c.ch, 0, 0, W, H);
    E.out = cv.toDataURL('image/jpeg', 0.80);
    if(c.cw < 900) msgs.push(`⚠️ A área usada tem ${Math.round(c.cw)} × ${Math.round(c.ch)} px: pode ficar borrada em telas maiores. Ideal: 1440 × 600 px ou maior.`);
    const ar = E.w/E.h;
    if(ar < 1.9) msgs.push(`ℹ️ Imagem ${ar < 1 ? 'vertical' : 'pouco larga'} (${E.w} × ${E.h} px): boa parte de cima e de baixo fica de fora. Use o ajuste vertical para escolher o trecho.`);
    else if(ar > 2.9) msgs.push(`ℹ️ Imagem muito larga (${E.w} × ${E.h} px): as laterais ficam de fora.`);
    if(!msgs.length) msgs.push(`✅ Boa resolução e proporção (${E.w} × ${E.h} px).`);
  }
  if(info) info.innerHTML = msgs.join('<br>');
  murPrevias();
}
function _murImgLogo(){ const E = _murEd.logo; return E.out === null ? null : (E.out || E.atual); }
function _murImgCapa(){ const E = _murEd.capa; return E.out === null ? null : (E.out || E.atual); }
function murPrevias(){
  if(!_murEd) return;
  const lg = _murImgLogo();
  const htmlLogo = lg ? `<img src="${lg}" alt="">` : 'M';
  ['mur-logo-big','mur-logo-mini','mur-logo-mini2'].forEach(id=>{ const el = $(id); if(el){ el.innerHTML = htmlLogo; el.classList.toggle('vazio', !lg); } });
  const rmL = $('mur-logo-rm'); if(rmL) rmL.disabled = !lg;
  const cp = _murImgCapa();
  const bg = $('mur-capa-bg'); if(bg) bg.style.backgroundImage = cp ? `url('${cp}')` : 'none';
  const pv = $('mur-capa-prev'); if(pv) pv.classList.toggle('vazio', !cp);
  const rmC = $('mur-capa-rm'); if(rmC) rmC.disabled = !cp;
  // tamanho total (o documento do Firestore aceita até 1 MB)
  const kb = Math.round(((lg||'').length + ((_murEd.usarCapa && cp) ? cp.length : 0) + 2000)/1024);
  const p = $('mur-peso'); if(p) p.innerHTML = kb > MUR.LIMITE_KB ? `⚠️ Total ${kb} KB — passa do limite. Use imagens menores ou aumente o zoom.` : `Tamanho total: ${kb} KB ✅`;
}
window.saveMural = async function(){
  if(!_murEd){ return; }
  const msg = $('mural-msg').value.trim();
  const logo = _murImgLogo(), capa = _murImgCapa();
  const usarCapa = !!(_murEd.usarCapa && capa);
  const kb = Math.round(((logo||'').length + (usarCapa ? capa.length : 0))/1024);
  if(kb > MUR.LIMITE_KB){ toast('⚠️ Imagens grandes demais para publicar. Ajuste e tente de novo.'); return; }
  const data = { mensagem: msg, atualizadoEm: Date.now(), foto: logo || null, capa: usarCapa, capaFoto: usarCapa ? capa : null };
  try{
    await db.collection('config').doc('mural').set(data);
    coachMural = data; _murEd = null;
    try{ localStorage.setItem('metatreino_mural', JSON.stringify(coachMural)); }catch(e){}
    renderCoachMural(); try{ applyHeroCapa(); }catch(e){}
    closeModal(); toast('📢 Mural publicado pra todos os alunos!');
  }catch(e){ console.log('Erro ao salvar mural:', e); toast('⚠️ Não foi possível publicar. Confira a conexão e as regras do Firestore (coleção config).'); }
};
// capa e logo agora podem ser imagens diferentes
window.applyHeroCapa = function(){
  try{
    const hero = $('home-hero'); if(!hero) return;
    const foto = coachMural && (coachMural.capaFoto || coachMural.foto);
    const usar = !!(foto && coachMural && coachMural.capa);
    hero.classList.toggle('hidden', !usar);
    const brandRow = $('home-brand-row'), greetRow = $('home-greet-row');
    if(brandRow) brandRow.classList.toggle('hidden', usar);
    if(greetRow) greetRow.classList.toggle('hidden', usar);
    if(!usar) return;
    const bg = $('home-hero-bg'); if(bg) bg.style.backgroundImage = `url('${foto}')`;
    const hi = $('home-hi'), sub = $('home-goal');
    if(hi && $('hero-hi')) $('hero-hi').innerHTML = hi.innerHTML;
    if(sub && $('hero-sub')) $('hero-sub').innerHTML = sub.innerHTML;
  }catch(e){ console.log('Erro na capa:', e); }
};

// ---------- c. anotações automáticas do dia ----------
// Calculadas na hora a partir do que o app JÁ guarda (treinos, cargas, recordes, provas, conquistas, metas).
// Nada novo vai para o banco: só quando o aluno remove um destaque fica uma marca curta (ex.: "carga:supino").
function _dia0(t){ const d = new Date(t); d.setHours(0,0,0,0); return d.getTime(); }
function _nomeEx(id){ try{ return nomeDoEx(id); }catch(e){ return id; } }
function dayAutoNotes(ts){
  const out = []; const ini = _dia0(ts), fim = ini + DIA_MS;
  const noDia = t => t >= ini && t < fim;
  const lifts = ((state.modules.lift && state.modules.lift.history)||[]).filter(h=>h && noDia(h.at));
  const ativ = ((state.modules.run && state.modules.run.history)||[]).filter(h=>h && noDia(h.at));
  // modo adaptado registrado no próprio treino (TPM, cólica, dor, cansaço)
  const ad = lifts.map(h=>h.adaptedWith).filter(Boolean)[0];
  if(ad){
    const tpm = /TPM/.test(ad), col = /cólica/.test(ad), dor = /dor/.test(ad), cans = /cansaço/.test(ad);
    const emo = (tpm||col) ? '💗' : dor ? '🩹' : '😮‍💨';
    out.push({ k:'adapt', emo, txt: `Treinou ${[tpm?'em TPM':'', col?'com cólica':'', dor ? 'com '+((ad.match(/dor \([^)]*\)/)||['dor'])[0]) : '', cans?'cansado(a), no modo leve':''].filter(Boolean).join(' e ')} — e foi mesmo assim.` });
  }
  if(lifts.some(h=>h.feel==='exausto')) out.push({ k:'feel', emo:'🥵', txt:'Treino muito puxado: você marcou "exausto".' });
  // recordes e cargas
  const prs = state.prs || {}; const prHoje = new Set();
  Object.keys(prs).forEach(id=>{ const p = prs[id]; if(p && p.at && noDia(p.at)){ prHoje.add(id); out.push({ k:'pr:'+id, emo:'🏆', txt:`Recorde em ${_nomeEx(id)}: ${p.peso>0 ? String(p.peso).replace('.',',')+' kg × '+p.reps : p.reps+' repetições'}` }); } });
  const subidas = [];
  Object.keys(state.progress||{}).forEach(id=>{
    if(prHoje.has(id)) return;
    try{ if(typeof exBankIsIso==='function' && exBankIsIso(id)) return; }catch(e){}
    const arr = (state.progress[id]||[]).filter(p=>p && p.date && p.sets && p.sets.length);
    const hoje = arr.filter(p=>noDia(p.date)); if(!hoje.length) return;
    const antes = arr.filter(p=>p.date < ini).sort((a,b)=>b.date-a.date)[0]; if(!antes) return;
    const max = l => Math.max(0, ...l.sets.map(s=>+s.peso||0));
    const de = max(antes), para = Math.max(...hoje.map(max));
    if(de > 0 && para > de) subidas.push({ id, de, para });
  });
  subidas.slice(0,3).forEach(s=>out.push({ k:'carga:'+s.id, emo:'⬆️', txt:`Subiu carga em ${_nomeEx(s.id)}: ${String(s.de).replace('.',',')} → ${String(s.para).replace('.',',')} kg` }));
  if(subidas.length > 3) out.push({ k:'carga+', emo:'⬆️', txt:`Subiu carga em mais ${subidas.length-3} exercício${subidas.length-3>1?'s':''}: ${subidas.slice(3).map(s=>_nomeEx(s.id)).join(', ')}` });
  // corrida
  const S = state.corridaStats || {};
  ativ.filter(r=>r.isRace).forEach(r=>out.push({ k:'prova', emo:'🏅', txt:`Prova: ${mtFmtKm(r.distance)} km em ${typeof rFmtMin==='function' ? rFmtMin(r.duration) : Math.round(r.duration)+' min'}` }));
  [['3','3 km'],['5','5 km'],['10','10 km'],['21','21 km'],['42','42 km']].forEach(([k,n])=>{ const r = (S.recordes||{})[k]; if(r && noDia(r.at)) out.push({ k:'rec'+k, emo:'⏱️', txt:`Melhor marca nos ${n}: ${typeof rFmtMin==='function' ? rFmtMin(r.min) : Math.round(r.min)+' min'}` }); });
  const corr = ((state.modules.run && state.modules.run.history)||[]).filter(r=>(!r.activity || r.activity==='corrida') && +r.distance>0);
  const maiorHoje = Math.max(0, ...ativ.filter(r=>(!r.activity || r.activity==='corrida')).map(r=>+r.distance||0));
  const anteriores = corr.filter(r=>r.at < ini);
  if(maiorHoje >= 3 && anteriores.length >= 3 && maiorHoje > Math.max(...anteriores.map(r=>+r.distance))) out.push({ k:'maiorkm', emo:'📏', txt:`Sua maior distância até aqui: ${mtFmtKm(maiorHoje)} km` });
  if(typeof RUN_METAS !== 'undefined') RUN_METAS.forEach(m=>{ const at = (S.metas||{})[m.k]; if(at && typeof at === 'number' && noDia(at)) out.push({ k:'meta:'+m.k, emo:'🎯', txt:`Meta alcançada: ${m.nome}` }); });
  // volta depois de uma pausa (primeiro treino após 7+ dias)
  if(lifts.length || ativ.length){
    const todas = [...((state.modules.lift && state.modules.lift.history)||[]), ...((state.modules.run && state.modules.run.history)||[])].map(h=>h && h.at).filter(t=>t && t < ini);
    const ult = todas.length ? Math.max(...todas) : null;
    if(ult){ const dias = Math.round((ini - _dia0(ult))/DIA_MS); if(dias >= 7) out.push({ k:'volta', emo:'🔁', txt:`Voltou a treinar depois de ${dias} dias parado(a).` }); }
  }
  // conquistas
  const tds = state.trophyDates || {};
  const tHoje = Object.keys(tds).filter(id=>noDia(tds[id]));
  tHoje.slice(0,3).forEach(id=>{ const t = (typeof TROPHIES!=='undefined' ? TROPHIES.find(x=>x.id===id) : null); if(t) out.push({ k:'trofeu:'+id, emo:'🎖️', txt:`Conquista desbloqueada: ${t.name}` }); });
  if(tHoje.length > 3) out.push({ k:'trofeu+', emo:'🎖️', txt:`E mais ${tHoje.length-3} conquista${tHoje.length-3>1?'s':''} neste dia.` });
  const ocultas = new Set(((state.dayNotesOcultas||{})[ini])||[]);
  return out.map(n=>Object.assign(n, { oculta: ocultas.has(n.k) }));
}
let _dnPend = null;   // destaques passados para o texto (só valem se a anotação for salva)
const _openDayDetailB18 = window.openDayDetail;
window.openDayDetail = function(ts){
  const r = _openDayDetailB18.apply(this, arguments);
  try{ _dnRender(ts); }catch(e){ console.log('anotações automáticas', e); }
  return r;
};
function _dnRender(ts){
  const ini = _dia0(ts);
  _dnPend = _dnPend && _dnPend.ts === ini ? _dnPend : { ts:ini, ocultar:[] };
  const todas = dayAutoNotes(ini).filter(n=>!_dnPend.ocultar.includes(n.k));
  const vis = todas.filter(n=>!n.oculta), ocultas = todas.filter(n=>n.oculta);
  const area = $('day-note'); if(!area) return;
  const campo = area.closest('.field');
  let box = $('dn-auto'); if(box) box.remove();
  if(!vis.length && !ocultas.length) return;
  box = document.createElement('div'); box.id = 'dn-auto'; box.className = 'dn-auto';
  box.innerHTML = `<div class="dn-h">✨ Destaques do dia <small>automáticos</small></div>
    ${vis.map(n=>`<div class="dn-item"><span class="dn-emo">${n.emo}</span><span class="dn-txt">${mtEsc(n.txt)}</span>
      <button class="dn-b" title="Editar no texto" aria-label="Editar: ${mtEsc(n.txt)}" onclick="dnEditar(${ini},'${mtJsStr(n.k)}')">✏️</button><button class="dn-b" title="Remover" aria-label="Remover: ${mtEsc(n.txt)}" onclick="dnRemover(${ini},'${mtJsStr(n.k)}')">✕</button></div>`).join('')}
    ${ocultas.length ? `<button class="dn-rest" onclick="dnRestaurar(${ini})">Mostrar ${ocultas.length} destaque${ocultas.length>1?'s':''} removido${ocultas.length>1?'s':''}</button>` : ''}
    <div class="dn-nota">Gerados pelos seus registros. ✏️ leva o texto para a sua anotação, onde você edita e acrescenta.</div>`;
  campo.parentNode.insertBefore(box, campo);
  const lbl = campo.querySelector('label'); if(lbl) lbl.textContent = '📝 Sua anotação';
}
function _dnOcultar(ts, k, salvar){
  state.dayNotesOcultas = state.dayNotesOcultas || {};
  const l = state.dayNotesOcultas[ts] = state.dayNotesOcultas[ts] || [];
  if(!l.includes(k)) l.push(k);
  if(salvar) saveData();
}
function dnRemover(ts, k){ _dnOcultar(ts, k, true); _dnRender(ts); try{ renderCalendar(); }catch(e){} toast('Destaque removido. Dá para mostrar de novo aqui mesmo.'); }
function dnRestaurar(ts){ if(state.dayNotesOcultas){ delete state.dayNotesOcultas[ts]; saveData(); } _dnPend = null; _dnRender(ts); try{ renderCalendar(); }catch(e){} }
function dnEditar(ts, k){
  const n = dayAutoNotes(ts).find(x=>x.k===k); if(!n) return;
  const area = $('day-note'); const linha = `${n.emo} ${n.txt}`;
  area.value = area.value.trim() ? area.value.trim() + '\n' + linha : linha;
  _dnPend.ocultar.push(k);
  _dnRender(ts);
  area.focus(); try{ area.setSelectionRange(area.value.length, area.value.length); }catch(e){}
}
const _saveDayNoteB18 = window.saveDayNote;
window.saveDayNote = function(ts){
  try{ const ini = _dia0(ts); if(_dnPend && _dnPend.ts === ini && _dnPend.ocultar.length){ _dnPend.ocultar.forEach(k=>_dnOcultar(ini, k, false)); } }catch(e){}
  _dnPend = null;
  return _saveDayNoteB18.apply(this, arguments);
};
// marca discreta ✦ nos dias com destaque (quando não há anotação escrita)
const _renderCalendarB18 = window.renderCalendar;
window.renderCalendar = function(){
  const r = _renderCalendarB18.apply(this, arguments);
  try{
    document.querySelectorAll('.cal-day[onclick*="openDayDetail"]').forEach(c=>{
      const m = (c.getAttribute('onclick')||'').match(/openDayDetail\((\d+)\)/); if(!m) return;
      if(c.querySelector('.dn-mark')) return;
      if(((state.dayNotes||{})[+m[1]])) return;
      const vis = dayAutoNotes(+m[1]).filter(n=>!n.oculta);
      if(vis.length){ const s = document.createElement('span'); s.className = 'dn-mark'; s.textContent = '✦'; s.title = vis.length + ' destaque' + (vis.length>1?'s':''); c.appendChild(s); }
    });
  }catch(e){}
  return r;
};
Object.assign(window, { murToggleCapa, murLogoModo, murRemover, murArquivo, dayAutoNotes, dnRemover, dnRestaurar, dnEditar });

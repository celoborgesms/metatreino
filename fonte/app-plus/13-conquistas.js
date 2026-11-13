
// =====================================================================
// 28. CONQUISTAS — detalhe animado e Conquista Especial em duas etapas (Beta 17)
// Nada muda nos critérios, datas, ids ou no desbloqueio: só a apresentação.
// =====================================================================
// --- conquista normal: medalha entra com brilho discreto (não é a celebração de desbloqueio) ---
const _openTrophyDetailB17 = window.openTrophyDetail;
window.openTrophyDetail = function(id){
  const r = _openTrophyDetailB17.apply(this, arguments);
  try{
    const box = $('modal-inner'); const med = box && box.querySelector('.anim-check'); if(!med) return r;
    const t = TROPHIES.find(x=>x.id===id) || {};
    med.classList.remove('anim-check');
    const wrap = document.createElement('div');
    wrap.className = 'tr-medal' + (t.secret ? ' tr-secreta' : '');
    wrap.innerHTML = `<span class="tr-glow" aria-hidden="true"></span><span class="tr-ring" aria-hidden="true"></span>${Array.from({length:8},(_,i)=>`<i style="--a:${i*45+22}deg;--d:${(i%3)*60}ms" aria-hidden="true"></i>`).join('')}`;
    med.parentNode.insertBefore(wrap, med); wrap.appendChild(med); med.classList.add('tr-ico');
    const h3 = wrap.parentNode.querySelector('h3'); if(h3) h3.classList.add('tr-nome');
  }catch(e){}
  return r;
};

// --- Conquista Especial: primeiro a conquista; a história é opcional ---
function openSpecialTrophy(){
  const sp = state.specialTrophy; if(!sp){ toast('Nenhuma conquista especial por aqui.'); return; }
  try{ closeModal(); }catch(e){}
  const dados = _saDadosTrofeu(sp);
  saPalco(dados, { id:'special-view', vel: 2.2, acoesEm: 5.8, reserva: 150,
    topo:`<button class="sa-x" aria-label="Fechar" onclick="saFecharPalco()">✕</button>`,
    acoes:`<div class="sa-acoes-col"><button class="btn btn-primary sa-reviver" onclick="saReviverHistoria()">✨ Reviver minha história</button>
      <div class="sa-opc">A história completa é opcional — leva cerca de ${Math.max(1, Math.round(((dados.frases||[]).length||3) * 6 / 60))} min.</div>
      <div class="sa-acoes-row">${typeof saFormatoVideo==='function' ? `<button class="btn btn-ghost" onclick="saFecharPalco();setTimeout(openMinhaConquistaShare,350)">Compartilhar</button>` : ''}<button class="btn btn-ghost" onclick="saFecharPalco()">Fechar</button></div></div>` });
}
function saReviverHistoria(){
  document.querySelectorAll('.sa-stage').forEach(ov=>{ try{ ov.__parar && ov.__parar(); }catch(e){} ov.remove(); });
  showSpecialReveal(state.specialTrophy, { reviver:true });
}
// cartão na tela de Conquistas: abre a conquista, não a história
const _openTrophiesB17 = window.openTrophies;
window.openTrophies = function(){
  const r = _openTrophiesB17.apply(this, arguments);
  try{
    const card = [...document.querySelectorAll('#modal-inner [onclick*="showSpecialReveal"]')][0];
    if(card){
      card.setAttribute('onclick', 'openSpecialTrophy()'); card.setAttribute('role','button'); card.setAttribute('tabindex','0');
      card.classList.add('sa-card');
      card.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openSpecialTrophy(); } });
      const leg = [...card.querySelectorAll('div')].find(d=>/reviver este momento/i.test(d.textContent));
      if(leg) leg.textContent = 'Toque para ver sua conquista · a história completa é opcional';
    }
  }catch(e){}
  return r;
};
// a revelação automática acontece uma vez por conquista — também registrada na conta (não só no aparelho)
const _checkSpecialB17 = window.checkSpecialAward;
window.checkSpecialAward = function(trigger){
  try{
    const sa = specialAward;
    if(sa && sa.titulo){
      const chave = 'metatreino_special_shown_'+(sa.data||'now')+'_'+(sa.atualizadoEm||'');
      if(state.specialTrophy && state.specialTrophy.revelada === chave){ try{ localStorage.setItem(chave, '1'); }catch(e){} return; }
      window.__saChave = chave;
    }
  }catch(e){}
  return _checkSpecialB17.apply(this, arguments);
};
// a chave da revelação vai junto quando a revelação automática salva a conquista
const _showRevealB17 = showSpecialReveal;
showSpecialReveal = function(sa, opts){
  opts = Object.assign({}, opts||{});
  if(!opts.reviver && !opts.chave && window.__saChave) opts.chave = window.__saChave;
  return _showRevealB17.call(this, sa, opts);
};

// --- compartilhar a própria conquista (quem recebeu) ---
// Usa só o que é da conquista: símbolo, nome, título, mensagem e data. Sem e-mail ou outro dado pessoal.
function openMinhaConquistaShare(){
  const sp = state.specialTrophy; if(!sp){ return; }
  const dados = _saDadosTrofeu(sp); const fmt = saFormatoVideo();
  $('modal-inner').innerHTML = `<h3>Compartilhar conquista</h3>
    <p class="mt-muted" style="margin:0 0 10px">Vídeo vertical 9:16 (${String(SA_DUR).replace('.',',')} s) com seu nome, a conquista, a mensagem e a data — sem e-mail nem outros dados.</p>
    <div class="adm-form"><label>Nome que aparece</label><input class="input" id="sa-nome-minha" maxlength="40" value="${mtEsc(dados.nome)}"></div>
    ${fmt ? `<button class="btn btn-primary btn-block" style="margin-top:12px" id="sa-vid-minha" onclick="saMinhaVideo()">🎬 Gerar vídeo${fmt.ext==='mp4'?' (MP4)':''}</button>`
      : `<div class="note" style="margin-top:12px"><div class="note-line">Este navegador não consegue gravar vídeo. Use a imagem — ou abra o MetaTreino no Chrome atualizado.</div></div>`}
    ${fmt && fmt.ext!=='mp4' ? `<p class="mt-muted" style="font-size:11.5px;margin-top:6px">Este navegador grava em WebM. O WhatsApp e o Instagram nem sempre aceitam WebM — se não abrir lá, use a imagem.</p>`:''}
    <div id="sa-prog-minha" class="mt-muted" style="font-size:12px;margin-top:8px;min-height:18px"></div>
    <button class="btn btn-ghost btn-block" style="margin-top:6px" onclick="saMinhaImagem()">🖼️ Compartilhar como imagem</button>
    <button class="btn btn-ghost btn-block" style="margin-top:6px" onclick="closeModal();setTimeout(openSpecialTrophy,250)">Voltar à conquista</button>`;
  $('modal-back').classList.add('on');
}
function _saMinhaDados(){ const d = _saDadosTrofeu(); const n = ($('sa-nome-minha')||{}).value; if(n != null) d.nome = String(n).trim().slice(0,40); delete d.frases; return d; }
async function saMinhaVideo(){
  const d = _saMinhaDados();
  await mtComBotao('sa-vid-minha', 'Gravando vídeo…', async ()=>{
    const p = $('sa-prog-minha');
    const r = await saGravarVideo(d, f=>{ if(p) p.textContent = `Gravando… ${Math.round(f*SA_DUR*10)/10} de ${String(SA_DUR).replace('.',',')} s`; });
    if(p) p.textContent = `Vídeo pronto (${(r.blob.size/1048576).toFixed(1).replace('.',',')} MB, ${r.ext.toUpperCase()}).`;
    const res = await saCompartilharArquivo(r.blob, `minha-conquista-metatreino.${r.ext}`, `${d.titulo} — MetaTreino`);
    if(res==='baixado') toast('Vídeo salvo nos downloads do aparelho.');
  });
}
async function saMinhaImagem(){
  const d = _saMinhaDados(); const b = await saImagemFinal(d);
  const res = await saCompartilharArquivo(b, 'minha-conquista-metatreino.png', `${d.titulo} — MetaTreino`);
  if(res==='baixado') toast('Imagem salva nos downloads do aparelho.');
}
Object.assign(window, { openSpecialTrophy, saReviverHistoria, openMinhaConquistaShare, saMinhaVideo, saMinhaImagem });


// =====================================================================
// 38. Beta 25 — Janelas, botão Voltar do Android e auditoria de cliques
// =====================================================================

// ---------- Fechar janelas ----------
// • Tocar fora da janela já fechava; agora isso NÃO acontece se o aluno digitou algo
//   que ainda não salvou (o app avisa e mantém a janela aberta).
// • Botão Voltar do Android / gesto de voltar: fecha a janela aberta em vez de sair do app.
// • Janelas que já salvam na hora (Aparência, Personalizar início, Áudio dos vídeos) não
//   pedem mais "Pronto": têm um ✕ no canto e fecham tocando fora ou com Voltar.
let _janSuja = false;
let _janHist = false;          // há um registro no histórico do navegador para a janela aberta
let _janFechandoPorVoltar = false;
(function(){
  const back = document.getElementById('modal-back'), mi = document.getElementById('modal-inner'); if(!back || !mi) return;
  // qualquer digitação em campo marca a janela como "com alterações"
  mi.addEventListener('input', e=>{ if(e.target && e.target.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=search]):not([id*=busca]):not([placeholder^=Buscar]), textarea')) _janSuja = true; }, true);
  // conteúdo trocado = outra tela da janela: zera a marca
  new MutationObserver(()=>{ _janSuja = false; }).observe(mi, { childList:true });
  // tocar fora: protege dados digitados
  back.removeAttribute('onclick');
  back.addEventListener('click', e=>{
    if(e.target !== back) return;
    if(_janSuja){ mi.classList.remove('jan-avisa'); void mi.offsetWidth; mi.classList.add('jan-avisa'); toast('Você digitou algo que ainda não foi salvo. Use Salvar ou Cancelar.'); return; }
    closeModal();
  });
  // Voltar do Android: um registro no histórico enquanto a janela está aberta
  new MutationObserver(()=>{
    const aberta = back.classList.contains('on');
    if(aberta && !_janHist){ try{ history.pushState({ mtJanela:1 }, ''); _janHist = true; }catch(err){} }
    if(!aberta && _janHist){ _janHist = false; if(!_janFechandoPorVoltar){ try{ if(history.state && history.state.mtJanela) history.back(); }catch(err){} } _janFechandoPorVoltar = false; }
  }).observe(back, { attributes:true, attributeFilter:['class'] });
  window.addEventListener('popstate', ()=>{
    if(!back.classList.contains('on')) return;
    if(_janSuja){ try{ history.pushState({ mtJanela:1 }, ''); }catch(err){} toast('Você digitou algo que ainda não foi salvo. Use Salvar ou Cancelar.'); return; }
    _janHist = false; _janFechandoPorVoltar = true; closeModal();
  });
})();
mtGancho('closeModal', { depois(){
  _janSuja = false;
  const mi = document.getElementById('modal-inner'); if(!mi) return;
  const ao = mi.dataset.aoFechar; delete mi.dataset.aoFechar;
  if(ao === 'perfil'){ try{ renderProfile(); }catch(e){} }
}});
// janelas que salvam na hora: troca o "Pronto" por um ✕ discreto
function janelaInstantanea(aoFechar){
  const mi = document.getElementById('modal-inner'); if(!mi) return;
  [...mi.querySelectorAll('button')].filter(b=>/^\s*Pronto\s*$/.test(b.textContent)).forEach(b=>b.remove());
  if(!mi.querySelector(':scope > .modal-x')){
    const x = document.createElement('button'); x.type = 'button'; x.className = 'modal-x'; x.setAttribute('aria-label', 'Fechar'); x.textContent = '✕';
    x.onclick = ()=>closeModal(); mi.prepend(x);
  }
  if(!mi.querySelector('.jan-salvo')){
    const n = document.createElement('div'); n.className = 'jan-salvo'; n.textContent = 'As mudanças valem na hora e já ficam salvas.'; mi.appendChild(n);
  }
  if(aoFechar) mi.dataset.aoFechar = aoFechar;
}
mtGancho('openAparencia', { depois(){ janelaInstantanea('perfil'); } });
mtGancho('openPersonalizarInicio', { depois(){ janelaInstantanea(); } });
mtGancho('openAudioVideos', { depois(){ janelaInstantanea('perfil'); } });

// ---------- Histórico: gráfico semanal agora responde ao toque ----------
// As barras mostravam só um número solto e "S1…S8". Agora: toque mostra a semana
// (datas) e o valor; as cores dos textos seguem o tema (antes eram cinza fixo).
mtGancho('renderHistEvolution', { depois(isLift){
  const svg = document.getElementById('hist-evo-svg'); if(!svg || !svg.innerHTML) return;
  svg.innerHTML = svg.innerHTML.replace(/fill="#64748b"/g, 'fill="var(--text-mute)"');
  const rects = [...svg.querySelectorAll('rect')]; if(rects.length !== 8) return;
  const agora = Date.now(); const fmt = t=>new Date(t).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
  const vals = [...svg.querySelectorAll('text')].filter(t=>!/^S\d$/.test(t.textContent));
  rects.forEach((r, i)=>{
    const a = agora - (8-i)*7*DIA_MS, b = agora - (7-i)*7*DIA_MS - 1;
    const h = r.cloneNode(); h.setAttribute('class', 'ch-hit'); h.setAttribute('fill', 'transparent'); h.setAttribute('y', '8'); h.setAttribute('height', '140');
    const valTxt = (()=>{ const x = +r.getAttribute('x') + (+r.getAttribute('width'))/2; const t = vals.find(t=>Math.abs(+t.getAttribute('x') - x) < 1); return t ? t.textContent : '0'; })();
    h.setAttribute('data-tip', `${i===7?'Esta semana':'Semana de '+fmt(a)+' a '+fmt(b)}: <b>${valTxt} ${isLift?'kg':'km'}</b>`);
    h.setAttribute('tabindex', '0'); h.setAttribute('role', 'button'); h.setAttribute('aria-label', h.getAttribute('data-tip').replace(/<[^>]+>/g,''));
    svg.appendChild(h);
  });
  svg.style.cursor = 'pointer';
  if(!svg.dataset.tip){
    svg.dataset.tip = '1';
    const mostra = ev=>{ const t = ev.target.closest && ev.target.closest('.ch-hit'); if(!t) return;
      svg.querySelectorAll('.ch-hit.sel').forEach(x=>x.classList.remove('sel')); t.classList.add('sel');
      const sub = document.getElementById('hist-evo-sub'); if(sub) sub.innerHTML = t.getAttribute('data-tip'); };
    svg.addEventListener('click', mostra);
    svg.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); mostra(e); } });
  }
}});


// =====================================================================
// 36. Beta 25 — Escala de esforço (RPE 1 a 10) redesenhada
// =====================================================================
// Mesma escala, mesmos textos (RPE_LBL / RPE_DESC) e o mesmo valor salvo
// (window.__rpe), usado pelos registros de musculação, corrida e outras atividades.
// Mudou só a aparência e a interação:
//  • uma régua contínua com 10 posições do mesmo tamanho (fácil de tocar);
//  • cores graduais e suaves (verde-água → âmbar → coral), sem efeito "semáforo";
//  • dá para tocar ou deslizar o dedo pela régua;
//  • teclado: setas, Home e End (acessível como grupo de opções).
const RPE_ZONA = n => n<=3 ? 'Leve' : n<=6 ? 'Moderado' : n<=8 ? 'Intenso' : 'Máximo';
function rpeCor(n){
  // de verde-água (165°) a coral (8°), saturação e luz contidas
  const t = (n-1)/9; const h = Math.round(165 - t*157); const s = Math.round(48 + t*14); const l = Math.round(50 - t*4);
  return `hsl(${h} ${s}% ${l}%)`;
}
window.rpeHtml = function(def, modo){
  // modo 'musc' (fim do treino de musculação) troca só as frases de baixo; o padrão é corrida/caminhada/bike
  window.__rpeModo = modo === 'musc' ? 'musc' : 'aero';
  def = Math.min(10, Math.max(1, Math.round(+def || 5)));
  window.__rpe = def;
  const cel = [1,2,3,4,5,6,7,8,9,10].map(n=>`<button type="button" role="radio" aria-checked="${n===def}" aria-label="${n}: ${RPE_LBL[n]}" tabindex="${n===def?0:-1}"
      class="rpe2-c ${n===def?'on':''} ${n<def?'abaixo':''}" data-n="${n}" style="--rc:${rpeCor(n)}" onclick="rpeSet(${n})"><span>${n}</span></button>`).join('');
  return `<div class="rpe rpe2" style="--rsel:${rpeCor(def)}">
    <div class="rpe2-trilho" id="rpe-bars" role="radiogroup" aria-label="Esforço percebido de 1 a 10">${cel}</div>
    <div class="rpe2-zonas" aria-hidden="true"><span>Leve</span><span>Moderado</span><span>Intenso</span><span>Máx.</span></div>
    <div class="rpe-lbl rpe2-lbl" id="rpe-lbl" aria-live="polite">${_rpeLbl(def)}</div>
  </div>`;
};
function _rpeLbl(n){ return `<span class="rpe2-num">${n}</span><span class="rpe2-txt"><b>${RPE_LBL[n]}</b><small>${rpeDesc(n)}</small></span><span class="rpe2-zona">${RPE_ZONA(n)}</span>`; }
window.rpeSet = function(n){
  n = Math.min(10, Math.max(1, Math.round(+n) || 5));
  window.__rpe = n;
  const tr = document.getElementById('rpe-bars');
  if(tr){
    tr.querySelectorAll('.rpe2-c, .rpe-b').forEach(b=>{ const v = +b.dataset.n; const on = v===n;
      b.classList.toggle('on', on); b.classList.toggle('abaixo', v<n);
      b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1;
      if(on){ b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } });
    const box = tr.closest('.rpe2'); if(box) box.style.setProperty('--rsel', rpeCor(n));
  }
  const l = document.getElementById('rpe-lbl'); if(l) l.innerHTML = _rpeLbl(n);
  try{ if(navigator.vibrate) navigator.vibrate(6); }catch(e){}
};
// deslizar o dedo e teclado
(function(){
  let arrastando = false;
  const valorEm = (tr, x)=>{ const r = tr.getBoundingClientRect(); return Math.min(10, Math.max(1, Math.floor((x - r.left) / (r.width/10)) + 1)); };
  document.addEventListener('pointerdown', e=>{ const tr = e.target.closest && e.target.closest('.rpe2-trilho'); if(!tr) return; arrastando = true; });
  document.addEventListener('pointermove', e=>{ if(!arrastando) return; const tr = document.getElementById('rpe-bars'); if(!tr || !tr.classList.contains('rpe2-trilho')) return;
    const n = valorEm(tr, e.clientX); if(n !== window.__rpe) rpeSet(n); }, { passive:true });
  document.addEventListener('pointerup', ()=>{ arrastando = false; });
  document.addEventListener('pointercancel', ()=>{ arrastando = false; });
  document.addEventListener('keydown', e=>{
    const tr = e.target.closest && e.target.closest('.rpe2-trilho'); if(!tr) return;
    const atual = window.__rpe || 5; let n = null;
    if(e.key==='ArrowRight' || e.key==='ArrowUp') n = atual+1; else if(e.key==='ArrowLeft' || e.key==='ArrowDown') n = atual-1;
    else if(e.key==='Home') n = 1; else if(e.key==='End') n = 10;
    if(n===null) return; e.preventDefault(); rpeSet(n);
    const b = tr.querySelector('.rpe2-c.on'); if(b) b.focus();
  });
})();

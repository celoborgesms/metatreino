
// =====================================================================
// 40. Beta 25 — Treinos, Desafios e Progresso mais claros
// =====================================================================
// Sem mudar critérios nem cálculos: só deixa à vista o que já é calculado.

// ---------- Treinos: andamento do treino do dia ----------
// Um resumo logo acima dos grupos: quantos exercícios já foram registrados,
// barra de progresso e o estado (não iniciado / em andamento / concluído).
// Os números vêm dos próprios grupos (a mesma conta "n/m exercícios" de cada grupo).
function sessAndamento(){
  const slot = document.getElementById('session-detail-slot'); if(!slot) return;
  const velho = slot.querySelector('.tr-anda'); if(velho) velho.remove();
  const blocos = [...slot.querySelectorAll('.block')].filter(b=>!b.querySelector('.block-head.main') || !/extra/i.test(b.textContent.slice(0,60)));
  let feitos = 0, total = 0;
  blocos.forEach(b=>{ const s = b.querySelector('.block-sub'); const m = s && s.textContent.match(/(\d+)\s*\/\s*(\d+)/); if(m){ feitos += +m[1]; total += +m[2]; } });
  if(!total) return;
  const concluido = !!slot.querySelector('.card-ok') || feitos >= total;
  const est = concluido ? ['ok','Concluído'] : feitos ? ['and','Em andamento'] : ['pend','Não iniciado'];
  const pct = Math.round(Math.min(1, feitos/total)*100);
  const el = document.createElement('div'); el.className = 'tr-anda tr-' + est[0];
  el.innerHTML = `<div class="tr-anda-l"><b>${feitos} de ${total}</b> exercícios registrados hoje<span class="tr-anda-st">${est[1]}</span></div>
    <div class="tr-anda-b" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${feitos}" aria-label="Exercícios registrados"><i style="width:${pct}%"></i></div>`;
  const primeiro = slot.querySelector('.block'); if(primeiro) primeiro.before(el);
}
mtGancho('renderSessions', { depois(){ if(state.active !== 'run') sessAndamento(); } });

// ---------- Desafios: o que falta para concluir ----------
function evFalta(e){
  const p = progressoEvento(e); if(!p.comecou || p.terminou) return '';
  const faltam = Math.max(0, p.alvo - p.dias);
  if(!faltam) return `✓ Meta cumprida: ${p.dias} de ${p.alvo} dias ativos. Os próximos treinos contam para as missões.`;
  const hojeConta = mtDiasAtivos(e.ini, e.fim).has(mtDia0());
  const disp = p.restam + (hojeConta ? 0 : 1);
  if(faltam > disp) return `Faltam ${faltam} dias ativos e restam ${disp} ${disp===1?'dia':'dias'}: a meta não cabe mais neste desafio, mas cada treino ainda conta para as missões.`;
  const porSem = Math.min(7, Math.ceil(faltam / Math.max(1, disp/7)));
  return `Para concluir: <b>${faltam} ${faltam===1?'dia ativo':'dias ativos'}</b> nos próximos ${disp} ${disp===1?'dia':'dias'}${disp>=7?` (cerca de ${porSem} por semana)`:''}. Qualquer treino ou atividade registrada conta.`;
}
mtGancho('renderChallenges', { depois(){
  try{
    const e = eventoPrincipal(); const hero = document.querySelector('#chal-root .ev-hero'); if(!e || !hero) return;
    const txt = evFalta(e); if(!txt || hero.querySelector('.ev-falta')) return;
    const d = document.createElement('div'); d.className = 'ev-falta'; d.innerHTML = txt;
    const cta = hero.querySelector('.ev-cta'); if(cta) cta.before(d); else hero.appendChild(d);
  }catch(err){}
}});

// ---------- Progresso: o resumo diz de que período é cada número ----------
mtGancho('renderPerf', { depois(){
  const res = document.getElementById('perf-resumo'); if(!res) return;
  const grades = [...res.querySelectorAll(':scope > .stat-grid')];
  const rot = ['Últimos 7 dias', 'Desde o início'];
  grades.forEach((g,i)=>{ if(i>1) return; const ant = g.previousElementSibling; if(ant && ant.classList.contains('pr-per')) return;
    const c = document.createElement('div'); c.className = 'pr-per'; c.textContent = rot[i]; g.before(c); });
}});

// ---------- Tela "Preparando seu plano" ----------
// Os passos continuam os mesmos (reais). Antes havia dois indicadores girando ao mesmo
// tempo (o de cima e o do passo atual). Agora o de cima é um selo da modalidade com um
// anel que enche junto com as etapas concluídas; só o passo atual gira.
const _runBuildingB25 = window.runBuildingScreen;
window.runBuildingScreen = function(m, steps, done, opts){
  const r = _runBuildingB25.apply(this, arguments);
  try{
    const ov = document.getElementById('building-ov'); const sp = ov && ov.querySelector('.mb-spin'); if(!sp) return r;
    const ic = m === 'run'
      ? '<path d="M13 4.5a1.8 1.8 0 1 0 0-.01M10 21l2.2-6.2L9.5 12l2-5 3.5 3 3 1M6 12.5l2.5-4.5h4"/>'
      : '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>';
    const anel = document.createElement('div'); anel.className = 'mb-anel'; anel.setAttribute('aria-hidden','true');
    anel.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ic}</svg>`;
    sp.replaceWith(anel);
    const marca = document.createElement('div'); marca.className = 'mb-marca'; marca.textContent = 'METATREINO';
    ov.querySelector('.mb-box').prepend(marca);
    const bar = document.getElementById('mb-bar');
    if(bar) new MutationObserver(()=>{ anel.style.setProperty('--p', (parseFloat(bar.style.width)||0) + '%'); }).observe(bar, { attributes:true, attributeFilter:['style'] });
  }catch(e){}
  return r;
};

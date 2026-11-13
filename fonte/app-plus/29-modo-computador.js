
// =====================================================================
// 44. Beta 30 — Modo computador de verdade
// =====================================================================
// Só vale com html.mt-desk (tela larga + mouse, parte 16). O celular não muda nada.
//
// Antes: o app do celular espalhado em duas colunas de jornal.
// Agora cada tela tem um layout de computador:
//   · Início: painel com números da semana no topo, coluna principal (treino de hoje, atividade,
//     semana, seus treinos) e coluna lateral (sugestão, indicadores, desafios, plano, frase).
//   · Treinos: o treino aberto ocupa a coluna principal; programação e ajuda ao lado.
//   · Progresso: gráficos de evolução largos; calendário e recordes ao lado.
//   · Histórico: lista em linhas (como uma tabela); números, gráfico e arquivo ao lado.
//   · Janelas abrem como painel lateral à direita (a tela de trás continua visível).
//   · Atalhos: teclas 1 a 5 trocam de aba, Esc fecha a janela.
//
// Como funciona: nenhum bloco muda de lugar no HTML (as funções que procuram os blocos continuam
// achando). Cada bloco ganha um papel (topo / principal / lateral) e a tela vira uma grade de
// duas colunas. A altura de cada bloco é medida e vira "linhas" da grade, o que deixa as duas
// colunas independentes (sem buracos) e respeita a ordem do Personalizar início.

const DK_LAYOUT = {
  'scr-home': {
    topo: ['#home-brand-row', '#home-hero', '#home-greet-row', '#desk-kpis'],
    lado: ['#home-smart', '#home-metrics', '#card-monthly', '#home-event', '.plan-card', '#home-cali', '.quote', '#home-trofeus', '.note', '#card-access-info',
           '#card-weekrecap', '#card-weight-reminder', '#card-install', '#card-coach-msg'],
    fim: ['#home-personalizar']
  },
  'scr-sessions': {
    topo: ['.brand', '.row', '#sess-qlinks', '#sessions-chips'],
    lado: ['.card-alert', '#sess-prestart', '.help']
  },
  'scr-perf': {
    topo: ['.seg-nav', ':scope > div:not([id]):not([class])', '#perf-empty'],
    lado: ['.cal-card', '#card-records', '.chart-card:not(#perf-evo):not(#perf-run-card)']
  },
  'scr-history': {
    topo: ['.seg-nav', '.brand', '#hist-title'],
    lado: ['.stat-grid', ':scope > .btn', '#hist-evo', '#hist-arq']
  }
};
const DK_PASSO = 4;      // altura de cada "linha" da grade, em px
const DK_VAO = 18;       // espaço entre blocos
const _dkObs = new Map();
function dkAtivo(){ return document.documentElement.classList.contains('mt-desk'); }
function _dkPapel(el, cfg){
  const m = sel=>{ try{ return sel.startsWith(':scope') ? el.matches(sel.replace(':scope > ', '')) && el.parentElement && [...el.parentElement.querySelectorAll(sel)].includes(el) : el.matches(sel); }catch(e){ return false; } };
  if((cfg.topo||[]).some(m)) return 'topo';
  if((cfg.fim||[]).some(m)) return 'fim';
  if((cfg.lado||[]).some(m)) return 'lado';
  return 'principal';
}
function _dkMede(el){
  if(!el.isConnected) return;
  const st = getComputedStyle(el);
  if(st.display === 'none'){ el.style.gridRowEnd = ''; return; }
  const h = el.getBoundingClientRect().height;
  el.style.gridRowEnd = 'span ' + Math.max(1, Math.ceil((h + DK_VAO) / DK_PASSO));
}
function dkMontar(id){
  const cfg = DK_LAYOUT[id]; const scr = document.getElementById(id); if(!cfg || !scr) return;
  const wrap = scr.querySelector('.wrap'); if(!wrap) return;
  let ro = _dkObs.get(id);
  if(!dkAtivo()){
    if(wrap.classList.contains('dk-grade')){
      wrap.classList.remove('dk-grade');
      [...wrap.children].forEach(c=>{ c.removeAttribute('data-dk'); c.style.gridRowEnd = ''; });
      if(ro){ ro.disconnect(); _dkObs.delete(id); }
    }
    return;
  }
  wrap.classList.add('dk-grade');
  if(!ro){ ro = new ResizeObserver(ents=>ents.forEach(e=>_dkMede(e.target))); _dkObs.set(id, ro); }
  [...wrap.children].forEach(c=>{
    const papel = _dkPapel(c, cfg);
    if(c.dataset.dk !== papel) c.dataset.dk = papel;
    if(!c.__dkObs){ ro.observe(c); c.__dkObs = true; }
    _dkMede(c);
  });
}
function dkMontarTudo(){ Object.keys(DK_LAYOUT).forEach(id=>{ try{ dkMontar(id); }catch(e){ console.log('modo computador', id, e); } }); }

// ---------- Início: faixa de números da semana (só no computador) ----------
function dkKpis(){
  const wrap = document.querySelector('#scr-home .wrap'); if(!wrap) return;
  let el = $('desk-kpis');
  if(!dkAtivo()){ if(el) el.remove(); return; }
  const mod = state.modules && state.modules[state.active]; if(!mod || !mod.plan){ if(el) el.remove(); return; }
  if(!el){ el = document.createElement('div'); el.id = 'desk-kpis'; const g = $('home-greet-row'); if(g) g.after(el); else wrap.prepend(el); }
  const ws = weekStats();
  const meta = (mod.plan.workouts||[]).length || 0;
  const lift = state.active === 'lift';
  const feitos = lift ? ws.lift : (ws.runs + ws.walks + ws.bikes);
  let seq = 0; try{ seq = calcStreak(mtAllHist()); }catch(e){}
  const seg = new Date(); seg.setHours(0,0,0,0); seg.setDate(seg.getDate() - (getDayIdx()-1));
  let vol = 0; try{ vol = Math.round(calcVolumeBetween(seg.getTime(), Date.now()+1)); }catch(e){}
  const km = (ws.kmRun||0) + (ws.kmWalk||0) + (ws.kmBike||0);
  const dur = ws.totalMin >= 60 ? `${Math.floor(ws.totalMin/60)}h${String(ws.totalMin%60).padStart(2,'0')}` : `${ws.totalMin}<small>min</small>`;
  const tiles = [
    { l: lift ? 'Treinos na semana' : 'Atividades na semana', v: `${feitos}<small>/${meta}</small>`, s: meta ? `${Math.min(100, Math.round(feitos/meta*100))}% da meta` : '', go:"goTab('perf')", bar: meta ? Math.min(1, feitos/meta) : 0 },
    { l:'Sequência', v:`${seq}<small>${seq===1?'dia':'dias'}</small>`, s:'dias seguidos com atividade', go:"goTab('perf')" },
    { l:'Tempo na semana', v: dur, s:`${ws.total} ${ws.total===1?'registro':'registros'} desde segunda`, go:"goTab('history')" },
    lift ? { l:'Volume na semana', v: vol >= 1000 ? `${(vol/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})}<small>t</small>` : `${vol}<small>kg</small>`, s:'peso × repetições registradas', go:"goTab('history')" }
         : { l:'Distância na semana', v:`${km.toLocaleString('pt-BR',{maximumFractionDigits:1})}<small>km</small>`, s:'corrida, caminhada e bike', go:"goTab('history')" },
    { l:'Conquistas', v:`${(state.trophies||[]).length}<small>/${TROPHIES.length}</small>`, s:'medalhas e selos', go:'openTrophies()' }
  ];
  el.innerHTML = tiles.map(t=>`<button type="button" class="dk-kpi" onclick="${t.go}"><span class="dk-kpi-l">${t.l}</span><span class="dk-kpi-v">${t.v}</span>${t.bar!=null && t.bar!==undefined && t.l.includes('semana') && t.s.includes('meta') ? `<span class="dk-kpi-bar"><i style="width:${Math.round(t.bar*100)}%"></i></span>` : ''}<span class="dk-kpi-s">${t.s}</span></button>`).join('');
}

// ---------- Menu lateral: aluno e atalhos ----------
function dkMenu(){
  const tb = $('tabbar'); if(!tb) return;
  let u = $('desk-user');
  if(!dkAtivo()){ if(u) u.remove(); return; }
  if(!u){ u = document.createElement('div'); u.id = 'desk-user'; tb.appendChild(u); }
  const nome = (typeof firstName==='function' ? firstName() : '') || '';
  u.innerHTML = `<button type="button" class="dk-user-btn" onclick="goTab('profile')"><span class="avatar" id="desk-avatar"></span><span><b>${mtEsc(nome)}</b><small>Ver perfil</small></span></button>
    <div class="dk-atalhos">Atalhos: <kbd>1</kbd>–<kbd>5</kbd> abas · <kbd>Esc</kbd> fecha</div>`;
  try{ renderAvatar('desk-avatar'); }catch(e){}
  [...tb.querySelectorAll('.tab')].forEach((t,i)=>{ if(i < 5 && !t.title) t.title = `Atalho: tecla ${i+1}`; });
}

// ---------- Janelas como painel lateral ----------
// Confirmações, medalhas e o vídeo do exercício continuam no centro.
function dkPainel(){
  const back = $('modal-back'); if(!back) return;
  const confirma = !!document.getElementById('appconfirm-ok');
  const painel = dkAtivo() && back.classList.contains('on') && !confirma && !back.classList.contains('award-dark') && !back.classList.contains('ex-open') && !back.classList.contains('video-open');
  back.classList.toggle('dk-painel', !!painel);
}
try{ new MutationObserver(dkPainel).observe(document.getElementById('modal-back'), { attributes:true, attributeFilter:['class'] });
  new MutationObserver(dkPainel).observe(document.getElementById('modal-inner'), { childList:true }); }catch(e){}

// ---------- Atalhos de teclado ----------
document.addEventListener('keydown', e=>{
  if(!dkAtivo() || e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target; if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  const back = $('modal-back');
  if(e.key === 'Escape'){ if(back && back.classList.contains('on')){ e.preventDefault(); closeModal(); } return; }
  if(back && back.classList.contains('on')) return;
  const n = parseInt(e.key, 10);
  if(n >= 1 && n <= 5){ const tabs = [...document.querySelectorAll('#tabbar .tab')]; const b = tabs[n-1]; if(b){ e.preventDefault(); b.click(); } }
});

// ---------- quando montar ----------
['renderHome','renderSessions','renderPerf','renderHistory'].forEach(f=>mtGancho(f, { depois(){
  try{ if(f === 'renderHome'){ dkKpis(); dkMenu(); } dkMontarTudo(); }catch(e){ console.log('modo computador', e); }
}}));
mtGancho('goTab', { depois(){ try{ dkMontarTudo(); }catch(e){} }});
const _mtDeskAplicaB30 = window.mtDeskAplica;
window.mtDeskAplica = function(){
  const r = _mtDeskAplicaB30.apply(this, arguments);
  try{ dkKpis(); dkMenu(); dkMontarTudo(); dkPainel(); }catch(e){}
  return r;
};
try{ const mq = window.matchMedia(MT_DESK_MQ); if(mq.addEventListener) mq.addEventListener('change', ()=>window.mtDeskAplica()); }catch(e){}

Object.assign(window, { dkMontar, dkMontarTudo, dkKpis, dkMenu, dkPainel });

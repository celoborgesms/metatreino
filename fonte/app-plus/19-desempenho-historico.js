
// =====================================================================
// 34. Beta 23 — Desempenho e Histórico mais diretos
// =====================================================================
// Desempenho: resumo numa grade só → Evolução (gráficos) logo depois → calendário
// (recolhível) → recordes, metas e distribuição. Nada sai da tela: só muda a ordem.
// Histórico: sem o cabeçalho repetido; o gráfico de volume/km por semana começa recolhido.
function _secaoRecolhivel(el, chave, padraoAberto, titulo){
  if(!el) return;
  const aberto = (()=>{ const v = mtLS('mt_col_'+chave); return v===null || v===undefined ? padraoAberto : v==='1'; })();
  el.classList.toggle('sec-fechada', !aberto);
  let b = el.querySelector(':scope .sec-tg');
  if(!b){
    b = document.createElement('button'); b.type = 'button'; b.className = 'col-txt sec-tg';
    b.onclick = (ev)=>{ ev.stopPropagation(); const ab = el.classList.contains('sec-fechada'); mtLS('mt_col_'+chave, ab ? '1' : '0'); _secaoRecolhivel(el, chave, padraoAberto, titulo); };
    const alvo = el.querySelector('.sec-head') || el.firstElementChild; if(alvo) alvo.appendChild(b);
  }
  b.textContent = aberto ? 'Ocultar' : 'Mostrar';
  b.setAttribute('aria-expanded', String(aberto)); b.setAttribute('aria-label', (aberto?'Ocultar ':'Mostrar ') + titulo);
}
function perfReorganiza(){
  const wrap = document.querySelector('#scr-perf .wrap'); if(!wrap) return;
  const cal = $('calendar'); const calCard = cal && cal.closest('.card'); if(!calCard) return;
  // 1) resumo: as duas fileiras de números viram um bloco só
  let res = $('perf-resumo');
  if(!res){
    res = document.createElement('div'); res.id = 'perf-resumo';
    const grades = [...wrap.querySelectorAll(':scope > .stat-grid')];
    if(grades.length){ grades[0].before(res); grades.forEach(g=>res.appendChild(g)); }
  }
  const l3 = $('s3-lbl'); if(l3 && /Recordes/.test(l3.textContent)) l3.textContent = 'Recordes';
  // 2) ordem: resumo → evolução (e cartões ligados a ela) → calendário
  const evo = $('perf-evo');
  const empty = $('perf-empty');
  const ancora = empty || calCard;
  if(res.parentElement === wrap) ancora.after(res);
  let ult = res;
  [evo, $('perf-cali'), $('perf-run-card')].forEach(el=>{ if(el && el.parentElement === wrap){ ult.after(el); ult = el; } });
  if(calCard.previousElementSibling !== ult) ult.after(calCard);
  const rec = $('card-records'); if(rec && rec.previousElementSibling !== calCard) calCard.after(rec);
  // 3) calendário recolhível (aberto por padrão; a escolha fica lembrada)
  calCard.classList.add('cal-card');
  const head = calCard.firstElementChild; if(head) head.classList.add('sec-head');
  _secaoRecolhivel(calCard, 'calendario', true, 'calendário');
}
mtGancho('renderPerf', { depois(){ try{ perfReorganiza(); }catch(e){ console.log('desempenho', e); } }});

function histReorganiza(){
  const ev = $('hist-evo'); if(!ev) return;
  const t = $('hist-evo-title');
  if(t && !t.parentElement.classList.contains('sec-head')){
    const h = document.createElement('div'); h.className = 'sec-head'; t.before(h); h.appendChild(t);
  }
  _secaoRecolhivel(ev, 'hist_grafico', false, 'gráfico semanal');
  let link = $('hist-evo-mais');
  if(!link){ link = document.createElement('a'); link.id = 'hist-evo-mais'; link.href = '#'; link.className = 'hist-evo-mais'; link.textContent = 'Mais gráficos em Desempenho →'; link.onclick = (e)=>{ e.preventDefault(); goTab('perf'); }; ev.appendChild(link); }
}
mtGancho('renderHistory', { depois(){ try{ histReorganiza(); }catch(e){ console.log('histórico', e); } }});
Object.assign(window, { perfReorganiza, histReorganiza });

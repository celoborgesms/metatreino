
// =====================================================================
// 14. CARREGAMENTOS · 15. HOME · 16. ALIMENTAÇÃO · 17. GRÁFICOS (Beta 11)
// =====================================================================

// ---------- 14. CARREGAMENTOS E OPERAÇÕES ----------
// Botão ocupado: desabilita, mostra o que está acontecendo e impede clique duplo.
async function mtComBotao(btn, rotulo, fn){
  const el = typeof btn==='string' ? $(btn) : btn;
  if(el && el.dataset.ocupado === '1') return;
  const antes = el ? el.innerHTML : '';
  if(el){ el.dataset.ocupado = '1'; el.disabled = true; el.innerHTML = `<span class="btn-spin"></span>${rotulo||'Aguarde…'}`; }
  try{ return await fn(); }
  catch(e){ console.log(e); toast(navigator.onLine===false ? '📴 Sem conexão. Nada foi perdido — tente de novo quando a internet voltar.' : '⚠️ Não foi possível concluir. Tente de novo.'); }
  finally{ if(el && document.body.contains(el)){ el.dataset.ocupado = ''; el.disabled = false; el.innerHTML = antes; } }
}
// Operações assíncronas do painel e do aluno: um segundo toque enquanto a primeira roda é ignorado.
function mtSemDuplicar(nome){
  const orig = window[nome]; if(typeof orig !== 'function' || orig.__semDup) return;
  let rodando = false;
  const w = async function(){ if(rodando) return; rodando = true; try{ return await orig.apply(this, arguments); } finally{ rodando = false; } };
  w.__semDup = true; window[nome] = w;
}
['doAddStudent','saveVideoLink','clearVideoLink','saveNewExercise','saveMural','saveCoachContact','saveSpecialAward','salvarEventoAdmin','admSetAdmin','adjustDays','toggleStudent','saveRunLog','saveActivityLog','saveHistoryEntry'].forEach(mtSemDuplicar);

// Indicador discreto de sincronização (só aparece quando há algo a dizer)
const MT_SYNC = { el:null, t:null };
function mtSyncPill(txt, tipo, ms){
  if(!MT_SYNC.el){ MT_SYNC.el = document.createElement('div'); MT_SYNC.el.id = 'mt-sync'; MT_SYNC.el.setAttribute('role','status'); document.body.appendChild(MT_SYNC.el); }
  clearTimeout(MT_SYNC.t);
  if(!txt){ MT_SYNC.el.classList.remove('on'); return; }
  MT_SYNC.el.className = 'on '+(tipo||'');
  MT_SYNC.el.innerHTML = (tipo==='sync'?'<span class="btn-spin"></span>':'') + txt;
  if(ms) MT_SYNC.t = setTimeout(()=>mtSyncPill(''), ms);
}
window.addEventListener('offline', ()=>{ if(fbUser) mtSyncPill('Sem conexão · suas alterações ficam salvas neste aparelho', 'off'); });
window.addEventListener('online', ()=>{
  if(!fbUser){ mtSyncPill(''); return; }
  mtSyncPill('Sincronizando suas informações…', 'sync');
  try{ syncToCloud(); }catch(e){}
  const fim = ()=>mtSyncPill('Informações sincronizadas', 'ok', 2200);
  try{ (db.waitForPendingWrites ? db.waitForPendingWrites() : Promise.resolve()).then(fim, fim); }catch(e){ fim(); }
});

// Montagem de planos: mesma função e mesmos passos REAIS de antes (buildingSteps), agora como lista
// que vai sendo concluída, nas cores do tema escolhido. A barra mostra etapas concluídas (não inventa %).
runBuildingScreen = function(m, steps, done, opts){
  opts = opts || {};
  if(steps.length > 6){
    const r = steps.map((x,idx)=>({x, idx, pri:x.pri||2})).sort((a,b)=>a.pri-b.pri || a.idx-b.idx).slice(0,6).map(o=>o.idx).sort((a,b)=>a-b);
    steps = r.map(i=>steps[i]);
  }
  let ov = document.getElementById('building-ov');
  if(!ov){ ov = document.createElement('div'); ov.id = 'building-ov'; document.body.appendChild(ov); }
  ov.className = 'mt-build'; ov.removeAttribute('style');
  const titulo = String(opts.titulo || (m==='lift' ? 'Preparando seu plano de treinamento' : 'Preparando seu plano de corrida')).replace(/^\S+\s(?=[A-ZÁÉÍÓÚ])/,'');
  ov.innerHTML = `<div class="mb-box"><div class="mb-spin"></div><div class="mb-t">${titulo}</div><div class="mb-s">${opts.sub || 'Organizando exercícios, dias e progressão com base nas suas escolhas.'}</div>
    <ol class="mb-list">${steps.map((s,i)=>`<li id="mb-${i}"><span class="mb-ck"></span><span class="mb-tx">${s.txt}</span></li>`).join('')}</ol>
    <div class="mb-bar"><i id="mb-bar"></i></div><div class="mb-n" id="mb-n">0 de ${steps.length} etapas</div></div>`;
  requestAnimationFrame(()=>ov.classList.add('on'));
  const passo = Math.min(opts.passo || 900, 1100);
  let i = 0;
  const tick = ()=>{
    if(i > 0){ const prev = $('mb-'+(i-1)); if(prev){ prev.classList.remove('now'); prev.classList.add('ok'); } }
    const bar = $('mb-bar'), n = $('mb-n');
    if(bar) bar.style.width = Math.round(i/steps.length*100)+'%';
    if(n) n.textContent = `${i} de ${steps.length} etapas`;
    if(i >= steps.length){
      setTimeout(()=>{ ov.classList.remove('on'); setTimeout(()=>{ ov.className=''; ov.innerHTML=''; ov.setAttribute('style','display:none'); if(typeof done==='function') done(); }, 260); }, 450);
      return;
    }
    const li = $('mb-'+i); if(li) li.classList.add('now');
    i++; setTimeout(tick, passo);
  };
  setTimeout(tick, 250);
};

// Painel admin: erro de carregamento vira mensagem clara com "Tentar de novo" (antes ficava "Carregando…")
mtGancho('goAdmin', { depois(){
  try{
    if(!admLoaded){
      $('adm-list').innerHTML = `<div class="card" style="text-align:center"><b>Não consegui carregar os alunos.</b><div class="mt-muted" style="margin:6px 0 12px">${navigator.onLine===false?'Você está sem internet.':'Pode ser conexão lenta ou permissão do Firestore.'}</div><button class="btn btn-primary" id="adm-retry" onclick="mtComBotao('adm-retry','Carregando…',()=>goAdmin())">Tentar de novo</button></div>`;
    }
    _admLinhaVideos();
    loadVideosReportados().then(_admVidBadge).catch(()=>{});
  }catch(e){}
}});
function _admLinhaVideos(){
  if($('adm-vid-row')) return;
  const ref = $('adm-ev-row') || [...document.querySelectorAll('#scr-admin .list-row')].find(r=>/Feedback|Mensagens dos alunos/.test(r.textContent)); if(!ref) return;
  const a = document.createElement('div'); a.className = 'list-row'; a.id = 'adm-vid-row'; a.onclick = ()=>openVideosReportados('pendente');
  a.innerHTML = '🎬 <span>Vídeos reportados</span><span id="adm-vid-badge" style="display:none;margin-left:auto;background:var(--danger);color:#fff;font-size:11px;font-weight:800;border-radius:99px;padding:2px 8px">0</span>';
  ref.after(a);
}

// ---------- 15. HOME: seções recolhíveis e avisos compactos ----------
function mtColAberto(k, padrao){ const v = mtLS('mt_col_'+k); return v===null || v===undefined ? padrao : v==='1'; }
function mtColToggle(k){ const novo = !mtColAberto(k, k!=='treinos'); mtLS('mt_col_'+k, novo?'1':'0'); _mtAplicaColapsos(); }
function _mtAplicaColapsos(){
  const wrap = document.querySelector('#scr-home .wrap'); if(!wrap) return;
  // "Seus treinos": o mesmo conteúdo da aba Treinos → começa recolhido, com um resumo
  const head = wrap.querySelector(':scope > .section-head'); const lista = $('your-list');
  if(head && lista){
    const aberto = mtColAberto('treinos', false);
    let resumo = $('home-tr-resumo');
    if(!resumo){ resumo = document.createElement('div'); resumo.id = 'home-tr-resumo'; resumo.className = 'col-resumo'; lista.after(resumo); }
    const mod = state.modules[state.active]; const n = (mod && mod.plan && (mod.plan.workouts||[]).length) || lista.children.length;
    resumo.innerHTML = aberto ? '' : `${n} ${n===1?'treino':'treinos'} no plano · toque em “Mostrar” para ver a lista`;
    resumo.style.display = aberto ? 'none' : '';
    lista.style.display = aberto ? '' : 'none';
    let b = head.querySelector('.col-btn');
    if(!b){ b = document.createElement('button'); b.type='button'; b.className = 'col-btn'; b.onclick = ()=>mtColToggle('treinos'); head.insertBefore(b, head.lastElementChild); }
    b.textContent = aberto ? 'Recolher' : 'Mostrar';
  }
  // Atividade da semana: pode recolher para só o título e o placar
  const q = $('home-quick');
  if(q && q.firstElementChild){
    const aberto = mtColAberto('semana', true);
    q.classList.toggle('mt-col', !aberto);
    let b = q.querySelector(':scope > .col-btn');
    if(!b){ b = document.createElement('button'); b.type='button'; b.className='col-btn col-abs'; b.onclick = e=>{ e.stopPropagation(); mtColToggle('semana'); }; q.appendChild(b); }
    b.textContent = aberto ? 'Recolher' : 'Mostrar';
    b.setAttribute('aria-expanded', aberto?'true':'false');
  }
  // avisos longos: 2 linhas + "ver mais"
  ['card-missed','card-weekrecap','card-coach-msg'].forEach(id=>{
    const c = $(id); if(!c || c.classList.contains('hidden')) return;
    const sub = c.querySelector('.card-sub'); if(!sub || sub.dataset.clamp) return;
    if((sub.textContent||'').length < 140) return;
    sub.dataset.clamp = '1'; sub.classList.add('clamp2');
    const mais = document.createElement('button'); mais.type='button'; mais.className='link-mais'; mais.textContent='ver mais';
    mais.onclick = e=>{ e.stopPropagation(); const fech = sub.classList.toggle('clamp2'); mais.textContent = fech ? 'ver mais' : 'ver menos'; };
    sub.after(mais);
  });
}

// ---------- 16. ALIMENTAÇÃO NA HOME ----------
// Usa o plano que o app já calcula (estimativa educativa, não substitui nutricionista). Nada é inventado:
// sem cadastro suficiente → estado vazio; refeições marcadas = as que o aluno marcou de verdade.
function nutriHoje(){
  if(!state.nutri) return { vazio:'novo' };
  let pl; try{ pl = nutriMontarPlano(getDayIdx()); }catch(e){ return { vazio:'erro' }; }
  if(!pl || pl.erro || !pl.refeicoes) return { vazio:'dados', msg: pl && pl.erro };
  const log = nutriLogDe(chaveDia(new Date()));
  const ref = pl.refeicoes.map(r=>Object.assign({}, r, { ok: log(r.id).ok }));
  const agoraMin = new Date().getHours()*60 + new Date().getMinutes();
  const min = h=>{ const [a,b] = String(h||'00:00').split(':').map(Number); return a*60+(b||0); };
  const prox = ref.find(r=>!r.ok && min(r.hora) >= agoraMin - 60) || ref.find(r=>!r.ok) || null;
  return { ref, feitas: ref.filter(r=>r.ok).length, total: ref.length, prox, kcal: pl.calc && pl.calc.kcal };
}
function nutriMarcarHome(id){
  const m = nutriMealLog(id, true, chaveDia(new Date())); m.ok = !m.ok;
  try{ Object.keys(state.nutriLog).sort().slice(0,-30).forEach(x=>delete state.nutriLog[x]); }catch(e){}
  try{ nutriLimpa(id); }catch(e){}
  saveData(); renderHomeMetrics();
  toast(m.ok ? '✅ Refeição marcada' : 'Marcação desfeita');
}
function _nutriTile(){
  const t = document.querySelector('#home-metrics .met[onclick="openNutri()"]'); if(!t) return;
  const h = nutriHoje();
  t.classList.add('met-nutri');
  if(h.vazio){
    const msg = h.msg==='menor' ? 'Plano alimentar disponível a partir de 18 anos' : h.vazio==='dados' ? 'Complete peso, altura, idade e sexo no perfil' : 'Nenhum plano alimentar disponível';
    t.innerHTML = `<div class="met-h"><i>🥗</i>Alimentação</div><div class="met-empty">${msg}</div><div class="met-s">${h.msg==='menor'?'Converse com um nutricionista':'Toque para ver detalhes'}</div>`;
    return;
  }
  const pct = h.total ? Math.round(h.feitas/h.total*100) : 0;
  t.innerHTML = `<div class="met-h"><i>🥗</i>Alimentação</div>
    ${h.prox ? `<div class="met-next"><small>Próxima · ${mtEsc(h.prox.hora||'')}</small><b>${mtEsc(h.prox.nome)}</b></div>` : `<div class="met-next"><small>Hoje</small><b>Refeições concluídas</b></div>`}
    <div class="act-bar" style="margin:0"><i style="width:${pct}%;background:var(--primary)"></i></div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><span class="met-s">${h.feitas} de ${h.total}</span>${h.prox?`<button class="aguabtn" onclick="event.stopPropagation();nutriMarcarHome('${h.prox.id}')" aria-label="Marcar ${mtEsc(h.prox.nome)} como feita">✓ Feita</button>`:''}</div>`;
}
mtGancho('renderHomeMetrics', { depois(){ try{ _nutriTile(); }catch(e){ console.log('nutri tile', e); } }});
// histórico honesto no plano alimentar: refeições MARCADAS (não marcar não quer dizer que não comeu)
const _openNutriB11 = openNutri;
window.openNutri = function(){
  const r = _openNutriB11.apply(this, arguments);
  try{
    const total = (state.nutri && state.nutri.refeicoes) || 5;
    const dias = []; for(let i=6;i>=0;i--){ const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-i); const dk = chaveDia(d); const dia = (state.nutriLog||{})[dk]||{}; const n = Object.values(dia).filter(x=>x===true || (x && x.ok)).length; dias.push({d, n}); }
    if(dias.some(x=>x.n>0)){
      const h3 = document.querySelector('#modal-inner h3');
      const box = document.createElement('div'); box.className = 'nutri-hist';
      box.innerHTML = `<div class="mt-muted" style="font-size:11.5px;margin-bottom:6px">Refeições marcadas nos últimos 7 dias</div><div class="nh-row">${dias.map(x=>`<div class="nh-d" title="${x.n} de ${total}"><i style="height:${Math.max(4, Math.round(Math.min(1,x.n/total)*36))}px;${x.n?'':'opacity:.25'}"></i><span>${['D','S','T','Q','Q','S','S'][x.d.getDay()]}</span></div>`).join('')}</div>`;
      if(h3) h3.after(box);
    }
  }catch(e){}
  return r;
};

// ---------- 17. GRÁFICOS ----------
// Componente único (SVG com proporção fixa, eixos com unidade, toque mostra o valor, cores do tema).
// Os dados vêm só dos registros reais. Períodos sem registro aparecem como zero em barras de contagem
// (zero treinos é um fato) — mas em peso e ritmo não se desenha ponto onde não houve medição.
const MT_MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
function _niceMax(v){ if(v<=0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v/p; return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p; }
function _fmtNum(v, dec){ return (+v).toLocaleString('pt-BR', {maximumFractionDigits: dec==null?1:dec, minimumFractionDigits:0}); }
function mtChart(cfg){
  // cfg: {tipo:'bar'|'line', pts:[{v, rot, tip}], un, meta, dec, fmt, inverter}
  const W = 340, H = 170, L = 34, R = 8, T = 12, B = 24;
  const pts = cfg.pts; const vals = pts.map(p=>p.v).filter(v=>v!=null);
  if(!vals.length) return '';
  let max = Math.max(...vals, cfg.meta||0), min = cfg.tipo==='line' ? Math.min(...vals) : 0;
  if(cfg.tipo==='line'){ const pad = Math.max((max-min)*0.15, (cfg.dec===0?1:0.5)); max += pad; min = Math.max(0, min-pad); }
  else { max = _niceMax(max); if(cfg.dec===0 && max>1 && max%2) max += 1; }
  const rng = (max-min) || 1;
  const x = i => L + (pts.length===1 ? (W-L-R)/2 : i*(W-L-R)/(pts.length-1));
  const y = v => T + (1-(v-min)/rng)*(H-T-B);
  const fmt = cfg.fmt || (v=>_fmtNum(v, cfg.dec));
  const axf = cfg.axFmt || fmt;
  let g = '';
  [0,0.5,1].forEach(f=>{ const v = min + rng*f; const yy = y(v); g += `<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" class="ch-grid"/><text x="${L-5}" y="${yy+3.5}" class="ch-ax" text-anchor="end">${axf(cfg.tipo==='line'?v:Math.round(v*10)/10)}</text>`; });
  const step = Math.max(1, Math.ceil(pts.length/5));
  pts.forEach((p,i)=>{ if(i%step===0 || i===pts.length-1 && (pts.length-1)%step>step/2) g += `<text x="${cfg.tipo==='bar'? L + (i+0.5)*(W-L-R)/pts.length : x(i)}" y="${H-7}" class="ch-ax" text-anchor="middle">${mtEsc(p.rot)}</text>`; });
  if(cfg.meta){ const ym = y(cfg.meta); g += `<line x1="${L}" x2="${W-R}" y1="${ym}" y2="${ym}" class="ch-meta"/><text x="${W-R}" y="${ym-4}" class="ch-ax" text-anchor="end">meta ${fmt(cfg.meta)}</text>`; }
  let marks = '';
  if(cfg.tipo==='bar'){
    const bw = (W-L-R)/pts.length;
    pts.forEach((p,i)=>{ const v = p.v||0; const h = Math.max(v>0?2:0, (H-T-B)*(v-min)/rng); const bx = L + i*bw + bw*0.18;
      marks += `<rect x="${bx}" y="${H-B-h}" width="${bw*0.64}" height="${h}" rx="${Math.min(4,bw*0.2)}" class="ch-bar${i===pts.length-1?' cur':''}"/><rect x="${L+i*bw}" y="${T}" width="${bw}" height="${H-T-B}" class="ch-hit" data-tip="${mtEsc(p.tip)}"/>`; });
  } else {
    const ok = pts.map((p,i)=>p.v==null?null:[x(i), y(p.v)]).filter(Boolean);
    if(ok.length>1) marks += `<path d="M${ok.map(c=>c.join(' ')).join('L')}" class="ch-line"/>`;
    pts.forEach((p,i)=>{ if(p.v==null) return; marks += `<circle cx="${x(i)}" cy="${y(p.v)}" r="3.2" class="ch-dot"/><circle cx="${x(i)}" cy="${y(p.v)}" r="12" class="ch-hit" data-tip="${mtEsc(p.tip)}"/>`; });
  }
  return `<div class="ch-tip" aria-live="polite">Toque no gráfico para ver os valores</div><svg class="mt-ch" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" onclick="mtChartTip(event)">${g}${marks}</svg>`;
}
function mtChartTip(ev){
  const t = ev.target.closest && ev.target.closest('.ch-hit'); if(!t) return;
  const svg = t.ownerSVGElement; svg.querySelectorAll('.ch-hit.sel').forEach(x=>x.classList.remove('sel')); t.classList.add('sel');
  const tip = svg.previousElementSibling; if(tip) tip.innerHTML = t.getAttribute('data-tip');
}
// períodos
const MT_PER = { semana:{n:7, passo:'dia', lbl:'Semana', dias:7}, mes:{n:5, passo:'semana', lbl:'Mês', dias:35}, tri:{n:13, passo:'semana', lbl:'Trimestre', dias:91}, ano:{n:12, passo:'mes', lbl:'Ano', dias:365} };
function _buckets(per, voltar){
  const P = MT_PER[per]; const out = [];
  if(P.passo==='dia'){ const fim = mtDia0()+DIA_MS - (voltar?7*DIA_MS:0); for(let i=P.n-1;i>=0;i--){ const a = fim-(i+1)*DIA_MS; const d = new Date(a); out.push({a, b:a+DIA_MS, rot:['D','S','T','Q','Q','S','S'][d.getDay()], nome:d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})}); } }
  else if(P.passo==='semana'){ const s0 = mtSemanaIni(Date.now()) - (voltar?P.n*7*DIA_MS:0); for(let i=P.n-1;i>=0;i--){ const a = s0 - i*7*DIA_MS; out.push({a, b:a+7*DIA_MS, rot:mtFmtData(a), nome:'semana de '+mtFmtData(a)}); } }
  else { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); if(voltar) d.setMonth(d.getMonth()-12); for(let i=P.n-1;i>=0;i--){ const a = new Date(d.getFullYear(), d.getMonth()-i, 1).getTime(); const b = new Date(d.getFullYear(), d.getMonth()-i+1, 1).getTime(); const m = new Date(a).getMonth(); out.push({a, b, rot:MT_MESES[m], nome:MT_MESES[m]+'/'+new Date(a).getFullYear()}); } }
  return out;
}
function _volumeEntre(a, b){
  let v = 0;
  Object.values(state.progress||{}).forEach(arr=>(arr||[]).forEach(p=>{ if(p.date>=a && p.date<b) v += (p.sets||[]).reduce((t,s)=>t+(+s.peso||0)*(+s.reps||0),0); }));
  const vistos = new Set(); Object.values(state.progress||{}).forEach(arr=>(arr||[]).forEach(p=>vistos.add(p.date)));
  Object.values(state.progResumo||{}).forEach(arr=>(arr||[]).forEach(r=>{ if(r && r.d>=a && r.d<b && !vistos.has(r.d)) v += (+r.v||0); }));
  return Math.round(v);
}
// métricas disponíveis (só aparecem se fizer sentido para o aluno)
function mtMetricas(){
  const h = mtHist();
  const tem = t=>h.some(x=>x._t===t);
  const M = [];
  M.push({k:'freq', lbl:'Frequência', tipo:'bar', un:'dias ativos', dec:0, pers:['mes','tri','ano'], serie:(bs)=>bs.map(b=>({v: mtDiasAtivos(b.a,b.b).size, b})), soma:true, meta: ()=>contextoAluno().planejados, metaPasso:'semana', mais:'mais dias ativos'});
  M.push({k:'tempo', lbl:'Tempo de treino', tipo:'bar', un:'min', dec:0, pers:['semana','mes','tri','ano'], serie:(bs)=>bs.map(b=>({v: Math.round(h.filter(x=>x.at>=b.a&&x.at<b.b).reduce((s,x)=>s+(+x.duration||0),0)), b})), soma:true});
  if((state.weights||[]).length) M.push({k:'peso', lbl:'Peso', tipo:'line', un:'kg', dec:1, pers:['mes','tri','ano'], pontos:true});
  if(state.modules.lift) M.push({k:'volume', lbl:'Volume (musculação)', tipo:'bar', un:'kg', dec:0, pers:['semana','mes','tri','ano'], serie:(bs)=>bs.map(b=>({v:_volumeEntre(b.a,b.b), b})), soma:true, axFmt:v=>v>=1000?_fmtNum(v/1000,1)+' mil':_fmtNum(v,0)});
  const km = t=>(bs)=>bs.map(b=>({v: Math.round(h.filter(x=>x._t===t && x.at>=b.a && x.at<b.b).reduce((s,x)=>s+(+x.distance||0),0)*10)/10, b}));
  if(tem('corrida')){ M.push({k:'run', lbl:'Corrida (km)', tipo:'bar', un:'km', dec:1, pers:['semana','mes','tri','ano'], serie:km('corrida'), soma:true}); M.push({k:'pace', lbl:'Ritmo da corrida', tipo:'line', un:'min/km', dec:2, pers:['mes','tri','ano'], pontos:true, menorMelhor:true, fmt:v=>mtPaceStr(v).replace('/km','')}); }
  if(tem('caminhada')) M.push({k:'walk', lbl:'Caminhada (km)', tipo:'bar', un:'km', dec:1, pers:['semana','mes','tri','ano'], serie:km('caminhada'), soma:true});
  if(tem('bike')){ M.push({k:'bike', lbl:'Bike (km)', tipo:'bar', un:'km', dec:1, pers:['semana','mes','tri','ano'], serie:km('bike'), soma:true}); M.push({k:'bikev', lbl:'Velocidade na bike', tipo:'line', un:'km/h', dec:1, pers:['mes','tri','ano'], pontos:true}); }
  return M;
}
function _pontosLinha(k, a, b){
  if(k==='peso') return (state.weights||[]).filter(w=>w.weight>0 && w.date>=a && w.date<b).sort((x,y)=>x.date-y.date).map(w=>({t:w.date, v:+w.weight}));
  const h = mtHist();
  if(k==='pace') return h.filter(x=>x._t==='corrida' && +x.distance>0 && +x.duration>0 && x.at>=a && x.at<b).map(x=>({t:x.at, v:(+x.duration)/(+x.distance), extra:mtFmtKm(x.distance)+' km'}));
  if(k==='bikev') return h.filter(x=>x._t==='bike' && +x.distance>0 && +x.duration>0 && x.at>=a && x.at<b).map(x=>({t:x.at, v:(+x.distance)/((+x.duration)/60), extra:mtFmtKm(x.distance)+' km'}));
  return [];
}
function _desdeQuando(k){
  if(k==='peso'){ const w = (state.weights||[]).filter(x=>x.weight>0).map(x=>x.date); return w.length?Math.min(...w):null; }
  if(k==='volume'){ let m = Infinity; Object.values(state.progress||{}).forEach(a=>(a||[]).forEach(p=>m=Math.min(m,p.date))); Object.values(state.progResumo||{}).forEach(a=>(a||[]).forEach(r=>r&&(m=Math.min(m,r.d)))); return isFinite(m)?m:null; }
  const h = mtHist(); return h.length ? h[0].at : null;
}
function renderEvolucao(){
  const el = $('perf-evo'); if(!el) return;
  const M = mtMetricas();
  let k = mtLS('mt_evo_k') || 'freq'; if(!M.some(m=>m.k===k)) k = M[0].k;
  const m = M.find(x=>x.k===k);
  let per = mtLS('mt_evo_p') || 'mes'; if(!m.pers.includes(per)) per = m.pers.includes('mes') ? 'mes' : m.pers[0];
  const P = MT_PER[per];
  const fmt = m.fmt || (v=>_fmtNum(v, m.dec));
  const chips = M.map(x=>`<button type="button" class="nxchip ${x.k===k?'on':''}" onclick="mtLS('mt_evo_k','${x.k}');renderEvolucao()">${x.lbl}</button>`).join('');
  const pers = Object.keys(MT_PER).map(p=>`<button type="button" class="${p===per?'on':''}" ${m.pers.includes(p)?'':'disabled'} onclick="mtLS('mt_evo_p','${p}');renderEvolucao()">${MT_PER[p].lbl}</button>`).join('');
  const desde = _desdeQuando(k);
  const bs = _buckets(per), ant = _buckets(per, true);
  const ini = bs[0].a, fim = bs[bs.length-1].b;
  let corpo = '', comp = '', nota = '';
  const retencao = (m.k!=='peso' && m.k!=='volume' && per==='ano') ? (typeof arqNotaRetencao==='function' ? arqNotaRetencao() : '') : '';
  if(m.pontos){
    const ps = _pontosLinha(k, ini, fim);
    if(ps.length < 2){ corpo = _vazio(m, ps.length); }
    else {
      const pts = ps.map(p=>({v:p.v, rot: per==='ano' ? MT_MESES[new Date(p.t).getMonth()] : mtFmtData(p.t), tip:`<b>${fmt(p.v)} ${m.un}</b> · ${new Date(p.t).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})}${p.extra?' · '+p.extra:''}`}));
      corpo = mtChart({tipo:'line', pts, un:m.un, dec:m.dec, fmt});
      const d = ps[ps.length-1].v - ps[0].v;
      const rel = ps[0].v ? d/ps[0].v : 0;
      const lbl = m.k==='peso' ? `${d>0?'+':d<0?'−':''}${_fmtNum(Math.abs(d),1)} kg no período` : (Math.abs(rel)<0.02 ? 'estável no período' : ((m.menorMelhor ? d<0 : d>0) ? 'melhorando no período' : 'piorando no período'));
      const det = m.k==='pace' ? ` (${mtPaceStr(ps[0].v)} → ${mtPaceStr(ps[ps.length-1].v)})` : m.k==='peso' ? ` (${_fmtNum(ps[0].v,1)} → ${_fmtNum(ps[ps.length-1].v,1)} kg)` : ` (${fmt(ps[0].v)} → ${fmt(ps[ps.length-1].v)} ${m.un})`;
      comp = `<div class="ch-comp"><span class="ch-trend ${m.k==='peso'?'neu':(Math.abs(rel)<0.02?'neu':((m.menorMelhor ? d<0 : d>0)?'up':'dn'))}">${lbl}</span>${det}</div>`;
    }
  } else {
    const s = m.serie(bs), sa = m.serie(ant);
    const naoZero = s.filter(x=>x.v>0).length;
    if(naoZero < 2){ corpo = _vazio(m, naoZero); }
    else {
      const pts = s.map(x=>({v:x.v, rot:x.b.rot, tip:`<b>${fmt(x.v)} ${m.un}</b> · ${x.b.nome}`}));
      const meta = (m.meta && P.passo===m.metaPasso) ? m.meta() : null;
      corpo = mtChart({tipo:'bar', pts, un:m.un, dec:m.dec, fmt, meta, axFmt:m.axFmt});
      const tot = s.reduce((a,x)=>a+x.v,0), totA = sa.reduce((a,x)=>a+x.v,0);
      const temAnterior = desde && desde < ini - 3*DIA_MS;
      if(!temAnterior) comp = `<div class="ch-comp"><b>${fmt(tot)} ${m.un}</b> no período · ainda não há registros do período anterior para comparar</div>`;
      else { const rel = totA ? (tot-totA)/totA : 1; const cls = Math.abs(rel)<0.05 ? 'neu' : rel>0 ? 'up' : 'dn';
        comp = `<div class="ch-comp"><b>${fmt(tot)} ${m.un}</b> no período · <span class="ch-trend ${cls}">${cls==='neu'?'estável':(rel>0?'+':'−')+Math.round(Math.abs(rel)*100)+'%'}</span> vs. ${P.lbl==='Semana'?'semana':'período'} anterior (${fmt(totA)})</div>`; }
      if(meta) nota = `Linha tracejada: sua meta de ${meta} dias por semana.`;
    }
  }
  el.innerHTML = `<div class="chart-head" style="margin-bottom:8px"><div class="chart-title">Evolução</div></div>
    <div class="nxchips evo-chips">${chips}</div>
    <div class="seg-nav seg-sm">${pers}</div>
    <div class="ch-wrap">${corpo}</div>${comp}
    ${(nota||retencao)?`<div class="mt-muted" style="font-size:11.5px;margin-top:6px">${[nota, retencao].filter(Boolean).join(' ')}</div>`:''}`;
}
function _vazio(m, n){
  const quanto = m.k==='peso' ? 'pelo menos 2 pesagens' : m.pontos ? 'pelo menos 2 registros' : 'registros em pelo menos 2 '+'períodos';
  return `<div class="ch-empty"><b>Ainda não há dados suficientes</b><span>Para este gráfico são necessários ${quanto} neste intervalo${n?` (há ${n})`:''}. Isso não indica desempenho ruim — só falta histórico. Tente um período maior ou volte depois de registrar mais.</span></div>`;
}
mtGancho('renderPerf', { depois(){
  try{
    let el = $('perf-evo');
    if(!el){ el = document.createElement('div'); el.id = 'perf-evo'; el.className = 'chart-card'; const ref = document.querySelector('#scr-perf .chart-card'); if(ref) ref.before(el); }
    renderEvolucao();
  }catch(e){ console.log('evolução:', e); }
}});
// Perfil: gráfico do peso com o mesmo componente (período ajustável); o histórico completo continua a um toque
mtGancho('renderProfile', { depois(){
  try{
    const slot = $('pf-weight-chart-slot'); if(!slot) return;
    slot.removeAttribute('onclick');
    const per = mtLS('mt_pf_p') || 'tri';
    const ini = _buckets(per)[0].a;
    const ps = _pontosLinha('peso', ini, Date.now()+DIA_MS);
    const pers = ['mes','tri','ano'].map(p=>`<button type="button" class="${p===per?'on':''}" onclick="mtLS('mt_pf_p','${p}');renderProfile()">${MT_PER[p].lbl}</button>`).join('');
    const corpo = ps.length>=2 ? mtChart({tipo:'line', un:'kg', dec:1, pts: ps.map(p=>({v:p.v, rot: per==='ano'?MT_MESES[new Date(p.t).getMonth()]:mtFmtData(p.t), tip:`<b>${_fmtNum(p.v,1)} kg</b> · ${new Date(p.t).toLocaleDateString('pt-BR')}`}))})
      : _vazio({k:'peso', pontos:true}, ps.length);
    slot.innerHTML = `<div class="seg-nav seg-sm">${pers}</div><div class="ch-wrap">${corpo}</div><button type="button" class="btn btn-ghost btn-block" style="margin-top:8px;font-size:12.5px;padding:8px" onclick="openWeightHistory()">Ver todas as pesagens</button>`;
  }catch(e){ console.log('peso:', e); }
}});

// ---------- Tema: destaques que seguem a cor do tema ----------
// ✅ (feito) vira um "check" na cor do tema no modo de ícones de linha
try{
  ICO_SVG.check = '<path d="M5 12.5l4.2 4.2L19 7"/>';
  ICO_POR_EMOJI['✅'] = 'check'; ICO_POR_EMOJI['✔'] = 'check';
  ICO_MANTER.delete('✅'); ICO_MANTER.delete('✔');
  const _icoHtmlOrig = _icoHtml;
  _icoHtml = function(nome, extra){ return _icoHtmlOrig(nome, extra).replace('<i class="ico', `<i data-i="${nome}" class="ico`); };
}catch(e){}

// ---------- Perfil: Áudio dos vídeos ----------
mtGancho('renderProfile', { depois(){
  try{ const v = $('audio-row-val'); if(v) v.textContent = (videoMudoPref() ? 'Iniciar no mudo' : 'Áudio original') + ' ›'; }catch(e){}
}});

// ---------- Home: aplica os refinamentos depois de cada desenho ----------
mtGancho('renderHome', { depois(){
  try{ _mtAplicaColapsos(); }catch(e){ console.log('colapsos:', e); }
}});

Object.assign(window, { setVideoAudio, openAudioVideos, mtAlternarSom, mtTentarVideo, mtReportarVideo, openVideosReportados, mtVerRelatos, mtEditarLinkVideo, mtSalvarLinkVideo, mtResolverVideo,
  mtComBotao, mtColToggle, nutriMarcarHome, renderEvolucao, mtChartTip, videoMudoPref });

// ===================================================================================================
// RC 3 — Etapa 2: cálculos, registros e experiência de treino
// ===================================================================================================

// ---------- 1. Motor do volume de carga (um só, usado no card, no histórico e no PDF) ----------
// CAUSA do "4,2 toneladas levantadas": a conta (carga × repetições de todas as séries) estava certa, mas era
// apresentada como o número principal do card, sem dizer o que é, e somava qualquer número digitado no
// campo de carga. Ninguém "levanta 4,2 t" num treino de 52 min no sentido em que o card sugeria.
// Regras (mtVolumeEntradas):
//   • exercício com carga: soma a carga REGISTRADA × repetições, exatamente como digitada. Halteres e
//     exercícios unilaterais NÃO são dobrados (o app não sabe se o número é de um halter ou dos dois, então
//     não inventa); peso do corpo nunca entra (o app não soma o peso da pessoa);
//   • peso do corpo com carga extra (colete, anilha): soma só a carga extra × repetições (separada em "extra");
//   • exercício por tempo (prancha…): não entra no volume (segundos × kg não é volume);
//   • séries sem carga contam como séries, não como volume; dados incompletos (sem repetições) são ignorados.
// O volume continua sendo métrica de evolução (Progresso, PDF), com o nome certo: "volume de carga
// (carga × repetições)". O card de compartilhar mostra séries, exercícios, repetições e duração.
function mtVolumeEntradas(entradas){
  const R = { kg:0, kgExtra:0, series:0, seriesCarga:0, reps:0, exercicios:0, maior:null };
  (entradas||[]).forEach(en=>{
    if(!en || !en.sets || !en.sets.length) return;
    const tempo = (typeof exUsaTempo === 'function') && exUsaTempo(en.exId);
    const tipo = (typeof exTipoRegistro === 'function') ? exTipoRegistro(en.exId) : 'carga';
    let algum = false;
    en.sets.forEach(s=>{
      const reps = +s.reps || 0, kg = +s.peso || 0; if(reps <= 0) return;
      algum = true; R.series++;
      if(tempo) return;
      R.reps += reps;
      if(kg > 0){
        R.seriesCarga++;
        if(tipo === 'carga') R.kg += kg*reps; else R.kgExtra += kg*reps;
        if(tipo === 'carga' && (!R.maior || kg > R.maior.kg)) R.maior = { kg, ex: en.exId };
      }
    });
    if(algum) R.exercicios++;
  });
  R.kg = Math.round(R.kg); R.kgExtra = Math.round(R.kgExtra);
  return R;
}
// séries de um treino do histórico (mesmo dia, exercícios do treino)
function mtEntradasDoTreino(x){
  const dia = mtDia0Ts(x.at); const out = [];
  (x.exercisesDone||[]).forEach(e=>{ const p = (state.progress[e.id]||[]).find(q=>q && mtDia0Ts(q.date) === dia); if(p && p.sets && p.sets.length) out.push({ exId:e.id, sets:p.sets }); });
  return out;
}
function mtVolumeTreino(x){ return mtVolumeEntradas(mtEntradasDoTreino(x)); }

// ---------- 2. Cards de compartilhamento ----------
// Musculação: o número principal passa a ser o que a pessoa fez (séries), com exercícios, repetições e duração.
const _mtsDeHistRC3 = window.mtsDeHistorico;
window.mtsDeHistorico = function(x){
  const d = _mtsDeHistRC3.apply(this, arguments);
  try{
    if(!d || d.tipo !== 'musculacao') return d;
    const V = mtVolumeTreino(x);
    const dur = _mtsDur(x.duration);
    const nums = [{ l:'Duração', v:dur.v, u:dur.u }];
    if(V.exercicios) nums.push({ l:'Exercícios', v:String(V.exercicios), u:'' });
    if(V.reps) nums.push({ l:'Repetições', v:_mtsN(V.reps), u:'' });
    d.hero = V.series ? { v:String(V.series), u: V.series===1 ? 'série concluída' : 'séries concluídas' } : { v:dur.v, u:dur.u||'de treino' };
    d.nums = nums.slice(0,3);
    if(V.maior){ let nome = ''; try{ nome = nomeDoEx(V.maior.ex) || ''; }catch(e){} d.desc = `Maior carga: ${_mtsN(V.maior.kg, V.maior.kg % 1 ? 1 : 0)} kg${nome ? ' · ' + nome : ''}`; }
    if(x.adicional) d.kick = 'Treino adicional';
  }catch(e){ console.log('card musculação:', e); }
  return d;
};
// Semana: CAUSA da confusão — o card juntava "2 treinos · 6,1 km · 3h03" com UMA data (a de hoje), e parecia uma
// sessão só. Agora: o período da semana no lugar da data e a lista de atividades, cada uma com o seu dia.
const _mtsDeSemanaRC3 = window.mtsDeSemana;
window.mtsDeSemana = function(){
  const d = _mtsDeSemanaRC3.apply(this, arguments); if(!d) return d;
  try{
    const ini = mtSemanaIni(Date.now()), fim = ini + 6*86400000;
    const fmt = t=>new Date(t).toLocaleDateString('pt-BR', { day:'numeric', month:'short' }).replace('.', '');
    d.data = null; d.periodo = `Semana de ${fmt(ini)} a ${fmt(fim)}`;
    const DN = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const H = mtHist().filter(x=>x.at >= ini && x.at < fim + 86400000).sort((a,b)=>a.at-b.at);
    d.lista = H.map(x=>{ const t = new Date(x.at); const dia = `${DN[t.getDay()]} ${t.getDate()}`;
      const nome = x._t === 'musculacao' ? (String(x.name||'Musculação').replace(/^Treino (\w+) — .*$/, 'Musculação · Treino $1') + (x.adicional ? ' (adicional)' : '')) : ({ corrida:'Corrida', caminhada:'Caminhada', bike:'Bike' }[x._t] || 'Atividade');
      const det = [x.distance ? `${mtFmtKm(x.distance)} km` : '', x.duration ? fmtDur(x.duration, true) : ''].filter(Boolean).join(' · ');
      return { dia, txt: nome + (det ? ' · ' + det : '') }; });
    (d.nums||[]).forEach(n=>{ if(n.l === 'Tempo') n.l = 'Tempo total'; if(n.l === 'Distância') n.l = 'Distância total'; });
  }catch(e){ console.log('card semana:', e); }
  return d;
};

// ---------- 3. Registro de atividades: um lugar certo para cada pessoa ----------
// • Com plano de corrida: registrar fica no treino do dia (Treinos), e a tela de registro tem "Importar do relógio".
// • Sem plano de corrida: o Início ganha "Registrar atividade" (caminhada, corrida ou bike avulsa, com importação).
// • Musculação: nenhuma importação de relógio (o arquivo de força é recusado desde a RC 2).
const _mtAtalhoImport = `<button type="button" class="integ-atalho" id="integ-atalho" onclick="openIntegracoes()"><span class="ia-ico" aria-hidden="true">⌚</span><span class="ia-tx">Tem o treino no relógio?<b>Importar arquivo (GPX, TCX, FIT)</b></span><span class="ia-seta" aria-hidden="true">›</span></button>`;
mtGancho('openRunLog', { depois(){
  try{ const mi = $('modal-inner'); if(!mi || mi.querySelector('#integ-atalho')) return; const h = mi.querySelector('h3'); if(h) h.insertAdjacentHTML('afterend', _mtAtalhoImport); }catch(e){}
}});
function mtRegistroInicio(){
  try{
    const slot = $('today-slot'); if(!slot) return;
    let el = $('home-registrar');
    const temPlanoCorrida = !!(state.modules.run && state.modules.run.plan);
    if(temPlanoCorrida){ if(el) el.remove(); return; }
    if(!el){ el = document.createElement('div'); el.id = 'home-registrar'; slot.after(el); }
    el.innerHTML = `<button type="button" class="card home-reg" onclick="openActivityLog()"><span class="hr-ic" aria-hidden="true">➕</span><span class="hr-tx"><b>Registrar atividade</b><small>Caminhada, corrida ou bike avulsa — à mão ou pelo arquivo do relógio</small></span><span class="hr-seta" aria-hidden="true">›</span></button>`;
  }catch(e){}
}
mtGancho('renderHome', { depois(){ mtRegistroInicio(); } });
// o atalho antigo do topo de Treinos não existe mais (index.html); garante que nenhuma versão em cache o recrie
mtGancho('renderSessions', { depois(){ try{ document.querySelectorAll('#sess-qlinks .qlink').forEach(b=>{ if(/openActivityLog|openIntegracoes/.test(b.getAttribute('onclick')||'')) b.remove(); }); }catch(e){} } });

// ---------- 4. Cronômetro dos exercícios por tempo ----------
// Para cada série de um exercício medido em segundos (prancha, isometrias): Iniciar → contando (com o alvo do
// plano) → Concluir grava o tempo REAL contado na série e marca a série como feita. Pausar/Retomar existem;
// Descartar não grava nada. A contagem usa o relógio do aparelho (horário de início), então continua certa com
// a tela bloqueada ou o app em segundo plano; o aviso de alvo atingido aparece quando o app volta (o
// navegador não roda código com a tela bloqueada). Se o app for fechado/reiniciado no meio, a contagem é
// tratada como interrompida: nada é gravado e o aviso diz isso. Nunca é marcada como concluída sem o toque.
// ícones em SVG (o modo de ícones minimalistas troca caracteres como ▶ por desenhos e o botão ficava vazio)
const _CRON_ICO = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
const _CRON_ICO_ON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="7.5"/><path d="M12 13V9.5M10 3h4"/></svg>';
const MT_CRON = { exId:null, i:-1, ini:0, acum:0, rodando:false, alvo:0, avisou:false, t:null };
function _cronAlvo(exId){
  try{ const mod = state.modules.lift; let w = null; try{ w = currentSelectedWorkout(mod); }catch(e){}
    let ex = (w && (w.exercises||[]).find(e=>e.id===exId)) || (typeof extrasDeHoje==='function' ? extrasDeHoje().find(e=>e.id===exId) : null);
    const n = String((ex && ex.reps) || '').match(/(\d+)\s*s?\s*$/); return n ? +n[1] : 0; }catch(e){ return 0; }
}
function _cronSeg(){ return Math.max(0, Math.floor((MT_CRON.acum + (MT_CRON.rodando ? Date.now() - MT_CRON.ini : 0))/1000)); }
function _cronGuarda(){ try{ if(MT_CRON.exId) localStorage.setItem('mt_cron_ex', JSON.stringify({ ex:MT_CRON.exId, nome:(curLog && curLog.exName) || '', em:Date.now() })); else localStorage.removeItem('mt_cron_ex'); }catch(e){} }
function _cronTick(){
  const el = $('cron-seg'); if(!el){ return; }
  const s = _cronSeg(); el.textContent = fmtTempo(s);
  const bar = $('cron-bar'); if(bar && MT_CRON.alvo) bar.style.width = Math.min(100, Math.round(s/MT_CRON.alvo*100)) + '%';
  if(MT_CRON.alvo && s >= MT_CRON.alvo && !MT_CRON.avisou){ MT_CRON.avisou = true; const st = $('cron-st'); if(st) st.textContent = 'Alvo atingido — toque em Concluir quando terminar';
    try{ if(typeof restVibrarLigado !== 'function' || restVibrarLigado()) navigator.vibrate && navigator.vibrate([180,80,180]); }catch(e){} }
}
function mtCronIniciar(i){
  if(!curLog) return;
  if(MT_CRON.exId && (MT_CRON.exId !== curLog.exId || MT_CRON.i !== i)) mtCronDescartar(true);
  Object.assign(MT_CRON, { exId:curLog.exId, i, ini:Date.now(), acum:0, rodando:true, alvo:_cronAlvo(curLog.exId), avisou:false });
  window.__mtCronEx = true; _cronGuarda();
  try{ telaLigadaPedir('cronometro'); }catch(e){}
  clearInterval(MT_CRON.t); MT_CRON.t = setInterval(_cronTick, 250);
  renderSetLogModal();
}
function mtCronPausar(){ if(!MT_CRON.rodando) return; MT_CRON.acum += Date.now() - MT_CRON.ini; MT_CRON.rodando = false; renderSetLogModal(); }
function mtCronRetomar(){ if(MT_CRON.rodando || !MT_CRON.exId) return; MT_CRON.ini = Date.now(); MT_CRON.rodando = true; renderSetLogModal(); }
function _cronFim(){ clearInterval(MT_CRON.t); Object.assign(MT_CRON, { exId:null, i:-1, ini:0, acum:0, rodando:false, avisou:false }); window.__mtCronEx = false; _cronGuarda(); try{ telaLigadaSoltar('cronometro'); }catch(e){} }
function mtCronConcluir(){
  if(!curLog || MT_CRON.exId !== curLog.exId) return;
  const s = _cronSeg(); const i = MT_CRON.i;
  if(s < 1){ toast('A contagem ainda não começou.'); return; }
  const set = curLog.entry.sets[i]; if(!set){ _cronFim(); renderSetLogModal(); return; }
  set.reps = s;
  _cronFim();
  if(Array.isArray(curLog.feitas) && curLog.feitas[i]) curLog.feitas[i] = false;   // concluir abaixo marca de novo (e inicia o descanso)
  concluirSerie(i);
  toast(`Série ${i+1}: ${fmtTempo(s)} registrados`);
}
function mtCronDescartar(silencio){ const ativo = !!MT_CRON.exId; _cronFim(); if(ativo && !silencio) toast('Contagem descartada — nada foi registrado.'); if(curLog && !silencio) renderSetLogModal(); }
mtGancho('renderSetLogModal', { depois(){
  try{
    if(!curLog || !(typeof exUsaTempo === 'function' && exUsaTempo(curLog.exId))) return;
    const mi = $('modal-inner'); if(!mi) return;
    // cabeçalho com as mesmas colunas das séries (o botão ▶ acrescenta uma coluna)
    const cab = mi.querySelector('.set-row:not(:has(.set-ok))'); if(cab) cab.classList.add('com-cron');
    // botão de cronômetro em cada série ainda não concluída
    mi.querySelectorAll('.set-row').forEach((row, k)=>{
      const ok = row.querySelector('.set-ok'); if(!ok || row.querySelector('.set-cron')) return;
      const i = [...mi.querySelectorAll('.set-row')].filter(r=>r.querySelector('.set-ok')).indexOf(row); if(i < 0) return;
      const feita = curLog.feitas && curLog.feitas[i];
      row.classList.add('com-cron');
      if(feita){ ok.insertAdjacentHTML('beforebegin', '<span class="set-cron-vazio" aria-hidden="true"></span>'); return; }
      ok.insertAdjacentHTML('beforebegin', `<button type="button" class="set-cron${MT_CRON.exId===curLog.exId && MT_CRON.i===i ? ' on' : ''}" onclick="mtCronIniciar(${i})" aria-label="Cronometrar a série ${i+1}">${MT_CRON.exId===curLog.exId && MT_CRON.i===i ? _CRON_ICO_ON : _CRON_ICO}</button>`);
      row.classList.add('com-cron');
    });
    // painel do cronômetro da série em andamento
    if(MT_CRON.exId === curLog.exId && MT_CRON.i >= 0){
      const s = _cronSeg(); const alvo = MT_CRON.alvo;
      const painel = `<div class="cron-ex" role="timer" aria-live="off"><div class="cron-top"><span>Série ${MT_CRON.i+1}${alvo ? ` · alvo ${fmtTempo(alvo)}` : ''}</span><span id="cron-st">${MT_CRON.rodando ? 'Contando' : 'Pausado — não registrado ainda'}</span></div>
        <div class="cron-seg mono" id="cron-seg">${fmtTempo(s)}</div>${alvo ? `<div class="cron-trilho"><i id="cron-bar" style="width:${Math.min(100, Math.round(s/alvo*100))}%"></i></div>` : ''}
        <div class="cron-bts">${MT_CRON.rodando ? `<button type="button" class="btn btn-ghost" onclick="mtCronPausar()">Pausar</button>` : `<button type="button" class="btn btn-ghost" onclick="mtCronRetomar()">Retomar</button>`}<button type="button" class="btn btn-primary" onclick="mtCronConcluir()">Concluir série</button></div>
        <button type="button" class="link-mais cron-desc" onclick="mtCronDescartar()">Descartar contagem</button></div>`;
      const alvoEl = mi.querySelector('.set-row') ? mi.querySelector('.set-row').parentNode : null;
      if(alvoEl) alvoEl.insertAdjacentHTML('afterend', painel);
      if(MT_CRON.rodando){ clearInterval(MT_CRON.t); MT_CRON.t = setInterval(_cronTick, 250); }
    } else if(!mi.querySelector('.cron-dica') && curLog.entry.sets.length){
      const ref = mi.querySelector('.set-row') && mi.querySelector('.set-row').parentNode;
      if(ref) ref.insertAdjacentHTML('afterend', `<p class="cron-dica">Toque no botão de play numa série para cronometrar: o tempo contado vai direto para a série.</p>`);
    }
  }catch(e){ console.log('cronômetro:', e); }
}});
// fechar o registro com a contagem aberta = interrompida (nada é gravado)
mtGancho('closeSetLog', { antes(){ if(MT_CRON.exId){ const ativo = MT_CRON.exId; _cronFim(); toast('A contagem em andamento foi interrompida e não foi registrada.'); void ativo; } } });
// voltou ao app: a conta continua certa pelo horário de início
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'visible' && MT_CRON.exId) _cronTick(); });
// o app foi fechado/reiniciado no meio de uma contagem
mtGancho('bootAfterAuth', { depois(){ try{ const o = JSON.parse(localStorage.getItem('mt_cron_ex') || 'null'); if(o){ localStorage.removeItem('mt_cron_ex'); setTimeout(()=>toast(`A contagem de ${o.nome || 'um exercício'} foi interrompida quando o app fechou e não foi registrada.`, 4500), 1800); } }catch(e){} } });

// ---------- 5. Carga extra: botão, e opção de ocultar (por conta) ----------
function mtCargaExtraOcultar(on){
  state.prefs = state.prefs || {}; if(on) state.prefs.ocultarCargaExtra = true; else delete state.prefs.ocultarCargaExtra;
  saveData();
  if(curLog && $('modal-back').classList.contains('on')) renderSetLogModal();
  if(on) toast('Botão "Usei carga extra" oculto. Para mostrar de novo: Perfil › Treino.');
  try{ mtCargaExtraLinha(); }catch(e){}
}
function mtCargaExtraLinha(){
  const box = document.querySelector('#pf-g-treino .pf-grp-b'); if(!box) return;
  let r = $('pf-cargaextra-row'); const oculto = !!(state.prefs && state.prefs.ocultarCargaExtra);
  if(!r){ r = document.createElement('div'); r.className = 'list-row'; r.id = 'pf-cargaextra-row'; box.appendChild(r); }
  r.setAttribute('onclick', `mtCargaExtraOcultar(${oculto ? 'false' : 'true'})`);
  r.innerHTML = `➕ <span>Botão "Usei carga extra"</span><span style="margin-left:auto;color:var(--text-mute);font-size:12px">${oculto ? 'oculto · tocar para mostrar' : 'visível · tocar para ocultar'}</span>`;
}
mtGancho('renderProfile', { depois(){ try{ mtCargaExtraLinha(); }catch(e){} } });

// ---------- 6. PDF: série por série ----------
// CAUSA do "todas as séries com 27 kg": o relatório não tinha as séries — a tabela "Evolução de carga" mostra a
// MAIOR carga de cada sessão nas colunas "Primeira / Última / Melhor". Com uma sessão só (21, 27, 27 kg), as três
// colunas mostravam 27 kg e liam-se como "série 1, 2 e 3". O app (Detalhes do treino) estava certo.
// Agora: colunas com o nome certo ("Maior carga na 1ª sessão" etc.) e uma seção nova com as séries de cada
// sessão do período, exatamente como foram registradas (carga × repetições, uma por uma).
function mtPdfSessoesSeries(ini, fim){
  const out = [];
  (((state.modules.lift||{}).history)||[]).filter(x=>x && x.at >= ini && x.at < fim).sort((a,b)=>a.at-b.at).forEach(x=>{
    mtEntradasDoTreino(x).forEach(en=>{
      let nome = en.exId; try{ nome = nomeDoEx(en.exId) || en.exId; }catch(e){}
      const tempo = typeof exUsaTempo === 'function' && exUsaTempo(en.exId);
      const series = en.sets.filter(s=>+s.reps > 0).map((s,k)=>`${k+1}ª: ${tempo ? fmtTempo(s.reps) : ((+s.peso > 0 ? String(+s.peso).replace('.',',') + ' kg × ' : '') + s.reps + (+s.peso > 0 ? '' : ' rep.'))}`).join(' · ');
      out.push([new Date(x.at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }), nome, series]);
    });
  });
  return out;
}

(function(){ if(document.getElementById('rc3-e2-css')) return; const s = document.createElement('style'); s.id = 'rc3-e2-css';
  s.textContent = `
.pr-badge.pr-ref{background:var(--surface-2);color:var(--text-dim);border-color:var(--border)}
.sl-extra{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px}
.sl-extra-btn{padding:8px 14px!important;font-size:13px!important;width:auto!important}
.sl-extra-ex{font-size:12px;color:var(--text-mute)}
.sl-extra-ocultar{margin-left:auto;background:none;border:0;color:var(--text-mute);font-size:12px;text-decoration:underline;cursor:pointer;padding:6px 2px}
.sl-extra-nota{font-size:11.5px;color:var(--text-mute);margin:6px 0 0;line-height:1.45}
.set-row.com-cron{grid-template-columns:30px 1fr 1fr 38px 38px 30px;gap:6px}
.set-row.com-cron.sem-peso{grid-template-columns:30px 1fr 38px 38px 30px;gap:6px}
.set-cron{width:38px;height:38px;border-radius:12px;border:1px solid var(--line-primary);background:var(--tint-primary);color:var(--primary-2);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}
.set-cron svg{display:block}
.set-cron.on{background:var(--primary);color:var(--on-primary)}
.cron-ex{margin:10px 0 2px;padding:12px 14px;border-radius:16px;border:1px solid var(--line-primary);background:var(--tint-primary)}
.cron-top{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:var(--text-dim);font-weight:600}
.cron-seg{font-size:44px;font-weight:800;text-align:center;margin:6px 0 4px;letter-spacing:1px;color:var(--text)}
.cron-trilho{height:6px;border-radius:99px;background:var(--surface-2);overflow:hidden;margin:2px 0 10px}.cron-trilho i{display:block;height:100%;background:var(--primary);transition:width .25s linear}
.cron-bts{display:grid;grid-template-columns:1fr 1.4fr;gap:8px}
.cron-desc{display:block;margin:8px auto 0}
.cron-dica{font-size:12px;color:var(--text-mute);margin:8px 0 0;line-height:1.45}
.home-reg{display:flex;align-items:center;gap:12px;width:100%;text-align:left;margin-top:12px;padding:14px 16px;cursor:pointer;font:inherit;color:inherit}
.home-reg .hr-ic{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--tint-primary);color:var(--primary-2);font-size:18px;flex:none}
.home-reg .hr-tx{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}.home-reg .hr-tx small{color:var(--text-dim);font-size:12px;line-height:1.35}
.home-reg .hr-seta{color:var(--text-mute);font-size:20px}
/* ---- RC 3: Conquistas — revisão do módulo inteiro (não só uma margem) ----
   CAUSA do desalinhamento: cada cartão tinha a altura do próprio texto. O selo "Rara/Especial" e a etiqueta
   "Nova" ficavam por cima do conteúdo; nomes de 1 ou 2 linhas e descrições de 1 a 3 linhas faziam a medalha,
   o nome, a data e a barra de progresso começarem em alturas diferentes em cartões lado a lado. Os filtros
   eram cortados ("Em cu…", "Bloque…") em telas de 360–412 px e os contadores do topo ficavam espremidos. */
.cq-tile{display:flex;flex-direction:column;align-items:center;padding:26px 10px 12px}
.cq-tile .cq-med{flex:none;margin:0 auto 8px}
.cq-tile .cq-nome{width:100%;min-height:2.5em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;display:flex;align-items:center;justify-content:center}
.cq-tile .cq-desc{width:100%;min-height:2.7em;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.cq-tile .cq-data{margin-top:auto;padding-top:6px}
.cq-tile .cq-barra{width:100%;margin-top:auto}
.cq-tile .cq-barra + .cq-prog{margin-top:4px}
.cq-rar{top:8px;left:10px;max-width:calc(100% - 64px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cq-novo-tag{top:6px;right:8px}
.cq-resumo{gap:12px;align-items:stretch}
.cq-anel{width:80px;height:80px;flex:0 0 80px;align-self:center}
.cq-conts{gap:6px;min-width:0}
.cq-cont{min-width:0;display:flex;flex-direction:column;justify-content:center;padding:8px 4px}
.cq-cont b{font-size:15px;white-space:nowrap}.cq-cont span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cq-filtros{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.cq-filtros .filter-chip{min-width:0;padding:8px 4px!important;text-align:center;white-space:nowrap;overflow:visible!important;text-overflow:clip!important}
@media (max-width:430px){ .cq-filtros{grid-template-columns:repeat(2,minmax(0,1fr))} }
.cq-grade{align-items:stretch}
`; document.head.appendChild(s); })();

Object.assign(window, { mtVolumeEntradas, mtVolumeTreino, mtEntradasDoTreino, mtCronIniciar, mtCronPausar, mtCronRetomar, mtCronConcluir, mtCronDescartar,
  mtCargaExtraOcultar, mtCargaExtraLinha, mtRegistroInicio, mtPdfSessoesSeries });

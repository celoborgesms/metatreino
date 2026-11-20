// =====================================================================
// 61. Beta 58 — auditoria: pausas e voltas reais, importações e registro técnico,
//     mapa muscular por treino, séries no detalhe do treino
// ---------------------------------------------------------------------
//  1. Pausa / volta por MODALIDADE e só com rotina de verdade antes:
//     - mtVoltaReal(min): conquista "A Volta por Cima" (app.js chama esta função).
//     - mtVoltaNoDia(dia, min): destaque "Voltou a treinar" do calendário (parte 14).
//     - contextoAluno() ganha planFuturo, semanaInicio, pausaReal e diasSem da modalidade ativa:
//       o card do Início, os avisos do Meta Assistente (retorno_*) e o "Plano de retomada" deixam
//       de falar em pausa para conta nova, plano que ainda não começou ou registro antigo isolado.
//     A base é a MESMA da retomada de cargas (estadoTreino / estadoTreinoCorrida / _retBase, parte 10):
//     2+ dias com treino nas 6 semanas que terminaram na pausa. Nenhum sistema paralelo.
//  2. Importações: abrir a atividade nunca trava (leitura local com tempo-limite, erro visível),
//     percurso e gráfico à prova de pontos vazios; TODO registro técnico abre um detalhe e pode
//     ser removido; o registro técnico vale 30 dias (qualquer resultado).
//  3. Prevenção de duplicata depois do arquivo anual: state.impHashes guarda só a "impressão
//     digital" (hash + chave + data) das importações que saíram do histórico recente.
//  4. Mapa muscular: em "Treino de hoje" / "Exercício" só os músculos do treino respondem ao toque.
//  5. Detalhe do treino: cada série com a carga e as repetições reais (registros antigos: resumo).
// =====================================================================

// ---------- 1. pausa e volta por modalidade ----------
const MT_LOG_DIAS = 30;          // registro técnico de importações
const MT_HASH_MAX = 400;         // impressões digitais guardadas (≈ 30 bytes cada)

function _mtHistMod(mk){
  return (((state.modules[mk]||{}).history)||[]).filter(x=>x && x.at);
}
// sessões agendadas que passaram sem treino, entre "desde" (exclusive) e ontem — usa os dias do plano
function _mtAgendadasPerdidas(mk, desde){
  try{
    const m = state.modules[mk]; if(!m || !m.plan) return null;
    const dias = new Set(((m.plan.workouts)||[]).map(w=>+w.dayIdx).filter(Boolean)); if(!dias.size) return null;
    const ini = Math.max(mtDia0(desde) + DIA_MS, mtDia0(planStartTs(m) || 0)); const hoje = mtDia0();
    let n = 0; for(let t = ini; t < hoje; t += DIA_MS){ const d = new Date(t).getDay() || 7; if(dias.has(d)) n++; }
    return n;
  }catch(e){ return null; }
}
function mtPausaInfo(mk){
  mk = mk || state.active || 'lift';
  const m = state.modules[mk]; const h = _mtHistMod(mk).sort((a,b)=>a.at-b.at);
  const h0 = mtDia0();
  const ini = m ? (planStartTs(m) || 0) : 0;
  const planFuturo = !!(m && m.startAt && m.startAt > h0);
  const ult = h.length ? h[h.length-1].at : 0;
  const dias = ult ? Math.round((h0 - mtDia0(ult))/DIA_MS) : null;
  const base = ult ? _retBase(h, mtDia0(ult)) : 0;
  const perdidas = ult ? _mtAgendadasPerdidas(mk, ult) : null;
  // pausa real: havia rotina, o plano já começou e (quando há agenda) passou ao menos um treino agendado
  const real = !!(ult && !planFuturo && base >= RET.BASE_MIN && (perdidas === null || perdidas > 0));
  return { mk, ult, dias, base, perdidas, planFuturo, real, inicio: ini };
}
// a conquista: a sessão de HOJE fecha uma pausa de min+ dias na mesma modalidade, com rotina antes dela
function mtVoltaReal(minDias){
  minDias = minDias || 10;
  try{
    return ['lift','run'].some(mk=>{
      const h = _mtHistMod(mk); const dias = [...new Set(h.map(x=>mtDia0(x.at)))].sort((a,b)=>a-b);
      if(dias.length < RET.BASE_MIN + 1) return false;
      const hoje = mtDia0(); if(dias[dias.length-1] !== hoje) return false;
      const antes = dias[dias.length-2]; const gap = Math.round((hoje - antes)/DIA_MS);
      if(gap < minDias) return false;
      // a sessão que fecha a pausa precisa ser registrada agora (não um arquivo antigo importado hoje)
      const deHoje = h.filter(x=>mtDia0(x.at) === hoje);
      if(!deHoje.length) return false;
      return _retBase(h.filter(x=>x.at < hoje), antes) >= RET.BASE_MIN;
    });
  }catch(e){ return false; }
}
// destaque do calendário: no dia "ini", alguma modalidade voltou depois de min+ dias, com rotina antes?
function mtVoltaNoDia(ini, minDias){
  minDias = minDias || 7;
  for(const mk of ['lift','run']){
    const h = _mtHistMod(mk); const doDia = h.some(x=>mtDia0(x.at) === ini); if(!doDia) continue;
    const ant = h.filter(x=>x.at < ini); if(!ant.length) continue;
    const ult = Math.max(...ant.map(x=>x.at)); const dias = Math.round((ini - mtDia0(ult))/DIA_MS);
    if(dias >= minDias && _retBase(ant, mtDia0(ult)) >= RET.BASE_MIN) return { mod: mk, dias };
  }
  return null;
}
// o contexto do Início e do Meta Assistente passa a saber da modalidade e da agenda
(function(){
  const _ctx = window.contextoAluno; if(typeof _ctx !== 'function') return;
  window.contextoAluno = function(){
    const c = _ctx.apply(this, arguments);
    try{
      const P = mtPausaInfo(state.active);
      c.planFuturo = P.planFuturo;
      const m = state.modules[state.active];
      const st = m ? (m.startAt || m.createdAt || 0) : 0;
      c.semanaInicio = !!(st && st > mtDia0() - 6*DIA_MS);      // primeira semana do plano: sem cobrança de frequência
      // "dias sem treinar" da modalidade ativa (antes: a última atividade de QUALQUER modalidade)
      if(P.ult) c.diasSem = P.dias; else if(c.total) c.diasSem = null;
      c.pausaReal = P.real;
      c.pausa = P;
    }catch(e){}
    return c;
  };
})();

// ---------- 2. importações: abrir sempre, com erro visível ----------
(function(){
  const _le = window.atvLocalLe;
  if(typeof _le === 'function') window.atvLocalLe = function(id){
    // o IndexedDB pode ficar preso (aba antiga aberta, modo privado do Safari): nunca segura a tela por mais de 2,5 s
    return Promise.race([ _le.apply(this, arguments), new Promise(ok=>setTimeout(()=>ok(null), 2500)) ]);
  };
  const _apaga = window.atvLocalApaga;
  if(typeof _apaga === 'function') window.atvLocalApaga = function(id){
    try{ if(id && Array.isArray(state.impHashes)) state.impHashes = state.impHashes.filter(h=>h.id !== id); }catch(e){}
    return Promise.race([ _apaga.apply(this, arguments), new Promise(ok=>setTimeout(ok, 2500)) ]);
  };
  const _perc = window.atvPercursoSVG;
  if(typeof _perc === 'function') window.atvPercursoSVG = function(tr){
    try{
      const ok = (tr||[]).filter(p=>Array.isArray(p) && isFinite(+p[0]) && isFinite(+p[1]) && !(+p[0] === 0 && +p[1] === 0));
      return ok.length >= 2 ? _perc.call(this, ok) : '';
    }catch(e){ console.log('percurso:', e); return ''; }
  };
  const _graf = window.atvGraficoSerie;
  if(typeof _graf === 'function') window.atvGraficoSerie = function(I){
    try{
      const s = ((I && I.serie)||[]).filter(p=>Array.isArray(p) && isFinite(+p[0]));
      return s.length > 3 ? _graf.call(this, Object.assign({}, I, { serie:s })) : '';
    }catch(e){ console.log('gráfico da atividade:', e); return ''; }
  };
  const _abre = window.openAtividade;
  if(typeof _abre === 'function') window.openAtividade = async function(mk, idx){
    const x = (((state.modules[mk]||{}).history)||[])[idx];
    if(!x || !x.imp){ toast('Esta atividade não está mais no histórico recente.'); try{ openIntegracoes(); }catch(e){} return; }
    try{ return await _abre.apply(this, arguments); }
    catch(e){
      console.log('openAtividade:', e);
      // mostra o essencial e deixa excluir — nunca um toque "morto"
      const mi = $('modal-inner');
      mi.innerHTML = `<div id="integ-det"><h3>${mtEsc(String(x.name||'Atividade').replace(/^[^\wÀ-ú]+/,''))}</h3>
        <p class="integ-mini">${new Date(x.at).toLocaleString('pt-BR')} · Importado de arquivo ${mtEsc(String(x.imp.fmt||'').toUpperCase())}</p>
        <p class="ip-aviso">Não foi possível montar todos os detalhes desta atividade (${mtEsc(String(e && e.message || e).slice(0,80))}). Os números dela continuam no histórico.</p>
        <button class="btn btn-block" style="margin-top:8px;background:var(--tint-danger);color:var(--danger-soft);border:1px solid rgba(244,63,94,0.3)" onclick="atvExcluir('${mk}',${idx})">🗑️ Excluir atividade e dados importados</button>
        <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openIntegracoes()">‹ Integrações e atividades</button></div>`;
      $('modal-back').classList.add('on');
    }
  };
})();

// ---------- 2b. registro técnico: 30 dias, todo item abre e pode ser removido ----------
function mtLogPoda(){
  const L = state.importLog; if(!Array.isArray(L) || !L.length) return false;
  const corte = Date.now() - MT_LOG_DIAS*DIA_MS;
  const novo = L.filter(l=>l && l.em && l.em >= corte).slice(-30);
  if(novo.length === L.length) return false;
  state.importLog = novo; return true;
}
(function(){
  const _log = window._atvLog;
  if(typeof _log === 'function') window._atvLog = function(){ const r = _log.apply(this, arguments); try{ mtLogPoda(); }catch(e){} return r; };
})();
function _mtLogAtv(l){ return l && l.id ? atvTodas().find(({x})=>x.imp && x.imp.id === l.id) : null; }
function _mtLogStatus(l){
  if(l.ok && _mtLogAtv(l)) return { cls:'ok', t:'Importada' };
  if(l.ok && /complement/i.test(l.res||'')) return { cls:'ok', t:'Complementou um registro' };
  if(l.ok && l.id && (state.impHashes||[]).some(h=>h.id === l.id)) return { cls:'ok', t:'No Histórico completo' };
  if(l.ok && l.id) return { cls:'mute', t:'Atividade excluída' };
  if(/cancel/i.test(l.res||'')) return { cls:'mute', t:'Cancelada' };
  if(/já importada/i.test(l.res||'')) return { cls:'mute', t:'Duplicata evitada' };
  return { cls:'erro', t:'Não importada' };
}
function mtLogLista(){
  const box = document.querySelector('#integ-tela .mt-log'); if(!box) return;
  const L = (state.importLog||[]).slice().reverse();
  if(!L.length){ box.remove(); return; }
  box.querySelector('.mt-log-l').innerHTML = L.map(l=>{ const s = _mtLogStatus(l);
    return `<button type="button" class="integ-log integ-log-btn mt-lg-${s.cls}" onclick="mtLogVer(${+l.em})"><span class="ii-tx"><b>${mtEsc(l.arq)}</b><small><i class="mt-lg-st">${s.t}</i> · ${new Date(l.em).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</small></span><span class="ii-seta">›</span></button>`; }).join('');
}
function mtLogVer(em){
  const l = (state.importLog||[]).find(x=>+x.em === +em); if(!l){ toast('Registro não encontrado.'); return openIntegracoes(); }
  const a = _mtLogAtv(l); const s = _mtLogStatus(l);
  const mi = $('modal-inner');
  mi.innerHTML = `<div id="integ-logdet"><h3>Registro de importação</h3>
    <div class="ip-orig mt-lgd">${[['Arquivo', mtEsc(l.arq)], ['Quando', new Date(l.em).toLocaleString('pt-BR')], ['Situação', s.t], ['Resultado', mtEsc(l.res||'—')]].map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>
    <p class="integ-mini">Este é só o registro técnico do envio do arquivo. Ele some sozinho depois de ${MT_LOG_DIAS} dias. Remover o registro <b>não</b> apaga a atividade${a ? ' — para isso, abra a atividade e use “Excluir”' : ''}.</p>
    ${a ? `<button class="btn btn-primary btn-block" style="margin-top:10px" onclick="openAtividade('${a.mk}',${a.idx})">Abrir a atividade</button>` : ''}
    ${!a && s.t === 'No Histórico completo' && typeof arqAbrirHistorico === 'function' ? `<button class="btn btn-outline btn-block" style="margin-top:10px" onclick="arqAbrirHistorico()">Ver no Histórico completo</button>` : ''}
    <button class="btn btn-outline btn-block" style="margin-top:8px" onclick="mtLogRemover(${+l.em})">Remover este registro</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openIntegracoes()">‹ Integrações e atividades</button></div>`;
  $('modal-back').classList.add('on');
}
function mtLogRemover(em){
  state.importLog = (state.importLog||[]).filter(x=>+x.em !== +em);
  saveData(); toast('Registro removido'); openIntegracoes();
}
function mtLogLimpar(){
  appConfirm('Remove todos os registros técnicos de envio de arquivos. As atividades importadas continuam no histórico.', ()=>{
    state.importLog = []; saveData(); toast('Registros removidos'); openIntegracoes();
  }, { title:'Limpar registros?', okLabel:'Limpar' });
}
mtGancho('openIntegracoes', { antes(){ try{ if(mtLogPoda()) saveData(); }catch(e){} }, depois(){
  try{
    const tela = $('integ-tela'); if(!tela) return;
    // a seção antiga (itens sem atividade eram <div> sem toque) vira a lista nova
    const velho = [...tela.querySelectorAll('details.integ-sec')].find(d=>/Histórico técnico/.test((d.querySelector('summary')||{}).textContent||''));
    if(velho){
      velho.classList.add('mt-log'); velho.innerHTML = `<summary>Registro técnico de importações</summary>
        <p class="integ-mini">Cada arquivo enviado e o resultado, dos últimos ${MT_LOG_DIAS} dias. Toque para ver o detalhe ou remover.</p>
        <div class="mt-log-l"></div><button type="button" class="integ-manual mt-log-limpa" onclick="mtLogLimpar()">Limpar registros</button>`;
      mtLogLista();
    }
    // "atividades no Histórico completo": conta pela impressão digital (não depende do registro técnico, que vale 30 dias)
    const aviso = [...tela.querySelectorAll('p.integ-mini')].find(p=>/📦/.test(p.textContent));
    const ids = new Set(atvTodas().filter(({x})=>x.imp).map(({x})=>x.imp.id));
    const arq = (state.impHashes||[]).filter(h=>h.id && !ids.has(h.id)).length;
    const html = arq ? `📦 ${arq === 1 ? '1 atividade importada tem' : arq + ' atividades importadas têm'} mais de ${HISTORY_RETENTION_DAYS} dias e ${arq === 1 ? 'está' : 'estão'} no <a href="#" onclick="arqAbrirHistorico();return false">Histórico completo</a>.` : '';
    if(aviso){ if(html) aviso.innerHTML = html; else aviso.remove(); }
    else if(html){ const lbl = [...tela.querySelectorAll('.section-lbl')].find(d=>/Atividades importadas/.test(d.textContent)); const lst = lbl && lbl.nextElementSibling;
      (lst || lbl) && (lst || lbl).insertAdjacentHTML('afterend', `<p class="integ-mini">${html}</p>`); }
  }catch(e){ console.log('registro técnico:', e); }
} });

// ---------- 3. duplicata depois do arquivo anual ----------
function _mtGuardaHashes(antesDe){
  try{
    const L = Array.isArray(state.impHashes) ? state.impHashes : []; const tem = new Set(L.map(h=>h.h));
    let mudou = false;
    atvTodas().forEach(({x})=>{ const I = x.imp; if(!I || !I.hash || tem.has(I.hash) || x.at >= antesDe) return;
      L.push({ h:I.hash, c:I.chave || null, at:x.at, id:I.id || null, e:I.esporte || null }); tem.add(I.hash); mudou = true; });
    if(mudou){ L.sort((a,b)=>b.at-a.at); state.impHashes = L.slice(0, MT_HASH_MAX); }
    return mudou;
  }catch(e){ return false; }
}
// antes da limpeza de 90 dias: o que vai para o arquivo anual deixa a impressão digital
mtGancho('cleanupOldHistory', { antes(){ _mtGuardaHashes(Date.now() - (HISTORY_RETENTION_DAYS - 5)*DIA_MS); } });
(function(){
  const _dup = window.atvDuplicata;
  if(typeof _dup === 'function') window.atvDuplicata = function(A, hash){
    const r = _dup.apply(this, arguments); if(r) return r;
    try{
      const ch = _atvChave(A);
      const h = (state.impHashes||[]).find(x=>x.h === hash || (x.c && x.c === ch));
      if(h) return { tipo:'importada', arquivada:true, alvo:{ x:{ at:h.at } } };
    }catch(e){}
    return null;
  };
})();
mtGancho('atvPrevia', { depois(){
  try{
    const R = _atvAtual; if(!R || !R.dup || !R.dup.arquivada) return;
    const d = document.querySelector('#integ-previa .ip-dup'); if(!d) return;
    d.innerHTML = `⚠️ <b>Esta atividade já foi importada</b> (${new Date(R.dup.alvo.x.at).toLocaleDateString('pt-BR')}) e está no Histórico completo. Importar de novo contaria em dobro.
      <button type="button" class="integ-manual" style="margin-top:6px" onclick="mtImportarMesmoAssim()">Excluí essa atividade antes — <b>importar mesmo assim</b> ›</button>`;
  }catch(e){}
} });
function mtImportarMesmoAssim(){ const R = _atvAtual; if(!R) return; R.dup = null; R.forcado = true; atvPrevia(); }

// ---------- arrumação na abertura (uma vez por sessão; grava só se algo mudou) ----------
let _mt58Arrumou = false;
mtGancho('renderHome', { depois(){
  if(_mt58Arrumou || !state || !state.user) return; _mt58Arrumou = true;
  try{
    let mudou = mtLogPoda();
    // marcas de "destaque removido" do calendário (dado técnico, ~20 bytes cada): só o último ano.
    // As anotações escritas pelo aluno (dayNotes) NÃO são tocadas.
    const O = state.dayNotesOcultas; const corte = Date.now() - 365*DIA_MS;
    if(O) Object.keys(O).forEach(k=>{ if(+k && +k < corte){ delete O[k]; mudou = true; } });
    if(mudou) saveData();
  }catch(e){}
} });

// ---------- 4. mapa muscular: no treino, só os músculos do treino respondem ----------
function _mmRestrito(){ return _mm && (_mm.modo === 'hoje' || _mm.modo === 'ex'); }
(function(){
  const _sel = window.mmSel;
  if(typeof _sel === 'function') window.mmSel = function(k){
    try{
      if(k && _mmRestrito() && !_mmPapeis()[k]){
        toast(`${(MM_INFO[k]||{}).nome || 'Este músculo'} não é trabalhado ${_mm.modo === 'ex' ? 'neste exercício' : 'no treino de hoje'}. Para ver todos, use “Explorar”.`);
        return;
      }
    }catch(e){}
    return _sel.apply(this, arguments);
  };
})();
mtGancho('mmPintar', { depois(){
  try{
    const palco = $('mm-palco'); if(!palco) return; const r = _mmRestrito(); const P = r ? _mmPapeis() : {};
    palco.classList.toggle('mm-restrito', r);
    palco.querySelectorAll('.mm-m').forEach(el=>{ const off = r && !P[el.dataset.m]; el.classList.toggle('mm-off', off); el.setAttribute('aria-disabled', off ? 'true' : 'false'); });
    const leg = $('mm-leg'); if(leg && r && !leg.querySelector('.mm-dica-off')) leg.insertAdjacentHTML('beforeend', '<span class="mm-mute mm-dica-off">Os demais ficam apagados: toque em “Explorar” para ver o corpo inteiro.</span>');
  }catch(e){}
} });

// ---------- 5. detalhe do treino: série por série ----------
const _fmtKg = v=>String(+v||0).replace('.',',');
mtGancho('openHistoryEntry', { depois(idx){
  try{
    if(state.active !== 'lift') return;
    const x = (((state.modules.lift||{}).history)||[])[idx]; if(!x || x.imp || !(x.exercisesDone||[]).length) return;
    const mi = $('modal-inner');
    const linhas = [...mi.querySelectorAll('.card > div > div')].filter(d=>{ const b = d.querySelector('b.mono'); return b && /×/.test(b.textContent); });
    if(linhas.length !== x.exercisesDone.length) return;
    const dia = mtDia0(x.at);
    linhas.forEach((ln, i)=>{
      const e = x.exercisesDone[i];
      const reg = ((state.progress||{})[e.id]||[]).find(p=>p && p.date && mtDia0(p.date) === dia && (p.sets||[]).length);
      const iso = (typeof exUsaTempo === 'function') && exUsaTempo(e.id);
      const series = reg ? reg.sets.map((s,j)=>`<span class="hd-s"><i>${j+1}</i>${+s.peso > 0 ? `${_fmtKg(s.peso)} kg × ${+s.reps||0}` : `${+s.reps||0} ${iso ? 's' : 'rep.'}`}</span>`).join('')
        : `<span class="hd-s">${e.sets}× · ${mtEsc(e.best||'')}</span>`;
      const vol = reg ? reg.sets.reduce((t,s)=>t + (+s.peso||0)*(+s.reps||0), 0) : 0;
      ln.outerHTML = `<div class="hd-ex"><div class="hd-n">${mtEsc(e.name)}${vol ? `<small>${Math.round(vol).toLocaleString('pt-BR')} kg de volume</small>` : ''}</div><div class="hd-ss">${series}</div></div>`;
    });
  }catch(e){ console.log('detalhe por série:', e); }
} });

// ---------- 6. Treinos: ações do exercício alinhadas (sem 3 linhas de botões em telas pequenas) ----------
function mtExAcoes(){
  try{
    document.querySelectorAll('#scr-sessions .ex .row').forEach(r=>{
      if(r.classList.contains('ex-acoes') || !r.querySelector('button')) return;
      r.classList.add('ex-acoes');
      r.querySelectorAll('button').forEach(b=>{
        if(/^▶ Ver como fazer$/.test(b.textContent.trim())) b.textContent = '▶ Como fazer';
        if(!b.classList.contains('btn-primary') && !/Editar séries|Voltar à sugestão/.test(b.textContent)) b.classList.add('ex-sec');
      });
    });
  }catch(e){}
}
mtGancho('renderSessions', { depois(){ mtExAcoes(); } });
mtGancho('selectSession', { depois(){ mtExAcoes(); } });
mtGancho('goTab', { depois(t){ if(t === 'sessions') mtExAcoes(); } });

// ---------- CSS ----------
(function(){ if(document.getElementById('b58-css')) return; const s = document.createElement('style'); s.id = 'b58-css';
  s.textContent = `
/* mapa muscular: músculos fora do treino apagados */
.mm-palco.mm-restrito .mm-m.mm-off{ fill-opacity:.18 !important; stroke-opacity:.35; filter:grayscale(1); cursor:not-allowed; }
.mm-dica-off{ flex-basis:100%; }
/* detalhe do treino: série por série, sem quebra feia */
.hd-ex{ padding:8px 0; border-top:1px solid var(--border); }
.hd-ex:first-child{ border-top:0; }
.hd-n{ font-size:13.5px; font-weight:700; color:var(--text); line-height:1.3; overflow-wrap:anywhere; }
.hd-n small{ display:block; font-weight:500; font-size:11.5px; color:var(--text-dim); margin-top:1px; }
.hd-ss{ display:flex; flex-wrap:wrap; gap:5px; margin-top:6px; }
.hd-s{ display:inline-flex; align-items:center; gap:5px; font:600 12px/1 var(--mono, ui-monospace, monospace); padding:5px 8px; border-radius:8px; background:var(--tint-primary); color:var(--primary-2); white-space:nowrap; }
.hd-s i{ font-style:normal; font-size:10.5px; opacity:.7; }
/* registro técnico */
.mt-log .integ-log-btn{ display:flex; align-items:center; gap:8px; width:100%; text-align:left; }
.mt-log .ii-tx{ flex:1; min-width:0; }
.mt-log .ii-tx b{ display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mt-lg-st{ font-style:normal; font-weight:700; }
.mt-lg-ok .mt-lg-st{ color:var(--success, #22c55e); } .mt-lg-erro .mt-lg-st{ color:var(--danger-soft, #f87171); } .mt-lg-mute .mt-lg-st{ color:var(--text-dim); }
.mt-log-limpa{ margin-top:6px; }
.mt-lgd{ display:grid; gap:8px; margin:8px 0; }
.mt-lgd div{ display:flex; flex-direction:column; gap:2px; }
.mt-lgd small{ color:var(--text-dim); font-size:11.5px; } .mt-lgd b{ font-size:13.5px; overflow-wrap:anywhere; }
/* calendário: conquistas e "ver mais" recolhidos */
.dn-conq, .dn-mais{ margin-top:6px; border:1px solid var(--border); border-radius:10px; padding:2px 10px; }
.dn-conq summary, .dn-mais summary{ cursor:pointer; font-size:12.5px; font-weight:700; color:var(--text-dim); padding:8px 0; list-style:none; }
.dn-conq summary::-webkit-details-marker, .dn-mais summary::-webkit-details-marker{ display:none; }
.dn-conq summary::after, .dn-mais summary::after{ content:'›'; float:right; transition:transform .2s; }
.dn-conq[open] summary::after, .dn-mais[open] summary::after{ transform:rotate(90deg); }
/* Treinos: atalhos do topo numa linha (ícone em cima, rótulo embaixo) */
#sess-qlinks{ display:grid !important; grid-auto-flow:column; grid-auto-columns:minmax(0,1fr); gap:8px; }
#sess-qlinks .qlink{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; text-align:center; min-width:0; padding:10px 6px; line-height:1.2; white-space:normal; margin:0; }
/* ações do exercício: o principal ocupa a linha, os secundários dividem a de baixo por igual */
.ex .ex-acoes{ display:flex !important; flex-wrap:wrap; gap:6px; }
.ex .ex-acoes > :not(.ex-sec){ flex:1 1 100%; }
.ex .ex-acoes > .ex-sec{ flex:1 1 0; }
.ex .ex-acoes .btn{ min-width:0; padding:8px 6px !important; font-size:12.5px !important; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; justify-content:center; text-align:center; }
.ex .ex-desc{ overflow-wrap:anywhere; }
@media (max-width:374px){
  .ex .ex-acoes{ gap:4px; }
  .ex .ex-acoes .ex-sec{ font-size:11.5px !important; padding:8px 1px !important; letter-spacing:-.01em; }
  .ex .ex-acoes:has(.ex-sec ~ .ex-sec ~ .ex-sec) .ex-sec .ico{ display:none; }
}
/* registro de atividade: atalho do relógio em duas linhas organizadas (antes quebrava no meio da frase) */
.integ-atalho{ line-height:1.35; }
.integ-atalho b{ display:block; color:var(--text); margin-top:1px; }
/* conquistas: os 4 filtros numa linha */
.cq-filtros{ display:grid !important; grid-template-columns:repeat(4, minmax(0,1fr)); gap:6px; overflow:visible !important; }
.cq-filtros .filter-chip{ min-width:0; padding-left:4px; padding-right:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:center; }
`;
  document.head.appendChild(s); })();

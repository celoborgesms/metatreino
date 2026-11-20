
// =====================================================================
// 54. Beta 51 — Progresso › Desempenho organizado e personalizável
// =====================================================================
// • Cada bloco do Desempenho tem lugar fixo pela ordem (CSS "order"), não pela hora em que foi desenhado.
//   Antes, o cartão "Anatomia muscular" aparecia em cima e depois "descia" quando perfReorganiza (parte 19)
//   movia evolução, calendário e recordes no HTML.
// • A tela segue a modalidade ativa, como o Início: na musculação não aparecem "Evolução da corrida",
//   recordes de corrida nem o gráfico de km; na corrida não aparecem anatomia nem recordes de carga.
//   Com as duas modalidades, um seletor Musculação | Corrida no topo troca na hora.
//   Calendário e "Distribuição das atividades" continuam mostrando as duas (são o resumo do conjunto).
// • "Personalizar progresso" no rodapé, no mesmo estilo do Início:
//   Básico → "Completo" ou "Só o essencial"; Premium → bloco por bloco, arrastar para mudar a ordem e
//   "Voltar ao padrão". Usa o mesmo recurso Premium do Início (inicioCompleto). Salvo na conta.

const PERF_BLOCOS = [
  { k:'resumo',       nome:'Resumo dos últimos 7 dias', desc:'treinos, volume, recordes e sequência', sel:['#perf-resumo'] },
  { k:'anatomia',     nome:'Mapa muscular',             desc:'só na musculação', mod:'lift', sel:['#mm-entrada'] },
  { k:'evolucao',     nome:'Evolução',                  desc:'gráficos de frequência, tempo, peso e volume', sel:['#perf-evo'] },
  { k:'corrida',      nome:'Evolução da corrida',       desc:'só na corrida', mod:'run', sel:['#perf-run-card'] },
  { k:'calistenia',   nome:'Calistenia',                desc:'se você usa', sel:['#perf-cali'] },
  { k:'calendario',   nome:'Calendário',                desc:'dias treinados no mês', sel:['[data-pb="calendario"]'] },
  { k:'recordes',     nome:'Seus recordes',             desc:'da modalidade ativa', sel:['#card-records'] },
  { k:'metas',        nome:'Metas',                     desc:'semana, mês e sequência', sel:['[data-pb="metas"]'] },
  { k:'constancia',   nome:'Constância',                desc:'treinos por semana', sel:['[data-pb="constancia"]'] },
  { k:'distribuicao', nome:'Distribuição das atividades', desc:'musculação × corrida nos 7 dias', sel:['[data-pb="distribuicao"]'] }
];
const PERF_PADRAO = PERF_BLOCOS.map(b=>b.k);
const PERF_ESSENCIAL = ['resumo','evolucao','corrida','recordes','metas'];

// Beta 59: a personalização é POR MODALIDADE (antes, mudar o Progresso da corrida mudava o da musculação).
// Quem já tinha personalizado: a escolha antiga vira o ponto de partida das duas (nada se perde).
function _pfMod(){ return state && state.active === 'run' ? 'run' : 'lift'; }
function _pfCfg(mk){
  mk = mk || _pfMod();
  if(!state.progressoMod || typeof state.progressoMod !== 'object') state.progressoMod = {};
  if(!state.progressoMod[mk]){
    const leg = { ocultos: Array.isArray(state.progressoOcultos) ? state.progressoOcultos.slice() : [], ordem: Array.isArray(state.progressoOrdem) ? state.progressoOrdem.slice() : null, basico: state.progressoBasico || null };
    state.progressoMod[mk] = leg;
  }
  return state.progressoMod[mk];
}
function _pfNomeMod(){ return _pfMod() === 'run' ? 'Corrida' : 'Musculação'; }
function _pfBlocosMod(){ const mk = _pfMod(); return PERF_BLOCOS.filter(b=>!b.mod || b.mod === mk).map(b=>b.k); }
function _pfPremium(){ try{ return !_planoConhecido() || mtTem('inicioCompleto'); }catch(e){ return true; } }
function perfOcultos(){
  if(!state) return [];
  if(!_pfPremium()) return _pfCfg().basico === 'essencial' ? PERF_PADRAO.filter(k=>!PERF_ESSENCIAL.includes(k)) : [];
  return Array.isArray(_pfCfg().ocultos) ? _pfCfg().ocultos.filter(k=>PERF_PADRAO.includes(k)) : [];
}
function perfOrdem(){
  const o = (_pfPremium() && Array.isArray(_pfCfg().ordem)) ? _pfCfg().ordem.filter(k=>PERF_PADRAO.includes(k)) : [];
  PERF_PADRAO.forEach(k=>{ if(!o.includes(k)) o.push(k); });
  return o;
}
// marca os cartões sem id pelo título e os blocos fixos do topo
function _pfMarca(){
  const wrap = document.querySelector('#scr-perf .wrap'); if(!wrap) return;
  let topo = true;
  [...wrap.children].forEach(c=>{
    if(c.id === 'perf-resumo') topo = false;
    if(c.dataset.pb || c.id === 'perf-personalizar' || c.id === 'perf-mod') return;
    const t = (c.querySelector('.chart-title, .section-lbl, h3, h4') || c).textContent.trim();
    if(c.classList.contains('cal-card') || c.querySelector('#calendar')) c.dataset.pb = 'calendario';
    else if(/^Metas/.test(t)) c.dataset.pb = 'metas';
    else if(/^Constância/.test(t)) c.dataset.pb = 'constancia';
    else if(/^Distribuição/.test(t)) c.dataset.pb = 'distribuicao';
    else if(topo) c.dataset.pbTopo = '1';
  });
  // recordes: cada linha é da musculação ou da corrida
  document.querySelectorAll('#card-records .rec-row').forEach(r=>{
    if(r.dataset.pbMod) return;
    const t = r.textContent.toLowerCase();
    r.dataset.pbMod = (/\/km|\bkm\b|distância|ritmo|corrida|maratona|\b5k\b|\b10k\b|\b21k\b|pace/.test(t)) ? 'run' : 'lift';
  });
}
function perfAplica(){
  _pfMarca();
  const scr = $('scr-perf'); if(!scr) return;
  const ativo = state.active === 'run' ? 'run' : 'lift';
  scr.dataset.pfMod = ativo;
  let st = $('perf-css'); if(!st){ st = document.createElement('style'); st.id = 'perf-css'; document.head.appendChild(st); }
  const oc = perfOcultos(); const ordem = perfOrdem(); const regras = [];
  ordem.forEach((k, i)=>{ const b = PERF_BLOCOS.find(x=>x.k===k); regras.push(b.sel.map(s=>'#scr-perf .wrap > ' + s).join(',') + `{order:${10 + i*2}}`); });
  const esconde = PERF_BLOCOS.filter(b=>oc.includes(b.k) || (b.mod && b.mod !== ativo)).flatMap(b=>b.sel.map(s=>'#scr-perf .wrap > ' + s));
  if(esconde.length) regras.push(esconde.join(',') + '{display:none!important}');
  st.textContent = regras.join('\n');
  // recordes da outra modalidade escondidos; aviso quando não sobra nenhum
  const rec = $('card-records');
  if(rec){
    const linhas = [...rec.querySelectorAll('.rec-row')]; const vis = linhas.filter(r=>r.dataset.pbMod === ativo);
    let v = rec.querySelector('.pf-rec-vazio');
    if(linhas.length && !vis.length){ if(!v){ v = document.createElement('div'); v.className = 'pf-rec-vazio'; (rec.querySelector('#records-list') || rec).appendChild(v); } const tx = ativo === 'run' ? 'Nenhum recorde de corrida ainda.' : 'Nenhum recorde de musculação ainda. Registre suas séries para começar.'; if(v.textContent !== tx) v.textContent = tx; }
    else if(v) v.remove();
  }
  // gráfico de evolução: sem as métricas da outra modalidade
  const evo = $('perf-evo');
  if(evo) evo.querySelectorAll('button, .chip, .seg').forEach(b=>{
    const t = (b.textContent || '').trim();
    const run = /^(Corrida|Ritmo|Km|Distância|Caminhada|Bike|Pedal)/i.test(t), lift = /musculação/i.test(t);   // Beta 55: cardio também
    b.classList.toggle('pf-outra', (ativo === 'lift' && run) || (ativo === 'run' && lift));
  });
  // seletor de modalidade (só com as duas)
  const wrap = scr.querySelector('.wrap'); if(!wrap) return;
  // Beta 55: sem seletor aqui — a modalidade é a do Início/Perfil (o subtítulo diz qual; parte 58)
  const ambas = false;
  let m = $('perf-mod');
  if(ambas){
    const html = `<button type="button" class="${ativo==='lift'?'on':''}" aria-pressed="${ativo==='lift'}" onclick="perfModulo('lift')">Musculação</button><button type="button" class="${ativo==='run'?'on':''}" aria-pressed="${ativo==='run'}" onclick="perfModulo('run')">Corrida</button>`;
    if(!m){ m = document.createElement('div'); m.id = 'perf-mod'; m.className = 'pf-mod'; m.setAttribute('role', 'group'); m.setAttribute('aria-label', 'Modalidade'); const res = $('perf-resumo'); if(res) res.before(m); else wrap.prepend(m); }
    if(m.dataset.h !== html){ m.innerHTML = html; m.dataset.h = html; }
  } else if(m) m.remove();
  // rodapé: personalizar
  let a = $('perf-personalizar');
  if(!a){ a = document.createElement('div'); a.id = 'perf-personalizar'; wrap.appendChild(a); }
  const n = PERF_BLOCOS.filter(b=>oc.includes(b.k)).length;
  const html = `<a href="#" onclick="openPersonalizarProgresso();return false">⚙️ Personalizar progresso</a>${n ? ` · ${n} ${n===1?'bloco oculto':'blocos ocultos'}` : ''}`;
  if(a.innerHTML !== html) a.innerHTML = html;
}
function perfModulo(to){
  if(state.active === to) return;
  state.active = to; saveData();
  try{ goTab('perf'); }catch(e){ perfAplica(); }
}
// a tela é redesenhada por partes (gráficos, calendário, recordes): uma observação leve mantém a ordem e as marcas
let _pfObs = null, _pfRaf = 0;
function _pfObserva(){
  const wrap = document.querySelector('#scr-perf .wrap'); if(!wrap || _pfObs) return;
  _pfObs = new MutationObserver(()=>{ if(_pfRaf) return; _pfRaf = requestAnimationFrame(()=>{ _pfRaf = 0; try{ perfAplica(); }catch(e){} }); });
  _pfObs.observe(wrap, { childList:true });
  const rec = $('card-records'); if(rec) _pfObs.observe(rec, { childList:true, subtree:true });
}
mtGancho('renderPerf', { depois(){ try{ perfAplica(); _pfObserva(); }catch(e){ console.log('progresso', e); } } });
mtGancho('goTab', { depois(t){ if(t === 'perf') try{ perfAplica(); _pfObserva(); }catch(e){} } });
mtGancho('renderRecords', { depois(){ try{ perfAplica(); }catch(e){} } });

// ---------- janela "Personalizar progresso" ----------
function openPersonalizarProgresso(){
  const mi = $('modal-inner'); mi.classList.remove('modal-video','modal-ex');
  if(!_pfPremium()){
    const ess = _pfCfg().basico === 'essencial';
    mi.innerHTML = `<h3>📊 Personalizar progresso · ${_pfNomeMod()}</h3>
      <p class="mt-muted" style="margin:0 0 10px;font-size:12.5px;line-height:1.5">Escolha como o Desempenho da <b>${_pfNomeMod().toLowerCase()}</b> aparece. A outra modalidade tem a própria escolha. Fica salvo na sua conta.</p>
      <div class="pl-opcoes">
        <button type="button" class="pl-op ${!ess?'on':''}" onclick="pfBasico('completo')"><b>Completo</b><small>todos os blocos</small></button>
        <button type="button" class="pl-op ${ess?'on':''}" onclick="pfBasico('essencial')"><b>Só o essencial</b><small>resumo, evolução, recordes e metas</small></button>
      </div>
      <div class="pl-bloqueio pl-bloqueio-sm"><div class="pl-selo">${PL_EST}Premium</div><span>Escolher bloco por bloco, esconder e mostrar seções e arrastar para mudar a ordem.</span>
        <button class="btn btn-ghost" onclick="mtPremiumAviso('inicioCompleto')">Ver o Premium</button></div>
      <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal();goTab('perf')">Pronto</button>`;
    $('modal-back').classList.add('on'); return;
  }
  const oc = perfOcultos();
  const linha = k=>{ const b = PERF_BLOCOS.find(x=>x.k===k); return `<label class="pi-row" data-ordem="${b.k}">${PI_ALCA}<span class="pi-txt"><b>${b.nome}</b>${b.desc?`<small>${b.desc}</small>`:''}</span>
      <input type="checkbox" class="pi-sw" data-k="${b.k}" ${oc.includes(b.k)?'':'checked'} onchange="pfAlterar(this)"></label>`; };
  mi.innerHTML = `<h3>📊 Personalizar progresso · ${_pfNomeMod()}</h3>
    <p class="mt-muted" style="margin:0 0 10px;font-size:12.5px;line-height:1.5">Escolha o que aparece no Desempenho da <b>${_pfNomeMod().toLowerCase()}</b> e em que ordem. A outra modalidade tem a própria escolha. Fica salvo na sua conta.</p>
    <div class="pi-presets"><button type="button" onclick="pfPreset('completo')">Tudo</button><button type="button" onclick="pfPreset('essencial')">Só o essencial</button></div>
    <div class="pi-dica-ordem">Arraste pela alça <b>⠿</b> para mudar a ordem.</div>
    <div class="card pi-lista" id="perf-lista" data-grupo="perf">${perfOrdem().filter(k=>_pfBlocosMod().includes(k)).map(linha).join('')}</div>
    <button type="button" class="btn btn-ghost btn-block" style="margin-top:12px" onclick="pfPadrao()">Voltar ao padrão</button>
    <button class="btn btn-primary btn-block" style="margin-top:8px" onclick="closeModal();goTab('perf')">Pronto</button>`;
  $('modal-back').classList.add('on');
  try{ _piArrasto($('perf-lista')); }catch(e){}
}
// as alças reaproveitam o arrasto do Início (parte 28); aqui só muda onde a ordem é salva
const _piSalvaOrdemB51 = window._piSalvaOrdem;
window._piSalvaOrdem = function(lista){
  if(lista && lista.dataset.grupo === 'perf'){
    const vis = [...lista.querySelectorAll('[data-ordem]')].map(r=>r.dataset.ordem);
    _pfCfg().ordem = vis.concat(PERF_PADRAO.filter(k=>!vis.includes(k))); saveData(); perfAplica(); return;
  }
  return _piSalvaOrdemB51.apply(this, arguments);
};
function pfAlterar(el){
  if(!_pfPremium()) return mtPremiumAviso('inicioCompleto');
  const k = el.dataset.k; let oc = perfOcultos();
  oc = el.checked ? oc.filter(x=>x!==k) : [...new Set([...oc, k])];
  _pfCfg().ocultos = oc; saveData(); perfAplica();
}
function pfPreset(p){
  if(!_pfPremium()) return mtPremiumAviso('inicioCompleto');
  _pfCfg().ocultos = p === 'essencial' ? PERF_PADRAO.filter(k=>!PERF_ESSENCIAL.includes(k)) : [];
  saveData(); perfAplica();
  document.querySelectorAll('#perf-lista .pi-sw').forEach(i=>{ i.checked = !_pfCfg().ocultos.includes(i.dataset.k); });
  toast(p === 'essencial' ? '📊 Só o essencial no Progresso' : '📊 Progresso completo');
}
function pfBasico(k){ _pfCfg().basico = k === 'essencial' ? 'essencial' : 'completo'; saveData(); perfAplica(); openPersonalizarProgresso(); }
function pfPadrao(){
  appConfirm('O Desempenho volta para a ordem original, com todos os blocos visíveis.', ()=>{
    _pfCfg().ordem = null; _pfCfg().ocultos = []; saveData(); perfAplica(); openPersonalizarProgresso(); toast('Progresso no padrão');
  }, { title:'Voltar ao padrão?', okLabel:'Voltar ao padrão' });
}

(function(){ if(document.getElementById('pf-css-base')) return; const s = document.createElement('style'); s.id = 'pf-css-base';
  s.textContent = `
html:not(.mt-desk) #scr-perf .wrap{display:flex;flex-direction:column}
#scr-perf .wrap > *{order:500}
#scr-perf .wrap > .seg-nav{order:-40}
#scr-perf .wrap > [data-pb-topo]{order:-30}
#scr-perf .wrap > #perf-empty{order:-20}
#scr-perf .wrap > #perf-mod{order:-10;margin:14px 0 12px;position:relative;z-index:1}
.pf-mod{display:flex;gap:4px;padding:4px;border-radius:14px;background:var(--surface-2);border:1px solid var(--border)}
.pf-mod button{flex:1;border:0;background:transparent;color:var(--text-dim);font:inherit;font-size:13px;font-weight:700;padding:7px 6px;border-radius:10px;cursor:pointer}
.pf-mod button.on{background:var(--bg-2);color:var(--text-strong);box-shadow:var(--shadow-sm)}
#scr-perf .wrap > #perf-personalizar{order:999;text-align:center;font-size:11.5px;color:var(--text-mute);margin:6px 0 4px}
#perf-personalizar a{color:var(--text-dim);font-weight:600;text-decoration:none;border-bottom:1px dotted var(--text-mute)}
#scr-perf[data-pf-mod="lift"] #card-records .rec-row[data-pb-mod="run"],#scr-perf[data-pf-mod="run"] #card-records .rec-row[data-pb-mod="lift"]{display:none!important}
#perf-evo .pf-outra{display:none!important}
.pf-rec-vazio{font-size:12.5px;color:var(--text-mute);padding:6px 0}
`; document.head.appendChild(s); })();

Object.assign(window, { PERF_BLOCOS, perfOcultos, perfOrdem, perfAplica, perfModulo, openPersonalizarProgresso, pfAlterar, pfPreset, pfBasico, pfPadrao });
// computador (parte 29): seletor no topo, "Personalizar progresso" no fim
try{ DK_LAYOUT['scr-perf'].topo.push('#perf-mod'); DK_LAYOUT['scr-perf'].fim = (DK_LAYOUT['scr-perf'].fim || []).concat('#perf-personalizar'); }catch(e){}

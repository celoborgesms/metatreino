
// =====================================================================
// 38. Beta 40 — Correções de cadastro e usabilidade
// =====================================================================
// 1. Registrar peso: Cancelar, descartar com confirmação, nada salvo sem "Salvar".
// 2. Estilo dos ícones escolhido no cadastro, junto do tema (salvo na conta).
// 4. IMC estimado discreto abaixo de altura e peso (sem rótulos sobre o corpo).
// 5/6. Explicação só da opção escolhida (nível de atividade, objetivo principal, objetivo do plano).
// 7. Calistenia e Híbrido: objetivos próprios, coerentes com o objetivo principal, e o texto mostra
//    exatamente o que o gerador vai usar.
// 8. Data de início: a mensagem diz quando é o PRIMEIRO TREINO de verdade (dias escolhidos).
// 9. Tempo recente na corrida: seletor próprio do MetaTreino (distância + h/min/s por gesto), sem o do sistema.
// (3. data de nascimento: corrigida na régua de datas, parte 34.)

// ---------- 1. Registrar peso ----------
mtGancho('openModal', { depois(k){ if(k === 'add-weight') try{ wtPrepara(); }catch(e){ console.log('peso:', e); } } });
function wtPrepara(){
  const mi = $('modal-inner'), inp = $('wt-val'); if(!mi || !inp || mi.querySelector('.wt-acoes')) return;
  const ini = inp.value;
  const bt = [...mi.querySelectorAll('button')].find(b=>/saveWeight/.test(b.getAttribute('onclick')||''));
  if(bt){
    const row = document.createElement('div'); row.className = 'wt-acoes';
    row.innerHTML = `<button type="button" class="btn btn-ghost" onclick="janCancelar()">Cancelar</button>`;
    bt.parentNode.insertBefore(row, bt); bt.classList.remove('btn-block'); bt.style.marginTop = '0'; row.appendChild(bt);
  }
  // "com alteração" = o valor é diferente do que abriu (mexer e voltar ao mesmo número não pede confirmação)
  inp.addEventListener('input', ()=>{ _janSuja = String(inp.value) !== String(ini); });
}

// ---------- 2. Estilo dos ícones no cadastro ----------
function wzRenderIcones(){
  const box = $('wz-icones'); if(!box) return;
  const v = (state.prefs && state.prefs.icones) || iconeEstiloAtual();
  box.innerHTML = iconeOpcoesHtml(v, 'wzEscolheIcone');
  const n = $('wz-icones-nota');
  if(n) n.textContent = v === 'emoji' && iconeEstiloAtual() !== 'emoji' ? 'Os emojis coloridos entram ao terminar o cadastro. Você troca quando quiser em Perfil › Estilo dos ícones.' : 'Você troca quando quiser em Perfil › Estilo dos ícones.';
}
function wzEscolheIcone(v){
  iconeEstiloSalvar(v);
  if(v === 'linha') iconeEstiloAplicar('linha');
  else window.__icoPendente = iconeEstiloAtual() !== 'emoji';
  wzRenderIcones();
}
mtGancho('wzRenderTemas', { depois(){ try{ wzRenderIcones(); }catch(e){} } });
// os emojis originais só voltam recarregando: isso acontece uma vez, quando o cadastro termina
mtGancho('goTab', { depois(t){
  try{ if(window.__icoPendente && t === 'home' && cadastroPronto()){ window.__icoPendente = false; setTimeout(()=>iconeEstiloAplicar('emoji'), 1800); } }catch(e){}
}});

// ---------- 4. IMC estimado ----------
function wzImc(){
  const box = $('wz-imc'); if(!box) return;
  const h = parseFloat(($('q-height')||{}).value), w = parseFloat(($('q-weight')||{}).value);
  if(!(h >= 100 && h <= 230 && w >= 25 && w <= 400)){ box.hidden = true; return; }
  const imc = w / Math.pow(h/100, 2);
  box.hidden = false;
  box.innerHTML = `IMC estimado: <b>${imc.toFixed(1).replace('.',',')}</b>. É uma referência baseada na relação entre peso e altura, não uma avaliação da composição corporal: ele não diferencia músculo de gordura.`;
}
document.addEventListener('input', e=>{ if(e.target && (e.target.id === 'q-height' || e.target.id === 'q-weight')) wzImc(); }, true);
document.addEventListener('change', e=>{ if(e.target && (e.target.id === 'q-height' || e.target.id === 'q-weight')) wzImc(); }, true);

// ---------- 5, 6 e 7. Explicação só da opção escolhida ----------
const WZ_EXPL = {
  'q-level': {
    sedentario:'Hoje você quase não pratica exercícios (até 1 vez por semana, ou nada). O plano começa com menos volume e mais tempo de adaptação.',
    ativo:'Você se exercita às vezes, de 1 a 3 vezes por semana, sem uma rotina fixa. O plano começa num ponto intermediário.',
    atleta:'Você treina com regularidade há meses, 4 vezes ou mais por semana. O plano já começa com mais volume e intensidade.'
  },
  'q-goal': {
    emagrecer:'Reduzir gordura corporal. O app prioriza exercícios que trabalham mais músculos, descansos mais curtos e constância. A alimentação tem um papel grande nesse objetivo.',
    massa:'Aumentar a massa muscular. Séries de 8 a 12 repetições perto do limite, com aumento gradual de carga ao longo das semanas.',
    forca:'Levantar mais peso nos exercícios principais. Menos repetições, mais carga e descansos maiores entre as séries.',
    condicionamento:'Ter mais fôlego e disposição no dia a dia. Treinos em ritmo mais dinâmico, com menos tempo parado.',
    tonificar:'Firmar e definir os músculos, ganhando força sem foco em volume. Repetições moderadas e treinos de corpo todo ao longo da semana.',
    saude:'Movimentar o corpo com segurança e regularidade, sem metas extremas. Intensidade moderada e progressão tranquila.'
  },
  'lift-goal': {
    hipertrofia:'Ganho de massa muscular: 8 a 12 repetições por série, descanso de 1 a 1,5 min e carga que sobe quando você fecha a faixa.',
    forca:'Força máxima: exercícios compostos primeiro, 4 a 6 repetições e descansos de 2 a 3 min.',
    emagrecimento:'Gasto energético: exercícios multiarticulares primeiro, 12 a 15 repetições e descansos curtos.',
    resistencia:'Resistência muscular: 15 a 20 repetições, cargas leves e descansos bem curtos.'
  },
  'cali-goal': {
    hipertrofia:'Massa muscular com o peso do corpo: variações mais difíceis em 6 a 12 repetições, descanso de 90 s.',
    forca:'Força: progressões difíceis em 3 a 6 repetições e isometrias curtas, com descanso longo.',
    resistencia:'Resistência e saúde: mais repetições (12 a 20) com descanso curto. Bom para quem quer constância.',
    condicionamento:'Condicionamento e emagrecimento: blocos de 10 a 15 repetições com descanso de 30 a 45 s, para gastar mais energia.',
    habilidades:'Habilidades (parada de mão, barra, muscle-up…): progressões técnicas em poucas repetições, com descanso completo.'
  }
};
// no Híbrido, os dias de academia seguem o mesmo objetivo (convertido assim — a mesma tabela de caliLerSetup)
const HIB_GYM_DE_CALI = { forca:'Força', hipertrofia:'Hipertrofia', resistencia:'Resistência', condicionamento:'Emagrecimento', habilidades:'Força' };
function wzExplica(gid){
  const g = $(gid); if(!g) return;
  const on = g.querySelector('.opt.on'); const T = WZ_EXPL[gid] || {};
  let box = g.parentElement.querySelector(`.wz-expl[data-de="${gid}"]`);
  if(!on || !T[on.dataset.val]){ if(box) box.remove(); return; }
  if(!box){ box = document.createElement('div'); box.className = 'wz-expl'; box.dataset.de = gid; box.setAttribute('aria-live','polite'); g.after(box); }
  let txt = `<b>${mtEsc(on.textContent.trim())}:</b> ${T[on.dataset.val]}`;
  if(gid === 'cali-goal' && readOpt('lift-modalidade') === 'hibrido') txt += ` Nos dias de academia do Híbrido: <b>${HIB_GYM_DE_CALI[on.dataset.val]}</b>.`;
  box.innerHTML = txt;
}
function wzExplicaTudo(){ Object.keys(WZ_EXPL).forEach(wzExplica); }
document.addEventListener('click', e=>{
  const o = e.target.closest && e.target.closest('.opt'); if(!o) return;
  const g = o.parentElement; if(g && WZ_EXPL[g.id]) setTimeout(()=>{ wzExplica(g.id); if(g.id === 'cali-goal' || g.id === 'lift-goal') wzObjetivoAtualiza(); }, 0);
  if(g && g.id === 'lift-modalidade') setTimeout(()=>{ wzExplica('cali-goal'); wzObjetivoAtualiza(); }, 20);
}, true);
// a nota antiga com as três explicações juntas sai (fica só a da opção escolhida)
function wzLimpaNotas(){ const g = $('q-level'); const n = g && g.parentElement.querySelector('.wz-nota'); if(n && /Sedentário:/.test(n.textContent)) n.remove(); }

// ---------- 7. Objetivo do plano coerente (Calistenia e Híbrido) ----------
// Os rótulos das opções de calistenia passam a dizer o que fazem; o objetivo sugerido vem do objetivo
// principal com a mesma tabela usada para montar o plano (GOAL_CALI_DO_QUIZ); e o cartão "Objetivo do plano"
// é refeito a cada troca, mostrando a opção que o gerador vai ler (readOpt).
function wzRotulosCali(){
  const g = $('cali-goal'); if(!g) return;
  const L = { hipertrofia:'Hipertrofia (massa)', forca:'Força', resistencia:'Resistência e saúde', condicionamento:'Condicionamento e emagrecimento', habilidades:'Domínio de habilidades' };
  g.querySelectorAll('.opt').forEach(o=>{ const t = L[o.dataset.val]; if(!t) return; const ic = o.querySelector('[data-ico]'); const last = o.lastChild;
    if(last && last.nodeType === 3) last.textContent = t; else o.insertAdjacentText('beforeend', t); if(ic && ic.parentElement !== o) o.prepend(ic); });
  if(!g.querySelector('.opt.on')){ const d = g.querySelector('.opt[data-val="hipertrofia"]'); if(d) d.classList.add('on'); }
}
function wzObjetivoAtualiza(){
  ['lift-goal','cali-goal'].forEach(gid=>{
    const g = $(gid); if(!g) return; const f = g.closest('.field'); const s = f && f.querySelector('.wz-sug'); if(!s) return;
    const on = g.querySelector('.opt.on'); const b = s.querySelector('b'); if(b) b.textContent = on ? on.textContent.trim() : '—';
    const sm = s.querySelector('small'); const p = state.user && state.user.profile;
    if(sm && p) sm.textContent = `Sugerido a partir de “${QUIZ_GOAL_LBL[p.goal] || p.goal}”.` + (gid === 'cali-goal' && readOpt('lift-modalidade') === 'hibrido' && on ? ` Academia: ${HIB_GYM_DE_CALI[on.dataset.val]}.` : '');
  });
}
mtGancho('wzObjetivoSugerido', { antes(){ try{ wzRotulosCali(); }catch(e){} }, depois(){ try{ wzObjetivoAtualiza(); wzExplicaTudo(); }catch(e){} } });
// ao "Alterar": o objetivo continua o mesmo marcado (só abre as opções), e a explicação aparece junto
mtGancho('wzAbreObjetivo', { depois(gid){ try{ wzExplica(gid); }catch(e){} } });
// segurança: o objetivo que o gerador usa é sempre o que está marcado na tela (nunca vazio)
const _caliLerSetupB40 = window.caliLerSetup;
window.caliLerSetup = function(){
  try{ const g = $('cali-goal'); if(g && !g.querySelector('.opt.on')){ const d = g.querySelector('.opt[data-val="hipertrofia"]'); if(d) d.classList.add('on'); } }catch(e){}
  return _caliLerSetupB40.apply(this, arguments);
};

// ---------- 8. Data de início ----------
const _DIAS_NOME = ['segunda','terça','quarta','quinta','sexta','sábado','domingo'];
function _isoLocal(t){ const d = new Date(t); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; }
function wzPrimeiroTreino(m){
  const sel = readSelectedDays(m+'-week-days') || [];
  const inp = $(m+'-start-date'); const hoje = mtDia0();
  let ini = hoje;
  if(inp && inp.value){ const d = new Date(inp.value + 'T00:00:00').getTime(); if(!isNaN(d) && d > hoje) ini = d; }
  if(!sel.length) return { ini, primeiro:null, sel };
  for(let k = 0; k < 7; k++){
    const t = ini + k*DIA_MS; const dt = new Date(t); const di = dt.getDay() === 0 ? 7 : dt.getDay();
    if(sel.includes(di)) return { ini, primeiro: mtDia0(t), sel };
  }
  return { ini, primeiro:null, sel };
}
function wzInicioMsg(m){
  const inp = $(m+'-start-date'); if(!inp) return;
  const f = inp.closest('.field'); if(!f) return;
  let box = f.querySelector('.wz-inicio-msg');
  if(!box){ [...f.children].filter(x=>x.tagName === 'DIV' && /Deixe vazio/.test(x.textContent)).forEach(x=>x.remove()); box = document.createElement('div'); box.className = 'wz-inicio-msg'; box.setAttribute('aria-live','polite'); f.appendChild(box); }
  const r = wzPrimeiroTreino(m); const hoje = mtDia0();
  const nomeDia = t=>{ const d = new Date(t).getDay(); return _DIAS_NOME[d === 0 ? 6 : d-1]; };
  const quando = t=> t === hoje ? `<b>hoje</b> (${nomeDia(t)})` : t === hoje + DIA_MS ? `<b>amanhã</b> (${nomeDia(t)}, ${_isoLocal(t)})` : `<b>${nomeDia(t)}, ${_isoLocal(t)}</b>`;
  const manual = !!(inp.value && r.ini > hoje);
  let txt;
  if(!r.sel.length) txt = manual ? `Início em ${quando(r.ini)}. O primeiro treino será no primeiro dia de treino escolhido a partir dessa data.` : 'Sem data definida: o planejamento começa na próxima ocorrência dos dias de treino que você escolher.';
  else if(!manual) txt = r.primeiro === hoje ? `Sem data definida: hoje é um dos seus dias de treino, então o treino <b>pode começar hoje</b>.` : `Sem data definida: o planejamento começa na próxima ocorrência dos dias escolhidos. Primeiro treino: ${quando(r.primeiro)}.`;
  else txt = `Início em ${quando(r.ini)}${r.primeiro !== r.ini ? `. Como esse não é um dos dias escolhidos, o primeiro treino será ${quando(r.primeiro)}` : ', que já é um dia de treino'}. Dias antes do início não contam como falta.`;
  box.innerHTML = txt;
}
['lift','run'].forEach(m=>{
  document.addEventListener('change', e=>{ if(e.target && e.target.id === m+'-start-date') wzInicioMsg(m); }, true);
  document.addEventListener('input', e=>{ if(e.target && e.target.id === m+'-start-date') wzInicioMsg(m); }, true);
  document.addEventListener('click', e=>{ if(e.target.closest && (e.target.closest('#'+m+'-week-days') || e.target.closest('#'+m+'-days') || e.target.closest('#scr-setup-'+m+' .nr-limpa'))) setTimeout(()=>wzInicioMsg(m), 30); }, true);
});

// ---------- 9. Tempo recente na corrida (seletor próprio) ----------
const MC_DIST = [['3','3 km',3],['5','5 km',5],['10','10 km',10],['21.0975','21 km',21.0975],['42.195','42 km',42.195]];
function mcLer(){
  const d = $('run-marca-dist'); const h = +(($('run-marca-h')||{}).value||0), mi = +(($('run-marca-m')||{}).value||0), s = +(($('run-marca-s')||{}).value||0);
  return { dist: d ? d.value : '', seg: h*3600 + mi*60 + s };
}
function mcTxt(seg){ const h = Math.floor(seg/3600), m = Math.floor(seg%3600/60), s = seg%60; return (h ? `${h}h ` : '') + `${String(m).padStart(h?2:1,'0')}min ${String(s).padStart(2,'0')}s`; }
function mcRitmo(km, seg){ if(!km || !seg) return ''; const p = seg/km/60; const mm = Math.floor(p), ss = Math.round((p-mm)*60); return `${mm}:${String(ss===60?0:ss).padStart(2,'0')}/km`; }
// faixa plausível de ritmo por distância (min/km): abaixo do recorde mundial ou acima de caminhada lenta = impossível
const MC_LIM = { 3:[2.4,15], 5:[2.45,15], 10:[2.55,15.5], 21.0975:[2.7,16], 42.195:[2.8,17] };
function mcValida(dist, seg){
  if(!dist && !seg) return '';
  if(!dist) return 'Escolha a distância.';
  if(!seg) return 'Informe o tempo.';
  const km = +dist; const p = seg/km/60; const [lo, hi] = MC_LIM[km] || [2.4, 17];
  if(p < lo) return `Esse tempo daria ${mcRitmo(km, seg)}, mais rápido que o recorde mundial. Confira o valor.`;
  if(p > hi) return `Esse tempo daria ${mcRitmo(km, seg)}: para um tempo "correndo forte", parece lento demais. Se caminhou parte, deixe em branco.`;
  return '';
}
function mcPrepara(){
  const sel = $('run-marca-dist'); if(!sel || sel.dataset.mc) return;
  sel.dataset.mc = '1';
  const row = sel.closest('.row'); if(!row) return;
  row.style.display = 'none';
  const b = document.createElement('div'); b.className = 'marca-btn'; b.id = 'mc-btn'; b.setAttribute('role','button'); b.tabIndex = 0;
  b.setAttribute('aria-haspopup','dialog');
  b.addEventListener('click', e=>{ if(e.target.closest('.mb-limpa')){ e.stopPropagation(); mcGravar('', 0); return; } mcAbrir(); });
  b.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); mcAbrir(); } });
  row.after(b); mcMostraBtn();
}
function mcMostraBtn(){
  const b = $('mc-btn'); if(!b) return; const v = mcLer();
  const nome = (MC_DIST.find(x=>x[0] === v.dist)||[])[1];
  b.innerHTML = v.dist && v.seg ? `<span><span class="mb-val">${nome} em ${mcTxt(v.seg)}</span> <small style="color:var(--text-mute)">· ${mcRitmo(+v.dist, v.seg)}</small></span><button type="button" class="mb-limpa" aria-label="Apagar tempo">×</button>`
    : `<span class="mb-vazio">Escolher distância e tempo</span><span aria-hidden="true">›</span>`;
  b.setAttribute('aria-label', v.dist && v.seg ? `Tempo recente: ${nome} em ${mcTxt(v.seg)}. Tocar para mudar` : 'Escolher distância e tempo recente');
}
function mcGravar(dist, seg){
  const sel = $('run-marca-dist'); if(!sel) return;
  sel.value = dist || '';
  const h = Math.floor(seg/3600), m = Math.floor(seg%3600/60), s = seg%60;
  [['run-marca-h', seg ? h : ''], ['run-marca-m', seg ? m : ''], ['run-marca-s', seg ? s : '']].forEach(([id, v])=>{ const e = $(id); if(e){ e.value = v === '' ? '' : String(v); e.dispatchEvent(new Event('input', { bubbles:true })); e.dispatchEvent(new Event('change', { bubbles:true })); } });
  sel.dispatchEvent(new Event('change', { bubbles:true }));
  mcMostraBtn();
  try{ runAtualizaDicaNivel(); }catch(e){}
}
let MC = null;
function mcAbrir(){
  const v = mcLer(); MC = { dist: v.dist || '5', seg: v.seg || 0, reguas:[] };
  if(!v.seg){ MC.seg = { '3':15*60, '5':28*60, '10':58*60, '21.0975':2*3600+10*60, '42.195':4*3600+30*60 }[MC.dist]; }
  let f = $('mc-fundo');
  if(!f){
    f = document.createElement('div'); f.id = 'mc-fundo'; f.className = 'nr-fundo';
    f.innerHTML = `<div class="nr-folha" role="dialog" aria-modal="true" aria-labelledby="mc-tit">
      <div class="nr-alca" aria-hidden="true"></div>
      <div class="nr-topo"><div class="nr-tit" id="mc-tit">Tempo recente</div><button type="button" class="nr-x" aria-label="Fechar sem mudar" onclick="mcFechar()">×</button></div>
      <div class="mc-dists" role="radiogroup" aria-label="Distância"></div>
      <div class="nr-mostra" aria-live="polite"><span class="nr-num"></span></div>
      <div class="mc-ritmo"></div>
      <div class="nr-reguas"></div>
      <div class="nr-dig" hidden><input class="input mono" id="mc-dig" autocomplete="off" inputmode="numeric" placeholder="Ex.: 27:45 ou 1:05:30" data-teclado><div class="nr-dig-dica">h:mm:ss ou mm:ss</div></div>
      <div class="mc-erro" role="alert"></div>
      <div class="nr-acoes"><button type="button" class="btn btn-ghost" onclick="mcFechar()">Cancelar</button><button type="button" class="btn btn-ghost" id="mc-bdig" onclick="mcDigitar()">Digitar</button><button type="button" class="btn btn-primary nr-ok" onclick="mcConfirmar()">Confirmar</button></div>
    </div>`;
    document.body.appendChild(f);
    f.addEventListener('click', e=>{ if(e.target === f) mcFechar(); });
    f.addEventListener('keydown', e=>{ if(e.key === 'Escape'){ e.preventDefault(); mcFechar(); } else if(e.key === 'Enter' && !e.target.closest('button')){ e.preventDefault(); mcConfirmar(); } });
    f.querySelector('#mc-dig').addEventListener('input', mcDigitado);
  }
  f.querySelector('.mc-dists').innerHTML = MC_DIST.map(([k,l])=>`<button type="button" role="radio" aria-checked="${k===MC.dist}" class="${k===MC.dist?'on':''}" onclick="mcDist('${k}')">${l}</button>`).join('');
  f.querySelector('.nr-dig').hidden = true; const box = f.querySelector('.nr-reguas'); box.hidden = false; box.innerHTML = '';
  let t = { h:Math.floor(MC.seg/3600), m:Math.floor(MC.seg%3600/60), s:MC.seg%60 };
  const up = ()=>{ MC.seg = t.h*3600 + t.m*60 + t.s; mcMostra(); };
  NR = { mc:true };   // as réguas por gesto (parte 34) só avisam enquanto há uma folha aberta
  MC.reguas = [
    nrRegua({ min:0, max:9, step:1, valor:t.h, fmt:v=>String(v), rotulo:'horas', nome:'Horas', compacta:true, maior:1, tk:48, onChange:v=>{ t.h = v; up(); } }),
    nrRegua({ min:0, max:59, step:1, valor:t.m, fmt:v=>String(v), rotulo:'min', nome:'Minutos', compacta:true, maior:5, tk:20, onChange:v=>{ t.m = v; up(); } }),
    nrRegua({ min:0, max:59, step:1, valor:t.s, fmt:v=>String(v).padStart(2,'0'), rotulo:'seg', nome:'Segundos', compacta:true, maior:5, tk:20, onChange:v=>{ t.s = v; up(); } })
  ];
  MC.reguas.forEach(r=>box.appendChild(r.el));
  MC.t = t; up();
  f.classList.add('on'); document.documentElement.classList.add('nr-aberta');
  requestAnimationFrame(()=>{ MC && MC.reguas.forEach(r=>r.montar()); try{ f.querySelector('.mc-dists button.on').focus({ preventScroll:true }); }catch(e){} });
}
function mcMostra(){
  const f = $('mc-fundo'); if(!f || !MC) return;
  f.querySelector('.nr-num').textContent = mcTxt(MC.seg);
  f.querySelector('.mc-ritmo').textContent = MC.seg ? `Ritmo médio: ${mcRitmo(+MC.dist, MC.seg)}` : '';
  f.querySelector('.mc-erro').textContent = '';
}
function mcDist(k){
  if(!MC) return; MC.dist = k;
  document.querySelectorAll('#mc-fundo .mc-dists button').forEach(b=>{ const on = b.getAttribute('onclick').includes(`'${k}'`); b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  mcMostra();
}
function mcDigitar(){
  const f = $('mc-fundo'); if(!f) return; const d = f.querySelector('.nr-dig'); const inp = f.querySelector('#mc-dig');
  d.hidden = false; f.querySelector('.nr-reguas').hidden = true; inp.value = ''; setTimeout(()=>inp.focus(), 30);
}
function mcDigitado(){
  const inp = $('mc-dig'); if(!inp || !MC) return null;
  const p = inp.value.trim().split(/[:.,h ]+/).filter(Boolean).map(x=>parseInt(x,10));
  let seg = null;
  if(p.length && !p.some(isNaN)){
    if(p.length === 3 && p[1] < 60 && p[2] < 60) seg = p[0]*3600 + p[1]*60 + p[2];
    else if(p.length === 2 && p[1] < 60) seg = p[0]*60 + p[1];
  }
  inp.classList.toggle('nr-ruim', !!inp.value.trim() && seg == null);
  if(seg != null && seg < 10*3600){ MC.seg = seg; mcMostra(); }
  return seg;
}
function mcConfirmar(){
  if(!MC) return; const f = $('mc-fundo');
  if(!f.querySelector('.nr-dig').hidden && mcDigitado() == null){ f.querySelector('.mc-erro').textContent = 'Formato do tempo: 27:45 ou 1:05:30.'; return; }
  const erro = mcValida(MC.dist, MC.seg);
  if(erro){ f.querySelector('.mc-erro').textContent = erro; return; }
  mcGravar(MC.dist, MC.seg); mcFechar();
}
function mcFechar(){
  const f = $('mc-fundo'); if(f) f.classList.remove('on'); document.documentElement.classList.remove('nr-aberta');
  if(NR && NR.mc) NR = null; MC = null;
  try{ $('mc-btn').focus({ preventScroll:true }); }catch(e){}
}

// ---------- preparar as telas do cadastro ----------
mtGancho('wzIr', { depois(id){
  try{
    if(id === 'scr-quiz'){ wzLimpaNotas(); wzExplica('q-level'); wzExplica('q-goal'); wzImc(); }
    if(id === 'scr-setup-lift'){ wzRotulosCali(); wzExplicaTudo(); wzInicioMsg('lift'); }
    if(id === 'scr-setup-run'){ mcPrepara(); mcMostraBtn(); wzInicioMsg('run'); }
  }catch(e){ console.log('cadastro (Beta 40):', e); }
}});
mtGancho('openSetupScreen', { depois(m){ try{ if(m === 'run'){ mcPrepara(); mcMostraBtn(); } wzInicioMsg(m); }catch(e){} } });

Object.assign(window, { wtPrepara, wzRenderIcones, wzEscolheIcone, wzImc, wzExplica, wzObjetivoAtualiza, wzInicioMsg, wzPrimeiroTreino,
  mcAbrir, mcFechar, mcDist, mcDigitar, mcConfirmar, mcGravar, mcValida, mcPrepara });

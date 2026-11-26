
// =====================================================================
// 48. Beta 44 — Conquistas no fim do registro, aviso na aba Desafios e "não vou treinar hoje" coerente
// =====================================================================
// 1) Conquistas ao concluir um registro (treino, corrida ou atividade): depois que a tela de resumo do
//    registro fecha, aparece UMA janela com o que foi desbloqueado agora ("Ver todas" / "Continuar").
//    Fora do fim de um registro (abrir o app, sincronizar de outro aparelho) nada pula na tela — continua
//    só o selo "Novidade" e o ponto na aba Desafios, como na Beta 41.
// 2) Ponto de notificação na aba Desafios enquanto houver conquista ainda não apresentada na aba Conquistas.
// 3) Treino marcado como "não vou treinar hoje": o aviso sobe para o topo da sessão e "Registrar" pergunta
//    antes se a pessoa quer voltar a treinar (antes dava para registrar tudo e só o "Salvar" ficava preso
//    até achar o "Voltar atrás" lá embaixo).

// ---------- 1. conquistas no fim do registro ----------
const MT_REG_JANELA = 120000;          // conquistas desbloqueadas até 2 min depois de salvar um registro
['finishLiftWorkout','saveRunLog','saveActivityLog'].forEach(n=>mtGancho(n, { antes(){ window.__mtRegEm = Date.now(); } }));

const _showAwardsB44 = window.showAwards;
window.showAwards = function(){
  const antes = new Set(((state && state.conqPend) || []).map(p=>p.k));
  const r = _showAwardsB44.apply(this, arguments);
  try{
    const novos = ((state && state.conqPend) || []).filter(p=>!antes.has(p.k) && !p.cel);
    if(novos.length && window.__mtRegEm && Date.now() - window.__mtRegEm < MT_REG_JANELA) cqCelebrar(novos.map(p=>p.k));
  }catch(e){ console.log('celebração:', e); }
  return r;
};
let _cqCelFila = [], _cqCelT = 0, _cqCelDesde = 0;
function _cqTelaApp(){
  const a = document.querySelector('.screen.active'); if(!a) return false;
  return !/^scr-(quiz|auth|noaccess|loading|pick|setup|building)/.test(a.id);
}
function cqCelebrar(ks){
  ks.forEach(k=>{ if(!_cqCelFila.includes(k)) _cqCelFila.push(k); });
  if(!_cqCelDesde) _cqCelDesde = Date.now();
  clearTimeout(_cqCelT);
  _cqCelT = setTimeout(_cqCelTenta, 700);
}
function _cqCelTenta(){
  const back = document.getElementById('modal-back');
  const ocupado = back && back.classList.contains('on');
  if(ocupado || !_cqTelaApp()){
    if(Date.now() - _cqCelDesde > 4*60000){ _cqCelFila = []; _cqCelDesde = 0; return; }   // desistiu: fica para a aba
    _cqCelT = setTimeout(_cqCelTenta, 700); return;
  }
  const pend = (state.conqPend||[]).filter(p=>_cqCelFila.includes(p.k) && !p.cel);
  _cqCelFila = []; _cqCelDesde = 0;
  if(!pend.length) return;
  pend.forEach(p=>{ p.cel = true; });
  try{ salvarLocal(); }catch(e){}
  const lista = pend.slice().reverse();
  _cqCelLista = lista;
  const n = lista.length;
  $('modal-inner').innerHTML = `<div class="cq cq-cel">
    <div class="cq-topo"><h3>🏆 ${n === 1 ? 'Nova conquista!' : n + ' novas conquistas!'}</h3><button class="cq-x" onclick="closeModal()" aria-label="Fechar">✕</button></div>
    <div class="cel-trilho" id="cel-trilho" role="listbox" aria-label="Conquistas desbloqueadas — deslize para os lados">
      ${lista.map((p,i)=>cqCelCartao(p, i)).join('')}
    </div>
    ${n > 1 ? `<div class="cel-nav"><button type="button" class="cel-seta" aria-label="Anterior" onclick="cqCelPasso(-1)">‹</button>
      <span class="cel-pos" id="cel-pos" aria-live="polite">1 de ${n}</span>
      <button type="button" class="cel-seta" aria-label="Próxima" onclick="cqCelPasso(1)">›</button></div>
      <div class="cel-pontos">${lista.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>` : ''}
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal();openTrophies()">Ver todas as conquistas</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button></div>`;
  $('modal-back').classList.add('on');
  const tr = document.getElementById('cel-trilho');
  let parou = 0;
  tr.addEventListener('scroll', ()=>{ clearTimeout(parou); parou = setTimeout(_cqCelAtual, 120); }, { passive:true });
  _cqCelIdx = 0; _cqCelVer(0);
  try{ if(typeof mtVibrar === 'function') mtVibrar([20,40,20]); }catch(e){}
}
let _cqCelLista = [], _cqCelIdx = 0;
function cqCelCartao(p, i){
  const t = p.tid ? TROPHIES.find(x=>x.id===p.tid) : null;
  const nv = t ? medalNivel(t) : (p.kind==='medalha' || p.kind==='marco' ? 'rara' : p.kind==='secreto' ? 'especial' : 'comum');
  const ico = t ? trophyIco(t) : (p.emo && /<svg|<span/.test(p.emo) ? p.emo : `<span class="cq-emo">${mtEsc(p.emo||'🏅')}</span>`);
  const tipo = { trofeu:'Conquista desbloqueada', secreto:'Segredo revelado', medalha:'Medalha do mês', marco:'Marco alcançado', evento:'Desafio concluído' }[p.kind] || p.tipo || 'Conquista';
  return `<div class="cel-cartao nv-${nv}" role="option" aria-label="${mtEsc(t ? t.name : p.nome)}" data-i="${i}">
    <div class="cel-med">${ico}</div>
    <small class="cel-tipo">${mtEsc(tipo)}${nv!=='comum' && typeof CQ_NV!=='undefined' ? ' · ' + CQ_NV[nv] : ''}</small>
    <b class="cel-nome">${mtEsc(t ? t.name : p.nome)}</b>
    <span class="cel-desc">${mtEsc(t ? t.desc : p.desc)}</span></div>`;
}
function _cqCelAtual(){
  const tr = document.getElementById('cel-trilho'); if(!tr) return;
  const i = Math.max(0, Math.min(_cqCelLista.length - 1, Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth))));
  if(i !== _cqCelIdx){ _cqCelIdx = i; _cqCelVer(i); }
}
// o cartão que aparece conta como visto (sai das "novas"); nada fica preso esperando um toque
function _cqCelVer(i){
  const p = _cqCelLista[i]; if(p){ try{ _cqCelMarca(p.k); }catch(e){} }
  const pos = document.getElementById('cel-pos'); if(pos) pos.textContent = `${i+1} de ${_cqCelLista.length}`;
  document.querySelectorAll('.cel-pontos i').forEach((d,k)=>d.classList.toggle('on', k===i));
  document.querySelectorAll('.cel-seta').forEach((b,k)=>{ b.disabled = k===0 ? i===0 : i===_cqCelLista.length-1; });
}
// Beta 48: o carrossel marca cada conquista como vista só neste aparelho e grava na nuvem ao fechar.
//     Antes gravava no instante em que abria — logo depois do registro, bem quando o outro aparelho
//     (aberto ao mesmo tempo) também podia estar gravando; a gravação mais nova apagava a mudança do outro.
const _cqCelVistos = new Set();
function _cqCelMarca(k){
  _cqCelVistos.add(k);
  try{
    const s = cqEstado(); if(!s) return;
    if(s.conqPend.some(x=>x.k === k)){
      s.conqVistas = s.conqVistas.concat([k]).slice(-CQ_MAX_VISTAS);
      s.conqPend = s.conqPend.filter(x=>x.k !== k);
      try{ localStorage.setItem(localCacheKey(uidDados()), JSON.stringify(state)); }catch(e){}
      cqIndicadores();
    }
  }catch(e){}
}
mtGancho('closeModal', { antes(){
  if(!_cqCelVistos.size) return;
  const ks = new Set(_cqCelVistos); _cqCelVistos.clear();
  try{ cqMarcaVista(x=>ks.has(x.k)) || saveData(); }catch(e){}
}});
function cqCelPasso(d){
  const tr = document.getElementById('cel-trilho'); if(!tr) return;
  const i = Math.max(0, Math.min(_cqCelLista.length - 1, _cqCelIdx + d));
  try{ tr.scrollTo({ left: i * tr.clientWidth, behavior:'smooth' }); }catch(e){ tr.scrollLeft = i * tr.clientWidth; }
  _cqCelIdx = i; _cqCelVer(i);
}

// ---------- 2. ponto na aba Desafios ----------
const _cqIndicadoresB44 = window.cqIndicadores;
window.cqIndicadores = function(){
  const r = _cqIndicadoresB44 ? _cqIndicadoresB44.apply(this, arguments) : undefined;
  try{
    const n = cqTemNovidade();
    document.querySelectorAll('.tab[data-tab="challenges"]').forEach(t=>{
      let d = t.querySelector('.cq-dot');
      if(n && !d){ d = document.createElement('span'); d.className = 'cq-dot'; d.setAttribute('aria-hidden','true'); t.appendChild(d); }
      if(!n && d) d.remove();
      t.setAttribute('aria-label', n ? `Desafios — ${n} ${n===1?'novidade':'novidades'}` : 'Desafios');
    });
  }catch(e){}
  return r;
};
mtGancho('renderHome', { depois(){ try{ cqIndicadores(); }catch(e){} } });
mtGancho('openTrophies', { depois(){ try{ cqIndicadores(); }catch(e){} } });
setTimeout(()=>{ try{ cqIndicadores(); }catch(e){} }, 1500);

// ---------- 3. "não vou treinar hoje" ----------
function _mtTreinoPulado(w){ try{ return !!(w && isSkippedToday(w)); }catch(e){ return false; } }
function _mtPerguntaVoltar(w, depois){
  appConfirm('Você marcou que não vai treinar hoje. Quer voltar a treinar e registrar?', ()=>{
    try{ unskipWorkout(String(w.k != null ? w.k : w.dayIdx)); }catch(e){}
    if(typeof depois === 'function') setTimeout(depois, 250);
  }, { title:'Voltar a treinar hoje?', emo:'😴', okLabel:'Sim, vou treinar', cancelLabel:'Continuar descansando' });
}
// o aviso de "treino pulado" vai para o topo da sessão e os exercícios ficam esmaecidos
mtGancho('renderSessionDetail', { depois(w){
  try{
    const slot = document.getElementById('session-detail-slot'); if(!slot) return;
    const pulado = _mtTreinoPulado(w);
    slot.classList.toggle('mt-pulado', pulado);
    if(!pulado) return;
    const btn = slot.querySelector('button[onclick^="unskipWorkout"]'); const card = btn && btn.closest('.card');
    if(card && slot.firstElementChild !== card){ card.classList.add('mt-pulado-card'); card.style.marginTop = '0'; card.style.marginBottom = '12px'; slot.prepend(card); }
  }catch(e){ console.log('treino pulado:', e); }
}});
const _openSetLogB44 = window.openSetLog;
window.openSetLog = function(exId, exName){
  try{
    const w = (typeof mtTreinoDoEx === 'function') ? mtTreinoDoEx(exId) : null;
    if(state.active === 'lift' && _mtTreinoPulado(w)) return _mtPerguntaVoltar(w, ()=>window.openSetLog(exId, exName));
  }catch(e){}
  return _openSetLogB44.apply(this, arguments);
};
const _openRunLogB44 = window.openRunLog;
if(typeof _openRunLogB44 === 'function') window.openRunLog = function(dayIdx){
  try{
    const mod = state.modules.run; const w = mod && mod.plan && (mod.plan.workouts||[]).find(x=>String(x.dayIdx)===String(dayIdx));
    if(state.active === 'run' && _mtTreinoPulado(w)) return _mtPerguntaVoltar(w, ()=>window.openRunLog(dayIdx));
  }catch(e){}
  return _openRunLogB44.apply(this, arguments);
};
mtGancho('finishLiftWorkout', { antes(k){
  try{ const mod = state.modules.lift; const w = mod && mod.plan && (mod.plan.workouts||[]).find(x=>String(x.k)===String(k));
    if(_mtTreinoPulado(w)){ const d = new Date(); d.setHours(0,0,0,0);
      // salvou mesmo assim (ex.: série registrada antes de pular): o registro vale, então o "pulado" sai
      state.skips = (state.skips||[]).filter(s=>!(s.at===d.getTime() && s.module==='lift' && skipEDoTreino(s, w))); } }catch(e){}
}});

(function(){ if(document.getElementById('b44-css')) return; const s = document.createElement('style'); s.id = 'b44-css';
  s.textContent = `
.tab[data-tab="challenges"]{position:relative}
.tab .cq-dot{position:absolute;top:4px;left:calc(50% + 7px);width:9px;height:9px;border-radius:50%;background:var(--danger,#e5484d);box-shadow:0 0 0 2px var(--bar-bg,var(--bg));pointer-events:none}
.cel-trilho{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch;margin:4px 0 0}
.cel-trilho::-webkit-scrollbar{display:none}
.cel-cartao{flex:0 0 100%;scroll-snap-align:center;scroll-snap-stop:always;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:14px 10px 10px;box-sizing:border-box}
.cel-med{width:108px;height:108px;display:flex;align-items:center;justify-content:center;animation:cqMed .7s var(--mt-ease,ease) both}
.cel-med .tbadge,.cel-med svg{width:108px;height:108px}.cel-med .cq-emo{font-size:64px}
.cel-cartao.nv-rara .cel-med{filter:drop-shadow(0 0 16px rgba(var(--primary-rgb),.45))}.cel-cartao.nv-especial .cel-med{filter:drop-shadow(0 0 18px rgba(var(--accent-rgb),.55))}
.cel-tipo{font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--primary-2)}
.cel-nome{font-size:19px;line-height:1.25}.cel-desc{font-size:13px;color:var(--text-dim);line-height:1.45;max-width:280px}
.cel-nav{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:6px}
.cel-seta{width:40px;height:40px;border-radius:50%;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:22px;line-height:1;cursor:pointer}
.cel-seta:disabled{opacity:.3;cursor:default}.cel-pos{font-size:12px;color:var(--text-mute);min-width:56px;text-align:center}
.cel-pontos{display:flex;justify-content:center;gap:5px;margin-top:8px;flex-wrap:wrap}.cel-pontos i{width:6px;height:6px;border-radius:99px;background:var(--text-mute);opacity:.4;transition:width .2s}.cel-pontos i.on{width:16px;opacity:1;background:var(--primary)}
.tx-mais-opc{margin:6px 0 2px}.tx-mais-opc>summary{cursor:pointer;font-size:12.5px;font-weight:700;color:var(--text-dim);padding:10px 2px;list-style:none}.tx-mais-opc>summary::before{content:'▸ ';}.tx-mais-opc[open]>summary::before{content:'▾ ';}
.cq-novas-txt{display:block;font-size:11.5px;font-weight:800;color:var(--primary-2);margin-top:4px}
@media (prefers-reduced-motion:reduce){.cel-med{animation:none}}
.cq-novo-tag{background:rgba(20,20,20,.86)!important;color:#fff!important}
#session-detail-slot.mt-pulado .ex,#session-detail-slot.mt-pulado .blk,#session-detail-slot.mt-pulado .block{opacity:.55}
`; document.head.appendChild(s); })();

Object.assign(window, { cqCelebrar, cqCelPasso });

// ---------- 4. fichas técnicas que estavam erradas ----------
// A ficha era escolhida pela primeira palavra que casava no nome: "Remada na Máquina (Hammer)" caía no supino,
// "Tríceps Coice" no glúteo, "Panturrilha no Leg Press" no agachamento, Farmer Walk/Pallof/Mountain Climber
// no abdominal. Aqui esses exercícios têm a ficha certa (os demais seguem como estavam).
const _fichaB44 = window.fichaExercicio;
const _fichaPor = re => (typeof EX_FICHAS !== 'undefined' ? EX_FICHAS.find(f=>f.re.source === re) : null);
const MT_FICHA_FIXA = [
  [/^remada na maquina/, ()=>EX_FICHAS.find(f=>f.re.test('remada'))],
  [/^elevacao posterior curvado/, ()=>EX_FICHAS.find(f=>f.re.test('face pull'))],
  [/^flexao pike elevada/, ()=>_fichaB44({ name:'Pike Push-up', sub:'Ombro' }, 'Ombro')],
  [/^flexao fechada/, ()=>_fichaB44({ name:'Flexão Diamante', sub:'Peito Central / Tríceps' }, 'Peito')],
  [/^panturrilha no leg press/, ()=>{ const f = EX_FICHAS.find(x=>x.re.test('panturrilha')); return f ? { ...f, d:['Só a ponta dos pés na plataforma, calcanhares para fora.','Joelhos estendidos, mas sem travar; deixe as travas de segurança prontas para usar.'] } : null; }],
  [/^triceps coice/, ()=>({ m:'Tríceps braquial', ex:['Apoie uma mão e um joelho no banco, tronco quase paralelo ao chão e coluna neutra.','Cotovelo colado ao corpo na altura do tronco; estenda o braço para trás até ficar reto.','Volte devagar até cerca de 90°, sem mexer o cotovelo.'], d:['Use carga leve: nessa posição o tríceps trabalha sem ajuda do ombro.'], e:'Balançar o braço e deixar o cotovelo cair.' })],
  [/^farmer walk/, ()=>({ m:'Pegada (antebraços), trapézio e core como estabilizador', ex:['Segure um halter pesado em cada mão, braços estendidos ao lado do corpo.','Fique alto: ombros para trás e para baixo, abdômen firme.','Caminhe com passos curtos e controlados pelo tempo ou distância combinados.'], d:['Pare antes de a pegada falhar — não deixe o peso escorregar.'], e:'Inclinar o tronco para um lado ou encolher os ombros.' })],
  [/^pallof press/, ()=>({ m:'Oblíquos e transverso do abdômen (anti-rotação)', ex:['De lado para a polia, cabo na altura do peito, pés na largura do quadril.','Com o abdômen firme, empurre o pegador à frente até estender os braços sem deixar o tronco girar.','Segure 1–2 segundos e volte ao peito controlando.'], d:['Quanto mais longe da polia, mais difícil.'], e:'Deixar o tronco girar em direção ao cabo.' })],
  [/^mountain climber/, ()=>({ m:'Core, flexores do quadril e ombros (com efeito de condicionamento)', ex:['Posição de prancha alta, mãos abaixo dos ombros.','Leve um joelho em direção ao peito e alterne as pernas em ritmo constante.','Mantenha o quadril baixo e o abdômen firme o tempo todo.'], d:['Comece devagar e acelere só se a postura se mantiver.'], e:'Quadril subindo e ombros passando à frente das mãos.' })],
  [/^superman/, ()=>({ m:'Eretores da coluna, glúteos e parte posterior dos ombros', ex:['Deite de bruços com os braços estendidos à frente.','Eleve braços, peito e pernas ao mesmo tempo, poucos centímetros, olhando para o chão.','Segure 1–2 segundos e desça controlando.'], d:['Amplitude pequena basta: o objetivo é ativar a lombar sem comprimir.'], e:'Jogar a cabeça para trás e forçar a lombar.' })],
  [/^elevacao y/, ()=>({ m:'Trapézio inferior, deltoides e manguito rotador', ex:['Tronco inclinado à frente (ou de bruços num banco inclinado), um halter leve em cada mão.','Eleve os braços estendidos à frente formando um "Y", polegares para cima.','Desça devagar, sem relaxar no fim.'], d:['Carga bem leve: é um exercício de saúde do ombro.'], e:'Encolher os ombros e subir com impulso.' })],
  [/^cadeira contra parede/, ()=>({ m:'Quadríceps (isometria) e glúteos', ex:['Encoste as costas na parede e desça até os joelhos formarem cerca de 90°.','Joelhos alinhados com os pés, peso nos calcanhares.','Segure o tempo combinado respirando normalmente.'], d:['Se o joelho incomodar, fique um pouco mais alto.'], e:'Joelhos indo para dentro ou costas desencostando da parede.' })]
];
window.fichaExercicio = function(ex, grupo){
  try{
    const n = mtNorm(ex && ex.name);
    for(const [re, f] of MT_FICHA_FIXA){ if(re.test(n)){ const r = f(); if(r) return r; } }
  }catch(e){}
  return _fichaB44.apply(this, arguments);
};

// ---------- 5. Emojis coloridos escolhidos no cadastro: sem o "Início → carregando → Início" ----------
// Os emojis originais só voltam recarregando a página (o modo minimalista troca os emojis por desenhos).
// Antes o app abria o Início e, 1,8 s depois, recarregava. Agora a recarga acontece ainda na tela
// "Plano pronto" e o app já volta direto no Início (com o aviso "Plano criado!").
const _buildB44 = window.runBuildingScreen;
window.runBuildingScreen = function(m, steps, done, opts){
  if(!window.__icoPendente || !(state.prefs && state.prefs.icones === 'emoji')) return _buildB44.apply(this, arguments);
  const fim = function(){
    window.__icoPendente = false;
    try{ state.ui = state.ui || {}; state.ui.tab = 'home'; saveData(); syncToCloud(); }catch(e){}
    try{ sessionStorage.setItem('mt_ico_reload', '1'); sessionStorage.setItem('mt_pos_cadastro', '1'); }catch(e){}
    setTimeout(()=>{ try{ location.reload(); }catch(e){ if(typeof done === 'function') done(); } }, 900);
  };
  return _buildB44.call(this, m, steps, fim, opts);
};
mtGancho('bootAfterAuth', { depois(){
  try{
    if(sessionStorage.getItem('mt_pos_cadastro') !== '1') return;
    sessionStorage.removeItem('mt_pos_cadastro');
    setTimeout(()=>{ try{ if(cadastroPronto()){ goTab('home'); toast('🎉 Plano criado!'); } }catch(e){} }, 300);
  }catch(e){}
}});

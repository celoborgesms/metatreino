
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
  const tit = lista.length === 1 ? 'Nova conquista!' : `${lista.length} novas conquistas!`;
  $('modal-inner').innerHTML = `<div class="cq cq-anim cq-cel">
    <div class="cq-topo"><h3>🏆 ${tit}</h3><button class="cq-x" onclick="closeModal()" aria-label="Fechar">✕</button></div>
    <p class="cq-cel-p">Desbloqueada${lista.length>1?'s':''} com o registro de agora. Toque em uma para ver os detalhes.</p>
    <section class="cq-novos">${lista.slice(0, CQ_MAX_NOVOS).map((p,i)=>cqNovoItem(p, i)).join('')}${lista.length > CQ_MAX_NOVOS ? `<div class="cq-mais-novos">E mais ${lista.length - CQ_MAX_NOVOS} na aba Conquistas.</div>` : ''}</section>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal();openTrophies()">Ver todas as conquistas</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Continuar</button></div>`;
  $('modal-back').classList.add('on');
  try{ if(typeof mtVibrar === 'function') mtVibrar([20,40,20]); }catch(e){}
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
      state.skips = (state.skips||[]).filter(s=>!(s.at===d.getTime() && s.module==='lift' && (s.k===w.k || s.dayIdx===w.dayIdx))); } }catch(e){}
}});

(function(){ if(document.getElementById('b44-css')) return; const s = document.createElement('style'); s.id = 'b44-css';
  s.textContent = `
.tab[data-tab="challenges"]{position:relative}
.tab .cq-dot{position:absolute;top:4px;left:calc(50% + 7px);width:9px;height:9px;border-radius:50%;background:var(--danger,#e5484d);box-shadow:0 0 0 2px var(--bar-bg,var(--bg));pointer-events:none}
.cq-cel .cq-cel-p{font-size:13px;color:var(--text-dim);line-height:1.5;margin:-4px 0 10px}
.cq-novo-tag{background:rgba(20,20,20,.86)!important;color:#fff!important}
.cq-vistas{display:block;margin:4px auto 0;background:none;border:0;color:var(--primary-2);font:inherit;font-size:12.5px;font-weight:700;padding:8px;cursor:pointer}
#session-detail-slot.mt-pulado .ex,#session-detail-slot.mt-pulado .blk,#session-detail-slot.mt-pulado .block{opacity:.55}
`; document.head.appendChild(s); })();

Object.assign(window, { cqCelebrar });

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

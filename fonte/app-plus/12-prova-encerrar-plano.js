
// =====================================================================
// 27. DATA DA PROVA REMOVÍVEL + ENCERRAR PLANO DE MUSCULAÇÃO (Beta 15)
// =====================================================================
// --- prova alvo: botão para tirar a data (no celular o campo de data não tem "limpar") ---
function runLimparProva(){
  const d = $('run-race-date'), t = $('run-race-time');
  if(d) d.value = ''; if(t) t.value = '';
  _runProvaBtn();
  try{ runAtualizaDicaNivel(); }catch(e){}
  toast('Data da prova removida. Ela sai do plano ao salvar.');
}
function _runProvaBtn(){
  const d = $('run-race-date'); if(!d) return;
  let b = $('run-race-clear');
  if(!b){
    b = document.createElement('button'); b.type = 'button'; b.id = 'run-race-clear'; b.className = 'run-race-clear';
    b.textContent = '✕ Sem prova (remover data)'; b.onclick = runLimparProva;
    const row = d.closest('.row'); if(row) row.after(b);
  }
  b.style.display = d.value ? '' : 'none';
}
const _openSetupProvaB15 = window.openSetupScreen;
window.openSetupScreen = function(m){
  const r = _openSetupProvaB15.apply(this, arguments);
  if(m === 'run'){ try{ const d = $('run-race-date'); if(d && !d._b15){ d._b15 = true; ['input','change'].forEach(ev=>d.addEventListener(ev, _runProvaBtn)); } _runProvaBtn(); }catch(e){} }
  return r;
};

// --- encerrar o plano de musculação (igual ao que a corrida já tinha) ---
// O plano sai; histórico, cargas, recordes, fotos e conquistas ficam.
function encerrarPlanoLift(){
  const lift = state.modules.lift;
  if(!lift || !lift.plan){ toast('Você não tem um plano de musculação ativo.'); return; }
  const temCorrida = !!(state.modules.run && state.modules.run.plan);
  appConfirm(`Seu histórico de treinos, cargas, recordes, fotos e conquistas são mantidos. ${temCorrida ? 'O app passa a mostrar o seu plano de corrida.' : 'Você pode montar um novo plano quando quiser.'}`, ()=>{
    lift.planoEncerrado = { at: Date.now(), setup: lift.setup ? JSON.parse(JSON.stringify(lift.setup)) : null };
    lift.plan = null;
    if(temCorrida) state.active = 'run';
    saveData();
    toast('✅ Plano de musculação encerrado. Seu histórico foi mantido. 💚');
    goTab('home');
  }, {title:'Encerrar plano de musculação?', emo:'🏋️', okLabel:'Sim, encerrar plano', danger:true});
}
// a tela "sem plano" era só da corrida: agora se adapta ao módulo
let _runlogHtmlOrig = null;
const _renderRunLogB15 = renderRunLogScreen;
window.renderRunLogScreen = function(){
  const scr = $('scr-runlog'); if(!scr) return _renderRunLogB15.apply(this, arguments);
  if(_runlogHtmlOrig === null) _runlogHtmlOrig = scr.innerHTML;
  if(state.active !== 'lift'){
    if(scr.dataset.modo === 'lift'){ scr.innerHTML = _runlogHtmlOrig; scr.dataset.modo = ''; }
    return _renderRunLogB15.apply(this, arguments);
  }
  const lift = state.modules.lift || {};
  const n = (lift.history||[]).length;
  const quando = lift.planoEncerrado ? new Date(lift.planoEncerrado.at).toLocaleDateString('pt-BR') : null;
  const temCorrida = !!(state.modules.run && state.modules.run.plan);
  scr.dataset.modo = 'lift';
  scr.innerHTML = `<div class="wrap" style="padding-left:16px;padding-right:16px"><div id="runlog-toggle-wrap"></div>
    <div style="text-align:center;margin-top:14px">
      <div style="font-size:52px">🏋️</div>
      <h2 style="margin:8px 0 4px">Musculação sem plano</h2>
      <p style="color:var(--text-dim);font-size:14px;line-height:1.5">${quando ? `Plano encerrado em ${quando}. ` : ''}${n ? `Seus ${n} treinos registrados, cargas, recordes e conquistas continuam salvos.` : 'Seu histórico e suas conquistas continuam salvos.'}</p>
    </div>
    <div class="card" style="margin-top:18px;padding:16px">
      <div class="card-title" style="margin-bottom:4px">🎯 Quer voltar a ter treinos guiados?</div>
      <div class="card-sub" style="margin-bottom:12px">Monte um novo plano de musculação, calistenia ou híbrido. A progressão parte das cargas que você já registrou.</div>
      <button class="btn btn-primary btn-block" onclick="openSetupScreen('lift')">🏋️ Montar plano de musculação</button>
    </div>
    <div class="card" style="margin-top:12px;padding:16px">
      <div class="card-title" style="margin-bottom:4px">📊 Seu histórico</div>
      <div class="card-sub" style="margin-bottom:12px">Treinos antigos, cargas e evolução continuam no Histórico e no Progresso.</div>
      <button class="btn btn-outline btn-block" style="border-color:rgba(var(--primary-rgb),.4)" onclick="goTab('history')">📅 Ver histórico</button>
    </div>
    ${temCorrida ? `<button class="btn btn-ghost btn-block" style="margin-top:14px;color:var(--text-dim)" onclick="switchModule('run')">🏃 Ir para o plano de corrida</button>` : ''}</div>`;
  try{ renderModToggle(); }catch(e){}
};
// Perfil: o botão de encerrar aparece para o módulo ativo (corrida ou musculação)
mtGancho('renderProfile', { depois(){
  try{
    const b = $('pf-cancel-run'); if(!b) return;
    const mod = state.modules[state.active];
    const tem = !!(mod && mod.plan);
    b.classList.toggle('hidden', !tem);
    if(state.active === 'lift'){ b.textContent = '🗑️ Encerrar plano de musculação (manter histórico)'; b.onclick = encerrarPlanoLift; }
    else { b.textContent = '🗑️ Encerrar plano de corrida (manter só registros)'; b.onclick = cancelRunPlan; }
  }catch(e){}
}});
Object.assign(window, { runLimparProva, encerrarPlanoLift });
// "qual meu treino de hoje?" / "treino de hoje" → mesma resposta de "qual o treino de hoje?"
const _maInterpretB15 = maInterpret;
maInterpret = function(txt){
  const t = mtNorm(txt);
  if(!/por ?que/.test(t) && /^(qual|qual e|o que|oque|que)?\s*(e\s*)?(o\s*|meu\s*|o meu\s*)?treino (de|pra|para) hoje\??$|qual (e )?(o )?meu treino (de|pra|para) hoje/.test(t.trim())) return 'proximo';
  return _maInterpretB15.apply(this, arguments);
};

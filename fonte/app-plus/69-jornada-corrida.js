
// =====================================================================
// 69. 2027 RC 0 — Jornada do primeiro passo (corrida) e "por que o plano mudou"
// ---------------------------------------------------------------------
// O motor da corrida (parte 11) NÃO muda: a progressão do iniciante já depende de treinos feitos e do
// esforço informado (2 treinos completos no estágio com esforço até 7/10 para avançar; semana pesada
// repete ou volta um estágio; nada avança só porque passou uma semana). Esta parte só ENSINA e EXPLICA:
//  • Jornada do primeiro passo: 9 lições curtas (começar, por que caminhar, aquecer, esforço, intercalar,
//    respirar, sinais de excesso, evoluir aos poucos, não compensar). Todas ficam abertas (segurança não
//    fica trancada); o app sugere a próxima pelo que aconteceu (esforço alto → sinais; treino perdido →
//    não compensar; senão, a próxima da ordem). Lidas em state.runJornada.lidas (campo novo, opcional).
//  • Cartão na aba Treinos (corrida) para os níveis Iniciante e Iniciante avançado: estágio/minutos
//    contínuos de agora, o que falta para avançar (contado nos registros da semana) e a lição sugerida.
//  • Em todos os níveis, o cartão de status ganha "Última mudança": avançou / manteve / aliviou, com o
//    motivo real da avaliação semanal (motor.hist) e o que mudou.
// Não é orientação médica: os sinais de alerta mandam parar e procurar atendimento.
// =====================================================================
const RUN_JORNADA = [
  { id:'comecar', t:'Como começar', c:[
    'Comece com 3 treinos por semana, com um dia de folga entre eles. O tênis que você já tem serve, desde que não machuque.',
    'Escolha um lugar plano e seguro (pista, parque, rua tranquila ou esteira).',
    'Nas primeiras semanas a meta é terminar o treino <b>bem</b>, não exausto. Sair querendo mais é o sinal certo.',
    'Se você tem doença do coração, pressão alta sem controle, diabetes, está grávida ou já sentiu dor no peito ou tontura ao fazer esforço, converse com um médico antes de começar.' ] },
  { id:'caminhar', t:'Por que começamos caminhando', c:[
    'Coração e pulmão melhoram rápido, em poucas semanas. Ossos, tendões e articulações demoram mais: meses.',
    'Correndo, cada passada recebe 2 a 3 vezes o peso do corpo. A caminhada prepara essas estruturas e cria o hábito com pouco risco.',
    'Por isso o plano começa com caminhada e entra na corrida aos poucos, mesmo que o fôlego já pareça pronto.' ] },
  { id:'aquecer', t:'Aquecer e desaquecer', c:[
    '<b>Antes:</b> 5 minutos de caminhada aumentando o passo, mais alguns círculos de tornozelo e quadril. O corpo esquenta e a respiração se ajusta.',
    '<b>Depois:</b> 3 a 5 minutos caminhando até a respiração voltar ao normal. Alongamento leve de panturrilha e coxa é opcional.',
    'Pular o aquecimento faz os primeiros minutos parecerem muito mais difíceis do que são.' ] },
  { id:'esforco', t:'Controle do esforço', c:[
    '<b>Teste da conversa:</b> correndo, você deve conseguir falar frases curtas. Se não dá para falar, diminua ou caminhe. Isso não é falhar: é treinar certo.',
    '<b>Escala de 1 a 10:</b> caminhada firme fica em 3–4; o trote destes estágios, em 5–6. Acima de 7, está forte demais para esta fase.',
    'Ao registrar o treino, informe o esforço com sinceridade. É com ele que o plano decide se avança, mantém ou alivia.' ] },
  { id:'intercalar', t:'Como intercalar caminhada e corrida', c:[
    'Siga os blocos do estágio (por exemplo, 1 minuto correndo + 2 caminhando). Na caminhada, ande firme: não pare.',
    'Corra num ritmo que pareça <b>lento demais</b>. Se no último bloco ainda sobra fôlego, o ritmo está certo.',
    'Se não aguentar um bloco inteiro, caminhe e retome no próximo. Anote como "parcial": o plano usa isso para ajustar.' ] },
  { id:'respirar', t:'Respiração', c:[
    'Respire pelo nariz e pela boca juntos, sem tentar controlar demais. Muita gente acha um ritmo como 3 passos inspirando e 2 ou 3 expirando, mas o natural vale.',
    'Pontada do lado: diminua o passo, respire fundo, solte o ar devagar e pressione o local. Costuma passar em alguns minutos.',
    'Se a respiração fica ofegante a ponto de não falar, o ritmo está alto: volte a caminhar até recuperar.' ] },
  { id:'sinais', t:'Sinais de que passou do ponto', c:[
    '<b>Pare e procure atendimento</b> se sentir dor ou pressão no peito, falta de ar fora do normal, tontura, desmaio ou batimento muito irregular.',
    '<b>Interrompa o treino</b> com dor que piora correndo, que faz mancar, dor num ponto do osso ou inchaço.',
    'É normal um cansaço muscular leve no dia seguinte, que melhora em 1 a 2 dias. Dor que dura mais de 3 dias ou que piora precisa de avaliação de um profissional de saúde.',
    'Sentiu dor? Informe em <b>Dor ou limitação</b>: o plano troca os treinos por versões com menos impacto.' ] },
  { id:'evoluir', t:'Evoluir aos poucos', c:[
    'O plano não avança porque o calendário virou. Você passa de estágio quando completa <b>2 treinos do estágio atual com esforço até 7/10</b>.',
    'Semana pesada (esforço alto ou treino incompleto) faz o plano repetir ou voltar um estágio. Repetir é normal e faz parte.',
    'Depois do último estágio, o próximo passo é correr sem parar: 12 minutos, aumentando aos poucos até 30.' ] },
  { id:'compensar', t:'Perdeu um treino? Não compense', c:[
    'Não faça dois treinos no mesmo dia nem um treino maior no dia seguinte. Siga o que está planejado para hoje.',
    'Se a semana teve poucos treinos, o plano repete o estágio, sem pressa e sem culpa.',
    'Consistência ao longo das semanas vale muito mais que um treino a mais.' ] }
];
function _rjEstado(){ state.runJornada = state.runJornada && typeof state.runJornada === 'object' ? state.runJornada : {}; state.runJornada.lidas = state.runJornada.lidas || {}; return state.runJornada; }
function _rjLidas(){ const j = state.runJornada; return (j && j.lidas) ? j.lidas : {}; }
// o que aconteceu de verdade nesta semana (só registros) — mesma regra do motor (parte 11, rAplicarDecisao)
function rjSemana(ctx, M){
  const a = rSem(), b = a + 7*DIA_MS; const hoje = getDayIdx();
  const ativ = rAtividades(ctx).filter(r=>r.at>=a && r.at<b && r.activity!=='bike');
  let validos = 0, alvo = 2, regra = '';
  if(M.nivel === 0){
    validos = ativ.filter(r=>(r.tipoSessao==='camcorre' || r.tipoSessao==='caminhada') && r.estagio===M.estagio && r.concluiu!=='nao' && r.concluiu!=='parcial' && (+r.rpe||5)<=7).length;
    regra = 'treinos completos neste estágio com esforço até 7/10';
  } else if(M.nivel === 1){
    validos = ativ.filter(r=>_ehCorrida(r) && rContinua(r) && (+r.duration||0) >= (M.contMin||10)*0.95 && r.concluiu!=='nao' && (+r.rpe||5)<=6).length;
    regra = `corridas de ${M.contMin} min sem parar com esforço até 6/10`;
  }
  const planejados = ((state.modules.run.plan||{}).workouts||[]).map(w=>+w.dayIdx).filter(d=>d < hoje);
  const diasFeitos = new Set(ativ.map(r=>_rjDiaSemana(r.at)));
  const perdidos = planejados.filter(d=>!diasFeitos.has(d)).length;
  const ultimo = ativ.slice(-1)[0] || rAtividades(ctx).slice(-1)[0] || null;
  return { validos, alvo, regra, perdidos, ultimo, nSem: ativ.length };
}
function _rjDiaSemana(t){ const d = new Date(t).getDay(); return d === 0 ? 7 : d; }
function rjSugestao(S){
  const lidas = _rjLidas();
  const u = S && S.ultimo;
  if(u && ((+u.rpe||0) >= 8 || u.concluiu === 'nao') && !lidas.sinais) return { id:'sinais', motivo:'Seu último treino foi bem puxado.' };
  if(S && S.perdidos && !lidas.compensar) return { id:'compensar', motivo:'Ficou treino para trás nesta semana.' };
  const prox = RUN_JORNADA.find(l=>!lidas[l.id]);
  return prox ? { id:prox.id, motivo:'' } : null;
}
function rjMostra(){
  const run = state.modules.run; const M = run && run.plan && run.plan.motor;
  if(!M || state.active !== 'run') return false;
  const j = state.runJornada || {};
  if(j.oculta) return false;
  return M.nivel <= 1;
}
function rjCartao(){
  try{
    const run = state.modules.run; const M = run.plan.motor; const ctx = runCtx();
    const S = rjSemana(ctx, M); const lidas = _rjLidas(); const nLidas = RUN_JORNADA.filter(l=>lidas[l.id]).length;
    const sug = rjSugestao(S);
    let agora = '', falta = '';
    if(M.nivel === 0){
      const ultimoEst = RUN_EST.length - 1;
      agora = M.estagio === 0 ? `<b>Estágio 0:</b> ${rEstagioTxt(0)}` : `<b>Estágio ${M.estagio} de ${ultimoEst}:</b> ${rEstagioTxt(M.estagio)}`;
      falta = `Para avançar: 2 ${S.regra}. Nesta semana: <b>${Math.min(S.validos, 2)} de 2</b>.`;
    } else {
      agora = `<b>Corrida contínua:</b> ${M.contMin} min sem parar`;
      falta = (M.contMin||0) >= 30 ? 'Você chegou aos 30 min: o próximo passo é o nível Intermediário, quando estiver pronto.' : `Para aumentar: 2 ${S.regra}. Nesta semana: <b>${Math.min(S.validos, 2)} de 2</b>.`;
    }
    const barra = `<div class="rj-barra" aria-hidden="true">${RUN_JORNADA.map(l=>`<i class="${lidas[l.id]?'ok':''}"></i>`).join('')}</div>`;
    const L = sug && RUN_JORNADA.find(l=>l.id === sug.id);
    return `<div class="rj-card" id="rj-card">
      <div class="rj-topo"><div><div class="rj-k">Jornada do primeiro passo</div><div class="rj-n">${nLidas} de ${RUN_JORNADA.length} lições</div></div>
        <button class="link-mais" onclick="rjOcultar()" aria-label="Ocultar a jornada">Ocultar</button></div>
      ${barra}
      <div class="rj-agora">${agora}</div>
      <div class="rj-falta">${falta}</div>
      ${L ? `<button class="rj-licao" onclick="rjAbrir('${L.id}')"><span><small>${sug.motivo ? mtEsc(sug.motivo) + ' Leia:' : 'Próxima lição'}</small><b>${mtEsc(L.t)}</b></span><span class="rc-seta">›</span></button>` : `<div class="rj-falta">Você leu todas as lições. Elas continuam aqui quando quiser rever.</div>`}
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="rjAbrir()">Ver todas as lições</button>
    </div>`;
  }catch(e){ console.log('jornada:', e); return ''; }
}
function rjAbrir(id){
  const lidas = _rjLidas();
  if(!id){
    $('modal-inner').innerHTML = `<h3>Jornada do primeiro passo</h3>
      <p class="mt-muted" style="margin:4px 0 10px">Lições curtas para começar a correr com segurança. Ler não muda o seu plano: quem decide o avanço são os treinos que você registra e o esforço que você informa.</p>
      ${RUN_JORNADA.map((l,i)=>`<button class="rj-item ${lidas[l.id]?'ok':''}" onclick="rjAbrir('${l.id}')"><span class="rj-num">${lidas[l.id]?'✓':i+1}</span><span>${mtEsc(l.t)}</span><span class="rc-seta">›</span></button>`).join('')}
      ${(state.runJornada||{}).oculta ? `<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="rjMostrar()">Mostrar a jornada na aba Treinos</button>` : ''}
      <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
    $('modal-back').classList.add('on'); return;
  }
  const i = RUN_JORNADA.findIndex(l=>l.id === id); const L = RUN_JORNADA[i]; if(!L) return;
  const prox = RUN_JORNADA[i+1];
  $('modal-inner').innerHTML = `<h3>${mtEsc(L.t)}</h3><div class="rj-k" style="margin-top:2px">Lição ${i+1} de ${RUN_JORNADA.length}</div>
    <ul class="rj-ul">${L.c.map(p=>`<li>${p}</li>`).join('')}</ul>
    <div class="row" style="gap:8px;margin-top:14px">
      <button class="btn btn-ghost btn-block" onclick="rjLida('${L.id}', null)">Todas as lições</button>
      <button class="btn btn-primary btn-block" onclick="rjLida('${L.id}', ${prox ? `'${prox.id}'` : 'false'})">${prox ? 'Entendi · próxima' : 'Entendi'}</button>
    </div>`;
  $('modal-back').classList.add('on');
}
function rjLida(id, prox){
  const j = _rjEstado(); if(!j.lidas[id]){ j.lidas[id] = Date.now(); saveData(); }
  if(prox) return rjAbrir(prox);
  if(prox === null) return rjAbrir();
  closeModal(); try{ if(state.ui && state.ui.tab === 'sessions') renderSessions(); }catch(e){}
}
function rjOcultar(){ const j = _rjEstado(); j.oculta = true; saveData(); try{ renderSessions(); }catch(e){} toast('Jornada oculta. Dá para ver de novo em Evolução da corrida.'); }
function rjMostrar(){ const j = _rjEstado(); j.oculta = false; saveData(); closeModal(); try{ goTab('sessions'); }catch(e){} }

// "Última mudança" no cartão de status (todos os níveis), com o motivo real da avaliação da semana
const RJ_DEC = {
  avancar:['Avançou', 'você cumpriu o plano com esforço controlado'],
  manter:['Manteve', 'o plano espera sinais claros nos registros antes de aumentar'],
  recuar:['Aliviou', 'menos carga por segurança, para o corpo assimilar'],
  retomada:['Retomada', 'volta gradual depois da pausa']
};
function rjUltimaDecisao(M){
  const h = (M.hist||[]).filter(x=>x && x.decisao && x.decisao !== 'pausa').slice(-1)[0];
  if(!h || !RJ_DEC[h.decisao]) return '';
  const [nome, porque] = RJ_DEC[h.decisao];
  const motivo = h.motivo ? h.motivo.charAt(0).toUpperCase() + h.motivo.slice(1) : '';
  return `<div class="run-st-dec"><div class="rj-k">Última mudança · semana de ${mtFmtData(h.sem)}</div>
    <div><b>${nome}</b>${h.mudou ? `: ${mtEsc(h.mudou)}` : ''}.</div>
    <div class="mt-muted">${motivo ? mtEsc(motivo) + '.' : 'Por quê: ' + porque + '.'}${h.decisao === 'recuar' ? ' Aliviar é segurança, não castigo: o plano volta a crescer quando os registros mostrarem folga.' : ''}</div></div>`;
}
(function(){
  const _st = window.runStatusCard; if(typeof _st !== 'function') return;
  window.runStatusCard = function(){
    let h = _st.apply(this, arguments);
    try{
      const M = state.modules.run && state.modules.run.plan && state.modules.run.plan.motor; if(!M || !h) return h;
      const dec = rjUltimaDecisao(M);
      if(dec) h = h.replace('<div class="run-st-a">', dec + '<div class="run-st-a">');
    }catch(e){}
    return h;
  };
})();
mtGancho('renderSessions', { depois(){
  try{
    const velho = $('rj-card'); if(velho) velho.remove();
    if(!rjMostra()) return;
    const st = $('run-st'); if(st) st.insertAdjacentHTML('afterend', rjCartao());
  }catch(e){}
}});
// atalho no painel de evolução (para quem ocultou ou já passou do nível iniciante)
mtGancho('openRunPainel', { depois(dados){
  try{
    if(dados) return; const mi = $('modal-inner'); if(!mi || mi.querySelector('#rj-atalho')) return;
    const f = [...mi.querySelectorAll('.btn')].pop(); if(!f) return;
    f.insertAdjacentHTML('beforebegin', `<button class="btn btn-ghost btn-block" id="rj-atalho" style="margin-top:12px" onclick="rjAbrir()">Jornada do primeiro passo (lições)</button>`);
  }catch(e){}
}});
(function(){ if(document.getElementById('rj-css')) return; const s = document.createElement('style'); s.id = 'rj-css';
s.textContent = `
.rj-card{margin:12px 0;padding:14px;border-radius:var(--radius-card,18px);border:1px solid var(--border);background:var(--surface)}
.rj-topo{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.rj-k{font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--text-mute)}
.rj-n{font-weight:800;font-size:15px;margin-top:2px}
.rj-barra{display:flex;gap:4px;margin:10px 0}
.rj-barra i{flex:1;height:5px;border-radius:5px;background:var(--surface-2)}
.rj-barra i.ok{background:var(--primary)}
.rj-agora{font-size:13.5px;line-height:1.5}
.rj-falta{font-size:12.5px;color:var(--text-dim);line-height:1.5;margin-top:4px}
.rj-licao{width:100%;margin-top:10px;display:flex;align-items:center;gap:10px;text-align:left;padding:12px;border-radius:14px;border:1px solid var(--border-strong);background:var(--bg-2);color:var(--text);font:inherit;cursor:pointer}
.rj-licao span:first-child{flex:1;display:flex;flex-direction:column;gap:2px}
.rj-licao small{font-size:11.5px;color:var(--text-dim)}
.rj-item{width:100%;display:flex;align-items:center;gap:10px;padding:11px 4px;border:none;border-bottom:1px solid var(--border);background:none;color:var(--text);font:inherit;font-weight:700;text-align:left;cursor:pointer}
.rj-item span:nth-child(2){flex:1}
.rj-num{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:12px;background:var(--surface-2);color:var(--text-dim);flex:none}
.rj-item.ok .rj-num{background:var(--primary);color:var(--on-primary,#000)}
.rj-ul{margin:10px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:9px;font-size:14px;line-height:1.55}
.run-st-dec{margin:10px 0 2px;padding:10px 12px;border-radius:12px;background:var(--bg-2);font-size:13px;line-height:1.5}
.run-st-dec .mt-muted{font-size:12px}
`; document.head.appendChild(s); })();

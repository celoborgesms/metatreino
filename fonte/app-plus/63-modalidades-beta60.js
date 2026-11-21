// =====================================================================
// 63. Beta 60 — corrida é corrida, musculação é musculação
// ---------------------------------------------------------------------
//  • Progresso › Evolução: só os gráficos da modalidade ativa. Na corrida saem Peso, Volume,
//    Calistenia e Isometria; na musculação saem Corrida, Ritmo, Caminhada e Bike. Frequência e
//    Tempo de treino contam só as sessões da modalidade ativa.
//  • Personalizar progresso: "Calistenia" é bloco da musculação (não aparece na lista da corrida).
//  • (Beta 60 tinha "Personalizar treinos"; retirado na Beta 61 — ver abaixo.)
//  • O cartão "Dicas para esta sessão" (mesma frase todos os dias) saiu do app.js. A única parte que
//    mudava o treino — o formato em circuito do objetivo Resistência — virou o bloco "Como fazer o
//    circuito", que só aparece para esse objetivo (e também pode ser escondido).
// =====================================================================

// ---------- Evolução por modalidade ----------
const EVO_SO = { lift:['peso','volume','cali_reps','cali_iso'], run:['run','pace','walk','bike','bikev'] };
(function(){
  const _M = window.mtMetricas;
  window.mtMetricas = function(){
    const M = _M.apply(this, arguments);
    try{
      const mk = state.active === 'run' ? 'run' : 'lift'; const outro = mk === 'run' ? 'lift' : 'run';
      const hMod = ()=>(((state.modules[mk]||{}).history)||[]).filter(x=>x && x.at);
      return M.filter(m=>!EVO_SO[outro].includes(m.k)).map(m=>{
        if(m.k === 'freq') return Object.assign({}, m, { serie:bs=>bs.map(b=>({ v:new Set(hMod().filter(x=>x.at>=b.a && x.at<b.b).map(x=>mtDia0(x.at))).size, b })) });
        if(m.k === 'tempo') return Object.assign({}, m, { serie:bs=>bs.map(b=>({ v:Math.round(hMod().filter(x=>x.at>=b.a && x.at<b.b).reduce((s,x)=>s+(+x.duration||0),0)), b })) });
        return m;
      });
    }catch(e){ return M; }
  };
})();
try{ const b = PERF_BLOCOS.find(x=>x.k === 'calistenia'); if(b){ b.mod = 'lift'; b.desc = 'só na musculação, se você usa'; } }catch(e){}

// ---------- Formato em circuito (objetivo Resistência) ----------
// Beta 61: o "Personalizar treinos" (Beta 60) foi retirado. Os blocos da tela de Treinos são redesenhados por várias
// partes em momentos diferentes, então esconder um bloco "pegava" às vezes e às vezes não — e os poucos blocos
// que dava para esconder não justificavam o botão. Fica só o que muda o treino: como fazer o circuito.
// (state.treinosMod de quem chegou a usar fica parado na conta, sem efeito.)
function _tpCircuito(){
  try{
    if(state.active !== 'lift' || ((state.modules.lift||{}).setup||{}).goal !== 'resistencia') return;
    const slot = $('session-detail-slot'); if(!slot || $('tp-circuito')) return;
    const bloco = slot.querySelector('.block'); if(!bloco) return;
    bloco.insertAdjacentHTML('beforebegin', `<div id="tp-circuito" class="card card-info card-row" style="margin:10px 0"><div class="card-icon">🔁</div><div><div class="card-title info">Como fazer o circuito</div><div class="card-sub">Faça um exercício depois do outro com pouco descanso; no fim de cada volta, descanse 60–90 s. Faça 2 a 3 voltas.</div></div></div>`);
  }catch(e){}
}
mtGancho('renderSessions', { depois(){ _tpCircuito(); } });
mtGancho('selectSession', { depois(){ _tpCircuito(); } });
mtGancho('goTab', { depois(t){ if(t === 'sessions') _tpCircuito(); } });

(function(){ if(document.getElementById('b60-css')) return; const s = document.createElement('style'); s.id = 'b60-css';
  s.textContent = `
.bh-n{ flex:none; width:10px; height:10px; margin:0 6px 0 4px; border-radius:50%; background:var(--primary); opacity:.85; }
`;
  document.head.appendChild(s); })();

// =====================================================================
// 63. Beta 60 — corrida é corrida, musculação é musculação
// ---------------------------------------------------------------------
//  • Progresso › Evolução: só os gráficos da modalidade ativa. Na corrida saem Peso, Volume,
//    Calistenia e Isometria; na musculação saem Corrida, Ritmo, Caminhada e Bike. Frequência e
//    Tempo de treino contam só as sessões da modalidade ativa.
//  • Personalizar progresso: "Calistenia" é bloco da musculação (não aparece na lista da corrida).
//  • Treinos: "Personalizar treinos", por modalidade (state.treinosMod.lift / .run, independentes).
//    Esconde só blocos de apoio — atalhos, programação semanal, frase de foco, resumo, andamento,
//    orientações, "por que este treino", finalizador de cardio, ajuda. Exercícios, séries, cronômetro
//    e os botões de salvar/pular NUNCA podem ser escondidos. É de graça: tirar o que não é útil não é recurso Premium.
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

// ---------- Personalizar treinos (por modalidade) ----------
const TREINO_BLOCOS = [
  { k:'atalhos',     nome:'Atalhos do topo',            desc:'Meu plano, Biblioteca, Importar',          sel:()=>[$('sess-qlinks')] },
  { k:'programacao', nome:'Programação semanal',        desc:'meta, semana do plano e treinos por semana', sel:()=>{ const w = $('weekly-info'); return [w && w.closest('.card')]; } },
  { k:'foco',        nome:'Frase de foco do treino',    desc:'a frase abaixo do nome do treino',          sel:()=>[...document.querySelectorAll('#session-detail-slot .today-desc')] },
  { k:'resumo',      nome:'Resumo do treino',           desc:'duração, exercícios ou distância e dia',    sel:()=>[...document.querySelectorAll('#session-detail-slot .info-grid')] },
  { k:'andamento',   nome:'Andamento do treino',        desc:'quantos exercícios já foram registrados',   mod:'lift', sel:()=>[...document.querySelectorAll('#session-detail-slot .tr-anda')] },
  { k:'circuito',    nome:'Como fazer o circuito',      desc:'só no objetivo Resistência',                mod:'lift', sel:()=>[$('tp-circuito')] },
  { k:'orientacoes', nome:'Orientações do treino',      desc:'fases do treino e músculos trabalhados',    mod:'lift', sel:()=>[...document.querySelectorAll('#session-detail-slot .mg-card')] },
  { k:'finalizador', nome:'Finalizador de cardio',      desc:'sugestão de cardio em treinos curtos',      mod:'lift', sel:()=>[...document.querySelectorAll('#session-detail-slot .hl-warn')] },
  { k:'porque',      nome:'Por que este treino',        desc:'tipo, objetivo e intensidade',              mod:'run',  sel:()=>[...document.querySelectorAll('#session-detail-slot .run-why')] },
  { k:'orientacoesr',nome:'Orientações da corrida',     desc:'lembretes de segurança e de ritmo',         mod:'run',  sel:()=>[...document.querySelectorAll('#session-detail-slot .run-orient')] },
  { k:'ajuda',       nome:'"Dúvidas? Fale com o treinador"', desc:'atalho para o Meta Assistente',        sel:()=>[...document.querySelectorAll('#scr-sessions .help')] }
];
function _tpMod(){ return state && state.active === 'run' ? 'run' : 'lift'; }
function _tpNomeMod(){ return _tpMod() === 'run' ? 'Corrida' : 'Musculação'; }
function _tpCfg(mk){
  mk = mk || _tpMod();
  if(!state.treinosMod || typeof state.treinosMod !== 'object') state.treinosMod = {};
  if(!state.treinosMod[mk]) state.treinosMod[mk] = { ocultos: [] };
  if(!Array.isArray(state.treinosMod[mk].ocultos)) state.treinosMod[mk].ocultos = [];
  return state.treinosMod[mk];
}
function _tpBlocos(){ const mk = _tpMod(); const res = ((state.modules.lift||{}).setup||{}).goal === 'resistencia';
  return TREINO_BLOCOS.filter(b=>(!b.mod || b.mod === mk) && (b.k !== 'circuito' || res)); }
function _tpCircuito(){
  try{
    if(_tpMod() !== 'lift' || ((state.modules.lift||{}).setup||{}).goal !== 'resistencia') return;
    const slot = $('session-detail-slot'); if(!slot || $('tp-circuito')) return;
    const bloco = slot.querySelector('.block'); if(!bloco) return;
    bloco.insertAdjacentHTML('beforebegin', `<div id="tp-circuito" class="card card-info card-row" style="margin:10px 0"><div class="card-icon">🔁</div><div><div class="card-title info">Como fazer o circuito</div><div class="card-sub">Faça um exercício depois do outro com pouco descanso; no fim de cada volta, descanse 60–90 s. Faça 2 a 3 voltas.</div></div></div>`);
  }catch(e){}
}
function treinosAplica(){
  try{
    if(!state || !state.user || !$('scr-sessions')) return;
    _tpCircuito();
    const oc = _tpCfg().ocultos;
    TREINO_BLOCOS.forEach(b=>{ let els = []; try{ els = (b.sel()||[]).filter(Boolean); }catch(e){}
      const esconde = oc.includes(b.k) && (!b.mod || b.mod === _tpMod());
      els.forEach(el=>el.classList.toggle('tp-oculto', esconde)); });
    const wrap = document.querySelector('#scr-sessions .wrap'); if(!wrap) return;
    let a = $('treinos-personalizar');
    if(!a){ a = document.createElement('div'); a.id = 'treinos-personalizar'; a.className = 'tp-link'; wrap.appendChild(a); }
    else if(a !== wrap.lastElementChild) wrap.appendChild(a);
    const n = _tpBlocos().filter(b=>oc.includes(b.k)).length;
    const html = `<a href="#" onclick="openPersonalizarTreinos();return false">⚙️ Personalizar treinos · ${_tpNomeMod().toLowerCase()}</a>${n ? ` · ${n} ${n===1?'bloco oculto':'blocos ocultos'}` : ''}`;
    if(a.innerHTML !== html) a.innerHTML = html;
  }catch(e){ console.log('personalizar treinos:', e); }
}
function openPersonalizarTreinos(){
  const mi = $('modal-inner'); mi.classList.remove('modal-video','modal-ex');
  const oc = _tpCfg().ocultos;
  mi.innerHTML = `<h3>⚙️ Personalizar treinos · ${_tpNomeMod()}</h3>
    <p class="mt-muted" style="margin:0 0 10px;font-size:12.5px;line-height:1.5">Desligue o que não ajuda no seu treino de <b>${_tpNomeMod().toLowerCase()}</b>. A outra modalidade tem a própria escolha. Exercícios, séries e os botões de salvar continuam sempre.</p>
    <div class="card pi-lista">${_tpBlocos().map(b=>`<label class="pi-row"><span class="pi-txt"><b>${b.nome}</b><small>${b.desc}</small></span>
      <input type="checkbox" class="pi-sw" data-k="${b.k}" ${oc.includes(b.k)?'':'checked'} onchange="tpAlterar(this)"></label>`).join('')}</div>
    <button type="button" class="btn btn-ghost btn-block" style="margin-top:12px" onclick="tpPadrao()">Mostrar tudo de novo</button>
    <button class="btn btn-primary btn-block" style="margin-top:8px" onclick="closeModal();goTab('sessions')">Pronto</button>`;
  $('modal-back').classList.add('on');
}
function tpAlterar(el){
  const c = _tpCfg(); const k = el.dataset.k;
  c.ocultos = el.checked ? c.ocultos.filter(x=>x!==k) : [...new Set([...c.ocultos, k])];
  saveData(); treinosAplica();
}
function tpPadrao(){ _tpCfg().ocultos = []; saveData(); treinosAplica(); openPersonalizarTreinos(); toast(`Treinos de ${_tpNomeMod().toLowerCase()} com tudo à mostra`); }
mtGancho('renderSessions', { depois(){ treinosAplica(); } });
mtGancho('selectSession', { depois(){ treinosAplica(); } });
mtGancho('goTab', { depois(t){ if(t === 'sessions') treinosAplica(); } });
Object.assign(window, { openPersonalizarTreinos, tpAlterar, tpPadrao, treinosAplica });

(function(){ if(document.getElementById('b60-css')) return; const s = document.createElement('style'); s.id = 'b60-css';
  s.textContent = `
.tp-oculto{ display:none !important; }
.tp-link{ text-align:center; font-size:12.5px; color:var(--text-dim); margin:18px 0 6px; }
.tp-link a{ color:var(--primary-2); font-weight:600; text-decoration:none; }
`;
  document.head.appendChild(s); })();

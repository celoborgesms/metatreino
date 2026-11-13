
// =====================================================================
// 35. Beta 25 — Plano alimentar: excluir/editar sem voltar ao topo
// =====================================================================
// Toda ação do plano alimentar (remover, editar, adicionar, voltar ao recomendado)
// redesenha a janela com openNutri(). Antes a rolagem voltava ao início e o aluno
// tinha de procurar o jantar de novo a cada alimento. Agora:
//  • a posição da rolagem é guardada enquanto o aluno está na lista;
//  • ao voltar de uma edição (ou depois de remover), a lista reabre no mesmo ponto;
//  • a refeição continua aberta (já era guardada em __nutriAbertos);
//  • o foco volta para o item vizinho do que foi removido (ou para a refeição).
// Abrir o plano alimentar "do zero" (pela tela inicial) continua começando do topo.
let _nutriRol = [];          // rolagem da janela e das listas roláveis dentro dela (na ordem em que aparecem)
let _nutriFoco = null;
function _nutriMi(){ return document.getElementById('modal-inner'); }
function _nutriEmTela(){ const mi = _nutriMi(); return !!(mi && document.getElementById('modal-back').classList.contains('on') && (mi.dataset.tela === 'nutri' || mi.dataset.tela === 'nutri-sub')); }
function _nutriRolaveis(){
  const mi = _nutriMi(); if(!mi) return [];
  return [mi, ...[...mi.querySelectorAll('*')].filter(e=>/(auto|scroll)/.test(getComputedStyle(e).overflowY))];
}
function _nutriLeRol(){ return _nutriRolaveis().map(e=>e.scrollTop); }
function _nutriAplicaRol(pos){ const els = _nutriRolaveis(); (pos||[]).forEach((v,i)=>{ if(els[i]) els[i].scrollTop = v; }); }
(function(){
  const mi = _nutriMi(); if(!mi || mi.dataset.nutriRol) return; mi.dataset.nutriRol = '1';
  // "scroll" não sobe pela árvore, mas pode ser capturado: pega a janela e as listas internas
  mi.addEventListener('scroll', ()=>{ if(mi.dataset.tela === 'nutri') _nutriRol = _nutriLeRol(); }, { passive:true, capture:true });
})();
// guarda qual controle estava em foco (e de qual refeição) antes de redesenhar
function _nutriGuardaFoco(){
  const a = document.activeElement; const mi = _nutriMi();
  if(!a || !mi) { _nutriFoco = null; return; }
  const oc = a.getAttribute('onclick') || '';
  const m = oc.match(/'([^']+)'/);
  // vindo de uma tela interna (editar/adicionar), volta o foco para a refeição que estava sendo mexida
  const midSub = (window.__ned && window.__ned.mid) || window.__nutriAddMid || null;
  _nutriFoco = (m && /nutri(Remover|Editar|AddEditar|AddAbrir|ResetRefeicao)/.test(oc)) ? { oc, mid:m[1] } : { oc:null, mid:midSub };
}
function _nutriRestauraFoco(){
  const f = _nutriFoco; _nutriFoco = null; const mi = _nutriMi(); if(!f || !mi) return;
  let alvo = null;
  try{
    if(f.oc) alvo = [...mi.querySelectorAll('[onclick]')].find(e=>e.getAttribute('onclick') === f.oc);
    if(!alvo && f.mid) alvo = [...mi.querySelectorAll('[onclick]')].find(e=>(e.getAttribute('onclick')||'').includes("'"+f.mid+"'"));
  }catch(e){}
  if(alvo && alvo.focus) try{ alvo.focus({ preventScroll:true }); }catch(e){}
}
const _openNutriB25 = window.openNutri;
window.openNutri = function(){
  const voltando = _nutriEmTela();
  const pos = voltando ? _nutriRol.slice() : [];
  if(voltando) _nutriGuardaFoco();
  const mi = _nutriMi(); if(mi) mi.dataset.tela = 'nutri';
  const r = _openNutriB25.apply(this, arguments);
  if(mi){
    mi.dataset.tela = 'nutri';
    _nutriAplicaRol(pos); _nutriRol = pos;
    // o navegador pode recalcular a altura depois de desenhar: confirma no próximo quadro
    requestAnimationFrame(()=>{ if(mi.dataset.tela === 'nutri'){ _nutriAplicaRol(pos); _nutriRol = _nutriLeRol(); } _nutriRestauraFoco(); });
  }
  return r;
};
// telas internas do plano (editar quantidade, adicionar, alimento próprio): marcar ANTES de trocar o conteúdo
['nutriEdRender','nutriAddRender','nutriAddCustom','nutriListaCompras'].forEach(nome=>{
  const orig = window[nome]; if(typeof orig !== 'function') return;
  window[nome] = function(){ const mi = _nutriMi(); if(mi && _nutriEmTela()) mi.dataset.tela = 'nutri-sub'; const r = orig.apply(this, arguments); if(mi && mi.dataset.tela === 'nutri-sub') mi.scrollTop = 0; return r; };
});
// fechar a janela: a próxima abertura começa do topo
mtGancho('closeModal', { depois(){ const mi = _nutriMi(); if(mi) delete mi.dataset.tela; _nutriRol = []; } });

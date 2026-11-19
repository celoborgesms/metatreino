
// =====================================================================
// 52. Beta 49 (2) — Plano alimentar e Alimentação da casa sem "piscar" e sem voltar ao topo; tabela dos planos
// =====================================================================
// CAUSA: cada toque (tirar um alimento, marcar "comi", marcar um dia/refeição da casa, "já tenho" na lista)
// redesenha a janela inteira. (1) a janela fazia a animação de "troca de conteúdo" a cada redesenho (piscada);
// (2) a rolagem era restaurada pelo NÚMERO antes de os blocos extras (casa, receitas, PDF) serem inseridos, então
// o conteúdo "andava"; a tela da casa e a lista de compras sempre iam para o topo.
// AGORA: quando a tela redesenhada é a MESMA, não anima e a rolagem volta ancorada no mesmo bloco (a refeição,
// o item da lista ou o cartão que estava no topo da área visível), depois que tudo foi desenhado.

function _mtRolaveis(mi){ return [mi, ...[...mi.querySelectorAll('div')].filter(e=>e.scrollHeight > e.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(e).overflowY))]; }
// guarda: para cada área rolável, o primeiro bloco visível (por uma chave estável) e a distância dele ao topo
function _mtAncora(mi, sel, chave){
  return _mtRolaveis(mi).map((c, i)=>{
    const top = c.getBoundingClientRect().top;
    const el = [...c.querySelectorAll(sel)].find(e=>e.getBoundingClientRect().bottom > top + 2);
    return { i, st: c.scrollTop, k: el ? chave(el) : null, d: el ? el.getBoundingClientRect().top - top : 0 };
  });
}
function _mtRestaura(mi, anc, sel, chave){
  const cs = _mtRolaveis(mi);
  anc.forEach(a=>{
    const c = cs[a.i]; if(!c) return;
    c.scrollTop = a.st;
    if(a.k == null) return;
    const el = [...c.querySelectorAll(sel)].find(e=>chave(e) === a.k); if(!el) return;
    c.scrollTop += (el.getBoundingClientRect().top - c.getBoundingClientRect().top) - a.d;
  });
}
// embrulha uma função de tela: se a tela já está aberta, redesenha sem animar e no mesmo ponto
function mtMesmaTela(nome, estaNaTela, sel, chave){
  const orig = window[nome]; if(typeof orig !== 'function') return;
  window[nome] = function(){
    const mi = document.getElementById('modal-inner'), back = document.getElementById('modal-back');
    const mesma = !!(mi && back && back.classList.contains('on') && estaNaTela(mi));
    if(!mesma) return orig.apply(this, arguments);
    const anc = _mtAncora(mi, sel, chave);
    window.__mtMesmaTela = true;
    let r;
    try{ r = orig.apply(this, arguments); }
    finally{
      try{ _mtRestaura(mi, anc, sel, chave); }catch(e){}
      requestAnimationFrame(()=>{ try{ if(estaNaTela(mi)) _mtRestaura(mi, anc, sel, chave); }catch(e){} window.__mtMesmaTela = false; });
    }
    return r;
  };
}
const _mtChaveBloco = e=>e.getAttribute('ontoggle') || e.getAttribute('onclick') || e.id || (e.textContent||'').slice(0, 40);
// plano alimentar: âncora = a refeição (ou o bloco) no topo da área visível
mtMesmaTela('openNutri', mi=>mi.dataset.tela === 'nutri' && !!mi.querySelector('.ndays'), 'details.mealc, .mealc, .card', _mtChaveBloco);
// tela da casa: âncora = os blocos de refeição/membros
mtMesmaTela('openFamilia', mi=>!!mi.querySelector('#fam-tela'), '.fam-ref, .fam-membro, .fam-sec, .fam-chips, .mod-toggle, .btn', _mtChaveBloco);
// lista de compras: âncora = o item da lista
mtMesmaTela('nutriListaCompras', mi=>!!mi.querySelector('#fam-compras'), '.mrow, .section-lbl', e=>(e.textContent||'').replace(/[☐☑]/g,'').trim().slice(0, 40));
// ---------- tabela "Planos do MetaTreino": nada cortado, sem arrastar para o lado ----------
(function(){ if(document.getElementById('b49b-css')) return; const s = document.createElement('style'); s.id = 'b49b-css';
  s.textContent = `
.pl-tabela-wrap{overflow-x:visible}
.pl-tabela{table-layout:fixed;width:100%}
.pl-tabela th:first-child,.pl-tabela td:first-child{width:50%}
.pl-tabela th:nth-child(2),.pl-tabela td:nth-child(2),.pl-tabela th:nth-child(3),.pl-tabela td:nth-child(3){width:25%}
.pl-tabela td.sim,.pl-tabela td.nao{white-space:normal;overflow-wrap:anywhere;hyphens:auto;font-size:12px;line-height:1.3}
.pl-tabela td{overflow-wrap:anywhere}
`; document.head.appendChild(s); })();

Object.assign(window, { mtMesmaTela });


// =====================================================================
// 78. RC 2 — Início enxuto para contas novas (Gratuito e Premium iguais)
// ---------------------------------------------------------------------
// Antes: conta nova via TODOS os blocos da Home (indicadores, água, frase, fase do plano…), e quem não usa
// precisava descobrir "Personalizar início" para limpar. Agora a conta NOVA começa com o essencial:
// treino de hoje, semana, atividade da semana, sugestão, desafio do mês, peso, alimentação e conquistas.
// Ficam desligados (um toque em "Personalizar início" liga): Água, Frase do dia e Fase do plano.
// Contas que já têm histórico ou que já mexeram na personalização NÃO mudam (e só roda ao concluir o cadastro).
// O que o plano Gratuito não tem continua sendo tratado pelas regras de cada bloco (parte 36).
// =====================================================================
const INICIO_PADRAO_NOVO = ['agua', 'frase', 'plano'];
function mtInicioPadraoNovo(){
  try{
    if(!state || state.inicioPadraoRC2) return false;
    const temHist = ['lift','run'].some(mk=>(((state.modules[mk]||{}).history)||[]).length > 0);
    if(Array.isArray(state.inicioOcultos) || temHist || state.inicioEnxuto){ state.inicioPadraoRC2 = 1; return false; }
    state.inicioOcultos = INICIO_PADRAO_NOVO.slice(); state.inicioPadraoRC2 = 1;
    try{ aplicaInicio(); }catch(e){}
    saveData(); return true;
  }catch(e){ return false; }
}
// só no CADASTRO de uma conta nova (fim do questionário inicial). Antes estava na abertura do app, mas a
// cópia da nuvem pode chegar depois da abertura: uma conta antiga pareceria "nova" por um instante.
mtGancho('saveQuiz', { depois(){ setTimeout(mtInicioPadraoNovo, 200); } });
// Plano Gratuito: o Início só tem "Completo" e "Só o essencial" (parte 36) e ignora a escolha bloco a bloco.
// Sem isto, a conta nova voltaria a ver TUDO quando o Teste Premium acabasse. Agora existe o modo "Padrão"
// (o mesmo enxuto da conta nova) também no Gratuito, e a conta nova começa nele.
(function(){
  const _oc = window.inicioOcultos;
  window.inicioOcultos = function(){
    try{
      const gratis = typeof _planoConhecido === 'function' && _planoConhecido() && typeof mtTem === 'function' && !mtTem('inicioCompleto');
      if(gratis && state.inicioBasico === 'padrao'){
        let oc = INICIO_PADRAO_NOVO.slice();
        if(!mtTem('alimentacao') && !oc.includes('alimentacao')) oc = oc.concat('alimentacao');
        return oc;
      }
    }catch(e){}
    return _oc.apply(this, arguments);
  };
  const _ab = window.openPersonalizarInicio;
  window.openPersonalizarInicio = function(){
    const r = _ab.apply(this, arguments);
    try{
      if(typeof mtTem === 'function' && mtTem('inicioCompleto')) return r;
      const ops = document.querySelector('#modal-inner .pl-opcoes'); if(!ops || ops.querySelector('[data-pd]')) return r;
      const pd = state.inicioBasico === 'padrao';
      if(pd) ops.querySelectorAll('.pl-op').forEach(b=>b.classList.remove('on'));
      ops.insertAdjacentHTML('afterbegin', `<button type="button" data-pd="1" class="pl-op ${pd?'on':''}" onclick="piBasicoPadrao()"><b>Padrão</b><small>treino, semana, indicadores e desafios (sem água, frase e fase do plano)</small></button>`);
    }catch(e){}
    return r;
  };
})();
function piBasicoPadrao(){ state.inicioBasico = 'padrao'; saveData(); aplicaInicio(); openPersonalizarInicio(); }
(function(){
  const _novo = window.mtInicioPadraoNovo;
  window.mtInicioPadraoNovo = function(){ const r = _novo.apply(this, arguments); try{ if(r && !state.inicioBasico){ state.inicioBasico = 'padrao'; saveData(); } }catch(e){} return r; };
})();

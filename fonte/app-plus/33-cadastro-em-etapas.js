// ---------- 33. PRIMEIRO ACESSO: CONTROLE DE ACESSO, CADASTRO EM ETAPAS, TEMA, ÍCONES (Beta 38) ----------
// 1. Controle de acesso. O cadastro inicial só termina com o questionário respondido E o primeiro plano
//    criado. Até lá nenhuma aba, atalho ou comando do Meta Assistente leva para dentro do app. A checagem
//    fica na lógica (goTab, showScreen, openAssistant, maAsk, maAskText, maTryCommand), não só no botão:
//    um chamado direto pelo console ou por um link interno também esbarra nela.
//    Continua livre antes de terminar: escolher o tema, o Painel ADM (admin) e sair da conta.
// 2. Cadastro em etapas. As telas de sempre (questionário, escolha do módulo, montar plano) passam a
//    mostrar uma etapa por vez, com progresso, Voltar/Continuar, validação por etapa e revisão no fim.
//    Os campos são os MESMOS do HTML: nada de formulário paralelo. Quem cria o plano continua sendo
//    saveQuiz() e finishSetup(m), com as mesmas regras (quizErro / setupErroDias no app.js).
// 3. Tema na primeira etapa, com prévias reais (cada prévia usa as cores de verdade do tema).
//    Areia aparece como sugestão, sem ser marcado à força. A escolha vale no aparelho (como sempre) e
//    também fica na conta (state.prefs.tema): num aparelho novo, sem tema próprio, a conta manda.
// 4. Ícones desenhados para o cadastro (nada de emoji) e desenho próprio de cada equipamento.
// 5. Desenhos discretos por etapa (no mesmo sistema da parte 22). Na corrida, um mapa ilustrativo:
//    o percurso avança conforme as etapas. Não é mapa real e não mostra distância nenhuma.

const CAD_TELAS_APP = ['scr-home','scr-sessions','scr-library','scr-plan','scr-challenges','scr-perf','scr-history','scr-profile','scr-runlog'];
const CAD_TELAS = ['scr-quiz','scr-pick','scr-setup-lift','scr-setup-run'];
const CAD_MSG = 'O Meta Assistente fica disponível assim que você concluir o cadastro inicial. Ele usa as suas respostas e o seu plano para responder.';

function cadastroPronto(){
  try{
    const p = state && state.user && state.user.profile;
    return !!(p && p.quiz_done && state.modules && (state.modules.lift || state.modules.run));
  }catch(e){ return false; }
}
function cadBloqueado(){ return !!(typeof state !== 'undefined' && state && state.user) && !cadastroPronto(); }
function cadTelaAtiva(){ const t = document.querySelector('.screen.active'); return t ? t.id : ''; }
function cadEscondeAssistente(){
  const fab = document.getElementById('ma-fab'); if(fab) fab.classList.add('hidden');
  const b = document.getElementById('fab-bubble'); if(b) b.style.display = 'none';
}
// leva para a etapa certa do cadastro (questionário ou escolha do módulo)
function irParaCadastro(){
  const p = state.user && state.user.profile;
  if(!p || !p.quiz_done){ showScreen('scr-quiz'); bindOpts('scr-quiz'); try{ mostraAtalhoAdmin('quiz-admin-btn'); }catch(e){} }
  else showPickScreen();
  const tb = $('tabbar'); if(tb) tb.classList.add('hidden');
}

// ---- 1. controle de acesso ----
const _goTabCad = window.goTab;
window.goTab = function(tab){
  if(cadBloqueado()){
    // já está numa tela do cadastro: fica nela (sem perder a etapa); senão, volta para o cadastro
    if(CAD_TELAS.includes(cadTelaAtiva())){ const tb = $('tabbar'); if(tb) tb.classList.add('hidden'); }
    else irParaCadastro();
    return;
  }
  return _goTabCad.apply(this, arguments);
};
mtGancho('showScreen', { depois(id){
  try{
    const app = CAD_TELAS_APP.includes(id);
    if(app && cadBloqueado()){ irParaCadastro(); return; }
    if(!app || cadBloqueado()) cadEscondeAssistente();
    if(CAD_TELAS.includes(id)){ const tb = $('tabbar'); if(tb) tb.classList.add('hidden'); wzEntrou(id); }
  }catch(e){ console.log('cadastro (tela):', e); }
}});
const _openAssistantCad = window.openAssistant;
window.openAssistant = function(){
  if(cadBloqueado()){
    $('modal-inner').innerHTML = `<h3>Meta Assistente</h3><p style="color:var(--text-dim);font-size:13.5px;line-height:1.55;margin:6px 0 16px">${CAD_MSG}</p><button class="btn btn-primary btn-block" onclick="closeModal()">Continuar o cadastro</button>`;
    $('modal-back').classList.add('on');
    return;
  }
  return _openAssistantCad.apply(this, arguments);
};
['maAsk','maAskText'].forEach(nome=>{
  const orig = window[nome]; if(typeof orig !== 'function') return;
  window[nome] = function(){
    if(cadBloqueado()){ try{ const inp = $('ma-input'); if(inp) inp.value = ''; maReply(CAD_MSG); }catch(e){} return; }
    return orig.apply(this, arguments);
  };
});
const _maTryCommandCad = window.maTryCommand;
window.maTryCommand = function(){
  if(cadBloqueado()) return { done:true, msg:CAD_MSG };   // nenhum comando (registrar, abrir desafio, mudar plano…) roda antes
  return _maTryCommandCad.apply(this, arguments);
};
const _updateFabNudgeCad = window.updateFabNudge;
window.updateFabNudge = function(){
  if(cadBloqueado() || !CAD_TELAS_APP.includes(cadTelaAtiva())){ cadEscondeAssistente(); return; }
  return _updateFabNudgeCad.apply(this, arguments);
};

// ---- 3. tema ----
const TEMA_ORDEM_CAD = ['areia','claro','zepp','amoled','aurora','classico','oceano','rubi'];
function cadTemaDoAparelho(){ try{ return localStorage.getItem(THEME_KEY); }catch(e){ return null; } }
function cadGuardaTemaNaConta(t){
  try{
    if(!state || !state.user || !THEMES[t]) return;
    state.prefs = state.prefs || {};
    if(state.prefs.tema === t) return;
    state.prefs.tema = t; saveData();
  }catch(e){}
}
const _setThemeCad = window.setTheme;
window.setTheme = function(t){
  const r = _setThemeCad.apply(this, arguments);
  cadGuardaTemaNaConta(normalizaTema(t));
  try{ if(cadTelaAtiva()==='scr-quiz') wzRenderTemas(); }catch(e){}
  return r;
};
// aparelho sem tema escolhido + conta com tema salvo → usa o da conta (nunca passa por cima do tema do aparelho)
mtGancho('bootAfterAuth', { antes(){
  try{ const t = state && state.prefs && state.prefs.tema; if(t && THEMES[t] && !cadTemaDoAparelho()) applyTheme(t, true); }catch(e){}
}});
function wzRenderTemas(){
  const box = $('wz-temas'); if(!box) return;
  const cur = currentTheme();
  box.innerHTML = TEMA_ORDEM_CAD.filter(k=>THEMES[k]).map(k=>{
    const t = THEMES[k], on = k===cur;
    return `<button type="button" class="wz-tema${on?' on':''}" role="radio" aria-checked="${on}" onclick="wzEscolheTema('${k}')">
      <span class="wz-tema-prev" data-theme="${k}" aria-hidden="true"><span class="tp-top"><i></i><b></b></span><span class="tp-card"><b></b><i></i><em></em></span><span class="tp-btn"></span><span class="tp-tab"><i></i><i></i><i></i><i></i></span></span>
      <span class="wz-tema-nome"><span>${t.nome}</span>${k==='areia'?'<small class="wz-tema-sug">Sugerido</small>':''}</span>
      <span class="wz-tema-sub">${t.sub}</span></button>`;
  }).join('');
}
function wzEscolheTema(k){ setTheme(k); wzRenderTemas(); }

// ---- 4. ícones ----
// traço único (24×24), herdam a cor do texto; no botão marcado ficam na cor principal
const CAD_ICO = {
  barra:'<path d="M1.5 12h21"/><rect x="4.5" y="6.5" width="2.6" height="11" rx="1"/><rect x="16.9" y="6.5" width="2.6" height="11" rx="1"/><path d="M8.8 9v6M15.2 9v6"/>',
  halter:'<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  cali:'<path d="M3 3.5h18M8.6 3.5l1.8 4.6M15.4 3.5l-1.8 4.6"/><circle cx="12" cy="9.6" r="1.8"/><path d="M12 11.5v5.2M12 16.7l-2.3 4.3M12 16.7l2.3 4.3"/>',
  hibrido:'<path d="M2 12h7.5M3.6 9v6M7.9 9v6"/><circle cx="17.5" cy="5.4" r="1.8"/><path d="M17.5 7.4v6.4M14.6 10h5.8M17.5 13.8l-2.2 5.7M17.5 13.8l2.2 5.7"/>',
  rack:'<path d="M5 21V3M19 21V3M3 3h18M2 21h20M2 10.5h20M4 8.8v3.4M20 8.8v3.4"/>',
  corpo:'<circle cx="12" cy="4.6" r="2"/><path d="M12 7v7M7 9.5l5-1 5 1M12 14l-3 6.5M12 14l3 6.5"/>',
  lista:'<path d="M10 6.5h10M10 12h10M10 17.5h10"/><path d="M3.8 6.5l1.3 1.3 2.4-2.4M3.8 12l1.3 1.3 2.4-2.4M3.8 17.5l1.3 1.3 2.4-2.4"/>',
  baixa:'<path d="M3 6.5h5l4.5 6 3-2.5L21 17"/><path d="M21 12.2V17h-4.8"/>',
  sobe:'<path d="M2.5 16h8M4 13.5v5M9 13.5v5"/><path d="M17.5 20V5M14.5 8l3-3 3 3"/>',
  pulso:'<path d="M3 12h4l2-6 4 12 2-6h6"/>',
  silhueta:'<circle cx="12" cy="4.4" r="2"/><path d="M7.8 8h8.4l-1.7 6.6H9.5z"/><path d="M7.8 8l-2.4 5M16.2 8l2.4 5M10.2 14.6l-.8 6.4M13.8 14.6l.8 6.4"/>',
  coracao:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M7.5 11.5h2.5l1-2 2 4 1-2h2.5"/>',
  chama:'<path d="M12 3c.8 3 4.5 4.8 4.5 9a4.5 4.5 0 0 1-9 0c0-1.8.8-3 1.8-4 .3 1.2 1 1.8 1.7 2 .2-2 .3-4.5 1-7z"/>',
  cronometro:'<circle cx="12" cy="13.5" r="7"/><path d="M12 9.5v4l2.8 1.7M10 3h4M18.5 6.5l1.3-1.3"/>',
  invertido:'<circle cx="12" cy="17.6" r="1.6"/><path d="M12 15.8V7.5M12 7.5L9.6 3.2M12 7.5l2.4-4.3M12 13.8l-4.2 6.7M12 13.8l4.2 6.7M5 20.5h14"/>',
  corredor:'<circle cx="15" cy="4.3" r="1.8"/><path d="M13.6 7.4L11 13.2M13 9.2l3.4 2.4 2.1-1.2M13 9.2l-3.6.6-1.6 2.4M11 13.2l3.6 2.8-1 4.8M11 13.2l-3 3.4-3.6-.6"/>',
  estrada:'<path d="M8 21L10 3M16 21L14 3M12 6v2M12 11v2M12 16v2"/>',
  esteira:'<rect x="2.5" y="16" width="15" height="3.5" rx="1.75"/><path d="M15.5 16L19 6.5M17 8h4.5M5 19.5v1.5M15 19.5v1.5"/>',
  trilha:'<path d="M3 19l6-11 4 7 2-3 6 7H3z"/><path d="M9 19l1.5-2.5L12 18"/>',
  pista:'<rect x="2.5" y="6" width="19" height="12" rx="6"/><rect x="6.5" y="9.5" width="11" height="5" rx="2.5"/><path d="M12 6v3.5"/>',
  chave:'<path d="M14.5 6.5a4 4 0 0 0-5 5L3.5 17.5l3 3 6-6a4 4 0 0 0 5-5l-2.5 2.5-2-.5-.5-2z"/>',
  dados:'<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  modal:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9h17M8 13h4M8 16h7"/>',
  revisao:'<path d="M9 4h6l1 2h3v15H5V6h3z"/><path d="M8.5 13l2.5 2.5 4.5-5"/>'
};
function cadIco(nome, extra){
  const d = CAD_ICO[nome]; if(!d) return '';
  return `<svg class="cad-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" ${extra||''}>${d}</svg>`;
}
// desenho de cada aparelho da lista "Escolher meus equipamentos" (32×32, mesmo traço para todos)
const EQUIP_ICO = {
  // banco com o encosto inclinado
  banco:'<rect x="3.5" y="17" width="15.5" height="3.4" rx="1.5"/><path d="M19.2 17.4l5.6-9.6 2.7 1.6-5.6 9.6"/><path d="M7 20.4V26M16 20.4V26M23.6 13.8L25.2 26M4.5 26h5M14 26h4.5M23.5 26h4"/>',
  // halter curto: pegada + anilhas
  halteres:'<path d="M11 16h10"/><rect x="7" y="10" width="4" height="12" rx="1.3"/><rect x="21" y="10" width="4" height="12" rx="1.3"/><rect x="4" y="12.5" width="3" height="7" rx="1"/><rect x="25" y="12.5" width="3" height="7" rx="1"/>',
  // barra longa com anilhas grandes
  barra:'<path d="M1.5 16h29"/><rect x="5.5" y="7" width="3.4" height="18" rx="1.3"/><rect x="23.1" y="7" width="3.4" height="18" rx="1.3"/><rect x="9.4" y="10" width="2.4" height="12" rx="1"/><rect x="20.2" y="10" width="2.4" height="12" rx="1"/>',
  // barra W (EZ): pegada em zigue-zague
  barraw:'<path d="M1.5 16H7.5l2.2-3 2.6 6 2.4-6h2.6l2.4 6 2.6-6 2.2 3h6"/><rect x="3" y="11.5" width="2.8" height="9" rx="1"/><rect x="26.2" y="11.5" width="2.8" height="9" rx="1"/>',
  // Smith: barra presa em dois trilhos
  smith:'<path d="M7 4v24M25 4v24M4.5 4h23M3.5 28h25"/><path d="M3 14h26"/><rect x="4" y="11" width="2.2" height="6" rx=".8"/><rect x="25.8" y="11" width="2.2" height="6" rx=".8"/><path d="M8.5 12.6v2.8M23.5 12.6v2.8"/>',
  // polia: torre com pilha de placas, roldana e cabo até a pegada
  polia:'<rect x="19" y="3" width="9" height="25" rx="1.6"/><path d="M21.5 15h4M21.5 18.2h4M21.5 21.4h4M21.5 24.6h4"/><circle cx="16.4" cy="6.4" r="2.2"/><path d="M15.2 8.3L9 20.5"/><path d="M5.5 20.5h6.5l-.8 3H6.3z"/><path d="M3 28h26"/>',
  // máquina articulada (voador / Hammer): encosto, banco e os dois braços com apoio
  maquina:'<rect x="13" y="5.5" width="6" height="13.5" rx="2"/><rect x="9.5" y="19" width="13" height="3.2" rx="1.4"/><path d="M16 22.2V27M10 27.5h12"/><path d="M13 9C8.5 9 6.5 11 6 14.5M19 9c4.5 0 6.5 2 7 5.5"/><rect x="4.4" y="14.5" width="3.2" height="6" rx="1.4"/><rect x="24.4" y="14.5" width="3.2" height="6" rx="1.4"/>',
  // barra fixa: uma barra alta entre dois postes
  barrafixa:'<path d="M2.5 7h27M6.5 7v21M25.5 7v21M3.5 28h6M22.5 28h6"/><path d="M11 7v2.5M21 7v2.5"/>',
  // paralelas: duas barras na altura da cintura, vistas em perspectiva
  paralelas:'<path d="M8 10.5h19M3.5 16.5h19"/><path d="M10 10.5v11M25 10.5v11M5.5 16.5V28M20.5 16.5V28M3 28h5M18 28h5"/>',
  // leg press 45°: banco reclinado embaixo, trilho inclinado, carrinho com anilha e plataforma dos pés
  legpress:'<path d="M3 28h26"/><rect x="3.6" y="13" width="3.8" height="11" rx="1.9" transform="rotate(-32 5.5 18.5)"/><path d="M8.5 24.2h6.5M11.5 24.2V28"/><path d="M14 26L26.5 10"/><path d="M22.1 6.4l7.8 6.2"/><circle cx="21" cy="17" r="2.4"/>',
  // hack: dois trilhos íngremes, encosto com ombreiras e a plataforma inclinada embaixo
  hack:'<path d="M3 28h26"/><path d="M7.5 4l6 22M11.5 3l6 22"/><rect x="8.6" y="9" width="5.2" height="10" rx="2" transform="rotate(-15 11.2 14)"/><path d="M7.4 8.4c1.7-1.4 4.1-1.8 6.1-.9"/><path d="M15 27.2l12.5-3.4"/>',
  // cadeira extensora: banco com encosto e alavanca da canela estendida para a frente
  extensora:'<rect x="5.5" y="5" width="4.2" height="15" rx="2"/><rect x="5.5" y="18.5" width="14" height="3.4" rx="1.4"/><circle cx="20.5" cy="20.2" r="1.5"/><path d="M21.6 19.3l5.2-4.2"/><circle cx="27.4" cy="14.3" r="2.4"/><path d="M12 21.9V27.5M6 27.5h12"/>',
  // mesa flexora: banco deitado e o rolo que puxa os calcanhares para cima
  flexora:'<path d="M3 15.5h18.5" stroke-width="3.6"/><path d="M6.5 17.5V27M17.5 17.5V27M4.5 27h5M15.5 27h5"/><circle cx="23.2" cy="16" r="1.5"/><path d="M24 14.7l2.6-6.4"/><circle cx="27" cy="7.2" r="2.4"/>',
  // adutora/abdutora: banco com apoios das pernas dos dois lados, setas para dentro e para fora
  adutora:'<rect x="13" y="6" width="6" height="12" rx="2"/><rect x="10.5" y="18" width="11" height="3.2" rx="1.4"/><path d="M16 21.2V27M11 27h10"/><rect x="5.5" y="14" width="3.2" height="9" rx="1.4"/><rect x="23.3" y="14" width="3.2" height="9" rx="1.4"/><path d="M2 10h7.5M2 10l1.8-1.6M2 10l1.8 1.6M9.5 10L7.7 8.4M9.5 10l-1.8 1.6M22.5 10H30M22.5 10l1.8-1.6M22.5 10l1.8 1.6M30 10l-1.8-1.6M30 10l-1.8 1.6"/>',
  // panturrilha: ombreira no alto, degrau para o antepé e a seta de subir no calcanhar
  panturrilha:'<path d="M24 5v23M20 28h8"/><rect x="11" y="5" width="13" height="3.4" rx="1.6"/><rect x="5" y="22" width="12" height="4" rx="1"/><path d="M8 22v-2.6l4-1.2h3.5V22"/><path d="M10 15V8.8M8 11l2-2.2 2 2.2"/>',
  // glúteo: caneleira (tornozeleira de peso) com a fita e a argola
  gluteo:'<rect x="4.5" y="11.5" width="20" height="9" rx="4.5"/><path d="M10.5 11.5v9M16.5 11.5v9"/><path d="M24.5 13.5h2.3a2.5 2.5 0 0 1 0 5h-2.3"/>',
  // kettlebell
  kettlebell:'<path d="M11 12.5c-.6-5 1.6-7.5 5-7.5s5.6 2.5 5 7.5"/><circle cx="16" cy="19" r="8"/><path d="M11.5 26.6h9"/>',
  // elástico com pegadores
  elastico:'<path d="M8.5 16c5-9 10-9 15 0"/><path d="M8.5 16c5 6 10 6 15 0" stroke-dasharray="1.6 2.6"/><rect x="2.5" y="13.5" width="6" height="5" rx="2"/><rect x="23.5" y="13.5" width="6" height="5" rx="2"/>'
};
function equipIcone(id){
  const d = EQUIP_ICO[id]; if(!d) return '';
  return `<svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
}
// troca os <span data-ico="..."> do cadastro pelo desenho (uma vez só)
function cadPoeIcones(raiz){
  (raiz || document).querySelectorAll('[data-ico]').forEach(el=>{
    if(el.dataset.icoOk) return;
    const svg = cadIco(el.dataset.ico); if(!svg) return;
    el.innerHTML = svg; el.dataset.icoOk = '1'; el.setAttribute('aria-hidden','true');
  });
}

// ---- 5. desenhos por etapa (mesma linguagem da parte 22) ----
Object.assign(DECO2_SVG, {
  // boas-vindas: silhueta em movimento sobre o disco, com o rastro do caminho
  cadBoasVindas: DECO3(`<circle class="d-fundo" cx="168" cy="62" r="50"/>
    <path class="d-ac" d="M108 100c26 6 52-2 74-18" stroke-width="2.2" stroke-dasharray="2 7"/>
    <path class="d-linha" d="M122 104h88" stroke-opacity=".5"/>
    <circle class="d-fill" cx="179" cy="24" r="8"/>
    <path class="d-corpo" d="M174 37l-9 23M172 42l13 9 8-8M172 42l-12 5-6-8M165 60l15 11-4 21M165 60l-12 15-14 3"/>`),
  // objetivo: alvo e a trajetória subindo até ele
  cadObjetivo: DECO3(`<circle class="d-fundo" cx="170" cy="58" r="48"/>
    <circle class="d-fill" cx="178" cy="48" r="28"/><circle class="d-linha" cx="178" cy="48" r="18"/><circle class="d-acf" cx="178" cy="48" r="5" stroke="none"/>
    <path class="d-ac" d="M112 104c18-6 30-22 40-34s14-16 22-20" stroke-width="2.2" stroke-dasharray="2 7"/>
    <path class="d-acf" stroke="none" d="M176 46l-11 1 6 9z"/>`),
  // semana: calendário com os dias marcados e um relógio (tempo disponível)
  cadSemana: DECO3(`<circle class="d-fundo" cx="164" cy="58" r="48"/>
    <rect class="d-fill" x="118" y="22" width="66" height="62" rx="10"/><path class="d-linha" d="M118 38h66M134 15v14M168 15v14"/>
    <rect class="d-acf" x="128" y="48" width="11" height="10" rx="2.5" stroke="none"/><rect class="d-fill" x="145" y="48" width="11" height="10" rx="2.5"/><rect class="d-acf" x="162" y="48" width="11" height="10" rx="2.5" stroke="none"/>
    <rect class="d-fill" x="128" y="65" width="11" height="10" rx="2.5"/><rect class="d-acf" x="145" y="65" width="11" height="10" rx="2.5" stroke="none"/>
    <circle class="d-fill" cx="190" cy="78" r="22"/><path class="d-ac" d="M190 64v14l9 6" stroke-width="2.4"/>`),
  // experiência: degraus de progressão com a seta subindo
  cadEvolucao: DECO3(`<circle class="d-fundo" cx="166" cy="60" r="48"/>
    <path class="d-fill" d="M118 104v-14h22v-16h22v-16h22v-16h22v62z"/>
    <path class="d-linha" d="M118 90h22v-16h22v-16h22v-16h22"/>
    <path class="d-ac" d="M124 76l26-16 22-6 30-26" stroke-width="2.4"/><path class="d-acf" stroke="none" d="M208 22l-3 14-10-10z"/>`)
});
// corrida: mapa ilustrativo — curvas de nível, percurso sinuoso, pontos de passagem e chegada.
// O trecho colorido avança com as etapas (0 = largada, 4 = revisão/chegada).
const CAD_MAPA_ROTA = 'M112 104C124 102 134 90 146 84C158 78 170 82 180 74C190 66 186 54 192 44C198 34 204 30 204 22';
const CAD_MAPA_PONTOS = [[146,84],[180,74],[192,44]];
function cadMapaArte(etapa){
  const pct = [8, 25, 50, 75, 100][Math.max(0, Math.min(4, etapa|0))];
  const pontos = CAD_MAPA_PONTOS.map((p,i)=>`<circle class="${etapa > i ? 'd-acf' : 'd-fill'}" cx="${p[0]}" cy="${p[1]}" r="4" ${etapa > i ? 'stroke="none"' : ''}/>`).join('');
  return DECO3(`<circle class="d-fundo" cx="170" cy="58" r="50"/>
    <path class="d-linha" stroke-opacity=".45" d="M150 44c-2-16 16-28 38-26s34 14 30 30-24 24-42 20-24-10-26-24z"/>
    <path class="d-linha" stroke-opacity=".35" d="M162 42c0-9 11-15 24-14s20 8 18 17-14 13-25 11-17-6-17-14z"/>
    <path class="d-linha" stroke-opacity=".25" d="M128 70c10-6 22-4 28 2M120 88c8-4 18-4 24 0"/>
    <path class="d-linha" d="${CAD_MAPA_ROTA}" stroke-width="7" stroke-opacity=".10"/>
    <path class="d-linha" d="${CAD_MAPA_ROTA}" stroke-width="1.8" stroke-dasharray="2 6"/>
    <path class="d-ac" d="${CAD_MAPA_ROTA}" pathLength="100" stroke-width="2.6" stroke-dasharray="${pct} 100"/>
    ${pontos}
    <circle class="d-acf" cx="112" cy="104" r="4.5" stroke="none"/>
    <path class="d-ac" d="M204 22V4" stroke-width="2.2"/><path class="${etapa >= 4 ? 'd-acf' : 'd-fill'}" ${etapa >= 4 ? 'stroke="none"' : ''} d="M204 4h15l-4 5 4 5h-15z"/>`);
}
for(let i = 0; i < 5; i++) DECO2_SVG['cadMapa'+i] = cadMapaArte(i);
// o desenho fica na faixa do topo (ao lado da marca), acima da barra de progresso: não cruza o título nem a barra
['scr-quiz','scr-setup-lift','scr-setup-run'].forEach(id=>{ DECO_FAIXA[id] = { fim:'.wz-prog' }; });
const _decoChaveDaTelaCad = window.decoChaveDaTela;
window.decoChaveDaTela = function(id){
  if(WZ[id]) return window.__wzArte || null;
  return _decoChaveDaTelaCad.apply(this, arguments);
};

// ---- 2. cadastro em etapas ----
const WZ = {
  'scr-quiz': {
    passos: [
      { tit:'Bem-vindo ao MetaTreino', sub:'Em poucos passos montamos um plano feito para você. Para começar, escolha o visual do app.', arte:'cadBoasVindas' },
      { tit:'Sobre você', sub:'Como podemos te chamar e alguns dados básicos.', campos:['nick','sex','birth'] },
      { tit:'Corpo e rotina', sub:'Usamos para ajustar a intensidade e acompanhar a sua evolução.', campos:['height','weight'] },
      { tit:'Seu objetivo principal', sub:'Ele orienta as sugestões do plano. Dá para mudar depois.', campos:['goal'], arte:'cadObjetivo' }
    ],
    fim: ()=>saveQuiz(), rotuloFim: 'Continuar'
  },
  'scr-setup-lift': {
    passos: [
      { tit:'Modalidade e objetivo', sub:'Como você quer treinar e o que busca com o plano.', arte:'montarMusculacao' },
      { tit:'Equipamentos', sub:'Marque o que você tem à disposição. O plano só usa o que você consegue fazer.' },
      { tit:'Sua semana', sub:'Quantos dias e quanto tempo você tem. O plano se encaixa na sua rotina.', arte:'cadSemana', valida:()=>setupErroDias('lift'), campo:'dias' },
      { tit:'Experiência', sub:'O seu ponto de partida. O app recalcula com o que você registrar.', arte:'cadEvolucao' },
      { tit:'Revisão', sub:'Confira antes de montar. Toque em Alterar para corrigir qualquer item.', resumo:true, arte:'montarMusculacao' }
    ],
    fim: ()=>finishSetup('lift'), rotuloFim: 'Criar meu plano'
  },
  'scr-setup-run': {
    passos: [
      { tit:'Seu objetivo', sub:'Escolha a meta. O plano parte do seu nível de hoje.', arte:'cadMapa0' },
      { tit:'Sua experiência', sub:'Responda com sinceridade: é isso que define o ponto de partida.', arte:'cadMapa1' },
      { tit:'Sua semana', sub:'Quantos dias e quanto tempo você tem para correr.', arte:'cadMapa2', valida:()=>setupErroDias('run'), campo:'dias' },
      { tit:'Cuidados e preferências', sub:'Dores ou limitações, prova alvo e onde você costuma correr.', arte:'cadMapa3' },
      { tit:'Revisão', sub:'Confira antes de montar. Toque em Alterar para corrigir qualquer item.', resumo:true, arte:'cadMapa4' }
    ],
    fim: ()=>finishSetup('run'), rotuloFim: 'Criar meu plano'
  }
};
const WZ_TOTAL = 10;                 // primeiro acesso: 4 do questionário + escolha do módulo + 5 do plano
const wzIdx = { 'scr-quiz':0, 'scr-setup-lift':0, 'scr-setup-run':0 };
const QUIZ_EL = { nick:'q-nick', sex:'q-sex', birth:'q-birth', height:'q-height', weight:'q-weight', goal:'q-goal' };
const QUIZ_GOAL_LBL = { emagrecer:'Emagrecer', massa:'Ganhar massa', forca:'Ganhar força', condicionamento:'Condicionamento', tonificar:'Tonificar', saude:'Saúde geral' };
const QUIZ_NIVEL_LBL = { sedentario:'Sedentário', ativo:'Ativo', atleta:'Atleta' };
const GOAL_CALI_DO_QUIZ = { emagrecer:'condicionamento', massa:'hipertrofia', forca:'forca', condicionamento:'condicionamento', tonificar:'hipertrofia', saude:'resistencia' };

function wzNumero(id, i){
  if(id === 'scr-quiz') return { n:i+1, total:WZ_TOTAL };
  if(id === 'scr-pick') return { n:5, total:WZ_TOTAL };
  return cadastroPronto() ? { n:i+1, total:WZ[id].passos.length } : { n:6+i, total:WZ_TOTAL };
}
function wzProgressoHtml(){
  return `<div class="wz-prog" role="progressbar" aria-valuemin="1"><div class="wz-prog-l"><span class="wz-n"></span></div><div class="wz-bar"><i></i></div></div>`;
}
function wzPoeProgresso(tela, n, total){
  const p = tela.querySelector('.wz-prog'); if(!p) return;
  p.querySelector('.wz-n').textContent = `Etapa ${n} de ${total}`;
  p.querySelector('.wz-bar i').style.width = Math.round(n/total*100) + '%';
  p.setAttribute('aria-valuenow', n); p.setAttribute('aria-valuemax', total);
  p.setAttribute('aria-label', `Etapa ${n} de ${total}`);
}
// monta cabeçalho e navegação uma vez por tela
function wzMonta(id){
  const tela = $(id); if(!tela || tela.dataset.wzOk) return tela;
  tela.dataset.wzOk = '1';
  const wrap = tela.querySelector('.wrap') || tela;
  cadPoeIcones(tela);
  if(id === 'scr-pick'){
    const t = tela.querySelector('.pick-title'); if(t) t.insertAdjacentHTML('beforebegin', wzProgressoHtml());
    return tela;
  }
  tela.classList.add('wz-on');
  const h1 = tela.querySelector('.wz-tit'); if(h1){ h1.insertAdjacentHTML('beforebegin', wzProgressoHtml()); h1.setAttribute('tabindex','-1'); }
  wrap.insertAdjacentHTML('beforeend', `<div class="wz-err" role="alert" aria-live="assertive"></div>
    <div class="wz-nav"><button type="button" class="btn btn-ghost wz-voltar" onclick="wzVoltar('${id}')">Voltar</button><button type="button" class="btn btn-primary wz-ir" onclick="wzAvancar('${id}')">Continuar</button></div>`);
  // tirou o erro? some o aviso
  const limpa = f=>{ f.classList.remove('wz-invalido'); const b = tela.querySelector('.wz-err'); if(b) b.innerHTML = ''; };
  tela.addEventListener('input', e=>{ const f = e.target.closest && e.target.closest('.wz-invalido'); if(f) limpa(f); });
  tela.addEventListener('click', e=>{ const f = e.target.closest && e.target.closest('.wz-invalido'); if(f && e.target.closest('.opt')) limpa(f); });
  if(id === 'scr-setup-lift'){
    // trocar a modalidade muda qual objetivo vale e o texto do nível; o tempo por sessão entra no texto do nível
    const mod = $('lift-modalidade'); if(mod) mod.addEventListener('click', ()=>setTimeout(()=>{ try{ wzObjetivoSugerido(); updateLevelHint(); }catch(e){} }, 0));
    const tp = $('cali-tempo'); if(tp) tp.addEventListener('click', ()=>setTimeout(()=>{ try{ updateLevelHint(); }catch(e){} }, 30));
  }
  return tela;
}
function wzEntrou(id){
  const tela = wzMonta(id); if(!tela) return;
  if(id === 'scr-pick'){ const n = wzNumero(id, 0); wzPoeProgresso(tela, n.n, n.total); window.__wzArte = null; return; }
  if(WZ[id]) wzIr(id, wzIdx[id] || 0, { semRolar:true });
}
function wzVisivel(el, ate){
  for(let e = el; e && e !== ate; e = e.parentElement){
    if(e.style && e.style.display === 'none') return false;
    if(e.classList && (e.classList.contains('hidden'))) return false;
  }
  return true;
}
function wzIr(id, i, op){
  const W = WZ[id], tela = wzMonta(id); if(!W || !tela) return;
  i = Math.max(0, Math.min(W.passos.length-1, i|0)); wzIdx[id] = i;
  const P = W.passos[i];
  tela.querySelectorAll('[data-wz]').forEach(el=>el.classList.toggle('wz-fora', +el.dataset.wz !== i+1));
  const h1 = tela.querySelector('.wz-tit'), sub = tela.querySelector('.wz-sub');
  if(h1) h1.textContent = P.tit; if(sub) sub.textContent = P.sub;
  const n = wzNumero(id, i); wzPoeProgresso(tela, n.n, n.total);
  const ult = i === W.passos.length-1;
  const bIr = tela.querySelector('.wz-ir'), bV = tela.querySelector('.wz-voltar');
  if(bIr) bIr.textContent = ult ? W.rotuloFim : 'Continuar';
  if(bV) bV.style.visibility = (i === 0 && id === 'scr-quiz') ? 'hidden' : '';
  const err = tela.querySelector('.wz-err'); if(err) err.innerHTML = '';
  tela.querySelectorAll('.wz-invalido').forEach(f=>f.classList.remove('wz-invalido'));
  if(id === 'scr-quiz' && i === 0) wzRenderTemas();
  if(id === 'scr-setup-lift' && i === 0) wzObjetivoSugerido();
  if(id === 'scr-setup-lift' && i === 3){ try{ updateLevelHint(); }catch(e){} }
  if(P.resumo) wzResumo(id);
  window.__wzArte = P.arte || null;
  try{ updateDeco((state && state.ui && state.ui.tab) || 'home'); }catch(e){}
  if(!(op && op.semRolar)){
    window.scrollTo({ top:0, behavior:'instant' });
    if(h1) try{ h1.focus({ preventScroll:true }); }catch(e){}
  }
}
function wzErroPasso(id, i){
  const P = WZ[id].passos[i];
  if(id === 'scr-quiz' && P.campos){
    for(const c of P.campos){ const m = quizErro(c); if(m) return { msg:m, el:$(QUIZ_EL[c]) }; }
  }
  if(P.valida){ const m = P.valida(); if(m) return { msg:m, el:wzCampoDias(id) }; }
  return null;
}
function wzErro(id, msg, el){
  const tela = $(id); if(!tela) return;
  const box = tela.querySelector('.wz-err'); if(box) box.innerHTML = `<div class="err">${msg}</div>`;
  const f = el && el.closest ? (el.closest('.field') || el) : null;
  if(f){ f.classList.add('wz-invalido'); try{ f.scrollIntoView({ block:'center', behavior:'smooth' }); }catch(e){} }
}
// chamado por saveQuiz/finishSetup quando um campo barra a criação: leva à etapa dele
function wzMostraCampo(id, campo, msg){
  const W = WZ[id]; if(!W) return;
  const i = W.passos.findIndex(P=> (P.campos && P.campos.includes(campo)) || P.campo === campo);
  if(i < 0) return;
  if(cadTelaAtiva() !== id) showScreen(id);
  wzIr(id, i);
  wzErro(id, msg, id === 'scr-quiz' ? $(QUIZ_EL[campo]) : wzCampoDias(id));
}
// o erro dos dias aponta para o que falta: a quantidade (raro) ou os dias da semana marcados
function wzCampoDias(id){
  const m = id.replace('scr-setup-','');
  return parseInt(readOpt(m+'-days')) ? $(m+'-week-days') : $(m+'-days');
}
function wzAvancar(id){
  const W = WZ[id]; const i = wzIdx[id] || 0;
  const e = wzErroPasso(id, i);
  if(e){ wzErro(id, e.msg, e.el); return; }
  if(i === W.passos.length-1){ W.fim(); return; }
  wzIr(id, i+1);
}
function wzVoltar(id){
  const i = wzIdx[id] || 0;
  if(i > 0){ wzIr(id, i-1); return; }
  if(id !== 'scr-quiz') sairDoSetup();
}
// escolha do módulo → volta para a última etapa do questionário (respostas continuam na tela)
function wzVoltaDoPick(){ cadPreencheQuiz(); showScreen('scr-quiz'); bindOpts('scr-quiz'); try{ mostraAtalhoAdmin('quiz-admin-btn'); }catch(e){} wzIr('scr-quiz', WZ['scr-quiz'].passos.length-1); }
// app reaberto já na escolha do módulo: o formulário do questionário está em branco — volta com as respostas salvas
function cadPreencheQuiz(){
  const p = state.user && state.user.profile; const nick = $('q-nick');
  if(!p || !p.quiz_done || !nick || nick.value.trim()) return;
  const val = (id, v)=>{ const e = $(id); if(e && v != null && v !== '') e.value = v; };
  val('q-nick', p.nickname); val('q-birth', p.birth); val('q-height', p.height); val('q-weight', p.currentWeight); val('q-whats', p.whatsapp);
  const on = (gid, v)=>{ const g = $(gid); const t = g && v && g.querySelector(`.opt[data-val="${v}"]`); if(!t) return; g.querySelectorAll('.opt').forEach(o=>o.classList.remove('on')); t.classList.add('on'); };
  on('q-sex', p.sex); on('q-goal', p.goal); on('q-level', p.level);
}

// objetivo do plano já sugerido pelo objetivo principal: não pergunta de novo, mostra e deixa alterar
function wzObjetivoSugerido(){
  const p = state.user && state.user.profile;
  const recolher = !cadastroPronto() && p && p.goal && !(state.modules.lift && state.modules.lift.setup);
  ['lift-goal','cali-goal'].forEach(gid=>{
    const g = $(gid); if(!g) return; const f = g.closest('.field'); if(!f) return;
    if(!recolher || f.dataset.wzAberto === '1'){ f.classList.remove('wz-recolhido'); return; }
    let s = f.querySelector('.wz-sug');
    if(!s){ s = document.createElement('div'); s.className = 'wz-sug'; g.before(s); }
    const on = g.querySelector('.opt.on');
    s.innerHTML = `<div><span class="wz-sug-l">Objetivo do plano</span><b>${on ? on.textContent.trim() : '—'}</b><small>Sugerido a partir de “${QUIZ_GOAL_LBL[p.goal] || p.goal}”.</small></div><button type="button" class="btn btn-ghost wz-sug-btn" onclick="wzAbreObjetivo('${gid}')">Alterar</button>`;
    f.classList.add('wz-recolhido');
  });
}
function wzAbreObjetivo(gid){ const g = $(gid); const f = g && g.closest('.field'); if(!f) return; f.dataset.wzAberto = '1'; f.classList.remove('wz-recolhido'); }

// ---- revisão ----
function wzEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]); }
function wzData(v){ const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v||''); return m ? `${m[3]}/${m[2]}/${m[1]}` : v; }
function wzRotulo(f){
  if(f.dataset.rotulo) return f.dataset.rotulo;
  const lb = f.querySelector('label'); if(!lb) return '';
  return lb.textContent.replace(/\s*\(.*?\)\s*/g,' ').replace(/—\s*opcional/i,'').replace(/\?\s*$/,'').replace(/\s+/g,' ').trim();
}
function wzValor(f){
  const partes = [];
  f.querySelectorAll('.radio-grid').forEach(g=>{
    if(!wzVisivel(g, f)) return;
    const on = [...g.querySelectorAll('.opt.on')].map(o=>o.textContent.replace(/\s+/g,' ').trim()).filter(Boolean);
    if(on.length) partes.push(on.join(', '));
  });
  const ins = [...f.querySelectorAll('input, select')].filter(x=>x.type !== 'hidden' && wzVisivel(x, f));
  if(f.querySelector('.cali-teste')){
    ins.forEach(x=>{ if(x.value === '') return; const lab = x.closest('label'); const t = lab ? lab.firstChild.textContent.trim() : ''; partes.push(`${t}: ${x.value}`); });
  } else if(f.querySelector('.tempo-hms')){
    const d = $('run-marca-dist'), h = +($('run-marca-h').value||0), mi = +($('run-marca-m').value||0), s = +($('run-marca-s').value||0);
    if(d && d.value && (h||mi||s)) partes.push(`${d.options[d.selectedIndex].text} em ${h ? h+'h ' : ''}${String(mi).padStart(2,'0')}min ${String(s).padStart(2,'0')}s`);
  } else {
    ins.forEach(x=>{ if(!x.value) return; partes.push(x.type === 'date' ? wzData(x.value) : x.value); });
  }
  if(f.querySelector('#lift-equip-custom') && readOpt('lift-equip') === 'custom'){
    const n = (typeof equipTemp !== 'undefined' ? equipTemp : []).length;
    partes.push(n ? `${n} ${n===1?'aparelho marcado':'aparelhos marcados'}` : 'nenhum aparelho marcado (só peso do corpo)');
  }
  return partes.length ? wzEsc(partes.join(' · ')) : '<span class="wz-vazio">Não informado</span>';
}
function wzGrupoResumo(titulo, linhas, acao){
  return `<div class="wz-rg"><div class="wz-rg-h"><b>${wzEsc(titulo)}</b><button type="button" class="btn btn-ghost wz-alt" onclick="${acao}">Alterar</button></div>
    ${linhas.map(l=>`<div class="wz-rl"><span>${wzEsc(l[0])}</span><span>${l[1]}</span></div>`).join('')}</div>`;
}
function wzResumo(id){
  const W = WZ[id], tela = $(id); const box = tela && tela.querySelector('.wz-resumo'); if(!box) return;
  let html = '';
  if(!cadastroPronto()){
    const p = (state.user && state.user.profile) || {};
    html += wzGrupoResumo('Você', [
      ['Nome', wzEsc(p.nickname || '—')],
      ['Objetivo principal', wzEsc(QUIZ_GOAL_LBL[p.goal] || '—')],
      ['Nível de atividade', wzEsc(QUIZ_NIVEL_LBL[p.level] || '—')]
    ], `wzEditaQuiz('${id}',1)`);
  }
  W.passos.forEach((P, i)=>{
    if(P.resumo) return;
    const linhas = [];
    tela.querySelectorAll(`.field[data-wz="${i+1}"]`).forEach(f=>{
      if(f.classList.contains('wz-resumo') || !wzVisivel(f, tela)) return;
      const r = wzRotulo(f); if(r) linhas.push([r, wzValor(f)]);
    });
    if(linhas.length) html += wzGrupoResumo(P.tit, linhas, `wzIr('${id}',${i})`);
  });
  box.innerHTML = html;
}
// "Alterar" nos dados do questionário: corrige e volta direto para a revisão (sem refazer a escolha do módulo)
function wzEditaQuiz(volta, passo){
  window.__wzVolta = { tela:volta, passo:wzIdx[volta] || 0 };
  cadPreencheQuiz();
  showScreen('scr-quiz'); bindOpts('scr-quiz'); wzIr('scr-quiz', passo);
}
const _saveQuizCad = window.saveQuiz;
window.saveQuiz = function(){
  const volta = window.__wzVolta;
  const r = _saveQuizCad.apply(this, arguments);
  try{
    if(volta && cadTelaAtiva() === 'scr-pick'){
      window.__wzVolta = null;
      showScreen(volta.tela); wzIr(volta.tela, volta.passo);
    }
  }catch(e){}
  return r;
};

// abrir a montagem do plano começa sempre na 1ª etapa; no primeiro plano, o objetivo da calistenia
// também parte do objetivo principal (o da musculação já vinha do questionário)
const _openSetupScreenCad = window.openSetupScreen;
window.openSetupScreen = function(m){
  const r = _openSetupScreenCad.apply(this, arguments);
  try{
    const id = 'scr-setup-' + m;
    if(m === 'lift'){
      const p = state.user && state.user.profile;
      const st = state.modules.lift && state.modules.lift.setup;
      if(p && p.goal && !(st && st.caliGoal)){
        const alvo = GOAL_CALI_DO_QUIZ[p.goal]; const g = $('cali-goal');
        const t = g && g.querySelector(`.opt[data-val="${alvo}"]`);
        if(t){ g.querySelectorAll('.opt').forEach(o=>o.classList.remove('on')); t.classList.add('on'); }
      }
    }
    wzIr(id, 0);
  }catch(e){ console.log('cadastro (montar plano):', e); }
  return r;
};
const _prefillCad = window.prefillSetupFromQuiz;
window.prefillSetupFromQuiz = function(m){
  const r = _prefillCad.apply(this, arguments);
  try{ if(m === 'lift'){ wzObjetivoSugerido(); updateLevelHint(); } }catch(e){}
  return r;
};

// ---- formulários limpos ao recomeçar ou trocar de conta ----
let CAD_PADRAO = null;
function cadFotografa(){
  CAD_PADRAO = {};
  CAD_TELAS.forEach(id=>{
    const t = $(id); if(!t) return;
    CAD_PADRAO[id] = { opts:[...t.querySelectorAll('.opt')].map(o=>o.classList.contains('on')), ins:[...t.querySelectorAll('input, select, textarea')].map(x=>x.value) };
  });
}
function cadastroRecomecar(){
  if(!CAD_PADRAO) return;
  CAD_TELAS.forEach(id=>{
    const t = $(id), P = CAD_PADRAO[id]; if(!t || !P) return;
    t.querySelectorAll('.opt').forEach((o,i)=>o.classList.toggle('on', !!P.opts[i]));
    t.querySelectorAll('input, select, textarea').forEach((x,i)=>{ x.value = P.ins[i] != null ? P.ins[i] : ''; });
    t.querySelectorAll('.wz-invalido').forEach(f=>f.classList.remove('wz-invalido'));
    t.querySelectorAll('[data-wz-aberto]').forEach(f=>{ delete f.dataset.wzAberto; });
    const e = t.querySelector('.wz-err'); if(e) e.innerHTML = '';
  });
  try{ equipTemp = []; }catch(e){}
  const box = $('lift-equip-custom'); if(box) box.style.display = 'none';
  const qe = $('q-err'); if(qe) qe.innerHTML = '';
  Object.keys(wzIdx).forEach(k=>{ wzIdx[k] = 0; });
  window.__wzVolta = null; window.__caliPreMod = null;
}
mtGancho('doLogout', { depois(){ try{ cadastroRecomecar(); }catch(e){} cadEscondeAssistente(); }});

// início: guarda o estado original dos formulários e desenha os ícones
try{ cadFotografa(); cadPoeIcones(document); }catch(e){ console.log('cadastro (início):', e); }
Object.assign(window, { cadastroPronto, cadastroRecomecar, irParaCadastro, wzIr, wzAvancar, wzVoltar, wzVoltaDoPick, wzEscolheTema, wzAbreObjetivo, wzEditaQuiz, wzMostraCampo, equipIcone, cadIco });

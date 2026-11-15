
// =====================================================================
// 36. Beta 40 — Planos Gratuito e Premium
// =====================================================================
// Fonte do plano: usuariosAutorizados/{email} (app.js: planoDe / planoAtual). O aluno não grava nesse
// documento (só cria o próprio Teste Premium uma vez — firestore.rules). Cada recurso Premium é conferido
// AQUI, na função que faz o trabalho (abrir, gerar, responder), e não só escondendo o botão.
// O que NUNCA é bloqueado: musculação, corrida, criar e executar planos, registrar cargas/séries/reps,
// vídeos dos exercícios do próprio treino, histórico, evolução básica, desafios, conquistas, metas e provas.
// Nenhum dado é apagado ao mudar de plano: o que é Premium fica guardado e volta quando o Premium volta.

const MT_RECURSOS = {
  biblioteca:     { nome:'Biblioteca completa de exercícios', txt:'Consultar os exercícios do catálogo inteiro, com ficha técnica e vídeo, fora do seu treino.' },
  exercicioLivre: { nome:'Consulta livre de exercícios e vídeos', txt:'Abrir a ficha e o vídeo de qualquer exercício, mesmo os que não estão no seu plano.' },
  alimentacao:    { nome:'Plano alimentar', txt:'Cardápio da semana calculado pelo seu peso, treinos e objetivo, com ajustes, trocas e lista de compras.' },
  pdfTreino:      { nome:'PDF do plano de treino', txt:'Seu plano de musculação ou corrida em um documento pronto para imprimir.' },
  pdfAlimentacao: { nome:'PDF do plano alimentar', txt:'O cardápio da semana com refeições, quantidades e valores nutricionais em PDF.' },
  relatorio:      { nome:'Relatório completo de evolução', txt:'Relatório em PDF com gráficos de volume, cargas, quilômetros, ritmo, peso e conquistas.' },
  inicioCompleto: { nome:'Personalização completa do Início', txt:'Escolher bloco por bloco o que aparece e arrastar para mudar a ordem.' },
  temas:          { nome:'Todos os temas', txt:'Os 8 temas do app e os 2 exclusivos Premium (Ametista e Coral).' },
  assistente:     { nome:'Meta Assistente completo', txt:'Análises da sua evolução, aviso de subir de nível, sugestões no dia a dia, orientação para as provas e comandos que ajustam o plano.' },
  clima:          { nome:'Cenário e dicas pelo clima', txt:'O desenho do Início e as dicas de treino acompanham o tempo de agora (usa sua localização).' }
};
const TEMAS_GRATIS = ['zepp', 'areia'];   // um escuro e um claro
// estrela dos selos Premium em SVG (o cadastro e as telas sóbrias não usam emoji)
const PL_EST = '<svg class="pl-est" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2 6.4 20.2l1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/></svg>';
function mtPremium(){ try{ return !!planoAtual().premium; }catch(e){ return false; } }
function mtTem(r){ return MT_RECURSOS[r] ? mtPremium() : true; }
function _planoConhecido(){ return !!(window.__mtPlanoPronto && state && state.user && fbUser); }

// ---------- 1. Explicação + contato para contratar ----------
function mtContatoPremiumHtml(){
  const c = (typeof coachContact !== 'undefined' && coachContact) || {};
  const n = String(c.whatsapp||'').replace(/\D/g,'');
  const conta = (state && state.user && state.user.email) || '';
  const msg = encodeURIComponent(`Olá! Quero contratar o MetaTreino Premium.${conta && !ehLoginInterno(conta) ? ' Minha conta: ' + conta : ''}`);
  const mail = c.email || 'metatreinooficial@gmail.com';
  return `<div class="pl-contato">
    ${n ? `<a class="btn btn-primary btn-block" href="https://wa.me/${n}?text=${msg}" target="_blank" rel="noopener">💬 Contratar pelo WhatsApp</a>` : ''}
    <a class="btn ${n?'btn-ghost':'btn-primary'} btn-block" href="mailto:${mtEsc(mail)}?subject=${encodeURIComponent('MetaTreino Premium')}&body=${msg}" style="margin-top:8px">✉️ Contratar por e-mail</a>
    <div class="pl-contato-sub">A administração ativa o Premium na sua conta. Seus treinos e dados continuam os mesmos.</div></div>`;
}
function mtPlanoStatusTxt(){
  const p = planoAtual(); const f = t=>new Date(t).toLocaleDateString('pt-BR');
  if(p.admin) return 'Administrador: todos os recursos liberados.';
  if(p.tipo === 'teste') return `Teste Premium até ${f(p.ate)} (${accessDaysLeft()} ${accessDaysLeft()===1?'dia':'dias'}).`;
  if(p.tipo === 'premium') return p.ate ? `Premium até ${f(p.ate)}.` : 'Premium sem data de término.';
  if(p.testeAcabouEm) return `Seu teste Premium terminou em ${f(p.testeAcabouEm)}. Você está no plano Gratuito.`;
  if(p.premiumAcabouEm) return `Seu Premium terminou em ${f(p.premiumAcabouEm)}. Você está no plano Gratuito.`;
  return 'Você está no plano Gratuito.';
}
function mtPremiumAviso(rec, extra){
  const r = MT_RECURSOS[rec] || { nome:'Recurso Premium', txt:'' };
  try{ closeModal(); }catch(e){}
  setTimeout(()=>{
    $('modal-inner').innerHTML = `<div class="pl-aviso">
      <div class="pl-selo">${PL_EST}Premium</div>
      <h3>${mtEsc(r.nome)}</h3>
      <p class="pl-txt">${mtEsc(r.txt)}</p>
      ${extra ? `<p class="pl-txt pl-extra">${extra}</p>` : ''}
      <div class="pl-status">${mtEsc(mtPlanoStatusTxt())}</div>
      <div class="pl-continua"><b>No plano Gratuito continua tudo o que você precisa para treinar:</b> musculação e corrida, criar e executar treinos, registrar cargas, séries e repetições, vídeos dos exercícios do seu treino, histórico, evolução, desafios, conquistas e provas.</div>
      ${mtContatoPremiumHtml()}
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openPlanos()">Comparar planos</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Agora não</button></div>`;
    $('modal-back').classList.add('on');
  }, 40);
  return false;
}
function openPlanos(){
  const p = planoAtual();
  const L = (t, g, pr)=>`<tr><td>${t}</td><td class="${g?'sim':'nao'}">${g===true?'✓':g===false?'—':g}</td><td class="sim">${pr===true?'✓':pr}</td></tr>`;
  $('modal-inner').innerHTML = `<h3>Planos do MetaTreino</h3>
    <div class="pl-status" style="margin:4px 0 10px">${mtEsc(mtPlanoStatusTxt())}</div>
    <div class="pl-tabela-wrap"><table class="pl-tabela"><thead><tr><th></th><th>Gratuito</th><th>Premium</th></tr></thead><tbody>
      ${L('Musculação e corrida (planos, execução e registro)', true, true)}
      ${L('Vídeos dos exercícios durante o treino', true, true)}
      ${L('Histórico, evolução e gráficos', 'básico', 'completo')}
      ${L('Desafios, conquistas, metas e provas', true, true)}
      ${L('Meta Assistente', 'básico', 'completo')}
      ${L('Biblioteca completa de exercícios', false, true)}
      ${L('Plano alimentar (com PDF)', false, true)}
      ${L('PDF dos treinos e relatório de evolução', false, true)}
      ${L('Temas', '2', '10')}
      ${L('Personalização do Início', 'básica', 'completa')}
      ${L('Cenário do Início pelo clima', false, true)}
    </tbody></table></div>
    ${p.premium && !p.admin ? '' : (p.admin ? '' : mtContatoPremiumHtml())}
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}

// ---------- 2. Temas: 2 no Gratuito, 10 no Premium ----------
Object.assign(THEMES, {
  ametista: { nome:'Ametista', sub:'Escuro · ametista e menta', bar:'#100b17', prev:{bg:'#100b17', a:'#b197fc', b:'#63e6be', c:'#241a33'}, premium:true },
  coral:    { nome:'Coral', sub:'Claro · coral e azul-marinho', bar:'#fff8f4', prev:{bg:'#fff8f4', a:'#d9482b', b:'#1d3557', c:'#f4e2d8'}, premium:true }
});
// "Premium" era o nome do tema preto e laranja — com um plano chamado Premium, isso confundia
THEMES.zepp.nome = 'Brasa'; THEMES.zepp.sub = 'Preto e laranja · estilo relógio';
if(!TEMAS_CLAROS.includes('coral')) TEMAS_CLAROS.push('coral');
if(typeof TEMAS_NOTURNOS !== 'undefined' && !TEMAS_NOTURNOS.includes('ametista')) TEMAS_NOTURNOS.push('ametista');
if(typeof TEMA_ORDEM_CAD !== 'undefined'){ ['coral','ametista'].forEach(k=>{ if(!TEMA_ORDEM_CAD.includes(k)) TEMA_ORDEM_CAD.push(k); }); }
function temaPremium(t){ return !TEMAS_GRATIS.includes(normalizaTema(t)); }
function temaLiberado(t){ return !_planoConhecido() || mtPremium() || !temaPremium(t); }
function temaGratisDe(t){ return temaClaro(normalizaTema(t)) ? 'areia' : 'zepp'; }
const _applyThemeB40 = applyTheme;
applyTheme = function(t, naoGuardar){
  t = normalizaTema(t);
  if(!temaLiberado(t)) t = temaGratisDe(t);   // nunca aplica um tema Premium sem Premium (o salvo na conta não é apagado)
  return _applyThemeB40.call(this, t, naoGuardar);
};
const _setThemeB40 = setTheme;
setTheme = function(t){
  if(!temaLiberado(t)){ mtPremiumAviso('temas', `O tema <b>${mtEsc(THEMES[normalizaTema(t)].nome)}</b> é exclusivo do Premium. Os temas <b>Brasa</b> (escuro) e <b>Areia</b> (claro) continuam liberados.`); return; }
  const r = _setThemeB40.apply(this, arguments);
  try{ state.prefs = state.prefs || {}; state.prefs.tema = normalizaTema(t); if(mtPremium()) delete state.prefs.temaPremium; saveData(); }catch(e){}
  return r;
};
// troca de plano: tema Premium vira o equivalente gratuito, guardando o escolhido para quando o Premium voltar
function mtTemaConfere(avisar){
  if(!_planoConhecido()) return;
  state.prefs = state.prefs || {};
  let salvo = null; try{ salvo = localStorage.getItem(THEME_KEY); }catch(e){}
  const escolhido = normalizaTema(state.prefs.tema || salvo || currentTheme());
  if(!mtPremium() && temaPremium(escolhido)){
    const novo = temaGratisDe(escolhido);
    state.prefs.temaPremium = escolhido; state.prefs.tema = novo;
    _applyThemeB40(novo); saveData();
    if(avisar) return { de:escolhido, para:novo };
  } else if(mtPremium() && state.prefs.temaPremium && THEMES[state.prefs.temaPremium]){
    const volta = state.prefs.temaPremium; delete state.prefs.temaPremium;
    state.prefs.tema = volta; _applyThemeB40(volta); saveData();
    if(avisar) toast(`🎨 Seu tema ${THEMES[volta].nome} voltou.`);
  } else {
    applyTheme(currentTheme(), true);
  }
  return null;
}

// ---------- 3. Mudança de plano (fim do teste, Premium renovado) ----------
function mtPlanoMudou(antes, depois){
  if(!_planoConhecido()) return;
  const ehP = t=>t==='premium' || t==='teste';
  const troca = mtTemaConfere(true);
  // fim do teste/Premium — ou a primeira entrada na Beta 40 de quem já estava sem acesso e usava um tema Premium
  const caiu = (antes && ehP(antes) && !ehP(depois)) || (!antes && !ehP(depois) && !!troca);
  if(!ehP(depois)){ try{ weatherData = null; }catch(e){} }
  else if(antes && !ehP(antes)){ try{ loadWeather(); }catch(e){} toast('⭐ Premium ativo: todos os recursos liberados.'); }
  state.planoVisto = depois; saveData();
  if(caiu) mtAvisoFimPremium(antes, troca);
  try{ const t = (state.ui && state.ui.tab) || 'home'; if(!document.querySelector('#modal-back.on')) goTab(t); }catch(e){}
}
function mtAvisoFimPremium(antes, troca){
  const nomeAntes = antes === 'teste' ? 'Seu teste Premium de 30 dias terminou' : antes ? 'Seu Premium terminou' : 'Você está no plano Gratuito';
  setTimeout(()=>{
    $('modal-inner').innerHTML = `<div class="pl-aviso">
      <div class="pl-selo pl-selo-dim">Plano Gratuito</div>
      <h3>${nomeAntes}</h3>
      <p class="pl-txt">Sua conta passou para o plano Gratuito. <b>Nada foi apagado</b>: treinos, histórico, cargas, evolução, conquistas e provas continuam aqui, e você segue treinando normalmente.</p>
      ${troca ? `<div class="pl-tema-troca"><span class="pl-tema-bola" style="background:${THEMES[troca.de].prev.bg};border-color:${THEMES[troca.de].prev.a}"></span><span>→</span><span class="pl-tema-bola" style="background:${THEMES[troca.para].prev.bg};border-color:${THEMES[troca.para].prev.a}"></span><span>Tema <b>${mtEsc(THEMES[troca.de].nome)}</b> trocado por <b>${mtEsc(THEMES[troca.para].nome)}</b>. Ele volta sozinho se você voltar ao Premium.</span></div>` : ''}
      <p class="pl-txt">Ficam guardados para quando o Premium voltar: plano alimentar, personalização do Início e o tema escolhido.</p>
      ${mtContatoPremiumHtml()}
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Continuar no Gratuito</button></div>`;
    $('modal-back').classList.add('on');
  }, 600);
}
// confere na entrada e de hora em hora (o teste pode terminar com o app aberto)
function mtPlanoVerifica(){
  if(!_planoConhecido()) return;
  const agora = planoAtual().tipo;
  const visto = state.planoVisto || null;
  if(visto !== agora) mtPlanoMudou(visto, agora);
  else mtTemaConfere(false);
  // aviso de fim próximo do teste (3 dias, uma vez por dia)
  try{
    const p = planoAtual();
    if(p.tipo === 'teste' && accessDaysLeft() <= 3 && mtLS('mt_aviso_teste') !== mtDia0()+''){
      mtLS('mt_aviso_teste', mtDia0()+'');
      setTimeout(()=>toast(`⭐ Seu teste Premium termina em ${accessDaysLeft()} ${accessDaysLeft()===1?'dia':'dias'}. Seus dados continuam depois.`, 5000), 2500);
    }
  }catch(e){}
}
mtGancho('bootAfterAuth', { antes(){ window.__mtPlanoPronto = true; }, depois(){ try{ mtPlanoVerifica(); }catch(e){ console.log('plano:', e); } } });
setInterval(()=>{ try{ if(document.visibilityState === 'visible') mtPlanoVerifica(); }catch(e){} }, 3600000);
document.addEventListener('visibilitychange', ()=>{ try{ if(document.visibilityState === 'visible') mtPlanoVerifica(); }catch(e){} });

// ---------- 4. Perfil e Início: o plano aparece com clareza ----------
mtGancho('renderProfile', { depois(){
  try{
    const p = planoAtual(); const d = accessDaysLeft();
    const st = $('pf-status'); if(st) st.innerHTML = p.premium ? `⭐ <span>${p.tipo==='teste'?'Teste Premium':'Premium'}</span>` : '🎫 <span>Plano Gratuito</span>';
    const tr = $('pf-trial'); if(tr){ tr.textContent = accessLabel(d); const card = tr.closest('.card'); if(card && !card.dataset.pl){ card.dataset.pl = '1'; card.style.cursor = 'pointer'; card.setAttribute('role','button'); card.setAttribute('tabindex','0'); card.onclick = openPlanos; } }
    const g = $('pf-goal'); if(g && !g.querySelector('.pl-ver')) g.insertAdjacentHTML('beforeend', ' · <span class="pl-ver">ver planos ›</span>');
    // estilo dos ícones: linha própria no grupo Aplicativo (antes ficava escondido dentro de Aparência)
    const ap = $('theme-row');
    if(ap && !$('icones-row')){
      ap.insertAdjacentHTML('afterend', `<div class="list-row" onclick="openEstiloIconesB40()" id="icones-row"><span>✨</span> <span>Estilo dos ícones</span><span id="icones-row-val" style="margin-left:auto;color:var(--text-mute);font-size:12px"></span></div>`);
    }
    const iv = $('icones-row-val'); if(iv) iv.textContent = (document.documentElement.classList.contains('sobrio') ? 'Minimalistas' : 'Emojis coloridos') + ' ›';
    // linhas Premium ganham o selo (o recurso continua conferido na função)
    if(!p.premium){
      [['inicio-row','Personalizar início'],['theme-row','Aparência']].forEach(([id])=>{ const r = $(id); if(r && !r.querySelector('.pl-mini')) r.insertAdjacentHTML('beforeend','<span class="pl-mini">'+PL_EST+'</span>'); });
      document.querySelectorAll('#scr-profile .list-row[onclick*="arqRelatorio"], #scr-profile .list-row[onclick*="library"]').forEach(r=>{ if(!r.querySelector('.pl-mini')) r.insertAdjacentHTML('beforeend','<span class="pl-mini">${PL_EST}Premium</span>'); });
    } else document.querySelectorAll('#scr-profile .pl-mini').forEach(x=>x.remove());
  }catch(e){ console.log('perfil (plano):', e); }
}});
mtGancho('renderHome', { depois(){
  try{
    const c = $('card-access-info'); if(!c) return;
    const p = planoAtual(); const d = accessDaysLeft();
    const t = c.querySelector('.card-title');
    if(p.premium && !p.vitalicio && d <= 15){
      c.classList.remove('hidden');
      if(t) t.textContent = p.tipo === 'teste' ? '⭐ Teste Premium' : '⭐ Premium';
      const s = $('access-days'); if(s) s.textContent = `Termina em ${d} ${d===1?'dia':'dias'} · seus dados continuam depois`;
      c.style.cursor = 'pointer'; c.onclick = openPlanos;
    } else c.classList.add('hidden');
  }catch(e){}
}});

mtGancho('renderPlan', { depois(){
  try{
    const p = planoAtual(); const a = $('pl-access'), d = $('pl-days');
    if(a) a.textContent = p.premium ? (p.tipo === 'teste' ? '⭐ Teste Premium' : '⭐ Premium') : 'Plano Gratuito';
    if(d) d.textContent = p.premium ? accessLabel(accessDaysLeft()) : 'Treinos, histórico e evolução liberados';
    const card = a && a.closest('.card'); if(card && !card.dataset.pl){ card.dataset.pl = '1'; card.style.cursor = 'pointer'; card.onclick = openPlanos; }
  }catch(e){}
}});

// ---------- 5. Biblioteca e consulta livre de exercícios ----------
function mtExNoPlano(nome, idKey){
  const id = slug(String(nome||'')); const n = mtNorm(nome);
  if(idKey && /^mob-|^cali|^aq-/.test(String(idKey))) return true;
  const L = ((state.modules.lift||{}).plan||{}).workouts || [];
  if(L.some(w=>(w.exercises||[]).some(e=>e.id===id || e.id===idKey || mtNorm(e.name)===n))) return true;
  const R = ((state.modules.run||{}).plan||{}).workouts || [];
  if(R.some(w=>JSON.stringify(w.blocks||w.exercises||[]).toLowerCase().includes(n))) return true;
  // exercícios feitos nos últimos 14 dias (treino extra, troca de exercício)
  const H = ((state.modules.lift||{}).history||[]).filter(x=>x.at > Date.now()-14*DIA_MS);
  return H.some(x=>(x.exercisesDone||[]).some(e=>e.id===id || mtNorm(e.name)===n));
}
function mtEmTreino(){
  const a = document.querySelector('.screen.active');
  return !!(a && (a.id === 'scr-sessions' || a.id === 'scr-runlog' || a.id === 'scr-plan'));
}
const _openExSheetB40 = window.openExerciseSheet;
window.openExerciseSheet = function(name, idKey, opts){
  if(mtPremium() || mtEmTreino() || mtExNoPlano(name, idKey)) return _openExSheetB40.apply(this, arguments);
  return mtPremiumAviso('exercicioLivre', `<b>${mtEsc(name)}</b> não está no seu plano. Os vídeos e fichas dos exercícios do seu treino continuam liberados, inclusive durante a execução.`);
};
const _goTabB40 = window.goTab;
window.goTab = function(t){
  if(t === 'library' && _planoConhecido() && !mtTem('biblioteca')){ mtPremiumAviso('biblioteca'); return; }
  return _goTabB40.apply(this, arguments);
};
const _renderLibraryB40 = window.renderLibrary;
window.renderLibrary = function(){
  if(_planoConhecido() && !mtTem('biblioteca')){
    const l = $('lib-list'); if(l) l.innerHTML = `<div class="pl-bloqueio"><div class="pl-selo">${PL_EST}Premium</div><b>Biblioteca completa de exercícios</b><span>Os vídeos dos exercícios do seu treino continuam na aba Treinos.</span><button class="btn btn-primary" onclick="mtPremiumAviso('biblioteca')">Conhecer o Premium</button></div>`;
    return;
  }
  return _renderLibraryB40.apply(this, arguments);
};
mtGancho('renderSessions', { depois(){ try{ const ql = $('ql-lib'); if(ql && !mtPremium()){ if(!ql.querySelector('.pl-mini')) ql.insertAdjacentHTML('beforeend','<span class="pl-mini">'+PL_EST+'</span>'); } else if(ql){ const m = ql.querySelector('.pl-mini'); if(m) m.remove(); } }catch(e){} }});

// ---------- 6. Plano alimentar (Premium) — os registros ficam guardados ----------
const _openNutriB40 = window.openNutri;
window.openNutri = function(){
  if(!mtTem('alimentacao')){ window.__nutriAberto = false; return mtPremiumAviso('alimentacao', (state.nutri || state.nutriLog) ? 'Seu plano alimentar e o que você já registrou continuam guardados na sua conta e voltam assim que o Premium for ativado.' : ''); }
  return _openNutriB40.apply(this, arguments);
};
['nutriSet','nutriTrocar','nutriComi','nutriListaCompras','nutriEditar','nutriRemover','nutriAddAbrir'].forEach(f=>{
  const o = window[f]; if(typeof o !== 'function') return;
  window[f] = function(){ if(!mtTem('alimentacao')) return mtPremiumAviso('alimentacao'); return o.apply(this, arguments); };
});

// ---------- 7. PDFs e relatório completo ----------
const _arqRelatorioB40 = window.arqRelatorio;
window.arqRelatorio = function(){ if(!mtTem('relatorio')) return mtPremiumAviso('relatorio', 'Seu histórico e seus gráficos continuam completos no app — só a exportação em PDF é Premium.'); return _arqRelatorioB40.apply(this, arguments); };
const _arqGerarPDFB40 = window.arqGerarPDF;
window.arqGerarPDF = function(){ if(!mtTem('relatorio')) return mtPremiumAviso('relatorio'); return _arqGerarPDFB40.apply(this, arguments); };

// ---------- 8. Personalização do Início ----------
// Gratuito: "Tudo" ou "Só o essencial". Premium: bloco por bloco + ordem. A escolha Premium fica guardada.
const _inicioOcultosB40 = window.inicioOcultos;
window.inicioOcultos = function(){
  let oc;
  if(!_planoConhecido() || mtTem('inicioCompleto')) oc = _inicioOcultosB40.apply(this, arguments);
  else oc = state.inicioBasico === 'essencial' ? INICIO_ESSENCIAL.slice() : [];
  if(_planoConhecido() && !mtTem('alimentacao') && !oc.includes('alimentacao')) oc = oc.concat('alimentacao');
  return oc;
};
const _inicioAplicaOrdemB40 = window.inicioAplicaOrdem;
window.inicioAplicaOrdem = function(){
  if(!_planoConhecido() || mtTem('inicioCompleto')) return _inicioAplicaOrdemB40.apply(this, arguments);
  const a = state.inicioOrdem, b = state.inicioOrdemInd;
  state.inicioOrdem = null; state.inicioOrdemInd = null;
  try{ return _inicioAplicaOrdemB40.apply(this, arguments); } finally { state.inicioOrdem = a; state.inicioOrdemInd = b; }
};
const _openPersonalizarB40 = window.openPersonalizarInicio;
window.openPersonalizarInicio = function(){
  if(mtTem('inicioCompleto')) return _openPersonalizarB40.apply(this, arguments);
  const ess = state.inicioBasico === 'essencial';
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `<h3>🏠 Personalizar início</h3>
    <p class="mt-muted" style="margin:0 0 10px;font-size:12.5px;line-height:1.5">Escolha como a tela inicial aparece. Vale na hora e fica salvo na sua conta.</p>
    <div class="pl-opcoes">
      <button type="button" class="pl-op ${!ess?'on':''}" onclick="piBasico('completo')"><b>Completo</b><small>todos os blocos do Início</small></button>
      <button type="button" class="pl-op ${ess?'on':''}" onclick="piBasico('essencial')"><b>Só o essencial</b><small>treino de hoje, avisos e o principal</small></button>
    </div>
    <div class="pl-bloqueio pl-bloqueio-sm"><div class="pl-selo">${PL_EST}Premium</div><span>Escolher bloco por bloco, esconder e mostrar seções e arrastar para mudar a ordem.</span>
      <button class="btn btn-ghost" onclick="mtPremiumAviso('inicioCompleto')">Ver o Premium</button></div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal();goTab('home')">Pronto</button>`;
  $('modal-back').classList.add('on');
};
function piBasico(k){ state.inicioBasico = k === 'essencial' ? 'essencial' : 'completo'; saveData(); aplicaInicio(); openPersonalizarInicio(); }
['piAlterar','piPreset'].forEach(f=>{ const o = window[f]; if(typeof o !== 'function') return; window[f] = function(){ if(!mtTem('inicioCompleto')) return mtPremiumAviso('inicioCompleto'); return o.apply(this, arguments); }; });

// ---------- 9. Clima e cenário do Início ----------
// Gratuito: cenário estável pelo horário e datas especiais, SEM pedir localização nem buscar o clima.
const _loadWeatherB40 = window.loadWeather;
window.loadWeather = function(){
  if(!mtTem('clima')){ try{ weatherData = null; }catch(e){} return; }
  return _loadWeatherB40.apply(this, arguments);
};
const _cenaClimaB40 = window._cenaClima;
window._cenaClima = function(){ if(!mtTem('clima')) return null; return _cenaClimaB40.apply(this, arguments); };

// ---------- 10. Meta Assistente: o mesmo assistente, com recursos conforme o plano ----------
const MA_KEYS_PREMIUM = new Set(['analise_mes','cargas','consistencia','corrida_analise','retomada','evolucao','analise_semana','_correndobem','_treinandobem',
  'plano_alimentar','run_desenvolve','run_carga','run_avancar','run_ritmos','cali_analise','prova','calorias']);
function maRespostaPremium(oQue){
  return `⭐ ${oQue || 'Essa análise'} faz parte do <b>Meta Assistente completo</b>, do plano Premium.<br><br>`
    + `No plano Gratuito eu continuo te ajudando com: dúvidas sobre o app, o seu treino de hoje e o plano da semana, como fazer os exercícios do seu treino, registrar peso, atividades e dores, e orientações básicas.<br><br>`
    + `<button class="btn btn-primary" style="padding:9px 16px;font-size:13px" onclick="closeAssistant();setTimeout(()=>mtPremiumAviso('assistente'),220)">Conhecer o Premium</button>`;
}
Object.keys(MA_ANSWERS).forEach(k=>{
  if(!MA_KEYS_PREMIUM.has(k) || typeof MA_ANSWERS[k] !== 'function') return;
  const f = MA_ANSWERS[k];
  MA_ANSWERS[k] = function(){ return mtTem('assistente') ? f.apply(this, arguments) : maRespostaPremium(); };
});
const _maNudgeB40 = window.maNudge;
window.maNudge = function(){
  const n = _maNudgeB40.apply(this, arguments);
  if(!n || mtTem('assistente')) return n;
  if(n.dica && n.dica.boasVindas) return n;
  if(n.tone === 'special' || n.tone === 'rare') return n;   // comemorações de marcos continuam
  if(n.tone === 'important' && /recorde|seguidos|treino!/i.test(n.text||'') && !/prova|n[íi]vel|resultado/i.test(n.text||'')) return n;
  return null;                                              // dicas proativas, oferta de nível e orientação de prova: Premium
};
['evoOfertaPendente','provaOrientacao','provaAviso','provaPosAviso'].forEach(f=>{
  const o = window[f]; if(typeof o !== 'function') return;
  window[f] = function(){ if(_planoConhecido() && !mtTem('assistente')) return null; return o.apply(this, arguments); };
});
const _evoComandoB40 = window.evoComando;
if(typeof _evoComandoB40 === 'function') window.evoComando = function(t){
  if(!mtTem('assistente') && /n[íi]vel/.test(String(t||''))) return { done:true, msg: maRespostaPremium('O acompanhamento de nível') };
  return _evoComandoB40.apply(this, arguments);
};
const _maExtraB40 = window.maExtraWorkout;
if(typeof _maExtraB40 === 'function') window.maExtraWorkout = function(){ if(!mtTem('assistente')) return { done:true, msg: maRespostaPremium('Montar treino extra pelo assistente') }; return _maExtraB40.apply(this, arguments); };
const _maTryCommandB40 = window.maTryCommand;
window.maTryCommand = function(txt){
  const premium = mtTem('assistente');
  if(!premium){
    // "como fazer X": só os exercícios do plano (o vídeo do treino é livre; a consulta livre é Premium)
    const t = String(txt||'').toLowerCase().trim();
    const m = t.match(/(?:como (?:fazer|faço|se faz|executa)|me mostra|v[íi]deo d[eo])\s+(?:o |a |um |uma )?(.+)/);
    if(m){
      const busca = m[1].replace(/[?!.]/g,'').trim(); let achou = null, melhor = 0;
      EX_BANK.forEach(c=>c.items.forEach(ex=>{ const s = busca.split(/\s+/).filter(p=>p.length>2).filter(p=>ex.name.toLowerCase().includes(p)).length; if(s > melhor){ melhor = s; achou = ex; } }));
      if(achou && melhor > 0 && !mtExNoPlano(achou.name)) return { done:true, msg:`<b>${mtEsc(achou.name)}</b> não está no seu plano. ${maRespostaPremium('A consulta de qualquer exercício do catálogo')}` };
    }
  }
  const r = _maTryCommandB40.apply(this, arguments);
  if(!premium && typeof maPending !== 'undefined' && maPending && (maPending.type === 'equip' || maPending.type === 'schedule')){
    maPending = null;
    return { done:true, msg: maRespostaPremium(maPendingTxt()) + `<br><br>Dá para fazer essa mudança você mesmo em <b>Perfil › Ajustar plano</b>. 😉` };
  }
  return r;
};
function maPendingTxt(){ return 'Reorganizar o plano pelo assistente'; }

// ---------- 11. Estilo dos ícones (na conta, aplicado no app inteiro) ----------
function iconeEstiloAtual(){ return document.documentElement.classList.contains('sobrio') ? 'linha' : 'emoji'; }
function iconeEstiloSalvar(v){
  v = v === 'emoji' ? 'emoji' : 'linha';
  try{ state.prefs = state.prefs || {}; state.prefs.icones = v; saveData(); }catch(e){}
  try{ localStorage.setItem('metatreino_estilo', v === 'emoji' ? 'colorido' : 'sobrio'); }catch(e){}
}
// troca na hora quando dá (minimalista), recarrega quando precisa (os emojis originais voltam)
function iconeEstiloAplicar(v, recarregar){
  if(v === iconeEstiloAtual()) return;
  if(v === 'linha'){ document.documentElement.classList.add('sobrio'); try{ iniciaEstiloSobrio(); }catch(e){} return; }
  if(recarregar !== false){ try{ syncToCloud(); }catch(e){} setTimeout(()=>location.reload(), 700); }
}
setEstiloIcones = function(v){
  const k = v === 'colorido' ? 'emoji' : 'linha';
  iconeEstiloSalvar(k); try{ closeModal(); }catch(e){}
  iconeEstiloAplicar(k);
  if(k === 'linha') try{ renderProfile(); }catch(e){}
};
function openEstiloIconesB40(){
  const cur = iconeEstiloAtual();
  const amostraLinha = ['dumbbell','flame','trophy','calendar','heart'].map(n=>`<svg viewBox="0 0 24 24">${ICO_SVG[n]}</svg>`).join('');
  $('modal-inner').innerHTML = `<h3>Estilo dos ícones</h3>
    <p class="mt-muted" style="margin:0 0 10px;font-size:12.5px;line-height:1.5">Vale para o app inteiro e fica salvo na sua conta (aparece igual nos outros aparelhos).</p>
    <div class="ic-opcoes">${iconeOpcoesHtml(cur, 'setEstiloIcones')}</div>
    ${cur==='linha' ? `<div class="mt-sec">Traço</div>${['fina','linha','duo'].map(k=>`<div class="ap-pack ${k===getPacote()?'on':''}" onclick="setPacote('${k}');setTimeout(openEstiloIconesB40,30)"><div><b style="font-size:14px">${ICO_PACOTES[k].nome}</b><div style="font-size:11.5px;color:var(--text-mute)">${ICO_PACOTES[k].sub}</div></div><div class="ap-sample ${k}">${amostraLinha}</div></div>`).join('')}` : ''}
    <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="closeModal();renderProfile()">Pronto</button>`;
  $('modal-back').classList.add('on');
}
function iconeOpcoesHtml(cur, fn){
  const linha = ['dumbbell','run','droplet','trophy'].map(n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICO_SVG[n]}</svg>`).join('');
  return `<button type="button" class="ic-op ${cur==='linha'?'on':''}" onclick="${fn}('${fn==='setEstiloIcones'?'sobrio':'linha'}')" aria-pressed="${cur==='linha'}">
      <span class="ic-am ic-am-linha">${linha}</span><b>Ícones minimalistas</b><small>Linhas finas na cor do tema. Visual limpo e profissional.</small></button>
    <button type="button" class="ic-op ${cur==='emoji'?'on':''}" onclick="${fn}('${fn==='setEstiloIcones'?'colorido':'emoji'}')" aria-pressed="${cur==='emoji'}">
      <span class="ic-am ic-am-emoji" data-manter-emoji>💪🏃💧🏆</span><b>Emojis coloridos</b><small>Mais cor e descontração, nos lugares que usam emojis.</small></button>`;
}
openEstiloIcones = openEstiloIconesB40;
// conta → aparelho: na entrada, o estilo salvo na conta passa a valer neste aparelho
mtGancho('bootAfterAuth', { antes(){
  try{
    const v = state && state.prefs && state.prefs.icones; if(!v) return;
    try{ localStorage.setItem('metatreino_estilo', v === 'emoji' ? 'colorido' : 'sobrio'); }catch(e){}
    if(v !== iconeEstiloAtual()){
      if(v === 'linha') iconeEstiloAplicar('linha');
      else if(sessionStorage.getItem('mt_ico_reload') !== '1'){ sessionStorage.setItem('mt_ico_reload','1'); setTimeout(()=>location.reload(), 300); }
    }
  }catch(e){}
}});

// ---------- 12. Aparência: os 10 temas com as prévias reais, Premium marcado ----------
openAparencia = function(){
  const cur = currentTheme(); const prem = mtPremium() || !_planoConhecido();
  const opt = k=>{ const t = THEMES[k]; const trava = !prem && temaPremium(k); const exclusivo = !!t.premium;
    return `<button type="button" class="ap-opt ${k===cur?'on':''} ${trava?'pl-trava':''}" onclick="setTheme('${k}');setTimeout(openAparencia,30)" aria-label="Tema ${mtEsc(t.nome)}${trava?' (Premium)':''}">
      <span class="wz-tema-prev ap-prev-real" data-theme="${k}" aria-hidden="true"><span class="tp-top"><i></i><b></b></span><span class="tp-card"><b></b><i></i><em></em></span><span class="tp-btn"></span><span class="tp-tab"><i></i><i></i><i></i><i></i></span></span>
      <div class="ap-name"><span>${mtEsc(t.nome)}</span>${k===cur?'<span style="color:var(--primary-2)">✓</span>':''}${trava||exclusivo?`<span class="pl-mini">${PL_EST}${exclusivo?'Exclusivo':''}</span>`:''}</div><small style="color:var(--text-mute);font-size:11px;margin-top:-4px">${mtEsc(t.sub)}</small></button>`; };
  const deco = (typeof decoEnabled==='function') ? decoEnabled() : true;
  $('modal-inner').innerHTML = `<h3>Aparência</h3>
    ${!prem ? `<div class="pl-faixa">No plano Gratuito: <b>Brasa</b> (escuro) e <b>Areia</b> (claro). Os outros temas são Premium. <a href="#" onclick="openPlanos();return false">Ver planos ›</a></div>` : ''}
    <div class="mt-sec" style="margin-top:6px">Tema Noturno</div>
    <div class="ap-grid">${TEMAS_NOTURNOS.filter(k=>THEMES[k]).map(opt).join('')}</div>
    <div class="mt-sec">Tema Claro</div>
    <div class="ap-grid">${TEMAS_CLAROS.filter(k=>THEMES[k]).map(opt).join('')}</div>
    <div class="mt-sec">Estilo dos ícones</div>
    <div class="list-row" onclick="openEstiloIconesB40()"><span>✨</span> <span>${iconeEstiloAtual()==='linha'?'Ícones minimalistas':'Emojis coloridos'}</span><span style="margin-left:auto;color:var(--text-mute);font-size:12px">trocar ›</span></div>
    <div class="mt-sec">Detalhes</div>
    <div class="ap-switch" onclick="toggleDeco();openAparencia()"><div><b style="font-size:14px">Fundo decorativo</b><div style="font-size:11.5px;color:var(--text-mute)">Desenho discreto no fundo de cada aba</div></div><span class="ap-tog ${deco?'on':''}"></span></div>
    <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="closeModal();renderProfile()">Pronto</button>`;
  $('modal-back').classList.add('on');
  const rv = $('theme-row-val'); if(rv) rv.textContent = (temaClaro(cur)?'Tema Claro':'Tema Noturno')+' · '+THEMES[cur].nome+' ›';
  try{ janelaInstantanea('perfil'); }catch(e){}
};
// cadastro: os temas Premium aparecem marcados (quem está no teste pode escolher; no Gratuito ficam travados)
mtGancho('wzRenderTemas', { depois(){
  try{
    const box = $('wz-temas'); if(!box) return;
    box.querySelectorAll('.wz-tema').forEach(b=>{
      const k = (b.getAttribute('onclick')||'').match(/wzEscolheTema\('(\w+)'\)/); if(!k) return;
      const t = THEMES[k[1]]; if(!t) return;
      const nome = b.querySelector('.wz-tema-nome');
      if(nome && temaPremium(k[1]) && !nome.querySelector('.pl-mini')) nome.insertAdjacentHTML('beforeend', `<small class="pl-mini">${PL_EST}${t.premium?'Exclusivo':'Premium'}</small>`);
      b.classList.toggle('pl-trava', !temaLiberado(k[1]));
    });
  }catch(e){}
}});

Object.assign(window, { mtPremium, mtTem, mtPremiumAviso, openPlanos, mtPlanoMudou, mtPlanoVerifica, mtTemaConfere, temaLiberado, temaPremium,
  piBasico, openEstiloIconesB40, iconeEstiloSalvar, iconeEstiloAplicar, iconeOpcoesHtml, mtExNoPlano, MT_RECURSOS, TEMAS_GRATIS });

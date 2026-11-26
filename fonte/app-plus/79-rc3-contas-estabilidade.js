// ===================================================================================================
// RC 3 — Etapa 1: estabilidade e integridade dos dados
// ---------------------------------------------------------------------------------------------------
// 1. Isolamento entre contas no mesmo aparelho (tema, preferências locais, conversa, telas)
//    CAUSA: o tema ficava numa chave única do aparelho (metatreino_theme) e a regra da Beta 38 dizia
//    "o tema do aparelho nunca é trocado pelo da conta". Quem entrava com outro login herdava o tema
//    de quem saiu. A conversa do Meta Assistente também ficava numa chave única (corrigido no app.js:
//    maThreadChave). Várias marcas locais (cartão do dia fechado, seções recolhidas, preferências do
//    card de compartilhar, "nome no card") também eram do aparelho e não da pessoa.
//    AGORA: o aparelho guarda de QUEM é cada preferência local (mt_conta_local). Mudou a conta → as
//    marcas pessoais do aparelho são apagadas e o tema passa a ser o da conta (ou o padrão, se a conta
//    nunca escolheu). Sair da conta volta o aparelho ao padrão e recarrega a página (app.js: doLogout).
// ===================================================================================================
const MT_LOCAL_PESSOAL = ['mt_smart_fechado','mt_motiva_hist','mt_chal_visto','mt_feedback_seen','mt_mob_recolhido','metatreino_quote_ctx',
  'mt_aviso_teste','mt_sane','mt_syncerr','mt_fab_vistos','mt_ma_thread','metatreino_pack','metatreino_emojitone','metatreino_deco'];
const MT_LOCAL_PESSOAL_PREFIXOS = ['mt_col_','mt_share_','mt_evo_','mt_pf_','mt_cali_','mt_ma_thread_','metatreino_special_shown_'];
function mtLimpaLocalPessoal(manterConversaDe){
  try{
    MT_LOCAL_PESSOAL.forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
    const ks = []; for(let i=0; i<localStorage.length; i++){ const k = localStorage.key(i); if(k) ks.push(k); }
    ks.forEach(k=>{
      if(manterConversaDe && k === 'mt_ma_thread_' + manterConversaDe) return;
      if(MT_LOCAL_PESSOAL_PREFIXOS.some(p=>k.indexOf(p) === 0)){ try{ localStorage.removeItem(k); }catch(e){} }
    });
  }catch(e){}
}
function _mtTemaPadraoAparelho(){
  try{ localStorage.removeItem(THEME_KEY); localStorage.removeItem('metatreino_theme_uid'); }catch(e){}
  try{ applyTheme('zepp', true); }catch(e){}
}
// chamada pelo doLogout (app.js) antes de recarregar: nada pessoal fica na tela de entrada
function mtContaLocalSaiu(){
  mtLimpaLocalPessoal();
  _mtTemaPadraoAparelho();
}
// na entrada: confere se o aparelho estava com outra conta
mtGancho('bootAfterAuth', { antes(){
  try{
    const uid = uidDados(); if(!uid || !state || !state.user) return;
    const ant = localStorage.getItem('mt_conta_local');
    if(ant && ant !== uid){
      mtLimpaLocalPessoal();
      try{ localStorage.removeItem(THEME_KEY); }catch(e){}
    }
    // tema: o da conta vale sempre que existir; sem tema na conta e com tema de OUTRA pessoa no aparelho → padrão
    const dono = localStorage.getItem('metatreino_theme_uid');
    const daConta = state.prefs && state.prefs.tema && THEMES[state.prefs.tema] ? state.prefs.tema : null;
    if(daConta){ if(currentTheme() !== normalizaTema(daConta)) applyTheme(daConta, true); localStorage.setItem(THEME_KEY, normalizaTema(daConta)); }
    else if(dono && dono !== uid){ _mtTemaPadraoAparelho(); }
    else if(!dono && ant && ant !== uid){ _mtTemaPadraoAparelho(); }
    localStorage.setItem('metatreino_theme_uid', uid);
    localStorage.setItem('mt_conta_local', uid);
  }catch(e){ console.log('conta local:', e); }
}});
// escolher um tema marca de quem ele é
mtGancho('setTheme', { depois(){ try{ const u = uidDados(); if(u) localStorage.setItem('metatreino_theme_uid', u); }catch(e){} } });

Object.assign(window, { mtLimpaLocalPessoal, mtContaLocalSaiu });

// ===================================================================================================
// 2. Esforço × cansaço  ("Treinou 3 dias seguidos após relatar cansaço" sem nunca ter relatado)
//    CAUSA: a régua de ESFORÇO do fim do treino (1–10) era convertida em "como terminou" (rpeToFeel):
//    7–8 virava "cansado". A conquista secreta "Nem a Preguiça" exigia só 3 dias seguidos e QUALQUER
//    treino do histórico com esse "cansado" — então bastava marcar esforço 7 uma vez. Não era dado antigo
//    nem mistura de contas: era a interpretação errada do esforço.
//    AGORA: relato de cansaço é só o que a pessoa disse — "estou cansado(a)" ao Meta Assistente
//    (state.relatosCansaco), "acordei cansado(a)" no sono, ou o "cansado/exausto" escolhido no registro
//    antigo (antes da régua de esforço, sem rpe). E os 3 dias seguidos têm que vir DEPOIS do relato.
// ===================================================================================================
function mtRelatosCansaco(){
  const out = [];
  try{ (state.relatosCansaco||[]).forEach(t=>{ if(+t) out.push(+t); }); }catch(e){}
  try{ Object.entries((state.sono && state.sono.n) || {}).forEach(([dk, x])=>{ if(x && +x.d === 1){ const t = new Date(dk + 'T07:00:00').getTime(); if(t) out.push(t); } }); }catch(e){}
  try{ ['lift','run'].forEach(m=>(((state.modules[m]||{}).history)||[]).forEach(x=>{ if(x && !(+x.rpe > 0) && (x.feel === 'cansado' || x.feel === 'exausto')) out.push(+x.at - 1); })); }catch(e){}
  return out.sort((a,b)=>a-b);
}
function mtNemAPreguica(hist){
  try{
    const rel = mtRelatosCansaco(); if(!rel.length) return false;
    const H = (hist || []).filter(x=>x && x.at).map(x=>+x.at);
    return rel.some(r=>{
      const dias = [...new Set(H.filter(t=>t > r).map(t=>mtDia0Ts(t)))].sort((a,b)=>a-b);
      for(let i=0; i+2<dias.length; i++){
        const d1 = new Date(dias[i]); d1.setDate(d1.getDate()+1); const d2 = new Date(dias[i]); d2.setDate(d2.getDate()+2);
        if(dias[i+1] === d1.getTime() && dias[i+2] === d2.getTime()) return true;
      }
      return false;
    });
  }catch(e){ return false; }
}

// ===================================================================================================
// 3. Correção única das conquistas que nasceram das regras erradas (RC 3)
//    • "Primeiro PR", "5 PRs", "20 PRs": o 1º registro de cada exercício contava como recorde;
//    • "Nem a Preguiça": esforço 7+ contava como relato de cansaço.
//    Os recordes são refeitos pelo motor novo (app.js: mtPrRecalcularEx) a partir das séries guardadas.
//    Conquista que deixou de valer sai (e fica marcada em conqRevogadas para não voltar de cópia antiga
//    de outro aparelho). Se ela for ganha de verdade depois, volta normalmente.
// ===================================================================================================
function mtPrRecalcularTudo(){
  try{
    const ids = new Set([...Object.keys(state.progress||{}), ...Object.keys(state.progResumo||{}), ...Object.keys(state.prs||{})]);
    ids.forEach(id=>{
      const tem = (state.progress[id]||[]).some(p=>p && p.sets && p.sets.length) || ((state.progResumo||{})[id]||[]).length;
      if(!tem) return;   // recorde sem nenhum dado guardado (mais de 2 anos): não dá para conferir, fica como está
      mtPrRecalcularEx(id);
    });
  }catch(e){ console.log('recordes (recalcular):', e); }
}
function mtRevogaConquista(id){
  state.trophies = (state.trophies||[]).filter(t=>t !== id);
  if(state.trophyDates) delete state.trophyDates[id];
  state.conqRevogadas = state.conqRevogadas || {}; state.conqRevogadas[id] = Date.now();
  try{ if(Array.isArray(state.conqPend)) state.conqPend = state.conqPend.filter(x=>x && x.k !== id && x.id !== id); }catch(e){}
  try{ if(Array.isArray(state.awardQueue)) state.awardQueue = state.awardQueue.filter(x=>x !== id && !(x && (x.id === id || x.k === id))); }catch(e){}
}
function mtCorrecaoRC3(){
  try{
    if(!state || !state.user) return;
    mtPrRecalcularTudo();   // toda entrada: deixa os recordes coerentes com as séries (também depois de juntar cópias)
    if((+state.rc3Corr||0) >= 1) return;
    const tot = mtPrTotal(); const tira = [];
    if(tot < 1) tira.push('first_pr'); if(tot < 5) tira.push('pr_5'); if(tot < 20) tira.push('pr_20');
    const allHist = [...(((state.modules.lift||{}).history)||[]), ...(((state.modules.run||{}).history)||[])];
    if(!mtNemAPreguica(allHist)) tira.push('rain_check');
    const saiu = tira.filter(id=>(state.trophies||[]).includes(id));
    saiu.forEach(mtRevogaConquista);
    state.rc3Corr = 1; state.rc3CorrSaiu = saiu;
    saveData();
    if(saiu.length) console.log('RC 3: conquistas corrigidas', saiu);
  }catch(e){ console.log('correção RC 3:', e); }
}
mtGancho('bootAfterAuth', { depois(){ mtCorrecaoRC3(); } });

Object.assign(window, { mtRelatosCansaco, mtNemAPreguica, mtPrRecalcularTudo, mtCorrecaoRC3 });

// ===================================================================================================
// 4. Conquistas em dupla que não apareciam no aparelho da outra pessoa
//    CAUSA: a verificação das conquistas "Treinando juntos" (parte 65) só rodava quando o PRÓPRIO aparelho
//    salvava um treino (checkTrophies). Quando a outra pessoa treinava depois e publicava os horários no grupo,
//    o primeiro aparelho recebia os dados (famCache), mas ninguém conferia de novo: ela desbloqueava, ele não.
//    AGORA: quando chegam horários novos da outra pessoa, o aparelho confere as conquistas na hora (e avisa
//    como qualquer conquista nova). O critério continua o mesmo nos dois aparelhos (horários que se cruzam).
// ===================================================================================================
let _mtDuplaVisto = null;
function mtDuplaRecheca(motivo){
  try{
    if(!state || !state.user || typeof _duplaParceiro !== 'function') return;
    const P = _duplaParceiro(); const s = P && P.tr && P.tr.on ? String(P.tr.s || '') : '';
    const chave = (P ? P.uid : '') + '|' + s;
    if(chave === _mtDuplaVisto) return;
    _mtDuplaVisto = chave;
    if(!s) return;
    const antes = (state.trophies || []).length;
    mtChecaConquistas63();
    try{ if(typeof djChecaConquistas === 'function') djChecaConquistas(); }catch(e){}
    if((state.trophies || []).length !== antes){
      saveData();
      try{ if(typeof cqIndicadores === 'function') cqIndicadores(); }catch(e){}
      try{ if(state.ui && state.ui.tab === 'home') renderHome(); }catch(e){}
    }
  }catch(e){ console.log('dupla (conquistas):', motivo, e); }
}
mtGancho('_famAplica', { depois(){ setTimeout(()=>mtDuplaRecheca('grupo'), 400); } });
mtGancho('bootAfterAuth', { depois(){ setTimeout(()=>mtDuplaRecheca('entrada'), 5000); } });
Object.assign(window, { mtDuplaRecheca });

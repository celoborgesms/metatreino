// =====================================================================
// 44. Beta 33 — Auditoria geral: correção única das fichas já salvas
// =====================================================================
// O gerador de musculação (buildLiftExercises, app.js) passou a escolher por PAPEL de movimento
// (o principal do grupo primeiro), com descanso por tipo de exercício e teto de séries por sessão.
// Os planos criados antes disso podem ter, por exemplo, o peito começando por crossover, dois
// encolhimentos no mesmo treino ou mais de 30 séries numa sessão. Esta etapa confere UMA vez os
// planos salvos e só refaz quando há problema. Os exercícios principais que o aluno já usava
// (e a carga que ele vem evoluindo) continuam; as trocas feitas à mão também (applyPins).
// O histórico e os recordes não mudam: eles são guardados por exercício.
function b33FichaComProblema(w, level){
  const exs = (w && w.exercises) || []; if(!exs.length) return false;
  const porGrupo = {};
  exs.forEach(e=>{ (porGrupo[e.part] = porGrupo[e.part] || []).push(e); });
  const ruimGrupo = Object.keys(porGrupo).some(g=>{
    const lista = porGrupo[g];
    if(LIFT_GRANDES.includes(g) && lista[0] && !lista[0].pinned && exPapel(lista[0], g).tier !== 'principal') return true;
    if(lista.filter(e=>/encolhimento/i.test(e.name)).length > 1) return true;
    return false;
  });
  const series = exs.reduce((a,e)=>a+(+e.sets||0), 0);
  return ruimGrupo || series > (LIFT_TETO_SERIES[level] || 26) + 4;
}
function b33CorrigeFichas(){
  try{
    const mod = state.modules && state.modules.lift;
    if(!mod || !mod.plan || !mod.setup || state.b33Fichas || !Array.isArray(mod.plan.workouts)) return;
    const normais = mod.plan.workouts.filter(w=>w && !w.cali);
    const ruins = normais.filter(w=>b33FichaComProblema(w, mod.setup.level));
    state.b33Fichas = true;
    if(!ruins.length){ saveData(); return; }
    // principais bons de cada treino: continuam como o 1º do grupo (a carga segue evoluindo no mesmo exercício)
    const lideres = mod.plan.workouts.map(w=>{ const L = {}; ((w && w.exercises) || []).forEach(e=>{ if(!L[e.part] && exPapel(e, e.part).tier === 'principal') L[e.part] = e; }); return L; });
    regenLiftExercises();
    mod.plan.workouts.forEach((w, wi)=>{
      if(!w || w.cali) return;
      const L = lideres[wi] || {}, exs = w.exercises || [];
      Object.keys(L).forEach(part=>{
        const lead = L[part]; const idxs = exs.map((e,i)=>e.part===part ? i : -1).filter(i=>i>=0); if(!idxs.length) return;
        const first = idxs[0]; if(exs[first].pinned || exs[first].id === lead.id) return;
        const onde = exs.findIndex(e=>e.id === lead.id);
        if(onde >= 0){ const t = exs[onde]; exs[onde] = exs[first]; exs[first] = t; }
        else exs[first] = Object.assign({}, lead, { sets: exs[first].sets, rest: exs[first].rest, reps: exs[first].reps });
      });
      w.duration = estimateLiftDuration(exs, mod.setup.goal);
    });
    saveData();
    setTimeout(()=>toast(`Revisei a montagem dos seus treinos: cada grupo começa pelo exercício principal, o descanso agora varia por exercício e o volume ficou equilibrado. Seus principais foram mantidos.`, 6500), 2200);
  }catch(e){ console.log('correção das fichas (Beta 33)', e); }
}
mtGancho('renderHome', { depois(){ b33CorrigeFichas(); }});

Object.assign(window, { b33CorrigeFichas, b33FichaComProblema, restAjusta, restPausa, setRestVibrar, treinoAtivoIniciar, treinoAtivoEncerrar, telaLigadaPedir, telaLigadaSoltar });


// =====================================================================
// 42. Beta 28 — Treinos sem exercício repetido + ficha do exercício em tela cheia
// =====================================================================

// ---------- 1. Treinos sem repetir o mesmo exercício ----------
// O gerador (buildLiftExercises) continua o mesmo: séries, repetições, descanso, quantidade
// por grupo e a ordem de prioridade não mudam. Depois que ele escolhe, esta etapa confere o
// treino do dia e troca só o que é, na prática, o mesmo exercício (ex.: "Flexão Diamante" no
// peito e "Flexão Fechada (diamante)" no tríceps) por outro do mesmo grupo, com o mesmo
// equipamento. Se não houver alternativa, o exercício repetido sai e o que ficou ganha uma série
// (o volume do grupo se mantém).
//
// "chave" = exercícios que são o mesmo movimento com outro nome ou outro aparelho.
// limite = quantos dessa chave cabem no mesmo treino.
const TREINO_CHAVES = [
  { k:'flexao-diamante', re:/diamante/i, max:1, igual:true },
  { k:'agachamento-sumo', re:/agachamento sum[oô]/i, max:1, igual:true },
  { k:'rosca-martelo', re:/rosca martelo/i, max:1, igual:true },
  { k:'elevacao-lateral', re:/eleva[cç][aã]o lateral/i, max:1, igual:true },
  { k:'supino-reto', re:/supino reto|supino na m[aá]quina \(hammer\)/i, max:1 },
  { k:'supino-inclinado', re:/supino inclinado|supino na m[aá]quina inclinado/i, max:1 },
  { k:'mergulho', re:/^mergulho|\(mergulho\)/i, max:1, igual:true },
  { k:'barra-fixa', re:/^barra fixa|chin-?up/i, max:2 },
  { k:'flexao', re:/^flex[aã]o(?! pike)/i, max:3, igual:true }
];
function treinoChaves(nome){ return TREINO_CHAVES.filter(c=>c.re.test(String(nome||''))); }
// agachamento sem carga ao lado de um agachamento com carga (goblet, barra, smith, leg press, hack) é redundante
const _AGACH_CARGA = /agachamento goblet|agachamento livre com barra|agachamento no smith|leg press|hack machine/i;
function _treinoPoolDoGrupo(p, setup){
  const cat = EX_BANK.find(c=>c.name===p); if(!cat) return [];
  const equip = setup.equip || 'academia';
  const equipFilter = equip==='basico' ? ['casa','halteres'] : equip==='academia' ? ['academia','halteres','casa'] : equip==='halteres' ? ['halteres','casa'] : ['casa'];
  if(equip === 'custom') return cat.items.filter(ex=>{ try{ return podeFazerCom(ex, setup.equipList || []); }catch(e){ return false; } });
  return cat.items.filter(ex => (ex.equip||[]).some(e => equipFilter.includes(e)) && (equip==='casa' || !ex.improv));
}
// devolve a lista corrigida (não altera exercícios fixados pelo aluno: "fixos" = ids)
function treinoSemRepeticao(lista, setup, fixos){
  if(!Array.isArray(lista) || lista.length < 2) return lista;
  fixos = fixos || new Set();
  const out = lista.map(e=>Object.assign({}, e));
  const conta = ()=>{ const c = {}; out.forEach(e=>treinoChaves(e.name).forEach(ch=>{ c[ch.k] = (c[ch.k]||0) + 1; })); return c; };
  const estoura = (nome, c)=>treinoChaves(nome).some(ch=>(c[ch.k]||0) >= ch.max);
  const iso = e=>exPattern(e.name)==='isolador';
  const trocar = (i)=>{
    const velho = out[i]; const c = conta();
    // tira o próprio exercício da contagem antes de testar candidatos
    treinoChaves(velho.name).forEach(ch=>{ c[ch.k]--; });
    const usados = new Set(out.map(e=>e.id));
    const padroesDoGrupo = new Set(out.filter((e,j)=>j!==i && e.part===velho.part).map(e=>exPattern(e.name)));
    const cands = _treinoPoolDoGrupo(velho.part, setup).filter(ex=>!usados.has(slug(ex.name)) && !estoura(ex.name, c) && !!ex.iso === (velho.unit==='tempo')
      && !(/peso corporal/i.test(ex.name) && /^agachamento/i.test(ex.name) && out.some(e=>_AGACH_CARGA.test(e.name))));
    if(!cands.length) return false;
    // preferências: mesmo tipo (composto/isolador) e um movimento que o grupo ainda não tem
    cands.sort((a,b)=>((iso(a)===iso(velho)?0:1) - (iso(b)===iso(velho)?0:1)) || ((padroesDoGrupo.has(exPattern(a.name))?1:0) - (padroesDoGrupo.has(exPattern(b.name))?1:0)));
    const n = cands[0];
    out[i] = Object.assign({}, velho, { id:slug(n.name), name:n.name, sub:n.sub, equip:n.equip });
    return true;
  };
  const tirar = (i, parceiro)=>{
    const velho = out.splice(i, 1)[0];
    if(parceiro){ const p = out.find(e=>e.id===parceiro.id); if(p) p.sets = Math.min(5, (parseInt(p.sets)||3) + 1); }
    return velho;
  };
  // 1) agachamento sem carga quando já existe um com carga
  for(let i=out.length-1;i>=0;i--){
    const e = out[i];
    if(fixos.has(e.id) || !/^agachamento livre \(peso corporal\)/i.test(e.name)) continue;
    if(!out.some((x,j)=>j!==i && _AGACH_CARGA.test(x.name))) continue;
    if(!trocar(i)){ const par = out.find((x,j)=>j!==i && _AGACH_CARGA.test(x.name)); tirar(i, par); }
  }
  // 2) chaves acima do limite: da última para a primeira (os primeiros são os prioritários do gerador)
  for(let volta=0; volta<3; volta++){
    let mudou = false; const c = conta();
    for(let i=out.length-1;i>=0;i--){
      const e = out[i]; if(fixos.has(e.id)) continue;
      const ch = treinoChaves(e.name).find(ch=>(c[ch.k]||0) > ch.max); if(!ch) continue;
      if(trocar(i)){ mudou = true; break; }
      if(ch.igual){ const par = out.find((x,j)=>j!==i && ch.re.test(x.name)); tirar(i, par); mudou = true; break; }
      // movimento parecido sem alternativa no equipamento do aluno: fica (é o que dá para fazer)
      c[ch.k]--;
    }
    if(!mudou) break;
  }
  return out;
}
const _buildLiftExercisesB28 = window.buildLiftExercises;
window.buildLiftExercises = function(parts, setup){
  const lista = _buildLiftExercisesB28.apply(this, arguments);
  try{ return treinoSemRepeticao(lista, setup || {}); }catch(e){ console.log('treino sem repetição', e); return lista; }
};
// Planos já salvos: corrige uma vez (só os treinos de musculação gerados pelo app; exercícios
// trocados à mão pelo aluno não mudam). O histórico fica igual: ele é guardado por exercício.
function treinoCorrigeSalvos(){
  try{
    const mod = state.modules && state.modules.lift; if(!mod || !mod.plan || !mod.setup || state.b28SemRepeticao) return;
    let n = 0;
    (mod.plan.workouts||[]).forEach(w=>{
      if(!w || w.cali || !Array.isArray(w.exercises)) return;
      const fixos = new Set((w.pins||[]).map(p=>p && (p.to || p.id || p.novo)).filter(Boolean));
      const antes = w.exercises.map(e=>e.id).join('|');
      const novo = treinoSemRepeticao(w.exercises, mod.setup, fixos);
      if(novo.map(e=>e.id).join('|') !== antes){ w.exercises = novo; w.duration = estimateLiftDuration(novo, mod.setup.goal); n++; }
    });
    state.b28SemRepeticao = true; saveData();
    if(n) setTimeout(()=>toast(`Ajustei ${n===1?'1 treino':n+' treinos'} para não repetir o mesmo exercício.`), 1800);
  }catch(e){ console.log('corrige planos', e); }
}
mtGancho('renderHome', { depois(){ treinoCorrigeSalvos(); }});

// ---------- 2. Ficha do exercício ("Ver como fazer") ----------
// Ocupa a tela toda: o vídeo fica no topo e o conteúdo ganha o espaço que sobrava em cima.
// O botão Fechar fica fixo embaixo (não corta mais depois de sair da tela cheia).
// A altura real da tela é medida de novo ao sair da tela cheia e ao girar o celular.
function mtMedeTela(){ try{ document.documentElement.style.setProperty('--mt-vh', (window.innerHeight/100) + 'px'); }catch(e){} }
mtMedeTela();
window.addEventListener('resize', mtMedeTela);
window.addEventListener('orientationchange', ()=>setTimeout(mtMedeTela, 250));
document.addEventListener('fullscreenchange', ()=>{
  [60, 300, 700].forEach(t=>setTimeout(()=>{
    mtMedeTela();
    const mi = $('modal-inner');
    if(!document.fullscreenElement && mi && mi.classList.contains('modal-ex')){ mi.style.transform = 'translateZ(0)'; void mi.offsetHeight; mi.style.transform = ''; }
  }, t));
});
mtGancho('openExerciseSheet', { depois(){
  const mi = $('modal-inner'); if(!mi || !mi.classList.contains('modal-ex')) return;
  const sc = mi.querySelector('.ex-scroll'); if(!sc) return;
  const fechar = [...sc.children].reverse().find(b=>b.tagName==='BUTTON' && /Fechar/.test(b.textContent));
  if(fechar && !mi.querySelector('.ex-rodape')){
    const rod = document.createElement('div'); rod.className = 'ex-rodape';
    fechar.style.marginTop = '0'; rod.appendChild(fechar); mi.appendChild(rod);
  }
  mtMedeTela();
}});

Object.assign(window, { treinoSemRepeticao, treinoCorrigeSalvos, mtMedeTela });

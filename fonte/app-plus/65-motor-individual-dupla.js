// =====================================================================
// 65. Beta 63 — motor de musculação mais individual, aparelhos e treino em dupla, novas conquistas
// ---------------------------------------------------------------------
// NÃO é uma segunda engine: o gerador continua sendo generatePlan/buildLiftExercises (app.js). Aqui ficam:
//  1. Classificação muscular refinada (mmMusculosDe): ênfase, padrão de movimento e secundários corretos —
//     crucifixo/voador sem tríceps, flexora com panturrilha, extensora sem adutores, stiff com posterior
//     como principal etc. Isso alimenta o mapa muscular, o PDF e a contagem de séries por músculo.
//  2. Escolha individual entre opções equivalentes (liftEscolheIndividual, chamada pelo app.js):
//     favoritos primeiro; senão uma semente da própria conta. Duas pessoas com as mesmas respostas
//     recebem fichas diferentes, mas com o mesmo papel em cada posição (mesmo estímulo).
//  3. Estações de treino (exEstacao): qual aparelho cada exercício ocupa (polia, leg press, banco…).
//  4. Treino em dupla (usa o grupo da Alimentação da casa SÓ para saber quem treina no mesmo lugar):
//     cada pessoa publica, no próprio perfil do grupo, quais estações usa em cada dia (texto curto) e,
//     se quiser, as janelas dos treinos (para as conquistas em dupla). "Organizar meu plano" muda SÓ o
//     plano de quem tocou: troca a ordem dos treinos entre os SEUS dias e, se um aparelho de unidade única
//     está com a outra pessoa no mesmo dia, troca por um equivalente (mesmo grupo, mesmo papel, equipamento
//     que você tem, sem conflito com limitações). Sem equivalente, mantém e avisa. Dá para desfazer.
//     Corrida e Alimentação da casa não são tocadas.
//  5. Conquistas novas: Calistenia, Híbrido e Treinando juntos (comuns, raras, especiais e secretas),
//     todas por critério verificável no histórico; e o ícone das conquistas de corrida (o tênis
//     parecia um ferro de passar).
// =====================================================================

// ---------- 1. classificação muscular ----------
const MM_ENFASE = [
  // [regex no nome, { enf, mov, sec(substitui), est(acrescenta) }]
  // panturrilha primeiro: "Panturrilha no Leg Press" não é exercício de quadríceps
  [/panturrilha sentada/, { enf:'Sóleo (joelho dobrado)', mov:'flexão plantar' }],
  [/panturrilha/, { enf:'Gastrocnêmio (joelho estendido)', mov:'flexão plantar' }],
  [/crucifixo|voador|peck deck/, { enf:'Isolador: o tríceps praticamente não participa', mov:'adução horizontal do ombro', sec:['deltoide'] }],
  [/crossover.*alto/, { enf:'Ênfase na porção inferior do peitoral', mov:'adução do ombro (de cima para baixo)', sec:['deltoide'] }],
  [/crossover.*baixo/, { enf:'Ênfase na porção superior (clavicular)', mov:'adução do ombro (de baixo para cima)', sec:['deltoide'] }],
  [/supino.*inclinad|flexao inclinada/, { enf:'Ênfase na porção superior (clavicular) e mais deltoide anterior', mov:'empurrar inclinado' }],
  [/supino.*maquina|hammer/, { enf:'Trajeto guiado: menos estabilização, fácil de levar perto da falha', mov:'empurrar horizontal' }],
  [/supino.*halter/, { enf:'Maior amplitude; cada braço estabiliza a própria carga', mov:'empurrar horizontal', est:['abdomen'] }],
  [/supino reto com barra/, { enf:'Básico de força: mais carga total', mov:'empurrar horizontal', est:['abdomen'] }],
  [/pullover com halter/, { enf:'Peitoral alongado sobre a cabeça; dorsal ajuda', mov:'extensão do ombro com braço estendido', sec:['dorsal','triceps'] }],
  [/flexao diamante|flexao fechada/, { enf:'Mãos próximas: tríceps trabalha quase tanto quanto o peito', mov:'empurrar horizontal', sec:['deltoide'] }],
  [/flexao com maos elevadas/, { enf:'Versão mais leve da flexão', mov:'empurrar horizontal' }],
  [/pullover na polia/, { enf:'Braço estendido: dorsal sem o bíceps ajudar', mov:'extensão do ombro', sec:['triceps'] }],
  [/puxada|pulldown|barra fixa/, { enf:'Puxada vertical: largura das costas', mov:'puxar vertical' }],
  [/remada/, { enf:'Puxada horizontal: espessura do meio das costas', mov:'puxar horizontal' }],
  [/elevacao frontal/, { enf:'Deltoide anterior', mov:'flexão do ombro', sec:['peito'] }],
  [/pike/, { enf:'Empurrar acima da cabeça com o peso do corpo', mov:'empurrar vertical', sec:['triceps','trapezio'] }],
  [/desenvolvimento/, { enf:'Empurrar acima da cabeça', mov:'empurrar vertical' }],
  [/elevacao lateral/, { enf:'Deltoide lateral (largura dos ombros)', mov:'abdução do ombro' }],
  [/chin-up/, { enf:'Pegada supinada: bíceps forte, dorsal junto', mov:'puxar vertical', sec:['dorsal','antebraco'] }],
  [/mergulho no banco/, { enf:'Tríceps com o peso do corpo', mov:'extensão do cotovelo', sec:['deltoide','peito'] }],
  [/maquina \(mergulho\)/, { enf:'Tríceps guiado', mov:'extensão do cotovelo', sec:['peito'] }],
  [/extensora/, { enf:'Isolador de quadríceps', mov:'extensão do joelho', sec:[] }],
  [/flexora|nordic/, { enf:'Isolador de posterior de coxa', mov:'flexão do joelho', sec:['panturrilha'] }],
  [/stiff/, { enf:'Posterior de coxa alongado; glúteo ajuda', mov:'dobradiça de quadril', prim:['posteriores'], sec:['gluteos'], est:['lombar'] }],
  [/hack/, { enf:'Quadríceps com o tronco apoiado', mov:'agachar guiado', sec:['gluteos'] }],
  [/leg press/, { enf:'Quadríceps e glúteos sem carga na coluna', mov:'empurrar com as pernas', prim:['quadriceps'], sec:['gluteos','adutores'] }],
  [/abdutora|abducao|concha/, { enf:'Glúteo médio (lateral do quadril)', mov:'abdução do quadril', sec:[] }],
  [/adutora/, { enf:'Adutores (parte interna da coxa)', mov:'adução do quadril', sec:[] }],
  [/hip thrust|elevacao pelvica|ponte/, { enf:'Glúteo máximo no encurtamento', mov:'extensão do quadril' }],
  [/coice|kickback/, { enf:'Glúteo máximo, uma perna de cada vez', mov:'extensão do quadril' }],
  [/agachamento|afundo|bulgaro|step-up|passada/, { mov:'agachar / avançar' }],
  [/terra/, { enf:'Cadeia posterior inteira com carga alta', mov:'dobradiça de quadril' }],
  [/farmer/, { enf:'Pegada e core segurando a carga andando', mov:'transporte de carga', sec:['antebraco','trapezio'] }],
  [/rosca martelo/, { enf:'Braquial e antebraço (pegada neutra)', mov:'flexão do cotovelo' }],
  [/rosca/, { mov:'flexão do cotovelo' }],
  [/triceps|frances|testa|coice com haltere/, { mov:'extensão do cotovelo' }],
  [/encolhimento/, { mov:'elevação das escápulas' }],
  [/prancha|hollow|dead bug|pallof/, { enf:'Estabilidade: o core segura o corpo parado', mov:'anti-movimento' }],
  [/crunch|abdominal|elevacao de pernas|russian|bicicleta|mountain/, { mov:'flexão / rotação do tronco' }]
];
(function(){
  const _mm = window.mmMusculosDe; if(typeof _mm !== 'function') return;
  window.mmMusculosDe = function(ex){
    const r = _mm.apply(this, arguments);
    try{
      const n = mtNorm((ex && ex.name) || '');
      const regra = MM_ENFASE.find(([re])=>re.test(n)); if(!regra) return r;
      const R = regra[1];
      if(R.prim) r.prim = R.prim.slice();
      if(R.sec) r.sec = R.sec.filter(k=>!r.prim.includes(k));
      if(R.est) R.est.forEach(k=>{ if(!r.prim.includes(k) && !r.sec.includes(k) && !r.est.includes(k)) r.est.push(k); });
      r.est = r.est.filter(k=>!r.prim.includes(k) && !r.sec.includes(k));
      r.enf = R.enf || ''; r.mov = R.mov || '';
    }catch(e){}
    return r;
  };
})();

// ---------- 3. estações (aparelho que o exercício ocupa) ----------
const MT_ESTACOES = {
  polia:'Polia / cabo', legpress:'Leg press', extensora:'Cadeira extensora', flexora:'Mesa / cadeira flexora', smith:'Smith',
  hack:'Hack', maq_peito:'Máquina de peito / voador', maq_remada:'Máquina de remada', maq_ombro:'Máquina de ombro',
  adut_abdut:'Cadeira adutora / abdutora', maq_gluteo:'Máquina de glúteo', maq_panturrilha:'Máquina de panturrilha',
  maq_braco:'Máquina de braço', banco_supino:'Banco de supino com barra', rack:'Rack / gaiola', barra_livre:'Barra e anilhas',
  banco:'Banco ajustável', barra_fixa:'Barra fixa', paralelas:'Paralelas', halteres:'Halteres'
};
function exEstacao(ex){
  const n = mtNorm((ex && ex.name) || '');
  const R = [
    [/leg press/, 'legpress'], [/extensora/, 'extensora'], [/flexora/, 'flexora'], [/smith/, 'smith'], [/hack/, 'hack'],
    [/polia|cabo|pulley|pulldown|puxada|crossover|face pull|pallof|corda/, 'polia'],
    [/voador|peck deck|supino na maquina/, 'maq_peito'], [/remada na maquina|remada articulada|cavalinho|t-bar/, 'maq_remada'],
    [/desenvolvimento na maquina|elevacao lateral na maquina/, 'maq_ombro'], [/adutora|abdutora/, 'adut_abdut'],
    [/gluteo na maquina|kickback/, 'maq_gluteo'], [/panturrilha em pe na maquina|panturrilha sentada|donkey/, 'maq_panturrilha'],
    [/scott na maquina|triceps na maquina/, 'maq_braco'],
    [/supino (reto|inclinado) com barra|supino pegada fechada/, 'banco_supino'],
    [/agachamento livre com barra|desenvolvimento com barra/, 'rack'],
    [/levantamento terra|remada curvada|rosca direta com barra|encolhimento com barra|testa \(barra/, 'barra_livre'],
    [/barra fixa|chin-up/, 'barra_fixa'], [/paralelas/, 'paralelas'],
    [/supino .*halter|crucifixo com halter|pullover com halter|spider|remada unilateral|scott no banco|step-up|bulgaro|mergulho no banco|hip thrust|elevacao pelvica/, 'banco'],
    [/halter|goblet|farmer|arnold/, 'halteres']
  ];
  const r = R.find(([re])=>re.test(n)); return r ? r[1] : null;
}
// quantas unidades: o que a pessoa informou; sem informação, 1 de cada aparelho e halteres como vários pares
// Beta 64: 0 = não tenho (o plano evita), 1 = um só (evita disputa na dupla), 2 = dois ou mais
function _duplaQtd(st, q){ q = q || {}; if(q[st] != null) return +q[st] === 0 ? 0 : (+q[st] || 1); return st === 'halteres' ? 2 : 1; }
function _eqTenho(st){ return !st || _duplaQtd(st, _duplaCfg().q) > 0; }

// ---------- 2. escolha individual entre equivalentes ----------
function _mtHash(s){ let h = 2166136261; s = String(s||''); for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function _mtSementeConta(){
  try{ if(typeof fbUser !== 'undefined' && fbUser && fbUser.uid) return fbUser.uid; }catch(e){}
  try{ const p = state.user && state.user.profile; if(p) return [p.nick||'', p.birth||'', p.height||''].join('|'); }catch(e){}
  return 'mt';
}
function liftEscolheIndividual(pool, grupo, papel, setup, opts){
  try{
    if(!Array.isArray(pool) || !pool.length) return null;
    opts = opts || {};
    // só disputam a vaga as opções que o gerador já considerou igualmente boas: não usadas antes na semana,
    // fora do bloco anterior, adequadas ao nível e (na força) com o melhor posto de força
    const ev = window.__evitarIds; const usados = opts.usadosSemana;
    let ok = pool.filter(e=>!(usados && usados.has(slug(e.name))) && !(ev && ev.size && ev.has(slug(e.name))));
    if((setup.level||'iniciante') === 'iniciante') ok = ok.filter(e=>!LIFT_AVANCADO.test(e.name));
    if((setup.goal) === 'forca' && ok.length){ const m = Math.min(...ok.map(forcaRank)); ok = ok.filter(e=>forcaRank(e) === m); }
    if(!ok.length) return null;
    // quem tem carga (academia/halteres) faz com carga: entre equivalentes, as versões só de peso do corpo ficam de reserva
    if((setup.equip||'academia') !== 'casa'){ const cc = ok.filter(e=>!(e.equip||[]).includes('casa')); if(cc.length) ok = cc; }
    // favorito do aluno vence
    const fav = ok.find(e=>typeof mtEhFav === 'function' && mtEhFav(slug(e.name))); if(fav) return fav;
    // treino em dupla: dentro do papel, prefere a estação livre naquele dia (camada de otimização — mesmo papel, mesmo estímulo)
    const livre = (typeof _duplaEstacaoLivre === 'function') ? ok.filter(e=>_duplaEstacaoLivre(exEstacao(e), opts.diaIdx)) : ok;
    const base = livre.length ? livre : ok;
    if(base.length === 1) return base[0];
    const i = _mtHash(_mtSementeConta() + '|' + grupo + '|' + papel) % base.length;
    return base[i];
  }catch(e){ return null; }
}

// ---------- 4. treino em dupla ----------
function _duplaCfg(){ const st = (state.modules.lift && state.modules.lift.setup) || {}; st.dupla = st.dupla || { on:false, q:{}, conq:true }; return st.dupla; }
function _duplaParceiro(){
  try{ if(typeof famAtiva !== 'function' || !famAtiva()) return null;
    const eu = _famUid(); const c = famCache() || {}; const outros = famMembros().filter(u=>u !== eu);
    // a primeira pessoa do grupo que também ligou o treino em dupla
    for(const u of outros){ const pf = (c.perfis||{})[u]; if(pf && pf.tr && pf.tr.on) return { uid:u, nome:famNome(u), tr:pf.tr }; }
    return outros.length ? { uid:outros[0], nome:famNome(outros[0]), tr:null } : null;
  }catch(e){ return null; }
}
// o que eu publico: texto curto (o Firestore não aceita lista dentro de lista)
function mtDuplaPublica(){
  try{
    const cfg = _duplaCfg(); if(!cfg.on) return null;
    const m = state.modules.lift; const d = {};
    ((m && m.plan && m.plan.workouts) || []).forEach(w=>{
      const ex = w.exercises || []; const n = ex.length || 1;
      d[String(w.dayIdx)] = ex.map((e,i)=>{ const st = exEstacao(e); return st ? `${st}@${(i/n).toFixed(2)}` : ''; }).filter(Boolean).join('|');
      if(w.parts) d['g' + w.dayIdx] = (w.parts||[]).join('+');
    });
    const out = { on:true, d, q: Object.assign({}, cfg.q || {}) };
    // janelas dos treinos das últimas 8 semanas (para as conquistas em dupla): "AAAAMMDD:HHMM:min:m|r"
    if(cfg.conq !== false){
      const ini = Date.now() - 56*DIA_MS; const s = [];
      ['lift','run'].forEach(mk=>(((state.modules[mk]||{}).history)||[]).filter(x=>x && x.at >= ini).forEach(x=>{
        if(mk === 'run' && x.activity && !['corrida','caminhada','bike'].includes(x.activity)) return;
        const dt = new Date(_mtInicio(x)); const p = v=>String(v).padStart(2,'0');
        s.push(`${dt.getFullYear()}${p(dt.getMonth()+1)}${p(dt.getDate())}:${p(dt.getHours())}${p(dt.getMinutes())}:${Math.round(+x.duration||45)}:${mk==='lift'?'m':'r'}`);
      }));
      out.s = s.slice(-60).join(',');
    }
    return out;
  }catch(e){ return null; }
}
function _duplaDiasParceiro(){
  const P = _duplaParceiro(); if(!P || !P.tr || !P.tr.on) return null;
  const out = {}; Object.keys(P.tr.d||{}).forEach(k=>{ if(/^\d$/.test(k)) out[k] = String(P.tr.d[k]||'').split('|').filter(Boolean).map(t=>{ const [st, pos] = t.split('@'); return { st, pos:+pos||0 }; }); });
  return { P, dias: out, grupos: Object.keys(P.tr.d||{}).filter(k=>/^g\d$/.test(k)).reduce((o,k)=>{ o[k.slice(1)] = P.tr.d[k]; return o; }, {}) };
}
// estação livre no dia (usada pelo gerador quando a dupla está ligada)
function _duplaEstacaoLivre(st, dia){
  try{
    if(!st) return true;
    if(!_eqTenho(st)) return false;                       // marcou que não tem esse aparelho
    if(!dia || !_duplaCfg().on) return true;
    const D = _duplaDiasParceiro(); if(!D) return true;
    const usos = (D.dias[String(dia)]||[]).filter(u=>u.st === st).length; if(!usos) return true;
    return Math.min(_duplaQtd(st, _duplaCfg().q), _duplaQtd(st, D.P.tr.q)) >= 2;
  }catch(e){ return true; }
}
// conflitos do MEU plano com o da outra pessoa
function mtDuplaConflitos(workouts){
  const D = _duplaCfg().on ? _duplaDiasParceiro() : null;
  const cfg = _duplaCfg(); const out = [];
  (workouts || ((state.modules.lift && state.modules.lift.plan && state.modules.lift.plan.workouts) || [])).forEach(w=>{
    const dela = D ? (D.dias[String(w.dayIdx)] || []) : [];
    const n = (w.exercises||[]).length || 1;
    (w.exercises||[]).forEach((e,i)=>{ const st = exEstacao(e); if(!st) return;
      // Beta 64: aparelho que a pessoa marcou que NÃO tem também entra (com ou sem dupla)
      if(!_eqTenho(st)){ out.push({ dia:w.dayIdx, w, e, st, falta:true, meuPos:i/n, delaPos:0 }); return; }
      if(!D) return;
      const u = dela.find(x=>x.st === st); if(!u) return;
      if(Math.min(_duplaQtd(st, cfg.q), _duplaQtd(st, D.P.tr.q)) >= 2) return;
      out.push({ dia:w.dayIdx, w, e, st, meuPos:i/n, delaPos:u.pos }); });
  });
  return out;
}
// mesmo grupo grande em dias seguidos atrapalha a recuperação
function _duplaCustoRecup(ordem, dias){
  const G = w=>new Set((w.parts||[]).filter(p=>LIFT_GRANDES.includes(p)).map(p=>p==='Glúteos'?'Pernas':p));
  let c = 0; const ds = dias.slice().sort((a,b)=>a-b);
  for(let i=0;i<ds.length;i++){ const a = ordem[i], b = ordem[(i+1)%ds.length]; const gap = i < ds.length-1 ? ds[i+1]-ds[i] : ds[0]+7-ds[i];
    if(gap === 1 && a !== b){ const ga = G(a), gb = G(b); for(const g of ga) if(gb.has(g)) c += 100; } }
  return c;
}
function _permutas(a){ if(a.length <= 1) return [a.slice()]; const r = []; a.forEach((x,i)=>_permutas(a.slice(0,i).concat(a.slice(i+1))).forEach(p=>r.push([x].concat(p)))); return r; }
// troca por equivalente: mesmo grupo, mesmo papel, equipamento que eu tenho, sem bater com limitação, estação livre
function _duplaEquivalente(e, w, setup){
  try{
    const cat = EX_BANK.find(c=>c.name === e.part); if(!cat) return null;
    const papel = exPapel(e, e.part).id; const temEquip = (typeof limEquipOk === 'function') ? limEquipOk(setup) : ()=>true;
    const lims = (typeof limDoSetup === 'function') ? limDoSetup(setup) : [];
    const noTreino = new Set((w.exercises||[]).map(x=>x.id));
    const cands = cat.items.filter(it=>slug(it.name) !== e.id && !noTreino.has(slug(it.name)) && exPapel(it, e.part).id === papel && temEquip(it)
      && !lims.some(k=>LIM_REGRAS[k] && LIM_REGRAS[k].evitar.test(it.name)) && _duplaEstacaoLivre(exEstacao(it), w.dayIdx)
      && !((setup.level||'iniciante')==='iniciante' && LIFT_AVANCADO.test(it.name)));
    if(!cands.length) return null;
    const fav = cands.find(it=>typeof mtEhFav === 'function' && mtEhFav(slug(it.name)));
    return fav || cands[_mtHash(_mtSementeConta() + e.id) % cands.length];
  }catch(err){ return null; }
}
function mtDuplaOrganizar(){
  const mod = state.modules.lift; if(!mod || !mod.plan) return { ok:false, msg:'Monte o plano de musculação primeiro.' };
  if(!_duplaDiasParceiro() && !(mtDuplaConflitos()||[]).length) return { ok:false, msg:'Nada para organizar: a outra pessoa ainda não ligou o treino em dupla e o seu plano usa só aparelhos que você tem.' };
  const ws = (mod.plan.workouts||[]).filter(w=>!w.cali);
  const antes = JSON.parse(JSON.stringify(mod.plan.workouts));
  const nAntes = (mtDuplaConflitos()||[]).length;
  // 1) que treino vai em que dia (só entre os SEUS dias; recuperação vem antes de tudo)
  const dias = ws.map(w=>w.dayIdx).sort((a,b)=>a-b);
  if(ws.length >= 2 && ws.length <= 6){
    const custo = ordem=>{ const tmp = ordem.map((w,i)=>Object.assign({}, w, { dayIdx:dias[i] })); return _duplaCustoRecup(ordem, dias) + (mtDuplaConflitos(tmp)||[]).length*10; };
    const atual = dias.map(d=>ws.find(w=>w.dayIdx === d));
    let melhor = atual, mc = custo(atual);
    _permutas(ws).forEach(o=>{ const c = custo(o); if(c < mc){ mc = c; melhor = o; } });
    if(melhor !== atual){ const DN = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']; melhor.forEach((w,i)=>{ w.dayIdx = dias[i]; w.dayName = DN[dias[i]-1]; }); }
  }
  // 2) aparelho de unidade única com a outra pessoa no mesmo dia: troca por equivalente; sem equivalente, mantém
  const trocas = [], mantidos = [];
  (mtDuplaConflitos()||[]).forEach(c=>{
    const alt = _duplaEquivalente(c.e, c.w, mod.setup);
    if(alt){
      const i = c.w.exercises.indexOf(c.e); if(i < 0) return;
      const novo = Object.assign({}, c.e, { id:slug(alt.name), name:alt.name, sub:alt.sub, equip:alt.equip, unit: alt.iso ? 'tempo' : c.e.unit, duplaDe:c.e.name });
      c.w.exercises[i] = novo; trocas.push({ de:c.e.name, para:alt.name, dia:c.w.dayName });
    } else mantidos.push({ ex:c.e.name, st:MT_ESTACOES[c.st]||c.st, dia:c.w.dayName, dica: c.falta ? 'não há substituto equivalente com o que você tem — mantido' : (c.delaPos < 0.5 ? 'faça este no fim do treino' : 'faça este logo no começo') });
  });
  ws.forEach(w=>{ try{ w.duration = estimateLiftDuration(w.exercises, mod.setup.goal); }catch(e){} });
  mod.plan.workouts.sort((a,b)=>(a.dayIdx||9)-(b.dayIdx||9));
  const nDepois = (mtDuplaConflitos()||[]).length;
  mod.duplaBackup = { em:Date.now(), workouts:antes };
  mod.duplaUlt = { em:Date.now(), antes:nAntes, depois:nDepois, trocas, mantidos };
  saveData();
  return { ok:true, antes:nAntes, depois:nDepois, trocas, mantidos };
}
function mtDuplaDesfazer(){
  const mod = state.modules.lift; if(!mod || !mod.duplaBackup) return false;
  mod.plan.workouts = mod.duplaBackup.workouts; delete mod.duplaBackup; delete mod.duplaUlt; saveData(); return true;
}
// --- tela ---
// Beta 64: a lista de aparelhos inclui TODO equipamento que algum exercício usa (não só os do plano atual),
// com 0 / 1 / 2+. Marcar não fecha a lista nem pula a tela para o topo.
const MT_EQ_GRUPOS = [
  ['Pesos livres e banco', ['halteres','barra_livre','banco','banco_supino','rack','barra_fixa','paralelas']],
  ['Máquinas e cabos', ['polia','legpress','extensora','flexora','smith','hack','maq_peito','maq_remada','maq_ombro','adut_abdut','maq_gluteo','maq_panturrilha','maq_braco']]
];
function openTreinoDupla(){
  const cfg = _duplaCfg(); const P = _duplaParceiro(); const mi = $('modal-inner');
  const rolagem = mi.dataset.tela === 'dupla' ? mi.scrollTop : 0;
  const D = P ? _duplaDiasParceiro() : null; const C = mtDuplaConflitos() || [];
  const CD = C.filter(c=>!c.falta), CF = C.filter(c=>c.falta);
  const ws = ((state.modules.lift && state.modules.lift.plan && state.modules.lift.plan.workouts)||[]).slice().sort((a,b)=>a.dayIdx-b.dayIdx);
  const DN = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const linhas = P && cfg.on && D ? [1,2,3,4,5,6,7].map(d=>{ const w = ws.find(x=>x.dayIdx === d); const g = D.grupos[String(d)];
    if(!w && !g) return ''; const cf = CD.filter(c=>c.dia === d);
    return `<div class="dp-l ${cf.length?'conf':''}"><b>${DN[d-1]}</b><span>Você: ${w ? mtEsc(String(w.name||'').replace(/^Treino \w — /,'')) : '—'}</span><span>${mtEsc(P.nome)}: ${g ? mtEsc(g.replace(/\+/g,' + ')) : '—'}</span>${cf.length ? `<i>${cf.map(c=>MT_ESTACOES[c.st]||c.st).filter((v,i,a)=>a.indexOf(v)===i).join(', ')}</i>` : ''}</div>`; }).join('') : '';
  const U = state.modules.lift && state.modules.lift.duplaUlt;
  const eqLinha = s=>{ const q = _duplaQtd(s, cfg.q); return `<div class="dp-q"><span>${mtEsc(MT_ESTACOES[s]||s)}</span><div class="mod-toggle dp-q3">${[[0,'0'],[1,'1'],[2,'2+']].map(([v,t])=>`<button type="button" class="seg ${(v===2 ? q>=2 : q===v)?'on':''}" onclick="duplaQtd('${s}',${v})">${t}</button>`).join('')}</div></div>`; };
  const eqAberto = window.__dpEqAberto ? ' open' : '';
  mi.dataset.tela = 'dupla';
  mi.innerHTML = `<div id="dupla-tela"><h3>Equipamentos e treino em dupla</h3>
    <p class="fam-p">Diga o que você tem: o plano evita o que falta e, se outra pessoa da casa treina no mesmo lugar, evita que vocês precisem do <b>mesmo aparelho no mesmo dia</b>. Cada um continua com o próprio plano, histórico e cargas — organizar muda só o <b>seu</b> plano. Corrida e cardápio não mudam.</p>
    <details class="dp-eq"${eqAberto} ontoggle="window.__dpEqAberto=this.open"><summary>Meus equipamentos</summary>
      <p class="fam-p">Quantos de cada você tem: <b>0</b> = não tenho, <b>1</b> = um só, <b>2+</b> = dois ou mais. Sem resposta, o app considera 1 de cada aparelho e halteres em vários pares. Elásticos e kettlebell não aparecem porque nenhum exercício da biblioteca usa.</p>
      ${MT_EQ_GRUPOS.map(([t, l])=>`<div class="dp-eqg">${t}</div>${l.map(eqLinha).join('')}`).join('')}
    </details>
    ${P ? `<label class="pi-row" style="margin:12px 0 8px"><span class="pi-txt"><b>Treino com ${mtEsc(P.nome)} no mesmo lugar</b><small>${cfg.on ? 'Ligado' : 'Desligado'} · ${D ? `${mtEsc(P.nome)} também ligou` : `${mtEsc(P.nome)} ainda não ligou`}</small></span><input type="checkbox" class="pi-sw" ${cfg.on?'checked':''} onchange="duplaLiga(this.checked)"></label>` : `<p class="fam-mini" style="margin-top:10px">Treino em dupla: as duas pessoas precisam estar no mesmo grupo de Perfil › Minha casa.</p>`}
    ${P && cfg.on && D ? `<div class="section-lbl" style="margin:10px 0 4px">Semana</div><div class="dp-tab">${linhas || '<p class="fam-p">Nenhum dia de musculação em comum.</p>'}</div>` : ''}
    <p class="fam-p" style="margin-top:8px">${CD.length ? `<b>${CD.length} ${CD.length===1?'exercício precisa':'exercícios precisam'}</b> de um aparelho que ${mtEsc(P ? P.nome : '')} também usa no mesmo dia. ` : ''}${CF.length ? `<b>${CF.length} ${CF.length===1?'exercício usa':'exercícios usam'}</b> algo que você marcou que não tem.` : ''}${!C.length ? 'Tudo certo: nenhum exercício do seu plano depende de algo que falta ou que está com outra pessoa.' : ''}</p>
    ${C.length ? `<button class="btn btn-primary btn-block" style="margin-top:4px" onclick="duplaOrganizar()">Organizar o meu plano</button>` : ''}
    ${state.modules.lift && state.modules.lift.duplaBackup ? `<button class="btn btn-ghost btn-block" style="margin-top:6px" onclick="duplaDesfazer()">Desfazer a última organização</button>` : ''}
    ${U && (U.trocas.length || U.mantidos.length) ? `<div class="dp-ult">${U.trocas.map(t=>`<div>↔ ${mtEsc(t.dia)}: <b>${mtEsc(t.para)}</b> no lugar de ${mtEsc(t.de)}</div>`).join('')}${U.mantidos.map(m=>`<div>• ${mtEsc(m.dia)}: ${mtEsc(m.ex)} (${mtEsc(m.st)}) — ${mtEsc(m.dica)}</div>`).join('')}</div>` : ''}
    ${P && cfg.on ? `<label class="pi-row" style="margin-top:10px"><span class="pi-txt"><b>Conquistas em dupla</b><small>Compartilha só o dia e o horário dos seus treinos com ${mtEsc(P.nome)} (nada de cargas, peso ou distâncias)</small></span><input type="checkbox" class="pi-sw" ${cfg.conq!==false?'checked':''} onchange="duplaConq(this.checked)"></label>` : ''}
    <button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button></div>`;
  $('modal-back').classList.add('on'); mi.scrollTop = rolagem;
}
function _duplaPublicaJa(){ try{ if(typeof famAgendaEnvio === 'function' && typeof famAtiva === 'function' && famAtiva()) famAgendaEnvio(200); }catch(e){} }
function duplaLiga(on){ _duplaCfg().on = !!on; saveData(); _duplaPublicaJa(); openTreinoDupla(); try{ mtDuplaLinha(); }catch(e){} }
function duplaConq(on){ _duplaCfg().conq = !!on; saveData(); _duplaPublicaJa(); }
function duplaQtd(st, n){ const c = _duplaCfg(); c.q = c.q || {}; c.q[st] = n; window.__dpEqAberto = true; saveData(); _duplaPublicaJa(); openTreinoDupla(); try{ mtDuplaLinha(); }catch(e){} }
function duplaOrganizar(){ const r = mtDuplaOrganizar(); if(!r.ok){ toast(r.msg); return; } toast(r.depois < r.antes ? `Pronto: de ${r.antes} para ${r.depois} ${r.depois===1?'pendência':'pendências'} de aparelho` : 'Não deu para reduzir sem prejudicar o treino — veja as dicas'); _duplaPublicaJa(); openTreinoDupla(); try{ renderSessions(); }catch(e){} }
function duplaDesfazer(){ if(mtDuplaDesfazer()){ toast('Plano de volta como estava'); _duplaPublicaJa(); openTreinoDupla(); try{ renderSessions(); }catch(e){} } }
// Beta 64: entrada discreta no FIM da tela de Treinos (antes ficava no topo, entre os atalhos e os dias)
function mtDuplaLinha(){
  try{
    const old = $('dupla-linha'); if(old) old.remove();
    if(state.active !== 'lift' || !state.modules.lift || !state.modules.lift.plan) return;
    const P = _duplaParceiro(); const cfg = _duplaCfg(); const C = mtDuplaConflitos() || [];
    const txt = C.length ? `· ${C.length} ${C.length===1?'pendência':'pendências'} de aparelho` : (P && cfg.on ? `· com ${P.nome}` : '');
    const wrap = document.querySelector('#scr-sessions .wrap'); if(!wrap) return;
    wrap.insertAdjacentHTML('beforeend', `<div id="dupla-linha" class="dupla-linha ${C.length ? 'conf' : ''}"><a href="#" onclick="openTreinoDupla();return false">⚙️ Equipamentos${P ? ' e treino em dupla' : ' da academia'}</a>${txt ? `<small>${mtEsc(txt)}</small>` : ''}</div>`);
  }catch(e){}
}
mtGancho('renderSessions', { depois(){ mtDuplaLinha(); } });
mtGancho('goTab', { depois(t){ if(t === 'sessions') mtDuplaLinha(); } });

// ---------- tempo da sessão: avisa quando o tempo informado não comporta o treino ----------
(function(){
  const _g = window.generatePlan;
  window.generatePlan = function(module, setup){
    const p = _g.apply(this, arguments);
    try{
      if(module === 'lift' && p && setup && +setup.tempo && setup.modalidade !== 'hibrido'){
        const acima = (p.workouts||[]).filter(w=>!w.cali && w.duration > +setup.tempo + 3);
        p.avisoTempo = acima.length ? { tempo:+setup.tempo, treinos:acima.map(w=>({ k:w.k, nome:w.name, min:w.duration })) } : null;
      }
    }catch(e){}
    return p;
  };
})();
function mtAvisoTempoHTML(){
  try{ const p = state.modules.lift && state.modules.lift.plan; const a = p && p.avisoTempo; if(!a) return '';
    const st = state.modules.lift.setup || {};
    return `<div class="card card-warn card-row" id="aviso-tempo" style="margin-top:10px"><div><div class="card-title">O treino passa dos ${a.tempo} min</div><div class="card-sub">${a.treinos.map(t=>`${mtEsc(t.nome)}: ~${t.min} min`).join(' · ')}. Tiramos acessórios e séries extras, mas o essencial do dia não coube sem cortar descanso${(st.days||4) < 6 ? ` — com ${(st.days||4)+1} dias por semana, ou ${a.tempo+15} min por sessão, cada treino fica dentro do tempo.` : '.'}</div></div></div>`;
  }catch(e){ return ''; }
}
mtGancho('renderSessions', { depois(){ try{ if(state.active !== 'lift' || $('aviso-tempo')) return; const h = mtAvisoTempoHTML(); if(!h) return; const slot = $('session-detail-slot'); if(slot) slot.insertAdjacentHTML('afterbegin', h); }catch(e){} } });

// ---------- cadastro: tempo (no Híbrido vale o da calistenia), prioridade ----------
mtGancho('caliMostrarSetup', { depois(){ try{ const m = readOpt('lift-modalidade') || 'musculacao'; document.querySelectorAll('.lift-tempo-f').forEach(el=>{ el.style.display = m === 'musculacao' ? '' : 'none'; }); }catch(e){} } });
mtGancho('openSetupScreen', { depois(m){
  if(m !== 'lift') return;
  try{
    const st = (state.modules.lift && state.modules.lift.setup) || {};
    document.querySelectorAll('#lift-tempo .opt').forEach(o=>o.classList.toggle('on', String(o.dataset.val) === String(st.tempo || 60)));
    const pr = st.prioridades || [];
    document.querySelectorAll('#lift-prio .opt-multi').forEach(o=>{ o.classList.toggle('on', pr.includes(o.dataset.val));
      o.onclick = ()=>{ if(!o.classList.contains('on') && document.querySelectorAll('#lift-prio .opt-multi.on').length >= 2){ toast('Escolha no máximo 2 grupos'); return; } o.classList.toggle('on'); }; });
  }catch(e){}
} });

// ---------- ficha do exercício: ênfase, movimento, aparelho e substitutos ----------
(function(){
  const _f = window.mmFichaMusculosHTML; if(typeof _f !== 'function') return;
  window.mmFichaMusculosHTML = function(ex, grupo){
    const h = _f.apply(this, arguments); if(!h) return h;
    try{
      const m = mmMusculosDe(Object.assign({ part:grupo || ex.part || '' }, ex)); const st = exEstacao(ex);
      const cat = EX_BANK.find(c=>c.name === (grupo || ex.part)); const papel = cat ? exPapel(ex, cat.name).id : null;
      const subs = cat ? cat.items.filter(it=>it.name !== ex.name && exPapel(it, cat.name).id === papel).slice(0,3).map(it=>it.name) : [];
      const extra = [m.mov ? `<div><span>Movimento</span>${mtEsc(m.mov)}</div>` : '', m.enf ? `<div><span>Ênfase</span>${mtEsc(m.enf)}</div>` : '',
        st ? `<div><span>Aparelho</span>${mtEsc(MT_ESTACOES[st]||st)}</div>` : '', subs.length ? `<div><span>Equivalentes</span>${subs.map(mtEsc).join(' · ')}</div>` : ''].join('');
      return extra ? h.replace('<button type="button" class="mm-fx-mapa"', `<div class="mm-fx-info">${extra}</div><button type="button" class="mm-fx-mapa"`) : h;
    }catch(e){ return h; }
  };
})();

// ---------- 5. conquistas novas ----------
const MT_TROFEUS_63 = [
  // Calistenia
  { id:'cali_1',      emoji:'🤸', name:'Peso do Corpo',        desc:'Primeiro treino de calistenia registrado',                     cat:'cali', nv:'comum' },
  { id:'cali_10',     emoji:'🤸', name:'Rotina de Calistenia', desc:'Calistenia registrada em 10 dias diferentes',                  cat:'cali', nv:'comum' },
  { id:'cali_prancha',emoji:'⏱️', name:'Um Minuto Firme',      desc:'Segurou 60 s numa série de isometria de core (prancha, L-sit…)',         cat:'cali', nv:'comum' },
  { id:'cali_degrau', emoji:'📈', name:'Degrau Acima',         desc:'Registrou um exercício de nível Intermediário numa progressão', cat:'cali', nv:'rara' },
  { id:'cali_barra5', emoji:'🏗️', name:'Cinco na Barra',       desc:'5 repetições de barra (nível Intermediário ou acima) numa série',cat:'cali', nv:'rara' },
  { id:'cali_skill',  emoji:'🌟', name:'Primeira Habilidade',  desc:'Registrou um exercício de habilidade (parada de mão, lever, planche…)', cat:'cali', nv:'especial' },
  { id:'cali_mestre', emoji:'🏅', name:'Especialista',         desc:'Registrou um exercício de nível Especialista',                  cat:'cali', nv:'especial' },
  // Híbrido (força + resistência)
  { id:'hib_semana',  emoji:'🔀', name:'Semana Híbrida',       desc:'Musculação e corrida (ou bike) na mesma semana',               cat:'hibrido', nv:'comum' },
  { id:'hib_forte',   emoji:'🔀', name:'Força e Fôlego',       desc:'Na mesma semana: 2+ treinos de musculação e 2+ de corrida ou bike', cat:'hibrido', nv:'rara' },
  { id:'hib_4sem',    emoji:'🔀', name:'Híbrido de Verdade',   desc:'4 semanas híbridas seguidas',                                   cat:'hibrido', nv:'rara' },
  { id:'hib_12',      emoji:'🔀', name:'Atleta Completo',      desc:'12 semanas híbridas',                                           cat:'hibrido', nv:'especial' },
  // Treinando juntos (dupla) — exige os horários dos treinos se cruzarem, não só o mesmo dia
  { id:'dupla_1',     emoji:'🤝', name:'Parceiros de Treino',  desc:'Treinou junto com quem é da sua casa (horários que se cruzam)', cat:'dupla', nv:'comum' },
  { id:'dupla_5',     emoji:'🤝', name:'Um Apoia o Outro',     desc:'Treinaram juntos em 5 dias diferentes',                         cat:'dupla', nv:'rara' },
  { id:'dupla_20',    emoji:'🤝', name:'Dupla de Ferro',       desc:'Treinaram juntos em 20 dias diferentes',                        cat:'dupla', nv:'especial' },
  // Secretas
  { secret:true, id:'sec_diacompleto', emoji:'🌗', name:'Dia Completo',        desc:'Musculação e corrida no mesmo dia, 5 vezes',                       cat:'geral' },
  { secret:true, id:'sec_cali4sem',    emoji:'🧘', name:'Disciplina do Corpo',  desc:'Calistenia em 4 semanas seguidas',                                 cat:'geral' },
  { secret:true, id:'sec_dupla4sem',   emoji:'💞', name:'Mais Fortes Juntos',   desc:'Treinaram juntos em 4 semanas seguidas',                           cat:'geral' },
  { secret:true, id:'sec_duplamix',    emoji:'🎽', name:'Parceria Completa',    desc:'Treinaram juntos na musculação e também na corrida',               cat:'geral' }
];
(function(){ try{ const ids = new Set(TROPHIES.map(t=>t.id)); MT_TROFEUS_63.forEach(t=>{ if(!ids.has(t.id)) TROPHIES.push(t); }); }catch(e){} })();
try{ Object.assign(CQ_CAT, { cali:'Calistenia', hibrido:'Híbrido', dupla:'Treinando juntos' }); }catch(e){}
(function(){ const _n = window.medalNivel; if(typeof _n === 'function') window.medalNivel = function(t){ return (t && !t.secret && t.nv) ? t.nv : _n.apply(this, arguments); }; })();

// dados verificáveis
function _semId(ts){ return semanaLocalId(ts); }
function _mtCaliRegistros(){
  // [{ id, date, sets }] só de exercícios de calistenia, com série válida
  const out = []; try{ Object.entries(state.progress||{}).forEach(([id, arr])=>{ if(typeof ehCali !== 'function' || !ehCali(id)) return;
    (arr||[]).forEach(p=>{ const s = (p.sets||[]).filter(x=>(+x.reps||0) > 0); if(s.length) out.push({ id, date:p.date, sets:s }); }); }); }catch(e){}
  return out;
}
function _mtSemanasSeguidas(sems){ const a = [...new Set(sems)].sort((x,y)=>x-y); let best = 0, cur = 0, prev = null; a.forEach(s=>{ cur = (prev != null && s === prev+1) ? cur+1 : 1; best = Math.max(best, cur); prev = s; }); return best; }
function _mtHibrido(){
  const L = (((state.modules.lift||{}).history)||[]).filter(x=>x && x.at && !x.cali);
  const R = (((state.modules.run||{}).history)||[]).filter(x=>x && x.at && (!x.activity || x.activity === 'corrida' || x.activity === 'bike'));
  const sem = {}; L.forEach(x=>{ const s = _semId(x.at); (sem[s] = sem[s] || { l:0, r:0 }).l++; }); R.forEach(x=>{ const s = _semId(x.at); (sem[s] = sem[s] || { l:0, r:0 }).r++; });
  const hib = Object.keys(sem).filter(s=>sem[s].l && sem[s].r).map(Number);
  const forte = Object.keys(sem).some(s=>sem[s].l >= 2 && sem[s].r >= 2);
  const diaL = new Set(L.map(x=>mtDia0(x.at))); const mesmoDia = new Set(R.filter(x=>diaL.has(mtDia0(x.at))).map(x=>mtDia0(x.at))).size;
  return { semanas:hib.length, seguidas:_mtSemanasSeguidas(hib), forte, mesmoDia };
}
// sessões que se cruzam com as da outra pessoa (precisa das duas pessoas registrarem; nada vem só do histórico do outro)
// início real da sessão: registro manual grava no FIM do treino; importação grava o INÍCIO (horário do relógio)
function _mtInicio(x){ const d = Math.max(10, +x.duration||45)*60000; return x.imp ? x.at : x.at - d; }
function _mtJanela(ini, dur){ return [ini, ini + Math.max(10, +dur||45)*60000]; }
function _mtDupla(){
  const P = _duplaParceiro(); if(!P || !P.tr || !P.tr.on || !P.tr.s || _duplaCfg().conq === false) return null;
  const dela = String(P.tr.s).split(',').map(t=>{ const m = /^(\d{4})(\d{2})(\d{2}):(\d{2})(\d{2}):(\d+):([mr])$/.exec(t); if(!m) return null;
    const at = new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5]).getTime(); return { at, dur:+m[6], mod:m[7] }; }).filter(Boolean);
  if(!dela.length) return null;
  const meus = []; ['lift','run'].forEach(mk=>(((state.modules[mk]||{}).history)||[]).forEach(x=>{ if(!x || !x.at) return; if(mk==='run' && x.activity && !['corrida','caminhada','bike'].includes(x.activity)) return; meus.push({ at:_mtInicio(x), dur:+x.duration||45, mod:mk==='lift'?'m':'r' }); }));
  const dias = new Map();
  meus.forEach(a=>{ const [a0,a1] = _mtJanela(a.at, a.dur);
    dela.forEach(b=>{ const [b0,b1] = _mtJanela(b.at, b.dur); const sobre = Math.min(a1,b1) - Math.max(a0,b0);
      // juntos = os horários se cruzam por 15 min ou mais (ou metade do treino mais curto)
      if(sobre >= Math.min(15, Math.min(a.dur, b.dur)/2)*60000 && mtDia0(a.at) === mtDia0(b.at)){ const d = mtDia0(a.at); const v = dias.get(d) || new Set(); v.add(a.mod); dias.set(d, v); } }); });
  const ds = [...dias.keys()];
  return { dias:ds.length, seguidas:_mtSemanasSeguidas(ds.map(_semId)), mix: [...dias.values()].some(v=>v.has('m')) && [...dias.values()].some(v=>v.has('r')) };
}
function mtChecaConquistas63(){
  try{
    const C = _mtCaliRegistros();
    if(C.length){
      const dias = new Set(C.map(r=>mtDia0(r.date)));
      if(dias.size >= 1) unlockTrophy('cali_1');
      if(dias.size >= 10) unlockTrophy('cali_10');
      if(C.some(r=>{ const e = CALI_EX[r.id]; return e && e.unit === 't' && /core|prancha/i.test((e.grupo||'') + (e.cadeia||'')) && r.sets.some(s=>(+s.reps||0) >= 60); })) unlockTrophy('cali_prancha');
      if(C.some(r=>{ const e = CALI_EX[r.id]; return e && e.nivel >= 2 && !e.skill; })) unlockTrophy('cali_degrau');
      if(C.some(r=>{ const e = CALI_EX[r.id]; return e && e.cadeia === 'barra' && e.nivel >= 2 && e.unit === 'r' && r.sets.some(s=>(+s.reps||0) >= 5); })) unlockTrophy('cali_barra5');
      if(C.some(r=>{ const e = CALI_EX[r.id]; return e && e.skill; })) unlockTrophy('cali_skill');
      if(C.some(r=>{ const e = CALI_EX[r.id]; return e && e.nivel >= 4; })) unlockTrophy('cali_mestre');
      if(_mtSemanasSeguidas([...dias].map(_semId)) >= 4) unlockTrophy('sec_cali4sem');
    }
    const H = _mtHibrido();
    if(H.semanas >= 1) unlockTrophy('hib_semana');
    if(H.forte) unlockTrophy('hib_forte');
    if(H.seguidas >= 4) unlockTrophy('hib_4sem');
    if(H.semanas >= 12) unlockTrophy('hib_12');
    if(H.mesmoDia >= 5) unlockTrophy('sec_diacompleto');
    const D = _mtDupla();
    if(D){
      if(D.dias >= 1) unlockTrophy('dupla_1');
      if(D.dias >= 5) unlockTrophy('dupla_5');
      if(D.dias >= 20) unlockTrophy('dupla_20');
      if(D.seguidas >= 4) unlockTrophy('sec_dupla4sem');
      if(D.mix) unlockTrophy('sec_duplamix');
    }
  }catch(e){ console.log('conquistas 63:', e); }
}
window.__conqChecadores = (window.__conqChecadores || []).concat([mtChecaConquistas63]);
mtGancho('checkTrophies', { depois(){ mtChecaConquistas63(); } });
// progresso nas barras das conquistas
(function(){
  const _p = window.trophyProgress; if(typeof _p !== 'function') return;
  window.trophyProgress = function(id){
    try{
      if(id === 'cali_10'){ return [new Set(_mtCaliRegistros().map(r=>mtDia0(r.date))).size, 10]; }
      if(id === 'hib_4sem'){ return [_mtHibrido().seguidas, 4]; }
      if(id === 'hib_12'){ return [_mtHibrido().semanas, 12]; }
      if(id === 'dupla_5' || id === 'dupla_20'){ const D = _mtDupla(); return [D ? D.dias : 0, id === 'dupla_5' ? 5 : 20]; }
    }catch(e){}
    return _p.apply(this, arguments);
  };
})();

// ---------- ícones ----------
try{
  Object.assign(TROPHY_GLYPH, {
    // tênis de corrida de lado: cabedal, cadarço, solado e bico levantado (o antigo parecia um ferro de passar)
    shoe: '<path d="M2.6 17.2l.9-5.3c.2-1 1.1-1.5 2-1.2l2 .7 1.9-3.1c.4-.7 1.3-.9 2-.4l1.3.9c1.1 2.6 3.7 3.9 6.6 4.4 1.5.3 2.6 1.3 2.6 2.7v1.3z"/><path d="M8.9 10.4l1.7.9M10.3 8.8l1.6 1.1"/><path d="M2.6 19.6h18.9"/>',
    rings: '<path d="M8 3v6M16 3v6"/><circle cx="8" cy="13.5" r="4.2"/><circle cx="16" cy="13.5" r="4.2"/>',
    pullbar: '<path d="M3 4.5h18M8 4.5v3M16 4.5v3"/><circle cx="12" cy="10.2" r="1.8"/><path d="M8 7.5c1 3 2.4 4 4 4s3-1 4-4M12 12v5.5M12 17.5l-2.4 3.5M12 17.5l2.4 3.5"/>',
    // força + fôlego: halter em cima e uma linha de pulso (cardio) embaixo
    hybrid: '<path d="M6 7.5h12M7.5 5v5M9.5 5.8v3.4M16.5 5v5M14.5 5.8v3.4"/><path d="M2.5 17h4.5l2-3.5 3 6.5 2.2-4.5 1.3 1.5h6"/>',
    pair: '<circle cx="8.5" cy="7" r="2.6"/><circle cx="15.8" cy="8" r="2.3"/><path d="M3.5 19.5c.3-3.6 2.3-5.8 5-5.8s4.7 2.2 5 5.8M13.2 13.9c.8-.6 1.7-.9 2.6-.9 2.4 0 4.2 2 4.5 5.4"/>'
  });
  Object.assign(TROPHY_ICO, {
    cali_1:['rings','1º'], cali_10:['rings','10'], cali_prancha:['stopwatch','60s'], cali_degrau:['prup'], cali_barra5:['pullbar','5'], cali_skill:['star'], cali_mestre:['crown'],
    hib_semana:['hybrid','1'], hib_forte:['hybrid','2+2'], hib_4sem:['hybrid','4'], hib_12:['hybrid','12'],
    dupla_1:['pair','1º'], dupla_5:['pair','5'], dupla_20:['pair','20'],
    sec_diacompleto:['hybrid'], sec_cali4sem:['rings'], sec_dupla4sem:['pair'], sec_duplamix:['pair']
  });
}catch(e){}

(function(){ if(document.getElementById('b63-css')) return; const s = document.createElement('style'); s.id = 'b63-css';
  s.textContent = `
.dupla-linha{ display:flex; flex-wrap:wrap; justify-content:center; align-items:baseline; gap:4px 8px; margin:14px 0 4px; font-size:12.5px; text-align:center; }
.dupla-linha a{ color:var(--text-dim); font-weight:600; text-decoration:none; border-bottom:1px dashed var(--border); }
.dupla-linha small{ color:var(--text-mute, var(--text-dim)); font-size:12px; }
.dupla-linha.conf small{ color:var(--warning, #f59e0b); }
.dp-eqg{ margin:10px 0 2px; font-size:11.5px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--text-dim); }
.dp-q3{ width:132px !important; flex:none; }
.dp-q3 .seg{ padding:7px 0 !important; font-size:13px !important; }
.dp-tab{ display:grid; gap:6px; }
.dp-l{ display:grid; grid-template-columns:38px 1fr; gap:2px 8px; padding:8px 10px; border:1px solid var(--border); border-radius:10px; font-size:12.5px; }
.dp-l b{ grid-row:span 3; align-self:center; }
.dp-l span{ color:var(--text-dim); overflow-wrap:anywhere; }
.dp-l i{ font-style:normal; color:var(--warning, #f59e0b); font-weight:600; }
.dp-l.conf{ border-color:rgba(245,158,11,.45); }
.dp-ult{ margin-top:8px; font-size:12.5px; line-height:1.5; color:var(--text-dim); }
.dp-eq{ margin-top:10px; border:1px solid var(--border); border-radius:10px; padding:2px 10px 8px; }
.dp-eq summary{ cursor:pointer; padding:8px 0; font-weight:700; font-size:13px; }
.dp-q{ display:flex; align-items:center; justify-content:space-between; gap:8px; margin:6px 0; font-size:12.5px; }
.dp-q .mod-toggle{ flex:none; margin:0; }
.dp-q > span{ min-width:0; overflow-wrap:anywhere; }
.mm-fx-info{ display:grid; gap:4px; margin:8px 0 2px; font-size:12.5px; line-height:1.4; }
.mm-fx-info span{ display:inline-block; min-width:92px; color:var(--text-dim); font-size:11.5px; text-transform:uppercase; letter-spacing:.04em; }
`;
  document.head.appendChild(s); })();

Object.assign(window, { liftEscolheIndividual, exEstacao, mtDuplaPublica, mtDuplaConflitos, mtDuplaOrganizar, mtDuplaDesfazer, openTreinoDupla,
  duplaLiga, duplaConq, duplaQtd, duplaOrganizar, duplaDesfazer, mtChecaConquistas63, mtAvisoTempoHTML });

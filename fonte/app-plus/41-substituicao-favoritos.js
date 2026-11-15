
// =====================================================================
// 41. Beta 41 — Substituição inteligente de exercícios e exercícios favoritos
// =====================================================================
// Trocar um exercício (aparelho ocupado ou preferência) passa a considerar, para CADA candidato:
//   grupo principal (mesma categoria do catálogo) · músculos secundários/ênfase (texto "sub") ·
//   padrão de movimento e tipo (multiarticular × isolador) · equipamento disponível e o aparelho ocupado ·
//   objetivo · os outros exercícios do dia (evita repetir estímulo) · nível · limitações do cadastro.
// O resultado vem em três faixas — Mais compatíveis / Compatíveis / Alternativas secundárias — e os
// favoritos compatíveis aparecem primeiro. Favorito que não serve como substituto NÃO é sugerido como tal.
//
// Preservação: a troca vale SÓ para a execução daquele treino (o dia em que ele acontece). O plano não muda.
// O exercício original fica guardado no próprio item (troca.orig) e volta sozinho no dia seguinte; o
// histórico do treino salvo registra o que foi feito E o que ele substituiu. Séries, repetições e descanso
// são mantidos; a carga é sugerida a partir do que o aluno já fez. O aluno pode desfazer durante o treino
// ou escolher "Salvar no plano" (aí sim vira troca fixa, pelo mecanismo de fixar que já existia).
// Calistenia continua com a troca própria (progressão/regressão da cadeia), sem mudança.

// ---------- classificação biomecânica do catálogo ----------
// [regex no nome normalizado, padrão, tipo]  (a ordem importa: o primeiro que casar vence)
const MT_PADROES = [
  [/pullover/, 'pullover', 'iso'],
  [/crucifixo|voador|peck deck|crossover/, 'aducao-horizontal', 'iso'],
  [/supino (reto|na maquina \(hammer\))|supino reto com halteres|flexao de braco|maos elevadas|flexao arqueiro/, 'empurrar-horizontal', 'comp'],
  [/supino inclinado|supino na maquina inclinado|flexao inclinada/, 'empurrar-inclinado', 'comp'],
  [/supino pegada fechada|mergulho|flexao (fechada|diamante)|maquina \(mergulho\)/, 'empurrar-triceps', 'comp'],
  [/desenvolvimento|arnold|pike/, 'empurrar-vertical', 'comp'],
  [/elevacao lateral/, 'abducao-ombro', 'iso'],
  [/elevacao y/, 'abducao-ombro', 'iso'],
  [/elevacao frontal/, 'flexao-ombro', 'iso'],
  [/face pull|elevacao posterior/, 'deltoide-posterior', 'iso'],
  [/chin-up|barra fixa|puxada|pulldown/, 'puxar-vertical', 'comp'],
  [/remada/, 'puxar-horizontal', 'comp'],
  [/levantamento terra|stiff/, 'dobradica-quadril', 'comp'],
  [/superman/, 'extensao-lombar', 'iso'],
  [/rosca/, 'flexao-cotovelo', 'iso'],
  [/triceps|frances|extensao de triceps/, 'extensao-cotovelo', 'iso'],
  [/bulgaro|afundo|step-up/, 'joelho-unilateral', 'comp'],
  [/agachamento|leg press|hack/, 'agachamento', 'comp'],
  [/cadeira extensora|cadeira contra parede/, 'extensao-joelho', 'iso'],
  [/flexora|nordic/, 'flexao-joelho', 'iso'],
  [/adutora/, 'aducao-quadril', 'iso'],
  [/abdutora|concha|abducao lateral/, 'abducao-quadril', 'iso'],
  [/elevacao pelvica|hip thrust|ponte/, 'extensao-quadril', 'comp'],
  [/coice|kickback/, 'extensao-quadril-iso', 'iso'],
  [/panturrilha sentada/, 'panturrilha-sentada', 'iso'],
  [/panturrilha/, 'panturrilha-em-pe', 'iso'],
  [/encolhimento/, 'encolhimento', 'iso'],
  [/prancha|dead bug|hollow|pallof/, 'core-estabilizacao', 'iso'],
  [/abdominal|elevacao de pernas|russian/, 'core-flexao', 'iso'],
  [/farmer/, 'carregamento', 'comp'],
  [/mountain climber/, 'core-dinamico', 'comp']
];
// padrões "vizinhos": servem como substituto, mas não são o mesmo movimento → faixa "Compatíveis"
const MT_VIZINHOS = {
  'empurrar-horizontal':['empurrar-inclinado'], 'empurrar-inclinado':['empurrar-horizontal'],
  'agachamento':['joelho-unilateral'], 'joelho-unilateral':['agachamento'],
  'dobradica-quadril':['extensao-quadril'], 'extensao-quadril':['dobradica-quadril','extensao-quadril-iso'],
  'extensao-quadril-iso':['extensao-quadril'],
  'panturrilha-em-pe':['panturrilha-sentada'], 'panturrilha-sentada':['panturrilha-em-pe'],
  'abducao-ombro':['deltoide-posterior'], 'core-flexao':['core-estabilizacao'], 'core-estabilizacao':['core-flexao']
};
const MT_PADRAO_NOME = {
  'empurrar-horizontal':'empurrar à frente', 'empurrar-inclinado':'empurrar inclinado', 'empurrar-triceps':'empurrar com ênfase no tríceps',
  'empurrar-vertical':'empurrar acima da cabeça', 'aducao-horizontal':'fechar os braços (isolador)', 'pullover':'pullover',
  'abducao-ombro':'elevar os braços pela lateral', 'flexao-ombro':'elevar os braços à frente', 'deltoide-posterior':'abrir os braços para trás',
  'puxar-vertical':'puxar de cima para baixo', 'puxar-horizontal':'remar (puxar em direção ao tronco)', 'dobradica-quadril':'dobrar o quadril',
  'extensao-lombar':'estender a lombar', 'flexao-cotovelo':'flexionar o cotovelo', 'extensao-cotovelo':'estender o cotovelo',
  'joelho-unilateral':'agachar com uma perna à frente', 'agachamento':'agachar', 'extensao-joelho':'estender o joelho', 'flexao-joelho':'flexionar o joelho',
  'aducao-quadril':'fechar as pernas', 'abducao-quadril':'abrir as pernas', 'extensao-quadril':'estender o quadril', 'extensao-quadril-iso':'estender o quadril (isolador)',
  'panturrilha-em-pe':'panturrilha em pé', 'panturrilha-sentada':'panturrilha sentado', 'encolhimento':'encolher os ombros',
  'core-estabilizacao':'estabilizar o tronco', 'core-flexao':'flexionar o tronco', 'carregamento':'carregar peso', 'core-dinamico':'core dinâmico'
};
// Beta 44: panturrilha no Leg Press é panturrilha (antes caía em "agachamento" por causa do "leg press")
function mtPadrao(ex){
  if(/panturrilha/.test(mtNorm(ex && ex.name)) && !/sentad/.test(mtNorm(ex && ex.name))) return { pad:'panturrilha-em-pe', tipo:'iso' };
  const n = mtNorm(ex && ex.name);
  for(const [re, p, t] of MT_PADROES) if(re.test(n)) return { pad:p, tipo:t };
  return { pad:'outro:' + n, tipo:'comp' };
}
// classe do equipamento (para o "aparelho ocupado" e para estimar a carga)
// Beta 44: exercícios cujo nome não diz o equipamento (antes caíam em "peso do corpo" por engano)
const MT_EQUIP_FIXO = [
  [/^puxada com triangulo/, 'cabo'], [/^desenvolvimento arnold/, 'halter'], [/^elevacao posterior curvado/, 'halter'],
  [/^rosca scott no banco/, 'barra'], [/^rosca spider/, 'halter'], [/^rosca concentrada/, 'halter'],
  [/^cadeira contra parede/, 'corpo'], [/^elevacao pelvica/, 'barra'], [/^panturrilha sentada/, 'maquina'], [/^panturrilha donkey/, 'maquina']
];
function mtEquipClasse(ex){
  const n = mtNorm(ex && ex.name);
  if(ex && ex.improv) return 'improvisado';
  for(const [re, eq] of MT_EQUIP_FIXO) if(re.test(n)) return eq;
  if(/smith/.test(n)) return 'smith';
  if(/cabo|polia|pulley|pulldown|crossover|corda|pallof|face pull/.test(n)) return 'cabo';
  if(/maquina|hammer|leg press|hack|cadeira|mesa flexora|voador|peck deck|articulada|kickback/.test(n)) return 'maquina';
  if(/halter/.test(n) || /goblet|farmer/.test(n)) return 'halter';
  if(/barra ez|com barra|t-bar|cavalinho|levantamento terra|encolhimento com barra|supino pegada fechada/.test(n)) return 'barra';
  return 'corpo';
}
const MT_EQUIP_NOME = { maquina:'máquina', cabo:'cabo/polia', barra:'barra', halter:'halteres', smith:'Smith', corpo:'peso do corpo', improvisado:'objetos de casa' };
// ênfase muscular: palavras do "sub" (Peito Superior, Dorsais, Tríceps…)
function mtEnfase(ex){
  return new Set(mtNorm(ex && ex.sub).replace(/[()]/g,' ').split(/[\s/,]+/)
    .filter(w=>w.length > 3 && !/^(forca|isolador|unilateral|avancado|iniciante|isometria|resistencia|foco|central)$/.test(w)));
}
const MT_AVANCADOS = /arqueiro|nordic|pike elevada|paralelas|jump/;

// ---------- favoritos (sincronizados com a conta: ficam em state.favoritos) ----------
function mtFavs(){ if(!state) return []; if(!Array.isArray(state.favoritos)) state.favoritos = []; return state.favoritos; }
function mtEhFav(id){ return !!state && Array.isArray(state.favoritos) && state.favoritos.includes(id); }
function mtFavAlternar(id, ev){
  try{ if(ev){ ev.stopPropagation(); ev.preventDefault(); } }catch(e){}
  if(!id) return;
  const f = mtFavs(); const i = f.indexOf(id);
  if(i >= 0) f.splice(i, 1); else f.push(id);
  state.favoritosEm = Date.now();
  saveData();
  const on = i < 0;
  document.querySelectorAll('[data-fav="' + CSS.escape(id) + '"]').forEach(b=>{
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', on ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
    b.classList.remove('fav-pulse'); void b.offsetWidth; if(on) b.classList.add('fav-pulse');
  });
  toast(on ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
  if(typeof libFilter !== 'undefined' && libFilter === 'Favoritos' && document.querySelector('#scr-library.active')) renderLibrary();
}
const MT_ESTRELA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.6l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/></svg>';
function mtFavBtn(id, extra){
  const on = mtEhFav(id);
  return `<button type="button" class="fav-btn${on?' on':''}${extra?' '+extra:''}" data-fav="${mtEsc(id)}" aria-pressed="${on}" aria-label="${on?'Remover dos favoritos':'Adicionar aos favoritos'}" onclick="mtFavAlternar('${mtJsStr(id)}', event)">${MT_ESTRELA}</button>`;
}
function mtExPorId(id){ for(const c of EX_BANK){ const it = c.items.find(x=>slug(x.name)===id); if(it) return { ex:it, grupo:c.name }; } return null; }

// ---------- motor de compatibilidade ----------
// devolve { mais:[], compat:[], secund:[], favs:[] } — cada item: { ex, id, score, motivos:[], aviso }
function mtCandidatosTroca(w, cur, motivo, setup){
  setup = setup || (state.modules.lift && state.modules.lift.setup) || {};
  const cat = EX_BANK.find(c=>c.name===cur.part) || EX_BANK.find(c=>c.items.some(x=>slug(x.name)===cur.id));
  if(!cat) return null;
  const origId = (cur.troca && cur.troca.orig && cur.troca.orig.id) || cur.id;
  const usados = new Set((w.exercises||[]).map(e=>e.id)); usados.delete(cur.id);
  const okEquip = (typeof limEquipOk === 'function') ? limEquipOk(setup) : (()=>true);
  const lims = (typeof limDoSetup === 'function') ? limDoSetup(setup) : [];
  const limBloq = ex => lims.find(k=>LIM_REGRAS[k].evitar.test(ex.name||''));
  const iniciante = setup.level === 'iniciante';
  const objetivo = setup.goal || '';
  const stim = s => mtNorm(s).replace(/[()]/g,'').trim();
  const outrosStims = new Set((w.exercises||[]).filter(e=>e.id!==cur.id).map(e=>stim(e.sub)));
  const base = mtPadrao(cur), baseEq = mtEquipClasse(cur), baseEnf = mtEnfase(cur);
  const viz = MT_VIZINHOS[base.pad] || [];
  const out = { mais:[], compat:[], secund:[], favs:[], mesmoEq:[], cat:cat.name };
  cat.items.forEach(ex=>{
    const id = slug(ex.name);
    if(id === cur.id || usados.has(id)) return;
    if(!okEquip(ex)) return;                                   // equipamento que o aluno não tem
    if(limBloq(ex)) return;                                    // força a região marcada nas limitações
    if(iniciante && (MT_AVANCADOS.test(mtNorm(ex.name)) || /avancado/.test(mtNorm(ex.sub)))) return;
    const p = mtPadrao(ex), eq = mtEquipClasse(ex), enf = mtEnfase(ex);
    const motivos = []; let score = 0, aviso = '';
    const mesmoPad = p.pad === base.pad, vizinho = viz.includes(p.pad);
    if(mesmoPad){ score += 50; motivos.push('mesmo movimento'); }
    else if(vizinho){ score += 30; motivos.push('movimento parecido'); }
    if(p.tipo === base.tipo){ score += 12; } else motivos.push(p.tipo==='comp' ? 'multiarticular' : 'isolador');
    const inter = [...enf].filter(x=>baseEnf.has(x)).length;
    if(stim(ex.sub) === stim(cur.sub)){ score += 18; motivos.push('mesma ênfase'); }
    else if(inter){ score += 8 * Math.min(2, inter); motivos.push('mesmos músculos'); }
    if(id === origId){ score += 10; motivos.unshift('exercício original do plano'); }
    // Beta 44: os dois motivos dão listas diferentes de verdade.
    //  • ocupado → o que interessa é OUTRO equipamento: ele sobe; o mesmo tipo de aparelho/estação
    //    (cabo, máquina, Smith, barra) vai para uma faixa própria no fim ("pode estar ocupado também").
    //  • preferência → o aparelho está livre, a pessoa só quer variar: opções no MESMO tipo de equipamento
    //    sobem (mantém o ajuste e a carga parecidos) e variações de ênfase ganham espaço.
    const mesmoEq = eq === baseEq;
    if(motivo === 'ocupado'){
      if(mesmoEq && ['cabo','maquina','smith','barra'].includes(eq) && id !== origId){
        aviso = 'usa o mesmo tipo de equipamento (' + MT_EQUIP_NOME[eq] + ') — pode estar ocupado também';
        motivos.push(MT_EQUIP_NOME[eq] || eq);
        const it = { ex, id, score, motivos, aviso, pad:p.pad, fav:mtEhFav(id) };
        if(mesmoPad || vizinho) out.mesmoEq.push(it); else out.secund.push(it);
        return;
      }
      if(!mesmoEq){ score += 10; motivos.push(MT_EQUIP_NOME[eq] || eq); }
    } else if(motivo === 'preferencia'){
      if(mesmoEq && (mesmoPad || vizinho) && id !== origId && eq !== 'corpo'){
        motivos.push('mesmo equipamento');
        out.mesmoEq.push({ ex, id, score: score + 12, motivos, aviso, pad:p.pad, fav:mtEhFav(id) });
        return;
      }
      if(mesmoEq){ score += 12; motivos.push('mesmo equipamento'); }
      else motivos.push(MT_EQUIP_NOME[eq] || eq);
      if(!mesmoPad && vizinho) score += 10;                     // variar a ênfase também é uma boa troca
      if(id === origId) score -= 10;                            // aqui a ideia é variar
    } else if(!mesmoEq) motivos.push(MT_EQUIP_NOME[eq] || eq);
    if(outrosStims.has(stim(ex.sub))){ score -= 14; aviso = aviso || 'repete o estímulo de outro exercício de hoje'; }
    if(objetivo === 'forca' && p.tipo === 'comp' && ['barra','halter','smith'].includes(eq)) score += 6;
    if((objetivo === 'emagrecimento' || objetivo === 'resistencia') && p.tipo === 'comp') score += 3;
    if(ex.improv) score -= 4;
    // carga externa → peso do corpo muda a intensidade: continua opção, mas não na frente
    if(eq === 'corpo' && baseEq !== 'corpo' && baseEq !== 'improvisado'){ score -= 14; }
    if(MT_AVANCADOS.test(mtNorm(ex.name)) && setup.level !== 'avancado' && !MT_AVANCADOS.test(mtNorm(cur.name))) score -= 12;
    const item = { ex, id, score, motivos, aviso, pad:p.pad, fav:mtEhFav(id) };
    if(mesmoPad && score >= 60) out.mais.push(item);
    else if(mesmoPad || (vizinho && score >= 38)) out.compat.push(item);
    else out.secund.push(item);
  });
  // mesmo movimento catalogado em outro grupo (ex.: pullover com halter está em Peito; chin-up em Bíceps)
  if(!base.pad.startsWith('outro:')){
    EX_BANK.forEach(c=>{ if(c === cat) return; c.items.forEach(ex=>{
      const id = slug(ex.name); if(id === cur.id || usados.has(id) || !okEquip(ex) || limBloq(ex)) return;
      if(iniciante && MT_AVANCADOS.test(mtNorm(ex.name))) return;
      if(mtPadrao(ex).pad !== base.pad) return;
      const eq = mtEquipClasse(ex);
      const it = { ex, id, score: 40 - (eq==='corpo' && baseEq!=='corpo' ? 10 : 0), motivos:['mesmo movimento', 'catalogado em ' + c.name], aviso:'', pad:base.pad, fav:mtEhFav(id) };
      if(motivo === 'ocupado' && eq === baseEq && ['cabo','maquina','smith','barra'].includes(eq)){ it.aviso = 'usa o mesmo tipo de equipamento (' + MT_EQUIP_NOME[eq] + ') — pode estar ocupado também'; out.mesmoEq.push(it); }
      else out.compat.push(it);
    }); });
  }
  const ord = (a,b)=> (b.fav?1:0)-(a.fav?1:0) || b.score-a.score || a.ex.name.localeCompare(b.ex.name);
  out.mais.sort(ord); out.compat.sort(ord); out.mesmoEq.sort(ord); out.secund.sort((a,b)=>b.score-a.score);
  // favoritos compatíveis no topo; favoritos que só servem como "secundária" ficam fora deste destaque
  out.favs = [...(motivo === 'preferencia' ? out.mesmoEq : []), ...out.mais, ...out.compat].filter(x=>x.fav);
  out.secund = out.secund.slice(0, 6);
  return out;
}

// carga sugerida para o substituto (estimativa honesta: sempre "comece e ajuste")
const MT_FATOR_EQ = { barra:1, smith:0.9, maquina:1, cabo:0.6, halter:0.4, corpo:0, improvisado:0 };
function mtTopo(id){
  const arr = ((state.progress||{})[id]||[]).filter(p=>p.sets && p.sets.length).sort((a,b)=>a.date-b.date);
  const u = arr[arr.length-1]; if(!u) return 0;
  return Math.max(0, ...u.sets.map(s=>+s.peso||0));
}
function mtCargaSugerida(orig, novo){
  const proprio = mtTopo(novo.id || slug(novo.name));
  if(proprio > 0) return { kg: proprio, txt: 'Última vez neste exercício: ' + proprio + ' kg' };
  const eqN = mtEquipClasse(novo), eqO = mtEquipClasse(orig);
  if(!MT_FATOR_EQ[eqN]) return { kg:0, txt: eqN === 'corpo' ? 'Peso do corpo — ajuste pela dificuldade das repetições' : '' };
  const w0 = mtTopo(orig.id); if(!(w0 > 0) || !MT_FATOR_EQ[eqO]) return { kg:0, txt:'Comece leve e ajuste na primeira série' };
  let kg = w0 * MT_FATOR_EQ[eqN] / MT_FATOR_EQ[eqO];
  if(mtPadrao(orig).pad !== mtPadrao(novo).pad) kg *= 0.85;
  kg = kg < 12 ? Math.round(kg) : Math.round(kg/2)*2;
  if(kg <= 0) return { kg:0, txt:'Comece leve e ajuste na primeira série' };
  return { kg, txt: 'Sugestão inicial: ~' + kg + ' kg' + (eqN==='halter' ? ' em cada halter' : '') + ' (estimada a partir de ' + w0 + ' kg no ' + orig.name + ') — ajuste na primeira série' };
}

// ---------- troca temporária (só a execução do treino) ----------
function mtProximaData(dayIdx){
  const d = new Date(); d.setHours(12,0,0,0);
  for(let k=0;k<7;k++){ const x = new Date(d.getTime() + k*86400000); const idx = x.getDay()||7; if(idx === dayIdx) return chaveDia(x); }
  return chaveDia(d);
}
function mtTreinoDoEx(exId){
  const mod = state.modules.lift; if(!mod || !mod.plan) return null;
  const sel = (typeof currentSelectedWorkout === 'function') ? currentSelectedWorkout(mod) : null;
  if(sel && (sel.exercises||[]).some(e=>e.id===exId)) return sel;
  return (mod.plan.workouts||[]).find(w=>(w.exercises||[]).some(e=>e.id===exId)) || null;
}
// devolve ao plano o original das trocas cujo dia já passou (roda antes de desenhar as telas)
function mtTrocasExpirar(){
  try{
    const mod = state && state.modules && state.modules.lift; if(!mod || !mod.plan) return false;
    const hoje = chaveDia(new Date()); let mudou = false;
    (mod.plan.workouts||[]).forEach(w=>{
      (w.exercises||[]).forEach((e, i)=>{
        if(e && e.troca && e.troca.orig && e.troca.dia < hoje){ w.exercises[i] = e.troca.orig; mudou = true; }
      });
    });
    if(mudou) saveData();
    return mudou;
  }catch(e){ return false; }
}
let _mtTroca = { exId:null, motivo:'ocupado', salvar:false };
// Beta 42: o motivo depende do exercício. Com equipamento: "Equipamento ocupado" (ou "Prefiro outro").
// Sem equipamento / peso do corpo: "Alternativa para este grupo muscular" — "ocupado" não faz sentido aí.
// A lógica de compatibilidade é a mesma da Beta 41 (o motivo 'grupo' só não aplica a regra do aparelho ocupado).
function mtSemEquipamento(ex){ return ['corpo','improvisado'].includes(mtEquipClasse(ex)); }
const MT_MOTIVO_NOME = { ocupado:'equipamento ocupado', preferencia:'por preferência', grupo:'alternativa para o grupo muscular' };
function mtMotivoNome(m){ return MT_MOTIVO_NOME[m] || MT_MOTIVO_NOME.ocupado; }
function mtTrocaAbrir(exId, motivo){
  const mod = state.modules.lift; const w = mtTreinoDoEx(exId); if(!w) return;
  const cur = w.exercises.find(e=>e.id===exId); if(!cur) return;
  const semEq = mtSemEquipamento(cur);
  let mot = motivo || _mtTroca.motivo || 'ocupado';
  if(semEq) mot = 'grupo'; else if(mot === 'grupo') mot = 'ocupado';
  _mtTroca = { exId, motivo: mot, salvar:false, k:w.k };
  const r = mtCandidatosTroca(w, cur, _mtTroca.motivo, mod.setup);
  if(!r){ toast('Não foi possível analisar este exercício.'); return; }
  const orig = cur.troca && cur.troca.orig;
  const linha = (it, faixa)=>{
    const m = it.motivos.slice(0,3).map(t=>`<span class="tx-tag">${mtEsc(t)}</span>`).join('');
    return `<div class="tx-item tx-${faixa}" role="button" tabindex="0" onclick="mtTrocaAplicar('${mtJsStr(it.id)}')" onkeydown="if(event.key==='Enter')mtTrocaAplicar('${mtJsStr(it.id)}')">
      <div class="tx-info"><div class="tx-nome">${mtEsc(it.ex.name)}</div><div class="tx-sub">${mtEsc(it.ex.sub||'')}</div>
      <div class="tx-tags">${m}</div>${it.aviso?`<div class="tx-aviso">${mtEsc(it.aviso)}</div>`:''}</div>
      ${mtFavBtn(it.id, 'fav-sm')}<span class="tx-go" aria-hidden="true">›</span></div>`;
  };
  const sec = (titulo, desc, itens, faixa)=> itens.length ? `<div class="tx-sec tx-sec-${faixa}"><div class="tx-sec-t">${titulo}</div>${desc?`<div class="tx-sec-d">${desc}</div>`:''}${itens.map(it=>linha(it, faixa)).join('')}</div>` : '';
  const favIds = new Set(r.favs.map(x=>x.id));
  const nada = !r.mais.length && !r.compat.length && !r.mesmoEq.length;
  const p = mtPadrao(cur);
  $('modal-inner').innerHTML = `
    <h3>Trocar exercício</h3>
    <p class="tx-lead">No lugar de <b>${mtEsc(cur.name)}</b>${orig?` <span class="tx-orig">(substituto de ${mtEsc(orig.name)})</span>`:''}<br><span>${mtEsc(cur.sub||'')} · ${mtEsc(MT_PADRAO_NOME[p.pad] || 'movimento')} · ${cur.sets}× ${mtEsc(cur.reps)}</span></p>
    ${semEq ? `<div class="seg-mini" role="group" aria-label="Motivo da troca">
      <button type="button" class="on" aria-pressed="true">Alternativa para este grupo muscular</button>
    </div><p class="tx-motivo-d">Outros exercícios que trabalham ${mtEsc(cur.part ? 'o mesmo grupo (' + cur.part + ')' : 'a mesma região')}, pelos mesmos critérios de compatibilidade.</p>` : `<div class="seg-mini" role="group" aria-label="Motivo da troca">
      <button type="button" class="${_mtTroca.motivo==='ocupado'?'on':''}" aria-pressed="${_mtTroca.motivo==='ocupado'}" onclick="mtTrocaAbrir('${mtJsStr(exId)}','ocupado')">Equipamento ocupado</button>
      <button type="button" class="${_mtTroca.motivo==='preferencia'?'on':''}" aria-pressed="${_mtTroca.motivo==='preferencia'}" onclick="mtTrocaAbrir('${mtJsStr(exId)}','preferencia')">Prefiro outro</button>
    </div><p class="tx-motivo-d">${_mtTroca.motivo==='ocupado' ? 'Primeiro, opções em <b>outro equipamento</b>, para você não esperar. O mesmo tipo de aparelho fica no fim.' : 'O aparelho está livre e você quer variar: primeiro, opções no <b>mesmo tipo de equipamento</b> e variações de ênfase.'}</p>`}
    <div class="tx-lista">
      ${orig ? `<div class="tx-sec"><div class="tx-item tx-volta" role="button" tabindex="0" onclick="mtTrocaDesfazer('${mtJsStr(exId)}')"><div class="tx-info"><div class="tx-nome">Voltar ao original: ${mtEsc(orig.name)}</div><div class="tx-sub">Desfaz a troca deste treino</div></div><span class="tx-go">↩</span></div></div>` : ''}
      ${sec('Seus favoritos compatíveis', '', r.favs, 'fav')}
      ${_mtTroca.motivo==='preferencia' ? sec('No mesmo tipo de equipamento', 'O aparelho está livre: ajuste e carga parecidos', r.mesmoEq.filter(x=>!favIds.has(x.id)), 'mais') : ''}
      ${sec('Mais compatíveis', 'Mesmo movimento e mesma função no treino', r.mais.filter(x=>!favIds.has(x.id)), 'mais')}
      ${sec('Compatíveis', 'Mesmo grupo, variação do movimento ou da ênfase', r.compat.filter(x=>!favIds.has(x.id)), 'compat')}
      ${nada ? (semEq
        ? `<div class="tx-vazio"><b>Não foi encontrada alternativa compatível</b> para ${mtEsc(cur.name)} neste grupo muscular${(mod.setup.lim||[]).length?' com as limitações informadas':''}. Se usar uma das opções abaixo, saiba que <b>não equivalem</b> ao exercício original.</div>`
        : `<div class="tx-vazio"><b>Não foi encontrada alternativa compatível</b> para ${mtEsc(cur.name)} com o seu equipamento${(mod.setup.lim||[]).length?' e as limitações informadas':''}. Se preferir, espere o equipamento liberar ou use uma das opções abaixo, sabendo que <b>não equivalem</b> ao exercício original.</div>`) : ''}
      ${_mtTroca.motivo==='ocupado' ? sec('No mesmo tipo de equipamento', 'Também servem, mas podem estar ocupados', r.mesmoEq.filter(x=>!favIds.has(x.id)), 'compat') : ''}
      ${sec('Alternativas secundárias', 'Treinam o mesmo grupo de outro jeito — não são equivalentes ao original', r.secund, 'secund')}
    </div>
    <label class="tx-salvar"><input type="checkbox" id="tx-salvar" ${_mtTroca.salvar?'checked':''} onchange="_mtTroca.salvar=this.checked"> Manter esta troca nos próximos treinos (altera o plano)</label>
    <p class="tx-nota">Sem marcar, a troca vale só para esta execução do treino. Séries, repetições e descanso continuam os mesmos.</p>
    <button class="btn btn-ghost btn-block" style="margin-top:6px" onclick="closeModal()">Cancelar</button>`;
  $('modal-back').classList.add('on');
}
function mtTrocaAplicar(newId){
  const mod = state.modules.lift; const exId = _mtTroca.exId;
  const w = mtTreinoDoEx(exId); if(!w) return;
  const idx = w.exercises.findIndex(e=>e.id===exId); if(idx < 0) return;
  const cur = w.exercises[idx];
  const achado = mtExPorId(newId); if(!achado) return;
  const nx = achado.ex;
  const orig = (cur.troca && cur.troca.orig) || cur;
  if(newId === orig.id){ mtTrocaDesfazer(exId); return; }
  const isoNovo = !!nx.iso, isoVelho = cur.unit === 'tempo';
  const reps = isoNovo && !isoVelho ? '20-30s' : (!isoNovo && isoVelho ? '10-12' : cur.reps);
  const novo = { id:newId, name:nx.name, sub:nx.sub, sets:cur.sets, reps, rest:cur.rest, part:cur.part, equip:nx.equip, unit: isoNovo ? 'tempo' : 'reps' };
  const carga = mtCargaSugerida(orig, novo);
  if(_mtTroca.salvar){
    // troca permanente, só com o aluno marcando: reaproveita o "fixar" que já existia (pins)
    const existingPin = (w.pins||[]).find(p=>p.id===exId);
    const origId = existingPin ? existingPin.origId : orig.id;
    Object.assign(novo, { pinned:true });
    w.exercises[idx] = novo;
    w.pins = (w.pins||[]).filter(p=>p.id!==exId); w.pins.push({ part:cur.part, id:newId, origId });
    saveData(); closeModal();
    toast('Troca salva no plano: ' + nx.name);
  } else {
    novo.troca = { orig: JSON.parse(JSON.stringify(orig)), dia: mtProximaData(w.dayIdx), motivo:_mtTroca.motivo, carga: carga.txt || '', em: Date.now() };
    w.exercises[idx] = novo;
    saveData(); closeModal();
    toast('Trocado só neste treino: ' + nx.name);
  }
  if(state.ui.tab==='sessions') renderSessions();
  requestAnimationFrame(()=>{ const el = document.querySelector('.ex[data-ex="' + CSS.escape(newId) + '"]'); if(el){ el.classList.add('ex-trocado'); } });
}
function _mtSeriesHoje(id){
  const h = new Date(); h.setHours(0,0,0,0);
  return ((state.progress||{})[id]||[]).some(p=>{ const d = new Date(p.date); d.setHours(0,0,0,0); return d.getTime()===h.getTime() && p.sets && p.sets.length; });
}
function mtTrocaDesfazer(exId){
  const w = mtTreinoDoEx(exId); if(!w) return;
  const idx = w.exercises.findIndex(e=>e.id===exId); const cur = w.exercises[idx];
  if(!cur || !cur.troca) return;
  const faz = ()=>{ w.exercises[idx] = cur.troca.orig; saveData(); closeModal(); toast('Voltou ao exercício original: ' + cur.troca.orig.name); if(state.ui.tab==='sessions') renderSessions(); };
  if(_mtSeriesHoje(exId)) appConfirm('Você já registrou séries no ' + cur.name + ' hoje. Elas continuam salvas na evolução desse exercício, mas não entram neste treino se você voltar ao original.', faz, { title:'Desfazer a troca?', okLabel:'Desfazer' });
  else faz();
}
function mtTrocaSalvarNoPlano(exId){
  const w = mtTreinoDoEx(exId); if(!w) return;
  const idx = w.exercises.findIndex(e=>e.id===exId); const cur = w.exercises[idx];
  if(!cur || !cur.troca) return;
  appConfirm('A partir de agora o treino ' + w.k + ' passa a ter ' + cur.name + ' no lugar de ' + cur.troca.orig.name + '. Você pode voltar à sugestão original quando quiser.', ()=>{
    const origId = cur.troca.orig.id;
    delete cur.troca; cur.pinned = true;
    w.pins = (w.pins||[]).filter(p=>p.id!==exId); w.pins.push({ part:cur.part, id:exId, origId });
    saveData(); toast('Troca salva no plano'); if(state.ui.tab==='sessions') renderSessions();
  }, { title:'Salvar no plano?', okLabel:'Salvar no plano' });
}

// "Trocar": calistenia segue com a troca própria; o resto usa a substituição inteligente
const _openSwapB41 = window.openSwapExercise;
window.openSwapExercise = function(exId){
  const mod = state.modules.lift; const w = mod && mod.plan && mtTreinoDoEx(exId);
  const e = w && w.exercises.find(x=>x.id===exId);
  if(w && w.cali && e && e.cadeia) return _openSwapB41.apply(this, arguments);
  mtTrocaAbrir(exId);
};

// cartão do exercício: estrela discreta, selo da troca, carga sugerida, desfazer/salvar
const _cardB41 = window.renderExerciseCard;
window.renderExerciseCard = function(ex, idx){
  let h = _cardB41.apply(this, arguments);
  try{
    if(!ex || !ex.id) return h;
    h = h.replace('<div class="ex"', `<div class="ex${ex.troca?' ex-tem-troca':''}" data-ex="${mtEsc(ex.id)}"`);
    h = h.replace(/(<div class="ex-name">)/, '$1' + mtFavBtn(ex.id, 'fav-ex'));
    if(ex.troca && ex.troca.orig){
      const mot = mtMotivoNome(ex.troca.motivo);
      const bloco = `<div class="ex-troca"><span class="ex-troca-t">Só neste treino · ${mot}</span> no lugar de <b>${mtEsc(ex.troca.orig.name)}</b>${ex.troca.carga?`<div class="ex-troca-c">${mtEsc(ex.troca.carga)}</div>`:''}
        <div class="ex-troca-b"><button class="btn btn-ghost" onclick="mtTrocaDesfazer('${mtJsStr(ex.id)}')">Desfazer</button><button class="btn btn-ghost" onclick="mtTrocaSalvarNoPlano('${mtJsStr(ex.id)}')">Salvar no plano</button></div></div>`;
      h = h.replace(/(<div class="ex-desc")/, bloco + '$1');
    }
  }catch(e){}
  return h;
};

// telas: antes de desenhar, devolve ao plano o que era troca de um dia que já passou
mtGancho('renderSessions', { antes(){ mtTrocasExpirar(); } });
mtGancho('goTab', { antes(){ mtTrocasExpirar(); } });

// histórico: o treino salvo registra o exercício usado E o original que ele substituiu
mtGancho('confirmLiftWorkout', { depois(k){
  try{
    const mod = state.modules.lift; const w = (mod.plan.workouts||[]).find(x=>x.k===k); if(!w) return;
    const x = (mod.history||[]).slice().reverse().find(h=>h.module==='lift' && h.id===k && Date.now()-h.at < 60000);
    if(!x || x.trocas) return;
    const tr = (w.exercises||[]).filter(e=>e.troca && e.troca.orig);
    if(!tr.length) return;
    x.trocas = tr.map(e=>({ de:e.troca.orig.id, deNome:e.troca.orig.name, para:e.id, paraNome:e.name, motivo:e.troca.motivo }));
    (x.exercisesDone||[]).forEach(d=>{ const t = tr.find(e=>e.id===d.id); if(t){ d.noLugarDe = t.troca.orig.name; d.noLugarDeId = t.troca.orig.id; } });
    saveData();
  }catch(e){}
}});
mtGancho('openHistoryEntry', { depois(idx){
  try{
    const mod = state.modules[state.active]; const x = (mod.history||[])[idx];
    if(!x || !x.trocas || !x.trocas.length) return;
    const box = $('modal-inner'); if(!box || box.querySelector('.hx-trocas')) return;
    const d = document.createElement('div'); d.className = 'card hx-trocas';
    d.innerHTML = `<div class="section-lbl" style="margin:0 0 6px">Substituições neste treino</div>` + x.trocas.map(t=>
      `<div class="hx-troca"><span>${mtEsc(t.paraNome)}</span><small>no lugar de ${mtEsc(t.deNome)} · ${mtMotivoNome(t.motivo)}</small></div>`).join('');
    const ref = box.querySelector('.btn'); if(ref) ref.before(d); else box.appendChild(d);
  }catch(e){}
}});

// ---------- favoritos na Biblioteca e na ficha do exercício ----------
const _renderLibB41 = window.renderLibrary;
window.renderLibrary = function(){
  const emCali = typeof libFilter === 'string' && /^Calistenia/.test(libFilter);
  if(libFilter === 'Favoritos'){ _renderLibB41.apply(this, arguments); if(!document.querySelector('#lib-list .pl-bloqueio')) mtLibFavoritos(); return; }
  const r = _renderLibB41.apply(this, arguments);
  if(!emCali) mtLibDecorar();
  return r;
};
function mtLibChipFav(){
  const chips = $('lib-chips'); if(!chips || chips.querySelector('.chip-fav')) return;
  const n = (state && Array.isArray(state.favoritos)) ? state.favoritos.length : 0;
  chips.insertAdjacentHTML('afterbegin', `<div class="filter-chip chip-fav ${libFilter==='Favoritos'?'on':''}" onclick="setLibFilter('Favoritos')">${MT_ESTRELA}Favoritos${n?` <small>${n}</small>`:''}</div>`);
  if(libFilter === 'Favoritos') chips.querySelectorAll('.filter-chip:not(.chip-fav)').forEach(c=>c.classList.remove('on'));
}
function mtLibDecorar(){
  mtLibChipFav();
  document.querySelectorAll('#lib-list .lx-item').forEach(it=>{
    if(it.querySelector('.fav-btn')) return;
    const nm = it.querySelector('.lx-name'); if(!nm) return;
    const id = slug(nm.textContent.trim());
    if(!mtExPorId(id)) return;
    const go = it.querySelector('.lx-go'); const tmp = document.createElement('span'); tmp.innerHTML = mtFavBtn(id, 'fav-lib');
    (go || it).before(tmp.firstChild);
  });
}
function mtLibFavoritos(){
  mtLibChipFav();
  const lista = $('lib-list'); if(!lista) return;
  const itens = ((state && state.favoritos) || []).map(mtExPorId).filter(Boolean);
  const cnt = $('lib-count'); if(cnt) cnt.textContent = itens.length ? `${itens.length} favorito${itens.length>1?'s':''}` : 'Nenhum favorito ainda';
  if(!itens.length){ lista.innerHTML = `<div class="lx-empty">Você ainda não favoritou nenhum exercício.<br><span style="font-size:12px;color:var(--text-mute)">Toque na estrela de um exercício para guardá-lo aqui. Favoritos têm prioridade quando você precisar trocar um exercício no treino — se forem compatíveis.</span></div>`; return; }
  const porGrupo = {}; itens.forEach(a=>{ (porGrupo[a.grupo] = porGrupo[a.grupo] || []).push(a.ex); });
  lista.innerHTML = `<div class="lx-fav-nota">Favoritos não entram no treino sozinhos: eles têm prioridade na hora de trocar um exercício, quando forem compatíveis.</div>` +
    Object.keys(porGrupo).map(g=>`<div class="lx-cat">${muscleIco(GRUPO_MUSCULO[g]||'abdomen')}<div><b>${mtEsc(g)}</b><small>${porGrupo[g].length}</small></div></div>` +
      porGrupo[g].map(ex=>`<div class="lx-item" onclick="openExercise('${mtJsStr(ex.name)}')">${muscleIco(musculoDoExercicio(ex, g))}<div class="lx-info"><div class="lx-name">${mtEsc(ex.name)}</div><div class="lx-sub">${mtEsc(ex.sub||'')}</div></div>${mtFavBtn(slug(ex.name),'fav-lib')}<span class="lx-go">›</span></div>`).join('')).join('');
}
mtGancho('openExerciseSheet', { depois(name){
  try{
    const id = slug(name); if(!mtExPorId(id)) return;
    const x = document.querySelector('#modal-inner .ex-head .ex-x'); if(!x || x.parentNode.querySelector('.fav-btn')) return;
    const t = document.createElement('span'); t.innerHTML = mtFavBtn(id, 'fav-ficha'); x.before(t.firstChild);
  }catch(e){}
}});

Object.assign(window, { mtPadrao, mtEquipClasse, mtCandidatosTroca, mtCargaSugerida, mtTrocaAbrir, mtTrocaAplicar, mtTrocaDesfazer,
  mtTrocaSalvarNoPlano, mtTrocasExpirar, mtSemEquipamento, mtMotivoNome, mtFavAlternar, mtEhFav, mtFavs, mtExPorId, mtLibFavoritos });


// =====================================================================
// 77. RC 2 — Desafio juntos (cooperativo) e conquistas compartilhadas
// ---------------------------------------------------------------------
// Usa o grupo que já existe (Perfil › Meu grupo). Nada de sistema novo de grupos e nenhuma regra nova no
// Firestore: cada pessoa só escreve o PRÓPRIO perfil no documento do grupo (perfis.<uid>), o que a regra da
// Beta 49 já permite.
//  • Cada pessoa entra se quiser e escolhe a PRÓPRIA meta: quantos dias com treino por semana (qualquer
//    modalidade: musculação, corrida, caminhada, bike, calistenia). Ninguém precisa fazer o mesmo treino.
//  • O que vai para o grupo (só de quem entrou): meta e o NÚMERO de dias treinados nas últimas 6 semanas,
//    e se concluiu uma prova (data). Nada de cargas, distâncias, peso, sono ou alimentação.
//  • Semana "juntos" = todas as pessoas que estão no desafio (2 ou mais) bateram a própria meta. Não é
//    competição: não há ranking, só "vocês".
//  • Conquistas (categoria "Treinando juntos"): Primeira Semana Juntos, 10 Sessões no Desafio (suas),
//    Quatro Semanas Juntos (seguidas) e, secreta, Prova no Grupo (alguém do desafio concluiu uma prova).
// Dados locais: state.desafioJuntos = { on, meta, desde } (opcional). Publicado: perfis.<uid>.dj.
// =====================================================================
function djEst(){ state.desafioJuntos = state.desafioJuntos && typeof state.desafioJuntos === 'object' ? state.desafioJuntos : { on:false }; return state.desafioJuntos; }
function djLigado(){ return !!(state.desafioJuntos && state.desafioJuntos.on); }
function _djSem(ts){ return (typeof rSem === 'function') ? rSem(ts) : (()=>{ const d = new Date(ts); d.setHours(0,0,0,0); d.setDate(d.getDate() - ((d.getDay()+6)%7)); return d.getTime(); })(); }
// dias com treino por semana (qualquer modalidade), a partir do histórico
function djMinhasSemanas(){
  const dias = new Set();
  ['lift','run'].forEach(mk=>(((state.modules[mk]||{}).history)||[]).forEach(x=>{ if(x && x.at && (+x.duration||0) > 0) dias.add(mtDia0(x.at)); }));
  const sem = {}; dias.forEach(d=>{ const s = _djSem(d); sem[s] = (sem[s]||0) + 1; });
  return sem;
}
function _djMinhaProva(){
  try{ const r = (((state.modules.run||{}).history)||[]).filter(x=>x && x.isRace).map(x=>x.at); return r.length ? Math.max(...r) : null; }catch(e){ return null; }
}
// o que publico (curto; o Firestore não aceita lista dentro de lista, então é um mapa)
function djPublica(){
  if(!djLigado()) return null;
  const D = djEst(); const S = djMinhasSemanas(); const atual = _djSem(Date.now());
  const s = {}; for(let i=0; i<6; i++){ const w = atual - i*7*86400000; if(w >= (D.desde||0)) s[String(w)] = S[w] || 0; }
  const out = { on:1, m:D.meta || 3, d:D.desde || atual, s };
  const p = _djMinhaProva(); if(p && p >= (D.desde||0)) out.p = p;
  return out;
}
(function(){
  const _mp = window._famMeuPerfil; if(typeof _mp !== 'function') return;
  window._famMeuPerfil = function(){ const o = _mp.apply(this, arguments); try{ const dj = djPublica(); if(dj) o.dj = dj; }catch(e){} return o; };
})();
// participantes (eu + quem do grupo está no desafio)
function djParticipantes(){
  try{
    if(typeof famAtiva !== 'function' || !famAtiva()) return [];
    const c = famCache() || {}; const eu = _famUid(); const out = [];
    famMembros().forEach(u=>{
      const dj = u === eu ? djPublica() : ((c.perfis||{})[u]||{}).dj;
      if(dj && dj.on) out.push({ uid:u, eu: u === eu, nome: u === eu ? 'Você' : famNome(u), meta: +dj.m || 3, desde: +dj.d || 0, s: dj.s || {}, prova: dj.p || null });
    });
    return out;
  }catch(e){ return []; }
}
function djSemanas(){
  const P = djParticipantes(); if(P.length < 2) return { P, juntas:[], seguidas:0, atual:null };
  const atual = _djSem(Date.now()); const ini = Math.max(...P.map(p=>p.desde));
  const juntas = [];
  for(let w = ini; w < atual; w += 7*86400000){ if(P.every(p=>(+p.s[String(w)]||0) >= p.meta)) juntas.push(w); }
  let seg = 0, best = 0, prev = null; juntas.forEach(w=>{ seg = (prev != null && w - prev === 7*86400000) ? seg+1 : 1; best = Math.max(best, seg); prev = w; });
  return { P, juntas, seguidas:best, atual };
}
function djMinhasSessoes(){
  const D = djEst(); if(!D.on && !D.desde) return 0; const S = djMinhasSemanas();
  return Object.keys(S).filter(w=>+w >= (D.desde||0)).reduce((t,w)=>t + S[w], 0);
}
// ---------- tela (dentro de Meu grupo) ----------
function djSecao(){
  if(typeof famAtiva !== 'function' || !famAtiva() || famMembros().length < 2) return '';
  const D = djEst();
  if(!D.on){
    return `<div class="dj-box" id="dj-box"><b>Desafio juntos</b>
      <p class="fam-p">Cada pessoa escolhe a própria meta de dias com treino por semana, de qualquer modalidade. Quando todos que entraram batem a meta, a semana conta para vocês. Não tem ranking.</p>
      <p class="integ-mini">O grupo vê só a sua meta e quantos dias você treinou em cada semana. Nada de cargas, distâncias, peso ou alimentação.</p>
      <button class="btn btn-primary btn-block" onclick="djEntrar()">Entrar no desafio</button></div>`;
  }
  const W = djSemanas(); const atual = _djSem(Date.now());
  const linhas = W.P.map(p=>{ const n = +p.s[String(atual)] || 0; const ok = n >= p.meta;
    return `<div class="dj-p"><span>${mtEsc(p.nome)}</span><span class="dj-bar"><i style="width:${Math.min(100, Math.round(n/p.meta*100))}%"></i></span><b class="${ok?'ok':''}">${n}/${p.meta}</b></div>`; }).join('');
  const sozinho = W.P.length < 2;
  return `<div class="dj-box" id="dj-box"><b>Desafio juntos</b>
    ${sozinho ? '<p class="fam-p">Você entrou. Assim que mais alguém do grupo entrar, as semanas de vocês começam a contar.</p>' : `<p class="fam-p">Esta semana:</p>${linhas}
    <p class="integ-mini">${W.juntas.length ? `${W.juntas.length} ${W.juntas.length===1?'semana':'semanas'} juntos${W.seguidas >= 2 ? ` · melhor sequência: ${W.seguidas}` : ''}.` : 'A primeira semana juntos conta quando todos baterem a própria meta.'} Suas sessões no desafio: ${djMinhasSessoes()}.</p>`}
    <div class="row" style="gap:8px;margin-top:8px"><button class="btn btn-ghost btn-block" onclick="djMeta()">Minha meta: ${D.meta||3}/semana</button><button class="btn btn-ghost btn-block" onclick="djSair()">Sair</button></div></div>`;
}
function djEntrar(){ const D = djEst(); D.on = true; D.desde = D.desde && D.on ? D.desde : _djSem(Date.now()); D.meta = D.meta || _djMetaSugerida(); saveData(); try{ famAgendaEnvio(300); }catch(e){} djMeta(true); }
function _djMetaSugerida(){ try{ const n = ['lift','run'].reduce((t,mk)=>t + ((((state.modules[mk]||{}).plan)||{}).workouts||[]).length, 0); return Math.max(2, Math.min(6, n || 3)); }catch(e){ return 3; } }
function djMeta(primeira){
  const D = djEst();
  famEscolha(primeira ? 'Sua meta no desafio' : 'Mudar minha meta', `Quantos dias com treino por semana? Escolha o que cabe na sua rotina (sugestão pelo seu plano: ${_djMetaSugerida()}).`,
    [2,3,4,5,6].map(n=>({ t:`${n} dias por semana${n===(D.meta||3)?' (atual)':''}`, f:()=>{ D.meta = n; saveData(); try{ famAgendaEnvio(300); }catch(e){} toast(`Meta: ${n} dias por semana.`); openFamilia(); } })));
}
function djSair(){ appConfirm('Você sai do desafio. As conquistas já ganhas continuam.', ()=>{ const D = djEst(); D.on = false; D.desde = null; saveData(); try{ famAgendaEnvio(300); }catch(e){} openFamilia(); }, { title:'Sair do desafio juntos?', okLabel:'Sair' }); }
mtGancho('openFamilia', { depois(){
  try{
    const mi = $('modal-inner'); if(!mi || mi.querySelector('#dj-box')) return;
    const h = djSecao(); if(!h) return;
    const bts = [...mi.querySelectorAll('.btn')]; const ultimo = bts[bts.length-1];
    if(ultimo) ultimo.insertAdjacentHTML('beforebegin', h); else mi.insertAdjacentHTML('beforeend', h);
  }catch(e){}
}});
// ---------- conquistas ----------
const MT_TROFEUS_RC2 = [
  { id:'jun_semana1', emoji:'🤝', name:'Primeira Semana Juntos', desc:'No desafio juntos, todos bateram a própria meta na mesma semana', cat:'dupla', nv:'comum' },
  { id:'jun_10',      emoji:'🤝', name:'Dez no Desafio',         desc:'10 sessões suas dentro do desafio juntos',                         cat:'dupla', nv:'comum' },
  { id:'jun_4sem',    emoji:'🤝', name:'Quatro Semanas Juntos',  desc:'4 semanas seguidas em que todos do desafio bateram a meta',         cat:'dupla', nv:'rara' },
  { secret:true, id:'sec_provagrupo', emoji:'🏁', name:'Prova no Grupo', desc:'Alguém do desafio juntos concluiu uma prova', cat:'geral' }
];
(function(){ try{ const ids = new Set(TROPHIES.map(t=>t.id)); MT_TROFEUS_RC2.forEach(t=>{ if(!ids.has(t.id)) TROPHIES.push(t); }); }catch(e){} })();
try{ Object.assign(TROPHY_ICO, { jun_semana1:['calcheck','1'], jun_10:['target','10'], jun_4sem:['calcheck','4'], sec_provagrupo:['flag'] }); }catch(e){}   // RC 4: semana cumprida = calendário; prova = bandeira (antes todos eram 'pair', iguais aos da dupla)
function djChecaConquistas(){
  try{
    if(!djLigado()) return;
    if(djMinhasSessoes() >= 10) unlockTrophy('jun_10');
    const W = djSemanas(); if(W.P.length < 2) return;
    if(W.juntas.length >= 1) unlockTrophy('jun_semana1');
    if(W.seguidas >= 4) unlockTrophy('jun_4sem');
    if(W.P.some(p=>p.prova && p.prova >= p.desde)) unlockTrophy('sec_provagrupo');
  }catch(e){}
}
window.__conqChecadores = (window.__conqChecadores || []).concat([djChecaConquistas]);
mtGancho('checkTrophies', { depois(){ djChecaConquistas(); } });
(function(){ const _p = window.trophyProgress; if(typeof _p !== 'function') return;
  window.trophyProgress = function(id){ try{ if(id === 'jun_10') return [Math.min(10, djMinhasSessoes()), 10]; if(id === 'jun_4sem') return [Math.min(4, djSemanas().seguidas), 4]; }catch(e){} return _p.apply(this, arguments); }; })();
(function(){ if(document.getElementById('dj-css')) return; const s = document.createElement('style'); s.id = 'dj-css';
s.textContent = `.dj-box{margin:14px 0;padding:14px;border-radius:var(--radius-card,16px);border:1px solid var(--border);background:var(--surface)}
.dj-p{display:grid;grid-template-columns:minmax(70px,auto) 1fr auto;align-items:center;gap:10px;margin:6px 0;font-size:13.5px}
.dj-bar{height:7px;border-radius:7px;background:var(--surface-2);overflow:hidden}.dj-bar i{display:block;height:100%;background:var(--primary);border-radius:7px}
.dj-p b.ok{color:var(--primary-2,var(--primary))}`; document.head.appendChild(s); })();

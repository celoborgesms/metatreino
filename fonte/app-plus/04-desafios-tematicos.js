
// ---------- 7. DESAFIOS TEMÁTICOS ----------
// Cada período do ano tem um desafio principal. O calendário é calculado (não fica preso a mês):
// Carnaval e Páscoa usam a data real da Páscoa de cada ano (_pascoa, já existente no app).
// Meta = dias ativos no período, calculada a partir do PRÓPRIO histórico do aluno (sem metas exageradas)
// e congelada no momento em que ele decide participar. Qualquer modalidade conta.
const EV_ARTE = {
  anonovo:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round"><path d="M70 30v-12M70 42v12M58 36H46M82 36h12M61.5 27.5l-7-7M78.5 44.5l7 7M78.5 27.5l7-7M61.5 44.5l-7 7"/><circle cx="70" cy="36" r="3" fill="var(--ev)"/><path d="M34 62v-8M34 70v8M26 66h-8M42 66h8M28.5 60.5l-5-5M39.5 71.5l5 5M39.5 60.5l5-5M28.5 71.5l-5 5" opacity=".6"/></g>',
  carnaval:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M28 44c8-8 18-9 22-4 4-5 14-4 22 4-2 12-10 18-22 14-12 4-20-2-22-14z"/><circle cx="41" cy="46" r="4"/><circle cx="59" cy="46" r="4"/><path d="M72 40c6-10 14-14 20-12M74 46c8-4 14-3 18 0" opacity=".7"/></g><g fill="var(--ev)" opacity=".7"><circle cx="22" cy="24" r="2.5"/><circle cx="84" cy="70" r="2.5"/><rect x="60" y="72" width="5" height="5" rx="1" transform="rotate(20 62 74)"/><rect x="30" y="72" width="5" height="5" rx="1" transform="rotate(-25 32 74)"/></g>',
  consistencia:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="26" y="24" width="56" height="52" rx="8"/><path d="M26 38h56M40 18v10M68 18v10"/><path d="M34 50l3 3 5-6M50 50l3 3 5-6M66 50l3 3 5-6M34 64l3 3 5-6M50 64l3 3 5-6"/></g>',
  pascoa:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M56 20c13 0 22 22 22 36s-10 22-22 22-22-8-22-22 9-36 22-36z"/><path d="M35 50l7-5 7 5 7-5 7 5 7-5 7 5M36 62l7 5 7-5 7 5 7-5 7 5 6-4" opacity=".75"/></g>',
  equilibrio:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M56 22v54M40 76h32M28 34h56"/><path d="M28 34l-9 20h18zM84 34l-9 20h18z"/><path d="M19 54a9 5 0 0 0 18 0M75 54a9 5 0 0 0 18 0"/></g>',
  evolucao:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 76h64"/><rect x="30" y="58" width="10" height="18" rx="2"/><rect x="46" y="46" width="10" height="30" rx="2"/><rect x="62" y="34" width="10" height="42" rx="2"/><path d="M28 44l18-14 12 8 24-18M74 20h8v8"/></g>',
  arraia:'<g fill="none" stroke="var(--ev)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 22c26 12 54 12 80 0"/><path d="M22 26l4 12 5-10M38 30l3 12 5-11M54 32l2 12 5-12M70 30l1 12 6-11M84 26l-1 12 6-9"/><path d="M50 82l12-14 12 14M53 82h18M62 52c6 6 8 10 5 15-2 3-8 3-10 0-3-5 0-9 5-15z"/></g>',
  inverno:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M60 18v52M38 31l44 26M38 57l44-26"/><path d="M54 22l6 6 6-6M54 66l6-6 6 6M38 39l8-2-2-8M82 51l-8 2 2 8M38 49l8 2-2 8M82 39l-8-2 2-8"/></g>',
  superacao:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 80l26-38 14 18 12-16 26 36z"/><path d="M66 44V18l16 6-16 6"/><path d="M36 54l4-6 6 6" opacity=".6"/></g>',
  independencia:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M30 82V18"/><path d="M30 22c10-6 20 6 30 0s20-6 28 0v28c-8-6-18-6-28 0s-20-6-30 0"/><path d="M58 30l2.5 5 5.5.8-4 3.9 1 5.4-5-2.6-5 2.6 1-5.4-4-3.9 5.5-.8z"/></g>',
  primavera:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="60" cy="40" r="6"/><path d="M60 34c-4-10 4-16 0-16s4 6 0 16M66 40c10-4 16 4 16 0s-6 4-16 0M60 46c4 10-4 16 0 16s-4-6 0-16M54 40c-10 4-16-4-16 0s6-4 16 0"/><path d="M60 62v20M60 74c-6-6-14-6-18-2 6 4 12 4 18 2zM60 70c6-6 14-6 18-2-6 4-12 4-18 2z"/></g>',
  halloween:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M60 40c-2-6 0-10 5-12"/><path d="M60 42c-14-4-26 4-26 18s11 20 26 20 26-6 26-20-12-22-26-18z"/><path d="M50 56l4-4 4 4M62 56l4-4 4 4M50 68c6 4 14 4 20 0"/><path d="M20 26c4-2 6 0 8 3 2-3 4-5 8-3-3 1-5 4-8 8-3-4-5-7-8-8z" opacity=".7"/><path d="M86 18a10 10 0 1 0 6 16 8 8 0 0 1-6-16z" opacity=".55"/></g>',
  retafinal:'<g stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M28 84V18"/><path d="M28 20h52v34H28"/></g><g fill="var(--ev)"><rect x="28" y="20" width="13" height="8.5"/><rect x="54" y="20" width="13" height="8.5"/><rect x="41" y="28.5" width="13" height="8.5"/><rect x="67" y="28.5" width="13" height="8.5"/><rect x="28" y="37" width="13" height="8.5"/><rect x="54" y="37" width="13" height="8.5"/><rect x="41" y="45.5" width="13" height="8.5"/><rect x="67" y="45.5" width="13" height="8.5"/></g>',
  natal:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M60 14l3 6.5 7 .8-5.2 4.8 1.5 7-6.3-3.6-6.3 3.6 1.5-7-5.2-4.8 7-.8z"/><path d="M60 36L44 56h8L38 74h44L68 56h8z"/><path d="M60 74v10"/><circle cx="54" cy="62" r="1.6" fill="var(--ev)"/><circle cx="66" cy="66" r="1.6" fill="var(--ev)"/><circle cx="60" cy="50" r="1.6" fill="var(--ev)"/></g>'
};
// glifos das medalhas temáticas (grade 24)
Object.assign(TROPHY_GLYPH, {
  ev_anonovo: TROPHY_GLYPH.fireworks, ev_natal: TROPHY_GLYPH.tree, ev_halloween: TROPHY_GLYPH.pumpkin,
  ev_carnaval:'<path d="M3.5 10c3-3 6.5-3.4 8.5-1.6 2-1.8 5.5-1.4 8.5 1.6-.8 4.6-4 6.8-8.5 5.4C7.5 16.8 4.3 14.6 3.5 10z"/><circle cx="8.6" cy="11" r="1.5"/><circle cx="15.4" cy="11" r="1.5"/>',
  ev_consistencia:'<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8 14.5l1.5 1.5 2.5-3M13.5 14.5l1.5 1.5 2.5-3"/>',
  ev_pascoa:'<path d="M12 3c4 0 7 6.5 7 10.5S16 20 12 20s-7-2.5-7-6.5S8 3 12 3z"/><path d="M5.6 12l2.2-1.5 2.1 1.5 2.1-1.5 2.1 1.5 2.1-1.5 2.2 1.5"/>',
  ev_equilibrio:'<path d="M12 4v16M8 20h8M4.5 7.5h15M4.5 7.5L2 13h5zM19.5 7.5L17 13h5z"/>',
  ev_evolucao:'<path d="M4 20h16M6 20v-5M10.5 20v-8M15 20V8M5 11l5-4 3.5 2.5L20 4M16.5 4H20v3.5"/>',
  ev_arraia:'<path d="M2.5 5c6 3 13 3 19 0M4.5 6l1 4 1.5-3.4M10 7l.5 4 1.5-3.8M15.5 7l.2 4 1.8-3.6"/><path d="M8 21l4-4.5 4 4.5M12 10.5c2 2 2.6 3.4 1.6 5-.6.9-2.6.9-3.2 0-1-1.6 0-3 1.6-5z"/>',
  ev_inverno:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M10 4.5l2 2 2-2M10 19.5l2-2 2 2"/>',
  ev_superacao:'<path d="M2.5 20l7-10 3.5 4.5 3-4L21.5 20z"/><path d="M15 10.5V4l4.5 1.6L15 7.2"/>',
  ev_independencia:'<path d="M6 21V3.5"/><path d="M6 4.5c2.5-1.5 5 1.5 7.5 0s5-1.5 7 0v7.5c-2-1.5-4.5-1.5-7 0s-5-1.5-7.5 0"/>',
  ev_primavera:'<circle cx="12" cy="9" r="2"/><path d="M12 7c-1.2-3 1.2-4.5 0-4.5S13.2 4 12 7M14 9c3-1.2 4.5 1.2 4.5 0S17 10.2 14 9M12 11c1.2 3-1.2 4.5 0 4.5S10.8 14 12 11M10 9c-3 1.2-4.5-1.2-4.5 0S7 7.8 10 9M12 15.5V21M12 18.5c-2-2-4.5-2-5.5-.6 2 1.2 3.7 1.2 5.5.6z"/>',
  ev_retafinal:'<path d="M5 21V3.5"/><path d="M5 4h14v9.5H5"/><path d="M5 4h3.5v3.2H5zM12 4h3.5v3.2H12zM8.5 7.2H12v3.1H8.5zM15.5 7.2H19v3.1h-3.5zM5 10.3h3.5v3.2H5zM12 10.3h3.5v3.2H12z" fill="currentColor" stroke="none"/>'
});
const EV_CORES = {
  anonovo:{ev:'#f5c451', a:'rgba(245,196,81,.22)', b:'rgba(182,242,58,.10)'},
  carnaval:{ev:'#ff5fa2', a:'rgba(255,95,162,.24)', b:'rgba(255,214,10,.14)'},
  consistencia:{ev:'#b6f23a', a:'rgba(182,242,58,.20)', b:'rgba(61,224,255,.10)'},
  pascoa:{ev:'#f0b77a', a:'rgba(240,183,122,.24)', b:'rgba(192,132,252,.12)'},
  equilibrio:{ev:'#5ad1c8', a:'rgba(90,209,200,.22)', b:'rgba(182,242,58,.10)'},
  evolucao:{ev:'#b6f23a', a:'rgba(182,242,58,.22)', b:'rgba(90,200,250,.12)'},
  arraia:{ev:'#ff9f0a', a:'rgba(255,159,10,.24)', b:'rgba(255,69,58,.14)'},
  inverno:{ev:'#7cc7ff', a:'rgba(124,199,255,.24)', b:'rgba(255,255,255,.06)'},
  superacao:{ev:'#ff7a45', a:'rgba(255,122,69,.24)', b:'rgba(245,196,81,.12)'},
  independencia:{ev:'#34d399', a:'rgba(52,211,153,.22)', b:'rgba(245,196,81,.14)'},
  primavera:{ev:'#f472b6', a:'rgba(244,114,182,.22)', b:'rgba(182,242,58,.14)'},
  halloween:{ev:'#ff8a1f', a:'rgba(255,138,31,.26)', b:'rgba(168,85,247,.16)'},
  retafinal:{ev:'#b6f23a', a:'rgba(182,242,58,.20)', b:'rgba(255,255,255,.06)'},
  natal:{ev:'#ff5a5f', a:'rgba(255,90,95,.22)', b:'rgba(52,211,153,.16)'}
};
// meses: o desafio "da casa" de cada mês. Especiais (Carnaval, Páscoa, Halloween) têm prioridade enquanto acontecem.
const EV_MESES = [
  {arte:'anonovo', nome:'Projeto Ano Novo', desc:'Comece o ano construindo o hábito: aparecer com regularidade vale mais que começar forte.', fator:1.0, extra:['cedo']},
  {arte:'consistencia', nome:'Fevereiro em Ritmo', desc:'Mês curto, foco no ritmo: mantenha seus dias de treino, com ou sem feriado.', fator:1.0, extra:['sequencia']},
  {arte:'consistencia', nome:'Desafio Consistência', desc:'A rotina é a sua maior aliada. Construa semanas completas, uma de cada vez.', fator:1.0, extra:['semanaCheia']},
  {arte:'equilibrio', nome:'Abril em Equilíbrio', desc:'Treino, recuperação e constância andando juntos.', fator:0.95, extra:['longa']},
  {arte:'evolucao', nome:'Desafio Evolução', desc:'Mês de olhar para o próprio progresso: um pouco melhor que o mês passado já é vitória.', fator:1.05, extra:['recorde']},
  {arte:'arraia', nome:'Arraiá Fitness', desc:'Festa junina com movimento: aproveite o mês sem deixar o treino de lado.', fator:0.95, extra:['modalidades']},
  {arte:'inverno', nome:'Sem Desculpas', desc:'Frio, férias e preguiça: o desafio é manter a frequência mesmo assim.', fator:1.0, extra:['cedo']},
  {arte:'superacao', nome:'Desafio Superação', desc:'Busque um recorde pessoal ou uma sessão mais longa que o normal — com técnica e segurança.', fator:1.05, extra:['recorde','longa']},
  {arte:'independencia', nome:'Desafio Independência', desc:'Autonomia e disciplina: treine nos seus dias sem precisar de ninguém te lembrando.', fator:1.0, extra:['semanaCheia']},
  {arte:'primavera', nome:'Primavera Ativa', desc:'Renove a rotina: experimente uma atividade diferente e aproveite os dias mais longos.', fator:1.0, extra:['modalidades']},
  {arte:'retafinal', nome:'Reta Final', desc:'O ano está acabando e a consistência continua. Feche novembro em alta.', fator:1.0, extra:['semanaCheia']},
  {arte:'natal', nome:'Natal em Movimento', desc:'Encerre o ano celebrando o que você construiu — com treinos curtos e constantes nas festas.', fator:0.85, extra:['longa']}
];
// no Tema Claro, cores mais escuras para manter contraste
const EV_CLARO = { anonovo:'#a16207', carnaval:'#be185d', consistencia:'#4d7c0f', pascoa:'#b45309', equilibrio:'#0f766e', evolucao:'#4d7c0f', arraia:'#c2410c', inverno:'#0369a1', superacao:'#c2410c', independencia:'#047857', primavera:'#be185d', halloween:'#c2410c', retafinal:'#4d7c0f', natal:'#b91c1c' };
// desafios "da casa" (consistência, evolução, reta final) seguem a cor do tema; os festivos mantêm a própria paleta
const EV_DO_TEMA = ['consistencia','evolucao','retafinal'];
function evCor(arte){ if(EV_DO_TEMA.includes(arte)) return { ev:'var(--primary)', a:'rgba(var(--primary-rgb),.20)', b:'rgba(var(--primary-rgb),.06)' };
  const c = EV_CORES[arte] || EV_CORES.evolucao; try{ if(temaClaro()) return Object.assign({}, c, {ev: EV_CLARO[arte] || '#4d7c0f'}); }catch(e){} return c; }
function _d(y,m,d){ return new Date(y,m,d).getTime(); }
function eventosDoAno(Y){
  const out = [];
  EV_MESES.forEach((m,i)=>out.push({ key:'mes-'+Y+'-'+String(i+1).padStart(2,'0'), base:'mes-'+String(i+1).padStart(2,'0'), nome:m.nome, desc:m.desc, arte:m.arte, fator:m.fator, extra:m.extra, ini:_d(Y,i,1), fim:_d(Y,i+1,1), prioridade:1 }));
  const P = _pascoa(Y); const p0 = mtDia0(P.getTime());
  const carnSab = p0 - 50*DIA_MS;              // sábado de Carnaval
  out.push({ key:'carnaval-'+Y, base:'carnaval', nome:'Carnaval em Movimento', desc:'Folia e treino cabem no mesmo feriado. O desafio é não zerar a semana — qualquer modalidade conta.', arte:'carnaval', fator:0.8, extra:['feriado'], diaEspecial:carnSab+3*DIA_MS, diaEspecialNome:'na terça de Carnaval',
    ini: carnSab-1*DIA_MS, fim: carnSab+9*DIA_MS, prioridade:3 });
  out.push({ key:'pascoa-'+Y, base:'pascoa', nome:'Páscoa Ativa', desc:'Duas semanas para equilibrar chocolate e movimento, sem culpa e sem exagero.', arte:'pascoa', fator:0.9, extra:['feriado'], diaEspecial:p0-1*DIA_MS, diaEspecialNome:'no Sábado de Aleluia',
    ini: p0-13*DIA_MS, fim: p0+2*DIA_MS, prioridade:3 });
  out.push({ key:'halloween-'+Y, base:'halloween', nome:'Noite das Bruxas', desc:'Uma semana e pouco de “sustos” só para a preguiça. Inclui uma missão noturna opcional.', arte:'halloween', fator:0.95, extra:['noite'],
    ini:_d(Y,9,20), fim:_d(Y,10,1), prioridade:2 });
  return out;
}
let evCustom = [];   // desafios criados pelo administrador (Firestore: desafiosTematicos)
try{ evCustom = JSON.parse(mtLS('mt_ev_custom')||'[]'); }catch(e){ evCustom = []; }
async function loadEventosCustom(){
  try{
    const snap = await db.collection('desafiosTematicos').get();
    const arr = []; snap.forEach(d=>{ const x = d.data(); if(x && x.inicio && x.fim) arr.push(Object.assign({id:d.id}, x)); });
    evCustom = arr; mtLS('mt_ev_custom', JSON.stringify(arr));
  }catch(e){ /* offline: segue com o cache */ }
}
function _dataLocal(iso){ const [y,m,d] = String(iso).split('-').map(Number); return new Date(y, (m||1)-1, d||1).getTime(); }
function _evDeCustom(c){
  return { key:'adm-'+c.id, base:'adm', custom:true, idDoc:c.id, nome:c.nome||'Desafio', desc:c.descricao||'', arte:EV_ARTE[c.arte]?c.arte:'evolucao', fator:+c.fator||1, alvoFixo:+c.alvoFixo||0,
    extra:(c.missoes||[]).map(m=>m.tipo).filter(t=>EV_MISSOES[t]), recompensa:c.recompensa||'', ini:_dataLocal(c.inicio), fim:_dataLocal(c.fim)+DIA_MS, prioridade:4, ativo:c.ativo!==false, substitui:c.substitui||'' };
}
// todos os eventos relevantes (ano anterior, atual e próximo), já com as substituições do administrador
function todosEventos(){
  const Y = new Date().getFullYear();
  let lista = [...eventosDoAno(Y-1), ...eventosDoAno(Y), ...eventosDoAno(Y+1)];
  const custom = evCustom.map(_evDeCustom);
  const subst = new Set(custom.filter(c=>c.substitui).map(c=>c.substitui));
  lista = lista.filter(e=>!subst.has(e.key));
  return [...lista, ...custom.filter(c=>c.ativo)].sort((a,b)=>a.ini-b.ini);
}
function eventosAtivos(t){ t = t||Date.now(); return todosEventos().filter(e=>t>=e.ini && t<e.fim).sort((a,b)=>b.prioridade-a.prioridade || a.fim-b.fim); }
function eventoPrincipal(){ return eventosAtivos()[0] || null; }
function proximoEvento(){ const t = Date.now(); return todosEventos().filter(e=>e.ini>t).sort((a,b)=>a.ini-b.ini || b.prioridade-a.prioridade)[0] || null; }
function eventoPorKey(k){ return todosEventos().find(e=>e.key===k) || null; }
// frequência habitual (dias ativos por semana) nas 6 semanas antes do desafio
function frequenciaHabitual(antes){
  const ini = antes - 42*DIA_MS;
  const dias = mtDiasAtivos(ini, antes).size;
  const planejados = Math.max(((state.modules.lift&&state.modules.lift.setup&&+state.modules.lift.setup.days)||0), ((state.modules.run&&state.modules.run.setup&&+state.modules.run.setup.days)||0)) || 3;
  let base = dias/6;
  if(base < 0.75) base = Math.min(3, planejados*0.6);      // iniciante ou voltando de pausa: meta gentil
  return { base: Math.max(1.5, Math.min(5, base)), planejados };
}
function metaDoEvento(e){
  const reg = (state.eventos||{})[e.key];
  if(reg && reg.alvo) return reg.alvo;
  if(e.alvoFixo) return e.alvoFixo;
  const f = frequenciaHabitual(e.ini);
  const semanas = (e.fim - e.ini)/(7*DIA_MS);
  const teto = Math.round(Math.min(6, f.planejados+1) * semanas);   // nunca pede mais que ~1 dia além do planejado por semana
  return Math.max(2, Math.min(teto, Math.round(f.base * semanas * (e.fator||1))));
}
// missões: uma por semana (dias ativos) + as missões temáticas do evento
const EV_MISSOES = {
  cedo:{ titulo:'Treino cedo', desc:'Uma sessão antes das 9h', val:(e,h)=>h.some(x=>new Date(x.at).getHours()<9)?1:0, alvo:1 },
  noite:{ titulo:'Treino noturno', desc:'Uma sessão depois das 19h (opcional, com segurança)', val:(e,h)=>h.some(x=>new Date(x.at).getHours()>=19)?1:0, alvo:1 },
  longa:{ titulo:'Sessão longa', desc:'Uma sessão de 45 minutos ou mais', val:(e,h)=>h.some(x=>(+x.duration||0)>=45)?1:0, alvo:1 },
  modalidades:{ titulo:'Variar a rotina', desc:'Duas modalidades diferentes no período', val:(e,h)=>new Set(h.map(x=>x._t)).size, alvo:2, serve:()=>!!(state.modules.lift&&state.modules.run) || ((state.modules.run&&state.modules.run.history)||[]).some(x=>x.activity&&x.activity!=='corrida') },
  sequencia:{ titulo:'Três seguidos', desc:'Três dias seguidos com atividade', val:(e,h)=>{ const d=[...new Set(h.map(x=>mtDia0(x.at)))].sort((a,b)=>a-b); let b=0,c=0,p=null; d.forEach(x=>{ c=(p!==null && Math.round((x-p)/DIA_MS)===1)?c+1:1; b=Math.max(b,c); p=x; }); return b; }, alvo:3 },
  semanaCheia:{ titulo:'Semana completa', desc:'Uma semana cumprindo todos os dias do plano', val:(e,h)=>{ const f=frequenciaHabitual(e.ini); const alvo=Math.max(2,f.planejados); const porSem={}; h.forEach(x=>{ const k=mtSemanaIni(x.at); (porSem[k]=porSem[k]||new Set()).add(mtDia0(x.at)); }); return Object.values(porSem).some(s=>s.size>=alvo)?1:0; }, alvo:1 },
  recorde:{ titulo:'Novo recorde', desc:'Bater um recorde pessoal (carga ou corrida)', val:(e,h)=>{ const prs = Object.values(state.prs||{}).filter(p=>p&&p.at>=e.ini&&p.at<e.fim).length; return prs>0?1:0; }, alvo:1, serve:()=>!!state.modules.lift },
  feriado:{ titulo:'Dia da festa', desc:'Uma atividade no dia especial', val:(e,h)=>e.diaEspecial ? (h.some(x=>mtDia0(x.at)===e.diaEspecial)?1:0) : 0, alvo:1 }
};
function missoesDoEvento(e){
  const h = mtHist().filter(x=>x.at>=e.ini && x.at<e.fim);
  const f = frequenciaHabitual(e.ini);
  const out = [];
  // semanas (segunda a domingo) que cruzam o período
  let ws = mtSemanaIni(e.ini), n = 1; const agora = Date.now();
  while(ws < e.fim){
    const a = Math.max(ws, e.ini), b = Math.min(ws+7*DIA_MS, e.fim);
    const dias = Math.round((b-a)/DIA_MS);
    if(dias >= 2){
      const alvo = Math.max(1, Math.min(dias, Math.round(f.base*(e.fator||1)*dias/7)));
      const feito = new Set(h.filter(x=>x.at>=a && x.at<b).map(x=>mtDia0(x.at))).size;
      out.push({ id:'sem'+n, titulo:`Semana ${n}`, desc:`Ativo em ${alvo} ${alvo===1?'dia':'dias'} entre ${mtFmtData(a)} e ${mtFmtData(b-1)}`, val:feito, alvo, ok:feito>=alvo, agora:agora>=a&&agora<b, passou:agora>=b });
      n++;
    }
    ws += 7*DIA_MS;
  }
  (e.extra||[]).forEach(k=>{
    const m = EV_MISSOES[k]; if(!m || (m.serve && !m.serve())) return;
    const v = Math.min(m.alvo, m.val(e,h));
    out.push({ id:k, titulo:m.titulo, desc: k==='feriado' && e.diaEspecialNome ? `Uma atividade ${e.diaEspecialNome} (${mtFmtData(e.diaEspecial)})` : m.desc, val:v, alvo:m.alvo, ok:v>=m.alvo, agora: agora>=e.ini && agora<e.fim, passou: agora>=e.fim || (k==='feriado' && e.diaEspecial && agora>=e.diaEspecial+DIA_MS) });
  });
  return out;
}
function progressoEvento(e){
  const ate = Math.min(Date.now()+DIA_MS, e.fim);
  const dias = mtDiasAtivos(e.ini, e.fim).size;
  const alvo = metaDoEvento(e);
  const restam = Math.max(0, Math.round((e.fim - mtDia0())/DIA_MS) - 1);
  return { dias, alvo, pct: Math.min(1, dias/alvo), restam, terminou: Date.now()>=e.fim, comecou: Date.now()>=e.ini, _ate:ate };
}
function eventoMedalha(e, size){
  const c = evCor(e.arte);
  return `<span class="tbadge ev" style="--ev:${c.ev}${size?';width:'+size+'px;height:'+size+'px':''}" role="img" aria-label="Medalha ${mtEsc(e.nome)}">${medalSvg('ev_'+e.arte, String(new Date(e.ini).getFullYear()))}</span>`;
}
function participaEvento(key){
  const e = eventoPorKey(key); if(!e) return;
  state.eventos = state.eventos || {};
  if(state.eventos[key]) return;
  state.eventos[key] = { alvo: metaDoEvento(e), entrouEm: Date.now(), nome: e.nome, arte: e.arte, ini: e.ini, fim: e.fim };
  saveData();
  syncParticipacao(e);
  toast('Você está no desafio! Meta: '+state.eventos[key].alvo+' dias ativos.');
  checkEventos();
  if(state.ui.tab==='challenges') renderChallenges(); else if(state.ui.tab==='home') renderHome();
}
function sairDoEvento(key){
  appConfirm('Você deixa de participar deste desafio. Seus treinos continuam no histórico normalmente.', ()=>{
    if(state.eventos && state.eventos[key] && !state.eventos[key].concluidoEm){ delete state.eventos[key]; saveData(); try{ db.collection('desafiosTematicos').doc(key).collection('participantes').doc(uidDados()).delete().catch(()=>{}); }catch(e){} }
    renderChallenges();
  }, {title:'Sair do desafio?', emo:'🚪', okLabel:'Sair', onCancel:()=>renderChallenges()});
}
// grava a participação REAL do aluno (sem inventar números) para o painel do treinador
function syncParticipacao(e){
  try{
    if(!fbUser || !navigator.onLine) return;
    const reg = (state.eventos||{})[e.key]; if(!reg) return;
    const p = progressoEvento(e);
    const sig = [p.dias, reg.concluidoEm||0].join('|');
    if(reg._sig === sig) return;
    reg._sig = sig;
    db.collection('desafiosTematicos').doc(e.key).collection('participantes').doc(uidDados()).set({
      uid: uidDados(), email: (state.user&&state.user.email)||'', nome: (state.user&&state.user.profile&&state.user.profile.nickname)||(state.user&&state.user.name)||'',
      entrouEm: reg.entrouEm||Date.now(), alvo: reg.alvo, progresso: p.dias, concluidoEm: reg.concluidoEm||null, atualizadoEm: Date.now(), desafio: e.nome
    }, {merge:true}).catch(()=>{});
  }catch(err){}
}
function checkEventos(){
  try{
    state.eventos = state.eventos || {};
    let mudou = false;
    Object.keys(state.eventos).forEach(key=>{
      const reg = state.eventos[key]; if(!reg || reg.concluidoEm) return;
      const e = eventoPorKey(key) || (reg.ini ? {key, nome:reg.nome, arte:reg.arte, ini:reg.ini, fim:reg.fim} : null); if(!e) return;
      const dias = mtDiasAtivos(e.ini, e.fim).size;
      if(dias >= reg.alvo){
        reg.concluidoEm = Date.now(); mudou = true;
        state.medals = state.medals || [];
        const id = 'ev:'+key;
        if(!state.medals.some(m=>m.id===id)) state.medals.push({ id, month: monthKey(), at: reg.concluidoEm });
        try{ queueAward({ id:'ev_'+key, emo: eventoMedalha(e), tipo:'DESAFIO TEMÁTICO CONCLUÍDO', nome:e.nome, desc:`${dias} dias ativos — meta de ${reg.alvo} cumprida. A medalha ${e.nome} ${new Date(e.ini).getFullYear()} é sua.`, medalha:true }); }catch(err){}
        syncParticipacao(e);
      } else {
        const ev = eventoPorKey(key); if(ev) syncParticipacao(ev);
      }
    });
    if(mudou) saveData();
  }catch(e){ console.log('eventos:', e); }
}
const _checkMonthlyOrig = checkMonthly;
checkMonthly = function(){ const r = _checkMonthlyOrig.apply(this, arguments); checkEventos(); return r; };
// medalhas de eventos aparecem no arquivo de medalhas existente
const _desafioPorIdOrig = desafioPorId;
desafioPorId = function(id){
  if(String(id).startsWith('ev:')){
    const key = String(id).slice(3); const reg = (state.eventos||{})[key]; const e = eventoPorKey(key) || (reg && {key, nome:reg.nome, arte:reg.arte, ini:reg.ini, fim:reg.fim});
    if(!e) return { id, emo:'🎖️', nome:'Desafio temático', desc:'' };
    return { id, emo: eventoMedalha(e), nome:'Medalha '+e.nome, desc:`Desafio temático ${new Date(e.ini).getFullYear()} concluído` };
  }
  return _desafioPorIdOrig(id);
};
// os temas dos níveis mensais acompanham o calendário novo a partir de nov/2026 (meses anteriores mantêm o nome histórico)
const _mesTemaOrig = mesTema;
mesTema = function(mk){
  const t = _mesTemaOrig(mk);
  const k = mk || monthKey();
  if(String(k) < '2026-11') return t;
  const m = (parseInt(String(k).split('-')[1],10)-1+12)%12;
  return Object.assign({}, t, { nome: EV_MESES[m].nome, frase: EV_MESES[m].desc, emo: t.emo });
};

function mtPeriodo(e){
  const M = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const a = new Date(e.ini), b = new Date(e.fim-1);
  return a.getMonth()===b.getMonth() ? `${a.getDate()}–${b.getDate()} ${M[b.getMonth()]}` : `${a.getDate()} ${M[a.getMonth()]} – ${b.getDate()} ${M[b.getMonth()]}`;
}
function _evHero(e, opts){
  opts = opts||{};
  const c = evCor(e.arte);
  const p = progressoEvento(e);
  const reg = (state.eventos||{})[e.key];
  const inscrito = !!reg;
  const tipo = e.custom ? 'Desafio especial' : (e.prioridade>=2 ? 'Desafio especial' : 'Desafio do mês');
  const periodo = mtPeriodo(e);
  const quando = !p.comecou ? `começa em ${Math.ceil((e.ini-Date.now())/DIA_MS)} dias` : p.terminou ? 'encerrado' : p.restam===0 ? 'último dia' : `${p.restam} ${p.restam===1?'dia restante':'dias restantes'}`;
  const concl = reg && reg.concluidoEm;
  return `<div class="ev-hero" style="--ev:${c.ev};--ev-a:${c.a};--ev-b:${c.b}">
    <div class="ev-art" aria-hidden="true"><svg viewBox="0 0 100 100">${EV_ARTE[e.arte]||''}</svg></div>
    <div class="ev-kicker">${tipo} · ${periodo}</div>
    <div class="ev-title">${mtEsc(e.nome)}</div>
    <div class="ev-desc">${mtEsc(e.desc)}</div>
    <div class="ev-stats">
      <div><div class="mt-num">${p.dias}<span style="font-size:15px;color:var(--text-dim)"> / ${p.alvo}</span></div><small>dias ativos${inscrito?'':' (meta prevista)'}</small></div>
      <div style="margin-left:auto;text-align:right"><div style="font-weight:800;font-size:15px">${quando}</div><small>${concl?'concluído em '+mtFmtData(reg.concluidoEm):(e.recompensa?mtEsc(e.recompensa):'medalha exclusiva')}</small></div>
    </div>
    <div class="mt-bar"><i style="width:${Math.round(p.pct*100)}%"></i></div>
    ${opts.semBotoes?'':`<div class="ev-cta">${concl?`<button class="btn btn-primary" onclick="shareEventoImagem('${e.key}')">📤 Compartilhar conquista</button>`
      : inscrito ? `<button class="btn btn-ghost" onclick="goTab('sessions')">Ir para o treino</button>`
      : p.terminou ? '' : `<button class="btn btn-primary" onclick="participaEvento('${e.key}')">Participar do desafio</button>`}</div>`}
  </div>`;
}
function renderChallenges(){
  const root = $('chal-root'); if(!root) return;
  checkEventos();
  const ativos = eventosAtivos();
  const e = ativos[0];
  let h = '';
  if(e){
    h += _evHero(e);
    const ms = missoesDoEvento(e);
    const proxima = ms.find(m=>!m.ok && !m.passou);
    h += `<div class="mt-sec">Missões</div><div class="card" style="padding:6px 14px">${ms.map(m=>`<div class="ev-mission ${m.ok?'ok':''} ${m.agora&&!m.ok?'now':''} ${m.passou?'past':''}" style="--ev:${evCor(e.arte).ev||'var(--primary)'}">
        <div class="ev-mcheck">${m.ok?'✓':''}</div><div class="ev-mt"><b>${mtEsc(m.titulo)}${m===proxima?' <span class="pill on" style="font-size:10px;padding:1px 7px;margin-left:4px">próxima</span>':''}</b><small>${mtEsc(m.desc)}</small></div><span class="ev-mv">${Math.min(m.val,m.alvo)}/${m.alvo}</span></div>`).join('')}</div>`;
    const reg = (state.eventos||{})[e.key];
    h += `<div class="mt-sec">Recompensa</div><div class="card ev-medal">${eventoMedalha(e, 58)}<div><b style="font-size:14.5px">Medalha ${mtEsc(e.nome)} ${new Date(e.ini).getFullYear()}</b><div class="mt-muted">${e.recompensa?mtEsc(e.recompensa)+' · ':''}Exclusiva deste período: depois que o desafio termina, não dá mais para conquistar.</div>
      ${reg && !reg.concluidoEm ? `<a href="#" onclick="sairDoEvento('${e.key}');return false" style="font-size:12px;color:var(--text-mute)">Sair do desafio</a>`:''}</div></div>`;
    if(ativos.length>1) h += `<div class="mt-sec">Também acontecendo</div>` + ativos.slice(1).map(x=>{ const p=progressoEvento(x); return `<div class="card ev-mini" onclick="mtEvFoco('${x.key}')">${eventoMedalha(x,44)}<div style="flex:1;min-width:0"><b style="font-size:14px">${mtEsc(x.nome)}</b><div class="mt-muted">${p.dias}/${p.alvo} dias · ${p.restam===0?'último dia':p.restam+' dias restantes'}</div></div><span style="color:var(--text-mute)">›</span></div>`; }).join('');
  } else {
    h += `<div class="card"><b>Nenhum desafio ativo agora.</b><div class="mt-muted">O próximo começa em breve.</div></div>`;
  }
  const prox = proximoEvento();
  if(prox) h += `<div class="mt-sec">Em breve</div><div class="card ev-mini">${eventoMedalha(prox,44)}<div style="flex:1;min-width:0"><b style="font-size:14px">${mtEsc(prox.nome)}</b><div class="mt-muted">Começa em ${mtFmtData(prox.ini,{day:'2-digit',month:'long'})}</div></div></div>`;
  // níveis do mês (sistema existente) + conquistas + medalhas
  try{
    ensureMonthly();
    const grupos = desafiosDoMes(); const total = grupos.length*NIVEIS_DESAFIO.length;
    const feitos = grupos.reduce((s,g)=>s+g.niveis.filter(c=>state.monthly.done.includes(c.id)).length,0);
    const tot = TROPHIES.length, tenho = (state.trophies||[]).length;
    const meds = (state.medals||[]).length + (state.monthly.done||[]).length;
    h += `<div class="mt-sec">Sua coleção</div><div class="chal-tiles">
      <div class="chal-tile" onclick="openMonthly()">${medalSvgInline('medal')}<b>Níveis do mês</b><small>${feitos} de ${total} · bronze, prata e ouro</small></div>
      <div class="chal-tile" onclick="openTrophies()">${medalSvgInline('star')}<b>Conquistas</b><small>${tenho} de ${tot} desbloqueadas</small></div>
      <div class="chal-tile" onclick="openMedals()">${medalSvgInline('crown')}<b>Medalhas</b><small>${meds} no arquivo</small></div>
      <div class="chal-tile" onclick="openHistoricoEventos()">${medalSvgInline('calendar')}<b>Histórico</b><small>Desafios temáticos anteriores</small></div>
    </div>`;
  }catch(err){}
  root.innerHTML = h;
  const dot = $('tab-dot-chal'); if(dot) dot.classList.remove('on');
  mtLS('mt_chal_visto', e ? e.key : '');
}
function medalSvgInline(g){ return `<span class="tbadge" style="width:34px;height:34px">${medalSvg(TROPHY_GLYPH[g]?g:'medal')}</span>`; }
TROPHY_GLYPH.calendar = '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>';
function mtEvFoco(key){
  const e = eventoPorKey(key); if(!e) return;
  $('modal-inner').innerHTML = _evHero(e) + `<div class="card" style="padding:6px 14px;margin-top:10px">${missoesDoEvento(e).map(m=>`<div class="ev-mission ${m.ok?'ok':''}"><div class="ev-mcheck">${m.ok?'✓':''}</div><div class="ev-mt"><b>${mtEsc(m.titulo)}</b><small>${mtEsc(m.desc)}</small></div><span class="ev-mv">${Math.min(m.val,m.alvo)}/${m.alvo}</span></div>`).join('')}</div><button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function openHistoricoEventos(){
  const regs = Object.entries(state.eventos||{}).sort((a,b)=>(b[1].ini||0)-(a[1].ini||0));
  const linhas = regs.map(([k,r])=>{
    const e = eventoPorKey(k) || {key:k, nome:r.nome, arte:r.arte, ini:r.ini, fim:r.fim};
    const dias = e.ini ? mtDiasAtivos(e.ini, e.fim).size : 0;
    const st = r.concluidoEm ? `<span class="pill on">concluído</span>` : (Date.now()>=e.fim ? `<span class="pill">não concluído</span>` : `<span class="pill">em andamento</span>`);
    return `<div class="ev-list-item">${eventoMedalha(e,40)}<div style="flex:1;min-width:0"><b style="font-size:13.5px">${mtEsc(e.nome)} ${e.ini?new Date(e.ini).getFullYear():''}</b><div class="mt-muted">${dias}/${r.alvo} dias${r.concluidoEm?' · '+mtFmtData(r.concluidoEm):''}</div></div>${st}</div>`;
  }).join('');
  $('modal-inner').innerHTML = `<h3>Desafios temáticos</h3><p class="mt-muted" style="margin:0 0 8px">Os desafios em que você participou, com o resultado real de cada um.</p>
    <div class="card" style="padding:8px 14px">${linhas || '<div class="mt-muted" style="padding:12px 0">Você ainda não participou de nenhum desafio temático.</div>'}</div>
    <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
// imagem para compartilhar (identidade MetaTreino)
async function shareEventoImagem(key){
  const e = eventoPorKey(key); const reg = (state.eventos||{})[key]; if(!e || !reg) return;
  const c = Object.assign({}, EV_CORES[e.arte] || EV_CORES.evolucao);   // imagem sempre escura
  if(EV_DO_TEMA.includes(e.arte)){ try{ const cs = getComputedStyle(document.documentElement); const pr = cs.getPropertyValue('--primary').trim(), rgb = cs.getPropertyValue('--primary-rgb').trim(); if(pr && !temaClaro()){ c.ev = pr; c.a = `rgba(${rgb},.22)`; c.b = `rgba(${rgb},.08)`; } }catch(err){} }
  const W = 1080, H = 1350; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#050505'; g.fillRect(0,0,W,H);
  const rg = g.createRadialGradient(W*0.85, H*0.1, 20, W*0.85, H*0.1, W*0.9); rg.addColorStop(0, c.a.replace(/[\d.]+\)$/,'0.55)')); rg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0,0,W,H);
  const rg2 = g.createRadialGradient(0, H, 20, 0, H, W*0.9); rg2.addColorStop(0, c.b.replace(/[\d.]+\)$/,'0.45)')); rg2.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = rg2; g.fillRect(0,0,W,H);
  const img = async (svg, x, y, w, h)=>{ const u = 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); const im = new Image(); await new Promise(r=>{ im.onload=r; im.onerror=r; im.src=u; }); try{ g.drawImage(im, x, y, w, h); }catch(err){} };
  const arte = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="--ev:${c.ev}">${(EV_ARTE[e.arte]||'').replace(/var\(--ev\)/g, c.ev)}</svg>`;
  await img(arte, W-560, 40, 520, 520);
  const medal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="none" stroke="${c.ev}" stroke-width="1.6"/><circle cx="24" cy="24" r="18.5" fill="${c.ev}" fill-opacity=".14"/><g transform="translate(12 6.5)" fill="none" stroke="${c.ev}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${(TROPHY_GLYPH['ev_'+e.arte]||TROPHY_GLYPH.medal).replace(/currentColor/g,c.ev)}</g><text x="24" y="40.5" fill="#fff" font-size="8.5" font-weight="800" text-anchor="middle" font-family="sans-serif">${new Date(e.ini).getFullYear()}</text></svg>`;
  await img(medal, 80, 560, 300, 300);
  g.fillStyle = c.ev; g.font = '800 34px Outfit, system-ui, sans-serif'; g.fillText('DESAFIO CONCLUÍDO', 80, 140);
  g.fillStyle = '#fff'; g.font = '800 92px Outfit, system-ui, sans-serif';
  const palavras = e.nome.split(' '); let linha = '', y = 250; palavras.forEach(p=>{ const t = linha ? linha+' '+p : p; if(g.measureText(t).width > 620 && linha){ g.fillText(linha, 80, y); y += 100; linha = p; } else linha = t; }); g.fillText(linha, 80, y);
  const dias = mtDiasAtivos(e.ini, e.fim).size;
  g.fillStyle = '#fff'; g.font = '300 150px Outfit, system-ui, sans-serif'; g.fillText(String(dias), 430, 760);
  g.fillStyle = 'rgba(255,255,255,.65)'; g.font = '600 38px Outfit, system-ui, sans-serif'; g.fillText('dias ativos · meta '+reg.alvo, 430, 820);
  g.fillText(mtFmtData(e.ini,{day:'2-digit',month:'short'})+' – '+mtFmtData(e.fim-1,{day:'2-digit',month:'short',year:'numeric'}), 80, 980);
  g.fillStyle = c.ev; g.fillRect(80, 1180, 70, 8);
  g.fillStyle = '#fff'; g.font = '800 44px Outfit, system-ui, sans-serif'; g.fillText('METATREINO', 80, 1250);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '500 30px Outfit, system-ui, sans-serif'; g.fillText('Treinos inteligentes que evoluem com você', 80, 1295);
  shareCanvas(cv, 'metatreino-'+e.key+'.png', `Concluí o desafio ${e.nome} no MetaTreino: ${dias} dias ativos!`);
}
// card da Home: o desafio temático encabeça o card de desafios do mês que já existia
mtGancho('renderMonthlyCard', { depois(){
  try{
    const card = $('card-monthly'); if(!card) return;
    card.setAttribute('onclick', "goTab('challenges')");
    const e = eventoPrincipal(); if(!e) return;
    try{ const mt = $('monthly-title'); if(mt) mt.textContent = 'Níveis do mês · ' + monthName(state.monthly.key).split('/')[0]; }catch(err){}
    const p = progressoEvento(e); const reg = (state.eventos||{})[e.key];
    let box = $('home-ev-row');
    if(!box){ box = document.createElement('div'); box.id = 'home-ev-row'; card.insertBefore(box, card.firstChild); }
    box.innerHTML = `<div class="ev-mini" style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)">${eventoMedalha(e,44)}<div style="flex:1;min-width:0"><div style="font-size:10.5px;font-weight:800;letter-spacing:1.1px;color:${evCor(e.arte).ev};text-transform:uppercase">${e.prioridade>=2?'Desafio especial':'Desafio do mês'}</div><b style="font-size:15px">${mtEsc(e.nome)}</b>
      <div class="mt-bar" style="margin-top:6px;height:6px"><i style="width:${Math.round(p.pct*100)}%;background:${evCor(e.arte).ev}"></i></div>
      <div class="mt-muted" style="font-size:11.5px;margin-top:4px">${reg?`${p.dias}/${p.alvo} dias ativos`:'Toque para participar'} · ${p.restam===0?'último dia':p.restam+' dias restantes'}</div></div></div>`;
    const visto = mtLS('mt_chal_visto'); const dot = $('tab-dot-chal'); if(dot) dot.classList.toggle('on', visto !== e.key);
  }catch(err){ console.log(err); }
}});

// ===================================================================================================
// RC 4 — Etapa 1: sessões de musculação, "hoje" nas duas modalidades e retorno previsível à aba Treinos
// (as correções de lógica ficam nas próprias funções — app.js e partes 05, 26, 61, 76, 80, 81; aqui só o que é
// novo e não tem dono anterior)
// ===================================================================================================

// ---------- 1. Sessões: migração única dos registros antigos (ver mtSessaoMigrar no app.js) ----------
// Roda na verificação de forma do estado (a cada entrada); só a primeira vez muda alguma coisa. Grava no aparelho
// e a nuvem recebe junto com a próxima gravação normal (não dispara gravação extra na nuvem).
mtGancho('ensureStateShape', { depois(){ try{ if(typeof mtSessaoMigrar === 'function' && mtSessaoMigrar()) salvarLocal(); }catch(e){} } });

// ---------- 2. Início: o dia de hoje nas DUAS modalidades ----------
// Com musculação e corrida, o seletor mostrava só uma de cada vez e o cartão de descanso de uma parecia descanso
// geral. Agora, logo abaixo do seletor, uma linha diz o que cada uma tem hoje, com o estado real (feito, a fazer,
// feito em outro dia da semana, descanso escolhido ou sem treino). Tocar troca de modalidade. Nada no plano muda.
function mtHojeModalidade(m){
  const mod = state.modules[m]; if(!mod || !mod.plan) return null;
  const hj = getDayIdx(); const h0 = mtDia0();
  const w = (mod.plan.workouts||[]).find(x=>x.dayIdx === hj) || null;
  const feitos = (typeof entriesHoje === 'function') ? entriesHoje(mod) : [];
  const pulado = !!(w && (state.skips||[]).some(s=>s.at === h0 && s.module === m && (typeof skipEDoTreino !== 'function' || skipEDoTreino(s, w))));
  let antes = null; try{ if(w && m === 'lift' && !feitos.length){ const e = entradaConcluidaSemana(w, 'lift'); if(e && mtDia0(e.at) !== h0) antes = e; } }catch(e){}
  const nome = w ? (m === 'lift' ? 'Treino ' + w.k : String(w.name||'Corrida').split('(')[0].trim()) : '';
  let st, txt;
  if(feitos.length && w){ st = 'feito'; txt = `${nome} · feito`; }
  else if(feitos.length){ st = 'feito'; txt = feitos.length > 1 ? `${feitos.length} atividades extras` : 'atividade extra feita'; }
  else if(antes){ st = 'feito'; txt = `${nome} · feito na ${['domingo','segunda','terça','quarta','quinta','sexta','sábado'][new Date(antes.at).getDay()]}`; }
  else if(pulado){ st = 'desc'; txt = 'descanso escolhido'; }
  else if(w){ st = 'hoje'; txt = nome; }
  else { st = 'livre'; txt = 'sem treino hoje'; }
  return { m, w, st, txt };
}
// RC5: a linha extra com Musculação/Corrida embaixo do seletor saiu (ficava repetida com o próprio seletor).
// O estado das duas modalidades continua na saudação e no card de descanso; mtHojeModalidade segue disponível.
function mtHojeDuoDesenha(){ const velho = $('hoje-duo'); if(velho) velho.remove(); }

// ---------- 3. Aba Treinos: volta previsível ----------
// Antes, o treino escolhido ficava gravado sem data: dias depois a aba abria num treino de outro dia. Regra nova,
// aplicada ao ENTRAR na aba vindo de outra tela (dentro da aba, a escolha do aluno é respeitada):
//  1) treino de musculação EM ANDAMENTO hoje (séries registradas e ainda não salvo) → ele, com as séries intactas;
//  2) senão, o treino de HOJE (mesmo já concluído — mostra o cartão de concluído);
//  3) senão (dia sem treino), a tela padrão: o próximo treino da semana ainda não feito.
// Abrir um treino de propósito (botão "Ver sessão", lista de treinos) continua indo direto nele. Nada é apagado
// nem reiniciado: as séries ficam no registro e o treino em andamento continua de onde parou.
function mtSessaoPadrao(mod, m){
  const ws = (mod && mod.plan && mod.plan.workouts) || []; if(!ws.length) return null;
  if(m === 'lift'){ const and = ws.find(w=>(w.exercises||[]).some(ex=>typeof mtTemSeriesAbertasHoje === 'function' && mtTemSeriesAbertasHoje(ex.id))); if(and) return and; }
  const hj = getDayIdx(); const deHoje = ws.find(w=>w.dayIdx === hj); if(deHoje) return deHoje;
  const naoFeito = w=>{ try{ return !entradaConcluidaSemana(w, m); }catch(e){ return true; } };
  const ord = ws.slice().sort((a,b)=>a.dayIdx - b.dayIdx);
  return ord.find(w=>w.dayIdx > hj && naoFeito(w)) || ord.find(w=>naoFeito(w)) || ord.find(w=>w.dayIdx > hj) || ord[0];
}
mtGancho('openSession', { antes(){ window.__mtSessExplicita = true; window.__mtSelEm = Date.now(); }, depois(){ window.__mtSessExplicita = false; } });
// escolher um treino e ir para a aba logo em seguida (qualquer caminho do app que faça isso) também é escolha explícita
mtGancho('selectSession', { antes(){ window.__mtSelEm = Date.now(); } });
mtGancho('goTab', { antes(tab){
  try{
    if(tab !== 'sessions' || window.__mtSessExplicita || !state || !state.ui) return;
    if(Date.now() - (window.__mtSelEm || 0) < 3000) return;   // acabou de escolher um treino: vai direto nele
    const vindo = state.ui.tab; if(vindo === 'sessions' || vindo === 'plan' || vindo === 'library') return;
    const m = state.active, mod = state.modules[m]; const w = mtSessaoPadrao(mod, m); if(!w) return;
    state.ui.selectedSession = String(w.k || w.dayIdx);
  }catch(e){ console.log('treinos (padrão):', e); }
} });

(function(){ if(document.getElementById('rc4-e1-css')) return; const s = document.createElement('style'); s.id = 'rc4-e1-css';
s.textContent = `
.rest-outro{margin:10px auto 0;max-width:320px;font-size:13px;line-height:1.45;color:var(--text-dim)}
.rest-outro b{color:var(--text)}
.rest-outro .link-mais{display:inline;margin-left:4px;padding:0;border:0;background:none;color:var(--primary-2);font:inherit;font-weight:700;cursor:pointer}
`; document.head.appendChild(s); })();

Object.assign(window, { mtHojeModalidade, mtHojeDuoDesenha, mtSessaoPadrao });

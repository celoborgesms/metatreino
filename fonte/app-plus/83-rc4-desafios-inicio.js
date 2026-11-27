// ===================================================================================================
// RC 4 — Etapa 2: aba Desafios organizada, Início mais limpo (conquistas e desafio do mês) e acabamentos
// ===================================================================================================

// ---------- 1. Aba Desafios: uma ordem só, sem cartões repetidos ----------
// Antes: novidades, desafio, missões, recompensa, em breve e quatro atalhos ("Metas do mês", "Conquistas",
// "Medalhas e metas", "Histórico"), alguns levando à mesma tela e repetindo contadores. Agora, de cima para baixo:
//  1) Desafio atual — o desafio temático (o que é, quanto falta, missões, recompensa) e as metas do mês;
//  2) Em grupo — o desafio juntos, só para quem tem grupo;
//  3) Conquistas — um cartão: quantas tem, quais são novas, atalhos para as ganhas e as que faltam;
//  4) Histórico — desafios anteriores e medalhas guardadas;
//  5) Em breve — o próximo desafio, discreto, no fim.
// Os blocos são os MESMOS que as outras partes desenham (nada é recalculado aqui): esta parte só os reorganiza
// e troca os quatro atalhos por um cartão de conquistas e uma lista de histórico.
function _chalSec(tit, sub){ const s = document.createElement('section'); s.className = 'chal-sec'; s.innerHTML = `<h2 class="chal-h">${tit}${sub ? `<small>${sub}</small>` : ''}</h2>`; return s; }
function _chalInicioConta(){ try{ const sts = ['lift','run'].map(m=>state.modules[m] && planStartTs(state.modules[m])).filter(Boolean); return sts.length ? mtDia0(Math.min(...sts)) : 0; }catch(e){ return 0; } }
function mtDesafiosOrganiza(){
  const root = $('chal-root'); if(!root || root.querySelector(':scope > .chal-sec')) return;
  const kids = [...root.children]; const G = {}; let sec = 'topo'; let nov = null, resg = null;
  kids.forEach(k=>{
    if(k.id === 'mt-novidades'){ nov = k; return; }
    if(k.id === 'ev-resgate'){ resg = k; return; }
    if(k.classList.contains('mt-sec')){ sec = k.textContent.trim(); return; }
    (G[sec] = G[sec] || []).push(k);
  });
  const frag = document.createDocumentFragment();
  // 1) desafio atual
  const s1 = _chalSec('Desafio atual');
  if(resg) s1.appendChild(resg);
  (G.topo||[]).forEach(n=>s1.appendChild(n));
  if((G['Missões']||[]).length){ const l = document.createElement('div'); l.className = 'chal-sub'; l.textContent = 'Missões'; s1.appendChild(l); G['Missões'].forEach(n=>s1.appendChild(n)); }
  (G['Recompensa']||[]).forEach(n=>{ n.classList.add('chal-recomp'); s1.appendChild(n); });
  if((G['Também acontecendo']||[]).length){ const l = document.createElement('div'); l.className = 'chal-sub'; l.textContent = 'Também acontecendo'; s1.appendChild(l); G['Também acontecendo'].forEach(n=>s1.appendChild(n)); }
  try{ s1.insertAdjacentHTML('beforeend', _chalMetasMes()); }catch(e){}
  frag.appendChild(s1);
  // 2) em grupo
  try{ const dj = (typeof djSecao === 'function') ? djSecao() : ''; if(dj){ const s2 = _chalSec('Em grupo'); s2.insertAdjacentHTML('beforeend', dj.replace('id="dj-box"', 'id="dj-box-chal"')); frag.appendChild(s2); } }catch(e){}
  // 3) conquistas
  const s3 = _chalSec('Conquistas'); s3.insertAdjacentHTML('beforeend', _chalConquistas()); frag.appendChild(s3);
  // 4) histórico
  const s4 = _chalSec('Histórico'); s4.insertAdjacentHTML('beforeend', _chalHistorico()); frag.appendChild(s4);
  // 5) em breve
  if((G['Em breve']||[]).length){ const s5 = _chalSec('Em breve'); G['Em breve'].forEach(n=>s5.appendChild(n)); frag.appendChild(s5); }
  void nov;   // as novidades viram o "N novas" do cartão de conquistas e o aviso no histórico (sem lista repetida)
  root.innerHTML = ''; root.appendChild(frag);
  // missões de semanas que terminaram antes de a pessoa começar: não são cobradas
  try{
    const ini = _chalInicioConta(); const e = eventoPrincipal();
    if(ini && e){ const ms = missoesDoEvento(e); root.querySelectorAll('.ev-mission').forEach((row, i)=>{ const m = ms[i]; if(!m || m.ok) return;
      const fimSem = /entre (\d\d)\/(\d\d) e (\d\d)\/(\d\d)/.exec(m.desc||''); if(!fimSem) return;
      const fim = new Date(new Date(e.ini).getFullYear(), +fimSem[4]-1, +fimSem[3]).getTime();
      if(fim < ini){ row.classList.add('past', 'antes-inicio'); const v = row.querySelector('.ev-mv'); if(v) v.textContent = '—'; const sm = row.querySelector('.ev-mt small'); if(sm) sm.textContent = 'Antes do início do seu plano — não conta.'; } }); }
  }catch(e){}
}
// metas do mês (bronze, prata e ouro): uma linha, com o que falta para o próximo degrau do foco do mês
function _chalMetasMes(){
  ensureMonthly(); const grupos = desafiosDoMes(); const tot = grupos.length*NIVEIS_DESAFIO.length;
  const feitos = grupos.reduce((s,g)=>s + g.niveis.filter(c=>state.monthly.done.includes(c.id)).length, 0);
  const selo = state.monthly.done.includes('selo:' + state.monthly.key);
  const prox = grupos.filter(g=>g.destaque).map(g=>{ const c = g.niveis.find(c=>!state.monthly.done.includes(c.id)); if(!c) return null; const [a, al] = c.prog(); return { c, a:Math.min(a, al), al, p:Math.min(1, a/al) }; }).filter(Boolean).sort((x,y)=>y.p - x.p)[0];
  const r = daysLeftInMonth();
  return `<button type="button" class="chal-linha" onclick="openMonthly()"><span class="cl-ico" aria-hidden="true">${medalSvgInline('medal')}</span>
    <span class="cl-tx"><b>Metas do mês</b><small>${feitos} de ${tot} degraus${selo ? ' · selo conquistado' : ` · selo com ${SELO_MIN_NIVEIS}`} · ${r === 0 ? 'último dia' : r + (r === 1 ? ' dia restante' : ' dias restantes')}</small>
    ${prox ? `<small class="cl-prox">Próximo: ${mtEsc(prox.c.nome.replace(/\s*\S+$/, ''))} ${NIVEIS_DESAFIO.find(n=>n.id===prox.c.nivel).lbl.toLowerCase()} · ${prox.a}/${prox.al}</small>` : ''}</span><span class="ii-seta">›</span></button>`;
}
function _chalConquistas(){
  const tot = TROPHIES.length, tenho = (state.trophies||[]).length; const pend = (typeof cqPendentes === 'function') ? cqPendentes() : { itens:[], meses:[] };
  const novas = pend.itens;   // o mesmo número do ponto da aba (conquistas e medalhas novas)
  const datas = state.trophyDates || {};
  const rec = TROPHIES.filter(t=>state.trophies.includes(t.id)).sort((a,b)=>(datas[b.id]||0)-(datas[a.id]||0)).slice(0, 4);
  return `<div class="card chal-cq">
    <button type="button" class="chal-cq-top" onclick="openTrophies()"><span class="chal-cq-n"><b>${tenho}</b><small>de ${tot}</small></span>
      <span class="chal-cq-tx"><b>${tenho === 1 ? '1 conquista desbloqueada' : `${tenho} conquistas desbloqueadas`}</b>${novas.length ? `<small class="cq-novas-txt">${novas.length === 1 ? '1 nova: ' + mtEsc((TROPHIES.find(t=>t.id===novas[0].tid)||{}).name || novas[0].nome || '') : novas.length + ' novas para ver'}</small>` : '<small>Toque para ver todas, com descrição e progresso</small>'}</span>
      ${rec.length ? `<span class="chal-cq-rec" aria-hidden="true">${rec.map(t=>trophyIco(t)).join('')}</span>` : ''}</button>
    <div class="chal-cq-bts"><button type="button" class="btn btn-ghost" onclick="_cqFiltro='ok';openTrophies()">Desbloqueadas</button><button type="button" class="btn btn-ghost" onclick="_cqFiltro='and';openTrophies()">Disponíveis</button></div></div>`;
}
function _chalHistorico(){
  const pend = (typeof cqPendentes === 'function') ? cqPendentes() : { meses:[] };
  const nEv = (state.medals||[]).filter(m=>String(m.id).startsWith('ev:')).length;
  const nMed = (state.medals||[]).length;
  const linhas = [];
  pend.meses.forEach(d=>linhas.push(`<button type="button" class="chal-linha chal-novo" onclick="openTrophies()"><span class="cl-tx"><b>Desafio do mês encerrado: ${mtEsc((d.tema||{}).nome||'')}</b><small>Veja o resultado</small></span><span class="ii-seta">›</span></button>`));
  linhas.push(`<button type="button" class="chal-linha" onclick="openHistoricoEventos()"><span class="cl-tx"><b>Desafios anteriores</b><small>${nEv ? `${nEv} ${nEv===1?'medalha de desafio':'medalhas de desafio'}` : 'Os desafios temáticos que já passaram'}</small></span><span class="ii-seta">›</span></button>`);
  linhas.push(`<button type="button" class="chal-linha" onclick="openMedals()"><span class="cl-tx"><b>Medalhas e metas dos meses</b><small>${nMed ? `${nMed} no arquivo` : 'Ficam guardadas mesmo depois que o mês vira'}</small></span><span class="ii-seta">›</span></button>`);
  return `<div class="card chal-lista">${linhas.join('')}</div>`;
}
mtGancho('renderChallenges', { depois(){ try{ mtDesafiosOrganiza(); }catch(e){ console.log('desafios (organização):', e); } } });

// ---------- 2. Início: desafio do mês em UMA linha (opção B, enxuta) ----------
// O cartão antigo tinha o desafio temático + três barras de metas (o mesmo que está em Desafios). Agora: uma linha
// só, enquanto houver algo a fazer no desafio temático ("Reta Final · falta 1 dia ativo · 4 dias restantes").
// Concluído o desafio (ou sem desafio no período), a linha some. Os detalhes ficam na aba Desafios.
mtGancho('renderMonthlyCard', { depois(){
  try{
    const card = $('card-monthly'); if(!card) return;
    let e = null; try{ e = eventoPrincipal(); }catch(err){}
    const reg = e && (state.eventos||{})[e.key];
    const p = e ? progressoEvento(e) : null;
    // os elementos antigos do cartão ficam (outras partes os atualizam), só escondidos; a linha nova vai por cima
    let row = card.querySelector(':scope > .hmd-row');
    if(!e || !p || (reg && reg.concluidoEm) || (reg && p.dias >= p.alvo)){ card.classList.add('hidden'); if(row) row.remove(); return; }
    const falta = Math.max(0, p.alvo - p.dias);
    card.classList.add('hm-desafio'); card.style.cssText = ''; card.setAttribute('onclick', "goTab('challenges')");
    card.setAttribute('role', 'button'); card.setAttribute('aria-label', `Desafio ${e.nome}: ver detalhes em Desafios`);
    if(!row){ row = document.createElement('div'); row.className = 'hmd-row'; card.appendChild(row); }
    row.innerHTML = `<span class="hmd-med" aria-hidden="true">${eventoMedalha(e, 34)}</span><span class="hmd-tx"><b>${mtEsc(e.nome)}</b><small>${reg ? `${falta === 1 ? 'falta 1 dia ativo' : `faltam ${falta} dias ativos`}` : 'toque para participar'} · ${p.restam === 0 ? 'último dia' : p.restam + (p.restam === 1 ? ' dia restante' : ' dias restantes')}</small></span><span class="hmd-bar" aria-hidden="true"><i style="width:${Math.round(p.pct*100)}%"></i></span><span class="ii-seta">›</span>`;
  }catch(err){ console.log('início (desafio):', err); }
} });

// ---------- 3. Indicadores do Início: 1, 2, 3 ou 4 cartões sem buraco ----------
// A regra "o último ímpar ocupa a linha" existia, mas só rodava quando a personalização mudava; depois de um
// redesenho dos indicadores (ex.: o atalho do sono trocado na hora) a marca ficava no cartão errado. Agora roda
// a cada desenho, pela ordem VISUAL, e o número de cartões fica no próprio bloco (data-n) para o CSS.
function mtIndicadoresAjusta(){
  try{
    const m = $('home-metrics'); if(!m) return;
    const tiles = [...m.children]; tiles.forEach(t=>t.classList.remove('met-full'));
    const vis = tiles.filter(t=>getComputedStyle(t).display !== 'none').map((t,i)=>({ t, o:parseInt(getComputedStyle(t).order,10)||0, i })).sort((a,b)=>(a.o-b.o)||(a.i-b.i)).map(x=>x.t);
    if(vis.length % 2 === 1) vis[vis.length-1].classList.add('met-full');
    m.dataset.n = String(vis.length); m.classList.toggle('met-vazio', !vis.length);
  }catch(e){}
}
mtGancho('renderHomeMetrics', { depois(){ mtIndicadoresAjusta(); } });
mtGancho('aplicaInicio', { depois(){ mtIndicadoresAjusta(); } });

(function(){ if(document.getElementById('rc4-e2-css')) return; const s = document.createElement('style'); s.id = 'rc4-e2-css';
s.textContent = `
#home-trofeus{display:none!important}
.chal-sec{margin:0 0 20px}
.chal-h{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--text-mute);margin:6px 2px 8px}
.chal-h small{font-size:11.5px;letter-spacing:0;text-transform:none;font-weight:600}
.chal-sub{font-size:12px;font-weight:700;color:var(--text-dim);margin:12px 2px 6px}
.chal-sec .chal-recomp{margin-top:10px}
.chal-linha{display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px;margin-top:10px;border-radius:var(--radius-card,16px);border:1px solid var(--border);background:var(--surface);color:var(--text);font:inherit;text-align:left;cursor:pointer;min-height:52px}
.chal-lista .chal-linha{margin:0;border:0;border-radius:0;background:none;padding:12px 2px;border-bottom:1px solid var(--border)}
.chal-lista .chal-linha:last-child{border-bottom:0}
.chal-lista{padding:2px 14px}
.chal-linha .cl-ico .tbadge{width:34px;height:34px}
.chal-linha .cl-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.chal-linha .cl-tx b{font-size:14px}.chal-linha .cl-tx small{font-size:12px;color:var(--text-dim)}
.chal-linha .cl-prox{color:var(--primary-2)!important;font-weight:700}
.chal-novo .cl-tx b{color:var(--primary-2)}
.chal-cq{padding:12px 14px}
.chal-cq-top{display:flex;align-items:center;gap:12px;width:100%;padding:0;border:0;background:none;color:var(--text);font:inherit;text-align:left;cursor:pointer}
.chal-cq-n{display:flex;flex-direction:column;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;border:3px solid var(--line-primary,var(--primary));flex:none}
.chal-cq-n b{font-size:19px;line-height:1}.chal-cq-n small{font-size:10px;color:var(--text-mute)}
.chal-cq-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.chal-cq-tx b{font-size:14.5px}.chal-cq-tx small{font-size:12px;color:var(--text-dim)}
.chal-cq-tx .cq-novas-txt{color:var(--primary-2);font-weight:700}
.chal-cq-rec{display:flex;gap:2px;flex:none}.chal-cq-rec .tbadge{width:28px;height:28px}
@media (max-width:380px){.chal-cq-rec .tbadge:nth-child(n+3){display:none}}
.chal-cq-bts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.chal-cq-bts .btn{padding:9px 8px;font-size:13px}
.ev-mission.antes-inicio{opacity:.55}
.hm-desafio{padding:10px 14px!important;margin-top:12px;cursor:pointer}
.hm-desafio > :not(.hmd-row){display:none!important}
.hm-desafio > .hmd-row{display:flex;align-items:center;gap:10px;position:relative;padding-bottom:6px}
.hm-desafio .hmd-med{flex:none;display:flex}
.hm-desafio .hmd-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.hm-desafio .hmd-tx b{font-size:14px}.hm-desafio .hmd-tx small{font-size:12px;color:var(--text-dim)}
.hm-desafio .hmd-bar{position:absolute;left:44px;right:0;bottom:0;height:3px;border-radius:99px;background:var(--surface-2);overflow:hidden}.hm-desafio .hmd-bar i{display:block;height:100%;background:var(--primary)}
.metrics[data-n="1"]{grid-template-columns:1fr}
.cq-aviso{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translate(-50%,16px);opacity:0;z-index:9000;display:flex;align-items:center;gap:10px;max-width:min(92vw,420px);padding:8px 12px 8px 8px;border-radius:16px;border:1px solid var(--line-primary,var(--border));background:var(--surface);color:var(--text);box-shadow:0 8px 28px rgba(0,0,0,.35);font:inherit;text-align:left;cursor:pointer;transition:opacity .25s ease,transform .25s ease}
.cq-aviso.on{opacity:1;transform:translate(-50%,0)}
.cq-aviso .cqa-ico{display:flex;flex:none}.cq-aviso .cqa-ico .tbadge{width:34px;height:34px}
.cq-aviso .cqa-tx{display:flex;flex-direction:column;min-width:0}.cq-aviso .cqa-tx b{font-size:13px}.cq-aviso .cqa-tx small{font-size:11.5px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cq-aviso .cqa-ver{font-size:12.5px;font-weight:800;color:var(--primary-2);padding-left:4px}
@media (prefers-reduced-motion:reduce){.cq-aviso{transition:none}}
details.note-clima > summary{list-style:none;cursor:pointer;display:block}
details.note-clima > summary::-webkit-details-marker{display:none}
details.note-clima .note-title{display:block}
details.note-clima .nc-1{display:block;font-size:13px;line-height:1.45;margin-top:2px}
details.note-clima .nc-mais{display:inline-block;margin-top:4px;font-size:12px;font-weight:700;color:var(--info-soft,var(--primary-2));text-decoration:underline}
details.note-clima[open] .nc-mais{display:none}
details.note-clima .nc-obs{color:var(--text-mute);font-size:11.5px;margin-top:4px}
.mes-mais{margin-top:4px}.mes-mais > summary{cursor:pointer;font-size:13px;font-weight:700;color:var(--text-dim);padding:6px 2px}
.mts-nota{font-size:11.5px;color:var(--text-mute);line-height:1.4;margin:-2px 0 8px 28px}
.cq-item{text-align:center}
.cq-item .cq-item-med{width:150px;height:150px}
.cq-item .tr-ico{display:grid;place-items:center;width:112px;height:112px}
.cq-item .tr-ico svg,.cq-item .tr-ico img{width:100%;height:100%}
.cq-item .tr-ico .tbadge{display:block;width:112px!important;height:112px!important}
.tbadge.cq-nv-bronze{--c:#c98a4f}.tbadge.cq-nv-prata{--c:#b9c2cc}.tbadge.cq-nv-ouro{--c:#e2b93b}
.cq-item .tr-ico .cq-emo{font-size:72px;line-height:1}
.cq-item-tipo{margin-top:6px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;font-weight:800;color:var(--primary-2)}
.cq-item h3.tr-nome{margin:6px 0 2px}
.cq-item-desc{color:var(--text-dim);font-size:14px;line-height:1.45;margin:4px 8px 0}
.cq-item-data{margin-top:10px;font-size:12.5px;color:var(--text-mute)}
`; document.head.appendChild(s); })();

Object.assign(window, { mtDesafiosOrganiza, mtIndicadoresAjusta });

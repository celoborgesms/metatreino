
// =====================================================================
// 39. Beta 25 — Histórico com páginas numeradas; desafios futuros com detalhes
// =====================================================================

// ---------- Histórico: ‹ 1 2 3 … 12 › ----------
// Continua com 10 registros por página e do mais recente para o mais antigo; só o
// rodapé mudou. Com muitas páginas, mostra a primeira, a última e as vizinhas da atual.
function histPaginasCompactas(atual, total){
  // atual e total começando em 1
  if(total <= 7) return Array.from({length:total}, (_,i)=>i+1);
  const s = new Set([1, total, atual, atual-1, atual+1]);
  if(atual <= 3){ s.add(2); s.add(3); s.add(4); }
  if(atual >= total-2){ s.add(total-1); s.add(total-2); s.add(total-3); }
  const nums = [...s].filter(n=>n>=1 && n<=total).sort((a,b)=>a-b);
  const out = []; nums.forEach((n,i)=>{ if(i && n - nums[i-1] > 1) out.push('…'); out.push(n); });
  return out;
}
mtGancho('renderHistory', { depois(){
  const pg = document.querySelector('#history-list .pager'); if(!pg) return;
  // "Página X de Y" fica no texto do <span>; "N registros" no <small> dentro dele
  const sp = pg.querySelector('span'); const sm = sp && sp.querySelector('small');
  const m = sp && String(sp.childNodes[0] && sp.childNodes[0].textContent || '').match(/Página\s+(\d+)\s+de\s+(\d+)/);
  const r = sm && sm.textContent.match(/(\d+)\s+registros/);
  if(!m) return;
  const atual = +m[1], total = +m[2], nreg = r ? +r[1] : null;
  const itens = histPaginasCompactas(atual, total).map(n=> n === '…'
    ? `<span class="hp-ret" aria-hidden="true">…</span>`
    : `<button type="button" class="hp-n ${n===atual?'on':''}" ${n===atual?'aria-current="page"':''} aria-label="Página ${n}" onclick="histGo(${n-1})">${n}</button>`).join('');
  const nav = document.createElement('nav'); nav.className = 'hist-pag'; nav.setAttribute('aria-label', 'Páginas do histórico');
  nav.innerHTML = `<div class="hp-linha">
      <button type="button" class="hp-seta" ${atual<=1?'disabled':''} aria-label="Página anterior (mais novos)" onclick="histGo(${atual-2})">‹</button>
      ${itens}
      <button type="button" class="hp-seta" ${atual>=total?'disabled':''} aria-label="Próxima página (mais antigos)" onclick="histGo(${atual})">›</button>
    </div>
    <div class="hp-info">Página ${atual} de ${total}${nreg!==null?` · ${nreg} registros`:''} · do mais recente para o mais antigo</div>`;
  pg.replaceWith(nav);
}});
// ao trocar de página, volta para o topo da lista (não do app inteiro)
window.histGo = function(p){
  histPage = p; renderHistory();
  try{ const t = document.getElementById('hist-title') || document.getElementById('history-list'); const y = t.getBoundingClientRect().top + window.scrollY - 12; window.scrollTo({ top: Math.max(0, y) }); }catch(e){ try{ window.scrollTo(0,0); }catch(_){} }
};

// ---------- Desafios futuros: tocar no "Em breve" abre os detalhes ----------
// Só informações reais do desafio cadastrado. Sem botão de participar antes da hora
// (a participação e a contagem continuam começando na data de início).
function evFuturoDetalhe(key){
  const e = eventoPorKey(key); if(!e){ toast('Desafio não encontrado.'); return; }
  const agora = Date.now();
  if(agora >= e.ini){ try{ mtEvFoco(key); }catch(err){ goTab('challenges'); } return; }
  const fmt = t=>new Date(t).toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'});
  const dias = Math.max(1, Math.round((e.fim - e.ini)/DIA_MS));
  const faltam = Math.ceil((mtDia0(e.ini) - mtDia0(agora))/DIA_MS);
  let meta = null; try{ meta = metaDoEvento(e); }catch(err){}
  const linha = (rot, val)=> val ? `<div class="mrow"><span>${rot}</span><b>${val}</b></div>` : '';
  let missoes = [];
  try{ missoes = (missoesDoEvento(e)||[]).map(m=>m.titulo).filter(Boolean); }catch(err){}
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `
    <div class="evf-topo">${eventoMedalha(e, 86)}<div class="evf-quando">${faltam <= 1 ? 'Começa amanhã' : `Começa em ${faltam} dias`}</div></div>
    <h3 style="text-align:center;margin:10px 0 4px">${mtEsc(e.nome)}</h3>
    ${e.desc ? `<p class="mt-muted" style="text-align:center;font-size:13px;line-height:1.55;margin:0 0 12px">${mtEsc(e.desc)}</p>` : ''}
    <div class="evf-aviso">⏳ Este desafio ainda não começou. A participação e a contagem dos dias abrem em ${fmt(e.ini)}.</div>
    <div class="card" style="padding:10px 14px;margin-top:10px;font-size:13px;line-height:1.6">
      ${linha('Início', fmt(e.ini))}
      ${linha('Término', fmt(e.fim - 1))}
      ${linha('Duração', dias + (dias===1?' dia':' dias'))}
      ${meta ? linha('Objetivo', `${meta} dias ativos no período`) : ''}
      ${e.recompensa ? linha('Recompensa', mtEsc(e.recompensa)) : linha('Recompensa', 'medalha exclusiva do desafio')}
    </div>
    ${missoes.length ? `<div class="arq-sub" style="margin-top:12px">Missões</div><div class="card" style="padding:4px 14px">${missoes.map(t=>`<div class="ev-mission"><div class="ev-mcheck"></div><div class="ev-mt"><b>${mtEsc(t)}</b></div></div>`).join('')}</div>` : ''}
    <div class="arq-sub" style="margin-top:12px">Como participar</div>
    <p class="mt-muted" style="font-size:12.5px;line-height:1.55;margin:4px 2px 0">No dia do início, ele aparece em <b>Desafios</b> com o botão "Participar". Os treinos contam a partir dessa data.</p>
    <button class="btn btn-ghost btn-block" style="margin-top:14px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
mtGancho('renderChallenges', { depois(){
  document.querySelectorAll('#chal-root .ev-mini').forEach(c=>{
    if(c.dataset.ok) return;
    // descobre qual desafio é pelo nome exibido
    const nome = (c.querySelector('b')||{}).textContent || '';
    let e = null; try{ e = todosEventos().find(x=>x.nome === nome.trim() && Date.now() < x.ini); }catch(err){}
    if(!e) return;
    c.dataset.ok = '1'; c.classList.add('evf-toque'); c.setAttribute('role','button'); c.setAttribute('tabindex','0');
    c.setAttribute('aria-label', `Ver detalhes do desafio ${e.nome}, que ainda não começou`);
    c.onclick = ()=>evFuturoDetalhe(e.key);
    c.addEventListener('keydown', ev=>{ if(ev.key==='Enter' || ev.key===' '){ ev.preventDefault(); evFuturoDetalhe(e.key); } });
    if(!c.querySelector('.evf-seta')){ const s = document.createElement('span'); s.className = 'evf-seta'; s.textContent = 'Ver detalhes ›'; c.appendChild(s); }
  });
}});
Object.assign(window, { evFuturoDetalhe, histPaginasCompactas });

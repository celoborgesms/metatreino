
// =====================================================================
// 31. Beta 20 — Personalizar início + versão para computador
// =====================================================================

// ---------- Personalizar início ----------
// Cada bloco pode ser escondido. Os essenciais ficam sempre: treino de hoje, avisos
// (treinos pendentes, férias, recado do treinador, aniversário…), mural e aviso de saúde.
// Implementado só com CSS (uma <style> gerada): sobrevive a qualquer redesenho da tela.
const INICIO_BLOCOS = [
  { k:'atividade',   nome:'Atividade da semana', desc:'anéis de treinos, séries e metas', sel:['#home-quick'] },
  { k:'semana',      nome:'Semana',              desc:'os 7 dias com o status de cada treino', sel:['#scr-home .week'] },
  { k:'peso',        nome:'Peso',                grupo:'ind', sel:['#home-metrics .met[onclick*="add-weight"]'] },
  { k:'alimentacao', nome:'Alimentação',         grupo:'ind', sel:['#home-metrics .met-nutri', '#home-metrics .met[onclick*="openNutri"]'] },
  { k:'agua',        nome:'Água',                grupo:'ind', sel:['#home-metrics .met[onclick*="openAgua"]'] },
  { k:'conquistas',  nome:'Conquistas',          grupo:'ind', sel:['#home-metrics .met[onclick*="openTrophies"]', '#home-trofeus'] },
  { k:'plano',       nome:'Fase do plano',       desc:'semana do ciclo e fase atual', sel:['#scr-home .plan-card'] },
  { k:'sugestao',    nome:'Sugestão inteligente', desc:'dica do dia e plano de retomada', sel:['#home-smart'] },
  { k:'desafio',     nome:'Desafio do mês',      sel:['#card-monthly'] },
  { k:'evento',      nome:'Desafio temático',    desc:'quando houver um ativo', sel:['#home-event'] },
  { k:'treinos',     nome:'Seus treinos',        desc:'lista do plano (também na aba Treinos)', sel:['#scr-home .wrap > .section-head', '#your-list', '#home-tr-resumo'] },
  { k:'calistenia',  nome:'Calistenia',          desc:'nível e progressões, se você usa', sel:['#home-cali'] },
  { k:'frase',       nome:'Frase do dia',        sel:['#scr-home .quote'] },
  // 'ajuda' saiu na Beta 25: ajuda, FAQ, privacidade e termos agora ficam no Perfil
  { k:'acesso',      nome:'Aviso de acesso',     desc:'volta sozinho quando faltar 7 dias ou menos', sel:['#card-access-info.ac-ok'] }
];
const INICIO_ESSENCIAL = ['sugestao','desafio','evento','treinos','frase','acesso'];

function inicioOcultos(){
  if(!state) return [];
  // quem ligou o "Início enxuto" da Beta 19 continua com a mesma tela
  if(state.inicioEnxuto && !Array.isArray(state.inicioOcultos)){ state.inicioOcultos = INICIO_ESSENCIAL.slice(); delete state.inicioEnxuto; }
  if(!Array.isArray(state.inicioOcultos)) return [];
  return state.inicioOcultos.filter(k=>INICIO_BLOCOS.some(b=>b.k===k));
}
function aplicaInicio(){
  const oc = inicioOcultos();
  let st = document.getElementById('inicio-ocultos-css');
  if(!st){ st = document.createElement('style'); st.id = 'inicio-ocultos-css'; document.head.appendChild(st); }
  const sels = INICIO_BLOCOS.filter(b=>oc.includes(b.k)).flatMap(b=>b.sel);
  st.textContent = sels.length ? sels.join(',\n') + '{display:none!important}' : '';
  try{ const c = $('card-access-info'); if(c) c.classList.toggle('ac-ok', accessDaysLeft() > 7); }catch(e){}
  // indicadores: com número ímpar visível, o último ocupa a linha inteira; sem nenhum, some o bloco
  try{
    const m = $('home-metrics');
    if(m){
      const tiles = [...m.children]; tiles.forEach(t=>t.classList.remove('met-full'));
      const vis = tiles.filter(t=>getComputedStyle(t).display !== 'none');
      if(vis.length % 2 === 1 && vis.length > 1) vis[vis.length-1].classList.add('met-full');
      m.classList.toggle('met-vazio', tiles.length > 0 && !vis.length);
    }
  }catch(e){}
  // rodapé da Home: atalho discreto para personalizar
  try{
    const wrap = document.querySelector('#scr-home .wrap');
    if(wrap){
      let a = $('home-personalizar');
      if(!a){ a = document.createElement('div'); a.id = 'home-personalizar'; wrap.appendChild(a); }
      a.innerHTML = `<a href="#" onclick="openPersonalizarInicio();return false">⚙️ Personalizar início</a>${oc.length ? ` · ${oc.length} ${oc.length===1?'bloco oculto':'blocos ocultos'}` : ''}`;
    }
  }catch(e){}
  const v = $('inicio-val'); if(v) v.textContent = oc.length ? `${oc.length} ${oc.length===1?'oculto':'ocultos'} ›` : 'completo ›';
}
function openPersonalizarInicio(){
  const oc = inicioOcultos();
  const linha = b=>`<label class="pi-row"><span class="pi-txt"><b>${b.nome}</b>${b.desc?`<small>${b.desc}</small>`:''}</span>
      <input type="checkbox" class="pi-sw" data-k="${b.k}" ${oc.includes(b.k)?'':'checked'} onchange="piAlterar(this)"></label>`;
  const princ = INICIO_BLOCOS.filter(b=>b.grupo!=='ind'), ind = INICIO_BLOCOS.filter(b=>b.grupo==='ind');
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `<h3>🏠 Personalizar início</h3>
    <p class="mt-muted" style="margin:0 0 10px;font-size:12.5px;line-height:1.5">Escolha o que aparece na tela inicial. Vale na hora e é salvo na sua conta (aparece igual em outro aparelho).</p>
    <div class="pi-presets">
      <button type="button" onclick="piPreset('completo')">Tudo</button>
      <button type="button" onclick="piPreset('essencial')">Só o essencial</button>
    </div>
    <div class="pi-fixos">Sempre aparecem: <b>treino de hoje</b>, avisos importantes (treinos pendentes, férias, recado do treinador), mural e aviso de saúde.</div>
    <div class="arq-sub">Blocos</div>
    <div class="card pi-lista">${princ.map(linha).join('')}</div>
    <div class="arq-sub">Indicadores</div>
    <div class="card pi-lista">${ind.map(linha).join('')}</div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal();goTab('home')">Pronto</button>`;
  $('modal-back').classList.add('on');
}
function piAlterar(el){
  const k = el.dataset.k; let oc = inicioOcultos();
  oc = el.checked ? oc.filter(x=>x!==k) : [...new Set([...oc, k])];
  state.inicioOcultos = oc; saveData(); aplicaInicio();
}
function piPreset(p){
  state.inicioOcultos = p === 'essencial' ? INICIO_ESSENCIAL.slice() : [];
  saveData(); aplicaInicio();
  document.querySelectorAll('.pi-sw').forEach(i=>{ i.checked = !state.inicioOcultos.includes(i.dataset.k); });
  toast(p === 'essencial' ? '🏠 Só o essencial na tela inicial' : '🏠 Tela inicial completa');
}
// compatibilidade com a Beta 19 (botões antigos)
function toggleInicioEnxuto(){ openPersonalizarInicio(); }

mtGancho('renderHome', { depois(){ try{ aplicaInicio(); mtDeskOrdenaHome(); }catch(e){ console.log('início', e); } }});
mtGancho('renderHomeMetrics', { depois(){ try{ aplicaInicio(); }catch(e){} }});
mtGancho('renderProfile', { depois(){
  try{ aplicaInicio(); const v = $('pf-dados-val'); if(v){ const pct = Math.round(arqTamanhoDoc()/DOC_LIMITE*100); v.textContent = pct + '% usado ›'; } }catch(e){}
}});

// ---------- Versão para computador ----------
// Só em tela larga com mouse (computador/notebook). Celular e tablet não mudam.
// Mesmo app, mesmos dados: só a disposição muda (menu lateral, colunas, gráficos maiores).
const MT_DESK_MQ = '(min-width: 1024px) and (hover: hover) and (pointer: fine)';
function mtDesk(){ return document.documentElement.classList.contains('mt-desk'); }
function mtDeskAplica(){
  let on = false; try{ on = window.matchMedia(MT_DESK_MQ).matches; }catch(e){}
  document.documentElement.classList.toggle('mt-desk', on);
  if(on) try{ mtDeskOrdenaHome(); }catch(e){}
}
// No celular a Home ordena os blocos com "order" do CSS (flex). No computador ela vira
// colunas, que seguem a ordem do HTML — então alinhamos a ordem do HTML à mesma ordem.
// (Mexe só na sequência dos irmãos; os blocos continuam no mesmo lugar da árvore.)
function mtDeskOrdenaHome(){
  if(!mtDesk()) return;
  const wrap = document.querySelector('#scr-home .wrap'); if(!wrap) return;
  const kids = [...wrap.children];
  const ord = kids.map((el, i)=>({ el, i, o: parseInt(getComputedStyle(el).order, 10) || 0 }));
  const sorted = ord.slice().sort((a,b)=>(a.o - b.o) || (a.i - b.i));
  if(sorted.every((x, i)=>x.el === kids[i])) return;
  sorted.forEach(x=>wrap.appendChild(x.el));
}
try{
  const mq = window.matchMedia(MT_DESK_MQ);
  if(mq.addEventListener) mq.addEventListener('change', mtDeskAplica); else if(mq.addListener) mq.addListener(mtDeskAplica);
}catch(e){}
mtDeskAplica();

Object.assign(window, { openPersonalizarInicio, piAlterar, piPreset, aplicaInicio, toggleInicioEnxuto, mtDeskAplica, mtDeskOrdenaHome });

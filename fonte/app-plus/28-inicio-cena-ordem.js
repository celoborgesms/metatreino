
// =====================================================================
// 43. Beta 29 — Desenho do Início que acompanha o dia + ordem dos blocos do Início
// =====================================================================

// ---------- 1. Cena do Início ----------
// Beta 36: a cena virou uma paisagem em camadas numa "janela" à direita da saudação (a foto do perfil
// subiu para a linha do METATREINO, então nada mais cobre o sol, a lua ou as nuvens).
//   horário: amanhecer (5h–9h) · dia · fim de tarde (17h–19h) · noite (lua e estrelas)
//   clima (só com a localização liberada, com os mesmos dados da linha de clima, sem buscar nada a mais):
//   nublado, chuva, garoa, tempestade, névoa ou neve. Sem dados de clima: só o horário, nunca um clima inventado.
//   datas: dia da prova, véspera da prova, aniversário do aluno, Ano-Novo e Natal (nessa ordem).
// Camadas: céu (sol/lua/estrelas) → serra ao fundo → montanha da meta com a bandeira → trilha → clima na frente.
// Tudo é SVG parado: não gasta bateria e some com "Fundo decorativo". Coordenadas: 390 × 100, desenho à direita.
const CENA_VB = '0 0 390 100';
const CENA = {
  serraFundo: `<path class="c-serra1" d="M150 100V86c26-6 48-4 72-12s40-16 64-14 36 10 56 6 32-10 48-8v42z"/>`,
  montanha: `<path class="c-mont" d="M236 100l46-36 14 10 40-44 54 56v14z"/><path class="c-neve" d="M326 41l10-11 10 11-5-2-5 4-5-4z"/>`,
  frente: `<path class="c-frente" d="M196 100c22-8 44-9 66-6s46 3 70-4 40-7 58-3v13z"/>`,
  bandeira: `<path class="c-ac" d="M336 30V10" stroke-width="2"/><path class="c-acf" d="M336 10h17l-5 5 5 5h-17z"/>`,
  trilha: `<path class="c-ac" d="M286 100c10-6 18-12 24-20s12-16 18-24 6-14 8-24" stroke-width="1.8" stroke-dasharray="1.5 6" stroke-opacity=".75"/>`,
  sol: (x, y, r)=>`<circle class="c-halo" cx="${x}" cy="${y}" r="${r*1.9}"/><circle class="c-astro" cx="${x}" cy="${y}" r="${r}"/>`
    + `<path class="c-raio" d="${[0,45,90,135,180,225,270,315].map(g=>{ const a = g*Math.PI/180, r1 = r+5, r2 = r+9; return `M${(x+Math.cos(a)*r1).toFixed(1)} ${(y+Math.sin(a)*r1).toFixed(1)}L${(x+Math.cos(a)*r2).toFixed(1)} ${(y+Math.sin(a)*r2).toFixed(1)}`; }).join('')}"/>`,
  // sol no horizonte (amanhecer e fim de tarde): só a metade de cima, com o brilho espalhado na linha do horizonte
  solBaixo: (x, y, r)=>`<ellipse class="c-halo" cx="${x}" cy="${y}" rx="${r*3.2}" ry="${r*1.5}"/><path class="c-astro" d="M${x-r} ${y}a${r} ${r} 0 0 1 ${r*2} 0z"/>`
    + `<path class="c-raio" d="M${x} ${y-r-5}v-5M${x-r-3} ${y-r+3}l-4-4M${x+r+3} ${y-r+3}l4-4M${x-r-6} ${y-1}h-5M${x+r+6} ${y-1}h5"/><path class="c-linha" d="M${x-r*2.4} ${y}h${r*4.8}" stroke-opacity=".35"/>`,
  lua: (x, y)=>`<circle class="c-halo" cx="${x}" cy="${y}" r="20"/><path class="c-astro" d="M${x+3} ${y-12}a12.5 12.5 0 1 0 9.5 17 10 10 0 0 1-9.5-17z"/>`,
  estrela: (x, y, s)=>`<path class="c-estrela" d="M${x} ${y-s}Q${x} ${y} ${x+s} ${y}Q${x} ${y} ${x} ${y+s}Q${x} ${y} ${x-s} ${y}Q${x} ${y} ${x} ${y-s}z"/>`,
  nuvem: (x, y, k)=>{ k = k || 1; const f = n=>+(n*k).toFixed(1);
    return `<path class="c-nuvem" d="M${x-f(26)} ${y+f(10)}h${f(50)}a${f(11)} ${f(11)} 0 0 0 0-${f(22)}a${f(15)} ${f(15)} 0 0 0-${f(28)}-${f(5)}a${f(11)} ${f(11)} 0 0 0-${f(22)} ${f(27)}z"/>`; },
  chuva: (x, y)=>`<path class="c-chuva" d="M${x-14} ${y+16}l-3 9M${x-4} ${y+16}l-3 9M${x+6} ${y+16}l-3 9M${x+16} ${y+16}l-3 9M${x-9} ${y+29}l-2 6M${x+1} ${y+29}l-2 6M${x+11} ${y+29}l-2 6"/>`,
  garoa: (x, y)=>`<path class="c-chuva" d="M${x-12} ${y+16}v3M${x-2} ${y+18}v3M${x+8} ${y+16}v3M${x-7} ${y+26}v3M${x+3} ${y+28}v3M${x+13} ${y+25}v3"/>`,
  raio: (x, y)=>`<path class="c-acf" d="M${x+3} ${y+13}l-9 13h7l-4 12 11-15h-7l4-10z"/>`,
  neve: (x, y)=>`<g class="c-floco">${[[-12,18],[0,23],[12,18],[-6,31],[7,33]].map(([a,b])=>`<circle cx="${x+a}" cy="${y+b}" r="1.8"/>`).join('')}</g>`,
  nevoa: `<path class="c-nevoa" d="M232 70c16-4 28 4 44 0s28-4 44 0 28 4 44 0 20-3 26-2M216 82c16-4 28 4 44 0s28-4 44 0 28 4 44 0 28-4 42-2M244 94c16-4 28 4 44 0s28-4 44 0 28 4 44 0"/>`,
  // datas
  chegada: `<path class="c-linha" d="M276 100V34M366 100V34" stroke-width="2"/><rect class="c-fill" x="276" y="22" width="90" height="16" rx="3"/>
    <path class="c-acf" d="M282 26h8v4h-8zM298 26h8v4h-8zM314 26h8v4h-8zM330 26h8v4h-8zM346 26h8v4h-8zM290 30h8v4h-8zM306 30h8v4h-8zM322 30h8v4h-8zM338 30h8v4h-8zM354 30h8v4h-8z"/>`,
  cronometro: `<circle class="c-fill" cx="296" cy="42" r="18"/><path class="c-linha" d="M290 20h12M296 20v4M309 29l4-4"/><path class="c-ac" d="M296 42V31M296 42l7 5" stroke-width="2"/>`,
  baloes: `<path class="c-linha" d="M286 44c4 10 12 16 22 22M308 36v30M330 44c-4 10-10 16-22 22" stroke-opacity=".6"/>
    <ellipse class="c-fill" cx="286" cy="30" rx="10" ry="13"/><ellipse class="c-acf" cx="308" cy="22" rx="11" ry="14"/><ellipse class="c-fill" cx="330" cy="30" rx="10" ry="13"/>
    <g class="c-floco"><circle cx="262" cy="18" r="1.8"/><circle cx="354" cy="14" r="1.8"/><circle cx="372" cy="40" r="1.8"/><circle cx="252" cy="44" r="1.8"/></g>`,
  fogos: (x, y, r)=>`<path class="c-ac" stroke-width="2" d="${[0,45,90,135,180,225,270,315].map(g=>{ const a = g*Math.PI/180; return `M${(x+Math.cos(a)*r*0.45).toFixed(1)} ${(y+Math.sin(a)*r*0.45).toFixed(1)}L${(x+Math.cos(a)*r).toFixed(1)} ${(y+Math.sin(a)*r).toFixed(1)}`; }).join('')}"/>`,
  natal: `<path class="c-fill" d="M268 100l12-20h-6l10-16h-5l9-15 9 15h-5l10 16h-6l12 20z"/><path class="c-acf" d="M287 36l2 4.4 4.8.6-3.5 3.3.9 4.7-4.2-2.3-4.2 2.3.9-4.7-3.5-3.3 4.8-.6z"/>
    <g class="c-floco"><circle cx="280" cy="76" r="2"/><circle cx="292" cy="68" r="2"/><circle cx="296" cy="88" r="2"/></g>`
};
function _cenaData(){
  const d = new Date(), m = d.getMonth()+1, dia = d.getDate();
  try{
    const rd = state.modules && state.modules.run && state.modules.run.setup && state.modules.run.setup.raceDate;
    if(rd){
      const prova = new Date(rd + 'T00:00:00'); const hoje = new Date(); hoje.setHours(0,0,0,0);
      const dif = Math.round((prova - hoje)/86400000);
      if(dif === 0) return 'prova';
      if(dif === 1) return 'vespera';
    }
  }catch(e){}
  try{ if(typeof isBirthday==='function' && isBirthday()) return 'aniversario'; }catch(e){}
  if((m===12 && dia===31) || (m===1 && dia===1)) return 'anonovo';
  if(m===12 && (dia===24 || dia===25)) return 'natal';
  return null;
}
function _cenaHora(){ const h = new Date().getHours(); return h>=5 && h<9 ? 'amanhecer' : h>=9 && h<17 ? 'dia' : h>=17 && h<19 ? 'tarde' : 'noite'; }
function _cenaClima(){
  const w = (typeof weatherData!=='undefined') ? weatherData : null;
  if(!w || w.code==null || !w.at || Date.now() - w.at > 3*3600000) return null;
  const c = w.code;
  if(c>=95) return 'tempestade'; if((c>=61&&c<=67)||(c>=80&&c<=82)) return 'chuva'; if(c>=51&&c<=57) return 'garoa';
  if(c>=71&&c<=77) return 'neve'; if(c===45||c===48) return 'nevoa'; if(c>=2&&c<=3) return 'nublado';
  return 'limpo';
}
function _cenaSvg(corpo, k){ return `<svg viewBox="${CENA_VB}" preserveAspectRatio="xMaxYMax meet" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" data-cena="${k}">${corpo}</svg>`; }
function cenaInicio(){
  const hora = _cenaHora();
  const noite = hora === 'noite';
  const estrelas = CENA.estrela(262, 14, 3) + CENA.estrela(318, 8, 2.2) + CENA.estrela(372, 22, 2.6) + CENA.estrela(252, 6, 2);
  const paisagem = (comBandeira)=>CENA.serraFundo + CENA.montanha + (comBandeira ? CENA.bandeira : '') + CENA.trilha + CENA.frente;
  const data = _cenaData();
  if(data){
    const ceuData = noite ? estrelas : '';
    const corpo = {
      prova: ceuData + CENA.serraFundo + CENA.chegada + CENA.frente,
      vespera: ceuData + paisagem(true) + CENA.cronometro,
      aniversario: ceuData + paisagem(true) + CENA.baloes,
      anonovo: estrelas + CENA.fogos(272, 24, 13) + CENA.fogos(306, 12, 8) + CENA.fogos(372, 38, 10) + paisagem(true),
      natal: (noite ? estrelas : '') + CENA.serraFundo + CENA.montanha + CENA.bandeira + CENA.natal + CENA.frente
    }[data];
    return { k:'data-'+data, svg: corpo };
  }
  const clima = _cenaClima();
  let ceu = '';
  if(hora === 'amanhecer') ceu = CENA.solBaixo(296, 78, 11);
  else if(hora === 'dia') ceu = CENA.sol(290, 30, 11);
  else if(hora === 'tarde') ceu = CENA.solBaixo(292, 80, 10);
  else ceu = CENA.lua(292, 30) + estrelas;
  // nuvem na frente do astro (dá profundidade); chuva forte esconde o sol e a lua
  const nx = hora==='tarde' || hora==='amanhecer' ? 296 : 310, ny = hora==='tarde' || hora==='amanhecer' ? 46 : 38;
  let tempo = '';
  if(clima && clima !== 'limpo'){
    if(clima === 'nevoa') tempo = CENA.nevoa;
    else {
      tempo = CENA.nuvem(nx, ny);
      if(clima === 'nublado') tempo = CENA.nuvem(nx + 44, ny + 10, .7) + tempo;
      if(clima === 'chuva') tempo += CENA.chuva(nx, ny);
      if(clima === 'garoa') tempo += CENA.garoa(nx, ny);
      if(clima === 'tempestade') tempo += CENA.chuva(nx, ny) + CENA.raio(nx, ny);
      if(clima === 'neve') tempo += CENA.neve(nx, ny);
      if(clima === 'chuva' || clima === 'tempestade'){ if(hora === 'dia') ceu = ''; if(noite) ceu = estrelas; tempo = CENA.nuvem(nx + 42, ny + 6, .75) + tempo; }
    }
  }
  return { k:`${hora}-${clima||'semclima'}`, svg: ceu + paisagem(true) + tempo };
}
const _updateDecoB29 = window.updateDeco;
window.updateDeco = function(tab){
  const el = document.getElementById('app-deco');
  // Com a capa do mural ligada, a capa é a imagem do topo: a cena do céu não é desenhada (ficaria escondida atrás dela)
  const capaLigada = ()=>{ const h = document.getElementById('home-hero'); return !!(h && !h.classList.contains('hidden')); };
  const naHome = ()=>{ const t = document.querySelector('.screen.active'); return !!(t && t.id === 'scr-home'); };
  if(!naHome()){ if(el) delete el.dataset.cena; return _updateDecoB29.apply(this, arguments); }
  tab = 'home';
  if(tab === 'home' && el && decoEnabled() && capaLigada()){ document.body.classList.remove('no-deco'); el.classList.add('deco36'); el.innerHTML = ''; el.dataset.k = 'sem'; delete el.dataset.cena; return; }
  if(tab === 'home' && el && decoEnabled()){
    document.body.classList.remove('no-deco');
    el.classList.add('deco36');
    const c = cenaInicio();
    if(el.dataset.k !== 'inicio' || el.dataset.cena !== c.k || !el.innerHTML){
      el.dataset.k = 'inicio'; el.dataset.cena = c.k;
      el.innerHTML = _cenaSvg(c.svg, c.k);
    }
    try{ decoPosiciona(); requestAnimationFrame(()=>{ decoPosiciona(); setTimeout(decoPosiciona, 200); }); }catch(e){}
    return;
  }
  if(el) delete el.dataset.cena;
  return _updateDecoB29.apply(this, arguments);
};
// o clima chega depois (internet) e a hora passa: confere de vez em quando, só redesenha se mudou
setInterval(()=>{ try{ if(state && state.ui && (state.ui.tab||'home')==='home' && document.visibilityState==='visible'){ updateDeco('home'); climaChip(); } }catch(e){} }, 60000);

// ---------- 2. Clima sem repetir ----------
// A temperatura sai da frase e vira um selo discreto no topo (ao lado do METATREINO),
// com o ícone do tempo de agora. A frase fica só com a dica ("tempo perfeito para treinar").
// Com a capa de foto do mural (sem a linha do METATREINO), tudo continua como antes.
const CLIMA_ICO = {
  sol:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>',
  lua:'<path d="M15.5 3.5a8.5 8.5 0 1 0 5 12.3 6.8 6.8 0 0 1-5-12.3z"/>',
  nuvem:'<path d="M7 18h10a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.7 1.3A3.4 3.4 0 0 0 7 18z"/>',
  chuva:'<path d="M7 14h10a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.7 1.3A3.4 3.4 0 0 0 7 14z"/><path d="M8.5 17l-1 3M12.5 17l-1 3M16.5 17l-1 3"/>',
  raio:'<path d="M7 14h10a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.7 1.3A3.4 3.4 0 0 0 7 14z"/><path d="M12.5 15l-2.5 4h3l-2 3"/>',
  nevoa:'<path d="M4 9h16M3 13h18M5 17h14"/>'
};
function _climaSeloVisivel(){
  const capa = (typeof coachMural!=='undefined') && coachMural && coachMural.capa && (coachMural.capaFoto || coachMural.foto);
  const br = $('home-brand-row');
  return !capa && br && getComputedStyle(br).display !== 'none';
}
function climaChip(){
  const br = $('home-brand-row'); if(!br) return;
  let chip = $('home-clima');
  const w = (typeof weatherData!=='undefined') ? weatherData : null;
  if(!w || w.temp == null || !_climaSeloVisivel()){ if(chip) chip.remove(); return; }
  const c = _cenaClima() || 'limpo', noite = _cenaHora() === 'noite';
  const ico = c==='tempestade' ? 'raio' : (c==='chuva'||c==='garoa') ? 'chuva' : c==='nevoa' ? 'nevoa' : c==='nublado' ? 'nuvem' : noite ? 'lua' : 'sol';
  if(!chip){ chip = document.createElement('div'); chip.id = 'home-clima'; br.appendChild(chip); }
  const desc = (typeof wmoDesc==='function') ? wmoDesc(w.code) : '';
  chip.setAttribute('aria-label', `Agora: ${Math.round(w.temp)} graus, ${desc}`);
  chip.title = `${Math.round(w.temp)}°C, ${desc}`;
  const curto = { tempestade:'Tempestade', chuva:'Chuva', garoa:'Garoa', neve:'Neve', nevoa:'Névoa', nublado:'Nublado' }[c] || (noite ? 'Céu limpo' : 'Ensolarado');
  chip.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CLIMA_ICO[ico]}</svg><b>${Math.round(w.temp)}°</b><span>${curto}</span>`;
  climaChipCabe();
}
const _weatherHomeLineB29 = window.weatherHomeLine;
window.weatherHomeLine = function(){
  const l = _weatherHomeLineB29.apply(this, arguments);
  if(!l || !_climaSeloVisivel()) return l;
  // "🌡️ 23°C, parcialmente nublado · tempo perfeito para treinar 💪" → "Tempo perfeito para treinar 💪"
  const dica = String(l).replace(/^🌡️\s*-?\d+°C,\s*[^·]*·\s*/, '');
  return dica ? dica.charAt(0).toUpperCase() + dica.slice(1) : l;
};
// Beta 36: o chip do clima nunca encosta no nome do app. Se a descrição ("Tempestade", "Céu limpo"…)
// não couber com folga, fica só o ícone e a temperatura (a descrição continua no toque longo/leitor de tela).
function climaChipCabe(){
  const br = $('home-brand-row'), chip = $('home-clima'); if(!br || !chip) return;
  chip.classList.remove('so-temp');
  const nome = [...br.children].find(e=>!e.classList.contains('brand-logo') && !e.classList.contains('avatar') && e.id!=='home-clima'); if(!nome) return;
  const r = document.createRange(); r.selectNodeContents(nome);
  const fim = Math.max(...[...r.getClientRects()].map(x=>x.right));
  if(chip.getBoundingClientRect().left - fim < 14) chip.classList.add('so-temp');
}
window.addEventListener('resize', ()=>{ try{ climaChipCabe(); }catch(e){} }, { passive:true });
// Beta 36: a foto do perfil sobe para a linha do METATREINO (à direita, depois do clima). Assim a janela
// ao lado da saudação fica livre para o desenho do céu. Tocar na foto abre o Perfil.
function inicioAvatarNoTopo(){
  const br = $('home-brand-row'), av = $('home-avatar'); if(!br || !av) return;
  if(av.parentElement !== br) br.appendChild(av);
  if(!av.dataset.toque){ av.dataset.toque = '1'; av.setAttribute('role', 'button'); av.setAttribute('tabindex', '0'); av.setAttribute('aria-label', 'Abrir meu perfil'); av.addEventListener('click', ()=>goTab('profile')); }
}
mtGancho('renderHome', { depois(){ try{ inicioAvatarNoTopo(); climaChip(); if(state.ui && state.ui.tab === 'home') updateDeco('home'); }catch(e){} }});

// ---------- 3. Ordem dos blocos do Início ----------
// Em "Personalizar início" cada bloco ganha uma alça (⠿) para arrastar para cima ou para baixo.
// Os avisos importantes (treino de hoje, recado do treinador, férias, aniversário…) continuam
// fixos no lugar deles. "Voltar ao padrão" desfaz ordem e blocos ocultos.
// Funciona só com CSS "order" (o HTML não muda), então sobrevive a qualquer redesenho.
const INICIO_ORDEM_PADRAO = ['sugestao','calistenia','evento','atividade','semana','indicadores','desafio','plano','treinos','frase','acesso'];
const INICIO_MOVEIS = {
  sugestao:['#home-smart'], calistenia:['#home-cali'], evento:['#home-event'], atividade:['#home-quick'], semana:['.week'],
  indicadores:['#home-metrics'], desafio:['#card-monthly'], plano:['.plan-card'], treinos:['.section-head','#your-list','#home-tr-resumo'],
  frase:['.quote'], acesso:['#card-access-info']
};
// posições originais desses blocos (as mesmas da tela padrão): os fixos ficam entre elas
const INICIO_SLOTS = [11,22,23,30,32,34,40,42,44,60,80];
const IND_PADRAO = INICIO_BLOCOS.filter(b=>b.grupo==='ind').map(b=>b.k);
function inicioOrdem(){
  const o = Array.isArray(state.inicioOrdem) ? state.inicioOrdem.filter(k=>INICIO_MOVEIS[k]) : [];
  INICIO_ORDEM_PADRAO.forEach(k=>{ if(!o.includes(k)) o.push(k); });
  return o;
}
function inicioOrdemInd(){
  const o = Array.isArray(state.inicioOrdemInd) ? state.inicioOrdemInd.filter(k=>IND_PADRAO.includes(k)) : [];
  IND_PADRAO.forEach(k=>{ if(!o.includes(k)) o.push(k); });
  return o;
}
function inicioAplicaOrdem(){
  let st = document.getElementById('inicio-ordem-css');
  if(!st){ st = document.createElement('style'); st.id = 'inicio-ordem-css'; document.head.appendChild(st); }
  const regras = [];
  if(Array.isArray(state.inicioOrdem) && state.inicioOrdem.length){
    inicioOrdem().forEach((k, i)=>{ regras.push(INICIO_MOVEIS[k].map(s=>'#scr-home .wrap > ' + s).join(',') + `{order:${INICIO_SLOTS[i]}!important}`); });
  }
  if(Array.isArray(state.inicioOrdemInd) && state.inicioOrdemInd.length){
    regras.push('#home-metrics > *{order:50}');
    inicioOrdemInd().forEach((k, i)=>{ const b = INICIO_BLOCOS.find(x=>x.k===k); if(b) regras.push(b.sel.filter(s=>s.startsWith('#home-metrics')).join(',') + `{order:${i+1}!important}`); });
  }
  st.textContent = regras.join('\n');
  // indicador que fica sozinho na última linha ocupa a largura toda (agora pela ordem que aparece)
  try{
    const m = $('home-metrics');
    if(m){
      const tiles = [...m.children]; tiles.forEach(t=>t.classList.remove('met-full'));
      const vis = tiles.filter(t=>getComputedStyle(t).display !== 'none').map((t,i)=>({t, o:parseInt(getComputedStyle(t).order,10)||0, i})).sort((a,b)=>(a.o-b.o)||(a.i-b.i)).map(x=>x.t);
      if(vis.length % 2 === 1 && vis.length > 1) vis[vis.length-1].classList.add('met-full');
    }
  }catch(e){}
  try{ mtDeskOrdenaHome(); }catch(e){}
}
mtGancho('aplicaInicio', { depois(){ try{ inicioAplicaOrdem(); }catch(e){ console.log('ordem do início', e); } }});

// janela "Personalizar início": alças de arrastar + "Voltar ao padrão"
function _piSalvaOrdem(lista){
  const ks = [...lista.querySelectorAll('[data-ordem]')].map(r=>r.dataset.ordem);
  if(lista.dataset.grupo === 'ind') state.inicioOrdemInd = ks; else state.inicioOrdem = ks;
  saveData(); aplicaInicio();
}
function _piMover(row, dir){
  const lista = row.parentElement;
  const irmao = dir < 0 ? row.previousElementSibling : row.nextElementSibling;
  if(!irmao || !irmao.dataset.ordem) return false;
  if(dir < 0) lista.insertBefore(row, irmao); else lista.insertBefore(irmao, row);
  try{ navigator.vibrate && navigator.vibrate(8); }catch(e){}
  return true;
}
function _piArrasto(lista){
  lista.querySelectorAll('.pi-alca').forEach(h=>{
    const row = h.closest('[data-ordem]');
    h.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); });
    h.addEventListener('keydown', e=>{
      if(e.key === 'ArrowUp' || e.key === 'ArrowDown'){ e.preventDefault(); if(_piMover(row, e.key==='ArrowUp'?-1:1)){ _piSalvaOrdem(lista); h.focus(); } }
    });
    h.addEventListener('contextmenu', e=>e.preventDefault());
    // Beta 31: a linha acompanha o dedo (transform), as vizinhas deslizam para o lugar,
    // e a janela rola sozinha perto das bordas. Ouvimos a janela inteira porque mover a
    // linha na lista solta a "captura" do dedo.
    h.addEventListener('pointerdown', e=>{
      e.preventDefault();
      const pid = e.pointerId, y0 = e.clientY, sc = lista.closest('.modal') || document.scrollingElement;
      let base = 0, mexeu = false, ultimoY = e.clientY, raf = 0;
      const sc0 = sc.scrollTop;
      row.classList.add('pi-arrastando'); lista.classList.add('pi-lista-arrastando');
      const desenha = ()=>{ raf = 0; row.style.transform = `translateY(${ultimoY - y0 + (sc.scrollTop - sc0) - base}px)`; };
      const desliza = (el, antes)=>{ const d = antes - el.getBoundingClientRect().top; if(!d) return; el.style.transition = 'none'; el.style.transform = `translateY(${d}px)`; requestAnimationFrame(()=>{ el.style.transition = 'transform .16s ease'; el.style.transform = ''; }); };
      const troca = dir=>{
        const viz = dir < 0 ? row.previousElementSibling : row.nextElementSibling; if(!viz || !viz.dataset.ordem) return false;
        const rAntes = row.getBoundingClientRect().top - (parseFloat((row.style.transform.match(/-?[\d.]+/)||[0])[0])||0);
        const vAntes = viz.getBoundingClientRect().top - (parseFloat(((viz.style.transform||'').match(/-?[\d.]+/)||[0])[0])||0);
        _piMover(row, dir);
        const rDepois = row.getBoundingClientRect().top - (parseFloat((row.style.transform.match(/-?[\d.]+/)||[0])[0])||0);
        base += rDepois - rAntes; mexeu = true; desliza(viz, vAntes); return true;
      };
      const mover = ev=>{
        if(ev.pointerId !== pid) return; ev.preventDefault(); ultimoY = ev.clientY;
        // rolagem automática perto das bordas da janela
        const box = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top:0, bottom:innerHeight };
        if(ev.clientY < box.top + 50) sc.scrollTop -= 8; else if(ev.clientY > box.bottom - 50) sc.scrollTop += 8;
        desenha();
        const r = row.getBoundingClientRect(), meio = r.top + r.height/2;
        const prev = row.previousElementSibling, next = row.nextElementSibling;
        if(prev && prev.dataset.ordem){ const p = prev.getBoundingClientRect(); if(meio < p.top + p.height/2){ troca(-1); desenha(); return; } }
        if(next && next.dataset.ordem){ const n = next.getBoundingClientRect(); if(meio > n.top + n.height/2){ troca(1); desenha(); } }
      };
      const fim = ev=>{
        if(ev.pointerId !== pid) return;
        window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', fim); window.removeEventListener('pointercancel', fim);
        if(raf) cancelAnimationFrame(raf);
        row.style.transition = 'transform .16s ease'; row.style.transform = '';
        setTimeout(()=>{ row.style.transition = ''; row.classList.remove('pi-arrastando'); lista.classList.remove('pi-lista-arrastando'); }, 170);
        if(mexeu) _piSalvaOrdem(lista);
      };
      window.addEventListener('pointermove', mover, { passive:false }); window.addEventListener('pointerup', fim); window.addEventListener('pointercancel', fim);
    });
  });
}
const PI_ALCA = '<span class="pi-alca" role="button" tabindex="0" aria-label="Arrastar para mudar a posição (ou use as setas do teclado)"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></span>';
mtGancho('openPersonalizarInicio', { depois(){
  const mi = $('modal-inner'); if(!mi) return;
  const listas = mi.querySelectorAll('.pi-lista'); if(listas.length < 2) return;
  const [princ, ind] = listas;
  // blocos: marca cada linha, inclui "Indicadores" (o bloco inteiro) e põe na ordem salva
  princ.dataset.grupo = 'princ'; ind.dataset.grupo = 'ind';
  princ.querySelectorAll('.pi-row').forEach(r=>{ const k = r.querySelector('.pi-sw') && r.querySelector('.pi-sw').dataset.k; if(INICIO_MOVEIS[k]) r.dataset.ordem = k; });
  if(!princ.querySelector('[data-ordem="indicadores"]')){
    const r = document.createElement('div'); r.className = 'pi-row pi-fixo-sw'; r.dataset.ordem = 'indicadores';
    r.innerHTML = `<span class="pi-txt"><b>Indicadores</b><small>peso, alimentação, água e conquistas (escolha quais logo abaixo)</small></span>`;
    princ.appendChild(r);
  }
  inicioOrdem().forEach(k=>{ const r = princ.querySelector(`[data-ordem="${k}"]`); if(r) princ.appendChild(r); });
  // linhas que não se movem (ex.: Ajuda, que saiu na Beta 25) ficam no fim
  [...princ.querySelectorAll('.pi-row:not([data-ordem])')].forEach(r=>princ.appendChild(r));
  ind.querySelectorAll('.pi-row').forEach(r=>{ const k = r.querySelector('.pi-sw') && r.querySelector('.pi-sw').dataset.k; if(IND_PADRAO.includes(k)) r.dataset.ordem = k; });
  inicioOrdemInd().forEach(k=>{ const r = ind.querySelector(`[data-ordem="${k}"]`); if(r) ind.appendChild(r); });
  [princ, ind].forEach(l=>{ l.querySelectorAll('[data-ordem]').forEach(r=>{ if(!r.querySelector('.pi-alca')) r.insertAdjacentHTML('afterbegin', PI_ALCA); }); _piArrasto(l); });
  // dica + voltar ao padrão
  const sub = mi.querySelector('.arq-sub');
  if(sub && !mi.querySelector('.pi-dica-ordem')) sub.insertAdjacentHTML('beforebegin', '<div class="pi-dica-ordem">Arraste pela alça <b>⠿</b> para mudar a ordem. Os avisos importantes e o treino de hoje ficam sempre no lugar.</div>');
  if(!mi.querySelector('#pi-padrao')){
    const b = document.createElement('button'); b.id = 'pi-padrao'; b.type = 'button'; b.className = 'btn btn-ghost btn-block'; b.style.marginTop = '12px';
    b.textContent = 'Voltar ao padrão'; b.onclick = inicioVoltarPadrao;
    ind.after(b);
  }
}});
function inicioVoltarPadrao(){
  appConfirm('A tela inicial volta para a ordem original, com todos os blocos visíveis.', ()=>{
    state.inicioOrdem = null; state.inicioOrdemInd = null; state.inicioOcultos = [];
    saveData(); aplicaInicio(); openPersonalizarInicio(); toast('Tela inicial no padrão');
  }, { title:'Voltar ao padrão?', okLabel:'Voltar ao padrão' });
}

Object.assign(window, { cenaInicio, climaChip, inicioOrdem, inicioOrdemInd, inicioAplicaOrdem, inicioVoltarPadrao });

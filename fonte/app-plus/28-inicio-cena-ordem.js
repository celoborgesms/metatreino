
// =====================================================================
// 43. Beta 29 — Desenho do Início que acompanha o dia + ordem dos blocos do Início
// =====================================================================

// ---------- 1. Cena do Início ----------
// A montanha com a bandeira continua; o céu muda:
//   horário: amanhecer (5h–8h) · dia · fim de tarde (17h–18h) · noite (lua, estrelas e uma coruja)
//   clima (só se o aluno liberou a localização, que o app já usa para o clima): nuvem, chuva, garoa,
//   tempestade, névoa ou neve — com os mesmos dados da linha de clima, sem buscar nada a mais.
//   datas: dia da prova, véspera da prova, aniversário do aluno, Ano-Novo e Natal (nessa ordem).
// Tudo é um desenho em linha (SVG) parado: não gasta bateria e some com "Fundo decorativo".
const CENA_SOL = (x, y, r)=>`<circle cx="${x}" cy="${y}" r="${r}"/><path d="M${x} ${y-r-6}v-7M${x-r-4} ${y-r+2}l-5-5M${x+r+4} ${y-r+2}l5-5M${x-r-7} ${y}h-7M${x+r+7} ${y}h7" stroke-opacity=".75"/>`;
const CENA_SOL_BAIXO = (x, y, r)=>`<path d="M${x-r} ${y}a${r} ${r} 0 0 1 ${r*2} 0"/><path d="M${x} ${y-r-6}v-7M${x-r-4} ${y-r+2}l-5-5M${x+r+4} ${y-r+2}l5-5M${x-r-8} ${y-2}h-7M${x+r+8} ${y-2}h7" stroke-opacity=".7"/>`;
const CENA_LUA = (x, y)=>`<path class="dk-a" d="M${x+6} ${y-17}a18 18 0 1 0 12 24 14 14 0 0 1-12-24z" stroke-width="3"/>`;
const CENA_ESTRELA = (x, y, s)=>`<path d="M${x} ${y-s}v${s*2}M${x-s} ${y}h${s*2}" stroke-width="2"/>`;
const CENA_NUVEM = (x, y)=>`<path d="M${x-22} ${y+10}h44a11 11 0 0 0 0-22 16 16 0 0 0-30-4 12 12 0 0 0-14 26z"/>`;
const CENA = {
  montanha: `<path d="M6 168 58 104l22 22 44-72 70 114"/><path d="M110 76l14-22 14 22-8-4-6 6-6-6z" stroke-opacity=".8"/>`,
  bandeira: `<path class="dk-a" d="M124 54V18" stroke-width="3"/><path class="dk-a" d="M124 18h30l-8 8 8 8h-30" stroke-width="3"/>`,
  trilha: `<path class="dk-a" d="M34 168c22-6 40-14 52-26s20-20 30-30 12-22 6-34" stroke-width="3.2" stroke-dasharray="3 8"/>`,
  // coruja (Beta 30): num galho no canto esquerdo do céu, longe da montanha
  coruja: `<path d="M2 106c12-3 28-4 44-8" stroke-width="2.6"/>
    <path d="M17 100c-7-5-9-15-7-24 2-9 9-15 18-15s16 6 18 15c2 9 0 19-7 24z"/><path d="M13 66l-3-9 9 5M43 66l3-9-9 5"/>
    <circle class="dk-a" cx="21.5" cy="76" r="6" stroke-width="2.4"/><circle class="dk-a" cx="34.5" cy="76" r="6" stroke-width="2.4"/>
    <path d="M21.5 76h0M34.5 76h0" stroke-width="4.4"/><path d="M26 83l2 3.4 2-3.4z" stroke-width="2"/>
    <path d="M20 92q4 3 8 0q4 3 8 0" stroke-opacity=".7"/><path d="M24 100v3M32 100v3" stroke-width="2.2"/>`,
  chuva: (x, y)=>`<path d="M${x-14} ${y+18}l-4 10M${x-2} ${y+18}l-4 10M${x+10} ${y+18}l-4 10M${x-8} ${y+32}l-3 7M${x+4} ${y+32}l-3 7" stroke-opacity=".8"/>`,
  garoa: (x, y)=>`<path d="M${x-12} ${y+18}v4M${x} ${y+20}v4M${x+12} ${y+18}v4M${x-6} ${y+28}v4M${x+6} ${y+30}v4" stroke-opacity=".8"/>`,
  raio: (x, y)=>`<path class="dk-a" d="M${x+2} ${y+14}l-8 14h8l-6 14" stroke-width="3"/>`,
  neve: (x, y)=>`<path d="M${x-12} ${y+22}h0M${x} ${y+28}h0M${x+12} ${y+22}h0M${x-6} ${y+36}h0M${x+8} ${y+38}h0" stroke-width="5"/>`,
  nevoa: `<path d="M12 150c14-4 26 4 40 0s26-4 40 0 26 4 40 0 26-4 40 0" stroke-opacity=".7"/><path d="M28 160c14-4 26 4 40 0s26-4 40 0 26 4 40 0" stroke-opacity=".55"/>`,
  // datas
  // Natal (Beta 30): árvore simétrica no lado esquerdo, montanha só com o pico da bandeira
  natal: `<path d="M34 72 18 98h8L12 124h10L6 152h56L46 124h10L42 98h8z"/><path d="M29 152v10h10v-10" stroke-opacity=".85"/>
    <path class="dk-a" d="M34.0 53.0 L36.2 58.9 L42.6 59.2 L37.6 63.2 L39.3 69.3 L34.0 65.8 L28.7 69.3 L30.4 63.2 L25.4 59.2 L31.8 58.9z" stroke-width="2.4"/>
    <circle class="dk-a" cx="34" cy="92" r="2.8" stroke-width="2.4"/><circle class="dk-a" cx="26" cy="116" r="2.8" stroke-width="2.4"/><circle class="dk-a" cx="42" cy="116" r="2.8" stroke-width="2.4"/>
    <circle class="dk-a" cx="20" cy="142" r="2.8" stroke-width="2.4"/><circle class="dk-a" cx="34" cy="138" r="2.8" stroke-width="2.4"/><circle class="dk-a" cx="48" cy="142" r="2.8" stroke-width="2.4"/>`,
  montanhaPico: `<path d="M68 168 124 54l70 114"/><path d="M110 76l14-22 14 22-8-4-6 6-6-6z" stroke-opacity=".8"/>`,
  fogos: (x, y, r)=>`<path class="dk-a" d="M${x} ${y-r}v${r*0.55}M${x} ${y+r}v-${r*0.55}M${x-r} ${y}h${r*0.55}M${x+r} ${y}h-${r*0.55}M${x-r*0.7} ${y-r*0.7}l${r*0.38} ${r*0.38}M${x+r*0.7} ${y+r*0.7}l-${r*0.38}-${r*0.38}M${x+r*0.7} ${y-r*0.7}l-${r*0.38} ${r*0.38}M${x-r*0.7} ${y+r*0.7}l${r*0.38}-${r*0.38}" stroke-width="2.8"/>`,
  baloes: `<path class="dk-a" d="M124 54V40" stroke-width="3"/><ellipse cx="106" cy="18" rx="9" ry="12"/><ellipse class="dk-a" cx="126" cy="11" rx="10" ry="13" stroke-width="2.8"/><ellipse cx="146" cy="20" rx="9" ry="12"/>
    <path d="M106 30l18 10M126 24l-2 16M146 32l-22 8" stroke-opacity=".7"/><path d="M40 40h0M70 30h0M86 56h0M30 70h0M172 60h0M184 40h0" stroke-width="5"/>`,
  cronometro: `<circle cx="54" cy="54" r="22"/><path d="M50 26h8M54 26v6M72 36l5-5"/><path class="dk-a" d="M54 54V40M54 54l9 6" stroke-width="3"/>`,
  chegada: `<path d="M104 86V14M144 86V14" stroke-width="3"/><path class="dk-a" d="M104 14h40v14h-40z" stroke-width="2.6"/><path d="M114 14v14M124 14v14M134 14v14" stroke-opacity=".7"/>
    <circle cx="54" cy="56" r="16"/><path class="dk-a" d="M46 22l8 18 8-18" stroke-width="2.8"/><path class="dk-a" d="M54 48l2.6 5.4 6 .8-4.3 4.2 1 5.9-5.3-2.8-5.3 2.8 1-5.9-4.3-4.2 6-.8z" stroke-width="2.2"/>`
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
function cenaInicio(){
  const data = _cenaData();
  if(data) return { k:'data-'+data, svg: (data==='natal' ? CENA.montanhaPico : CENA.montanha) + ({
    prova: CENA.chegada + CENA.trilha,
    vespera: CENA.cronometro + CENA.bandeira + CENA.trilha,
    aniversario: CENA.baloes + CENA.trilha,
    anonovo: CENA.fogos(48, 44, 18) + CENA.fogos(82, 22, 11) + CENA.fogos(170, 30, 13) + CENA.bandeira + CENA.trilha,
    natal: CENA.natal + CENA.bandeira + '<path class="dk-a" d="M96 168c10-8 18-18 22-30s4-26 6-36" stroke-width="3.2" stroke-dasharray="3 8"/>'
  })[data] };
  const hora = _cenaHora(), clima = _cenaClima();
  let ceu = '';
  if(hora === 'amanhecer') ceu = CENA_SOL_BAIXO(36, 100, 15);
  else if(hora === 'dia') ceu = CENA_SOL(52, 50, 14);
  else if(hora === 'tarde') ceu = CENA_SOL_BAIXO(170, 76, 13) + '<path d="M150 76h40" stroke-opacity=".7"/>';
  else ceu = CENA_LUA(78, 34) + CENA_ESTRELA(30, 24, 3.5) + CENA_ESTRELA(104, 70, 2.5) + CENA_ESTRELA(170, 72, 3) + CENA_ESTRELA(54, 52, 2.5);
  const nx = hora==='tarde' ? 164 : hora==='noite' ? 84 : 66, ny = hora==='tarde' ? 60 : hora==='noite' ? 42 : 54;
  let tempo = '';
  if(clima && clima !== 'limpo'){
    if(clima === 'nevoa') tempo = CENA.nevoa;
    else {
      tempo = CENA_NUVEM(nx, ny);
      if(clima === 'chuva') tempo += CENA.chuva(nx, ny);
      if(clima === 'garoa') tempo += CENA.garoa(nx, ny);
      if(clima === 'tempestade') tempo += CENA.chuva(nx, ny) + CENA.raio(nx, ny);
      if(clima === 'neve') tempo += CENA.neve(nx, ny);
      // chuva forte: o sol some atrás da nuvem
      if(clima === 'chuva' || clima === 'tempestade'){ if(hora === 'dia' || hora === 'noite') ceu = ''; }
    }
  }
  return { k:`${hora}-${clima||'semclima'}`, svg: ceu + CENA.montanha + CENA.bandeira + CENA.trilha + (hora==='noite' ? CENA.coruja : '') + tempo };
}
const _updateDecoB29 = window.updateDeco;
window.updateDeco = function(tab){
  const el = document.getElementById('app-deco');
  if(tab === 'home' && el && decoEnabled()){
    document.body.classList.remove('no-deco');
    const c = cenaInicio();
    if(el.dataset.k !== 'inicio' || el.dataset.cena !== c.k || !el.innerHTML){
      el.dataset.k = 'inicio'; el.dataset.cena = c.k;
      el.innerHTML = `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${c.svg}</svg>`;
    }
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
}
const _weatherHomeLineB29 = window.weatherHomeLine;
window.weatherHomeLine = function(){
  const l = _weatherHomeLineB29.apply(this, arguments);
  if(!l || !_climaSeloVisivel()) return l;
  // "🌡️ 23°C, parcialmente nublado · tempo perfeito para treinar 💪" → "Tempo perfeito para treinar 💪"
  const dica = String(l).replace(/^🌡️\s*-?\d+°C,\s*[^·]*·\s*/, '');
  return dica ? dica.charAt(0).toUpperCase() + dica.slice(1) : l;
};
mtGancho('renderHome', { depois(){ try{ climaChip(); }catch(e){} }});

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

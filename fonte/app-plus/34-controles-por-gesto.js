// ---------- 34. CONTROLES POR GESTO: números, distâncias, durações, datas e horários (Beta 39) ----------
// Um componente só para o app inteiro. Tocar num campo numérico abre uma folha com uma RÉGUA horizontal:
// arrastar para o lado muda o valor, com o embalo nativo do sistema (rolagem do próprio navegador, sem
// travar) e encaixe suave no valor mais próximo. O valor aparece grande enquanto a régua anda.
//  • Datas: três réguas (dia, mês, ano). Horário: hora e minuto. Duração: h/min/s. Distância: km e metros.
//  • O teclado não abre sozinho (campo readonly + inputmode="none"). "Digitar" abre o teclado de propósito.
//  • Sem tela de toque: arrastar com o mouse (com embalo), roda do mouse, setas do teclado, PageUp/PageDown,
//    Home/End e digitar números direto com a folha aberta.
//  • Datas opcionais ganham "×" no próprio campo e "Sem data" na folha (antes não dava para apagar).
//  • O campo continua sendo o mesmo <input>: o valor é gravado nele e os eventos input/change disparam,
//    então nenhuma tela precisou mudar a forma de ler os dados.
// Campos de texto (assistente, busca, nomes, observações) não são tocados. data-teclado no input = fica de fora.

const NR_TK = 12;   // distância entre dois traços da régua (px)
const NR_MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const NR_MESES_LONGO = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const NR_OPCIONAIS = ['lift-start-date','run-start-date','run-race-date','run-race-time','ep-birth','sa-data','ef-ini','ef-fim'];
const _nrPeso = ()=> (typeof latestWeight === 'function' && latestWeight()) || (state.user && state.user.profile && state.user.profile.currentWeight) || 70;
const NR_CAMPOS = {
  'q-height':{ tit:'Altura', min:100, max:230, step:1, un:'cm', def:170 },
  'ep-height':{ tit:'Altura', min:100, max:230, step:1, un:'cm', def:170 },
  'q-weight':{ tit:'Peso atual', min:30, max:250, step:0.1, un:'kg', def:70 },
  'wt-val':{ tit:'Peso de hoje', min:30, max:250, step:0.1, un:'kg', def:_nrPeso },
  'fn-peso':{ tit:'Peso no dia da foto', min:30, max:250, step:0.1, un:'kg', def:_nrPeso },
  'ep-age':{ tit:'Idade', min:10, max:100, step:1, un:'anos', def:30 },
  'ct-flexao':{ tit:'Flexões seguidas', min:0, max:100, step:1, un:'reps', def:10 },
  'ct-barra':{ tit:'Barras seguidas', min:0, max:50, step:1, un:'reps', def:3 },
  'ct-dips':{ tit:'Paralelas seguidas', min:0, max:80, step:1, un:'reps', def:5 },
  'ct-prancha':{ tit:'Prancha', min:0, max:600, step:5, un:'s', def:30 },
  'nc-kcal':{ tit:'Calorias', min:0, max:6000, step:10, un:'kcal', def:2000 },
  'nc-p':{ tit:'Proteínas', min:0, max:600, step:1, un:'g', def:120 },
  'nc-c':{ tit:'Carboidratos', min:0, max:900, step:1, un:'g', def:200 },
  'nc-g':{ tit:'Gorduras', min:0, max:400, step:1, un:'g', def:60 },
  'ef-alvo':{ tit:'Meta de dias ativos', min:1, max:60, step:1, un:'dias', def:8 },
  'rl-km':{ tipo:'dist', tit:'Distância' }, 'he-km':{ tipo:'dist', tit:'Distância' }, 'act-km':{ tipo:'dist', tit:'Distância' },
  'rl-min':{ tipo:'dur', tit:'Tempo total', h:true }   // RC 4: he-dur e act-min viraram o grupo h:m:s (.tempo-hms) — usam o controle 'hms'
};
function _nrNum(v){ const n = parseFloat(String(v==null?'':v).replace(',','.')); return isFinite(n) ? n : null; }
function _nrFmt(v, step){ const dec = step < 1 ? (String(step).split('.')[1]||'').length : 0; return Number(v).toFixed(dec).replace('.',','); }
function _nrRotulo(el){
  const f = el.closest('.field'); const l = f && f.querySelector('label');
  const t = (el.getAttribute('aria-label') || (l && l.textContent) || '').replace(/\s*\(.*?\)\s*/g,' ').replace(/—\s*opcional/i,'').trim();
  return t || 'Valor';
}
function _nrIsoHoje(dd){ const d = new Date(); d.setHours(12,0,0,0); if(dd) d.setDate(d.getDate()+dd); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

// que tipo de controle cada campo usa (ou null = continua com teclado)
function nrConfig(el){
  if(!el || el.tagName !== 'INPUT' || el.dataset.teclado != null || el.closest('#nr-fundo')) return null;
  const id = el.id || '', tp = (el.getAttribute('type')||'text').toLowerCase();
  if(tp === 'date'){
    const hoje = _nrIsoHoje();
    let min = el.getAttribute('min'), max = el.getAttribute('max');
    if(/start-date/.test(id)){ min = min || hoje; max = max || _nrIsoHoje(365); }
    else if(id === 'run-race-date'){ min = min || hoje; max = max || _nrIsoHoje(730); }
    else if(/birth/.test(id)){ min = min || '1920-01-01'; const d = new Date(); max = `${d.getFullYear()-10}-12-31`; }
    return { tipo:'data', tit:_nrRotulo(el), min: min || _nrIsoHoje(-365*5), max: max || _nrIsoHoje(365*5), opcional: NR_OPCIONAIS.includes(id), nasc: /birth/.test(id) };
  }
  if(tp === 'time') return { tipo:'hora', tit:_nrRotulo(el), opcional: NR_OPCIONAIS.includes(id) };
  if(el.closest('.tempo-hms')) return { tipo:'hms', tit: /marca/.test(id) ? 'Tempo da prova recente' : 'Tempo total' };
  const base = NR_CAMPOS[id];
  if(base) return Object.assign({ tipo:'num' }, base, { tit: base.tit });
  if(el.classList.contains('set-in')){
    const oc = el.getAttribute('onchange') || '';
    if(/'peso'/.test(oc)) return { tipo:'num', tit:'Carga', min:0, max:400, step:0.5, un:'kg', def: _nrNum(el.placeholder) || 10 };
    if(/'reps'/.test(oc)) return { tipo:'num', tit:'Repetições', min:0, max:100, step:1, un:'reps', def: _nrNum(el.placeholder) || 10 };
    if(/'tempo'/.test(oc)) return { tipo:'dur', tit:'Tempo da série', h:false, maxMin:20 };
  }
  if(tp === 'number'){
    const min = _nrNum(el.getAttribute('min')), max = _nrNum(el.getAttribute('max')), step = _nrNum(el.getAttribute('step'));
    const mn = min != null ? min : 0;
    return { tipo:'num', tit:_nrRotulo(el), min:mn, max: max != null ? max : mn + 1000, step: step && step > 0 ? step : 1, un:'', def: _nrNum(el.placeholder) };
  }
  return null;
}

// ---- a régua ----
function nrRegua(o){
  // o: { min, max, step, valor, fmt(v), rotulo, maior, onChange(v), compacta, nome }
  const TK = o.tk || NR_TK;   // faixas curtas (mês, ano, hora) usam traços mais espaçados para os números não se encostarem
  const n = Math.max(1, Math.round((o.max - o.min)/o.step));
  const maior = o.maior || (n > 300 || o.step < 1 ? 10 : 5);
  const medio = maior % 2 === 0 ? maior/2 : 0;
  const el = document.createElement('div');
  el.className = 'nr-regua' + (o.compacta ? ' compacta' : '');
  el.tabIndex = 0; el.setAttribute('role','slider');
  el.setAttribute('aria-label', o.nome || 'Valor'); el.setAttribute('aria-valuemin', o.min); el.setAttribute('aria-valuemax', o.max);
  let rot = '';
  for(let k = 0; k <= n; k += maior) rot += `<span class="nr-r" style="left:${k*TK}px" data-k="${k}">${o.fmt(o.min + k*o.step)}</span>`;
  el.innerHTML = `${o.rotulo ? `<div class="nr-cap">${o.rotulo}</div>` : ''}<div class="nr-rolo"><div class="nr-esp"></div><div class="nr-trilho" style="width:${n*TK+2}px;--tk:${TK}px;--mj:${maior*TK}px;--md:${(medio||maior)*TK}px">${rot}</div><div class="nr-esp"></div></div><div class="nr-agulha" aria-hidden="true"></div>`;
  const rolo = el.querySelector('.nr-rolo');
  const clampK = k=>Math.max(0, Math.min(n, k));
  const valDe = k=>Math.round((o.min + k*o.step)*1e6)/1e6;
  let kAtual = clampK(Math.round(((o.valor != null ? o.valor : o.min) - o.min)/o.step));
  let raf = 0, toque = false, mouse = false, fimT = 0, ultVib = 0, inercia = 0;
  // a folha pode ter fechado enquanto a régua ainda terminava o encaixe: aí não avisa mais ninguém
  // Beta 40: régua que já saiu da folha (ex.: a do dia, refeita ao trocar o mês) não muda mais nada
  const muda = v=>{ if(NR && o.onChange && el.isConnected) o.onChange(v); };
  const aria = ()=>{ el.setAttribute('aria-valuenow', valDe(kAtual)); el.setAttribute('aria-valuetext', o.fmt(valDe(kAtual)) + (o.un ? ' '+o.un : '')); };
  const vibra = ()=>{ const t = Date.now(); if(t - ultVib > 35 && navigator.vibrate && matchMedia('(pointer:coarse)').matches){ ultVib = t; try{ navigator.vibrate(3); }catch(e){} } };
  const ler = ()=>{
    raf = 0;
    const k = clampK(Math.round(rolo.scrollLeft / TK));
    if(k !== kAtual){ kAtual = k; aria(); vibra(); muda(valDe(k)); }
  };
  const ajusta = ()=>{
    if(toque || mouse) return;
    // lê a posição de agora (o fim da rolagem pode chegar antes do quadro que atualiza o valor)
    const k = clampK(Math.round(rolo.scrollLeft / TK));
    if(k !== kAtual){ kAtual = k; aria(); muda(valDe(k)); }
    const alvo = kAtual*TK;
    if(Math.abs(rolo.scrollLeft - alvo) > 0.6) rolo.scrollTo({ left:alvo, behavior:'smooth' });
  };
  const agenda = ()=>{ clearTimeout(fimT); fimT = setTimeout(ajusta, 'onscrollend' in window ? 260 : 110); };
  rolo.addEventListener('scroll', ()=>{ if(!raf) raf = requestAnimationFrame(ler); if(!toque && !mouse) agenda(); }, { passive:true });
  rolo.addEventListener('scrollend', ()=>{ clearTimeout(fimT); ajusta(); });
  rolo.addEventListener('touchstart', ()=>{ toque = true; cancelAnimationFrame(inercia); }, { passive:true });
  const solta = ()=>{ toque = false; agenda(); };
  rolo.addEventListener('touchend', solta, { passive:true }); rolo.addEventListener('touchcancel', solta, { passive:true });
  // mouse: arrastar com embalo
  rolo.addEventListener('pointerdown', e=>{
    if(e.pointerType !== 'mouse' || e.button !== 0) return;
    e.preventDefault(); cancelAnimationFrame(inercia); mouse = true; el.classList.add('arrastando');
    const x0 = e.clientX, s0 = rolo.scrollLeft; let ux = x0, ut = performance.now(), v = 0;
    rolo.setPointerCapture(e.pointerId);
    const mv = ev=>{ rolo.scrollLeft = s0 - (ev.clientX - x0); const t = performance.now(); if(t > ut){ v = (ev.clientX - ux)/(t - ut); ux = ev.clientX; ut = t; } };
    const up = ()=>{
      rolo.removeEventListener('pointermove', mv); rolo.removeEventListener('pointerup', up); rolo.removeEventListener('pointercancel', up);
      el.classList.remove('arrastando');
      let vel = -v*16;   // px por quadro
      const passo = ()=>{ if(Math.abs(vel) < 0.4){ mouse = false; ajusta(); return; } rolo.scrollLeft += vel; vel *= 0.94; inercia = requestAnimationFrame(passo); };
      if(performance.now() - ut > 80) vel = 0;
      passo();
    };
    rolo.addEventListener('pointermove', mv); rolo.addEventListener('pointerup', up); rolo.addEventListener('pointercancel', up);
  });
  rolo.addEventListener('wheel', e=>{ e.preventDefault(); rolo.scrollLeft += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; agenda(); }, { passive:false });
  // tocar num número da régua leva até ele
  rolo.addEventListener('click', e=>{ const r = e.target.closest('.nr-r'); if(r) api.definir(valDe(+r.dataset.k), true); });
  el.addEventListener('keydown', e=>{
    const d = { ArrowRight:1, ArrowUp:1, ArrowLeft:-1, ArrowDown:-1, PageUp:maior, PageDown:-maior }[e.key];
    if(d != null){ e.preventDefault(); api.definir(valDe(clampK(kAtual + d)), true); }
    else if(e.key === 'Home'){ e.preventDefault(); api.definir(o.min, true); }
    else if(e.key === 'End'){ e.preventDefault(); api.definir(valDe(n), true); }
  });
  const api = {
    el,
    get valor(){ return valDe(kAtual); },
    definir(v, suave){
      const k = clampK(Math.round((v - o.min)/o.step));
      if(k !== kAtual){ kAtual = k; aria(); muda(valDe(k)); }
      rolo.scrollTo({ left:k*TK, behavior: suave ? 'smooth' : 'auto' });
    },
    // depois de aparecer na tela: espaços laterais = metade da largura (o traço 0 fica no meio)
    montar(){
      const w = rolo.clientWidth; rolo.querySelectorAll('.nr-esp').forEach(s=>{ s.style.width = (w/2) + 'px'; });
      rolo.scrollLeft = kAtual*TK; aria();
    }
  };
  aria();
  return api;
}

// ---- a folha ----
let NR = null;   // estado da folha aberta
function nrFolha(){
  let f = document.getElementById('nr-fundo');
  if(f) return f;
  f = document.createElement('div'); f.id = 'nr-fundo'; f.className = 'nr-fundo';
  f.innerHTML = `<div class="nr-folha" role="dialog" aria-modal="true" aria-labelledby="nr-tit">
      <div class="nr-alca" aria-hidden="true"></div>
      <div class="nr-topo"><div class="nr-tit" id="nr-tit"></div><button type="button" class="nr-x" aria-label="Fechar sem mudar" onclick="nrFechar()">×</button></div>
      <div class="nr-mostra" aria-live="polite"><span class="nr-num"></span><span class="nr-un"></span></div>
      <div class="nr-sub"></div>
      <div class="nr-reguas"></div>
      <div class="nr-dig" hidden><input class="input mono" id="nr-dig-in" autocomplete="off" data-teclado><div class="nr-dig-dica"></div></div>
      <div class="nr-acoes"><button type="button" class="btn btn-ghost nr-limpar" onclick="nrLimpar()"></button><button type="button" class="btn btn-ghost nr-bdig" onclick="nrDigitar()">Digitar</button><button type="button" class="btn btn-primary nr-ok" onclick="nrConfirmar()">Confirmar</button></div>
    </div>`;
  document.body.appendChild(f);
  f.addEventListener('click', e=>{ if(e.target === f) nrFechar(); });
  f.addEventListener('keydown', e=>{
    if(e.key === 'Escape'){ e.preventDefault(); nrFechar(); }
    else if(e.key === 'Enter' && !e.target.closest('button')){ e.preventDefault(); nrConfirmar(); }
    else if(/^[0-9]$/.test(e.key) && e.target.id !== 'nr-dig-in' && NR){ nrDigitar(e.key); e.preventDefault(); }   // computador: digitar direto
  });
  const dig = f.querySelector('#nr-dig-in'); dig.addEventListener('input', ()=>nrDigitado(true));
  return f;
}
function nrMostra(txt, un, sub){
  const f = nrFolha();
  const num = f.querySelector('.nr-num'); num.textContent = txt; num.classList.toggle('longo', String(txt).length > 9); f.querySelector('.nr-un').textContent = un || '';
  f.querySelector('.nr-sub').textContent = sub || '';
}
function _nrDiasMes(a, m){ return new Date(a, m, 0).getDate(); }
function _nrDataTxt(a, m, d){ const dt = new Date(a, m-1, d, 12); return { num:`${d} de ${NR_MESES_LONGO[m-1]} de ${a}`, sub: dt.toLocaleDateString('pt-BR', { weekday:'long' }) }; }
function _nrHms(s){ s = Math.max(0, Math.round(s)); return { h:Math.floor(s/3600), m:Math.floor(s%3600/60), s:s%60 }; }
function _nrLerDur(txt){
  const p = String(txt||'').trim().split(/[:.]/).map(x=>parseInt(x,10));
  if(!p.length || p.some(isNaN)) return null;
  if(p.length === 3) return p[0]*3600 + p[1]*60 + p[2];
  if(p.length === 2) return p[0]*60 + p[1];
  return p[0]*60;
}
function nrAbrir(el){
  const c = nrConfig(el); if(!c) return;
  const f = nrFolha(); const box = f.querySelector('.nr-reguas'); box.innerHTML = '';
  f.querySelector('.nr-dig').hidden = true; box.hidden = false;
  f.querySelector('#nr-tit').textContent = c.tit;
  const lim = f.querySelector('.nr-limpar');
  NR = { el, c, reguas:[], val:null, origem: document.activeElement };
  const add = (r)=>{ NR.reguas.push(r); box.appendChild(r.el); return r; };
  if(c.tipo === 'num'){
    const atual = _nrNum(el.value);
    const def = atual != null ? atual : (typeof c.def === 'function' ? c.def() : c.def != null ? c.def : c.min);
    NR.val = Math.max(c.min, Math.min(c.max, def));
    const up = v=>{ NR.val = v; nrMostra(_nrFmt(v, c.step), c.un); };
    add(nrRegua({ min:c.min, max:c.max, step:c.step, valor:NR.val, fmt:v=>_nrFmt(v, c.step).replace(/,0+$/,''), un:c.un, nome:c.tit, onChange:up }));
    up(NR.val);
    lim.textContent = 'Apagar'; lim.hidden = !el.value;
  } else if(c.tipo === 'dist'){
    const atual = _nrNum(el.value) || 5;
    let km = Math.floor(atual), mt = Math.round((atual - km)*100)*10;
    const up = ()=>{ NR.val = km + mt/1000; nrMostra(_nrFmt(NR.val, 0.01), 'km'); };
    add(nrRegua({ min:0, max:120, step:1, valor:km, fmt:v=>String(v), rotulo:'km', nome:'Quilômetros', compacta:true, maior:5, tk:24, onChange:v=>{ km = v; up(); } }));
    add(nrRegua({ min:0, max:990, step:10, valor:mt, fmt:v=>String(v), rotulo:'metros', nome:'Metros', compacta:true, maior:10, tk:16, onChange:v=>{ mt = v; up(); } }));
    up(); lim.textContent = 'Apagar'; lim.hidden = !el.value;
  } else if(c.tipo === 'dur' || c.tipo === 'hms'){
    let seg;
    if(c.tipo === 'hms'){ const g = el.closest('.tempo-hms'); const ins = [...g.querySelectorAll('input')]; NR.grupo = ins; seg = (+ins[0].value||0)*3600 + (+ins[1].value||0)*60 + (+ins[2].value||0); c.h = true; }
    else seg = _nrLerDur(el.value) || 0;
    let t = _nrHms(seg);
    const up = ()=>{ NR.val = t.h*3600 + t.m*60 + t.s; nrMostra(c.h && t.h ? `${t.h}h ${String(t.m).padStart(2,'0')}min ${String(t.s).padStart(2,'0')}s` : `${c.h ? t.m : t.m + t.h*60}min ${String(t.s).padStart(2,'0')}s`, ''); };
    if(c.h) add(nrRegua({ min:0, max:9, step:1, valor:t.h, fmt:v=>String(v), rotulo:'horas', nome:'Horas', compacta:true, maior:1, tk:48, onChange:v=>{ t.h = v; up(); } }));
    else { t.m += t.h*60; t.h = 0; }
    add(nrRegua({ min:0, max: c.h ? 59 : (c.maxMin||59), step:1, valor:t.m, fmt:v=>String(v), rotulo:'min', nome:'Minutos', compacta:true, maior:5, tk:20, onChange:v=>{ t.m = v; up(); } }));
    add(nrRegua({ min:0, max:59, step:1, valor:t.s, fmt:v=>String(v).padStart(2,'0'), rotulo:'seg', nome:'Segundos', compacta:true, maior:5, tk:20, onChange:v=>{ t.s = v; up(); } }));
    up(); lim.textContent = 'Apagar'; lim.hidden = !(NR.grupo ? NR.grupo.some(i=>i.value) : el.value);
  } else if(c.tipo === 'data'){
    const [mnA] = c.min.split('-').map(Number), [mxA] = c.max.split('-').map(Number);
    let base = el.value || (c.nasc ? `${new Date().getFullYear()-30}-01-01` : (c.min > _nrIsoHoje() ? c.min : _nrIsoHoje()));
    if(base < c.min) base = c.min; if(base > c.max) base = c.max;
    let [a, m, dEsc] = base.split('-').map(Number);
    // Beta 40: "dEsc" é o dia que a PESSOA escolheu; o dia mostrado é ele, limitado ao último dia do mês.
    // Antes o dia era cortado de vez: rolando o mês por fevereiro, o dia 31 virava 28 e não voltava;
    // trocando o ano (29/02 → ano comum) acontecia o mesmo. Agora só o dia mostrado se ajusta.
    let rDia, dmAtual = 0;
    const dEf = ()=>Math.min(dEsc, _nrDiasMes(a, m));
    const iso = (d)=>`${a}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const up = ()=>{
      let d = dEf(), v = iso(d);
      // fora da faixa permitida: mostra o limite, sem mexer no que a pessoa escolheu nas réguas
      if(v < c.min) v = c.min; else if(v > c.max) v = c.max;
      NR.val = v; const [aa, mm, dd] = v.split('-').map(Number); const t = _nrDataTxt(aa, mm, dd); nrMostra(t.num, '', t.sub);
    };
    // o dia acompanha o mês: fevereiro tem 28/29, abril 30… (a régua do dia é refeita só quando o total muda)
    const novoDia = ()=>{
      const dm = _nrDiasMes(a, m); if(rDia && dm === dmAtual) return; dmAtual = dm;
      const r = nrRegua({ min:1, max:dm, step:1, valor:dEf(), fmt:v=>String(v), rotulo:'dia', nome:'Dia', compacta:true, maior:1, tk:40, onChange:v=>{ dEsc = v; up(); } });
      if(rDia){ box.replaceChild(r.el, rDia.el); NR.reguas[0] = r; requestAnimationFrame(()=>r.montar()); } else add(r);
      rDia = r;
    };
    novoDia();
    add(nrRegua({ min:1, max:12, step:1, valor:m, fmt:v=>NR_MESES[v-1], rotulo:'mês', nome:'Mês', compacta:true, maior:1, tk:64, onChange:v=>{ m = v; novoDia(); up(); } }));
    add(nrRegua({ min:mnA, max:mxA, step:1, valor:a, fmt:v=>String(v), rotulo:'ano', nome:'Ano', compacta:true, maior:1, tk:64, onChange:v=>{ a = v; novoDia(); up(); } }));
    NR.dataTeste = ()=>({ a, m, dEsc, d:dEf() });   // usado pelos testes automáticos
    up();
    lim.textContent = 'Sem data'; lim.hidden = !c.opcional;
  } else if(c.tipo === 'hora'){
    let [h, mi] = (el.value || '07:00').split(':').map(Number); mi = Math.round(mi/5)*5 % 60;
    const up = ()=>{ NR.val = `${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`; nrMostra(NR.val, ''); };
    add(nrRegua({ min:0, max:23, step:1, valor:h, fmt:v=>String(v).padStart(2,'0'), rotulo:'hora', nome:'Hora', compacta:true, maior:1, tk:44, onChange:v=>{ h = v; up(); } }));
    add(nrRegua({ min:0, max:55, step:5, valor:mi, fmt:v=>String(v).padStart(2,'0'), rotulo:'min', nome:'Minutos', compacta:true, maior:1, tk:44, onChange:v=>{ mi = v; up(); } }));
    up(); lim.textContent = 'Sem hora'; lim.hidden = !c.opcional;
  }
  f.classList.add('on'); document.documentElement.classList.add('nr-aberta');
  requestAnimationFrame(()=>{ NR && NR.reguas.forEach(r=>r.montar()); const r0 = NR && NR.reguas[0]; if(r0) try{ r0.el.focus({ preventScroll:true }); }catch(e){} });
}
function nrFechar(){
  const f = document.getElementById('nr-fundo'); if(!f) return;
  f.classList.remove('on'); document.documentElement.classList.remove('nr-aberta');
  const o = NR && NR.el; NR = null;
  if(o) try{ o.focus({ preventScroll:true }); }catch(e){}
}
function _nrDispara(el){ el.dispatchEvent(new Event('input', { bubbles:true })); el.dispatchEvent(new Event('change', { bubbles:true })); nrCampoVazio(el); }
function nrGravar(v){
  const { el, c } = NR;
  if(c.tipo === 'hms'){
    const ins = NR.grupo;
    if(v === ''){ ins.forEach(i=>{ i.value = ''; _nrDispara(i); }); return; }
    const t = _nrHms(v); [t.h, t.m, t.s].forEach((x,i)=>{ ins[i].value = x || (i ? '0' : ''); _nrDispara(ins[i]); });
    return;
  }
  if(v === '') el.value = '';
  else if(c.tipo === 'num') el.value = String(Math.round(v*1e6)/1e6);
  else if(c.tipo === 'dist') el.value = (el.type === 'number' ? String(Math.round(v*100)/100) : String(Math.round(v*100)/100).replace('.',','));
  else if(c.tipo === 'dur'){ const t = _nrHms(v); el.value = c.h && t.h ? `${t.h}:${String(t.m).padStart(2,'0')}:${String(t.s).padStart(2,'0')}` : `${t.m + t.h*60}:${String(t.s).padStart(2,'0')}`; }
  else el.value = v;
  _nrDispara(el);
}
function nrConfirmar(){
  if(!NR) return;
  if(!document.querySelector('#nr-fundo .nr-dig').hidden){ if(!nrDigitado(false)) return; }
  nrGravar(NR.val); nrFechar();
}
function nrLimpar(){ if(!NR) return; nrGravar(''); nrFechar(); }
// alternativa sem gesto: o teclado abre porque a pessoa pediu
function nrDigitar(primeiro){
  if(!NR) return;
  const f = nrFolha(); const d = f.querySelector('.nr-dig'); const inp = f.querySelector('#nr-dig-in'); const c = NR.c;
  const dica = { num:`Entre ${_nrFmt(c.min, c.step||1)} e ${_nrFmt(c.max, c.step||1)}${c.un?' '+c.un:''}`, dist:'Ex.: 5,25 (km)', dur: c.h ? 'Ex.: 44:30 ou 1:05:00' : 'Ex.: 1:30 (min:seg)', hms:'Ex.: 44:30 ou 1:05:00', data:'dd/mm/aaaa', hora:'hh:mm' }[c.tipo];
  inp.setAttribute('inputmode', ['num','dist'].includes(c.tipo) ? 'decimal' : 'numeric');
  inp.placeholder = dica; d.querySelector('.nr-dig-dica').textContent = dica;
  inp.value = primeiro != null ? primeiro : '';
  d.hidden = false; f.querySelector('.nr-reguas').hidden = true;
  setTimeout(()=>{ inp.focus(); try{ inp.setSelectionRange(inp.value.length, inp.value.length); }catch(e){} }, 30);
}
function nrDigitado(soMostrar){
  const inp = document.getElementById('nr-dig-in'); const c = NR && NR.c; if(!c) return false;
  const t = inp.value.trim(); let v = null;
  if(c.tipo === 'num' || c.tipo === 'dist'){ const n = _nrNum(t); if(n != null){ const lo = c.tipo === 'dist' ? 0 : c.min, hi = c.tipo === 'dist' ? 200 : c.max; if(n >= lo && n <= hi) v = n; } }
  else if(c.tipo === 'dur' || c.tipo === 'hms'){ const s = _nrLerDur(t); if(s != null && s >= 0) v = s; }
  else if(c.tipo === 'data'){ const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t); if(m){ const iso = `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; const dt = new Date(iso+'T12:00:00'); if(!isNaN(dt) && dt.getDate() === +m[1] && iso >= c.min && iso <= c.max) v = iso; } }
  else if(c.tipo === 'hora'){ const m = /^(\d{1,2}):(\d{2})$/.exec(t); if(m && +m[1] < 24 && +m[2] < 60) v = `${m[1].padStart(2,'0')}:${m[2]}`; }
  inp.classList.toggle('nr-ruim', !!t && v == null);
  if(v == null) return false;
  NR.val = v;
  if(!soMostrar) return true;
  if(c.tipo === 'num') nrMostra(_nrFmt(v, c.step), c.un); else if(c.tipo === 'dist') nrMostra(_nrFmt(v, 0.01), 'km');
  else if(c.tipo === 'data'){ const [a,m,d] = v.split('-').map(Number); const x = _nrDataTxt(a,m,d); nrMostra(x.num, '', x.sub); }
  else if(c.tipo === 'hora') nrMostra(v, ''); else { const h = _nrHms(v); nrMostra(`${h.h ? h.h+'h ' : ''}${h.m}min ${String(h.s).padStart(2,'0')}s`, ''); }
  return true;
}

// ---- preparar os campos ----
function nrCampoVazio(el){ const w = el.parentElement; if(w && w.classList.contains('nr-wrap')) w.classList.toggle('vazio', !el.value); }
function nrPrepara(el){
  if(el.dataset.nr) return;
  const c = nrConfig(el); if(!c) return;
  el.dataset.nr = c.tipo;
  el.readOnly = true; el.setAttribute('inputmode','none'); el.setAttribute('aria-haspopup','dialog');
  el.classList.add('nr-campo');
  // datas/horários opcionais: "×" para limpar no próprio campo
  if((c.tipo === 'data' || c.tipo === 'hora') && c.opcional && !(el.parentElement && el.parentElement.classList.contains('nr-wrap'))){
    const w = document.createElement('span'); w.className = 'nr-wrap';
    if(el.style.flex){ w.style.flex = el.style.flex; el.style.flex = ''; }
    el.parentNode.insertBefore(w, el); w.appendChild(el);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'nr-limpa';
    b.setAttribute('aria-label', c.tipo === 'hora' ? 'Limpar horário' : 'Limpar data'); b.textContent = '×';
    b.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); el.value = ''; _nrDispara(el); });
    w.appendChild(b); nrCampoVazio(el);
  }
}
function nrVarre(raiz){
  try{
    if(raiz.tagName === 'INPUT'){ nrPrepara(raiz); return; }
    if(raiz.querySelectorAll) raiz.querySelectorAll('input').forEach(nrPrepara);
  }catch(e){ console.log('controles por gesto:', e); }
}
// tocar/clicar no campo abre a folha (o teclado não abre)
document.addEventListener('click', e=>{
  const el = e.target.closest && e.target.closest('input.nr-campo'); if(!el || el.disabled) return;
  e.preventDefault(); nrAbrir(el);
}, true);
document.addEventListener('keydown', e=>{
  const el = e.target; if(!(el && el.classList && el.classList.contains('nr-campo'))) return;
  if(['Enter',' ','ArrowUp','ArrowDown','F4'].includes(e.key)){ e.preventDefault(); nrAbrir(el); }
  else if((e.key === 'Delete' || e.key === 'Backspace') && el.value){ const c = nrConfig(el); if(c && c.opcional){ e.preventDefault(); el.value = ''; _nrDispara(el); } }
}, true);
// campos novos (janelas e fichas montadas depois) também ganham o controle
new MutationObserver(ms=>{ ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.nodeType === 1) nrVarre(n); })); })
  .observe(document.body, { childList:true, subtree:true });
nrVarre(document.body);
// formulários que mudam o valor por código (ex.: limpar ao recomeçar) atualizam o "×"
document.addEventListener('input', e=>{ if(e.target && e.target.classList && e.target.classList.contains('nr-campo')) nrCampoVazio(e.target); }, true);
mtGancho('showScreen', { depois(){ setTimeout(()=>document.querySelectorAll('.nr-wrap > input').forEach(nrCampoVazio), 0); }});
Object.assign(window, { nrAbrir, nrFechar, nrConfirmar, nrLimpar, nrDigitar, nrRegua, nrConfig });

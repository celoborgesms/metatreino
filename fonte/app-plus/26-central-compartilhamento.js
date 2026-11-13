
// =====================================================================
// 41. Beta 26 — Central de compartilhamento
// =====================================================================
// Um só sistema para todos os cards de compartilhar:
//   treino de musculação · corrida · bike · caminhada · conquista · conquista especial ·
//   desafio concluído · recorde · evolução de carga · resumo da semana.
// Os botões de compartilhar que já existiam passam a abrir a Central. O modelo antigo
// continua disponível ("Modelo clássico") e nada do que é salvo muda.
//
// Privacidade: o card só leva o que é do treino/conquista. Nunca e-mail, peso, medidas
// ou foto que o aluno não escolheu. O nome só aparece se o aluno ligar "Mostrar meu nome".
// Não existe mapa/percurso: o app não registra GPS, então nada é desenhado.

const MTS_FORMATOS = {
  story:   { w:1080, h:1920, nome:'Stories e Status', sub:'9:16' },
  feed:    { w:1080, h:1350, nome:'Feed', sub:'4:5' },
  quadrado:{ w:1080, h:1080, nome:'Quadrado', sub:'1:1' }
};
const MTS_ESTILOS = { escuro:'Escuro', claro:'Claro', tema:'Cores do meu tema' };
const MTS_DISP = { destaque:'Destaque', grade:'Números', compacto:'Faixa' };
const MTS_COR = { musculacao:'#ff7a3d', corrida:'#2fd4b5', bike:'#a78bfa', caminhada:'#34d399', conquista:'#f5c451',
  especial:'#f2c66d', desafio:'#f5c451', recorde:'#f5c451', evolucao:'#5ac8fa', semana:'#8ea2ff' };
const MTS_KICKER = { musculacao:'Treino de musculação', corrida:'Corrida', bike:'Pedal', caminhada:'Caminhada', conquista:'Conquista desbloqueada',
  especial:'Conquista especial', desafio:'Desafio concluído', recorde:'Recorde pessoal', evolucao:'Evolução de carga', semana:'Minha semana' };

// estado da Central (só na memória; a escolha de formato/estilo fica lembrada no aparelho)
const MTS = { d:null, foto:null, zoom:1, px:0, py:0, escurecer:.45, nome:false, classico:null };
function _mtsPref(k, padrao){ try{ return localStorage.getItem('mt_share_'+k) || padrao; }catch(e){ return padrao; } }
function _mtsSalvaPref(k, v){ try{ localStorage.setItem('mt_share_'+k, v); }catch(e){} }

// ---------- utilidades ----------
const _mtsN = (v, dec)=> (+v||0).toLocaleString('pt-BR', {minimumFractionDigits:dec||0, maximumFractionDigits:dec||0});
function _mtsData(t){ return t ? new Date(t).toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'}).replace('.', '') : ''; }
function _mtsSemEmoji(s){ return String(s||'').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu,'').replace(/\s{2,}/g,' ').trim(); }
function _mtsPrimeiroNome(){
  const p = (state.user && state.user.profile) || {};
  const n = String(p.nickname || (state.user && state.user.name) || '').trim().split(/\s+/)[0] || '';
  return n.slice(0, 20);
}
function _mtsDur(min){ min = Math.round(+min||0); if(min < 60) return {v:String(min), u:'min'}; const h = Math.floor(min/60), m = min%60; return {v:`${h}h${m?String(m).padStart(2,'0'):''}`, u:''}; }
function _mtsPace(dur, km){ if(!(km > 0 && dur > 0)) return null; const p = dur/km; const mm = Math.floor(p), ss = Math.round((p-mm)*60); return `${mm}:${String(ss===60?0:ss).padStart(2,'0')}`; }
function _mtsCatCor(cat){ return { streak:'#ff8a3d', run:'#5ac8fa', walk:'#34d399', bike:'#a78bfa', body:'#e5e7eb', secret:'#f5c451', geral:'#f5c451', lift:'#ff7a3d' }[cat] || '#f5c451'; }
function _mtsCssCor(v){ try{ const el = document.createElement('span'); el.style.color = v; document.body.appendChild(el); const c = getComputedStyle(el).color; el.remove(); return c; }catch(e){ return v; } }

// medalha (SVG do app) como imagem para o canvas, com cores fixas
function _mtsMedalhaImg(svgHtml, cor, corTxt){
  return new Promise(res=>{
    try{
      const corpo = String(svgHtml).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      const css = `.tb-ring{fill:none;stroke:${cor};stroke-width:1.8}.tb-ring2{fill:none;stroke:${cor};stroke-width:.9;stroke-opacity:.7}.tb-orn{fill:none;stroke:${cor};stroke-width:1.6;stroke-dasharray:1.4 2.2}`
        + `.tb-in{fill:${cor};fill-opacity:.18}.tb-luz{fill:#fff;fill-opacity:.10}.tb-sombra{fill:none;stroke:#000;stroke-opacity:.25;stroke-width:1.1}`
        + `.tb-g{fill:none;stroke:${cor};stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.tb-l{fill:${corTxt||'#fff'};font-size:9px;font-weight:800;text-anchor:middle;font-family:Outfit,Arial,sans-serif}`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="480" height="480"><style>${css}</style>${corpo}</svg>`;
      const img = new Image(); img.onload = ()=>res(img); img.onerror = ()=>res(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }catch(e){ res(null); }
  });
}

// ---------- montagem dos dados (somente dados reais) ----------
function mtsDeHistorico(x){
  if(!x) return null;
  const run = x.module === 'run' || (x.module !== 'lift' && (((state.modules.run||{}).history||[]).includes(x) || x.distance != null || !!x.activity));
  if(run){
    const tipo = x.activity === 'bike' ? 'bike' : x.activity === 'caminhada' ? 'caminhada' : 'corrida';
    const km = +x.distance || 0, dur = +x.duration || 0;
    const nums = [];
    const d = _mtsDur(dur); nums.push({ l:'Tempo', v:d.v, u:d.u });
    if(tipo === 'bike'){ if(km && dur) nums.push({ l:'Velocidade média', v:_mtsN(km/(dur/60),1), u:'km/h' }); }
    else { const p = _mtsPace(dur, km) || (x.pace ? String(x.pace).replace(/\/?km$/,'') : null); if(p) nums.push({ l:'Ritmo médio', v:p, u:'/km' }); }
    if(tipo !== 'bike' && km && dur) nums.push({ l:'Velocidade', v:_mtsN(km/(dur/60),1), u:'km/h' });
    if(x.elev || x.elevacao) nums.push({ l:'Elevação', v:_mtsN(x.elev||x.elevacao), u:'m' });
    return { tipo, titulo:_mtsSemEmoji(x.name) || MTS_KICKER[tipo], data:x.at,
      hero: km ? { v:_mtsN(km, km<10?2:1), u:'km' } : { v:d.v, u:d.u||'' }, nums: km ? nums.slice(0,3) : nums.slice(1,4),
      extra: x.isRace ? ['Prova'] : [], texto:`${MTS_KICKER[tipo]} no MetaTreino` };
  }
  // musculação: séries e volume vêm dos registros de carga do mesmo dia
  const ids = (x.exercisesDone||[]).map(e=>e.id);
  let series = 0, vol = 0;
  const dia = mtDia0(x.at);
  ids.forEach(id=>{ (state.progress[id]||[]).forEach(p=>{ if(mtDia0(p.date) === dia){ (p.sets||[]).forEach(s=>{ series++; vol += (+s.peso||0)*(+s.reps||0); }); } }); });
  let partes = []; try{ partes = (typeof partsFromEntry==='function' ? partsFromEntry(x) : []).map(_mtsSemEmoji).filter(Boolean); }catch(e){}
  const d = _mtsDur(x.duration);
  const nums = [{ l:'Duração', v:d.v, u:d.u }];
  if(ids.length) nums.push({ l:'Exercícios', v:String(ids.length), u:'' });
  if(series) nums.push({ l:'Séries', v:String(series), u:'' });
  if(vol >= 100) nums.push({ l:'Volume', v: vol>=1000 ? _mtsN(vol/1000,1) : _mtsN(vol), u: vol>=1000 ? 't' : 'kg' });
  const hero = vol >= 1000 ? { v:_mtsN(vol/1000,1), u:'toneladas levantadas' } : ids.length ? { v:String(ids.length), u: ids.length===1?'exercício concluído':'exercícios concluídos' } : { v:d.v, u:d.u||'de treino' };
  return { tipo:'musculacao', titulo:_mtsSemEmoji(x.name) || 'Treino concluído', data:x.at, hero,
    nums: nums.filter(n=>!(hero.v===n.v && (n.l==='Duração' || /exerc|tonel/.test(hero.u)))).slice(0,3), extra: partes.slice(0,4), texto:'Treino concluído no MetaTreino' };
}
function mtsDeConquista(id){
  const t = TROPHIES.find(x=>x.id===id); if(!t) return null;
  const def = TROPHY_ICO[t.id] || ['medal'];
  const nv = typeof medalNivel==='function' ? medalNivel(t) : 'comum';
  return { tipo:'conquista', titulo:t.name, desc:t.desc, data:(state.trophyDates||{})[id] || null,
    medalha:{ svg:medalSvg(def[0], def[1], '', nv), cor:_mtsCatCor(t.secret ? 'secret' : t.cat) },
    nivel: nv==='especial' ? 'Especial' : nv==='rara' ? 'Rara' : '', texto:`Desbloqueei "${t.name}" no MetaTreino` };
}
function mtsDeEspecial(){
  const sp = state.specialTrophy; if(!sp) return null;
  const d = typeof _saDadosTrofeu==='function' ? _saDadosTrofeu(sp) : sp;
  return { tipo:'especial', titulo:d.titulo || 'Conquista especial', desc:d.descricao || '', data: sp.guardadaEm || sp.at || null,
    emoji: d.emo || '', texto:`${d.titulo || 'Conquista especial'} — MetaTreino` };
}
function mtsDeDesafio(key){
  const e = eventoPorKey(key); const reg = (state.eventos||{})[key]; if(!e || !reg) return null;
  const dias = progressoEvento(e).dias;
  const cor = (()=>{ const c = evCor(e.arte).ev; return /var\(/.test(c) ? _mtsCssCor(c) : c; })();
  return { tipo:'desafio', kick: reg.concluidoEm ? 'Desafio concluído' : 'Desafio em andamento', titulo:e.nome, data: reg.concluidoEm || null, cor,
    medalha:{ svg: medalSvg('ev_'+e.arte, String(new Date(e.ini).getFullYear())), cor },
    hero:{ v:String(dias), u: dias===1?'dia ativo':'dias ativos' }, nums: reg.alvo ? [{ l:'Meta', v:String(reg.alvo), u:'dias' }] : [],
    texto:`Concluí o desafio ${e.nome} no MetaTreino` };
}
function mtsDeSemana(){
  const s = typeof weekStats==='function' ? weekStats() : null; if(!s || !s.total) return null;
  const km = (s.kmRun||0) + (s.kmWalk||0) + (s.kmBike||0);
  const nums = [];
  if(s.lift) nums.push({ l:'Musculação', v:String(s.lift), u: s.lift===1?'treino':'treinos' });
  if(s.runs) nums.push({ l:'Corridas', v:String(s.runs), u:'' });
  if(km) nums.push({ l:'Distância', v:_mtsN(km,1), u:'km' });
  if(s.totalMin) nums.push({ l:'Tempo', ..._mtsDur(s.totalMin) });
  return { tipo:'semana', titulo:'Esta semana', data:Date.now(), hero:{ v:String(s.total), u: s.total===1?'atividade':'atividades' }, nums:nums.slice(0,3), texto:'Minha semana no MetaTreino' };
}
function mtsDeRecorde(titulo, valor, quando, ehCorrida){
  const m = String(valor).match(/^([\d.,:]+)\s*(.*)$/);
  return { tipo:'recorde', titulo:_mtsSemEmoji(titulo), data:quando||null, hero: m ? { v:m[1], u:m[2] } : { v:String(valor), u:'' }, nums:[], kick: ehCorrida ? 'Recorde de corrida' : 'Recorde pessoal', texto:`Novo recorde no MetaTreino: ${_mtsSemEmoji(titulo)} — ${valor}` };
}
function mtsDeEvolucao(exId){
  let pts = []; try{ pts = (_pontosEx(exId)||[]).filter(p=>p.peso>0); }catch(e){}
  if(pts.length < 2) return null;
  const a = pts[0], b = pts[pts.length-1], melhor = Math.max(...pts.map(p=>p.peso));
  const pct = a.peso > 0 ? Math.round((b.peso - a.peso)/a.peso*100) : 0;
  const nome = (typeof nomeDoEx==='function' ? nomeDoEx(exId) : exId);
  return { tipo:'evolucao', titulo:_mtsSemEmoji(nome), data:b.date,
    hero:{ v:(pct>0?'+':'')+pct+'%', u:'de carga' },
    nums:[{ l:'Início', v:_mtsN(a.peso,1), u:'kg' }, { l:'Agora', v:_mtsN(b.peso,1), u:'kg' }, { l:'Melhor', v:_mtsN(melhor,1), u:'kg' }],
    periodo:`${_mtsData(a.date)} → ${_mtsData(b.date)}`, serie: pts.slice(-24).map(p=>p.peso), texto:`Minha evolução no ${_mtsSemEmoji(nome)} — MetaTreino` };
}

// ---------- desenho ----------
function _mtsPaleta(estilo, d, comFoto){
  const acc = d.cor || MTS_COR[d.tipo] || '#ff7a3d';
  if(comFoto) return { bg1:'#000', bg2:'#000', txt:'#fff', dim:'rgba(255,255,255,.78)', linha:'rgba(255,255,255,.22)', acc, painel:'rgba(10,12,16,.55)', marcaTxt:'#0b0e13' };
  if(estilo === 'claro') return { bg1:'#f6f4ef', bg2:'#ffffff', txt:'#12151a', dim:'rgba(18,21,26,.62)', linha:'rgba(18,21,26,.12)', acc: _mtsEscurece(acc, .32), painel:'rgba(18,21,26,.05)', marcaTxt:'#fff' };
  if(estilo === 'tema'){
    const cs = getComputedStyle(document.documentElement); const v = n=>cs.getPropertyValue(n).trim();
    const claro = typeof temaClaro==='function' && temaClaro();
    return { bg1: _mtsCssCor(v('--bg')), bg2: _mtsCssCor(v('--bg-2') || v('--bg')), txt: _mtsCssCor(v('--text-strong')), dim: _mtsCssCor(v('--text-dim')),
      linha: claro ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.12)', acc: _mtsCssCor(v('--primary')), painel: claro ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.05)', marcaTxt: claro ? '#fff' : '#0b0e13' };
  }
  return { bg1:'#0b0e13', bg2:'#171c25', txt:'#ffffff', dim:'rgba(255,255,255,.66)', linha:'rgba(255,255,255,.12)', acc, painel:'rgba(255,255,255,.05)', marcaTxt:'#0b0e13' };
}
function _mtsEscurece(cor, f){
  const c = _mtsCssCor(cor).match(/\d+(\.\d+)?/g); if(!c) return cor;
  return `rgb(${c.slice(0,3).map(x=>Math.round(+x*(1-f))).join(',')})`;
}
function _mtsRgba(cor, a){ const c = _mtsCssCor(cor).match(/\d+(\.\d+)?/g); if(!c) return cor; return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function _mtsQuebra(x, txt, maxW, maxL){
  const pal = String(txt||'').split(/\s+/); const linhas = []; let l = '';
  pal.forEach(p=>{ const t = l ? l+' '+p : p; if(x.measureText(t).width <= maxW || !l) l = t; else { linhas.push(l); l = p; } });
  if(l) linhas.push(l);
  if(linhas.length > maxL){ const r = linhas.slice(0, maxL); let u = r[maxL-1]; while(u.length > 1 && x.measureText(u+'…').width > maxW) u = u.slice(0,-1); r[maxL-1] = u+'…'; return r; }
  return linhas;
}
function _mtsRet(x, px, py, w, h, r){ x.beginPath(); x.moveTo(px+r,py); x.arcTo(px+w,py,px+w,py+h,r); x.arcTo(px+w,py+h,px,py+h,r); x.arcTo(px,py+h,px,py,r); x.arcTo(px,py,px+w,py,r); x.closePath(); }
// desenho de fundo por modalidade (traços discretos, sem fotos de terceiros)
function _mtsPadrao(x, W, H, tipo, cor){
  x.save(); x.strokeStyle = _mtsRgba(cor, .14); x.lineWidth = W*0.004; x.lineCap = 'round';
  if(tipo === 'corrida' || tipo === 'caminhada'){
    for(let i=0;i<5;i++){ x.beginPath(); x.arc(W*1.05, H*0.04, W*(0.45+i*0.11), Math.PI*0.5, Math.PI*1.02); x.stroke(); }
  } else if(tipo === 'bike'){
    [[0.82,0.16,0.16],[0.48,0.16,0.16]].forEach(([cx,cy,r])=>{ x.beginPath(); x.arc(W*cx, H*cy, W*r, 0, Math.PI*2); x.stroke(); x.beginPath(); x.arc(W*cx, H*cy, W*r*0.18, 0, Math.PI*2); x.stroke(); });
  } else if(tipo === 'musculacao'){
    x.lineWidth = W*0.006; const y = H*0.17;
    x.beginPath(); x.moveTo(W*0.38, y); x.lineTo(W*1.02, y); x.stroke();
    [[0.48,0.16],[0.55,0.12],[0.88,0.16],[0.81,0.12]].forEach(([cx,h])=>{ _mtsRet(x, W*cx - W*0.025, y - W*h/2, W*0.05, W*h, W*0.012); x.stroke(); });
  } else if(tipo === 'evolucao' || tipo === 'semana' || tipo === 'recorde'){
    for(let i=0;i<6;i++){ const bh = H*(0.05+i*0.03); _mtsRet(x, W*(0.45+i*0.09), H*0.30 - bh, W*0.05, bh, W*0.01); x.stroke(); }
  } else {
    for(let i=0;i<4;i++){ x.beginPath(); x.arc(W*0.86, H*0.12, W*(0.10+i*0.08), 0, Math.PI*2); x.stroke(); }
  }
  x.restore();
}
async function mtsDesenhar(cv, d, o){
  const F = MTS_FORMATOS[o.fmt] || MTS_FORMATOS.story; const W = F.w, H = F.h;
  cv.width = W; cv.height = H; const x = cv.getContext('2d');
  try{ await document.fonts.load('800 80px Outfit'); await document.fonts.load('300 80px Outfit'); }catch(e){}
  const foto = o.foto; const P = _mtsPaleta(o.estilo, d, !!foto);
  const pad = W*0.075; const FF = 'Outfit, system-ui, sans-serif';
  // fundo
  if(foto){
    const esc = Math.max(W/foto.width, H/foto.height) * (o.zoom||1);
    const iw = foto.width*esc, ih = foto.height*esc;
    const maxX = Math.max(0, (iw-W)/2), maxY = Math.max(0, (ih-H)/2);
    const ox = (W-iw)/2 + Math.max(-1, Math.min(1, o.px||0))*maxX, oy = (H-ih)/2 + Math.max(-1, Math.min(1, o.py||0))*maxY;
    x.drawImage(foto, ox, oy, iw, ih);
    const k = o.escurecer==null ? .45 : o.escurecer;
    x.fillStyle = `rgba(0,0,0,${k*0.45})`; x.fillRect(0,0,W,H);
    let g = x.createLinearGradient(0,0,0,H*0.22); g.addColorStop(0,`rgba(0,0,0,${Math.min(.75,.35+k*.4)})`); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0,0,W,H*0.22);
    g = x.createLinearGradient(0,H*0.42,0,H); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,`rgba(0,0,0,${Math.min(.92,.5+k*.5)})`); x.fillStyle = g; x.fillRect(0,H*0.42,W,H*0.58);
  } else {
    const g = x.createLinearGradient(0,0,W,H); g.addColorStop(0,P.bg1); g.addColorStop(1,P.bg2); x.fillStyle = g; x.fillRect(0,0,W,H);
    const rg = x.createRadialGradient(W*0.85, H*0.12, 0, W*0.85, H*0.12, W*0.9); rg.addColorStop(0, _mtsRgba(P.acc, o.estilo==='claro'?.14:.22)); rg.addColorStop(1, _mtsRgba(P.acc, 0));
    x.fillStyle = rg; x.fillRect(0,0,W,H);
    _mtsPadrao(x, W, H, d.tipo, P.acc);
  }
  // cabeçalho: marca + data
  const ms = W*0.075, my = pad*0.9;
  x.fillStyle = P.acc; _mtsRet(x, pad, my, ms, ms, ms*0.26); x.fill();
  x.fillStyle = P.marcaTxt; x.font = `800 ${ms*0.56}px ${FF}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('M', pad+ms/2, my+ms/2+ms*0.02);
  x.fillStyle = P.txt; x.textAlign = 'left'; x.font = `800 ${W*0.026}px ${FF}`;
  if(x.letterSpacing !== undefined) x.letterSpacing = `${W*0.006}px`;
  x.fillText('METATREINO', pad+ms+W*0.025, my+ms/2);
  if(x.letterSpacing !== undefined) x.letterSpacing = '0px';
  if(d.data){ x.textAlign = 'right'; x.fillStyle = P.dim; x.font = `500 ${W*0.028}px ${FF}`; x.fillText(_mtsData(d.data), W-pad, my+ms/2); }
  // medalha (conquista / desafio)
  let medImg = null; if(d.medalha) medImg = await _mtsMedalhaImg(d.medalha.svg, d.medalha.cor, (!foto && o.estilo==='claro') ? '#12151a' : (!foto && o.estilo==='tema' && typeof temaClaro==='function' && temaClaro()) ? P.txt : '#fff');
  // bloco de conteúdo
  const kick = (d.kick || MTS_KICKER[d.tipo] || '').toUpperCase();
  const disp = o.disp || 'destaque';
  const nums = d.nums || [];
  const maxW = W - pad*2;
  // mede alturas
  x.textBaseline = 'alphabetic';
  const tamTit = W*(disp==='compacto'?0.058:0.07);
  x.font = `800 ${tamTit}px ${FF}`; const linTit = _mtsQuebra(x, d.titulo, maxW, 2);
  const tamHero = W*(disp==='grade'?0.15:(disp==='compacto'?0.15:0.2));
  const temHero = !!(d.hero && d.hero.v);
  const tamNum = W*0.062, tamLbl = W*0.026;
  const altNums = nums.length ? tamNum + tamLbl + W*0.045 : 0;
  const tamDesc = W*0.034; x.font = `400 ${tamDesc}px ${FF}`; const linDesc = d.desc ? _mtsQuebra(x, d.desc, maxW, 3) : [];
  const medTam = medImg ? (o.fmt==='quadrado' ? W*(disp==='destaque'?0.26:0.2) : o.fmt==='feed' ? W*0.28 : W*0.34) : 0;
  const chipsH = (d.extra && d.extra.length) ? W*0.07 : 0;
  const nomeH = (o.nome && _mtsPrimeiroNome()) ? W*0.06 : 0;
  const alturaBloco = W*0.04 /*kicker*/ + linTit.length*tamTit*1.08 + (temHero ? tamHero*1.02 + W*0.03 : 0) + (linDesc.length ? linDesc.length*tamDesc*1.35 + W*0.02 : 0)
    + (d.periodo ? W*0.045 : 0) + altNums + chipsH + nomeH + (d.serie ? W*0.14 : 0) + (d.nivel ? W*0.05 : 0);
  const rodapeY = H - pad*0.75;
  let y;
  if(disp === 'grade' && !foto) y = Math.min(rodapeY - W*0.07 - alturaBloco, Math.max(my+ms+W*0.08 + medTam, (H - alturaBloco)/2 + medTam*0.4));
  else y = rodapeY - W*0.07 - alturaBloco;
  // faixa (compacto): painel atrás do bloco
  if(disp === 'compacto'){
    x.fillStyle = foto ? 'rgba(8,10,14,.62)' : P.painel; _mtsRet(x, pad*0.55, y - W*0.05, W - pad*1.1, alturaBloco + W*0.08, W*0.04); x.fill();
  }
  if(medImg){
    const mx = (disp==='grade' || o.fmt!=='story' && disp!=='destaque') ? (W-medTam)/2 : pad - medTam*0.06;
    const my2 = y - medTam - W*0.03;
    x.save(); x.shadowColor = _mtsRgba(d.medalha.cor, .55); x.shadowBlur = W*0.05; x.drawImage(medImg, mx, Math.max(my+ms+W*0.03, my2), medTam, medTam); x.restore();
  } else if(d.emoji){
    x.save(); x.globalAlpha = 1; x.fillStyle = '#000'; x.font = `${W*0.16}px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif`; x.textAlign = disp==='grade' ? 'center' : 'left';
    x.fillText(d.emoji, disp==='grade' ? W/2 : pad, y - (disp==='compacto' ? W*0.08 : W*0.04)); x.restore();
  }
  const alinh = disp==='grade' ? 'center' : 'left'; const ax = disp==='grade' ? W/2 : pad;
  x.textAlign = alinh;
  // nível (rara/especial)
  if(d.nivel){ x.font = `800 ${W*0.024}px ${FF}`; if(x.letterSpacing !== undefined) x.letterSpacing = `${W*0.004}px`; x.fillStyle = P.acc; x.fillText(d.nivel.toUpperCase(), ax, y + W*0.026); if(x.letterSpacing !== undefined) x.letterSpacing = '0px'; y += W*0.05; }
  // kicker
  x.fillStyle = P.acc; x.font = `800 ${W*0.028}px ${FF}`; if(x.letterSpacing !== undefined) x.letterSpacing = `${W*0.005}px`;
  x.fillText(kick, ax, y + W*0.03); if(x.letterSpacing !== undefined) x.letterSpacing = '0px'; y += W*0.04;
  // título
  x.fillStyle = P.txt; x.font = `800 ${tamTit}px ${FF}`;
  linTit.forEach(l=>{ y += tamTit*1.08; x.fillText(l, ax, y); });
  // número principal
  if(temHero){
    y += tamHero*0.98; x.font = `800 ${tamHero}px ${FF}`; x.fillStyle = P.txt;
    const hv = String(d.hero.v); const wv = x.measureText(hv).width;
    const startX = alinh==='center' ? (W - wv - (d.hero.u ? x.measureText(' ').width : 0) - (()=>{ x.font = `600 ${W*0.045}px ${FF}`; const u = x.measureText(d.hero.u||'').width; x.font = `800 ${tamHero}px ${FF}`; return u; })())/2 : ax;
    x.textAlign = 'left'; x.fillText(hv, startX, y);
    if(d.hero.u){ x.font = `600 ${W*0.045}px ${FF}`; x.fillStyle = P.acc; x.fillText(' ' + d.hero.u, startX + wv, y); }
    x.textAlign = alinh; y += W*0.03;
  }
  if(d.periodo){ y += W*0.045; x.font = `500 ${W*0.03}px ${FF}`; x.fillStyle = P.dim; x.fillText(d.periodo, ax, y); }
  // minigráfico da evolução (valores reais da série)
  if(d.serie && d.serie.length >= 2){
    y += W*0.05; const gh = W*0.08, gw = disp==='grade' ? W*0.6 : maxW*0.75, gx = disp==='grade' ? (W-gw)/2 : pad;
    const lo = Math.min(...d.serie), hi = Math.max(...d.serie), rng = (hi-lo)||1;
    x.strokeStyle = P.acc; x.lineWidth = W*0.006; x.lineJoin = 'round'; x.beginPath();
    d.serie.forEach((v,i)=>{ const px2 = gx + gw*i/(d.serie.length-1), py2 = y + gh - gh*(v-lo)/rng; i ? x.lineTo(px2, py2) : x.moveTo(px2, py2); }); x.stroke();
    y += gh + W*0.01;
  }
  if(linDesc.length){ y += W*0.02; x.font = `400 ${tamDesc}px ${FF}`; x.fillStyle = P.dim; linDesc.forEach(l=>{ y += tamDesc*1.35; x.fillText(l, ax, y); }); }
  // números
  if(nums.length){
    y += W*0.05;
    x.strokeStyle = P.linha; x.lineWidth = 2; x.beginPath(); x.moveTo(pad, y - W*0.01); x.lineTo(W-pad, y - W*0.01); x.stroke();
    const col = maxW / nums.length;
    nums.forEach((n,i)=>{
      const cx = disp==='grade' ? pad + col*i + col/2 : pad + col*i;
      x.textAlign = disp==='grade' ? 'center' : 'left';
      x.font = `500 ${tamLbl}px ${FF}`; x.fillStyle = P.dim; x.fillText(String(n.l).toUpperCase(), cx, y + tamLbl + W*0.012);
      x.font = `800 ${tamNum}px ${FF}`; x.fillStyle = P.txt;
      const v = String(n.v); x.fillText(v, cx - (disp==='grade' && n.u ? (()=>{ x.font = `600 ${tamLbl*1.15}px ${FF}`; const uw = x.measureText(' '+n.u).width; x.font = `800 ${tamNum}px ${FF}`; return uw/2; })() : 0), y + tamLbl + tamNum + W*0.02);
      if(n.u){ const vw = x.measureText(v).width; x.font = `600 ${tamLbl*1.15}px ${FF}`; x.fillStyle = P.dim; x.textAlign = 'left';
        x.fillText(' ' + n.u, disp==='grade' ? (cx + vw/2 - x.measureText(' '+n.u).width/2) : cx + vw, y + tamLbl + tamNum + W*0.02); }
    });
    x.textAlign = alinh; y += altNums;
  }
  // grupos musculares (musculação) / marcações
  if(chipsH){
    y += W*0.01; x.font = `600 ${W*0.03}px ${FF}`; x.textAlign = 'left';
    const chips = d.extra.slice(0,4); const larg = chips.map(c=>x.measureText(c).width + W*0.05); const total = larg.reduce((a,b)=>a+b,0) + W*0.015*(chips.length-1);
    let cx = disp==='grade' ? (W-Math.min(total,maxW))/2 : pad;
    chips.forEach((c,i)=>{ if(cx + larg[i] > W - pad) return; x.fillStyle = _mtsRgba(P.acc, .16); _mtsRet(x, cx, y, larg[i], W*0.055, W*0.0275); x.fill();
      x.fillStyle = P.txt; x.fillText(c, cx + W*0.025, y + W*0.038); cx += larg[i] + W*0.015; });
    y += chipsH;
  }
  if(nomeH){ x.textAlign = alinh; x.font = `500 ${W*0.03}px ${FF}`; x.fillStyle = P.dim; x.fillText('por ' + _mtsPrimeiroNome(), ax, y + W*0.045); }
  // assinatura
  x.textAlign = 'right'; x.font = `600 ${W*0.026}px ${FF}`; x.fillStyle = P.dim; x.fillText('metatreino.app', W - pad, rodapeY);
  return cv;
}

// ---------- tela da Central ----------
function mtsAbrir(d, classico){
  if(!d){ toast('Ainda não há dados para montar esse card.'); return; }
  MTS.d = d; MTS.classico = classico || null;
  MTS.fmt = _mtsPref('fmt', 'story'); MTS.estilo = _mtsPref('estilo', 'escuro'); MTS.disp = _mtsPref('disp', 'destaque');
  if(!MTS_FORMATOS[MTS.fmt]) MTS.fmt = 'story';
  const chips = (grupo, obj, atual, fn)=>`<div class="mts-chips" role="radiogroup" aria-label="${grupo}">${Object.entries(obj).map(([k,v])=>`<button type="button" role="radio" aria-checked="${k===atual}" class="${k===atual?'on':''}" onclick="${fn}('${k}')">${typeof v==='string'?v:`${v.nome} <small>${v.sub}</small>`}</button>`).join('')}</div>`;
  const video = d.tipo === 'especial' && typeof saFormatoVideo==='function' && saFormatoVideo();
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `<button type="button" class="modal-x" aria-label="Fechar" onclick="closeModal()">✕</button>
    <h3>Compartilhar</h3>
    <div class="mts-prev" id="mts-prev"><canvas id="mts-cv" aria-label="Prévia do card"></canvas>${MTS.foto ? '<div class="mts-dica">Arraste para posicionar · pinça para ampliar</div>' : ''}</div>
    <div class="mts-sec">Formato</div>${chips('Formato', MTS_FORMATOS, MTS.fmt, 'mtsFmt')}
    <div class="mts-sec">Fundo</div>
    <div class="mts-foto">
      <button type="button" class="btn btn-outline" onclick="document.getElementById('mts-arq').click()">${MTS.foto ? 'Trocar foto' : 'Usar foto da galeria'}</button>
      ${MTS.foto ? `<button type="button" class="btn btn-ghost" onclick="mtsSemFoto()">Sem foto</button>` : ''}
      <input type="file" id="mts-arq" accept="image/*" hidden onchange="mtsFoto(event)">
    </div>
    ${MTS.foto ? `<label class="mts-sl">Zoom <input type="range" min="1" max="3" step="0.01" value="${MTS.zoom}" oninput="MTS.zoom=+this.value;mtsDesenhaPrev()"></label>
      <label class="mts-sl">Escurecer <input type="range" min="0" max="0.9" step="0.01" value="${MTS.escurecer}" oninput="MTS.escurecer=+this.value;mtsDesenhaPrev()"></label>`
      : `${chips('Estilo', MTS_ESTILOS, MTS.estilo, 'mtsEstilo')}`}
    <div class="mts-sec">Disposição</div>${chips('Disposição', MTS_DISP, MTS.disp, 'mtsDisp')}
    <label class="mts-nome"><input type="checkbox" ${MTS.nome?'checked':''} onchange="MTS.nome=this.checked;mtsDesenhaPrev()"> Mostrar meu primeiro nome</label>
    <div class="mts-acoes">
      <button class="btn btn-primary" id="mts-comp" onclick="mtsCompartilhar()">Compartilhar</button>
      <button class="btn btn-outline" onclick="mtsSalvar()">Salvar imagem</button>
    </div>
    ${video ? `<button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openMinhaConquistaShare()">Vídeo animado (${video.ext.toUpperCase()})</button>` : ''}
    <div class="mts-priv">O card mostra só o que está nele: sem e-mail, peso ou medidas.${MTS.classico ? ` · <a href="#" onclick="mtsClassico();return false">Modelo clássico</a>` : ''}</div>`;
  $('modal-back').classList.add('on');
  mtsDesenhaPrev(); mtsArrasto();
}
let _mtsDesenhando = false, _mtsDenovo = false;
async function mtsDesenhaPrev(){
  if(_mtsDesenhando){ _mtsDenovo = true; return; }
  _mtsDesenhando = true;
  try{ const cv = document.getElementById('mts-cv'); if(cv && MTS.d) await mtsDesenhar(cv, MTS.d, MTS); }catch(e){ console.log('card', e); }
  _mtsDesenhando = false;
  if(_mtsDenovo){ _mtsDenovo = false; mtsDesenhaPrev(); }
}
function mtsFmt(k){ MTS.fmt = k; _mtsSalvaPref('fmt', k); mtsAbrir(MTS.d, MTS.classico); }
function mtsEstilo(k){ MTS.estilo = k; _mtsSalvaPref('estilo', k); mtsAbrir(MTS.d, MTS.classico); }
function mtsDisp(k){ MTS.disp = k; _mtsSalvaPref('disp', k); mtsAbrir(MTS.d, MTS.classico); }
function mtsSemFoto(){ MTS.foto = null; MTS.zoom = 1; MTS.px = 0; MTS.py = 0; mtsAbrir(MTS.d, MTS.classico); }
function mtsFoto(ev){
  const f = ev.target.files && ev.target.files[0]; if(!f) return;
  const url = URL.createObjectURL(f); const img = new Image();
  img.onload = ()=>{
    // fotos enormes são reduzidas (memória do celular), sem perder qualidade para o card
    const max = 2400, k = Math.min(1, max/Math.max(img.width, img.height));
    let fonte = img;
    if(k < 1){ const c = document.createElement('canvas'); c.width = Math.round(img.width*k); c.height = Math.round(img.height*k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); fonte = c; }
    MTS.foto = fonte; MTS.zoom = 1; MTS.px = 0; MTS.py = 0; URL.revokeObjectURL(url);
    mtsAbrir(MTS.d, MTS.classico);
  };
  img.onerror = ()=>{ URL.revokeObjectURL(url); toast('Não consegui abrir essa imagem.'); };
  img.src = url;
}
// arrastar e pinçar a foto na prévia
function mtsArrasto(){
  const cv = document.getElementById('mts-cv'); if(!cv || !MTS.foto) return;
  const pts = new Map(); let ini = null;
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e=>{ cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, {x:e.clientX, y:e.clientY}); ini = { px:MTS.px, py:MTS.py, zoom:MTS.zoom, pts:new Map(pts) }; });
  cv.addEventListener('pointermove', e=>{
    if(!pts.has(e.pointerId) || !ini) return; pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
    const r = cv.getBoundingClientRect();
    if(pts.size === 1){
      const p0 = ini.pts.get(e.pointerId); if(!p0) return;
      MTS.px = Math.max(-1, Math.min(1, ini.px + (e.clientX - p0.x)/(r.width/2)));
      MTS.py = Math.max(-1, Math.min(1, ini.py + (e.clientY - p0.y)/(r.height/2)));
    } else if(pts.size === 2 && ini.pts.size === 2){
      const a = [...pts.values()], b = [...ini.pts.values()];
      const d1 = Math.hypot(a[0].x-a[1].x, a[0].y-a[1].y), d0 = Math.hypot(b[0].x-b[1].x, b[0].y-b[1].y) || 1;
      MTS.zoom = Math.max(1, Math.min(3, ini.zoom * d1/d0));
    }
    mtsDesenhaPrev();
  });
  const fim = e=>{ pts.delete(e.pointerId); ini = { px:MTS.px, py:MTS.py, zoom:MTS.zoom, pts:new Map(pts) }; };
  cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', fim);
  cv.addEventListener('wheel', e=>{ e.preventDefault(); MTS.zoom = Math.max(1, Math.min(3, MTS.zoom * (e.deltaY < 0 ? 1.06 : 0.94))); mtsDesenhaPrev(); }, { passive:false });
}
async function mtsArquivo(){
  const cv = document.createElement('canvas'); await mtsDesenhar(cv, MTS.d, MTS);
  const tipo = MTS.foto ? 'image/jpeg' : 'image/png';
  const blob = await new Promise(r=>cv.toBlob(r, tipo, 0.92));
  const nome = `metatreino-${MTS.d.tipo}-${MTS.fmt}.${MTS.foto?'jpg':'png'}`;
  return { blob, nome, tipo };
}
async function mtsCompartilhar(){
  const b = document.getElementById('mts-comp'); if(b){ b.disabled = true; b.textContent = 'Gerando…'; }
  try{
    const { blob, nome, tipo } = await mtsArquivo(); if(!blob) throw new Error('sem imagem');
    const file = new File([blob], nome, { type:tipo });
    if(navigator.canShare && navigator.canShare({ files:[file] })){
      try{ await navigator.share({ files:[file], text: MTS.d.texto || 'MetaTreino' }); }catch(e){ /* cancelou */ }
    } else { _mtsBaixa(blob, nome); toast('Este navegador não abre o compartilhamento direto: a imagem foi salva. Envie pela galeria.'); }
  }catch(e){ toast('Não foi possível gerar a imagem.'); }
  if(b){ b.disabled = false; b.textContent = 'Compartilhar'; }
}
async function mtsSalvar(){ try{ const { blob, nome } = await mtsArquivo(); _mtsBaixa(blob, nome); toast('Imagem salva (galeria ou downloads).'); }catch(e){ toast('Não foi possível salvar a imagem.'); } }
function _mtsBaixa(blob, nome){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(()=>{ try{ URL.revokeObjectURL(a.href); a.remove(); }catch(e){} }, 4000); }
function mtsClassico(){ const f = MTS.classico; if(typeof f === 'function'){ closeModal(); setTimeout(f, 60); } }

// ---------- ligação com os botões que já existiam ----------
const _shareWorkoutImageB26 = window.shareWorkoutImage;
window.shareWorkoutImage = function(histIdx){
  const mod = state.modules[state.active]; const x = ((mod && mod.history)||[])[histIdx];
  const d = mtsDeHistorico(x); if(!d) return _shareWorkoutImageB26.apply(this, arguments);
  mtsAbrir(d, ()=>_shareWorkoutImageB26(histIdx));
};
const _shareTrophyImageB26 = window.shareTrophyImage;
window.shareTrophyImage = function(id){ const d = mtsDeConquista(id); if(!d) return _shareTrophyImageB26.apply(this, arguments); mtsAbrir(d, ()=>_shareTrophyImageB26(id)); };
const _shareWeekImageB26 = window.shareWeekImage;
window.shareWeekImage = function(){ const d = mtsDeSemana(); if(!d) return _shareWeekImageB26.apply(this, arguments); mtsAbrir(d, ()=>_shareWeekImageB26()); };
if(typeof window.shareWeekSummary === 'function'){ const _sws = window.shareWeekSummary; window.shareWeekSummary = function(){ const d = mtsDeSemana(); if(!d) return _sws.apply(this, arguments); mtsAbrir(d, ()=>_sws()); }; }
const _shareEventoImagemB26 = window.shareEventoImagem;
window.shareEventoImagem = function(key){ const d = mtsDeDesafio(key); if(!d) return _shareEventoImagemB26.apply(this, arguments); mtsAbrir(d, ()=>_shareEventoImagemB26(key)); };
// conquista especial: a janela de vídeo ganha a opção de card com foto e formatos
mtGancho('openMinhaConquistaShare', { depois(){
  const mi = $('modal-inner'); if(!mi || mi.querySelector('#mts-esp')) return;
  const b = document.createElement('button'); b.id = 'mts-esp'; b.className = 'btn btn-outline btn-block'; b.style.marginTop = '8px';
  b.textContent = 'Card com foto e formatos (Stories, Feed, Quadrado)'; b.onclick = ()=>mtsAbrir(mtsDeEspecial(), ()=>openMinhaConquistaShare());
  const img = [...mi.querySelectorAll('button')].find(x=>/como imagem/i.test(x.textContent)); (img || mi.lastElementChild).after(b);
}});
// recordes (Progresso): cada linha passa a poder ser compartilhada
mtGancho('renderRecords', { depois(){
  document.querySelectorAll('#records-list .rec-row').forEach(r=>{
    if(r.dataset.mts) return; r.dataset.mts = '1';
    const t = r.querySelector('div > div'); const sub = r.querySelector('div > div + div'); const val = r.querySelector('.rec-val');
    if(!t || !val) return;
    const quando = (()=>{ const m = (sub && sub.textContent || '').match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? new Date(+m[3], +m[2]-1, +m[1]).getTime() : null; })();
    const corrida = /dist|ritmo|pedal|caminhada/i.test(t.textContent);
    const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'rec-share'; bt.setAttribute('aria-label', 'Compartilhar recorde: ' + t.textContent);
    bt.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>';
    bt.onclick = ()=>mtsAbrir(mtsDeRecorde(t.textContent, val.textContent.trim(), quando, corrida));
    r.appendChild(bt);
  });
}});
// evolução de um exercício: botão de compartilhar no gráfico
mtGancho('openExProgress', { depois(exId){
  const mi = $('modal-inner'); if(!mi || mi.querySelector('#mts-evo')) return;
  const d = mtsDeEvolucao(exId); if(!d) return;
  const fechar = [...mi.querySelectorAll('button')].reverse().find(b=>/Fechar/.test(b.textContent));
  const b = document.createElement('button'); b.id = 'mts-evo'; b.className = 'btn btn-outline btn-block'; b.style.marginTop = '10px';
  b.textContent = 'Compartilhar minha evolução'; b.onclick = ()=>mtsAbrir(mtsDeEvolucao(exId));
  if(fechar) fechar.before(b); else mi.appendChild(b);
}});

Object.assign(window, { MTS, mtsAbrir, mtsDesenhar, mtsDesenhaPrev, mtsFmt, mtsEstilo, mtsDisp, mtsFoto, mtsSemFoto, mtsCompartilhar, mtsSalvar, mtsClassico,
  mtsDeHistorico, mtsDeConquista, mtsDeEspecial, mtsDeDesafio, mtsDeSemana, mtsDeRecorde, mtsDeEvolucao });

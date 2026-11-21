
// =====================================================================
// 57. Beta 54 — Integrações e atividades: importar GPX, TCX e FIT
// =====================================================================
// Onde fica: Progresso › Histórico › "Integrações e atividades" (a área própria) e, como atalho, o
// "Registrar atividade" de Treinos ("Importar do relógio"). As duas abrem a MESMA tela (openIntegracoes).
//
// Como entra no app (nada de sistema paralelo):
//   • corrida, caminhada e bike → state.modules.run.history (o mesmo lugar do registro manual), com os
//     campos de sempre (duration, distance, pace, activity) + "imp" com o que o arquivo trouxe a mais;
//     daí seguem para histórico, gráficos, recordes, conquistas, calorias do dia e Meta Assistente.
//   • musculação → state.modules.lift.history + state.progress (as séries confirmadas pelo aluno), com
//     recordes pelas mesmas regras do registro manual. Sem séries no arquivo, só duração, FC e calorias.
// Privacidade e armazenamento: na nuvem vão só números (resumo, parciais e uma série resumida de ~80
// pontos). O percurso GPS e o arquivo original ficam SÓ neste aparelho (IndexedDB) e somem ao excluir.
// Leitura: GPX e TCX com o leitor de XML do navegador; FIT com fit-file-parser (MIT), carregado só na
// hora de importar (fit-parser.min.js, ~63 KB compactado).
// Integrações automáticas futuras chamam a mesma porta de entrada: atvSalvar(A, { origem }).

const ATV_MAX_MB = 25;
const ATV_FONTES = [
  { k:'garmin', nome:'Garmin Connect', arq:'Na web: abra a atividade › engrenagem › Exportar original (FIT) ou Exportar para TCX/GPX.', auto:'Exige o Garmin Connect Developer Program (aprovação da Garmin para empresas) e um servidor para as credenciais.' },
  { k:'amazfit', nome:'Amazfit / Zepp', arq:'App Zepp: abra a atividade › ••• › Exportar dados › GPX, TCX ou FIT (as opções dependem da atividade).', auto:'A Zepp libera a API só para empresas parceiras aprovadas; não há acesso aberto para apps.' },
  { k:'strava', nome:'Strava', arq:'Na web: abra a atividade › ••• › Exportar GPX ou Exportar original.', auto:'API com OAuth: precisa de servidor para guardar o segredo e renovar o acesso, e os termos da Strava limitam alguns usos dos dados. Avaliar antes de ligar.' },
  { k:'coros', nome:'COROS', arq:'App COROS: abra a atividade › compartilhar/exportar › FIT, TCX ou GPX.', auto:'Tem conexão OAuth para apps e API para parceiros; precisa de servidor para o segredo.' },
  { k:'polar', nome:'Polar', arq:'Polar Flow na web: abra a sessão › Exportar sessão (TCX ou GPX).', auto:'API AccessLink com OAuth; precisa de servidor.' },
  { k:'suunto', nome:'Suunto', arq:'Veja no app Suunto se a atividade tem a opção de exportar o arquivo.', auto:'API só para parceiros aprovados.' },
  { k:'huawei', nome:'Huawei Saúde', arq:'O app não costuma exportar o arquivo direto; algumas pessoas usam o Strava como ponte.', auto:'Health Kit é para apps nativos (Android); não funciona num app web.' },
  { k:'apple', nome:'Apple Saúde', arq:'O Saúde não exporta um treino em GPX/TCX/FIT sozinho; apps como o Strava podem servir de ponte.', auto:'HealthKit só existe em app nativo para iPhone; um app web não consegue ler.' },
  { k:'android', nome:'Health Connect (Android)', arq:'Não exporta arquivos de treino.', auto:'API do Android só para apps nativos; um app web não consegue ler.' }
];

// ---------- 1. armazenamento local (percurso e arquivo original) ----------
function _atvDB(){
  return new Promise((ok, erro)=>{
    try{
      const r = indexedDB.open('mt-atividades', 1);
      r.onupgradeneeded = ()=>{ const db = r.result; if(!db.objectStoreNames.contains('itens')) db.createObjectStore('itens', { keyPath:'id' }); };
      r.onsuccess = ()=>ok(r.result); r.onerror = ()=>erro(r.error);
    }catch(e){ erro(e); }
  });
}
async function atvLocalGuarda(id, dados){ try{ const db = await _atvDB(); await new Promise((ok,erro)=>{ const tx = db.transaction('itens','readwrite'); tx.objectStore('itens').put(Object.assign({ id }, dados)); tx.oncomplete = ok; tx.onerror = ()=>erro(tx.error); }); return true; }catch(e){ return false; } }
async function atvLocalLe(id){ try{ const db = await _atvDB(); return await new Promise(ok=>{ const q = db.transaction('itens').objectStore('itens').get(id); q.onsuccess = ()=>ok(q.result || null); q.onerror = ()=>ok(null); }); }catch(e){ return null; } }
async function atvLocalApaga(id){ try{ const db = await _atvDB(); await new Promise(ok=>{ const tx = db.transaction('itens','readwrite'); tx.objectStore('itens').delete(id); tx.oncomplete = ok; tx.onerror = ok; }); }catch(e){} }

// ---------- 2. utilidades ----------
function _atvHav(a, b){
  const R = 6371000, r = Math.PI/180;
  const dLat = (b.lat - a.lat)*r, dLon = (b.lon - a.lon)*r;
  const s = Math.sin(dLat/2)**2 + Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.min(1, Math.sqrt(s)));
}
function _atvNum(v){ const n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : null; }
function _atvFmtDur(s){ s = Math.round(s || 0); const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), ss = s%60; return h ? `${h}h${String(m).padStart(2,'0')}` : `${m}:${String(ss).padStart(2,'0')}`; }
function _atvFmtPace(sKm){ if(!sKm || !isFinite(sKm)) return '—'; const m = Math.floor(sKm/60), s = Math.round(sKm%60); return s === 60 ? `${m+1}:00` : `${m}:${String(s).padStart(2,'0')}`; }
function _atvBr(v, d){ return (Math.round(v * 10**(d||0)) / 10**(d||0)).toFixed(d||0).replace('.', ','); }
async function _atvHash(buf){
  try{ if(window.crypto && crypto.subtle){ const h = await crypto.subtle.digest('SHA-256', buf); return [...new Uint8Array(h)].slice(0,12).map(b=>b.toString(16).padStart(2,'0')).join(''); } }catch(e){}
  let h = 0x811c9dc5; const u = new Uint8Array(buf); for(let i=0;i<u.length;i++){ h ^= u[i]; h = Math.imul(h, 0x01000193) >>> 0; } return 'f' + h.toString(16) + u.length.toString(16);
}
// Douglas-Peucker em graus (suficiente para desenhar o percurso)
function _atvSimplifica(pts, max){
  if(pts.length <= max) return pts;
  let tol = 0.00002, out = pts;
  const dp = (p, eps)=>{
    const keep = new Uint8Array(p.length); keep[0] = keep[p.length-1] = 1; const pilha = [[0, p.length-1]];
    while(pilha.length){ const [a,b] = pilha.pop(); let dm = 0, im = -1; const A = p[a], B = p[b];
      for(let i=a+1;i<b;i++){ const P = p[i]; const dx = B[1]-A[1], dy = B[0]-A[0]; const L = dx*dx+dy*dy || 1e-12; const t = Math.max(0, Math.min(1, ((P[1]-A[1])*dx + (P[0]-A[0])*dy)/L)); const d = Math.hypot(P[1]-(A[1]+t*dx), P[0]-(A[0]+t*dy)); if(d > dm){ dm = d; im = i; } }
      if(dm > eps && im > 0){ keep[im] = 1; pilha.push([a,im],[im,b]); } }
    return p.filter((_,i)=>keep[i]);
  };
  for(let k=0;k<12 && out.length > max;k++){ out = dp(pts, tol); tol *= 1.8; }
  return out;
}

// ---------- 3. leitura dos formatos ----------
function atvFormato(buf){
  const u = new Uint8Array(buf.slice(0, 64));
  if(u.length >= 12 && String.fromCharCode(u[8],u[9],u[10],u[11]) === '.FIT') return 'fit';
  if(u[0] === 0x1f && u[1] === 0x8b) return 'gzip';
  const txt = new TextDecoder('utf-8').decode(buf.slice(0, 4096)).replace(/^﻿/, '').trim();
  if(/<gpx[\s>]/i.test(txt)) return 'gpx';
  if(/<TrainingCenterDatabase[\s>]/i.test(txt)) return 'tcx';
  return null;
}
function _atvXml(buf){
  const txt = new TextDecoder('utf-8').decode(buf).replace(/^﻿/, '');
  const doc = new DOMParser().parseFromString(txt, 'application/xml');
  if(doc.getElementsByTagName('parsererror').length) throw { usuario:'O arquivo parece estar cortado ou corrompido (o conteúdo não fecha corretamente). Exporte de novo no app do relógio.' };
  return doc;
}
const _atvT = (el, nome)=>{ if(!el) return null; const l = el.getElementsByTagNameNS('*', nome); return l && l.length ? l[0] : null; };
const _atvTxt = (el, nome)=>{ const x = _atvT(el, nome); return x ? x.textContent.trim() : null; };
function _atvEsporteTexto(s){
  const t = mtNorm(String(s || ''));
  if(/run|corr|trail|treadmill|esteira|^9$/.test(t)) return 'corrida';
  if(/walk|camin|hik|trek|^10$/.test(t)) return 'caminhada';
  if(/bik|cycl|ciclis|ride|pedal|^1$|^2$/.test(t)) return 'bike';
  if(/strength|forca|muscul|weight|gym|training/.test(t)) return 'musculacao';
  return null;
}
function atvLeGPX(buf){
  const doc = _atvXml(buf);
  const pts = [...doc.getElementsByTagNameNS('*', 'trkpt')];
  const rtes = pts.length ? [] : [...doc.getElementsByTagNameNS('*', 'rtept')];
  const lista = pts.length ? pts : rtes;
  const pontos = lista.map(p=>{
    const t = Date.parse(_atvTxt(p, 'time') || ''); const ele = _atvNum(_atvTxt(p, 'ele'));
    return { t: isFinite(t) ? t : null, lat:_atvNum(p.getAttribute('lat')), lon:_atvNum(p.getAttribute('lon')), alt: ele, hr:_atvNum(_atvTxt(p, 'hr')), cad:_atvNum(_atvTxt(p, 'cad')) };
  }).filter(p=>p.lat != null && p.lon != null);
  const trk = _atvT(doc, 'trk');
  const tipo = _atvTxt(trk, 'type') || _atvTxt(doc, 'type');
  const criador = (doc.documentElement.getAttribute('creator') || '').trim();
  return { formato:'gpx', pontos, esporteOrig: tipo || '', esporte:_atvEsporteTexto(tipo), nome:_atvTxt(trk, 'name') || '', dispositivo: criador, soRota: !pts.length && !!rtes.length };
}
function atvLeTCX(buf){
  const doc = _atvXml(buf);
  const act = _atvT(doc, 'Activity'); if(!act) throw { usuario:'Este TCX não tem nenhuma atividade dentro (pode ser um percurso planejado). Exporte o treino realizado.' };
  const sportAttr = act.getAttribute('Sport') || '';
  const laps = [...act.getElementsByTagNameNS('*', 'Lap')];
  const pontos = [];
  laps.forEach(l=>[...l.getElementsByTagNameNS('*', 'Trackpoint')].forEach(tp=>{
    const t = Date.parse(_atvTxt(tp, 'Time') || '');
    pontos.push({ t: isFinite(t) ? t : null, lat:_atvNum(_atvTxt(tp, 'LatitudeDegrees')), lon:_atvNum(_atvTxt(tp, 'LongitudeDegrees')), alt:_atvNum(_atvTxt(tp, 'AltitudeMeters')),
      d:_atvNum(_atvTxt(tp, 'DistanceMeters')), hr:_atvNum(_atvTxt(_atvT(tp, 'HeartRateBpm'), 'Value')), cad:_atvNum(_atvTxt(tp, 'Cadence')) ?? _atvNum(_atvTxt(tp, 'RunCadence')), v:_atvNum(_atvTxt(tp, 'Speed')) });
  }));
  const voltas = laps.map(l=>({ inicio: Date.parse(l.getAttribute('StartTime') || '') || null, durS:_atvNum(_atvTxt(l, 'TotalTimeSeconds')), m:_atvNum(_atvTxt(l, 'DistanceMeters')), kcal:_atvNum(_atvTxt(l, 'Calories')),
    fcMed:_atvNum(_atvTxt(_atvT(l, 'AverageHeartRateBpm'), 'Value')), fcMax:_atvNum(_atvTxt(_atvT(l, 'MaximumHeartRateBpm'), 'Value')), vMax:_atvNum(_atvTxt(l, 'MaximumSpeed')) }));
  const soma = k=>voltas.reduce((t,v)=>t + (v[k] || 0), 0);
  const inicio = Date.parse(_atvTxt(act, 'Id') || '') || voltas.map(v=>v.inicio).filter(Boolean)[0] || null;
  const fcs = voltas.filter(v=>v.fcMed && v.durS);
  return { formato:'tcx', pontos, voltas, esporteOrig: sportAttr, esporte: sportAttr === 'Running' ? 'corrida' : sportAttr === 'Biking' ? 'bike' : _atvEsporteTexto(_atvTxt(act, 'Notes')),
    inicio, timerS: soma('durS') || null, m: soma('m') || null, kcal: soma('kcal') || null,
    fcMed: fcs.length ? fcs.reduce((t,v)=>t + v.fcMed*v.durS, 0) / fcs.reduce((t,v)=>t + v.durS, 0) : null, fcMax: Math.max(0, ...voltas.map(v=>v.fcMax || 0)) || null,
    vMax: Math.max(0, ...voltas.map(v=>v.vMax || 0)) || null, dispositivo: (_atvTxt(_atvT(doc, 'Creator'), 'Name') || '').trim() };
}
let _atvFitPronto = null;
function atvCarregaFit(){
  if(window.MTFitParser) return Promise.resolve(window.MTFitParser);
  if(_atvFitPronto) return _atvFitPronto;
  _atvFitPronto = new Promise((ok, erro)=>{
    const s = document.createElement('script'); s.src = './fit-parser.min.js?v=' + (typeof APP_VERSION !== 'undefined' ? APP_VERSION : '1'); s.async = true;
    s.onload = ()=>window.MTFitParser ? ok(window.MTFitParser) : erro(new Error('fit'));
    s.onerror = ()=>{ _atvFitPronto = null; erro({ usuario:'Não consegui abrir o leitor de arquivos FIT. Verifique a internet e tente de novo (depois da primeira vez ele funciona sem internet).' }); };
    document.head.appendChild(s);
  });
  return _atvFitPronto;
}
const ATV_FIT_SPORT = { running:'corrida', walking:'caminhada', hiking:'caminhada', cycling:'bike', e_biking:'bike', training:'musculacao', fitness_equipment:'musculacao' };
async function atvLeFIT(buf){
  const FitParser = await atvCarregaFit();
  const d = await new Promise((ok, erro)=>{
    try{
      const p = new FitParser({ force:true, speedUnit:'m/s', lengthUnit:'m', temperatureUnit:'celsius', mode:'list', elapsedRecordField:true });
      p.parse(buf, (e, dados)=>e ? erro({ usuario:'Este arquivo FIT está corrompido ou incompleto. Exporte de novo no app do relógio.' }) : ok(dados));
    }catch(e){ erro({ usuario:'Este arquivo FIT está corrompido ou incompleto. Exporte de novo no app do relógio.' }); }
  });
  const s = (d.sessions || [])[0] || {};
  const tsv = v=>{ const t = v instanceof Date ? v.getTime() : Date.parse(v); return isFinite(t) ? t : null; };
  const pontos = (d.records || []).map(r=>({ t:tsv(r.timestamp), lat:_atvNum(r.position_lat), lon:_atvNum(r.position_long), alt:_atvNum(r.enhanced_altitude ?? r.altitude), d:_atvNum(r.distance),
    hr:_atvNum(r.heart_rate), cad:_atvNum(r.cadence), v:_atvNum(r.enhanced_speed ?? r.speed), pw:_atvNum(r.power) })).filter(p=>p.t);
  const sub = String(s.sub_sport || ''), sp = String(s.sport || '');
  let esporte = ATV_FIT_SPORT[sp] || null;
  if(sp === 'training' && !/strength/.test(sub) && !(d.sets||[]).some(x=>x.set_type === 'active')) esporte = null;
  if(/strength/.test(sub)) esporte = 'musculacao';
  if((d.sets||[]).some(x=>x.set_type === 'active' && x.repetitions)) esporte = 'musculacao';
  const series = (d.sets || []).map(x=>({ tipo: x.set_type === 'rest' ? 'descanso' : 'ativa', reps:_atvNum(x.repetitions), kg:_atvNum(x.weight), durS:_atvNum(x.duration),
    cat: Array.isArray(x.category) ? x.category[0] : x.category, sub: Array.isArray(x.category_subtype) ? x.category_subtype[0] : x.category_subtype, inicio:tsv(x.start_time) }));
  const fid = (d.file_ids || [])[0] || d.file_id || {}; const dev = (d.device_infos || []).find(x=>x.device_index === 'creator' || x.device_index === 0) || {};
  const disp = [fid.manufacturer || dev.manufacturer, fid.garmin_product || fid.product_name || dev.product_name || ''].filter(Boolean).join(' ');
  const voltas = (d.laps || []).map(l=>({ inicio:tsv(l.start_time), durS:_atvNum(l.total_timer_time), m:_atvNum(l.total_distance), fcMed:_atvNum(l.avg_heart_rate) }));
  return { formato:'fit', pontos, voltas, series, esporteOrig: [sp, sub].filter(Boolean).join(' / '), esporte, inicio:tsv(s.start_time), elapsedS:_atvNum(s.total_elapsed_time), timerS:_atvNum(s.total_timer_time),
    m:_atvNum(s.total_distance), kcal:_atvNum(s.total_calories), fcMed:_atvNum(s.avg_heart_rate), fcMax:_atvNum(s.max_heart_rate), vMed:_atvNum(s.enhanced_avg_speed ?? s.avg_speed),
    vMax:_atvNum(s.enhanced_max_speed ?? s.max_speed), subida:_atvNum(s.total_ascent), descida:_atvNum(s.total_descent), cadMed:_atvNum(s.avg_cadence) ?? _atvNum(s.avg_running_cadence), dispositivo: disp, subSport: sub };
}

// ---------- 4. cálculo (o que o app mostra e guarda) ----------
const ATV_MIN_V = { corrida:1.0, caminhada:0.5, bike:1.5, musculacao:0, outro:0.5 };
function atvCalcula(L, esporteForcado){
  const avisos = [];
  let P = (L.pontos || []).filter(p=>p.t).sort((a,b)=>a.t - b.t);
  if(P.length > 60000){ const passo = Math.ceil(P.length / 30000); P = P.filter((_,i)=>i % passo === 0); }
  const temGps = P.filter(p=>p.lat != null && p.lon != null && !(p.lat === 0 && p.lon === 0)).length >= 10;
  // distância acumulada: a do arquivo; sem ela, calcula pelo GPS
  let temD = P.filter(p=>p.d != null).length > P.length * 0.6;
  if(!temD && temGps){ let acc = 0, ant = null; P.forEach(p=>{ if(p.lat != null && p.lon != null){ if(ant) acc += _atvHav(ant, p); ant = p; } p.d = acc; }); temD = true; }
  if(temD){ let ult = 0; P.forEach(p=>{ if(p.d == null || p.d < ult) p.d = ult; ult = p.d; }); }
  const inicio = L.inicio || (P[0] && P[0].t) || null;
  const fimPts = P.length ? P[P.length-1].t : null;
  const elapsedS = L.elapsedS || (inicio && fimPts ? (fimPts - inicio)/1000 : null) || L.timerS || null;
  const m = L.m || (temD && P.length ? P[P.length-1].d : 0) || 0;
  let esporte = esporteForcado || L.esporte;
  if(!esporte){
    const v = elapsedS && m ? (m/1000) / (elapsedS/3600) : 0;
    esporte = (L.series||[]).some(s=>s.tipo === 'ativa') ? 'musculacao' : !m ? 'musculacao' : v < 7.2 ? 'caminhada' : v < 19 ? 'corrida' : 'bike';
    avisos.push(!m ? 'O arquivo não traz distância nem a modalidade: considerei treino de força. Confira abaixo.' : 'O arquivo não diz a modalidade; escolhi pela velocidade. Confira abaixo.');
  }
  // tempo em movimento: do relógio (FIT/TCX) ou pelos pontos
  let movS = L.timerS || null;
  if(!movS && P.length > 1 && temD){
    const vmin = ATV_MIN_V[esporte] || 0.5; movS = 0;
    for(let i=1;i<P.length;i++){ const dt = (P[i].t - P[i-1].t)/1000, dd = P[i].d - P[i-1].d; if(dt > 0 && dt <= 30 && dd/dt >= vmin) movS += dt; }
    if(movS < (elapsedS || 0) * 0.3) movS = elapsedS;
  }
  movS = movS || elapsedS || 0;
  const km = m / 1000;
  const fcs = P.map(p=>p.hr).filter(v=>v > 30 && v < 240);
  const fcMed = L.fcMed || (fcs.length ? fcs.reduce((a,b)=>a+b,0)/fcs.length : null);
  const fcMax = L.fcMax || (fcs.length ? Math.max(...fcs) : null);
  const cads = P.map(p=>p.cad).filter(v=>v > 0);
  let cad = L.cadMed || (cads.length ? cads.reduce((a,b)=>a+b,0)/cads.length : null);
  if(cad && (esporte === 'corrida' || esporte === 'caminhada') && cad < 125) cad *= 2;        // relógios gravam passadas de uma perna
  const alts = P.map(p=>p.alt).filter(v=>v != null);
  let subida = L.subida, descida = L.descida;
  if(subida == null && alts.length > 10){
    const suav = alts.map((_,i)=>{ const a = alts.slice(Math.max(0,i-2), i+3); return a.reduce((x,y)=>x+y,0)/a.length; });
    subida = 0; descida = 0; let ref = suav[0];
    suav.forEach(v=>{ if(v - ref >= 2){ subida += v - ref; ref = v; } else if(ref - v >= 2){ descida += ref - v; ref = v; } });
  }
  const velMed = movS && km ? km / (movS/3600) : null;
  let velMax = L.vMax ? L.vMax * 3.6 : null;
  if(!velMax && P.length > 5 && temD){ let best = 0; for(let i=5;i<P.length;i++){ const dt = (P[i].t - P[i-5].t)/1000; if(dt > 0 && dt <= 60){ const v = (P[i].d - P[i-5].d)/dt; if(v > best) best = v; } } velMax = best * 3.6 || null; }
  // parciais (por km; bike a cada 5 km)
  const passo = esporte === 'bike' ? 5000 : 1000; const parciais = [];
  if(temD && P.length > 2 && m >= passo){
    const tEm = alvo=>{ for(let i=1;i<P.length;i++){ if(P[i].d >= alvo){ const a = P[i-1], b = P[i]; const f = (alvo - a.d) / Math.max(1e-6, b.d - a.d); return a.t + f*(b.t - a.t); } } return null; };
    let tAnt = P[0].t;
    for(let alvo = passo; alvo <= m + 1; alvo += passo){ const t = tEm(alvo); if(t == null) break;
      const hrs = P.filter(p=>p.t > tAnt && p.t <= t && p.hr).map(p=>p.hr);
      parciais.push({ km: alvo/1000, s: Math.round((t - tAnt)/1000), fc: hrs.length ? Math.round(hrs.reduce((a,b)=>a+b,0)/hrs.length) : null }); tAnt = t; }
  }
  // melhores esforços (só corrida): menor tempo para cobrir 1, 5, 10 e 21,1 km dentro da atividade
  const melhores = {};
  if(esporte === 'corrida' && temD && P.length > 10){
    [1000, 5000, 10000, 21097.5].forEach(alvo=>{
      if(m < alvo) return; let j = 0, best = Infinity;
      for(let i=0;i<P.length;i++){ while(j < P.length && P[j].d - P[i].d < alvo) j++; if(j >= P.length) break;
        const a = P[j-1], b = P[j]; const f = (P[i].d + alvo - a.d) / Math.max(1e-6, b.d - a.d); const tFim = a.t + f*(b.t - a.t); const dur = (tFim - P[i].t)/1000; if(dur > 0 && dur < best) best = dur; }
      if(isFinite(best)) melhores[String(alvo === 21097.5 ? 21.1 : alvo/1000)] = Math.round(best);
    });
  }
  // série resumida (≈80 pontos) para gráficos
  const serie = [];
  if(P.length > 3){
    const n = Math.min(80, P.length), base = temD && m > 0 ? 'd' : 't'; const tot = base === 'd' ? m : (P[P.length-1].t - P[0].t);
    for(let b=0;b<n;b++){
      const de = tot*b/n, ate = tot*(b+1)/n;
      const grupo = P.filter(p=>{ const x = base === 'd' ? p.d : p.t - P[0].t; return x >= de && x < ate; }); if(grupo.length < 2) continue;
      const a = grupo[0], z = grupo[grupo.length-1]; const dt = (z.t - a.t)/1000, dd = (z.d||0) - (a.d||0);
      const hr = grupo.map(p=>p.hr).filter(Boolean); const al = grupo.map(p=>p.alt).filter(v=>v != null);
      serie.push([ Math.round((base === 'd' ? ate/1000 : ate/60000)*100)/100, dt > 0 && dd > 0 ? Math.round(dd/dt*36)/10 : null, hr.length ? Math.round(hr.reduce((x,y)=>x+y,0)/hr.length) : null, al.length ? Math.round(al.reduce((x,y)=>x+y,0)/al.length) : null ]);
    }
  }
  // validade para recordes
  let valido = true; const vKm = velMed || 0;
  const faixa = { corrida:[5, 26], caminhada:[2, 9.5], bike:[6, 65] }[esporte];
  if(faixa && km > 0 && (vKm < faixa[0] || vKm > faixa[1])){ valido = false; avisos.push(`A velocidade média (${_atvBr(vKm,1)} km/h) é estranha para ${esporte === 'bike' ? 'bike' : esporte}. A atividade entra no histórico, mas não conta para recordes.`); }
  if(temGps && P.length > 20){ const lim = esporte === 'bike' ? 30 : 12; let saltos = 0; for(let i=1;i<P.length;i++){ const dt = (P[i].t - P[i-1].t)/1000; if(dt > 0 && (P[i].d - P[i-1].d)/dt > lim) saltos++; } if(saltos > P.length*0.02){ valido = false; avisos.push('O GPS deu vários saltos neste arquivo. Os números entram no histórico, mas não contam para recordes.'); } }
  if(esporte !== 'musculacao' && km < 0.2){ valido = false; }
  const track = temGps ? _atvSimplifica(P.filter(p=>p.lat != null).map(p=>[Math.round(p.lat*1e5)/1e5, Math.round(p.lon*1e5)/1e5]), 400) : [];
  return { formato:L.formato, esporte, esporteOrig:L.esporteOrig || '', inicio, elapsedS: Math.round(elapsedS || movS || 0), movS: Math.round(movS || 0), km: Math.round(km*1000)/1000,
    fcMed: fcMed ? Math.round(fcMed) : null, fcMax: fcMax ? Math.round(fcMax) : null, cad: cad ? Math.round(cad) : null, subida: subida != null ? Math.round(subida) : null, descida: descida != null ? Math.round(descida) : null,
    velMed: velMed ? Math.round(velMed*10)/10 : null, velMax: velMax ? Math.round(velMax*10)/10 : null, kcal: L.kcal ? Math.round(L.kcal) : null, parciais, melhores, serie, track, temGps, temFc: !!fcMed, temAlt: alts.length > 10,
    series: L.series || [], voltas: L.voltas || [], dispositivo: (L.dispositivo || '').slice(0, 60), nome: L.nome || '', valido, avisos, pontos: P.length };
}

// ---------- 5. musculação: séries do arquivo → exercícios da biblioteca ----------
const ATV_CAT_EX = {
  bench_press:'Supino Reto com Barra', curl:'Rosca Direta com Barra', triceps_extension:'Tríceps na Polia com Barra', squat:'Agachamento Livre com Barra', deadlift:'Levantamento Terra',
  lunge:'Afundo com Halteres', leg_curl:'Mesa Flexora', row:'Remada Curvada com Barra', pull_up:'Puxada Frontal no Pulley', shoulder_press:'Desenvolvimento com Halteres',
  lateral_raise:'Elevação Lateral com Halteres', calf_raise:'Panturrilha em Pé na Máquina', crunch:'Abdominal Crunch', plank:'Prancha (Plank)', push_up:'Flexão de Braço',
  hip_raise:'Elevação Pélvica (Hip Thrust)', shrug:'Encolhimento com Barra', flye:'Crucifixo com Halteres', leg_raise:'Elevação de Pernas', hip_stability:'Cadeira Abdutora',
  carry:'Farmer Walk (caminhada carregada)', chop:'Pallof Press (anti-rotação)', hyperextension:'Superman', sit_up:'Abdominal Crunch', core:'Prancha (Plank)'
};
const ATV_CAT_NOME = { bench_press:'Supino', curl:'Rosca', triceps_extension:'Tríceps', squat:'Agachamento', deadlift:'Levantamento terra', lunge:'Afundo', leg_curl:'Flexora', row:'Remada', pull_up:'Puxada / barra',
  shoulder_press:'Desenvolvimento', lateral_raise:'Elevação lateral', calf_raise:'Panturrilha', crunch:'Abdominal', plank:'Prancha', push_up:'Flexão', hip_raise:'Elevação pélvica', shrug:'Encolhimento', flye:'Crucifixo', leg_raise:'Elevação de pernas', unknown:'Exercício sem nome' };
function atvAgrupaSeries(series){
  const grupos = [];
  (series || []).filter(s=>s.tipo === 'ativa' && (s.reps || s.durS)).forEach(s=>{
    const chave = String(s.cat || 'unknown') + '|' + (s.sub == null ? '' : s.sub);
    let g = grupos[grupos.length-1];
    if(!g || g.chave !== chave){ g = grupos.find(x=>x.chave === chave && x.aberto) || null; }
    if(!g){ const ex = ATV_CAT_EX[s.cat]; g = { chave, cat:s.cat || 'unknown', nomeArq: ATV_CAT_NOME[s.cat] || String(s.cat || 'Exercício').replace(/_/g, ' '), exId: ex ? slug(ex) : '', series:[], aberto:true }; grupos.push(g); }
    g.series.push({ reps: Math.round(s.reps || 0), kg: s.kg != null ? Math.round(s.kg*2)/2 : 0, aq:false });
  });
  return grupos;
}

// ---------- 6. duplicidade ----------
function _atvChave(A){ return `${A.esporte}|${Math.round((A.inicio||0)/60000)}|${Math.round((A.km||0)*10)}|${Math.round((A.movS||0)/60)}`; }
function _atvDia(ts){ const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime(); }
function atvTodas(){
  const out = [];
  ['run','lift'].forEach(mk=>{ (((state.modules[mk]||{}).history)||[]).forEach((x,idx)=>out.push({ mk, idx, x })); });
  return out;
}
function atvDuplicata(A, hash){
  const ch = _atvChave(A);
  const imp = atvTodas().find(({x})=>x.imp && (x.imp.hash === hash || x.imp.chave === ch || (x.imp.esporte === A.esporte && Math.abs((x.imp.inicio||0) - A.inicio) < 120000)));
  if(imp) return { tipo:'importada', alvo:imp };
  const tipoRun = { corrida:x=>!x.activity || x.activity === 'corrida', caminhada:x=>x.activity === 'caminhada', bike:x=>x.activity === 'bike' }[A.esporte];
  const cand = atvTodas().filter(({mk, x})=>!x.imp && _atvDia(x.at) === _atvDia(A.inicio) &&
    (A.esporte === 'musculacao' ? mk === 'lift' : mk === 'run' && tipoRun && tipoRun(x) && (!x.distance || !A.km || Math.abs(x.distance - A.km) <= Math.max(0.5, A.km*0.25))));
  return cand.length ? { tipo:'manual', alvo:cand[0] } : null;
}

// ---------- 7. tela "Integrações e atividades" ----------
function openIntegracoes(){
  const mi = $('modal-inner'); mi.classList.remove('modal-video','modal-ex','short'); mi.dataset.tela = 'integracoes';
  const lista = atvTodas().filter(({x})=>x.imp).sort((a,b)=>b.x.at - a.x.at);
  const log = (state.importLog || []).slice(-8).reverse();
  const ESP = { corrida:'🏃', caminhada:'🚶', bike:'🚴', musculacao:'🏋️', outro:'⌚' };
  mi.innerHTML = `<div id="integ-tela"><h3>⌚ Integrações e atividades</h3>
    <p class="integ-p">Traga treinos do relógio, do ciclocomputador ou de outros apps. Eles entram no seu histórico, nos gráficos, nos recordes, nas calorias do dia e nas análises do Meta Assistente.</p>
    <label class="btn btn-primary btn-block integ-up"><input type="file" id="integ-arq" multiple hidden onchange="atvEscolheu(this)">📥 Importar atividade (GPX, TCX ou FIT)</label>
    <p class="integ-mini">Você não precisa saber o formato: o app reconhece sozinho. Até ${ATV_MAX_MB} MB por arquivo.</p>
    <details class="integ-sec"><summary>O que cada formato traz</summary>
      <div class="integ-fmt"><b>GPX — percurso e GPS</b><span>Trajeto, distância, coordenadas e, quando houver, altitude e horário. Bom para corrida, caminhada e bike.</span></div>
      <div class="integ-fmt"><b>TCX — dados de treino</b><span>Duração, distância, ritmo/velocidade, frequência cardíaca, voltas e, às vezes, cadência.</span></div>
      <div class="integ-fmt"><b>FIT — dados esportivos completos</b><span>O mais completo: frequência cardíaca, ritmo, altitude, cadência, voltas e, em alguns relógios, os exercícios de musculação com séries, repetições e cargas.</span></div>
      <p class="integ-mini">O que vem em cada arquivo depende do relógio, da modalidade e das configurações. O app mostra só o que encontrar, sem inventar nada.</p></details>
    <details class="integ-sec"><summary>Como exportar do seu relógio ou app</summary>${ATV_FONTES.map(f=>`<div class="integ-fmt"><b>${f.nome}</b><span>${f.arq}</span></div>`).join('')}</details>
    <details class="integ-sec"><summary>Sincronização automática (futuro)</summary>
      <p class="integ-mini">Hoje a importação é por arquivo, e ela continua valendo mesmo depois que existirem conexões automáticas. Situação de cada plataforma:</p>
      ${ATV_FONTES.map(f=>`<div class="integ-fmt"><b>${f.nome}</b><span>${f.auto}</span></div>`).join('')}</details>
    <div class="integ-priv">🔒 O percurso GPS e o arquivo original ficam só neste aparelho. Na sua conta vão os números (distância, tempos, frequência cardíaca, parciais). Excluir a atividade apaga tudo.</div>
    <div class="section-lbl" style="margin:14px 0 6px">Atividades importadas (${lista.length})</div>
    ${lista.length ? lista.slice(0, 30).map(({mk, idx, x})=>`<button type="button" class="integ-item" onclick="openAtividade('${mk}',${idx})"><span class="ii-ico">${ESP[x.imp.esporte] || '⌚'}</span><span class="ii-tx"><b>${mtEsc(String(x.name||'').replace(/^[^\wÀ-ú]+/,''))}</b><small>${new Date(x.at).toLocaleDateString('pt-BR')} · ${x.imp.esporte === 'musculacao' ? `${x.duration} min` : `${_atvBr(x.distance||0, 2)} km · ${_atvFmtDur((x.duration||0)*60)}`} · ${String(x.imp.fmt).toUpperCase()}</small></span><span class="ii-seta">›</span></button>`).join('') : '<p class="integ-mini">Nenhuma ainda.</p>'}
    ${(()=>{ const ids = new Set(lista.map(({x})=>x.imp.id)); const antigas = (state.importLog||[]).filter(l=>l.ok && l.id && !ids.has(l.id) && !/complement/i.test(l.res)).length;
      return antigas ? `<p class="integ-mini">📦 ${antigas === 1 ? '1 atividade importada tem' : antigas + ' atividades importadas têm'} mais de ${HISTORY_RETENTION_DAYS} dias e ${antigas === 1 ? 'está' : 'estão'} no <a href="#" onclick="arqAbrirHistorico();return false">Histórico completo</a>.</p>` : ''; })()}
    ${log.length ? `<details class="integ-sec"><summary>Histórico técnico de importações</summary><p class="integ-mini">Cada arquivo enviado e o resultado. Toque para abrir a atividade.</p>${log.map(l=>{ const a = l.id ? atvTodas().find(({x})=>x.imp && x.imp.id === l.id) : null;
      const tx = `<b>${mtEsc(l.arq)}</b><small>${new Date(l.em).toLocaleString('pt-BR')} · ${mtEsc(l.res)}${l.ok && l.id && !a ? ' · no Histórico completo' : ''}</small>`;
      return a ? `<button type="button" class="integ-log ok integ-log-btn" onclick="openAtividade('${a.mk}',${a.idx})">${tx}<span class="ii-seta">›</span></button>` : `<div class="integ-log ${l.ok?'ok':'erro'}">${tx}</div>`; }).join('')}</details>` : ''}
    <button type="button" class="integ-manual" onclick="openActivityLog()">Sem relógio? <b>Registrar uma atividade à mão</b> ›</button>
    <button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button></div>`;
  $('modal-back').classList.add('on');
}
function _atvLog(arq, ok, res, id){ const l = { arq:String(arq||'arquivo').slice(0,60), ok, res:String(res).slice(0,140), em:Date.now() }; if(id) l.id = id; state.importLog = (state.importLog || []).concat(l).slice(-30); }

// ---------- 8. importar: fila de arquivos → prévia → salvar ----------
let _atvFila = [], _atvAtual = null, _atvComemora = false;
function atvEscolheu(inp){ const fs = [...(inp.files || [])]; inp.value = ''; if(!fs.length) return; _atvFila = fs; atvProximo(); }
async function atvProximo(){
  const f = _atvFila.shift();
  if(!f){
    _atvAtual = null;
    // Beta 55: conquista desbloqueada pela importação → fecha a tela para a janela de conquistas aparecer
    // (a mesma do fim de um registro manual). Sem conquista nova, volta para Integrações.
    const cel = _atvComemora && ((typeof awardQueue !== 'undefined' && awardQueue.length) || (state.conqPend||[]).some(p=>!p.cel && p.at >= (window.__mtRegEm||0) - 1000));
    _atvComemora = false;
    if(cel){ closeModal(); try{ if(state.ui && state.ui.tab) goTab(state.ui.tab); }catch(e){} return; }
    return openIntegracoes();
  }
  const mi = $('modal-inner'); mi.innerHTML = `<div class="integ-proc"><div class="integ-spin"></div><b>Lendo ${mtEsc(f.name)}…</b><small>${_atvFila.length ? `mais ${_atvFila.length} na fila` : ''}</small></div>`;
  try{
    const r = await atvProcessaArquivo(f);
    _atvAtual = r; atvPrevia();
  }catch(e){
    const msg = (e && e.usuario) || 'Não consegui ler este arquivo. Confira se é GPX, TCX ou FIT exportado do relógio ou do app.';
    _atvLog(f.name, false, msg); saveData();
    mi.innerHTML = `<h3>⚠️ Não deu para importar</h3><p class="integ-p"><b>${mtEsc(f.name)}</b></p><p class="integ-p">${mtEsc(msg)}</p>
      <button class="btn btn-primary btn-block" onclick="atvProximo()">${_atvFila.length ? 'Próximo arquivo' : 'Voltar'}</button>`;
  }
}
async function atvProcessaArquivo(f){
  if(f.size > ATV_MAX_MB*1024*1024) throw { usuario:`O arquivo tem ${_atvBr(f.size/1048576,1)} MB; o limite é ${ATV_MAX_MB} MB.` };
  if(!f.size) throw { usuario:'O arquivo está vazio.' };
  const buf = await f.arrayBuffer();
  const fmt = atvFormato(buf);
  if(fmt === 'gzip') throw { usuario:'O arquivo está compactado (.gz). Descompacte e envie o GPX, TCX ou FIT de dentro.' };
  if(!fmt) throw { usuario:'Este arquivo não é GPX, TCX nem FIT. Exporte a atividade de novo escolhendo um desses formatos.' };
  const L = fmt === 'fit' ? await atvLeFIT(buf) : fmt === 'tcx' ? atvLeTCX(buf) : atvLeGPX(buf);
  if(L.soRota) throw { usuario:'Este GPX é só um percurso planejado (rota), sem a data e o horário do treino. Exporte a atividade realizada.' };
  const A = atvCalcula(L);
  if(!A.inicio) throw { usuario:'O arquivo não tem a data e o horário da atividade. Exporte a atividade realizada (não o percurso).' };
  if(A.inicio > Date.now() + 86400000 || A.inicio < Date.parse('2000-01-01')) throw { usuario:'A data gravada no arquivo não faz sentido. Confira a data e a hora do relógio e exporte de novo.' };
  if(A.esporte !== 'musculacao' && !A.km && !A.movS) throw { usuario:'O arquivo não tem distância nem tempo suficientes para registrar uma atividade.' };
  if((A.elapsedS || A.movS) < 60) throw { usuario:'A atividade tem menos de 1 minuto: não há dados suficientes para registrar.' };
  const hash = await _atvHash(buf);
  return { arq:f.name, tamanho:f.size, buf: f.size <= 8*1024*1024 ? buf : null, L, A, hash, grupos: A.esporte === 'musculacao' ? atvAgrupaSeries(A.series) : [], dup: atvDuplicata(A, hash) };
}
function _atvExOpcoes(sel){
  return `<option value="">Não salvar este exercício</option>` + EX_BANK.map(c=>`<optgroup label="${mtEsc(c.name)}">${c.items.map(i=>`<option value="${slug(i.name)}" ${slug(i.name)===sel?'selected':''}>${mtEsc(i.name)}</option>`).join('')}</optgroup>`).join('');
}
function _atvTreinoDoDia(esporte, ts){
  const mk = esporte === 'musculacao' ? 'lift' : 'run'; const mod = state.modules[mk];
  if(!mod || !mod.plan || (esporte !== 'corrida' && esporte !== 'musculacao')) return null;
  // Beta 55: só atividades desta semana do plano. Um treino de força de 5 meses atrás virava "Treino B — Costas
  // + Bíceps" só porque caiu numa terça.
  const ini = (typeof planStartTs === 'function' && planStartTs(mod)) || mod.createdAt || 0;
  if(ts < Date.now() - 7*86400000 || (ini && ts < _atvDia(ini))) return null;
  const di = (new Date(ts).getDay() || 7);
  const w = (mod.plan.workouts || []).find(x=>x.dayIdx === di); if(!w) return null;
  const feito = (mod.history || []).some(h=>h.id === w.k && _atvDia(h.at) === _atvDia(ts));
  return feito ? null : w;
}
function atvPrevia(){
  const R = _atvAtual; if(!R) return; const A = R.A; const mi = $('modal-inner');
  const dt = new Date(A.inicio); const loc = new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
  const musc = A.esporte === 'musculacao', bike = A.esporte === 'bike';
  const ritmo = !musc && A.km ? (bike ? `${_atvBr(A.velMed||0,1)} km/h` : `${_atvFmtPace(A.movS/A.km)} /km`) : '—';
  const card = (r, v)=>v ? `<div class="ip-c"><small>${r}</small><b>${v}</b></div>` : '';
  const falta = [!A.temFc && 'frequência cardíaca', !musc && !A.temGps && 'percurso GPS', !musc && !A.temAlt && 'altitude', musc && !R.grupos.length && 'séries e exercícios'].filter(Boolean);
  const w = _atvTreinoDoDia(A.esporte, A.inicio);
  const dup = R.dup;
  const comp = musc ? '' : atvComparacao(A);
  mi.innerHTML = `<div id="integ-previa"><h3>Conferir antes de salvar</h3>
    <p class="integ-mini">${mtEsc(R.arq)} · ${A.formato.toUpperCase()}${A.dispositivo ? ` · ${mtEsc(A.dispositivo)}` : ''}</p>
    ${dup ? `<div class="ip-dup">${dup.tipo === 'importada' ? `⚠️ <b>Esta atividade já foi importada</b> (${new Date(dup.alvo.x.at).toLocaleString('pt-BR')}). Salvar de novo contaria em dobro.` : `⚠️ <b>Parece que você já registrou esta atividade à mão</b>: "${mtEsc(String(dup.alvo.x.name||'').replace(/^[^\wÀ-ú]+/,''))}" em ${new Date(dup.alvo.x.at).toLocaleString('pt-BR')}${dup.alvo.x.distance ? ` (${_atvBr(dup.alvo.x.distance,2)} km)` : ''}.`}</div>` : ''}
    <div class="ip-grid">
      <label class="ip-campo"><small>Modalidade</small><select id="ip-esp" onchange="atvTrocaEsporte(this.value)">${[['corrida','Corrida'],['caminhada','Caminhada'],['bike','Bike'],['musculacao','Musculação / força']].map(([k,n])=>`<option value="${k}" ${k===A.esporte?'selected':''}>${n}</option>`).join('')}</select></label>
      <label class="ip-campo"><small>Início</small><input type="datetime-local" id="ip-ini" value="${loc}"></label>
    </div>
    <div class="ip-cards">${card('Duração', _atvFmtDur(A.movS))}${A.elapsedS > A.movS + 60 ? card('Tempo total', _atvFmtDur(A.elapsedS)) : ''}${!musc ? card('Distância', `${_atvBr(A.km,2)} km`) : ''}${!musc ? card(bike ? 'Velocidade média' : 'Ritmo médio', ritmo) : ''}
      ${card('FC média', A.fcMed && `${A.fcMed} bpm`)}${card('FC máxima', A.fcMax && `${A.fcMax} bpm`)}${card(bike ? 'Cadência' : 'Cadência', A.cad && `${A.cad} ${bike ? 'rpm' : 'passos/min'}`)}${card('Subida', A.subida != null && A.temAlt !== false && `${A.subida} m`)}${card('Calorias (relógio)', A.kcal && `${A.kcal} kcal`)}
      ${!musc && A.melhores['5'] ? card('Melhor 5 km', _atvFmtDur(A.melhores['5'])) : ''}${!musc && A.melhores['1'] ? card('Melhor 1 km', _atvFmtDur(A.melhores['1'])) : ''}${bike && A.velMax ? card('Velocidade máx.', `${_atvBr(A.velMax,1)} km/h`) : ''}</div>
    ${falta.length ? `<p class="integ-mini">Este arquivo não trouxe: ${falta.join(', ')}.</p>` : ''}
    ${A.avisos.map(a=>`<p class="ip-aviso">${mtEsc(a)}</p>`).join('')}
    ${A.inicio < Date.now() - HISTORY_RETENTION_DAYS*86400000 ? `<p class="integ-mini">📦 Esta atividade tem mais de ${HISTORY_RETENTION_DAYS} dias. Ela conta para os totais, recordes e conquistas e fica guardada no <b>Histórico completo</b> (arquivo anual), como os seus outros treinos antigos — não na lista dos últimos ${HISTORY_RETENTION_DAYS} dias.</p>` : ''}
    ${comp ? `<p class="ip-comp">${comp}</p>` : ''}
    ${A.track.length ? `<div class="ip-mapa">${atvPercursoSVG(A.track)}</div>` : ''}
    ${A.parciais.length ? `<details class="integ-sec"><summary>Parciais (${A.parciais.length})</summary>${atvParciaisHTML(A)}</details>` : ''}
    ${musc ? atvMuscHTML(R) : ''}
    ${w ? `<label class="ip-plano"><input type="checkbox" id="ip-plano" checked><span>Contar como o treino do plano deste dia: <b>${mtEsc(w.name)}</b></span></label>` : ''}
    ${dup && dup.tipo === 'manual' ? `<div class="ip-op"><label><input type="radio" name="ip-dup" value="complementar" checked> <b>Complementar o registro existente</b> com os dados do arquivo (não duplica)</label>
      <label><input type="radio" name="ip-dup" value="separado"> São atividades diferentes: salvar como nova</label></div>` : ''}
    ${dup && dup.tipo === 'importada' ? '' : `<button class="btn btn-primary btn-block" style="margin-top:12px" onclick="atvConfirma()">✅ Salvar atividade</button>`}
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="atvCancela()">${dup ? (dup.tipo === 'importada' ? 'Fechar' : 'Manter só o registro existente') : 'Cancelar'}</button></div>`;
}
function atvTrocaEsporte(e){ const R = _atvAtual; if(!R) return; R.A = atvCalcula(R.L, e); R.grupos = e === 'musculacao' ? atvAgrupaSeries(R.A.series) : []; R.dup = atvDuplicata(R.A, R.hash); atvPrevia(); }
function atvCancela(){ if(_atvAtual) _atvLog(_atvAtual.arq, false, _atvAtual.dup && _atvAtual.dup.tipo === 'importada' ? 'já importada antes (não duplicou)' : 'cancelado'); saveData(); atvProximo(); }
function atvMuscHTML(R){
  if(!R.grupos.length) return `<p class="integ-mini">O arquivo não tem os exercícios: entram só a duração${R.A.fcMed ? ', a frequência cardíaca' : ''}${R.A.kcal ? ' e as calorias' : ''}. Se quiser, registre as séries depois em Treinos.</p>`;
  return `<div class="section-lbl" style="margin:12px 0 4px">Exercícios encontrados no arquivo</div>
    <p class="integ-mini">Confira cada exercício. Marque as séries de aquecimento: elas não entram na evolução de carga. Se o exercício já tiver registro neste dia, o seu registro é mantido.</p>
    ${R.grupos.map((g,gi)=>`<div class="ip-ex"><div class="ip-ex-t"><b>${mtEsc(g.nomeArq)}</b><select onchange="_atvAtual.grupos[${gi}].exId=this.value">${_atvExOpcoes(g.exId)}</select></div>
      ${g.series.map((s,si)=>`<label class="ip-serie"><span>${si+1}ª</span><span>${s.reps} reps</span><span>${s.kg ? _atvBr(s.kg, s.kg % 1 ? 1 : 0) + ' kg' : 'sem carga'}</span><span class="ip-aq"><input type="checkbox" ${s.aq?'checked':''} onchange="_atvAtual.grupos[${gi}].series[${si}].aq=this.checked"> aquecimento</span></label>`).join('')}</div>`).join('')}`;
}
function atvParciaisHTML(A){
  const bike = A.esporte === 'bike';
  return `<div class="ip-parc"><div class="ip-parc-h"><span>${bike ? 'Trecho' : 'Km'}</span><span>${bike ? 'Velocidade' : 'Ritmo'}</span><span>FC</span></div>${A.parciais.map(p=>`<div><span>${_atvBr(p.km, p.km % 1 ? 1 : 0)}</span><span>${bike ? _atvBr((A.esporte==='bike'?5:1)/(p.s/3600),1) + ' km/h' : _atvFmtPace(p.s)}</span><span>${p.fc || '—'}</span></div>`).join('')}</div>`;
}
function atvPercursoSVG(tr){
  if(!tr || tr.length < 2) return '';
  const lats = tr.map(p=>p[0]), lons = tr.map(p=>p[1]); const la0 = Math.min(...lats), la1 = Math.max(...lats), lo0 = Math.min(...lons), lo1 = Math.max(...lons);
  const k = Math.cos((la0+la1)/2*Math.PI/180); const w = Math.max(1e-6, (lo1-lo0)*k), h = Math.max(1e-6, la1-la0); const s = 280/Math.max(w, h);
  const W = Math.max(40, w*s), H = Math.max(40, h*s);
  const pts = tr.map(([la,lo])=>`${((lo-lo0)*k*s+10).toFixed(1)},${((la1-la)*s+10).toFixed(1)}`).join(' ');
  const [a, z] = [pts.split(' ')[0], pts.split(' ').pop()];
  return `<svg viewBox="0 0 ${(W+20).toFixed(0)} ${(H+20).toFixed(0)}" class="ip-svg" role="img" aria-label="Percurso"><polyline points="${pts}" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${a.split(',')[0]}" cy="${a.split(',')[1]}" r="5" fill="#3ecf8e"/><circle cx="${z.split(',')[0]}" cy="${z.split(',')[1]}" r="5" fill="var(--text-strong,#fff)"/></svg>`;
}
// comparação honesta com atividades parecidas (mesma modalidade, distância ±25%, mín. 3 no histórico)
function atvComparacao(A){
  try{
    if(!A.km || !A.movS) return '';
    const tipo = { corrida:x=>!x.activity || x.activity === 'corrida', caminhada:x=>x.activity === 'caminhada', bike:x=>x.activity === 'bike' }[A.esporte]; if(!tipo) return '';
    const ini = Date.now() - 90*86400000;
    const parecidas = (((state.modules.run||{}).history)||[]).filter(x=>tipo(x) && x.at >= ini && x.distance && x.duration && Math.abs(x.distance - A.km) <= A.km*0.25 && !(x.imp && x.imp.valido === false)
      && (!x.imp || x.imp.subida == null || A.subida == null || Math.abs((x.imp.subida/x.distance) - (A.subida/A.km)) < 15));
    if(parecidas.length < 3) return '';
    const media = parecidas.reduce((t,x)=>t + x.duration*60/x.distance, 0)/parecidas.length; const atual = A.movS/A.km; const dif = (media - atual)/media*100;
    if(Math.abs(dif) < 3) return `Em ${parecidas.length} atividades de distância parecida nos últimos 3 meses, esta ficou no seu ritmo de sempre.`;
    return A.esporte === 'bike' ? `Velocidade ${Math.abs(Math.round(dif))}% ${dif > 0 ? 'maior' : 'menor'} que a média das suas ${parecidas.length} pedaladas de distância parecida nos últimos 3 meses.`
      : `Ritmo ${Math.abs(Math.round(dif))}% ${dif > 0 ? 'mais rápido' : 'mais lento'} que a média das suas ${parecidas.length} atividades de distância parecida nos últimos 3 meses.`;
  }catch(e){ return ''; }
}
// salvar: a mesma porta de entrada para arquivo e, no futuro, sincronização
async function atvConfirma(){
  const R = _atvAtual; if(!R) return;
  const ini = Date.parse(($('ip-ini') || {}).value || ''); if(isFinite(ini) && Math.abs(ini - R.A.inicio) > 60000){ R.A.inicio = ini; }
  const plano = $('ip-plano') && $('ip-plano').checked ? _atvTreinoDoDia(R.A.esporte, R.A.inicio) : null;
  const modoDup = (document.querySelector('input[name="ip-dup"]:checked') || {}).value || null;
  window.__mtRegEm = Date.now();     // Beta 55: as conquistas de uma importação aparecem como as de um registro manual
  _atvComemora = true;
  const r = atvSalvar(R.A, { origem:'arquivo', hash:R.hash, grupos:R.grupos, plano, dup: R.dup && R.dup.tipo === 'manual' ? R.dup : null, modoDup });
  if(r && r.id) await atvLocalGuarda(r.id, { track:R.A.track, raw:R.buf, arq:R.arq, fmt:R.A.formato, em:Date.now() });
  _atvLog(R.arq, true, r.msg, r.id); saveData();
  toast('✅ ' + r.msg);
  atvProximo();
}
function atvSalvar(A, op){
  op = op || {};
  const id = 'imp_' + (op.hash || _atvChave(A).replace(/\W/g,'')).slice(0, 16);
  const imp = { v:1, id, fmt:A.formato, origem:op.origem || 'arquivo', disp:A.dispositivo || '', hash:op.hash || '', chave:_atvChave(A), esporte:A.esporte, inicio:A.inicio,
    totalMin: Math.round(A.elapsedS/6)/10, fcMed:A.fcMed, fcMax:A.fcMax, cad:A.cad, velMed:A.velMed, velMax:A.velMax, subida:A.subida, kcal:A.kcal, valido:A.valido,
    melhores:A.melhores, parciais:A.parciais.slice(0, 60).map(p=>[p.km, p.s, p.fc]), serie:A.serie, temGps:A.temGps, em:Date.now() };
  Object.keys(imp).forEach(k=>{ if(imp[k] == null || imp[k] === '') delete imp[k]; });
  if(A.esporte === 'musculacao') return _atvSalvaMusc(A, imp, op);
  const mod = ensureActivityLog(); mod.history = mod.history || [];
  const durMin = Math.round(A.movS/6)/10, km = Math.round(A.km*100)/100;
  const ativ = A.esporte === 'bike' ? 'bike' : A.esporte === 'caminhada' ? 'caminhada' : 'corrida';
  const pace = !km ? '' : ativ === 'bike' ? `${(km/(durMin/60)).toFixed(1)} km/h` : fmtPaceMin(durMin/km);
  const emo = { corrida:'🏃', caminhada:'🚶', bike:'🚴' }[ativ]; const lbl = { corrida:'Corrida', caminhada:'Caminhada', bike:'Bike' }[ativ];
  if(op.dup && op.modoDup !== 'separado'){
    // complementa o registro manual: mesmos campos, números do arquivo; mantém esforço, nome e data
    const x = op.dup.alvo.x;
    Object.assign(x, { duration:durMin, distance:km || x.distance, pace: pace || x.pace, imp });
    ensureStats(); try{ checkTrophies(); }catch(e){}
    return { id, msg:`${lbl} complementada com os dados do arquivo` };
  }
  const e = { id: op.plano ? op.plano.k : 'imp', name: op.plano ? op.plano.name : `${emo} ${lbl} — ${km}km`, at:A.inicio, duration:durMin, distance:km, pace, module:'run', activity:ativ, imp };
  mod.history.push(e);
  ensureStats();
  try{
    if(A.valido){
      if(ativ === 'corrida' && typeof checkRunEvolution === 'function' && pace) checkRunEvolution(km, pace);
      else if(ativ === 'caminhada'){ if(km>=3) unlockTrophy('walk_3k'); if(km>=5) unlockTrophy('walk_5k'); }
      else if(ativ === 'bike'){ if(km>=20) unlockTrophy('bike_20k'); if(km>=50) unlockTrophy('bike_50k'); }
    }
    checkTrophies();
  }catch(x){}
  return { id, msg:`${lbl} de ${_atvBr(km,2)} km importada` };
}
function _atvSalvaMusc(A, imp, op){
  const durMin = Math.max(1, Math.round(A.movS/60));
  const dia = _atvDia(A.inicio); const feitos = []; const mantidos = [];
  (op.grupos || []).forEach(g=>{
    if(!g.exId) return;
    const sets = g.series.filter(s=>!s.aq && s.reps > 0).map(s=>({ peso:s.kg || 0, reps:s.reps }));
    if(!sets.length) return;
    const logs = state.progress[g.exId] = state.progress[g.exId] || [];
    if(logs.some(p=>_atvDia(p.date) === dia && (p.sets||[]).length)){ mantidos.push(g.exId); return; }     // nunca sobrescreve o registro do aluno
    logs.push({ date:A.inicio, sets, imp:imp.id });
    logs.sort((a,b)=>a.date - b.date);
    const semCarga = (typeof exTipoRegistro === 'function') && exTipoRegistro(g.exId) !== 'carga';
    sets.filter(s=>s.peso > 0 || semCarga).forEach(s=>{ const pr = state.prs[g.exId]; if(!pr || s.peso > pr.peso || (s.peso === pr.peso && s.reps > pr.reps)) state.prs[g.exId] = { peso:s.peso, reps:s.reps, at:A.inicio }; });
    const ex = _mmExDoBanco ? _mmExDoBanco(g.exId) : null; const top = sets.reduce((b,s)=>(s.peso*s.reps > b.peso*b.reps ? s : b), sets[0]);
    feitos.push({ id:g.exId, name: ex ? ex.name : g.nomeArq, part: ex ? ex.part : '', sets:sets.length, best: top.peso > 0 ? `${top.peso}kg×${top.reps}` : `${top.reps} reps` });
  });
  imp.series = feitos.length; if(mantidos.length) imp.mantidos = mantidos;
  if(op.dup && op.modoDup !== 'separado'){
    const x = op.dup.alvo.x; x.imp = imp; if(!x.duration || x.duration < 5) x.duration = durMin;
    if(feitos.length) x.exercisesDone = (x.exercisesDone || []).concat(feitos.filter(f=>!(x.exercisesDone||[]).some(e=>e.id === f.id)));
    ensureStats(); try{ checkTrophies(); }catch(e){}
    return { id:imp.id, msg:'Treino complementado com os dados do arquivo' + (mantidos.length ? ` (${mantidos.length} exercício(s) já registrado(s) foram mantidos)` : '') };
  }
  const lift = state.modules.lift;
  const parts = [...new Set(feitos.map(f=>f.part).filter(Boolean))];
  if(lift){
    lift.history = lift.history || [];
    lift.history.push({ id: op.plano ? op.plano.k : 'imp', name: op.plano ? `Treino ${op.plano.k} — ${op.plano.name}` : `⌚ Treino de força importado${parts.length ? ' — ' + parts.join(' + ') : ''}`,
      at:A.inicio, duration:durMin, plannedDuration: op.plano ? op.plano.duration : undefined, module:'lift', parts, exercisesDone:feitos, imp });
  } else {
    const mod = ensureActivityLog(); mod.history.push({ id:'imp', name:'⌚ Treino de força importado', at:A.inicio, duration:durMin, module:'run', activity:'forca', imp });
  }
  ensureStats(); try{ checkTrophies(); }catch(e){}
  return { id:imp.id, msg: feitos.length ? `Treino de força importado com ${feitos.length} exercício(s)` + (mantidos.length ? `; ${mantidos.length} já registrado(s) mantido(s)` : '') : 'Treino de força importado (duração e frequência cardíaca)' };
}

// ---------- 9. detalhe e exclusão ----------
async function openAtividade(mk, idx){
  const x = ((state.modules[mk]||{}).history||[])[idx]; if(!x || !x.imp) return;
  const I = x.imp; const bike = I.esporte === 'bike', musc = I.esporte === 'musculacao';
  const loc = await atvLocalLe(I.id);
  const card = (r, v)=>v ? `<div class="ip-c"><small>${r}</small><b>${v}</b></div>` : '';
  const A = { esporte:I.esporte, parciais:(I.parciais||[]).map(([km,s,fc])=>({ km, s, fc })) };
  const mi = $('modal-inner'); mi.classList.remove('modal-video','modal-ex');
  mi.innerHTML = `<div id="integ-det"><h3>${mtEsc(String(x.name||'').replace(/^[^\wÀ-ú]+/,''))}</h3>
    <p class="integ-mini">${new Date(x.at).toLocaleString('pt-BR')} · <span class="ii-orig">Importado de arquivo ${String(I.fmt||'').toUpperCase()}</span>${I.disp ? ` · ${mtEsc(I.disp)}` : ''}</p>
    <div class="ip-cards">${card('Duração', _atvFmtDur((x.duration||0)*60))}${!musc ? card('Distância', `${_atvBr(x.distance||0,2)} km`) : ''}${!musc && x.pace ? card(bike ? 'Velocidade' : 'Ritmo', x.pace) : ''}
      ${card('FC média', I.fcMed && `${I.fcMed} bpm`)}${card('FC máxima', I.fcMax && `${I.fcMax} bpm`)}${card('Cadência', I.cad && `${I.cad} ${bike ? 'rpm' : 'passos/min'}`)}${card('Subida', I.subida != null && `${I.subida} m`)}${card('Calorias', I.kcal && `${I.kcal} kcal`)}
      ${I.melhores && I.melhores['5'] ? card('Melhor 5 km', _atvFmtDur(I.melhores['5'])) : ''}${I.melhores && I.melhores['10'] ? card('Melhor 10 km', _atvFmtDur(I.melhores['10'])) : ''}${bike && I.velMax ? card('Vel. máxima', `${_atvBr(I.velMax,1)} km/h`) : ''}</div>
    ${I.valido === false ? '<p class="ip-aviso">Esta atividade não conta para recordes (dados de velocidade ou GPS inconsistentes).</p>' : ''}
    ${I.serie && I.serie.length > 3 ? atvGraficoSerie(I) : ''}
    ${loc && loc.track && loc.track.length ? `<div class="ip-mapa">${atvPercursoSVG(loc.track)}</div>` : (I.temGps ? '<p class="integ-mini">O percurso fica guardado só no aparelho onde a atividade foi importada.</p>' : '')}
    ${A.parciais.length ? `<details class="integ-sec" open><summary>Parciais</summary>${atvParciaisHTML(A)}</details>` : ''}
    ${musc && (x.exercisesDone||[]).length ? `<div class="section-lbl" style="margin:12px 0 4px">Exercícios</div>${x.exercisesDone.map(e=>`<div class="mrow"><span class="n">${mtEsc(e.name)}</span><span class="q">${e.sets} séries · ${mtEsc(e.best||'')}</span></div>`).join('')}` : ''}
    <details class="integ-sec"><summary>Dados do arquivo original</summary>
      <div class="ip-orig">${[['Formato', String(I.fmt||'').toUpperCase()], ['Aparelho', I.disp], ['Arquivo', loc && loc.arq], ['Importado em', I.em && new Date(I.em).toLocaleString('pt-BR')], ['Tempo total gravado', I.totalMin && _atvFmtDur(I.totalMin*60)], ['Registro do plano', x.id && x.id !== 'imp' ? 'contou como o treino do plano deste dia' : '']].filter(r=>r[1]).map(r=>`<div><span>${r[0]}</span><b>${mtEsc(r[1])}</b></div>`).join('')}</div>
      ${loc && loc.raw ? `<button type="button" class="btn btn-ghost btn-block" style="margin-top:8px" onclick="atvBaixaOriginal('${I.id}')">⬇️ Baixar o arquivo original</button>` : '<p class="integ-mini">O arquivo original fica só no aparelho onde foi importado.</p>'}</details>
    <button class="btn btn-outline btn-block hl-primary" style="margin-top:12px" onclick="atvCompartilhar('${mk}',${idx})">📤 Compartilhar como imagem</button>
    <button class="btn btn-block" style="margin-top:8px;background:var(--tint-danger);color:var(--danger-soft);border:1px solid rgba(244,63,94,0.3)" onclick="atvExcluir('${mk}',${idx})">🗑️ Excluir atividade e dados importados</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openIntegracoes()">‹ Integrações e atividades</button></div>`;
  $('modal-back').classList.add('on');
}
// Beta 55: compartilhar uma atividade importada pela mesma Central do registro manual (com o percurso, se houver)
async function atvCompartilhar(mk, idx){
  const x = ((state.modules[mk]||{}).history||[])[idx]; if(!x) return;
  const d = mtsDeHistorico(x); if(!d){ toast('Ainda não há dados para montar esse card.'); return; }
  try{ const loc = x.imp && await atvLocalLe(x.imp.id); if(loc && loc.track && loc.track.length > 1) d.rota = loc.track; }catch(e){}
  mtsAbrir(d);
}
async function atvBaixaOriginal(id){
  try{ const loc = await atvLocalLe(id); if(!loc || !loc.raw) return toast('O arquivo original não está neste aparelho.');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([loc.raw])); a.download = loc.arq || ('atividade.' + (loc.fmt||'fit')); document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }catch(e){ toast('Não foi possível baixar o arquivo.'); }
}
function atvGraficoSerie(I){
  const s = I.serie; const bike = I.esporte === 'bike';
  const lin = (idx, cor, inverte)=>{ const vs = s.map(p=>p[idx]).filter(v=>v != null && v > 0); if(vs.length < 3) return ''; const mn = Math.min(...vs), mx = Math.max(...vs) || 1, rng = mx - mn || 1;
    const x0 = s[0][0], x1 = s[s.length-1][0] || 1;
    const pts = s.filter(p=>p[idx] != null && p[idx] > 0).map(p=>`${((p[0]-x0)/(x1-x0||1)*300).toFixed(1)},${(inverte ? (p[idx]-mn)/rng*70 : 70-(p[idx]-mn)/rng*70).toFixed(1)}`).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${cor}" stroke-width="2"/>`; };
  // velocidade (km/h) na coluna 1; para corrida e caminhada o gráfico mostra o ritmo (mais alto = mais rápido)
  return `<div class="ip-graf"><svg viewBox="0 0 300 74" preserveAspectRatio="none">${lin(1,'var(--primary)')}${lin(2,'#e5484d')}${lin(3,'#8a8f98')}</svg>
    <div class="ip-leg"><span><i style="background:var(--primary)"></i>${bike ? 'velocidade' : 'velocidade (ritmo)'}</span>${s.some(p=>p[2]) ? '<span><i style="background:#e5484d"></i>frequência cardíaca</span>' : ''}${s.some(p=>p[3] != null) ? '<span><i style="background:#8a8f98"></i>altitude</span>' : ''}</div></div>`;
}
function atvExcluir(mk, idx){
  const mod = state.modules[mk]; const x = mod && mod.history && mod.history[idx]; if(!x) return;
  appConfirm('A atividade sai do histórico, dos gráficos e dos recordes, e o percurso e o arquivo guardados neste aparelho são apagados. Os totais passam a contar sem ela, e conquistas e desafios ganhos nas últimas 48 horas que dependiam dela também saem.', async ()=>{
    const id = x.imp && x.imp.id;
    if(x.module === 'lift'){
      Object.keys(state.progress||{}).forEach(k=>{
        const antes = state.progress[k].length; state.progress[k] = state.progress[k].filter(p=>p.imp !== id);
        if(state.progress[k].length !== antes){
          // o recorde volta a ser o melhor que sobrou (mesma regra do registro)
          let pr = null; state.progress[k].forEach(p=>(p.sets||[]).forEach(st=>{ if(!pr || st.peso > pr.peso || (st.peso === pr.peso && st.reps > pr.reps)) pr = { peso:st.peso, reps:st.reps, at:p.date }; }));
          if(pr) state.prs[k] = pr; else delete state.prs[k];
        }
        if(!state.progress[k].length) delete state.progress[k];
      });
    }
    try{ if(typeof marcaExcluido === 'function') marcaExcluido(mk, x); }catch(e){}   // não volta pela sincronização
    mod.history.splice(idx, 1);
    // Beta 61: tira a contribuição dela dos contadores vitalícios (antes só ensureStats, que nunca desce)
    // e revisa conquistas e desafios das últimas 48 h (parte 64)
    try{ subtractFromStats(x); }catch(e){} ensureStats();
    try{ if(typeof mtRevisaConquistas === 'function') mtRevisaConquistas(); }catch(e){}
    saveData(); if(id) await atvLocalApaga(id);
    toast('Atividade excluída'); openIntegracoes();
  }, { title:'Excluir atividade?', okLabel:'Excluir' });
}

// ---------- 10. ligações com o resto do app ----------
// histórico: selo de origem e o detalhe próprio
mtGancho('renderHistory', { depois(){
  try{
    const mod = state.modules[state.active]; const h = (mod && mod.history) || [];
    document.querySelectorAll('#history-list .hist-card[onclick^="openHistoryEntry"]').forEach(c=>{
      const i = +((c.getAttribute('onclick').match(/\d+/)||[])[0]); const x = h[i]; if(!x || !x.imp || c.querySelector('.hist-orig')) return;
      const meta = c.querySelector('.hist-meta'); if(meta) meta.insertAdjacentHTML('beforeend', `<span class="hist-orig">⌚ ${String(x.imp.fmt||'').toUpperCase()}</span>`);
    });
    const lista = $('history-list'); if(lista && !$('integ-hist')){
      lista.insertAdjacentHTML('beforebegin', `<button type="button" class="card integ-hist" id="integ-hist" onclick="openIntegracoes()"><span class="ii-ico">⌚</span><span class="ii-tx"><b>Integrações e atividades</b><small>Importar do relógio ou de outro app (GPX, TCX, FIT)</small></span><span class="ii-seta">›</span></button>`);
    }
  }catch(e){}
}});
const _openHistoryEntryB54 = window.openHistoryEntry;
window.openHistoryEntry = function(idx){
  try{ const mk = state.active; const x = (((state.modules[mk]||{}).history)||[])[idx]; if(x && x.imp) return openAtividade(mk, idx); }catch(e){}
  return _openHistoryEntryB54.apply(this, arguments);
};
// "Registrar atividade": atalho para a mesma tela
mtGancho('openActivityLog', { depois(){
  try{ const mi = $('modal-inner'); if(!mi || mi.querySelector('#integ-atalho')) return; const h = mi.querySelector('h3');
    if(h) h.insertAdjacentHTML('afterend', `<button type="button" class="integ-atalho" id="integ-atalho" onclick="openIntegracoes()"><span class="ia-ico" aria-hidden="true">⌚</span><span class="ia-tx">Tem o treino no relógio?<b>Importar arquivo (GPX, TCX, FIT)</b></span><span class="ia-seta" aria-hidden="true">›</span></button>`); }catch(e){}
}});
// recordes: atividades com dados inconsistentes não contam; melhores esforços de 5 e 10 km entram
mtGancho('renderRecords', { depois(){
  try{
    const list = $('records-list'); const R = state.modules.run; if(!list || !R) return;
    const H = (R.history || []).filter(x=>!(x.imp && x.imp.valido === false));
    const dt = ts=>new Date(ts).toLocaleDateString('pt-BR');
    // os recordes de sempre, refeitos sem as atividades com dados inconsistentes
    const linha = titulo=>[...list.querySelectorAll('.rec-row')].find(r=>{ const t = r.querySelector(':scope > div > div'); return t && t.textContent.trim() === titulo; });
    const acerta = (titulo, x, val)=>{ const r = linha(titulo); if(!r) return; if(!x){ r.remove(); return; } const d = r.querySelectorAll(':scope > div > div')[1]; if(d) d.textContent = dt(x.at); const v = r.querySelector('.rec-val'); if(v) v.textContent = val; };
    const cor = H.filter(x=>!x.activity || x.activity === 'corrida');
    if((R.history||[]).some(x=>x.imp && x.imp.valido === false)){
      const maior = cor.filter(x=>x.distance).reduce((a,x)=>!a || x.distance > a.distance ? x : a, null); acerta('Maior distância', maior, maior && `${maior.distance} km`);
      const pace = cor.filter(x=>x.pace).reduce((a,x)=>!a || parsePace(x.pace) < parsePace(a.pace) ? x : a, null); acerta('Melhor ritmo', pace, pace && pace.pace);
      [['bike','Maior pedalada'],['caminhada','Maior caminhada']].forEach(([t, tit])=>{ const m = H.filter(x=>x.activity === t && x.distance).reduce((a,x)=>!a || x.distance > a.distance ? x : a, null); acerta(tit, m, m && `${m.distance} km`); });
    }
    // melhores esforços de dentro das corridas importadas
    const runs = cor.filter(x=>x.imp && x.imp.melhores);
    [['5','Melhor 5 km'],['10','Melhor 10 km'],['21.1','Melhor meia maratona']].forEach(([k, t])=>{
      const c = runs.filter(x=>x.imp.melhores[k]); if(!c.length || linha(t)) return; const b = c.reduce((a,x)=>x.imp.melhores[k] < a.imp.melhores[k] ? x : a);
      list.insertAdjacentHTML('beforeend', `<div class="rec-row"><span style="font-size:18px">⏱️</span><div><div style="font-weight:700;font-size:13.5px">${t}</div><div style="font-size:11.5px;color:var(--text-mute)">${dt(b.at)} · dentro de uma corrida</div></div><div class="rec-val">${_atvFmtDur(b.imp.melhores[k])}</div></div>`);
    });
    const card = $('card-records'); if(card && list.children.length) card.style.display = '';
  }catch(e){}
} });
const _checkRunEvolutionB54 = window.checkRunEvolution;
window.checkRunEvolution = function(){
  const R = state.modules.run; const orig = R && R.history; if(!orig) return _checkRunEvolutionB54.apply(this, arguments);
  const ult = orig[orig.length-1]; R.history = orig.filter(x=>x === ult || !(x.imp && x.imp.valido === false));
  try{ return _checkRunEvolutionB54.apply(this, arguments); } finally { R.history = orig; }
};
// calorias do dia (parte 56): usa as calorias do relógio quando existem (menos o gasto em repouso)
if(typeof _enFeitas === 'function'){
  const _enFeitasB54 = _enFeitas;
  window._enFeitas = function(dk){
    const out = _enFeitasB54.apply(this, arguments);
    try{
      const ini = new Date(dk + 'T00:00:00').getTime(), fim = ini + 86400000; const imps = atvTodas().filter(({x})=>x.imp && x.imp.kcal && x.at >= ini && x.at < fim).map(({x})=>x);
      out.forEach(s=>{ const x = imps.find(h=>(h.module === 'lift') === (s.mod === 'lift') && Math.abs((h.duration||0) - (s.min||0)) < 1.5); if(x) s.kcalRel = x.imp.kcal; });
    }catch(e){}
    return out;
  };
}
if(typeof enSessaoKcal === 'function'){
  const _enSessaoKcalB54 = enSessaoKcal;
  window.enSessaoKcal = function(s, kg){
    if(s && s.kcalRel){ try{ const c = nutriCalcular(); const repouso = (c && c.bmr ? c.bmr : 1500) / 1440 * (s.min || 0); return Math.max(0, s.kcalRel - repouso); }catch(e){} }
    return _enSessaoKcalB54.apply(this, arguments);
  };
}

// ---------- 11. gráficos de cardio (Progresso › Desempenho) ----------
let _cdEst = { esp:'corrida', per:90, met:'dist' };
const CD_PER = [[7,'7 dias'],[30,'30 dias'],[90,'3 meses'],[180,'6 meses'],[365,'1 ano'],[0,'Tudo']];
function _cdLista(esp){
  const t = { corrida:x=>!x.activity || x.activity === 'corrida', caminhada:x=>x.activity === 'caminhada', bike:x=>x.activity === 'bike' }[esp];
  return (((state.modules.run||{}).history)||[]).filter(x=>t(x) && (x.distance || x.duration)).sort((a,b)=>a.at - b.at);
}
function openCardio(esp){
  if(esp) _cdEst.esp = esp;
  const mi = $('modal-inner'); mi.classList.remove('modal-video','modal-ex'); mi.dataset.tela = 'cardio';
  const E = _cdEst; const lista = _cdLista(E.esp); const agora = Date.now(); const ini = E.per ? agora - E.per*86400000 : 0;
  const per = lista.filter(x=>x.at >= ini); const ant = E.per ? lista.filter(x=>x.at >= ini - E.per*86400000 && x.at < ini) : [];
  const soma = (l,k)=>l.reduce((t,x)=>t + (+x[k]||0), 0);
  const km = soma(per,'distance'), kmA = soma(ant,'distance'), min = soma(per,'duration');
  const bike = E.esp === 'bike';
  const ritmoMed = l=>{ const d = soma(l.filter(x=>x.distance && x.duration),'distance'), t = soma(l.filter(x=>x.distance && x.duration),'duration'); return d && t ? (bike ? d/(t/60) : t*60/d) : null; };
  const rm = ritmoMed(per), rmA = ritmoMed(ant);
  const var_ = (a, b, inv)=>!b || !a ? '' : (()=>{ const p = Math.round((a-b)/b*100) * (inv ? -1 : 1); return p ? ` <small class="${p>0?'cd-up':'cd-down'}">${p>0?'▲':'▼'} ${Math.abs(p)}%</small>` : ''; })();
  const METS = [['dist','Distância'],['tempo','Tempo'],[bike ? 'vel' : 'ritmo', bike ? 'Velocidade' : 'Ritmo'],['fc','FC média'],['subida','Subida'], ...(E.esp === 'corrida' ? [['5k','5 km'],['10k','10 km']] : [])];
  if(!METS.some(m=>m[0] === E.met)) E.met = 'dist';
  mi.innerHTML = `<div id="cd-tela"><h3>📈 Cardio</h3>
    <div class="cd-chips">${[['corrida','🏃 Corrida'],['caminhada','🚶 Caminhada'],['bike','🚴 Bike']].map(([k,n])=>`<button type="button" class="${E.esp===k?'on':''}" onclick="openCardio('${k}')">${n}</button>`).join('')}</div>
    <div class="cd-chips cd-per">${CD_PER.map(([d,n])=>`<button type="button" class="${E.per===d?'on':''}" onclick="_cdEst.per=${d};openCardio()">${n}</button>`).join('')}</div>
    <div class="ip-cards">${`<div class="ip-c"><small>Atividades</small><b>${per.length}${var_(per.length, ant.length)}</b></div><div class="ip-c"><small>Distância</small><b>${_atvBr(km,1)} km${var_(km, kmA)}</b></div><div class="ip-c"><small>Tempo</small><b>${_atvFmtDur(min*60)}</b></div><div class="ip-c"><small>${bike ? 'Vel. média' : 'Ritmo médio'}</small><b>${rm ? (bike ? `${_atvBr(rm,1)} km/h` : _atvFmtPace(rm)) : '—'}${rm && rmA ? var_(rm, rmA, !bike) : ''}</b></div>`}</div>
    ${E.per ? `<p class="integ-mini">Setas: comparação com os ${CD_PER.find(p=>p[0]===E.per)[1]} anteriores.</p>` : ''}
    <div class="cd-chips">${METS.map(([k,n])=>`<button type="button" class="${E.met===k?'on':''}" onclick="_cdEst.met='${k}';openCardio()">${n}</button>`).join('')}</div>
    <div class="cd-graf">${cdGrafico(per, E)}</div>
    <button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button></div>`;
  $('modal-back').classList.add('on');
}
function cdGrafico(per, E){
  const bike = E.esp === 'bike';
  if(!per.length) return '<p class="integ-mini">Nenhuma atividade neste período.</p>';
  let pts = [], tipo = 'linha', un = '';
  if(E.met === 'dist' || E.met === 'tempo' || E.met === 'subida'){
    tipo = 'barra'; const semanal = (E.per === 0 || E.per > 31);
    const chave = ts=>{ const d = new Date(ts); d.setHours(0,0,0,0); if(semanal){ d.setDate(d.getDate() - ((d.getDay()+6)%7)); } return d.getTime(); };
    const m = new Map(); per.forEach(x=>{ const k = chave(x.at); const v = E.met === 'dist' ? (x.distance||0) : E.met === 'tempo' ? (x.duration||0) : ((x.imp && x.imp.subida) || 0); m.set(k, (m.get(k)||0) + v); });
    pts = [...m.entries()].sort((a,b)=>a[0]-b[0]).map(([k,v])=>({ x:k, y:v, r: new Date(k).toLocaleDateString('pt-BR',{ day:'2-digit', month:'2-digit' }) }));
    un = E.met === 'dist' ? 'km' : E.met === 'tempo' ? 'min' : 'm';
    if(semanal) un += ' por semana';
  } else {
    const f = { ritmo:x=>x.distance && x.duration ? x.duration*60/x.distance : null, vel:x=>x.distance && x.duration ? x.distance/(x.duration/60) : null, fc:x=>x.imp && x.imp.fcMed, '5k':x=>x.imp && x.imp.valido !== false && x.imp.melhores && x.imp.melhores['5'], '10k':x=>x.imp && x.imp.valido !== false && x.imp.melhores && x.imp.melhores['10'] }[E.met];
    pts = per.map(x=>({ x:x.at, y:f(x), r:new Date(x.at).toLocaleDateString('pt-BR',{ day:'2-digit', month:'2-digit' }) })).filter(p=>p.y);
    un = { ritmo:'min/km (mais baixo = mais rápido)', vel:'km/h', fc:'bpm', '5k':'tempo nos 5 km (mais baixo = melhor)', '10k':'tempo nos 10 km (mais baixo = melhor)' }[E.met];
  }
  if(!pts.length) return `<p class="integ-mini">${E.met === 'fc' ? 'Nenhuma atividade com frequência cardíaca neste período (ela vem dos arquivos importados).' : /k$/.test(E.met) ? 'Nenhum melhor esforço neste período: ele vem de corridas importadas com GPS ou distância por ponto.' : 'Sem dados neste período.'}</p>`;
  const W = 320, H = 150, pad = 26; const ys = pts.map(p=>p.y); const mx = Math.max(...ys), mn = tipo === 'barra' ? 0 : Math.min(...ys); const rng = (mx - mn) || 1;
  const X = i=>pad + (pts.length === 1 ? (W-pad*2)/2 : i*(W-pad*2)/(pts.length-1)); const Y = v=>H - 18 - (v - mn)/rng*(H - 34);
  const fmt = v=>E.met === 'ritmo' || /k$/.test(E.met) ? _atvFmtPace(v).replace(/^(\d+):/, E.met === 'ritmo' ? '$1:' : '$1:') : _atvBr(v, v < 20 ? 1 : 0);
  const fmtY = v=>/k$/.test(E.met) ? _atvFmtDur(v) : E.met === 'ritmo' ? _atvFmtPace(v) : fmt(v);
  const corpo = tipo === 'barra'
    ? pts.map((p,i)=>{ const bw = Math.max(4, (W-pad*2)/pts.length*0.6); return `<rect x="${(X(i)-bw/2).toFixed(1)}" y="${Y(p.y).toFixed(1)}" width="${bw.toFixed(1)}" height="${(H-18-Y(p.y)).toFixed(1)}" rx="2" fill="var(--primary)"><title>${p.r}: ${fmtY(p.y)}</title></rect>`; }).join('')
    : `<polyline points="${pts.map((p,i)=>`${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--primary)" stroke-width="2"/>` + pts.map((p,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="3" fill="var(--primary)"><title>${p.r}: ${fmtY(p.y)}</title></circle>`).join('');
  const eixo = `<text x="2" y="12" class="cd-t">${fmtY(mx)}</text><text x="2" y="${H-20}" class="cd-t">${fmtY(mn)}</text><text x="${pad}" y="${H-3}" class="cd-t">${pts[0].r}</text><text x="${W-pad}" y="${H-3}" class="cd-t" text-anchor="end">${pts[pts.length-1].r}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="cd-svg" role="img" aria-label="Gráfico">${eixo}${corpo}</svg><p class="integ-mini">${un}</p>`;
}
// cartão no Desempenho (bloco "cardio", personalizável na parte 54)
function cdRenderEntrada(){
  try{
    const scr = $('scr-perf'); if(!scr) return; const wrap = scr.querySelector('.wrap'); if(!wrap) return;
    const tem = (((state.modules.run||{}).history)||[]).length > 0; const velho = $('cd-entrada');
    if(!tem){ if(velho) velho.remove(); return; } if(velho) return;
    wrap.insertAdjacentHTML('beforeend', `<button type="button" class="card integ-hist" id="cd-entrada" onclick="openCardio()"><span class="ii-ico">📈</span><span class="ii-tx"><b>Cardio: corrida, caminhada e bike</b><small>Distância, tempo, ritmo, velocidade, frequência cardíaca, subida e melhores 5 e 10 km</small></span><span class="ii-seta">›</span></button>`);
  }catch(e){}
}
mtGancho('renderPerf', { depois(){ cdRenderEntrada(); } });
mtGancho('goTab', { depois(t){ if(t === 'perf') cdRenderEntrada(); } });
try{ if(typeof PERF_BLOCOS !== 'undefined' && !PERF_BLOCOS.some(b=>b.k === 'cardio')){ PERF_BLOCOS.splice(PERF_BLOCOS.findIndex(b=>b.k === 'calendario'), 0, { k:'cardio', nome:'Cardio: corrida, caminhada e bike', desc:'gráficos das atividades (inclui as importadas)', sel:['#cd-entrada'] }); PERF_PADRAO.splice(0, PERF_PADRAO.length, ...PERF_BLOCOS.map(b=>b.k)); } }catch(e){}

// ---------- 12. Meta Assistente ----------
function maAtividades(){
  try{
    if(typeof mtTem === 'function' && !mtTem('assistente')) return maRespostaPremium('A análise das suas atividades');
    const run = (((state.modules.run||{}).history)||[]); const agora = Date.now(), D = 86400000;
    const janela = (l, de, ate)=>l.filter(x=>x.at >= agora - de*D && x.at < agora - ate*D);
    const partes = [];
    // corrida: volume da semana × média das 4 anteriores; ritmo em distância parecida (mesma faixa) 30 × 30 dias
    const cor = run.filter(x=>(!x.activity || x.activity === 'corrida') && x.distance && x.duration && !(x.imp && x.imp.valido === false));
    if(cor.length >= 3){
      const sem = janela(cor, 7, 0).reduce((t,x)=>t + x.distance, 0); const ant4 = [1,2,3,4].map(k=>janela(cor, 7*(k+1), 7*k).reduce((t,x)=>t + x.distance, 0)); const media4 = ant4.reduce((a,b)=>a+b,0)/4;
      if(media4 > 0 && sem > media4*1.3 && sem - media4 >= 5) partes.push(`🏃 <b>Volume de corrida subiu bastante:</b> ${_atvBr(sem,1)} km nesta semana contra ${_atvBr(media4,1)} km de média nas 4 anteriores. Vale observar a recuperação antes de aumentar de novo.`);
      else if(media4 > 0) partes.push(`🏃 Corrida: ${_atvBr(sem,1)} km nos últimos 7 dias (média de ${_atvBr(media4,1)} km nas 4 semanas anteriores).`);
      const faixas = [[3,7,'5 km'],[7,13,'10 km'],[13,30,'distâncias longas']];
      faixas.forEach(([a,b,n])=>{
        const ag = janela(cor, 30, 0).filter(x=>x.distance >= a && x.distance < b), an = janela(cor, 60, 30).filter(x=>x.distance >= a && x.distance < b);
        if(ag.length >= 2 && an.length >= 2){ const p = l=>l.reduce((t,x)=>t + x.duration*60, 0)/l.reduce((t,x)=>t + x.distance, 0); const d = (p(an) - p(ag))/p(an)*100;
          if(Math.abs(d) >= 3) partes.push(`⏱️ Em corridas de ${n}, seu ritmo médio ${d > 0 ? 'melhorou' : 'ficou mais lento'} ${Math.abs(Math.round(d))}% em relação ao mês anterior (${_atvFmtPace(p(an))} → ${_atvFmtPace(p(ag))} /km, ${an.length + ag.length} corridas).${d > 0 ? '' : ' Pode ser calor, cansaço ou treinos mais leves de propósito; olhe a tendência das próximas semanas.'}`); }
      });
      // FC no mesmo ritmo (só com FC nos dois períodos)
      const comFc = cor.filter(x=>x.imp && x.imp.fcMed);
      const ag = janela(comFc, 30, 0), an = janela(comFc, 90, 30);
      if(ag.length >= 3 && an.length >= 3){ const pa = l=>l.reduce((t,x)=>t + x.duration*60/x.distance, 0)/l.length, fa = l=>l.reduce((t,x)=>t + x.imp.fcMed, 0)/l.length;
        if(Math.abs(pa(ag) - pa(an)) <= 15 && fa(an) - fa(ag) >= 3) partes.push(`❤️ No mesmo ritmo (${_atvFmtPace(pa(ag))} /km), sua frequência cardíaca média caiu de ${Math.round(fa(an))} para ${Math.round(fa(ag))} bpm. Costuma ser sinal de melhora no condicionamento.`); }
    }
    // bike: velocidade em pedaladas parecidas (distância ±25% e subida por km parecida)
    const bk = run.filter(x=>x.activity === 'bike' && x.distance && x.duration);
    if(bk.length >= 4){
      const ult = bk[bk.length-1]; const par = bk.slice(0,-1).filter(x=>Math.abs(x.distance - ult.distance) <= ult.distance*0.25 && (!x.imp || !ult.imp || x.imp.subida == null || ult.imp.subida == null || Math.abs(x.imp.subida/x.distance - ult.imp.subida/ult.distance) < 10));
      if(par.length >= 3){ const v = x=>x.distance/(x.duration/60); const m = par.reduce((t,x)=>t + v(x), 0)/par.length; const d = (v(ult) - m)/m*100;
        partes.push(`🚴 Última pedalada: ${_atvBr(v(ult),1)} km/h, ${Math.abs(d) < 3 ? 'no seu padrão' : `${Math.abs(Math.round(d))}% ${d > 0 ? 'acima' : 'abaixo'} da média`} de ${par.length} pedaladas parecidas (distância e subida).`); }
    }
    const cam = janela(run.filter(x=>x.activity === 'caminhada' && x.distance), 30, 0);
    if(cam.length >= 2) partes.push(`🚶 Caminhadas: ${cam.length} nos últimos 30 dias, ${_atvBr(cam.reduce((t,x)=>t + x.distance, 0),1)} km no total.`);
    // musculação: mesma carga com mais repetições, ou mais carga (30 dias × antes)
    const evol = [];
    Object.entries(state.progress || {}).forEach(([id, arr])=>{
      const l = (arr||[]).filter(p=>(p.sets||[]).length).sort((a,b)=>a.date - b.date); if(l.length < 2) return;
      const ult = l[l.length-1], pen = l[l.length-2]; if(ult.date < agora - 30*D) return;
      const top = p=>p.sets.reduce((b,s)=>(s.peso > b.peso || (s.peso === b.peso && s.reps > b.reps)) ? s : b, p.sets[0]);
      const a = top(pen), b = top(ult); const nome = (_mmExDoBanco && _mmExDoBanco(id) || {}).name || id;
      if(b.peso > 0 && b.peso === a.peso && b.reps > a.reps) evol.push(`${nome}: mesma carga (${b.peso} kg) com mais repetições (${a.reps} → ${b.reps}). Isso também é evolução.`);
      else if(b.peso > a.peso && b.reps >= a.reps - 2) evol.push(`${nome}: subiu de ${a.peso} para ${b.peso} kg.`);
    });
    if(evol.length) partes.push(`🏋️ ${evol.slice(0,3).join(' ')}`);
    if(!partes.length) return 'Ainda tenho poucos dados para comparar com segurança. Com algumas atividades a mais (importadas ou registradas) eu consigo mostrar tendências de ritmo, volume, frequência cardíaca e cargas.';
    return partes.join('<br><br>') + '<br><br><small>Comparo só atividades parecidas e períodos com dados suficientes; uma melhora isolada não é motivo para aumentar a intensidade.</small>';
  }catch(e){ return 'Não consegui analisar suas atividades agora.'; }
}
MA_ANSWERS.atividades = maAtividades;
const _maInterpretB54 = window.maInterpret;
window.maInterpret = function(txt){
  const t = mtNorm(String(txt || ''));
  if(/(relogio|importad|garmin|strava|amazfit|zepp|coros|polar|\bfit\b|gpx|tcx|frequencia cardiaca|\bfc\b|pedalad|ciclismo|minhas atividades|caminhad)/.test(t) && /(analis|evolu|como (estou|esta|vai)|melhor|compar|tendenc|progress|resum)/.test(t)) return 'atividades';
  return _maInterpretB54.apply(this, arguments);
};
const _openAssistantB54 = window.openAssistant;
window.openAssistant = function(){
  try{ const tem = atvTodas().some(({x})=>x.imp); const i = MA_SUGGESTIONS.findIndex(s=>s.key === 'atividades');
    if(tem && i < 0) MA_SUGGESTIONS.splice(1, 0, { lbl:'⌚ Análise das minhas atividades', key:'atividades' }); else if(!tem && i >= 0) MA_SUGGESTIONS.splice(i, 1); }catch(e){}
  return _openAssistantB54.apply(this, arguments);
};

(function(){ if(document.getElementById('integ-css')) return; const s = document.createElement('style'); s.id = 'integ-css';
  s.textContent = `
.integ-p{font-size:13px;line-height:1.55;color:var(--text-dim);margin:4px 0 10px}.integ-mini{font-size:12px;line-height:1.5;color:var(--text-mute);margin:6px 0}
.integ-up{display:block;text-align:center;cursor:pointer}
.integ-sec{margin:10px 0;border-radius:12px;background:rgba(127,127,127,.07);padding:2px 12px}.integ-sec summary{cursor:pointer;padding:10px 0;font-weight:700;font-size:13.5px}
.integ-fmt{display:flex;flex-direction:column;gap:2px;padding:7px 0;border-top:1px solid var(--border);font-size:12.5px}.integ-fmt span{color:var(--text-dim);line-height:1.45}
.integ-priv{font-size:12px;line-height:1.5;color:var(--text-dim);background:rgba(127,127,127,.07);border-radius:12px;padding:10px 12px;margin:10px 0}
.integ-item,.integ-hist{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:0;background:rgba(127,127,127,.07);border-radius:12px;padding:10px 12px;margin:6px 0;color:var(--text);font:inherit;cursor:pointer}
.integ-hist{margin:0 0 12px}.ii-ico{font-size:20px}.ii-tx{flex:1;display:flex;flex-direction:column;min-width:0}.ii-tx b{font-size:13.5px}.ii-tx small{font-size:11.5px;color:var(--text-mute)}.ii-seta{color:var(--text-mute);font-size:18px}
.integ-log{display:flex;flex-direction:column;padding:6px 0;border-top:1px solid var(--border);font-size:12px}.integ-log small{color:var(--text-mute)}.integ-log.erro b{color:var(--danger,#e5484d)}
.integ-proc{display:flex;flex-direction:column;align-items:center;gap:8px;padding:30px 0;text-align:center}.integ-proc small{color:var(--text-mute)}
.integ-spin{width:30px;height:30px;border-radius:50%;border:3px solid rgba(127,127,127,.25);border-top-color:var(--primary);animation:integ-g 1s linear infinite}@keyframes integ-g{to{transform:rotate(360deg)}}
.ip-dup{font-size:12.5px;line-height:1.5;padding:10px 12px;border-radius:12px;background:rgba(229,72,77,.1);border-left:3px solid #e5484d;margin:8px 0}
.ip-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:8px;margin:8px 0}.ip-campo{display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--text-mute)}
.ip-campo{min-width:0}.ip-campo select,.ip-campo input{font:inherit;font-size:13px;padding:8px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);min-width:0;width:100%;box-sizing:border-box}
.ip-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px;margin:8px 0}.ip-c{background:rgba(127,127,127,.08);border-radius:10px;padding:8px}.ip-c small{display:block;font-size:10.5px;color:var(--text-mute)}.ip-c b{font-size:14px}
.ip-c small.cd-up,.cd-up{color:#3ecf8e;font-size:10.5px}.cd-down{color:#e5484d;font-size:10.5px}
.ip-aviso{font-size:12px;line-height:1.5;color:var(--text-dim);border-left:3px solid #e9c46a;padding:4px 10px;margin:6px 0}
.ip-comp{font-size:12.5px;line-height:1.5;padding:8px 12px;border-radius:10px;background:rgba(127,127,127,.08);margin:6px 0}
.ip-mapa{display:flex;justify-content:center;padding:8px;border-radius:12px;background:rgba(127,127,127,.06);margin:8px 0}.ip-svg{max-height:220px;max-width:100%}
.ip-parc>div{display:grid;grid-template-columns:1fr 1.4fr 1fr;padding:4px 0;font-size:12.5px;border-top:1px solid var(--border)}.ip-parc-h{color:var(--text-mute);font-size:11px!important}
.ip-ex{border-radius:12px;background:rgba(127,127,127,.07);padding:8px 10px;margin:6px 0}.ip-ex-t{display:flex;flex-direction:column;gap:5px;margin-bottom:4px}.ip-ex-t select{font:inherit;font-size:12.5px;padding:6px;border-radius:8px;border:1px solid var(--border);background:var(--surface-2);color:var(--text)}
.ip-serie{display:grid;grid-template-columns:30px 1fr 1fr auto;gap:6px;align-items:center;font-size:12.5px;padding:3px 0}.ip-aq{font-size:11px;color:var(--text-mute);display:flex;align-items:center;gap:4px}
.ip-plano{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.45;margin:10px 0}.ip-op{display:flex;flex-direction:column;gap:8px;font-size:12.5px;margin:10px 0}
.ip-graf{margin:8px 0}.ip-graf svg{width:100%;height:90px;background:rgba(127,127,127,.06);border-radius:10px}.ip-leg{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--text-mute);margin-top:4px}.ip-leg i{display:inline-block;width:10px;height:3px;margin-right:4px;vertical-align:middle}
.ii-orig,.hist-orig{font-size:11px;font-weight:700;padding:1px 7px;border-radius:999px;background:rgba(127,127,127,.18)}
.integ-atalho{display:block;width:100%;text-align:left;border:1px dashed var(--border);background:none;color:var(--text-dim);font:inherit;font-size:12.5px;border-radius:12px;padding:9px 12px;margin:4px 0 10px;cursor:pointer}
.cd-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:8px 0}.cd-chips::-webkit-scrollbar{display:none}
.cd-chips button{flex:none;border:1px solid var(--border);background:none;color:var(--text-dim);font:inherit;font-size:12.5px;font-weight:700;padding:6px 11px;border-radius:999px;cursor:pointer}.cd-chips button.on{background:var(--text-strong,#fff);color:var(--bg,#000);border-color:transparent}
.cd-per button{font-size:11.5px;padding:5px 9px}
.cd-svg{width:100%;height:auto;background:rgba(127,127,127,.06);border-radius:12px}.cd-t{font-size:9px;fill:var(--text-mute)}
`; document.head.appendChild(s); })();

Object.assign(window, { openIntegracoes, atvEscolheu, atvProximo, atvProcessaArquivo, atvFormato, atvLeGPX, atvLeTCX, atvLeFIT, atvCalcula, atvAgrupaSeries, atvDuplicata, atvPrevia, atvTrocaEsporte,
  atvCancela, atvConfirma, atvSalvar, openAtividade, atvExcluir, atvTodas, atvLocalLe, atvCarregaFit, openCardio, cdGrafico, maAtividades, ATV_FONTES });

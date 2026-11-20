
// =====================================================================
// 40. Beta 40 — PDFs com a identidade do MetaTreino (Premium)
// =====================================================================
// Três documentos novos — plano de musculação, plano de corrida e plano alimentar — e o relatório de
// evolução com a mesma apresentação. Tudo vetorial, desenhado aqui (sem fotos): o desenho em SVG vira
// imagem PNG transparente no próprio aparelho e entra no PDF com opacidade baixa, atrás do conteúdo.
// As cores vêm do tema do aluno, escurecidas quando preciso para manter contraste no papel branco.
// O conteúdo e os cálculos são os mesmos do app (plano gerado, nutriMontarPlano, histórico).

// ---------- cores do tema → papel ----------
function _pdfHex(v){
  v = String(v||'').trim();
  let m = /^#([0-9a-f]{6})$/i.exec(v); if(m) return [parseInt(m[1].slice(0,2),16), parseInt(m[1].slice(2,4),16), parseInt(m[1].slice(4,6),16)];
  m = /^#([0-9a-f]{3})$/i.exec(v); if(m) return m[1].split('').map(c=>parseInt(c+c,16));
  m = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(v); if(m) return [+m[1], +m[2], +m[3]];
  return null;
}
function _pdfLum(c){ const f = x=>{ x /= 255; return x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4); }; return 0.2126*f(c[0]) + 0.7152*f(c[1]) + 0.0722*f(c[2]); }
function _pdfContraste(c){ return 1.05 / (_pdfLum(c) + 0.05); }   // contra o branco
function _pdfEscurece(c, alvo){ let x = c.slice(); for(let i = 0; i < 30 && _pdfContraste(x) < alvo; i++) x = x.map(v=>Math.round(v*0.9)); return x; }
function _pdfMistura(c, f){ return c.map(v=>Math.round(v + (255 - v)*f)); }   // f = quanto de branco
function _pdfHexDe(c){ return '#' + c.map(v=>Math.max(0,Math.min(255,v|0)).toString(16).padStart(2,'0')).join(''); }
function pdfCores(){
  const cs = getComputedStyle(document.documentElement);
  const p0 = _pdfHex(cs.getPropertyValue('--primary')) || [255,106,43];
  const a0 = _pdfHex(cs.getPropertyValue('--accent')) || [47,212,181];
  const p = _pdfEscurece(p0, 4.6), a = _pdfEscurece(a0, 3.2);
  return { p, a, pArte:_pdfEscurece(p0, 2.2), aArte:_pdfEscurece(a0, 2.0), pClaro:_pdfMistura(p, 0.90), aClaro:_pdfMistura(a, 0.88),
    ink:[24,29,38], dim:[92,101,116], linha:[223,227,233], zebra:[247,248,250], tema: currentTheme() };
}

// ---------- ilustrações (SVG vetorial próprio) ----------
// Cabeçalho: 600×130, desenho à direita. Marca d'água: 400×400.
function _svgFig(corpo, vb){ return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${corpo}</svg>`; }
function pdfArteCab(tipo, C){
  const P = _pdfHexDe(C.pArte), A = _pdfHexDe(C.aArte), PC = _pdfHexDe(_pdfMistura(C.p, 0.82)), AC = _pdfHexDe(_pdfMistura(C.a, 0.78));
  const fundo = `<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="${PC}" stop-opacity="0"/><stop offset=".55" stop-color="${PC}" stop-opacity=".55"/><stop offset="1" stop-color="${AC}" stop-opacity=".75"/></linearGradient></defs>
    <path d="M330 130 C 390 70 460 110 520 40 C 555 0 585 8 600 0 V130 Z" fill="url(#g)"/>
    <circle cx="505" cy="62" r="58" fill="${PC}" opacity=".55"/>`;
  const L = (d, c, w, o)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o==null?1:o}"/>`;
  if(tipo === 'musculacao') return _svgFig(fundo
    // barra com anilhas acima da cabeça (desenvolvimento)
    + L('M432 26 H578', P, 4) + `<rect x="440" y="10" width="9" height="32" rx="2.5" fill="${P}"/><rect x="451" y="15" width="6" height="22" rx="2" fill="${P}" opacity=".8"/><rect x="561" y="10" width="9" height="32" rx="2.5" fill="${P}"/><rect x="553" y="15" width="6" height="22" rx="2" fill="${P}" opacity=".8"/>`
    // atleta em traço
    + `<circle cx="505" cy="47" r="9.5" fill="${A}"/>` + L('M505 58 V92', A, 11) + L('M499 62 L484 44 L482 27 M511 62 L526 44 L528 27', A, 7) + L('M500 92 L491 110 L489 125 M510 92 L519 110 L521 125', A, 8)
    // halter e kettlebell no chão
    + L('M392 117 H422', P, 4, .9) + `<rect x="386" y="108" width="7" height="18" rx="2" fill="${P}" opacity=".9"/><rect x="421" y="108" width="7" height="18" rx="2" fill="${P}" opacity=".9"/>`
    + `<path d="M572 96 a10 10 0 0 1 20 0" fill="none" stroke="${P}" stroke-width="4" opacity=".9"/><circle cx="582" cy="113" r="13" fill="${P}" opacity=".9"/>`
    + L('M355 60 h18 M362 74 h18 M350 88 h18', A, 3, .45), '0 0 600 130');
  if(tipo === 'corrida') return _svgFig(fundo
    // pista: raias curvas
    + [0,1,2].map(i=>L(`M${340+i*10} 130 C ${420+i*8} ${96-i*10} ${520+i*6} ${100-i*12} 600 ${72-i*14}`, P, 2.6, .55 - i*.12)).join('')
    // corredor em traço
    + `<circle cx="512" cy="30" r="9" fill="${A}"/>` + L('M507 41 L494 74', A, 10) + L('M503 50 L520 60 L533 51 M503 50 L486 60 L476 72', A, 6.5) + L('M494 74 L514 91 L508 113 M494 74 L476 97 L455 101', A, 7.5)
    + L('M428 46 h34 M418 60 h38 M432 74 h26', P, 3.2, .55)
    // percurso com marcador e bicicleta
    + L('M338 116 C 356 104 368 122 386 108 S 414 100 424 112', A, 2.5, .8) + `<circle cx="338" cy="116" r="4" fill="${A}"/><path d="M424 112 m-6 -16 a6 6 0 1 1 12 0 c0 6 -6 10 -6 16 c0 -6 -6 -10 -6 -16z" fill="${P}"/>`
    + `<g opacity=".85">${L('M560 112 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0', P, 3)}${L('M590 112 m-11 0 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0', P, 3)}${L('M560 112 L571 96 H584 L590 112 M571 96 L577 112 H560 M584 96 L588 89', P, 3)}</g>`, '0 0 600 130');
  if(tipo === 'alimentacao') return _svgFig(fundo
    // prato com talheres
    + `<circle cx="500" cy="68" r="46" fill="#ffffff" opacity=".9"/><circle cx="500" cy="68" r="46" fill="none" stroke="${P}" stroke-width="3"/><circle cx="500" cy="68" r="33" fill="none" stroke="${P}" stroke-width="1.5" opacity=".5"/>`
    + L('M436 28 V108 M430 28 V48 Q436 56 442 48 V28', P, 3) + L('M564 28 Q576 48 566 70 V108', P, 3)
    // brócolis, cenoura e folhas no prato
    + `<g><circle cx="484" cy="58" r="10" fill="#4f9a5f"/><circle cx="495" cy="51" r="9" fill="#5fae6c"/><circle cx="476" cy="66" r="8" fill="#5fae6c"/><path d="M487 66 L483 86" stroke="#4f8a57" stroke-width="5" stroke-linecap="round"/></g>`
    + `<path d="M510 86 L534 56 L540 62 Z" fill="#e8893a"/><path d="M534 56 l6 -8 M537 59 l9 -4 M533 55 l1 -10" stroke="#5fae6c" stroke-width="2.5" stroke-linecap="round"/>`
    + `<ellipse cx="504" cy="74" rx="9" ry="6" fill="${A}" opacity=".9"/>`
    // maçã e folhas soltas
    + `<path d="M386 92 c-12 -14 2 -30 14 -22 c12 -8 26 8 14 22 c-6 8 -12 10 -14 6 c-2 4 -8 2 -14 -6z" fill="${A}" opacity=".9"/><path d="M400 70 q2 -8 9 -10" stroke="#4f8a57" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
    + `<path d="M582 104 q-16 -22 4 -40 q12 20 -4 40z" fill="#5fae6c" opacity=".85"/><path d="M584 104 q-2 -18 2 -38" stroke="#ffffff" stroke-width="1.2" fill="none" opacity=".8"/>`
    + `<path d="M352 50 q-10 -14 2 -26 q8 14 -2 26z" fill="#5fae6c" opacity=".6"/>`, '0 0 600 130');
  // evolução / relatório
  return _svgFig(fundo
    + `<path d="M372 112 L410 92 L442 100 L478 70 L508 78 L544 40 V122 H372 Z" fill="${PC}" opacity=".8"/>`
    + L('M372 112 L410 92 L442 100 L478 70 L508 78 L544 40', P, 4) + L('M530 38 L546 38 L546 54', P, 4)
    + [[410,92],[442,100],[478,70],[508,78]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" stroke="${P}" stroke-width="3"/>`).join('')
    // troféu e medalha
    + `<path d="M560 72 h24 v7 a12 12 0 0 1 -24 0z" fill="${A}"/><path d="M569 91 h6 v9 h7 v6 h-20 v-6 h7z" fill="${A}"/><path d="M560 75 h-5 a5 5 0 0 0 5 9 M584 75 h5 a5 5 0 0 1 -5 9" fill="none" stroke="${A}" stroke-width="2.5"/>`
    + `<path d="M352 22 l8 18 M368 22 l-8 18" stroke="${A}" stroke-width="5" stroke-linecap="round"/><circle cx="360" cy="48" r="10" fill="${P}"/><circle cx="360" cy="48" r="5" fill="#fff" opacity=".7"/>`
    + L('M400 30 a14 14 0 1 0 0.1 0 M400 36 a8 8 0 1 0 0.1 0', A, 2.5, .6), '0 0 600 130');
}
function pdfArteMarca(tipo, C){
  const P = _pdfHexDe(C.pArte), A = _pdfHexDe(C.aArte);
  const L = (d, c, w)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  if(tipo === 'musculacao') return _svgFig(`<g opacity="1">${[150,112,74,40].map((r,i)=>`<circle cx="250" cy="250" r="${r}" fill="none" stroke="${i%2?A:P}" stroke-width="${i===0?14:6}"/>`).join('')}<circle cx="250" cy="250" r="16" fill="${P}"/>${L('M40 380 H180', P, 12)}<rect x="24" y="350" width="22" height="60" rx="6" fill="${P}"/><rect x="176" y="350" width="22" height="60" rx="6" fill="${P}"/></g>`, '0 0 400 420');
  if(tipo === 'corrida') return _svgFig(`${[0,1,2,3].map(i=>L(`M${20+i*26} 420 C ${120+i*20} ${260-i*24} ${260+i*14} ${250-i*26} 400 ${120-i*26}`, i%2?A:P, 9)).join('')}<path d="M300 150 m-14 -36 a14 14 0 1 1 28 0 c0 14 -14 22 -14 36 c0 -14 -14 -22 -14 -36z" fill="${P}"/>`, '0 0 400 420');
  if(tipo === 'alimentacao') return _svgFig(`<path d="M120 380 q-90 -120 20 -230 q80 110 -20 230z" fill="${A}"/><path d="M122 376 q-14 -110 14 -220" stroke="#fff" stroke-width="5" fill="none"/><circle cx="270" cy="270" r="92" fill="none" stroke="${P}" stroke-width="12"/><path d="M262 178 q8 -30 30 -36" stroke="${A}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M330 120 q-50 -40 -10 -90 q40 46 10 90z" fill="${P}"/>`, '0 0 400 420');
  return _svgFig(`${L('M30 380 L130 300 L200 330 L290 220 L370 90', P, 14)}${L('M330 84 L376 84 L376 130', P, 14)}${[[130,300],[200,330],[290,220]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="16" fill="${A}"/>`).join('')}${[0,1,2].map(i=>`<rect x="${60+i*90}" y="${400-60-i*40}" width="50" height="${60+i*40}" rx="8" fill="${i%2?A:P}" opacity=".7"/>`).join('')}`, '0 0 400 420');
}
function _svgPng(svg, w, h, opacidade){
  return new Promise((res, rej)=>{
    const img = new Image();
    img.onload = ()=>{ try{ const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.globalAlpha = opacidade == null ? 1 : opacidade; x.drawImage(img, 0, 0, w, h); res(c.toDataURL('image/png')); }catch(e){ rej(e); } };
    img.onerror = ()=>rej(new Error('desenho do PDF não carregou'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
async function pdfPrepArte(tipo){
  const C = pdfCores();
  const [cab, marca] = await Promise.all([ _svgPng(pdfArteCab(tipo, C), 1800, 390, 1), _svgPng(pdfArteMarca(tipo, C), 700, 735, 0.07) ]);
  return { C, cab, marca, tipo };
}

// ---------- montagem comum ----------
function _pdfTxt(s){ return _T(String(s==null?'':s).replace(/≈/g,'~').replace(/×/g,'x').replace(/–/g,'-').replace(/·/g,'·')); }
function pdfDoc(jsPDF, arte, cab){
  const doc = new jsPDF({ unit:'mm', format:'a4', compress:true });
  const PW = 210, PH = 297, M = 14, W = PW - 2*M; const C = arte.C;
  const S = { doc, PW, PH, M, W, C, y:0 };
  const cor = c=>doc.setTextColor(c[0], c[1], c[2]);
  const fonte = (t, e)=>{ doc.setFont('helvetica', e||'normal'); doc.setFontSize(t); };
  const txt = (s, x, y, o)=>doc.text(_pdfTxt(s), x, y, o);
  S.cor = cor; S.fonte = fonte; S.txt = txt;
  const marca = ()=>{ try{ doc.addImage(arte.marca, 'PNG', PW - 92, PH - 112, 86, 90, 'mt-marca', 'FAST'); }catch(e){} };
  S.nova = ()=>{
    doc.addPage(); marca();
    // faixa fina no topo das páginas seguintes
    doc.setFillColor(...C.p); doc.rect(0, 0, PW, 2.2, 'F');
    fonte(7.5, 'bold'); cor(C.p); txt('METATREINO', M, 9); fonte(7.5); cor(C.dim); txt(cab.titulo, PW - M, 9, { align:'right' });
    S.y = 15;
  };
  S.precisa = h=>{ if(S.y + h > PH - 18) S.nova(); };
  // capa (primeira página): faixa clara com o desenho, marca e título
  marca();
  doc.setFillColor(...C.pClaro); doc.rect(0, 0, PW, 46, 'F');
  try{ doc.addImage(arte.cab, 'PNG', 0, 0, PW, 45.5, 'mt-cab', 'FAST'); }catch(e){}
  doc.setFillColor(...C.p); doc.rect(0, 46, PW, 1.2, 'F');
  doc.setFillColor(...C.p); doc.roundedRect(M, 9, 7.5, 7.5, 1.8, 1.8, 'F'); fonte(9, 'bold'); doc.setTextColor(255,255,255); txt('M', M + 3.75, 14.3, { align:'center' });
  fonte(9, 'bold'); cor(C.p); txt('METATREINO', M + 10, 14.4);
  fonte(19, 'bold'); cor(C.ink); txt(cab.titulo, M, 27.5);
  fonte(9.5); cor(C.dim); txt(cab.sub, M, 34.5);
  if(cab.sub2){ fonte(8.5); txt(cab.sub2, M, 40); }
  S.y = 55;
  // ----- componentes -----
  S.secao = (t, sub, c)=>{
    c = c || C.p; S.precisa(18); S.y += 2;
    doc.setFillColor(...c); doc.roundedRect(M, S.y, 2.2, 8, 1, 1, 'F');
    fonte(13, 'bold'); cor(C.ink); txt(t, M + 5.5, S.y + 6);
    if(sub){ fonte(8); cor(C.dim); txt(sub, PW - M, S.y + 6, { align:'right' }); }
    S.y += 12;
  };
  S.cartoes = (itens, c)=>{
    c = c || C.p; const n = itens.length, gap = 3, w = (W - gap*(n-1))/n, h = 17; S.precisa(h + 4);
    itens.forEach((it, i)=>{ const x = M + i*(w + gap);
      doc.setFillColor(...C.zebra); doc.roundedRect(x, S.y, w, h, 2.5, 2.5, 'F'); doc.setFillColor(...c); doc.roundedRect(x, S.y + 3, 1.1, h - 6, .5, .5, 'F');
      fonte(n > 4 ? 11 : 12.5, 'bold'); cor(C.ink); txt(it.v, x + 4, S.y + 8); fonte(7.3); cor(C.dim); txt(it.l, x + 4, S.y + 13); });
    S.y += h + 5;
  };
  S.nota = (s, o)=>{ o = o || {}; fonte(o.t || 7.8, o.e || 'normal'); const ls = doc.splitTextToSize(_pdfTxt(s), W - (o.caixa ? 8 : 0));
    const h = ls.length*3.7 + (o.caixa ? 6 : 2); S.precisa(h + 2);
    if(o.caixa){ doc.setFillColor(...(o.fundo || C.aClaro)); doc.roundedRect(M, S.y, W, h, 2.5, 2.5, 'F'); cor(o.cor || C.ink); doc.text(ls, M + 4, S.y + 5); }
    else { cor(o.cor || C.dim); doc.text(ls, M, S.y + 3); }
    S.y += h + 2; };
  // tabela com quebra de linha nas colunas de texto, cabeçalho repetido em página nova e linhas alternadas
  S.tabela = (cols, linhas, o)=>{
    o = o || {}; const tot = cols.reduce((a,c)=>a+c.w, 0); const k = W/tot; const xs = []; let acc = M; cols.forEach(c=>{ xs.push(acc); acc += c.w*k; });
    const cabec = ()=>{ S.precisa(9); doc.setFillColor(...(o.cabCor || C.pClaro)); doc.roundedRect(M, S.y, W, 7, 1.5, 1.5, 'F'); fonte(7.4, 'bold'); cor(o.cabTxt || C.p);
      cols.forEach((c, i)=>txt(c.t, c.dir ? xs[i] + c.w*k - 1.8 : xs[i] + 1.8, S.y + 4.7, c.dir ? { align:'right' } : undefined)); S.y += 8.2; };
    cabec();
    linhas.forEach((l, li)=>{
      fonte(o.t || 8.2);
      const cel = l.map((v, i)=>{ const c = cols[i]; const s = _pdfTxt(v); return c.quebra ? doc.splitTextToSize(s, c.w*k - 3.6) : [s]; });
      const h = Math.max(...cel.map(x=>x.length))*3.6 + 2.8;
      if(S.y + h > PH - 18){ S.nova(); cabec(); fonte(o.t || 8.2); }
      if(li % 2 === 1){ doc.setFillColor(...C.zebra); doc.rect(M, S.y - 0.4, W, h, 'F'); }
      cel.forEach((ls, i)=>{ const c = cols[i]; cor(c.cor || C.ink); doc.setFont('helvetica', c.negrito ? 'bold' : 'normal');
        doc.text(ls, c.dir ? xs[i] + c.w*k - 1.8 : xs[i] + 1.8, S.y + 3.3, c.dir ? { align:'right' } : undefined); });
      S.y += h;
    });
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.2); doc.line(M, S.y, M + W, S.y); S.y += 4;
  };
  S.fim = (nomeArq, aluno)=>{
    const n = doc.getNumberOfPages();
    for(let i = 1; i <= n; i++){
      doc.setPage(i);
      doc.setDrawColor(...C.p); doc.setLineWidth(0.5); doc.line(M, PH - 12, M + 18, PH - 12);
      doc.setDrawColor(...C.linha); doc.setLineWidth(0.2); doc.line(M + 19, PH - 12, PW - M, PH - 12);
      fonte(7); cor(C.dim); txt(`MetaTreino · ${aluno} · gerado em ${new Date().toLocaleDateString('pt-BR')}`, M, PH - 7.5); txt(`Página ${i} de ${n}`, PW - M, PH - 7.5, { align:'right' });
    }
    return { doc, nome: nomeArq };
  };
  return S;
}
function _pdfAluno(){ return (state.user && state.user.profile && state.user.profile.nickname) || (state.user && state.user.name) || (fbUser && fbUser.displayName) || 'Aluno'; }
async function _pdfGerar(rec, tipo, montar, rotulo){
  if(!mtTem(rec)) return mtPremiumAviso(rec);
  toast('📄 Montando o PDF...');
  try{
    const [jsPDF, arte] = await Promise.all([_carregaJsPDF(), pdfPrepArte(tipo)]);
    const r = montar(jsPDF, arte);
    _pdfMostrarB40(r.doc.output('blob'), r.nome, rotulo);
  }catch(e){
    console.log('PDF:', e);
    toast('⚠️ Não foi possível gerar o PDF' + (navigator.onLine === false ? ' — abra o app com internet uma vez para baixar o gerador.' : '.'));
  }
}
function _pdfMostrarB40(blob, nome, rotulo){
  _pdfMostrar(blob, nome);
  try{ const h = document.querySelector('#modal-inner h3'); if(h && rotulo) h.textContent = '✅ ' + rotulo + ' pronto'; }catch(e){}
  $('modal-back').classList.add('on');
}

// ---------- 1. Plano de musculação ----------
const _GOAL_LIFT = { hipertrofia:'Hipertrofia', forca:'Força', emagrecimento:'Emagrecimento', resistencia:'Resistência' };
const _NIVEL_LIFT = { iniciante:'Iniciante', intermediario:'Intermediário', avancado:'Avançado' };
function _ultimaCarga(id){
  const L = (state.progress[id]||[]).filter(p=>p.sets && p.sets.length); if(!L.length) return '';
  const u = L[L.length-1]; const kg = Math.max(...u.sets.map(s=>+s.peso||0));
  return kg > 0 ? _fmtN(kg, kg % 1 ? 1 : 0) + ' kg' : '';
}
function pdfMontarTreino(jsPDF, arte){
  const mod = state.modules.lift; const st = mod.setup || {}; const ws = (mod.plan && mod.plan.workouts) || [];
  const modal = { calistenia:'Calistenia', hibrido:'Híbrido (musculação + calistenia)' }[st.modalidade] || 'Musculação';
  const ini = mod.startAt ? new Date(mod.startAt).toLocaleDateString('pt-BR') : '';
  const S = pdfDoc(jsPDF, arte, { titulo:`Plano de treino · ${modal}`, sub:`${_pdfAluno()} · ${_GOAL_LIFT[st.goal]||st.goal||''} · nível ${_NIVEL_LIFT[st.level]||st.level||''}`, sub2:`${ws.length} treinos por semana${ini?` · início em ${ini}`:''}` });
  const totalEx = ws.reduce((s,w)=>s+(w.exercises||[]).length, 0), totalSer = ws.reduce((s,w)=>s+(w.exercises||[]).reduce((a,e)=>a+(+e.sets||0),0), 0);
  S.cartoes([{ v:String(ws.length), l:'treinos na semana' }, { v:String(totalEx), l:'exercícios' }, { v:String(totalSer), l:'séries por semana' }, { v:_fmtN(ws.reduce((s,w)=>s+(+w.duration||0),0)/Math.max(1,ws.length)) + ' min', l:'duração média' }]);
  const lims = (typeof limDoSetup === 'function') ? limDoSetup(st) : [];
  if(lims.length) S.nota(`Adaptado ao que você informou (${lims.map(k=>LIM_NOME[k]).join(', ')}): exercícios que forçam essas regiões foram trocados e o volume foi contido. Use cargas que não provoquem dor; se a dor persistir ou piorar, procure avaliação profissional.`, { caixa:true });
  ws.slice().sort((a,b)=>(a.dayIdx||9)-(b.dayIdx||9)).forEach(w=>{
    S.secao(`${w.k ? 'Treino ' + w.k + ' · ' : ''}${String(w.name||'').replace(/^Treino\s+\w\s*[—-]\s*/,'')}`, `${w.dayName||''}${w.duration?` · ~${w.duration} min`:''}`);
    const ex = w.exercises || [];
    S.tabela([{t:'#', w:6}, {t:'Exercício', w:66, quebra:true, negrito:true}, {t:'Grupo', w:24, quebra:true, cor:arte.C.dim}, {t:'Séries', w:14, dir:1}, {t:'Repetições', w:22, dir:1}, {t:'Descanso', w:20, dir:1}, {t:'Última carga', w:22, dir:1}, {t:'Anotações', w:26}],
      ex.map((e, i)=>[String(i+1), e.name + (e.adaptadoDe ? ` (no lugar de ${e.adaptadoDe})` : ''), e.part || e.sub || '', String(e.sets||''), String(e.reps||''), String(e.rest||''), _ultimaCarga(e.id), '']));
  });
  S.secao('Como usar este plano', null, arte.C.a);
  S.nota('Aquecimento: 5 a 8 minutos de cardio leve e 1 a 2 séries leves do primeiro exercício. Faça as repetições com técnica controlada; quando fechar o topo da faixa em todas as séries com folga, suba a carga no treino seguinte (o app mostra a sugestão em cada exercício). Ao terminar, registre o esforço de 1 a 10: ele ajusta as próximas sugestões.', { cor:arte.C.ink, t:8.4 });
  S.nota('Plano gerado pelo MetaTreino a partir das suas respostas e do seu histórico. É uma orientação geral e não substitui avaliação médica nem o acompanhamento de um profissional de educação física.');
  return S.fim(`metatreino-plano-treino-${chaveDia(new Date())}.pdf`, _pdfAluno());
}
// ---------- 2. Plano de corrida ----------
function pdfMontarCorrida(jsPDF, arte){
  const mod = state.modules.run; const st = mod.setup || {}; const ws = (mod.plan && mod.plan.workouts) || [];
  const TER = { asfalto:'Asfalto', esteira:'Esteira', trilha:'Trilha', pista:'Pista' };
  const OBJ = { comecar:'Começar a correr', condicionamento:'Condicionamento', '5km':'5 km', '10km':'10 km', '21km':'Meia maratona (21 km)', '42km':'Maratona (42 km)' };
  const prova = st.raceDate ? new Date(st.raceDate + 'T12:00:00').toLocaleDateString('pt-BR') : '';
  const S = pdfDoc(jsPDF, arte, { titulo:'Plano de corrida', sub:`${_pdfAluno()} · objetivo: ${OBJ[st.goal]||st.goal||''} · nível ${({iniciante:'iniciante',intermediario:'intermediário',avancado:'avançado'})[(mod.plan||{}).level] || (mod.plan||{}).level || ''}`, sub2:`${ws.length} treinos por semana · terreno: ${TER[st.terrain]||'asfalto'}${prova?` · prova em ${prova}`:''}` });
  const min = ws.reduce((s,w)=>s+(+w.duration||0), 0);
  S.cartoes([{ v:String(ws.length), l:'treinos na semana' }, { v:_fmtHoras(min), l:'tempo total previsto' }, { v:TER[st.terrain]||'Asfalto', l:'terreno preferido' }, { v:prova || '-', l:'prova alvo' }], arte.C.a);
  ws.slice().sort((a,b)=>(a.dayIdx||9)-(b.dayIdx||9)).forEach(w=>{
    const mo = w.motor || {};
    S.secao(`${w.dayName||''} · ${String(w.name||'Treino').replace(/^[^\wÀ-ú]+/,'')}`, `${w.duration?`~${w.duration} min`:''}${mo.int?` · ${mo.int}`:''}`, arte.C.a);
    const linhas = [];
    (w.blocks||[]).forEach(b=>(b.exs||[]).forEach(e=>linhas.push([b.name, e.name, e.desc||'', e.min ? e.min + ' min' : ''])));
    if(linhas.length) S.tabela([{t:'Etapa', w:24, cor:arte.C.dim}, {t:'O que fazer', w:52, quebra:true, negrito:true}, {t:'Como', w:84, quebra:true}, {t:'Tempo', w:16, dir:1}], linhas, { cabCor:arte.C.aClaro, cabTxt:arte.C.a, t:7.9 });
    const alvo = mo.alvo || w.targetPace; if(alvo) S.nota(`Meta: ${alvo}`, { cor:arte.C.ink, e:'bold', t:8.2 });
    if((mo.orient||[]).length) S.nota(mo.orient.join(' '), { t:7.8 });
  });
  S.secao('Escala de esforço (1 a 10)', null, arte.C.a);
  S.tabela([{t:'Esforço', w:20, negrito:true}, {t:'Como fica', w:150, quebra:true}], [['2-3','Muito leve: dá para conversar sem esforço.'],['3-4','Leve: frases inteiras sem perder o fôlego (a maior parte dos treinos).'],['5-6','Moderado: frases curtas.'],['7','Forte e sustentável: só palavras soltas.'],['8-9','Muito forte: sem conseguir falar, só por alguns minutos.']], { cabCor:arte.C.aClaro, cabTxt:arte.C.a });
  S.nota('Plano gerado pelo MetaTreino. Registre cada treino com o esforço: o plano avança ou segura conforme você responde. Dor que persiste ou piora correndo precisa de avaliação profissional.');
  return S.fim(`metatreino-plano-corrida-${chaveDia(new Date())}.pdf`, _pdfAluno());
}
// ---------- 3. Plano alimentar ----------
function pdfMontarAlimentacao(jsPDF, arte){
  const p0 = nutriMontarPlano(getDayIdx());
  if(p0.erro) throw new Error(p0.erro === 'menor' ? 'Plano alimentar não disponível para menores de 18 anos' : 'Complete peso, altura, idade e sexo no cadastro');
  const n = nutriConfig(); const c = p0.calc;
  const FL = { emagrecer:'Emagrecer', massa:'Ganhar massa', manter:'Manter / recomposição' };
  const extras = [n.vegetariano?'vegetariano':'', n.semLactose?'sem lactose':'', n.semGluten?'sem glúten':'', n.economico?'econômico':''].filter(Boolean).join(', ');
  const S = pdfDoc(jsPDF, arte, { titulo:'Plano alimentar da semana', sub:`${_pdfAluno()} · objetivo: ${FL[c.objetivo]||c.objetivo} · ${n.refeicoes} refeições por dia`, sub2:extras ? `Preferências: ${extras}` : 'Valores calculados pelo seu peso, altura, idade, sexo, treinos e objetivo' });
  S.cartoes([{ v:_fmtN(c.kcal) + ' kcal', l:'meta média do dia' }, { v:c.prot + ' g', l:'proteína' }, { v:c.carb + ' g', l:'carboidrato' }, { v:c.gord + ' g', l:'gordura' }, { v:String(c.agua).replace('.',',') + ' L', l:'água' }]);
  S.nota(`Gasto estimado: ${_fmtN(c.tdee)} kcal por dia com ${c.dias} treinos por semana. Dias de treino têm um pouco mais de calorias; dias de descanso, um pouco menos — a média da semana fica na meta. ${c.ajusteNota||''}`);
  const DN = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  for(let d = 1; d <= 7; d++){
    const pl = nutriMontarPlano(d); if(pl.erro) continue;
    const lg = nutriLogDe(nutriKeyDia(d));
    const refs = pl.refeicoes.map(m=>{ const l = lg(m.id); const itens = [...m.itens.map(i=>nutriEfetivo(i, l.adj[i.id])), ...(l.add||[]).map((a,i)=>nutriItemExtra(a,i)).filter(Boolean)].filter(i=>!i.removido); return { m, itens, tot:nutriSomaItens(itens) }; });
    const dia = nutriSomaItens(refs.map(r=>r.tot));
    if(d > 1) S.precisa(70);
    S.secao(`${DN[d-1]} · ${pl.treino ? 'dia de treino' : 'dia de descanso'}`, `${_fmtN(dia.kcal)} kcal · P ${_fmtN(dia.p)} g · C ${_fmtN(dia.c)} g · G ${_fmtN(dia.g)} g`);
    S.tabela([{t:'Refeição', w:30, negrito:true, quebra:true}, {t:'Alimentos e quantidades', w:92, quebra:true}, {t:'kcal', w:13, dir:1}, {t:'P', w:11, dir:1}, {t:'C', w:11, dir:1}, {t:'G', w:11, dir:1}],
      refs.map(r=>[`${r.m.nome}${r.m.compartilhada?' (casa)':''}\n${r.m.hora}`, r.itens.map(i=>{ const u = (typeof nutriUso==='function') ? nutriUso(i.id, true) : ''; return `${i.nome}: ${i.texto}${u ? ' — ' + u : ''}`; }).join('\n'), _fmtN(r.tot.kcal), _fmtN(r.tot.p), _fmtN(r.tot.c), _fmtN(r.tot.g)]), { t:7.8 });
  }
  // Beta 58: a lista de compras tem PDF próprio (pdfListaCompras, parte 62) — o cardápio não a repete
  const eq = nutriEquivalencias();
  S.secao('Trocas equivalentes', 'mesma quantidade do nutriente', arte.C.a);
  S.tabela([{t:'Grupo', w:34, negrito:true, quebra:true}, {t:'Opções (cada uma vale o mesmo)', w:142, quebra:true}], eq.map(g=>[`${g.t.replace(/^[^\wÀ-ú]+/,'')}\n${g.sub}`, g.l.join(' · ')]), { cabCor:arte.C.aClaro, cabTxt:arte.C.a, t:7.8 });
  S.nota('Valores aproximados (tabelas brasileiras de composição de alimentos). É uma orientação geral e não substitui um nutricionista; se você tem doença, alergia ou usa medicação, procure um profissional. P = proteína, C = carboidrato, G = gordura (em gramas).');
  return S.fim(`metatreino-plano-alimentar-${chaveDia(new Date())}.pdf`, _pdfAluno());
}
function pdfTreino(m){
  m = m || (state.active === 'run' ? 'run' : 'lift');
  if(!state.modules[m] || !state.modules[m].plan) return toast('Você ainda não tem esse plano.');
  return _pdfGerar('pdfTreino', m === 'run' ? 'corrida' : 'musculacao', m === 'run' ? pdfMontarCorrida : pdfMontarTreino, m === 'run' ? 'Plano de corrida' : 'Plano de treino');
}
function pdfAlimentacao(){ return _pdfGerar('pdfAlimentacao', 'alimentacao', pdfMontarAlimentacao, 'Plano alimentar'); }

// ---------- 4. botões ----------
mtGancho('renderPlan', { depois(){
  try{
    const box = $('plan-details'); if(!box) return;
    const ex = $('pl-pdf'); if(ex) ex.remove();
    box.insertAdjacentHTML('afterend', `<button class="btn btn-outline btn-block" id="pl-pdf" style="margin-top:12px" onclick="pdfTreino()">📄 Baixar o plano em PDF${mtPremium()?'':' <span class="pl-mini">'+PL_EST+'</span>'}</button>`);
  }catch(e){}
}});
mtGancho('openNutri', { depois(){
  try{
    if(!mtTem('alimentacao')) return;
    const mi = $('modal-inner'); if(!mi || mi.querySelector('#nutri-pdf')) return;
    const bt = [...mi.querySelectorAll('button')].find(b=>/nutriListaCompras\(\)/.test(b.getAttribute('onclick')||''));
    if(bt) bt.insertAdjacentHTML('afterend', `<button class="btn btn-ghost btn-block" id="nutri-pdf" style="margin:0 0 8px" onclick="pdfAlimentacao()">📄 Plano alimentar em PDF</button>`);
  }catch(e){}
}});
mtGancho('renderProfile', { depois(){
  try{
    const rel = document.querySelector('#scr-profile .list-row[onclick*="arqRelatorio"]'); if(!rel || $('pf-pdf-plano')) return;
    rel.insertAdjacentHTML('afterend', `<div class="list-row" id="pf-pdf-plano" onclick="pdfTreino()">📋 <span>Plano de treino em PDF</span>${mtPremium()?'<span style="margin-left:auto;color:var(--text-mute);font-size:12px">›</span>':'<span class="pl-mini" style="margin-left:auto">'+PL_EST+'</span>'}</div>`);
  }catch(e){}
}});

Object.assign(window, { pdfCores, pdfPrepArte, pdfArteCab, pdfArteMarca, pdfDoc, pdfTreino, pdfAlimentacao, pdfMontarTreino, pdfMontarCorrida, pdfMontarAlimentacao });

// =====================================================================
// 62. Beta 58 — PDFs: cardápio, lista de compras e treino como documentos distintos
// ---------------------------------------------------------------------
//  • Cabeçalho profissional e discreto: faixa clara com um ícone de linha fina (sem desenhos
//    coloridos de maçã/brócolis nem o boneco de palito). Sem marca d'água: mais limpo na impressão.
//  • Plano alimentar: só o cardápio (dia → refeição e horário → alimentos e quantidades → orientação).
//  • Lista de compras: PDF próprio — por categoria, com caixinha para marcar, total do período e,
//    na casa, a parte de cada pessoa. Nenhuma refeição nem dado do plano de ninguém.
//  • Plano de treino: mapa anatômico (frente e costas) com os músculos da semana, gerado do mesmo
//    desenho do Mapa muscular (parte 53), e cada exercício numa linha com hierarquia clara.
// =====================================================================

// ---------- cabeçalho e marca ----------
const _PDF_ICONE = {
  musculacao: 'M478 65 H522 M470 50 V80 M462 56 V74 M530 50 V80 M538 56 V74',
  corrida:    'M462 88 C 478 70 490 92 504 74 S 528 52 540 60 M540 60 m-7 -15 a7 7 0 1 1 14 0 c0 7 -7 11 -7 16 c0 -5 -7 -9 -7 -16z',
  alimentacao:'M500 65 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0 M466 42 V88 M462 42 V54 Q466 59 470 54 V42 M534 42 Q542 56 535 68 V88',
  compras:    'M466 52 H476 L484 80 H526 L533 60 H480 M490 88 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M520 88 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
  relatorio:  'M466 86 H536 M470 78 L488 64 L502 72 L530 48 M520 48 H530 V58'
};
window.pdfArteCab = function(tipo, C){
  const P = _pdfHexDe(C.p), PC = _pdfHexDe(_pdfMistura(C.p, 0.86)), AC = _pdfHexDe(_pdfMistura(C.a, 0.86));
  const d = _PDF_ICONE[tipo] || _PDF_ICONE.relatorio;
  return _svgFig(`<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${PC}" stop-opacity="0"/><stop offset="1" stop-color="${AC}" stop-opacity=".9"/></linearGradient></defs>
    <rect x="300" y="0" width="300" height="130" fill="url(#g)"/>
    ${[0,1,2,3].map(i=>`<circle cx="500" cy="65" r="${44 + i*22}" fill="none" stroke="${P}" stroke-width="1" opacity="${0.22 - i*0.05}"/>`).join('')}
    <circle cx="500" cy="65" r="38" fill="#ffffff" opacity=".92"/>
    <path d="${d}" fill="none" stroke="${P}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`, '0 0 600 130');
};
window.pdfArteMarca = function(){ return _svgFig('', '0 0 10 10'); };

// mapa anatômico da semana (frente e costas lado a lado), com estilo próprio para impressão
function _pdfCorpoSVG(papeis, C){
  const sexo = (typeof _mmSexo === 'function') ? _mmSexo() : null;
  const corpo = v=>mmCorpoSVG(v, sexo).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const P = _pdfHexDe(C.p), S2 = _pdfHexDe(_pdfMistura(C.p, 0.55));
  const regras = Object.keys(papeis).map(k=>`.mm-m[data-m="${k}"]{fill:${papeis[k] === 'prim' ? P : S2}}`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 392 440"><style>
    path,ellipse{stroke-linejoin:round}.mm-sil,.mm-ext,.mm-est{fill:#eef0f3;stroke:#a9b0bb;stroke-width:.9}
    .mm-cab{fill:#c9ced6;stroke:#a9b0bb;stroke-width:.8}.mm-lin{fill:none;stroke:#a9b0bb;stroke-width:.6}
    .mm-m{fill:#e3e6eb;stroke:#a9b0bb;stroke-width:.8}${regras}</style>
    <g transform="translate(-12,2)">${corpo('frente')}</g><g transform="translate(192,2)">${corpo('costas')}</g></svg>`;
}
function _pdfPapeisSemana(ws){
  const papeis = {}, series = {};
  ws.forEach(w=>(w.exercises||[]).forEach(e=>{ let m; try{ m = mmMusculosDe(e); }catch(x){ return; } const n = +e.sets || 0;
    m.prim.forEach(k=>{ papeis[k] = 'prim'; series[k] = (series[k]||0) + n; });
    m.sec.forEach(k=>{ if(papeis[k] !== 'prim') papeis[k] = 'sec'; series[k] = (series[k]||0) + n*0.5; }); }));
  return { papeis, series };
}
(function(){
  const _prep = window.pdfPrepArte;
  window.pdfPrepArte = async function(tipo){
    const a = await _prep.apply(this, arguments);
    a.marca = null;   // sem marca d'água
    if(tipo === 'musculacao'){
      try{ const ws = (state.modules.lift && state.modules.lift.plan && state.modules.lift.plan.workouts) || [];
        const S = _pdfPapeisSemana(ws); a.semana = S;
        if(Object.keys(S.papeis).length) a.corpo = await _svgPng(_pdfCorpoSVG(S.papeis, a.C), 784, 880, 1);
      }catch(e){ console.log('mapa do PDF:', e); }
    }
    return a;
  };
})();

// ---------- plano de treino ----------
window.pdfMontarTreino = function(jsPDF, arte){
  const mod = state.modules.lift; const st = mod.setup || {}; const ws = ((mod.plan && mod.plan.workouts) || []).slice().sort((a,b)=>(a.dayIdx||9)-(b.dayIdx||9));
  const modal = { calistenia:'Calistenia', hibrido:'Híbrido (musculação + calistenia)' }[st.modalidade] || 'Musculação';
  const ini = mod.startAt ? new Date(mod.startAt).toLocaleDateString('pt-BR') : '';
  const S = pdfDoc(jsPDF, arte, { titulo:`Plano de treino · ${modal}`, sub:`${_pdfAluno()} · ${_GOAL_LIFT[st.goal]||st.goal||''} · nível ${_NIVEL_LIFT[st.level]||st.level||''}`, sub2:`${ws.length} treinos por semana${ini?` · início em ${ini}`:''}` });
  const { doc, M, W, C } = S;
  const totalEx = ws.reduce((s,w)=>s+(w.exercises||[]).length, 0), totalSer = ws.reduce((s,w)=>s+(w.exercises||[]).reduce((a,e)=>a+(+e.sets||0),0), 0);
  S.cartoes([{ v:String(ws.length), l:'treinos na semana' }, { v:String(totalEx), l:'exercícios' }, { v:String(totalSer), l:'séries por semana' }, { v:_fmtN(ws.reduce((s,w)=>s+(+w.duration||0),0)/Math.max(1,ws.length)) + ' min', l:'duração média' }]);
  const lims = (typeof limDoSetup === 'function') ? limDoSetup(st) : [];
  if(lims.length) S.nota(`Adaptado ao que você informou (${lims.map(k=>LIM_NOME[k]).join(', ')}): exercícios que forçam essas regiões foram trocados e o volume foi contido. Use cargas que não provoquem dor; se a dor persistir ou piorar, procure avaliação profissional.`, { caixa:true });
  // músculos da semana: figura à esquerda, séries por músculo à direita (sem espaço vazio)
  if(arte.corpo && arte.semana){
    const ks = Object.keys(arte.semana.series).sort((a,b)=>arte.semana.series[b]-arte.semana.series[a]);
    const fw = 58, fh = fw*440/392; S.precisa(fh + 18);
    S.secao('Músculos trabalhados na semana', 'pelas séries do plano');
    const y0 = S.y;
    try{ doc.addImage(arte.corpo, 'PNG', M, y0, fw, fh, 'mt-corpo', 'FAST'); }catch(e){}
    S.fonte(6.8); S.cor(C.dim); S.txt('FRENTE', M + fw*0.24, y0 + fh + 3.4, { align:'center' }); S.txt('COSTAS', M + fw*0.75, y0 + fh + 3.4, { align:'center' });
    const x = M + fw + 8, cw = W - fw - 8; let y = y0 + 2;
    const max = Math.max(1, ...ks.map(k=>arte.semana.series[k]));
    ks.slice(0, 14).forEach(k=>{
      const v = arte.semana.series[k]; const prim = arte.semana.papeis[k] === 'prim';
      S.fonte(8.2, prim ? 'bold' : 'normal'); S.cor(C.ink); S.txt((MM_INFO[k]||{}).nome || k, x, y + 3);
      S.fonte(8); S.cor(C.dim); S.txt(`${_fmtN(v, 1)} séries`, x + cw, y + 3, { align:'right' });
      doc.setFillColor(...C.zebra); doc.roundedRect(x, y + 4.4, cw, 1.6, .8, .8, 'F');
      doc.setFillColor(...(prim ? C.p : _pdfMistura(C.p, 0.55))); doc.roundedRect(x, y + 4.4, Math.max(1.6, cw*v/max), 1.6, .8, .8, 'F');
      y += 8.2;
    });
    S.fonte(7); S.cor(C.dim); S.txt('Escuro: músculo principal · claro: secundário (conta meia série)', x, Math.max(y, y0) + 2);
    S.y = Math.max(y + 6, y0 + fh + 8);
  }
  // cada treino: cabeçalho, foco e uma linha por exercício
  const cols = { n:M, ex:M + 8, ser:M + 92, desc:M + 124, carga:M + 143, nota:M + 163 };
  const cab = ()=>{ doc.setFillColor(...C.pClaro); doc.roundedRect(M, S.y, W, 6.4, 1.4, 1.4, 'F'); S.fonte(7, 'bold'); S.cor(C.p);
    S.txt('EXERCÍCIO', cols.ex, S.y + 4.3); S.txt('SÉRIES × REPETIÇÕES', cols.ser, S.y + 4.3); S.txt('DESCANSO', cols.desc, S.y + 4.3); S.txt('ÚLTIMA', cols.carga, S.y + 4.3); S.txt('ANOTAÇÕES', cols.nota, S.y + 4.3); S.y += 7.6; };
  ws.forEach(w=>{
    S.precisa(34);
    S.secao(`${w.k ? 'Treino ' + w.k + ' · ' : ''}${String(w.name||'').replace(/^Treino\s+\w\s*[—-]\s*/,'')}`, `${w.dayName||''}${w.duration?` · ~${w.duration} min`:''}`);
    try{ const Mu = _mmMusculosDoTreino(w); const foco = Object.keys(Mu.prim).map(k=>_mmCurto(k)); if(foco.length) S.nota(`Foco: ${_mmLista(foco)}.`, { t:7.8 }); }catch(e){}
    cab();
    (w.exercises||[]).forEach((e, i)=>{
      const nome = doc.splitTextToSize(_pdfTxt(e.name + (e.adaptadoDe ? ` (no lugar de ${e.adaptadoDe})` : '')), cols.ser - cols.ex - 3);
      const h = Math.max(10.5, nome.length*3.7 + 6.5);
      if(S.y + h > S.PH - 18){ S.nova(); cab(); }
      if(i % 2 === 1){ doc.setFillColor(...C.zebra); doc.rect(M, S.y - 0.6, W, h, 'F'); }
      doc.setFillColor(...C.pClaro); doc.circle(cols.n + 3, S.y + 3.4, 2.7, 'F'); S.fonte(7.4, 'bold'); S.cor(C.p); S.txt(String(i+1), cols.n + 3, S.y + 4.5, { align:'center' });
      S.fonte(8.8, 'bold'); S.cor(C.ink); doc.text(nome, cols.ex, S.y + 4.2);
      S.fonte(7.2); S.cor(C.dim); S.txt(e.part || e.sub || '', cols.ex, S.y + 4.2 + nome.length*3.7);
      S.fonte(9.5, 'bold'); S.cor(C.ink); S.txt(`${e.sets||'-'} × ${e.reps||'-'}`, cols.ser, S.y + 4.4);
      S.fonte(8.2); S.cor(C.ink); S.txt(String(e.rest||'-'), cols.desc, S.y + 4.4);
      const u = _ultimaCarga(e.id); S.cor(u ? C.ink : C.dim); S.txt(u || '-', cols.carga, S.y + 4.4);
      doc.setDrawColor(...C.linha); doc.setLineWidth(0.25); doc.line(cols.nota, S.y + h - 2.4, M + W, S.y + h - 2.4);
      S.y += h;
    });
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.2); doc.line(M, S.y, M + W, S.y); S.y += 5;
  });
  S.secao('Como usar este plano', null, C.a);
  S.nota('Aquecimento: 5 a 8 minutos de cardio leve e 1 a 2 séries leves do primeiro exercício. Faça as repetições com técnica controlada; quando fechar o topo da faixa em todas as séries com folga, suba a carga no treino seguinte (o app mostra a sugestão em cada exercício). Cada série pode ter carga e repetições diferentes — registre como fez. Ao terminar, registre o esforço de 1 a 10: ele ajusta as próximas sugestões.', { cor:C.ink, t:8.4 });
  S.nota('Plano gerado pelo MetaTreino a partir das suas respostas e do seu histórico. É uma orientação geral e não substitui avaliação médica nem o acompanhamento de um profissional de educação física.');
  return S.fim(`metatreino-plano-treino-${chaveDia(new Date())}.pdf`, _pdfAluno());
};

// ---------- lista de compras (PDF próprio) ----------
function pdfMontarCompras(jsPDF, arte){
  const escopo = window.__comprasEsc || '7dias'; const modo = (window.__comprasModo === 'casa' && famAtiva()) ? 'casa' : 'eu';
  const R = nutriComprasTotais(escopo, modo); const tot = R.tot;
  const semKey = chaveDia(nutriDataDia(1)) + (R.casa ? '-casa' : ''); const ok = ((state.comprasOk||{})[semKey]) || {};
  const S = pdfDoc(jsPDF, arte, { titulo: R.casa ? 'Lista de compras da casa' : 'Lista de compras', sub:`Período: ${_famPeriodoTxt(R.periodo)}${R.casa ? ` · ${R.pessoas} pessoas` : ''}`,
    sub2: R.casa ? 'Soma o que cada pessoa vai comer, na porção do próprio plano' : 'Pelo seu cardápio, já com as suas edições' });
  const { doc, M, W, C } = S;
  const ids = Object.keys(tot).filter(id=>!ok[id]); const jaTem = Object.keys(tot).filter(id=>ok[id]).length;
  const nCat = Object.values(NUTRI_CATEG).filter(([, l])=>l.some(id=>ids.includes(id))).length;
  S.cartoes([{ v:String(ids.length), l:'itens a comprar' }, { v:String(nCat), l:'categorias' }, { v:String(R.periodo.n||0), l: R.periodo.n === 1 ? 'dia' : 'dias' }].concat(R.casa ? [{ v:String(R.pessoas), l:'pessoas' }] : []), C.a);
  const porPessoa = R.casa && R.pessoas > 1;
  Object.values(NUTRI_CATEG).forEach(([titulo, lista])=>{
    const l = lista.filter(id=>ids.includes(id)); if(!l.length) return;
    S.precisa(16);
    S.fonte(9.6, 'bold'); S.cor(C.ink); S.txt(titulo.replace(/^[^\wÀ-ú]+/,''), M, S.y + 3); S.fonte(7.4); S.cor(C.dim); S.txt(`${l.length} ${l.length === 1 ? 'item' : 'itens'}`, M + W, S.y + 3, { align:'right' });
    doc.setDrawColor(...C.a); doc.setLineWidth(0.4); doc.line(M, S.y + 4.8, M + W, S.y + 4.8); S.y += 7.5;
    l.forEach((id, i)=>{
      const q = nutriQtdCompra(id, tot[id].g);
      const pp = porPessoa ? R.quem.filter(u=>tot[id].por[u]).map(u=>`${u===_famUid()?'Você':famNome(u)}: ${_nutriFmtCompra(id, { g:tot[id].por[u] })}`).join(' · ') : '';
      const h = pp ? 9.6 : 6.6; if(S.y + h > S.PH - 18) S.nova();
      if(i % 2 === 1){ doc.setFillColor(...C.zebra); doc.rect(M, S.y - 0.8, W, h, 'F'); }
      doc.setDrawColor(...C.dim); doc.setLineWidth(0.3); doc.roundedRect(M + 1, S.y + 0.4, 3.4, 3.4, .6, .6, 'S');
      S.fonte(8.8); S.cor(C.ink); S.txt(nutriNomeCompra(id) + (q.obs ? ` (${q.obs})` : ''), M + 7, S.y + 3.3);
      S.fonte(8.8, 'bold'); S.txt(`${q.n} ${q.un}`, M + W - 1.5, S.y + 3.3, { align:'right' });
      if(pp){ S.fonte(7); S.cor(C.dim); S.txt(pp, M + 7, S.y + 7); }
      S.y += h;
    });
    S.y += 3;
  });
  if(!ids.length) S.nota('Nada a comprar neste período.', { caixa:true });
  if(jaTem) S.nota(`${jaTem} ${jaTem === 1 ? 'item marcado' : 'itens marcados'} como “já tenho” no app ${jaTem === 1 ? 'ficou' : 'ficaram'} de fora.`, { t:7.6 });
  R.avisos.forEach(a=>S.nota(a, { t:7.4 }));
  S.nota('Grãos e carnes em peso cru; óleos e leite em ml/L; frutas e pães em unidades. Quantidades arredondadas para facilitar a compra.', { t:7.4 });
  return S.fim(`metatreino-lista-de-compras-${chaveDia(new Date())}.pdf`, _pdfAluno());
}
function pdfListaCompras(){ return _pdfGerar('pdfAlimentacao', 'compras', pdfMontarCompras, R_ROT_COMPRAS()); }
function R_ROT_COMPRAS(){ return (window.__comprasModo === 'casa' && famAtiva()) ? 'Lista de compras da casa' : 'Lista de compras'; }

// a tela da lista de compras: o botão de PDF gera a LISTA (antes gerava o plano alimentar inteiro)
mtGancho('nutriListaCompras', { depois(){
  try{
    const b = [...document.querySelectorAll('#fam-compras button')].find(x=>/pdfAlimentacao(Casa)?\(\)/.test(x.getAttribute('onclick')||''));
    if(b){ b.setAttribute('onclick', 'pdfListaCompras()'); b.textContent = '📄 Lista de compras em PDF'; }
  }catch(e){}
} });

Object.assign(window, { pdfListaCompras, pdfMontarCompras });

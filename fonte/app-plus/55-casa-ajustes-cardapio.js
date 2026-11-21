
// =====================================================================
// 55. Beta 52 — Ajustes da casa com calorias, PDF por pessoa, cardápio maior e "fora da rotina"
// =====================================================================
// • Prato da casa: o que o administrador tira ou acrescenta muda as calorias de cada pessoa (parte 49:
//   famPrato/nutriMontarPlano). Cada um vê "recomendado X → com o ajuste Y (±Z)" na refeição e no dia.
//   O administrador pode ligar "Manter as calorias de cada um" (as porções são recalculadas, como antes).
// • Cada pessoa publica no grupo a própria semana (o que vai comer em cada refeição, em gramas, e as
//   calorias: recomendado, ajuste da casa e com os próprios ajustes). Nada de peso, idade, altura ou e-mail.
// • PDF da casa: resumo por pessoa e por dia (recomendado × planejado e o motivo), o cardápio de CADA pessoa
//   separado e a lista de compras somada. No app, a lista mostra tudo junto.
// • Cardápio mais amplo: +45 pratos com os alimentos que já existem (cada refeição tem mais opções).
// • "Fora da rotina": comidas comuns do dia a dia (pizza, hambúrguer, refrigerante, cerveja, doces…) para
//   registrar o que comeu ou vai comer. Só no "Adicionar alimento": nunca entram no cardápio nem na lista de
//   compras. A informação é neutra: calorias e quanto representam da meta do dia, sem julgamento.

// ---------- 1. alimentos "fora da rotina" (valores médios aproximados por porção) ----------
// [nome, kcal/100 g, P, C, G, gramas da unidade, medida]
const NUTRI_FORA = {
  pizza:        ['Pizza de muçarela (fatia)', 270, 11, 30, 11.5, 110, null],
  hamburguer:   ['Hambúrguer de lanchonete', 255, 13, 25, 11.5, 200, null],
  cachorro:     ['Cachorro-quente', 250, 9, 26, 12, 180, null],
  batatafrita:  ['Batata frita (porção pequena)', 270, 4, 35, 13, 100, null],
  coxinha:      ['Coxinha frita', 280, 9, 30, 14, 110, null],
  pastel:       ['Pastel frito de carne', 390, 10, 36, 22, 80, null],
  salgadinho:   ['Salgadinho de pacote', 510, 6, 58, 28, 45, null],
  lasanha:      ['Lasanha à bolonhesa', 165, 9, 14, 8, null, null],
  refri:        ['Refrigerante comum (lata 350 ml)', 41, 0, 10.5, 0, 350, null],
  suco:         ['Suco de caixinha (copo 200 ml)', 45, 0, 11, 0, 200, null],
  cerveja:      ['Cerveja (lata 350 ml)', 43, 0.4, 3.6, 0, 350, null],
  vinho:        ['Vinho tinto (taça 150 ml)', 85, 0.1, 2.6, 0, 150, null],
  chocolate:    ['Chocolate ao leite (barrinha 25 g)', 540, 7, 60, 30, 25, null],
  brigadeiro:   ['Brigadeiro', 400, 4, 62, 15, 20, null],
  sorvete:      ['Sorvete de massa (bola)', 210, 3.5, 24, 11, 60, null],
  bolo:         ['Bolo de chocolate com cobertura (fatia)', 380, 5, 50, 18, 80, null],
  biscoito:     ['Biscoito recheado (unid.)', 470, 6, 70, 20, 13, null],
  acai:         ['Açaí com granola e banana (300 ml)', 160, 2, 25, 6, 300, null]
};
Object.entries(NUTRI_FORA).forEach(([id, v])=>{ if(!NUTRI_ALIMENTOS[id]) NUTRI_ALIMENTOS[id] = v; });
window.NUTRI_FORA_IDS = new Set(Object.keys(NUTRI_FORA));
if(typeof NUTRI_CATEG === 'object' && !NUTRI_CATEG.fora) NUTRI_CATEG.fora = ['🍕 Fora da rotina', Object.keys(NUTRI_FORA)];
// na lista de compras e no PDF a categoria nunca aparece (os itens já ficam fora das somas, parte 49)

// informação neutra ao registrar: quanto representa da meta do dia
mtGancho('nutriEdRender', { depois(){
  try{
    const e = window.__ned; if(!e || !window.NUTRI_FORA_IDS.has(e.fid)) return;
    const f = NUTRI_ALIMENTOS[e.fid]; const kcal = Math.round(f[1] * (e.un ? e.q*f[5] : e.q) / 100);
    const pl = nutriMontarPlano(nutriDiaSel()); const meta = pl && !pl.erro ? pl.calc.kcal : 0;
    const box = document.querySelector('#modal-inner .btn-primary'); if(!box || !meta) return;
    box.insertAdjacentHTML('beforebegin', `<p class="nf-info">Isso equivale a cerca de <b>${Math.round(kcal/meta*100)}%</b> da sua meta de hoje (${meta} kcal). Registrar o que você come de verdade deixa o resumo do dia certo; os valores são médias de porções comuns.</p>`);
  }catch(x){}
}});

// ---------- 2. cardápio mais amplo ----------
const NUTRI_PRATOS_B52 = {
  cafe: [
    { n:'Pão francês com requeijão e mamão', i:[['pao',1],['requeijao',20],['mamao',150],['leite',200]] },
    { n:'Crepioca de queijo com morango', i:[['tapioca',30],['ovo',2],['mucarela',1],['morango',120]] },
    { n:'Cuscuz com ovos mexidos e café com leite', i:[['cuscuz',100],['ovo',2],['leiteint',200]] },
    { n:'Mingau de aveia com morango e mel', i:[['aveia',40],['leite',250],['morango',100],['mel',10]] },
    { n:'Pão integral com peito de peru e laranja', i:[['paoint',2],['peru',40],['minas',30],['laranja',1]] },
    { n:'Iogurte com granola, mamão e mel', i:[['iogurte',170],['granola',30],['mamao',150],['mel',8]] },
    { n:'Omelete com tomate e pão de forma', i:[['ovo',2],['tomate',60],['paoforma',2],['uva',100]] }
  ],
  lanche1: [
    { n:'Iogurte com morango e granola', i:[['iogurte',170],['morango',100],['granola',20]] },
    { n:'Pera com castanhas', i:[['pera',1],['castanha',15]] },
    { n:'Pão de forma com queijo e tomate', i:[['paoforma',2],['queijoprato',1],['tomate',50]] },
    { n:'Melancia com iogurte e aveia', i:[['melancia',250],['iogurte',120],['aveia',15]] },
    { n:'Uva com queijo minas', i:[['uva',120],['minas',40]] }
  ],
  almoco: [
    { n:'Arroz, feijão, bife e salada', i:[['arroz',150],['feijao',100],['patinho',110],['salada',100],['azeite',4]] },
    { n:'Frango assado com batata e cenoura', i:[['frango',130],['batataing',200],['cenoura',80],['salada',80],['azeite',4]] },
    { n:'Peixe com arroz, feijão e abóbora', i:[['peixe',140],['arroz',120],['feijao',80],['abobora',100],['azeite',4]] },
    { n:'Macarrão com atum e tomate', i:[['macarrao',160],['atum',90],['tomate',80],['salada',60],['azeite',4]] },
    { n:'Sobrecoxa com arroz, feijão e milho', i:[['sobrecoxa',120],['arroz',130],['feijao',80],['milho',50],['salada',80]] },
    { n:'Lombo com feijão preto, arroz e salada', i:[['lombo',110],['feijaopreto',100],['arroz',120],['salada',100],['azeite',4]] }
  ],
  almocoVeg: [
    { n:'Grão-de-bico com arroz e legumes', i:[['grao',120],['arroz',120],['legumes',120],['salada',80],['azeite',4]] },
    { n:'Omelete de legumes com arroz e feijão', i:[['ovo',3],['legumes',100],['arroz',120],['feijao',80],['salada',60]] },
    { n:'Lentilha com abóbora e arroz integral', i:[['lentilha',130],['abobora',120],['arrozint',100],['salada',80],['azeite',4]] }
  ],
  lanche2: [
    { n:'Crepioca de frango', i:[['tapioca',30],['ovo',1],['frango',60],['tomate',40]] },
    { n:'Pão de forma com peito de peru e banana', i:[['paoforma',2],['peru',40],['banana',1]] },
    { n:'Iogurte com granola e morango', i:[['iogurte',170],['granola',25],['morango',100]] },
    { n:'Mandioca com ovo mexido', i:[['mandioca',150],['ovo',2]] }
  ],
  lanche2Veg: [
    { n:'Iogurte com granola e morango', i:[['iogurte',170],['granola',25],['morango',100]] },
    { n:'Tapioca com queijo e tomate', i:[['tapioca',60],['mucarela',2],['tomate',50]] }
  ],
  jantar: [
    { n:'Escondidinho de carne com mandioca', i:[['acem',110],['mandioca',180],['salada',100],['azeite',4]] },
    { n:'Frango com legumes e arroz integral', i:[['frango',130],['legumes',150],['arrozint',100],['azeite',4]] },
    { n:'Tilápia com purê de batata e salada', i:[['peixe',150],['batataing',200],['salada',100],['azeite',4]] },
    { n:'Wrap de tapioca com atum e salada', i:[['tapioca',70],['atum',90],['tomate',60],['salada',60]] },
    { n:'Sopa de lentilha com frango', i:[['lentilha',120],['frango',80],['legumes',120],['cenoura',60]] }
  ],
  jantarVeg: [
    { n:'Sopa de lentilha com legumes', i:[['lentilha',150],['legumes',150],['cenoura',60],['azeite',4]] },
    { n:'Grão-de-bico com abóbora e salada', i:[['grao',130],['abobora',150],['salada',100],['azeite',4]] },
    { n:'Tapioca de queijo com salada', i:[['tapioca',70],['minas',60],['tomate',60],['salada',80]] }
  ],
  ceia: [
    { n:'Iogurte com morango', i:[['iogurte',170],['morango',100]] },
    { n:'Mingau leve de aveia', i:[['aveia',25],['leite',200]] },
    { n:'Queijo minas com uva', i:[['minas',40],['uva',100]] },
    { n:'Ricota com mel', i:[['ricota',80],['mel',8]] },
    { n:'Pera com iogurte', i:[['pera',1],['iogurte',120]] }
  ]
};
(function(){
  try{
    NUTRI_REFEICOES.forEach(r=>{
      const add = (lista, novos)=>{ (novos||[]).forEach(p=>{ if(p.i.every(([id])=>NUTRI_ALIMENTOS[id]) && !lista.some(o=>o.n === p.n)) lista.push(p); }); };
      add(r.opcoes, NUTRI_PRATOS_B52[r.id]);
      if(Array.isArray(r.veg) && r.veg.length) add(r.veg, NUTRI_PRATOS_B52[r.id + 'Veg']);
    });
  }catch(e){ console.log('pratos b52', e); }
})();

// ---------- 3. administrador: manter ou não as calorias de cada um ----------
function famAlternaCompensa(){ _famCfgGrava('compensa', !_famCfg().compensa); }
mtGancho('openFamilia', { depois(){
  try{
    if(!famAtiva()) return; const mi = $('modal-inner'); if(!mi || mi.querySelector('#fam-compensa')) return;
    const eco = mi.querySelector('[onclick="famAlternaEconomico()"]'); const linha = eco && eco.closest('.mod-toggle'); if(!linha) return;
    const on = !!_famCfg().compensa, adm = famSouAdm();
    linha.insertAdjacentHTML('afterend', `<label class="fam-comp ${adm?'':'off'}" id="fam-compensa"><input type="checkbox" ${on?'checked':''} ${adm?'':'disabled'} onchange="famAlternaCompensa()">
      <span><b>Manter as calorias de cada um</b><small>${on ? 'Ao tirar ou acrescentar um alimento no prato da casa, as porções do resto do prato são recalculadas para cada pessoa continuar na própria meta.' : 'Desligado: tirar ou acrescentar um alimento muda as calorias de cada pessoa, e cada uma vê no plano quanto ficou a mais ou a menos.'}</small></span></label>`);
  }catch(e){}
}});

// ---------- 4. resumo do dia na tela do plano ----------
mtGancho('openNutri', { depois(){
  try{
    if(!famAtiva()) return; const mi = $('modal-inner'); if(!mi || mi.querySelector('#fam-ajuste-dia')) return;
    const pl = nutriMontarPlano(nutriDiaSel()); if(!pl || pl.erro) return;
    const ms = pl.refeicoes.filter(m=>m.mudouCasa); if(!ms.length) return;
    const primeira = mi.querySelector('details.mealc'); if(!primeira) return;
    const d = pl.casaDelta || 0, comp = ms.every(m=>m.compensada);
    const motivos = ms.map(m=>`${m.nome}: ${famAjusteNomes(m).join(', ')}`).join(' · ');
    primeira.insertAdjacentHTML('beforebegin', `<div class="fam-ajuste-dia ${d>0?'mais':d<0?'menos':''}" id="fam-ajuste-dia">🏠 <b>Ajustes do prato da casa hoje</b><br>${mtEsc(motivos)}<br>
      ${comp ? `Porções recalculadas: você continua com ~${Math.round(pl.dia.kcal)} kcal.` : `Recomendado <b>${pl.diaRec} kcal</b> → com os ajustes <b>${Math.round(pl.dia.kcal)} kcal</b> (${d>0?'+':d<0?'−':''}${Math.abs(d)} kcal).`}</div>`);
  }catch(e){ console.log('casa (dia):', e); }
}});

// ---------- 5. a minha semana, publicada no grupo (para o PDF da casa) ----------
// { dk: { r: recomendado, c: ajuste da casa, k: com os meus ajustes, m: { refeição: { n: prato, h: hora, i: [[id, g]], x: [[nome, kcal]] } } } }
function famMinhaSemana(){
  const out = {}; const hojeIdx = getDayIdx();
  for(let k=0; k<7; k++){
    const d = ((hojeIdx-1+k)%7)+1, dk = chaveDia(new Date(Date.now()+k*86400000));
    const pl = nutriMontarPlanoData(d, dk); if(!pl || pl.erro) continue;
    const lg = nutriLogDe(dk); const m = {}; let tot = 0;
    pl.refeicoes.forEach(r=>{
      const l = lg(r.id); const i = [], x = [];
      r.itens.forEach(it=>{ const e = nutriEfetivo(it, l.adj[it.id]); if(e.removido) return; tot += e.kcal; i.push([e.id, Math.round(e.gramas)]); });
      (l.add||[]).forEach((a,idx)=>{ const e = nutriItemExtra(a, idx); if(!e) return; tot += e.kcal; if(e.custom) x.push([String(e.nome||'').slice(0,40), Math.round(e.kcal)]); else i.push([e.id, Math.round(e.gramas)]); });
      m[r.id] = { n: r.prato, h: r.hora, i }; if(x.length) m[r.id].x = x;
    });
    out[dk] = { r: pl.diaRec || Math.round(pl.dia.kcal), c: pl.casaDelta || 0, k: Math.round(tot), m };
  }
  return out;
}

// ---------- 6. PDF da casa: por pessoa ----------
function _famQtdTxt(id, g){
  const a = NUTRI_ALIMENTOS[id]; if(!a) return '';
  if(a[5]) return `${Math.max(1, Math.round(g/a[5]))} unid.`;
  if(id==='azeite' || id==='oleo') return `${Math.max(1, Math.round(g/0.92))} ml`;
  if(['leite','leiteint','iogurte'].includes(id)) return `${Math.round(g)} ml`;
  return `${Math.round(g)} g`;
}
function _famKcalItens(i){ return (i||[]).reduce((s,[id,g])=>{ const a = NUTRI_ALIMENTOS[id]; return s + (a ? a[1]*g/100 : 0); }, 0); }
// Beta 62: formato seguro para o Firestore (sem lista dentro de lista):
//   i: "id:g,id:g"   x: [{ n: nome, k: kcal }]
function famSemanaCodifica(sem){
  const out = {};
  Object.keys(sem||{}).forEach(dk=>{ const d = sem[dk]; const m = {};
    Object.keys(d.m||{}).forEach(mid=>{ const r = d.m[mid]; const o = { n: r.n || '', h: r.h || '', i: (r.i||[]).map(([id,g])=>`${id}:${Math.round(g)}`).join(',') };
      if((r.x||[]).length) o.x = r.x.map(([n,k])=>({ n: String(n||'').slice(0,40), k: Math.round(k||0) }));
      m[mid] = o; });
    out[dk] = { r: d.r, c: d.c, k: d.k, m }; });
  return out;
}
function famSemanaDecodifica(sem){
  if(!sem || typeof sem !== 'object') return null;
  const out = {};
  Object.keys(sem).forEach(dk=>{ const d = sem[dk] || {}; const m = {};
    Object.keys(d.m||{}).forEach(mid=>{ const r = d.m[mid] || {};
      const i = Array.isArray(r.i) ? r.i : String(r.i||'').split(',').filter(Boolean).map(p=>{ const [id, g] = p.split(':'); return [id, +g || 0]; });
      const x = (r.x||[]).map(v=>Array.isArray(v) ? v : [v.n, v.k]);
      m[mid] = { n: r.n, h: r.h, i }; if(x.length) m[mid].x = x; });
    out[dk] = { r: d.r, c: d.c, k: d.k, m }; });
  return out;
}
function _famSemanaDe(uid){
  if(uid === _famUid()) return famMinhaSemana();
  const pf = (famCache().perfis||{})[uid] || {}; return famSemanaDecodifica(pf.semana);
}
function _famMotivoCasa(dk){
  const P = famParams(); const cp = (P.cardapio||{})[dk] || {};
  return Object.keys(cp).map(mid=>{ const c = cp[mid]; const r = NUTRI_REFEICOES.find(x=>x.id===mid); if(!r || !c) return '';
    const o = (c.x||[]).filter(id=>NUTRI_ALIMENTOS[id]).map(id=>'sem ' + NUTRI_ALIMENTOS[id][0].toLowerCase()).concat((c.add||[]).filter(a=>a && NUTRI_ALIMENTOS[a.id]).map(a=>'+ ' + NUTRI_ALIMENTOS[a.id][0].toLowerCase()));
    return o.length ? `${r.nome}: ${o.join(', ')}` : ''; }).filter(Boolean).join('; ');
}
const _pdfMontarCasaB49 = window.pdfMontarCasa;
window.pdfMontarCasa = function(jsPDF, arte){
  if(!famAtiva()) throw new Error('Você não está num grupo da casa');
  const P = famParams(); const eu = _famUid();
  const membros = [eu].concat(famMembros().filter(u=>u!==eu));
  const nomeDe = u=>u===eu ? `${_famMeuApelido()} (você)` : famNome(u);
  const S = pdfDoc(jsPDF, arte, { titulo:'Cardápio da casa', sub:`${membros.length} pessoas: ${membros.map(nomeDe).join(', ')}`, sub2:`Refeições da casa: ${famRefs().map(k=>FAM_NOMES_REF_MIN[k]).join(', ')} · administrador: ${famSouAdm()?'você':famNome(famAdmUid())}` });
  S.nota('A comida é compartilhada, a alimentação é individual: nas refeições da casa o prato é o mesmo para todos, e a quantidade de cada pessoa sai do plano dela. Abaixo, o que cada uma vai comer, separado.', { caixa:true, cor:arte.C.ink });
  const DN = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const fd = dk=>{ const dt = new Date(dk + 'T12:00:00'); return `${DN[dt.getDay()]} ${dk.slice(8,10)}/${dk.slice(5,7)}`; };
  const sem = {}; membros.forEach(u=>{ try{ sem[u] = _famSemanaDe(u); }catch(e){ sem[u] = null; } });
  const dias = _nutriDiasJanela('7dias').map(x=>x.dk);
  const sinal = v=>v > 0 ? `+${v}` : v < 0 ? `-${Math.abs(v)}` : '0';      // hífen: a fonte do PDF não tem o sinal de menos
  // 6.1 resumo por dia e pessoa
  const res = [];
  dias.forEach(dk=>{
    const mot = _famMotivoCasa(dk);
    membros.forEach(u=>{
      const s = sem[u] && sem[u][dk]; if(!s) return;
      const prop = s.k - s.r - (s.c||0);
      const motivo = [mot && (s.c||P.compensa) ? `Casa: ${mot}${P.compensa ? ' (porções recalculadas)' : ''}` : '', Math.abs(prop) >= 20 ? `ajustes próprios ${sinal(prop)} kcal` : ''].filter(Boolean).join(' · ') || '—';
      res.push([fd(dk), nomeDe(u), `${s.r}`, `${s.k}`, sinal(s.k - s.r), motivo]);
    });
  });
  if(res.length){
    S.secao('Resumo por dia — recomendado × planejado', 'kcal de cada pessoa; o motivo explica a diferença', arte.C.a);
    S.tabela([{t:'Dia', w:20, negrito:true}, {t:'Pessoa', w:28, quebra:true}, {t:'Recomendado', w:22, dir:1}, {t:'Planejado', w:20, dir:1}, {t:'Dif.', w:14, dir:1, negrito:true}, {t:'Motivo', w:72, quebra:true, cor:arte.C.dim}], res, { t:7.6 });
  }
  // 6.2 cardápio de cada pessoa
  membros.forEach(u=>{
    const s = sem[u];
    S.precisa(50);
    S.secao(`Cardápio de ${nomeDe(u)}`, 'próximos 7 dias · quantidades do plano desta pessoa');
    if(!s){ S.nota(`${nomeDe(u)} ainda não publicou o cardápio (versão antiga do app ou não abriu o app desde a atualização). Abrir o app no celular dessa pessoa resolve.`, { t:7.6 }); return; }
    const linhas = [];
    dias.forEach(dk=>{
      const dia = s[dk]; if(!dia) return;
      NUTRI_REFEICOES.forEach(r=>{
        const m = dia.m && dia.m[r.id]; if(!m) return;
        const txt = (m.i||[]).map(([id,g])=>`${NUTRI_ALIMENTOS[id] ? NUTRI_ALIMENTOS[id][0] : id} ${_famQtdTxt(id,g)}`).concat((m.x||[]).map(([n,k])=>`${n} (${k} kcal)`)).join(' · ');
        const k = Math.round(_famKcalItens(m.i) + (m.x||[]).reduce((t,[,v])=>t+(+v||0),0));
        const casa = famDaCasaNoDia(P, r.id, new Date(dk + 'T12:00:00').getDay() || 7, dk);
        linhas.push([fd(dk), `${r.nome}${casa ? ' · casa' : ''}\n${m.h || r.hora}`, `${m.n || ''}\n${txt}`, String(k)]);
      });
      linhas.push(['', 'Total do dia', `recomendado ${dia.r} kcal${dia.k !== dia.r ? ` · planejado ${dia.k} kcal (${sinal(dia.k - dia.r)})` : ''}`, String(dia.k)]);
    });
    if(linhas.length) S.tabela([{t:'Dia', w:20, negrito:true}, {t:'Refeição', w:30, quebra:true}, {t:'Prato e quantidades', w:110, quebra:true}, {t:'kcal', w:16, dir:1, negrito:true}], linhas, { t:7.4 });
  });
  // Beta 58: as compras somadas (com a parte de cada um) estão no PDF da lista de compras (pdfListaCompras, parte 62)
  S.nota('Valores aproximados (tabelas brasileiras de composição de alimentos). É uma orientação geral e não substitui um nutricionista; se alguém da casa tem doença, alergia ou usa medicação, procure um profissional.');
  return S.fim(`metatreino-casa-${chaveDia(new Date())}.pdf`, _pdfAluno());
};

(function(){ if(document.getElementById('b52-css')) return; const s = document.createElement('style'); s.id = 'b52-css';
  s.textContent = `
.fam-ajuste{margin-top:6px;padding:7px 10px;border-radius:10px;background:rgba(127,127,127,.1);font-size:12.3px;line-height:1.5}
.fam-ajuste.menos{border-left:3px solid #5cc8d4}.fam-ajuste.mais{border-left:3px solid var(--primary)}
.fam-ajuste-dia{margin:8px 0;padding:10px 12px;border-radius:12px;background:rgba(127,127,127,.08);font-size:12.5px;line-height:1.55;color:var(--text-dim)}
.fam-ajuste-dia b{color:var(--text)}.fam-ajuste-dia.menos{border-left:3px solid #5cc8d4}.fam-ajuste-dia.mais{border-left:3px solid var(--primary)}
.fam-comp{display:flex;gap:10px;align-items:flex-start;margin:10px 0 0;padding:10px 12px;border-radius:12px;background:rgba(127,127,127,.08);cursor:pointer}
.fam-comp input{margin-top:3px;width:18px;height:18px;flex:none}.fam-comp span{display:flex;flex-direction:column;gap:2px}.fam-comp b{font-size:13px}.fam-comp small{font-size:11.8px;color:var(--text-dim);line-height:1.45}
.fam-comp.off{opacity:.7;cursor:default}
.nf-info{margin:10px 0 0;font-size:12.3px;line-height:1.5;color:var(--text-dim);text-align:center}
`; document.head.appendChild(s); })();

Object.assign(window, { NUTRI_FORA, famAlternaCompensa, famMinhaSemana, famAjusteNomes, famAjusteHTML });

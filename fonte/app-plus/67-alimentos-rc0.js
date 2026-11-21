
// =====================================================================
// 67. 2027 RC 0 — mais alimentos: saudáveis (entram nas trocas) e "fora da rotina" (só registro)
// ---------------------------------------------------------------------
//  • Valores aproximados por 100 g ou 100 ml do alimento pronto (TACO 4ª ed., rótulos comuns e médias de
//    preparo caseiro). Formato igual ao do NUTRI_ALIMENTOS: [nome, kcal, P, C, G, g da unidade, medida, livre].
//  • Saudáveis: entram nas categorias normais (proteínas, grãos, pães/tubérculos, frutas, verduras,
//    laticínios, outros, bebidas) → aparecem na busca do "Adicionar alimento", na troca por equivalente
//    (parte 59) e nas equivalências. O cardápio sugerido NÃO ganhou pratos novos de propósito: o prato de
//    cada dia é escolhido pela posição na lista (nutriVarIdx) e mudar a lista trocaria o cardápio e a lista
//    de compras que as pessoas já estão seguindo nesta semana.
//  • Ultraprocessados: categoria "fora da rotina" (NUTRI_FORA_IDS). Contam no dia quando registrados, mas
//    nunca são sugeridos no cardápio, nas trocas nem na lista de compras (regras das partes 49, 55 e 59).
// =====================================================================
const NUTRI_RC0_SAUDAVEIS = {
  // air fryer (com ~1 col. de chá de óleo para 200 g)
  batataair:    ['Batata inglesa na air fryer', 110, 2.3, 20.0, 2.5, null, null],
  batatadoceair:['Batata-doce na air fryer', 110, 1.4, 24.5, 1.0, null, null],
  mandiocaair:  ['Mandioca na air fryer', 160, 1.0, 34.0, 2.5, null, null],
  legumesair:   ['Legumes na air fryer (abobrinha, cenoura, cebola)', 45, 1.3, 7.0, 1.5, null, null, true],
  frangoair:    ['Filé de frango na air fryer', 165, 31.0, 0, 4.5, null, null],
  // proteínas
  frangoassado: ['Frango assado (peito e coxa, sem pele)', 175, 28.0, 0, 7.0, null, null],
  ovopoche:     ['Ovo pochê', 143, 12.6, 0.7, 9.5, 50, null],
  // grãos, sementes e pães
  quinoa:       ['Quinoa cozida', 120, 4.4, 21.3, 1.9, null, {g:45,nome:'col. de servir'}],
  chia:         ['Chia (semente)', 486, 16.5, 42.0, 30.7, null, {g:10,nome:'col. de sopa'}],
  linhaca:      ['Linhaça (semente ou farinha)', 495, 14.1, 43.3, 32.3, null, {g:10,nome:'col. de sopa'}],
  paofermnat:   ['Pão de fermentação natural (fatia)', 260, 9.0, 51.0, 1.5, 40, null],
  crepioca:     ['Crepioca (1 ovo + 2 col. de goma)', 180, 8.3, 22.9, 5.9, 80, null],
  // laticínios e fermentados
  iogurtegrego: ['Iogurte grego natural (sem açúcar)', 97, 9.0, 4.0, 5.0, null, {g:100,nome:'pote'}],
  kefir:        ['Kefir de leite', 60, 3.4, 4.5, 3.2, null, {g:200,nome:'copo'}],
  leitesemi:    ['Leite semidesnatado', 45, 3.2, 4.7, 1.5, null, {g:200,nome:'copo'}],
  leitezero:    ['Leite sem lactose (semidesnatado)', 45, 3.2, 4.7, 1.5, null, {g:200,nome:'copo'}],
  // verduras e legumes
  abobrinha:    ['Abobrinha refogada ou cozida', 18, 1.1, 3.0, 0.4, null, null, true],
  berinjela:    ['Berinjela cozida ou assada', 20, 0.7, 4.5, 0.1, null, null, true],
  espinafre:    ['Espinafre refogado', 67, 2.7, 4.2, 5.4, null, null],
  couve:        ['Couve refogada', 90, 1.7, 8.7, 6.6, null, {g:30,nome:'col. de servir'}],
  beterraba:    ['Beterraba cozida', 32, 1.3, 7.2, 0.1, null, null, true],
  pepino:       ['Pepino', 10, 0.9, 2.0, 0, null, null, true],
  chuchu:       ['Chuchu cozido', 17, 0.4, 4.1, 0, null, null, true],
  vagem:        ['Vagem cozida', 25, 1.5, 5.3, 0.3, null, null, true],
  repolho:      ['Repolho cru (salada)', 17, 0.9, 3.9, 0.1, null, null, true],
  // frutas
  kiwi:         ['Kiwi', 51, 1.3, 11.5, 0.6, 76, null],
  ameixa:       ['Ameixa fresca', 53, 0.8, 13.9, 0, 70, null],
  melao:        ['Melão', 29, 0.7, 7.5, 0, null, null],
  // bebidas
  vitamina:     ['Vitamina de banana com leite (copo 300 ml)', 67, 2.5, 10.0, 2.2, 300, null],
  bebamendoa:   ['Bebida de amêndoas sem açúcar (copo 200 ml)', 15, 0.5, 0.3, 1.2, 200, null],
  bebaveia:     ['Bebida de aveia sem açúcar (copo 200 ml)', 45, 0.5, 7.0, 1.5, 200, null]
};
const NUTRI_RC0_FORA = {
  miojo:        ['Miojo / macarrão instantâneo com tempero (pacote 85 g)', 450, 9.5, 60.0, 18.0, 85, null],
  calabresa:    ['Linguiça calabresa frita ou grelhada', 310, 16.5, 1.5, 26.5, null, {g:30,nome:'rodelas (30 g)'}],
  bacon:        ['Bacon frito (fatia)', 540, 37.0, 1.4, 42.0, 8, null],
  salsicha:     ['Salsicha (unid.)', 257, 12.0, 5.0, 21.0, 50, null],
  mortadela:    ['Mortadela (fatia)', 269, 12.0, 5.8, 21.9, 15, null],
  nuggets:      ['Nuggets de frango (unid.)', 272, 14.0, 17.0, 16.5, 20, null],
  hambcongelado:['Hambúrguer industrializado (unid.)', 252, 13.0, 6.0, 19.5, 56, null],
  empada:       ['Empada de frango', 380, 8.0, 33.0, 24.0, 60, null],
  esfiha:       ['Esfiha de carne (aberta)', 290, 11.0, 38.0, 10.5, 70, null],
  pipocamicro:  ['Pipoca de micro-ondas (meio saquinho, 50 g)', 476, 7.6, 53.0, 26.0, 50, null],
  batatapalha:  ['Batata palha', 541, 6.5, 50.0, 35.0, null, {g:15,nome:'col. de sopa'}],
  picoleleite:  ['Sorvete de palito (cremoso ou com cobertura)', 261, 3.5, 28.0, 15.0, 60, null],
  picolefruta:  ['Picolé de fruta', 120, 0.3, 30.0, 0, 60, null],
  bala:         ['Bala (unid.)', 391, 0, 97.0, 0.3, 5, null],
  pirulito:     ['Pirulito', 391, 0, 97.0, 0.3, 10, null],
  chiclete:     ['Chiclete com açúcar (unid.)', 331, 0, 82.0, 0.3, 3, null],
  pacoca:       ['Paçoca (unid.)', 480, 14.0, 52.0, 24.0, 20, null],
  achocpo:      ['Achocolatado em pó', 390, 4.5, 85.0, 3.5, null, {g:15,nome:'col. de sopa'}],
  achoccaixa:   ['Bebida láctea achocolatada (caixinha 200 ml)', 79, 2.3, 12.5, 2.2, 200, null],
  bebidalactea: ['Iogurte de garrafinha / bebida láctea (170 g)', 77, 2.2, 13.0, 1.8, 170, null],
  leitefermentado:['Leite fermentado (frasco 80 g)', 63, 1.3, 14.2, 0.1, 80, null],
  leitecondensado:['Leite condensado', 319, 7.7, 57.0, 6.7, null, {g:20,nome:'col. de sopa'}]
};
(function(){
  try{
    const poe = (tab)=>Object.entries(tab).forEach(([id, v])=>{ if(!NUTRI_ALIMENTOS[id]) NUTRI_ALIMENTOS[id] = v; });
    poe(NUTRI_RC0_SAUDAVEIS); poe(NUTRI_RC0_FORA);
    const add = (k, ids)=>{ if(NUTRI_CATEG[k]) ids.forEach(id=>{ if(NUTRI_ALIMENTOS[id] && !NUTRI_CATEG[k][1].includes(id)) NUTRI_CATEG[k][1].push(id); }); };
    add('proteinas', ['frangoassado','frangoair','ovopoche']);
    add('graos', ['quinoa']);
    add('carbo', ['batataair','batatadoceair','mandiocaair','paofermnat','crepioca']);
    add('frutas', ['kiwi','ameixa','melao']);
    add('verduras', ['abobrinha','berinjela','espinafre','couve','beterraba','pepino','chuchu','vagem','repolho','legumesair']);
    add('lat', ['iogurtegrego','kefir','leitesemi','leitezero']);
    add('outros', ['chia','linhaca']);
    add('bebidas', ['vitamina','bebamendoa','bebaveia','achoccaixa','bebidalactea','leitefermentado']);
    // fora da rotina: na categoria própria e no conjunto que as partes 49/55/59 consultam
    add('fora', Object.keys(NUTRI_RC0_FORA));
    if(window.NUTRI_FORA_IDS) Object.keys(NUTRI_RC0_FORA).forEach(id=>window.NUTRI_FORA_IDS.add(id));
    // restrições (o que o app sugere continua respeitando; leite sem lactose fica fora da lista de lactose)
    ['iogurtegrego','kefir','leitesemi','vitamina','achoccaixa','bebidalactea','leitefermentado','leitecondensado','picoleleite','achocpo','empada']
      .forEach(id=>{ if(!NUTRI_LACTOSE.includes(id)) NUTRI_LACTOSE.push(id); });
    ['paofermnat','miojo','nuggets','empada','esfiha','bebaveia','hambcongelado']
      .forEach(id=>{ if(!NUTRI_GLUTEN.includes(id)) NUTRI_GLUTEN.push(id); });
    if(typeof SUB_CARNES !== 'undefined') ['frangoassado','frangoair'].forEach(id=>{ if(!SUB_CARNES.includes(id)) SUB_CARNES.push(id); });
    // em que refeição cada um combina na troca por equivalente (parte 59)
    if(typeof SUB_REFEICAO !== 'undefined'){
      const p = (tipo, cat, ids)=>{ const l = SUB_REFEICAO[tipo] && SUB_REFEICAO[tipo][cat]; if(l) ids.forEach(id=>{ if(!l.includes(id)) l.push(id); }); };
      p('leve', 'proteinas', ['ovopoche']);
      p('leve', 'carbo', ['paofermnat','crepioca','batatadoceair']);
      p('prato', 'proteinas', ['frangoassado','frangoair','ovopoche']);
      p('prato', 'carbo', ['batataair','batatadoceair','mandiocaair']);
      p('prato', 'graos', ['quinoa']);
    }
    // quanto o pronto rende em relação ao cru (lista de compras em peso cru) e líquidos em ml
    Object.assign(NUTRI_CRU, { quinoa:2.8, frangoassado:.7, frangoair:.75, batataair:.75, batatadoceair:.8, mandiocaair:.85 });
    if(typeof NUTRI_LIQ !== 'undefined') ['leitesemi','leitezero','kefir'].forEach(id=>{ if(!NUTRI_LIQ.includes(id)) NUTRI_LIQ.push(id); });
    Object.assign(NUTRI_USO, {
      batataair:['Em cubos ou palitos, com 1 col. de chá de óleo, 15–20 min a 200 °C, mexendo na metade', 'air fryer'],
      batatadoceair:['Em rodelas ou palitos, com 1 col. de chá de óleo, 15–20 min a 200 °C', 'air fryer'],
      mandiocaair:['Cozida antes e depois dourada na air fryer, com pouco óleo', 'cozida e dourada'],
      legumesair:['Em pedaços, temperados, com um fio de óleo, 12–15 min a 200 °C', 'air fryer'],
      frangoair:['Temperado, 15–18 min a 200 °C, virando na metade; peso pronto', 'air fryer'],
      frangoassado:['Assado sem a pele; peso do alimento pronto', 'assado, sem pele'],
      ovopoche:['Cozido sem a casca em água quente (sem óleo)', 'pochê'],
      quinoa:['Lavada e cozida como arroz; peso pronto', 'cozida'],
      chia:['Por cima da fruta ou do iogurte; dá para hidratar antes', 'por cima'],
      linhaca:['Triturada (em farinha) é mais bem aproveitada; por cima da fruta ou do iogurte', 'triturada'],
      crepioca:['Ovo batido com a goma, na frigideira antiaderente', 'na frigideira'],
      iogurtegrego:['Natural, sem açúcar; dá para adoçar com a fruta', 'natural'],
      couve:['Refogada com alho e pouco óleo', 'refogada'], espinafre:['Refogado com alho e pouco óleo', 'refogado'],
      beterraba:['Cozida ou crua ralada, na salada', 'cozida ou ralada']
    });
  }catch(e){ console.log('alimentos RC0:', e); }
})();
// busca: apelidos comuns
Object.assign(NUTRI_APELIDOS, {
  miojo:'macarrao instantaneo lamen nissin', calabresa:'linguica calabresa', salsicha:'hot dog cachorro', nuggets:'nugget empanado',
  pipocamicro:'pipoca', bala:'doce', pirulito:'doce', chiclete:'goma de mascar', picoleleite:'sorvete picole', picolefruta:'sorvete picole',
  achocpo:'achocolatado nescau toddy po', achoccaixa:'toddynho nescauzinho achocolatado', bebidalactea:'iogurte danone bebida lactea',
  leitefermentado:'yakult leite fermentado', leitecondensado:'leite moca', hambcongelado:'hamburguer', mortadela:'frios',
  batataair:'batata air fryer airfryer', batatadoceair:'batata doce air fryer airfryer', mandiocaair:'aipim macaxeira air fryer airfryer',
  legumesair:'legumes air fryer airfryer', frangoair:'frango air fryer airfryer', frangoassado:'frango', ovopoche:'ovo poche',
  iogurtegrego:'iogurte', kefir:'iogurte fermentado', leitesemi:'leite', leitezero:'leite zero lactose', vitamina:'vitamina banana leite batida',
  bebamendoa:'leite de amendoa leite vegetal', bebaveia:'leite de aveia leite vegetal', paofermnat:'pao fermentacao natural levain',
  crepioca:'tapioca ovo', couve:'couve manteiga', melao:'melao', ameixa:'ameixa'
});
// equivalências (Plano alimentar › Equivalências): acrescenta os novos que fazem sentido em cada grupo
(function(){
  const _eq = window.nutriEquivalencias; if(typeof _eq !== 'function') return;
  window.nutriEquivalencias = function(){
    const L = _eq.apply(this, arguments);
    try{
      const c = nutriConfig(); const proib = new Set([...(c.semLactose?NUTRI_LACTOSE:[]), ...(c.semGluten?NUTRI_GLUTEN:[])]);
      const item = (id, mi, alvo)=>{ const a = NUTRI_ALIMENTOS[id]; if(!a || proib.has(id) || !(a[mi] > 0)) return null;
        const g = alvo/a[mi]*100; if(a[5]) return `${a[0]}: ${Math.max(1, Math.round(g/a[5]))} unid.`; return `${a[0]}: ${Math.max(5, Math.round(g/5)*5)} g`; };
      const mais = [ ['frangoassado','ovopoche','iogurtegrego'], ['quinoa','batataair','batatadoceair','paofermnat','crepioca'], ['chia','linhaca'], ['kiwi','ameixa','melao'] ];
      const cfg = [[2,25],[3,30],[4,10],[3,15]];
      L.forEach((g, i)=>{ if(!mais[i]) return; mais[i].forEach(id=>{ const t = item(id, cfg[i][0], cfg[i][1]); if(t && !g.l.includes(t)) g.l.push(t); }); });
    }catch(e){}
    return L;
  };
})();

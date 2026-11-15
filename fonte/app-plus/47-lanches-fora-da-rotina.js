
// =====================================================================
// Beta 43 — "Lanches para sair da rotina" (dentro do plano alimentar)
// =====================================================================
// Seção complementar do plano alimentar, não um catálogo: poucas receitas
// práticas e baratas, cada uma com a porção AJUSTADA à refeição do plano
// do aluno (objetivo, calorias do dia, nº de refeições, restrições).
//
// Regras desta seção:
//  • valores nutricionais calculados a partir dos ingredientes, com a Tabela
//    Brasileira de Composição de Alimentos (TACO/UNICAMP) e, para produtos
//    industrializados (pão de hambúrguer, massa de pastel, pão sírio, tortilha,
//    molho pronto), a média de rótulos de marcas comuns. São ESTIMATIVAS e a
//    tela diz isso;
//  • nenhum preço em reais é inventado: não há tabela de preços confiável
//    por cidade. O app mostra o que deixa a receita barata e oferece uma
//    conta simples com o valor que o próprio aluno pagou;
//  • a porção não é encolhida até virar "nada": se a receita não cabe na
//    refeição sem ficar pequena demais, a tela explica e sugere outra opção;
//  • nada de "saudável", "fit" ou "zero culpa" como promessa; não substitui
//    nutricionista; restrições (lactose, glúten, vegetariano) são respeitadas.

// [nome, kcal/100 g, proteína, carboidrato, gordura, peso da unidade (g) | null, fonte, livre]
// fonte: 'T' = TACO/UNICAMP · 'R' = média de rótulos · 'A' = tabela do plano do app
const RC_ING = {
  mucarela:      ['Queijo muçarela', 330, 22.6, 3, 25.2, null, 'T'],   // aqui em gramas (no plano é por fatia)
  patinho_cru:   ['Patinho moído sem gordura (cru)', 133, 21.7, 0, 4.5, null, 'T'],
  coxaomole_cru: ['Coxão mole moído sem gordura (cru)', 169, 21.2, 0, 8.7, null, 'T'],
  coxaoduro_cru: ['Coxão duro moído sem gordura (cru)', 148, 21.5, 0, 6.2, null, 'T'],
  acem_cru:      ['Acém moído (cru)', 137, 19.4, 0, 5.9, null, 'T'],
  frango_cru:    ['Peito de frango moído, sem pele (cru)', 119, 21.5, 0, 3.0, null, 'T'],
  paohb:         ['Pão de hambúrguer', 272, 7.6, 54, 3.0, 50, 'R'],
  massapastel:   ['Massa de pastel', 290, 8, 52.5, 5, null, 'R'],
  paosirio:      ['Pão sírio pequeno', 262, 8.2, 54, 1.2, 50, 'R'],
  rap10:         ['Tortilha de trigo (tipo Rap10)', 300, 8, 50, 7.5, 40, 'R'],
  molho:         ['Molho de tomate pronto', 38, 1.4, 7.7, 0.2, null, 'R'],
  cebola:        ['Cebola', 39, 1.7, 8.9, 0.1, null, 'T'],
  alface:        ['Alface', 11, 1.3, 1.7, 0.2, null, 'T', true],
  cenoura:       ['Cenoura ralada', 34, 1.3, 7.7, 0.2, null, 'T'],
  mostarda:      ['Mostarda', 80, 4, 6, 4, null, 'R'],
  farinha:       ['Farinha de trigo', 360, 9.8, 75.1, 1.4, null, 'T'],
  choc_leite:    ['Chocolate ao leite', 540, 7.2, 59.6, 30.3, null, 'T'],
  choc_meio:     ['Chocolate meio amargo', 475, 4.9, 62.4, 29.9, null, 'T'],
  leitecond:     ['Leite condensado', 313, 7.7, 57, 6.7, null, 'T'],
  achocolatado:  ['Achocolatado em pó', 401, 4.2, 91.2, 2.2, null, 'T'],
  fermento:      ['Fermento', 0, 0, 0, 0, null, '-', true],
  temperos:      ['Sal, pimenta e orégano a gosto', 0, 0, 0, 0, null, '-', true],
  canela:        ['Canela em pó a gosto', 0, 0, 0, 0, null, '-', true]
};
function rcAli(id){
  const r = RC_ING[id]; if(r) return r;
  const a = (typeof NUTRI_ALIMENTOS !== 'undefined') && NUTRI_ALIMENTOS[id]; if(!a) return null;
  return [a[0], a[1], a[2], a[3], a[4], a[5], 'A', a[7]];
}
const RC_CARNE   = ['patinho_cru','coxaomole_cru','coxaoduro_cru','acem_cru','frango_cru','frango','acem','patinho','sobrecoxa','presunto','peru','atum','sardinha','peixe','figado'];
const RC_LACTOSE = [...(typeof NUTRI_LACTOSE!=='undefined'?NUTRI_LACTOSE:[]), 'leitecond','choc_leite','choc_meio'];
const RC_GLUTEN  = [...(typeof NUTRI_GLUTEN!=='undefined'?NUTRI_GLUTEN:[]), 'paohb','massapastel','paosirio','rap10','farinha'];

const RC_CATS = [
  ['hamb',     '🍔', 'Hambúrgueres e sanduíches'],
  ['pizza',    '🍕', 'Pizzas e massas'],
  ['airfryer', '🥟', 'Salgados e AirFryer'],
  ['rapidas',  '⏱️', 'Refeições rápidas'],
  ['doces',    '🍫', 'Doces e sobremesas'],
  ['econ',     '💰', 'Opções econômicas']
];

// Receita:
//  modo 'montado' → i = ingredientes de UMA porção; rende = quantas porções a compra típica faz
//  modo 'pecas'   → i = ingredientes da RECEITA INTEIRA; pecas = quantas unidades rende; porcao = unidades sugeridas
//  marcas do ingrediente: 'f' = ajusta com a porção (recheio, carne, queijo) · 'o' = opcional (sai na versão sem lactose)
//                         'g' = opcional (sai na versão sem glúten) · variação: t = troca, q = quantidade, x = tira
//  tipo: 'refeicao' (no lugar do almoço/jantar) · 'lanche' (no lugar de um lanche) · 'doce'
const RC_RECEITAS = [
  { id:'hamb_caseiro', nome:'Hambúrguer caseiro', cat:'hamb', tipo:'refeicao', modo:'montado', emoji:'🍔', tempo:'25 min', dif:'Fácil', rende:4, econ:false,
    i:[['paohb',1],['patinho_cru',120,'f'],['mucarela',20,'fo'],['alface',15],['tomate',40],['cebola',15],['iogurte',20,'fo'],['mostarda',5],['temperos',0]],
    vars:[ {n:'Patinho'}, {n:'Coxão mole', t:{patinho_cru:'coxaomole_cru'}}, {n:'Coxão duro', t:{patinho_cru:'coxaoduro_cru'}}, {n:'Econômica (acém)', t:{patinho_cru:'acem_cru'}, econ:true} ],
    passos:[
      'Tempere a carne só com sal e pimenta (e cebola bem picada, se quiser). Não precisa de ovo nem farinha.',
      'Divida em bolas e achate em discos de cerca de 1 cm, um pouco maiores que o pão: eles encolhem na chapa.',
      'Frigideira antiaderente bem quente, sem óleo: 3 a 4 minutos de cada lado. Carne moída deve ficar bem passada por dentro, sem parte rosada.',
      'No último minuto, coloque o queijo por cima e tampe a frigideira para derreter.',
      'Molho: misture o iogurte natural com a mostarda e uma pitada de sal.',
      'Aqueça o pão na própria frigideira e monte com alface, tomate e cebola.'
    ],
    nota:'Corte magro não é automático: peça ao açougue para moer o patinho, o coxão mole ou o coxão duro na hora, depois de tirar a capa de gordura. Carne moída pronta de bandeja costuma ter mais gordura que a do rótulo do corte.',
    subs:['Pão integral no lugar do tradicional (calorias parecidas, mais fibra).','Peito de frango moído no lugar da carne (fica um pouco mais leve).','Molho de tomate ou só mostarda no lugar do molho de iogurte.','Sem o queijo, ou queijo sem lactose.'],
    congela:'Os discos crus, separados por papel-manteiga, ficam bons no congelador por até 3 meses. Descongele na geladeira antes de grelhar.' },

  { id:'hamb_pastel', nome:'Hambúrguer na massa de pastel (AirFryer)', cat:'airfryer', tipo:'refeicao', modo:'montado', emoji:'🥟', tempo:'30 min', dif:'Média', rende:4, econ:true, af:true,
    i:[['massapastel',50],['acem_cru',90,'f'],['mucarela',15,'fo'],['cebola',10],['oleo',2],['temperos',0]],
    vars:[ {n:'Econômica', econ:true}, {n:'Mais completa', t:{acem_cru:'patinho_cru'}, q:{massapastel:60, patinho_cru:120, mucarela:30}} ],
    passos:[
      'Modele o hambúrguer fino e grelhe ANTES de embrulhar, até ficar bem passado por dentro: a massa doura em poucos minutos e não dá tempo de cozinhar a carne crua com segurança.',
      'Espere amornar uns 5 minutos (carne quente rasga a massa).',
      'Coloque o hambúrguer e o queijo no centro da massa, feche e aperte as bordas com um garfo.',
      'Pincele bem pouco óleo (ou só água) por fora.',
      'AirFryer preaquecida a 200 °C por 8 a 12 minutos, virando na metade, até dourar.'
    ],
    nota:'A AirFryer tira o óleo da fritura, mas a massa de pastel continua sendo massa de trigo com gordura. A receita não vira "baixa caloria" por ser feita na AirFryer: a porção abaixo já considera a massa.',
    subs:['Peito de frango moído no lugar do acém.','Massa de pastel integral, se encontrar (confira o rótulo: as calorias costumam ser parecidas).','Sem queijo, ou com queijo sem lactose.'],
    congela:'Monte com o hambúrguer já grelhado e frio e congele cru, sem pincelar. Vai direto do congelador para a AirFryer (uns 3 a 5 minutos a mais). Até 2 meses.' },

  { id:'mini_pizza', nome:'Mini pizza de pão sírio', cat:'pizza', tipo:'refeicao', modo:'montado', emoji:'🍕', tempo:'15 min', dif:'Fácil', rende:4, econ:true,
    i:[['paosirio',2],['molho',40],['frango',60,'f'],['mucarela',25,'fo'],['tomate',40],['temperos',0]],
    vars:[ {n:'Econômica', econ:true}, {n:'Mais proteína', q:{frango:100}}, {n:'Na tortilha', t:{paosirio:'rap10'}} ],
    passos:[
      'Use frango já cozido e desfiado (dá para cozinhar mais de uma vez e guardar para a semana).',
      'Espalhe o molho no pão sírio deixando 1 cm de borda.',
      'Distribua o frango, o queijo e o tomate em rodelas; finalize com orégano.',
      'Forno a 200 °C por 8 a 10 minutos ou AirFryer a 180 °C por 5 a 7 minutos, até o queijo derreter.'
    ],
    subs:['Pão sírio integral ou tortilha integral.','Atum ou ovo cozido no lugar do frango.','Menos queijo e mais tomate, se a porção ficar acima do seu plano.'],
    congela:'Frango cozido e desfiado: até 3 meses no congelador, em porções. A pizza é melhor montar na hora.' },

  { id:'batata_rech', nome:'Batata recheada', cat:'rapidas', tipo:'refeicao', modo:'montado', emoji:'🥔', tempo:'40 min (forno) · 25 min (AirFryer)', dif:'Fácil', rende:2, econ:true, af:true,
    i:[['batataing',250,'f'],['frango',80,'f'],['requeijao',20,'fo'],['mucarela',20,'fo'],['milho',20],['cenoura',20],['cebola',10],['temperos',0]],
    vars:[ {n:'Frango', econ:true}, {n:'Carne moída', t:{frango:'acem'}} ],
    passos:[
      'Cozinhe a batata com casca até ficar quase macia (15 a 20 minutos na panela ou 6 a 8 no micro-ondas, furada com garfo).',
      'Corte ao meio e tire parte do miolo com uma colher, deixando uma "casquinha".',
      'Misture o miolo com o frango desfiado (ou a carne), o requeijão, o milho, a cenoura e a cebola refogada.',
      'Recheie, cubra com o queijo.',
      'Forno a 200 °C por 15 minutos ou AirFryer a 180 °C por 8 a 10 minutos, até gratinar.'
    ],
    subs:['Batata-doce no lugar da inglesa.','Ricota amassada no lugar do requeijão.','Sem lactose: tire o requeijão e o queijo e use um fio de azeite com ervas.'],
    congela:'O recheio pronto congela bem (até 3 meses). A batata cozida fica melhor feita na hora.' },

  { id:'sand_natural', nome:'Sanduíche natural de frango', cat:'hamb', tipo:'lanche', modo:'montado', emoji:'🥪', tempo:'10 min', dif:'Fácil', rende:4, econ:true,
    i:[['paoforma',2],['frango',60,'f'],['requeijao',15,'fo'],['cenoura',20],['milho',15],['alface',10],['tomate',30]],
    passos:['Misture o frango desfiado com o requeijão, a cenoura ralada e o milho.','Monte no pão com alface e tomate.','Para levar, embrulhe em papel-filme e mantenha na geladeira até a hora de comer.'],
    subs:['Pão integral.','Iogurte natural no lugar do requeijão.','Atum no lugar do frango.'],
    congela:'Não congele montado (o pão e a salada ficam moles). O recheio dura até 3 dias na geladeira.' },

  { id:'hamb_frango', nome:'Hambúrguer de frango', cat:'hamb', tipo:'refeicao', modo:'montado', emoji:'🍔', tempo:'25 min', dif:'Fácil', rende:4, econ:true,
    i:[['paohb',1],['frango_cru',120,'f'],['cebola',10],['mucarela',20,'fo'],['alface',15],['tomate',40],['iogurte',20,'fo'],['mostarda',5],['temperos',0]],
    passos:['Tempere o frango moído com sal, alho, cebola picada e páprica.','Modele discos de cerca de 1 cm (mãos molhadas ajudam).','Frigideira antiaderente com um fio de óleo: 4 a 5 minutos de cada lado, até ficar branco por dentro.','Derreta o queijo por cima no final e monte com salada e o molho de iogurte com mostarda.'],
    subs:['Pão integral.','Sem queijo ou com queijo sem lactose.','Sobrecoxa sem pele moída (mais suculenta, um pouco mais calórica).'],
    congela:'Discos crus: até 3 meses no congelador, separados por papel-manteiga.' },

  { id:'wrap_frango', nome:'Wrap de frango', cat:'hamb', tipo:'refeicao', modo:'montado', emoji:'🌯', tempo:'10 min', dif:'Fácil', rende:4, econ:true,
    i:[['rap10',1],['frango',80,'f'],['requeijao',15,'fo'],['alface',15],['tomate',30],['cenoura',20],['milho',15]],
    passos:['Aqueça a tortilha por alguns segundos na frigideira (fica mais fácil de enrolar).','Espalhe o requeijão, coloque o frango e a salada no centro.','Dobre as laterais para dentro e enrole bem apertado.','Se quiser, doure 1 minuto de cada lado na frigideira.'],
    subs:['Tortilha integral.','Ovo mexido ou atum no lugar do frango.','Iogurte com mostarda no lugar do requeijão.'],
    congela:'O frango desfiado congela (até 3 meses). Monte o wrap na hora.' },

  { id:'pastel_af', nome:'Pastel de AirFryer', cat:'airfryer', tipo:'lanche', modo:'pecas', emoji:'🥟', tempo:'25 min', dif:'Fácil', pecas:6, peca:['pastel','pastéis'], porcao:2, econ:true, af:true,
    i:[['massapastel',180],['frango',150,'f'],['requeijao',45,'fo'],['cebola',20],['oleo',6],['temperos',0]],
    vars:[ {n:'Frango', econ:true}, {n:'Carne moída', t:{frango:'acem'}}, {n:'Queijo e tomate', t:{frango:'mucarela'}, q:{mucarela:90, requeijao:0, tomate:90}, veg:true} ],
    passos:['Misture o recheio frio (frango desfiado, requeijão e cebola refogada).','Coloque uma colher de recheio em cada massa, sem exagerar, feche e aperte as bordas com garfo.','Pincele bem pouco óleo por fora.','AirFryer preaquecida a 200 °C por 8 a 10 minutos, virando na metade.'],
    nota:'Na AirFryer o pastel absorve bem menos óleo que frito, mas a massa continua contando: as calorias abaixo já incluem a massa.',
    subs:['Massa de pastel integral.','Ricota temperada no lugar do requeijão.','Palmito ou legumes refogados no recheio (versão vegetariana).'],
    congela:'Monte e congele crus, sem pincelar, em camadas separadas. Vão direto à AirFryer (alguns minutos a mais). Até 2 meses.' },

  { id:'esfiha', nome:'Esfiha caseira de carne', cat:'airfryer', tipo:'lanche', modo:'pecas', emoji:'🫓', tempo:'1h30 (com a massa descansando)', dif:'Média', pecas:12, peca:['esfiha','esfihas'], porcao:2, econ:true, af:true,
    i:[['farinha',300],['leite',150],['oleo',30],['fermento',10],['acem_cru',240,'f'],['tomate',120],['cebola',60],['temperos',0]],
    vars:[ {n:'Carne', econ:true}, {n:'Frango', t:{acem_cru:'frango'}, q:{frango:200}} ],
    passos:['Massa: dissolva o fermento no leite morno com uma pitada de açúcar; junte o óleo, o sal e a farinha aos poucos até soltar das mãos.','Cubra e deixe crescer por 40 minutos a 1 hora, até dobrar.','Recheio: misture a carne crua com tomate e cebola bem picados, sal, pimenta e limão. Escorra o líquido.','Divida a massa em 12 bolinhas, abra cada uma, coloque o recheio e feche em triângulo (ou deixe aberta).','Forno a 200 °C por 15 a 20 minutos ou AirFryer a 180 °C por 10 a 12 minutos, até a carne cozinhar e a massa dourar.'],
    subs:['Metade da farinha integral.','Frango desfiado no lugar da carne.','Recheio de ricota com espinafre (vegetariano).'],
    congela:'Depois de assadas e frias, congelam por até 3 meses. Esquente na AirFryer ou no forno.' },

  { id:'bolinho', nome:'Bolinho assado de frango', cat:'airfryer', tipo:'lanche', modo:'pecas', emoji:'🧆', tempo:'40 min', dif:'Média', pecas:12, peca:['bolinho','bolinhos'], porcao:4, econ:true, af:true,
    i:[['batataing',400,'f'],['frango',240,'f'],['ovo',1],['tapioca',30],['cebola',40],['temperos',0]],
    vars:[ {n:'Frango', econ:true}, {n:'Carne', t:{frango:'acem'}} ],
    passos:['Cozinhe a batata e amasse ainda quente.','Misture com o frango desfiado, o ovo, a goma de tapioca, a cebola e os temperos até dar liga.','Modele 12 bolinhos.','AirFryer a 200 °C por 15 a 18 minutos (ou forno a 200 °C por 25 minutos), virando na metade.'],
    subs:['Batata-doce ou mandioca no lugar da batata.','Farinha de rosca na casquinha, se quiser crocância (tem glúten).'],
    congela:'Crus ou assados, até 3 meses. Asse direto do congelador, com alguns minutos a mais.' },

  { id:'crepioca', nome:'Crepioca recheada', cat:'rapidas', tipo:'lanche', modo:'montado', emoji:'🥞', tempo:'10 min', dif:'Fácil', rende:1, econ:true,
    i:[['ovo',1],['tapioca',20],['frango',50,'f'],['requeijao',15,'fo'],['tomate',20],['temperos',0]],
    vars:[ {n:'Frango', econ:true}, {n:'Queijo e tomate', t:{frango:'mucarela'}, q:{mucarela:25, requeijao:0, tomate:40}, veg:true} ],
    passos:['Bata o ovo com a goma de tapioca e uma pitada de sal.','Despeje na frigideira antiaderente aquecida e espalhe como uma panqueca.','Quando firmar, vire, coloque o recheio em metade e dobre.','Mais 1 minuto em fogo baixo para aquecer o recheio.'],
    subs:['2 ovos para mais proteína.','Ricota ou cottage no lugar do requeijão.'],
    congela:'Faça na hora; o recheio pode ficar pronto na geladeira por até 3 dias.' },

  { id:'panqueca', nome:'Panqueca salgada de carne', cat:'pizza', tipo:'refeicao', modo:'pecas', emoji:'🥞', tempo:'35 min', dif:'Média', pecas:8, peca:['panqueca','panquecas'], porcao:2, econ:true,
    i:[['farinha',120],['leite',240],['ovo',2],['oleo',8],['acem_cru',320,'f'],['molho',240],['cebola',40],['mucarela',60,'fo'],['temperos',0]],
    vars:[ {n:'Carne', econ:true}, {n:'Frango', t:{acem_cru:'frango'}, q:{frango:280}} ],
    passos:['Massa: bata no liquidificador a farinha, o leite, os ovos e uma pitada de sal.','Unte a frigideira com um fio de óleo só na primeira e faça 8 discos finos.','Recheio: refogue a carne com a cebola até secar e junte metade do molho.','Recheie, enrole, cubra com o restante do molho e o queijo.','Forno a 200 °C por 10 minutos, só para gratinar.'],
    subs:['Metade da farinha integral.','Frango desfiado no lugar da carne.','Sem queijo por cima, se precisar de uma porção mais leve.'],
    congela:'Panquecas recheadas e cobertas com molho congelam por até 3 meses (sem o queijo; ponha na hora de esquentar).' },

  { id:'pizza_frig', nome:'Pizza de frigideira', cat:'pizza', tipo:'refeicao', modo:'montado', emoji:'🍕', tempo:'20 min', dif:'Fácil', rende:1, econ:true,
    i:[['farinha',40],['leite',50],['ovo',1],['fermento',3],['molho',40],['mucarela',30,'fo'],['tomate',30],['frango',40,'f'],['temperos',0]],
    vars:[ {n:'Frango', econ:true}, {n:'Marguerita', x:['frango'], q:{mucarela:40, tomate:60}, veg:true} ],
    passos:['Misture a farinha, o leite, o ovo, o sal e o fermento químico até virar uma massa mole.','Despeje na frigideira antiaderente untada e cozinhe tampado em fogo baixo por 4 a 5 minutos.','Vire, espalhe o molho e a cobertura.','Tampe de novo por mais 4 a 5 minutos, até o queijo derreter.'],
    subs:['Metade da farinha integral ou de aveia.','Atum, ovo cozido ou legumes na cobertura.'],
    congela:'Melhor fazer na hora. Dá para deixar o frango desfiado pronto.' },

  { id:'brigadeiro', nome:'Brigadeiro de panela porcionado', cat:'doces', tipo:'doce', modo:'pecas', emoji:'🍫', tempo:'20 min', dif:'Fácil', pecas:20, peca:['brigadeiro pequeno','brigadeiros pequenos'], porcao:2, econ:true,
    i:[['leitecond',395],['achocolatado',25],['manteiga',10]],
    passos:['Leve tudo ao fogo baixo, mexendo sem parar, até desgrudar do fundo da panela (10 a 12 minutos).','Espalhe num prato untado e deixe esfriar.','Divida em 20 porções iguais (cerca de 1 colher de chá cheia cada). Pode enrolar ou guardar em potinhos.'],
    nota:'Porcionar antes de guardar ajuda a aproveitar sem exagerar: você decide quantos vai comer, não a panela.',
    subs:['Cacau em pó 100% no lugar do achocolatado (menos açúcar, sabor mais intenso).'],
    congela:'Porcionados, congelam por até 3 meses. Tire um ou dois de cada vez.' },

  { id:'morango_choc', nome:'Fruta com chocolate', cat:'doces', tipo:'doce', modo:'montado', emoji:'🍓', tempo:'10 min + geladeira', dif:'Fácil', rende:1, econ:true,
    i:[['morango',100],['choc_meio',15,'f']],
    vars:[ {n:'Morango'}, {n:'Banana', t:{morango:'banana'}, q:{banana:1}, econ:true} ],
    passos:['Derreta o chocolate no micro-ondas em intervalos de 20 segundos, mexendo entre eles.','Mergulhe metade de cada fruta (ou rodelas de banana) no chocolate.','Leve à geladeira por 10 minutos, até firmar.'],
    subs:['Chocolate ao leite, se preferir (um pouco mais calórico).','Qualquer fruta firme da estação.'],
    congela:'Rodelas de banana com chocolate congeladas viram um "picolé" de colher. Até 1 mês.' },

  { id:'banana_assada', nome:'Banana assada com canela', cat:'doces', tipo:'doce', modo:'montado', emoji:'🍌', tempo:'15 min', dif:'Fácil', rende:1, econ:true, af:true,
    i:[['banana',1],['aveia',10,'fg'],['canela',0]],
    passos:['Corte a banana ao meio no sentido do comprimento.','Polvilhe canela e a aveia por cima.','AirFryer a 180 °C por 8 minutos (ou forno a 200 °C por 12 a 15 minutos), até caramelizar.'],
    subs:['Sem a aveia, se precisar evitar glúten (a aveia comum pode ter traços).','Uma colher de chá de mel por cima, se couber no seu lanche.'],
    congela:'Faça na hora.' }
];

// ---------- estado ----------
function rcCfg(){ const n = nutriConfig(); if(!Array.isArray(n.receitasFav)) n.receitasFav = []; return n; }
function rcEhFav(id){ return rcCfg().receitasFav.includes(id); }
function rcFav(id){
  if(!mtTem('alimentacao')) return mtPremiumAviso('alimentacao');
  const n = rcCfg(); const i = n.receitasFav.indexOf(id);
  if(i >= 0) n.receitasFav.splice(i,1); else n.receitasFav.push(id);
  saveData(); toast(i >= 0 ? 'Tirada das favoritas' : '⭐ Receita salva nas favoritas');
  if(window.__rc && window.__rc.tela === 'receita') rcRenderReceita(); else rcRenderLista();
}

// ---------- cálculo ----------
function rcItensDe(r, vi){
  const v = (r.vars && r.vars[vi]) || {};
  const t = v.t || {}, q = v.q || {}, fora = v.x || [];
  const out = []; const vistos = new Set();
  r.i.forEach(([id, qtd, fl])=>{
    if(fora.includes(id)) return;
    const nid = t[id] || id;
    const qq = (q[nid] !== undefined) ? q[nid] : qtd;
    vistos.add(nid);
    if(qq === 0 && !(rcAli(nid)||[])[7]) return;       // a variação tirou o item
    out.push({ id:nid, q:qq, fl:fl||'' });
  });
  Object.keys(q).forEach(id=>{ if(!vistos.has(id) && q[id] > 0) out.push({ id, q:q[id], fl:'' }); });
  return out;
}
function rcGramas(id, q){ const a = rcAli(id); return a && a[5] ? q*a[5] : q; }
function rcNutri(itens){
  return itens.reduce((t,it)=>{ const a = rcAli(it.id); if(!a) return t; const k = rcGramas(it.id, it.q)/100;
    return { kcal:t.kcal+a[1]*k, p:t.p+a[2]*k, c:t.c+a[3]*k, g:t.g+a[4]*k }; }, {kcal:0,p:0,c:0,g:0});
}
function rcArred(id, q){
  const a = rcAli(id); if(!a) return q;
  if(a[5]){ return Math.max(0.25, Math.round(q*4)/4); }          // unidades: até ¼
  const passo = q >= 100 ? 10 : 5; return Math.max(passo, Math.round(q/passo)*passo);
}
// restrições do plano: o que dá para adaptar e o que não combina
function rcRestricao(r, vi){
  const n = rcCfg(); let itens = rcItensDe(r, vi); const notas = []; let bloqueio = null;
  if(n.vegetariano && itens.some(it=>RC_CARNE.includes(it.id))) bloqueio = 'leva carne e seu plano está como vegetariano';
  if(n.semGluten){ const opc = itens.filter(it=>RC_GLUTEN.includes(it.id) && it.fl.includes('g')); if(opc.length){ itens = itens.filter(it=>!opc.includes(it)); notas.push('Sem glúten: tiramos ' + opc.map(it=>rcAli(it.id)[0].toLowerCase()).join(' e ') + '.'); } }
  if(!bloqueio && n.semGluten && itens.some(it=>RC_GLUTEN.includes(it.id))) bloqueio = 'leva ingrediente com glúten e seu plano está sem glúten';
  if(!bloqueio && n.semLactose){
    const lac = itens.filter(it=>RC_LACTOSE.includes(it.id));
    if(lac.some(it=>!it.fl.includes('o'))) bloqueio = 'a lactose faz parte da base da receita e seu plano está sem lactose';
    else if(lac.length){ itens = itens.filter(it=>!RC_LACTOSE.includes(it.id)); notas.push('Sem lactose: tiramos ' + lac.map(it=>rcAli(it.id)[0].toLowerCase()).join(' e ') + '. Se usar versão sem lactose, confira o rótulo.'); }
  }
  return { itens, notas, bloqueio };
}
// variação que a pessoa vê primeiro: respeita o vegetariano e o modo econômico
function rcVarInicial(r){
  if(!r.vars) return 0; const n = rcCfg();
  const ok = i => !rcRestricao(r, i).bloqueio;
  if(n.vegetariano){ const v = r.vars.findIndex((x,i)=>x.veg && ok(i)); if(v >= 0) return v; }
  if(n.economico){ const v = r.vars.findIndex((x,i)=>x.econ && ok(i)); if(v >= 0) return v; }
  const v = r.vars.findIndex((x,i)=>ok(i)); return v >= 0 ? v : 0;
}
function rcCompativel(r){
  if(!r.vars) return !rcRestricao(r, 0).bloqueio;
  return r.vars.some((v,i)=>!rcRestricao(r, i).bloqueio);
}
// refeição do plano que a receita substitui
function rcPlano(){ try{ const p = nutriMontarPlano(nutriDiaSel()); return (p && !p.erro) ? p : null; }catch(e){ return null; } }
function rcRefPadrao(r, plano){
  if(!plano) return null; const ids = plano.refeicoes.map(m=>m.id);
  const pref = r.tipo === 'refeicao' ? ['jantar','almoco'] : ['lanche2','lanche1','cafe','ceia'];
  return pref.find(x=>ids.includes(x)) || ids[0];
}
// ajusta a porção à refeição escolhida, sem encolher a receita até descaracterizar
const RC_MIN = 0.6, RC_MAX = 1.6;
function rcEncaixe(r, itens, alvo){
  const res = { alvo };
  if(r.modo === 'pecas'){
    const tot = rcNutri(itens), porPeca = { kcal:tot.kcal/r.pecas, p:tot.p/r.pecas, c:tot.c/r.pecas, g:tot.g/r.pecas };
    res.porPeca = porPeca;
    if(!alvo){ res.n = r.porcao; }
    else {
      let n = Math.round(alvo / porPeca.kcal);
      n = Math.max(1, Math.min(r.pecas, n));
      if(porPeca.kcal > alvo*1.25){ res.naoCabe = true; n = 1; }
      res.n = n;
      if(!res.naoCabe && n*porPeca.kcal < alvo*0.8) res.falta = Math.round(alvo - n*porPeca.kcal);
    }
    res.tot = { kcal:porPeca.kcal*res.n, p:porPeca.p*res.n, c:porPeca.c*res.n, g:porPeca.g*res.n };
    return res;
  }
  const fixo = rcNutri(itens.filter(it=>!it.fl.includes('f'))), flex = rcNutri(itens.filter(it=>it.fl.includes('f')));
  let s = 1;
  if(alvo && flex.kcal > 0){
    const ideal = (alvo - fixo.kcal) / flex.kcal;
    if(ideal < RC_MIN){ res.naoCabe = true; s = RC_MIN; }
    else s = Math.min(RC_MAX, ideal);
    res.escala = s;
  }
  res.itens = itens.map(it=> it.fl.includes('f') ? { ...it, q: rcArred(it.id, it.q*s) } : it);
  res.tot = rcNutri(res.itens);
  if(alvo && !res.naoCabe && res.tot.kcal < alvo*0.85) res.falta = Math.round(alvo - res.tot.kcal);
  if(alvo && res.tot.kcal > alvo*1.15) res.naoCabe = true;
  return res;
}
function rcPorcaoKcal(r, plano){
  const vi = rcVarInicial(r); const rs = rcRestricao(r, vi);
  const ref = rcRefPadrao(r, plano); const meal = plano && plano.refeicoes.find(m=>m.id===ref);
  const alvo = (r.tipo === 'doce' || !meal) ? 0 : meal.tot.kcal;
  return { e: rcEncaixe(r, rs.itens, alvo), meal };
}

// ---------- textos ----------
function rcFmtQtd(id, q){
  const a = rcAli(id); if(!a) return '';
  if(a[7] && !q) return '';
  if(a[5]){
    const fr = { 0.25:'¼', 0.5:'½', 0.75:'¾' }; const int = Math.floor(q), resto = Math.round((q-int)*4)/4;
    const txt = (int ? String(int) : '') + (resto ? (int ? ' ' : '') + fr[resto] : '');
    const nomeU = { ovo:['ovo','ovos'], paohb:['pão','pães'], paosirio:['pão','pães'], rap10:['tortilha','tortilhas'], banana:['banana','bananas'], paoforma:['fatia','fatias'], paoint:['fatia','fatias'], pao:['pão','pães'], mucarela:['fatia','fatias'], queijoprato:['fatia','fatias'], presunto:['fatia','fatias'] }[id];
    return `${txt || '0'} ${nomeU ? (q > 1 ? nomeU[1] : nomeU[0]) : 'unid.'}`;
  }
  const liq = ['leite','leiteint'].includes(id);
  return `${Math.round(q)} ${liq ? 'ml' : 'g'}`;
}
function rcMacro(t){ return `${Math.round(t.kcal)} kcal · P ${Math.round(t.p)} g · C ${Math.round(t.c)} g · G ${Math.round(t.g)} g`; }
function rcTags(r){
  const t = [];
  if(r.af) t.push('AirFryer');
  if(r.econ) t.push('Econômica');
  const it = rcItensDe(r, 0);
  if(!it.some(x=>RC_GLUTEN.includes(x.id))) t.push('Sem glúten*');
  return t;
}
function rcPeca(r, n){ return `${n} ${n === 1 ? r.peca[0] : r.peca[1]}`; }


// ---------- ilustrações (SVG próprio: não depende de fonte de emoji nem de fotos) ----------
const RC_SVG = {
  burger:'<ellipse cx="32" cy="22" rx="22" ry="12" fill="#E8A54B"/><rect x="10" y="22" width="44" height="6" fill="#E8A54B"/><circle cx="24" cy="17" r="1.4" fill="#FFF3D6"/><circle cx="32" cy="14" r="1.4" fill="#FFF3D6"/><circle cx="40" cy="17" r="1.4" fill="#FFF3D6"/><path d="M8 30h48l-4 4H12z" fill="#6FBF4A"/><rect x="9" y="33" width="46" height="5" rx="2" fill="#F4C430"/><rect x="9" y="37" width="46" height="8" rx="4" fill="#7A3E1D"/><rect x="10" y="45" width="44" height="9" rx="4" fill="#E8A54B"/>',
  pizza:'<path d="M32 8 L56 52 Q32 60 8 52 Z" fill="#F4C430"/><path d="M8 52 Q32 60 56 52 L54 48 Q32 56 10 48 Z" fill="#D98B3A"/><circle cx="30" cy="30" r="4" fill="#D64541"/><circle cx="38" cy="42" r="4" fill="#D64541"/><circle cx="24" cy="44" r="4" fill="#D64541"/><circle cx="34" cy="20" r="2" fill="#6FBF4A"/>',
  pastel:'<path d="M8 40 A24 24 0 0 1 56 40 Z" fill="#F0B95A"/><path d="M8 40h48" stroke="#C98A2E" stroke-width="3" stroke-dasharray="3 3"/><path d="M16 32 Q32 18 48 32" stroke="#FFE3A6" stroke-width="2" fill="none"/>',
  batata:'<ellipse cx="32" cy="36" rx="24" ry="15" fill="#B9853F"/><ellipse cx="32" cy="32" rx="18" ry="9" fill="#F7E1A0"/><circle cx="26" cy="31" r="3" fill="#F4C430"/><circle cx="36" cy="30" r="3" fill="#E57E2F"/><circle cx="31" cy="34" r="2.5" fill="#6FBF4A"/>',
  sanduiche:'<path d="M8 48 L32 14 L56 48 Z" fill="#F3D9A4"/><path d="M12 46 L32 18 L52 46" fill="none" stroke="#6FBF4A" stroke-width="4"/><path d="M14 46 L32 22 L50 46" fill="none" stroke="#F4C430" stroke-width="3"/><path d="M8 48h48" stroke="#C99B57" stroke-width="3"/>',
  wrap:'<rect x="14" y="14" width="26" height="40" rx="12" transform="rotate(-25 27 34)" fill="#F1D19A"/><path d="M38 16 l10 6 -6 10z" fill="#6FBF4A"/><path d="M40 22 l6 4 -4 6z" fill="#D64541"/>',
  triangulo:'<path d="M10 46 L32 12 L54 46 Q32 52 10 46Z" fill="#E9B866"/><path d="M20 40 L32 22 L44 40Z" fill="#9C4A2A"/><circle cx="32" cy="34" r="2" fill="#6FBF4A"/>',
  bolinhos:'<circle cx="22" cy="40" r="11" fill="#D9963F"/><circle cx="42" cy="40" r="11" fill="#C98A2E"/><circle cx="32" cy="24" r="11" fill="#E8A54B"/><circle cx="29" cy="21" r="2" fill="#FFE3A6"/>',
  panqueca:'<ellipse cx="32" cy="40" rx="24" ry="10" fill="#F6E7C8"/><rect x="12" y="26" width="40" height="14" rx="7" fill="#F2C879"/><path d="M14 32h36" stroke="#C0392B" stroke-width="4"/><ellipse cx="32" cy="27" rx="18" ry="3" fill="#FFF6DC"/>',
  doce:'<circle cx="24" cy="36" r="12" fill="#5B3420"/><circle cx="42" cy="34" r="10" fill="#6E4129"/><g fill="#F4E1C1"><circle cx="20" cy="32" r="1.3"/><circle cx="26" cy="30" r="1.3"/><circle cx="28" cy="38" r="1.3"/><circle cx="40" cy="30" r="1.3"/><circle cx="45" cy="36" r="1.3"/></g>',
  morango:'<path d="M32 54 C14 42 14 24 32 22 C50 24 50 42 32 54Z" fill="#D64541"/><path d="M32 54 C24 46 22 36 24 30 L40 30 C42 36 40 46 32 54Z" fill="#5B3420"/><path d="M24 22 l8 -8 8 8 -8 3z" fill="#6FBF4A"/>',
  banana:'<path d="M12 22 Q20 52 54 44 Q30 44 20 20 Z" fill="#F4D03F"/><path d="M12 22 l-2 -5 5 2z" fill="#7A5A2A"/>'
};
const RC_FORMA = { hamb_caseiro:'burger', hamb_frango:'burger', hamb_pastel:'pastel', pastel_af:'pastel', mini_pizza:'pizza', pizza_frig:'pizza', batata_rech:'batata', sand_natural:'sanduiche', wrap_frango:'wrap', esfiha:'triangulo', bolinho:'bolinhos', crepioca:'panqueca', panqueca:'panqueca', brigadeiro:'doce', morango_choc:'morango', banana_assada:'banana' };
function rcIlu(r){ const f = RC_SVG[RC_FORMA[r.id]] || RC_SVG.burger; return `<svg viewBox="0 0 64 64" width="100%" height="100%" role="img" aria-label="${mtEsc(r.nome)}" focusable="false">${f}</svg>`; }
// artigo certo para a refeição ("o jantar", "a ceia")
function rcArt(meal){ return meal && /^(ceia)$/i.test(meal.id) ? 'a' : 'o'; }
function rcSeu(meal){ return (rcArt(meal) === 'a' ? 'sua ' : 'seu ') + meal.nome.toLowerCase(); }
function rcDo(meal){ return (rcArt(meal) === 'a' ? 'da ' : 'do ') + meal.nome.toLowerCase(); }

// ---------- telas ----------
function _rcMi(){ const mi = $('modal-inner'); if(mi && mi.dataset.tela === 'nutri') mi.dataset.tela = 'nutri-sub'; return mi; }
function openReceitas(cat){
  if(!mtTem('alimentacao')) return mtPremiumAviso('alimentacao');
  window.__rc = { tela:'lista', cat: cat || (window.__rc && window.__rc.cat) || 'todas' };
  rcRenderLista();
}
function rcCat(cat){ window.__rc = { ...(window.__rc||{}), tela:'lista', cat }; rcRenderLista(); }
function rcRenderLista(){
  const mi = _rcMi(); if(!mi) return;
  const st = window.__rc || { cat:'todas' }; const cat = st.cat;
  const plano = rcPlano(); const n = rcCfg();
  const filtro = r => cat === 'todas' ? true : cat === 'fav' ? n.receitasFav.includes(r.id) : cat === 'econ' ? r.econ : r.cat === cat;
  const lista = RC_RECEITAS.filter(filtro);
  const ok = lista.filter(rcCompativel), fora = lista.filter(r=>!rcCompativel(r));
  const chip = (k, ic, nome) => `<button class="rc-chip ${cat===k?'on':''}" onclick="rcCat('${k}')" aria-pressed="${cat===k}">${ic} ${nome}</button>`;
  const card = r => {
    const { e, meal } = rcPorcaoKcal(r, plano);
    const porcao = r.modo === 'pecas' ? rcPeca(r, e.n) : '1 porção';
    const linha = r.tipo === 'doce' ? `${porcao} ≈ ${Math.round(e.tot.kcal)} kcal`
      : e.naoCabe ? `Passa ${meal ? rcDo(meal) : 'do plano'}: veja opções`
      : `${porcao} ≈ ${Math.round(e.tot.kcal)} kcal${meal ? ` · no lugar ${rcDo(meal)}` : ''}`;
    return `<button class="rc-card" onclick="openReceita('${r.id}')">
      <span class="rc-ilu rc-${r.cat}">${rcIlu(r)}</span>
      <span class="rc-ct"><b>${mtEsc(r.nome)}${rcEhFav(r.id) ? ' <span class="rc-favi" aria-label="favorita">★</span>' : ''}</b>
        <small>⏱ ${mtEsc(r.tempo)} · ${mtEsc(r.dif)}</small>
        <small class="${e.naoCabe ? 'rc-alerta' : ''}">${linha}</small>
        <span class="rc-tags">${rcTags(r).map(t=>`<i>${t}</i>`).join('')}</span></span></button>`;
  };
  const doceNota = (cat === 'doces' || cat === 'todas') ? `<div class="rc-doce"><b>🍫 Doce também tem lugar no plano</b><span>Um bombom, um quadradinho de chocolate, um brigadeiro pequeno ou uma sobremesa caseira porcionada podem entrar sem culpa. O que conta é a semana, não um doce. Veja as calorias no rótulo, escolha um momento (depois do almoço ou no lanche) e, se quiser, tire um pouco de outro item desse lanche. Não existe uma quantidade certa para todo mundo: depende do seu plano e de como você se sente.</span></div>` : '';
  mi.innerHTML = `<div class="rc">
    <h3 style="margin-bottom:2px">🍔 Lanches para sair da rotina</h3>
    <p class="rc-sub">Receitas gostosas, práticas e econômicas para aproveitar o fim de semana sem deixar seu planejamento de lado.</p>
    ${plano ? `<p class="rc-mini">As porções já vêm ajustadas à refeição do seu plano de ${NUTRI_DIAS[(plano.diaIdx||1)-1].toLowerCase()} (${Math.round(plano.dia.kcal)} kcal no dia).</p>` : `<p class="rc-mini rc-alerta">Complete peso, altura, idade e sexo no perfil para a porção ser ajustada ao seu plano. Por enquanto aparecem as porções-padrão.</p>`}
    <div class="rc-chips" role="toolbar" aria-label="Categorias">${chip('todas','📋','Todas')}${chip('fav','⭐','Favoritas')}${RC_CATS.map(c=>chip(c[0],c[1],c[2])).join('')}</div>
    ${cat === 'doces' ? doceNota : ''}
    <div class="rc-lista">${ok.map(card).join('') || `<div class="mt-muted" style="padding:14px 4px;font-size:13px">${cat === 'fav' ? 'Nenhuma favorita ainda. Abra uma receita e toque em ☆ Salvar.' : 'Nenhuma receita desta categoria combina com as restrições do seu plano.'}</div>`}</div>
    ${fora.length ? `<details class="mealc"><summary><span class="mi">🚫</span><span class="mt"><b>Não combinam com suas restrições</b><small>${fora.length} receita${fora.length>1?'s':''}</small></span></summary><div class="mb" style="font-size:12.5px;line-height:1.55;color:var(--text-dim)">${fora.map(r=>`• <b>${mtEsc(r.nome)}</b>: ${rcRestricao(r, rcVarInicial(r)).bloqueio}.`).join('<br>')}</div></details>` : ''}
    ${cat === 'todas' ? doceNota : ''}
    <p class="rc-aviso">Valores estimados a partir da Tabela Brasileira de Composição de Alimentos (TACO/UNICAMP) e da média de rótulos de produtos comuns; mudam conforme a marca e o preparo. *Sem glúten na receita, mas confira os rótulos (pode haver traços). Conteúdo educativo: não substitui o nutricionista. Se tiver alergia, intolerância, diabetes ou outra condição de saúde, siga a orientação do seu profissional.</p>
    <button class="btn btn-ghost btn-block" onclick="openNutri()">← Voltar ao plano alimentar</button>
  </div>`;
  mi.scrollTop = 0; $('modal-back').classList.add('on');
}
function openReceita(id, ref){
  if(!mtTem('alimentacao')) return mtPremiumAviso('alimentacao');
  const r = RC_RECEITAS.find(x=>x.id===id); if(!r) return;
  const ant = window.__rc || {};
  window.__rc = { tela:'receita', cat: ant.cat || 'todas', id, vi: rcVarInicial(r), ref: ref || null, ver:'porcao' };
  rcRenderReceita(true);
}
function rcVar(i){ if(window.__rc){ window.__rc.vi = i; rcRenderReceita(); } }
function rcRef(id){ if(window.__rc){ window.__rc.ref = id; rcRenderReceita(); } }
function rcVer(m){ if(window.__rc){ window.__rc.ver = m; rcRenderReceita(); } }
function rcSugestoes(r, plano, alvo){
  // receitas que cabem nesta refeição, da mais parecida (mesma categoria) para as outras
  return RC_RECEITAS.filter(x=>x.id !== r.id && x.tipo === r.tipo && rcCompativel(x)).map(x=>{
    const rs = rcRestricao(x, rcVarInicial(x)); const e = rcEncaixe(x, rs.itens, alvo); return { x, e };
  }).filter(o=>!o.e.naoCabe).sort((a,b)=>(a.x.cat===r.cat?0:1)-(b.x.cat===r.cat?0:1)).slice(0,3);
}
function rcRenderReceita(topo){
  const mi = _rcMi(); const st = window.__rc; if(!mi || !st) return;
  const r = RC_RECEITAS.find(x=>x.id===st.id); if(!r) return rcRenderLista();
  const plano = rcPlano();
  const rs = rcRestricao(r, st.vi);
  if(!st.ref) st.ref = rcRefPadrao(r, plano);
  const meal = plano && plano.refeicoes.find(m=>m.id===st.ref);
  const alvo = (r.tipo === 'doce' || !meal) ? 0 : meal.tot.kcal;
  const e = rcEncaixe(r, rs.itens, alvo);
  const fav = rcEhFav(r.id);
  const nomeRef = meal ? meal.nome.toLowerCase() : '';
  // porção
  let porcaoTxt, itensPorcao, mult = 1;
  if(r.modo === 'pecas'){ porcaoTxt = rcPeca(r, e.n); }
  else porcaoTxt = '1 porção';
  // ingredientes exibidos
  let lista, tituloIng;
  if(r.modo === 'pecas'){
    if(st.ver === 'porcao'){ mult = e.n / r.pecas; tituloIng = `Para a sua porção (${rcPeca(r, e.n)} de ${r.pecas})`; lista = rs.itens; }
    else { tituloIng = `Receita inteira (rende ${rcPeca(r, r.pecas)})`; lista = rs.itens; }
  } else {
    itensPorcao = e.itens;
    if(st.ver === 'porcao'){ tituloIng = 'Para a sua porção'; lista = itensPorcao; }
    else { tituloIng = `Para ${r.rende} porç${r.rende>1?'ões':'ão'}`; lista = itensPorcao; mult = r.rende; }
  }
  const ingHtml = lista.map(it=>{
    const a = rcAli(it.id); if(!a) return '';
    let q = it.q * mult;
    if(a[5]) q = Math.round(q*4)/4; else if(q) q = Math.max(5, Math.round(q/5)*5);
    const qt = rcFmtQtd(it.id, q);
    return `<li><span>${mtEsc(a[0])}${/[og]/.test(it.fl) ? ' <em>(opcional)</em>' : ''}</span>${qt ? `<b>${mtEsc(qt)}</b>` : ''}</li>`;
  }).join('');
  // encaixe no plano
  let encaixe = '';
  if(r.tipo === 'doce'){
    const lanche = plano && plano.refeicoes.find(m=>/lanche/.test(m.id));
    const pctDia = plano ? Math.round(e.tot.kcal / plano.dia.kcal * 100) : null;
    encaixe = `<div class="rc-box"><b>${porcaoTxt} ≈ ${Math.round(e.tot.kcal)} kcal</b>${pctDia !== null ? ` <span class="rc-mini">(${pctDia}% do seu dia)</span>` : ''}
      <span>${lanche ? (e.tot.kcal <= lanche.tot.kcal ? `Cabe no lugar ${rcDo(lanche)} (~${Math.round(lanche.tot.kcal)} kcal) ou junto dele, tirando um pouco de outro item.` : `Fica acima ${rcDo(lanche)} (~${Math.round(lanche.tot.kcal)} kcal): coma uma unidade a menos ou divida com alguém.`) : 'Encaixe num lanche, tirando um pouco de outro item.'} Sem culpa: um doce planejado não estraga a semana.</span></div>`;
  } else if(!plano){
    encaixe = `<div class="rc-box"><b>${porcaoTxt} ≈ ${Math.round(e.tot.kcal)} kcal</b><span>Porção-padrão. Complete o perfil para ajustar ao seu plano.</span></div>`;
  } else {
    const refs = plano.refeicoes.map(m=>`<button class="rc-chip ${m.id===st.ref?'on':''}" onclick="rcRef('${m.id}')" aria-pressed="${m.id===st.ref}">${m.icone} ${mtEsc(m.nome)}</button>`).join('');
    let msg;
    if(e.naoCabe){
      const sug = rcSugestoes(r, plano, alvo);
      const maior = plano.refeicoes.filter(m=>m.id!==st.ref && m.tot.kcal > alvo).sort((a,b)=>b.tot.kcal-a.tot.kcal)[0];
      msg = `<div class="rc-box rc-box-alerta"><b>Esta receita não cabe bem n${rcArt(meal)} ${nomeRef}</b>
        <span>${rcSeu(meal).replace(/^./,c=>c.toUpperCase())} tem ~${Math.round(alvo)} kcal. ${r.modo==='pecas' ? `Uma ${r.peca[0]} já tem ~${Math.round(e.porPeca.kcal)} kcal.` : `Mesmo com o recheio reduzido ao mínimo que ainda vale a pena, a porção fica em ~${Math.round(e.tot.kcal)} kcal.`} Em vez de encolher até virar "nada", prefira:</span>
        <ul class="rc-ul">${maior ? `<li>fazer no lugar ${rcDo(maior).split(' ')[0]} <a href="#" onclick="event.preventDefault();rcRef('${maior.id}')">${mtEsc(maior.nome.toLowerCase())}</a> (~${Math.round(maior.tot.kcal)} kcal);</li>` : ''}
        ${sug.map(o=>`<li><a href="#" onclick="event.preventDefault();openReceita('${o.x.id}','${st.ref}')">${mtEsc(o.x.nome)}</a> (~${Math.round(o.e.tot.kcal)} kcal);</li>`).join('')}
        <li>ou as trocas abaixo (sem queijo, pão integral, mais salada).</li></ul></div>`;
    } else {
      msg = `<div class="rc-box"><b>Sua porção: ${porcaoTxt} ≈ ${Math.round(e.tot.kcal)} kcal</b>
        <span>No lugar ${rcDo(meal)}, que no plano tem ~${Math.round(alvo)} kcal e ${Math.round(meal.tot.p)} g de proteína.${r.modo==='montado' && e.escala && Math.abs(e.escala-1) > 0.08 ? ` Ajustamos o recheio (${e.escala > 1 ? 'mais' : 'menos'} carne/queijo) para fechar com seu plano.` : ''}</span>
        <span class="rc-mini">${rcMacro(e.tot)}</span>
        ${e.falta ? `<span>Ainda sobram ~${e.falta} kcal nessa refeição: acompanhe com salada à vontade e uma fruta${r.modo==='pecas' ? '' : ', ou faça uma porção e meia'}.</span>` : ''}
        ${meal.tot.p - e.tot.p > 10 ? `<span>Tem ~${Math.round(meal.tot.p - e.tot.p)} g de proteína a menos que ${rcArt(meal)} ${nomeRef} do plano: um ovo ou um copo de leite completam.</span>` : ''}</div>`;
    }
    encaixe = `<div class="rc-lbl">Encaixar no lugar de:</div><div class="rc-chips">${refs}</div>${msg}`;
  }
  const podeRegistrar = plano && meal && r.tipo !== 'doce' && !e.naoCabe && nutriDiaSel() >= ((typeof getDayIdx==='function') ? getDayIdx() : 1);
  const vars = r.vars ? `<div class="rc-lbl">Versão:</div><div class="rc-chips">${r.vars.map((v,i)=>{ const bl = rcRestricao(r, i).bloqueio; return `<button class="rc-chip ${i===st.vi?'on':''}" ${bl?'disabled title="Não combina com suas restrições"':''} onclick="rcVar(${i})" aria-pressed="${i===st.vi}">${mtEsc(v.n)}</button>`; }).join('')}</div>` : '';
  mi.innerHTML = `<div class="rc">
    <button class="rc-voltar" onclick="openReceitas()">← Receitas</button>
    <div class="rc-topo"><span class="rc-ilu rc-ilu-g rc-${r.cat}">${rcIlu(r)}</span>
      <div style="min-width:0"><h3 style="margin:0">${mtEsc(r.nome)}</h3>
        <div class="rc-mini">⏱ ${mtEsc(r.tempo)} · ${mtEsc(r.dif)} · rende ${r.modo==='pecas' ? rcPeca(r, r.pecas) : r.rende + ' porç' + (r.rende>1?'ões':'ão')}</div>
        <span class="rc-tags">${rcTags(r).map(t=>`<i>${t}</i>`).join('')}</span></div></div>
    <button class="btn btn-ghost btn-block rc-favbtn" onclick="rcFav('${r.id}')" aria-pressed="${fav}">${fav ? '★ Salva nas favoritas' : '☆ Salvar nas favoritas'}</button>
    ${rs.bloqueio ? `<div class="rc-box rc-box-alerta"><b>Esta versão não combina com seu plano</b><span>Ela ${rs.bloqueio}.</span></div>` : ''}
    ${vars}
    ${rs.bloqueio ? '' : encaixe}
    ${rs.notas.map(t=>`<div class="rc-mini" style="margin:6px 0">${mtEsc(t)}</div>`).join('')}
    ${r.nota ? `<div class="rc-nota">💡 ${mtEsc(r.nota)}</div>` : ''}
    <div class="rc-sec"><div class="rc-sec-h"><b>🛒 Ingredientes</b><span class="rc-ver"><button class="${st.ver==='porcao'?'on':''}" onclick="rcVer('porcao')">Minha porção</button><button class="${st.ver==='receita'?'on':''}" onclick="rcVer('receita')">Receita toda</button></span></div>
      <div class="rc-mini">${tituloIng}</div><ul class="rc-ing">${ingHtml}</ul></div>
    <div class="rc-sec"><b>👩‍🍳 Modo de preparo</b><ol class="rc-passos">${r.passos.map(p=>`<li>${mtEsc(p)}</li>`).join('')}</ol></div>
    ${r.subs && r.subs.length ? `<div class="rc-sec"><b>🔁 Substituições</b><ul class="rc-ul">${r.subs.map(s=>`<li>${mtEsc(s)}</li>`).join('')}</ul></div>` : ''}
    <div class="rc-sec"><b>💰 Para economizar</b><ul class="rc-ul">
      <li>${mtEsc(r.congela || 'Faça na hora.')}</li>
      <li>Os ingredientes se repetem entre as receitas (frango desfiado, carne moída, pão, queijo, tomate): uma compra serve para várias.</li></ul>
      <details class="rc-custo"><summary>Calcular o custo por porção</summary>
        <p class="rc-mini">O app não inventa preço: cada cidade e mercado é diferente. Digite quanto você gastou nos ingredientes desta receita.</p>
        <div class="rc-custo-g"><label>Gastei (R$)<input class="input" id="rc-gasto" type="number" inputmode="decimal" min="0" step="0.01" oninput="rcCusto()"></label>
        <label>Delivery parecido (R$, opcional)<input class="input" id="rc-deliv" type="number" inputmode="decimal" min="0" step="0.01" oninput="rcCusto()"></label></div>
        <div id="rc-custo-res" class="rc-mini" aria-live="polite"></div></details></div>
    ${podeRegistrar ? `<button class="btn btn-primary btn-block" style="margin-top:6px" onclick="rcRegistrar()">✅ Usar no lugar ${mtEsc(meal ? rcDo(meal) : '')} ${nutriDiaSel() === ((typeof getDayIdx==='function') ? getDayIdx() : 1) ? 'de hoje' : 'de ' + NUTRI_DIAS[nutriDiaSel()-1].toLowerCase()}</button>` : ''}
    <p class="rc-aviso">Valores nutricionais estimados (TACO/UNICAMP e média de rótulos); mudam com a marca e o preparo. Não substitui o nutricionista. Alergias e intolerâncias: confira sempre os rótulos.</p>
    <button class="btn btn-ghost btn-block" onclick="openNutri()">← Voltar ao plano alimentar</button>
  </div>`;
  if(topo) mi.scrollTop = 0;
  $('modal-back').classList.add('on');
  window.__rcPorcao = { r, e };
  const sv = (state.nutri && state.nutri.receitasCusto && state.nutri.receitasCusto[r.id]) || null;
  if(sv){ const g = $('rc-gasto'), d = $('rc-deliv'); if(g && sv.g) g.value = sv.g; if(d && sv.d) d.value = sv.d; rcCusto(true); }
}
function rcCusto(soMostrar){
  const o = window.__rcPorcao; const out = $('rc-custo-res'); if(!o || !out) return;
  const g = parseFloat(($('rc-gasto')||{}).value), d = parseFloat(($('rc-deliv')||{}).value);
  const r = o.r;
  if(!(g > 0)){ out.textContent = ''; return; }
  // quantas porções da SUA porção a compra rende
  const porcoes = r.modo === 'pecas' ? r.pecas / Math.max(1, o.e.n) : r.rende;
  const porPorcao = g / porcoes;
  const brl = v => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  let txt = `≈ ${brl(porPorcao)} por porção (${Math.round(porcoes*10)/10} porç${porcoes>1?'ões':'ão'} com o que você comprou).`;
  if(d > 0){ const dif = d - porPorcao; txt += dif > 0 ? ` Economia de ≈ ${brl(dif)} em relação ao delivery que você informou.` : ` Neste caso o delivery saiu mais barato por porção.`; }
  out.textContent = txt;
  if(!soMostrar){ const n = rcCfg(); n.receitasCusto = n.receitasCusto || {}; n.receitasCusto[r.id] = { g, d: d > 0 ? d : null }; clearTimeout(window.__rcCustoT); window.__rcCustoT = setTimeout(()=>{ try{ saveData(); }catch(e){} }, 800); }
}
// registra a receita no lugar da refeição do dia (dá para desfazer com "Voltar ao recomendado")
function rcRegistrar(){
  const o = window.__rcPorcao, st = window.__rc; if(!o || !st) return;
  if(!mtTem('alimentacao')) return mtPremiumAviso('alimentacao');
  const plano = rcPlano(); const meal = plano && plano.refeicoes.find(m=>m.id===st.ref); if(!meal) return;
  const r = o.r, t = o.e.tot;
  const m = nutriMealLog(meal.id, true);
  meal.itens.forEach(it=>{ m.adj[it.id] = { x:1 }; });
  const nome = (r.modo === 'pecas' ? `${r.nome.split(' ')[0]} (${rcPeca(r, o.e.n)})` : r.nome).slice(0,40);
  m.add = (m.add||[]).filter(a=>!(a.custom && a.receita));
  m.add.push({ custom:true, receita:r.id, nome, kcal:Math.round(t.kcal), p:Math.round(t.p), c:Math.round(t.c), g:Math.round(t.g) });
  nutriAbrirRef(meal.id); saveData();
  toast(`Registrado no lugar ${rcDo(meal)}. Para desfazer: "Voltar ao recomendado" na refeição.`);
  openNutri();
}

// ---------- entrada no plano alimentar (discreta, depois das dicas) ----------
mtGancho('openNutri', { depois(){
  try{
    if(!mtTem('alimentacao')) return;
    const mi = $('modal-inner'); if(!mi || mi.querySelector('#rc-entrada')) return;
    if(!mi.querySelector('[onclick="nutriListaCompras()"]')) return;      // só na tela do plano
    const ds = mi.querySelectorAll('details.mealc'); const ult = ds[ds.length-1]; if(!ult) return;
    const nFav = rcCfg().receitasFav.length;
    ult.insertAdjacentHTML('afterend', `<button class="mealc rc-entrada" id="rc-entrada" onclick="openReceitas()">
      <span class="mi">🍔</span><span class="mt"><b>Lanches para sair da rotina</b><small>receitas práticas com a porção do seu plano${nFav ? ` · ${nFav} favorita${nFav>1?'s':''}` : ''}</small></span><span class="rc-seta">›</span></button>`);
  }catch(e){ console.log('receitas', e); }
}});

// ---------- estilos ----------
(function(){
  if(document.getElementById('rc-css')) return;
  const s = document.createElement('style'); s.id = 'rc-css';
  s.textContent = `
.rc-entrada{display:flex;align-items:center;gap:10px;width:100%;text-align:left;cursor:pointer;font:inherit;color:inherit;border:1px solid var(--border,rgba(127,127,127,.2));background:var(--card,transparent);padding:12px 14px;border-radius:14px;margin:0 0 8px}
.rc-entrada .rc-seta{margin-left:auto;color:var(--text-mute);font-size:18px}
.rc-sub{color:var(--text-dim);font-size:13px;line-height:1.5;margin:4px 0 6px}
.rc-mini{font-size:11.5px;color:var(--text-dim);line-height:1.5}
.rc-alerta{color:var(--primary-2,#c0392b)}
.rc-chips{display:flex;gap:6px;overflow-x:auto;padding:4px 0 8px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.rc-chips::-webkit-scrollbar{display:none}
.rc-chip{flex:0 0 auto;border:1px solid var(--border,rgba(127,127,127,.25));background:transparent;color:inherit;border-radius:999px;padding:7px 12px;font:inherit;font-size:12.5px;white-space:nowrap;cursor:pointer;min-height:36px}
.rc-chip.on{background:var(--primary);border-color:var(--primary);color:var(--on-primary,#fff)}
.rc-chip[disabled]{opacity:.4;cursor:not-allowed}
.rc-lista{display:flex;flex-direction:column;gap:8px;margin:4px 0 10px}
.rc-card{display:flex;gap:12px;align-items:center;text-align:left;width:100%;font:inherit;color:inherit;cursor:pointer;border:1px solid var(--border,rgba(127,127,127,.2));background:var(--card,transparent);border-radius:16px;padding:10px}
.rc-ct{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.rc-ct b{font-size:14px;line-height:1.3}
.rc-ct small{font-size:11.5px;color:var(--text-dim);line-height:1.4}
.rc-ct small.rc-alerta{color:var(--primary-2,#c0392b)}
.rc-favi{color:#e6a700}
.rc-ilu{flex:0 0 auto;width:58px;height:58px;border-radius:14px;display:flex;align-items:center;justify-content:center;padding:6px;box-sizing:border-box;background:linear-gradient(135deg,#f7d9a8,#f0a868)}
.rc-ilu-g{width:76px;height:76px;font-size:40px;border-radius:18px}
.rc-ilu.rc-pizza{background:linear-gradient(135deg,#ffd3b0,#ef7f5a)}
.rc-ilu.rc-airfryer{background:linear-gradient(135deg,#ffe6a6,#e9b949)}
.rc-ilu.rc-rapidas{background:linear-gradient(135deg,#d5efc4,#8cc56b)}
.rc-ilu.rc-doces{background:linear-gradient(135deg,#ecd3c0,#a8714e)}
.rc-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}
.rc-tags i{font-style:normal;font-size:10.5px;padding:2px 7px;border-radius:999px;background:rgba(127,127,127,.14);color:var(--text-dim)}
.rc-topo{display:flex;gap:12px;align-items:center;margin:6px 0 10px}
.rc-voltar{background:none;border:0;color:var(--primary);font:inherit;font-size:13px;padding:4px 0;cursor:pointer}
.rc-favbtn{margin:0 0 8px}
.rc-lbl{font-size:12px;color:var(--text-dim);margin-top:6px}
.rc-box{display:flex;flex-direction:column;gap:4px;border-radius:14px;padding:12px 14px;margin:4px 0 8px;background:rgba(127,127,127,.08);font-size:13px;line-height:1.5}
.rc-box-alerta{background:rgba(230,126,34,.12)}
.rc-box a{color:var(--primary)}
.rc-nota{font-size:12.5px;line-height:1.55;border-left:3px solid var(--primary);padding:6px 10px;margin:8px 0;color:var(--text-dim)}
.rc-sec{margin:12px 0;font-size:13.5px}
.rc-sec-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rc-ver{margin-left:auto;display:inline-flex;border:1px solid var(--border,rgba(127,127,127,.25));border-radius:999px;overflow:hidden}
.rc-ver button{background:none;border:0;color:inherit;font:inherit;font-size:11.5px;padding:6px 10px;cursor:pointer}
.rc-ver button.on{background:var(--primary);color:var(--on-primary,#fff)}
.rc-ing{list-style:none;padding:0;margin:6px 0 0}
.rc-ing li{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px dashed rgba(127,127,127,.2);font-size:13px}
.rc-ing li b{white-space:nowrap}
.rc-ing em{font-size:11px;color:var(--text-mute)}
.rc-passos{padding-left:20px;margin:6px 0 0;line-height:1.55;font-size:13px}
.rc-passos li{margin-bottom:6px}
.rc-ul{padding-left:18px;margin:6px 0 0;line-height:1.55;font-size:12.5px}
.rc-doce{display:flex;flex-direction:column;gap:4px;border-radius:14px;padding:12px 14px;margin:6px 0 10px;background:rgba(168,113,78,.12);font-size:12.5px;line-height:1.55}
.rc-custo{margin-top:8px;font-size:12.5px}
.rc-custo summary{cursor:pointer;color:var(--primary)}
.rc-custo-g{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0}
.rc-custo-g label{font-size:11.5px;color:var(--text-dim);display:flex;flex-direction:column;gap:4px}
.rc-aviso{font-size:11px;color:var(--text-mute);line-height:1.5;padding:8px 2px}
@media (max-width:360px){.rc-ilu{width:48px;height:48px;font-size:25px}.rc-ilu-g{width:60px;height:60px;font-size:32px}.rc-custo-g{grid-template-columns:1fr}.rc-ct b{font-size:13.5px}}
`;
  document.head.appendChild(s);
})();

Object.assign(window, { openReceitas, openReceita, rcCat, rcVar, rcRef, rcVer, rcFav, rcCusto, rcRegistrar, RC_RECEITAS, rcEncaixe, rcRestricao, rcItensDe, rcNutri });

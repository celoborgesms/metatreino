
// =====================================================================
// 18. CALISTENIA (Beta 12)
// Modalidade completa dentro do módulo de treino de força (state.modules.lift):
//   setup.modalidade = 'musculacao' | 'calistenia' | 'hibrido'
// Reaproveita o registro de séries, histórico, sequência, conquistas, desafios e gráficos.
// O que é próprio da calistenia: cadeias de progressão, posição do aluno em cada cadeia,
// domínio verificado antes de avançar, pré-requisitos das habilidades, equipamentos próprios.
// =====================================================================
const CALI_NIVEL = ['', 'Iniciante', 'Intermediário', 'Avançado', 'Especialista'];
const CALI_EQUIP_LBL = { barra:'barra fixa', paralelas:'paralelas', argolas:'argolas', elastico:'elástico', apoios:'apoios de flexão', banco:'banco/caixa', espaldar:'espaldar ou poste' };
// Cada item: [nome, nível 1-4, unidade r|t, equipamentos (precisa de UM deles; vazio = chão), grupo, faixa própria ('' = usa a do objetivo), músculos, execução[], erro comum, segurança]
// A ordem dentro da cadeia é a ordem de progressão (fácil → difícil).
const CALI_CADEIAS = [
 {id:'flexao', pad:'empurrar_h', area:'Superior', titulo:'Flexões', itens:[
  ['Flexão na parede',1,'r',[],'Peito','','Peitoral, tríceps e deltoide anterior',['Mãos na parede na altura do peito, corpo reto.','Aproxime o peito da parede dobrando os cotovelos a ~45°.','Empurre de volta sem perder o alinhamento.'],'Quadril para trás (corpo em “V”).',''],
  ['Flexão inclinada',1,'r',['banco'],'Peito','','Peitoral, tríceps e deltoide anterior',['Mãos num banco ou caixa firme, corpo em prancha.','Desça até o peito quase tocar a borda.','Empurre mantendo abdômen e glúteos contraídos.'],'Deixar o quadril cair.','Use uma superfície que não deslize.'],
  ['Flexão com joelhos',1,'r',[],'Peito','','Peitoral, tríceps e deltoide anterior',['Joelhos no chão, linha reta de joelho a cabeça.','Desça até o peito quase tocar o chão.','Empurre de volta com os cotovelos a ~45°.'],'Quadril dobrado, deixando o tronco fora da linha.',''],
  ['Flexão tradicional',2,'r',[],'Peito','','Peitoral, tríceps, deltoide anterior e core',['Mãos um pouco mais abertas que os ombros, corpo em linha reta.','Desça até o peito ficar a um palmo do chão.','Empurre o chão afastando as escápulas no final.'],'Cotovelos abertos a 90° e cabeça caindo.',''],
  ['Flexão declinada',2,'r',['banco'],'Peito','','Peitoral superior, deltoide anterior e tríceps',['Pés elevados num banco, mãos no chão.','Desça controlando até quase tocar o chão.','Empurre mantendo o corpo rígido.'],'Arquear a lombar.',''],
  ['Flexão diamante',2,'r',[],'Tríceps','','Tríceps, peitoral e deltoide anterior',['Mãos juntas formando um losango sob o peito.','Desça com os cotovelos próximos ao corpo.','Empurre até estender os braços.'],'Cotovelos abrindo para os lados.','Se o punho incomodar, afaste um pouco as mãos.'],
  ['Flexão arqueiro',3,'r',[],'Peito','3-8','Peitoral (unilateral), tríceps e core',['Mãos bem afastadas, um braço faz o trabalho e o outro fica quase estendido.','Desça em direção à mão que dobra.','Empurre e alterne o lado a cada série.'],'Girar o quadril.','Faixa de repetições por lado.'],
  ['Flexão unilateral assistida',3,'r',['banco'],'Peito','3-6','Peitoral, tríceps e estabilizadores do core',['Uma mão no chão e a outra apoiada num banco baixo.','Desça devagar com o corpo firme.','Empurre usando ao máximo o braço de baixo.'],'Corpo torcendo durante a descida.',''],
  ['Flexão unilateral',4,'r',[],'Peito','2-5','Peitoral, tríceps, ombro e core',['Pés afastados, uma mão sob o peito.','Desça devagar sem girar o tronco.','Empurre mantendo quadril alinhado.'],'Rotação do tronco.','Só depois de dominar a versão assistida.']]},
 {id:'triceps', pad:'dips', area:'Superior', titulo:'Tríceps no chão', alt:true, itens:[
  ['Flexão fechada',1,'r',[],'Tríceps','','Tríceps e peitoral',['Mãos na largura dos ombros, cotovelos colados ao corpo.','Desça controlando.','Empurre até estender.'],'Cotovelos abrindo.',''],
  ['Flexão diamante',2,'r',[],'Tríceps','','Tríceps, peitoral e deltoide anterior',['Mãos juntas formando um losango sob o peito.','Desça com os cotovelos próximos ao corpo.','Empurre até estender os braços.'],'Cotovelos abrindo para os lados.',''],
  ['Extensão de tríceps no chão',3,'r',[],'Tríceps','5-10','Tríceps (cabeça longa)',['Em prancha alta, mãos um pouco à frente da cabeça.','Dobre os cotovelos até os antebraços tocarem o chão.','Empurre o chão estendendo os cotovelos.'],'Deixar o quadril cair.','Comece com joelhos no chão se for pesado.']]},
 {id:'dips', pad:'dips', area:'Superior', titulo:'Paralelas (dips)', itens:[
  ['Mergulho no banco',1,'r',['banco'],'Tríceps','','Tríceps, peitoral inferior e deltoide anterior',['Mãos na borda do banco, pernas dobradas.','Desça até os cotovelos chegarem a ~90°.','Empurre até estender os braços.'],'Descer demais e forçar o ombro.','Pare se sentir pinçar na frente do ombro.'],
  ['Dips negativo nas paralelas',2,'r',['paralelas'],'Tríceps','3-5','Tríceps, peitoral inferior e ombros',['Suba com um pulo e trave os braços.','Desça bem devagar (4–5 s) até ~90° de cotovelo.','Volte a subir com ajuda dos pés.'],'Descer rápido demais.','Ombros longe das orelhas o tempo todo.'],
  ['Dips nas paralelas',2,'r',['paralelas'],'Tríceps','','Tríceps, peitoral inferior e ombros',['Braços estendidos, tronco levemente inclinado à frente.','Desça até os ombros ficarem na altura dos cotovelos.','Empurre até estender sem travar.'],'Ombros subindo em direção às orelhas.','Não desça além do confortável para o ombro.'],
  ['Dips nas argolas',3,'r',['argolas'],'Tríceps','4-10','Tríceps, peitoral, ombros e estabilizadores',['Argolas próximas ao corpo, braços travados.','Desça controlando a instabilidade das argolas.','Suba girando levemente as palmas para fora no topo.'],'Argolas abrindo para os lados.','Domine 10+ dips nas paralelas antes.']]},
 {id:'hspu', pad:'empurrar_v', area:'Superior', titulo:'Empurrar acima da cabeça', itens:[
  ['Pike push-up inclinado',1,'r',['banco'],'Ombro','','Deltoides e tríceps',['Mãos num banco, quadril alto formando um “V” invertido.','Desça a cabeça à frente das mãos.','Empurre de volta.'],'Transformar em flexão comum (quadril baixo).',''],
  ['Pike push-up',2,'r',[],'Ombro','','Deltoides, tríceps e trapézio',['Mãos no chão, quadril alto, pernas quase estendidas.','Desça a cabeça formando um triângulo com as mãos.','Empurre o chão até estender os braços.'],'Cotovelos abrindo demais.',''],
  ['Pike push-up com pés elevados',2,'r',['banco'],'Ombro','','Deltoides e tríceps (mais carga)',['Pés num banco, quadril acima dos ombros.','Desça a cabeça em direção ao chão.','Empurre mantendo o tronco o mais vertical possível.'],'Pescoço forçando para olhar à frente.',''],
  ['Handstand push-up negativo na parede',3,'r',[],'Ombro','3-5','Deltoides, tríceps e trapézio',['Em parada de mão de frente ou de costas para a parede.','Desça a cabeça devagar (3–5 s) até um apoio macio.','Desça as pernas e recomece.'],'Despencar no final.','Use uma almofada sob a cabeça; pré-requisito: parada na parede por 30 s.'],
  ['Handstand push-up na parede',3,'r',[],'Ombro','3-8','Deltoides, tríceps e trapézio',['Parada de mão com apoio na parede.','Desça até a cabeça tocar levemente o apoio.','Empurre até estender os braços.'],'Arquear demais a lombar.','Pré-requisito: 5 negativas controladas.'],
  ['Handstand push-up livre',4,'r',[],'Ombro','1-5','Ombros, tríceps e equilíbrio',['Parada de mão livre e estável.','Desça controlando o equilíbrio.','Empurre mantendo a linha do corpo.'],'Perder a linha do corpo na subida.','Só com parada livre consistente de 30 s+.']]},
 {id:'barra', pad:'puxar_v', area:'Superior', titulo:'Barra fixa', itens:[
  ['Pendurar na barra',1,'t',['barra','argolas'],'Costas','','Antebraços, dorsais e ombros',['Pegada firme na largura dos ombros.','Pendure com os braços estendidos e ombros ativos.','Respire controlado durante a sustentação.'],'Ombros “soltos” encostando nas orelhas.',''],
  ['Retração escapular na barra',1,'r',['barra','argolas'],'Costas','8-12','Trapézio médio/inferior e dorsais',['Pendurado, braços estendidos.','Puxe as escápulas para baixo e para trás sem dobrar os cotovelos.','Volte devagar.'],'Dobrar os cotovelos.',''],
  ['Barra negativa',2,'r',['barra','argolas'],'Costas','3-5','Dorsais, bíceps e romboides',['Suba com ajuda de um apoio até o queixo passar a barra.','Desça devagar (4–5 s) até estender os braços.','Repita com pausa curta.'],'Descer rápido.',''],
  ['Barra com elástico',2,'r',['elastico'],'Costas','','Dorsais e bíceps (com assistência)',['Prenda o elástico na barra e apoie um pé/joelho nele.','Puxe até o queixo passar a barra.','Desça controlando.'],'Usar o elástico para dar impulso.','Confira se o elástico está bem preso. Precisa de barra também.'],
  ['Chin-up (pegada supinada)',2,'r',['barra','argolas'],'Costas','','Dorsais e bíceps',['Palmas viradas para você, mãos na largura dos ombros.','Puxe até o queixo passar a barra.','Desça até estender os braços.'],'Balançar o corpo.',''],
  ['Barra fixa pronada',2,'r',['barra','argolas'],'Costas','','Dorsais, redondo maior, bíceps e romboides',['Palmas para a frente, um pouco mais abertas que os ombros.','Puxe levando os cotovelos para baixo.','Desça até estender os braços.'],'Meia repetição e balanço.',''],
  ['Barra arqueiro',3,'r',['barra','argolas'],'Costas','3-6','Dorsais (unilateral) e bíceps',['Pegada bem aberta.','Puxe em direção a uma das mãos, com o outro braço quase reto.','Alterne os lados.'],'Puxar com os dois braços igualmente.','Faixa por lado.'],
  ['Barra unilateral assistida',4,'r',['barra','argolas'],'Costas','2-5','Dorsais, bíceps e antebraço',['Uma mão na barra e a outra segurando o próprio punho ou uma toalha mais abaixo.','Puxe usando principalmente o braço da barra.','Desça controlando.'],'Girar o corpo.','Pré-requisito: 12+ barras e arqueiro consistente.']]},
 {id:'puxar_elastico', pad:'puxar_v', area:'Superior', titulo:'Puxar com elástico', alt:true, itens:[
  ['Puxada com elástico',1,'r',['elastico'],'Costas','','Dorsais e bíceps',['Prenda o elástico no alto (porta).','Puxe levando os cotovelos em direção às costelas.','Volte devagar.'],'Encolher os ombros.','Confira a fixação do elástico.']]},
 {id:'remada_elastico', pad:'puxar_h', area:'Superior', titulo:'Remada com elástico', alt:true, itens:[
  ['Remada com elástico',1,'r',['elastico'],'Costas','','Romboides, dorsais e bíceps',['Elástico preso na altura do peito.','Puxe aproximando as escápulas.','Volte devagar.'],'Puxar só com os braços.','']]},
 {id:'escapulas', pad:'puxar_v', area:'Superior', titulo:'Costas sem equipamento', alt:true, itens:[
  ['Elevação Y-T-W deitado',1,'r',[],'Costas','10-15','Trapézio médio/inferior e romboides',['Deitado de barriga para baixo, braços à frente.','Eleve os braços formando Y, depois T, depois W.','Segure 1 s em cada posição.'],'Usar impulso da lombar.','Sem barra ou elástico, o treino de puxar fica limitado: uma barra de porta faz muita diferença.']]},
 {id:'remada', pad:'puxar_h', area:'Superior', titulo:'Remada invertida', itens:[
  ['Remada invertida alta',1,'r',['argolas','paralelas','barra'],'Costas','','Dorsais, romboides e bíceps',['Barra/argolas na altura do peito, corpo bem inclinado.','Puxe o peito até a barra mantendo o corpo reto.','Desça controlando.'],'Quadril caindo.','Use uma barra baixa e firme.'],
  ['Australian pull-up (remada invertida)',2,'r',['argolas','paralelas','barra'],'Costas','','Dorsais, romboides, trapézio médio e bíceps',['Barra na altura da cintura, corpo reto sob ela.','Puxe o peito até a barra.','Desça até estender os braços.'],'Pescoço indo à frente.',''],
  ['Remada invertida com pés elevados',2,'r',['argolas','paralelas','barra'],'Costas','','Dorsais e romboides (mais carga)',['Pés num apoio, corpo horizontal.','Puxe o peito até a barra.','Desça devagar.'],'Perder a linha do quadril.',''],
  ['Remada arqueiro',3,'r',['argolas','barra'],'Costas','4-8','Dorsais (unilateral), romboides e bíceps',['Corpo sob a barra, pegada aberta.','Puxe em direção a uma mão, outro braço estendido.','Alterne os lados.'],'Girar o tronco.','Faixa por lado.']]},
 {id:'agacha', pad:'agachar', area:'Inferior', titulo:'Agachamento', itens:[
  ['Agachamento com apoio',1,'r',[],'Pernas','','Quadríceps e glúteos',['Segure um batente de porta ou encosto firme.','Desça o quadril para trás e para baixo.','Suba empurrando o chão.'],'Joelhos caindo para dentro.',''],
  ['Agachamento livre',1,'r',[],'Pernas','','Quadríceps, glúteos e adutores',['Pés na largura dos ombros.','Desça até as coxas ficarem paralelas ao chão ou abaixo.','Suba mantendo o peito aberto.'],'Calcanhar saindo do chão.',''],
  ['Agachamento pausado',2,'r',[],'Pernas','10-15','Quadríceps e glúteos',['Desça até o fundo do agachamento.','Segure 3 s embaixo.','Suba com força.'],'Relaxar no fundo.',''],
  ['Agachamento com salto',2,'r',[],'Pernas','8-12','Quadríceps, glúteos e panturrilhas (potência)',['Agache até a metade.','Salte o mais alto possível.','Aterrisse suave e emende a próxima.'],'Aterrissar com os joelhos travados.','Evite se tiver dor no joelho ou se marcou “evitar saltos”.']]},
 {id:'unilateral', pad:'agachar_uni', area:'Inferior', titulo:'Pernas unilateral', itens:[
  ['Afundo estático',1,'r',[],'Pernas','','Quadríceps e glúteos',['Um pé à frente e outro atrás, tronco reto.','Desça até o joelho de trás quase tocar o chão.','Suba sem mudar os pés de lugar.'],'Joelho da frente ultrapassando muito a ponta do pé.','Faixa por perna.'],
  ['Avanço alternado',1,'r',[],'Pernas','','Quadríceps, glúteos e estabilizadores',['Dê um passo largo à frente.','Desça até os dois joelhos ficarem a ~90°.','Volte e alterne.'],'Tronco inclinando demais.','Faixa por perna.'],
  ['Bulgarian split squat',2,'r',['banco'],'Pernas','','Quadríceps e glúteos',['Pé de trás apoiado num banco.','Desça até a coxa da frente ficar paralela.','Suba empurrando com a perna da frente.'],'Pé da frente muito perto do banco.','Faixa por perna.'],
  ['Agachamento unilateral no banco',2,'r',['banco'],'Pernas','5-10','Quadríceps, glúteos e equilíbrio',['De costas para um banco, uma perna estendida à frente.','Sente devagar no banco com uma perna só.','Levante sem impulso.'],'Despencar no banco.','Faixa por perna.'],
  ['Pistol squat assistido',3,'r',[],'Pernas','4-8','Quadríceps, glúteos e equilíbrio',['Segure um batente de porta.','Desça numa perna só até o fundo.','Suba usando o mínimo de ajuda dos braços.'],'Joelho caindo para dentro.','Faixa por perna.'],
  ['Pistol squat',3,'r',[],'Pernas','3-6','Quadríceps, glúteos e equilíbrio',['Uma perna estendida à frente, braços à frente.','Desça até o fundo controlando.','Suba sem tocar o outro pé no chão.'],'Arredondar a lombar no fundo.','Faixa por perna. Pare se o joelho doer.'],
  ['Shrimp squat',4,'r',[],'Pernas','3-6','Quadríceps e glúteos',['Segure o pé de trás com a mão.','Desça até o joelho de trás tocar o chão.','Suba sem soltar o pé.'],'Perder o equilíbrio para a frente.','Faixa por perna.']]},
 {id:'gluteo', pad:'gluteo', area:'Inferior', titulo:'Glúteos', itens:[
  ['Ponte de glúteos',1,'r',[],'Glúteos','12-20','Glúteo máximo e posteriores',['Deitado, joelhos dobrados, pés no chão.','Eleve o quadril contraindo os glúteos.','Segure 1 s e desça.'],'Arquear a lombar no topo.',''],
  ['Elevação pélvica unilateral',2,'r',[],'Glúteos','','Glúteos e posteriores (unilateral)',['Uma perna no chão e a outra estendida no ar.','Eleve o quadril sem girar.','Desça devagar.'],'Quadril caindo para um lado.','Faixa por perna.'],
  ['Elevação pélvica unilateral com ombros no banco',3,'r',['banco'],'Glúteos','','Glúteos (maior amplitude)',['Costas apoiadas no banco, uma perna no chão.','Eleve o quadril até alinhar com o tronco.','Desça controlando.'],'Empurrar com a lombar.','Faixa por perna.']]},
 {id:'nordic', pad:'posterior', area:'Inferior', titulo:'Posteriores (nordic)', itens:[
  ['Ponte de glúteos com pés afastados',1,'r',[],'Pernas','12-20','Posteriores de coxa e glúteos',['Calcanhares mais longe do quadril que na ponte comum.','Eleve o quadril empurrando com os calcanhares.','Desça devagar.'],'Cãibra por subir rápido: vá devagar.',''],
  ['Nordic curl negativo assistido',2,'r',[],'Pernas','3-6','Posteriores de coxa',['Ajoelhado, pés presos sob um sofá firme ou por um parceiro.','Incline o corpo à frente o mais devagar possível.','Use as mãos para amortecer e voltar.'],'Dobrar o quadril em vez de manter o corpo reto.','Prenda bem os pés; tenha algo macio para as mãos.'],
  ['Nordic curl negativo',3,'r',[],'Pernas','3-5','Posteriores de coxa',['Mesma posição, sem ajuda.','Desça em 4–5 s até o chão.','Volte com as mãos.'],'Descer rápido no final.',''],
  ['Nordic curl',4,'r',[],'Pernas','2-5','Posteriores de coxa (excêntrico e concêntrico)',['Desça devagar.','Volte à posição inicial usando os posteriores.','Mantenha quadril estendido.'],'Quebrar no quadril.','Volume baixo: gera muita dor muscular.']]},
 {id:'panturrilha', pad:'panturrilha', area:'Inferior', titulo:'Panturrilhas', itens:[
  ['Elevação de panturrilha',1,'r',[],'Panturrilha','15-25','Gastrocnêmio e sóleo',['De pé, apoio leve na parede.','Suba na ponta dos pés o mais alto possível.','Desça devagar.'],'Movimento curto e rápido.',''],
  ['Elevação de panturrilha unilateral',2,'r',[],'Panturrilha','10-20','Gastrocnêmio e sóleo',['Uma perna só, apoio na parede.','Suba ao máximo e segure 1 s.','Desça devagar.'],'Dobrar o joelho para ajudar.','Faixa por perna.'],
  ['Panturrilha unilateral no degrau com pausa',3,'r',[],'Panturrilha','8-15','Gastrocnêmio e sóleo (amplitude total)',['Ponta do pé num degrau, calcanhar livre.','Desça até alongar e pause 2 s.','Suba ao máximo.'],'Quicar embaixo.','Faixa por perna.']]},
 {id:'core_anti', pad:'core_anti', area:'Core', titulo:'Core anti-extensão', itens:[
  ['Prancha',1,'t',[],'Core','','Reto e transverso do abdômen',['Antebraços no chão, corpo reto.','Contraia abdômen e glúteos.','Respire sem perder a posição.'],'Quadril caindo.',''],
  ['Hollow body grupado',1,'t',[],'Core','','Reto do abdômen e flexores do quadril',['Deitado, lombar colada no chão.','Joelhos dobrados e braços à frente, ombros fora do chão.','Segure sem a lombar descolar.'],'Lombar saindo do chão.',''],
  ['Hollow body hold',2,'t',[],'Core','','Reto do abdômen e flexores do quadril',['Lombar colada no chão.','Pernas estendidas e braços acima da cabeça, perto do chão.','Segure formando uma “canoa”.'],'Prender a respiração.',''],
  ['Dragon flag negativo',3,'r',['banco'],'Core','3-6','Core inteiro e dorsais',['Deitado no banco segurando atrás da cabeça.','Eleve o corpo reto até a vertical.','Desça devagar sem dobrar o quadril.'],'Dobrar o quadril na descida.','Pré-requisito: hollow body de 45 s.'],
  ['Dragon flag',4,'r',['banco'],'Core','3-6','Core inteiro e dorsais',['Mesma posição.','Desça e suba com o corpo rígido.','Controle total.'],'Perder a linha no meio.','']]},
 {id:'core_lat', pad:'core_lat', area:'Core', titulo:'Core lateral', itens:[
  ['Prancha lateral com joelhos',1,'t',[],'Core','','Oblíquos e glúteo médio',['Deitado de lado, apoio no antebraço e nos joelhos.','Eleve o quadril em linha reta.','Segure e troque de lado.'],'Quadril caindo.','Tempo por lado.'],
  ['Prancha lateral',1,'t',[],'Core','','Oblíquos e glúteo médio',['Apoio no antebraço e na lateral do pé.','Corpo reto, quadril alto.','Segure e troque de lado.'],'Girar o tronco.','Tempo por lado.'],
  ['Prancha lateral com elevação de perna',2,'t',[],'Core','','Oblíquos, glúteo médio e abdutores',['Em prancha lateral.','Eleve a perna de cima e segure.','Troque de lado.'],'Quadril caindo.','Tempo por lado.']]},
 {id:'core_ext', pad:'core_ext', area:'Core', titulo:'Core posterior', itens:[
  ['Arch hold (superman)',1,'t',[],'Core','','Eretores da coluna, glúteos e trapézio',['Deitado de barriga para baixo.','Eleve braços e pernas, alongando o corpo.','Segure olhando para o chão.'],'Forçar o pescoço para cima.','']]},
 {id:'core_flex', pad:'core_flex', area:'Core', titulo:'Elevação de pernas', itens:[
  ['Elevação de pernas deitado',1,'r',[],'Core','','Reto do abdômen (inferior) e flexores do quadril',['Deitado, mãos ao lado do corpo.','Eleve as pernas até a vertical.','Desça devagar sem a lombar descolar.'],'Lombar arqueando.',''],
  ['Hanging knee raises',2,'r',['barra','argolas'],'Core','','Abdômen e flexores do quadril',['Pendurado na barra, ombros ativos.','Eleve os joelhos até o peito.','Desça sem balançar.'],'Balanço do corpo.',''],
  ['Hanging leg raises',3,'r',['barra','argolas'],'Core','6-12','Abdômen e flexores do quadril',['Pendurado, pernas estendidas.','Eleve as pernas até a altura do quadril ou mais.','Desça controlando.'],'Usar impulso.',''],
  ['Toes to bar',3,'r',['barra'],'Core','5-10','Abdômen, flexores do quadril e dorsais',['Pendurado.','Leve a ponta dos pés até a barra.','Desça controlando o balanço.'],'Kipping descontrolado.','']]},
 {id:'lsit', pad:'core_flex', area:'Core', titulo:'L-sit', itens:[
  ['L-sit grupado',2,'t',[],'Core','10-20s','Abdômen, flexores do quadril e tríceps',['Mãos no chão (ou apoios) ao lado do quadril.','Empurre o chão e tire o quadril, joelhos no peito.','Segure com os ombros baixos.'],'Ombros encolhidos.','Apoios de flexão ou paralelas facilitam.'],
  ['L-sit com uma perna estendida',3,'t',[],'Core','10-20s','Abdômen e flexores do quadril',['Igual ao grupado, uma perna estendida.','Alterne a perna a cada série.','Segure.'],'Perna estendida caindo.',''],
  ['L-sit',3,'t',[],'Core','10-20s','Abdômen, flexores do quadril, tríceps e ombros',['Pernas estendidas à frente na altura do quadril.','Ombros baixos, braços travados.','Segure.'],'Joelhos dobrando.',''],
  ['V-sit',4,'t',[],'Core','5-10s','Abdômen, flexores do quadril e ombros',['A partir do L-sit, eleve as pernas acima do quadril.','Empurre o chão forte.','Segure.'],'Perder a compressão.','Pré-requisito: L-sit de 20 s.']]},
 // ---- habilidades (aparecem só com pré-requisitos cumpridos) ----
 {id:'handstand', pad:'skill', area:'Habilidades', titulo:'Parada de mão', skill:true, req:[['hspu',1],['core_anti',1]], itens:[
  ['Pike hold (suporte em pike)',1,'t',[],'Ombro','15-30s','Ombros e core',['Mãos no chão, quadril alto, pés próximos às mãos.','Empurre o chão levando o peso para os ombros.','Segure.'],'Ombros fugindo para trás.',''],
  ['Caminhada na parede',2,'r',[],'Ombro','3-5','Ombros, tríceps e core',['De costas para a parede, em prancha.','Suba os pés pela parede enquanto aproxima as mãos.','Volte devagar.'],'Subir mais do que controla.','Espaço livre e chão sem obstáculos.'],
  ['Parada de mão de frente para a parede',2,'t',[],'Ombro','20-40s','Ombros, trapézio e core',['Barriga para a parede, mãos a um palmo dela.','Corpo reto, empurre o chão.','Segure e desça como na caminhada.'],'Arquear a lombar (formato “banana”).','Aprenda a sair girando para o lado antes.'],
  ['Parada de mão de costas para a parede',3,'t',[],'Ombro','20-40s','Ombros, trapézio e equilíbrio',['Chute para cima com as costas para a parede.','Afaste os calcanhares da parede por instantes.','Segure.'],'Encostar o corpo todo na parede.',''],
  ['Handstand livre',4,'t',[],'Ombro','10-30s','Ombros, punhos e equilíbrio',['Entre na parada sem parede.','Corrija com os dedos das mãos.','Segure o máximo com boa linha.'],'Olhar entre as mãos com o pescoço dobrado.','Treine com espaço livre e saída segura.']]},
 {id:'muscleup', pad:'skill', area:'Habilidades', titulo:'Muscle-up', skill:true, req:[['barra',6],['dips',2]], itens:[
  ['Barra explosiva (peito na barra)',3,'r',['barra','argolas'],'Costas','3-6','Dorsais, bíceps e potência',['Puxe o mais rápido possível.','Leve o peito até a barra.','Desça controlando.'],'Perder a forma para ganhar altura.','Pré-requisito: 8+ barras e 10+ dips.'],
  ['Muscle-up com elástico',3,'r',['elastico'],'Costas','3-5','Dorsais, peitoral, tríceps',['Elástico preso na barra, pés nele.','Puxe explosivo e passe o peito por cima.','Empurre até estender.'],'Passar um braço de cada vez com o corpo torto.',''],
  ['Muscle-up negativo',3,'r',['barra','argolas'],'Costas','3-5','Dorsais, peitoral e tríceps',['Comece em cima da barra com os braços estendidos.','Desça devagar passando pela transição.','Termine pendurado.'],'Despencar na transição.',''],
  ['Muscle-up',4,'r',['barra','argolas'],'Costas','1-5','Dorsais, peitoral, tríceps e ombros',['Puxada explosiva com leve balanço controlado.','Transição rápida com os punhos por cima.','Empurre até o topo.'],'Kipping exagerado.','']]},
 {id:'frontlever', pad:'skill', area:'Habilidades', titulo:'Front lever', skill:true, req:[['barra',5],['core_anti',2]], itens:[
  ['Tuck front lever',3,'t',['barra','argolas'],'Costas','8-15s','Dorsais, core e ombros',['Pendurado, braços estendidos.','Leve os joelhos ao peito e o tronco à horizontal.','Segure com as escápulas para baixo.'],'Braços dobrando.','Pré-requisito: 8+ barras e hollow sólido.'],
  ['Advanced tuck front lever',3,'t',['barra','argolas'],'Costas','8-15s','Dorsais, core e ombros',['Igual ao tuck, com as costas retas e quadril mais aberto.','Segure.','Desça controlando.'],'Quadril caindo.',''],
  ['Front lever com uma perna',4,'t',['barra','argolas'],'Costas','5-10s','Dorsais, core e ombros',['Uma perna estendida e outra grupada.','Corpo na horizontal.','Alterne as pernas.'],'Perder a horizontal.',''],
  ['Straddle front lever',4,'t',['barra','argolas'],'Costas','5-10s','Dorsais, core e ombros',['Pernas abertas e estendidas.','Corpo na horizontal.','Segure.'],'Joelhos dobrando.',''],
  ['Front lever',4,'t',['barra','argolas'],'Costas','3-10s','Dorsais, core, ombros e antebraços',['Corpo inteiro reto na horizontal.','Braços travados.','Segure.'],'Quadril abaixo da linha.','']]},
 {id:'backlever', pad:'skill', area:'Habilidades', titulo:'Back lever', skill:true, req:[['barra',4],['core_anti',2]], itens:[
  ['Skin the cat',3,'r',['barra','argolas'],'Costas','3-5','Ombros (mobilidade), dorsais e core',['Pendurado, leve as pernas por entre os braços.','Desça devagar até onde o ombro permite.','Volte pelo mesmo caminho.'],'Forçar além da mobilidade do ombro.','Vá devagar: alonga muito o ombro.'],
  ['Tuck back lever',3,'t',['barra','argolas'],'Costas','8-15s','Ombros, bíceps e core',['A partir do skin the cat, pare com o tronco horizontal e joelhos grupados.','Braços travados.','Segure.'],'Braços dobrando.',''],
  ['Advanced tuck back lever',4,'t',['barra','argolas'],'Costas','8-12s','Ombros, bíceps e core',['Costas retas, quadril mais aberto.','Segure.','Volte devagar.'],'Arredondar as costas.',''],
  ['Back lever',4,'t',['barra','argolas'],'Costas','3-10s','Ombros, bíceps, peitoral e core',['Corpo reto na horizontal, de barriga para baixo.','Braços travados.','Segure.'],'Quadril caindo.','']]},
 {id:'planche', pad:'skill', area:'Habilidades', titulo:'Planche', skill:true, req:[['flexao',3],['dips',2]], itens:[
  ['Planche lean',2,'t',[],'Ombro','15-30s','Deltoide anterior, peitoral e punhos',['Em prancha alta, dedos para os lados ou para trás.','Incline o corpo à frente das mãos.','Segure com os braços travados.'],'Dobrar os cotovelos.','Aqueça bem os punhos.'],
  ['Tuck planche',3,'t',['apoios','paralelas'],'Ombro','5-12s','Deltoides, peitoral, tríceps e core',['Mãos nos apoios, joelhos grupados.','Incline e tire os pés do chão.','Segure com braços travados.'],'Ombros fugindo para trás.','Pré-requisito: lean de 30 s e flexão arqueiro.'],
  ['Advanced tuck planche',4,'t',['apoios','paralelas'],'Ombro','5-10s','Deltoides, peitoral e core',['Costas retas e quadril mais aberto.','Segure.','Desça controlando.'],'Arredondar as costas.',''],
  ['Straddle planche',4,'t',['apoios','paralelas'],'Ombro','3-8s','Ombros, peitoral e core',['Pernas abertas e estendidas.','Corpo paralelo ao chão.','Segure.'],'Quadril caindo.','']]},
 {id:'flag', pad:'skill', area:'Habilidades', titulo:'Human flag', skill:true, req:[['barra',5],['core_lat',2]], itens:[
  ['Flag vertical (suporte lateral)',3,'t',['espaldar'],'Core','5-15s','Oblíquos, dorsais e ombros',['Mãos no poste, uma em cima e outra embaixo.','Empurre com a de baixo e puxe com a de cima.','Eleve o corpo na vertical.'],'Braço de baixo dobrando.','Poste bem fixo, sem quinas.'],
  ['Tuck human flag',4,'t',['espaldar'],'Core','5-10s','Oblíquos, dorsais e ombros',['Mesma pegada.','Corpo lateral com joelhos grupados.','Segure.'],'Quadril caindo.',''],
  ['Human flag',4,'t',['espaldar'],'Core','3-8s','Oblíquos, dorsais, ombros e core',['Corpo reto paralelo ao chão.','Braços travados.','Segure.'],'Perder a linha lateral.','']]}
];
// índices rápidos
let CALI_EX = {};      // id → {nome, nivel, unit, equip, grupo, faixa, mus, exec, erro, seg, cadeia, idx}
function caliIndexar(){
  CALI_EX = {};
  CALI_CADEIAS.forEach(c=>c.itens.forEach((it,i)=>{
    const id = slug(it[0]);
    const prev = CALI_EX[id];
    const obj = { id, nome:it[0], nivel:it[1], unit:it[2], equip:it[3], grupo:it[4], faixa:it[5], mus:it[6], exec:it[7], erro:it[8], seg:it[9]||'', cadeia:c.id, idx:i, area:c.area, pad:c.pad, skill:!!c.skill, outras: prev ? [...(prev.outras||[]), prev.cadeia] : [] };
    if(!prev) CALI_EX[id] = obj; else prev.outras = [...(prev.outras||[]), c.id];
  }));
}
caliIndexar();
function caliCadeia(id){ return CALI_CADEIAS.find(c=>c.id===id) || null; }
function ehCali(exId){ return !!CALI_EX[exId]; }
function modalidadeAtual(){ const st = state.modules.lift && state.modules.lift.setup; return (st && st.modalidade) || 'musculacao'; }
function temCali(){ const m = modalidadeAtual(); return m==='calistenia' || m==='hibrido'; }

// ---- equipamentos e limitações ----
function caliEquipOk(item, st){
  const req = item[3] || item.equip || [];
  if(!req.length) return true;
  const tenho = (st && st.caliEquip) || [];
  if(req.includes('elastico') && req.length===1) return tenho.includes('elastico') && (tenho.includes('barra') || tenho.includes('argolas') || /puxada|remada/i.test(item[0]||item.nome));
  return req.some(r=>tenho.includes(r));
}
const CALI_PAIN = { 'Ombro':['empurrar_v','dips','skill'], 'Punho/Cotovelo':['skill','empurrar_v'], 'Joelho':['agachar_uni','agachar'], 'Tornozelo':['agachar'], 'Lombar':['posterior'] };
function caliPadroesBloqueados(st){
  const b = new Set();
  ((state.user && state.user.pain) || []).forEach(d=>(CALI_PAIN[d]||[]).forEach(p=>b.add(p)));
  const lim = (st && st.caliLimites) || [];
  if(lim.includes('ombro')) ['skill'].forEach(p=>b.add(p));
  return b;
}
function caliItemPermitido(item, st){
  const lim = (st && st.caliLimites) || [];
  const nome = item[0];
  if(lim.includes('semimpacto') && /salto|explosiv/i.test(nome)) return false;
  if(lim.includes('punho') && /planche|handstand|parada de mão|pike hold/i.test(nome)) return false;
  if(lim.includes('joelho') && /pistol|shrimp|salto/i.test(nome)) return false;
  if(lim.includes('ombro') && /dips nas argolas|skin the cat|back lever|handstand push/i.test(nome)) return false;
  return true;
}
// posição atual do aluno numa cadeia (índice), respeitando equipamento e limitações
function caliPos(st, cid){
  const c = caliCadeia(cid); if(!c) return -1;
  st.caliPos = st.caliPos || {};
  let i = st.caliPos[cid];
  if(i==null) i = caliPosInicial(st, cid);
  i = Math.max(0, Math.min(c.itens.length-1, i));
  // se o item atual não é possível (equipamento/limitação), desce até um possível; se nenhum abaixo, sobe
  for(let k=i; k>=0; k--) if(caliEquipOk(c.itens[k], st) && caliItemPermitido(c.itens[k], st)) return k;
  for(let k=i+1; k<c.itens.length; k++) if(caliEquipOk(c.itens[k], st) && caliItemPermitido(c.itens[k], st) && c.itens[k][1] <= (st.caliNivelDecl||1)+1) return k;
  return -1;
}
// posição inicial: nível declarado (no máximo Avançado para começar) + teste rápido quando informado
function caliPosInicial(st, cid){
  const c = caliCadeia(cid); const nv = Math.min(3, st.caliNivelDecl || 1);
  const t = st.caliTeste || {};
  const idxNome = n=>c.itens.findIndex(x=>x[0]===n);
  if(cid==='flexao' && t.flexao!=null){ const f=t.flexao; return idxNome(f<1?'Flexão inclinada':f<5?'Flexão com joelhos':f<15?'Flexão tradicional':f<30?'Flexão declinada':'Flexão arqueiro'); }
  if(cid==='barra' && t.barra!=null){ const b=t.barra; return idxNome(b<1?'Barra negativa':b<4?'Chin-up (pegada supinada)':b<12?'Barra fixa pronada':'Barra arqueiro'); }
  if(cid==='dips' && t.dips!=null){ const d=t.dips; return idxNome(d<1?'Mergulho no banco':d<6?'Dips negativo nas paralelas':d<15?'Dips nas paralelas':'Dips nas argolas'); }
  if(cid==='core_anti' && t.prancha!=null){ const p=t.prancha; return idxNome(p<30?'Prancha':p<60?'Hollow body grupado':'Hollow body hold'); }
  // primeiro item do nível declarado (ou o último abaixo dele)
  let i = c.itens.findIndex(x=>x[1]>=nv);
  if(i<0) i = c.itens.length-1;
  if(c.itens[i][1] > nv) i = Math.max(0, i-1);
  return i;
}
// pré-requisitos das habilidades (posição mínima em outras cadeias)
function caliReqOk(st, cid){
  const c = caliCadeia(cid); if(!c || !c.req) return true;
  return c.req.every(([outra, min])=>{ const p = caliPos(st, outra); return p >= min; });
}
function caliReqTexto(cid){
  const c = caliCadeia(cid); if(!c || !c.req) return '';
  return c.req.map(([o,min])=>{ const oc = caliCadeia(o); return `${oc.itens[min][0]} (${oc.titulo.toLowerCase()})`; }).join(' + ');
}

// ---- prescrição (séries, faixa, descanso) ----
const CALI_PRESC = {
  forca:          {sets:[0,4,4,5,5], r:'3-6',   t:'15-25s', rest:'2-3min'},
  hipertrofia:    {sets:[0,3,4,4,4], r:'6-12',  t:'25-40s', rest:'90s'},
  resistencia:    {sets:[0,3,3,3,4], r:'12-20', t:'40-60s', rest:'45-60s'},
  condicionamento:{sets:[0,3,3,3,3], r:'10-15', t:'30-45s', rest:'30-45s'},
  habilidades:    {sets:[0,3,3,4,4], r:'5-8',   t:'20-30s', rest:'2min'}
};
function caliPrescrever(item, st, slotSkill){
  const g = st.caliGoal || 'hipertrofia';
  const P = CALI_PRESC[g] || CALI_PRESC.hipertrofia;
  const nv = Math.min(4, Math.max(1, st.caliNivelDecl || 1));
  let sets = P.sets[nv];
  let faixa = item[5] || (item[2]==='t' ? P.t : P.r);
  if(item[2]==='t' && !/s$/.test(faixa)) faixa += 's';
  let rest = P.rest;
  if(slotSkill){ sets = item[2]==='t' ? 5 : 4; rest = '2min'; }
  if(item[5] && /negativ|explosiv|unilateral|arqueiro|pistol|shrimp|nordic|muscle/i.test(item[0])) rest = g==='condicionamento' ? '60s' : '2min';
  const porLado = /por (lado|perna)/i.test(item[9]||'') ? ' por lado' : '';
  return { sets, reps: faixa + porLado, rest };
}

// ---- sessões ----
const CALI_SESSOES = {
  full:     {nome:'Corpo inteiro', slots:['skill','empurrar_h','puxar_v','agachar_uni','dips','puxar_h','posterior','core_anti','core_flex','gluteo','core_lat']},
  superior: {nome:'Superior', slots:['skill','puxar_v','empurrar_h','empurrar_v','puxar_h','dips','core_flex','core_lat']},
  inferior: {nome:'Inferior + core', slots:['agachar_uni','agachar','posterior','gluteo','panturrilha','core_anti','core_lat','core_ext']},
  empurrar: {nome:'Empurrar', slots:['skill_push','empurrar_v','empurrar_h','dips','core_anti','core_lat']},
  puxar:    {nome:'Puxar', slots:['skill_pull','puxar_v','puxar_h','core_flex','core_ext','core_lat']},
  pernas:   {nome:'Pernas', slots:['agachar_uni','agachar','posterior','gluteo','panturrilha','core_anti']},
  habilid:  {nome:'Habilidades + core', slots:['skill','skill','core_flex','core_anti','empurrar_h','puxar_h']}
};
const CALI_SPLITS = {
  3:{nome:'Full Body', s:['full','full','full']},
  4:{nome:'Upper/Lower', s:['superior','inferior','superior','inferior']},
  5:{nome:'Push/Pull/Legs + Upper/Lower', s:['empurrar','puxar','pernas','superior','inferior']},
  6:{nome:'Push/Pull/Legs ×2', s:['empurrar','puxar','pernas','empurrar','puxar','pernas']}
};
// Híbrido: musculação cuida de pernas e volume; calistenia de puxar, empurrar e habilidades
const HIB_SPLITS = {
  3:[{c:'superior'},{g:['Pernas','Glúteos','Panturrilha'],n:'Pernas + Glúteos'},{c:'full'}],
  4:[{c:'superior'},{g:['Pernas','Glúteos','Panturrilha'],n:'Pernas + Glúteos'},{g:['Peito','Costas','Ombro'],n:'Peito + Costas + Ombro'},{c:'habilid'}],
  5:[{c:'empurrar'},{c:'puxar'},{g:['Pernas','Glúteos','Panturrilha'],n:'Pernas + Glúteos'},{g:['Peito','Costas','Ombro'],n:'Peito + Costas + Ombro'},{c:'habilid'}],
  6:[{c:'empurrar'},{c:'puxar'},{g:['Pernas','Glúteos','Panturrilha'],n:'Pernas + Glúteos'},{g:['Peito','Tríceps'],n:'Peito + Tríceps'},{g:['Costas','Bíceps'],n:'Costas + Bíceps'},{c:'habilid'}]
};
const SKILL_ORDEM = { skill:['handstand','frontlever','planche','muscleup','backlever','flag'], skill_push:['handstand','planche'], skill_pull:['frontlever','muscleup','backlever'] };
function caliEscolherCadeia(pad, st, usados){
  const bloqueados = caliPadroesBloqueados(st);
  if(pad.startsWith('skill')){
    if(bloqueados.has('skill')) return null;
    const querSkill = st.caliGoal==='habilidades' || (st.caliNivelDecl||1) >= 3;
    if(!querSkill) return null;
    const pref = (st.caliSkills && st.caliSkills.length) ? st.caliSkills : SKILL_ORDEM[pad];
    for(const cid of pref){ if(usados.has(cid) || !SKILL_ORDEM[pad].includes(cid) && pad!=='skill') continue; if(caliReqOk(st, cid) && caliPos(st, cid) >= 0){ return cid; } }
    // nenhuma habilidade liberada: treina a preparação do handstand (sem pré-requisito de força alto)
    if(!usados.has('handstand') && caliPos(st,'handstand')>=0 && !bloqueados.has('empurrar_v')) return caliReqOk(st,'handstand') ? 'handstand' : null;
    return null;
  }
  if(bloqueados.has(pad)) return null;
  const cands = CALI_CADEIAS.filter(c=>c.pad===pad && !c.skill);
  const pref = st.caliPref && st.caliPref[pad];
  const ord = [...cands].sort((a,b)=>(a.id===pref?-1:0)-(b.id===pref?-1:0) || (a.alt?1:0)-(b.alt?1:0));
  for(const c of ord){ if(usados.has(c.id)) continue; if(caliPos(st, c.id) >= 0) return c.id; }
  return null;
}
function caliMontarSessao(tipo, st, opts){
  opts = opts || {};
  const S = CALI_SESSOES[tipo];
  const max = ({30:4, 45:5, 60:6, 75:7})[st.caliTempo||45] || 5;
  const usados = new Set(); const ex = []; const avisos = [];
  for(const pad of S.slots){
    if(ex.length >= max) break;
    const cid = caliEscolherCadeia(pad, st, usados);
    if(!cid) continue;
    usados.add(cid);
    if(cid==='escapulas') avisos.push('Sem barra, argolas ou elástico, o treino de puxar fica limitado: uma barra de porta faz muita diferença.');
    const c = caliCadeia(cid); const i = caliPos(st, cid); const it = c.itens[i];
    const pr = caliPrescrever(it, st, pad.startsWith('skill'));
    let sets = pr.sets;
    if(opts.reduzir) sets = Math.max(2, sets-1);
    ex.push({ id:slug(it[0]), name:it[0], sub:`${c.titulo} · ${CALI_NIVEL[it[1]]}`, sets, reps:pr.reps, rest:pr.rest, part:it[4], equip:it[3], unit: it[2]==='t'?'tempo':'reps', cali:true, cadeia:cid, nivel:it[1] });
  }
  // respeita o tempo disponível: tira os últimos exercícios (os menos prioritários) e, se preciso, uma série de cada
  const limite = (st.caliTempo||45) + 5;
  const fam = e=>{ const c = caliCadeia(e.cadeia); const p = c ? c.pad : ''; return /^empurrar|^dips/.test(p)?'push':/^puxar/.test(p)?'pull':/agachar|posterior|gluteo|panturrilha/.test(p)?'legs':/^core/.test(p)?'core':'skill'; };
  const essencial = ()=>{ const vist = new Set(), idx = new Set(); ex.forEach((e,i)=>{ const f = fam(e); if(['push','pull','legs'].includes(f) && !vist.has(f)){ vist.add(f); idx.add(i); } if(f==='skill' && st.caliGoal==='habilidades' && !vist.has('skill')){ vist.add('skill'); idx.add(i); } }); return idx; };
  while(ex.length > 3 && caliDuracao(ex) > limite){
    const ess = essencial(); let k = -1;
    for(let i=ex.length-1;i>=0;i--) if(!ess.has(i)){ k = i; break; }
    if(k<0) break; ex.splice(k,1);
  }
  if(caliDuracao(ex) > limite) ex.forEach(e=>{ if(!/skill/.test(e.cadeia) && e.sets>3) e.sets--; });
  return { ex, avisos:[...new Set(avisos)] };
}
function caliDuracao(exs){
  const seg = exs.reduce((s,e)=>{ const rest = /3min/.test(e.rest)?150:/2min/.test(e.rest)?120:/90/.test(e.rest)?90:/60/.test(e.rest)?55:40; const work = e.unit==='tempo' ? (parseInt(String(e.reps).split('-')[1])||30) : 40; return s + (e.sets||3)*(rest+work); }, 0);
  return Math.max(20, Math.min(90, Math.round(seg/60 + 8)));
}
function caliGerarWorkouts(st, wkDays){
  const dayNames = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const d = Math.max(3, Math.min(6, st.days||3));
  const letras = 'ABCDEF';
  const mk = (tipo, i, extra)=>{
    // full body em dias seguidos: o segundo dia vem com uma série a menos (recuperação)
    const prevDay = wkDays[i-1], dia = wkDays[i];
    const reduzir = tipo==='full' && i>0 && dia-prevDay===1;
    const r = caliMontarSessao(tipo, st, {reduzir});
    const parts = [...new Set(r.ex.map(e=>e.part))];
    return Object.assign({ k:letras[i], name:'Calistenia · '+CALI_SESSOES[tipo].nome, parts, originalParts:[...parts], cali:true, caliTipo:tipo,
      dayIdx:dia, dayName:dayNames[dia-1], exercises:r.ex, duration:caliDuracao(r.ex), caliAvisos:r.avisos.concat(reduzir?['Dia seguido de outro corpo inteiro: uma série a menos em cada exercício.']:[]) }, extra||{});
  };
  if(st.modalidade==='hibrido'){
    return HIB_SPLITS[d].map((x,i)=>{
      if(x.c) return mk(x.c, i);
      const exercises = buildLiftExercises(x.g, st);
      return { k:letras[i], name:x.n, parts:x.g, dayIdx:wkDays[i], dayName:dayNames[wkDays[i]-1], duration:estimateLiftDuration(exercises, st.goal), exercises };
    });
  }
  const modelo = caliModeloAdmin(st, d);
  const tipos = modelo ? modelo.sessoes : CALI_SPLITS[d].s;
  return tipos.map((t,i)=>{
    if(typeof t === 'string') return mk(t, i);
    // modelo do administrador: lista própria de padrões
    CALI_SESSOES['adm_'+i] = { nome:t.nome||('Sessão '+(i+1)), slots:t.slots||[] };
    return mk('adm_'+i, i);
  });
}
function caliRegenWorkout(w, st){
  if(!w || !w.cali) return;
  if(w.caliTipo && w.caliTipo.startsWith('adm_') && !CALI_SESSOES[w.caliTipo]) w.caliTipo = 'full';
  const a = (typeof adaptMode==='function') ? adaptMode() : {};
  const r = caliMontarSessao(w.caliTipo || 'full', st, {reduzir: a.tpm || a.cramp || a.leve || (a.pain && a.pain.length)});
  w.exercises = r.ex; w.caliAvisos = r.avisos;
  w.parts = [...new Set(r.ex.map(e=>e.part))];
  w.duration = caliDuracao(r.ex);
}
function caliRegenTudo(){
  const mod = state.modules.lift; if(!mod || !mod.plan || !mod.setup) return;
  (mod.plan.workouts||[]).forEach(w=>{ if(w.cali) caliRegenWorkout(w, mod.setup); });
}

// ---- integração com o gerador e as rotinas existentes ----
const _generatePlanCali = generatePlan;
window.generatePlan = function(module, setup){
  if(module==='lift' && setup && window.__caliExtra){ Object.assign(setup, window.__caliExtra); window.__caliExtra = null; }
  if(module==='lift' && setup && (setup.modalidade==='calistenia' || setup.modalidade==='hibrido')){
    const days = Math.max(3, Math.min(6, setup.days||3));
    const wkDays = (setup.selectedDays && setup.selectedDays.length===days) ? setup.selectedDays : ({3:[1,3,5],4:[1,2,4,5],5:[1,2,3,5,6],6:[1,2,3,4,5,6]}[days]);
    return { type:'lift', goal:setup.goal, workouts: caliGerarWorkouts(setup, wkDays), totalWeeks:12, bloco:0, modalidade:setup.modalidade };
  }
  return _generatePlanCali.apply(this, arguments);
};
// rotinas da musculação (troca semanal, bloco, dor) não podem reescrever os treinos de calistenia
function _semCali(fn){
  return function(){
    const mod = state.modules.lift;
    if(!mod || !mod.plan || !(mod.plan.workouts||[]).some(w=>w.cali)) return fn.apply(this, arguments);
    const todos = mod.plan.workouts;
    mod.plan.workouts = todos.filter(w=>!w.cali);
    let r;
    try{ r = fn.apply(this, arguments); }
    finally{ mod.plan.workouts = todos; }
    caliRegenTudo();
    return r;
  };
}
window.regenLiftExercises = _semCali(regenLiftExercises);
window.variarLiftExercises = _semCali(variarLiftExercises);
const _restoreWorkoutCali = restoreWorkout;
window.restoreWorkout = function(k){
  const mod = state.modules.lift; const w = mod && mod.plan && (mod.plan.workouts||[]).find(x=>x.k===k);
  if(w && w.cali){ caliRegenWorkout(w, mod.setup); saveData(); renderSessions(); toast('Treino recalculado com suas progressões atuais.'); return; }
  return _restoreWorkoutCali.apply(this, arguments);
};
// "Trocar" num exercício de calistenia = progressão, regressão ou outra cadeia do mesmo padrão
const _openSwapCali = openSwapExercise;
window.openSwapExercise = function(exId){
  const mod = state.modules.lift; const w = mod && mod.plan && (mod.plan.workouts||[]).find(x=>(x.exercises||[]).some(e=>e.id===exId));
  const e = w && w.exercises.find(x=>x.id===exId);
  if(!(w && w.cali && e && e.cadeia)) return _openSwapCali.apply(this, arguments);
  caliAbrirTroca(e.cadeia);
};
function caliAbrirTroca(cid){
  const st = state.modules.lift.setup; const c = caliCadeia(cid); const i = caliPos(st, cid);
  const linha = (it, k)=>{ const ok = caliEquipOk(it, st) && caliItemPermitido(it, st); const atual = k===i;
    return `<div class="cl-step ${atual?'on':''} ${ok?'':'off'}"><span class="cl-nv n${it[1]}">${CALI_NIVEL[it[1]]}</span><div style="flex:1;min-width:0"><b>${mtEsc(it[0])}</b>${ok?'':`<small>precisa de: ${(it[3]||[]).map(x=>CALI_EQUIP_LBL[x]).join(' ou ')}</small>`}</div>${atual?'<span class="pill on">atual</span>':(ok && k<i?`<button class="btn btn-ghost" onclick="caliDefinirPos('${cid}',${k},true)">Voltar</button>`:'')}</div>`; };
  const prox = c.itens.slice(i+1).findIndex(it=>caliEquipOk(it,st) && caliItemPermitido(it,st));
  const proxIdx = prox<0 ? -1 : i+1+prox;
  const dom = caliDominio(slug(c.itens[i][0]));
  const outras = CALI_CADEIAS.filter(x=>x.pad===c.pad && x.id!==cid && !x.skill && caliPos(st, x.id)>=0);
  $('modal-inner').innerHTML = `<h3>${mtEsc(c.titulo)}</h3>
    <p class="mt-muted" style="margin:0 0 10px">Na calistenia, “trocar” é subir ou descer na progressão. Avançar só é liberado quando você domina a variação atual (2 sessões seguidas no topo da faixa, com execução limpa).</p>
    <div class="cl-steps">${c.itens.map(linha).join('')}</div>
    ${proxIdx>=0 ? (dom.ok ? `<button class="btn btn-primary btn-block" style="margin-top:12px" onclick="caliDefinirPos('${cid}',${proxIdx})">Avançar para ${mtEsc(c.itens[proxIdx][0])}</button>`
      : `<div class="note" style="margin-top:12px"><div class="note-line">${mtEsc(dom.motivo)}</div></div>`) : ''}
    ${outras.length?`<div class="mt-sec">Outra opção para o mesmo movimento</div>${outras.map(o=>`<div class="list-row" onclick="caliPreferir('${c.pad}','${o.id}')">${mtEsc(o.titulo)}<span style="margin-left:auto;color:var(--text-mute);font-size:12px">${mtEsc(o.itens[caliPos(st,o.id)][0])} ›</span></div>`).join('')}`:''}
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function caliPreferir(pad, cid){ const st = state.modules.lift.setup; st.caliPref = st.caliPref || {}; st.caliPref[pad] = cid; caliRegenTudo(); saveData(); closeModal(); renderSessions(); toast('Treinos atualizados.'); }

// ---- domínio e progressão (nada sobe sozinho sem domínio verificado) ----
function caliSessoesEx(exId){ return ((state.progress||{})[exId]||[]).filter(p=>p.sets && p.sets.length).sort((a,b)=>a.date-b.date); }
function caliDominio(exId){
  const sess = caliSessoesEx(exId);
  const plano = (state.modules.lift?.plan?.workouts||[]).flatMap(w=>w.exercises||[]).find(e=>e.id===exId);
  const range = (typeof repRangeFor==='function') ? repRangeFor(exId) : {lo:8, hi:12};
  const setsAlvo = plano ? (+plano.sets||3) : 3;
  const precisa = (state.config_cali && state.config_cali.sessoesDominio) || caliConfig.sessoesDominio || 2;
  if(sess.length < precisa) return { ok:false, motivo:`Registre esta variação em pelo menos ${precisa} sessões para o app avaliar o domínio.` };
  const ult = sess.slice(-precisa);
  const topo = s => s.sets.length >= setsAlvo && s.sets.every(x=>(+x.reps||0) >= range.hi);
  if(ult.some(s=>s.qual==='ajuste')) return { ok:false, motivo:'Você marcou a execução como “com ajustes” recentemente. Domine a técnica antes de avançar.' };
  if(!ult.every(topo)) return { ok:false, motivo:`Para avançar: ${setsAlvo} séries no topo da faixa (${range.hi}${plano && plano.unit==='tempo'?' s':' repetições'}) em ${precisa} sessões seguidas.` };
  return { ok:true, motivo:'Domínio confirmado.' };
}
function caliDificuldade(exId){
  const sess = caliSessoesEx(exId).slice(-2);
  if(sess.length < 2) return false;
  const range = repRangeFor(exId);
  return sess.every(s=>s.sets.filter(x=>(+x.reps||0) < range.lo).length >= Math.ceil(s.sets.length/2) || s.qual==='ajuste');
}
function caliDefinirPos(cid, idx, regressao){
  const mod = state.modules.lift; const st = mod.setup; const c = caliCadeia(cid);
  const de = caliPos(st, cid);
  if(!regressao && idx > de){
    const dom = caliDominio(slug(c.itens[de][0]));
    if(!dom.ok){ toast(dom.motivo); return; }
    // nunca pula etapas: vai para a PRÓXIMA variação possível com o equipamento do aluno
    const k = c.itens.slice(de+1).findIndex(it=>caliEquipOk(it,st) && caliItemPermitido(it,st));
    if(k<0){ toast('Não há próxima variação disponível com seus equipamentos.'); return; }
    idx = de+1+k;
  }
  st.caliPos = st.caliPos || {}; st.caliPos[cid] = idx;
  st.caliHist = st.caliHist || []; st.caliHist.push({ c:cid, de, para:idx, at:Date.now() }); st.caliHist = st.caliHist.slice(-200);
  caliRegenTudo(); saveData(); closeModal();
  toast(regressao ? `Ajustado para ${c.itens[idx][0]}. Volte a subir quando estiver sólido.` : `🎉 Progressão: ${c.itens[idx][0]}`);
  if(state.ui.tab==='sessions') renderSessions(); else if(state.ui.tab==='home') renderHome();
}
// dica no registro de séries + campo de qualidade da execução
const _hintCali = smartProgressionHint;
window.smartProgressionHint = function(exId){
  if(!ehCali(exId) || !state.modules.lift || !state.modules.lift.setup) return _hintCali.apply(this, arguments);
  const st = state.modules.lift.setup; const it0 = CALI_EX[exId];
  const noPlano = (state.modules.lift.plan && state.modules.lift.plan.workouts || []).flatMap(w=>w.exercises||[]).find(e=>e.id===exId && e.cadeia);
  const cid = noPlano ? noPlano.cadeia : it0.cadeia;
  const c = caliCadeia(cid); const i = caliPos(st, cid);
  const it = { nome: it0.nome, cadeia: cid };
  const dom = caliDominio(exId);
  const proxI = c.itens.slice(i+1).findIndex(x=>caliEquipOk(x,st) && caliItemPermitido(x,st));
  const prox = proxI<0 ? null : c.itens[i+1+proxI];
  if(dom.ok && prox) return { cls:'card-ok', txt:`📈 Domínio confirmado em <b>${mtEsc(it.nome)}</b>. Próxima variação: <b>${mtEsc(prox[0])}</b>. <button class="btn btn-primary" style="padding:6px 12px;font-size:12px;margin-top:6px" onclick="closeSetLog(true);setTimeout(()=>caliAbrirTroca('${it.cadeia}'),120)">Ver progressão</button>` };
  if(caliDificuldade(exId) && i>0) return { cls:'card-warn', txt:`⚖️ Nas 2 últimas sessões a maioria das séries ficou abaixo da faixa (ou com ajustes). Vale voltar para <b>${mtEsc(c.itens[i-1][0])}</b> e consolidar. <button class="btn btn-ghost" style="padding:6px 12px;font-size:12px;margin-top:6px" onclick="closeSetLog(true);setTimeout(()=>caliAbrirTroca('${it.cadeia}'),120)">Ajustar</button>` };
  const base = _hintCali.apply(this, arguments);
  return { cls: base.cls, txt: base.txt.replace(/uma variação mais (difícil|avançada)/,'avançar de variação quando o app confirmar o domínio') };
};
const _renderSetLogCali = renderSetLogModal;
window.renderSetLogModal = function(){
  _renderSetLogCali.apply(this, arguments);
  try{
    const { exId, entry } = curLog; if(!ehCali(exId)) return;
    const box = document.createElement('div'); box.className = 'cl-qual';
    const q = entry.qual || '';
    box.innerHTML = `<div class="mt-muted" style="font-size:12px;margin-bottom:6px">Como foi a execução hoje?</div><div class="mod-toggle" style="margin:0"><button class="seg ${q==='limpa'?'on':''}" onclick="caliQual('limpa')">Limpa, amplitude completa</button><button class="seg ${q==='ajuste'?'on':''}" onclick="caliQual('ajuste')">Com ajustes</button></div>`;
    const ref = [...document.querySelectorAll('#modal-inner .btn-block')].find(b=>/Nova série/.test(b.textContent));
    if(ref) ref.before(box);
  }catch(e){}
};
function caliQual(v){ if(!curLog) return; curLog.entry.qual = v; saveData(); renderSetLogModal(); }
// nome e "carga opcional" dos exercícios de calistenia
const _nomeDoExCali = nomeDoEx;
window.nomeDoEx = function(id){ return CALI_EX[id] ? CALI_EX[id].nome : _nomeDoExCali(id); };
const _cargaOpcCali = exCargaOpcional;
window.exCargaOpcional = function(id){ return CALI_EX[id] ? true : _cargaOpcCali(id); };

// ---- configuração (tela de montagem) ----
function caliMostrarSetup(){
  const m = readOpt('lift-modalidade') || 'musculacao';
  const box = $('cali-setup'); if(box) box.style.display = (m==='musculacao') ? 'none' : '';
  document.querySelectorAll('#scr-setup-lift .gym-only').forEach(el=>{
    const ehEquip = !!el.querySelector('#lift-equip'), ehNivel = !!el.querySelector('#lift-level');
    el.style.display = (m==='calistenia') ? 'none' : (m==='hibrido' ? ((ehEquip||ehNivel||true) ? '' : 'none') : '');
  });
  try{ const bn = document.querySelector('#scr-setup-lift .brand-name'); if(bn) bn.textContent = ({musculacao:'MUSCULAÇÃO', calistenia:'CALISTENIA', hibrido:'HÍBRIDO'})[m]; }catch(e){}
  const h = $('lift-modal-hint');
  if(h) h.textContent = m==='calistenia' ? 'Peso do corpo como base: progressões por variação, isometrias e habilidades.' : m==='hibrido' ? 'Musculação para pernas e volume; calistenia para puxar, empurrar e habilidades.' : 'Academia, halteres ou peso do corpo, com progressão de carga.';
}
function caliLerSetup(){
  const m = readOpt('lift-modalidade') || 'musculacao';
  if(m==='musculacao') return { modalidade:'musculacao' };
  const multi = id=>[...document.querySelectorAll('#'+id+' .opt-multi.on')].map(o=>o.dataset.val);
  const num = id=>{ const v = ($(id)||{}).value; return v===''||v==null ? null : Math.max(0, parseInt(v,10)||0); };
  const cg = readOpt('cali-goal') || 'hipertrofia';
  const goalGym = {forca:'forca', hipertrofia:'hipertrofia', resistencia:'resistencia', condicionamento:'emagrecimento', habilidades:'forca'}[cg];
  const nv = parseInt(readOpt('cali-nivel')||'1',10);
  const ex = { modalidade:m, caliGoal:cg, caliTempo:parseInt(readOpt('cali-tempo')||'45',10), caliNivelDecl:nv, caliEquip:multi('cali-equip'), caliLimites:multi('cali-limites'),
    caliTeste:{ flexao:num('ct-flexao'), barra:num('ct-barra'), dips:num('ct-dips'), prancha:num('ct-prancha') } };
  if(m==='calistenia'){ ex.goal = goalGym; ex.level = ['','iniciante','intermediario','avancado','avancado'][nv]; ex.equip = 'casa'; }
  // recriar: mantém posições e histórico de progressão já conquistados
  const prev = state.modules.lift && state.modules.lift.setup;
  if(prev && prev.caliPos){ ex.caliPos = prev.caliPos; ex.caliHist = prev.caliHist; ex.caliPref = prev.caliPref; }
  return ex;
}
const _finishSetupCali = finishSetup;
window.finishSetup = function(m){
  if(m==='lift'){ try{ window.__caliExtra = caliLerSetup(); }catch(e){ window.__caliExtra = null; } }
  return _finishSetupCali.apply(this, arguments);
};
const _buildingStepsCali = buildingSteps;
window.buildingSteps = function(m, setup, prev){
  if(m!=='lift' || !setup || !(setup.modalidade==='calistenia' || setup.modalidade==='hibrido')) return _buildingStepsCali.apply(this, arguments);
  const eq = (setup.caliEquip||[]).map(x=>CALI_EQUIP_LBL[x]);
  const d = Math.max(3, Math.min(6, setup.days||3));
  const steps = [
    {pri:1, txt:`Modalidade: <b>${setup.modalidade==='hibrido'?'Híbrido (musculação + calistenia)':'Calistenia'}</b>`},
    {pri:1, txt:`Objetivo: <b>${({forca:'Força',hipertrofia:'Hipertrofia',resistencia:'Resistência',condicionamento:'Condicionamento',habilidades:'Domínio de habilidades'})[setup.caliGoal]}</b> · ${setup.caliTempo} min por sessão`},
    {pri:2, txt:`Equipamentos: <b>${eq.length?eq.join(', '):'só o peso do corpo'}</b>`},
    {pri:1, txt:`Divisão: <b>${setup.modalidade==='hibrido'?d+' dias, alternando academia e calistenia':CALI_SPLITS[d].nome}</b>`},
    {pri:2, txt:`Ajustando cada movimento ao seu nível${setup.caliTeste && Object.values(setup.caliTeste).some(v=>v!=null)?' e ao seu <b>teste rápido</b>':''}`}
  ];
  if((setup.caliLimites||[]).length) steps.push({pri:1, txt:`Respeitando suas limitações: <b>${setup.caliLimites.map(x=>({semimpacto:'sem saltos',punho:'punhos',ombro:'ombros',joelho:'joelhos'})[x]).join(', ')}</b>`});
  if(prev) steps.push({pri:1, txt:`Preservando seu <b>histórico</b> e suas <b>progressões</b>`});
  steps.push({pri:1, txt:`<b>Seu plano de ${setup.modalidade==='hibrido'?'treino híbrido':'calistenia'} está pronto!</b>`});
  return steps;
};
const _openSetupCali = openSetupScreen;
window.openSetupScreen = function(m){
  const r = _openSetupCali.apply(this, arguments);
  if(m==='lift'){
    try{
      const st = state.modules.lift && state.modules.lift.setup;
      const setOn = (gid,val)=>{ const g=$(gid); if(!g||val==null) return; const t=g.querySelector(`.opt[data-val="${val}"]`); if(!t) return; g.querySelectorAll('.opt:not(.opt-multi)').forEach(o=>o.classList.remove('on')); t.classList.add('on'); };
      const pre = window.__caliPreMod || (st && st.modalidade) || 'musculacao'; window.__caliPreMod = null;
      setOn('lift-modalidade', pre);
      if(st && st.caliGoal){ setOn('cali-goal', st.caliGoal); setOn('cali-tempo', st.caliTempo); setOn('cali-nivel', st.caliNivelDecl);
        ['cali-equip','cali-limites'].forEach(id=>{ const lista = id==='cali-equip'?(st.caliEquip||[]):(st.caliLimites||[]); document.querySelectorAll('#'+id+' .opt-multi').forEach(o=>o.classList.toggle('on', lista.includes(o.dataset.val))); }); }
      document.querySelectorAll('#lift-modalidade .opt').forEach(o=>o.addEventListener('click', ()=>setTimeout(caliMostrarSetup, 0)));
      // equipamentos e limitações: seleção livre (o binding padrão da tela limita pelos dias da semana)
      document.querySelectorAll('#cali-equip .opt-multi, #cali-limites .opt-multi').forEach(o=>{ o.onclick = ()=>o.classList.toggle('on'); });
      caliMostrarSetup();
    }catch(e){ console.log('setup cali', e); }
  }
  return r;
};
// trocar de modalidade a qualquer momento (o histórico fica)
function openModalidade(){
  const m = modalidadeAtual();
  const op = (k, t, d)=>`<div class="ap-pack ${k===m?'on':''}" onclick="closeModal();window.__caliPreMod='${k}';openSetupScreen('lift')"><div style="flex:1"><b style="font-size:14px">${t}</b>${k===m?' <span style="color:var(--primary-2)">✓ atual</span>':''}<div style="font-size:12px;color:var(--text-mute);margin-top:2px">${d}</div></div></div>`;
  $('modal-inner').innerHTML = `<h3>Modalidade de treino</h3><p class="mt-muted" style="margin:0 0 10px">Ao trocar, o plano é refeito. Histórico, recordes, conquistas e progressões continuam salvos.</p>
    ${op('musculacao','Musculação tradicional','Academia, halteres ou casa, com progressão de carga.')}
    ${op('calistenia','Calistenia','Peso do corpo, progressões por variação e habilidades.')}
    ${op('hibrido','Híbrido','Academia para pernas e volume, calistenia para puxar, empurrar e habilidades.')}
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`;
  $('modal-back').classList.add('on');
}

// ---- nível real (pelas progressões registradas, não pelo cadastro) ----
function caliNivelReal(){
  const st = state.modules.lift && state.modules.lift.setup; if(!st) return null;
  const base = ['flexao','barra','dips','unilateral','core_anti','hspu'];
  const niveis = base.map(cid=>{ const i = caliPos(st, cid); return i>=0 ? caliCadeia(cid).itens[i][1] : null; }).filter(Boolean).sort((a,b)=>a-b);
  if(!niveis.length) return null;
  let nv = niveis[Math.floor(niveis.length/2)];
  const skillsAv = ['frontlever','planche','backlever','flag','muscleup','handstand'].filter(cid=>caliReqOk(st,cid) && caliPos(st,cid)>=0 && caliCadeia(cid).itens[caliPos(st,cid)][1]===4).length;
  if(nv>=3 && skillsAv>=2) nv = 4; else nv = Math.min(nv, 3);
  // só conta como "real" o que tem registro: sem séries registradas, mostra o nível de partida
  const registrou = Object.keys(state.progress||{}).some(id=>ehCali(id) && caliSessoesEx(id).length);
  return { nivel:nv, nome:CALI_NIVEL[nv], medido: registrou };
}
function caliResumoHabilidades(){
  const st = state.modules.lift.setup;
  return CALI_CADEIAS.filter(c=>c.skill).map(c=>{ const i = caliPos(st, c.id); const lib = caliReqOk(st, c.id) && i>=0; return { c, i, lib, total:c.itens.length, atual: i>=0 ? c.itens[i][0] : null }; });
}

// ---- Home, Progresso e textos da modalidade ----
const _renderModToggleCali = renderModToggle;
window.renderModToggle = function(){
  _renderModToggleCali.apply(this, arguments);
  try{ const m = modalidadeAtual(); if(m==='musculacao') return; const b = [...document.querySelectorAll('#mod-toggle .seg')].find(x=>/Muscula/.test(x.textContent)); if(b) b.innerHTML = b.innerHTML.replace('Musculação', m==='calistenia'?'Calistenia':'Híbrido'); }catch(e){}
};
function renderHomeCali(){
  const wrap = document.querySelector('#scr-home .wrap'); if(!wrap) return;
  let el = $('home-cali');
  if(!temCali() || !state.modules.lift || state.active!=='lift'){ if(el) el.remove(); return; }
  if(!el){ el = document.createElement('div'); el.id = 'home-cali'; el.className = 'card'; wrap.appendChild(el); }
  const nr = caliNivelReal();
  const hs = caliResumoHabilidades();
  const lib = hs.filter(h=>h.lib);
  const prox = hs.filter(h=>!h.lib).slice(0,2);
  el.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><div class="card-title" style="margin:0">Calistenia</div>${nr?`<span class="pill on">${nr.nome}${nr.medido?'':' (inicial)'}</span>`:''}</div>
    ${lib.length ? `<div class="cl-skills">${lib.map(h=>`<div class="cl-sk" onclick="caliAbrirTroca('${h.c.id}')"><div class="cl-sk-t">${mtEsc(h.c.titulo)}</div><div class="cl-dots">${h.c.itens.map((_,k)=>`<i class="${k<h.i?'ok':k===h.i?'now':''}"></i>`).join('')}</div><small>${mtEsc(h.atual)}</small></div>`).join('')}</div>`
      : `<div class="mt-muted" style="margin-top:6px">Nenhuma habilidade liberada ainda — a base de força vem primeiro.</div>`}
    ${prox.length?`<div class="mt-muted" style="font-size:11.5px;margin-top:8px">Para liberar ${prox.map(p=>`<b>${mtEsc(p.c.titulo)}</b>: ${mtEsc(caliReqTexto(p.c.id))}`).join(' · ')}</div>`:''}`;
}
mtGancho('renderHome', { depois(){ try{ renderHomeCali(); }catch(e){ console.log('home cali', e); } }});
// Progresso: métricas próprias (repetições e tempo de isometria em calistenia)
const _mtMetricasCali = mtMetricas;
window.mtMetricas = function(){
  const M = _mtMetricasCali.apply(this, arguments);
  if(!Object.keys(state.progress||{}).some(ehCali)) return M;
  const soma = (bs, unidade)=>bs.map(b=>{ let v = 0; Object.keys(state.progress||{}).forEach(id=>{ const it = CALI_EX[id]; if(!it || (it.unit==='t') !== (unidade==='t')) return; (state.progress[id]||[]).forEach(p=>{ if(p.date>=b.a && p.date<b.b) v += (p.sets||[]).reduce((t,s)=>t+(+s.reps||0),0); }); }); return {v, b}; });
  M.push({k:'cali_reps', lbl:'Calistenia (repetições)', tipo:'bar', un:'reps', dec:0, pers:['semana','mes','tri','ano'], serie:bs=>soma(bs,'r'), soma:true});
  M.push({k:'cali_iso', lbl:'Isometria (segundos)', tipo:'bar', un:'s', dec:0, pers:['semana','mes','tri','ano'], serie:bs=>soma(bs,'t'), soma:true});
  return M;
};
mtGancho('renderPerf', { depois(){
  try{
    let el = $('perf-cali');
    if(!temCali() || !state.modules.lift){ if(el) el.remove(); return; }
    if(!el){ el = document.createElement('div'); el.id = 'perf-cali'; el.className = 'chart-card'; const ev = $('perf-evo'); if(ev) ev.after(el); else return; }
    const st = state.modules.lift.setup;
    const base = CALI_CADEIAS.filter(c=>!c.alt && caliPos(st,c.id)>=0 && (!c.skill || caliReqOk(st,c.id)));
    const hist = (st.caliHist||[]).slice(-5).reverse();
    el.innerHTML = `<div class="chart-title" style="margin-bottom:10px">Progressões da calistenia</div>
      ${base.map(c=>{ const i = caliPos(st,c.id); return `<div class="cl-row" onclick="caliAbrirTroca('${c.id}')"><div style="flex:1;min-width:0"><b>${mtEsc(c.titulo)}</b><small>${mtEsc(c.itens[i][0])}</small></div><div class="cl-dots">${c.itens.map((_,k)=>`<i class="${k<i?'ok':k===i?'now':''}"></i>`).join('')}</div></div>`; }).join('')}
      ${hist.length?`<div class="mt-sec" style="margin-top:12px">Últimas mudanças</div>${hist.map(h=>{ const c = caliCadeia(h.c); return c?`<div class="mt-muted" style="font-size:12px;padding:3px 0">${mtFmtData(h.at)} · ${h.para>h.de?'↑':'↓'} ${mtEsc(c.itens[h.para][0])}</div>`:''; }).join('')}`:'<div class="mt-muted" style="font-size:12px;margin-top:8px">As mudanças de variação aparecem aqui conforme você evolui.</div>'}`;
  }catch(e){ console.log('perf cali', e); }
}});
// Treinos: avisos da sessão de calistenia (equipamento faltando, recuperação)
mtGancho('renderSessions', { depois(){
  try{
    const mod = state.modules.lift; if(state.active!=='lift' || !mod || !mod.plan) return;
    const t = $('sessions-title'); const m = modalidadeAtual();
    if(t && m!=='musculacao') t.textContent = t.textContent.replace(/Musculação|Treinos/,'').trim() + (m==='calistenia' ? ' Calistenia' : ' Híbrido');
    const avisos = [...new Set((mod.plan.workouts||[]).flatMap(w=>w.caliAvisos||[]))];
    let box = $('sess-cali-avisos');
    if(!avisos.length){ if(box) box.remove(); return; }
    if(!box){ box = document.createElement('div'); box.id = 'sess-cali-avisos'; const slot = $('session-detail-slot'); if(slot) slot.before(box); }
    box.innerHTML = `<div class="note" style="margin-top:10px">${avisos.map(a=>`<div class="note-line">${mtEsc(a)}</div>`).join('')}</div>`;
  }catch(e){}
}});
// Perfil: linha "Modalidade"
mtGancho('renderProfile', { depois(){
  try{
    if(!state.modules.lift) return;
    let row = $('pf-modalidade-row');
    if(!row){ const ref = [...document.querySelectorAll('#scr-profile .list-row')].find(x=>/Meu plano de treino/.test(x.textContent)); if(!ref) return;
      row = document.createElement('div'); row.className = 'list-row'; row.id = 'pf-modalidade-row'; row.onclick = openModalidade; ref.after(row); }
    const m = modalidadeAtual(); const nr = temCali() ? caliNivelReal() : null;
    row.innerHTML = `<span>🤸</span> <span>Modalidade</span><span style="margin-left:auto;color:var(--text-mute);font-size:12px">${({musculacao:'Musculação',calistenia:'Calistenia',hibrido:'Híbrido'})[m]}${nr?' · '+nr.nome:''} ›</span>`;
  }catch(e){}
}});

// ---- Biblioteca e ficha ----
const CALI_AREAS = ['Superior','Inferior','Core','Habilidades'];
const _exPorNomeCali = exPorNome;
window.exPorNome = function(nome){
  const r = _exPorNomeCali(nome); if(r) return r;
  const it = CALI_EX[slug(nome)]; if(!it) return null;
  return { ex:{ name:it.nome, sub:`${caliCadeia(it.cadeia).titulo} · ${CALI_NIVEL[it.nivel]}`, equip:[], caliEquip:it.equip }, grupo:it.grupo, cali:it };
};
const _musculoCali = musculoDoExercicio;
window.musculoDoExercicio = function(ex, grupo){
  const it = ex && CALI_EX[slug(ex.name||'')];
  if(it){ const map = {Peito:'peito', Costas:'costas', Ombro:'ombros', 'Tríceps':'triceps', Pernas:'quadriceps', 'Glúteos':'gluteos', Panturrilha:'panturrilhas', Core:'abdomen'}; if(it.cadeia==='nordic') return 'posteriores'; return map[it.grupo] || 'abdomen'; }
  return _musculoCali(ex, grupo);
};
const _fichaCali = fichaExercicio;
window.fichaExercicio = function(ex, grupo){
  const it = ex && CALI_EX[slug(ex.name||'')];
  if(!it) return _fichaCali(ex, grupo);
  return { m: it.mus, ex: it.exec, d: [it.seg || 'Qualidade antes de quantidade: amplitude completa e controle em toda repetição.'], e: it.erro };
};
// informação extra da calistenia na ficha (nível, prescrição, progressão, pré-requisitos, equipamentos)
const _openSheetCali = openExerciseSheet;
window.openExerciseSheet = function(name, idKey, opts){
  _openSheetCali.apply(this, arguments);
  try{
    const it = CALI_EX[slug(name)]; if(!it) return;
    const c = caliCadeia(it.cadeia); const st = (state.modules.lift && state.modules.lift.setup) || {caliGoal:'hipertrofia', caliNivelDecl:it.nivel};
    const pr = caliPrescrever(c.itens[it.idx], Object.assign({}, st, {caliGoal: st.caliGoal || 'hipertrofia'}), c.skill);
    const ant = it.idx>0 ? c.itens[it.idx-1][0] : null, prox = it.idx<c.itens.length-1 ? c.itens[it.idx+1][0] : null;
    const box = document.createElement('div');
    box.innerHTML = `<div class="ex-sec"><h4>Calistenia</h4>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="cl-nv n${it.nivel}">${CALI_NIVEL[it.nivel]}</span><span class="pill">${mtEsc(c.titulo)}</span><span class="pill">${it.equip.length?it.equip.map(x=>CALI_EQUIP_LBL[x]).join(' ou '):'sem equipamento'}</span></div>
      <p><b>Prescrição sugerida:</b> ${pr.sets} séries × ${mtEsc(pr.reps)} · descanso ${mtEsc(pr.rest)}</p>
      ${ant?`<p style="margin-top:6px"><b>Regressão:</b> <a href="#" onclick="openExerciseSheet('${mtJsStr(ant)}');return false" style="color:var(--primary-2)">${mtEsc(ant)}</a></p>`:''}
      ${prox?`<p style="margin-top:4px"><b>Progressão:</b> <a href="#" onclick="openExerciseSheet('${mtJsStr(prox)}');return false" style="color:var(--primary-2)">${mtEsc(prox)}</a></p>`:''}
      ${c.req && it.idx===0?`<p style="margin-top:6px"><b>Pré-requisitos:</b> ${mtEsc(caliReqTexto(c.id))}</p>`:''}</div>`;
    const ref = document.querySelector('#modal-inner .ex-sec'); if(ref) ref.before(box.firstElementChild);
  }catch(e){}
};
const _renderLibraryCali = renderLibrary;
window.renderLibrary = function(){
  // a Biblioteca ganha as categorias de calistenia (e o filtro por nível dentro delas)
  const cal = typeof libFilter==='string' && libFilter.startsWith('Calistenia');
  if(!cal){
    _renderLibraryCali.apply(this, arguments);
    const chips = $('lib-chips'); if(chips) chips.insertAdjacentHTML('beforeend', `<div class="filter-chip" onclick="setLibFilter('Calistenia')">🤸 Calistenia</div>`);
    const cnt = $('lib-count'); if(cnt && libFilter==='Todos' && !($('lib-search')||{}).value) cnt.textContent = cnt.textContent + ` + ${Object.keys(CALI_EX).length} de calistenia`;
    // busca também encontra calistenia
    const q = mtNorm(($('lib-search')||{}).value||'').trim();
    if(q){ const achados = Object.values(CALI_EX).filter(it=>mtNorm(it.nome+' '+it.mus+' '+caliCadeia(it.cadeia).titulo).includes(q));
      if(achados.length) $('lib-list').insertAdjacentHTML('beforeend', `<div class="lx-cat">${muscleIco('abdomen')}<div><b>Calistenia</b><small>${achados.length} exercício${achados.length>1?'s':''}</small></div></div>` + achados.map(_caliLibItem).join('')); }
    return;
  }
  const area = libFilter.split('·')[1] ? libFilter.split('·')[1].trim() : null;
  const nvSel = window.__caliNvLib || 0;
  $('lib-chips').innerHTML = `<div class="filter-chip" onclick="setLibFilter('Todos')">← Musculação</div>` + ['Calistenia', ...CALI_AREAS.map(a=>'Calistenia · '+a)].map(f=>`<div class="filter-chip ${f===libFilter?'on':''}" onclick="setLibFilter('${f}')">${f==='Calistenia'?'Todos':f.split('·')[1].trim()}</div>`).join('');
  const eq = $('lib-equip'); if(eq) eq.innerHTML = [0,1,2,3,4].map(n=>`<div class="filter-chip ${n===nvSel?'on':''}" onclick="window.__caliNvLib=${n};renderLibrary()">${n?CALI_NIVEL[n]:'Todos os níveis'}</div>`).join('');
  const q = mtNorm(($('lib-search')||{}).value||'').trim();
  let html = '', total = 0;
  CALI_CADEIAS.filter(c=>!area || c.area===area).forEach(c=>{
    const its = c.itens.map(it=>CALI_EX[slug(it[0])]).filter((it,k,arr)=>it && arr.indexOf(it)===k && it.cadeia===c.id && (!nvSel || it.nivel===nvSel) && (!q || mtNorm(it.nome+' '+it.mus).includes(q)));
    if(!its.length) return; total += its.length;
    html += `<div class="lx-cat">${muscleIco(window.musculoDoExercicio({name:its[0].nome}))}<div><b>${mtEsc(c.titulo)}</b><small>${c.area} · ${its.length} ${its.length===1?'variação':'variações'}${c.req?' · pré-requisitos: '+mtEsc(caliReqTexto(c.id)):''}</small></div></div>` + its.map(_caliLibItem).join('');
  });
  $('lib-count').textContent = `Calistenia · ${total} exercícios`;
  $('lib-list').innerHTML = html || `<div class="lx-empty">Nenhum exercício com esses filtros.</div>`;
};
function _caliLibItem(it){
  const temVideo = !!(videoLinks && videoLinks[it.id]);
  return `<div class="lx-item" onclick="openExercise('${mtJsStr(it.nome)}')">${muscleIco(window.musculoDoExercicio({name:it.nome}))}<div class="lx-info"><div class="lx-name">${mtEsc(it.nome)}</div><div class="lx-sub">${mtEsc(it.mus)}</div><div class="lx-tags"><span class="cl-nv n${it.nivel}">${CALI_NIVEL[it.nivel]}</span><span class="lx-tag">${it.equip.length?it.equip.map(x=>CALI_EQUIP_LBL[x]).join(' ou '):'sem equipamento'}</span>${temVideo?'<span class="lx-tag v">▶ vídeo</span>':''}</div></div><span class="lx-go">›</span></div>`;
}
// Admin: vídeos dos exercícios de calistenia entram no painel de vídeos existente
const _openVideoAdminCali = openVideoAdmin;
window.openVideoAdmin = async function(){
  const extra = { name:'Calistenia', emo:'🤸', color:'', items: Object.values(CALI_EX).map(it=>({name:it.nome, sub:`${caliCadeia(it.cadeia).titulo} · ${CALI_NIVEL[it.nivel]}`, equip:['casa'], _cali:true})) };
  EX_BANK.push(extra);
  try{ return await _openVideoAdminCali.apply(this, arguments); }
  finally{ const i = EX_BANK.indexOf(extra); if(i>=0) EX_BANK.splice(i,1); }
};

// ---- Meta Assistente ----
function caliAnalise(){
  if(!temCali()) return 'Você está na musculação tradicional. Se quiser treinar calistenia, troque em Perfil → Modalidade (seu histórico continua). 🤸';
  const st = state.modules.lift.setup; const nr = caliNivelReal();
  const linhas = []; const estag = []; const prontos = []; const dificeis = [];
  Object.values(CALI_EX).forEach(it=>{
    if(caliPos(st, it.cadeia) !== it.idx) return;
    const sess = caliSessoesEx(it.id); if(!sess.length) return;
    if(caliDominio(it.id).ok) prontos.push(it.nome);
    else if(caliDificuldade(it.id)) dificeis.push(it.nome);
    else if(sess.length >= 4 && sess[sess.length-1].date - sess[0].date > 21*DIA_MS){
      const tot = s=>s.sets.reduce((a,x)=>a+(+x.reps||0),0);
      const a = tot(sess[sess.length-4]), b = tot(sess[sess.length-1]);
      if(b <= a) estag.push(it.nome);
    }
  });
  let t = `<b>Sua calistenia</b>${nr?` — nível ${nr.medido?'atual':'de partida'}: <b>${nr.nome}</b>`:''}.<br><br>`;
  if(prontos.length) t += `📈 <b>Pronto para avançar:</b> ${prontos.map(mtEsc).join(', ')}. Abra o exercício no treino e toque em “Trocar” para ver a próxima variação.<br><br>`;
  if(estag.length) t += `➖ <b>Sem evolução há 3+ semanas:</b> ${estag.map(mtEsc).join(', ')}. Experimente pausas de 2 s no ponto mais difícil, descida em 3–4 s ou mais uma série — e confira sono e recuperação.<br><br>`;
  if(dificeis.length) t += `⚖️ <b>Abaixo da faixa nas últimas sessões:</b> ${dificeis.map(mtEsc).join(', ')}. Uma variação mais fácil por 1–2 semanas costuma destravar com segurança.<br><br>`;
  if(!prontos.length && !estag.length && !dificeis.length) t += 'Ainda não há registros suficientes para uma análise. Registre repetições (ou tempo) de cada série e me pergunte de novo depois de algumas sessões.<br><br>';
  t += 'Regra da casa: só avançamos de variação depois de 2 sessões no topo da faixa com execução limpa.';
  return t;
}
function caliMetas(){
  if(!temCali()) return caliAnalise();
  const hs = caliResumoHabilidades();
  return `<b>Suas habilidades</b><br><br>` + hs.map(h=>h.lib ? `✅ <b>${mtEsc(h.c.titulo)}</b>: etapa ${h.i+1} de ${h.total} (${mtEsc(h.atual)})` : `🔒 <b>${mtEsc(h.c.titulo)}</b>: libera com ${mtEsc(caliReqTexto(h.c.id))}${(h.c.itens[0][3]||[]).length && !caliEquipOk(h.c.itens[0], state.modules.lift.setup)?` (precisa de ${(h.c.itens[0][3]).map(x=>CALI_EQUIP_LBL[x]).join(' ou ')})`:''}`).join('<br>') + '<br><br>Os pré-requisitos existem por segurança: alavancas e paradas exigem força de base nos ombros, punhos e costas.';
}
function caliComoFazer(txt){
  const t = mtNorm(txt);
  const it = Object.values(CALI_EX).find(x=>t.includes(mtNorm(x.nome).replace(/\(.*\)/,'').trim())) || Object.values(CALI_EX).find(x=>{ const w = mtNorm(x.nome).split(' ').filter(p=>p.length>3); return w.length && w.every(p=>t.includes(p)); });
  if(!it) return null;
  const c = caliCadeia(it.cadeia);
  return `<b>${mtEsc(it.nome)}</b> (${CALI_NIVEL[it.nivel]} · ${mtEsc(c.titulo)})<br><br>${it.exec.map((x,i)=>`${i+1}. ${mtEsc(x)}`).join('<br>')}<br><br>⚠️ Erro comum: ${mtEsc(it.erro)}${it.seg?'<br>🛡️ '+mtEsc(it.seg):''}${it.idx>0?`<br><br>Mais fácil: ${mtEsc(c.itens[it.idx-1][0])}`:''}${it.idx<c.itens.length-1?` · Mais difícil: ${mtEsc(c.itens[it.idx+1][0])}`:''}<br><br><button class="btn btn-ghost" style="padding:7px 12px;font-size:12.5px" onclick="closeAssistant();openExercise('${mtJsStr(it.nome)}')">Abrir ficha e vídeo</button>`;
}
Object.assign(MA_ANSWERS, { cali_analise: caliAnalise, cali_metas: caliMetas });
const _maInterpretCali = maInterpret;
maInterpret = function(txt){
  const t = mtNorm(txt); const has = (...w)=>w.some(x=>t.includes(x));
  if(has('calistenia','progressao','progressão','regressao','proxima variacao','próxima variação') && has('como estou','analis','evolu','progress','regress','avanc','estagn')) return 'cali_analise';
  if(has('front lever','planche','muscle up','muscle-up','human flag','back lever','handstand','parada de mao','l-sit','habilidade') && has('quando','libera','falta','meta','pre-requisito','prerequisito','consigo','progresso')) return 'cali_metas';
  if(has('como faz','como fazer','como executar','execucao','execução','tecnica','técnica')){ const r = caliComoFazer(txt); if(r){ window.__caliResp = r; return 'cali_como'; } }
  return _maInterpretCali(txt);
};
MA_ANSWERS.cali_como = ()=>window.__caliResp || 'Me diga o nome do exercício.';
const _sugCali = MA_SUGGESTIONS.slice();
function caliAjustarSugestoes(){
  const tem = MA_SUGGESTIONS.some(s=>s.key==='cali_analise');
  if(temCali() && !tem) MA_SUGGESTIONS.splice(0, 0, {lbl:'🤸 Minha calistenia', key:'cali_analise'}, {lbl:'🎯 Minhas habilidades', key:'cali_metas'});
  if(!temCali() && tem){ for(let i=MA_SUGGESTIONS.length-1;i>=0;i--) if(/^cali_/.test(MA_SUGGESTIONS[i].key)) MA_SUGGESTIONS.splice(i,1); }
}
const _openAssistantCali = openAssistant;
window.openAssistant = function(){ try{ caliAjustarSugestoes(); }catch(e){} return _openAssistantCali.apply(this, arguments); };

// ---- Admin: exercícios, modelos, progressão e uso ----
const caliConfig = { sessoesDominio: 2 };
let caliModelos = [];
try{ caliModelos = JSON.parse(mtLS('mt_cali_modelos')||'[]'); }catch(e){}
function caliModeloAdmin(st, d){
  const m = caliModelos.find(x=>x.ativo!==false && +x.dias===d && (!x.objetivo || x.objetivo===st.caliGoal) && (x.sessoes||[]).length===d);
  return m || null;
}
async function loadCaliAdmin(){
  try{
    const [ex, mo, cf] = await Promise.all([ db.collection('caliExercicios').get(), db.collection('caliModelos').get(), db.collection('config').doc('calistenia').get() ]);
    const exs = []; ex.forEach(d=>exs.push(Object.assign({id:d.id}, d.data())));
    const mods = []; mo.forEach(d=>mods.push(Object.assign({id:d.id}, d.data())));
    caliModelos = mods; mtLS('mt_cali_modelos', JSON.stringify(mods));
    if(cf.exists && cf.data().sessoesDominio) caliConfig.sessoesDominio = Math.max(1, Math.min(4, +cf.data().sessoesDominio));
    mtLS('mt_cali_ex', JSON.stringify(exs)); caliAplicarAdmin(exs);
  }catch(e){ try{ caliAplicarAdmin(JSON.parse(mtLS('mt_cali_ex')||'[]')); }catch(err){} }
}
// exercícios do administrador entram na cadeia escolhida, na posição escolhida; também permite ajustar/desativar os padrões
const _CALI_ORIG = JSON.parse(JSON.stringify(CALI_CADEIAS.map(c=>c.itens)));
function caliAplicarAdmin(lista){
  CALI_CADEIAS.forEach((c,i)=>{ c.itens = JSON.parse(JSON.stringify(_CALI_ORIG[i])); });
  (lista||[]).forEach(x=>{
    const c = caliCadeia(x.cadeia); if(!c) return;
    const k = c.itens.findIndex(it=>slug(it[0])===x.id);
    if(k>=0){
      if(x.ativo===false && c.itens.length>1){ c.itens.splice(k,1); return; }
      if(x.nivel) c.itens[k][1] = +x.nivel;
      if(x.execucao) c.itens[k][7] = String(x.execucao).split('\n').filter(Boolean);
      if(x.erro) c.itens[k][8] = x.erro;
      return;
    }
    if(x.ativo===false || !x.nome) return;
    const it = [x.nome, +x.nivel||1, x.unidade==='t'?'t':'r', x.equip||[], x.grupo||c.itens[0][4], x.faixa||'', x.musculos||'', String(x.execucao||'').split('\n').filter(Boolean), x.erro||'', x.seguranca||''];
    const pos = Math.max(0, Math.min(c.itens.length, x.posicao==null ? c.itens.length : +x.posicao));
    c.itens.splice(pos, 0, it);
  });
  caliIndexar();
}
async function openCaliAdmin(){
  $('modal-inner').innerHTML = `<h3>Calistenia</h3><div class="mt-loading"><div class="ex-spin"></div><span>Carregando…</span></div>`; $('modal-back').classList.add('on');
  await loadCaliAdmin();
  const princ = mtAdmin();
  const us = Object.values(usuariosCache||{}).map(u=>u.estadoApp && u.estadoApp.modules && u.estadoApp.modules.lift && u.estadoApp.modules.lift.setup).filter(Boolean);
  const cont = {musculacao:0, calistenia:0, hibrido:0}; us.forEach(s=>cont[s.modalidade||'musculacao']++);
  const skills = {}; us.filter(s=>s.caliPos).forEach(s=>CALI_CADEIAS.filter(c=>c.skill).forEach(c=>{ if(s.caliPos[c.id]!=null) skills[c.titulo] = (skills[c.titulo]||0)+1; }));
  $('modal-inner').innerHTML = `<h3>Calistenia</h3>
    <div class="adm-kpis"><div class="adm-kpi"><b>${cont.calistenia}</b><small>em calistenia</small></div><div class="adm-kpi"><b>${cont.hibrido}</b><small>no híbrido</small></div><div class="adm-kpi"><b>${cont.musculacao}</b><small>só musculação</small></div></div>
    ${Object.keys(skills).length?`<div class="mt-muted" style="font-size:12px;margin:6px 2px 0">Habilidades em treino: ${Object.entries(skills).map(([k,v])=>`${mtEsc(k)} (${v})`).join(' · ')}</div>`:''}
    <div class="mt-sec">Ferramentas</div>
    <div class="list-row" onclick="openCaliCadeias()">🧗 <span>Exercícios e progressões</span><span style="margin-left:auto;font-size:12px;color:var(--text-mute)">${Object.keys(CALI_EX).length} ›</span></div>
    <div class="list-row" onclick="openCaliModelos()">🗂️ <span>Modelos de plano</span><span style="margin-left:auto;font-size:12px;color:var(--text-mute)">${caliModelos.length} ›</span></div>
    <div class="list-row" onclick="openVideoAdmin()">🎬 <span>Vídeos dos exercícios</span><span style="margin-left:auto;font-size:12px;color:var(--text-mute)">categoria Calistenia ›</span></div>
    ${princ?`<div class="list-row" onclick="caliConfigDominio()">⚙️ <span>Critério de domínio</span><span style="margin-left:auto;font-size:12px;color:var(--text-mute)">${caliConfig.sessoesDominio} sessões no topo ›</span></div>`:''}
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
}
function openCaliCadeias(){
  const princ = mtAdmin();
  $('modal-inner').innerHTML = `<h3>Exercícios e progressões</h3><p class="mt-muted" style="margin:0 0 8px">A ordem é a ordem de progressão. ${princ?'Toque num exercício para editar nível e textos, ou adicione um novo numa posição da cadeia.':'Somente administradores editam.'}</p>
    <div style="max-height:58vh;overflow:auto">${CALI_CADEIAS.map(c=>`<div class="mt-sec">${mtEsc(c.titulo)} · ${c.area}${c.req?' · pré-req.':''}</div>${c.itens.map((it,k)=>`<div class="cl-step" ${princ?`onclick="caliEditarEx('${c.id}',${k})"`:''}><span class="cl-nv n${it[1]}">${CALI_NIVEL[it[1]]}</span><b style="flex:1;font-size:13px">${k+1}. ${mtEsc(it[0])}</b></div>`).join('')}${princ?`<button class="btn btn-ghost" style="padding:6px 10px;font-size:12px;margin:4px 0 8px" onclick="caliEditarEx('${c.id}',-1)">+ Adicionar em ${mtEsc(c.titulo)}</button>`:''}`).join('')}</div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openCaliAdmin()">Voltar</button>`;
}
function caliEditarEx(cid, k){
  if(!mtAdmin()) return;
  const c = caliCadeia(cid); const it = k>=0 ? c.itens[k] : ['',1,'r',[],c.itens[0][4],'','',[],'',''];
  const novo = k<0;
  $('modal-inner').innerHTML = `<h3>${novo?'Novo exercício':'Editar exercício'}</h3><p class="mt-muted" style="margin:0">${mtEsc(c.titulo)}</p>
    <div class="adm-form">
      <label>Nome</label><input class="input" id="ce-nome" value="${mtEsc(it[0])}" ${novo?'':'disabled'}>
      <div style="display:flex;gap:8px"><div style="flex:1"><label>Nível</label><select class="input" id="ce-nivel">${[1,2,3,4].map(n=>`<option value="${n}" ${it[1]===n?'selected':''}>${CALI_NIVEL[n]}</option>`).join('')}</select></div>
      ${novo?`<div style="flex:1"><label>Unidade</label><select class="input" id="ce-un"><option value="r">Repetições</option><option value="t">Tempo (s)</option></select></div>`:''}</div>
      ${novo?`<label>Posição na progressão</label><select class="input" id="ce-pos">${c.itens.map((x,i)=>`<option value="${i+1}">depois de ${mtEsc(x[0])}</option>`).join('')}<option value="0">no início</option></select>
      <label>Equipamentos (precisa de um deles)</label><div style="display:flex;flex-wrap:wrap;gap:6px">${Object.entries(CALI_EQUIP_LBL).map(([kk,l])=>`<label style="text-transform:none;letter-spacing:0;font-size:12.5px;color:var(--text);margin:0"><input type="checkbox" class="ce-eq" value="${kk}"> ${l}</label>`).join('')}</div>
      <label>Músculos trabalhados</label><input class="input" id="ce-mus">`:''}
      <label>Como executar (uma etapa por linha)</label><textarea class="input" id="ce-exec">${mtEsc((it[7]||[]).join('\n'))}</textarea>
      <label>Erro comum</label><input class="input" id="ce-erro" value="${mtEsc(it[8]||'')}">
      ${novo?'':`<label style="display:flex;gap:8px;align-items:center;text-transform:none;letter-spacing:0;font-size:13px;color:var(--text)"><input type="checkbox" id="ce-off"> Desativar este exercício (sai dos planos novos)</label>`}
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" id="ce-salvar" onclick="caliSalvarEx('${cid}',${k})">Salvar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openCaliCadeias()">Voltar</button>`;
}
async function caliSalvarEx(cid, k){
  if(!mtAdmin()) return;
  const c = caliCadeia(cid); const novo = k<0;
  const nome = novo ? $('ce-nome').value.trim() : c.itens[k][0];
  if(nome.length < 3){ toast('Dê um nome ao exercício'); return; }
  const id = slug(nome);
  if(novo && CALI_EX[id]){ toast('Já existe um exercício com esse nome'); return; }
  const dados = { cadeia:cid, nivel:+$('ce-nivel').value, execucao:$('ce-exec').value.trim(), erro:$('ce-erro').value.trim(), atualizadoEm:Date.now(), atualizadoPor:state.user.email };
  if(novo) Object.assign(dados, { nome, unidade:$('ce-un').value, posicao:+$('ce-pos').value, equip:[...document.querySelectorAll('.ce-eq:checked')].map(x=>x.value), musculos:$('ce-mus').value.trim(), grupo:c.itens[0][4], ativo:true });
  else dados.ativo = !$('ce-off').checked;
  await mtComBotao('ce-salvar','Salvando…', async ()=>{
    await db.collection('caliExercicios').doc(id).set(dados, {merge:true});
    await loadCaliAdmin(); toast('✅ Salvo. Vale para os próximos planos gerados.'); openCaliCadeias();
  });
}
function openCaliModelos(){
  const princ = mtAdmin();
  $('modal-inner').innerHTML = `<h3>Modelos de plano</h3><p class="mt-muted" style="margin:0 0 8px">Quando existe um modelo ativo para o número de dias (e objetivo) do aluno, ele substitui a divisão padrão (${Object.entries(CALI_SPLITS).map(([d,s])=>d+' dias: '+s.nome).join(' · ')}).</p>
    ${caliModelos.map(m=>`<div class="list-row" ${princ?`onclick="caliEditarModelo('${m.id}')"`:''}>${mtEsc(m.nome||'Modelo')}<span style="margin-left:auto;font-size:12px;color:var(--text-mute)">${m.dias} dias${m.objetivo?' · '+m.objetivo:''}${m.ativo===false?' · inativo':''}</span></div>`).join('') || '<div class="mt-muted" style="padding:8px 0">Nenhum modelo criado. Os planos usam as divisões padrão.</div>'}
    ${princ?`<button class="btn btn-primary btn-block" style="margin-top:10px" onclick="caliEditarModelo()">+ Novo modelo</button>`:''}
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openCaliAdmin()">Voltar</button>`;
}
const CALI_PAD_LBL = { skill:'Habilidade', empurrar_h:'Empurrar horizontal (flexões)', empurrar_v:'Empurrar vertical (pike/HSPU)', dips:'Paralelas / tríceps', puxar_v:'Puxar vertical (barra)', puxar_h:'Puxar horizontal (remada)', agachar:'Agachamento', agachar_uni:'Perna unilateral', posterior:'Posteriores', gluteo:'Glúteos', panturrilha:'Panturrilhas', core_anti:'Core anti-extensão', core_lat:'Core lateral', core_flex:'Elevação de pernas / L-sit', core_ext:'Core posterior' };
function caliEditarModelo(id){
  if(!mtAdmin()) return;
  const m = caliModelos.find(x=>x.id===id) || { nome:'', dias:3, objetivo:'', ativo:true, sessoes:[] };
  window.__cmDias = +m.dias || 3;
  const sess = k=>{ const s = (m.sessoes||[])[k] || {nome:'Sessão '+(k+1), slots:[]};
    return `<div class="adm-ms"><input class="input cm-nome" value="${mtEsc(s.nome)}" style="margin-bottom:6px"><div style="display:flex;flex-wrap:wrap;gap:4px 10px">${Object.entries(CALI_PAD_LBL).map(([p,l])=>`<label style="font-size:12px;display:flex;gap:5px;align-items:center"><input type="checkbox" class="cm-p" data-s="${k}" value="${p}" ${(s.slots||[]).includes(p)?'checked':''}> ${l}</label>`).join('')}</div></div>`; };
  $('modal-inner').innerHTML = `<h3>${id?'Editar':'Novo'} modelo</h3><div class="adm-form">
    <label>Nome</label><input class="input" id="cm-nome" value="${mtEsc(m.nome)}" placeholder="Ex.: Full body 3x — iniciantes">
    <div style="display:flex;gap:8px"><div style="flex:1"><label>Dias</label><select class="input" id="cm-dias" onchange="window.__cmDias=+this.value;caliEditarModelo('${id||''}')">${[3,4,5,6].map(d=>`<option ${d===window.__cmDias?'selected':''}>${d}</option>`).join('')}</select></div>
    <div style="flex:1"><label>Objetivo</label><select class="input" id="cm-obj"><option value="">Qualquer</option>${Object.keys(CALI_PRESC).map(o=>`<option value="${o}" ${m.objetivo===o?'selected':''}>${o}</option>`).join('')}</select></div></div>
    <label>Sessões (a ordem de cima para baixo é a ordem dos exercícios; o tempo da sessão corta os últimos)</label>
    ${Array.from({length:window.__cmDias},(_,k)=>sess(k)).join('')}
    <label style="display:flex;gap:8px;align-items:center;text-transform:none;letter-spacing:0;font-size:13px;color:var(--text)"><input type="checkbox" id="cm-ativo" ${m.ativo!==false?'checked':''}> Ativo</label></div>
    <button class="btn btn-primary btn-block" style="margin-top:10px" id="cm-salvar" onclick="caliSalvarModelo('${id||''}')">Salvar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openCaliModelos()">Voltar</button>`;
}
async function caliSalvarModelo(id){
  if(!mtAdmin()) return;
  const dias = +$('cm-dias').value;
  const nomes = [...document.querySelectorAll('.cm-nome')].map(x=>x.value.trim());
  const ordem = Object.keys(CALI_PAD_LBL);
  const sessoes = nomes.map((n,k)=>({ nome:n||('Sessão '+(k+1)), slots: ordem.filter(p=>document.querySelector(`.cm-p[data-s="${k}"][value="${p}"]`).checked) }));
  if(sessoes.some(s=>s.slots.length<3)){ toast('Cada sessão precisa de pelo menos 3 movimentos'); return; }
  const dados = { nome:$('cm-nome').value.trim()||'Modelo', dias, objetivo:$('cm-obj').value, ativo:$('cm-ativo').checked, sessoes, atualizadoEm:Date.now(), atualizadoPor:state.user.email };
  await mtComBotao('cm-salvar','Salvando…', async ()=>{
    await db.collection('caliModelos').doc(id || ('m'+Date.now().toString(36))).set(dados, {merge:true});
    await loadCaliAdmin(); toast('✅ Modelo salvo. Vale para planos criados ou recriados a partir de agora.'); openCaliModelos();
  });
}
function caliConfigDominio(){
  if(!mtAdmin()) return;
  $('modal-inner').innerHTML = `<h3>Critério de domínio</h3><p class="mt-muted">Quantas sessões seguidas no topo da faixa (com execução limpa) o aluno precisa para liberar a próxima variação.</p>
    <select class="input" id="cd-n">${[1,2,3,4].map(n=>`<option ${n===caliConfig.sessoesDominio?'selected':''}>${n}</option>`).join('')}</select>
    <button class="btn btn-primary btn-block" style="margin-top:10px" id="cd-salvar" onclick="mtComBotao('cd-salvar','Salvando…',async()=>{ await db.collection('config').doc('calistenia').set({sessoesDominio:+$('cd-n').value, atualizadoEm:Date.now()}, {merge:true}); await loadCaliAdmin(); toast('✅ Salvo'); openCaliAdmin(); })">Salvar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openCaliAdmin()">Voltar</button>`;
}
mtGancho('goAdmin', { depois(){
  try{
    if(!$('adm-cali-row')){ const ref = $('adm-vid-row') || $('adm-ev-row'); if(ref){ const a = document.createElement('div'); a.className = 'list-row'; a.id = 'adm-cali-row'; a.onclick = openCaliAdmin; a.innerHTML = '🤸 <span>Calistenia</span><span style="margin-left:auto;font-size:11px;color:var(--text-dim)">exercícios, modelos e uso</span>'; ref.after(a); } }
  }catch(e){}
}});
const _bootCali = bootAfterAuth;
window.bootAfterAuth = function(){ const r = _bootCali.apply(this, arguments); setTimeout(()=>{ loadCaliAdmin().then(()=>{ try{ if(temCali()){ caliRegenTudo(); } }catch(e){} }); }, 2200); return r; };
try{ caliAplicarAdmin(JSON.parse(mtLS('mt_cali_ex')||'[]')); }catch(e){}

Object.assign(window, { caliAbrirTroca, caliDefinirPos, caliPreferir, caliQual, caliMostrarSetup, openModalidade, openCaliAdmin, openCaliCadeias, caliEditarEx, caliSalvarEx, openCaliModelos, caliEditarModelo, caliSalvarModelo, caliConfigDominio,
  caliGerarWorkouts, caliNivelReal, caliDominio, CALI_CADEIAS });

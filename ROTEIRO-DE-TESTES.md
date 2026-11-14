# Roteiro de testes em aparelho real — MetaTreino Beta 38

Leva uns 30 minutos. Anote **modelo do celular, sistema (Android/iOS) e navegador**, e mande print de tudo o que parecer estranho. As regras do Firestore não mudaram nesta versão.

## 0. Beta 38 — primeiro acesso (o mais importante desta versão)

**A. Conta nova** (crie uma conta de teste ou use uma liberada só para isso)
- [ ] Logo depois de entrar: aparece "Etapa 1 de 10", **sem** a barra de abas e **sem** o botão do assistente?
- [ ] Os 8 temas aparecem com miniatura. O **Areia** tem a etiqueta "Sugerido", mas não vem marcado. Toque em dois temas diferentes: a tela inteira muda na hora?
- [ ] Toque em Continuar sem preencher o nome: aparece o aviso na própria etapa e ela não avança?
- [ ] Preencha a etapa 2, avance, toque em **Voltar**: o que você digitou continua lá?
- [ ] Na escolha da modalidade (etapa 5), toque em **← Voltar**: volta para o objetivo com a resposta marcada?
- [ ] Musculação → etapa 6: o objetivo aparece já preenchido ("Objetivo do plano: …") com o botão **Alterar**, sem perguntar de novo?
- [ ] Escolha **Híbrido**: só existe UMA pergunta de objetivo?
- [ ] Etapa 7, "Escolher meus equipamentos": cada aparelho tem um desenho que parece o aparelho de verdade? Algum ficou estranho? (mande print)
- [ ] Etapa 8: marque 4 dias por semana e só 2 dias da semana → Continuar: aparece "Selecione exatamente 4 dias da semana"?
- [ ] Etapa 9 (Híbrido, com 60 min por sessão): o texto do nível diz "até 60 min" e não mostra outra estimativa de tempo?
- [ ] Etapa 10 (Revisão): tudo o que você escolheu aparece? Toque em **Alterar** em "Você", mude o nome, avance: volta direto para a revisão, sem perder o resto?
- [ ] **Criar meu plano**: a tela de montagem usa as cores do tema escolhido e ícones (sem emojis grandes)? Ao chegar no Início, **não** aparece o aviso "Semana nova: troquei os acessórios…"?
- [ ] Depois do plano: abas e assistente aparecem e funcionam (peça "abrir desafios")?
- [ ] Os treinos do Híbrido ficaram com no máximo uns 65 min (Treinos → cada dia)?
- [ ] Com "Escolher meus equipamentos": os exercícios do plano usam os aparelhos que você marcou (antes vinha só peso do corpo)?

**B. Antes de terminar o cadastro, tente "furar"** (com a conta nova, em qualquer etapa)
- [ ] Não existe botão do assistente nem barra de abas em nenhuma etapa.
- [ ] Feche e abra o app no meio do cadastro: ele volta para o cadastro (e não para o Início)?

**C. Começar do zero** (se puder, numa conta de teste com alguns treinos — **apaga o histórico dessa conta**)
- [ ] Perfil → Começar do zero → a confirmação diz o que é apagado e o que fica?
- [ ] Depois: volta para a Etapa 1, com o seu tema atual marcado (não troca sozinho para o Areia)?
- [ ] Os campos vêm em branco (nada da configuração anterior)?
- [ ] O assistente e as abas ficam bloqueados até criar o plano novo?
- [ ] Monte um plano de **corrida**: o mapa ilustrativo aparece no topo e o percurso colorido avança a cada etapa?
- [ ] Depois do plano novo: o tema continua o mesmo? Áudio dos vídeos e organização do Início continuam como você deixou?

**D. Conta do dia a dia (não use "Começar do zero" nela)**
- [ ] Abriu direto no Início, com tudo como antes (tema, histórico, plano)?
- [ ] Perfil: o IMC aparece como número (não "NaN")?

## 1. Instalação, atualização e modo avião
- [ ] O app atualizou sozinho para a **Beta 38** (Perfil → rodapé), sem tocar em nenhum botão?
- [ ] Fechar e abrir de novo: entrou direto, sem pedir login?
- [ ] **Logo depois de atualizar**, ligue o modo avião, feche o app de vez e abra de novo. Ele abre e mostra os treinos? (Na Beta 32 este caso podia abrir em branco.)
- [ ] Ainda no modo avião: registre 2 séries e salve o treino. Desligue o modo avião. O treino aparece no Histórico de outro aparelho (ou depois de sair e entrar)?

## 2. Cronômetro de descanso (o mais importante desta versão)
- [ ] Abra o treino de hoje, registre uma série e toque em "+ Nova série". O descanso começa com o tempo do exercício?
- [ ] O descanso de um exercício principal (supino, agachamento) é maior que o de um acessório (elevação lateral, abdominal)? *(Vale para planos novos ou corrigidos: veja o item 5.)*
- [ ] Toque em **+15s**, **−15s**, **Pausar** e **Continuar**. O tempo responde certo e nunca fica negativo?
- [ ] Com o descanso rodando, **bloqueie a tela** por uns 40 s e desbloqueie. O tempo restante está certo (não parou nem atrasou)?
- [ ] Deixe o descanso acabar **com a tela bloqueada**. O som tocou? Vibrou? (Anote: Android/iPhone, modo silencioso ligado ou não.)
- [ ] Deixe acabar com o app aberto: tocou e vibrou **uma vez só**?
- [ ] Perfil → Som do cronômetro → **Sem som**. Faça um descanso: não toca nada? Feche e abra o app: continua sem som?
- [ ] Mesma tela → **Sem vibrar**: o celular não vibra no fim?
- [ ] Inicie um descanso, feche o app de vez e abra de novo em seguida. O cronômetro volta com o tempo certo?

## 3. Tela ligada durante o treino
- [ ] Abra o treino de hoje e deixe o celular parado na ficha por mais tempo que o "desligar tela" do aparelho. **A tela continuou acesa?**
- [ ] Vá para a aba Início e espere: a tela apaga normalmente?
- [ ] Volte para Treinos: a tela volta a ficar acesa?
- [ ] Minimize o app no meio do treino e volte: continua acesa?
- [ ] Salve o treino: depois disso, a tela apaga normalmente?

## 4. Celular e computador (Beta 34 — o mais importante desta versão)
- [ ] Publique o `firestore.rules` novo **antes** deste teste.
- [ ] Entre no computador do jeito que costuma entrar (se no celular é Google, teste também com e-mail e senha). O Histórico do computador mostra **os mesmos treinos** do celular? (Musculação e corrida ficam em abas diferentes do Histórico: confira as duas.)
- [ ] Perfil → Conta e dados → **Sincronização entre aparelhos**: aparece "unificado" se você já entrou de duas formas? A última gravação confirmada é recente?
- [ ] Com os dois abertos: registre uma corrida no computador. Em poucos segundos ela aparece no celular?
- [ ] Mude o apelido no celular (Editar dados pessoais). Aparece no computador?
- [ ] Salve um treino de musculação no celular. Os totais (Progresso) e as conquistas ficam iguais nos dois?
- [ ] Ligue o modo avião no celular, registre algo, registre outra coisa no computador, desligue o modo avião. Os dois registros aparecem nos dois aparelhos, sem duplicar?
- [ ] Exclua um treino num aparelho. Ele **não volta** depois de abrir o outro?
- [ ] Saia da conta no computador e entre de novo: tudo volta?

## 4a. Revisão da Beta 34
- [ ] Abra um exercício com carga: o 1º toque ("+ Registrar a 1ª série") **não** inicia o descanso? Depois de fazer a série, "+ Nova série" inicia o descanso uma vez só?
- [ ] O descanso do agachamento/supino é maior que o da elevação lateral ou do abdominal?
- [ ] Flexão de braço ou barra fixa: aparece só "Repetições" (sem peso)? "+ Usei carga extra" mostra a coluna de carga?
- [ ] Corrida → Semana com menos tempo: escolha menos dias. Aparece "Como fica a semana" antes de aplicar? Depois de aplicar, a semana muda na hora?
- [ ] Segure o dedo num botão ou numa aba: não aparece o menu de copiar? Segure num texto da ficha: dá para selecionar?
- [ ] Na ficha de um exercício com créditos, eles aparecem no fim, depois de "Erro comum"?

## 4e. Beta 37
- [ ] Perfil: abra um grupo, feche o app (tire da lista de recentes) e abra de novo — o grupo está fechado?
- [ ] Treino com Cadeira Abdutora/glúteo médio: aparece só um grupo "Glúteos"?
- [ ] "Ver como fazer" num exercício com vídeo vertical: sem o logotipo "Shorts", sem título grande e sem legenda?
- [ ] Corrida: o cartão do treino e o aviso de progresso mostram o mesmo estágio?

## 4d. Beta 36 — acabamento
- [ ] Início de manhã, de dia, no fim da tarde e à noite: o sol ou a lua aparecem inteiros, à direita da saudação, sem nada por cima? Com chuva ou nublado aparecem nuvens?
- [ ] Toque na sua foto (no alto, à direita): abre o Perfil?
- [ ] Desafios em todos os temas, principalmente AMOLED: a medalha do topo aparece e não cruza a bandeira do desafio?
- [ ] Treinos → abra um exercício: o descanso **não** começa ao abrir nem ao tocar "+ Registrar a 1ª série". Preencha e toque em **✓**: o descanso começa. Na última série prevista, o ✓ **não** abre descanso.
- [ ] Desligue "Iniciar o descanso sozinho…": ao concluir, aparece o botão **Iniciar descanso**?
- [ ] Compartilhe 3 conquistas diferentes seguidas (abrir, fechar, abrir outra): sempre a central nova?
- [ ] Central de compartilhamento: Faixa + "Mostrar meu primeiro nome" — o nome fica dentro da faixa, centralizado, em Stories, Feed e Quadrado?
- [ ] Botão redondo do assistente bem visível em todos os temas (principalmente Clássico e Vinho)?
- [ ] Segure o dedo no clima, na semana e nos cartões do Início: **não** abre o menu de copiar. Na conversa do assistente, ainda dá para copiar?
- [ ] Role todas as abas até o fim: rolagem fluida, com o efeito de fim de tela do Android e sem recarregar a página ao puxar para baixo?

## 4c. Correções da Beta 35
- [ ] Troque os dias de musculação no **celular**. Abra o **computador**: os dias e treinos novos aparecem lá? Registre algo no computador e confira que o celular **não** volta ao plano antigo.
- [ ] Com plano de corrida, marque **dor no joelho** (Perfil ou assistente). Abra um treino: os blocos agora descrevem **caminhada** (não tiros nem ritmo)? Tire a dor: o treino original volta?
- [ ] Musculação com **3 dias alternados** (ex.: seg/qua/sex): os treinos são Superior · Inferior + Core · Corpo inteiro? Algum passa de ~90 min?
- [ ] Assistente → limpar conversa: pede confirmação? (O mesmo vale para excluir sugestão e bloquear aluno no painel.)
- [ ] Com uma janela aberta, quando aparece um aviso, ele fica **visível no topo** (não atrás da janela)?
- [ ] Desafio temático com duas formas de login (Google e e-mail/senha): você aparece **uma vez só** na lista de participantes?
- [ ] Textos do app: aparecem "para" e "vamos" (não "pra" e "bora")?

## 4b. Vídeos e créditos
- [ ] Abra um exercício com vídeo (no Treino e na Biblioteca). O vídeo aparece sem a barra do YouTube, com os controles do MetaTreino embaixo? Pausar, velocidade, volume e a barra de posição funcionam?
- [ ] Ao terminar, o vídeo recomeça sozinho (sem sugestões)? Tocar na imagem não abre o YouTube?
- [ ] Anote se o título do YouTube aparece no começo ou ao pausar (limitação do YouTube).
- [ ] Painel → Vídeos → Parceiros e créditos: cadastre um parceiro de teste, marque 2 vídeos e deixe o WhatsApp desmarcado. Na ficha do aluno aparecem nome e Instagram, **sem** o telefone?
- [ ] Marque "Biblioteca" para esse parceiro: aparece a linha "Vídeo: Nome" na lista da Biblioteca?
- [ ] Edite (tire o Instagram) e depois exclua o parceiro. O vídeo continua abrindo normalmente?

## 5. Fichas de musculação
- [ ] Ao abrir o app, apareceu "Revisei a montagem dos seus treinos…"? (Só aparece uma vez e só se o plano precisava de ajuste.)
- [ ] Em Treinos, cada grupo começa por um exercício principal (peito: supino ou flexão; costas: puxada; pernas: agachamento ou leg press)?
- [ ] Os exercícios que você já fazia como principais (e as cargas) continuam lá? As trocas feitas à mão continuam?
- [ ] Crie um plano novo (Perfil → Meu plano → refazer) com o seu equipamento. Faz sentido para você como treinador? Algo repetido ou fora de lugar?

## 6. Corrida
- [ ] Registre uma corrida com tempo e distância. O ritmo saiu certo (nunca "x:60/km")?
- [ ] Edite a distância no Histórico usando vírgula (ex.: 5,2). Salvou certo?
- [ ] Se tiver prova marcada: na semana depois da prova, o plano é de recuperação (sem longão forte nem ritmo de prova)?

## 7. Início, Histórico e Progresso
- [ ] Antes de treinar hoje, a **sequência** no Início mostra os dias até ontem (não "0 dias")?
- [ ] O card do Início não diz "seu próximo treino é amanhã" quando o treino de hoje ainda não foi feito?
- [ ] Histórico: os números de página funcionam? Os detalhes abrem?
- [ ] Progresso → Desempenho e Recordes abrem sem demora?

## 8. Painel do administrador (só para você)
- [ ] A lista de alunos e o perfil de um aluno abrem normalmente, com nome, foto e WhatsApp?
- [ ] Ajustar dias, bloquear/reativar e remover um aluno de teste continuam funcionando?

## 9. Aparência
- [ ] Troque para cada tema (Zepp, Aurora, Clássico, Oceano, Claro, AMOLED, Rubi, Areia). Algum texto ficou ilegível? O cronômetro de descanso combina com o tema?
- [ ] Algo ficou cortado ou fora da tela (principalmente em celular pequeno)?
- [ ] No computador: Tab percorre os botões com um contorno visível?

## O que mandar para o treinador
Modelo do celular · sistema · o que testou · o que deu errado (com print) · o que achou confuso.

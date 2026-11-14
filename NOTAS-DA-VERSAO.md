# MetaTreino 2027.1 Beta 36 — Acabamento visual, séries e compartilhamento

Detalhes técnicos em `RELATORIO-BETA36.md`. As regras do Firestore não mudaram nesta versão.

1. **Início com o céu visível.** A foto do perfil subiu para a linha do METATREINO (tocar nela abre o Perfil). Ao lado da saudação ficou uma janela com uma paisagem em camadas: serra, montanha com a bandeira, sol, lua, estrelas e nuvens na frente do sol.
   - A cena acompanha o horário e o clima real (nublado, chuva, garoa, tempestade, névoa, neve).
   - Sem dados de clima, mostra só o horário.
   - As datas especiais continuam: dia da prova, véspera, aniversário, Ano-Novo e Natal.
   - A altura da tela inicial não mudou.
   - Com a **capa do mural** ligada, a capa é a imagem do topo e a cena do céu não é desenhada atrás dela. O logo do mural continua substituindo o "M" em todas as telas.
   - O clima nunca encosta no nome do app: se a descrição ("Tempestade", "Céu limpo"…) não couber com folga, fica só o ícone e a temperatura.
2. **Fundos decorativos das abas.** Cada desenho agora fica numa faixa no topo da aba e termina antes do primeiro cartão. Não passa mais atrás de cartões nem cruza a bandeira dos Desafios, e aparece também no AMOLED. A curadoria aba por aba:
   - **Treinos:** substituído (barra com anilhas; na corrida, uma pista em curva).
   - **Biblioteca:** substituído (fichas empilhadas com o vídeo).
   - **Plano:** melhorado.
   - **Desafios:** melhorado.
   - **Perfil:** mantido (pessoa e arco de evolução), redesenhado e só no topo.
   - **Histórico:** mantido (relógio), pequeno, ao lado do título.
   - **Progresso:** mantido (gráfico subindo), pequeno, ao lado do título, nunca atrás dos gráficos.
   - **Painel do administrador** e telas de **montar plano** (musculação e corrida) ganharam desenhos próprios: prancheta com a lista de alunos; ficha com halter e lápis; percurso com largada e bandeira. Antes elas mostravam o desenho da aba de onde você veio.
   - A cena do Início tem tamanho fixo no celular: não pula mais ao tocar em Início ou trocar Musculação/Corrida.
   - A opção "Fundo decorativo" continua ligando e desligando tudo.
3. **Registro de séries.** Cada série tem um botão **✓ Concluir**:
   - O descanso só começa depois de uma série concluída. Abrir o exercício ou adicionar uma série vazia não inicia descanso.
   - A última série prevista não abre descanso: aparece um aviso de que o exercício acabou.
   - Mudar carga ou repetições nunca mexe no cronômetro.
   - Nova opção no próprio registro: **"Iniciar o descanso sozinho ao concluir a série"** (vem ligada). Desligada, aparece o botão **Iniciar descanso**.
   - Quem já tinha o hábito de tocar em "+ Nova série" continua funcionando: a série anterior é concluída.
   - Registros antigos não mudam.
4. **Compartilhar conquistas sempre abre a central nova.** Saiu o link "Modelo clássico", que levava à interface antiga. Um erro ao montar o card agora vira um aviso, sem trocar de tela.
   - Abrir outra conquista começa limpo, sem a foto e o zoom da anterior.
   - Se o app abrir com arquivos de versões diferentes no meio de uma atualização, ele recarrega uma vez.
5. **Nome na faixa.** Com "Faixa" e "Mostrar meu nome", o nome fica dentro da faixa, centralizado, numa linha própria. Nome longo diminui até caber. Vale para todos os formatos e tipos de card.
6. **Botão do Meta Assistente.**
   - O ícone usava a mesma cor do fundo do botão (verde sobre verde no Clássico) e agora usa a cor de texto dos botões principais.
   - Um anel na cor do fundo separa o botão de cartões e desenhos.
   - Posição, tamanho e comportamento continuam iguais.
7. **Seleção de texto.** Segurar o dedo em botões, cartões, clima, saudação, rótulos e status não abre mais o menu de copiar. Continuam copiáveis:
   - campos de digitação;
   - conversa com o assistente;
   - recado do treinador;
   - anotações do dia;
   - instruções da ficha;
   - créditos dos vídeos;
   - painel do administrador.
8. **Rolagem.** Fechar uma janela não faz mais a tela pular para outra posição (o navegador devolvia a tela para onde ela estava quando a janela abriu). O efeito nativo do Android no fim da tela voltou, e o puxar-para-atualizar continua bloqueado. As faixas que rolam para o lado não puxam a tela nem o gesto de voltar. A barra de abas ficou mais leve de desenhar.
9. **Avisos.** Trocar Musculação/Corrida várias vezes não empilha mais "Trocado para…" na tela: o aviso novo substitui o anterior (no máximo 3 avisos ao mesmo tempo).
10. **Paletas dos temas.** Cada amostra tem moldura própria e fundo neutro, e não pega mais o tom do cartão em volta.

# MetaTreino 2027.1 Beta 35 — O que faltava da auditoria

Detalhes técnicos em `RELATORIO-BETA35.md`. **Publique o `firestore.rules` novo** (Console do Firebase → Firestore → Regras → Publicar): as regras mudaram nesta versão.

1. **Plano trocado num aparelho não volta mais atrás no outro.** Trocar dias, objetivo ou treinos no celular agora vale também no computador, mesmo que o computador grave algo depois. Vale o plano alterado por último. O histórico continua sendo somado como antes.
2. **Corrida com dor no joelho, tornozelo ou lombar.** Antes, só o nome do treino virava "Caminhada", mas os blocos continuavam falando de tiros, ritmo e longão. Agora o treino inteiro vira caminhada leve (aquecimento, caminhada principal, volta à calma, sem ritmo-alvo). Quando a dor sai, o treino original volta igual.
3. **Musculação 3 dias por semana.** Com pelo menos um dia de folga entre os treinos (ex.: seg/qua/sex), a divisão passa a ser **Superior · Inferior + Core · Corpo inteiro**: cada grupo grande é treinado 2× na semana, com o mesmo tempo de academia. Com dias seguidos, continua a divisão antiga. Nenhum treino passa de 90 minutos. Planos já montados só mudam quando o aluno gerar um plano novo.
4. **Desafios temáticos com duas formas de login.** Quem entra com Google num aparelho e e-mail/senha no outro aparece uma vez só na lista de participantes. Na lista do painel, registros repetidos de antes são mostrados uma vez (vale o mais avançado).
5. **Confirmação antes de apagar.** Limpar a conversa do assistente, excluir uma sugestão e bloquear um aluno agora pedem confirmação.
6. **Excluir conta apaga tudo.** Excluir a própria conta (ou o administrador excluir um aluno) agora apaga também os dados do outro login ligado ao mesmo e-mail e o vínculo da conta. Antes podiam sobrar.
7. **Acessibilidade.** Botões só com ícone (✕, 🗑️, ➤…) ganharam nome para leitores de tela. Cartões e linhas que abrem algo ao tocar passam a funcionar com Tab e Enter, com contorno de foco visível. Para quem usa o toque, nada muda.
8. **Avisos sempre visíveis.** Com uma janela aberta, o aviso (ex.: "Salvo") aparece no topo da tela em vez de ficar escondido atrás da janela.
9. **Linguagem padronizada.** Os textos do app passaram a usar "para", "para o" e "vamos" no lugar de "pra", "pro" e "bora" (409 trocas). O assistente continua entendendo quem escreve "pra" e "bora".

# MetaTreino 2027.1 Beta 34 — Mesmos dados em todos os aparelhos, vídeo limpo e créditos de parceiros

Detalhes técnicos em `RELATORIO-BETA34.md`.

1. **Mesmos dados no celular e no computador.**
   - **Causa:** neste projeto, entrar com Google e entrar com e-mail e senha cria duas contas diferentes no Firebase, cada uma com seus próprios dados. Quem usava Google no celular e e-mail/senha no computador (ou o contrário) via dois históricos.
   - Agora o app reconhece a pessoa pelo **e-mail verificado** e usa um único lugar para os dados, qualquer que seja a forma de login.
   - Na primeira vez, junta o que estava separado (treinos, séries, peso, conquistas, recordes e o histórico antigo do arquivo anual). Nada é apagado.
2. **Os dois aparelhos abertos ao mesmo tempo.**
   - Treino, corrida, perfil e conquistas feitos num aparelho aparecem no outro em poucos segundos.
   - Antes, só os treinos do histórico eram juntados, e só depois da tela inicial.
3. **Internet lenta ou caindo.**
   - Num aparelho novo, sem cópia dos dados e sem resposta da internet, o app agora espera e oferece "Tentar de novo". Antes, abria o questionário de conta nova, e preencher gravava uma conta vazia por cima da real.
   - O que foi registrado sem internet é enviado quando a conexão volta, sem apagar o que o outro aparelho registrou nesse meio-tempo.
4. **Perfil → Conta e dados → Sincronização entre aparelhos.** Mostra:
   - a conta e a forma de login;
   - se os dados estão unificados;
   - a última gravação confirmada na nuvem e se há algo esperando envio;
   - o botão **Sincronizar agora**.
5. **Vídeos no modo limpo.**
   - O vídeo aparece sem a barra de controles do YouTube.
   - Abaixo da imagem ficam os controles do MetaTreino: tocar/pausar, posição, tempo, velocidade (1×, 0,75×, 0,5×) e volume. Os botões de som e de tela cheia continuam.
   - O vídeo repete sozinho, então não aparecem sugestões de outros vídeos no fim.
   - Tocar na imagem pausa ou continua e não leva para o YouTube.
   - O botão "YouTube ↗" agora aparece só para administradores.
   - **Limitação do YouTube:** o título e o logotipo podem aparecer por alguns segundos no começo ou ao pausar. Desde 2018 o YouTube não deixa escondê-los por configuração, e cobri-los iria contra os termos dele.
6. **Créditos dos vídeos (parceiros).** Em Painel → Vídeos → **Parceiros e créditos**:
   - Cadastre o profissional uma vez: nome, empresa, Instagram, WhatsApp, site e texto do crédito.
   - Marque em quais vídeos ele aparece.
   - Escolha o que os alunos veem na **ficha do exercício** e na **Biblioteca**, separadamente.
   - O WhatsApp só aparece se você marcar.
   - Editar ou excluir o parceiro atualiza todos os vídeos dele e **nunca mexe no link do vídeo**.
   - Vídeos sem créditos e o crédito antigo (link do perfil) continuam funcionando como antes.

7. **Semana com menos tempo (corrida).**
   - Antes de aplicar, mostra como a semana fica: o que continua, o que sai e o tempo total.
   - "Aplicar" muda a semana na hora. Antes, a mudança só aparecia depois de um recálculo.
   - Dois treinos fortes nunca ficam em dias seguidos.
   - Os dias que sobram não ficam mais longos, e a semana seguinte volta ao normal.
8. **Descanso da musculação.** Agora depende do tipo de exercício e da carga (faixa de repetições), não só do objetivo. Exemplo: no emagrecimento, o agachamento tinha 45 a 60 s e passa a ter 75 a 90 s. O cronômetro usa o descanso do exercício no treino aberto.
9. **Primeira série.** O primeiro toque ("+ Registrar a 1ª série") não inicia descanso. Da segunda série em diante, "+ Nova série" encerra a série anterior e começa o descanso.
10. **Exercícios sem carga.**
    - Flexão, barra fixa, abdominais e outros exercícios com o peso do corpo pedem só repetições. Há a opção "+ Usei carga extra".
    - Isométricos pedem tempo.
    - Os recordes passam a contar repetições quando não há carga.
11. **Créditos no fim da ficha**, depois das orientações técnicas, com o título "Conteúdo demonstrativo".
12. **Segurar o dedo** em botões, abas e menus não abre mais o menu de copiar. Os textos da ficha e os campos continuam selecionáveis.

**Regras do Firestore: mudaram. Publique o `firestore.rules` novo.**
- A pessoa com e-mail verificado acessa o próprio documento de dados com qualquer forma de login.
- Coleção nova `contas`: liga o e-mail ao documento.
- Coleção nova `parceiros`: só administradores leem e gravam.
- Aluno, administrador secundário e administrador principal continuam com as mesmas permissões de antes.
- Se o app for publicado antes das regras, ele continua funcionando como na Beta 33, só sem a unificação e sem o cadastro de parceiros.

---
# MetaTreino 2027.1 Beta 33 — Auditoria geral

Versão de correções. Nenhum recurso foi removido; histórico, conquistas, preferências e permissões continuam como estavam. O relatório completo está em `RELATORIO-AUDITORIA-BETA33.md`.

1. **Segurança do painel (crítico).** O nome, o apelido, o WhatsApp e a foto que o aluno grava no próprio perfil apareciam no painel do administrador sem proteção. Um aluno mal-intencionado conseguiria rodar código na tela do administrador. Agora tudo o que vem do aluno é tratado como texto, e a foto só entra se for imagem.
2. **App abrindo em branco sem internet (crítico).** Logo depois de instalar ou atualizar, o app podia não abrir no modo avião. Corrigido no service worker, que agora também guarda o Firebase na instalação. O defeito foi reproduzido na Beta 32 e o teste passou na Beta 33.
3. **Treinos sumindo entre aparelhos (crítico).** Quando dois aparelhos (ou um aparelho sem internet) gravavam em momentos diferentes, o último apagava os treinos do outro.
   - Agora as cópias são juntadas: treinos, séries do dia, peso, conquistas e recordes.
   - O que o aluno exclui fica marcado e não volta.
   - Com o app aberto em dois aparelhos ao mesmo tempo, o treino feito num aparece no outro.
4. **Cronômetro de descanso.**
   - Conta pelo horário real: com a tela bloqueada ou o app minimizado o tempo continua certo, e ao voltar ele mostra o tempo restante na hora.
   - Ganhou os botões **Pausar/Continuar**, **−15 s** e **+15 s**, além de uma barra de progresso.
   - O som do fim é agendado na hora e toca uma vez só. Com o som desligado, nada toca.
   - A escolha "sem som" passou a ser lembrada, e há uma opção nova para **vibrar ou não**.
   - Se o app for fechado no meio do descanso, o cronômetro volta com o tempo certo.
5. **Tela sempre ligada durante o treino.** A tela fica ligada enquanto o aluno está na aba Treinos com o treino de hoje aberto, registrando séries ou descansando.
   - Ao minimizar e voltar, a tela é pedida de novo.
   - Ela é liberada quando o treino é salvo, quando o aluno sai da aba, sai da conta ou fica 20 minutos sem tocar na tela.
   - Antes, a tela apagava no meio do treino assim que um descanso terminava.
6. **Fichas de musculação revisadas.** Foram testadas todas as 768 combinações:
   - Antes, o peito do iniciante às vezes não tinha nenhum supino ou flexão, saíam dois encolhimentos no mesmo treino, e 688 combinações passavam de 30 séries por sessão.
   - Agora cada grupo começa pelo exercício principal (peito: supino ou flexão; costas: puxada e remada; pernas: agachamento ou leg press, depois posterior de coxa).
   - O **descanso varia por exercício**: mais longo nos principais, mais curto nos acessórios, no core e na panturrilha.
   - Bíceps e tríceps recebem menos exercícios que os grupos grandes. Um grupo que repete na semana não repete o volume cheio, e há um limite de séries por sessão.
   - Na força, os acessórios ficam em 8 a 10 repetições e o core em 10 a 12 (antes: 4 a 6).
   - Quem tem halteres ou academia faz o principal com carga (não com flexão ou pike).
   - Os planos já salvos são corrigidos **uma vez**, mantendo os exercícios principais (e a carga) que o aluno já usava. Trocas feitas à mão continuam.
7. **Semana certa.** A troca semanal de exercícios acontecia na quarta-feira às 21h. Agora a semana vai de segunda a domingo, no horário do aparelho.
8. **Corrida.**
   - A semana depois da prova agora é de recuperação. Antes podia virar "polimento" com longão e ritmo de prova.
   - O ritmo não aparece mais como "5:60/km".
   - Ao editar uma atividade, a distância aceita vírgula e a bike continua em km/h.
9. **Início.**
   - A sequência não zera mais enquanto o treino de hoje ainda não foi feito.
   - "Seu próximo treino é amanhã" não aparece mais quando o treino de hoje está pendente.
   - Quem faz musculação e corrida tem os dias planejados das duas somados.
10. **Outros:**
    - Tocar duas vezes em "Salvar treino" não grava em dobro.
    - Os avisos não cobrem mais o cronômetro.
    - Apelido com aspas não quebra mais o campo de editar perfil.
    - Datas de arquivos usam o dia do aparelho.
    - Há foco visível ao navegar pelo teclado no computador.
    - O app não grava mais na nuvem só por trocar de aba, o que economiza a cota do Firebase.

**Regras do Firestore: mudaram.** Publique o `firestore.rules` novo no Console do Firebase. A única mudança é que o aluno não consegue mais gravar no próprio documento um e-mail que não é o dele. As permissões de aluno, administrador secundário e administrador principal continuam iguais.

---
# MetaTreino 2027.1 Beta 32 — Escala de esforço por modalidade

1. **Frases da escala de esforço (1 a 10) conforme a modalidade.** Os nomes de cada nota (Muito leve… Esforço máximo) continuam iguais em tudo; só as frases de baixo mudaram.
   - **Corrida, caminhada e bike:** continua o teste da fala, que é o certo para esforço aeróbico. Corrigi o 2 e o 3, que tinham a mesma frase, e o 8, 9 e 10, que estavam vagos ("Muito perto do limite").
   - **Musculação:** agora usa "quantas repetições ainda sairiam" no fim das séries, que é como se mede o esforço com carga. A respiração não serve para isso: dá para conversar entre as séries mesmo tendo ido até a falha. Acima da escala aparece a dica: "Pense nas séries do treino: quantas repetições ainda sairiam?".
   - O valor salvo é o mesmo (1 a 10): histórico, gráficos e ajustes automáticos não mudam.

**Regras do Firestore:** não mudaram nesta versão (continua valendo o arquivo revisado da Beta 24).

---
# MetaTreino 2027.1 Beta 31 — Correções: zoom ao abrir, modo offline e arrastar

1. **App abrindo com zoom e barra de abas instável (corrigido).**
   - A causa era o desenho de fundo, que desde a Beta 27 passava uns 20 pixels da borda direita. A página ficava mais larga que a tela, o celular abria "ampliado" e a barra de baixo saía do lugar ao rolar.
   - Agora o desenho fica dentro da tela, e há uma proteção para nenhum elemento alargar a página de novo.
   - Conferido em todas as abas e temas: a largura da página é exatamente a da tela.
2. **Entrar sem internet.**
   - Antes, o app só entrava sem internet se o acesso tivesse sido conferido nos últimos **7 dias**. Quando o celular "achava" que tinha internet mas ela não respondia, ainda esperava até ~20 s.
   - Agora o app entra **na hora** com o acesso guardado no aparelho e confere com o servidor em segundo plano, ou assim que a internet voltar.
   - O acesso guardado vale até **30 dias sem conseguir conferir** e nunca passa da validade definida pelo treinador.
   - Se o treinador tirou o acesso, o app mostra a tela de acesso assim que conseguir conferir. Os dados do aluno ficam salvos.
3. **Arrastar no Personalizar início.**
   - A linha acompanha o dedo e as outras deslizam suavemente para o lugar.
   - A janela rola sozinha quando o dedo chega perto da borda.
   - Segurar a alça não seleciona mais o texto.

**Regras do Firestore:** não mudaram nesta versão (continua valendo o arquivo revisado da Beta 24).

---
# MetaTreino 2027.1 Beta 30 — Modo computador de verdade

1. **Modo computador** (só em tela grande com mouse; o celular não muda nada):
   - **Início em painel:**
     - faixa de números da semana no topo: treinos/meta com barra, sequência, tempo, volume (ou distância na corrida) e conquistas, todos clicáveis;
     - coluna principal com o treino de hoje, a atividade, a semana e seus treinos;
     - coluna lateral com a sugestão, os indicadores, os desafios, o plano e a frase.
   - **Treinos:** o treino aberto ocupa a coluna principal; programação e ajuda ficam ao lado.
   - **Progresso:** os gráficos de evolução ficam largos; calendário, recordes e metas ao lado.
   - **Histórico:** a lista vira linhas de tabela (nome, horário e duração, grupos), com a data fixa no topo ao rolar. Números, gráfico e arquivo ficam ao lado.
   - **Janelas:** abrem como painel à direita, com a tela de trás visível. Confirmações, medalhas e vídeo continuam no centro.
   - **Menu lateral:** o aluno aparece embaixo, com atalho para o Perfil.
   - **Atalhos:** teclas 1 a 5 trocam de aba e Esc fecha a janela.
   - As duas colunas são independentes (sem buracos) e seguem a ordem do Personalizar início.
2. **Desenho do Início:**
   - **Mais visível**, mas ainda discreto. O de outras abas também subiu um pouco.
   - **Coruja nova**, mais simpática, num galho no canto do céu e não mais em cima do morro.
   - **Árvore de Natal** simétrica, com estrela e bolinhas alinhadas.
   - O desenho também aparece no computador.

**Regras do Firestore:** não mudaram nesta versão (continua valendo o arquivo revisado da Beta 24).

---
# MetaTreino 2027.1 Beta 29 — Início que acompanha o dia e ordem dos blocos

1. **Desenho do Início acompanha o dia.** A montanha com a bandeira continua, e o céu muda:
   - **Pelo horário:** amanhecer (5h às 9h, sol nascendo atrás da montanha), dia (sol alto), fim de tarde (17h às 19h, sol se pondo) e noite (lua, estrelas e uma coruja).
   - **Pelo clima:** nuvem, chuva, garoa, tempestade, névoa ou neve. Com chuva forte o sol e a lua somem atrás da nuvem. Usa os mesmos dados do clima que o app já busca quando o aluno libera a localização: nada a mais é baixado. Sem localização, só o horário.
   - **Datas especiais:** dia da prova (linha de chegada e medalha), véspera da prova (cronômetro), aniversário do aluno (balões), Ano-Novo (fogos, 31/12 e 1/1) e Natal (árvore, 24 e 25/12). Se cair mais de uma no mesmo dia, vale nessa ordem.
   - O desenho é parado, sem animação, e não gasta bateria. Some com a opção "Fundo decorativo".
2. **Clima sem repetir.**
   - A temperatura saiu da frase de baixo e virou um selo no topo, ao lado do METATREINO, com o ícone do tempo de agora (ex.: "☁ 23° Nublado").
   - A frase ficou só com a dica ("Tempo perfeito pra treinar").
   - Com a capa de foto do mural, que esconde a linha do METATREINO, continua como antes.
3. **Ordem dos blocos do Início.**
   - Em Perfil → Personalizar início, cada bloco tem uma alça ⠿ para arrastar para cima ou para baixo. No computador, as setas do teclado também movem.
   - Vale para os blocos (incluindo o bloco de Indicadores inteiro) e para a ordem dos indicadores entre si.
   - O treino de hoje e os avisos importantes (recado do treinador, férias, aniversário, treinos pendentes) ficam sempre no lugar.
   - **Voltar ao padrão** desfaz a ordem e mostra todos os blocos de novo, com confirmação.
   - A ordem é salva na conta (vale em outro aparelho).

**Regras do Firestore:** não mudaram nesta versão (continua valendo o arquivo revisado da Beta 24).

---
# MetaTreino 2027.1 Beta 28 — Treinos sem repetição, ficha do exercício e fundos

1. **Treinos sem repetir o mesmo exercício.** Testei os 864 treinos que o app consegue montar (4 equipamentos × 3 níveis × 4 objetivos × 3 a 6 dias). Achei exercícios que eram, na prática, o mesmo no mesmo dia:
   - "Flexão Diamante" (peito) junto com "Flexão Fechada (diamante)" (tríceps);
   - Mergulho no banco junto com mergulho nas paralelas;
   - Agachamento livre sem carga junto com o goblet;
   - Agachamento sumô e sumô com pausa;
   - Duas elevações laterais ou duas roscas martelo;
   - Supino reto com barra e com halteres no mesmo treino;
   - Até 5 flexões em um treino em casa.

   Agora o repetido é trocado por outro exercício do mesmo grupo, com o equipamento do aluno. Se não houver outro, ele sai e o exercício que ficou ganha uma série, para manter o volume.
   - Séries, repetições, descanso e quantidade de exercícios por grupo **não mudaram**.
   - Os planos já salvos são corrigidos uma vez, com aviso. Exercícios trocados à mão pelo aluno não mudam, e o histórico fica igual.
2. **Sugestão de carga com um número só.** Antes, a tela inicial sugeria +4% e o registro de séries sugeria +2,5 kg para o mesmo exercício. Com halter leve, os +4% arredondados davam a mesma carga e a sugestão nunca aparecia.
   - Agora as três sugestões usam o mesmo degrau, que existe na academia: +1 kg até 12 kg, +2 kg até 40 kg, +2,5 kg até 100 kg e +5 kg acima disso.
3. **Ficha do exercício ("Ver como fazer"):**
   - Ocupa a tela toda: o vídeo fica no topo e o conteúdo ganha o espaço que ficava vazio em cima. Tocar fora não fecha mais por engano.
   - O botão Fechar fica fixo embaixo e não é mais cortado depois de sair da tela cheia.
   - O vídeo vertical ficou um pouco maior.
4. **Fundos decorativos no meio-termo:** continuam só no topo, mas maiores e bem mais visíveis que na Beta 27. O desenho do Início é novo: uma montanha com a bandeira da meta no topo, a trilha subindo e o sol.

**Regras do Firestore:** não mudaram nesta versão (continua valendo o arquivo revisado da Beta 24).

---
# MetaTreino 2027.1 Beta 27 — Fundos mais discretos e coleção na Central

1. **Fundos decorativos:**
   - Agora ficam só no topo de cada aba, perto do título, e somem aos poucos antes das listas.
   - Rolam junto com a tela, então não aparecem mais atrás de cartões, listas e botões.
   - Ficaram mais discretos e um pouco menores. A opção de desligar continua.
2. **Desenho novo do Histórico:** um relógio com seta de "voltar no tempo". O anterior tinha retângulos que pareciam cartões vazios ou botões ao lado dos treinos.
3. **Compartilhar a coleção de medalhas pela Central:**
   - "Compartilhar coleção inteira" e "Compartilhar minhas conquistas" agora abrem a Central de compartilhamento.
   - O card mostra as 5 medalhas mais recentes (desenho real do app), quantas o aluno tem de quantas, % da coleção, raras e especiais.
   - Tem os mesmos formatos, estilos e opção de foto dos outros cards.
   - O card antigo continua no link "Modelo clássico".

**Regras do Firestore:** não mudaram nesta versão (continua valendo o arquivo revisado da Beta 24).

---
# MetaTreino 2027.1 Beta 26 — Central de compartilhamento

1. **Uma Central para todos os cards.** Os botões de compartilhar que já existiam agora abrem a mesma tela:
   - Histórico (treino de musculação, corrida, bike ou caminhada), Conquistas (medalha), resumo da semana, Desafio concluído.
   - **Novos pontos:** cada recorde do Progresso ganhou um botão de compartilhar; a evolução de um exercício ganhou "Compartilhar minha evolução"; a Conquista Especial ganhou "Card com foto e formatos", ao lado do vídeo, que continua igual.
2. **Cards por tipo, com dados reais do aluno:**
   - Musculação: duração, exercícios, séries, volume levantado e grupos treinados.
   - Corrida e caminhada: distância, tempo, ritmo e velocidade. Bike: distância, tempo e velocidade média.
   - Conquista: medalha do app com o nível (rara ou especial). Desafio: medalha do desafio, dias ativos e meta.
   - Recorde: carga ou distância. Evolução: carga do início, atual e melhor, % de evolução e a curva real.
   - Semana: atividades, treinos, corridas, distância e tempo.
   - Só aparece o que existe: um treino sem séries registradas não mostra "0 séries".
3. **Formatos:** Stories e Status do WhatsApp (9:16, 1080×1920), Feed (4:5, 1080×1350) e Quadrado (1:1, 1080×1080).
4. **Fundo:**
   - Escuro (identidade MetaTreino, padrão), Claro, ou **Cores do meu tema**.
   - Ou uma foto da galeria: arrastar para posicionar, pinça ou controle para ampliar, e controle para escurecer e deixar o texto legível.
   - A foto não é enviada para lugar nenhum: fica só no aparelho até você compartilhar.
5. **Disposição:** Destaque (número grande embaixo, bom para Stories com foto), Números (centralizado) ou Faixa (painel atrás do texto).
6. **Compartilhar ou Salvar imagem.**
   - O formato, o estilo e a disposição escolhidos ficam lembrados no aparelho.
   - Se o navegador não abrir o compartilhamento direto, a imagem é baixada e o app avisa.
7. **Vídeo:** só a Conquista Especial tem vídeo animado, como antes. O botão só aparece se o aparelho consegue gravar (MP4 ou WebM).
8. **Privacidade:**
   - O card nunca mostra e-mail, peso corporal ou medidas.
   - O nome só aparece se o aluno ligar "Mostrar meu primeiro nome", e só o primeiro nome ou apelido.
   - Não há mapa de percurso: o app não registra GPS, então nada é inventado.
9. **Modelo clássico:** o card antigo continua disponível por um link na Central.

**Regras do Firestore:** não mudaram nesta versão (continua valendo o arquivo revisado da Beta 24).

---
# MetaTreino 2027.1 Beta 25 — Polimento visual, usabilidade e funcionalidades

1. **Plano alimentar:** remover, editar ou adicionar um alimento não volta mais ao topo.
   - A lista reabre exatamente onde estava (inclusive a lista interna de refeições), com a refeição aberta.
   - O foco volta para o item vizinho ou para a refeição.
   - Abrir o plano "do zero" continua começando do topo. Nada muda no que é salvo.
2. **Contraste dos 8 temas:** auditoria automática de todo texto visível contra o fundo real (camadas e gradientes), em todas as telas e nas principais janelas.
   - Textos abaixo do recomendado: de 1.836 para 140. Os que sobraram estão perto do mínimo e são de propósito discretos (dias passados ou futuros, botão desativado).
   - Ajustes, mantendo a paleta de cada tema: tom secundário (--text-mute) de todos; tom intermediário (--text-dim) de Clássico e Oceano; gradiente dos botões em Clássico, Oceano e Vinho; selecionados do Vinho; "hoje" do calendário nos temas claros; avisos; logotipo.
   - **Botões de perigo** ("Apagar dados", "Excluir conta", confirmações de exclusão) agora são vermelhos com texto branco. Antes eram texto vermelho sobre rosa.
   - **Grupos de exercícios (Treinos):** fechados não mostram mais um pedaço do conteúdo, e o conteúdo aberto fica um tom acima do cartão (profundidade coerente).
3. **Escala de esforço (RPE):** régua com 10 posições iguais, cores graduais suaves, animação curta, faixa (leve, moderado, intenso, máximo) e descrição embaixo.
   - Dá para tocar, deslizar o dedo ou usar o teclado.
   - Mesmos textos, mesmas funções (`rpeHtml`, `rpeSet`, `RPE_LBL`, `RPE_DESC`) e mesmo valor salvo, em musculação, corrida e outras atividades.
4. **Medalhas:** símbolo ~25% maior, brilho e sombra interna, medalha do detalhe bem maior.
   - Três níveis visuais: **comum** (aro simples), **rara** (aro duplo; o terço mais difícil de cada categoria) e **especial** (ornamento; conquistas secretas).
   - Cada medalha mantém seu próprio desenho e cor. Critérios e ids não mudaram.
5. **Fundos decorativos novos:** ilustrações em linha, uma por aba (Início, Treinos de musculação, Corrida, Progresso, Histórico, Desafios, Biblioteca, Perfil e Plano). O traço segue o tema e os detalhes, a cor principal.
   - Mesma opacidade discreta; não recebem toques. A opção de desligar continua.
6. **Auditoria de cliques:** nenhum `onclick` chamando função inexistente; nenhuma seta "›" sem ação.
   - O cartão "Em breve" dos Desafios era o único que parecia tocável sem fazer nada: agora abre os detalhes (item 10).
   - O gráfico semanal do Histórico agora responde ao toque (semana e valor) e usa as cores do tema.
7. **Janelas:**
   - Botão **Voltar do Android** fecha a janela aberta (antes saía da tela).
   - Tocar fora fecha, **exceto** se o aluno digitou algo não salvo: aí o app avisa e mantém a janela.
   - Aparência, Personalizar início e Áudio dos vídeos já salvam na hora: saiu o "Pronto" e entrou um ✕ no canto.
   - Confirmações de ações irreversíveis continuam iguais.
8. **Histórico:** paginação numerada `‹ 1 2 3 … 15 ›` (10 registros por página, mais recente primeiro), destaque na página atual, versão compacta para muitas páginas. Histórico completo e arquivo anual continuam lá.
9. **Treinos, Desafios e Progresso:**
   - Treinos: barra de andamento do dia ("3 de 8 exercícios registrados hoje", com estado não iniciado, em andamento ou concluído).
   - Desafios: "Para concluir: X dias ativos nos próximos Y dias (cerca de Z por semana)", ou um aviso honesto quando a meta já não cabe.
   - Progresso: o resumo diz de que período é cada número ("Últimos 7 dias" × "Desde o início").
10. **Desafios futuros:** tocar no "Em breve" abre nome, medalha, descrição, início, término, duração, objetivo (meta de dias), missões, recompensa e como participar.
    - Avisa que ainda não começou. Não há botão de participar antes da data; a contagem continua começando no dia de início.
11. **Ajuda, FAQ, Privacidade e Termos** saíram do Início e foram para o fim do **Perfil**, mais discretos. O "Dúvidas? Fale com o treinador" da tela de Treinos continua.
12. **Tela "Preparando seu plano":** os passos continuam os mesmos (reais). Saiu um dos dois indicadores girando; o de cima virou um selo da modalidade com anel que enche junto com as etapas.

**Regras do Firestore:** não mudaram nesta versão.

---

# MetaTreino 2027.1 Beta 24 — Reorganização do código (sem mudança visível)

Nenhuma tela, função, dado ou regra mudou para o aluno ou para o treinador. A versão serve para deixar as próximas mudanças mais seguras e mais rápidas.

1. **Código-fonte organizado em partes por assunto** (`fonte/app-plus/`): 20 arquivos com nomes que dizem o que têm dentro (ex.: `11-corrida.js`, `15-arquivo-anual-pdf-seus-dados.js`). Antes ficavam por número de versão. O `app-plus.js` publicado é a junção dessas partes.
2. **`fonte/montar.py`:** monta o `app-plus.js`, confere a sintaxe e confere se a versão está igual nos 5 lugares (versão diferente impede a atualização automática nos celulares). Com `--versao N`, troca a versão em todos os lugares de uma vez.
3. **Ganchos em vez de camadas empilhadas:** as funções de tela mais mexidas (Início, Treinos, Desempenho, Histórico, Perfil, Painel ADM, perfil do aluno) tinham de 2 a 7 "camadas", uma dentro da outra. Agora cada uma tem uma lista de ganchos, que rodam na mesma ordem de antes.
   - **Mais seguro:** se um gancho der erro, só ele falha; a tela continua.
   - **Mais simples:** acrescentar algo novo é uma linha `mtGancho('renderProfile', { depois(){...} })`.
   - 31 camadas viraram ganchos.
4. **Limpeza:**
   - Removidas 6 funções que não eram usadas em lugar nenhum e uma função de gráfico que estava duplicada (idêntica).
   - Removidas as marcas que sobraram do antigo "Início enxuto".
5. **`MAPA-DO-CODIGO.md`:** o que fica em cada arquivo e em cada parte, como acrescentar uma função sem quebrar nada, regras de segurança do código e o mapa das coleções do Firestore. Serve para você e para qualquer IA que for mexer no app.
6. **Conferência antes × depois:** cada tela (Início, Treinos, Desempenho, Histórico, Desafios, Perfil, Biblioteca, Plano, Painel ADM, perfil do aluno) e 8 janelas foram comparadas com a Beta 23, em 5 combinações de tema e tamanho (celular e computador), pelo HTML gerado e pela imagem. Diferenças encontradas: só o número da versão no rodapé e as marcas removidas do "Início enxuto".

---

# MetaTreino 2027.1 Beta 23 — Desempenho e Histórico mais diretos

Nada foi removido: só mudou a ordem e o que começa aberto ou fechado.

1. **Desempenho:**
   - As duas fileiras de números viraram **um bloco só de resumo**, no topo: treinos, volume, recordes, sequência atual, total treinado e melhor sequência. Antes ficavam separadas, com tamanhos diferentes. O rótulo que aparecia cortado ("Recordes (PRs)") agora é "Recordes".
   - Os gráficos de **Evolução** vêm logo depois do resumo (antes ficavam embaixo do calendário). O cartão "Evolução da corrida" vem junto.
   - O **calendário** vem em seguida, com "Ocultar/Mostrar" ao lado do mês. Recolhido, continua mostrando "X dias treinados · Y min". A escolha fica lembrada.
   - Recordes, Metas e Distribuição continuam abaixo.
2. **Histórico:**
   - Saiu o cabeçalho "METATREINO" que se repetia logo abaixo das abas Desempenho/Histórico.
   - O gráfico de volume (ou km) por semana começa **recolhido** ("Mostrar" para abrir), com o atalho "Mais gráficos em Desempenho →". A lista de treinos aparece logo.

---

# MetaTreino 2027.1 Beta 22 — Perfil organizado, login no computador e tema Vinho

1. **Perfil em grupos:** em cima continuam os dados do aluno, o progresso corporal, o módulo e o plano. As ~20 linhas soltas viraram quatro grupos que abrem com um toque:
   - **Ajustar plano:** troca rápida de equipamento ou terreno, trocar plano, encerrar plano.
   - **Treino:** meu plano, estou com dor, modo férias, minhas conquistas, rotina de trabalho e resumo da semana. Com dor ou férias ativos, o aviso aparece no cabeçalho mesmo com o grupo fechado.
   - **Aplicativo:** aparência, personalizar início, som do cronômetro, biblioteca e áudio dos vídeos.
   - **Conta e dados:** dados pessoais, relatório em PDF, seus dados, backup, trocar senha e "Avançado" (começar do zero, excluir conta).
   - "Sair da conta" continua sempre visível. Os grupos abertos são lembrados neste aparelho.
   - Nenhuma opção foi removida, só agrupada.
2. **Login no computador:** a tela de entrar agora usa a largura. À esquerda ficam a marca e três destaques do app; à direita, o formulário. No celular não muda nada.
3. **Tema Rubi → Vinho:** saiu o vermelho vivo. Agora é vinho rosado com champanhe sobre grafite quente, mais suave. Quem usava o Rubi passa a ver o Vinho automaticamente.

---

# MetaTreino 2027.1 Beta 21 — Desafios sem medalha perdida, limpeza de ex-alunos e foto mais leve

1. **Desafios temáticos:** a contagem sempre valeu desde o 1º dia do desafio, mesmo antes de o aluno clicar em "Participar". Agora ninguém perde a medalha por esquecer de clicar:
   - **Aviso nos últimos 3 dias** (Início e Desafios), para quem ainda não entrou: "Faltam 2 dias: você já tem 9 de 12 dias ativos" ou "você já cumpriu a meta, entre para receber a medalha".
   - **Resgate até 7 dias depois do fim:** quem cumpriu a meta dentro do período e não tinha entrado vê "🏅 Resgatar medalha". A meta e os dias contados são os do período do desafio; depois de 7 dias, ou sem a meta cumprida, não aparece.
2. **Painel ADM → Tamanho dos dados:** alunos sem acesso (removidos, bloqueados ou vencidos) aparecem primeiro, com a marca "sem acesso" e o total que ainda ocupam.
   - **Apagar dados** é só para o administrador principal e só para quem está sem acesso. Também aparece no perfil do aluno no painel.
   - Antes de apagar, o app baixa um **backup completo** (.json, com o arquivo anual) neste aparelho; se o backup falhar, nada é apagado.
   - A confirmação é digitando o nome do aluno.
   - Apaga da nuvem: documento do aluno, arquivo anual, participação nos desafios e cadastro de acesso.
   - O **login** do aluno só pode ser apagado no Console do Firebase → Authentication.
   - **Regras do Firestore:** uma linha nova permite ao administrador apagar a participação de um aluno em desafios (`desafiosTematicos/{id}/participantes/{uid}`). **Publique o firestore.rules desta versão.** Sem isso, o resto funciona e só a participação nos desafios fica.
3. **Seus dados:** mostra do que o documento é feito (plano de treino, foto do perfil, histórico, configurações). Quase todo o tamanho inicial é **fixo** (o plano de treino e a foto), e não cresce com o uso.
4. **Foto do perfil mais leve:** novas fotos são salvas em 160 px (antes 240 px), cerca de metade do tamanho, ainda nítidas (aparecem a no máximo ~80 px). Fotos antigas são reduzidas uma vez, ao abrir o Perfil.

---

# MetaTreino 2027.1 Beta 20 — Personalizar início e versão para computador

1. **Personalizar início** (substitui o "Início enxuto" da Beta 19):
   - Fica em dois lugares: **Perfil → Aplicativo → Personalizar início** e um atalho discreto no fim da tela inicial ("⚙️ Personalizar início · N blocos ocultos").
   - Um interruptor para cada bloco: Atividade da semana, Semana, Fase do plano, Sugestão inteligente, Desafio do mês, Desafio temático, Seus treinos, Calistenia, Frase do dia, Ajuda e contato, Aviso de acesso. Também há um interruptor para cada indicador: Peso, Alimentação, Água e Conquistas.
   - Atalhos: **Tudo** e **Só o essencial**.
   - **Sempre aparecem:** treino de hoje, avisos importantes (treinos pendentes, férias, recado do treinador, aniversário), mural e aviso de saúde.
   - Muda na hora e fica salvo na conta, então aparece igual em outro aparelho. O padrão continua sendo a tela completa.
   - Com número ímpar de indicadores, o último ocupa a linha inteira; sem nenhum, o bloco some.
   - O aviso de acesso volta sozinho quando faltam 7 dias ou menos.
   - Quem tinha ligado o "Início enxuto" continua com a mesma tela.
2. **Versão para computador:** só em tela larga com mouse (computador ou notebook, a partir de 1024 px). Celular e tablet não mudam. É o mesmo endereço e são os mesmos dados; muda só a disposição:
   - Menu lateral fixo no lugar da barra de baixo.
   - **Início, Progresso, Histórico e Perfil em duas colunas.** Cada cartão aparece inteiro, e os gráficos ficam lado a lado.
   - **Painel ADM:** números em uma linha, ferramentas à esquerda e lista de alunos à direita.
   - Janelas um pouco mais largas. Treinos, Desafios e Biblioteca ficam numa coluna central confortável.
   - Diminuindo a janela, volta ao layout do celular na hora.

---

# MetaTreino 2027.1 Beta 19 — Histórico sem perda, relatório em PDF, seus dados e início enxuto

> O "Início enxuto" (item 7) foi substituído na Beta 20 pelo "Personalizar início".

1. **Arquivo anual (nada mais se perde depois de 90 dias):** o documento principal do aluno (usuarios/{uid}) continua com o detalhe dos últimos 90 dias, para o app abrir leve. Antes de a limpeza apagar algo, o app agora grava em **usuarios/{uid}/arquivo/{ano-semestre}** (ex.: 2026-1, 2026-2): sessões de musculação e corrida, séries de cada exercício e o resumo de cargas com mais de 2 anos.
   - **Só sai do app o que a nuvem confirmou.** Sem internet, o dado continua no aparelho e o app tenta de novo depois.
   - **Proteções:** se o arquivamento falhar por 365 dias seguidos, ou se o documento passar de 85% do limite de 1 MB, volta a limpeza antiga (para nunca travar o salvamento).
   - Gravar duas vezes não duplica nada (cada registro tem a própria chave).
   - **Regras do Firestore: nada muda.** O caminho já está coberto por `usuarios/{userId}/{subdocumentos=**}`: só o próprio aluno e os administradores leem e gravam.
   - "Começar do zero" e "Excluir minha conta" apagam o arquivo também.
   - O arquivo **só é lido quando o aluno pede** (Histórico completo, gráficos do ano, relatório, backup). Abrir o app continua igual em consumo.
   - Treinos anteriores a esta versão que já tinham passado dos 90 dias não voltam (já tinham sido resumidos); o resumo de cargas dos últimos 2 anos continua nos gráficos.
2. **Histórico completo** (Histórico → cartão "📚 Histórico completo"): ano a ano, musculação (treinos, horas, volume) e corrida (corridas, km, tempo, melhor ritmo, maior corrida), caminhada e bike. Mostra também a evolução de carga dos exercícios, do primeiro ao último registro. Tocar num exercício abre o gráfico.
3. **Gráficos com anos anteriores:** no gráfico de evolução do exercício aparece "📚 Incluir anos anteriores"; com período de mais de 10 meses, as datas mostram o ano. Em Progresso → Evolução → Ano, a frequência, o tempo, os km e o ritmo passam a usar o arquivo quando ele está carregado (link "Carregar arquivo").
4. **Relatório em PDF** (Perfil → Relatório em PDF, Histórico ou Seus dados): período de 3 meses, 6 meses, 1 ano ou todo o histórico; musculação e/ou corrida; lista de sessões opcional.
   - Conteúdo: resumo; treinos e volume por semana ou mês; tabela e gráficos de evolução de carga; km por período; ritmo por corrida; maior corrida; recordes; provas; peso corporal; conquistas e todas as sessões. Páginas numeradas.
   - Gerado no próprio aparelho, sem servidor e sem custo. A biblioteca jsPDF 2.5.2 (licença MIT) vai junto do app (**jspdf.umd.min.js**) e só é baixada quando alguém pede um relatório.
   - Depois de gerado: "Baixar PDF" ou "Compartilhar" (Google Drive, WhatsApp, e-mail…, quando o aparelho permite).
5. **Seus dados** (Perfil): espaço usado do documento (barra com % de 1 MB), semestres no arquivo, data do último arquivamento e avisos. O **backup .json** agora leva o arquivo anual junto, e restaurar o backup devolve o arquivo para a nuvem.
6. **Painel ADM → 📦 Tamanho dos dados:** tamanho do documento de cada aluno (do maior para o menor, com alerta acima de 60% e de 85%), total, média e uma estimativa do download mensal frente aos 10 GB gratuitos.
7. **Início enxuto** (Perfil → Aplicativo): esconde a frase do dia, os desafios do mês, a sugestão inteligente, "Seus treinos", o cartão de conquistas, o rodapé de ajuda e o aviso de acesso (que volta quando faltam 7 dias ou menos). Ficam o treino de hoje, a semana, os indicadores e os avisos importantes. No fim da tela aparece "mostrar tudo".
8. **Correção de um erro antigo (desde a Beta 13):** quando "Feedback dos alunos" virou "Mensagens dos alunos", quatro atalhos do painel ADM pararam de aparecer: **Desafios temáticos**, **Administradores e permissões**, **Vídeos reportados** e **Calistenia**. Voltaram.

---

# MetaTreino 2027.1 Beta 18 — Ajustes visuais, mural, destaques do dia e temas

1. **Legenda da semana** (✅ feito · 🟢 parcial · 🟡 hoje · ⚪ planejado · – faltou): sempre numa linha só, alinhada; o texto se ajusta à largura da tela (antes "– faltou" caía para a linha de baixo). A grade da semana também ficou alinhada: o ✓ e as bolinhas de status ficam todos na mesma altura, com um ou dois ícones no dia.
2. **Mural e logo (painel admin):**
   - Logo e capa agora são imagens separadas (antes a foto da capa larga também virava o logo cortado de todos os cabeçalhos).
   - Prévias grandes e no tamanho real em que aparecem no app (logo no cabeçalho; capa com a saudação por cima, na mesma proporção da tela Hoje).
   - Enquadramento: zoom, ajuste horizontal e vertical; para o logo, "Preencher (corta)" ou "Inteira (sem cortar)".
   - Proporções recomendadas na tela: logo quadrada 1:1, 512 × 512 px ou maior (PNG transparente fica melhor); capa horizontal 2,4 : 1, ex.: 1440 × 600 px.
   - Avisos automáticos: imagem pequena (vai borrar), não quadrada, vertical ou larga demais, e o tamanho total (limite de 1 MB do Firestore).
   - Logo em PNG com fundo transparente mantém a transparência (antes virava JPEG com fundo preto).
   - A capa é salva na proporção real da tela (2,4 : 1; antes 2 : 1, com corte extra que o admin não via). Dados no formato antigo continuam funcionando.
3. **Balão do Meta Assistente:** cada aviso aparece uma vez, por 5 a 9 segundos (conforme o tamanho do texto), e some com suavidade. Trocar de aba não o faz voltar. O botão continua colorido; tocando nele, o assistente abre começando pelo aviso. Um aviso novo aparece uma vez.
4. **Destaques automáticos no calendário:** ao abrir um dia, aparecem os destaques gerados pelos registros: treino em TPM, com cólica, com dor ou no modo leve; carga que subiu (de → para); recorde; treino puxado; prova; melhor marca na corrida; maior distância; meta da corrida; volta depois de pausa; conquistas do dia. Cada um pode ser removido (✕) ou levado para a anotação (✏️), onde se edita e acrescenta. Dias com destaque ganham uma marca discreta ✦. **Nada novo é gravado no banco** — os destaques são calculados na hora a partir do que já está salvo; só ao remover um destaque fica uma marca de poucos bytes.
5. **Temas novos:** **Rubi** (escuro · grafite e vermelho) e **Areia** (claro · areia e verde-petróleo). Agora são 6 noturnos e 2 claros. Os ajustes de contraste do tema claro passaram a valer para todos os temas claros.

---

# MetaTreino 2027.1 Beta 17 — Conquistas e Conquista Especial

Nada mudou nos critérios, ids, datas, desbloqueio ou progresso: só a apresentação.

1. **Detalhe da conquista:** a medalha entra com uma animação suave, brilho discreto ao redor, um anel de luz e 8 partículas que aparecem uma vez. O nome ganha destaque. Data, categoria, coleção, navegação ‹ › e compartilhamento continuam iguais. Não é a celebração de desbloqueio (o fundo escuro e a festa continuam só no momento do desbloqueio). Conquistas secretas usam a cor de destaque.
2. **Conquista Especial em duas etapas:** o cartão (tela Conquistas) agora abre só a conquista, em tela cheia, com a animação acelerada (~3 s): símbolo, nome de quem recebeu, título, mensagem, data e marca MetaTreino. Botões: **✨ Reviver minha história** (destaque), Compartilhar e Fechar. O texto do cartão diz que a história é opcional.
3. **História com controles:** pausar/continuar, velocidade 1x, 1,5x e 2x (muda de verdade a espera e as transições), pular frase e pular história (vai direto para a conquista, sem fechar). Barra de progresso das frases. Teclado: espaço pausa, → pula frase, Esc fecha. Pausar congela o tempo: nenhum timer avança em segundo plano.
4. **Final:** o mesmo palco animado da Beta 13 (sem segundo mecanismo), com "Guardar para sempre" e "Compartilhar".
5. **Revelação automática:** acontece uma vez por conquista. A marca agora fica também na conta, então não se repete em outro aparelho. Se o administrador alterar a conquista, ela é revelada de novo, uma vez.
6. **Compartilhar:** quem recebeu passa a poder compartilhar a própria conquista (vídeo 9:16 ou imagem), usando só símbolo, nome, título, mensagem e data — nunca o e-mail. O compartilhamento do administrador continua igual.
7. **Desempenho e acessibilidade:** um palco por vez; a animação para ao fechar, quando o app vai para segundo plano e 30 s após o fim; ao sair da história nada fica agendado; Wake Lock liberado ao fechar. Com "movimento reduzido" no aparelho, sem animações (o quadro final aparece direto e as frases trocam sem transição). Texto alternativo para leitores de tela. Em telas baixas o quadro encolhe para os botões não cobrirem o conteúdo.
8. **Bug antigo corrigido:** em qualquer compartilhamento de imagem com aspas no texto (ex.: "Compartilhar esta conquista"), o botão "Compartilhar agora" não fazia nada. Agora funciona.

---

# MetaTreino 2027.1 Beta 16 — Ajustes e correções

1. **Atividade da semana — Ocultar / Mostrar:** o texto voltou (a seta da Beta 13 saiu), num rótulo pequeno e discreto ao lado do título. Mostra "Ocultar" com o conteúdo aberto e "Mostrar" quando recolhido. Mesma animação; a escolha é lembrada. "Seus treinos" não mudou.
2. **Atividade da semana — clique:** o cartão inteiro abria os gráficos, inclusive o título e o "X de Y treinos". Agora só a área dos anéis/legenda abre os detalhes; título e quantidade são apenas informativos.
3. **Tom de pele dos emojis:** a função central (Perfil → Aparência → Tom dos emojis) só conhecia 14 emojis. O card "Treino de hoje" usa 🦵 🦶 🧗 🙆 🤷, que ficavam sempre amarelos. A lista foi ampliada na mesma função, para todos os emojis de pessoa/mão/corpo que aceitam tom. Vale para o app inteiro e também para as imagens de compartilhar treino/semana. Emojis sem variação de tom (🦾 🔥 🏆…) não mudam.
4. **"Como fazer" sem vídeo:** Treinos, Biblioteca e Meta Assistente usam a mesma ficha. Com vídeo, nada mudou. Sem vídeo, não abre mais o YouTube sozinho: mostra o aviso "Ainda não há vídeo disponível para este exercício", a explicação de que o aluno será direcionado ao YouTube e o botão "Buscar vídeo no YouTube" (busca pelo nome exato + "como fazer execução correta"). As instruções em texto continuam logo abaixo. Se o treinador cadastrou um link que não é do YouTube, o botão vira "Abrir demonstração".

---

# MetaTreino 2027.1 Beta 15 — Ajustes de plano

- **Prova alvo removível:** na configuração da corrida, quando há data, aparece o botão "✕ Sem prova (remover data)". Ele limpa a data e o horário (no celular o campo de data não tinha como ficar em branco). Ao salvar, o plano deixa de ter polimento e dia da prova.
- Remover ou trocar a data pelo Meta Assistente ("não tenho mais prova") agora refaz a semana na hora.
- **Encerrar plano de musculação:** Perfil → "Encerrar plano de musculação (manter histórico)", igual à opção que a corrida já tinha. Histórico, cargas, recordes, fotos e conquistas ficam. Com plano de corrida ativo, o app passa a mostrar a corrida. Sem plano, a musculação mostra uma tela própria com "Montar plano de musculação" e "Ver histórico".
- O botão da corrida passou a se chamar "Encerrar plano de corrida (manter só registros)".
- Meta Assistente: entende "qual meu treino de hoje?". Com a musculação ativa, "por que o treino de hoje?" não cai mais na resposta da corrida.

---

# MetaTreino 2027.1 Beta 14 — Corrida do iniciante ao avançado

O módulo de corrida não foi recriado: o plano continua no mesmo formato (treinos com aquecimento, principal e desaquecimento), com o mesmo histórico, as mesmas telas e as mesmas integrações. O que mudou é *como* cada semana é montada.

## Como funciona agora
- O plano é gerado **semana a semana**. Ao fim de cada semana o app avalia: treinos feitos x planejados, se foram completados, esforço (1–10), cansaço, pausas e bike/caminhada da semana. Só então decide **uma** mudança: subir volume (no máximo ~10%), deixar os treinos de qualidade um pouco mais longos, manter ou aliviar.
- Tudo é calculado em **minutos de corrida**. Km e ritmos só aparecem quando há dados confiáveis.
- Hierarquia igual ao resto do app: **retomada > recuperação/cansaço > progressão > normal**.

## Seis níveis
Iniciante (caminhada + corrida em 7 estágios até 10 min sem parar) · Iniciante avançado (corrida contínua de 10 → 30 min) · Intermediário · Intermediário avançado · Avançado · Competitivo.
- O nível considera tempo correndo sem parar, minutos por semana, regularidade, experiência, esforço nos treinos leves e, nos níveis altos, resultado de prova/teste. Não é só distância.
- Sobe de nível apenas com evolução comprovada nos registros (critérios visíveis no painel e no assistente), com no mínimo 3 semanas no nível e nunca perto da prova.

## Avaliação inicial (tela "Bora correr?")
Objetivo (agora com **Começar a correr** e **Condicionamento**), experiência, quanto corre sem parar, km por semana, um tempo recente (opcional, em h:min:seg), tempo por treino e no treino longo, se está parado, dores/limitações, dias, prova, terreno. O ponto de partida aparece na hora, com avisos de prazo curto e de meta acima do nível. Iniciante não faz teste de desempenho.

## Treinos
Caminhada ativa, caminhada + corrida, regenerativo, corrida contínua, leve, longão, fartlek, subida, tempo run, limiar, tiros longos, tiros curtos, velocidade, ritmo de prova, dia da prova e semana de recuperação. Cada sessão mostra aquecimento, principal, desaquecimento, duração, distância (quando há ritmo confiável), intensidade, **por que este treino** e orientações.
- Cada tipo tem nível mínimo: iniciante nunca recebe tiros, mesmo escolhendo maratona.
- Com limitação informada, saem subidas e tiros curtos/velocidade.
- O treino respeita o tempo disponível.

## Periodização
Adaptação → Resistência → Velocidade e ritmo → Preparação para a prova → Polimento (1 semana para 5/10 km, 2 para 21 km, 3 para 42 km) → Recuperação pós-prova. Semana de recuperação a cada 4 (exceto perto da prova). Sem prova, ciclos de 4 semanas.

## Situações reais
- **Perdeu um treino:** segue o de hoje, sem compensar. Se foi o longão, pode trocar — nunca os dois.
- **Retomada** (7+ dias sem correr): 1 a 4 semanas conforme a pausa (10 dias: 1 semana a ~70%; 2 meses: 4 semanas de 40% a 85%), só treinos leves. Pausas de 90+ dias descem um nível. Os ritmos calculados também descontam a pausa.
- **Esforço muito alto / treino não completado:** o resto da semana fica leve na hora.
- **Não consegue completar:** o plano alivia (estágio anterior, menos minutos ou menos volume).
- **Semana com menos tempo:** botão na tela Treinos reorganiza só aquela semana.
- **Prova:** a semana da prova tem o dia da prova e nada pesado na véspera.

## Integração
- Treino de qualidade e longão evitam o dia seguinte ao de pernas na musculação; quando não dá, o treino vira leve e o motivo aparece.
- Com plano de musculação de 3+ dias, níveis até Intermediário avançado têm no máximo 1 treino de qualidade por semana.
- Bike e caminhada contam como carga complementar, não como corrida.

## Ritmos
Calculados pelo método VDOT (Jack Daniels) a partir de: tempo informado ou prova (confiança alta), treino forte registrado (média) ou ritmo dos treinos leves (baixa — avisado como aproximação). Sem dados, os treinos vão por esforço. Iniciantes treinam por esforço e tempo.

## Registro
Tempo em **horas, minutos e segundos** com ritmo (min/km) e velocidade (km/h) calculados na hora. Pergunta se completou o treino e se correu sem parar. Iniciantes podem marcar "Não medi a distância". Valores impossíveis são recusados.

## Painel de evolução
Em Treinos → Evolução e em Progresso → Evolução da corrida: km e tempo da semana e do mês, tempo total, frequência, cumprimento do plano, km por semana, ritmo médio por semana, maior corrida sem parar, melhores marcas (3/5/10/21/42 km) **registradas** separadas das **estimadas**, ritmos de treino, metas, critérios para o próximo nível, histórico de provas e "como o plano se ajustou". Recordes, provas e resumo semanal ficam guardados mesmo depois da limpeza de 90 dias.

## Metas
10, 20 e 30 min sem parar · 3 km · 5 km · melhorar os 5 km (−3%) · 10 km · 21 km · 42 km. Só se conquistam com registros reais; as maiores mostram a preparação exigida (ex.: 21 km pede 10 km concluídos, longão de 95 min e regularidade).

## Meta Assistente
Explica com os dados do aluno: por que o treino de hoje, o que está desenvolvendo, por que a carga mudou, quando vai avançar, se é hora de recuperar, como está a meta (com estimativa só se houver dados) e quais são os ritmos. Durante a retomada, o cartão da Home e o assistente usam o mesmo cálculo da corrida.

## Administração
No perfil do aluno: nível, fase, última corrida, média semanal, cumprimento, próxima meta, confiança dos ritmos, alertas de cansaço e o painel completo (somente leitura). Mesmas permissões de antes; nenhuma regra do Firestore mudou.

## Alunos atuais
O plano antigo é convertido automaticamente na primeira abertura, usando o nível antigo e o histórico real. Histórico, totais e prova são mantidos. A tela Treinos sugere refazer a avaliação para mais precisão.

---

# MetaTreino 2027.1 Beta 13 — Correções e ajustes prioritários

## 34. Retomada após pausa
- Uma só fonte de verdade (`estadoTreino()`) para TODAS as recomendações, com hierarquia: **1. Retomada → 2. Recuperação/fadiga → 3. Progressão → 4. Normal**. A de maior prioridade vence em todo o app.
- Retomada = pausa de **7 dias ou mais**; vale por até 2 semanas depois da volta (semana 1 e semana 2). Pausa de 4–6 dias não é mais tratada como retomada.
- A carga parte de ~70%, mas é **ajustada**: +5% se a pessoa treinava com regularidade antes, +5% avançado, −5% iniciante, −5% a cada faixa de pausa longa (21, 42, 90 dias). Limite 55–85%. Semana 2: +15%.
- Usa a **última carga real** de cada exercício antes da pausa e o número de séries que a pessoa fazia (uma série a menos na semana 1).
- Durante a retomada nada sugere subir carga: card do treino, dica no registro de séries, primeira série já preenchida com a carga de retomada (editável), card da Home, corrida (60–70% do volume, sem tiros) e Meta Assistente.
- O Meta Assistente entende "fiquei 10 dias sem treinar, como volto?" e mostra o plano com as cargas da pessoa. Qualquer resposta que fale em subir/manter carga ganha antes o aviso da retomada.
- Removido o "Mantenha a mesma carga" automático após treino "puxado": agora "Não suba a carga hoje; se pesar mais que o normal, reduza ~5%".

## 35. Administradores
- Tela de Administradores: quando o Firestore recusa a leitura, mostra o motivo, o UID, o e-mail e se o e-mail está verificado, com "Tentar de novo".
- Causa provável do erro: a regra reconhecia o dono só pelo UID; login por outro método gera outro UID. A regra nova aceita o UID **ou** o e-mail do dono **verificado**.
- Dois níveis: **principal** (tudo + administradores + Conquista Especial) e **secundários** (alunos, exercícios, vídeos, calistenia, desafios temáticos, conteúdo e ferramentas). Secundários não concedem/revogam administradores, não se promovem e não acessam a Conquista Especial — na tela e nas regras.
- Secundários voltam a adicionar, editar e remover vídeos e exercícios.

## 36. Regras do Firestore
- Arquivo completo `firestore.rules`. Firebase Storage não é usado pelo app → não há regras de Storage.

## 37. Feedback dos alunos
- Verificado: há envio pelo Meta Assistente ("quero mandar uma sugestão", "seria legal se…", perguntas não respondidas). A seção foi **mantida** e renomeada "Mensagens dos alunos", com explicação. Atalho "✉️ Enviar sugestão" no assistente (usa o fluxo que já existia; sem formulário novo). Coleção e registros intactos.
- Regras: quando outro aluno manda a mesma mensagem, o contador agora soma (antes era recusado).

## 38. Conquista Especial
- Nova apresentação animada: anel dourado se desenhando, emblema, nome da pessoa, nome da conquista, mensagem, data e marca MetaTreino, com partículas discretas (sem chuva de emojis).
- Campo "Nome que aparece na apresentação".
- **Ver apresentação** (prévia) e **Compartilhar conquista**: vídeo vertical 1080×1920 (8,5 s). MP4 (H.264) quando o navegador grava MP4 (Chrome atual); senão WebM, com aviso. Alternativa: imagem PNG 9:16. Usa o compartilhamento do aparelho ou salva o arquivo. Sem e-mail ou dados privados.
- Tudo exclusivo do administrador principal.

## 39. Botões de recolher
- "Seus treinos" e "Atividade da semana": mesmo botão (seta discreta ao lado do título), mesma direção e mesma animação.

---

# MetaTreino 2027.1 Beta 12 — Calistenia

Modalidade completa de calistenia, integrada ao módulo de treino de força que já existia. Musculação, corrida, bike e caminhada continuam iguais.

## Como foi integrada (e por quê)
- O treino de força agora tem **Modalidade**: *Musculação tradicional*, *Calistenia* ou *Híbrido*. Fica gravada no plano de cada aluno (`setup.modalidade`).
- A calistenia usa o mesmo registro de séries, histórico, sequência, conquistas, desafios, gráficos e sincronização. Não é um segundo app nem um módulo duplicado.
- Alunos atuais continuam em Musculação. Nada muda para eles, a não ser que escolham outra modalidade.
- Para trocar: na montagem do plano (o primeiro campo agora é "Modalidade") ou em **Perfil → Modalidade**. O plano é refeito e o histórico fica.
- No botão Musculação/Corrida da Home, o nome passa a ser "Calistenia" ou "Híbrido", conforme o caso.

## Biblioteca de calistenia
- **99 exercícios** organizados em **25 cadeias de progressão**: Superior, Inferior, Core e Habilidades.
- Por nível: 26 Iniciante, 27 Intermediário, 28 Avançado e 18 Especialista.
- Cada exercício tem: nível, músculos trabalhados, como executar, erro comum, orientação de segurança, equipamentos necessários, prescrição sugerida (séries, repetições ou tempo, descanso), progressão e regressão, pré-requisitos (nas habilidades) e vídeo (cadastrável pelo painel).
- Na Biblioteca: filtro "🤸 Calistenia" com área e nível. A busca geral também encontra exercícios de calistenia.
- Habilidades com pré-requisitos de segurança:
  - **Parada de mão**: Pike push-up e Hollow grupado.
  - **Muscle-up**: Barra arqueiro e Dips negativo.
  - **Front lever**: Barra fixa pronada e Hollow body.
  - **Back lever**: Chin-up e Hollow body.
  - **Planche**: Flexão tradicional e Dips negativo.
  - **Human flag**: Barra fixa pronada, Prancha lateral com elevação e espaldar/poste.
- Habilidades só entram no plano com o objetivo "Domínio de habilidades" ou nível Avançado ou superior, **e** com os pré-requisitos cumpridos.

## Montagem do plano
- Considera objetivo (força, hipertrofia, resistência, condicionamento ou habilidades), nível, dias por semana, tempo por sessão (30–75 min), equipamentos (barra, paralelas, argolas, elásticos, apoios, banco, espaldar), limitações (sem saltos, punhos, ombros, joelhos), dor registrada e um **teste rápido opcional** (flexões, barras, dips e prancha).
- Divisões:
  - 3 dias: Full Body.
  - 4 dias: Upper/Lower.
  - 5 dias: Push/Pull/Legs + Upper/Lower.
  - 6 dias: Push/Pull/Legs ×2.
- No **Híbrido**, a academia cuida de pernas e volume e a calistenia de puxar, empurrar e habilidades.
- O administrador pode criar modelos próprios.
- Cada sessão é montada por **padrões de movimento** (empurrar horizontal e vertical, paralelas, puxar vertical e horizontal, agachar, unilateral, posteriores, glúteos, panturrilhas, core), não por troca de aparelho.
- Respeita o tempo disponível: quando precisa cortar, corta primeiro os acessórios e mantém empurrar, puxar e pernas.
- Full body em dias seguidos: o segundo dia vem com uma série a menos.
- Nunca exige equipamento que o aluno não marcou.
- Sem barra, argolas ou elástico, o plano usa um exercício de costas sem equipamento e avisa que uma barra de porta faz diferença. Puxar sem equipamento é limitado, e o app diz isso.

## Progressão e evolução
- O registro de séries ganhou "Como foi a execução?" (*limpa* ou *com ajustes*).
- **Domínio** = todas as séries no topo da faixa (repetições ou segundos), em 2 sessões seguidas, sem execução marcada "com ajustes". O critério (1 a 4 sessões) é configurável pelo admin.
- O app progride em várias frentes: mais repetições ou tempo dentro da faixa, depois a próxima variação, com menos assistência (por exemplo, sair do elástico) e mais controle.
- **Nada sobe sozinho.** Com o domínio confirmado, o app libera a próxima variação e o aluno confirma. Não dá para pular etapas.
- Quando a maioria das séries fica abaixo da faixa em 2 sessões, o app sugere voltar uma variação.
- Em calistenia, "Trocar" abre a escada de progressão: dá para voltar, avançar (se dominado) ou usar outra cadeia do mesmo movimento.
- **Nível real** (Iniciante → Especialista): calculado pela posição do aluno nas cadeias principais. Especialista só com 2 habilidades no nível máximo. O nível do cadastro serve apenas de ponto de partida (no máximo Avançado).
- Home: card "Calistenia" com nível e habilidades (etapas e o que falta para liberar).
- Progresso: card "Progressões da calistenia" com as últimas mudanças, e no painel Evolução as métricas "Calistenia (repetições)" e "Isometria (segundos)".
- A troca semanal e a rotação de bloco da musculação não mexem nos treinos de calistenia, que mudam por progressão.

## Meta Assistente
- "Minha calistenia": o que está pronto para avançar, o que está parado há mais de 3 semanas e onde vale regredir.
- "Minhas habilidades": etapa atual e pré-requisitos de cada habilidade.
- "Como fazer pistol squat" (e outros exercícios): execução, erro comum, segurança, variação mais fácil e mais difícil, com link para a ficha e o vídeo.

## Painel administrativo (principal)
- Painel → **Calistenia**:
  - uso da modalidade (quantos alunos em calistenia, híbrido e musculação, e quais habilidades estão sendo treinadas);
  - editar nível e textos e desativar exercícios;
  - adicionar exercícios novos numa posição da cadeia;
  - modelos de plano por dias e objetivo;
  - critério de domínio;
  - vídeos (a categoria "Calistenia" aparece no painel de vídeos existente).

## Testes (Beta 12)
- **800 combinações** do gerador: 4 níveis × 5 conjuntos de equipamentos × 4 frequências × 5 objetivos × 2 tempos.
  - Verifiquei: nenhum exercício sem o equipamento informado, nenhum exercício mais de 1 nível acima do aluno, habilidades só com pré-requisitos, limitações respeitadas, pernas em toda semana e equilíbrio entre empurrar e puxar quando há equipamento de puxar.
  - Resultado: **0 problemas**.
- Fluxo completo pela tela: modalidade, teste rápido, montagem, Home, Treinos, registro com qualidade, domínio confirmado, avanço (com bloqueio de pular etapas), troca semanal sem afetar a calistenia, dor no ombro removendo os movimentos de risco, Biblioteca, ficha, assistente, plano híbrido, painel com exercício novo e modelo de plano aplicado ao gerador.
- Alunos de musculação: plano e Home iguais aos de antes.
- 6 temas, telas de 320 e 390 px, sem erros no console. Regressão da Beta 10 e 11 ok. Atualização automática testada de novo.

### Não testado
- Celular Android real e PWA instalada.
- Vídeos: os exercícios de calistenia ainda **não têm vídeo cadastrado**. O aluno vê a busca no YouTube até o administrador cadastrar.
- Regras do Firestore no emulador.

### Limitações conhecidas
- O tempo de descanso é prescrito e controlado pelo cronômetro existente, mas não fica registrado série a série.
- A "execução limpa" é informada pelo aluno. O app não avalia vídeo nem movimento.

## Configuração para publicar
1. Firestore → Regras: adicionar `caliExercicios` e `caliModelos` (leitura para logados, escrita só do principal). Já está em `firestore.rules`, junto com o que ficou da Beta 10 e 11.
2. O documento `config/calistenia` (critério de domínio) usa a regra de `config` que já existe.
3. Publicar `index.html`, `app.js`, `app-plus.js` e `service-worker.js`. O app instalado atualiza sozinho.

---

# (anterior) MetaTreino 2027.1 Beta 11 — notas da versão

Continuação da Beta 10. Mesma estrutura: correções pontuais no `app.js`/`index.html` e as novidades no `app-plus.js`
(partes 12 a 17), sempre estendendo as funções existentes.

## 23. Áudio dos vídeos
- Perfil → Aplicativo → **Áudio dos vídeos**: *Iniciar vídeos no mudo* ou *Manter áudio original* (padrão = áudio original, como era antes).
- A preferência fica no estado do aluno (`state.prefs.videoAudio`), que já é salvo no Firestore junto com o resto: vale depois de sair/entrar e em outro aparelho.
- O player agora usa a **API oficial do YouTube (IFrame Player API)**: `mute=1` na abertura + `mute()`/`unMute()` no `onReady`. Botão **Sem som / Com som** no próprio player liga/desliga o som só daquele vídeo.
- Não mexe no volume do celular. Se a API não carregar, o vídeo abre do jeito antigo e ainda respeita o mudo (`mute=1`).
- **Limitação:** com o vídeo no mudo o Chrome normalmente não pede o "foco de áudio" do Android, então a música de outro app continua. Isso depende do aparelho, da versão do Android e do navegador, e **não foi testado em um celular real**. Ao ligar o som, o Android pode pausar a música — isso é do sistema.

## 24. Vídeos indisponíveis
- O player identifica pelos códigos oficiais do YouTube: **100** removido/privado · **101/150** incorporação desativada · **2** link inválido · **5** erro do player (tratado como possivelmente temporário).
- Sem internet ou carregamento muito lento **não** é tratado como vídeo removido: aparece "Não foi possível carregar o vídeo agora" com **Tentar de novo**.
- Vídeo indisponível: "Este vídeo não está disponível no momento." + **Buscar vídeo semelhante** (pesquisa no YouTube com nome, grupo muscular e equipamento) + **Avisar o treinador**.
- Em toda ficha com vídeo há também "O vídeo não abre ou está errado? Avisar o treinador" (denúncia manual, para casos que o player não detecta).
- Denúncias agrupadas por exercício (`videosReportados/{exercício}`), 1 relato por aluno (`relatos/{uid}`): o mesmo aluno não conta duas vezes; ao resolver, a contagem zera e um novo aviso reabre a ocorrência.
- Painel admin → **Vídeos reportados** (com contador de pendentes): exercício, link original, quantos alunos avisaram, quem avisou e quando, abrir o exercício, **Trocar link** e **Marcar resolvido** (só o principal).
- Pedido atendido: **apenas o administrador principal altera links de vídeos** (tela e regras do Firestore). Administradores secundários continuam vendo tudo, mas não editam links.

## 26–30. Home, gráficos, alimentação e carregamentos
- **Home**: "Seus treinos" começa recolhido com resumo (a lista completa está na aba Treinos), "Atividade da semana" pode ser recolhida, avisos longos mostram 2 linhas + "ver mais". A preferência de recolher fica salva no aparelho. A Home ficou mais curta (≈ 8% no teste) sem remover nada.
- O card de desafios não repete mais o nome do tema: em cima o desafio temático, embaixo "Níveis do mês".
- **Alimentação na Home**: próxima refeição com horário, andamento do dia (refeições marcadas) e botão **✓ Feita**. Sem dados no perfil, aparece um estado vazio explicando o que falta. No plano completo: barras com as refeições **marcadas** nos últimos 7 dias (não marcar não significa que não comeu — o texto deixa isso claro).
- **Gráficos — painel Evolução (Progresso → Desempenho)**: Frequência (com linha da meta), Tempo de treino, Peso, Volume da musculação, Corrida (km e ritmo), Caminhada e Bike (km e velocidade), conforme o que o aluno pratica. Semana/Mês/Trimestre/Ano quando faz sentido, toque mostra o valor e a data, comparação com o período anterior (ou aviso de que ainda não há período anterior), estados vazios que dizem que falta dado, não que o desempenho é ruim. Cores do tema. O gráfico antigo de "constância 4 semanas" (texto distorcido) foi substituído pela Frequência.
- **Peso no Perfil** usa o mesmo componente, com período ajustável e acesso ao histórico completo.
- **Observação honesta:** o app guarda o detalhe dos treinos dos últimos 90 dias (regra que já existia). No período "Ano", os meses anteriores aparecem sem registros e o gráfico avisa isso. Peso e volume de carga têm histórico mais longo.
- **Montagem de planos**: as mesmas etapas reais de antes, agora como lista que vai sendo concluída, nas cores do tema (antes o fundo era sempre azul-escuro, inclusive no Tema Claro). A barra conta etapas, não inventa porcentagem. Ficou mais rápida.
- **Operações**: botões mostram "Salvando…"/"Carregando…" e ignoram toque duplo (cadastro de aluno, vídeos, exercícios, mural, contato, desafios, administradores, registros de atividade). Falha de conexão gera mensagem clara.
- **Sincronização**: aviso discreto no topo quando cai a internet ("suas alterações ficam salvas neste aparelho") e quando volta ("Sincronizando…" → "Informações sincronizadas", usando o `waitForPendingWrites` do Firestore).
- **Painel admin**: se a lista de alunos não carregar, aparece o motivo e "Tentar de novo" (antes ficava em "Carregando…").
- Inicialização: **não foi alterada**.

## Ajustes pedidos
- Removida a linha "Meta Assistente" do Perfil (o botão flutuante já cobre).
- Cores que não acompanhavam o tema: os desafios "da casa" (Consistência, Evolução, Reta Final) e o ✓ de "feito" agora usam a cor do tema. Os desafios festivos (Carnaval, Páscoa, Halloween, Natal…) mantêm paleta própria de propósito.
- "Streak atual" → "Sequência atual".

## Testes (Beta 11)
Chromium (Playwright), Firebase e API do YouTube simulados localmente, 6 temas, telas de 390 e 320 px:
- preferência de áudio salva e enviada ao player (`mute=1` + `mute()`), alternância de som no player;
- vídeo removido (100), incorporação bloqueada (150), erro 5, carregamento travado e modo offline → mensagens corretas; offline não é marcado como removido;
- busca de vídeo semelhante com nome + grupo; denúncia; mesmo aluno repetindo (não conta 2×); segundo aluno (conta 2); painel mostra contagem e quem avisou; trocar link + resolver (contagem zera, ciclo avança); novo aviso reabre;
- tile de alimentação (sem dados e com plano), marcar refeição pela Home;
- todos os gráficos com dados e sem dados suficientes, toque no ponto;
- tela de montagem do plano até o fim;
- regressão da Beta 10 (fotos, desafios, admin, assistente, temas) sem erros no console;
- **atualização automática** com service worker real: Beta 11 aberta → publicada outra versão → o app trocou sozinho.

### Não testado
- Música tocando em segundo plano no Android, Chrome Android real e PWA instalada — precisa ser conferido no seu celular.
- Vídeos reais do YouTube (o ambiente de teste não acessa o YouTube) — a API foi simulada com os mesmos códigos de erro oficiais.
- Regras do Firestore no emulador.

## Configuração necessária para publicar a Beta 11
1. **Firestore → Regras**: adicionar o bloco `videosReportados` (com a subcoleção `relatos`) e trocar a escrita de `videosExercicios` para *somente o principal*. Está tudo em `firestore.rules`. Sem isso, a denúncia e o painel de vídeos reportados mostram erro de permissão.
2. Nenhuma API paga, chave ou serviço externo novo. A API do YouTube usada é a pública do player (sem chave).
3. Publicar `index.html`, `app.js`, `app-plus.js` e `service-worker.js`. O app instalado se atualiza sozinho.

---

# (anterior) MetaTreino 2027.1 Beta 10 — notas da versão

Evolução feita **sobre o código da Beta 9** (nada foi recriado do zero). O `app.js` recebeu correções pontuais;
as novidades estão em um arquivo novo, `app-plus.js`, carregado logo depois. Ele estende as funções existentes
em vez de substituí-las — se algo der errado nele, o restante do app continua igual à Beta 9.

## Arquivos

| Arquivo | O que mudou |
|---|---|
| `index.html` | barra inferior nova, tela Desafios, Progresso com seletor, Aparência, camada de CSS de acabamento, botão/banner de atualizar removidos |
| `app.js` | versão, navegação (`goTab`), fases em português, ícones das conquistas, textos corrigidos, aviso de versão removido do assistente |
| `app-plus.js` | **novo** — biblioteca, ficha/vídeo, fotos, Aparência, desafios temáticos, Home inteligente, assistente, admin, atualização automática |
| `service-worker.js` | versão nova e `app-plus.js` no cache (rede primeiro) |
| `firestore.rules` | **novo** — proposta de regras (ver abaixo) |
| `manifest.json`, ícones | sem alteração |

## Bugs corrigidos
- **Cards transparentes/embaçando ao trocar de tela.** Causa: as telas entram com animação de opacidade; durante a animação o `backdrop-filter` dos cards não enxerga o fundo, e o desfoque “entra” quando a animação termina. Os cards dentro das telas não usam mais desfoque e ganharam base opaca (mesma cor do tema). A barra inferior e os modais mantêm o vidro.
- **Exclusão de fotos.** Cada miniatura tem o próprio botão de lixeira (apaga só aquela), o visualizador diz “Apagar só esta foto”, há modo **Selecionar** para apagar várias, e “Apagar todas” ficou separado, exigindo digitar APAGAR. Toda exclusão confere quantas fotos sobraram.
- **BUILD / PEAK / TAPER** na Home → **Construção / Intensificação (ou Pico) / Consolidação (ou Polimento)**. “Streak N dias” → “Sequência de N dias”. Lógica da periodização intacta.
- Ícones de grupos musculares errados (Peito aparecia como mão/joinha, Glúteos como fruta) → desenhos próprios com o músculo destacado.
- Conquistas secretas sem ícone viravam “bolinhas” no modo de ícones de linha → todas as 70 têm medalha própria (Hora Capicua = relógio 11:11, Antes do Galo = amanhecer, Coruja Fitness = coruja…).
- Pacotes de ícones quase iguais → Linha fina, Linha e Duotone agora diferem de verdade, inclusive na barra inferior.
- Botão “Excluir/Apagar” das confirmações aparecia na cor do tema em vez de vermelho (temas Premium/AMOLED).
- Botão “Fechar” quase invisível na comemoração de conquistas no Tema Claro.
- Erros de concordância: “meus conquistas”, “aos conquistas”, “seus conquistas”.

## Navegação (5 posições)
**Início · Treinos · Desafios · Progresso · Perfil**
- *Treinos* = Sessões + atalhos para Meu plano, Biblioteca e Registrar atividade.
- *Desafios* (novo) = desafio temático, níveis do mês, conquistas, medalhas e histórico.
- *Progresso* = Desempenho e Histórico com seletor no topo (antes eram duas abas com dados sobrepostos).
- *Meta Assistente* continua no botão flutuante e também no Perfil.
- Rótulos sempre visíveis, destaque discreto, respeita a área segura do Android.

## Novidades
- **Desafios temáticos** com calendário anual automático: Projeto Ano Novo, Fevereiro em Ritmo, Desafio Consistência, Abril em Equilíbrio, Desafio Evolução, Arraiá Fitness, Sem Desculpas, Desafio Superação, Desafio Independência, Primavera Ativa, Reta Final, Natal em Movimento + especiais **Carnaval** e **Páscoa** (datas reais calculadas pela Páscoa de cada ano) e **Noite das Bruxas** (20–31/out). Missões semanais, contagem de dias, medalha exclusiva por edição, comemoração, imagem para compartilhar e histórico.
  - Meta = dias ativos, **qualquer modalidade conta**, calculada pela frequência real do aluno nas 6 semanas anteriores, com teto de 1 dia além do plano por semana. Congelada quando o aluno toca em “Participar”.
  - Participação só existe quando o aluno entra; conclusão só quando cumpre. Nada é inventado.
- **Admin principal**: criar, editar, programar, personalizar ou desativar qualquer desafio (inclusive os automáticos), definir missões, meta fixa e recompensa, e ver participação/conclusão — tudo pelo painel, sem mexer em código.
- **Biblioteca**: busca sem acento por nome, músculo ou equipamento; filtros por grupo e por equipamento; ficha técnica de todos os 123 exercícios (músculos, como executar, dicas, erro comum). Quem treina em academia não vê as adaptações com garrafa/toalha/mochila (continuam disponíveis no filtro “Peso do corpo”).
- **Vídeos**: player grande, proporção certa para vertical (Shorts) e horizontal, tela cheia (com giro para paisagem), indicador de carregamento, aviso se demorar, créditos do criador preservados.
- **Home inteligente**: um card que muda conforme o momento — iniciante, treino concluído, retomada após 4+ dias, reta final de prova, semana atrasada, recordes recentes, consistência. Pode ser ocultado no dia.
- **Meta Assistente**: “Me motive” com 50 mensagens em 9 contextos, sem repetir as 40 últimas, sempre com uma ação prática; novas análises com dados reais — mês × mês anterior, cargas (evoluindo/estáveis/caindo por exercício), consistência, corrida (ritmo, volume, alerta de aumento brusco), plano de retomada, desafio atual e “onde fica cada coisa”. Aviso proativo discreto quando faltam 1–2 dias para concluir um desafio.
- **Aparência**: seção única com **Tema Noturno** (Premium, AMOLED, Aurora, Clássico, Oceano) e Tema Claro, estilo e pacote de ícones com amostra, fundo decorativo. Todos os temas e preferências anteriores foram preservados.
- **Admin**: indicadores de engajamento reais (treinaram em 7 dias, sessões em 7 dias, parados há 14+ dias, participantes do desafio) e gestão de administradores (só o principal; o principal não pode ser removido).

## Atualização automática (botão removido)
O botão “Buscar atualização”, o banner “Nova versão disponível” e o aviso do assistente foram removidos. O mecanismo ficou **mais** automático:
a versão nova é baixada em segundo plano e aplicada sozinha quando é seguro — ao abrir o app, ou quando o aluno sai dele — nunca no meio de um treino ou formulário. O app instalado também procura versão nova ao voltar do segundo plano (no máximo a cada 30 min). Se por algum motivo a atualização ficar pendente por mais de um dia, aparece uma mensagem discreta, sem botão.

## Testes realizados
Em Chromium (Playwright) com o Firebase simulado localmente, telas de 390×844 e 320×640:
- todas as abas e telas secundárias nos 6 temas, sem erros no console e sem rolagem horizontal;
- exclusão individual, seleção múltipla e “apagar todas” das fotos (IndexedDB real): apagar 1 de 4 deixou exatamente as outras 3;
- busca e filtros da biblioteca, ficha com e sem vídeo;
- “Me motive” 6 vezes seguidas → 6 mensagens diferentes; todas as análises novas do assistente e a interpretação das frases;
- participar de um desafio, concluir, medalha no arquivo, gravação da participação;
- painel admin: criar/personalizar desafio (substitui o automático), autorizar administrador, bloqueio para quem não é o principal;
- **atualização automática ponta a ponta** com service worker real: app aberto na Beta 10, publicada uma versão nova no servidor → o app passou para ela sozinho, sem nenhum toque.

## O que NÃO foi testado / pendências
- Não testei em aparelho Android real nem com a PWA instalada (teclado aberto, barra de gestos). Recomendo testar antes de liberar para todos.
- Os vídeos do YouTube não carregam no ambiente de teste; o player foi testado só no layout.
- As regras do Firestore **não foram testadas** contra o emulador. Revise antes de publicar.
- O Firebase real não foi acessado — participação e desafios do admin foram testados com banco simulado.
- Não implementados nesta versão (avaliados, ficam para a próxima): calendário completo, lembretes configuráveis, registro de sono, desafios entre amigos, onboarding novo, relatório individual do treinador por aluno, gráficos novos do perfil, IA externa. Para IA externa, o caminho seguro é uma Cloud Function que guarda a chave da API — nunca a chave no navegador.

## Alterações necessárias no Firebase
1. Publicar regras que liberem a coleção nova **`desafiosTematicos`** (leitura para logados, escrita só do principal) e a subcoleção **`participantes/{uid}`** (cada aluno grava só a própria). Tudo está em `firestore.rules`.
2. Para a gestão de administradores pelo painel: a coleção `admins` precisa permitir escrita só ao principal.
3. Nenhum dado existente muda de lugar ou de identificador. Campos novos no estado do aluno: `eventos` (desafios temáticos) — opcional e retrocompatível.

## Publicação
1. Faça backup da versão atual publicada.
2. Substitua no repositório: `index.html`, `app.js`, `service-worker.js` e adicione `app-plus.js`.
3. Publique as regras do Firestore (Console → Firestore → Regras) depois de revisar.
4. Abra o app instalado: ele deve passar para a Beta 10 sozinho em alguns segundos (ou ao sair e voltar). Confira a versão no rodapé do Perfil.

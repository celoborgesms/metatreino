# Relatório — MetaTreino 2027.1 Beta 55 (auditoria, correções e melhorias)

Base: Beta 54. Regras do Firestore **sem mudança**. Nenhuma coleção nova; nenhum dado apagado.

## 1. O que encontrei nos vídeos e prints (causas reais)

| Sintoma | Causa encontrada | Correção |
|---|---|---|
| Musculação "De volta depois de 53 dias", 55% das cargas, mesmo com treino ontem | `estadoTreino()` (parte 10) usava o histórico de **todas** as modalidades (`mtHist`). Os dias com atividade eram 23/06, 30/06, 11/08, **27/09 (caminhada importada)**, 19/11 e 20/11. A maior pausa recente (27/09 → 19/11 = 53 dias) virou retomada da musculação. | A musculação olha só a musculação. Retomada só com base de treino antes da pausa (2+ sessões em 6 semanas). |
| Corrida: "Em retomada · semana 1 de 1 — De volta depois de 53 dias … Retomada da corrida depois de 10 dias" | O título vinha do cálculo geral (53) e o texto do plano de corrida (10 dias, informados no questionário). | O título também vem do plano de corrida. No módulo de corrida, a retomada da musculação não aparece (nem no Meta Assistente). |
| Treino de força de 30/06 importado como "Treino B — Costas + Bíceps" | A prévia marcava "contar como o treino do plano deste dia" para qualquer data: 30/06 caiu numa terça, que é o dia do Treino B. | Isso só é oferecido para atividades dos últimos 7 dias e dentro do plano atual. |
| "Atividades importadas (1)", com 4 arquivos no histórico de importações | Atividades com mais de 90 dias saem da lista do app no login seguinte e vão para o arquivo anual (regra antiga de espaço da conta). Não somem: estão no Histórico completo. Mas nada explicava isso. | A prévia avisa. A tela de Integrações mostra quantas estão no Histórico completo, e cada item do histórico técnico abre a atividade ou diz onde ela está. |
| Importar não mostrava conquistas | A janela de conquistas só aparecia depois de `finishLiftWorkout`, `saveRunLog` e `saveActivityLog`. A importação desbloqueava, mas a conquista ficava só como pendente na aba. | A importação marca o fim do registro como os outros. Ao terminar a fila de arquivos, a tela fecha e a janela de conquistas aparece. |
| "Melhor ritmo 1:18/km" (8 km em 10:25) | O registro manual aceitava qualquer número. | O app pergunta antes de salvar. Se o aluno salvar assim mesmo, a atividade entra no histórico com o selo "⚠️ confira", sem recorde e sem conquista. |
| "O app demorou para abrir" logo depois de escolher a conta do Google | O vigia de abertura (`index.html`) contava 16 s desde que a página abriu, **incluindo o tempo na tela do Google** (que abre por cima do app). | O relógio só conta enquanto o app está visível e esperando por ele mesmo. A espera do login começa quando o Google devolve a conta. Se o app abrir depois do aviso, o aviso some. |
| Tela de tema "piscando" no login | Era a **etapa 1 do cadastro ("Bem-vindo · Escolha o visual")** por meio segundo. Durante o carregamento, `state.user` já existia sem o perfil, e uma troca de aba nesse intervalo mandava para o cadastro. | Nenhuma troca de aba leva ao cadastro enquanto a conta carrega (`__mtCarregandoConta`). |
| Conteúdo escondido para o lado | Chips de Evolução, Cardio e Anatomia rolavam para o lado; os dias em Treinos também; o calendário passava 5 px da tela em 360 px; o resumo de Conquistas cortava em 320 px. | Tudo quebra linha. Teste automático em 360 e 320 px sem nenhuma rolagem lateral, exceto as sugestões do Meta Assistente (carrossel proposital). |

## 2. Conquistas e notificações

- **Antes:** abrir Conquistas marcava todas as novas como vistas, e havia dois pontos diferentes na aba Desafios (um para conquista, outro para desafio temático). Dentro da aba, nada mostrava onde estava a novidade.
- **Agora:**
  - cada conquista nova fica em "Novas" até o aluno tocar **nela** (`cqVerNova`). Tocar na medalha "Nova" da coleção também conta;
  - existe "Marcar todas como vistas", que só age quando o aluno toca;
  - o estado fica na conta (`state.conqPend` / `conqVistas`), que já sincronizava entre aparelhos;
  - a celebração depois de um registro continua marcando como visto o que ela mostrou.
- **Desafios › Novidades:** uma lista com cada coisa nova e o atalho para ela:
  - nova conquista;
  - segredo revelado;
  - nova medalha;
  - desafio concluído;
  - desafio do mês encerrado;
  - novo desafio temático.
- **A aba:** mostra um número pequeno ("3", até "9+") que soma tudo o que ainda não foi visto e some quando tudo foi visto. Progresso de desafio não gera aviso, porque mudaria todo dia e viraria ruído.
- **Atalhos da tela inicial (Conquistas, Desafio do mês):** foram mantidos, como você pediu. Eles levam ao mesmo lugar e não criam aviso próprio.

## 3. Importação, histórico e PDF

- **Um histórico só:** a atividade importada já ficava no mesmo histórico do registro manual, com o selo da origem (⌚ FIT/GPX/TCX). A lista de Integrações virou o **histórico técnico** (arquivo, data, resultado), e cada linha abre a atividade. Excluir atualiza os dois lugares, que são o mesmo registro.
- **Página de detalhes para toda atividade:**
  - **Importada:**
    - dados disponíveis (sem zeros inventados), gráfico, percurso e parciais;
    - "Dados do arquivo original": formato, aparelho, arquivo e data da importação, com o arquivo original disponível para baixar no aparelho que importou;
    - compartilhar e excluir.
  - **Manual:** resumo com modalidade, distância, duração, ritmo, esforço e origem, acima do formulário de edição.
- **Compartilhar:** a mesma Central do registro manual (Stories, Feed e Quadrado; fundos e disposições). A importada leva só o que existe: tempo, ritmo, FC média e subida, mais o percurso desenhado quando ele está no aparelho.
- **Excluir:** pede confirmação e explica o efeito. Recordes, gráficos e totais são refeitos sem a atividade. As **conquistas já ganhas continuam** (registram um momento que aconteceu, e tirar medalhas sem aviso seria pior), e as próximas passam a contar sem ela.
- **PDF:**
  - nova tabela "Por modalidade" (corrida, caminhada, bike) com sessões, distância, tempo, ritmo ou velocidade, comparação com o período anterior de mesmo tamanho e origem (relógio ou manual);
  - na lista de sessões, a FC do relógio aparece e as importadas levam *;
  - a bike mostra velocidade em vez de ritmo;
  - o melhor ritmo ignora números impossíveis.

## 4. Progresso e Treinos

- **Progresso:** sem o seletor Musculação | Corrida. A modalidade é a do Início ou do Perfil, e o subtítulo diz "Últimos 7 dias · Musculação" (ou "Corrida e cardio").
- **Separação por modalidade:**
  - o que já era separado continua: anatomia e recordes de carga só na musculação; evolução da corrida e recordes de km só na corrida;
  - agora também: calendário só da modalidade ativa e gráficos de caminhada e bike fora da musculação.
- **Distribuição das atividades:** continua sendo o único bloco que compara as duas modalidades. Esse é o propósito dele, e dá para ocultar em "Personalizar progresso".
- **Treinos (musculação):** "Registrar atividade" virou **"Importar do relógio"**, que abre Integrações e atividades. Essa tela também tem "Sem relógio? Registrar uma atividade à mão", para quem faz um cardio extra.
- **Treinos (corrida):** o registro continua no plano e no atalho.
- **Acessos à importação:** são três (Histórico, Treinos, Registrar atividade) e todos abrem a mesma tela.

## 5. Alimentação — substituição inteligente

- **Onde:** ao tocar num alimento, "🔄 Trocar por outro alimento", ao lado de mudar a quantidade e de "não vou comer".
- **Como o app escolhe:**
  - procura no **mesmo grupo** (fruta por fruta, proteína por proteína, carboidrato por carboidrato);
  - filtra pelo que combina com a refeição: lanche × almoço/jantar, para não sugerir patinho no café;
  - calcula a quantidade que rende o mesmo nutriente principal (carboidrato da fruta, proteína da carne).
- **Quando sugere:** só se as calorias ficarem perto (até ~20% ou 25 kcal) e proteína ou gordura não destoarem. Exemplo testado: Manga 195 g (140 kcal) → Mamão 365 g (146 kcal), Maçã 2 unid., Uva 280 g…
- **Antes de trocar:** mostra original × sugerido com as quantidades e a diferença de kcal, P, C e G. Só troca depois de confirmar.
- **Alcance da troca:**
  - vale só naquele dia e naquela refeição, só para o aluno (`nutriLog` é de cada conta);
  - o cardápio, o prato da casa dos outros e a lista de compras não mudam;
  - para desfazer, basta tocar no alimento trocado.
- **Restrições:** respeita vegetariano, sem lactose e sem glúten, e nunca sugere os salgados e doces de "fora da rotina". Não há cadastro de alergias específicas no app (só essas três restrições); vale criar um se você quiser.
- **Sem equivalente:** o app diz que não encontrou uma troca adequada (ex.: mel) em vez de sugerir qualquer coisa.

## 6. Anatomia e recuperação — o que fiz agora e o que fica para depois

- **Fiz agora (informativo):** a ficha de cada músculo ganhou "Seu histórico com este músculo":
  - último estímulo registrado ("ontem", "há 3 dias");
  - séries dos últimos 7 dias (já existia);
  - se uma corrida dos últimos 3 dias também exigiu o músculo (quadríceps, posteriores, glúteos, panturrilha, tibial);
  - próximo treino previsto para ele.
  - Sem percentual de "recuperado". A ficha traz uma frase dizendo que recuperação depende de volume, intensidade, sono e experiência. O aviso "Pernas ainda em recuperação" do treino de hoje já existia e já considera a corrida.
- **Deixei para depois:** um indicador de carga muscular da corrida (estimativa por km, desnível e ritmo). Fazer isso direito pede mais histórico real do que há hoje. Sem esse dado, viraria um número inventado. Um mapa anatômico completo dentro da corrida, de fato, não faz falta.

## 7. Auditoria das mensagens da tela inicial

| Mensagem | Para quê / quando aparece | Dados | Modalidade | Some quando | Ajuste na Beta 55 |
|---|---|---|---|---|---|
| Cartão inteligente: Primeiros passos | conta sem nenhum treino | histórico | ambas | 1º registro | — |
| Treino concluído | já treinou hoje | histórico do dia | ambas | dia seguinte | — |
| Retomada (musculação) | pausa de 7+ dias **de musculação** com base anterior | só musculação | musculação | 2 semanas após a volta ou "✕" (oculta hoje) | era calculada com todas as modalidades → corrigido |
| Retomada (corrida) | pausa de 7+ dias de corrida (plano de corrida) | só corridas (e caminhada no nível iniciante) | corrida | fim das semanas de retomada | título agora vem da corrida |
| Pausa curta | 4–6 dias parado | histórico | ambas | treinar | texto da corrida não fala mais em cargas |
| Prova | prova em até 21 dias | data da prova | corrida | depois da prova | — |
| Frequência | semana em risco (5ª–dom.) | dias planejados × feitos | ambas | cumprir/semana nova | — |
| Evolução | recorde nos últimos 14 dias | recordes | musculação | 14 dias | — |
| Consistência / Para você hoje | semana em dia / padrão | semana | ambas | — | — |
| Sugestão de hoje (no treino) | instrução de carga do dia | estado do treino | da modalidade | — | na retomada repetia o mesmo parágrafo do aviso de cima → agora é uma linha curta |
| "Pernas ainda em recuperação" | grupo do treino de hoje com fadiga ≥ 70 | treinos e corridas recentes | musculação | a fadiga cair | — (é a informação de recuperação que faz sentido aqui) |
| Desafio do mês / Conquistas (atalhos) | acesso rápido | progresso | ambas | — | mantidos; o aviso de novidade fica na aba Desafios |
| Frase do dia, clima, "Como está seu peso?" | secundárias | — | — | — | já podem ser ocultadas em "Personalizar início" |

Prioridade: só um cartão inteligente por vez (o mais importante vence: retomada > recuperação > prova > frequência > evolução). Os demais itens da Home já podem ser ocultados ou reordenados.

## 8. Testes

- **Novo `testes/beta55.py`:** **45 verificações**:
  - retomada por modalidade (incluindo o caso exato do vídeo);
  - importação → conquista e janela;
  - compartilhar a importada;
  - log clicável e plano só para datas recentes;
  - números impossíveis;
  - conquista vista uma a uma;
  - Novidades e o número da aba;
  - Progresso sem seletor e calendário por modalidade;
  - atalho de Treinos;
  - substituição (grupo, equivalência, confirmação, cardápio intacto, desfazer, vegetariano, sem equivalente);
  - login sem cadastro piscando;
  - vigia de abertura;
  - 360 e 320 px sem rolagem lateral.
- **Regressão:** passaram beta37–54, casa (dois celulares), registro de séries, série/descanso, cronômetro, compartilhar e acessibilidade, além dos testes Node (regras 61, sincronização 18, semana com menos tempo 34, beta35 23).
  - `beta41`, `beta44` e `beta51` foram atualizados porque testavam o comportamento antigo ("abrir marca tudo como visto", o seletor no Progresso).
  - `acabamento.py` e `beta42-conta.py` têm 3 verificações que **já falhavam na Beta 54** (conferido rodando a Beta 54). São testes desatualizados de telas antigas e não fazem parte da regressão.

## 9. Limitações e o que conferir no aparelho

- **Atividades com mais de 90 dias** continuam indo para o arquivo anual (regra de espaço da conta). Elas valem para totais, recordes, conquistas e PDF, mas não aparecem na lista dos últimos 90 dias.
- **Retomada:** quem registrou só **uma** sessão de musculação e parou não entra mais em retomada. Não há base para "as cargas de antes", então o app segue o plano normal com a orientação de carga leve dos primeiros treinos.
- **Conquistas entre dois aparelhos:** a marcação "vista" segue a mesma sincronização da conta. Se os dois aparelhos gravarem no mesmo segundo, vale a regra de mesclagem que já existe.
- **A substituição** usa a tabela de alimentos do app (≈ 100 itens), então um alimento fora dela não tem troca automática.
- **O desenho do percurso** no card só existe no aparelho que importou (o GPS não vai para a nuvem, por privacidade).
- **No aparelho real, conferir:** o login com o Google em Android e iPhone (aviso de demora e cadastro piscando) e o roteiro "Beta 55" em `ROTEIRO-DE-TESTES.md`.

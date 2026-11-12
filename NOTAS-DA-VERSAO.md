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

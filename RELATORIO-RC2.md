# Relatório técnico — 2027 RC 2 (base: RC 1, que inclui a RC 0)

**Firestore:** nada muda. Regras iguais (`testes/regras.js`). Nenhuma coleção nova. Campos novos, todos opcionais e conferidos na limpeza da nuvem:

| Onde | Campo | Para quê |
|---|---|---|
| estado do aluno | `sono` | registros de sono |
| estado do aluno | `desafioJuntos` | desafio em dupla |
| estado do aluno | `inicioPadraoRC2` | marca que a Home enxuta já foi aplicada |
| estado do aluno | `inicioBasico: 'padrao'` | modo "Padrão" da Home no Gratuito |
| atividade importada | `rpe`, `rpeFonte` | esforço percebido e de onde veio |
| atividade importada | `tipoSessao`, `estagio` | quando ligada a um treino do plano |
| configuração da alimentação | `famAlcance` | alcance das mudanças do administrador |
| perfil no documento do grupo | `perfis.<uid>.dj` | desafio juntos |

O documento do grupo já aceita qualquer conteúdo no próprio perfil (regra da Beta 49), então não foi preciso mudar regra. Registros antigos não são alterados.

**Versão:** `2027-rc.2` / "2027 RC 2", nos 5 lugares (`montar.py --versao 2`).

## 1. Diagnóstico (antes de programar)

### 1.1 Vibração
- **Onde o app vibra:**

  | Onde | Duração pedida |
  |---|---|
  | fim do descanso (`restTermina`, núcleo) | padrão 300+120+300+120+300 ms |
  | régua de esforço (parte 21) | 6 ms |
  | toque no Início (parte 28) | 8 ms |
  | gestos (parte 34) | 3 ms |
  | ligar a vibração em Som do cronômetro (`setRestVibrar`) | 120 ms |
  | Testar vibração (RC 1) | 400 ms |

  Nenhuma chamada fica dentro de função de áudio. No fim do descanso, a chamada acontece no tique de desenho, com a página visível. Com o app em segundo plano o JavaScript fica parado, então não há chamada nenhuma.
- **Confirmado:** os pulsos de 3–8 ms não giram o motor da maioria dos celulares (corrigido na RC 1). Um toque logo depois do alarme cancelava a vibração (corrigido na RC 1).
- **Relato do aluno na RC 1:** "Testar vibração" (toque direto, 400 ms) não vibra no Android, com economia de bateria, Não perturbe e perfil de som conferidos e outros apps vibrando.
- **Conclusão:** o app faz a chamada certa, no momento certo, depois de uma interação válida. Se nada acontece num toque direto, o descarte é do navegador ou do sistema. O `navigator.vibrate()` devolve `true` sem nenhuma garantia de efeito físico, e não há como o site saber se o motor girou. Há relato recente de que o Chrome no Android ignora a vibração de sites no modo silencioso. O APK (TWA) usa o Chrome, então tem o mesmo limite. Uma vibração garantida exigiria um app nativo com a permissão VIBRATE, e isso quebraria o login com Google (o Google bloqueia login dentro de WebView).
- **Decisão:** não manter um controle que promete o que não cumpre. Detalhe na seção 2.1.

### 1.2 Corrida: atividades fora do plano
- **`rAvaliarSemana` (parte 11):**
  - `diasFeitos` contava **qualquer dia com corrida**: uma corrida extra "cobria" um treino perdido;
  - o esforço dos extras entrava na média (um extra puxado podia segurar ou até recuar o plano);
  - não havia separação entre treino planejado e extra.
- **Próximo treino:** só a fadiga existente (`rFadiga`: esforço 9+ num treino leve ou extra, ou dois 8+ seguidos) reagia. Um extra 8/10 na véspera de um intervalado não gerava orientação.
- **Importação:**
  - as atividades eram salvas **sem esforço**, e o motor assumia 5/10;
  - **bug:** a atividade ligada ao plano não levava o tipo de sessão nem o estágio, então a caminhada/corrida importada do iniciante nunca contava para avançar de estágio.
- **Duplicação:** já tratada na parte 57 (mesmo arquivo, mesma chave, início a menos de 2 min; registro manual no mesmo dia com distância parecida → "complementar"). Preservado.

### 1.3 Esforço (RPE) nos arquivos
- **FIT:** a mensagem de sessão tem campos próprios: 192 `workout_feel` (0–100) e 193 `workout_rpe` (0–100, RPE×10). O leitor usado (`fit-file-parser`) não os entrega.
- **O arquivo do Zepp enviado** (Amazfit T-Rex 3 Pro, caminhada de 3,6 km em 36 min):
  - **não tem** os campos 192 e 193 nem campo de desenvolvedor de esforço;
  - tem `total_training_effect` 4,3, `total_anaerobic_training_effect` 2,6 e `training_load_peak` (campo 168) = 113, que são **cálculos do relógio**, não esforço percebido;
  - ou seja, a resposta dada no relógio não foi exportada.
- **GPX e TCX:** não têm campo de esforço percebido.

### 1.4 Importação de musculação
- Depende de o FIT ter mensagens `set` com repetições e carga, e poucos relógios gravam isso.
- O mapeamento `ATV_CAT_EX` cobre poucas categorias. A carga costuma vir vazia. Os descansos viram séries "rest".
- O aluno precisava reconferir exercício por exercício.
- Conclusão: dados pouco confiáveis para a evolução de carga, que é o centro da musculação. **Recomendado e feito: retirar.**

### 1.5 Cardápio compartilhado
- Administrador, **tirar** e **acrescentar** alimento: a pergunta "todos ou só eu?" aparecia a cada vez (confirmado).
- **Trocar o prato** fazia o contrário: valia para todos direto, **sem perguntar e sem desfazer**, o que facilita um erro coletivo.
- Quantidade, "Comi" e lista de compras já são pessoais ou são uma visão. Quem não é administrador já era barrado (no app e na regra).

### 1.6 Tela inicial
- Conta nova via **todos** os blocos.
- No **Gratuito**, a personalização só tem "Completo" e "Só o essencial" e ignora a escolha bloco a bloco. Uma conta nova voltaria a ver tudo quando o Teste Premium (30 dias) acabasse.

## 2. O que foi implementado

### 2.1 Vibração (parte 71)
- Diagnóstico que separa os casos:
  1. **API inexistente:** a vibração não é oferecida e o texto diz isso.
  2. **Chamada recusada pelo navegador** (retorno `false` ou ainda sem interação): mensagem própria.
  3. **Chamada aceita:** o app pergunta **"Sentiu?"**. "Não senti" grava `mt_vib_ok = '0'` neste aparelho, e então:
     - o par "Vibrar / Sem vibrar" some do Som do cronômetro;
     - o botão some do cronômetro;
     - o fim do descanso deixa de pedir vibração (fica no som e na tela);
     - "Testar de novo" devolve a opção.
  4. **Integração com o cronômetro:** as últimas chamadas ficam em `__vibDiag` (horário, retorno, página visível, interação). O teste confirma que o fim do descanso chama 1 vez, com a página visível.
- **Não foi testado em aparelho real.** O teste automático simula os casos; o comportamento físico depende do Android e do Chrome de cada pessoa.

### 2.2 Importação (parte 73)
- Leitura própria do FIT (campos 193/192, com cabeçalho comprimido e campos de desenvolvedor). Só aceita RPE de 1 a 10. Efeito de treino, carga, frequência cardíaca e potência **não** viram esforço.
- **Prévia:**
  - esforço do relógio → "7/10 · informado no relógio", sem perguntar;
  - sem esforço → a mesma régua do registro manual, **sem nada marcado**, com "Não informar". Salvar sem responder deixa a atividade sem esforço (sem valor inventado).
- **"Este treino era do seu plano?"** lista os treinos da semana ainda não feitos (o do dia vem escolhido) ou "Não: foi uma atividade extra". Ao ligar, grava `tipoSessao` e `estagio`.
- **Detalhe da atividade:** "Informar o esforço percebido" (ou "alterar").
- **Musculação:** o arquivo de força é recusado com uma explicação. A opção saiu do seletor e a tela de integrações não promete mais musculação. As importações antigas continuam no histórico, com detalhe e exclusão.

### 2.3 Corridas fora do plano (parte 74; motor intacto)
- **Extra** = registro avulso (`livre`, importado sem ligação, sem tipo de sessão). **Planejado** = tem tipo de sessão ou id `S1`..`S7`.
- **Semana sem extras:** a mesma função de antes, com os mesmos dados (teste H).
- **Semana com extras:** a avaliação original roda só com planejados + **remanejados**:
  - remanejado = extra de corrida (ou caminhada/corrida no nível iniciante) com pelo menos 60% do treino mais curto da semana, quando faltou treino planejado: "trocou o dia";
  - os outros extras não contam como treino feito e ficam fora da média de esforço, sem punir;
  - a **carga** deles (duração × esforço; sem esforço = 5 só para o cálculo interno) é somada. Se a decisão era avançar, a carga extra foi ≥ 35% da planejada e houve esforço 7+, o plano **mantém**, explicando. Ele nunca recua por causa de um extra;
  - os extras aparecem no motivo da semana (cartão "Última mudança").
- **Próximo treino:** um extra nas últimas 36 h antes de um treino de qualidade ou longão gera orientação (sem cortar nada):
  - **exigente** (esforço 8+, ou 7+ com 45 min ou mais, ou bem mais longo que o habitual) → atenção;
  - **moderado** (esforço 6+) → orientação leve.
  
  A orientação aparece no cartão de status e no resumo do registro. Caminhada leve e extra antes de treino leve não geram aviso.

### 2.4 Sono e recuperação (parte 76)
- **Desligado por padrão.** Liga-se em Progresso › Sono e recuperação, depois de uma explicação.
- **Registro:**
  - **Home:** uma linha de manhã (4h–14h), logo abaixo da saudação: Mal / Ok / Bem num toque, "detalhes" e ✕ para pular. Some depois de responder;
  - **"Detalhes":** horas ou horários de dormir e acordar (atravessa a meia-noite), e disposição ao acordar. Tudo opcional.
- **Tela:**
  - gráfico de 7/30/90 noites, com a cor da barra pela qualidade e a faixa de 7–9 h;
  - média, noites ruins e regularidade do horário de dormir;
  - lista editável das últimas noites e explicação de como o app usa o sono.
- **Influência** (noite ruim = qualidade "mal", menos de 6 h ou acordou cansado):
  - uma noite → aviso no cartão da corrida;
  - 2 de 3 → sugestão de recuperação, e a dica "subir carga" ganha "se o aquecimento pesar, mantenha";
  - 3+ ruins com 4+ registradas na semana → a corrida mantém em vez de avançar;
  - nunca muda treino por uma noite; noites sem registro não contam;
  - o texto diz que horas de sono não garantem recuperação e que não há avaliação médica.
- O sono **não** vai para o grupo.

### 2.5 Alcance no cardápio compartilhado (parte 75)
- Dentro de cada refeição compartilhada (administrador, dia editável), a linha **"Suas mudanças valem para: Perguntar | Só para mim | Grupo todo"**. Ela é guardada e muda com um toque, no lugar da ação.
- Vale para tirar, acrescentar e **trocar o prato**: com "Só para mim", troca só o seu prato naquele dia.
- "Perguntar" é o padrão. A pergunta ganhou "Lembrar esta escolha" (marcada).
- **Desfazer** por 7 s em: tirar do grupo, tirar só de mim, trocar o prato do grupo (restaura a troca e a composição anteriores) e trocar só para mim.
- Sem mudança: quantidade, "Comi", lista de compras e alimento digitado à mão (só de quem acrescentou). Quem não é administrador não vê o controle.

### 2.6 Desafio juntos e conquistas compartilhadas (parte 77)
- Fica em Perfil › Meu grupo (o sistema de grupo existente).
- Cada pessoa entra se quiser e escolhe a **própria meta** (2–6 dias com treino por semana, em qualquer modalidade).
- **Vai para o grupo** (só de quem entrou): a meta, o número de dias por semana nas últimas 6 semanas, o início e a data de prova concluída. Nada de cargas, distâncias, peso, sono ou alimentação.
- Semana juntos = todos que entraram (2+) bateram a própria meta. Sem ranking.
- **Conquistas:** Primeira Semana Juntos, Dez no Desafio (suas sessões), Quatro Semanas Juntos (seguidas) e Prova no Grupo (secreta).
- **Não implementado:** "retomada conjunta". Depende de definir "pausa" para pessoas com modalidades diferentes, e preferi não inventar o critério.

### 2.7 Tela inicial (parte 78)
- **Conta nova** (só ao concluir o cadastro, `saveQuiz`; não na abertura, porque a cópia da nuvem pode chegar depois e uma conta antiga pareceria nova): começa sem Água, Frase do dia e Fase do plano. Vale igual no Gratuito e no Premium:
  - no **Gratuito**, existe o modo **"Padrão"** (o mesmo enxuto) ao lado de "Completo" e "Só o essencial";
  - a conta nova começa nele, então não volta a ver tudo quando o teste acaba.
- **Contas com histórico** ou que já personalizaram: nada muda.

## 3. Auditoria das áreas pendentes

| Área | O que foi verificado | Resultado |
|---|---|---|
| **Cadastro** | Uso real de cada campo no código (contagem por arquivo): apelido 22, objetivo 21, peso 12, altura 11, nascimento/idade 10/10, sexo 7, nível 6, WhatsApp 6. | Todos os campos são usados. WhatsApp: opcional, só para contato. Equipamentos, dias, duração e limitações ficam na configuração de cada modalidade (já cobertos por `auditoria-musculacao`, `semana-menos-tempo` e `corrida-tempo-limite`). **Nenhuma pergunta inútil encontrada.** |
| **Premium** | Bloqueio por função (`mtTem` na função que faz o trabalho, não só no botão); o que nunca bloqueia (treinar, registrar, histórico, evolução básica, desafios, conquistas); fim do Premium. | Coerente. Teste novo: com o Premium encerrado, histórico e progresso iguais, e o registro do treino continua abrindo. **Achado:** no Gratuito, a Home ignorava a personalização por bloco, e a conta nova voltava a ver tudo no fim do teste (corrigido, seção 2.7). Sono, extras, desafio e alcance são gratuitos (o alcance mora no cardápio, que já é Premium). |
| **Home** | Ordem dos blocos (CSS `order`, parte 28), blocos padrão, onde entra o novo. | A linha do sono teve de receber `order:11` (sem isso caía no fim da tela). A Home não ganhou cartão novo fixo. |
| **Painel administrativo** | Ações com confirmação (remover admin, rebaixar plano, liberar conta, liberar backup), registro `adminLog`, conferência de admin no servidor (coleção `admins`), perda do acesso em tempo real. | Coerente. As permissões são do servidor (`regras.js`: 61/0). Nenhuma mudança. |
| **Histórico e Perfil** | Atividades importadas (detalhe, exclusão, RPE depois), Meu grupo, conquistas na lista. | RPE editável no detalhe; o resto passou na regressão (beta54, beta58, beta61). Não houve revisão visual completa de todas as telas. |
| **Importação de relógios** | Leitura do FIT do aluno, campos de esforço, duplicação, ligação ao plano. | Bug do iniciante corrigido; musculação retirada; RPE lido ou perguntado. |
| **Conquistas** | Novas conquistas cooperativas, checadas no mesmo fluxo (`__conqChecadores` / `checkTrophies`); exclusão de atividade revalida (teste beta61). | OK nos testes. |

## 4. Testes — resultados reais

**Novo:** `testes/rc2.py` — **70 ok, 0 falha** (vibração, escopo do cardápio, sono, corrida extra, RPE na importação, desafio juntos, início enxuto).

Ele simula alunos diferentes:
- conta sem API de vibração, navegador que recusa, aceita sem efeito e aceita com efeito;
- importação sem esforço, com esforço do relógio (FIT gerado a partir da amostra, com o campo 193), duplicada e de musculação;
- iniciante importando treino do plano;
- 8 semanas de corrida (A–H) com extras de intensidades diferentes;
- 4 situações de "próximo treino";
- sono desligado e ligado, uma noite ruim, várias e uma semana ruim;
- administrador e membro no cardápio;
- duas pessoas no desafio, com metas diferentes;
- conta nova × conta antiga;
- Premium encerrado.

O seu arquivo do Zepp **não** foi incluído no projeto, porque tem o percurso GPS da caminhada. Ele foi usado só aqui, para o diagnóstico.

**Regressão completa** (RC 2, mesmo ambiente):

| Teste | Resultado na RC 2 | Observação |
|---|---|---|
| rc2.py (novo) | 70 ok / 0 | — |
| rc0.py, rc1.py | ok / 0 | rc1 agora espera a pergunta "Sentiu?" da vibração |
| casa-dois-celulares.py | 47 ok / 0 | ajustado: administrador escolhe "Grupo todo" antes de trocar (comportamento novo intencional) |
| beta46.py | 29 ok / 0 | mesmo ajuste de escopo |
| beta64.py | 18 ok / 0 | mesmo ajuste de escopo |
| beta54.py | 34 ok / 1 | seção de musculação reescrita: agora exige a recusa ("Registre o treino em Treinos"). A 1 falha (círculos da bike, 6 vs 3) depende da data e falha igual na Beta 64 hoje |
| beta53.py (2), beta61.py (1) | falhas de data | idênticas na Beta 64 rodada no mesmo dia (domingo/semana) — não são regressões |
| beta38, beta41, beta42 | erros ERR_TUNNEL no console | ambiente sem internet (CDN/Firebase bloqueados), não é código |
| demais testes Beta | sem falhas | — |


## 5. Arquivos

- **Novos:**
  - partes: `fonte/app-plus/73-importacao-rpe.js`, `74-corrida-extras.js`, `75-alcance-cardapio.js`, `76-sono.js`, `77-desafio-juntos.js`, `78-inicio-enxuto.js`;
  - testes: `testes/rc2.py`, `testes/fit_com_rpe.py`;
  - `RELATORIO-RC2.md`.
- **Alterados:**
  - `fonte/app-plus/71-vibracao.js` (diagnóstico e "Sentiu?");
  - `49-alimentacao-casa.js` (uma linha: o envio do perfil compara também o `dj`);
  - versão em `app.js`, `service-worker.js`, `index.html` e `00-base…`; `app-plus.js` montado;
  - `testes/rc0.py` e `testes/rc1.py` (versão genérica e o novo texto do teste de vibração);
  - documentação: `MAPA-DO-CODIGO.md`, `NOTAS-DA-VERSAO.md`, `ROTEIRO-DE-TESTES.md`.
- **Sem mudança:** `firestore.rules`, `functions/`, `manifest.json` e o projeto do APK (`android-twa/`). O APK abre o site e pega a RC 2 sozinho.

## 6. O que permanece

1. **Vibração:** sem solução confiável pelo navegador. O app agora é honesto sobre isso. Para vibrar de verdade, seria preciso um app nativo (com login por e-mail, ou login Google nativo), o que é um projeto à parte.
2. **Esforço do Zepp:** o app Zepp não exporta a resposta dada no relógio. Se um dia exportar (campo `workout_rpe`), o MetaTreino já lê.
3. **Corrida:** os critérios (60% para remanejado, 35% de carga extra, 36 h) são escolhas de projeto, testadas em cenários, não calibradas com dados reais de alunos. Vale observar nas próximas semanas.
4. **Sono:** só é útil para quem liga. Se pouca gente usar, ele não atrapalha ninguém, porque é desligado por padrão e não aparece na Home.
5. Não houve teste em aparelho real nem em iPhone neste ambiente.

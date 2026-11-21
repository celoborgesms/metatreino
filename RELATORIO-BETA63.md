# Relatório — MetaTreino 2027.1 Beta 63 · Motor de musculação individual e treino em dupla

**Firestore:**
- `firestore.rules` não mudou; nenhuma coleção nova.
- O treino em dupla usa o documento do grupo da Alimentação da casa que já existe, dentro do perfil de cada pessoa (`perfis.{uid}.tr`), que as regras já limitam ao dono.
- Só é publicado por quem liga a opção.
- Ocupa algumas centenas de bytes por pessoa e é gravado junto com o envio que o app já fazia. Não há leitura nem gravação extra.

## 1. Como o app montava os treinos (auditoria)

**Gerador:** `generatePlan('lift')` + `buildLiftExercises` (app.js), com camadas para limitações (parte 39) e calistenia/híbrido (parte 09).

**Divisão:**
- tabela fixa por número de dias: 3, 4, 5 ou 6;
- com 3 dias alternados: superior / inferior / corpo inteiro;
- **não usava o sexo**, então não havia "braço para homem, perna para mulher" no código;
- também não usava prioridade nenhuma.

**Escolha dos exercícios:**
- por **papel** dentro do grupo (ex.: peito = supino → inclinado → crucifixo);
- de uma lista girada pela semana do calendário;
- respeitando o equipamento, as limitações e o "não repetir na semana".

**Quantidade:**
- grupos grandes: **2 / 3 / 4 exercícios** conforme o nível (iniciante / intermediário / avançado);
- braços: 1 / 2 / 3.

**Tempo:**
- estimativa: 45 s fixos por série + descanso por série + 1,5 min por exercício + 5 min;
- teto fixo de 90 min na musculação (só o Híbrido tinha "Tempo por sessão").

**Classificação muscular:**
- uma regra por grupo: todo exercício de peito tinha *peito* principal e *deltoide + tríceps* secundários;
- só o "sub" do banco de exercícios diferenciava um pouco.

## 2. Problemas encontrados

1. **Mesmas respostas → ficha idêntica**, exercício por exercício (confirmado no teste: 0 diferenças).
2. **Subir de nível = mais exercícios:** 4 exercícios de peito × 4 séries no avançado eram estímulos redundantes, sem ganho proporcional.
3. **O tempo do aluno não existia na musculação:** a ficha podia passar de 60–70 min para quem tem 45.
4. **Classificação simplificada demais:**
   - voador e crossover com tríceps como secundário;
   - extensora com adutores;
   - flexora com glúteo (e sem panturrilha);
   - stiff com glúteo como principal;
   - pullover na polia com bíceps;
   - abdutora com posterior;
   - elevação frontal com tríceps.
   - Os três exercícios citados (voador, supino inclinado na máquina, supino com halteres) eram indistinguíveis.
5. **Nada sabia que aparelho cada exercício ocupa**, então não havia como evitar disputa entre duas pessoas.
6. **Não havia conquistas** de calistenia, híbrido ou treino junto.
7. **O ícone do tênis** (conquistas "1, 10, 25 e 50 corridas") parecia um ferro de passar.

## 3. Nova lógica de individualização

**Mesmo motor, sem segunda engine.**
- **Entre opções equivalentes do mesmo papel**, a escolha é da pessoa (`liftEscolheIndividual`), nesta ordem:
  1. favorito dela;
  2. uma semente fixa da conta.
  - Duas pessoas com respostas iguais recebem exercícios diferentes, mas com o **mesmo papel, grupo e séries** em cada posição: estímulo igual, ficha diferente.
  - A mesma pessoa recebe sempre a mesma ficha (não é sorteio).
  - Quem tem academia ou halteres faz a versão com carga (a ponte no chão fica de reserva).
- **Prioridade (opcional, até 2 grupos):**
  - o grupo grande escolhido abre o treino do dia e ganha 1 exercício;
  - braços ganham volume, mas não passam na frente de peito ou costas, porque pré-cansar o tríceps atrapalha o supino.
- **Nível:**
  - grupo grande: no máximo **3 exercícios** em qualquer nível (iniciante: 2);
  - o avançado progride com **+1 série nos exercícios principais** (até 5), além de carga, cadência e exercícios mais complexos, que já eram liberados por nível.
  - No teste: intermediário e avançado têm o **mesmo número de exercícios**; o avançado tem mais séries.
- **Sexo:** continua fora da divisão. O teste confere que mudar o sexo não muda o plano.
- **Já existentes, preservados:** idade (descanso maior a partir de 50 anos), objetivo, dias, equipamentos, limitações, histórico (bloco novo evita repetir exercícios).

## 4. Equipamentos compartilhados e treino em dupla

**Estações:** `exEstacao()` diz qual aparelho cada exercício ocupa: polia, leg press, extensora, flexora, smith, hack, máquinas, banco ajustável, banco de supino, rack, barra e anilhas, barra fixa, paralelas, halteres.

**Vínculo:**
- usa o grupo da **Alimentação da casa**, sem novo emparelhamento e sem administrador;
- em Treinos aparece uma linha discreta, **"Treino em dupla · Emilly"**, só para quem está num grupo.

**Ligar:**
- cada pessoa liga **"Treinamos no mesmo lugar"**;
- a tela mostra a semana dos dois e os aparelhos em comum por dia;
- **"Quantos aparelhos vocês têm"** pergunta só se tem 1 ou "2 ou mais" dos aparelhos que aparecem no plano. Sem resposta: 1 de cada, halteres em vários pares. Nada de questionário longo.

**Organizar o meu plano** — muda só o plano de quem tocou:
1. Troca **qual treino cai em qual dos SEUS dias** (os dias escolhidos não mudam), com penalidade forte para o mesmo grupo grande em dias seguidos. A recuperação vem antes da conveniência.
2. Se um aparelho de unidade única está com a outra pessoa no mesmo dia, troca por um **equivalente**:
   - mesmo grupo e mesmo papel;
   - equipamento que você tem;
   - sem bater com suas limitações;
   - nível adequado;
   - estação livre.
3. **Sem equivalente:** mantém o exercício e sugere a ordem (no começo ou no fim do treino).
- **Desfazer** volta o plano exatamente como estava.
- Num exemplo com os dois no mesmo plano: 15 disputas → 0, com três trocas e reorganização dos dias.

**Ao gerar um plano com a dupla ligada:** a escolha entre equivalentes já prefere a estação livre naquele dia (camada de otimização dentro do mesmo papel).

**Independência:**
- histórico, cargas, conquistas, nível e preferências continuam individuais;
- sair do grupo não mexe em ficha nem histórico;
- **corrida e cardápio da casa não são tocados** (verificado no teste de dois celulares).

## 5. Correções na classificação muscular

Regras por nome em `MM_ENFASE`, aplicadas por cima da regra por grupo. Cada uma traz **ênfase** e **movimento**, que aparecem na ficha do exercício junto com o **aparelho** e os **equivalentes**.

**Peito:**

| Exercício | Correção |
|---|---|
| Voador, crucifixo, crossover | Isolador: deltoide como secundário, **sem tríceps**. Crossover alto e baixo com ênfase inferior e superior. |
| Supino inclinado | Porção clavicular + mais deltoide anterior. |
| Supino na máquina | Trajeto guiado, menos estabilização. |
| Supino com halteres | Maior amplitude, estabilização de cada braço. |
| Pullover com halter | Dorsal e tríceps como secundários. |

**Costas:**

| Exercício | Correção |
|---|---|
| Pullover na polia | Sem bíceps (braço estendido). |
| Puxadas × remadas | Vertical × horizontal (largura × espessura). |

**Pernas e glúteos:**

| Exercício | Correção |
|---|---|
| Extensora | Só quadríceps. |
| Flexora e nordic | Posterior + **panturrilha** (gastrocnêmio), sem glúteo. |
| Stiff | **Posterior principal**, glúteo secundário, lombar estabiliza. |
| Leg press | Quadríceps principal, glúteo e adutores secundários. |
| Hack | Quadríceps, glúteo secundário. |
| Abdutora, concha, abdução | Glúteo médio, sem posterior. |

**Outros:**

| Exercício | Correção |
|---|---|
| Elevação frontal | Peitoral (clavicular) secundário, sem tríceps. |
| Pike | Tríceps e trapézio. |
| Chin-up | Dorsal secundário. |
| Mergulho no banco | Deltoide e peito secundários. |
| Farmer walk | Antebraço e trapézio. |

**Onde isso entra:** mapa muscular, PDF do treino e séries por músculo da semana (principal = 1 série, secundário = 0,5).

**Diferenças não inventadas:** onde a anatomia é igual (várias roscas, várias panturrilhas em pé), a classificação continua igual.

## 6. Cálculo do tempo

**Estimativa por exercício:**
- execução pela faixa de repetições: ~3,5 s por repetição + 10 s para posicionar (isometria: o tempo segurado + 10 s);
- descanso só entre as séries (n−1), do próprio exercício;
- 2 min de troca e ajuste de aparelho por exercício;
- aquecimento de 6 min (9 min a partir de 50 anos).

**Novo "Tempo por sessão" no cadastro da musculação:** 30, 45, 60, 75 ou 90 min.

**Ajuste ao tempo:**
1. tira 1 série dos acessórios;
2. depois dos secundários;
3. depois tira acessórios inteiros, mantendo no mínimo os 3 principais.
- **O descanso nunca é cortado.**

**Se ainda não couber:** aparece um aviso no treino com a sugestão de 1 dia a mais ou de 15 min a mais.

**Resultados no teste:**

| Tempo informado | Maior treino |
|---|---|
| 30 min | 27 min |
| 45 min | 45 min |
| 60 min | 60 min |

## 7. Conquistas criadas ou corrigidas

Todas com critério verificável no histórico, entram na regra das 48 h ao apagar uma atividade e mantêm todas as conquistas atuais sem mudança.

**Calistenia:**

| Conquista | Nível | Critério |
|---|---|---|
| Peso do Corpo | comum | 1º treino |
| Rotina de Calistenia | comum | 10 dias |
| Um Minuto Firme | comum | isometria de core de 60 s numa série |
| Degrau Acima | rara | exercício de nível Intermediário |
| Cinco na Barra | rara | 5 repetições de barra de nível 2+ |
| Primeira Habilidade | especial | parada de mão, lever, planche… |
| Especialista | especial | exercício de nível 4 |

**Híbrido** (musculação + corrida ou bike; caminhada não conta):

| Conquista | Nível | Critério |
|---|---|---|
| Semana Híbrida | comum | musculação e corrida ou bike na mesma semana |
| Força e Fôlego | rara | 2+ e 2+ na mesma semana |
| Híbrido de Verdade | rara | 4 semanas seguidas |
| Atleta Completo | especial | 12 semanas |

**Treinando juntos:**

| Conquista | Nível | Critério |
|---|---|---|
| Parceiros de Treino | comum | 1º treino junto |
| Um Apoia o Outro | rara | 5 dias juntos |
| Dupla de Ferro | especial | 20 dias juntos |

- "Junto" = os **horários dos dois treinos se cruzam** por 15 min ou mais (ou metade do treino mais curto) no mesmo dia.
- Cada um ganha pela **própria** sessão: ninguém ganha pelo treino do outro (testado).
- Só compartilha dia e horário, e dá para desligar.

**Secretas:** Dia Completo (musculação e corrida no mesmo dia, 5×), Disciplina do Corpo (calistenia em 4 semanas seguidas), Mais Fortes Juntos (juntos em 4 semanas seguidas), Parceria Completa (juntos na musculação e na corrida).

**Ícones:**
- tênis redesenhado (cadarço, solado, bico) para as conquistas de quantidade de corridas;
- ícones novos: argolas, barra fixa, halter + pulso, duas pessoas.
- As novas categorias aparecem na tela de Conquistas.

## 8. Arquivos e funções modificados

**`app.js`:**
- `generatePlan`: prioridade e `diaIdx`;
- `liftQuantos`: nível sem exercício a mais, prioridade;
- `buildLiftExercises`: escolha individual, +1 série no principal do avançado, teto pelo `setup.tempo`;
- `estimateLiftDuration`: nova estimativa;
- `finishSetup`: tempo e prioridades.

**Outros arquivos:**

| Arquivo | O que mudou |
|---|---|
| `index.html` | Campos "Tempo por sessão" e "Quer priorizar algum grupo?". |
| `fonte/app-plus/65-motor-individual-dupla.js` (novo) | Classificação, estações, escolha individual, treino em dupla, aviso de tempo, ficha do exercício, conquistas, ícones. |
| `42-conquistas-desafio-mensal.js` | Categorias novas na grade. |
| `49-alimentacao-casa.js` | Perfil publicado leva `tr` quando a dupla está ligada. |
| `64-conquistas-revisao-beta61.js` | Revisão das 48 h também para as conquistas novas. |
| `testes/beta63.py` (novo) | Cenários A, C, D, E, F e G, conquistas e cadastro. |
| `testes/casa-dois-celulares.py` | Seção 6b: dupla com dois celulares. |

## 9. Testes realizados e resultados

**`testes/beta63.py`: 39/39 ok.**
- **Cenário A:** fichas diferentes com mesmo estímulo; estável para a mesma pessoa; favorito respeitado; sexo não muda a divisão.
- **Cenário C/D:** objetivos e dias diferentes.
- **Cenário E:** nível × exercícios × séries; prioridade.
- **Cenário F:** 30, 45 e 60 min; descanso preservado; estimativa realista.
- **Cenário G:** classificação de 7 exercícios-chave e estações de todos os aparelhos.
- **Conquistas:** novas, níveis, ícones, critérios reais e revisão de 48 h.
- **Cadastro:** campos novos e Híbrido sem campo duplicado.

**`testes/casa-dois-celulares.py`: 47/47 ok** (dois celulares, nuvem simulada com as regras). Cobre os cenários B e 15.8:
- cada um publica o próprio; no grupo não vão cargas nem nomes de exercícios;
- conflitos detectados e organizar reduz;
- estímulo preservado (papéis, grupos, séries e dias);
- plano da outra pessoa, corrida e cardápio inalterados;
- desfazer;
- conquista em dupla só com horários que se cruzam, nunca pelo treino do outro;
- desligar.

**Regressão — sem falhas:**
- **Suítes:** beta37–beta61, acessibilidade, compartilhar, cronômetro, registro de séries, série/descanso, temas (8 temas × 15 etapas × 2 tamanhos).
- **Navegador:** sem ids repetidos e sem texto com pouco contraste. Para isso, corrigi o contraste do número vermelho nas abas ("9+"), que vinha da Beta 55.
- **Ajustes nos testes:**
  - `beta49` confere o texto com `textContent`, porque os grupos de conquistas fora da tela não entram no `innerText` (o "faltou" era do teste, não do app);
  - `beta50` pegou um erro real meu: "Panturrilha no Leg Press" virava quadríceps. Já corrigido.

## 10. O que ainda depende de validação

- **Celulares reais**, você e a Emilly: ligar a dupla nos dois, informar os aparelhos, tocar "Organizar" e conferir se as trocas fazem sentido no espaço de vocês.
- **Planos já existentes não mudam sozinhos**, para preservar fichas e históricos. As melhorias de escolha, nível e tempo valem quando o plano é criado ou refeito ("Alterar plano"). A organização em dupla vale ao tocar "Organizar".
- **A semente individual** muda a escolha entre equivalentes quando o plano for refeito. A partir daí fica estável.
- **Aparelho multiestação** (ex.: extensora/flexora na mesma máquina): por enquanto são estações separadas. Se for o caso de vocês, me diga que eu junto as duas.
- **Desafios temporários em dupla:** avaliados e deixados para depois, para não encher a tela; as conquistas já cobrem o incentivo.

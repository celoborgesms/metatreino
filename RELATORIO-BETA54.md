# Relatório — MetaTreino 2027.1 Beta 54 — Integrações e atividades (GPX, TCX, FIT)

Versão **2027.1-beta.54**. As regras do Firestore não mudaram. Arquivo novo para publicar: `fit-parser.min.js` (raiz).

## 1. Diagnóstico da estrutura atual
| Parte | Como funciona hoje | Como a importação usa |
|---|---|---|
| **Registro de cardio** | Corrida (plano), caminhada e bike avulsas ("Registrar atividade") vão para `state.modules.run.history`, com `duration` (min), `distance` (km), `pace` e `activity` (corrida, caminhada ou bike). | As importadas entram no mesmo lugar, com os mesmos campos e um bloco `imp` a mais. Por isso tudo o que lê o histórico passa a enxergá-las sem código paralelo. |
| **Musculação** | Séries em `state.progress[exercício] = [{date, sets:[{peso, reps}]}]`. Recordes em `state.prs`, pela regra de `closeSetLog`. O treino concluído vai para `lift.history` com `exercisesDone`. | As séries confirmadas entram em `state.progress` na data do treino, os recordes seguem a mesma regra e o treino vai para `lift.history`. |
| **Histórico** | `renderHistory`, um histórico por modalidade ativa, agrupado por dia; o detalhe abre em `openHistoryEntry`. | Selo de origem nas atividades importadas e detalhe próprio (`openAtividade`). |
| **Gráficos** | Evolução (frequência, tempo, peso, volume) e a tela "Evolução da corrida". | Os dados importados entram por esses mesmos caminhos. A tela nova **Cardio** acrescenta FC, subida e melhores 5/10 km, além de caminhada e bike. |
| **Recordes** | `renderRecords`: maior distância e melhor ritmo da corrida; maior pedalada e maior caminhada. Recorde de corrida e conquista vêm de `checkRunEvolution`. | Melhores esforços de 5, 10 e 21,1 km; atividades com dados inconsistentes ficam de fora. |
| **Conquistas** | `ensureStats` e `checkTrophies` derivam tudo do histórico. | São chamadas depois de salvar, como no registro manual. |
| **Calorias do dia (Beta 53)** | `_enFeitas` lê o histórico. | Passa a usar as calorias do relógio quando o arquivo as traz (menos o gasto em repouso). |
| **Meta Assistente** | `maInterpret` transforma a pergunta em uma chave; as respostas ficam em `MA_ANSWERS`. As análises de semana e corrida já leem o histórico. | Resposta nova `atividades`, reconhecimento das perguntas e sugestão no assistente quando há atividades importadas. |
| **Firebase** | Um documento por aluno com o `state` inteiro e controle de tamanho (arquivo anual a partir de 85%). Storage não é usado; no plano gratuito, projetos novos já não têm Storage. | Na nuvem vão só números (cerca de 2 a 3 KB por atividade). O percurso GPS e o arquivo original ficam no aparelho (IndexedDB). |

## 2. Melhor localização
- **Lugar principal:** Progresso › Histórico › "Integrações e atividades". É onde o aluno procura o que já fez, e não polui a tela inicial.
- **Atalho:** em Treinos › "Registrar atividade", que já era o lugar de "fiz um cardio fora do plano".
- **Uma tela só:** os dois abrem a mesma tela (`openIntegracoes`).
- **Perfil:** ficou de fora para não ter três caminhos para a mesma coisa. Quando houver conexões automáticas, "gerenciar integrações" pode virar uma linha no Perfil abrindo esta mesma tela.

## 3. Arquivos modificados
- `fonte/app-plus/57-integracoes-atividades.js` (novo) e `app-plus.js` (montado).
- `fit-parser.min.js` (novo, carregado só na hora de importar FIT).
- `service-worker.js`: `fit-parser.min.js` entra no cache opcional, para funcionar sem internet depois da primeira vez.
- `LICENCAS-TERCEIROS.md` (novo).
- Testes: `testes/beta54.py` e `testes/amostras-atividades/` (amostras + `gerar-fit.mjs` + receita de montagem do leitor).
- `NOTAS-DA-VERSAO.md`, `MAPA-DO-CODIGO.md`, `ROTEIRO-DE-TESTES.md`. Versão 54 nos 5 lugares.

## 4. Bibliotecas
- **GPX e TCX:** `DOMParser` do próprio navegador; nenhuma biblioteca.
- **FIT:** **fit-file-parser 6.2.10** (MIT), empacotado com `buffer`, `base64-js` e `ieee754` (MIT/BSD). Tem 291 KB, cerca de 63 KB compactado, e é carregado sob demanda.
- **Por que não o SDK oficial da Garmin:** a licença dele é um contrato que você teria de aceitar e o pacote é muito maior. Usei o SDK oficial só nos testes, para **gerar** os arquivos FIT de exemplo.
- **Testes:** `pypdf` e Playwright, como antes.

## 5. Formatos e campos efetivamente suportados
| Campo | GPX | TCX | FIT |
|---|---|---|---|
| Data e hora (convertidas para o fuso do aparelho) | do 1º ponto | Id ou volta | sessão |
| Modalidade | `<type>`; sem ele, pela velocidade | `Sport` (Running/Biking; Other → força ou velocidade) | `sport` e `sub_sport` |
| Distância | calculada pelo GPS | do arquivo | do arquivo |
| Tempo total e tempo em movimento | pelos pontos | voltas | sessão (`total_timer_time`) |
| FC média e máxima | extensão `gpxtpx:hr` | sim | sim |
| Cadência | `gpxtpx:cad` | Cadence / RunCadence | sim |
| Altitude e subida | `<ele>` | sim | sim (`total_ascent`) |
| Velocidade máxima | pelos pontos | voltas | sessão |
| Calorias | — | voltas | sessão |
| Parciais e melhores 1/5/10/21,1 km | pelos pontos | pelos pontos | pelos pontos |
| Percurso | sim | sim | sim |
| Musculação: exercícios, séries, repetições, carga | — | — | mensagens `set` (categoria do exercício + reps + peso) |

Regras de leitura:
- **Cadência de corrida e caminhada:** dobrada quando o relógio grava a passada de uma perna só.
- **Potência:** é lida, mas ainda não é usada.
- **Campos ausentes:** nunca viram zero; a prévia lista o que o arquivo não trouxe.

## 6. Funcionalidades integradas
- **Histórico unificado:** selo de origem e detalhe da atividade, com cartões, gráfico de velocidade, FC e altitude, percurso, parciais e o botão excluir.
- **Recordes:** melhores esforços de 5, 10 e 21,1 km. Atividades com velocidade impossível ou GPS aos saltos não contam, e caminhada e bike não entram nos recordes de corrida.
- **Conquistas e estatísticas:** com as mesmas funções do registro manual.
- **Cardio:** corrida, caminhada e bike, em 6 períodos, com comparação com o período anterior.
- **Musculação:** séries do FIT ligadas à biblioteca e revisáveis.
  - O aquecimento marcado fica fora; o registro que já existia no dia é preservado.
  - Ao excluir uma atividade importada, as séries saem e o recorde é recalculado.
- **Plano:** opção de contar a atividade como o treino do plano daquele dia.
- **Duplicidade:**
  - o hash do arquivo, mais uma chave por modalidade, minuto de início, distância e duração, bloqueia reimportar a mesma atividade;
  - para o registro manual do mesmo dia, o app oferece "Complementar" (padrão), "Salvar como nova" ou "Manter só o existente".
- **Calorias do dia:** usam as calorias do relógio quando existem.
- **Meta Assistente:** análise de volume, ritmo por faixa de distância, FC no mesmo ritmo, bike em pedaladas parecidas, caminhadas e cargas.
  - **Limites:** exige dados suficientes em cada período e não sugere aumentar a intensidade por uma melhora isolada.
  - **Premium:** é do Meta Assistente completo, como as outras análises.
- **Prévia:** compara a atividade com a média das atividades parecidas dos últimos 3 meses (mínimo de 3).
- **Integrações futuras:** a porta de entrada `atvSalvar(A, { origem })` serve para importação por arquivo e para sincronização.

## 7. Testes executados
- **`testes/beta54.py`: 38 ok.**
  - **Lugar:** histórico, atalho e textos.
  - **Nove importações reais pela tela:** FIT, GPX e TCX de corrida, caminhada e bike. Os números foram conferidos (8,2 km, FC 145, início 06:10 no fuso de Manaus; TCX de 10,19 km com melhores 1, 5 e 10 km; bike em km/h).
  - **Armazenamento:** menos de 4 KB por atividade na nuvem; percurso e arquivo original no IndexedDB.
  - **Recordes e gráficos:** melhores 5/10 km nos recordes; caminhada fora do recorde de corrida; gráficos de distância, FC, 5 km, ritmo, subida e velocidade da bike; selo e detalhe no histórico.
  - **GPS com saltos:** entra no histórico, mas fica fora dos recordes.
  - **Duplicidade:** mesmo arquivo bloqueado; registro manual complementado.
  - **Musculação FIT com séries:** Supino, Rosca e Tríceps ligados à biblioteca; aquecimento fora; registro do dia mantido; recorde de 40 kg × 10.
  - **Musculação só com FC:** FIT e TCX, sem inventar exercícios.
  - **Cinco arquivos ruins:** rota sem horário, GPX cortado, FIT cortado, binário qualquer e .txt. Todos com mensagem simples, registrados no histórico de importações.
  - **Calorias e assistente:** calorias do relógio no dia; o assistente entende a pergunta e analisa.
  - **Exclusão:** apaga as séries, o recorde e o arquivo local.
  - **Desempenho:** GPX de 30 mil pontos (3,8 MB) processado em menos de 4 s, com percurso de no máximo 400 pontos.
- **Regressão, tudo passando:** beta53 (14), beta52 (19), beta51 (18), beta50 (40), beta49 (39), beta48 (56), beta46 (29), beta44 (51), beta43 (78), beta42 (12), beta41 (72), beta40 (128), beta39 (94), beta38 (87), beta37 (8), casa-dois-celulares (30), registro-series (23), serie-descanso (24), cronometro (21), compartilhar (10), acessibilidade (7); Node: regras (61), sincronizacao (18), semana-menos-tempo (34), beta35 (23).

## 8. Limitações (honestas)
- **Arquivos de relógio real:** não tive nenhum aqui. Os FIT de teste foram gerados com o SDK oficial da Garmin (codificação real do formato) e os GPX/TCX seguem os esquemas oficiais. **Falta testar com exportações reais do seu Zepp**, principalmente o "Treino de Força".
- **Zepp:** há fontes dizendo que o FIT exportado pelo Zepp é limitado e que a musculação com séries chega completa ao Strava; o que vem no arquivo exportado do relógio precisa ser conferido.
- **Exercícios de musculação:** o nome vem pela **categoria** do FIT (supino, rosca, remada…). A variação exata (barra ou halteres) não é traduzida, por isso o aluno confere na prévia.
- **Aquecimento:** o FIT não tem um campo padrão de "série de aquecimento", então o aluno marca.
- **Celular e computador reais:** a importação foi testada no Chromium, nos tamanhos de tela do celular e do computador. No iPhone, o seletor de arquivos foi deixado sem filtro de extensão de propósito, porque `.fit` não é um tipo conhecido no iOS e poderia aparecer apagado.
- **Percurso:** fica só no aparelho que importou; em outro aparelho aparecem os números, não o mapa. O desenho é o traçado, sem mapa de fundo; mapas exigiriam um serviço de mapas, com termos de uso e custo próprios.
- **Formatos não lidos:** `.gz` (o app pede para descompactar), FIT com várias sessões (multiesporte: lê a primeira) e natação (entra pela velocidade como "outro", sem métricas de piscina).
- **Sincronização entre aparelhos:** o teste de sincronização já existente continua passando, e as atividades viajam no mesmo `state` sincronizado.

## 9. Melhorias futuras recomendadas
1. **Strava como primeira conexão automática:** concentra Zepp, Garmin, COROS e Polar. O projeto já tem `functions/` (Cloud Functions), que pode guardar o segredo do OAuth.
   - **Atenção aos termos:** os termos da API do Strava restringem alguns usos dos dados. Em especial, o uso em modelos de IA e a exibição para outras pessoas precisam ser checados antes de alimentar o Meta Assistente com dados vindos do Strava.
2. **COROS:** oferece OAuth para apps; também precisa de servidor.
3. **Garmin e Zepp:** dependem de aprovação como empresa parceira.
4. **Apple Saúde e Health Connect:** só com um app nativo. Isso seria um passo maior (Capacitor ou similar).
5. **Mapa de fundo opcional** e mapa de calor das rotas (só no aparelho).
6. **Mais leituras do FIT:** zonas de FC (`time_in_zone`), potência na bike, carga de treino e multiesporte por sessão.

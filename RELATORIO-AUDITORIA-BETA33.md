# Relatório da auditoria — MetaTreino 2027.1 Beta 32 → Beta 33

Data: 13/11/2026. Base: `metatreino-2027_1-beta32.zip` (43 arquivos; `app.js` com 11.930 linhas; `app-plus.js` montado a partir de 30 partes).

## 1. Diagnóstico da arquitetura

- **Carregamento:** `index.html`, depois Firebase compat 10.12.0 (gstatic), depois `app.js` (núcleo, `state`, login, planos, telas), depois `app-plus.js` (estende o núcleo com `mtGancho` e por troca de `window.f`).
- **Fonte do `app-plus.js`:** as 30 partes de `fonte/app-plus/`, montadas por `fonte/montar.py` em ordem alfabética. Conferi que o `app-plus.js` publicado era idêntico às partes antes de mexer.
- **Estado:** o objeto `state` é salvo inteiro no `localStorage` (`metatreino_cache_{uid}`) e no Firestore (`usuarios/{uid}.estadoApp`, sem `merge`, com debounce de 800 ms).
- **Arquivo anual:** o histórico com mais de 90 dias vai para `usuarios/{uid}/arquivo/*` (parte 15).
- **Pontos centrais encontrados:**

| Sistema | Onde |
|---|---|
| Cronômetro de descanso (único) | `app.js` |
| Wake Lock | `app.js`, usado também pela Conquista Especial (parte 10) |
| Som | `tocaSomFim` |
| Atualização automática | parte 06, mais o `index.html` |
| Service worker | `service-worker.js` |
| Gerador de musculação | `buildLiftExercises`, envolvido pela parte 27 (`treinoSemRepeticao`) |
| Motor de corrida | parte 11, que substitui `generatePlan('run')` |
| Calistenia | parte 09, com gerador próprio |

- **Dependências que exigem cuidado:**
  - `const`/`let` do `app.js` são usados pelas partes.
  - A parte 27 envolve `buildLiftExercises`.
  - A parte 09 envolve `regenLiftExercises`.
  - A parte 11 envolve `generatePlan`, `finishSetup`, `saveRunLog` e `recalibrateRunPlan`.

Nenhum sistema foi recriado. As correções foram feitas dentro das implementações existentes, mantendo os nomes das funções.

## 2. Problemas encontrados e corrigidos

Prioridade conforme a sua escala (P0 crítico … P3 baixo). "Comprovado" = reproduzido em teste ou lido no código com o caminho exato.

### P0 — Crítico

| # | Arquivo / função | Problema | Causa | Impacto | Correção |
|---|---|---|---|---|---|
| 1 | `app.js` → `renderAdminList`, `openStudent`; parte 11 → resumo de corrida no painel | **XSS armazenado no painel do administrador** (comprovado no código) | Nome/apelido (`usuarios.nome`, `profile.nickname`), WhatsApp, observações e `profile.photo` do aluno entravam no HTML sem escape; a foto entrava direto em `src="..."` | Um aluno que grave `<img onerror=...>` no próprio documento executa código **com a sessão do administrador** (liberar acessos, ler dados de todos) | Escape de tudo o que vem do aluno (`escHtml`, novo `jsAttr` para `onclick`), foto só se for `data:image/...` ou `https://`, WhatsApp limpo com a regex certa (a antiga `/\\D/` não tirava nada) |
| 2 | `service-worker.js` → `fetch` | **App em branco sem internet** logo após instalar/atualizar (reproduzido na Beta 32: `APP_VERSION` indefinido offline) | A instalação guarda `app.js`, mas a página pede `app.js?v=...`; `caches.match` sem `ignoreSearch` não achava | Aluno na academia sem sinal fica sem o app | Busca também sem o `?v=`, instalação com `cache:'reload'`, Firebase guardado na instalação, nada de guardar respostas 404/500 |
| 3 | `app.js` → `loadData` / `syncToCloud` | **Treinos perdidos entre aparelhos ou após uso offline** (comprovado no código) | Documento gravado inteiro; ao abrir, a cópia mais nova vencia e a outra era descartada | Treino feito offline ou no outro aparelho sumia | `mesclaEstado` junta histórico (90 dias), séries do dia, peso, conquistas e recordes; exclusões marcadas (`histExcluidos`); escuta em tempo real do próprio documento; o cache antigo do aparelho só contribui com o que foi registrado depois da última gravação confirmada (não ressuscita excluídos) |
| 4 | `firestore.rules` | Aluno podia gravar no próprio documento o e-mail de outra pessoa | Regra sem validação do campo | Painel mostra um aluno com o e-mail de outro (confusão em ações administrativas) | `emailDoDocOk()` na escrita do próprio aluno. **Precisa publicar no Console.** Demais permissões iguais |

### P1 — Alto

| # | Arquivo / função | Problema | Causa | Correção |
|---|---|---|---|---|
| 5 | `app.js` → `startRestTimer` | Cronômetro errado com tela bloqueada/app minimizado | `left--` a cada `setInterval` (o navegador atrasa/congela o intervalo) | Conta pelo horário de término; som agendado no relógio do áudio; retoma ao reabrir o app |
| 6 | `app.js` → Wake Lock | Tela apagava no meio do treino | A trava era solta ao fim de cada descanso; pedidos acumulavam travas (a anterior nunca era solta); ao voltar ao app, só pedia de novo se houvesse descanso | Gerenciador único por motivos + "treino ativo" (veja a seção 4) |
| 7 | `app.js` → `buildLiftExercises` | Fichas inadequadas (768 combinações testadas) | Escolha pela ordem da lista girada; `exPattern` classificava crossover/crucifixo como "empurrar" e extensora como "agachar" | Escolha por papel de movimento (seção 3); correção única dos planos salvos (parte 30) |
| 8 | `app.js` → variação semanal | Exercícios trocavam na **quarta às 21h** | Semana = `Math.floor(Date.now()/7 dias)` começa quinta 00h UTC | `semanaLocalId()` (segunda a domingo, horário local), com migração sem troca extra |
| 9 | parte 11 → `rFase` | Semana depois da prova virava "polimento" com longão e ritmo de prova (comprovado na simulação) | `rd > semana − 7 dias` aceitava prova passada; a prova registrada no dia seguinte não contava como prova | Prova marcada que já passou → recuperação pós-prova |
| 10 | `app.js` → `saveRunLog`, `saveHistoryEntry`, registro pelo assistente | Ritmo "5:60/km"; edição de distância com vírgula virava inteiro; bike editada ganhava ritmo em min/km | Arredondamento de segundos sem "vai um"; `parseFloat("5,2")` = 5 | `fmtPaceMin` nos 3 pontos; vírgula aceita; bike em km/h |
| 11 | `app.js` → `calcStreak` | Sequência "0 dias" para quem treinou todo dia até ontem; um selo chamava `calcStreak()` sem histórico (sempre 0) | Hoje sem treino quebrava a contagem | Hoje ainda aberto: conta até ontem; chamada corrigida |
| 12 | parte 06 → `_podeAtualizarAgora` | Atualização podia aplicar com descanso rodando (fora da aba Treinos) | Procurava o id `rest-timer-on`, mas o banner é `rest-timer-banner` | Confere os dois ids |

### P2 — Médio

| # | Onde | Problema → correção |
|---|---|---|
| 13 | Som do descanso | "Sem som" não era lembrado (voltava a tocar ao reabrir) → salvo no aparelho. Vibração disparava 2 vezes (padrões sobrepostos) → uma vez. Não havia opção de vibração → "Vibrar / Sem vibrar". O som "Apitos" usava `setTimeout` (não tocava em segundo plano) → agendado no áudio |
| 14 | Banner do descanso | Sem pausar/±tempo; ignorava a área segura (barra de gestos) → Pausar/Continuar, −15 s/+15 s, barra de progresso, posição com `safe-area`, rótulos acessíveis |
| 15 | Avisos (toast) | Cobriam o cronômetro → sobem quando há descanso rodando |
| 16 | `confirmLiftWorkout` | Dois toques em "Salvar treino" gravavam 2 vezes → ignora o segundo em até 30 s |
| 17 | Home inteligente (parte 05) | "Seu próximo treino é amanhã" com o treino de hoje pendente; dias planejados = maior número entre musculação e corrida → união dos dias dos dois planos |
| 18 | `bindDaysUpdate` | Ouvintes de clique somavam 2 a cada abertura da tela de montar plano → registrados uma vez |
| 19 | Editar perfil | Apelido com aspas quebrava o campo (sem escape) → escapado |
| 20 | Datas | Nome dos arquivos de backup/relatório e limite da data de nascimento usavam o dia em UTC (após 21h = amanhã) → dia local |
| 21 | `syncToCloud` | Toda troca de aba regravava o documento inteiro no Firestore (cota gratuita) → só grava quando algo além da aba muda |
| 22 | `parseRestSeconds` | "1:30" virava 16 s → 90 s; mínimo de 5 s |
| 23 | Cadeira contra parede | Isométrico prescrito em "8-12 repetições" → tempo (s) |

### P3 — Baixo
- Foco visível para teclado no computador.
- `montar.py` agora confere se a versão do Firebase do `index.html` é a mesma guardada pelo service worker.
- Limpeza de caches restrita aos caches do próprio app (`metatreino-*`).

## 3. Auditoria dos treinos de musculação

**Método:** gerei as 768 fichas possíveis: 4 equipamentos × 3 níveis × 4 objetivos × 4 opções de dias × 4 semanas de rotação, além de 98 combinações de dias da semana escolhidos (`testes/auditoria-musculacao.js`).

**Encontrado na Beta 32:**
- **688 de 768** combinações com mais de 30 séries numa sessão. O dia de pernas do intermediário chegava a 32 séries; o do avançado, a 40.
- Peito do iniciante na academia com **Crossover + Pullover**, sem nenhum supino ou flexão (45 casos).
- Costas com barra fixa + terra e **sem remada** (20 casos).
- **Dois encolhimentos** no mesmo treino (64 casos).
- Ombro com pike + pike para quem tem halteres.
- O mesmo descanso para todos os exercícios do plano (3.264 treinos).
- Core e panturrilha com 4-6 repetições na força.
- 4 exercícios de tríceps (16-20 séries) depois de 4 de peito no avançado.

**Como ficou** (mesmos splits, séries por nível/objetivo e faixas de repetição do plano):

- **Papéis por grupo**, sempre do principal para o acessório. A variação semanal acontece dentro de cada papel:

| Grupo | Sequência de papéis |
|---|---|
| Peito | supino/flexão → inclinado → crucifixo |
| Costas | puxada → remada → pullover/terra (terra só na força ou no avançado) |
| Pernas | agachamento/leg press → posterior → unilateral → extensora/flexora |
| Glúteos | quadril → abdução → extensão |
| Ombro | desenvolvimento → lateral → posterior |
| Bíceps | rosca → martelo → pico |
| Tríceps | acima da cabeça → polia → composto |
| Core | estabilidade → flexão → rotação |
| Panturrilha | em pé → sentada |

- **Quantidade de exercícios:**
  - Grupos grandes: 2, 3 ou 4 conforme o nível.
  - Braços: 1, 2 ou 3.
  - Core e panturrilha: 1 ou 2.
  - Trapézio: 1.
  - Segundo grupo grande do dia: um a menos. Glúteos ao lado de pernas: dois a menos.
  - Grupo que repete na semana: dois a menos, com mínimo de 2.
  - Na força: um a menos, porque são mais séries pesadas.
- **Teto de séries por sessão:** iniciante 20, intermediário 26, avançado 30. O teto é aplicado tirando séries dos acessórios do fim.
- **Descanso por papel:**

| Objetivo | Principal | Secundário | Acessório |
|---|---|---|---|
| Hipertrofia | 90-120 s | 60-90 s | 60 s |
| Força | 2-3 min | 2 min | 60-90 s |
| Emagrecimento | 45-60 s | 30-45 s | 30-45 s |
| Resistência | 30-45 s | 30 s | 30 s |

  - Core e panturrilha: 30-60 s.
  - A partir de 50 anos, todos ficam mais longos, como já era a regra.
- **Força:** principal 4-6 repetições, secundário 6-8, acessório 8-10, core 10-12.
- **Peso do corpo:** quem tem halteres ou academia faz o principal com carga.
- **Iniciante:** variações técnicas (arqueiro, nórdico, salto, terra, hollow) vão para o fim da lista.
- **Exercício já usado antes na semana** vai para o fim da lista. Assim o segundo dia do mesmo grupo varia o estímulo.
- **Duração estimada:** passa a usar o descanso de cada exercício.

**Resultado:**
- 0 problemas nas 768 fichas.
- Nenhum grupo grande em dias seguidos nas 98 combinações de dias.
- Séries semanais diretas por grupo grande (no máximo, entre todas as combinações):
  - Iniciante: até 12.
  - Intermediário: até 20.
  - Avançado: até 25.
  - Os máximos aparecem nos planos de 5 e 6 dias, em que o grupo treina 2× na semana.
- **Planos já salvos:** dos 108 planos gerados com o código da Beta 32, 99 tinham problema. Depois da correção única, nenhum tem. Os 565 exercícios principais que os alunos usavam foram mantidos, e o histórico também.

**Não alterei** (são regras de negócio; deixo como recomendação):
- O plano de 3 dias treina cada grupo 1× por semana e não tem glúteo, panturrilha nem trapézio isolados.
- Para hipertrofia, a frequência 2× por semana costuma render mais. Se quiser, posso transformar o de 3 dias em corpo inteiro ou superior/inferior.

## 4. Cronômetro, tela ligada, som e vibração

- **Cronômetro (único, no `app.js`):**
  - Guarda o horário em que o descanso acaba (`restFimEm`) e redesenha a cada 250 ms.
  - Ao voltar ao app (`visibilitychange`), mostra o tempo certo na hora.
  - Se o descanso acabou há mais de 15 s, não apita do nada: só avisa.
  - Há um banner e um intervalo só, mesmo iniciando várias vezes.
  - Nunca fica negativo (mínimo de 1 s).
  - O tempo é salvo no aparelho e o descanso volta depois de fechar o app.
  - É encerrado ao salvar o treino e ao sair da conta.
- **Tela ligada:**
  - `telaLigadaPedir/Soltar(motivo)` com os motivos `treino`, `registro`, `descanso` e `especial`.
  - Uma trava por vez; ela é pedida de novo ao voltar para o app.
  - Sem suporte ou sem permissão, nada trava.
  - **Treino ativo:** começa ao abrir o treino de musculação de hoje ainda não salvo, ao registrar série ou ao iniciar um descanso.
  - Fica ligada só na aba Treinos.
  - Termina ao salvar o treino, sair da conta, virar o dia ou após 20 min sem tocar na tela (sem descanso rodando).
- **Som:**
  - Agendado no `AudioContext` no início do descanso e cancelado ao pausar, ajustar o tempo, desligar o som ou encerrar.
  - Toca uma vez só.
  - Com o som desligado, não toca nada (testado contando osciladores).
- **Corrida, bike e caminhada:** o app não tem cronômetro ao vivo nessas modalidades (o registro é feito depois). Não há função compartilhada com o descanso.

## 5. Corrida

- **VDOT conferido com a tabela de Jack Daniels:**

| Marca | VDOT calculado | Tabela |
|---|---|---|
| 5 km em 25:00 | 38,3 | 38,3 |
| 5 km em 20:00 | 49,8 | 49,8 |
| 10 km em 50:00 | 39,9 | 39,9 |
| Maratona em 3:30 | 44,6 | 44,6 |

- Previsões e zonas também conferem. Por exemplo, o limiar com VDOT 45 dá ~4:37/km.
- **Simulação de 60 alunos por 20 semanas:** 4 perfis (nunca correu, pouco, regular, experiente) × 5 objetivos × 3 opções de dias.
  - Progressão de estágio e de nível coerente.
  - Volume sem saltos acima de 20%.
  - Qualidade nunca em dias seguidos nem colada no longão.
  - Semanas de recuperação a cada 4.
  - Polimento antes da prova.
  - Sem NaN em durações e distâncias.
- O único defeito encontrado foi o pós-prova (item 9), que foi corrigido.
- **Integração com a musculação:** o motor já evita qualidade no dia seguinte ao de pernas e avisa quando os dois caem no mesmo dia. Mantido.
- Bike e caminhada continuam como carga complementar, sem histórico paralelo.

## 6. Testes executados

| Teste | Resultado |
|---|---|
| `python3 fonte/montar.py --versao 33` (sintaxe de `app.js` e `app-plus.js`, 5 versões, Firebase do SW) | ✅ executado e aprovado |
| `node testes/regras.js` — 48 verificações (descanso, ritmo, VDOT, zonas, datas/semana, limpeza para o Firestore, escapes, RPE, papéis, sequência) | ✅ aprovado |
| `node testes/auditoria-musculacao.js` — 768 fichas + 98 combinações de dias | ✅ aprovado |
| `node testes/simulacao-corrida.js` — 60 alunos × 20 semanas | ✅ aprovado |
| `node testes/sincronizacao.js` — 15 verificações (junção, sem duplicar, exclusão não volta, cache antigo) | ✅ aprovado |
| `node testes/migracao-fichas.js` — planos da Beta 32 | ✅ aprovado (99 → 0) |
| `testes/navegador.py` — Chrome, Firebase simulado: todas as abas × 8 temas × musculação/corrida, 13 janelas, celular 360/390 px e computador 1366 px | ✅ executado: 0 erros de console, 0 páginas mais largas que a tela, 0 janelas com falha, 0 IDs repetidos, 0 textos abaixo do contraste AA |
| `testes/cronometro.py` — 21 verificações (±15 s, pausa, tela bloqueada simulada, 1 banner, fim, som desligado, vibração 1×, treino ativo, volta ao app, retomar após reabrir) | ✅ aprovado (Wake Lock e áudio **simulados**) |
| `testes/atualizacao.py` — service worker real: Beta 32 instalada → publica Beta 33 → atualiza sozinha → modo avião | ✅ aprovado na Beta 33 · ❌ a mesma rotina **reprova na Beta 32** (abre sem o `app.js`) |
| Contraste sobre fundos com gradiente/imagem | ⚠️ parcial: esses elementos não são medidos pelo teste automático |
| Revisão de português | ⚠️ parcial: busca de palavras sem acento e termos em inglês nos textos da interface; não encontrei erros objetivos. O corretor automático em português não foi conclusivo |
| Firebase real (login Google/e-mail, regras, cota, `onSnapshot` entre aparelhos) | 🔸 depende de ambiente externo: não executado |
| Som, vibração, Wake Lock e tela bloqueada em celular | 🔸 depende de aparelho físico: não executado |
| PDF, compartilhamento (Web Share), vídeos, foto da galeria | 🔸 não executado nesta auditoria (sem mudança de código nessas partes) |

## 7. O que não foi corrigido (e por quê)

1. **Tom da linguagem.** Há ~120 usos de "pra" e algumas frases como "Bora". É uma escolha de estilo, não um erro. Não alterei em massa porque você pediu para não mudar por preferência. Se quiser padronizar para "para" e um tom mais formal, faço numa versão própria.
2. **Plano de 3 dias** com frequência 1× por semana por grupo. É regra de negócio (seção 3).
3. **Planos editados em dois aparelhos ao mesmo tempo.** Trocar de plano em um aparelho e treinar no outro no mesmo minuto: vence o plano gravado por último. O histórico de treinos é juntado.
4. **Acessibilidade.** Vários botões só com ícone ainda não têm `aria-label`; corrigi apenas os do cronômetro. Não há trava de zoom, e o foco visível foi adicionado.
5. **iPhone.** `navigator.vibrate` não existe no Safari. O Wake Lock só existe a partir do iOS 16.4. Com a tela bloqueada, o iOS pausa o JavaScript e o som pode não tocar. O app segue funcionando sem esses recursos.
6. **Android com economia de bateria agressiva.** O som agendado pode atrasar até o app voltar. O cronômetro mostra o tempo certo de qualquer forma. Precisa de teste em aparelho.

## 8. Arquivos modificados

- **`app.js`:**
  - segurança do painel;
  - junção de cópias e escuta da nuvem;
  - gravação sem regravar a aba;
  - cronômetro, tela ligada, treino ativo e som;
  - gerador de fichas (papéis, descanso, quantidade e teto);
  - `exPattern`;
  - semana local;
  - ritmo;
  - sequência;
  - salvar treino 2×;
  - ouvintes duplicados;
  - datas locais;
  - escape do apelido.
- **`index.html`:** CSS do banner de descanso, avisos acima do cronômetro, foco visível e versão.
- **`service-worker.js`:** offline após atualizar, `cache:'reload'`, Firebase na instalação e só respostas boas.
- **`firestore.rules`:** validação do e-mail no documento do aluno.
- **Partes de `fonte/app-plus/`:**
  - `00`: versão;
  - `05`: dias planejados e próximo treino;
  - `06`: id do descanso na atualização;
  - `11`: pós-prova e escape no painel;
  - `15` e `17`: datas locais;
  - `30` (nova): correção única das fichas salvas.
- **`app-plus.js`:** remontado.
- **`fonte/montar.py`:** confere a versão do Firebase.
- **Documentos:** `NOTAS-DA-VERSAO.md`, `ROTEIRO-DE-TESTES.md` (estava escrito "Beta 25"), `MAPA-DO-CODIGO.md`.
- **Novos:** `RELATORIO-AUDITORIA-BETA33.md` e a pasta `testes/`, que não precisa ser publicada.

## 9. Funcionalidades preservadas

Todas continuam funcionando:
- login (Google, e-mail e usuário interno) e acesso offline por 30 dias;
- planos e trocas fixadas pelo aluno;
- calistenia;
- motor de corrida;
- histórico, arquivo anual, PDF, backup e restauração;
- conquistas, Conquista Especial, desafios mensais e temáticos;
- alimentação e água;
- Meta Assistente;
- Home inteligente e desenho do Início;
- personalizar o Início;
- modo computador;
- Central de compartilhamento;
- 8 temas e estilos de ícone;
- painel administrativo (permissões de principal e secundário iguais);
- atualização automática **sem botão**.

Os dados antigos são lidos como antes. As marcas novas (`b33Semana`, `b33Fichas`, `histExcluidos`) são acrescentadas sem apagar nada.

## 10. Para testar no celular

Siga o `ROTEIRO-DE-TESTES.md`. Prioridade:
1. modo avião logo após atualizar;
2. descanso com a tela bloqueada (som e vibração);
3. tela ligada durante o treino;
4. dois aparelhos na mesma conta;
5. painel do administrador depois de publicar as regras novas.

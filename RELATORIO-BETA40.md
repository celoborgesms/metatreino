# Relatório técnico — MetaTreino 2027.1 Beta 40

Base: Beta 39. **As regras do Firestore mudaram** (publicar `firestore.rules`). Novo: pasta `functions/` (exclusão de contas pelo painel, opcional, exige plano Blaze).

## 1. Planos Gratuito e Premium

### Fonte do plano
`usuariosAutorizados/{email}` passou a ser o **plano** da pessoa. O aluno não grava nesse documento; só pode **criar uma vez** o próprio Teste Premium (regra: e-mail verificado, campos `plano`, `testeInicio`, `origem`, `name`; `plano == 'teste'`; `testeInicio == request.time`). Sem documento = Gratuito.

| Campo | Uso |
|---|---|
| `plano` | `teste` · `premium` · `gratuito` |
| `testeInicio` | data do servidor; o teste vale 30 dias (`TESTE_PREMIUM_DIAS`) |
| `premiumAte` | ms; `null` = sem prazo |
| `bloqueado`, `bloqueioMotivo`, `bloqueadoEm` | conta suspensa (não entra) |
| `active`, `expiresAt` (antigos) | continuam gravados pelo painel para versões antigas do app ainda abertas |

`planoDe(isAdmin, doc)` (app.js) decide: administrador → Premium sem prazo; `bloqueado` → bloqueado; documento antigo sem `plano` e `active:true` dentro da validade → Premium até a validade; vencido ou `active:false` → Gratuito (**não** bloqueado — só o novo "Suspender conta" bloqueia).

### Entrada
- Ninguém depende mais de liberação do treinador. Google ou e-mail confirmado entram; conta nova ganha o teste (`criaTestePremium`).
- E-mail ainda não confirmado continua vendo "Confirme seu e-mail" (as regras do Firestore exigem e-mail verificado para os dados da conta).
- Tela de login: **Continuar com Google** em primeiro lugar (um toque, e-mail já verificado); e-mail e senha logo abaixo. Conta nova só com **e-mail real**: o "usuário sem e-mail" deixou de ser criado (sem recuperação de senha e permitiria testes Premium sem limite). Contas antigas de usuário continuam entrando (ficam no Gratuito, sem teste — o admin pode dar Premium).
- Conta suspensa: tela "Conta suspensa" com o motivo e o contato.
- O acesso guardado no aparelho (offline) foi para a versão 40 (`v:40`): caches antigos são conferidos de novo na primeira abertura.

### Conferência contínua (`mtPlanoVerifica`, parte 36)
Na entrada, ao voltar ao app e de hora em hora. `state.planoVisto` (sincroniza) guarda o último plano visto; mudou → `mtPlanoMudou`:
- Premium/teste → Gratuito: aviso "Seu teste Premium de 30 dias terminou", nada apagado, contato para contratar; tema Premium trocado pelo equivalente gratuito (escuro → **Brasa**, claro → **Areia**) e guardado em `state.prefs.temaPremium`; o clima deixa de ser consultado.
- Gratuito → Premium: tema guardado volta sozinho, clima volta.
- Aviso de fim do teste 3 dias antes (uma vez por dia).

### Onde cada recurso é conferido (na função, não no botão)
| Recurso | Função controlada | Gratuito |
|---|---|---|
| Biblioteca | `goTab('library')`, `renderLibrary` | aviso Premium; lista não é montada |
| Ficha/vídeo de exercício | `openExerciseSheet` | liberado na aba Treinos/registro/plano e para exercícios do próprio plano (ou feitos nos últimos 14 dias); outros → aviso |
| Plano alimentar | `openNutri`, `nutriSet`, `nutriTrocar`, `nutriComi`, `nutriListaCompras`, `nutriEditar`, `nutriRemover`, `nutriAddAbrir` | aviso; dados (`state.nutri`, `state.nutriLog`) intactos |
| Relatório PDF | `arqRelatorio`, `arqGerarPDF` | aviso |
| PDF treino/alimentação | `_pdfGerar` (`pdfTreino`, `pdfAlimentacao`) | aviso |
| Início | `inicioOcultos`, `inicioAplicaOrdem`, `openPersonalizarInicio`, `piAlterar`, `piPreset` | "Completo" ou "Só o essencial" (`state.inicioBasico`); a escolha Premium fica guardada e volta |
| Temas | `applyTheme` (nunca aplica tema Premium), `setTheme` | Brasa e Areia |
| Clima | `loadWeather`, `_cenaClima` | sem localização nem busca; cenário pelo horário e datas especiais |
| Meta Assistente | `MA_ANSWERS[k]` (análises), `maNudge` (dicas proativas), `evoOfertaPendente`, `provaOrientacao`, `provaAviso`, `provaPosAviso`, `evoComando`, `maExtraWorkout`, `maTryCommand` (reorganizar plano/equipamento, "como fazer" fora do plano) | dúvidas do app, treino do dia, registrar peso/atividade/dor, provas cadastradas, comemorações de marcos |

**Limite honesto:** o app roda no aparelho. Quem modificar o JavaScript consegue ligar telas locais (temas, gerador de PDF). O que dá para garantir no servidor está garantido: o plano só muda por administrador e o teste só é criado uma vez, com a data do servidor.

### Temas
10 temas: os 8 anteriores + **Ametista** (escuro: ameixa, lilás e menta) e **Coral** (claro: papel quente, coral e azul-marinho), com prévia real (a mesma do cadastro). O tema "Premium" (preto e laranja) passou a se chamar **Brasa**, para não confundir com o plano. Escolha salva na conta (`state.prefs.tema`).

## 2. PDFs com identidade visual (parte 40)
- Desenhos vetoriais próprios em SVG (musculação: atleta com barra, halter e kettlebell; corrida: corredor, raias, percurso e bicicleta; alimentação: prato, talheres, brócolis, cenoura, maçã e folhas; evolução: curva de progresso, medalha e troféu). O SVG vira PNG transparente no aparelho (`_svgPng`) e entra no PDF; marca d'água a 7% no canto de cada página.
- Cores do tema do aluno, escurecidas até contraste mínimo no papel branco (`pdfCores`).
- Novos: **Plano de musculação** (por treino: exercício, grupo, séries, repetições, descanso, última carga e coluna de anotações), **Plano de corrida** (etapas, meta, orientação e escala de esforço), **Plano alimentar** (7 dias, cada refeição com alimentos, quantidades, kcal e macros, já com os ajustes do aluno; trocas equivalentes). O **Relatório de evolução** ganhou a mesma capa, cores e rodapé (conteúdo e cálculos iguais).
- Botões: tela do Plano (`renderPlan`), Perfil › Conta e dados, e dentro do plano alimentar.

## 3. Cadastro e usabilidade (parte 38 + ajustes)
| Item | Antes | Agora |
|---|---|---|
| Registrar peso | só "Salvar"; tocar fora dizia "use Salvar ou Cancelar" | Cancelar; sair com valor alterado pergunta "Descartar a alteração?" na própria janela (`janPerguntaDescartar`, parte 23 — vale para todas as janelas); sem alteração fecha direto |
| Estilo dos ícones | só no Perfil › Aparência | escolha no cadastro, junto do tema; salvo na conta (`state.prefs.icones`) e aplicado em todos os aparelhos; linha própria "Estilo dos ícones" no Perfil |
| Data de nascimento | o dia era cortado ao passar por fevereiro/ano comum e não voltava | o dia escolhido (`dEsc`) fica guardado; só o mostrado se ajusta ao último dia do mês (parte 34). Régua antiga que sai da folha não muda mais nada |
| IMC | — | "IMC estimado: 24,5. É uma referência…" abaixo de altura e peso, só com os dois preenchidos, sem classificação |
| Nível de atividade / objetivo | todas as explicações juntas | só a da opção escolhida (`WZ_EXPL`) |
| Calistenia/Híbrido | "Emagrecer" virava "Condicionamento" sem explicação; trocar mostrava opções sem relação | rótulos dizem o que fazem (ex.: "Condicionamento e emagrecimento"); explicação da opção; no Híbrido mostra o objetivo dos dias de academia (mesma conversão de `caliLerSetup`) |
| Data de início | "Deixe em branco para começar hoje" | diz o dia do **primeiro treino** a partir dos dias escolhidos (hoje, amanhã ou a data) — lógica de agendamento intacta |
| Tempo recente (corrida) | `<select>` do sistema + 3 campos | seletor próprio: distâncias 3/5/10/21/42 km, réguas h/min/s, Digitar, Cancelar/Confirmar, ritmo ao vivo e validação (mais rápido que o recorde mundial ou lento demais); grava nos mesmos campos que `_runLerAval` lê |

## 4. Treinos
### Dores e limitações (parte 39)
- Campo novo no plano de musculação (todas as modalidades): joelho, ombro, costas/lombar, punho/cotovelo, quadril, tornozelo/pé, evitar saltos. `setup.lim`. Na calistenia, vira as limitações que ela já entendia (`caliLimites`).
- `buildLiftExercises` passa por `limAdapta`: exercício que força a região (`LIM_REGRAS[k].evitar`) é trocado por outro do mesmo grupo, compatível com o equipamento, priorizando os mais seguros (`prefer`); sem alternativa, sai. Grupos da região: no máximo 3 séries e sem faixa de força (4–6 → 8–10).
- O aluno vê: passo na montagem do plano, aviso no topo do treino ("Treino adaptado (joelho): X no lugar de Y") com orientação de procurar avaliação profissional; o bônus cardio vira sem impacto.
- Teste: 6 limitações × 3 equipamentos — nenhum exercício incompatível no plano, treinos com 12+ exercícios.
- O "Estou com dor" (dor aguda) continua igual (bloqueia grupos inteiros temporariamente).

### Terreno da corrida
- **Trilha:** sem tiros curtos e velocidade (viram fartlek/subida); metas por esforço (sem ritmo por km); km previstos −15%; treinos de ritmo explicam que precisam de trecho plano; dicas de descida e aderência.
- **Esteira:** cada ritmo ganha a velocidade em km/h; 1% de inclinação; subidas pela inclinação (já existia).
- **Pista:** sem subidas (já existia), tiros em metros (já existia), voltas de 400 m nos contínuos; longão sugere rua/parque sem depender disso.

### Escala de esforço (RPE 1–10) — achado e correção
A sugestão de carga olhava o esforço do **último treino de qualquer grupo** e só reagia ao 9–10. Agora (`smartProgressionHint`):
- usa o esforço da sessão em que **aquele exercício** foi feito;
- topo da faixa com esforço ≤ 7 → sobe já (antes exigia 2 sessões);
- duas sessões seguidas no limite (9+) com repetições caindo → −10% de carga;
- treino leve (≤ 4) sem fechar a faixa → busca o topo da faixa.

### Auditoria dos planos (sem mudanças necessárias)
- 768 fichas (`auditoria-musculacao.js`): ordem, papéis e teto — ok. Auditoria extra (144 planos): grupo maior antes do menor em todos os treinos; nenhum grupo grande (peito, costas, pernas, glúteos, ombro) em dias seguidos; volume semanal sobe com o nível (ex.: peito 6–12 séries/semana no iniciante, 12–20 no intermediário, 13–24 no avançado de hipertrofia).
- Corrida: 60 alunos × 20 semanas (`simulacao-corrida.js`) — ok.

## 5. Painel administrativo (parte 37 + functions/)
- **Por que remover administrador "não funcionava":** a remoção gravava `ativo:false`, mas o app da pessoa mantinha `isAdmin = true` do acesso guardado no aparelho (até 30 dias) — o painel continuava aparecendo (as regras já negavam as gravações). Agora: o documento é **apagado** (e conferido), o app da pessoa escuta o próprio documento e sai do painel na hora, e `acessoConfereDepois` atualiza `isAdmin`. A conta e os dados de aluno continuam. O app não usa custom claims.
- Lista com todas as contas (inclusive sem documento de plano), filtros Premium/Teste/Gratuito/Vence em 7 dias/Bloqueados.
- Ficha: +30/+90/+1 ano, Premium sem prazo, Passar para Gratuito, Suspender/Desbloquear (com motivo), Remover cargo de administrador, Excluir conta.
- **Excluir conta:** confirmação digitando o e-mail; mostra nome, documentos, treinos e último uso. Chama a Cloud Function `adminExcluirConta` (Admin SDK): apaga logins do Authentication (todos os UIDs da pessoa), `usuarios/{uid}` com subcoleções, participações em desafios, `contas/{email}`, `admins/{email}`, e deixa em `usuariosAutorizados/{email}` só `{plano:'gratuito', contaExcluidaEm}` (impede outro teste com o mesmo e-mail). Sem a função publicada, o painel diz que **nada foi excluído** e oferece "Apagar só os dados e suspender", avisando que o login continua no Authentication.
- `adminLog`: toda ação (quem, o quê, em quem, quando). Só o principal lê (Painel › Registro de ações).

## 6. Arquivos
- `app.js`: plano (`planoDe`, `planoAtual`, `accessDaysLeft`, `accessLabel`, `criaTestePremium`, `telaContaSuspensa`), entrada (`afterGoogleSignIn`, `acessoConfereDepois`, `acessoCacheValido`), login (`doEmailAuth`, `dicaLogin`, `toggleAuthMode`), "Conceder Premium" (modal), `smartProgressionHint`.
- `fonte/app-plus/36-planos-gratuito-premium.js`, `37-admin-planos-contas.js`, `38-cadastro-correcoes.js`, `39-limitacoes-terreno.js`, `40-pdf-identidade.js` (**novos**).
- `fonte/app-plus/15-…pdf…` (capa/cores do relatório), `23-janelas-cliques.js` (descartar alteração), `34-controles-por-gesto.js` (data).
- `index.html`: login, tela de conta suspensa, cadastro (ícones, IMC, limitações), painel, CSS "Beta 40" (temas Ametista e Coral, planos, ícones, seletor de tempo).
- `firestore.rules`, `functions/index.js`, `functions/package.json`, `firebase.json` (**novos**).
- Testes: `testes/beta40.py` (**novo**, 128 verificações), `testes/mock-firebase.js` (conta nova, documentos iniciais, leitura negada sem e-mail verificado), `testes/nuvem-simulada.py` (regras novas), `testes/beta38.py` e `testes/acabamento.py` (10 temas e prévia real).

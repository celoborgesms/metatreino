# Mapa do código — MetaTreino

Guia para quem for mexer no app (você, outra IA ou outro desenvolvedor). Vale a partir da Beta 24.

## Arquivos publicados (raiz)

| Arquivo | O que é |
|---|---|
| `index.html` | Todas as telas (HTML) e todo o visual (CSS). O CSS vem em camadas: as regras de cada Beta ficam no fim do `<style>`, marcadas com `/* ===== Beta N ... */`. Uma regra mais abaixo vence a de cima. |
| `app.js` | O núcleo original: login, estado (`state`), salvar na nuvem, geração de planos, treinos, histórico, conquistas, Meta Assistente, painel ADM. |
| `app-plus.js` | **Não edite direto.** É montado a partir de `fonte/app-plus/` (veja abaixo). Estende o `app.js` sem reescrevê-lo. |
| `service-worker.js` | Funcionamento offline e atualização automática. A versão dele precisa ser igual à do app. |
| `jspdf.umd.min.js` | Gerador de PDF (jsPDF 2.5.2, licença MIT). Só é baixado quando alguém gera um relatório. |
| `firestore.rules` | Regras de segurança do Firestore. Publicar no Console do Firebase quando mudar. |
| `manifest.json`, `icon*.png/svg` | Instalação como app. |
| `fonte/` | Código-fonte do `app-plus.js` em partes + o script `montar.py`. Pode ficar no GitHub (não pesa para quem usa o app). |
| `testes/` | Testes automáticos (Beta 33). Não precisam ser publicados. Veja "Testes" abaixo. |

## Montar e trocar a versão

Na pasta do projeto:

```
python3 fonte/montar.py              # junta as partes no app-plus.js e confere sintaxe e versões
python3 fonte/montar.py --versao 33  # troca para "2027.1 Beta 33" em todos os lugares e monta
```

A versão aparece em 5 lugares (app.js, service-worker.js, index.html `?v=`, rodapé do Perfil e `MTP.versao`). Se ficarem diferentes, os celulares podem não atualizar sozinhos — o script avisa.

## As partes do app-plus (`fonte/app-plus/`)

Entram em ordem alfabética. **A ordem importa**: uma parte usa o que as anteriores definiram.

| Parte | Conteúdo |
|---|---|
| `00-base-utilitarios-ganchos.js` | `MTP`, `mtGancho` (ganchos), utilitários `mt*` (datas, histórico unificado, admin principal, escapes) |
| `01-icones.js` | Ícones de grupos musculares e medalhas |
| `02-biblioteca-ficha-player.js` | Biblioteca de exercícios, ficha técnica, player de vídeo |
| `03-fotos-navegacao-aparencia.js` | Fotos de evolução, navegação (Treinos, Progresso), temas e ícones |
| `04-desafios-tematicos.js` | Desafios temáticos do ano, missões, medalhas, participação |
| `05-home-inteligente-meta-assistente.js` | Sugestão inteligente da Home e respostas novas do Meta Assistente |
| `06-painel-adm-atualizacao.js` | Indicadores do painel, administradores e permissões, atualização automática |
| `07-videos-audio.js` | Áudio dos vídeos, vídeos indisponíveis/reportados |
| `08-home-alimentacao-graficos.js` | Carregamentos, seções recolhíveis da Home, alimentação, gráficos de Evolução (`mtChart`) |
| `09-calistenia.js` | Calistenia: progressões, modelos, painel |
| `10-estado-treino-feedback-conquista-especial.js` | Retomada, mensagens dos alunos, Conquista Especial animada, botões "recolher" |
| `11-corrida.js` | Corrida do iniciante ao avançado (níveis, VDOT, periodização, provas, painel, admin) |
| `12-prova-encerrar-plano.js` | Prova alvo removível, encerrar plano de musculação |
| `13-conquistas.js` | Detalhe animado das conquistas, Conquista Especial em duas etapas |
| `14-mural-notas-do-dia-temas.js` | Balão do assistente, mural/logo, destaques do dia no calendário |
| `15-arquivo-anual-pdf-seus-dados.js` | Arquivo anual (sem perder dados), histórico completo, relatório PDF, Seus dados, tamanho dos dados no ADM |
| `16-personalizar-inicio-computador.js` | Personalizar início, versão para computador |
| `17-desafios-resgate-limpeza-foto.js` | Aviso final e resgate de medalha, apagar dados de ex-alunos, foto mais leve |
| `18-perfil-em-grupos.js` | Perfil em grupos recolhíveis |
| `19-desempenho-historico.js` | Ordem do Desempenho, calendário e gráfico do Histórico recolhíveis |
| `20-alimentacao-rolagem.js` | Plano alimentar: mantém rolagem, refeição aberta e foco ao editar |
| `21-esforco-rpe.js` | Escala de esforço (RPE) nova — mesmas funções e valor salvo |
| `22-medalhas-fundos.js` | Medalhas (níveis comum/rara/especial) e fundos decorativos por aba |
| `23-janelas-cliques.js` | Fechar janelas (tocar fora com proteção, botão Voltar), janelas sem "Pronto", gráfico semanal do Histórico |
| `24-historico-paginas-desafios-futuros.js` | Paginação numerada do Histórico, detalhes dos desafios futuros |
| `25-treinos-desafios-progresso.js` | Andamento do treino, "o que falta" nos desafios, períodos no resumo, tela de preparo do plano |
| `26-central-compartilhamento.js` | Central de compartilhamento: dados do card (`mtsDe*`), desenho (`mtsDesenhar`), tela (`mtsAbrir`), ligação com os botões antigos |
| `27-treino-sem-repeticao-ficha.js` | Treinos sem exercício repetido (`treinoSemRepeticao`, correção única dos planos salvos), ficha do exercício em tela cheia |
| `28-inicio-cena-ordem.js` | Desenho do Início por horário, clima e datas (`cenaInicio`), selo do clima, ordem dos blocos do Início (`state.inicioOrdem`) |
| `29-modo-computador.js` | Modo computador: grade de duas colunas (`DK_LAYOUT`, `dkMontar`), faixa de números, painel lateral, atalhos |
| `30-auditoria-beta33.js` | Correção única das fichas salvas (`b33CorrigeFichas`, marca `state.b33Fichas`) |
| `31-sincronizacao-videos-parceiros.js` | Arquivo anual dos logins antigos, tela de Sincronização (`openSincronizacao`, `syncAgora`), parceiros e créditos dos vídeos (`openParceiros`, `pcProjecao`) |
| `32-acessibilidade.js` | Beta 35: nome (`aria-label`) para botões só com ícone, `role=button` + Tab + Enter/Espaço nos elementos com `onclick` (`a11yVarrer`, roda sozinho a cada mudança da tela) |

Parte nova: próximo número livre (ex.: `20-nome-da-funcao.js`).

## Como acrescentar comportamento a uma tela: ganchos

Para rodar algo depois (ou antes) de uma função de tela do `app.js`, use **`mtGancho`** — não crie mais uma camada `const _x = window.f; window.f = function(){...}`:

```js
mtGancho('renderProfile', { depois(){
  // roda depois que o Perfil é desenhado
}});
mtGancho('renderHome', { antes(){ /* roda antes */ }, depois(){ /* roda depois */ } });
```

- "depois" roda na ordem das partes (00, 01, 02...). "antes" roda na ordem inversa (igual às camadas antigas).
- Cada gancho roda isolado: se der erro, ele aparece no console e a tela continua funcionando.
- Funciona com funções assíncronas (ex.: `goAdmin`).

Funções que já usam ganchos: `renderHome`, `renderHomeMetrics`, `renderMonthlyCard`, `renderSessions`, `renderPerf`, `renderHistory`, `renderProfile`, `goAdmin`, `openStudent`, `closeModal`, `openTrophyDetail`, `openAparencia`, `openPersonalizarInicio`, `openAudioVideos`, `renderHistEvolution`, `renderChallenges`, `openMinhaConquistaShare`, `renderRecords`, `openExProgress`, `openExerciseSheet`, `aplicaInicio`, `openPersonalizarInicio`.

Embrulhar a função inteira (`window.f = function(){...}`) só quando for preciso **mudar os argumentos ou o resultado** dela.

## Regras que evitam quebrar o app

1. Nunca declarar de novo um `let`/`const` que já existe no `app.js` (dá erro e o app não abre). Funções podem ser estendidas com ganchos.
2. O estado do aluno é `state`. Depois de mudar algo, chamar `saveData()` (salva no aparelho e manda para a nuvem).
3. O documento do aluno na nuvem tem limite de 1 MB. Dado que cresce sem parar não vai no `state`: vai para o arquivo anual (parte 15).
4. Texto vindo do aluno ou do admin, quando entra em HTML, passa por `mtEsc()` ou `escHtml()`.
5. Depois de mexer: `python3 fonte/montar.py`, e testar no celular e no computador.

## Dados no Firestore

| Caminho | O que guarda | Quem lê/grava |
|---|---|---|
| `usuarios/{uid}` | Tudo do aluno (`estadoApp`): planos, últimos 90 dias de histórico, recordes, preferências. O `{uid}` é o de `contas/{email}.uid` (Beta 34), que pode ser de outro login da mesma pessoa | o próprio aluno (qualquer login com o mesmo e-mail verificado) e admins |
| `contas/{email}` | Beta 34: `{ uid, uids }` — qual documento de `usuarios` é o da pessoa | a própria pessoa (e-mail verificado) |
| `parceiros/{id}` | Beta 34: cadastro completo dos criadores dos vídeos (inclui contato privado) | só admins |
| `usuarios/{uid}/arquivo/{ano-semestre}` | Histórico com mais de 90 dias (cada registro como texto JSON) | o próprio aluno e admins |
| `usuariosAutorizados/{email}` | Acesso liberado pelo treinador (ativo, validade) | admins (o aluno lê o próprio) |
| `admins/{email}` | Administradores secundários | administrador principal |
| `config/mural`, `config/contato`, `config/calistenia`, `config/specialAward` | Mural/logo, contato, ajustes da calistenia, Conquista Especial | todos leem; admins gravam |
| `desafiosTematicos/{id}` e `.../participantes/{uid}` | Desafios criados e quem participa | ver regras |
| `videosExercicios`, `exerciciosCustom`, `caliExercicios`, `caliModelos` | Vídeos e exercícios cadastrados pelos admins. `videosExercicios.creditos` = só o que o admin liberou do parceiro (ficha/Biblioteca) | todos leem; admins gravam |
| `perguntasNaoRespondidas`, `relatos`, `videosReportados` | Mensagens e relatos dos alunos | aluno cria; admins leem |

O dono do app (administrador principal) é reconhecido pelo e-mail definido em `ADMIN_EMAIL` (app.js) e nas regras.

## Compartilhamento (Beta 26)

Para um card novo: escreva uma função que devolve os dados e chame `mtsAbrir(dados, funcaoDoModeloClassico)`.

```js
mtsAbrir({ tipo:'corrida', titulo:'Rodagem', data:Date.now(),
  hero:{ v:'7,3', u:'km' }, nums:[{ l:'Tempo', v:'42', u:'min' }], extra:['Prova'], texto:'Texto do compartilhar' });
```

`tipo` define a cor e o desenho de fundo. Também aceita `desc`, `medalha:{svg,cor}`, `nivel`, `periodo`, `serie` (números para a curva) e `kick` (o texto pequeno acima do título). Nunca coloque e-mail, peso ou medidas.

Sugestão de carga: use sempre `proxCarga(kg)` (app.js) para o próximo degrau, assim todas as telas mostram o mesmo número.

Modo computador: para mudar onde um bloco aparece no computador, edite `DK_LAYOUT` na parte 29 (topo, lado ou fim; o resto vai para a coluna principal).

Acesso offline: `acessoCacheValido` e `acessoConfereDepois` (app.js). O app entra com o acesso guardado (até `ACESSO_OFFLINE_DIAS` = 30 dias) e confere na nuvem em segundo plano.

Nenhum elemento pode passar da borda da tela no celular (deixa a página mais larga e o celular abre com zoom). Para conferir: `document.documentElement.scrollWidth` tem que ser igual à largura da tela.

## Sistemas centrais (Beta 33) — use estes, não crie outro

| Sistema | Onde | Como usar |
|---|---|---|
| Tipo de registro | app.js | `exTipoRegistro(id)`: carga · corpo · tempo · cardio · mobilidade (decide as colunas do registro de séries). Descanso do exercício: `descansoDoExercicio(id)`; regra em `liftDescanso(tier, objetivo, 50+, reps)`. |
| Descanso | app.js, "TIMER DE DESCANSO" | `startRestTimer(seg, nome)`, `stopRestTimer()`, `restAjusta(±s)`, `restPausa()`. Conta pelo horário (`restFimEm`), não por `left--`. `restTimerInt` ≠ null = descanso rodando. |
| Tela ligada | app.js, "TELA LIGADA" | `telaLigadaPedir('motivo')` / `telaLigadaSoltar('motivo')`. Uma trava só para o app; volta sozinha ao reabrir. `requestWakeLock()`/`releaseWakeLock()` = motivo `'especial'`. |
| Treino ativo | app.js | `treinoAtivoIniciar()`, `treinoAtivoEncerrar()`. Mantém a tela ligada na aba Treinos; termina ao salvar, sair, virar o dia ou 20 min parado. |
| Som do fim | app.js | `tocaSomFim(id, atrasoSeg)`. Respeita `restMuted` (salvo em `mt_descanso_mudo`) e `restVibrarLigado()` (`mt_descanso_vibrar`). |
| Semana | app.js | `semanaLocalId()` (segunda a domingo, horário do aparelho). Não use `Math.floor(Date.now()/7 dias)`. |
| Fichas | app.js | `buildLiftExercises(parts, setup, {indice, jaNaSemana, usadosSemana})`. Papéis em `LIFT_PAPEIS`/`liftSequencia`, descanso em `liftDescanso`, quantidade em `liftQuantos`, teto em `LIFT_TETO_SERIES`. |
| Documento de dados | app.js | **Sempre `uidDados()`**, nunca `fbUser.uid`, para ler/gravar `usuarios/{...}` e o arquivo anual. `resolveContaUnica()` liga o e-mail verificado a um documento só (`contas/{email}`). |
| Nuvem em tempo real | app.js | `ouveNuvem()` (começa no login). Nuvem mais nova → passa a valer aqui e o que só existe neste aparelho é juntado; mais antiga → junta o que falta. `salvarLocal()` grava só no aparelho (trocar de aba). |
| Vídeos | parte 07 / 02 | `mtMontarPlayer` (modo limpo, `_mtPlayerVars`), controles `mtTocarPausar/mtBuscar/mtVolume/mtVelocidade`. Créditos: `creditosHtml(id, 'ficha'|'biblioteca')` lê `videoCreditos` (campo `creditos` do vídeo). |
| Duas cópias do aluno | app.js | `mesclaEstado(base, outra, {desde})` junta histórico/séries/peso/conquistas. Ao excluir um registro do histórico, chame `marcaExcluido(modulo, registro)`. |
| Plano entre aparelhos (Beta 35) | app.js | `saveData()` marca `modules.lift/run.planAt` quando `setup` ou `plan` mudam (compara com `planoAssinatura`). Na junção, o plano com `planAt` maior vence. Depois de trocar `state` inteiro, chame `planoMarcaBase()`. |
| Divisão de 3 dias (Beta 35) | app.js, `generatePlan` | 3 dias com folga entre eles → Superior · Inferior + Core · Corpo inteiro (grupos grandes 2×/semana). Dias seguidos ou `setup.split3 = 'classico'` → divisão antiga. Teto de 90 min por treino em `buildLiftExercises`. |
| Fundos decorativos (Beta 36) | parte 22 / 28 | `updateDeco(tab)` desenha; `decoPosiciona(tab)` mede a faixa do topo (`DECO_FAIXA`: até o primeiro bloco de conteúdo) e grava `--deco-top`, `--deco-h`, `--deco-dir`. Todas as abas principais têm desenho. Início: `cenaInicio()` (camadas, classes `.c-*`), foto do perfil na linha do METATREINO (`inicioAvatarNoTopo`). Cores pelas classes `.d-*`/`.c-*` no CSS, nunca no SVG. |
| Registro de séries (Beta 36) | app.js | `concluirSerie(i)` (✓), `addSet()` (adicionar), `updateSet()` (editar, não toca no descanso). `curLog.feitas[]` só na tela (nada novo é gravado). `seriesPlanejadas(exId)`, `descansoAutomatico()` (`mt_descanso_auto`). |
| Compartilhar (Beta 36) | parte 26 | Sempre `mtsAbrir(d)`. A altura do bloco do card é medida com `_mtsMedidor` (contexto que não desenha); o nome entra no bloco. |
| Confirmação | app.js | `appConfirm(msg, onOk, {title, emo, okLabel, onCancel})`. Use antes de qualquer ação que apaga algo. |
| HTML com dado do aluno | app.js / parte 00 | `escHtml()` / `mtEsc()` para texto; `jsAttr()` dentro de `onclick="f('...')"`. |

## Testes

Na pasta do projeto (precisa de Node; os de navegador precisam de Python + Playwright):

```
node testes/regras.js                 # regras de negócio (descanso, ritmo, VDOT, datas, limpeza para a nuvem, escapes)
node testes/auditoria-musculacao.js   # todas as fichas possíveis (768) + 98 combinações de dias
node testes/simulacao-corrida.js      # 60 alunos simulados por 20 semanas de corrida
node testes/sincronizacao.js          # junção de duas cópias (outro aparelho/offline)
node testes/migracao-fichas.js PASTA_DA_BETA_32   # correção única dos planos antigos
python3 testes/navegador.py URL       # abas, janelas e 8 temas: erros, largura, contraste
python3 testes/cronometro.py URL      # descanso, tela ligada, som e vibração
python3 testes/atualizacao.py PASTA_ANTIGA PASTA_NOVA   # atualização automática + modo avião
python3 testes/dois-aparelhos.py PASTA_DO_PROJETO   # celular (Google) × computador (e-mail/senha), nuvem compartilhada simulada com as regras
python3 testes/videos-creditos.py PASTA_DO_PROJETO  # player limpo, parceiros, créditos e permissões
node testes/semana-menos-tempo.js     # corrida: semana com menos tempo
python3 testes/registro-series.py URL # registro de séries (carga/corpo/tempo), 1ª série e descanso, ficha, seleção de texto
node testes/beta35.js                 # plano entre aparelhos, corrida adaptada por dor, divisão de 3 dias, confirmação
python3 testes/acessibilidade.py URL  # nomes de botões, teclado, aviso acima das janelas, confirmação
python3 testes/acabamento.py URL      # 8 temas × 360/390/430 px: fundos, cena do Início, paletas, botão do assistente, seleção, rolagem
python3 testes/serie-descanso.py URL  # concluir série, descanso automático/manual, última série
python3 testes/compartilhar.py URL    # central de compartilhamento em sequência, estado limpo, nome na faixa
```
Os testes de navegador usam `testes/mock-firebase.js` (Firebase simulado, sem conta real) e `testes/semente.js` (aluno de exemplo). Para servir o site de teste: copie o projeto, troque os `<script>` do Firebase do `index.html` por `mock-firebase.js` e rode `python3 -m http.server`.

Escala de esforço: `rpeHtml(nota, 'musc')` usa as frases de musculação (`RPE_DESC_MUSC`); sem o segundo argumento, as de corrida, caminhada e bike (`RPE_DESC`).

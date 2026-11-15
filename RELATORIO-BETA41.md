# Relatório técnico — MetaTreino 2027.1 Beta 41

Versão: `2027.1-beta.41` (montada com `python3 fonte/montar.py --versao 41`).
Regras do Firestore: **sem mudança** (os campos novos ficam em `estadoApp` do documento da própria conta).

## Arquivos

| Arquivo | O que mudou |
|---|---|
| `fonte/app-plus/41-substituicao-favoritos.js` | novo — troca inteligente e favoritos |
| `fonte/app-plus/42-conquistas-desafio-mensal.js` | novo — aba Conquistas, fila de apresentação, encerramento do desafio mensal |
| `fonte/app-plus/43-visual-transicoes-desempenho.js` | novo — transições, montagem do plano, fundos decorativos, otimizações |
| `index.html` | bloco CSS "Beta 41" no fim do `<style>` (tokens de movimento, identidade dos temas, componentes novos, `prefers-reduced-motion`) e número da versão |
| `app-plus.js`, `service-worker.js`, `version.json` | gerados pelo `montar.py` |
| `testes/beta41.py` | novo — 72 verificações |
| `NOTAS-DA-VERSAO.md`, `ROTEIRO-DE-TESTES.md`, `MAPA-DO-CODIGO.md` | atualizados |

`app.js` (núcleo) não foi editado: tudo entra por cima, com `mtGancho` ou embrulhando a função no `window`.

## 1. Substituição inteligente

- `mtPadrao(ex)`: padrão de movimento + tipo (multiarticular/isolador) a partir de uma tabela de 31 regras sobre os 123 exercícios do catálogo (empurrar horizontal/inclinado/vertical, puxar vertical/horizontal, dobradiça de quadril, agachamento, unilateral de joelho, extensão/flexão de joelho, extensão de quadril, abdução/adução, flexão/extensão de cotovelo, deltoide posterior, core de estabilização/flexão etc.). Padrões vizinhos (`MT_VIZINHOS`) servem como "Compatíveis", nunca como "Mais compatíveis".
- `mtEquipClasse(ex)`: máquina, cabo/polia, barra, halteres, Smith, peso do corpo, objetos de casa.
- `mtCandidatosTroca(w, cur, motivo, setup)`: filtra equipamento do aluno (mesma regra do gerador, `limEquipOk`), limitações (`LIM_REGRAS`), nível (variações avançadas fora para iniciante), exercícios já no treino. Pontua padrão, tipo, ênfase (`sub`), objetivo, estímulo repetido no dia, aparelho ocupado (mesmo tipo de aparelho cai na fila com aviso), carga externa × peso do corpo. Inclui o mesmo padrão catalogado em outro grupo (ex.: pullover com halter para pullover na polia).
- Faixas: `mais` (mesmo padrão e pontuação alta), `compat` (mesmo padrão ou vizinho), `secund` (mesmo grupo, outro movimento — rotuladas como não equivalentes). `favs` = favoritos que estão em `mais`/`compat`.
- Troca da execução: o item vira `{…novo, troca:{ orig, dia, motivo, carga, em }}` com as mesmas séries/repetições/descanso (isometria ↔ repetições ajusta só a unidade). `dia` = data da próxima ocorrência do dia do treino. `mtTrocasExpirar()` (antes de `renderSessions` e `goTab`) devolve o original quando o dia passou. Registro de séries, `checkLiftDone`, `exercisesDone` e evolução funcionam sem mudança porque o item é um exercício normal.
- Histórico: gancho em `confirmLiftWorkout` grava `x.trocas[]` e `noLugarDe`/`noLugarDeId` no `exercisesDone`; `openHistoryEntry` mostra o bloco "Substituições neste treino".
- "Salvar no plano" (confirmação) converte para o mecanismo existente de fixar (`pinned` + `w.pins`), então "Voltar à sugestão" continua funcionando.
- Carga sugerida (`mtCargaSugerida`): última carga do próprio substituto; senão estimativa pela carga do original × fator do equipamento (halteres por mão etc.), −15% se o padrão muda, sempre com "ajuste na primeira série".
- Calistenia: o "Trocar" de exercício com `cadeia` continua indo para `caliAbrirTroca`.

## 2. Favoritos

`state.favoritos` (ids), sincronizado com a conta pelo `saveData` normal. Estrela na Biblioteca (sem abrir a ficha), na ficha (`openExerciseSheet`) e no cartão do exercício do treino. Chip "Favoritos" na Biblioteca (agrupado por grupo muscular; respeita o bloqueio Premium da Biblioteca). Gerar plano novo não mexe em `state.favoritos`.

## 3. Conquistas e desafio mensal

- `showAwards` não abre mais o carrossel: move a fila para `state.conqPend` (chave única; medalhas do mês com `@AAAA-MM`) e grava só no aparelho (`salvarLocal`); a nuvem recebe na próxima gravação normal. Uma gravação extra na nuvem 1 s depois do desbloqueio competia com mudanças vindas do outro aparelho (o teste `dois-aparelhos` pegou: apelido alterado no celular era sobrescrito pelo PC). `showMesFechado` desligado. A Conquista Especial configurada pelo administrador mantém a revelação própria.
- `openTrophies` novo: anel de progresso, contagem por raridade (`medalNivel`), resumo do desafio mensal pendente, "Novas conquistas" (até 5 detalhadas, o resto marcado como "Nova" na grade), filtros, grade por categoria com desbloqueada (data) / em andamento (barra) / bloqueada (cadeado), secretas ocultas, Conquista Eterna, medalhas e histórico de desafios mensais. Depois de apresentar: pendentes saem da fila, chaves vão para `state.conqVistas` (máx. 400) e o mês recebe `visto/vistoEm` → `saveData` → nuvem. Voltar do detalhe não reanima.
- Fim do mês: `checkMonthly`/`renderMonthlyCard` guardam `state.monthly.snap` (progresso de cada desafio). Gancho `antes` em `ensureMonthly` cria `state.desafiosEncerrados[]` (tema, meta = `SELO_MIN_NIVEIS`, níveis, total, selo, grupos) só quando o mês do aparelho (fuso local) é posterior ao guardado; não duplica (outro aparelho) e não encerra se o relógio voltou. Medalhas e pontuações continuam sendo arquivadas pelo código existente.
- Fora da aba: só o selo parado "Novidade" no cartão do Início e no bloco "Sua coleção".

## 4. Visual

- Temas: variáveis `--t-rc`, `--t-rb`, `--t-btn-sh`, `--t-in-bg/bd`, `--t-track`, `--t-fill`, `--t-modal(-bd)`, `--t-h-ls` e `--card-bg`/`--border`/`--shadow-sm` por tema; aplicadas com especificidade baixa a cartões, botões, campos, barras e janelas. Preferências, lista de temas e divisão Gratuito/Premium (`TEMAS_GRATIS`) inalteradas.
- Fundos decorativos: `DECO2_SVG` redesenhado (mesmas classes de cor, mesma faixa do topo, parado). O cenário do Início (parte 28) não mudou.
- Transições: tokens `--mt-ease`, `--mt-d1..3`; entrada de janelas, troca de conteúdo dentro da janela (WAAPI curto), seleção/pressão, `details`, mudança de tema (350 ms só nas superfícies principais), entrada em sequência após montar plano ou trocar de dia. `prefers-reduced-motion` desliga tudo.
- Montagem do plano: mesmas etapas reais, 0,36 s por etapa (antes 0,9–1,1 s), estado "Plano pronto".

## 5. Desempenho (medido com CPU 4× mais lenta, perfil de amostragem do Chrome)

| Ponto | Antes | Depois |
|---|---|---|
| `slug()` (normalização repetida) | ~20% do tempo de troca de aba | cache por texto |
| `mtFmtData` / `mtFmtKm` (`toLocale*` cria formatador a cada chamada) | ~45 ms em 24 trocas de aba | 1 `Intl` por formato |
| `decoPosiciona` (3 medições seguidas, layout forçado) | 3 por troca | 1 por quadro + 1 de ajuste |
| `_bytesDe` (Blob do estado inteiro) | Blob a cada chamada | contagem UTF-8 + cache por `_savedAt` |
| `backdrop-filter` na barra/janelas | ativo no celular | desligado em telas de toque |
| Listas longas | tudo desenhado | `content-visibility:auto` (Biblioteca, Histórico, grupos de Conquistas) |

Leituras do Firebase revisadas: não há leitura repetida por troca de aba (desafios temáticos e vídeos carregam uma vez no início; o painel só sob demanda).

## 6. Testes

`testes/beta41.py`: 72 verificações (substituição, favoritos, conquistas, desafio mensal, segundo aparelho, movimento reduzido, 10 temas × 6 abas em 320 px, toque, montagem, caches). Suítes anteriores reexecutadas, incluindo `dois-aparelhos` (20/20). `registro-series` tem 1 verificação que falha só aos domingos ("Aplicar remonta a semana": o único dia que sobra é o próprio domingo); falha igual na Beta 40 — não é desta versão.

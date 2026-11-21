# Relatório técnico — 2027 RC 0 (base: 2027.1 Beta 64)

**Firestore:** nada muda. Sem coleção nova e sem regra nova; `firestore.rules` igual ao da Beta 64 (`testes/regras.js` aprovado). Não precisa publicar as regras. Campo novo e opcional no estado do aluno: `runJornada = { lidas:{id:data}, oculta }` (só datas; passa pela limpeza da nuvem, conferido em teste). Dados antigos continuam válidos.

**Versão:** `2027-rc.0` / "2027 RC 0" nos 5 lugares (app.js, service-worker.js, `?v=` do index.html, rodapé do Perfil, `MTP.versao`). `fonte/montar.py --versao N` agora gera "2027 RC N" e confere os dois formatos (Beta e RC). `appVersaoLabel()` entende `-rc.`. A atualização automática Beta 64 → RC 0 foi testada (abaixo).

## 1. Como a auditoria foi feita (e o que ela não cobre)

- **Regressão completa duas vezes:** na Beta 64 original (referência) e na RC 0, no mesmo ambiente (Firebase simulado, Chromium, telas de 320 a 430 px e computador). Resultados lado a lado na seção 6.
- **Leitura do código** dos módulos que esta versão toca: cronômetro (núcleo "TIMER DE DESCANSO" e registro de séries), motor da corrida (parte 11: avaliação semanal, estágios, níveis, retomada, fases), dica de progressão da musculação (`smartProgressionHint`) e as dicas do Meta Assistente sobre cargas, alimentação (tabelas, trocas, compras, restrições), grupo da casa (partes 49, 55, 62, 65, 66), service worker e montagem da versão.
- **Sondagens no navegador** para riscos específicos: HTML de outra pessoa no aviso, na escolha do grupo e no cartão de compartilhar (escapado nos três); cálculo de calorias por objetivo; campo novo passando pela limpeza da nuvem; o PDF sem internet; a pílula do cronômetro sem cobrir o assistente.
- **Não foi auditado linha a linha nesta entrega:** `firestore.rules` (não mudou; a cobertura é a do `regras.js`), cadastro, Premium/teste grátis, painel do administrador, importação de relógio e conquistas. Para esses, o que vale é a regressão (todos passaram como na Beta 64). Não afirmo nada sobre eles além disso.
- **Sem aparelho real:** os testes rodam em Chromium com toque e tamanhos de celular. Som e vibração com a tela bloqueada, Safari/iOS e Android antigo **não foram testados** aqui.

## 2. O que está bom e deve ser preservado

- **Motor da corrida (parte 11).** A progressão já é individual e baseada em registros: o iniciante só muda de estágio com 2 treinos completos no estágio com esforço até 7/10; semana pesada (2 treinos não concluídos, treinos leves com esforço 8+, esforço médio alto) repete ou volta; menos de 50% feito repete a semana "sem compensar"; subir de nível exige critérios (volume médio, longão, regularidade, cumprimento) e pede autorização; retomada por tamanho da pausa; recuperação a cada 4 semanas a partir do intermediário; polimento e pós-prova; cada treino diz "por que" está ali. **Não mexi no motor.**
- **Gerador de musculação:** 576 combinações dentro do tempo, sem exercício repetido, equipamento certo, troca sem repetir (36.296 casos), modo adaptado que devolve o mesmo treino.
- **Progressão da musculação já existente:** progressão dupla (topo da faixa em todas as séries → `proxCarga`), esforço da sessão do próprio exercício, −10% após duas sessões no limite com repetições caindo, nada de volume extra automático.
- **Cronômetro (núcleo):** contagem pelo horário de término, um intervalo só, som agendado no relógio do áudio, um alarme só, pausa, ±15 s, retomada depois de fechar o app, tela ligada por motivo.
- **Segurança de conteúdo:** o que vem de outra pessoa entra escapado nas telas sondadas (aviso, grupo, compartilhar). Aviso usa texto puro.
- **Sincronização:** junção de duas cópias, exclusões marcadas, plano mais novo vence (`sincronizacao.js`, `dois-aparelhos.py`, `casa-dois-celulares.py`: aprovados).

## 3. Problemas confirmados (e o que foi feito)

| # | Problema | Como foi confirmado | Situação |
|---|---|---|---|
| 1 | **Sem internet, o 1º PDF (e o arquivo .fit) falhava** mesmo com o app instalado. A instalação guarda `jspdf.umd.min.js` sem `?v=`, mas o app pede `jspdf.umd.min.js?v=versão`; o cache-first do service worker não achava a cópia. | Teste no navegador: arquivo no cache, pedido offline com `?v=` → "falhou". Depois da correção → "carregou". | **Corrigido** (service-worker.js: `ignoreSearch` só para arquivos do próprio app, só no ramo cache-first). Teste novo. |
| 2 | **O banner do descanso ficava por cima da parte de baixo do registro de séries** (encostado em Voltar/Salvar) e, fora dele, ocupava a largura toda acima da barra de abas. | Captura de tela da Beta 64. | **Corrigido** com o cronômetro novo (dentro do registro; pílula fora dele). |
| 3 | **Platô de carga só aparecia no balão do assistente.** O registro de séries repetia "tente +1 repetição" indefinidamente quando o aluno estava parado havia semanas. | Leitura de `smartProgressionHint` (sem caso de platô) e de `maDicasConcretas` (tem, mas fora do treino). | **Melhorado**: caso "rever o exercício" no próprio registro e no painel novo. |
| 4 | Teste `atualizacao.py` só aceitava versões "beta.N". | Quebrou ao apontar para a RC. | **Ajustado** para aceitar "rc.N". |

Observação sobre o ambiente de teste: aqui não há internet. Os testes que exigem "nenhum erro no console" acusam `ERR_TUNNEL_CONNECTION_FAILED` (recurso externo bloqueado: fontes/vídeos) — **igual na Beta 64 e na RC 0** (beta38: 4, beta41: 6, beta42: 1, navegador: aviso). Não é defeito do app. O `atualizacao.py` com os arquivos reais também não roda aqui (Firebase vem da internet); rodei com o Firebase simulado na raiz (seção 6).

## 4. Parcialmente implementado (existe, mas não está completo)

- **Treino em dupla:** organiza equipamentos (0/1/2+) e evita o mesmo aparelho no mesmo dia; tem uma conquista de dupla. **Não há** combinação de horários, desafio em dupla nem incentivo entre participantes. Cada pessoa mantém o próprio plano (isso está certo e foi preservado).
- **Descanso com o app suspenso:** o som é agendado no áudio e costuma tocar no Android com a página viva; no iPhone em segundo plano não toca. Investiguei notificação local: `Notification Triggers` não foi lançado nos navegadores, e push exige servidor (Cloud Functions/Blaze), o que vai contra o plano gratuito. Ficou como limitação documentada, sem promessa na tela.
- **Explicação das mudanças da corrida:** existia, mas só dentro de "Evolução". Agora aparece no cartão de status (item 5 das notas).

## 5. O que mudou nesta versão (por etapa)

### Etapa A — Cardápio compartilhado e alimentos (partes 49, 55, 62, 65, 66 e nova 67)
- **Nome:** "Alimentação da casa" → **"Cardápio compartilhado"**; "Minha casa" → **"Meu grupo"**; prato/refeições "compartilhados", "lista de compras do grupo", botão "Grupo todo", selo "Compartilhada". Só textos visíveis: identificadores (`fam*`, `'casa'` como chave, `famTirarDaCasa`…), coleção `familias` e dados ficaram iguais. 126 trocas por script, conferidas por busca e por teste (nenhum "da casa" nas funções das telas do grupo).
- **53 alimentos** (31 saudáveis + 22 "fora da rotina"), valores aproximados por 100 g/ml (TACO, rótulos, preparo caseiro), conferidos por teste: kcal ≈ 4P + 4C + 9G (até 15% por causa da fibra de sementes e verduras).
- Saudáveis nas categorias normais, em `SUB_REFEICAO` (troca por equivalente) e nas equivalências. Ultraprocessados em `NUTRI_FORA_IDS`: o teste confirma que nunca entram no cardápio e nunca são sugeridos na troca.
- Restrições: iogurte grego, kefir, leite semidesnatado, vitamina, achocolatados, leite fermentado/condensado, picolé cremoso e empada em "lactose"; pão de fermentação natural, miojo, nuggets, empada, esfiha, bebida de aveia e hambúrguer industrializado em "glúten". **Leite sem lactose fica liberado** para quem marcou "sem lactose".
- **Preservado de propósito:** o cardápio sugerido não ganhou pratos novos. O prato do dia é escolhido pela posição na lista (`nutriVarIdx`); mexer na lista trocaria o cardápio e a lista de compras da semana em andamento (e o prato compartilhado dos grupos). Se quiser pratos novos com esses alimentos, o melhor momento é numa segunda-feira, avisando os alunos.

### Etapa B — Cronômetro (nova parte 68; núcleo intacto)
- Só desenho. `restDesenha`, `startRestTimer` e `stopRestTimer` embrulhados; a contagem, o som, a vibração, a pausa, a retomada e as preferências continuam no app.js.
- Três jeitos: **dentro do registro de séries** (anel de 150 px, 4 botões, não cobre "Salvar"), **pílula** (44 px de altura, ao lado do botão do assistente, sem cobri-lo) e **cartão** (anel de 124 px + botões + "Voltar ao treino").
- Cor: normal → amarelo (≤ 10 s, ou metade do total se o descanso for curto) → vermelho (≤ 3 s); pausado fica cinza. Transição suave; respeita "reduzir movimento".
- Robustez: o elemento fica guardado em `_rtEl`. Se uma tela redesenhar o modal, ele volta para o lugar no próximo tique, com o mesmo horário de término (teste: redesenhar não reinicia nem duplica). Nenhum `setInterval` novo (teste conta os intervalos de 250 ms).
- Cabe em 320 px (registro aberto e cartão expandido).

### Etapa C — Corrida (nova parte 69; motor intacto)
- **Jornada do primeiro passo:** 9 lições curtas; segurança nunca fica trancada (todas abertas). Sugestão pelo que aconteceu: último treino com esforço 8+ ou não concluído → "Sinais de que passou do ponto"; dia de treino perdido na semana → "Não compense"; senão, a próxima da ordem.
- Cartão para os níveis 0 e 1: estágio ou minutos contínuos de agora e **quantos treinos válidos já tem na semana**, contados com a mesma regra do motor (teste: treino com esforço 9 não conta).
- "Última mudança" no cartão de status (todos os níveis), com o motivo real de `motor.hist`.
- Lição de sinais de alerta: manda parar e procurar atendimento; não faz diagnóstico.
- Revisão da prescrição para quem já corre (leitura do motor + 60 alunos × 20 semanas e 104.320 planos com tempo limite, aprovados): volume sobe no máximo ~8% por semana e uma variável por vez; qualidade só fora da adaptação/base (ou nível 3+); semana de recuperação a cada 4; longão limitado por objetivo e nível; taper e pós-prova. Não encontrei erro que justificasse mexer no motor.

### Etapa D — Musculação (nova parte 70)
- **Rever o exercício:** 4 sessões, primeira e última com 20+ dias de distância, a última nas últimas 3 semanas, sem subir carga, sem ganhar repetição e sem fechar a faixa. Não entra se a dica do dia já é subir ou aliviar. Carga sugerida: −10% arredondado em 0,5 kg. Peso do corpo: variação mais fácil ou troca.
- **Painel "Progressão das cargas"** na aba Treinos (só musculação, só quando há histórico): cada exercício do plano com a situação, a última série de referência e a mesma orientação do registro de séries. Explica a regra. Abrir o painel não altera o plano (teste).

## 6. Testes — resultados reais

**Novo:** `testes/rc0.py` — **56 verificações, 0 falhas.**
Cobre: nomes do grupo, alimentos (existência, categoria, macros, restrições, nunca no cardápio/troca, busca, equivalências), cronômetro (dentro do registro, não cobre Salvar, redesenho, pílula sem cobrir o assistente, minimizar sem reiniciar, expandir, cores, anel, pausa, voltar ao treino, som e vibração pelas preferências antigas, pular sem som, um alarme só, sem intervalo extra, 320 px), corrida (jornada, contagem pela regra do motor, sugestão, lida/próxima, ocultar/mostrar, níveis, motor intacto, "última mudança"), musculação (platô e os 4 casos que não são platô, prioridade de "subir", painel, plano intacto), campo novo na nuvem, PDF sem internet e versão.

**Atualização automática Beta 64 → RC 0** (`atualizacao.py` com Firebase simulado na raiz): instalada 2027.1-beta.64 → atualizou sozinha para 2027-rc.0 → reaberta offline na RC 0 → 1ª visita já offline abre a RC 0. **Aprovado.** Controle: com os arquivos originais (Firebase real), o mesmo teste falha aqui também de Beta 64 → Beta 65, porque o ambiente não tem internet.

**Regressão completa** (mesmo ambiente, mesma ordem):

| Teste | Beta 64 (referência) | RC 0 |
|---|---|---|
| acabamento | 32/0 | 32/0 |
| acessibilidade | 7/0 | 7/0 |
| beta37 | 8/0 | 8/0 |
| beta38-temas | sem problema | sem problema |
| beta38 | 83/4 * | 83/4 * |
| beta39 | 94/0 | 94/0 |
| beta40 | 128/0 | 128/0 |
| beta41 | 66/6 * | 66/6 * |
| beta42-conta | 69/0 | 69/0 |
| beta42 | 11/1 * | 11/1 * |
| beta43 | 78/0 | 78/0 |
| beta44 | 51/0 | 51/0 |
| beta46 | 29/0 | 29/0 (textos novos) |
| beta48 | 56/0 | 56/0 |
| beta49 | 39/0 | 39/0 (textos novos) |
| beta50 | 40/0 | 40/0 |
| beta51 | 18/0 | 18/0 |
| beta52 | 20/0 | 20/0 (textos novos) |
| beta53 | 14/0 | 14/0 |
| beta54 | 38/0 | 38/0 |
| beta55 | 45/0 | 45/0 |
| beta58 | 60/0 | 60/0 |
| beta59 | 11/0 | 11/0 |
| beta60 | 8/0 | 8/0 |
| beta61 | 12/0 | 12/0 |
| beta63 | 39/0 | 39/0 |
| beta64 | 18/0 | 18/0 (textos novos) |
| compartilhar | 10/0 | 10/0 |
| cronometro | 21/0 | 21/0 |
| navegador | IDs repetidos 0, contraste 0 | IDs repetidos 0, contraste 0 |
| registro-series | 23/0 | 23/0 |
| serie-descanso | 24/0 | 24/0 |
| casa (dois celulares) | 47/0 | 47/0 (textos novos) |
| dois-aparelhos | 20/0 | 20/0 |
| videos-creditos | 29/0 | 29/0 |
| **rc0 (novo)** | — | **56/0** |
| auditoria-musculacao (node) | sem problema | sem problema |
| beta35 (node) | 23/0 | 23/0 |
| corrida-tempo-limite (node) | 104.320/0 | 104.320/0 |
| regras (node) | 61/0 | 61/0 |
| semana-menos-tempo (node) | 34/0 | 34/0 |
| simulacao-corrida (node) | sem problema | sem problema |
| sincronizacao (node) | 18/0 | 18/0 |
| troca-sem-repetir (node) | 36.296/0 | 36.296/0 |

\* Todas as falhas marcadas são a mesma: "sem erros de JavaScript" acusando `ERR_TUNNEL_CONNECTION_FAILED` (recurso externo bloqueado neste ambiente sem internet). Mesma quantidade na Beta 64 e na RC 0; nenhuma outra falha.

## 7. Arquivos modificados

- Novos: `fonte/app-plus/67-alimentos-rc0.js`, `68-cronometro-circular.js`, `69-jornada-corrida.js`, `70-progressao-musculacao.js`, `testes/rc0.py`, `RELATORIO-RC0.md`.
- Alterados: `fonte/app-plus/49-alimentacao-casa.js`, `55-casa-ajustes-cardapio.js`, `62-pdf-beta58.js`, `65-motor-individual-dupla.js`, `66-alimentos-casa-beta64.js` (só textos visíveis), `00-base-utilitarios-ganchos.js` (versão), `app.js` (versão e `appVersaoLabel`), `service-worker.js` (versão e `ignoreSearch` no cache-first), `index.html` (versão), `app-plus.js` (montado), `fonte/montar.py` (formato RC), `MAPA-DO-CODIGO.md`, `NOTAS-DA-VERSAO.md`.
- Testes atualizados para os textos novos: `beta46.py`, `beta49.py`, `beta52.py`, `beta64.py`, `casa-dois-celulares.py`; `atualizacao.py` aceita "rc.N".
- `firestore.rules`, `functions/`, `manifest.json`: sem mudança.

## 8. Limitações e próximos passos que realmente agregariam

1. **Testar em aparelho real** (Android e iPhone): som/vibração do fim do descanso com a tela bloqueada, a pílula ao lado do assistente em telas com barra de gestos, e o PDF offline depois de instalar.
2. **Tamanho do código carregado na abertura:** o `app-plus.js` tem ~1,7 MB sem minificação (71 partes) e é lido inteiro ao abrir. Em Android antigo (o caso do Redmi da Beta 5) isso pesa. Minificar na montagem (ex.: terser no `montar.py`, gerando um arquivo `.min` para publicar e mantendo as partes legíveis) deve reduzir bastante o tempo de abertura. Não fiz nesta versão porque muda o processo de publicação.
3. **Dupla:** combinar horários e um desafio/meta em dupla usando o grupo que já existe (sem novo sistema de grupos), mantendo planos individuais.
4. **Conquistas novas** sugeridas e não implementadas: primeira semana completa da jornada da corrida, "voltou depois de rever um exercício e subiu a carga", "respeitou a recuperação" (semana de recuperação cumprida sem compensar).
5. **Pratos com os alimentos novos** no cardápio: só numa virada de semana, pelo motivo da seção 5A.
6. Não revisados a fundo nesta entrega (só regressão): cadastro, Premium, Home, Histórico, Perfil, painel do administrador, importação.

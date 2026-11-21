# Relatório técnico — Beta 64

**Firestore:** nada muda. Sem coleção nova, sem campo novo no grupo da casa, regras iguais (`testes/regras.js`: 61 ok). Não precisa publicar o `firestore.rules`.

## 1. Pedidos desta versão

| Pedido | O que foi feito | Onde |
|---|---|---|
| Botão de treino em dupla mais discreto, embaixo | Link de texto no fim de `#scr-sessions .wrap` (`#dupla-linha`): "Equipamentos da academia" ou "Equipamentos e treino em dupla" (com casa). Pendências aparecem como texto pequeno ao lado. | parte 65, `mtDuplaLinha` |
| "Quantos aparelhos" fechava a cada toque | O `<details>` guarda o estado em `window.__dpEqAberto` e a rolagem do modal é preservada no redesenho (`mi.dataset.tela='dupla'`). | parte 65, `openTreinoDupla`/`duplaQtd` |
| Opção 0, 1 ou 2 | `_duplaQtd` aceita 0; `_eqTenho(st)`; `_duplaEstacaoLivre` devolve falso com 0; `mtDuplaConflitos` gera `{falta:true}` mesmo sem parceiro; "Organizar" funciona sem parceiro quando há falta. | parte 65 |
| Halteres, barra, elásticos etc. | Lista dividida em "Pesos livres e banco" e "Máquinas e cabos" (`MT_EQ_GRUPOS`), com halteres, barra e anilhas, bancos, rack, barra fixa, paralelas. **Elásticos e kettlebell não entraram:** nenhum exercício da biblioteca usa, então marcar não mudaria nada (a tela explica). | parte 65 |
| Conectar a casa no Perfil | Linha "👥 Minha casa" depois de "Minha rotina de trabalho" (`openMinhaCasa`). Na Alimentação: entrada completa só com grupo ativo; sem grupo, uma linha discreta que leva ao Perfil. | partes 49 e 66 |
| Casa com muitas funções | `openFamilia` reorganizado em blocos: Pessoas (aberto), Refeições da casa (recolhido, com economia/troca própria), Compras e cardápio (2 botões), Treino em dupla, "Sair do grupo" como link. Nenhuma função removida. | parte 49 |
| Barra de macros não mudava | A barra usa os gramas reais do dia (`diaReal`, já com as trocas) e mostra a meta pequena ao lado. | arquivo principal, `openNutri` |
| Mais alimentos e bebidas | 54 itens (`NUTRI_MAIS`) com valores aproximados da TACO por 100 g/100 ml e porção comum; categorias `bebidas` e `pratos`. Bebida alcoólica: as kcal incluem o álcool, os macros não. Itens com leite/trigo entram nas listas de lactose/glúten. | parte 66 |
| Busca maior | `nutriAddFiltra`: sem acento, todas as palavras, apelidos (`NUTRI_APELIDOS`), ordem por "começa com". | parte 66 |

## 2. Checkup — o que foi verificado e o que estava errado

### Corrigido
1. **Restaurar backup quebrado desde a Beta 52.** `52-telas-sem-piscar.js` declarou `function _mtRestaura(mi, anc, sel, chave)` (rolagem). Como declarações de função valem para o arquivo inteiro e a última vence, ela substituiu `_mtRestaura(est, data, liberado)` da parte 44 — a restauração caía no `catch` e mostrava "Não consegui conferir o backup". Renomeada para `_mtRestauraBackup`. O teste `beta42-conta.py` já acusava 3 falhas e passou a 0. Varredura: não há outro nome de função repetido entre as partes; contra o arquivo principal só `openExercise`, `openMedals` e `renderLibrary`, que são substituições intencionais e conferidas.
2. **Tempo por sessão não respeitado em treinos "Superior"/"Corpo inteiro".** Lá todos os exercícios são "principais" e o corte só tirava acessórios: 3 dias × 30 min saía com 44–48 min. Agora, se ainda passar, sai o 2º exercício de um grupo (o 1º de cada grupo fica).
3. **Grupo do nome sumindo com pouco tempo.** O corte por tempo tirava o único exercício de bíceps antes do 3º de costas ("Costas + Bíceps" sem bíceps). Ordem nova: (a) acessório de grupo com 2+ exercícios, (b) 2º exercício de qualquer grupo, (c) acessório que sobrar.
   - Matriz de 576 combinações (objetivo × nível × equipamento × 3–6 dias × 30/45/60/90 min): número de dias, duração ≤ tempo + 5 min, sem exercício repetido no dia, equipamento compatível, e com 45 min ou mais todo grupo do treino tem exercício. Com 30 min, os treinos de 4+ dias têm todos os grupos do nome; nos de 3 dias (Superior / Inferior + Core / Corpo inteiro, 4 grupos em 3 exercícios) um grupo pequeno fica de fora — é o limite real de 30 min.
4. **"Estou sem dor" trocava os acessórios.** `regenLiftExercises` remontava do zero. Agora um wrapper guarda o plano (`lift.antesAdapt`) ao entrar em dor/TPM/modo leve e devolve os mesmos exercícios ao sair, se for a mesma semana e o setup não mudou; trocas manuais feitas no meio-tempo são reaplicadas (`applyPins`). O guardado some ao voltar ao normal.
5. "1 pessoas" → "1 pessoa" (Perfil e Alimentação).

### Testado e sem problema
- Início: tela pronta em ~0,3 s no servidor local (sem rede). Em celular real depende da rede; nada novo foi carregado no início.
- Corrida: 60 cenários × 20 semanas (`simulacao-corrida.js`) e 720 planos de tempo limite. Sem alteração no motor (pedido: "Corrida — não alterar").
- Dor (6 regiões), férias (liga, cartão no Início, desliga e guarda o período), 10 temas, biblioteca e ficha, peso (registro atualiza a meta calórica pelo cálculo, sem número arbitrário), resumo da semana, PDFs de treino, alimentação e relatório, troca de módulo e abas.
- Importação de relógio, conquistas, trocar/favoritar/reiniciar/apagar histórico: testes existentes (beta43, beta44, beta58–63, troca-sem-repetir, registro-series) todos passando.
- Janelas: continuam como folhas por cima da tela; as altas (casa, equipamentos) já ocupam quase a altura e rolam por dentro. Tela cheia não traria ganho e mudaria o padrão do app inteiro, então ficou como está.

## 3. Testes
- Novo `testes/beta64.py` (18 verificações).
- Atualizados: `beta63.py` (link "Equipamentos" agora aparece sem casa), `acabamento.py` (painel ADM só abre para admin desde a Beta 48), `beta42-conta.py` (desenho da Corrida redesenhado na Beta 59).
- Regressão completa: ver o fim deste relatório.

## 4. Regressão completa (Beta 64)
Todos os testes do projeto rodaram em sequência no build final:
- Playwright: acabamento 32/0, acessibilidade 7/0, beta37 8/0, beta38-temas sem problema, beta38 87/0, beta39 94/0, beta41 72/0, beta42-conta 69/0, beta42 12/0, beta43 78/0, beta44 51/0, beta46 29/0, beta48 56/0, beta49 39/0, beta50 40/0, beta51 18/0, beta52 20/0, beta53 14/0, beta54 38/0, beta55 45/0, beta58 60/0, beta59 11/0, beta60 8/0, beta61 12/0, beta63 39/0, **beta64 18/0**, casa (dois celulares) 47/0, compartilhar 10/0, cronômetro 21/0, dois aparelhos 20/0, navegador (janelas 0 falhas, IDs repetidos 0, contraste 0), registro de séries 23/0, série e descanso 24/0, vídeos e créditos 29/0.
- Node: auditoria da musculação sem problema, beta35 23/0, corrida com tempo limite 104.320/0, regras do Firestore 61/0, semana com menos tempo 34/0, simulação da corrida sem problema, sincronização 18/0, troca sem repetir 36.296/0.
- `beta40.py`: oscila entre 128/0 e 125/3 (biblioteca no plano Gratuito), **igual na Beta 63** — é tempo de espera do teste, não mudou nesta versão.

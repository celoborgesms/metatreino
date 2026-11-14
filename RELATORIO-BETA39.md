# Relatório técnico — MetaTreino 2027.1 Beta 39

Base: Beta 38. Regras do Firestore, coleções e permissões: **sem mudança**. Dados novos ficam no documento do aluno (`state`), que já sincroniza: `evolucao`, `provaAvisos`, `maBoasVindas`.

## 1. Problemas encontrados

| Problema | Causa | Correção |
|---|---|---|
| Data de início não apagava (musculação e corrida) | Campo de data nativo: no Android/PWA o seletor não oferece limpar | "×" no próprio campo e "Sem data" na régua. Também para data e horário da prova. Sem data, o plano começa hoje (lógica já existente, testada). |
| Conversa antiga do assistente depois de "Começar do zero" | A conversa fica no aparelho (`localStorage`, `mt_ma_thread`, até 3 h) e não era apagada. Em outro aparelho, a cópia local também voltava. | `doRestart` apaga a conversa e os avisos já mostrados. `maLoadThread` descarta qualquer conversa gravada antes de `state.zeradoEm`, o que vale em todos os aparelhos porque `zeradoEm` sincroniza. A conversa nunca foi para o Firestore. |
| Corrida subia de nível sozinha | O motor fazia `motor.nivel++` quando os critérios fechavam | Vira oferta (`rOfertaNivel`); só sobe com "Aceitar" (`rAplicarNivel`). |
| A régua podia "voltar" ao valor anterior depois de rolar pela roda do mouse | O ajuste final usava o valor do quadro anterior | O ajuste lê a posição atual (encontrado pelo teste). |

## 2. Controles por gesto (parte 34)

- **Componente único.** `nrConfig` decide o tipo do campo: `num`, `dist` (km + metros), `dur` (min/s ou h/min/s), `hms` (grupo de 3 campos), `data` ou `hora`. `nrRegua` é a régua. `nrAbrir` monta a folha.
- **Rolagem.** A régua é rolagem horizontal nativa: o embalo é o do sistema, sem travar a página. Ao parar, encaixa no traço (`scrollend` ou fim do toque).
- **Desenho.** Os traços são um fundo em gradiente (um elemento por régua). Só os números maiores viram elementos. Uma faixa de 30 a 250 kg com passo de 0,1 não pesa.
- **Mouse.** Arrastar com embalo e roda do mouse.
- **Teclado e acessibilidade.** A régua é `role="slider"` com `aria-valuenow`/`aria-valuetext`. Setas, PageUp/PageDown e Home/End funcionam. Enter no campo abre a folha. Digitar um número com a folha aberta já entra em "Digitar".
- **Campos.** O campo fica `readonly` + `inputmode="none"` e o teclado não abre. O valor volta para o mesmo `<input>` com os eventos `input`/`change`, então nenhuma tela mudou a forma de ler o valor (`updateSet`, `saveRunLog`, `saveQuiz`…).
- **Campos que aparecem depois** (janelas, séries) entram sozinhos (MutationObserver).
- **Campos de fora.** Texto e busca não são tocados. `data-teclado` exclui um campo.
- **Por que réguas e não "+/−".** A régua é um gesto contínuo de um dedo (ajuste fino devagar, salto grande com peteleco). É o padrão de apps de treino, e a mesma peça serve para números, datas e tempos.

## 3. Evolução de nível (parte 35 + motor da corrida, parte 11)

**Musculação** (`evoLiftAvaliar`). Iniciante → Intermediário → Avançado. Todos os critérios precisam estar em dia:

| Critério | → Intermediário | → Avançado |
|---|---|---|
| Semanas no nível | 8 | 16 |
| Treinos na janela | 16 em 8 semanas | 36 em 12 semanas |
| Regularidade | 2+ treinos/semana em 5 de 6 semanas | 3+ em 10 de 12 |
| Aderência (4 semanas) | 70% | 80% |
| Cargas (e1RM) nos exercícios principais | +7,5% em 3 | +5% em 4, nenhuma caindo |
| Força relativa | — | agachamento, supino e terra contra o peso do corpo (sem esses dados: um principal a mais subindo) |

Para os dois níveis, também:
- **Esforço:** média de RPE até 7 nos últimos 6 treinos, sem nenhum 9+ nos últimos 3. Sem RPE registrado, vale ter 2 treinos marcados como fáceis.
- **Recuperação:** sem dor registrada e sem pausa de 10+ dias.

Calistenia continua com o nível recalculado pela parte 09.

**Corrida.** Os critérios são os do motor:
- estágio final da caminhada + corrida;
- 30 minutos contínuos com esforço até 6;
- `rCriteriosNivel` para os níveis 2 a 5.

Recuar (semana pesada, pausa) continua automático e retira a oferta.

**Ao aceitar:**
- **Musculação:** `setup.level` novo + `generatePlan('lift')` + `regenAllPlans()` (trocas fixadas e dores respeitadas). `setup.transicao`: 2 semanas com séries e teto de volume do nível anterior (`buildLiftExercises`). Depois o plano é refeito completo (`evoTransicaoFim`).
- **Corrida:** `rAplicarNivel` a partir da semana seguinte. O motor já dá 4 semanas de base a um nível novo.

**Recusa.** `state.evolucao[m].recusa = { para, ate }` (6 semanas × número de recusas). O motor e a avaliação não oferecem a mesma subida antes disso. "Quero subir de nível" reavalia na hora. Toda decisão vai para `state.evolucao.log`.

**Onde aparece:**
- cartão no topo do Início (no lugar do cartão do dia, até ter resposta);
- balão do assistente (no máximo 2 dias);
- abertura da conversa.

Com dor ou férias registradas, a oferta não aparece.

## 4. Provas (parte 35)

Marcos por distância: 5 km 7/3/1; 10 km 10/4/1; 21 km 14/7/2; 42 km 21/10/3/1.

Cada texto é próprio da distância e do momento. Os números vêm do plano:
- volume planejado nesta semana × a anterior (motor);
- esforço médio recente;
- dica do `raceSmartTip` (maior corrida × distância da prova);
- aviso de musculação de pernas perto da prova.

Cada marco é mostrado uma vez (`state.provaAvisos[data].vistos`). O cartão "Prova" do Início passa a mostrar a orientação do marco.

Depois da prova (até 3 dias), aparece um pedido do resultado com a recuperação da distância. O registro feito por esse botão é marcado `isRace` (com `provaData`) e entra nos recordes.

## 5. Arquivos alterados

- `app.js`:
  - `buildLiftExercises`: transição de nível;
  - `maLoadThread`: descarta conversa anterior ao recomeço;
  - `doRestart`: limpa conversa e avisos do assistente.
- `fonte/app-plus/11-corrida.js`: subida de nível vira oferta (`rOfertaNivel`, `rAplicarNivel`); recuo retira a oferta.
- `fonte/app-plus/34-controles-por-gesto.js` (**novo**), `fonte/app-plus/35-evolucao-provas-assistente.js` (**novo**).
- `index.html`: CSS "Beta 39" no fim do `<style>`.
- `app-plus.js`, `service-worker.js`: gerados / versão.
- `testes/beta39.py` (novo). `testes/beta38.py`: altura, peso e data agora são gravados como a régua grava.
- Documentos: `NOTAS-DA-VERSAO.md`, `ROTEIRO-DE-TESTES.md`, `MAPA-DO-CODIGO.md`, este relatório.

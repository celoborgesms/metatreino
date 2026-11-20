# Estudo — exportar treinos do MetaTreino para o Intervals.icu (e daí para o relógio)

Situação: **análise feita, código da exportação ainda NÃO alterado**, como pedido. A Beta 56 entregue agora traz só as correções visuais. A exportação entra depois da sua aprovação.

## 1. O que existe hoje no MetaTreino

- **Corrida (parte 11, `rSessao`):** cada sessão do plano fica em `state.modules.run.plan.workouts[]`, com:
  - `name`, `dayIdx`, `duration`;
  - `motor.tipo` (leve, longão, limiar, tiros_curtos, fartlek…) e `motor.alvo` (texto);
  - `blocks`: Aquecimento / Principal / Desaquecimento, cada um com `exs[]` = `{ name, desc, min }`.
- **Como as repetições ficam guardadas:** só no **texto** ("8× 400 m (90 s trotando entre)", "4× (2 min correndo leve + 1 min caminhando)"). Não existe uma lista de passos estruturada.
- **Ritmos-alvo:** existem quando o app conhece o atleta (zonas `Z` em min/km, por exemplo limiar 5:10–5:25). Quem está começando recebe só esforço (RPE). Não há zonas de frequência cardíaca próprias do aluno.
- **Musculação:** exercícios, séries, repetições, carga e descanso, por grupo muscular.
- **Downloads hoje:**
  - PDF (jsPDF);
  - imagem (canvas, Central de compartilhamento);
  - arquivo original importado (Blob + `<a download>`).
  - Os três funcionam no Android, no iPhone e no PWA, e a exportação usaria o mesmo caminho.
- **Firestore:** a exportação não precisa de nada novo. Ela lê o plano que já está no aparelho.

## 2. O que o Intervals.icu aceita (fontes oficiais e fórum do próprio Intervals)

- **Formatos de treino planejado:** FIT de treino estruturado (*workout*), ZWO, MRC e ERG, além do **texto do Workout Builder**.
  - No calendário, a API aceita "zwo, fit, mrc and erg".
  - Na tela do site, um FIT de treino pode ser importado no editor ou numa pasta da **biblioteca**. Depois é só arrastar para o calendário.
- **FIT de atividade ≠ FIT de treino.** O Intervals.icu separa os dois: o de atividade é o que já importamos na Beta 54, e o de treino é outro tipo de arquivo (`file_id.type = workout`, mensagens `workout` + `workout_step`).
- **ZWO, MRC e ERG:** foram feitos para bike e rolo (potência ou %FTP). Para corrida com ritmo, **não servem**.
- **Texto do Workout Builder:** aceita ritmo absoluto (`- 5m 5:10-5:25/km Pace`), repetições (`Main Set 8x`), distância (`0.4km`), tempo (`2m`) e zonas do próprio atleta (`Z2 HR`, `Z2 Pace`).
- **Regras que afetam o relógio:**
  - **um tipo de alvo por treino.** O Intervals.icu exige que todos os passos usem o mesmo alvo (ritmo, FC ou potência) para enviar a Wahoo e Suunto. Na Garmin, misturar ritmo e FC costuma falhar;
  - **Garmin:** se o atleta não configurar o "ritmo de limiar" (threshold pace) da corrida no Intervals.icu, o ritmo chega no relógio como "sem alvo";
  - **origem do treino:** treinos importados de outros calendários (ICS) às vezes **não** vão para o Zepp; um treino criado no calendário do próprio Intervals vai. Há também um relato de FIT enviado por API que não chegou à Garmin. Por isso, o caminho mais seguro é o aluno **colar/criar o treino no calendário do Intervals.icu**, e não depender de importação externa.

## 3. Modalidades

| Modalidade | Exportar para o Intervals.icu | Executar como treino estruturado no relógio | Decisão |
|---|---|---|---|
| **Corrida** (contínua, intervalada, por tempo, por distância, com aquecimento/desaquecimento) | Sim (texto do builder ou FIT de treino) | Sim, nos relógios da matriz abaixo | **Incluir** |
| **Caminhada** do plano de corrida (iniciante) | Sim, como "Walk" ou "Run" | Depende do relógio: Zepp e Garmin aceitam "Run"; "Walk" não é garantido | Incluir como **corrida/caminhada** com aviso |
| **Musculação** | Só como evento "WeightTraining" com **texto** | **Não.** O Intervals.icu não tem passos de exercício, séries e cargas. No Zepp, treinos de força do Intervals **não aparecem** no relógio; na Garmin, os treinos de força com exercícios vêm do Garmin Connect, não do Intervals | **Não incluir** (seria "parecer que funciona") |

## 4. Matriz de compatibilidade (Intervals.icu → relógio, treino planejado)

| Fabricante | Atividades feitas → Intervals | Recebe treino planejado do Intervals? | Etapas estruturadas no relógio | Limitações conhecidas |
|---|---|---|---|---|
| **Amazfit / Zepp** | Sim | **Sim**, desde 2025, pelo Zepp (Perfil › Contas de terceiros) | Sim (corrida, bike, natação) | Começou pelo **T-Rex 3 Pro** (o seu) e há relatos no Balance 2. Força e elíptico **não** aparecem. Treinos que entram por calendário externo podem não sincronizar |
| **Garmin** | Sim | **Sim** (Connect: "Upload planned workouts", próxima semana) | Sim | Precisa do ritmo de limiar configurado no Intervals; não misturar ritmo e FC |
| **COROS** | Sim | **Sim** | Sim | Há relatos recentes de falha de sincronização e de exclusões que não chegam |
| **Suunto** | Sim | **Sim** (SuuntoPlus Guides) | Sim (ritmo, FC, potência, cadência) | Todo o treino com o mesmo tipo de alvo; o treino aparece em "Guias", não no calendário do app |
| **Huawei** | Sim | **Sim** ("planned runs", corrida) | Sim | Documentado só para corrida |
| **Wahoo** | Sim | **Sim** (ELEMNT/ROAM/BOLT; o RIVAL é um caso à parte) | Sim | Mesmo tipo de alvo em todos os passos; voltado mais para bike |
| **Polar** | Sim | **Não** (a API da Polar não aceita treinos de fora) | — | Não dá para receber |
| **Apple Watch** | Por apps de terceiros | Não pelo Intervals.icu | — | Precisaria de app de terceiros |

**Nada disso foi testado fisicamente por mim.** A matriz vem da documentação e do fórum oficial do Intervals.icu, da Zepp e da Wahoo. Seu T-Rex 3 Pro é o primeiro teste real possível.

## 5. Solução gratuita mais simples (recomendada)

**Para o aluno no celular, copiar e colar é mais simples que arquivo.** No iPhone, baixar um `.fit` e enviá-lo pela biblioteca do Intervals.icu (que é pensada para computador) é a parte mais difícil.

**Botão principal: "Copiar para o Intervals.icu"**
- O app gera o texto do treino no formato do Workout Builder: aquecimento, bloco com repetições, desaquecimento, e o ritmo-alvo quando o app conhece o aluno.
- **Caminho do aluno:** MetaTreino → **Copiar** → Intervals.icu (calendário › dia › "Adicionar treino" › Corrida › colar na descrição) → o Intervals monta as etapas sozinho → o relógio recebe na próxima sincronização.
- Como o treino é **criado no calendário do próprio Intervals**, ele entra no caminho que sincroniza melhor (item 2).

**Opção secundária: "Baixar arquivo .fit"**
- Gera um FIT de **treino estruturado** (tipo workout, passos com tempo/distância, repetição e faixa de velocidade), para importar na biblioteca do Intervals.icu pelo computador.
- **Nome do arquivo:** `metatreino_corrida_<tipo>_<data>.fit`.

**Alvos:**
- **Quando o aluno tem ritmos:** ritmo absoluto (min/km) em **todos** os passos, incluindo aquecimento e recuperação, porque o treino precisa de um tipo de alvo só.
- **Sem ritmos (iniciante):** **zonas do próprio atleta no Intervals** (`Z1/Z2 HR`), traduzidas do esforço da ficha. Assim valem as configurações do aluno lá, sem inventar números.
- **Instrução em 4 passos:** a tela avisa para configurar o ritmo de limiar (Garmin) e ligar "Enviar treinos planejados" no relógio.
- **Sem servidor e sem chaves:**
  - sem conta conectada, sem API e sem Cloud Functions;
  - nada novo no Firestore.
  - A conexão automática por API fica para depois, se fizer falta de verdade.

## 6. Onde fica (discreto)

- **Na ficha do treino de corrida (Treinos › sessão):** um link pequeno no fim, "⌚ Enviar para o relógio (Intervals.icu)". Ele não ocupa espaço de botão principal.
- **Ao tocar:** abre uma folha com o resumo das etapas, "Copiar" e "Baixar .fit", e as instruções curtas.
- **Integrações e atividades:** ganha uma linha "Treinos para o relógio" que explica e leva à sessão de hoje. É o mesmo lugar onde o aluno já cuida de relógio.
- **Na musculação:** nada aparece.

## 7. Arquivos que vou alterar

- **Novo `fonte/app-plus/61-exportar-treino-relogio.js`:**
  - `rExportPassos(w)` (sessão → passos estruturados, função pura);
  - `rExportTexto(passos)` (texto do Workout Builder);
  - `rExportFIT(passos)` (gerador FIT de treino próprio, sem biblioteca, com CRC);
  - a folha "Enviar para o relógio" e o link na sessão.
- **Sem mudança na estrutura dos treinos:** a conversão lê `blocks` e `motor` do jeito que estão. Os padrões de repetição já são gerados pelo próprio app, então dá para reconhecê-los com segurança. Se algum não for reconhecido, aquele bloco vira um passo por tempo com o texto como observação, e o app avisa.
- Notas, mapa do código, roteiro, testes e versão (Beta 57).

## 8. Testes

- **Automáticos:**
  - um conjunto de 9 treinos: contínuo, caminhada/corrida, longão com final no ritmo de prova, limiar 4× 8 min, 8× 400 m, 6× 200 m, fartlek, subida e prova;
  - em cada um, o texto confere com a estrutura esperada (passos, repetições, tempos e distâncias, ritmos);
  - o FIT gerado é lido de volta pelo **decodificador oficial da Garmin** (usado só no teste) e pelo leitor do app: tipo workout, número de passos, repetição, durações e faixas de velocidade;
  - download no Android/iPhone/PWA, que usa o mesmo mecanismo do PDF e já funciona.
- **O que não consigo testar daqui (e vou declarar assim):**
  - a importação real no Intervals.icu e a sincronização com relógio, porque não tenho conta nem relógio;
  - **teste de aceitação no seu T-Rex 3 Pro:** colar uma corrida leve e um intervalado no Intervals.icu, conferir as etapas lá, sincronizar e ver as etapas e os ritmos no relógio.

## Fontes

- [Intervals.icu — Integrações](https://www.intervals.icu/integrations/)
- [Fórum Intervals — enviar treinos planejados (API: zwo, fit, mrc, erg)](https://forum.intervals.icu/t/uploading-planned-workouts-to-intervals-icu/63624)
- [Fórum Intervals — importar e baixar FIT de treino e de atividade](https://forum.intervals.icu/t/import-and-download-workout-and-activity-fit-files/19295)
- [Fórum Intervals — suporte Amazfit (Zepp): treinos planejados no T-Rex 3 Pro](https://forum.intervals.icu/t/amazfit-zepp-support-available/107652)
- [Zepp — TrainingPeaks e Intervals.icu no Zepp OS 5](https://os.zepp.com/news/train-smarter-with-trainingpeaks-and-intervalsicu)
- [Fórum Intervals — Garmin Connect: enviar treinos planejados](https://forum.intervals.icu/t/upload-planned-workouts-to-garmin-connect/1521)
- [Fórum Intervals — ritmo some na Garmin sem threshold pace](https://forum.intervals.icu/t/structured-running-workouts-from-intervals-to-garmin-connect/130705)
- [Fórum Intervals — Suunto (SuuntoPlus Guides)](https://forum.intervals.icu/t/upload-workouts-to-suunto-watches/9560)
- [Fórum Intervals — Wahoo (mesmo tipo de alvo)](https://forum.intervals.icu/t/planned-workouts-with-wahoo-now-supported/54795)
- [Fórum Intervals — Polar não aceita treinos](https://forum.intervals.icu/t/load-the-programmed-training-in-polar-flow/6064)
- [Fórum Intervals — COROS sem sincronizar](https://forum.intervals.icu/t/coros-training-plan-is-created-but-planed-workouts-are-not-syncing/131097)
- [Fórum Intervals — treinos importados de calendário não vão para o Zepp](https://forum.intervals.icu/t/imported-calendar-workouts-are-not-uploaded-to-zepp/130800)
- [Fórum Intervals — ritmo absoluto no Workout Builder](https://forum.intervals.icu/t/support-for-running-pace-or-speed-in-workout-builder-syntax-done/91362)

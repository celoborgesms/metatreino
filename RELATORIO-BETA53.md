# Relatório — MetaTreino 2027.1 Beta 53

Versão **2027.1-beta.53**. As regras do Firestore não mudaram.

## 1. Como era (causa)
- **Semana:** a meta usava um fator de atividade pela quantidade de dias diferentes com treino na semana (até 1 dia: 1,2; 2 a 3: 1,375; 4 a 5: 1,55; 6 a 7: 1,725).
- **Dia:** cada dia variava só ±5% entre dia de treino e de descanso.
- **O que isso ignorava:** a duração, a distância, o tipo de treino, as duas sessões no mesmo dia e o que foi feito de fato.

## 2. Como ficou
- **Arquivo:** `fonte/app-plus/56-energia-do-dia.js` (novo). O montador do cardápio do núcleo e o da parte 49 passam a usar `nutriDiaEnergia`.
- **Conta do dia:** gasto do dia = metabolismo basal × 1,4 (rotina sem exercício; a FAO usa 1,40 a 1,69 para vida sedentária) + gasto líquido dos treinos do dia.
- **Gasto de cada tipo de sessão:**

  | Sessão | Como é calculada |
  |---|---|
  | Musculação | (MET 5 − 1) × peso × horas; MET 6 no emagrecimento e na resistência |
  | Corrida com distância | 0,95 kcal por kg por km |
  | Corrida sem distância | (MET − 1) × peso × horas, pelo tipo: leve e longão 9, regenerativo 7,5, intervalado 9,5, ritmo 10,5, corre e caminha 6 |
  | Caminhada | 0,5 kcal por kg por km |
  | Bike | MET 6, 8 ou 10, conforme a velocidade |
  | Duas sessões no mesmo dia | somam |
- **Previsto × feito:**
  - **Dia passado:** vale o registro; sem registro, descanso.
  - **Hoje:** o registrado mais o que ainda está previsto, menos o que foi pulado.
  - **Futuro:** o plano.
- **Objetivo, ajuste pelo peso real e mínimo seguro:** como antes, aplicados sobre o gasto do dia.
- **Macros:** proteína e gordura fixas; o carboidrato acompanha o dia.
- **Média da semana:** sai do mesmo modelo, pelos treinos previstos.
- **Tela:** quadro com o detalhe do dia e dicas para longão, treino intenso e dia com dois treinos. O texto "Gasto estimado" virou "Média da semana".

## 3. Efeito nas calorias (homem, 80 kg, 1,78 m, 30 anos, antes do objetivo)
| Rotina | Antes | Agora |
|---|---|---|
| 4 musculações de 55 min | 2.740 | 2.642 (−4%) |
| 4 musculações + 3 corridas leves de 45 min | 3.049 | 2.848 (−7%) |
| 5 corridas, 40 km por semana | 2.740 | 2.909 (+6%) |
| 3 musculações | 2.430 | 2.600 (+7%) |

E dentro da semana:
- um longão de 20 km soma cerca de 1.500 kcal naquele dia;
- 3 km leves somam cerca de 230 kcal.

O ajuste automático pelo peso real (±100 kcal a cada 2 semanas de registros) continua corrigindo para cada pessoa.

## 4. Testes
- **Novo `testes/beta53.py`: 14 ok.**
  - **Modelo:** a média da semana bate com os dias, e a rotina é o metabolismo basal × 1,4.
  - **Ordem dos dias:** descanso < musculação < musculação + corrida, e as sessões somam.
  - **Longão:** 20 km e 3 km pela fórmula; o dia de longão fica com meta maior e dica de carboidrato.
  - **Macros:** a proteína é igual em todos os dias.
  - **Previsto × feito:** dia passado sem registro = descanso; com registro, vale o que foi feito. Hoje, o treino previsto sai quando é pulado, e a bike avulsa soma com o treino ainda previsto.
  - **Segurança:** emagrecer nunca fica abaixo do metabolismo basal.
  - **Tela:** o quadro aparece.
- **Regressão:** beta52 (19), casa-dois-celulares (30), beta51 (18), beta50 (40), beta49 (39), beta48 (56), beta46 (29), beta44 (51), beta43 (78), beta42 (12), beta41 (72), beta40 (128), beta39 (94), beta38 (87), beta37 (8), registro-series (23), serie-descanso (24), cronometro (21), compartilhar (10), acessibilidade (7); Node: regras (61), sincronizacao (18), semana-menos-tempo (34), beta35 (23).

## 5. Limites (honestos)
- **Estimativas:** são valores médios por MET e por km. Relógio ou frequência cardíaca seriam mais precisos; o app ainda não lê esses dados.
- **Outras modalidades:** calistenia e outras atividades de plano não entram no gasto do dia, porque o cálculo usa só musculação e corrida. Atividades avulsas de corrida, caminhada e bike entram.

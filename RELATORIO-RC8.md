# Relatório técnico — MetaTreino 2027 RC 8

Pedido: registrar cochilos e o tempo acordado no meio da noite, sem desfazer o que funciona. Versão trocada uma vez (2027-rc.8). Regras do Firestore sem mudança. Sem migração: só registros novos usam os campos.

## Dados
- **Noite:** `state.sono.n[dk].acor` = minutos acordado no meio da noite (inteiro, 0–300, opcional). `sonoMinDe` (fonte única da duração, parte 76): com os dois horários, devolve `horários − acor`; sem `acor`, o resultado é igual ao de antes. `min` gravado já é o líquido. `sonoSalvar` (linha rápida da manhã) usa a mesma conta.
- **Cochilos:** `state.sono.c[dk] = { l:[{ min, ini? }], em }`, por dia, separados da noite. Assim médias, `sonoRuim`, regularidade, sono × atividade e "Registradas" não mudam. Lista vazia com `em` = apagados. 180 dias, como as noites.
- **Junção (`mtSonoMescla`):** o `acor` vai junto com a noite (vale o `em` mais recente). Os cochilos são juntados por dia (vale o `em` mais recente; lista vazia vence uma lista antiga).

## Telas
- **Formulário (parte 81):**
  - campo "Acordado no meio da noite (min)" só no modo horários;
  - validação: 0–300, e menor que o tempo na cama;
  - bloco "Cochilos" (até 3; duração 5–240 min; hora de início opcional), com os seletores por gesto;
  - total: "Dormiu X (Y na cama − Z min acordado) · cochilos W · total no dia".
- **Início:** "+ cochilo X" no atalho do Sono.
- **Histórico:** "Z min acordado · + cochilo X" em cada noite, e a seção "Cochilos (30 dias)": quantidade, média e os últimos cinco dias.

## Testes (navegador simulado, não aparelho real)
- **Novo `testes/rc8.py`: 17/0.** Cobre:
  - noite antiga sem mudança;
  - total com o tempo acordado e as validações;
  - reabrir o formulário e o modo "só o total";
  - cochilos: limite de 3, separados da noite, média sem mudança;
  - atalho do Início e histórico;
  - dia só com cochilo;
  - junção: apagado não volta, de outro aparelho entra.
- **Suítes anteriores:**
  - `rc7.py`: 10/0;
  - `rc6.py`: 19/0;
  - `rc5.py`: 23/0;
  - `rc4.py`: 93/0;
  - `rc3.py`: 98/1, a mesma falha do RC 4 ("tema da conta A");
  - `sincronizacao.js`: 18/0.

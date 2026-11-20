# Relatório — MetaTreino 2027.1 Beta 52

Versão **2027.1-beta.52** em todos os lugares. As regras do Firestore não mudaram: o perfil de cada pessoa no grupo já era livre para o próprio dono.

## 1. Problemas (causa real)
| Pedido | Causa |
|---|---|
| O cardápio não mostrava as calorias a mais ou a menos quando o administrador mexia no prato da casa | Desde a Beta 49, tirar ou acrescentar um alimento recalculava o resto do prato para manter as calorias de cada pessoa. O total quase não mudava, e por isso não havia diferença para mostrar. |
| O PDF não separava o que cada pessoa vai comer | Cada pessoa publicava só os totais de compra; o cardápio do PDF era só o prato, sem as quantidades individuais. |

## 2. O que foi feito
- **Saldo de calorias da casa (`49-alimentacao-casa.js`):**
  - **Cálculo:** a porção de cada pessoa sai do prato original. O que foi tirado sai, e o que foi acrescentado entra na proporção dela. A diferença para o recomendado aparece na refeição e no topo do dia.
  - **Ajuste fino do dia:** a correção de ±3% usa o recomendado, para não "devolver" o ajuste por baixo.
  - **Opção:** `config.compensa`, "Manter as calorias de cada um", volta ao comportamento anterior.
- **Semana de cada pessoa publicada no grupo (`perfis[uid].semana`):**
  - **Conteúdo, por dia:** recomendado, saldo da casa, planejado com os próprios ajustes, e as refeições com prato e gramas por alimento.
  - **O que não vai:** peso, idade, altura e e-mail.
  - **Tamanho:** cerca de 3 a 5 KB por pessoa.
- **PDF da casa:**
  - resumo por dia e pessoa (recomendado, planejado, diferença e motivo);
  - cardápio de cada pessoa, separado;
  - compras somadas, com a parte de cada um.
  - **Sinal de menos:** no PDF aparece como hífen, porque a fonte embutida não tem o sinal de menos.
- **Lista de compras no app:** só os totais; a divisão por pessoa ficou no PDF.
- **Cardápio:** mais 45 pratos com os alimentos que já existem. Cada refeição ganhou de 4 a 7 opções, e almoço, lanche da tarde e jantar ganharam opções vegetarianas.
- **"Fora da rotina":** 18 alimentos com valores médios por porção.
  - Ficam só em "Adicionar alimento", com calorias e % da meta, sem mensagem de culpa.
  - Ficam fora do cardápio e das compras.

## 3. Testes
- **Novo `testes/beta52.py`: 19 ok.**
  - **Cardápio:** mais pratos; nenhum "fora da rotina" no cardápio.
  - **"Fora da rotina":** a categoria existe, o registro mostra a % da meta em tom neutro, e o item não vai para as compras.
  - **Saldo da casa:** tirar um alimento gera saldo negativo na refeição e no dia; acrescentar entra no saldo; "Manter as calorias" zera o saldo.
  - **Telas:** aviso do dia e linha na refeição; opção na tela da casa.
  - **Semana publicada:** sem dados pessoais.
  - **Lista e PDF:** a lista mostra tudo junto. O texto extraído do PDF confere o resumo recomendado × planejado com o motivo, o cardápio de cada pessoa e as compras com a parte de cada um.
- **`casa-dois-celulares.py`: 30 ok.** Atualizado para a regra nova: no segundo celular aparece o saldo negativo, e o recomendado continua o da pessoa.
- **Regressão:**
  - beta51 (18), beta50 (40), beta49 (39), beta48 (56), beta46 (29), beta44 (51), beta43 (78), beta42 (12), beta41 (72), beta40 (128), beta39 (94), beta38 (87);
  - registro-series (23), serie-descanso (24), cronometro (21), compartilhar (10), acessibilidade (7);
  - Node: regras (61), sincronizacao (18), semana-menos-tempo (34), beta35 (23).
  - **beta38:** numa primeira rodada, 5 itens de prévia de temas falharam; na repetição tudo passou. É a mesma instabilidade de tempo vista na Beta 51 e não tem relação com a alimentação.

## 4. Pendências e decisões
- **Valores do "fora da rotina":** são médias de porções comuns, não de uma marca. Para um produto específico, continua valendo o "Outro alimento (digitar calorias)" com o rótulo.
- **Outra pessoa sem a versão nova:** quem ainda não atualizou o app aparece no PDF com o aviso de que ainda não publicou o cardápio. Abrir o app atualizado resolve.

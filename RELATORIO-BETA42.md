# Relatório técnico — MetaTreino 2027.1 Beta 42

Versão `2027.1-beta.42` (`python3 fonte/montar.py --versao 42`). Regras do Firestore sem mudança.

## O que mudou
- `fonte/app-plus/41-substituicao-favoritos.js`:
  - `mtSemEquipamento(ex)`: verdadeiro quando a classe de equipamento (`mtEquipClasse`) é peso do corpo ou objetos de casa.
  - `mtTrocaAbrir`: com equipamento, botões "Equipamento ocupado" / "Prefiro outro" (antes "Aparelho ocupado"); sem equipamento, só "Alternativa para este grupo muscular" (motivo `grupo`) e a frase de explicação. O motivo de uma abertura anterior é corrigido conforme o exercício.
  - Aviso de "nenhuma alternativa compatível" com texto próprio para cada caso.
  - `MT_MOTIVO_NOME` / `mtMotivoNome`: rótulo do motivo no cartão do treino e no detalhe do histórico (trocas antigas da Beta 41 continuam aparecendo certo).
  - `mtCandidatosTroca` não mudou. O motivo `grupo` dá exatamente as mesmas opções e faixas que `ocupado` para esses exercícios (a regra do "mesmo tipo de aparelho" só existe para cabo/máquina/Smith).
- `index.html`: `.tx-motivo-d` e número da versão.
- `testes/beta42.py` (novo, 12 verificações); `testes/beta41.py`: texto do aviso ("mesmo tipo de equipamento").

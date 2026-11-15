# MetaTreino 2027.1 Beta 46 — Relatório

## Conquistas (vídeo 113767)
**Problema:** na Beta 44 as "novas" só saíam ao abrir o detalhe de cada uma. Medalhas do mês, selos e itens do desafio não têm detalhe, então ficavam presos até tocar em "Marcar todas como vistas". A janela do fim do registro era uma lista longa ("12 novas conquistas").

**Novo modelo:**
- **"Nova" é o que ainda não foi visto.** Isso acontece de dois jeitos:
  - **Carrossel do fim do registro:** uma conquista por vez, deslizando ou pelas setas, com "1 de N" e pontos. Cada cartão que aparece conta como visto.
  - **Abrir a aba Conquistas:** todas as não vistas aparecem em "Novas conquistas" e contam como vistas.
- **Na aba Conquistas,** a lista de novas fica igual durante a visita (detalhe e voltar não apaga) e some ao fechar. Nada depende de tocar em cada uma, então nada fica preso.
- **Um único aviso:** ponto na aba Desafios. Saiu o selo do cartão do Início e o de "Sua coleção". Dentro de Desafios, o cartão Conquistas mostra só o texto "N novas", para indicar onde tocar.
- **Fora do fim de um registro** (abrir o app, sincronizar de outro aparelho) nada abre por cima.

## Trocar exercício
"Alternativas secundárias" eram a mesma lista nas duas abas. Agora:
- Ficam recolhidas em "Outras opções do grupo (N) — não equivalentes". Abrem sozinhas quando não há opção equivalente.
- Seguem o motivo: em "Equipamento ocupado", outro equipamento primeiro; em "Prefiro outro", o mesmo equipamento primeiro.

## Arquivos alterados
- `fonte/app-plus/41-substituicao-favoritos.js`
- `fonte/app-plus/42-conquistas-desafio-mensal.js`
- `fonte/app-plus/48-fim-registro-descanso.js`
- `testes/beta44.py`, `testes/beta41.py`
- `app-plus.js`, `app.js`, `index.html`, `service-worker.js` (versão)

# Relatório — MetaTreino 2027.1 Beta 48

## O que foi pedido e o que mudou

| Pedido (prints) | Causa | Correção |
|---|---|---|
| Básico mostrava `${PL_EST}Premium` | texto entre aspas simples (o `${}` não era trocado) na parte 36 | concatenação normal; teste procura qualquer `${` visível em abas e janelas |
| Início com Conquistas em 0 depois do registro | o cartão só era redesenhado ao trocar de aba | redesenha logo após `unlockTrophy` e ao voltar ao Início |
| Conquistas no fim do registro "às vezes sim, às vezes não" | só 3 caminhos de registro abriam a janela; outros (corrida marcada como feita, corrida sem km, atividade avulsa, assistente) não. As conquistas adiadas até a tela de resumo fechar podiam cair fora do prazo | os 4 caminhos que faltavam e o fechamento da tela de resumo agora contam como fim do registro |
| Sol às 18:17 com "Boa noite" | ilustração usava "tarde" até 19h; saudação muda às 18h | mesma regra: 17h–18h pôr do sol, 18h em diante noite |
| Tempo em "Registrar atividade" abria o teclado de texto | o campo `act-min` não estava no seletor numérico do app | incluído (seletor de duração, até 10 h) |
| Cupons para divulgação | — | novo, detalhado abaixo |

Encontrado nos testes de regressão e corrigido:
- **Meta Assistente:** uma resposta ainda "digitando" redesenhava o assistente por cima de outra janela, como a confirmação "Limpar a conversa?". Agora só atualiza se o assistente estiver aberto.
- **Dois aparelhos abertos ao mesmo tempo:** o carrossel de conquistas gravava na nuvem no instante em que abria. Se o outro aparelho mudasse algo nesse mesmo segundo (no teste, o apelido), essa mudança era perdida. Agora o carrossel marca como visto no aparelho e grava ao fechar.

## Cupons de Premium

- **Custo:** usa só Firestore, então fica no plano gratuito, sem Cloud Functions.
- **Coleção `cupons/{CÓDIGO}`:** 8 caracteres, sem letras ou números que confundem (sem O/0, I/1). Campos: `campanha`, `dias`, `validoAte`, `usadoPor` (uid), `usadoEm`, `criadoEm`. O cupom não guarda e-mail de ninguém.
- **Como o resgate funciona:** numa única gravação (batch), o aluno marca o cupom como usado por ele e grava no próprio `usuariosAutorizados` os campos `plano:'premium'`, `premiumAte`, `cupom` e `cupomEm`.
- **O que as regras exigem:**
  - o cupom estava livre e dentro do prazo, e passa a estar usado por esta pessoa;
  - o documento da pessoa aponta para este cupom;
  - `premiumAte` não passa do início + os dias do cupom (+5 min de folga para o relógio do celular). O início é o maior prazo que a pessoa já tinha, ou agora;
  - e-mail verificado; conta não suspensa nem excluída;
  - não muda nenhum outro campo (`bloqueado`, `name`, etc.).
- **Quem não consegue o quê:** sem um cupom livre ninguém se dá Premium, e o mesmo cupom não vale duas vezes. Só administradores criam, listam e apagam cupons. Cupom já usado só o dono apaga.
- **Prazo:** os dias somam ao teste de 30 dias ou ao Premium com prazo. Quem tem Premium sem prazo não vê o botão.
- **Contas sem e-mail próprio** (`@aluno.metatreino.app`) recebem a mensagem para falar com o treinador, porque não têm e-mail verificado.

## Testes

- **`testes/beta48.py`: 23 ok.**
  - Nenhum `${` visível nas telas.
  - Cartão Conquistas atualiza na hora.
  - Horário da ilustração.
  - Seletor numérico do Tempo.
  - Celebração na atividade avulsa.
  - Cupons: criação; código inexistente; cupom vencido; resgate somando ao teste; uso duplo bloqueado; conta Básica sem documento.
- **Regressão:**
  - `beta38`–`beta46`, `beta42-conta`, `dois-aparelhos` (20/20), `acessibilidade`, `acabamento`, `navegador` (0 contraste baixo), `serie-descanso`, `cronometro`, `compartilhar`, `videos-creditos` e os testes em Node (`regras.js`: 61) passam.
  - `registro-series` tem 1 falha conhecida, que só acontece aos domingos ("Aplicar remonta a semana").
  - `atualizacao.py` também falha entre a Beta 46 e a Beta 47 neste ambiente, então não é efeito desta versão.
- **Limite honesto:** as regras novas foram revisadas linha a linha, mas não rodaram no emulador do Firebase (o download dele é bloqueado aqui). Se o Console apontar erro ao publicar, a versão anterior das regras continua valendo e só os cupons ficam sem funcionar.

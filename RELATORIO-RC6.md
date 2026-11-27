# Relatório técnico — MetaTreino 2027 RC 6

Ajustes pedidos depois do teste do RC 5 no celular. Versão trocada uma vez (2027-rc.6 nos 5 lugares). Regras do Firestore sem mudança. Nenhuma migração: os campos novos (`em` em cada noite, `sono.apagadas`) passam a ser gravados a partir de agora.

| Pedido | Causa | Correção | Onde |
|---|---|---|---|
| Meta do mês sem imagem | O emoji da meta virava um ícone sem tamanho dentro da tela nova do RC 5 | Medalha desenhada com `medalSvg` (glifo pelo emoji, ex.: ⏱️ → cronômetro), cor do nível (bronze/prata/ouro) e nome "Meta do mês", o mesmo dos cartões da parte 51 | parte 42 (`cqVerItem`); CSS na 83 |
| "Feito por hoje" com outro treino pendente | `hojeFeito` = qualquer atividade hoje | Antes desse caso, `_pendenteHoje()` (usa `mtHojeModalidade`) procura a outra modalidade com treino hoje não feito e não pulado: "Ainda falta …", com atalho | parte 05 |
| Dica corrida + musculação muito embaixo | `#card-combo{order:21}`, depois do treino de hoje | `order:13`: logo abaixo do seletor. Conteúdo e regra para sumir sem mudança | index.html (CSS) |
| Três estrelas no aniversário; frase fixa | 🎂 e 🎉 viravam o ícone de estrela | Bolo em SVG no traço dos ícones, título e frase sem emoji, 5 frases com treinos e 5 sem (`ano % 5`) | parte 84 (nova, `84-rc6-aniversario.js`) |
| Sono: espaço vazio e histórico "sumido" | (1) Sem a noite de hoje, o atalho só abria o formulário. (2) O histórico exigia o acompanhamento ligado. (3) `mesclaEstado` não juntava o sono: a cópia que ficava como base mantinha só as noites dela | (1) Com noites registradas, o atalho abre o histórico e mostra a média. (2) Histórico abre com noites guardadas; o link liga ou desliga só a pergunta da manhã. (3) `mtSonoMescla` como gancho de `mesclaEstado`: junta por dia, vale o `em` mais recente e respeita `sono.apagadas`; nada volta de antes de "começar do zero". (4) 7 noites em barras quando o cartão ocupa a linha inteira (`.met-full`) | partes 76 e 81 |

## Testes (navegador simulado, não aparelho real)
- **Novo `testes/rc6.py`: 19 ok / 0.** Cobre:
  - medalha visível com o nível;
  - dois treinos no mesmo dia;
  - posição da dica;
  - aniversário e frases;
  - sono em 360 e 412 px;
  - junção do sono.
- **`rc5.py`: 23/0.** Uma verificação foi atualizada para aceitar "Meta do mês".
- **`rc4.py`: 93/0.**
- **`rc3.py`: 98/1.** As verificações de registro do sono passam a ignorar o campo novo `em`. A falha que sobra ("tema da conta A") é igual no RC 4 entregue.
- **`beta39.py`: 94/0.**
- **`compartilhar.py`: 10/0.**
- **`sincronizacao.js`: 18/0.**
- **`regras.js`: 61/0.**

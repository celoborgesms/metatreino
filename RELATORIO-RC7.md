# Relatório técnico — MetaTreino 2027 RC 7

Versão trocada uma vez (2027-rc.7 nos 5 lugares). Regras do Firestore sem mudança: `desafiosTematicos` já tinha `allow delete: if isAdmin()`.

| Pedido | Causa | Correção | Onde |
|---|---|---|---|
| "Desafio temático" não aparece no Início | Nenhum código cria `#home-event`; o desafio temático é mostrado na linha do `#card-monthly` (parte 83) | Opção retirada de `INICIO_BLOCOS` e `INICIO_ESSENCIAL`. A chave continua em `INICIO_MOVEIS` (parte 28), para não mudar a ordem já salva | parte 16 |
| Desenho invadindo o card do Desempenho | A faixa terminava em `#perf-resumo`, e as Metas ficam acima dele (e os blocos são reordenáveis, parte 54) | `DECO_FAIXA['scr-perf'].fim` virou função: o primeiro bloco visível abaixo do título. `decoPosiciona` aceita `fim` como seletor ou função | parte 22 |
| Sem opção de apagar desafio; tela confusa | Não havia exclusão; a arte aparecia como chave interna | `apagarEventoAdmin` (com `appConfirm`): apaga o documento. Numa personalização, o automático volta. Medalhas já ganhas ficam no estado de cada aluno. A subcoleção de participantes fica no banco (o Firestore não apaga subcoleções) e não é lida depois. Também: `EV_ARTE_NOME`, prévia da medalha, explicações curtas | parte 06 |
| "Ocultar" e seta redundantes | — | `MT_SEM_RECOLHER`: `_colBotao` não desenha botão e os dois blocos ficam abertos. A preferência antiga (`mt_col_*`) é ignorada | parte 10 |

**Ano na medalha do desafio:** vem da data de início de cada edição (`eventoMedalha`: `new Date(e.ini).getFullYear()`). A Reta Final de 2026 mostra 2026, a de 2027 vai mostrar 2027. Medalhas já ganhas guardam o ano em que foram conquistadas.

## Testes (navegador simulado, não aparelho real)
- **Novo `testes/rc7.py`: 10/0.**
- **Suítes anteriores:**
  - `rc6.py`: 19/0;
  - `rc5.py`: 23/0;
  - `rc4.py`: 93/0;
  - `beta39.py`: 94/0;
  - `beta51.py`: 18/0;
  - `compartilhar.py`: 10/0.
- **Falhas que também aparecem no RC 4 entregue, rodado no mesmo ambiente:**
  - `rc3.py` (98/1): "tema da conta A";
  - `acabamento.py` (31/1): rolagem do Perfil.

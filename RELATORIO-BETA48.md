# Relatório — MetaTreino 2027.1 Beta 48

## O que foi pedido e o que mudou

| Pedido (prints) | Causa | Correção |
|---|---|---|
| Básico mostrava `${PL_EST}Premium` | texto entre aspas simples (o `${}` não era trocado) na parte 36 | só a estrela, no padrão das outras linhas (Perfil, PDFs e temas); teste procura qualquer `${` visível |
| Início com Conquistas em 0 depois do registro | o cartão só era redesenhado ao trocar de aba | redesenha logo após `unlockTrophy` e ao voltar ao Início |
| Conquistas no fim do registro "às vezes sim, às vezes não" | só 3 caminhos de registro abriam a janela; outros (corrida marcada como feita, corrida sem km, atividade avulsa, assistente) não. As conquistas adiadas até a tela de resumo fechar podiam cair fora do prazo | os 4 caminhos que faltavam e o fechamento da tela de resumo agora contam como fim do registro |
| Sol às 18:17 com "Boa noite" | ilustração usava "tarde" até 19h; saudação muda às 18h | mesma regra: 17h–18h pôr do sol, 18h em diante noite |
| Tempo em "Registrar atividade" abria o teclado de texto | o campo `act-min` não estava no seletor numérico do app | incluído (seletor de duração, até 10 h) |
| Cupons para divulgação | — | novo, detalhado abaixo |

Tom de pele dos emojis: a escolha existia na Aparência antiga (link "Tom dos emojis") e sumiu quando a Beta 40 refez a Aparência e criou a tela "Estilo dos ícones". Voltou dentro dessa tela, como seção "Tom de pele" que só aparece com Emojis coloridos. As amostras ficam fora da troca automática de tom, para cada uma mostrar o próprio tom. A escolha continua no aparelho (`metatreino_emojitone`), como antes.

Registro de ações do painel: o administrador principal pode apagar as ações com mais de 30 dias ou o registro inteiro. As regras passaram a permitir `delete` em `adminLog` só para o principal; ninguém altera um registro. Depois de limpar, o app grava "Registro de ações limpo" (quem, quando, quantas), para a limpeza também ficar registrada.

Login com Google: o login antigo (signInWithPopup) passa pela página `<projeto>.firebaseapp.com/__/auth/handler`, porque o site não está no Firebase Hosting. Agora existe o caminho direto do Google Identity Services (token do Google → `signInWithCredential`): mesma conta, mesmo uid e o mesmo tratamento de "e-mail que já tem senha". Ele só liga com `MT_GOOGLE_CLIENT_ID` preenchido. Em qualquer erro do Google, o app volta ao login antigo. Os quatro caminhos (entrou, fechou, falhou, sem o script do Google) foram simulados.

Painel admin: conferido de novo. Aluno comum e admin com `ativo:false` não veem o botão e não abrem o painel, nem chamando `goAdmin()`. Admin secundário ativo vê e abre. Os dados continuam protegidos pelas regras do Firestore.

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
  - não muda nenhum outro campo (`bloqueado`, `name`, etc.);
  - **um cupom por pessoa a cada 30 dias**: se o documento já tem `cupomEm`, o próximo resgate só passa depois de `cupomEm + 30 dias`. O app avisa a data e deixa o botão desativado.
- **Exceções pelo admin** (em "Quem usou cupom"):
  - **"Liberar 1 cupom agora"** apaga `cupomEm` da pessoa. O próximo resgate passa e grava um `cupomEm` novo, então o limite volta sozinho.
  - **"Sem limite"** grava `cupomSemLimite: true`.
  - O aluno não consegue gravar esses dois campos (as regras só deixam ele mudar `plano`, `premiumAte`, `cupom` e `cupomEm`).
  - O e-mail do administrador não fica no documento do aluno.
- **Apagar histórico:** qualquer administrador apaga cupons, usados ou não. O Premium já ganho fica no `usuariosAutorizados` da pessoa e não depende do cupom.
- **Quem não consegue o quê:** sem um cupom livre ninguém se dá Premium, e o mesmo cupom não vale duas vezes. Só administradores criam, listam e apagam cupons. Qualquer administrador apaga cupons (usados ou livres).
- **Prazo:** os dias somam ao teste de 30 dias ou ao Premium com prazo. Quem tem Premium sem prazo não vê o botão.
- **Contas sem e-mail próprio** (`@aluno.metatreino.app`) recebem a mensagem para falar com o treinador, porque não têm e-mail verificado.

## Testes

- **`testes/beta48.py`: 51 ok** (inclui o limite de 30 dias, o selo só com a estrela, liberar cupom extra, sem limite apagar histórico, o tom de pele e a limpeza do registro de ações).
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

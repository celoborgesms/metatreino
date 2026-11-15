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


---

# Beta 42 — parte 2: cadastro, autenticação, exclusão, backup, temas e ilustrações

Regras do Firestore **mudaram** (publicar `firestore.rules`). A função do servidor (`functions/`) também foi atualizada; só vale se publicada (plano Blaze).

## Causas encontradas
- **"Já confirmei meu e-mail" não funcionava:** o botão só recarregava a página. O objeto do usuário e o token do Firebase continuavam os antigos (`email_verified: false`) até um novo login, e as regras recusavam a leitura do plano (`permission-denied`). Agora `user.reload()` + `getIdToken(true)` e a checagem roda de novo sem recarregar.
- **Google pedia o cadastro de novo:** a junção de logins (Beta 34, `contas/{email}`) só acontece com e-mail verificado; com o token antigo da primeira sessão, o vínculo não era gravado. Corrigido pela causa acima, e os métodos agora também são vinculados no Authentication (mesmo UID) com prova de posse.
- **Exclusão:** a função do servidor não está publicada (sem Blaze), então o painel caía no caminho "só dados", sem trava contra cliques repetidos e sem marca permanente. O app do aluno, ainda logado no Authentication, podia regravar o próprio documento — por isso contas excluídas "voltavam". Agora há a marca `contasExcluidas/{email}` e as regras impedem o app dessa conta de gravar dados ou criar um novo teste. A perda dos dados de treino do administrador não foi reproduzida; foram adicionadas travas.

## Arquivos
- novos: `fonte/app-plus/44-conta-acesso-backup.js`, `fonte/app-plus/45-temas-carrossel-ilustracoes.js`, `testes/beta42-conta.py` (69 verificações)
- alterados: `fonte/app-plus/37-admin-planos-contas.js`, `36`, `43`, `08`, `app.js` (rótulo "Plano Básico"), `index.html`, `firestore.rules`, `functions/index.js`, `testes/mock-firebase.js`, `testes/beta38.py`, `beta40.py`, `beta41.py`, `acabamento.py`

## Limitações
- Excluir o login no Authentication exige a função do servidor (plano Blaze). Sem ela, a conta fica bloqueada e sem dados, mas o login continua até ser apagado no Console.
- Backup: impede o uso normal de arquivos de outra conta. Quem usa ferramentas de desenvolvedor sempre consegue gravar o que quiser nos próprios dados; os recursos Premium continuam decididos pelo plano (`usuariosAutorizados`), que o aluno não grava.
- Backups antigos (antes da Beta 42) não têm resumo: são aceitos quando o e-mail do arquivo é o da conta.
- Vincular Google/senha depende do projeto Firebase estar em "uma conta por e-mail" (padrão). Testado com Firebase simulado.

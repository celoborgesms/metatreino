# Relatório técnico — MetaTreino 2027.1 Beta 35

Versão de correções: fecha os itens da auditoria (Beta 33/34) que tinham ficado pendentes. Nenhuma função, dado, tema ou regra de negócio foi removido. `app-plus.js` foi gerado por `python3 fonte/montar.py --versao 35` (as 5 marcações de versão conferidas como iguais).

**Antes de publicar:** publique o `firestore.rules` desta versão. Sem isso, os itens 4 e 6 não funcionam por completo, porque a nuvem recusa as exclusões novas.

## Correções

| # | Problema | O que mudou | Onde |
|---|---|---|---|
| 1 | Plano trocado no celular voltava ao antigo quando o PC gravava (a junção só olhava o histórico) | `saveData()` marca `modules.lift/run.planAt` quando `setup` ou `plan` mudam (assinatura JSON comparada com a última base). `mesclaEstado` copia `setup`, `plan`, `planAt`, `week` e `startAt` da outra cópia se o `planAt` dela for maior (cópia profunda, conta em `daOutra`). `planoMarcaBase()` é chamado depois de carregar, de adotar a nuvem e de juntar. Sem `planAt` (dados antigos), o plano local é mantido, como antes. | app.js |
| 2 | Corrida com dor de joelho/tornozelo/lombar: só o nome virava caminhada; os blocos, o ritmo-alvo e o motor continuavam descrevendo corrida | `regenRunPlan` guarda `originalBlocks`, `originalMotor` e `originalPace`, troca os blocos por caminhada (5 + max(10, dur−10) + 5 min), zera o ritmo e marca o motor como `caminhada`. Nos outros casos (sem dor, dor de membro superior, TPM, modo leve), `restauraConteudo()` devolve o original. | app.js |
| 3 | Musculação 3×/semana treinava cada grupo grande 1× por semana | Com 3 dias e ≥ 2 dias entre cada treino (contando a virada da semana): A Superior [Peito, Costas, Ombro, Tríceps] · B Inferior + Core [Pernas, Glúteos, Panturrilha, Core] · C Corpo inteiro [Pernas, Peito, Costas, Bíceps]. Dias seguidos ou `setup.split3 = 'classico'` → divisão antiga. `liftQuantos` reduz exercícios por grupo em dias com 3+ grupos grandes. `buildLiftExercises` corta acessórios → secundários → principais (com mínimos) até caber no teto de séries **e** em 90 min. Planos existentes não são regerados. | app.js |
| 4 | Desafio temático: aluno com dois logins aparecia duas vezes | Inscrição usa `uidDados()` (documento único) no id e no campo `uid`. O painel (`openAdminEventoPart`) junta por e-mail e fica com o registro concluído ou mais avançado. Regras: participante pode ser lido/gravado/apagado também pela conta vinculada (`contaVinculada`). | partes 04, 06; firestore.rules |
| 5 | Apagar sem confirmação | `maClearThread` (só se houver conversa), `deleteSuggestion` e `toggleStudent` (só ao bloquear) usam `appConfirm`. Reativar um aluno continua com um toque. | app.js |
| 6 | Excluir conta deixava dados do outro login | `doDeleteAccount` lê `contas/{email}`, apaga arquivo anual e `usuarios/{uid}` de cada UID ligado e depois o próprio `contas/{email}`. A exclusão pelo administrador (`admApagarConfirma`) faz o mesmo com `u._uids`, incluindo participações em desafios. Regras: `usuarios` e as subcoleções aceitam exclusão por quem tem o mesmo e-mail verificado (`mesmoEmail`). A separação admin principal × secundário foi mantida (exclusão de outra pessoa continua só com `isOwner()`). | app.js, parte 17, firestore.rules |
| 7 | Acessibilidade: botões só com ícone sem nome; cartões clicáveis fora do teclado | Nova parte `32-acessibilidade.js`: `aria-label` a partir do `title`, do ícone (tabela `A11Y_ICONES`), da foto de perfil e do link de e-mail; `role="button"` + `tabindex=0` em elementos com `onclick` (exceto fundos de janela); Enter/Espaço aciona; varre de novo a cada mudança da tela (MutationObserver, 250 ms). Botão ➤ do assistente com `aria-label` fixo. CSS: contorno de foco visível. | parte 32, app.js, index.html |
| 8 | Aviso (toast) escondido atrás da janela aberta | Com `#modal-back.on`, `#toast-wrap` vai para o topo (respeita a área segura do iPhone). | index.html |
| 9 | Linguagem informal misturada ("pra", "pro", "bora") | 409 trocas em textos exibidos e comentários: pra→para, pro→para o, pros→para os, pras→para as, Bora→Vamos. Linhas com expressões regulares (que interpretam o que o aluno digita) **não** foram tocadas: o assistente continua entendendo "pra" e "bora". Conferido: as 51 frases de teste e sugestões do assistente dão a mesma resposta antes e depois. | app.js, index.html, partes 03, 05, 14, 15, 28 |

## Testes executados (todos nesta versão final)

| Teste | Resultado |
|---|---|
| `node testes/regras.js` | 61 aprovados, 0 reprovados |
| `node testes/sincronizacao.js` | 15 aprovados, 0 reprovados |
| `node testes/beta35.js` (novo) | 23 aprovados, 0 reprovados: plano mais novo vence / antigo não sobrescreve / sem data mantém local / cópia independente; `saveData` só marca data quando o plano muda; corrida com dor vira caminhada e volta ao original; divisão 3 dias (alternados, seguidos, opção clássica, virada sáb→seg, ≤ 90 min); limpar conversa pede confirmação |
| `node testes/auditoria-musculacao.js` | 768 planos + combinações de dias: nenhum problema |
| `node testes/semana-menos-tempo.js` | 34 aprovados, 0 reprovados |
| `node testes/simulacao-corrida.js` | 60 cenários × 20 semanas: nenhum problema |
| `node testes/migracao-fichas.js` (dados da Beta 32) | 99 → 0 problemas; 565/565 principais mantidos; histórico preservado |
| Comparação do assistente (antes × depois do item 9) | 51 frases, 0 diferenças |
| `python3 testes/navegador.py` | 8 temas × abas × janelas, celular e computador: 0 erros, 0 páginas largas, 0 IDs repetidos, 0 textos com pouco contraste |
| `python3 testes/acessibilidade.py` (novo) | 7 aprovados: todo botão/clicável visível com nome, Tab, Enter, aviso no topo com janela aberta, confirmação, sem erros |
| `python3 testes/cronometro.py` | 21 aprovados |
| `python3 testes/registro-series.py` | 23 aprovados |
| `python3 testes/dois-aparelhos.py` | 20 aprovados, incluindo o cenário novo **4b** (plano trocado no celular chega ao PC e não é desfeito por gravação do PC). As regras simuladas foram atualizadas para as da Beta 35, e nenhuma operação do app foi negada. |
| `python3 testes/videos-creditos.py` | 29 aprovados |
| `python3 testes/atualizacao.py` Beta 34 → Beta 35 | atualizou sozinho, abriu offline depois de atualizar e na 1ª visita offline. O teste foi corrigido: antes esperava "beta.33" fixo e agora lê a versão da pasta nova. |

## O que NÃO foi verificado (precisa de aparelho/conta real)

- **Firestore real:** as regras novas foram testadas só no simulador (`testes/nuvem-simulada.py`), que espelha as regras mas não é o motor do Firebase. Depois de publicar, teste "Excluir conta" com uma conta que tenha os dois logins.
- **Leitor de tela real** (TalkBack/VoiceOver): conferi os nomes no DOM, não a leitura em voz.
- **Contraste sobre fundos com degradê ou foto:** o teste automático pula esses elementos, porque não consegue medir.
- **Varredura de todos os clicáveis do app:** o teste cobre as 8 abas e 3 janelas, não todas as telas do painel do administrador.
- **Linguagem:** a troca de "pra/pro/bora" foi feita. Uma revisão completa de tom e ortografia de todos os textos não foi feita.
- YouTube e aparelhos reais (som com tela bloqueada, iPhone), como nas versões anteriores: ver `ROTEIRO-DE-TESTES.md`, seção 4c.

## Arquivos alterados em relação à Beta 34

- `app.js`, `app-plus.js` (gerado), `index.html`, `service-worker.js`, `firestore.rules`
- `fonte/app-plus/`: 00 (versão), 03, 04, 05, 06, 14, 15, 17, 28, **32-acessibilidade.js (novo)**
- `testes/`: **beta35.js (novo)**, **acessibilidade.py (novo)**, dois-aparelhos.py (cenário 4b), nuvem-simulada.py (regras Beta 35), atualizacao.py (versão esperada automática)
- Documentos: `NOTAS-DA-VERSAO.md`, `ROTEIRO-DE-TESTES.md`, `MAPA-DO-CODIGO.md`, `RELATORIO-BETA35.md` (novo)

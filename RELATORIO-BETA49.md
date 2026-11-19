# Relatório — MetaTreino 2027.1 Beta 49

**Publique o `firestore.rules` desta versão.** Só a coleção `familias` mudou. As outras permissões continuam como na Beta 48.

## 1. Problemas encontrados (causa real)

| Problema | Causa | Correção |
|---|---|---|
| "Não consegui gerar um código livre" no 2º celular | `famCriar` lia `familias/{código}` antes de criar. A regra de leitura usa `resource.data.membros`; com o documento inexistente, o Firestore **nega**. O app entendia "ocupado", tentava 5 vezes e desistia. Só funcionava na conta do administrador principal (`isOwner()` libera a leitura) | Cria direto, sem ler (`set`). Se o código já existir, a gravação vira alteração e as regras negam; o app sorteia outro. Tempo limite de 12 s e mensagem de "sem conexão" |
| Integrante podia alterar o documento inteiro do grupo | A regra de membro só conferia a lista de membros | Permissão por campo: membro só mexe no **próprio** apelido e perfil; só o administrador mexe em cardápio e configuração; quem entra só acrescenta a si |
| Mesmo prato, mas a mesma quantidade para todos em parte do registro | "Comi", alimento acrescentado e alimento tirado eram copiados entre celulares (com a quantidade de quem acrescentou) | Só a **composição** do prato é compartilhada, guardada como quantidade-base. Cada celular calcula a porção pelo próprio plano |
| Lista de compras da casa incompleta (ex.: bananas) | Dos outros entravam só as refeições da casa (almoço e jantar). Café e lanches da outra pessoa ficavam de fora | Cada pessoa publica o total que vai comer de cada alimento nos próximos 8 dias (sem peso, idade nem calorias). A lista "Casa toda" soma todos |
| Cardápio repetitivo | Prato do dia = `(dia×3 + …) % opções`. Com 6, 9 ou 12 opções, a semana usava só 2 a 4 pratos | Passo sem divisor comum com o número de opções (gira por todas) + 40 pratos novos |
| "Óleo" sem explicação | O item mostrava só nome e gramas | Finalidade em cada ingrediente (`NUTRI_USO`), azeite/óleo em ml, calorias por item |
| Corredor experiente: 10 conquistas no 1º registro | Cada etapa (5K, 10K, meia; bronze, prata e ouro) virava um cartão. A experiência declarada no cadastro era ignorada | Experiência reconhecida, cartões agrupados por família, primeira atividade em destaque, máximo 5 cartões |
| "Medalha do mês" sem participar do desafio | Os níveis bronze/prata/ouro (automáticos) se chamavam "Medalha do mês", com o mesmo nome da medalha exclusiva do desafio. O código da medalha exclusiva **já exigia** participação | Níveis viram **Metas do mês**. Participação automática no desafio, com opção de sair. A medalha continua exigindo participação, meta e período |
| Metas de corrida fáceis para quem corre muito | `_escalaDesafio` usava o nível da musculação quando a pessoa tinha os dois planos, e não diferenciava o nível competitivo | Escala por modalidade: corrida pelo nível do motor (0,6 a 1,6) |
| Treino de corrida maior que o tempo escolhido | O motor reduzia só a intensidade. Aquecimento (15 min), desaquecimento (12 min) e os mínimos das corridas leves continuavam iguais | Passada final: aquecimento/desaquecimento curtos → parte principal menor → sessão mais curta e segura, com o motivo no treino. **Beta 48: 14.635 de 45.504 sessões simuladas passavam do tempo. Beta 49: 0** |
| Limitação física igual para tudo | Qualquer limitação tirava a mesma lista. Joelho ainda recebia tiros longos | Regra por região (`RUN_LIM_EVITA`). Duas regiões: só leves. Orientação específica e "pare se a dor mudar a passada" |
| Assistente confundia caminhada com treino do plano | `contextoAluno` e a análise do mês contavam dias ativos como adesão | `mtAdesao`: dias ativos, treinos do plano concluídos e atividades extras, separados |
| Troca de exercício repetindo opção | O original de **outra** troca e variações com o mesmo nome podiam ser sugeridos. O original deste exercício aparecia duas vezes (lista + "Voltar ao original") | Exclusão por id, por nome-base e pelos originais das trocas. Cada opção aparece uma vez. **Beta 48: 5.986 casos com repetição em 8.904 listas. Beta 49: 0** |
| Falha conhecida "aos domingos" (`registro-series.py`) | No domingo só sobra o próprio domingo. Se ele já tinha treino, a semana ficava igual e o botão "Aplicar" aparecia sem efeito. O teste comparava só os dias | O app avisa "a semana fica igual" e não mostra "Aplicar". Teste confirmado com o relógio num domingo |
| PDF offline para quem nunca gerou PDF | `jspdf.umd.min.js` só ia para o cache depois do primeiro uso | Baixado na instalação do service worker (sem travar a instalação se falhar) |
| Rede muito lenta segurava a abertura | Network-first sem tempo limite | Depois de 4 s abre pela cópia guardada; a resposta da rede atualiza o cache |

## 2. Arquivos alterados
- `fonte/app-plus/49-alimentacao-casa.js` (refeito)
- `fonte/app-plus/51-conquistas-progressao.js` (novo)
- `fonte/app-plus/11-corrida.js`: tempo como limite, limitações por região, domingo
- `fonte/app-plus/05-home-inteligente-meta-assistente.js`: `mtAdesao`, textos de adesão
- `fonte/app-plus/41-substituicao-favoritos.js`: troca sem repetir
- `fonte/app-plus/40-pdf-identidade.js`: uso do ingrediente no PDF, lista individual
- `app.js`: 10 alimentos novos, `NUTRI_USO`, `nutriVarIdx`, 40 pratos, categorias de compra, linha do alimento com uso e kcal, óleo em ml
- `firestore.rules`: `familias` por campo
- `service-worker.js`: tempo limite da rede e PDF no cache da instalação
- `app-plus.js`, `index.html` (versão)
- Testes:
  - novos: `testes/casa-dois-celulares.py`, `testes/beta49.py`, `testes/corrida-tempo-limite.js`, `testes/troca-sem-repetir.js`
  - ajustados à regra nova: `beta46.py`, `beta44.py`, `beta43.py`, `registro-series.py`
  - simulação de rede: `nuvem-simulada.py` e `mock-firebase-rede.js` ganharam `update` com caminho e as regras de `familias`; `mock-firebase.js` agora nega ler código inexistente, como o Firestore
- Documentação: `NOTAS-DA-VERSAO.md`, `MAPA-DO-CODIGO.md`, `ROTEIRO-DE-TESTES.md`

## 3. Como ficou a alimentação da casa
- **Administrador** (campo `dono`, quem criou):
  - troca o prato;
  - tira ou acrescenta alimentos no prato da casa (por data);
  - escolhe refeições, dias e horários;
  - liga "cada um pode trocar só para si";
  - tira pessoas do grupo;
  - passa a administração.
  - Ao sair, escolhe o novo administrador.
- **Integrante:**
  - vê o prato da casa com a **sua** quantidade e calorias;
  - ajusta a própria quantidade e marca "comi";
  - acrescenta alimento só para si;
  - se o administrador permitir, troca o prato só para si num dia (e volta ao prato da casa quando quiser).
- **Recálculo:** tirar ou acrescentar um alimento recalcula a porção de cada pessoa para manter as calorias dela. Se o que sobrou não chega perto da meta, a refeição avisa quanto falta.
- **Na nuvem:** membros, administrador, apelidos, restrições (sim/não), configuração, composição do prato e o total de compras de cada um. **Sem** peso, idade, altura, e-mail ou calorias.
- **Grupos já existentes:** quem criou vira o administrador. Celulares ainda na Beta 48 não conseguem mais sincronizar o "comi" (agora é pessoal). A atualização chega sozinha.

## 4. Conquistas — a proposta aplicada
- **Experiência anterior:**
  - O que conta: o tempo recente informado numa distância, o nível de corrida (avançado/competitivo), km por semana ou tempo contínuo.
  - Esses marcos (5K, 10K, meia, maratona) entram na coleção como "Experiência anterior · registrada em …", num único cartão "Experiência reconhecida".
  - Ninguém perde conquista e nada ficou mais difícil.
- **Iniciante:** os primeiros 5 km continuam sendo celebrados como conquista nova (testado).
- **Primeira atividade:** "Primeira atividade no MetaTreino" é sempre o primeiro cartão.
- **Cartões agrupados:** etapas da mesma família viram um cartão com a mais alta ("inclui os níveis: bronze e prata").
- **Limite por registro:** no máximo 5 cartões; o resto vai num cartão-resumo.
- **Exemplo:** o corredor experiente da simulação desbloqueou 13 itens no primeiro registro e viu 5 cartões.
- **Metas do mês:** sobem com o nível de cada modalidade. A jornada iniciante → competitivo fica refletida nas metas sem tirar nada de ninguém.

## 5. Testes executados (Beta 49)
- **Novos:**
  - `casa-dois-celulares.py`: **30 ok**. Dois navegadores, contas diferentes, nuvem simulada com as regras de `familias`. Inclui a reprodução do erro original e 4 gravações proibidas, todas negadas.
  - `beta49.py`: **33 ok**.
  - `corrida-tempo-limite.js`: **104.320 verificações ok**. 720 planos (4 perfis × 5 objetivos × 3 opções de dias × 4 tempos × 3 casos de limitação), 16 semanas cada. 1.365 sessões viraram uma versão mais curta.
  - `troca-sem-repetir.js`: **35.616 ok**.
- **Regressão, tudo passando:**
  - em navegador: `beta37` (8), `beta38` (87), `beta38-temas`, `beta39` (94), `beta40` (128), `beta41` (72), `beta42` (12), `beta42-conta` (69), `beta43` (78), `beta44` (51), `beta46` (29), `beta48` (56), `registro-series` (também num domingo simulado), `dois-aparelhos` (20), `acessibilidade` (7), `navegador` (0 contraste baixo, 0 janelas com erro), `serie-descanso` (24), `cronometro` (21), `compartilhar` (10), `videos-creditos` (29);
  - em Node: `regras.js` (61), `sincronizacao.js` (18), `semana-menos-tempo.js` (34), `beta35.js` (23), `auditoria-musculacao.js` e `simulacao-corrida.js` (nenhum problema).
- **Falham também na Beta 48 (não são desta versão):**
  - `acabamento.py`: 3 itens sobre "desenho próprio no painel do administrador". Na Beta 48 são 4.
  - `atualizacao.py`: neste ambiente a página fica na tela de login. Repeti com a Beta 48 só com o número da versão trocado e falhou igual. A abertura offline da versão nova (item 5 do teste) passa.

## 6. Pendências (honestas)
- **Regras do Firestore:**
  - Não rodaram no emulador oficial: o download dele é bloqueado aqui.
  - Foram traduzidas linha a linha para as duas nuvens simuladas, que os testes usam.
  - Se o Console apontar erro ao publicar, a versão anterior continua valendo, mas a casa fica com as permissões antigas.
- **Nutrição, para revisão de nutricionista:**
  - Os 10 alimentos novos têm valores da TACO 4ª ed.
  - Em planos acima de ~3.000 kcal, o motor (sem mudança nesta versão) chega a 6–7 ovos numa refeição, porque a porção escala até 2,4×. Não mexi para não alterar quantidades por conta própria.
- **Da lista da outra IA, avaliado e não feito nesta versão** (pedem decisão ou uma versão própria): carregamento sob demanda do `app-plus.js` (1,27 MB), registrador central de erros (catch vazios), progressão dupla/RIR/volume por músculo, previsões de corrida ponderadas, recordes normalizados por distância, calendário de corrida, uso de "viagem/vento" no assistente.
- **`limpaParaNuvem`:** com os dados atuais nada precisa ser convertido (testado: zero arrays dentro de arrays e zero campos reservados). O tamanho do documento já é monitorado (Seus dados, painel do admin a partir de 60%, arquivo automático a partir de 85%). Mantive como rede de segurança.
- **Nome "Alimentação da casa":** mantido. Se quiser trocar, é só o texto.
- **Testar nos dois celulares reais:** o roteiro está em `NOTAS-DA-VERSAO.md` e `ROTEIRO-DE-TESTES.md`.

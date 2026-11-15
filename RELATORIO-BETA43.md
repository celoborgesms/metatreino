# MetaTreino 2027.1 Beta 43 — Relatório

## 1. Mensagem de acesso e causa do permission-denied

### O que o aluno via (Beta 42 publicada)
A tela de "sem acesso" mostrava texto técnico: Firestore, coleção `usuariosAutorizados`, regras, o código `permission-denied` e "detalhe técnico".

### Causa real
A regra de leitura de `usuariosAutorizados/{email}` exige `request.auth.token.email_verified == true`. A leitura era recusada quando o **token de login estava desatualizado**: a pessoa confirmava o e-mail, mas o app continuava usando o token emitido antes da confirmação (ainda "não verificado"); ou o token tinha vencido durante uma sessão longa. O e-mail usado como ID do documento já estava em minúsculas (igual ao `userEmail()` das regras), então não era divergência de nome do documento.

### Correção (sem abrir permissões)
- `app.js` (`afterGoogleSignIn`): quando a primeira leitura falha por permissão, o app faz `user.reload()` + `getIdToken(true)` e tenta de novo. Junto com a renovação da Beta 42 (`mtAtualizaVerificacao`), o caso do print se resolve sozinho, sem mostrar erro.
- As regras de `usuariosAutorizados` **não foram afrouxadas**: continuam exigindo e-mail verificado.

### Mensagem para o aluno
- Título: "Não foi possível acessar sua conta."
- Texto: "Não conseguimos verificar seu acesso neste momento. Tente novamente em alguns instantes. Se o problema continuar, entre em contato com nosso suporte."
- Botão "Tentar novamente" e cartão "Falar com o suporte" (WhatsApp/e-mail de suporte já configurados).
- Sem internet: "Parece que você está sem conexão…". E-mail ainda não confirmado continua com a tela própria "Confirme seu e-mail".
- Também saíram códigos técnicos de: "Tentar novamente" (parte 44), erro da montagem do plano, backup, "Formas de entrar" e `auth/operation-not-allowed`.

### Diagnóstico para o administrador
- `mtLogAcesso()` grava em `diagnosticoAcesso` apenas: código (máx. 80 caracteres, com e-mails/IDs longos mascarados), etapa, versão, plataforma, provedor, online, e-mail confirmado (objeto) × e-mail confirmado (token) e `conta` = 12 caracteres do SHA-256 do e-mail. **Sem e-mail, UID, nome ou dados de treino.**
- No máximo 1 registro por (código, etapa) a cada 10 minutos por aparelho.
- Painel › "🩺 Diagnóstico de acesso" (só o principal): lista, explica a causa provável (credencial desatualizada, e-mail não confirmado, regras antigas, conexão) e liga o resumo ao aluno **calculando o hash no aparelho do administrador** a partir da lista que ele já vê. Botão para apagar os registros.
- Regra nova: criar só com os campos permitidos e tamanhos limitados, `em == request.time`; ler e apagar só o principal; ninguém altera.

## 2. Lanches para sair da rotina

Entrada discreta no plano alimentar (depois de "Dicas para hoje"), abrindo uma tela própria — o cardápio do dia continua igual.

- **16 receitas** em 6 categorias (Hambúrgueres e sanduíches; Pizzas e massas; Salgados e AirFryer; Refeições rápidas; Doces e sobremesas; Opções econômicas) + Todas e Favoritas: hambúrguer caseiro (patinho / coxão mole / coxão duro / econômica com acém), hambúrguer na massa de pastel na AirFryer (econômica e mais completa), mini pizza de pão sírio (econômica, mais proteína, na tortilha), batata recheada (frango ou carne), sanduíche natural, hambúrguer de frango, wrap de frango, pastel de AirFryer, esfiha, bolinho assado, crepioca, panqueca salgada, pizza de frigideira, brigadeiro porcionado, fruta com chocolate, banana assada.
- Cada receita: ilustração (SVG próprio), tempo, dificuldade, rendimento, ingredientes com quantidades (minha porção / receita toda), modo de preparo, nutrição da porção, substituições, como encaixar no plano, dicas de economia e congelamento, favoritar.
- **Porção ajustada ao plano**: o alvo é a refeição escolhida do plano do dia (jantar/almoço para refeições, lanche para lanches). Em receitas montadas, pão e salada ficam fixos e o recheio (carne, queijo, molho) varia de 60% a 160%. Em receitas por unidade, o app calcula quantas unidades (esfihas, pastéis…). Se a receita não cabe sem encolher demais, a tela diz isso e sugere outra refeição maior, receitas que cabem e trocas.
- **Restrições**: sem lactose tira o queijo/requeijão opcional (e avisa); receitas em que a lactose é base, com glúten (no modo sem glúten) ou com carne (vegetariano) vão para "Não combinam com suas restrições", com o motivo. Vegetariano/econômico abrem a versão adequada.
- **Doces**: texto sem culpa e sem quantidade universal; a porção mostra kcal e % do dia e onde encaixar.
- **Valores nutricionais**: calculados ingrediente por ingrediente com a TACO (UNICAMP) — carnes cruas, cebola, cenoura, alface, farinha, chocolates, leite condensado, achocolatado — e, para industrializados (pão de hambúrguer, massa de pastel, pão sírio, tortilha tipo Rap10, molho pronto, mostarda), a média de rótulos de marcas comuns. A tela diz que são estimativas.
- **Preço**: nenhum valor em reais foi inventado (não há tabela confiável por cidade). O aluno informa quanto gastou e, se quiser, o preço de um delivery parecido; o app calcula custo por porção e diferença.
- Registrar no plano: "Usar no lugar do jantar" troca os itens daquela refeição pela receita (desfaz com "Voltar ao recomendado").
- Faz parte do plano alimentar Premium (no Básico, aviso Premium).

## Arquivos alterados
- `app.js` — renovação da credencial antes da 2ª tentativa; mensagem amigável; registro do diagnóstico; texto de `auth/operation-not-allowed`; versão.
- `index.html` — título, texto, botão e cartão de suporte da tela de acesso; versão.
- `fonte/app-plus/44-conta-acesso-backup.js` — mensagens sem código técnico; diagnóstico no "Tentar novamente".
- `fonte/app-plus/46-diagnostico-acesso.js` (novo), `fonte/app-plus/47-lanches-fora-da-rotina.js` (novo).
- `app-plus.js`, `service-worker.js` — remontados (Beta 43).
- `firestore.rules` — coleção `diagnosticoAcesso`.
- `testes/beta43.py` (novo), `testes/mock-firebase.js` (`__MOCK_NEGA_AUTORIZACAO`).
- `NOTAS-DA-VERSAO.md`, `ROTEIRO-DE-TESTES.md`, `MAPA-DO-CODIGO.md`, este relatório.

## Limitações
- Sem emulador do Firebase aqui: as regras novas foram revisadas, mas só o console do Firebase confirma a publicação.
- Qualquer conta logada pode criar registros de diagnóstico (só com os campos permitidos, e no máximo 1 a cada 10 min por aparelho no app). Um cliente modificado poderia gravar mais; o principal pode apagar.
- Valores nutricionais variam com marca e preparo; produtos industrializados usam média de rótulos.
- Custo em reais depende do que o aluno digita; o app não consulta preços.

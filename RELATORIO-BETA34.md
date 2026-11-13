# Relatório — MetaTreino 2027.1 Beta 34

Base: a Beta 33 final, já entregue e com todos os testes da auditoria aprovados. Este complemento só começou depois dela.

## 1. Sincronização entre celular e computador

### O que foi investigado

| Pergunta | Resposta |
|---|---|
| Celular e computador usam o mesmo identificador? | **Não, quando a forma de login é diferente.** Os dados ficam em `usuarios/{uid}`. Neste projeto, login com Google e login com e-mail e senha da mesma pessoa geram **UIDs diferentes**: isso está registrado nas próprias regras do Firestore, e o administrador principal é reconhecido "pelo UID ou pelo e-mail" justamente por isso. Cada forma de login abria um documento diferente. |
| O login está ligado ao mesmo documento? | Só se o UID for o mesmo. Não havia nenhum vínculo por e-mail. |
| O histórico é salvo só no aparelho? | Não: vai para o Firestore. Mas vai para o documento do UID daquele login. |
| Celular e PC carregam o histórico de jeitos diferentes? | O código é o mesmo. A diferença é o documento lido. |
| Há filtros escondendo registros? | Não há filtro por aparelho ou origem. O Histórico mostra **uma modalidade por vez** (musculação, ou corrida/bike/caminhada) e só os últimos 90 dias; o resto fica em "Histórico completo". Isso pode parecer sumiço, por isso agora está explicado na tela de Sincronização. |
| Todos os documentos e coleções entram? | O arquivo anual (`usuarios/{uid}/arquivo`) também era por UID. Agora segue o documento unificado. |
| O PC carrega antes da sincronização terminar? | **Sim, segundo defeito.** A leitura da nuvem tinha 5 s de prazo. Num computador sem cópia local e com internet lenta, o app seguia como conta nova e mostrava o questionário. Preencher gravava uma conta vazia **por cima** dos dados reais. |
| Os dados atualizam quando a internet volta? | O Firestore reenviava as gravações pendentes, mas a gravação atrasada (o documento inteiro) podia apagar o que o outro aparelho registrou nesse meio-tempo. |
| Mudanças num aparelho aparecem no outro? | Só os treinos do histórico, e só depois da tela inicial (Beta 33). Perfil, plano e conquistas não. Quem ainda estava no questionário ficava sem escuta. |
| Conflitos local × nuvem | **Terceiro defeito.** Trocar de aba gravava com um carimbo de hora novo. Assim, o aparelho que só navegava parecia mais atual que o aparelho que registrou um treino. |

**Reprodução:** o teste `testes/dois-aparelhos.py` usa um celular com login Google e um computador com e-mail/senha (mesmo e-mail, UIDs diferentes) sobre uma nuvem simulada compartilhada.
- Na **Beta 33**, o computador abre o **questionário** com o histórico **[0, 0]**, enquanto o celular tem [35, 19].
- Na **Beta 34**, o computador mostra [35, 19].

### Correções

1. **Uma conta por e-mail** (`resolveContaUnica`, app.js).
   - No login, o app lê `contas/{email}`, que guarda qual documento é o da pessoa.
   - Na primeira vez, procura todos os documentos com aquele e-mail. O mais completo vira o principal e os outros são **juntados** nele: histórico dos últimos 90 dias, séries do dia, peso, conquistas e recordes. O arquivo anual (mais de 90 dias) é copiado logo depois (parte 31).
   - Os documentos antigos **não são apagados**; só deixam de ser usados.
   - Só vale para e-mail **verificado**, ou para o usuário interno @aluno.metatreino.app. Uma conta com o e-mail de outra pessoa sem verificação não se liga a nada.
   - Todo o app passou a usar `uidDados()` no lugar de `fbUser.uid` para ler e gravar dados: salvamento, carregamento, escuta, arquivo anual, começar do zero e excluir conta.
2. **Carregamento seguro.**
   - Sem cópia no aparelho, o app espera até ~23 s (duas tentativas).
   - Se a nuvem não responder, mostra "Não consegui buscar seus dados agora · Tentar de novo" e **nunca** o questionário de conta nova.
3. **Tempo real completo** (`ouveNuvem`).
   - Começa logo após o login, também para quem está no questionário.
   - Se a nuvem tem uma versão mais nova, ela passa a valer no aparelho (perfil, plano, conquistas…), e o que só existe no aparelho é juntado de volta.
   - Se a nuvem é mais antiga, por exemplo uma gravação atrasada de um aparelho que estava offline, os registros que faltam são juntados e reenviados.
   - Exclusões têm marca (Beta 33) e não voltam.
4. **Carimbo de hora honesto.**
   - Trocar de aba grava só no aparelho (`salvarLocal`).
   - Toda mudança real enviada à nuvem leva um carimbo novo.
5. **Internet de volta:** ao reconectar, o app reenvia o que estiver pendente e retoma a escuta.
6. **Tela Perfil → Conta e dados → Sincronização entre aparelhos.** Mostra:
   - a conta e a forma de login;
   - o documento usado (e se está unificado);
   - a internet, a última gravação confirmada e se há algo pendente;
   - os registros no aparelho;
   - o botão "Sincronizar agora", que junta, não sobrescreve.
7. **Painel do administrador:** quando a pessoa tem mais de um documento, vale o mais recente, que é o unificado.

**Regras do Firestore (precisa publicar):**
- `contaVinculada()`: acesso ao documento ligado ao próprio e-mail verificado.
- Leitura e busca dos documentos com o próprio e-mail, para a unificação.
- Leitura do arquivo anual dos documentos antigos da mesma pessoa.
- Coleção `contas`: só a própria pessoa grava, e só pode apontar para o próprio login ou para um documento do mesmo e-mail.
- O campo `email` do documento passa a exigir e-mail confiável.
- Nada foi ampliado para outros alunos. As permissões de administrador secundário e principal são as mesmas.

## 2. Player de vídeo — modo limpo

**Antes:**
- O player da API oficial do YouTube vinha com os controles do próprio YouTube: título, compartilhar, logotipo, "assistir no YouTube" e sugestões no fim.
- A ficha tinha um botão "YouTube ↗" que levava para fora do app.

**Agora** (partes 07 e 02):
- **Parâmetros oficiais:**
  - `controls=0`: sem a barra do YouTube;
  - `rel=0`;
  - `iv_load_policy=3`: sem anotações;
  - `loop=1` com `playlist`: repete, então a tela final de sugestões não aparece;
  - `playsinline=1`: toca dentro do app no iPhone;
  - `disablekb=1`, `fs=0`, `cc_load_policy=0`;
  - domínio **youtube-nocookie.com**.
- **Controles do MetaTreino numa barra abaixo do vídeo**, nada por cima da imagem: tocar/pausar, barra de posição (toque ou setas do teclado), tempo, velocidade 1× / 0,75× / 0,5× e volume. "Som" e "Tela cheia" continuam.
- O toque na imagem pausa ou continua. O iframe não recebe o toque (`pointer-events:none`), então o aluno não é levado ao YouTube por engano. Nenhum elemento do YouTube é coberto ou escondido.
- O botão "YouTube ↗" fica só para administradores, que precisam conferir o link.
- A proporção foi mantida: horizontal 16:9 e Shorts na vertical.
- Fechar a ficha destrói o player e os controles.
- Sem a API do YouTube (rede bloqueando), continua o iframe simples. Ele vem com os controles do YouTube, porque sem a API não há como pôr controles próprios, mas também repete e não mostra anotações.

**Limitações que não dá para contornar por configuração oficial:**
- O título e o logotipo do YouTube podem aparecer **por alguns segundos no início ou ao pausar**. O parâmetro `showinfo` foi desativado pelo YouTube em 2018, e `modestbranding` não tem mais efeito.
- Na tela cheia a barra própria fica de fora. Tocar na imagem continua pausando.

**Alternativa definitiva:** hospedar os vídeos fora do YouTube (por exemplo, Firebase Storage ou Cloudflare Stream) e tocar com o `<video>` do navegador, que não tem marca de terceiros. Implica custo de armazenamento e banda, por isso não fiz sem você decidir.

## 3. Créditos dos vídeos — parceiros

**Estrutura.** Avaliei e escolhi um cadastro reutilizável, dividido em duas partes:

| Onde | O que guarda | Quem acessa |
|---|---|---|
| `parceiros/{id}` | Cadastro completo: nome, empresa, Instagram, WhatsApp, site, texto do crédito, o que mostrar e onde | Só administradores (principal e secundários, igual aos vídeos) |
| `videosExercicios/{exercício}.creditos` | Só o que o administrador liberou, separado para `ficha` e `biblioteca` | Os alunos leem esta parte |

O WhatsApp marcado como "não mostrar" **não chega ao aparelho do aluno**: ele não fica só escondido na tela.

**Uso:**
- Painel → Vídeos → **Parceiros e créditos** → Novo parceiro.
- Na grade "O que os alunos veem", marque cada informação para **Ficha** e/ou **Biblioteca**. O contato vem desmarcado por padrão.
- Escolha os vídeos do parceiro: há busca, e a lista mostra se o vídeo já é de outro parceiro.
- **Editar** atualiza todos os vídeos dele. **Excluir** tira os créditos dos vídeos.
- O campo `url` do vídeo nunca é tocado. Salvar o link do vídeo passou a usar `merge`, então também não apaga os créditos.

**Exibição:**
- **Ficha do exercício** (no treino e na Biblioteca): bloco discreto com "Vídeo demonstrativo · Créditos: Nome · Empresa", texto, Instagram (link), contato profissional (abre o WhatsApp) e site.
- **Lista da Biblioteca:** uma linha curta "Vídeo: Nome · @instagram".
- Campos vazios não aparecem.
- Vídeos sem créditos ficam como antes. O crédito antigo (link do perfil) continua aparecendo quando o vídeo não tem parceiro.

**Validação:** nome obrigatório; Instagram só @usuário; telefone com DDD; site com http(s); tudo escapado no HTML.

## 4. Testes

| Teste | Resultado |
|---|---|
| `testes/dois-aparelhos.py` — celular (Google) × computador (e-mail/senha), nuvem simulada compartilhada com as regras da Beta 34 | ✅ 18/18 aprovados |
| ↳ o que cobre | histórico do celular no PC; mesmo documento; Histórico na tela do PC; corrida do PC aparece no celular; apelido do celular aparece no PC; treino completo e totais/conquistas iguais; PC offline + celular online + volta da internet sem perder nem duplicar; exclusão não volta; sair e entrar sem cache recupera tudo; aparelho novo sem internet não vira conta vazia; nenhuma operação negada pelas regras; sem erros |
| A mesma rotina na Beta 33 | ❌ reprova: PC no questionário, histórico vazio (reprodução da causa) |
| `testes/videos-creditos.py` | ✅ 29/29 aprovados |
| ↳ o que cobre | cadastro de 3 parceiros pelo painel; link intacto; vídeo guarda só o liberado; ficha com crédito completo, só Instagram e só contato; crédito antigo; sem vídeo; Biblioteca; parâmetros do modo limpo; nocookie; controles abaixo do vídeo; sem botão do YouTube para aluno; toque não vai ao YouTube; pausar/velocidade/volume/posição; Shorts vertical; aluno não lê parceiros nem altera créditos; editar; excluir; 360 px e 1366 px |
| Regressão da Beta 33 | ✅ tudo aprovado |
| ↳ testes incluídos | `regras.js` (48); `sincronizacao.js` (15); `auditoria-musculacao.js` (768 fichas); `simulacao-corrida.js` (60×20 semanas); `migracao-fichas.js` (99 → 0); `cronometro.py` (21); `atualizacao.py` (Beta 33 instalada → Beta 34 sozinha → modo avião); `navegador.py` (abas × 8 temas × celular/computador) |
| Regras reais no emulador do Firestore | 🔸 não executado: o download do emulador é bloqueado neste ambiente. As regras foram simuladas em Python seguindo o arquivo linha a linha. **Publique e faça o roteiro 4** |
| YouTube real (título ao pausar, tela cheia no celular) | 🔸 a API do YouTube não é acessível no ambiente de teste (usei um player simulado). Precisa de aparelho |
| Dados reais dos seus alunos | 🔸 sem acesso ao seu Firestore. A unificação foi testada com contas simuladas no formato real do documento |

## 5. Arquivos modificados (em relação à Beta 33)

- **`app.js`:**
  - `loadData` reescrito;
  - `resolveContaUnica`, `uidDados`, `salvarLocal`, `mostraSemDados`;
  - escuta em tempo real completa;
  - carimbo de hora nos envios;
  - `goTab` sem gravar na nuvem;
  - excluir conta e começar do zero no documento certo;
  - créditos carregados com os vídeos;
  - salvar link com `merge`;
  - painel do administrador prefere o documento mais recente.
- **`fonte/app-plus/`:**
  - parte `02`: créditos na ficha e na Biblioteca; botão do YouTube só para administradores;
  - parte `07`: player limpo e controles próprios;
  - parte `15`: arquivo anual no documento unificado;
  - parte `31` (nova): arquivo dos logins antigos, tela de Sincronização, parceiros;
  - parte `00`: versão.
- **`app-plus.js`:** remontado.
- **`index.html`:** linha "Sincronização entre aparelhos" no Perfil; CSS do player, dos créditos e do formulário; versão.
- **`service-worker.js`:** versão.
- **`firestore.rules`:** `contas`, `parceiros`, acesso por e-mail verificado.
- **Documentos:** `NOTAS-DA-VERSAO.md`, `ROTEIRO-DE-TESTES.md`, `MAPA-DO-CODIGO.md`, este relatório.
- **Testes novos:** `testes/nuvem-simulada.py`, `testes/mock-firebase-rede.js`, `testes/dois-aparelhos.py`, `testes/videos-creditos.py`.

## 6. O que fica para decidir ou observar

1. **Excluir conta** apaga o documento unificado e o vínculo. Documentos antigos de outros logins da mesma pessoa continuam na nuvem (como antes da Beta 34).
2. **"Apagar dados de ex-alunos"** no painel apaga o documento mais recente da pessoa. Se ela tiver um documento antigo de outro login, ele continua.
3. Se quiser **acabar com os UIDs diferentes na origem**, ative no Console do Firebase: Authentication → Configurações → "Vincular contas que usam o mesmo e-mail". Para quem já tem duas contas, isso não junta nada sozinho; a Beta 34 resolve esses casos.
4. **Ordem de publicação:** publique as regras e depois o app. Na ordem inversa nada quebra, só a unificação e os parceiros ficam esperando as regras.

---

# Revisão complementar da Beta 34

Feita sobre a Beta 34 em andamento, sem começar outra versão. O que já funcionava foi preservado.

| # | Ponto | O que estava | O que foi feito |
|---|---|---|---|
| 1 | **Corrida: semana com menos tempo** | **Corrigido.** A escolha dos treinos já era boa: longão primeiro, qualidade longe dele, os de menor prioridade saem e não há compensação depois. Mas havia três falhas. (a) **"Reorganizar" não remontava a semana**: mostrava "Semana reorganizada" e nada mudava até um recálculo posterior (reproduzido no teste). (b) Não havia prévia antes de aplicar. (c) Com poucos dias seguidos, um treino de qualidade podia cair colado no longão, e os treinos leves restantes ficavam até ~20% mais longos. | (a) Aplica na hora, mantendo os dias que já passaram. (b) Nova prévia "Como fica a semana": Antes/Depois, o que continua, o que sai, tempo total e o aviso de que a semana seguinte volta ao normal. Depois o aluno escolhe "Aplicar" ou "Escolher outros dias". (c) Dois treinos fortes em dias seguidos: o segundo vira corrida leve, com explicação. Na semana reduzida, nenhum treino fica mais longo que o mesmo tipo de treino na semana normal. Também corrigi a virada de semana: ela herdava dias da semana anterior quando o app era aberto no meio da semana. |
| 2 | **Seleção de texto** | Segurar o dedo em botões, abas, menus e cartões abria o menu de copiar. | `user-select:none` e sem menu de toque longo só em botões, abas, opções, linhas de menu, cartões de navegação e controles do cronômetro e do player. Textos da ficha, créditos e campos de digitação continuam selecionáveis. Leitores de tela e teclado não são afetados. |
| 3 | **Descanso na musculação** | **Corrigido.** Desde a Beta 33 o descanso já variava por tipo de exercício (principal, secundário ou isolado). Mas o **objetivo** ainda decidia sozinho: o emagrecimento dava 45-60 s até no agachamento. Além disso, o cronômetro pegava o descanso do **primeiro treino** que tivesse o exercício (não do treino aberto), e exercícios extras sempre recebiam 60 s. | O descanso agora vem do **tipo de exercício** e da **intensidade** (faixa de repetições). O objetivo entra só pelas repetições que prescreve. A partir de 50 anos, um degrau a mais. Core e panturrilha têm 45-60 s em qualquer objetivo. O cronômetro usa o descanso do exercício no treino aberto; extras recebem o descanso do tipo deles. Os planos salvos recebem os descansos novos uma vez; exercícios, séries e repetições não mudam. Não existe hoje configuração individual de descanso nem tipo de série (bi-set, drop-set) no app; nada disso foi criado. |
| 4 | **Primeira série e descanso** | **Corrigido.** "+ Nova série" cria a linha da próxima série e, ao mesmo tempo, marca a anterior como feita. Por isso iniciar o descanso nele está certo, **exceto no primeiro toque**: ali nenhuma série tinha terminado e o descanso começava indevidamente. | A 1ª série não dispara descanso; o botão passa a se chamar "+ Registrar a 1ª série". Da 2ª em diante, um descanso por toque (substitui, nunca soma). Editar, excluir e "Salvar" (depois da última série) não disparam descanso. Um aviso no topo explica: "Terminou a série? Toque em + Nova série: o descanso começa na hora." |
| 5 | **Exercícios sem carga** | **Corrigido.** A coluna de peso aparecia em todos os exercícios ("opcional" nos de peso do corpo). Recorde só valia com carga, então flexão e barra fixa nunca tinham recorde. A Prancha adicionada como extra pedia repetições. | Cada exercício tem um tipo de registro: **carga** (peso + repetições), **peso do corpo** (só repetições, com "+ Usei carga extra" opcional), **isométrico** (tempo), **cardio** (repetições) e **mobilidade**. O tipo é calculado pelo cadastro existente, sem campo novo nos dados, e os registros antigos continuam iguais. Sem carga, o recorde é de repetições, e Recordes mostra "15 repetições" em vez de "0kg × 15". |
| 6 | **Posição dos créditos** | Os créditos ficavam logo abaixo dos botões do vídeo, antes das orientações. | Agora ficam no fim da ficha, depois de músculos, execução, dicas e observações, com o título "Conteúdo demonstrativo". Na Biblioteca continua a linha curta no fim de cada item. Contatos não autorizados continuam fora. Vídeos sem créditos e com o crédito antigo continuam iguais. |

**Testes desta revisão (todos executados e aprovados):**

| Teste | O que verifica | Resultado |
|---|---|---|
| `testes/semana-menos-tempo.js` | 5 cenários: 4→3 dias; 3 dias seguidos; só sábado e domingo; 5→3; meio da semana | 34 verificações aprovadas |
| `testes/registro-series.py` | Carga, peso do corpo, carga extra, isométrico; 1ª série sem descanso; descanso exato do exercício; editar/excluir sem disparo; pausar; terminar; última série; ordem da ficha; seleção em botões, abas, textos e campos; prévia, aplicar e voltar ao normal da semana reduzida | 23 aprovadas |
| `testes/regras.js` | Ganhou os descansos por intensidade (o objetivo sozinho não decide) e os tipos de registro | 61 aprovadas |
| Regressão completa | Fichas (768), simulação de corrida (60×20), migração das fichas, sincronização, cronômetro, dois aparelhos, vídeos e créditos, atualização Beta 33 → 34 com modo avião, todas as abas nos 8 temas | Aprovada |
| Montagem | `montar.py`: 5 versões iguais em 2027.1 Beta 34 e a mesma versão do Firebase no SW e no `index.html` | Aprovada |

# Relatório técnico — 2027 RC 4 (base: RC 3)

**Versão:** `2027-rc.4` / "2027 RC 4". A versão foi trocada **uma vez**, no fim, pelo padrão do projeto (`python3 fonte/montar.py --versao 4`). Ela aparece nos 5 lugares conferidos pelo script: `app.js`, `service-worker.js`, `index.html` (`?v=` e rodapé) e `MTP.versao`.

**Firestore:** as regras **não mudam** (`testes/regras.js`: 61 aprovados). Nenhuma coleção nova. Os campos novos são opcionais, ficam no estado do próprio aluno e não substituem nada:

| Onde | Campo | Para quê |
|---|---|---|
| sono (`sono.n[dia]`) | `min` | duração em minutos inteiros. `h` continua sendo gravado (= min/60) só para compatibilidade |
| treino de musculação (histórico) | `sid` | identificador da sessão |
| séries (`progress[ex][i]`) | `sid` | a qual treino salvo as séries pertencem. Sem `sid` = treino em andamento hoje |

**Dados antigos não são reescritos de forma destrutiva:**
- uma noite `{h: 6.6}` é lida como 396 min e continua igual no banco;
- `mtSessaoMigrar` só **acrescenta** o `sid` aos treinos já salvos e às séries que são deles sem ambiguidade (um único treino naquele dia com aquele exercício);
- nenhuma conquista, treino ou registro de sono foi apagado.

---

## 0. Diagnóstico (antes de alterar)

| Item | Situação no RC 3 | Tipo de correção |
|---|---|---|
| 1 Sono | **Parcial.** "Dormi/acordei" certo (0,01 h). "Só o total" ainda `Math.round(...*10)/10` (6 h 37 → 6 h 36); `step="5"` nas partes 76 **e** 81; aviso em "5,6 h" | Estrutural (`min`) + migração por leitura |
| 2 H:M:S | **Parcial.** Plano de corrida certo; avulso e edição do histórico ainda "min:seg" (régua até 300 min) | Pontual |
| 3 Análise mensal | **Não corrigido.** Planejados = treinos/semana × semanas do mês inteiro | Pontual (`mtAdesao`) |
| 4 Assistente | **Não corrigido.** Balão "tenho uma dica" sem dica; recorde contava a referência | Pontual |
| 5 Recuperação / duas modalidades | **Não corrigido.** Aviso não sabia da atividade feita; "dia de descanso" com a outra modalidade ativa | Pontual + linha nova |
| 6 Atividade da semana | **Não corrigido.** Um clique genérico para o cartão inteiro | Pontual (redesenho) |
| 7 Volume no card | **Já corrigido** (séries no centro); faltava a opção do kg | Pontual |
| 8 Sessões | **Não corrigido.** Uma entrada de séries por exercício **por dia**: a mistura acontecia já na gravação | Estrutural (`sid`) + migração |
| 9 Volta à aba Treinos | **Não corrigido.** Seleção gravada sem data | Pontual |
| 10 Sono × atividade | **Parcial.** Só esforço depois de noite boa × ruim; cores 4/5 e 1/2 parecidas | Pontual |
| 11–21 | Etapa 2: nada feito | Ver seção 2 |

**Sobrescritas encontradas e eliminadas:**
- formulário de sono da parte 76, sobrescrito pela 81 com a lógica antiga;
- `_cqCelTenta` da parte 48, sobrescrito pela 51 (a janela de conquistas reaparecia);
- regra do "último indicador ímpar" em 16 **e** 28;
- `medalSvg` da parte 02, sobrescrito pela 22.

Em todos os casos ficou **uma** implementação; nas outras ficou só um comentário apontando para ela.

---

## 1. Etapa 1 — lógica, informações e confiabilidade

### 1.1 Sono (item 1)
- **Fonte única da conta** (parte 76):
  - `sonoMinutosDe(dor, aco)` — passa da meia-noite: 23:40 → 06:55 = 435 min;
  - `sonoMinDe(noite)` — nos dois horários usa os horários; senão `min`; senão `round(h×60)`;
  - `sonoFmtMin` — "6 h 37".
- **Formulário e gravação só na parte 81.** O da 76 saiu.
  - Minutos de 0 a 59 com `step="1"`; 75 é recusado com aviso e nada muda.
  - Os dois modos gravam `min` inteiro.
  - O total aparece enquanto se digita, também no modo "Só o total".
- **Onde aparece em h e min:** aviso de noite curta ("5 h 36", antes "5,6 h"), atalho do Início, lista de noites, médias, gráfico, tooltip e regra de noite ruim (`min < 360`).
- **Exemplo pedido:** 6 h 37 → `min: 397`, lido 397, exibido "6 h 37"; reaberto, mostra 6 e 37.

### 1.2 Tempo h:m:s (item 2)
- **Componente único** (app.js): `mtTempoHmsHtml` / `mtTempoHmsLer` / `mtTempoHmsSync`.
  - Valida números inteiros e minutos e segundos de 0 a 59.
  - Na edição, valida **antes** de alterar qualquer outro campo.
- **Caminhos conferidos:**

  | Caminho | Situação |
  |---|---|
  | Corrida planejada (`openRunLog`) | já era h:m:s |
  | Corrida avulsa, caminhada e bike (`openActivityLog`) | **passou a ser h:m:s** |
  | Edição pelo histórico (`openHistoryEntry`) | **passou a ser h:m:s** |
  | Importação do relógio | usa os segundos do arquivo, sem campo |

- **Sem perda:** a duração continua em minutos com fração (1:19:20 = 4760 s exatos).
- **Exibição:** histórico, card e PDF já usavam `fmtDur` (RC 3) e mostram "1 h 19 min 20 s".
- O campo oculto antigo (`act-min`/`he-dur`) recebe "h:mm:ss", então as validações que já o liam (ritmo impossível etc.) continuam valendo.
- A régua de gestos usa o controle h:m:s.

### 1.3 Análise mensal (item 3)
- **`mtAdesao`** conta, dia a dia:
  - os treinos programados desde `planStartTs` de cada plano;
  - sem dias de férias;
  - com o dia de hoje só se o treino já foi feito.
  - Também devolve `inicio` e `diasComPlano`. Os outros usos (`porSem`, `feitos`) não mudaram.
- **`analiseMes`:**
  - plano iniciado no mês: "Seu plano começou em 23/11" e **não compara** com o mês anterior;
  - mês anterior sem plano: também não compara, e explica;
  - menos de 14 dias de plano ou menos de 4 treinos programados: mensagem neutra, sem percentual de cumprimento;
  - com dados suficientes e frequência baixa, mostra os números e as saídas práticas ("Semana com menos tempo", dias do plano), sem dizer que o aluno "planejou demais".

### 1.4 Mensagens do assistente (item 4)
- **Balão de recuperação:**
  - só aparece com treino hoje ainda não feito **e** uma conclusão concreta;
  - o texto do balão é a própria conclusão e a resposta é a dica inteira;
  - depois do treino do dia, não aparece.
- **Recordes:** "Você bateu um recorde hoje!", "Recordes de hoje", o insight de recordes e o desafio "Quebrador de Limites" usam só recordes reais (`mtPrsReais`). O 1º registro de um exercício, que é só a referência, não conta mais.
- **Consistência:** "aparecer mesmo sem vontade" (que presumia desânimo) virou "Constância é o que sustenta a evolução".

### 1.5 Recuperação e duas modalidades (item 5)
- **Cartão "Pernas":**
  - antes da corrida: sugestão de ritmo leve, dita como sugestão;
  - atividade de hoje feita com esforço ≤ 6: o cartão **some** (caminhada leve não é tratada como corrida intensa);
  - atividade intensa feita: "já foi registrada… hora de recuperar";
  - sem corrida no plano: "hoje não tem corrida no plano (a musculação tem treino hoje)", em vez de "dia de descanso".
- **Saudação:**
  - se só uma modalidade descansa, diz qual e o que a outra tem;
  - não diz "missão cumprida" com a outra modalidade ainda por fazer.
- **Cartão de descanso:** "Musculação: descanso hoje" + "Hoje tem … na corrida" (com atalho), ou "já registrada", ou "descanso escolhido".
- **Linha "Hoje"** (parte 82), abaixo do seletor, com os dois planos reais: feito / a fazer / feito em outro dia / descanso escolhido / sem treino. Nenhum plano é alterado.

### 1.6 Atividade da semana (item 6)
- **Visual:**
  - feito: cheio, com ✓;
  - feito em outro dia: contorno cheio, com ✓;
  - planejado: tracejado;
  - hoje: anel;
  - descanso escolhido: cinza;
  - faltou: contorno cinza com –;
  - sem treino: só o fundo.
- **Cores:** só a do tema e tons neutros.
- **Legenda:** feito / outro dia / planejado / faltou / descanso.
- **Detalhe de cada parte** (`openAwDetalhe`):

  | Parte | Abre |
  |---|---|
  | Placar | treinos do plano (planejados, concluídos e o dia em que foram feitos) |
  | Cada dia | o que aconteceu (horário, duração, km, esforço) e o que estava planejado |
  | Séries | séries da semana por exercício, marcando o treino em andamento |
  | Semanas na meta | a regra e as últimas 8 semanas (para antes do início do plano) |
  | Extras | atividades fora do plano |

### 1.7 Volume no compartilhamento (item 7)
- Continua: **séries** como número principal; exercícios, repetições, duração e maior carga como secundários.
- **Opção nova, desligada por padrão:** "Mostrar volume registrado (kg)" → "Volume registrado: 4.158 kg (soma de carga × repetições)".
  - Uma nota diz que **não** é o peso total levantado.
  - Carga extra aparece separada.
  - Nada é multiplicado: halteres, unilaterais e peso do corpo entram como foram registrados.

### 1.8 Sessões separadas (item 8)
- **Causa:** `openSetLog` reabria a entrada **do dia** do exercício. O 2º treino do dia com o mesmo exercício caía nela, aparecia já feito e somava as séries.
- **Correção:**
  - ao salvar, o treino recebe `sid` e as entradas dele também;
  - entrada sem `sid` = treino em andamento.
- **Revisado em todos os pontos:**
  - registro (`openSetLog`), "feito" do exercício/treino (`checkLiftDone`, `exFeito`, `isLogged`) e cartão do exercício (mostra as séries do treino aberto, pelo `sid`);
  - salvar (`confirmLiftWorkout`) e extras registrados depois de salvar (`syncExtrasHistorico`);
  - exclusão: só as séries **daquele** treino; mantendo as séries de hoje, elas voltam a ser o treino em andamento;
  - detalhe série por série (parte 61), volume e card (`mtEntradasDoTreino` → `mtEntradasDaSessao`), card base (parte 26), PDF (`mtPdfSessoesSeries`);
  - recordes: cada entrada é uma sessão, então o 2º treino do dia compete com o 1º;
  - sincronização entre aparelhos (`mesclaEstado`): sessões do mesmo dia não somem, e a entrada já fechada no outro aparelho recebe o `sid`.
- **Limite:** registros **antigos** em que dois treinos do mesmo dia já tinham sido gravados na mesma entrada não podem ser separados (não há como saber qual série era de qual). Ficam como estavam.

### 1.9 Volta à aba Treinos (item 9)
- Ao **entrar** na aba vindo de outra tela, a ordem é:
  1. treino de musculação em andamento hoje (séries intactas);
  2. treino de hoje;
  3. próximo da semana ainda não feito.
- Escolher um treino e ir para a aba na sequência ("Ver sessão", lista) continua indo direto nele.
- Dentro da aba, a escolha é respeitada. Nada é reiniciado nem apagado.

### 1.10 Sono × atividade física (item 10)
- **Médias** (4 semanas e 3 meses) com a coluna "Treinos" (musculação, corrida, caminhada e bike).
- **Últimos 30 dias:** distribuição de qualidade e de disposição.
- **Últimos 90 dias:**
  - porcentagem de dias com atividade depois de noite boa × ruim;
  - modalidades feitas;
  - esforço médio.
- Mínimo de 5 noites boas e 5 ruins, ou de 3 treinos com esforço registrado depois de cada uma. O texto diz que é associação, não causa.
- **Paleta nova:** vermelho, laranja, amarelo, verde e azul, com legenda em quadrados de cor (antes eram nomes coloridos, ruins de ler).

---

## 2. Etapa 2 — experiência, conquistas e desafios

### 2.1 Conquistas fora do Início (item 11)
- Saíram o atalho dos indicadores, o cartão `#home-trofeus` (escondido por CSS, porque outras partes ainda o atualizam), o bloco em "Personalizar início" e o indicador da versão para computador.
- Na versão para computador, "Volume na semana" (que aparecia em toneladas) virou "Volume registrado", em kg.

### 2.2 Conquista depois do registro (item 12)
- **Sem janela grande.** Aparece um aviso pequeno no rodapé, por cerca de 5 s: "Nova conquista desbloqueada · nome". Tocar nele leva à aba Desafios.
- A conquista continua "nova" (o ponto na aba Desafios fica aceso) até a pessoa abrir Conquistas.
- Confirmação do treino: o toast de sempre ("Treino salvo").

### 2.3 Aba Desafios (item 13)
- **Ordem:**
  1. **Desafio atual** — desafio temático, missões, recompensa e a linha "Metas do mês" com o próximo degrau;
  2. **Em grupo** — desafio juntos, só para quem tem grupo;
  3. **Conquistas** — um cartão: total, quantas novas, as 4 mais recentes, atalhos "Desbloqueadas" e "Disponíveis" (abre já filtrado);
  4. **Histórico** — desafios anteriores, medalhas e metas dos meses, aviso de mês encerrado;
  5. **Em breve**.
- **Saiu o que repetia:** a lista "Novidades" (agora é o "N novas" do cartão) e os quatro atalhos.
- **Missões de semanas anteriores ao início do plano** aparecem como "Antes do início do seu plano — não conta".
- A implementação só **reorganiza** os blocos que as outras partes já desenham. Nenhuma conta foi refeita.

### 2.4 Bronze, prata e ouro (item 14) — avaliação e decisão
- **Avaliação:**
  - os degraus ajudam a ver o "próximo passo" de um mesmo hábito, o que é diferente das conquistas (marcos únicos);
  - havia **51 degraus** de uma vez;
  - as metas eram **injustas** para quem começa no fim do mês (8 dias ativos pedidos em 8 dias);
  - o desafio "Quebrador de Limites" contava a referência como recorde.
- **Decisão:** manter, porque retirar apagaria o sentido das medalhas já guardadas dos meses anteriores, mas simplificar:
  - as do **foco do mês** vêm primeiro e as outras ficam recolhidas em "Mais metas do mês";
  - uma frase explica os 3 degraus;
  - no mês em que o plano começa, as metas de quantidade ficam **proporcionais** aos dias disponíveis (mínimo 25%), com aviso; recordes, longão e grupos não mudam;
  - recordes contam só os reais.
- **Dados:** `state.monthly.done` e as medalhas não mudam.

### 2.5 Desafio do mês no Início (item 15)
- **Implementada a opção B, enxuta:**
  - uma linha só: medalha, "Reta Final · falta 1 dia ativo · 4 dias restantes" e uma barra fina;
  - aparece só enquanto há algo a fazer: some com o desafio concluído ou sem desafio no período;
  - tocar abre Desafios.
- Os elementos antigos do cartão ficam escondidos (as partes 04 e 17 os atualizam). Continua no "Personalizar início".

### 2.6 Indicadores do Início (item 16)
- **Causa:** a regra "último ímpar ocupa a linha" rodava só quando a personalização mudava, e em dois lugares (16 e 28), um deles pela ordem do HTML e não pela ordem visual.
- **Agora** é uma regra só (`mtIndicadoresAjusta`):
  - roda a cada desenho, pela ordem visual;
  - grava `data-n` no bloco;
  - 1 cartão ocupa a linha toda; 3 cartões ficam 2 + 1 largo.
- Testado com 1, 2 e 3 cartões, em 360, 390 e 412 px.

### 2.7 Ícones das conquistas (item 17)
Revisão das 92 conquistas. Trocados:

| Conquista | Antes → depois |
|---|---|
| "Nem a Preguiça" | chuva → **bateria recarregando** |
| "Sem Drama" (12 treinos sem pular semana) | escada → **calendário com ✓** |
| "Sabedoria" (adaptou por dor) | lótus → **escudo com coração** |
| "Sofá Que Espere" | sofá (sugeria descanso) → **calendário S·D** |
| km acumulados (corrida, caminhada e bike) | a mesma estrada com o mesmo número para as três (iguais entre si) → estrada / pegadas / bicicleta + "10km" (diferentes também de "10 caminhadas") |
| "Centurião" | coroa → **halter 100** |
| "Maratona" | coroa → **bandeira 42K** |
| "25 pedais" | montanha → **bicicleta 25** |
| "Degrau Acima" | seta de PR → **degraus** |
| "Desafio juntos" | o mesmo "par" da dupla → **calendário ✓ / alvo / bandeira** |

- Mesma família visual (traço 24×24). Rótulos longos ("500km") cabem no selo.
- Nomes e critérios não mudaram.

### 2.8 Dados de teste (item 18)
- A nova organização **não exige** apagar conquistas, medalhas ou troféus. Nenhuma limpeza foi feita.
- Não tenho acesso ao Firestore de vocês, então também não há limpeza feita pelo app.
- Se quiserem zerar só as conquistas das duas contas de teste, isso pode ser feito pelo console, removendo `trophies`, `trophyDates`, `conqPend` e `conqVistas` do estado da conta, **sem tocar** em `modules`, `progress` nem `sono`. Não incluí migração para isso.

### 2.9 Compartilhamento (item 19)
- **Logo:** é a **mesma do painel** (mural › logo, a que já aparece na barra do app). Nenhum cadastro novo.
  - Em "Marca": "Logo do MetaTreino" ou "Só o ícone M".
  - A logo é desenhada "contida", com proporção e transparência preservadas.
  - A logo é um data-URL, então a imagem continua exportável (testado).
  - Sem logo cadastrada, a opção nem aparece.
- **Foto:** com ou sem; da galeria, como antes.
- **Posição dos dados** (com foto, em cards sem medalha nem percurso): "Embaixo" ou "Em cima". Em cima, o alto da foto escurece para manter a leitura.
- **Arraste livre: não fiz.** Exigiria medir o bloco e limitar o arraste ao quadro em todos os formatos e disposições, com risco de dados ilegíveis ou fora da imagem. As duas posições prontas cobrem o pedido com segurança.
- "Mostrar meu primeiro nome" preservado.

### 2.10 Boneco da corrida (item 20)
O ícone `run` (seletor Musculação/Corrida, cartões e histórico) tinha **uma perna**. Agora tem tronco inclinado, dois braços em oposição, uma perna à frente com o joelho dobrado e a outra atrás empurrando. Mesmo traço da família.

### 2.11 Textos (item 21)
- **Saudação:** "Depois do dia corrido, nada como descarregar tudo no caminhada + corrida" virou "Depois de um dia corrido, o treino de hoje (…) ajuda a fechar o dia bem." Corrigido também o "no caminhada".
- **Dicas de clima:** aparecem recolhidas (título + 1 dica + "mais dicas"), com a nota "Sugestões para o clima de agora — adapte ao seu dia, não são obrigação".
- **Cartão das pernas:** diz "É uma sugestão, não uma regra".

---

## 3. O que não foi possível fazer por completo
1. **Separar sessões antigas que já estavam misturadas.** Quando dois treinos do mesmo dia foram gravados antes desta versão na mesma entrada, não há como saber qual série era de qual. Ficam como estavam. Daqui para a frente não acontece mais.
2. **Arraste livre dos dados sobre a foto.** Substituído por posições prontas (2.9).
3. **Testes em celular real:** **não foram feitos**. Não tenho acesso a aparelhos nem às contas. Roteiro em `ROTEIRO-DE-TESTES.md`, seção "2027 RC 4", 20 passos.
4. **Suítes que precisam de servidor de rede ou de service worker real** (`dois-aparelhos.py`, `casa-dois-celulares.py`, `atualizacao.py`): não rodaram neste ambiente, que não permite abrir porta de servidor local. A sincronização foi coberta pelo `testes/sincronizacao.js` (18 ok) e pelo teste de `mesclaEstado` do `rc4.py`.

## 4. Testes

### 4.1 Automatizados (Chromium sem tela, Firebase simulado, relógio controlado)
- **Novo: `testes/rc4.py` — 93 verificações, 0 falhas.**
  - **Etapa 1 (60):**
    - sono (6 h 37 = 397, meia-noite, 75 min recusado, registro antigo, aviso, lista);
    - h:m:s (avulso, edição, valor inválido, corrida do plano);
    - sessões (dois treinos no mesmo dia: registro, volume, card, detalhe, PDF, recordes, sincronização, exclusão, migração);
    - volta à aba Treinos;
    - duas modalidades e pernas;
    - análise do mês com início em 23/11 e assistente;
    - Atividade da semana (detalhe de cada parte, 360 px), volume no card, sono × atividade e paleta.
  - **Etapa 2 (33):**
    - Início sem conquistas, indicadores com 1, 2 e 3 cartões, desafio do mês em uma linha;
    - aviso pequeno de conquista;
    - aba Desafios (ordem, sem repetição, antes do início, filtro, grupo);
    - metas proporcionais, ícones, logo do painel e posição com foto (imagem exportável), boneco da corrida, dicas de clima, textos;
    - **360, 390 e 412 px × todos os temas** (Início, Desafios, Treinos e Progresso sem nada vazando).
- **Regressão:** ver 4.3.
- **Node:** regras 61, sincronização 18, semana com menos tempo 34, Beta 35 23, auditoria da musculação e simulação da corrida sem problemas.

### 4.2 Simulados (não são testes em aparelho)
- Relógio do navegador fixado em datas da semana de 23 a 27/11/2026, fuso de Manaus.
- Dois aparelhos (pela função `mesclaEstado`, sem rede).
- Conta em grupo (funções do grupo simuladas).
- Logo do painel (data-URL).
- Foto de fundo (imagem gerada).
- Clima de chuva (dados do clima simulados).

### 4.3 Regressão das suítes anteriores
As suítes rodaram nesta versão e na RC 3 original, no mesmo ambiente, para separar o que é desta versão do que já falhava antes.

| Suíte | RC 4 | Observação |
|---|---|---|
| rc4 (nova) | 93 ok / 0 | — |
| rc3 | 98 ok / 1 | a mesma falha da RC 3 original: tema da conta A depois de trocar de conta, sensível ao tempo do ambiente |
| rc2, rc1 | 70 / 0, 10 / 0 | — |
| rc0 | 53 ok / 0 até a parte "sem internet" | essa parte precisa do service worker real (igual na original) |
| beta64, 63, 61, 60, 59, 58, 54, 53, 52, 51, 50, 46, 44, 39, 37 | todas sem falhas | — |
| beta55 | 45 / 0 | 2 verificações atualizadas (janela de conquistas → aviso; "Novidades" → cartão de Conquistas) |
| beta48 | 36 / 0 | 3 atualizadas (Conquistas fora do Início; tempo avulso em h:m:s; aviso de conquista). Numa das rodadas, uma parte de cupons deu tempo esgotado; em duas outras rodadas passou |
| beta49 | 36 / 3 | 4 atualizadas (agrupamento e aviso no lugar da janela; texto da análise do mês). As 3 falhas restantes são **as mesmas da RC 3 original**: rótulo "participando" no desafio, sair do desafio e medalha sem participação |
| beta41 | 66 / 6 | 1 atualizada (cartão único de Conquistas). As 6 falhas são iguais às da original: o navegador de teste não carrega as fontes externas (ERR_FAILED) |
| beta43, beta42 | 75 / 3, 11 / 1 | tela "sem acesso": a etiqueta do botão depende do tempo da 2ª tentativa. A RC 3 original falha igual quando rodada de novo |
| beta40, beta38 | iguais à original | fontes externas (ERR_FAILED) e cadastro em etapas sensível ao tempo do ambiente. O cenário A2 do beta38 falhou na versão nova e na original |
| serie-descanso, compartilhar, registro-series, cronômetro, acessibilidade | 24 / 0, 10 / 0, 22 / 1, 21 / 0, 7 / 0 | a falha de registro-series é igual à da original |
| acabamento | 31 / 1 | igual à original (rolagem do Perfil) |
| navegador (360, 390 px e computador, todos os temas) | 0 página mais larga que a tela, 0 janela com falha, 0 ID repetido, 0 contraste baixo | os 3 "erros" são as fontes externas bloqueadas neste ambiente |

**Não rodaram aqui** (precisam de porta de rede ou de service worker real): `dois-aparelhos.py`, `casa-dois-celulares.py`, `atualizacao.py` e as suítes Node muito longas `troca-sem-repetir.js` e `corrida-tempo-limite.js`. Estas duas não tocam em nada alterado nesta versão.

## 5. Arquivos alterados
- **`app.js`:**
  - h:m:s (`mtTempoHms*`), registro avulso e edição;
  - sessões (`mtSidNovo`, `mtEntradaAbertaHoje`, `mtEntradasDaSessao`, `mtSessaoMigrar`, `openSetLog`, `checkLiftDone`, `renderExerciseCard`, `confirmLiftWorkout`, `syncExtrasHistorico`, `deleteHistoryEntry`, `mesclaEstado`);
  - assistente (`maNudge`, `nudgeResposta`, `maInsight`);
  - saudação, cartão de descanso e cartão das pernas;
  - Conquistas fora dos indicadores;
  - metas do mês (`_fatorInicioMes`, `mkDesafio`, `openMonthly`) e "Quebrador de Limites";
  - dicas de clima recolhidas;
  - ícone `run`;
  - versão.
- **Partes:**
  - 01 (ícones);
  - 05 (`mtAdesao`, `analiseMes`, texto de consistência);
  - 16 e 28 (regra de indicadores retirada daqui);
  - 22 (rótulo longo);
  - 26 (volume opcional, logo, posição, sessões);
  - 29 (computador);
  - 34 (régua);
  - 48 (aviso de conquista);
  - 51 (sobrescrita da janela retirada);
  - 61 (detalhe pelo `sid`);
  - 65 e 77 (ícones);
  - 76 e 81 (sono, Atividade da semana);
  - 80 (volume/sessões);
  - **novas: 82 e 83**.
- **Outros:**
  - `index.html` e `service-worker.js` (versão);
  - `testes/rc4.py` (novo);
  - `testes/rc3.py`, `beta41.py`, `beta48.py`, `beta49.py` e `beta55.py`: verificações atualizadas só onde o comportamento mudou de propósito. Os pontos são:
    - sono: "Sono e atividade física";
    - Atividade da semana: um detalhe por parte;
    - conquistas: aviso pequeno no lugar da janela, cartão único em Desafios e nada de Conquistas no Início;
    - tempo do registro avulso em h:m:s;
    - texto da análise do mês;
  - `MAPA-DO-CODIGO.md`, `NOTAS-DA-VERSAO.md`, `ROTEIRO-DE-TESTES.md` e este relatório.

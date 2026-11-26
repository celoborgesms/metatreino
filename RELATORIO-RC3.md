# Relatório técnico — 2027 RC 3 (base: RC 2)

**Versão:** `2027-rc.3` / "2027 RC 3". A versão foi trocada **uma vez**, no fim, pelo padrão existente (`python3 fonte/montar.py --versao 3`). Ela aparece nos 5 lugares conferidos pelo script: `app.js`, `service-worker.js`, `index.html` (`?v=` e rodapé) e `MTP.versao`. O APK usa `VERSION_NAME`/`VERSION_CODE` do workflow, que não mudou.

**Firestore:** as regras não mudam (`testes/regras.js`: 61 aprovados). Nenhuma coleção nova. Os campos novos são opcionais e ficam no estado do próprio aluno:

| Onde | Campo | Para quê |
|---|---|---|
| estado do aluno | `relatosCansaco` | quando o aluno disse ao assistente que estava cansado |
| estado do aluno | `conqRevogadas` | conquistas retiradas pela correção (não voltam de cópia antiga) |
| estado do aluno | `rc3Corr`, `rc3CorrSaiu` | marca da correção única e o que ela retirou |
| estado do aluno | `prefs.ocultarCargaExtra` | esconder o botão "Usei carga extra" |
| recorde (`prs[ex]`) | `ref`, `quebras` | referência (1º registro) × recordes de verdade |
| treino do histórico | `adicional` | treino adicional (fora do plano) |
| pulo (`skips[]`) | `planDay` | dia do plano; `dayIdx` passa a ser o dia real do descanso |
| dupla (`setup.dupla`) | `qe` | quantidade por equipamento (substitui `q`, migrado sozinho) |
| sono (`sono.n[dia]`) | `q5`, `d5` | qualidade e disposição em 5 níveis (`q`/`d` de 1–3 continuam, derivados) |

Os registros históricos não foram reescritos. A única alteração em dados antigos é a correção das conquistas e dos recordes (seção 1.8), feita pelas mesmas regras que valem para os registros novos.

---

## 1. Etapa 1 — estabilidade e integridade dos dados

### 1.1 Dois logins no mesmo celular (item 21)
- **Causa (na origem dos dados):**
  - o tema ficava numa chave única do aparelho (`metatreino_theme`) e a regra da Beta 38 dizia que o tema do aparelho nunca é trocado pelo da conta;
  - a conversa do Meta Assistente também ficava numa chave única (`mt_ma_thread`);
  - várias marcas locais eram do aparelho e não da pessoa: cartão do dia fechado, seções recolhidas, preferências e "mostrar meu nome" do card de compartilhar;
  - o "Sair" zerava o `state`, mas a página continuava com a memória da sessão anterior (conversa aberta, telas desenhadas, tema aplicado).
- **Correção:**
  - conversa com chave por conta (`maThreadChave`), guardando o dono. A chave antiga, sem dono, é descartada sem ser mostrada;
  - o aparelho registra de quem são as preferências locais (`mt_conta_local`, `metatreino_theme_uid`). Ao trocar de conta, as marcas pessoais são apagadas e o tema passa a ser **o da conta** (ou o padrão, se a conta nunca escolheu);
  - o "Sair" envia o que está pendente (espera até 3 s), desconecta, volta o aparelho ao tema padrão e **recarrega a página**.
- **Testado (simulado):** conta A com tema e conversa → sair → conta B no mesmo aparelho (sem tema, conversa nem marcas da A) → sair → A de novo (tema da A restaurado pela conta).
- **O que continua no aparelho, de propósito:**
  - a cópia offline de cada conta (`metatreino_cache_<uid>`, separada por conta e nunca mostrada a outra);
  - o percurso e o arquivo original das importações (IndexedDB, endereçados pela atividade da própria conta).

### 1.2 "Depois de alguns minutos o app reinicia e volta para o login" (item 22)
Não aumentei o tempo de sessão: o login do Firebase não expira por si. Achei três caminhos no código que produzem exatamente esse sintoma:
1. **Atualização automática no meio do uso:** com o app na tela, no Início e sem janela aberta, a versão nova era aplicada (`skipWaiting`) e a página recarregava. Em segundo plano ela também recarregava, até no meio do descanso. **Agora:**
   - só aplica com o app em segundo plano **e** fora de série/descanso/cronômetro;
   - ou antes de a entrada terminar (ainda na tela de carregamento);
   - nunca com o app em uso.
2. **Trava de segurança de 7 s:** depois de qualquer recarga (atualização ou o Android reabrindo o app), essa trava mostrava o **formulário de login** mesmo quando a sessão já tinha sido encontrada e o app só estava conferindo o acesso ou baixando os dados com internet lenta. Parecia desconexão. **Agora** o formulário só aparece se o Firebase disser que não há sessão. Travamento de verdade continua sendo tratado pelo vigia do `index.html` (tela "Reparar").
3. **O mesmo login avisado de novo** pelo Firebase refazia toda a entrada, passando pela tela de login. **Agora** isso é ignorado quando a conta já está carregada.
- **Limite:** não consigo reproduzir o Android matando o app em segundo plano. Nesse caso o app reabre do zero (comportamento do sistema), mas agora sem mostrar o formulário de login. **É preciso confirmar no celular** (roteiro, item 3).

### 1.3 Treino adicional não era salvo (item 7)
- **Causa:** com o treino já feito na semana, a tela mostrava "Treino concluído" **sem** o botão "Salvar treino", mas continuava deixando registrar séries. As séries ficavam soltas em `state.progress`: não entravam no histórico, nos totais, nas estatísticas nem no assistente.
- **Correção:**
  - o cartão explica como fazer o treino adicional;
  - com séries registradas hoje, aparece **"Salvar treino adicional"**;
  - o registro vai para o histórico com `adicional:true` e o nome "(adicional)", e conta nos totais e no assistente;
  - na adesão ao plano (`mtAdesao`) ele conta como **extra**, não como sessão do plano em dobro.

### 1.4 Treino feito aparecendo como não feito dois dias depois (item 8)
- **Causa** (simulação com relógio controlado, em dias seguidos):
  - o treino feito em **outro dia** da semana (antecipado) deixava o dia em que estava planejado como "faltou" (–) quando esse dia passava;
  - no próprio dia, o Início mostrava esse treino como "Treino de hoje" pendente, e a sugestão dizia "seu treino de hoje ainda está em aberto".
  - Fuso, datas e identificação da sessão estavam corretos: não havia perda de registro.
- **Correção:**
  - o quadro da semana conta o treino feito em outro dia para o dia planejado (só musculação, e o adicional não conta);
  - no Início aparece "Treino da semana feito (na terça, 24/11)";
  - o "próximo treino" ignora treino já feito na semana.

### 1.5 "Treinou 3 dias seguidos após relatar cansaço" (item 1)
- **Causa:** não era dado antigo, reset incompleto nem mistura de contas.
  - A régua de **esforço** do fim do treino (1–10) era convertida em "como terminou" (`rpeToFeel`): esforço 7–8 virava "cansado".
  - A conquista secreta exigia só 3 dias seguidos e **qualquer** treino do histórico com esse "cansado". Bastava marcar esforço 7 uma vez.
  - O cartão do treino concluído também mostrava o rótulo "Cansado".
- **Correção:**
  - o cartão mostra "Esforço 8/10 · Muito difícil";
  - relato de cansaço passa a ser só o que o aluno disse: "estou cansado(a)" ao assistente (`relatosCansaco`), disposição baixa ao acordar (sono) ou o "cansado/exausto" escolhido no registro antigo, sem a régua;
  - a conquista exige 3 dias seguidos **depois** do relato.
- O `feel` interno continua existindo para a auto-regulação de carga, que é sobre esforço.
- **Reset (Começar do zero):** conferido, apaga treinos, séries, recordes, conquistas, `lightMode` e a conversa, e a marca `zeradoEm` impede a volta pela nuvem. Nada a corrigir ali.

### 1.6 Mensagens do Meta Assistente fora de hora (itens 2 e 3)
- **Item 2:** "Se notar queda de força hoje, priorize uma boa execução em vez de aumentar a carga" (`fatigueInsight`) é conselho de **antes** do treino, mas aparecia também depois. **Agora**, com o treino do dia feito:
  - se o grupo trabalhado hoje está carregado → "Treino de hoje concluído… recuperação: proteína, hidratação, sono; ~48 h antes de treinar esse grupo pesado de novo";
  - se a carga vem de um treino anterior → orientação para o próximo treino.
- **Item 3:** "8 recordes pessoais nas últimas duas semanas" + "Ver minhas cargas" aparecia no primeiro treino (cada 1º registro contava como recorde) e a análise de cargas respondia "ainda não tenho séries suficientes" (ela precisa de 3 sessões do mesmo exercício). **Agora:**
  - o número conta só recordes de verdade;
  - o botão só aparece quando a análise tem dados;
  - os atalhos do assistente sem resposta útil não aparecem: "Minhas cargas estagnaram?" sem dados, "Análise da corrida" sem corrida e "Plano de retomada" sem pausa. A pergunta digitada continua sendo respondida.

### 1.7 "Não vou treinar hoje" (item 20)
- **Causa:**
  - o botão aparecia também em dia **sem** treino (a tela mostra o treino A ou o próximo treino) e gravava o pulo com o dia **do plano** daquele treino, não o dia em que a pessoa decidiu descansar;
  - a comparação "mesmo treino **ou** mesmo dia da semana" marcava como pulado outro treino do mesmo dia;
  - no quadro da semana, o dia marcado como pulado podia não ser o dia do descanso.
- **Correção:**
  - o botão só aparece no treino do dia;
  - o pulo guarda o dia real (`dayIdx`), o dia do plano (`planDay`) e o treino (`k`);
  - a identificação é uma função só (`skipEDoTreino`);
  - o quadro da semana marca o **dia real** como "desc." (descanso escolhido ≠ falta).
- Pulos antigos continuam válidos: o dia real vem da data gravada.

### 1.8 Conquistas que nasceram das regras erradas (correção única)
- Os recordes são refeitos pelo motor novo (1.10) a partir das séries guardadas, em toda entrada (também deixa coerente depois de juntar cópias de dois aparelhos).
- **Uma vez**, saem as conquistas que não se sustentam:
  - "Primeiro PR", "5 PRs" e "20 PRs", conforme os recordes de verdade;
  - "Nem a Preguiça" sem relato de cansaço.
- Ficam em `conqRevogadas` e o `mesclaEstado` não as traz de volta de uma cópia antiga de outro aparelho. Se forem ganhas de verdade depois, voltam normalmente.
- **Impacto esperado na sua conta:** "Primeiro PR" e "5 PRs" (ganhas em 23/11, no primeiro treino) saem até haver recordes reais. Os "PR" nos exercícios viram "Ref.".

### 1.9 Dupla: conquistas, equipamentos e equipamento ocupado (itens 17, 18 e 19)
- **Conquistas que não apareciam no aparelho do outro:** a verificação só rodava quando o **próprio** aparelho salvava um treino. Os horários da outra pessoa chegavam pelo grupo (`famCache`), mas ninguém conferia de novo: quem treinou por último desbloqueava, o outro não. **Agora** a chegada de horários novos pelo grupo dispara a conferência (dupla e "Desafio juntos"). O critério é o mesmo nos dois aparelhos (horários que se cruzam por 15 min ou metade do treino mais curto).
- **Equipamentos repetidos:**
  - **causa:** havia dois catálogos. O cadastro, o Perfil e a troca de equipamento usavam `EQUIP_LISTA` (banco, barra, barrafixa, maquina…); a tela da dupla usava `MT_ESTACOES` (banco_supino, barra_livre, barra_fixa, maq_peito…). Os nomes eram diferentes para o mesmo aparelho e as respostas ficavam guardadas em dois lugares que podiam se contradizer;
  - **agora** a dupla mostra a **mesma lista** do cadastro e "tenho / não tenho" é uma resposta só: a lista do plano. Marcar 0 tira o equipamento do plano, e um plano pronto (academia etc.) que contradiga a resposta vira "personalizado". A dupla só acrescenta a quantidade (1 ou 2+). As estações continuam internas e derivam daqui;
  - as respostas antigas da dupla são migradas sozinhas, e o que é publicado para a outra pessoa continua no formato antigo (compatível com o app dela, se não atualizar);
  - os equipamentos personalizados continuam funcionando.
- **Equipamento ocupado e pendências:**
  - a troca "só neste treino" substituía o exercício no plano, que era **publicado** para a outra pessoa e entrava nas pendências. O candidato da troca também podia usar um aparelho marcado como "não tenho". Agora a dupla e as pendências olham o exercício **planejado** (`_exPlano`), e a troca não oferece aparelho que a pessoa não tem;
  - "pendência" com os dois tendo o mesmo equipamento: a regra contava como disputa qualquer uso do mesmo aparelho de unidade única no mesmo dia, mesmo um no começo e o outro no fim do treino. Agora só conta quando os dois precisam dele **na mesma fase do treino** (posição parecida);
  - com a verificação da dupla desligada, não existe pendência de disputa. A linha em Treinos separa "aparelho disputado com X" de "exercício usa aparelho que você não tem";
  - os planos continuam individuais: nada força os dois a fazerem os mesmos exercícios.

### 1.10 Recordes pessoais (item 16) — feito aqui porque o item 3 e as conquistas dependem dele
- **Motor único** (`mtPrRecalcularEx`, `mtPrAvaliaSessao`, `mtPrsReais`, `mtPrTotal`, no app.js). Todos os lugares passaram a usá-lo: registro, edição/exclusão, importação, Início, desafios, PDF, calendário e conquistas.
- O 1º registro é a **referência** (`ref:true`, etiqueta "Ref.").
- Recorde = a melhor série da sessão supera a melhor de **antes** da sessão. As séries da mesma sessão não competem entre si: 21 kg e depois 27 kg no primeiro treino = referência de 27 kg.
- Exemplo pedido: 20 → 20 (não é PR) → 22 (PR) → 21 (não é PR). Coberto pelos testes.
- **Métricas:** carga (empate na carga → mais repetições); peso do corpo (mais repetições, empate → mais carga extra); isométrico (mais segundos). "Maior carga" e "mais repetições com a mesma carga" ficam cobertos pela regra de desempate.

## 2. Etapa 2 — cálculos, registros e experiência de treino

### 2.1 PDF com todas as séries em 27 kg (item 13)
- **Causa:** o relatório **não tinha** as séries. A tabela "Evolução de carga" mostra a **maior carga de cada sessão** nas colunas "Primeira / Última / Melhor". Com uma sessão só (21, 27, 27 kg), as três mostravam 27 kg e eram lidas como "série 1, 2 e 3". O app ("Detalhes do treino") e o histórico estavam certos (conferido nas suas imagens e nos testes). O card de compartilhar não mostra séries.
- **Correção:**
  - colunas renomeadas: "Maior na 1ª sessão", "Maior na última" e "Recorde", com uma nota explicando;
  - seção nova **"Séries registradas"**, com cada sessão série por série: "1ª: 21 kg × 15 · 2ª: 27 kg × 15 · 3ª: 27 kg × 15";
  - a tabela do PDF ganhou quebra de linha, então as séries não são cortadas.

### 2.2 Volume de carga e "4,2 toneladas levantadas" (item 14)
- **A conta estava certa:** a soma de carga × repetições das séries registradas deu 4.158 kg no seu treino. O problema era a apresentação como número principal do card, sem dizer o que é.
- **Motor único** `mtVolumeEntradas`:
  - soma a carga **registrada** × repetições;
  - halteres e unilaterais **não** são dobrados (o app não sabe se o número é de um halter ou dos dois e não inventa);
  - o peso do corpo nunca entra;
  - a carga extra entra separada (`kgExtra`);
  - exercício por tempo fica fora;
  - série sem repetições é ignorada;
  - séries, repetições e exercícios são contados à parte.
- **Card de musculação:** séries concluídas (número principal), duração, exercícios, repetições e maior carga. O volume continua como métrica de evolução (Progresso e PDF: "volume (carga × repetições)").

### 2.3 Compartilhamento da semana (item 12)
- **Causa:** o card juntava "2 treinos · 6,1 km · 3h03" com **uma data** (a de hoje) e parecia uma sessão só.
- **Agora:**
  - o período aparece no lugar da data ("Semana de 23 a 29 de nov");
  - a lista mostra cada atividade com o seu dia ("Seg 23 · Musculação · Treino A · 52 min");
  - os totais dizem "Tempo total" e "Distância total";
  - o adicional aparece como "(adicional)".

### 2.4 Onde registrar e importação do relógio (itens 4, 5 e 6)
- O registro saiu do topo de Treinos.
- **Com plano de corrida:** o registro fica embaixo, no treino do dia. A tela de registro (`openRunLog`) ganhou "Importar do relógio", que antes só existia no botão de cima.
- **Sem plano de corrida:** o Início tem "Registrar atividade" (caminhada, corrida ou bike avulsa, à mão ou por arquivo).
- **Musculação:** sem importação em lugar nenhum. Saíram o atalho "Importar do relógio" de Treinos, o atalho do Histórico e a menção a musculação na tela de integrações. A importação de corrida, caminhada e bike não mudou.
- Treino de corrida já feito na semana: o cartão agora mantém "Registrar outra atividade" (antes ficava sem botão).

### 2.5 Cronômetro dos exercícios por tempo (item 9)
- Botão ▶ em cada série → contando (com o alvo do plano e uma barra) → Pausar/Retomar → **Concluir série**, que grava o tempo real contado e marca a série. "Descartar" não grava nada.
- A conta usa o horário de início, então fica certa com a tela bloqueada ou o app em segundo plano. O aviso de "alvo atingido" aparece quando o app volta, porque o navegador não roda código com a tela bloqueada.
- **Interrupção:** fechar o registro no meio, ou o app ser fechado ou reiniciado, = contagem interrompida. Nada é gravado e o app avisa. Uma série nunca aparece como concluída sem o toque em Concluir.
- A tela fica ligada durante a contagem (Wake Lock, quando o aparelho permite).

### 2.6 Carga extra (item 10)
- O link discreto virou o botão **"+ Usei carga extra"** (colete, anilha, halter). Abre a coluna "CARGA EXTRA (kg)" com uma explicação.
- Nos cálculos, a carga extra entra no volume (separada) e nos recordes de peso do corpo (desempate); o peso do corpo não entra.
- **"Ocultar"** grava `prefs.ocultarCargaExtra` **na conta** (vale em todos os aparelhos daquela conta e não passa para outra). Para mostrar de novo: Perfil › Treino.

### 2.7 Duração (item 11)
- Uma função para o app inteiro (`fmtDur`): "52 min", "36 min 20 s", "3 h 03 min". Nunca horas decimais.
- Unificados: cartão do dia, histórico, resumos da semana e do mês, card de compartilhar, PDF, importações e comparações do assistente (antes havia "3h03m", "3h03", "183 min" e "3.1h" para a mesma duração).

### 2.8 Conquistas: alinhamento (item 15) — o módulo inteiro
- **Causa:**
  - cada cartão tinha a altura do próprio texto;
  - o selo Rara/Especial e a etiqueta "Nova" ficavam por cima do conteúdo;
  - nomes de 1 ou 2 linhas e descrições de 1 a 3 linhas desalinhavam medalha, nome, data e barra em cartões lado a lado;
  - os filtros eram cortados ("Em cu…", "Bloque…") em 360–412 px;
  - os contadores do topo ficavam espremidos.
- **Agora:**
  - espaço reservado para os selos;
  - nome com 2 linhas fixas e descrição com até 3;
  - data e barra presas ao pé do cartão;
  - cartões da mesma linha com a mesma altura;
  - filtros em 2×2 até 430 px, sem corte;
  - contadores com largura própria.
- **Conferido** automaticamente em 360 e 412 px: medalha, nome e altura iguais em todos os pares, sem rolagem lateral.

## 3. Etapa 3 — sono, água e refinamento

### 3.1 Sono (item 23)
Aproveita a parte 76 (RC 2), sem dependência nova.
- **Registro:**
  - horário de dormir e de acordar como forma principal, com o total **exato** em minutos calculado na hora (antes arredondava para 0,1 h: 7 h 15 virava 7 h 18);
  - ou só o total;
  - qualidade em 5 níveis (Péssima → Ótima);
  - disposição ao acordar em 5 níveis (Muito baixa → Ótima);
  - tudo opcional. Só um horário fica guardado sem total inventado.
- **Tela:**
  - gráfico de 7, 30 ou 90 noites, com cor pela qualidade e linha da média de 7 dias;
  - médias por semana (4) e por mês (3), com noites ruins;
  - regularidade: média e variação do horário de dormir e de acordar, e a tendência (2 semanas × 2 anteriores);
  - **sono × treinos:** esforço médio dos treinos depois de noite boa × noite ruim. Só aparece com 3 ou mais de cada e o texto diz que é associação, não causa;
  - explicação sobre relógio (abaixo).
- **Recuperação:** as regras da RC 2 continuam. Uma noite só nunca muda o treino; tendências orientam; a corrida não avança em semana de sono ruim. Disposição "muito baixa/baixa" conta como "acordei cansado".
- **Integração com relógio — avaliada e não feita:** o MetaTreino é um PWA. O navegador não tem acesso ao Health Connect, ao Apple Saúde nem ao Zepp, e os arquivos de atividade (GPX/TCX/FIT) não trazem o sono. Seria preciso um app nativo, que também quebraria o login com Google (o mesmo motivo do APK usar o Chrome).

### 3.2 Água → Alimentação; Sono no Início
- O atalho "Água" do Início virou **"Sono"**: última noite (horas e qualidade) e média de 7 dias, ou "Registre seu sono". Registrar uma noite liga o acompanhamento.
- Em **Alimentação**, a hidratação virou um bloco completo: meta, progresso, +250/+500, desfazer e "7 dias".
- Em "Personalizar início", o bloco "Água" saiu e o "Sono" cobre o atalho e a pergunta da manhã. A pergunta da manhã passou para 5 níveis.

### 3.3 Atividade da semana (bônus)
- **Problema do modelo antigo:**
  - o "% da meta" era a média de três anéis (41% com 3 de 5 treinos);
  - "treinos" contava qualquer atividade da semana (extra e adicional) contra os treinos do plano.
- **Novo:**
  - placar dos treinos **do plano** (mesma regra do resto do app, `mtAdesao`), com barra de progresso;
  - os 7 dias em colunas: feito, feito em outro dia, planejado, hoje, descanso escolhido, faltou (mesmas regras do quadro da semana);
  - legenda;
  - séries da semana (musculação), semanas seguidas na meta e extras à parte;
  - detalhe dia a dia ao tocar.
- Conferido nos temas escuro, claro, AMOLED e Areia, sem vazar da tela.

## 4. O que não foi possível resolver por completo

1. **Reinício pelo sistema (item 22):** corrigi o que o app fazia (recarga no meio do uso, formulário de login na restauração, entrada refeita). Se o Android encerrar o app em segundo plano por memória ou economia de bateria, ele reabre do zero; isso é do sistema e não dá para impedir num PWA. Agora ele reabre sem mostrar o login. **Precisa ser confirmado no aparelho.**
2. **Sono pelo relógio:** inviável num PWA (3.1).
3. **Cronômetro com a tela bloqueada:** a contagem fica certa, mas o aviso de alvo atingido (vibração) só acontece com o app visível. É limitação do navegador, a mesma do descanso desde a RC 0.
4. **Halteres "um ou dois":** o volume usa o número registrado, sem dobrar. Ninguém informa se a carga é de um halter ou dos dois, então o app não inventa. Ficou documentado no código e na explicação da carga extra.
5. **Conquistas da dupla com o outro aparelho numa versão antiga:** a conferência nova roda no aparelho que **recebe**. Para funcionar nos dois sentidos, os dois precisam estar na RC 3.

## 5. Testes

### 5.1 Automatizados (navegador Chromium sem tela, Firebase simulado)
- **Novo: `testes/rc3.py` — 99 verificações, 0 falhas.** Usa o relógio controlado (`page.clock`) para simular dias seguidos, cronômetro e a passagem de 2 dias.
  - Etapa 1 (44): contas no mesmo aparelho, login, treino adicional, dois dias depois, recordes, esforço × cansaço, correção única, assistente, descanso, dupla e equipamentos.
  - Etapa 2 (32): volume com dados conhecidos, cards, duração, PDF com o texto real do documento (21/27/27 kg), onde registrar, cronômetro (contar, pausar, concluir, descartar, interromper), carga extra e conquistas em 360/412 px.
  - Etapa 3 (23): sono completo, incompleto, só um horário, passar da meia-noite, 40 noites de histórico, gráficos e análise, uma noite ruim sem mudar o plano, água em Alimentação e Atividade da semana (temas).
- **Regressão — todos os testes das versões anteriores, nesta versão e na RC 2 original (para separar o que é ambiente do que é mudança):**
  - iguais à RC 2: beta37, 39, 41–44, 46, 48–54, 59–61, 63, rc0, rc1, acabamento, acessibilidade, compartilhar, cronometro e serie-descanso, além de todos os testes em Node (regras 61, sincronização 18, semana-menos-tempo 34, auditoria da musculação, simulação da corrida, troca sem repetir 36.296 e corrida com tempo-limite 104.320). beta40: 128 ok;
  - **ajustados porque o comportamento mudou de propósito** (o teste antigo cobrava o comportamento que você pediu para mudar):
    - beta38: o tema da conta vale;
    - beta39: conversa com chave por conta;
    - beta40: sair recarrega a página;
    - beta55: registro fora do topo de Treinos;
    - beta58: filtros 2×2 sem corte;
    - beta64: equipamento na lista única;
    - rc2: sono em 5 níveis e minutos exatos.
    Todos passam;
  - falhas que **já existiam na RC 2 original**, no mesmo ponto: `registro-series.py` "prancha: só tempo" (os dados de exemplo dão carga à prancha); beta38/41/42 "sem erros de JavaScript" (a fonte do Google não carrega neste ambiente sem internet). Utilitários que pedem outros argumentos (atualizacao, fit_com_rpe, videos-creditos) não são suítes.
- **Varredura visual** (`navegador.py`: todas as abas, janelas principais, 8 temas, 360/390 px e computador): 0 páginas mais largas que a tela, 0 janelas com falha, 0 IDs repetidos, 0 textos com contraste abaixo do WCAG AA. Mesmo resultado da RC 2. Os únicos "erros" são a fonte do Google que não carrega neste ambiente sem internet.

### 5.2 Simulados (não são testes em aparelho)
- Duas contas no mesmo navegador (mesmo armazenamento local).
- Firebase avisando o mesmo login de novo.
- Versão nova pronta com o app visível, oculto e oculto com série aberta.
- Duas pessoas no grupo (horários publicados pela outra pessoa).
- Relógio do aparelho avançando 1, 2 e 4 dias, e 32 s, 40 s e 3 s no cronômetro.

### 5.3 Em aparelho real
**Não foram feitos.** Não tenho acesso a celulares nem à sua conta. O roteiro está em `ROTEIRO-DE-TESTES.md`, seção "2027 RC 3", em 16 passos. Os itens que mais dependem do aparelho:
- 3 — o app ficar aberto sem reiniciar;
- 7 — cronômetro com a tela bloqueada;
- 13 — conquista em dupla nos dois celulares.

## 6. Arquivos alterados
- **Novos:**
  - `fonte/app-plus/79-rc3-contas-estabilidade.js`;
  - `fonte/app-plus/80-rc3-calculos-registro.js`;
  - `fonte/app-plus/81-rc3-sono-agua-semana.js`;
  - `testes/rc3.py`;
  - `RELATORIO-RC3.md`.
- **`app.js`:**
  - conversa por conta;
  - saída com recarga;
  - login estável;
  - recordes (motor único);
  - esforço no cartão do treino concluído;
  - "Nem a Preguiça";
  - `relatosCansaco` no `maTired`;
  - treino adicional;
  - treino feito em outro dia (semana e Início);
  - pulo de treino;
  - mensagem pós-treino;
  - atalhos do assistente;
  - `fmtDur`;
  - carga extra;
  - `conqRevogadas` no `mesclaEstado`.
- **Partes:**
  - 05: placar de recordes, "Ver minhas cargas", treino adicional como extra, próximo treino;
  - 06: atualização só em segundo plano;
  - 14 e 04: recordes reais;
  - 15: PDF;
  - 26: card da semana;
  - 35: chave da conversa;
  - 41: troca respeita o equipamento;
  - 48 e 56: pulo;
  - 57: musculação sem importação, duração, recordes;
  - 65: catálogo único de equipamentos e dupla;
  - 76: total do sono em minutos.
- **Outros:**
  - `index.html`: botão do topo de Treinos removido e versão;
  - `service-worker.js`: versão;
  - `testes/mock-firebase.js`: `__reemitir` para o teste de login;
  - testes beta38/39/40/55/58/64 e rc2 ajustados (5.1);
  - `MAPA-DO-CODIGO.md`, `NOTAS-DA-VERSAO.md` e `ROTEIRO-DE-TESTES.md`.

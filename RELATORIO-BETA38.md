# Relatório técnico — MetaTreino 2027.1 Beta 38

Base: Beta 37. Foco: primeiro acesso (cadastro, tema, equipamentos, Calistenia/Híbrido, Meta Assistente, "Começar do zero"), com as correções encontradas no caminho. Regras do Firestore, coleções e permissões: **sem mudança**.

## 1. Problemas encontrados (causa)

| # | Problema | Causa |
|---|---|---|
| 1 | Pelo Meta Assistente dava para abrir o Desafio do mês antes de terminar o cadastro | `goTab` não conferia se o cadastro estava pronto; o assistente (`openAssistant`, `maAsk`, `maTryCommand`) também não. O botão do assistente nunca era escondido fora das abas (ficava no questionário e no login). |
| 2 | "Começar do zero" podia ser desfeito | A cópia antiga de outro aparelho (ou do cache) era mesclada de volta e devolvia histórico e plano. |
| 3 | Equipamentos de "Escolher meus equipamentos" não chegavam ao plano | `finishSetup` nunca gravava `setup.equipList`; o gerador recebia lista vazia e só usava peso do corpo. As trocas fixadas (`applyPins`) também descartavam aparelhos no modo personalizado. A lista na tela não refletia os toques quando havia lista salva. |
| 4 | Híbrido: duas perguntas de objetivo e duas "durações" que se contradiziam | A tela mostrava o objetivo da musculação e o da calistenia; o texto do nível estimava a duração pelo nível ("~34-49 min") enquanto o aluno escolhia 60 min. Os dias de academia do Híbrido não respeitavam o tempo por sessão. |
| 5 | Cadastro numa tela só, com emojis | Todas as perguntas na mesma página; opções e lista de equipamentos com emoji (no modo "Emojis coloridos" eles apareciam todos). |
| 6 | Tema só no aparelho, sem escolha no início | O tema ficava só no `localStorage`; abrir o app já gravava o tema padrão, então não dava para saber se o aparelho tinha escolhido algum. |
| 7 | IMC "NaN" e "Primeiro registro feito" sem pesagem (Perfil, conta recomeçada) | Divisão sem altura; texto não conferia se havia pesagem. |
| 8 | Plano recém-criado avisava "Semana nova: troquei os acessórios…" | `state.lastVarWeek` vazio no plano novo → o primeiro Início girava os acessórios do plano que acabou de nascer. |
| 9 | Ouvintes repetidos na troca de modalidade | A parte 09 somava um ouvinte a cada abertura da tela de montar plano. |

## 2. O que foi feito

**Controle de acesso (parte 33).** `cadastroPronto()` = questionário respondido e pelo menos um plano. Antes disso:
- `goTab` não sai do cadastro (fica na etapa atual ou volta para ela);
- `showScreen` de uma aba volta para o cadastro;
- `openAssistant` mostra só um aviso; `maAsk`, `maAskText` e `maTryCommand` respondem com o aviso e não executam nada;
- o botão e o balão do assistente ficam escondidos fora das abas do app (cadastro, login, painel ADM).

Livres antes do cadastro: tema, Painel ADM (admin) e sair.

**Cadastro em etapas (parte 33 + `data-wz` no index.html).** São as mesmas telas e os mesmos campos; cada `.field` diz a sua etapa. Questionário: Boas-vindas/Tema, Sobre você, Corpo e rotina, Objetivo. Escolha do módulo. Musculação: Modalidade e objetivo, Equipamentos, Sua semana, Experiência, Revisão. Corrida: Objetivo, Experiência, Sua semana, Cuidados e preferências, Revisão.
- Progresso ("Etapa X de 10" no primeiro acesso; "X de 5" quando um aluno pronto recria o plano).
- Voltar e Continuar fixos no rodapé; as respostas ficam na tela ao voltar.
- Validação por etapa com as **mesmas** regras do salvamento: `quizErro()` e `setupErroDias()`, novas no app.js e usadas também por `saveQuiz`/`finishSetup`.
- Revisão com "Alterar" por grupo; "Alterar" nos dados do questionário volta direto para a revisão.
- Quem cria o perfil e o plano continua sendo `saveQuiz()` e `finishSetup()`.

**Sem pergunta repetida.** O objetivo do plano vem do objetivo principal e aparece recolhido com "Alterar" (só no primeiro plano). No Híbrido, um objetivo só: o da calistenia vale para os dias de academia (`caliLerSetup` converte).

**Tempo x nível.** No Híbrido o texto do nível não estima duração ("A duração segue o seu tempo por sessão: até X min"). Os dias de academia param no tempo escolhido + 5 min (`buildLiftExercises` tira acessórios, nunca o principal); os de calistenia já paravam (`caliMontarSessao`). Rótulos: "Experiência na musculação", "Equipamentos para a calistenia / para os dias de academia". Teste rápido e limitações passaram para a etapa Experiência (`#cali-setup-2`).

**Tema.** A 1ª etapa mostra os 8 temas com prévia real (cada miniatura tem `data-theme` e usa as variáveis do próprio tema). Areia aparece como "Sugerido", sem ser marcado. Como a escolha é guardada:
- `setTheme` grava no aparelho e em `state.prefs.tema` (vai junto para a nuvem).
- `applyTheme(t, true)` aplica sem gravar; é o que roda ao abrir o app.
- No login, se o aparelho nunca escolheu tema, vale o da conta. Aparelho com tema próprio não é sobrescrito.

**Ícones e desenhos.** Opções com ícones de traço (`CAD_ICO`). Os 18 aparelhos de `EQUIP_LISTA` (a lista não mudou) têm desenho próprio (`EQUIP_ICO`), com caixa de seleção de verdade (`role=checkbox`, Espaço/Enter). A tela "Montando…" usa ícones de traço e as cores do tema.

Desenhos por etapa no sistema da parte 22, na faixa do topo, acima da barra de progresso:
- boas-vindas: silhueta em movimento;
- objetivo: alvo;
- semana: calendário e relógio;
- experiência: degraus;
- revisão: ficha.

Equipamentos e dados pessoais ficam sem desenho. Na corrida, todas as etapas usam um mapa ilustrativo (curvas de nível, percurso, pontos de passagem, chegada) cujo trecho colorido avança a cada etapa; não é mapa real e não mostra distância.

**Começar do zero.** O que é apagado não mudou (treinos, séries, recordes, conquistas, pesagens, arquivo anual, questionário). O que mudou:
- A confirmação lista o que é apagado e o que fica, e indica "Recriar plano" para quem só quer trocar de plano.
- As preferências do app passam a ficar: `prefs`, `inicioOcultos`, `inicioOrdem`, `inicioOrdemInd`, `inicioEnxuto` (o tema já ficava no aparelho).
- `zeradoEm` impede que uma cópia anterior ao recomeço devolva dados; o que foi registrado depois do recomeço em outro aparelho entra normalmente.
- Os formulários voltam ao estado original (`cadastroRecomecar`), inclusive ao sair da conta. Assim, nada da configuração anterior (ou de outra conta no mesmo aparelho) interfere.

## 3. Arquivos alterados

- `app.js`: `quizErro`/`QUIZ_CAMPOS` e `saveQuiz`; `setupErroDias` e `finishSetup` (dias, `equipList`, `lastVarWeek`); `applyPins` (modo personalizado); `EQUIP_LISTA` sem emoji e `renderEquipChecklist`; `atualizaContagemEquip`; `updateLevelHint` (Híbrido); `bldIcone` e `runBuildingScreen` (ícones e tema); `doRestart` (texto, preferências, `zeradoEm`); `mesclaEstado` (`zeradoEm`); `applyTheme(t, naoGuardar)`; `calcIMC`; texto da evolução no Perfil; `buildLiftExercises` (teto de tempo do Híbrido).
- `index.html`: telas do questionário, escolha do módulo e montar plano (etapas `data-wz`, ícones `data-ico`, sem emoji, bloco `#cali-setup-2`, revisão); CSS "Beta 38" no fim do `<style>`.
- `fonte/app-plus/33-cadastro-em-etapas.js`: **novo**.
- `fonte/app-plus/09-calistenia.js`: objetivo único e rótulos do Híbrido, ouvinte único.
- `fonte/app-plus/11-corrida.js`: aviso da prova sem emoji.
- `app-plus.js`, `service-worker.js`: gerados/versão (Beta 38).
- `testes/beta38.py` (novo), `testes/sincronizacao.js` (+3 casos de recomeço).
- Documentos: `NOTAS-DA-VERSAO.md`, `ROTEIRO-DE-TESTES.md`, `MAPA-DO-CODIGO.md`, este relatório.

## 4. Efeitos para quem já usa o app

- Contas prontas: nada muda ao abrir (mesmo plano, histórico e tema).
- Quem recriar um plano Híbrido passa a ter um objetivo só; o da musculação vem do objetivo da calistenia.
- Quem tem plano com "Escolher meus equipamentos": o plano atual continua como está (com lista vazia salva). Ao recriar e marcar os aparelhos, o plano passa a usá-los.

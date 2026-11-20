# Relatório — MetaTreino 2027.1 Beta 58

**Regras do Firestore:** não mudaram, não precisa publicar.
**Coleções novas:** nenhuma.
**Campo novo no documento do próprio aluno:** `impHashes`, explicado na seção 4.

## 1. Problemas encontrados e causa de cada um

| # | Problema | Causa real |
|---|---|---|
| 1 | "PAUSA CURTA — 17 dias sem treinar" numa conta nova, com o primeiro treino daqui a 3 dias | O cartão do Início (parte 05) usava a última atividade de **qualquer** modalidade (`mtHist`). Um treino de força **importado** de 17 dias atrás contava como "último treino". O cartão não sabia que o plano ainda não tinha começado nem se algum treino agendado tinha passado. A parte 10 só trocava o título "Retomada" por "Pausa curta". |
| 2 | "A Volta por Cima" numa conta nova | Em `app.js`, a conquista olhava só o intervalo entre os dois últimos dias com atividade, de qualquer modalidade e sem exigir rotina antes. Um arquivo antigo importado + o primeiro treino já bastavam. |
| 3 | "Voltou a treinar depois de N dias" no calendário | Mesma regra global (parte 14). |
| 4 | Aviso do Meta Assistente e resposta "Plano de retomada" para quem nunca treinou no app | Mesmo `diasSem` global (partes 05 e 10). |
| 5 | Registros de importação que não abriam nem apagavam (vídeo) | No "Histórico técnico", só as linhas cuja atividade ainda existia viravam botão. Cancelado, erro, duplicata evitada, atividade excluída e atividade arquivada eram um `<div>` sem toque, e não havia função para remover um registro. Além disso, `openAtividade` esperava a leitura do aparelho (IndexedDB) **antes** de desenhar a tela, e uma leitura presa ou um ponto vazio no percurso/gráfico deixava o toque sem resposta, sem nenhum aviso. Com dados sintéticos não reproduzi a falha da atividade em si; as duas causas foram tratadas. |
| 6 | O registro técnico nunca vencia | Guardava os últimos 30 envios, sem prazo. |
| 7 | Reimportar um arquivo de mais de 90 dias duplicava | `atvDuplicata` olha só o histórico recente; o que foi para o arquivo anual "sumia" da conferência. |
| 8 | Cardápio e lista de compras no mesmo PDF | O botão da lista de compras chamava `pdfAlimentacao()`, e o próprio cardápio embutia a lista (`nutriPdfCompras`). O PDF da casa também (partes 49 e 55). |
| 9 | Maçã de cor estranha, legumes de desenho, boneco de palito | Ilustrações em SVG próprio do cabeçalho (parte 40) e uma marca d'água grande. |
| 10 | PDF de treino pouco hierárquico | Tabela de 8 colunas estreitas, com o grupo muscular disputando espaço com o nome do exercício. |
| 11 | Calendário com itens demais no dia | Cada conquista, cada recorde e cada carga virava uma linha; nada ficava recolhido. Um "recorde" podia ser só o primeiro registro do exercício. |
| 12 | No "Treino de hoje", o mapa abria a ficha de músculos fora do treino | `mmSel` não considerava o modo. |
| 13 | Detalhe do treino com uma única linha "3× · 30kg×10", quebrando mal | O histórico guarda só o resumo (`exercisesDone.best`). As séries reais estão em `state.progress` e não eram mostradas. |
| 14 | "Começar do zero" tirava a pessoa da Alimentação da casa | `doRestart` recriava o `state` inteiro, e o vínculo (`state.nutri.familia`) ia junto. O outro membro continuava vendo a pessoa no grupo. |
| 15 | Botões em várias linhas em telas pequenas | Atalhos de Treinos (2 linhas), ações do exercício (até 4 linhas em 320 px), filtros de Conquistas com rótulos longos e o atalho "Tem o treino no relógio?". |

## 2. Arquivos e funções alterados

- **`app.js`**
  - Conquista `comeback`: passou a usar `mtVoltaReal(10)`.
  - `doRestart`: mantém `nutri.familia`, e o texto de confirmação diz isso.
- **`fonte/app-plus/05`**
  - Novo cartão "Primeiros passos" para plano futuro.
  - O cartão "Retomada" e os avisos `retorno_*` só aparecem com `pausaReal`.
  - Sem cobrança de frequência na 1ª semana.
  - `analiseRetomada` explica que é começo.
- **`10`**
  - `_retBase` conta **dias distintos**.
  - Resposta "Plano de retomada" para plano futuro e para quem não tem rotina.
- **`14`**: destaque "volta" via `mtVoltaNoDia`; recorde só com registro anterior; vários recordes numa linha; conquistas e "Ver mais" recolhidos em `_dnRender`.
- **`40`**: o cardápio não inclui a lista de compras.
- **`42`**: filtros "Todas · Ganhas · Em curso · Bloqueadas".
- **`49` / `55`**: o PDF da casa virou "Cardápio da casa", sem a lista; textos dos botões.
- **`53` / `54`**: nome "Mapa muscular".
- **Novo `61-auditoria-beta58.js`**
  - Pausa e volta: `mtPausaInfo`, `mtVoltaReal`, `mtVoltaNoDia` e o embrulho de `contextoAluno`.
  - Importações: `atvLocalLe` com tempo-limite, `atvPercursoSVG` e `atvGraficoSerie` seguros, `openAtividade` com erro visível.
  - Registro técnico: `mtLogPoda`, `mtLogVer`, `mtLogRemover`, `mtLogLimpar`.
  - Duplicatas: `impHashes` (`_mtGuardaHashes`, `atvDuplicata`, `mtImportarMesmoAssim`).
  - Interface: mapa restrito, série por série no histórico, ações do exercício (`mtExAcoes`) e CSS.
- **Novo `62-pdf-beta58.js`**
  - Cabeçalho: `pdfArteCab`.
  - Figura anatômica: `_pdfCorpoSVG`, `_pdfPapeisSemana`.
  - Plano de treino: `pdfMontarTreino`.
  - Lista de compras: `pdfMontarCompras`, `pdfListaCompras`; o botão da lista passa a chamar esta função.
- **Testes**
  - Novo `testes/beta58.py`, com 60 verificações.
  - `beta50` e `beta52`: ajustados ao comportamento pedido (mapa restrito no treino; lista em PDF próprio).

Nenhuma função foi duplicada. A pausa usa a mesma base da retomada de cargas (`_retBase`, `RET`), e os PDFs usam o mesmo `pdfDoc` e o mesmo desenho do Mapa muscular.

## 3. Melhorias implementadas

1. **Pausa e volta só com histórico de verdade.** A regra é por modalidade e exige rotina antes da pausa: 2+ dias com treino nas 6 semanas anteriores. Ela respeita a agenda: com plano, pelo menos um treino agendado tem que ter passado sem registro. Plano que ainda não começou não tem pausa. A conquista exige que a sessão que fecha a pausa seja de hoje, então um arquivo antigo importado hoje não conta.
2. **Importações.**
   - Todo registro técnico abre um detalhe com arquivo, data, situação e resultado, e tem "Abrir a atividade", "Remover este registro" e "Limpar registros".
   - A atividade importada sempre abre; se algo falhar, aparece o motivo e o botão Excluir.
3. **PDFs.**
   - Três documentos distintos: cardápio por dia e refeição; lista de compras por categoria, com caixinhas, total de itens, período e a parte de cada pessoa da casa; e treino.
   - O PDF de treino tem a figura frente/costas com os músculos da semana e as séries por músculo, e uma linha por exercício com a hierarquia nome → grupo, depois séries × repetições, descanso, última carga e espaço para anotar.
   - Cabeçalho discreto com ícone de linha fina e sem marca d'água.
4. **Calendário:** no máximo 4 destaques à vista; conquistas numa área própria, recolhida.
5. **Mapa muscular:** no treino, só os músculos do treino respondem e os outros ficam apagados, com uma dica para usar Explorar. Explorar mostra o corpo todo.
6. **Detalhe do treino:** cada série com a carga real (inclusive sem carga) e o volume do exercício. Registros antigos mostram o resumo.
7. **Casa:** o vínculo sobrevive ao "Começar do zero".
8. **Responsividade:**
   - atalhos de Treinos numa linha (ícone em cima);
   - ações do exercício: "Registrar" na linha de cima e "Como fazer · Trocar · Evolução" divididos por igual embaixo (em telas abaixo de 375 px os ícones somem para caber o texto);
   - filtros de Conquistas numa linha;
   - atalho do relógio em duas linhas.

**Já funcionava e foi conferido:**
- O registro por série aceita carga e repetições diferentes em cada série, e série sem carga.
- "+ Nova série" já sugere os valores da série anterior.
- Volume, relatórios e gráficos já somavam série por série (`state.progress[].sets`).

## 4. Regras de retenção

| Dado | Onde fica | Regra | Por quê |
|---|---|---|---|
| Atividades esportivas (manual e importada) | `modules.*.history` + arquivo anual (`usuarios/{uid}/arquivo`) | **Sem mudança:** 90 dias no app, o resto no Histórico completo. Nada é apagado. | São o histórico, a evolução e a origem das conquistas. |
| Registro técnico de importações (`importLog`) | documento do aluno | **30 dias** para qualquer resultado (sucesso, cancelado, erro, excluída), no máximo 30 itens; o aluno remove um a um ou tudo | É só diagnóstico do envio. Remover o registro **não** apaga a atividade. |
| Impressão digital das importações (`impHashes`, novo) | documento do aluno | Só das importações que saem para o arquivo anual: hash, chave, data, id e modalidade (~30 bytes cada, no máximo 400). Excluir a atividade libera a impressão digital. | É o mínimo para não duplicar uma atividade arquivada. Sem percurso, arquivo ou dados pessoais. |
| Marcas de "destaque removido" do calendário | documento do aluno | 365 dias | Dado técnico; as anotações escritas pelo aluno **não** são tocadas. |
| Registro alimentar (`nutriLog`) | documento do aluno | já era 30 dias (sem mudança) | — |
| Percurso GPS e arquivo original | só no aparelho (IndexedDB) | sem mudança; apagados ao excluir a atividade | Privacidade (locais). |

**Sobre "executar no servidor":** limpeza agendada no servidor (Cloud Functions com agendamento) exige o plano pago Blaze do Firebase. No plano gratuito ela não existe. Por isso a limpeza:

- atua **somente no próprio documento** do aluno, que o app já lê ao abrir, e grava **só se algo mudou**. Não há leitura extra nem permissão nova;
- **nunca toca** atividades, conquistas, recordes ou anotações;
- é limitada a dados técnicos com prazo fixo.

Uma rotina no servidor fica como decisão sua, se um dia o projeto for para o Blaze.

## 5. Testes executados e resultados

- **`testes/beta58.py`: 60 ok, 0 falhas.** Cobre os 17 cenários pedidos:
  1. conta nova;
  2. conta nova com treino futuro;
  3. conta antiga com musculação;
  4. conta antiga com corrida;
  5. importações antigas;
  6. histórico misto;
  7. casa pareada;
  8. reset mantendo o par;
  9. importação cancelada;
  10. importação excluída;
  11. importação concluída e arquivada;
  12. remoção de registro;
  13. cargas variadas por série;
  14. PDF do cardápio;
  15. PDF da lista de compras;
  16. PDF do treino;
  17. telas de 320, 360, 390, 430 e 1280 px e fonte em 125%.
- **Regressão sem falhas:**

  | Teste | Resultado |
  |---|---|
  | acessibilidade, beta37, beta38-temas, compartilhar, cronometro, navegador, serie-descanso | ok |
  | beta38 | 87 ok (passa rodando sozinho; em paralelo dava tempo esgotado, como já acontecia antes) |
  | beta39 | 94 ok |
  | beta40 | 128 ok |
  | beta41 | 72 ok |
  | beta42 | 12 ok |
  | beta43 | 78 ok |
  | beta44 | 51 ok |
  | beta46 | 29 ok |
  | beta48 | 56 ok |
  | beta49 | 39 ok |
  | beta50 | 40 ok |
  | beta51 | 18 ok |
  | beta52 | 20 ok |
  | beta53 | 14 ok |
  | beta54 | 38 ok |
  | beta55 | 45 ok |
  | registro-series | 23 ok |
  | casa-dois-celulares | 30 ok |

- **PDFs:** abri as páginas geradas e conferi a leitura e o layout dos três.

## 6. O que ainda precisa ser validado

- **Celular de verdade** (Android e iPhone, inclusive com fonte grande do sistema): o roteiro está em `ROTEIRO-DE-TESTES.md`, seção "Beta 58".
- **O arquivo real do vídeo** que não abria: não estava comigo. As duas causas prováveis foram tratadas, e qualquer falha restante agora aparece na tela com o motivo. Se acontecer, me mande o print desse aviso.
- **Impressão em papel** dos três PDFs.
- **Testes que não rodam neste ambiente:**
  - `atualizacao.py`: não troca de versão aqui nem com versões antigas, então é limitação do ambiente;
  - `dois-aparelhos.py` e `nuvem-simulada.py`: precisam de serviços externos bloqueados aqui.
- **Rotina de limpeza no servidor:** depende do plano Blaze (seção 4).

## 7. Riscos de regressão

- **Avisos de pausa mais raros:** quem treinava pouco antes da pausa (só 1 dia nas 6 semanas) não recebe mais retomada nem "Volta por Cima". Isso é intencional.
- **"Dias sem treinar" agora é da modalidade ativa:** quem só corre e abre a musculação não vê pausa da musculação.
- **"Começar do zero" mantém o grupo da casa:** quem quiser sair do grupo usa "Sair do grupo", como antes.
- **O PDF da casa não traz mais a lista somada:** ela está em "Lista de compras em PDF" (modo Casa toda).
- **Mapa no modo Treino/Exercício:** tocar fora do treino mostra uma dica em vez da ficha.
- **`impHashes`:** só bloqueia a reimportação de algo realmente arquivado. Se a pessoa tinha excluído essa atividade do Histórico completo, a prévia oferece "importar mesmo assim".

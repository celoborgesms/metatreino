# Mapa do código — MetaTreino

Guia para quem for mexer no app (você, outra IA ou outro desenvolvedor). Vale a partir da Beta 24.

## Arquivos publicados (raiz)

| Arquivo | O que é |
|---|---|
| `index.html` | Todas as telas (HTML) e todo o visual (CSS). O CSS vem em camadas: as regras de cada Beta ficam no fim do `<style>`, marcadas com `/* ===== Beta N ... */`. Uma regra mais abaixo vence a de cima. |
| `app.js` | O núcleo original: login, estado (`state`), salvar na nuvem, geração de planos, treinos, histórico, conquistas, Meta Assistente, painel ADM. |
| `app-plus.js` | **Não edite direto.** É montado a partir de `fonte/app-plus/` (veja abaixo). Estende o `app.js` sem reescrevê-lo. |
| `service-worker.js` | Funcionamento offline e atualização automática. A versão dele precisa ser igual à do app. |
| `jspdf.umd.min.js` | Gerador de PDF (jsPDF 2.5.2, licença MIT). Só é baixado quando alguém gera um relatório. |
| `firestore.rules` | Regras de segurança do Firestore. Publicar no Console do Firebase quando mudar. |
| `manifest.json`, `icon*.png/svg` | Instalação como app. |
| `fonte/` | Código-fonte do `app-plus.js` em partes + o script `montar.py`. Pode ficar no GitHub (não pesa para quem usa o app). |
| `functions/`, `firebase.json` | Beta 40: Cloud Function de exclusão de contas pelo painel (opcional; exige plano Blaze): `firebase deploy --only functions`. Não precisam ir para a hospedagem do site. |
| `testes/` | Testes automáticos (Beta 33). Não precisam ser publicados. Veja "Testes" abaixo. |

## Montar e trocar a versão

Na pasta do projeto:

```
python3 fonte/montar.py              # junta as partes no app-plus.js e confere sintaxe e versões
python3 fonte/montar.py --versao 33  # troca para "2027.1 Beta 33" em todos os lugares e monta
```

A versão aparece em 5 lugares (app.js, service-worker.js, index.html `?v=`, rodapé do Perfil e `MTP.versao`). Se ficarem diferentes, os celulares podem não atualizar sozinhos — o script avisa.

## As partes do app-plus (`fonte/app-plus/`)

Entram em ordem alfabética. **A ordem importa**: uma parte usa o que as anteriores definiram.

| Parte | Conteúdo |
|---|---|
| `00-base-utilitarios-ganchos.js` | `MTP`, `mtGancho` (ganchos), utilitários `mt*` (datas, histórico unificado, admin principal, escapes) |
| `01-icones.js` | Ícones de grupos musculares e medalhas |
| `02-biblioteca-ficha-player.js` | Biblioteca de exercícios, ficha técnica, player de vídeo |
| `03-fotos-navegacao-aparencia.js` | Fotos de evolução, navegação (Treinos, Progresso), temas e ícones |
| `04-desafios-tematicos.js` | Desafios temáticos do ano, missões, medalhas, participação |
| `05-home-inteligente-meta-assistente.js` | Sugestão inteligente da Home e respostas novas do Meta Assistente |
| `06-painel-adm-atualizacao.js` | Indicadores do painel, administradores e permissões, atualização automática |
| `07-videos-audio.js` | Áudio dos vídeos, vídeos indisponíveis/reportados |
| `08-home-alimentacao-graficos.js` | Carregamentos, seções recolhíveis da Home, alimentação, gráficos de Evolução (`mtChart`) |
| `09-calistenia.js` | Calistenia: progressões, modelos, painel |
| `10-estado-treino-feedback-conquista-especial.js` | Retomada, mensagens dos alunos, Conquista Especial animada, botões "recolher" |
| `11-corrida.js` | Corrida do iniciante ao avançado (níveis, VDOT, periodização, provas, painel, admin) |
| `12-prova-encerrar-plano.js` | Prova alvo removível, encerrar plano de musculação |
| `13-conquistas.js` | Detalhe animado das conquistas, Conquista Especial em duas etapas |
| `14-mural-notas-do-dia-temas.js` | Balão do assistente, mural/logo, destaques do dia no calendário |
| `15-arquivo-anual-pdf-seus-dados.js` | Arquivo anual (sem perder dados), histórico completo, relatório PDF, Seus dados, tamanho dos dados no ADM |
| `16-personalizar-inicio-computador.js` | Personalizar início, versão para computador |
| `17-desafios-resgate-limpeza-foto.js` | Aviso final e resgate de medalha, apagar dados de ex-alunos, foto mais leve |
| `18-perfil-em-grupos.js` | Perfil em grupos recolhíveis |
| `19-desempenho-historico.js` | Ordem do Desempenho, calendário e gráfico do Histórico recolhíveis |
| `20-alimentacao-rolagem.js` | Plano alimentar: mantém rolagem, refeição aberta e foco ao editar |
| `21-esforco-rpe.js` | Escala de esforço (RPE) nova — mesmas funções e valor salvo |
| `22-medalhas-fundos.js` | Medalhas (níveis comum/rara/especial) e fundos decorativos por aba |
| `23-janelas-cliques.js` | Fechar janelas (tocar fora com proteção, botão Voltar), janelas sem "Pronto", gráfico semanal do Histórico |
| `24-historico-paginas-desafios-futuros.js` | Paginação numerada do Histórico, detalhes dos desafios futuros |
| `25-treinos-desafios-progresso.js` | Andamento do treino, "o que falta" nos desafios, períodos no resumo, tela de preparo do plano |
| `26-central-compartilhamento.js` | Central de compartilhamento: dados do card (`mtsDe*`), desenho (`mtsDesenhar`), tela (`mtsAbrir`), ligação com os botões antigos |
| `27-treino-sem-repeticao-ficha.js` | Treinos sem exercício repetido (`treinoSemRepeticao`, correção única dos planos salvos), ficha do exercício em tela cheia |
| `28-inicio-cena-ordem.js` | Desenho do Início por horário, clima e datas (`cenaInicio`), selo do clima, ordem dos blocos do Início (`state.inicioOrdem`) |
| `29-modo-computador.js` | Modo computador: grade de duas colunas (`DK_LAYOUT`, `dkMontar`), faixa de números, painel lateral, atalhos |
| `30-auditoria-beta33.js` | Correção única das fichas salvas (`b33CorrigeFichas`, marca `state.b33Fichas`) |
| `31-sincronizacao-videos-parceiros.js` | Arquivo anual dos logins antigos, tela de Sincronização (`openSincronizacao`, `syncAgora`), parceiros e créditos dos vídeos (`openParceiros`, `pcProjecao`) |
| `32-acessibilidade.js` | Beta 35: nome (`aria-label`) para botões só com ícone, `role=button` + Tab + Enter/Espaço nos elementos com `onclick` (`a11yVarrer`, roda sozinho a cada mudança da tela) |
| `33-cadastro-em-etapas.js` | Beta 38: controle de acesso antes do cadastro (`cadastroPronto`, `irParaCadastro`; travas em `goTab`, `showScreen`, `openAssistant`, `maAsk`, `maAskText`, `maTryCommand`, `updateFabNudge`), cadastro em etapas (`WZ`, `wzIr`, `wzAvancar`, `wzVoltar`, `wzResumo`, `wzMostraCampo`; etapas marcadas no HTML com `data-wz`), tema na 1ª etapa (`wzRenderTemas`, tema também em `state.prefs.tema`), ícones do cadastro (`CAD_ICO`, `cadIco`, `[data-ico]`) e dos aparelhos (`EQUIP_ICO`, `equipIcone`), desenhos por etapa e mapa da corrida (`cadMapaArte`), formulários limpos ao recomeçar/sair (`cadastroRecomecar`) |

| `34-controles-por-gesto.js` | Beta 39: réguas por gesto para todo campo numérico, data e horário (`nrConfig` decide o tipo de cada campo; `nrRegua` é a régua; `nrAbrir` a folha). Campo vira `readonly` + `inputmode="none"`; o valor volta para o mesmo `<input>` com eventos `input`/`change`. Campo novo de número: entra sozinho (MutationObserver); limites próprios em `NR_CAMPOS`; `data-teclado` deixa um campo de fora |
| `35-evolucao-provas-assistente.js` | Beta 39: oferta de subir de nível (`evoLiftAvaliar`, `evoAtualizar`, `evoResponder`, `evoComando`; estado em `state.evolucao`), orientação de provas por marcos (`provaOrientacao`, `provaAviso`, `provaPosAviso`; vistos em `state.provaAvisos`), boas-vindas da jornada nova (`maBoasVindasTexto`, `state.maBoasVindas`) |

| `36-planos-gratuito-premium.js` | Beta 40: recursos por plano (`MT_RECURSOS`, `mtTem`, `mtPremium`, `mtPremiumAviso`, `openPlanos`), troca de plano (`mtPlanoVerifica`, `mtPlanoMudou`, `state.planoVisto`), temas (`TEMAS_GRATIS`, `temaLiberado`, Ametista e Coral, `state.prefs.temaPremium`), Início básico (`state.inicioBasico`), clima só no Premium, Meta Assistente por plano (`MA_KEYS_PREMIUM`), estilo dos ícones na conta (`state.prefs.icones`), Aparência com prévia real |
| `37-admin-planos-contas.js` | Beta 40: lista com todas as contas e o plano de cada uma, `admPremium`, `admEncerrar`, `admBloquear`, remover administrador (apaga o documento; o app da pessoa escuta e sai do painel), `admExcluirConta` (Cloud Function `adminExcluirConta` via `fnChamar`), `admExcluirSoDados`, registro (`admRegistrar`, `openAdminLog`) |
| `38-cadastro-correcoes.js` | Beta 40: peso com Cancelar, ícones no cadastro, IMC estimado, explicação só da opção escolhida (`WZ_EXPL`, `wzExplica`), objetivos da calistenia/híbrido, mensagem da data de início (`wzInicioMsg`), seletor próprio do tempo recente (`mcAbrir`, `mcConfirmar`) |
| `39-limitacoes-terreno.js` | Beta 40: limitações no gerador (`LIM_REGRAS`, `limAdapta`, `setup.lim`), aviso no treino, cardio sem impacto; terreno da corrida (embrulha `rComposicao` e `rSessao`) |
| `40-pdf-identidade.js` | Beta 40: PDFs com arte vetorial e cores do tema (`pdfCores`, `pdfArteCab`, `pdfArteMarca`, `pdfPrepArte`, `pdfDoc`), `pdfTreino`, `pdfAlimentacao`; o relatório (parte 15) usa a mesma arte |
| `41-substituicao-favoritos.js` | Beta 41: troca inteligente (`MT_PADROES`, `mtPadrao`, `mtEquipClasse`, `mtCandidatosTroca`, `mtCargaSugerida`), troca só da execução (`ex.troca`, `mtTrocasExpirar`, desfazer, salvar no plano via `pins`), histórico (`x.trocas`, `noLugarDe`), favoritos (`state.favoritos`, `mtFavAlternar`, filtro na Biblioteca, estrela na ficha e no cartão) |
| `42-conquistas-desafio-mensal.js` | Beta 41: fila de apresentação (`state.conqPend`/`conqVistas`, `showAwards` não abre janela), aba Conquistas nova (`openTrophies`, `cqTile`, `cqFiltrar`), resumo do mês (`state.monthly.snap`, `state.desafiosEncerrados`, `cqResumoMes`), selos parados nos pontos de entrada |
| `43-visual-transicoes-desempenho.js` | Beta 41: caches (`slug`, `mtFmtData`, `mtFmtKm`, `_bytesDe`), `_decoAgenda` em um quadro, transição de conteúdo das janelas e do tema, montagem do plano mais curta (`mb-pronto`, `mt-entra`), fundos decorativos novos (`DECO2_SVG`), classe `mt-toque` |
| `44-conta-acesso-backup.js` | Beta 42: verificação de e-mail (reload + token novo), vínculo Google × senha, teste Premium ao concluir o perfil, backup com dono + SHA-256, erros da montagem |
| `45-temas-carrossel-ilustracoes.js` | Beta 42: carrossel de temas, ilustrações de Histórico e Corrida |
| `46-diagnostico-acesso.js` | Beta 43: `mtLogAcesso` (falhas de acesso → `diagnosticoAcesso`, sem e-mail/UID, hash da conta, 1 registro a cada 10 min), painel "Diagnóstico de acesso" do principal, rótulo "Tentar novamente" |
| `47-lanches-fora-da-rotina.js` | Beta 43: receitas "Lanches para sair da rotina" — tabela `RC_ING` (TACO/rótulos), `RC_RECEITAS`, ajuste da porção à refeição (`rcEncaixe`), restrições (`rcRestricao`), favoritas (`state.nutri.receitasFav`), custo informado pelo aluno, registro no plano, ilustrações SVG |
| `48-fim-registro-descanso.js` | Beta 44: conquistas no fim do registro (`cqCelebrar`, janela de 2 min após salvar), ponto na aba Desafios, "não vou treinar hoje" no topo e pergunta antes de registrar, fichas técnicas corrigidas (`MT_FICHA_FIXA`) |
| `49-alimentacao-casa.js` | Beta 46, refeita na Beta 49: alimentação da casa. Administrador (`dono`, `famSouAdm`, `famPassarAdm`, `famRemoverMembro`), configuração (`config.refeicoes/dias/horas/economico/trocaPropria`), composição do prato da casa por data (`cardapio[dk][mid] = {x, add}`, `famTirarDaCasa`, acréscimo via `nutriEdSalvar`), prato comum e porção individual (`famPrato`, `nutriMontarPlano(dia, dkData)`), "fora da casa" só num dia (`state.nutri.famFora`), perfil publicado só na própria chave (`perfis[uid] = {veg,lac,glu,fatores,compras}`), lista individual/da casa (`nutriComprasTotais(escopo, 'eu'|'casa')`, `nutriQtdCompra`, `nutriNomeCompra`), PDF da casa (`pdfAlimentacaoCasa`) |
| `50-cupons-ajustes.js` | Beta 48: cupons de Premium e ajustes |
| `51-conquistas-progressao.js` | Beta 49: metas do mês por nível da modalidade (`cqEscalaBase`, `mkDesafio`), experiência anterior (`cqExpReconhece`, `state.trophyExp`), celebração agrupada (`cqAgrupar`, `CQ_FAMILIAS`, `CQ_PRIMEIRAS`, máximo 5 cartões), "Metas do mês" × "Medalhas de desafio" (`openMedals`), participação automática (`cqAutoParticipa`, `state.eventosRecusados`), desenho de boas-vindas do cadastro |
| `52-telas-sem-piscar.js` | Beta 49: `mtMesmaTela(nome, estaNaTela, sel, chave)` — redesenho da mesma tela sem a animação de abrir (`window.__mtMesmaTela`) e com o bloco visível no mesmo lugar (âncoras por área de rolagem); aplicado em `openNutri`, `openFamilia`, `nutriListaCompras`. CSS da tabela de planos (`.pl-tabela`) |
| `53-mapa-muscular.js` | Beta 50: anatomia muscular e orientações do treino. Desenho: `mmCorpoSVG(vista, sexo)` — atlas em SVG, `MM_TRONCO`/`MM_BRACO`/`MM_CABECA` (silhuetas, um caminho por parte), `MM_FRENTE`/`MM_COSTAS` (placas), `_mmFator`/`_mmWarp` (t = 0 masc., 1 fem., 0,5 neutro; nunca usa peso/altura), cache por vista×sexo. Dados: `MM_INFO` (nome, local, função, movimentos, cor), `mmMusculosDe(ex)` → `{prim, sec, est}` pelo EX_BANK, `mmExerciciosDoMusculo(k)`, `mmSeriesSemana()`. Orientações: `mmGuia(w)` (preparação/sessão/finalização pelos músculos, equipamento, duração e intervalos), cartão `mmRenderGuia` (gancho em `renderSessions`, depois de `.tr-anda`). Mapa único: `mmAbrir({modo:'hoje'|'semana'|'livre'|'ex', ex, volta})`, `mmVista`, `mmSel`, `mmToque` (toque com tolerância), entradas em Progresso (`mmRenderEntradaProgresso`, gancho em `renderPerf`) e na ficha do exercício (gancho em `openExerciseSheet`) |
| `54-progresso-personalizar.js` | Beta 51: Progresso › Desempenho. `PERF_BLOCOS` (chave, seletor, modalidade), ordem por CSS `order` (`perfAplica`, `#perf-css`), marcação dos cartões sem id por título (`_pfMarca`, `data-pb`) e dos recordes por modalidade (`data-pb-mod`), seletor `#perf-mod` (`perfModulo`), observação da tela (`_pfObserva`). "Personalizar progresso" (`openPersonalizarProgresso`, `pfAlterar`, `pfPreset`, `pfBasico`, `pfPadrao`); estado `progressoOcultos`, `progressoOrdem`, `progressoBasico`; Premium = `inicioCompleto`; arrasto reaproveita `_piArrasto` (parte 28) com `_piSalvaOrdem` estendido |
| `55-casa-ajustes-cardapio.js` | Beta 52: alimentos "fora da rotina" (`NUTRI_FORA`, `NUTRI_FORA_IDS`, categoria `fora`; fora do cardápio e das compras), +45 pratos (`NUTRI_PRATOS_B52`), opção do administrador `config.compensa` (`famAlternaCompensa`), aviso do dia (`#fam-ajuste-dia`), semana publicada no perfil (`famMinhaSemana` → `perfis[uid].semana`), PDF da casa por pessoa (`pdfMontarCasa`). Na parte 49: `famPrato` devolve `orig`, `k0orig`, `acrescentados`, `mudou`; `nutriMontarPlano` dá `recKcal`, `casaDelta` por refeição e `diaRec`, `casaDelta` no dia; `famAjusteNomes`/`famAjusteHTML` |
| `56-energia-do-dia.js` | Beta 53: `nutriDiaEnergia(diaIdx, dk, calc0)` → `{ kcal, gasto, base, ex, sessoes, tipo, treino }`; `enSessoesDoDia` (previsto × feito, pulos), `enSessaoKcal` (MET líquido / kcal por km), `MM_NEAT` 1,4; `nutriCalcular` estendido (média da semana pelo mesmo modelo, `modelo:'b53'`, `ajusteKcal`); `nutriMontarPlano` estendido (dicas por tipo de dia, `pl.energia`); quadro `#en-dia` na tela do plano. Usado pelo `nutriMontarPlano` do núcleo e da parte 49 (`calc.energia`) |
| `57-integracoes-atividades.js` | Beta 54: importação GPX/TCX/FIT. Leitura: `atvFormato` (assinatura), `atvLeGPX`/`atvLeTCX` (DOMParser), `atvLeFIT` (fit-file-parser, `fit-parser.min.js` carregado sob demanda por `atvCarregaFit`). Cálculo: `atvCalcula` (distância por GPS, tempo em movimento, FC, cadência, subida com histerese, parciais, melhores 1/5/10/21,1 km, série de ~80 pontos, validade para recordes, percurso simplificado). Musculação: `atvAgrupaSeries` + `ATV_CAT_EX` (categoria FIT → exercício). Duplicidade: `atvDuplicata` (hash SHA-256 do arquivo, chave da atividade, registro manual do mesmo dia). Tela: `openIntegracoes`, prévia `atvPrevia`, `atvConfirma` → **`atvSalvar(A, op)`** (porta de entrada única, também para integrações futuras; grava em `run.history`/`lift.history`/`state.progress` com `imp`). Local: IndexedDB `mt-atividades` (percurso e arquivo original). Detalhe/exclusão: `openAtividade`, `atvExcluir`. Ligações: selo e atalho no Histórico, atalho em `openActivityLog`, `openHistoryEntry`, recordes (gancho `renderRecords`), `checkRunEvolution` só com dados válidos, `_enFeitas`/`enSessaoKcal` (calorias do relógio), Cardio (`openCardio`, bloco `cardio` do Desempenho), Meta Assistente (`maAtividades`, `maInterpret`, sugestão). Histórico de importações em `state.importLog` |
| `58-auditoria-beta55.js` | Beta 55: `mtAtvRitmoImpossivel`/`mtAtvInvalida` (ritmo mais rápido que recorde mundial, bike > 75 km/h, ou `imp.valido===false`) — pergunta no `saveActivityLog`, bloqueia conquistas (`unlockTrophy` com `__mtSemConquista`), refaz recordes e o `checkRunEvolution`; resumo no detalhe da atividade manual (`openHistoryEntry`); Desafios: seção `#mt-novidades` (gancho `renderChallenges`), `mtNovAbre`, indicador numérico da aba (`cqIndicadores`, substitui o `#tab-dot-chal`); Progresso: subtítulo da modalidade (`mtPerfModInfo`), calendário só da modalidade ativa (`renderCalendar`); Treinos: atalho "Importar do relógio" na musculação (`mtTreinosAtalho`); Anatomia: "Seu histórico com este músculo" (`mmHistoricoMusculo`, `mmFicha`); CSS de responsividade (chips que quebram linha, calendário `minmax(0,1fr)`) |
| `59-substituicao-alimentos.js` | Beta 55: troca de alimento por equivalente. `subCandidatos(mid, fid, q)` (mesmo grupo de `NUTRI_CATEG`, refeição leve × prato, nutriente-chave `SUB_CHAVE`, tolerância de kcal e macros, restrições vegetariano/lactose/glúten, sem `NUTRI_FORA`), telas `subAbrir` → `subVer` → `subConfirmar`, `subDesfazer`. Grava só em `state.nutriLog[dia][refeição]`: original `adj[id]={x:1,sub}` e substituto `add[]={id,q,subDe}`; `nutriItemExtra` mostra "no lugar de…" |

| `60-visual-beta56.js` | Beta 56: `atvGraficoSerie` (um painel por medida, `_gfPainel`, ritmo suavizado `_gfSuave`), `atvPercursoSVG` (início/fim com nome, setas, marcas de km interpoladas, legenda), novo `DECO2_SVG.corrida`, contraste (`.pill.on` no Ametista) |
| `61-auditoria-beta58.js` | Beta 58: `mtPausaInfo(mk)`, `mtVoltaReal(min)` (conquista comeback), `mtVoltaNoDia` (calendário), `contextoAluno` ganha `planFuturo`/`semanaInicio`/`pausaReal`; importações robustas (`atvLocalLe` com tempo-limite, `openAtividade` com erro visível); registro técnico de 30 dias (`mtLogPoda`, `mtLogVer`, `mtLogRemover`); `state.impHashes` (duplicata depois do arquivo anual); mapa muscular restrito no treino; série por série no detalhe; CSS de telas pequenas. |
| `62-pdf-beta58.js` | Beta 58: cabeçalho discreto (`pdfArteCab` com ícone de linha, sem marca d'água), `pdfMontarTreino` (figura anatômica da semana via `mmCorpoSVG` + `_pdfCorpoSVG`, uma linha por exercício), `pdfListaCompras`/`pdfMontarCompras` (PDF próprio da lista; o botão da tela de compras chama este). |
| `63-modalidades-beta60.js` | Beta 60: `mtMetricas` filtrada pela modalidade ativa (freq/tempo por modalidade); bloco Calistenia só na musculação; (o "Personalizar treinos" da Beta 60 foi retirado na Beta 61); bloco "Como fazer o circuito" (objetivo Resistência). Parte 54: `_pfCfg()` = personalização do Progresso por modalidade (`state.progressoMod`, Beta 59). |
| `64-conquistas-revisao-beta61.js` | Beta 61: `mtRevisaConquistas()` — depois de excluir/editar um registro, recalcula e tira conquistas/desafios do mês ganhos nas últimas 48 h que deixaram de valer (só as recalculáveis por `checkTrophies`/`checkWeightTrophies`); limpa `conqPend` e `awardQueue`. Chamada por `deleteHistoryEntry`, edição do histórico e `atvExcluir`. |
| `65-motor-individual-dupla.js` | Beta 63: `MM_ENFASE` (classificação muscular refinada em `mmMusculosDe`), `exEstacao` + `MT_ESTACOES`, `liftEscolheIndividual` (chamada por `buildLiftExercises`), treino em dupla (`mtDuplaPublica` → `perfis.{uid}.tr`, `mtDuplaConflitos`, `mtDuplaOrganizar`/`Desfazer`, `openTreinoDupla`), aviso de tempo (`plan.avisoTempo`), conquistas de calistenia/híbrido/dupla (`mtChecaConquistas63`), glifos novos. |

Beta 56 também troca o azul fixo `#7dd3fc` por `var(--info-soft)` no núcleo (3 lugares) e torna `#sessions-chips` uma grade (parte 58).

Beta 55 também mexe em: parte 10 (`estadoTreino` só com musculação e regra de base `RET.BASE_MIN`; `estadoTreinoCorrida`; nada da musculação no módulo de corrida), 11 (título do aviso de retomada da corrida), 15 (PDF por modalidade com comparação de períodos e origem; sem "0 kg"), 26 (Central de compartilhamento com FC, subida e percurso `d.rota`), 33 (`__mtCarregandoConta`: nada leva ao cadastro enquanto a conta carrega), 42 (conquista nova sai só quando é tocada: `cqVerNova`, `cqTodasVistas`), 54 (sem `#perf-mod`), 57 (celebração depois de importar, plano só para datas recentes, log clicável, compartilhar, arquivo original, aviso de 90 dias) e o vigia de abertura no `index.html`.

Parte nova: próximo número livre (ex.: `41-nome-da-funcao.js`).

## Planos (Beta 40)

- **Fonte do plano:** o documento de plano da pessoa (coleção `usuariosAutorizados`) → `planoDe(isAdmin, doc)` / `planoAtual()` (app.js). Sem documento = Gratuito.
- **Recurso Premium novo:** acrescente em `MT_RECURSOS` (parte 36) e confira com `if(!mtTem('chave')) return mtPremiumAviso('chave');` **dentro da função que faz o trabalho**, não só escondendo o botão.
- **Nunca bloquear:** execução de treinos, registro de séries e corridas, vídeos dos exercícios do próprio plano, histórico, evolução básica, desafios, conquistas e provas.
- **Mudar de plano não apaga dados:** o que é Premium fica no `state` e volta com o Premium.

## Primeiro acesso (Beta 38)

Fluxo: login → `bootAfterAuth` → `scr-quiz` (4 etapas) → `saveQuiz()` → `scr-pick` → `pickModule(m)` → `openSetupScreen(m)` (`scr-setup-lift`: 5 etapas; `scr-setup-run`: 5 etapas) → `finishSetup(m)` → Início.

- **Cadastro pronto** = `profile.quiz_done` **e** pelo menos um plano (`state.modules.lift || state.modules.run`). Antes disso, `goTab`, `showScreen` de uma aba, o assistente e os comandos dele levam de volta para o cadastro (parte 33). Não crie atalho que chame a tela por fora disso.
- **Campo novo no cadastro:** coloque `data-wz="N"` no `.field` (N = etapa). Sem o atributo, o campo aparece em todas as etapas. Para o nome na revisão, `data-rotulo="..."` (senão usa o texto do `<label>`).
- **Validação:** uma regra só por campo. Questionário: `quizErro(campo)` (app.js), usada por etapa e de novo em `saveQuiz`. Dias da semana: `setupErroDias(m)` (app.js), usada na etapa "Sua semana" e em `finishSetup`.
- **Ícones do cadastro:** `<span data-ico="nome"></span>` com o nome de `CAD_ICO` (parte 33). Nada de emoji nas telas do cadastro.
- **Tema:** `applyTheme(t, true)` aplica sem gravar (abrir o app não é escolher). `setTheme` grava no aparelho e em `state.prefs.tema`.
- **Começar do zero** (`doRestart`): apaga treinos, séries, recordes, conquistas, pesagens, arquivo anual e o questionário; mantém conta, acesso e as preferências (`prefs`, `inicioOcultos`, `inicioOrdem`, `inicioOrdemInd`, `inicioEnxuto`). Grava `zeradoEm`: em `mesclaEstado`, a cópia mais antiga que essa marca não devolve o que foi apagado.

## Como acrescentar comportamento a uma tela: ganchos

Para rodar algo depois (ou antes) de uma função de tela do `app.js`, use **`mtGancho`** — não crie mais uma camada `const _x = window.f; window.f = function(){...}`:

```js
mtGancho('renderProfile', { depois(){
  // roda depois que o Perfil é desenhado
}});
mtGancho('renderHome', { antes(){ /* roda antes */ }, depois(){ /* roda depois */ } });
```

- "depois" roda na ordem das partes (00, 01, 02...). "antes" roda na ordem inversa (igual às camadas antigas).
- Cada gancho roda isolado: se der erro, ele aparece no console e a tela continua funcionando.
- Funciona com funções assíncronas (ex.: `goAdmin`).

Funções que já usam ganchos: `renderHome`, `renderHomeMetrics`, `renderMonthlyCard`, `renderSessions`, `renderPerf`, `renderHistory`, `renderProfile`, `goAdmin`, `openStudent`, `closeModal`, `openTrophyDetail`, `openAparencia`, `openPersonalizarInicio`, `openAudioVideos`, `renderHistEvolution`, `renderChallenges`, `openMinhaConquistaShare`, `renderRecords`, `openExProgress`, `openExerciseSheet`, `aplicaInicio`, `openPersonalizarInicio`.

Embrulhar a função inteira (`window.f = function(){...}`) só quando for preciso **mudar os argumentos ou o resultado** dela.

## Regras que evitam quebrar o app

1. Nunca declarar de novo um `let`/`const` que já existe no `app.js` (dá erro e o app não abre). Funções podem ser estendidas com ganchos.
2. O estado do aluno é `state`. Depois de mudar algo, chamar `saveData()` (salva no aparelho e manda para a nuvem).
3. O documento do aluno na nuvem tem limite de 1 MB. Dado que cresce sem parar não vai no `state`: vai para o arquivo anual (parte 15).
4. Texto vindo do aluno ou do admin, quando entra em HTML, passa por `mtEsc()` ou `escHtml()`.
5. Depois de mexer: `python3 fonte/montar.py`, e testar no celular e no computador.

## Dados no Firestore

| Caminho | O que guarda | Quem lê/grava |
|---|---|---|
| `usuarios/{uid}` | Tudo do aluno (`estadoApp`): planos, últimos 90 dias de histórico, recordes, preferências. O `{uid}` é o de `contas/{email}.uid` (Beta 34), que pode ser de outro login da mesma pessoa | o próprio aluno (qualquer login com o mesmo e-mail verificado) e admins |
| `contas/{email}` | Beta 34: `{ uid, uids }` — qual documento de `usuarios` é o da pessoa | a própria pessoa (e-mail verificado) |
| `parceiros/{id}` | Beta 34: cadastro completo dos criadores dos vídeos (inclui contato privado) | só admins |
| `usuarios/{uid}/arquivo/{ano-semestre}` | Histórico com mais de 90 dias (cada registro como texto JSON) | o próprio aluno e admins |
| `usuariosAutorizados/{email}` | Beta 40: **plano** da pessoa (`plano`, `testeInicio`, `premiumAte`, `bloqueado`; os antigos `active`/`expiresAt` continuam valendo) | admins gravam; a pessoa lê o próprio e cria uma única vez o próprio Teste Premium |
| `admins/{email}` | Administradores secundários (remover = apagar o documento) | administrador principal |
| `adminLog/{id}` | Beta 40: ações do painel (quem, o quê, em quem, quando) | admins criam; só o principal lê; ninguém altera |
| `config/mural`, `config/contato`, `config/calistenia`, `config/specialAward` | Mural/logo, contato, ajustes da calistenia, Conquista Especial | todos leem; admins gravam |
| `desafiosTematicos/{id}` e `.../participantes/{uid}` | Desafios criados e quem participa | ver regras |
| `videosExercicios`, `exerciciosCustom`, `caliExercicios`, `caliModelos` | Vídeos e exercícios cadastrados pelos admins. `videosExercicios.creditos` = só o que o admin liberou do parceiro (ficha/Biblioteca) | todos leem; admins gravam |
| `familias/{código}` | Beta 49: grupo da casa — `membros`, `dono` (administrador), `nomes`, `perfis` (cada um só a própria chave: restrições, total de compras), `config` e `cardapio` (só o administrador). Sem peso, idade, altura ou e-mail | membros leem; ver regras |
| `perguntasNaoRespondidas`, `relatos`, `videosReportados` | Mensagens e relatos dos alunos | aluno cria; admins leem |

O dono do app (administrador principal) é reconhecido pelo e-mail definido em `ADMIN_EMAIL` (app.js) e nas regras.

## Compartilhamento (Beta 26)

Para um card novo: escreva uma função que devolve os dados e chame `mtsAbrir(dados, funcaoDoModeloClassico)`.

```js
mtsAbrir({ tipo:'corrida', titulo:'Rodagem', data:Date.now(),
  hero:{ v:'7,3', u:'km' }, nums:[{ l:'Tempo', v:'42', u:'min' }], extra:['Prova'], texto:'Texto do compartilhar' });
```

`tipo` define a cor e o desenho de fundo. Também aceita `desc`, `medalha:{svg,cor}`, `nivel`, `periodo`, `serie` (números para a curva) e `kick` (o texto pequeno acima do título). Nunca coloque e-mail, peso ou medidas.

Sugestão de carga: use sempre `proxCarga(kg)` (app.js) para o próximo degrau, assim todas as telas mostram o mesmo número.

Modo computador: para mudar onde um bloco aparece no computador, edite `DK_LAYOUT` na parte 29 (topo, lado ou fim; o resto vai para a coluna principal).

Acesso offline: `acessoCacheValido` e `acessoConfereDepois` (app.js). O app entra com o acesso guardado (até `ACESSO_OFFLINE_DIAS` = 30 dias) e confere na nuvem em segundo plano.

Nenhum elemento pode passar da borda da tela no celular (deixa a página mais larga e o celular abre com zoom). Para conferir: `document.documentElement.scrollWidth` tem que ser igual à largura da tela.

## Sistemas centrais (Beta 33) — use estes, não crie outro

| Sistema | Onde | Como usar |
|---|---|---|
| Tipo de registro | app.js | `exTipoRegistro(id)`: carga · corpo · tempo · cardio · mobilidade (decide as colunas do registro de séries). Descanso do exercício: `descansoDoExercicio(id)`; regra em `liftDescanso(tier, objetivo, 50+, reps)`. |
| Descanso | app.js, "TIMER DE DESCANSO" | `startRestTimer(seg, nome)`, `stopRestTimer()`, `restAjusta(±s)`, `restPausa()`. Conta pelo horário (`restFimEm`), não por `left--`. `restTimerInt` ≠ null = descanso rodando. |
| Tela ligada | app.js, "TELA LIGADA" | `telaLigadaPedir('motivo')` / `telaLigadaSoltar('motivo')`. Uma trava só para o app; volta sozinha ao reabrir. `requestWakeLock()`/`releaseWakeLock()` = motivo `'especial'`. |
| Treino ativo | app.js | `treinoAtivoIniciar()`, `treinoAtivoEncerrar()`. Mantém a tela ligada na aba Treinos; termina ao salvar, sair, virar o dia ou 20 min parado. |
| Som do fim | app.js | `tocaSomFim(id, atrasoSeg)`. Respeita `restMuted` (salvo em `mt_descanso_mudo`) e `restVibrarLigado()` (`mt_descanso_vibrar`). |
| Semana | app.js | `semanaLocalId()` (segunda a domingo, horário do aparelho). Não use `Math.floor(Date.now()/7 dias)`. |
| Fichas | app.js | `buildLiftExercises(parts, setup, {indice, jaNaSemana, usadosSemana})`. Papéis em `LIFT_PAPEIS`/`liftSequencia`, descanso em `liftDescanso`, quantidade em `liftQuantos`, teto em `LIFT_TETO_SERIES`. |
| Documento de dados | app.js | **Sempre `uidDados()`**, nunca `fbUser.uid`, para ler/gravar `usuarios/{...}` e o arquivo anual. `resolveContaUnica()` liga o e-mail verificado a um documento só (`contas/{email}`). |
| Nuvem em tempo real | app.js | `ouveNuvem()` (começa no login). Nuvem mais nova → passa a valer aqui e o que só existe neste aparelho é juntado; mais antiga → junta o que falta. `salvarLocal()` grava só no aparelho (trocar de aba). |
| Vídeos | parte 07 / 02 | `mtMontarPlayer` (modo limpo, `_mtPlayerVars`), controles `mtTocarPausar/mtBuscar/mtVolume/mtVelocidade`. Créditos: `creditosHtml(id, 'ficha'|'biblioteca')` lê `videoCreditos` (campo `creditos` do vídeo). |
| Duas cópias do aluno | app.js | `mesclaEstado(base, outra, {desde})` junta histórico/séries/peso/conquistas. Ao excluir um registro do histórico, chame `marcaExcluido(modulo, registro)`. |
| Plano entre aparelhos (Beta 35) | app.js | `saveData()` marca `modules.lift/run.planAt` quando `setup` ou `plan` mudam (compara com `planoAssinatura`). Na junção, o plano com `planAt` maior vence. Depois de trocar `state` inteiro, chame `planoMarcaBase()`. |
| Divisão de 3 dias (Beta 35) | app.js, `generatePlan` | 3 dias com folga entre eles → Superior · Inferior + Core · Corpo inteiro (grupos grandes 2×/semana). Dias seguidos ou `setup.split3 = 'classico'` → divisão antiga. Teto de 90 min por treino em `buildLiftExercises`. |
| Fundos decorativos (Beta 36) | parte 22 / 28 | `updateDeco(tab)` desenha; `decoPosiciona(tab)` mede a faixa do topo (`DECO_FAIXA`: até o primeiro bloco de conteúdo) e grava `--deco-top`, `--deco-h`, `--deco-dir`. Todas as abas principais têm desenho. Início: `cenaInicio()` (camadas, classes `.c-*`), foto do perfil na linha do METATREINO (`inicioAvatarNoTopo`). Cores pelas classes `.d-*`/`.c-*` no CSS, nunca no SVG. |
| Registro de séries (Beta 36) | app.js | `concluirSerie(i)` (✓), `addSet()` (adicionar), `updateSet()` (editar, não toca no descanso). `curLog.feitas[]` só na tela (nada novo é gravado). `seriesPlanejadas(exId)`, `descansoAutomatico()` (`mt_descanso_auto`). |
| Compartilhar (Beta 36) | parte 26 | Sempre `mtsAbrir(d)`. A altura do bloco do card é medida com `_mtsMedidor` (contexto que não desenha); o nome entra no bloco. |
| Confirmação | app.js | `appConfirm(msg, onOk, {title, emo, okLabel, onCancel})`. Use antes de qualquer ação que apaga algo. |
| HTML com dado do aluno | app.js / parte 00 | `escHtml()` / `mtEsc()` para texto; `jsAttr()` dentro de `onclick="f('...')"`. |

## Testes

Na pasta do projeto (precisa de Node; os de navegador precisam de Python + Playwright):

```
node testes/regras.js                 # regras de negócio (descanso, ritmo, VDOT, datas, limpeza para a nuvem, escapes)
node testes/auditoria-musculacao.js   # todas as fichas possíveis (768) + 98 combinações de dias
node testes/simulacao-corrida.js      # 60 alunos simulados por 20 semanas de corrida
node testes/sincronizacao.js          # junção de duas cópias (outro aparelho/offline)
node testes/migracao-fichas.js PASTA_DA_BETA_32   # correção única dos planos antigos
python3 testes/navegador.py URL       # abas, janelas e 8 temas: erros, largura, contraste
python3 testes/cronometro.py URL      # descanso, tela ligada, som e vibração
python3 testes/atualizacao.py PASTA_ANTIGA PASTA_NOVA   # atualização automática + modo avião
python3 testes/dois-aparelhos.py PASTA_DO_PROJETO   # celular (Google) × computador (e-mail/senha), nuvem compartilhada simulada com as regras
python3 testes/videos-creditos.py PASTA_DO_PROJETO  # player limpo, parceiros, créditos e permissões
node testes/semana-menos-tempo.js     # corrida: semana com menos tempo
python3 testes/registro-series.py URL # registro de séries (carga/corpo/tempo), 1ª série e descanso, ficha, seleção de texto
node testes/beta35.js                 # plano entre aparelhos, corrida adaptada por dor, divisão de 3 dias, confirmação
python3 testes/acessibilidade.py URL  # nomes de botões, teclado, aviso acima das janelas, confirmação
python3 testes/acabamento.py URL      # 8 temas × 360/390/430 px: fundos, cena do Início, paletas, botão do assistente, seleção, rolagem
python3 testes/serie-descanso.py URL  # concluir série, descanso automático/manual, última série
python3 testes/compartilhar.py URL    # central de compartilhamento em sequência, estado limpo, nome na faixa
python3 testes/beta40.py URL [PASTA]  # planos, teste de 30 dias, temas, assistente, PDFs, cadastro, limitações, terreno, RPE, painel
```
Os testes de navegador usam `testes/mock-firebase.js` (Firebase simulado, sem conta real) e `testes/semente.js` (aluno de exemplo). Para servir o site de teste: copie o projeto, troque os `<script>` do Firebase do `index.html` por `mock-firebase.js` e rode `python3 -m http.server`.

Escala de esforço: `rpeHtml(nota, 'musc')` usa as frases de musculação (`RPE_DESC_MUSC`); sem o segundo argumento, as de corrida, caminhada e bike (`RPE_DESC`).

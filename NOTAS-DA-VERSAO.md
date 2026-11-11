# MetaTreino 2027.1 Beta 10 — notas da versão

Evolução feita **sobre o código da Beta 9** (nada foi recriado do zero). O `app.js` recebeu correções pontuais;
as novidades estão em um arquivo novo, `app-plus.js`, carregado logo depois. Ele estende as funções existentes
em vez de substituí-las — se algo der errado nele, o restante do app continua igual à Beta 9.

## Arquivos

| Arquivo | O que mudou |
|---|---|
| `index.html` | barra inferior nova, tela Desafios, Progresso com seletor, Aparência, camada de CSS de acabamento, botão/banner de atualizar removidos |
| `app.js` | versão, navegação (`goTab`), fases em português, ícones das conquistas, textos corrigidos, aviso de versão removido do assistente |
| `app-plus.js` | **novo** — biblioteca, ficha/vídeo, fotos, Aparência, desafios temáticos, Home inteligente, assistente, admin, atualização automática |
| `service-worker.js` | versão nova e `app-plus.js` no cache (rede primeiro) |
| `firestore.rules` | **novo** — proposta de regras (ver abaixo) |
| `manifest.json`, ícones | sem alteração |

## Bugs corrigidos
- **Cards transparentes/embaçando ao trocar de tela.** Causa: as telas entram com animação de opacidade; durante a animação o `backdrop-filter` dos cards não enxerga o fundo, e o desfoque “entra” quando a animação termina. Os cards dentro das telas não usam mais desfoque e ganharam base opaca (mesma cor do tema). A barra inferior e os modais mantêm o vidro.
- **Exclusão de fotos.** Cada miniatura tem o próprio botão de lixeira (apaga só aquela), o visualizador diz “Apagar só esta foto”, há modo **Selecionar** para apagar várias, e “Apagar todas” ficou separado, exigindo digitar APAGAR. Toda exclusão confere quantas fotos sobraram.
- **BUILD / PEAK / TAPER** na Home → **Construção / Intensificação (ou Pico) / Consolidação (ou Polimento)**. “Streak N dias” → “Sequência de N dias”. Lógica da periodização intacta.
- Ícones de grupos musculares errados (Peito aparecia como mão/joinha, Glúteos como fruta) → desenhos próprios com o músculo destacado.
- Conquistas secretas sem ícone viravam “bolinhas” no modo de ícones de linha → todas as 70 têm medalha própria (Hora Capicua = relógio 11:11, Antes do Galo = amanhecer, Coruja Fitness = coruja…).
- Pacotes de ícones quase iguais → Linha fina, Linha e Duotone agora diferem de verdade, inclusive na barra inferior.
- Botão “Excluir/Apagar” das confirmações aparecia na cor do tema em vez de vermelho (temas Premium/AMOLED).
- Botão “Fechar” quase invisível na comemoração de conquistas no Tema Claro.
- Erros de concordância: “meus conquistas”, “aos conquistas”, “seus conquistas”.

## Navegação (5 posições)
**Início · Treinos · Desafios · Progresso · Perfil**
- *Treinos* = Sessões + atalhos para Meu plano, Biblioteca e Registrar atividade.
- *Desafios* (novo) = desafio temático, níveis do mês, conquistas, medalhas e histórico.
- *Progresso* = Desempenho e Histórico com seletor no topo (antes eram duas abas com dados sobrepostos).
- *Meta Assistente* continua no botão flutuante e também no Perfil.
- Rótulos sempre visíveis, destaque discreto, respeita a área segura do Android.

## Novidades
- **Desafios temáticos** com calendário anual automático: Projeto Ano Novo, Fevereiro em Ritmo, Desafio Consistência, Abril em Equilíbrio, Desafio Evolução, Arraiá Fitness, Sem Desculpas, Desafio Superação, Desafio Independência, Primavera Ativa, Reta Final, Natal em Movimento + especiais **Carnaval** e **Páscoa** (datas reais calculadas pela Páscoa de cada ano) e **Noite das Bruxas** (20–31/out). Missões semanais, contagem de dias, medalha exclusiva por edição, comemoração, imagem para compartilhar e histórico.
  - Meta = dias ativos, **qualquer modalidade conta**, calculada pela frequência real do aluno nas 6 semanas anteriores, com teto de 1 dia além do plano por semana. Congelada quando o aluno toca em “Participar”.
  - Participação só existe quando o aluno entra; conclusão só quando cumpre. Nada é inventado.
- **Admin principal**: criar, editar, programar, personalizar ou desativar qualquer desafio (inclusive os automáticos), definir missões, meta fixa e recompensa, e ver participação/conclusão — tudo pelo painel, sem mexer em código.
- **Biblioteca**: busca sem acento por nome, músculo ou equipamento; filtros por grupo e por equipamento; ficha técnica de todos os 123 exercícios (músculos, como executar, dicas, erro comum). Quem treina em academia não vê as adaptações com garrafa/toalha/mochila (continuam disponíveis no filtro “Peso do corpo”).
- **Vídeos**: player grande, proporção certa para vertical (Shorts) e horizontal, tela cheia (com giro para paisagem), indicador de carregamento, aviso se demorar, créditos do criador preservados.
- **Home inteligente**: um card que muda conforme o momento — iniciante, treino concluído, retomada após 4+ dias, reta final de prova, semana atrasada, recordes recentes, consistência. Pode ser ocultado no dia.
- **Meta Assistente**: “Me motive” com 50 mensagens em 9 contextos, sem repetir as 40 últimas, sempre com uma ação prática; novas análises com dados reais — mês × mês anterior, cargas (evoluindo/estáveis/caindo por exercício), consistência, corrida (ritmo, volume, alerta de aumento brusco), plano de retomada, desafio atual e “onde fica cada coisa”. Aviso proativo discreto quando faltam 1–2 dias para concluir um desafio.
- **Aparência**: seção única com **Tema Noturno** (Premium, AMOLED, Aurora, Clássico, Oceano) e Tema Claro, estilo e pacote de ícones com amostra, fundo decorativo. Todos os temas e preferências anteriores foram preservados.
- **Admin**: indicadores de engajamento reais (treinaram em 7 dias, sessões em 7 dias, parados há 14+ dias, participantes do desafio) e gestão de administradores (só o principal; o principal não pode ser removido).

## Atualização automática (botão removido)
O botão “Buscar atualização”, o banner “Nova versão disponível” e o aviso do assistente foram removidos. O mecanismo ficou **mais** automático:
a versão nova é baixada em segundo plano e aplicada sozinha quando é seguro — ao abrir o app, ou quando o aluno sai dele — nunca no meio de um treino ou formulário. O app instalado também procura versão nova ao voltar do segundo plano (no máximo a cada 30 min). Se por algum motivo a atualização ficar pendente por mais de um dia, aparece uma mensagem discreta, sem botão.

## Testes realizados
Em Chromium (Playwright) com o Firebase simulado localmente, telas de 390×844 e 320×640:
- todas as abas e telas secundárias nos 6 temas, sem erros no console e sem rolagem horizontal;
- exclusão individual, seleção múltipla e “apagar todas” das fotos (IndexedDB real): apagar 1 de 4 deixou exatamente as outras 3;
- busca e filtros da biblioteca, ficha com e sem vídeo;
- “Me motive” 6 vezes seguidas → 6 mensagens diferentes; todas as análises novas do assistente e a interpretação das frases;
- participar de um desafio, concluir, medalha no arquivo, gravação da participação;
- painel admin: criar/personalizar desafio (substitui o automático), autorizar administrador, bloqueio para quem não é o principal;
- **atualização automática ponta a ponta** com service worker real: app aberto na Beta 10, publicada uma versão nova no servidor → o app passou para ela sozinho, sem nenhum toque.

## O que NÃO foi testado / pendências
- Não testei em aparelho Android real nem com a PWA instalada (teclado aberto, barra de gestos). Recomendo testar antes de liberar para todos.
- Os vídeos do YouTube não carregam no ambiente de teste; o player foi testado só no layout.
- As regras do Firestore **não foram testadas** contra o emulador. Revise antes de publicar.
- O Firebase real não foi acessado — participação e desafios do admin foram testados com banco simulado.
- Não implementados nesta versão (avaliados, ficam para a próxima): calendário completo, lembretes configuráveis, registro de sono, desafios entre amigos, onboarding novo, relatório individual do treinador por aluno, gráficos novos do perfil, IA externa. Para IA externa, o caminho seguro é uma Cloud Function que guarda a chave da API — nunca a chave no navegador.

## Alterações necessárias no Firebase
1. Publicar regras que liberem a coleção nova **`desafiosTematicos`** (leitura para logados, escrita só do principal) e a subcoleção **`participantes/{uid}`** (cada aluno grava só a própria). Tudo está em `firestore.rules`.
2. Para a gestão de administradores pelo painel: a coleção `admins` precisa permitir escrita só ao principal.
3. Nenhum dado existente muda de lugar ou de identificador. Campos novos no estado do aluno: `eventos` (desafios temáticos) — opcional e retrocompatível.

## Publicação
1. Faça backup da versão atual publicada.
2. Substitua no repositório: `index.html`, `app.js`, `service-worker.js` e adicione `app-plus.js`.
3. Publique as regras do Firestore (Console → Firestore → Regras) depois de revisar.
4. Abra o app instalado: ele deve passar para a Beta 10 sozinho em alguns segundos (ou ao sair e voltar). Confira a versão no rodapé do Perfil.

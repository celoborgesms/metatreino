# Relatório técnico — MetaTreino 2027.1 Beta 36 (acabamento visual e funcional)

Esta versão faz uma rodada de acabamento sobre a Beta 35.
- Nenhuma função, dado, tema ou regra de negócio foi removido.
- Nenhum sistema novo de temas ou de compartilhamento foi criado.
- As regras do Firestore não mudaram (não é preciso republicar).
- `app-plus.js` foi gerado por `python3 fonte/montar.py --versao 36`, e as 5 marcações de versão estão iguais.

## O que foi analisado e onde cada item estava

| Item | Responsável no código | Causa encontrada |
|---|---|---|
| 1. Cena do Início | parte 28 (`cenaInicio`), CSS `#app-deco` (7 camadas de regras de Betas antigas) | A cena ficava num quadrado no canto superior direito, atrás da foto do perfil e da saudação, com opacidade 0,17. Por isso o sol e a lua ficavam embaixo do texto. |
| 2. Desafios × bandeira | parte 22 (`updateDeco`), CSS `#app-deco` | O desenho tinha altura fixa e passava por trás do cartão do desafio. Nos temas com cartão translúcido, a medalha aparecia através do cartão e se misturava com a bandeira. No AMOLED o cartão é opaco, então a medalha sumia. |
| 3. Fundos das abas | parte 22 (`DECO2_SVG`) | Os desenhos eram só de traço e tinham o mesmo tamanho em todas as abas. Passavam atrás de cartões, gráficos e da foto do perfil. |
| 4. Paletas | parte 03 (`openAparencia`, `.ap-prev`) | Ver a seção "Não reproduzido". |
| 5. Rolagem | `index.html` CSS | `overscroll-behavior-y:none` na página tirava o efeito nativo de fim de tela do Android. A barra de abas usava um desfoque de 22 px, redesenhado a cada quadro. Não há rolagem simulada por JavaScript nem ouvintes de toque que travam a rolagem. |
| 6. Séries e descanso | app.js (`renderSetLogModal`, `addSet`) | "+ Nova série" fazia duas coisas: adicionava e encerrava a série anterior, iniciando o descanso. Não existia a ação "concluir", e a última série não era tratada. |
| 7. Seleção de texto | CSS da Beta 34 | A Beta 34 tinha uma lista de bloqueio só para botões e cartões clicáveis. Textos informativos, como clima, saudação, semana e status, ficavam de fora. |
| 8. Interface antiga de compartilhar | parte 26 (`mtsAbrir`, `shareTrophyImage`) | Havia três caminhos até a interface antiga: o link **"Modelo clássico"** no rodapé da central; um *fallback* para a função antiga; e a possibilidade de abrir com `app.js` e `app-plus.js` de versões diferentes no meio de uma atualização. Achei também estado que passava de um card para outro (foto e zoom do card anterior). |
| 9. Nome na faixa | parte 26 (`mtsDesenhar`) | A altura do bloco era estimada. A estimativa não contava o número grande, as fichas nem a medalha. Em cards de treino, semana e corrida, o nome caía **fora** da faixa. |
| 10. Botão do assistente | CSS `#ma-fab` + sistema de ícones | O ícone `.ico` pegava a cor principal do tema, a mesma do fundo do botão. No Clássico era verde sobre verde; no Vinho e no Claro acontecia o mesmo. |

## O que mudou

1. **Início.**
   - A foto do perfil foi para a linha do METATREINO, como botão que abre o Perfil.
   - A cena virou uma paisagem em camadas, nesta ordem: serra ao fundo, montanha com a bandeira, trilha, primeiro plano, e o clima na frente do sol.
   - Ela fica numa janela à direita da saudação, e o texto reserva esse espaço.
   - A altura da janela é medida para caber entre a linha do topo e o fim da saudação, então a Home não cresceu.
   - O sol fica âmbar e o pôr e o nascer do sol, laranja; a lua segue a cor do texto. A bandeira e a trilha usam a cor do tema.
   - O clima vem dos mesmos dados de antes. Sem clima, a cena mostra só o horário. As datas especiais foram mantidas.
   - A coruja da noite saiu. Era o elemento mais "infantil" da cena e ficava atrás do texto.
2. **Fundos decorativos.**
   - Nova função `decoPosiciona(tab)`: mede a faixa entre o topo da aba e o primeiro bloco de conteúdo. O desenho nunca passa por trás de cartões. Ela também encosta na coluna de conteúdo no modo computador e no tablet.
   - Linguagem comum dos desenhos: um disco suave na cor principal, formas translúcidas na cor do texto e um único detalhe na cor principal. As cores vêm do CSS (classes `.d-*` e `.c-*`), ajustadas para os temas claros e o AMOLED.
   - O SVG é parado: sem animação e sem imagens.
3. **Curadoria dos fundos.** A opção "Fundo decorativo" foi mantida.

   | Aba | Decisão | Motivo |
   |---|---|---|
   | Início | Melhorar | A ideia (montanha da meta e clima) era boa, mas o desenho ficava escondido. |
   | Treinos (musculação e corrida) | Substituir | A barra e a pista antigas ficavam grandes atrás dos atalhos. |
   | Biblioteca | Substituir | O livro aberto ficava atrás do subtítulo. Virou fichas empilhadas com o vídeo. |
   | Plano | Melhorar | O calendário continua, agora na faixa do título. |
   | Desafios | Melhorar | A medalha continua, mas só na faixa do título, longe da bandeira. |
   | Progresso | Melhorar | Gráfico subindo, pequeno, ao lado do título; nunca atrás dos gráficos. |
   | Histórico | Melhorar | O relógio passava atrás dos números; agora fica pequeno, ao lado do título. |
   | Perfil | Manter (redesenhado) | A pessoa e o arco ficam só no topo, ao lado do nome, sem passar atrás dos cartões. |

4. **Registro de séries.**
   - Cada linha ganhou o botão ✓ **Concluir**. Tocar de novo desfaz a marca.
   - Adicionar uma série cria a linha pendente. Editar só muda os números. Concluir é o que inicia o descanso.
   - A última série prevista no plano não abre descanso; aparece o aviso de fim do exercício.
   - Preferência "Iniciar o descanso sozinho ao concluir a série" (`mt_descanso_auto`, ligada por padrão). Desligada, aparece o botão **Iniciar descanso · tempo**, que vira "Reiniciar descanso" enquanto o descanso corre. Esse botão substituiu o antigo "Reiniciar descanso", então não há botão duplicado.
   - "+ Nova série" com a anterior pendente conclui a anterior, para não quebrar o hábito de quem já usava assim.
   - O estado "concluída" existe só na tela. Nada novo é gravado nas séries, e o histórico fica igual.
5. **Compartilhar.**
   - Saiu o link "Modelo clássico". A função antiga continua no código, mas sem nenhum caminho até ela pelas conquistas.
   - Um erro ao montar o card vira aviso.
   - Abrir outro item zera a foto, o zoom e o enquadramento.
   - Proteção de versão no `index.html`: se `MTP.versao` for diferente de `APP_VERSION`, o app recarrega uma vez por sessão (sem risco de ciclo sem internet).
6. **Nome na faixa.**
   - O bloco do card é medido com um contexto de ensaio (`_mtsMedidor`, que não desenha nada) antes de ser posicionado.
   - Com Faixa, o nome tem linha própria no pé da faixa, depois de um divisor, centralizado na largura da faixa e no espaço até a borda.
   - Nomes longos diminuem a fonte até caber; se ainda não couber, ganham reticências.
   - Nas disposições sem faixa, o nome segue o alinhamento do card.
7. **Botão do assistente.**
   - O ícone usa `--on-primary`, a mesma cor de texto dos botões principais de cada tema.
   - No Premium e no AMOLED, o ícone fica na cor do tema sobre o fundo escuro.
   - Um anel na cor do fundo separa o botão do que estiver atrás.
   - Os estados especiais (aviso importante, raro, especial) usam ícone branco.
   - Tamanho, posição, animação e funções não mudaram.
8. **Seleção de texto.** A regra é centralizada num bloco só (o bloco da Beta 34 foi substituído):
   - Telas, abas, janelas e avisos: sem seleção.
   - Exceções explícitas: campos, `#ma-thread`, recado do treinador, anotações do dia, ficha (`.ex-sec`), créditos (`.vc-cred`), painel do administrador e a classe `.selecionavel` para usos futuros.
   - Não foi aplicado `user-select:none` no `body`.
9. **Rolagem.**
   - `overscroll-behavior-y: contain` no lugar de `none`.
   - `overscroll-behavior-x: contain` nas faixas que rolam para o lado.
   - Desfoque de 14 px na barra de abas.
   - Sem `scroll-behavior: smooth` em nenhum lugar.
10. **Paletas.** As amostras ganharam moldura neutra própria e o cartão em volta ficou opaco e neutro. As cores dos temas não foram alteradas.

## Ajustes depois da primeira entrega da Beta 36

- Os fundos do Perfil, do Histórico e do Progresso voltaram, redesenhados e na faixa do topo.
- Chip do clima × nome do app: em 390 px, "Céu limpo" ficava a 5 px do METATREINO e "Tempestade" encostava (−9 px). Agora `climaChipCabe()` esconde a descrição quando a folga é menor que 14 px (o teste de acabamento confere ≥ 12 px nos 8 temas e em 360, 390 e 430 px).
- Rolagem ao fechar janelas: às vezes a tela pulava (o teste de acabamento pegou o caso no Perfil, de 360 para 240). Causa: as janelas usam o histórico do navegador para o Voltar do Android, e o navegador restaurava a posição de quando a janela abriu. Solução: `history.scrollRestoration = 'manual'` (parte 23), e o Perfil guarda a posição ao se redesenhar.
- Mural: com a capa ligada, a cena do Início não é desenhada (ficava escondida atrás da capa). O logo do mural foi conferido em todas as telas.

## Testes executados (todos nesta versão final, Beta 36)

| Teste | Resultado |
|---|---|
| Sintaxe: `app.js`, `app-plus.js`, 34 partes e 3 scripts do `index.html` | ok |
| `montar.py --versao 36` | 5 versões iguais |
| `node testes/regras.js` | 61 aprovados |
| `node testes/sincronizacao.js` | 15 aprovados |
| `node testes/beta35.js` | 23 aprovados |
| `node testes/auditoria-musculacao.js` | Nenhum problema |
| `node testes/semana-menos-tempo.js` | 34 aprovados |
| `node testes/simulacao-corrida.js` | Nenhum problema |
| `node testes/migracao-fichas.js` | Histórico preservado |
| `python3 testes/acabamento.py` (novo) | 26 aprovados. Cobre: 8 temas × 360/390/430 px × 8 abas; fundos visíveis e terminando antes do conteúdo; sol e lua inteiros e fora de textos, foto e clima (8 temas × 4 horários × 3 larguras); nenhuma tela mais larga que o celular; medalha visível no AMOLED; paletas com as mesmas cores em todos os temas (inclusive no pixel); contraste do botão do assistente ≥ 3:1 em todos os temas; seleção de texto (Início bloqueado; assistente e ficha copiáveis); nenhum ouvinte do app que trava a rolagem; posição da rolagem mantida ao abrir e fechar 5 janelas; grupo do Perfil sem pulo; fundo decorativo desligado. |
| `python3 testes/serie-descanso.py` (novo) | 24 aprovados: abrir e adicionar não iniciam descanso; concluir inicia; editar não reinicia; modo manual; desfazer; hábito do "+ Nova série"; última série prevista; salvar e reabrir sem mudar dados; histórico intacto; 360 px |
| `python3 testes/compartilhar.py` (novo) | 10 aprovados: 12 aberturas seguidas de conquistas diferentes (fechando pelo X e pelo Voltar), todas na central atual e com a conquista certa; sem "Modelo clássico"; estado limpo entre itens; coleção; conquista desconhecida; 27 cards com faixa e nome |
| Proteção de versão | Com versões trocadas, recarregou uma vez e parou. Com versões iguais, não recarregou. |
| Renderização dos cards (inspeção visual) | Conquista, treino, semana, corrida e coleção × Stories/Feed/Quadrado × nomes curto, médio e longo |
| `python3 testes/navegador.py` | 8 temas, celular e computador: 0 erros, 0 páginas largas, 0 IDs repetidos, 0 textos com pouco contraste |
| `cronometro.py` | 21 aprovados |
| `registro-series.py` | 23 aprovados |
| `acessibilidade.py` | 7 aprovados |
| `videos-creditos.py` | 29 aprovados |
| `dois-aparelhos.py` | 20 aprovados |
| `atualizacao.py` Beta 35 → 36 | Atualizou sozinho e abriu offline |
| Modo computador (1366 px) | Inspeção visual do Início e dos Desafios |

## Não reproduzido ou não verificado

- **Paletas mais escuras na gaveta (item 4): não reproduzi.**
  - Hoje as paletas só aparecem num lugar: a janela Aparência. A antiga grade `#theme-grid` do Perfil está sempre oculta.
  - Não há opacidade, filtro, sobreposição nem regra que mude as cores. Medi as cores calculadas e o pixel da amostra com o tema atual escuro e claro, e são idênticos.
  - Diferença real encontrada: as amostras escuras (fundo `#000` e `#050914`) ficavam sobre um cartão translúcido que pega o tom do tema atual. Por isso se fundiam com o cartão e pareciam mais escuras conforme o tema. Foi isso que corrigi: moldura neutra e cartão opaco.
  - Se a diferença ainda aparecer no seu aparelho, um print me ajuda a achar o lugar exato.
- **Interface antiga de compartilhar (item 8):** não consegui reproduzir a ocorrência original. Fechei os três caminhos possíveis encontrados no código e testei 12 aberturas seguidas.
- **Sensação de rolagem:** só se avalia de verdade num Android físico. Aqui verifiquei a configuração, os ouvintes e a posição; a fluidez em si não foi medida.
- **Toque longo real** (menu de copiar do Android e do iPhone) e **TalkBack:** verifiquei pelo CSS calculado, não num aparelho.
- **Clima real:** a cena foi testada com códigos de clima simulados (céu limpo, nublado, chuva, garoa) e sem clima.

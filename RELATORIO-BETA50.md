# Relatório — MetaTreino 2027.1 Beta 50

Versão atualizada para **2027.1-beta.50** em todos os lugares (`fonte/montar.py --versao 50`: app-plus, `?v=` do index, rodapé e service worker). **As regras do Firestore não mudaram.**

## 1. O que foi analisado antes de mudar
- O cartão da Beta 49 ficava fixo no topo de Treinos, com o corpo de frente e de costas lado a lado e um botão para trocar de sexo. As etapas tinham textos longos e iguais em qualquer treino.
- Já existiam e foram reaproveitados, sem duplicar:
  - o grupo e a ênfase de cada exercício no catálogo (`EX_BANK`);
  - o texto "Músculos trabalhados" da ficha (`fichaExercicio`);
  - o registro de séries (`state.progress`);
  - o sexo do perfil (`profile.sex`).
- O registro de séries não tem campo de "série de aquecimento". Para não mexer no registro nem no histórico, a regra ficou nas orientações: as séries leves de aquecimento são feitas e não são registradas. Assim elas nunca entram na progressão de carga.

## 2. O que mudou
| Pedido | Como ficou | Onde |
|---|---|---|
| Mapa fora do início de Treinos | Treinos mostra só o cartão compacto de orientações (≈ 150 px) e o link "Ver músculos trabalhados ›". O mapa é uma janela única, aberta pelo link, por Progresso › Desempenho › "Anatomia muscular" e pela ficha do exercício ("Ver no mapa muscular", com ✕ voltando para a ficha) | `53-mapa-muscular.js` |
| Músculos na ficha do exercício | Linhas Principal / Secundário / Estabilizador abaixo do texto existente | gancho em `openExerciseSheet` |
| Preparação · Sessão de treino · Finalização | Textos curtos gerados pelo treino do dia: grupos principais, equipamento (academia ou casa), duração, ordem, quantidade de exercícios e faixa de intervalos da ficha | `mmGuia(w)` |
| Mobilidade compatível com o dia | Pernas: quadril, tornozelos e ativação de glúteos (só se glúteo for principal). Peito/ombro: ombros e abertura do peito. Costas: ombros e coluna torácica. Nunca glúteo em dia de peito | `mmGuia` |
| Séries de aquecimento fora da progressão | Só quando o primeiro exercício usa carga, com o aviso "não são registradas e não entram na evolução de carga". Em treino só com peso do corpo, nenhuma série extra | `mmGuia` |
| Ilustração profissional | Desenho novo em estilo atlas: cânone de 8 cabeças, grupos musculares separados por costuras finas, sem rosto caricato e sem exagero muscular. Masculino, feminino (ombros mais estreitos, cintura e quadril, cabelo preso discreto) e neutro (perfil sem sexo). Um corpo por vez, FRENTE / COSTAS com o mesmo enquadramento | `mmCorpoSVG` |
| Ficha do músculo | Nome, localização, função, movimentos, exercícios do MetaTreino como principal, secundário ou estabilizador, exercícios de hoje e séries dos últimos 7 dias | `mmFicha` |
| Principal × secundário × estabilizador | Cor cheia, cor clara e contorno tracejado. Um músculo nunca aparece em dois papéis. Abdômen e lombar no agachamento são estabilizadores, não principais | `mmMusculosDe` |
| Formato corporal | Não muda com peso nem altura (testado) | — |
| Toque em telas pequenas | Um toque na costura entre dois músculos escolhe o mais próximo (raio de ~14 px). A lista de músculos abaixo do corpo também seleciona e troca a vista quando precisa | `mmToque` |

## 3. Testes
- **Novo `testes/beta50.py`: 40 ok.** Cobre:
  - a localização (o mapa não aparece sozinho; o cartão fica antes dos exercícios e é compacto);
  - as orientações nos 4 treinos (peito sem glúteo/tornozelo, pernas com quadril/tornozelos, textos diferentes por treino, tamanho máximo, aquecimento fora do registro, treino só com peso do corpo);
  - o progresso de carga intacto depois de abrir orientações e mapa;
  - o mapa para perfil masculino, feminino e sem sexo, frente e costas, desenhos diferentes com o mesmo enquadramento, e o corpo igual com peso de 50 kg e de 120 kg;
  - a ficha do músculo, o toque na costura e a troca de vista pela lista;
  - "Últimos 7 dias" e "Explorar";
  - os 123 exercícios do catálogo: o músculo principal do mapa sempre aparece no texto da ficha, sem papéis repetidos;
  - a ficha do exercício (Ver no mapa e ✕ volta);
  - a entrada em Progresso, que não aparece na corrida;
  - Android pequeno (360 px), iPhone (390 px) e computador (1280 px): abre em menos de 150 ms, sem rolagem lateral, SVG menor que 40 KB, sem erros.
- **`beta49.py` atualizado:** o mapa fixo deu lugar às orientações. 39 ok.
- **Regressão, tudo passando:**
  - no navegador: beta37 (8), beta38 (87), beta39 (94), beta40 (128), beta41 (72), beta42 (12), beta43 (78), beta44 (51), beta46 (29), beta48 (56), casa-dois-celulares (30), registro-series (23), serie-descanso (24), cronometro (21), compartilhar (10), acessibilidade (7);
  - em Node: troca-sem-repetir (38.584), corrida-tempo-limite (104.320), regras (61), sincronizacao (18), semana-menos-tempo (34), beta35 (23), auditoria-musculacao e simulacao-corrida (nenhum problema).

## 4. Não alterado
- **Motor de treino e histórico:** o gerador de treinos, as regras de progressão de carga, o registro de séries e o histórico de musculação continuam como estavam.
- **Proporções:** nenhuma mudança de formato pelo peso ou pela altura.

## 5. Pendências (honestas)
- **Desenho:** foi feito à mão em vetor, por coordenadas, e conferido em prints de celular e computador nos temas escuro e claro. É um atlas simplificado por grupos musculares: o deltoide é uma placa só, sem as três porções separadas. Se você quiser um nível de detalhe de atlas médico (cada porção do músculo), o caminho seria encomendar ou licenciar uma ilustração vetorial profissional e trocar apenas as coordenadas das placas, porque o resto do mapa não muda.
- **Série de aquecimento no registro:** como o registro não tem esse campo, a separação depende de o aluno não registrar o aquecimento, e a orientação diz isso explicitamente. Se quiser um botão "série de aquecimento" no registro, que fique fora da evolução, é uma mudança no registro de séries e precisa da sua decisão.
- **Celulares reais:** o teste em Android, iPhone e computador foi feito com o tamanho de tela de cada um no Chromium. Vale conferir nos aparelhos reais pelo roteiro.

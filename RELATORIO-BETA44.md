# MetaTreino 2027.1 Beta 44 — Relatório

Base: Beta 43 (inclui tudo da Beta 42 parte 2 e da Beta 43). Regras do Firestore iguais às da Beta 43.

## O que foi corrigido (a partir dos vídeos)

### 1. Escolha do visual (cadastro e Perfil › Aparência)
- **Travava ao tocar no botão:** "Usar este tema" redesenhava o carrossel inteiro a cada troca. Agora o carrossel é criado uma vez e só marca qual tema está em uso.
- **Deslizar não trocava o visual:** agora o tema do centro é aplicado sozinho quando o deslize para (evento `scrollend`, com reserva para aparelhos sem ele). Tocar num tema ao lado centraliza e aplica.
- Saíram as setas e o botão "Usar este tema". Temas Premium para quem é Básico mostram "Disponível no Premium · conhecer" e não são aplicados.
- "Continuar" centralizado na primeira etapa. O botão "Voltar" escondido ocupava espaço invisível; agora some de verdade.
- Primeira etapa mais compacta: os três passos aparecem só com o título, a prévia ficou mais baixa e o "Estilo dos ícones" aparece sem rolar a tela, a partir de 640 px de altura.
- Perfil › Aparência usa o mesmo carrossel.

### 2. Conquistas
- **No fim do registro:** ao salvar treino, corrida ou atividade, as conquistas desbloqueadas nos 2 minutos seguintes aparecem numa janela ("Ver todas as conquistas" / "Continuar"). A janela espera a tela de resumo do registro fechar. Fora disso (abrir o app, sincronizar de outro aparelho) nada pula na tela.
- **Ponto na aba Desafios** enquanto houver novidade ainda não apresentada na aba Conquistas.
- **"Novas" não somem ao abrir uma:** antes, abrir a aba marcava tudo como visto. Agora cada conquista fica destacada até abrir o detalhe dela, tocar em "Marcar todas como vistas" ou passar 7 dias. A animação não se repete.

### 3. Trocar exercício
- "Equipamento ocupado": primeiro, opções em **outro** equipamento. O mesmo tipo de aparelho (máquina, polia, Smith ou barra) vai para "No mesmo tipo de equipamento", no fim.
- "Prefiro outro": primeiro, "No mesmo tipo de equipamento" (ajuste e carga parecidos), depois as demais.
- Quando a biblioteca não tem outra opção no mesmo equipamento, as duas abas mostram os mesmos exercícios (não há o que diferenciar), mas cada uma explica o critério.
- Equipamento corrigido em 10 exercícios que caíam em "peso do corpo": Puxada com Triângulo (polia), Desenvolvimento Arnold, Elevação Posterior Curvado, Rosca Spider e Rosca Concentrada (halteres), Rosca Scott no Banco e Elevação Pélvica (barra), Panturrilha Sentada e Donkey (máquina), Cadeira contra a parede (peso do corpo, antes "máquina").

### 4. Revisão dos 123 exercícios
- **Fichas "Como executar" erradas:**
  - Remada na Máquina (Hammer) mostrava a do supino.
  - Tríceps Coice mostrava a do glúteo.
  - Panturrilha no Leg Press mostrava a do agachamento.
  - Farmer Walk, Pallof Press e Mountain Climber mostravam a do abdominal.
  - Flexão Pike Elevada e Flexão Fechada mostravam a da flexão comum.
  - Superman, Elevação Y, Elevação Posterior e Cadeira contra a parede tinham texto genérico.
- **Remada Curvada com Barra** estava liberada para quem só tem halteres.
- Panturrilha no Leg Press era tratada como agachamento na troca de exercícios.
- Nenhum nome duplicado e todos com equipamento definido.
- Todos os `onclick` das 5 abas apontam para funções existentes.

### 5. Início e dia sem treino
- Card "Primeiros passos" sem "Ver treino" (já está logo abaixo) e sem "Como executar" (cada exercício tem "Ver como fazer").
- "Não vou treinar hoje": o aviso "Voltar atrás" sobe para o topo da sessão e os exercícios ficam esmaecidos. "Registrar" pergunta antes ("Sim, vou treinar" / "Continuar descansando"). Vale também para a corrida.

## Arquivos alterados
- `app.js`: equipamento da Remada Curvada com Barra; versão.
- `index.html`, `service-worker.js`, `app-plus.js`: versão e remontagem.
- `fonte/app-plus/05-home-inteligente-meta-assistente.js`: primeiros passos.
- `fonte/app-plus/33-cadastro-em-etapas.js`: "Voltar" oculto não ocupa espaço.
- `fonte/app-plus/41-substituicao-favoritos.js`: motivos da troca, equipamento, padrão da panturrilha.
- `fonte/app-plus/42-conquistas-desafio-mensal.js`: novas persistentes.
- `fonte/app-plus/45-temas-carrossel-ilustracoes.js`: carrossel só de deslizar.
- `fonte/app-plus/48-fim-registro-descanso.js` (novo).
- `testes/beta44.py` (novo) e `testes/beta41.py` (atualizado para a nova regra das "novas").

## Limitações
- Vídeos dos exercícios vêm do Firestore; aqui não dá para conferir se cada link está certo.
- A janela de conquistas usa um intervalo de 2 minutos após salvar o registro.

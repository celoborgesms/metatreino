# Roteiro de testes em aparelho real — MetaTreino Beta 42

Leva uns 50 minutos. Anote **modelo do celular, sistema (Android/iOS) e navegador**, e mande print de tudo o que parecer estranho. As regras do Firestore não mudaram nesta versão.

## 00000. 2027 RC 8 — em aparelho real
Perfil deve mostrar "2027 RC 8".
1. **Sono → Dormi / acordei:** 23:00 e 07:00, e 25 em "Acordado no meio da noite". O total mostra "Dormiu 7 h 35 (8 h na cama − 25 min acordado)". Salve e reabra: continua 25.
2. **"Só o total":** o campo de tempo acordado não aparece.
3. **Cochilos:** "+ Adicionar cochilo", 30 min. O total mostra o cochilo e o total do dia. Salve: o atalho do Início mostra "+ cochilo 30 min".
4. **Histórico do sono:** a noite mostra "25 min acordado · + cochilo 30 min", e aparece "Cochilos (30 dias)". A média das noites não muda por causa do cochilo.
5. **Apagar:** tire o cochilo (✕) e salve. Ele some, inclusive no outro aparelho depois de sincronizar.

## 00000. 2027 RC 7 — em aparelho real
Perfil deve mostrar "2027 RC 7".
1. **Personalizar início:** não há mais "Desafio temático"; "Desafio do mês" continua.
2. **Progresso → Desempenho:** o desenho do canto não encosta no cartão das Metas. Mude a ordem dos blocos e confira de novo.
3. **Painel → Desafios temáticos → Editar** um desafio criado: "Apagar desafio" pede confirmação e o desafio some da lista e dos alunos.
4. **Painel → Personalizar** um automático, salvar e depois "Apagar a personalização": o automático volta.
5. **Início:** sem "Ocultar" na Atividade da semana e sem a seta em Seus treinos; os dois abertos.

## 00000. 2027 RC 6 — em aparelho real
Perfil deve mostrar "2027 RC 6".
1. **Meta do mês:** Desafios → Conquistas → toque numa meta do mês nova. A medalha aparece desenhada, com o nível.
2. **Dois treinos no dia** (musculação e corrida no plano no mesmo dia): registre só um. O cartão do topo diz "Ainda falta …" e o botão leva à outra modalidade. Registre o outro: aí aparece "Feito por hoje".
3. **Antes de treinar** nesse dia, a dica "Corrida + musculação hoje" fica logo abaixo do seletor, antes do treino de hoje.
4. **Aniversário** (ponha a data de nascimento de hoje no perfil, de teste): bolo desenhado, nenhuma estrela, nenhum emoji no texto.
5. **Sono, sem registrar hoje:** o atalho mostra "Hoje: toque para registrar · média 7 dias …" e abre o histórico com as noites anteriores.
6. **Sono em linha inteira** (número ímpar de indicadores): as 7 noites em barras ao lado.
7. **Dados do navegador limpos:** limpe, entre de novo e abra o Sono. As noites anteriores aparecem sem precisar registrar a de hoje.

## 00000. 2027 RC 5 — em aparelho real (pequenas correções)
Faça no celular, com o app atualizado (Perfil mostra "2027 RC 5").
1. **Sono, arrastando:** Início → Sono → Dormi/acordei → toque em "Acordei" → arraste os minutos até 52. Confirme. O campo mostra 11:52 (não 11:50).
2. **Sono, digitando:** abra de novo → "Digitar" → digite 1152 ou 11.52 → Confirmar. O campo fica 11:52 e o total do sono usa esse minuto.
3. **Compartilhar → Quadrado:** em Destaque, Números e Faixa (com e sem "Mostrar meu primeiro nome"), nenhum texto encosta na logo ou no "METATREINO". Repita em Feed e Stories.
4. **Início:** embaixo do seletor Musculação/Corrida não existe mais a segunda linha com os dois nomes.
5. **Conquistas novas:** Desafios → Conquistas → toque numa "Medalha do mês" em Novas. Abre a tela dela, com "Voltar às conquistas"; ao voltar, só ela saiu das novas.
6. **Clima:** feche o app de vez, abra no Início com a localização ligada e espere alguns segundos sem tocar em nada. O desenho do céu acompanha o clima mostrado no selo (ex.: nublado), sem trocar de aba.
7. **Atividade da semana:** aparece em anéis. O centro mostra "x/y treinos". Tocar em "Treinos do plano", "Séries" e "Semanas na meta" abre detalhes diferentes.

## 00000. 2027 RC 4 — em aparelho real (Android, iPhone e computador)
Leva uns 40 minutos. Anote o modelo do celular e mande print do que parecer estranho. **As regras do Firestore não mudaram.**

**Sono**
1. Início › Sono › "Só o total": digite 6 h e **37** min (qualquer minuto de 0 a 59 é aceito). Salve e reabra: tem que aparecer 6 h 37 no Início, na lista de noites e na média. Tente 75 minutos: o app avisa e não salva.
2. "Dormi / acordei": 23:40 e 06:55 → total 7 h 15. Uma noite antiga (de antes desta versão) continua aparecendo com o mesmo valor de antes.
3. Progresso › Sono e recuperação: as cores da qualidade são vermelho, laranja, amarelo, verde e azul (dá para distinguir no sol?). Em "Sono e atividade física", a comparação só aparece com dados suficientes e diz que é associação, não causa.

**Tempo das atividades**
4. Registre uma caminhada avulsa com 1 : 19 : 20 (h : min : s). Abra pelo Histórico e edite a duração: os três campos (horas, minutos, segundos) aparecem preenchidos. Troque para 1 : 02 : 42 e confira no histórico, no card de compartilhar e no PDF.

**Musculação: dois treinos no mesmo dia**
5. Faça o treino do dia e salve. Depois, no mesmo dia, abra outro treino que repita um exercício (ex.: prancha) e registre: ele **não** pode aparecer já feito com as séries do primeiro treino. Salve. No Histórico, cada treino mostra só as próprias séries (abra os dois). Compartilhe cada um: as séries são diferentes. Exclua o segundo (limpando as séries): o primeiro continua inteiro.

**Aba Treinos**
6. Abra um treino de outro dia, vá para o Início, espere alguns segundos e volte para Treinos: abre o treino de **hoje**. Comece um treino (registre uma série), vá para outra aba e volte: o treino em andamento continua com a série. Em dia sem treino, a aba abre no próximo treino da semana.

**Início: musculação × corrida**
7. Num dia em que só a corrida tem treino, com Musculação selecionada: o cartão diz "Musculação: descanso hoje" e o que a corrida tem hoje; a saudação não fala em descanso geral. A linha "Hoje" (abaixo do seletor) mostra as duas modalidades.
8. Depois de treinar pernas, no dia seguinte registre uma **caminhada leve** (esforço até 6): o aviso "faça a corrida de hoje em ritmo leve" tem que sumir.
9. Com chuva, as dicas de clima aparecem recolhidas (uma linha + "mais dicas"). A frase "Depois do dia corrido" não aparece mais.

**Análise e assistente**
10. Pergunte ao assistente "análise do mês". Se o plano começou neste mês, ele diz a data de início e não diz que você "planejou demais"; com poucos dias de plano, a mensagem é neutra.
11. Se o balão do assistente aparecer, ele já traz a dica (ex.: pernas se recuperando). Depois do treino do dia, o balão "dica para hoje" não aparece.

**Atividade da semana e compartilhamento**
12. Toque no placar, num dia, em "Séries", em "Semanas na meta" e em "Extras": cada um abre um detalhe diferente. Confira em tema claro e escuro.
13. Compartilhe um treino de musculação: o número grande são as séries. Ligue "Mostrar volume registrado (kg)": aparece "Volume registrado: … kg (soma de carga × repetições)". Desligue: some.
14. Com foto da galeria: escolha "Em cima" e "Embaixo" em Posição dos dados; os dados ficam legíveis e dentro da imagem. Em Marca, "Logo do MetaTreino" usa a logo cadastrada no painel; "Só o ícone M" volta ao M. Confira com e sem o nome.

**Conquistas e Desafios**
15. Ganhe uma conquista ao registrar (ex.: primeiro treino de uma conta de teste): **não** abre janela grande; aparece um aviso pequeno no rodapé "Nova conquista desbloqueada". Toque nele: abre Desafios.
16. Desafios: a ordem é Desafio atual → (Em grupo, se tiver grupo) → Conquistas → Histórico → Em breve. Semanas do desafio antes do início do seu plano aparecem como "Antes do início do seu plano". "Disponíveis" abre as conquistas já filtradas.
17. Início: não tem mais Conquistas. Em Personalizar início, esconda 1, 2 e depois 3 indicadores: os que sobram ocupam a linha sem buraco (o último sozinho ocupa a largura toda). O desafio do mês aparece numa linha só (some quando o desafio é concluído).
18. Conta em dupla: os dois celulares mostram a seção "Em grupo" em Desafios.
19. Ícones: confira "Nem a Preguiça" (bateria), "Sem Drama" (calendário com check), "Sabedoria" (escudo com coração), "Sofá Que Espere" (calendário S·D), km caminhados e pedalados com o desenho da modalidade.
20. O boneco da corrida (seletor Musculação/Corrida) tem as duas pernas.

## 00000. 2027 RC 3 — em aparelho real (Android, iPhone e computador)
**Contas e sessão**
1. Entre com a conta A, escolha um tema e converse com o Meta Assistente. Saia. A tela de entrada volta no tema padrão.
2. No mesmo celular, entre com a conta B: o tema é o padrão (ou o da conta B), a conversa da A não aparece e o nome, o histórico e os dados são da B. Saia e entre com a A de novo: o tema da A volta.
3. Deixe o app aberto no Início por 20 a 30 minutos. Use outros apps e volte algumas vezes. Ele **não** pode reiniciar nem passar pela tela de login. Anote se acontecer, com o horário e o que estava aberto.

**Musculação**
4. Treino do dia, com cargas diferentes por série (ex.: 21, 27, 27 kg). Salve com esforço 8. O cartão mostra "Esforço 8/10" e a etiqueta "Ref." no exercício (o 1º registro não é PR).
5. No dia seguinte, abra o mesmo treino, registre e toque em "Salvar treino adicional". Ele aparece no Histórico como "(adicional)".
6. Dois dias depois: a semana não mostra "faltou" no dia do treino feito; o treino continua "concluído".
7. Num treino com prancha, toque em ▶ numa série. Bloqueie a tela por uns 20 s e volte: o tempo continua certo. Toque em Concluir série e confira o tempo gravado. Faça outra contagem e feche o registro no meio: nada pode ser gravado.
8. Num exercício com o peso do corpo (flexão, barra fixa): toque em "+ Usei carga extra", registre 10 kg. Depois toque em "Ocultar" e confira em Perfil › Treino que dá para mostrar de novo.
9. Gere o PDF (Seus dados › Relatório): na seção "Séries registradas", cada série aparece com a carga dela.
10. Compartilhe o treino: o card mostra as séries concluídas (sem "toneladas"). Compartilhe a semana: aparece o período e cada atividade com o dia.

**Dupla**
11. As duas pessoas abrem Treinos › Equipamentos: a lista é a mesma do Perfil, sem repetição. Marque 0 em um aparelho e confira que o Perfil mostra "personalizado" sem ele.
12. Uma pessoa troca um exercício com "Equipamento ocupado": a outra não pode ganhar pendência nova por isso.
13. Treinem no mesmo horário e salvem (cada um no seu celular). A conquista "Parceiros de Treino" precisa aparecer nos **dois** aparelhos, mesmo para quem salvou primeiro.

**Descanso, sono e Início**
14. No dia do treino, toque em "Não vou treinar hoje": a semana mostra "desc." nesse dia. No dia seguinte, o treino daquele dia não aparece como pulado. Em dia sem treino no plano, o botão nem aparece.
15. No Início, o atalho "Sono" fica no lugar da Água. Registre dormir 23:40 e acordar 06:55: o total aparece na hora (7 h 15). Em Alimentação, use +250/+500 da água.
16. Confira a "Atividade da semana" nova em tema claro e escuro, em 360 px e no computador.

## 00000. 2027 RC 2 — rotina real
1. Som do cronômetro › Testar vibração › "Não senti": as opções de vibrar somem; "Testar de novo" devolve.
2. Importe um .fit do relógio: aparece a régua de esforço sem nada marcado (ou "informado no relógio"). Salve sem responder; depois abra a atividade › Informar o esforço.
3. Importe e escolha "Este treino era do seu plano?": o dia do plano fica feito. Com "atividade extra", ele não fica feito.
4. Faça uma corrida extra puxada na véspera de um treino intenso: o cartão da corrida mostra a orientação de recuperação. Caminhada leve: nada.
5. Progresso › Sono e recuperação › Ligar. Na manhã seguinte, responda na Home com um toque. Veja o gráfico.
6. Cardápio compartilhado (administrador): escolha "Grupo todo", tire um alimento, toque em Desfazer. Troque para "Só para mim" e troque o prato.
7. Meu grupo › Desafio juntos: as duas pessoas entram com metas diferentes; confira o "x/meta" de cada uma.
8. Conta nova: a Home começa sem Água, Frase e Fase do plano.

## 00000. 2027 RC 1 — APK e vibração
1. Som do cronômetro › Testar vibração: o celular vibra? Se não, siga o texto que aparece (vibração do sistema, economia de bateria, Não perturbe).
2. Toque nos botões de esforço (fim do treino) e deslize no início: agora dá para sentir o toque.
3. Deixe um descanso acabar com o app aberto e toque na tela logo em seguida: a vibração do alarme não é cortada.
4. APK: instale pelo Releases, abra pelo ícone; sem barra de endereço; faça login com Google; modo avião → o app abre; publique uma versão nova do site e confira que o app atualiza sem reinstalar.

## 00000. 2027 RC 0 — cronômetro, cardápio compartilhado, jornada e progressão
1. Registro de séries: conclua uma série → o cronômetro aparece DENTRO da tela, abaixo das séries, sem cobrir Salvar. Toque em Pausar, ±15 s e Pular.
2. Com o descanso rodando, toque em Voltar → aparece a pílula ao lado do botão do assistente. Troque de aba: a pílula continua com o tempo certo. Toque nela → cartão com "Voltar ao treino"; a seta minimiza.
3. Deixe acabar: nos últimos 10 s fica amarelo, nos últimos 3 s vermelho; toca e vibra uma vez só (confira com o som e a vibração desligados também).
4. Bloqueie a tela no meio do descanso e volte depois do fim: o app avisa que terminou (no Android às vezes toca bloqueado; no iPhone não).
5. Perfil › Meu grupo e Plano alimentar: nenhum texto fala em "casa". Lista de compras do grupo: botões "Só eu" e "Grupo todo".
6. Adicionar alimento: busque "miojo", "air fryer", "toddynho", "kefir". Toque num alimento do cardápio › Trocar por outro: aparecem saudáveis novos (ex.: batata na air fryer, quinoa), nunca miojo/calabresa.
7. Corrida no nível Iniciante: cartão "Jornada do primeiro passo" com o estágio e "Nesta semana: X de 2". Leia uma lição › Entendi · próxima. Ocultar e mostrar de novo (Evolução da corrida).
8. Musculação: aba Treinos › Progressão das cargas. Confira um exercício parado há semanas ("Rever").
9. Modo avião com o app instalado: gere o PDF do treino (antes falhava na 1ª vez).

## 00000. Beta 64 — equipamentos, Minha casa no Perfil, alimentos e backup
1. Treinos (musculação): role até o fim. Deve haver só o link "Equipamentos da academia". Toque: abra "Meus equipamentos", marque **0** na Polia e **2+** em Halteres — a lista continua aberta e a tela não pula. Aparece "exercícios usam algo que você marcou que não tem" e "Organizar o meu plano" troca o exercício de polia. "Desfazer" volta.
2. Perfil › **Minha casa**: crie o grupo (ou entre com o código). A tela mostra Pessoas aberto, Refeições da casa recolhido, Lista de compras e Cardápio em PDF lado a lado, Treino em dupla e "Sair do grupo" no fim. No segundo celular, entre com o código pelo Perfil.
3. Alimentação: troque o prato do almoço. Os gramas de Proteína/Carbo/Gordura na barra mudam (o número pequeno é a meta).
4. "+ Acrescentar alimento": busque "ovo frito", "refri zero", "pinga", "garapa", "cafe com leite" (sem acento). Veja as categorias Bebidas e Pratos e misturas.
5. Perfil › Seus dados: baixe um backup e restaure o mesmo arquivo. Deve pedir confirmação e restaurar (desde a Beta 52 isso falhava em silêncio).
6. Perfil › Estou com dor › Ombro › Salvar. Depois "Estou sem dor". Os exercícios voltam **exatamente** como estavam.
7. Refaça o plano de musculação com 3 dias e 30 min: cada treino deve mostrar ~30 min (não 45).

## 00000. Beta 63 — motor individual e treino em dupla
- [ ] Alterar plano › Sua semana: escolher 45 min → nenhum treino passa de ~45 min (ou aparece o aviso).
- [ ] Experiência: marcar Glúteos como prioridade → o treino de pernas começa por glúteo.
- [ ] Você e a Emilly (mesmo grupo da casa): Treinos › "Treino em dupla" → ligar nos dois celulares → conferir a semana e os aparelhos em comum.
- [ ] Informar os aparelhos que vocês têm 2 ou mais (ex.: halteres) → os conflitos somem da lista.
- [ ] "Organizar o meu plano" → conferir se as trocas fazem sentido → "Desfazer" volta tudo.
- [ ] O plano da outra pessoa, a corrida e o cardápio não mudam.
- [ ] Treinar no mesmo horário que a outra pessoa (os dois registram) → conquista "Parceiros de Treino".
- [ ] Conquistas: categorias Calistenia, Híbrido e Treinando juntos; ícone do tênis nas corridas.

## 00000. Beta 58 — auditoria
- [ ] Conta nova com plano para daqui a alguns dias (e com um treino importado antigo): Início sem "Pausa curta"/"dias sem treinar"; sem "A Volta por Cima".
- [ ] Integrações › Registro técnico: tocar num item cancelado, num com erro e num de atividade excluída → abre o detalhe; "Remover este registro" funciona.
- [ ] Abrir uma atividade importada de verdade (a do vídeo): abre; se algo falhar, aparece o aviso com "Excluir" (não fica sem resposta).
- [ ] Lista de compras › "Lista de compras em PDF": só a lista, por categoria. "Plano alimentar em PDF": só o cardápio. Imprimir os dois.
- [ ] PDF do treino: figura com músculos da semana; tabela legível na tela e impressa.
- [ ] Calendário num dia com várias conquistas: elas ficam em "🎖️ N conquistas neste dia", recolhidas.
- [ ] Mapa muscular › Treino de hoje: músculos fora do treino apagados e sem ficha; Explorar com o corpo todo.
- [ ] Histórico › treino com cargas diferentes por série: cada série aparece.
- [ ] Casa pareada: Perfil › Começar do zero → depois do cadastro, o grupo da casa continua (as duas pessoas).
- [ ] Celular pequeno (iPhone SE / Android 360): Treinos com os atalhos numa linha e os botões do exercício em duas linhas; Conquistas com os 4 filtros numa linha.

## 00000. Beta 56 — acabamento visual
- [ ] Tema claro (Coral, Claro, Areia): "Seu primeiro treino é…" legível; nenhum texto apagado nas abas.
- [ ] Treinos da corrida com 4 dias "Caminhada ativa": tudo dentro dos cartões.
- [ ] Atividade importada: gráficos separados (ritmo, FC, altitude) e percurso com início, fim, setas e km.

## 00000. Beta 55 — auditoria
- [ ] Sair e entrar com o Google: sem "O app demorou para abrir" e sem a etapa "Escolha o visual" piscando.
- [ ] Com a caminhada antiga importada: Início da musculação sem "De volta depois de 53 dias"; na corrida, o aviso só da corrida.
- [ ] Importar um arquivo que desbloqueia conquista: a janela de conquistas aparece ao terminar.
- [ ] Abrir uma atividade importada: compartilhar (com percurso), "Dados do arquivo original", excluir.
- [ ] Conquistas: com 2+ novas, tocar em uma e conferir que só ela sai; fechar, abrir em outro aparelho.
- [ ] Desafios: seção "Novidades" e o número na aba somem depois de ver tudo.
- [ ] Progresso sem o seletor; Treinos (musculação) com "Importar do relógio".
- [ ] Registrar 8 km em 10 min: o app pergunta; salvo assim, não vira recorde.
- [ ] Alimentação: trocar uma fruta e uma proteína; desfazer; na Casa, conferir que o outro celular não mudou.
- [ ] Celular pequeno (≈ 360 px): Desempenho, Conquistas, Cardio e Treinos sem nada escondido para o lado.

## 00000. Beta 54 — integrações e atividades
- [ ] Importar FIT, TCX e GPX reais (Zepp, Garmin, Strava…) de corrida, caminhada, bike e musculação; conferir com o app de origem.
- [ ] Duplicado (mesmo arquivo e registro manual), arquivo cortado, rota sem horário.
- [ ] Android, iPhone e computador; abrir em outro aparelho (os números aparecem, o percurso fica no aparelho que importou).

## 00000. Beta 53 — calorias do dia
- [ ] A meta muda entre descanso, musculação, corrida, longão e dia com dois treinos; o quadro "de onde vêm as calorias" está certo.
- [ ] Corrida avulsa registrada hoje soma; treino pulado sai da conta; dia passado sem registro = descanso.

## 00000. Beta 52 — casa e cardápio
- [ ] Casa: tirar/acrescentar no prato mostra "recomendado → com o ajuste" para cada pessoa; "Manter as calorias de cada um" recalcula.
- [ ] PDF da casa por pessoa; lista de compras somada; "Fora da rotina" no Adicionar alimento.

## 00000. Beta 51 — Progresso
- [ ] Desempenho: ordem fixa (a Anatomia não desce), só blocos da modalidade ativa, seletor Musculação | Corrida.
- [ ] Personalizar progresso: Básico (Completo / Só o essencial) e Premium (bloco a bloco, arrastar, padrão).

## 00000. Beta 50 — anatomia muscular e orientações
- [ ] Treinos sem mapa fixo; Orientações (Preparação / Sessão de treino / Finalização) mudam conforme o dia (peito × pernas × costas × ombro).
- [ ] Mapa: masculino, feminino e sem sexo no perfil; FRENTE/COSTAS; toque nos músculos (também nas bordas); ficha completa.
- [ ] Entradas: "Ver músculos trabalhados", Progresso › Anatomia muscular, ficha do exercício › Ver no mapa (✕ volta para a ficha).
- [ ] Android, iPhone e computador.

## 00000. Beta 49 — casa, conquistas e corrida
- [ ] **Segunda rodada:** trocar exercício sem nome em comum entre "Equipamento ocupado" e "Prefiro outro"; cartão de etapas e "Músculos trabalhados" na sessão de musculação (toque, Hoje/Semana, feminino/masculino); plano alimentar e casa sem piscar nem subir; tabela de planos sem arrastar; aviso de feriado só com academia ou esteira.
- [ ] **Casa com dois celulares** (contas diferentes): criar o grupo numa conta comum funciona; o outro entra pelo código; mesmo prato, quantidades diferentes; só o administrador troca o prato e tira/acrescenta alimentos; lista "Casa toda" mostra a parte de cada um; PDF da casa; passar a administração; sair.
- [ ] **Conquistas:** conta nova de corredor experiente (tempo recente de 21 km no cadastro) → primeiro registro de 21 km mostra no máximo 5 cartões, com "Primeira atividade no MetaTreino" e "Experiência reconhecida". Conta de iniciante → os primeiros 5 km aparecem como conquista nova.
- [ ] **Desafios:** sem botão "Participar"; "você está participando". Sair do desafio → não volta sozinho. "Medalhas e metas" separa medalhas de desafio das metas do mês.
- [ ] **Corrida 20 ou 30 min:** nenhum treino da semana passa do tempo; treino forte que não cabe vira sessão curta com o motivo.
- [ ] **Trocar exercício:** troque um exercício, depois abra a troca de outro: o que saiu não aparece como sugestão.

## 0000. Beta 44 — uso do dia a dia
- [ ] Cadastro: deslize os temas e solte — o visual muda sozinho; "Continuar" no centro; "Estilo dos ícones" visível sem rolar.
- [ ] Perfil › Aparência: mesmo carrossel, sem setas, sem travar.
- [ ] Registre uma corrida/treino que desbloqueie conquista: ao tocar em Continuar no resumo, aparece a janela das conquistas.
- [ ] Ponto vermelho na aba Desafios até abrir a aba Conquistas.
- [ ] Em Conquistas, abra uma nova e volte: as outras continuam como "novas".
- [ ] Trocar exercício de máquina: "Equipamento ocupado" e "Prefiro outro" mostram ordens diferentes.
- [ ] "Como executar" de Remada na Máquina, Tríceps Coice e Panturrilha no Leg Press.
- [ ] Marque "Não vou treinar hoje" e toque em Registrar: aparece a pergunta para voltar a treinar.

## 000. Beta 43 — acesso e receitas
- [ ] Publique o `firestore.rules` da Beta 43.
- [ ] Conta com e-mail recém-confirmado entra direto (sem "Não foi possível acessar sua conta").
- [ ] Forçando falha (ex.: modo avião depois do login, cache limpo): a tela mostra só a mensagem amigável, "Tentar novamente" e o suporte — nenhum termo técnico nem e-mail.
- [ ] Painel › Diagnóstico de acesso lista a falha (sem e-mail) e o principal consegue apagar.
- [ ] Plano alimentar › "Lanches para sair da rotina": categorias, favoritas, abrir receita, trocar versão, trocar a refeição (Jantar/Almoço/Lanche), "Receita toda".
- [ ] Ative "Sem glúten", "Sem lactose" e "Vegetariano": as receitas que não combinam vão para a lista à parte, com o motivo.
- [ ] "Usar no lugar do jantar" registra; "Voltar ao recomendado" desfaz.
- [ ] Celular pequeno (320–360 px): sem rolagem lateral.

## 00. Beta 42 (parte 2) — cadastro, entrada, exclusão, backup, temas
- [ ] Criar conta com e-mail e senha → confirmar → "Já confirmei": entra sem novo login?
- [ ] Cadastro mostra o aviso dos 30 dias e "Como funciona"? Ao concluir o perfil aparece a data de término?
- [ ] Conta de e-mail → sair → "Continuar com Google" (mesmo e-mail): pede a senha uma vez e entra na MESMA conta?
- [ ] Conta do Google: Perfil › Formas de entrar › Criar senha; depois entrar com e-mail e senha: mesma conta?
- [ ] Painel: excluir um aluno de teste — sem digitar e-mail, sem repetir, painel aberto, seus treinos intactos?
- [ ] Atualizar / entrar de novo no painel: o excluído não reaparece?
- [ ] Backup: restaurar na própria conta (funciona) e em outra conta (recusa).
- [ ] Temas em carrossel; Ametista e Coral como "Premium"; escolha mantida ao reabrir.
- [ ] Ilustrações de Perfil, Histórico, Desafios e Corrida nos temas claro e escuro.
- [ ] Montar um plano no Android: dá para ler cada etapa?

## 00a. Beta 42 — motivo da troca
- [ ] Trocar um exercício com equipamento (ex.: supino na máquina): aparece "Equipamento ocupado"?
- [ ] Trocar um exercício de peso do corpo (ex.: flexão, prancha): aparece só "Alternativa para este grupo muscular", sem a palavra "ocupado"? As opções são do mesmo grupo e os favoritos compatíveis vêm primeiro?
- [ ] Depois de salvar o treino, o Histórico mostra "alternativa para o grupo muscular"?

## 00a. Beta 41 — troca de exercício, favoritos, conquistas e visual (o mais importante desta versão)

**Troca de exercício**
- [ ] Treinos › um exercício › **Trocar**. Aparecem "Mais compatíveis", "Compatíveis" e "Alternativas secundárias"? As primeiras fazem sentido para a academia onde você treina?
- [ ] Alterne "Equipamento ocupado" / "Prefiro outro": a ordem muda para exercícios no mesmo tipo de equipamento?
- [ ] Escolha uma opção: o cartão mostra "Só neste treino", a carga sugerida, **Desfazer** e **Salvar no plano**? Séries e repetições continuam as mesmas?
- [ ] Registre séries no substituto e salve o treino. No Histórico, o detalhe mostra "no lugar de …"?
- [ ] No dia seguinte, o exercício original voltou sozinho ao plano?
- [ ] "Salvar no plano" pede confirmação e a troca passa a valer nos próximos treinos?
- [ ] Calistenia: "Trocar" continua mostrando a progressão da cadeia?

**Favoritos**
- [ ] Biblioteca: a estrela favorita sem abrir a ficha? O filtro **Favoritos** lista só eles?
- [ ] Ficha do exercício e cartão do treino têm a estrela? Abra em outro aparelho: os favoritos aparecem lá?
- [ ] Favorite um exercício compatível: ele aparece primeiro na troca?

**Conquistas e desafio mensal**
- [ ] Ao bater uma conquista no fim do treino, **nenhuma janela abre**? O cartão do Início mostra "Novidade" (parado)?
- [ ] Desafios › Conquistas: as novas entram com animação? Raras/especiais têm brilho discreto? Ao reabrir, não repetem?
- [ ] Abra Conquistas no outro aparelho: as já vistas não aparecem de novo?
- [ ] Na virada do mês (ou depois de dias sem abrir): nada aparece sozinho no Início; ao abrir Conquistas aparece "Desafio mensal encerrado!" uma vez?

**Visual e fluidez**
- [ ] Troque entre os 10 temas: cada um tem cara própria (botões, cartões, barras), sem texto apagado?
- [ ] Fundos decorativos de cada aba: bonitos, discretos, sem cobrir cartões?
- [ ] Janelas, abas e botões: transições suaves? Com "Remover animações" ligado no aparelho, nada anima?
- [ ] Montar um plano novo: a tela de montagem dura uns 2–3 s e termina em "Plano pronto"?
- [ ] Rolagem da Biblioteca, Histórico e Conquistas no Android: fluida?


## 00b. Beta 40 — planos, PDFs e cadastro

**Planos**
- [ ] Conta nova com **Google**: entra direto no cadastro? Perfil mostra "Teste Premium: 30 dias"?
- [ ] Conta nova com **e-mail**: pede para confirmar o e-mail? Depois de confirmar, entra com o teste?
- [ ] Criar conta só com usuário (sem @): o app pede e-mail real ou Google?
- [ ] Painel › conta de teste › **Passar para Gratuito**. No celular dela (reabrindo): aparece o aviso, o tema Premium vira Brasa/Areia e nada some do histórico?
- [ ] Gratuito: musculação e corrida funcionam? Vídeo do exercício abre durante o treino? Biblioteca, plano alimentar e PDFs mostram o aviso Premium com o contato?
- [ ] Gratuito: o Início não pede localização?
- [ ] Painel › **+30 dias**: no celular da pessoa, Premium volta e o tema escolhido também?
- [ ] **Suspender conta** com motivo: a pessoa vê "Conta suspensa" e o motivo? **Desbloquear** devolve o acesso?
- [ ] **Remover administrador**: no celular do administrador secundário, o painel some na hora? A conta continua como aluno?
- [ ] **Excluir conta**: sem a função publicada, o painel diz que nada foi excluído? Com a função (plano Blaze), a conta some também do Authentication?

**PDFs (Premium)**
- [ ] Plano › "Baixar o plano em PDF" (musculação e corrida), Plano alimentar › PDF, Perfil › Relatório: abrem, imprimem legíveis e com as cores do tema?

**Cadastro e treino**
- [ ] Registrar peso: Cancelar fecha sem salvar? Mudar o valor e tocar fora pergunta se quer descartar?
- [ ] Etapa 1: tema e estilo dos ícones juntos? Escolher emojis e terminar o cadastro: os emojis aparecem?
- [ ] Data de nascimento: dia 31, passe por fevereiro e volte para março — o dia continua 31?
- [ ] Altura e peso: aparece o "IMC estimado" discreto?
- [ ] Nível de atividade e objetivo: só a explicação da opção escolhida?
- [ ] Calistenia e Híbrido: o objetivo mostrado bate com a opção marcada? A explicação muda ao trocar?
- [ ] Data de início em branco: a mensagem diz o dia certo do primeiro treino?
- [ ] Corrida › tempo recente: abre o seletor do app (não o do Android)? Confirmar e Cancelar funcionam?
- [ ] Marque "Joelho" nas limitações: o treino de pernas mostra o aviso de adaptação e não tem agachamento livre, afundo nem salto?
- [ ] Corrida com terreno Trilha: as metas aparecem por esforço (sem ritmo por km)? Esteira: aparece a velocidade em km/h?

## 00b. Beta 39 — réguas, evolução e provas

**Réguas por gesto** (celular de verdade: é aqui que a fluidez aparece)
- [ ] Toque na carga de uma série: abre a régua e o teclado **não** abre? Arraste para o lado devagar: o número acompanha o dedo sem travar?
- [ ] Dê um peteleco rápido: a régua continua andando um pouco e para encaixada num valor (sem ficar entre dois traços)?
- [ ] Vibra de leve a cada valor (Android)? Incomoda ou ajuda?
- [ ] "Digitar" abre o teclado numérico e o valor digitado entra certo (ex.: 42,5)?
- [ ] Repetições, peso do corpo (Perfil › Registrar peso), distância e tempo da corrida: tudo pela régua?
- [ ] Campo de texto (assistente, busca da biblioteca, observações): continua abrindo o teclado normal?
- [ ] No computador: arrastar com o mouse, roda do mouse e setas funcionam?

**Datas**
- [ ] Montar plano › Sua semana › "Quando você começa?": escolha uma data, depois toque no **×**. A data some?
- [ ] Abra de novo e use **Sem data**. O plano criado sem data começa hoje?
- [ ] Na corrida: data de início, data e horário da prova também apagam?
- [ ] Na régua de data, vá para 31 de janeiro e passe para fevereiro: o dia vira 28 (ou 29)?

**Evolução de nível** (só aparece com semanas de treino de verdade: talvez não dê para ver nesta rodada)
- [ ] Se aparecer o cartão "Pronto para o nível…": "Por quê?" mostra os critérios? "Continuar como está" some com o cartão e não volta nos dias seguintes?
- [ ] Pergunte ao assistente "quero subir de nível": ele explica o que falta (ou mostra a proposta)?
- [ ] Diga "o treino está fácil demais": ele anota e explica que só isso não basta?

**Provas** (com uma prova cadastrada perto)
- [ ] Faltando poucos dias, o assistente chama com o aviso da prova uma vez só no dia, e o texto combina com a distância?
- [ ] No dia seguinte à prova: aparece "Como foi a prova?" e o registro entra como prova (🏅 no Histórico)?

**Começar do zero e o assistente** (conta de teste)
- [ ] Converse com o assistente, faça Começar do zero e o cadastro novo. No Início, o assistente se apresenta de novo com o nome e o plano novos, e nada da conversa antiga aparece?

## 0. Beta 38 — primeiro acesso

**A. Conta nova** (crie uma conta de teste ou use uma liberada só para isso)
- [ ] Logo depois de entrar: aparece "Etapa 1 de 10", **sem** a barra de abas e **sem** o botão do assistente?
- [ ] Os 8 temas aparecem com miniatura. O **Areia** tem a etiqueta "Sugerido", mas não vem marcado. Toque em dois temas diferentes: a tela inteira muda na hora?
- [ ] Toque em Continuar sem preencher o nome: aparece o aviso na própria etapa e ela não avança?
- [ ] Preencha a etapa 2, avance, toque em **Voltar**: o que você digitou continua lá?
- [ ] Na escolha da modalidade (etapa 5), toque em **← Voltar**: volta para o objetivo com a resposta marcada?
- [ ] Musculação → etapa 6: o objetivo aparece já preenchido ("Objetivo do plano: …") com o botão **Alterar**, sem perguntar de novo?
- [ ] Escolha **Híbrido**: só existe UMA pergunta de objetivo?
- [ ] Etapa 7, "Escolher meus equipamentos": cada aparelho tem um desenho que parece o aparelho de verdade? Algum ficou estranho? (mande print)
- [ ] Etapa 8: marque 4 dias por semana e só 2 dias da semana → Continuar: aparece "Selecione exatamente 4 dias da semana"?
- [ ] Etapa 9 (Híbrido, com 60 min por sessão): o texto do nível diz "até 60 min" e não mostra outra estimativa de tempo?
- [ ] Etapa 10 (Revisão): tudo o que você escolheu aparece? Toque em **Alterar** em "Você", mude o nome, avance: volta direto para a revisão, sem perder o resto?
- [ ] **Criar meu plano**: a tela de montagem usa as cores do tema escolhido e ícones (sem emojis grandes)? Ao chegar no Início, **não** aparece o aviso "Semana nova: troquei os acessórios…"?
- [ ] Depois do plano: abas e assistente aparecem e funcionam (peça "abrir desafios")?
- [ ] Os treinos do Híbrido ficaram com no máximo uns 65 min (Treinos → cada dia)?
- [ ] Com "Escolher meus equipamentos": os exercícios do plano usam os aparelhos que você marcou (antes vinha só peso do corpo)?

**B. Antes de terminar o cadastro, tente "furar"** (com a conta nova, em qualquer etapa)
- [ ] Não existe botão do assistente nem barra de abas em nenhuma etapa.
- [ ] Feche e abra o app no meio do cadastro: ele volta para o cadastro (e não para o Início)?

**C. Começar do zero** (se puder, numa conta de teste com alguns treinos — **apaga o histórico dessa conta**)
- [ ] Perfil → Começar do zero → a confirmação diz o que é apagado e o que fica?
- [ ] Depois: volta para a Etapa 1, com o seu tema atual marcado (não troca sozinho para o Areia)?
- [ ] Os campos vêm em branco (nada da configuração anterior)?
- [ ] O assistente e as abas ficam bloqueados até criar o plano novo?
- [ ] Monte um plano de **corrida**: o mapa ilustrativo aparece no topo e o percurso colorido avança a cada etapa?
- [ ] Depois do plano novo: o tema continua o mesmo? Áudio dos vídeos e organização do Início continuam como você deixou?

**D. Conta do dia a dia (não use "Começar do zero" nela)**
- [ ] Abriu direto no Início, com tudo como antes (tema, histórico, plano)?
- [ ] Perfil: o IMC aparece como número (não "NaN")?

## 1. Instalação, atualização e modo avião
- [ ] O app atualizou sozinho para a **Beta 39** (Perfil → rodapé), sem tocar em nenhum botão?
- [ ] Fechar e abrir de novo: entrou direto, sem pedir login?
- [ ] **Logo depois de atualizar**, ligue o modo avião, feche o app de vez e abra de novo. Ele abre e mostra os treinos? (Na Beta 32 este caso podia abrir em branco.)
- [ ] Ainda no modo avião: registre 2 séries e salve o treino. Desligue o modo avião. O treino aparece no Histórico de outro aparelho (ou depois de sair e entrar)?

## 2. Cronômetro de descanso (o mais importante desta versão)
- [ ] Abra o treino de hoje, registre uma série e toque em "+ Nova série". O descanso começa com o tempo do exercício?
- [ ] O descanso de um exercício principal (supino, agachamento) é maior que o de um acessório (elevação lateral, abdominal)? *(Vale para planos novos ou corrigidos: veja o item 5.)*
- [ ] Toque em **+15s**, **−15s**, **Pausar** e **Continuar**. O tempo responde certo e nunca fica negativo?
- [ ] Com o descanso rodando, **bloqueie a tela** por uns 40 s e desbloqueie. O tempo restante está certo (não parou nem atrasou)?
- [ ] Deixe o descanso acabar **com a tela bloqueada**. O som tocou? Vibrou? (Anote: Android/iPhone, modo silencioso ligado ou não.)
- [ ] Deixe acabar com o app aberto: tocou e vibrou **uma vez só**?
- [ ] Perfil → Som do cronômetro → **Sem som**. Faça um descanso: não toca nada? Feche e abra o app: continua sem som?
- [ ] Mesma tela → **Sem vibrar**: o celular não vibra no fim?
- [ ] Inicie um descanso, feche o app de vez e abra de novo em seguida. O cronômetro volta com o tempo certo?

## 3. Tela ligada durante o treino
- [ ] Abra o treino de hoje e deixe o celular parado na ficha por mais tempo que o "desligar tela" do aparelho. **A tela continuou acesa?**
- [ ] Vá para a aba Início e espere: a tela apaga normalmente?
- [ ] Volte para Treinos: a tela volta a ficar acesa?
- [ ] Minimize o app no meio do treino e volte: continua acesa?
- [ ] Salve o treino: depois disso, a tela apaga normalmente?

## 4. Celular e computador (Beta 34 — o mais importante desta versão)
- [ ] Publique o `firestore.rules` novo **antes** deste teste.
- [ ] Entre no computador do jeito que costuma entrar (se no celular é Google, teste também com e-mail e senha). O Histórico do computador mostra **os mesmos treinos** do celular? (Musculação e corrida ficam em abas diferentes do Histórico: confira as duas.)
- [ ] Perfil → Conta e dados → **Sincronização entre aparelhos**: aparece "unificado" se você já entrou de duas formas? A última gravação confirmada é recente?
- [ ] Com os dois abertos: registre uma corrida no computador. Em poucos segundos ela aparece no celular?
- [ ] Mude o apelido no celular (Editar dados pessoais). Aparece no computador?
- [ ] Salve um treino de musculação no celular. Os totais (Progresso) e as conquistas ficam iguais nos dois?
- [ ] Ligue o modo avião no celular, registre algo, registre outra coisa no computador, desligue o modo avião. Os dois registros aparecem nos dois aparelhos, sem duplicar?
- [ ] Exclua um treino num aparelho. Ele **não volta** depois de abrir o outro?
- [ ] Saia da conta no computador e entre de novo: tudo volta?

## 4a. Revisão da Beta 34
- [ ] Abra um exercício com carga: o 1º toque ("+ Registrar a 1ª série") **não** inicia o descanso? Depois de fazer a série, "+ Nova série" inicia o descanso uma vez só?
- [ ] O descanso do agachamento/supino é maior que o da elevação lateral ou do abdominal?
- [ ] Flexão de braço ou barra fixa: aparece só "Repetições" (sem peso)? "+ Usei carga extra" mostra a coluna de carga?
- [ ] Corrida → Semana com menos tempo: escolha menos dias. Aparece "Como fica a semana" antes de aplicar? Depois de aplicar, a semana muda na hora?
- [ ] Segure o dedo num botão ou numa aba: não aparece o menu de copiar? Segure num texto da ficha: dá para selecionar?
- [ ] Na ficha de um exercício com créditos, eles aparecem no fim, depois de "Erro comum"?

## 4e. Beta 37
- [ ] Perfil: abra um grupo, feche o app (tire da lista de recentes) e abra de novo — o grupo está fechado?
- [ ] Treino com Cadeira Abdutora/glúteo médio: aparece só um grupo "Glúteos"?
- [ ] "Ver como fazer" num exercício com vídeo vertical: sem o logotipo "Shorts", sem título grande e sem legenda?
- [ ] Corrida: o cartão do treino e o aviso de progresso mostram o mesmo estágio?

## 4d. Beta 36 — acabamento
- [ ] Início de manhã, de dia, no fim da tarde e à noite: o sol ou a lua aparecem inteiros, à direita da saudação, sem nada por cima? Com chuva ou nublado aparecem nuvens?
- [ ] Toque na sua foto (no alto, à direita): abre o Perfil?
- [ ] Desafios em todos os temas, principalmente AMOLED: a medalha do topo aparece e não cruza a bandeira do desafio?
- [ ] Treinos → abra um exercício: o descanso **não** começa ao abrir nem ao tocar "+ Registrar a 1ª série". Preencha e toque em **✓**: o descanso começa. Na última série prevista, o ✓ **não** abre descanso.
- [ ] Desligue "Iniciar o descanso sozinho…": ao concluir, aparece o botão **Iniciar descanso**?
- [ ] Compartilhe 3 conquistas diferentes seguidas (abrir, fechar, abrir outra): sempre a central nova?
- [ ] Central de compartilhamento: Faixa + "Mostrar meu primeiro nome" — o nome fica dentro da faixa, centralizado, em Stories, Feed e Quadrado?
- [ ] Botão redondo do assistente bem visível em todos os temas (principalmente Clássico e Vinho)?
- [ ] Segure o dedo no clima, na semana e nos cartões do Início: **não** abre o menu de copiar. Na conversa do assistente, ainda dá para copiar?
- [ ] Role todas as abas até o fim: rolagem fluida, com o efeito de fim de tela do Android e sem recarregar a página ao puxar para baixo?

## 4c. Correções da Beta 35
- [ ] Troque os dias de musculação no **celular**. Abra o **computador**: os dias e treinos novos aparecem lá? Registre algo no computador e confira que o celular **não** volta ao plano antigo.
- [ ] Com plano de corrida, marque **dor no joelho** (Perfil ou assistente). Abra um treino: os blocos agora descrevem **caminhada** (não tiros nem ritmo)? Tire a dor: o treino original volta?
- [ ] Musculação com **3 dias alternados** (ex.: seg/qua/sex): os treinos são Superior · Inferior + Core · Corpo inteiro? Algum passa de ~90 min?
- [ ] Assistente → limpar conversa: pede confirmação? (O mesmo vale para excluir sugestão e bloquear aluno no painel.)
- [ ] Com uma janela aberta, quando aparece um aviso, ele fica **visível no topo** (não atrás da janela)?
- [ ] Desafio temático com duas formas de login (Google e e-mail/senha): você aparece **uma vez só** na lista de participantes?
- [ ] Textos do app: aparecem "para" e "vamos" (não "pra" e "bora")?

## 4b. Vídeos e créditos
- [ ] Abra um exercício com vídeo (no Treino e na Biblioteca). O vídeo aparece sem a barra do YouTube, com os controles do MetaTreino embaixo? Pausar, velocidade, volume e a barra de posição funcionam?
- [ ] Ao terminar, o vídeo recomeça sozinho (sem sugestões)? Tocar na imagem não abre o YouTube?
- [ ] Anote se o título do YouTube aparece no começo ou ao pausar (limitação do YouTube).
- [ ] Painel → Vídeos → Parceiros e créditos: cadastre um parceiro de teste, marque 2 vídeos e deixe o WhatsApp desmarcado. Na ficha do aluno aparecem nome e Instagram, **sem** o telefone?
- [ ] Marque "Biblioteca" para esse parceiro: aparece a linha "Vídeo: Nome" na lista da Biblioteca?
- [ ] Edite (tire o Instagram) e depois exclua o parceiro. O vídeo continua abrindo normalmente?

## 5. Fichas de musculação
- [ ] Ao abrir o app, apareceu "Revisei a montagem dos seus treinos…"? (Só aparece uma vez e só se o plano precisava de ajuste.)
- [ ] Em Treinos, cada grupo começa por um exercício principal (peito: supino ou flexão; costas: puxada; pernas: agachamento ou leg press)?
- [ ] Os exercícios que você já fazia como principais (e as cargas) continuam lá? As trocas feitas à mão continuam?
- [ ] Crie um plano novo (Perfil → Meu plano → refazer) com o seu equipamento. Faz sentido para você como treinador? Algo repetido ou fora de lugar?

## 6. Corrida
- [ ] Registre uma corrida com tempo e distância. O ritmo saiu certo (nunca "x:60/km")?
- [ ] Edite a distância no Histórico usando vírgula (ex.: 5,2). Salvou certo?
- [ ] Se tiver prova marcada: na semana depois da prova, o plano é de recuperação (sem longão forte nem ritmo de prova)?

## 7. Início, Histórico e Progresso
- [ ] Antes de treinar hoje, a **sequência** no Início mostra os dias até ontem (não "0 dias")?
- [ ] O card do Início não diz "seu próximo treino é amanhã" quando o treino de hoje ainda não foi feito?
- [ ] Histórico: os números de página funcionam? Os detalhes abrem?
- [ ] Progresso → Desempenho e Recordes abrem sem demora?

## 8. Painel do administrador (só para você)
- [ ] A lista de alunos e o perfil de um aluno abrem normalmente, com nome, foto e WhatsApp?
- [ ] Ajustar dias, bloquear/reativar e remover um aluno de teste continuam funcionando?

## 9. Aparência
- [ ] Troque para cada tema (Zepp, Aurora, Clássico, Oceano, Claro, AMOLED, Rubi, Areia). Algum texto ficou ilegível? O cronômetro de descanso combina com o tema?
- [ ] Algo ficou cortado ou fora da tela (principalmente em celular pequeno)?
- [ ] No computador: Tab percorre os botões com um contorno visível?

## O que mandar para o treinador
Modelo do celular · sistema · o que testou · o que deu errado (com print) · o que achou confuso.

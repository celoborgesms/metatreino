# MetaTreino 2027 RC 4 — dados certos e um app mais organizado

**Não precisa publicar o `firestore.rules`.** Nada mudou nas regras. Os campos novos ficam no estado do próprio aluno e nada foi apagado. Detalhes técnicos em `RELATORIO-RC4.md`. Testes no celular em `ROTEIRO-DE-TESTES.md`, seção 2027 RC 4.

## Lógica e confiabilidade
1. **Sono em minutos exatos.** 6 h 37 é 6 h 37 (397 min) em todo lugar, nos dois jeitos de registrar. Aceita qualquer minuto de 0 a 59. As noites antigas continuam como estavam.
2. **Tempo em horas : minutos : segundos** também no registro avulso e na edição de uma atividade do histórico.
3. **Análise do mês justa.** Conta a partir do dia em que o plano começou. Com poucos dias de plano, não tira conclusão.
4. **Meta Assistente sem promessa vazia.** O balão só aparece quando há uma dica de verdade, e já traz a dica.
5. **Musculação e corrida conversam no Início:**
   - a linha "Hoje" mostra as duas modalidades;
   - o descanso de uma não vira "dia de descanso";
   - o aviso das pernas sabe quando a caminhada de hoje já foi feita.
6. **Atividade da semana.** Visual novo, e cada parte abre o seu detalhe: treinos do plano, cada dia, séries, semanas na meta e extras.
7. **Volume em kg** no card de compartilhar, opcional e explicado. As séries continuam como número principal.
8. **Dois treinos no mesmo dia** com o mesmo exercício não se misturam mais: histórico, card, PDF, recordes e sincronização.
9. **Aba Treinos** volta no treino de hoje, ou no que está em andamento, com as séries intactas.
10. **Sono × atividade física:**
    - médias com os treinos da semana;
    - qualidade e disposição dos últimos 30 dias;
    - relação com os treinos, apresentada como associação.
    
    As cores dos níveis agora são bem diferentes entre si.

## Experiência
11. **Conquistas fora do Início.** Ficam na aba Desafios.
12. **Sem janela grande depois do treino.** Aparece um aviso pequeno, "Nova conquista desbloqueada"; tocar nele abre Desafios.
13. **Desafios organizado:** Desafio atual → Em grupo → Conquistas → Histórico → Em breve, sem atalhos repetidos. As semanas do desafio anteriores ao seu início não são cobradas.
14. **Metas do mês (bronze, prata e ouro):** mantidas, mas mais simples (primeiro as do foco do mês) e proporcionais para quem começou no meio do mês.
15. **Desafio do mês no Início** em uma linha, só enquanto houver algo a fazer.
16. **Indicadores do Início** alinhados com 1, 2, 3 ou 4 cartões.
17. **Ícones das conquistas** revistos: cada um representa a própria conquista.
18. Nenhuma conquista, treino ou registro de sono foi apagado.
19. **Compartilhar** com a logo cadastrada no painel e, com foto, os dados em cima ou embaixo.
20. **Boneco da corrida** com as duas pernas.
21. Textos revistos ("Depois de um dia corrido…") e dicas de clima recolhidas, apresentadas como sugestões.

---

# MetaTreino 2027 RC 3 — estabilidade, dados certos e sono completo

**Não precisa publicar o `firestore.rules`.** Nada mudou nas regras (conferido pelo `testes/regras.js`). Os campos novos são opcionais e ficam no estado do próprio aluno. Detalhes técnicos em `RELATORIO-RC3.md`.

## Contas e estabilidade
1. **Duas contas no mesmo celular:** cada conta tem o próprio tema, a própria conversa do Meta Assistente e as próprias marcas do aparelho. Sair recarrega o app e volta ao tema padrão; quem entra em seguida não vê nada da pessoa anterior.
2. **"Volta para o login sozinho":** o app não recarrega mais com você usando (a versão nova entra quando o app vai para segundo plano, e nunca no meio de uma série ou descanso). A tela de login não aparece enquanto a sessão está sendo restaurada, e o mesmo login avisado de novo pelo Firebase não refaz a entrada.

## Treinos e histórico
3. **Treino adicional:** o treino já feito na semana pode ser feito de novo. Registre as séries e toque em **Salvar treino adicional**. Ele entra no histórico e nos totais como atividade real, sem contar em dobro no plano.
4. **Treino feito em outro dia não vira "faltou":** treino antecipado cobre o dia em que estava no plano. No dia dele, o Início mostra "Treino da semana feito".
5. **"Não vou treinar hoje"** só aparece no treino do dia e marca o descanso no dia certo (descanso não é falta).
6. **Recordes de verdade:** o 1º registro de um exercício é a **referência** (etiqueta "Ref."). Recorde só quando supera o melhor resultado anterior. Exemplo: 20 kg → 20 kg, não é PR; 22 kg, PR; 21 kg, não é PR. As conquistas "Primeiro PR" e "5 PRs" ganhas no primeiro treino foram corrigidas.
7. **Esforço não é cansaço:** a régua do fim do treino mede esforço (aparece "Esforço 8/10"). "Nem a Preguiça" agora exige que você tenha **dito** que estava cansado (ao assistente, ou "acordei com disposição baixa" no sono).
8. **Cronômetro nos exercícios por tempo** (prancha etc.): ▶ na série, Pausar/Retomar e **Concluir série**. Grava o tempo real contado. Se a contagem for interrompida, nada é registrado.
9. **"+ Usei carga extra"** (colete, anilha, halter) nos exercícios com o peso do corpo. Dá para **ocultar** o botão, e a escolha fica na sua conta (para mostrar de novo: Perfil › Treino).
10. **Duração no mesmo formato em todo o app:** "52 min" e "3 h 03 min".

## Registro de atividades
11. O botão de registrar saiu do topo de Treinos. Com plano de corrida, ele fica no treino do dia, já com **Importar do relógio**. Sem plano de corrida, o **Início** tem "Registrar atividade" para caminhada, corrida ou bike avulsa.
12. A musculação não mostra mais importação de relógio em lugar nenhum.

## PDF e compartilhamento
13. **PDF série por série:** a seção nova "Séries registradas" mostra cada série com a carga e as repetições, por exemplo "1ª: 21 kg × 15 · 2ª: 27 kg × 15 · 3ª: 27 kg × 15". A tabela de evolução diz que mostra a **maior carga de cada sessão**.
14. **Card de musculação:** sai o "4,2 toneladas levantadas". O card mostra as séries concluídas, os exercícios, as repetições, a duração e a maior carga. O volume de carga continua como métrica de evolução, com o nome certo.
15. **Card da semana:** mostra o período ("Semana de 23 a 29 de nov") e cada atividade com o seu dia, para não parecer um treino só.

## Dupla e equipamentos
16. **Uma lista de equipamentos só:** a tela da dupla usa os mesmos itens do cadastro e do Perfil. Responder lá muda aqui (acabaram os aparelhos repetidos com nomes diferentes).
17. **Treino em dupla:** a troca "equipamento ocupado" (só neste treino) não muda o plano publicado para a outra pessoa nem cria pendência. Disputa de aparelho só conta quando os dois precisam dele na mesma fase do treino. Com a dupla desligada, não há pendência de disputa.
18. **Conquistas em dupla sincronizam:** quando a outra pessoa treina e publica os horários, o seu aparelho confere na hora (não precisa você salvar um treino).

## Meta Assistente
19. Depois do treino, a mensagem é de análise e recuperação, não "se notar queda de força hoje…". Atalhos sem resposta útil não aparecem ("Ver minhas cargas" só com 3 sessões do mesmo exercício).

## Sono, água e Início
20. **Sono completo:** horário de dormir e acordar (total calculado na hora), qualidade em 5 níveis, disposição ao acordar em 5 níveis, médias da semana e do mês, regularidade e a relação com o esforço dos treinos. Tudo é opcional, nada é estimado e uma noite ruim nunca muda o treino.
21. **No Início, o atalho da Água virou o do Sono.** A água fica em **Alimentação**, com meta, +250/+500, desfazer e histórico de 7 dias.
22. **Atividade da semana com gráfico novo:** os 7 dias em colunas (feito, planejado, hoje, descanso, faltou), o placar dos treinos **do plano** (extras à parte), as séries da semana e as semanas seguidas na meta.

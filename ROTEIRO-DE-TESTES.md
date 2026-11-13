# Roteiro de testes em aparelho real — MetaTreino Beta 33

Leva uns 25 minutos. Use o aparelho e a conta do dia a dia. Anote **modelo do celular, sistema (Android/iOS) e navegador**, e mande print de tudo o que parecer estranho.

Antes de começar: publique o `firestore.rules` novo no Console do Firebase (Firestore → Regras → Publicar).

## 1. Instalação, atualização e modo avião
- [ ] O app atualizou sozinho para a **Beta 33** (Perfil → rodapé), sem tocar em nenhum botão?
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

## 4. Dois aparelhos (se tiver)
- [ ] Abra a conta em dois aparelhos. Registre um treino ou uma corrida no primeiro. Em até ~1 min, aparece no segundo (aviso "Treinos do seu outro aparelho sincronizados")?
- [ ] Exclua um treino num aparelho. Ele **não volta** depois de abrir o outro?

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

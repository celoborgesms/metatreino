# Roteiro de testes em aparelho real — MetaTreino Beta 35

Leva uns 25 minutos. Use o aparelho e a conta do dia a dia. Anote **modelo do celular, sistema (Android/iOS) e navegador**, e mande print de tudo o que parecer estranho.

Antes de começar: publique o `firestore.rules` novo no Console do Firebase (Firestore → Regras → Publicar).

## 1. Instalação, atualização e modo avião
- [ ] O app atualizou sozinho para a **Beta 35** (Perfil → rodapé), sem tocar em nenhum botão?
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

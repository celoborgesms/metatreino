# MetaTreino 2027.1 Beta 47 — Relatório

**Publique o `firestore.rules` desta versão.** Ele acrescenta só a coleção `familias`; nenhuma outra permissão mudou.

## 1. Alimentação da casa (2 a 6 pessoas)
Em Plano alimentar › **🏠 Alimentação da casa**.
- **Grupo:** um cria e recebe um código de 6 letras/números ("Convidar" compartilha). Quem mora junto digita o código. Até 6 pessoas, cada uma com o plano alimentar (Premium).
- **Refeições da casa:** almoço e jantar por padrão. Dá para marcar qualquer refeição (café, lanches, ceia). Quem usa menos refeições por dia segue só as que existem no plano dele.
- **Mesmo prato, porção de cada um:** o prato sai de parâmetros comuns (semente, trocas, restrições, modo econômico). A quantidade continua calculada pelo peso, objetivo e calorias de cada pessoa.
- **Restrições:** a refeição da casa respeita as restrições de todos. Se alguém é vegetariano, sem lactose ou sem glúten, a refeição da casa também é. As demais refeições continuam individuais. A tela não diz de quem é a restrição.
- **Registro sincronizado nas refeições da casa:** "comi", "não vou comer", alimento acrescentado, receita registrada no lugar e "Outro prato" aparecem iguais em todos os celulares (ouvinte em tempo real). Mudar a **quantidade** é pessoal, porque é a porção de cada um. Sem eco: o que chega de outro celular não volta como mudança local.
- **Lista de compras:** "Lista de compras da casa (N pessoas)" soma, nas refeições da casa, a porção de cada pessoa do mesmo prato (cada uma publica só a proporção da própria porção). As outras refeições entram só para você.
- **PDF:** o PDF do plano alimentar ganhou a seção "Lista de compras — próximos 7 dias", com a casa quando houver.
- **Sair:** o cardápio atual continua. O prato da casa vira o "cardápio guardado" da pessoa, que continua podendo trocá-lo. Quem criou passa o grupo para quem ficou; o último a sair apaga o grupo.
- **O que fica na nuvem** (`familias/{código}`): membros, apelidos, restrições (sim/não), proporção da porção nas refeições da casa, configuração e registro dessas refeições (14 dias). **Sem peso, idade, altura ou e-mail.**
- **Regras:**
  - Só membros leem e alteram o grupo.
  - Para entrar, é preciso saber o código, e a pessoa só pode acrescentar a si mesma.
  - Para sair, a pessoa só pode tirar a si mesma.
  - O máximo é 6 pessoas.
  - O grupo só pode ser apagado pelo último membro.

## 2. Meta Assistente para quem só faz musculação
- As sugestões de corrida ("Por que o treino de hoje?", "Quando vou avançar?", "Como estou na meta?", "Meus ritmos", "Análise da corrida") só aparecem para quem tem plano de corrida.
- Se a pergunta for digitada, a resposta fala da musculação: o treino de hoje e os grupos dele, ou que hoje é descanso; e como avançar as cargas.

## 3. Avisos do primeiro acesso
O balão de boas-vindas do assistente aparecia junto com "Plano criado!" e "Seu teste Premium…", um por cima do outro. Agora o balão espera os avisos sumirem (até 20 s). Se um aviso chega com o balão aberto, o balão sai e volta depois.

## Arquivos alterados
- `fonte/app-plus/49-alimentacao-casa.js` (novo)
- `fonte/app-plus/40-pdf-identidade.js`: seção da lista de compras no PDF
- `firestore.rules`: coleção `familias`
- `testes/beta46.py` (novo), `testes/mock-firebase.js` (update com caminho, arrayUnion/arrayRemove/delete, ouvintes)
- `app-plus.js`, `app.js`, `index.html`, `service-worker.js`: versão

## Limitações
- A sincronização entre dois celulares foi testada simulando o outro aparelho no mesmo navegador. Confira com os dois celulares de verdade (veja o roteiro).
- Se as duas pessoas mexerem na mesma refeição da casa ao mesmo tempo, vale a última gravação.
- A lista de compras usa a proporção de porção que cada pessoa publicou na última vez que abriu o app.

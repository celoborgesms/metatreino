# MetaTreino 2027.1 Beta 45 — Relatório

## 1. Início → carregando → Início no fim do cadastro
**Causa:** quem escolhe "Emojis coloridos" no cadastro precisa de uma recarga da página, porque o modo minimalista troca os emojis por desenhos e só a recarga traz os originais de volta. A recarga acontecia 1,8 s depois de abrir o Início, por isso o Início aparecia duas vezes. Só acontecia com aluno novo e só uma vez. No Perfil a troca recarrega na hora, sem passar pelo Início antes.

**Correção:** a recarga acontece ainda na tela "Plano pronto". O plano é salvo antes, no aparelho e na nuvem. O app volta direto no Início, com o aviso "Plano criado!". Quem escolhe os ícones minimalistas não tem recarga nenhuma.

## 2. Último tema do carrossel não era aplicado ao arrastar
**Causa:** o espaço do fim do trilho era feito com `padding`, que alguns navegadores Android não contam na rolagem. O último cartão não chegava ao centro, e o tema "mais perto do meio" era o penúltimo, que já estava aplicado.

**Correção:** as margens das pontas viraram espaçadores calculados em pixels, então o primeiro e o último cartão centralizam em qualquer navegador. E quando o trilho chega ao fim (ou ao começo), vale o último (ou o primeiro) tema.

## Arquivos alterados
- `fonte/app-plus/45-temas-carrossel-ilustracoes.js`
- `fonte/app-plus/48-fim-registro-descanso.js`
- `app-plus.js`, `app.js`, `index.html`, `service-worker.js`: versão e remontagem.

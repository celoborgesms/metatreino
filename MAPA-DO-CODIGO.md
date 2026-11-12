# Mapa do código — MetaTreino

Guia para quem for mexer no app (você, outra IA ou outro desenvolvedor). Vale a partir da Beta 24.

## Arquivos publicados (raiz)

| Arquivo | O que é |
|---|---|
| `index.html` | Todas as telas (HTML) e todo o visual (CSS). O CSS vem em camadas: as regras de cada Beta ficam no fim do `<style>`, marcadas com `/* ===== Beta N ... */`. Uma regra mais abaixo vence a de cima. |
| `app.js` | O núcleo original: login, estado (`state`), salvar na nuvem, geração de planos, treinos, histórico, conquistas, Meta Assistente, painel ADM. |
| `app-plus.js` | **Não edite direto.** É montado a partir de `fonte/app-plus/` (veja abaixo). Estende o `app.js` sem reescrevê-lo. |
| `service-worker.js` | Funcionamento offline e atualização automática. A versão dele precisa ser igual à do app. |
| `jspdf.umd.min.js` | Gerador de PDF (jsPDF 2.5.2, licença MIT). Só é baixado quando alguém gera um relatório. |
| `firestore.rules` | Regras de segurança do Firestore. Publicar no Console do Firebase quando mudar. |
| `manifest.json`, `icon*.png/svg` | Instalação como app. |
| `fonte/` | Código-fonte do `app-plus.js` em partes + o script `montar.py`. Pode ficar no GitHub (não pesa para quem usa o app). |

## Montar e trocar a versão

Na pasta do projeto:

```
python3 fonte/montar.py              # junta as partes no app-plus.js e confere sintaxe e versões
python3 fonte/montar.py --versao 25  # troca para "2027.1 Beta 25" em todos os lugares e monta
```

A versão aparece em 5 lugares (app.js, service-worker.js, index.html `?v=`, rodapé do Perfil e `MTP.versao`). Se ficarem diferentes, os celulares podem não atualizar sozinhos — o script avisa.

## As partes do app-plus (`fonte/app-plus/`)

Entram em ordem alfabética. **A ordem importa**: uma parte usa o que as anteriores definiram.

| Parte | Conteúdo |
|---|---|
| `00-base-utilitarios-ganchos.js` | `MTP`, `mtGancho` (ganchos), utilitários `mt*` (datas, histórico unificado, admin principal, escapes) |
| `01-icones.js` | Ícones de grupos musculares e medalhas |
| `02-biblioteca-ficha-player.js` | Biblioteca de exercícios, ficha técnica, player de vídeo |
| `03-fotos-navegacao-aparencia.js` | Fotos de evolução, navegação (Treinos, Progresso), temas e ícones |
| `04-desafios-tematicos.js` | Desafios temáticos do ano, missões, medalhas, participação |
| `05-home-inteligente-meta-assistente.js` | Sugestão inteligente da Home e respostas novas do Meta Assistente |
| `06-painel-adm-atualizacao.js` | Indicadores do painel, administradores e permissões, atualização automática |
| `07-videos-audio.js` | Áudio dos vídeos, vídeos indisponíveis/reportados |
| `08-home-alimentacao-graficos.js` | Carregamentos, seções recolhíveis da Home, alimentação, gráficos de Evolução (`mtChart`) |
| `09-calistenia.js` | Calistenia: progressões, modelos, painel |
| `10-estado-treino-feedback-conquista-especial.js` | Retomada, mensagens dos alunos, Conquista Especial animada, botões "recolher" |
| `11-corrida.js` | Corrida do iniciante ao avançado (níveis, VDOT, periodização, provas, painel, admin) |
| `12-prova-encerrar-plano.js` | Prova alvo removível, encerrar plano de musculação |
| `13-conquistas.js` | Detalhe animado das conquistas, Conquista Especial em duas etapas |
| `14-mural-notas-do-dia-temas.js` | Balão do assistente, mural/logo, destaques do dia no calendário |
| `15-arquivo-anual-pdf-seus-dados.js` | Arquivo anual (sem perder dados), histórico completo, relatório PDF, Seus dados, tamanho dos dados no ADM |
| `16-personalizar-inicio-computador.js` | Personalizar início, versão para computador |
| `17-desafios-resgate-limpeza-foto.js` | Aviso final e resgate de medalha, apagar dados de ex-alunos, foto mais leve |
| `18-perfil-em-grupos.js` | Perfil em grupos recolhíveis |
| `19-desempenho-historico.js` | Ordem do Desempenho, calendário e gráfico do Histórico recolhíveis |

Parte nova: próximo número livre (ex.: `20-nome-da-funcao.js`).

## Como acrescentar comportamento a uma tela: ganchos

Para rodar algo depois (ou antes) de uma função de tela do `app.js`, use **`mtGancho`** — não crie mais uma camada `const _x = window.f; window.f = function(){...}`:

```js
mtGancho('renderProfile', { depois(){
  // roda depois que o Perfil é desenhado
}});
mtGancho('renderHome', { antes(){ /* roda antes */ }, depois(){ /* roda depois */ } });
```

- "depois" roda na ordem das partes (00, 01, 02...). "antes" roda na ordem inversa (igual às camadas antigas).
- Cada gancho roda isolado: se der erro, ele aparece no console e a tela continua funcionando.
- Funciona com funções assíncronas (ex.: `goAdmin`).

Funções que já usam ganchos: `renderHome`, `renderHomeMetrics`, `renderMonthlyCard`, `renderSessions`, `renderPerf`, `renderHistory`, `renderProfile`, `goAdmin`, `openStudent`.

Embrulhar a função inteira (`window.f = function(){...}`) só quando for preciso **mudar os argumentos ou o resultado** dela.

## Regras que evitam quebrar o app

1. Nunca declarar de novo um `let`/`const` que já existe no `app.js` (dá erro e o app não abre). Funções podem ser estendidas com ganchos.
2. O estado do aluno é `state`. Depois de mudar algo, chamar `saveData()` (salva no aparelho e manda para a nuvem).
3. O documento do aluno na nuvem tem limite de 1 MB. Dado que cresce sem parar não vai no `state`: vai para o arquivo anual (parte 15).
4. Texto vindo do aluno ou do admin, quando entra em HTML, passa por `mtEsc()` ou `escHtml()`.
5. Depois de mexer: `python3 fonte/montar.py`, e testar no celular e no computador.

## Dados no Firestore

| Caminho | O que guarda | Quem lê/grava |
|---|---|---|
| `usuarios/{uid}` | Tudo do aluno (`estadoApp`): planos, últimos 90 dias de histórico, recordes, preferências | o próprio aluno e admins |
| `usuarios/{uid}/arquivo/{ano-semestre}` | Histórico com mais de 90 dias (cada registro como texto JSON) | o próprio aluno e admins |
| `usuariosAutorizados/{email}` | Acesso liberado pelo treinador (ativo, validade) | admins (o aluno lê o próprio) |
| `admins/{email}` | Administradores secundários | administrador principal |
| `config/mural`, `config/contato`, `config/calistenia`, `config/specialAward` | Mural/logo, contato, ajustes da calistenia, Conquista Especial | todos leem; admins gravam |
| `desafiosTematicos/{id}` e `.../participantes/{uid}` | Desafios criados e quem participa | ver regras |
| `videosExercicios`, `exerciciosCustom`, `caliExercicios`, `caliModelos` | Vídeos e exercícios cadastrados pelos admins | todos leem; admins gravam |
| `perguntasNaoRespondidas`, `relatos`, `videosReportados` | Mensagens e relatos dos alunos | aluno cria; admins leem |

O dono do app (administrador principal) é reconhecido pelo e-mail definido em `ADMIN_EMAIL` (app.js) e nas regras.

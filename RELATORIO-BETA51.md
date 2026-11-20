# Relatório — MetaTreino 2027.1 Beta 51

Versão **2027.1-beta.51** em todos os lugares (`fonte/montar.py --versao 51`). As regras do Firestore não mudaram.

## 1. Problemas (causa real)
| Problema | Causa |
|---|---|
| O desenho do corpo aparecia em cima e depois ia para baixo | O cartão "Anatomia muscular" era inserido logo depois do resumo. Em seguida, `perfReorganiza` (parte 19) movia evolução, calendário e recordes no HTML para logo depois do resumo, e o cartão ficava abaixo dos recordes. |
| Informações de corrida na tela da musculação | O Desempenho mostrava "Evolução da corrida", os recordes de corrida e o gráfico de km para qualquer modalidade ativa. |

## 2. O que foi feito
- **Arquivo:** `fonte/app-plus/54-progresso-personalizar.js` (novo).
- **Posição fixa:** cada bloco tem posição definida por CSS `order`. Uma observação leve da tela refaz as marcas quando uma parte é redesenhada (gráfico, calendário, recordes). A ordem não depende mais de quando cada bloco aparece.
- **Modalidade ativa:**
  - os blocos "só musculação" e "só corrida" seguem a modalidade escolhida;
  - os recordes são filtrados pela modalidade; quando não sobra nenhum, aparece um aviso;
  - o gráfico de Evolução esconde as métricas da outra modalidade;
  - o seletor Musculação | Corrida aparece no topo para quem tem as duas.
- **"Personalizar progresso"** (mesmo padrão do Início):
  - **Básico:** "Completo" ou "Só o essencial", com o selo Premium.
  - **Premium:** interruptores por bloco, ordem por arrasto (usa o mesmo arrasto do Início), "Tudo", "Só o essencial" e "Voltar ao padrão".
  - **Ao voltar ao Básico:** as escolhas do Premium ficam guardadas e voltam a valer quando o Premium volta.
- **Plano Premium:** o recurso `inicioCompleto` passou a se chamar "Personalização completa do Início e do Progresso", também na tabela de planos (`36-planos-gratuito-premium.js`).
- **Computador:** o seletor fica no topo e "Personalizar progresso" no fim da grade.
- **Corrigido antes da entrega:** o primeiro nome do seletor (`pf-mod`) já era usado pelo Perfil. Foi trocado para `perf-mod`, e há um teste para isso.

## 3. Testes
- **Novo `testes/beta51.py`: 18 ok.**
  - **Ordem:** a ordem é fixa mesmo depois de redesenhar e reorganizar a tela.
  - **Musculação:** sem bloco de corrida, recordes de corrida ou gráfico de km.
  - **Seletor:** troca para Corrida sem sair do Progresso.
  - **Perfil:** continua igual.
  - **Premium:** esconder um bloco, mudar a ordem e voltar ao padrão; a ordem do Início não é mexida.
  - **Básico:** "Só o essencial"; esconder bloco a bloco abre o aviso Premium; as escolhas Premium guardadas não valem no Básico.
  - **Planos:** a tabela de planos cita o Progresso.
- **Regressão:**
  - beta50 (40), beta49 (39), beta48 (56), beta46 (29), beta44 (51), beta43 (78), beta42 (12), beta41 (72), beta39 (94), beta38 (87), beta37 (8);
  - casa-dois-celulares (30), registro-series (23), serie-descanso (24), cronometro (21), compartilhar (10), acessibilidade (7);
  - Node: regras (61), sincronizacao (18), semana-menos-tempo (34), beta35 (23), auditoria-musculacao.
  - **beta40:** passou com 128 ok. Numa primeira rodada, 4 itens de temas falharam; na repetição tudo passou. Esses itens não têm relação com esta mudança (provável instabilidade de tempo no teste).

## 4. Pendências
- O calendário e a "Distribuição das atividades" mostram as duas modalidades de propósito. Se preferir que também sigam só a modalidade ativa, é uma regra a mais em `perfAplica`.

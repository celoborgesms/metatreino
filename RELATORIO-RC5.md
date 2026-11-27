# Relatório técnico — MetaTreino 2027 RC 5

Correções pequenas pedidas depois do teste do RC 4 no celular. Versão trocada uma vez (2027-rc.5 nos 5 lugares). Regras do Firestore sem mudança. Nenhum dado é migrado ou apagado.

| Pedido | Causa | Correção | Onde |
|---|---|---|---|
| Minutos quebrados no horário (11:52) | Régua de minutos do seletor de hora com passo 5 (0–55) e valor existente arredondado para 5. No "Digitar", só aceitava "hh:mm", e o teclado numérico do Android não tem ":". | Régua 0–59, passo 1 (rótulos de 5 em 5). Leitura do digitado (`_nrLerHora`): 11:52, 11.52, 11,52, 11h52, 1152, 7. Data digitada aceita também `.` e `-`; duração aceita `,`. O sono passa o nome do campo (aria-label), então o seletor mostra "Acordei" em vez de "Valor". | parte 34; parte 81 (rótulos) |
| Quadrado com texto por cima da logo | O bloco é ancorado no rodapé; com a lista da semana ficava mais alto que a área livre e subia por cima do cabeçalho. O desenho de fundo (barras) era feito antes de saber onde o texto ficaria. | O bloco nunca começa acima do cabeçalho (+ medalha, se houver). Se não couber, é desenhado inteiro em escala (mínimo 55%), sem cortar linhas. O desenho de fundo é feito depois do cálculo e só se couber acima do conteúdo. | parte 26 (`mtsDesenhar`) |
| Dois botões de cada modalidade no Início | Linha `#hoje-duo` do RC 4 embaixo do seletor | Linha removida (a função só apaga a linha que tenha sobrado). A saudação e o card de descanso continuam falando das duas modalidades. | parte 82 |
| Medalha do mês "some" ao tocar | `cqVerNova` só abria tela para troféus (`tid`); os outros tipos eram marcados como vistos e a lista era redesenhada. | `cqVerItem`: tela própria (ícone, tipo, nome, descrição, data, atalho para Medalhas ou Desafios, "Voltar às conquistas"). | parte 42; CSS na parte 83 |
| Clima errado no primeiro desenho | `loadWeather` termina depois do Início desenhado; a cena só era refeita no ciclo de 60 s ou ao trocar de aba. | Depois de cada `loadWeather`, uma verificação de 1 em 1 s (até 30 s) redesenha a cena e o selo quando o clima muda. Não redesenha com janela aberta e não age quando o clima é removido (plano Gratuito). | parte 28 |
| Atividade da semana parecida com "Semana" | O gráfico de 7 colunas do RC 3/RC 4 repetia o quadro "Semana". | Volta o cartão em anéis, com os números do RC 4: treinos do PLANO (`mtAdesao`), séries ou minutos, semanas na meta e extras à parte. O centro mostra o placar real (não a média dos três anéis). Cada linha abre o seu detalhe (`openAwDetalhe`). | parte 81 |

## Testes (navegador simulado, não aparelho real)
- **Novo `testes/rc5.py`: 23 ok / 0.** Cobre:
  - régua e digitação de hora (9 formatos);
  - 36 combinações de card: texto sempre entre a logo e o rodapé;
  - telas de medalha do mês e de desafio;
  - cena do clima redesenhada sem trocar de aba;
  - anéis em 360, 390 e 412 px.
- **`rc4.py`: 93 ok / 0.** Três verificações foram atualizadas porque o comportamento mudou de propósito: linha duplicada, anéis e larguras.
- **`rc3.py`: 98 ok / 1.** Uma verificação foi atualizada (anéis). A falha que sobra ("tema da conta A") é igual no RC 4 entregue, rodado agora no mesmo ambiente.
- **`beta39.py`: 94/0.**
- **`compartilhar.py`: 10/0.**
- **`beta41.py`:** só falham as fontes externas bloqueadas neste ambiente.
- **`beta40.py`:** as mesmas falhas de tempo de espera aparecem no RC 4 entregue rodado agora (ambiente).

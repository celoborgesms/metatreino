# Relatório técnico — MetaTreino 2027.1 Beta 37

Versão de ajustes a partir dos vídeos e prints do aparelho (Beta 36 instalada). Regras do Firestore sem mudança.

| # | Problema visto | Causa | Correção | Onde |
|---|---|---|---|---|
| 1 | Grupo do Perfil aberto continuava aberto ao reabrir o app | `pfGruposInit` gravava os grupos abertos em `localStorage` | Agora em `sessionStorage` (vale enquanto o app está aberto); a chave antiga é apagada | parte 18 |
| 2 | "Glúteos" duas vezes no Treino E | `renderLiftBlocksBase` agrupa pela 1ª palavra de `ex.sub`: "Glúteos" e "Glúteo" (de "Glúteo Médio") | Agrupa pela forma sem acento e sem plural; mostra o nome no plural | app.js |
| 3 | Vídeo com logotipo "Shorts", título, canal e legenda | O quadro vertical (Beta 34) é mais alto que largo, e nesse formato o YouTube usa a interface de Shorts | Quadro 16:9 da altura da área, centralizado, com as sobras escondidas (`overflow:hidden`); `unloadModule('captions')` no `onReady`; `cc_load_policy=0`, `cc_lang_pref`, `hl` | index.html, parte 07 |
| 4 | Retomada da corrida aplicada sobre plano novo (dados gravados pela versão anterior) | A correção da Beta 36 só impedia retomadas novas | Se o plano é posterior à pausa e a retomada é dessa pausa, ela é desfeita e o estágio/nível de antes volta | parte 11 |
| 5 | "Quanto peso perdi?": 122.85 kg e "ótimo sinal" para quem quer emagrecer | Número sem formatação; texto fixo | `toLocaleString('pt-BR')` e comentário pelo objetivo | app.js |
| 6 | Cena: objetos das datas transparentes sobre o morro; sol baixo com chuva | `.c-fill` translúcido; chuva só removia o sol do meio do dia | `.c-fill` opaco (mistura com o fundo); chuva/tempestade sem sol nem estrelas | index.html, parte 28 |

## Testes executados (Beta 37 final)
- Node: regras 61 ✓ · sincronização 15 ✓ · beta35 23 ✓ · auditoria musculação ✓ · semana com menos tempo 34 ✓ · simulação de corrida (60 cenários × 20 semanas) ✓ · retomada antiga desfeita (estágio 1 → 3) ✓ · retomada de pausa posterior ao plano continua valendo ✓
- Navegador: **beta37.py (novo) 8 ✓** · acabamento 32 ✓ · séries/descanso 24 ✓ · compartilhar 10 ✓ · cronômetro 21 ✓ · registro de séries 23 ✓ · acessibilidade 7 ✓ · vídeos e créditos 29 ✓ · dois aparelhos 20 ✓ · 8 temas sem erros/contraste ✓ · atualização automática Beta 36 → 37 e offline ✓
- Inspeção visual: datas especiais (prova, véspera, aniversário, Ano-Novo, Natal dia/noite) e climas (chuva, tempestade, névoa, neve, nublado, garoa) em 3 temas.

## Não verificado
- **Interface do YouTube:** este ambiente não acessa o YouTube. A mudança do quadro segue o comportamento conhecido do player (formato vertical → interface de Shorts), mas só dá para confirmar no aparelho. Se o logotipo continuar, o próximo passo é trocar esses vídeos por versões normais (não Shorts) no painel de vídeos.
- A legenda pode seguir a preferência da conta Google do aparelho; o app pede para não carregar, mas a decisão final é do YouTube.

# MetaTreino em APK (instalar sem a Play Store)

## O que é este APK

É um **Trusted Web Activity (TWA)**: um app Android pequeno que abre o **https://metatreino.app** dentro do motor do Chrome, em tela cheia, com ícone próprio e sem barra de endereço.

- Tudo funciona **como no site**: parte offline (service worker), login com e-mail ou Google, Firebase, cronômetro, PDF e importação de relógio.
- **Atualizar o app = publicar o site.** O APK não precisa ser reinstalado a cada versão. Só é preciso um APK novo se mudar algo da "casca" (ícone, nome, cor).
- Por que não um APK com os arquivos dentro (WebView/Capacitor)? Porque o **login com Google não funciona dentro de WebView** (o Google bloqueia), e cada correção exigiria reinstalar o APK.
- Precisa do Chrome instalado (vem em quase todo Android). Sem Chrome, abre num WebView de reserva; aí o login com Google não funciona, mas o login por e-mail funciona.

## Passo 1 — Publicar o site (uma vez)

Suba a versão 2027 RC 1 normalmente, **incluindo** as pastas e os arquivos novos da raiz:

- `.well-known/assetlinks.json`: é ele que diz ao Android que o app é seu e tira a barra de endereço;
- `.nojekyll`: faz o GitHub Pages publicar a pasta `.well-known`;
- `.github/workflows/apk.yml`: a montagem do APK;
- `android-twa/`: o projeto Android.

No Windows, pastas que começam com ponto podem ficar escondidas. Ative "Itens ocultos" no Explorador de Arquivos antes de arrastar.

**Confira:** abra **https://metatreino.app/.well-known/assetlinks.json** no navegador. Tem que aparecer um texto com `app.metatreino`. Se der erro 404, o seu fluxo de publicação está deixando a pasta de fora. Nesse caso, me mande o arquivo do workflow de publicação.

## Passo 2 — Cadastrar a chave no GitHub (uma vez)

A chave de assinatura está no pacote **metatreino-chave-apk.zip**, entregue separado. **Não suba esse pacote para o repositório.**

No repositório: **Settings › Secrets and variables › Actions › New repository secret**. Crie dois:

| Nome | Valor |
|---|---|
| `KEYSTORE_BASE64` | todo o conteúdo do arquivo `metatreino.jks.base64.txt` (uma linha longa) |
| `KEYSTORE_PASSWORD` | o conteúdo do arquivo `senha.txt` |

## Passo 3 — Gerar o APK

**Actions › APK Android › Run workflow**. A montagem também roda sozinha quando você sobe a pasta `android-twa`. Leva uns 3 a 6 minutos.

Quando ficar verde, o APK aparece em **Releases** (na página inicial do repositório, à direita), como **MetaTreino.apk**.

Se o repositório for público, o link fixo da última versão é:
`https://github.com/celoborgesms/metatreino/releases/latest/download/MetaTreino.apk`

## Passo 4 — Instalar no celular

1. Abra o link do APK no celular e baixe.
2. Toque no arquivo. O Android pede para **permitir instalar apps desta fonte** (Chrome ou Arquivos): permita.
3. O Play Protect pode avisar que o app é desconhecido: toque em **Instalar mesmo assim**. Isso é normal para APK fora da loja.
4. Abra o **MetaTreino** pelo ícone. Na primeira vez, faça login: o app usa o armazenamento do Chrome, então pode já estar logado.

## Se aparecer uma barra de endereço no topo

Isso significa que o Android ainda não confirmou o `assetlinks.json`. Verifique:

1. Se o arquivo abre no endereço do Passo 1.
2. Se o APK foi assinado pela **mesma chave**: a impressão SHA-256 do `assetlinks.json` é a do arquivo `sha256.txt`.
3. Desinstale e instale de novo. O Android confirma no momento da instalação.

## Guarde a chave

O `metatreino.jks` e a senha são a "identidade" do app. Se perder, você não consegue mais gerar atualizações do APK que instalem por cima: as pessoas teriam de desinstalar e instalar de novo. Faça backup (Google Drive, pendrive). **Não deixe a chave no repositório público.**

## Limites (iguais aos do site)

- A vibração e o som do fim do descanso só funcionam com o app **aberto na tela**. Com a tela bloqueada, o Chrome não vibra. No Android às vezes o som toca, às vezes não.
- Um alarme com o app fechado exigiria um app nativo de verdade, sem o login com Google do jeito atual. Dá para estudar depois, se for prioridade.

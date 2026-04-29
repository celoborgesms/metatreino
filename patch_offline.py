from pathlib import Path
p=Path('js/app.js')
s=p.read_text()
anchor='    auth.onAuthStateChanged(function(user) {'
helpers='''    function usuarioOfflineMinimo(user) {
      if (!user) return null;
      return { uid: user.uid || "offline", email: (user.email || "").toLowerCase(), displayName: user.displayName || "Usuário", offline: true };
    }

    function chaveSessaoOffline(email) { return "metatreino-sessao-offline-" + (email || "ultimo").toLowerCase(); }

    function salvarSessaoOffline(user, dadosAcesso) {
      try {
        const dados = usuarioOfflineMinimo(user);
        if (!dados || !dados.email) return;
        localStorage.setItem(chaveSessaoOffline(dados.email), JSON.stringify({ user: dados, acesso: dadosAcesso || {}, salvoEm: Date.now() }));
        localStorage.setItem("metatreino-ultimo-email-offline", dados.email);
      } catch (erro) { console.log("Não foi possível salvar sessão offline:", erro); }
    }

    function obterSessaoOffline() {
      try {
        const email = localStorage.getItem("metatreino-ultimo-email-offline") || "";
        if (!email) return null;
        const pacote = JSON.parse(localStorage.getItem(chaveSessaoOffline(email)) || "null");
        if (!pacote || !pacote.user || !pacote.user.email) return null;
        return pacote;
      } catch (erro) { return null; }
    }

    function liberarAppOffline(pacote, motivo) {
      if (!pacote || !pacote.user) return false;
      usuarioAtual = pacote.user;
      acessoLiberado = true;
      dadosAcessoAtual = pacote.acesso || { offline: true };
      atualizarTelaLogin(usuarioAtual);
      liberarApp(dadosAcessoAtual);
      mostrarMensagemAcesso((motivo || "Modo offline ativado.") + " Seus registros serão salvos neste aparelho e sincronizados quando a internet voltar.", "aviso");
      mostrarHistorico();
      carregarUltimaCardio();
      return true;
    }

    function tentarEntrarOffline(mensagem) {
      const pacote = obterSessaoOffline();
      if (pacote) return liberarAppOffline(pacote, mensagem || "Sem internet no momento.");
      bloquearApp("Primeiro acesso precisa de internet para validar seu e-mail. Depois do primeiro login, o app poderá abrir offline neste aparelho.");
      return false;
    }

    function chaveFilaOffline(tipo) {
      const email = usuarioAtual && usuarioAtual.email ? usuarioAtual.email.toLowerCase() : (localStorage.getItem("metatreino-ultimo-email-offline") || "anonimo");
      return "metatreino-fila-offline-" + tipo + "-" + email;
    }

    function obterFilaOffline(tipo) {
      try { return JSON.parse(localStorage.getItem(chaveFilaOffline(tipo)) || "[]"); }
      catch (erro) { return []; }
    }

    function salvarFilaOffline(tipo, lista) {
      try { localStorage.setItem(chaveFilaOffline(tipo), JSON.stringify(lista || [])); }
      catch (erro) { console.log("Não foi possível salvar fila offline:", erro); }
    }

    function adicionarPendenteOffline(tipo, item) {
      const lista = obterFilaOffline(tipo);
      const copia = Object.assign({}, item, { __offlinePendente: true, __offlineId: "offline-" + Date.now() + "-" + Math.random().toString(16).slice(2) });
      lista.unshift(copia);
      salvarFilaOffline(tipo, lista);
      return copia;
    }

    function mesclarPendentesOffline(tipo, listaNuvem) {
      return obterFilaOffline(tipo).concat(listaNuvem || []).sort(function(a, b) { return Number(b.criadoEm || 0) - Number(a.criadoEm || 0); });
    }

    function salvarTreinoPendenteOffline(treinoSalvo) {
      const salvo = adicionarPendenteOffline("treinos", treinoSalvo);
      salvarUltimoTreinoLocal(salvo);
      alert("Treino salvo offline neste aparelho. Quando a internet voltar, ele será enviado para a nuvem automaticamente.");
      mostrarHistorico();
      rolarParaProximoExercicioPendente();
    }

    function sincronizarFila(tipo, colecao) {
      if (!navigator.onLine || !acessoLiberado || !usuarioAtual || !usuarioAtual.uid || !db || usuarioAtual.offline) return Promise.resolve();
      const fila = obterFilaOffline(tipo);
      if (!fila.length) return Promise.resolve();
      let corrente = Promise.resolve();
      fila.slice().reverse().forEach(function(item) {
        corrente = corrente.then(function() {
          const envio = Object.assign({}, item);
          delete envio.__offlinePendente;
          delete envio.__offlineId;
          return db.collection("usuarios").doc(usuarioAtual.uid).collection(colecao).add(envio);
        });
      });
      return corrente.then(function() { salvarFilaOffline(tipo, []); }).catch(function(erro) { console.log("Sincronização pendente falhou:", erro); });
    }

    function sincronizarPendentesQuandoPossivel() {
      if (!navigator.onLine || !usuarioAtual || usuarioAtual.offline || !db) return;
      sincronizarFila("treinos", "treinos").then(function() { return sincronizarFila("cardios", "corridas"); }).then(function() {
        mostrarHistorico();
        carregarCardios();
      });
    }

    window.addEventListener("online", sincronizarPendentesQuandoPossivel);

'''
if 'function usuarioOfflineMinimo' not in s:
    s=s.replace(anchor, helpers+anchor)
s=s.replace('''        bloquearApp("Faça login com Google para verificar seu acesso.");''','''        if (!navigator.onLine) tentarEntrarOffline("Sem internet no momento.");
        else bloquearApp("Faça login com Google para verificar seu acesso.");''',1)
s=s.replace('''      bloquearApp("Não foi possível verificar o login agora. Tente novamente em alguns instantes.");''','''      tentarEntrarOffline("Não foi possível verificar o login agora.");''',1)
s=s.replace('''      mostrarMensagemAcesso(obterMensagemValidadePlano(dadosAcessoAtual), "sucesso");
      mostrarAvisoInicialSeNecessario();''','''      mostrarMensagemAcesso(obterMensagemValidadePlano(dadosAcessoAtual), "sucesso");
      salvarSessaoOffline(usuarioAtual, dadosAcessoAtual);
      sincronizarPendentesQuandoPossivel();
      mostrarAvisoInicialSeNecessario();''',1)
s=s.replace('''          if (usuarioAtual) {
            mostrarMensagemAcesso("Você está logado, mas o app não conseguiu confirmar o acesso agora. Confira a conexão e toque novamente em Perfil ou recarregue a página.", "aviso");
          } else {
            bloquearApp("Não foi possível verificar seu acesso agora. Confira sua conexão e tente novamente.");
          }''','''          if (!tentarEntrarOffline("Não foi possível confirmar o acesso online agora.")) {
            bloquearApp("Não foi possível verificar seu acesso agora. Confira sua conexão e tente novamente.");
          }''')
p.write_text(s)

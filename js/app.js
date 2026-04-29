const firebaseConfig = {
      apiKey: "AIzaSyBMjCfbTjKkh04WLcyY-TWWPzwkrDUKEfg",
      authDomain: "meu-treino-inteligente.firebaseapp.com",
      projectId: "meu-treino-inteligente",
      storageBucket: "meu-treino-inteligente.firebasestorage.app",
      messagingSenderId: "51290225183",
      appId: "1:51290225183:web:dfebcf71e6ce3a65db332a",
      measurementId: "G-6413FEHHXL"
    };

    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    let usuarioAtual = null;
    let acessoLiberado = false;
    let usuarioAdmin = false;
    let dadosAcessoAtual = null;


    function chaveFluxoApp(sufixo) {
      const email = usuarioAtual && usuarioAtual.email ? usuarioAtual.email.toLowerCase() : "anonimo";
      return "metatreino-fluxo-" + sufixo + "-" + email;
    }

    function marcarCheckinRespondido() {
      try {
        localStorage.setItem(chaveFluxoApp("checkin"), new Date().toISOString().slice(0, 10));
      } catch (erro) {}
    }

    function checkinRespondidoHoje() {
      try {
        return localStorage.getItem(chaveFluxoApp("checkin")) === new Date().toISOString().slice(0, 10);
      } catch (erro) {
        return false;
      }
    }

    function atualizarAvisoCardioSemCheckin() {
      const aviso = document.getElementById("avisoCardioSemCheckin");
      if (!aviso) return;
      if (checkinRespondidoHoje()) aviso.classList.add("hidden");
      else aviso.classList.remove("hidden");
    }

    function pularTreinoEIrParaCardio() {
      irParaCardio();
    }



    function atualizarBotoesLogin(user) {
      const botaoLogin = document.getElementById("botaoLoginGoogle");
      const botaoSair = document.getElementById("botaoLogoutGoogle");
      const cardSair = document.getElementById("cardSairConta");
      const linkVenda = document.getElementById("linkVendaLogin");

      if (botaoLogin) user ? botaoLogin.classList.add("hidden") : botaoLogin.classList.remove("hidden");
      if (botaoSair) user ? botaoSair.classList.remove("hidden") : botaoSair.classList.add("hidden");
      if (cardSair) user ? cardSair.classList.remove("hidden") : cardSair.classList.add("hidden");
      if (linkVenda) user ? linkVenda.classList.add("hidden") : linkVenda.classList.remove("hidden");
    }

    function chaveTreinoAtual() {
      const email = usuarioAtual && usuarioAtual.email ? usuarioAtual.email.toLowerCase() : "anonimo";
      return "metatreino-treino-atual-" + email;
    }

    function salvarTreinoAtualLocal() {
      try {
        if (!treinoAtual || treinoAtual.length === 0) return;
        localStorage.setItem(chaveTreinoAtual(), JSON.stringify({
          treino: treinoAtual,
          letra: treinoAtual.letra || "",
          concluidos: exerciciosConcluidos || [],
          feedback: feedbackTreinoFinalAtual || "",
          salvoEm: Date.now()
        }));
      } catch (erro) {
        console.log("Não foi possível salvar o progresso local:", erro);
      }
    }

    function carregarTreinoAtualLocal() {
      try {
        const bruto = localStorage.getItem(chaveTreinoAtual());
        if (!bruto) return false;
        const dados = JSON.parse(bruto);
        if (!dados || !dados.treino || !dados.treino.length) return false;
        treinoAtual = dados.treino;
        treinoAtual.letra = dados.letra || "";
        exerciciosConcluidos = dados.concluidos || treinoAtual.map(function() { return false; });
        feedbackTreinoFinalAtual = dados.feedback || "";
        const resultadoTreino = document.getElementById("resultadoTreino");
        const registroEvolucao = document.getElementById("registroEvolucao");
        if (resultadoTreino) resultadoTreino.classList.remove("hidden");
        if (registroEvolucao) registroEvolucao.classList.remove("hidden");
        mostrarTreinoNaTela();
        return true;
      } catch (erro) {
        console.log("Não foi possível recuperar treino local:", erro);
        return false;
      }
    }

    function limparTreinoAtualLocal() {
      try { localStorage.removeItem(chaveTreinoAtual()); } catch (erro) {}
    }

    function determinarPerfilTreino() {
      const imc = perfilUsuario ? Number(perfilUsuario.imc || 0) : 0;
      const rotina = perfilUsuario ? perfilUsuario.rotinaAtual : "";
      const experiencia = perfilUsuario ? perfilUsuario.tempoExperiencia : "";
      const sexo = perfilUsuario ? perfilUsuario.sexo : "";
      const iniciante = rotina === "nunca" || rotina === "dificuldade" || experiencia === "menos_1";
      const avancado = rotina === "regular" && (experiencia === "2_4" || experiencia === "4_mais");
      const sobrepeso = imc >= 30 || imc >= 25;
      return {
        iniciante: iniciante,
        avancado: avancado,
        sobrepeso: sobrepeso,
        sexo: sexo,
        imc: imc
      };
    }

    function filtrarExerciciosUnicos(lista) {
      const vistos = {};
      return (lista || []).filter(function(exercicio) {
        const chave = normalizarNomeExercicio(exercicio.nome || "");
        if (!chave || vistos[chave]) return false;
        vistos[chave] = true;
        return true;
      });
    }

    function alvoQuantidadeExercicios(tempo, perfil) {
      // 1.3.3 - regra fixa solicitada: 30 min = 3 a 4, 1h = 6 a 8, acima de 1h = 8.
      if (tempo === "rapido") return perfil && perfil.iniciante ? 3 : 4;
      if (tempo === "normal") return perfil && perfil.iniciante ? 6 : 8;
      return 8;
    }

    function adaptarTreinoPorPerfil(treino, tempo) {
      const perfil = determinarPerfilTreino();
      let ajustado = (treino || []).map(function(exercicio) {
        const copia = Object.assign({}, exercicio);
        if (perfil.iniciante || perfil.sobrepeso) {
          if (copia.reps && copia.reps.includes("15")) copia.reps = "8 a 12 reps";
          if (copia.series && copia.series.includes("4")) copia.series = "2 a 3 séries";
        }
        if (perfil.avancado && !perfil.sobrepeso) {
          if (!copia.series || copia.series.includes("3")) copia.series = "3 a 4 séries";
        }
        return copia;
      });

      if (perfil.sobrepeso || perfil.iniciante) {
        ajustado = ajustado.filter(function(exercicio) {
          const nome = normalizarNomeExercicio(exercicio.nome || "");
          return !["polichinelo", "mountain climber"].includes(nome);
        });
      }

      return ajustado;
    }

    function pularExercicio(index) {
      if (!treinoAtual[index]) return;
      if (!confirm("Deseja pular este exercício e continuar o treino?")) return;
      treinoAtual.splice(index, 1);
      exerciciosConcluidos.splice(index, 1);
      salvarTreinoAtualLocal();
      mostrarTreinoNaTela();
    }

    function alternarListaCompletaAlunos() {
      mostrarTodosAlunosPainel = !mostrarTodosAlunosPainel;
      renderizarUsuariosAutorizados(usuariosAutorizadosCache);
    }

    function loginGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

      if (isIOS) {
        auth.signInWithRedirect(provider);
        return;
      }

      auth.signInWithPopup(provider)
        .then(function(result) {
          usuarioAtual = result.user;
          atualizarTelaLogin(usuarioAtual);
        })
        .catch(function(error) {
          if (error && (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user" || error.code === "auth/cancelled-popup-request")) {
            auth.signInWithRedirect(provider);
            return;
          }

          alert("Erro ao fazer login: " + error.message);
        });
    }

    auth.getRedirectResult()
      .then(function(result) {
        if (result && result.user) {
          usuarioAtual = result.user;
          atualizarTelaLogin(usuarioAtual);
        }
      })
      .catch(function(error) {
        console.log("Erro no retorno do login por redirecionamento:", error);
      });

    function logout() {
      auth.signOut()
        .then(function() {
          usuarioAtual = null;
          usuarioAdmin = false;
          dadosAcessoAtual = null;
          atualizarBotaoPainelTreinador();
          atualizarTelaLogin(null);
        })
        .catch(function(error) {
          alert("Erro ao sair: " + error.message);
        });
    }

    function atualizarTelaLogin(user) {
      const campo = document.getElementById("usuarioLogado");
      atualizarBotoesLogin(user);

      if (!campo) {
        return;
      }

      if (user) {
        campo.innerHTML = "<strong>Logado como:</strong><br>" + (user.displayName || "Usuário") + "<br>" + (user.email || "");
      } else {
        campo.innerHTML = "Você ainda não está logado.";
      }
    }

    function usuarioOfflineMinimo(user) {
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

    auth.onAuthStateChanged(function(user) {
      usuarioAtual = user;
      atualizarTelaLogin(user);

      if (user) {
        verificarAcessoUsuario(user);
        verificarAdminUsuario(user);
      } else {
        usuarioAdmin = false;
        atualizarBotaoPainelTreinador();
        if (!navigator.onLine) tentarEntrarOffline("Sem internet no momento.");
        else bloquearApp("Faça login com Google para verificar seu acesso.");
      }
    }, function(error) {
      usuarioAtual = null;
      atualizarTelaLogin(null);
      tentarEntrarOffline("Não foi possível verificar o login agora.");
    });

    let perfilUsuario = null;
    let db = null;

    try {
      if (firebase.firestore) {
        db = firebase.firestore();
      }
    } catch (erro) {
      db = null;
    }

    function mostrarMensagemAcesso(mensagem, tipo) {
      const caixa = document.getElementById("mensagemAcesso");
      if (!caixa) return;
      caixa.className = "alerta";
      if (tipo === "sucesso") caixa.classList.add("alerta-sucesso");
      if (tipo === "aviso") caixa.classList.add("alerta-aviso");
      caixa.innerHTML = mensagem;
    }

    function bloquearApp(mensagem) {
      acessoLiberado = false;
      dadosAcessoAtual = null;

      const cardDadosPessoa = document.getElementById("cardDadosPessoa");
      const paginaTreino = document.getElementById("paginaTreino");
      const paginaNovidades = document.getElementById("paginaNovidades");
      const paginaHistoricoCompleto = document.getElementById("paginaHistoricoCompleto");
      const paginaCheckin = document.getElementById("paginaCheckin");
      const paginaCardio = document.getElementById("paginaCardio");
      const paginaPainelTreinador = document.getElementById("paginaPainelTreinador");
      const paginaPerfil = document.getElementById("paginaPerfil");

      if (cardDadosPessoa) cardDadosPessoa.classList.add("hidden");
      if (paginaTreino) paginaTreino.classList.add("hidden");
      if (paginaHistoricoCompleto) paginaHistoricoCompleto.classList.add("hidden");
      if (paginaCheckin) paginaCheckin.classList.add("hidden");
      if (paginaCardio) paginaCardio.classList.add("hidden");
      if (paginaPainelTreinador) paginaPainelTreinador.classList.add("hidden");
      if (paginaNovidades) paginaNovidades.classList.add("hidden");
      if (paginaPerfil) paginaPerfil.classList.remove("hidden");

      mostrarMensagemAcesso(
        mensagem || "Seu acesso ainda não foi liberado. Entre em contato com o treinador para ativar sua conta.",
        "aviso"
      );
    }

    function formatarDataPlano(dataISO) {
      if (!dataISO) return "Sem vencimento";
      const partes = String(dataISO).split("-");
      if (partes.length === 3) {
        return partes[2] + "/" + partes[1] + "/" + partes[0];
      }
      return dataISO;
    }

    function obterMensagemValidadePlano(dados) {
      if (dados && dados.plano === "vitalicio") {
        return "✅ Acesso liberado. Seu plano <strong>Vitalício / VIP</strong> está ativo.";
      }

      if (!dados || !dados.expiraEm) {
        return "✅ Acesso liberado. Seu plano está ativo e sem data de vencimento cadastrada.";
      }

      return "✅ Acesso liberado. Seu plano expira em <strong>" + limparTextoSeguro(formatarDataPlano(dados.expiraEm)) + "</strong>.";
    }

    function liberarApp(dadosAcesso) {
      acessoLiberado = true;
      dadosAcessoAtual = dadosAcesso || null;

      const cardDadosPessoa = document.getElementById("cardDadosPessoa");
      if (cardDadosPessoa) cardDadosPessoa.classList.remove("hidden");

      mostrarMensagemAcesso(obterMensagemValidadePlano(dadosAcessoAtual), "sucesso");
      salvarSessaoOffline(usuarioAtual, dadosAcessoAtual);
      sincronizarPendentesQuandoPossivel();
      mostrarAvisoInicialSeNecessario();
      atualizarBotoesLogin(usuarioAtual);
    }


    function chaveAvisoInicial() {
      const email = usuarioAtual && usuarioAtual.email ? usuarioAtual.email.toLowerCase() : "usuario";
      return "avisoInicialAceito-" + email;
    }

    function mostrarAvisoInicialSeNecessario() {
      const modal = document.getElementById("modalAvisoInicial");
      if (!modal || !usuarioAtual) return;
      if (localStorage.getItem(chaveAvisoInicial()) === "sim") return;

      const aceite = document.getElementById("aceiteTermosAviso");
      const botao = document.getElementById("botaoAceitarAvisoInicial");
      if (aceite) aceite.checked = false;
      if (botao) botao.disabled = true;

      modal.classList.remove("hidden");
    }

    function atualizarBotaoAceiteAviso() {
      const aceite = document.getElementById("aceiteTermosAviso");
      const botao = document.getElementById("botaoAceitarAvisoInicial");
      if (!aceite || !botao) return;
      botao.disabled = !aceite.checked;
    }

    function aceitarAvisoInicial() {
      const aceite = document.getElementById("aceiteTermosAviso");
      if (!aceite || !aceite.checked) {
        alert("Para continuar, marque a opção confirmando que leu e concorda com o Aviso Importante e os Termos de Uso.");
        return;
      }

      localStorage.setItem(chaveAvisoInicial(), "sim");
      const modal = document.getElementById("modalAvisoInicial");
      if (modal) modal.classList.add("hidden");
    }

    function verificarAcessoUsuario(user) {
      if (!user || !db) {
        bloquearApp("Não foi possível verificar seu acesso. Tente novamente em alguns instantes.");
        return;
      }

      const emailUsuario = (user.email || "").toLowerCase();

      db.collection("usuariosAutorizados")
        .doc(emailUsuario)
        .get()
        .then(function(doc) {
          if (doc.exists && doc.data().ativo === true) {
            const dados = doc.data() || {};

            if (dados.plano !== "vitalicio" && dados.expiraEm) {
              const hoje = new Date();
              const expira = new Date(dados.expiraEm + "T23:59:59");

              if (hoje > expira) {
                bloquearApp("Seu plano expirou. Entre em contato com o treinador para renovar o acesso.");
                return;
              }
            }

            liberarApp(dados);
          } else {
            bloquearApp("Seu e-mail ainda não está autorizado. Entre em contato com o treinador para liberar o acesso.");
          }
        })
        .catch(function(erro) {
          console.log("Erro ao verificar acesso:", erro);
          if (!tentarEntrarOffline("Não foi possível confirmar o acesso online agora.")) {
            bloquearApp("Não foi possível verificar seu acesso agora. Confira sua conexão e tente novamente.");
          }
        });
    }


    function atualizarBotaoPainelTreinador() {
      const botao = document.getElementById("botaoPainelTreinador");
      if (!botao) return;
      if (usuarioAdmin) botao.classList.remove("hidden");
      else botao.classList.add("hidden");
    }

    function verificarAdminUsuario(user) {
      usuarioAdmin = false;
      atualizarBotaoPainelTreinador();

      if (!user || !db) return;
      const emailUsuario = (user.email || "").toLowerCase();

      db.collection("admins")
        .doc(emailUsuario)
        .get()
        .then(function(doc) {
          usuarioAdmin = doc.exists && doc.data().ativo === true;
          atualizarBotaoPainelTreinador();
        })
        .catch(function(erro) {
          console.log("Erro ao verificar admin:", erro);
          usuarioAdmin = false;
          atualizarBotaoPainelTreinador();
        });
    }

    function mostrarMensagemPainel(mensagem, tipo) {
      const caixa = document.getElementById("mensagemPainelTreinador");
      if (!caixa) return;
      caixa.className = "alerta";
      if (tipo === "sucesso") caixa.classList.add("alerta-sucesso");
      if (tipo === "aviso") caixa.classList.add("alerta-aviso");
      caixa.innerHTML = mensagem;
    }

    function limparTextoSeguro(texto) {
      return String(texto || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function ocultarPaginasDoApp() {
      const ids = ["paginaPerfil", "paginaTreino", "paginaCheckin", "paginaCardio", "paginaHistoricoCompleto", "paginaPainelTreinador", "paginaNovidades"];
      ids.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
      });
    }

    function irParaPainelTreinador() {
      if (!acessoLiberado || !usuarioAdmin) {
        bloquearApp("Apenas o treinador administrador pode acessar o painel.");
        return;
      }

      ocultarPaginasDoApp();
      document.getElementById("paginaPainelTreinador").classList.remove("hidden");
      carregarUsuariosAutorizados();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function obterEmailAlunoPainel() {
      return (document.getElementById("emailAlunoPainel").value || "").trim().toLowerCase();
    }

    function liberarAlunoPainel() {
      if (!usuarioAdmin || !db) {
        mostrarMensagemPainel("Você não tem permissão para liberar alunos.", "aviso");
        return;
      }

      const emailAluno = obterEmailAlunoPainel();
      const nomeAluno = (document.getElementById("nomeAlunoPainel").value || "").trim();
      const planoAluno = document.getElementById("planoAlunoPainel").value;
      const campoValorAluno = document.getElementById("valorAlunoPainel");
      const valorAluno = (planoAluno === "teste" || planoAluno === "vitalicio") ? 0 : Math.max(Number(campoValorAluno ? campoValorAluno.value : 0) || 0, 0);

      if (!emailAluno || !emailAluno.includes("@")) {
        mostrarMensagemPainel("Informe um e-mail válido para liberar o aluno.", "aviso");
        return;
      }

      const agora = new Date();
      const diasPorPlano = {
        teste: 1,
        mensal: 30,
        trimestral: 90,
        semestral: 180,
        anual: 365
      };

      const dadosLiberacao = {
        ativo: true,
        nome: nomeAluno || emailAluno,
        plano: planoAluno,
        valorMensal: valorAluno,
        liberadoEm: agora.toLocaleString("pt-BR"),
        atualizadoEm: agora.getTime(),
        liberadoPor: usuarioAtual ? usuarioAtual.email : "treinador"
      };

      if (planoAluno === "vitalicio") {
        dadosLiberacao.expiraEm = "";
      } else {
        const diasPlano = diasPorPlano[planoAluno] || 30;
        const expira = new Date();
        expira.setDate(agora.getDate() + diasPlano);
        dadosLiberacao.expiraEm = expira.toISOString().slice(0, 10);
      }

      db.collection("usuariosAutorizados").doc(emailAluno).set(dadosLiberacao, { merge: true })
        .then(function() {
          const vencimentoTexto = planoAluno === "vitalicio" ? "sem vencimento (Vitalício/VIP)" : "até " + limparTextoSeguro(dadosLiberacao.expiraEm);
          mostrarMensagemPainel("✅ Acesso liberado para " + limparTextoSeguro(emailAluno) + " " + vencimentoTexto + ".", "sucesso");
          carregarUsuariosAutorizados();
        })
        .catch(function(erro) {
          console.log("Erro ao liberar aluno:", erro);
          mostrarMensagemPainel("Não foi possível liberar o aluno. Confira as permissões do Firestore.", "aviso");
        });
    }

    function liberarTestePainel() {
      const selectPlano = document.getElementById("planoAlunoPainel");
      if (selectPlano) selectPlano.value = "teste";
      liberarAlunoPainel();
    }

    function bloquearAlunoPainel() {
      if (!usuarioAdmin || !db) {
        mostrarMensagemPainel("Você não tem permissão para bloquear alunos.", "aviso");
        return;
      }

      const emailAluno = obterEmailAlunoPainel();
      if (!emailAluno || !emailAluno.includes("@")) {
        mostrarMensagemPainel("Informe o e-mail do aluno que deseja bloquear.", "aviso");
        return;
      }

      if (!confirm("Tem certeza que deseja bloquear o acesso de " + emailAluno + "?")) return;

      const agora = new Date();
      db.collection("usuariosAutorizados").doc(emailAluno).set({
        ativo: false,
        bloqueadoEm: agora.toLocaleString("pt-BR"),
        atualizadoEm: agora.getTime(),
        bloqueadoPor: usuarioAtual ? usuarioAtual.email : "treinador"
      }, { merge: true })
        .then(function() {
          mostrarMensagemPainel("Acesso bloqueado para " + limparTextoSeguro(emailAluno) + ".", "sucesso");
          carregarUsuariosAutorizados();
        })
        .catch(function(erro) {
          console.log("Erro ao bloquear aluno:", erro);
          mostrarMensagemPainel("Não foi possível bloquear o aluno. Confira as permissões do Firestore.", "aviso");
        });
    }

    function carregarUsuariosAutorizados() {
      const lista = document.getElementById("listaUsuariosAutorizados");
      const dashboard = document.getElementById("dashboardTreinador");
      if (!lista) return;

      if (!usuarioAdmin || !db) {
        lista.innerHTML = "<p class='small'>Área disponível apenas para administrador.</p>";
        if (dashboard) dashboard.innerHTML = "";
        const painelSaas = document.getElementById("painelSaasTreinador");
        const rankingBox = document.getElementById("rankingAlunosTreinador");
        if (painelSaas) painelSaas.innerHTML = "";
        if (rankingBox) rankingBox.innerHTML = "";
        return;
      }

      lista.innerHTML = "<p class='small'>Carregando usuários...</p>";

      db.collection("usuariosAutorizados").get()
        .then(function(snapshot) {
          const usuarios = [];
          snapshot.forEach(function(doc) {
            const dados = doc.data() || {};
            usuarios.push({ email: doc.id, dados: dados });
          });

          usuarios.sort(function(a, b) {
            return Number(b.dados.atualizadoEm || 0) - Number(a.dados.atualizadoEm || 0);
          });

          usuariosAutorizadosCache = usuarios;
          renderizarUsuariosAutorizados(usuarios);
        })
        .catch(function(erro) {
          console.log("Erro ao carregar usuários autorizados:", erro);
          lista.innerHTML = "<p class='small'>Não foi possível carregar a lista. Confira as permissões do Firestore.</p>";
        });
    }

    function renderizarUsuariosAutorizados(usuarios) {
      const lista = document.getElementById("listaUsuariosAutorizados");
      const dashboard = document.getElementById("dashboardTreinador");
      if (!lista) return;

      if (!usuarios || usuarios.length === 0) {
        lista.innerHTML = "<p class='small'>Nenhum usuário autorizado ainda.</p>";
        if (dashboard) dashboard.innerHTML = "";
        return;
      }

      if (dashboard) dashboard.innerHTML = montarDashboardTreinador(usuarios);

      const painelSaas = document.getElementById("painelSaasTreinador");
      const rankingBox = document.getElementById("rankingAlunosTreinador");
      if (painelSaas) painelSaas.innerHTML = montarPainelSaaSTreinador(usuarios);
      if (rankingBox) rankingBox.innerHTML = montarRankingComercialAlunos(usuarios);

      const usuariosParaExibir = mostrarTodosAlunosPainel ? usuarios : usuarios.slice(0, 3);
      lista.innerHTML = "";

      if (usuarios.length > 3) {
        const controle = document.createElement("div");
        controle.className = "admin-lista-controle";
        controle.innerHTML = "<button type='button' class='botao-secundario' onclick='alternarListaCompletaAlunos()'>" + (mostrarTodosAlunosPainel ? "Mostrar apenas os 3 últimos alunos" : "Mostrar todos os alunos") + "</button>";
        lista.appendChild(controle);
      }

      usuariosParaExibir.forEach(function(item) {
        const div = document.createElement("div");
        div.className = "historico-item";
        const ativo = item.dados.ativo === true;
        const emailJS = JSON.stringify(item.email);
        const nomeJS = JSON.stringify(item.dados.nome || "");
        const planoJS = JSON.stringify(item.dados.plano || "mensal");
        const valorJS = JSON.stringify(Number(item.dados.valorMensal || item.dados.valor || 0));
        const diasRenovar = diasParaExpirar(item.dados.expiraEm);
        let alertaRenovacao = "";
        if (alunoPrecisaRenovar(item.dados)) {
          alertaRenovacao = "<div class='alerta alerta-aviso'><strong>⚠️ Renovação próxima:</strong> vence em " + diasRenovar + " dia(s).</div>";
        } else if (planoEstaVencido(item.dados)) {
          alertaRenovacao = "<div class='alerta alerta-aviso'><strong>⏳ Plano vencido:</strong> renove ou bloqueie o aluno.</div>";
        }

        div.innerHTML =
          "<strong>" + limparTextoSeguro(item.dados.nome || item.email) + "</strong><br>" +
          "E-mail: " + limparTextoSeguro(item.email) + "<br>" +
          "Plano: " + limparTextoSeguro(item.dados.plano || "Não informado") + "<br>" +
          "Valor mensal: <strong>" + limparTextoSeguro(formatarMoeda(item.dados.valorMensal || item.dados.valor || 0)) + "</strong><br>" +
          "Status: <strong>" + (ativo ? "Ativo" : "Bloqueado") + "</strong><br>" +
          "Expira em: <strong>" + limparTextoSeguro(item.dados.plano === "vitalicio" ? "Vitalício / VIP" : formatarDataPlano(item.dados.expiraEm)) + "</strong><br>" +
          alertaRenovacao +
          "Atualizado em: " + limparTextoSeguro(item.dados.liberadoEm || item.dados.bloqueadoEm || "Não informado") + "<br>" +
          "<button type='button' class='botao-secundario' onclick='preencherAlunoPainel(" + emailJS + ", " + nomeJS + ", " + planoJS + ", " + valorJS + ")'>Selecionar</button>" +
          "<button type='button' class='botao-secundario' onclick='renovarAlunoPainel(" + emailJS + ", 30)'>Renovar +30 dias</button>" +
          "<button type='button' class='botao-secundario' onclick='copiarMensagemRenovacaoAluno(" + nomeJS + ")'>📩 Copiar aviso</button>" +
          "<button type='button' class='botao-perigo' onclick='excluirAlunoPainel(" + emailJS + ")'>Excluir aluno</button>";
        lista.appendChild(div);
      });
    }


    function dataHojeISO() {
      return new Date().toISOString().slice(0, 10);
    }

    function planoEstaVencido(dados) {
      if (!dados || dados.ativo !== true || dados.plano === "vitalicio" || !dados.expiraEm) return false;
      const hoje = new Date();
      const expira = new Date(dados.expiraEm + "T23:59:59");
      return hoje > expira;
    }

    function formatarMoeda(valor) {
      const numero = Math.max(Number(valor || 0), 0);
      return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    }

    function diasParaExpirar(dataISO) {
      if (!dataISO) return null;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const expira = new Date(dataISO + "T00:00:00");
      return Math.ceil((expira.getTime() - hoje.getTime()) / 86400000);
    }

    function alunoPrecisaRenovar(dados) {
      if (!dados || dados.ativo !== true || dados.plano === "teste" || dados.plano === "vitalicio" || !dados.expiraEm) return false;
      const dias = diasParaExpirar(dados.expiraEm);
      return dias !== null && dias >= 0 && dias <= 7;
    }

    function montarDashboardTreinador(usuarios) {
      const total = usuarios.length;
      const ativos = usuarios.filter(function(item) { return item.dados.ativo === true && !planoEstaVencido(item.dados); }).length;
      const vencidos = usuarios.filter(function(item) { return item.dados.ativo === true && planoEstaVencido(item.dados); }).length;
      const testes = usuarios.filter(function(item) { return item.dados.plano === "teste"; }).length;
      const vitalicios = usuarios.filter(function(item) { return item.dados.plano === "vitalicio"; }).length;
      const bloqueados = usuarios.filter(function(item) { return item.dados.ativo !== true; }).length;
      const renovar = usuarios.filter(function(item) { return alunoPrecisaRenovar(item.dados); }).length;
      const faturamento = usuarios.reduce(function(totalAtual, item) {
        const dados = item.dados || {};
        if (dados.ativo === true && !planoEstaVencido(dados) && dados.plano !== "teste" && dados.plano !== "vitalicio") {
          return totalAtual + Math.max(Number(dados.valorMensal || dados.valor || 0), 0);
        }
        return totalAtual;
      }, 0);

      return "" +
        "<div class='dashboard-box'><strong>" + total + "</strong><span class='small'>Total de alunos</span></div>" +
        "<div class='dashboard-box'><strong>" + ativos + "</strong><span class='small'>Ativos</span></div>" +
        "<div class='dashboard-box'><strong>" + vencidos + "</strong><span class='small'>Vencidos</span></div>" +
        "<div class='dashboard-box'><strong>" + testes + "</strong><span class='small'>Testes grátis</span></div>" +
        "<div class='dashboard-box'><strong>" + vitalicios + "</strong><span class='small'>Vitalícios / VIP</span></div>" +
        "<div class='dashboard-box'><strong>" + bloqueados + "</strong><span class='small'>Bloqueados</span></div>" +
        "<div class='dashboard-box'><strong>" + renovar + "</strong><span class='small'>Renovar em até 7 dias</span></div>" +
        "<div class='dashboard-box'><strong>" + formatarMoeda(faturamento) + "</strong><span class='small'>Faturamento mensal estimado</span></div>";
    }


    function montarPainelSaaSTreinador(usuarios) {
      usuarios = usuarios || [];
      const ativosPagos = usuarios.filter(function(item) {
        const dados = item.dados || {};
        return dados.ativo === true && !planoEstaVencido(dados) && dados.plano !== "teste" && dados.plano !== "vitalicio";
      });

      const testes = usuarios.filter(function(item) { return item.dados && item.dados.plano === "teste"; }).length;
      const vitalicios = usuarios.filter(function(item) { return item.dados && item.dados.plano === "vitalicio"; }).length;
      const renovacao = usuarios.filter(function(item) { return alunoPrecisaRenovar(item.dados || {}); }).length;
      const vencidos = usuarios.filter(function(item) { return planoEstaVencido(item.dados || {}); }).length;
      const receita = ativosPagos.reduce(function(total, item) {
        return total + Math.max(Number((item.dados || {}).valorMensal || (item.dados || {}).valor || 0), 0);
      }, 0);
      const ticketMedio = ativosPagos.length ? receita / ativosPagos.length : 0;
      const conversaoBasica = usuarios.length ? Math.round((ativosPagos.length / usuarios.length) * 100) : 0;

      return "" +
        "<strong>💼 Painel do treinador estilo SaaS</strong><br>" +
        "<span class='small'>Visão de negócio simples, rápida e leve para vender, renovar e acompanhar alunos.</span>" +
        "<div class='saas-grid'>" +
          "<div class='saas-box'><strong>" + formatarMoeda(receita) + "</strong><span>Receita mensal ativa</span></div>" +
          "<div class='saas-box'><strong>" + formatarMoeda(ticketMedio) + "</strong><span>Ticket médio</span></div>" +
          "<div class='saas-box'><strong>" + conversaoBasica + "%</strong><span>Base paga ativa</span></div>" +
          "<div class='saas-box'><strong>" + renovacao + "</strong><span>Renovar em até 7 dias</span></div>" +
          "<div class='saas-box'><strong>" + vencidos + "</strong><span>Vencidos para recuperar</span></div>" +
          "<div class='saas-box'><strong>" + testes + "</strong><span>Testes grátis</span></div>" +
          "<div class='saas-box'><strong>" + vitalicios + "</strong><span>Vitalícios / VIP</span></div>" +
          "<div class='saas-box'><strong>" + usuarios.length + "</strong><span>Total na base</span></div>" +
        "</div>" +
        "<div class='grafico-mini'>" +
          montarLinhaGrafico("Alunos pagos ativos", ativosPagos.length, Math.max(1, usuarios.length), ativosPagos.length + " aluno(s)") +
          montarLinhaGrafico("Testes grátis", testes, Math.max(1, usuarios.length), testes + " teste(s)") +
          montarLinhaGrafico("Renovações próximas", renovacao, Math.max(1, usuarios.length), renovacao + " alerta(s)") +
          montarLinhaGrafico("Vencidos", vencidos, Math.max(1, usuarios.length), vencidos + " aluno(s)") +
        "</div>" +
        "<button type='button' class='botao-secundario' onclick='carregarRankingRealDeTreinos()'>🏆 Carregar ranking real de atividade</button>" +
        "<p class='small'>O ranking real tenta buscar treinos salvos na nuvem. Se as permissões não permitirem, o ranking comercial abaixo continua funcionando.</p>";
    }

    function calcularPontuacaoComercialAluno(item) {
      const dados = item.dados || {};
      let pontos = 0;
      if (dados.ativo === true && !planoEstaVencido(dados)) pontos += 50;
      if (dados.plano !== "teste" && dados.plano !== "vitalicio") pontos += 20;
      if (dados.plano === "vitalicio") pontos += 30;
      if (alunoPrecisaRenovar(dados)) pontos += 10;
      pontos += Math.min(40, Math.round(Math.max(Number(dados.valorMensal || dados.valor || 0), 0)));
      return pontos;
    }

    function montarRankingComercialAlunos(usuarios) {
      usuarios = (usuarios || []).slice().sort(function(a, b) {
        return calcularPontuacaoComercialAluno(b) - calcularPontuacaoComercialAluno(a);
      }).slice(0, 5);

      let htmlRanking = "<strong>🏆 Ranking entre alunos</strong><br>" +
        "<span class='small'>Ranking leve baseado em status, plano e valor mensal. O ranking real de treino pode ser carregado no botão acima.</span>";

      if (usuarios.length === 0) {
        return htmlRanking + "<p class='small'>Nenhum aluno para ranquear ainda.</p>";
      }

      usuarios.forEach(function(item, indice) {
        const dados = item.dados || {};
        const pontos = calcularPontuacaoComercialAluno(item);
        htmlRanking += "<div class='ranking-item'>" +
          "<div class='ranking-posicao'>" + (indice + 1) + "</div>" +
          "<div class='ranking-conteudo'>" +
            "<strong>" + limparTextoSeguro(dados.nome || item.email) + "</strong>" +
            "<span>" + limparTextoSeguro(item.email) + "</span>" +
            "<span>Plano: " + limparTextoSeguro(dados.plano || "Não informado") + " | Valor: " + limparTextoSeguro(formatarMoeda(dados.valorMensal || dados.valor || 0)) + "</span>" +
          "</div>" +
          "<div class='ranking-pontos'>" + pontos + " pts</div>" +
        "</div>";
      });

      return htmlRanking;
    }

    function carregarRankingRealDeTreinos() {
      const rankingBox = document.getElementById("rankingAlunosTreinador");
      if (!rankingBox) return;

      if (!usuarioAdmin || !db) {
        rankingBox.innerHTML = "<strong>🏆 Ranking real de atividade</strong><p class='small'>Área disponível apenas para administrador.</p>";
        return;
      }

      rankingBox.innerHTML = "<strong>🏆 Ranking real de atividade</strong><p class='small'>Carregando treinos salvos na nuvem...</p>";

      db.collectionGroup("treinos").get()
        .then(function(snapshot) {
          const alunos = {};
          const limite90Dias = new Date().getTime() - (90 * 24 * 60 * 60 * 1000);

          snapshot.forEach(function(doc) {
            const treino = doc.data() || {};
            const criadoEm = Number(treino.criadoEm || 0);
            if (criadoEm && criadoEm < limite90Dias) return;

            const nome = treino.nomeUsuario || "Aluno";
            if (!alunos[nome]) {
              alunos[nome] = { nome: nome, treinos: 0, concluidos: 0, total: 0, ultimo: 0 };
            }

            alunos[nome].treinos += 1;
            alunos[nome].concluidos += Number(treino.totalConcluidos || 0);
            alunos[nome].total += Number(treino.totalExercicios || 0);
            if (criadoEm > alunos[nome].ultimo) alunos[nome].ultimo = criadoEm;
          });

          const lista = Object.keys(alunos).map(function(nome) { return alunos[nome]; })
            .sort(function(a, b) {
              const pontosA = (a.treinos * 10) + a.concluidos;
              const pontosB = (b.treinos * 10) + b.concluidos;
              return pontosB - pontosA;
            })
            .slice(0, 10);

          let htmlRanking = "<strong>🏆 Ranking real de atividade</strong><br>" +
            "<span class='small'>Baseado nos treinos salvos nos últimos 90 dias.</span>";

          if (lista.length === 0) {
            rankingBox.innerHTML = htmlRanking + "<p class='small'>Ainda não há treinos suficientes para montar ranking real.</p>";
            return;
          }

          lista.forEach(function(aluno, indice) {
            const pontos = (aluno.treinos * 10) + aluno.concluidos;
            const aproveitamento = aluno.total > 0 ? Math.round((aluno.concluidos / aluno.total) * 100) : 0;
            htmlRanking += "<div class='ranking-item'>" +
              "<div class='ranking-posicao'>" + (indice + 1) + "</div>" +
              "<div class='ranking-conteudo'>" +
                "<strong>" + limparTextoSeguro(aluno.nome) + "</strong>" +
                "<span>" + aluno.treinos + " treino(s) | " + aluno.concluidos + " exercício(s) concluído(s)</span>" +
                "<span>Aproveitamento: " + aproveitamento + "%</span>" +
              "</div>" +
              "<div class='ranking-pontos'>" + pontos + " pts</div>" +
            "</div>";
          });

          rankingBox.innerHTML = htmlRanking;
        })
        .catch(function(erro) {
          console.log("Não foi possível carregar ranking real:", erro);
          rankingBox.innerHTML = "<strong>🏆 Ranking real de atividade</strong><p class='small'>Não foi possível carregar o ranking real. Confira permissões do Firestore para collectionGroup('treinos'). O ranking comercial continua funcionando.</p>";
        });
    }


    function copiarMensagemRenovacaoAluno(nomeAluno) {
      const nome = nomeAluno && String(nomeAluno).trim() ? String(nomeAluno).trim() : "tudo bem";
      const mensagem = "Olá " + nome + ", seu acesso ao MetaTreino vence em breve. Quer renovar por mais 30 dias?";

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mensagem)
          .then(function() {
            mostrarMensagemPainel("📩 Mensagem de renovação copiada. Agora é só colar no WhatsApp do aluno.", "sucesso");
          })
          .catch(function() {
            prompt("Copie a mensagem abaixo:", mensagem);
          });
      } else {
        prompt("Copie a mensagem abaixo:", mensagem);
      }
    }

    function renovarAlunoPainel(emailAluno, dias) {
      if (!usuarioAdmin || !db) {
        mostrarMensagemPainel("Você não tem permissão para renovar alunos.", "aviso");
        return;
      }

      emailAluno = String(emailAluno || "").trim().toLowerCase();
      dias = Number(dias || 30);

      if (!emailAluno || !emailAluno.includes("@")) {
        mostrarMensagemPainel("E-mail inválido para renovação.", "aviso");
        return;
      }

      const hoje = new Date();
      const novaData = new Date();
      novaData.setDate(hoje.getDate() + dias);
      const dataExpiracao = novaData.toISOString().slice(0, 10);

      const campoValorAluno = document.getElementById("valorAlunoPainel");
      const valorAluno = Math.max(Number(campoValorAluno ? campoValorAluno.value : 0) || 0, 0);

      db.collection("usuariosAutorizados").doc(emailAluno).set({
        ativo: true,
        plano: "mensal",
        valorMensal: valorAluno,
        expiraEm: dataExpiracao,
        atualizadoEm: hoje.getTime(),
        renovadoEm: hoje.toLocaleString("pt-BR"),
        renovadoPor: usuarioAtual ? usuarioAtual.email : "treinador"
      }, { merge: true })
        .then(function() {
          mostrarMensagemPainel("✅ Plano renovado por +" + dias + " dias para " + limparTextoSeguro(emailAluno) + ".", "sucesso");
          carregarUsuariosAutorizados();
        })
        .catch(function(erro) {
          console.log("Erro ao renovar aluno:", erro);
          mostrarMensagemPainel("Não foi possível renovar o aluno agora.", "aviso");
        });
    }


    function excluirAlunoPainel(emailAluno) {
      if (!usuarioAdmin || !db) {
        mostrarMensagemPainel("Você não tem permissão para excluir alunos.", "aviso");
        return;
      }

      emailAluno = String(emailAluno || "").trim().toLowerCase();
      if (!emailAluno || !emailAluno.includes("@")) {
        mostrarMensagemPainel("E-mail inválido para exclusão.", "aviso");
        return;
      }

      if (!confirm("Tem certeza que deseja excluir definitivamente o aluno " + emailAluno + "? Ele perderá o acesso e sairá da lista do painel.")) return;

      db.collection("usuariosAutorizados").doc(emailAluno).delete()
        .then(function() {
          mostrarMensagemPainel("Aluno excluído do painel: " + limparTextoSeguro(emailAluno) + ".", "sucesso");
          const campoEmail = document.getElementById("emailAlunoPainel");
          const campoNome = document.getElementById("nomeAlunoPainel");
          if (campoEmail && campoEmail.value.trim().toLowerCase() === emailAluno) campoEmail.value = "";
          if (campoNome) campoNome.value = "";
          carregarUsuariosAutorizados();
        })
        .catch(function(erro) {
          console.log("Erro ao excluir aluno:", erro);
          mostrarMensagemPainel("Não foi possível excluir o aluno. Confira as permissões do Firestore.", "aviso");
        });
    }

    function ajustarValorPlanoPainel() {
      const plano = document.getElementById("planoAlunoPainel");
      const valor = document.getElementById("valorAlunoPainel");
      if (!plano || !valor) return;
      if (plano.value === "teste" || plano.value === "vitalicio") valor.value = "0";
    }

    function preencherAlunoPainel(email, nome, plano, valor) {
      document.getElementById("emailAlunoPainel").value = email || "";
      document.getElementById("nomeAlunoPainel").value = nome || "";
      document.getElementById("planoAlunoPainel").value = plano || "mensal";
      const campoValor = document.getElementById("valorAlunoPainel");
      if (campoValor) campoValor.value = Number(valor || 0);
      document.getElementById("emailAlunoPainel").scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function salvarNaNuvem(caminho, dados) {
      if (!usuarioAtual || !db) {
        return;
      }

      db.collection("usuarios")
        .doc(usuarioAtual.uid)
        .collection(caminho)
        .add(dados)
        .catch(function(erro) {
          console.log("Erro ao salvar na nuvem:", erro);
        });
    }

    function carregarDaNuvem(caminho, callback) {
      if (!usuarioAtual || !db) {
        callback([]);
        return;
      }

      db.collection("usuarios")
        .doc(usuarioAtual.uid)
        .collection(caminho)
        .get()
        .then(function(snapshot) {
          const lista = [];
          snapshot.forEach(function(doc) {
            lista.push(doc.data());
          });
          callback(lista);
        })
        .catch(function(erro) {
          console.log("Erro ao carregar da nuvem:", erro);
          callback([]);
        });
    }

    function carregarDaNuvem(caminho, callback) {
      if (!usuarioAtual || !firebase.firestore) return;
      const firestore = firebase.firestore();
      firestore.collection("usuarios").doc(usuarioAtual.uid).collection(caminho).get()
        .then(snapshot => {
          const lista = [];
          snapshot.forEach(doc => lista.push(doc.data()));
          callback(lista);
        });
    }
    let treinoAtual = [];
    let mensagemEvolucaoAtual = "";
    let feedbackTreinoFinalAtual = "";
    let exerciciosConcluidos = [];
    let sugestoesCarga = {};
    let ultimaCardioCache = null;
    let mostrarTodosAlunosPainel = false;
    let usuariosAutorizadosCache = [];

    const substituicoes = {
      "Supino reto": ["Flexão de braço", "Supino com halteres", "Crucifixo no chão"],
      "Flexão de braço": ["Supino reto", "Supino com halteres", "Flexão com joelhos apoiados"],
      "Desenvolvimento com halteres": ["Desenvolvimento com elástico", "Elevação frontal", "Pike push-up"],
      "Elevação lateral": ["Elevação lateral com elástico", "Elevação lateral com garrafas", "Desenvolvimento leve"],
      "Tríceps corda": ["Tríceps com elástico", "Tríceps banco", "Tríceps francês"],
      "Tríceps banco": ["Tríceps corda", "Tríceps francês", "Flexão fechada"],
      "Remada baixa": ["Remada com elástico", "Remada unilateral com halter", "Remada invertida"],
      "Puxada frente": ["Remada com elástico", "Pullover com halter", "Barra fixa assistida"],
      "Remada unilateral": ["Remada baixa", "Remada com elástico", "Remada invertida"],
      "Rosca direta": ["Rosca com halteres", "Rosca com elástico", "Rosca martelo"],
      "Rosca martelo": ["Rosca direta", "Rosca com elástico", "Rosca concentrada"],
      "Face pull": ["Face pull com elástico", "Crucifixo inverso", "Remada alta leve"],
      "Agachamento": ["Agachamento livre", "Agachamento com mochila", "Cadeira extensora"],
      "Leg press": ["Agachamento livre", "Afundo", "Step-up no banco"],
      "Afundo": ["Agachamento", "Step-up no banco", "Agachamento búlgaro"],
      "Mesa flexora": ["Stiff com halteres", "Ponte de glúteo", "Flexora com bola"],
      "Panturrilha em pé": ["Panturrilha sentado", "Panturrilha unilateral", "Panturrilha no degrau"],
      "Abdominal prancha": ["Abdominal curto", "Dead bug", "Prancha com joelhos apoiados"],
      "Caminhada leve": ["Bicicleta leve", "Mobilidade geral", "Alongamento leve"],
      "Mobilidade geral": ["Alongamento leve", "Caminhada leve", "Respiração e mobilidade"]
    };

    const bibliotecaExercicios = {
      A: [
        { nome: "Supino reto", grupo: "Peito", equipamento: "Banco e barra", nivel: "intermediario", local: ["academia_grande", "academia_pequena", "garagem"], evitar: "ombro", passos: ["Deite no banco com os pés firmes.", "Desça a barra controlando.", "Empurre a barra para cima.", "Mantenha os ombros estáveis."] },
        { nome: "Flexão de braço", grupo: "Peito", equipamento: "Nenhum", nivel: "iniciante", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado", "sem_equipamento"], evitar: "ombro", passos: ["Apoie as mãos no chão.", "Mantenha o corpo alinhado.", "Desça com controle.", "Suba empurrando o chão."] },
        { nome: "Supino com halteres", grupo: "Peito", equipamento: "Halteres", nivel: "iniciante", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado"], evitar: "ombro", passos: ["Deite em banco ou no chão.", "Segure os halteres alinhados.", "Desça com controle.", "Suba sem bater os pesos."] },
        { nome: "Desenvolvimento com halteres", grupo: "Ombros", equipamento: "Halteres", nivel: "intermediario", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado"], evitar: "ombro", passos: ["Segure os halteres nos ombros.", "Empurre para cima.", "Não arqueie demais a lombar.", "Desça devagar."] },
        { nome: "Elevação lateral", grupo: "Ombros", equipamento: "Halteres ou elástico", nivel: "iniciante", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado"], evitar: "ombro", passos: ["Segure um peso em cada mão.", "Eleve até a altura dos ombros.", "Evite balanço.", "Desça devagar."] },
        { nome: "Tríceps corda", grupo: "Tríceps", equipamento: "Polia", nivel: "iniciante", local: ["academia_grande", "academia_pequena"], evitar: "ombro", passos: ["Mantenha cotovelos próximos ao corpo.", "Empurre a corda para baixo.", "Estenda os braços.", "Volte controlando."] },
        { nome: "Tríceps banco", grupo: "Tríceps", equipamento: "Banco ou cadeira", nivel: "iniciante", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado", "sem_equipamento"], evitar: "ombro", passos: ["Apoie as mãos no banco.", "Desça dobrando os cotovelos.", "Mantenha o tronco próximo.", "Suba com controle."] }
      ],
      B: [
        { nome: "Remada baixa", grupo: "Costas", equipamento: "Máquina ou cabo", nivel: "iniciante", local: ["academia_grande", "academia_pequena"], evitar: "lombar", passos: ["Sente com a coluna reta.", "Puxe o cabo ao abdômen.", "Contraia as costas.", "Volte devagar."] },
        { nome: "Puxada frente", grupo: "Costas", equipamento: "Máquina ou cabo", nivel: "iniciante", local: ["academia_grande", "academia_pequena"], evitar: "ombro", passos: ["Segure a barra.", "Puxe em direção ao peito.", "Mantenha o tronco firme.", "Volte controlando."] },
        { nome: "Remada unilateral", grupo: "Costas", equipamento: "Halter ou mochila", nivel: "iniciante", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado"], evitar: "lombar", passos: ["Apoie uma mão em superfície firme.", "Puxe o peso ao quadril.", "Contraia as costas.", "Desça com controle."] },
        { nome: "Remada invertida", grupo: "Costas", equipamento: "Barra baixa", nivel: "intermediario", local: ["academia_grande", "garagem", "sem_equipamento"], evitar: "ombro", passos: ["Segure uma barra baixa.", "Mantenha o corpo alinhado.", "Puxe o peito em direção à barra.", "Desça controlando."] },
        { nome: "Rosca direta", grupo: "Bíceps", equipamento: "Barra ou halteres", nivel: "iniciante", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado"], evitar: "nenhuma", passos: ["Segure com palmas para cima.", "Cotovelos próximos ao corpo.", "Suba contraindo o bíceps.", "Desça devagar."] },
        { nome: "Rosca martelo", grupo: "Bíceps", equipamento: "Halteres", nivel: "iniciante", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado"], evitar: "nenhuma", passos: ["Palmas viradas uma para a outra.", "Mantenha cotovelos fixos.", "Suba com controle.", "Desça devagar."] },
        { nome: "Face pull", grupo: "Ombro posterior", equipamento: "Polia ou elástico", nivel: "intermediario", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado"], evitar: "ombro", passos: ["Puxe em direção ao rosto.", "Abra os cotovelos.", "Contraia ombro posterior.", "Volte controlando."] }
      ],
      C: [
        { nome: "Agachamento", grupo: "Pernas", equipamento: "Peso corporal, barra ou halteres", nivel: "iniciante", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado", "sem_equipamento"], evitar: "joelho", passos: ["Pés na largura dos ombros.", "Desça empurrando quadril para trás.", "Mantenha coluna firme.", "Suba empurrando o chão."] },
        { nome: "Leg press", grupo: "Pernas", equipamento: "Máquina", nivel: "iniciante", local: ["academia_grande", "academia_pequena"], evitar: "joelho", passos: ["Sente com costas apoiadas.", "Pés na plataforma.", "Desça com controle.", "Empurre sem travar joelhos."] },
        { nome: "Afundo", grupo: "Pernas", equipamento: "Peso corporal ou halteres", nivel: "intermediario", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado", "sem_equipamento"], evitar: "joelho", passos: ["Dê um passo à frente.", "Desça controlando.", "Mantenha o tronco firme.", "Volte empurrando a perna da frente."] },
        { nome: "Mesa flexora", grupo: "Posterior de coxa", equipamento: "Máquina", nivel: "iniciante", local: ["academia_grande", "academia_pequena"], evitar: "joelho", passos: ["Ajuste o aparelho.", "Flexione os joelhos.", "Contraia posterior de coxa.", "Volte devagar."] },
        { nome: "Ponte de glúteo", grupo: "Glúteos", equipamento: "Nenhum ou peso", nivel: "iniciante", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado", "sem_equipamento"], evitar: "lombar", passos: ["Deite de barriga para cima.", "Pés no chão.", "Suba o quadril contraindo glúteos.", "Desça com controle."] },
        { nome: "Panturrilha em pé", grupo: "Panturrilha", equipamento: "Peso corporal ou halteres", nivel: "iniciante", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado", "sem_equipamento"], evitar: "nenhuma", passos: ["Fique em pé.", "Suba na ponta dos pés.", "Contraia no topo.", "Desça devagar."] },
        { nome: "Abdominal prancha", grupo: "Abdômen", equipamento: "Nenhum", nivel: "iniciante", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado", "sem_equipamento"], evitar: "lombar", passos: ["Apoie cotovelos e pés.", "Mantenha corpo alinhado.", "Contraia abdômen.", "Não deixe quadril cair."] }
      ],
      descanso: [
        { nome: "Caminhada leve", grupo: "Recuperação", equipamento: "Nenhum", nivel: "iniciante", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado", "sem_equipamento"], evitar: "nenhuma", passos: ["Caminhe em ritmo confortável.", "Respire de forma controlada.", "Não transforme em treino pesado.", "Finalize com alongamentos leves."] },
        { nome: "Mobilidade geral", grupo: "Recuperação", equipamento: "Nenhum", nivel: "iniciante", local: ["academia_grande", "academia_pequena", "garagem", "casa_limitado", "sem_equipamento"], evitar: "nenhuma", passos: ["Movimente ombros, quadril e coluna.", "Evite dor.", "Mantenha controle.", "Use o dia para recuperar."] }
      ]
    };

    function normalizarLocalTreino(valor) {
      const mapa = {
        academia_grande: "academia_completa",
        academia_pequena: "academia_completa",
        garagem: "academia_casa",
        casa_limitado: "halteres",
        sem_equipamento: "sem_equipamento",
        halteres: "halteres",
        academia_casa: "academia_casa",
        academia_completa: "academia_completa",
        personalizado: "personalizado"
      };
      return mapa[valor] || valor || "sem_equipamento";
    }

    function atualizarFormularioEquipamentos() {
      const local = normalizarLocalTreino(document.getElementById("localTreino") ? document.getElementById("localTreino").value : "");
      const box = document.getElementById("boxEquipamentosCasa");
      if (!box) return;
      if (local === "personalizado") box.classList.remove("hidden");
      else box.classList.add("hidden");
    }

    function obterEquipamentosCasaSelecionados() {
      return Array.from(document.querySelectorAll(".equipamento-casa:checked")).map(function(item) { return item.value; });
    }

    function restaurarEquipamentosCasa(lista) {
      const compatibilidade = {
        elasticos: "elastico",
        estacao: "maquina_cabos",
        banco: "banco",
        halteres: "halteres",
        barra: "barra",
        corda: "corda"
      };
      const mapa = {};
      (lista || []).forEach(function(item) { mapa[compatibilidade[item] || item] = true; });
      document.querySelectorAll(".equipamento-casa").forEach(function(input) { input.checked = !!mapa[input.value]; });
    }

    function nomeEquipamentoSelecionado(chave) {
      const mapa = {
        halteres: "Halteres",
        maquina_cabos: "Máquina de cabos / estação de musculação",
        barra: "Barra reta e anilhas",
        maquina_alavanca: "Máquina de alavanca",
        elastico: "Elástico de treino",
        kettlebell: "Kettlebell",
        banco: "Banco de treino",
        com_peso: "Peso livre / carga externa",
        trx: "Suspensão TRX",
        barra_especial: "Barra especial",
        smith: "Máquina Smith",
        rolo_espuma: "Rolo de liberação miofascial",
        bola_estabilidade: "Bola de estabilidade",
        banda_resistencia: "Banda de resistência",
        barra_ez: "Barra EZ",
        maquina_especial: "Máquina específica",
        landmine: "Landmine",
        bastao: "Bastão de mobilidade",
        bola_medicinal: "Bola medicinal",
        treno: "Trenó de treino",
        barra_hexagonal: "Barra hexagonal",
        arnes_cabeca: "Arnês de cabeça",
        equipamento_especial: "Equipamento funcional especial",
        corda: "Corda",
        bosu: "Bola Bosu",
        bola_rolamento: "Bola de rolamento / massagem",
        treno_potencia: "Trenó de potência",
        peso_corporal: "Peso corporal"
      };
      return mapa[chave] || chave;
    }

    function detectarEquipamentosDoExercicio(exercicio) {
      const equipamento = String(exercicio && exercicio.equipamento ? exercicio.equipamento : "").toLowerCase();
      const nome = String(exercicio && exercicio.nome ? exercicio.nome : "").toLowerCase();
      const texto = equipamento + " " + nome;
      const encontrados = [];

      if (texto.includes("peso corporal") || texto.includes("nenhum") || texto.includes("calistenia")) encontrados.push("peso_corporal");
      if (texto.includes("halter")) encontrados.push("halteres");
      if (texto.includes("elástico") || texto.includes("elastico") || texto.includes("mini band")) encontrados.push("elastico");
      if (texto.includes("banda de resistência") || texto.includes("banda de resistencia")) encontrados.push("banda_resistencia");
      if (texto.includes("banco") || texto.includes("cadeira")) encontrados.push("banco");
      if (texto.includes("corda")) encontrados.push("corda");
      if (texto.includes("estação") || texto.includes("estacao") || texto.includes("multifuncional") || texto.includes("polia") || texto.includes("cabo")) encontrados.push("maquina_cabos");
      if (texto.includes("barra ez")) encontrados.push("barra_ez");
      if (texto.includes("barra hexagonal")) encontrados.push("barra_hexagonal");
      if (texto.includes("barra especial")) encontrados.push("barra_especial");
      if (texto.includes("barra") || texto.includes("anilha")) encontrados.push("barra");
      if (texto.includes("smith")) encontrados.push("smith");
      if (texto.includes("máquina de alavanca") || texto.includes("maquina de alavanca") || texto.includes("alavanca")) encontrados.push("maquina_alavanca");
      if (texto.includes("máquina específica") || texto.includes("maquina especifica") || texto.includes("leg press") || texto.includes("mesa flexora") || texto.includes("cadeira extensora")) encontrados.push("maquina_especial");
      if (texto.includes("máquina") || texto.includes("maquina")) encontrados.push("maquina_especial");
      if (texto.includes("kettlebell")) encontrados.push("kettlebell");
      if (texto.includes("trx") || texto.includes("suspensão") || texto.includes("suspensao")) encontrados.push("trx");
      if (texto.includes("rolo")) encontrados.push("rolo_espuma");
      if (texto.includes("bola de estabilidade") || texto.includes("bola suíça") || texto.includes("bola suica")) encontrados.push("bola_estabilidade");
      if (texto.includes("bola medicinal")) encontrados.push("bola_medicinal");
      if (texto.includes("landmine")) encontrados.push("landmine");
      if (texto.includes("bastão") || texto.includes("bastao")) encontrados.push("bastao");
      if (texto.includes("trenó de potência") || texto.includes("treno de potencia")) encontrados.push("treno_potencia");
      if (texto.includes("trenó") || texto.includes("treno")) encontrados.push("treno");
      if (texto.includes("arnês") || texto.includes("arnes")) encontrados.push("arnes_cabeca");
      if (texto.includes("bosu")) encontrados.push("bosu");
      if (texto.includes("rolamento") || texto.includes("massagem")) encontrados.push("bola_rolamento");
      if (texto.includes("peso") && !texto.includes("peso corporal")) encontrados.push("com_peso");

      return encontrados.filter(function(item, indice, lista) { return lista.indexOf(item) === indice; });
    }

    function equipamentosNecessariosDoExercicio(exercicio) {
      return detectarEquipamentosDoExercicio(exercicio).filter(function(tipo) {
        return tipo !== "peso_corporal";
      });
    }

    function contemEquipamentoProibidoParaPesoCorporal(texto) {
      const proibidos = [
        "halter", "banco", "cadeira", "barra", "anilha", "polia", "cabo", "máquina", "maquina", "estação", "estacao",
        "smith", "trx", "corda", "kettlebell", "elástico", "elastico", "mini band", "banda", "bola", "bosu", "rolo",
        "landmine", "trenó", "treno", "arnês", "arnes", "carga externa", "peso livre"
      ];
      return proibidos.some(function(palavra) { return texto.includes(palavra); });
    }

    function equipamentoEhPesoCorporal(exercicio) {
      const equipamento = String(exercicio && exercicio.equipamento ? exercicio.equipamento : "").toLowerCase();
      const nome = String(exercicio && exercicio.nome ? exercicio.nome : "").toLowerCase();
      const texto = equipamento + " " + nome;

      // Aceita quando o próprio exercício informa que pode ser feito sem equipamento.
      if (equipamento.includes("peso corporal") || equipamento.includes("nenhum") || equipamento.includes("calistenia")) return true;

      // Bloqueia exercícios que exigem algum equipamento ou apoio externo.
      if (contemEquipamentoProibidoParaPesoCorporal(texto)) return false;

      const nomesPesoCorporal = [
        "flexão", "flexao", "agachamento livre", "agachamento isométrico", "agachamento isometrico", "afundo alternado", "afundo sem carga",
        "prancha", "abdominal", "ponte de glúteo", "ponte de gluteo", "panturrilha em pé", "panturrilha em pe",
        "polichinelo", "mountain climber", "super-homem", "super homem", "mobilidade", "caminhada", "respiração", "respiracao",
        "alongamento", "pike push-up", "pike push up"
      ];
      return nomesPesoCorporal.some(function(item) { return texto.includes(item); });
    }

    function equipamentoTemAlternativa(exercicio) {
      const equipamento = String(exercicio && exercicio.equipamento ? exercicio.equipamento : "").toLowerCase();
      return equipamento.includes(" ou ") || equipamento.includes("/") || equipamento.includes(",");
    }

    function equipamentoCompativelComLista(exercicio, permitidos, permitirPesoCorporal) {
      if (permitirPesoCorporal && equipamentoEhPesoCorporal(exercicio)) return true;
      const necessarios = equipamentosNecessariosDoExercicio(exercicio);
      if (!necessarios.length) return false;

      if (equipamentoTemAlternativa(exercicio)) {
        return necessarios.some(function(tipo) { return permitidos.includes(tipo); });
      }

      return necessarios.every(function(tipo) { return permitidos.includes(tipo); });
    }

    function ajustarEquipamentoVisualPorLocal(exercicio) {
      if (!perfilUsuario || !exercicio) return exercicio;
      const local = normalizarLocalTreino(perfilUsuario.localTreino || "");
      const copia = Object.assign({}, exercicio);
      const tipos = detectarEquipamentosDoExercicio(copia);
      const selecionados = perfilUsuario.equipamentosCasa || [];

      if (local === "sem_equipamento" && equipamentoEhPesoCorporal(copia)) {
        copia.equipamento = "Peso corporal";
        return copia;
      }

      if (local === "halteres") {
        if (equipamentoEhPesoCorporal(copia)) copia.equipamento = "Peso corporal";
        else if (tipos.includes("halteres")) copia.equipamento = "Halteres";
      }

      if (local === "academia_casa") {
        if (equipamentoEhPesoCorporal(copia)) copia.equipamento = "Peso corporal";
        else {
          const nomesCasa = ["barra", "halteres", "com_peso"].filter(function(item) { return tipos.includes(item); }).map(nomeEquipamentoSelecionado);
          if (nomesCasa.length) copia.equipamento = nomesCasa.join(" + ");
        }
      }

      if (local === "personalizado" && selecionados.length > 0) {
        if (equipamentoEhPesoCorporal(copia)) copia.equipamento = "Peso corporal";
        else {
          const nomesMarcados = selecionados.filter(function(item) { return tipos.includes(item); }).map(nomeEquipamentoSelecionado);
          if (nomesMarcados.length > 0) copia.equipamento = nomesMarcados.join(" + ");
        }
      }

      return copia;
    }

    function equipamentoCompativelComPerfil(exercicio) {
      if (!perfilUsuario) return true;
      const local = normalizarLocalTreino(perfilUsuario.localTreino || "academia_completa");

      if (local === "academia_completa") return true;
      if (local === "sem_equipamento") return equipamentoEhPesoCorporal(exercicio);
      if (local === "halteres") return equipamentoCompativelComLista(exercicio, ["halteres"], true);
      if (local === "academia_casa") return equipamentoCompativelComLista(exercicio, ["halteres", "barra", "com_peso"], true);
      if (local === "personalizado") {
        const selecionados = perfilUsuario.equipamentosCasa || [];
        if (!selecionados.length) return equipamentoEhPesoCorporal(exercicio);
        return equipamentoCompativelComLista(exercicio, selecionados, true);
      }
      return true;
    }

    function instalarExerciciosVersao133() {
      const novos = {
        A: [
          criarExercicioPesoCorporal("Flexão ajoelhada", "Peito", "ombro", ["Apoie joelhos no chão.", "Mantenha tronco alinhado.", "Desça com controle.", "Suba empurrando o chão."]),
          criarExercicioPesoCorporal("Flexão diamante adaptada", "Tríceps", "ombro", ["Aproxime as mãos em formato de diamante.", "Use joelhos no chão se necessário.", "Desça sem abrir demais os cotovelos.", "Suba com controle."]),
          criarExercicioPesoCorporal("Pike push-up", "Ombros", "ombro", ["Eleve o quadril formando um V invertido.", "Flexione os cotovelos.", "Aproxime a cabeça do chão com cuidado.", "Suba controlando."]),
          { nome: "Supino no chão com halteres", grupo: "Peito", equipamento: "Halteres", nivel: "iniciante", local: ["casa_limitado", "garagem"], evitar: "ombro", passos: ["Deite no chão.", "Segure os halteres alinhados ao peito.", "Desça até o braço tocar levemente o chão.", "Suba sem bater os pesos."] },
          { nome: "Elevação lateral com elástico", grupo: "Ombros", equipamento: "Elástico", nivel: "iniciante", local: ["casa_limitado", "garagem"], evitar: "ombro", passos: ["Pise no elástico.", "Segure as pontas.", "Eleve os braços lateralmente.", "Desça devagar."] },
          { nome: "Tríceps francês com halter", grupo: "Tríceps", equipamento: "Halteres", nivel: "iniciante", local: ["casa_limitado", "garagem"], evitar: "ombro", passos: ["Segure um halter acima da cabeça.", "Flexione os cotovelos.", "Estenda os braços com controle.", "Evite arquear a lombar."] }
        ],
        B: [
          criarExercicioPesoCorporal("Super-homem", "Lombar", "lombar", ["Deite de barriga para baixo.", "Eleve braços e pernas levemente.", "Segure por alguns segundos.", "Volte com controle."]),
          criarExercicioPesoCorporal("Prancha com toque no ombro", "Abdômen", "ombro", ["Fique em posição de prancha alta.", "Toque um ombro com a mão oposta.", "Alterne os lados.", "Evite balançar o quadril."]),
          { nome: "Remada com elástico sentado", grupo: "Costas", equipamento: "Elástico", nivel: "iniciante", local: ["casa_limitado", "garagem"], evitar: "lombar", passos: ["Sente no chão.", "Passe o elástico pelos pés.", "Puxe as pontas em direção ao peito.", "Volte devagar."] },
          { nome: "Remada curvada com halteres", grupo: "Costas", equipamento: "Halteres", nivel: "intermediario", local: ["casa_limitado", "garagem"], evitar: "lombar", passos: ["Incline o tronco com coluna firme.", "Puxe os halteres em direção ao quadril.", "Contraia as costas.", "Desça controlando."] },
          { nome: "Rosca bíceps com elástico", grupo: "Bíceps", equipamento: "Elástico", nivel: "iniciante", local: ["casa_limitado", "garagem"], evitar: "nenhuma", passos: ["Pise no elástico.", "Segure as pontas.", "Flexione os cotovelos.", "Desça devagar."] }
        ],
        C: [
          criarExercicioPesoCorporal("Agachamento isométrico na parede", "Pernas", "joelho", ["Encoste as costas na parede.", "Desça até uma posição confortável.", "Segure sem prender a respiração.", "Suba devagar."]),
          criarExercicioPesoCorporal("Agachamento búlgaro sem carga", "Pernas", "joelho", ["Apoie o pé de trás em cadeira firme se tiver.", "Desça com controle.", "Mantenha o tronco estável.", "Troque a perna."]),
          criarExercicioPesoCorporal("Abdominal infra", "Abdômen", "lombar", ["Deite de barriga para cima.", "Eleve as pernas com controle.", "Contraia o abdômen.", "Volte sem perder a postura."]),
          criarExercicioPesoCorporal("Mountain climber controlado", "Cardio/Abdômen", "lombar", ["Apoie as mãos no chão.", "Traga os joelhos alternadamente.", "Mantenha abdômen firme.", "Faça devagar se necessário."]),
          { nome: "Agachamento goblet", grupo: "Pernas", equipamento: "Halteres", nivel: "iniciante", local: ["casa_limitado", "garagem"], evitar: "joelho", passos: ["Segure um halter junto ao peito.", "Desça com controle.", "Mantenha coluna firme.", "Suba empurrando o chão."] },
          { nome: "Elevação de quadril com mini band", grupo: "Glúteos", equipamento: "Elástico / mini band", nivel: "iniciante", local: ["casa_limitado", "garagem"], evitar: "lombar", passos: ["Coloque a mini band acima dos joelhos.", "Deite com pés no chão.", "Suba o quadril contraindo glúteos.", "Desça controlando."] },
          { nome: "Levantamento terra com halteres", grupo: "Posterior de coxa", equipamento: "Halteres", nivel: "intermediario", local: ["casa_limitado", "garagem"], evitar: "lombar", passos: ["Segure os halteres à frente do corpo.", "Incline o tronco com coluna firme.", "Sinta posterior de coxa alongar.", "Suba contraindo glúteos."] }
        ],
        descanso: [
          criarExercicioPesoCorporal("Respiração e mobilidade", "Recuperação", "nenhuma", ["Respire profundamente.", "Movimente ombros, quadril e coluna.", "Evite posições dolorosas.", "Finalize leve."])
        ]
      };
      Object.keys(novos).forEach(function(chave) {
        bibliotecaExercicios[chave] = filtrarExerciciosUnicos((bibliotecaExercicios[chave] || []).concat(novos[chave]));
      });
    }

    instalarExerciciosVersao133();

    function instalarExerciciosEstacaoMS8000() {
      const estacaoLocal = ["academia_completa", "personalizado"];
      const equipamentoEstacao = "Estação de musculação";
      const novos = {
        A: [
          { nome: "Supino na estação multifuncional", grupo: "Peito", equipamento: equipamentoEstacao, nivel: "iniciante", local: estacaoLocal, evitar: "ombro", passos: ["Ajuste o banco e as pegadas na altura do peito.", "Mantenha as costas apoiadas e pés firmes.", "Empurre à frente sem travar os cotovelos.", "Volte controlando a carga de 80 kg."] },
          { nome: "Voador na estação", grupo: "Peito", equipamento: equipamentoEstacao, nivel: "iniciante", local: estacaoLocal, evitar: "ombro", passos: ["Ajuste os braços do voador na linha do peito.", "Mantenha cotovelos levemente flexionados.", "Feche os braços contraindo o peito.", "Abra devagar sem forçar o ombro."] },
          { nome: "Crucifixo no cabo da estação", grupo: "Peito", equipamento: equipamentoEstacao, nivel: "intermediario", local: estacaoLocal, evitar: "ombro", passos: ["Use as polias/cabos na posição adequada se a estação permitir.", "Incline levemente o tronco e mantenha postura firme.", "Traga as mãos à frente do peito.", "Volte controlando sem abrir demais os ombros."] },
          { nome: "Tríceps corda na estação", grupo: "Tríceps", equipamento: equipamentoEstacao, nivel: "iniciante", local: estacaoLocal, evitar: "ombro", passos: ["Prenda a corda na polia alta.", "Mantenha cotovelos próximos ao corpo.", "Empurre a corda para baixo até estender os braços.", "Volte devagar sem balançar o tronco."] },
          { nome: "Tríceps barra na polia", grupo: "Tríceps", equipamento: equipamentoEstacao, nivel: "iniciante", local: estacaoLocal, evitar: "ombro", passos: ["Use a barra curta na polia alta.", "Mantenha cotovelos fixos ao lado do corpo.", "Estenda os braços para baixo.", "Volte controlando a carga."] }
        ],
        B: [
          { nome: "Puxada alta frente na estação", grupo: "Costas", equipamento: equipamentoEstacao, nivel: "iniciante", local: estacaoLocal, evitar: "ombro", passos: ["Sente com a coluna firme.", "Segure a barra da polia alta.", "Puxe em direção ao peito sem jogar o corpo para trás.", "Volte controlando até alongar as costas."] },
          { nome: "Puxada baixa na estação", grupo: "Costas", equipamento: equipamentoEstacao, nivel: "iniciante", local: estacaoLocal, evitar: "lombar", passos: ["Sente com postura firme.", "Segure o puxador da polia baixa.", "Puxe em direção ao abdômen.", "Volte devagar mantendo o tronco estável."] },
          { nome: "Remada baixa na estação", grupo: "Costas", equipamento: equipamentoEstacao, nivel: "iniciante", local: estacaoLocal, evitar: "lombar", passos: ["Use a polia baixa com pegada confortável.", "Puxe os cotovelos para trás.", "Contraia as costas sem curvar a lombar.", "Retorne lentamente."] },
          { nome: "Rosca direta na polia baixa", grupo: "Bíceps", equipamento: equipamentoEstacao, nivel: "iniciante", local: estacaoLocal, evitar: "nenhuma", passos: ["Prenda a barra curta na polia baixa.", "Mantenha cotovelos próximos ao corpo.", "Flexione os cotovelos contraindo o bíceps.", "Desça devagar sem roubar."] },
          { nome: "Rosca Scott na estação", grupo: "Bíceps", equipamento: equipamentoEstacao, nivel: "iniciante", local: estacaoLocal, evitar: "nenhuma", passos: ["Use o apoio Scott se a estação estiver montada com esse suporte.", "Apoie os braços e segure a barra/cabo.", "Suba contraindo o bíceps.", "Desça controlando sem esticar demais o cotovelo."] }
        ],
        C: [
          { nome: "Extensão de pernas na estação", grupo: "Quadríceps", equipamento: equipamentoEstacao, nivel: "iniciante", local: estacaoLocal, evitar: "joelho", passos: ["Sente e ajuste o rolo próximo aos tornozelos.", "Estenda os joelhos com controle.", "Contraia o quadríceps no alto.", "Volte devagar sem bater as placas."] },
          { nome: "Flexora unilateral na estação", grupo: "Posterior de coxa", equipamento: equipamentoEstacao, nivel: "iniciante", local: estacaoLocal, evitar: "joelho", passos: ["Ajuste o apoio para uma perna por vez.", "Flexione o joelho levando o calcanhar para trás.", "Controle o movimento sem girar o quadril.", "Volte devagar e troque a perna."] },
          { nome: "Coice de glúteo na polia", grupo: "Glúteos", equipamento: equipamentoEstacao, nivel: "intermediario", local: estacaoLocal, evitar: "lombar", passos: ["Use a tornozeleira na polia baixa se disponível.", "Mantenha tronco estável e abdômen firme.", "Leve a perna para trás contraindo o glúteo.", "Volte devagar sem arquear a lombar."] },
          { nome: "Abdominal no cabo ajoelhado", grupo: "Abdômen", equipamento: equipamentoEstacao, nivel: "intermediario", local: estacaoLocal, evitar: "lombar", passos: ["Use a corda na polia alta.", "Ajoelhe com postura firme.", "Flexione o tronco contraindo o abdômen.", "Retorne controlando sem puxar com os braços."] }
        ],
        descanso: [
          criarExercicioPesoCorporal("Alongamento de peitoral e costas", "Recuperação", "nenhuma", ["Mantenha respiração calma.", "Alongue peito e costas sem dor.", "Segure cada posição por alguns segundos.", "Use como recuperação ativa."]),
          criarExercicioPesoCorporal("Mobilidade de quadril e tornozelo", "Recuperação", "nenhuma", ["Faça movimentos lentos de quadril.", "Mobilize tornozelos com controle.", "Evite amplitude dolorosa.", "Finalize leve."]),
          criarExercicioPesoCorporal("Caminhada técnica leve", "Recuperação", "nenhuma", ["Caminhe em ritmo confortável.", "Mantenha postura alta.", "Respire pelo nariz quando possível.", "Não transforme em treino intenso."]),
          criarExercicioPesoCorporal("Prancha curta de ativação", "Abdômen", "lombar", ["Apoie joelhos se necessário.", "Contraia o abdômen por poucos segundos.", "Não force a lombar.", "Use apenas como ativação leve."])
        ]
      };
      Object.keys(novos).forEach(function(chave) {
        bibliotecaExercicios[chave] = filtrarExerciciosUnicos((bibliotecaExercicios[chave] || []).concat(novos[chave]));
      });
    }

    instalarExerciciosEstacaoMS8000();

    function instalarExerciciosPersonalizados133() {
      const emTodos = ["academia_completa", "personalizado"];
      const casa = ["halteres", "academia_casa", "academia_completa", "personalizado"];
      const novos = {
        A: [
          { nome: "Supino com halteres", grupo: "Peito", equipamento: "Halteres + banco", nivel: "iniciante", local: casa, evitar: "ombro", passos: ["Apoie as costas no banco.", "Segure os halteres na linha do peito.", "Empurre para cima com controle.", "Desça sem forçar os ombros."] },
          { nome: "Desenvolvimento militar com barra", grupo: "Ombros", equipamento: "Barra reta e anilhas", nivel: "intermediario", local: ["academia_casa", "academia_completa", "personalizado"], evitar: "ombro", passos: ["Segure a barra na altura dos ombros.", "Contraia o abdômen.", "Empurre a barra acima da cabeça.", "Desça controlando."] },
          { nome: "Supino no Smith", grupo: "Peito", equipamento: "Máquina Smith", nivel: "intermediario", local: emTodos, evitar: "ombro", passos: ["Ajuste o banco no Smith.", "Desça a barra até a linha do peito.", "Empurre sem travar os cotovelos.", "Mantenha controle do movimento."] },
          { nome: "Tríceps testa com barra EZ", grupo: "Tríceps", equipamento: "Barra EZ", nivel: "intermediario", local: emTodos, evitar: "ombro", passos: ["Deite no banco.", "Segure a barra EZ.", "Flexione os cotovelos com controle.", "Estenda sem abrir demais os braços."] },
          { nome: "Flexão no TRX", grupo: "Peito", equipamento: "Suspensão TRX", nivel: "intermediario", local: emTodos, evitar: "ombro", passos: ["Segure as alças do TRX.", "Incline o corpo com segurança.", "Desça em flexão controlada.", "Empurre e volte à posição inicial."] },
          { nome: "Arremesso de bola medicinal", grupo: "Peito", equipamento: "Bola medicinal", nivel: "intermediario", local: emTodos, evitar: "ombro", passos: ["Segure a bola na altura do peito.", "Empurre/arremesse de forma controlada.", "Receba a bola com segurança.", "Mantenha postura firme."] },
          { nome: "Desenvolvimento com kettlebell", grupo: "Ombros", equipamento: "Kettlebell", nivel: "intermediario", local: emTodos, evitar: "ombro", passos: ["Segure o kettlebell próximo ao ombro.", "Mantenha abdômen firme.", "Empurre acima da cabeça.", "Desça devagar."] },
          { nome: "Elevação lateral na máquina", grupo: "Ombros", equipamento: "Máquina específica", nivel: "iniciante", local: emTodos, evitar: "ombro", passos: ["Ajuste a máquina.", "Eleve os braços até a linha dos ombros.", "Evite impulso.", "Volte controlando."] }
        ],
        B: [
          { nome: "Remada curvada com barra", grupo: "Costas", equipamento: "Barra reta e anilhas", nivel: "intermediario", local: ["academia_casa", "academia_completa", "personalizado"], evitar: "lombar", passos: ["Incline o tronco com coluna firme.", "Puxe a barra em direção ao abdômen.", "Contraia as costas.", "Desça controlando."] },
          { nome: "Remada no TRX", grupo: "Costas", equipamento: "Suspensão TRX", nivel: "iniciante", local: emTodos, evitar: "ombro", passos: ["Segure as alças.", "Incline o corpo.", "Puxe o peito em direção às mãos.", "Volte devagar."] },
          { nome: "Remada unilateral landmine", grupo: "Costas", equipamento: "Landmine", nivel: "intermediario", local: emTodos, evitar: "lombar", passos: ["Posicione a barra no landmine.", "Segure a ponta da barra.", "Puxe em direção ao tronco.", "Controle a volta."] },
          { nome: "Rosca direta com barra EZ", grupo: "Bíceps", equipamento: "Barra EZ", nivel: "iniciante", local: emTodos, evitar: "nenhuma", passos: ["Segure a barra EZ.", "Mantenha cotovelos próximos ao corpo.", "Suba contraindo bíceps.", "Desça devagar."] },
          { nome: "Rosca com barra especial", grupo: "Bíceps", equipamento: "Barra especial", nivel: "intermediario", local: emTodos, evitar: "nenhuma", passos: ["Segure a barra com pegada confortável.", "Evite balançar o tronco.", "Flexione os cotovelos.", "Desça controlando."] },
          { nome: "Puxada alta na máquina de alavanca", grupo: "Costas", equipamento: "Máquina de alavanca", nivel: "iniciante", local: emTodos, evitar: "ombro", passos: ["Ajuste o assento.", "Segure as alças.", "Puxe em direção ao peito.", "Volte sem soltar a carga."] },
          { nome: "Flexão de pescoço com arnês", grupo: "Pescoço", equipamento: "Arnês de cabeça", nivel: "avancado", local: emTodos, evitar: "coluna", passos: ["Use carga muito leve.", "Mantenha postura neutra.", "Movimente devagar.", "Interrompa se houver desconforto."] },
          { nome: "Remada com barra hexagonal", grupo: "Costas", equipamento: "Barra hexagonal", nivel: "intermediario", local: emTodos, evitar: "lombar", passos: ["Segure a barra hexagonal.", "Incline pouco o tronco.", "Puxe com controle.", "Desça mantendo coluna firme."] }
        ],
        C: [
          { nome: "Agachamento com barra", grupo: "Pernas", equipamento: "Barra reta e anilhas", nivel: "intermediario", local: ["academia_casa", "academia_completa", "personalizado"], evitar: "joelho", passos: ["Apoie a barra com segurança.", "Desça controlando.", "Mantenha coluna firme.", "Suba empurrando o chão."] },
          { nome: "Levantamento terra com barra hexagonal", grupo: "Posterior de coxa", equipamento: "Barra hexagonal", nivel: "intermediario", local: emTodos, evitar: "lombar", passos: ["Entre no centro da barra.", "Segure as alças.", "Suba com coluna neutra.", "Desça controlando."] },
          { nome: "Agachamento no Smith", grupo: "Quadríceps", equipamento: "Máquina Smith", nivel: "intermediario", local: emTodos, evitar: "joelho", passos: ["Ajuste a barra do Smith.", "Posicione os pés com segurança.", "Desça até amplitude confortável.", "Suba sem travar joelhos."] },
          { nome: "Avanço com kettlebell", grupo: "Pernas", equipamento: "Kettlebell", nivel: "intermediario", local: emTodos, evitar: "joelho", passos: ["Segure o kettlebell.", "Dê um passo à frente.", "Desça com controle.", "Volte e alterne as pernas."] },
          { nome: "Agachamento com bola Bosu", grupo: "Pernas", equipamento: "Bola Bosu", nivel: "intermediario", local: emTodos, evitar: "joelho", passos: ["Use a Bosu em local seguro.", "Desça devagar.", "Mantenha equilíbrio.", "Suba com controle."] },
          { nome: "Flexora na bola de estabilidade", grupo: "Posterior de coxa", equipamento: "Bola de estabilidade", nivel: "intermediario", local: emTodos, evitar: "lombar", passos: ["Deite de barriga para cima.", "Apoie os pés na bola.", "Flexione os joelhos puxando a bola.", "Volte controlando."] },
          { nome: "Empurrar trenó", grupo: "Pernas", equipamento: "Trenó de treino", nivel: "intermediario", local: emTodos, evitar: "joelho", passos: ["Ajuste uma carga segura.", "Incline o corpo no trenó.", "Empurre com passos curtos.", "Mantenha ritmo controlado."] },
          { nome: "Sprint com trenó de potência", grupo: "Pernas", equipamento: "Trenó de potência", nivel: "avancado", local: emTodos, evitar: "joelho", passos: ["Use carga leve a moderada.", "Mantenha tronco firme.", "Empurre com passos potentes.", "Pare se perder a técnica."] },
          { nome: "Mobilidade com bastão", grupo: "Mobilidade", equipamento: "Bastão de mobilidade", nivel: "iniciante", local: emTodos, evitar: "nenhuma", passos: ["Segure o bastão com pegada ampla.", "Faça movimentos lentos.", "Não force amplitude.", "Use para aquecer ou recuperar."] }
        ],
        descanso: [
          { nome: "Liberação com rolo de espuma", grupo: "Recuperação", equipamento: "Rolo de liberação miofascial", nivel: "iniciante", local: emTodos, evitar: "nenhuma", passos: ["Passe o rolo devagar nos músculos tensos.", "Evite pontos de dor forte.", "Respire fundo.", "Use como recuperação leve."] },
          { nome: "Alongamento com bola de rolamento", grupo: "Recuperação", equipamento: "Bola de rolamento / massagem", nivel: "iniciante", local: emTodos, evitar: "nenhuma", passos: ["Use a bola em regiões tensas.", "Faça pressão leve.", "Movimente devagar.", "Não aplique sobre articulações."] }
        ]
      };
      Object.keys(novos).forEach(function(chave) {
        bibliotecaExercicios[chave] = filtrarExerciciosUnicos((bibliotecaExercicios[chave] || []).concat(novos[chave]));
      });
    }

    instalarExerciciosPersonalizados133();

    function ajustarTreinoPorSexoIdadePesoCheckin(treino, energia, dor, tempo) {
      if (!perfilUsuario || !treino || treino.length === 0) return treino;
      const idade = Number(perfilUsuario.idade || 0);
      const peso = Number(perfilUsuario.peso || 0);
      const sexo = perfilUsuario.sexo || "";
      const imc = Number(perfilUsuario.imc || 0);
      return treino.map(function(exercicio) {
        const copia = Object.assign({}, exercicio);
        const grupo = copia.grupo || "";
        if (idade >= 55 || imc >= 30 || energia === "mal") {
          if (copia.series && !copia.series.includes("2")) copia.series = "2 a 3 séries";
          if (copia.reps && (copia.reps.includes("15") || copia.reps.includes("12"))) copia.reps = "8 a 12 reps";
        }
        if (peso >= 100 && ["Pernas", "Quadríceps", "Cardio", "Cardio/Abdômen"].includes(grupo)) {
          copia.reps = copia.reps || "8 a 12 reps";
          copia.observacao = "Priorize baixo impacto e controle da execução.";
        }
        if (sexo === "feminino" && ["Glúteos", "Posterior de coxa", "Quadríceps"].includes(grupo) && perfilUsuario.metaPrincipal !== "forca") {
          copia.series = copia.series || "3 séries";
          copia.reps = copia.reps || "10 a 15 reps";
        }
        if (sexo === "masculino" && perfilUsuario.metaPrincipal === "massa" && ["Peito", "Costas", "Ombros", "Bíceps", "Tríceps"].includes(grupo) && idade < 55 && energia === "bem") {
          copia.series = "3 a 4 séries";
          copia.reps = "8 a 12 reps";
        }
        if (dor !== "nenhuma") {
          copia.observacao = (copia.observacao ? copia.observacao + " " : "") + "Faça sem dor e reduza carga se sentir desconforto.";
        }
        return copia;
      });
    }


    function carregarPerfilAutomaticamente() {
      const perfilSalvo = localStorage.getItem("perfilUsuario");
      if (!perfilSalvo) return;
      perfilUsuario = JSON.parse(perfilSalvo);
      document.getElementById("nome").value = perfilUsuario.nome || "";
      document.getElementById("sexo").value = perfilUsuario.sexo || "";
      if (document.getElementById("dataNascimento")) document.getElementById("dataNascimento").value = perfilUsuario.dataNascimento || "";
      document.getElementById("peso").value = perfilUsuario.peso || "";
      document.getElementById("altura").value = perfilUsuario.alturaCm || "";
      document.getElementById("metaPrincipal").value = perfilUsuario.metaPrincipal || "massa";
      document.getElementById("rotinaAtual").value = perfilUsuario.rotinaAtual || "nunca";
      document.getElementById("tempoExperiencia").value = perfilUsuario.tempoExperiencia || "menos_1";
      document.getElementById("localTreino").value = normalizarLocalTreino(perfilUsuario.localTreino || "academia_completa");
      atualizarFormularioEquipamentos();
      restaurarEquipamentosCasa(perfilUsuario.equipamentosCasa || []);
      mostrarResumoPerfilCarregado();
      document.getElementById("botaoIrTreino").classList.remove("hidden");
    }

    function mostrarResumoPerfilCarregado() {
      const resultadoPerfil = document.getElementById("resultadoPerfil");
      resultadoPerfil.classList.remove("hidden");
      resultadoPerfil.innerHTML = "<strong>Perfil carregado automaticamente</strong><br>" + perfilUsuario.nome + ", seu IMC salvo é " + perfilUsuario.imc + ".<br>Classificação: " + perfilUsuario.classificacao + ".<br>Meta: " + traduzirMeta(perfilUsuario.metaPrincipal) + ".<br>Local de treino: " + traduzirLocal(perfilUsuario.localTreino) + ".<br><br><span class='small'>Se quiser alterar seus dados, edite os campos e clique em Calcular e salvar perfil.</span>";
    }

    function calcularPerfil() {
      if (!acessoLiberado) {
        bloquearApp("Faça login com um e-mail autorizado para usar o app.");
        return;
      }

      const nome = document.getElementById("nome").value.trim();
      const sexo = document.getElementById("sexo").value;
      const dataNascimento = document.getElementById("dataNascimento") ? document.getElementById("dataNascimento").value : "";
      const idade = calcularIdadePorNascimento(dataNascimento);
      const peso = Number(document.getElementById("peso").value);
      const alturaCm = Number(document.getElementById("altura").value);
      const metaPrincipal = document.getElementById("metaPrincipal").value;
      const rotinaAtual = document.getElementById("rotinaAtual").value;
      const tempoExperiencia = document.getElementById("tempoExperiencia").value;
      const localTreino = normalizarLocalTreino(document.getElementById("localTreino").value);
      const equipamentosCasa = obterEquipamentosCasaSelecionados();
      const resultadoPerfil = document.getElementById("resultadoPerfil");
      const botaoIrTreino = document.getElementById("botaoIrTreino");

      if (sexo === "") {
        resultadoPerfil.classList.remove("hidden");
        resultadoPerfil.innerHTML = "Escolha uma opção no campo Sexo para continuar.";
        botaoIrTreino.classList.add("hidden");
        return;
      }

      if (nome === "" || !dataNascimento || idade <= 0 || peso <= 0 || peso > 700 || alturaCm <= 0) {
        resultadoPerfil.classList.remove("hidden");
        resultadoPerfil.innerHTML = "Preencha todos os campos corretamente. O peso deve estar entre 1 e 700 kg.";
        botaoIrTreino.classList.add("hidden");
        return;
      }

      const perfilAntigo = JSON.parse(localStorage.getItem("perfilUsuario") || "null");
      const alturaM = alturaCm / 100;
      const imc = peso / (alturaM * alturaM);
      let classificacao = "";
      let mensagem = "";

      if (imc < 18.5) { classificacao = "abaixo do peso"; mensagem = "Seu foco pode ser ganhar massa muscular com alimentação adequada."; }
      else if (imc < 25) { classificacao = "dentro da faixa considerada normal"; mensagem = "Seu foco pode ser melhorar composição corporal, força e condicionamento."; }
      else if (imc < 30) { classificacao = "acima do peso"; mensagem = "Seu foco pode ser reduzir gordura corporal e manter ou ganhar massa magra."; }
      else { classificacao = "em faixa de obesidade pelo IMC"; mensagem = "O ideal é começar com treinos seguros, progressivos e, se possível, acompanhamento profissional."; }

      perfilUsuario = { nome, sexo, dataNascimento, idade, peso, alturaCm, imc: imc.toFixed(1), classificacao, mensagem, metaPrincipal, rotinaAtual, tempoExperiencia, localTreino, equipamentosCasa: [] };
      localStorage.setItem("perfilUsuario", JSON.stringify(perfilUsuario));
      registrarPeso(peso);
      mostrarMensagemMudancaPeso(perfilAntigo, peso);

      resultadoPerfil.classList.remove("hidden");
      resultadoPerfil.innerHTML = "<strong>" + nome + ", seu IMC é " + imc.toFixed(1) + "</strong><br>Classificação: " + classificacao + ".<br>" + mensagem + "<br>Meta: " + traduzirMeta(metaPrincipal) + ".<br>Rotina: " + traduzirRotina(rotinaAtual) + ".<br>Experiência: " + traduzirExperiencia(tempoExperiencia) + ".<br>Local: " + traduzirLocal(localTreino) + ".<br>Equipamentos: " + limparTextoSeguro(equipamentosCasa.length ? equipamentosCasa.map(nomeEquipamentoSelecionado).join(", ") : (localTreino === "sem_equipamento" ? "peso corporal" : (localTreino === "personalizado" ? "peso corporal (nenhum equipamento marcado)" : "equipamentos automáticos da categoria"))) + ".<br><br><span class='small'>Observação: IMC é uma estimativa simples. Ele não diferencia massa muscular de gordura.</span>";
      botaoIrTreino.classList.remove("hidden");
    }

    function registrarPeso(peso) {
      const historicoPeso = JSON.parse(localStorage.getItem("historicoPeso") || "[]");
      historicoPeso.unshift({ data: new Date().toLocaleString("pt-BR"), peso: peso });
      localStorage.setItem("historicoPeso", JSON.stringify(historicoPeso));
    }

    function mostrarMensagemMudancaPeso(perfilAntigo, pesoNovo) {
      const caixa = document.getElementById("mensagemPeso");
      caixa.className = "alerta hidden";
      if (!perfilAntigo || !perfilAntigo.peso) return;
      const pesoAntigo = Number(perfilAntigo.peso);
      const diferenca = pesoNovo - pesoAntigo;
      if (Math.abs(diferenca) < 0.1) return;
      caixa.classList.remove("hidden");
      if (diferenca < 0) {
        caixa.classList.add("alerta-sucesso");
        caixa.innerHTML = "👏 Parabéns! Você reduziu " + Math.abs(diferenca).toFixed(1) + " kg desde o último registro. Continue com foco, constância e paciência. Resultado bom vem de pequenas escolhas repetidas todos os dias.";
      } else {
        caixa.classList.add("alerta-aviso");
        caixa.innerHTML = "⚠️ Seu peso aumentou " + diferenca.toFixed(1) + " kg desde o último registro. Isso pode acontecer por retenção, alimentação, ganho de massa ou falta de rotina. Como foi sua semana? Vale revisar sono, alimentação, frequência nos treinos e manter o foco sem desanimar.";
      }
    }

    function apagarPerfilSalvo() {
      if (!confirm("Tem certeza que deseja apagar o perfil salvo?")) return;
      localStorage.removeItem("perfilUsuario");
      perfilUsuario = null;
      document.getElementById("nome").value = "";
      if (document.getElementById("dataNascimento")) document.getElementById("dataNascimento").value = "";
      document.getElementById("peso").value = "";
      document.getElementById("altura").value = "";
      restaurarEquipamentosCasa([]);
      atualizarFormularioEquipamentos();
      document.getElementById("resultadoPerfil").classList.add("hidden");
      document.getElementById("mensagemPeso").classList.add("hidden");
      document.getElementById("botaoIrTreino").classList.add("hidden");
    }

    function traduzirMeta(valor) {
      const mapa = { massa: "ganhar massa muscular", perder_peso: "perder peso", definicao: "ficar mais magro e definido", forca: "levantar mais peso / ganhar força" };
      return mapa[valor] || valor;
    }
    function traduzirRotina(valor) {
      const mapa = { nunca: "nunca treinou", dificuldade: "já treinou, mas teve dificuldades", voltando: "voltando a treinar", regular: "treina regularmente" };
      return mapa[valor] || valor;
    }
    function traduzirExperiencia(valor) {
      const mapa = { menos_1: "menos de 1 ano", "1_2": "de 1 a 2 anos", "2_4": "de 2 a 4 anos", "4_mais": "4 anos ou mais" };
      return mapa[valor] || valor;
    }
    function traduzirLocal(valor) {
      valor = normalizarLocalTreino(valor);
      const mapa = {
        sem_equipamento: "Sem Equipamento",
        halteres: "Halteres",
        academia_casa: "Academia em Casa",
        academia_completa: "Academia Completa",
        personalizado: "Personalizado"
      };
      return mapa[valor] || valor;
    }

    function irParaTreino() {
      if (!acessoLiberado) {
        bloquearApp("Faça login com um e-mail autorizado para acessar os treinos.");
        return;
      }

      if (perfilUsuario === null) calcularPerfil();
      if (perfilUsuario === null) return;
      ocultarPaginasDoApp();
      document.getElementById("paginaTreino").classList.remove("hidden");
      document.getElementById("tituloTreino").innerText = "💪 Treino de " + perfilUsuario.nome;
      document.getElementById("resumoPerfilTreino").innerText = "Meta: " + traduzirMeta(perfilUsuario.metaPrincipal) + " | Experiência: " + traduzirExperiencia(perfilUsuario.tempoExperiencia) + " | Local: " + traduzirLocal(perfilUsuario.localTreino) + " | IMC: " + perfilUsuario.imc;
      mostrarHistorico();
      carregarUltimaCardio();
      carregarTreinoAtualLocal();
    }

    function voltarParaPerfil() {
      ocultarPaginasDoApp();
      document.getElementById("paginaPerfil").classList.remove("hidden");
    }

    function irParaCheckin() {
      if (!acessoLiberado) {
        bloquearApp("Faça login com um e-mail autorizado para responder o check-in.");
        return;
      }

      ocultarPaginasDoApp();
      document.getElementById("paginaCheckin").classList.remove("hidden");
      carregarUltimaCardio();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function irParaCardio() {
      if (!acessoLiberado) {
        bloquearApp("Faça login com um e-mail autorizado para registrar atividades de cardio.");
        return;
      }

      ocultarPaginasDoApp();
      document.getElementById("paginaCardio").classList.remove("hidden");
      atualizarAvisoCardioSemCheckin();
      carregarCardios();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function irParaNovidades() {
      if (!acessoLiberado) {
        bloquearApp("Faça login com um e-mail autorizado para ver as novidades do app.");
        return;
      }

      ocultarPaginasDoApp();
      document.getElementById("paginaNovidades").classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function irParaHistorico() {
      irParaHistoricoCompleto();
    }

    function irParaHistoricoCompleto() {
      if (!acessoLiberado) {
        bloquearApp("Faça login com um e-mail autorizado para ver o histórico.");
        return;
      }

      ocultarPaginasDoApp();
      document.getElementById("paginaHistoricoCompleto").classList.remove("hidden");
      mostrarHistoricoCompleto();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }


    function nomeAmigavelTreino(letra) {
      const mapa = {
        A: "Treino de membros superiores — empurrar",
        B: "Treino de membros superiores — puxar",
        C: "Treino de membros inferiores e abdômen",
        descanso: "Treino leve / recuperação",
        Descanso: "Treino leve / recuperação"
      };
      return mapa[letra] || (letra ? "Treino " + letra : "Treino do dia");
    }

    function estimarDuracaoTreino(tempo, cardioNoTreino) {
      let base = tempo === "rapido" ? 30 : (tempo === "normal" ? 55 : 75);
      if (cardioNoTreino && cardioNoTreino !== "nao") base += tempo === "rapido" ? 10 : 15;
      return base;
    }

    function intensidadeTreinoTexto(energia, progressaoSemanal, letraTreino) {
      if (letraTreino === "descanso") return "leve / recuperação";
      if (energia === "mal") return "leve";
      if (energia === "cansado" || (progressaoSemanal && progressaoSemanal.reduzirVolume)) return "moderada reduzida";
      return "moderada";
    }

    function montarResumoDoDia(letraTreino, tempo, cardioNoTreino, energia, progressaoSemanal) {
      const cardioTexto = cardioNoTreino && cardioNoTreino !== "nao" ? (cardioNoTreino === "esteira" ? "Esteira" : "Bicicleta") : "opcional / não incluído";
      const duracao = estimarDuracaoTreino(tempo, cardioNoTreino);
      const intensidade = intensidadeTreinoTexto(energia, progressaoSemanal, letraTreino);
      return "<strong>Hoje você vai fazer:</strong><br>" +
        "✔ " + limparTextoSeguro(nomeAmigavelTreino(letraTreino)) + " (" + intensidade + ")<br>" +
        "✔ Cardio: " + limparTextoSeguro(cardioTexto) + "<br>" +
        "✔ Duração estimada: aproximadamente " + duracao + " min";
    }

    function obterMensagemInteligente(energia, letraTreino, progressaoSemanal) {
      if (letraTreino === "descanso") return "Hoje é um ótimo dia para recuperar. Recuperação também faz parte da evolução.";
      if (energia === "bem" && progressaoSemanal && progressaoSemanal.fase === "evolucao") return "Boa fase para evoluir com controle. Consistência é o que traz resultado.";
      if (energia === "cansado") return "Hoje o foco é fazer bem feito, sem exagerar. Um treino ajustado ainda conta muito.";
      if (energia === "mal") return "Respeite seu corpo hoje. Técnica, leveza e segurança vêm em primeiro lugar.";
      return "Boa escolha! Consistência é o que traz resultado.";
    }

    function salvarFeedbackTreinoFinal(nivel) {
      feedbackTreinoFinalAtual = nivel;
      const caixa = document.getElementById("mensagemFeedbackTreino");
      if (caixa) {
        caixa.className = "alerta alerta-sucesso";
        caixa.innerHTML = "Feedback salvo: " + limparTextoSeguro(nivel) + ". Quando salvar o treino, esse dado será registrado junto ao histórico.";
      }
    }

    function nomeDoDiaDaSemana() {
      const dias = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
      return dias[new Date().getDay()];
    }

    function escolherTreinoPorDiaDaSemana() {
      const hoje = new Date().getDay();
      if (hoje === 0) return "descanso";
      if (hoje === 1 || hoje === 4) return "A";
      if (hoje === 2 || hoje === 5) return "B";
      if (hoje === 3 || hoje === 6) return "C";
      return "A";
    }

    function escolherTreinoABC(divisaoSelecionada) {
      if (divisaoSelecionada === "semana") return escolherTreinoPorDiaDaSemana();
      if (divisaoSelecionada === "descanso") return "descanso";
      if (divisaoSelecionada !== "automatico") return divisaoSelecionada;
      const historico = JSON.parse(localStorage.getItem("historicoTreinos") || "[]");
      if (historico.length === 0 || !historico[0].letraTreino) return "A";
      const ultimoTreino = historico[0].letraTreino;
      if (ultimoTreino === "A") return "B";
      if (ultimoTreino === "B") return "C";
      return "A";
    }

    function nivelPermitido(exercicio) {
      if (!perfilUsuario) return true;
      const iniciante = perfilUsuario.rotinaAtual === "nunca" || perfilUsuario.rotinaAtual === "dificuldade" || perfilUsuario.tempoExperiencia === "menos_1";
      if (iniciante && exercicio.nivel === "avancado") return false;
      return true;
    }

    function ajustarExercicioPorMeta(exercicio) {
      const copia = Object.assign({}, exercicio);
      if (!perfilUsuario) return copia;
      if (perfilUsuario.metaPrincipal === "forca") { copia.series = "4 a 5 séries"; copia.reps = "4 a 8 reps"; }
      if (perfilUsuario.metaPrincipal === "massa") { copia.series = "3 a 4 séries"; copia.reps = "8 a 12 reps"; }
      if (perfilUsuario.metaPrincipal === "definicao") { copia.series = "3 séries"; copia.reps = "10 a 15 reps"; }
      if (perfilUsuario.metaPrincipal === "perder_peso") { copia.series = "3 séries"; copia.reps = "12 a 15 reps"; }
      return copia;
    }

    function diasDesdeTimestamp(timestamp) {
      if (!timestamp) return 999;
      const agora = new Date().getTime();
      return (agora - Number(timestamp)) / (1000 * 60 * 60 * 24);
    }

    function traduzirIntensidadeCardio(valor) {
      const mapa = { leve: "leve", moderada: "moderada", forte: "forte" };
      return mapa[valor] || valor || "não informada";
    }

    function analisarImpactoUltimaCardio(letraTreino) {
      const resposta = { mensagem: "", reduzirVolume: false, sugerirDescanso: false };

      if (!ultimaCardioCache || !ultimaCardioCache.criadoEm || (ultimaCardioCache.tipo === "sem_cardio" || ultimaCardioCache.tipo === "sem_corrida")) {
        return resposta;
      }

      const dias = diasDesdeTimestamp(ultimaCardioCache.criadoEm);
      if (dias > 1.5) {
        return resposta;
      }

      const intensidade = ultimaCardioCache.intensidade || "leve";
      const sensacao = ultimaCardioCache.sensacao || "bem";
      const foiForte = intensidade === "forte" || sensacao === "pesado";
      const foiModerada = intensidade === "moderada" || sensacao === "cansado";

      if (foiForte) {
        resposta.reduzirVolume = true;
        resposta.mensagem = "Como seu último cardio foi forte ou muito pesado, o app reduziu um pouco o volume do treino de hoje.";
        if (letraTreino === "C") {
          resposta.sugerirDescanso = true;
          resposta.mensagem = "Como seu último cardio foi forte ou muito pesado e hoje seria treino de pernas, o app sugeriu recuperação/mobilidade para proteger sua recuperação.";
        }
      } else if (foiModerada && letraTreino === "C") {
        resposta.reduzirVolume = true;
        resposta.mensagem = "Como você correu recentemente em intensidade moderada, o treino de pernas foi ajustado com menos volume.";
      } else {
        resposta.mensagem = "Último cardio registrado considerado leve; treino mantido normalmente.";
      }

      return resposta;
    }

    function alternarDesafioCardio() {
      const temDesafio = document.getElementById("temDesafioCardio");
      const ativo = temDesafio && temDesafio.checked;
      ["distanciaDesafioCardio", "dataDesafioCardio"].forEach(function(id) {
        const campo = document.getElementById(id);
        if (campo) campo.disabled = !ativo;
      });
    }

    function traduzirNivelCardio(valor) {
      const mapa = { iniciante: "começando agora", voltando: "voltando a correr", regular: "corre regularmente", avancado: "experiente" };
      return mapa[valor] || valor;
    }

    function traduzirObjetivoCardio(valor) {
      const mapa = { comecar: "começar com segurança", "3k": "3 km", "5k": "correr 5 km", "10k": "correr 10 km", meia: "evoluir para meia maratona", pace: "melhorar ritmo / pace", outro: "outro objetivo" };
      return mapa[valor] || valor;
    }

    function traduzirTipoAtividadeCardio(valor) {
      const mapa = { corrida: "Corrida", caminhada: "Caminhada", bicicleta: "Bicicleta" };
      return mapa[valor] || valor || "Cardio";
    }


    function calcularDiasAte(dataISO) {
      if (!dataISO) return null;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const alvo = new Date(dataISO + "T00:00:00");
      return Math.ceil((alvo.getTime() - hoje.getTime()) / 86400000);
    }

    function formatarDataBrasileira(dataISO) {
      if (!dataISO) return "não informada";
      const partes = dataISO.split("-");
      if (partes.length !== 3) return dataISO;
      return partes[2] + "/" + partes[1] + "/" + partes[0];
    }

    function gerarPlanoCardioAteDesafio(tipoAtividade, nivel, objetivo, distanciaDesafio, dataDesafio, diasAte) {
      if (!dataDesafio || diasAte === null || diasAte < 0) return "";

      const semanas = Math.max(1, Math.ceil(diasAte / 7));
      let distanciaTexto = traduzirObjetivoCardio(distanciaDesafio || objetivo);
      let base = "";

      if (tipoAtividade === "bicicleta") {
        base = "Plano progressivo: faça 2 a 3 pedais por semana, alternando um dia leve, um dia moderado e um dia mais longo. Aumente o tempo aos poucos, sem subir carga de forma agressiva.";
      } else if (tipoAtividade === "caminhada") {
        base = "Plano progressivo: faça 3 caminhadas por semana. Mantenha uma caminhada leve, uma caminhada firme e uma caminhada um pouco mais longa, aumentando o tempo aos poucos.";
      } else if (nivel === "iniciante" || objetivo === "comecar") {
        base = "Plano progressivo: faça 3 sessões por semana alternando caminhada e trote leve. A cada 1 ou 2 semanas, aumente um pouco o tempo correndo e reduza a caminhada, sempre sem dor.";
      } else if (objetivo === "pace") {
        base = "Plano progressivo: mantenha 1 treino leve, 1 treino de ritmo/intervalado controlado e 1 treino confortável mais longo por semana.";
      } else {
        base = "Plano progressivo: faça 3 treinos por semana, com um treino leve, um treino de ritmo controlado e um treino mais longo. Aumente volume aos poucos e preserve recuperação.";
      }

      let alertaPrazo = "";
      if (semanas <= 2) {
        alertaPrazo = " Como faltam menos de 2 semanas, evite tentar ganhar condicionamento rápido demais. Foque em chegar bem, descansado e sem dor.";
      } else if (semanas <= 6) {
        alertaPrazo = " Como o prazo é curto, evolua com cuidado e evite aumentar distância e intensidade na mesma semana.";
      } else {
        alertaPrazo = " Como há mais tempo, a evolução pode ser gradual, aumentando cerca de 5% a 10% do volume quando a sensação estiver boa.";
      }

      return "<br><br><strong>Plano até o desafio:</strong> faltam aproximadamente " + semanas + " semana(s) para " + distanciaTexto + ". " + base + alertaPrazo;
    }

    function atualizarTextoTipoCardio() {
      const tipo = document.getElementById("tipoAtividadeCardio") ? document.getElementById("tipoAtividadeCardio").value : "corrida";
      const objetivo = document.getElementById("objetivoCardio");
      const condicao = document.getElementById("condicaoCardio");
      if (tipo === "caminhada") {
        if (objetivo && objetivo.value === "pace") objetivo.value = "5k";
      }
    }


    function montarPlanoProgressivoCardio(tipoAtividade, nivel, objetivo, diasAte) {
      let plano = "<br><br><strong>Plano progressivo sugerido:</strong><br>";

      if (tipoAtividade === "bicicleta") {
        if (nivel === "iniciante" || nivel === "voltando") {
          return plano + "Semana atual: pedale 20 a 30 minutos em ritmo confortável.<br>Próxima etapa: aumente 5 minutos por semana se terminar bem e sem dor.";
        }
        return plano + "Semana atual: 30 a 45 minutos com ritmo constante.<br>Próxima etapa: inclua blocos de 2 a 3 minutos mais fortes, sempre com recuperação leve.";
      }

      if (tipoAtividade === "caminhada") {
        return plano + "Semana atual: mantenha caminhada firme e confortável.<br>Próxima etapa: aumente 5 a 10 minutos na semana ou inclua pequenos trechos de subida, se estiver bem.";
      }

      if (nivel === "iniciante" || objetivo === "comecar") {
        return plano + "Semana atual: caminhada + trotes curtos.<br>Próxima etapa: reduza aos poucos o tempo caminhando e aumente o tempo trotando, sem forçar.";
      }

      if (objetivo === "10k" || objetivo === "meia") {
        if (diasAte !== null && diasAte <= 21) {
          return plano + "Como o desafio está próximo, evite aumentar muito o volume. Foque em manter constância, sono, hidratação e recuperação.";
        }
        return plano + "Semana atual: rodagem leve + um treino um pouco mais longo.<br>Próxima etapa: aumentar distância gradualmente, sem subir volume de forma agressiva.";
      }

      if (objetivo === "pace") {
        return plano + "Semana atual: tiros curtos controlados.<br>Próxima etapa: melhorar ritmo mantendo boa recuperação entre os estímulos.";
      }

      return plano + "Evolua aos poucos: aumente volume ou intensidade apenas se terminar bem e sem dor.";
    }


    function gerarTextoSugestaoCardio() {
      const tipoAtividade = document.getElementById("tipoAtividadeCardio") ? document.getElementById("tipoAtividadeCardio").value : "corrida";
      const nivel = document.getElementById("nivelCardio").value;
      const objetivo = document.getElementById("objetivoCardio").value;
      const condicao = document.getElementById("condicaoCardio").value;
      const temDesafio = document.getElementById("temDesafioCardio").checked;
      const distanciaDesafio = document.getElementById("distanciaDesafioCardio").value;
      const dataDesafio = document.getElementById("dataDesafioCardio").value;
      const diasAte = calcularDiasAte(dataDesafio);
      const imc = perfilUsuario ? Number(perfilUsuario.imc) : 0;
      let treino = "";
      let cuidado = "";
      let desafio = "";

      if (imc >= 30 && (nivel === "iniciante" || nivel === "voltando")) {
        cuidado = "<br><br><strong>Atenção:</strong> pelo seu perfil atual, comece com calma. Priorize ritmo confortável, respiração controlada e ausência de dor. Se sentir dor no peito, tontura, falta de ar fora do normal ou dor articular forte, pare e procure orientação profissional.";
      } else if (nivel === "iniciante") {
        cuidado = "<br><br><strong>Dica:</strong> não tente evoluir tudo de uma vez. O início ideal é alternar esforço leve e recuperação para criar base sem sobrecarregar.";
      }

      if (tipoAtividade === "bicicleta") {
        if (nivel === "iniciante" || condicao === "caminho") {
          treino = "Faça 20 a 30 minutos de bicicleta em ritmo confortável. Mantenha cadência leve/moderada e evite carga pesada nos primeiros treinos.";
        } else if (objetivo === "pace" || objetivo === "10k" || objetivo === "meia") {
          treino = "Faça 10 minutos leves. Depois faça 6 blocos de 2 minutos em ritmo moderado/forte controlado + 2 minutos leves. Finalize com 5 minutos bem leves.";
        } else {
          treino = "Faça 30 a 45 minutos de bicicleta em ritmo constante, confortável e sustentável. Se estiver cansado, reduza a carga e mantenha o movimento.";
        }
      } else if (tipoAtividade === "caminhada") {
        if (nivel === "iniciante" || condicao === "caminho") {
          treino = "Faça 20 a 35 minutos de caminhada confortável. Mantenha respiração controlada e aumente o ritmo apenas se estiver sem dor e sem falta de ar exagerada.";
        } else if (objetivo === "5k" || objetivo === "3k") {
          treino = "Faça 35 a 45 minutos de caminhada firme, tentando manter ritmo constante. Finalize com 5 minutos bem leves.";
        } else if (objetivo === "10k" || objetivo === "meia") {
          treino = "Faça 45 a 60 minutos de caminhada firme, com postura boa e ritmo sustentável. Se ficar muito pesado, reduza o ritmo e preserve a constância.";
        } else {
          treino = "Faça 30 a 45 minutos de caminhada firme, mantendo ritmo confortável e seguro.";
        }
      } else if (nivel === "iniciante" || objetivo === "comecar") {
        treino = "Faça 5 minutos de caminhada leve para aquecer. Depois repita 8 vezes: 1 minuto de trote leve + 2 minutos de caminhada. Finalize com 5 minutos caminhando devagar.";
      } else if (nivel === "voltando") {
        treino = "Faça 8 minutos de caminhada/trote leve. Depois repita 6 vezes: 2 minutos correndo leve + 2 minutos caminhando. Termine com 5 minutos leves.";
      } else if (objetivo === "5k") {
        treino = "Faça 10 minutos leves. Depois corra de 20 a 30 minutos em ritmo confortável, sem forçar pace. Finalize caminhando 5 minutos.";
      } else if (objetivo === "10k") {
        treino = "Faça 10 minutos leves. Depois faça 3 blocos de 8 minutos em ritmo confortável com 2 minutos de caminhada/trote leve entre eles. Finalize leve.";
      } else if (objetivo === "meia") {
        treino = "Faça uma rodagem leve de 35 a 50 minutos, mantendo ritmo confortável. Se estiver cansado, reduza o volume e preserve a constância.";
      } else if (objetivo === "pace") {
        treino = "Aqueça 10 minutos. Depois faça 6 repetições de 1 minuto em ritmo mais forte controlado + 2 minutos leves. Termine com 5 a 10 minutos leves.";
      } else {
        treino = "Faça uma corrida leve e confortável, priorizando constância e boa sensação no final.";
      }

      if (tipoAtividade === "corrida" && condicao === "caminho") {
        treino = "Faça 20 a 30 minutos de caminhada firme. Se estiver bem, inclua 4 a 6 trotes leves de 30 segundos, sempre sem dor e sem falta de ar exagerada.";
      }

      if (temDesafio) {
        if (diasAte !== null && diasAte >= 0) {
          desafio = "<br><br><strong>Desafio:</strong> objetivo de " + traduzirObjetivoCardio(distanciaDesafio) + " em " + formatarDataBrasileira(dataDesafio) + " (faltam aproximadamente " + diasAte + " dia(s)).";
          if (diasAte <= 14) desafio += " Como está próximo, evite aumentar volume de forma agressiva. Priorize regularidade e recuperação.";
          else desafio += " Como ainda há tempo, o ideal é evoluir aos poucos, aumentando volume de forma progressiva.";
          desafio += gerarPlanoCardioAteDesafio(tipoAtividade, nivel, objetivo, distanciaDesafio, dataDesafio, diasAte);
        } else {
          desafio = "<br><br><strong>Desafio:</strong> informe uma data futura para o app considerar melhor o prazo.";
        }
      }

      const planoProgressivo = montarPlanoProgressivoCardio(tipoAtividade, nivel, objetivo, diasAte);
      return "<strong>Sugestão de cardio do dia</strong><br>Atividade: " + traduzirTipoAtividadeCardio(tipoAtividade) + " | Perfil: " + traduzirNivelCardio(nivel) + " | Objetivo: " + traduzirObjetivoCardio(objetivo) + ".<br><br>" + treino + cuidado + desafio + planoProgressivo;
    }

    function gerarTreinoCardio() {
      const caixa = document.getElementById("sugestaoCardio");
      if (!caixa) return;
      caixa.className = "alerta alerta-sucesso";
      caixa.innerHTML = gerarTextoSugestaoCardio();
    }

    function alternarCamposCardio() {
      alternarDesafioCardio();
    }

    function salvarCardio() {
      if (!acessoLiberado || !usuarioAtual) {
        alert("Faça login com um e-mail autorizado para salvar atividades de cardio.");
        return;
      }

      const naoCorreu = false;
      const tipoAtividadeCardio = document.getElementById("tipoAtividadeCardio") ? document.getElementById("tipoAtividadeCardio").value : "corrida";
      const distancia = Number(document.getElementById("distanciaCardio").value);
      const tempo = Number(document.getElementById("tempoCardio").value);
      const intensidade = document.getElementById("intensidadeCardio").value;
      const sensacao = document.getElementById("sensacaoCardio").value;
      const observacao = document.getElementById("observacaoCardio").value.trim();
      const nivelCardio = document.getElementById("nivelCardio") ? document.getElementById("nivelCardio").value : "iniciante";
      const objetivoCardio = document.getElementById("objetivoCardio") ? document.getElementById("objetivoCardio").value : "comecar";
      const condicaoCardio = document.getElementById("condicaoCardio") ? document.getElementById("condicaoCardio").value : "caminho";
      const temDesafioCardio = document.getElementById("temDesafioCardio") ? document.getElementById("temDesafioCardio").checked : false;
      const distanciaDesafioCardio = document.getElementById("distanciaDesafioCardio") ? document.getElementById("distanciaDesafioCardio").value : "";
      const dataDesafioCardio = document.getElementById("dataDesafioCardio") ? document.getElementById("dataDesafioCardio").value : "";
      const sugestaoCardioHTML = document.getElementById("sugestaoCardio") && !document.getElementById("sugestaoCardio").classList.contains("hidden") ? document.getElementById("sugestaoCardio").innerText : "";
      const caixa = document.getElementById("mensagemCardio");

      if (naoCorreu) {
        const agora = new Date();
        const registroSemCardio = {
          tipo: "sem_cardio",
          data: agora.toLocaleString("pt-BR"),
          criadoEm: agora.getTime(),
          diaSemana: nomeDoDiaDaSemana(),
          nomeUsuario: perfilUsuario ? perfilUsuario.nome : "Usuário",
          observacao: "Usuário informou que não fez cardio recentemente."
        };

        if (!navigator.onLine || !db || usuarioAtual.offline) {
          ultimaCardioCache = adicionarPendenteOffline("cardios", registroSemCardio);
          if (caixa) {
            caixa.className = "alerta alerta-sucesso";
            caixa.innerHTML = "✅ Registro salvo offline. Ele será enviado para a nuvem quando a internet voltar.";
          }
          carregarCardios();
          return;
        }

        db.collection("usuarios").doc(usuarioAtual.uid).collection("corridas").add(registroSemCardio)
          .then(function() {
            ultimaCardioCache = registroSemCardio;
            if (caixa) {
              caixa.className = "alerta alerta-sucesso";
              caixa.innerHTML = "✅ Registro salvo: nenhum cardio recente será considerado no próximo treino.";
            }
            carregarCardios();
          })
          .catch(function(erro) {
            console.log("Erro ao salvar registro sem cardio:", erro);
            ultimaCardioCache = adicionarPendenteOffline("cardios", registroSemCardio);
            if (caixa) {
              caixa.className = "alerta alerta-aviso";
              caixa.innerHTML = "Sem conexão: registro salvo offline e pendente de sincronização.";
            }
            carregarCardios();
          });
        return;
      }

      if (distancia < 0 || tempo <= 0) {
        if (caixa) {
          caixa.className = "alerta alerta-aviso";
          caixa.innerHTML = "Informe distância com 0 km ou mais e tempo maior que zero.";
        }
        return;
      }

      const agora = new Date();
      const corrida = {
        data: agora.toLocaleString("pt-BR"),
        criadoEm: agora.getTime(),
        diaSemana: nomeDoDiaDaSemana(),
        tipoAtividade: tipoAtividadeCardio,
        distancia: distancia,
        tempo: tempo,
        intensidade: intensidade,
        sensacao: sensacao,
        observacao: observacao,
        nivelCardio: nivelCardio,
        objetivoCardio: objetivoCardio,
        condicaoCardio: condicaoCardio,
        temDesafio: temDesafioCardio,
        distanciaDesafio: temDesafioCardio ? distanciaDesafioCardio : "",
        dataDesafio: temDesafioCardio ? dataDesafioCardio : "",
        planoProgressivo: temDesafioCardio ? "Plano progressivo gerado conforme prazo, objetivo e nível do usuário." : "",
        treinoSugerido: sugestaoCardioHTML,
        nomeUsuario: perfilUsuario ? perfilUsuario.nome : "Usuário"
      };

      if (!navigator.onLine || !db || usuarioAtual.offline) {
        ultimaCardioCache = adicionarPendenteOffline("cardios", corrida);
        if (caixa) {
          caixa.className = "alerta alerta-sucesso";
          caixa.innerHTML = "✅ Cardio salvo offline. Ele será enviado para a nuvem quando a internet voltar.";
        }
        document.getElementById("observacaoCardio").value = "";
        carregarCardios();
        return;
      }

      db.collection("usuarios").doc(usuarioAtual.uid).collection("corridas").add(corrida)
        .then(function() {
          ultimaCardioCache = corrida;
          if (caixa) {
            caixa.className = "alerta alerta-sucesso";
            caixa.innerHTML = "✅ Cardio salvo. O próximo treino poderá ser adaptado com base nesse registro.";
          }
          document.getElementById("observacaoCardio").value = "";
          carregarCardios();
        })
        .catch(function(erro) {
          console.log("Erro ao salvar cardio:", erro);
          ultimaCardioCache = adicionarPendenteOffline("cardios", corrida);
          if (caixa) {
            caixa.className = "alerta alerta-aviso";
            caixa.innerHTML = "Sem conexão: cardio salvo offline e pendente de sincronização.";
          }
          carregarCardios();
        });
    }

    function obterCardiosDaNuvem(callback) {
      if (!acessoLiberado || !usuarioAtual) { callback([]); return; }
      if (!navigator.onLine || !db || usuarioAtual.offline) { callback(mesclarPendentesOffline("cardios", [])); return; }

      const limite90Dias = new Date().getTime() - (90 * 24 * 60 * 60 * 1000);

      db.collection("usuarios").doc(usuarioAtual.uid).collection("corridas").get()
        .then(function(snapshot) {
          const lista = [];
          snapshot.forEach(function(doc) {
            const item = doc.data();
            item.__id = doc.id;
            if (!item.criadoEm || Number(item.criadoEm) >= limite90Dias) lista.push(item);
          });
          lista.sort(function(a, b) { return Number(b.criadoEm || 0) - Number(a.criadoEm || 0); });
          callback(mesclarPendentesOffline("cardios", lista));
        })
        .catch(function(erro) { console.log("Erro ao carregar cardios:", erro); callback(mesclarPendentesOffline("cardios", [])); });
    }

    function carregarUltimaCardio() {
      obterCardiosDaNuvem(function(lista) {
        ultimaCardioCache = lista && lista.length ? lista[0] : null;
      });
    }

    function carregarCardios() {
      obterCardiosDaNuvem(function(lista) {
        const caixa = document.getElementById("listaCardios");
        if (!caixa) return;

        caixa.innerHTML = "";
        if (!lista || lista.length === 0) {
          caixa.innerHTML = "<p class='small'>Nenhuma cardio salvo ainda.</p>";
          ultimaCardioCache = null;
          return;
        }

        ultimaCardioCache = lista[0];

        lista.slice(0, 3).forEach(function(item) {
          const div = document.createElement("div");
          div.className = "historico-item";
          if ((item.tipo === "sem_cardio" || item.tipo === "sem_corrida")) {
            div.innerHTML =
              "<strong>" + limparTextoSeguro(item.data || "Sem data") + "</strong><br>" +
              "Status: não fez cardio recentemente<br>" +
              "Observação: " + limparTextoSeguro(item.observacao || "Nenhuma") +
              (item.__id ? "<br><button type='button' class='botao-secundario' onclick='editarCardioHistorico(" + JSON.stringify(item.__id) + ")'>Editar cardio</button>" : "") +
              (item.__id ? "<button type='button' class='botao-perigo' onclick='excluirCardioHistorico(" + JSON.stringify(item.__id) + ")'>Deletar cardio</button>" : "");
          } else {
            div.innerHTML =
              "<strong>" + limparTextoSeguro(item.data || "Sem data") + "</strong><br>" +
              "Atividade: " + limparTextoSeguro(traduzirTipoAtividadeCardio(item.tipoAtividade)) + "<br>" +
              "Distância: " + limparTextoSeguro(item.distancia || 0) + " km<br>" +
              "Tempo: " + limparTextoSeguro(item.tempo || 0) + " min<br>" +
              "Ritmo médio: " + limparTextoSeguro(calcularPaceMedio(item) || "Não calculado") + "<br>" +
              "Intensidade: " + limparTextoSeguro(traduzirIntensidadeCardio(item.intensidade)) + "<br>" +
              "Sensação: " + limparTextoSeguro(item.sensacao || "-") + "<br>" +
              "Nível: " + limparTextoSeguro(traduzirNivelCardio(item.nivelCardio || "")) + "<br>" +
              "Objetivo: " + limparTextoSeguro(traduzirObjetivoCardio(item.objetivoCardio || "")) + "<br>" +
              (item.temDesafio ? "Desafio: " + limparTextoSeguro(traduzirObjetivoCardio(item.distanciaDesafio || "")) + " em " + limparTextoSeguro(formatarDataBrasileira(item.dataDesafio || "")) + "<br>" : "") +
              "Observação: " + limparTextoSeguro(item.observacao || "Nenhuma") +
              (item.__id ? "<br><button type='button' class='botao-secundario' onclick='editarCardioHistorico(" + JSON.stringify(item.__id) + ")'>Editar cardio</button>" : "") +
              (item.__id ? "<button type='button' class='botao-perigo' onclick='excluirCardioHistorico(" + JSON.stringify(item.__id) + ")'>Deletar cardio</button>" : "");
          }
          caixa.appendChild(div);
        });
      });
    }

    function limparHistoricoCardios() {
      if (!acessoLiberado || !usuarioAtual || !db) {
        alert("Faça login com um e-mail autorizado para limpar o histórico de cardio.");
        return;
      }

      if (!confirm("Tem certeza que deseja apagar todo o histórico de cardio?")) return;

      db.collection("usuarios")
        .doc(usuarioAtual.uid)
        .collection("corridas")
        .get()
        .then(function(snapshot) {
          const batch = db.batch();
          snapshot.forEach(function(doc) {
            batch.delete(doc.ref);
          });
          return batch.commit();
        })
        .then(function() {
          ultimaCardioCache = null;
          carregarCardios();
          const caixa = document.getElementById("mensagemCardio");
          if (caixa) {
            caixa.className = "alerta alerta-sucesso";
            caixa.innerHTML = "Histórico de cardios apagado com sucesso.";
          }
        })
        .catch(function(erro) {
          console.log("Erro ao limpar histórico de cardio:", erro);
          alert("Não foi possível limpar o histórico de cardio agora.");
        });
    }

    function analisarEsforcoRecente(callback) {
      if (!usuarioAtual || !db) {
        callback({ sugerirDescanso: false, mensagem: "" });
        return;
      }

      const agora = new Date().getTime();
      const limite3Dias = agora - (3 * 24 * 60 * 60 * 1000);
      let treinosRecentes = [];
      let cardiosRecentes = [];

      db.collection("usuarios").doc(usuarioAtual.uid).collection("treinos").get()
        .then(function(snapshot) {
          snapshot.forEach(function(doc) {
            const item = doc.data() || {};
            if (Number(item.criadoEm || 0) >= limite3Dias) treinosRecentes.push(item);
          });
          return db.collection("usuarios").doc(usuarioAtual.uid).collection("corridas").get();
        })
        .then(function(snapshot) {
          snapshot.forEach(function(doc) {
            const item = doc.data() || {};
            if (Number(item.criadoEm || 0) >= limite3Dias && item.tipo !== "sem_cardio" && item.tipo !== "sem_corrida") cardiosRecentes.push(item);
          });

          const totalEsforcos = treinosRecentes.length + cardiosRecentes.length;
          const cardioForte = cardiosRecentes.some(function(item) {
            return item.intensidade === "forte" || item.sensacao === "pesado";
          });
          const treinoPesado = treinosRecentes.some(function(item) {
            return item.sensacao === "dificil" || Number(item.totalConcluidos || 0) >= 6;
          });

          if (totalEsforcos >= 3 || (cardioForte && treinoPesado)) {
            callback({
              sugerirDescanso: true,
              mensagem: "Descanso inteligente: o app identificou esforço recente acumulado em treinos/cardio e sugeriu recuperação ativa para reduzir risco de excesso."
            });
          } else {
            callback({ sugerirDescanso: false, mensagem: "" });
          }
        })
        .catch(function(erro) {
          console.log("Erro ao analisar esforço recente:", erro);
          callback({ sugerirDescanso: false, mensagem: "" });
        });
    }

    function criarExercicioPesoCorporal(nome, grupo, evitar, passos) {
      return ajustarExercicioPorMeta({
        nome: nome,
        grupo: grupo,
        equipamento: "Peso corporal",
        nivel: "iniciante",
        local: ["sem_equipamento", "halteres", "academia_casa", "academia_completa", "personalizado"],
        evitar: evitar || "nenhuma",
        passos: passos || [
          "Execute com controle e sem pressa.",
          "Mantenha respiração constante.",
          "Respeite seus limites e evite dor articular.",
          "Se ficar muito difícil, reduza o ritmo ou faça menos repetições."
        ]
      });
    }

    function completarTreinoSemEquipamento(treino, letraTreino, dor, tempo) {
      if (!perfilUsuario) return treino;
      const localPerfil = perfilUsuario.localTreino || "";
      const semEquipamentosMarcados = !perfilUsuario.equipamentosCasa || perfilUsuario.equipamentosCasa.length === 0;
      if (!(normalizarLocalTreino(localPerfil) === "sem_equipamento" || (normalizarLocalTreino(localPerfil) === "personalizado" && semEquipamentosMarcados))) return treino;

      const alvo = alvoQuantidadeExercicios(tempo, determinarPerfilTreino());
      const extras = [
        criarExercicioPesoCorporal("Agachamento livre", "Pernas", "joelho", ["Pés na largura dos ombros.", "Desça com controle.", "Mantenha coluna firme.", "Suba empurrando o chão."]),
        criarExercicioPesoCorporal("Flexão de braço", "Peito", "ombro", ["Apoie as mãos no chão.", "Mantenha corpo alinhado.", "Desça com controle.", "Suba empurrando o chão."]),
        criarExercicioPesoCorporal("Prancha", "Abdômen", "lombar", ["Apoie cotovelos e pés.", "Contraia o abdômen.", "Mantenha o corpo alinhado.", "Pare se sentir dor lombar."]),
        criarExercicioPesoCorporal("Ponte de glúteo", "Glúteos", "lombar", ["Deite de barriga para cima.", "Pés firmes no chão.", "Suba o quadril contraindo glúteos.", "Desça com controle."]),
        criarExercicioPesoCorporal("Afundo alternado", "Pernas", "joelho", ["Dê um passo à frente.", "Desça com controle.", "Mantenha tronco firme.", "Alterne as pernas."]),
        criarExercicioPesoCorporal("Abdominal curto", "Abdômen", "lombar", ["Deite com joelhos flexionados.", "Suba o tronco parcialmente.", "Contraia abdômen.", "Volte devagar."]),
        criarExercicioPesoCorporal("Polichinelo", "Cardio", "joelho", ["Abra e feche pernas e braços.", "Mantenha ritmo confortável.", "Faça sem impacto se necessário.", "Pare se sentir dor."]),
        criarExercicioPesoCorporal("Mountain climber", "Cardio/Abdômen", "lombar", ["Apoie as mãos no chão.", "Traga os joelhos alternadamente.", "Mantenha abdômen firme.", "Faça devagar se precisar."])
      ];

      const nomes = treino.map(function(exercicio) { return normalizarNomeExercicio(exercicio.nome); });
      extras.forEach(function(exercicio) {
        if (treino.length >= alvo) return;
        if (exercicio.evitar === dor) return;
        if (!nomes.includes(normalizarNomeExercicio(exercicio.nome))) {
          treino.push(exercicio);
          nomes.push(normalizarNomeExercicio(exercicio.nome));
        }
      });

      return treino;
    }

    function abrirAulaCardio(tipo) {
      const busca = encodeURIComponent(tipo + " treino em casa para iniciantes queima gordura");
      window.open("https://www.youtube.com/results?search_query=" + busca, "_blank");
    }

    function analisarProgressaoSemanal(callback) {
      if (!usuarioAtual || !db) {
        callback({ fase: "neutra", reduzirVolume: false, mensagem: "" });
        return;
      }

      const agora = new Date().getTime();
      const limite7Dias = agora - (7 * 24 * 60 * 60 * 1000);
      const limite28Dias = agora - (28 * 24 * 60 * 60 * 1000);
      let treinos7 = 0;
      let cardios7 = 0;
      let treinos28 = 0;
      let cardios28 = 0;

      db.collection("usuarios").doc(usuarioAtual.uid).collection("treinos").get()
        .then(function(snapshot) {
          snapshot.forEach(function(doc) {
            const item = doc.data() || {};
            const t = Number(item.criadoEm || 0);
            if (t >= limite28Dias) treinos28++;
            if (t >= limite7Dias) treinos7++;
          });
          return db.collection("usuarios").doc(usuarioAtual.uid).collection("corridas").get();
        })
        .then(function(snapshot) {
          snapshot.forEach(function(doc) {
            const item = doc.data() || {};
            if (item.tipo === "sem_cardio" || item.tipo === "sem_corrida") return;
            const t = Number(item.criadoEm || 0);
            if (t >= limite28Dias) cardios28++;
            if (t >= limite7Dias) cardios7++;
          });

          const sessoes7 = treinos7 + cardios7;
          const sessoes28 = treinos28 + cardios28;

          if (sessoes7 >= 5) {
            callback({
              fase: "recuperacao",
              reduzirVolume: true,
              mensagem: "Progressão semanal: você acumulou bastante treino/cardio nos últimos 7 dias. O app reduziu o volume para favorecer recuperação."
            });
          } else if (sessoes28 <= 2) {
            callback({
              fase: "retomada",
              reduzirVolume: false,
              mensagem: "Progressão semanal: fase de retomada/adaptação. O app prioriza constância, técnica e segurança antes de aumentar intensidade."
            });
          } else if (sessoes28 >= 10 && sessoes7 <= 4) {
            callback({
              fase: "evolucao",
              reduzirVolume: false,
              mensagem: "Progressão semanal: sua frequência recente permite manter uma fase de evolução controlada, sem aumentar tudo de uma vez."
            });
          } else {
            callback({
              fase: "construcao",
              reduzirVolume: false,
              mensagem: "Progressão semanal: fase de construção. Mantenha regularidade e aumente dificuldade apenas se a execução estiver boa."
            });
          }
        })
        .catch(function(erro) {
          console.log("Erro ao analisar progressão semanal:", erro);
          callback({ fase: "neutra", reduzirVolume: false, mensagem: "" });
        });
    }

    function aplicarProgressaoSemanalAoTreino(treino, progressaoSemanal, tempo, letraTreino) {
      if (!progressaoSemanal || !treino || treino.length === 0) return treino;
      if (letraTreino === "descanso") return treino;

      if (progressaoSemanal.reduzirVolume && treino.length > 4) {
        return treino.slice(0, Math.max(4, treino.length - 1));
      }

      return treino;
    }

    function gerarTreino() {
      
      marcarCheckinRespondido();
analisarEsforcoRecente(function(esforcoRecente) {
        analisarProgressaoSemanal(function(progressaoSemanal) {
          gerarTreinoComEsforco(
            esforcoRecente || { sugerirDescanso: false, mensagem: "" },
            progressaoSemanal || { fase: "neutra", reduzirVolume: false, mensagem: "" }
          );
        });
      });
    }

    function gerarTreinoComEsforco(esforcoRecente, progressaoSemanal) {
      const energia = document.getElementById("energia").value;
      const dor = document.getElementById("dor").value;
      const tempo = document.getElementById("tempo").value;
      const divisaoSelecionada = document.getElementById("divisaoTreino").value;
      const cardioNoTreino = document.getElementById("cardioNoTreino") ? document.getElementById("cardioNoTreino").value : "nao";
      let letraTreino = escolherTreinoABC(divisaoSelecionada);
      const local = perfilUsuario ? normalizarLocalTreino(perfilUsuario.localTreino) : "academia_completa";

      const hojeSemana = new Date().getDay();
      if (divisaoSelecionada === "semana" && hojeSemana === 0) {
        letraTreino = "descanso";
      }

      const dorBloqueiaGrupo = function(exercicio) {
        if (dor === "pernas" && ["Pernas", "Glúteos", "Panturrilha", "Posterior de coxa"].includes(exercicio.grupo)) return true;
        if (dor === "bracos" && ["Bíceps", "Tríceps", "Peito", "Ombros"].includes(exercicio.grupo)) return true;
        if (dor === "coluna" && (exercicio.evitar === "lombar" || exercicio.grupo === "Costas" || exercicio.grupo === "Abdômen")) return true;
        return exercicio.evitar === dor;
      };

      const treinoOntem = obterUltimoTreinoLocal();
      let avisoRepeticaoTreino = "";
      if (treinoOntem && treinoOntem.letra && treinoOntem.letra !== "Descanso" && treinoOntem.letra === letraTreino) {
        avisoRepeticaoTreino = "Você treinou " + nomeAmigavelTreino(letraTreino) + " recentemente. O ideal hoje é alternar para outra parte do corpo. Se ainda quiser repetir, o app manteve a escolha com variações e menor risco de repetição.";
      }

      let treinoFiltrado = bibliotecaExercicios[letraTreino].filter(function(exercicio) {
        return !dorBloqueiaGrupo(exercicio) && nivelPermitido(exercicio) && equipamentoCompativelComPerfil(exercicio);
      }).map(ajustarExercicioPorMeta);

      if (treinoFiltrado.length === 0) {
        treinoFiltrado = bibliotecaExercicios[letraTreino].filter(function(exercicio) {
          return exercicio.evitar !== dor && equipamentoCompativelComPerfil(exercicio);
        }).map(ajustarExercicioPorMeta);
      }

      if (letraTreino !== "descanso") {
        treinoFiltrado = completarTreinoSemEquipamento(treinoFiltrado, letraTreino, dor, tempo);
      }

      treinoFiltrado = filtrarExerciciosUnicos(treinoFiltrado);
      treinoFiltrado = treinoFiltrado.map(ajustarEquipamentoVisualPorLocal);
      treinoFiltrado = adaptarTreinoPorPerfil(treinoFiltrado, tempo);
      treinoFiltrado = ajustarTreinoPorSexoIdadePesoCheckin(treinoFiltrado, energia, dor, tempo);
      treinoFiltrado = aplicarProgressaoSemanalAoTreino(treinoFiltrado, progressaoSemanal, tempo, letraTreino);

      // Trava final: garante que o treino continue respeitando a categoria escolhida após todos os ajustes inteligentes.
      treinoFiltrado = treinoFiltrado.filter(equipamentoCompativelComPerfil);

      const perfilTreino = determinarPerfilTreino();
      const alvoExercicios = letraTreino === "descanso" ? Math.max(4, alvoQuantidadeExercicios(tempo, perfilTreino)) : alvoQuantidadeExercicios(tempo, perfilTreino);
      if (letraTreino === "descanso" && treinoFiltrado.length < alvoExercicios) {
        const nomesDescanso = treinoFiltrado.map(function(exercicio) { return normalizarNomeExercicio(exercicio.nome || ""); });
        (bibliotecaExercicios.descanso || []).forEach(function(exercicio) {
          if (treinoFiltrado.length >= alvoExercicios) return;
          if (nomesDescanso.includes(normalizarNomeExercicio(exercicio.nome || ""))) return;
          treinoFiltrado.push(ajustarExercicioPorMeta(Object.assign({}, exercicio)));
          nomesDescanso.push(normalizarNomeExercicio(exercicio.nome || ""));
        });
      }
      // Trava final por categoria antes de exibir.
      treinoFiltrado = treinoFiltrado.filter(equipamentoCompativelComPerfil);
      if (normalizarLocalTreino(local) === "sem_equipamento") {
        treinoFiltrado = treinoFiltrado.filter(equipamentoEhPesoCorporal).map(function(exercicio) {
          const copia = Object.assign({}, exercicio);
          copia.equipamento = "Peso corporal";
          return copia;
        });
      } else {
        treinoFiltrado = treinoFiltrado.map(ajustarEquipamentoVisualPorLocal);
      }
      treinoFiltrado = treinoFiltrado.slice(0, alvoExercicios);

      const localComCardio = ["academia_completa", "personalizado"].includes(normalizarLocalTreino(local));
      let mensagemCardioTreino = "";
      if (cardioNoTreino !== "nao" && localComCardio && letraTreino !== "descanso") {
        const reducaoCardio = tempo === "longo" ? 2 : (tempo === "normal" ? 1 : 0);
        if (reducaoCardio > 0 && treinoFiltrado.length > 4) {
          treinoFiltrado = treinoFiltrado.slice(0, Math.max(4, treinoFiltrado.length - reducaoCardio));
        }
        const nomeCardio = cardioNoTreino === "esteira" ? "esteira" : "bicicleta";
        mensagemCardioTreino = " Cardio incluído hoje: " + nomeCardio + ". O app reduziu o volume de exercícios para encaixar o cardio sem deixar o treino pesado.";
      } else if (cardioNoTreino !== "nao" && !localComCardio) {
        mensagemCardioTreino = " Você marcou cardio no treino, mas seu local cadastrado não indica estrutura de academia. Faça apenas se tiver equipamento disponível e com segurança.";
      }

      const ajusteCardio = analisarImpactoUltimaCardio(letraTreino);
      if (letraTreino !== "descanso" && ajusteCardio.reduzirVolume && treinoFiltrado.length > 4) {
        treinoFiltrado = treinoFiltrado.slice(0, Math.max(4, treinoFiltrado.length - 1));
      }
      if (ajusteCardio.sugerirDescanso && letraTreino === "C") {
        treinoFiltrado = bibliotecaExercicios.descanso.map(ajustarExercicioPorMeta);
      }

      treinoAtual = treinoFiltrado;
      treinoAtual.letra = letraTreino === "descanso" ? "Descanso" : letraTreino;
      feedbackTreinoFinalAtual = "";
      exerciciosConcluidos = new Array(treinoAtual.length).fill(false);

      let ajuste = "";
      if (letraTreino === "descanso") {
        ajuste = "Hoje é domingo, dia sugerido para descanso ativo. Se você quiser treinar mesmo assim, mantenha um treino leve, com mobilidade, técnica e baixa intensidade.";
      } else {
        if (energia === "bem") ajuste = "Hoje você pode treinar normalmente e tentar evoluir carga se a execução estiver boa.";
        else if (energia === "cansado") ajuste = "Hoje reduza um pouco o volume. Faça uma série a menos em cada exercício.";
        else ajuste = "Hoje faça um treino leve. Priorize técnica, mobilidade e não force carga.";
        if (divisaoSelecionada === "semana") ajuste = "Hoje é " + nomeDoDiaDaSemana() + ". " + nomeAmigavelTreino(letraTreino) + " selecionado pelo dia da semana com descanso inteligente. " + ajuste;
        else if (divisaoSelecionada === "automatico") ajuste = nomeAmigavelTreino(letraTreino) + " selecionado pelo histórico A/B/C. " + ajuste;
        else ajuste = nomeAmigavelTreino(letraTreino) + " selecionado manualmente. " + ajuste;
      }

      ajuste += " Personalizado para meta: " + traduzirMeta(perfilUsuario.metaPrincipal) + ", local: " + traduzirLocal(perfilUsuario.localTreino) + ".";
      if (tempo === "rapido") ajuste += " Treino rápido: pensado para aproximadamente 30 minutos.";
      else if (tempo === "normal") ajuste += " Treino normal: pensado para aproximadamente 1 hora.";
      else ajuste += " Treino longo: pensado para mais de 1 hora, com maior volume de exercícios.";
      if (dor !== "nenhuma" && letraTreino !== "descanso") ajuste += " Exercícios que podem incomodar sua dor foram removidos.";
      if (ajusteCardio.mensagem) ajuste += " " + ajusteCardio.mensagem;
      if (esforcoRecente.mensagem) ajuste += " " + esforcoRecente.mensagem;
      if (progressaoSemanal && progressaoSemanal.mensagem) ajuste += " " + progressaoSemanal.mensagem;
      if (mensagemCardioTreino) ajuste += mensagemCardioTreino;
      if (avisoRepeticaoTreino) ajuste += " " + avisoRepeticaoTreino;
      ajuste += " Lembrete: hidrate-se, respeite seus limites e evite treinar forte em jejum, com dor ou mal-estar.";

      document.getElementById("resultadoTreino").classList.remove("hidden");
      document.getElementById("registroEvolucao").classList.remove("hidden");
      const resumoDia = document.getElementById("resumoDiaTreino");
      if (resumoDia) {
        resumoDia.classList.remove("hidden");
        resumoDia.innerHTML = montarResumoDoDia(letraTreino, tempo, cardioNoTreino, energia, progressaoSemanal);
      }
      const mensagemInteligente = document.getElementById("mensagemInteligenteTreino");
      if (mensagemInteligente) {
        mensagemInteligente.classList.remove("hidden");
        mensagemInteligente.innerHTML = obterMensagemInteligente(energia, letraTreino, progressaoSemanal);
      }
      document.getElementById("resumoTreino").innerText = ajuste;
      mostrarTreinoNaTela();
    }

    function abrirVideoExercicio(nomeExercicio) {
      const busca = encodeURIComponent("como fazer " + nomeExercicio + " exercício musculação corretamente");
      window.open("https://www.youtube.com/results?search_query=" + busca, "_blank");
    }

    function nomeEquipamentoParaExibir(equipamento) {
      const texto = String(equipamento || "");
      const normalizado = texto.toLowerCase();
      if (normalizado.includes("ms-8000") || normalizado.includes("uplift") || normalizado.includes("estação multifuncional")) {
        return "Estação de musculação";
      }
      return texto;
    }

    function mostrarTreinoNaTela() {
      const lista = document.getElementById("listaExercicios");
      const progresso = document.getElementById("progressoExercicios");
      const feedbackBox = document.getElementById("feedbackTreinoFinal");
      const mensagemFeedback = document.getElementById("mensagemFeedbackTreino");
      if (feedbackBox) feedbackBox.classList.add("hidden");
      if (mensagemFeedback) mensagemFeedback.classList.add("hidden");
      lista.innerHTML = "";
      if (!exerciciosConcluidos || exerciciosConcluidos.length !== treinoAtual.length) {
        exerciciosConcluidos = new Array(treinoAtual.length).fill(false);
      }
      sugestoesCarga = buscarSugestoesDeCarga(treinoAtual);
      const ordemExercicios = treinoAtual
        .map(function(exercicio, index) { return { exercicio: exercicio, index: index, concluido: exerciciosConcluidos[index] === true }; })
        .sort(function(a, b) {
          if (a.concluido === b.concluido) return a.index - b.index;
          return a.concluido ? 1 : -1;
        });

      ordemExercicios.forEach(function(itemOrdem) {
        const exercicio = itemOrdem.exercicio;
        const index = itemOrdem.index;
        const div = document.createElement("div");
        div.className = "exercise";
        div.id = "cardExercicio" + index;
        if (exerciciosConcluidos[index]) div.classList.add("concluido");
        let passosHTML = "";
        exercicio.passos.forEach(function(passo) { passosHTML += "<li>" + passo + "</li>"; });
        const marcado = exerciciosConcluidos[index] ? "checked" : "";
        div.innerHTML = "<strong>" + exercicio.nome + "</strong>" +
          "<span>" + exercicio.series + " | " + exercicio.reps + "</span><br>" +
          "<span class='tag'>Grupo: " + exercicio.grupo + "</span> " +
          "<span class='tag'>Equipamento: " + nomeEquipamentoParaExibir(exercicio.equipamento) + "</span>" +
          (exercicio.observacao ? "<div class='alerta alerta-aviso'>" + limparTextoSeguro(exercicio.observacao) + "</div>" : "") +
          "<div class='alerta'>" + obterTextoSugestaoCarga(exercicio.nome) + "</div>" +
          "<h4>Como fazer:</h4><ol>" + passosHTML + "</ol>" +
          "<div class='aviso-video'>Use o vídeo apenas como apoio. Em caso de dor, pare o exercício.</div>" +
          "<button type='button' class='botao-secundario' onclick='abrirVideoExercicio(" + JSON.stringify(exercicio.nome) + ")'>Ver execução</button>" +
          "<label class='check-exercicio'><input type='checkbox' " + marcado + " onchange='marcarExercicioConcluido(" + index + ", this.checked)'>Exercício concluído</label>" +
          "<div class='acoes-exercicio-grid'>" +
          "<button type='button' class='botao-secundario' onclick='substituirExercicio(" + index + ")'>Não tenho esse equipamento / substituir</button>" +
          "<button type='button' class='botao-pular' onclick='pularExercicio(" + index + ")'>Pular este exercício</button>" +
          "</div>";
        lista.appendChild(div);
      });
      if (perfilUsuario && normalizarLocalTreino(perfilUsuario.localTreino) === "sem_equipamento" && perfilUsuario.metaPrincipal === "perder_peso") {
        const extra = document.createElement("div");
        extra.className = "exercise";
        extra.innerHTML =
          "<strong>Complemento opcional para queima de calorias</strong>" +
          "<p class='small'>Se estiver bem e sem dor, você pode complementar com uma aula curta em casa. Escolha uma opção e respeite seus limites.</p>" +
          "<button type='button' class='botao-secundario' onclick='abrirAulaCardio(" + JSON.stringify("zumba") + ")'>Ver aula de dança / zumba</button>" +
          "<button type='button' class='botao-secundario' onclick='abrirAulaCardio(" + JSON.stringify("hiit baixo impacto") + ")'>Ver cardio HIIT baixo impacto</button>" +
          "<button type='button' class='botao-secundario' onclick='abrirAulaCardio(" + JSON.stringify("aerohit iniciante") + ")'>Ver aula aeróbica em casa</button>";
        lista.appendChild(extra);
      }

      const lembreteSaude = document.createElement("div");
      lembreteSaude.className = "alerta";
      lembreteSaude.innerHTML = "<strong>Lembrete de segurança:</strong> beba água, respeite seus limites e evite treinar forte em jejum, com dor, tontura ou mal-estar.";
      lista.appendChild(lembreteSaude);

      progresso.classList.remove("hidden");
      atualizarProgressoExercicios();
    }

    function marcarExercicioConcluido(index, concluido) {
      exerciciosConcluidos[index] = concluido;

      if (concluido && treinoAtual[index]) {
        preencherRegistroComExercicio(index);
      }

      salvarTreinoAtualLocal();
      mostrarTreinoNaTela();
      atualizarProgressoExercicios();
    }

    function atualizarProgressoExercicios() {
      const progresso = document.getElementById("progressoExercicios");
      const total = exerciciosConcluidos.length;
      const feitos = exerciciosConcluidos.filter(function(item) { return item === true; }).length;

      if (total === 0) {
        progresso.innerText = "Nenhum exercício gerado ainda.";
        return;
      }

      let texto = "Progresso do treino: " + feitos + " de " + total + " exercícios concluídos.";

      const feedbackBox = document.getElementById("feedbackTreinoFinal");
      if (feitos === total) {
        texto += " 🎉 Parabéns! Você concluiu o treino de hoje. Salve seu treino para registrar sua evolução.";
        progresso.classList.add("alerta-sucesso");
        if (feedbackBox) feedbackBox.classList.remove("hidden");
      } else {
        progresso.classList.remove("alerta-sucesso");
        if (feedbackBox) feedbackBox.classList.add("hidden");
      }

      progresso.innerText = texto;
    }

    function substituirExercicio(index) {
      const exercicioAtual = treinoAtual[index];
      const nomesAtuais = treinoAtual.map(function(exercicio, i) {
        return i === index ? "" : normalizarNomeExercicio(exercicio.nome || "");
      });
      const local = perfilUsuario ? normalizarLocalTreino(perfilUsuario.localTreino) : "academia_completa";
      const grupoAtual = exercicioAtual.grupo;
      let opcoesObjetos = [];

      Object.keys(bibliotecaExercicios).forEach(function(chave) {
        (bibliotecaExercicios[chave] || []).forEach(function(exercicio) {
          if (normalizarNomeExercicio(exercicio.nome) === normalizarNomeExercicio(exercicioAtual.nome)) return;
          if (nomesAtuais.includes(normalizarNomeExercicio(exercicio.nome))) return;
          const mesmoGrupo = exercicio.grupo === grupoAtual || (grupoAtual === "Ombros" && exercicio.grupo === "Ombro posterior") || (grupoAtual === "Abdômen" && (exercicio.grupo === "Core" || exercicio.grupo === "Cardio/Abdômen"));
          if (!mesmoGrupo) return;
          if (!equipamentoCompativelComPerfil(exercicio)) return;
          opcoesObjetos.push(ajustarExercicioPorMeta(Object.assign({}, exercicio)));
        });
      });

      let opcoesNomes = substituicoes[exercicioAtual.nome] || [];
      opcoesNomes.forEach(function(nome) {
        if (nomesAtuais.includes(normalizarNomeExercicio(nome))) return;
        opcoesObjetos.push({ nome: nome, grupo: exercicioAtual.grupo, equipamento: "Alternativo compatível", series: exercicioAtual.series, reps: exercicioAtual.reps, evitar: exercicioAtual.evitar, passos: ["Execute o movimento com controle e sem dor.", "Mantenha a postura firme durante todo o exercício.", "Use uma carga ou dificuldade que permita boa execução.", "Se sentir dor articular, pare e escolha outra variação."] });
      });

      opcoesObjetos = filtrarExerciciosUnicos(opcoesObjetos).slice(0, 8);

      if (!opcoesObjetos || opcoesObjetos.length === 0) {
        alert("Ainda não há substituições compatíveis sem repetir exercícios da lista. Você pode pular este exercício e seguir o treino.");
        return;
      }

      let textoOpcoes = "Escolha uma substituição para " + exercicioAtual.nome + ":\n\n";
      opcoesObjetos.forEach(function(opcao, i) { textoOpcoes += (i + 1) + " - " + opcao.nome + " (" + opcao.equipamento + ")\n"; });
      const numero = Number(prompt(textoOpcoes + "\nDigite o número da opção:"));
      if (numero < 1 || numero > opcoesObjetos.length) { alert("Opção inválida."); return; }
      treinoAtual[index] = opcoesObjetos[numero - 1];
      exerciciosConcluidos[index] = false;
      salvarTreinoAtualLocal();
      mostrarTreinoNaTela();
    }

    function normalizarNomeExercicio(nome) { return nome.trim().toLowerCase(); }

    function buscarSugestoesDeCarga(treino) {
      // O histórico agora fica somente na nuvem. Para manter a tela rápida,
      // a sugestão de carga será evoluída em uma próxima etapa lendo os últimos registros do Firestore.
      return {};
    }

    function obterTextoSugestaoCarga(nomeExercicio) {
      const sugestao = sugestoesCarga[nomeExercicio];
      if (!sugestao) return "Carga sugerida: ainda sem histórico para este exercício.";
      return "Última carga: " + sugestao.ultimaCarga + " kg em " + sugestao.data + ". Sugestão para hoje: " + sugestao.cargaSugerida + " kg. " + sugestao.motivo;
    }

    function preencherRegistroComExercicio(index) {
      const exercicio = treinoAtual[index];
      document.getElementById("exercicioRegistro").value = exercicio.nome;
      document.getElementById("carga").value = "";
      document.getElementById("reps").value = "";
      document.getElementById("sensacao").value = "normal";
      document.getElementById("observacaoTreino").value = "";
      document.getElementById("resultadoEvolucao").innerText = "";
      mensagemEvolucaoAtual = "";
      document.getElementById("exercicioRegistro").scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function calcularEvolucao() {
      const carga = Number(document.getElementById("carga").value);
      const reps = Number(document.getElementById("reps").value);
      const sensacao = document.getElementById("sensacao").value;
      const resultadoEvolucao = document.getElementById("resultadoEvolucao");
      if (document.getElementById("carga").value === "" || carga < 0 || reps <= 0) { resultadoEvolucao.innerText = "Preencha carga com 0 kg ou mais e repetições corretamente."; return; }
      let proximaCarga = carga;
      let mensagem = "";
      if (sensacao === "facil") { proximaCarga = carga + 2; mensagem = "No próximo treino, aumente para " + proximaCarga + " kg."; }
      else if (sensacao === "normal") mensagem = "Mantenha " + carga + " kg no próximo treino e tente melhorar a execução ou as repetições.";
      else { proximaCarga = Math.max(carga - 2, 0); mensagem = "Reduza para " + proximaCarga + " kg no próximo treino e foque na técnica."; }
      mensagemEvolucaoAtual = mensagem;
      resultadoEvolucao.innerText = mensagem;
    }

    function chaveUltimoTreinoLocal() {
      const email = usuarioAtual && usuarioAtual.email ? usuarioAtual.email.toLowerCase() : "anonimo";
      return "metatreino-ultimo-treino-salvo-" + email;
    }

    function salvarUltimoTreinoLocal(treinoSalvo) {
      try {
        localStorage.setItem(chaveUltimoTreinoLocal(), JSON.stringify({ letra: treinoSalvo.letraTreino, criadoEm: treinoSalvo.criadoEm }));
      } catch (erro) {}
    }

    function obterUltimoTreinoLocal() {
      try {
        return JSON.parse(localStorage.getItem(chaveUltimoTreinoLocal()) || "null");
      } catch (erro) {
        return null;
      }
    }

    function rolarParaProximoExercicioPendente() {
      const proximoIndex = exerciciosConcluidos.findIndex(function(item) { return item !== true; });
      if (proximoIndex >= 0) {
        const alvo = document.getElementById("cardExercicio" + proximoIndex);
        if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        const topo = document.getElementById("resultadoTreino");
        if (topo) topo.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    function salvarTreinoFeito() {
      if (!acessoLiberado || !usuarioAtual) {
        alert("Faça login com um e-mail autorizado para salvar o treino.");
        return;
      }

      if (treinoAtual.length === 0) { alert("Gere um treino antes de salvar."); return; }

      const exercicioRegistro = document.getElementById("exercicioRegistro").value.trim();
      const carga = document.getElementById("carga").value;
      const reps = document.getElementById("reps").value;
      const sensacao = document.getElementById("sensacao").value;
      const observacao = document.getElementById("observacaoTreino").value.trim();

      if (carga === "" || Number(carga) < 0 || Number(reps) <= 0) {
        alert("Informe uma carga de 0 kg ou mais e as repetições feitas.");
        return;
      }

      const nomesExercicios = treinoAtual.map(function(exercicio) { return exercicio.nome; });
      const totalExercicios = exerciciosConcluidos.length;
      const totalConcluidos = exerciciosConcluidos.filter(function(item) { return item === true; }).length;
      const agora = new Date();

      const treinoSalvo = { data: agora.toLocaleString("pt-BR"), criadoEm: agora.getTime(), diaSemana: nomeDoDiaDaSemana(), letraTreino: treinoAtual.letra || "Não informado", meta: perfilUsuario ? perfilUsuario.metaPrincipal : "", local: perfilUsuario ? perfilUsuario.localTreino : "", totalExercicios, totalConcluidos, nomeUsuario: perfilUsuario ? perfilUsuario.nome : "Usuário", exercicios: nomesExercicios, exercicioRegistro, carga, reps, sensacao, evolucao: mensagemEvolucaoAtual, feedbackFinalTreino: feedbackTreinoFinalAtual || "não informado", observacao, ultimaCardioConsiderada: ultimaCardioCache ? { data: ultimaCardioCache.data, intensidade: ultimaCardioCache.intensidade, sensacao: ultimaCardioCache.sensacao, distancia: ultimaCardioCache.distancia, tempo: ultimaCardioCache.tempo } : null };

      if (!navigator.onLine || !db || usuarioAtual.offline) {
        salvarTreinoPendenteOffline(treinoSalvo);
        return;
      }

      db.collection("usuarios").doc(usuarioAtual.uid).collection("treinos").add(treinoSalvo)
        .then(function() {
          salvarUltimoTreinoLocal(treinoSalvo);
          alert("Treino salvo na nuvem.");
          mostrarHistorico();
          rolarParaProximoExercicioPendente();
        })
        .catch(function(erro) { console.log("Erro ao salvar treino na nuvem:", erro); salvarTreinoPendenteOffline(treinoSalvo); });
    }

    function obterHistoricoDaNuvem(callback) {
      if (!acessoLiberado || !usuarioAtual) { callback([]); return; }
      if (!navigator.onLine || !db || usuarioAtual.offline) { callback(mesclarPendentesOffline("treinos", [])); return; }

      const limite90Dias = new Date().getTime() - (90 * 24 * 60 * 60 * 1000);

      db.collection("usuarios").doc(usuarioAtual.uid).collection("treinos").get()
        .then(function(snapshot) {
          const lista = [];
          snapshot.forEach(function(doc) {
            const item = doc.data();
            item.__id = doc.id;
            if (!item.criadoEm || Number(item.criadoEm) >= limite90Dias) lista.push(item);
          });
          lista.sort(function(a, b) { return Number(b.criadoEm || 0) - Number(a.criadoEm || 0); });
          callback(mesclarPendentesOffline("treinos", lista));
        })
        .catch(function(erro) { console.log("Erro ao carregar histórico da nuvem:", erro); callback(mesclarPendentesOffline("treinos", [])); });
    }

    function mostrarHistorico() { obterHistoricoDaNuvem(function(historico) { renderResumoHistorico(historico); }); }

    function dataRegistroParaDia(registro) {
      const timestamp = Number(registro && registro.criadoEm ? registro.criadoEm : 0);
      if (timestamp > 0) {
        const data = new Date(timestamp);
        return data.getFullYear() + "-" + String(data.getMonth() + 1).padStart(2, "0") + "-" + String(data.getDate()).padStart(2, "0");
      }

      const texto = registro && registro.data ? String(registro.data) : "";
      const partes = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (partes) return partes[3] + "-" + partes[2] + "-" + partes[1];
      return "";
    }

    function calcularStreakAtividades(treinos, cardios) {
      const dias = {};
      (treinos || []).forEach(function(item) {
        const dia = dataRegistroParaDia(item);
        if (dia) dias[dia] = true;
      });
      (cardios || []).forEach(function(item) {
        const dia = dataRegistroParaDia(item);
        if (dia && item.tipo !== "sem_cardio" && item.tipo !== "sem_corrida") dias[dia] = true;
      });

      let streak = 0;
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      for (let i = 0; i < 60; i++) {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() - i);
        const chave = data.getFullYear() + "-" + String(data.getMonth() + 1).padStart(2, "0") + "-" + String(data.getDate()).padStart(2, "0");

        if (dias[chave]) streak++;
        else if (i === 0) continue;
        else break;
      }

      return streak;
    }

    function calcularNivelAluno(treinos, cardios) {
      const totalTreinos = (treinos || []).length;
      const totalCardios = (cardios || []).filter(function(item) {
        return item.tipo !== "sem_cardio" && item.tipo !== "sem_corrida";
      }).length;
      const pontuacao = totalTreinos + totalCardios;

      if (pontuacao >= 24) return { nome: "Avançado", texto: "Você já tem boa constância registrada. Continue evoluindo com recuperação inteligente." };
      if (pontuacao >= 8) return { nome: "Intermediário", texto: "Você está criando uma base consistente. O foco agora é manter regularidade." };
      return { nome: "Iniciante", texto: "Você está construindo sua base. Priorize constância, técnica e segurança." };
    }

    function montarResumoPessoal(treinos, cardios) {
      const streak = calcularStreakAtividades(treinos, cardios);
      const nivel = calcularNivelAluno(treinos, cardios);
      const totalTreinos = (treinos || []).length;
      const totalCardios = (cardios || []).filter(function(item) {
        return item.tipo !== "sem_cardio" && item.tipo !== "sem_corrida";
      }).length;
      const pontos = (totalTreinos * 10) + (totalCardios * 6) + (streak * 3);

      return "<div class='historico-item'>" +
        "<strong>Resumo pessoal</strong><br>" +
        "Nível do aluno: <strong>" + limparTextoSeguro(nivel.nome) + "</strong><br>" +
        "Dias seguidos com atividade: <strong>" + streak + "</strong><br>" +
        "Treinos registrados: " + totalTreinos + "<br>" +
        "Cardios registrados: " + totalCardios + "<br>" +
        "Ranking pessoal: <strong>" + pontos + " pontos</strong><br>" +
        "<span class='small'>" + limparTextoSeguro(nivel.texto) + "</span>" +
        "</div>";
    }

    function mostrarHistoricoCompleto() {
      obterHistoricoDaNuvem(function(historicoTreinos) {
        obterCardiosDaNuvem(function(historicoCardios) {
          renderHistoricoCompleto(historicoTreinos, historicoCardios);
        });
      });
    }

    function renderResumoHistorico(historico) {
      const listaHistorico = document.getElementById("listaHistorico");
      listaHistorico.innerHTML = "";

      if (!historico || historico.length === 0) { listaHistorico.innerHTML = "<p class='small'>Nenhum treino salvo na nuvem ainda.</p>"; return; }

      const botaoCompleto = document.createElement("div");
      botaoCompleto.className = "historico-item";
      botaoCompleto.innerHTML = "<strong>Histórico resumido</strong><br><span class='small'>Mostrando os 3 últimos registros para manter a tela organizada.</span><br><button type='button' class='botao-principal' onclick='irParaHistoricoCompleto()'>Acompanhar histórico completo</button>";
      listaHistorico.appendChild(botaoCompleto);

      historico.slice(0, 3).forEach(function(item) {
        const div = document.createElement("div");
        div.className = "historico-item";
        div.innerHTML = "<strong>" + (item.data || "Sem data") + "</strong><br>" +
          "Treino: " + limparTextoSeguro(nomeAmigavelTreino(item.letraTreino || "")) + "<br>" +
          "Concluídos: " + (item.totalConcluidos || 0) + " de " + (item.totalExercicios || (item.exercicios ? item.exercicios.length : 0)) + " exercícios<br>" +
          "Registro principal: " + (item.exercicioRegistro || "Não informado") +
          (item.__offlinePendente ? "<br><span class='tag'>Pendente de sincronizar</span>" : "") +
          "<br><button type='button' class='botao-secundario' onclick='irParaHistoricoCompleto()'>Ver detalhes</button>" +
          (item.__id ? "<button type='button' class='botao-secundario' onclick='editarTreinoHistorico(" + JSON.stringify(item.__id) + ")'>Editar treino</button>" : "") +
          (item.__id ? "<button type='button' class='botao-perigo' onclick='excluirTreinoHistorico(" + JSON.stringify(item.__id) + ")'>Deletar treino</button>" : "");
        listaHistorico.appendChild(div);
      });
    }


    function calcularPaceMedio(item) {
      const distancia = Number(item.distancia || 0);
      const tempo = Number(item.tempo || 0);
      if (!distancia || !tempo || distancia <= 0) return null;
      const pace = tempo / distancia;
      const min = Math.floor(pace);
      const seg = Math.round((pace - min) * 60);
      return min + ":" + String(seg).padStart(2, "0") + " min/km";
    }

    function montarLinhaGrafico(rotulo, valor, maximo, detalhe) {
      const percentual = maximo > 0 ? Math.min(100, Math.round((valor / maximo) * 100)) : 0;
      return "<div class='grafico-linha'>" +
        "<div class='grafico-label'><span>" + limparTextoSeguro(rotulo) + "</span><span>" + limparTextoSeguro(detalhe || valor) + "</span></div>" +
        "<div class='grafico-trilho'><div class='grafico-barra' style='width:" + percentual + "%'></div></div>" +
      "</div>";
    }

    function montarGraficosEvolucao(treinos, cardios) {
      treinos = treinos || [];
      cardios = (cardios || []).filter(function(item) { return item.tipo !== "sem_cardio" && item.tipo !== "sem_corrida"; });

      const mapaTreinos = { A: 0, B: 0, C: 0, Descanso: 0 };
      treinos.forEach(function(item) {
        const letra = String(item.letraTreino || "").toUpperCase();
        if (letra === "A") mapaTreinos.A++;
        else if (letra === "B") mapaTreinos.B++;
        else if (letra === "C") mapaTreinos.C++;
        else mapaTreinos.Descanso++;
      });

      const mapaCardio = { Corrida: 0, Caminhada: 0, Bicicleta: 0 };
      let distanciaTotal = 0;
      let tempoTotal = 0;
      let melhorDistancia = 0;
      let melhorPace = null;
      cardios.forEach(function(item) {
        const tipo = item.tipoAtividade === "caminhada" ? "Caminhada" : (item.tipoAtividade === "bicicleta" ? "Bicicleta" : "Corrida");
        mapaCardio[tipo] = (mapaCardio[tipo] || 0) + 1;
        const distancia = Number(item.distancia || 0);
        const tempo = Number(item.tempo || 0);
        distanciaTotal += distancia;
        tempoTotal += tempo;
        if (distancia > melhorDistancia) melhorDistancia = distancia;
        if (distancia > 0 && tempo > 0) {
          const pace = tempo / distancia;
          if (melhorPace === null || pace < melhorPace) melhorPace = pace;
        }
      });

      const historicoPeso = JSON.parse(localStorage.getItem("historicoPeso") || "[]");
      const pesos = historicoPeso.slice(0, 10).map(function(item) { return Number(item.peso || 0); }).filter(function(p) { return p > 0; });
      const pesoAtual = pesos.length ? pesos[0] : (perfilUsuario ? Number(perfilUsuario.peso || 0) : 0);
      const pesoMaisAntigo = pesos.length ? pesos[pesos.length - 1] : pesoAtual;
      const diferencaPeso = pesoAtual && pesoMaisAntigo ? (pesoAtual - pesoMaisAntigo) : 0;

      const diasAtivos = {};
      treinos.forEach(function(item) { const d = dataRegistroParaDia(item); if (d) diasAtivos[d] = true; });
      cardios.forEach(function(item) { const d = dataRegistroParaDia(item); if (d) diasAtivos[d] = true; });
      const frequencia = Object.keys(diasAtivos).length;

      const maxTreino = Math.max(1, mapaTreinos.A, mapaTreinos.B, mapaTreinos.C, mapaTreinos.Descanso);
      const maxCardio = Math.max(1, mapaCardio.Corrida, mapaCardio.Caminhada, mapaCardio.Bicicleta);
      const paceTexto = melhorPace ? (Math.floor(melhorPace) + ":" + String(Math.round((melhorPace - Math.floor(melhorPace)) * 60)).padStart(2, "0") + " min/km") : "Sem pace ainda";

      return "<div class='grafico-card'>" +
        "<strong>📈 Gráficos reais de evolução</strong><br>" +
        "<span class='small'>Resumo visual baseado em peso registrado, treinos, cardio e frequência dos últimos 90 dias.</span>" +
        "<div class='alerta'><strong>Resumo real:</strong><br>" +
        "Peso atual registrado: " + (pesoAtual ? pesoAtual.toFixed(1) + " kg" : "sem peso registrado") + "<br>" +
        "Variação de peso: " + (diferencaPeso > 0 ? "+" : "") + diferencaPeso.toFixed(1) + " kg<br>" +
        "Frequência: " + frequencia + " dia(s) com treino/cardio<br>" +
        "Treinos salvos: " + treinos.length + " | Cardios salvos: " + cardios.length + "</div>" +
        montarLinhaGrafico("Frequência nos últimos 90 dias", frequencia, 90, frequencia + " dia(s)") +
        "<br><strong>💪 Partes treinadas</strong>" +
        montarLinhaGrafico("Treino de membros superiores", mapaTreinos.A, maxTreino, mapaTreinos.A + " registro(s)") +
        montarLinhaGrafico("Treino de costas e bíceps", mapaTreinos.B, maxTreino, mapaTreinos.B + " registro(s)") +
        montarLinhaGrafico("Treino de pernas e core", mapaTreinos.C, maxTreino, mapaTreinos.C + " registro(s)") +
        montarLinhaGrafico("Recuperação / descanso", mapaTreinos.Descanso, maxTreino, mapaTreinos.Descanso + " registro(s)") +
        "<br><strong>🏃 Cardio</strong>" +
        montarLinhaGrafico("Corrida", mapaCardio.Corrida, maxCardio, mapaCardio.Corrida + " registro(s)") +
        montarLinhaGrafico("Caminhada", mapaCardio.Caminhada, maxCardio, mapaCardio.Caminhada + " registro(s)") +
        montarLinhaGrafico("Bicicleta", mapaCardio.Bicicleta, maxCardio, mapaCardio.Bicicleta + " registro(s)") +
        "<div class='alerta'><strong>Evolução de cardio:</strong><br>" +
        "Distância total registrada: " + distanciaTotal.toFixed(1) + " km<br>" +
        "Tempo total registrado: " + tempoTotal + " min<br>" +
        "Maior distância em um registro: " + melhorDistancia.toFixed(1) + " km<br>" +
        "Melhor ritmo estimado: " + paceTexto + "</div>" +
      "</div>";
    }

    function formatarDiaHistorico(chave) {
      if (!chave) return "Sem data";
      const partes = chave.split("-");
      if (partes.length !== 3) return chave;
      return partes[2] + "/" + partes[1];
    }

    function formatarDataCompletaHistorico(chave) {
      if (!chave) return "Sem data";
      const partes = chave.split("-");
      if (partes.length !== 3) return chave;
      return partes[2] + "/" + partes[1] + "/" + partes[0];
    }

    function agruparRegistrosPorDia(treinos, cardios) {
      const mapa = {};

      (treinos || []).forEach(function(item) {
        const dia = dataRegistroParaDia(item);
        if (!dia) return;
        if (!mapa[dia]) mapa[dia] = { treinos: [], cardios: [] };
        mapa[dia].treinos.push(item);
      });

      (cardios || []).forEach(function(item) {
        const dia = dataRegistroParaDia(item);
        if (!dia) return;
        if (!mapa[dia]) mapa[dia] = { treinos: [], cardios: [] };
        mapa[dia].cardios.push(item);
      });

      return mapa;
    }

    function montarCardTreinoHistorico(item) {
      return "<div class='historico-item'>" +
        "<strong>💪 " + limparTextoSeguro(item.data || "Sem data") + "</strong><br>" +
        "Dia: " + limparTextoSeguro(item.diaSemana || "Não informado") + "<br>" +
        "Pessoa: " + limparTextoSeguro(item.nomeUsuario || "Usuário") + "<br>" +
        "Treino: " + limparTextoSeguro(nomeAmigavelTreino(item.letraTreino || "")) + "<br>" +
        "Meta: " + limparTextoSeguro(traduzirMeta(item.meta)) + "<br>" +
        "Local: " + limparTextoSeguro(traduzirLocal(item.local)) + "<br>" +
        "Concluídos: " + limparTextoSeguro(item.totalConcluidos || 0) + " de " + limparTextoSeguro(item.totalExercicios || (item.exercicios ? item.exercicios.length : 0)) + " exercícios<br>" +
        "Exercícios: " + limparTextoSeguro(item.exercicios ? item.exercicios.join(", ") : "Não informado") + "<br>" +
        "Registro principal: " + limparTextoSeguro(item.exercicioRegistro || "Não informado") + "<br>" +
        "Carga: " + limparTextoSeguro(item.carga !== undefined && item.carga !== "" ? item.carga : "-") + " kg | Reps: " + limparTextoSeguro(item.reps || "-") + " | Sensação: " + limparTextoSeguro(item.sensacao || "-") + "<br>" +
        "Evolução: " + limparTextoSeguro(item.evolucao || "Não calculada") + "<br>" +
        "Feedback final: " + limparTextoSeguro(item.feedbackFinalTreino || "Não informado") + "<br>" +
        "Observação: " + limparTextoSeguro(item.observacao || "Nenhuma") +
        (item.__id ? "<br><button type='button' class='botao-secundario' onclick='editarTreinoHistorico(" + JSON.stringify(item.__id) + ")'>Editar treino</button>" : "") +
        (item.__id ? "<button type='button' class='botao-perigo' onclick='excluirTreinoHistorico(" + JSON.stringify(item.__id) + ")'>Deletar treino</button>" : "") +
      "</div>";
    }

    function montarCardCardioHistorico(item) {
      if (item.tipo === "sem_cardio" || item.tipo === "sem_corrida") {
        return "<div class='historico-item'>" +
          "<strong>🏃 " + limparTextoSeguro(item.data || "Sem data") + "</strong><br>" +
          "Status: não fez cardio recentemente<br>" +
          "Observação: " + limparTextoSeguro(item.observacao || "Nenhuma") +
          (item.__id ? "<br><button type='button' class='botao-secundario' onclick='editarCardioHistorico(" + JSON.stringify(item.__id) + ")'>Editar cardio</button>" : "") +
          (item.__id ? "<button type='button' class='botao-perigo' onclick='excluirCardioHistorico(" + JSON.stringify(item.__id) + ")'>Deletar cardio</button>" : "") +
        "</div>";
      }

      const atividade = item.tipoAtividade === "caminhada" ? "Caminhada" : (item.tipoAtividade === "bicicleta" ? "Bicicleta" : "Corrida");
      return "<div class='historico-item'>" +
        "<strong>🏃 " + limparTextoSeguro(item.data || "Sem data") + "</strong><br>" +
        "Atividade: " + limparTextoSeguro(atividade) + "<br>" +
        "Distância: " + limparTextoSeguro(item.distancia || 0) + " km<br>" +
        "Tempo: " + limparTextoSeguro(item.tempo || 0) + " min<br>" +
        "Ritmo médio: " + limparTextoSeguro(calcularPaceMedio(item) || "Não calculado") + "<br>" +
        "Intensidade: " + limparTextoSeguro(traduzirIntensidadeCardio(item.intensidade)) + "<br>" +
        "Sensação: " + limparTextoSeguro(item.sensacao || "-") + "<br>" +
        "Nível: " + limparTextoSeguro(traduzirNivelCardio(item.nivelCardio || "")) + "<br>" +
        "Objetivo: " + limparTextoSeguro(traduzirObjetivoCardio(item.objetivoCardio || "")) + "<br>" +
        (item.temDesafio ? "Desafio: " + limparTextoSeguro(traduzirObjetivoCardio(item.distanciaDesafio || "")) + " em " + limparTextoSeguro(formatarDataBrasileira(item.dataDesafio || "")) + "<br>" : "") +
        "Observação: " + limparTextoSeguro(item.observacao || "Nenhuma") +
        (item.__id ? "<br><button type='button' class='botao-secundario' onclick='editarCardioHistorico(" + JSON.stringify(item.__id) + ")'>Editar cardio</button>" : "") +
        (item.__id ? "<button type='button' class='botao-perigo' onclick='excluirCardioHistorico(" + JSON.stringify(item.__id) + ")'>Deletar cardio</button>" : "") +
      "</div>";
    }

    function renderizarDetalheDiaHistorico(chaveDia, mapaDias) {
      const detalhe = document.getElementById("detalheDiaHistorico");
      if (!detalhe || !mapaDias || !mapaDias[chaveDia]) return;

      document.querySelectorAll(".dia-historico-btn").forEach(function(botao) {
        botao.classList.remove("ativo");
      });
      const botaoAtivo = document.getElementById("diaHistorico" + chaveDia.replace(/-/g, ""));
      if (botaoAtivo) botaoAtivo.classList.add("ativo");

      const grupo = mapaDias[chaveDia];
      let htmlDia = "<div class='alerta'><strong>" + formatarDataCompletaHistorico(chaveDia) + "</strong><br>" +
        "Treinos: " + grupo.treinos.length + " | Cardios: " + grupo.cardios.length + "</div>";

      grupo.treinos.forEach(function(item) { htmlDia += montarCardTreinoHistorico(item); });
      grupo.cardios.forEach(function(item) { htmlDia += montarCardCardioHistorico(item); });

      detalhe.innerHTML = htmlDia;
    }

    function renderHistoricoCompleto(historico, historicoCardio) {
      const listaHistoricoCompleto = document.getElementById("listaHistoricoCompleto");
      listaHistoricoCompleto.innerHTML = "";

      const treinos = historico || [];
      const cardios = historicoCardio || [];

      if (treinos.length === 0 && cardios.length === 0) {
        listaHistoricoCompleto.innerHTML = "<p class='small'>Nenhum treino ou cardio salvo na nuvem ainda.</p>";
        return;
      }

      listaHistoricoCompleto.innerHTML += montarResumoPessoal(treinos, cardios);
      listaHistoricoCompleto.innerHTML += montarGraficosEvolucao(treinos, cardios);

      const mapaDias = agruparRegistrosPorDia(treinos, cardios);
      const diasOrdenados = Object.keys(mapaDias).sort(function(a, b) { return b.localeCompare(a); });

      if (diasOrdenados.length > 0) {
        const calendarioBox = document.createElement("div");
        calendarioBox.className = "grafico-card";
        let calendarioHTML = "<strong>📅 Calendário de treinos</strong><br>" +
          "<span class='small'>Toque em uma data para ver o treino/cardio daquele dia.</span>" +
          "<div class='calendario-historico'>";

        diasOrdenados.forEach(function(dia, indice) {
          const grupo = mapaDias[dia];
          calendarioHTML += "<button type='button' id='diaHistorico" + dia.replace(/-/g, "") + "' class='dia-historico-btn" + (indice === 0 ? " ativo" : "") + "' onclick='renderizarDetalheDiaHistorico(" + JSON.stringify(dia) + ", window.__metatreinoMapaHistorico)'>" +
            formatarDiaHistorico(dia) + "<br><span>💪 " + grupo.treinos.length + " | 🏃 " + grupo.cardios.length + "</span></button>";
        });

        calendarioHTML += "</div><div id='detalheDiaHistorico' class='detalhe-dia-historico'><p class='small'>Selecione uma data acima para ver os registros daquele dia.</p></div>";
        calendarioBox.innerHTML = calendarioHTML;
        listaHistoricoCompleto.appendChild(calendarioBox);
        window.__metatreinoMapaHistorico = mapaDias;
      }
    }

    function buscarDocumentoHistorico(colecao, id, callback) {
      if (!acessoLiberado || !usuarioAtual || !db) {
        alert("Faça login com um e-mail autorizado para editar o histórico.");
        return;
      }
      db.collection("usuarios").doc(usuarioAtual.uid).collection(colecao).doc(id).get()
        .then(function(doc) {
          if (!doc.exists) { alert("Registro não encontrado. Atualize o histórico e tente novamente."); return; }
          const dados = doc.data() || {};
          dados.__id = doc.id;
          callback(dados);
        })
        .catch(function(erro) { console.log("Erro ao buscar registro para editar:", erro); alert("Não foi possível carregar este registro agora."); });
    }

    function atualizarDocumentoHistorico(colecao, id, dados, callback) {
      db.collection("usuarios").doc(usuarioAtual.uid).collection(colecao).doc(id).set(dados, { merge: true })
        .then(function() { if (callback) callback(); })
        .catch(function(erro) { console.log("Erro ao editar histórico:", erro); alert("Não foi possível salvar a edição agora. Confira a conexão e tente novamente."); });
    }

    function editarTreinoHistorico(id) {
      buscarDocumentoHistorico("treinos", id, function(item) {
        const novaCargaTexto = prompt("Editar carga usada (kg):", item.carga !== undefined && item.carga !== "" ? String(item.carga) : "");
        if (novaCargaTexto === null) return;
        const novasRepsTexto = prompt("Editar repetições feitas:", item.reps !== undefined && item.reps !== "" ? String(item.reps) : "");
        if (novasRepsTexto === null) return;
        const dadosAtualizados = {
          carga: novaCargaTexto === "" ? "" : Number(novaCargaTexto.replace(",", ".")),
          reps: novasRepsTexto === "" ? "" : Number(novasRepsTexto.replace(",", ".")),
          editadoEm: new Date().toLocaleString("pt-BR"),
          editadoEmTimestamp: Date.now()
        };
        atualizarDocumentoHistorico("treinos", id, dadosAtualizados, function() {
          alert("Treino editado com sucesso.");
          mostrarHistorico();
          mostrarHistoricoCompleto();
        });
      });
    }

    function editarCardioHistorico(id) {
      buscarDocumentoHistorico("corridas", id, function(item) {
        const novaDistanciaTexto = prompt("Editar distância feita (km):", item.distancia !== undefined && item.distancia !== "" ? String(item.distancia) : "");
        if (novaDistanciaTexto === null) return;
        const novoTempoTexto = prompt("Editar tempo total (minutos):", item.tempo !== undefined && item.tempo !== "" ? String(item.tempo) : "");
        if (novoTempoTexto === null) return;
        const dadosAtualizados = {
          distancia: novaDistanciaTexto === "" ? 0 : Number(novaDistanciaTexto.replace(",", ".")),
          tempo: novoTempoTexto === "" ? 0 : Number(novoTempoTexto.replace(",", ".")),
          editadoEm: new Date().toLocaleString("pt-BR"),
          editadoEmTimestamp: Date.now()
        };
        if (item.tipo === "sem_cardio" || item.tipo === "sem_corrida") dadosAtualizados.tipo = "cardio_editado";
        atualizarDocumentoHistorico("corridas", id, dadosAtualizados, function() {
          alert("Cardio editado com sucesso.");
          carregarCardios();
          mostrarHistoricoCompleto();
        });
      });
    }

    function excluirDocumentoHistorico(colecao, id, mensagemConfirmacao, callback) {
      if (!acessoLiberado || !usuarioAtual || !db) {
        alert("Faça login com um e-mail autorizado para deletar este registro.");
        return;
      }
      if (!confirm(mensagemConfirmacao)) return;
      db.collection("usuarios").doc(usuarioAtual.uid).collection(colecao).doc(id).delete()
        .then(function() { if (callback) callback(); })
        .catch(function(erro) {
          console.log("Erro ao deletar registro:", erro);
          alert("Não foi possível deletar este registro agora. Confira a conexão e tente novamente.");
        });
    }

    function excluirTreinoHistorico(id) {
      excluirDocumentoHistorico("treinos", id, "Tem certeza que deseja deletar somente este treino?", function() {
        alert("Treino deletado com sucesso.");
        mostrarHistorico();
        mostrarHistoricoCompleto();
      });
    }

    function excluirCardioHistorico(id) {
      excluirDocumentoHistorico("corridas", id, "Tem certeza que deseja deletar somente este cardio?", function() {
        alert("Cardio deletado com sucesso.");
        carregarCardios();
        mostrarHistoricoCompleto();
      });
    }

    function limparHistorico() {
      if (!confirm("Tem certeza que deseja apagar todo o histórico de treinos da nuvem?")) return;

      if (!acessoLiberado || !usuarioAtual || !db) { alert("Faça login com um e-mail autorizado para limpar o histórico."); return; }

      db.collection("usuarios").doc(usuarioAtual.uid).collection("treinos").get()
        .then(function(snapshot) {
          const batch = db.batch();
          snapshot.forEach(function(doc) { batch.delete(doc.ref); });
          return batch.commit();
        })
        .then(function() { mostrarHistorico(); mostrarHistoricoCompleto(); })
        .catch(function(erro) { console.log("Erro ao limpar histórico da nuvem:", erro); alert("Não foi possível limpar o histórico agora."); });
    }

    window.onload = function() {
      carregarPerfilAutomaticamente();
      atualizarFormularioEquipamentos();
      atualizarBotoesLogin(usuarioAtual);
    };

const METATREINO_APP_VERSION = window.METATREINO_VERSION || "1.3.9";

  function verificarAtualizacaoManual() {
    const status = document.getElementById("statusAtualizacaoManual");
    if (status) {
      status.className = "alerta";
      status.innerHTML = "🔄 Verificando atualização...";
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then(function(registrations) {
          const updates = registrations.map(function(registration) {
            return registration.update();
          });
          return Promise.all(updates);
        })
        .then(function() {
          if (status) {
            status.className = "alerta alerta-sucesso";
            status.innerHTML = "✅ Verificação concluída. Se houver versão nova, o app tentará carregar agora.";
          }

          setTimeout(function() {
            window.location.reload();
          }, 900);
        })
        .catch(function() {
          if (status) {
            status.className = "alerta alerta-aviso";
            status.innerHTML = "Não foi possível verificar automaticamente pelo Service Worker. O app vai tentar recarregar a página com a versão nova.";
          }
          setTimeout(function() {
            window.location.href = window.location.pathname + "?v=" + METATREINO_APP_VERSION + "&t=" + Date.now();
          }, 900);
        });
    } else {
      if (status) {
        status.className = "alerta alerta-aviso";
        status.innerHTML = "Seu navegador não usa Service Worker neste modo. Atualize a página normalmente.";
      }

      setTimeout(function() {
        window.location.reload();
      }, 900);
    }
  }

  function tentarAtualizacaoAutomatica() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      registrations.forEach(function(registration) { registration.update(); });
    }).catch(function(error) { console.log("Atualização automática não concluída:", error); });
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", function() {
      if (!window.__metatreinoRecarregouAtualizacao) {
        window.__metatreinoRecarregouAtualizacao = true;
        window.location.reload();
      }
    });
    window.addEventListener("focus", tentarAtualizacaoAutomatica);
    document.addEventListener("visibilitychange", function() {
      if (!document.hidden) tentarAtualizacaoAutomatica();
    });
    window.addEventListener("load", function() {
      navigator.serviceWorker.register("./service-worker.js?v=" + METATREINO_APP_VERSION)
        .then(function(registration) {
          registration.update();
          if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
          registration.addEventListener("updatefound", function() {
            const novoWorker = registration.installing;
            if (!novoWorker) return;
            novoWorker.addEventListener("statechange", function() {
              if (novoWorker.state === "installed" && navigator.serviceWorker.controller) {
                novoWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          });
        })
        .catch(function(error) {
          console.log("Falha ao registrar service worker:", error);
        });
    });
  }


/* Versão 1.3.9 - correção real da biblioteca de exercícios por categoria */
function calcularIdadePorNascimento(dataISO) { if (!dataISO) return 0; const nasc = new Date(dataISO + "T00:00:00"); if (isNaN(nasc.getTime())) return 0; const hoje = new Date(); let idade = hoje.getFullYear() - nasc.getFullYear(); const mes = hoje.getMonth() - nasc.getMonth(); if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) idade--; return Math.max(0, idade); }
function normalizarLocalTreino(valor) { const mapa = { academia_grande: "academia_avancada", academia_pequena: "academia_basica", garagem: "academia_basica", casa_limitado: "academia_basica", halteres: "academia_basica", academia_casa: "academia_basica", academia_completa: "academia_avancada", personalizado: "academia_basica", sem_equipamento: "sem_equipamento", academia_basica: "academia_basica", academia_avancada: "academia_avancada" }; return mapa[valor] || "sem_equipamento"; }
function traduzirLocal(valor) { const local = normalizarLocalTreino(valor); if (local === "sem_equipamento") return "Sem Equipamento — peso corporal"; if (local === "academia_basica") return "Academia básica — barras, halteres e banco"; if (local === "academia_avancada") return "Academia avançada — completa"; return "Sem Equipamento — peso corporal"; }
function atualizarFormularioEquipamentos() { return; }
function obterEquipamentosCasaSelecionados() { return []; }
function restaurarEquipamentosCasa() { return; }
function criarExercicioCategoria(nome, grupo, equipamento, categoria, nivel, evitar, passos) { return { nome: nome, grupo: grupo, equipamento: equipamento, categoriaEquipamento: categoria, nivel: nivel || "iniciante", evitar: evitar || "nenhuma", passos: passos || [] }; }
function instalarBibliotecaReal138() { const pc = "sem_equipamento", bas = "academia_basica", av = "academia_avancada";
bibliotecaExercicios.A = [
criarExercicioCategoria("Flexão de braço", "Peito", "Peso corporal", pc, "iniciante", "ombro", ["Apoie as mãos no chão.","Mantenha o corpo alinhado.","Desça com controle.","Suba empurrando o chão."]),
criarExercicioCategoria("Flexão com joelhos apoiados", "Peito", "Peso corporal", pc, "iniciante", "ombro", ["Apoie joelhos e mãos no chão.","Mantenha tronco alinhado.","Desça sem relaxar o abdômen.","Suba com controle."]),
criarExercicioCategoria("Pike push-up", "Ombros", "Peso corporal", pc, "intermediario", "ombro", ["Forme um V invertido com o corpo.","Flexione os cotovelos.","Aproxime a cabeça do chão.","Suba com controle."]),
criarExercicioCategoria("Flexão fechada", "Tríceps", "Peso corporal", pc, "intermediario", "ombro", ["Aproxime as mãos.","Mantenha cotovelos perto do corpo.","Desça com controle.","Suba contraindo tríceps."]),
criarExercicioCategoria("Prancha alta com toque no ombro", "Abdômen", "Peso corporal", pc, "iniciante", "ombro", ["Fique em prancha alta.","Toque um ombro com a mão oposta.","Alterne os lados.","Evite balançar o quadril."]),
criarExercicioCategoria("Supino reto com barra", "Peito", "Barra e banco", bas, "intermediario", "ombro", ["Deite no banco com pés firmes.","Desça a barra controlando.","Empurre para cima.","Mantenha ombros estáveis."]),
criarExercicioCategoria("Supino com halteres", "Peito", "Halteres e banco", bas, "iniciante", "ombro", ["Deite no banco.","Segure os halteres alinhados.","Desça com controle.","Suba sem bater os pesos."]),
criarExercicioCategoria("Desenvolvimento com halteres", "Ombros", "Halteres", bas, "iniciante", "ombro", ["Segure os halteres na linha dos ombros.","Empurre para cima.","Não arqueie a lombar.","Desça devagar."]),
criarExercicioCategoria("Elevação lateral com halteres", "Ombros", "Halteres", bas, "iniciante", "ombro", ["Segure um halter em cada mão.","Eleve até a linha dos ombros.","Evite balanço.","Desça devagar."]),
criarExercicioCategoria("Tríceps francês com halter", "Tríceps", "Halter", bas, "iniciante", "ombro", ["Segure o halter acima da cabeça.","Flexione os cotovelos.","Estenda com controle.","Evite arquear a lombar."]),
criarExercicioCategoria("Supino máquina", "Peito", "Máquina", av, "iniciante", "ombro", ["Ajuste o banco.","Empurre as alças à frente.","Não trave os cotovelos.","Volte controlando."]),
criarExercicioCategoria("Crucifixo no cabo", "Peito", "Cabos/polias", av, "intermediario", "ombro", ["Ajuste os cabos.","Feche os braços contraindo o peito.","Mantenha cotovelos semiflexionados.","Volte devagar."]),
criarExercicioCategoria("Tríceps corda", "Tríceps", "Polia com corda", av, "iniciante", "ombro", ["Mantenha cotovelos próximos.","Empurre a corda para baixo.","Estenda os braços.","Volte controlando."])
];
bibliotecaExercicios.B = [
criarExercicioCategoria("Super-homem", "Costas", "Peso corporal", pc, "iniciante", "lombar", ["Deite de barriga para baixo.","Eleve braços e pernas levemente.","Segure por poucos segundos.","Volte com controle."]),
criarExercicioCategoria("Prancha baixa", "Abdômen", "Peso corporal", pc, "iniciante", "lombar", ["Apoie antebraços e pés.","Mantenha corpo alinhado.","Contraia abdômen.","Respire sem prender o ar."]),
criarExercicioCategoria("Anjo reverso no chão", "Ombro posterior", "Peso corporal", pc, "iniciante", "ombro", ["Deite de barriga para baixo.","Abra os braços em movimento controlado.","Contraia a parte alta das costas.","Evite dor no ombro."]),
criarExercicioCategoria("Remada curvada com halteres", "Costas", "Halteres", bas, "intermediario", "lombar", ["Incline o tronco com coluna firme.","Puxe os halteres ao quadril.","Contraia as costas.","Desça controlando."]),
criarExercicioCategoria("Remada unilateral com halter", "Costas", "Halter", bas, "iniciante", "lombar", ["Apoie uma mão em superfície firme.","Puxe o halter ao quadril.","Contraia costas.","Desça devagar."]),
criarExercicioCategoria("Rosca direta com barra", "Bíceps", "Barra", bas, "iniciante", "nenhuma", ["Segure a barra com palmas para cima.","Mantenha cotovelos fixos.","Suba contraindo bíceps.","Desça devagar."]),
criarExercicioCategoria("Rosca martelo", "Bíceps", "Halteres", bas, "iniciante", "nenhuma", ["Palmas viradas uma para a outra.","Suba sem balançar.","Contraia bíceps.","Desça controlando."]),
criarExercicioCategoria("Puxada frente", "Costas", "Máquina/polia", av, "iniciante", "ombro", ["Segure a barra.","Puxe em direção ao peito.","Mantenha tronco firme.","Volte controlando."]),
criarExercicioCategoria("Remada baixa", "Costas", "Máquina/cabo", av, "iniciante", "lombar", ["Sente com coluna reta.","Puxe o cabo ao abdômen.","Contraia costas.","Volte devagar."]),
criarExercicioCategoria("Face pull", "Ombro posterior", "Polia/cabo", av, "intermediario", "ombro", ["Puxe em direção ao rosto.","Abra os cotovelos.","Contraia posterior de ombro.","Volte controlando."])
];
bibliotecaExercicios.C = [
criarExercicioCategoria("Agachamento livre", "Pernas", "Peso corporal", pc, "iniciante", "joelho", ["Pés na largura dos ombros.","Desça empurrando quadril para trás.","Mantenha coluna firme.","Suba empurrando o chão."]),
criarExercicioCategoria("Afundo alternado", "Pernas", "Peso corporal", pc, "intermediario", "joelho", ["Dê um passo à frente.","Desça controlando.","Volte à posição inicial.","Alterne as pernas."]),
criarExercicioCategoria("Ponte de glúteo", "Glúteos", "Peso corporal", pc, "iniciante", "lombar", ["Deite de barriga para cima.","Pés apoiados no chão.","Suba o quadril contraindo glúteos.","Desça controlando."]),
criarExercicioCategoria("Panturrilha em pé", "Panturrilha", "Peso corporal", pc, "iniciante", "nenhuma", ["Fique em pé.","Suba na ponta dos pés.","Contraia no topo.","Desça devagar."]),
criarExercicioCategoria("Abdominal curto", "Abdômen", "Peso corporal", pc, "iniciante", "lombar", ["Deite de barriga para cima.","Contraia abdômen.","Eleve levemente o tronco.","Volte com controle."]),
criarExercicioCategoria("Agachamento com halter", "Pernas", "Halter", bas, "iniciante", "joelho", ["Segure o halter junto ao peito.","Desça com controle.","Mantenha coluna firme.","Suba empurrando o chão."]),
criarExercicioCategoria("Stiff com halteres", "Posterior de coxa", "Halteres", bas, "intermediario", "lombar", ["Segure os halteres à frente.","Incline o tronco com coluna firme.","Sinta posterior alongar.","Suba contraindo glúteos."]),
criarExercicioCategoria("Afundo com halteres", "Pernas", "Halteres", bas, "intermediario", "joelho", ["Segure halteres ao lado do corpo.","Dê um passo à frente.","Desça controlando.","Volte empurrando a perna da frente."]),
criarExercicioCategoria("Leg press", "Pernas", "Máquina", av, "iniciante", "joelho", ["Apoie costas no banco.","Pés na plataforma.","Desça com controle.","Empurre sem travar joelhos."]),
criarExercicioCategoria("Cadeira extensora", "Pernas", "Máquina", av, "iniciante", "joelho", ["Ajuste o aparelho.","Estenda os joelhos.","Contraia quadríceps.","Volte devagar."]),
criarExercicioCategoria("Mesa flexora", "Posterior de coxa", "Máquina", av, "iniciante", "joelho", ["Ajuste o aparelho.","Flexione os joelhos.","Contraia posterior.","Volte controlando."])
];
bibliotecaExercicios.descanso = [criarExercicioCategoria("Mobilidade de quadril", "Recuperação", "Peso corporal", pc, "iniciante", "nenhuma", ["Faça movimentos lentos.","Evite dor.","Respire com controle.","Use como recuperação."]), criarExercicioCategoria("Alongamento leve", "Recuperação", "Peso corporal", pc, "iniciante", "nenhuma", ["Alongue sem forçar.","Respire devagar.","Mantenha conforto.","Finalize leve."]), criarExercicioCategoria("Respiração e mobilidade", "Recuperação", "Peso corporal", pc, "iniciante", "nenhuma", ["Respire profundamente.","Movimente ombros, quadril e coluna.","Evite posições dolorosas.","Finalize leve."])];
}
function equipamentoCompativelComPerfil(exercicio) { const local = perfilUsuario ? normalizarLocalTreino(perfilUsuario.localTreino) : "sem_equipamento"; const categoria = exercicio && exercicio.categoriaEquipamento ? exercicio.categoriaEquipamento : "sem_equipamento"; if (local === "sem_equipamento") return categoria === "sem_equipamento"; if (local === "academia_basica") return categoria === "academia_basica"; if (local === "academia_avancada") return categoria === "academia_avancada"; return categoria === "sem_equipamento"; }
function equipamentoEhPesoCorporal(exercicio) { return !!exercicio && exercicio.categoriaEquipamento === "sem_equipamento"; }
function ajustarEquipamentoVisualPorLocal(exercicio) { const copia = Object.assign({}, exercicio); if (copia.categoriaEquipamento === "sem_equipamento") copia.equipamento = "Peso corporal"; return copia; }
function completarTreinoSemEquipamento(lista, letraTreino, dor, tempo) { const alvo = alvoQuantidadeExercicios(tempo, determinarPerfilTreino()); const base = (bibliotecaExercicios[letraTreino] || []).filter(function(exercicio) { return equipamentoCompativelComPerfil(exercicio) && exercicio.evitar !== dor; }); const nomes = {}; (lista || []).forEach(function(exercicio) { nomes[normalizarNomeExercicio(exercicio.nome || "")] = true; }); base.forEach(function(exercicio) { if (lista.length >= alvo) return; const chave = normalizarNomeExercicio(exercicio.nome || ""); if (!nomes[chave]) { lista.push(Object.assign({}, exercicio)); nomes[chave] = true; } }); return lista; }
instalarBibliotecaReal138();

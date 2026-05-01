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
          categoria: treinoAtual.categoria || treinoAtual.letra || "",
          versaoGeracao: "0.0.5-conquistas-recuperacao",
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
        const categoriaSalva = normalizarCategoriaTreino(dados.categoria || dados.letra || "");
        const expirado = dados.salvoEm && (Date.now() - Number(dados.salvoEm)) > (2 * 24 * 60 * 60 * 1000);
        const temCategoriaIncompativel = gruposPermitidosPorCategoria(categoriaSalva) && dados.treino.some(function(exercicio) { return !exercicioPertenceCategoria(exercicio, categoriaSalva); });
        if (expirado || temCategoriaIncompativel) {
          limparTreinoAtualLocal();
          return false;
        }
        treinoAtual = dados.treino;
        treinoAtual.letra = dados.letra || "";
        treinoAtual.categoria = categoriaSalva || dados.letra || "";
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
      if (tempo === "rapido") return perfil && perfil.avancado ? 5 : 4;
      if (tempo === "normal") return perfil && perfil.iniciante ? 5 : 6;
      return perfil && perfil.iniciante ? 6 : 8;
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

    auth.onAuthStateChanged(function(user) {
      usuarioAtual = user;
      atualizarTelaLogin(user);

      if (user) {
        verificarAcessoUsuario(user);
        verificarAdminUsuario(user);
      } else {
        usuarioAdmin = false;
        atualizarBotaoPainelTreinador();
        bloquearApp("Faça login com Google para verificar seu acesso.");
      }
    }, function(error) {
      usuarioAtual = null;
      atualizarTelaLogin(null);
      bloquearApp("Não foi possível verificar o login agora. Tente novamente em alguns instantes.");
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
          if (usuarioAtual) {
            mostrarMensagemAcesso("Você está logado, mas o app não conseguiu confirmar o acesso agora. Confira a conexão e toque novamente em Perfil ou recarregue a página.", "aviso");
          } else {
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
      const ids = ["paginaPerfil", "paginaTreino", "paginaCheckin", "paginaCardio", "paginaHistoricoCompleto", "paginaConquistas", "paginaPainelTreinador", "paginaNovidades"];
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
    let memoriaTreinoCache = { historico: [], ultimosNomes: {}, sugestoes: {}, geracao: 0 };
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

    function carregarPerfilAutomaticamente() {
      const perfilSalvo = localStorage.getItem("perfilUsuario");
      if (!perfilSalvo) return;
      perfilUsuario = JSON.parse(perfilSalvo);
      document.getElementById("nome").value = perfilUsuario.nome || "";
      document.getElementById("sexo").value = perfilUsuario.sexo || "";
      const campoDataNascimento = document.getElementById("dataNascimento");
      if (campoDataNascimento) campoDataNascimento.value = perfilUsuario.dataNascimento || "";
      document.getElementById("peso").value = perfilUsuario.peso || "";
      document.getElementById("altura").value = perfilUsuario.alturaCm || "";
      document.getElementById("metaPrincipal").value = perfilUsuario.metaPrincipal || "massa";
      document.getElementById("rotinaAtual").value = perfilUsuario.rotinaAtual || "nunca";
      document.getElementById("tempoExperiencia").value = perfilUsuario.tempoExperiencia || "menos_1";
      document.getElementById("localTreino").value = perfilUsuario.localTreino || "academia_grande";
      mostrarResumoPerfilCarregado();
      document.getElementById("botaoIrTreino").classList.remove("hidden");
    }

    function mostrarResumoPerfilCarregado() {
      const resultadoPerfil = document.getElementById("resultadoPerfil");
      resultadoPerfil.classList.remove("hidden");
      resultadoPerfil.innerHTML = "<strong>Perfil carregado automaticamente</strong><br>" + perfilUsuario.nome + ", seu IMC salvo é " + perfilUsuario.imc + ".<br>Classificação: " + perfilUsuario.classificacao + ".<br>Meta: " + traduzirMeta(perfilUsuario.metaPrincipal) + ".<br>Local de treino: " + traduzirLocal(perfilUsuario.localTreino) + ".<br><br><span class='small'>Se quiser alterar seus dados, edite os campos e clique em Calcular e salvar perfil.</span>";
    }

    function calcularIdadePorNascimento(dataISO) {
      if (!dataISO) return 0;
      const nascimento = new Date(dataISO + "T00:00:00");
      if (isNaN(nascimento.getTime())) return 0;
      const hoje = new Date();
      let idade = hoje.getFullYear() - nascimento.getFullYear();
      const mes = hoje.getMonth() - nascimento.getMonth();
      if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
      return idade > 0 ? idade : 0;
    }

    function calcularPerfil() {
      if (!acessoLiberado) {
        bloquearApp("Faça login com um e-mail autorizado para usar o app.");
        return;
      }

      const nome = document.getElementById("nome").value.trim();
      const sexo = document.getElementById("sexo").value;
      const dataNascimento = document.getElementById("dataNascimento").value;
      const idade = calcularIdadePorNascimento(dataNascimento);
      const peso = Number(document.getElementById("peso").value);
      const alturaCm = Number(document.getElementById("altura").value);
      const metaPrincipal = document.getElementById("metaPrincipal").value;
      const rotinaAtual = document.getElementById("rotinaAtual").value;
      const tempoExperiencia = document.getElementById("tempoExperiencia").value;
      const localTreino = document.getElementById("localTreino").value;
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

      perfilUsuario = { nome, sexo, dataNascimento, idade, peso, alturaCm, imc: imc.toFixed(1), classificacao, mensagem, metaPrincipal, rotinaAtual, tempoExperiencia, localTreino };
      localStorage.setItem("perfilUsuario", JSON.stringify(perfilUsuario));
      registrarPeso(peso);
      mostrarMensagemMudancaPeso(perfilAntigo, peso);

      resultadoPerfil.classList.remove("hidden");
      resultadoPerfil.innerHTML = "<strong>" + nome + ", seu IMC é " + imc.toFixed(1) + "</strong><br>Idade: " + idade + " anos.<br>Classificação: " + classificacao + ".<br>" + mensagem + "<br>Meta: " + traduzirMeta(metaPrincipal) + ".<br>Rotina: " + traduzirRotina(rotinaAtual) + ".<br>Experiência: " + traduzirExperiencia(tempoExperiencia) + ".<br>Local: " + traduzirLocal(localTreino) + ".<br><br><span class='small'>Observação: IMC é uma estimativa simples. Ele não diferencia massa muscular de gordura.</span>";
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
      document.getElementById("idade").value = "";
      document.getElementById("peso").value = "";
      document.getElementById("altura").value = "";
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
      const mapa = { academia_grande: "academia completa", academia_basica: "academia básica / equipamentos simples", academia_pequena: "academia básica / equipamentos simples", garagem: "academia básica / equipamentos simples", casa_limitado: "academia básica / equipamentos simples", sem_equipamento: "peso corporal / sem equipamentos" };
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



    function irParaConquistas() {
      if (!acessoLiberado) {
        bloquearApp("Faça login com um e-mail autorizado para ver suas conquistas.");
        return;
      }
      ocultarPaginasDoApp();
      document.getElementById("paginaConquistas").classList.remove("hidden");
      carregarConquistas();
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
      const chave = normalizarCategoriaTreino(letra);
      const nomes = {
        automatico: "Treino inteligente",
        superior: "Treino A - Superiores",
        inferior: "Treino B - Inferiores",
        core_abdomen: "Treino C - Abdômen / core",
        descanso: "Treino leve / recuperação"
      };
      return nomes[chave] || nomes[letra] || "Treino inteligente";
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

    function atualizarDorCheckin(valor) {
      const campo = document.getElementById("dor");
      if (campo) campo.value = valor || "nenhuma";
    }

    function nomeDoDiaDaSemana() {
      const dias = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
      return dias[new Date().getDay()];
    }

    function escolherTreinoPorDiaDaSemana() {
      const hoje = new Date().getDay();
      if (hoje === 1 || hoje === 4) return "A";
      if (hoje === 2 || hoje === 5) return "B";
      if (hoje === 3 || hoje === 6) return "C";
      if (hoje === 0) return "A";
      return "A";
    }

    function escolherTreinoABC(divisaoSelecionada) {
      if (["superior", "inferior", "core_abdomen"].includes(divisaoSelecionada)) return divisaoSelecionada;
      if (divisaoSelecionada !== "automatico" && divisaoSelecionada) return normalizarCategoriaTreino(divisaoSelecionada);

      const dorAtual = document.getElementById("dor") ? document.getElementById("dor").value : "nenhuma";
      const energiaAtual = document.getElementById("energia") ? document.getElementById("energia").value : "bem";
      if (new Date().getDay() === 0) return "descanso";
      if (energiaAtual === "mal" || energiaAtual === "cansado") return "descanso";
      if (dorAtual === "pernas" || dorAtual === "joelho") return "superior";
      if (dorAtual === "bracos" || dorAtual === "ombro") return "inferior";
      if (dorAtual === "coluna" || dorAtual === "lombar") return "descanso";

      if (perfilUsuario) {
        if (perfilUsuario.metaPrincipal === "perder_peso" || perfilUsuario.metaPrincipal === "definicao") return "inferior";
        if (perfilUsuario.sexo === "feminino" && (perfilUsuario.metaPrincipal === "massa" || perfilUsuario.metaPrincipal === "definicao")) return "inferior";
        if (perfilUsuario.metaPrincipal === "forca") return "superior";
      }

      const hoje = new Date().getDay();
      if (hoje === 1 || hoje === 4) return "superior";
      if (hoje === 2 || hoje === 5) return "inferior";
      if (hoje === 3 || hoje === 6) return "core_abdomen";
      return "descanso";
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
      const naoCorreu = document.getElementById("naoCorreuRecentemente");
      const desativar = naoCorreu && naoCorreu.checked;
      ["distanciaCardio", "tempoCardio", "intensidadeCardio", "sensacaoCardio", "observacaoCardio", "nivelCardio", "objetivoCardio", "condicaoCardio", "temDesafioCardio", "distanciaDesafioCardio", "dataDesafioCardio"].forEach(function(id) {
        const campo = document.getElementById(id);
        if (campo) campo.disabled = desativar;
      });
    }

    function salvarCardio() {
      if (!acessoLiberado || !usuarioAtual || !db) {
        alert("Faça login com um e-mail autorizado para salvar atividades de cardio.");
        return;
      }

      const naoCorreu = document.getElementById("naoCorreuRecentemente") && document.getElementById("naoCorreuRecentemente").checked;
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

        db.collection("usuarios").doc(usuarioAtual.uid).collection("corridas").add(registroSemCardio)
          .then(function() {
            ultimaCardioCache = registroSemCardio;
            if (caixa) {
              caixa.className = "alerta alerta-sucesso";
              caixa.innerHTML = "✅ Registro salvo: nenhum cardio recente será considerado no próximo treino.";
            }
            document.getElementById("naoCorreuRecentemente").checked = false;
            alternarCamposCardio();
            carregarCardios();
          })
          .catch(function(erro) {
            console.log("Erro ao salvar registro sem cardio:", erro);
            if (caixa) {
              caixa.className = "alerta alerta-aviso";
              caixa.innerHTML = "Não foi possível salvar o registro agora. Confira sua conexão e tente novamente.";
            }
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
          if (caixa) {
            caixa.className = "alerta alerta-aviso";
            caixa.innerHTML = "Não foi possível salvar o cardio agora. Confira sua conexão e tente novamente.";
          }
        });
    }

    function obterCardiosDaNuvem(callback) {
      if (!acessoLiberado || !usuarioAtual || !db) { callback([]); return; }

      const limite90Dias = new Date().getTime() - (90 * 24 * 60 * 60 * 1000);

      db.collection("usuarios").doc(usuarioAtual.uid).collection("corridas").get()
        .then(function(snapshot) {
          const lista = [];
          snapshot.forEach(function(doc) {
            const item = doc.data();
            item._id = doc.id;
            if (!item.criadoEm || Number(item.criadoEm) >= limite90Dias) lista.push(item);
          });
          lista.sort(function(a, b) { return Number(b.criadoEm || 0) - Number(a.criadoEm || 0); });
          callback(lista);
        })
        .catch(function(erro) { console.log("Erro ao carregar cardios:", erro); callback([]); });
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
              "Observação: " + limparTextoSeguro(item.observacao || "Nenhuma");
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
              "Observação: " + limparTextoSeguro(item.observacao || "Nenhuma");
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

          const treinoPesadoRecente = treinosRecentes.some(function(item) {
            const horas = (agora - Number(item.criadoEm || 0)) / (1000 * 60 * 60);
            return horas <= 36 && (item.sensacao === "dificil" || item.feedbackFinalTreino === "dificil" || Number(item.totalConcluidos || 0) >= 6);
          });

          if (treinoPesadoRecente || totalEsforcos >= 3 || (cardioForte && treinoPesado)) {
            callback({
              sugerirDescanso: true,
              mensagem: treinoPesadoRecente
                ? "Descanso inteligente: o app identificou treino pesado recente e sugeriu recuperação ativa para preservar evolução e reduzir risco de excesso."
                : "Descanso inteligente: o app identificou esforço recente acumulado em treinos/cardio e sugeriu recuperação ativa para reduzir risco de excesso."
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
        local: ["sem_equipamento", "casa_limitado"],
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
      if (!perfilUsuario || perfilUsuario.localTreino !== "sem_equipamento") return treino;
      if (normalizarCategoriaTreino(letraTreino) === "descanso") return treino;

      const alvo = tempo === "rapido" ? 4 : (tempo === "normal" ? 6 : 8);
      const extras = [
        criarExercicioPesoCorporal("Agachamento livre", "Pernas", "joelho", ["Pés na largura dos ombros.", "Desça com controle.", "Mantenha coluna firme.", "Suba empurrando o chão."]),
        criarExercicioPesoCorporal("Afundo alternado", "Pernas", "joelho", ["Dê um passo à frente.", "Desça com controle.", "Mantenha tronco firme.", "Alterne as pernas."]),
        criarExercicioPesoCorporal("Agachamento sumô", "Pernas", "joelho", ["Abra um pouco mais a base dos pés.", "Desça com controle.", "Mantenha joelhos alinhados.", "Suba contraindo pernas e glúteos."]),
        criarExercicioPesoCorporal("Elevação de panturrilha", "Panturrilha", "joelho", ["Fique em pé com apoio se precisar.", "Suba nas pontas dos pés.", "Contraia a panturrilha.", "Desça devagar."]),
        criarExercicioPesoCorporal("Ponte de glúteo", "Glúteos", "lombar", ["Deite de barriga para cima.", "Pés firmes no chão.", "Suba o quadril contraindo glúteos.", "Desça com controle."]),
        criarExercicioPesoCorporal("Ponte unilateral", "Glúteos", "lombar", ["Deite de barriga para cima.", "Mantenha uma perna apoiada.", "Suba o quadril com controle.", "Troque o lado."]),
        criarExercicioPesoCorporal("Flexão de braço", "Peito", "ombro", ["Apoie as mãos no chão.", "Mantenha corpo alinhado.", "Desça com controle.", "Suba empurrando o chão."]),
        criarExercicioPesoCorporal("Flexão inclinada", "Peito", "ombro", ["Apoie as mãos em superfície firme.", "Mantenha corpo alinhado.", "Desça controlando.", "Suba empurrando a superfície."]),
        criarExercicioPesoCorporal("Superman", "Costas", "lombar", ["Deite de barriga para baixo.", "Eleve braços e pernas com controle.", "Contraia costas e glúteos.", "Desça devagar."]),
        criarExercicioPesoCorporal("Prancha", "Abdômen", "lombar", ["Apoie cotovelos e pés.", "Contraia o abdômen.", "Mantenha o corpo alinhado.", "Pare se sentir dor lombar."]),
        criarExercicioPesoCorporal("Prancha lateral", "Abdômen", "lombar", ["Apoie cotovelo e lateral dos pés.", "Mantenha o quadril elevado.", "Contraia o abdômen.", "Troque o lado."]),
        criarExercicioPesoCorporal("Abdominal curto", "Abdômen", "lombar", ["Deite com joelhos flexionados.", "Suba o tronco parcialmente.", "Contraia abdômen.", "Volte devagar."]),
        criarExercicioPesoCorporal("Mountain climber", "Cardio/Abdômen", "lombar", ["Apoie as mãos no chão.", "Traga os joelhos alternadamente.", "Mantenha abdômen firme.", "Faça devagar se precisar."])
      ];

      const nomes = treino.map(function(exercicio) { return normalizarNomeExercicio(exercicio.nome); });
      extras.forEach(function(exercicio) {
        if (treino.length >= alvo) return;
        if (exercicio.evitar === dor) return;
        if (!exercicioPertenceCategoria(exercicio, letraTreino)) return;
        if (!nomes.includes(normalizarNomeExercicio(exercicio.nome))) {
          treino.push(exercicio);
          nomes.push(normalizarNomeExercicio(exercicio.nome));
        }
      });

      return treino.filter(function(exercicio) { return exercicioPertenceCategoria(exercicio, letraTreino); });
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

    function aplicarProgressaoSemanalAoTreino(treino, progressaoSemanal, tempo) {
      if (!progressaoSemanal || !treino || treino.length === 0) return treino;

      if (progressaoSemanal.reduzirVolume && treino.length > 4) {
        return treino.slice(0, Math.max(4, treino.length - 1));
      }

      return treino;
    }

    function carregarMemoriaInteligenteTreino(callback) {
      if (!acessoLiberado || !usuarioAtual || !db) {
        memoriaTreinoCache = { historico: [], ultimosNomes: {}, sugestoes: {}, geracao: Date.now() };
        callback(memoriaTreinoCache);
        return;
      }

      db.collection("usuarios").doc(usuarioAtual.uid).collection("treinos").get()
        .then(function(snapshot) {
          const historico = [];
          snapshot.forEach(function(doc) {
            const item = doc.data() || {};
            item._id = doc.id;
            historico.push(item);
          });
          historico.sort(function(a, b) { return Number(b.criadoEm || 0) - Number(a.criadoEm || 0); });

          const ultimosNomes = {};
          const sugestoes = {};
          const limiteRecente = Date.now() - (21 * 24 * 60 * 60 * 1000);

          historico.forEach(function(item) {
            const nomes = Array.isArray(item.exercicios) ? item.exercicios : [];
            nomes.forEach(function(nome) {
              const chaveNome = normalizarNomeExercicio(nome || "");
              if (!chaveNome) return;
              if (!ultimosNomes[chaveNome]) {
                ultimosNomes[chaveNome] = { data: item.data || "registro recente", criadoEm: Number(item.criadoEm || 0), recente: Number(item.criadoEm || 0) >= limiteRecente };
              }
            });

            const principal = normalizarNomeExercicio(item.exercicioRegistro || "");
            if (principal && !sugestoes[principal]) {
              const carga = Number(item.carga || 0);
              const reps = Number(item.reps || 0);
              const sensacao = item.sensacao || "normal";
              let cargaSugerida = carga;
              let motivo = "Mantenha a carga e tente melhorar a técnica.";
              if (sensacao === "facil") {
                cargaSugerida = carga + 2;
                motivo = "Último registro ficou fácil, então a sugestão é subir levemente a carga.";
              } else if (sensacao === "dificil") {
                cargaSugerida = Math.max(carga - 2, 0);
                motivo = "Último registro ficou difícil, então a sugestão é reduzir um pouco e priorizar técnica.";
              } else if (reps >= 12 && carga > 0) {
                cargaSugerida = carga + 1;
                motivo = "Você já registrou boas repetições; aumente pouco se a execução estiver segura.";
              }
              sugestoes[principal] = {
                ultimaCarga: carga,
                reps: reps,
                sensacao: sensacao,
                data: item.data || "registro recente",
                cargaSugerida: cargaSugerida,
                motivo: motivo
              };
            }
          });

          memoriaTreinoCache = { historico: historico, ultimosNomes: ultimosNomes, sugestoes: sugestoes, geracao: Date.now() };
          callback(memoriaTreinoCache);
        })
        .catch(function(erro) {
          console.log("Erro ao carregar memória inteligente do treino:", erro);
          memoriaTreinoCache = { historico: [], ultimosNomes: {}, sugestoes: {}, geracao: Date.now() };
          callback(memoriaTreinoCache);
        });
    }

    function aplicarAntiRepeticaoInteligente(treino, categoria, alvo) {
      const lista = filtrarExerciciosUnicos(treino || []);
      if (!memoriaTreinoCache || !memoriaTreinoCache.ultimosNomes || lista.length <= alvo) return lista;
      const recentes = memoriaTreinoCache.ultimosNomes;
      const preferidos = [];
      const repetidos = [];
      lista.forEach(function(exercicio) {
        const chave = normalizarNomeExercicio(exercicio.nome || "");
        if (recentes[chave] && recentes[chave].recente) repetidos.push(exercicio);
        else preferidos.push(exercicio);
      });
      if (preferidos.length >= Math.max(3, Math.min(alvo, lista.length))) {
        return preferidos.concat(repetidos);
      }
      return lista;
    }

    function aplicarProgressaoDeCargaNosExercicios(treino) {
      if (!treino || !memoriaTreinoCache || !memoriaTreinoCache.sugestoes) return treino;
      return treino.map(function(exercicio) {
        const copia = Object.assign({}, exercicio);
        const sugestao = memoriaTreinoCache.sugestoes[normalizarNomeExercicio(copia.nome || "")];
        if (sugestao && copia.registravel !== false) copia.sugestaoCarga = sugestao;
        return copia;
      });
    }


    function criarExercicioSimples(nome, grupo, equipamento, locais, evitar, nivel) {
      return {
        nome: nome, grupo: grupo, equipamento: equipamento || "Livre", nivel: nivel || "iniciante",
        local: locais || ["sem_equipamento", "academia_basica", "academia_grande", "academia_pequena", "garagem", "casa_limitado"], evitar: evitar || "nenhuma",
        passos: ["Faça o movimento com controle.", "Mantenha postura firme e respiração constante.", "Use uma dificuldade que permita boa execução.", "Pare se sentir dor articular ou mal-estar."]
      };
    }

    function garantirBibliotecaExpandida() {
      if (bibliotecaExercicios._expandida001) return;
      const peso = ["sem_equipamento", "casa_limitado", "academia_basica", "academia_grande", "academia_pequena", "garagem"];
      const basica = ["academia_basica", "academia_grande", "academia_pequena", "garagem", "casa_limitado"];
      const completa = ["academia_grande"];
      const extras = [
        criarExercicioSimples("Flexão inclinada", "Peito", "Peso corporal", peso, "ombro"), criarExercicioSimples("Flexão declinada", "Peito", "Peso corporal", peso, "ombro"), criarExercicioSimples("Flexão diamante", "Tríceps", "Peso corporal", peso, "ombro"), criarExercicioSimples("Flexão com pausa", "Peito", "Peso corporal", peso, "ombro"),
        criarExercicioSimples("Agachamento sumô", "Pernas", "Peso corporal", peso, "joelho"), criarExercicioSimples("Agachamento unilateral", "Pernas", "Peso corporal", peso, "joelho", "avancado"), criarExercicioSimples("Ponte unilateral", "Glúteos", "Peso corporal", peso, "lombar"), criarExercicioSimples("Elevação de panturrilha unilateral", "Panturrilha", "Peso corporal", peso, "joelho"),
        criarExercicioSimples("Prancha lateral", "Abdômen", "Peso corporal", peso, "lombar"), criarExercicioSimples("Abdominal infra", "Abdômen", "Peso corporal", peso, "lombar"), criarExercicioSimples("Bicicleta no ar", "Abdômen", "Peso corporal", peso, "lombar"), criarExercicioSimples("Hollow body hold", "Abdômen", "Peso corporal", peso, "lombar"), criarExercicioSimples("V-up", "Abdômen", "Peso corporal", peso, "lombar"),
        criarExercicioSimples("Superman", "Costas", "Peso corporal", peso, "lombar"), criarExercicioSimples("Elevação dorsal no chão", "Costas", "Peso corporal", peso, "lombar"), criarExercicioSimples("Burpee", "Funcional", "Peso corporal", peso, "joelho", "intermediario"), criarExercicioSimples("Bear crawl", "Funcional", "Peso corporal", peso, "ombro", "intermediario"),
        criarExercicioSimples("Supino inclinado com halteres", "Peito", "Halteres", basica, "ombro"), criarExercicioSimples("Crucifixo com halteres", "Peito", "Halteres", basica, "ombro"), criarExercicioSimples("Arnold press", "Ombros", "Halteres", basica, "ombro"), criarExercicioSimples("Tríceps francês", "Tríceps", "Halter ou barra", basica, "ombro"), criarExercicioSimples("Rosca alternada com halteres", "Bíceps", "Halteres", basica), criarExercicioSimples("Stiff com halteres", "Posterior de coxa", "Halteres", basica, "lombar"), criarExercicioSimples("Hip thrust com halter/barra", "Glúteos", "Banco e peso", basica, "lombar"), criarExercicioSimples("Remada curvada com halter", "Costas", "Halter", basica, "lombar"), criarExercicioSimples("Russian twist com halter", "Abdômen", "Halter", basica, "lombar"),
        criarExercicioSimples("Supino em máquina", "Peito", "Máquina", completa, "ombro"), criarExercicioSimples("Crucifixo na máquina", "Peito", "Peck deck", completa, "ombro"), criarExercicioSimples("Cross over", "Peito", "Cabo", completa, "ombro"), criarExercicioSimples("Remada na máquina", "Costas", "Máquina", completa, "lombar"), criarExercicioSimples("Desenvolvimento em máquina", "Ombros", "Máquina", completa, "ombro"), criarExercicioSimples("Rosca Scott", "Bíceps", "Máquina ou barra", completa), criarExercicioSimples("Cadeira extensora", "Pernas", "Máquina", completa, "joelho"), criarExercicioSimples("Cadeira flexora", "Posterior de coxa", "Máquina", completa, "joelho"), criarExercicioSimples("Hack machine", "Pernas", "Máquina", completa, "joelho"), criarExercicioSimples("Abdução de quadril", "Glúteos", "Máquina", completa), criarExercicioSimples("Abdominal no cabo", "Abdômen", "Cabo", completa, "lombar")
      ];
      extras.forEach(function(ex) {
        if (["Peito", "Ombros", "Tríceps"].includes(ex.grupo)) bibliotecaExercicios.A.push(ex);
        else if (["Costas", "Bíceps", "Ombro posterior"].includes(ex.grupo)) bibliotecaExercicios.B.push(ex);
        else if (["Pernas", "Glúteos", "Panturrilha", "Posterior de coxa", "Abdômen", "Funcional"].includes(ex.grupo)) bibliotecaExercicios.C.push(ex);
      });
      bibliotecaExercicios._expandida001 = true;
    }

    function normalizarCategoriaTreino(categoria) {
      const aliases = {
        A: "superior",
        B: "inferior",
        C: "core_abdomen",
        semana: "automatico",
        bracos_peito: "superior",
        pernas_fortes: "inferior",
        gluteos_definidos: "inferior",
        barriga_chapada: "core_abdomen",
        gluteos_posterior: "inferior",
        completo: "superior"
      };
      return aliases[categoria] || categoria;
    }

    function gruposPermitidosPorCategoria(categoria) {
      const cat = normalizarCategoriaTreino(categoria);
      const mapa = {
        superior: ["Peito", "Costas", "Ombros", "Ombro posterior", "Tríceps", "Bíceps"],
        inferior: ["Pernas", "Quadríceps", "Posterior de coxa", "Glúteos", "Panturrilha"],
        core_abdomen: ["Abdômen", "Core", "Lombar", "Cardio/Abdômen"],
        descanso: ["Recuperação", "Recuperação ativa", "Pernas leves", "Peito leve", "Costas leves", "Core leve", "Mobilidade", "Alongamento", "Cardio leve", "Liberação miofascial", "Yoga"]
      };
      return mapa[cat] || null;
    }

    function exercicioPertenceCategoria(exercicio, categoria) {
      const grupos = gruposPermitidosPorCategoria(categoria);
      if (!grupos) return true;
      return grupos.includes(exercicio.grupo);
    }

    function categoriaDoGrupoExercicio(grupo) {
      const mapa = {
        Peito: "superior", Costas: "superior", Ombros: "superior", "Ombro posterior": "superior", "Tríceps": "superior", "Bíceps": "superior",
        Pernas: "inferior", "Quadríceps": "inferior", "Posterior de coxa": "inferior", "Glúteos": "inferior", Panturrilha: "inferior",
        Abdômen: "core_abdomen", Core: "core_abdomen", Lombar: "core_abdomen", "Cardio/Abdômen": "core_abdomen",
        Recuperação: "descanso", "Recuperação ativa": "descanso", "Pernas leves": "descanso", "Peito leve": "descanso", "Costas leves": "descanso", "Core leve": "descanso", Mobilidade: "descanso", Alongamento: "descanso", "Cardio leve": "descanso", "Liberação miofascial": "descanso", Yoga: "descanso"
      };
      return mapa[grupo] || "";
    }

    function ordenarTreinoPorVariedade(lista) {
      const vistosGrupo = {};
      const principal = [];
      const extras = [];
      (lista || []).forEach(function(exercicio) {
        const grupo = exercicio.grupo || "";
        if (!vistosGrupo[grupo]) {
          vistosGrupo[grupo] = true;
          principal.push(exercicio);
        } else {
          extras.push(exercicio);
        }
      });
      return principal.concat(extras);
    }

    function garantirTreinoDaCategoriaSelecionada(treino, categoria, local, dor, alvo) {
      const cat = normalizarCategoriaTreino(categoria);
      if (!gruposPermitidosPorCategoria(cat)) return treino || [];

      const jaVistos = {};
      let correto = (treino || []).filter(function(exercicio) {
        const chave = normalizarNomeExercicio(exercicio.nome || "");
        if (!chave || jaVistos[chave]) return false;
        if (!exercicioPertenceCategoria(exercicio, cat)) return false;
        jaVistos[chave] = true;
        return true;
      });

      if (correto.length < alvo) {
        const base = obterBaseTreinoPorCategoria(cat).filter(function(exercicio) {
          if (!exercicioPertenceCategoria(exercicio, cat)) return false;
          if (exercicio.local && !exercicio.local.includes(local)) return false;
          if (dor && dor !== "nenhuma" && exercicio.evitar === dor) return false;
          if (!nivelPermitido(exercicio)) return false;
          return true;
        }).map(ajustarExercicioPorMeta);

        base.forEach(function(exercicio) {
          if (correto.length >= alvo) return;
          const chave = normalizarNomeExercicio(exercicio.nome || "");
          if (!jaVistos[chave]) {
            jaVistos[chave] = true;
            correto.push(exercicio);
          }
        });
      }

      return ordenarTreinoPorVariedade(correto).slice(0, alvo);
    }

    function criarExercicioCategoria(nome, grupo, equipamento, locais, evitar, nivel, passos, registravel) {
      const ex = criarExercicioSimples(nome, grupo, equipamento, locais, evitar || "nenhuma", nivel || "iniciante");
      if (passos && passos.length) ex.passos = passos;
      if (registravel === false) {
        ex.registravel = false;
        ex.series = "Sugestão";
        ex.reps = "sem carga/repetições";
      }
      return ex;
    }

    function bibliotecaProfissionalPorCategoria(categoria) {
      garantirBibliotecaExpandida();
      const cat = normalizarCategoriaTreino(categoria);
      const todosLocais = ["sem_equipamento", "casa_limitado", "academia_basica", "academia_grande", "academia_pequena", "garagem"];
      const peso = ["sem_equipamento", "casa_limitado", "academia_basica", "academia_grande", "academia_pequena", "garagem"];
      const basica = ["academia_basica", "academia_grande", "academia_pequena", "garagem", "casa_limitado"];
      const completa = ["academia_grande", "academia_pequena"];
      const passosPadrao = ["Execute com controle e boa postura.", "Use carga ou dificuldade compatível com sua técnica.", "Respire de forma constante.", "Pare se sentir dor articular ou mal-estar."];
      const leve = ["Mantenha intensidade leve e confortável.", "Não transforme em treino pesado.", "Respire de forma controlada.", "Finalize se houver dor, tontura ou mal-estar."];
      const superior = [
        criarExercicioCategoria("Supino reto", "Peito", "Barra ou halteres", basica, "ombro", "iniciante", passosPadrao), criarExercicioCategoria("Supino inclinado", "Peito", "Barra, halteres ou máquina", basica, "ombro", "iniciante", passosPadrao), criarExercicioCategoria("Flexão tradicional", "Peito", "Peso corporal", peso, "ombro", "iniciante", passosPadrao), criarExercicioCategoria("Flexão inclinada", "Peito", "Peso corporal", peso, "ombro", "iniciante", passosPadrao), criarExercicioCategoria("Crucifixo", "Peito", "Halteres, cabo ou máquina", basica, "ombro", "iniciante", passosPadrao), criarExercicioCategoria("Remada baixa", "Costas", "Cabo, máquina ou elástico", basica, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Puxada na frente", "Costas", "Polia ou elástico", basica, "ombro", "iniciante", passosPadrao), criarExercicioCategoria("Remada curvada", "Costas", "Barra ou halteres", basica, "lombar", "intermediario", passosPadrao), criarExercicioCategoria("Remada unilateral", "Costas", "Halter ou mochila", basica, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Superman", "Costas", "Peso corporal", peso, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Desenvolvimento", "Ombros", "Halteres, barra ou máquina", basica, "ombro", "iniciante", passosPadrao), criarExercicioCategoria("Elevação lateral", "Ombros", "Halteres, cabo ou elástico", basica, "ombro", "iniciante", passosPadrao), criarExercicioCategoria("Face pull", "Ombro posterior", "Cabo ou elástico", basica, "ombro", "iniciante", passosPadrao), criarExercicioCategoria("Rosca direta", "Bíceps", "Barra, halteres ou elástico", basica, "nenhuma", "iniciante", passosPadrao), criarExercicioCategoria("Rosca alternada", "Bíceps", "Halteres", basica, "nenhuma", "iniciante", passosPadrao), criarExercicioCategoria("Rosca martelo", "Bíceps", "Halteres", basica, "nenhuma", "iniciante", passosPadrao), criarExercicioCategoria("Tríceps corda", "Tríceps", "Polia", completa, "ombro", "iniciante", passosPadrao), criarExercicioCategoria("Tríceps testa", "Tríceps", "Barra ou halteres", basica, "ombro", "iniciante", passosPadrao), criarExercicioCategoria("Tríceps banco", "Tríceps", "Banco/cadeira ou peso corporal", peso, "ombro", "iniciante", passosPadrao), criarExercicioCategoria("Flexão diamante", "Tríceps", "Peso corporal", peso, "ombro", "intermediario", passosPadrao)
      ];
      const inferior = [
        criarExercicioCategoria("Agachamento livre", "Pernas", "Peso corporal, barra ou halteres", peso, "joelho", "iniciante", passosPadrao), criarExercicioCategoria("Agachamento sumô", "Pernas", "Peso corporal, barra ou halteres", peso, "joelho", "iniciante", passosPadrao), criarExercicioCategoria("Agachamento búlgaro", "Pernas", "Banco e halteres/opcional", basica, "joelho", "intermediario", passosPadrao), criarExercicioCategoria("Leg press", "Quadríceps", "Máquina", completa, "joelho", "iniciante", passosPadrao), criarExercicioCategoria("Cadeira extensora", "Quadríceps", "Máquina", completa, "joelho", "iniciante", passosPadrao), criarExercicioCategoria("Afundo", "Pernas", "Peso corporal ou halteres", peso, "joelho", "iniciante", passosPadrao), criarExercicioCategoria("Passada", "Pernas", "Peso corporal ou halteres", peso, "joelho", "iniciante", passosPadrao), criarExercicioCategoria("Stiff", "Posterior de coxa", "Barra ou halteres", basica, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Mesa flexora", "Posterior de coxa", "Máquina", completa, "joelho", "iniciante", passosPadrao), criarExercicioCategoria("Elevação pélvica / Hip thrust", "Glúteos", "Banco, barra, halter ou máquina", basica, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Ponte de glúteo", "Glúteos", "Peso corporal ou peso", peso, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Coice no cabo ou elástico", "Glúteos", "Cabo ou elástico", basica, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Abdução de quadril", "Glúteos", "Máquina ou elástico", basica, "nenhuma", "iniciante", passosPadrao), criarExercicioCategoria("Panturrilha em pé", "Panturrilha", "Peso corporal, halteres ou máquina", peso, "nenhuma", "iniciante", passosPadrao), criarExercicioCategoria("Panturrilha sentado", "Panturrilha", "Máquina ou halter", basica, "nenhuma", "iniciante", passosPadrao), criarExercicioCategoria("Pistol squat assistido", "Pernas", "Peso corporal", peso, "joelho", "avancado", passosPadrao)
      ];
      const core = [
        criarExercicioCategoria("Prancha", "Core", "Peso corporal", todosLocais, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Prancha lateral", "Core", "Peso corporal", todosLocais, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Abdominal tradicional / crunch", "Abdômen", "Peso corporal", todosLocais, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Abdominal infra / elevação de pernas", "Abdômen", "Peso corporal", todosLocais, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Bicicleta no ar", "Abdômen", "Peso corporal", todosLocais, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Russian twist", "Abdômen", "Peso corporal, halter ou anilha", basica, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Dead bug", "Core", "Peso corporal", todosLocais, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Hollow body hold", "Core", "Peso corporal", todosLocais, "lombar", "intermediario", passosPadrao), criarExercicioCategoria("Mountain climber", "Cardio/Abdômen", "Peso corporal", todosLocais, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Abdominal na polia", "Abdômen", "Cabo", completa, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Hiperextensão lombar", "Lombar", "Banco ou peso corporal", basica, "lombar", "iniciante", passosPadrao), criarExercicioCategoria("Superman", "Lombar", "Peso corporal", todosLocais, "lombar", "iniciante", passosPadrao)
      ];
      const descanso = [
        criarExercicioCategoria("Agachamento leve", "Pernas leves", "Peso corporal ou carga baixa", todosLocais, "joelho", "iniciante", ["Faça com amplitude confortável.", "Use baixa carga ou apenas peso corporal.", "Mantenha o movimento controlado.", "Pare se houver dor no joelho ou mal-estar."], true),
        criarExercicioCategoria("Supino leve ou flexão inclinada", "Peito leve", "Halteres leves, máquina ou apoio elevado", todosLocais, "ombro", "iniciante", ["Use carga baixa ou apoio alto para facilitar.", "Desça com controle.", "Empurre sem travar o corpo com força excessiva.", "Mantenha ritmo leve e técnico."], true),
        criarExercicioCategoria("Remada leve", "Costas leves", "Elástico, halter leve, máquina ou mochila leve", todosLocais, "lombar", "iniciante", ["Mantenha a coluna firme.", "Puxe com controle, sem trancos.", "Use carga leve.", "Priorize postura e execução."], true),
        criarExercicioCategoria("Prancha leve", "Core leve", "Peso corporal", todosLocais, "lombar", "iniciante", ["Apoie joelhos se precisar.", "Contraia o abdômen sem prender a respiração.", "Mantenha pouco tempo e boa postura.", "Pare se sentir a lombar incomodar."], true),
        criarExercicioCategoria("Dead bug", "Core leve", "Peso corporal", todosLocais, "lombar", "iniciante", ["Deite de barriga para cima.", "Movimente braço e perna opostos com controle.", "Mantenha lombar estável.", "Faça devagar e sem pressa."], true),
        criarExercicioCategoria("Bird dog", "Core leve", "Peso corporal", todosLocais, "lombar", "iniciante", ["Fique em quatro apoios.", "Estenda braço e perna opostos.", "Segure um instante com controle.", "Volte devagar e troque o lado."], true),
        criarExercicioCategoria("Mobilidade articular", "Mobilidade", "Peso corporal", todosLocais, "nenhuma", "iniciante", ["Faça rotações leves de ombro.", "Inclua mobilidade de quadril.", "Movimente tornozelos com calma.", "Não force amplitude dolorida."], false),
        criarExercicioCategoria("Alongamento leve", "Alongamento", "Livre", todosLocais, "nenhuma", "iniciante", ["Segure posições confortáveis.", "Respire fundo e mantenha o corpo relaxado.", "Evite forçar dor.", "Use como complemento do treino leve."], false),
        criarExercicioCategoria("Liberação miofascial", "Liberação miofascial", "Rolo ou bola", basica, "nenhuma", "iniciante", ["Use rolo ou bola de massagem.", "Passe devagar nas regiões tensionadas.", "Evite pressão excessiva.", "Use como recuperação, não como exercício de carga."], false),
        criarExercicioCategoria("Cardio leve zona 1-2", "Cardio leve", "Caminhada, bike ou elíptico", todosLocais, "nenhuma", "iniciante", ["Mantenha intensidade leve.", "Consiga conversar durante a atividade.", "Não transforme em treino forte.", "Finalize se sentir cansaço excessivo."], false),
        criarExercicioCategoria("Yoga / relaxamento", "Yoga", "Livre", todosLocais, "nenhuma", "iniciante", ["Faça movimentos lentos.", "Priorize respiração e relaxamento.", "Evite posições desconfortáveis.", "Use como complemento regenerativo."], false),
        criarExercicioCategoria("Treino técnico leve", "Recuperação ativa", "Carga baixa", basica, "nenhuma", "iniciante", ["Escolha movimentos simples.", "Use carga bem baixa.", "Foque em postura perfeita.", "Não busque falha muscular."], true)
      ];
      if (cat === "superior") return superior;
      if (cat === "inferior") return inferior;
      if (cat === "core_abdomen") return core;
      if (cat === "descanso") return descanso;
      return superior;
    }

    function obterBaseTreinoPorCategoria(categoria) {
      const lista = bibliotecaProfissionalPorCategoria(categoria);
      if (normalizarCategoriaTreino(categoria) === "descanso") {
        return lista.map(function(exercicio) {
          const copia = Object.assign({}, exercicio);
          copia.registravel = false;
          copia.series = "10 a 25 minutos";
          copia.reps = "ritmo leve";
          return copia;
        });
      }
      return lista;
    }

    function gerarTreino() {
      limparTreinoAtualLocal();
      treinoAtual = [];
      exerciciosConcluidos = [];
      marcarCheckinRespondido();
      analisarEsforcoRecente(function(esforcoRecente) {
        analisarProgressaoSemanal(function(progressaoSemanal) {
          carregarMemoriaInteligenteTreino(function() {
            gerarTreinoComEsforco(
              esforcoRecente || { sugerirDescanso: false, mensagem: "" },
              progressaoSemanal || { fase: "neutra", reduzirVolume: false, mensagem: "" }
            );
          });
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
      const localOriginal = perfilUsuario ? perfilUsuario.localTreino : "academia_grande";
      const local = localOriginal === "academia_basica" ? "academia_pequena" : localOriginal;
      garantirBibliotecaExpandida();

      if (divisaoSelecionada === "automatico" && esforcoRecente.sugerirDescanso) {
        letraTreino = "descanso";
      }

      const dorBloqueiaGrupo = function(exercicio) {
        if (dor === "pernas" && ["Pernas", "Glúteos", "Panturrilha", "Posterior de coxa"].includes(exercicio.grupo)) return true;
        if (dor === "bracos" && ["Bíceps", "Tríceps", "Peito", "Ombros"].includes(exercicio.grupo)) return true;
        if (dor === "coluna" && (exercicio.evitar === "lombar" || exercicio.grupo === "Costas" || exercicio.grupo === "Abdômen")) return true;
        return exercicio.evitar === dor;
      };

      const baseTreinoCategoria = obterBaseTreinoPorCategoria(letraTreino);
      let treinoFiltrado = baseTreinoCategoria.filter(function(exercicio) {
        return !dorBloqueiaGrupo(exercicio) && exercicio.local.includes(local) && nivelPermitido(exercicio);
      }).map(ajustarExercicioPorMeta);

      if (treinoFiltrado.length === 0) {
        treinoFiltrado = baseTreinoCategoria.filter(function(exercicio) { return exercicio.evitar !== dor; }).map(ajustarExercicioPorMeta);
      }

      if (local === "sem_equipamento" && letraTreino !== "descanso") {
        treinoFiltrado = completarTreinoSemEquipamento(treinoFiltrado, letraTreino, dor, tempo);
      }

      treinoFiltrado = filtrarExerciciosUnicos(treinoFiltrado);
      treinoFiltrado = adaptarTreinoPorPerfil(treinoFiltrado, tempo);
      if (gruposPermitidosPorCategoria(letraTreino)) {
        treinoFiltrado = treinoFiltrado.filter(function(exercicio) { return exercicioPertenceCategoria(exercicio, letraTreino); });
      }
      treinoFiltrado = aplicarProgressaoSemanalAoTreino(treinoFiltrado, progressaoSemanal, tempo);

      const perfilTreino = determinarPerfilTreino();
      const alvoExercicios = alvoQuantidadeExercicios(tempo, perfilTreino);
      treinoFiltrado = aplicarAntiRepeticaoInteligente(treinoFiltrado, letraTreino, alvoExercicios);
      treinoFiltrado = aplicarProgressaoDeCargaNosExercicios(treinoFiltrado);
      treinoFiltrado = treinoFiltrado.slice(0, alvoExercicios);

      const localComCardio = ["academia_grande", "academia_pequena", "academia_basica", "garagem"].includes(localOriginal);
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
      if (ajusteCardio.reduzirVolume && treinoFiltrado.length > 4) {
        treinoFiltrado = treinoFiltrado.slice(0, Math.max(4, treinoFiltrado.length - 1));
      }
      if (ajusteCardio.sugerirDescanso && letraTreino === "core_abdomen") {
        letraTreino = "descanso";
        treinoFiltrado = obterBaseTreinoPorCategoria("descanso").filter(function(exercicio) {
          return exercicio.local.includes(local) || exercicio.local.includes(localOriginal);
        }).map(ajustarExercicioPorMeta);
      }

      treinoFiltrado = garantirTreinoDaCategoriaSelecionada(treinoFiltrado, letraTreino, local, dor, alvoExercicios);

      treinoAtual = treinoFiltrado;
      treinoAtual.letra = letraTreino === "descanso" ? "Descanso" : letraTreino;
      treinoAtual.categoria = normalizarCategoriaTreino(letraTreino);
      feedbackTreinoFinalAtual = "";
      exerciciosConcluidos = new Array(treinoAtual.length).fill(false);

      let ajuste = "";
      if (letraTreino === "descanso") {
        ajuste = "Recuperação inteligente ativada: hoje o app mostra apenas sugestões leves e informativas. Não é necessário registrar carga ou repetições.";
      } else {
        if (energia === "bem") ajuste = "Hoje você pode treinar normalmente e tentar evoluir carga se a execução estiver boa.";
        else if (energia === "cansado") ajuste = "Hoje reduza um pouco o volume. Faça uma série a menos em cada exercício.";
        else ajuste = "Hoje faça um treino leve. Priorize técnica, mobilidade e não force carga.";
        if (divisaoSelecionada === "semana") ajuste = "Hoje é " + nomeDoDiaDaSemana() + ". " + nomeAmigavelTreino(letraTreino) + " selecionado pelo dia da semana com descanso inteligente. " + ajuste;
        else if (divisaoSelecionada === "automatico") ajuste = nomeAmigavelTreino(letraTreino) + " escolhido pelo treino inteligente conforme perfil, meta, sexo, energia e histórico. " + ajuste;
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
      if (memoriaTreinoCache && memoriaTreinoCache.historico && memoriaTreinoCache.historico.length > 0 && letraTreino !== "descanso") ajuste += " Memória inteligente ativa: o app priorizou variações menos repetidas recentemente e usou seus registros anteriores para sugerir carga quando houver histórico do exercício.";
      if (mensagemCardioTreino) ajuste += mensagemCardioTreino;
      ajuste += " Lembrete: hidrate-se, respeite seus limites e evite treinar forte em jejum, com dor ou mal-estar.";

      document.getElementById("resultadoTreino").classList.remove("hidden");
      if (letraTreino === "descanso") document.getElementById("registroEvolucao").classList.add("hidden");
      else document.getElementById("registroEvolucao").classList.remove("hidden");
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
        const blocoSeries = exercicio.registravel === false ?
          "<span>Sugestão de recuperação — sem carga/repetições para registrar</span><br>" :
          "<span>" + exercicio.series + " | " + exercicio.reps + "</span><br>";
        const sugestaoCargaHtml = exercicio.registravel === false ? "" : "<div class='alerta'>" + obterTextoSugestaoCarga(exercicio.nome) + "</div>";
        const botaoRegistrarHtml = exercicio.registravel === false ? "" : "<button type='button' class='botao-secundario' onclick='preencherRegistroComExercicio(" + index + ")'>Registrar este exercício</button>";
        const botaoSubstituirHtml = exercicio.registravel === false ? "" : "<button type='button' class='botao-secundario' onclick='substituirExercicio(" + index + ")'>Não tenho esse equipamento / substituir</button>";
        div.innerHTML = "<strong>" + exercicio.nome + "</strong>" +
          blocoSeries +
          "<span class='tag'>Grupo: " + exercicio.grupo + "</span> " +
          "<span class='tag'>Equipamento: " + exercicio.equipamento + "</span>" +
          sugestaoCargaHtml +
          "<h4>Como fazer:</h4><ol>" + passosHTML + "</ol>" +
          "<div class='aviso-video'>Use o vídeo apenas como apoio. Em caso de dor, pare o exercício.</div>" +
          "<button type='button' class='botao-secundario' onclick='abrirVideoExercicio(" + JSON.stringify(exercicio.nome) + ")'>Ver execução</button>" +
          "<label class='check-exercicio'><input type='checkbox' " + marcado + " onchange='marcarExercicioConcluido(" + index + ", this.checked)'>Exercício concluído</label>" +
          "<div class='acoes-exercicio-grid'>" +
          botaoRegistrarHtml +
          botaoSubstituirHtml +
          "<button type='button' class='botao-pular' onclick='pularExercicio(" + index + ")'>Pular este exercício</button>" +
          "</div>";
        lista.appendChild(div);
      });
      if (perfilUsuario && perfilUsuario.localTreino === "sem_equipamento" && perfilUsuario.metaPrincipal === "perder_peso") {
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
      if (concluido) {
        setTimeout(function() {
          const todosConcluidos = exerciciosConcluidos.length > 0 && exerciciosConcluidos.every(function(item) { return item === true; });
          const alvo = todosConcluidos ? document.getElementById("progressoExercicios") : document.getElementById("registroEvolucao");
          if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      }
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

    function obterSubstituicoesCompativeis(index) {
      const exercicioAtual = treinoAtual[index];
      const categoriaAtual = normalizarCategoriaTreino(treinoAtual.categoria || treinoAtual.letra || categoriaDoGrupoExercicio(exercicioAtual.grupo));
      const localOriginal = perfilUsuario ? perfilUsuario.localTreino : "academia_grande";
      const local = localOriginal === "academia_basica" ? "academia_pequena" : localOriginal;
      const nomesAtuais = treinoAtual.map(function(exercicio, i) {
        return i === index ? "" : normalizarNomeExercicio(exercicio.nome || "");
      });
      const candidatos = obterBaseTreinoPorCategoria(categoriaAtual).filter(function(exercicio) {
        if (!exercicioPertenceCategoria(exercicio, categoriaAtual)) return false;
        if (exercicio.grupo !== exercicioAtual.grupo) return false;
        if (exercicio.local && !exercicio.local.includes(local)) return false;
        if (nomesAtuais.includes(normalizarNomeExercicio(exercicio.nome || ""))) return false;
        if (normalizarNomeExercicio(exercicio.nome || "") === normalizarNomeExercicio(exercicioAtual.nome || "")) return false;
        return true;
      });

      if (candidatos.length > 0) return filtrarExerciciosUnicos(candidatos).slice(0, 6);

      return obterBaseTreinoPorCategoria(categoriaAtual).filter(function(exercicio) {
        if (!exercicioPertenceCategoria(exercicio, categoriaAtual)) return false;
        if (exercicio.local && !exercicio.local.includes(local)) return false;
        if (nomesAtuais.includes(normalizarNomeExercicio(exercicio.nome || ""))) return false;
        if (normalizarNomeExercicio(exercicio.nome || "") === normalizarNomeExercicio(exercicioAtual.nome || "")) return false;
        return true;
      }).slice(0, 6);
    }

    function substituirExercicio(index) {
      const exercicioAtual = treinoAtual[index];
      if (!exercicioAtual) return;
      if (treinoAtual.categoria === "descanso" || exercicioAtual.registravel === false) {
        alert("Recuperação é apenas uma sugestão informativa, sem troca por exercício de carga/repetições.");
        return;
      }

      const opcoes = obterSubstituicoesCompativeis(index);
      if (!opcoes || opcoes.length === 0) {
        alert("Ainda não há substituições compatíveis sem repetir exercícios da lista. Você pode pular este exercício e seguir o treino.");
        return;
      }

      let textoOpcoes = "Escolha uma substituição compatível:\n\n";
      opcoes.forEach(function(opcao, i) { textoOpcoes += (i + 1) + " - " + opcao.nome + " (" + opcao.grupo + ")\n"; });
      const numero = Number(prompt(textoOpcoes + "\nDigite o número da opção:"));
      if (numero < 1 || numero > opcoes.length) { alert("Opção inválida."); return; }

      const escolhido = Object.assign({}, opcoes[numero - 1]);
      escolhido.series = exercicioAtual.series || escolhido.series;
      escolhido.reps = exercicioAtual.reps || escolhido.reps;
      treinoAtual[index] = escolhido;
      exerciciosConcluidos[index] = false;
      salvarTreinoAtualLocal();
      mostrarTreinoNaTela();
    }

    function normalizarNomeExercicio(nome) { return nome.trim().toLowerCase(); }

    function buscarSugestoesDeCarga(treino) {
      const mapa = {};
      if (!treino || !memoriaTreinoCache || !memoriaTreinoCache.sugestoes) return mapa;
      treino.forEach(function(exercicio) {
        const sugestao = memoriaTreinoCache.sugestoes[normalizarNomeExercicio(exercicio.nome || "")];
        if (sugestao) mapa[exercicio.nome] = sugestao;
      });
      return mapa;
    }

    function obterTextoSugestaoCarga(nomeExercicio) {
      const sugestao = sugestoesCarga[nomeExercicio];
      if (!sugestao) return "Carga sugerida: ainda sem histórico para este exercício.";
      return "Última carga: " + sugestao.ultimaCarga + " kg" + (sugestao.reps ? " x " + sugestao.reps + " reps" : "") + " em " + sugestao.data + ". Sugestão para hoje: " + sugestao.cargaSugerida + " kg. " + sugestao.motivo;
    }

    function preencherRegistroComExercicio(index) {
      const exercicio = treinoAtual[index];
      document.getElementById("exercicioRegistro").value = exercicio.nome;
      const sugestao = sugestoesCarga[exercicio.nome];
      if (sugestao) document.getElementById("carga").value = sugestao.cargaSugerida;
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

    function salvarTreinoFeito() {
      if (!acessoLiberado || !usuarioAtual || !db) {
        alert("Faça login com um e-mail autorizado para salvar o treino na nuvem.");
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

      db.collection("usuarios").doc(usuarioAtual.uid).collection("treinos").add(treinoSalvo)
        .then(function() {
          alert("Treino salvo na nuvem.");
          mostrarHistorico();
          document.getElementById("carga").value = "";
          document.getElementById("reps").value = "";
          document.getElementById("sensacao").value = "normal";
          document.getElementById("observacaoTreino").value = "";
          const resultadoEvolucao = document.getElementById("resultadoEvolucao");
          if (resultadoEvolucao) resultadoEvolucao.innerText = "";
          mensagemEvolucaoAtual = "";
          const proximoIndex = exerciciosConcluidos.findIndex(function(item) { return item !== true; });
          const alvo = proximoIndex >= 0 ? document.getElementById("cardExercicio" + proximoIndex) : document.getElementById("resultadoTreino");
          if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
        })
        .catch(function(erro) { console.log("Erro ao salvar treino na nuvem:", erro); alert("Não foi possível salvar o treino na nuvem. Confira sua conexão e tente novamente."); });
    }



    function inicioDoDia(ts) { const d = new Date(Number(ts || 0)); d.setHours(0,0,0,0); return d.getTime(); }
    function contarSequenciaDias(itens) { const dias = Array.from(new Set((itens||[]).filter(i=>i&&i.criadoEm).map(i=>inicioDoDia(i.criadoEm)))).sort((a,b)=>b-a); if(!dias.length) return 0; let seq=1; for(let i=1;i<dias.length;i++){ const diff=Math.round((dias[i-1]-dias[i])/86400000); if(diff===1) seq++; else if(diff>1) break; } return seq; }
    function contarDiasAtivosNoMes(itens) { const h=new Date(); return new Set((itens||[]).filter(i=>{ if(!i||!i.criadoEm) return false; const d=new Date(Number(i.criadoEm)); return d.getMonth()===h.getMonth()&&d.getFullYear()===h.getFullYear(); }).map(i=>inicioDoDia(i.criadoEm))).size; }
    function obterPesoInicialAtual() { try { const pesos=JSON.parse(localStorage.getItem("historicoPeso")||"[]"); if(Array.isArray(pesos)&&pesos.length>=2) return {inicial:Number(pesos[0].peso||0), atual:Number(pesos[pesos.length-1].peso||0)}; } catch(e){} return {inicial:perfilUsuario?Number(perfilUsuario.peso||0):0, atual:perfilUsuario?Number(perfilUsuario.peso||0):0}; }
    function montarConquistas(treinos, cardios) {
      treinos=treinos||[]; cardios=(cardios||[]).filter(c=>!(c.tipo==="sem_cardio"||c.tipo==="sem_corrida"));
      const agora=new Date(); const mesmoMes=i=>{ if(!i||!i.criadoEm) return false; const d=new Date(Number(i.criadoEm)); return d.getMonth()===agora.getMonth()&&d.getFullYear()===agora.getFullYear(); };
      const treinosMes=treinos.filter(mesmoMes), cardiosMes=cardios.filter(mesmoMes), ativosMes=treinosMes.concat(cardiosMes);
      const exerciciosUnicos=new Set(); treinos.forEach(t=>(t.exercicios||[]).forEach(e=>{ if(e) exerciciosUnicos.add(normalizarNomeExercicio(e)); }));
      const distanciaTotal=cardios.reduce((s,c)=>s+Number(c.distancia||0),0), tempoTotal=cardios.reduce((s,c)=>s+Number(c.tempo||0),0);
      const distanciaMes=cardiosMes.reduce((s,c)=>s+Number(c.distancia||0),0), tempoMes=cardiosMes.reduce((s,c)=>s+Number(c.tempo||0),0);
      const cargaTotal=treinos.reduce((s,t)=>s+Number(t.carga||0),0);
      const cargaInicial={}, cargaMax={}; treinos.slice().sort((a,b)=>Number(a.criadoEm||0)-Number(b.criadoEm||0)).forEach(t=>{ const nome=normalizarNomeExercicio(t.exercicioRegistro||""); const carga=Number(t.carga||0); if(!nome) return; if(cargaInicial[nome]===undefined) cargaInicial[nome]=carga; cargaMax[nome]=Math.max(cargaMax[nome]||0,carga); });
      const evolucoes=Object.keys(cargaMax).map(n=>cargaMax[n]-(cargaInicial[n]||0)); const maiorEvolucao=Math.max(0,...evolucoes);
      const peso=obterPesoInicialAtual(); const perdaPeso=(peso.inicial>0&&peso.atual>0)?peso.inicial-peso.atual:0;
      const treinosPerfeitos=treinos.filter(t=>Number(t.totalExercicios||0)>0&&Number(t.totalConcluidos||0)>=Number(t.totalExercicios||0)).length;
      const semanaAtualTreinos=treinos.filter(t=>t.criadoEm&&(Date.now()-Number(t.criadoEm))<=7*86400000).length; const semanaAtualCardios=cardios.filter(c=>c.criadoEm&&(Date.now()-Number(c.criadoEm))<=7*86400000).length;
      const treinouCansado=treinos.some(t=>String(t.observacao||"").toLowerCase().includes("cans")||String(t.feedbackFinalTreino||"").toLowerCase().includes("dificil"));
      const diasAtivos=new Set(treinos.concat(cardios).map(i=>i.criadoEm?inicioDoDia(i.criadoEm):0).filter(Boolean)).size; const diasAtivosMes=new Set(ativosMes.map(i=>i.criadoEm?inicioDoDia(i.criadoEm):0).filter(Boolean)).size;
      const tipos=cardios.map(c=>String(c.tipo||c.modalidade||"").toLowerCase()); const temCaminhada=tipos.some(t=>t.includes("camin")), temBike=tipos.some(t=>t.includes("bike")||t.includes("bicic")), temCorrida=tipos.some(t=>t.includes("corr"));
      return [
        {cat:"🏋️ Treino",nome:"Primeiro treino concluído",desc:"Você registrou seu primeiro treino no app.",ok:treinos.length>=1},{cat:"🏋️ Treino",nome:"Ritmo inicial",desc:"5 treinos registrados no histórico.",ok:treinos.length>=5},{cat:"🏋️ Treino",nome:"Disciplina de aço",desc:"25 treinos registrados no histórico.",ok:treinos.length>=25},{cat:"🏋️ Treino",nome:"Atleta consistente",desc:"50 treinos registrados no histórico.",ok:treinos.length>=50},{cat:"🏋️ Treino",nome:"100 treinos realizados",desc:"Marca de atleta consistente: 100 treinos salvos.",ok:treinos.length>=100},{cat:"🏋️ Treino",nome:"Lenda do treino",desc:"200 treinos registrados no histórico.",ok:treinos.length>=200},{cat:"🏋️ Treino",nome:"Sequência de 3 dias",desc:"Três dias seguidos treinando.",ok:contarSequenciaDias(treinos)>=3},{cat:"🏋️ Treino",nome:"7 dias seguidos treinando",desc:"Sequência forte de consistência nos treinos.",ok:contarSequenciaDias(treinos)>=7},{cat:"🏋️ Treino",nome:"14 dias de disciplina",desc:"Duas semanas seguidas com treino registrado.",ok:contarSequenciaDias(treinos)>=14},{cat:"🏋️ Treino",nome:"Explorador de exercícios",desc:"10 exercícios diferentes feitos no histórico.",ok:exerciciosUnicos.size>=10},{cat:"🏋️ Treino",nome:"Variedade inteligente",desc:"20 exercícios diferentes feitos no histórico.",ok:exerciciosUnicos.size>=20},{cat:"🏋️ Treino",nome:"Treino perfeito",desc:"Todos os exercícios do treino foram concluídos.",ok:treinosPerfeitos>=1},{cat:"🏋️ Treino",nome:"Perfeccionista",desc:"10 treinos perfeitos concluídos.",ok:treinosPerfeitos>=10},
        {cat:"❤️ Cardio",nome:"Primeiro cardio registrado",desc:"Primeiro registro de caminhada, corrida ou bicicleta.",ok:cardios.length>=1},{cat:"❤️ Cardio",nome:"Coração ativo",desc:"5 cardios registrados.",ok:cardios.length>=5},{cat:"❤️ Cardio",nome:"Fôlego em dia",desc:"20 cardios registrados.",ok:cardios.length>=20},{cat:"❤️ Cardio",nome:"3 dias seguidos de cardio",desc:"Três dias consecutivos cuidando do coração.",ok:contarSequenciaDias(cardios)>=3},{cat:"❤️ Cardio",nome:"7 dias de cardio",desc:"Uma semana seguida com cardio registrado.",ok:contarSequenciaDias(cardios)>=7},{cat:"❤️ Cardio",nome:"10 km acumulados",desc:"Somou 10 km em cardio no histórico.",ok:distanciaTotal>=10},{cat:"❤️ Cardio",nome:"Maratonista do app",desc:"42 km acumulados em cardio.",ok:distanciaTotal>=42},{cat:"❤️ Cardio",nome:"100 km acumulados",desc:"Marca forte de distância total em cardio.",ok:distanciaTotal>=100},{cat:"❤️ Cardio",nome:"1 hora total de cardio",desc:"Acumulou 60 minutos de cardio.",ok:tempoTotal>=60},{cat:"❤️ Cardio",nome:"5 horas de cardio",desc:"Acumulou 300 minutos de cardio.",ok:tempoTotal>=300},{cat:"❤️ Cardio",nome:"Caminhante",desc:"Registrou caminhada no cardio.",ok:temCaminhada},{cat:"❤️ Cardio",nome:"Pedal ativo",desc:"Registrou bicicleta no cardio.",ok:temBike},{cat:"❤️ Cardio",nome:"Corredor iniciante",desc:"Registrou corrida no cardio.",ok:temCorrida},
        {cat:"🎯 Progresso",nome:"Primeira perda de peso",desc:"O peso atual ficou menor que o primeiro peso salvo.",ok:perdaPeso>0},{cat:"🎯 Progresso",nome:"-2 kg alcançados",desc:"Redução de 2 kg em relação ao primeiro peso salvo.",ok:perdaPeso>=2},{cat:"🎯 Progresso",nome:"-5 kg alcançados",desc:"Redução de 5 kg em relação ao primeiro peso salvo.",ok:perdaPeso>=5},{cat:"🎯 Progresso",nome:"Transformação forte",desc:"Redução de 10 kg em relação ao primeiro peso salvo.",ok:perdaPeso>=10},{cat:"🎯 Progresso",nome:"Primeira evolução de carga",desc:"Você já registrou carga maior que a primeira em algum exercício.",ok:maiorEvolucao>0},{cat:"🎯 Progresso",nome:"Evolução de carga",desc:"Você aumentou pelo menos 10 kg em algum exercício.",ok:maiorEvolucao>=10},{cat:"🎯 Progresso",nome:"Força em alta",desc:"Você aumentou pelo menos 20 kg em algum exercício.",ok:maiorEvolucao>=20},{cat:"🎯 Progresso",nome:"Volume acumulado",desc:"Somou 500 kg registrados em cargas.",ok:cargaTotal>=500},{cat:"🎯 Progresso",nome:"Consistência por 30 dias",desc:"Treinos ou cardios em 30 dias diferentes.",ok:diasAtivos>=30},
        {cat:"📅 Desafio mensal",nome:"Mês começou bem",desc:"3 dias ativos neste mês.",ok:diasAtivosMes>=3},{cat:"📅 Desafio mensal",nome:"Mês consistente",desc:"10 dias ativos neste mês.",ok:diasAtivosMes>=10},{cat:"📅 Desafio mensal",nome:"20 dias ativos no mês",desc:"Vinte dias com treino ou cardio no mês atual.",ok:diasAtivosMes>=20},{cat:"📅 Desafio mensal",nome:"8 treinos no mês",desc:"Oito treinos registrados no mês atual.",ok:treinosMes.length>=8},{cat:"📅 Desafio mensal",nome:"12 treinos no mês",desc:"Doze treinos registrados no mês atual.",ok:treinosMes.length>=12},{cat:"📅 Desafio mensal",nome:"10 km no mês",desc:"Somou 10 km em cardio no mês atual.",ok:distanciaMes>=10},{cat:"📅 Desafio mensal",nome:"2 horas de cardio no mês",desc:"Somou 120 minutos de cardio no mês atual.",ok:tempoMes>=120},
        {cat:"🧠 Especiais",nome:"Voltou após pausa",desc:"Você voltou a registrar depois de alguns dias parado.",ok:treinos.length>=2&&contarSequenciaDias(treinos)<2},{cat:"🧠 Especiais",nome:"Treinou mesmo cansado",desc:"Você manteve o compromisso em um dia difícil.",ok:treinouCansado},{cat:"🧠 Especiais",nome:"Meta semanal cumprida",desc:"Pelo menos 3 treinos registrados nos últimos 7 dias.",ok:semanaAtualTreinos>=3},{cat:"🧠 Especiais",nome:"Semana equilibrada",desc:"Treino e cardio registrados na mesma semana.",ok:semanaAtualTreinos>=2&&semanaAtualCardios>=1},{cat:"🧠 Especiais",nome:"Sem desculpas",desc:"Registro ativo de treino e cardio na semana.",ok:semanaAtualTreinos>=1&&semanaAtualCardios>=1}
      ];
    }
    function renderizarCardConquista(c) { return "<div class='conquista-card "+(c.ok?"":"bloqueada")+"'><div class='conquista-trofeu'>"+(c.ok?"🏆":"🔒")+"</div><div><strong>"+limparTextoSeguro(c.nome)+"</strong><span class='tag'>"+limparTextoSeguro(c.cat)+"</span><p class='small'>"+limparTextoSeguro(c.desc)+"</p></div></div>"; }
    function carregarConquistas() { const resumo=document.getElementById("resumoConquistas"), ultimas=document.getElementById("ultimasConquistas"), todas=document.getElementById("todasConquistas"); if(resumo) resumo.innerHTML="Carregando conquistas..."; obterHistoricoDaNuvem(function(treinos){ obterCardiosDaNuvem(function(cardios){ const conquistas=montarConquistas(treinos,cardios); const desbloqueadas=conquistas.filter(c=>c.ok); if(resumo) resumo.innerHTML="🏆 "+desbloqueadas.length+" de "+conquistas.length+" conquistas desbloqueadas."; if(ultimas) ultimas.innerHTML=(desbloqueadas.length?desbloqueadas.slice(-3).reverse():conquistas.slice(0,3)).map(renderizarCardConquista).join(""); if(todas) todas.innerHTML=conquistas.map(renderizarCardConquista).join(""); }); }); }
    function alternarTodasConquistas() { const todas=document.getElementById("todasConquistas"), botao=document.getElementById("botaoVerTodasConquistas"); if(!todas) return; const abrir=todas.classList.contains("hidden"); todas.classList.toggle("hidden", !abrir); if(botao) botao.innerText=abrir?"Ocultar conquistas":"Ver todas as conquistas"; }

    function obterHistoricoDaNuvem(callback) {
      if (!acessoLiberado || !usuarioAtual || !db) { callback([]); return; }

      const limite90Dias = new Date().getTime() - (90 * 24 * 60 * 60 * 1000);

      db.collection("usuarios").doc(usuarioAtual.uid).collection("treinos").get()
        .then(function(snapshot) {
          const lista = [];
          snapshot.forEach(function(doc) {
            const item = doc.data();
            item._id = doc.id;
            if (!item.criadoEm || Number(item.criadoEm) >= limite90Dias) lista.push(item);
          });
          lista.sort(function(a, b) { return Number(b.criadoEm || 0) - Number(a.criadoEm || 0); });
          callback(lista);
        })
        .catch(function(erro) { console.log("Erro ao carregar histórico da nuvem:", erro); callback([]); });
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
      if (!listaHistorico) return;
      listaHistorico.innerHTML = "";

      if (!historico || historico.length === 0) { listaHistorico.innerHTML = "<p class='small'>Nenhum treino salvo na nuvem ainda.</p>"; return; }

      historico.slice(0, 3).forEach(function(item) {
        const div = document.createElement("div");
        div.className = "historico-item";
        div.innerHTML = "<strong>" + (item.data || "Sem data") + "</strong><br>" +
          "Treino: " + limparTextoSeguro(nomeAmigavelTreino(item.letraTreino || "")) + "<br>" +
          "Concluídos: " + (item.totalConcluidos || 0) + " de " + (item.totalExercicios || (item.exercicios ? item.exercicios.length : 0)) + " exercícios<br>" +
          "Registro principal: " + (item.exercicioRegistro || "Não informado") +
          "<br><button type='button' class='botao-secundario' onclick='irParaHistoricoCompleto()'>Ver detalhes</button>";
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

    function categoriaHistoricoTreino(item) {
      const bruto = item ? (item.letraTreino || item.divisaoTreino || item.categoriaTreino || "") : "";
      let cat = normalizarCategoriaTreino(String(bruto));
      if (["superior", "inferior", "core_abdomen", "descanso"].includes(cat)) return cat;

      const exercicios = (item && Array.isArray(item.exercicios)) ? item.exercicios.join(" ").toLowerCase() : "";
      const registro = String(item && item.exercicioRegistro ? item.exercicioRegistro : "").toLowerCase();
      const texto = exercicios + " " + registro;
      if (/agach|leg press|extensora|flexora|stiff|afundo|panturrilha|glute|p[eé]lvica|cadeira extensora|perna|inferior/.test(texto)) return "inferior";
      if (/prancha|abdom|core|dead bug|bird dog|lombar|russian|eleva[cç][aã]o de pernas/.test(texto)) return "core_abdomen";
      if (/supino|flex[aã]o|remada|puxada|rosca|tr[ií]ceps|b[ií]ceps|ombro|peito|costas|superior/.test(texto)) return "superior";
      if (/recupera|descanso|mobilidade|alongamento|caminhada leve|yoga|libera[cç][aã]o/.test(texto)) return "descanso";
      return "descanso";
    }

    function montarGraficosEvolucao(treinos, cardios) {
      treinos = treinos || [];
      cardios = (cardios || []).filter(function(item) { return item.tipo !== "sem_cardio" && item.tipo !== "sem_corrida"; });

      const mapaTreinos = { superior: 0, inferior: 0, core_abdomen: 0, descanso: 0 };
      treinos.forEach(function(item) {
        const categoria = categoriaHistoricoTreino(item);
        if (mapaTreinos[categoria] !== undefined) mapaTreinos[categoria]++;
        else mapaTreinos.descanso++;
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

      const maxTreino = Math.max(1, mapaTreinos.superior, mapaTreinos.inferior, mapaTreinos.core_abdomen, mapaTreinos.descanso);
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
        montarLinhaGrafico("Treino A - Superiores", mapaTreinos.superior, maxTreino, mapaTreinos.superior + " registro(s)") +
        montarLinhaGrafico("Treino B - Inferiores", mapaTreinos.inferior, maxTreino, mapaTreinos.inferior + " registro(s)") +
        montarLinhaGrafico("Treino C - Abdômen / core", mapaTreinos.core_abdomen, maxTreino, mapaTreinos.core_abdomen + " registro(s)") +
        montarLinhaGrafico("Treino leve / recuperação", mapaTreinos.descanso, maxTreino, mapaTreinos.descanso + " registro(s)") +
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

    function editarRegistroTreino(id, cargaAtual, repsAtual) {
      if (!acessoLiberado || !usuarioAtual || !db) {
        alert("Faça login para editar o histórico.");
        return;
      }
      if (!id) {
        alert("Não foi possível identificar este registro de treino.");
        return;
      }

      const novaCargaTexto = prompt("Editar carga usada (kg):", cargaAtual !== undefined && cargaAtual !== null && cargaAtual !== "" ? cargaAtual : "0");
      if (novaCargaTexto === null) return;
      const novaRepsTexto = prompt("Editar repetições:", repsAtual !== undefined && repsAtual !== null && repsAtual !== "" ? repsAtual : "1");
      if (novaRepsTexto === null) return;

      const novaCarga = Number(String(novaCargaTexto).replace(",", "."));
      const novasReps = Number(String(novaRepsTexto).replace(",", "."));
      if (isNaN(novaCarga) || novaCarga < 0 || isNaN(novasReps) || novasReps <= 0) {
        alert("Informe carga com 0 kg ou mais e repetições maiores que zero.");
        return;
      }

      db.collection("usuarios").doc(usuarioAtual.uid).collection("treinos").doc(id).update({
        carga: novaCarga,
        reps: novasReps,
        editadoEm: new Date().getTime()
      }).then(function() {
        alert("Registro de treino atualizado.");
        mostrarHistoricoCompleto();
        mostrarHistorico();
      }).catch(function(erro) {
        console.log("Erro ao editar treino:", erro);
        alert("Não foi possível editar este treino agora.");
      });
    }

    function deletarRegistroTreino(id) {
      if (!acessoLiberado || !usuarioAtual || !db) {
        alert("Faça login para deletar o histórico.");
        return;
      }
      if (!id) {
        alert("Não foi possível identificar este registro de treino.");
        return;
      }
      if (!confirm("Tem certeza que deseja deletar este registro de treino?")) return;

      db.collection("usuarios").doc(usuarioAtual.uid).collection("treinos").doc(id).delete()
        .then(function() {
          alert("Registro de treino deletado.");
          mostrarHistoricoCompleto();
          mostrarHistorico();
        })
        .catch(function(erro) {
          console.log("Erro ao deletar treino:", erro);
          alert("Não foi possível deletar este treino agora.");
        });
    }

    function editarRegistroCardio(id, distanciaAtual, tempoAtual) {
      if (!acessoLiberado || !usuarioAtual || !db) {
        alert("Faça login para editar o histórico.");
        return;
      }
      if (!id) {
        alert("Não foi possível identificar este registro de cardio.");
        return;
      }

      const novaDistanciaTexto = prompt("Editar distância (km):", distanciaAtual !== undefined && distanciaAtual !== null && distanciaAtual !== "" ? distanciaAtual : "0");
      if (novaDistanciaTexto === null) return;
      const novoTempoTexto = prompt("Editar tempo (min):", tempoAtual !== undefined && tempoAtual !== null && tempoAtual !== "" ? tempoAtual : "1");
      if (novoTempoTexto === null) return;

      const novaDistancia = Number(String(novaDistanciaTexto).replace(",", "."));
      const novoTempo = Number(String(novoTempoTexto).replace(",", "."));
      if (isNaN(novaDistancia) || novaDistancia < 0 || isNaN(novoTempo) || novoTempo <= 0) {
        alert("Informe distância com 0 km ou mais e tempo maior que zero.");
        return;
      }

      db.collection("usuarios").doc(usuarioAtual.uid).collection("corridas").doc(id).update({
        distancia: novaDistancia,
        tempo: novoTempo,
        editadoEm: new Date().getTime()
      }).then(function() {
        alert("Registro de cardio atualizado.");
        mostrarHistoricoCompleto();
        carregarCardios();
      }).catch(function(erro) {
        console.log("Erro ao editar cardio:", erro);
        alert("Não foi possível editar este cardio agora.");
      });
    }

    function deletarRegistroCardio(id) {
      if (!acessoLiberado || !usuarioAtual || !db) {
        alert("Faça login para deletar o histórico.");
        return;
      }
      if (!id) {
        alert("Não foi possível identificar este registro de cardio.");
        return;
      }
      if (!confirm("Tem certeza que deseja deletar este registro de cardio?")) return;

      db.collection("usuarios").doc(usuarioAtual.uid).collection("corridas").doc(id).delete()
        .then(function() {
          alert("Registro de cardio deletado.");
          mostrarHistoricoCompleto();
          carregarCardios();
        })
        .catch(function(erro) {
          console.log("Erro ao deletar cardio:", erro);
          alert("Não foi possível deletar este cardio agora.");
        });
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
        (item._id ? "<br><br><button type='button' class='botao-secundario' onclick='editarRegistroTreino(" + JSON.stringify(item._id) + ", " + JSON.stringify(item.carga || 0) + ", " + JSON.stringify(item.reps || 0) + ")'>Editar</button> " +
        "<button type='button' class='botao-secundario' onclick='deletarRegistroTreino(" + JSON.stringify(item._id) + ")'>Deletar</button>" : "") +
      "</div>";
    }

    function montarCardCardioHistorico(item) {
      if (item.tipo === "sem_cardio" || item.tipo === "sem_corrida") {
        return "<div class='historico-item'>" +
          "<strong>🏃 " + limparTextoSeguro(item.data || "Sem data") + "</strong><br>" +
          "Status: não fez cardio recentemente<br>" +
          "Observação: " + limparTextoSeguro(item.observacao || "Nenhuma") +
          (item._id ? "<br><br><button type='button' class='botao-secundario' onclick='deletarRegistroCardio(" + JSON.stringify(item._id) + ")'>Deletar</button>" : "") +
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
        (item._id ? "<br><br><button type='button' class='botao-secundario' onclick='editarRegistroCardio(" + JSON.stringify(item._id) + ", " + JSON.stringify(item.distancia || 0) + ", " + JSON.stringify(item.tempo || 0) + ")'>Editar</button> " +
        "<button type='button' class='botao-secundario' onclick='deletarRegistroCardio(" + JSON.stringify(item._id) + ")'>Deletar</button>" : "") +
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


    function montarMemoriaInteligenteAluno(treinos, cardios) {
      treinos = treinos || [];
      cardios = cardios || [];
      const cargas = {};
      treinos.forEach(function(t) {
        const nome = t.exercicioRegistro || "Exercício principal";
        if (!cargas[nome]) cargas[nome] = [];
        if (t.carga !== undefined && t.carga !== "") cargas[nome].push(Number(t.carga || 0));
      });
      const exercicios = Object.keys(cargas);
      const ultimo = treinos[0];
      const totalAtividades = treinos.length + cardios.filter(function(c){ return c.tipo !== "sem_cardio" && c.tipo !== "sem_corrida"; }).length;
      let resumo = "A memória ainda está aprendendo. Salve carga, repetições, sensação e observações para melhorar as sugestões.";
      if (totalAtividades >= 3) {
        resumo = "Memória ativa: " + totalAtividades + " registros analisados. ";
        if (ultimo && ultimo.sensacao === "dificil") resumo += "Último treino difícil: o app tende a sugerir evolução mais conservadora. ";
        else if (ultimo && ultimo.sensacao === "facil") resumo += "Último treino fácil: há espaço para evoluir carga aos poucos. ";
        else resumo += "Mantenha constância para o app reconhecer melhor seu padrão. ";
      }
      let linhas = "";
      exercicios.slice(0, 4).forEach(function(nome) {
        const lista = cargas[nome].filter(function(v){ return !isNaN(v); });
        if (!lista.length) return;
        linhas += "<br>• " + limparTextoSeguro(nome) + ": última carga registrada " + lista[0] + " kg";
      });
      return "<div class='historico-item'><strong>🧠 Memória inteligente do aluno</strong><br>" + resumo + linhas + "<br><span class='small'>Quanto mais treinos salvos, melhores ficam as sugestões de carga, volume e recuperação.</span></div>";
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
      listaHistoricoCompleto.innerHTML += montarMemoriaInteligenteAluno(treinos, cardios);

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

        calendarioHTML += "</div><div id='detalheDiaHistorico' class='detalhe-dia-historico'></div>";
        calendarioBox.innerHTML = calendarioHTML;
        listaHistoricoCompleto.appendChild(calendarioBox);
        window.__metatreinoMapaHistorico = mapaDias;
        renderizarDetalheDiaHistorico(diasOrdenados[0], mapaDias);
      }

      const avisoCalendario = document.createElement("div");
      avisoCalendario.className = "alerta";
      avisoCalendario.innerHTML = "<strong>Histórico organizado por data</strong><br><span class='small'>A lista geral foi removida para deixar a tela mais leve. Toque na data do calendário para abrir os detalhes.</span>";
      listaHistoricoCompleto.appendChild(avisoCalendario);

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
      atualizarBotoesLogin(usuarioAtual);
    };
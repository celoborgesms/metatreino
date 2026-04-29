const fs=require('fs');let s=fs.readFileSync('js/app.js','utf8');
// saveTreinoFeito guard
s=s.replace(`      if (!acessoLiberado || !usuarioAtual || !db) {
        alert("Faça login com um e-mail autorizado para salvar o treino na nuvem.");
        return;
      }`,`      if (!acessoLiberado || !usuarioAtual) {
        alert("Faça login com um e-mail autorizado para salvar o treino.");
        return;
      }`);
// saveTreinoFeito cloud add block
s=s.replace(`      db.collection("usuarios").doc(usuarioAtual.uid).collection("treinos").add(treinoSalvo)
        .then(function() {
          salvarUltimoTreinoLocal(treinoSalvo);
          alert("Treino salvo na nuvem.");
          mostrarHistorico();
          rolarParaProximoExercicioPendente();
        })
        .catch(function(erro) { console.log("Erro ao salvar treino na nuvem:", erro); alert("Não foi possível salvar o treino na nuvem. Confira sua conexão e tente novamente."); });`,`      if (!navigator.onLine || !db || usuarioAtual.offline) {
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
        .catch(function(erro) { console.log("Erro ao salvar treino na nuvem:", erro); salvarTreinoPendenteOffline(treinoSalvo); });`);
// obterHistorico
s=s.replace(`    function obterHistoricoDaNuvem(callback) {
      if (!acessoLiberado || !usuarioAtual || !db) { callback([]); return; }`,`    function obterHistoricoDaNuvem(callback) {
      if (!acessoLiberado || !usuarioAtual) { callback([]); return; }
      if (!navigator.onLine || !db || usuarioAtual.offline) { callback(mesclarPendentesOffline("treinos", [])); return; }`);
s=s.replace(`          callback(lista);
        })
        .catch(function(erro) { console.log("Erro ao carregar histórico da nuvem:", erro); callback([]); });`,`          callback(mesclarPendentesOffline("treinos", lista));
        })
        .catch(function(erro) { console.log("Erro ao carregar histórico da nuvem:", erro); callback(mesclarPendentesOffline("treinos", [])); });`);
// cardios guard
s=s.replace(`      if (!acessoLiberado || !usuarioAtual || !db) {
        alert("Faça login com um e-mail autorizado para salvar atividades de cardio.");
        return;
      }`,`      if (!acessoLiberado || !usuarioAtual) {
        alert("Faça login com um e-mail autorizado para salvar atividades de cardio.");
        return;
      }`);
// sem cardio block
s=s.replace(`        db.collection("usuarios").doc(usuarioAtual.uid).collection("corridas").add(registroSemCardio)
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
            if (caixa) {
              caixa.className = "alerta alerta-aviso";
              caixa.innerHTML = "Não foi possível salvar o registro agora. Confira sua conexão e tente novamente.";
            }
          });`,`        if (!navigator.onLine || !db || usuarioAtual.offline) {
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
          });`);
// cardio add block
s=s.replace(`      db.collection("usuarios").doc(usuarioAtual.uid).collection("corridas").add(corrida)
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
        });`,`      if (!navigator.onLine || !db || usuarioAtual.offline) {
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
        });`);
// obterCardios (specific)
s=s.replace(`    function obterCardiosDaNuvem(callback) {
      if (!acessoLiberado || !usuarioAtual || !db) { callback([]); return; }`,`    function obterCardiosDaNuvem(callback) {
      if (!acessoLiberado || !usuarioAtual) { callback([]); return; }
      if (!navigator.onLine || !db || usuarioAtual.offline) { callback(mesclarPendentesOffline("cardios", [])); return; }`);
s=s.replace(`          callback(lista);
        })
        .catch(function(erro) { console.log("Erro ao carregar cardios:", erro); callback([]); });`,`          callback(mesclarPendentesOffline("cardios", lista));
        })
        .catch(function(erro) { console.log("Erro ao carregar cardios:", erro); callback(mesclarPendentesOffline("cardios", [])); });`);
// pending badge in summary
s=s.replace(`          "Registro principal: " + (item.exercicioRegistro || "Não informado") +
          "<br><button type='button' class='botao-secundario' onclick='irParaHistoricoCompleto()'>Ver detalhes</button>" +`,`          "Registro principal: " + (item.exercicioRegistro || "Não informado") +
          (item.__offlinePendente ? "<br><span class='tag'>Pendente de sincronizar</span>" : "") +
          "<br><button type='button' class='botao-secundario' onclick='irParaHistoricoCompleto()'>Ver detalhes</button>" +`);
fs.writeFileSync('js/app.js',s);

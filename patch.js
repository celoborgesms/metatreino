const fs = require('fs');
const p = '/mnt/data/work140/js/app.js';
let s = fs.readFileSync(p,'utf8');
// Insert helpers after montarResumoDoDia
const marker = `    function obterMensagemInteligente(energia, letraTreino, progressaoSemanal) {`;
const helpers = `
    function obterDoresSelecionadas() {
      const campo = document.getElementById("dor");
      if (!campo) return ["nenhuma"];
      let valores = [];
      if (campo.multiple && campo.options) {
        valores = Array.prototype.slice.call(campo.options).filter(function(opcao) { return opcao.selected; }).map(function(opcao) { return opcao.value; });
      } else {
        valores = [campo.value || "nenhuma"];
      }
      valores = valores.filter(function(valor) { return valor && valor !== "nenhuma"; });
      return valores.length ? valores : ["nenhuma"];
    }

    function temDorSelecionada(dores, valor) {
      const lista = Array.isArray(dores) ? dores : [dores || "nenhuma"];
      return lista.indexOf(valor) !== -1;
    }

    function textoDoresSelecionadas(dores) {
      const lista = Array.isArray(dores) ? dores : [dores || "nenhuma"];
      const nomes = { pernas: "pernas", bracos: "braços", coluna: "coluna/costas", ombro: "ombro", joelho: "joelho", lombar: "lombar" };
      const filtrada = lista.filter(function(valor) { return valor && valor !== "nenhuma"; });
      if (!filtrada.length) return "nenhuma dor";
      return filtrada.map(function(valor) { return nomes[valor] || valor; }).join(", ");
    }

    function grupoCompativelComTreino(letraTreino, exercicio) {
      if (!exercicio) return false;
      const grupo = exercicio.grupo || "";
      if (letraTreino === "descanso" || letraTreino === "Descanso") return grupo === "Recuperação";
      if (letraTreino === "A") return ["Peito", "Ombros", "Tríceps"].indexOf(grupo) !== -1;
      if (letraTreino === "B") return ["Costas", "Bíceps", "Ombro posterior"].indexOf(grupo) !== -1;
      if (letraTreino === "C") return ["Pernas", "Quadríceps", "Glúteos", "Panturrilha", "Posterior de coxa", "Abdômen", "Cardio/Abdômen"].indexOf(grupo) !== -1;
      return true;
    }

    function aplicarTravaGrupoTreino(lista, letraTreino) {
      return (lista || []).filter(function(exercicio) { return grupoCompativelComTreino(letraTreino, exercicio); });
    }

`;
if (!s.includes('function obterDoresSelecionadas()')) s = s.replace(marker, helpers + marker);
// gerarTreino get dor
s = s.replace('      const dor = document.getElementById("dor").value;\n      const tempo = document.getElementById("tempo").value;', '      const doresSelecionadas = obterDoresSelecionadas();\n      const dor = doresSelecionadas[0] || "nenhuma";\n      const tempo = document.getElementById("tempo").value;');
// dorBloqueiaGrupo block
const oldBlock = `      const dorBloqueiaGrupo = function(exercicio) {
        if (dor === "pernas" && ["Pernas", "Glúteos", "Panturrilha", "Posterior de coxa"].includes(exercicio.grupo)) return true;
        if (dor === "bracos" && ["Bíceps", "Tríceps", "Peito", "Ombros"].includes(exercicio.grupo)) return true;
        if (dor === "coluna" && (exercicio.evitar === "lombar" || exercicio.grupo === "Costas" || exercicio.grupo === "Abdômen")) return true;
        return exercicio.evitar === dor;
      };`;
const newBlock = `      const dorBloqueiaGrupo = function(exercicio) {
        if (temDorSelecionada(doresSelecionadas, "pernas") && ["Pernas", "Quadríceps", "Glúteos", "Panturrilha", "Posterior de coxa"].includes(exercicio.grupo)) return true;
        if (temDorSelecionada(doresSelecionadas, "bracos") && ["Bíceps", "Tríceps", "Peito", "Ombros", "Ombro posterior"].includes(exercicio.grupo)) return true;
        if (temDorSelecionada(doresSelecionadas, "coluna") && (exercicio.evitar === "lombar" || exercicio.grupo === "Costas" || exercicio.grupo === "Abdômen" || exercicio.grupo === "Cardio/Abdômen")) return true;
        if (temDorSelecionada(doresSelecionadas, "ombro") && (exercicio.evitar === "ombro" || ["Peito", "Ombros", "Ombro posterior", "Costas"].includes(exercicio.grupo))) return true;
        if (temDorSelecionada(doresSelecionadas, "joelho") && (exercicio.evitar === "joelho" || ["Pernas", "Quadríceps", "Glúteos", "Panturrilha", "Posterior de coxa"].includes(exercicio.grupo))) return true;
        if (temDorSelecionada(doresSelecionadas, "lombar") && (exercicio.evitar === "lombar" || ["Costas", "Abdômen", "Cardio/Abdômen", "Posterior de coxa"].includes(exercicio.grupo))) return true;
        return doresSelecionadas.some(function(itemDor) { return itemDor !== "nenhuma" && exercicio.evitar === itemDor; });
      };`;
s = s.replace(oldBlock, newBlock);
// Inject group filters after filtering lines
s = s.replace('      treinoFiltrado = filtrarExerciciosUnicos(treinoFiltrado);', '      treinoFiltrado = aplicarTravaGrupoTreino(filtrarExerciciosUnicos(treinoFiltrado), letraTreino);');
s = s.replace('      treinoFiltrado = adaptarTreinoPorPerfil(treinoFiltrado, tempo);', '      treinoFiltrado = aplicarTravaGrupoTreino(adaptarTreinoPorPerfil(treinoFiltrado, tempo), letraTreino);');
s = s.replace('      treinoFiltrado = ajustarTreinoPorSexoIdadePesoCheckin(treinoFiltrado, energia, dor, tempo);', '      treinoFiltrado = aplicarTravaGrupoTreino(ajustarTreinoPorSexoIdadePesoCheckin(treinoFiltrado, energia, doresSelecionadas, tempo), letraTreino);');
s = s.replace('      treinoFiltrado = aplicarProgressaoSemanalAoTreino(treinoFiltrado, progressaoSemanal, tempo, letraTreino);', '      treinoFiltrado = aplicarTravaGrupoTreino(aplicarProgressaoSemanalAoTreino(treinoFiltrado, progressaoSemanal, tempo, letraTreino), letraTreino);');
s = s.replace('      treinoFiltrado = treinoFiltrado.filter(equipamentoCompativelComPerfil);', '      treinoFiltrado = aplicarTravaGrupoTreino(treinoFiltrado.filter(equipamentoCompativelComPerfil), letraTreino);');
s = s.replace('      // Trava final por categoria antes de exibir.\n      treinoFiltrado = treinoFiltrado.filter(equipamentoCompativelComPerfil);', '      // Trava final por categoria antes de exibir.\n      treinoFiltrado = aplicarTravaGrupoTreino(treinoFiltrado.filter(equipamentoCompativelComPerfil), letraTreino);');
// fix pain text condition
s = s.replace('      if (dor !== "nenhuma" && letraTreino !== "descanso") ajuste += " Exercícios que podem incomodar sua dor foram removidos.";', '      if (doresSelecionadas.some(function(itemDor) { return itemDor !== "nenhuma"; }) && letraTreino !== "descanso") ajuste += " Exercícios que podem incomodar sua dor (" + textoDoresSelecionadas(doresSelecionadas) + ") foram removidos.";');
// Patch ajustar function to handle arrays
s = s.replace('        if (dor !== "nenhuma") {\n          copia.observacao = (copia.observacao ? copia.observacao + " " : "") + "Faça sem dor e reduza carga se sentir desconforto.";\n        }', '        const doresAjuste = Array.isArray(dor) ? dor : [dor || "nenhuma"];\n        if (doresAjuste.some(function(itemDor) { return itemDor !== "nenhuma"; })) {\n          copia.observacao = (copia.observacao ? copia.observacao + " " : "") + "Faça sem dor e reduza carga se sentir desconforto.";\n        }');
// Patch final completar function one-liner to use multi/pain and group
const oldFinal = `function completarTreinoSemEquipamento(lista, letraTreino, dor, tempo) { const alvo = alvoQuantidadeExercicios(tempo, determinarPerfilTreino()); const base = (bibliotecaExercicios[letraTreino] || []).filter(function(exercicio) { return equipamentoCompativelComPerfil(exercicio) && exercicio.evitar !== dor; }); const nomes = {}; (lista || []).forEach(function(exercicio) { nomes[normalizarNomeExercicio(exercicio.nome || "")] = true; }); base.forEach(function(exercicio) { if (lista.length >= alvo) return; const chave = normalizarNomeExercicio(exercicio.nome || ""); if (!nomes[chave]) { lista.push(Object.assign({}, exercicio)); nomes[chave] = true; } }); return lista; }`;
const newFinal = `function completarTreinoSemEquipamento(lista, letraTreino, dor, tempo) { const dores = Array.isArray(dor) ? dor : [dor || "nenhuma"]; const alvo = alvoQuantidadeExercicios(tempo, determinarPerfilTreino()); const base = (bibliotecaExercicios[letraTreino] || []).filter(function(exercicio) { return equipamentoCompativelComPerfil(exercicio) && grupoCompativelComTreino(letraTreino, exercicio) && !dores.some(function(itemDor) { return itemDor !== "nenhuma" && exercicio.evitar === itemDor; }); }); const nomes = {}; (lista || []).forEach(function(exercicio) { nomes[normalizarNomeExercicio(exercicio.nome || "")] = true; }); base.forEach(function(exercicio) { if (lista.length >= alvo) return; const chave = normalizarNomeExercicio(exercicio.nome || ""); if (!nomes[chave]) { lista.push(Object.assign({}, exercicio)); nomes[chave] = true; } }); return aplicarTravaGrupoTreino(lista, letraTreino); }`;
s = s.replace(oldFinal, newFinal);
fs.writeFileSync(p,s);
console.log('[OK] patched app.js');

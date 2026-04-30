// Testes automáticos MetaTreino 1.4.2
// Execute localmente com: node tests/metatreino-tests.js

function norm(v){ return String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); }
function contem(texto, termos){ return termos.some(function(t){ return texto.indexOf(t) >= 0; }); }
function tipoPorNome(nome){
  const n = norm(nome);
  if (contem(n, ["supino", "flexao", "flexão", "peito", "peitoral", "crucifixo no chao", "crucifixo no chão", "crucifixo reto", "crucifixo inclinado", "voador peito", "voador peitoral", "triceps", "tríceps", "frances", "francês", "testa", "mergulho", "corda triceps", "coice triceps", "desenvolvimento", "shoulder press", "elevacao lateral", "elevação lateral", "elevacao frontal", "elevação frontal", "pike push"])) return "A";
  if (contem(n, ["face pull", "puxada", "pulldown", "remada", "barra fixa", "pull up", "chin up", "serrote", "pullover", "crucifixo inverso", "voador inverso", "rosca", "biceps", "bíceps", "martelo", "costas", "dorsal", "ombro posterior", "posterior de ombro", "trapezio", "trapézio"])) return "B";
  if (contem(n, ["agach", "leg press", "afundo", "passada", "avanco", "avanço", "bulgar", "stiff", "terra", "levantamento terra", "cadeira extensora", "extensora", "mesa flexora", "flexora", "panturrilha", "gemeos", "gêmeos", "gluteo", "glúteo", "quadriceps", "quadríceps", "posterior de coxa", "perna", "pernas", "adutor", "abdutor", "cadeira abdutora", "cadeira adutora", "abdominal", "abdomen", "abdômen", "prancha", "core", "mountain climber", "dead bug", "infra", "supra", "elevacao pelvica", "elevação pélvica", "ponte de gluteo", "hip thrust"])) return "C";
  return "descanso";
}

const casos = [
  ["Tríceps francês com halter", "A"],
  ["Desenvolvimento com halteres", "A"],
  ["Supino com halteres", "A"],
  ["Flexão de braço", "A"],
  ["Crucifixo no chão", "A"],
  ["Face pull", "B"],
  ["Puxada alta frente na estação", "B"],
  ["Puxada baixa", "B"],
  ["Remada baixa", "B"],
  ["Rosca direta", "B"],
  ["Agachamento livre", "C"],
  ["Leg press", "C"],
  ["Cadeira extensora", "C"],
  ["Abdominal supra", "C"],
  ["Prancha", "C"]
];

let falhas = 0;
for (const [nome, esperado] of casos) {
  const obtido = tipoPorNome(nome);
  if (obtido !== esperado) {
    console.error(`FALHOU: ${nome} -> ${obtido}, esperado ${esperado}`);
    falhas++;
  }
}
if (falhas) process.exit(1);
console.log("Todos os testes de categoria 1.4.2 passaram.");

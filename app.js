// ===== MetaTreino v12.45 =====
const APP_VERSION = 'v12.45';
const DATA_PREFIX = 'metatreino_cache_'; // cache local (fallback offline), agora indexado por UID do Google
const ADMIN_EMAIL = 'celoborgesms@gmail.com';

/* ═══ CONVENÇÃO DE ÍCONES (siga isto ao criar recurso novo) ═══
   MÓDULOS      🏋️ musculação · 🏃 corrida · 🚴 bike · 🚶 caminhada
   ESTADOS      ✅ concluído · 😴 descanso · ⚠️ atenção · 🗑️ excluir · 🔒 bloqueado
   TEMPO        📅 data/calendário · ⏱️ duração · 🕐 horário
   PROGRESSO    📈 evolução · 🔥 sequência/intensidade · 🏆 conquista · 🥇 marco
   COMUNICAÇÃO  💬 assistente · 💡 dica · 🧠 análise/insight · 📤 compartilhar
   ESFORÇO      💪 motivação/músculo (nunca como ícone de módulo — esse é 🏋️)
   REGRA DE OURO: um conceito = um emoji. Nunca dois emojis na mesma linha de texto. */
const CONTACT_EMAIL = 'metatreinooficial@gmail.com';
const HISTORY_RETENTION_DAYS = 90;

// ---------- FIREBASE ----------
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
const fbAuth = firebase.auth();
const db = firebase.firestore();
try{ db.enablePersistence({synchronizeTabs:true}).catch(()=>{}); }catch(e){}

// ---------- STATE ----------
let state = {
  user: null,
  active: 'lift',
  modules: { lift: null, run: null },
  progress: {},   // { exId: [{date, sets:[{peso,reps}]}] }
  prs: {},        // { exId: {peso, reps, at} }
  weights: [],    // [{date, weight}]
  trophies: [],   // ['first_workout', ...]
  stats: { liftTotal:0, runTotal:0, runKmTotal:0, walkTotal:0, walkKmTotal:0, bikeTotal:0, bikeKmTotal:0 }, // contadores vitalícios — nunca são apagados pela limpeza de 90 dias
  ui: { tab: 'home', selectedSession: null }
};

const QUOTES = [
  '🌱 Pequeno hoje, grande amanhã. Confie no processo.',
  '💪 Disciplina supera motivação todos os dias.',
  '🔥 O único treino ruim é o que você não fez.',
  '🎯 Foco no processo, o resultado vem.',
  '⚡ Constância bate intensidade no longo prazo.',
  '🚀 Cada série te aproxima da versão melhor de você.',
  '🌊 Você é mais forte do que sua última desculpa.',
  '🏆 Ninguém se arrepende do treino que fez.',
  '🧱 Um tijolo por dia constrói qualquer muro.',
  '⏰ O melhor horário pra treinar é o que você aparece.',
  '🌄 Comece devagar, mas não fique parado.',
  '💭 Seu corpo escuta tudo que sua mente diz.',
  '🔁 Repetição é a mãe da evolução.',
  '🥇 Compita com quem você era ontem.',
  '🌧️ Treinar nos dias difíceis é o que te diferencia.',
  '🔋 Descansar também é treinar. Respeite a recuperação.',
  '📈 Progresso não é linear — continue mesmo assim.',
  '🎒 A carga fica mais leve pra quem não larga.',
  '🕯️ Motivação acende o fogo; hábito mantém a chama.',
  '🐢 Devagar e sempre chega antes de rápido e nunca.',
  '💦 O suor de hoje é o resultado de amanhã.',
  '🧭 Não precisa ser perfeito, precisa ser consistente.',
  '🌟 Grandes mudanças começam com decisões pequenas.',
  '🛠️ Você está construindo algo que ninguém pode te tirar.',
  '🚪 A parte mais difícil é sair de casa. O resto flui.',
  '🎵 Encontre seu ritmo — a pressa é inimiga da constância.',
  '🌻 Cuide do corpo. É o único lugar que você tem pra viver.',
  '🧗 Cada dia treinado é um degrau que ninguém desfaz.',
  '⛰️ A montanha parece grande até você começar a subir.',
  '❤️ Treine por amor ao processo, não por ódio ao espelho.',
  '🌅 Todo campeão já foi um iniciante que não desistiu.',
  '🪨 Seja mais teimoso que suas desculpas.',
  '🌿 O corpo alcança o que a mente acredita.',
  '⚓ Ancoragem: um hábito por vez, sem pressa de chegar.',
  '🎬 Não espere estar pronto. Comece e fique pronto no caminho.',
  '🧊 Saia da zona de conforto — é lá que a mágica mora.',
  '🏹 Mire no progresso, não na perfeição.',
  '🌙 Descanso não é fraqueza, é parte do plano.',
  '🔩 Pequenos ajustes hoje, grandes conquistas amanhã.',
  '🌊 Persistência dissolve resistência.',
  '🦁 Coragem não é ausência de cansaço, é treinar apesar dele.',
  '📅 Um mês de constância muda mais que um dia perfeito.',
  '🧠 Treinar a mente é tão importante quanto treinar o corpo.',
  '⚙️ Sistemas vencem metas. Confie na sua rotina.',
  '🌤️ Depois do esforço vem a leveza. Aguente mais um pouco.',
  '🎯 Foque no próximo passo, não na escada inteira.',
  '🔥 A dor de hoje é a força de amanhã.',
  '🌱 Você não precisa ser extremo, precisa ser constante.',
  '🏔️ Grandes feitos são muitos pequenos feitos repetidos.',
  '💧 Hidrate o corpo, alimente a alma, mova-se todo dia.',
  '🚴 O importante não é a velocidade, é não parar.',
  '🧩 Cada treino é uma peça do seu melhor você.',
  '🌟 Acredite: seu eu do futuro está torcendo por você agora.',
  '🕊️ Liberdade é ter um corpo que te obedece.',
  '⏳ O tempo vai passar de qualquer jeito. Use-o a seu favor.',
  '🎒 Leve consigo: disciplina, paciência e boas escolhas.',
  '🏅 O troféu é secundário. A pessoa que você vira é o prêmio.',
  '🌊 Fluir é treinar sem guerra contra si mesmo.',
  '🔆 Brilhe pelo esforço, não pela comparação.',
  '🌰 Toda árvore forte já foi uma semente que insistiu.',
  '😅 Ninguém termina um treino pensando "que pena que treinei".',
  '🍕 Você não perde treino, só adia o sofrimento (e come a pizza em paz).',
  '🏋️ Levantar peso é caro? Não levantar sai mais caro lá na frente.',
  '🏃 Correr é de graça e ainda vem com terapia inclusa.',
  '😴 Dormir é oficialmente parte do treino. Aproveite a desculpa.',
  '🦵 Nunca pule o dia de perna. Ninguém respeita um pombo. 🐦',
  '😤 O agachamento não pergunta se você está com preguiça.',
  '🥵 Se foi fácil demais, talvez você não tenha feito direito.',
  '🧠 Treino é 10% físico e 90% "vou amanhã" que vira hoje.',
  '🚴 Bike, corrida ou musculação: o melhor esporte é o que você não abandona.',
  '💧 Água, sono e constância batem qualquer suplemento caro.',
  '🎯 Meta sem ação é só desejo de roupa de treino.',
  '🔥 Você não precisa estar em chamas, só não pode se apagar.',
  '🐌 Ir devagar ainda é bem mais rápido que ficar parado.',
  '🏆 Comparar seu capítulo 1 com o capítulo 20 dos outros é injusto com você.',
  '💪 O espelho daqui a 3 meses depende do que você faz hoje.',
  '🎽 Não é sobre ser o mais rápido. É sobre não desistir.',
  '☕ Café + treino = combustível oficial de quem não desiste.',
  '🌙 O corpo que você quer é construído nos dias que ninguém viu.',
  '🤝 Seu único adversário de verdade é o você de ontem.',
  '⚙️ Não espere vontade. Crie o hábito e a vontade vem junto.'
];
// Frases contextuais, com base no histórico recente do aluno (têm prioridade quando fazem sentido)
// Plano agendado pra frente: nada de cobrança nem de "descanso merecido" —
// o tom aqui é de expectativa e preparação.
function preStartInfo(){
  try{
    const mod = state.modules[state.active];
    if(!mod || !mod.plan) return null;
    const st = (typeof planStartTs==='function') ? planStartTs(mod) : 0;
    const h0 = new Date(); h0.setHours(0,0,0,0);
    if(!st || st <= h0.getTime()) return null;
    const fw = (typeof planFirstWorkoutInfo==='function') ? planFirstWorkoutInfo(mod) : null;
    const dias = fw ? fw.emDias : Math.ceil((st-h0.getTime())/86400000);
    return { dias, fw, isLift: state.active==='lift' };
  }catch(e){ return null; }
}
function preStartStatusLine(p){
  const d = p.dias;
  const quando = p.fw ? p.fw.quando : (d===1?'amanhã':'em '+d+' dias');
  const oQue = p.isLift ? 'treinar' : 'correr';
  if(d<=1) return `É amanhã que começa! 🔥 Separe a roupa hoje e durma cedo — amanhã a gente inaugura esse plano.`;
  if(d<=3) return `Faltam <b>${d} dias</b> pro seu primeiro treino. Aproveita pra deixar tudo pronto: roupa, tênis e horário na agenda. 📅`;
  if(d<=7) return `Seu plano começa ${quando}. Essa semana é de preparação — chegar descansado vale mais que antecipar. 😌`;
  if(d<=30) return `Faltam <b>${d} dias</b> pro início. Sem pressa: quando chegar o dia, é só ${oQue}. Eu cuido do resto. 💪`;
  return `Seu plano está agendado pra daqui a <b>${d} dias</b>. Fica tranquilo — não vou te cobrar nada até lá. Quando a data chegar, eu te aviso. 📅`;
}
function preStartQuote(p){
  const d = p.dias;
  const cedo = [
    '🌱 O primeiro passo já foi dado: você decidiu começar.',
    '📅 Plano marcado é meio caminho andado. O resto é aparecer.',
    '😌 Não tem pressa. Tem data.',
    '💡 Quem escolhe quando começar tem mais chance de continuar.',
    '🧘 Descansar antes de começar não é atraso, é preparação.'
  ];
  const perto = [
    '🔥 Tá chegando! A ansiedade boa é sinal de que você quer mesmo.',
    '👟 Deixa o tênis separado. Coisa pronta reduz desculpa.',
    '⏳ Falta pouco. Aproveita pra chegar inteiro no primeiro dia.',
    '💪 O plano já está montado. Só falta você aparecer.'
  ];
  const arr = d<=7 ? perto : cedo;
  const seed = Math.floor(Date.now()/86400000) + (typeof hashStr==='function' ? hashStr((state.user&&state.user.email)||'x') : 0);
  return arr[Math.abs(seed) % arr.length];
}
function contextualQuote(){
  const allH = [...(state.modules.lift?.history||[]), ...(state.modules.run?.history||[])];
  if(!allH.length) return null;
  const streak = calcStreak(allH);
  const today = new Date(); today.setHours(0,0,0,0);
  const last = allH.reduce((a,b)=>a.at>b.at?a:b);
  const daysSince = Math.floor((Date.now()-last.at)/86400000);
  const totalWk = allH.length;
  const cands = [];
  if(streak>=7) cands.push(`🔥 ${streak} dias seguidos treinando! Você virou uma máquina de constância.`);
  else if(streak>=3) cands.push(`🔥 ${streak} dias de sequência! Não quebre a corrente hoje.`);
  if(daysSince>=4) cands.push('👋 Que saudade! Bora retomar hoje — o corpo agradece e a mente também.');
  if(totalWk>=50) cands.push(`🏆 Você já registrou ${totalWk} treinos no MetaTreino. Isso é história sendo construída.`);
  else if(totalWk>=10) cands.push(`💪 ${totalWk} treinos registrados! A constância está virando hábito.`);
  const lastFeel = (state.modules.lift?.history||[]).filter(x=>x.feel).slice(-1)[0]?.feel;
  if(lastFeel==='exausto') cands.push('😌 Ontem pegou pesado. Hoje escute o corpo: qualidade vale mais que carga.');
  if(!cands.length) return null;
  // aleatória entre as candidatas
  return cands[Math.floor(Math.random()*cands.length)];
}

const TROPHIES = [
  // ESPECIAIS (humor e persistência) — recompensam o que a vida real cobra
  { secret:true, id:'comeback',    emoji:'🔙', name:'A Volta por Cima',   desc:'Voltou a treinar depois de 10+ dias parado', cat:'geral' },
  { secret:true, id:'monday',      emoji:'😤', name:'Segunda Não Assusta',desc:'Treinou em 4 segundas-feiras',              cat:'geral' },
  { secret:true, id:'early_bird',  emoji:'🐓', name:'Antes do Galo',      desc:'Treinou antes das 6h da manhã',             cat:'geral' },
  { secret:true, id:'night_owl',   emoji:'🦉', name:'Coruja Fitness',     desc:'Treinou depois das 22h',                    cat:'geral' },
  { secret:true, id:'weekend',     emoji:'🛋️', name:'Sofá Que Espere',    desc:'Treinou num sábado e num domingo',          cat:'geral' },
  { secret:true, id:'rain_check',  emoji:'🌧️', name:'Nem a Preguiça',     desc:'Treinou 3 dias seguidos após relatar cansaço', cat:'geral' },
  { secret:true, id:'consistent',  emoji:'📈', name:'Sem Drama',          desc:'12 treinos sem pular uma semana inteira',   cat:'geral' },
  { secret:true, id:'century',     emoji:'💯', name:'Clube dos 100',      desc:'100 treinos registrados. Respeito.',        cat:'geral' },
  { secret:true, id:'humble',      emoji:'🧘', name:'Sabedoria',          desc:'Adaptou o treino por dor em vez de forçar', cat:'geral' },
  { secret:true, id:'marathon_time', emoji:'🐢', name:'Sem Pressa',        desc:'Registrou um treino/atividade de mais de 2 horas', cat:'geral' },
  { secret:true, id:'turbo',       emoji:'⚡', name:'Modo Turbo',          desc:'Registrou um treino relâmpago de menos de 15 min', cat:'geral' },
  { secret:true, id:'capicua',     emoji:'🎰', name:'Hora Capicua',        desc:'Abriu o app às 07:07, 11:11 ou 22:22',      cat:'geral' },
  { secret:true, id:'halloween',   emoji:'🎃', name:'Noite das Bruxas',    desc:'Abriu o app no dia 31 de outubro',          cat:'geral' },
  { secret:true, id:'newyear',     emoji:'🎆', name:'Ano Novo, Corpo Novo',desc:'Registrou um treino em 1º de janeiro',      cat:'geral' },
  { secret:true, id:'bday_active', emoji:'🎂', name:'Presente Pra Si',    desc:'Treinou no dia do próprio aniversário',   cat:'geral' },
  { secret:true, id:'first_day',   emoji:'🎆', name:'Começou Certo',      desc:'Treinou no dia 1º de um mês',            cat:'geral' },
  { secret:true, id:'double',      emoji:'⚡', name:'Dose Dupla',         desc:'Musculação e corrida no mesmo dia',      cat:'geral' },
  { secret:true, id:'friday13',    emoji:'🍀', name:'Azar é Não Treinar', desc:'Treinou numa sexta-feira 13',            cat:'geral' },
  { secret:true, id:'christmas',   emoji:'🎄', name:'Espírito Natalino',  desc:'Treinou no dia de Natal (25/12)',        cat:'geral' },
  { secret:true, id:'versatile',   emoji:'🤹', name:'Faz-Tudo',           desc:'Registrou 3 modalidades diferentes (musculação, corrida, caminhada ou bike)', cat:'geral' },

  // GERAIS
  { id:'first_workout', emoji:'🥇', name:'Primeiro treino', desc:'Concluiu seu primeiro treino', cat:'geral' },
  { id:'week_goal', emoji:'🎯', name:'Meta da semana', desc:'Bateu a meta semanal', cat:'geral' },
  // STREAKS
  { id:'streak_3', emoji:'🔥', name:'Streak 3 dias', desc:'3 dias seguidos treinando', cat:'streak' },
  { id:'streak_7', emoji:'⚡', name:'Streak 7 dias', desc:'Uma semana firme!', cat:'streak' },
  { id:'streak_14', emoji:'🌟', name:'Streak 14 dias', desc:'Duas semanas de disciplina', cat:'streak' },
  { id:'streak_30', emoji:'💎', name:'Streak 30 dias', desc:'Um mês inteiro sem falhar', cat:'streak' },
  // MUSCULAÇÃO
  { id:'lift_10', emoji:'💪', name:'10 treinos', desc:'10 treinos de musculação', cat:'lift' },
  { id:'lift_25', emoji:'🏋️', name:'25 treinos', desc:'25 treinos de musculação', cat:'lift' },
  { id:'lift_50', emoji:'🏆', name:'50 treinos', desc:'50 treinos de musculação', cat:'lift' },
  { id:'lift_100', emoji:'👑', name:'Centurião', desc:'100 treinos de musculação', cat:'lift' },
  { id:'first_pr', emoji:'🏅', name:'Primeiro PR', desc:'Bateu recorde pessoal', cat:'lift' },
  { id:'pr_5', emoji:'⚔️', name:'5 PRs', desc:'5 recordes pessoais quebrados', cat:'lift' },
  { id:'pr_20', emoji:'🛡️', name:'20 PRs', desc:'Máquina de progressão', cat:'lift' },
  // CORRIDA
  { id:'run_1', emoji:'🏃', name:'Primeira corrida', desc:'Sua primeira corrida registrada', cat:'run' },
  { id:'run_10', emoji:'👟', name:'10 corridas', desc:'10 corridas concluídas', cat:'run' },
  { id:'run_25', emoji:'🎽', name:'25 corridas', desc:'25 corridas concluídas', cat:'run' },
  { id:'run_50', emoji:'🥇', name:'50 corridas', desc:'50 corridas concluídas', cat:'run' },
  { id:'run_km_10', emoji:'📏', name:'10 km acumulados', desc:'Distância total 10 km', cat:'run' },
  { id:'run_km_50', emoji:'🛤️', name:'50 km acumulados', desc:'Distância total 50 km', cat:'run' },
  { id:'run_km_100', emoji:'🌍', name:'100 km acumulados', desc:'Distância total 100 km', cat:'run' },
  { id:'run_km_500', emoji:'🚀', name:'500 km acumulados', desc:'Meio milhar de km', cat:'run' },
  { id:'run_5k_run', emoji:'🏁', name:'5K em uma corrida', desc:'Correu 5 km em uma sessão', cat:'run' },
  { id:'run_10k_run', emoji:'🥈', name:'10K em uma corrida', desc:'Correu 10 km em uma sessão', cat:'run' },
  { id:'run_21k_run', emoji:'🥇', name:'Meia maratona', desc:'21 km em uma sessão', cat:'run' },
  { id:'run_42k_run', emoji:'👑', name:'Maratona', desc:'42 km em uma sessão', cat:'run' },
  { id:'run_pr_distance', emoji:'📈', name:'Nova distância', desc:'Bateu recorde de distância', cat:'run' },
  { id:'run_pr_pace', emoji:'⚡', name:'Novo ritmo', desc:'Bateu recorde de ritmo', cat:'run' },
  // CAMINHADA
  { id:'walk_1', emoji:'🚶', name:'Primeira caminhada', desc:'Sua primeira caminhada registrada', cat:'walk' },
  { id:'walk_10', emoji:'👟', name:'10 caminhadas', desc:'10 caminhadas concluídas', cat:'walk' },
  { id:'walk_25', emoji:'🥾', name:'25 caminhadas', desc:'25 caminhadas concluídas', cat:'walk' },
  { id:'walk_km_10', emoji:'📏', name:'10 km caminhados', desc:'Distância total 10 km', cat:'walk' },
  { id:'walk_km_50', emoji:'🛤️', name:'50 km caminhados', desc:'Distância total 50 km', cat:'walk' },
  { id:'walk_km_100', emoji:'🌍', name:'100 km caminhados', desc:'Distância total 100 km', cat:'walk' },
  { id:'walk_3k', emoji:'🏅', name:'Caminhada 3K', desc:'Caminhou 3 km em uma sessão', cat:'walk' },
  { id:'walk_5k', emoji:'🥇', name:'Caminhada 5K', desc:'Caminhou 5 km em uma sessão', cat:'walk' },
  // BIKE
  { id:'bike_1', emoji:'🚴', name:'Primeiro pedal', desc:'Seu primeiro pedal registrado', cat:'bike' },
  { id:'bike_10', emoji:'⚙️', name:'10 pedais', desc:'10 pedaladas concluídas', cat:'bike' },
  { id:'bike_25', emoji:'🚵', name:'25 pedais', desc:'25 pedaladas concluídas', cat:'bike' },
  { id:'bike_km_50', emoji:'📏', name:'50 km pedalados', desc:'Distância total 50 km', cat:'bike' },
  { id:'bike_km_100', emoji:'🛤️', name:'100 km pedalados', desc:'Distância total 100 km', cat:'bike' },
  { id:'bike_km_500', emoji:'🌍', name:'500 km pedalados', desc:'Distância total 500 km', cat:'bike' },
  { id:'bike_20k', emoji:'🏅', name:'Pedal 20K', desc:'Pedalou 20 km em uma sessão', cat:'bike' },
  { id:'bike_50k', emoji:'🥇', name:'Pedal 50K', desc:'Pedalou 50 km em uma sessão', cat:'bike' },
  // PESO CORPORAL
  { id:'weight_down_1', emoji:'📉', name:'Perdeu 1kg', desc:'Emagrecimento -1kg', cat:'body' },
  { id:'weight_down_3', emoji:'🎉', name:'Perdeu 3kg', desc:'Emagrecimento -3kg', cat:'body' },
  { id:'weight_down_5', emoji:'🎊', name:'Perdeu 5kg', desc:'Emagrecimento -5kg', cat:'body' },
  { id:'weight_down_10', emoji:'🚀', name:'Perdeu 10kg', desc:'Emagrecimento -10kg', cat:'body' },
  { id:'weight_up_2', emoji:'📈', name:'Ganhou 2kg', desc:'Ganho de massa +2kg', cat:'body' },
  { id:'weight_up_5', emoji:'💥', name:'Ganhou 5kg', desc:'Ganho de massa +5kg', cat:'body' },
  { id:'weight_up_10', emoji:'🦾', name:'Ganhou 10kg', desc:'Ganho de massa +10kg', cat:'body' }
];

// ---------- STORAGE (nuvem + cache local, o MAIS NOVO vence) ----------
let fbUser = null;          // usuário autenticado (uid, email, displayName)
let cloudSyncTimer = null;

function localCacheKey(uid){ return DATA_PREFIX + uid; }

function saveData(){
  if(!state.user || !fbUser) return;
  state._savedAt = Date.now(); // carimbo pra decidir quem é mais novo (nuvem × local)
  try{ localStorage.setItem(localCacheKey(fbUser.uid), JSON.stringify(state)); }catch(e){}
  clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(syncToCloud, 800);
}
function syncToCloud(){
  if(!fbUser || !state.user) return;
  clearTimeout(cloudSyncTimer);
  // set SEM merge: substitui o documento inteiro. Com merge, campos apagados
  // localmente (ex: foto removida) "ressuscitavam" da nuvem no próximo login.
  db.collection('usuarios').doc(fbUser.uid).set({
    email: fbUser.email,
    nome: (state.user && state.user.profile && state.user.profile.nickname) || fbUser.displayName || '',
    atualizadoEm: state._savedAt || Date.now(),
    estadoApp: state
  }).catch(e=>console.log('Erro ao salvar na nuvem:', e));
}
// Ao minimizar/fechar o app, envia pra nuvem NA HORA (sem esperar o debounce) —
// evita perder o treino de quem salva e fecha o app em seguida.
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') syncToCloud(); });
window.addEventListener('pagehide', ()=>syncToCloud());

// corre uma promessa da nuvem contra um timeout, pra nada travar o app offline/rede lenta
function fbTimeout(promise, ms){
  return Promise.race([ promise, new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')), ms||5000)) ]);
}
async function loadData(){
  let cloud = null, local = null;
  try{
    const doc = await fbTimeout(db.collection('usuarios').doc(fbUser.uid).get(), 5000);
    if(doc.exists && doc.data().estadoApp) cloud = doc.data().estadoApp;
  }catch(e){ console.log('Sem conexão com a nuvem agora, usando cache local:', e); }
  try{ local = JSON.parse(localStorage.getItem(localCacheKey(fbUser.uid))||'null'); }catch(e){}
  // decide pela cópia mais recente — nunca deixa a nuvem antiga apagar treino recém-salvo no aparelho
  const cloudAt = (cloud && cloud._savedAt) || 0;
  const localAt = (local && local._savedAt) || 0;
  let chosen = null, needPush = false;
  if(cloud && local){ chosen = localAt > cloudAt ? local : cloud; needPush = localAt > cloudAt; }
  else chosen = cloud || local;
  if(chosen){
    state = {...state, ...chosen, ui:{...state.ui, ...(chosen.ui||{})}};
    try{ localStorage.setItem(localCacheKey(fbUser.uid), JSON.stringify(state)); }catch(e){}
    if(needPush) syncToCloud(); // devolve pra nuvem a versão local mais nova
  }
}

// ---------- AUTH (Google) ----------
// ===== LOGIN POR E-MAIL/USUÁRIO + SENHA =====
// Permite criar conta sem Google. Quem não tem e-mail usa um "usuário"
// (ex: joao123) — internamente vira joao123@aluno.metatreino.app, invisível pro aluno.
const DOMINIO_INTERNO = 'aluno.metatreino.app';
let authModo = 'entrar';   // 'entrar' | 'criar'
function normalizaLogin(v){
  const t = String(v||'').trim().toLowerCase();
  if(!t) return '';
  if(t.includes('@')) return t;
  // usuário simples (letras, números, ponto, hífen, _) vira e-mail interno
  const limpo = t.replace(/[^a-z0-9._-]/g,'');
  return limpo ? limpo + '@' + DOMINIO_INTERNO : '';
}
function ehLoginInterno(email){ return String(email||'').endsWith('@'+DOMINIO_INTERNO); }
// Mostra na hora o que vai acontecer com o que a pessoa está digitando.
// Evita o erro de digitar um e-mail que não existe e ficar preso na confirmação.
function dicaLogin(){
  const campo = document.getElementById('auth-email');
  const box = document.getElementById('auth-hint');
  if(!campo || !box) return;
  const v = String(campo.value||'').trim();
  if(!v){ box.innerHTML=''; return; }
  if(v.includes('@')){
    const valido = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v);
    box.innerHTML = authModo==='criar'
      ? (valido
          ? '📧 E-mail real — vamos enviar um <b>link de confirmação</b>. Precisa ser um e-mail que você acessa.'
          : '⚠️ Esse e-mail parece incompleto. Se você <b>não tem e-mail</b>, apague o "@" e digite só um usuário (ex: <b>joao123</b>).')
      : '📧 Entrando com e-mail.';
    box.style.color = (authModo==='criar' && !valido) ? 'var(--accent-2)' : 'var(--text-mute)';
  } else {
    const limpo = v.toLowerCase().replace(/[^a-z0-9._-]/g,'');
    box.innerHTML = limpo
      ? `👤 Login de <b>usuário</b> — sem e-mail e <b>sem confirmação</b>. Você vai entrar digitando <b>${limpo}</b> e a senha.`
      : '⚠️ Use letras e números (ex: joao123).';
    box.style.color = limpo ? 'var(--primary-2)' : 'var(--accent-2)';
  }
}
function toggleAuthMode(){
  authModo = authModo==='entrar' ? 'criar' : 'entrar';
  const criar = authModo==='criar';
  const el=(id)=>document.getElementById(id);
  if(el('auth-submit')) el('auth-submit').textContent = criar ? 'Criar conta' : 'Entrar';
  if(el('auth-toggle-lbl')) el('auth-toggle-lbl').textContent = criar ? 'Já tenho conta' : 'Criar uma conta';
  if(el('auth-name-field')) el('auth-name-field').classList.toggle('hidden', !criar);
  if(el('auth-forgot')) el('auth-forgot').style.display = criar ? 'none' : '';
  if(el('auth-pass')) el('auth-pass').setAttribute('autocomplete', criar ? 'new-password' : 'current-password');
  const e=el('auth-err'); if(e) e.innerHTML='';
  try{ dicaLogin(); }catch(err){}
}
function authErro(msg){ const e=document.getElementById('auth-err'); if(e) e.innerHTML='<div class="err">'+msg+'</div>'; }
function authMsgErro(code){
  return ({
    'auth/invalid-email':'E-mail ou usuário inválido.',
    'auth/user-not-found':'Não encontrei essa conta. Confira os dados ou crie uma conta.',
    'auth/wrong-password':'Senha incorreta.',
    'auth/invalid-credential':'E-mail/usuário ou senha incorretos.',
    'auth/email-already-in-use':'Já existe uma conta com esse e-mail/usuário. Tente entrar.',
    'auth/weak-password':'A senha precisa ter pelo menos 6 caracteres.',
    'auth/too-many-requests':'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
    'auth/network-request-failed':'Sem conexão. Confira sua internet.',
    'auth/operation-not-allowed':'Login por e-mail não está habilitado no Firebase (Authentication › Sign-in method).'
  })[code] || 'Não foi possível continuar. Tente novamente.';
}
// Devolve a tela de entrada ao estado inicial. Sem isso, o botão ficava
// travado em "Entrando..." e desabilitado depois de entrar e sair.
function resetAuthUI(){
  const g=(id)=>document.getElementById(id);
  const btn=g('auth-submit');
  if(btn){ btn.disabled=false; btn.textContent = authModo==='criar' ? 'Criar conta' : 'Entrar'; }
  const gb=g('google-btn'); if(gb){ gb.style.opacity='1'; gb.disabled=false; }
  const gl=g('google-btn-lbl'); if(gl) gl.textContent='Entrar com Google';
  const err=g('auth-err'); if(err) err.innerHTML='';
  const p=g('auth-pass'); if(p) p.value='';
  const rt=g('noaccess-retry'); if(rt){ rt.disabled=false; rt.textContent='🔄 Tentar de novo'; rt.classList.add('hidden'); }
  const rs=g('noaccess-resend'); if(rs) rs.classList.add('hidden');
}
function doEmailAuth(){
  const el=(id)=>document.getElementById(id);
  const email = normalizaLogin(el('auth-email') && el('auth-email').value);
  const pass  = (el('auth-pass') && el('auth-pass').value) || '';
  const nome  = (el('auth-name') && el('auth-name').value || '').trim();
  if(!email) return authErro('Digite seu e-mail ou um nome de usuário.');
  if(pass.length < 6) return authErro('A senha precisa ter pelo menos 6 caracteres.');
  if(authModo==='criar' && !nome) return authErro('Diga como você quer ser chamado.');
  const btn=el('auth-submit');
  if(btn){ btn.disabled=true; btn.textContent = authModo==='criar' ? 'Criando...' : 'Entrando...'; }
  const fim = ()=>{ if(btn){ btn.disabled=false; btn.textContent = authModo==='criar' ? 'Criar conta' : 'Entrar'; } };
  // sem e-mail real não existe recuperação automática — o aluno precisa saber ANTES
  if(authModo==='criar' && ehLoginInterno(email)){
    const el2=document.getElementById('auth-warn-ok');
    if(!el2 || !el2.checked){
      fim();
      const box=document.getElementById('auth-err');
      if(box) box.innerHTML = `<div class="note note-warn" style="margin-top:10px">
        <div class="note-title">⚠️ Conta sem e-mail</div>
        <div class="note-line">Você está criando a conta como <b>usuário</b>, sem e-mail. Se esquecer a senha, <b>não há como recuperá-la</b> — nem por você, nem pelo treinador. A conta teria que ser recriada do zero.</div>
        <div class="note-line" style="margin-top:6px"><b>Recomendo usar um e-mail real</b> — assim dá pra redefinir a senha sozinho quando precisar.</div>
        <label style="display:flex;gap:8px;align-items:flex-start;margin-top:10px;font-size:12.5px;cursor:pointer">
          <input type="checkbox" id="auth-warn-ok" style="margin-top:2px"> <span>Entendi o risco e quero criar mesmo assim</span>
        </label></div>`;
      return;
    }
  }
  const acao = authModo==='criar'
    ? fbAuth.createUserWithEmailAndPassword(email, pass).then(cred=>{
        const u = cred.user;
        const tarefas = [];
        if(u && nome) tarefas.push(u.updateProfile({ displayName: nome }).catch(()=>{}));
        // e-mail real: manda o link de confirmação (as regras do Firestore exigem verificação)
        if(u && !ehLoginInterno(email)) tarefas.push(u.sendEmailVerification().catch(e=>console.log('Falha ao enviar verificação:', e)));
        return Promise.all(tarefas);
      })
    : fbAuth.signInWithEmailAndPassword(email, pass);
  acao.catch(e=>{ console.log('Erro no login por e-mail:', e); fim(); authErro(authMsgErro(e && e.code)); });
}
// Trocar a senha estando logado — vale pra conta de e-mail E de usuário
function openChangePassword(){
  const email = (fbUser && fbUser.email) || '';
  const google = !!(fbUser && (fbUser.providerData||[]).some(p=>p.providerId==='google.com'));
  if(google){
    $('modal-inner').innerHTML = `<h3>🔑 Trocar senha</h3>
      <p style="color:var(--text-dim);font-size:13px;line-height:1.5">Sua conta entra pelo <b>Google</b> — a senha é gerenciada por lá, não pelo MetaTreino. Pra trocar, acesse a sua Conta Google.</p>
      <button class="btn btn-ghost btn-block" style="margin-top:14px" onclick="closeModal()">Entendi</button>`;
    $('modal-back').classList.add('on'); return;
  }
  $('modal-inner').innerHTML = `<h3>🔑 Trocar minha senha</h3>
    <p style="color:var(--text-dim);font-size:13px;line-height:1.5">Sua conta: <b>${ehLoginInterno(email)?email.split('@')[0]:email}</b></p>
    <div class="field" style="margin-top:12px"><label>Senha atual</label><input class="input" type="password" id="cp-old" autocomplete="current-password"></div>
    <div class="field"><label>Nova senha (mín. 6)</label><input class="input" type="password" id="cp-new" autocomplete="new-password"></div>
    <div class="field"><label>Repita a nova senha</label><input class="input" type="password" id="cp-new2" autocomplete="new-password"></div>
    <div id="cp-err"></div>
    <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="doChangePassword()">Salvar nova senha</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`;
  $('modal-back').classList.add('on');
}
function doChangePassword(){
  const g=(id)=>document.getElementById(id);
  const velha=(g('cp-old')||{}).value||'', nova=(g('cp-new')||{}).value||'', nova2=(g('cp-new2')||{}).value||'';
  const err=g('cp-err');
  const mostra=(m)=>{ if(err) err.innerHTML='<div class="err">'+m+'</div>'; };
  if(nova.length<6) return mostra('A nova senha precisa ter pelo menos 6 caracteres.');
  if(nova!==nova2) return mostra('As duas senhas novas não são iguais.');
  if(!fbUser) return mostra('Sessão expirada. Entre novamente.');
  const cred = firebase.auth.EmailAuthProvider.credential(fbUser.email, velha);
  fbUser.reauthenticateWithCredential(cred)
    .then(()=>fbUser.updatePassword(nova))
    .then(()=>{ closeModal(); toast('🔑 Senha alterada com sucesso'); })
    .catch(e=>{ console.log('Erro ao trocar senha:', e); mostra(authMsgErro(e && e.code)); });
}
function doResetPassword(){
  const el=(id)=>document.getElementById(id);
  const email = normalizaLogin(el('auth-email') && el('auth-email').value);
  if(!email) return authErro('Digite seu e-mail primeiro pra eu enviar o link.');
  if(ehLoginInterno(email)) return authErro('Contas de usuário (sem e-mail) não têm recuperação automática — fale com o treinador pra redefinir sua senha.');
  fbAuth.sendPasswordResetEmail(email)
    .then(()=>toast('📧 Link de recuperação enviado pro seu e-mail'))
    .catch(e=>authErro(authMsgErro(e && e.code)));
}
function resendVerification(){
  if(!fbUser){ toast('Entre novamente pra reenviar.'); return; }
  fbUser.sendEmailVerification()
    .then(()=>toast('📧 Link reenviado! Confira sua caixa de entrada e o spam.'))
    .catch(e=>{ console.log('Erro ao reenviar:', e); toast('⚠️ Não foi possível reenviar agora. Tente em alguns minutos.'); });
}
function retryAccessCheck(){
  try{
    const email = ((fbUser && fbUser.email)||'').toLowerCase();
    if(email) localStorage.removeItem('metatreino_access_'+email);
  }catch(e){}
  const b=$('noaccess-retry'); if(b){ b.disabled=true; b.textContent='Verificando...'; }
  // recarrega: o app refaz a checagem do zero ao subir
  setTimeout(()=>{ try{ location.reload(); }catch(e){} }, 400);
}
function doGoogleSignIn(){
  const btn=$('google-btn'), lbl=$('google-btn-lbl'), err=$('auth-err');
  if(err) err.innerHTML='';
  if(btn) btn.style.opacity='0.7';
  if(lbl) lbl.textContent='Entrando...';
  const provider = new firebase.auth.GoogleAuthProvider();
  fbAuth.signInWithPopup(provider).catch(e=>{
    console.log('Erro no login Google:', e);
    if(btn) btn.style.opacity='1';
    if(lbl) lbl.textContent='Entrar com Google';
    if(err && e.code!=='auth/popup-closed-by-user') err.innerHTML='<div class="err">Não foi possível entrar com o Google. Tente novamente.</div>';
  });
}
function doLogout(){
  syncToCloud(); // envia qualquer alteração pendente (ex: foto removida) ANTES de sair
  fbAuth.signOut().catch(()=>{});
  fbUser = null;
  state = { user:null, active:'lift', modules:{lift:null,run:null}, progress:{}, prs:{}, weights:[], trophies:[], stats:{liftTotal:0,runTotal:0,runKmTotal:0,walkTotal:0,walkKmTotal:0,bikeTotal:0,bikeKmTotal:0}, ui:{tab:'home',selectedSession:null} };
  showScreen('scr-auth');
  $('tabbar').classList.add('hidden');
  try{ resetAuthUI(); }catch(e){}
}
function appConfirm(msg, onOk, opts){
  opts = opts||{};
  document.getElementById('modal-inner').innerHTML = `
    <div style="text-align:center;padding:2px 0">
      <div style="font-size:40px">${opts.emo||'⚠️'}</div>
      <h3 style="margin:8px 0 6px">${opts.title||'Tem certeza?'}</h3>
      <p style="color:var(--text-dim);font-size:13.5px;line-height:1.5;white-space:pre-line">${msg}</p>
    </div>
    <button class="btn btn-primary btn-block" id="appconfirm-ok" style="margin-top:16px${opts.danger?';background:#ef4444;box-shadow:none':''}">${opts.okLabel||'Confirmar'}</button>
    <button class="btn btn-ghost btn-block" id="appconfirm-cancel" style="margin-top:8px">${opts.cancelLabel||'Cancelar'}</button>`;
  document.getElementById('modal-back').classList.add('on');
  const ok = document.getElementById('appconfirm-ok');
  if(ok) ok.onclick = ()=>{ closeModal(); setTimeout(()=>{ try{ onOk&&onOk(); }catch(e){ console.log('appConfirm:',e); } }, 60); };
  const cc = document.getElementById('appconfirm-cancel');
  if(cc) cc.onclick = ()=>{ closeModal(); if(opts.onCancel) setTimeout(()=>{ try{ opts.onCancel(); }catch(e){} }, 60); };
}
function doRestart(){
  if(!state.user || !fbUser) return;
  appConfirm('Todo o progresso será apagado (treinos, séries e conquistas), mas sua conta e acesso continuam.', ()=>{
    const keep = { name:state.user.name, email:state.user.email, isAdmin:state.user.isAdmin };
    state = { user:keep, active:'lift', modules:{lift:null,run:null}, progress:{}, prs:{}, weights:[], trophies:[], stats:{liftTotal:0,runTotal:0,runKmTotal:0,walkTotal:0,walkKmTotal:0,bikeTotal:0,bikeKmTotal:0}, ui:{tab:'home',selectedSession:null} };
    saveData(); syncToCloud();
    $('tabbar').classList.add('hidden');
    const fim = ()=>{ toast('🔄 Recomeçando! Preencha o questionário de novo.'); showScreen('scr-quiz'); bindOpts('scr-quiz'); };
    try{
      runBuildingScreen('lift', [
        {emo:'🧹', pri:1, txt:`Apagando treinos, séries e conquistas`},
        {emo:'🔐', pri:1, txt:`Mantendo sua <b>conta</b> e seu <b>acesso</b>`},
        {emo:'✅', pri:1, txt:`<b>Tudo limpo.</b> Vamos montar do zero!`}
      ], fim, { titulo:'🔄 Recomeçando do zero', sub:'Limpando seu progresso. Sua conta continua a mesma — só o histórico é apagado.', passo:1400 });
    }catch(e){ fim(); }
  }, {title:'Começar do zero?', emo:'🔄', okLabel:'Sim, apagar progresso', danger:true});
}
// O Firebase exige login recente pra excluir a conta. Quando exige, pedimos
// a senha (ou o popup do Google) e concluímos — senão a conta ficaria de pé.
function pedeReautenticarParaExcluir(u){
  try{
    const google = !!(u.providerData||[]).some(p=>p.providerId==='google.com');
    if(google){
      const prov = new firebase.auth.GoogleAuthProvider();
      u.reauthenticateWithPopup(prov)
        .then(()=>u.delete())
        .then(()=>toast('Conta excluída por completo.'))
        .catch(e=>{ console.log('Reautenticação falhou:', e); toast('⚠️ Seus dados foram apagados, mas o login ainda existe. Entre de novo e exclua para concluir.'); });
      return;
    }
    $('modal-inner').innerHTML = `<h3>🔐 Confirme sua senha</h3>
      <p style="color:var(--text-dim);font-size:13px;line-height:1.5">Por segurança, o sistema pede sua senha pra concluir a exclusão da conta.</p>
      <div class="field" style="margin-top:12px"><label>Senha</label><input class="input" type="password" id="del-pass" autocomplete="current-password"></div>
      <div id="del-err"></div>
      <button class="btn btn-primary btn-block hl-danger" style="margin-top:10px" onclick="confirmaExclusaoFinal()">Excluir minha conta</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`;
    $('modal-back').classList.add('on');
    window.__delUser = u;
  }catch(e){ console.log('Erro na reautenticação:', e); }
}
function confirmaExclusaoFinal(){
  const u = window.__delUser; const g=(id)=>document.getElementById(id);
  const pass = (g('del-pass')||{}).value || '';
  const err = g('del-err');
  if(!u){ closeModal(); return; }
  if(!pass){ if(err) err.innerHTML='<div class="err">Digite sua senha.</div>'; return; }
  const cred = firebase.auth.EmailAuthProvider.credential(u.email, pass);
  u.reauthenticateWithCredential(cred)
    .then(()=>u.delete())
    .then(()=>{ window.__delUser=null; closeModal(); toast('Conta excluída por completo.'); })
    .catch(e=>{ console.log('Erro ao concluir exclusão:', e); if(err) err.innerHTML='<div class="err">'+authMsgErro(e && e.code)+'</div>'; });
}
function doDeleteAccount(){
  if(!state.user || !fbUser) return;
  const email = fbUser.email;
  // qualquer conta com acesso de administrador é protegida (não só o e-mail principal)
  if(email === ADMIN_EMAIL || (state.user && state.user.isAdmin)){
    toast('🛡️ Contas de administrador não podem ser excluídas por aqui.');
    closeModal(); return;
  }
  appConfirm('Todo o seu progresso será apagado para sempre e você sairá da conta.', ()=>{
    const uid = fbUser.uid;
    const _u = fbUser;
    db.collection('usuarios').doc(uid).delete().catch(e=>console.log('Erro ao excluir na nuvem:', e));
    try{ localStorage.removeItem(localCacheKey(uid)); }catch(e){}
    // Antes só saíamos da conta: o login continuava valendo e a pessoa "voltava"
    // com os dados zerados. Agora a conta em si é removida do Firebase Auth.
    try{
      _u.delete().catch(e=>{
        if(e && e.code === 'auth/requires-recent-login') pedeReautenticarParaExcluir(_u);
        else console.log('Erro ao excluir a conta:', e);
      });
    }catch(e){ console.log('Erro ao excluir a conta:', e); }
    fbAuth.signOut().catch(()=>{});
    fbUser = null;
    state = { user:null, active:'lift', modules:{lift:null,run:null}, progress:{}, prs:{}, weights:[], trophies:[], stats:{liftTotal:0,runTotal:0,runKmTotal:0,walkTotal:0,walkKmTotal:0,bikeTotal:0,bikeKmTotal:0}, ui:{tab:'home',selectedSession:null} };
    const fim = ()=>{ showScreen('scr-auth'); toast('Conta excluída. Você pode começar de novo quando quiser.'); };
    try{
      runBuildingScreen('lift', [
        {emo:'🗑️', pri:1, txt:`Apagando seus dados da nuvem`},
        {emo:'🔓', pri:1, txt:`Encerrando sua sessão neste aparelho`},
        {emo:'👋', pri:1, txt:`<b>Conta excluída.</b> Obrigado por ter treinado com a gente.`}
      ], fim, { titulo:'🗑️ Excluindo sua conta', sub:'Removendo seus dados com segurança. Isso não pode ser desfeito.', passo:1400 });
    }catch(e){ fim(); }
  }, {title:'Excluir conta?', emo:'🗑️', okLabel:'Sim, excluir conta', danger:true});
}

async function afterGoogleSignIn(user){
  fbUser = user;
  const email = (user.email||'').toLowerCase();
  showScreen('scr-auth');
  const lbl = $('google-btn-lbl'); if(lbl) lbl.textContent='Verificando acesso...';
  const accessCacheKey = 'metatreino_access_'+email;

  let isAdmin = false, allowData = null, checkedOnline = false;
  const cached = (()=>{ try{ return JSON.parse(localStorage.getItem(accessCacheKey)||'null'); }catch(e){ return null; } })();
  const cacheValid = cached && (Date.now()-cached.at) < 7*86400000;
  if(navigator.onLine === false && cacheValid){
    // offline logo na entrada: usa o cache na hora, sem esperar a nuvem travar
    isAdmin = cached.isAdmin; allowData = cached.allowData;
    toast('📴 Modo offline — seus treinos funcionam normal e sincronizam depois. Só os vídeos precisam de internet.');
  } else {
    const tentar = async ()=>{
      const adminDoc = await fbTimeout(db.collection('admins').doc(email).get(), 9000);
      isAdmin = adminDoc.exists && adminDoc.data().ativo === true;
      const allowDoc = await fbTimeout(db.collection('usuariosAutorizados').doc(email).get(), 9000);
      if(allowDoc.exists) allowData = allowDoc.data();
      checkedOnline = true;
    };
    try{
      try{ await tentar(); }
      catch(e1){ console.log('1ª tentativa falhou, tentando de novo:', e1); await new Promise(r=>setTimeout(r,1200)); await tentar(); }
      try{ localStorage.setItem(accessCacheKey, JSON.stringify({isAdmin, allowData, at:Date.now()})); }catch(e){}
    }catch(e){
      window.__acessoErro = (e && (e.code || e.message)) || 'erro desconhecido';
      console.log('Sem conexão/timeout pra verificar acesso — usando cache offline:', e);
      if(cacheValid){
        isAdmin = cached.isAdmin; allowData = cached.allowData;
        toast('📴 Modo offline — seus treinos funcionam normal e sincronizam depois. Só os vídeos precisam de internet.');
      }
    }
  }

  const now = Date.now();
  const temAcesso = allowData && allowData.active && (!allowData.expiresAt || allowData.expiresAt > now);

  if(!isAdmin && !temAcesso){
    state.user = { name:user.displayName||'', email, blocked:true };
    // Não conseguimos verificar (rede lenta/timeout) ≠ acesso negado.
    // Antes os dois caíam na mesma tela, dizendo "não autorizado" pra quem tinha acesso.
    const naoVerificado = !!(user && user.email && !user.emailVerified && !ehLoginInterno(email));
    const el = $('noaccess-msg');
    if(el && naoVerificado && !checkedOnline){
      // causa mais comum agora: conta criada por e-mail e ainda não confirmada
      el.innerHTML = `📧 <b>Confirme seu e-mail pra continuar</b><br><br>Enviamos um link de confirmação para <b>${email}</b>. Abra o e-mail, clique no link e volte aqui.<br><br><span style="font-size:12px;color:var(--text-mute)">Não achou? Veja a caixa de spam.</span>`;
      const rt0 = $('noaccess-retry'); if(rt0){ rt0.classList.remove('hidden'); rt0.textContent = '🔄 Já confirmei, verificar de novo'; }
      const rs = $('noaccess-resend'); if(rs) rs.classList.remove('hidden');
      showScreen('scr-noaccess');
      return;
    }
    if(el){
      el.innerHTML = checkedOnline
        ? `Sua conta ainda não foi autorizada pelo treinador.<br><br><span style="font-size:12px;color:var(--text-mute)">Conta verificada: <b>${ehLoginInterno(email)?email.split('@')[0]:email}</b></span>`
        : `⚠️ <b>Não consegui verificar seu acesso</b>.<br><br>${(function(){
              const m = window.__acessoErro || '';
              if(/permission|insufficient/i.test(m)) return 'O banco de dados <b>recusou a leitura</b>. As regras do Firestore precisam liberar a coleção <b>usuariosAutorizados</b> para usuários autenticados.';
              if(/timeout/i.test(m)) return 'A resposta demorou demais. Pode ser conexão lenta — toque em <b>Tentar de novo</b>.';
              if(/network|unavailable|offline/i.test(m)) return 'Sem conexão com o servidor. Confira sua internet e toque em <b>Tentar de novo</b>.';
              return 'Falha ao consultar o servidor. Toque em <b>Tentar de novo</b>.';
            })()}<br><br><span style="font-size:12px;color:var(--text-mute)">Conta: <b>${ehLoginInterno(email)?email.split('@')[0]:email}</b><br>Detalhe técnico: <b>${window.__acessoErro||'—'}</b></span>`;
    }
    const rt = $('noaccess-retry'); if(rt) rt.classList.remove('hidden');
    showScreen('scr-noaccess');
    return;
  }

  if(isAdmin && !temAcesso && checkedOnline){
    const dadosAdmin = { active:true, expiresAt:null, name:user.displayName||'Admin (Marcelo)', notes:'Administrador — acesso vitalício', addedAt:now };
    try{
      await db.collection('usuariosAutorizados').doc(email).set(dadosAdmin, {merge:true});
    }catch(e){ console.log('Erro ao liberar acesso do admin:', e); }
    allowData = dadosAdmin;
  }
  myAccess = allowData;

  state.user = { name:user.displayName||'', email, isAdmin };
  loadVideoLinks(); // não bloqueia o login; links do treinador pros vídeos
  loadCoachMural(); // logo/mensagem fixada do treinador
  loadCoachContact(); // whatsapp/e-mail de contato do treinador
  loadWeather(); // clima (só mostra dica quando for notável)
  await loadData();
  if(!state.user) state.user = { name:user.displayName||'', email, isAdmin };
  state.user.isAdmin = isAdmin;
  state.user.email = email;
  migrateExerciseIds(); // renomeações: move histórico/PRs/pins pros ids novos
  try{ cleanupPastRace(); }catch(e){}
  try{ if(state.user && state.user.isAdmin) setTimeout(checkNewFeedback, 2500); }catch(e){} // prova que já passou some sozinha do card e do campo
  loadSpecialAward(); // depois de carregar os dados: reconcilia/mostra a conquista especial
  setTimeout(function(){ if(typeof checkTimeEasterEggs==="function") checkTimeEasterEggs(); }, 2500);
  bootAfterAuth();
}

fbAuth.onAuthStateChanged(function(user){
  if(user){
    afterGoogleSignIn(user);
  } else {
    fbUser = null;
    if(!state.user || !state.user.blocked) showScreen('scr-auth');
  }
});

// Atalho do painel nas telas de cadastro — admin entra sem preencher nada
function mostraAtalhoAdmin(id){
  try{
    const ab = $(id);
    const ehAdmin = !!(state.user && state.user.isAdmin);
    if(ab) ab.classList.toggle('hidden', !ehAdmin);
    if(ehAdmin) setTimeout(()=>{ try{ checkNewFeedback(); }catch(e){} }, 1200);
  }catch(e){}
}
// Volta do painel pro lugar certo: quem não terminou o cadastro não pode cair na Home
function sairDoPainel(){
  try{
    if(!state.user.profile || !state.user.profile.quiz_done){
      showScreen('scr-quiz'); bindOpts('scr-quiz'); mostraAtalhoAdmin('quiz-admin-btn'); return;
    }
    if(!state.modules.lift && !state.modules.run){ showPickScreen(); return; }
  }catch(e){}
  goTab('home');
}
function showPickScreen(){
  showScreen('scr-pick');
  mostraAtalhoAdmin('pick-admin-btn');
}
function bootAfterAuth(){
  cleanupOldHistory();
  recalibrateRunPlan(); // semana avançou? plano acompanha
  if(!state.user){ showScreen('scr-auth'); return; }
  if(!state.user.profile || !state.user.profile.quiz_done){
    showScreen('scr-quiz'); bindOpts('scr-quiz');
    mostraAtalhoAdmin('quiz-admin-btn');
    return;
  }
  if(!state.modules.lift && !state.modules.run){ showPickScreen(); return; }
  if(!state.modules[state.active]){
    state.active = state.modules.lift ? 'lift' : 'run';
  }
  saveData();
  goTab('home');
}

// ---------- QUESTIONÁRIO ----------
function saveQuiz(){
  const nick = $('q-nick').value.trim();
  const sex = readOpt('q-sex');
  const birth = ($('q-birth') && $('q-birth').value) || '';
  const age = ageFromBirth(birth);
  const height = parseFloat($('q-height').value);
  const weight = parseFloat($('q-weight').value);
  const whats = $('q-whats').value.trim();
  const goal = readOpt('q-goal');
  const level = readOpt('q-level');
  const err = $('q-err');
  err.innerHTML='';
  if(!nick){ err.innerHTML='<div class="err">Preencha como quer ser chamado.</div>'; return; }
  if(!sex){ err.innerHTML='<div class="err">Selecione o sexo.</div>'; return; }
  if(!birth){ err.innerHTML='<div class="err">Informe sua data de nascimento.</div>'; return; }
  if(age===null || age<10 || age>100){ err.innerHTML='<div class="err">Data de nascimento inválida.</div>'; return; }
  if(!height || height<100 || height>230){ err.innerHTML='<div class="err">Altura inválida.</div>'; return; }
  if(!weight || weight<25 || weight>400){ err.innerHTML='<div class="err">Peso inválido (entre 25 e 400 kg).</div>'; return; }
  if(!goal){ err.innerHTML='<div class="err">Selecione um objetivo.</div>'; return; }

  const profile = { nickname:nick, sex, birth, age, height, currentWeight:weight, whatsapp:whats, goal, level, quiz_done:true };
  state.user.profile = profile;
  // seed weight history
  state.weights = [{ date:Date.now(), weight }];
  saveData();
  showPickScreen();
}

function calcIMC(){
  const p = state.user && state.user.profile; if(!p) return null;
  const w = latestWeight() || p.currentWeight;
  const h = p.height/100;
  const imc = w / (h*h);
  // O IMC não separa gordura de músculo — quem treina há tempo costuma "pesar mal" nele.
  // Por isso o app mostra o número (útil como referência) sem carimbar diagnóstico na pessoa.
  let cls = '', color = 'var(--text)', faixa = '';
  if(imc < 18.5){ cls='Abaixo da faixa de referência'; color='var(--info-soft)'; faixa='abaixo'; }
  else if(imc < 25){ cls='Dentro da faixa de referência'; color='var(--primary-2)'; faixa='dentro'; }
  else if(imc < 30){ cls='Acima da faixa de referência'; color='var(--accent-2)'; faixa='acima'; }
  else { cls='Bem acima da faixa de referência'; color='var(--accent-2)'; faixa='muito'; }
  return { value:imc.toFixed(1), cls, color, faixa };
}
function latestWeight(){ if(!state.weights.length) return null; return state.weights[state.weights.length-1].weight; }
function firstWeight(){ if(!state.weights.length) return null; return state.weights[0].weight; }

// ---------- ACCESS ----------
let myAccess = null; // dados de acesso (usuariosAutorizados) do usuário logado, carregados no login
function accessDaysLeft(){
  if(state.user && state.user.isAdmin) return 999999;
  if(!myAccess || !myAccess.active) return 0;
  if(!myAccess.expiresAt) return 999999;
  return Math.max(0, Math.ceil((myAccess.expiresAt - Date.now())/86400000));
}
function accessLabel(days){
  if(days>=999999) return '♾️ Acesso vitalício';
  if(days<=0) return 'Acesso expirado';
  return `${days} dias restantes`;
}

// ---------- CLEANUP HISTORY (90 days) ----------
function cleanupOldHistory(){
  ensureStats(); // captura os totais vitalícios ANTES de apagar o histórico antigo
  const cutoff = Date.now() - HISTORY_RETENTION_DAYS*86400000;
  ['lift','run'].forEach(m=>{
    if(state.modules[m] && state.modules[m].history){
      state.modules[m].history = state.modules[m].history.filter(h=>h.at >= cutoff);
    }
  });
  // clean progress old
  Object.keys(state.progress).forEach(k=>{
    state.progress[k] = state.progress[k].filter(p=>p.date >= cutoff);
    if(!state.progress[k].length) delete state.progress[k];
  });
  saveData();
}

// ---------- MODULE PICK / SETUP ----------
// Abre a tela de configuração de um módulo com TODOS os bindings necessários.
// (Existiam três lugares chamando bindings diferentes — um deles esquecia os dias da semana.)
function sairDoSetup(){
  // Sem isso, quem abria o setup ficava preso: a única saída era limpar os dados do app.
  if(state.modules.lift || state.modules.run){ goTab(state.ui.tab||'home'); return; }
  showPickScreen();
}
function openSetupScreen(m){
  showScreen('scr-setup-'+m);
  bindOpts('scr-setup-'+m);
  bindMultiOpts('scr-setup-'+m);
  bindDaysUpdate(m);
  // Pré-preenche com o plano ATUAL (antes abria tudo em branco e parecia que nada foi selecionado)
  try{
    const st = state.modules[m] && state.modules[m].setup;
    if(st){
      const setOn = (gid,val)=>{ const g=$(gid); if(!g||val==null) return; const t=g.querySelector(`.opt[data-val="${val}"]`); if(!t) return; g.querySelectorAll('.opt').forEach(o=>o.classList.remove('on')); t.classList.add('on'); };
      if(m==='lift'){ setOn('lift-goal',st.goal); setOn('lift-days',st.days); setOn('lift-equip',st.equip); setOn('lift-level',st.level); }
      else { setOn('run-goal',st.goal); setOn('run-level',st.level); setOn('run-days',st.days); setOn('run-terrain',st.terrain); }
      const wd = $(m+'-week-days');
      if(wd && st.selectedDays && st.selectedDays.length){
        wd.querySelectorAll('.opt').forEach(o=>o.classList.toggle('on', st.selectedDays.includes(parseInt(o.dataset.val))));
      }
      if(typeof bindDaysUpdate==='function') bindDaysUpdate(m);
    }
    // "quando você começa" só faz sentido pra quem ainda não treinou nesse módulo
    try{
      const si = $(m+'-start-date');
      if(si){
        const temHist = !!(state.modules[m] && ((state.modules[m].history)||[]).length);
        const campo = si.closest ? si.closest('.field') : null;
        if(campo) campo.style.display = temHist ? 'none' : '';
        if(temHist) si.value = '';
      }
    }catch(e){}
    if(m==='lift'){
      // lista de equipamentos aparece só quando "Escolher meus equipamentos" está marcado
      try{
        equipTemp = (((state.modules.lift||{}).setup||{}).equipList || []).slice();
        const grid = $('lift-equip');
        const sync = ()=>{ const on = grid && grid.querySelector('.opt.on'); const custom = on && on.dataset.val==='custom';
          const box=$('lift-equip-custom'); if(box) box.style.display = custom ? 'block' : 'none';
          if(custom) renderEquipChecklist(); };
        if(grid && !grid._eqBound){ grid._eqBound=true; grid.addEventListener('click', ()=>setTimeout(sync,20)); }
        setTimeout(sync, 60);
      }catch(e){}
      ['lift-level','lift-goal','lift-days'].forEach(gid=>{ const g=$(gid); if(g && !g._hintBound){ g._hintBound=true; g.addEventListener('click', ()=>setTimeout(updateLevelHint,30)); } });
      setTimeout(updateLevelHint, 60);
    }
  }catch(e){}
  // Recriar o plano não pode apagar a prova alvo em silêncio: repõe a data já cadastrada.
  if(m === 'run'){
    const elT = $('run-race-time');
    const rt = state.modules.run && state.modules.run.setup && state.modules.run.setup.raceTime;
    if(elT && rt) elT.value = rt;
    const el = $('run-race-date');
    const rd = state.modules.run && state.modules.run.setup && state.modules.run.setup.raceDate;
    if(el && rd) el.value = rd;
  }
}
function pickModule(m){
  state.active=m; saveData();
  openSetupScreen(m);
  prefillSetupFromQuiz(m);
}
// Usa as respostas do questionário inicial pra já deixar o plano pré-selecionado
// (a pessoa só confirma ou ajusta — sem responder duas vezes a mesma coisa)
function prefillSetupFromQuiz(m){
  const p = state.user && state.user.profile;
  if(!p) return;
  const setOn = (groupId, val)=>{
    const g = $(groupId); if(!g) return;
    const target = g.querySelector(`.opt[data-val="${val}"]`);
    if(!target) return;
    g.querySelectorAll('.opt').forEach(o=>o.classList.remove('on'));
    target.classList.add('on');
  };
  // nível de atividade geral → sugestão de nível de experiência
  const lvlMap = { sedentario:'iniciante', ativo:'intermediario', atleta:'avancado' };
  if(p.level && lvlMap[p.level]) setOn(m+'-level', lvlMap[p.level]);
  if(m==='lift' && p.goal){
    // objetivo de vida → objetivo de treino sugerido
    const goalMap = { emagrecer:'emagrecimento', massa:'hipertrofia', forca:'forca', condicionamento:'resistencia', tonificar:'hipertrofia', saude:'resistencia' };
    if(goalMap[p.goal]) setOn('lift-goal', goalMap[p.goal]);
  }
}
function bindOpts(scrId){
  document.querySelectorAll('#'+scrId+' .opt:not(.opt-multi)').forEach(o=>{
    o.onclick = ()=>{ o.parentNode.querySelectorAll('.opt:not(.opt-multi)').forEach(x=>x.classList.remove('on')); o.classList.add('on'); };
  });
}
function readOpt(id){ const on = document.querySelector('#'+id+' .opt.on'); return on?on.dataset.val:null; }

// Estimativa de duração por nível — alinha a expectativa antes de confirmar
function updateLevelHint(){
  const el = document.getElementById('lift-level-hint'); if(!el) return;
  const lvl = (typeof readOpt==='function') ? readOpt('lift-level') : 'iniciante';
  const goal = (typeof readOpt==='function') ? readOpt('lift-goal') : 'hipertrofia';
  const dias = parseInt((typeof readOpt==='function') ? readOpt('lift-days') : 3) || 3;
  const exPorDia = ({iniciante:4, intermediario:6, avancado:8})[lvl] || 5;
  const setsMed = goal==='forca' ? 4 : (goal==='resistencia' ? 3 : 3.5);
  const descanso = goal==='forca' ? 2.4 : (goal==='resistencia' ? 0.9 : 1.5);
  const min = Math.round(exPorDia * setsMed * (0.9 + descanso)) + 8;
  const lbl = ({iniciante:'Iniciante', intermediario:'Intermediário', avancado:'Avançado'})[lvl] || '';
  el.innerHTML = `⏱️ <b>${lbl}</b>: ~${Math.max(25,min-8)}-${min+7} min por treino · cerca de ${exPorDia} exercícios · ${dias}x na semana`;
}
// ---------- TELA DE MONTAGEM DO PLANO ----------
// Regra: cada etapa mostra um FATO REAL do que o app está fazendo com as escolhas do aluno
// (nada de teatro genérico). Se o plano já ficou pronto, a tela ainda dura o mínimo pra ler.
// ===== EQUIPAMENTOS ESPECÍFICOS =====
// Cada exercício exige um aparelho. Descobrimos pelo NOME (são descritivos) — assim
// não foi preciso re-etiquetar 123 exercícios na mão, e novos entram já classificados.
const EQUIP_LISTA = [
  { id:'banco',      nome:'Banco (reto/inclinado)', emo:'🛋️' },
  { id:'halteres',   nome:'Halteres',               emo:'🏋️' },
  { id:'barra',      nome:'Barra + anilhas',        emo:'🥢' },
  { id:'barraw',     nome:'Barra W',                emo:'〰️' },
  { id:'smith',      nome:'Smith',                  emo:'🏗️' },
  { id:'polia',      nome:'Polia / cabos / cross',  emo:'🔗' },
  { id:'maquina',    nome:'Máquinas (Hammer, voador)', emo:'⚙️' },
  { id:'barrafixa',  nome:'Barra fixa',             emo:'🙌' },
  { id:'paralelas',  nome:'Paralelas',              emo:'🤸' },
  { id:'legpress',   nome:'Leg press',              emo:'🦿' },
  { id:'hack',       nome:'Hack',                   emo:'📐' },
  { id:'extensora',  nome:'Cadeira extensora',      emo:'🪑' },
  { id:'flexora',    nome:'Mesa flexora',           emo:'🛏️' },
  { id:'adutora',    nome:'Adutora / abdutora',     emo:'↔️' },
  { id:'panturrilha',nome:'Panturrilha (máquina)',  emo:'🦶' },
  { id:'gluteo',     nome:'Glúteo (máquina/caneleira)', emo:'🍑' },
  { id:'kettlebell', nome:'Kettlebell',             emo:'🔔' },
  { id:'elastico',   nome:'Elástico / faixa',       emo:'🎗️' }
];
function equipDoExercicio(ex){
  // A biblioteca já sabe o que dá pra fazer em casa (cadeira vira banco, barra na porta...).
  // Esses nunca exigem aparelho — garante que o personalizado nunca ofereça menos que "Peso do corpo".
  if((ex.equip||[]).includes('casa')) return [];
  const n = String(ex.name||'').toLowerCase();
  const eq = new Set();
  if(/smith/.test(n)) eq.add('smith');
  else if(/leg press/.test(n)) eq.add('legpress');
  else if(/\bhack\b/.test(n)) eq.add('hack');
  else if(/extensora/.test(n)) eq.add('extensora');
  else if(/flexora/.test(n)) eq.add('flexora');
  else if(/adutora|abdutora/.test(n)) eq.add('adutora');
  else if(/panturrilha (sentad|no leg|na m[áa]quina)/.test(n)) eq.add('panturrilha');
  else if(/cabo|polia|pulley|crossover|pulldown|face pull|pallof/.test(n)) eq.add('polia');
  else if(/m[áa]quina|hammer|voador|peck deck|articulad|graviton|t-bar|cavalinho/.test(n)) eq.add('maquina');
  else if(/barra fixa|chin-?up|pull-?up|pegada pronada|pegada supinada/.test(n)) eq.add('barrafixa');
  else if(/paralelas/.test(n)) eq.add('paralelas');
  else if(/kettlebell/.test(n)) eq.add('kettlebell');
  else if(/el[áa]stico|faixa el/.test(n)) eq.add('elastico');
  else if(/barra w|barra ez/.test(n)) eq.add('barraw');
  else if(/halter|arnold|goblet|concentrada|farmer|posterior curvad/.test(n)) eq.add('halteres');
  else if(/\bbarra\b|terra|hip thrust|pélvica|pelvica/.test(n)) eq.add('barra');
  if(/supino|crucifixo|inclinad|declinad|scott|pregador|hip thrust|p[ée]lvica|b[úu]lgaro|step-?up|banco/.test(n)) eq.add('banco');
  if(/gl[úu]teo|coice/.test(n) && /m[áa]quina|cabo|caneleira/.test(n)) eq.add('gluteo');
  if(!eq.size){
    // sem aparelho no nome: é peso do corpo se a biblioteca marcou como 'casa'
    if((ex.equip||[]).includes('casa')) return [];
    eq.add('maquina');   // segurança: exercício de academia não identificado
  }
  return [...eq];
}
// O aluno consegue fazer este exercício com o que ele tem?
function podeFazerCom(ex, lista){
  const req = equipDoExercicio(ex);
  if(!req.length) return true;                 // peso do corpo: sempre pode
  return req.every(r => lista.includes(r));    // precisa ter TODOS os aparelhos exigidos
}
// desenha a lista de equipamentos marcáveis
function renderEquipChecklist(){
  const box = $('equip-check-list'); if(!box) return;
  const sel = new Set(((state.modules.lift||{}).setup||{}).equipList || equipTemp);
  box.innerHTML = EQUIP_LISTA.map(e=>`<div class="list-row" onclick="toggleEquip('${e.id}')" style="padding:10px 12px;${sel.has(e.id)?'border-color:var(--line-primary);background:var(--tint-primary)':''}">
      <span style="font-size:16px">${e.emo}</span><span style="flex:1">${e.nome}</span>
      <span style="font-size:16px;color:${sel.has(e.id)?'var(--primary-2)':'var(--text-mute)'}">${sel.has(e.id)?'☑':'☐'}</span>
    </div>`).join('');
  atualizaContagemEquip();
}
let equipTemp = [];
function toggleEquip(id){
  const i = equipTemp.indexOf(id);
  if(i>=0) equipTemp.splice(i,1); else equipTemp.push(id);
  renderEquipChecklist();
}
function atualizaContagemEquip(){
  const el = $('equip-count'); if(!el) return;
  let n=0;
  try{ EX_BANK.forEach(c=>c.items.forEach(x=>{ if(podeFazerCom(x, equipTemp)) n++; })); }catch(e){}
  const marcados = equipTemp.length;
  el.innerHTML = marcados===0
    ? `🤸 <b>${n} exercícios</b> de peso do corpo — marque o que você tem pra desbloquear mais`
    : `✅ <b>${n} exercícios</b> disponíveis · <b>${marcados}</b> ${marcados===1?'equipamento marcado':'equipamentos marcados'}`;
  el.style.color = 'var(--text-dim)';
}
function countExercisesFor(equip){
  try{
    const f = equip==='basico' ? ['casa','halteres'] : equip==='academia' ? ['academia','halteres','casa'] : equip==='halteres' ? ['halteres','casa'] : ['casa'];
    let n=0;
    EX_BANK.forEach(c=>c.items.forEach(ex=>{
      if((ex.equip||[]).some(e=>f.includes(e)) && (equip==='casa' || !ex.improv)) n++;
    }));
    return n;
  }catch(e){ return 0; }
}
function buildingSteps(m, setup, prev){
  const dn = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const dias = (setup.selectedDays||[]).map(d=>dn[d-1]).join(', ');
  const dores = (state.user && state.user.pain) || [];
  const steps = [];
  if(m==='lift'){
    const gl = {hipertrofia:'Hipertrofia',forca:'Força',emagrecimento:'Emagrecimento',resistencia:'Resistência'}[setup.goal] || 'Seu objetivo';
    const eq = {academia:'Academia completa',halteres:'Halteres em casa',casa:'Peso do corpo',basico:'Academia básica',custom:'Seus equipamentos'}[setup.equip] || 'Seu equipamento';
    const lvl = {iniciante:'Iniciante',intermediario:'Intermediário',avancado:'Avançado'}[setup.level] || '';
    steps.push({emo:'🎯', pri:1, txt:`Objetivo: <b>${gl}</b>`});
    if(setup.equip==='custom'){
      let n=0; try{ EX_BANK.forEach(c=>c.items.forEach(x=>{ if(podeFazerCom(x,setup.equipList||[])) n++; })); }catch(e){}
      const q=(setup.equipList||[]).length;
      steps.push({emo:'🛠️', pri:2, txt:`Montando com <b>${q} ${q===1?'equipamento':'equipamentos'}</b> que você tem — <b>${n} exercícios</b> possíveis`});
    } else steps.push({emo:'🏋️', pri:2, txt:`${eq} — <b>${countExercisesFor(setup.equip)} exercícios</b> liberados pra você`});
    steps.push({emo:'📅', pri:2, txt:`Dividindo em <b>${setup.days} treinos</b>: ${dias}`});
    steps.push({emo:'🧠', pri:3, txt:`Variando padrões de movimento pra <b>não repetir estímulo</b> no mesmo dia`});
    if(setup.goal==='forca') steps.push({emo:'💪', pri:3, txt:`Priorizando os <b>grandes compostos</b> e segurando os isoladores`});
    else if(setup.goal==='emagrecimento') steps.push({emo:'🔥', pri:3, txt:`Priorizando <b>multiarticulares</b> — mais músculo trabalhando, mais gasto`});
    else if(setup.goal==='resistencia') steps.push({emo:'⚡', pri:3, txt:`Montando em <b>formato circuito</b>, com descanso curto`});
    else steps.push({emo:'📊', pri:3, txt:`Ajustando séries e descanso pro nível <b>${lvl}</b>`});
    if(dores.length) steps.push({emo:'🩹', pri:1, txt:`Adaptando por dor: <b>${dores.join(', ')}</b> — trocando o que sobrecarrega`});
  } else {
    const gl = {'5km':'5 km','10km':'10 km','21km':'Meia maratona','42km':'Maratona'}[setup.goal] || 'Sua meta';
    const tr = {asfalto:'Asfalto',esteira:'Esteira',trilha:'Trilha',pista:'Pista'}[setup.terrain] || 'Seu terreno';
    const lvl = {iniciante:'Iniciante',intermediario:'Intermediário',avancado:'Avançado'}[setup.level] || '';
    steps.push({emo:'🎯', pri:1, txt:`Meta: <b>${gl}</b>`});
    steps.push({emo:'🏃', pri:2, txt:setup.level==='iniciante'
      ? `Nível <b>Iniciante</b> — começamos alternando <b>trote e caminhada</b>, sem tiros`
      : `Nível <b>${lvl}</b> — incluindo ritmo forte e tiros na medida certa`});
    steps.push({emo:'🛣️', pri:3, txt:`Terreno: <b>${tr}</b> — ajustando o esforço de cada sessão`});
    steps.push({emo:'📅', pri:2, txt:`Progressão de <b>12 semanas</b>: ${dias}`});
    if(setup.raceDate) steps.push({emo:'🏁', pri:1, txt:`Alinhando o <b>pico</b> com a sua prova`});
    if(dores.length) steps.push({emo:'🩹', pri:1, txt:`Considerando sua dor: <b>${dores.join(', ')}</b>`});
  }
  if(prev) steps.push({emo:'🧩', pri:1, txt:`Preservando seu <b>histórico</b> e suas <b>trocas fixadas</b>`});
  // início agendado pra frente: essa é a informação mais importante da tela
  try{
    const _st = (state.modules[m]||{}).startAt;
    const _h0 = new Date(); _h0.setHours(0,0,0,0);
    if(_st && _st > _h0.getTime()){
      const fw = (typeof planFirstWorkoutInfo==='function') ? planFirstWorkoutInfo(state.modules[m]) : null;
      if(fw) steps.push({emo:'📅', pri:1, txt:`Primeiro treino <b>${fw.fmt}</b> (${fw.quando}) — até lá, <b>sem cobranças</b>`});
    }
  }catch(e){}
  steps.push({emo:'✅', pri:1, txt:m==='lift' ? `<b>Seu plano de musculação está pronto!</b>` : `<b>Seu plano de corrida está pronto!</b>`});
  return steps;
}
function runBuildingScreen(m, steps, done, opts){
  opts = opts || {};
  try{
    if(!document.getElementById('bld-style')){
      const st = document.createElement('style'); st.id='bld-style';
      st.textContent =
        '@keyframes bldspin{to{transform:rotate(360deg)}}'+
        '@keyframes bldenter{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}'+
        '@keyframes bldleave{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(-12px) scale(.98)}}';
      document.head.appendChild(st);
    }
  }catch(e){}
  // no máximo 5 etapas: melhor poucas e legíveis do que muitas correndo.
  // Corta por PRIORIDADE (as mais pessoais — dor, histórico — nunca saem) e mantém a ordem.
  if(steps.length > 5){
    const ranking = steps.map((x,idx)=>({x, idx, pri:x.pri||2}))
      .sort((a,b)=> a.pri-b.pri || a.idx-b.idx)
      .slice(0,5).map(o=>o.idx).sort((a,b)=>a-b);
    steps = ranking.map(i=>steps[i]);
  }
  let ov = document.getElementById('building-ov');
  if(!ov){ ov = document.createElement('div'); ov.id='building-ov'; document.body.appendChild(ov); }
  ov.setAttribute('style',
    'position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100%;z-index:99999;'+
    'display:flex;align-items:center;justify-content:center;padding:26px;box-sizing:border-box;'+
    'background:#070d16;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);'+
    'opacity:0;transition:opacity .3s ease');
  const titulo = opts.titulo || (m==='lift' ? '🧠 Montando seu treino' : '🧠 Montando seu plano de corrida');
  ov.innerHTML =
    '<div style="width:100%;max-width:430px;text-align:center">'+
      '<div style="width:70px;height:70px;margin:0 auto 22px;border-radius:50%;border:3px solid rgba(16,185,129,.16);border-top-color:#10b981;animation:bldspin .9s linear infinite;position:relative">'+
        '<div style="position:absolute;top:10px;left:10px;right:10px;bottom:10px;border-radius:50%;border:2px solid rgba(16,185,129,.12);border-bottom-color:rgba(16,185,129,.55);animation:bldspin 1.5s linear infinite reverse"></div>'+
      '</div>'+
      '<div style="font-size:22px;font-weight:800;letter-spacing:-.3px;color:#fff;margin-bottom:7px">'+titulo+'</div>'+
      '<div style="font-size:12.5px;color:#8fa0b5;line-height:1.5;margin:0 auto 28px;max-width:330px">'+(opts.sub||'Analisando seus objetivos, equipamentos e preferências pra montar algo que faça sentido pra você.')+'</div>'+
      '<div id="bld-stage" style="min-height:140px;display:flex;align-items:center;justify-content:center"></div>'+
      '<div style="height:5px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:26px"><div id="bld-bar-i" style="height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,#10b981,#34d399);transition:width 1.5s linear"></div></div>'+
    '</div>';
  requestAnimationFrame(()=>{ ov.style.opacity='1'; });
  const stage = document.getElementById('bld-stage');
  const bar = document.getElementById('bld-bar-i');
  const passo = opts.passo || 1550;   // tempo total de cada etapa
  const saida = 260;    // a saída começa só no finalzinho → sobra ~1,3s de leitura estável
  let i = 0;
  const tick = ()=>{
    if(i >= steps.length){
      setTimeout(()=>{
        ov.style.opacity='0';
        setTimeout(()=>{ ov.setAttribute('style','display:none'); ov.innerHTML=''; if(typeof done==='function') done(); }, 320);
      }, 700);
      return;
    }
    const st = steps[i];
    const ultimo = (i === steps.length-1);
    const cor = ultimo ? '#34d399' : '#cfe0f0';
    const el = document.createElement('div');
    el.setAttribute('style','display:flex;flex-direction:column;align-items:center;gap:13px;padding:0 6px;animation:bldenter .4s cubic-bezier(.2,.8,.3,1) both');
    el.innerHTML =
      '<div style="font-size:40px;line-height:1">'+st.emo+'</div>'+
      '<div style="font-size:16.5px;line-height:1.45;color:'+cor+';font-weight:500">'+
        String(st.txt).replace(/<b>/g,'<b style="color:'+(ultimo?'#34d399':'#fff')+'">')+
      '</div>';
    stage.innerHTML = '';
    stage.appendChild(el);
    if(bar){
      if(ultimo){ bar.style.transition='width .45s cubic-bezier(.2,.9,.25,1)'; bar.style.width='100%'; }
      else bar.style.width = Math.round(((i+1)/steps.length)*100) + '%';
    }
    const atual = i;
    i++;
    if(atual < steps.length-1){
      setTimeout(()=>{ if(el.parentNode) el.style.animation='bldleave .26s ease both'; }, passo - saida);
    }
    setTimeout(tick, passo);
  };
  tick();
}
function finishSetup(m){
  const setup = m==='lift' ? {
    goal:readOpt('lift-goal'), days:parseInt(readOpt('lift-days')),
    equip:readOpt('lift-equip'), level:readOpt('lift-level'),
    selectedDays: readSelectedDays('lift-week-days')
  } : {
    goal:readOpt('run-goal'), level:readOpt('run-level'),
    days:parseInt(readOpt('run-days')), terrain:readOpt('run-terrain'),
    selectedDays: readSelectedDays('run-week-days'),
    raceDate: $('run-race-date') ? $('run-race-date').value : null,
    raceTime: ($('run-race-time') && $('run-race-time').value) ? $('run-race-time').value : null
  };
  // Exige escolher os dias da semana. (Antes, readSelectedDays devolvia null quando nada
  // estava marcado e a validação era pulada — o aluno novo criava o plano sem escolher.)
  if(!setup.days){ toast('Escolha quantos dias por semana você vai treinar'); return; }
  if(!setup.selectedDays || setup.selectedDays.length !== setup.days){
    const faltam = setup.days - ((setup.selectedDays||[]).length);
    toast(faltam === setup.days
      ? `Escolha os ${setup.days} dias da semana em que você vai treinar`
      : `Selecione exatamente ${setup.days} dia${setup.days>1?'s':''} da semana`);
    return;
  }
  // preserva histórico e data de início ao RECRIAR um plano (não zera o progresso do aluno)
  // data de início escolhida (ou hoje) — dias antes disso não contam falta
  const _si = document.getElementById(m+'-start-date');
  const _hoje0 = new Date(); _hoje0.setHours(0,0,0,0);
  let startAt = _hoje0.getTime();   // meia-noite de hoje (com hora, "hoje" virava futuro)
  if(_si && _si.value){ const dS=new Date(_si.value+'T00:00:00'); if(!isNaN(dS) && dS.getTime()>_hoje0.getTime()) startAt = dS.getTime(); }
  const prev = state.modules[m];
  state.modules[m] = { setup, plan:generatePlan(m,setup), week:1, createdAt: (prev && prev.createdAt) || Date.now(), startAt, history: (prev && prev.history) || [] };
  state.active = m;
  regenAllPlans(); // se o aluno está com dor/TPM, o plano novo já nasce adaptado
  saveData();
  // tela de montagem: mostra o que o app REALMENTE fez com as escolhas do aluno
  try{
    runBuildingScreen(m, buildingSteps(m, setup, prev), ()=>{
      goTab('home');
      toast(prev ? '🔄 Plano recriado! Seu histórico foi mantido.' : '🎉 Plano criado!');
    });
  }catch(e){
    goTab('home'); toast(prev ? '🔄 Plano recriado! Seu histórico foi mantido.' : '🎉 Plano criado!');
  }
}
function readSelectedDays(id){
  const el = $(id); if(!el) return null;
  const on = [...el.querySelectorAll('.opt.on')].map(o=>parseInt(o.dataset.val)).sort((a,b)=>a-b);
  return on.length?on:null;
}
// Multi-select bind (for week days) — com limite pelo número de dias escolhido
function bindMultiOpts(scrId){
  const m = scrId.replace('scr-setup-','');
  document.querySelectorAll('#'+scrId+' .opt-multi').forEach(o=>{
    o.onclick = ()=>{
      if(o.classList.contains('on')){ o.classList.remove('on'); return; } // desmarcar sempre pode
      const max = parseInt(readOpt(m+'-days')) || 7;
      const cur = document.querySelectorAll('#'+m+'-week-days .opt-multi.on').length;
      if(cur >= max){ toast(`Você escolheu ${max} dias por semana — desmarque um dia antes de marcar outro`); return; }
      o.classList.add('on');
    };
  });
}
// Show/hide "which days" section based on day count
function bindDaysUpdate(m){
  const daysGroup = $(m+'-days');
  const weekWrap = $(m+'-week-days-wrap');
  const update = ()=>{
    const n = parseInt(readOpt(m+'-days')) || 0;
    if(weekWrap){ weekWrap.style.display = n>0 ? 'block':'none'; $(m+'-days-count').textContent = n; }
    // se o total marcado excede o novo limite, desmarca os últimos
    const on = [...document.querySelectorAll('#'+m+'-week-days .opt-multi.on')];
    if(n>0 && on.length>n){ on.slice(n).forEach(o=>o.classList.remove('on')); }
  };
  daysGroup.querySelectorAll('.opt').forEach(o=>{ o.addEventListener('click', ()=>setTimeout(update,10)); });
  update();
}

// ---------- PLAN GENERATION ----------
function generatePlan(module, setup){
  if(module==='lift'){
    const days = setup.days || 4;
    const splitMap = {
      3:[{k:'A',name:'Peito + Tríceps',parts:['Peito','Tríceps']},{k:'B',name:'Costas + Bíceps',parts:['Costas','Bíceps']},{k:'C',name:'Pernas + Ombro',parts:['Pernas','Ombro','Core']}],
      4:[{k:'A',name:'Peito + Tríceps',parts:['Peito','Tríceps','Core']},{k:'B',name:'Costas + Bíceps',parts:['Costas','Bíceps']},{k:'C',name:'Pernas + Glúteos',parts:['Pernas','Glúteos','Panturrilha']},{k:'D',name:'Ombro + Trapézio',parts:['Ombro','Trapézio','Core']}],
      5:[{k:'A',name:'Peito + Tríceps',parts:['Peito','Tríceps']},{k:'B',name:'Costas + Bíceps',parts:['Costas','Bíceps']},{k:'C',name:'Pernas + Panturrilha',parts:['Pernas','Panturrilha']},{k:'D',name:'Ombro + Trapézio',parts:['Ombro','Trapézio','Core']},{k:'E',name:'Glúteos + Pernas',parts:['Glúteos','Pernas']}],
      6:[{k:'A',name:'Peito + Tríceps',parts:['Peito','Tríceps']},{k:'B',name:'Costas + Bíceps',parts:['Costas','Bíceps']},{k:'C',name:'Pernas + Panturrilha',parts:['Pernas','Panturrilha']},{k:'D',name:'Ombro + Core',parts:['Ombro','Core']},{k:'E',name:'Peito + Costas',parts:['Peito','Costas']},{k:'F',name:'Glúteos + Pernas',parts:['Glúteos','Pernas']}]
    };
    const split = splitMap[days] || splitMap[4];
    // Use user-selected days if available, otherwise defaults
    const wkDays = (setup.selectedDays && setup.selectedDays.length===days) ? setup.selectedDays : ({ 3:[1,3,5], 4:[1,2,4,5], 5:[1,2,3,5,6], 6:[1,2,3,4,5,6] }[days] || [1,2,4,5]);
    const dayNames = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
    const workouts = split.map((s,i)=>{
      const exercises = buildLiftExercises(s.parts,setup);
      return {
        ...s, dayIdx:wkDays[i], dayName:dayNames[wkDays[i]-1],
        duration:estimateLiftDuration(exercises, setup.goal),
        exercises
      };
    });
    return { type:'lift', goal:setup.goal, workouts, totalWeeks:12 };
  } else {
    const goal = setup.goal || '5km';
    const totalWeeks = {'5km':8,'10km':10,'21km':12,'42km':16}[goal];
    const wkDays = (setup.selectedDays && setup.selectedDays.length===setup.days) ? setup.selectedDays : ({ 3:[2,4,6], 4:[1,3,5,7], 5:[1,2,4,5,7], 6:[1,2,3,4,5,6] }[setup.days] || [1,3,5,7]);
    const dayNames = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
    // distância base = a da prova; escala pelo nível (avançado corre mais no dia a dia)
    const raceKm = parseFloat(String(goal).replace(/[^\d.]/g,'')) || 5;
    const level = setup.level || 'iniciante';
    // Iniciante NÃO recebe tiros (intervalado): só corridas leves e longas, pra criar o hábito
    // sem sofrer e sem desistir. Intermediário ganha ritmo; avançado ganha o intervalado.
    const types = level==='iniciante' ? ['Corrida Leve','Corrida Longa']
      : level==='intermediario' ? ['Corrida Leve','Ritmo Constante','Corrida Longa']
      : ['Corrida Leve','Intervalado','Corrida Longa','Ritmo Constante'];
    // a "corrida longa" chega perto da distância da prova conforme o nível
    const longMult = { iniciante:0.6, intermediario:0.8, avancado:1.0 }[level];
    // fatores de cada tipo de treino em relação à corrida longa
    const kindFactor = { 'Corrida Longa':1.0, 'Corrida Leve':0.55, 'Ritmo Constante':0.7, 'Intervalado':0.6 };
    // se a pessoa já registrou corridas, usa a maior como piso de realidade
    const runsSoFar = (state.modules.run?.history||[]).filter(r=>!r.activity||r.activity==='corrida');
    const longestDone = runsSoFar.length ? Math.max(...runsSoFar.map(r=>r.distance||0)) : 0;
    const baseLong = Math.max(raceKm*longMult, longestDone*0.9); // não sugerir menos que ~90% do que já faz
    const paceMinKm = { iniciante:7.5, intermediario:6, avancado:5 }[level]; // min por km aproximado
    const workouts = wkDays.map((d,i)=>{
      const kind = types[i%types.length];
      // Dois tetos: distância por tipo e TEMPO por tipo. A distância é reduzida pra caber
      // no tempo — assim os dois números nunca se contradizem na tela.
      const tetoKm  = { 'Corrida Longa':32, 'Corrida Leve':12, 'Ritmo Constante':10, 'Intervalado':8 }[kind] || 12;
      const tetoMin = { 'Corrida Longa':160, 'Corrida Leve':70, 'Ritmo Constante':55, 'Intervalado':45 }[kind] || 60;
      let km = Math.min(tetoKm, Math.max(1.5, Math.round(baseLong * kindFactor[kind] * 2) / 2));
      const fatorTempo = kind==='Intervalado' ? 1.25 : 1;
      if(km * paceMinKm * fatorTempo > tetoMin) km = Math.max(1.5, Math.round((tetoMin/(paceMinKm*fatorTempo))*2)/2);
      const distance = '~'+km+'km';
      // minutos estimados da parte principal = distância × pace do nível
      // (intervalado é mais curto em distância mas exige mais tempo por causa das pausas)
      // O tempo vem da distância (assim os dois nunca se contradizem na tela).
      const mainMin = kind==='Intervalado'
        ? Math.round(km * paceMinKm * 1.25)
        : Math.round(km * paceMinKm);
      const nReps = kind==='Intervalado' ? Math.max(4, Math.min(12, Math.round(km/0.6))) : 0;
      const blocks = buildRunBlocks(kind, {...setup, _mainMin:mainMin, _nReps:nReps});
      const duration = blocks.reduce((s,b)=>s+b.exs.reduce((x,e)=>x+(e.min||0),0),0);
      return { k:'S'+(i+1), name:kind+' — treino '+(i+1), dayIdx:d, dayName:dayNames[d-1], duration, distance, targetKm:km, targetPace:runPace(kind,setup), blocks };
    });
    return { type:'run', goal, terrain:setup.terrain, level, workouts, totalWeeks };
  }
}
// Ritmo REAL do aluno (mediana das últimas corridas) — base pra tudo ficar adaptativo
// Avaliação da corrida recém-registrada, comparando com o histórico do próprio aluno
// ===== INTELIGÊNCIA DE CORRIDA =====
// 1) Previsão de tempo por distância (fórmula de Riegel, usada por treinadores há décadas)
function racePrediction(alvoKm){
  try{
    const h = (((state.modules.run||{}).history)||[])
      .filter(r=>(!r.activity||r.activity==='corrida') && (r.distance||0)>=2 && (r.duration||0)>0)
      .slice(-10);
    if(h.length < 3) return null;
    // usa a melhor performance recente como referência (menor ritmo com distância decente)
    const base = h.reduce((best,r)=>{
      const pace = r.duration/r.distance;
      const bp = best ? best.duration/best.distance : 9999;
      // dá preferência a distâncias maiores em caso de empate de ritmo
      return (pace < bp - 0.05 || (Math.abs(pace-bp)<=0.05 && r.distance>best.distance)) ? r : best;
    }, null);
    if(!base) return null;
    const T2 = base.duration * Math.pow(alvoKm/base.distance, 1.06);
    return { min:T2, base, paceAlvo:T2/alvoKm };
  }catch(e){ return null; }
}
// 2) Volume subindo rápido demais? (referência clássica: até ~10% por semana)
function volumeAlert(){
  try{
    const h = (((state.modules.run||{}).history)||[]).filter(r=>(r.distance||0)>0);
    if(h.length < 6) return null;
    const semanaKm = (offset)=>{
      const fim = Date.now() - offset*7*86400000;
      const ini = fim - 7*86400000;
      return h.filter(r=>r.at>ini && r.at<=fim).reduce((a,r)=>a+(r.distance||0),0);
    };
    const atual = semanaKm(0);
    const ant = [semanaKm(1), semanaKm(2), semanaKm(3)].filter(v=>v>0);
    if(!ant.length || atual<=0) return null;
    const media = ant.reduce((a,b)=>a+b,0)/ant.length;
    if(media < 5 || atual < 8) return null;          // volumes pequenos: a % vira ruído, não informação
    const alta = (atual/media - 1) * 100;
    if(alta >= 50) return { nivel:'alto', alta:Math.round(alta), atual:Math.round(atual*10)/10, media:Math.round(media*10)/10 };
    if(alta >= 30) return { nivel:'medio', alta:Math.round(alta), atual:Math.round(atual*10)/10, media:Math.round(media*10)/10 };
    return null;
  }catch(e){ return null; }
}
// 3) Este mês x mês passado
function monthlyRunCompare(){
  try{
    const h = (((state.modules.run||{}).history)||[]).filter(r=>(r.distance||0)>0);
    if(h.length < 4) return null;
    const agora = new Date();
    const ini = (y,m)=>new Date(y,m,1).getTime();
    const iniEste = ini(agora.getFullYear(), agora.getMonth());
    const iniAnt = ini(agora.getFullYear(), agora.getMonth()-1);
    const este = h.filter(r=>r.at>=iniEste);
    const ant = h.filter(r=>r.at>=iniAnt && r.at<iniEste);
    if(!este.length || ant.length < 2) return null;
    const soma = a=>a.reduce((x,r)=>x+(r.distance||0),0);
    const paceMed = a=>{ const c=a.filter(r=>(!r.activity||r.activity==='corrida')&&r.duration>0&&r.distance>=1);
      return c.length ? c.reduce((x,r)=>x+r.duration/r.distance,0)/c.length : null; };
    return { kmEste:Math.round(soma(este)*10)/10, kmAnt:Math.round(soma(ant)*10)/10,
             nEste:este.length, nAnt:ant.length, paceEste:paceMed(este), paceAnt:paceMed(ant) };
  }catch(e){ return null; }
}
function runFeedback(km, min, type, ehProva){
  try{
    if(type!=='corrida') return null;
    const hist = (((state.modules.run||{}).history)||[])
      .filter(r=>(!r.activity||r.activity==='corrida') && (r.distance||0)>=1 && (r.duration||0)>0);
    const anteriores = hist.slice(0,-1); // tira a que acabou de entrar
    const pace = min/km;
    const linhas = [];
    if(anteriores.length < 2){
      linhas.push(`Corrida registrada: <b>${km}km</b> em <b>${fmtDur(min)}</b> (${fmtPaceMin(pace)}).`);
      linhas.push(`Ainda tenho poucas corridas suas pra comparar — a partir da terceira eu começo a te mostrar a evolução. 📈`);
      return { titulo: ehProva ? '🏅 Prova registrada!' : '🏃 Corrida registrada!', linhas };
    }
    const pacesAnt = anteriores.map(r=>r.duration/r.distance);
    const mediaAnt = pacesAnt.reduce((a,b)=>a+b,0)/pacesAnt.length;
    const melhorAnt = Math.min(...pacesAnt);
    const maiorAnt = Math.max(...anteriores.map(r=>r.distance||0));
    const difSeg = Math.round((mediaAnt - pace)*60); // + = mais rápido que a média
    linhas.push(`<b>${km}km</b> em <b>${fmtDur(min)}</b> · ritmo <b>${fmtPaceMin(pace)}</b>`);
    if(pace < melhorAnt) linhas.push(`🏆 <b>Seu ritmo mais rápido até hoje!</b> Bateu o recorde anterior de ${fmtPaceMin(melhorAnt)}.`);
    else if(difSeg >= 10) linhas.push(`📈 Você correu <b>${difSeg}s/km mais rápido</b> que sua média. Sinal claro de evolução.`);
    else if(difSeg >= 3) linhas.push(`🙂 Um pouco acima da sua média (<b>${difSeg}s/km</b> mais rápido). Constância é isso.`);
    else if(difSeg <= -25) linhas.push(`🐢 Foi mais lenta que sua média — e tudo bem: calor, cansaço e sono pesam no ritmo. Corrida leve também constrói base.`);
    else linhas.push(`✅ Bem na sua média de ritmo. Regularidade vale mais que um dia bom isolado.`);
    if(km > maiorAnt) linhas.push(`📏 <b>Maior distância que você já correu!</b> A anterior era ${Math.round(maiorAnt*10)/10}km.`);
    const totalKm = hist.reduce((a,r)=>a+(r.distance||0),0);
    linhas.push(`Total acumulado: <b>${Math.round(totalKm)}km</b> em ${hist.length} corridas.`);
    return { titulo: ehProva ? '🏅 Prova registrada!' : '🏃 Corrida registrada!', linhas };
  }catch(e){ return null; }
}
function myRunPaceMin(){
  try{
    const h = (((state.modules.run||{}).history)||[])
      .filter(r=>(!r.activity || r.activity==='corrida') && (r.distance||0)>=1.5 && (r.duration||0)>0)
      .slice(-8);
    if(h.length < 3) return null;                       // com pouca amostra, não inventa
    const paces = h.map(r=>r.duration/r.distance).sort((a,b)=>a-b);
    const mid = Math.floor(paces.length/2);
    return paces.length%2 ? paces[mid] : (paces[mid-1]+paces[mid])/2;  // mediana: ignora corrida atípica
  }catch(e){ return null; }
}
function fmtPaceMin(min){
  const m = Math.floor(min), sec = Math.round((min-m)*60);
  return (sec===60 ? (m+1)+':00' : m+':'+String(sec).padStart(2,'0'))+'/km';
}
function runPace(kind, setup){
  // Se o aluno já corre, os alvos saem do ritmo DELE — não de uma tabela genérica
  const real = myRunPaceMin();
  if(real){
    const f = kind==='Intervalado' ? 0.86 : kind==='Corrida Longa' ? 1.08 : kind==='Ritmo Constante' ? 0.94 : 1.05;
    return fmtPaceMin(Math.max(2.8, Math.min(13, real*f)));
  }
  return runPaceTabela(kind, setup);
}
function runPaceTabela(kind, setup){
  const paces = {
    iniciante:{leve:'8:00/km',ritmo:'7:00/km',longa:'8:30/km',interval:'5:30/km'},
    intermediario:{leve:'6:30/km',ritmo:'5:30/km',longa:'6:45/km',interval:'4:30/km'},
    avancado:{leve:'5:30/km',ritmo:'4:30/km',longa:'5:45/km',interval:'3:45/km'}
  };
  const p = paces[setup.level||'iniciante'];
  if(kind==='Intervalado') return p.interval;
  if(kind==='Corrida Longa') return p.longa;
  if(kind==='Ritmo Constante') return p.ritmo;
  return p.leve;
}

// Regiões com dor → grupos musculares a evitar nos treinos
const PAIN_MAP = {
  'Ombro':['Ombro','Peito','Tríceps','Trapézio'],
  'Lombar':['Costas','Glúteos'],
  'Joelho':['Pernas','Glúteos','Panturrilha'],
  'Punho/Cotovelo':['Bíceps','Tríceps','Peito'],
  'Tornozelo':['Panturrilha','Pernas'],
  'Pescoço':['Trapézio','Ombro']
};
function painBlockedParts(){
  const pains = (state.user && state.user.pain) || [];
  const blocked = new Set();
  pains.forEach(p=>(PAIN_MAP[p]||[]).forEach(x=>blocked.add(x)));
  return blocked;
}
function buildLiftExercises(parts, setup){
  const level = setup.level || 'iniciante';
  const goal = setup.goal || 'hipertrofia';
  // séries variam por nível E objetivo
  const setsMap = {
    iniciante:{hipertrofia:3, forca:3, emagrecimento:3, resistencia:2},
    intermediario:{hipertrofia:4, forca:4, emagrecimento:3, resistencia:3},
    avancado:{hipertrofia:4, forca:5, emagrecimento:4, resistencia:3}
  };
  const repsMap = {hipertrofia:'8-12', forca:'4-6', emagrecimento:'12-15', resistencia:'15-20'};
  const restMap = {hipertrofia:'60-90s', forca:'2-3min', emagrecimento:'30-45s', resistencia:'30s'};
  // 50+ anos: recuperação entre séries é naturalmente mais lenta — descanso maior protege e melhora a qualidade das séries
  const restMap50 = {hipertrofia:'90-120s', forca:'3min', emagrecimento:'45-60s', resistencia:'45s'};
  const prof = state.user && state.user.profile;
  const isSenior = prof && prof.age >= 50;
  const sets = (setsMap[level]||setsMap.iniciante)[goal] || 3;
  const reps = repsMap[goal];
  const rest = (isSenior ? restMap50 : restMap)[goal];
  const equip = setup.equip || 'academia';
  const equipFilter = equip==='basico' ? ['casa','halteres'] : equip==='academia' ? ['academia','halteres','casa'] : equip==='halteres' ? ['halteres','casa'] : ['casa'];
  // quantidade de exercícios por grupo varia por nível
  const needBig = level==='avancado'?4 : level==='intermediario'?3 : 2;   // grupos grandes
  const needSmall = level==='avancado'?2 : level==='intermediario'?2 : 1; // core/panturrilha/trapézio
  // offset por objetivo: objetivos diferentes puxam exercícios diferentes do banco
  const goalOffset = {hipertrofia:0, forca:0, emagrecimento:1, resistencia:2}[goal] || 0;
  const blocked = painBlockedParts();
  const list = [];
  parts.forEach(p=>{
    if(blocked.has(p)) return; // pula grupos que sobrecarregam a região dolorida
    const cat = EX_BANK.find(c=>c.name===p); if(!cat) return;
    let compat = cat.items.filter(ex => (ex.equip||[]).some(e => equipFilter.includes(e)) && (equip==='casa' || !ex.improv));
    // Equipamentos escolhidos pelo aluno: só entra o que ele realmente tem (+ peso do corpo)
    if(equip === 'custom'){
      const lista = (setup.equipList || []);
      // peso do corpo (inclusive improvisados) SEMPRE entra + o que o aluno marcou.
      // Assim o personalizado nunca oferece menos que a opção "Peso do corpo".
      compat = cat.items.filter(ex => podeFazerCom(ex, lista));
    }
    if(!compat.length) return;
    // VARIAÇÃO SEMANAL: gira as opções a cada semana — mesmo estímulo, exercício diferente (Supino barra → halteres → máquina → volta)
    const wkSeed = Math.floor(Date.now()/(7*86400000)) % 4;
    if(compat.length>3 && wkSeed>0) compat = [...compat.slice(wkSeed), ...compat.slice(0,wkSeed)];
    // Força prioriza exercícios compostos/pesados (os primeiros do banco em cada grupo
    // são os básicos de academia); emagrecimento/resistência rotacionam a lista pra
    // priorizar variações mais dinâmicas.
    if(goal==='forca'){
      // FORÇA: prioriza os grandes compostos e empurra isoladores pro fim
      compat = [...compat].sort((a,b)=>forcaRank(a)-forcaRank(b));
    } else if(goal==='emagrecimento'){
      // EMAGRECIMENTO: multiarticulares primeiro (mais músculo trabalhando = mais gasto)
      const comp = compat.filter(e=>exPattern(e.name)!=='isolador');
      const iso  = compat.filter(e=>exPattern(e.name)==='isolador');
      if(comp.length) compat = [...comp, ...iso];
    } else if(goalOffset>0 && compat.length>3){
      compat = [...compat.slice(goalOffset), ...compat.slice(0,goalOffset)];
    }
    // guarda: isoladores nunca lideram o grupo (rotação continua, mas entre os principais)
    const isIso = e => /isolador|isolad/.test((e.sub||'').toLowerCase()) || exPattern(e.name)==='isolador';
    compat = [...compat].sort((a,b)=>(isIso(a)?1:0)-(isIso(b)?1:0));
    const need = (p==='Core'||p==='Panturrilha'||p==='Trapézio') ? needSmall : needBig;
    // escolhe exercícios com estímulos VARIADOS (evita 2 isoladores ou 2 "superior" no mesmo grupo):
    // percorre a lista e só adiciona se a assinatura do sub ainda não foi usada; completa se faltar
    const stim = s => (s||'').toLowerCase().replace(/[()]/g,'').trim();
    const pick = [], usedStim = new Set(), usedPat = {};
    const patCap = pat => pat==='isolador' ? (goal==='forca'?1:2) : 1; // máx 1 por padrão (isoladores até 2; força limita a 1)
    compat.forEach(ex => { const pat=exPattern(ex.name); if(pick.length<need && !usedStim.has(stim(ex.sub)) && (usedPat[pat]||0)<patCap(pat)){ pick.push(ex); usedStim.add(stim(ex.sub)); usedPat[pat]=(usedPat[pat]||0)+1; } });
    if(pick.length<need){ compat.forEach(ex => { if(pick.length<need && !pick.includes(ex)) pick.push(ex); }); }
    pick.forEach(ex=>{ list.push({ id: slug(ex.name), name:ex.name, sub:ex.sub, sets, reps, rest, part:p, equip:ex.equip }); });
  });
  // dor: se algum grupo foi bloqueado, completa com sinergistas seguros — o treino continua útil
  const blockedCount = parts.filter(p=>blocked.has(p)).length;
  if(blockedCount>0 && list.length){
    let added=0;
    ['Core','Panturrilha'].forEach(cn=>{
      if(added>=Math.min(2,blockedCount) || blocked.has(cn)) return; // não adiciona sinergista que a própria dor bloqueia
      const cat=EX_BANK.find(c=>c.name===cn); if(!cat) return;
      const ex=cat.items.find(e=>(e.equip||[]).some(q=>equipFilter.includes(q)) && (equip==='casa'||!e.improv) && !list.some(l=>l.id===slug(e.name)));
      if(ex){ list.push({ id:slug(ex.name), name:ex.name, sub:ex.sub, sets:2, reps:'12-15', rest:'45s', part:cn, equip:ex.equip }); added++; }
    });
  }
  // se a dor bloqueou todos os grupos do dia, entrega ao menos um treino leve de Core
  if(!list.length && !blocked.has('Core')){
    const core = EX_BANK.find(c=>c.name==='Core');
    if(core) core.items.slice(0,3).forEach(ex=>{ list.push({ id:slug(ex.name), name:ex.name, sub:ex.sub, sets:2, reps:'12-15', rest:'45s', part:'Core', equip:ex.equip }); });
  }
  return list;
}
// duração estimada calculada do volume real: (tempo da série + descanso) × séries × exercícios + aquecimento
function estimateLiftDuration(exercises, goal){
  const restSec = {hipertrofia:75, forca:150, emagrecimento:40, resistencia:30}[goal||'hipertrofia'] || 75;
  const workSec = 45; // tempo médio executando uma série
  const totalSets = exercises.reduce((s,ex)=>s+(ex.sets||3),0);
  // tempo das séries + transição/ajuste por exercício (troca de máquina, anilhas) + aquecimento
  const mins = Math.round((totalSets*(workSec+restSec))/60 + (exercises.length||0)*1.5 + 5);
  return Math.max(20, Math.min(100, mins));
}
function slug(s){ return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

function buildRunBlocks(kind, setup){
  const terrain = setup.terrain || 'asfalto';
  const level = setup.level || 'iniciante';
  // Perfil de menor impacto: iniciantes com IMC alto ou 50+ anos começam com
  // blocos caminhada+corrida intercalados — protege articulações e reduz risco de lesão.
  // (Ajuste silencioso: o app nunca expõe o motivo em termos de peso.)
  const p = state.user && state.user.profile;
  const imcVal = (()=>{ try{ const r = calcIMC(); return r ? parseFloat(r.value) : null; }catch(e){ return null; } })();
  // Ser iniciante JÁ é motivo pra trote+caminhada. Antes, só quem tinha IMC>=30
  // ou 50+ anos recebia isso — o iniciante comum pegava 35 min de corrida contínua.
  const gentle = level==='iniciante'
    || (imcVal && imcVal >= 32 && level!=='avancado')
    || (p && p.age >= 60);

  const warm = {name:'Aquecimento',exs:[{name:'Caminhada leve',desc:'Ritmo natural, aumente gradualmente',min:gentle?7:5},{name:'Mobilidade dinâmica',desc:'Rotações + elevação de joelhos',min:2}]};
  const cool = {name:'Desaquecimento',exs:[{name:'Caminhada leve',desc:'Normalize os batimentos aos poucos',min:5}]};
  let main;

  if(kind==='Intervalado'){
    if(gentle){
      // Versão de baixo impacto: intervalos caminhada rápida / corrida leve
      main = {name:'Principal',exs:[
        {name:'6× 1 min corrida leve / 2 min caminhada rápida',desc:'Corra devagar, no ritmo que consegue conversar. A caminhada entre blocos é parte do treino, não pausa — mantenha ela ativa.',min:18},
        {name:'Caminhada moderada',desc:'Finalize com ritmo confortável',min:5}
      ]};
      return [warm, main, cool];
    }
    const nReps = setup._nReps || (level==='avancado'?8 : level==='intermediario'?6 : 5);
    if(terrain==='esteira'){
      // Na esteira não dá pra "dar tiros" com segurança: a mudança de velocidade é
      // gradual. O intervalado vira blocos de tempo com velocidade/inclinação.
      main = {name:'Principal',exs:[
        {name:`${nReps}× 2 min forte / 2 min leve`,desc:'Suba a velocidade até um ritmo desafiador (esforço 8/10), depois reduza pra recuperar. Ajuste a velocidade ANTES do bloco começar.',min:nReps*4},
        {name:'Opcional: inclinação 4-6%',desc:'Se preferir, mantenha a velocidade e use a inclinação como intensidade',min:0}
      ]};
    } else if(terrain==='trilha'){
      // Trilha tem terreno irregular: intervalado por esforço/tempo, não por distância
      main = {name:'Principal',exs:[
        {name:`${nReps}× 90s forte / 2 min leve`,desc:'Por esforço (8/10), não por ritmo — o terreno muda muito. Atenção redobrada com pisada em raízes e pedras.',min:Math.round(nReps*3.5)},
        {name:'Trote leve',desc:'Recuperação ativa em trecho plano',min:5}
      ]};
    } else if(terrain==='pista'){
      main = {name:'Principal',exs:[
        {name:`${nReps}× 400m rápido`,desc:'85% do máximo, recuperação 90s trotando. Use as marcações da pista.',min:Math.round(nReps*3.3)},
        {name:'Trote leve',desc:'Recuperação ativa',min:5}
      ]};
    } else { // asfalto
      main = {name:'Principal',exs:[
        {name:`${nReps}× 1 min forte / 90s leve`,desc:'Tiros por tempo (esforço 8/10) — mais seguro que por distância no asfalto. Escolha um trecho plano e sem cruzamentos.',min:Math.round(nReps*2.5)},
        {name:'Trote leve',desc:'Recuperação ativa',min:5}
      ]};
    }
  } else if(kind==='Corrida Longa'){
    if(gentle){
      main = {name:'Principal',exs:[{name:'30 min alternando: 3 min trote leve / 2 min caminhada',desc:'O objetivo é <b>tempo em movimento</b>, não velocidade. Se cansar, caminhe mais — isso não é falha, é o treino funcionando. Com as semanas os blocos de trote crescem sozinhos.',min:30}]};
      return [warm, main, cool];
    }
    const tips = {
      esteira:'Na esteira use inclinação de 1% pra simular a rua. Quebre mentalmente em blocos de 10 min.',
      trilha:'Na trilha o ritmo naturalmente cai — vá por tempo e esforço, não pelo ritmo. Leve água.',
      pista:'Na pista, alterne o sentido a cada 15 min pra não sobrecarregar um lado do corpo.',
      asfalto:'Ritmo confortável, converse sem ficar sem fôlego. Hidrate a cada 20 min.'
    };
    const longaMin = setup._mainMin || ({iniciante:35,intermediario:50,avancado:65}[level]||40);
    main = {name:'Principal',exs:[{name:'Corrida contínua',desc:tips[terrain]||tips.asfalto,min:longaMin}]};
  } else if(kind==='Ritmo Constante'){
    const tips = {
      esteira:'Trave a velocidade no ritmo alvo e segure — a esteira é ótima pra isso.',
      trilha:'Em trilha, mantenha o ESFORÇO constante (zona 3-4), o ritmo vai variar com o terreno.',
      pista:'Use as voltas pra conferir se o ritmo está estável (anote o tempo por volta).',
      asfalto:'Zona 3-4, um pouco desconfortável mas sustentável.'
    };
    const ritmoMin = setup._mainMin || ({iniciante:20,intermediario:25,avancado:32}[level]||25);
    main = {name:'Principal',exs:[{name:'Corrida em ritmo alvo',desc:tips[terrain]||tips.asfalto,min:ritmoMin}]};
  } else {
    if(gentle){
      main = {name:'Principal',exs:[{name:'20 min alternando: 2 min corrida leve / 2 min caminhada',desc:'ritmo de conversa (Zona 2) — você consegue falar frases inteiras enquanto corre. Esse formato constrói base protegendo joelhos e canelas.',min:20}]};
      return [warm, main, cool];
    }
    const tips = {
      esteira:'Ritmo leve, de conversa (Zona 2), com inclinação 1%. Bom dia pra assistir algo e deixar o tempo passar.',
      trilha:'Ritmo de conversa (Zona 2), aproveite a paisagem. Terreno leve, evite subidas fortes hoje.',
      pista:'Ritmo de conversa (Zona 2), bem tranquilo. Deixe os mais rápidos passarem por fora.',
      asfalto:'Ritmo de conversa (Zona 2) — você fala sem esforço. Esse treino constrói sua base aeróbica.'
    };
    const leveMin = setup._mainMin || ({iniciante:20,intermediario:30,avancado:40}[level]||20);
    main = {name:'Principal',exs:[{name:'Corrida em ritmo leve',desc:tips[terrain]||tips.asfalto,min:leveMin}]};
  }
  return [warm, main, cool];
}

// ---------- EXERCISE BANK ----------
// equip tags: 'casa' (peso corporal / sem equipamento), 'halteres' (halteres/anilhas soltas), 'academia' (máquinas/barras/cabos)
const EX_BANK = [
  {name:'Peito',emo:'🫸',color:'',items:[
    // ACADEMIA (máquinas, cabos, barra)
    {name:'Supino Reto com Barra',sub:'Peito (força)',equip:['academia']},
    {name:'Supino Inclinado com Barra',sub:'Peito Superior',equip:['academia']},
    {name:'Supino na Máquina (Hammer)',sub:'Peito',equip:['academia']},
    {name:'Crucifixo no Voador (Peck Deck)',sub:'Peito (isolador)',equip:['academia']},
    {name:'Crossover no Cabo (alto)',sub:'Peito Inferior',equip:['academia']},
    {name:'Crossover no Cabo (baixo)',sub:'Peito Superior',equip:['academia']},
    {name:'Supino na Máquina Inclinado',sub:'Peito Superior',equip:['academia']},
    // HALTERES
    {name:'Supino Reto com Halteres',sub:'Peito',equip:['academia','halteres']},
    {name:'Supino Inclinado com Halteres',sub:'Peito Superior',equip:['academia','halteres']},
    {name:'Crucifixo com Halteres',sub:'Peito (isolador)',equip:['academia','halteres']},
    {name:'Pullover com Halter',sub:'Peito / Serrátil',equip:['academia','halteres']},
    // CASA (peso corporal)
    {name:'Flexão de Braço',sub:'Peito / Tríceps',equip:['academia','halteres','casa']},
    {name:'Flexão Inclinada (pés elevados)',sub:'Peito Superior',equip:['casa','halteres','academia']},
    {name:'Flexão com Mãos Elevadas',sub:'Peito Inferior (iniciante)',equip:['casa','halteres','academia']},
    {name:'Flexão Diamante',sub:'Peito Central / Tríceps',equip:['casa','halteres','academia']},
    {name:'Flexão Arqueiro',sub:'Peito (unilateral avançado)',equip:['casa','academia']}
  ]},
  {name:'Costas',emo:'🧗',color:'',items:[
    // ACADEMIA
    {name:'Puxada Frontal no Pulley',sub:'Dorsais (largura)',equip:['academia']},
    {name:'Puxada com Triângulo',sub:'Dorsais / Romboides',equip:['academia']},
    {name:'Remada Baixa no Cabo',sub:'Costas Média (espessura)',equip:['academia']},
    {name:'Remada Cavalinho (T-Bar)',sub:'Costas Média',equip:['academia']},
    {name:'Remada na Máquina (Hammer)',sub:'Costas Média',equip:['academia']},
    {name:'Remada Articulada Sentada',sub:'Costas Média',equip:['academia']},
    {name:'Puxada Aberta (Pulldown)',sub:'Dorsais (largura)',equip:['academia']},
    {name:'Barra Fixa Pegada Neutra',sub:'Dorsais / Braquial',equip:['academia','casa']},
    {name:'Pullover na Polia',sub:'Dorsais (isolador)',equip:['academia']},
    {name:'Levantamento Terra',sub:'Cadeia posterior (força)',equip:['academia']},
    // HALTERES
    {name:'Remada Curvada com Barra',sub:'Costas Média',equip:['academia','halteres']},
    {name:'Remada Unilateral com Haltere',sub:'Dorsais (unilateral)',equip:['academia','halteres']},
    // CASA
    {name:'Barra Fixa',sub:'Dorsais / Bíceps',equip:['academia','casa']},
    {name:'Remada Invertida (mesa/barra baixa)',sub:'Costas (horizontal)',equip:['casa','academia']},
    {name:'Remada com Toalha na Porta',sub:'Costas',equip:['casa'],improv:true},
    {name:'Superman',sub:'Lombar / Costas Baixa',equip:['casa','halteres','academia']}
  ]},
  {name:'Ombro',emo:'🙆',color:'',items:[
    // ACADEMIA
    {name:'Desenvolvimento com Barra',sub:'Ombro (força)',equip:['academia']},
    {name:'Desenvolvimento na Máquina',sub:'Ombro',equip:['academia']},
    {name:'Elevação Lateral na Polia',sub:'Ombro Lateral',equip:['academia']},
    {name:'Elevação Lateral na Máquina',sub:'Ombro Lateral (isolador)',equip:['academia']},
    {name:'Elevação Y (halteres leves)',sub:'Trapézio Inferior / Saúde do Ombro',equip:['academia','halteres']},
    {name:'Face Pull no Cabo',sub:'Ombro Posterior / Postura',equip:['academia']},
    // HALTERES
    {name:'Desenvolvimento com Halteres',sub:'Ombro',equip:['academia','halteres']},
    {name:'Desenvolvimento Arnold',sub:'Ombro (completo)',equip:['academia','halteres']},
    {name:'Elevação Lateral com Halteres',sub:'Ombro Lateral',equip:['academia','halteres']},
    {name:'Elevação Posterior Curvado',sub:'Ombro Posterior',equip:['academia','halteres']},
    // CASA
    {name:'Pike Push-up',sub:'Ombro',equip:['casa','halteres','academia']},
    {name:'Elevação Lateral com Garrafas',sub:'Ombro Lateral',equip:['casa'],improv:true},
    {name:'Elevação Frontal com Garrafas',sub:'Ombro Frontal',equip:['casa'],improv:true},
    {name:'Flexão Pike Elevada',sub:'Ombro (avançado)',equip:['casa','academia']}
  ]},
  {name:'Bíceps',emo:'💪',color:'',items:[
    // ACADEMIA
    {name:'Rosca Direta com Barra',sub:'Bíceps',equip:['academia']},
    {name:'Rosca Scott no Banco',sub:'Bíceps (pico)',equip:['academia']},
    {name:'Rosca no Cabo',sub:'Bíceps (tensão contínua)',equip:['academia']},
    {name:'Rosca Scott na Máquina',sub:'Bíceps (pico)',equip:['academia']},
    {name:'Rosca Spider (banco inclinado)',sub:'Bíceps (pico, sem roubo)',equip:['academia','halteres']},
    // HALTERES
    {name:'Rosca Alternada com Halteres',sub:'Bíceps',equip:['academia','halteres']},
    {name:'Rosca Martelo com Halteres',sub:'Braquial / Antebraço',equip:['academia','halteres']},
    {name:'Rosca Concentrada',sub:'Bíceps (pico)',equip:['academia','halteres']},
    // CASA
    {name:'Chin-up (barra pegada supinada)',sub:'Bíceps / Costas',equip:['academia','casa']},
    {name:'Rosca com Mochila/Bolsa',sub:'Bíceps',equip:['casa'],improv:true},
    {name:'Rosca Martelo com Garrafas',sub:'Braquial / Antebraço',equip:['casa'],improv:true},
    {name:'Rosca Isométrica com Toalha',sub:'Bíceps (isometria)',equip:['casa'],improv:true}
  ]},
  {name:'Tríceps',emo:'🦾',color:'orange',items:[
    // ACADEMIA
    {name:'Tríceps na Polia com Barra',sub:'Tríceps',equip:['academia']},
    {name:'Tríceps Corda no Cabo',sub:'Tríceps (cabeça lateral)',equip:['academia']},
    {name:'Tríceps Testa (barra EZ)',sub:'Tríceps (cabeça longa)',equip:['academia']},
    {name:'Tríceps na Máquina (Mergulho)',sub:'Tríceps (isolador)',equip:['academia']},
    {name:'Supino Pegada Fechada',sub:'Tríceps / Peito (composto)',equip:['academia']},
    {name:'Extensão de Tríceps Acima da Cabeça (polia)',sub:'Tríceps (cabeça longa, alongado)',equip:['academia']},
    // HALTERES
    {name:'Tríceps Francês com Halteres',sub:'Tríceps (cabeça longa)',equip:['academia','halteres']},
    {name:'Tríceps Coice com Haltere',sub:'Tríceps',equip:['academia','halteres']},
    // CASA
    {name:'Mergulho no Banco',sub:'Tríceps',equip:['casa','halteres','academia']},
    {name:'Mergulho nas Paralelas',sub:'Tríceps / Peito',equip:['academia','casa']},
    {name:'Flexão Fechada (diamante)',sub:'Tríceps',equip:['casa','halteres','academia']},
    {name:'Tríceps Testa com Garrafa',sub:'Tríceps',equip:['casa'],improv:true}
  ]},
  {name:'Pernas',emo:'🦵',color:'orange',items:[
    // ACADEMIA
    {name:'Agachamento Livre com Barra',sub:'Quadríceps / Glúteos (força)',equip:['academia']},
    {name:'Agachamento no Smith',sub:'Quadríceps / Glúteos',equip:['academia']},
    {name:'Leg Press 45°',sub:'Quadríceps / Glúteos',equip:['academia']},
    {name:'Hack Machine',sub:'Quadríceps',equip:['academia']},
    {name:'Cadeira Extensora',sub:'Quadríceps (isolador)',equip:['academia']},
    {name:'Mesa Flexora',sub:'Posterior de Coxa (isolador)',equip:['academia']},
    {name:'Cadeira Adutora',sub:'Adutores',equip:['academia']},
    {name:'Cadeira Abdutora',sub:'Abdutores / Glúteo Médio',equip:['academia']},
    {name:'Cadeira Flexora Sentada',sub:'Posterior de Coxa (isolador)',equip:['academia']},
    {name:'Agachamento Búlgaro no Smith',sub:'Quadríceps / Glúteos (unilateral)',equip:['academia']},
    {name:'Nordic Curl',sub:'Posterior de Coxa (avançado)',equip:['casa','academia']},
    {name:'Leg Press Horizontal',sub:'Quadríceps / Glúteos',equip:['academia']},
    // HALTERES
    {name:'Agachamento Búlgaro',sub:'Quadríceps / Glúteos (unilateral)',equip:['academia','halteres','casa']},
    {name:'Afundo com Halteres',sub:'Quadríceps / Glúteos',equip:['academia','halteres']},
    {name:'Stiff com Halteres',sub:'Posterior / Glúteos',equip:['academia','halteres']},
    {name:'Agachamento Goblet',sub:'Quadríceps / Glúteos',equip:['academia','halteres']},
    // CASA
    {name:'Agachamento Livre (peso corporal)',sub:'Quadríceps / Glúteos',equip:['casa','halteres','academia']},
    {name:'Afundo Alternado',sub:'Quadríceps / Glúteos',equip:['casa','halteres','academia']},
    {name:'Agachamento Sumô',sub:'Adutores / Glúteos',equip:['casa','halteres','academia']},
    {name:'Step-up no Banco',sub:'Quadríceps / Glúteos',equip:['casa','halteres','academia']},
    {name:'Stiff Unilateral (peso corporal)',sub:'Posterior de Coxa',equip:['casa','halteres','academia']},
    {name:'Cadeira contra parede (isométrico)',sub:'Quadríceps (resistência)',equip:['casa','halteres','academia']},
    {name:'Agachamento Jump',sub:'Quadríceps (explosão)',equip:['casa','halteres','academia']}
  ]},
  {name:'Glúteos',emo:'🍑',color:'pink',items:[
    // ACADEMIA
    {name:'Elevação Pélvica (Hip Thrust)',sub:'Glúteos (força)',equip:['academia','halteres']},
    {name:'Coice na Polia (Glúteo no Cabo)',sub:'Glúteo Máximo',equip:['academia']},
    {name:'Glúteo na Máquina (Kickback)',sub:'Glúteo Máximo',equip:['academia']},
    {name:'Cadeira Abdutora (foco glúteo)',sub:'Glúteo Médio',equip:['academia']},
    // HALTERES + CASA
    {name:'Ponte de Glúteo',sub:'Glúteos',equip:['casa','halteres','academia']},
    {name:'Ponte com uma perna',sub:'Glúteos (unilateral)',equip:['casa','halteres','academia']},
    {name:'Coice de Cachorro (4 apoios)',sub:'Glúteo Máximo',equip:['casa','halteres','academia']},
    {name:'Concha (Clam Shell)',sub:'Glúteo Médio',equip:['casa','halteres','academia']},
    {name:'Abdução lateral de perna',sub:'Glúteo Médio',equip:['casa','halteres','academia']},
    {name:'Agachamento Sumô com Pausa',sub:'Glúteos / Adutores',equip:['casa','halteres','academia']}
  ]},
  {name:'Panturrilha',emo:'🦶',color:'teal',items:[
    {name:'Panturrilha em Pé na Máquina',sub:'Panturrilha (gastrocnêmio)',equip:['academia']},
    {name:'Panturrilha Sentada',sub:'Panturrilha (sóleo)',equip:['academia']},
    {name:'Panturrilha no Leg Press',sub:'Panturrilha',equip:['academia']},
    {name:'Panturrilha Donkey',sub:'Panturrilha (alongada)',equip:['academia']},
    {name:'Panturrilha em pé (peso corporal)',sub:'Panturrilha',equip:['casa','halteres','academia']},
    {name:'Panturrilha unilateral em degrau',sub:'Panturrilha (unilateral)',equip:['casa','halteres','academia']}
  ]},
  {name:'Trapézio',emo:'🤷',color:'',items:[
    {name:'Encolhimento com Barra',sub:'Trapézio',equip:['academia']},
    {name:'Encolhimento com Halteres',sub:'Trapézio',equip:['academia','halteres']},
    {name:'Encolhimento com Mochila/Bolsa',sub:'Trapézio',equip:['casa'],improv:true}
  ]},
  {name:'Core',emo:'🧱',color:'',items:[
    {name:'Prancha (Plank)',sub:'Core (estabilidade)',equip:['casa','halteres','academia']},
    {name:'Prancha Lateral',sub:'Oblíquos',equip:['casa','halteres','academia']},
    {name:'Abdominal Crunch',sub:'Reto abdominal',equip:['casa','halteres','academia']},
    {name:'Abdominal Bicicleta',sub:'Reto / Oblíquos',equip:['casa','halteres','academia']},
    {name:'Elevação de Pernas',sub:'Abdômen Inferior',equip:['casa','halteres','academia']},
    {name:'Russian Twist',sub:'Oblíquos (rotação)',equip:['casa','halteres','academia']},
    {name:'Dead Bug',sub:'Core Profundo (anti-extensão)',equip:['casa','halteres','academia']},
    {name:'Pallof Press (anti-rotação)',sub:'Core (anti-rotação)',equip:['academia']},
    {name:'Hollow Hold',sub:'Core (isometria avançada)',equip:['casa','halteres','academia']},
    {name:'Farmer Walk (caminhada carregada)',sub:'Core / Pegada',equip:['academia','halteres']},
    {name:'Mountain Climber',sub:'Core / Cardio',equip:['casa','halteres','academia']}
  ]}
];// ---------- HELPERS ----------
// Nomes antigos → padronizados. A migração move progresso/PRs/pins pro id novo (nada se perde).
const EX_RENAMES = [
  ['Mergulho no Banco/Cadeira','Mergulho no Banco'],
  ['Tríceps na Polia (barra)','Tríceps na Polia com Barra'],
  ['Rosca Scott (banco)','Rosca Scott no Banco'],
  ['Panturrilha em Pé (máquina/Smith)','Panturrilha em Pé na Máquina'],
  ['Panturrilha Sentado','Panturrilha Sentada'],
  ['Step-up em banco/degrau','Step-up no Banco']
];
// Campos-base com tipo errado (backup editado, versão antiga, corrupção)
// derrubavam telas inteiras. Aqui eles voltam ao formato esperado.
function ensureStateShape(){
  let mudou = false;
  try{
    if(!state || typeof state !== 'object') return false;
    if(!state.modules || typeof state.modules !== 'object'){ state.modules = {lift:null, run:null}; mudou=true; }
    if(!Array.isArray(state.weights)){ state.weights = []; mudou=true; }
    if(!Array.isArray(state.trophies)){ state.trophies = []; mudou=true; }
    if(!state.progress || typeof state.progress !== 'object'){ state.progress = {}; mudou=true; }
    if(!state.prs || typeof state.prs !== 'object'){ state.prs = {}; mudou=true; }
    if(!state.ui || typeof state.ui !== 'object'){ state.ui = {tab:'home', selectedSession:null}; mudou=true; }
    if(state.user && typeof state.user === 'object' && (!state.user.profile || typeof state.user.profile !== 'object')){ state.user.profile = {}; mudou=true; }
  }catch(e){}
  return mudou;
}
function migrateExerciseIds(){
  try{
    let changed=false;
    if(ensureStateShape()) changed = true;
    // Números salvos como TEXTO (backup editado, versão antiga) faziam a soma virar
    // concatenação — e derrubavam checkTrophies inteiro. Normaliza na entrada.
    // Plano sem lista de treinos (backup corrompido) quebrava a Home em 27 pontos.
    // Vira "sem plano" — estado que o app inteiro já sabe tratar.
    ['lift','run'].forEach(mk=>{
      const md0 = state.modules && state.modules[mk];
      if(md0 && md0.plan && !Array.isArray(md0.plan.workouts)){ md0.plan = null; changed = true; }
    });
    ['lift','run'].forEach(mk=>{
      const md = state.modules && state.modules[mk];
      if(!md || !Array.isArray(md.history)) return;
      md.history.forEach(h=>{
        ['distance','duration','plannedDuration','rating'].forEach(campo=>{
          if(h[campo] === undefined || h[campo] === null) return;
          if(typeof h[campo] === 'number' && isFinite(h[campo])) return;
          const n = parseFloat(String(h[campo]).replace(',','.'));
          if(isFinite(n) && n >= 0) h[campo] = n; else delete h[campo];
          changed = true;
        });
        if(typeof h.at !== 'number' || !isFinite(h.at) || h.at <= 0){
          const t = new Date(h.at).getTime();
          h.at = isFinite(t) && t > 0 ? t : Date.now();
          changed = true;
        }
      });
    });
    // startAt salvo COM hora (versões antigas) fazia "hoje" contar como futuro — normaliza pra meia-noite
    ['lift','run'].forEach(mk=>{
      const md = state.modules && state.modules[mk];
      if(md && md.startAt){
        const d = new Date(md.startAt);
        if(d.getHours() || d.getMinutes() || d.getSeconds() || d.getMilliseconds()){
          d.setHours(0,0,0,0); md.startAt = d.getTime(); changed = true;
        }
      }
    });
    EX_RENAMES.forEach(([oldN,newN])=>{
      const o=slug(oldN), n=slug(newN); if(o===n) return;
      if(state.progress && state.progress[o]){ state.progress[n]=(state.progress[n]||[]).concat(state.progress[o]); delete state.progress[o]; changed=true; }
      if(state.prs && state.prs[o]){ if(!state.prs[n]) state.prs[n]=state.prs[o]; delete state.prs[o]; changed=true; }
      const mod=state.modules && state.modules.lift;
      ((mod&&mod.plan&&mod.plan.workouts)||[]).forEach(w=>{
        (w.pins||[]).forEach(pn=>{ if(pn.id===o){pn.id=n;changed=true;} if(pn.origId===o){pn.origId=n;changed=true;} });
        (w.exercises||[]).forEach(e=>{ if(e.id===o){ e.id=n; e.name=newN; changed=true; } });
      });
    });
    if(changed) saveData();
  }catch(e){}
}
// Padrão de movimento do exercício (pra variar estímulos de verdade, não só o nome)
function exPattern(name){
  const n = (name||'').toLowerCase();
  if(/terra|stiff|elevação pélvica|hip thrust|ponte|nordic/.test(n)) return 'dobradica';
  if(/agach|leg press|hack|búlgaro|afundo|extensora|step|belt squat|cadeira contra/.test(n)) return 'agachar';
  if(/supino|flexão|crossover|crucifixo|paralela|mergulho|peck/.test(n)) return 'empurrar_h';
  if(/desenvolvimento|pike|militar|arnold|cuban/.test(n)) return 'empurrar_v';
  if(/puxada|barra fixa|chin|pulldown|pullover/.test(n)) return 'puxar_v';
  if(/remada|face pull|superman/.test(n)) return 'puxar_h';
  if(/rosca|tríceps|elevação lateral|elevação frontal|elevação posterior|elevação y|encolhimento|panturrilha|coice|concha|abdução|extensão acima/.test(n)) return 'isolador';
  return 'outro';
}
// Grandes compostos que definem um treino de FORÇA de verdade
const FORCA_PRIORITY = /agachamento livre|levantamento terra|supino reto|desenvolvimento com barra|barra fixa|remada curvada|leg press|hip thrust|elevação pélvica/;
function forcaRank(ex){
  const n=(ex.name||'').toLowerCase();
  if(FORCA_PRIORITY.test(n)) return 0;                 // compostos pesados primeiro
  if(exPattern(ex.name)==='isolador') return 2;        // isoladores por último
  return 1;
}
function $(id){ return document.getElementById(id); }
function showScreen(id){
  if(id==='scr-auth'){ try{ resetAuthUI(); }catch(e){} } document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); $(id).classList.add('active'); window.scrollTo({top:0,behavior:'instant'}); }
function toast(msg, ms){
  let wrap = document.getElementById('toast-wrap');
  if(!wrap){ wrap = document.createElement('div'); wrap.id='toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div'); t.className='toast'; t.textContent = msg;
  wrap.appendChild(t);
  // O tempo acompanha o tamanho do texto: "✅ Salvo!" some rápido, uma frase
  // de duas linhas fica no ar o suficiente pra ser lida (teto de 7s).
  const txt = String(msg||'');
  const dur = ms || Math.max(2800, Math.min(7000, 2400 + txt.length*38));
  setTimeout(()=>{ t.style.transition='opacity .35s ease'; t.style.opacity='0'; }, dur-350);
  setTimeout(()=>t.remove(), dur);
}
function getDayIdx(){ const d=new Date().getDay(); return d===0?7:d; }
// Detecta treinos do plano que estavam marcados pra dias ANTERIORES desta semana
// e não foram registrados — pra sugerir "recuperar" sem quebrar a grade fixa de dias.
function missedWorkoutsThisWeek(mod){
  if(!mod || !mod.plan) return [];
  if(vacationActive()) return []; // em férias não existe treino "perdido"
  const today = getDayIdx();
  const startWk = new Date(); startWk.setHours(0,0,0,0); startWk.setDate(startWk.getDate()-(today-1));
  const t0 = startWk.getTime();
  const hist = mod.history||[];
  const modKey = (mod===state.modules.lift)?'lift':(mod===state.modules.run)?'run':null;
  const skips = (state.skips||[]).filter(s=>s.at>=t0 && (!modKey || s.module===modKey));
  // não considera "perdido" nenhum dia anterior à criação do plano —
  // aluno novo que começa numa quinta não deve ver segunda/terça como treinos perdidos
  const created = (typeof planStartTs==='function' ? planStartTs(mod) : 0) || mod.createdAt || Date.now();
  return (mod.plan.workouts||[]).filter(w=>{
    if(w.dayIdx >= today) return false; // só dias que já passaram nesta semana
    // qual foi a data/hora desse dia da semana? se foi antes de criar o plano, ignora
    const dayDate = t0 + (w.dayIdx-1)*86400000;
    const endOfThatDay = dayDate + 86400000; // fim do dia
    if(endOfThatDay <= created) return false; // o dia terminou antes de a conta/plano existir
    // pulou de propósito esse treino nesta semana? então não é "falta"
    if(skips.some(s=>s.k===w.k || s.dayIdx===w.dayIdx)) return false;
    // registrou algo desse treino nesta semana?
    const did = hist.some(h=>{ if(h.at<t0) return false; return h.id===w.k || (h.dayIdx===w.dayIdx); });
    return !did;
  });
}
// Linha de status inteligente sob a saudação: lê o momento do aluno e diz algo útil,
// não uma frase genérica. Prioridade: já treinou > adaptado > prova > sequência > pendência > convite.
// Resumo da semana passada — aparece na segunda-feira, uma vez por semana.
function renderWeekRecap(){
  const card = $('card-weekrecap'); if(!card) return;
  if(getDayIdx() !== 1){ card.classList.add('hidden'); return; } // só na segunda
  const segAtual = new Date(); segAtual.setHours(0,0,0,0);
  const chave = segAtual.getTime();
  if(state.ui.weekRecapSeen === chave){ card.classList.add('hidden'); return; }
  const ini = chave - 7*86400000, fim = chave;
  const H = [...(state.modules.lift?.history||[]), ...(state.modules.run?.history||[])].filter(x=>x.at>=ini && x.at<fim);
  if(!H.length){ card.classList.add('hidden'); return; }
  const treinos = H.length;
  const km = H.reduce((s,x)=>s+(x.distance||0),0);
  const exs = H.reduce((s,x)=>s+((x.exercisesDone||[]).length),0);
  const prs = Object.values(state.prs||{}).filter(p=>p.at>=ini && p.at<fim).length;
  const streak = calcStreak([...(state.modules.lift?.history||[]), ...(state.modules.run?.history||[])]);
  const partes = [`${treinos} ${treinos===1?'treino':'treinos'}`];
  if(km>0) partes.push(`${km.toFixed(1)} km`);
  if(exs>0) partes.push(`${exs} exercícios`);
  if(prs>0) partes.push(`${prs} ${prs===1?'recorde':'recordes'} 🏆`);
  if(streak>=2) partes.push(`sequência de ${streak} dias 🔥`);
  card.classList.remove('hidden');
  card.classList.add('anim-pop');
  $('weekrecap-msg').textContent = partes.join(' · ') + '. Toque para ver o resumo completo.';
  card.onclick = (ev)=>{ if(ev.target && ev.target.id==='weekrecap-dismiss') return; openWeekSummary(); };
  const btn = $('weekrecap-dismiss');
  if(btn) btn.onclick = (ev)=>{ ev.stopPropagation(); state.ui.weekRecapSeen = chave; saveData(); card.classList.add('hidden'); };
}
function pickDay(arr){ return arr[new Date().getDate() % arr.length]; }
function hashStr(str){ let h=0; str=String(str||'x'); for(let i=0;i<str.length;i++){ h=(h*31 + str.charCodeAt(i))|0; } return Math.abs(h); }
function homeStatusLine(){
  const mod = state.modules[state.active];
  const isLift = state.active === 'lift';
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const doDia = arr => (arr||[]).filter(x=>{ const d=new Date(x.at); d.setHours(0,0,0,0); return d.getTime()===hoje.getTime(); });

  const feitosAtivo = doDia(mod && mod.history);                       // treinos de HOJE no módulo que está aberto
  const outroMod = isLift ? state.modules.run : state.modules.lift;
  const feitosOutro = doDia(outroMod && outroMod.history);             // treinos de HOJE no outro módulo
  const todosH = [...(state.modules.lift?.history||[]), ...(state.modules.run?.history||[])];
  const streak = calcStreak(todosH);
  const a = adaptMode();
  const h = new Date().getHours();
  const w = mod && mod.plan && Array.isArray(mod.plan.workouts) && mod.plan.workouts.find(x=>x.dayIdx===getDayIdx());
  const nomeOutro = isLift ? 'corrida' : 'musculação';
  const nomeAtivo = isLift ? 'musculação' : 'corrida';

  // 1) já treinou hoje NESTE módulo
  if(feitosAtivo.length){
    const min = Math.round(feitosAtivo.reduce((s,x)=>s+(x.duration||0),0));
    if(feitosAtivo.length>1) return `Dois treinos de ${nomeAtivo} hoje, ${min} min no total. Isso é dedicação. 🔥`;
    if(feitosOutro.length) return `${isLift?'Musculação':'Corrida'} e ${nomeOutro} no mesmo dia. Dia cheio — agora hidrate e coma bem. 💪`;
    if(streak>=7) return `${isLift?'Treino':'Atividade'} de hoje: feito. ${streak} dias seguidos — você virou hábito. 🔥`;

    const alvo = isLift ? 'Treino' : 'Atividade';
    return pickDay([
      `${alvo} de hoje concluíd${isLift?'o':'a'} em ${min} min. Agora deixa o corpo fazer a parte dele. ✅`,
      `${min} min no bolso hoje. Recuperação também é treino — descanse bem. 💪`,
      `Missão de hoje cumprida em ${min} min. Amanhã a gente continua. 🔥`,
      `Feito! ${min} min hoje. O progresso é a soma dos dias como esse. 👏`
    ]);
  }

  // 2) treinou no OUTRO módulo, mas ainda não neste
  if(feitosOutro.length){
    if(w) return `Você já fez ${nomeOutro} hoje. Ainda tem ${w.name.toLowerCase()} no plano — se o corpo responder bem, vá com carga moderada.`;
    return `Você já fez ${nomeOutro} hoje. Aqui na ${nomeAtivo} é dia de descanso — combinação perfeita. 😌`;
  }

  // 3) modo adaptado
  if(a.active){
    if(a.pain.length) return `Hoje é dia de cuidar: treinos adaptados por dor em ${a.pain.join(', ').toLowerCase()}.`;
    if(a.tpm) return 'Modo leve ativo. Vá no seu ritmo — hoje o corpo manda. 💗';
    return 'Modo leve ativo. Menos volume, mesma constância. 💚';
  }

  // 4) prova chegando
  if(!isLift){
    const dr = daysToRace();
    if(dr!==null && dr>=0 && dr<=7) return dr===0 ? 'É HOJE. Confie no treino que você fez. 🏁' : `Faltam ${dr} dias pra sua prova. Últimos ajustes — nada de heroísmo agora.`;
  }

  // 5) tem treino hoje e ainda não fez → mensagem conforme a HORA (o horário/corpo tem prioridade)
  if(w){
    const ultimo = todosH.length ? todosH.reduce((x,y)=>x.at>y.at?x:y) : null;
    const diasParado = ultimo ? Math.floor((Date.now()-ultimo.at)/86400000) : null;
    const oQue = w.name.toLowerCase();
    // 00h–03h: ninguém deveria estar treinando. Tom leve, empurrando pra cama (vem ANTES do "recomeçar").
    if(h < 3){
      const corujas = [
        `🦉 Passou da meia-noite… O ${oQue} não vai fugir, mas seu sono, sim. Vai dormir!`,
        `🦉 Uhu! A esta hora até a coruja já foi deitar. ${oQue.charAt(0).toUpperCase()+oQue.slice(1)} amanhã, combinado?`,
        `🌙 Treinar agora? O único levantamento recomendado é o do cobertor. Boa noite!`,
        `🦉 Seu corpo constrói músculo dormindo. Tecnicamente, a cama é o melhor equipamento agora.`
      ];
      return corujas[new Date().getDate() % corujas.length];
    }
    if(h < 6)  return `Madrugada e você aqui? Se for treinar ${oQue}, aqueça bem — o corpo ainda está frio. 🌙`;
    // retorno após dias parado — só em horário de treinar (6h–21h), pra não empurrar treino de madrugada/noite
    if(diasParado !== null && diasParado >= 5 && h < 21) return `Faz ${diasParado} dias desde o último treino. Hoje é um bom dia pra recomeçar — comece leve. 👋`;
    if(h < 12) return streak>=3 ? `${streak} dias de sequência. Hoje tem ${oQue} — comece o dia mantendo a corrente. 🔥`
                                : pickDay([
                                    `Bom começo de dia: hoje tem ${oQue} esperando por você. ☀️`,
                                    `Manhã perfeita pra ${oQue}. Comece o dia já mais forte. ☀️`,
                                    `Hoje tem ${oQue} no plano. Que tal já tirar essa da frente? 💪`,
                                    `Cedo é o melhor horário: ninguém rouba seu treino de ${oQue} de manhã. 🌅`
                                  ]);
    if(h < 18) return streak>=3 ? `${streak} dias de sequência e hoje tem ${oQue}. Não deixe pra depois. 🔥`
                                : pickDay([
                                    `Hoje você ainda não treinou. No plano: ${oQue}. A tarde rende. 💪`,
                                    `A tarde é sua: ${oQue} te espera. Bora aproveitar? 🌤️`,
                                    `Ainda dá tempo de encaixar ${oQue} hoje. Depois é só orgulho. 😎`,
                                    `No plano de hoje: ${oQue}. Um passo de cada vez, começando agora. 💪`
                                  ]);
    if(h < 21) return pickDay([
      `Ainda dá tempo: hoje tem ${oQue}. Uma hora agora vale mais que a intenção de amanhã. 🌆`,
      `Fim de tarde é ótimo pra ${oQue}. Fecha o dia com chave de ouro. 🌆`,
      `Depois do dia corrido, nada como descarregar tudo no ${oQue}. 💪`,
      `Hoje tem ${oQue}. Você no fim do dia vai agradecer por ter ido. 🙌`
    ]);
    if(h < 23) return `Tarde da noite, mas ainda dá pra fazer ${oQue}. Se estiver muito cansado, dormir bem também é treino. 🌙`;
    return `Já é quase meia-noite e hoje tinha ${oQue}. Sem culpa — durma bem e recomece amanhã com tudo. 😴`;
  }

  // 6) dia de descanso neste módulo
  if(h < 3) return '🦉 Madrugada alta e nem treino tem hoje. Aproveite: durma. É de graça e funciona.';
  if(streak>=5) return `Descanso na ${nomeAtivo} — e você tem ${streak} dias de sequência. Descansar é parte do treino. 😴`;
  if(h >= 21) return pickDay([
    `Descanso hoje. Um sono bom vale mais que qualquer série. 😴`,
    `Nada de treino hoje. Um sono de qualidade é o melhor suplemento. 😴`,
    `Descanso merecido. Recupere bem que amanhã o corpo agradece. 🌙`
  ]);
  return pickDay([
    `Hoje é dia de descanso na ${nomeAtivo}. Recupere bem, amanhã tem mais. 😴`,
    `Folga na ${nomeAtivo} hoje. Músculo cresce no repouso — aproveite. 🌱`,
    `Dia de recarregar as energias. Descanso também constrói resultado. 🔋`,
    `Sem treino de ${nomeAtivo} hoje. Curta o descanso, você merece. 😌`
  ]);
}
function greetTime(){ const h=new Date().getHours(); if(h<5) return 'Boa noite'; if(h<12) return 'Bom dia'; if(h<18) return 'Boa tarde'; return 'Boa noite'; }
function firstName(){ const p = state.user.profile; return (p&&p.nickname) || (state.user.name||'').split(' ')[0]; }
// ---------- VÍDEOS PERSONALIZADOS DOS EXERCÍCIOS ----------
// O treinador cadastra links no painel admin (coleção videosExercicios).
// "Ver como fazer" usa o link do treinador; sem link cadastrado, cai na busca do YouTube.
let videoLinks = {};
let videoCredits = {}; // crédito por exercício (link do perfil de quem gravou — qualquer rede)
async function loadVideoLinks(){
  try{
    const snap = await db.collection('videosExercicios').get();
    videoLinks = {}; videoCredits = {};
    snap.forEach(doc=>{ const d=doc.data(); if(d.url) videoLinks[doc.id]=d.url; if(d.credito) videoCredits[doc.id]=d.credito; });
    try{ localStorage.setItem('metatreino_videos', JSON.stringify(videoLinks)); }catch(e){}
    try{ localStorage.setItem('metatreino_video_credits', JSON.stringify(videoCredits)); }catch(e){}
  }catch(e){
    // offline: usa o cache
    try{ videoLinks = JSON.parse(localStorage.getItem('metatreino_videos')||'{}'); }catch(e2){ videoLinks={}; }
    try{ videoCredits = JSON.parse(localStorage.getItem('metatreino_video_credits')||'{}'); }catch(e2){ videoCredits={}; }
  }
}
function ytLink(ex){
  const custom = videoLinks[slug(ex)];
  if(custom) return custom;
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent('como fazer '+ex+' técnica correta');
}
// extrai o ID de 11 caracteres de qualquer formato de link do YouTube
function ytVideoId(url){
  if(!url) return null;
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
// detecta a rede social a partir do link do perfil (funciona com qualquer uma)
function socialInfo(url){
  if(!url) return null;
  const u = String(url).trim(); let m;
  if(/instagram\.com/i.test(u)){ m=u.match(/instagram\.com\/([^\/?#]+)/i); return {icon:'📸', handle: m&&m[1]?'@'+m[1].replace(/^@/,''):'Instagram'}; }
  if(/tiktok\.com/i.test(u)){ m=u.match(/tiktok\.com\/@?([^\/?#]+)/i); return {icon:'🎵', handle: m&&m[1]?'@'+m[1].replace(/^@/,''):'TikTok'}; }
  if(/(youtube\.com|youtu\.be)/i.test(u)){ m=u.match(/youtube\.com\/@([^\/?#]+)/i); return {icon:'▶️', handle: m&&m[1]?'@'+m[1]:'YouTube'}; }
  if(/(twitter\.com|x\.com)/i.test(u)){ m=u.match(/(?:twitter|x)\.com\/([^\/?#]+)/i); return {icon:'𝕏', handle: m&&m[1]?'@'+m[1].replace(/^@/,''):'X'}; }
  if(/facebook\.com/i.test(u)){ m=u.match(/facebook\.com\/([^\/?#]+)/i); return {icon:'📘', handle: m&&m[1]?m[1]:'Facebook'}; }
  return {icon:'🔗', handle:'ver perfil'};
}
// "Ver como fazer": se o treinador cadastrou um link de VÍDEO, toca dentro do app (embed).
// Sem link (ou link que não seja um vídeo do YouTube), mantém a busca abrindo no YouTube.
function playExercise(name){
  const url = videoLinks[slug(name)];
  const id = url ? ytVideoId(url) : null;
  if(id){
    const isShort = /\/shorts\//.test(String(url));
    const embed = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
    $('modal-inner').classList.add('modal-video');
    if(isShort) $('modal-inner').classList.add('short');
    $('modal-back').classList.add('video-open');
    const cred = videoCredits[slug(name)];
    const info = cred ? socialInfo(cred) : null;
    const creditLine = info
      ? `<a href="${escHtml(cred)}" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:10px;color:var(--text-dim);font-size:12px;text-decoration:none">🎥 Demonstração por <b style="color:var(--primary-2)">${escHtml(info.handle)}</b> <span>${info.icon}</span></a>`
      : '';
    $('modal-inner').innerHTML = `
      <div class="mv-head"><span style="font-size:20px">🎬</span><div class="mv-title">${escHtml(name)}</div></div>
      <div class="mv-frame${isShort?' short':''}"><iframe src="${embed}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>
      ${creditLine}
      <div class="mv-tip">💡 Toque no vídeo pra ver em tela cheia.</div>
      <div class="mv-actions">
        <a href="${escHtml(url)}" target="_blank" rel="noopener" style="color:var(--text-dim);font-size:12.5px;text-decoration:none">Abrir no YouTube ↗</a>
        <button class="btn btn-primary" style="padding:9px 20px" onclick="closeModal()">Fechar</button>
      </div>`;
    $('modal-back').classList.add('on');
  } else {
    window.open(ytLink(name), '_blank');
  }
}

// ---------- MODULE TOGGLE ----------
function renderModToggle(){
  const el = $('mod-toggle'); const a = state.active;
  const cur = a==='lift' ? {emo:'🏋️',name:'Musculação',cls:'lift'} : {emo:'🏃',name:'Corrida',cls:'run'};
  const other = a==='lift' ? {emo:'🏃',name:'Corrida',to:'run'} : {emo:'🏋️',name:'Musculação',to:'lift'};
  el.innerHTML = `<div class="mod-cur ${cur.cls}"><span style="font-size:20px">${cur.emo}</span><span>${cur.name}</span></div><button class="mod-switch" onclick="switchModule('${other.to}')">⇄ Ir para <span style="font-size:16px">${other.emo}</span> ${other.name}</button>`;
}
function switchModule(to){
  // Corrida sem plano (com ou sem registros) → abre a tela de escolha, não o setup direto
  if(to==='run' && (!state.modules.run || !state.modules.run.plan)){
    ensureActivityLog(); state.active='run'; saveData(); goTab('home'); return;
  }
  // destino sem MÓDULO ou sem PLANO → leva pro setup (antes dizia "trocado" e a tela não mudava)
  if(!state.modules[to] || !state.modules[to].plan){ state.active=to; saveData(); openSetupScreen(to); prefillSetupFromQuiz(to); return; }
  state.active = to; saveData(); goTab('home'); toast('Trocado para '+(to==='lift'?'🏋️ Musculação':'🏃 Corrida'));
}
function switchModuleUI(){ switchModule(state.active==='lift'?'run':'lift'); }

// ---------- TAB NAV ----------
function goTab(tab){
  state.ui.tab = tab; saveData();
  $('tab-library').style.display = state.active==='lift' ? 'flex' : 'none';
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
  $('tabbar').classList.remove('hidden');
  const map = {home:'scr-home',sessions:'scr-sessions',library:'scr-library',perf:'scr-perf',history:'scr-history',plan:'scr-plan',profile:'scr-profile'};
  showScreen(map[tab] || 'scr-home');
  updateDeco(tab);
  updateFab(tab);
  applyMuralLogo(); // a logo do treinador vale em todas as abas
  if(tab==='home') renderHome();
  else if(tab==='sessions') renderSessions();
  else if(tab==='library') renderLibrary();
  else if(tab==='perf') renderPerf();
  else if(tab==='history'){ histLimit = HIST_PAGE; renderHistory(); }
  else if(tab==='plan') renderPlan();
  else if(tab==='profile') renderProfile();
}

// tela de escolha quando o módulo de corrida existe só como registro de atividades (sem plano)
function renderRunLogScreen(){
  renderModToggle();
  const mod = state.modules.run;
  const n = (mod && mod.history) ? mod.history.length : 0;
  const sub = document.getElementById('runlog-sub');
  if(sub) sub.textContent = n>0
    ? `Você tem ${n} atividade${n>1?'s':''} registrada${n>1?'s':''}. Monte um plano completo ou continue só registrando.`
    : 'Você ainda não montou um plano de corrida. Monte um plano completo ou registre atividades avulsas (bike, caminhada, corrida).';
}
// ---------- HOME ----------
// Fonte ÚNICA da verdade sobre "treinou hoje" (usada pelo card, saudação e assistente)
function entriesHoje(mod){
  const h=new Date(); h.setHours(0,0,0,0);
  return ((mod&&mod.history)||[]).filter(x=>{ const t=new Date(x.at); t.setHours(0,0,0,0); return t.getTime()===h.getTime(); });
}
function treinouHoje(mod){ return entriesHoje(mod).length>0; }
function renderHome(){
  if(!state || !state.user){ try{ showScreen('scr-auth'); }catch(e){} return; }   // logout no meio de um render
  try{ ensureStateShape(); }catch(e){}
  try{ if(state.ui && state.ui.mesFechado && !state.ui.mesFechado.visto) setTimeout(showMesFechado, 900); }catch(e){}
  renderModToggle();
  const mod = state.modules[state.active];
  if(!mod){ showPickScreen(); return; }
  // Semana nova → varia os exercícios (trocas fixadas do aluno são mantidas pelo applyPins)
  try{
    const _wkNow = Math.floor(Date.now()/(7*86400000));
    if(state.lastVarWeek !== _wkNow){
      const tinhaPlano = !!(state.modules.lift && state.modules.lift.plan);
      state.lastVarWeek = _wkNow;
      if(tinhaPlano){ regenLiftExercises(); toast('🔄 Semana nova: variei alguns exercícios (suas trocas fixadas continuam). '); }
      saveData();
    }
  }catch(e){}
  if(!mod.plan){ showScreen('scr-runlog'); renderRunLogScreen(); return; } // corrida em modo registro (sem plano)
  const isLift = state.active==='lift';
  renderAvatar('home-avatar');
  if(typeof updateFabNudge==='function') updateFabNudge();
  $('home-hi').textContent = `${greetTime()}, ${firstName()}! 👋`;
  const _glue = t => String(t||'').replace(/ (?=[^ ]*$)/, '\u00A0'); // cola o emoji final na última palavra
  const _wl = (typeof weatherHomeLine==='function') ? weatherHomeLine() : null;
  const _ps = (typeof preStartInfo==='function') ? preStartInfo() : null;
  const _linha = _ps ? preStartStatusLine(_ps) : homeStatusLine();
  // com plano agendado pra frente, o clima entra só se for útil (não "boa noite pra descansar")
  const _mostraClima = !_ps || _ps.dias <= 3;
  const _naCapa = !!(coachMural && coachMural.foto && coachMural.capa);
  $('home-goal').innerHTML = _glue(_linha) + ((_wl && _mostraClima) ? `<br><span style="opacity:${_naCapa?'.85':'.6'};font-size:.9em">${_glue(_wl)}</span>` : '');
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  // 40% de chance de mostrar uma frase contextual (se houver); senão, uma do dia
  const ctxQuote = _ps ? preStartQuote(_ps) : (Math.random() < 0.4 ? contextualQuote() : null);
  const qSeed = doy + hashStr((state.user && state.user.email) || 'x'); // cada pessoa tem a SUA frase no mesmo dia
  $('daily-quote').textContent = ctxQuote || QUOTES[qSeed % QUOTES.length];
  renderCoachMural();
  try{ applyHeroCapa(); }catch(e){}

  const days = accessDaysLeft();
  // vitalício: título já diz "Acesso vitalício" — o subtítulo precisa dizer outra coisa
  // O tempo de acesso já aparece no Perfil — repetir na Home é ruído.
  // Só mostra aqui quando está acabando (aí vira aviso útil).
  const cAcc = $('card-access-info');
  if(cAcc) cAcc.classList.toggle('hidden', !(days>0 && days<=15));
  const ad = $('access-days');
  if(ad) ad.textContent = days>=999999 ? 'Sem data de expiração' : accessLabel(days);
  const cardAccess = $('card-access-info');
  cardAccess.querySelector('.card-title').textContent = days>=999999 ? '♾️ Acesso vitalício' : days>0 ? 'Acesso ativo' : 'Acesso expirado';

  // trophies count
  $('trophy-count').textContent = `${state.trophies.length} de ${TROPHIES.length} conquistas`;

  // race target card (only for run)
  const _ri = state.active==='run' ? raceInfo() : null;
  const daysToR = state.active==='run' ? daysToRace() : null;
  const alertCard = $('card-plan-alert');
  // DIA DA PROVA: antes da largada = checklist; depois da largada = "como foi?"
  if(_ri && _ri.hoje){
    alertCard.classList.remove('hidden');
    // texto longo: esconde a coluna do ícone pra não roubar largura (o emoji fica no título)
    const _ic = alertCard.querySelector('.card-icon'); if(_ic) _ic.style.display = 'none';
    if(_ri.depoisDaLargada){
      const jaRegistrou = raceEntryToday();
      if(jaRegistrou){
        alertCard.querySelector('.card-title').textContent = '🏅 Prova concluída!';
        alertCard.querySelector('.card-sub').innerHTML = `Registrada: <b>${jaRegistrou.distance||'—'}km</b> em <b>${fmtDur(jaRegistrou.duration||0)}</b>${jaRegistrou.pace?' · '+jaRegistrou.pace:''}. Aproveite o dia — você merece. 🎉`;
      } else {
        alertCard.querySelector('.card-title').textContent = '🏁 E aí, como foi a prova? 🎉';
        alertCard.querySelector('.card-sub').innerHTML = 'Você chegou lá! Registra a corrida que eu comparo com seu histórico e te digo o que achei. 👇<br><button class="btn btn-primary btn-block" style="margin-top:10px" onclick="openRunLog(\'livre\')">🏅 Registrar minha prova</button>';
      }
    } else {
      alertCard.querySelector('.card-title').textContent = _ri.horaFmt ? `🏁 É HOJE! Largada às ${_ri.horaFmt}` : '🏁 É HOJE!';
      alertCard.querySelector('.card-sub').innerHTML =
        'Confie no treino que você fez. Checklist rápido:<br>' +
        '• ☕ Coma leve 2-3h antes (nada novo hoje)<br>' +
        '• 👟 Use o tênis de sempre — nunca estreie no dia<br>' +
        '• ⏰ Chegue cedo e aqueça 10 min com trote leve<br>' +
        '• 🐢 Largue mais devagar do que a empolgação pede<br>' +
        '• 💧 Beba água nos postos, mesmo sem sede' +
        ((t=>t&&t.dicas&&t.dicas.length ? `<br><br><b style="color:#7dd3fc">${t.titulo}</b><br>${t.dicas.map(d=>'• '+d).join('<br>')}` : '')(typeof runWeatherTips==='function'?runWeatherTips(_ri.hora?_ri.largada:null):null));
    }
  }
  else if(daysToR !== null && daysToR >= 0 && daysToR < 365){
    alertCard.classList.remove('hidden');
    const _ic2 = alertCard.querySelector('.card-icon'); if(_ic2){ _ic2.style.display=''; _ic2.textContent = '🏁'; }
    alertCard.querySelector('.card-title').textContent = daysToR===0 ? 'É HOJE! 🎉' : `${daysToR} dia${daysToR>1?'s':''} para sua prova`;
    // previsão de tempo no ritmo atual (Riegel) — só com histórico suficiente
    var _prev = '';
    try{
      const alvoKm = { '5km':5, '10km':10, '21km':21.1, '42km':42.2 }[(state.modules.run.setup||{}).goal];
      const pr = alvoKm ? racePrediction(alvoKm) : null;
      if(pr){
        const mm = Math.floor(pr.min), ss = String(Math.round((pr.min-mm)*60)).padStart(2,'0');
        _prev = `<br><br>🔮 <b>No seu ritmo atual</b>, seus ${alvoKm}km sairiam em ~<b>${mm}min${ss!=='00'?ss:''}</b> (${fmtPaceMin(pr.paceAlvo)}). Estimativa baseada nas suas corridas — treinar mais tende a melhorar isso.`;
      }
    }catch(e){}
    let msg;
    if(daysToR===0) msg = 'Confie no seu treino, comece devagar e aproveite cada km. Você se preparou pra isso!';
    else if(daysToR===1) msg = 'Véspera: nada de treino forte. Separe a roupa, hidrate bem e durma cedo. Amanhã é seu dia! 😴';
    else if(daysToR<=3) msg = 'Reta final: só trotes leves. A energia que você poupa agora aparece na prova.';
    else if(daysToR<=7) msg = 'Semana da prova: reduza o volume, foco em recuperação e sono. O trabalho duro já foi feito 💪';
    else if(daysToR<=14) msg = 'Fase de afinação (taper): a intensidade cai e você chega afiado. Confie no processo, não invente treino novo.';
    else if(daysToR<=30) msg = 'Menos de um mês! Seus treinos-chave estão acontecendo agora — cada um deles conta muito.';
    else if(daysToR<=60) msg = 'Você está no meio da preparação. Constância nas próximas semanas é o que define seu resultado.';
    else msg = 'Prova no radar! Construa a base com calma — quem chega longe é quem não pula etapas.';
    msg = msg + _prev;
    const personal = raceSmartTip(daysToR);
    alertCard.querySelector('.card-sub').innerHTML = personal ? msg+' '+personal : msg;
  } else {
    alertCard.classList.add('hidden');
  }

  const cw = currentWeek(mod);
  renderInstallCard(); // convite pra instalar (só se fizer sentido)
  renderWeekRecap();   // resumo da semana passada (segundas)
  renderMonthlyCard(); // desafios do mês (zeram todo dia 1º)
  // idade sempre em dia quando há data de nascimento (adolescente cresce, aniversário passa)
  const prof = state.user && state.user.profile;
  if(prof && prof.birth){ const a = ageFromBirth(prof.birth); if(a && a!==prof.age) prof.age = a; }
  // parabéns no aniversário
  const bday = $('card-birthday');
  if(bday){
    if(isBirthdayToday()){
      bday.classList.remove('hidden');
      const nome = (prof && prof.nickname) || (state.user && state.user.name) || 'atleta';
      $('bday-title').textContent = `🎂 Feliz aniversário, ${nome}!`;
      const total = [...(state.modules.lift?.history||[]), ...(state.modules.run?.history||[])].length;
      $('bday-msg').textContent = total>0
        ? `Mais um ano de vida — e ${total} ${total===1?'treino registrado':'treinos registrados'} no MetaTreino. Que o novo ciclo venha com saúde, disposição e recordes. Hoje o treino é opcional; comemorar é obrigatório! 🎉`
        : 'Que este novo ciclo venha cheio de saúde e disposição. Seja qual for o seu objetivo, estamos juntos nessa! 🎉';
    } else bday.classList.add('hidden');
  }
  // aviso de modo adaptado (dor / TPM) — explica o que mudou nos treinos
  const adaptCard = $('card-adapt');
  if(adaptCard){
    const a = adaptMode();
    if(a.active){
      adaptCard.classList.remove('hidden');
      const titulo = a.pain.length ? `🩹 Modo cuidado ativo (${a.pain.join(', ')})`
                   : a.cramp ? '💗 Modo cólica ativo'
                   : a.tpm ? '💗 Modo TPM ativo'
                   : '💚 Modo leve ativo (cansaço)';
      $('adapt-title').textContent = titulo;
      const adaptados = (state.modules[state.active]?.plan?.workouts||[]).filter(w=>w.adapted).length;
      $('adapt-msg').textContent = a.pain.length
        ? `Seus treinos foram adaptados pra proteger: ${a.pain.join(', ')}. ${adaptados?adaptados+' treino(s) ajustado(s).':''} Se a dor for forte ou persistir, procure um profissional de saúde.`
        : 'Seus treinos estão mais leves (menos séries e volume reduzido). Vá no seu ritmo — treinar leve ou descansar hoje é totalmente ok. 💚';
    } else adaptCard.classList.add('hidden');
  }
  // aviso de Modo Férias ativo (pra pessoa lembrar de desligar quando voltar)
  const vacCard = $('card-vacation');
  if(vacCard) vacCard.classList.toggle('hidden', !vacationActive());
  // aviso de treino de hoje pulado (com opção de voltar atrás)
  const skipCard = $('card-skipped');
  if(skipCard){
    const m2 = state.modules[state.active];
    const wToday = (m2 && m2.plan) ? (m2.plan.workouts||[]).find(x=>x.dayIdx===getDayIdx()) : null;
    if(wToday && isSkippedToday(wToday)){
      skipCard.classList.remove('hidden');
      const btn = $('skip-undo-btn'); if(btn) btn.setAttribute('onclick', `unskipWorkout('${wToday.k}')`);
    } else skipCard.classList.add('hidden');
  }
  // treinos pendentes desta semana (perdeu um ou mais dias?)
  const missed = $('card-missed');
  if(missed){
    // Dispensa por QUANTIDADE e por MÓDULO: se o aluno dispensou com 1 treino perdido,
    // o aviso só volta quando perder outro (2). Domingo zera (semana nova).
    const wkKey = (()=>{ const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-(getDayIdx()-1)); return d.getTime(); })();
    state.ui.missedDismiss = state.ui.missedDismiss || {};
    const rec = state.ui.missedDismiss[state.active];
    const dismissedCount = (rec && rec.wk===wkKey) ? rec.count : 0;
    const pendAll = missedWorkoutsThisWeek(mod);
    const pend = pendAll.length > dismissedCount ? pendAll : [];
    const hasToday = !!mod.plan.workouts.find(w=>w.dayIdx===getDayIdx());
    if(pend.length){
      missed.classList.remove('hidden');
      const isLift = mod.plan.type==='lift';
      if(pend.length===1){
        // 1 dia perdido: sugere encaixar hoje SE hoje for descanso, senão sugere no próximo descanso
        $('missed-title').textContent = '📌 Um treino ficou para trás esta semana';
        if(hasToday){
          $('missed-msg').textContent = `${pend[0].name.split(' — ')[0]} não aconteceu — e tudo bem, acontece com todo mundo. Hoje você já tem treino: foca nele. Se bater vontade de fazer o que ficou, toque aqui — mas sem obrigação.`;
        } else {
          $('missed-msg').textContent = `${pend[0].name.split(' — ')[0]} não aconteceu. Hoje é dia de descanso — se estiver com disposição, dá pra fazer agora. Se preferir descansar, também está certo. 😌`;
        }
        missed.onclick = (ev)=>{
          if(ev.target && ev.target.id==='missed-dismiss') return;
          if(state.active==='run'){ openRunLog(String(pend[0].dayIdx)); }
          else { goTab('sessions'); setTimeout(()=>{ if(pend[0]) selectSession(pend[0].k); }, 120); }
        };
      } else {
        // 2+ dias perdidos: NÃO sugere fazer tudo — orienta priorizar e seguir em frente
        $('missed-title').textContent = `📌 ${pend.length} treinos ficaram para trás esta semana`;
        $('missed-msg').textContent = `Acontece! Não tente recuperar todos de uma vez — isso sobrecarrega e atrapalha mais que ajuda. ${isLift?'Escolha 1 treino pendente pra fazer num dia livre e siga o plano normalmente a partir de amanhã. Na próxima semana o ciclo recomeça equilibrado.':'Faça a atividade mais importante (a corrida longa) quando puder e retome o plano normalmente. Constância vale mais que perfeição.'} Toque pra ver os pendentes.`;
        missed.onclick = (ev)=>{
          if(ev.target && ev.target.id==='missed-dismiss') return;
          if(state.active==='run'){ openRunLog(String(pend[0].dayIdx)); }
          else { goTab('sessions'); setTimeout(()=>{ if(pend[0]) selectSession(pend[0].k); }, 120); }
        };
      }
      // botão de dispensar o aviso até a semana seguinte
      const dismissBtn = $('missed-dismiss');
      if(dismissBtn) dismissBtn.onclick = (ev)=>{
        ev.stopPropagation();
        state.ui.missedDismiss[state.active] = { wk:wkKey, count:pendAll.length };
        saveData(); missed.classList.add('hidden');
        toast('👍 Aviso dispensado. Só volta se você perder outro treino.');
      };
    } else missed.classList.add('hidden');
  }
  // lembrete de peso: 7+ dias sem registrar
  const wr = $('card-weight-reminder');
  if(wr){
    const lastW = state.weights.length ? state.weights[state.weights.length-1].date : 0;
    const daysNoWeight = lastW ? Math.floor((Date.now()-lastW)/86400000) : 99;
    if(daysNoWeight >= 7){
      wr.classList.remove('hidden');
      $('weight-reminder-sub').textContent = lastW ? `Faz ${daysNoWeight} dias que você não registra. Toque pra atualizar →` : 'Registre seu peso pra acompanhar sua evolução. Toque aqui →';
    } else wr.classList.add('hidden');
  }
  // corrida + musculação no MESMO dia: dica de como combinar sem se destruir
  const combo = $('card-combo');
  if(combo){
    const today = getDayIdx();
    const liftToday = state.modules.lift?.plan?.workouts?.find(w=>w.dayIdx===today);
    const runToday = state.modules.run?.plan?.workouts?.find(w=>w.dayIdx===today);
    if(liftToday && runToday){
      combo.classList.remove('hidden');
      const parts = liftToday.parts||[];
      const heavyLeg = parts.includes('Pernas');                       // quadríceps/posterior: conflito forte
      const gluteDay = !heavyLeg && parts.includes('Glúteos');         // glúteo: conflito moderado (motor da passada)
      const calfOnly = !heavyLeg && !gluteDay && parts.includes('Panturrilha');
      const hardRun = /Intervalado|Longa/.test(runToday.name||'');
      const partsLbl = parts.join(' + ').toLowerCase();
      let msgC;
      const _diaJaResolvido = treinouHoje(state.modules.lift) || treinouHoje(state.modules.run);
      if(_diaJaResolvido){ combo.classList.add('hidden'); msgC = null; }
      else if(heavyLeg && hardRun) msgC = `Hoje tem treino de ${partsLbl} e corrida forte. Escolha um pra valer: ou encurta a corrida (metade da distância, ritmo leve) ou reduz as séries de perna em ~30%. Fazer os dois no talo cobra a conta amanhã.`;
      else if(heavyLeg) msgC = `${partsLbl.charAt(0).toUpperCase()+partsLbl.slice(1)} + corrida no mesmo dia: corra ANTES do treino de força se a corrida é sua prioridade, ou depois (bem leve) se a musculação vem primeiro.`;
      else if(gluteDay && hardRun) msgC = `Hoje tem ${partsLbl} e corrida forte. O glúteo é o motor da passada, então dá pra fazer os dois — mas deixe um espaço de algumas horas entre eles, ou reduza um pouco o volume de um dos dois se sentir as pernas pesadas.`;
      else if(gluteDay) msgC = `${partsLbl.charAt(0).toUpperCase()+partsLbl.slice(1)} + corrida leve combinam bem hoje. Só evite falhar as séries de glúteo se ainda for correr depois.`;
      else if(calfOnly && hardRun) msgC = `Panturrilha + corrida forte no mesmo dia: a panturrilha trabalha muito na corrida — treine-a DEPOIS de correr, nunca antes.`;
      else if(hardRun) msgC = `Corrida forte + ${partsLbl} hoje: faça a corrida primeiro e deixe a musculação mais controlada — evite falhar séries.`;
      else msgC = `Dois treinos hoje (${partsLbl} + corrida leve)! Combinação tranquila: só garanta boa alimentação e hidratação entre eles.`;
      if(msgC) $('combo-msg').textContent = msgC; else combo.classList.add('hidden');
    } else combo.classList.add('hidden');
  }
  // pernas ainda se recuperando + corrida hoje → sugere pegar leve (nunca bloqueia)
  try{
    if(state.active==='run' && typeof fatigueOf==='function' && fatigueOf('Pernas')>=70 && $('card-plan-alert') && $('card-plan-alert').classList.contains('hidden')){
      const ac=$('card-plan-alert');
      ac.classList.remove('hidden');
      const _icA=ac.querySelector('.card-icon');
      if(_icA){ _icA.style.display=''; _icA.textContent='🦵'; }   // sem isto herdava o 🎉 do card padrão
      const t1=ac.querySelector('.card-title'), s1=ac.querySelector('.card-sub');
      if(t1) t1.textContent='Pernas ainda em recuperação';
      // O texto muda se HÁ corrida hoje ou não — antes dizia "faça hoje em ritmo leve"
      // até em dia de descanso, o que não fazia sentido.
      const temHoje = !!(mod && mod.plan && (mod.plan.workouts||[]).some(x=>x.dayIdx===getDayIdx()));
      if(s1) s1.textContent = temHoje
        ? 'Você treinou pernas forte há pouco. Se sentir peso na passada, faça a corrida de hoje em ritmo leve ou troque por uma caminhada — ela rende mais com as pernas descansadas.'
        : 'Você treinou pernas forte há pouco e hoje é dia de descanso — perfeito pra recuperar. Na próxima corrida, se sentir peso na passada, comece mais leve.';
    }
  }catch(e){}
  // aviso de dor: corrida com dor em perna/joelho/tornozelo → sugerir caminhada ou bike
  const pains = (state.user&&state.user.pain)||[];
  const legPain = pains.some(p=>['Joelho','Tornozelo','Lombar'].includes(p));
  if(state.active==='run' && legPain && $('card-plan-alert') && $('card-plan-alert').classList.contains('hidden')){
    const ac = $('card-plan-alert');
    ac.classList.remove('hidden');
    const _icB=ac.querySelector('.card-icon'); if(_icB){ _icB.style.display=''; _icB.textContent='🩹'; }
    ac.querySelector('.card-icon').textContent = '🩹';
    ac.querySelector('.card-title').textContent = 'Dor registrada: '+pains.join(', ');
    ac.querySelector('.card-sub').textContent = 'Hoje troque a corrida por caminhada leve ou bike (menos impacto). Fortalecer com musculação leve de core e quadril também ajuda a proteger a região. Dor persistindo, procure um profissional de saúde.';
  }
  const wk = cw.wk, total = cw.total;
  $('plan-week').textContent = mod.plan.type==='lift' && cw.cycle>1 ? `Semana ${wk} de ${total} · ${cw.cycle}º ciclo` : `Semana ${wk} de ${total}`;
  $('plan-progress').style.width = Math.min(100,(wk/total)*100)+'%';
  const phase = wk<=Math.floor(total*0.6)?'BUILD':wk<=Math.floor(total*0.85)?'PEAK':'TAPER';
  $('plan-phase').textContent = phase;
  const isLiftPlan = mod.plan.type==='lift';
  // plano com início programado pra frente: avisa em vez de fingir que já começou
  // (NUNCA sair da função aqui — o card do dia é desenhado mais abaixo)
  let _preStart = false, _preStartMsg = null;
  try{
    const _st = (typeof planStartTs==='function') ? planStartTs(mod) : 0;
    const _h0 = new Date(); _h0.setHours(0,0,0,0);
    if(_st && _st > _h0.getTime()){
      _preStart = true;
      const fw = planFirstWorkoutInfo(mod);
      _preStartMsg = fw
        ? `▶️ Seu primeiro treino é ${fw.fmt} (${fw.quando}). Até lá, sem cobranças — aproveite pra descansar. 😌`
        : `▶️ Seu plano ainda não começou. Até lá, sem cobranças — aproveite pra descansar. 😌`;
    }
  }catch(e){}
  if(_preStartMsg){ $('plan-foot').textContent = _preStartMsg; }
  else $('plan-foot').textContent = cw.done ? '🏁 Programa concluído! Toque em "Trocar plano" pra começar um novo ciclo.' : phase==='BUILD'?`🏗️ Fase de construção · ${isLiftPlan?'Ganhando base muscular':'Aumentando base aeróbica'}. ${total-wk} semanas até o pico.`:phase==='PEAK'?`🚀 Fase de pico · Alta intensidade. ${total-wk} semanas restantes.`:isLiftPlan?`🎯 Fase de consolidação · Na semana ${total} o ciclo recomeça renovado.`:`🎯 Fase de afinação (taper) · Recuperação e afinação final.`;

  const today = getDayIdx();
  const todayWk = mod.plan.workouts.find(w=>w.dayIdx===today);
  const slot = $('today-slot');
  if(typeof vacationActive==='function' && vacationActive()){
    slot.innerHTML = todayWk ? renderVacationToday(todayWk,isLift) : renderRestDay(mod);
  } else if(_preStart && !treinouHoje(mod)){
    slot.innerHTML = renderRestDay(mod); // aguardando a data de início: sem cobrança
  } else if(todayWk && treinouHoje(mod)){
    slot.innerHTML = renderDoneToday(todayWk, mod, isLift);
  } else {
    slot.innerHTML = todayWk ? renderTodayWorkout(todayWk,isLift) : renderRestDay(mod);
  }

  renderWeekGrid(mod);
  renderYourList(mod);
}

function renderAvatar(id){
  const el = $(id); if(!el) return;
  const p = state.user.profile;
  if(p && p.photo){ el.innerHTML = `<img src="${p.photo}" alt="">`; }
  else { el.textContent = (firstName()||'A').charAt(0).toUpperCase(); }
}

function labelGoal(mod){
  if(!mod) return '—';
  if(mod.plan.type==='lift') return {hipertrofia:'Hipertrofia',forca:'Força',emagrecimento:'Emagrecimento',resistencia:'Resistência'}[mod.setup.goal]||'—';
  return {'5km':'5 km','10km':'10 km','21km':'Meia (21k)','42km':'Maratona (42k)'}[mod.setup.goal]||'—';
}

function renderTodayWorkout(w, isLift){
  const desc = isLift ? liftDesc(w) : runDesc(w);
  const sug = isLift ? liftLoadSuggestion() : runSmartSuggestion(w);
  const runDone = !isLift && runDoneToday(w);
  return `<div class="today">
    <div class="today-label">TREINO DE HOJE</div>
    <div class="today-diff ${isLift?'diff-med':'diff-easy'}">${isLift?'Foco':'Fácil'}</div>
    <div class="today-title">${isLift?`Treino ${w.k} — ${w.name}`:w.name}</div>
    ${runDone?`<div style="display:inline-block;margin-top:6px;padding:4px 12px;border-radius:99px;background:var(--tint-primary);border:1px solid rgba(16,185,129,0.4);color:var(--primary-2);font-size:12px;font-weight:800">✅ Atividade registrada hoje — pode registrar outra se quiser</div>`:''}
    <div class="today-desc">${desc}</div>
    ${(isLift && typeof fatigueOf==='function' && (w.parts||[]).some(pp=>fatigueOf(pp)>=70)) ? `<div class="note note-warn" style="margin-top:10px"><div class="note-line">🟡 <b>${(w.parts||[]).filter(pp=>fatigueOf(pp)>=70)[0]}</b> ainda em recuperação. Se sentir queda de rendimento, vale tirar uma série hoje — quem manda é você.</div></div>` : ''}
    ${(isLift && typeof cicloAtual==='function' && cicloAtual()) ? (c=>`<div style="margin-top:8px;font-size:12px;color:var(--text-dim)">${c.emo} Ciclo: <b style="color:var(--text)">${c.nome}</b> · semana ${c.sem}</div>`)(cicloAtual()) : ''}
    ${sug?`<div class="note note-warn"><div class="note-line">${sug.emo} <b>Sugestão de hoje:</b> ${sug.txt}</div></div>`:''}
    ${(!isLift && typeof volumeAlert==='function') ? (v=>v&&v.nivel==='alto'?`<div class="note note-danger">
        <div class="note-title">⚠️ Cuidado com o volume</div>
        <div class="note-line">Você correu <b>${v.atual}km</b> nesta semana, ${v.alta>=100?'mais que o dobro':v.alta+'% acima'} da sua média (${v.media}km). Subir rápido demais é a maior causa de lesão em corrida — se sentir dor nova, pegue leve.</div>
      </div>`:'')(volumeAlert()) : ''}
    ${(!isLift && typeof runWeatherTips==='function') ? (t=>t?`<div class="note note-info">
        <div class="note-title">${t.titulo}</div>
        ${t.dicas.map(d=>`<div class="note-line">• ${d}</div>`).join('')}
      </div>`:'')(runWeatherTips()) : ''}
    <div class="today-meta">
      <span class="chip mono">⏱️ ${w.duration} min</span>
      ${w.distance?`<span class="chip mono">📍 ${w.distance}</span>`:''}
      ${isLift?`<span class="chip">💪 ${w.exercises.length} exercícios</span>`:''}
    </div>
    <div class="today-actions">
      <button class="btn btn-primary" onclick="openSession('${w.k||w.dayIdx}')">▶ Ver sessão</button>
      <button class="btn btn-ghost" onclick="${isLift?`openSession('${w.k}')`:`openRunLog('${w.dayIdx}')`}">${isLift?'📝 Registrar treino':'📝 Registrar corrida'}</button>
    </div>
  </div>`;
}
// Estado PÓS-TREINO: resumo + recuperação adaptada à avaliação + próximo treino
function renderDoneToday(w, mod, isLift){
  const es = entriesHoje(mod); const h = es[es.length-1] || {};
  const feel = h.feel || (h.rating!=null ? (h.rating>=5?'otimo':(h.rating<=1?'exausto':'bem')) : 'bem');
  const feelLbl = ({otimo:'🚀 Ótimo', bem:'😊 Bem', cansado:'😮‍💨 Cansado', exausto:'😩 Exausto'})[feel] || '😊 Bem';
  const rec = feel==='exausto' ? '😴 Foi pesado hoje. Prioriza um sono de qualidade, hidratação e uma refeição com proteína. Se amanhã ainda estiver moído, um dia extra de descanso vale ouro.'
    : feel==='cansado' ? '💧 Hidrate-se bem nas próximas horas e capriche na proteína. O músculo cresce agora, na recuperação — não no espelho da academia.'
    : feel==='otimo' ? '🔥 Sobrou energia! Bom sinal: dá pra progredir um pouco a carga na próxima sessão. Por hoje: descanso e boa alimentação.'
    : '👏 Bom trabalho. Hidrate-se, coma bem e deixa o corpo fazer a parte dele.';
  const hoje = getDayIdx(); const ord=[...((mod.plan&&mod.plan.workouts)||[])].sort((a,b)=>a.dayIdx-b.dayIdx);
  const prox = ord.find(x=>x.dayIdx>hoje) || ord[0];
  const dias=['segunda','terça','quarta','quinta','sexta','sábado','domingo'];
  const proxTxt = (prox && ord.length>0) ? `${isLift&&prox.k?('Treino '+prox.k+' — '):''}${prox.name} · ${dias[prox.dayIdx-1]}` : '';
  const totMin = Math.round(es.reduce((a,x)=>a+(x.duration||0),0));
  const exN = isLift ? ((h.exercisesDone||[]).length || null) : null;
  return `<div class="today" style="border-color:var(--line-primary)">
    <div class="today-label" style="color:var(--primary-2)">✅ TREINO CONCLUÍDO</div>
    <div class="today-title">${isLift?`Treino ${w.k} — ${w.name}`:(h.name||w.name)}</div>
    <div class="today-meta" style="margin-top:10px">
      <span class="chip mono">⏱️ ${fmtDur(totMin)}</span>
      ${exN?`<span class="chip">💪 ${exN} exercícios</span>`:''}
      ${h.distance?`<span class="chip mono">📍 ${h.distance}km</span>`:''}
      <span class="chip">${feelLbl}</span>
    </div>
    <div style="margin-top:12px;padding:10px 12px;border-radius:var(--radius-btn);background:var(--tint-primary);border:1px solid var(--line-primary);font-size:13px;line-height:1.5">${rec}</div>
    ${proxTxt?`<div style="margin-top:10px;font-size:12.5px;color:var(--text-dim)">📅 Próximo: <b style="color:var(--text)">${proxTxt}</b></div>`:''}
    <div class="today-actions">
      <button class="btn btn-ghost" onclick="openSession('${w.k||w.dayIdx}')">Ver detalhes</button>
      ${!isLift?`<button class="btn btn-ghost" onclick="openRunLog('${w.dayIdx}')">📝 Registrar outra</button>`:''}
    </div>
  </div>`;
}
// Estado FÉRIAS: sem call-to-action forte (cobranças pausadas de verdade)
function renderVacationToday(w, isLift){
  return `<div class="today" style="opacity:.78">
    <div class="today-label">🌴 MODO FÉRIAS</div>
    <div class="today-title" style="font-size:18px">${isLift?`Treino ${w.k} — ${w.name}`:w.name}</div>
    <div class="today-desc" style="margin-top:6px">Cobranças pausadas. Se bater vontade, o treino está aqui — mas hoje a prioridade é descansar. 😌</div>
    <div class="today-actions"><button class="btn btn-ghost" onclick="openSession('${w.k||w.dayIdx}')">Ver treino mesmo assim</button></div>
  </div>`;
}
const PART_CUES = {
  'Peito':'🏋️ No empurrar, desça controlado e não deixe o cotovelo abrir demais.',
  'Costas':'🧗 Puxe com as costas, não com o braço: pense em levar o cotovelo pra trás.',
  'Ombro':'🙆 Ombro gosta de técnica: carga moderada e amplitude completa valem mais que peso.',
  'Bíceps':'💪 Cotovelo colado no corpo — balançou o tronco, a carga está alta demais.',
  'Tríceps':'🦾 Trave o cotovelo no lugar e estenda até o fim: a queima boa mora ali.',
  'Pernas':'🦵 Joelho acompanhando a ponta do pé e desça até onde a técnica permitir.',
  'Glúteos':'🍑 Aperte o glúteo no topo do movimento por 1 segundo — faz diferença real.',
  'Panturrilha':'🦶 Pausa embaixo, subida completa: panturrilha responde a amplitude, não a pressa.',
  'Core':'🧱 Qualidade > quantidade: prancha tremendo com postura vale mais que o dobro largado.',
  'Trapézio':'🤷 Encolha reto pra cima, sem rolar os ombros — rolar não ajuda e machuca.'
};
function liftDesc(w){
  const parts = w.parts.join(' + ');
  const cue = PART_CUES[w.parts[0]] || '💡 Técnica primeiro, carga depois. Registre as séries pra ver sua evolução.';
  // A linha de aquecimento é orientação de quem está começando — depois de 8 treinos
  // ela só ocupa espaço e empurra os exercícios pra baixo.
  const novato = ((((state.modules.lift||{}).history)||[]).length + (((state.modules.run||{}).history)||[]).length) < 8;
  return novato
    // "Foco em X" repetia o título do card ("Treino D — Ombro + Trapézio + Core"). Removido.
    ? `${cue}\n\n💧 Aqueça 5-8 min, hidrate-se e respeite os intervalos de cada exercício.`
    : cue;
}
function runDesc(w){
  const main = (w.blocks||[]).find(b=>b.name==='Principal');
  const mainTxt = main && main.exs[0] ? `${main.exs[0].name} — ${main.exs[0].desc}` : 'Ritmo de conversa (você consegue falar frases completas sem ficar sem ar).';
  return `🔥 Aquecimento: 5-7 min de caminhada leve + mobilidade\n\n${mainTxt}\n\n🏁 Desaquecimento: 5 min de caminhada leve para normalizar a FC`;
}

function renderRestDay(mod){
  const isLift = mod.plan.type==='lift';
  const ws = mod.plan.workouts.slice(0,3);
  const freeRunBtn = (state.active==='run' && state.modules.run) ? `<div class="rest-divider">— ou —</div><button class="btn btn-outline btn-block hl-warn" style=";color:var(--accent-2)" onclick="openRunLog('livre')">🏃 Registrar corrida, caminhada ou bike livre</button>` : '';
  return `<div class="rest-card"><div class="rest-emoji">😴</div><div class="rest-title">Dia de Descanso</div><div class="rest-sub">Aproveite pra recuperar. Você volta amanhã mais forte!</div><div class="rest-divider">— ou —</div><div style="font-weight:700">Quer antecipar algum treino?</div><div class="anticipate">${ws.map(w=>`<div class="antic-card" onclick="openSession('${w.k||w.dayIdx}')"><div class="antic-letter">${(w.k||'').charAt(0)||'S'}</div><div class="antic-name">${isLift?'Treino '+w.k:w.name.split(' ')[0]}</div><div class="antic-day">${w.dayName}</div></div>`).join('')}</div>${freeRunBtn}</div>`;
}

function renderWeekGrid(mod){
  const days = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const today = getDayIdx();
  const startWk = new Date(); startWk.setHours(0,0,0,0); startWk.setDate(startWk.getDate()-(today-1));
  // Mostra os dois módulos juntos quando ambos têm plano (mesmo dia = os dois emojis).
  // Módulo sem plano (corrida cancelada / modo só-registro) não aparece — sem quebrar a tela.
  const sources = [];
  if(state.modules.lift && state.modules.lift.plan) sources.push({mod:state.modules.lift, emo:'💪'});
  if(state.modules.run && state.modules.run.plan) sources.push({mod:state.modules.run, emo:'🏃'});
  const dayInfo = {}; // idx -> {emos:[], planned:0, done:0}
  sources.forEach(({mod:m, emo})=>{
    (m.plan.workouts||[]).forEach(w=>{
      dayInfo[w.dayIdx] = dayInfo[w.dayIdx] || {emos:[], planned:0, done:0};
      if(!dayInfo[w.dayIdx].emos.includes(emo)) dayInfo[w.dayIdx].emos.push(emo);
      dayInfo[w.dayIdx].planned++;
    });
    (m.history||[]).filter(h=>h.at>=startWk.getTime()).forEach(h=>{
      const d=new Date(h.at); const idx = d.getDay()===0?7:d.getDay();
      dayInfo[idx] = dayInfo[idx] || {emos:[], planned:0, done:0};
      dayInfo[idx].done++;
    });
  });
  $('week-grid').innerHTML = days.map((n,i)=>{
    const idx=i+1, info=dayInfo[idx], has=!!(info&&info.emos.length), isT=idx===today;
    const planned=info?info.planned:0, doneN=info?info.done:0;
    const fullDone = doneN>0 && doneN>=planned;       // tudo que estava planejado foi feito
    const partial  = doneN>0 && !fullDone;            // fez parte (ex: correu mas falta a musculação)
    const cd=new Date(startWk); cd.setDate(startWk.getDate()+i);
    const dateStr=String(cd.getDate()).padStart(2,'0')+'/'+String(cd.getMonth()+1).padStart(2,'0');
    const isPast = idx < today;
    const daySkipped = (state.skips||[]).some(s=>s.dayIdx===idx && s.at>=startWk.getTime());
    const dayVac = (typeof isVacationDay==='function') && isVacationDay(cd);
    // prioridade: tudo feito > parcial > hoje > faltou (passado planejado e não feito) > planejado
    let status;
    if(fullDone) status='✅';
    else if(partial) status='🟢';
    else if(isT) status='🟡';
    else if(isPast && planned>0 && !daySkipped && !dayVac && !(typeof isBirthday==='function' && isBirthday(cd)) && cd.getTime() >= new Date(new Date(planStartTs()).setHours(0,0,0,0)).getTime()) status='<span style="color:var(--text-mute);font-weight:700">–</span>';
    else if(has) status='⚪';
    else status='';
    const clicavel = idx<=today ? `onclick="openDayDetail(${cd.getTime()})" style="cursor:pointer"` : '';
    return `<div class="day ${isT?'today':''} ${!has?'rest':''}" ${clicavel}>
      <div class="day-name">${n.slice(0,3)}</div>
      <div style="font-size:9.5px;color:var(--text-mute);margin-top:1px;line-height:1">${dateStr}</div>
      <div class="day-emoji" style="margin-top:4px;${has&&info.emos.length>1?'font-size:11px;letter-spacing:-2px':''}">${has?info.emos.join(''):'·'}</div>
      <div style="font-size:11px;line-height:1;margin-top:3px;min-height:13px">${status}</div>
    </div>`;
  }).join('');
}

function renderYourList(mod){
  const isLift = state.active==='lift';
  if(!mod || !mod.plan){ $('your-list').innerHTML=''; return; }
  const hoje = getDayIdx();
  const ord = [...mod.plan.workouts].sort((a,b)=>a.dayIdx-b.dayIdx);
  // começa em hoje e segue a semana (dá a volta), mostrando só os 3 mais relevantes
  const emOrdem = [...ord.filter(w=>w.dayIdx>=hoje), ...ord.filter(w=>w.dayIdx<hoje)];
  const shown = emOrdem.slice(0,3);
  const item = w=>`<div class="list-item" onclick="openSession('${w.k||w.dayIdx}')">${isLift?`<div class="list-badge">${w.k}</div>`:`<div class="list-dot"></div>`}<div class="list-info"><div class="list-tag">${(w.dayName||'').toUpperCase()}</div><div class="list-name">${isLift?'Treino '+w.k+' — '+w.name:w.name}</div></div><div class="list-right"><span class="mono">~${w.duration}min</span> ›</div></div>`;
  $('your-list').innerHTML = shown.map(item).join('');
}

// ---------- SESSIONS ----------
function renderSessions(){
  if(!state || !state.user){ try{ showScreen('scr-auth'); }catch(e){} return; }   // logout no meio de um render
  // módulo ativo sem plano (ex.: trocou de módulo e não criou): não quebra a tela
  if(!state.modules[state.active]){ showPickScreen(); return; }
  const mod = state.modules[state.active];
  if(mod && !mod.plan){ showScreen('scr-runlog'); renderRunLogScreen(); return; }
  const isLift = state.active==='lift';
  $('sess-mod-icon').textContent = isLift?'🏋️':'🏃';
  $('sessions-title').innerHTML = `${isLift?'🏋️':'🏃'} Sessões`;
  $('sessions-tag').textContent = `Sessões · ${isLift?'Musculação':'Corrida'}`;
  const cwInfo = currentWeek(mod);
  const _stS = (typeof planStartTs==='function') ? planStartTs(mod) : 0;
  const _h0S = new Date(); _h0S.setHours(0,0,0,0);
  const _preStart = _stS && _stS > _h0S.getTime();
  $('weekly-info').textContent = `Meta: ${labelGoal(mod)} · Semana ${cwInfo.wk}/${cwInfo.total} · ${mod.plan.workouts.length}× por semana`;
  // aviso em card próprio (fora do card clicável, pra não confundir com o ▾ dele)
  const _psEl = $('sess-prestart');
  if(_psEl){
    const fwS = _preStart ? planFirstWorkoutInfo(mod) : null;
    _psEl.innerHTML = fwS
      ? `<div class="note note-info"><div class="note-line" style="color:#7dd3fc">▶️ Seu primeiro treino é <b>${fwS.fmt}</b> (${fwS.quando}). Dá uma olhada no que vem por aí — e se quiser começar antes, é só treinar: eu ajusto a data. 😉</div></div>`
      : '';
  }

  const sel = currentSelectedWorkout(mod);
  $('sessions-chips').innerHTML = mod.plan.workouts.map(w=>{
    const on = String(w.k||w.dayIdx)===String(sel.k||sel.dayIdx);
    return `<div class="filter-chip ${on?'on':''}" onclick="selectSession('${w.k||w.dayIdx}')"><div style="font-size:11px;letter-spacing:1px;color:var(--text-dim);font-weight:700">${(w.dayName||'').toUpperCase()}</div><div style="font-weight:700;margin-top:2px">${isLift?'Treino '+w.k:String(w.name||'Treino').split('(')[0].trim()}</div></div>`;
  }).join('');
  renderSessionDetail(sel);
}
function selectSession(id){
  // guarda só o IDENTIFICADOR, nunca o objeto do treino.
  // (guardar o objeto criava uma cópia congelada no estado: depois de salvar/recarregar,
  //  a tela mostrava o treino antigo mesmo após o plano ser regenerado por dor/TPM/equipamento)
  state.ui.selectedSession = String(id);
  saveData(); renderSessions();
}
// resolve o treino selecionado sempre a partir do plano vivo
function currentSelectedWorkout(mod){
  const id = state.ui.selectedSession;
  let w = null;
  if(id!=null && typeof id!=='object') w = mod.plan.workouts.find(x=>String(x.k||x.dayIdx)===String(id));
  if(!w && id && typeof id==='object') w = mod.plan.workouts.find(x=>String(x.k||x.dayIdx)===String(id.k||id.dayIdx)); // compat: estados antigos
  return w || mod.plan.workouts.find(x=>x.dayIdx===getDayIdx()) || mod.plan.workouts[0];
}
function cardioFinisherCard(){
  return `<div class="card card-info card-row" class="hl-warn" style="margin-top:14px;;background:rgba(245,158,11,0.06)"><div class="card-icon">🔥</div><div><div class="card-title" style="color:#f59e0b">Bônus cardio (opcional)</div><div class="card-sub">Treino mais curto hoje? Se quiser turbinar, finalize com ~8 min: <b>2 a 3 voltas</b> de 30s em cada — polichinelo, corrida no lugar (joelho alto), mountain climber e agachamento com salto. 30s de descanso entre as voltas, no seu ritmo. 💪</div></div></div>`;
}
// ===== PERFIL OCUPACIONAL =====
// O corpo cobra diferente conforme o dia da pessoa. Não é fisioterapia nem obrigação:
// são 2-3 movimentos no aquecimento que ela já faz, escolhidos pela rotina + grupos do dia.
const MOB = {
  peitoral:{ emo:'🚪', nome:'Abrir o peito', tempo:'30s de cada lado', variantes:{
    academia:'Fique de lado num aparelho ou pilar. Encoste o antebraço nele com o cotovelo na altura do ombro. Agora <b>gire o corpo todo</b> para o lado contrário, como se fosse olhar para trás, até sentir o peito esticar.',
    casa:'Encoste o antebraço no <b>batente da porta</b>, cotovelo na altura do ombro. Dê um passo à frente e <b>gire o corpo</b> para o lado contrário até sentir o peito esticar.' } },
  toracica:{ emo:'🔄', nome:'Soltar as costas', tempo:'8 vezes de cada lado', variantes:{
    todos:'Sente numa borda com os pés no chão. Mãos atrás da cabeça, cotovelos abertos. <b>Gire o tronco</b> devagar para um lado, respire fundo, volte e faça para o outro. Só o tronco gira — o quadril fica parado.' } },
  rotadores:{ emo:'💪', nome:'Girar o ombro para fora', tempo:'2 séries de 15', variantes:{
    academia:'Na polia baixa, pegue o cabo com a mão do lado de fora. <b>Cotovelo colado na cintura</b>, dobrado a 90°. Puxe girando o antebraço para fora, devagar. Carga bem leve.',
    halteres:'Deite de lado, halter leve na mão de cima. <b>Cotovelo colado na cintura</b>, dobrado a 90°. Gire o antebraço para cima e desça devagar.',
    casa:'Pegue uma toalha ou elástico com as duas mãos, <b>cotovelos colados na cintura</b>. Puxe as mãos afastando uma da outra e segure 2 segundos.' } },
  psoas:{ emo:'🦵', nome:'Soltar a frente da coxa', tempo:'30s de cada lado', variantes:{
    todos:'Apoie um joelho no chão e o outro pé à frente, como quem vai pedir a mão em casamento. <b>Aperte o bumbum</b> do lado do joelho apoiado e empurre o quadril para frente. A lombar fica reta — quem empurra é o quadril, não a barriga.' } },
  ponte:{ emo:'🌉', nome:'Ativar o bumbum', tempo:'15 repetições', variantes:{
    todos:'Deite de barriga para cima, joelhos dobrados, pés no chão. <b>Aperte o bumbum</b> e suba o quadril até o corpo ficar reto dos joelhos aos ombros. Segure 2 segundos em cima e desça devagar.' } },
  posterior:{ emo:'🧎', nome:'Esticar atrás da coxa', tempo:'30s de cada lado', variantes:{
    academia:'Apoie o calcanhar num banco à sua frente, perna esticada. Coluna reta, <b>empurre o quadril para trás</b> até sentir esticar atrás da coxa. Não curve as costas.',
    todos:'Perna esticada à frente com o calcanhar no chão, ponta do pé para cima. Coluna reta, <b>empurre o quadril para trás</b> até sentir esticar atrás da coxa.' } },
  gato:{ emo:'🐈', nome:'Soltar a coluna', tempo:'10 vezes bem devagar', variantes:{
    todos:'Fique de quatro apoios. <b>Solte o ar</b> arredondando as costas como um gato assustado. <b>Puxe o ar</b> deixando a barriga descer e o peito abrir. Vá lento, sentindo cada vértebra.' } },
  panturrilha:{ emo:'🦶', nome:'Esticar a panturrilha', tempo:'30s de cada lado', variantes:{
    todos:'Mãos apoiadas numa parede. Perna de trás <b>esticada com o calcanhar colado no chão</b>. Empurre o quadril para frente até sentir puxar atrás da perna.' } },
  tornozelo:{ emo:'🔃', nome:'Soltar o tornozelo', tempo:'10 de cada lado', variantes:{
    todos:'Fique com um pé à frente, a uns 10cm de uma parede. <b>Leve o joelho até encostar na parede</b> sem tirar o calcanhar do chão. Volte e repita. Ajuda a agachar mais fundo.' } },
  pernasParede:{ emo:'🧘', nome:'Pernas para o alto', tempo:'2 a 3 minutos', variantes:{
    todos:'Deite no chão com o bumbum perto da parede e <b>apoie as pernas nela</b>, esticadas para cima. Respire fundo. Tira o inchaço e a sensação de peso das pernas.' } },
  lombar:{ emo:'🙆', nome:'Soltar a lombar', tempo:'10 vezes devagar', variantes:{
    todos:'Deite de barriga para baixo. <b>Apoie os cotovelos no chão</b> embaixo dos ombros e levante o peito devagar, sem forçar. Segure 3 segundos e desça. A barriga continua encostada.' } },
  cervical:{ emo:'🙂', nome:'Soltar o pescoço', tempo:'8 para cada lado', variantes:{
    todos:'Sentado ou em pé, <b>incline a cabeça</b> levando a orelha em direção ao ombro, sem levantar o ombro. Segure 5 segundos. Depois gire devagar olhando por cima de cada ombro.' } },
  punho:{ emo:'🤲', nome:'Soltar o antebraço', tempo:'30s de cada lado', variantes:{
    todos:'Estique um braço à frente com a palma para cima. Com a outra mão, <b>puxe os dedos para baixo</b> até sentir esticar o antebraço. Depois vire a palma para baixo e puxe os dedos para cima.' } }
};
// texto certo pro equipamento do aluno (na academia ninguém usa batente de porta)
function mobTexto(item){
  const eq = ((state.modules.lift||{}).setup||{}).equip || 'casa';
  const v = item.variantes || {};
  return v[eq] || (eq==='basico' ? (v.halteres||v.academia) : null) || v.todos || v.casa || v.academia || '';
}
const ROTINAS = {
  sentado:  { emo:'🪑', label:'Sentado (escritório, computador)',
    foco:['peitoral','toracica','psoas','ponte'],
    porque:'Ficar sentado encurta peitoral e flexor do quadril, e "desliga" o glúteo.' },
  pe:       { emo:'🧍', label:'Em pé parado (balcão, loja, cozinha)',
    foco:['panturrilha','posterior','lombar','pernasParede'],
    porque:'Horas em pé sobrecarregam panturrilha, posterior de coxa e lombar.' },
  peso:     { emo:'📦', label:'Carregando peso (carga, obra, estoque)',
    foco:['gato','toracica','punho','posterior'],
    porque:'Carregar peso cansa lombar, ombros e antebraços — mobilidade ajuda a descomprimir.' },
  dirigindo:{ emo:'🚗', label:'Dirigindo (motorista, entregador)',
    foco:['psoas','lombar','cervical','toracica'],
    porque:'Dirigir junta o sentar prolongado com tensão de pescoço e lombar.' },
  misto:    { emo:'🚶', label:'Em movimento o dia todo',
    foco:['tornozelo','posterior','toracica'],
    porque:'Você já se movimenta bastante — aqui a mobilidade é só pra treinar melhor.' }
};
function rotinaAtual(){
  const p = state.user && state.user.profile;
  if(!p) return null;
  if(p.rotina) return p.rotina;
  if(p.sentado === true) return 'sentado';   // compatível com a versão anterior
  return null;
}
function mobilidadeDoDia(w){
  const r = rotinaAtual(); if(!r || !ROTINAS[r] || !w) return [];
  // Só na musculação: o treino de corrida já tem bloco de Aquecimento
  // (caminhada leve + mobilidade dinâmica). Mostrar os dois vira instrução repetida.
  if(state.active !== 'lift') return [];
  const partes = (w.parts||[]).join(' ');
  const pool = ROTINAS[r].foco.slice();
  // prioriza o que conversa com os grupos DO DIA
  const relevante = k => {
    if(/Peito|Ombro|Trapézio|Costas/.test(partes)) return ['peitoral','toracica','rotadores','punho','cervical'].includes(k);
    if(/Pernas|Glúteos|Panturrilha/.test(partes))  return ['psoas','posterior','ponte','panturrilha','tornozelo','lombar','pernasParede'].includes(k);
    return true;
  };
  let ordenado = pool.filter(relevante).concat(pool.filter(k=>!relevante(k)));
  if(/Ombro/.test(partes) && !ordenado.includes('rotadores')) ordenado.unshift('rotadores');
  // RODÍZIO SEMANAL: igual aos exercícios do treino, pra não enjoar de ver sempre os mesmos
  const wk = Math.floor(Date.now()/(7*86400000)) % Math.max(1, ordenado.length);
  if(ordenado.length > 3 && wk > 0) ordenado = ordenado.slice(wk).concat(ordenado.slice(0, wk));
  return ordenado.slice(0,3).map(k=>MOB[k]).filter(Boolean);
}
function mobRecolhido(){ try{ return localStorage.getItem('mt_mob_recolhido') !== '0'; }catch(e){ return true; } } // nasce recolhido: uma linha só
function toggleMobCard(){
  try{ localStorage.setItem('mt_mob_recolhido', mobRecolhido() ? '0' : '1'); }catch(e){}   // aberto fica aberto até fechar de novo
  if(state.ui && state.ui.tab) goTab(state.ui.tab);
}
function setRotina(r){
  state.user.profile = state.user.profile || {};
  if(r === 'none'){ delete state.user.profile.rotina; delete state.user.profile.sentado; }
  else { state.user.profile.rotina = r; delete state.user.profile.sentado; }
  saveData(); closeModal();
  toast(r==='none' ? 'Preparação personalizada desativada' : `${ROTINAS[r].emo} Vou preparar seu aquecimento pensando nisso`);
  if(state.ui.tab) goTab(state.ui.tab);
}
function renderSessionDetail(w){
  if(!w){ $('session-detail-slot').innerHTML=''; return; }
  const isLift = state.active==='lift';
  const done = isLift ? checkLiftDone(w) : false;
  const lockedToday = isLift ? liftDoneToday(w) : false;
  curSessionLocked = lockedToday;
  const html = `
    <div class="detail-hero">
      <h2>${isLift?`Treino ${w.k} — ${w.name}`:w.name}</h2>
      <div style="margin-top:8px"><span class="plan-badge">${isLift?'Foco':'Fácil'}</span></div>
      ${sessTags(w, isLift)}
      <div class="today-desc" style="margin-top:14px">${isLift?liftDesc(w):runDesc(w)}</div>
      <div class="info-grid">
        <div class="info-cell"><div class="info-cell-icon">⏱️</div><div class="info-cell-lbl">DURAÇÃO</div><div class="info-cell-val mono">${w.duration} min</div></div>
        <div class="info-cell"><div class="info-cell-icon">${isLift?'💪':'📍'}</div><div class="info-cell-lbl">${isLift?'EXERCÍCIOS':'DISTÂNCIA'}</div><div class="info-cell-val mono">${isLift?w.exercises.length:w.distance}</div></div>
        <div class="info-cell"><div class="info-cell-icon">📅</div><div class="info-cell-lbl">DIA</div><div class="info-cell-val">${w.dayName}</div></div>
      </div>
    </div>
    ${(((state.modules.lift||{}).history||[]).length + ((state.modules.run||{}).history||[]).length) >= 8 ? '' : `<div class="card card-info card-row"><div class="card-icon">💡</div><div><div class="card-title info">Dicas para esta sessão</div><div class="card-sub">${isLift?(((state.modules.lift||{}).setup||{}).goal==='resistencia'?'Formato circuito: emende os exercícios com pouco descanso e, no fim de cada volta, descanse 60-90s. Faça 2-3 voltas.':'Mantenha técnica antes de aumentar carga. Registre cada série pra ver sua evolução.'):'Mantenha um ritmo onde você consiga conversar sem dificuldade. frequência cardíaca entre 60-70% do máximo (220 menos sua idade).'}</div></div></div>`}
    ${isLift ? renderLiftBlocks(w) : renderRunBlocks(w)}
    ${isLift && (w.exercises||[]).length <= 3 ? cardioFinisherCard() : ''}
    ${isSkippedToday(w)
      ? `<div class="card card-alert card-row" style="margin-top:14px;border-color:rgba(148,163,184,0.45)"><div class="card-icon">😴</div><div style="flex:1"><div class="card-title">Treino pulado hoje</div><div class="card-sub">Você escolheu descansar hoje — sem cobrança. Mudou de ideia?</div><button class="btn btn-primary" style="margin-top:10px;padding:8px 16px;font-size:13px" onclick="unskipWorkout('${isLift?w.k:w.dayIdx}')">💪 Voltar atrás (quero treinar)</button></div></div>`
      : `${isLift ? (lockedToday
      ? `<div class="card card-ok" style="margin-top:14px;text-align:center"><div class="card-title" style="color:var(--primary-2)">✅ Treino concluído hoje</div><div class="card-sub">Pra ajustar algo, edite pelo Histórico. Amanhã a sessão libera de novo.</div></div>`
      : `<button class="btn ${done?'btn-primary':'btn-ghost'} btn-block" style="margin-top:14px" onclick="finishLiftWorkout('${w.k}')" ${done?'':'disabled style="opacity:.5"'}>✅ Salvar treino${done?'':' (registre ao menos 1 série)'}</button>`) : (runDoneToday(w)
      ? `<div class="card card-ok" style="margin-top:14px;text-align:center;padding:12px"><div style="color:var(--primary-2);font-weight:800">✅ Atividade registrada hoje</div><button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openRunLog('${w.dayIdx}')">📝 Registrar outra atividade</button></div>`
      : `<button class="btn btn-primary btn-block" style="margin-top:14px" onclick="openRunLog('${w.dayIdx}')">📝 Registrar atividade (km + tempo)</button>`)}
    ${((isLift && !lockedToday) || (!isLift && !runDoneToday(w))) ? `<button class="btn btn-ghost btn-block" style="margin-top:8px;color:var(--text-dim);font-weight:600" onclick="skipWorkout('${isLift?w.k:w.dayIdx}')">😴 Não vou treinar hoje (pular)</button>` : ''}`}
  `;
  $('session-detail-slot').innerHTML = html;
}

function liftDoneToday(w){
  const today = new Date(); today.setHours(0,0,0,0);
  return (state.modules.lift?.history||[]).some(h=>{
    if(h.id!==w.k) return false;
    const d = new Date(h.at); d.setHours(0,0,0,0);
    return d.getTime()===today.getTime();
  });
}
function checkLiftDone(w){
  const today = new Date(); today.setHours(0,0,0,0);
  return w.exercises.some(ex=>{
    const arr = state.progress[ex.id]||[];
    return arr.some(p=>{ const d=new Date(p.date); d.setHours(0,0,0,0); return d.getTime()===today.getTime() && p.sets && p.sets.length>0; });
  });
}

function renderLiftBlocks(w){
  const groups = {};
  w.exercises.forEach(ex=>{
    const g = (ex.sub||'').split(/[\s\/]/)[0] || 'Principal';
    (groups[g] = groups[g]||[]).push(ex);
  });
  // Um grupo está "pronto" quando todos os seus exercícios foram registrados hoje.
  // O primeiro grupo AINDA não concluído abre sozinho — a pessoa não precisa ficar clicando.
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const exFeito = ex => (state.progress[ex.id]||[]).some(p=>{ const d=new Date(p.date); d.setHours(0,0,0,0); return d.getTime()===hoje.getTime() && p.sets.length>0; });
  const entradas = Object.entries(groups);
  const prontos = entradas.map(([,exs])=>exs.every(exFeito));
  let abrir = prontos.findIndex(p=>!p);          // primeiro grupo pendente
  if(abrir === -1) abrir = entradas.length - 1;  // todos prontos: deixa o último aberto
  return entradas.map(([g,exs],i)=>`
    <div class="block ${i===abrir?'open':''}">
      <div class="block-head main" onclick="this.parentNode.classList.toggle('open')">
        <span style="font-size:20px">${prontos[i]?'✅':'🔥'}</span>
        <div class="block-head-txt"><div class="block-name">${g}${prontos[i]?' <span style="font-size:11px;color:var(--primary-2);font-weight:700">concluído</span>':''}</div><div class="block-sub">${exs.filter(exFeito).length}/${exs.length} ${exs.length===1?'exercício':'exercícios'}</div></div>
        <div class="block-chev">▾</div>
      </div>
      <div class="block-body"><div class="block-inner">
        ${exs.map((ex,j)=>renderExerciseCard(ex,j)).join('')}
      </div></div>
    </div>
  `).join('');
}
let curSessionLocked = false;
function renderExerciseCard(ex, idx){
  const last = getLastLog(ex.id);
  const pr = state.prs[ex.id];
  const today = new Date(); today.setHours(0,0,0,0);
  const todayLogs = (state.progress[ex.id]||[]).filter(p=>{ const d=new Date(p.date); d.setHours(0,0,0,0); return d.getTime()===today.getTime(); });
  const todayEntry = todayLogs.length? todayLogs[todayLogs.length-1] : null;
  const doneToday = todayEntry && todayEntry.sets.length>0;
  return `
    <div class="ex" style="${doneToday?'border-left:3px solid var(--primary);padding-left:10px':''}">
      <div class="ex-num ${doneToday?'anim-check':''}" style="${doneToday?'background:var(--primary);color:var(--on-primary)':''}">${doneToday?'✓':idx+1}</div>
      <div style="flex:1">
        <div class="ex-name">${ex.name} ${ex.pinned?`<span class="pr-badge" style="background:var(--tint-info);color:var(--info)">📌 fixado</span>`:''} ${pr?`<span class="pr-badge">🏆 PR ${pr.peso}kg×${pr.reps}</span>`:''}</div>
        <div class="ex-desc">${ex.sub} · Alvo: <b>${ex.sets}×${ex.reps}</b> · Descanso ${ex.rest}</div>
        ${last?`<div class="ex-desc" style="color:var(--primary-2);margin-top:4px">📊 Última: ${last.sets.map(s=>`${s.peso}kg×${s.reps}`).join(', ')}</div>`:''}
        ${doneToday?`<div class="ex-desc" style="color:var(--primary-2);margin-top:4px;font-weight:700">✅ Hoje: ${todayEntry.sets.map(s=>`${s.peso>0?s.peso+'kg×':''}${s.reps}`).join(', ')}</div>`:''}
        <div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap">
          ${ex.pinned?`<button class="btn btn-ghost" style="padding:6px 10px;font-size:11.5px" onclick="unpinExercise('${ex.id}')">↩️ Voltar à sugestão</button>`:''}
          ${curSessionLocked
            ? `<span style="font-size:12px;color:var(--text-mute);padding:8px 4px">🔒 Concluído hoje — edite pelo Histórico</span>`
            : `<button class="btn ${doneToday?'btn-ghost':'btn-primary'}" style="padding:8px 14px;font-size:13px" onclick="openSetLog('${ex.id}','${ex.name.replace(/'/g,"\\'")}')">${doneToday?'✏️ Editar séries':'📝 Registrar'}</button>`}
          <button class="btn btn-ghost" style="padding:8px 14px;font-size:13px" onclick="playExercise('${ex.name.replace(/'/g,"\\'")}')">▶ Ver como fazer</button>
          <button class="btn btn-ghost" style="padding:8px 14px;font-size:13px" onclick="openSwapExercise('${ex.id}')">🔄 Trocar</button>
        </div>
      </div>
    </div>`;
}
function getLastLog(exId){
  const arr = state.progress[exId]||[];
  if(!arr.length) return null;
  // most recent, but not today (to show "last time" info)
  const today = new Date(); today.setHours(0,0,0,0);
  const past = arr.filter(p=>{ const d=new Date(p.date); d.setHours(0,0,0,0); return d.getTime()<today.getTime(); });
  return past.length ? past[past.length-1] : null;
}

function renderRunBlocks(w){
  const cls=['warm','main','cool'], emos=['🔥','🏃','🏁'];
  return (w.blocks||[]).map((b,i)=>`
    <div class="block ${i===1?'open':''}">
      <div class="block-head ${cls[i]}" onclick="this.parentNode.classList.toggle('open')">
        <span style="font-size:20px">${emos[i]}</span>
        <div class="block-head-txt"><div class="block-name">${b.name}</div><div class="block-sub">${b.exs.reduce((s,e)=>s+e.min,0)} min</div></div>
        <div class="block-chev">▾</div>
      </div>
      <div class="block-body"><div class="block-inner">${b.exs.map((ex,j)=>`<div class="ex"><div class="ex-num">${j+1}</div><div style="flex:1"><div class="ex-name">${ex.name}</div><div class="ex-desc">${ex.desc}</div></div><div class="ex-meta">${ex.min} min</div></div>`).join('')}</div></div>
    </div>`).join('');
}

function openSession(id){
  const mod = state.modules[state.active];
  const w = mod.plan.workouts.find(w=>String(w.k||w.dayIdx)===String(id));
  state.ui.selectedSession = w ? String(w.k||w.dayIdx) : null; saveData(); goTab('sessions');
}

// ---------- SET LOGGER ----------
let curLog = null;
function openSetLog(exId, exName){
  requestWakeLock(); // mantém a tela ligada enquanto registra o exercício
  const today = new Date(); today.setHours(0,0,0,0);
  const logs = state.progress[exId]||[];
  let entry = logs.find(p=>{ const d=new Date(p.date); d.setHours(0,0,0,0); return d.getTime()===today.getTime(); });
  if(!entry){ entry = { date:Date.now(), sets:[] }; logs.push(entry); state.progress[exId] = logs; }
  curLog = { exId, exName, entry };
  renderSetLogModal();
  $('modal-back').classList.add('on');
}
// ---------- PROGRESSÃO ADAPTATIVA ----------
// Analisa o histórico real do exercício e a faixa de repetições do plano
// pra sugerir o próximo passo — o app "aprende" com a evolução do aluno.
function repRangeFor(exId){
  const w = (state.modules.lift?.plan?.workouts||[]).flatMap(x=>x.exercises||[]).find(e=>e.id===exId);
  if(!w || !w.reps) return {lo:8, hi:12};
  const m = String(w.reps).match(/(\d+)\s*-\s*(\d+)/);
  return m ? {lo:parseInt(m[1]), hi:parseInt(m[2])} : {lo:8, hi:12};
}
function smartProgressionHint(exId){
  const logs = (state.progress[exId]||[]).filter(p=>p.sets && p.sets.length);
  const prev = logs.filter(p=>{ const d=new Date(p.date); d.setHours(0,0,0,0); const t=new Date(); t.setHours(0,0,0,0); return d.getTime()<t.getTime(); });
  if(!prev.length) return {cls:'card-info', txt:'🌱 Primeira vez neste exercício: comece com uma carga confortável e capriche na técnica. O app vai aprender com seus registros.'};
  const range = repRangeFor(exId);
  const last = prev[prev.length-1];
  const lastW = Math.max(...last.sets.map(s=>+s.peso||0));
  const allTop = arr => arr.sets.every(s=>(+s.reps||0) >= range.hi);
  const anyBelow = last.sets.some(s=>(+s.reps||0) > 0 && (+s.reps||0) < range.lo);
  // como terminou o último treino de musculação?
  const lastFeel = (state.modules.lift?.history||[]).filter(x=>x.feel).slice(-1)[0]?.feel;
  const isBodyweight = lastW === 0;

  if(lastFeel==='exausto'){
    return {cls:'card-warn', txt:`😌 Último treino terminou em exaustão — hoje mantenha ${isBodyweight?'as repetições de sempre':lastW+'kg'} (ou um pouco menos) e priorize a execução.`};
  }
  const twoTop = prev.length>=2 && allTop(prev[prev.length-1]) && allTop(prev[prev.length-2]) && Math.max(...prev[prev.length-2].sets.map(s=>+s.peso||0)) >= lastW;
  if(twoTop){
    return isBodyweight
      ? {cls:'card-ok', txt:`📈 Você bateu o topo da faixa (${range.hi} reps) nas 2 últimas sessões — hora de dificultar: +2 repetições por série ou uma variação mais difícil.`}
      : {cls:'card-ok', txt:`📈 Você bateu o topo da faixa (${range.hi} reps) 2 sessões seguidas com ${lastW}kg — o app sugere subir pra ${(lastW+2.5).toFixed(1).replace('.0','')}kg hoje.`};
  }
  if(allTop(last)){
    return isBodyweight
      ? {cls:'card-info', txt:`💪 Sessão passada você fechou todas as séries em ${range.hi}+ reps. Repita hoje — mais uma assim e sobe o desafio.`}
      : {cls:'card-info', txt:`💪 Sessão passada: todas as séries no topo da faixa com ${lastW}kg. Repita hoje — mais uma assim e o app sugere aumentar.`};
  }
  if(anyBelow){
    return isBodyweight
      ? {cls:'card-warn', txt:`⚖️ Na última sessão algumas séries ficaram abaixo de ${range.lo} reps. Sem problema: mantenha e busque chegar na faixa ${range.lo}-${range.hi} antes de progredir.`}
      : {cls:'card-warn', txt:`⚖️ Na última sessão (${lastW}kg) algumas séries ficaram abaixo de ${range.lo} reps. Mantenha ${lastW}kg e busque a faixa completa antes de subir.`};
  }
  return {cls:'card-info', txt:`🎯 Última vez: ${last.sets.map(s=>`${s.peso}kg×${s.reps}`).join(', ')}. Hoje tente ${isBodyweight?'+1 repetição por série':'as mesmas cargas com +1 repetição'} — progresso constante vence pressa.`};
}
function renderSetLogModal(){
  const { exId, exName, entry } = curLog;
  const hint = smartProgressionHint(exId);
  const suggested = `<div class="card ${hint.cls}" style="padding:12px;margin-bottom:12px"><div class="card-sub">${hint.txt}</div></div>`;
  const rows = entry.sets.length? entry.sets.map((s,i)=>`
    <div class="set-row">
      <div class="set-num">${i+1}</div>
      <input class="set-in mono" type="number" step="0.5" value="${s.peso}" onchange="updateSet(${i},'peso',this.value)" placeholder="kg">
      <input class="set-in mono" type="number" value="${s.reps}" onchange="updateSet(${i},'reps',this.value)" placeholder="reps">
      <button class="set-x" onclick="delSet(${i})">✕</button>
    </div>`).join('') : `<div class="text-dim" style="text-align:center;padding:12px 0">Nenhuma série ainda. Clique em "+ Nova série" para começar.</div>`;
  $('modal-inner').innerHTML = `
    <h3>📝 ${exName}</h3>
    <p style="font-size:13px;color:var(--text-dim);margin-top:2px">Registre peso e repetições de cada série.</p>
    ${suggested}
    <div style="margin-top:10px">
      <div class="set-row" style="border-bottom:1px solid var(--border);padding-bottom:6px;color:var(--text-dim);font-size:11px;font-weight:700;letter-spacing:1px">
        <div>#</div><div style="text-align:center">PESO (kg)</div><div style="text-align:center">REPS</div><div></div>
      </div>
      ${rows}
    </div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="addSet()">+ Nova série</button>
    <button class="btn btn-outline btn-block" class="hl-primary" style="margin-top:8px" onclick="startRestFor('${exId}','${exName.replace(/'/g,"\\'")}')">⏱️ Iniciar descanso</button>
    <div class="row" style="gap:8px;margin-top:14px">
      <button class="btn btn-ghost btn-block" onclick="closeSetLog(false)">Voltar</button>
      <button class="btn btn-primary btn-block" onclick="closeSetLog(true)">Salvar</button>
    </div>
  `;
}
function startRestFor(exId, exName){
  const ex = (state.modules.lift?.plan?.workouts||[]).flatMap(w=>w.exercises||[]).find(e=>e.id===exId);
  startRestTimer(parseRestSeconds(ex && ex.rest), exName);
}
function addSet(){
  const last = curLog.entry.sets[curLog.entry.sets.length-1];
  const prev = getLastLog(curLog.exId);
  const seed = last || (prev && prev.sets[0]) || {peso:0,reps:10};
  curLog.entry.sets.push({ peso:parseFloat(seed.peso)||0, reps:parseInt(seed.reps)||10 });
  renderSetLogModal();
}
function delSet(i){ curLog.entry.sets.splice(i,1); renderSetLogModal(); }
function updateSet(i,k,v){ curLog.entry.sets[i][k] = k==='peso'?parseFloat(v)||0:parseInt(v)||0; }
function closeSetLog(save){
  const savedExId = curLog ? curLog.exId : null;
  if(save){
    // reps>0 basta: peso 0 é válido (exercícios de peso corporal)
    curLog.entry.sets = curLog.entry.sets.filter(s=>s.reps>0 && s.peso>=0);
    // check PR (só faz sentido com peso externo)
    curLog.entry.sets.filter(s=>s.peso>0).forEach(s=>{
      const pr = state.prs[curLog.exId];
      if(!pr || s.peso > pr.peso || (s.peso===pr.peso && s.reps > pr.reps)){
        state.prs[curLog.exId] = { peso:s.peso, reps:s.reps, at:Date.now() };
        // registra o recorde agora, mas o TROFÉU só é celebrado ao salvar o treino completo
        if(pr) toast(`🏆 Novo recorde em ${curLog.exName}!`);
      }
    });
    // clean empty entries
    const arr = state.progress[curLog.exId];
    state.progress[curLog.exId] = arr.filter(p=>p.sets.length>0);
    if(!state.progress[curLog.exId].length) delete state.progress[curLog.exId];
    saveData();
    // refresh session view
    if(state.ui.tab==='sessions') renderSessions();
  }
  curLog = null;
  closeModal();
  if(typeof restTimerInt==='undefined' || !restTimerInt) releaseWakeLock(); // solta a tela se não há descanso rodando
  // Sem avanço automático: a pessoa escolhe manualmente o próximo exercício
  if(save && savedExId){
    const next = nextUnloggedExercise(savedExId);
    toast(next ? '✅ Série salva!' : '🎉 Todos registrados! Toque em "Salvar treino" pra finalizar.');
  }
}
function nextUnloggedExercise(afterExId){
  const modL = state.modules.lift;
  const w = modL && modL.plan ? currentSelectedWorkout(modL) : null;
  if(!w || !w.exercises) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const isLogged = id => ((state.progress[id]||[]).some(p=>{ const d=new Date(p.date); d.setHours(0,0,0,0); return d.getTime()===today.getTime() && p.sets.length>0; }));
  const list = w.exercises;
  const idx = list.findIndex(e=>e.id===afterExId);
  // procura a partir do seguinte, dando a volta na lista
  for(let i=1;i<=list.length;i++){
    const ex = list[(idx+i) % list.length];
    if(ex.id!==afterExId && !isLogged(ex.id)) return ex;
  }
  return null;
}

// ---------- FINISH LIFT WORKOUT ----------
function finishLiftWorkout(k){
  const mod = state.modules.lift;
  const w = mod.plan.workouts.find(x=>x.k===k);
  if(!w) return;
  if(!checkLiftDone(w)){ toast('Registre ao menos uma série antes de salvar'); return; }
  // Pergunta como a pessoa terminou o treino (auto-regulação)
  const html = `
    <h3>💪 Como você terminou o treino?</h3>
    <p style="color:var(--text-dim);font-size:13px">Sua resposta ajuda a ajustar a sugestão do próximo treino.</p>
    <div class="radio-grid" id="fl-feel" style="margin-top:12px">
      <div class="opt" data-val="otimo">🚀 Muito bem, sobrou energia</div>
      <div class="opt on" data-val="bem">😊 Bem, treino na medida</div>
      <div class="opt" data-val="cansado">😮‍💨 Cansado, foi puxado</div>
      <div class="opt" data-val="exausto">😩 Exausto, foi demais</div>
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="confirmLiftWorkout('${k}')">✅ Salvar treino</button>`;
  $('modal-inner').innerHTML = html;
  $('modal-back').classList.add('on');
  bindOpts('modal-inner');
}
function confirmLiftWorkout(k){
  const mod = state.modules.lift;
  const w = mod.plan.workouts.find(x=>x.k===k);
  if(!w) return;
  const feel = readOpt('fl-feel') || 'bem';
  // captura o que foi feito hoje em cada exercício (pra histórico e compartilhamento)
  const today = new Date(); today.setHours(0,0,0,0);
  let firstLogAt = null;
  const exercisesDone = (w.exercises||[]).map(ex=>{
    const entry = (state.progress[ex.id]||[]).find(p=>{ const d=new Date(p.date); d.setHours(0,0,0,0); return d.getTime()===today.getTime() && p.sets.length; });
    if(!entry) return null;
    if(!firstLogAt || entry.date < firstLogAt) firstLogAt = entry.date;
    const top = entry.sets.reduce((b,s)=>((s.peso||0)*(s.reps||0) > (b.peso||0)*(b.reps||0) ? s : b), entry.sets[0]);
    return { id:ex.id, name:ex.name, part:ex.part, sets:entry.sets.length, best: top.peso>0 ? `${top.peso}kg×${top.reps}` : `${top.reps} reps` };
  }).filter(Boolean);
  // duração REAL: do primeiro registro de série até agora (com limites de sanidade);
  // se não der pra medir, usa a estimativa do plano
  let realDuration = w.duration;
  if(firstLogAt){
    const mins = Math.round((Date.now() - firstLogAt) / 60000);
    if(mins >= 5 && mins <= 240) realDuration = mins;
  }
  mod.history = mod.history || [];
  const adaptInfo = adaptMode();
  const _antecipou = adjustStartIfEarly(mod);
  mod.history.push({ id:w.k, name:'Treino '+w.k+' — '+w.name, at:Date.now(), duration:realDuration, plannedDuration:w.duration, module:'lift', feel, parts:[...(w.parts||[])], exercisesDone,
    adaptedWith: adaptInfo.active ? adaptReasonText() : null });
  ensureStats(); // deriva liftTotal do histórico — NÃO somar manualmente (contava em dobro)
  checkTrophies();
  saveData();
  closeModal();
  if(feel==='exausto') toast('✅ Salvo! Vou sugerir pegar mais leve no próximo treino 😌');
  else if(feel==='otimo') toast('✅ Salvo! Se sobrou energia, considere subir a carga no próximo 📈');
  else toast('✅ Treino salvo com sucesso!');
  if(_antecipou) setTimeout(()=>toast('🚀 Você começou antes do combinado! Ajustei o início do plano pra hoje.'), 1400);
  goTab('home');
  // convite discreto pra compartilhar o treino recém-concluído
  const idx = mod.history.length-1;
  setTimeout(()=>offerShareAfterWorkout(idx), 700);
}
// Sugestão de auto-regulação com base nos últimos treinos de musculação
// Ciclo de treino (Adaptação → Volume → Sobrecarga → Deload, 4 semanas rodando)
function cicloAtual(){
  try{
    const mod = state.modules.lift; if(!mod) return null;
    const h = (mod.history||[]);
    const t0 = (typeof planStartTs==='function' ? planStartTs(mod) : 0) || mod.planCriadoEm || (mod.plan && mod.plan.criadoEm) || (h.length ? h[0].at : null);
    if(!t0) return null;
    const wk = Math.max(0, Math.floor((Date.now()-t0)/(7*86400000)));
    const fases = [
      {nome:'Adaptação',  emo:'🌱', dica:'Semana de adaptação: foco total na técnica e em completar as séries com conforto.'},
      {nome:'Volume',     emo:'📦', dica:'Semana de volume: mantenha a carga e busque completar todas as repetições com boa forma.'},
      {nome:'Sobrecarga', emo:'🔥', dica:'Semana de sobrecarga: se as séries saírem bem, suba um pouco a carga (2-5%).'},
      {nome:'Deload',     emo:'😌', dica:'Semana leve (deload): reduza a carga em ~40% ou tire 1 série de cada exercício. É agora que o corpo consolida os ganhos.'}
    ];
    return { sem: wk+1, ...fases[wk % 4] };
  }catch(e){ return null; }
}
// Progressão REAL: fechou todas as séries no topo das reps com a MESMA carga nas 2 últimas sessões → sugere +2-5%
function progressionTip(){
  try{
    const mod = state.modules.lift; if(!mod || !mod.plan) return null;
    const hoje = getDayIdx();
    const w = (mod.plan.workouts||[]).find(x=>x.dayIdx===hoje); if(!w) return null;
    for(const ex of (w.exercises||[])){
      const logs = (state.progress[ex.id]||[]).filter(p=>p.sets && p.sets.length).sort((a,b)=>a.date-b.date).slice(-2);
      if(logs.length < 2) continue;
      const top = parseInt(String(ex.reps||'').split('-').pop()) || 12;
      const pesoDe = sess => Math.max(...sess.sets.map(x=>+x.peso||0));
      const fechou = sess => { const w0=pesoDe(sess); return w0>0 && sess.sets.every(x=>(+x.peso||0)===w0 && (+x.reps||0)>=top); };
      if(!fechou(logs[0]) || !fechou(logs[1])) continue;
      if(pesoDe(logs[0]) !== pesoDe(logs[1])) continue;
      const atual = pesoDe(logs[1]);
      const novo = Math.round(atual*1.04*2)/2;
      if(novo<=atual) continue;
      return { emo:'📈', txt:`No <b>${ex.name}</b> você fechou todas as séries com ${atual}kg nas últimas 2 sessões. Hora de progredir: tente <b>${novo}kg</b> hoje (+2-5%). 💪` };
    }
    return null;
  }catch(e){ return null; }
}
function liftLoadSuggestion(){
  const h = (state.modules.lift?.history||[]).filter(x=>x.feel).slice(-2);
  if(!h.length) return null;
  const last = h[h.length-1];
  const lastTwo = h.length>=2 && h.every(x=>x.feel==='exausto');
  if(lastTwo) return {emo:'🛑', txt:'Seus 2 últimos treinos terminaram em exaustão. Hoje reduza a carga em ~20% e priorize a técnica — recuperar também é evoluir.'};
  if(last.feel==='exausto') return {emo:'😌', txt:'Último treino foi pesado demais. Sugestão: reduza a carga em ~10% hoje e capriche na execução.'};
  if(last.feel==='cansado') return {emo:'⚖️', txt:'Último treino foi puxado. Mantenha a mesma carga hoje e foque em completar todas as séries com boa forma.'};
  const cic = cicloAtual();
  if(cic && cic.nome==='Deload') return {emo:cic.emo, txt:cic.dica};
  const prog = progressionTip();
  if(prog) return prog;
  if(last.feel==='otimo') return {emo:'📈', txt:'Você terminou o último treino com energia sobrando — boa hora pra subir a carga em ~5% ou adicionar 1-2 repetições.'};
  return null;
}
function markRunDone(dayIdx){
  const mod = state.modules.run;
  const w = mod.plan.workouts.find(x=>String(x.dayIdx)===String(dayIdx));
  if(!w) return;
  mod.history = mod.history || [];
  const _antecipouR = adjustStartIfEarly(mod);
  mod.history.push({ id:w.k, name:w.name, at:Date.now(), duration:w.duration, module:'run' });
  if(_antecipouR) setTimeout(()=>toast('🚀 Você começou antes do combinado! Ajustei o início do plano pra hoje.'), 1400);
  ensureStats(); // deriva runTotal do histórico — NÃO somar manualmente (contava em dobro)
  checkTrophies();
  saveData();
  toast('✅ Corrida marcada como feita!');
  goTab('home');
}

// ---------- HISTORY ----------
const HIST_PAGE = 14;      // dias carregados por vez
let histLimit = HIST_PAGE;
function renderHistory(){
  if(!state || !state.user){ try{ showScreen('scr-auth'); }catch(e){} return; }   // logout no meio de um render
  // módulo ativo sem plano (ex.: trocou de módulo e não criou): não quebra a tela
  if(!state.modules[state.active]){ showPickScreen(); return; }
  const mod = state.modules[state.active];
  const isLift = state.active==='lift';
  const h = mod.history||[];
  $('hist-title').textContent = `${isLift?'🏋️':'🏃'} Histórico${isLift?'':' de Atividades'}`;
  renderHistEvolution(isLift, (state.modules[state.active]?.history)||[]);
  $('hist-tag').textContent = `Histórico · ${isLift?'Musculação':'Corrida, caminhada e bike'}`;
  $('h-icon').textContent = isLift?'🏋️':'🏃';
  $('h-lbl1').textContent = isLift?'Treinos':'Atividades';
  $('h-icon3').textContent = isLift?'⏱️':'📍';
  $('h-lbl3').textContent = isLift?'Total':'Total';
  $('h-count').textContent = h.length;
  $('h-streak').textContent = calcStreak(h)+'d';
  const totalHours = h.reduce((s,x)=>s+(x.duration||0),0)/60;
  $('h-total').textContent = totalHours<1?'0h':totalHours.toFixed(1)+'h';
  if(!h.length){
    $('history-list').innerHTML=''; $('history-empty').classList.remove('hidden');
    $('he-title').textContent = isLift?'Nenhum treino registrado ainda':'Nenhuma corrida registrada';
    $('he-sub').textContent = 'Cada sessão que você finalizar vai aparecer aqui (guardamos últimos 90 dias).';
  } else {
    $('history-empty').classList.add('hidden');
    // agrupa por dia, mais recente primeiro
    const sorted = h.slice().map((x,i)=>({...x,_idx:i})).sort((a,b)=>b.at-a.at);
    const groups = [];
    sorted.forEach(x=>{
      const d = new Date(x.at);
      const key = d.toDateString();
      let g = groups.find(gr=>gr.key===key);
      if(!g){ g = {key, date:d, items:[]}; groups.push(g); }
      g.items.push(x);
    });
    const todayKey = new Date().toDateString();
    const yestKey = new Date(Date.now()-86400000).toDateString();
    // Só desenha os dias mais recentes. Com meses de treino, renderizar tudo de uma vez
    // deixa a aba lenta no celular — o resto entra sob demanda no "Carregar mais".
    const totalDias = groups.length;
    const visiveis = groups.slice(0, histLimit);
    $('history-list').innerHTML = visiveis.map(g=>{
      const lbl = g.key===todayKey ? 'Hoje' : g.key===yestKey ? 'Ontem' : g.date.toLocaleDateString('pt-BR',{weekday:'long', day:'2-digit', month:'2-digit'});
      const cards = g.items.map(x=>{
        const d = new Date(x.at);
        const isRunEntry = x.module==='run';
        const emo = x.activity==='caminhada'?'🚶':x.activity==='bike'?'🚴':isRunEntry?'🏃':'💪';
        const feelEmo = {otimo:'🚀',bem:'😊',cansado:'😮‍💨',exausto:'😩'}[x.feel]||'';
        const parts = !isRunEntry ? partsFromEntry(x) : [];
        const nExs = (x.exercisesDone||[]).length;
        const meta = isRunEntry
          ? `<span>⏱️ <b>${fmtDur(x.duration)}</b></span>${x.distance?`<span>📍 <b>${x.distance}km</b></span>`:''}${x.pace?`<span>⚡ <b>${x.pace}</b></span>`:''}`
          : `<span>⏱️ <b>${x.duration}min</b></span>${nExs?`<span>🏋️ <b>${nExs} exercícios</b></span>`:''}${feelEmo?`<span>${feelEmo}</span>`:''}`;
        return `<div class="hist-card ${isRunEntry?'run':''}" onclick="openHistoryEntry(${x._idx})">
          <div class="hist-emo">${emo}</div>
          <div style="flex:1;min-width:0">
            <div class="hist-name">${String(x.name||'Treino').replace(/^[🚶🚴🏃]\s*/u,'')}</div>
            <div class="hist-meta"><span>🕐 ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>${meta}</div>
            ${parts.length?`<div class="hist-chips">${parts.map(p=>`<span class="hist-chip">${p}</span>`).join('')}</div>`:''}
            ${x.adaptedWith?`<div style="margin-top:5px;font-size:11px;color:var(--info-soft)">🩹 Treinou adaptado — ${x.adaptedWith}</div>`:''}
          </div>
          <div class="hist-arrow">›</div>
        </div>`;
      }).join('');
      return `<div class="hist-day-lbl">${lbl}</div>${cards}`;
    }).join('') + (totalDias > histLimit
      ? `<button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="histShowMore()">⌄ Carregar mais (${totalDias - histLimit} ${totalDias-histLimit===1?'dia':'dias'} antes)</button>`
      : (totalDias > HIST_PAGE ? `<div style="text-align:center;color:var(--text-mute);font-size:12px;margin-top:12px">Fim do histórico · ${totalDias} dias</div>` : ''));
  }
}
function histShowMore(){ histLimit += HIST_PAGE; renderHistory(); }
// ===== MODO FÉRIAS (pausa cobranças e preserva a sequência) =====
function vacationActive(){ return !!(state.vacation && state.vacation.active); }
function isVacationDay(date){
  const t = new Date(date); t.setHours(0,0,0,0); const tt = t.getTime();
  const v = state.vacation; if(!v) return false;
  if(v.active && v.startedAt!=null && tt>=v.startedAt && tt<=Date.now()) return true;
  return (v.periods||[]).some(p=>tt>=p.start && tt<=p.end);
}
// Aniversário é dia livre de verdade: não marca falta e não quebra a sequência
function isBirthday(date){
  try{
    const b = state.user && state.user.profile && state.user.profile.birth; if(!b) return false;
    const p = String(b).split('-').map(Number); if(!p[1]||!p[2]) return false;
    const d = date ? new Date(date) : new Date();
    return (d.getMonth()+1)===p[1] && d.getDate()===p[2];
  }catch(e){ return false; }
}
// início real do plano (escolhido pelo aluno ou criação) — antes disso não existe "falta"
// Primeiro treino REAL a partir do início do plano (se começa terça mas treina qua/sex, é quarta)
function planFirstWorkoutInfo(mod){
  try{
    const m = mod || state.modules[state.active];
    if(!m || !m.plan) return null;
    const dias = (m.plan.workouts||[]).map(w=>w.dayIdx);
    if(!dias.length) return null;
    const h0 = new Date(); h0.setHours(0,0,0,0);
    const st0 = new Date(planStartTs(m) || h0.getTime()); st0.setHours(0,0,0,0);
    const ini = st0.getTime() > h0.getTime() ? st0 : h0;   // nunca olha pro passado
    for(let k=0;k<21;k++){
      const d = new Date(ini); d.setDate(d.getDate()+k);
      const idx = (d.getDay()===0) ? 7 : d.getDay();       // 1=segunda … 7=domingo
      if(dias.includes(idx)){
        const emDias = Math.round((d.getTime()-h0.getTime())/86400000);
        return { data:d, emDias, hoje:emDias===0,
          fmt: d.toLocaleDateString('pt-BR',{weekday:'long', day:'numeric', month:'long'}),
          quando: emDias===0 ? 'hoje' : (emDias===1 ? 'amanhã' : 'em '+emDias+' dias') };
      }
    }
    return null;
  }catch(e){ return null; }
}
function planStartTs(mod){
  const m = mod || state.modules[state.active];
  if(!m) return 0;
  return m.startAt || m.createdAt || (m.history && m.history.length ? m.history[0].at : 0) || 0;
}
// Se a pessoa treinar antes da data agendada, o plano passa a valer HOJE
// (evita o estado estranho de "não começou" com treino já registrado)
function adjustStartIfEarly(mod){
  try{
    if(!mod) return false;
    const h0 = new Date(); h0.setHours(0,0,0,0);
    if(mod.startAt && mod.startAt > h0.getTime()){
      mod.startAt = h0.getTime();
      return true;
    }
  }catch(e){}
  return false;
}
function calcStreak(h){
  if(!h||!h.length) return 0;
  const days = new Set(h.map(x=>new Date(x.at).toDateString()));
  let s=0, cur=new Date(), guard=0;
  while(guard++ < 3650){
    const ds = cur.toDateString();
    if(days.has(ds)){ s++; cur.setDate(cur.getDate()-1); continue; }
    if(isVacationDay(cur) || isBirthday(cur)){ cur.setDate(cur.getDate()-1); continue; } // férias/aniversário: pula sem quebrar a sequência
    break;
  }
  return s;
}

// ---------- PERF ----------
// ---------- CALENDÁRIO MENSAL ----------
// Mostra o mês com os dias numerados. Cada dia treinado ganha fundo e pontinhos
// indicando a modalidade (verde = musculação, âmbar = corrida/caminhada/bike).
let calOffset = 0; // 0 = mês atual, -1 = mês anterior...
function calMove(delta){
  calOffset = Math.min(0, calOffset + delta); // não deixa navegar pro futuro
  renderCalendar();
}
function moodEmoji(x){
  if(x && x.feel){ return ({otimo:'🚀', bem:'😊', cansado:'😮‍💨', exausto:'😩'})[x.feel] || ''; }
  if(x && x.rating!=null){ return x.rating>=5?'🚀':(x.rating<=1?'😩':'😊'); }
  return '';
}
function renderCalendar(){
  if(!state || !state.user){ try{ showScreen('scr-auth'); }catch(e){} return; }   // logout no meio de um render
  const box = $('calendar'); if(!box) return;
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + calOffset);
  const ano = base.getFullYear(), mes = base.getMonth();

  // agrupa o histórico por dia
  const porDia = {};
  const add = (arr, tipo) => (arr||[]).forEach(x=>{
    const d = new Date(x.at); d.setHours(0,0,0,0);
    const k = d.getTime();
    porDia[k] = porDia[k] || { lift:false, run:false, min:0, mood:'' };
    porDia[k][tipo] = true;
    porDia[k].min += Math.round(x.duration||0);
    if(!porDia[k].mood){ porDia[k].mood = moodEmoji(x); }
  });
  add(state.modules.lift?.history, 'lift');
  add(state.modules.run?.history, 'run');

  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const t = $('cal-title'); if(t) t.textContent = `${meses[mes]} ${ano}`;

  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const primeiro = new Date(ano, mes, 1);
  const diasNoMes = new Date(ano, mes+1, 0).getDate();
  // segunda = 0 ... domingo = 6
  const inicioCol = (primeiro.getDay() + 6) % 7;

  let html = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d=>`<div class="cal-wd">${d}</div>`).join('');
  for(let i=0;i<inicioCol;i++) html += '<div class="cal-day empty"></div>';

  let treinados = 0, minutos = 0;
  for(let dia=1; dia<=diasNoMes; dia++){
    const d = new Date(ano, mes, dia); d.setHours(0,0,0,0);
    const info = porDia[d.getTime()];
    const futuro = d > hoje;
    const isHoje = d.getTime() === hoje.getTime();
    const classes = ['cal-day'];
    if(info) { classes.push('done'); treinados++; minutos += info.min; }
    if(futuro) classes.push('future');
    if(isHoje) classes.push('today');
    const pontos = info
      ? `<div class="cal-dots">${info.lift?'<span class="cal-dot" style="background:var(--lift)"></span>':''}${info.run?'<span class="cal-dot" style="background:var(--run)"></span>':''}</div>`
      : '<div class="cal-dots"></div>';
    // dia da prova alvo ganha bandeira 🏁
    const rd = state.modules.run && state.modules.run.setup && state.modules.run.setup.raceDate;
    let ehProva = false;
    if(rd){ const p = new Date(rd); p.setHours(0,0,0,0); ehProva = p.getTime() === d.getTime(); }
    if(ehProva) classes.push('cal-race');
    const titulo = ehProva ? `${dia}/${mes+1} · 🏁 DIA DA PROVA` : (info ? `${dia}/${mes+1} · ${info.min} min` : `${dia}/${mes+1} · sem treino`);
    const temNota = !!((state.dayNotes||{})[d.getTime()]);
    const notaMark = temNota ? '<span style="position:absolute;top:1px;right:2px;font-size:8px;line-height:1">📝</span>' : '';
    const clic = futuro ? '' : `onclick="openDayDetail(${d.getTime()})" style="cursor:pointer;position:relative"`;
    const moodMark = (info && info.mood) ? `<span style="position:absolute;bottom:0;right:2px;font-size:9px;line-height:1">${info.mood}</span>` : '';
    html += `<div class="${classes.join(' ')}" title="${titulo}" ${clic}><span>${ehProva?'🏁':dia}</span>${pontos}${notaMark}${moodMark}</div>`;
  }
  box.innerHTML = `<div class="cal-grid">${html}</div>`;
  const s = $('cal-summary');
  if(s) s.textContent = treinados ? `${treinados} ${treinados===1?'dia treinado':'dias treinados'} · ${minutos} min` : 'nenhum treino neste mês';
}
// Detalhe do dia no calendário: resumo do(s) treino(s) + anotação pessoal (diário de treino)
function openDayDetail(ts){
  const d = new Date(ts); d.setHours(0,0,0,0);
  const dd=String(d.getDate()).padStart(2,'0'), mm=String(d.getMonth()+1).padStart(2,'0'), yy=d.getFullYear();
  const doDia = arr => (arr||[]).filter(x=>{ const t=new Date(x.at); t.setHours(0,0,0,0); return t.getTime()===d.getTime(); });
  const lifts = doDia(state.modules.lift&&state.modules.lift.history);
  const runs  = doDia(state.modules.run&&state.modules.run.history);
  let resumo;
  if(lifts.length || runs.length){
    resumo = '<div class="card" style="padding:12px;margin-top:10px">';
    lifts.forEach(x=> resumo += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13.5px"><span>💪 ${(x.title||x.name||'Musculação').replace(/</g,'&lt;')}</span><span class="mono" style="color:var(--text-dim)">${x.duration?fmtDur(x.duration):''}</span></div>`);
    runs.forEach(x=> resumo += `<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13.5px"><span>${x.activity==='bike'?'🚴':x.activity==='caminhada'?'🚶':'🏃'} ${x.distance?x.distance+'km':(x.activity||'Corrida')}</span><span class="mono" style="color:var(--text-dim)">${x.duration?fmtDur(x.duration):''}</span></div>`);
    resumo += '</div>';
  } else {
    resumo = '<div class="card-sub" style="margin-top:8px;color:var(--text-dim)">Nenhum treino registrado neste dia.</div>';
  }
  const nota = (state.dayNotes||{})[ts] || '';
  $('modal-inner').innerHTML = `
    <h3>📅 ${dd}/${mm}/${yy}</h3>
    ${resumo}
    <div class="field" style="margin-top:12px"><label>📝 Anotação do dia</label><textarea class="input" id="day-note" rows="4" style="resize:vertical" placeholder="Ex: subi o supino pra 25kg 💪 · dormi mal, rendeu pouco · joelho incomodou · primeiro 5km sem parar 🎉">${nota.replace(/</g,'&lt;')}</textarea></div>
    <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="saveDayNote(${ts})">💾 Salvar anotação</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function saveDayNote(ts){
  const val = ($('day-note').value||'').trim();
  state.dayNotes = state.dayNotes || {};
  if(val) state.dayNotes[ts] = val; else delete state.dayNotes[ts];
  saveData();
  closeModal();
  toast(val ? '📝 Anotação salva!' : 'Anotação removida');
  renderCalendar();
}
// ---------- RECORDES (discreto, dentro de Desempenho) ----------
function renderRecords(){
  const card = $('card-records'); const list = $('records-list');
  if(!card || !list) return;
  const linhas = [];
  const nome = id=>{ for(const c of EX_BANK) for(const e of c.items) if(slug(e.name)===id) return e.name; return id; };
  const dt = ts => ts ? new Date(ts).toLocaleDateString('pt-BR') : '';
  // top 3 PRs de musculação
  Object.entries(state.prs||{})
    .map(([id,pr])=>({id,...pr}))
    .sort((a,b)=>b.peso-a.peso).slice(0,3)
    .forEach(p=>linhas.push({emo:'🏋️', titulo:nome(p.id), sub:dt(p.at), val:`${p.peso}kg × ${p.reps}`}));
  // corrida: maior distância e melhor pace
  const runs = (state.modules.run?.history||[]).filter(r=>!r.activity || r.activity==='corrida');
  if(runs.length){
    const maior = runs.reduce((a,b)=>(b.distance||0)>(a.distance||0)?b:a);
    if(maior.distance) linhas.push({emo:'🏃', titulo:'Maior distância', sub:dt(maior.at), val:`${maior.distance} km`});
    const comPace = runs.filter(r=>r.pace);
    if(comPace.length){
      const best = comPace.reduce((a,b)=>parsePace(b.pace)<parsePace(a.pace)?b:a);
      linhas.push({emo:'⚡', titulo:'Melhor ritmo', sub:dt(best.at), val:best.pace});
    }
  }
  // bike / caminhada: maior distância
  [['bike','🚴','Maior pedalada'],['caminhada','🚶','Maior caminhada']].forEach(([tipo,emo,titulo])=>{
    const arr = (state.modules.run?.history||[]).filter(r=>r.activity===tipo && r.distance);
    if(arr.length){ const m = arr.reduce((a,b)=>b.distance>a.distance?b:a); linhas.push({emo, titulo, sub:dt(m.at), val:`${m.distance} km`}); }
  });
  if(!linhas.length){ card.style.display='none'; return; }
  card.style.display='';
  list.innerHTML = linhas.map(l=>`
    <div class="rec-row">
      <span style="font-size:18px">${l.emo}</span>
      <div><div style="font-weight:700;font-size:13.5px">${l.titulo}</div><div style="font-size:11.5px;color:var(--text-mute)">${l.sub}</div></div>
      <div class="rec-val">${l.val}</div>
    </div>`).join('');
}
function renderPerf(){
  if(!state || !state.user){ try{ showScreen('scr-auth'); }catch(e){} return; }   // logout no meio de um render
  // módulo ativo sem plano (ex.: trocou de módulo e não criou): não quebra a tela
  if(!state.modules[state.active]){ showPickScreen(); return; }
  // Sem nenhum treino, a tela virava uma parede de zeros (0/5, 0kg, 0, 0, 0min, 0d).
  // Pra quem acabou de entrar isso desanima em vez de informar.
  try{
    const totalTudo = ((((state.modules.lift||{}).history)||[]).length) + ((((state.modules.run||{}).history)||[]).length);
    const box = $('perf-empty');
    if(box) box.innerHTML = totalTudo===0
      ? `<div class="note note-info"><div class="note-title">📊 Seus números aparecem aqui</div>
         <div class="note-line">Assim que você registrar o primeiro treino, esta tela mostra sequência, volume, recordes, constância e a distribuição das suas atividades.</div>
         <div class="note-line" style="margin-top:6px">Por enquanto está tudo zerado — e isso é só o ponto de partida. 💪</div></div>`
      : '';
  }catch(e){}
  const _pm = state.modules[state.active];
  if(_pm && !_pm.plan){ showScreen('scr-runlog'); renderRunLogScreen(); return; }
  renderCalendar();
  renderRecords();
  const mod = state.modules[state.active];
  const isLift = state.active==='lift';
  const h = mod.history||[];
  const wkTarget = mod.plan.workouts.length;
  const now = Date.now();
  const start = now - 7*86400000;
  const prevStart = now - 14*86400000;
  const weekDone = h.filter(x=>x.at>=start).length;
  $('s1-lbl').textContent = isLift?'Treinos 7d':'Atividades 7d';
  $('s1-val').innerHTML = `${weekDone}<small>/${wkTarget}</small>`;
  $('s1-note').textContent = Math.round(weekDone/wkTarget*100)+'% da meta';
  // volume/km com variação REAL vs semana anterior
  $('s2-lbl').textContent = isLift?'Volume 7d':'Distância 7d';
  let cur, prev;
  if(isLift){
    cur = calcVolumeBetween(start, now); prev = calcVolumeBetween(prevStart, start);
    $('s2-val').innerHTML = `${Math.round(cur)}<small>kg</small>`;
  } else {
    const kmIn=(a,b)=>h.filter(x=>x.at>=a&&x.at<b).reduce((s,r)=>s+(r.distance||0),0);
    cur = kmIn(start,now+1); prev = kmIn(prevStart,start);
    $('s2-val').innerHTML = `${cur.toFixed(1)}<small>km</small>`;
  }
  $('s2-note').textContent = prev>0 ? (cur>=prev?`↑ +${Math.round((cur-prev)/prev*100)}% vs semana passada`:`↓ ${Math.round((cur-prev)/prev*100)}% vs semana passada`) : (cur>0?'primeira semana com registro':'—');
  // recordes reais
  ensureStats();
  if(isLift){
    $('s3-lbl').textContent = 'Recordes (PRs)';
    $('s3-val').textContent = Object.keys(state.prs||{}).length;
    $('s3-note').textContent = 'exercícios com PR';
  } else {
    $('s3-lbl').textContent = 'Km de corrida';
    $('s3-val').textContent = state.stats.runKmTotal.toFixed(0);
    $('s3-note').textContent = 'só corrida, acumulado';
  }
  $('m-streak').textContent = calcStreak(h);
  const totalMin = Math.round(h.reduce((s,x)=>s+(x.duration||0),0));
  $('m-total').textContent = totalMin<60?totalMin+'min':(totalMin/60).toFixed(1)+'h';
  // melhor sequência REAL (calculada do histórico + memória vitalícia)
  const best = calcBestStreak(h);
  if(!state.stats.bestStreak || best > state.stats.bestStreak){ state.stats.bestStreak = best; saveData(); }
  $('m-best').textContent = Math.max(best, state.stats.bestStreak||0) + 'd';
  // constância 4 semanas (dados reais do histórico)
  const line = $('perf-line'), dots = $('perf-dots');
  if(line){
    const pts=[];
    for(let i=3;i>=0;i--){
      const s=now-(i+1)*7*86400000, e=now-i*7*86400000;
      const done = h.filter(x=>x.at>=s && x.at<e).length;
      const pct = Math.min(100,(done/wkTarget)*100);
      pts.push([40+(3-i)*100, 158-pct*1.32]);   // sobe a curva pra não cobrir os rótulos S1-S4
    }
    line.setAttribute('points', pts.map(p=>p.join(',')).join(' '));
    // área preenchida sob a linha + valores em cima dos pontos (antes eram só bolinhas soltas)
    const areaEl = $('perf-area');
    if(areaEl) areaEl.setAttribute('points', `${pts[0][0]},158 ` + pts.map(p=>p.join(',')).join(' ') + ` ${pts[pts.length-1][0]},158`);
    if(dots) dots.innerHTML = pts.map((p,i)=>{
      const s2 = now-(4-i)*7*86400000, e2 = now-(3-i)*7*86400000;
      const feitos = h.filter(x=>x.at>=s2 && x.at<e2).length;
      const pct = Math.round(Math.min(100,(feitos/wkTarget)*100));
      const bateu = feitos>=wkTarget;
      return `<circle cx="${p[0]}" cy="${p[1]}" r="${bateu?6:4.5}" fill="${bateu?'#34d399':'#0a1122'}" stroke="#10b981" stroke-width="${bateu?0:2.5}"/>
        <text x="${p[0]}" y="${Math.max(14, p[1]-13)}" fill="${bateu?'#34d399':'#94a3b8'}" font-size="11" font-weight="800" text-anchor="middle">${pct}%</text>`;
    }).join('');
  }
  renderDistDonut();
  // metas semanal e mensal (reais)
  const gb = $('goals-box');
  if(gb){
    const monthDone = h.filter(x=>x.at >= now-30*86400000).length;
    const monthTarget = wkTarget*4;
    // ANEL DE PROGRESSO: um SVG por meta, mais legível de relance que a barra antiga
    const anel = (done, target, lbl, cor)=>{
      const pct = target>0 ? Math.min(100, Math.round(done/target*100)) : 0;
      const R = 34, C = 2*Math.PI*R;
      const off = C - (pct/100)*C;
      const hit = target>0 && done>=target;
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;min-width:0">
        <svg width="88" height="88" viewBox="0 0 88 88" style="transform:rotate(-90deg)">
          <circle cx="44" cy="44" r="${R}" fill="none" stroke="rgba(148,163,184,.16)" stroke-width="8"/>
          <circle cx="44" cy="44" r="${R}" fill="none" stroke="${cor}" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
            style="transition:stroke-dashoffset .7s cubic-bezier(.2,.8,.3,1)"/>
        </svg>
        <div style="margin-top:-62px;text-align:center;pointer-events:none">
          <div style="font-weight:800;font-size:19px;letter-spacing:-.5px">${done}<span style="color:var(--text-mute);font-weight:700;font-size:14px">/${target}</span></div>
          ${hit?'<div style="font-size:13px;margin-top:-2px">🎉</div>':`<div style="font-size:10.5px;color:var(--text-mute);font-weight:700">${pct}%</div>`}
        </div>
        <div style="margin-top:26px;font-size:11.5px;color:var(--text-dim);font-weight:700;letter-spacing:.3px">${lbl}</div>
      </div>`;
    };
    const streakAtual = (typeof calcStreak==='function') ? calcStreak(h) : 0;
    const metaStreak = Math.max(7, Math.ceil((streakAtual+1)/7)*7);
    gb.innerHTML = `<div style="display:flex;gap:6px;justify-content:space-around;padding:6px 0 2px">
      ${anel(weekDone, wkTarget, 'SEMANA', 'var(--primary)')}
      ${anel(monthDone, monthTarget, 'MÊS', 'var(--info)')}
      ${anel(streakAtual, metaStreak, 'SEQUÊNCIA', 'var(--accent)')}
    </div>`;
  }
}
function calcVolumeBetween(a,b){
  let t=0;
  Object.values(state.progress||{}).forEach(logs=>{
    logs.forEach(p=>{ if(p.date>=a && p.date<b) p.sets.forEach(s=>{ t += (s.peso||0)*(s.reps||0); }); });
  });
  return t;
}
function calcBestStreak(h){
  if(!h||!h.length) return 0;
  const days = [...new Set(h.map(x=>{ const d=new Date(x.at); d.setHours(0,0,0,0); return d.getTime(); }))].sort((a,b)=>a-b);
  let best=1, cur=1;
  for(let i=1;i<days.length;i++){
    if(days[i]-days[i-1]===86400000){ cur++; best=Math.max(best,cur); } else cur=1;
  }
  return best;
}
// Donut real: distribuição de TODAS as atividades dos últimos 7 dias (ambos módulos)
function renderDistDonut(){
  const start = Date.now()-7*86400000;
  const liftN = (state.modules.lift?.history||[]).filter(x=>x.at>=start).length;
  const runH = (state.modules.run?.history||[]).filter(x=>x.at>=start);
  const runN = runH.filter(r=>!r.activity||r.activity==='corrida').length;
  const walkN = runH.filter(r=>r.activity==='caminhada').length;
  const bikeN = runH.filter(r=>r.activity==='bike').length;
  const total = liftN+runN+walkN+bikeN;
  const donut = $('dist-donut'), legend = $('dist-legend');
  if(!donut||!legend) return;
  const cats = [
    {n:liftN, lbl:'💪 Musculação', color:'#10b981'},
    {n:runN, lbl:'🏃 Corrida', color:'#f59e0b'},
    {n:walkN, lbl:'🚶 Caminhada', color:'#38bdf8'},
    {n:bikeN, lbl:'🚴 Bike', color:'#a78bfa'}
  ].filter(c=>c.n>0);
  if(!total){
    donut.innerHTML = `<circle cx="60" cy="60" r="45" fill="none" stroke="rgba(148,163,184,0.14)" stroke-width="14"/><text x="60" y="66" text-anchor="middle" fill="#94a3b8" font-size="12">Sem dados</text>`;
    legend.innerHTML = `<div class="text-dim" style="font-size:13px">Registre treinos essa semana pra ver a distribuição aqui.</div>`;
    return;
  }
  const C = 2*Math.PI*45;
  let off = 0;
  donut.innerHTML = cats.map(c=>{
    const frac = c.n/total;
    const seg = `<circle cx="60" cy="60" r="45" fill="none" stroke="${c.color}" stroke-width="14" stroke-dasharray="${(frac*C).toFixed(1)} ${(C-frac*C).toFixed(1)}" stroke-dashoffset="${(-off*C).toFixed(1)}" transform="rotate(-90 60 60)"/>`;
    off += frac;
    return seg;
  }).join('') + `<text x="60" y="66" text-anchor="middle" fill="#e2e8f0" font-size="16" font-weight="800">${total}</text>`;
  legend.innerHTML = cats.map(c=>`<div style="display:flex;justify-content:space-between;padding:6px 0"><span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${c.color};margin-right:6px"></span>${c.lbl}</span><b>${Math.round(c.n/total*100)}%</b></div>`).join('');
}
// ---------- PLAN SCREEN ----------
function renderPlan(){
  const mod = state.modules[state.active];
  const isLift = state.active==='lift';
  const s = mod.setup;
  $('plan-title').textContent = `💎 Plano · ${isLift?'Musculação':'Corrida'}`;
  const rows = isLift ? [
    ['Objetivo', labelGoal(mod)], ['Dias de treino', s.days+' dias/semana'],
    ['Equipamento', {academia:'🏋️ Academia completa',halteres:'💪 Só halteres',casa:'🤸 Peso do corpo',basico:'💪 Halteres'}[s.equip]],
    ['Nível', s.level.charAt(0).toUpperCase()+s.level.slice(1)], ['Duração', mod.plan.totalWeeks+' semanas']
  ] : [
    ['Objetivo', labelGoal(mod)], ['Duração', mod.plan.totalWeeks+' semanas'],
    ['Sessões/semana', s.days+' dias'], ['Terreno', {asfalto:'🛣️ Asfalto',esteira:'🏃 Esteira',trilha:'⛰️ Trilha',pista:'🏟️ Pista'}[s.terrain]],
    ['Nível', s.level.charAt(0).toUpperCase()+s.level.slice(1)]
  ];
  $('plan-details').innerHTML = `<div class="card">${rows.map(r=>`<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed var(--border)"><span class="text-dim">${r[0]}</span><b>${r[1]}</b></div>`).join('')}</div>`;
  const days = accessDaysLeft();
  $('pl-access').textContent = days>=999999 ? '♾️ Acesso vitalício' : days>0?'Acesso ativo':'Acesso expirado';
  $('pl-days').textContent = accessLabel(days);
}
function regenPlan(){ openSetupScreen(state.active); }
// Cancela o plano de corrida mantendo os registros (volta pro modo "só atividades").
function cancelRunPlan(){
  const run = state.modules.run;
  if(!run || !run.plan){ toast('Você não tem um plano de corrida ativo.'); return; }
  appConfirm('Seus registros e conquistas de bike/caminhada/corrida são mantidos — você volta pro modo de só registrar atividades. Pode montar um novo plano quando quiser.', ()=>{
    run.plan = null;
    run.setup = { ...(run.setup||{}), logOnly:true };
    saveData();
    toast('✅ Plano de corrida cancelado. Seus registros foram mantidos. 💚');
    if(state.active==='run') goTab('home'); else renderProfile();
  }, {title:'Cancelar plano de corrida?', emo:'🏃', okLabel:'Sim, cancelar plano', danger:true});
}

// ---------- PROFILE ----------
function renderProfile(){
  if(!state || !state.user){ try{ showScreen('scr-auth'); }catch(e){} return; }   // logout no meio de um render
  try{ ensureStateShape(); }catch(e){}
  const u = state.user, p = u.profile || {};
  const vEl = $('pf-version'); if(vEl) vEl.textContent = APP_VERSION;
  try{ const sr=$('pf-sentado-row'); if(sr){ const r=rotinaAtual(); sr.querySelector('span').textContent = r&&ROTINAS[r] ? 'Rotina: '+ROTINAS[r].label.split(' (')[0] : 'Minha rotina de trabalho'; } }catch(e){}
  try{ if(state.user && state.user.isAdmin) checkNewFeedback(); }catch(e){}
  // A seção "Meu perfil" só tem o botão do painel — sem ele, o título ficava
  // sozinho na tela pro aluno comum, parecendo bug.
  try{
    const ehAdm = !!(state.user && state.user.isAdmin);
    const lbl = $('pf-admin-lbl'); if(lbl) lbl.classList.toggle('hidden', !ehAdm);
    const bt = $('pf-admin-btn'); if(bt) bt.classList.toggle('hidden', !ehAdm);
  }catch(e){}
  const dEl = $('deco-row-label'); if(dEl) dEl.textContent = decoEnabled() ? 'Fundo decorativo (ligado)' : 'Fundo decorativo (desligado)';
  const vEl2 = $('vac-row-label'); if(vEl2) vEl2.textContent = vacationActive() ? 'Modo Férias (ativo 🌴)' : 'Modo Férias (desligado)';
  renderAvatar('pf-avatar');
  const rp = $('pf-remove-photo'); if(rp) rp.style.display = p.photo ? 'block' : 'none';
  const painBadge = $('pf-pain-badge'); if(painBadge){ const pn=(u.pain||[]); painBadge.innerHTML = pn.length?`<span style="padding:2px 8px;border-radius:99px;background:var(--tint-danger);color:var(--danger-soft);font-weight:800">${pn.join(', ')}</span>`:''; }
  const qe = $('pf-quick-equip'); if(qe) qe.style.display = (state.active==='lift' && state.modules.lift && state.modules.lift.plan) ? 'block' : 'none';
  const qt = $('pf-quick-terrain'); if(qt) qt.style.display = (state.active==='run' && state.modules.run && state.modules.run.plan) ? 'block' : 'none';
  $('pf-name').textContent = p.nickname || u.name;
  $('pf-email').textContent = u.email;
  // Show admin button if admin (by email — fonte da verdade)
  const isAdminUser = u.isAdmin || u.email === ADMIN_EMAIL;
  if(isAdminUser){ $('pf-admin-btn').classList.remove('hidden'); state.user.isAdmin = true; } else { $('pf-admin-btn').classList.add('hidden'); }
  const days = accessDaysLeft();
  $('pf-trial').textContent = u.isAdmin ? '♾️ Acesso vitalício (Admin)' : accessLabel(days);
  $('pf-goal').textContent = 'Objetivo: '+ ({emagrecer:'Emagrecer',massa:'Ganhar massa',forca:'Ganhar força',condicionamento:'Condicionamento',tonificar:'Tonificar',saude:'Saúde geral'}[p.goal]||'—');

  // Body info
  const imc = calcIMC();
  const cur = latestWeight() || p.currentWeight;
  const first = firstWeight() || p.currentWeight;
  const delta = cur - first;
  // Com um registro só não existe "início" pra comparar — dizer "sem mudança" não faz sentido.
  const nReg = Array.isArray(state.weights) ? state.weights.length : 0;
  const deltaTxt = nReg<2 ? 'Primeiro registro' : (Math.abs(delta)<0.05 ? 'Estável' : (delta<0?`↓ ${Math.abs(delta).toFixed(1)}kg`:`↑ ${delta.toFixed(1)}kg`));
  const deltaColor = (nReg<2 || Math.abs(delta)<0.05) ? 'var(--text-dim)':((p.goal==='emagrecer'&&delta<0)||(p.goal==='massa'&&delta>0)?'var(--primary-2)':'var(--accent-2)');
  $('pf-body-info').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      <div class="info-cell"><div class="info-cell-icon">⚖️</div><div class="info-cell-lbl">PESO ATUAL</div><div class="info-cell-val mono">${cur?cur.toFixed(1)+'kg':'—'}</div></div>
      <div class="info-cell"><div class="info-cell-icon">📏</div><div class="info-cell-lbl">ALTURA</div><div class="info-cell-val mono">${p.height?p.height+' cm':'—'}</div></div>
      <div class="info-cell"><div class="info-cell-icon">📊</div><div class="info-cell-lbl">IMC</div><div class="info-cell-val mono" style="color:${imc?imc.color:'var(--text)'}">${imc?imc.value:'—'}</div></div>
    </div>
    <div style="margin-top:10px;padding:12px;border-radius:var(--radius-btn);background:var(--surface-2)">
      <div style="font-size:12px;color:var(--text-dim);font-weight:700;letter-spacing:1px">SUA EVOLUÇÃO</div>
      <div style="font-weight:800;color:${deltaColor};margin-top:3px;font-size:15px">${nReg<2 ? 'Primeiro registro feito 👍' : deltaTxt+' desde o início'}</div>
      ${nReg<2?'<div style="font-size:12px;color:var(--text-mute);margin-top:4px;line-height:1.5">A partir do próximo registro eu mostro sua evolução aqui.</div>':''}
      ${imc?`<div style="font-size:12px;color:var(--text-mute);margin-top:8px;line-height:1.5">
        IMC ${imc.value} — <span style="color:${imc.color}">${imc.cls.toLowerCase()}</span>.
        ${imc.faixa==='dentro'
          ? 'É só uma referência de população: quem treina pode ficar fora dela e estar muito bem.'
          : 'O IMC não separa músculo de gordura, então serve como referência — não como diagnóstico. Quem treina força costuma pesar mais e estar mais saudável.'}
      </div>`:''}
    </div>
  `;
  // Chart
  $('pf-weight-chart-slot').innerHTML = renderWeightChart();

  // Module
  const mod = state.modules[state.active];
  const isLift = state.active==='lift';
  // Módulo ativo AINDA SEM PLANO: mostra o estado real e não trava a tela
  // (antes, labelGoal(undefined) dava erro e o card ficava com o conteúdo antigo do outro módulo)
  if(!mod || !mod.plan){
    $('pf-mod').innerHTML = `<div class="icon">${isLift?'🏋️':'🏃'}</div><div style="flex:1"><div class="name">${isLift?'Musculação':'Corrida'}</div><div class="goal">Plano ainda não criado</div></div><button class="btn btn-outline" onclick="switchModuleUI()">→ ${isLift?'🏃 Corrida':'🏋️ Musculação'}</button>`;
    $('pf-plan-lbl').textContent = `Plano de ${isLift?'Musculação':'Corrida'}`;
    const box = $('plan-details');
    if(box) box.innerHTML = `<div style="padding:14px;text-align:center;color:var(--text-dim);font-size:13px">Você ainda não tem um plano de ${isLift?'musculação':'corrida'}.</div>
      <button class="btn btn-primary btn-block" style="margin-top:6px" onclick="openSetupScreen('${state.active}')">${isLift?'🏋️':'🏃'} Criar plano de ${isLift?'musculação':'corrida'}</button>`;
    const qe2=$('pf-quick-equip'); if(qe2) qe2.style.display='none';
    const qt2=$('pf-quick-terrain'); if(qt2) qt2.style.display='none';
    const rp=document.querySelector('[onclick="regenPlan()"]'); if(rp) rp.style.display='none';
    return;
  }
  { const rp2=document.querySelector('[onclick="regenPlan()"]'); if(rp2) rp2.style.display=''; }
  $('pf-mod').innerHTML = `<div class="icon">${isLift?'🏋️':'🏃'}</div><div style="flex:1"><div class="name">${isLift?'Musculação':'Corrida'}</div><div class="goal">Objetivo: ${labelGoal(mod)}</div></div><button class="btn btn-outline" onclick="switchModuleUI()">→ ${isLift?'🏃 Corrida':'🏋️ Musculação'}</button>`;
  $('pf-plan-lbl').textContent = `Plano de ${isLift?'Musculação':'Corrida'}`;
  const s = mod.setup || {};
  const hasPlan = !!mod.plan;
  let rows;
  if(isLift) rows = [['Objetivo',labelGoal(mod)],['Dias',s.days+'/semana'],['Equipamento',{academia:'🏋️ Academia',halteres:'💪 Halteres',casa:'🤸 Peso corpo',basico:'💪 Halteres',custom:'🛠️ '+((s.equipList||[]).length)+' equipamentos'}[s.equip]||'—']];
  else if(hasPlan) rows = [['Objetivo',labelGoal(mod)],['Duração',mod.plan.totalWeeks+' semanas'],['Sessões',s.days+'/semana'],['Terreno',{asfalto:'🛣️ Asfalto',esteira:'🏃 Esteira',trilha:'⛰️ Trilha',pista:'🏟️ Pista'}[s.terrain]]];
  else rows = [['Status','📋 Modo registro (sem plano)'],['Atividades', (mod.history||[]).length+' registradas']];
  $('pf-plan-card').innerHTML = rows.map(r=>`<div style="display:flex;justify-content:space-between;padding:8px 0"><span class="text-dim">${r[0]}</span><b>${r[1]}</b></div>`).join('');
  // botão "cancelar plano de corrida" só aparece em Corrida COM plano
  const cancelBtn = $('pf-cancel-run'); if(cancelBtn) cancelBtn.classList.toggle('hidden', !(!isLift && hasPlan));
  // troca rápida de terreno e "trocar plano" não fazem sentido sem plano de corrida
  const qtBtn = $('pf-quick-terrain'); if(qtBtn && !isLift) qtBtn.style.display = hasPlan ? '' : 'none';
}

function renderWeightChart(){
  if(!Array.isArray(state.weights) || state.weights.length<2) return '<div class="text-dim" style="text-align:center;padding:20px;font-size:13px">Registre seu peso periodicamente pra ver a evolução aqui.</div>';
  const ws = state.weights.slice(-8);   // 8 registros cabem sem os números se atropelarem
  const vals = ws.map(w=>w.weight);
  const min = Math.min(...vals) - 1.5, max = Math.max(...vals) + 1.5;
  const rng = (max-min) || 1;
  const W=400, H=130, L=34, R=10, T=14, B=26;
  const x = i => L + i*((W-L-R)/Math.max(1,ws.length-1));
  const y = v => T + (1-((v-min)/rng))*(H-T-B);
  const pts = ws.map((w,i)=>x(i).toFixed(1)+','+y(w.weight).toFixed(1));
  const area = `${L},${H-B} ${pts.join(' ')} ${x(ws.length-1).toFixed(1)},${H-B}`;
  const delta = vals[vals.length-1]-vals[0];
  const cor = Math.abs(delta)<0.2 ? '#94a3b8' : (delta<0 ? '#34d399' : '#fbbf24');
  const dFmt = (delta>0?'+':'')+delta.toFixed(1)+'kg';
  const dt = t => { const d=new Date(t); return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0'); };
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" class="wchart" style="overflow:visible">
    <defs><linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${cor}" stop-opacity=".28"/><stop offset="100%" stop-color="${cor}" stop-opacity="0"/>
    </linearGradient></defs>
    <line x1="${L}" y1="${T}" x2="${W-R}" y2="${T}" stroke="rgba(148,163,184,.12)"/>
    <line x1="${L}" y1="${(T+H-B)/2}" x2="${W-R}" y2="${(T+H-B)/2}" stroke="rgba(148,163,184,.12)"/>
    <line x1="${L}" y1="${H-B}" x2="${W-R}" y2="${H-B}" stroke="rgba(148,163,184,.12)"/>
    <polygon points="${area}" fill="url(#wgrad)"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="${cor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${ws.map((w,i)=>{
      const ultimo = i===ws.length-1;
      const px = x(i), py = y(w.weight);
      // valor em cima de cada ponto — com poucos registros mostra todos,
      // com muitos alterna pra não virar borrão.
      // com muitos pontos só rotula os extremos e alternados, pra não virar borrão
      const mostra = ws.length<=5 || ultimo || i===0 || (ws.length<=8 && i%2===0);
      // Onde colocar o número: acima se o ponto for "vale", abaixo se for "pico".
      // Antes ia sempre pro mesmo lado e o texto caía em cima da própria linha.
      const yAnt = i>0 ? y(ws[i-1].weight) : py;
      const yProx = i<ws.length-1 ? y(ws[i+1].weight) : py;
      const vale = py >= yAnt && py >= yProx;      // ponto mais baixo que os vizinhos
      const ty = vale ? py+15 : py-10;
      const ancora = i===0 ? 'start' : (ultimo ? 'end' : 'middle');
      const tx = i===0 ? px-4 : (ultimo ? px+5 : px);
      return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${ultimo?4.5:2.8}" fill="${ultimo?cor:'#0a1122'}" stroke="${cor}" stroke-width="${ultimo?0:2}"/>`
        + (mostra ? `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="${ultimo?cor:'#cbd5e1'}" font-size="9.5" font-weight="${ultimo?'800':'700'}" text-anchor="${ancora}" stroke="#0a1122" stroke-width="2.5" paint-order="stroke" style="paint-order:stroke fill">${w.weight.toFixed(1)}</text>` : '');
    }).join('')}
    <text x="2" y="${T+4}" fill="#64748b" font-size="10">${max.toFixed(0)}kg</text>
    <text x="2" y="${H-B+4}" fill="#64748b" font-size="10">${min.toFixed(0)}kg</text>
    <text x="${L}" y="${H-8}" fill="#64748b" font-size="9.5">${dt(ws[0].date)}</text>
    <text x="${W-R}" y="${H-8}" fill="#64748b" font-size="9.5" text-anchor="end">${dt(ws[ws.length-1].date)}</text>
    <text x="${W-R}" y="${T+4}" fill="${cor}" font-size="12" font-weight="800" text-anchor="end">${dFmt}</text>
  </svg>`;
}

// ---------- PHOTO PICKER ----------
function pickPhoto(){ $('photo-input').click(); }
function onPhotoPicked(ev){
  const f = ev.target.files[0]; if(!f) return;
  const rd = new FileReader();
  rd.onload = e=>{
    // resize
    const img = new Image();
    img.onload = ()=>{
      const c = document.createElement('canvas');
      const sz = 240;
      c.width = c.height = sz;
      const ctx = c.getContext('2d');
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width-s)/2, (img.height-s)/2, s, s, 0, 0, sz, sz);
      const data = c.toDataURL('image/jpeg', 0.85);
      state.user.profile = state.user.profile || {};
      state.user.profile.photo = data;
      saveData();
      toast('✅ Foto atualizada');
      goTab('profile');
    };
    img.src = e.target.result;
  };
  rd.readAsDataURL(f);
}

// ---------- WEIGHT LOG ----------
function saveWeight(){
  const v = parseFloat($('wt-val').value);
  if(!v || v<25 || v>400) return toast('⚠️ Peso inválido (entre 25 e 400 kg)');
  state.weights.push({ date:Date.now(), weight:v });
  state.user.profile.currentWeight = v;
  saveData();
  checkWeightTrophies();
  toast(`✅ Peso ${v}kg registrado!`);
  closeModal();
  goTab('profile');
}

function checkWeightTrophies(){
  const p = state.user.profile; if(!p || !Array.isArray(state.weights) || state.weights.length<2) return;
  const first = firstWeight(), cur = latestWeight();
  const delta = cur - first;
  const anterior = state.weights[state.weights.length-2];
  const varRecente = anterior ? (cur - anterior.weight) : 0;   // mudança DESTE registro
  const querPerder = p.goal==='emagrecer';
  const querGanhar = p.goal==='massa';

  // conquistas continuam pelo acumulado desde o início
  if(querPerder && delta < 0){
    const lost = Math.abs(delta);
    if(lost>=1) unlockTrophy('weight_down_1');
    if(lost>=3) unlockTrophy('weight_down_3');
    if(lost>=5) unlockTrophy('weight_down_5');
    if(lost>=10) unlockTrophy('weight_down_10');
  } else if(querGanhar && delta > 0){
    if(delta>=2) unlockTrophy('weight_up_2');
    if(delta>=5) unlockTrophy('weight_up_5');
    if(delta>=10) unlockTrophy('weight_up_10');
  }

  // A MENSAGEM olha o registro de AGORA, não o acumulado.
  // Antes o app dava parabéns por "perdeu 32kg" logo depois da pessoa engordar 10kg.
  if(Math.abs(varRecente) < 0.15) return;                    // variação irrelevante: não comenta
  const v = Math.abs(varRecente).toFixed(1);
  const noRumo = (querPerder && varRecente < 0) || (querGanhar && varRecente > 0);

  if(noRumo){
    setTimeout(()=>toast(varRecente<0 ? `🎉 Boa! ${v}kg a menos desde o último registro.` : `💪 Boa! ${v}kg a mais desde o último registro.`), 700);
    return;
  }
  if(!querPerder && !querGanhar) return;                      // sem meta de peso: só registra, sem comentar

  // foi na direção contrária da meta: apoio, nunca cobrança
  setTimeout(()=>toast(varRecente>0
    ? `📊 ${v}kg a mais que o último registro. O peso oscila com água, sono e comida — o que conta é a linha do gráfico.`
    : `📊 ${v}kg a menos que o último registro. Se não era o objetivo, capriche na comida e na proteína.`), 700);
}

// ---------- TROPHIES ----------
// ========== DESAFIOS DO MÊS (zeram todo dia 1º) ==========
function monthKey(d){ const x = d || new Date(); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0'); }
function monthStartTs(){ const d=new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); }
function monthName(key){
  const [y,m] = key.split('-').map(Number);
  return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m-1]+'/'+y;
}
function daysLeftInMonth(){
  const d=new Date();
  const fim = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
  return fim - d.getDate();
}
// histórico apenas do mês corrente
function monthHistory(){
  const ini = monthStartTs();
  return [...(state.modules.lift?.history||[]), ...(state.modules.run?.history||[])].filter(x=>x.at>=ini);
}
// dias distintos com atividade neste mês
function monthActiveDays(){
  const set = new Set();
  monthHistory().forEach(x=>{ const d=new Date(x.at); d.setHours(0,0,0,0); set.add(d.getTime()); });
  return set;
}
// maior sequência de dias seguidos DENTRO do mês
function monthBestStreak(){
  const dias = [...monthActiveDays()].sort((a,b)=>a-b);
  let best=0, cur=0, prev=null;
  dias.forEach(d=>{ cur = (prev!==null && d-prev===86400000) ? cur+1 : 1; best=Math.max(best,cur); prev=d; });
  return best;
}
const somaKm = (arr)=>arr.reduce((s,x)=>s+(parseFloat(x.distance)||0),0);

// Cada desafio: progresso() retorna [atual, alvo]. cat filtra por modalidade.
const MONTH_CHALLENGES = [
  { id:'m_lift_8',  emo:'🏋️', cat:'lift',  nome:'Ferro em Brasa',       desc:'12 treinos de musculação no mês',
    prog:()=>[ (state.modules.lift?.history||[]).filter(x=>x.at>=monthStartTs()).length, 12 ] },
  { id:'m_lift_pr', emo:'💥', cat:'lift',  nome:'Quebrador de Limites',  desc:'Bata 3 recordes pessoais no mês',
    prog:()=>[ Object.values(state.prs||{}).filter(p=>p.at>=monthStartTs()).length, 3 ] },
  { id:'m_lift_leg',emo:'🦵', cat:'lift',  nome:'Não Pulou o Dia de Perna', desc:'4 treinos com pernas ou glúteos',
    prog:()=>[ (state.modules.lift?.history||[]).filter(x=>x.at>=monthStartTs() && (x.parts||[]).some(p=>['Pernas','Glúteos','Panturrilha'].includes(p))).length, 4 ] },
  { id:'m_run_30',  emo:'🏃', cat:'run',   nome:'Maratonista do Mês',    desc:'Corra 40 km somados no mês',
    prog:()=>[ +somaKm((state.modules.run?.history||[]).filter(x=>x.at>=monthStartTs() && (!x.activity||x.activity==='corrida'))).toFixed(1), 40 ] },
  { id:'m_run_long',emo:'🎯', cat:'run',   nome:'Longão do Mês',         desc:'Uma corrida de 10 km ou mais',
    prog:()=>{ const r=(state.modules.run?.history||[]).filter(x=>x.at>=monthStartTs() && (!x.activity||x.activity==='corrida')); return [ Math.min(10, r.length?Math.max(...r.map(x=>x.distance||0)):0), 10 ]; } },
  { id:'m_bike_50', emo:'🚴', cat:'run',   nome:'Pedal do Mês',          desc:'120 km de bike no mês',
    prog:()=>[ +somaKm((state.modules.run?.history||[]).filter(x=>x.at>=monthStartTs() && x.activity==='bike')).toFixed(1), 120 ] },
  { id:'m_walk_25', emo:'🚶', cat:'run',   nome:'Andarilho',             desc:'40 km de caminhada no mês',
    prog:()=>[ +somaKm((state.modules.run?.history||[]).filter(x=>x.at>=monthStartTs() && x.activity==='caminhada')).toFixed(1), 40 ] },
  { id:'m_streak5', emo:'🔥', cat:'geral', nome:'Constância de Aço',     desc:'5 dias seguidos de atividade',
    prog:()=>[ monthBestStreak(), 5 ] },
  { id:'m_days12',  emo:'📅', cat:'geral', nome:'Presença Confirmada',   desc:'Ative-se em 12 dias diferentes',
    prog:()=>[ monthActiveDays().size, 12 ] },
  { id:'m_min500',  emo:'⏱️', cat:'geral', nome:'Dez Horas Suadas',      desc:'600 minutos (10h) de treino no mês',
    prog:()=>[ Math.round(monthHistory().reduce((s,x)=>s+(x.duration||0),0)), 600 ] },
  { id:'m_mix',     emo:'🔀', cat:'geral', nome:'Atleta Completo',       desc:'4 treinos de musculação + 4 de cardio (corrida, bike ou caminhada)',
    prog:()=>{ const ini=monthStartTs(); const l=(state.modules.lift?.history||[]).filter(x=>x.at>=ini).length; const r=(state.modules.run?.history||[]).filter(x=>x.at>=ini).length; return [ Math.min(l,4)+Math.min(r,4), 8 ]; } },
  { id:'m_early',   emo:'🌅', cat:'geral', nome:'Clube da Madrugada',    desc:'3 treinos antes das 7h',
    prog:()=>[ monthHistory().filter(x=>new Date(x.at).getHours()<7).length, 3 ] }
];

// desafios visíveis: os da modalidade ativa + os gerais
function visibleChallenges(){
  const temLift = !!state.modules.lift, temRun = !!state.modules.run;
  return MONTH_CHALLENGES.filter(c=>c.cat==='geral' || (c.cat==='lift'&&temLift) || (c.cat==='run'&&temRun));
}
// garante o objeto do mês; ao virar o mês, arquiva as medalhas e zera
// Mostrado UMA vez, quando o aluno abre o app depois da virada do mês.
// Só aparece se ele realmente conquistou algo — sem conquista, sem janela.
function showMesFechado(){
  try{
    const mf = state.ui && state.ui.mesFechado;
    if(!mf || mf.visto || !mf.ids || !mf.ids.length) return false;
    const lista = mf.ids.map(id=>MONTH_CHALLENGES.find(c=>c.id===id)).filter(Boolean);
    if(!lista.length){ mf.visto = true; saveData(); return false; }
    const nome = monthName(mf.key);
    $('modal-inner').innerHTML = `
      <div style="text-align:center">
        <div style="font-size:46px;line-height:1">🎖️</div>
        <h3 style="margin:10px 0 2px">${nome} fechou!</h3>
        <div style="font-size:13px;color:var(--text-dim)">Você conquistou <b>${lista.length}</b> ${lista.length===1?'desafio':'desafios'} — ${lista.length===1?'ela virou medalha permanente':'elas viraram medalhas permanentes'}.</div>
      </div>
      <div class="note note-warn" style="margin-top:14px">
        ${lista.map(c=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 0;border-top:1px dashed var(--border)">
          <div style="font-size:22px">${c.emo||'🏅'}</div>
          <div style="flex:1"><div style="font-weight:800;font-size:13.5px">${c.nome}</div>
          <div style="font-size:12px;color:var(--text-dim)">${c.desc||''}</div></div>
        </div>`).join('')}
      </div>
      <div style="text-align:center;font-size:12.5px;color:var(--text-mute);margin-top:12px;line-height:1.5">
        Os desafios de <b>${monthName(monthKey())}</b> já começaram. Bora buscar mais? 💪
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="fecharMesFechado()">Ver os novos desafios</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="fecharMesFechado(true)">Agora não</button>`;
    $('modal-back').classList.add('on');
    mf.visto = true; saveData();
    return true;
  }catch(e){ return false; }
}
function fecharMesFechado(soFechar){
  closeModal();
  if(!soFechar){ try{ openMonthly(); }catch(e){} }
}
function ensureMonthly(){
  const k = monthKey();
  state.medals = state.medals || [];
  if(!state.monthly || state.monthly.key !== k){
    // vira o mês: arquiva as conquistas como MEDALHAS permanentes (com a data em que caíram)
    if(state.monthly && (state.monthly.done||[]).length){
      const datas = state.monthly.doneAt || {};
      state.monthly.done.forEach(id=>{
        if(!state.medals.some(m=>m.id===id && m.month===state.monthly.key)){
          state.medals.push({ id, month:state.monthly.key, at: datas[id] || null });
        }
      });
    }
    // guarda o resumo do mês que fechou, pra mostrar UMA vez quando o aluno abrir o app
    try{
      const feitos = (state.monthly && (state.monthly.done||[]).length) ? state.monthly.done.slice() : [];
      if(state.monthly && feitos.length){
        state.ui = state.ui || {};
        state.ui.mesFechado = { key: state.monthly.key, ids: feitos, visto: false };
      }
    }catch(e){}
    state.monthly = { key:k, done:[], doneAt:{} };
  }
  state.monthly.doneAt = state.monthly.doneAt || {};
}
// verifica e desbloqueia; retorna os ids recém-conquistados
function checkMonthly(){
  ensureMonthly();
  const novos = [];
  visibleChallenges().forEach(c=>{
    if(state.monthly.done.includes(c.id)) return;
    const [a, alvo] = c.prog();
    if(a >= alvo){ state.monthly.done.push(c.id); state.monthly.doneAt[c.id] = Date.now(); novos.push(c); }
  });
  if(novos.length){
    saveData();
    novos.forEach(c=>queueAward({ id:'m_'+c.id, emo:c.emo, tipo:'DESAFIO DO MÊS CONCLUÍDO', nome:c.nome, desc:c.desc, medalha:true }));
  }
  return novos;
}
// ---------- ARQUIVO DE MEDALHAS ----------
// Tudo que a pessoa conquistou nos desafios de meses passados fica guardado aqui pra sempre.
function openMedals(){
  ensureMonthly();
  const porMes = {};
  (state.medals||[]).forEach(m=>{ (porMes[m.month] = porMes[m.month]||[]).push(m); });
  // inclui o mês corrente (ainda em andamento) no topo, marcado como tal
  const atuais = (state.monthly.done||[]).map(id=>({ id, month:state.monthly.key, at:(state.monthly.doneAt||{})[id] }));
  if(atuais.length) porMes[state.monthly.key] = atuais;

  const meses = Object.keys(porMes).sort().reverse();
  const totalMedalhas = Object.values(porMes).reduce((s,a)=>s+a.length,0);

  const corpo = meses.length ? meses.map(mk=>{
    const emAndamento = mk === state.monthly.key;
    const itens = porMes[mk].map(m=>{
      const c = MONTH_CHALLENGES.find(x=>x.id===m.id);
      const dt = m.at ? new Date(m.at).toLocaleDateString('pt-BR') : '';
      return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px dashed var(--border)">
        <span style="font-size:20px">${c?c.emo:'🎖️'}</span>
        <div style="flex:1"><div style="font-weight:700;font-size:13px">${c?c.nome:m.id}</div>
        <div style="font-size:11px;color:var(--text-mute)">${c?c.desc:''}</div></div>
        ${dt?`<span class="mono" style="font-size:11px;color:var(--text-dim)">${dt}</span>`:''}
      </div>`;
    }).join('');
    return `<div class="card" style="padding:14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-weight:800;font-size:14px">${monthName(mk)}${emAndamento?' <span style="font-size:10.5px;color:var(--accent);font-weight:700">em andamento</span>':''}</div>
        <span style="font-size:12px;color:var(--primary-2);font-weight:700">${porMes[mk].length} 🎖️</span>
      </div>
      ${itens}
    </div>`;
  }).join('') : `<div class="card" style="text-align:center;padding:24px">
      <div style="font-size:40px">🎖️</div>
      <div style="font-weight:700;margin-top:8px">Nenhuma medalha ainda</div>
      <div style="color:var(--text-dim);font-size:13px;margin-top:4px">Conclua desafios do mês e eles ficam guardados aqui pra sempre — mesmo depois que o mês virar.</div>
    </div>`;

  $('modal-inner').innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin:-4px -4px 0 0">
      <button onclick="closeModal()" style="background:none;border:none;font-size:20px;color:var(--text-mute);padding:4px 8px;cursor:pointer">✕</button>
    </div>
    <h3>🏅 Minhas conquistas</h3>
    <p style="color:var(--text-dim);font-size:13px">${totalMedalhas} ${totalMedalhas===1?'medalha conquistada':'medalhas conquistadas'} em ${meses.length} ${meses.length===1?'mês':'meses'}. Os desafios zeram todo dia 1º, mas as medalhas ficam.</p>
    <div style="max-height:56vh;overflow-y:auto;margin-top:12px">${corpo}</div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
// card na Home
function renderMonthlyCard(){
  const card = $('card-monthly'); if(!card) return;
  ensureMonthly();
  const lista = visibleChallenges();
  const feitos = lista.filter(c=>state.monthly.done.includes(c.id)).length;
  const restam = daysLeftInMonth();
  card.classList.remove('hidden');
  const _ev = (typeof seasonalEvent==='function') ? seasonalEvent() : null;
  $('monthly-title').textContent = `Desafios de ${monthName(state.monthly.key)}` + (_ev ? ` · ${_ev.emo} ${_ev.nome}` : '');
  $('monthly-sub').textContent = `${feitos} de ${lista.length} concluídos · ${restam===0?'último dia!':`${restam} ${restam===1?'dia restante':'dias restantes'}`}`;
  // mostra os 3 mais próximos de fechar (ainda não concluídos)
  const pendentes = lista.filter(c=>!state.monthly.done.includes(c.id))
    .map(c=>{ const [a,alvo]=c.prog(); return {c, a, alvo, pct:Math.min(1, a/alvo)}; })
    .sort((x,y)=>y.pct-x.pct).slice(0,3);
  $('monthly-bars').innerHTML = pendentes.length ? pendentes.map(({c,a,alvo,pct})=>`
    <div style="margin-top:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span>${c.emo} ${c.nome}</span><span class="mono" style="color:var(--text-dim)">${a}/${alvo}</span>
      </div>
      <div class="tprog"><div class="tprog-fill" style="width:${Math.round(pct*100)}%"></div></div>
    </div>`).join('')
    : `<div style="margin-top:8px;color:var(--primary-2);font-weight:700;font-size:13px">🎉 Todos os desafios do mês concluídos! Você é fera.</div>`;
}
// tela completa
function openMonthly(){
  ensureMonthly();
  const lista = visibleChallenges();
  const restam = daysLeftInMonth();
  // concluídos no topo; depois os mais perto de fechar
  const ordenada = [...lista].sort((x,y)=>{
    const fx = state.monthly.done.includes(x.id), fy = state.monthly.done.includes(y.id);
    if(fx !== fy) return fx ? -1 : 1;
    const px = Math.min(1, x.prog()[0]/x.prog()[1]);
    const py = Math.min(1, y.prog()[0]/y.prog()[1]);
    return py - px;
  });
  const linhas = ordenada.map(c=>{
    const feito = state.monthly.done.includes(c.id);
    const [a,alvo] = c.prog();
    const pct = Math.min(100, Math.round(a/alvo*100));
    return `<div class="trophy ${feito?'unlock':''}" style="text-align:left;padding:12px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:22px">${c.emo}</span>
        <div style="flex:1">
          <div style="font-weight:800;font-size:13.5px">${c.nome} ${feito?'✅':''}</div>
          <div style="font-size:11.5px;color:var(--text-mute)">${c.desc}</div>
        </div>
        <span class="mono" style="font-size:12px;color:${feito?'var(--primary-2)':'var(--text-dim)'}">${a}/${alvo}</span>
      </div>
      ${feito?'':`<div class="tprog" style="margin-top:8px"><div class="tprog-fill" style="width:${pct}%"></div></div>`}
    </div>`;
  }).join('');
  $('modal-inner').innerHTML = `
    <h3>🎖️ Desafios do mês</h3>
    <p style="color:var(--text-dim);font-size:13px">${monthName(state.monthly.key)} · ${restam===0?'último dia!':`faltam ${restam} dias`}. Todo dia 1º os desafios zeram e as medalhas ficam guardadas.</p>
    <div style="max-height:52vh;overflow-y:auto;margin-top:12px;display:flex;flex-direction:column;gap:8px">${linhas}</div>
    <button class="btn btn-outline btn-block" class="hl-warn" style="margin-top:14px" onclick="closeModal();openMedals()">🏅 Ver minhas medalhas de meses anteriores</button>
    <button class="btn btn-primary btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}

// ========== CELEBRAÇÕES (fila única com carrossel) ==========
// Em vez de empilhar toasts e modais, tudo que a pessoa conquistou de uma vez
// entra numa fila e vira um carrossel: ‹ card › com bolinhas e um X pra fechar.
let awardQueue = [], awardIdx = 0, awardTimer = null;
let silentAwards = false; // durante um recálculo não celebramos nada
function queueAward(a){
  if(silentAwards) return;
  if(awardQueue.some(x=>x.id===a.id)) return;
  awardQueue.push(a);
  clearTimeout(awardTimer);
  awardTimer = setTimeout(showAwards, 1200);
}
function showAwards(){
  if(!awardQueue.length) return;
  const back = $('modal-back');
  // se houver outro modal aberto (ex.: compartilhar treino), espera ele fechar
  if(back && back.classList.contains('on')){ awardTimer = setTimeout(showAwards, 800); return; }
  awardIdx = 0;
  renderAward();
}
function renderAward(){
  const a = awardQueue[awardIdx]; if(!a) return;
  const n = awardQueue.length;
  const dots = awardQueue.map((_,i)=>`<span style="width:${i===awardIdx?'18px':'6px'};height:6px;border-radius:99px;background:${i===awardIdx?'var(--primary)':'var(--surface-2)'};display:inline-block;transition:width .25s"></span>`).join('');
  const seta = (dir,dis)=>`<button onclick="awardNav(${dir})" ${dis?'disabled':''} style="background:none;border:none;font-size:26px;color:${dis?'var(--surface-2)':'var(--text-dim)'};padding:8px 10px;cursor:${dis?'default':'pointer'}">${dir<0?'‹':'›'}</button>`;
  $('modal-inner').innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin:-4px -4px 0 0">
      <button onclick="closeAwards()" style="background:none;border:none;font-size:20px;color:var(--text-mute);padding:4px 8px;cursor:pointer">✕</button>
    </div>
    <div style="display:flex;align-items:center;gap:4px">
      ${n>1 ? seta(-1, awardIdx===0) : '<div style="width:44px"></div>'}
      <div style="flex:1;text-align:center;padding:4px 0${a.secreto?';background:radial-gradient(circle at 50% 30%, rgba(245,158,11,0.16), transparent 70%);border-radius:18px':a.medalha?';background:radial-gradient(circle at 50% 30%, rgba(16,185,129,0.18), transparent 70%);border-radius:18px':a.marco?';background:radial-gradient(circle at 50% 30%, rgba(167,139,250,0.20), transparent 70%);border-radius:18px':''}">
        ${a.secreto?'<div style="font-size:11px;letter-spacing:2px;color:var(--accent-2);font-weight:800">✨ CONQUISTA SECRETA ✨</div>':''}
        ${a.medalha?'<div style="font-size:11px;letter-spacing:2px;color:var(--primary-2);font-weight:800">🎖️ MEDALHA DO MÊS 🎖️</div>':''}
        ${a.marco?'<div style="font-size:11px;letter-spacing:2px;color:#a78bfa;font-weight:800">🎉 MARCO ALCANÇADO 🎉</div>':''}
        <div class="anim-check" style="font-size:${a.secreto||a.medalha||a.marco?'70px':'62px'};line-height:1.1${a.secreto?';filter:drop-shadow(0 0 18px rgba(245,158,11,0.55))':a.medalha?';filter:drop-shadow(0 0 18px rgba(16,185,129,0.55))':a.marco?';filter:drop-shadow(0 0 18px rgba(167,139,250,0.6))':''}">${a.emo}</div>
        <div style="font-size:12px;color:${a.secreto?'var(--accent-2)':a.medalha?'var(--primary-2)':a.marco?'#a78bfa':'var(--text-mute)'};letter-spacing:.5px;margin-top:6px;font-weight:${a.secreto||a.medalha||a.marco?'800':'400'}">${a.tipo}</div>
        <h3 style="margin:2px 0 0;font-size:${a.secreto||a.medalha||a.marco?'21px':'19px'}">${a.nome}</h3>
        <p style="color:var(--text-dim);font-size:13px;margin-top:6px;line-height:1.45">${a.desc}</p>
        ${a.secreto?'<div style="font-size:11.5px;color:var(--text-mute);margin-top:8px;font-style:italic">Ninguém te contou essa. Você descobriu.</div>':''}
        ${a.medalha?'<div style="font-size:11.5px;color:var(--text-mute);margin-top:8px;font-style:italic">🏅 Guardada nas suas medalhas pra sempre.</div>':''}
        ${a.marco?'<div style="font-size:11.5px;color:var(--text-mute);margin-top:8px;font-style:italic">🚀 Mais um capítulo da sua jornada.</div>':''}
      </div>
      ${n>1 ? seta(1, awardIdx===n-1) : '<div style="width:44px"></div>'}
    </div>
    ${n>1?`<div style="display:flex;justify-content:center;gap:5px;margin:12px 0 4px">${dots}</div>
      <div style="text-align:center;font-size:11.5px;color:var(--text-mute)">${awardIdx+1} de ${n} conquistas</div>`:''}
    <button class="btn btn-primary btn-block anim-glow" style="margin-top:14px" onclick="closeAwards();openTrophies()">🏆 Ver meus conquistas</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeAwards()">Fechar</button>`;
  $('modal-back').classList.add('on','award-dark');
}
function awardNav(d){
  const novo = awardIdx + d;
  if(novo < 0 || novo >= awardQueue.length) return;
  awardIdx = novo; renderAward();
}
function closeAwards(){ awardQueue = []; awardIdx = 0; document.getElementById('modal-back').classList.remove('award-dark'); closeModal(); }

// Evento sazonal ativo (janelas fixas, tom sóbrio — sem infantilizar)
function seasonalEvent(){
  const n=new Date(), m=n.getMonth()+1, d=n.getDate();
  if(m===10 && d>=25) return {emo:'🎃', nome:'Especial de Halloween'};
  if(m===12 && d>=20) return {emo:'🎄', nome:'Reta Final do Ano'};
  if(m===1 && d<=7)  return {emo:'🎆', nome:'Semana do Recomeço'};
  return null;
}
function checkTimeEasterEggs(){
  try{
    const now = new Date(), h = now.getHours(), m = now.getMinutes();
    if((h===7&&m===7)||(h===11&&m===11)||(h===22&&m===22)) unlockTrophy('capicua');
    if(now.getMonth()===9 && now.getDate()===31) unlockTrophy('halloween');
  }catch(e){}
}
function unlockTrophy(id){
  if(state.trophies.includes(id)) return;
  state.trophies.push(id);
  state.trophyDates = state.trophyDates || {};
  state.trophyDates[id] = Date.now(); // guarda quando foi conquistado
  saveData();
  const t = TROPHIES.find(x=>x.id===id);
  if(!t) return;
  queueAward({ id:'t_'+t.id, emo:t.emoji, tipo: t.secret ? 'SEGREDO REVELADO' : 'TROFÉU DESBLOQUEADO', nome:t.name, desc:t.desc, secreto: !!t.secret });
}
// Garante que os contadores vitalícios existem; migra dados de quem já tinha histórico
function ensureStats(){
  if(!state.stats) state.stats = {};
  const s = state.stats;
  ['liftTotal','runTotal','runKmTotal','walkTotal','walkKmTotal','bikeTotal','bikeKmTotal'].forEach(k=>{ if(typeof s[k]!=='number') s[k]=0; });
  const liftH = state.modules.lift?.history?.length || 0;
  const runH = state.modules.run?.history || [];
  const runOnly = runH.filter(x=>!x.activity || x.activity==='corrida');
  const walkOnly = runH.filter(x=>x.activity==='caminhada');
  const bikeOnly = runH.filter(x=>x.activity==='bike');
  const sumKm = arr => arr.reduce((t,r)=>t+(r.distance||0),0);
  // o contador nunca pode ser menor que o histórico visível (migração de versões antigas)
  if(s.liftTotal < liftH) s.liftTotal = liftH;
  if(s.runTotal < runOnly.length) s.runTotal = runOnly.length;
  if(s.runKmTotal < sumKm(runOnly)) s.runKmTotal = sumKm(runOnly);
  if(s.walkTotal < walkOnly.length) s.walkTotal = walkOnly.length;
  if(s.walkKmTotal < sumKm(walkOnly)) s.walkKmTotal = sumKm(walkOnly);
  if(s.bikeTotal < bikeOnly.length) s.bikeTotal = bikeOnly.length;
  if(s.bikeKmTotal < sumKm(bikeOnly)) s.bikeKmTotal = sumKm(bikeOnly);
  // Auto-correção de versões antigas que contavam km em dobro: se o contador está MUITO acima
  // do histórico visível (mais que o dobro + margem), e a conta é recente (sem limpeza de 90d
  // ainda), reancora no valor real. Só corrige quando o histórico cabe todo na janela de 90 dias.
  const oldestActivity = runH.length ? Math.min(...runH.map(x=>x.at)) : Date.now();
  const semLimpeza = (Date.now() - oldestActivity) < HISTORY_RETENTION_DAYS*86400000;
  if(semLimpeza){
    if(s.runKmTotal > sumKm(runOnly)*1.5 + 1) s.runKmTotal = sumKm(runOnly);
    if(s.walkKmTotal > sumKm(walkOnly)*1.5 + 1) s.walkKmTotal = sumKm(walkOnly);
    if(s.bikeKmTotal > sumKm(bikeOnly)*1.5 + 1) s.bikeKmTotal = sumKm(bikeOnly);
    if(s.liftTotal > liftH) s.liftTotal = liftH;   // corrige contas infladas por versões antigas
    if(s.runTotal > runOnly.length) s.runTotal = runOnly.length;
    if(s.walkTotal > walkOnly.length) s.walkTotal = walkOnly.length;
    if(s.bikeTotal > bikeOnly.length) s.bikeTotal = bikeOnly.length;
  }
}
// Ao apagar um registro, subtrai apenas a contribuição DELE dos contadores vitalícios.
// (Zerar tudo destruiria a "reserva" de treinos que já saíram pela limpeza de 90 dias.)
// Em seguida ensureStats() garante que o contador nunca fique abaixo do histórico real.
function subtractFromStats(x){
  const s = state.stats || (state.stats = {});
  const dec = (k, v)=>{ s[k] = Math.max(0, (s[k]||0) - v); };
  if(!x) return;
  if(x.module === 'lift'){ dec('liftTotal', 1); }
  else if(x.module === 'run'){
    const km = x.distance || 0;
    const tipo = x.activity || 'corrida';
    if(tipo === 'corrida'){ dec('runTotal', 1); dec('runKmTotal', km); }
    else if(tipo === 'caminhada'){ dec('walkTotal', 1); dec('walkKmTotal', km); }
    else if(tipo === 'bike'){ dec('bikeTotal', 1); dec('bikeKmTotal', km); }
  }
  ensureStats(); // piso: nunca abaixo do que o histórico atual comprova
}
function checkTrophies(){
  ensureStats();
  checkMonthly();
  // (A revogação de conquistas acontece só no recálculo explícito — ver recomputeAchievements.)
  // Contadores vitalícios: não zeram quando o histórico de 90 dias é limpo,
  // então conquistas como "Centurião" (100 treinos) são alcançáveis de verdade.
  const liftDone = state.stats.liftTotal;
  const runDone = state.stats.runTotal;
  const totalDone = liftDone + runDone;
  if(totalDone>=1) unlockTrophy('first_workout');
  // Musculação
  if(liftDone>=10) unlockTrophy('lift_10');
  if(liftDone>=25) unlockTrophy('lift_25');
  if(liftDone>=50) unlockTrophy('lift_50');
  if(liftDone>=100) unlockTrophy('lift_100');
  // PRs count
  const prCount = Object.keys(state.prs||{}).length;
  if(prCount>=5) unlockTrophy('pr_5');
  if(prCount>=20) unlockTrophy('pr_20');
  // Corrida
  if(runDone>=1) unlockTrophy('run_1');
  if(runDone>=10) unlockTrophy('run_10');
  if(runDone>=25) unlockTrophy('run_25');
  if(runDone>=50) unlockTrophy('run_50');
  // KM acumulados (vitalício)
  const totalKm = state.stats.runKmTotal;
  if(totalKm>=10) unlockTrophy('run_km_10');
  if(totalKm>=50) unlockTrophy('run_km_50');
  if(totalKm>=100) unlockTrophy('run_km_100');
  if(totalKm>=500) unlockTrophy('run_km_500');
  // Caminhada (vitalício)
  const wT = state.stats.walkTotal, wKm = state.stats.walkKmTotal;
  if(wT>=1) unlockTrophy('walk_1');
  if(wT>=10) unlockTrophy('walk_10');
  if(wT>=25) unlockTrophy('walk_25');
  if(wKm>=10) unlockTrophy('walk_km_10');
  if(wKm>=50) unlockTrophy('walk_km_50');
  if(wKm>=100) unlockTrophy('walk_km_100');
  // Bike (vitalício)
  const bT = state.stats.bikeTotal, bKm = state.stats.bikeKmTotal;
  if(bT>=1) unlockTrophy('bike_1');
  if(bT>=10) unlockTrophy('bike_10');
  if(bT>=25) unlockTrophy('bike_25');
  if(bKm>=50) unlockTrophy('bike_km_50');
  if(bKm>=100) unlockTrophy('bike_km_100');
  if(bKm>=500) unlockTrophy('bike_km_500');
  // Best single run (só corrida — caminhada e bike têm conquistas próprios)
  const bestKm = Math.max(0, ...((state.modules.run?.history||[]).filter(r=>!r.activity||r.activity==='corrida').map(r=>r.distance||0)));
  if(bestKm>=5) unlockTrophy('run_5k_run');
  if(bestKm>=10) unlockTrophy('run_10k_run');
  if(bestKm>=21) unlockTrophy('run_21k_run');
  if(bestKm>=42) unlockTrophy('run_42k_run');
  // Troféus que antes só eram dados no momento do evento — agora derivados do histórico,
  // pra sobreviverem a um recálculo (apagar/editar registro).
  if(Object.keys(state.prs||{}).length > 0) unlockTrophy('first_pr');
  const runH = state.modules.run?.history || [];
  const maxDe = tipo => Math.max(0, ...runH.filter(r=>r.activity===tipo).map(r=>r.distance||0));
  const maxWalk = maxDe('caminhada'), maxBike = maxDe('bike');
  if(maxWalk>=3) unlockTrophy('walk_3k');
  if(maxWalk>=5) unlockTrophy('walk_5k');
  if(maxBike>=20) unlockTrophy('bike_20k');
  if(maxBike>=50) unlockTrophy('bike_50k');

  // Streaks (combinado)
  const allHist = [...(state.modules.lift?.history||[]), ...(state.modules.run?.history||[])];
  const s = calcStreak(allHist);
  if(s>=3) unlockTrophy('streak_3');
  if(s>=7) unlockTrophy('streak_7');
  if(s>=14) unlockTrophy('streak_14');
  if(s>=30) unlockTrophy('streak_30');
  // ----- ESPECIAIS (humor / persistência) -----
  const total = allHist.length;
  if(total >= 100) unlockTrophy('century');
  // horários
  if(allHist.some(x=>{ const hh=new Date(x.at).getHours(); return hh>=4 && hh<6; })) unlockTrophy('early_bird');
  if(allHist.some(x=>new Date(x.at).getHours() >= 22)) unlockTrophy('night_owl');
  if(allHist.some(x=>x.duration>=120)) unlockTrophy('marathon_time');
  if(allHist.some(x=>x.duration>0 && x.duration<15)) unlockTrophy('turbo');
  if(allHist.some(x=>{ const d=new Date(x.at); return d.getMonth()===0 && d.getDate()===1; })) unlockTrophy('newyear');
  // segundas-feiras (dia 1 na nossa contagem)
  const segundas = new Set(allHist.filter(x=>{ const d=new Date(x.at); return d.getDay()===1; }).map(x=>{ const d=new Date(x.at); d.setHours(0,0,0,0); return d.getTime(); }));
  if(segundas.size >= 4) unlockTrophy('monday');
  // fim de semana: um sábado E um domingo
  const temSab = allHist.some(x=>new Date(x.at).getDay()===6);
  const temDom = allHist.some(x=>new Date(x.at).getDay()===0);
  if(temSab && temDom) unlockTrophy('weekend');
  // a volta por cima: alguma pausa de 10+ dias seguida de um treino
  const diasOrd = [...new Set(allHist.map(x=>{ const d=new Date(x.at); d.setHours(0,0,0,0); return d.getTime(); }))].sort((a,b)=>a-b);
  for(let i=1;i<diasOrd.length;i++){ if((diasOrd[i]-diasOrd[i-1])/86400000 >= 10){ unlockTrophy('comeback'); break; } }
  // sabedoria: registrou treino em modo adaptado por dor
  if(allHist.some(x=>x.adaptedWith && /dor/i.test(x.adaptedWith))) unlockTrophy('humble');
  // treinou no próprio aniversário
  const nasc = state.user && state.user.profile && state.user.profile.birth;
  if(nasc){
    const b = new Date(nasc+'T00:00:00');
    if(!isNaN(b) && allHist.some(x=>{ const d=new Date(x.at); return d.getDate()===b.getDate() && d.getMonth()===b.getMonth(); })) unlockTrophy('bday_active');
  }
  if(allHist.some(x=>new Date(x.at).getDate()===1)) unlockTrophy('first_day');
  if(allHist.some(x=>{ const d=new Date(x.at); return d.getDay()===5 && d.getDate()===13; })) unlockTrophy('friday13');
  // espírito natalino: treino no dia 25 de dezembro
  if(allHist.some(x=>{ const d=new Date(x.at); return d.getDate()===25 && d.getMonth()===11; })) unlockTrophy('christmas');
  // faz-tudo: já registrou pelo menos 3 modalidades diferentes (musculação, corrida, caminhada, bike)
  let nModalidades = 0;
  if((state.modules.lift?.history||[]).length > 0) nModalidades++;
  const tiposRun = new Set((state.modules.run?.history||[]).map(r=>r.activity||'corrida'));
  ['corrida','caminhada','bike'].forEach(t=>{ if(tiposRun.has(t)) nModalidades++; });
  if(nModalidades >= 3) unlockTrophy('versatile');
  const diaDe = x => { const d=new Date(x.at); d.setHours(0,0,0,0); return d.getTime(); };
  const diasLift = new Set((state.modules.lift?.history||[]).map(diaDe));
  if((state.modules.run?.history||[]).some(x=>diasLift.has(diaDe(x)))) unlockTrophy('double');
  // nem a preguiça: treinou 3 dias seguidos tendo terminado algum deles exausto/cansado
  if(s>=3 && allHist.some(x=>x.feel==='cansado' || x.feel==='exausto')) unlockTrophy('rain_check');
  // sem drama: 12 treinos e nenhuma semana vazia nas últimas 12
  if(total>=12){
    const semanaTem = new Set(allHist.map(x=>{ const d=new Date(x.at); d.setHours(0,0,0,0); d.setDate(d.getDate()-((d.getDay()||7)-1)); return d.getTime(); }));
    const hj = new Date(); hj.setHours(0,0,0,0); hj.setDate(hj.getDate()-((hj.getDay()||7)-1));
    let todas = true;
    for(let k=0;k<4;k++){ if(!semanaTem.has(hj.getTime() - k*7*86400000)) { todas=false; break; } }
    if(todas) unlockTrophy('consistent');
  }

  // Meta semanal — vale pros DOIS módulos (antes só olhava o que estava aberto,
  // então quem batia a meta de corrida com a musculação na tela não ganhava)
  {
    const startWk = new Date(); startWk.setHours(0,0,0,0); startWk.setDate(startWk.getDate()-6);
    ['lift','run'].forEach(mk=>{
      const m = state.modules[mk];
      if(!m || !m.plan || !m.plan.workouts) return;
      const wkTarget = m.plan.workouts.length;
      const done7d = (m.history||[]).filter(h=>h.at>=startWk.getTime()).length;
      // precisa existir meta E treinos de verdade (senão 0 >= 0 desbloquearia sem treinar)
      if(wkTarget > 0 && done7d > 0 && done7d >= wkTarget) unlockTrophy('week_goal');
    });
  }
  checkMilestones();
  if(typeof checkSpecialAward==='function') checkSpecialAward('workout'); // conquista especial após terminar um treino
}
// ===== MARCOS (treinador celebra números redondos: 10º, 50º, 100º treino...) =====
const MILESTONES = [1,10,25,50,100,150,200,250,300,365,500,750,1000];
function milestoneEmo(m){ return m>=500?'💎':m>=200?'👑':m>=100?'🏆':m>=50?'⭐':m>=25?'💪':m>=10?'🔥':'🎉'; }
function milestoneMsg(m){
  const nome = (typeof maName==='function') ? maName() : 'você';
  const msgs = {
    1:`Seu primeiro treino registrado! Todo mundo começa por aqui — o mais difícil (começar) você já fez. 🎉`,
    10:`10 treinos! O hábito está nascendo. Continue e ele vira parte de quem você é. 🔥`,
    25:`25 treinos concluídos! Isso já não é sorte, é rotina. 💪`,
    50:`50 treinos! Metade do caminho pro clube dos 100. Sua constância está falando por si. ⭐`,
    100:`Lembra quando começou, ${nome}? Hoje você concluiu seu <b>100º treino</b>. Isso é fruto de pura constância — poucos chegam aqui. 🏆`,
    150:`150 treinos! Você virou referência de disciplina. 👑`,
    200:`200 treinos! Que jornada. O MetaTreino tem orgulho de te acompanhar. 👑`,
    250:`250 treinos — nível raro de comprometimento. 💎`,
    300:`300 treinos! Você é a prova viva de que constância vence tudo. 💎`,
    365:`365 treinos! Um por dia daria um ano inteiro. Simplesmente fora de série. 💎`,
    500:`500 treinos!!! Não tenho nem palavras — só respeito. 💎`
  };
  return msgs[m] || `<b>${m}º treino</b> concluído! Sua constância é impressionante, ${nome}. 🔥`;
}
function checkMilestones(){
  state.stats = state.stats || {};
  const total = (state.modules.lift?.history||[]).length + (state.modules.run?.history||[]).length;
  if(state.stats.lastMilestone === undefined){ // seed silencioso (não celebra marcos passados)
    state.stats.lastMilestone = Math.max(0, ...MILESTONES.filter(m=>m<=total));
    saveData(); return;
  }
  const hit = MILESTONES.filter(m=>m<=total && m>state.stats.lastMilestone);
  if(hit.length){
    const m = Math.max(...hit);
    state.stats.lastMilestone = m;
    saveData();
    queueAward({ id:'milestone_'+m, emo:milestoneEmo(m), tipo:'MARCO ALCANÇADO', nome:`${m}º treino!`, desc:milestoneMsg(m), marco:true });
  }
}
function trophyProgress(id){
  ensureStats();
  const s = state.stats, h = state.modules[state.active]?.history||[];
  const allH = [...(state.modules.lift?.history||[]), ...(state.modules.run?.history||[])];
  const streak = calcStreak(allH);
  const prN = Object.keys(state.prs||{}).length;
  const map = {
    lift_10:[s.liftTotal,10], lift_25:[s.liftTotal,25], lift_50:[s.liftTotal,50], lift_100:[s.liftTotal,100],
    pr_5:[prN,5], pr_20:[prN,20],
    run_10:[s.runTotal,10], run_25:[s.runTotal,25], run_50:[s.runTotal,50],
    run_km_10:[s.runKmTotal,10], run_km_50:[s.runKmTotal,50], run_km_100:[s.runKmTotal,100], run_km_500:[s.runKmTotal,500],
    walk_10:[s.walkTotal,10], walk_25:[s.walkTotal,25],
    walk_km_10:[s.walkKmTotal,10], walk_km_50:[s.walkKmTotal,50], walk_km_100:[s.walkKmTotal,100],
    bike_10:[s.bikeTotal,10], bike_25:[s.bikeTotal,25],
    bike_km_50:[s.bikeKmTotal,50], bike_km_100:[s.bikeKmTotal,100], bike_km_500:[s.bikeKmTotal,500],
    streak_3:[streak,3], streak_7:[streak,7], streak_14:[streak,14], streak_30:[streak,30]
  };
  return map[id]||null;
}
// Detalhe de uma conquista conquistado: quando foi, quantos já tem, e um empurrãozinho.
// Compartilha um única conquista (o aluno escolhe qual, em vez de despejar todos).
function shareTrophyImage(id){
  const t = TROPHIES.find(x=>x.id===id); if(!t) return;
  const quando = (state.trophyDates||{})[id];
  const dataStr = quando ? new Date(quando).toLocaleDateString('pt-BR') : '';
  const c = buildShareCanvas({
    title: t.secret ? 'Conquista secreta revelada' : 'Troféu desbloqueado',
    subtitle: t.emoji + '  ' + t.name,
    stats: [
      {rotulo:'Conquistado em', valor: dataStr || '—'},
      {rotulo:'Coleção', valor: state.trophies.length + '/' + TROPHIES.length},
      {rotulo:'Categoria', valor: ({geral:'Geral',lift:'Musculação',run:'Corrida',walk:'Caminhada',bike:'Bike',streak:'Sequência',body:'Corpo'})[t.cat] || t.cat},
      {rotulo:'Raridade', valor: t.secret ? 'Secreta ✨' : 'Normal'}
    ],
    listaTitulo: 'Como conquistei',
    lista: [t.desc],
    destaque: t.secret ? 'Ninguém me contou. Eu descobri. ✨' : 'Mais um degrau no MetaTreino 🏆'
  });
  shareCanvas(c, 'metatreino-'+id+'.png', `${t.emoji} Desbloqueei "${t.name}" no MetaTreino!`);
}
function openTrophiesKeepScroll(){ const sc=window._trophyScroll||0; openTrophies(); try{ document.getElementById('modal-inner').scrollTop=sc; }catch(e){} }
function openTrophyDetail(id){
  try{ window._trophyScroll = (document.getElementById('modal-inner')||{}).scrollTop||0; }catch(e){}
  document.getElementById('modal-back').classList.remove('award-dark'); // fundo preto só na celebração de desbloqueio
  const t = TROPHIES.find(x=>x.id===id); if(!t) return;
  const quando = (state.trophyDates||{})[id];
  const dataStr = quando ? new Date(quando).toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'}) : 'antes do app registrar datas';
  const total = TROPHIES.length, tenho = state.trophies.length;
  const mesmaCat = TROPHIES.filter(x=>x.cat===t.cat);
  const naCat = mesmaCat.filter(x=>state.trophies.includes(x.id)).length;
  const catNome = {geral:'Gerais', lift:'Musculação', run:'Corrida', walk:'Caminhada', bike:'Bike', streak:'Sequência', body:'Corpo'}[t.cat] || t.cat;
  const unlocked = TROPHIES.filter(x=>state.trophies.includes(x.id));
  const uIdx = unlocked.findIndex(x=>x.id===id);
  const prevId = uIdx>0 ? unlocked[uIdx-1].id : null;
  const nextId = (uIdx>=0 && uIdx<unlocked.length-1) ? unlocked[uIdx+1].id : null;
  const navArrow = (tid,ch)=> tid
    ? `<button onclick="openTrophyDetail('${tid}')" style="background:none;border:none;font-size:26px;color:var(--text-dim);padding:6px 10px;cursor:pointer">${ch}</button>`
    : `<div style="width:42px"></div>`;
  $('modal-inner').innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin:-4px -4px 0 0">
      <button onclick="closeModal();openTrophiesKeepScroll()" style="background:none;border:none;font-size:20px;color:var(--text-mute);padding:4px 8px;cursor:pointer">✕</button>
    </div>
    <div style="display:flex;justify-content:center;align-items:center;gap:20px;margin:-6px 0 2px">
      ${navArrow(prevId,'‹')}
      <div style="font-size:11.5px;color:var(--text-mute);min-width:46px;text-align:center">${uIdx>=0?(uIdx+1)+' de '+unlocked.length:''}</div>
      ${navArrow(nextId,'›')}
    </div>
    <div style="text-align:center">
      ${t.secret?'<div style="font-size:11px;letter-spacing:2px;color:var(--accent-2);font-weight:800">✨ CONQUISTA SECRETA ✨</div>':''}
      <div class="anim-check" style="font-size:66px;line-height:1.1${t.secret?';filter:drop-shadow(0 0 18px rgba(245,158,11,0.5))':''}">${t.emoji}</div>
      <h3 style="margin:8px 0 2px">${t.name}</h3>
      <div style="color:var(--text-dim);font-size:13.5px;line-height:1.5">${t.desc}</div>
    </div>
    <div class="card" style="margin-top:16px;padding:14px">
      <div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:var(--text-dim);font-size:13px">📅 Conquistado em</span><b style="font-size:13px">${dataStr}</b></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px dashed var(--border)"><span style="color:var(--text-dim);font-size:13px">🏷️ Categoria</span><b style="font-size:13px">${catNome} (${naCat}/${mesmaCat.length})</b></div>
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px dashed var(--border)"><span style="color:var(--text-dim);font-size:13px">🏆 Coleção</span><b style="font-size:13px">${tenho} de ${total} conquistas</b></div>
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal();shareTrophyImage('${t.id}')">📤 Compartilhar esta conquista</button>
    <button class="btn btn-outline btn-block" class="hl-primary" style="margin-top:8px" onclick="closeModal();shareTrophiesImage()">🏆 Compartilhar coleção inteira</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal();openTrophiesKeepScroll()">← Voltar aos conquistas</button>`;
  $('modal-back').classList.add('on');
}
// Ordena os conquistas de um grupo: os conquistados sobem pro topo (mais recentes primeiro),
// depois vêm os bloqueados ordenados pelo quanto falta — quem está a 90% aparece antes de quem está a 0%.
function ordenarTrofeus(items){
  const pct = t => {
    const pr = trophyProgress(t.id);
    if(!pr || !pr[1]) return -1;              // sem barra: sem progresso mensurável
    return Math.min(1, pr[0] / pr[1]);
  };
  const datas = state.trophyDates || {};
  return [...items].sort((a,b)=>{
    const ua = state.trophies.includes(a.id), ub = state.trophies.includes(b.id);
    if(ua !== ub) return ua ? -1 : 1;                       // conquistado primeiro
    if(ua && ub) return (datas[b.id]||0) - (datas[a.id]||0); // mais recente no topo
    return pct(b) - pct(a);                                  // bloqueados: mais perto primeiro
  });
}
function openTrophies(){
  document.getElementById('modal-back').classList.remove('award-dark'); // lista de conquistas com fundo normal
  const catNames = { geral:'🌟 Gerais', streak:'🔥 Consistência', lift:'🏋️ Musculação', run:'🏃 Corrida', walk:'🚶 Caminhada', bike:'🚴 Bike', body:'⚖️ Corpo' };
  // Ordem pensada: primeiro o que tem progresso mensurável (modalidades e consistência),
  // depois os gerais, e por último as secretas — que não têm meta pra perseguir.
  const cats = ['streak','lift','run','walk','bike','body','geral'];
  const groups = cats
    .map(c=>({ cat:c, name:catNames[c], items:TROPHIES.filter(t=>t.cat===c && !t.secret) }))
    .filter(g=>g.items.length);
  const secretas = TROPHIES.filter(t=>t.secret);
  if(secretas.length) groups.push({ cat:'secret', name:'✨ Secretas', items:secretas });
  const totalUnlocked = state.trophies.length;
  const pctAll = Math.round(totalUnlocked/TROPHIES.length*100);
  const html = `
    <h3>🏆 Suas conquistas</h3>
    <p style="color:var(--text-dim);font-size:13px;margin-top:2px">${totalUnlocked} de ${TROPHIES.length} desbloqueados</p>
    ${(()=>{ const sec=TROPHIES.filter(t=>t.secret); const rev=sec.filter(t=>state.trophies.includes(t.id)).length;
      return `<p style="color:var(--accent-2);font-size:12px;margin-top:4px">✨ ${rev} de ${sec.length} conquistas secretas reveladas — elas aparecem sozinhas quando você as merece</p>`; })()}
    <div style="height:8px;border-radius:99px;background:rgba(148,163,184,0.15);margin-top:8px;overflow:hidden"><div style="height:100%;width:${pctAll}%;background:linear-gradient(90deg,#10b981,#34d399);border-radius:99px"></div></div>
    ${groups.map(g=>{
      const u = g.items.filter(t=>state.trophies.includes(t.id)).length;
      if(g.cat==='secret'){
        const revealed = ordenarTrofeus(g.items.filter(t=>state.trophies.includes(t.id)));
        const lockedN = g.items.length - revealed.length;
        return `<div style="margin-top:18px"><div class="section-lbl" style="margin:0 0 8px">✨ Secretas reveladas · ${revealed.length}/${g.items.length}</div>
          ${revealed.length?`<div class="trophy-grid">${revealed.map(t=>`<div class="trophy unlock" onclick="openTrophyDetail('${t.id}')"><div class="trophy-emoji">${t.emoji}</div><div class="trophy-name">${t.name}</div><div class="trophy-desc">${t.desc}</div></div>`).join('')}</div>`:`<div style="font-size:12.5px;color:var(--text-dim)">Nenhuma revelada ainda… elas aparecem sozinhas quando você as merece.</div>`}
          ${lockedN?`<div style="margin-top:10px;text-align:center;font-size:12.5px;color:var(--text-mute)">🔒 Ainda restam <b>${lockedN}</b> segredos por descobrir… continue treinando 😉</div>`:''}
        </div>`;
      }
      return `<div style="margin-top:18px"><div class="section-lbl" style="margin:0 0 8px">${g.name} · ${u}/${g.items.length}</div>
        <div class="trophy-grid">${ordenarTrofeus(g.items).map(t=>{
          const ul = state.trophies.includes(t.id);
          let bar = '';
          if(!ul){
            const pr = trophyProgress(t.id);
            if(pr && pr[0]>0){
              const pct = Math.min(99, Math.round(pr[0]/pr[1]*100));
              bar = `<div style="height:5px;border-radius:99px;background:rgba(148,163,184,0.18);margin-top:6px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--primary)"></div></div><div style="font-size:9.5px;color:var(--text-mute);margin-top:3px">${Math.floor(pr[0])}/${pr[1]}</div>`;
            }
          }
          // Troféus "secretos" (os de humor/persistência) ficam ocultos até serem conquistados:
          // guardam a surpresa. Os de progresso continuam visíveis, pra a pessoa saber o que perseguir.
          if(!ul && t.secret){
            return `<div class="trophy" style="opacity:.55"><div class="trophy-emoji" style="filter:grayscale(1)">🔒</div><div class="trophy-name">Conquista secreta</div><div class="trophy-desc">Descubra treinando 😉</div></div>`;
          }
          const clique = ul ? ` onclick="openTrophyDetail('${t.id}')" style="cursor:pointer"` : '';
          return `<div class="trophy ${ul?'unlock':''}"${clique}><div class="trophy-emoji">${t.emoji}</div><div class="trophy-name">${t.name}</div><div class="trophy-desc">${t.desc}</div>${bar}</div>`;
        }).join('')}</div></div>`;
    }).join('')}
    ${state.specialTrophy ? `<div onclick="showSpecialReveal(state.specialTrophy)" style="margin-top:20px;padding:18px;border-radius:var(--radius-card);background:var(--tint-prep);border:1px solid rgba(167,139,250,0.30);text-align:center;cursor:pointer">
      <div style="font-size:44px;filter:drop-shadow(0 0 10px rgba(167,139,250,.38))">${state.specialTrophy.emo||'💍'}</div>
      <div style="font-size:10.5px;letter-spacing:2px;color:#a78bfa;font-weight:700;margin-top:4px">CONQUISTA ETERNA</div>
      <div style="font-weight:800;font-size:16px;margin-top:2px">${(state.specialTrophy.titulo||'').replace(/</g,'&lt;')}</div>
      <div style="color:var(--text-dim);font-size:12.5px;line-height:1.55;margin-top:6px;white-space:pre-line">${(state.specialTrophy.descricao||'').replace(/</g,'&lt;')}</div>
      <div style="font-size:11px;color:var(--text-mute);margin-top:8px;font-style:italic">Toque para reviver este momento</div>
    </div>` : ''}
    <button class="btn btn-outline btn-block" class="hl-primary" style="margin-top:14px" onclick="shareTrophiesImage()">📤 Compartilhar minhas conquistas</button>
    <button class="btn btn-primary btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
  $('modal-inner').innerHTML = html;
  $('modal-back').classList.add('on');
}

// ---------- LIBRARY ----------
let libFilter = 'Todos';
function renderLibrary(){
  const chips = ['Todos', ...EX_BANK.map(c=>c.name)];
  const emos = {'Todos':'📚'};
  EX_BANK.forEach(c=>{ emos[c.name] = c.emo; }); // fonte única: mesmo emoji do catálogo
  $('lib-chips').innerHTML = chips.map(c=>`<div class="filter-chip ${c===libFilter?'on':''}" onclick="setLibFilter('${c}')">${emos[c]||''} ${c}</div>`).join('');
  const q = ($('lib-search').value||'').toLowerCase();
  const total = EX_BANK.reduce((s,c)=>s+c.items.length,0);
  $('lib-count').textContent = `Catálogo completo · ${total} exercícios`;
  const cats = libFilter==='Todos'?EX_BANK:EX_BANK.filter(c=>c.name===libFilter);
  $('lib-list').innerHTML = cats.map(cat=>{
    const items = cat.items.filter(x=>!q||x.name.toLowerCase().includes(q)||x.sub.toLowerCase().includes(q));
    if(!items.length) return '';
    return `<div class="lib-cat ${cat.color}"><div><div class="lib-cat-name">${cat.emo} ${cat.name}</div><div class="lib-cat-count">${items.length} exercícios</div></div></div>${items.map(ex=>`<div class="lib-item ${cat.color}" onclick="openExercise('${ex.name.replace(/'/g,"\\'")}')"><div class="lib-info"><div class="lib-name">${ex.name}</div><div class="lib-part">${ex.sub}</div></div><div class="lib-play">▶</div></div>`).join('')}`;
  }).join('');
}
function setLibFilter(c){ libFilter=c; renderLibrary(); }
function filterLib(){ renderLibrary(); }
function openExercise(name){ playExercise(name); }

// ---------- MODALS ----------
const MODAL_CONTENT = {
  'support-info':`<h3>⚕️ Ferramenta de apoio ao treino</h3><p style="color:var(--text-dim);font-size:13px;line-height:1.5">O MetaTreino organiza e acompanha seus treinos de forma automatizada, mas <b>não substitui uma avaliação médica nem o acompanhamento de um profissional de educação física</b>.<br><br>Antes de iniciar qualquer programa de exercícios — principalmente se você tem alguma condição de saúde, lesão, ou está voltando a treinar depois de um tempo parado — procure um médico para uma avaliação e, se possível, um profissional de educação física para orientação individual.<br><br>Pare imediatamente e procure ajuda médica se sentir dor aguda, tontura, falta de ar excessiva ou desconforto no peito.</p><button class="btn btn-ghost btn-block" style="margin-top:14px" onclick="openModal('terms')">📄 Ler os Termos de Uso</button><button class="btn btn-primary btn-block" style="margin-top:8px" onclick="closeModal()">Entendi</button>`,
  'terms':`<h3>📄 Termos de Uso — MetaTreino</h3>
    <div style="font-size:13px;color:var(--text-dim);line-height:1.55;max-height:60vh;overflow-y:auto">
    <p style="color:var(--text-mute);font-size:11.5px">Última atualização: julho de 2026</p>
    <p><b style="color:var(--text)">1. Quem oferece.</b> O MetaTreino é oferecido por <b style="color:var(--text)">Marcelo Borges</b>, pessoa física, de <b style="color:var(--text)">Sorriso-MT</b>. Ao usar o app, você concorda com estes termos.</p>
    <p><b style="color:var(--text)">2. O que o app faz.</b> Gera planos de treino de musculação e corrida a partir das suas respostas, registra seu histórico e evolução, e sugere ajustes de carga com base no seu desempenho.</p>
    <p><b style="color:var(--text)">3. ⚠️ Aviso importante de saúde.</b> O MetaTreino é uma ferramenta de apoio e <b style="color:var(--text)">não substitui médico nem profissional de educação física</b>. Os treinos são sugestões genéricas, não prescrição individualizada. Consulte um médico antes de começar, principalmente se você tem mais de 35 anos, é sedentário, tem lesão, doença cardíaca, diabetes, hipertensão, está grávida ou no pós-parto. Sentiu dor aguda, tontura ou desconforto no peito? Pare na hora e procure ajuda médica.</p>
    <p><b style="color:var(--text)">4. Sua conta.</b> O acesso é liberado pelo treinador, individual e intransferível. É proibido revender ou compartilhar o acesso. Você é responsável pelos dados que informa.</p>
    <p><b style="color:var(--text)">5. Seus dados.</b> Ficam salvos na nuvem vinculados à sua conta Google, visíveis só para você e para o treinador. Não vendemos nem compartilhamos seus dados. Você pode excluir sua conta e todo o progresso a qualquer momento pelo próprio app (Perfil → Excluir minha conta).</p>
    <p><b style="color:var(--text)">6. Responsabilidade.</b> O app é fornecido "como está", sem garantia de resultados (que variam de pessoa pra pessoa) nem de disponibilidade ininterrupta. O uso das sugestões de treino é por sua conta e risco — respeite sempre os limites do seu corpo.</p>
    <p><b style="color:var(--text)">7. Encerramento.</b> O acesso pode ser suspenso em caso de uso indevido. Você pode parar de usar quando quiser.</p>
    <p><b style="color:var(--text)">8. Lei aplicável.</b> Estes termos seguem as leis brasileiras, incluindo o Código de Defesa do Consumidor e a LGPD.</p>
    <p><b style="color:var(--text)">9. Contato.</b> Dúvidas, suporte ou pedidos: <a href="mailto:metatreinooficial@gmail.com">metatreinooficial@gmail.com</a></p>
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="closeModal()">Fechar</button>`,
  'privacy':`<h3>🔒 Privacidade</h3><p>Seus dados de treino ficam salvos na nuvem, vinculados à sua conta Google, e visíveis apenas para você e para o treinador. Não coletamos, não compartilhamos e não vendemos suas informações. Você pode excluir tudo a qualquer momento em Perfil → Excluir minha conta. Contato: <a href="mailto:metatreinooficial@gmail.com">metatreinooficial@gmail.com</a>.</p><button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal()">Fechar</button>`,
  'backup':`<h3>💾 Backup dos meus dados</h3><p style="color:var(--text-dim);font-size:13px;line-height:1.5">Seus dados já ficam salvos na nuvem automaticamente. O backup em arquivo é uma segurança extra — guarde o arquivo onde quiser e restaure quando precisar.</p>
    <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="exportMyData()">📥 Baixar meu backup (.json)</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="document.getElementById('restore-input').click()">📤 Restaurar de um arquivo</button>
    <input type="file" id="restore-input" accept="application/json,.json" style="display:none" onchange="importMyData(event)">
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`,
  'pain':()=>{
    const cur = (state.user&&state.user.pain)||[];
    const areas = Object.keys(PAIN_MAP);
    return `<h3>🩹 Estou com dor</h3><p style="color:var(--text-dim);font-size:13px;line-height:1.5">Marque onde dói e o app adapta seus treinos na hora, evitando exercícios que sobrecarregam a região. Isso NÃO substitui avaliação médica — dor persistente merece um profissional.</p>
      <div class="radio-grid" id="pain-areas" style="margin-top:12px">${areas.map(a=>`<div class="opt opt-multi ${cur.includes(a)?'on':''}" data-val="${a}">${a}</div>`).join('')}</div>
      <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="savePain()">💾 Salvar e adaptar treinos</button>
      ${cur.length?`<button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="clearPain()">✅ Estou sem dor — voltar ao normal</button>`:''}`;
  },
  'change-terrain':()=>{
    const cur = state.modules.run?.setup?.terrain || 'asfalto';
    const opts = [
      {v:'asfalto', emo:'🛣️', t:'Asfalto', s:'Rua, avenidas, parques pavimentados'},
      {v:'esteira', emo:'🏃', t:'Esteira', s:'Academia ou em casa'},
      {v:'trilha', emo:'⛰️', t:'Trilha', s:'Terreno irregular, natureza'},
      {v:'pista', emo:'🏟️', t:'Pista', s:'Pista de atletismo com marcações'}
    ];
    return `<h3>🏃 Troca rápida de terreno</h3><p style="color:var(--text-dim);font-size:13px">Seus treinos de corrida são regenerados na hora pro novo terreno — objetivo, dias e nível continuam os mesmos.</p>
      ${opts.map(o=>`<div class="list-row" style="${o.v===cur?'border:1px solid var(--primary);border-radius:14px':''}" onclick="quickChangeTerrain('${o.v}')">${o.emo} <span><b>${o.t}</b>${o.v===cur?' ✓ atual':''}<br><span style="font-size:12px;color:var(--text-dim)">${o.s}</span></span></div>`).join('')}
      <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Cancelar</button>`;
  },
  'change-equip':()=>{
    const cur = state.modules.lift?.setup?.equip || 'academia';
    const opts = [
      {v:'academia', emo:'🏋️', t:'Academia completa', s:'Máquinas, cabos, halteres, barras'},
      {v:'halteres', emo:'💪', t:'Só halteres', s:'Halteres e barras em casa'},
      {v:'casa', emo:'🤸', t:'Peso do corpo', s:'Sem equipamentos'}
    ];
    // quem já montou uma lista personalizada precisa conseguir voltar pra ela
    const temCustom = !!((state.modules.lift||{}).setup||{}).equipList;
    const optsFinal = temCustom ? opts.concat([{v:'custom', emo:'🛠️', t:'Meus equipamentos', s:'Volta pra sua lista personalizada'}]) : opts;
    return `<h3>🏋️ Troca rápida de equipamento</h3><p style="color:var(--text-dim);font-size:13px">Seus treinos são regenerados na hora com o novo equipamento — objetivo, dias e nível continuam os mesmos.</p>
      ${optsFinal.map(o=>`<div class="list-row" style="${o.v===cur?'border:1px solid var(--primary);border-radius:var(--radius-note)':''}" onclick="quickChangeEquip('${o.v}')">${o.emo} <span><b>${o.t}</b>${o.v===cur?' ✓ atual':''}<br><span style="font-size:12px;color:var(--text-dim)">${o.s}</span></span></div>`).join('')}
      <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Cancelar</button>`;
  },
  'faq':`<h3>❓ FAQ / Sobre</h3><p><b>MetaTreino</b> gera planos de treino inteligentes de musculação e corrida, personalizados.<br><br><b>Como funciona?</b> Escolha o módulo, responda o questionário e receba um plano progressivo.<br><br><b>Meus dados ficam salvos?</b> Sim, na nuvem, vinculados à sua conta (Google ou e-mail/usuário) — você pode entrar de qualquer aparelho. Histórico de treinos guardado por 90 dias.<br><br><b>Contato:</b> metatreinooficial@gmail.com</p><button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal()">Fechar</button>`,
  'edit-profile':()=>{ const p = state.user.profile||{}; return `<h3>✏️ Editar perfil</h3><div class="field"><label>Como quer ser chamado</label><input class="input" id="ep-nick" value="${p.nickname||''}"></div><div class="field"><label>Data de nascimento</label><input class="input mono" type="date" id="ep-birth" value="${p.birth||''}" max="${new Date().toISOString().slice(0,10)}"><div style="color:var(--text-mute);font-size:11.5px;margin-top:4px">${p.birth?`Idade: ${ageFromBirth(p.birth)} anos`:'Preencha para receber os parabéns no seu aniversário 🎂'}</div></div>
    <div class="field"><label>Idade (usada se não informar a data)</label><input class="input mono" type="number" id="ep-age" value="${p.age||''}"></div><div class="field"><label>Altura (cm)</label><input class="input mono" type="number" id="ep-height" value="${p.height||''}"></div><div class="field"><label>WhatsApp</label><input class="input mono" id="ep-whats" value="${p.whatsapp||''}"></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="saveProfileEdit()">Salvar</button>`; },
  'add-weight':()=>{ const cur=latestWeight()||state.user.profile?.currentWeight||70; return `<h3>⚖️ Registrar peso hoje</h3><p style="color:var(--text-dim);font-size:13px">Última medição: <b>${cur}kg</b></p><div class="field"><label>Peso agora (kg)</label><input class="input mono" type="number" step="0.1" id="wt-val" value="${cur}"></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="saveWeight()">Salvar</button>`; },
  'add-student':`<h3>➕ Liberar acesso a aluno</h3><div class="field"><label>E-mail ou usuário do aluno</label><input class="input" type="text" id="as-email" placeholder="aluno@email.com ou joao123" autocapitalize="none" spellcheck="false"><div style="color:var(--text-mute);font-size:11.5px;margin-top:4px">Use o mesmo que ele digita pra entrar. Sem "@" vira login de usuário.</div></div><div class="field"><label>Nome (opcional)</label><input class="input" id="as-name" placeholder="Nome do aluno"></div><div class="field"><label>WhatsApp (opcional)</label><input class="input mono" id="as-whats" placeholder="61999999999"></div><div class="field"><label>Duração do acesso</label><div class="radio-grid g3" id="as-dur"><div class="opt" data-val="7">🎁 Teste 7 dias</div><div class="opt" data-val="30">30 dias</div><div class="opt on" data-val="60">60 dias</div><div class="opt" data-val="90">90 dias</div><div class="opt" data-val="180">6 meses</div><div class="opt" data-val="365">1 ano</div><div class="opt" data-val="9999">Vitalício</div></div></div><div class="field"><label>Notas (opcional)</label><input class="input" id="as-notes" placeholder="Ex: Alunos plano premium"></div><div id="as-err"></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="doAddStudent()">Liberar acesso</button>`,
  'broadcast':`<h3>📢 Mensagem em massa (WhatsApp)</h3><p style="color:var(--text-dim);font-size:13px">Gera um link do WhatsApp Web para cada aluno com o texto abaixo. Os alunos precisam ter WhatsApp cadastrado.</p><div class="field"><label>Mensagem</label><textarea class="input" id="bc-msg" rows="4" style="resize:vertical">Olá, treinador aqui do MetaTreino! Passando pra lembrar...</textarea></div><button class="btn btn-primary btn-block" onclick="doBroadcast()">Abrir links WhatsApp</button>`,
  'restart':()=>`<h3>🔄 Começar do zero</h3><p style="color:var(--text-dim);font-size:13px;line-height:1.5">Apaga todo o seu progresso — treinos, séries registradas, recordes, histórico de peso e conquistas — e refaz o questionário inicial.<br><br>Sua <b>conta e seu acesso continuam ativos</b> (diferente de excluir a conta).<br><br>Essa ação <b>não pode ser desfeita</b> — mas dá pra guardar tudo antes num backup. 💾</p>
    <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="exportMyData()">💾 Fazer backup antes</button>
    <button class="btn btn-outline btn-block" style="margin-top:16px;border-color:var(--accent);color:var(--accent-2)" onclick="doRestart()">🔄 Sim, começar do zero</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`,
  'rotina':()=>{
    const atual = (typeof rotinaAtual==='function') ? rotinaAtual() : null;
    return `<h3>💼 Como é sua rotina de trabalho?</h3>
      <p style="color:var(--text-dim);font-size:13px;line-height:1.5">Cada rotina cobra do corpo de um jeito. Sabendo a sua, eu sugiro <b>2-3 min de preparação</b> antes do treino — nada obrigatório, só o que faz sentido pro seu dia.</p>
      <div style="margin-top:14px">
        ${Object.entries(ROTINAS).map(([k,v])=>`<div class="list-row" onclick="setRotina('${k}')" style="${atual===k?'border-color:var(--line-prep);background:rgba(167,139,250,.08)':''}">${v.emo} <span>${v.label}</span>${atual===k?'<span style="margin-left:auto;color:#c4b5fd;font-size:12px;font-weight:800">ativo</span>':''}</div>`).join('')}
        <div class="list-row" onclick="setRotina('none')" style="color:var(--text-mute)">🚫 <span>Não quero essa sugestão</span></div>
      </div>
      <button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button>`;
  },
  'delete-account':()=>{
    const email=(state.user&&state.user.email)||'';
    const lh=((state.modules.lift||{}).history)||[], rh=((state.modules.run||{}).history)||[];
    const treinos = lh.length + rh.length;
    const trof = (state.trophies||[]).length;
    const km = Math.round(rh.reduce((a,x)=>a+(x.distance||0),0));
    const t0 = Math.min(...[lh[0]&&lh[0].at, rh[0]&&rh[0].at].filter(Boolean));
    const dias = isFinite(t0) ? Math.max(1, Math.floor((Date.now()-t0)/86400000)) : 0;
    const nome = (typeof firstName==='function' ? firstName() : '') || '';
    // mostra o que a pessoa construiu — não pra chantagear, mas pra ela decidir sabendo
    const conquistou = [];
    if(treinos) conquistou.push(`<b>${treinos}</b> ${treinos===1?'treino registrado':'treinos registrados'}`);
    if(km) conquistou.push(`<b>${km} km</b> percorridos`);
    if(trof) conquistou.push(`<b>${trof}</b> ${trof===1?'conquista':'conquistas'}`);
    if(dias>1) conquistou.push(`<b>${dias} dias</b> de jornada`);
    return `<div style="text-align:center;padding:2px 0">
        <div style="font-size:44px;line-height:1">😢</div>
        <h3 style="margin:10px 0 4px">${nome?`Vai nos deixar, ${nome}?`:'Vai nos deixar?'}</h3>
        <p style="color:var(--text-dim);font-size:13.5px;line-height:1.5;margin:0 auto;max-width:330px">Se for pra descansar, existe o <b>Modo Férias</b> — ele pausa as cobranças e guarda tudo do jeito que está. 🌴</p>
      </div>
      ${conquistou.length?`<div class="card" class="hl-warn" style="margin-top:16px;padding:13px 15px">
        <div style="font-size:11.5px;letter-spacing:.6px;color:var(--accent-2);font-weight:800;margin-bottom:7px">O QUE VAI EMBORA COM VOCÊ</div>
        <div style="font-size:13px;line-height:1.7;color:var(--text-dim)">${conquistou.join(' · ')}</div>
      </div>`:''}
      <div class="note note-danger">
        ⚠️ <b>Isso não pode ser desfeito.</b> Seus treinos, séries, recordes, anotações e conquistas serão apagados da nuvem para sempre — a não ser que você <b>faça um backup agora</b>.
        <br><br>Seu acesso continua liberado: dá pra entrar de novo com <b>${email}</b> e começar do zero — mas do zero mesmo, sem o histórico.
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:16px" onclick="exportMyData()">💾 Fazer backup antes de sair</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">💚 Deixa pra lá, vou ficar</button>
      <button class="btn btn-ghost btn-block" class="hl-danger" style="margin-top:14px" onclick="doDeleteAccount()">Excluir minha conta definitivamente</button>`;
  },
};
function openModal(k){
  const c = MODAL_CONTENT[k];
  $('modal-inner').classList.remove('modal-video');
  $('modal-back').classList.remove('video-open');
  $('modal-inner').innerHTML = typeof c==='function' ? c() : c;
  $('modal-back').classList.add('on');
  if(k==='add-student') bindOpts('modal-inner');
  if(k==='pain') document.querySelectorAll('#pain-areas .opt-multi').forEach(o=>{ o.onclick=()=>o.classList.toggle('on'); });
}
let trofeuPendente = false;
function closeModal(){
  const mi = $('modal-inner'); const hadVideo = mi && mi.querySelector('iframe');
  if(hadVideo) mi.innerHTML=''; // para o vídeo ao fechar
  if(mi) mi.classList.remove('modal-video','short');
  $('modal-back').classList.remove('on','video-open');
  // conquistas que ficaram esperando o fim do feedback (fechou pelo botão, pelo X ou tocando fora)
  if(trofeuPendente){ trofeuPendente = false; setTimeout(()=>{ try{ checkTrophies(); }catch(e){ console.log('Erro nas conquistas:', e); } }, 260); }
  // vídeo aberto DE DENTRO do assistente → volta pro assistente ao fechar
  if(hadVideo && typeof maVideoReturn!=='undefined' && maVideoReturn){ maVideoReturn=false; setTimeout(()=>{ try{ renderAssistant(); }catch(e){} }, 60); return; }
  // se um comando do assistente mexeu nos planos, redesenha a tela por baixo
  if(typeof maRefreshUI!=='undefined' && maRefreshUI){ maRefreshUI=false; try{ goTab(state.ui.tab||'home'); }catch(e){} }
}
let maVideoReturn = false;
// abre o vídeo do exercício DENTRO do app a partir do assistente (embed se houver link; senão busca no YouTube)
function playExerciseFromMA(name){
  const url = videoLinks[slug(name)];
  maVideoReturn = !!(url && ytVideoId(url)); // só volta ao assistente se abriu o player embutido
  playExercise(name);
}
// idade calculada a partir da data de nascimento (AAAA-MM-DD)
function ageFromBirth(birth){
  if(!birth) return null;
  const b = new Date(birth+'T00:00:00');
  if(isNaN(b)) return null;
  const hoje = new Date();
  let a = hoje.getFullYear() - b.getFullYear();
  const m = hoje.getMonth() - b.getMonth();
  if(m < 0 || (m === 0 && hoje.getDate() < b.getDate())) a--;
  return a;
}
// hoje é aniversário do aluno?
function isBirthdayToday(){
  const b = state.user && state.user.profile && state.user.profile.birth;
  if(!b) return false;
  const d = new Date(b+'T00:00:00'); if(isNaN(d)) return false;
  const h = new Date();
  return d.getDate()===h.getDate() && d.getMonth()===h.getMonth();
}
function saveProfileEdit(){
  const p = state.user.profile;
  p.nickname = $('ep-nick').value.trim() || p.nickname;
  const birth = ($('ep-birth') && $('ep-birth').value) || '';
  if(birth){
    const idade = ageFromBirth(birth);
    if(idade===null || idade<10 || idade>100) return toast('Data de nascimento inválida');
    p.birth = birth;
    p.age = idade; // idade sempre derivada da data, e se atualiza sozinha todo ano
  } else {
    p.age = parseInt($('ep-age').value) || p.age;
  }
  const h = parseFloat($('ep-height').value);
  if(h && (h<120 || h>230)) return toast('Altura inválida (120–230 cm)');
  p.height = h || p.height;
  p.whatsapp = $('ep-whats').value.trim();
  regenAllPlans(); // idade/altura afetam descanso e IMC — reaplica o plano
  saveData(); toast('✅ Perfil atualizado'); closeModal(); goTab('profile');
}

// Semana atual do plano, calculada da data de criação (avança sozinha).
// Musculação: ciclo de 12 semanas que recomeça (mesociclo). Corrida: para no total (prova).
function currentWeek(mod){
  if(!mod || !mod.plan) return {wk:1, total:12, cycle:1};
  const total = mod.plan.totalWeeks || 12;
  const created = (typeof planStartTs==='function' ? planStartTs(mod) : 0) || mod.createdAt || Date.now();
  const elapsed = Math.max(0, Math.floor((Date.now() - created) / (7*86400000))); // semanas completas (0 antes de começar)
  if(mod.plan.type === 'lift'){
    return { wk:(elapsed % total)+1, total, cycle:Math.floor(elapsed/total)+1 };
  }
  return { wk:Math.min(elapsed+1, total), total, cycle:1, done:elapsed+1>total };
}
function partsFromEntry(x){
  if(x.parts && x.parts.length) return x.parts;
  // migração: extrai do nome "Treino C — Pernas + Ombro"
  const m = (x.name||'').split('—')[1];
  return m ? m.split('+').map(s=>s.trim()).filter(Boolean) : [];
}

// ========== META ASSISTENTE (respostas por regras, com dados reais do aluno) ==========
function maName(){ return (state.user && state.user.profile && state.user.profile.nickname) || (state.user && state.user.name) || 'atleta'; }
function maAllHistory(){ return [...(state.modules.lift?.history||[]), ...(state.modules.run?.history||[])].sort((a,b)=>a.at-b.at); }
function maDaysUsing(){
  const created = Math.min(state.modules.lift?.createdAt||Infinity, state.modules.run?.createdAt||Infinity);
  if(!isFinite(created)) return 0;
  return Math.max(1, Math.floor((Date.now()-created)/86400000));
}
const MA_ANSWERS = {
  // ===== DIA A DIA =====
  _datahoje(){
    const d = new Date();
    const dias = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
    const data = d.toLocaleDateString('pt-BR',{day:'2-digit', month:'long', year:'numeric'});
    const mod = state.modules[state.active];
    const w = mod && mod.plan ? (mod.plan.workouts||[]).find(x=>x.dayIdx===getDayIdx()) : null;
    const extra = w ? `E é dia de <b>${w.name||'treino'}</b> — bora? 💪` : 'E hoje é dia de descanso por aqui — aproveita pra recuperar. 😌';
    return `Hoje é <b>${dias[d.getDay()]}</b>, ${data}. 📅<br><br>${extra}`;
  },
  _horaagora(){
    const d = new Date();
    const h = d.getHours();
    const per = h<5?'madrugada':h<12?'manhã':h<18?'tarde':'noite';
    const bt = (typeof bestTrainingTime==='function') ? bestTrainingTime() : null;
    let extra = '';
    if(bt) extra = `<br><br>Só de curiosidade: seus treinos da <b>${bt.melhor.faixa}</b> costumam render mais (${bt.melhor.pct}% terminam bem).`;
    return `São <b>${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}</b> — boa ${per}! 🕐${extra}`;
  },
  // ===== "COMO ESTOU INDO?" =====
  _comoestou(){
    const lift = ((state.modules.lift||{}).history)||[];
    const run  = ((state.modules.run ||{}).history)||[];
    const total = lift.length + run.length;
    if(total < 3) return `Ainda é cedo pra eu avaliar direito — você tem <b>${total}</b> ${total===1?'treino registrado':'treinos registrados'}. 😊<br><br>Registra mais alguns que eu te mostro tendência de ritmo, volume, recuperação e evolução. Por enquanto, o mais importante é criar o hábito. 💪`;
    const semana = [...lift,...run].filter(x=>Date.now()-x.at < 7*86400000).length;
    const mes = [...lift,...run].filter(x=>Date.now()-x.at < 30*86400000).length;
    const st = (typeof calcStreak==='function') ? calcStreak([...lift,...run].sort((a,b)=>a.at-b.at)) : 0;
    const linhas = [];
    linhas.push(`📊 <b>Seu resumo agora</b>`);
    linhas.push(`• <b>${total}</b> treinos no total · <b>${mes}</b> nos últimos 30 dias · <b>${semana}</b> nesta semana`);
    if(st>1) linhas.push(`• Sequência atual: <b>${st} dias</b> 🔥`);
    if(semana>=4) linhas.push(`• Frequência <b>excelente</b> essa semana. Só cuidado pra não pular a recuperação.`);
    else if(semana>=2) linhas.push(`• Frequência <b>boa</b> essa semana — é assim que resultado aparece: constância.`);
    else if(semana===1) linhas.push(`• Uma sessão essa semana. Não é pouco: é mais que 0. Bora somar outra? 💪`);
    else linhas.push(`• Nenhum treino nos últimos 7 dias. Sem cobrança — o próximo é sempre o mais importante. 💚`);
    const insights = [];
    try{ const r=recoveryPatternInsight(); if(r) insights.push(`Você rende melhor treinando <b>${r.melhor.nome}</b> (${r.melhor.pct}% dos treinos terminam bem).`); }catch(e){}
    try{ const b=bestTrainingTime(); if(b) insights.push(`Seu melhor horário parece ser a <b>${b.melhor.faixa}</b>.`); }catch(e){}
    try{ const m=monthlyRunCompare(); if(m && m.kmEste>m.kmAnt) insights.push(`Este mês você já corre mais que o mês passado (<b>${m.kmEste}km</b> vs ${m.kmAnt}km). 📈`); }catch(e){}
    if(insights.length) linhas.push(`<br>🔎 <b>O que descobri sobre você</b><br>• ${insights.join('<br>• ')}`);
    return linhas.join('<br>');
  },
  _correndobem(){
    const run = (((state.modules.run||{}).history)||[]).filter(r=>(!r.activity||r.activity==='corrida') && (r.distance||0)>0);
    if(run.length < 3) return `Você tem <b>${run.length}</b> ${run.length===1?'corrida registrada':'corridas registradas'} — ainda pouco pra eu falar de tendência. 🏃<br><br>Com 3+ corridas eu já começo a te mostrar ritmo médio, evolução e previsão de tempo por distância. Bora somar?`;
    const linhas = [];
    const pace = (typeof myRunPaceMin==='function') ? myRunPaceMin() : null;
    const km = run.reduce((a,r)=>a+(r.distance||0),0);
    const maior = Math.max(...run.map(r=>r.distance||0));
    linhas.push(`🏃 <b>Sua corrida em números</b>`);
    linhas.push(`• <b>${run.length}</b> corridas · <b>${Math.round(km)}km</b> acumulados · maior distância: <b>${Math.round(maior*10)/10}km</b>`);
    if(pace) linhas.push(`• Ritmo atual (mediana das últimas): <b>${fmtPaceMin(pace)}</b>`);
    try{
      const m = monthlyRunCompare();
      if(m){
        if(m.paceEste && m.paceAnt){
          const g = Math.round((m.paceAnt-m.paceEste)*60);
          if(g>=8) linhas.push(`• Seu ritmo <b>melhorou ${g}s/km</b> em relação ao mês passado 🔥`);
          else if(g<=-15) linhas.push(`• Seu ritmo está ${Math.abs(g)}s/km mais lento que no mês passado — pode ser calor, cansaço ou fase de base. Não é motivo pra preocupação isolada.`);
          else linhas.push(`• Ritmo <b>estável</b> em relação ao mês passado — consistência também é evolução.`);
        }
        linhas.push(`• Este mês: <b>${m.kmEste}km</b> (mês passado: ${m.kmAnt}km)`);
      }
    }catch(e){}
    try{ const v=volumeAlert(); if(v && v.nivel==='alto') linhas.push(`<br>⚠️ Atenção: sua semana está bem acima da média (${v.atual}km vs ${v.media}km). Subir volume rápido é a maior causa de lesão.`); }catch(e){}
    const alvo = { '5km':5, '10km':10, '21km':21.1, '42km':42.2 }[((state.modules.run||{}).setup||{}).goal];
    try{
      const pr = alvo ? racePrediction(alvo) : null;
      if(pr){ const mm=Math.floor(pr.min), ss=String(Math.round((pr.min-mm)*60)).padStart(2,'0');
        linhas.push(`<br>🔮 No seu ritmo atual, <b>${alvo}km</b> sairiam em ~<b>${mm}min${ss!=='00'?ss:''}</b>.`); }
    }catch(e){}
    return linhas.join('<br>');
  },
  _treinandobem(){
    const lift = ((state.modules.lift||{}).history)||[];
    if(lift.length < 3) return `Você tem <b>${lift.length}</b> ${lift.length===1?'treino de musculação':'treinos de musculação'} registrados. Ainda cedo pra avaliar tendência — mas o começo é sempre o passo mais difícil, e você já deu. 💪`;
    const semana = lift.filter(x=>Date.now()-x.at < 7*86400000).length;
    const mes = lift.filter(x=>Date.now()-x.at < 30*86400000).length;
    const bons = lift.filter(x=>['otimo','bem'].includes(x.feel)).length;
    const linhas = [`💪 <b>Sua musculação</b>`,
      `• <b>${lift.length}</b> treinos no total · <b>${mes}</b> nos últimos 30 dias · <b>${semana}</b> nesta semana`,
      `• <b>${Math.round(bons/lift.length*100)}%</b> dos seus treinos terminam com sensação boa`];
    try{ const hg=hardGroupInsight(); if(hg) linhas.push(`• <b>${hg.parte}</b> é seu treino mais puxado (${hg.pct}% terminam cansado/exausto)`); }catch(e){}
    try{ const fi=fatigueInsight(); if(fi) linhas.push(`<br>${fi}`); }catch(e){}
    const plano = state.modules.lift && state.modules.lift.setup;
    if(plano && plano.days){
      const esperado = parseInt(plano.days)||3;
      if(semana >= esperado) linhas.push(`<br>✅ Você bateu a meta de <b>${esperado}× por semana</b>. Excelente!`);
      else linhas.push(`<br>📌 Meta do plano: <b>${esperado}× por semana</b> — você está em ${semana}. Ainda dá tempo!`);
    }
    return linhas.join('<br>');
  },
  // ===== PREVISÃO DE TEMPO POR DISTÂNCIA =====
  _previsaoDist(){
    const alvo = maUltimaDistPergunta || 10;
    try{
      const pr = racePrediction(alvo);
      if(!pr) return `Pra prever seu tempo em <b>${alvo}km</b> eu preciso de pelo menos <b>3 corridas</b> registradas (com distância e tempo). Registra mais algumas que eu faço a conta! 🏃`;
      const mm = Math.floor(pr.min), ss = String(Math.round((pr.min-mm)*60)).padStart(2,'0');
      const h = Math.floor(mm/60), rest = mm%60;
      const tempo = h>0 ? `${h}h${String(rest).padStart(2,'0')}min` : `${mm}min${ss!=='00'?' '+ss+'s':''}`;
      return `🔮 <b>Previsão pra ${alvo}km: ~${tempo}</b> (ritmo de ${fmtPaceMin(pr.paceAlvo)})<br><br>Baseado na sua melhor corrida recente: <b>${Math.round(pr.base.distance*10)/10}km em ${fmtDur(pr.base.duration)}</b>.<br><br>É uma estimativa (fórmula de Riegel, usada por treinadores) — e ela melhora conforme você treina. Distâncias maiores pedem ritmo um pouco mais conservador. 💪`;
    }catch(e){ return 'Não consegui calcular agora 😕. Registra mais algumas corridas e tenta de novo.'; }
  },
  // ===== SONO =====
  _trabalhosentado(){
    const r = (typeof rotinaAtual==='function') ? rotinaAtual() : null;
    const base = `O corpo cobra de quem passa o dia na <b>mesma posição</b> — sentado, em pé parado ou dirigindo. 💼<br><br>
<b>O que a pesquisa mostra:</b><br>• O problema maior é ficar <b>muitas horas seguidas</b> parado, não a posição em si<br>• Levantar/mudar de posição 2-3 min a cada hora já muda bastante<br>• Quem faz <b>60-75 min de atividade moderada por dia</b> praticamente anula o risco extra (Lancet, +1 milhão de pessoas)<br>• Meta oficial: <b>150 min por semana</b> de atividade moderada<br><br>`;
    if(r && ROTINAS[r]) return base + `✅ Você marcou: <b>${ROTINAS[r].label}</b>. ${ROTINAS[r].porque}<br><br>Por isso eu já coloco <b>2-3 min de preparação</b> no aquecimento dos seus treinos, escolhidos conforme os grupos do dia.`;
    return base + '💡 Me conta como é seu dia em <b>Perfil › Minha rotina de trabalho</b> (sentado, em pé, carregando peso, dirigindo ou em movimento). Aí eu passo a sugerir a preparação certa antes de cada treino.';
  },
  _sonotreino(){
    let ctx = '';
    try{ const s = maCtxGet('sono'); if(s!==null && s<=5) ctx = `<br><br>Você me contou que dormiu <b>${s}h</b> — nesse cenário, eu manteria a carga de hoje e focaria na execução, sem buscar recorde.`; }catch(e){}
    let padrao = '';
    try{ const r = recoveryPatternInsight(); if(r) padrao = `<br><br>Nos <b>seus</b> dados: você rende melhor treinando <b>${r.melhor.nome}</b> (${r.melhor.pct}% dos treinos terminam bem, contra ${r.pior.pct}% ${r.pior.nome}).`; }catch(e){}
    return `Sim, afeta — e bastante. 😴<br><br>Dormir mal alguns dias mexe principalmente com:<br>• <b>Força máxima</b>: você aguenta menos carga que o normal<br>• <b>Coordenação e foco</b>: a técnica piora, e é aí que mora o risco de lesão<br>• <b>Recuperação</b>: boa parte da reconstrução muscular acontece dormindo<br><br>O que <b>não</b> muda: treinar mesmo cansado continua sendo melhor que não treinar. Só não é dia de buscar recorde.<br><br><b>Na prática:</b> mantenha a mesma carga, capriche na execução, aqueça um pouco mais e, se o corpo pedir, tire uma série. Semana de sono ruim + treino pesado é a combinação que mais leva gente ao estagnamento.${ctx}${padrao}`;
  },

  treino_hoje(){
    const today = new Date(); today.setHours(0,0,0,0);
    const done = maAllHistory().filter(x=>{ const d=new Date(x.at); d.setHours(0,0,0,0); return d.getTime()===today.getTime(); });
    if(!done.length){
      const liftT = state.modules.lift?.plan?.workouts?.find(w=>w.dayIdx===getDayIdx());
      const runT = state.modules.run?.plan?.workouts?.find(w=>w.dayIdx===getDayIdx());
      if(liftT||runT){
        const partes = [];
        if(liftT) partes.push(`💪 <b>${liftT.name||'Musculação'}</b>${liftT.duration?` (~${liftT.duration} min)`:''}`);
        if(runT) partes.push(`🏃 <b>${runT.name||'Corrida'}</b>`);
        return `Bora, ${maName()}! Hoje é dia de ${partes.join(' e ')}. Cada treino te deixa mais perto da sua meta — depois desse, a sensação de dever cumprido é ótima. Vamos nessa? 💪`;
      }
      return 'Hoje é dia de descanso no seu plano. Aproveite pra recuperar — descanso também é treino, é nele que o corpo se reconstrói mais forte! 😴';
    }
    const lift = done.filter(x=>x.module==='lift'), run = done.filter(x=>x.module==='run');
    let r = '';
    if(lift.length){ const w=lift[0]; const n=(w.exercisesDone||[]).length; r += `Hoje você concluiu ${w.name}${n?` — ${n} exercícios`:''}, cerca de ${w.duration} min.${w.feel?` Você terminou se sentindo "${({otimo:'muito bem 🚀',bem:'bem 😊',cansado:'cansado 😮‍💨',exausto:'exausto 😩'})[w.feel]}".`:''} `; }
    if(run.length){ const w=run[0]; r += `${lift.length?'E ':''}Registrou ${w.name.replace(/^[🚶🚴🏃]\s*/u,'')}${w.distance?` — ${w.distance}km`:''} em ${w.duration} min${w.pace?` (${w.pace})`:''}. `; }
    return r + 'Excelente trabalho! 👏';
  },
  evolucao(){
    const h = maAllHistory();
    if(h.length<2) return 'Ainda é cedo pra medir evolução — continue registrando seus treinos que em poucas semanas eu te mostro sua tendência. 📈';
    const now=Date.now();
    const last30 = h.filter(x=>x.at>=now-30*86400000).length;
    const prev30 = h.filter(x=>x.at>=now-60*86400000 && x.at<now-30*86400000).length;
    let r = `Nos últimos 30 dias você treinou ${last30} ${last30===1?'vez':'vezes'}.`;
    if(prev30>0){ const dif=Math.round((last30-prev30)/prev30*100); r += dif>=0?` Isso é ${dif}% a mais que no mês anterior — constância subindo! 🔥`:` Foi ${Math.abs(dif)}% a menos que no mês anterior. Bora retomar o ritmo? 💪`; }
    else if(last30>0) r += ' Esse é seu primeiro mês com registros — ótimo começo!';
    const streak = calcStreak(h);
    if(streak>=3) r += ` Sua sequência atual é de ${streak} dias. 🔥`;
    return r;
  },
  perder_peso(){
    const freq = maAllHistory().filter(x=>x.at>=Date.now()-30*86400000).length;
    const perWeek = Math.round(freq/4.3*10)/10;
    let base = 'Não dá pra prever com exatidão — depende de alimentação, sono e fatores individuais.';
    if(perWeek>=4) base += ` Mas mantendo sua frequência atual (~${perWeek}x/semana) com alimentação adequada, muita gente perde entre 2 e 4 kg por mês.`;
    else if(perWeek>=1) base += ` Treinando ~${perWeek}x/semana com boa alimentação, uma faixa comum é 1 a 3 kg por mês.`;
    else base += ' Aumentar a frequência de treino ajuda bastante — comece com uma meta realista de 3x por semana.';
    return base + ' Pra um plano preciso, vale conversar com um nutricionista. 🥗';
  },
  corrida(){
    const runs = (state.modules.run?.history||[]).filter(r=>!r.activity||r.activity==='corrida');
    if(!runs.length) return 'Você ainda não registrou corridas. Quando registrar algumas, eu te mostro sua evolução de distância e ritmo! 🏃';
    const now=Date.now();
    const kmMonth = runs.filter(r=>r.at>=now-30*86400000).reduce((s,r)=>s+(r.distance||0),0);
    const longest = Math.max(...runs.map(r=>r.distance||0));
    let r = `Você correu ${kmMonth.toFixed(1)}km neste último mês. Sua maior distância registrada foi ${longest}km.`;
    const paces = runs.filter(r=>r.pace).map(r=>parsePace(r.pace));
    if(paces.length>=4){
      const first = paces.slice(0,Math.ceil(paces.length/2)); const last = paces.slice(-Math.ceil(paces.length/2));
      const avg = a=>a.reduce((s,x)=>s+x,0)/a.length;
      const fp=avg(first), lp=avg(last);
      const fmt = sec=>Math.floor(sec/60)+':'+String(Math.round(sec%60)).padStart(2,'0');
      if(lp<fp) r += ` Seu pace médio melhorou de ${fmt(fp)} para ${fmt(lp)} min/km. Parabéns pela evolução! ⚡`;
      else r += ` Seu pace está estável em torno de ${fmt(lp)} min/km.`;
    }
    return r;
  },
  trofeus(){
    const u = state.trophies.length, t = TROPHIES.length;
    const locked = TROPHIES.filter(x=>!state.trophies.includes(x.id));
    let closest=null, bestPct=0;
    locked.forEach(tr=>{ const pr=trophyProgress(tr.id); if(pr&&pr[1]>0){ const pct=pr[0]/pr[1]; if(pct>bestPct&&pct<1){ bestPct=pct; closest={tr,pr}; } } });
    let r = `Você desbloqueou ${u} de ${t} conquistas (${Math.round(u/t*100)}%).`;
    if(closest) r += ` O mais perto é "${closest.tr.name}": ${Math.floor(closest.pr[0])}/${closest.pr[1]}. Falta pouco! 🏆`;
    return r;
  },
  prova(){
    if(state.active!=='run' && !state.modules.run) return 'As provas fazem parte do módulo de <b>corrida</b> 🏃. Crie um plano de corrida e me diga a data da sua prova (ex: "minha prova é dia 15/08") que eu monto sua contagem regressiva!';
    const dr = daysToRace();
    if(dr===null) return 'Você ainda não cadastrou nenhuma prova. 🏁 Me diga quando é assim: <b>"minha prova é dia 15/08"</b> — aí eu faço a contagem regressiva e vou ajustando as dicas conforme o dia chega!';
    if(dr<0) return 'A última prova que você cadastrou já passou 🏅. Como foi? Se tiver outra marcada, me diga a data (ex: "minha prova é dia 20/10") que eu atualizo pra você!';
    const rd = state.modules.run.setup.raceDate;
    const dataFmt = new Date(rd+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'});
    if(dr===0) return `🏁 É HOJE, ${maName()}! Sua prova é hoje (${dataFmt}). Confie no treino que você fez, comece devagar e aproveite cada km. Boa prova! 🎉`;
    let dica;
    if(dr<=3) dica='Reta final: só trotes leves, hidrate bem e durma cedo. 😴';
    else if(dr<=7) dica='Semana de prova: reduza o volume e foque na recuperação. O trabalho duro já foi feito! 💪';
    else if(dr<=14) dica='Taper chegando: em breve a intensidade cai e você chega afiado. 🔥';
    else if(dr<=30) dica='Menos de um mês! Seus treinos-chave são agora — cada um conta muito. 🎯';
    else dica='Tem tempo pra construir uma preparação sólida. Constância é o que define o resultado. 🚀';
    return `🏁 Faltam <b>${dr} dias</b> pra sua prova (${dataFmt}), ${maName()}! ${dica}`;
  },
  meta(){
    const mod = state.modules[state.active];
    if(!mod||!mod.plan) return 'Você ainda não tem um plano ativo. Crie um pra eu acompanhar sua meta! 🎯';
    const cw = currentWeek(mod);
    const wkDone = (mod.history||[]).filter(x=>x.at>=Date.now()-7*86400000).length;
    const target = mod.plan.workouts.length;
    let r = `Sua meta é ${labelGoal(mod)} — semana ${cw.wk} de ${cw.total}. Esta semana você fez ${wkDone} de ${target} treinos.`;
    if(wkDone>=target) r += ' Meta batida! 🎉';
    else r += ` Faltam ${target-wkDone} pra fechar a semana. Você consegue! 💪`;
    if(state.active==='run'){ const dr=daysToRace(); if(dr!==null&&dr>=0&&dr<400) r += ` Faltam ${dr} dias pra sua prova.`; }
    return r;
  },
  musculo_menos(){
    const now=Date.now();
    const counts={};
    (state.modules.lift?.history||[]).filter(x=>x.at>=now-60*86400000).forEach(x=>{ partsFromEntry(x).forEach(p=>{ counts[p]=(counts[p]||0)+1; }); });
    const entries=Object.entries(counts);
    if(entries.length<2) return 'Ainda não tenho treinos suficientes pra comparar grupos musculares. Continue registrando! 💪';
    entries.sort((a,b)=>a[1]-b[1]);
    const menos=entries[0], mais=entries[entries.length-1];
    const resumo = entries.slice().sort((a,b)=>b[1]-a[1]).map(([p,n])=>`${p} ${n}x`).join(', ');
    return `Nos últimos 60 dias: ${resumo}. Você treina ${mais[0].toLowerCase()} com mais frequência e ${menos[0].toLowerCase()} com menos — vale dar mais atenção a ${menos[0].toLowerCase()} pra equilibrar. ⚖️`;
  },
  pausa(){
    const h = maAllHistory();
    if(h.length<2) return 'Você mal começou — sem pausas relevantes ainda. Mantenha o ritmo! 🔥';
    const days=[...new Set(h.map(x=>{const d=new Date(x.at);d.setHours(0,0,0,0);return d.getTime();}))].sort((a,b)=>a-b);
    let maxGap=0; for(let i=1;i<days.length;i++) maxGap=Math.max(maxGap,(days[i]-days[i-1])/86400000);
    const streak=calcStreak(h);
    return `Sua maior pausa foi de ${Math.round(maxGap)} dias. ${streak>0?`Atualmente você está com ${streak} ${streak===1?'dia':'dias'} de sequência. 🔥`:'Que tal recomeçar hoje a sua sequência? 💪'}`;
  },
  recorde(){
    const prs=Object.entries(state.prs||{});
    if(!prs.length) return 'Você ainda não tem recordes registrados. Registre suas séries de musculação que eu começo a guardar seus PRs! 🏆';
    const top=prs.map(([id,pr])=>({id,...pr})).sort((a,b)=>b.peso-a.peso).slice(0,3);
    const nome=id=>{ for(const c of EX_BANK) for(const e of c.items) if(slug(e.name)===id) return e.name; return id; };
    return 'Seus maiores recordes: '+top.map(p=>`${nome(p.id)} — ${p.peso}kg×${p.reps}`).join('; ')+'. 💪';
  },
  tempo_uso(){
    const d=maDaysUsing();
    const total=maAllHistory().length;
    return `Você usa o MetaTreino há ${d} ${d===1?'dia':'dias'} e já registrou ${total} ${total===1?'atividade':'atividades'}. Obrigado por treinar com a gente! 🙌`;
  },
  corrida_ou_musculacao(){
    const now=Date.now();
    const lift=(state.modules.lift?.history||[]).filter(x=>x.at>=now-30*86400000).length;
    const run=(state.modules.run?.history||[]).filter(x=>x.at>=now-30*86400000).length;
    if(!lift&&!run) return 'Nenhum treino registrado neste mês ainda. Bora mudar isso? 💪';
    if(lift>run) return `Neste mês você treinou mais musculação: ${lift} treinos de força contra ${run} de corrida/atividades. 💪`;
    if(run>lift) return `Neste mês você foi mais pra corrida: ${run} atividades contra ${lift} de musculação. 🏃`;
    return `Equilíbrio perfeito neste mês: ${lift} de musculação e ${run} de corrida! ⚖️`;
  },
  maior_peso(){
    if(!state.weights||!state.weights.length) return 'Você ainda não registrou seu peso. Faça isso no Perfil pra acompanhar sua evolução corporal! ⚖️';
    const pesos=state.weights.map(w=>w.weight);
    const max=Math.max(...pesos), min=Math.min(...pesos), atual=pesos[pesos.length-1];
    return `Seu peso atual é ${atual}kg. Máximo registrado: ${max}kg, mínimo: ${min}kg. ${atual<max?`Você já reduziu ${(max-atual).toFixed(1)}kg do seu pico! 👏`:''}`;
  },
  calorias(){
    const now=Date.now();
    const wk=maAllHistory().filter(x=>x.at>=now-7*86400000);
    const min=Math.round(wk.reduce((s,x)=>s+(x.duration||0),0));
    const kcal=Math.round(min*7);
    if(!min) return 'Você não registrou treinos esta semana ainda. Bora movimentar? 🔥';
    return `Esta semana você somou ~${min} min de treino, o que representa aproximadamente ${kcal} kcal gastas. É uma estimativa grosseira — o gasto real varia com intensidade, peso e metabolismo. 🔥`;
  },
  motiva(){
    return contextualQuote() || QUOTES[Math.floor(Math.random()*QUOTES.length)];
  },
  imc(){
    try{
      const r = calcIMC();
      if(!r) return 'Preencha altura e peso no Perfil pra eu calcular seu IMC. 📏';
      return `Seu IMC é <b>${r.value}</b> (${r.cls}). Lembrando: o IMC é um indicador geral e não distingue músculo de gordura — quem treina força costuma ter IMC mais alto sem estar acima do peso. Use como referência, não como veredito. 📊`;
    }catch(e){ return 'Preencha altura e peso no Perfil pra eu calcular seu IMC. 📏'; }
  },
  semana(){
    const ini = new Date(); ini.setHours(0,0,0,0); ini.setDate(ini.getDate()-(getDayIdx()-1));
    const feitos = maAllHistory().filter(x=>x.at>=ini.getTime()).length;
    const mod = state.modules[state.active];
    const alvo = mod && mod.plan ? mod.plan.workouts.length : 0;
    if(!alvo) return `Você fez ${feitos} ${feitos===1?'treino':'treinos'} esta semana. 💪`;
    const falta = Math.max(0, alvo-feitos);
    return falta===0
      ? `Você já fez ${feitos} de ${alvo} treinos desta semana — meta batida! 🎉`
      : `Você fez ${feitos} de ${alvo} treinos desta semana. ${falta===1?'Falta 1':'Faltam '+falta} pra fechar. Você consegue! 💪`;
  },
  proximo(){
    const mod = state.modules[state.active];
    if(!mod || !mod.plan) return 'Você ainda não tem um plano ativo. 🎯';
    const hoje = getDayIdx();
    const dias = ['segunda','terça','quarta','quinta','sexta','sábado','domingo'];
    const hojeD = new Date(); hojeD.setHours(0,0,0,0);
    const feitoEm = m => !!(m && (m.history||[]).some(x=>{ const t=new Date(x.at); t.setHours(0,0,0,0); return t.getTime()===hojeD.getTime(); }));
    const temHoje = m => (m && m.plan && (m.plan.workouts||[]).find(w=>w.dayIdx===hoje)) || null;
    const ordenados = [...mod.plan.workouts].sort((a,b)=>a.dayIdx-b.dayIdx);
    const prox = ordenados.find(w=>w.dayIdx>hoje) || ordenados[0];
    if(!prox) return 'Seu plano não tem treinos cadastrados. 🤔';
    const quandoProx = `<b>${prox.name}</b> na ${dias[prox.dayIdx-1]}${prox.duration?` (~${prox.duration} min)`:''}`;
    const hojeTem = temHoje(mod), feitoAtivo = feitoEm(mod);
    // olha também o outro módulo (musculação ⇄ corrida) pra saber se falta algo hoje
    const outroK = state.active==='lift' ? 'run' : 'lift';
    const outroHoje = temHoje(state.modules[outroK]);
    const outroFeito = feitoEm(state.modules[outroK]);
    const outroNome = outroK==='lift' ? 'a musculação' : 'a corrida';
    // 1) ainda falta o treino de hoje neste módulo
    if(hojeTem && !feitoAtivo) return `Hoje ainda tem <b>${hojeTem.name}</b>${hojeTem.duration?` (~${hojeTem.duration} min)`:''}. Depois dele, o próximo é ${quandoProx}. 💪`;
    // 2) já treinou aqui, mas falta o outro módulo hoje
    if(feitoAtivo && outroHoje && !outroFeito) return `Você já treinou hoje ✅, mas ainda falta <b>${outroHoje.name}</b> em ${outroNome}. Depois de fechar o dia, o próximo é ${quandoProx}. 💪`;
    // 3) já treinou hoje (tudo feito)
    if(feitoAtivo) return `Você já treinou hoje ✅${outroHoje&&outroFeito?' (os dois módulos, mandou bem!)':''}. O próximo é ${quandoProx}. 💪`;
    // 4) hoje é descanso neste módulo
    if(outroHoje && !outroFeito) return `Hoje é descanso na ${state.active==='lift'?'musculação':'corrida'}, mas você tem <b>${outroHoje.name}</b> em ${outroNome} hoje. Depois, o próximo aqui é ${quandoProx}. 🙂`;
    return `Hoje é descanso na ${state.active==='lift'?'musculação':'corrida'}. Seu próximo treino é ${quandoProx}. 😴`;
  },
  aniversario(){
    const b = state.user && state.user.profile && state.user.profile.birth;
    if(!b) return 'Você ainda não cadastrou sua data de nascimento. Vá no Perfil → Editar dados pessoais pra eu te dar os parabéns no dia! 🎂';
    if(isBirthdayToday()) return `🎂 É HOJE! Feliz aniversário, ${maName()}! Que o novo ciclo venha com muita saúde e recordes. 🎉`;
    const d = new Date(b+'T00:00:00'); const h = new Date();
    let prox = new Date(h.getFullYear(), d.getMonth(), d.getDate());
    if(prox < h) prox = new Date(h.getFullYear()+1, d.getMonth(), d.getDate());
    const dias = Math.ceil((prox-h)/86400000);
    return `Faltam ${dias} ${dias===1?'dia':'dias'} pro seu aniversário. Você tem ${ageFromBirth(b)} anos. 🎂`;
  },
  // ---- NOVAS RESPOSTAS (v10) ----
  faltei(){
    const mod = state.modules[state.active];
    const miss = missedWorkoutsThisWeek(mod);
    if(!miss.length) return `👏 Você não faltou nenhum treino esta semana, ${maName()}! Constância em dia — continue assim. 💪`;
    const nomes = miss.map(w=>state.active==='lift'?('Treino '+w.k):(w.name||'').split(' ')[0]).join(', ');
    const feitosSem = (((state.modules[state.active]||{}).history)||[]).filter(x=>Date.now()-x.at < 7*86400000).length;
    const prev = feitosSem + miss.length;
    return `Você treinou <b>${feitosSem} de ${prev}</b> dias planejados nesta semana. ${nomes} ${miss.length>1?'ficaram':'ficou'} para trás — e tudo bem, isso não se paga depois. 🙂<br><br>O que conta agora é o <b>próximo treino</b>. Voltar à rotina vale mais que compensar o que passou.`;
  },
  peso_mudanca(){
    const f = firstWeight(), l = latestWeight();
    if(!f || !l || (state.weights||[]).length<2) return `Ainda não tenho registros suficientes do seu peso pra comparar. Diga "estou pesando XX kg" algumas vezes que eu acompanho a evolução. ⚖️`;
    const diff = +(l - f).toFixed(1);
    if(diff===0) return `Seu peso está igual ao primeiro registro (${l} kg). Lembre: a balança não conta tudo — força e medidas também evoluem. 💪`;
    const perdeu = diff<0;
    return `Do primeiro registro (${f} kg) até agora (${l} kg), você ${perdeu?'perdeu':'ganhou'} <b>${Math.abs(diff)} kg</b>. ${perdeu?'Mandou bem no processo! 🔥':'Se o objetivo é massa, ótimo sinal — senão, vale ajustar a rotina. 💪'}`;
  },
  trocar_ex(){ return `Sim! 🔀 Na aba <b>Sessões</b>, cada exercício tem o botão <b>"Trocar"</b> — ele substitui por outro do mesmo grupo muscular, mantendo o foco do treino (vale só pra aquele dia). E o botão <b>"Ver como fazer"</b> abre o vídeo da execução. 💪`; },
  proximo_trofeu(){
    const unlocked = (state.trophies||[]).length, total = TROPHIES.length;
    const falta = TROPHIES.filter(t=>!t.secret && !(state.trophies||[]).includes(t.id));
    if(!falta.length) return `🏆 Você já desbloqueou todos os conquistas visíveis (${unlocked}/${total})! Ainda há secretos escondidos por aí... 🤫`;
    const alvo = falta[0];
    return `Você tem <b>${unlocked}/${total}</b> conquistas. Um ao seu alcance: <b>${alvo.emoji} ${alvo.name}</b> — ${alvo.desc}. E ainda há conquistas secretas pra descobrir treinando! 🤫`;
  },
  agua(){
    const w = latestWeight();
    if(!w) return `A referência geral é ~<b>35 ml de água por kg</b> de peso por dia. Registre seu peso ("estou pesando XX kg") que eu calculo pra você. Em dias de treino/calor, beba mais. 💧`;
    const l = (w*35/1000).toFixed(1);
    return `Pro seu peso (${w} kg), uma referência geral é ~<b>${l} L de água por dia</b> (35 ml/kg). Em treino ou calor, aumente um pouco. É orientação geral, não regra médica. 💧`;
  },
  proteina(){
    const w = latestWeight();
    const base = w ? `Pro seu peso (${w} kg), fica em torno de <b>${Math.round(w*1.6)}–${Math.round(w*2.2)} g/dia</b>. ` : '';
    return `Pra quem treina buscando músculo, a faixa geral é <b>1,6 a 2,2 g de proteína por kg</b> de peso por dia. ${base}São referências de educação física — pra um plano individual, o ideal é um nutricionista. 🍗`;
  },
  comer_treino(){ return `🥗 <b>Antes</b> (1-2h): um carboidrato pra energia + um pouco de proteína (fruta + iogurte, pão + ovo). Evite muita gordura.<br><br>🍗 <b>Depois</b>: proteína pra recuperar + carboidrato pra repor (frango + arroz, ovos + batata, shake + fruta). O que mais importa é a alimentação do dia todo. Pra dieta individual, procure um nutricionista.`; },
  importancia_proteina(){ return `🍗 A proteína é o material de construção do músculo: após o treino, ela repara e fortalece as fibras. Sem proteína suficiente, o corpo não constrói massa mesmo treinando bem — e ela ainda ajuda na saciedade. Fontes: ovos, frango, carne, peixe, leite/iogurte, feijão. 💪`; },
  deficit(){ return `📚 <b>Déficit calórico</b> é consumir menos calorias do que você gasta — é o que leva à perda de gordura. O contrário (superávit) favorece ganho de massa. Pra emagrecer com saúde, o déficit deve ser moderado, mantendo proteína e treino de força pra preservar músculo. Pra números individuais, um nutricionista ajuda. 🥗`; },
  aumentar_carga(){ return `📈 A regra prática: quando você faz <b>todas as séries no topo da faixa de repetições com boa técnica</b> (ex.: 3×12 num alvo de 8-12), é hora de subir um pouco a carga na próxima vez (~2,5 a 5%). Isso é a <b>sobrecarga progressiva</b> — o que faz o corpo evoluir. 💪`; },
  o_que_hipertrofia(){ return `📚 <b>Hipertrofia</b> é o aumento do tamanho dos músculos. Acontece com estímulo (treino de força) + descanso + boa alimentação: o músculo se reconstrói maior e mais forte. Chaves: sobrecarga progressiva, volume adequado, boa técnica, sono e proteína. 💪`; },
  sobrecarga(){ return `📚 <b>Sobrecarga progressiva</b> é aumentar aos poucos o desafio do treino ao longo do tempo — mais carga, mais repetições, mais séries ou melhor execução. É o princípio nº 1 pra continuar evoluindo: se o treino nunca fica mais difícil, o corpo para de se adaptar. 📈`; },
  falha_muscular(){ return `📚 <b>Falha muscular</b> é chegar ao ponto de não conseguir mais nenhuma repetição com boa técnica. Treinar perto da falha dá bom estímulo, mas ir até a falha sempre atrapalha a recuperação. Pra maioria, deixar 1-2 repetições "na reserva" é o ideal. 💪`; },
  zona2(){ return `📚 <b>Cardio zona 2</b> é o ritmo leve em que você consegue conversar sem ofegar (~60-70% da FC máxima). Parece fácil, mas é ótimo pra base aeróbica, saúde do coração e queima de gordura. Na corrida, é o trote confortável. ❤️`; },
  condicionamento(){ return `🫁 Pra melhorar o condicionamento: cardio de forma constante (a maior parte leve/"zona 2" + um pouco de intervalado), regularidade (3-5x/semana) e progressão gradual na duração/intensidade. Dormir bem e hidratar também contam. Constância vence intensidade isolada. 🏃`; },
  aquecer(){ return `🔥 Aquecimento (5-10 min): comece leve pra elevar a temperatura (caminhada, polichinelo, bike) e depois faça movimentos parecidos com o treino do dia com pouca ou nenhuma carga. Na musculação, 1-2 séries leves do primeiro exercício já preparam bem. Reduz risco de lesão e melhora o rendimento. 💪`; },
  descanso_series(){
    const g = state.modules.lift?.setup?.goal;
    const map = {hipertrofia:'60-90 segundos', forca:'2-3 minutos', emagrecimento:'30-45 segundos', resistencia:'~30 segundos'};
    const base = g&&map[g] ? `No seu objetivo, o recomendado é <b>${map[g]}</b> entre as séries. ` : '';
    return `⏱️ ${base}Regra geral: força pede descanso maior (2-3 min); hipertrofia fica no meio (60-90s); resistência/emagrecimento usa descansos curtos (30-45s) pra manter a intensidade. 💪`;
  },
  sono(){ return `😴 A recomendação geral pra adultos é <b>7 a 9 horas</b> por noite. É dormindo que o músculo se recupera e cresce, os hormônios se regulam e a energia volta. Dormir mal atrapalha o rendimento tanto quanto um treino ruim. Priorize o sono! 🌙`; },
  gripado(){ return `🤒 Regra geral do "pescoço pra cima": sintomas leves e acima do pescoço (nariz levemente entupido), um treino leve costuma ser ok. Com <b>febre, dores no corpo, tosse ou muito cansaço</b>, o certo é <b>descansar</b> — treinar assim atrapalha a recuperação. Hidrate-se e, na dúvida ou se persistir, procure um médico. Não sou médico, é orientação geral. 💙`; },
  dor_muscular(){ return `💥 A dor muscular tardia (1-2 dias depois) é normal, ainda mais no começo — você pode treinar outro grupo tranquilo. Se o mesmo grupo estiver bem dolorido, dê mais 1 dia ou faça algo leve. Já dor <b>aguda, em articulação ou "estranha"</b> não é normal: pare e descanse. Movimento leve e hidratação ajudam a passar. 💪`; },
  semana_plano(){
    const mod = state.modules[state.active];
    if(!mod||!mod.plan) return 'Você ainda não tem um plano ativo. Crie um que eu acompanho sua semana! 🎯';
    const wk = Math.floor((Date.now()-(mod.createdAt||Date.now()))/(7*86400000))+1;
    const total = mod.plan.totalWeeks||12;
    return `📅 Você está na <b>semana ${Math.min(wk,total)}</b> de <b>${total}</b> do plano. ${wk>=total?'Reta final — mandou muito bem chegando até aqui! 🎉':'Continue firme, cada semana te deixa mais forte. 💪'}`;
  },
  termina_plano(){
    const mod = state.modules[state.active];
    if(!mod||!mod.plan) return 'Crie um plano que eu te digo quando ele termina! 🎯';
    const total = mod.plan.totalWeeks||12;
    const fim = new Date((mod.createdAt||Date.now()) + total*7*86400000);
    const faltamSem = Math.max(0, Math.ceil((fim-Date.now())/(7*86400000)));
    return `🏁 Seu plano tem <b>${total} semanas</b> e termina por volta de <b>${fim.toLocaleDateString('pt-BR')}</b> (~${faltamSem} semana${faltamSem!==1?'s':''} restante${faltamSem!==1?'s':''}). No fim dá pra renovar com novos estímulos! 💪`;
  },
  treinos_faltam(){
    const mod = state.modules[state.active];
    if(!mod||!mod.plan) return 'Crie um plano que eu conto os treinos! 🎯';
    const total = (mod.plan.workouts||[]).length*(mod.plan.totalWeeks||12);
    const feitos = (mod.history||[]).length;
    return `📋 Você já fez <b>${feitos}</b> e faltam <b>${Math.max(0,total-feitos)}</b> de <b>${total}</b> treinos do plano. ${total-feitos<=0?'Plano completo — que orgulho! 🎉':'Um de cada vez, você chega lá. 💪'}`;
  },
  dias_descanso(){
    const mod = state.modules[state.active];
    if(!mod||!mod.plan) return 'Crie um plano que eu te mostro os dias de descanso! 🎯';
    const treino = (mod.plan.workouts||[]).length;
    return `📅 Seu plano tem <b>${treino}</b> dias de treino e <b>${7-treino}</b> de descanso por semana. Descanso não é preguiça — é quando o corpo se reconstrói mais forte. 😴`;
  },
  analise_semana(){
    const now = Date.now();
    const seg = new Date(); seg.setHours(0,0,0,0); seg.setDate(seg.getDate()-((seg.getDay()||7)-1));
    const t0 = seg.getTime();
    const H = maAllHistory().filter(x=>x.at>=t0 && x.at<=now);
    if(!H.length) return `📈 <b>Sua análise da semana</b><br><br>Você ainda não registrou treinos nesta semana, ${maName()}. Que tal começar hoje? Um treino já muda o rumo da semana. 💪`;
    const treinos = H.length;
    const minutos = Math.round(H.reduce((s,x)=>s+(x.duration||0),0));
    const planejados = (((state.modules.lift?.plan?.workouts?.length)||0) + ((state.modules.run?.plan?.workouts?.length)||0)) || treinos;
    const missL = missedWorkoutsThisWeek(state.modules.lift)||[], missR = missedWorkoutsThisWeek(state.modules.run)||[];
    const faltas = missL.length + missR.length;
    const prs = Object.values(state.prs||{}).filter(p=>p&&p.at>=t0).length;
    const partCount = {};
    H.forEach(x=>(x.parts||[]).forEach(p=>{ partCount[p]=(partCount[p]||0)+1; }));
    const foco = Object.entries(partCount).sort((a,b)=>b[1]-a[1]).slice(0,2).map(e=>e[0]);
    const aderencia = Math.min(1, treinos/Math.max(1,planejados));
    let nota = 5 + aderencia*4 + (faltas===0?1:0) + (prs>0?0.5:0);
    nota = Math.max(3, Math.min(10, nota));
    const notaStr = (Math.round(nota*10)/10).toString().replace('.',',');
    let sugestao;
    if(faltas>0) sugestao = 'Na próxima semana, tente não deixar treino pra trás — a constância é o que mais move o ponteiro.';
    else if(prs===0) sugestao = 'Você manteve firme! Se as séries saem fáceis no topo das repetições, experimente subir um pouco a carga.';
    else sugestao = 'Ótimo aumento de carga! Mantenha a técnica impecável e o descanso entre séries dentro do recomendado.';
    const L = ['📈 <b>Sua análise da semana</b>',''];
    L.push(`• Treinos: <b>${treinos}</b> de ${planejados} planejados ${treinos>=planejados?'✅':''}`);
    L.push(`• Tempo treinado: <b>${minutos>=60?(minutos/60).toFixed(1).replace('.',',')+'h':minutos+' min'}</b>`);
    L.push(`• Faltas: <b>${faltas===0?'nenhuma 🎯':faltas}</b>`);
    if(prs>0) L.push(`• Aumento de carga em <b>${prs}</b> exercício${prs>1?'s':''} 💪`);
    if(foco.length) L.push(`• Foco: <b>${foco.join(' e ')}</b>`);
    L.push(`• Nota da semana: <b>${notaStr}/10</b>`);
    L.push('');
    L.push(`💡 ${sugestao}`);
    L.push('');
    L.push(nota>=8?`Semana excelente, ${maName()}! Continue assim. 🔥`:nota>=6?'Boa semana! Dá pra subir mais um degrau. 💪':'Toda semana é um recomeço — bora fazer a próxima melhor. 👊');
    return L.join('<br>');
  },
  insight(){ return (typeof maInsight==='function') ? maInsight() : 'Continue treinando que eu te trago observações! 💪'; }
};
const MA_SUGGESTIONS = [
  {lbl:'📈 Análise da semana', key:'analise_semana'},
  {lbl:'💡 Um insight sobre meus treinos', key:'insight'},
  {lbl:'💪 Como foi meu treino?', key:'treino_hoje'},
  {lbl:'📅 Quantos dias faltei?', key:'faltei'},
  {lbl:'⏭️ Quando é meu próximo treino?', key:'proximo'},
  {lbl:'⚖️ Quanto peso perdi?', key:'peso_mudanca'},
  {lbl:'🔀 Posso trocar um exercício?', key:'trocar_ex'},
  {lbl:'📈 Minha evolução', key:'evolucao'},
  {lbl:'🏆 Próxima conquista', key:'proximo_trofeu'},
  {lbl:'🏁 Quando é minha prova?', key:'prova'},
  {lbl:'💧 Quanta água beber?', key:'agua'},
  {lbl:'🍗 Quanta proteína por dia?', key:'proteina'},
  {lbl:'🥗 O que comer antes/depois?', key:'comer_treino'},
  {lbl:'📈 Quando aumentar a carga?', key:'aumentar_carga'},
  {lbl:'📚 O que é hipertrofia?', key:'o_que_hipertrofia'},
  {lbl:'📚 Sobrecarga progressiva?', key:'sobrecarga'},
  {lbl:'😴 Quantas horas dormir?', key:'sono'},
  {lbl:'🤒 Posso treinar gripado?', key:'gripado'},
  {lbl:'💥 Devo treinar com dor muscular?', key:'dor_muscular'},
  {lbl:'📊 Meu IMC', key:'imc'},
  {lbl:'❓ O que mais posso perguntar?', key:'_comandos'},
  {lbl:'❤️ Me motive', key:'motiva'}
];
let maUltimaDistPergunta = 10;
function maInterpret(txt){
  const t = txt.toLowerCase().trim();
  const has = (...ws)=>ws.some(w=>t.includes(w));
  // saudações e conversa social (respostas prontas, sem depender de dados)
  const exact = t.replace(/[!?.,]/g,'').trim();
  if(['oi','ola','olá','eae','e ai','e aí','opa','fala','salve','hey','oii','oie'].includes(exact)) return '_oi';
  if(has('bom dia')) return '_bomdia';
  if(has('boa tarde')) return '_boatarde';
  if(has('boa noite')) return '_boanoite';
  if(has('tchau','até mais','ate mais','falou','xau','adeus','até logo','ate logo','vlw','valeu','obrigad','brigad','obg')) return '_tchau';
  if(has('quem é você','quem e voce','o que você é','o que voce e','vc é','você é um','voce e um','é uma ia','e uma ia','é robô','e robo')) return '_quemsou';
  if(has('como vai','tudo bem','como você está','como voce esta','de boa')) return '_comovai';
  if(has('o que posso perguntar','oque posso perguntar','o que posso escrever','o que posso falar','o que posso dizer','o que mais posso','oque mais posso','o que você faz','o que voce faz','o que sabe fazer','quais comandos','lista de comandos','comandos','o que você sabe','o que voce sabe','me ajuda com o que','no que pode me ajudar','como funciona voce','como você funciona','pode fazer o que')) return '_comandos';
  // ===== dia a dia =====
  if(has('que dia é hoje','que dia e hoje','qual dia é hoje','qual a data','data de hoje','hoje é que dia','que data é hoje','em que dia estamos','qual o dia de hoje')) return '_datahoje';
  if(has('que horas são','que horas sao','qual a hora','me diz a hora','horas agora')) return '_horaagora';
  // ===== como estou indo =====
  if(has('tenho corrido bem','estou correndo bem','como está minha corrida','como esta minha corrida','minha corrida está boa','como vão minhas corridas','como vao minhas corridas','minhas corridas','evolui na corrida','melhorei na corrida')) return '_correndobem';
  if(has('tenho treinado bem','estou treinando bem','como está meu treino','como esta meu treino','meu treino está bom','como vão meus treinos','como vao meus treinos','estou indo bem na musculação','estou indo bem na musculacao')) return '_treinandobem';
  if(has('como estou','como estou indo','como estou me saindo','como está meu desempenho','como esta meu desempenho','estou indo bem','estou evoluindo','como está minha evolução','como esta minha evolucao','me avalia','avalia meu desempenho','como está meu progresso','como esta meu progresso')) return '_comoestou';
  // ===== previsão por distância =====
  {
    const mDist = t.match(/(\d{1,2}(?:[.,]\d)?)\s*(?:km|k\b|quil[ôo]metros?)/);
    const querTempo = /(quanto tempo|em quanto tempo|qual (?:seria )?(?:meu|o) tempo|consigo (?:fazer|correr)|conseguiria|previs[ãa]o|estimativa|quanto (?:eu )?far[ei]a|quanto faria)/.test(t);
    if(mDist && querTempo){
      const v = parseFloat(String(mDist[1]).replace(',','.'));
      if(v>=1 && v<=100){ maUltimaDistPergunta = v; return '_previsaoDist'; }
    }
    if(querTempo && /(prova|corrida|maratona|meia)/.test(t)){
      const alvo = { '5km':5, '10km':10, '21km':21.1, '42km':42.2 }[((state.modules.run||{}).setup||{}).goal];
      if(alvo){ maUltimaDistPergunta = alvo; return '_previsaoDist'; }
    }
  }
  // ===== sono =====
  if(has('dormi mal','dormindo mal','sono ruim','pouco sono','falta de sono','não dormi bem','nao dormi bem','sono afeta','dormir afeta','o sono influencia','dormir pouco','noites mal dormidas','insônia','insonia') && has('treino','treinar','afeta','influencia','atrapalha','prejudica','rendimento')) return '_sonotreino';
  if(has('trabalho sentado','fico sentado','sentado o dia todo','muito tempo sentado','trabalhar sentado','passo o dia sentado','escritório','escritorio','sedentário','sedentario','trabalho em pé','trabalho em pe','fico em pé','o dia todo em pé','carrego peso','carregando peso','trabalho dirigindo','dirijo o dia','sou motorista','minha rotina de trabalho','rotina de trabalho')) return '_trabalhosentado';
  if(has('o sono é importante','sono e importante','importância do sono','importancia do sono','quantas horas devo dormir','quanto devo dormir')) return '_sonotreino';
  if(has('ajuda','o que você faz','o que voce faz','o que sabe','pode fazer','como funciona','me ajuda')) return '_ajuda';
  if(has('análise da semana','analise da semana','análise semanal','analise semanal','resumo da semana','como foi minha semana','relatório','relatorio','minha semana')) return 'analise_semana';
  if(has('insight','padrão','padrao','padrões','padroes','observação','observacao','o que você percebe','o que voce percebe','me surpreenda')) return 'insight';
  // --- v10: novas intenções (conceitos / saúde / planejamento) — específicas primeiro ---
  if(has('faltei','faltas','dias faltei','treinos pendentes','faltando treino','quantos dias falt')) return 'faltei';
  if(has('quanto peso perdi','peso perdi','perdi peso','peso ganhei','ganhei peso','quanto emagreci','quanto engordei','mudança de peso','mudanca de peso','quanto peso ganhei')) return 'peso_mudanca';
  if(has('trocar exerc','trocar um exerc','posso trocar','substituir exerc','trocar o exerc')) return 'trocar_ex';
  if(has('próximo trof','proximo trof','perto de desbloquear','falta pra conquista','falta para conquista','qual troféu falta','qual trofeu falta','próxima conquista','proxima conquista','troféu mais perto','trofeu mais perto','perto de um trof','mais perto de desbloquear')) return 'proximo_trofeu';
  if(has('água','agua','hidrat','beber')) return 'agua';
  if(has('proteína','proteina')){ if(has('importância','importancia','pra que serve','por que','importante')) return 'importancia_proteina'; return 'proteina'; }
  if(has('antes do treino','depois do treino','o que comer','comer antes','comer depois','pré-treino','pre treino','pós-treino','pos treino','o que como')) return 'comer_treino';
  if(has('déficit','deficit calór','deficit calor')) return 'deficit';
  if(has('aumentar a carga','aumentar carga','quando aumentar','subir a carga','subir carga','progredir')) return 'aumentar_carga';
  if(has('hipertrofia')) return 'o_que_hipertrofia';
  if(has('sobrecarga')) return 'sobrecarga';
  if(has('falha muscular','até a falha','ate a falha')) return 'falha_muscular';
  if(has('zona 2','zona dois','cardio zona')) return 'zona2';
  if(has('condicionamento','fôlego','folego','aeróbic','aerobic')) return 'condicionamento';
  if(has('aquec','warm-up','warmup')) return 'aquecer';
  if(has('descanso entre','intervalo entre','intervalo de descanso','quanto descansar','descanso das séries','descanso entre séries')) return 'descanso_series';
  if(has('dormir','sono','horas de sono')) return 'sono';
  if(has('gripado','gripe','resfriado','doente','febre','treinar doente')) return 'gripado';
  if(has('dor muscular','dor no músculo','dor no musculo','dor pós-treino','dor pos treino','dores musculares','dolorido')) return 'dor_muscular';
  if(has('semana do plano','que semana','qual semana','em que semana')) return 'semana_plano';
  if(has('termina meu plano','quando termina','acaba o plano','fim do plano','termina o plano')) return 'termina_plano';
  if(has('treinos faltam','faltam treinos','quantos treinos faltam','quantos faltam')) return 'treinos_faltam';
  if(has('dias de descanso','descanso na semana','dias de folga','quantos dias de descanso')) return 'dias_descanso';
  // perguntas com dados
  if(has('perder','emagrec','quantos kg','quanto kg','posso perder')) return 'perder_peso';
  if(has('evolu','melhor','pior','progress','constan')) return 'evolucao';
  if(has('treino hoje','foi meu treino','como fui','treinei hoje')) return 'treino_hoje';
  if(has('corrida','correr','pace','ritmo')) return 'corrida';
  if(has('trofé','trofe','conquista','medalh')) return 'trofeus';
  if(has('prova','contagem regressiva','quando corro','quando é a corrida','quando e a corrida','data da corrida','quantos dias faltam')) return 'prova';
  if(has('meta','objetivo')) return 'meta';
  if(has('músculo','musculo','menos')) return 'musculo_menos';
  if(has('pausa','sem treinar','parado','sequ','streak')) return 'pausa';
  if(has('recorde','pr ','carga máxima','peso máximo')) return 'recorde';
  if(has('quanto tempo','há quanto','uso o app','tempo de uso')) return 'tempo_uso';
  if(has('mais corrida','mais muscula','corrida ou')) return 'corrida_ou_musculacao';
  if(has('caloria','kcal','gastei','queim')) return 'calorias';
  if(has('peso','magro','gordura','quilos')) return 'maior_peso';
  if(has('motiv','frase','ânimo','animo','desanim')) return 'motiva';
  if(has('imc','massa corporal')) return 'imc';
  if(has('essa semana','esta semana','treinos da semana','quantos treinos')) return 'semana';
  if(has('próximo treino','proximo treino','qual o treino','treino de amanhã','o que treino')) return 'proximo';
  if(has('aniversário','aniversario','fazer anos','meu niver')) return 'aniversario';
  return null;
}
let maPending = null; // ação aguardando confirmação sim/não
let maRefreshUI = false; // marca que os planos mudaram e a tela precisa ser redesenhada
function maApplyEquip(equip){
  const mod = state.modules.lift;
  if(!mod){ return {done:true, msg:'Você ainda não tem plano de musculação. 😊'}; }
  mod.setup.equip = equip;
  regenAllPlans();
  saveData();
  const lbl = {academia:'academia completa', halteres:'só halteres', casa:'peso do corpo (em casa)', basico:'básico'}[equip];
  return {done:true, msg:`✅ Pronto! Seus treinos agora usam <b>${lbl}</b>. Todos os exercícios foram regenerados — dá uma olhada na aba Sessões. 💪`};
}
function maApplySchedule(modName, dias){
  const mod = state.modules[modName];
  if(!mod || !mod.plan){ return {done:true, msg:'Plano não encontrado. 😅'}; }
  const dayNames = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  mod.setup.days = dias.length;
  mod.setup.selectedDays = dias;
  // regenera o plano inteiro com os novos dias (preserva histórico e data de criação)
  const prevHist = mod.history || [];
  const prevCreated = mod.createdAt;
  mod.plan = generatePlan(modName, mod.setup);
  mod.history = prevHist;
  mod.createdAt = prevCreated;
  regenAllPlans();
  saveData();
  const nomes = dias.map(d=>dayNames[d-1]).join(', ');
  return {done:true, msg:`✅ Cronograma atualizado! Seus treinos de <b>${modName==='run'?'corrida':'musculação'}</b> agora são em: <b>${nomes}</b>. O plano foi remontado e seu histórico está intacto. 📅`};
}
// ===== META ASSISTENTE: COMANDOS (executa ações por conversa) =====
// Interpreta frases de AÇÃO e devolve {done:true, msg} se executou, ou null se não é comando.
// ===== MEMÓRIA DE CONTEXTO DA CONVERSA =====
// Guarda o que o aluno contou (sono, tempo, ânimo...) por algumas horas e usa nas respostas.
function maCtxSet(chave, valor, horas){
  try{
    state.ui = state.ui || {}; state.ui.maCtx = state.ui.maCtx || {};
    state.ui.maCtx[chave] = { v:valor, exp: Date.now() + (horas||10)*3600000 };
    saveData();
  }catch(e){}
}
function maCtxGet(chave){
  try{
    const c = state.ui && state.ui.maCtx && state.ui.maCtx[chave];
    if(!c) return null;
    if(Date.now() > c.exp){ delete state.ui.maCtx[chave]; return null; }
    return c.v;
  }catch(e){ return null; }
}
// Detecta fatos ditos de passagem. Devolve confirmações curtas do que anotou.
function maDetectContext(t){
  const anotou = [];
  let m = t.match(/dormi\s*(?:s[óo]\s*)?(\d{1,2})\s*(?:h|horas?)/);
  if(m){ const h=+m[1]; if(h>=0&&h<=14){ maCtxSet('sono', h, 14); anotou.push(h<=5?`Anotei: <b>${h}h de sono</b> — vou levar isso em conta hoje.`:`Anotei: <b>${h}h de sono</b>.`); } }
  else if(/(dormi mal|n[ãa]o dormi|noite mal dormida|mal dormi|virei a noite|ins[ôo]nia)/.test(t)){ maCtxSet('sono', 4, 14); anotou.push('Anotei que você <b>dormiu mal</b> — considero isso nas orientações de hoje.'); }
  m = t.match(/(?:s[óo]\s*)?tenho\s*(\d{1,3})\s*min/);
  if(m){ const min=+m[1]; if(min>=5&&min<=240){ maCtxSet('tempo', min, 8); anotou.push(`Anotei: <b>${min} minutos</b> disponíveis hoje.`); } }
  else if(/(pouco tempo|estou sem tempo|t[ôo] sem tempo)/.test(t)){ maCtxSet('tempo', 30, 8); anotou.push('Anotei que hoje o <b>tempo é curto</b> — nesse caso, faça os primeiros exercícios do treino (são os principais) e encerre sem culpa.'); }
  if(/(desanimad|sem vontade|sem motiva|desmotivad|pregui[çc]a)/.test(t)){ maCtxSet('animo', 'baixo', 10); }
  if(/(n[ãa]o almocei|n[ãa]o comi|n[ãa]o jantei|est[ôo]mago vazio|em jejum)/.test(t)){ maCtxSet('comeu', false, 6); anotou.push('Anotei que você <b>ainda não comeu</b> — se for treinar agora, prefira algo leve antes (fruta, pão) e espere um treino mais curto render melhor que um longo.'); }
  if(/(academia (?:est[áa] )?(?:lotada|cheia)|muita gente na academia)/.test(t)){ maCtxSet('lotada', true, 6); anotou.push('Anotei que a <b>academia está cheia</b> — considero isso nas trocas de exercício.'); }
  if(/(vou viajar|estou viajando)/.test(t)){ maCtxSet('viagem', true, 72); }
  if(/(ventou|muito vento|vento forte)/.test(t)){ maCtxSet('vento', true, 10); }
  return anotou;
}
// Observação contextual pra colar no fim de respostas sobre treinar/intensidade hoje
function maCtxNota(){
  const sono = maCtxGet('sono'), tempo = maCtxGet('tempo'), comeu = maCtxGet('comeu'), animo = maCtxGet('animo'), lotada = maCtxGet('lotada');
  const notas = [];
  if(sono!==null && sono<=5) notas.push(`Você comentou que dormiu <b>${sono}h</b> — com sono curto o corpo aceita bem o treino, mas costuma render menos em carga máxima. Hoje eu priorizaria execução em vez de recorde.`);
  if(tempo!==null && tempo<=35) notas.push(`Como hoje você tem <b>${tempo} min</b>, foque nos compostos primeiro — eles entregam mais resultado por minuto.`);
  if(comeu===false) notas.push(`Você disse que ainda não comeu: dá pra treinar, mas o rendimento cai. Uma fruta ou um pão 30 min antes já ajuda bastante.`);
  if(lotada) notas.push(`Com a academia cheia, use a <b>troca de exercício</b> (🔄) pra pegar o que estiver livre — o estímulo importa mais que o aparelho exato.`);
  if(animo==='baixo') notas.push(`E sobre o desânimo que você comentou: começar já é a parte mais difícil. Se render pouco hoje, tudo bem — presença vale mais que perfeição. 💚`);
  return notas.length ? notas.slice(0,2).join('<br><br>') : null;  // no máximo 2: mais que isso vira sermão
}
// ===== MELHOR HORÁRIO PRA TREINAR (usa dados que o app JÁ tem: hora + sensação) =====
function bestTrainingTime(){
  try{
    const lift = (((state.modules.lift||{}).history)||[]).filter(x=>x.feel);
    const run  = (((state.modules.run ||{}).history)||[]).filter(x=>x.rating);
    const itens = [
      ...lift.map(x=>({at:x.at, bom:['otimo','bem'].includes(x.feel)})),
      ...run.map(x=>({at:x.at, bom:(x.rating||3)>=4}))
    ];
    if(itens.length < 8) return null;
    const faixa = h => h<5 ? 'madrugada' : h<12 ? 'manhã' : h<18 ? 'tarde' : 'noite';
    const g = {};
    itens.forEach(i=>{ const f=faixa(new Date(i.at).getHours()); (g[f]=g[f]||{n:0,b:0}); g[f].n++; if(i.bom) g[f].b++; });
    const validos = Object.entries(g).filter(([,v])=>v.n>=3).map(([k,v])=>({faixa:k, n:v.n, pct:Math.round(v.b/v.n*100)}));
    if(validos.length < 2) return null;
    validos.sort((a,b)=>b.pct-a.pct);
    const melhor = validos[0], pior = validos[validos.length-1];
    if(melhor.pct - pior.pct < 20) return null;   // diferença pequena: não afirma nada
    return { melhor, pior, total:itens.length };
  }catch(e){ return null; }
}
// ===== PERFIL DE RECUPERAÇÃO (sem pedir nada ao aluno) =====
// Cruza o DESCANSO entre treinos com a sensação registrada — descobre quanto descanso
// o corpo DESTA pessoa precisa. Só afirma com base suficiente.
// Dias da semana em que costuma faltar (usa o plano + o histórico)
function weekdayAdherenceInsight(){
  try{
    const mod = state.modules[state.active];
    if(!mod || !mod.plan) return null;
    const planDays = (mod.plan.workouts||[]).map(w=>w.dayIdx);
    if(planDays.length < 2) return null;
    const hist = (mod.history||[]);
    if(hist.length < 8) return null;
    const ini = (typeof planStartTs==='function' ? planStartTs(mod) : 0) || hist[0].at;
    const d0 = t => { const d=new Date(t); d.setHours(0,0,0,0); return d.getTime(); };
    const treinou = new Set(hist.map(x=>d0(x.at)));
    const cont = {}; planDays.forEach(d=>cont[d]={prev:0, fez:0});
    for(let t=d0(ini); t<=d0(Date.now()); t+=86400000){
      const dt = new Date(t); const idx = dt.getDay()===0 ? 7 : dt.getDay();
      if(cont[idx]){ cont[idx].prev++; if(treinou.has(t)) cont[idx].fez++; }
    }
    const nomes = ['segunda','terça','quarta','quinta','sexta','sábado','domingo'];
    const validos = Object.entries(cont).filter(([,v])=>v.prev>=3)
      .map(([k,v])=>({dia:nomes[k-1], pct:Math.round(v.fez/v.prev*100), prev:v.prev}));
    if(validos.length < 2) return null;
    validos.sort((a,b)=>a.pct-b.pct);
    const pior = validos[0], melhor = validos[validos.length-1];
    if(melhor.pct - pior.pct < 34) return null;
    if(pior.pct > 60) return null;   // ninguém está faltando de verdade
    return { pior, melhor };
  }catch(e){ return null; }
}
// Grupo muscular que sempre acaba pesado
function hardGroupInsight(){
  try{
    const hist = (((state.modules.lift||{}).history)||[]).filter(x=>x.feel && x.parts && x.parts.length);
    if(hist.length < 8) return null;
    const g = {};
    hist.forEach(x=>x.parts.forEach(p=>{ (g[p]=g[p]||{n:0,pesado:0}); g[p].n++; if(['cansado','exausto'].includes(x.feel)) g[p].pesado++; }));
    const validos = Object.entries(g).filter(([,v])=>v.n>=3).map(([k,v])=>({parte:k, pct:Math.round(v.pesado/v.n*100), n:v.n}));
    if(validos.length < 2) return null;
    validos.sort((a,b)=>b.pct-a.pct);
    const top = validos[0];
    if(top.pct < 65) return null;
    return top;
  }catch(e){ return null; }
}
function recoveryPatternInsight(){
  try{
    const todos = [
      ...(((state.modules.lift||{}).history)||[]).filter(x=>x.feel).map(x=>({at:x.at, bom:['otimo','bem'].includes(x.feel)})),
      ...(((state.modules.run ||{}).history)||[]).filter(x=>x.rating).map(x=>({at:x.at, bom:(x.rating||3)>=4}))
    ].sort((a,b)=>a.at-b.at);
    if(todos.length < 10) return null;
    const d0 = t => { const d=new Date(t); d.setHours(0,0,0,0); return d.getTime(); };
    const grupos = { seguido:{n:0,b:0}, um:{n:0,b:0}, dois:{n:0,b:0} };
    for(let i=1;i<todos.length;i++){
      const gap = Math.round((d0(todos[i].at) - d0(todos[i-1].at))/86400000);
      if(gap<=0) continue;                       // mesmo dia: não conta como descanso
      const k = gap===1 ? 'seguido' : gap===2 ? 'um' : 'dois';
      grupos[k].n++; if(todos[i].bom) grupos[k].b++;
    }
    const nome = { seguido:'sem dia de descanso', um:'com 1 dia de descanso', dois:'com 2+ dias de descanso' };
    const validos = Object.entries(grupos).filter(([,v])=>v.n>=3)
      .map(([k,v])=>({k, nome:nome[k], n:v.n, pct:Math.round(v.b/v.n*100)}));
    if(validos.length < 2) return null;
    validos.sort((a,b)=>b.pct-a.pct);
    const melhor = validos[0], pior = validos[validos.length-1];
    if(melhor.pct - pior.pct < 20) return null;  // diferença pequena: não afirma nada
    return { melhor, pior, base: todos.length };
  }catch(e){ return null; }
}
// Registra o que o assistente não soube responder — vira lista de sugestões pro admin
// Vale a pena registrar? (evita encher o banco com "oi", "kkk", "teste")
function pareceMensagemUtil(t){
  const txt = String(t||'').trim();
  if(txt.length < 12) return false;
  const palavras = txt.split(/\s+/).filter(Boolean);
  if(palavras.length < 3) return false;
  if(/^(oi|ol[áa]|opa|eae|e a[íi]|bom dia|boa tarde|boa noite|tchau|valeu|obrigad|kk+|rs+|haha|teste|test|abc|asd)\b/i.test(txt)) return false;
  if(/^[^a-zà-ú]+$/i.test(txt)) return false;                       // só números/símbolos
  const pergunta = /\?\s*$/.test(txt) ||
    /^(como|qual|quais|por ?que|porque|onde|quando|posso|consigo|devo|d[áa] pra|tem como|[ée] poss[íi]vel|quanto|quantos|quantas|o que|oque|pra que|serve)/i.test(txt);
  const sugestao = /(gostaria|seria (legal|bom|[óo]timo)|sugiro|sugest[ãa]o|podia|deveria|falta(r)? |adicionar|colocar)/i.test(txt);
  const bug = /(bug|erro|travou|travando|n[ãa]o funciona|n[ãa]o abre|n[ãa]o salva|sumiu|quebrou|problema)/i.test(txt);
  return pergunta || sugestao || bug;
}
function classificaMensagem(t){
  if(/(bug|erro|travou|travando|n[ãa]o funciona|n[ãa]o abre|n[ãa]o salva|sumiu|quebrou|falha)/i.test(t)) return 'bug';
  if(/(gostaria|seria (legal|bom|[óo]timo)|sugiro|sugest[ãa]o|podia|deveria|adicionar|colocar)/i.test(t)) return 'sugestao';
  return 'auto';
}
// Grava agrupando por texto: conta quantas vezes apareceu e em quais versões
async function logUnknownQuestion(txt, tipo){
  try{
    if(!db) return false;
    const t = String(txt||'').trim().slice(0,600);
    if(!t) return false;
    if(!tipo && !pareceMensagemUtil(t)) return false;         // filtro só vale pra captura automática
    const tp = tipo || classificaMensagem(t);
    const chave = t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,'-').slice(0,90) || ('msg-'+Date.now());
    const inc = (firebase.firestore.FieldValue && firebase.firestore.FieldValue.increment) ? firebase.firestore.FieldValue.increment(1) : undefined;
    const arrUnion = (firebase.firestore.FieldValue && firebase.firestore.FieldValue.arrayUnion) ? firebase.firestore.FieldValue.arrayUnion : null;
    const dados = {
      texto: t, tipo: tp,
      modulo: state.active || '',
      ultimoEmail: (state.user && state.user.email) || 'anonimo',
      ultimoNome: (state.user && state.user.name) || '',
      ultimaVersao: APP_VERSION,
      ultimo: Date.now(),
      visto: false
    };
    if(inc) dados.n = inc; else dados.n = 1;
    if(arrUnion) dados.versoes = arrUnion(APP_VERSION);
    const ref = db.collection('perguntasNaoRespondidas').doc(chave);
    await ref.set(dados, {merge:true});
    try{
      const atual = await ref.get();
      if(atual.exists && !atual.data().primeiro) await ref.set({ primeiro: Date.now() }, {merge:true});
      else if(!atual.exists) await ref.set({ primeiro: Date.now() }, {merge:true});
    }catch(e){}
    return true;
  }catch(e){ console.log('Não foi possível registrar:', e); return false; }
}
function maTryCommand(txt){
  const t = txt.toLowerCase().trim();
  const num = re => { const mm=t.match(re); return mm?parseFloat(mm[1].replace(',','.')):null; };
  let m;

  // ---- COMO FAZER (abre vídeo do exercício) ----
  m = t.match(/(?:como (?:fazer|faço|se faz|executa)|me mostra|v[íi]deo d[eo])\s+(?:o |a |um |uma )?(.+)/);
  if(m){
    const busca = m[1].replace(/[?!.]/g,'').trim();
    let achou = null, melhor = 0;
    EX_BANK.forEach(c=>c.items.forEach(ex=>{
      const nome = ex.name.toLowerCase();
      // pontuação simples: quantas palavras da busca aparecem no nome
      const palavras = busca.split(/\s+/).filter(p=>p.length>2);
      const score = palavras.filter(p=>nome.includes(p)).length;
      if(score>melhor){ melhor=score; achou=ex; }
    }));
    if(achou && melhor>0){
      setTimeout(()=>playExerciseFromMA(achou.name), 400);
      return {done:true, msg:`▶️ Abrindo o vídeo de <b>${achou.name}</b> (${achou.sub}) aqui no app. Preste atenção na técnica antes de aumentar a carga! 💪`};
    }
    return {done:true, msg:`Não achei esse exercício na biblioteca 🤔. Tenta o nome como aparece lá, ex: "como fazer supino reto" ou "como fazer agachamento".`};
  }

  // ---- MUDAR EQUIPAMENTO ----
  if(/(n[ãa]o (?:estou|to|tô) na academia|sem academia|(?:vou |quero )?treinar em casa|estou em casa|sem equipamento|academia fechada|n[ãa]o vou (?:na|pra) academia)/.test(t)){
    maPending = {type:'equip', value:'casa'};
    return {done:true, msg:'Sem problema! Posso adaptar seus treinos pra <b>peso do corpo (em casa)</b>, sem nenhum equipamento. Quer que eu faça isso agora? 🏠'};
  }
  if(/(voltei (?:pra|para) academia|estou na academia|to na academia|tô na academia|academia de novo|treinar na academia)/.test(t)){
    maPending = {type:'equip', value:'academia'};
    return {done:true, msg:'Boa! Quer que eu volte seus treinos pro modo <b>academia completa</b> (máquinas, cabos, barras)? 🏋️'};
  }
  if(/(só (?:tenho|com) halteres|apenas halteres|com halteres em casa)/.test(t)){
    maPending = {type:'equip', value:'halteres'};
    return {done:true, msg:'Entendi! Quer que eu monte seus treinos usando <b>só halteres</b>? 🎒'};
  }

  // ---- MUDAR CRONOGRAMA ----
  // "quero treinar corrida segunda, quarta e sexta" / "musculação terça e quinta"
  m = t.match(/(?:quero |vou |prefiro )?(?:treinar|fazer|correr)\s*(muscula[çc][ãa]o|corrida|for[çc]a|pesos)?\D*?((?:segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo)(?:[\s,e]+(?:segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo))*)/);
  if(m && /segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo/.test(t)){
    const modName = m[1] && /corrida|correr/.test(m[1]) ? 'run' : (m[1] && /muscula|for[çc]a|pesos/.test(m[1]) ? 'lift' : (/corrida|correr/.test(t)?'run':'lift'));
    const dayMap = {segunda:1,'terça':2,terca:2,quarta:3,quinta:4,sexta:5,'sábado':6,sabado:6,domingo:7};
    const dias = [];
    Object.keys(dayMap).forEach(d=>{ if(t.includes(d) && !dias.includes(dayMap[d])) dias.push(dayMap[d]); });
    dias.sort((a,b)=>a-b);
    if(!dias.length) return null;
    if(!state.modules[modName]) return {done:true, msg:`Você ainda não tem um plano de ${modName==='run'?'corrida':'musculação'} ativo. Crie um primeiro! 😊`};
    maPending = {type:'schedule', mod:modName, days:dias};
    const nomes = dias.map(d=>['segunda','terça','quarta','quinta','sexta','sábado','domingo'][d-1]).join(', ');
    return {done:true, msg:`Quer que eu reorganize seus treinos de <b>${modName==='run'?'corrida':'musculação'}</b> pra <b>${nomes}</b> (${dias.length}× por semana)? 📅`};
  }

  // ---- DATA DA PROVA / CORRIDA FUTURA ----
  // remover uma prova já cadastrada
  if(/(n[ãa]o tenho (?:mais )?(?:prova|corrida)|cancela(?:r)? (?:a |minha )?(?:prova|corrida)|apaga(?:r)? (?:a )?(?:data d[ao] )?(?:prova|corrida)|remover? (?:a )?(?:data d[ao] )?(?:prova|corrida)|sem prova(?: nenhuma)?)/.test(t)){
    const mod = state.modules.run;
    if(mod && mod.setup && mod.setup.raceDate){ mod.setup.raceDate = null; mod.setup.raceTime = null; saveData(); return {done:true, msg:'🗑️ Removi a data da sua prova. Quando marcar outra, é só me avisar — ex: "minha prova é dia 12/10". 🏁'}; }
    return {done:true, msg:'Você não tinha nenhuma prova cadastrada 😊. Se quiser marcar uma, me diga a data assim: "minha prova é dia 15/08". 🏁'};
  }
  // cadastrar a data da prova (só tenta se falar de prova/corrida E tiver algum número)
  if(/(prova|corrida|maratona|meia\s*maratona|competi[çc][ãa]o|percurso|\b5k\b|\b10k\b|\b21k\b|\b42k\b)/.test(t) && /\d/.test(t)){
    const d = maParseRaceDate(t);
    if(d) return maSetRaceDate(d, maParseRaceTime(t));
  }

  // ---- SUGESTÃO / RECADO PRO DESENVOLVEDOR ----
  if(maPending && maPending.type==='sugestao'){
    const texto = txt.trim();
    maPending = null;
    if(texto.length < 4) return {done:true, msg:'Pode escrever com calma o que você gostaria de ver no app 😊 — é só me mandar a mensagem.'};
    logUnknownQuestion(texto, 'sugestao');
    return {done:true, work:'Enviando sua sugestão', msg:`✅ <b>Sugestão enviada!</b> Sua mensagem chegou direto pra quem desenvolve o MetaTreino.<br><br>Obrigado de verdade — boa parte do que existe no app hoje veio de ideia de aluno. 💚`};
  }
  if(/(quero (?:mandar|enviar|dar) (?:uma )?(?:sugest[ãa]o|ideia|feedback)|mandar (?:uma )?sugest[ãa]o|falar com (?:o )?(?:suporte|desenvolvedor|administrador|criador)|reportar (?:um )?(?:bug|erro|problema)|tenho uma (?:sugest[ãa]o|ideia))/.test(t)){
    maPending = {type:'sugestao'};
    return {done:true, msg:'Manda ver! ✍️ Escreve na próxima mensagem o que você gostaria de sugerir — pode ser uma função nova, um problema que encontrou ou qualquer ideia.<br><br>Eu envio direto pra quem desenvolve o app.'};
  }
  // sugestão já escrita de uma vez ("seria legal se tivesse...", "gostaria que tivesse...")
  {
    const mSug = txt.match(/(?:gostaria que (?:tivesse|houvesse|desse)|seria (?:legal|bom|[óo]timo) (?:se )?(?:ter|tivesse)|podia(?:m)? (?:ter|colocar|adicionar)|sugiro (?:que )?|minha sugest[ãa]o [ée])\s*(.{4,})/i);
    if(mSug){
      logUnknownQuestion(txt.trim(), 'sugestao');
      return {done:true, work:'Enviando sua sugestão', msg:`✅ <b>Anotei sua sugestão e já enviei</b> pra quem desenvolve o MetaTreino:<br><br><i>"${String(mSug[1]).slice(0,160).replace(/</g,'&lt;')}"</i><br><br>Obrigado! Ideia de aluno é o que mais move esse app. 💚`};
    }
  }

  // ---- SÓ O HORÁRIO DA PROVA (data já cadastrada) ----
  if(/(largada|prova|corrida|competi[çc][ãa]o)/.test(t) && /(\d{1,2}\s*[h:]|[àa]s\s*\d{1,2}|\d{1,2}\s*h\b)/.test(t) && !maParseRaceDate(t)){
    const modR = state.modules.run;
    if(modR && modR.setup && modR.setup.raceDate){
      const hh = maParseRaceTime(t);
      if(hh){
        modR.setup.raceTime = String(hh.h).padStart(2,'0')+':'+String(hh.mi).padStart(2,'0');
        saveData();
        const dd = new Date(modR.setup.raceDate+'T00:00:00');
        return {done:true, msg:`⏰ Anotado! Largada às <b>${modR.setup.raceTime}</b> no dia <b>${dd.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})}</b>.<br><br>Agora eu consigo te mostrar a <b>previsão do tempo da hora da largada</b> — e não a de quando você abrir o app — além do checklist logo antes da prova. 🏁`};
      }
    }
    if(modR && !(modR.setup && modR.setup.raceDate))
      return {done:true, msg:'Antes do horário eu preciso da <b>data</b> da prova 😊. Me diga assim: <b>"minha prova é dia 15/08 às 7h"</b>. 🏁'};
  }

  // ---- RESPOSTA A "ONDE DÓI?" ----
  if(maPending && maPending.type==='pain_where'){
    const areaMap = {'pescoço':'pescoço',pescoco:'pescoço',cervical:'pescoço',nuca:'pescoço',tornozelo:'tornozelo',canela:'tornozelo','pé':'pé','pes':'pé','pés':'pé',cotovelo:'cotovelo',punho:'punho','braço':'braço',braco:'braço',joelho:'joelho',perna:'perna',pernas:'perna',coxa:'coxa',ombro:'ombro',lombar:'lombar',coluna:'coluna',costas:'costas',quadril:'quadril'};
    const achou = Object.keys(areaMap).find(k=>t.includes(k));
    if(/peito|t[óo]rax|cora[çc][ãa]o/.test(t)){ maPending=null; return maChestPain(); }
    if(achou){ maPending=null; return maSetPain(areaMap[achou], t); }
    maPending=null;
    return {done:true, msg:`Não reconheci essa região 🤔. Sei adaptar treinos para: ${PAIN_REGIONS.join(', ')}. Se a dor for em outro lugar (ou for forte), o melhor caminho é procurar um profissional de saúde. 💚`};
  }

  // ---- CONFIRMAÇÃO SIM/NÃO ----
  if(maPending && /^(sim|s|isso|pode|manda|claro|quero|beleza|ok|confirma|aceito|yes|👍)$/i.test(t.replace(/[!.]/g,'').trim())){
    const p = maPending; maPending = null;
    if(p.type==='equip') return maApplyEquip(p.value);
    if(p.type==='schedule') return maApplySchedule(p.mod, p.days);
    if(p.type==='light') return maApplyLight();
    if(p.type==='pain') return maApplyPain(p.area);
    if(p.type==='tpm') return maApplyTPM();
    if(p.type==='cramp') return maApplyCramp();
  }
  if(maPending && /^(n[ãa]o|nao|n|deixa|cancela|melhor n[ãa]o|nem|👎)$/i.test(t.replace(/[!.]/g,'').trim())){
    const p = maPending; maPending = null;
    if(p.type==='pain') return {done:true, msg:`Tudo bem, deixei seu treino como estava 🙂. Mas se a dor incomodar durante o treino, <b>pare</b> — não vale forçar. Quando quiser que eu adapte, é só falar. 💚`};
    if(p.type==='tpm' || p.type==='cramp') return {done:true, msg:'Tudo bem 💗. Deixei seus treinos como estavam. Se durante o dia bater o cansaço, me chama que eu alivio na hora — ou simplesmente descanse, também é válido.'};
    if(p.type==='light') return {done:true, msg:'Beleza, mantive seus treinos normais 💪. Se pesar no meio do caminho, me avisa que eu alivio.'};
    return {done:true, msg:'Tudo bem, deixei como estava! 😊 Se mudar de ideia é só falar.'};
  }

  // ---- PESO ----
  // "estou pesando 108", "meu peso é 90kg", "pesei 85"
  m = t.match(/(?:pesando|peso (?:é|e|atual|de)|pesei|estou com)\s*(\d+[.,]?\d*)\s*(?:kg|quilos?)?/);
  if(m && !/emagrec|engord|perdi|ganhei/.test(t)){
    const kg = parseFloat(m[1].replace(',','.'));
    if(kg>=30 && kg<=300) return maSetWeight(kg);
  }
  // "emagreci 2kg", "perdi 3 kg"
  m = t.match(/(?:emagreci|perdi|baixei)\s*(\d+[.,]?\d*)\s*(?:kg|quilos?)?/);
  if(m){ const d=parseFloat(m[1].replace(',','.')); const cur=latestWeight(); if(cur) return maSetWeight(Math.max(30,cur-d), `Que ótimo! Registrei sua perda de ${d}kg. `); return {done:true,msg:'Pra eu registrar sua perda de peso, primeiro me diga seu peso atual (ex: "estou pesando 90kg"). 😊'}; }
  // "engordei 3kg", "ganhei 2 kg"
  m = t.match(/(?:engordei|ganhei|subi)\s*(\d+[.,]?\d*)\s*(?:kg|quilos?)?/);
  if(m && /kg|quilo|peso|engord/.test(t)){ const d=parseFloat(m[1].replace(',','.')); const cur=latestWeight(); if(cur) return maSetWeight(cur+d, `Registrei +${d}kg. Sem drama — o que importa é a constância! `); return {done:true,msg:'Pra registrar, primeiro me diga seu peso atual (ex: "estou pesando 90kg"). 😊'}; }

  // ---- ATIVIDADE (corrida/caminhada/bike) ----
  // "corri 5km em 40 minutos", "caminhei 3 km em 23 min", "pedalei 7km em 40min"
  m = t.match(/(corri|caminhei|pedalei|andei de bike|andei de bicicleta)\D*(\d+[.,]?\d*)\s*km\D*(\d+)\s*(?:min|minuto)/);
  if(m){
    const verb=m[1]; const km=parseFloat(m[2].replace(',','.')); const min=parseInt(m[3]);
    const type = /corri/.test(verb)?'corrida':/caminhei/.test(verb)?'caminhada':'bike';
    return maLogActivity(type, km, min);
  }
  // sem tempo: "corri 5km", "pedalei 10 km"
  m = t.match(/(corri|caminhei|pedalei)\D*(\d+[.,]?\d*)\s*km/);
  if(m){
    const type = /corri/.test(m[1])?'corrida':/caminhei/.test(m[1])?'caminhada':'bike';
    return {done:true, msg:`Quase lá! Me diga também o tempo pra eu registrar, ex: "${m[1]} ${m[2]}km em 30 minutos". ⏱️`};
  }

  // ---- DOR ----
  // dor no peito/coração: sinal de alerta médico, NUNCA vira ajuste de treino
  if(/dor (?:no |em |de )?(peito|t[óo]rax|cora[çc][ãa]o)/.test(t)) return maChestPain();
  // ordem importa: termos mais longos primeiro (senão "pe" captura antes de "pescoço")
  m = t.match(/dor (?:no |na |nos |nas |em |de )?(pesco[çc]o|cervical|nuca|tornozelo|cotovelo|joelho|quadril|ombro|lombar|coluna|costas|canela|punho|coxas?|pernas?|bra[çc]o|p[ée]s?(?=$|\s|[.,!?]))/);
  if(/dor/.test(t) && (m || /estou com dor|to com dor|tô com dor|sinto dor|machuquei/.test(t))){
    return maSetPain(m?m[1]:null, t);
  }

  // ---- ESTADO EMOCIONAL / CANSAÇO ----
  if(/(estou|tô|to|me sinto|sinto)\s*(muito\s*)?(cansad|exaust|sem energia|acabad|esgotad)/.test(t)) return maTired();
  if(/(estou|tô|to|me sinto|sinto)\s*(triste|pra baixo|desanimad|sem [aâ]nimo|deprim|mal)/.test(t)) return maSad();
  if(/c[óo]lica/.test(t)) return maCramp();
  if(/(estou|tô|to)\s*(de tpm|na tpm|menstruad|naqueles dias|de chico)/.test(t) || t.includes('tpm')) return maTPM();

  // ---- VOLTAR AO NORMAL ----
  if(/(voltar ao normal|to bem agora|tô bem agora|estou bem agora|sem dor agora|passou a dor|voltar treino normal|normalizar)/.test(t)) return maBackToNormal();

  // ---- TREINO EXTRA (grupo fora do plano de hoje) ----
  m = t.match(/(?:quero|posso|gostaria de|d[áa] pra|da pra)\s*(?:treinar|fazer|malhar)\s*(peito|costas|ombros?|b[íi]ceps|tr[íi]ceps|pernas?|gl[úu]teos?|panturrilha|core|abd[oô]men|trap[ée]zio)/);
  if(m){
    const mapa = {peito:'Peito',costas:'Costas',ombro:'Ombro',ombros:'Ombro','bíceps':'Bíceps',biceps:'Bíceps','tríceps':'Tríceps',triceps:'Tríceps',perna:'Pernas',pernas:'Pernas','glúteo':'Glúteos','glúteos':'Glúteos',gluteo:'Glúteos',gluteos:'Glúteos',panturrilha:'Panturrilha',core:'Core','abdômen':'Core',abdomen:'Core','trapézio':'Trapézio',trapezio:'Trapézio'};
    const p = mapa[m[1]];
    if(p) return maExtraWorkout(p);
  }

  // ---- MUSCULAÇÃO manual ----
  // "fiz musculação hoje", "treinei peito", "fiz treino de costas"
  m = t.match(/(?:fiz|treinei|malhei)\s*(?:treino de |muscula[çc][ãa]o de )?(peito|costas|ombro|b[íi]ceps|tr[íi]ceps|perna|pernas|gl[úu]teo|panturrilha|core|abd[oô]men|trap[ée]zio)?/);
  if(m && /fiz|treinei|malhei/.test(t) && (m[1] || /muscula/.test(t))){
    return maLogLift(m[1]||null);
  }
  return null;
}
function maSetWeight(kg, prefix){
  kg = Math.round(kg*10)/10;
  state.weights = state.weights||[];
  state.weights.push({ date:Date.now(), weight:kg });
  if(state.user.profile) state.user.profile.currentWeight = kg;
  saveData(); if(typeof checkWeightTrophies==='function') checkWeightTrophies();
  const imc = (()=>{ try{ const r=calcIMC(); return r?` Seu IMC agora é ${r.value} (${r.cls}).`:''; }catch(e){ return ''; } })();
  return {done:true, msg:`${prefix||''}✅ Peso atualizado para ${kg}kg.${imc} Registrei no seu histórico corporal! 📊`};
}
// cria um "log de atividades" leve no módulo de corrida pra registrar bike/caminhada/corrida
// avulsa sem precisar montar um plano de corrida (não atrapalha o modo musculação).
function ensureActivityLog(){
  if(!state.modules.run) state.modules.run = { setup:{ logOnly:true }, plan:null, history:[], createdAt:Date.now() };
  state.modules.run.history = state.modules.run.history || [];
  return state.modules.run;
}
let actLogType = 'bike';
function openActivityLog(){
  actLogType = 'bike';
  const opt = (v,emo,lbl)=>`<div class="opt${actLogType===v?' on':''}" data-actlog="${v}" onclick="setActLogType('${v}')" style="flex:1;text-align:center">${emo} ${lbl}</div>`;
  $('modal-inner').innerHTML = `
    <h3>➕ Registrar atividade</h3>
    <p style="color:var(--text-dim);font-size:13px;margin:6px 0 12px">Fez um cardio extra (tipo uma bike na academia)? Registre aqui — conta pras conquistas e estatísticas, sem precisar de plano de corrida.</p>
    <div class="row" style="gap:6px;margin-bottom:12px">${opt('corrida','🏃','Corrida')}${opt('caminhada','🚶','Caminhada')}${opt('bike','🚴','Bike')}</div>
    <div class="row" style="gap:10px">
      <div style="flex:1"><label style="font-size:12px;color:var(--text-dim)">Distância (km)</label><input class="input" id="act-km" inputmode="decimal" placeholder="ex: 8" style="margin-top:4px"></div>
      <div style="flex:1"><label style="font-size:12px;color:var(--text-dim)">Tempo (min:seg)</label><input class="input" id="act-min" inputmode="text" placeholder="ex: 30:45 ou 30.45" style="margin-top:4px"></div>
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:16px" onclick="saveActivityLog()">✅ Registrar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Voltar</button>`;
  $('modal-back').classList.add('on');
}
function setActLogType(v){ actLogType=v; document.querySelectorAll('[data-actlog]').forEach(o=>o.classList.toggle('on', o.dataset.actlog===v)); }
function saveActivityLog(){
  const km = parseFloat(($('act-km').value||'').replace(',','.'));
  const min = parseTimeToMin($('act-min').value||'');
  if(!km || km<=0 || km>200 || !min || min<=0 || min>600){ toast('⚠️ Confira a distância e o tempo.'); return; }
  const r = maLogActivity(actLogType, km, min);
  closeModal();
  toast(r && r.msg ? r.msg.replace(/<[^>]+>/g,'') : '✅ Atividade registrada!');
  if(state.ui.tab) goTab(state.ui.tab);
}
function maLogActivity(type, km, min){
  if(km<=0||km>200||min<=0||min>600) return {done:true, msg:'Esses números parecem estranhos 🤔. Tenta de novo, ex: "corri 5km em 30 minutos".'};
  const mod = ensureActivityLog();
  const paceNum = min/km;
  const paceStr = type==='bike' ? (km/(min/60)).toFixed(1)+' km/h' : Math.floor(paceNum)+':'+String(Math.round((paceNum-Math.floor(paceNum))*60)).padStart(2,'0')+'/km';
  const meta = {corrida:{emo:'🏃',lbl:'Corrida'},caminhada:{emo:'🚶',lbl:'Caminhada'},bike:{emo:'🚴',lbl:'Bike'}}[type];
  const name = type==='corrida' ? `${meta.emo} Corrida — ${km}km` : `${meta.emo} ${meta.lbl} — ${km}km`;
  mod.history = mod.history||[];
  mod.history.push({ id:'ma', name, at:Date.now(), duration:min, distance:km, pace:paceStr, rating:3, module:'run', activity:type });
  ensureStats();
  if(type==='corrida' && typeof checkRunEvolution==='function') checkRunEvolution(km, paceStr);
  else if(type==='caminhada'){ if(km>=3)unlockTrophy('walk_3k'); if(km>=5)unlockTrophy('walk_5k'); }
  else if(type==='bike'){ if(km>=20)unlockTrophy('bike_20k'); if(km>=50)unlockTrophy('bike_50k'); }
  if(typeof checkTrophies==='function') checkTrophies();
  saveData();
  return {done:true, msg:`✅ Registrei sua ${meta.lbl.toLowerCase()}: ${km}km em ${fmtDur(min)} (ritmo ${paceStr}). Está no seu histórico! ${meta.emo} Mandou bem!`};
}
function maLogLift(part){
  const mod = state.modules.lift;
  if(!mod){ return {done:true, msg:'Você ainda não tem um plano de musculação ativo. Crie um primeiro! 💪'}; }
  const map = {peito:'Peito',costas:'Costas',ombro:'Ombro','bíceps':'Bíceps',biceps:'Bíceps','tríceps':'Tríceps',triceps:'Tríceps',perna:'Pernas',pernas:'Pernas','glúteo':'Glúteos',gluteo:'Glúteos',panturrilha:'Panturrilha',core:'Core','abdômen':'Core',abdomen:'Core','trapézio':'Trapézio',trapezio:'Trapézio'};
  const grupo = part ? map[part] : null;
  const parts = grupo ? [grupo] : ['Peito'];
  const dur = 45;
  mod.history = mod.history||[];
  mod.history.push({ id:'ma', name:'Treino registrado — '+parts.join(' + '), at:Date.now(), duration:dur, module:'lift', feel:'bem', parts, exercisesDone:[] });
  ensureStats(); if(typeof checkTrophies==='function') checkTrophies();
  saveData();
  return {done:true, msg:`✅ Registrei seu treino de ${parts.join(' + ').toLowerCase()} no histórico! 💪 Dica: pra acompanhar sua evolução de carga, da próxima vez registre as séries pela aba Sessões — assim eu guardo seus recordes.`};
}
// Treino extra: o aluno quer trabalhar um grupo que não está no plano de hoje.
// Não altera o plano — sugere um mini-treino seguro respeitando equipamento e dor.
function maExtraWorkout(part){
  const mod = state.modules.lift;
  if(!mod) return {done:true, msg:'Você ainda não tem um plano de musculação ativo. Crie um primeiro! 💪'};
  const blocked = painBlockedParts();
  if(blocked.has(part)) return {done:true, msg:`Hoje não recomendo treinar <b>${part.toLowerCase()}</b>: essa região está ligada à dor que você me relatou. Vamos proteger primeiro e voltar mais forte. 💚`};
  const exs = buildLiftExercises([part], mod.setup).slice(0,3);
  if(!exs.length) return {done:true, msg:`Não encontrei exercícios de ${part.toLowerCase()} pro seu equipamento atual. 🤔`};
  const hojeTem = (mod.plan.workouts||[]).find(w=>w.dayIdx===getDayIdx());
  const conflito = hojeTem && (hojeTem.parts||[]).includes(part);
  if(conflito) return {done:true, msg:`Boa notícia: <b>${part.toLowerCase()}</b> já está no seu treino de hoje! É só abrir a aba Sessões. 💪`};
  const lista = exs.map(e=>`• ${e.name} — ${e.sets}×${e.reps} (descanso ${e.rest})`).join('<br>');
  const aviso = hojeTem
    ? `<br><br>⚠️ Hoje você já tem treino de <b>${(hojeTem.parts||[]).join(' + ').toLowerCase()}</b>. Somar volume extra no mesmo dia cansa mais e rende menos — se fizer, deixe o extra por último e com carga moderada.`
    : '<br><br>Hoje é dia de descanso no seu plano. Um treino extra leve é ok, mas lembre: o músculo cresce no descanso. 😉';
  return {done:true, msg:`Quer treinar <b>${part.toLowerCase()}</b> hoje? Sugestão rápida:<br><br>${lista}${aviso}<br><br>Depois é só me dizer <b>"treinei ${part.toLowerCase()}"</b> que eu registro.`};
}
// Lê uma data escrita em linguagem natural (dd/mm, dd/mm/aaaa, "15 de agosto"...).
// Se o ano não for dito e a data já tiver passado este ano, assume o ano que vem.
// "às 7h", "07:30", "6h30", "às 7 da noite" → {h, mi}
function maParseRaceTime(t){
  const periodo = /(da|de)\s*(noite|tarde)/.test(t) ? 'pm' : (/(da|de)\s*(manh[ãa])/.test(t) ? 'am' : null);
  const ajusta = h => (periodo==='pm' && h<12) ? h+12 : ((periodo==='am' && h===12) ? 0 : h);
  let m = t.match(/\b(\d{1,2})\s*[h:]\s*(\d{2})\b/);            // 7h30 · 07:30
  if(m){ const h=ajusta(+m[1]), mi=+m[2]; if(h<24 && mi<60) return {h, mi}; }
  m = t.match(/(?:[àa]s|as)\s*(\d{1,2})(?:\s*h(?:oras?)?)?\b/);   // às 7 · às 19h
  if(m){ const h=ajusta(+m[1]); if(h<24) return {h, mi:0}; }
  m = t.match(/\b(\d{1,2})\s*h\b/);                              // 19h
  if(m){ const h=ajusta(+m[1]); if(h<24) return {h, mi:0}; }
  return null;
}
function maParseRaceDate(t){
  const meses = {janeiro:1,fevereiro:2,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12};
  let dia, mes, ano=null, m;
  m = t.match(/\b(\d{1,2})[\/\.\-](\d{1,2})(?:[\/\.\-](\d{2,4}))?\b/);
  if(m){ dia=+m[1]; mes=+m[2]; ano=m[3]?+m[3]:null; }
  else {
    m = t.match(/\b(\d{1,2})\s*(?:de\s*)?(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s*(?:de\s*)?(\d{4}))?/);
    if(m){ dia=+m[1]; mes=meses[m[2].replace('ç','c')]; ano=m[3]?+m[3]:null; }
  }
  if(!dia || !mes || dia<1 || dia>31 || mes<1 || mes>12) return null;
  if(ano && ano<100) ano += 2000;
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  if(!ano){ ano = hoje.getFullYear(); if(new Date(ano, mes-1, dia) < hoje) ano += 1; }
  const d = new Date(ano, mes-1, dia);
  if(isNaN(d) || d.getDate()!==dia || d.getMonth()!==mes-1) return null; // rejeita datas inexistentes (ex: 31/02)
  return d;
}
function maSetRaceDate(d, hora){
  const mod = state.modules.run;
  if(!mod){ return {done:true, msg:'Pra cadastrar uma prova eu preciso que você tenha um plano de <b>corrida</b> ativo. Crie um primeiro (é rapidinho!) e depois me diga a data. 🏃'}; }
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const dias = Math.ceil((d - hoje)/86400000);
  if(dias < 0) return {done:true, msg:'Essa data já passou 🤔. Me diga a data da sua <b>próxima</b> prova, ex: "minha prova é dia 15/08".'};
  mod.setup = mod.setup || {};
  mod.setup.raceDate = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  if(hora) mod.setup.raceTime = String(hora.h).padStart(2,'0')+':'+String(hora.mi).padStart(2,'0');
  saveData();
  const horaFmt = hora ? String(hora.h).padStart(2,'0')+':'+String(hora.mi).padStart(2,'0') : null;
  const dataFmt = d.toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'});
  let extra;
  if(dias===0) extra = 'É <b>hoje</b>! 🏁 Confie no seu treino e aproveite cada km.';
  else if(dias<=7) extra = `Faltam só <b>${dias} dia${dias>1?'s':''}</b>! Semana de prova: reduza o volume e capriche no sono. 💪`;
  else if(dias<=30) extra = `Faltam <b>${dias} dias</b>. Reta de preparação — cada treino-chave conta muito agora. 🔥`;
  else extra = `Faltam <b>${dias} dias</b>. Dá pra construir uma baita preparação até lá — constância é o segredo. 🚀`;
  return {done:true, msg:`🏁 Prontinho! Marquei sua prova para <b>${dataFmt}</b>${horaFmt?`, largada às <b>${horaFmt}</b>`:''}. ${extra}${horaFmt?'<br><br>Com o horário eu consigo te mandar a <b>previsão do tempo da largada</b> (e não a de agora) e o checklist na hora certa. ⏰':'<br><br>Se me disser o <b>horário da largada</b> (ex: "às 7h"), eu te aviso com a previsão do tempo daquele momento. ⏰'}<br><br>A contagem regressiva já aparece na tela inicial e no calendário (com bandeira 🏁), e vou ajustando as dicas conforme o dia se aproxima. Bons treinos! 🏃`};
}
// Regiões oficiais de dor (as mesmas do Perfil)
const PAIN_REGIONS = ['Ombro','Lombar','Joelho','Punho/Cotovelo','Tornozelo','Pescoço'];
function maSetPain(area, txt){
  const map = {'pescoço':'Pescoço',pescoco:'Pescoço',cervical:'Pescoço',nuca:'Pescoço',
    tornozelo:'Tornozelo',canela:'Tornozelo','pé':'Tornozelo','pés':'Tornozelo',pe:'Tornozelo',
    cotovelo:'Punho/Cotovelo',punho:'Punho/Cotovelo','braço':'Punho/Cotovelo',braco:'Punho/Cotovelo',
    joelho:'Joelho',perna:'Joelho',pernas:'Joelho',coxa:'Joelho',coxas:'Joelho',
    ombro:'Ombro',
    lombar:'Lombar',coluna:'Lombar',costas:'Lombar',quadril:'Lombar'};
  const painArea = area ? map[area] : null;
  // Sem região identificada: NÃO ativa nada — pergunta onde dói (senão o app diria que adaptou sem adaptar)
  if(!painArea){
    maPending = {type:'pain_where'};
    return {done:true, msg:`Sinto muito 😕. Pra eu adaptar o treino do jeito certo, me diga <b>onde</b> dói. As regiões que sei proteger são:<br><br>${PAIN_REGIONS.map(r=>'• '+r).join('<br>')}<br><br>É só responder, ex: <b>joelho</b>.`};
  }
  // pergunta antes de mexer no treino — quem decide é a pessoa
  maPending = {type:'pain', area:painArea};
  return {done:true, msg:`Ah não, dor em <b>${painArea}</b>… sinto muito 😔. Quer que eu <b>adapte seu treino</b> pra proteger essa região? Eu troco o que sobrecarrega e completo com grupos seguros, sem você perder o dia.`};
}
function maApplyPain(painArea){
  state.user.pain = state.user.pain||[];
  if(!state.user.pain.includes(painArea)) state.user.pain.push(painArea);
  regenAllPlans();
  saveData();
  maRefreshUI = true;
  return {done:true, work:'Adaptando seus treinos', msg:`Feito 🩹 — treinos adaptados pra proteger <b>${painArea}</b>. Evitei o que sobrecarrega e completei com grupos seguros. Se a dor for forte ou persistir, procure um profissional de saúde: isso vem antes de qualquer treino. Quando melhorar, diga <b>"voltar ao normal"</b>. 💚`};
}
// Dor no peito / no coração é sinal de alerta médico — nunca tratamos como "ajuste de treino"
function maChestPain(){
  return {done:true, msg:'⚠️ Dor no peito não é coisa pra adaptar treino. <b>Pare a atividade física agora</b> e procure atendimento médico — principalmente se vier com falta de ar, tontura, suor frio ou dor no braço/mandíbula. Em emergência, ligue <b>192 (SAMU)</b>. Sua segurança vem antes de qualquer plano de treino. 🤍'};
}
function maTired(){
  const mod = state.modules[state.active];
  const restToday = mod && mod.plan && !mod.plan.workouts.find(w=>w.dayIdx===getDayIdx());
  if(restToday){
    return {done:true, msg:'Cansaço faz parte — escutar o corpo é maturidade, não fraqueza. 😴 Hoje já é seu dia de descanso, então aproveite pra recarregar de verdade. Sono e hidratação fazem metade do trabalho.'};
  }
  if(state.user.lightMode){
    return {done:true, msg:'Seus treinos já estão no <b>modo leve</b> 💚. Se ainda assim o corpo pedir pausa, descansar hoje é uma escolha legítima — não é desistir, é treinar com inteligência.'};
  }
  maPending = {type:'light'};
  return {done:true, msg:'Cansaço faz parte — escutar o corpo é maturidade, não fraqueza. 💚 Quer que eu deixe seus treinos <b>mais leves</b> (menos séries e volume reduzido) até você se sentir melhor?<br><br>E se preferir simplesmente descansar hoje, isso também é válido.'};
}
function maApplyLight(){
  state.user.lightMode = true;
  regenAllPlans();
  saveData();
  maRefreshUI = true;
  return {done:true, work:'Deixando seus treinos mais leves', msg:'✅ Pronto! Deixei seus treinos <b>mais leves</b>: menos séries na musculação e corridas mais curtas. Vá no seu ritmo. Quando estiver melhor, diga <b>"voltar ao normal"</b> e eu devolvo tudo. 💚'};
}
function maSad(){
  return {done:true, msg:`Sinto muito que você esteja assim, ${maName()}. 💙 Dias difíceis acontecem com todo mundo. O exercício pode ajudar a clarear a cabeça — que tal uma caminhada leve, sem cobrança de desempenho? Mas se você não estiver bem, tudo bem descansar hoje. E se esse sentimento persistir, conversar com alguém de confiança ou um profissional faz muita diferença. Você não está sozinho. 🤍`};
}
// O modo TPM só faz sentido para quem menstrua. Bloqueamos apenas o perfil masculino;
// "Outro" continua liberado (pessoas não-binárias podem menstruar).
function tpmAvailable(){
  const s = state.user && state.user.profile && state.user.profile.sex;
  return s !== 'm';
}
function maTPM(){
  if(!tpmAvailable()){
    return {done:true, msg:'O modo TPM foi pensado para o ciclo menstrual, e seu perfil está como masculino 😊. Se você quer treinos mais leves hoje por outro motivo, é só me dizer <b>"estou cansado"</b> ou <b>"estou com dor em [região]"</b> que eu adapto.'};
  }
  maPending = {type:'tpm'};
  return {done:true, msg:'Entendi 💗. Nesses dias o corpo pede mais gentileza. Quer que eu deixe seus <b>treinos mais leves</b> por enquanto?'};
}
function maApplyTPM(){
  state.user.pain = state.user.pain||[];
  state.user.tpmMode = true;
  regenAllPlans(); // sempre reaplica: a flag pode já estar ligada com o plano fora de sincronia
  saveData();
  maRefreshUI = true;
  return {done:true, work:'Deixando seus treinos mais leves', msg:'Prontinho 💗. Nesses dias o corpo pede mais gentileza — deixei seus treinos mais leves. Respeite seu ritmo: treinar leve ou até descansar é perfeitamente ok. Movimento suave (caminhada, alongamento) pode ajudar com o desconforto, mas sem cobrança. Quando quiser voltar ao normal, é só dizer "voltar ao normal". 🌸'};
}
function maCramp(){
  if(!tpmAvailable()){
    return {done:true, msg:'O modo cólica foi pensado para o ciclo menstrual 😊. Se quer treinos mais leves por outro motivo, diga <b>"estou cansado"</b> ou <b>"estou com dor em [região]"</b> que eu adapto.'};
  }
  maPending = {type:'cramp'};
  return {done:true, msg:'Imagino como você está 💗. Cólica pede gentileza. Quer que eu deixe seus <b>treinos mais leves</b> hoje?'};
}
function maApplyCramp(){
  state.user.pain = state.user.pain||[];
  state.user.crampMode = true;
  regenAllPlans();
  saveData();
  maRefreshUI = true;
  return {done:true, work:'Deixando seus treinos mais leves', msg:'Feito 💗. Cólica pede gentileza — deixei seus treinos mais leves. Dica: movimento suave (caminhada leve, alongamento) e calor costumam aliviar as cólicas, mas evite forçar o abdômen. Descansar também é totalmente válido. Quando melhorar, diga "voltar ao normal". 🌸'};
}
function maBackToNormal(){
  const tinha = (state.user.pain&&state.user.pain.length) || state.user.tpmMode || state.user.crampMode || state.user.lightMode;
  state.user.pain = [];
  state.user.tpmMode = false;
  state.user.crampMode = false;
  state.user.lightMode = false;
  if(typeof regenAllPlans==='function') regenAllPlans();
  saveData();
  return {done:true, msg: tinha ? '🎉 Que bom que está melhor! Seus treinos voltaram ao normal. Bora com tudo — respeitando sempre os limites do corpo! 💪' : 'Tudo certo, seus treinos já estão no modo normal! 💪'};
}
// ===== FIM COMANDOS =====

// respostas sociais (não dependem de dados)
// ===== CONVERSA BÁSICA =====
// "ok", "blz", "obrigado" não são perguntas — merecem resposta curta e natural,
// não o texto de "não sei responder".
function maSmallTalk(txt){
  const t = String(txt||'').toLowerCase().trim()
    .replace(/[!?.,;…]+$/g,'').replace(/\s+/g,' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if(!t || t.length > 40) return null;
  const um = arr => arr[Math.floor(Math.random()*arr.length)];
  const bate = re => re.test(t);

  // agradecimento
  if(bate(/^(muito )?(obrigad[oa]|obg|obgda|brigad[oa]|vlw|valeu|vlws|agradecid[oa]|grato|grata|thanks|tks)( demais| mesmo| viu| ai| a[ií])?$/))
    return um([
      'Imagina! 😊 Tô aqui pra isso. Bons treinos!',
      'Por nada! 💪 Se precisar de mais alguma coisa, é só chamar.',
      'Disponha! 👊 Qualquer dúvida, me chama.',
      'De nada! 💚 Conta comigo sempre que precisar.'
    ]);

  // ok / entendi / beleza
  if(bate(/^(ok|okay|okey|blz|beleza|bele|certo|ta|tá|ta bom|tá bom|ta bem|tá bem|esta bem|está bem|entendi|entendido|saquei|entendo|combinado|fechou|fechado|feito|pode ser|ta certo|tá certo|sim senhor|uhum|aham|ahan|isso|isso mesmo|exato|exatamente|perfeito|show|show de bola|massa|top|legal|bacana|joia|jóia|maneiro|dahora|da hora|bom saber|boa)$/))
    return um([
      'Combinado! 👊 Qualquer coisa é só me chamar.',
      'Show! 💪 Tô por aqui se precisar.',
      'Beleza! 😊 Bons treinos.',
      'Fechado! 🙌 Se pintar dúvida, me chama.',
      'Isso aí! 💚 Qualquer coisa, é só falar.'
    ]);

  // elogio
  if(bate(/^(voce e (bom|otimo|top|foda)|vc e (bom|otimo|top)|gostei|adorei|muito bom|otimo|excelente|top demais|melhor app|amei|curti|que legal|nossa que legal)$/))
    return um([
      'Fico feliz que tenha curtido! 😄 Isso me anima a te ajudar mais ainda.',
      'Obrigado! 💚 Meu papel é facilitar sua vida — se tiver ideia pra melhorar, me manda que eu envio pro pessoal.',
      'Que bom! 🙌 E olha: o mérito dos resultados é seu, viu? Eu só organizo as coisas.'
    ]);

  // risada
  if(bate(/^(k{2,}|rs{1,}|haha+|hehe+|kkkk+|hahaha+|lol|ksksks+)$/))
    return um([
      'Haha 😄 Bora treinar?',
      '😄 Se precisar de algo é só falar!',
      'Rindo também 😅 Qualquer coisa, tô aqui.'
    ]);

  // negativa solta
  if(bate(/^(nao|nops|nem|negativo|agora nao|deixa|deixa pra la|tanto faz|nada nao|nada)$/))
    return um([
      'Beleza! 😊 Quando precisar, é só chamar.',
      'Sem problema! 👊 Tô por aqui.',
      'Tranquilo! 💚 Qualquer hora a gente conversa.'
    ]);

  // afirmativa solta (sem pergunta pendente)
  if(bate(/^(sim|claro|com certeza|pode sim|quero|bora|vamos|manda|manda ver)$/))
    return um([
      'Boa! 💪 Me conta o que você quer que eu faça — ou toca numa das sugestões aí embaixo.',
      'Show! 😊 O que você precisa? Posso falar sobre treinos, corrida, recuperação, peso e conquistas.',
      'Bora! 🔥 Só me dizer o que você quer saber ou registrar.'
    ]);

  // pedido de desculpa / erro de digitação
  if(bate(/^(desculpa|foi mal|ops|opa desculpa|errei|digitei errado|nada ver|nada a ver)$/))
    return um([
      'Que isso, tranquilo! 😄 Manda de novo que eu tento entender.',
      'Sem problema nenhum! 😊 Pode reescrever.'
    ]);

  // como você está
  if(bate(/^(tudo bem|td bem|tudo bom|td bom|como (voce|vc) (esta|ta)|beleza\?*|de boa)$/))
    return um([
      `Tudo ótimo por aqui! 😄 E você, ${maName()}, como está se sentindo pro treino de hoje?`,
      'Tudo certo! 💪 E você, como está a disposição hoje?'
    ]);

  // bom treino / motivação de volta
  if(bate(/^(bom treino|bons treinos|boa sorte|vai la|vai que vai|forca|foco)$/))
    return um([
      'Valeu! 👊 Bom treino pra você também — capricha na execução!',
      'Obrigado! 💪 Agora é com você. Depois me conta como foi.'
    ]);

  return null;
}
const MA_SOCIAL = {
  _oi(){ const s=maSaudacao(); return `${s}, ${maName()}! 👋 Como posso te ajudar? Você pode me perguntar sobre sua evolução, corrida, conquistas, meta e mais — ou tocar numa das sugestões.`; },
  _bomdia(){ return `Bom dia, ${maName()}! ☀️ Pronto pra mais um dia de evolução? Me pergunte algo ou toque numa sugestão.`; },
  _boatarde(){ return `Boa tarde, ${maName()}! 💪 Como posso ajudar? Quer saber como está sua evolução?`; },
  _boanoite(){ return `Boa noite, ${maName()}! 🌙 Bora fechar o dia com chave de ouro? Me pergunte o que quiser sobre seus treinos.`; },
  _tchau(){ return `Até a próxima, ${maName()}! 👊 Continue firme — a constância é o que transforma. Bons treinos!`; },
  _quemsou(){ return 'Sou o Meta Assistente 💬 — seu apoio dentro do MetaTreino. Não sou uma IA da internet: eu leio seus dados reais de treino e um bom conhecimento de treino/saúde pra te responder na hora, de graça e até offline. Pergunte sobre sua evolução, treinos, nutrição, conceitos, sua meta e muito mais! 💪'; },
  _comovai(){ return `Tô ótimo e pronto pra te ajudar! 😄 Mas o que importa é como VOCÊ está. Quer que eu mostre sua evolução recente, ${maName()}?`; },
  _comandos(){ return `📋 <b>O que você pode me perguntar ou dizer:</b><br><br>
<b>📊 Como estou indo</b><br>• "como estou me saindo?" • "me avalia"<br>• "tenho corrido bem?" • "tenho treinado bem?"<br>• "minha evolução" • "como foi meu treino?"<br>• "quantos treinos essa semana?" • "meus conquistas"<br><br>
<b>🏃 Corrida</b><br>• "quanto tempo eu faria 10km?" 🔮 (previsão)<br>• "qual meu recorde?" • "minha meta"<br>• "quando é minha prova?"<br>• "minha prova é dia 15/08 às 7h" 🏁<br><br>
<b>✍️ Registrar</b><br>• "corri 5km em 30 minutos"<br>• "caminhei 3km em 25 min" • "pedalei 10km em 40min"<br>• "estou pesando 90kg" • "emagreci 2kg"<br>• "treinei peito" / "fiz musculação"<br><br>
<b>🩹 Como me sinto</b><br>• "estou com dor no joelho" (ou ombro, lombar, punho, cotovelo, tornozelo, pescoço)<br>• "estou cansado" • "estou desanimado"${tpmAvailable()?' • "estou de TPM"':''}<br>• "voltar ao normal"<br><br>
<b>💬 Me conte do seu dia</b> <i>(eu considero nas respostas)</i><br>• "dormi só 4 horas" • "hoje só tenho 30 minutos"<br>• "não almocei ainda" • "a academia está lotada"<br><br>
<b>🤔 Dúvidas do dia a dia</b><br>• "dormir mal afeta meu treino?"<br>• "que dia é hoje?" • "que horas são?"<br>• "quantas séries devo fazer?" • "o que comer antes do treino?"<br><br>
<b>⚙️ Mudar meu plano</b><br>• "quero treinar segunda, quarta e sexta"<br>• "minha academia só tem halteres"<br><br>
<b>▶️ Aprender</b><br>• "como fazer supino reto" (abre o vídeo)<br><br>
<b>💡 Falar com quem criou o app</b><br>• "quero mandar uma sugestão"<br>• "gostaria que tivesse tal função"`; },
  _ajuda(){ return 'Posso te contar: 📈 sua evolução, 💪 como foi seu treino, 🏃 sua corrida, 🏆 seus conquistas, 🎯 sua meta, qual músculo você treina menos, sua maior pausa, recordes, quanto tempo usa o app, peso, calorias e ainda te motivar. É só tocar numa sugestão ou digitar!'; }
};
function maSaudacao(){ const h=new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; }
let maThread = [];
function maNextWorkout(){
  const mod = state.modules[state.active];
  if(!mod || !mod.plan) return null;
  const today = getDayIdx();
  const ws = [...(mod.plan.workouts||[])].sort((a,b)=>a.dayIdx-b.dayIdx);
  if(!ws.length) return null;
  const nx = ws.find(w=>w.dayIdx>today) || ws[0];
  return state.active==='lift' ? ('Treino '+nx.k+' — '+nx.name+' ('+nx.dayName+')') : (nx.name+' ('+nx.dayName+')');
}
function maGentleNudge(){
  try{
    if(vacationActive()) return null; // em férias não cobramos nada
    const miss = missedWorkoutsThisWeek(state.modules[state.active]);
    if(miss && miss.length>=3) return `🔴 Você tem ${miss.length} treinos pendentes esta semana. Sem culpa — faça o mais importante quando puder e retome. Quer treinos mais leves? Diga "estou cansado".`;
    const ws = state.weights||[];
    if(ws.length){ const last = ws[ws.length-1].date||0; const d = Math.floor((Date.now()-last)/86400000); if(d>=7) return `🟢 Faz ${d} dias que você não registra o peso. Quer atualizar? Diga "estou pesando XX kg".`; }
    if(miss && miss.length>=1) return `🟡 Você tem ${miss.length} treino pendente esta semana. Encaixe num dia livre e siga o plano.`;
  }catch(e){}
  return null;
}
function daysSinceLastWorkoutMA(){
  const all=[...(state.modules.lift?.history||[]),...(state.modules.run?.history||[])];
  if(!all.length) return null;
  return Math.floor((Date.now()-Math.max(...all.map(x=>x.at)))/86400000);
}
function maComeback(){
  if(vacationActive()) return `🌴 Modo Férias ativo — aproveite o descanso, ${maName()}! Sua sequência está guardada. Quando voltar, é só desligar o modo no Perfil.`;
  const d=daysSinceLastWorkoutMA();
  if(d===null) return null;
  if(d>=14) return `Que bom te ver de volta, ${maName()}! 💙 Faz ${d} dias — mas recomeçar é o que importa. Não precisa compensar nada: bora com um treino leve hoje pra reaquecer o hábito.`;
  if(d>=6) return `Senti sua falta, ${maName()}! 💙 ${d} dias sem treinar acontece com todo mundo. Não precisa compensar tudo de uma vez — que tal recomeçar leve hoje?`;
  return null;
}
function maInsight(){
  const _fi = (typeof fatigueInsight==='function') ? fatigueInsight() : null;
  if(_fi) return _fi;
  const all=[...(state.modules.lift?.history||[]),...(state.modules.run?.history||[])].sort((a,b)=>a.at-b.at);
  if(all.length < 6) return `Ainda estou aprendendo seus padrões, ${maName()} 🙂 — com mais alguns treinos registrados eu te trago observações afiadas. Continue firme!`;
  const dias=['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
  const porDia=[0,0,0,0,0,0,0]; all.forEach(x=>porDia[new Date(x.at).getDay()]++);
  const maxDia=porDia.indexOf(Math.max(...porDia));
  let manha=0,noite=0; all.forEach(x=>{ const h=new Date(x.at).getHours(); if(h<12)manha++; else if(h>=18)noite++; });
  const prs=Object.values(state.prs||{}).map(p=>p.at).filter(Boolean).sort((a,b)=>a-b);
  const semPr = prs.length?Math.floor((Date.now()-prs[prs.length-1])/86400000):999;
  const ins=[];
  if(state.active==='lift'){
    if(prs.length>=2 && semPr<=14) ins.push(`📈 Você vem batendo recordes com regularidade — a sobrecarga progressiva está funcionando. Continue subindo aos poucos!`);
    else if(prs.length>=1 && semPr>=21) ins.push(`📈 Faz ${semPr} dias que você não bate um recorde. Se as séries saem fáceis no topo das repetições, talvez seja hora de subir a carga. 💪`);
  }
  if(Math.max(...porDia)>=3) ins.push(`📅 Seu dia mais consistente é <b>${dias[maxDia]}</b>. Ancorar os treinos nos dias que já funcionam é uma baita estratégia.`);
  if(manha+noite>=5){ if(manha>noite*1.5) ins.push(`🌅 Você treina mais de manhã — treino cedo tem uma vantagem: ninguém "rouba" seu horário durante o dia.`); else if(noite>manha*1.5) ins.push(`🌙 Você é mais de treinar à noite. Só evite treinos muito intensos perto da hora de dormir.`); }
  const dias1 = Math.floor((Date.now()-all[0].at)/86400000);
  if(dias1>=30) ins.push(`📅 Faz <b>${dias1} dias</b> que você começou no MetaTreino — e já são <b>${all.length}</b> sessões registradas. Cada uma construiu a próxima.`);
  if(state.active==='lift'){
    const ult = state.modules.lift && state.modules.lift.planCriadoEm;
    const semFicha = ult ? Math.floor((Date.now()-ult)/86400000) : null;
    if(semFicha!==null && semFicha>=75) ins.push(`🔄 Faz uns <b>${Math.round(semFicha/30)} meses</b> que sua ficha é a mesma. Trocar alguns exercícios agora pode reacender o estímulo. 💪`);
  }
  // melhor horário pra treinar — descoberto nos dados que o app já tinha
  try{
    const bt = (typeof bestTrainingTime==='function') ? bestTrainingTime() : null;
    if(bt) ins.push(`🕐 Reparei um padrão nos seus <b>${bt.total} treinos</b>: à <b>${bt.melhor.faixa}</b> você termina se sentindo bem em <b>${bt.melhor.pct}%</b> das vezes, contra ${bt.pior.pct}% à ${bt.pior.faixa}. Se der pra escolher, a ${bt.melhor.faixa} parece ser o seu melhor horário.`);
  }catch(e){}
  // dia da semana que costuma escapar
  try{
    const wa = (typeof weekdayAdherenceInsight==='function') ? weekdayAdherenceInsight() : null;
    if(wa) ins.push(`📅 Reparei que <b>${wa.pior.dia}</b> é o dia que mais escapa: você treina em <b>${wa.pior.pct}%</b> das vezes, contra ${wa.melhor.pct}% na ${wa.melhor.dia}. Se ${wa.pior.dia} é sempre corrido, talvez valha mover esse treino pra outro dia — melhor ajustar o plano que acumular falta.`);
  }catch(e){}
  // grupo que sempre termina pesado
  try{
    const hg = (typeof hardGroupInsight==='function') ? hardGroupInsight() : null;
    if(hg) ins.push(`💪 Seus treinos de <b>${hg.parte}</b> terminam como "cansado" ou "exausto" em <b>${hg.pct}%</b> das vezes. Isso é normal em grupos grandes — só vale garantir um dia leve depois dele, e capricho no sono e na comida nesse dia.`);
  }catch(e){}
  // quanto descanso ESTE corpo precisa (descoberto, não presumido)
  try{
    const rp = (typeof recoveryPatternInsight==='function') ? recoveryPatternInsight() : null;
    if(rp) ins.push(`😴 Olhando seus <b>${rp.base} treinos</b>: quando você treina <b>${rp.melhor.nome}</b>, termina se sentindo bem em <b>${rp.melhor.pct}%</b> das vezes — contra ${rp.pior.pct}% ${rp.pior.nome}. Seu corpo parece responder melhor a esse espaçamento.`);
  }catch(e){}
  // volume subindo rápido demais (risco de lesão)
  try{
    const va = (typeof volumeAlert==='function') ? volumeAlert() : null;
    if(va){
      const quanto = va.alta >= 100 ? 'mais que o <b>dobro</b>' : `<b>${va.alta}% acima</b>`;
      ins.push(va.nivel==='alto'
        ? `⚠️ Você correu <b>${va.atual}km</b> nesta semana — ${quanto} da sua média recente (${va.media}km). Subir volume rápido é a principal causa de lesão em corrida. Se aparecer dor nova, alivie sem culpa.`
        : `📊 Sua semana está ${quanto} da média recente (${va.atual}km vs ${va.media}km). Nada alarmante — só fique atento a dores novas. A regra de ouro é subir uns 10% por semana.`);
    }
  }catch(e){}
  // comparativo com o mês passado
  try{
    const mc = (typeof monthlyRunCompare==='function') ? monthlyRunCompare() : null;
    if(mc){
      const dKm = mc.kmEste - mc.kmAnt;
      if(Math.abs(dKm) >= 3){
        ins.push(dKm > 0
          ? `📅 Este mês você já fez <b>${mc.kmEste}km</b> em ${mc.nEste} atividades — <b>${Math.round(dKm)}km a mais</b> que o mês passado inteiro (${mc.kmAnt}km). Evolução real. 📈`
          : `📅 Este mês estão <b>${mc.kmEste}km</b> contra ${mc.kmAnt}km do mês passado. Sem culpa: mês tem altos e baixos — só bom saber onde você está.`);
      }
      if(mc.paceEste && mc.paceAnt){
        const gs = Math.round((mc.paceAnt - mc.paceEste)*60);
        if(gs >= 8) ins.push(`⏱️ Seu ritmo médio melhorou <b>${gs}s/km</b> em relação ao mês passado (${fmtPaceMin(mc.paceAnt)} → <b>${fmtPaceMin(mc.paceEste)}</b>). 🔥`);
      }
    }
  }catch(e){}
  // previsão de corrida: tendência do ritmo nas últimas corridas
  try{
    const runs = ((state.modules.run||{}).history||[]).filter(x=>x.activity==='corrida'&&x.distance>=2&&x.duration>0).slice(-8);
    if(runs.length>=4){
      const paceOf = r => r.duration/r.distance;
      const half = Math.floor(runs.length/2);
      const p1 = runs.slice(0,half).reduce((a,r)=>a+paceOf(r),0)/half;
      const p2 = runs.slice(half).reduce((a,r)=>a+paceOf(r),0)/(runs.length-half);
      const ganhoSeg = Math.round((p1-p2)*60);
      if(ganhoSeg>=5){
        const alvo5k = p2*5; const mm=Math.floor(alvo5k), ss=String(Math.round((alvo5k-mm)*60)).padStart(2,'0');
        ins.push(`🏃 Seu ritmo melhorou <b>${ganhoSeg}s/km</b> nas últimas corridas. No pace atual, seus 5km saem em ~<b>${mm}:${ss}</b> — e a tendência é cair mais. 📉`);
      }
    }
  }catch(e){}
  if(!ins.length) return `Você está com uma boa constância, ${maName()}! Continue registrando que logo te trago padrões mais detalhados. 💪`;
  return ins[Math.floor(Date.now()/86400000) % ins.length];
}
// ===== CLIMA (Open-Meteo, grátis, sem chave) — só uma LINHA separada, e só quando é notável =====
let weatherData = null;
function loadWeather(){
  try{
    // usa cache recente (< 2h) pra não pedir localização toda hora
    try{ const c = JSON.parse(localStorage.getItem('metatreino_weather')||'null'); if(c && c.v===2 && Date.now()-c.at < 2*3600000){ weatherData = c; return; } }catch(e){}
    if(!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function(pos){
      try{
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,wind_speed_10m&forecast_days=2&timezone=auto`)
          .then(r=>r.json())
          .then(j=>{
            const cur = j.current || {};
            const hr = j.hourly || {};
            weatherData = { v:2, temp: cur.temperature_2m, code: cur.weather_code, wind: cur.wind_speed_10m, at: Date.now(),
              horas: hr.time || null, htemp: hr.temperature_2m || null, hcode: hr.weather_code || null, hwind: hr.wind_speed_10m || null };
            try{ localStorage.setItem('metatreino_weather', JSON.stringify(weatherData)); }catch(e){}
          }).catch(e=>console.log('clima:', e));
      }catch(e){ console.log('clima:', e); }
    }, function(err){ console.log('sem localização p/ clima:', err && err.message); }, { timeout:8000, maximumAge:3600000, enableHighAccuracy:false });
  }catch(e){}
}
// retorna UMA mensagem só quando o clima é notável (chuva/tempestade/calor/frio/neblina/vento). Senão null.
function wmoDesc(code){
  if(code===0) return 'céu limpo';
  if(code>=1&&code<=3) return 'parcialmente nublado';
  if(code===45||code===48) return 'com névoa';
  if(code>=51&&code<=57) return 'com garoa';
  if(code>=61&&code<=67) return 'chuvoso';
  if(code>=71&&code<=77) return 'com neve';
  if(code>=80&&code<=82) return 'com pancadas de chuva';
  if(code>=95) return 'com tempestade';
  return 'tempo variável';
}
// linha de clima pra saudação da Home — SEMPRE que há dados (qualquer temperatura), com dica real
// Dicas específicas pra CORRER hoje, conforme o clima real do dia
// Previsão para um horário específico (ex.: a largada da prova). Cai no clima atual se não houver dados.
function weatherAt(quando){
  const w = weatherData; if(!w) return null;
  try{
    if(!quando || !w.horas || !w.htemp) return { temp:w.temp, code:w.code, wind:w.wind||0, previsto:false };
    const alvo = new Date(quando);
    const chave = alvo.getFullYear()+'-'+String(alvo.getMonth()+1).padStart(2,'0')+'-'+String(alvo.getDate()).padStart(2,'0')+'T'+String(alvo.getHours()).padStart(2,'0')+':00';
    const i = w.horas.indexOf(chave);
    if(i<0) return { temp:w.temp, code:w.code, wind:w.wind||0, previsto:false };
    return { temp:w.htemp[i], code:(w.hcode?w.hcode[i]:w.code), wind:(w.hwind?w.hwind[i]:0), previsto:true };
  }catch(e){ return { temp:w.temp, code:w.code, wind:w.wind||0, previsto:false }; }
}
function runWeatherTips(quando){
  const w = weatherAt(quando); if(!w || w.temp==null) return null;
  // horário específico sem previsão disponível → não mostra nada (conselho da hora errada engana)
  if(quando && !w.previsto) return null;
  const temp = Math.round(w.temp), code = w.code, wind = w.wind||0;
  const hora = quando ? new Date(quando).getHours() : new Date().getHours();
  const prefixo = w.previsto ? `Previsão para ${String(new Date(quando).getHours()).padStart(2,'0')}:00 — ` : '';
  const comSol = hora >= 6 && hora < 18;      // sol no céu
  const solForte = hora >= 9 && hora < 17;    // sol castigando
  const tempestade = code>=95, chuva=(code>=61&&code<=67)||(code>=80&&code<=82), garoa=code>=51&&code<=57, neve=code>=71&&code<=77, neblina=code===45||code===48;
  const dicas = [];
  let titulo = null;
  if(tempestade){
    titulo = '⛈️ Tempestade por aí';
    dicas.push('Correr com raios é risco real — hoje o certo é esteira, bike indoor ou trocar o dia.');
    dicas.push('Se remarcar, não precisa "compensar" depois: um treino a menos não desfaz semanas de trabalho.');
  } else if(chuva){
    titulo = '🌧️ Chuva na área';
    dicas.push('Piso molhado escorrega: encurte a passada e evite curvas rápidas e faixas pintadas.');
    dicas.push('Use roupa clara ou refletiva — na chuva os carros enxergam bem menos.');
    dicas.push('Boné de aba ajuda a manter a água fora dos olhos. E troque a roupa molhada logo após.');
  } else if(neve){
    titulo = '❄️ Frio extremo';
    dicas.push('Aqueça mais que o normal e cuide do piso — tração vem antes do ritmo.');
  } else if(temp>=30){
    // Dica de sol/sombra só faz sentido com o sol no céu — antes o app mandava
    // "prefira sombra" às 21h.
    titulo = (comSol ? '🥵 Calor forte (' : '🌡️ Calor mesmo à noite (') + temp + '°C)';
    dicas.push('Beba água <b>antes</b> de sair, não só depois. Em corridas acima de 40 min, leve água.');
    if(solForte) dicas.push('Se der, corra antes das 9h ou depois das 17h — o sol do meio-dia cobra caro.');
    else if(!comSol) dicas.push('Sem sol agora, mas o calor ainda pesa: comece mais devagar que o normal.');
    dicas.push('Espere ritmo <b>15-30s/km mais lento</b> que o normal. Isso é fisiologia, não queda de forma.');
    dicas.push(comSol
      ? 'Roupa clara e leve, protetor solar. Tontura ou calafrio no calor = pare na hora.'
      : 'Roupa leve e clara pra ser visto. Tontura ou calafrio no calor = pare na hora.');
  } else if(temp>=26){
    titulo = (comSol ? '☀️ Dia quente (' : '🌙 Noite quente (') + temp + '°C)';
    dicas.push('Hidrate-se bem antes e leve água se for passar de 40 min.');
    dicas.push('Ritmo um pouco mais lento é normal com esse calor — não force pra bater tempo hoje.');
    if(solForte) dicas.push('Prefira sombra e horários menos quentes.');
    else if(comSol) dicas.push('Prefira o lado da sombra do percurso.');
    else dicas.push('Sem sol pelo menos — só cuidado com a visibilidade: roupa clara ou refletiva.');
  } else if(temp<=10){
    titulo = '🧣 Frio ('+temp+'°C)';
    dicas.push('Aqueça <b>8-10 min</b> antes: músculo frio lesiona mais fácil.');
    dicas.push('Vista camadas que dá pra tirar. Cubra mãos e orelhas — é por onde mais se perde calor.');
    dicas.push('Você sua menos, mas continua desidratando: beba água mesmo sem sede.');
  } else if(temp<=16){
    titulo = '🌤️ Friozinho bom ('+temp+'°C)';
    dicas.push('Temperatura ótima pra correr — é nessa faixa que costumam sair os melhores tempos.');
    dicas.push('Aqueça uns 5-8 min antes de acelerar.');
  } else if(garoa || neblina){
    titulo = neblina ? '🌫️ Neblina' : '🌦️ Garoa fina';
    dicas.push(neblina ? 'Visibilidade baixa: use roupa clara e evite ruas movimentadas.' : 'Garoa refresca e ajuda no ritmo — só cuidado com o piso liso.');
  } else if(wind>=30){
    titulo = '💨 Vento forte';
    dicas.push('Comece o percurso <b>contra</b> o vento e volte a favor — o fim fica bem mais fácil.');
    dicas.push('Contra o vento o esforço sobe sem o ritmo subir. Vá pelo esforço, não pelo relógio.');
  } else {
    titulo = '🙂 Clima bom pra correr ('+temp+'°C)';
    dicas.push('Condições favoráveis hoje. Aqueça 5 min, comece leve e deixe o ritmo vir sozinho.');
    if(solForte && hora>=11 && hora<=15) dicas.push('Sol a pino: boné e protetor solar ajudam.');
    else if(!comSol) dicas.push('Correndo no escuro? Roupa clara ou refletiva ajuda os carros a te verem.');
  }
  return { titulo: prefixo + titulo, dicas };
}
function weatherHomeLine(){
  const w = weatherData; if(!w || w.temp==null) return null;
  const temp = Math.round(w.temp), code = w.code, wind = w.wind||0;
  const desc = wmoDesc(code);
  const tempestade = code>=95, chuva=(code>=61&&code<=67)||(code>=80&&code<=82), garoa=code>=51&&code<=57, neve=code>=71&&code<=77, neblina=code===45||code===48;
  const hora = new Date().getHours();
  const noite = hora>=20 || hora<5;
  const mod = state.modules[state.active];
  const treinaHoje = !!(mod && mod.plan && (mod.plan.workouts||[]).some(x=>x.dayIdx===getDayIdx()));
  let tip;
  if(tempestade) tip = noite ? 'tempestade lá fora — fica no aconchego' : 'melhor um treino indoor hoje';
  else if(chuva) tip = noite ? 'chuva boa pra dormir 🌧️' : 'vale esteira ou musculação';
  else if(neve) tip = 'cuidado com o piso';
  else if(temp>=32) tip = pickDay(['hidrate bem ☀️','calorão — beba muita água 🥵','muito quente, capriche na hidratação ☀️']);
  else if(temp<=12) tip = noite ? 'noite fria — se agasalhe 🧣' : 'aqueça bem antes 🧣';
  else if(garoa) tip = 'uma garoa fina caindo';
  else if(neblina) tip = 'tá com neblina por aí';
  else if(wind>=35) tip = 'vento forte lá fora';
  // clima agradável: adapta ao contexto pra NÃO contradizer a saudação
  else if(noite) tip = pickDay(['noite agradável 🌙','céu tranquilo lá fora 🌙','boa noite pra descansar 🌙']);
  else if(!treinaHoje) tip = pickDay(['tempo bom lá fora 🙂','dia agradável hoje 🙂','clima tranquilo por aí ☀️']);
  else if(temp>=27) tip = pickDay(['mantenha a água por perto 💧','calor gostoso — beba água 💧','dia quente, hidrate-se ☀️']);
  else tip = pickDay(['clima bom pra treinar 💪','tempo perfeito pra treinar 💪','dia ótimo pra suar a camisa 💦']);
  return `🌡️ ${temp}°C, ${desc} · ${tip}`;
}
function maOpeningSummary(){
  try{
    const nome = maName(), saud = maSaudacao();
    const mod = state.modules[state.active];
    const allHist = [...(state.modules.lift?.history||[]), ...(state.modules.run?.history||[])];
    const L = [`${saud}, <b>${nome}</b>! 👋`];
    if(mod && mod.plan){
      const today = getDayIdx();
      const wToday = (mod.plan.workouts||[]).find(w=>w.dayIdx===today);
      if(wToday){
        const doneToday = state.active==='lift' ? liftDoneToday(wToday) : runDoneToday(wToday);
        if(doneToday) L.push('✅ Você já treinou hoje — mandou bem!');
        else L.push(`💪 Hoje é dia de treino: <b>${state.active==='lift'?('Treino '+wToday.k+' — '+wToday.name):wToday.name}</b>.`);
      } else L.push('😴 Hoje é seu dia de descanso.');
      const totalPlanned = (mod.plan.workouts||[]).length * (mod.plan.totalWeeks||12);
      const doneCount = (mod.history||[]).length;
      if(totalPlanned) L.push(`📋 Já concluiu <b>${doneCount}</b> de <b>${totalPlanned}</b> treinos do plano.`);
    }
    const created = (state.modules.lift?.createdAt) || (state.modules.run?.createdAt);
    if(created){ const d = Math.max(1, Math.floor((Date.now()-created)/86400000)); L.push(`📅 Está no MetaTreino há <b>${d}</b> dia${d>1?'s':''}.`); }
    const streak = calcStreak(allHist);
    if(streak>0) L.push(`🔥 Sequência atual: <b>${streak}</b> dia${streak>1?'s':''} sem faltar.`);
    const nx = maNextWorkout();
    if(nx) L.push(`⏭️ Próximo treino: <b>${nx}</b>.`);
    if(new Date().getDay()===0){ L.push(''); L.push('📈 É domingo — fechamento de semana! Toque em <b>"📈 Análise da semana"</b> pra ver seu resumo e a nota.'); }
    const comeback = maComeback();
    if(comeback){ L.push(''); L.push(comeback); }
    else {
      const nudge = maGentleNudge();
      if(nudge){ L.push(''); L.push(nudge); }
      else if(allHist.length>=8 && Math.floor(Date.now()/86400000)%2===0){
        const ins = maInsight();
        if(ins && /^[📈📅🌅🌙]/.test(ins)){ L.push(''); L.push(ins); }
      }
    }
    try{
      const _all=[...((state.modules.lift&&state.modules.lift.history)||[]),...((state.modules.run&&state.modules.run.history)||[])];
      if(_all.length>=6 && !(typeof vacationActive==='function'&&vacationActive())){ L.push(''); L.push('🔎 <b>Percebi isso sobre você:</b>'); L.push(maInsight()); }
    }catch(e){}
    L.push('');
    L.push('É só perguntar ou tocar numa sugestão abaixo. 💪');
    return L.join('<br>');
  }catch(e){
    return `${maSaudacao()}, ${maName()}! 👋 Como posso te ajudar? Pergunte sobre seus treinos, evolução, meta e mais — ou toque numa sugestão.`;
  }
}
// Motivo REAL pra chamar a atenção (nunca inventa nada — só fala quando tem algo de verdade)
// Motivo REAL pra chamar (nunca inventa) + NÍVEL de cor conforme a importância
let maNudgeAtivo = null;
function maNudge(){
  try{
    if((state.ui&&state.ui.nudgeSeen) === new Date().toDateString()) return null; // no máx. 1x/dia
    const lift=state.modules.lift, run=state.modules.run;
    const all=[...((lift&&lift.history)||[]),...((run&&run.history)||[])].sort((a,b)=>a.at-b.at);
    const total=all.length;
    const streak=(typeof calcStreak==='function')?calcStreak():0;
    const vac=(typeof vacationActive==='function')&&vacationActive();
    const hoje=new Date(); hoje.setHours(0,0,0,0);
    // ❤️ VERMELHO — extremamente especial
    if(total>0){
      const dias1=Math.floor((Date.now()-all[0].at)/86400000);
      if(dias1>0 && dias1%365===0) return {text:`❤️ Hoje faz ${dias1/365} ano${dias1/365>1?'s':''} da sua primeira sessão no MetaTreino. Que jornada...`, tone:'special'};
      if(total===1000) return {text:`❤️ 1000 treinos. Eu acompanho isso faz tempo. Parabéns de verdade. 🥹`, tone:'special'};
    }
    // 🟣 ROXO — raro
    if([100,200,365].includes(total)) return {text:`🟣 Você chegou no seu ${total}º treino! Pouquíssima gente chega aqui. Bora comemorar?`, tone:'rare'};
    // 🟠 LARANJA — importante
    const prs=Object.values(state.prs||{}).map(x=>x&&x.at).filter(Boolean);
    if(prs.some(t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()===hoje.getTime();})) return {text:`🏆 Você bateu um recorde hoje! Quer ver sua evolução?`, tone:'important'};
    const prox=[10,25,50,100,200,365].find(m=>m>total);
    if(prox && total>0 && (prox-total)<=2) return {text:`🎯 Falta ${prox-total===1?'1 treino':(prox-total)+' treinos'} pro seu ${prox}º! Quer ver?`, tone:'important'};
    if(streak>=7) return {text:`🔥 ${streak} dias seguidos — sua melhor fase! Dá uma olhada no ritmo.`, tone:'important'};
    // 🟢 VERDE — curiosidade/insight (em férias não puxa, pra não parecer cobrança)
    // Dica de "pegar leve hoje" só faz sentido se existir treino hoje.
    const temTreinoHoje = (()=>{ try{ const m=state.modules[state.active];
      return !!(m && m.plan && (m.plan.workouts||[]).some(x=>x.dayIdx===getDayIdx())); }catch(e){ return false; } })();
    if(!vac && temTreinoHoje && typeof fatigueInsight==='function' && fatigueInsight() && total>=4) return {text:`🧠 Dei uma olhada na sua recuperação — tenho uma dica pra hoje.`, tone:'curio'};
    if(!vac && total>=6 && streak>=2) return {text:`💡 Descobri um padrão nos seus treinos. Posso te mostrar?`, tone:'curio'};
    return null;
  }catch(e){ return null; }
}
function updateFabNudge(){
  const fab = document.getElementById('ma-fab'); if(!fab) return;
  let bubble = document.getElementById('fab-bubble');
  const n = maNudge();
  fab.classList.remove('fab-curio','fab-important','fab-rare','fab-special','fab-alert');
  if(n){
    fab.classList.add('fab-alert','fab-'+(n.tone||'important'));
    maNudgeAtivo = n;   // guarda o motivo: ao abrir, o assistente começa por ele
    if(!bubble){ bubble = document.createElement('div'); bubble.id='fab-bubble'; document.body.appendChild(bubble); bubble.onclick=function(){ openAssistant(); }; }
    bubble.textContent = n.text;
    // na aba Sessões o assistente não aparece — o balão também não
    bubble.style.display = ((state.ui && state.ui.tab) === 'sessions') ? 'none' : 'block';
    clearTimeout(window._fabBubbleT);
    window._fabBubbleT = setTimeout(function(){ const b=document.getElementById('fab-bubble'); if(b) b.style.display='none'; }, 8000); // some, mas o botão fica colorido
  } else {
    maNudgeAtivo = null;
    if(bubble) bubble.style.display='none';
  }
}
// A conversa fica guardada por algumas horas (no aparelho, não na nuvem).
// Assim você fecha, confere algo no app e volta sem perder o fio da meada.
const MA_THREAD_TTL = 3*3600000;   // 3 horas
function maSaveThread(){
  try{
    const limpo = maThread.filter(m=>!m.typing && !m.working).slice(-40);   // sem indicadores, últimas 40
    if(!limpo.length){ localStorage.removeItem('mt_ma_thread'); return; }
    localStorage.setItem('mt_ma_thread', JSON.stringify({ at: Date.now(), thread: limpo }));
  }catch(e){}
}
function maLoadThread(){
  try{
    const raw = localStorage.getItem('mt_ma_thread'); if(!raw) return null;
    const o = JSON.parse(raw);
    if(!o || !o.thread || !o.thread.length) return null;
    if(Date.now() - (o.at||0) > MA_THREAD_TTL){ localStorage.removeItem('mt_ma_thread'); return null; }
    return o.thread;
  }catch(e){ return null; }
}
function maClearThread(){
  try{ localStorage.removeItem('mt_ma_thread'); }catch(e){}
  clearTimeout(maTypingT);
  maThread = [];
  renderAssistant();
  maReply(maOpeningSummary());
}
// Nome legível de um exercício a partir do id
function nomeDoEx(id){
  try{
    for(const c of EX_BANK){ const it=c.items.find(x=>slug(x.name)===id); if(it) return it.name; }
  }catch(e){}
  return String(id||'').replace(/-/g,' ');
}
// Monta a resposta CHEIA do aviso que acendeu o balão — com o dado real por trás
function nudgeResposta(n){
  const t = n && n.tone;
  const cab = (n && n.text) ? n.text + '<br><br>' : '';
  try{
    if(t==='curio'){
      const fi = (typeof fatigueInsight==='function') ? fatigueInsight() : null;
      const ins = (typeof maInsight==='function') ? maInsight() : null;
      return cab + (fi || ins || 'Continue registrando que eu vou te mostrando os padrões. 💪');
    }
    if(t==='important'){
      const partes = [];
      const prs = Object.entries(state.prs||{}).filter(([,x])=>{ if(!x||!x.at) return false; const d=new Date(x.at); d.setHours(0,0,0,0); const h=new Date(); h.setHours(0,0,0,0); return d.getTime()===h.getTime(); });
      if(prs.length){
        partes.push('🏆 <b>Recordes de hoje:</b><br>' + prs.slice(0,4).map(([id,x])=>`• ${nomeDoEx(id)}: <b>${x.peso||x.weight||'—'}kg × ${x.reps||'—'}</b>`).join('<br>'));
      }
      const ins = (typeof maInsight==='function') ? maInsight() : null;
      if(ins) partes.push(ins);
      return cab + (partes.join('<br><br>') || 'Toca em "Minha evolução" aí embaixo que eu te mostro os números. 📈');
    }
    if(t==='rare' || t==='special'){
      const lift=((state.modules.lift||{}).history)||[], run=((state.modules.run||{}).history)||[];
      const total=lift.length+run.length;
      const km=Math.round(run.reduce((a,x)=>a+(parseFloat(x.distance)||0),0));
      const trof=(state.trophies||[]).length;
      return cab + `📊 <b>Sua jornada até aqui</b><br>• <b>${total}</b> treinos registrados${km?`<br>• <b>${km} km</b> percorridos`:''}<br>• <b>${trof}</b> conquistas desbloqueadas<br><br>Isso não foi sorte — foi você aparecendo, dia após dia. 💚`;
    }
  }catch(e){}
  return cab + 'Me pergunta o que quiser sobre seus treinos! 😊';
}
function openAssistant(){
  state.ui = state.ui || {}; state.ui.nudgeSeen = new Date().toDateString();
  try{ saveData(); }catch(e){}
  const fab=document.getElementById('ma-fab'); if(fab) fab.classList.remove('fab-alert','fab-curio','fab-important','fab-rare','fab-special');
  const b=document.getElementById('fab-bubble'); if(b) b.style.display='none';
  const _inp0 = $('ma-input'); if(_inp0) _inp0.value = '';
  // Balão colorido = tinha um aviso. Abrir tem que levar AO aviso, não à saudação genérica.
  if(maNudgeAtivo){
    const n = maNudgeAtivo; maNudgeAtivo = null;
    maThread = [];
    renderAssistant();
    try{ maReply(nudgeResposta(n)); }catch(e){ maThread=[{who:'bot', txt:n.text}]; renderAssistant(); }
    return;
  }
  const anterior = maLoadThread();
  if(anterior && anterior.length){
    // retoma de onde parou (sem repetir a saudação)
    maThread = anterior;
    renderAssistant();
  } else {
    maThread = [];
    renderAssistant();
    // chega como mensagem de gente: primeiro os pontinhos, depois o texto
    try{ maReply(maOpeningSummary()); }catch(e){ maThread=[{who:'bot', txt:maOpeningSummary()}]; renderAssistant(); }
  }
}
// Avatar do assistente — dá cara de atendimento de verdade
function maAvatar(tam){
  const t = tam || 30;
  return `<div style="width:${t}px;height:${t}px;border-radius:50%;flex-shrink:0;
    background:linear-gradient(135deg,#10b981,#047857);display:flex;align-items:center;justify-content:center;
    font-weight:900;font-size:${Math.round(t*0.46)}px;color:#04140d;letter-spacing:-.5px;
    box-shadow:0 2px 8px rgba(16,185,129,.35)">M</div>`;
}
function maBubblesHTML(){
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return maThread.map((m,idx)=>{
    const anterior = maThread[idx-1];
    const primeiroDoBot = !anterior || anterior.who!=='bot' || anterior.typing || anterior.working;
    const comAvatar = (html)=> `<div style="display:flex;gap:8px;align-items:flex-end;margin:6px 0;max-width:92%">
        ${primeiroDoBot ? maAvatar(30) : '<div style="width:30px;flex-shrink:0"></div>'}${html}</div>`;
    return m.typing
    ? comAvatar(`<div style="background:var(--tint-primary);border:1px solid var(--line-primary);border-radius:var(--radius-card) var(--radius-card) var(--radius-card) 4px;padding:13px 16px;display:inline-flex;gap:5px;align-items:center;width:auto">
        <span style="width:7px;height:7px;border-radius:50%;background:#34d399;animation:matype 1.1s ease-in-out infinite"></span>
        <span style="width:7px;height:7px;border-radius:50%;background:#34d399;animation:matype 1.1s ease-in-out .18s infinite"></span>
        <span style="width:7px;height:7px;border-radius:50%;background:#34d399;animation:matype 1.1s ease-in-out .36s infinite"></span>
      </div>`)
    : m.working
    ? comAvatar(`<div style="background:var(--tint-info);border:1px solid var(--line-info);border-radius:var(--radius-card) var(--radius-card) var(--radius-card) 4px;padding:11px 14px;font-size:13px;color:#7dd3fc;display:flex;gap:8px;align-items:center">
        <span style="display:inline-block;animation:maspin 1.1s linear infinite">⚙️</span><span>${m.working}…</span>
      </div>`)
    : m.who==='bot'
    ? comAvatar(`<div style="background:var(--tint-primary);border:1px solid var(--line-primary);border-radius:${primeiroDoBot?'16px 16px 16px 4px':'4px 16px 16px 4px'};padding:11px 14px;font-size:13.5px;line-height:1.5">${m.txt}</div>`)
    : `<div style="background:var(--surface-2);border-radius:var(--radius-card) var(--radius-card) 4px var(--radius-card);padding:11px 14px;margin:6px 0 6px auto;font-size:13.5px;max-width:88%;text-align:right">${esc(m.txt)}</div>`;
  }).join('');
}
function maSugsHTML(){
  const emModoLeve = (state.user && ((state.user.pain&&state.user.pain.length) || state.user.tpmMode || state.user.crampMode));
  let sugs = emModoLeve
    ? [{lbl:'💚 Voltar treinos ao normal', key:'_normal'}, ...MA_SUGGESTIONS]
    : MA_SUGGESTIONS;
  if(maPending) sugs = [{lbl:'✅ Sim, por favor', key:'_yes'}, {lbl:'🙂 Não, deixa assim', key:'_no'}];
  return sugs.map(s=>`<button class="btn btn-ghost" style="padding:7px 12px;font-size:12px;white-space:nowrap;flex-shrink:0" onclick="maAsk('${s.key}')">${s.lbl}</button>`).join('');
}
// Atualiza SÓ a conversa e os atalhos — o campo de texto continua vivo,
// então o teclado do celular não fecha no meio da digitação.
function maRefreshThread(){
  try{ maSaveThread(); }catch(e){}
  const th = $('ma-thread');
  const mb = $('modal-back');
  if(!th || !mb || !mb.classList.contains('on')){ renderAssistant(); return; }
  th.innerHTML = maBubblesHTML();
  th.scrollTop = th.scrollHeight;
  const sc = $('ma-sugs'); if(sc) sc.innerHTML = maSugsHTML();
}
function renderAssistant(){
  const mb = $('modal-back');
  const visivel = !!(mb && mb.classList.contains('on'));
  // refresh leve SÓ quando o assistente já está aberto de verdade (senão o modal nunca reabre)
  if(visivel && $('ma-thread')){ maRefreshThread(); return; }
  $('modal-inner').innerHTML = `
    <div style="display:flex;gap:11px;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--border)">
      ${maAvatar(42)}
      <div style="flex:1;min-width:0">
        <div style="font-weight:800;font-size:16px;letter-spacing:-.2px">Meta Assistente</div>
        <div style="font-size:11.5px;color:var(--primary-2);display:flex;align-items:center;gap:5px;margin-top:2px">
          <span style="width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.18)"></span>
          online · responde na hora
        </div>
      </div>
    </div>
    <div id="ma-thread" style="max-height:min(42vh,340px);overflow-y:auto;margin:10px 0;display:flex;flex-direction:column">${maBubblesHTML()}</div>
    <div id="ma-sugs" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px">${maSugsHTML()}</div>
    <div class="row" style="gap:6px">
      <input class="input" id="ma-input" placeholder="Pergunte ou registre algo..." style="flex:1" autocomplete="off" enterkeyhint="send" onkeydown="if(event.key==='Enter')maAskText()">
      <button class="btn btn-primary" style="padding:11px 16px" onclick="maAskText()">➤</button>
    </div>
    <div class="row" style="gap:6px;margin-top:10px">
      <button class="btn btn-ghost" style="flex:1" onclick="closeAssistant()">Fechar</button>
      <button class="btn btn-ghost" id="ma-clear" style="padding:11px 14px;font-size:12.5px" onclick="maClearThread()" title="Limpar conversa">🧹</button>
    </div>`;
  $('modal-back').classList.add('on');
  const th=$('ma-thread'); if(th) th.scrollTop=th.scrollHeight;
  const inp = $('ma-input');
  if(inp && !inp._kbBound){
    inp._kbBound = true;
    // teclado abriu: mantém a conversa visível em vez de empurrar a janela
    inp.addEventListener('focus', ()=>{ setTimeout(()=>{ const t=$('ma-thread'); if(t) t.scrollTop=t.scrollHeight; }, 320); });
  }
}
function closeAssistant(){
  try{ clearTimeout(maTypingT); maThread = maThread.filter(m=>!m.typing && !m.working); maSaveThread(); }catch(e){}
  closeModal();
  if(maRefreshUI){ maRefreshUI = false; goTab(state.ui.tab||'home'); }
}
// Responde como uma pessoa: mostra "digitando" e leva um tempinho — mais em respostas longas
let maTypingT = null;
function maReply(txt, work){
  try{
    if(!document.getElementById('ma-type-style')){
      const st=document.createElement('style'); st.id='ma-type-style';
      st.textContent='@keyframes matype{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-4px);opacity:1}}@keyframes maspin{to{transform:rotate(360deg)}}';
      document.head.appendChild(st);
    }
  }catch(e){}
  clearTimeout(maTypingT);
  maThread = maThread.filter(m=>!m.typing && !m.working);
  maThread.push(work ? {who:'bot', working:work} : {who:'bot', typing:true});
  maRefreshThread();
  const partes = maQuebrarResposta(txt);
  const puro = String(partes[0]).replace(/<[^>]+>/g,'');
  const espera = work ? 1900 : Math.max(750, Math.min(2600, 620 + puro.length*8));
  const entregar = (i)=>{
    maThread = maThread.filter(m=>!m.typing && !m.working);
    maThread.push({who:'bot', txt: partes[i]});
    maRefreshThread();
    if(i+1 < partes.length){
      // mais uma mensagem vindo: mostra "digitando" de novo, como uma pessoa faria
      maThread.push({who:'bot', typing:true});
      maRefreshThread();
      const prox = String(partes[i+1]).replace(/<[^>]+>/g,'');
      maTypingT = setTimeout(()=>entregar(i+1), Math.max(600, Math.min(1500, 380 + prox.length*5)));
    }
  };
  maTypingT = setTimeout(()=>entregar(0), espera);
}
// Divide respostas longas em 2-3 mensagens, quebrando em parágrafo — nunca no meio de uma frase.
function maQuebrarResposta(txt){
  const t = String(txt||'');
  const puro = t.replace(/<[^>]+>/g,'');
  if(puro.length < 200) return [t];                 // resposta curta: uma bolha só
  const blocos = t.split(/<br>\s*<br>/).map(x=>x.trim()).filter(Boolean);
  if(blocos.length < 2) return [t];                  // sem ponto natural de quebra: não força
  if(blocos.length === 2) return blocos;
  // 3+ blocos: primeiro sozinho, o resto agrupado em no máximo 2 mensagens
  const meio = Math.ceil((blocos.length-1)/2);
  return [ blocos[0],
           blocos.slice(1, 1+meio).join('<br><br>'),
           blocos.slice(1+meio).join('<br><br>') ].filter(Boolean);
}
function maAsk(key){
  if(key==='_yes' || key==='_no'){
    const resposta = key==='_yes' ? 'sim' : 'não';
    maThread.push({who:'user', txt: key==='_yes' ? 'Sim, por favor' : 'Não, deixa assim'});
    const r = maTryCommand(resposta);
    renderAssistant();
    maReply((r&&r.msg) || 'Tudo bem! 😊', (r&&r.work)||null);
    return;
  }
  if(key==='_normal'){
    maThread.push({who:'user', txt:'Voltar treinos ao normal'});
    const r = maBackToNormal();
    maRefreshUI = true;
    maReply(r.msg);
    return;
  }
  const sug = MA_SUGGESTIONS.find(s=>s.key===key);
  maThread.push({who:'user', txt: sug?sug.lbl.replace(/^[^\s]+\s/,''):key});
  const fn = MA_SOCIAL[key] || MA_ANSWERS[key];
  renderAssistant();
  maReply(fn?fn():'Ainda não sei responder isso, mas estou aprendendo! 😊');
}
function maAskText(){
  const inp=$('ma-input'); if(!inp) return;
  const txt=inp.value.trim(); if(!txt) return;
  inp.value = '';                      // limpa aqui (a tela não é mais refeita, senão o texto ficaria)
  maThread.push({who:'user', txt});
  let answer, workLabel = null;
  const _low = txt.toLowerCase();
  const _smallTalk = (typeof maSmallTalk==='function') ? maSmallTalk(txt) : null;  // calcula 1x (sorteia 1 resposta só)
  // 0) anota o que o aluno contou de passagem (sono, tempo, ânimo, fome...)
  let _anotacoes = [];
  try{ _anotacoes = maDetectContext(_low) || []; }catch(e){}
  // 1) tenta executar como COMANDO (registrar peso, atividade, dor, etc.)
  const cmd = maTryCommand(txt);
  if(cmd && cmd.done){ answer = cmd.msg; maRefreshUI = true; if(cmd.work) workLabel = cmd.work; }
  else {
    // 2) senão, interpreta como pergunta/social
    const key = maInterpret(txt);
    if(key && MA_SOCIAL[key]) answer = MA_SOCIAL[key]();
    else if(key && MA_ANSWERS[key]) answer = MA_ANSWERS[key]();
    else if(_smallTalk) answer = _smallTalk;
    // Antes terminava com "Quer que eu ajuste alguma coisa?", pergunta que não
    // levava a lugar nenhum. Agora cada anotação já vem com a orientação prática.
    else if(_anotacoes.length) answer = _anotacoes.join('<br><br>') + '<br><br>Vou levar isso em conta no que eu te sugerir hoje. 😊';
    else {
      // não sabe responder: registra de verdade pra virar melhoria futura
      try{ logUnknownQuestion(txt); }catch(e){}
      const alt = [
        'Essa me pegou de surpresa. 😅<br><br>Ainda não sei responder sobre isso — mas <b>guardei sua pergunta</b>, e ela pode virar melhoria numa próxima atualização. 💚',
        'Essa eu ainda não sei responder. 🤔<br><br><b>Anotei sua pergunta</b> e ela vai pra lista de melhorias do app. Enquanto isso, posso ajudar com treinos, corrida, recuperação, peso e conquistas.',
        'Boa pergunta — e eu ainda não tenho essa resposta. 😅<br><br><b>Registrei aqui</b> pra virar novidade numa próxima atualização. Obrigado por perguntar!'
      ];
      answer = alt[Math.floor(Math.random()*alt.length)];
    }
  }
  // 3) contexto da conversa entra em perguntas sobre treinar/intensidade hoje
  try{
    if(/(posso|devo|vale|consigo).*(treinar|correr|pegar pesado|aumentar|recorde|carga|forçar)|treino de hoje|bora treinar|vou treinar/.test(_low)){
      const nota = maCtxNota();
      if(nota) answer += '<br><br>' + nota;
    }
    if(_anotacoes.length && cmd && cmd.done) answer += '<br><br>' + _anotacoes.join('<br>');
  }catch(e){}
  maReply(answer, workLabel);
}
// ========== FIM META ASSISTENTE ==========

// ---------- BACKUP DO ALUNO ----------
function exportMyData(){
  const data = { app:'MetaTreino', versao:APP_VERSION, exportadoEm:new Date().toISOString(), estado:state };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `metatreino-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  toast('📥 Backup baixado — guarde em local seguro');
}
function importMyData(ev){
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      const est = data.estado || data; // aceita o arquivo completo ou só o estado
      if(!est || !est.user){ toast('⚠️ Arquivo inválido — não parece um backup do MetaTreino'); return; }
      if('modules' in est && (est.modules === null || typeof est.modules !== 'object')){
        toast('⚠️ Backup corrompido: a parte dos treinos está inválida'); return;
      }
      appConfirm('Seus dados atuais serão SUBSTITUÍDOS pelos do arquivo.', ()=>{
        const keepUser = { ...est.user, email: state.user.email, isAdmin: state.user.isAdmin };
        state = {...state, ...est, user:keepUser, ui:{tab:'home',selectedSession:null}};
        if(!state.modules || typeof state.modules !== 'object') state.modules = {lift:null, run:null};
        try{ migrateExerciseIds(); }catch(e){ console.log('Erro ao sanear o backup:', e); }  // normaliza números e planos do arquivo
        ensureStats(); saveData(); syncToCloud();
        toast('✅ Backup restaurado com sucesso!'); goTab('home');
      }, {title:'Restaurar backup?', emo:'📥', okLabel:'Sim, restaurar', danger:true});
    }catch(e){ toast('⚠️ Não foi possível ler o arquivo'); }
  };
  reader.readAsText(file);
  ev.target.value = '';
}

// ---------- TIMER DE DESCANSO ----------
let restTimerInt = null;
let wakeLock = null;
let restAudioCtx = null;
let restMuted = false;
function toggleRestMute(){ restMuted = !restMuted; toast(restMuted?'🔇 Som do timer desligado':'🔔 Som do timer ligado'); }
// Destrava o áudio no toque que inicia o timer (navegadores exigem interação do usuário).
// Depois disso, conseguimos tocar o beep mesmo quando o timer termina sozinho.
function unlockRestAudio(){
  try{
    if(!restAudioCtx){ restAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    if(restAudioCtx.state === 'suspended') restAudioCtx.resume();
    // toca um "silêncio" instantâneo pra confirmar o desbloqueio
    const o = restAudioCtx.createOscillator(); const g = restAudioCtx.createGain();
    g.gain.value = 0; o.connect(g); g.connect(restAudioCtx.destination); o.start(); o.stop(restAudioCtx.currentTime+0.01);
  }catch(e){}
}
function playRestBeep(){
  // 4 apitos ascendentes, mais altos e longos — sinal forte de fim de descanso
  try{
    if(!restAudioCtx) return;
    if(restAudioCtx.state === 'suspended') restAudioCtx.resume();
    const notes = [700, 900, 1100, 1300];
    notes.forEach((freq, i)=>{
      const o = restAudioCtx.createOscillator();
      const g = restAudioCtx.createGain();
      o.type = 'square'; o.frequency.value = freq; // onda quadrada = mais audível/estridente
      const t0 = restAudioCtx.currentTime + i*0.32;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.7, t0+0.03);   // volume bem mais alto
      g.gain.exponentialRampToValueAtTime(0.0001, t0+0.3); // cada apito mais longo
      o.connect(g); g.connect(restAudioCtx.destination);
      o.start(t0); o.stop(t0+0.32);
    });
  }catch(e){}
}
async function requestWakeLock(){
  try{ if('wakeLock' in navigator){ wakeLock = await navigator.wakeLock.request('screen'); } }catch(e){}
}
function releaseWakeLock(){ try{ if(wakeLock){ wakeLock.release(); wakeLock=null; } }catch(e){} }
// reativa o wake lock se o app voltar ao foco com timer rodando
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible' && restTimerInt) requestWakeLock(); });
function parseRestSeconds(str){
  if(!str) return 60;
  const s = String(str).toLowerCase();
  const nums = (s.match(/\d+/g)||[]).map(Number);
  if(!nums.length) return 60;
  const val = nums.length>1 ? (nums[0]+nums[1])/2 : nums[0]; // faixa → ponto médio
  return Math.round(s.includes('min') ? val*60 : val);
}
function startRestTimer(seconds, exName){
  stopRestTimer();
  let left = seconds;
  let el = $('rest-timer-banner');
  if(!el){
    el = document.createElement('div');
    el.id = 'rest-timer-banner';
    el.style.cssText = 'position:fixed;bottom:76px;left:14px;right:14px;z-index:350;background:var(--bg-2);border:1.5px solid var(--primary);border-radius:var(--radius-card);padding:13px 16px;display:flex;align-items:center;gap:12px;box-shadow:var(--shadow-md)';
    document.body.appendChild(el);
  }
  const render = ()=>{
    const m = Math.floor(left/60), s = left%60;
    el.innerHTML = `<span style="font-size:22px">⏱️</span>
      <div style="flex:1"><div style="font-weight:800;font-size:14px">Descanso${exName?' · '+exName:''}</div><div style="font-size:12px;color:var(--text-dim)">${restMuted?'🔇 Som desligado':'🔔 Apita ao acabar'}</div></div>
      <div class="mono" style="font-weight:900;font-size:24px;color:var(--primary-2)">${m}:${String(s).padStart(2,'0')}</div>
      <button onclick="toggleRestMute()" style="background:none;border:none;color:var(--text-mute);font-size:18px;padding:4px">${restMuted?'🔇':'🔔'}</button>
      <button onclick="stopRestTimer()" style="background:none;border:none;color:var(--text-mute);font-size:18px;padding:4px">✕</button>`;
  };
  render();
  requestWakeLock(); // mantém a tela ligada durante o descanso
  unlockRestAudio(); // destrava o som agora (no toque) pra poder apitar no fim
  restTimerInt = setInterval(()=>{
    left--;
    if(left<=0){
      stopRestTimer();
      if(!restMuted) playRestBeep(); // som (funciona mesmo sem toque, pois foi destravado no início)
      if(navigator.vibrate) navigator.vibrate([300,120,300,120,300]); // vibração (reforço, quando o Chrome permite)
      toast('💪 Descanso acabou — próxima série!');
      return;
    }
    render();
  }, 1000);
}
function stopRestTimer(){
  clearInterval(restTimerInt); restTimerInt = null;
  releaseWakeLock();
  const el = $('rest-timer-banner'); if(el) el.remove();
}

// ---------- DOR / ADAPTAÇÃO ----------
// lista de equipamentos compatíveis com a configuração do aluno
function equipListFor(equip){
  return equip==='basico' ? ['casa','halteres']
       : equip==='academia' ? ['academia','halteres','casa']
       : equip==='halteres' ? ['halteres','casa']
       : ['casa'];
}
// procura um exercício do banco pelo slug
function exBySlug(id){
  for(const c of EX_BANK) for(const e of c.items) if(slug(e.name)===id) return e;
  return null;
}
// Reaplica os exercícios que o ALUNO fixou manualmente (trocou na mão).
// Chamado depois de qualquer regeneração, pra a escolha dele não ser perdida.
function applyPins(w, setup){
  if(!w.pins || !w.pins.length) return;
  const allowed = equipListFor(setup.equip);
  const guardados = [], aplicaveis = [];
  w.pins.forEach(p=>{
    const ex = exBySlug(p.id);
    if(!ex) return;                                          // exercício não existe mais → descarta
    if(!(ex.equip||[]).some(e=>allowed.includes(e))) return;  // equipamento mudou → descarta
    guardados.push(p);                                       // pin continua válido
    if(!(w.parts||[]).includes(p.part)) return;              // grupo bloqueado por dor: só não aplica AGORA
    aplicaveis.push({p, ex});
  });
  w.pins = guardados;                                        // dor é temporária: não apaga o pin
  aplicaveis.forEach(({p, ex})=>{
    if(w.exercises.some(e=>e.id===p.id)) return;          // já está no treino
    const idx = w.exercises.findIndex(e=>e.part===p.part && !w.pins.some(pp=>pp.id===e.id));
    if(idx<0) return;
    const old = w.exercises[idx];
    w.exercises[idx] = { id:p.id, name:ex.name, sub:ex.sub, sets:old.sets, reps:old.reps, rest:old.rest, part:p.part, equip:ex.equip, pinned:true };
  });
  // marca os fixados que já estavam na lista
  w.exercises.forEach(e=>{ e.pinned = w.pins.some(p=>p.id===e.id); });
}

// ---------- MODO ADAPTADO (dor / TPM) ----------
// Centraliza: quando o aluno está com dor ou em TPM, os treinos mudam de verdade
// (grupos evitados, séries reduzidas, nome do treino ajustado) e ele é avisado do porquê.
// ---------- FADIGA ACUMULADA (invisível: só deixa as recomendações mais espertas) ----------
// Cada treino soma fadiga ao grupo trabalhado e um resíduo aos sinergistas. Decai 25/dia.
const SYNERGY = {
  'Peito':{'Ombro':.40,'Tríceps':.40},
  'Ombro':{'Tríceps':.30,'Trapézio':.30},
  'Costas':{'Bíceps':.40,'Trapézio':.30,'Core':.20},
  'Pernas':{'Glúteos':.50,'Panturrilha':.30,'Core':.20},
  'Glúteos':{'Pernas':.50,'Core':.20},
  'Tríceps':{'Peito':.20},
  'Bíceps':{'Costas':.20},
  'Panturrilha':{'Pernas':.20},
  'Trapézio':{'Ombro':.25}
};
function fatigueFromEntry(x){
  // cálculo misto: sensação (base) × duração × volume — 40min "exausto" ≠ 2h "bem"
  let base;
  if(x.module==='run'){ const r=x.rating; base = r>=5?35:(r<=1?85:55); }
  else base = ({otimo:30, bem:45, cansado:65, exausto:85})[x.feel] || 45;
  const min = x.duration||0;
  const fDur = min<=0 ? 1 : (min<30 ? 0.8 : (min>75 ? 1.2 : 1));
  const nEx = (x.exercisesDone||[]).length;
  const fVol = nEx<=0 ? 1 : (nEx<=3 ? 0.9 : (nEx>=7 ? 1.15 : 1));
  return Math.min(100, Math.round(base * fDur * fVol));
}
// recuperação por grupo: panturrilha/braços recuperam rápido; pernas/costas demoram mais
const RECOVERY_RATE = { 'Panturrilha':32, 'Core':32, 'Bíceps':30, 'Tríceps':30, 'Ombro':28, 'Trapézio':28, 'Peito':25, 'Glúteos':23, 'Pernas':22, 'Costas':22 };
function recoveryRate(g){ return RECOVERY_RATE[g] || 25; }
// mapa {grupo: 0..100+} considerando os últimos dias
function fatigueMap(){
  const map = {};
  const add = (g,v)=>{ if(!g||v<=0) return; map[g]=(map[g]||0)+v; };
  const todos = [...(((state.modules.lift||{}).history)||[]), ...(((state.modules.run||{}).history)||[])];
  const agora = Date.now();
  todos.forEach(x=>{
    const dias = Math.floor((agora - x.at)/86400000);
    if(dias<0 || dias>5) return;
    const pts = fatigueFromEntry(x);
    const cred = g => Math.max(0, pts - dias*recoveryRate(g)); // cada grupo recupera no seu ritmo
    if(x.module==='run'){ add('Pernas', cred('Pernas')*0.6); add('Panturrilha', cred('Panturrilha')*0.4); add('Core', cred('Core')*0.15); return; }
    const parts = x.parts && x.parts.length ? x.parts : [];
    parts.forEach(p=>{
      add(p, cred(p));
      const syn = SYNERGY[p] || {};
      Object.keys(syn).forEach(sg=>add(sg, cred(sg)*syn[sg]));
    });
  });
  Object.keys(map).forEach(k=>map[k]=Math.round(map[k]));
  return map;
}
function fatigueOf(part){ return (fatigueMap()[part])||0; }
// grupos mais e menos descansados (pro assistente falar como treinador)
function fatigueInsight(){
  try{
    const map = fatigueMap();
    const cic = (typeof cicloAtual==='function') ? cicloAtual() : null;
    if(cic && cic.nome==='Deload') return `😌 Você entrou na <b>semana de recuperação</b> (deload). É normal bater vontade de pegar pesado — mas é justamente nesta fase que o corpo consolida os ganhos. Segura a mão que semana que vem você volta mais forte.`;
    const alta = Object.keys(map).filter(k=>map[k]>=70).sort((a,b)=>map[b]-map[a]);
    if(alta.length) return `💪 Seu <b>${alta[0].toLowerCase()}</b> ainda está se recuperando do treino intenso recente. Se notar queda de força hoje, priorize uma boa execução em vez de aumentar a carga — recuperação também é treino.`;
    // grupo esquecido há tempo
    const lifts = (((state.modules.lift||{}).history)||[]);
    if(lifts.length>=4){
      const ultimo = {};
      lifts.forEach(x=>(x.parts||[]).forEach(p=>{ ultimo[p]=Math.max(ultimo[p]||0, x.at); }));
      const alvo = Object.keys(ultimo).map(p=>({p, dias:Math.floor((Date.now()-ultimo[p])/86400000)})).sort((a,b)=>b.dias-a.dias)[0];
      if(alvo && alvo.dias>=6) return `📌 Faz <b>${alvo.dias} dias</b> que você não treina <b>${alvo.p}</b>. Vale encaixar esse grupo nos próximos dias pra manter o equilíbrio.`;
    }
    // 3 treinos intensos seguidos
    const recentes = lifts.filter(x=>Date.now()-x.at < 4*86400000).slice(-3);
    if(recentes.length===3 && recentes.every(x=>['cansado','exausto'].includes(x.feel)))
      return `😮‍💨 Foram <b>3 treinos intensos seguidos</b>. Dormir bem hoje vai render mais que qualquer série extra — o corpo cresce na recuperação.`;
    return null;
  }catch(e){ return null; }
}
function adaptMode(){
  const pain = (state.user && state.user.pain) || [];
  // ignora a flag de TPM em perfis masculinos (pode ter ficado ligada de versões antigas)
  const tpm = !!(state.user && state.user.tpmMode) && tpmAvailable();
  const cramp = !!(state.user && state.user.crampMode) && tpmAvailable();
  const leve = !!(state.user && state.user.lightMode); // modo leve por cansaço (qualquer perfil)
  return { active: pain.length>0 || tpm || cramp || leve, pain, tpm, cramp, leve };
}
function adaptReasonText(){
  const a = adaptMode();
  if(!a.active) return '';
  const partes = [];
  if(a.tpm) partes.push('TPM'); if(a.cramp) partes.push('cólica');
  if(a.leve) partes.push('cansaço');
  if(a.pain.length) partes.push(`dor (${a.pain.join(', ')})`);
  return partes.join(' + ');
}
// Regenera os treinos de musculação respeitando dor e TPM, e renomeia o treino
// pra refletir o que realmente vai ser treinado.
function regenLiftExercises(){
  const mod = state.modules.lift;
  if(!mod || !mod.plan) return;
  const a = adaptMode();
  mod.plan.workouts.forEach(w=>{
    w.originalParts = w.originalParts || [...(w.parts||[])]; // guarda os grupos originais uma única vez
    const blocked = painBlockedParts();
    const kept = w.originalParts.filter(p=>!blocked.has(p));
    let usar = kept.length ? [...kept] : (blocked.has('Core') ? [] : ['Core']);
    // A dor tirou grupos? Em vez de entregar um treino curto, completa com grupos SEGUROS
    // (os mais recuperados primeiro, priorizando grupos grandes) — mantém o volume do dia.
    const perdidos = w.originalParts.length - kept.length;
    if(perdidos > 0){
      const GRANDES = ['Costas','Pernas','Peito','Glúteos','Ombro'];
      // segurança extra: grupos que, embora liberados, exigem indiretamente a região dolorida
      const EVITAR_REFORCO = { 'Ombro':['Costas'], 'Punho/Cotovelo':['Costas'], 'Lombar':['Pernas'], 'Pescoço':['Costas'] };
      const evitar = new Set(); ((state.user&&state.user.pain)||[]).forEach(d=>(EVITAR_REFORCO[d]||[]).forEach(g=>evitar.add(g)));
      const jaUsados = new Set([...usar, ...w.originalParts]);
      const candidatos = EX_BANK.map(c=>c.name)
        .filter(g=>!blocked.has(g) && !jaUsados.has(g) && !evitar.has(g))
        .map(g=>({ g, score: ((typeof fatigueOf==='function')?fatigueOf(g):0) - (GRANDES.includes(g)?12:0) }))
        .sort((a,b)=>a.score-b.score);
      const reforco = candidatos.slice(0, perdidos).map(c=>c.g);
      usar = [...usar, ...reforco];
      w.reforcoParts = reforco;
    } else { w.reforcoParts = []; }
    w.parts = usar.length ? usar : w.originalParts; // se bloqueou tudo, mantém (mas avisa)
    w.exercises = buildLiftExercises(w.parts, mod.setup);
    applyPins(w, mod.setup); // respeita as trocas manuais do aluno
    // TPM, cansaço ou dor: reduz uma série (treino mais leve / proteção)
    if(a.tpm || a.cramp || a.leve || a.pain.length) w.exercises.forEach(ex=>{ ex.sets = Math.max(2, (parseInt(ex.sets)||3)-1); });
    w.duration = estimateLiftDuration(w.exercises, mod.setup.goal);
    // nome reflete o que será treinado de verdade
    const base = 'Treino '+w.k;
    w.name = w.parts.join(' + ');
    w.adapted = a.active && (w.parts.join()!==w.originalParts.join() || a.tpm || a.cramp);
    const _evit = w.originalParts.filter(p=>!w.parts.includes(p));
    w.adaptNote = w.adapted
      ? `Adaptado por ${adaptReasonText()}: ${_evit.length?`evitamos ${_evit.join(', ')}`:'volume reduzido'}.`
        + ((w.reforcoParts&&w.reforcoParts.length)?` Pra você não perder o dia, incluí ${w.reforcoParts.join(' e ')} — grupos seguros e bem descansados.`:'')
      : '';
  });
}
// Adapta os treinos de corrida quando há dor de impacto ou TPM
function regenRunPlan(){
  const mod = state.modules.run;
  if(!mod || !mod.plan) return;
  const a = adaptMode();
  const impacto = a.pain.some(p=>['Joelho','Tornozelo','Lombar'].includes(p));
  mod.plan.workouts.forEach(w=>{
    w.originalName = w.originalName || w.name;
    w.originalDuration = w.originalDuration || w.duration;
    w.originalDistance = w.originalDistance || w.distance;
    if(impacto){
      // troca corrida por caminhada/bike de baixo impacto
      w.name = '🚶 Caminhada leve (adaptado)';
      w.duration = Math.max(20, Math.round((w.originalDuration||30)*0.7));
      const km = parseFloat(String(w.originalDistance||'').replace(/[^\d.]/g,''))||3;
      w.distance = '~'+(Math.round(km*0.6*2)/2)+'km';
      w.adapted = true;
      w.adaptNote = `Adaptado por ${adaptReasonText()}: trocamos a corrida por caminhada leve pra tirar o impacto das articulações.`;
    } else if(a.pain.length && !impacto){
      // dor de membro superior (ombro, punho, pescoço): a corrida segue normal, só um lembrete
      w.name = w.originalName;
      w.duration = w.originalDuration;
      w.distance = w.originalDistance;
      w.adapted = true;
      w.adaptNote = `Sua dor (${a.pain.join(', ')}) não atrapalha a passada — mantivemos a corrida normal. Só evite tensionar a região e, se incomodar, encurte o treino.`;
    } else if(a.tpm || a.leve){
      w.name = w.originalName;
      w.duration = Math.max(15, Math.round((w.originalDuration||30)*0.75));
      w.adapted = true;
      w.adaptNote = a.tpm ? 'Adaptado por TPM: volume reduzido — vá no seu ritmo, sem cobrança.'
                          : 'Adaptado por cansaço: volume reduzido. Se o corpo pedir mais descanso, respeite.';
    } else {
      w.name = w.originalName;
      w.duration = w.originalDuration;
      w.distance = w.originalDistance;
      w.adapted = false;
      w.adaptNote = '';
    }
  });
}
function regenAllPlans(){ regenLiftExercises(); regenRunPlan(); }
function savePain(){
  const sel = [...document.querySelectorAll('#pain-areas .opt-multi.on')].map(o=>o.dataset.val);
  const antes = (state.user.pain||[]).slice();
  state.user.pain = sel;
  regenAllPlans();
  saveData();
  closeModal();
  const fim = ()=>{ toast(sel.length ? '🩹 Treinos adaptados pra proteger: '+sel.join(', ') : '✅ Sem dor registrada'); goTab(state.ui.tab||'home'); };
  // o plano é REALMENTE refeito aqui — vale mostrar o que mudou
  const mudou = antes.join('|') !== sel.join('|');
  if(!mudou){ fim(); return; }
  const steps = sel.length ? [
    {emo:'🩹', pri:1, txt:`Dor registrada: <b>${sel.join(', ')}</b>`},
    {emo:'🔁', pri:1, txt:`Tirando o que sobrecarrega e completando com <b>grupos seguros</b>`},
    {emo:'✅', pri:1, txt:`<b>Treinos adaptados!</b> Respeite seus limites hoje.`}
  ] : [
    {emo:'🎉', pri:1, txt:`Dor removida — <b>tudo liberado de novo</b>`},
    {emo:'🔁', pri:1, txt:`Devolvendo os exercícios que estavam pausados`},
    {emo:'✅', pri:1, txt:`<b>Treinos de volta ao normal!</b>`}
  ];
  try{
    runBuildingScreen('lift', steps, fim, {
      titulo: sel.length ? '🩹 Adaptando seus treinos' : '🎉 Liberando seus treinos',
      sub: sel.length ? 'Refazendo seu plano pra proteger a região dolorida sem você perder o dia.' : 'Recolocando os exercícios que estavam pausados pela dor.',
      passo: 1400
    });
  }catch(e){ fim(); }
}
function clearPain(){
  state.user.pain = [];
  state.user.tpmMode = false;
  state.user.lightMode = false;
  regenAllPlans();
  saveData();
  closeModal();
  const fim = ()=>{ toast('✅ Que bom! Treinos de volta ao normal.'); goTab(state.ui.tab||'home'); };
  try{
    runBuildingScreen('lift', [
      {emo:'🎉', pri:1, txt:`Tudo <b>liberado de novo</b>`},
      {emo:'🔁', pri:1, txt:`Devolvendo os exercícios que estavam pausados`},
      {emo:'✅', pri:1, txt:`<b>Treinos de volta ao normal!</b>`}
    ], fim, { titulo:'🎉 Liberando seus treinos', sub:'Recolocando tudo que estava pausado pela dor.', passo:1400 });
  }catch(e){ fim(); }
}

function quickChangeTerrain(terrain){
  const mod = state.modules.run;
  if(!mod || !mod.plan){ toast('Crie um plano de corrida primeiro'); closeModal(); return; }
  mod.setup.terrain = terrain;
  mod.plan.terrain = terrain;
  // Regenera os blocos de cada treino — dias, objetivo e nível permanecem
  mod.plan.workouts.forEach(w=>{
    const kind = (w.name||'').split(' — ')[0];
    w.blocks = buildRunBlocks(kind, mod.setup);
    w.duration = w.blocks.reduce((s,b)=>s+b.exs.reduce((x,e)=>x+(e.min||0),0),0);
    w.targetPace = runPace(kind, mod.setup);
  });
  saveData();
  closeModal();
  const lbl = {asfalto:'Asfalto', esteira:'Esteira', trilha:'Trilha', pista:'Pista'}[terrain]||terrain;
  toast(`🏃 Treinos regenerados para: ${lbl}`);
  goTab('profile');
}


// ---------- RECALIBRAÇÃO INTELIGENTE DA CORRIDA ----------
// Recalcula os alvos de cada treino a partir do que a pessoa REALMENTE correu
// (maior corrida dos últimos 21 dias), do nível e da proximidade da prova.
// Roda a cada registro de corrida e a cada abertura do app.
function recalibrateRunPlan(){
  const mod = state.modules.run;
  if(!mod || !mod.plan) return;
  const setup = mod.setup||{};
  const level = setup.level||'iniciante';
  // perfil suave (IMC alto/50+ iniciante) mantém a progressão protegida — não recalibra pra cima
  const p = state.user && state.user.profile;
  const imcVal = (()=>{ try{ const r=calcIMC(); return r?parseFloat(r.value):null; }catch(e){ return null; } })();
  if(level==='iniciante' && ((imcVal&&imcVal>=30)||(p&&p.age>=50))) return;

  const cutoff = Date.now()-21*86400000;
  const runs = (mod.history||[]).filter(r=>(!r.activity||r.activity==='corrida') && r.at>=cutoff);
  const longest = runs.length ? Math.max(...runs.map(r=>r.distance||0)) : 0;
  const levelBase = {iniciante:2, intermediario:4, avancado:6}[level]||2;
  const base = Math.max(longest, levelBase); // km de referência: o app aprende com o registro

  const raceKm = parseFloat(String(setup.goal||'').replace(/[^\d.]/g,''))||0;
  const dRace = (typeof daysToRace==='function') ? daysToRace() : null;
  const taper = dRace!==null && dRace>=0 && dRace<=10;
  const cw = currentWeek(mod);
  // longa cresce ~10% por semana do plano, mirando a distância da prova (sem passar dela antes do taper)
  let longaKm = base*0.9*(1+0.08*(cw.wk-1));
  if(raceKm) longaKm = Math.min(longaKm, raceKm);
  longaKm = Math.max(2, Math.min(32, longaKm));
  let leveKm = Math.max(2, Math.min(12, base*0.45));
  let ritmoKm = Math.max(2.5, Math.min(14, base*0.6));
  let intKm = Math.max(3, Math.min(12, base*0.55));
  if(taper){ longaKm*=0.5; leveKm*=0.7; ritmoKm*=0.6; intKm*=0.6; } // semana da prova: volume cai

  const paceMap = { // min/km típicos por nível e tipo
    leve:{iniciante:7.5,intermediario:6.5,avancado:5.5},
    ritmo:{iniciante:7.0,intermediario:6.0,avancado:5.0},
    longa:{iniciante:8.0,intermediario:7.0,avancado:6.0}
  };
  const nRepsFor = ()=> Math.min(12, base<=3?5 : base<=5?7 : base<=8?9 : 10);

  mod.plan.workouts.forEach(w=>{
    const kind = (w.name||'').split(' — ')[0];
    let km, mainMin, extra={};
    if(kind==='Corrida Longa'){ km=longaKm; mainMin=Math.round(km*paceMap.longa[level]); }
    else if(kind==='Ritmo Constante'){ km=ritmoKm; mainMin=Math.round(km*paceMap.ritmo[level]); }
    else if(kind==='Intervalado'){ km=intKm; extra._nReps=nRepsFor(); mainMin=null; }
    else { km=leveKm; mainMin=Math.round(km*paceMap.leve[level]); }
    w.distance = '~'+(Math.round(km*2)/2)+'km';
    w.blocks = buildRunBlocks(kind, {...setup, _mainMin:mainMin||undefined, ...extra});
    w.duration = w.blocks.reduce((s,b)=>s+b.exs.reduce((x,e)=>x+(e.min||0),0),0);
    w.targetPace = runPace(kind, setup);
  });
}
// treino de corrida já registrado hoje?
function runDoneToday(w){
  const today = new Date(); today.setHours(0,0,0,0);
  return (state.modules.run?.history||[]).some(h=>{
    if(h.id!==w.k) return false;
    const d=new Date(h.at); d.setHours(0,0,0,0);
    return d.getTime()===today.getTime();
  });
}

// ---------- INTELIGÊNCIA DE CORRIDA ----------
// Sugestão adaptativa: aprende com as últimas corridas registradas (distância vs alvo e sensação)
function runSmartSuggestion(w){
  const runs = (state.modules.run?.history||[]).filter(r=>!r.activity||r.activity==='corrida');
  if(!runs.length) return null;
  const last = runs[runs.length-1];
  const last2 = runs.slice(-2);
  const targetKm = parseFloat(String(w.distance||'').replace(/[^\d.]/g,'')) || 0;
  // duas últimas difíceis → reduzir
  if(last2.length>=2 && last2.every(r=>r.rating<=1)){
    return {emo:'🛑', txt:'Suas 2 últimas corridas foram difíceis. Hoje corte ~20% da distância ou troque por caminhada — recuperar faz parte do treino.'};
  }
  if(last.rating<=1){
    return {emo:'😌', txt:'A última corrida pesou. Hoje segure o ritmo mais leve que o alvo e encerre se sentir o corpo reclamar.'};
  }
  // vem correndo bem ACIMA do alvo do plano (padrão repetido) → sugerir subir o nível do plano
  const recentBig = runs.slice(-3).filter(r=>{ const wk=state.modules.run?.plan?.workouts?.find(x=>x.name===r.name); return wk && wk.targetKm && r.distance >= wk.targetKm*1.3; });
  if(recentBig.length>=2){
    return {emo:'🚀', txt:'Você vem correndo bem além do que o plano pede! Sinal de evolução real — vá no Perfil → Meu plano → Recriar plano e suba o nível ou a distância-alvo pra o treino acompanhar seu ritmo.'};
  }
  // passou muito do alvo na última (pontual) → segurar hoje
  if(targetKm>0 && last.distance > targetKm*1.4){
    return {emo:'⚖️', txt:`Na última você foi bem além do alvo (${last.distance}km). Ótimo sinal — mas hoje respeite a distância do treino: o descanso relativo é o que transforma esforço em evolução.`};
  }
  // duas últimas ótimas → pode puxar um pouco
  if(last2.length>=2 && last2.every(r=>r.rating>=5)){
    return {emo:'📈', txt:'Duas corridas seguidas se sentindo ótimo! Se o corpo pedir, pode esticar ~10% na distância ou apertar levemente o ritmo hoje.'};
  }
  return null;
}
// Dica personalizada pra prova alvo: combina dias restantes, distância da prova,
// perfil (iniciante/IMC/idade) e a maior corrida recente registrada
function raceSmartTip(daysToR){
  const setup = state.modules.run?.setup || {};
  const raceKm = parseFloat(String(setup.goal||'').replace(/[^\d.]/g,'')) || 5;
  const runs = (state.modules.run?.history||[]).filter(r=>!r.activity||r.activity==='corrida');
  const longest = runs.length ? Math.max(...runs.map(r=>r.distance||0)) : 0;
  const p = state.user && state.user.profile;
  const imcVal = (()=>{ try{ const r=calcIMC(); return r?parseFloat(r.value):null; }catch(e){ return null; } })();
  const gentle = (setup.level==='iniciante')
    || (imcVal && imcVal>=32 && setup.level!=='avancado')
    || (p && p.age>=60);
  const weeks = Math.ceil(daysToR/7);
  const tips = [];
  if(longest>0 && longest < raceKm*0.6 && daysToR<=14){
    tips.push(`Sua maior corrida registrada foi ${longest}km e a prova tem ${raceKm}km — com ${daysToR} dias, talvez não dê pra correr tudo, e está TUDO BEM: intercalar corrida e caminhada na prova é estratégia inteligente, não fracasso. Defina blocos (ex: corre 5 min, caminha 2) e cruze a linha sorrindo.`);
  } else if(longest>0 && longest < raceKm*0.8 && daysToR>14){
    tips.push(`Sua maior corrida foi ${longest}km. Faltam ${weeks} semanas: aumente a corrida longa ~10% por semana até chegar perto de ${Math.round(raceKm*0.9)}km — dá tempo, sem pressa.`);
  } else if(longest >= raceKm && daysToR>7){
    tips.push(`Você já cobriu ${longest}km em treino — a distância da prova está no bolso. Agora o jogo é chegar descansado: não invente treino heroico nessa reta.`);
  }
  if(gentle && daysToR<=21){
    tips.push('Pelo seu perfil, priorize terminar bem em vez de terminar rápido: comece a prova mais devagar do que parece necessário — no final você agradece.');
  }
  return tips.length ? tips[0] : null;
}

// ---------- TROCA RÁPIDA DE EQUIPAMENTO / TERRENO ----------
function quickChangeEquip(equip){
  const mod = state.modules.lift;
  if(!mod || !mod.plan){ toast('Crie um plano de musculação primeiro'); closeModal(); return; }
  if(mod.setup.equip === equip){ toast('Esse já é o seu equipamento atual 🙂'); closeModal(); return; }
  // guarda os nomes antigos pra mostrar ao aluno QUANTOS exercícios realmente mudaram
  const antes = new Set();
  (mod.plan.workouts||[]).forEach(w=>(w.exercises||[]).forEach(e=>antes.add(e.id)));
  mod.setup.equip = equip;
  // Regenera SÓ os exercícios de cada treino — dias, objetivo e nível permanecem
  regenAllPlans(); // regenera respeitando dor/TPM e reaplicando os exercícios fixados
  saveData();
  closeModal();
  let mudou = 0, total = 0;
  (mod.plan.workouts||[]).forEach(w=>(w.exercises||[]).forEach(e=>{ total++; if(!antes.has(e.id)) mudou++; }));
  const lbl = {academia:'Academia completa', halteres:'Só halteres', casa:'Peso do corpo', basico:'Academia básica'}[equip]||equip;
  const fim = ()=>{
    toast(mudou
      ? `🏋️ ${lbl}: ${mudou} de ${total} exercícios foram trocados`
      : `🏋️ ${lbl}: seus exercícios já serviam pro novo equipamento`);
    goTab('sessions'); // leva pra onde dá pra VER a mudança
  };
  try{
    runBuildingScreen('lift', [
      {emo:'🏋️', pri:1, txt:`Novo equipamento: <b>${lbl}</b>`},
      {emo:'🔁', pri:1, txt:`Refazendo seus treinos com os <b>${countExercisesFor(equip)} exercícios</b> disponíveis`},
      {emo:'✅', pri:1, txt: mudou ? `<b>${mudou} de ${total} exercícios</b> foram trocados` : `<b>Pronto!</b> Seus exercícios já serviam pro novo equipamento`}
    ], fim, { titulo:'🏋️ Atualizando seus treinos', sub:'Trocando os exercícios pro novo equipamento — objetivo, dias e nível continuam os mesmos.', passo:1400 });
  }catch(e){ fim(); }
}

// ---------- FOTO DE PERFIL ----------
function removePhoto(){
  if(!state.user || !state.user.profile || !state.user.profile.photo) return;
  appConfirm('Quer remover sua foto de perfil?', ()=>{
    state.user.profile.photo = null;
    saveData(); syncToCloud();
    toast('🗑️ Foto removida');
    goTab('profile');
  }, {title:'Remover foto?', emo:'🗑️', okLabel:'Sim, remover', danger:true});
}

// ---------- RESUMO DA SEMANA + COMPARTILHAMENTO ----------
function weekStats(){
  const today = getDayIdx();
  const startWk = new Date(); startWk.setHours(0,0,0,0); startWk.setDate(startWk.getDate()-(today-1));
  const t0 = startWk.getTime();
  const liftH = (state.modules.lift?.history||[]).filter(h=>h.at>=t0);
  const runH = (state.modules.run?.history||[]).filter(h=>h.at>=t0);
  const kmBy = type => runH.filter(r=>type==='corrida' ? (!r.activity||r.activity==='corrida') : r.activity===type).reduce((s,r)=>s+(r.distance||0),0);
  const totalMin = Math.round([...liftH,...runH].reduce((s,x)=>s+(x.duration||0),0));
  return { lift:liftH.length, runs:runH.filter(r=>!r.activity||r.activity==='corrida').length,
    walks:runH.filter(r=>r.activity==='caminhada').length, bikes:runH.filter(r=>r.activity==='bike').length,
    kmRun:kmBy('corrida'), kmWalk:kmBy('caminhada'), kmBike:kmBy('bike'), totalMin, total:liftH.length+runH.length };
}
function openWeekSummary(){
  const s = weekStats();
  const rows = [];
  if(s.lift) rows.push(`💪 ${s.lift} treino${s.lift>1?'s':''} de musculação`);
  if(s.runs) rows.push(`🏃 ${s.runs} corrida${s.runs>1?'s':''} · ${s.kmRun.toFixed(1)}km`);
  if(s.walks) rows.push(`🚶 ${s.walks} caminhada${s.walks>1?'s':''} · ${s.kmWalk.toFixed(1)}km`);
  if(s.bikes) rows.push(`🚴 ${s.bikes} pedal${s.bikes>1?'is':''} · ${s.kmBike.toFixed(1)}km`);
  const body = s.total
    ? `<div style="font-size:15px;line-height:2">${rows.join('<br>')}</div><p style="color:var(--text-dim);font-size:13px;margin-top:10px">⏱️ ${s.totalMin} minutos em movimento essa semana. Continue assim!</p>`
    : `<p style="color:var(--text-dim);font-size:14px">Nenhum treino registrado essa semana ainda — mas a semana não acabou! 😉</p>`;
  $('modal-inner').innerHTML = `<h3>📊 Resumo da semana</h3>${body}
    ${s.total?`<button class="btn btn-primary btn-block" style="margin-top:14px" onclick="shareWeekImage()">📤 Compartilhar resumo</button>`:''}
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
// Gera uma imagem com a marca do MetaTreino e compartilha (ou baixa)
// Gráfico de evolução no histórico: volume/semana (musculação) ou km/semana (corrida), últimas 8 semanas
function renderHistEvolution(isLift, h){
  const box = $('hist-evo'); if(!box) return;
  const now = Date.now();
  const vals = [];
  for(let i=7;i>=0;i--){
    const a = now-(i+1)*7*86400000, b = now-i*7*86400000;
    if(isLift) vals.push(calcVolumeBetween(a,b));
    else vals.push(h.filter(x=>x.at>=a&&x.at<b).reduce((s,r)=>s+(r.distance||0),0));
  }
  const max = Math.max(...vals);
  if(max<=0){ box.style.display='none'; return; }
  box.style.display='block';
  $('hist-evo-title').textContent = isLift ? '📈 Volume levantado por semana (kg)' : '📈 Km por semana';
  const svg = $('hist-evo-svg');
  const barW = 34, gap = (400 - 8*barW) / 9;
  svg.innerHTML = vals.map((v,i)=>{
    const hgt = max>0 ? Math.max(2, (v/max)*110) : 2;
    const x = gap + i*(barW+gap);
    const cur = i===7;
    return `<rect x="${x}" y="${130-hgt}" width="${barW}" height="${hgt}" rx="6" fill="${cur?'#10b981':'rgba(16,185,129,0.35)'}"/>
      ${v>0?`<text x="${x+barW/2}" y="${124-hgt}" text-anchor="middle" fill="${cur?'#34d399':'#64748b'}" font-size="9.5" font-weight="700">${isLift?Math.round(v):v.toFixed(1)}</text>`:''}
      <text x="${x+barW/2}" y="146" text-anchor="middle" fill="#64748b" font-size="9">S${i+1}</text>`;
  }).join('');
  $('hist-evo-sub').textContent = isLift
    ? 'Soma de peso × repetições de todas as séries registradas em cada semana. S8 = semana atual.'
    : 'Km somados de corrida, caminhada e bike em cada semana. S8 = semana atual.';
}

// Card no estilo clássico do MetaTreino: moldura, marca, grade de stats e lista de exercícios
function buildShareCanvas(opts){
  // opts: {title, subtitle, stats:[{rotulo,valor}] (até 4), listaTitulo, lista:[], destaque}
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  // fundo gradiente escuro → verde
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#050914');
  g.addColorStop(0.5, '#06281f');
  g.addColorStop(1, '#0a3d2e');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // círculos decorativos
  x.globalAlpha = 0.10; x.fillStyle = '#10b981';
  x.beginPath(); x.arc(915, 170, 180, 0, Math.PI*2); x.fill();
  x.beginPath(); x.arc(120, 1120, 230, 0, Math.PI*2); x.fill();
  x.globalAlpha = 1;
  // painel central
  roundRect(x, 70, 60, W-140, H-120, 58);
  x.fillStyle = 'rgba(5, 9, 20, 0.80)'; x.fill();
  x.strokeStyle = 'rgba(16, 185, 129, 0.40)'; x.lineWidth = 3; x.stroke();
  // marca
  x.textAlign = 'left';
  x.fillStyle = '#10b981';
  x.font = '900 42px Arial, sans-serif';
  x.fillText('Meta', 115, 145);
  x.fillStyle = '#ffffff';
  x.fillText('Treino', 213, 145);
  x.fillStyle = '#6ee7b7';
  x.font = '700 26px Arial, sans-serif';
  x.fillText('treino inteligente do dia', 115, 183);
  // título e subtítulo
  x.fillStyle = '#ffffff';
  x.font = '900 66px Arial, sans-serif';
  x.fillText(cutTxt(x, opts.title||'Atividade concluída', 850), 115, 292);
  x.fillStyle = '#a7f3d0';
  x.font = '800 36px Arial, sans-serif';
  x.fillText(cutTxt(x, opts.subtitle||'MetaTreino', 850), 115, 352);
  // grade de stats 2×2
  const stats = (opts.stats||[]).slice(0,4);
  const boxW = 405, boxH = 132;
  stats.forEach((item,i)=>{
    const col = i%2, row = Math.floor(i/2);
    const bx = 115 + col*435, by = 430 + row*156;
    roundRect(x, bx, by, boxW, boxH, 28);
    x.fillStyle = 'rgba(255,255,255,0.08)'; x.fill();
    x.strokeStyle = 'rgba(16,185,129,0.35)'; x.lineWidth = 2; x.stroke();
    x.fillStyle = '#94a3b8';
    x.font = '800 24px Arial, sans-serif';
    x.fillText(cutTxt(x, String(item.rotulo||''), boxW-56), bx+28, by+42);
    x.fillStyle = '#ffffff';
    x.font = '900 37px Arial, sans-serif';
    x.fillText(cutTxt(x, String(item.valor||''), boxW-56), bx+28, by+92);
  });
  // caixa de lista (exercícios por grupo muscular)
  const listaX = 115, listaY = 775, listaW = 850, listaH = 330;
  roundRect(x, listaX, listaY, listaW, listaH, 32);
  x.fillStyle = 'rgba(5, 9, 20, 0.65)'; x.fill();
  x.strokeStyle = 'rgba(16,185,129,0.40)'; x.lineWidth = 2; x.stroke();
  x.save();
  roundRect(x, listaX+2, listaY+2, listaW-4, listaH-4, 30); x.clip();
  x.fillStyle = '#6ee7b7';
  x.font = '900 29px Arial, sans-serif';
  x.fillText(cutTxt(x, opts.listaTitulo||'Resumo', 780), 145, listaY+56);
  x.fillStyle = '#ffffff';
  x.font = '700 26px Arial, sans-serif';
  let yL = listaY + 106;
  const lista = (opts.lista&&opts.lista.length)?opts.lista:['Atividade registrada com sucesso'];
  const vis = lista.slice(0,6);
  vis.forEach((item,i)=>{
    let t = '• ' + item;
    if(i===5 && lista.length>6) t = '• +' + (lista.length-5) + ' registro(s)';
    if(x.measureText(t).width <= 790){ x.fillText(t, 145, yL); yL += 38; }
    else {
      // quebra em 2 linhas em vez de cortar com "..."
      const words = t.split(' '); let l1='', k=0;
      while(k<words.length && x.measureText(l1+words[k]+' ').width<=790){ l1+=words[k]+' '; k++; }
      x.fillText(l1.trim(), 145, yL); yL += 34;
      x.fillText(cutTxt(x, '   '+words.slice(k).join(' '), 760), 145, yL); yL += 38;
    }
  });
  x.restore();
  // destaque e rodapé
  x.fillStyle = '#ffffff';
  x.font = '900 34px Arial, sans-serif';
  x.fillText(cutTxt(x, opts.destaque||'Treinei hoje com MetaTreino 💪', 850), 115, 1170);
  x.fillStyle = '#6ee7b7';
  x.font = '700 24px Arial, sans-serif';
  x.fillText('MetaTreino • treinos inteligentes que evoluem com você', 115, 1235);
  x.fillStyle = '#34d399';
  x.font = '700 21px Arial, sans-serif';
  x.fillText('MetaTreino App', 115, 1268);
  return c;
}
// ===== RESUMO DA SEMANA (com gráfico por dia) =====
// Junta os 7 dias e devolve os números da semana, no módulo ativo.
function weekSummaryData(){
  const isLift = state.active==='lift';
  const mod = state.modules[state.active] || {};
  const hist = mod.history || [];
  const h0 = new Date(); h0.setHours(0,0,0,0);
  const ini = new Date(h0); ini.setDate(ini.getDate()-6);            // últimos 7 dias (hoje incluso)
  const dias = [];
  for(let i=0;i<7;i++){
    const d = new Date(ini); d.setDate(d.getDate()+i);
    const fim = new Date(d); fim.setDate(fim.getDate()+1);
    const doDia = hist.filter(x=>x.at>=d.getTime() && x.at<fim.getTime());
    dias.push({
      data: d,
      valor: isLift ? doDia.reduce((a,x)=>a+(x.duration||0),0) : doDia.reduce((a,x)=>a+(x.distance||0),0),
      n: doDia.length
    });
  }
  const daSemana = hist.filter(x=>x.at>=ini.getTime());
  const totalMin = daSemana.reduce((a,x)=>a+(x.duration||0),0);
  const totalKm  = daSemana.reduce((a,x)=>a+(x.distance||0),0);
  const fmtD = d => d.toLocaleDateString('pt-BR',{day:'numeric', month:'short'}).replace('.','');
  return {
    isLift, dias, n: daSemana.length,
    totalMin, totalKm: Math.round(totalKm*10)/10,
    kcal: Math.round(totalMin*7),                                    // estimativa simples, igual à do assistente
    periodo: `${fmtD(ini)} – ${fmtD(h0)} de ${h0.getFullYear()}`,
    vazio: daSemana.length===0
  };
}
// Arte do resumo semanal: foto opcional de fundo + número grande + 3 stats + gráfico de barras
function buildWeekCanvas(img, d){
  const W=1080, H=1350;
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d');
  if(img){
    const ir=img.width/img.height, cr=W/H;
    let sw,sh,sx,sy;
    if(ir>cr){ sh=img.height; sw=sh*cr; sx=(img.width-sw)/2; sy=0; }
    else { sw=img.width; sh=sw/cr; sx=0; sy=(img.height-sh)/2; }
    x.drawImage(img, sx,sy,sw,sh, 0,0,W,H);
    x.fillStyle='rgba(4,10,18,.62)'; x.fillRect(0,0,W,H);            // véu pro texto respirar
  } else {
    const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,'#0b1622'); g.addColorStop(1,'#071018');
    x.fillStyle=g; x.fillRect(0,0,W,H);
    x.fillStyle='rgba(16,185,129,.07)'; x.beginPath(); x.arc(W*0.85,H*0.12,300,0,Math.PI*2); x.fill();
  }
  x.textAlign='left';
  x.fillStyle='#10b981'; x.font='900 38px Arial, sans-serif'; x.fillText('Meta',60,92);
  x.fillStyle='#ffffff'; x.fillText('Treino',60+x.measureText('Meta').width+4,92);
  x.fillStyle='rgba(255,255,255,.6)'; x.font='700 26px Arial, sans-serif';
  x.fillText(d.periodo, 60, 165);
  // número grande
  const grande = d.isLift ? String(d.n) : String(d.totalKm).replace('.',',');
  x.fillStyle='#ffffff'; x.font='900 150px Arial, sans-serif';
  x.fillText(grande, 60, 320);
  const un = d.isLift ? (d.n===1?'treino na semana':'treinos na semana') : 'quilômetros';
  x.fillStyle='rgba(255,255,255,.66)'; x.font='800 30px Arial, sans-serif';
  x.fillText(un, 60, 368);
  // 3 stats
  const stats = d.isLift
    ? [['SESSÕES', String(d.n)], ['TEMPO TOTAL', fmtDur(d.totalMin)], ['QUEIMOU', d.kcal+' kcal']]
    : [['ATIVIDADES', String(d.n)], ['TEMPO TOTAL', fmtDur(d.totalMin)], ['QUEIMOU', d.kcal+' kcal']];
  let bx=60;
  stats.forEach(([rot,val])=>{
    x.fillStyle='rgba(255,255,255,.55)'; x.font='800 22px Arial, sans-serif'; x.fillText(rot, bx, 448);
    x.fillStyle='#ffffff'; x.font='900 44px Arial, sans-serif'; x.fillText(val, bx, 500);
    bx += Math.max(x.measureText(val).width, 150) + 65;
  });
  // gráfico de barras (7 dias)
  const gx=60, gy=620, gw=W-120, gh=430;
  const max = Math.max(...d.dias.map(v=>v.valor), 1);
  const bw = gw/7*0.62, gap = gw/7;
  x.strokeStyle='rgba(255,255,255,.12)'; x.lineWidth=2;
  x.beginPath(); x.moveTo(gx, gy+gh); x.lineTo(gx+gw, gy+gh); x.stroke();
  const nomes=['dom','seg','ter','qua','qui','sex','sáb'];
  d.dias.forEach((dia,i)=>{
    const bh = dia.valor>0 ? Math.max(14, (dia.valor/max)*(gh-40)) : 5;
    const px = gx + i*gap + (gap-bw)/2;
    const py = gy+gh-bh;
    const g2 = x.createLinearGradient(0,py,0,gy+gh);
    if(dia.valor>0){ g2.addColorStop(0,'#34d399'); g2.addColorStop(1,'#10b981'); }
    else { g2.addColorStop(0,'rgba(255,255,255,.14)'); g2.addColorStop(1,'rgba(255,255,255,.08)'); }
    x.fillStyle=g2;
    const r=Math.min(12,bw/2);
    x.beginPath();
    x.moveTo(px, gy+gh); x.lineTo(px, py+r); x.quadraticCurveTo(px, py, px+r, py);
    x.lineTo(px+bw-r, py); x.quadraticCurveTo(px+bw, py, px+bw, py+r);
    x.lineTo(px+bw, gy+gh); x.closePath(); x.fill();
    // valor em cima da barra
    if(dia.valor>0){
      x.fillStyle='#ffffff'; x.font='800 22px Arial, sans-serif'; x.textAlign='center';
      const rot = d.isLift ? Math.round(dia.valor)+'min' : (Math.round(dia.valor*10)/10).toString().replace('.',',');
      x.fillText(rot, px+bw/2, py-12);
      x.textAlign='left';
    }
    x.fillStyle='rgba(255,255,255,.5)'; x.font='700 21px Arial, sans-serif'; x.textAlign='center';
    x.fillText(nomes[dia.data.getDay()], px+bw/2, gy+gh+34);
    x.textAlign='left';
  });
  x.fillStyle='rgba(255,255,255,.85)'; x.font='700 26px Arial, sans-serif';
  x.fillText(d.isLift ? 'Minha semana de treinos 💪' : 'Minha semana de corrida 🏃', 60, H-92);
  x.fillStyle='#34d399'; x.font='700 22px Arial, sans-serif';
  x.fillText('metatreino.app', 60, H-52);
  return c;
}
function shareWeekSummary(){
  const d = weekSummaryData();
  if(d.vazio){ toast('📭 Sem atividades nos últimos 7 dias — treine e volte aqui!'); return; }
  const c = buildWeekCanvas(null, d);
  _lastPhotoOpts = { semana:d, filename:'metatreino-semana.png', shareText:'Minha semana no MetaTreino 💪' };
  shareCanvas(c, 'metatreino-semana.png', 'Minha semana no MetaTreino 💪');
}
// Modo Foto: a FOTO da pessoa é o fundo; as infos entram discretas por cima
function buildPhotoShareCanvas(img, opts){
  const W=1080, H=1350;
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d');
  // foto em modo "cover" (preenche sem distorcer)
  const ir=img.width/img.height, cr=W/H;
  let sw,sh,sx,sy;
  if(ir>cr){ sh=img.height; sw=sh*cr; sx=(img.width-sw)/2; sy=0; }
  else { sw=img.width; sh=sw/cr; sx=0; sy=(img.height-sh)/2; }
  x.drawImage(img, sx,sy,sw,sh, 0,0,W,H);
  // gradientes suaves só onde tem texto (topo e base)
  let g=x.createLinearGradient(0,0,0,300); g.addColorStop(0,'rgba(0,0,0,.55)'); g.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=g; x.fillRect(0,0,W,300);
  g=x.createLinearGradient(0,H-560,0,H); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(.45,'rgba(0,0,0,.55)'); g.addColorStop(1,'rgba(0,0,0,.88)');
  x.fillStyle=g; x.fillRect(0,H-560,W,560);
  // marca pequena no topo
  x.textAlign='left';
  x.fillStyle='#10b981'; x.font='900 40px Arial, sans-serif'; x.fillText('Meta',60,100);
  x.fillStyle='#ffffff'; x.fillText('Treino',60+x.measureText('Meta').width+4,100);
  // bloco inferior discreto
  x.fillStyle='#ffffff'; x.font='900 60px Arial, sans-serif';
  x.fillText(cutTxt(x, opts.title||'Treino concluído 💪', 960), 60, H-360);
  x.fillStyle='#a7f3d0'; x.font='800 33px Arial, sans-serif';
  x.fillText(cutTxt(x, opts.subtitle||'', 960), 60, H-306);
  // stats na horizontal (valor grande, rótulo pequeno)
  const st=(opts.stats||[]).slice(0,3);
  let bx=60;
  st.forEach(item=>{
    x.fillStyle='rgba(255,255,255,.65)'; x.font='800 23px Arial, sans-serif';
    x.fillText(String(item.rotulo||''), bx, H-226);
    x.fillStyle='#ffffff'; x.font='900 45px Arial, sans-serif';
    const v=String(item.valor||'');
    x.fillText(v, bx, H-172);
    bx += Math.max(x.measureText(v).width, 120) + 70;
  });
  // linha discreta (grupos do treino)
  if(opts.linhaDiscreta){
    x.fillStyle='rgba(255,255,255,.85)'; x.font='700 26px Arial, sans-serif';
    x.fillText(cutTxt(x, opts.linhaDiscreta, 960), 60, H-106);
  }
  x.fillStyle='#34d399'; x.font='700 22px Arial, sans-serif';
  x.fillText('metatreino.app', 60, H-56);
  return c;
}
let _lastPhotoOpts = null;
function pickSharePhoto(){ const i=document.getElementById('share-photo-input'); if(i) i.click(); }
function onSharePhotoPicked(ev){
  const f = ev.target.files && ev.target.files[0]; if(!f || !_lastPhotoOpts) return;
  const r = new FileReader();
  r.onload = ()=>{
    const img = new Image();
    img.onload = ()=>{
      const c = _lastPhotoOpts.semana
        ? buildWeekCanvas(img, _lastPhotoOpts.semana)
        : buildPhotoShareCanvas(img, _lastPhotoOpts);
      shareCanvas(c, _lastPhotoOpts.filename||'metatreino-foto.png', _lastPhotoOpts.shareText||'Treinei hoje com MetaTreino 💪');
    };
    img.src = r.result;
  };
  r.readAsDataURL(f);
}
function cutTxt(x, txt, maxW){
  if(x.measureText(txt).width <= maxW) return txt;
  while(txt.length>2 && x.measureText(txt+'…').width > maxW) txt = txt.slice(0,-1);
  return txt+'…';
}
function roundRect(x, px, py, w, h, r){
  x.beginPath();
  x.moveTo(px+r, py);
  x.arcTo(px+w, py, px+w, py+h, r);
  x.arcTo(px+w, py+h, px, py+h, r);
  x.arcTo(px, py+h, px, py, r);
  x.arcTo(px, py, px+w, py, r);
  x.closePath();
}
let _lastShareBlob = null, _lastShareName = 'metatreino.png';
async function shareCanvas(canvas, filename, shareText){
  canvas.toBlob(async blob=>{
    if(!blob){ toast('⚠️ Não foi possível gerar a imagem'); return; }
    _lastShareBlob = blob; _lastShareName = filename;
    // mostra um modal com as duas opções: compartilhar OU salvar no celular
    $('modal-inner').innerHTML = `
      <h3>📤 Compartilhar</h3>
      <p style="color:var(--text-dim);font-size:13px;line-height:1.5">A imagem está pronta! Escolha como quer usá-la. Se for postar no Instagram Stories, <b>salvar no celular</b> e postar pela galeria costuma dar o melhor resultado.</p>
      <img src="${URL.createObjectURL(blob)}" style="width:100%;border-radius:var(--radius-note);margin:12px 0;border:1px solid var(--border)">
      <button class="btn btn-primary btn-block" onclick="doShareNow('${shareText.replace(/'/g,"\\'")}')">📲 Compartilhar agora</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="doSaveToDevice()">💾 Salvar no celular</button>
      ${_lastPhotoOpts?`<button class="btn btn-outline btn-block" class="hl-primary" style="margin-top:8px" onclick="pickSharePhoto()">📷 Usar minha foto de fundo</button>
      <input type="file" id="share-photo-input" accept="image/*" style="display:none" onchange="onSharePhotoPicked(event)">`:''}
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
    $('modal-back').classList.add('on');
  }, 'image/png');
}
async function doShareNow(shareText){
  if(!_lastShareBlob) return;
  const file = new File([_lastShareBlob], _lastShareName, {type:'image/png'});
  if(navigator.canShare && navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file], text:shareText}); }catch(e){ /* cancelou */ }
  } else {
    doSaveToDevice();
  }
}
function doSaveToDevice(){
  if(!_lastShareBlob) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(_lastShareBlob); a.download = _lastShareName; a.click();
  toast('💾 Imagem salva na galeria/downloads!');
}
// Agrupa exercícios feitos por grupo muscular: "Quadríceps: Hack Machine, Cadeira Extensora"
function groupByPart(exercisesDone){
  const map = {};
  (exercisesDone||[]).forEach(e=>{
    const p = e.part||'Outros';
    (map[p] = map[p]||[]).push(String(e.name||'').replace(/\s*\([^)]*\)/g,''));
  });
  return Object.entries(map).map(([part,names])=>`${part}: ${names.join(', ')}`);
}
function shareWeekImage(){
  const s = weekStats();
  const lista = [];
  if(s.lift) lista.push(`💪 ${s.lift} treino${s.lift>1?'s':''} de musculação`);
  if(s.runs) lista.push(`🏃 ${s.runs} corrida${s.runs>1?'s':''} · ${s.kmRun.toFixed(1)}km`);
  if(s.walks) lista.push(`🚶 ${s.walks} caminhada${s.walks>1?'s':''} · ${s.kmWalk.toFixed(1)}km`);
  if(s.bikes) lista.push(`🚴 ${s.bikes} pedal${s.bikes>1?'is':''} · ${s.kmBike.toFixed(1)}km`);
  const c = buildShareCanvas({
    title:'Minha semana de treinos',
    subtitle:'Semana de '+new Date().toLocaleDateString('pt-BR'),
    stats:[
      {rotulo:'Atividades', valor:String(s.total)},
      {rotulo:'Em movimento', valor:s.totalMin+' min'},
      {rotulo:'Musculação', valor:String(s.lift)},
      {rotulo:'Km na semana', valor:(s.kmRun+s.kmWalk+s.kmBike).toFixed(1)+' km'}
    ],
    listaTitulo:'O que rolou na semana',
    lista,
    destaque:'Mais uma semana concluída 🔥'
  });
  shareCanvas(c, 'metatreino-semana.png', 'Minha semana de treinos no MetaTreino 💪');
}
function shareTrophiesImage(){
  const unlocked = TROPHIES.filter(t=>state.trophies.includes(t.id));
  if(!unlocked.length){ toast('Você ainda não desbloqueou conquistas — bora treinar! 💪'); return; }
  // pega as conquistas mais "raras"/recentes pra destacar (últimas da lista de desbloqueadas)
  const destaque = unlocked.slice(-6).map(t=>t.emoji+' '+t.name);
  const c = buildShareCanvas({
    title:'Minhas conquistas 🏆',
    subtitle:unlocked.length+' de '+TROPHIES.length+' conquistas',
    stats:[
      {rotulo:'Desbloqueados', valor:String(unlocked.length)},
      {rotulo:'Progresso', valor:Math.round(unlocked.length/TROPHIES.length*100)+'%'},
      {rotulo:'Musculação', valor:String(unlocked.filter(t=>t.cat==='lift').length)},
      {rotulo:'Corrida', valor:String(unlocked.filter(t=>t.cat==='run').length)}
    ],
    listaTitulo:'Conquistas em destaque',
    lista:destaque,
    destaque:'Colecionando vitórias no MetaTreino 🏆'
  });
  shareCanvas(c, 'metatreino-conquistas.png', 'Minhas conquistas no MetaTreino 🏆');
}
// Depois de concluir um treino, oferece (sem obrigar) compartilhar a imagem.
function offerShareAfterWorkout(histIdx){
  const h = (state.modules.lift?.history||[])[histIdx];
  if(!h) return;
  $('modal-inner').innerHTML = `
    <div style="text-align:center">
      <div class="anim-check" style="font-size:60px;line-height:1">✅</div>
      <h3 style="margin-top:6px">Treino concluído!</h3>
      <p style="color:var(--text-dim);font-size:13.5px;line-height:1.5">${h.name}<br>${h.duration} min${(h.exercisesDone||[]).length?` · ${h.exercisesDone.length} exercícios`:''}</p>
    </div>
    <button class="btn btn-primary btn-block anim-glow" style="margin-top:12px" onclick="shareWorkoutImage(${histIdx})">📸 Compartilhar meu treino</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Agora não</button>`;
  $('modal-back').classList.add('on');
}
function shareWorkoutImage(histIdx){
  const mod = state.modules[state.active];
  const x = (mod.history||[])[histIdx];
  if(!x) return;
  const d = new Date(x.at);
  const isRun = x.module==='run';
  const feelLbl = {otimo:'Muito bem 🚀', bem:'Bem 😊', cansado:'Cansado 😮‍💨', exausto:'Exausto 😩'}[x.feel];
  if(isRun){
    const atv = x.activity==='caminhada'?'Caminhada':x.activity==='bike'?'Bike':'Corrida';
    const emo = x.activity==='caminhada'?'🚶':x.activity==='bike'?'🚴':'🏃';
    const c = buildShareCanvas({
      title:`${atv} concluída ${emo}`,
      subtitle:d.toLocaleDateString('pt-BR'),
      stats:[
        {rotulo:'Distância', valor:(x.distance||0)+' km'},
        {rotulo:'Tempo', valor:fmtDur(x.duration)},
        {rotulo:'Ritmo médio', valor:x.pace||'—'},
        {rotulo:'Sensação', valor:x.rating>=5?'Ótimo 🚀':x.rating<=1?'Difícil 😩':'Normal 😊'}
      ],
      listaTitulo:'Atividade',
      lista:[x.name.replace(/^[🚶🚴🏃]\\s*/u,'')],
      destaque:'Treinei hoje com MetaTreino 💪'
    });
    _lastPhotoOpts = { title:`${atv} concluída ${emo}`, subtitle:d.toLocaleDateString('pt-BR'),
      stats:[{rotulo:'DISTÂNCIA', valor:(x.distance||0)+' km'},{rotulo:'TEMPO', valor:fmtDur(x.duration)},{rotulo:'RITMO', valor:x.pace||'—'}],
      linhaDiscreta:null, filename:'metatreino-atividade.png', shareText:`${atv} concluída no MetaTreino ${emo}` };
    shareCanvas(c, 'metatreino-atividade.png', `${atv} concluída no MetaTreino ${emo}`);
    return;
  }
  const parts = partsFromEntry(x);
  const lista = (x.exercisesDone&&x.exercisesDone.length) ? groupByPart(x.exercisesDone) : parts.map(p=>p);
  const c = buildShareCanvas({
    title:'Treino concluído 💪',
    subtitle:x.name,
    stats:[
      {rotulo:'Exercícios', valor:String((x.exercisesDone||[]).length||'Salvo')},
      {rotulo:'Duração', valor:x.duration+' min'},
      {rotulo:'Músculos', valor:parts.slice(0,2).join(' + ')||'—'},
      {rotulo:'Sensação', valor:feelLbl||'Registrada'}
    ],
    listaTitulo:'Exercícios do treino',
    lista,
    destaque:'Treinei hoje com MetaTreino 💪'
  });
  _lastPhotoOpts = { title:'Treino concluído 💪', subtitle:x.name,
    stats:[{rotulo:'DURAÇÃO', valor:fmtDur(x.duration)},{rotulo:'EXERCÍCIOS', valor:String((x.exercisesDone||[]).length||'—')},{rotulo:'SENSAÇÃO', valor:(feelLbl||'').replace('Muito bem','Ótimo')}],
    linhaDiscreta: parts.join(' · ')||null, filename:'metatreino-treino.png', shareText:'Treino concluído no MetaTreino 💪' };
  shareCanvas(c, 'metatreino-treino.png', 'Treino concluído no MetaTreino 💪');
}

// ---------- MURAL DO TREINADOR ----------
// Foto e mensagem fixada que o admin edita e todos os alunos veem na tela Hoje.
let coachMural = null;



// ---------- INSTALAR O APP (PWA) ----------
let deferredInstall = null;
// já está rodando como app instalado? então nunca mostramos o convite
function isInstalled(){
  return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true            // iOS
      || document.referrer.startsWith('android-app://');
}
function isIOS(){ return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream; }
function isSafari(){ return /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent); }
function installDismissed(){
  try{ const t = localStorage.getItem('metatreino_install_dismiss'); return t && (Date.now()-parseInt(t)) < 30*86400000; }catch(e){ return false; }
}
window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault();          // impede o mini-banner padrão do Chrome
  deferredInstall = e;
  renderInstallCard();
});
window.addEventListener('appinstalled', ()=>{
  deferredInstall = null;
  const c = $('card-install'); if(c) c.classList.add('hidden');
  toast('🎉 MetaTreino instalado! Abra pelo ícone na sua tela inicial.');
});
function renderInstallCard(){
  const card = $('card-install');
  if(!card) return;
  // instalado, já dispensado, ou navegador sem suporte → não mostra nada
  if(isInstalled() || installDismissed()){ card.classList.add('hidden'); return; }
  const podeChrome = !!deferredInstall;
  const podeIOS = isIOS() && isSafari();
  if(!podeChrome && !podeIOS){ card.classList.add('hidden'); return; }
  card.classList.remove('hidden');
  const btn = $('install-go');
  if(podeChrome){
    $('install-msg').textContent = 'Adicione o MetaTreino à tela inicial: abre mais rápido, em tela cheia e funciona offline.';
    btn.style.display = '';
    btn.textContent = 'Instalar';
    btn.onclick = async (ev)=>{
      ev.stopPropagation();
      if(!deferredInstall) return;
      deferredInstall.prompt();
      const { outcome } = await deferredInstall.userChoice;
      deferredInstall = null;
      if(outcome !== 'accepted') dismissInstall();
      else card.classList.add('hidden');
    };
  } else {
    // iOS não permite instalar por código: só explicamos o caminho
    $('install-msg').innerHTML = 'Toque em <b>Compartilhar</b> (o quadradinho com a seta ↑) e escolha <b>“Adicionar à Tela de Início”</b>. O app abre em tela cheia e funciona offline.';
    btn.style.display = 'none';
  }
  const dis = $('install-dismiss');
  if(dis) dis.onclick = (ev)=>{ ev.stopPropagation(); dismissInstall(); };
}
function dismissInstall(){
  try{ localStorage.setItem('metatreino_install_dismiss', String(Date.now())); }catch(e){}
  const c = $('card-install'); if(c) c.classList.add('hidden');
  toast('👍 Sem problema! O convite volta daqui a um mês.');
}

// ---------- TEMA (claro / escuro) ----------
const THEME_KEY = 'metatreino_theme';
function currentTheme(){
  const attr = document.documentElement.getAttribute('data-theme');
  try{ return localStorage.getItem(THEME_KEY) || attr || 'dark'; }catch(e){ return attr || 'dark'; }
}
function applyTheme(t){
  const light = t==='light';
  document.documentElement.setAttribute('data-theme', light?'light':'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.setAttribute('content', light?'#f7f8fa':'#050914');
  try{ localStorage.setItem(THEME_KEY, light?'light':'dark'); }catch(e){}
  const row = document.getElementById('theme-row-label');
  if(row) row.textContent = light ? 'Tema claro' : 'Tema escuro';
  const ico = document.getElementById('theme-row-icon');
  if(ico) ico.textContent = light ? '☀️' : '🌙';
}
function toggleTheme(){
  const next = currentTheme()==='light' ? 'dark' : 'light';
  applyTheme(next);
  toast(next==='light' ? '☀️ Tema claro ativado' : '🌙 Tema escuro ativado');
}

// ---------- FUNDO DECORATIVO (motivo em linha, discreto, por aba) ----------
// SVGs vetoriais leves, herdam a cor do tema (var(--text)) com opacidade baixa.
const DECO_SVG = {
  dumbbell:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="30" y1="50" x2="70" y2="50"/><rect x="18" y="37" width="11" height="26" rx="3"/><rect x="9" y="43" width="8" height="14" rx="3"/><rect x="71" y="37" width="11" height="26" rx="3"/><rect x="83" y="43" width="8" height="14" rx="3"/></svg>`,
  stopwatch:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="58" r="30"/><line x1="50" y1="58" x2="50" y2="40"/><line x1="50" y1="58" x2="63" y2="62"/><line x1="42" y1="16" x2="58" y2="16"/><line x1="50" y1="16" x2="50" y2="24"/><line x1="76" y1="30" x2="82" y2="24"/></svg>`,
  chart:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="24" y1="82" x2="82" y2="82"/><rect x="30" y="54" width="11" height="28" rx="2"/><rect x="47" y="42" width="11" height="40" rx="2"/><rect x="64" y="30" width="11" height="52" rx="2"/></svg>`,
  clock:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="52" r="30"/><path d="M50 34 v18 l12 8"/><path d="M22 30 l-1 -11 11 2"/></svg>`,
  calendar:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><rect x="20" y="26" width="60" height="54" rx="7"/><line x1="20" y1="42" x2="80" y2="42"/><line x1="36" y1="18" x2="36" y2="32"/><line x1="64" y1="18" x2="64" y2="32"/><path d="M40 60 l7 7 14 -15"/></svg>`,
  grid:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><rect x="24" y="24" width="22" height="22" rx="5"/><rect x="54" y="24" width="22" height="22" rx="5"/><rect x="24" y="54" width="22" height="22" rx="5"/><rect x="54" y="54" width="22" height="22" rx="5"/></svg>`,
  person:`<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="38" r="16"/><path d="M22 82 a28 26 0 0 1 56 0"/></svg>`
};
function decoModuleGlyph(){ return state.active==='run' ? DECO_SVG.stopwatch : DECO_SVG.dumbbell; }
function decoEnabled(){ try{ return localStorage.getItem('metatreino_deco') !== '0'; }catch(e){ return true; } }
function updateDeco(tab){
  const el = document.getElementById('app-deco'); if(!el) return;
  const on = decoEnabled();
  document.body.classList.toggle('no-deco', !on);
  if(!on){ el.innerHTML = ''; return; }
  const map = { library:DECO_SVG.grid, perf:DECO_SVG.chart, history:DECO_SVG.clock, plan:DECO_SVG.calendar, profile:DECO_SVG.person };
  el.innerHTML = (tab==='home'||tab==='sessions') ? decoModuleGlyph() : (map[tab] || decoModuleGlyph());
}
function updateFab(tab){
  const fab = document.getElementById('ma-fab'); if(!fab) return;
  // fica escondido na aba de treino (Sessões) pra não tirar o foco do treino
  const hide = (tab === 'sessions');
  fab.classList.toggle('hidden', hide);
  // o balão de aviso é um elemento SEPARADO — precisa sumir junto, senão fica flutuando sozinho
  const bubble = document.getElementById('fab-bubble');
  if(bubble && hide) bubble.style.display = 'none';
}
function toggleDeco(){
  const next = !decoEnabled();
  try{ localStorage.setItem('metatreino_deco', next ? '1' : '0'); }catch(e){}
  updateDeco(state.ui.tab || 'home');
  const lbl = document.getElementById('deco-row-label'); if(lbl) lbl.textContent = next ? 'Fundo decorativo (ligado)' : 'Fundo decorativo (desligado)';
  toast(next ? '🎨 Fundo decorativo ativado' : 'Fundo decorativo desativado');
}
// Liga/desliga o Modo Férias. Ao ligar: pausa cobranças e começa a "congelar" a sequência.
// Ao desligar: fecha o período de férias (pra sequência voltar de onde parou).
function toggleVacation(){
  state.vacation = state.vacation || { active:false, startedAt:null, periods:[] };
  const d = new Date(); d.setHours(0,0,0,0);
  if(state.vacation.active){
    // desligando: fecha o período
    if(state.vacation.startedAt!=null){
      state.vacation.periods = state.vacation.periods || [];
      state.vacation.periods.push({ start: state.vacation.startedAt, end: d.getTime() });
      if(state.vacation.periods.length>24) state.vacation.periods = state.vacation.periods.slice(-24);
    }
    state.vacation.active = false; state.vacation.startedAt = null;
    saveData();
    toast('☀️ Modo Férias desligado. Bom te ter de volta — sua sequência continua de onde parou! 💪');
  } else {
    state.vacation.active = true; state.vacation.startedAt = d.getTime();
    saveData();
    toast('🌴 Modo Férias ativado. Relaxa — nada de cobrança, e sua sequência fica guardada.');
  }
  const lbl = document.getElementById('vac-row-label'); if(lbl) lbl.textContent = vacationActive() ? 'Modo Férias (ativo 🌴)' : 'Modo Férias (desligado)';
  const vc = document.getElementById('card-vacation'); if(vc) vc.classList.toggle('hidden', !vacationActive());
}
// Pular o treino do dia de propósito (não conta como falta, não cobra).
function isSkippedToday(w){
  const d=new Date(); d.setHours(0,0,0,0);
  return (state.skips||[]).some(s=>s.at===d.getTime() && s.module===state.active && (s.k===(w&&w.k) || s.dayIdx===(w&&w.dayIdx)));
}
function unskipWorkout(k){
  const mod = state.modules[state.active];
  const w = (mod && mod.plan && mod.plan.workouts||[]).find(x=>String(x.k)===String(k) || String(x.dayIdx)===String(k));
  const d = new Date(); d.setHours(0,0,0,0);
  const kk = w?w.k:k, di = w?w.dayIdx:getDayIdx();
  state.skips = (state.skips||[]).filter(s=>!(s.at===d.getTime() && s.module===state.active && (s.k===kk || s.dayIdx===di)));
  saveData();
  toast('💪 Treino reativado! Bora treinar.');
  if(state.ui.tab==='sessions') renderSessions();
  else goTab(state.ui.tab||'home');
}
function skipWorkout(k){
  const mod = state.modules[state.active];
  const w = (mod && mod.plan && mod.plan.workouts||[]).find(x=>String(x.k)===String(k) || String(x.dayIdx)===String(k));
  const d = new Date(); d.setHours(0,0,0,0);
  state.skips = state.skips || [];
  const kk = w ? w.k : k, di = w ? w.dayIdx : getDayIdx();
  if(!state.skips.some(s=>s.at===d.getTime() && s.module===state.active && s.k===kk)){
    state.skips.push({ at:d.getTime(), module:state.active, k:kk, dayIdx:di });
    if(state.skips.length>120) state.skips = state.skips.slice(-120);
    saveData();
  }
  closeModal();
  toast('😴 Treino pulado. Descansar quando o corpo pede é escolha inteligente — te vejo no próximo! 💚');
  if(state.ui.tab==='sessions') renderSessions(); else goTab('home');
}
applyTheme(currentTheme()); // aplica imediatamente, antes de qualquer render

// ---------- CONTATO DO TREINADOR (editável pelo admin) ----------
let coachContact = { whatsapp:'', email:'metatreinooficial@gmail.com' };
async function loadCoachContact(){
  try{
    const doc = await db.collection('config').doc('contato').get();
    if(doc.exists) coachContact = Object.assign(coachContact, doc.data());
    try{ localStorage.setItem('metatreino_contato', JSON.stringify(coachContact)); }catch(e){}
  }catch(e){
    try{ const c=JSON.parse(localStorage.getItem('metatreino_contato')||'null'); if(c) coachContact=c; }catch(e2){}
  }
  renderContactButtons();
}
function waLink(){
  const n = (coachContact.whatsapp||'').replace(/\D/g,'');
  if(!n) return null;
  const msg = encodeURIComponent('Olá! Quero pedir um teste do MetaTreino. Meu nome: ');
  return `https://wa.me/${n}?text=${msg}`;
}
function renderContactButtons(){
  const wa = waLink();
  ['auth-contact','blocked-contact'].forEach(id=>{
    const el = $(id); if(!el) return;
    const mail = coachContact.email || 'metatreinooficial@gmail.com';
    el.innerHTML = `
      ${wa?`<a href="${wa}" target="_blank" rel="noopener" class="btn btn-primary btn-block" style="text-decoration:none;margin-bottom:8px">💬 Pedir teste pelo WhatsApp</a>`:''}
      <a href="mailto:${mail}?subject=Quero%20acesso%20ao%20MetaTreino" class="btn btn-ghost btn-block" style="text-decoration:none">✉️ Pedir por e-mail</a>
      <div style="text-align:center;margin-top:8px;color:var(--text-mute);font-size:12px">${wa?(coachContact.whatsapp+' · '):''}${mail}</div>`;
  });
}
function openContactAdmin(){
  $('modal-inner').innerHTML = `
    <h3>📞 Contato do treinador</h3>
    <p style="color:var(--text-dim);font-size:13px">Aparece na tela de login e para alunos sem acesso liberado.</p>
    <div class="field" style="margin-top:12px"><label>WhatsApp (com DDI e DDD)</label>
      <input class="input mono" id="ct-wa" placeholder="5566999999999" value="${(coachContact.whatsapp||'').replace(/"/g,'&quot;')}"></div>
    <div class="field"><label>E-mail de contato</label>
      <input class="input" id="ct-mail" placeholder="seu@email.com" value="${(coachContact.email||'').replace(/"/g,'&quot;')}"></div>
    <div class="row" style="gap:8px;margin-top:14px">
      <button class="btn btn-ghost btn-block" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary btn-block" onclick="saveCoachContact()">💾 Salvar</button>
    </div>`;
  $('modal-back').classList.add('on');
}
async function saveCoachContact(){
  const wa = ($('ct-wa').value||'').replace(/\D/g,'');
  const mail = ($('ct-mail').value||'').trim();
  if(wa && (wa.length<12 || wa.length>13)) return toast('WhatsApp deve ter DDI+DDD, ex: 5566999999999');
  if(mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return toast('E-mail inválido');
  coachContact = { whatsapp:wa, email:mail || 'metatreinooficial@gmail.com' };
  try{
    await db.collection('config').doc('contato').set(coachContact);
    try{ localStorage.setItem('metatreino_contato', JSON.stringify(coachContact)); }catch(e){}
    renderContactButtons();
    toast('✅ Contato atualizado!'); closeModal();
  }catch(e){ toast('Erro ao salvar. Confira as regras do Firestore.'); }
}

// Aplica a logo do treinador em todos os cabeçalhos que mostram a marca "M".
// Os cabeçalhos com ícone próprio (⚡ do painel admin) são preservados.
// Se o treinador marcou "usar como capa", a Home mostra um banner largo com a
// imagem de fundo e a saudação por cima — no lugar da linha de marca + saudação.
function applyHeroCapa(){
  try{
    const hero = $('home-hero'); if(!hero) return;
    const foto = coachMural && coachMural.foto;
    const usar = !!(foto && coachMural && coachMural.capa);
    hero.classList.toggle('hidden', !usar);
    const brandRow = $('home-brand-row'), greetRow = $('home-greet-row');
    if(brandRow) brandRow.classList.toggle('hidden', usar);
    if(greetRow) greetRow.classList.toggle('hidden', usar);
    if(!usar) return;
    const bg = $('home-hero-bg'); if(bg) bg.style.backgroundImage = `url('${foto}')`;
    // reaproveita os textos que a Home já calculou
    const hi = $('home-hi'), sub = $('home-goal');
    if(hi && $('hero-hi')) $('hero-hi').innerHTML = hi.innerHTML;
    // Status e clima na MESMA linha (separados por ·): o clima não se perde
    // e não custa uma linha extra em cima da imagem.
    if(sub && $('hero-sub')){
      const partes = String(sub.innerHTML).split('<br>');
      const st = partes[0] || '';
      const wx = (partes[1] || '').replace(/<[^>]+>/g,'').trim();
      $('hero-sub').innerHTML = wx ? `${st} <span style="opacity:.78">· ${wx}</span>` : st;
    }
  }catch(e){ console.log('Erro na capa:', e); }
}
function applyMuralLogo(){
  const foto = coachMural && coachMural.foto;
  document.querySelectorAll('.brand-logo').forEach(el=>{
    const jaAplicado = el.dataset.mural === '1';
    const generico = jaAplicado || el.textContent.trim() === 'M';
    if(!generico) return;
    el.dataset.mural = '1';
    if(foto){
      el.style.background = 'none';
      el.style.overflow = 'hidden';
      el.innerHTML = `<img src="${foto}" alt="Logo" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`;
    } else {
      el.style.background = '';
      el.innerHTML = 'M';
    }
  });
}

async function loadCoachMural(){
  try{
    const doc = await db.collection('config').doc('mural').get();
    coachMural = doc.exists ? doc.data() : null;
    try{ localStorage.setItem('metatreino_mural', JSON.stringify(coachMural)); }catch(e){}
  }catch(e){
    try{ coachMural = JSON.parse(localStorage.getItem('metatreino_mural')||'null'); }catch(e2){ coachMural=null; }
  }
  renderCoachMural();
}
function renderCoachMural(){
  applyMuralLogo(); // aplica a logo do treinador em TODOS os cabeçalhos (Hoje, Sessões, Biblioteca, Histórico...)
  // mensagem fixada
  const card = $('card-coach-msg');
  if(card){
    if(coachMural && coachMural.mensagem){
      card.classList.remove('hidden');
      $('coach-msg-text').textContent = coachMural.mensagem;
    } else card.classList.add('hidden');
  }
}
// --- editor (admin) ---
function openMuralAdmin(){
  const m = coachMural||{};
  $('modal-inner').innerHTML = `
    <h3>📢 Mural e logo do app</h3>
    <p style="color:var(--text-dim);font-size:13px;line-height:1.5">A mensagem fica fixada na tela Hoje de todos os alunos. A foto substitui o "M" verde do cabeçalho — boa pra datas especiais (Natal, aniversário do projeto...).</p>
    <div class="field" style="margin-top:12px"><label>Mensagem fixada (vazio = sem mensagem)</label><textarea class="input" id="mural-msg" rows="3" style="resize:vertical">${(m.mensagem||'').replace(/</g,'&lt;')}</textarea></div>
    <div class="field"><label>Foto/logo temporário</label>
      <div class="row" style="gap:8px;align-items:center">
        <div id="mural-preview" style="width:52px;height:52px;border-radius:var(--radius-btn);overflow:hidden;background:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:900;color:var(--on-primary);flex-shrink:0">${m.foto?`<img src="${m.foto}" style="width:100%;height:100%;object-fit:cover">`:'M'}</div>
        <button class="btn btn-ghost" style="flex:1" onclick="document.getElementById('mural-foto-input').click()">📷 Escolher foto</button>
        ${m.foto?`<button class="btn btn-ghost" onclick="muralFotoTemp='REMOVE';document.getElementById('mural-preview').innerHTML='M'">🗑️</button>`:''}
      </div>
      <input type="file" id="mural-foto-input" accept="image/*" style="display:none" onchange="onMuralFotoPicked(event)">
      <div id="mural-peso" style="font-size:11.5px;color:var(--text-mute);margin-top:6px;text-align:center"></div>
      <div class="list-row" onclick="const c=document.getElementById('mural-capa');c.checked=!c.checked;processaMuralFoto()" style="margin-top:10px">
        <span style="font-size:17px">🖼️</span>
        <div style="flex:1"><div style="font-weight:700;font-size:13.5px">Usar como capa larga</div>
        <div style="font-size:11.5px;color:var(--text-mute);line-height:1.45">A foto vira um banner do tamanho da tela na Hoje, com a saudação por cima. Use imagem horizontal e sem texto importante nas bordas.</div></div>
        <input type="checkbox" id="mural-capa" ${m.capa?'checked':''} style="pointer-events:none">
      </div>
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="saveMural()">💾 Publicar pra todos os alunos</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`;
  $('modal-back').classList.add('on');
}
let muralFotoTemp = null;
let muralImgOriginal = null;   // guardada pra reprocessar se o modo mudar
function onMuralFotoPicked(ev){
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{ muralImgOriginal = reader.result; processaMuralFoto(); };
  reader.readAsDataURL(file);
  ev.target.value = '';
}
// Logo = quadrado 160px. Capa = retângulo 900×450 (o quadrado de 160 ficaria
// borrado e cortado quando esticado num banner de tela inteira).
function processaMuralFoto(){
  if(!muralImgOriginal) return;
  const capa = !!(document.getElementById('mural-capa')||{}).checked;
  const img = new Image();
  img.onload = ()=>{
    const c = document.createElement('canvas');
    const x = c.getContext('2d');
    if(capa){
      const LW = 900, LH = 450;                       // 2:1, cobre bem qualquer celular
      c.width = LW; c.height = LH;
      const escala = Math.max(LW/img.width, LH/img.height);
      const w = img.width*escala, h = img.height*escala;
      x.drawImage(img, (LW-w)/2, (LH-h)/2, w, h);     // centraliza e corta o excesso
      muralFotoTemp = c.toDataURL('image/jpeg', 0.80);
    } else {
      const s = Math.min(img.width, img.height);
      c.width = 160; c.height = 160;
      x.drawImage(img, (img.width-s)/2, (img.height-s)/2, s, s, 0, 0, 160, 160);
      muralFotoTemp = c.toDataURL('image/jpeg', 0.82);
    }
    const pv = document.getElementById('mural-preview');
    if(pv){
      pv.style.width = capa ? '100%' : '52px';
      pv.style.height = capa ? '58px' : '52px';
      pv.innerHTML = `<img src="${muralFotoTemp}" style="width:100%;height:100%;object-fit:cover">`;
    }
    // aviso se ficar pesado demais pro Firestore (limite de 1MB por documento)
    const kb = Math.round(muralFotoTemp.length/1024);
    const av = document.getElementById('mural-peso');
    if(av) av.textContent = kb > 700 ? `⚠️ Imagem pesada (${kb}KB) — use uma foto menor.` : `Imagem: ${kb}KB ✅`;
  };
  img.src = muralImgOriginal;
}
async function saveMural(){
  const msg = $('mural-msg').value.trim();
  const data = { mensagem:msg, atualizadoEm:Date.now() };
  data.capa = !!(document.getElementById('mural-capa')||{}).checked;   // usar como banner largo
  if(muralFotoTemp==='REMOVE') data.foto = null;
  else if(muralFotoTemp) data.foto = muralFotoTemp;
  else if(coachMural && coachMural.foto) data.foto = coachMural.foto;
  try{
    await db.collection('config').doc('mural').set(data);
    coachMural = data; muralFotoTemp = null;
    try{ localStorage.setItem('metatreino_mural', JSON.stringify(coachMural)); }catch(e){}
    renderCoachMural();
    closeModal();
    toast('📢 Mural publicado pra todos os alunos!');
  }catch(e){
    console.log('Erro ao salvar mural:', e);
    toast('⚠️ Não foi possível publicar. Confira as regras do Firestore (coleção config).');
  }
}

// ---------- CONQUISTA ESPECIAL (única, por e-mail, revelação cinematográfica) ----------
let specialAward = null;
async function loadSpecialAward(){
  let loaded = false;
  try{
    const doc = await fbTimeout(db.collection('config').doc('specialAward').get(), 4000);
    specialAward = doc.exists ? doc.data() : null;
    loaded = true;
    try{ localStorage.setItem('metatreino_special', JSON.stringify(specialAward)); }catch(e){}
  }catch(e){
    try{ specialAward = JSON.parse(localStorage.getItem('metatreino_special')||'null'); }catch(e2){ specialAward=null; }
  }
  // Reconciliação (só quando carregou do servidor): se a config não aponta mais pra esta conta
  // (e-mail removido ou trocado), remove a conquista eterna desta conta.
  if(loaded){
    const alvo = String((specialAward && specialAward.email) || '').toLowerCase();
    const meu = ((fbUser && fbUser.email) || (state.user && state.user.email) || '').toLowerCase();
    if(state.specialTrophy && (!alvo || meu !== alvo)){
      delete state.specialTrophy;
      saveData();
    }
  }
  checkSpecialAward('open');
}
function checkSpecialAward(trigger){
  const sa = specialAward;
  if(!sa || !sa.email || !sa.titulo) return;
  const myEmail = ((fbUser && fbUser.email) || (state.user && state.user.email) || '').toLowerCase();
  if(myEmail !== String(sa.email).toLowerCase()) return;
  const reached = !!sa.liberarAgora || (sa.data && new Date() >= new Date(sa.data+'T00:00:00'));
  if(!reached) return;
  // modo "após treino": só revela quando ela terminar um treino (não na abertura do app)
  if(sa.aoTreinar && trigger!=='workout') return;
  if(!sa.aoTreinar && trigger==='workout') return;
  const shownKey = 'metatreino_special_shown_'+(sa.data||'now')+'_'+(sa.atualizadoEm||'');
  try{ if(localStorage.getItem(shownKey)) return; localStorage.setItem(shownKey,'1'); }catch(e){}
  setTimeout(()=>showSpecialReveal(sa), sa.aoTreinar ? 1400 : 1000); // deixa a tela assentar antes
}
function showSpecialReveal(sa){
  if(typeof requestWakeLock==='function') try{ requestWakeLock(); }catch(e){} // mantém a tela acesa durante toda a revelação
  // eterniza a conquista na conta dela (sincroniza na nuvem) — fica salva pra sempre (com as frases!)
  try{
    state.specialTrophy = {
      emo: sa.emo||'💍', titulo: sa.titulo||'', descricao: sa.descricao||'',
      frases: (sa.frases && sa.frases.length) ? sa.frases.slice() : ((state.specialTrophy && state.specialTrophy.frases) || []),
      at: (state.specialTrophy && state.specialTrophy.at) || Date.now()
    };
    saveData();
  }catch(e){}
  const frases = (sa.frases && sa.frases.length) ? sa.frases : [
    'Toda jornada é melhor quando compartilhada...',
    'E existem pessoas que transformam a nossa vida...',
    'Hoje você desbloqueou a conquista mais importante de todas...'
  ];
  const emo = sa.emo || '💍';
  const ov = document.createElement('div');
  ov.id = 'special-reveal';
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#05070d;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px;opacity:0;transition:opacity 1.2s';
  ov.innerHTML = `
    <div id="sr-hearts" style="position:absolute;inset:0;overflow:hidden;pointer-events:none"></div>
    <div id="sr-phrase" style="font-size:19px;line-height:1.6;color:#e8ecf4;max-width:340px;min-height:130px;opacity:0;transition:opacity 1s;position:relative;z-index:2"></div>
    <div id="sr-award" style="opacity:0;transition:opacity 1.4s,transform 1.4s;transform:scale(.8);position:relative;z-index:2">
      <div style="font-size:80px;filter:drop-shadow(0 0 24px rgba(167,139,250,.6))">${emo}</div>
      <div style="font-size:12px;letter-spacing:3px;color:#a78bfa;font-weight:800;margin-top:10px">CONQUISTA DESBLOQUEADA</div>
      <h2 style="margin:6px 0 12px;color:#fff;font-size:26px">${(sa.titulo||'').replace(/</g,'&lt;')}</h2>
      <p style="color:#c7cfdd;font-size:14.5px;line-height:1.65;max-width:320px;margin:0 auto;white-space:pre-line">${(sa.descricao||'').replace(/</g,'&lt;')}</p>
      <button class="btn btn-primary" style="margin-top:26px;background:#a78bfa;box-shadow:none;padding:12px 30px;color:#fff" onclick="if(typeof releaseWakeLock==='function')releaseWakeLock();var e=document.getElementById('special-reveal');if(e){e.style.opacity='0';setTimeout(function(){e.remove()},800)}">Continuar ❤️</button>
    </div>`;
  document.body.appendChild(ov);
  requestAnimationFrame(()=>{ ov.style.opacity='1'; });
  const ph = ov.querySelector('#sr-phrase');
  let i=0;
  const showNext = ()=>{
    if(!document.getElementById('special-reveal')) return;
    if(i < frases.length){
      ph.style.opacity='0';
      setTimeout(()=>{ ph.textContent = frases[i]; ph.style.opacity='1'; const dwell = Math.min(9000, Math.max(3000, (frases[i]||'').length*90)); i++; setTimeout(showNext, dwell); }, 700);
    } else {
      ph.style.opacity='0';
      setTimeout(()=>{ ph.style.display='none'; const aw=ov.querySelector('#sr-award'); if(aw){ aw.style.opacity='1'; aw.style.transform='scale(1)'; } startHearts(ov); }, 800);
    }
  };
  setTimeout(showNext, 1500);
}
function startHearts(ov){
  const box = ov.querySelector('#sr-hearts'); if(!box) return;
  for(let k=0;k<20;k++){
    const h=document.createElement('div');
    h.textContent = ['❤️','💕','💗','💖'][k%4];
    h.style.cssText = `position:absolute;left:${Math.random()*100}%;bottom:-40px;font-size:${14+Math.random()*18}px;animation:sr-float ${4+Math.random()*4}s linear ${Math.random()*3}s infinite`;
    box.appendChild(h);
  }
}
function openSpecialAwardAdmin(){
  const s = specialAward||{};
  $('modal-inner').innerHTML = `
    <h3>💍 Conquista especial</h3>
    <p style="color:var(--text-dim);font-size:12.5px;line-height:1.5">Uma conquista única, só pra um e-mail, revelada numa tela especial (fundo escuro, frases surgindo, corações). Aparece só uma vez.</p>
    <div class="field" style="margin-top:10px"><label>E-mail da pessoa</label><input class="input" id="sa-email" placeholder="email@exemplo.com" value="${(s.email||'').replace(/"/g,'&quot;')}"></div>
    <div class="field"><label>Título da conquista</label><input class="input" id="sa-titulo" placeholder="Para Sempre" value="${(s.titulo||'').replace(/"/g,'&quot;')}"></div>
    <div class="field"><label>Descrição</label><textarea class="input" id="sa-desc" rows="3" style="resize:vertical">${(s.descricao||'').replace(/</g,'&lt;')}</textarea></div>
    <div class="field"><label>Frases da revelação (uma por linha — deixe vazio pro texto padrão)</label><textarea class="input" id="sa-frases" rows="4" style="resize:vertical" placeholder="Alguns anos atrás, eu estava perdido...&#10;Então a vida me levou até você...&#10;Hoje eu quero te fazer uma pergunta...">${((s.frases&&s.frases.length)?s.frases.join('\n'):'').replace(/</g,'&lt;')}</textarea></div>
    <div class="row" style="gap:10px">
      <div class="field" style="flex:1"><label>Emoji</label><input class="input" id="sa-emo" placeholder="💍" value="${(s.emo||'💍').replace(/"/g,'&quot;')}"></div>
      <div class="field" style="flex:1.5"><label>Data</label><input class="input" type="date" id="sa-data" value="${s.data||''}"></div>
    </div>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin:4px 0"><input type="checkbox" id="sa-treinar" ${s.aoTreinar?'checked':''}> 🏋️ Revelar quando ela terminar um treino (não na abertura)</label>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin:2px 0 6px"><input type="checkbox" id="sa-agora" ${s.liberarAgora?'checked':''}> ⚡ Liberar agora (ignora a data)</label>
    <button class="btn btn-primary btn-block" style="margin-top:8px;background:#a78bfa;box-shadow:none;color:#fff" onclick="saveSpecialAward()">💾 Salvar conquista especial</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`;
  $('modal-back').classList.add('on');
}
async function saveSpecialAward(){
  const data = {
    email: ($('sa-email').value||'').trim().toLowerCase(),
    titulo: ($('sa-titulo').value||'').trim(),
    descricao: ($('sa-desc').value||'').trim(),
    frases: (($('sa-frases')&&$('sa-frases').value)||'').split('\n').map(x=>x.trim()).filter(Boolean),
    emo: ($('sa-emo').value||'💍').trim() || '💍',
    data: ($('sa-data').value||'').trim(), // seletor nativo já entrega YYYY-MM-DD
    aoTreinar: !!$('sa-treinar').checked,
    liberarAgora: !!$('sa-agora').checked,
    atualizadoEm: Date.now()
  };
  // e-mail pode ficar vazio (desativa a conquista / facilita testes). Só avisa se tiver e-mail mas faltar título.
  if(data.email && !/^\S+@\S+\.\S+$/.test(data.email)){ toast('⚠️ Esse e-mail não parece válido. Confere?'); return; }
  if(data.email && !data.titulo){ toast('⚠️ Preencha o título da conquista.'); return; }
  try{
    await db.collection('config').doc('specialAward').set(data);
    specialAward = data;
    try{ localStorage.setItem('metatreino_special', JSON.stringify(data)); }catch(e){}
    closeModal();
    if(!data.email) toast('✅ Salvo (sem e-mail = conquista desativada).');
    else toast(data.aoTreinar ? `💍 Salva! ${data.data?'Na data '+data.data.split('-').reverse().join('/'):(data.liberarAgora?'liberada — ':'')} ela verá ao terminar um treino.` : '💍 Conquista especial salva!');
  }catch(e){ console.log('Erro conquista especial:', e); toast('⚠️ Não foi possível salvar. Confira as regras do Firestore (config).'); }
}

// ---------- PAINEL DE VÍDEOS (ADMIN) ----------
async function openVideoAdmin(){
  await loadVideoLinks(); // garante a lista mais atual
  const groups = EX_BANK.map(cat=>{
    const items = cat.items.map(ex=>{
      const id = slug(ex.name);
      const cur = videoLinks[id]||'';
      const curCred = videoCredits[id]||'';
      return `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:13.5px;font-weight:700">${ex.name} ${cur?'<span style="color:var(--primary-2);font-size:11px">● link próprio</span>':''}</div>
        <div class="row" style="gap:6px;margin-top:6px">
          <input class="input" id="vid-${id}" value="${cur.replace(/"/g,'&quot;')}" placeholder="Link do vídeo (YouTube, Shorts, Drive...)" style="flex:1;font-size:12.5px;padding:9px 12px">
          <button class="btn btn-ghost" style="padding:9px 12px;font-size:12.5px" onclick="testVideoLink('${id}','${ex.name.replace(/'/g,"\\'")}')" title="Abrir link para testar">▶</button>
        </div>
        <div class="row" style="gap:6px;margin-top:6px">
          <input class="input" id="vidc-${id}" value="${curCred.replace(/"/g,'&quot;')}" placeholder="Perfil de quem gravou — Instagram, YouTube, TikTok... (opcional)" style="flex:1;font-size:12.5px;padding:9px 12px">
          <button class="btn btn-primary" style="padding:9px 14px;font-size:12.5px" onclick="saveVideoLink('${id}','${ex.name.replace(/'/g,"\\'")}')">💾</button>
          ${cur?`<button class="btn btn-ghost" class="hl-danger" style="padding:9px 12px;font-size:12.5px" onclick="clearVideoLink('${id}','${ex.name.replace(/'/g,"\\'")}')">🗑️</button>`:''}
        </div>
      </div>`;
    }).join('');
    return `<div style="margin-top:16px"><div class="section-lbl" style="margin:0 0 4px">${cat.name} · ${cat.items.length}</div>${items}</div>`;
  }).join('');
  $('modal-inner').innerHTML = `
    <h3>🎬 Vídeos dos exercícios</h3>
    <p style="color:var(--text-dim);font-size:13px;line-height:1.5">Cole o link do vídeo do YouTube pra cada exercício. O vídeo abre <b>dentro do app</b>; Shorts tocam em vertical. No 2º campo você pode colocar o <b>perfil de quem gravou</b> (Instagram, YouTube, TikTok...) — aparece um crédito discreto embaixo do vídeo. É por exercício, então dá pra creditar pessoas diferentes. Deixe o link do vídeo vazio e salve pra remover tudo.</p>
    <div style="max-height:56vh;overflow-y:auto;margin-top:6px">${groups}</div>
    <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function testVideoLink(id, exName){
  const inp = $('vid-'+id); if(!inp) return;
  const url = inp.value.trim();
  if(!url){
    // sem link salvo: abre a mesma busca que o aluno veria no treino
    window.open(ytLink(exName||id), '_blank');
    return;
  }
  if(!/^https?:\/\//i.test(url)){ toast('⚠️ O link precisa começar com http:// ou https://'); return; }
  window.open(url, '_blank');
}
async function clearVideoLink(id, exName){
  appConfirm(`O vídeo de "${exName}" volta a ser buscado automaticamente pelo app.`, async ()=>{
    try{
      await db.collection('videosExercicios').doc(id).delete();
      delete videoLinks[id];
      const inp=$('vid-'+id); if(inp) inp.value='';
      const cinp=$('vidc-'+id); if(cinp) cinp.value='';
      toast('🗑️ Link removido');
      if(typeof openVideoAdmin==='function') openVideoAdmin();
    }catch(e){ console.log('Erro ao remover vídeo:', e); toast('⚠️ Não foi possível remover. Confira as permissões do Firestore.'); }
  }, {title:'Remover link do vídeo?', emo:'🗑️', okLabel:'Sim, remover', danger:true});
}
async function saveVideoLink(id, exName){
  const inp = $('vid-'+id); if(!inp) return;
  const url = inp.value.trim();
  const cinp = $('vidc-'+id);
  const credito = cinp ? cinp.value.trim() : '';
  if(url && !/^https?:\/\//i.test(url)){ toast('⚠️ O link do vídeo precisa começar com http:// ou https://'); return; }
  if(credito && !/^https?:\/\//i.test(credito)){ toast('⚠️ O link do perfil precisa começar com http:// ou https://'); return; }
  try{
    if(url){
      const data = { nome:exName, url, atualizadoEm:Date.now() };
      if(credito) data.credito = credito;
      await db.collection('videosExercicios').doc(id).set(data);
      videoLinks[id] = url;
      if(credito) videoCredits[id] = credito; else delete videoCredits[id];
      toast('✅ Vídeo salvo: '+exName);
    } else {
      await db.collection('videosExercicios').doc(id).delete();
      delete videoLinks[id]; delete videoCredits[id];
      toast('🗑️ Link removido: '+exName);
    }
    try{ localStorage.setItem('metatreino_videos', JSON.stringify(videoLinks)); }catch(e){}
    try{ localStorage.setItem('metatreino_video_credits', JSON.stringify(videoCredits)); }catch(e){}
    renderVideoCount();
    renderSuggestionCount();
  }catch(e){
    console.log('Erro ao salvar vídeo:', e);
    toast('⚠️ Não foi possível salvar. Confira as regras do Firestore (coleção videosExercicios).');
  }
}
// Lista as perguntas que o assistente não soube responder (vira roadmap real)
async function openSuggestions(){
  try{
    $('modal-inner').innerHTML = `<h3>💬 Feedback dos alunos</h3><div style="text-align:center;padding:20px;color:var(--text-dim)">⏳ Carregando...</div>`;
    $('modal-back').classList.add('on');
    const snap = await db.collection('perguntasNaoRespondidas').orderBy('ultimo','desc').limit(150).get();
    const itens = []; snap.forEach(d=>itens.push({id:d.id, ...d.data()}));
    // marca tudo como visto (some o aviso de novidade)
    try{ localStorage.setItem('mt_feedback_seen', String(Date.now())); }catch(e){}
    const badge = $('adm-feedback-badge'); if(badge) badge.style.display='none';
    const badge2 = $('pf-adm-badge'); if(badge2) badge2.style.display='none';
    if(!itens.length){
      $('modal-inner').innerHTML = `<h3>💬 Feedback dos alunos</h3>
        <div style="text-align:center;padding:22px 10px;color:var(--text-dim);font-size:13px">Nada por aqui ainda. Quando um aluno mandar uma sugestão, relatar um problema, ou o assistente não souber responder algo, aparece nesta lista. 📬</div>
        <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
      return;
    }
    const ord = a => a.sort((x,y)=> (y.n||1)-(x.n||1) || (y.ultimo||0)-(x.ultimo||0));
    const sug = ord(itens.filter(i=>i.tipo==='sugestao'));
    const bug = ord(itens.filter(i=>i.tipo==='bug'));
    const perg = ord(itens.filter(i=>i.tipo!=='sugestao' && i.tipo!=='bug'));
    const bloco = (x, cor) => {
      const vs = Array.isArray(x.versoes) ? x.versoes.slice(-3).join(', ') : (x.ultimaVersao||'');
      const voltou = Array.isArray(x.versoes) && x.versoes.length>1;
      return `<div class="card" style="padding:11px 13px;margin-bottom:8px;border-color:${cor}">
        <div style="display:flex;gap:8px;align-items:flex-start">
          <div style="flex:1;font-size:13.5px;line-height:1.45">${String(x.texto||'').replace(/</g,'&lt;')}</div>
          <button class="btn btn-ghost" class="hl-danger" style="padding:5px 9px;font-size:12px" onclick="deleteSuggestion('${x.id}')">🗑️</button>
        </div>
        <div style="font-size:11.5px;color:var(--text-mute);margin-top:6px;line-height:1.6">
          ${(x.n||1)>1?`<b style="color:var(--accent-2)">${x.n}×</b> · `:''}${x.ultimoNome?String(x.ultimoNome).split(' ')[0]+' · ':''}${x.modulo==='run'?'🏃':'🏋️'} ·
          ${x.ultimo?new Date(x.ultimo).toLocaleDateString('pt-BR'):''}${x.primeiro && x.primeiro!==x.ultimo?` (desde ${new Date(x.primeiro).toLocaleDateString('pt-BR')})`:''}
          ${x.ultimoEmail && x.ultimoEmail!=='anonimo' ? `<br><a href="mailto:${x.ultimoEmail}?subject=MetaTreino%20-%20sua%20mensagem" style="color:var(--primary-2);text-decoration:none">✉️ ${x.ultimoEmail}</a>` : ''}
          ${vs?`<br><span style="opacity:.85">${voltou?'⚠️ apareceu em ':'versão '}${vs}</span>`:''}
        </div></div>`;
    };
    const secao = (titulo, arr, cor) => arr.length ? `<div class="section-lbl" style="margin:14px 0 8px">${titulo} (${arr.length})</div>${arr.map(x=>bloco(x,cor)).join('')}` : '';
    $('modal-inner').innerHTML = `<h3>💬 Feedback dos alunos</h3>
      <div style="max-height:56vh;overflow:auto;margin-top:4px">
        ${secao('💡 SUGESTÕES', sug, 'rgba(16,185,129,.4)')}
        ${secao('🐞 PROBLEMAS RELATADOS', bug, 'rgba(244,63,94,.4)')}
        ${perg.length?`<div class="section-lbl" style="margin:14px 0 6px">❓ PERGUNTAS SEM RESPOSTA (${perg.length})</div>
          <div style="font-size:11.5px;color:var(--text-mute);margin-bottom:8px">As mais repetidas primeiro — é o melhor roadmap que existe.</div>
          ${perg.map(x=>bloco(x,'var(--border)')).join('')}`:''}
      </div>
      <button class="btn btn-ghost btn-block" class="hl-danger" style="margin-top:10px" onclick="clearAllSuggestions()">🗑️ Limpar tudo</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
  }catch(e){
    console.log('Erro ao carregar feedback:', e);
    $('modal-inner').innerHTML = `<h3>💬 Feedback dos alunos</h3><p style="color:var(--text-dim);font-size:13px">⚠️ Não foi possível carregar. Confira as permissões do Firestore para a coleção <b>perguntasNaoRespondidas</b>.</p><button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  }
}
async function deleteSuggestion(id){
  try{
    await db.collection('perguntasNaoRespondidas').doc(id).delete();
    toast('🗑️ Removido');
    openSuggestions(); renderSuggestionCount();
  }catch(e){ console.log('Erro ao remover:', e); toast('⚠️ Não foi possível remover.'); }
}
function clearAllSuggestions(){
  appConfirm('Todo o feedback registrado será apagado: sugestões, problemas e perguntas. Isso não pode ser desfeito.', async ()=>{
    try{
      const snap = await db.collection('perguntasNaoRespondidas').limit(400).get();
      const docs = []; snap.forEach(d=>docs.push(d.ref));
      await Promise.all(docs.map(r=>r.delete()));
      toast(`🗑️ ${docs.length} ${docs.length===1?'item removido':'itens removidos'}`);
      openSuggestions(); renderSuggestionCount();
    }catch(e){ console.log('Erro ao limpar:', e); toast('⚠️ Não foi possível limpar.'); }
  }, {title:'Limpar todo o feedback?', emo:'🗑️', okLabel:'Sim, limpar', danger:true});
}
// Aviso de novidade: só pro admin, sem precisar abrir o painel toda hora
async function checkNewFeedback(){
  try{
    if(!db || !state.user || !state.user.isAdmin) return;
    let visto = 0; try{ visto = parseInt(localStorage.getItem('mt_feedback_seen')||'0') || 0; }catch(e){}
    const snap = await db.collection('perguntasNaoRespondidas').orderBy('ultimo','desc').limit(30).get();
    let novos = 0; snap.forEach(d=>{ const x=d.data(); if((x.ultimo||0) > visto) novos++; });
    const mostrar = (el, txt)=>{ if(!el) return; el.textContent = txt; el.style.display = novos ? 'inline-block' : 'none'; };
    mostrar($('adm-feedback-badge'), novos>9?'9+':String(novos));
    mostrar($('pick-adm-badge'), novos>9?'9+':String(novos));
    mostrar($('quiz-adm-badge'), novos>9?'9+':String(novos));
    mostrar($('pf-adm-badge'), novos>9?'9+':String(novos));
    if(novos && !checkNewFeedback._avisou){
      checkNewFeedback._avisou = true;
      setTimeout(()=>toast(`💬 ${novos} ${novos===1?'nova mensagem':'novas mensagens'} de aluno no painel`), 2200);
    }
  }catch(e){}
}
async function renderSuggestionCount(){
  try{
    const snap = await db.collection('perguntasNaoRespondidas').limit(100).get();
    const el = $('adm-sug-count'); if(el) el.textContent = snap.size ? snap.size+(snap.size>=100?'+':'')+' perguntas' : '';
  }catch(e){}
}
function renderVideoCount(){
  const el = $('adm-video-count');
  if(el) el.textContent = Object.keys(videoLinks).length ? Object.keys(videoLinks).length+' cadastrados' : '';
}

// ---------- ADMIN ----------
let admFilter = 'all';
let allowCache = {};     // email -> doc de usuariosAutorizados
let usuariosCache = {};  // email -> doc de usuarios (estadoApp, nome...) — pra stats/perfil na visão do admin
let admLoaded = false;
let admVeioDoPick = false;

async function loadAdminData(){
  try{
    const [allowSnap, usersSnap] = await Promise.all([
      db.collection('usuariosAutorizados').get(),
      db.collection('usuarios').get()
    ]);
    allowCache = {};
    allowSnap.forEach(doc=>{ allowCache[doc.id] = doc.data(); });
    usuariosCache = {};
    usersSnap.forEach(doc=>{ const d = doc.data(); if(d.email) usuariosCache[d.email.toLowerCase()] = {...d, _uid:doc.id}; });
    admLoaded = true;
  }catch(e){
    console.log('Erro ao carregar dados do painel admin:', e);
    toast('⚠️ Não foi possível carregar os dados. Confira sua conexão e as permissões do Firestore.');
  }
}
async function goAdmin(){
  $('tabbar').classList.add('hidden');
  admVeioDoPick = !(state.modules.lift || state.modules.run);   // admin sem plano: volta pra escolha
  showScreen('scr-admin');
  const p = state.user.profile;
  $('adm-hi').textContent = 'Olá, '+((p&&p.nickname)||'Marcelo')+'!';
  $('adm-list').innerHTML = `<div class="rest-card"><div style="font-size:34px">⏳</div><div class="rest-sub">Carregando alunos...</div></div>`;
  await loadAdminData();
  admPage = 0;
  renderAdminStats();
  renderVideoCount();
  renderAdminList();
}
function renderAdminStats(){
  const now = Date.now();
  const list = Object.entries(allowCache);
  const active = list.filter(([,a])=>a.active && (!a.expiresAt||a.expiresAt>now)).length;
  const expiring = list.filter(([,a])=>a.active && a.expiresAt && a.expiresAt>now && a.expiresAt<now+7*86400000).length;
  const expired = list.filter(([,a])=>!a.active||(a.expiresAt&&a.expiresAt<=now)).length;
  $('adm-active').textContent = active;
  $('adm-exp').textContent = expiring;
  $('adm-total').textContent = list.length;
  $('adm-vencidos').textContent = expired;
}
function setAdminFilter(f){ admFilter=f; admPage=0; document.querySelectorAll('#adm-filter-chips .filter-chip').forEach(c=>c.classList.toggle('on', c.dataset.f===f)); renderAdminList(); }
let admPage = 0;               // página atual da lista de alunos
const ADM_PAGE_SIZE = 8;       // quantos alunos por página
function admGoPage(n){ admPage = n; renderAdminList(); const el=$('adm-list'); if(el) el.scrollIntoView({behavior:'smooth', block:'start'}); }
function renderAdminList(){
  const now = Date.now();
  const q = ($('adm-search').value||'').toLowerCase();
  let items = Object.entries(allowCache).map(([email,a])=>({email,...a, user:usuariosCache[email]}));
  items = items.filter(x=>{
    if(!x.email.includes(q) && !(x.user?.nome||'').toLowerCase().includes(q) && !(x.name||'').toLowerCase().includes(q)) return false;
    const isActive = x.active && (!x.expiresAt || x.expiresAt>now);
    const isExpiring = isActive && x.expiresAt && x.expiresAt<now+7*86400000;
    const isExpired = !x.active || (x.expiresAt && x.expiresAt<=now);
    if(admFilter==='active') return isActive;
    if(admFilter==='expiring') return isExpiring;
    if(admFilter==='expired') return isExpired;
    return true;
  });
  items.sort((a,b)=>(b.addedAt||0)-(a.addedAt||0));
  $('adm-list-count').textContent = items.length + ' aluno' + (items.length===1?'':'s');
  const pager = $('adm-pager'); if(pager) pager.innerHTML = '';
  if(!items.length){ $('adm-list').innerHTML = `<div class="rest-card"><div style="font-size:44px">👥</div><div class="rest-title">Nenhum aluno</div><div class="rest-sub">Clique em "Liberar acesso" pra começar.</div></div>`; return; }
  // paginação: mostra ADM_PAGE_SIZE por vez pra lista não empurrar o resto da tela
  const totalPages = Math.max(1, Math.ceil(items.length/ADM_PAGE_SIZE));
  if(admPage > totalPages-1) admPage = totalPages-1;
  if(admPage < 0) admPage = 0;
  const pageItems = items.slice(admPage*ADM_PAGE_SIZE, admPage*ADM_PAGE_SIZE + ADM_PAGE_SIZE);
  $('adm-list').innerHTML = pageItems.map(x=>{
    const days = x.expiresAt ? Math.ceil((x.expiresAt-now)/86400000) : 9999;
    const isActive = x.active && days>0;
    const cls = !isActive?'off':days<7?'warn':'on';
    const daysLbl = days>=9999?'∞':days<=0?'Expirado':`${days}d`;
    return `<div class="stud" onclick="openStudent('${x.email}')">
      <div class="stud-top"><div><div class="stud-name">${x.user?.nome || x.name || x.email.split('@')[0]}</div><div class="stud-email">${x.email}</div></div><div class="stud-days ${cls}">${daysLbl}</div></div>
      <div class="stud-meta">${x.phone?`<span>📱 <b>${x.phone}</b></span>`:''}${x.notes?`<span>📝 ${x.notes}</span>`:''}${x.expiresAt && (x.expiresAt-x.addedAt)<=8*86400000?`<span>🎁 <b>teste</b></span>`:''}</div>
    </div>`;
  }).join('');
  // controles de página (só aparecem quando há mais de 1 página)
  if(pager){
    if(totalPages > 1){
      const de = admPage*ADM_PAGE_SIZE + 1;
      const ate = Math.min(items.length, admPage*ADM_PAGE_SIZE + ADM_PAGE_SIZE);
      pager.innerHTML = `<div class="row" style="justify-content:space-between;align-items:center;margin-top:12px;gap:8px">
        <button class="btn btn-ghost" style="padding:8px 14px" onclick="admGoPage(${admPage-1})" ${admPage===0?'disabled style="padding:8px 14px;opacity:.4"':''}>‹ Anterior</button>
        <span class="text-dim" style="font-size:12.5px;white-space:nowrap">${de}–${ate} de ${items.length} · pág. ${admPage+1}/${totalPages}</span>
        <button class="btn btn-ghost" style="padding:8px 14px" onclick="admGoPage(${admPage+1})" ${admPage>=totalPages-1?'disabled style="padding:8px 14px;opacity:.4"':''}>Próximo ›</button>
      </div>`;
    } else { pager.innerHTML = ''; }
  }
}
async function doAddStudent(){
  // aceita e-mail OU usuário simples (vira usuario@aluno.metatreino.app, igual ao login)
  const email = normalizaLogin($('as-email').value);
  const name = $('as-name').value.trim();
  const phone = $('as-whats').value.trim();
  const notes = $('as-notes').value.trim();
  const dur = parseInt(readOpt('as-dur'));
  const err = $('as-err'); err.innerHTML='';
  if(!email || !email.includes('@')){ err.innerHTML='<div class="err">Digite um e-mail válido ou um nome de usuário (ex: joao123)</div>'; return; }
  if(!dur){ err.innerHTML='<div class="err">Selecione a duração</div>'; return; }
  const dados = { addedAt:Date.now(), expiresAt: dur>=9999?null:Date.now()+dur*86400000, active:true, phone, notes, name };
  try{
    await db.collection('usuariosAutorizados').doc(email).set(dados, {merge:true});
    allowCache[email] = {...(allowCache[email]||{}), ...dados};
    toast('✅ Acesso liberado');
    closeModal();
    goAdmin();
  }catch(e){
    console.log('Erro ao liberar aluno:', e);
    err.innerHTML='<div class="err">Não foi possível liberar o aluno. Confira as permissões do Firestore.</div>';
  }
}

function openStudent(email){
  const a = allowCache[email]; if(!a) return;
  const u = usuariosCache[email];
  const now = Date.now();
  const days = a.expiresAt ? Math.ceil((a.expiresAt-now)/86400000) : 9999;
  const daysLbl = days>=9999?'Vitalício':days<=0?'Expirado':`${days} dias`;
  const data = u?.estadoApp;
  const p = data?.user?.profile;
  const totalWk = (data?.modules?.lift?.history?.length||0) + (data?.modules?.run?.history?.length||0);
  showScreen('scr-admin-student');
  $('stud-tag').textContent = 'Aluno · '+email;
  $('stud-content').innerHTML = `
    <div class="profile-head">
      <div class="profile-avatar" style="overflow:hidden">${p?.photo?`<img src="${p.photo}">`:(p?.nickname||u?.nome||'?').charAt(0).toUpperCase()}</div>
      <div><div class="profile-name">${p?.nickname||u?.nome||'—'}</div><div class="profile-email">${email}</div><div class="profile-tag">${a.active?'🎫 Ativo':'🔒 Bloqueado'} · ${daysLbl}</div></div>
    </div>

    <div class="section-lbl">Ações rápidas</div>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      ${a.phone?`<a href="https://wa.me/${a.phone.replace(/\\D/g,'')}?text=${encodeURIComponent('Olá! Aqui é do MetaTreino.')}" target="_blank" class="btn btn-primary" style="flex:1">📱 WhatsApp</a>`:''}
      <a href="mailto:${email}?subject=MetaTreino" class="btn btn-ghost" style="flex:1">✉️ E-mail</a>
    </div>

    <div class="section-lbl">Ajustar tempo de acesso</div>
    <div class="row" style="gap:6px;flex-wrap:wrap">
      <button class="btn btn-ghost" onclick="adjustDays('${email}',7)" style="flex:1">+7d</button>
      <button class="btn btn-ghost" onclick="adjustDays('${email}',30)" style="flex:1">+30d</button>
      <button class="btn btn-ghost" onclick="adjustDays('${email}',90)" style="flex:1">+90d</button>
      <button class="btn btn-ghost" onclick="adjustDays('${email}',-7)" style="flex:1">-7d</button>
    </div>
    <div class="row" style="gap:6px;margin-top:8px">
      ${a.expiresAt
        ? `<button class="btn btn-outline btn-block hl-primary" style="" onclick="setLifetime('${email}')">♾️ Tornar vitalício</button>`
        : (String(email).toLowerCase()===(((fbUser&&fbUser.email)||(state.user&&state.user.email)||'').toLowerCase())
            ? `<div style="text-align:center;font-size:12.5px;color:var(--text-mute);padding:6px 0">🛡️ Sua conta de administrador tem acesso permanente protegido</div>`
            : `<button class="btn btn-ghost btn-block" onclick="unsetLifetime('${email}')">📅 Remover vitalício (definir 30 dias)</button>`)}
    </div>

    ${p?`
      <div class="section-lbl">Dados do aluno</div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;padding:6px 0"><span class="text-dim">Sexo</span><b>${({m:'Masculino',f:'Feminino',o:'Outro'})[p.sex]||'—'}</b></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0"><span class="text-dim">Idade</span><b>${p.age||'—'}</b></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0"><span class="text-dim">Altura</span><b>${p.height||'—'} cm</b></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0"><span class="text-dim">Peso atual</span><b>${p.currentWeight||'—'} kg</b></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0"><span class="text-dim">Objetivo</span><b>${({emagrecer:'Emagrecer',massa:'Ganhar massa',forca:'Ganhar força',condicionamento:'Condicionamento',tonificar:'Tonificar',saude:'Saúde'})[p.goal]||'—'}</b></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0"><span class="text-dim">WhatsApp</span><b>${p.whatsapp||'—'}</b></div>
      </div>
      <div class="section-lbl">Progresso</div>
      <div class="stat-grid">
        <div class="stat-mini"><div class="stat-mini-emo">💪</div><div class="stat-mini-val">${totalWk}</div><div class="stat-mini-lbl">Treinos totais</div></div>
        <div class="stat-mini"><div class="stat-mini-emo">🏆</div><div class="stat-mini-val">${data?.trophies?.length||0}</div><div class="stat-mini-lbl">Troféus</div></div>
      </div>
    ` : '<p class="text-dim" style="margin:14px 0">Aluno ainda não completou o questionário inicial.</p>'}

    <div class="section-lbl">Gerenciar</div>
    <button class="btn btn-ghost btn-block" onclick="toggleStudent('${email}')">${a.active?'🔒 Bloquear acesso':'🔓 Reativar acesso'}</button>
    <button class="btn btn-ghost btn-block danger" style="margin-top:8px;color:var(--danger-soft);border-color:var(--line-danger)" onclick="removeStudent('${email}')">🗑️ Remover aluno</button>
  `;
}
async function setLifetime(email){
  const a = allowCache[email]; if(!a) return;
  try{
    await db.collection('usuariosAutorizados').doc(email).update({ expiresAt:null, active:true });
    a.expiresAt = null; a.active = true;
    toast('♾️ Acesso vitalício ativado');
    openStudent(email);
  }catch(e){ console.log('Erro ao definir vitalício:', e); toast('⚠️ Não foi possível salvar. Confira as permissões do Firestore.'); }
}
async function unsetLifetime(email){
  const _meu = ((fbUser&&fbUser.email)||(state.user&&state.user.email)||'').toLowerCase();
  if(String(email).toLowerCase() === _meu){ toast('🛡️ Seu acesso de administrador é permanente — não dá pra limitar a si mesmo.'); return; }
  const a = allowCache[email]; if(!a) return;
  const novoExpira = Date.now() + 30*86400000;
  try{
    await db.collection('usuariosAutorizados').doc(email).update({ expiresAt:novoExpira, active:true });
    a.expiresAt = novoExpira; a.active = true;
    toast('📅 Vitalício removido — acesso por 30 dias (ajuste com os botões acima)');
    openStudent(email);
  }catch(e){ console.log('Erro ao remover vitalício:', e); toast('⚠️ Não foi possível salvar. Confira as permissões do Firestore.'); }
}
async function adjustDays(email, days){
  const a = allowCache[email]; if(!a) return;
  if(!a.expiresAt){ toast('♾️ Este aluno é vitalício — use "Remover vitalício" antes de ajustar dias'); return; }
  const base = a.expiresAt;
  let novoExpira = base + days*86400000;
  let ativo = a.active;
  if(novoExpira < Date.now()) ativo = false;
  try{
    await db.collection('usuariosAutorizados').doc(email).update({ expiresAt:novoExpira, active:ativo });
    a.expiresAt = novoExpira; a.active = ativo;
    toast(days>0?`+${days} dias`:`${days} dias`);
    openStudent(email);
  }catch(e){ console.log('Erro ao ajustar dias:', e); toast('⚠️ Não foi possível salvar. Confira as permissões do Firestore.'); }
}
async function toggleStudent(email){
  const a = allowCache[email]; if(!a) return;
  const novoAtivo = !a.active;
  try{
    const _meu = ((fbUser&&fbUser.email)||(state.user&&state.user.email)||'').toLowerCase();
    if(String(email).toLowerCase() === _meu && !novoAtivo){ toast('🛡️ Você não pode bloquear a sua própria conta de administrador.'); return; }
    await db.collection('usuariosAutorizados').doc(email).update({ active:novoAtivo });
    a.active = novoAtivo;
    toast(a.active?'🔓 Aluno reativado':'🔒 Aluno bloqueado');
    openStudent(email);
  }catch(e){ console.log('Erro ao bloquear/reativar aluno:', e); toast('⚠️ Não foi possível salvar. Confira as permissões do Firestore.'); }
}
async function removeStudent(email){
  const meu = ((fbUser&&fbUser.email)||(state.user&&state.user.email)||'').toLowerCase();
  if(String(email).toLowerCase() === meu){ toast('🛡️ Você não pode remover o seu próprio acesso de administrador.'); return; }
  appConfirm('A conta dele será mantida, mas ele perderá o acesso ao app.', async ()=>{
    try{
      await db.collection('usuariosAutorizados').doc(email).delete();
      delete allowCache[email];
      toast('🗑️ Aluno removido'); goAdmin();
    }catch(e){ console.log('Erro ao remover aluno:', e); toast('⚠️ Não foi possível remover. Confira as permissões do Firestore.'); }
  }, {title:'Remover aluno?', emo:'🗑️', okLabel:'Sim, remover', danger:true});
}
function doBroadcast(){
  const msg = $('bc-msg').value;
  const phones = Object.values(allowCache).filter(a=>a.active && a.phone).map(a=>a.phone);
  if(!phones.length){ toast('Nenhum aluno com WhatsApp cadastrado'); return; }
  closeModal();
  const links = phones.map(p=>`https://wa.me/${p.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`);
  const w = window.open('','_blank');
  w.document.write(`<html><head><title>Envio em massa</title><style>body{font-family:sans-serif;padding:20px;background:#050914;color:var(--text)}a{display:block;padding:12px 16px;background:#10b981;color:var(--on-primary);text-decoration:none;border-radius:var(--radius-btn);margin:6px 0;font-weight:700}</style></head><body><h2>📢 Clique em cada link para abrir o WhatsApp:</h2>${links.map((l,i)=>`<a href="${l}" target="_blank">Aluno ${i+1} · abrir WhatsApp</a>`).join('')}</body></html>`);
}
async function exportData(){
  toast('📤 Preparando backup...');
  if(!admLoaded) await loadAdminData();
  const data = { usuariosAutorizados:allowCache, usuarios:usuariosCache, exportadoEm:new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `metatreino-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  toast('📤 Backup exportado');
}

// ---------- HISTORY ENTRY EDIT/DELETE ----------
function openHistoryEntry(idx){
  const mod = state.modules[state.active];
  const x = (mod.history||[])[idx];
  if(!x) return;
  const d = new Date(x.at);
  const isRun = state.active==='run';
  const parts = !isRun ? partsFromEntry(x) : [];
  const adaptBlock = x.adaptedWith ? `<div class="card card-alert card-row" class="hl-info" style="margin-top:12px;;background:rgba(56,189,248,0.06)"><div class="card-icon">🩹</div><div><div class="card-title info">Treino adaptado</div><div class="card-sub">Neste dia você treinou em modo adaptado por <b>${x.adaptedWith}</b> — por isso o volume foi menor. Cuidar do corpo também é treinar. 💚</div></div></div>` : '';
  const muscleBlock = parts.length ? `
    <div class="card" style="margin-top:12px">
      <div class="section-lbl" style="margin:0 0 8px">💪 Músculos trabalhados</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${parts.map(p=>`<span style="font-size:12.5px;padding:5px 13px;border-radius:99px;background:var(--tint-primary);color:var(--primary-2);font-weight:800;border:1px solid rgba(16,185,129,0.3)">${p}</span>`).join('')}</div>
    </div>` : '';
  const exBlock = (x.exercisesDone && x.exercisesDone.length) ? `
    <div class="section-lbl" style="margin-top:14px">Exercícios por grupo</div>
    <div class="card">${groupByPart(x.exercisesDone).map(l=>`<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13.5px"><b style="color:var(--primary-2)">${l.split(':')[0]}:</b>${l.split(':').slice(1).join(':')}</div>`).join('')}
    <div style="margin-top:8px">${x.exercisesDone.map(e=>`<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="font-size:13px;color:var(--text-dim)">${e.name}</span><b class="mono" style="font-size:12.5px;color:var(--primary-2)">${e.sets}× · ${e.best}</b></div>`).join('')}</div></div>` : '';
  const html = `
    <h3>📝 Detalhes do treino</h3>
    ${adaptBlock}
    ${muscleBlock}
    ${exBlock}
    <div class="field" style="margin-top:12px"><label>Nome</label><input class="input" id="he-name" value="${x.name.replace(/"/g,'&quot;')}"></div>
    <div class="field"><label>Data</label><input class="input" type="datetime-local" id="he-date" value="${toLocalDT(d)}" style="color-scheme:dark"></div>
    <div class="field"><label>Duração (min:seg)</label><input class="input mono" type="text" inputmode="numeric" id="he-dur" value="${durToEdit(x.duration||0)}"></div>
    ${isRun?`<div class="field"><label>Distância (km)</label><input class="input mono" type="number" step="0.1" id="he-km" value="${x.distance||''}"></div>`:''}
    <div class="row" style="gap:8px;margin-top:14px">
      <button class="btn btn-ghost btn-block" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary btn-block" onclick="saveHistoryEntry(${idx})">💾 Salvar</button>
    </div>
    <button class="btn btn-outline btn-block" style="margin-top:10px" onclick="shareWorkoutImage(${idx})">📤 Compartilhar como imagem</button>
    <button class="btn btn-block" style="margin-top:8px;background:var(--tint-danger);color:var(--danger-soft);border:1px solid rgba(244,63,94,0.3)" onclick="deleteHistoryEntry(${idx})">🗑️ Excluir este treino</button>
  `;
  $('modal-inner').innerHTML = html;
  $('modal-back').classList.add('on');
}
function saveHistoryEntry(idx){
  const mod = state.modules[state.active];
  const x = (mod.history||[])[idx]; if(!x) return;
  const kmAntes = x.distance || 0;   // guarda o valor antigo pra ajustar os contadores
  x.name = $('he-name').value.trim() || x.name;
  const dv = $('he-date').value;
  if(dv){ const nd = new Date(dv); if(!isNaN(nd)) x.at = nd.getTime(); }
  x.duration = parseTimeToMin($('he-dur').value) || x.duration;
  const kmEl = $('he-km'); if(kmEl){ const km = parseFloat(kmEl.value); if(km>0){ x.distance = km; if(x.duration) { const pace = x.duration/km; x.pace = Math.floor(pace)+':'+String(Math.round((pace-Math.floor(pace))*60)).padStart(2,'0')+'/km'; } } }
  // corrigiu a distância? os contadores vitalícios precisam acompanhar,
  // senão um erro de digitação (50km em vez de 30km) fica inflando os km pra sempre.
  if((x.distance||0) !== kmAntes) adjustKmStats(x, kmAntes, x.distance||0);
  if(isRecentEntry(x.at)) recomputeAchievements(); // edição recente reajusta as conquistas
  saveData();
  toast('✅ Treino atualizado');
  closeModal();
  renderHistory();
}
// Aplica a diferença de km de um registro editado nos contadores vitalícios.
// Troféus e desafios já conquistados NÃO são revogados — corrigir um erro não pode punir.
function adjustKmStats(x, kmAntes, kmDepois){
  if(x.module !== 'run') return;
  const s = state.stats || (state.stats = {});
  const campo = { corrida:'runKmTotal', caminhada:'walkKmTotal', bike:'bikeKmTotal' }[x.activity || 'corrida'];
  if(!campo) return;
  s[campo] = Math.max(0, (s[campo]||0) - kmAntes + kmDepois);
  ensureStats(); // piso: nunca abaixo do que o histórico comprova
}
// Recalcula o recorde de um exercício depois que séries foram apagadas.
// Só mexe se o PR atual tiver sido feito no dia removido — PRs de outros dias
// (e os que já saíram da janela de 90 dias) permanecem intactos.
// Conquistas só são recalculadas quando o aluno mexe num registro RECENTE.
// Corrigir um erro de hoje/ontem deve refletir na hora; apagar um treino de semanas
// atrás não pode desfazer uma conquista que ele viveu e comemorou lá atrás.
const REVOKE_WINDOW_DAYS = 3;
function isRecentEntry(ts){
  if(!ts) return true;
  return (Date.now() - ts) < REVOKE_WINDOW_DAYS * 86400000;
}
// ---------- RECÁLCULO DE CONQUISTAS ----------
// Chamado quando o aluno APAGA ou EDITA um registro do histórico.
// As conquistas passam a refletir exatamente o que está registrado: o que não
// se sustenta mais é removido; o que continua verdadeiro é mantido (com a data original).
function recomputeAchievements(){
  silentAwards = true;
  const datasAntigas = Object.assign({}, state.trophyDates || {});

  // zera e reconstrói os conquistas a partir dos dados atuais
  state.trophies = [];
  state.trophyDates = {};
  // desafios do MÊS CORRENTE também são recalculados (medalhas de meses passados ficam)
  ensureMonthly();
  const doneAtAntigo = Object.assign({}, state.monthly.doneAt || {});
  state.monthly.done = [];
  state.monthly.doneAt = {};

  try{
    checkTrophies();                                        // conquistas de treino/km/sequência/PR
    if(typeof checkWeightTrophies === 'function') checkWeightTrophies(); // conquistas de peso
  }catch(e){ console.log('recompute trophies:', e); }

  // preserva a data original de quem continua conquistado
  state.trophies.forEach(id=>{ if(datasAntigas[id]) state.trophyDates[id] = datasAntigas[id]; });
  state.monthly.done.forEach(id=>{ if(doneAtAntigo[id]) state.monthly.doneAt[id] = doneAtAntigo[id]; });

  silentAwards = false;
}
function recomputePR(exId, diaRemovidoTs){
  const pr = (state.prs||{})[exId];
  if(!pr) return;
  const prDia = new Date(pr.at || 0); prDia.setHours(0,0,0,0);
  if(prDia.getTime() !== diaRemovidoTs) return; // o PR é de outro dia: não toca
  const logs = state.progress[exId] || [];
  let melhor = null;
  logs.forEach(p=>(p.sets||[]).forEach(s=>{
    if(!melhor || s.peso > melhor.peso || (s.peso === melhor.peso && s.reps > melhor.reps)){
      melhor = { peso:s.peso, reps:s.reps, at:p.date };
    }
  }));
  if(melhor) state.prs[exId] = melhor;
  else delete state.prs[exId];
}
function deleteHistoryEntry(idx){
  const mod = state.modules[state.active];
  const x = mod.history[idx];
  const doDelete = (clearSets)=>{
    if(clearSets && x && x.module==='lift'){
      const today = new Date(); today.setHours(0,0,0,0);
      const ids = (x.exercisesDone||[]).map(e=>e.id || slug(e.name));
      ids.forEach(id=>{
        if(!state.progress[id]) return;
        state.progress[id] = state.progress[id].filter(pp=>{ const pd=new Date(pp.date); pd.setHours(0,0,0,0); return pd.getTime()!==today.getTime(); });
        if(!state.progress[id].length) delete state.progress[id];
      });
      ids.forEach(id=>recomputePR(id, today.getTime()));
    }
    const removido = mod.history[idx];
    mod.history.splice(idx, 1);
    subtractFromStats(removido);
    if(isRecentEntry(removido && removido.at)) recomputeAchievements();
    saveData();
    toast('🗑️ Treino excluído');
    renderHistory();
  };
  appConfirm('Não pode ser desfeito.', ()=>{
    // treino de musculação DE HOJE: pergunta se limpa também as séries (pra poder registrar de novo)
    if(x && x.module==='lift'){
      const d = new Date(x.at); d.setHours(0,0,0,0);
      const today = new Date(); today.setHours(0,0,0,0);
      if(d.getTime()===today.getTime()){
        appConfirm('Limpar também as séries registradas hoje nesses exercícios? Assim você pode registrar o treino de novo do zero.', ()=>doDelete(true),
          {title:'Limpar séries de hoje?', emo:'🧹', okLabel:'Sim, limpar séries', cancelLabel:'Não, manter séries', onCancel:()=>doDelete(false)});
        return;
      }
    }
    doDelete(false);
  }, {title:'Excluir treino?', emo:'🗑️', okLabel:'Sim, excluir', danger:true});
}

// ---------- SWAP EXERCISE ----------
// Uma linha de etiquetas no lugar de 3 cards. Quem quer o detalhe, toca.
function sessTags(w, isLift){
  const tags = [];
  if(isLift && isCustomized(w))
    tags.push(`<span class="sess-tag sess-tag-prep" onclick="explicaPersonalizado(${w.pins.length})">✨ Personalizado ⓘ</span>`);
  if(w && w.adapted)
    tags.push(`<span class="sess-tag sess-tag-warn" onclick="explicaAdaptado()">🩹 Treino adaptado ⓘ</span>`);
  try{
    const r = (typeof rotinaAtual==='function') ? rotinaAtual() : null;
    if(isLift && r && ROTINAS[r] && mobilidadeDoDia(w).length)
      tags.push(`<span class="sess-tag sess-tag-prep" onclick="explicaRotina()">${ROTINAS[r].emo} Preparação ⓘ</span>`);
  }catch(e){}
  return tags.length ? `<div class="sess-tags">${tags.join('')}</div>` : '';
}
function explicaAdaptado(){
  const mod = state.modules[state.active];
  const w = (mod && mod.plan && typeof currentSelectedWorkout==='function') ? currentSelectedWorkout(mod) : null;
  const nota = (w && w.adaptNote) || 'Seu treino de hoje foi ajustado.';
  const orig = (w && w.originalParts && w.parts && w.originalParts.join()!==w.parts.join())
    ? `<div class="note-line" style="margin-top:6px">O treino original era <b>${w.originalParts.join(' + ')}</b> — hoje ficou <b>${w.parts.join(' + ')}</b>.</div>` : '';
  $('modal-inner').innerHTML = `<div style="text-align:center"><div style="font-size:40px">🩹</div>
      <h3 style="margin:10px 0 4px">Treino adaptado hoje</h3></div>
    <div class="note note-warn" style="margin-top:12px">
      <div class="note-line">${nota}</div>${orig}
      <div class="note-line" style="margin-top:6px">Respeite seus limites e pare se sentir dor.</div>
    </div>
    <button class="btn btn-ghost btn-block" style="margin-top:14px" onclick="closeModal()">Entendi</button>`;
  $('modal-back').classList.add('on');
}
function explicaRotina(){
  const r = rotinaAtual(); const mod2 = state.modules[state.active];
  const w = (mod2 && mod2.plan) ? currentSelectedWorkout(mod2) : null;
  const itens = mobilidadeDoDia(w);
  if(!r || !ROTINAS[r] || !itens.length){ closeModal(); return; }
  $('modal-inner').innerHTML = `<div style="text-align:center"><div style="font-size:40px">${ROTINAS[r].emo}</div>
      <h3 style="margin:10px 0 2px">Antes de começar — 2 a 3 min</h3>
      <div style="font-size:12px;color:var(--text-mute)">${ROTINAS[r].porque}</div></div>
    <div class="note note-prep" style="margin-top:12px">
      ${itens.map(i=>`<div style="padding:9px 0;border-top:1px dashed var(--border)">
        <div style="font-size:13.5px;font-weight:700">${i.emo} ${i.nome} <span style="color:var(--text-mute);font-weight:600;font-size:12px">· ${i.tempo}</span></div>
        <div class="note-line" style="margin-top:3px">${mobTexto(i)}</div>
      </div>`).join('')}
      <div class="note-foot">Opcional — sem tempo? Treinar já é ótimo.</div>
    </div>
    <button class="btn btn-ghost btn-block" style="margin-top:14px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function explicaPersonalizado(n){
  const q = n||0;
  $('modal-inner').innerHTML = `<div style="text-align:center"><div style="font-size:40px">✨</div>
      <h3 style="margin:10px 0 4px">Treino personalizado</h3></div>
    <div class="note note-prep" style="margin-top:12px">
      <div class="note-line">Você trocou <b>${q} exercício${q>1?'s':''}</b> neste treino.</div>
      <div class="note-line" style="margin-top:6px">As trocas ficam salvas e valem nos próximos treinos — o app respeita a sua escolha.</div>
      <div class="note-line" style="margin-top:6px">Pra voltar ao original, use <b>"Voltar à sugestão"</b> no exercício trocado.</div>
    </div>
    <button class="btn btn-ghost btn-block" style="margin-top:14px" onclick="closeModal()">Entendi</button>`;
  $('modal-back').classList.add('on');
}
function isCustomized(w){ return !!(w && w.pins && w.pins.length>0); }
function restoreWorkout(k){
  const mod = state.modules.lift;
  const w = (mod.plan.workouts||[]).find(x=>x.k===k);
  if(!w || !w.pins || !w.pins.length) return;
  appConfirm('Isso volta os exercícios deste treino aos originais gerados pelo app. Suas trocas serão desfeitas (os outros treinos não mudam).', ()=>{
    w.pins = [];
    w.exercises = buildLiftExercises(w.originalParts || w.parts, mod.setup);
    w.duration = estimateLiftDuration(w.exercises, mod.setup.goal);
    saveData();
    toast('↩️ Treino restaurado ao original!');
    if(state.ui.tab==='sessions') renderSessions(); else goTab(state.ui.tab||'home');
  }, {title:'Restaurar treino original?', emo:'↩️', okLabel:'Sim, restaurar'});
}
function openSwapExercise(exId){
  const mod = state.modules.lift;
  const w = mod.plan.workouts.find(w=>w.exercises.some(e=>e.id===exId));
  if(!w) return;
  const cur = w.exercises.find(e=>e.id===exId);
  const equip = mod.setup.equip || 'academia';
  const equipFilter = equip==='custom'?['academia','halteres','casa'] : equip==='basico'?['casa','halteres']:equip==='academia'?['academia','halteres','casa']:equip==='halteres'?['halteres','casa']:['casa'];
  const cat = EX_BANK.find(c=>c.name===cur.part) || EX_BANK.find(c=>c.items.some(x=>slug(x.name)===exId));
  if(!cat){ toast('Não foi possível encontrar alternativas'); return; }
  const usedIds = new Set(w.exercises.map(e=>e.id));
  // "assinatura" do estímulo: parte específica do músculo (ex: "Peito Superior", "Peito (isolador)")
  // — usada pra não sugerir algo que treina exatamente o mesmo que outro exercício já no treino
  const stim = s => (s||'').toLowerCase().replace(/[()]/g,'').trim();
  const usedStims = new Set(w.exercises.filter(e=>e.id!==exId).map(e=>stim(e.sub)));
  // No modo personalizado a regra é a MESMA do gerador: só o que dá pra fazer
  // com os equipamentos marcados (antes oferecia leg press pra quem só tem halteres).
  const compat = equip==='custom'
    ? cat.items.filter(ex => !usedIds.has(slug(ex.name)) && podeFazerCom(ex, mod.setup.equipList||[]))
    : cat.items.filter(ex => !usedIds.has(slug(ex.name)) && (ex.equip||[]).some(e=>equipFilter.includes(e)) && (equip==='casa' || !ex.improv));
  if(!compat.length){ toast('Sem alternativas disponíveis pro seu equipamento'); return; }
  // separa em "recomendadas" (estímulo diferente do que já tem no treino) e "similares"
  const recomendadas = compat.filter(ex => !usedStims.has(stim(ex.sub)));
  const similares = compat.filter(ex => usedStims.has(stim(ex.sub)));
  const card = ex => `<div class="lib-item" onclick="doSwapExercise('${exId}','${slug(ex.name)}','${ex.name.replace(/'/g,"\\'")}','${ex.sub.replace(/'/g,"\\'")}')"><div class="lib-info"><div class="lib-name">${ex.name}</div><div class="lib-part">${ex.sub}</div></div><div class="lib-play">→</div></div>`;
  const html = `
    <h3>🔄 Trocar exercício</h3>
    <p style="color:var(--text-dim);font-size:13px">Substituir <b style="color:var(--text)">${cur.name}</b> por outro de <b>${cat.name}</b>:</p>
    <div style="margin-top:14px;max-height:60vh;overflow-y:auto">
      ${recomendadas.length ? `<div class="section-lbl" style="margin:0 0 8px">✅ Recomendados (estímulo diferente do resto do treino)</div>${recomendadas.map(card).join('')}` : ''}
      ${similares.length ? `<div class="section-lbl" style="margin:16px 0 8px">⚠️ Parecidos com outro do dia (evite repetir estímulo)</div>${similares.map(card).join('')}` : ''}
    </div>
    <button class="btn btn-ghost btn-block" style="margin-top:14px" onclick="closeModal()">Cancelar</button>
  `;
  $('modal-inner').innerHTML = html;
  $('modal-back').classList.add('on');
}
function unpinExercise(exId){
  const mod = state.modules.lift;
  const w = mod.plan.workouts.find(w=>(w.pins||[]).some(p=>p.id===exId));
  if(!w){ toast('Este exercício não está fixado'); return; }
  const pin = w.pins.find(p=>p.id===exId);
  const idx = w.exercises.findIndex(e=>e.id===exId);
  const origId = (pin && pin.origId) || exId;
  const cat = EX_BANK.find(c=>c.items.some(x=>slug(x.name)===origId));
  const origEx = cat && cat.items.find(x=>slug(x.name)===origId);
  if(origEx && idx>=0){
    const cur = w.exercises[idx];
    w.exercises[idx] = { id:origId, name:origEx.name, sub:origEx.sub, sets:cur.sets, reps:cur.reps, rest:cur.rest, part:cur.part, equip:origEx.equip, pinned:false };
  }
  w.pins = w.pins.filter(p=>p.id!==exId);
  saveData();
  toast('↩️ Voltou ao exercício sugerido');
  if(state.ui.tab==='sessions') renderSessions(); else goTab('home');
}
function doSwapExercise(oldId, newId, newName, newSub){
  const mod = state.modules.lift;
  const w = mod.plan.workouts.find(w=>w.exercises.some(e=>e.id===oldId));
  const idx = w.exercises.findIndex(e=>e.id===oldId);
  const old = w.exercises[idx];
  const cat = EX_BANK.find(c=>c.items.some(x=>slug(x.name)===newId));
  const newEx = cat.items.find(x=>slug(x.name)===newId);
  // se este slot já tinha sido trocado antes, mantém o exercício ORIGINAL rastreado
  const existingPin = (w.pins||[]).find(p=>p.id===oldId);
  const origId = existingPin ? existingPin.origId : oldId;
  w.exercises[idx] = { id:newId, name:newName, sub:newSub, sets:old.sets, reps:old.reps, rest:old.rest, part:old.part, equip:newEx.equip, pinned:true };
  // remove SÓ o pin deste exercício (antes removia todos do mesmo grupo → colisão/contador travado)
  w.pins = (w.pins||[]).filter(p=>p.id!==oldId);
  w.pins.push({ part:old.part, id:newId, origId });
  saveData();
  toast(`✅ Trocado por ${newName} — ficará fixado nos próximos treinos`);
  closeModal();
  if(state.ui.tab==='sessions') renderSessions();
}

// ---------- RUN LOG (km + tempo real) ----------
// Aceita "44" (min), "44:30"/"44.30"/"44,30" (min:seg) ou "1:30:00"/"1.30.00" (h:min:seg) -> minutos (fração).
// O teclado numérico do Android não tem ":", então também aceitamos . e , como separador.
function parseTimeToMin(str){
  str = String(str||'').trim().replace(/\s/g,'');
  if(!str) return 0;
  const parts = str.split(/[:.,]/).map(x=>parseInt(x,10)||0);
  if(parts.length===1) return parts[0]; // só minutos
  let h=0,m=0,sec=0;
  if(parts.length>=3){ h=parts[0]; m=parts[1]; sec=parts[2]; }
  else { m=parts[0]; sec=parts[1]; }
  return h*60 + m + sec/60;
}
// minutos (fração) -> "1h30m", "32min 45s" ou "32 min"
// datetime-local precisa de horário LOCAL (toISOString devolve UTC e adiantava a data/hora)
function toLocalDT(d){
  const dt = new Date(d); const p = n => String(n).padStart(2,'0');
  return dt.getFullYear()+'-'+p(dt.getMonth()+1)+'-'+p(dt.getDate())+'T'+p(dt.getHours())+':'+p(dt.getMinutes());
}
function fmtDur(min){
  const totalSec = Math.round((min||0)*60);
  const h=Math.floor(totalSec/3600), m=Math.floor((totalSec%3600)/60), sec=totalSec%60;
  if(h>0) return h+'h'+String(m).padStart(2,'0')+(sec?'m'+String(sec).padStart(2,'0')+'s':'m');
  if(sec>0) return m+'min '+String(sec).padStart(2,'0')+'s';
  return m+' min';
}
// formato editável (mm:ss ou h:mm:ss) que o parseTimeToMin consegue reler
function durToEdit(min){
  const t=Math.round((min||0)*60); const h=Math.floor(t/3600),m=Math.floor((t%3600)/60),sec=t%60;
  if(h>0) return h+':'+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');
  return m+':'+String(sec).padStart(2,'0');
}
function openRunLog(dayIdx){
  const mod = state.modules.run;
  // No dia de descanso (sem treino no dayIdx) ou registro livre, usa um alvo genérico —
  // a pessoa pode registrar corrida/caminhada/bike a qualquer momento.
  let w = mod && mod.plan ? mod.plan.workouts.find(x=>String(x.dayIdx)===String(dayIdx)) : null;
  const livre = !w;
  if(livre) w = { k:'livre', name:'Atividade livre', dayIdx:getDayIdx(), distance:'—', duration:30 };
  const html = `
    <h3>📝 Registrar atividade</h3>
    <p style="color:var(--text-dim);font-size:13px">${livre ? 'Registre uma corrida, caminhada ou pedalada — mesmo em dia de descanso, todo movimento conta! 💪' : `${w.name} · Alvo: ${w.distance} em ${w.duration} min`}</p>
    <div class="field" style="margin-top:12px"><label>O que você fez?</label>
      <div class="radio-grid g3" id="rl-type"><div class="opt on" data-val="corrida">🏃 Corrida</div><div class="opt" data-val="caminhada">🚶 Caminhada</div><div class="opt" data-val="bike">🚴 Bike</div></div>
    </div>
    <div class="field"><label>Distância percorrida (km)</label><input class="input mono" type="number" step="0.1" id="rl-km" placeholder="Ex: 5.2"></div>
    <div class="field"><label>Tempo total (min:seg ou h:min:seg)</label><input class="input mono" type="text" inputmode="numeric" id="rl-min" placeholder="Ex: 44:30 ou 44.30 (min seg)"${livre?'':` value="${w.duration}"`}></div>
    <div class="field"><label>Como se sentiu?</label>
      <div class="radio-grid g3" id="rl-rate"><div class="opt" data-val="1">😩 Difícil</div><div class="opt on" data-val="3">😊 Normal</div><div class="opt" data-val="5">🚀 Ótimo</div></div>
    </div>
    <div class="row" style="gap:8px;margin-top:14px">
      <button class="btn btn-ghost btn-block" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary btn-block" onclick="saveRunLog('${w.k==='livre'?'livre':dayIdx}')">💾 Salvar</button>
    </div>`;
  $('modal-inner').innerHTML = html;
  $('modal-back').classList.add('on');
  bindOpts('modal-inner');
}
const ACTIVITY_META = { corrida:{emo:'🏃',lbl:'Corrida'}, caminhada:{emo:'🚶',lbl:'Caminhada'}, bike:{emo:'🚴',lbl:'Bike'} };
function saveRunLog(dayIdx){
  const km = parseFloat($('rl-km').value);
  const min = parseTimeToMin($('rl-min').value);
  const rate = parseInt(readOpt('rl-rate')) || 3;
  const type = readOpt('rl-type') || 'corrida';
  if(!km || km<=0){ toast('Distância inválida'); return; }
  if(!min || min<=0){ toast('Tempo inválido'); return; }
  const mod = state.modules.run;
  const livre = String(dayIdx)==='livre';
  const w = livre ? { k:'livre', name:'Atividade livre', dayIdx:getDayIdx() } : mod.plan.workouts.find(x=>String(x.dayIdx)===String(dayIdx));
  if(!w){ toast('Erro ao registrar'); return; }
  const pace = (min/km);
  const paceStr = type==='bike' ? (km/(min/60)).toFixed(1)+' km/h' : Math.floor(pace) + ':' + String(Math.round((pace-Math.floor(pace))*60)).padStart(2,'0') + '/km';
  const meta = ACTIVITY_META[type] || ACTIVITY_META.corrida;
  const name = (type==='corrida' && !livre) ? w.name : `${meta.emo} ${meta.lbl} — ${km}km`;
  mod.history = mod.history || [];
  const adaptInfoRun = adaptMode();
  // é a prova? só a PRIMEIRA corrida do dia da prova conta como tal — as seguintes são treino normal
  const _riSave = (typeof raceInfo==='function') ? raceInfo() : null;
  const _ehProvaAgora = !!(_riSave && _riSave.hoje && type==='corrida' && !raceEntryToday());
  mod.history.push({ id:w.k, name: _ehProvaAgora ? '🏅 '+(_riSave.dataFmt ? 'Prova' : 'Prova')+' — '+km+'km' : name,
    at:Date.now(), duration:min, distance:km, pace:paceStr, rating:rate, module:'run', activity:type,
    isRace: _ehProvaAgora || undefined,
    adaptedWith: adaptInfoRun.active ? adaptReasonText() : null });
  // Os contadores vitalícios são recalculados por ensureStats (histórico + reserva do que já
  // saiu pela limpeza de 90 dias). NÃO somamos manualmente aqui pra evitar contagem dobrada.
  ensureStats();
  if(type==='corrida'){
    checkRunEvolution(km, paceStr);
  } else if(type==='caminhada'){
    if(km>=3) unlockTrophy('walk_3k');
    if(km>=5) unlockTrophy('walk_5k');
  } else if(type==='bike'){
    if(km>=20) unlockTrophy('bike_20k');
    if(km>=50) unlockTrophy('bike_50k');
  }
  recalibrateRunPlan(); // os próximos treinos se ajustam ao que você registrou
  saveData();
  closeModal();
  // primeiro o feedback da corrida; só depois as conquistas aparecem
  let fb = null;
  try{ fb = runFeedback(km, min, type, _ehProvaAgora); }catch(e){ console.log('Erro no feedback da corrida:', e); }
  if(fb){
    $('modal-inner').innerHTML = `
      <div style="text-align:center"><div style="font-size:44px;line-height:1">${_ehProvaAgora?'🏅':'🏃'}</div>
        <h3 style="margin:10px 0 4px">${String(fb.titulo).replace(/^[^\s]+\s/,'')}</h3></div>
      <div class="card" style="margin-top:12px;padding:13px 15px">
        ${fb.linhas.map(l=>`<div style="font-size:13.5px;line-height:1.6;color:var(--text-dim);margin:5px 0">${l}</div>`).join('')}
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal();goTab('home')">Continuar</button>`;
    trofeuPendente = true;   // dispara ao fechar o modal, não importa como
    $('modal-back').classList.add('on');
  } else {
    toast(`${meta.emo} ${meta.lbl} salva: ${km}km em ${fmtDur(min)} (${paceStr})`);
    checkTrophies();
    goTab('home');
  }
}
function checkRunEvolution(km, paceStr){
  const h = (state.modules.run.history || []).filter(r=>!r.activity||r.activity==='corrida');
  const prev = h.slice(0,-1);
  if(!prev.length) return;
  const maxKm = Math.max(...prev.map(r=>r.distance||0));
  if(km > maxKm){
    setTimeout(()=>toast(`🎉 NOVA MELHOR DISTÂNCIA! ${km}km`), 1000);
    unlockTrophy('run_pr_distance');
  }
  // Best pace at same-ish distance
  const similar = prev.filter(r=>r.distance && Math.abs(r.distance-km)<0.5);
  if(similar.length){
    const bestPace = similar.reduce((b,r)=>{
      const p=parsePace(r.pace); return p<b?p:b;
    }, 9999);
    const curP = parsePace(paceStr);
    if(curP < bestPace){
      setTimeout(()=>toast(`🚀 NOVO RITMO RECORDE! ${paceStr}`), 1200);
      unlockTrophy('run_pr_pace');
    }
  }
}
function parsePace(s){ if(!s) return 9999; const [m,sec] = s.split(':'); return parseFloat(m)*60 + parseFloat(sec||'0'); }

// ---------- RACE TARGET ----------
// Estado completo da prova: data + horário, se já passou, se é hoje (antes/depois da largada)
function raceInfo(){
  try{
    const st = (state.modules.run||{}).setup||{};
    if(!st.raceDate) return null;
    const base = new Date(st.raceDate+'T00:00:00'); if(isNaN(base)) return null;
    const hora = st.raceTime || null;
    const largada = new Date(base);
    if(hora){ const [hh,mm]=String(hora).split(':').map(Number); largada.setHours(hh||0, mm||0, 0, 0); }
    const h0 = new Date(); h0.setHours(0,0,0,0);
    const dias = Math.round((base.getTime()-h0.getTime())/86400000);
    const agora = Date.now();
    return {
      data: base, hora, largada, dias,
      hoje: dias===0,
      passou: dias<0,
      antesDaLargada: dias===0 && (!hora || agora < largada.getTime()),
      depoisDaLargada: dias===0 && !!hora && agora >= largada.getTime(),
      horaFmt: hora ? String(hora) : null,
      dataFmt: base.toLocaleDateString('pt-BR',{weekday:'long', day:'numeric', month:'long'})
    };
  }catch(e){ return null; }
}
// depois da prova, o campo se limpa sozinho (e a gente pergunta como foi, 1x)
// A prova já foi registrada hoje? (some o botão; corrida seguinte no dia é treino normal)
function raceEntryToday(){
  try{
    const h0 = new Date(); h0.setHours(0,0,0,0);
    return (((state.modules.run||{}).history)||[]).find(r=>{
      const d = new Date(r.at); d.setHours(0,0,0,0);
      return d.getTime()===h0.getTime() && r.isRace;
    }) || null;
  }catch(e){ return null; }
}
function cleanupPastRace(){
  try{
    const ri = raceInfo();
    if(ri && ri.passou){
      const st = state.modules.run.setup;
      state.ui = state.ui || {};
      state.ui.lastRacePrompt = { data: st.raceDate, at: Date.now() };
      st.raceDate = null; st.raceTime = null;
      saveData();
      return true;
    }
  }catch(e){}
  return false;
}
function daysToRace(){
  const rd = state.modules.run?.setup?.raceDate;
  if(!rd) return null;
  const d = new Date(rd); if(isNaN(d)) return null;
  return Math.ceil((d - Date.now())/86400000);
}
window.addEventListener('DOMContentLoaded', ()=>{
  // Update available listener
  document.addEventListener('mt:update-available', ()=>{
    const b = $('update-banner'); if(b) b.style.display='block';
  });
  // A tela de login/carregamento é controlada pelo listener fbAuth.onAuthStateChanged (ver seção AUTH)
});

Object.assign(window,{applyHeroCapa,processaMuralFoto,doGoogleSignIn,doLogout,doDeleteAccount,pickModule,finishSetup,switchModule,switchModuleUI,openSetupScreen,goTab,openSession,selectSession,openModal,closeModal,saveProfileEdit,regenPlan,cancelRunPlan,restoreWorkout,openDayDetail,saveDayNote,updateLevelHint,confirmaExclusaoFinal,showMesFechado,fecharMesFechado,explicaPersonalizado,explicaAdaptado,explicaRotina,sairDoSetup,doEmailAuth,resetAuthUI,dicaLogin,retryAccessCheck,resendVerification,toggleAuthMode,doResetPassword,openChangePassword,doChangePassword,toggleEquip,setRotina,toggleMobCard,shareWeekSummary,clearVideoLink,openSuggestions,maClearThread,sairDoPainel,deleteSuggestion,clearAllSuggestions,checkNewFeedback,pickSharePhoto,onSharePhotoPicked,setLibFilter,filterLib,openExercise,playExercise,saveQuiz,openSetLog,updateSet,delSet,addSet,closeSetLog,finishLiftWorkout,confirmLiftWorkout,markRunDone,openTrophies,pickPhoto,onPhotoPicked,removePhoto,saveWeight,goAdmin,setAdminFilter,renderAdminList,admGoPage,doAddStudent,openStudent,adjustDays,toggleStudent,removeStudent,doBroadcast,exportData,openSwapExercise,doSwapExercise,unpinExercise,openRunLog,saveRunLog,openActivityLog,setActLogType,saveActivityLog,openHistoryEntry,saveHistoryEntry,deleteHistoryEntry,quickChangeEquip,quickChangeTerrain,openVideoAdmin,saveVideoLink,openAssistant,closeAssistant,maAsk,maAskText,openMuralAdmin,onMuralFotoPicked,saveMural,openSpecialAwardAdmin,saveSpecialAward,openContactAdmin,saveCoachContact,toggleTheme,applyTheme,toggleDeco,updateDeco,updateFab,toggleVacation,skipWorkout,unskipWorkout,setLifetime,unsetLifetime,doRestart,startRestFor,startRestTimer,stopRestTimer,toggleRestMute,importMyData,savePain,clearPain,openWeekSummary,shareWeekImage,shareWorkoutImage,shareTrophiesImage,offerShareAfterWorkout,openMonthly,openMedals,histShowMore,calMove,openTrophyDetail,shareTrophyImage,awardNav,closeAwards,doShareNow,doSaveToDevice,testVideoLink});

// carrega o contato do treinador ANTES do login (a tela de login mostra o botão do WhatsApp).
// Fica no fim do arquivo pra garantir que `coachContact` já foi declarado.
loadCoachContact();

// impede escolher uma data de nascimento no futuro
(function(){ const b = document.getElementById('q-birth'); if(b) b.max = new Date().toISOString().slice(0,10); })();

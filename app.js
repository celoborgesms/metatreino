// ===== MetaTreino v5.8 =====
const APP_VERSION = 'v5.8';
const DATA_PREFIX = 'metatreino_cache_'; // cache local (fallback offline), agora indexado por UID do Google
const ADMIN_EMAIL = 'celoborgesms@gmail.com';
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
  '📆 Um mês de constância muda mais que um dia perfeito.',
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
  '🌰 Toda árvore forte já foi uma semente que insistiu.'
];
// Frases contextuais, com base no histórico recente do aluno (têm prioridade quando fazem sentido)
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

async function loadData(){
  let cloud = null, local = null;
  try{
    const doc = await db.collection('usuarios').doc(fbUser.uid).get();
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
  state = { user:null, active:'lift', modules:{lift:null,run:null}, progress:{}, prs:{}, weights:[], trophies:[], ui:{tab:'home',selectedSession:null} };
  showScreen('scr-auth');
  $('tabbar').classList.add('hidden');
  const err=$('auth-err'); if(err) err.innerHTML='';
  const btn=$('google-btn'); if(btn) btn.style.opacity='1';
  const lbl=$('google-btn-lbl'); if(lbl) lbl.textContent='Entrar com Google';
}
function doRestart(){
  if(!state.user || !fbUser) return;
  if(!confirm('Tem certeza? Todo o progresso será apagado, mas sua conta e acesso continuam.')) return;
  const keep = { name:state.user.name, email:state.user.email, isAdmin:state.user.isAdmin };
  state = { user:keep, active:'lift', modules:{lift:null,run:null}, progress:{}, prs:{}, weights:[], trophies:[], stats:{liftTotal:0,runTotal:0,runKmTotal:0,walkTotal:0,walkKmTotal:0,bikeTotal:0,bikeKmTotal:0}, ui:{tab:'home',selectedSession:null} };
  saveData(); syncToCloud();
  closeModal();
  $('tabbar').classList.add('hidden');
  toast('🔄 Recomeçando! Preencha o questionário de novo.');
  showScreen('scr-quiz'); bindOpts('scr-quiz');
}
function doDeleteAccount(){
  if(!state.user || !fbUser) return;
  const email = fbUser.email;
  if(email === ADMIN_EMAIL){ toast('⚠️ A conta de administrador não pode ser excluída por aqui.'); closeModal(); return; }
  if(!confirm('Tem certeza? Todo o seu progresso será apagado para sempre.')) return;
  const uid = fbUser.uid;
  db.collection('usuarios').doc(uid).delete().catch(e=>console.log('Erro ao excluir na nuvem:', e));
  try{ localStorage.removeItem(localCacheKey(uid)); }catch(e){}
  fbAuth.signOut().catch(()=>{});
  fbUser = null;
  state = { user:null, active:'lift', modules:{lift:null,run:null}, progress:{}, prs:{}, weights:[], trophies:[], ui:{tab:'home',selectedSession:null} };
  closeModal();
  showScreen('scr-auth');
  toast('✅ Conta excluída. Comece do zero quando quiser.');
}

async function afterGoogleSignIn(user){
  fbUser = user;
  const email = (user.email||'').toLowerCase();
  showScreen('scr-auth');
  const lbl = $('google-btn-lbl'); if(lbl) lbl.textContent='Verificando acesso...';
  const accessCacheKey = 'metatreino_access_'+email;

  let isAdmin = false, allowData = null, checkedOnline = false;
  try{
    const adminDoc = await db.collection('admins').doc(email).get();
    isAdmin = adminDoc.exists && adminDoc.data().ativo === true;
    const allowDoc = await db.collection('usuariosAutorizados').doc(email).get();
    if(allowDoc.exists) allowData = allowDoc.data();
    checkedOnline = true;
    // guarda a verificação pra permitir uso offline por até 7 dias
    try{ localStorage.setItem(accessCacheKey, JSON.stringify({isAdmin, allowData, at:Date.now()})); }catch(e){}
  }catch(e){
    console.log('Sem conexão pra verificar acesso — tentando cache offline:', e);
    try{
      const cached = JSON.parse(localStorage.getItem(accessCacheKey)||'null');
      if(cached && (Date.now()-cached.at) < 7*86400000){
        isAdmin = cached.isAdmin; allowData = cached.allowData;
        toast('📴 Modo offline — treinos serão sincronizados quando a internet voltar');
      }
    }catch(e2){}
  }

  const now = Date.now();
  const temAcesso = allowData && allowData.active && (!allowData.expiresAt || allowData.expiresAt > now);

  if(!isAdmin && !temAcesso){
    state.user = { name:user.displayName||'', email, blocked:true };
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
  await loadData();
  if(!state.user) state.user = { name:user.displayName||'', email, isAdmin };
  state.user.isAdmin = isAdmin;
  state.user.email = email;
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

function bootAfterAuth(){
  cleanupOldHistory();
  recalibrateRunPlan(); // semana avançou? plano acompanha
  if(!state.user){ showScreen('scr-auth'); return; }
  if(!state.user.profile || !state.user.profile.quiz_done){
    showScreen('scr-quiz'); bindOpts('scr-quiz');
    return;
  }
  if(!state.modules.lift && !state.modules.run){
    showScreen('scr-pick');
    return;
  }
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
  const age = parseInt($('q-age').value);
  const height = parseFloat($('q-height').value);
  const weight = parseFloat($('q-weight').value);
  const whats = $('q-whats').value.trim();
  const goal = readOpt('q-goal');
  const level = readOpt('q-level');
  const err = $('q-err');
  err.innerHTML='';
  if(!nick){ err.innerHTML='<div class="err">Preencha como quer ser chamado.</div>'; return; }
  if(!sex){ err.innerHTML='<div class="err">Selecione o sexo.</div>'; return; }
  if(!age || age<10 || age>99){ err.innerHTML='<div class="err">Idade inválida.</div>'; return; }
  if(!height || height<100 || height>230){ err.innerHTML='<div class="err">Altura inválida.</div>'; return; }
  if(!weight || weight<30 || weight>250){ err.innerHTML='<div class="err">Peso inválido.</div>'; return; }
  if(!goal){ err.innerHTML='<div class="err">Selecione um objetivo.</div>'; return; }

  const profile = { nickname:nick, sex, age, height, currentWeight:weight, whatsapp:whats, goal, level, quiz_done:true };
  state.user.profile = profile;
  // seed weight history
  state.weights = [{ date:Date.now(), weight }];
  saveData();
  showScreen('scr-pick');
}

function calcIMC(){
  const p = state.user && state.user.profile; if(!p) return null;
  const w = latestWeight() || p.currentWeight;
  const h = p.height/100;
  const imc = w / (h*h);
  let cls = '', color = 'var(--primary-2)';
  if(imc < 18.5){ cls='Abaixo do peso'; color='var(--info)'; }
  else if(imc < 25){ cls='Peso normal ✅'; color='var(--primary-2)'; }
  else if(imc < 30){ cls='Sobrepeso'; color='var(--accent-2)'; }
  else if(imc < 35){ cls='Obesidade I'; color='#fda4af'; }
  else if(imc < 40){ cls='Obesidade II'; color='#fda4af'; }
  else { cls='Obesidade III'; color='#fda4af'; }
  return { value:imc.toFixed(1), cls, color };
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
function pickModule(m){
  state.active=m; saveData();
  showScreen('scr-setup-'+m);
  bindOpts('scr-setup-'+m);
  bindMultiOpts('scr-setup-'+m);
  bindDaysUpdate(m);
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

function finishSetup(m){
  const setup = m==='lift' ? {
    goal:readOpt('lift-goal'), days:parseInt(readOpt('lift-days')),
    equip:readOpt('lift-equip'), level:readOpt('lift-level'),
    selectedDays: readSelectedDays('lift-week-days')
  } : {
    goal:readOpt('run-goal'), level:readOpt('run-level'),
    days:parseInt(readOpt('run-days')), terrain:readOpt('run-terrain'),
    selectedDays: readSelectedDays('run-week-days'),
    raceDate: $('run-race-date') ? $('run-race-date').value : null
  };
  // validate day count matches
  if(setup.selectedDays && setup.selectedDays.length !== setup.days){
    toast(`Selecione exatamente ${setup.days} dia${setup.days>1?'s':''} da semana`);
    return;
  }
  // preserva histórico e data de início ao RECRIAR um plano (não zera o progresso do aluno)
  const prev = state.modules[m];
  state.modules[m] = { setup, plan:generatePlan(m,setup), week:1, createdAt: (prev && prev.createdAt) || Date.now(), history: (prev && prev.history) || [] };
  state.active = m;
  saveData(); goTab('home'); toast(prev ? '🔄 Plano recriado! Seu histórico foi mantido.' : '🎉 Plano criado!');
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
      5:[{k:'A',name:'Peito',parts:['Peito','Tríceps']},{k:'B',name:'Costas',parts:['Costas','Bíceps']},{k:'C',name:'Pernas',parts:['Pernas','Panturrilha']},{k:'D',name:'Ombro + Braços',parts:['Ombro','Bíceps','Tríceps']},{k:'E',name:'Glúteos + Core',parts:['Glúteos','Core']}]
    };
    const split = splitMap[days] || splitMap[4];
    // Use user-selected days if available, otherwise defaults
    const wkDays = (setup.selectedDays && setup.selectedDays.length===days) ? setup.selectedDays : ({ 3:[1,3,5], 4:[1,2,4,5], 5:[1,2,3,5,6] }[days] || [1,2,4,5]);
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
    const wkDays = (setup.selectedDays && setup.selectedDays.length===setup.days) ? setup.selectedDays : ({ 3:[2,4,6], 4:[1,3,5,7], 5:[1,2,4,5,7] }[setup.days] || [1,3,5,7]);
    const dayNames = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
    const types = ['Corrida Leve','Intervalado','Corrida Longa','Ritmo Constante'];
    // distância base = a da prova; escala pelo nível (avançado corre mais no dia a dia)
    const raceKm = parseFloat(String(goal).replace(/[^\d.]/g,'')) || 5;
    const level = setup.level || 'iniciante';
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
      const km = Math.max(1.5, Math.round(baseLong * kindFactor[kind] * 2) / 2); // arredonda a 0,5km
      const distance = '~'+km+'km';
      // minutos estimados da parte principal = distância × pace do nível
      // (intervalado é mais curto em distância mas exige mais tempo por causa das pausas)
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
function runPace(kind, setup){
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
    let compat = cat.items.filter(ex => (ex.equip||[]).some(e => equipFilter.includes(e)));
    if(!compat.length) return;
    // Força prioriza exercícios compostos/pesados (os primeiros do banco em cada grupo
    // são os básicos de academia); emagrecimento/resistência rotacionam a lista pra
    // priorizar variações mais dinâmicas.
    if(goal!=='forca' && goalOffset>0 && compat.length>3){
      compat = [...compat.slice(goalOffset), ...compat.slice(0,goalOffset)];
    }
    const need = (p==='Core'||p==='Panturrilha'||p==='Trapézio') ? needSmall : needBig;
    // escolhe exercícios com estímulos VARIADOS (evita 2 isoladores ou 2 "superior" no mesmo grupo):
    // percorre a lista e só adiciona se a assinatura do sub ainda não foi usada; completa se faltar
    const stim = s => (s||'').toLowerCase().replace(/[()]/g,'').trim();
    const pick = [], usedStim = new Set();
    compat.forEach(ex => { if(pick.length<need && !usedStim.has(stim(ex.sub))){ pick.push(ex); usedStim.add(stim(ex.sub)); } });
    if(pick.length<need){ compat.forEach(ex => { if(pick.length<need && !pick.includes(ex)) pick.push(ex); }); }
    pick.forEach(ex=>{ list.push({ id: slug(ex.name), name:ex.name, sub:ex.sub, sets, reps, rest, part:p, equip:ex.equip }); });
  });
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
  const workSec = 40; // tempo médio executando uma série
  const totalSets = exercises.reduce((s,ex)=>s+(ex.sets||3),0);
  const mins = Math.round((totalSets*(workSec+restSec))/60) + 8; // +8 min aquecimento/transições
  return Math.max(25, Math.min(90, mins));
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
  const gentle = level==='iniciante' && ((imcVal && imcVal >= 30) || (p && p.age >= 50));

  const warm = {name:'Aquecimento',exs:[{name:'Caminhada leve',desc:'Ritmo natural, aumente gradualmente',min:gentle?7:5},{name:'Mobilidade dinâmica',desc:'Rotações + elevação de joelhos',min:2}]};
  const cool = {name:'Desaquecimento',exs:[{name:'Caminhada leve',desc:'Normalize a FC gradualmente',min:5}]};
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
      main = {name:'Principal',exs:[{name:'30 min alternando: 3 min corrida leve / 2 min caminhada',desc:'O objetivo é tempo em movimento, não velocidade. Com as semanas, os blocos de corrida vão crescendo naturalmente.',min:30}]};
      return [warm, main, cool];
    }
    const tips = {
      esteira:'Na esteira use inclinação de 1% pra simular a rua. Quebre mentalmente em blocos de 10 min.',
      trilha:'Na trilha o ritmo naturalmente cai — vá por tempo e esforço, não por pace. Leve água.',
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
      main = {name:'Principal',exs:[{name:'20 min alternando: 2 min corrida leve / 2 min caminhada',desc:'Zona 2, sempre conseguindo conversar. Esse formato constrói base protegendo joelhos e canelas.',min:20}]};
      return [warm, main, cool];
    }
    const tips = {
      esteira:'Zona 2 com inclinação 1%. Bom dia pra assistir algo e deixar o tempo passar.',
      trilha:'Zona 2, aproveite a paisagem. Terreno leve, evite subidas fortes hoje.',
      pista:'Zona 2, ritmo bem tranquilo. Deixe os mais rápidos passarem por fora.',
      asfalto:'Zona 2, converse sem esforço. Esse treino constrói sua base aeróbica.'
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
    {name:'Pullover na Polia',sub:'Dorsais (isolador)',equip:['academia']},
    {name:'Levantamento Terra',sub:'Cadeia posterior (força)',equip:['academia']},
    // HALTERES
    {name:'Remada Curvada com Barra',sub:'Costas Média',equip:['academia','halteres']},
    {name:'Remada Unilateral com Haltere',sub:'Dorsais (unilateral)',equip:['academia','halteres']},
    // CASA
    {name:'Barra Fixa',sub:'Dorsais / Bíceps',equip:['academia','casa']},
    {name:'Remada Invertida (mesa/barra baixa)',sub:'Costas (horizontal)',equip:['casa','academia']},
    {name:'Remada com Toalha na Porta',sub:'Costas',equip:['casa']},
    {name:'Superman',sub:'Lombar / Costas Baixa',equip:['casa','halteres','academia']}
  ]},
  {name:'Ombro',emo:'🙆',color:'',items:[
    // ACADEMIA
    {name:'Desenvolvimento com Barra',sub:'Ombro (força)',equip:['academia']},
    {name:'Desenvolvimento na Máquina',sub:'Ombro',equip:['academia']},
    {name:'Elevação Lateral na Polia',sub:'Ombro Lateral',equip:['academia']},
    {name:'Face Pull no Cabo',sub:'Ombro Posterior / Postura',equip:['academia']},
    // HALTERES
    {name:'Desenvolvimento com Halteres',sub:'Ombro',equip:['academia','halteres']},
    {name:'Desenvolvimento Arnold',sub:'Ombro (completo)',equip:['academia','halteres']},
    {name:'Elevação Lateral com Halteres',sub:'Ombro Lateral',equip:['academia','halteres']},
    {name:'Elevação Posterior Curvado',sub:'Ombro Posterior',equip:['academia','halteres']},
    // CASA
    {name:'Pike Push-up',sub:'Ombro',equip:['casa','halteres','academia']},
    {name:'Elevação Lateral com Garrafas',sub:'Ombro Lateral',equip:['casa']},
    {name:'Elevação Frontal com Garrafas',sub:'Ombro Frontal',equip:['casa']},
    {name:'Flexão Pike Elevada',sub:'Ombro (avançado)',equip:['casa','academia']}
  ]},
  {name:'Bíceps',emo:'💪',color:'',items:[
    // ACADEMIA
    {name:'Rosca Direta com Barra',sub:'Bíceps',equip:['academia']},
    {name:'Rosca Scott (banco)',sub:'Bíceps (pico)',equip:['academia']},
    {name:'Rosca no Cabo',sub:'Bíceps (tensão contínua)',equip:['academia']},
    // HALTERES
    {name:'Rosca Alternada com Halteres',sub:'Bíceps',equip:['academia','halteres']},
    {name:'Rosca Martelo com Halteres',sub:'Braquial / Antebraço',equip:['academia','halteres']},
    {name:'Rosca Concentrada',sub:'Bíceps (pico)',equip:['academia','halteres']},
    // CASA
    {name:'Chin-up (barra pegada supinada)',sub:'Bíceps / Costas',equip:['academia','casa']},
    {name:'Rosca com Mochila/Bolsa',sub:'Bíceps',equip:['casa']},
    {name:'Rosca Martelo com Garrafas',sub:'Braquial / Antebraço',equip:['casa']},
    {name:'Rosca Isométrica com Toalha',sub:'Bíceps (isometria)',equip:['casa']}
  ]},
  {name:'Tríceps',emo:'🦾',color:'orange',items:[
    // ACADEMIA
    {name:'Tríceps na Polia (barra)',sub:'Tríceps',equip:['academia']},
    {name:'Tríceps Corda no Cabo',sub:'Tríceps (cabeça lateral)',equip:['academia']},
    {name:'Tríceps Testa (barra EZ)',sub:'Tríceps (cabeça longa)',equip:['academia']},
    // HALTERES
    {name:'Tríceps Francês com Halteres',sub:'Tríceps (cabeça longa)',equip:['academia','halteres']},
    {name:'Tríceps Coice com Haltere',sub:'Tríceps',equip:['academia','halteres']},
    // CASA
    {name:'Mergulho no Banco/Cadeira',sub:'Tríceps',equip:['casa','halteres','academia']},
    {name:'Mergulho nas Paralelas',sub:'Tríceps / Peito',equip:['academia','casa']},
    {name:'Flexão Fechada (diamante)',sub:'Tríceps',equip:['casa','halteres','academia']},
    {name:'Tríceps Testa com Garrafa',sub:'Tríceps',equip:['casa']}
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
    // HALTERES
    {name:'Agachamento Búlgaro',sub:'Quadríceps / Glúteos (unilateral)',equip:['academia','halteres','casa']},
    {name:'Afundo com Halteres',sub:'Quadríceps / Glúteos',equip:['academia','halteres']},
    {name:'Stiff com Halteres',sub:'Posterior / Glúteos',equip:['academia','halteres']},
    {name:'Agachamento Goblet',sub:'Quadríceps / Glúteos',equip:['academia','halteres']},
    // CASA
    {name:'Agachamento Livre (peso corporal)',sub:'Quadríceps / Glúteos',equip:['casa','halteres','academia']},
    {name:'Afundo Alternado',sub:'Quadríceps / Glúteos',equip:['casa','halteres','academia']},
    {name:'Agachamento Sumô',sub:'Adutores / Glúteos',equip:['casa','halteres','academia']},
    {name:'Step-up em banco/degrau',sub:'Quadríceps / Glúteos',equip:['casa','halteres','academia']},
    {name:'Stiff Unilateral (peso corporal)',sub:'Posterior de Coxa',equip:['casa','halteres','academia']},
    {name:'Cadeira contra parede (isométrico)',sub:'Quadríceps (resistência)',equip:['casa','halteres','academia']},
    {name:'Agachamento Jump',sub:'Quadríceps (explosão)',equip:['casa','halteres','academia']}
  ]},
  {name:'Glúteos',emo:'🍑',color:'pink',items:[
    // ACADEMIA
    {name:'Elevação Pélvica (Hip Thrust)',sub:'Glúteos (força)',equip:['academia','halteres']},
    {name:'Coice na Polia (Glúteo no Cabo)',sub:'Glúteo Máximo',equip:['academia']},
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
    {name:'Panturrilha em Pé (máquina/Smith)',sub:'Panturrilha (gastrocnêmio)',equip:['academia']},
    {name:'Panturrilha Sentado',sub:'Panturrilha (sóleo)',equip:['academia']},
    {name:'Panturrilha no Leg Press',sub:'Panturrilha',equip:['academia']},
    {name:'Panturrilha em pé (peso corporal)',sub:'Panturrilha',equip:['casa','halteres','academia']},
    {name:'Panturrilha unilateral em degrau',sub:'Panturrilha (unilateral)',equip:['casa','halteres','academia']}
  ]},
  {name:'Trapézio',emo:'🤷',color:'',items:[
    {name:'Encolhimento com Barra',sub:'Trapézio',equip:['academia']},
    {name:'Encolhimento com Halteres',sub:'Trapézio',equip:['academia','halteres']},
    {name:'Encolhimento com Mochila/Bolsa',sub:'Trapézio',equip:['casa']}
  ]},
  {name:'Core',emo:'🧱',color:'',items:[
    {name:'Prancha (Plank)',sub:'Core (estabilidade)',equip:['casa','halteres','academia']},
    {name:'Prancha Lateral',sub:'Oblíquos',equip:['casa','halteres','academia']},
    {name:'Abdominal Crunch',sub:'Reto abdominal',equip:['casa','halteres','academia']},
    {name:'Abdominal Bicicleta',sub:'Reto / Oblíquos',equip:['casa','halteres','academia']},
    {name:'Elevação de Pernas',sub:'Abdômen Inferior',equip:['casa','halteres','academia']},
    {name:'Russian Twist',sub:'Oblíquos (rotação)',equip:['casa','halteres','academia']},
    {name:'Dead Bug',sub:'Core Profundo (anti-extensão)',equip:['casa','halteres','academia']},
    {name:'Mountain Climber',sub:'Core / Cardio',equip:['casa','halteres','academia']}
  ]}
];// ---------- HELPERS ----------
function $(id){ return document.getElementById(id); }
function showScreen(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); $(id).classList.add('active'); window.scrollTo({top:0,behavior:'instant'}); }
function toast(msg){
  let wrap = document.getElementById('toast-wrap');
  if(!wrap){ wrap = document.createElement('div'); wrap.id='toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div'); t.className='toast'; t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(()=>t.remove(), 3200);
}
function getDayIdx(){ const d=new Date().getDay(); return d===0?7:d; }
// Detecta treinos do plano que estavam marcados pra dias ANTERIORES desta semana
// e não foram registrados — pra sugerir "recuperar" sem quebrar a grade fixa de dias.
function missedWorkoutsThisWeek(mod){
  if(!mod || !mod.plan) return [];
  const today = getDayIdx();
  const startWk = new Date(); startWk.setHours(0,0,0,0); startWk.setDate(startWk.getDate()-(today-1));
  const t0 = startWk.getTime();
  const hist = mod.history||[];
  // não considera "perdido" nenhum dia anterior à criação do plano —
  // aluno novo que começa numa quinta não deve ver segunda/terça como treinos perdidos
  const created = mod.createdAt || Date.now();
  return (mod.plan.workouts||[]).filter(w=>{
    if(w.dayIdx >= today) return false; // só dias que já passaram nesta semana
    // qual foi a data/hora desse dia da semana? se foi antes de criar o plano, ignora
    const dayDate = t0 + (w.dayIdx-1)*86400000;
    const endOfThatDay = dayDate + 86400000; // fim do dia
    if(endOfThatDay <= created) return false; // o dia terminou antes de a conta/plano existir
    // registrou algo desse treino nesta semana?
    const did = hist.some(h=>{ if(h.at<t0) return false; return h.id===w.k || (h.dayIdx===w.dayIdx); });
    return !did;
  });
}
function greetTime(){ const h=new Date().getHours(); if(h<12) return 'Bom dia'; if(h<18) return 'Boa tarde'; return 'Boa noite'; }
function firstName(){ const p = state.user.profile; return (p&&p.nickname) || (state.user.name||'').split(' ')[0]; }
// ---------- VÍDEOS PERSONALIZADOS DOS EXERCÍCIOS ----------
// O treinador cadastra links no painel admin (coleção videosExercicios).
// "Ver como fazer" usa o link do treinador; sem link cadastrado, cai na busca do YouTube.
let videoLinks = {};
async function loadVideoLinks(){
  try{
    const snap = await db.collection('videosExercicios').get();
    videoLinks = {};
    snap.forEach(doc=>{ const d=doc.data(); if(d.url) videoLinks[doc.id] = d.url; });
    try{ localStorage.setItem('metatreino_videos', JSON.stringify(videoLinks)); }catch(e){}
  }catch(e){
    // offline: usa o cache
    try{ videoLinks = JSON.parse(localStorage.getItem('metatreino_videos')||'{}'); }catch(e2){ videoLinks={}; }
  }
}
function ytLink(ex){
  const custom = videoLinks[slug(ex)];
  if(custom) return custom;
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent('como fazer '+ex+' técnica correta');
}

// ---------- MODULE TOGGLE ----------
function renderModToggle(){
  const el = $('mod-toggle'); const a = state.active;
  const cur = a==='lift' ? {emo:'🏋️',name:'Musculação',cls:'lift'} : {emo:'🏃',name:'Corrida',cls:'run'};
  const other = a==='lift' ? {emo:'🏃',name:'Corrida',to:'run'} : {emo:'🏋️',name:'Musculação',to:'lift'};
  el.innerHTML = `<div class="mod-cur ${cur.cls}"><span style="font-size:20px">${cur.emo}</span><span>${cur.name}</span></div><button class="mod-switch" onclick="switchModule('${other.to}')">⇄ Ir para <span style="font-size:16px">${other.emo}</span> ${other.name}</button>`;
}
function switchModule(to){
  if(!state.modules[to]){ state.active=to; saveData(); showScreen('scr-setup-'+to); bindOpts('scr-setup-'+to); return; }
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
  if(tab==='home') renderHome();
  else if(tab==='sessions') renderSessions();
  else if(tab==='library') renderLibrary();
  else if(tab==='perf') renderPerf();
  else if(tab==='history') renderHistory();
  else if(tab==='plan') renderPlan();
  else if(tab==='profile') renderProfile();
}

// ---------- HOME ----------
function renderHome(){
  renderModToggle();
  const mod = state.modules[state.active];
  if(!mod){ showScreen('scr-pick'); return; }
  const isLift = state.active==='lift';
  renderAvatar('home-avatar');
  $('home-hi').textContent = `${greetTime()}, ${firstName()}! 👋`;
  $('home-goal').textContent = 'Objetivo: ' + labelGoal(mod);
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(),0,0)) / 86400000);
  // 40% de chance de mostrar uma frase contextual (se houver); senão, uma do dia
  const ctxQuote = Math.random() < 0.4 ? contextualQuote() : null;
  $('daily-quote').textContent = ctxQuote || QUOTES[doy % QUOTES.length];
  renderCoachMural();

  const days = accessDaysLeft();
  $('access-days').textContent = accessLabel(days);
  const cardAccess = $('card-access-info');
  cardAccess.querySelector('.card-title').textContent = days>=999999 ? '♾️ Acesso vitalício' : days>0 ? 'Acesso ativo' : 'Acesso expirado';

  // trophies count
  $('trophy-count').textContent = `${state.trophies.length} de ${TROPHIES.length} troféus`;

  // race target card (only for run)
  const daysToR = state.active==='run' ? daysToRace() : null;
  const alertCard = $('card-plan-alert');
  if(daysToR !== null && daysToR >= 0 && daysToR < 365){
    alertCard.classList.remove('hidden');
    alertCard.querySelector('.card-icon').textContent = '🏁';
    alertCard.querySelector('.card-title').textContent = daysToR===0 ? 'É HOJE! 🎉' : `${daysToR} dia${daysToR>1?'s':''} para sua prova`;
    let msg;
    if(daysToR===0) msg = 'Confie no seu treino, comece devagar e aproveite cada km. Você se preparou pra isso!';
    else if(daysToR===1) msg = 'Véspera: nada de treino forte. Separe a roupa, hidrate bem e durma cedo. Amanhã é seu dia! 😴';
    else if(daysToR<=3) msg = 'Reta final: só trotes leves. A energia que você poupa agora aparece na prova.';
    else if(daysToR<=7) msg = 'Semana da prova: reduza o volume, foco em recuperação e sono. O trabalho duro já foi feito 💪';
    else if(daysToR<=14) msg = 'Fase de taper: a intensidade cai e você chega afiado. Confie no processo, não invente treino novo.';
    else if(daysToR<=30) msg = 'Menos de um mês! Seus treinos-chave estão acontecendo agora — cada um deles conta muito.';
    else if(daysToR<=60) msg = 'Você está no meio da preparação. Constância nas próximas semanas é o que define seu resultado.';
    else msg = 'Prova no radar! Construa a base com calma — quem chega longe é quem não pula etapas.';
    const personal = raceSmartTip(daysToR);
    alertCard.querySelector('.card-sub').textContent = personal ? msg+' '+personal : msg;
  } else {
    alertCard.classList.add('hidden');
  }

  const cw = currentWeek(mod);
  // treinos pendentes desta semana (perdeu um ou mais dias?)
  const missed = $('card-missed');
  if(missed){
    const pend = missedWorkoutsThisWeek(mod);
    const hasToday = !!mod.plan.workouts.find(w=>w.dayIdx===getDayIdx());
    if(pend.length){
      missed.classList.remove('hidden');
      const isLift = mod.plan.type==='lift';
      if(pend.length===1){
        // 1 dia perdido: sugere encaixar hoje SE hoje for descanso, senão sugere no próximo descanso
        $('missed-title').textContent = '📌 Você perdeu 1 treino esta semana';
        if(hasToday){
          $('missed-msg').textContent = `Faltou ${pend[0].name.split(' — ')[0]}. Como você já tem treino hoje, o ideal é seguir o de hoje e encaixar o pendente num dia de descanso ou no fim de semana — sem dobrar a carga e sobrecarregar. Toque pra ver o treino pendente.`;
        } else {
          $('missed-msg').textContent = `Faltou ${pend[0].name.split(' — ')[0]}, e hoje é dia de descanso — momento perfeito pra recuperar esse treino! Toque pra fazer agora.`;
        }
        missed.onclick = ()=>{
          if(state.active==='run'){ openRunLog(String(pend[0].dayIdx)); } // corrida: registro direto de km+tempo
          else { goTab('sessions'); setTimeout(()=>{ if(pend[0]) selectSession(pend[0].k); }, 120); } // musculação: abre a sessão
        };
      } else {
        // 2+ dias perdidos: NÃO sugere fazer tudo — orienta priorizar e seguir em frente
        $('missed-title').textContent = `📌 Você perdeu ${pend.length} treinos esta semana`;
        $('missed-msg').textContent = `Acontece! Não tente recuperar todos de uma vez — isso sobrecarrega e atrapalha mais que ajuda. ${isLift?'Escolha 1 treino pendente pra fazer num dia livre e siga o plano normalmente a partir de amanhã. Na próxima semana o ciclo recomeça equilibrado.':'Faça a atividade mais importante (a corrida longa) quando puder e retome o plano normalmente. Constância vale mais que perfeição.'} Toque pra ver os pendentes.`;
        missed.onclick = ()=>{
          if(state.active==='run'){ openRunLog(String(pend[0].dayIdx)); } // corrida: registro direto de km+tempo
          else { goTab('sessions'); setTimeout(()=>{ if(pend[0]) selectSession(pend[0].k); }, 120); } // musculação: abre a sessão
        };
      }
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
      if(heavyLeg && hardRun) msgC = `Hoje tem treino de ${partsLbl} e corrida forte. Escolha um pra valer: ou encurta a corrida (metade da distância, ritmo leve) ou reduz as séries de perna em ~30%. Fazer os dois no talo cobra a conta amanhã.`;
      else if(heavyLeg) msgC = `${partsLbl.charAt(0).toUpperCase()+partsLbl.slice(1)} + corrida no mesmo dia: corra ANTES do treino de força se a corrida é sua prioridade, ou depois (bem leve) se a musculação vem primeiro.`;
      else if(gluteDay && hardRun) msgC = `Hoje tem ${partsLbl} e corrida forte. O glúteo é o motor da passada, então dá pra fazer os dois — mas deixe um espaço de algumas horas entre eles, ou reduza um pouco o volume de um dos dois se sentir as pernas pesadas.`;
      else if(gluteDay) msgC = `${partsLbl.charAt(0).toUpperCase()+partsLbl.slice(1)} + corrida leve combinam bem hoje. Só evite falhar as séries de glúteo se ainda for correr depois.`;
      else if(calfOnly && hardRun) msgC = `Panturrilha + corrida forte no mesmo dia: a panturrilha trabalha muito na corrida — treine-a DEPOIS de correr, nunca antes.`;
      else if(hardRun) msgC = `Corrida forte + ${partsLbl} hoje: faça a corrida primeiro e deixe a musculação mais controlada — evite falhar séries.`;
      else msgC = `Dois treinos hoje (${partsLbl} + corrida leve)! Combinação tranquila: só garanta boa alimentação e hidratação entre eles.`;
      $('combo-msg').textContent = msgC;
    } else combo.classList.add('hidden');
  }
  // aviso de dor: corrida com dor em perna/joelho/tornozelo → sugerir caminhada ou bike
  const pains = (state.user&&state.user.pain)||[];
  const legPain = pains.some(p=>['Joelho','Tornozelo','Lombar'].includes(p));
  if(state.active==='run' && legPain && $('card-plan-alert') && $('card-plan-alert').classList.contains('hidden')){
    const ac = $('card-plan-alert');
    ac.classList.remove('hidden');
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
  $('plan-foot').textContent = cw.done ? '🏁 Programa concluído! Toque em "Trocar plano" pra começar um novo ciclo.' : phase==='BUILD'?`🏗️ Fase de construção · ${isLiftPlan?'Ganhando base muscular':'Aumentando base aeróbica'}. ${total-wk} semanas até o pico.`:phase==='PEAK'?`🚀 Fase de pico · Alta intensidade. ${total-wk} semanas restantes.`:isLiftPlan?`🎯 Fase de consolidação · Na semana ${total} o ciclo recomeça renovado.`:`🎯 Fase de taper · Recuperação e afinação final.`;

  const today = getDayIdx();
  const todayWk = mod.plan.workouts.find(w=>w.dayIdx===today);
  const slot = $('today-slot');
  slot.innerHTML = todayWk ? renderTodayWorkout(todayWk,isLift) : renderRestDay(mod);

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
    ${runDone?`<div style="display:inline-block;margin-top:6px;padding:4px 12px;border-radius:999px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);color:var(--primary-2);font-size:12px;font-weight:800">✅ Atividade registrada hoje — pode registrar outra se quiser</div>`:''}
    <div class="today-desc">${desc}</div>
    ${sug?`<div style="margin-top:12px;padding:10px 12px;border-radius:12px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);font-size:13px;line-height:1.45">${sug.emo} <b>Sugestão de hoje:</b> ${sug.txt}</div>`:''}
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
  return `🎯 Foco em ${parts.toLowerCase()}\n\n${cue}\n\n💧 Aqueça 5-8 min, hidrate-se e respeite os intervalos de cada exercício.`;
}
function runDesc(w){
  const main = (w.blocks||[]).find(b=>b.name==='Principal');
  const mainTxt = main && main.exs[0] ? `${main.exs[0].name} — ${main.exs[0].desc}` : 'Ritmo de conversa (você consegue falar frases completas sem ficar sem ar).';
  return `🔥 Aquecimento: 5-7 min de caminhada leve + mobilidade\n\n${mainTxt}\n\n🏁 Desaquecimento: 5 min de caminhada leve para normalizar a FC`;
}

function renderRestDay(mod){
  const isLift = mod.plan.type==='lift';
  const ws = mod.plan.workouts.slice(0,3);
  const freeRunBtn = state.modules.run ? `<div class="rest-divider">— ou —</div><button class="btn btn-outline btn-block" style="border-color:rgba(245,158,11,0.4);color:var(--accent-2)" onclick="openRunLog('livre')">🏃 Registrar corrida, caminhada ou bike livre</button>` : '';
  return `<div class="rest-card"><div class="rest-emoji">😴</div><div class="rest-title">Dia de Descanso</div><div class="rest-sub">Aproveite pra recuperar. Você volta amanhã mais forte!</div><div class="rest-divider">— ou —</div><div style="font-weight:700">Quer antecipar algum treino?</div><div class="anticipate">${ws.map(w=>`<div class="antic-card" onclick="openSession('${w.k||w.dayIdx}')"><div class="antic-letter">${(w.k||'').charAt(0)||'S'}</div><div class="antic-name">${isLift?'Treino '+w.k:w.name.split(' ')[0]}</div><div class="antic-day">${w.dayName}</div></div>`).join('')}</div>${freeRunBtn}</div>`;
}

function renderWeekGrid(mod){
  const days = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const today = getDayIdx();
  const startWk = new Date(); startWk.setHours(0,0,0,0); startWk.setDate(startWk.getDate()-(today-1));
  // Mescla os dois módulos: se a pessoa tem musculação E corrida, a semana mostra os dois
  const sources = [];
  if(state.modules.lift) sources.push({mod:state.modules.lift, emo:'💪'});
  if(state.modules.run) sources.push({mod:state.modules.run, emo:'🏃'});
  const dayInfo = {}; // idx -> {emos:[], done:bool}
  sources.forEach(({mod:m, emo})=>{
    m.plan.workouts.forEach(w=>{
      dayInfo[w.dayIdx] = dayInfo[w.dayIdx] || {emos:[], done:false};
      if(!dayInfo[w.dayIdx].emos.includes(emo)) dayInfo[w.dayIdx].emos.push(emo);
    });
    (m.history||[]).filter(h=>h.at>=startWk.getTime()).forEach(h=>{
      const d=new Date(h.at); const idx = d.getDay()===0?7:d.getDay();
      dayInfo[idx] = dayInfo[idx] || {emos:[], done:false};
      dayInfo[idx].done = true;
    });
  });
  $('week-grid').innerHTML = days.map((n,i)=>{
    const idx=i+1, info=dayInfo[idx], has=!!(info&&info.emos.length), done=!!(info&&info.done), isT=idx===today;
    return `<div class="day ${isT?'today':''} ${!has?'rest':''}"><div class="day-name">${n.slice(0,3)}</div><div class="day-dot ${done?'done':has?'plan':''}"></div><div class="day-emoji" style="${has&&info.emos.length>1?'font-size:11px;letter-spacing:-2px':''}">${has?info.emos.join(''):'·'}</div></div>`;
  }).join('');
}

function renderYourList(mod){
  const isLift = mod.plan.type==='lift';
  $('your-list').innerHTML = mod.plan.workouts.map(w=>`<div class="list-item" onclick="openSession('${w.k||w.dayIdx}')">${isLift?`<div class="list-badge">${w.k}</div>`:`<div class="list-dot"></div>`}<div class="list-info"><div class="list-tag">${(w.dayName||'').toUpperCase()}</div><div class="list-name">${isLift?'Treino '+w.k+' — '+w.name:w.name}</div></div><div class="list-right"><span class="mono">~${w.duration}min</span> ›</div></div>`).join('');
}

// ---------- SESSIONS ----------
function renderSessions(){
  const mod = state.modules[state.active];
  const isLift = state.active==='lift';
  $('sess-mod-icon').textContent = isLift?'🏋️':'🏃';
  $('sessions-title').innerHTML = `${isLift?'🏋️':'🏃'} Sessões`;
  $('sessions-tag').textContent = `Sessões · ${isLift?'Musculação':'Corrida'}`;
  const cwInfo = currentWeek(mod);
  $('weekly-info').textContent = `Meta: ${labelGoal(mod)} · Semana ${cwInfo.wk}/${cwInfo.total} · ${mod.plan.workouts.length}× por semana`;

  const sel = state.ui.selectedSession || (mod.plan.workouts.find(w=>w.dayIdx===getDayIdx()) || mod.plan.workouts[0]);
  $('sessions-chips').innerHTML = mod.plan.workouts.map(w=>{
    const on = String(w.k||w.dayIdx)===String(sel.k||sel.dayIdx);
    return `<div class="filter-chip ${on?'on':''}" onclick="selectSession('${w.k||w.dayIdx}')"><div style="font-size:11px;letter-spacing:1px;color:var(--text-dim);font-weight:700">${(w.dayName||'').toUpperCase()}</div><div style="font-weight:700;margin-top:2px">${isLift?'Treino '+w.k:w.name.split('(')[0].trim()}</div></div>`;
  }).join('');
  renderSessionDetail(sel);
}
function selectSession(id){
  const mod = state.modules[state.active];
  state.ui.selectedSession = mod.plan.workouts.find(w=>String(w.k||w.dayIdx)===String(id));
  saveData(); renderSessions();
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
      <div class="today-desc" style="margin-top:14px">${isLift?liftDesc(w):runDesc(w)}</div>
      <div class="info-grid">
        <div class="info-cell"><div class="info-cell-icon">⏱️</div><div class="info-cell-lbl">DURAÇÃO</div><div class="info-cell-val mono">${w.duration} min</div></div>
        <div class="info-cell"><div class="info-cell-icon">${isLift?'💪':'📍'}</div><div class="info-cell-lbl">${isLift?'EXERCÍCIOS':'DISTÂNCIA'}</div><div class="info-cell-val mono">${isLift?w.exercises.length:w.distance}</div></div>
        <div class="info-cell"><div class="info-cell-icon">📅</div><div class="info-cell-lbl">DIA</div><div class="info-cell-val">${w.dayName}</div></div>
      </div>
    </div>
    <div class="card card-info card-row"><div class="card-icon">💡</div><div><div class="card-title info">Dicas para esta sessão</div><div class="card-sub">${isLift?'Mantenha técnica antes de aumentar carga. Registre cada série pra ver sua evolução.':'Mantenha um ritmo onde você consiga conversar sem dificuldade. FC entre 60-70% do máximo.'}</div></div></div>
    ${isLift ? renderLiftBlocks(w) : renderRunBlocks(w)}
    ${isLift ? (lockedToday
      ? `<div class="card card-ok" style="margin-top:14px;text-align:center"><div class="card-title" style="color:var(--primary-2)">✅ Treino concluído hoje</div><div class="card-sub">Pra ajustar algo, edite pelo Histórico. Amanhã a sessão libera de novo.</div></div>`
      : `<button class="btn ${done?'btn-primary':'btn-ghost'} btn-block" style="margin-top:14px" onclick="finishLiftWorkout('${w.k}')" ${done?'':'disabled style="opacity:.5"'}>✅ Salvar treino${done?'':' (registre ao menos 1 série)'}</button>`) : (runDoneToday(w)
      ? `<div class="card card-ok" style="margin-top:14px;text-align:center;padding:12px"><div style="color:var(--primary-2);font-weight:800">✅ Atividade registrada hoje</div><button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openRunLog('${w.dayIdx}')">📝 Registrar outra atividade</button></div>`
      : `<button class="btn btn-primary btn-block" style="margin-top:14px" onclick="openRunLog('${w.dayIdx}')">📝 Registrar atividade (km + tempo)</button>`)}
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
  return Object.entries(groups).map(([g,exs],i)=>`
    <div class="block ${i===0?'open':''}">
      <div class="block-head main" onclick="this.parentNode.classList.toggle('open')">
        <span style="font-size:20px">🔥</span>
        <div class="block-head-txt"><div class="block-name">${g}</div><div class="block-sub">${exs.length} exercícios</div></div>
        <div class="block-chev">▾</div>
      </div>
      <div class="block-body">
        ${exs.map((ex,j)=>renderExerciseCard(ex,j)).join('')}
      </div>
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
      <div class="ex-num" style="${doneToday?'background:var(--primary);color:#022c22':''}">${doneToday?'✓':idx+1}</div>
      <div style="flex:1">
        <div class="ex-name">${ex.name} ${pr?`<span class="pr-badge">🏆 PR ${pr.peso}kg×${pr.reps}</span>`:''}</div>
        <div class="ex-desc">${ex.sub} · Alvo: <b>${ex.sets}×${ex.reps}</b> · Descanso ${ex.rest}</div>
        ${last?`<div class="ex-desc" style="color:var(--primary-2);margin-top:4px">📊 Última: ${last.sets.map(s=>`${s.peso}kg×${s.reps}`).join(', ')}</div>`:''}
        ${doneToday?`<div class="ex-desc" style="color:var(--primary-2);margin-top:4px;font-weight:700">✅ Hoje: ${todayEntry.sets.map(s=>`${s.peso>0?s.peso+'kg×':''}${s.reps}`).join(', ')}</div>`:''}
        <div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap">
          ${curSessionLocked
            ? `<span style="font-size:12px;color:var(--text-mute);padding:8px 4px">🔒 Concluído hoje — edite pelo Histórico</span>`
            : `<button class="btn ${doneToday?'btn-ghost':'btn-primary'}" style="padding:8px 14px;font-size:13px" onclick="openSetLog('${ex.id}','${ex.name.replace(/'/g,"\\'")}')">${doneToday?'✏️ Editar séries':'📝 Registrar'}</button>`}
          <button class="btn btn-ghost" style="padding:8px 14px;font-size:13px" onclick="window.open('${ytLink(ex.name)}','_blank')">▶ Ver como fazer</button>
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
  return w.blocks.map((b,i)=>`
    <div class="block ${i===1?'open':''}">
      <div class="block-head ${cls[i]}" onclick="this.parentNode.classList.toggle('open')">
        <span style="font-size:20px">${emos[i]}</span>
        <div class="block-head-txt"><div class="block-name">${b.name}</div><div class="block-sub">${b.exs.reduce((s,e)=>s+e.min,0)} min</div></div>
        <div class="block-chev">▾</div>
      </div>
      <div class="block-body">${b.exs.map((ex,j)=>`<div class="ex"><div class="ex-num">${j+1}</div><div style="flex:1"><div class="ex-name">${ex.name}</div><div class="ex-desc">${ex.desc}</div></div><div class="ex-meta">${ex.min} min</div></div>`).join('')}</div>
    </div>`).join('');
}

function openSession(id){
  const mod = state.modules[state.active];
  const w = mod.plan.workouts.find(w=>String(w.k||w.dayIdx)===String(id));
  state.ui.selectedSession = w; saveData(); goTab('sessions');
}
function toggleWeeklyBlock(){}

// ---------- SET LOGGER ----------
let curLog = null;
function openSetLog(exId, exName){
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
    <button class="btn btn-outline btn-block" style="margin-top:8px;border-color:rgba(16,185,129,0.4)" onclick="startRestFor('${exId}','${exName.replace(/'/g,"\\'")}')">⏱️ Iniciar descanso</button>
    <div class="row" style="gap:8px;margin-top:14px">
      <button class="btn btn-ghost btn-block" onclick="closeSetLog(false)">Cancelar</button>
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
        if(!pr){ unlockTrophy('first_pr'); toast('🏆 Primeiro Recorde Pessoal!'); }
        else toast(`🏆 Novo recorde em ${curLog.exName}!`);
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
  // Sem avanço automático: a pessoa escolhe manualmente o próximo exercício
  if(save && savedExId){
    const next = nextUnloggedExercise(savedExId);
    toast(next ? '✅ Série salva!' : '🎉 Todos registrados! Toque em "Salvar treino" pra finalizar.');
  }
}
function nextUnloggedExercise(afterExId){
  const w = state.ui.selectedSession || (state.modules.lift?.plan?.workouts||[]).find(x=>x.dayIdx===getDayIdx());
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
  mod.history.push({ id:w.k, name:'Treino '+w.k+' — '+w.name, at:Date.now(), duration:realDuration, plannedDuration:w.duration, module:'lift', feel, parts:[...(w.parts||[])], exercisesDone });
  ensureStats(); state.stats.liftTotal++;
  checkTrophies();
  saveData();
  closeModal();
  if(feel==='exausto') toast('✅ Salvo! Vou sugerir pegar mais leve no próximo treino 😌');
  else if(feel==='otimo') toast('✅ Salvo! Se sobrou energia, considere subir a carga no próximo 📈');
  else toast('✅ Treino salvo com sucesso!');
  goTab('home');
}
// Sugestão de auto-regulação com base nos últimos treinos de musculação
function liftLoadSuggestion(){
  const h = (state.modules.lift?.history||[]).filter(x=>x.feel).slice(-2);
  if(!h.length) return null;
  const last = h[h.length-1];
  const lastTwo = h.length>=2 && h.every(x=>x.feel==='exausto');
  if(lastTwo) return {emo:'🛑', txt:'Seus 2 últimos treinos terminaram em exaustão. Hoje reduza a carga em ~20% e priorize a técnica — recuperar também é evoluir.'};
  if(last.feel==='exausto') return {emo:'😌', txt:'Último treino foi pesado demais. Sugestão: reduza a carga em ~10% hoje e capriche na execução.'};
  if(last.feel==='cansado') return {emo:'⚖️', txt:'Último treino foi puxado. Mantenha a mesma carga hoje e foque em completar todas as séries com boa forma.'};
  if(last.feel==='otimo') return {emo:'📈', txt:'Você terminou o último treino com energia sobrando — boa hora pra subir a carga em ~5% ou adicionar 1-2 repetições.'};
  return null;
}
function markRunDone(dayIdx){
  const mod = state.modules.run;
  const w = mod.plan.workouts.find(x=>String(x.dayIdx)===String(dayIdx));
  if(!w) return;
  mod.history = mod.history || [];
  mod.history.push({ id:w.k, name:w.name, at:Date.now(), duration:w.duration, module:'run' });
  ensureStats(); state.stats.runTotal++;
  checkTrophies();
  saveData();
  toast('✅ Corrida marcada como feita!');
  goTab('home');
}

// ---------- HISTORY ----------
function renderHistory(){
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
    $('history-list').innerHTML = groups.map(g=>{
      const lbl = g.key===todayKey ? 'Hoje' : g.key===yestKey ? 'Ontem' : g.date.toLocaleDateString('pt-BR',{weekday:'long', day:'2-digit', month:'2-digit'});
      const cards = g.items.map(x=>{
        const d = new Date(x.at);
        const isRunEntry = x.module==='run';
        const emo = x.activity==='caminhada'?'🚶':x.activity==='bike'?'🚴':isRunEntry?'🏃':'💪';
        const feelEmo = {otimo:'🚀',bem:'😊',cansado:'😮‍💨',exausto:'😩'}[x.feel]||'';
        const parts = !isRunEntry ? partsFromEntry(x) : [];
        const nExs = (x.exercisesDone||[]).length;
        const meta = isRunEntry
          ? `<span>⏱️ <b>${x.duration}min</b></span>${x.distance?`<span>📍 <b>${x.distance}km</b></span>`:''}${x.pace?`<span>⚡ <b>${x.pace}</b></span>`:''}`
          : `<span>⏱️ <b>${x.duration}min</b></span>${nExs?`<span>🏋️ <b>${nExs} exercícios</b></span>`:''}${feelEmo?`<span>${feelEmo}</span>`:''}`;
        return `<div class="hist-card ${isRunEntry?'run':''}" onclick="openHistoryEntry(${x._idx})">
          <div class="hist-emo">${emo}</div>
          <div style="flex:1;min-width:0">
            <div class="hist-name">${x.name.replace(/^[🚶🚴🏃]\s*/,'')}</div>
            <div class="hist-meta"><span>🕐 ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>${meta}</div>
            ${parts.length?`<div class="hist-chips">${parts.map(p=>`<span class="hist-chip">${p}</span>`).join('')}</div>`:''}
          </div>
          <div class="hist-arrow">›</div>
        </div>`;
      }).join('');
      return `<div class="hist-day-lbl">${lbl}</div>${cards}`;
    }).join('');
  }
}
function calcStreak(h){
  if(!h||!h.length) return 0;
  const days = new Set(h.map(x=>new Date(x.at).toDateString()));
  let s=0, cur=new Date();
  while(days.has(cur.toDateString())){ s++; cur.setDate(cur.getDate()-1); }
  return s;
}

// ---------- PERF ----------
function renderPerf(){
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
  $('s2-lbl').textContent = isLift?'Volume 7d':'Km 7d';
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
    $('s3-lbl').textContent = 'Km na vida';
    $('s3-val').textContent = state.stats.runKmTotal.toFixed(0);
    $('s3-note').textContent = 'km de corrida acumulados';
  }
  $('m-streak').textContent = calcStreak(h);
  $('m-wk').innerHTML = `${weekDone}<small>/${wkTarget}</small>`;
  const totalMin = h.reduce((s,x)=>s+(x.duration||0),0);
  $('m-total').textContent = totalMin<60?totalMin+'min':(totalMin/60).toFixed(1)+'h';
  // melhor sequência REAL (calculada do histórico + memória vitalícia)
  const best = calcBestStreak(h);
  if(!state.stats.bestStreak || best > state.stats.bestStreak){ state.stats.bestStreak = best; saveData(); }
  $('m-best').textContent = Math.max(best, state.stats.bestStreak||0) + 'd';
  // card extra real: peso atual (musculação) ou melhor pace (corrida)
  if(isLift){
    const w = latestWeight();
    $('m-extra-emo').textContent = '⚖️';
    $('m-extra').textContent = w ? w+'kg' : '—';
    $('m-extra-lbl').textContent = 'Peso atual';
  } else {
    const paces = h.filter(r=>(!r.activity||r.activity==='corrida') && r.pace).map(r=>({p:parsePace(r.pace), s:r.pace}));
    const bp = paces.length ? paces.reduce((b,x)=>x.p<b.p?x:b) : null;
    $('m-extra-emo').textContent = '⚡';
    $('m-extra').textContent = bp ? bp.s.replace('/km','') : '—';
    $('m-extra-lbl').textContent = 'Melhor pace (/km)';
  }
  // constância 4 semanas (dados reais do histórico)
  const line = $('perf-line'), dots = $('perf-dots');
  if(line){
    const pts=[];
    for(let i=3;i>=0;i--){
      const s=now-(i+1)*7*86400000, e=now-i*7*86400000;
      const done = h.filter(x=>x.at>=s && x.at<e).length;
      const pct = Math.min(100,(done/wkTarget)*100);
      pts.push([40+(3-i)*100, 170-pct*1.5]);
    }
    line.setAttribute('points', pts.map(p=>p.join(',')).join(' '));
    if(dots) dots.innerHTML = pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#10b981"/>`).join('');
  }
  renderDistDonut();
  // metas semanal e mensal (reais)
  const gb = $('goals-box');
  if(gb){
    const monthDone = h.filter(x=>x.at >= now-30*86400000).length;
    const monthTarget = wkTarget*4;
    const bar = (done,target,lbl,emo)=>{
      const pct = Math.min(100, Math.round(done/target*100));
      const hit = done>=target;
      return `<div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px"><span>${emo} ${lbl}</span><b style="color:${hit?'var(--primary-2)':'var(--text)'}">${done}/${target}${hit?' 🎉':''}</b></div>
        <div style="height:9px;border-radius:99px;background:rgba(148,163,184,0.15);overflow:hidden"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#10b981,#34d399);border-radius:99px;transition:width .4s"></div></div>
      </div>`;
    };
    gb.innerHTML = bar(weekDone, wkTarget, 'Meta da semana', '📅') + bar(monthDone, monthTarget, 'Meta do mês', '🗓️');
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
function calcTotalVolume(prog){
  const cutoff = Date.now() - 7*86400000;
  let t=0;
  Object.values(prog).forEach(logs=>{
    logs.forEach(p=>{ if(p.date>=cutoff) p.sets.forEach(s=>{ t += (s.peso||0)*(s.reps||0); }); });
  });
  return t;
}

// ---------- PLAN SCREEN ----------
function renderPlan(){
  const mod = state.modules[state.active];
  const isLift = state.active==='lift';
  const s = mod.setup;
  $('plan-title').textContent = `💎 Plano · ${isLift?'Musculação':'Corrida'}`;
  const rows = isLift ? [
    ['Objetivo', labelGoal(mod)], ['Dias de treino', s.days+' dias/semana'],
    ['Equipamento', {academia:'🏋️ Academia completa',halteres:'🎒 Só halteres',casa:'🏠 Peso do corpo',basico:'💪 Básico'}[s.equip]],
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
function regenPlan(){ showScreen('scr-setup-'+state.active); bindOpts('scr-setup-'+state.active); bindMultiOpts('scr-setup-'+state.active); bindDaysUpdate(state.active); }

// ---------- PROFILE ----------
function renderProfile(){
  const u = state.user, p = u.profile || {};
  renderAvatar('pf-avatar');
  const rp = $('pf-remove-photo'); if(rp) rp.style.display = p.photo ? 'block' : 'none';
  const painBadge = $('pf-pain-badge'); if(painBadge){ const pn=(u.pain||[]); painBadge.innerHTML = pn.length?`<span style="padding:2px 8px;border-radius:999px;background:rgba(244,63,94,0.15);color:#fda4af;font-weight:800">${pn.join(', ')}</span>`:''; }
  const qe = $('pf-quick-equip'); if(qe) qe.style.display = (state.active==='lift' && state.modules.lift) ? 'block' : 'none';
  const qt = $('pf-quick-terrain'); if(qt) qt.style.display = (state.active==='run' && state.modules.run) ? 'block' : 'none';
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
  const deltaTxt = delta===0?'Sem mudança':delta<0?`↓ ${Math.abs(delta).toFixed(1)}kg`:`↑ ${delta.toFixed(1)}kg`;
  const deltaColor = delta===0?'var(--text-dim)':((p.goal==='emagrecer'&&delta<0)||(p.goal==='massa'&&delta>0)?'var(--primary-2)':'var(--accent-2)');
  $('pf-body-info').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      <div class="info-cell"><div class="info-cell-icon">⚖️</div><div class="info-cell-lbl">PESO ATUAL</div><div class="info-cell-val mono">${cur?cur.toFixed(1)+'kg':'—'}</div></div>
      <div class="info-cell"><div class="info-cell-icon">📏</div><div class="info-cell-lbl">ALTURA</div><div class="info-cell-val mono">${p.height?p.height+' cm':'—'}</div></div>
      <div class="info-cell"><div class="info-cell-icon">📊</div><div class="info-cell-lbl">IMC</div><div class="info-cell-val mono" style="color:${imc?imc.color:'var(--text)'}">${imc?imc.value:'—'}</div></div>
    </div>
    <div style="margin-top:10px;padding:12px;border-radius:12px;background:var(--surface-2)">
      <div style="font-size:12px;color:var(--text-dim);font-weight:700;letter-spacing:1px">CLASSIFICAÇÃO</div>
      <div style="font-weight:800;color:${imc?imc.color:'var(--text)'};margin-top:2px">${imc?imc.cls:'—'}</div>
      <div style="font-size:12px;color:${deltaColor};margin-top:4px;font-weight:700">${deltaTxt} desde o início</div>
    </div>
  `;
  // Chart
  $('pf-weight-chart-slot').innerHTML = renderWeightChart();

  // Module
  const mod = state.modules[state.active];
  const isLift = state.active==='lift';
  $('pf-mod').innerHTML = `<div class="icon">${isLift?'🏋️':'🏃'}</div><div style="flex:1"><div class="name">${isLift?'Musculação':'Corrida'}</div><div class="goal">Objetivo: ${labelGoal(mod)}</div></div><button class="btn btn-outline" onclick="switchModuleUI()">→ ${isLift?'🏃 Corrida':'🏋️ Musculação'}</button>`;
  $('pf-plan-lbl').textContent = `Plano de ${isLift?'Musculação':'Corrida'}`;
  const s = mod.setup;
  const rows = isLift ? [['Objetivo',labelGoal(mod)],['Dias',s.days+'/semana'],['Equipamento',{academia:'🏋️ Academia',halteres:'🎒 Halteres',casa:'🏠 Peso corpo',basico:'💪 Básico'}[s.equip]]] : [['Objetivo',labelGoal(mod)],['Duração',mod.plan.totalWeeks+' semanas'],['Sessões',s.days+'/semana'],['Terreno',{asfalto:'🛣️ Asfalto',esteira:'🏃 Esteira',trilha:'⛰️ Trilha',pista:'🏟️ Pista'}[s.terrain]]];
  $('pf-plan-card').innerHTML = rows.map(r=>`<div style="display:flex;justify-content:space-between;padding:8px 0"><span class="text-dim">${r[0]}</span><b>${r[1]}</b></div>`).join('');
}

function renderWeightChart(){
  if(state.weights.length<2) return '<div class="text-dim" style="text-align:center;padding:20px;font-size:13px">Registre seu peso periodicamente pra ver a evolução aqui.</div>';
  const ws = state.weights.slice(-12);
  const min = Math.min(...ws.map(w=>w.weight)) - 2;
  const max = Math.max(...ws.map(w=>w.weight)) + 2;
  const rng = max-min || 1;
  const pts = ws.map((w,i)=>`${20+i*(360/(ws.length-1))},${100-((w.weight-min)/rng)*80}`).join(' ');
  return `<svg viewBox="0 0 400 120" width="100%" class="wchart">
    <polyline points="${pts}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${ws.map((w,i)=>`<circle cx="${20+i*(360/(ws.length-1))}" cy="${100-((w.weight-min)/rng)*80}" r="3" fill="#10b981"/>`).join('')}
    <text x="4" y="12" fill="#64748b" font-size="10">${max.toFixed(1)}kg</text>
    <text x="4" y="105" fill="#64748b" font-size="10">${min.toFixed(1)}kg</text>
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
  if(!v || v<30 || v>250) return toast('Peso inválido');
  state.weights.push({ date:Date.now(), weight:v });
  state.user.profile.currentWeight = v;
  saveData();
  checkWeightTrophies();
  toast(`✅ Peso ${v}kg registrado!`);
  closeModal();
  goTab('profile');
}

function checkWeightTrophies(){
  const p = state.user.profile; if(!p||state.weights.length<2) return;
  const first = firstWeight(), cur = latestWeight();
  const delta = cur - first;
  if(p.goal==='emagrecer' && delta < 0){
    const lost = Math.abs(delta);
    if(lost>=1) unlockTrophy('weight_down_1');
    if(lost>=3) unlockTrophy('weight_down_3');
    if(lost>=5) unlockTrophy('weight_down_5');
    if(lost>=10) unlockTrophy('weight_down_10');
    toast(`🎉 Parabéns! Você perdeu ${lost.toFixed(1)}kg desde o início!`);
  } else if(p.goal==='massa' && delta > 0){
    if(delta>=2) unlockTrophy('weight_up_2');
    if(delta>=5) unlockTrophy('weight_up_5');
    if(delta>=10) unlockTrophy('weight_up_10');
    toast(`💪 Bora! Você ganhou ${delta.toFixed(1)}kg desde o início!`);
  }
}

// ---------- TROPHIES ----------
function unlockTrophy(id){
  if(state.trophies.includes(id)) return;
  state.trophies.push(id);
  saveData();
  const t = TROPHIES.find(x=>x.id===id);
  if(t) setTimeout(()=>toast(`${t.emoji} Troféu desbloqueado: ${t.name}!`), 800);
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
    if(s.runTotal > runOnly.length) s.runTotal = runOnly.length;
    if(s.walkTotal > walkOnly.length) s.walkTotal = walkOnly.length;
    if(s.bikeTotal > bikeOnly.length) s.bikeTotal = bikeOnly.length;
  }
}
function checkTrophies(){
  ensureStats();
  // Remove troféus que foram desbloqueados por engano (versões antigas com km em dobro):
  // se o requisito não é mais atingido pelos contadores corrigidos, tranca de volta.
  const req = {
    run_km_10:['runKmTotal',10], run_km_50:['runKmTotal',50], run_km_100:['runKmTotal',100], run_km_500:['runKmTotal',500],
    walk_km_10:['walkKmTotal',10], walk_km_50:['walkKmTotal',50], walk_km_100:['walkKmTotal',100],
    bike_km_50:['bikeKmTotal',50], bike_km_100:['bikeKmTotal',100], bike_km_500:['bikeKmTotal',500],
    bike_10:['bikeTotal',10], bike_25:['bikeTotal',25], walk_10:['walkTotal',10], walk_25:['walkTotal',25],
    run_10:['runTotal',10], run_25:['runTotal',25], run_50:['runTotal',50]
  };
  state.trophies = state.trophies.filter(id=>{ const r=req[id]; return !r || state.stats[r[0]] >= r[1]; });
  // Contadores vitalícios: não zeram quando o histórico de 90 dias é limpo,
  // então troféus como "Centurião" (100 treinos) são alcançáveis de verdade.
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
  // Best single run (só corrida — caminhada e bike têm troféus próprios)
  const bestKm = Math.max(0, ...((state.modules.run?.history||[]).filter(r=>!r.activity||r.activity==='corrida').map(r=>r.distance||0)));
  if(bestKm>=5) unlockTrophy('run_5k_run');
  if(bestKm>=10) unlockTrophy('run_10k_run');
  if(bestKm>=21) unlockTrophy('run_21k_run');
  if(bestKm>=42) unlockTrophy('run_42k_run');
  // Streaks (combinado)
  const allHist = [...(state.modules.lift?.history||[]), ...(state.modules.run?.history||[])];
  const s = calcStreak(allHist);
  if(s>=3) unlockTrophy('streak_3');
  if(s>=7) unlockTrophy('streak_7');
  if(s>=14) unlockTrophy('streak_14');
  if(s>=30) unlockTrophy('streak_30');
  // Meta semanal
  const mod = state.modules[state.active];
  if(mod && mod.plan){
    const wkTarget = mod.plan.workouts.length;
    const startWk = new Date(); startWk.setHours(0,0,0,0); startWk.setDate(startWk.getDate()-6);
    const done7d = (mod.history||[]).filter(h=>h.at>=startWk.getTime()).length;
    if(done7d >= wkTarget) unlockTrophy('week_goal');
  }
}
// Progresso atual rumo a cada troféu contável (pra barra de progresso)
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
function openTrophies(){
  const catNames = { geral:'🌟 Gerais', streak:'🔥 Consistência', lift:'🏋️ Musculação', run:'🏃 Corrida', walk:'🚶 Caminhada', bike:'🚴 Bike', body:'⚖️ Corpo' };
  const cats = ['geral','streak','lift','run','walk','bike','body'];
  const groups = cats.map(c=>({ cat:c, name:catNames[c], items:TROPHIES.filter(t=>t.cat===c) }));
  const totalUnlocked = state.trophies.length;
  const pctAll = Math.round(totalUnlocked/TROPHIES.length*100);
  const html = `
    <h3>🏆 Suas conquistas</h3>
    <p style="color:var(--text-dim);font-size:13px;margin-top:2px">${totalUnlocked} de ${TROPHIES.length} desbloqueados</p>
    <div style="height:8px;border-radius:99px;background:rgba(148,163,184,0.15);margin-top:8px;overflow:hidden"><div style="height:100%;width:${pctAll}%;background:linear-gradient(90deg,#10b981,#34d399);border-radius:99px"></div></div>
    ${groups.map(g=>{
      const u = g.items.filter(t=>state.trophies.includes(t.id)).length;
      return `<div style="margin-top:18px"><div class="section-lbl" style="margin:0 0 8px">${g.name} · ${u}/${g.items.length}</div>
        <div class="trophy-grid">${g.items.map(t=>{
          const ul = state.trophies.includes(t.id);
          let bar = '';
          if(!ul){
            const pr = trophyProgress(t.id);
            if(pr && pr[0]>0){
              const pct = Math.min(99, Math.round(pr[0]/pr[1]*100));
              bar = `<div style="height:5px;border-radius:99px;background:rgba(148,163,184,0.18);margin-top:6px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--primary)"></div></div><div style="font-size:9.5px;color:var(--text-mute);margin-top:3px">${Math.floor(pr[0])}/${pr[1]}</div>`;
            }
          }
          return `<div class="trophy ${ul?'unlock':''}"><div class="trophy-emoji">${t.emoji}</div><div class="trophy-name">${t.name}</div><div class="trophy-desc">${t.desc}</div>${bar}</div>`;
        }).join('')}</div></div>`;
    }).join('')}
    <button class="btn btn-outline btn-block" style="margin-top:14px;border-color:rgba(16,185,129,0.4)" onclick="shareTrophiesImage()">📤 Compartilhar minhas conquistas</button>
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
function openExercise(name){ window.open(ytLink(name), '_blank'); }

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
      {v:'halteres', emo:'🎒', t:'Só halteres', s:'Halteres e barras em casa'},
      {v:'casa', emo:'🏠', t:'Peso do corpo', s:'Sem equipamentos'},
      {v:'basico', emo:'💪', t:'Básico', s:'Peso do corpo + halteres leves'}
    ];
    return `<h3>🏋️ Troca rápida de equipamento</h3><p style="color:var(--text-dim);font-size:13px">Seus treinos são regenerados na hora com o novo equipamento — objetivo, dias e nível continuam os mesmos.</p>
      ${opts.map(o=>`<div class="list-row" style="${o.v===cur?'border:1px solid var(--primary);border-radius:14px':''}" onclick="quickChangeEquip('${o.v}')">${o.emo} <span><b>${o.t}</b>${o.v===cur?' ✓ atual':''}<br><span style="font-size:12px;color:var(--text-dim)">${o.s}</span></span></div>`).join('')}
      <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Cancelar</button>`;
  },
  'faq':`<h3>❓ FAQ / Sobre</h3><p><b>MetaTreino</b> gera planos de treino inteligentes de musculação e corrida, personalizados.<br><br><b>Como funciona?</b> Escolha o módulo, responda o questionário e receba um plano progressivo.<br><br><b>Meus dados ficam salvos?</b> Sim, na nuvem, vinculados à sua conta Google — você pode entrar de qualquer aparelho. Histórico de treinos guardado por 90 dias.<br><br><b>Contato:</b> metatreinooficial@gmail.com</p><button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal()">Fechar</button>`,
  'edit-profile':()=>{ const p = state.user.profile||{}; return `<h3>✏️ Editar perfil</h3><div class="field"><label>Como quer ser chamado</label><input class="input" id="ep-nick" value="${p.nickname||''}"></div><div class="field"><label>Idade</label><input class="input mono" type="number" id="ep-age" value="${p.age||''}"></div><div class="field"><label>Altura (cm)</label><input class="input mono" type="number" id="ep-height" value="${p.height||''}"></div><div class="field"><label>WhatsApp</label><input class="input mono" id="ep-whats" value="${p.whatsapp||''}"></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="saveProfileEdit()">Salvar</button>`; },
  'add-weight':()=>{ const cur=latestWeight()||state.user.profile?.currentWeight||70; return `<h3>⚖️ Registrar peso hoje</h3><p style="color:var(--text-dim);font-size:13px">Última medição: <b>${cur}kg</b></p><div class="field"><label>Peso agora (kg)</label><input class="input mono" type="number" step="0.1" id="wt-val" value="${cur}"></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="saveWeight()">Salvar</button>`; },
  'add-student':`<h3>➕ Liberar acesso a aluno</h3><div class="field"><label>E-mail do aluno (mesmo da conta Google)</label><input class="input" type="email" id="as-email" placeholder="aluno@email.com"></div><div class="field"><label>Nome (opcional)</label><input class="input" id="as-name" placeholder="Nome do aluno"></div><div class="field"><label>WhatsApp (opcional)</label><input class="input mono" id="as-whats" placeholder="61999999999"></div><div class="field"><label>Duração do acesso</label><div class="radio-grid g3" id="as-dur"><div class="opt" data-val="7">🎁 Teste 7 dias</div><div class="opt" data-val="30">30 dias</div><div class="opt on" data-val="60">60 dias</div><div class="opt" data-val="90">90 dias</div><div class="opt" data-val="180">6 meses</div><div class="opt" data-val="365">1 ano</div><div class="opt" data-val="9999">Vitalício</div></div></div><div class="field"><label>Notas (opcional)</label><input class="input" id="as-notes" placeholder="Ex: Alunos plano premium"></div><div id="as-err"></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="doAddStudent()">Liberar acesso</button>`,
  'broadcast':`<h3>📢 Mensagem em massa (WhatsApp)</h3><p style="color:var(--text-dim);font-size:13px">Gera um link do WhatsApp Web para cada aluno com o texto abaixo. Os alunos precisam ter WhatsApp cadastrado.</p><div class="field"><label>Mensagem</label><textarea class="input" id="bc-msg" rows="4" style="resize:vertical">Olá, treinador aqui do MetaTreino! Passando pra lembrar...</textarea></div><button class="btn btn-primary btn-block" onclick="doBroadcast()">Abrir links WhatsApp</button>`,
  'restart':()=>`<h3>🔄 Começar do zero</h3><p style="color:var(--text-dim);font-size:13px;line-height:1.5">Apaga todo o seu progresso — treinos, séries registradas, recordes, histórico de peso e troféus — e refaz o questionário inicial.<br><br>Sua <b>conta e seu acesso continuam ativos</b> (diferente de excluir a conta).<br><br>Essa ação <b>não pode ser desfeita</b>.</p>
    <button class="btn btn-outline btn-block" style="margin-top:16px;border-color:#f59e0b;color:var(--accent-2)" onclick="doRestart()">🔄 Sim, começar do zero</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`,
  'delete-account':()=>{ const email=(state.user&&state.user.email)||''; return `<h3>🗑️ Excluir minha conta</h3><p style="color:var(--text-dim);font-size:13px;line-height:1.5">Isso apaga <b>permanentemente</b> todo o seu progresso: treinos, PRs, histórico de peso e troféus.<br><br>Seu acesso ao app continua liberado — você pode entrar de novo com a mesma conta Google (<b>${email}</b>) e começar do zero na hora.<br><br>Essa ação <b>não pode ser desfeita</b>.</p><button class="btn btn-outline btn-block" style="margin-top:16px;border-color:#ef4444;color:#ef4444" onclick="doDeleteAccount()">Sim, excluir minha conta</button><button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`; },
};
function openModal(k){
  const c = MODAL_CONTENT[k];
  $('modal-inner').innerHTML = typeof c==='function' ? c() : c;
  $('modal-back').classList.add('on');
  if(k==='add-student') bindOpts('modal-inner');
  if(k==='pain') document.querySelectorAll('#pain-areas .opt-multi').forEach(o=>{ o.onclick=()=>o.classList.toggle('on'); });
}
function closeModal(){ $('modal-back').classList.remove('on'); }
function saveProfileEdit(){
  const p = state.user.profile;
  p.nickname = $('ep-nick').value.trim() || p.nickname;
  p.age = parseInt($('ep-age').value) || p.age;
  p.height = parseFloat($('ep-height').value) || p.height;
  p.whatsapp = $('ep-whats').value.trim();
  saveData(); toast('✅ Perfil atualizado'); closeModal(); goTab('profile');
}

// Semana atual do plano, calculada da data de criação (avança sozinha).
// Musculação: ciclo de 12 semanas que recomeça (mesociclo). Corrida: para no total (prova).
function currentWeek(mod){
  if(!mod || !mod.plan) return {wk:1, total:12, cycle:1};
  const total = mod.plan.totalWeeks || 12;
  const created = mod.createdAt || Date.now();
  const elapsed = Math.floor((Date.now() - created) / (7*86400000)); // semanas completas
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
  treino_hoje(){
    const today = new Date(); today.setHours(0,0,0,0);
    const done = maAllHistory().filter(x=>{ const d=new Date(x.at); d.setHours(0,0,0,0); return d.getTime()===today.getTime(); });
    if(!done.length){
      const liftT = state.modules.lift?.plan?.workouts?.find(w=>w.dayIdx===getDayIdx());
      const runT = state.modules.run?.plan?.workouts?.find(w=>w.dayIdx===getDayIdx());
      if(liftT||runT) return `Hoje você ainda não registrou treino. No plano tem: ${[liftT&&('💪 '+(liftT.name||'Musculação')),runT&&('🏃 '+(runT.name||'Corrida'))].filter(Boolean).join(' e ')}. Bora? 💪`;
      return 'Hoje é dia de descanso no seu plano. Aproveite pra recuperar — descanso também é treino! 😴';
    }
    const lift = done.filter(x=>x.module==='lift'), run = done.filter(x=>x.module==='run');
    let r = '';
    if(lift.length){ const w=lift[0]; const n=(w.exercisesDone||[]).length; r += `Hoje você concluiu ${w.name}${n?` — ${n} exercícios`:''}, cerca de ${w.duration} min.${w.feel?` Você terminou se sentindo "${({otimo:'muito bem 🚀',bem:'bem 😊',cansado:'cansado 😮‍💨',exausto:'exausto 😩'})[w.feel]}".`:''} `; }
    if(run.length){ const w=run[0]; r += `${lift.length?'E ':''}Registrou ${w.name.replace(/^[🚶🚴🏃]\s*/,'')}${w.distance?` — ${w.distance}km`:''} em ${w.duration} min${w.pace?` (${w.pace})`:''}. `; }
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
    let r = `Você desbloqueou ${u} de ${t} troféus (${Math.round(u/t*100)}%).`;
    if(closest) r += ` O mais perto é "${closest.tr.name}": ${Math.floor(closest.pr[0])}/${closest.pr[1]}. Falta pouco! 🏆`;
    return r;
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
    const min=wk.reduce((s,x)=>s+(x.duration||0),0);
    const kcal=Math.round(min*7);
    if(!min) return 'Você não registrou treinos esta semana ainda. Bora movimentar? 🔥';
    return `Esta semana você somou ~${min} min de treino, o que representa aproximadamente ${kcal} kcal gastas. É uma estimativa grosseira — o gasto real varia com intensidade, peso e metabolismo. 🔥`;
  },
  motiva(){
    return contextualQuote() || QUOTES[Math.floor(Math.random()*QUOTES.length)];
  }
};
const MA_SUGGESTIONS = [
  {lbl:'📈 Minha evolução', key:'evolucao'},
  {lbl:'💪 Como foi meu treino?', key:'treino_hoje'},
  {lbl:'🏃 Minha corrida', key:'corrida'},
  {lbl:'🏆 Meus troféus', key:'trofeus'},
  {lbl:'🎯 Minha meta', key:'meta'},
  {lbl:'⚖️ Que músculo treino menos?', key:'musculo_menos'},
  {lbl:'📅 Quanto fiquei sem treinar?', key:'pausa'},
  {lbl:'🥇 Meu recorde', key:'recorde'},
  {lbl:'⏳ Há quanto uso o app?', key:'tempo_uso'},
  {lbl:'🔀 Corrida ou musculação?', key:'corrida_ou_musculacao'},
  {lbl:'⚖️ Meu peso', key:'maior_peso'},
  {lbl:'🔥 Calorias da semana', key:'calorias'},
  {lbl:'❤️ Me motive', key:'motiva'}
];
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
  if(has('ajuda','o que você faz','o que voce faz','o que sabe','pode fazer','como funciona','me ajuda')) return '_ajuda';
  // perguntas com dados
  if(has('perder','emagrec','quantos kg','quanto kg','posso perder')) return 'perder_peso';
  if(has('evolu','melhor','pior','progress','constan')) return 'evolucao';
  if(has('treino hoje','foi meu treino','como fui','treinei hoje')) return 'treino_hoje';
  if(has('corrida','correr','pace','ritmo')) return 'corrida';
  if(has('trofé','trofe','conquista','medalh')) return 'trofeus';
  if(has('meta','objetivo','prova')) return 'meta';
  if(has('músculo','musculo','menos')) return 'musculo_menos';
  if(has('pausa','sem treinar','parado','sequ','streak')) return 'pausa';
  if(has('recorde','pr ','carga máxima','peso máximo')) return 'recorde';
  if(has('quanto tempo','há quanto','uso o app','tempo de uso')) return 'tempo_uso';
  if(has('mais corrida','mais muscula','corrida ou')) return 'corrida_ou_musculacao';
  if(has('caloria','kcal','gastei','queim')) return 'calorias';
  if(has('peso','magro','gordura','quilos')) return 'maior_peso';
  if(has('motiv','frase','ânimo','animo','desanim')) return 'motiva';
  return null;
}
// ===== META ASSISTENTE: COMANDOS (executa ações por conversa) =====
// Interpreta frases de AÇÃO e devolve {done:true, msg} se executou, ou null se não é comando.
function maTryCommand(txt){
  const t = txt.toLowerCase().trim();
  const num = re => { const m=t.match(re); return m?parseFloat(m[1].replace(',','.')):null; };

  // ---- PESO ----
  // "estou pesando 108", "meu peso é 90kg", "pesei 85"
  let m = t.match(/(?:pesando|peso (?:é|e|atual|de)|pesei|estou com)\s*(\d+[.,]?\d*)\s*(?:kg|quilos?)?/);
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
  m = t.match(/dor (?:no|na|nos|nas|em|de)?\s*(ombro|lombar|coluna|costas|joelho|punho|cotovelo|tornozelo|pé|pe|pesco[çc]o|perna)/);
  if(/dor/.test(t) && (m || /estou com dor|to com dor|tô com dor|sinto dor|machuquei/.test(t))){
    return maSetPain(m?m[1]:null, t);
  }

  // ---- ESTADO EMOCIONAL / CANSAÇO ----
  if(/(estou|tô|to|me sinto|sinto)\s*(muito\s*)?(cansad|exaust|sem energia|acabad|esgotad)/.test(t)) return maTired();
  if(/(estou|tô|to|me sinto|sinto)\s*(triste|pra baixo|desanimad|sem [aâ]nimo|deprim|mal)/.test(t)) return maSad();
  if(/(estou|tô|to)\s*(de tpm|na tpm|menstruad|naqueles dias|de chico)/.test(t) || t.includes('tpm')) return maTPM();

  // ---- VOLTAR AO NORMAL ----
  if(/(voltar ao normal|to bem agora|tô bem agora|estou bem agora|sem dor agora|passou a dor|voltar treino normal|normalizar)/.test(t)) return maBackToNormal();

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
function maLogActivity(type, km, min){
  if(km<=0||km>200||min<=0||min>600) return {done:true, msg:'Esses números parecem estranhos 🤔. Tenta de novo, ex: "corri 5km em 30 minutos".'};
  const mod = state.modules.run;
  if(!mod){ return {done:true, msg:'Você ainda não tem um plano de corrida ativo. Crie um primeiro pra eu registrar suas atividades! 🏃'}; }
  const paceNum = min/km;
  const paceStr = Math.floor(paceNum)+':'+String(Math.round((paceNum-Math.floor(paceNum))*60)).padStart(2,'0')+'/km';
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
  return {done:true, msg:`✅ Registrei sua ${meta.lbl.toLowerCase()}: ${km}km em ${min} min (ritmo ${paceStr}). Está no seu histórico! ${meta.emo} Mandou bem!`};
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
function maSetPain(area, txt){
  const map = {ombro:'Ombro',lombar:'Lombar',coluna:'Lombar',costas:'Lombar',joelho:'Joelho',punho:'Punho/Cotovelo',cotovelo:'Punho/Cotovelo',tornozelo:'Tornozelo','pé':'Tornozelo',pe:'Tornozelo','pescoço':'Pescoço',pescoco:'Pescoço',perna:'Joelho'};
  const painArea = area ? map[area] : null;
  state.user.pain = state.user.pain||[];
  if(painArea && !state.user.pain.includes(painArea)) state.user.pain.push(painArea);
  if(typeof regenLiftExercises==='function') regenLiftExercises();
  saveData();
  const base = painArea
    ? `Entendi, você está com dor ${area==='joelho'||area==='ombro'||area==='cotovelo'||area==='punho'||area==='tornozelo'?'no':area==='costas'||area==='coluna'||area==='lombar'||area==='perna'?'na':'no'} ${area}. Já adaptei seus treinos pra proteger essa região 🩹.`
    : 'Entendi que você está com dor. Adaptei seus treinos pra pegar leve 🩹.';
  return {done:true, msg:`${base} Se a dor for forte ou persistir, procure um profissional de saúde — isso vem antes de qualquer treino. Quando melhorar, é só me dizer "voltar ao normal". 💚`};
}
function maTired(){
  const mod = state.modules[state.active];
  const restToday = mod && mod.plan && !mod.plan.workouts.find(w=>w.dayIdx===getDayIdx());
  let msg = 'Cansaço faz parte — e escutar o corpo é sinal de maturidade, não de fraqueza. ';
  if(restToday) msg += 'Hoje já é seu dia de descanso, então aproveite pra recarregar de verdade. 😴';
  else msg += 'Se você treinou pesado ontem, um treino mais leve hoje (ou até um dia extra de descanso) é totalmente válido. Se resolver treinar, comece devagar e veja como o corpo responde. Sono e hidratação ajudam muito na recuperação. 💚';
  return {done:true, msg};
}
function maSad(){
  return {done:true, msg:`Sinto muito que você esteja assim, ${maName()}. 💙 Dias difíceis acontecem com todo mundo. O exercício pode ajudar a clarear a cabeça — que tal uma caminhada leve, sem cobrança de desempenho? Mas se você não estiver bem, tudo bem descansar hoje. E se esse sentimento persistir, conversar com alguém de confiança ou um profissional faz muita diferença. Você não está sozinho. 🤍`};
}
function maTPM(){
  state.user.pain = state.user.pain||[];
  if(!state.user.tpmMode){ state.user.tpmMode = true; if(typeof regenLiftExercises==='function') regenLiftExercises(); saveData(); }
  return {done:true, msg:'Entendi 💗. Nesses dias o corpo pede mais gentileza — deixei seus treinos mais leves. Respeite seu ritmo: treinar leve ou até descansar é perfeitamente ok. Movimento suave (caminhada, alongamento) pode ajudar com o desconforto, mas sem cobrança. Quando quiser voltar ao normal, é só dizer "voltar ao normal". 🌸'};
}
function maBackToNormal(){
  const tinha = (state.user.pain&&state.user.pain.length) || state.user.tpmMode;
  state.user.pain = [];
  state.user.tpmMode = false;
  if(typeof regenLiftExercises==='function') regenLiftExercises();
  saveData();
  return {done:true, msg: tinha ? '🎉 Que bom que está melhor! Seus treinos voltaram ao normal. Bora com tudo — respeitando sempre os limites do corpo! 💪' : 'Tudo certo, seus treinos já estão no modo normal! 💪'};
}
// ===== FIM COMANDOS =====

// respostas sociais (não dependem de dados)
const MA_SOCIAL = {
  _oi(){ const s=maSaudacao(); return `${s}, ${maName()}! 👋 Como posso te ajudar? Você pode me perguntar sobre sua evolução, corrida, troféus, meta e mais — ou tocar numa das sugestões.`; },
  _bomdia(){ return `Bom dia, ${maName()}! ☀️ Pronto pra mais um dia de evolução? Me pergunte algo ou toque numa sugestão.`; },
  _boatarde(){ return `Boa tarde, ${maName()}! 💪 Como posso ajudar? Quer saber como está sua evolução?`; },
  _boanoite(){ return `Boa noite, ${maName()}! 🌙 Bora fechar o dia com chave de ouro? Me pergunte o que quiser sobre seus treinos.`; },
  _tchau(){ return `Até a próxima, ${maName()}! 👊 Continue firme — a constância é o que transforma. Bons treinos!`; },
  _quemsou(){ return 'Sou o Meta Assistente 🤖 — não sou uma IA de verdade, mas analiso seus dados reais de treino pra te dar respostas úteis na hora. Pergunte sobre sua evolução, corrida, recordes, meta e muito mais!'; },
  _comovai(){ return `Tô ótimo e pronto pra te ajudar! 😄 Mas o que importa é como VOCÊ está. Quer que eu mostre sua evolução recente, ${maName()}?`; },
  _ajuda(){ return 'Posso te contar: 📈 sua evolução, 💪 como foi seu treino, 🏃 sua corrida, 🏆 seus troféus, 🎯 sua meta, qual músculo você treina menos, sua maior pausa, recordes, quanto tempo usa o app, peso, calorias e ainda te motivar. É só tocar numa sugestão ou digitar!'; }
};
function maSaudacao(){ const h=new Date().getHours(); return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; }
let maThread = [];
function openAssistant(){
  maThread = [{who:'bot', txt:`👋 Olá, ${maName()}! Sou o Meta Assistente. Pergunte sobre seus treinos ou me peça pra registrar coisas — ex: "corri 5km em 30 min", "estou pesando 90kg" ou "estou com dor no joelho". Toque numa sugestão ou digite. 💪`}];
  renderAssistant();
}
function renderAssistant(){
  const bubbles = maThread.map(m=>m.who==='bot'
    ? `<div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:16px 16px 16px 4px;padding:11px 14px;margin:6px 0;font-size:13.5px;line-height:1.5;max-width:88%">${m.txt}</div>`
    : `<div style="background:var(--surface);border-radius:16px 16px 4px 16px;padding:11px 14px;margin:6px 0 6px auto;font-size:13.5px;max-width:88%;text-align:right">${m.txt}</div>`
  ).join('');
  // se a pessoa está com dor ou modo TPM, mostra atalho de voltar ao normal
  const emModoLeve = (state.user && ((state.user.pain&&state.user.pain.length) || state.user.tpmMode));
  const sugs = emModoLeve
    ? [{lbl:'💚 Voltar treinos ao normal', key:'_normal'}, ...MA_SUGGESTIONS]
    : MA_SUGGESTIONS;
  $('modal-inner').innerHTML = `
    <h3>🤖 Meta Assistente</h3>
    <div id="ma-thread" style="max-height:42vh;overflow-y:auto;margin:10px 0;display:flex;flex-direction:column">${bubbles}</div>
    <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px">
      ${sugs.map(s=>`<button class="btn btn-ghost" style="padding:7px 12px;font-size:12px;white-space:nowrap;flex-shrink:0" onclick="maAsk('${s.key}')">${s.lbl}</button>`).join('')}
    </div>
    <div class="row" style="gap:6px">
      <input class="input" id="ma-input" placeholder="Pergunte ou registre algo..." style="flex:1" onkeydown="if(event.key==='Enter')maAskText()">
      <button class="btn btn-primary" style="padding:11px 16px" onclick="maAskText()">➤</button>
    </div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
  const th=$('ma-thread'); if(th) th.scrollTop=th.scrollHeight;
}
function maAsk(key){
  if(key==='_normal'){
    maThread.push({who:'user', txt:'Voltar treinos ao normal'});
    const r = maBackToNormal();
    maThread.push({who:'bot', txt:r.msg});
    renderAssistant();
    return;
  }
  const sug = MA_SUGGESTIONS.find(s=>s.key===key);
  maThread.push({who:'user', txt: sug?sug.lbl.replace(/^[^\s]+\s/,''):key});
  const fn = MA_ANSWERS[key];
  maThread.push({who:'bot', txt: fn?fn():'Ainda não sei responder isso, mas estou aprendendo! 😊'});
  renderAssistant();
}
function maAskText(){
  const inp=$('ma-input'); if(!inp) return;
  const txt=inp.value.trim(); if(!txt) return;
  maThread.push({who:'user', txt});
  let answer;
  // 1) tenta executar como COMANDO (registrar peso, atividade, dor, etc.)
  const cmd = maTryCommand(txt);
  if(cmd && cmd.done){ answer = cmd.msg; }
  else {
    // 2) senão, interpreta como pergunta/social
    const key = maInterpret(txt);
    if(key && MA_SOCIAL[key]) answer = MA_SOCIAL[key]();
    else if(key && MA_ANSWERS[key]) answer = MA_ANSWERS[key]();
    else answer = 'Hmm, não entendi bem. 🤔 Você pode me pedir pra registrar coisas ("corri 5km em 30 min", "estou pesando 90kg", "estou com dor no joelho") ou perguntar sobre sua evolução, corrida, troféus, meta, recordes... É só falar!';
  }
  maThread.push({who:'bot', txt:answer});
  renderAssistant();
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
      if(!confirm('Restaurar este backup? Seus dados atuais serão SUBSTITUÍDOS pelos do arquivo.')) return;
      const keepUser = { ...est.user, email: state.user.email, isAdmin: state.user.isAdmin }; // conta logada manda
      state = {...state, ...est, user:keepUser, ui:{tab:'home',selectedSession:null}};
      ensureStats();
      saveData(); syncToCloud();
      closeModal();
      toast('✅ Backup restaurado com sucesso!');
      goTab('home');
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
    el.style.cssText = 'position:fixed;bottom:76px;left:14px;right:14px;z-index:350;background:linear-gradient(135deg,#0a1628,#06281f);border:1.5px solid var(--primary);border-radius:18px;padding:13px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 30px rgba(16,185,129,0.25)';
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
function regenLiftExercises(){
  const mod = state.modules.lift;
  if(!mod || !mod.plan) return;
  const tpm = state.user && state.user.tpmMode;
  mod.plan.workouts.forEach(w=>{
    w.exercises = buildLiftExercises(w.parts, mod.setup);
    // modo TPM: aligeira o treino (menos séries, deixa mais confortável)
    if(tpm) w.exercises.forEach(ex=>{ ex.sets = Math.max(2, (parseInt(ex.sets)||3)-1); });
    w.duration = estimateLiftDuration(w.exercises, mod.setup.goal);
  });
}
function savePain(){
  const sel = [...document.querySelectorAll('#pain-areas .opt-multi.on')].map(o=>o.dataset.val);
  state.user.pain = sel;
  regenLiftExercises();
  saveData();
  closeModal();
  toast(sel.length ? '🩹 Treinos adaptados pra proteger: '+sel.join(', ') : '✅ Sem dor registrada');
  goTab(state.ui.tab||'home');
}
function clearPain(){
  state.user.pain = [];
  regenLiftExercises();
  saveData();
  closeModal();
  toast('✅ Que bom! Treinos de volta ao normal.');
  goTab(state.ui.tab||'home');
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
  const gentle = (setup.level==='iniciante') && ((imcVal && imcVal>=30) || (p && p.age>=50));
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
  mod.setup.equip = equip;
  // Regenera SÓ os exercícios de cada treino — dias, objetivo e nível permanecem
  mod.plan.workouts.forEach(w=>{
    w.exercises = buildLiftExercises(w.parts, mod.setup);
    w.duration = estimateLiftDuration(w.exercises, mod.setup.goal);
  });
  saveData();
  closeModal();
  const lbl = {academia:'Academia completa', halteres:'Só halteres', casa:'Peso do corpo', basico:'Básico'}[equip]||equip;
  toast(`🏋️ Treinos regenerados para: ${lbl}`);
  goTab('profile');
}

// ---------- FOTO DE PERFIL ----------
function removePhoto(){
  if(!state.user || !state.user.profile || !state.user.profile.photo) return;
  if(!confirm('Remover sua foto de perfil?')) return;
  state.user.profile.photo = null; // null sobrescreve na nuvem (delete não propagava)
  saveData(); syncToCloud();
  toast('🗑️ Foto removida');
  goTab('profile');
}

// ---------- RESUMO DA SEMANA + COMPARTILHAMENTO ----------
function weekStats(){
  const today = getDayIdx();
  const startWk = new Date(); startWk.setHours(0,0,0,0); startWk.setDate(startWk.getDate()-(today-1));
  const t0 = startWk.getTime();
  const liftH = (state.modules.lift?.history||[]).filter(h=>h.at>=t0);
  const runH = (state.modules.run?.history||[]).filter(h=>h.at>=t0);
  const kmBy = type => runH.filter(r=>type==='corrida' ? (!r.activity||r.activity==='corrida') : r.activity===type).reduce((s,r)=>s+(r.distance||0),0);
  const totalMin = [...liftH,...runH].reduce((s,x)=>s+(x.duration||0),0);
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
    x.fillText(cutTxt(x, t, 790), 145, yL);
    yL += 38;
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
      <img src="${URL.createObjectURL(blob)}" style="width:100%;border-radius:14px;margin:12px 0;border:1px solid var(--border)">
      <button class="btn btn-primary btn-block" onclick="doShareNow('${shareText.replace(/'/g,"\\'")}')">📲 Compartilhar agora</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="doSaveToDevice()">💾 Salvar no celular</button>
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
    (map[p] = map[p]||[]).push(e.name);
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
    subtitle:unlocked.length+' de '+TROPHIES.length+' troféus',
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
        {rotulo:'Tempo', valor:x.duration+' min'},
        {rotulo:'Ritmo médio', valor:x.pace||'—'},
        {rotulo:'Sensação', valor:x.rating>=5?'Ótimo 🚀':x.rating<=1?'Difícil 😩':'Normal 😊'}
      ],
      listaTitulo:'Atividade',
      lista:[x.name.replace(/^[🚶🚴🏃]\\s*/,'')],
      destaque:'Treinei hoje com MetaTreino 💪'
    });
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
  shareCanvas(c, 'metatreino-treino.png', 'Treino concluído no MetaTreino 💪');
}

// ---------- MURAL DO TREINADOR ----------
// Foto e mensagem fixada que o admin edita e todos os alunos veem na tela Hoje.
let coachMural = null;
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
  // logo personalizado no cabeçalho da Home
  const logo = $('home-brand-logo');
  if(logo){
    if(coachMural && coachMural.foto){
      logo.style.background='none';
      logo.innerHTML = `<img src="${coachMural.foto}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`;
    } else { logo.style.background=''; logo.innerHTML = 'M'; }
  }
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
        <div id="mural-preview" style="width:52px;height:52px;border-radius:12px;overflow:hidden;background:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:900;color:#022c22;flex-shrink:0">${m.foto?`<img src="${m.foto}" style="width:100%;height:100%;object-fit:cover">`:'M'}</div>
        <button class="btn btn-ghost" style="flex:1" onclick="document.getElementById('mural-foto-input').click()">📷 Escolher foto</button>
        ${m.foto?`<button class="btn btn-ghost" onclick="muralFotoTemp='REMOVE';document.getElementById('mural-preview').innerHTML='M'">🗑️</button>`:''}
      </div>
      <input type="file" id="mural-foto-input" accept="image/*" style="display:none" onchange="onMuralFotoPicked(event)">
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="saveMural()">💾 Publicar pra todos os alunos</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`;
  $('modal-back').classList.add('on');
}
let muralFotoTemp = null;
function onMuralFotoPicked(ev){
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  const img = new Image();
  const reader = new FileReader();
  reader.onload = ()=>{
    img.onload = ()=>{
      // comprime pra 160px (fica leve no Firestore e rápido de carregar)
      const c = document.createElement('canvas');
      const s = Math.min(img.width, img.height);
      c.width = 160; c.height = 160;
      const x = c.getContext('2d');
      x.drawImage(img, (img.width-s)/2, (img.height-s)/2, s, s, 0, 0, 160, 160);
      muralFotoTemp = c.toDataURL('image/jpeg', 0.82);
      $('mural-preview').innerHTML = `<img src="${muralFotoTemp}" style="width:100%;height:100%;object-fit:cover">`;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  ev.target.value = '';
}
async function saveMural(){
  const msg = $('mural-msg').value.trim();
  const data = { mensagem:msg, atualizadoEm:Date.now() };
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

// ---------- PAINEL DE VÍDEOS (ADMIN) ----------
async function openVideoAdmin(){
  await loadVideoLinks(); // garante a lista mais atual
  const groups = EX_BANK.map(cat=>{
    const items = cat.items.map(ex=>{
      const id = slug(ex.name);
      const cur = videoLinks[id]||'';
      return `<div style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:13.5px;font-weight:700">${ex.name} ${cur?'<span style="color:var(--primary-2);font-size:11px">● link próprio</span>':''}</div>
        <div class="row" style="gap:6px;margin-top:6px">
          <input class="input" id="vid-${id}" value="${cur.replace(/"/g,'&quot;')}" placeholder="Cole o link do vídeo (YouTube, Drive...)" style="flex:1;font-size:12.5px;padding:9px 12px">
          <button class="btn btn-ghost" style="padding:9px 12px;font-size:12.5px" onclick="testVideoLink('${id}','${ex.name.replace(/'/g,"\\'")}')" title="Abrir link para testar">▶</button>
          <button class="btn btn-primary" style="padding:9px 14px;font-size:12.5px" onclick="saveVideoLink('${id}','${ex.name.replace(/'/g,"\\'")}')">💾</button>
        </div>
      </div>`;
    }).join('');
    return `<div style="margin-top:16px"><div class="section-lbl" style="margin:0 0 4px">${cat.name} · ${cat.items.length}</div>${items}</div>`;
  }).join('');
  $('modal-inner').innerHTML = `
    <h3>🎬 Vídeos dos exercícios</h3>
    <p style="color:var(--text-dim);font-size:13px;line-height:1.5">Cole o link do SEU vídeo pra cada exercício. Quando o aluno tocar em "Ver como fazer", abre o seu vídeo. Sem link cadastrado, abre a busca do YouTube. Deixe vazio e salve pra remover.</p>
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
async function saveVideoLink(id, exName){
  const inp = $('vid-'+id); if(!inp) return;
  const url = inp.value.trim();
  if(url && !/^https?:\/\//i.test(url)){ toast('⚠️ O link precisa começar com http:// ou https://'); return; }
  try{
    if(url){
      await db.collection('videosExercicios').doc(id).set({ nome:exName, url, atualizadoEm:Date.now() });
      videoLinks[id] = url;
      toast('✅ Vídeo salvo: '+exName);
    } else {
      await db.collection('videosExercicios').doc(id).delete();
      delete videoLinks[id];
      toast('🗑️ Link removido: '+exName);
    }
    try{ localStorage.setItem('metatreino_videos', JSON.stringify(videoLinks)); }catch(e){}
    renderVideoCount();
  }catch(e){
    console.log('Erro ao salvar vídeo:', e);
    toast('⚠️ Não foi possível salvar. Confira as regras do Firestore (coleção videosExercicios).');
  }
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
  showScreen('scr-admin');
  const p = state.user.profile;
  $('adm-hi').textContent = 'Olá, '+((p&&p.nickname)||'Marcelo')+'!';
  $('adm-list').innerHTML = `<div class="rest-card"><div style="font-size:34px">⏳</div><div class="rest-sub">Carregando alunos...</div></div>`;
  await loadAdminData();
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
function setAdminFilter(f){ admFilter=f; document.querySelectorAll('#adm-filter-chips .filter-chip').forEach(c=>c.classList.toggle('on', c.dataset.f===f)); renderAdminList(); }
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
  if(!items.length){ $('adm-list').innerHTML = `<div class="rest-card"><div style="font-size:44px">👥</div><div class="rest-title">Nenhum aluno</div><div class="rest-sub">Clique em "Liberar acesso" pra começar.</div></div>`; return; }
  $('adm-list').innerHTML = items.map(x=>{
    const days = x.expiresAt ? Math.ceil((x.expiresAt-now)/86400000) : 9999;
    const isActive = x.active && days>0;
    const cls = !isActive?'off':days<7?'warn':'on';
    const daysLbl = days>=9999?'∞':days<=0?'Expirado':`${days}d`;
    return `<div class="stud" onclick="openStudent('${x.email}')">
      <div class="stud-top"><div><div class="stud-name">${x.user?.nome || x.name || x.email.split('@')[0]}</div><div class="stud-email">${x.email}</div></div><div class="stud-days ${cls}">${daysLbl}</div></div>
      <div class="stud-meta">${x.phone?`<span>📱 <b>${x.phone}</b></span>`:''}${x.notes?`<span>📝 ${x.notes}</span>`:''}${x.expiresAt && (x.expiresAt-x.addedAt)<=8*86400000?`<span>🎁 <b>teste</b></span>`:''}</div>
    </div>`;
  }).join('');
}
async function doAddStudent(){
  const email = $('as-email').value.trim().toLowerCase();
  const name = $('as-name').value.trim();
  const phone = $('as-whats').value.trim();
  const notes = $('as-notes').value.trim();
  const dur = parseInt(readOpt('as-dur'));
  const err = $('as-err'); err.innerHTML='';
  if(!email || !email.includes('@')){ err.innerHTML='<div class="err">E-mail inválido</div>'; return; }
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
        ? `<button class="btn btn-outline btn-block" style="border-color:rgba(16,185,129,0.4)" onclick="setLifetime('${email}')">♾️ Tornar vitalício</button>`
        : `<button class="btn btn-ghost btn-block" onclick="unsetLifetime('${email}')">📅 Remover vitalício (definir 30 dias)</button>`}
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
    <button class="btn btn-ghost btn-block danger" style="margin-top:8px;color:#fda4af;border-color:rgba(244,63,94,0.3)" onclick="removeStudent('${email}')">🗑️ Remover aluno</button>
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
    await db.collection('usuariosAutorizados').doc(email).update({ active:novoAtivo });
    a.active = novoAtivo;
    toast(a.active?'🔓 Aluno reativado':'🔒 Aluno bloqueado');
    openStudent(email);
  }catch(e){ console.log('Erro ao bloquear/reativar aluno:', e); toast('⚠️ Não foi possível salvar. Confira as permissões do Firestore.'); }
}
async function removeStudent(email){
  if(!confirm('Remover este aluno da lista? A conta dele será mantida mas ele perderá o acesso.')) return;
  try{
    await db.collection('usuariosAutorizados').doc(email).delete();
    delete allowCache[email];
    toast('🗑️ Aluno removido'); goAdmin();
  }catch(e){ console.log('Erro ao remover aluno:', e); toast('⚠️ Não foi possível remover. Confira as permissões do Firestore.'); }
}
function doBroadcast(){
  const msg = $('bc-msg').value;
  const phones = Object.values(allowCache).filter(a=>a.active && a.phone).map(a=>a.phone);
  if(!phones.length){ toast('Nenhum aluno com WhatsApp cadastrado'); return; }
  closeModal();
  const links = phones.map(p=>`https://wa.me/${p.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`);
  const w = window.open('','_blank');
  w.document.write(`<html><head><title>Envio em massa</title><style>body{font-family:sans-serif;padding:20px;background:#050914;color:#e2e8f0}a{display:block;padding:12px 16px;background:#10b981;color:#022c22;text-decoration:none;border-radius:12px;margin:6px 0;font-weight:700}</style></head><body><h2>📢 Clique em cada link para abrir o WhatsApp:</h2>${links.map((l,i)=>`<a href="${l}" target="_blank">Aluno ${i+1} · abrir WhatsApp</a>`).join('')}</body></html>`);
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
  const muscleBlock = parts.length ? `
    <div class="card" style="margin-top:12px">
      <div class="section-lbl" style="margin:0 0 8px">💪 Músculos trabalhados</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${parts.map(p=>`<span style="font-size:12.5px;padding:5px 13px;border-radius:999px;background:rgba(16,185,129,0.14);color:var(--primary-2);font-weight:800;border:1px solid rgba(16,185,129,0.3)">${p}</span>`).join('')}</div>
    </div>` : '';
  const exBlock = (x.exercisesDone && x.exercisesDone.length) ? `
    <div class="section-lbl" style="margin-top:14px">Exercícios por grupo</div>
    <div class="card">${groupByPart(x.exercisesDone).map(l=>`<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13.5px"><b style="color:var(--primary-2)">${l.split(':')[0]}:</b>${l.split(':').slice(1).join(':')}</div>`).join('')}
    <div style="margin-top:8px">${x.exercisesDone.map(e=>`<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="font-size:13px;color:var(--text-dim)">${e.name}</span><b class="mono" style="font-size:12.5px;color:var(--primary-2)">${e.sets}× · ${e.best}</b></div>`).join('')}</div></div>` : '';
  const html = `
    <h3>📝 Detalhes do treino</h3>
    ${muscleBlock}
    ${exBlock}
    <div class="field" style="margin-top:12px"><label>Nome</label><input class="input" id="he-name" value="${x.name.replace(/"/g,'&quot;')}"></div>
    <div class="field"><label>Data</label><input class="input" type="datetime-local" id="he-date" value="${d.toISOString().slice(0,16)}" style="color-scheme:dark"></div>
    <div class="field"><label>Duração (min)</label><input class="input mono" type="number" id="he-dur" value="${x.duration||0}"></div>
    ${isRun?`<div class="field"><label>Distância (km)</label><input class="input mono" type="number" step="0.1" id="he-km" value="${x.distance||''}"></div>`:''}
    <div class="row" style="gap:8px;margin-top:14px">
      <button class="btn btn-ghost btn-block" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary btn-block" onclick="saveHistoryEntry(${idx})">💾 Salvar</button>
    </div>
    <button class="btn btn-outline btn-block" style="margin-top:10px" onclick="shareWorkoutImage(${idx})">📤 Compartilhar como imagem</button>
    <button class="btn btn-block" style="margin-top:8px;background:rgba(244,63,94,0.1);color:#fda4af;border:1px solid rgba(244,63,94,0.3)" onclick="deleteHistoryEntry(${idx})">🗑️ Excluir este treino</button>
  `;
  $('modal-inner').innerHTML = html;
  $('modal-back').classList.add('on');
}
function saveHistoryEntry(idx){
  const mod = state.modules[state.active];
  const x = (mod.history||[])[idx]; if(!x) return;
  x.name = $('he-name').value.trim() || x.name;
  const dv = $('he-date').value;
  if(dv){ const nd = new Date(dv); if(!isNaN(nd)) x.at = nd.getTime(); }
  x.duration = parseInt($('he-dur').value) || x.duration;
  const kmEl = $('he-km'); if(kmEl){ const km = parseFloat(kmEl.value); if(km>0){ x.distance = km; if(x.duration) { const pace = x.duration/km; x.pace = Math.floor(pace)+':'+String(Math.round((pace-Math.floor(pace))*60)).padStart(2,'0')+'/km'; } } }
  saveData();
  toast('✅ Treino atualizado');
  closeModal();
  renderHistory();
}
function deleteHistoryEntry(idx){
  if(!confirm('Excluir este treino do histórico? Não pode ser desfeito.')) return;
  const mod = state.modules[state.active];
  const x = mod.history[idx];
  // se for treino de musculação DE HOJE, oferece limpar também as séries registradas —
  // assim a sessão volta ao estado "pra fazer" e pode ser registrada de novo
  if(x && x.module==='lift'){
    const d = new Date(x.at); d.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    if(d.getTime()===today.getTime() && confirm('Limpar também as séries registradas hoje nesses exercícios? (Assim você pode registrar o treino de novo do zero)')){
      const ids = (x.exercisesDone||[]).map(e=>e.id || slug(e.name));
      ids.forEach(id=>{
        if(!state.progress[id]) return;
        state.progress[id] = state.progress[id].filter(p=>{ const pd=new Date(p.date); pd.setHours(0,0,0,0); return pd.getTime()!==today.getTime(); });
        if(!state.progress[id].length) delete state.progress[id];
      });
      // desfaz o contador vitalício deste treino
      ensureStats();
      if(state.stats.liftTotal>0) state.stats.liftTotal--;
    }
  }
  mod.history.splice(idx, 1);
  saveData();
  toast('🗑️ Treino excluído');
  closeModal();
  renderHistory();
}

// ---------- SWAP EXERCISE ----------
function openSwapExercise(exId){
  const mod = state.modules.lift;
  const w = mod.plan.workouts.find(w=>w.exercises.some(e=>e.id===exId));
  if(!w) return;
  const cur = w.exercises.find(e=>e.id===exId);
  const equip = mod.setup.equip || 'academia';
  const equipFilter = equip==='basico'?['casa','halteres']:equip==='academia'?['academia','halteres','casa']:equip==='halteres'?['halteres','casa']:['casa'];
  const cat = EX_BANK.find(c=>c.name===cur.part) || EX_BANK.find(c=>c.items.some(x=>slug(x.name)===exId));
  if(!cat){ toast('Não foi possível encontrar alternativas'); return; }
  const usedIds = new Set(w.exercises.map(e=>e.id));
  // "assinatura" do estímulo: parte específica do músculo (ex: "Peito Superior", "Peito (isolador)")
  // — usada pra não sugerir algo que treina exatamente o mesmo que outro exercício já no treino
  const stim = s => (s||'').toLowerCase().replace(/[()]/g,'').trim();
  const usedStims = new Set(w.exercises.filter(e=>e.id!==exId).map(e=>stim(e.sub)));
  const compat = cat.items.filter(ex => !usedIds.has(slug(ex.name)) && (ex.equip||[]).some(e=>equipFilter.includes(e)));
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
function doSwapExercise(oldId, newId, newName, newSub){
  const mod = state.modules.lift;
  const w = mod.plan.workouts.find(w=>w.exercises.some(e=>e.id===oldId));
  const idx = w.exercises.findIndex(e=>e.id===oldId);
  const old = w.exercises[idx];
  const cat = EX_BANK.find(c=>c.items.some(x=>slug(x.name)===newId));
  const newEx = cat.items.find(x=>slug(x.name)===newId);
  w.exercises[idx] = { id:newId, name:newName, sub:newSub, sets:old.sets, reps:old.reps, rest:old.rest, part:old.part, equip:newEx.equip };
  saveData();
  toast(`✅ Trocado por ${newName}`);
  closeModal();
  if(state.ui.tab==='sessions') renderSessions();
}

// ---------- RUN LOG (km + tempo real) ----------
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
    <div class="field"><label>Tempo total (minutos)</label><input class="input mono" type="number" id="rl-min" placeholder="Ex: 32"${livre?'':` value="${w.duration}"`}></div>
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
  const min = parseInt($('rl-min').value);
  const rate = parseInt(readOpt('rl-rate')) || 3;
  const type = readOpt('rl-type') || 'corrida';
  if(!km || km<=0){ toast('Distância inválida'); return; }
  if(!min || min<=0){ toast('Tempo inválido'); return; }
  const mod = state.modules.run;
  const livre = String(dayIdx)==='livre';
  const w = livre ? { k:'livre', name:'Atividade livre', dayIdx:getDayIdx() } : mod.plan.workouts.find(x=>String(x.dayIdx)===String(dayIdx));
  if(!w){ toast('Erro ao registrar'); return; }
  const pace = (min/km);
  const paceStr = Math.floor(pace) + ':' + String(Math.round((pace-Math.floor(pace))*60)).padStart(2,'0') + '/km';
  const meta = ACTIVITY_META[type] || ACTIVITY_META.corrida;
  const name = (type==='corrida' && !livre) ? w.name : `${meta.emo} ${meta.lbl} — ${km}km`;
  mod.history = mod.history || [];
  mod.history.push({ id:w.k, name, at:Date.now(), duration:min, distance:km, pace:paceStr, rating:rate, module:'run', activity:type });
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
  checkTrophies();
  recalibrateRunPlan(); // os próximos treinos se ajustam ao que você registrou
  saveData();
  toast(`${meta.emo} ${meta.lbl} salva: ${km}km em ${min}min (${paceStr})`);
  closeModal();
  goTab('home');
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

Object.assign(window,{doGoogleSignIn,doLogout,doDeleteAccount,pickModule,finishSetup,switchModule,switchModuleUI,goTab,openSession,selectSession,toggleWeeklyBlock,openModal,closeModal,saveProfileEdit,regenPlan,setLibFilter,filterLib,openExercise,saveQuiz,openSetLog,updateSet,delSet,addSet,closeSetLog,finishLiftWorkout,confirmLiftWorkout,markRunDone,openTrophies,pickPhoto,onPhotoPicked,removePhoto,saveWeight,goAdmin,setAdminFilter,renderAdminList,doAddStudent,openStudent,adjustDays,toggleStudent,removeStudent,doBroadcast,exportData,openSwapExercise,doSwapExercise,openRunLog,saveRunLog,openHistoryEntry,saveHistoryEntry,deleteHistoryEntry,quickChangeEquip,quickChangeTerrain,openVideoAdmin,saveVideoLink,openAssistant,maAsk,maAskText,openMuralAdmin,onMuralFotoPicked,saveMural,setLifetime,unsetLifetime,doRestart,startRestFor,startRestTimer,stopRestTimer,toggleRestMute,exportMyData,importMyData,savePain,clearPain,openWeekSummary,shareWeekImage,shareWorkoutImage,shareTrophiesImage,doShareNow,doSaveToDevice,testVideoLink});

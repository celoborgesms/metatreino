// ===== MetaTreino v2.0 =====
const AUTH_KEY = 'metatreino_auth_v1';
const USERS_KEY = 'metatreino_users_v1';
const ALLOW_KEY = 'metatreino_allowlist_v1';
const ADMIN_KEY = 'metatreino_admin_v1';
const DATA_PREFIX = 'metatreino_data_';

const ADMIN_EMAIL = 'celoborgesms@gmail.com';
const CONTACT_EMAIL = 'celoborgesms@gmail.com';
const HISTORY_RETENTION_DAYS = 90;

// ---------- STATE ----------
let state = {
  user: null,
  active: 'lift',
  modules: { lift: null, run: null },
  progress: {},   // { exId: [{date, sets:[{peso,reps}]}] }
  prs: {},        // { exId: {peso, reps, at} }
  weights: [],    // [{date, weight}]
  trophies: [],   // ['first_workout', ...]
  ui: { tab: 'home', selectedSession: null }
};

const QUOTES = [
  '🌱 Pequeno hoje, grande amanhã. Confie no processo.',
  '💪 Disciplina supera motivação todos os dias.',
  '🔥 O único treino ruim é o que você não fez.',
  '🎯 Foco no processo, o resultado vem.',
  '⚡ Constância bate intensidade no longo prazo.',
  '🚀 Cada série te aproxima da versão melhor de você.',
  '🌊 Você é mais forte do que sua última desculpa.'
];

const TROPHIES = [
  { id:'first_workout', emoji:'🥇', name:'Primeiro treino', desc:'Concluiu o primeiro treino' },
  { id:'streak_3', emoji:'🔥', name:'Streak 3 dias', desc:'3 dias seguidos treinando' },
  { id:'streak_7', emoji:'⚡', name:'Streak 7 dias', desc:'Uma semana firme!' },
  { id:'streak_14', emoji:'🌟', name:'Streak 14 dias', desc:'Duas semanas de disciplina' },
  { id:'streak_30', emoji:'💎', name:'Streak 30 dias', desc:'Um mês inteiro sem falhar' },
  { id:'workouts_10', emoji:'💪', name:'10 treinos', desc:'10 treinos concluídos' },
  { id:'workouts_25', emoji:'🏋️', name:'25 treinos', desc:'25 treinos concluídos' },
  { id:'workouts_50', emoji:'🏆', name:'50 treinos', desc:'50 treinos concluídos' },
  { id:'workouts_100', emoji:'👑', name:'Centurião', desc:'100 treinos concluídos' },
  { id:'week_goal', emoji:'🎯', name:'Meta da semana', desc:'Bateu a meta semanal' },
  { id:'weight_down_1', emoji:'📉', name:'Perdeu 1kg', desc:'Emagrecimento -1kg' },
  { id:'weight_down_3', emoji:'🎉', name:'Perdeu 3kg', desc:'Emagrecimento -3kg' },
  { id:'weight_down_5', emoji:'🚀', name:'Perdeu 5kg', desc:'Emagrecimento -5kg' },
  { id:'weight_up_2', emoji:'📈', name:'Ganhou 2kg', desc:'Ganho de massa +2kg' },
  { id:'weight_up_5', emoji:'💥', name:'Ganhou 5kg', desc:'Ganho de massa +5kg' },
  { id:'first_pr', emoji:'🏅', name:'Primeiro PR', desc:'Bateu recorde pessoal' }
];

// ---------- STORAGE ----------
function saveData(){
  if(!state.user) return;
  try{ localStorage.setItem(DATA_PREFIX+state.user.email, JSON.stringify(state)); }catch(e){}
}
function loadData(email){
  try{
    const s = JSON.parse(localStorage.getItem(DATA_PREFIX+email)||'null');
    if(s) state = {...state, ...s, ui:{...state.ui, ...(s.ui||{})}};
  }catch(e){}
}
function saveAuth(){ localStorage.setItem(AUTH_KEY, JSON.stringify(state.user)); }
function getUsers(){ return JSON.parse(localStorage.getItem(USERS_KEY)||'{}'); }
function setUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function getAllow(){ return JSON.parse(localStorage.getItem(ALLOW_KEY)||'{}'); }
function setAllow(a){ localStorage.setItem(ALLOW_KEY, JSON.stringify(a)); }
function getAdminPass(){ return (JSON.parse(localStorage.getItem(ADMIN_KEY)||'null')||{}).pass || 'celo1995'; }
function setAdminPass(p){ localStorage.setItem(ADMIN_KEY, JSON.stringify({pass:p})); }

// ---------- AUTH ----------
function showLogin(){ $('auth-login').classList.remove('hidden'); $('auth-signup').classList.add('hidden'); }
function showSignup(){ $('auth-login').classList.add('hidden'); $('auth-signup').classList.remove('hidden'); }
function doLogin(){
  const e = $('lg-email').value.trim().toLowerCase();
  const p = $('lg-pass').value;
  const err = $('lg-err');
  err.innerHTML='';
  if(!e || !p){ err.innerHTML='<div class="err">Preencha e-mail e senha.</div>'; return; }

  // Admin login
  if(e === ADMIN_EMAIL){
    if(p !== getAdminPass()){ err.innerHTML='<div class="err">Senha incorreta.</div>'; return; }
    state.user = { name:'Admin', email:ADMIN_EMAIL, isAdmin:true };
    saveAuth();
    goAdmin();
    return;
  }

  const users = getUsers();
  const u = users[e];
  if(!u || u.pass !== p){ err.innerHTML='<div class="err">E-mail ou senha inválidos.</div>'; return; }

  // Check allowlist
  const allow = getAllow();
  const a = allow[e];
  if(!a || !a.active){
    state.user = { name:u.name, email:e, blocked:true };
    saveAuth();
    showScreen('scr-noaccess');
    return;
  }
  if(a.expiresAt && a.expiresAt < Date.now()){
    state.user = { name:u.name, email:e, blocked:true };
    saveAuth();
    showScreen('scr-noaccess');
    return;
  }

  state.user = u;
  saveAuth();
  loadData(e);
  bootAfterAuth();
}
function doSignup(){
  const n = $('sg-name').value.trim();
  const e = $('sg-email').value.trim().toLowerCase();
  const p = $('sg-pass').value;
  const err = $('sg-err');
  err.innerHTML='';
  if(!n || !e || !p){ err.innerHTML='<div class="err">Preencha todos os campos.</div>'; return; }
  if(p.length<6){ err.innerHTML='<div class="err">Senha precisa de 6+ caracteres.</div>'; return; }
  if(e === ADMIN_EMAIL){ err.innerHTML='<div class="err">Este e-mail é reservado ao administrador. Faça login.</div>'; return; }
  const users = getUsers();
  if(users[e]){ err.innerHTML='<div class="err">E-mail já cadastrado. Faça login.</div>'; return; }
  const user = { name:n, email:e, pass:p, createdAt:Date.now() };
  users[e] = user; setUsers(users);
  state.user = user; saveAuth();

  // Check allowlist
  const allow = getAllow();
  if(!allow[e] || !allow[e].active || (allow[e].expiresAt && allow[e].expiresAt < Date.now())){
    state.user.blocked = true; saveAuth();
    showScreen('scr-noaccess');
    return;
  }
  loadData(e);
  bootAfterAuth();
}
function doLogout(){
  localStorage.removeItem(AUTH_KEY);
  state = { user:null, active:'lift', modules:{lift:null,run:null}, progress:{}, prs:{}, weights:[], trophies:[], ui:{tab:'home',selectedSession:null} };
  showScreen('scr-auth');
  showLogin();
  $('tabbar').classList.add('hidden');
  $('lg-email').value=''; $('lg-pass').value=''; $('lg-err').innerHTML='';
}

function bootAfterAuth(){
  cleanupOldHistory();
  if(state.user.isAdmin){ goAdmin(); return; }
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
  // save to users bank
  const users = getUsers(); users[state.user.email] = {...users[state.user.email], profile}; setUsers(users);
  saveAuth();
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
function accessDaysLeft(){
  const allow = getAllow();
  const a = allow[state.user.email];
  if(!a || !a.expiresAt) return 0;
  return Math.max(0, Math.ceil((a.expiresAt - Date.now())/86400000));
}

// ---------- CLEANUP HISTORY (90 days) ----------
function cleanupOldHistory(){
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
function pickModule(m){ state.active=m; saveData(); showScreen('scr-setup-'+m); bindOpts('scr-setup-'+m); }
function bindOpts(scrId){
  document.querySelectorAll('#'+scrId+' .opt').forEach(o=>{
    o.onclick = ()=>{ o.parentNode.querySelectorAll('.opt').forEach(x=>x.classList.remove('on')); o.classList.add('on'); };
  });
}
function readOpt(id){ const on = document.querySelector('#'+id+' .opt.on'); return on?on.dataset.val:null; }

function finishSetup(m){
  const setup = m==='lift' ? {
    goal:readOpt('lift-goal'), days:parseInt(readOpt('lift-days')),
    equip:readOpt('lift-equip'), level:readOpt('lift-level')
  } : {
    goal:readOpt('run-goal'), level:readOpt('run-level'),
    days:parseInt(readOpt('run-days')), terrain:readOpt('run-terrain')
  };
  state.modules[m] = { setup, plan:generatePlan(m,setup), week:1, createdAt:Date.now(), history:[] };
  state.active = m;
  saveData(); goTab('home'); toast('🎉 Plano criado!');
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
    const wkDays = { 3:[1,3,5], 4:[1,2,4,5], 5:[1,2,3,5,6] }[days] || [1,2,4,5];
    const dayNames = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
    const workouts = split.map((s,i)=>({
      ...s, dayIdx:wkDays[i], dayName:dayNames[wkDays[i]-1],
      duration:45+(setup.level==='avancado'?10:setup.level==='intermediario'?5:0),
      exercises:buildLiftExercises(s.parts,setup)
    }));
    return { type:'lift', goal:setup.goal, workouts, totalWeeks:12 };
  } else {
    const goal = setup.goal || '5km';
    const totalWeeks = {'5km':8,'10km':10,'21km':12,'42km':16}[goal];
    const wkDays = { 3:[2,4,6], 4:[1,3,5,0], 5:[1,2,4,5,0] }[setup.days] || [1,3,5,0];
    const dayNames = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    const types = ['Corrida Leve','Intervalado','Corrida Longa','Ritmo Constante'];
    const workouts = wkDays.map((d,i)=>{
      const kind = types[i%types.length];
      return {
        k:'S'+(i+1), name:kind+' (plano de segurança)',
        dayIdx:d===0?7:d, dayName:dayNames[d===0?0:d],
        duration:kind==='Corrida Longa'?55:kind==='Intervalado'?38:31,
        distance:kind==='Corrida Longa'?'~5km':kind==='Intervalado'?'~4km':'~2.3km',
        blocks:buildRunBlocks(kind,setup)
      };
    });
    return { type:'run', goal, terrain:setup.terrain, workouts, totalWeeks };
  }
}

function buildLiftExercises(parts, setup){
  const level = setup.level || 'iniciante';
  const setsMap = {iniciante:3, intermediario:4, avancado:4};
  const repsMap = {hipertrofia:'8-12', forca:'4-6', emagrecimento:'12-15', resistencia:'15-20'};
  const sets = setsMap[level];
  const reps = repsMap[setup.goal || 'hipertrofia'];
  const list = [];
  parts.forEach(p=>{
    const cat = EX_BANK.find(c=>c.name===p); if(!cat) return;
    const pick = cat.items.slice(0, p==='Core'||p==='Panturrilha'||p==='Trapézio'?2:3);
    pick.forEach(ex=>{ list.push({ id: slug(ex.name), name:ex.name, sub:ex.sub, sets, reps, rest:'60-90s' }); });
  });
  return list;
}
function slug(s){ return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

function buildRunBlocks(kind, setup){
  const warm = {name:'Aquecimento',exs:[{name:'Caminhada leve',desc:'Ritmo natural, aumente gradualmente',min:5},{name:'Mobilidade dinâmica',desc:'Rotações + elevação de joelhos',min:2}]};
  let main;
  if(kind==='Intervalado') main = {name:'Principal',exs:[{name:'6× 400m rápido',desc:'85% do máximo, recuperação 90s trotando',min:20},{name:'Trote leve',desc:'Recuperação ativa',min:5}]};
  else if(kind==='Corrida Longa') main = {name:'Principal',exs:[{name:'Corrida contínua',desc:'Ritmo confortável, converse sem fôlego',min:40}]};
  else if(kind==='Ritmo Constante') main = {name:'Principal',exs:[{name:'Corrida em ritmo alvo',desc:'Zona 3-4, um pouco desconfortável',min:25}]};
  else main = {name:'Principal',exs:[{name:'Corrida em ritmo leve',desc:'Zona 2, converse sem esforço',min:21}]};
  const cool = {name:'Desaquecimento',exs:[{name:'Caminhada leve',desc:'Normalize a FC gradualmente',min:5}]};
  return [warm, main, cool];
}

// ---------- EXERCISE BANK ----------
const EX_BANK = [
  {name:'Peito',emo:'💪',color:'',items:[{name:'Supino Reto com Barra',sub:'Peito'},{name:'Supino Inclinado com Halteres',sub:'Peito Superior'},{name:'Supino Declinado',sub:'Peito Inferior'},{name:'Crucifixo com Halteres',sub:'Peito'},{name:'Crucifixo Inclinado',sub:'Peito Superior'},{name:'Crossover no Cabo',sub:'Peito'},{name:'Flexão de Braço',sub:'Peito / Tríceps'},{name:'Pullover com Halter',sub:'Peito / Serrátil'}]},
  {name:'Costas',emo:'🔙',color:'',items:[{name:'Puxada Frontal no Pulley',sub:'Costas Lats'},{name:'Puxada Aberta com Pegada Pronada',sub:'Costas Lats'},{name:'Puxada com Triângulo',sub:'Costas / Romboides'},{name:'Remada Curvada com Barra',sub:'Costas Média'},{name:'Remada Curvada com Halteres',sub:'Costas'},{name:'Remada Unilateral com Haltere',sub:'Costas'},{name:'Remada Cavalinho (T-Bar)',sub:'Costas Média'},{name:'Remada Baixa no Cabo',sub:'Costas Média'},{name:'Pulldown no Cabo',sub:'Costas'},{name:'Barra Fixa',sub:'Costas / Bíceps'},{name:'Levantamento Terra',sub:'Costas / Posterior'}]},
  {name:'Ombro',emo:'⛰️',color:'',items:[{name:'Desenvolvimento com Barra',sub:'Ombro'},{name:'Desenvolvimento Arnold',sub:'Ombro'},{name:'Elevação Lateral com Halteres',sub:'Ombro Lateral'},{name:'Elevação Frontal',sub:'Ombro Frontal'},{name:'Elevação Posterior Curvado',sub:'Ombro Posterior'},{name:'Desenvolvimento Militar',sub:'Ombro'},{name:'Face Pull no Cabo',sub:'Ombro Posterior'}]},
  {name:'Bíceps',emo:'💪',color:'',items:[{name:'Rosca Direta com Barra',sub:'Bíceps'},{name:'Rosca Alternada com Halteres',sub:'Bíceps'},{name:'Rosca Martelo com Halteres',sub:'Braquial / Bíceps'},{name:'Rosca Concentrada',sub:'Bíceps'},{name:'Rosca Scott',sub:'Bíceps'},{name:'Rosca Inversa',sub:'Antebraço'}]},
  {name:'Tríceps',emo:'🔱',color:'orange',items:[{name:'Tríceps Pulley no Cabo',sub:'Tríceps'},{name:'Tríceps Francês com Halteres',sub:'Tríceps'},{name:'Tríceps Corda no Cabo',sub:'Tríceps'},{name:'Mergulho nas Paralelas',sub:'Tríceps / Peito'},{name:'Tríceps Coice com Haltere',sub:'Tríceps'},{name:'Tríceps Testa',sub:'Tríceps'}]},
  {name:'Pernas',emo:'🦵',color:'orange',items:[{name:'Agachamento Livre com Barra',sub:'Quadríceps / Glúteos'},{name:'Agachamento Frontal',sub:'Quadríceps'},{name:'Leg Press 45°',sub:'Quadríceps'},{name:'Hack Machine',sub:'Quadríceps'},{name:'Afundo com Halteres',sub:'Quadríceps / Glúteos'},{name:'Agachamento Búlgaro',sub:'Quadríceps / Glúteos'},{name:'Cadeira Extensora',sub:'Quadríceps'},{name:'Stiff com Halteres',sub:'Posterior / Glúteos'},{name:'Stiff com Barra',sub:'Posterior / Glúteos'},{name:'Mesa Flexora',sub:'Posterior de Coxa'},{name:'Cadeira Flexora',sub:'Posterior de Coxa'}]},
  {name:'Glúteos',emo:'🍑',color:'pink',items:[{name:'Elevação Pélvica (Hip Thrust)',sub:'Glúteos'},{name:'Glúteo no Cabo',sub:'Glúteos'},{name:'Glúteo 4 Apoios com Caneleira',sub:'Glúteos'},{name:'Coice na Polia Baixa',sub:'Glúteos'},{name:'Cadeira Abdutora',sub:'Abdutores / Glúteo Médio'},{name:'Adução na Máquina',sub:'Adutores'},{name:'Agachamento Sumô com Haltere',sub:'Glúteos / Quadríceps'}]},
  {name:'Panturrilha',emo:'🦶',color:'teal',items:[{name:'Panturrilha em Pé',sub:'Panturrilha'},{name:'Panturrilha Sentado',sub:'Panturrilha Sóleo'},{name:'Panturrilha no Leg Press',sub:'Panturrilha'}]},
  {name:'Trapézio',emo:'🦅',color:'',items:[{name:'Encolhimento com Halteres',sub:'Trapézio'},{name:'Encolhimento com Barra',sub:'Trapézio'}]},
  {name:'Core',emo:'🎯',color:'',items:[{name:'Prancha (Plank)',sub:'Core'},{name:'Abdominal Crunch',sub:'Core'},{name:'Mountain Climber',sub:'Core / Cardio'},{name:'Abdominal Bicicleta',sub:'Core / Oblíquos'}]}
];

// ---------- HELPERS ----------
function $(id){ return document.getElementById(id); }
function showScreen(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); $(id).classList.add('active'); window.scrollTo({top:0,behavior:'instant'}); }
function toast(msg){ const t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2500); }
function getDayIdx(){ const d=new Date().getDay(); return d===0?7:d; }
function greetTime(){ const h=new Date().getHours(); if(h<12) return 'Bom dia'; if(h<18) return 'Boa tarde'; return 'Boa noite'; }
function firstName(){ const p = state.user.profile; return (p&&p.nickname) || (state.user.name||'').split(' ')[0]; }
function ytLink(ex){ return 'https://www.youtube.com/results?search_query=' + encodeURIComponent('como fazer '+ex+' técnica correta'); }

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
  $('daily-quote').textContent = QUOTES[new Date().getDate() % QUOTES.length];

  const days = accessDaysLeft();
  $('access-days').textContent = days>0 ? `${days} dias restantes` : 'Acesso expirado';

  // trophies count
  $('trophy-count').textContent = `${state.trophies.length} de ${TROPHIES.length} troféus`;

  const wk = mod.week||1, total = mod.plan.totalWeeks;
  $('plan-week').textContent = `Semana ${wk} de ${total}`;
  $('plan-progress').style.width = Math.min(100,(wk/total)*100)+'%';
  const phase = wk<=Math.floor(total*0.6)?'BUILD':wk<=Math.floor(total*0.85)?'PEAK':'TAPER';
  $('plan-phase').textContent = phase;
  $('plan-foot').textContent = phase==='BUILD'?`🏗️ Fase de construção · ${isLift?'Ganhando base muscular':'Aumentando base aeróbica'}. ${total-wk} semanas até o pico.`:phase==='PEAK'?`🚀 Fase de pico · Alta intensidade. ${total-wk} semanas restantes.`:`🎯 Fase de taper · Recuperação e afinação final.`;

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
  return `<div class="today">
    <div class="today-label">TREINO DE HOJE</div>
    <div class="today-diff ${isLift?'diff-med':'diff-easy'}">${isLift?'Foco':'Fácil'}</div>
    <div class="today-title">${isLift?`Treino ${w.k} — ${w.name}`:w.name}</div>
    <div class="today-desc">${desc}</div>
    <div class="today-meta">
      <span class="chip mono">⏱️ ${w.duration} min</span>
      ${w.distance?`<span class="chip mono">📍 ${w.distance}</span>`:''}
      ${isLift?`<span class="chip">💪 ${w.exercises.length} exercícios</span>`:''}
    </div>
    <div class="today-actions">
      <button class="btn btn-primary" onclick="openSession('${w.k||w.dayIdx}')">▶ Ver sessão</button>
      <button class="btn btn-ghost" onclick="${isLift?`openSession('${w.k}')`:`markRunDone('${w.dayIdx}')`}">${isLift?'📝 Registrar treino':'✓ Marcar feito'}</button>
    </div>
  </div>`;
}
function liftDesc(w){ const parts=w.parts.join(' + '); return `🎯 Foco em ${parts.toLowerCase()}\n\nAqueça bem por 5-8 min. Registre suas séries pra acompanhar sua evolução.\n\n💧 Hidrate-se durante e mantenha os intervalos de 60-90s.`; }
function runDesc(w){ return `🔥 Aquecimento: 5 min de caminhada leve\n\nRitmo de conversa (você consegue falar frases completas sem ficar sem ar).\n\n🏁 Desaquecimento: 5 min de caminhada leve para normalizar a FC`; }

function renderRestDay(mod){
  const isLift = mod.plan.type==='lift';
  const ws = mod.plan.workouts.slice(0,3);
  return `<div class="rest-card"><div class="rest-emoji">😴</div><div class="rest-title">Dia de Descanso</div><div class="rest-sub">Aproveite pra recuperar. Você volta amanhã mais forte!</div><div class="rest-divider">— ou —</div><div style="font-weight:700">Quer antecipar algum treino?</div><div class="anticipate">${ws.map(w=>`<div class="antic-card" onclick="openSession('${w.k||w.dayIdx}')"><div class="antic-letter">${(w.k||'').charAt(0)||'S'}</div><div class="antic-name">${isLift?'Treino '+w.k:w.name.split(' ')[0]}</div><div class="antic-day">${w.dayName}</div></div>`).join('')}</div></div>`;
}

function renderWeekGrid(mod){
  const days = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const today = getDayIdx();
  const emo = mod.plan.type==='lift'?'💪':'🏃';
  const scheduled = new Set(mod.plan.workouts.map(w=>w.dayIdx));
  const startWk = new Date(); startWk.setHours(0,0,0,0); startWk.setDate(startWk.getDate()-(today-1));
  const doneDays = new Set((mod.history||[]).filter(h=>h.at>=startWk.getTime()).map(h=>{ const d=new Date(h.at); return d.getDay()===0?7:d.getDay(); }));
  $('week-grid').innerHTML = days.map((n,i)=>{
    const idx=i+1, has=scheduled.has(idx), done=doneDays.has(idx), isT=idx===today;
    return `<div class="day ${isT?'today':''} ${!has?'rest':''}"><div class="day-name">${n.slice(0,3)}</div><div class="day-dot ${done?'done':has?'plan':''}"></div><div class="day-emoji">${has?emo:'·'}</div></div>`;
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
  $('weekly-info').textContent = `Meta: ${labelGoal(mod)} · Semana ${mod.week}/${mod.plan.totalWeeks} · ${mod.plan.workouts.length}× por semana`;

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
    ${isLift ? `<button class="btn ${done?'btn-primary':'btn-ghost'} btn-block" style="margin-top:14px" onclick="finishLiftWorkout('${w.k}')" ${done?'':'disabled style="opacity:.5"'}>✅ Salvar treino${done?'':' (registre ao menos 1 série)'}</button>` : `<button class="btn btn-primary btn-block" style="margin-top:14px" onclick="markRunDone('${w.dayIdx}')">✓ Marcar sessão como feita</button>`}
  `;
  $('session-detail-slot').innerHTML = html;
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
function renderExerciseCard(ex, idx){
  const last = getLastLog(ex.id);
  const pr = state.prs[ex.id];
  const today = new Date(); today.setHours(0,0,0,0);
  const todayLogs = (state.progress[ex.id]||[]).filter(p=>{ const d=new Date(p.date); d.setHours(0,0,0,0); return d.getTime()===today.getTime(); });
  const setsToday = todayLogs.length? todayLogs[todayLogs.length-1].sets.length : 0;
  return `
    <div class="ex">
      <div class="ex-num">${idx+1}</div>
      <div style="flex:1">
        <div class="ex-name">${ex.name} ${pr?`<span class="pr-badge">🏆 PR ${pr.peso}kg×${pr.reps}</span>`:''}</div>
        <div class="ex-desc">${ex.sub} · Alvo: <b>${ex.sets}×${ex.reps}</b> · Descanso ${ex.rest}</div>
        ${last?`<div class="ex-desc" style="color:var(--primary-2);margin-top:4px">📊 Última: ${last.sets.map(s=>`${s.peso}kg×${s.reps}`).join(', ')}</div>`:''}
        ${setsToday>0?`<div class="ex-desc" style="color:var(--accent-2);margin-top:4px">✍️ Hoje: ${setsToday} série${setsToday>1?'s':''} registrada${setsToday>1?'s':''}</div>`:''}
        <div class="row" style="margin-top:8px;gap:6px;flex-wrap:wrap">
          <button class="btn btn-primary" style="padding:8px 14px;font-size:13px" onclick="openSetLog('${ex.id}','${ex.name.replace(/'/g,"\\'")}')">📝 Registrar</button>
          <button class="btn btn-ghost" style="padding:8px 14px;font-size:13px" onclick="window.open('${ytLink(ex.name)}','_blank')">▶ Ver como fazer</button>
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
function renderSetLogModal(){
  const { exId, exName, entry } = curLog;
  const last = getLastLog(exId);
  const suggested = last ? `<div class="card card-info" style="padding:12px;margin-bottom:12px"><div class="card-sub">💡 Última vez: ${last.sets.map(s=>`${s.peso}kg×${s.reps}`).join(', ')}. Tenta ${last.sets[0].peso+2.5}kg × ${last.sets[0].reps} reps hoje?</div></div>` : '';
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
    <div class="row" style="gap:8px;margin-top:14px">
      <button class="btn btn-ghost btn-block" onclick="closeSetLog(false)">Cancelar</button>
      <button class="btn btn-primary btn-block" onclick="closeSetLog(true)">Salvar</button>
    </div>
  `;
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
  if(save){
    curLog.entry.sets = curLog.entry.sets.filter(s=>s.peso>0 && s.reps>0);
    // check PR
    curLog.entry.sets.forEach(s=>{
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
    toast('✅ Série(s) salvas');
    // refresh session view
    if(state.ui.tab==='sessions') renderSessions();
  }
  curLog = null;
  closeModal();
}

// ---------- FINISH LIFT WORKOUT ----------
function finishLiftWorkout(k){
  const mod = state.modules.lift;
  const w = mod.plan.workouts.find(x=>x.k===k);
  if(!w) return;
  if(!checkLiftDone(w)){ toast('Registre ao menos uma série antes de salvar'); return; }
  mod.history = mod.history || [];
  mod.history.push({ id:w.k, name:'Treino '+w.k+' — '+w.name, at:Date.now(), duration:w.duration, module:'lift' });
  checkTrophies();
  saveData();
  toast('✅ Treino salvo com sucesso!');
  goTab('home');
}
function markRunDone(dayIdx){
  const mod = state.modules.run;
  const w = mod.plan.workouts.find(x=>String(x.dayIdx)===String(dayIdx));
  if(!w) return;
  mod.history = mod.history || [];
  mod.history.push({ id:w.k, name:w.name, at:Date.now(), duration:w.duration, module:'run' });
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
  $('hist-title').textContent = `${isLift?'🏋️':'🏃'} Histórico${isLift?'':' de Corrida'}`;
  $('hist-tag').textContent = `Histórico · ${isLift?'Musculação':'Corrida'}`;
  $('h-icon').textContent = isLift?'🏋️':'🏃';
  $('h-lbl1').textContent = isLift?'Treinos':'Corridas';
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
    $('history-list').innerHTML = h.slice().reverse().map(x=>{
      const d = new Date(x.at);
      return `<div class="list-item"><div class="list-dot"></div><div class="list-info"><div class="list-tag">${d.toLocaleDateString('pt-BR')} · ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div><div class="list-name">${x.name}</div></div><div class="list-right mono">${x.duration}min</div></div>`;
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
  const start = new Date(); start.setDate(start.getDate()-7); start.setHours(0,0,0,0);
  const weekDone = h.filter(x=>x.at>=start.getTime()).length;
  $('s1-lbl').textContent = isLift?'Treinos':'Corridas';
  $('s1-val').innerHTML = `${weekDone}<small>/${wkTarget}</small>`;
  $('s1-note').textContent = Math.round(weekDone/wkTarget*100)+'%';
  const totalVol = calcTotalVolume(state.progress);
  $('s2-lbl').textContent = isLift?'Volume 7d':'Km';
  $('s2-val').innerHTML = isLift?`${Math.round(totalVol)}<small>kg</small>`:`0<small>km</small>`;
  $('s2-note').textContent = '↑ +0%';
  $('s3-val').textContent = h.length*220;
  $('m-streak').textContent = calcStreak(h);
  $('m-wk').innerHTML = `${weekDone}<small>/${wkTarget}</small>`;
  const totalMin = h.reduce((s,x)=>s+(x.duration||0),0);
  $('m-total').textContent = totalMin<60?totalMin+'min':(totalMin/60).toFixed(1)+'h';
  $('m-best').textContent = calcStreak(h);
  const line = $('perf-line');
  if(line){
    if(!h.length) line.setAttribute('points','40,170 140,170 240,170 340,170');
    else {
      const now=Date.now(), pts=[];
      for(let i=3;i>=0;i--){
        const s=now-(i+1)*7*86400000, e=now-i*7*86400000;
        const done = h.filter(x=>x.at>=s && x.at<e).length;
        const pct = Math.min(100,(done/wkTarget)*100);
        pts.push(`${40+(3-i)*100},${170-pct*1.5}`);
      }
      line.setAttribute('points', pts.join(' '));
    }
  }
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
  $('pl-access').textContent = days>0?'Acesso ativo':'Acesso expirado';
  $('pl-days').textContent = days>0?`${days} dias restantes`:'Fale com seu treinador';
}
function regenPlan(){ showScreen('scr-setup-'+state.active); bindOpts('scr-setup-'+state.active); }

// ---------- PROFILE ----------
function renderProfile(){
  const u = state.user, p = u.profile || {};
  renderAvatar('pf-avatar');
  $('pf-name').textContent = p.nickname || u.name;
  $('pf-email').textContent = u.email;
  const days = accessDaysLeft();
  $('pf-trial').textContent = days>0?`${days} dias de acesso restantes`:'Acesso expirado';
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
      const users = getUsers(); users[state.user.email] = {...users[state.user.email], profile:state.user.profile}; setUsers(users);
      saveAuth(); saveData();
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
  saveAuth(); saveData();
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
    toast(`🎉 Parabéns! Você perdeu ${lost.toFixed(1)}kg desde o início!`);
  } else if(p.goal==='massa' && delta > 0){
    if(delta>=2) unlockTrophy('weight_up_2');
    if(delta>=5) unlockTrophy('weight_up_5');
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
function checkTrophies(){
  const totalDone = (state.modules.lift?.history?.length||0) + (state.modules.run?.history?.length||0);
  if(totalDone>=1) unlockTrophy('first_workout');
  if(totalDone>=10) unlockTrophy('workouts_10');
  if(totalDone>=25) unlockTrophy('workouts_25');
  if(totalDone>=50) unlockTrophy('workouts_50');
  if(totalDone>=100) unlockTrophy('workouts_100');
  const s = Math.max(calcStreak(state.modules.lift?.history||[]), calcStreak(state.modules.run?.history||[]));
  if(s>=3) unlockTrophy('streak_3');
  if(s>=7) unlockTrophy('streak_7');
  if(s>=14) unlockTrophy('streak_14');
  if(s>=30) unlockTrophy('streak_30');
  const mod = state.modules[state.active];
  const wkTarget = mod.plan.workouts.length;
  const startWk = new Date(); startWk.setHours(0,0,0,0); startWk.setDate(startWk.getDate()-6);
  const done7d = (mod.history||[]).filter(h=>h.at>=startWk.getTime()).length;
  if(done7d >= wkTarget) unlockTrophy('week_goal');
}
function openTrophies(){
  const html = `
    <h3>🏆 Suas conquistas</h3>
    <p style="color:var(--text-dim);font-size:13px;margin-top:2px">${state.trophies.length} de ${TROPHIES.length} desbloqueados</p>
    <div class="trophy-grid" style="margin-top:14px">
      ${TROPHIES.map(t=>{
        const u = state.trophies.includes(t.id);
        return `<div class="trophy ${u?'unlock':''}"><div class="trophy-emoji">${t.emoji}</div><div class="trophy-name">${t.name}</div><div class="trophy-desc">${t.desc}</div></div>`;
      }).join('')}
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="closeModal()">Fechar</button>`;
  $('modal-inner').innerHTML = html;
  $('modal-back').classList.add('on');
}

// ---------- LIBRARY ----------
let libFilter = 'Todos';
function renderLibrary(){
  const chips = ['Todos', ...EX_BANK.map(c=>c.name)];
  const emos = {'Todos':'📚','Peito':'💪','Costas':'🔙','Ombro':'⛰️','Bíceps':'💪','Tríceps':'🔱','Pernas':'🦵','Glúteos':'🍑','Panturrilha':'🦶','Trapézio':'🦅','Core':'🎯'};
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
  'faq':`<h3>❓ FAQ / Sobre</h3><p><b>MetaTreino</b> gera planos de treino inteligentes de musculação e corrida, personalizados.<br><br><b>Como funciona?</b> Escolha o módulo, responda o questionário e receba um plano progressivo.<br><br><b>Meus dados ficam salvos?</b> Sim, localmente no seu dispositivo. Histórico de treinos guardado por 90 dias.<br><br><b>Contato:</b> celoborgesms@gmail.com</p><button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal()">Fechar</button>`,
  'privacy':`<h3>🔒 Privacidade</h3><p>Seus dados são armazenados apenas no seu dispositivo. Não coletamos, não compartilhamos e não vendemos informações. Se precisar, contate <a href="mailto:celoborgesms@gmail.com">celoborgesms@gmail.com</a>.</p><button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal()">Fechar</button>`,
  'terms':`<h3>📄 Termos de uso</h3><p>App fornecido "no estado em que se encontra", sem garantias. Consulte profissional de saúde antes de iniciar qualquer programa. Uso restrito a alunos autorizados.</p><button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal()">Fechar</button>`,
  'edit-profile':()=>{ const p = state.user.profile||{}; return `<h3>✏️ Editar perfil</h3><div class="field"><label>Como quer ser chamado</label><input class="input" id="ep-nick" value="${p.nickname||''}"></div><div class="field"><label>Idade</label><input class="input mono" type="number" id="ep-age" value="${p.age||''}"></div><div class="field"><label>Altura (cm)</label><input class="input mono" type="number" id="ep-height" value="${p.height||''}"></div><div class="field"><label>WhatsApp</label><input class="input mono" id="ep-whats" value="${p.whatsapp||''}"></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="saveProfileEdit()">Salvar</button>`; },
  'change-pass':`<h3>🔑 Alterar senha</h3><div class="field"><label>Senha atual</label><input class="input" type="password" id="cp-cur"></div><div class="field"><label>Nova senha (mín 6)</label><input class="input" type="password" id="cp-new"></div><div id="cp-err"></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="doChangePass()">Salvar</button>`,
  'change-admin-pass':`<h3>🔑 Alterar senha do admin</h3><div class="field"><label>Senha atual</label><input class="input" type="password" id="ap-cur"></div><div class="field"><label>Nova senha (mín 6)</label><input class="input" type="password" id="ap-new"></div><div id="ap-err"></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="doChangeAdminPass()">Salvar</button>`,
  'add-weight':()=>{ const cur=latestWeight()||state.user.profile?.currentWeight||70; return `<h3>⚖️ Registrar peso hoje</h3><p style="color:var(--text-dim);font-size:13px">Última medição: <b>${cur}kg</b></p><div class="field"><label>Peso agora (kg)</label><input class="input mono" type="number" step="0.1" id="wt-val" value="${cur}"></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="saveWeight()">Salvar</button>`; },
  'add-student':`<h3>➕ Liberar acesso a aluno</h3><div class="field"><label>E-mail do aluno</label><input class="input" type="email" id="as-email" placeholder="aluno@email.com"></div><div class="field"><label>Nome (opcional)</label><input class="input" id="as-name" placeholder="Nome do aluno"></div><div class="field"><label>WhatsApp (opcional)</label><input class="input mono" id="as-whats" placeholder="61999999999"></div><div class="field"><label>Duração do acesso</label><div class="radio-grid g3" id="as-dur"><div class="opt" data-val="30">30 dias</div><div class="opt on" data-val="60">60 dias</div><div class="opt" data-val="90">90 dias</div><div class="opt" data-val="180">6 meses</div><div class="opt" data-val="365">1 ano</div><div class="opt" data-val="9999">Vitalício</div></div></div><div class="field"><label>Notas (opcional)</label><input class="input" id="as-notes" placeholder="Ex: Alunos plano premium"></div><div id="as-err"></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="doAddStudent()">Liberar acesso</button>`,
  'broadcast':`<h3>📢 Mensagem em massa (WhatsApp)</h3><p style="color:var(--text-dim);font-size:13px">Gera um link do WhatsApp Web para cada aluno com o texto abaixo. Os alunos precisam ter WhatsApp cadastrado.</p><div class="field"><label>Mensagem</label><textarea class="input" id="bc-msg" rows="4" style="resize:vertical">Olá, treinador aqui do MetaTreino! Passando pra lembrar...</textarea></div><button class="btn btn-primary btn-block" onclick="doBroadcast()">Abrir links WhatsApp</button>`,
};
function openModal(k){
  const c = MODAL_CONTENT[k];
  $('modal-inner').innerHTML = typeof c==='function' ? c() : c;
  $('modal-back').classList.add('on');
  if(k==='add-student') bindOpts('modal-inner');
}
function closeModal(){ $('modal-back').classList.remove('on'); }
function saveProfileEdit(){
  const p = state.user.profile;
  p.nickname = $('ep-nick').value.trim() || p.nickname;
  p.age = parseInt($('ep-age').value) || p.age;
  p.height = parseFloat($('ep-height').value) || p.height;
  p.whatsapp = $('ep-whats').value.trim();
  const users = getUsers(); users[state.user.email] = {...users[state.user.email], profile:p}; setUsers(users);
  saveAuth(); saveData(); toast('✅ Perfil atualizado'); closeModal(); goTab('profile');
}
function doChangePass(){
  const cur=$('cp-cur').value, nw=$('cp-new').value, err=$('cp-err'); err.innerHTML='';
  if(cur !== state.user.pass){ err.innerHTML='<div class="err">Senha atual incorreta.</div>'; return; }
  if(nw.length<6){ err.innerHTML='<div class="err">Nova senha muito curta.</div>'; return; }
  state.user.pass = nw;
  const users = getUsers(); users[state.user.email].pass = nw; setUsers(users);
  saveAuth(); toast('✅ Senha alterada'); closeModal();
}
function doChangeAdminPass(){
  const cur=$('ap-cur').value, nw=$('ap-new').value, err=$('ap-err'); err.innerHTML='';
  if(cur !== getAdminPass()){ err.innerHTML='<div class="err">Senha atual incorreta.</div>'; return; }
  if(nw.length<6){ err.innerHTML='<div class="err">Nova senha muito curta.</div>'; return; }
  setAdminPass(nw);
  toast('✅ Senha do admin alterada'); closeModal();
}

// ---------- ADMIN ----------
let admFilter = 'all';
function goAdmin(){
  $('tabbar').classList.add('hidden');
  showScreen('scr-admin');
  $('adm-hi').textContent = 'Olá, Marcelo!';
  renderAdminStats();
  renderAdminList();
}
function renderAdminStats(){
  const allow = getAllow();
  const users = getUsers();
  const now = Date.now();
  const list = Object.entries(allow);
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
  const allow = getAllow();
  const users = getUsers();
  const now = Date.now();
  const q = ($('adm-search').value||'').toLowerCase();
  let items = Object.entries(allow).map(([email,a])=>({email,...a, user:users[email]}));
  items = items.filter(x=>{
    if(!x.email.includes(q) && !(x.user?.name||'').toLowerCase().includes(q)) return false;
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
      <div class="stud-top"><div><div class="stud-name">${x.user?.name || x.name || x.email.split('@')[0]}</div><div class="stud-email">${x.email}</div></div><div class="stud-days ${cls}">${daysLbl}</div></div>
      <div class="stud-meta">${x.phone?`<span>📱 <b>${x.phone}</b></span>`:''}${x.notes?`<span>📝 ${x.notes}</span>`:''}${x.discount?`<span>🏷️ <b>${x.discount}% off</b></span>`:''}</div>
    </div>`;
  }).join('');
}
function doAddStudent(){
  const email = $('as-email').value.trim().toLowerCase();
  const name = $('as-name').value.trim();
  const phone = $('as-whats').value.trim();
  const notes = $('as-notes').value.trim();
  const dur = parseInt(readOpt('as-dur'));
  const err = $('as-err'); err.innerHTML='';
  if(!email || !email.includes('@')){ err.innerHTML='<div class="err">E-mail inválido</div>'; return; }
  if(!dur){ err.innerHTML='<div class="err">Selecione a duração</div>'; return; }
  const allow = getAllow();
  allow[email] = { addedAt:Date.now(), expiresAt: dur>=9999?null:Date.now()+dur*86400000, active:true, phone, notes, name, discount:0 };
  setAllow(allow);
  toast('✅ Acesso liberado');
  closeModal();
  goAdmin();
}

function openStudent(email){
  const allow = getAllow();
  const users = getUsers();
  const a = allow[email]; if(!a) return;
  const u = users[email];
  const now = Date.now();
  const days = a.expiresAt ? Math.ceil((a.expiresAt-now)/86400000) : 9999;
  const daysLbl = days>=9999?'Vitalício':days<=0?'Expirado':`${days} dias`;
  const p = u?.profile;
  const data = u ? JSON.parse(localStorage.getItem(DATA_PREFIX+email)||'null') : null;
  const totalWk = (data?.modules?.lift?.history?.length||0) + (data?.modules?.run?.history?.length||0);
  showScreen('scr-admin-student');
  $('stud-tag').textContent = 'Aluno · '+email;
  $('stud-content').innerHTML = `
    <div class="profile-head">
      <div class="profile-avatar" style="overflow:hidden">${p?.photo?`<img src="${p.photo}">`:(p?.nickname||u?.name||'?').charAt(0).toUpperCase()}</div>
      <div><div class="profile-name">${p?.nickname||u?.name||'—'}</div><div class="profile-email">${email}</div><div class="profile-tag">${a.active?'🎫 Ativo':'🔒 Bloqueado'} · ${daysLbl}</div></div>
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

    <div class="section-lbl">Desconto</div>
    <div class="card"><div class="row"><input class="input mono" id="stud-disc" type="number" value="${a.discount||0}" min="0" max="100" style="flex:1"><button class="btn btn-primary" onclick="setStudentDiscount('${email}')">Salvar %</button></div></div>

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
function adjustDays(email, days){
  const allow = getAllow(); const a = allow[email]; if(!a) return;
  const base = a.expiresAt || Date.now();
  a.expiresAt = base + days*86400000;
  if(a.expiresAt < Date.now()) a.active = false;
  setAllow(allow);
  toast(days>0?`+${days} dias`:`${days} dias`);
  openStudent(email);
}
function setStudentDiscount(email){
  const allow = getAllow(); const a = allow[email]; if(!a) return;
  a.discount = parseInt($('stud-disc').value)||0;
  setAllow(allow);
  toast('✅ Desconto salvo');
}
function toggleStudent(email){
  const allow = getAllow(); const a = allow[email]; if(!a) return;
  a.active = !a.active; setAllow(allow);
  toast(a.active?'🔓 Aluno reativado':'🔒 Aluno bloqueado');
  openStudent(email);
}
function removeStudent(email){
  if(!confirm('Remover este aluno da lista? A conta dele será mantida mas ele perderá o acesso.')) return;
  const allow = getAllow(); delete allow[email]; setAllow(allow);
  toast('🗑️ Aluno removido'); goAdmin();
}
function doBroadcast(){
  const msg = $('bc-msg').value;
  const allow = getAllow();
  const phones = Object.entries(allow).filter(([,a])=>a.active && a.phone).map(([,a])=>a.phone);
  if(!phones.length){ toast('Nenhum aluno com WhatsApp cadastrado'); return; }
  closeModal();
  const links = phones.map(p=>`https://wa.me/${p.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`);
  const w = window.open('','_blank');
  w.document.write(`<html><head><title>Envio em massa</title><style>body{font-family:sans-serif;padding:20px;background:#050914;color:#e2e8f0}a{display:block;padding:12px 16px;background:#10b981;color:#022c22;text-decoration:none;border-radius:12px;margin:6px 0;font-weight:700}</style></head><body><h2>📢 Clique em cada link para abrir o WhatsApp:</h2>${links.map((l,i)=>`<a href="${l}" target="_blank">Aluno ${i+1} · abrir WhatsApp</a>`).join('')}</body></html>`);
}
function exportData(){
  const data = { auth:JSON.parse(localStorage.getItem(AUTH_KEY)||'null'), users:getUsers(), allow:getAllow(), admin:JSON.parse(localStorage.getItem(ADMIN_KEY)||'null') };
  const keys = Object.keys(localStorage).filter(k=>k.startsWith(DATA_PREFIX));
  data.data = {}; keys.forEach(k=>data.data[k]=JSON.parse(localStorage.getItem(k)));
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `metatreino-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  toast('📤 Backup exportado');
}

// ---------- INIT ----------
window.addEventListener('DOMContentLoaded', ()=>{
  // ensure admin exists in allow list so if he ever signs up he isn't blocked
  const authStored = JSON.parse(localStorage.getItem(AUTH_KEY)||'null');
  if(authStored){
    state.user = authStored;
    if(state.user.isAdmin) { goAdmin(); return; }
    if(state.user.blocked){ showScreen('scr-noaccess'); return; }
    loadData(state.user.email);
    bootAfterAuth();
  } else {
    showScreen('scr-auth');
    showLogin();
  }
  ['lg-pass','sg-pass'].forEach(id=>{
    const el=$(id); if(el) el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ id==='lg-pass'?doLogin():doSignup(); } });
  });
});

Object.assign(window,{doLogin,doSignup,doLogout,showLogin,showSignup,pickModule,finishSetup,switchModule,switchModuleUI,goTab,openSession,selectSession,toggleWeeklyBlock,openModal,closeModal,saveProfileEdit,regenPlan,setLibFilter,filterLib,openExercise,saveQuiz,openSetLog,updateSet,delSet,addSet,closeSetLog,finishLiftWorkout,markRunDone,openTrophies,pickPhoto,onPhotoPicked,saveWeight,doChangePass,doChangeAdminPass,goAdmin,setAdminFilter,renderAdminList,doAddStudent,openStudent,adjustDays,setStudentDiscount,toggleStudent,removeStudent,doBroadcast,exportData});

// ===== MetaTreino v1.0 - localStorage-only PWA =====
const KEY = 'metatreino_v1';
const AUTH_KEY = 'metatreino_auth_v1';

// ---------- STATE ----------
let state = {
  user: null, // {name, email, pass, createdAt, trialStart}
  active: 'lift', // active module
  modules: { lift: null, run: null }, // {setup:{...}, plan:{...}, week:1, workouts:[], history:[]}
  ui: { tab: 'home', modal: null, selectedSession: null }
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

// ---------- STORAGE ----------
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }
function load(){
  try{
    const s = JSON.parse(localStorage.getItem(KEY)||'null');
    if(s) state = {...state, ...s, ui:{...state.ui, ...(s.ui||{})}};
    const a = JSON.parse(localStorage.getItem(AUTH_KEY)||'null');
    if(a) state.user = a;
  }catch(e){}
}
function saveAuth(){ localStorage.setItem(AUTH_KEY, JSON.stringify(state.user)); }

// ---------- AUTH ----------
function showLogin(){ $('auth-login').classList.remove('hidden'); $('auth-signup').classList.add('hidden'); }
function showSignup(){ $('auth-login').classList.add('hidden'); $('auth-signup').classList.remove('hidden'); }
function doLogin(){
  const e = $('lg-email').value.trim().toLowerCase();
  const p = $('lg-pass').value;
  const err = $('lg-err');
  err.innerHTML='';
  if(!e || !p){ err.innerHTML='<div class="err">Preencha e-mail e senha.</div>'; return; }
  const stored = JSON.parse(localStorage.getItem('metatreino_users_v1')||'{}');
  const u = stored[e];
  if(!u || u.pass !== p){ err.innerHTML='<div class="err">E-mail ou senha inválidos.</div>'; return; }
  state.user = {...u};
  saveAuth();
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
  const stored = JSON.parse(localStorage.getItem('metatreino_users_v1')||'{}');
  if(stored[e]){ err.innerHTML='<div class="err">E-mail já cadastrado. Faça login.</div>'; return; }
  const user = { name:n, email:e, pass:p, createdAt:Date.now(), trialStart:Date.now() };
  stored[e] = user;
  localStorage.setItem('metatreino_users_v1', JSON.stringify(stored));
  state.user = user;
  saveAuth();
  bootAfterAuth();
}
function doLogout(){
  localStorage.removeItem(AUTH_KEY);
  state.user = null;
  state.modules = { lift:null, run:null };
  save();
  showScreen('scr-auth');
  $('tabbar').classList.add('hidden');
}

function bootAfterAuth(){
  // Check if modules are configured
  if(!state.modules.lift && !state.modules.run){
    showScreen('scr-pick');
    return;
  }
  if(!state.modules[state.active]){
    state.active = state.modules.lift ? 'lift' : 'run';
  }
  save();
  goTab('home');
}

// ---------- MODULE PICK & SETUP ----------
function pickModule(m){
  state.active = m;
  save();
  showScreen('scr-setup-'+m);
  bindOpts('scr-setup-'+m);
}
function bindOpts(scrId){
  document.querySelectorAll('#'+scrId+' .opt').forEach(o=>{
    o.onclick = ()=>{
      o.parentNode.querySelectorAll('.opt').forEach(x=>x.classList.remove('on'));
      o.classList.add('on');
    };
  });
}
function readOpt(id){ const on = document.querySelector('#'+id+' .opt.on'); return on?on.dataset.val:null; }

function finishSetup(m){
  const setup = m==='lift' ? {
    goal: readOpt('lift-goal'),
    days: parseInt(readOpt('lift-days')),
    equip: readOpt('lift-equip'),
    level: readOpt('lift-level')
  } : {
    goal: readOpt('run-goal'),
    level: readOpt('run-level'),
    days: parseInt(readOpt('run-days')),
    terrain: readOpt('run-terrain')
  };
  state.modules[m] = {
    setup,
    plan: generatePlan(m, setup),
    week: 1,
    createdAt: Date.now(),
    history: []
  };
  state.active = m;
  save();
  goTab('home');
  toast('🎉 Plano criado!');
}

// ---------- PLAN GENERATION ----------
function generatePlan(module, setup){
  if(module==='lift'){
    // ABC/ABCD split based on days
    const letters = ['A','B','C','D','E'];
    const days = setup.days || 4;
    const splitMap = {
      3: [{k:'A',name:'Peito + Tríceps',parts:['Peito','Tríceps']},
          {k:'B',name:'Costas + Bíceps',parts:['Costas','Bíceps']},
          {k:'C',name:'Pernas + Ombro',parts:['Pernas','Ombro','Core']}],
      4: [{k:'A',name:'Peito + Tríceps',parts:['Peito','Tríceps','Core']},
          {k:'B',name:'Costas + Bíceps',parts:['Costas','Bíceps']},
          {k:'C',name:'Pernas + Glúteos',parts:['Pernas','Glúteos','Panturrilha']},
          {k:'D',name:'Ombro + Trapézio',parts:['Ombro','Trapézio','Core']}],
      5: [{k:'A',name:'Peito',parts:['Peito','Tríceps']},
          {k:'B',name:'Costas',parts:['Costas','Bíceps']},
          {k:'C',name:'Pernas',parts:['Pernas','Panturrilha']},
          {k:'D',name:'Ombro + Braços',parts:['Ombro','Bíceps','Tríceps']},
          {k:'E',name:'Glúteos + Core',parts:['Glúteos','Core']}]
    };
    const split = splitMap[days] || splitMap[4];
    // assign week days
    const wkDays = { 3:[1,3,5], 4:[1,2,4,5], 5:[1,2,3,5,6] }[days] || [1,2,4,5];
    const dayNames = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
    const workouts = split.map((s,i)=>({
      ...s,
      dayIdx: wkDays[i],
      dayName: dayNames[wkDays[i]-1],
      duration: 45 + (setup.level==='avancado'?10: setup.level==='intermediario'?5:0),
      exercises: buildLiftExercises(s.parts, setup)
    }));
    return { type:'lift', goal:setup.goal, workouts, totalWeeks:12 };
  } else {
    // running
    const goal = setup.goal || '5km';
    const totalWeeks = { '5km':8, '10km':10, '21km':12, '42km':16 }[goal];
    const wkDays = { 3:[2,4,6], 4:[1,3,5,0], 5:[1,2,4,5,0] }[setup.days] || [1,3,5,0];
    const dayNames = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    const types = ['Corrida Leve','Intervalado','Corrida Longa','Ritmo Constante'];
    const workouts = wkDays.map((d,i)=>{
      const kind = types[i%types.length];
      return {
        k:'S'+(i+1),
        name: kind + ' (plano de segurança)',
        dayIdx:d===0?7:d,
        dayName:dayNames[d===0?0:d],
        duration: kind==='Corrida Longa'?55:kind==='Intervalado'?38:31,
        distance: kind==='Corrida Longa'?'~5km':kind==='Intervalado'?'~4km':'~2.3km',
        blocks: buildRunBlocks(kind, setup)
      };
    });
    return { type:'run', goal, terrain:setup.terrain, workouts, totalWeeks };
  }
}

function buildLiftExercises(parts, setup){
  const bank = EX_BANK;
  const level = setup.level || 'iniciante';
  const setsMap = { iniciante:'3', intermediario:'4', avancado:'4' };
  const repsMap = { hipertrofia:'8-12', forca:'4-6', emagrecimento:'12-15', resistencia:'15-20' };
  const sets = setsMap[level];
  const reps = repsMap[setup.goal || 'hipertrofia'];
  const list = [];
  parts.forEach(p=>{
    const cat = bank.find(c=>c.name===p);
    if(!cat) return;
    const pick = cat.items.slice(0, p==='Core'||p==='Panturrilha'||p==='Trapézio'?2:3);
    pick.forEach(ex=>{
      list.push({ name:ex.name, sub:ex.sub, sets, reps, rest:'60-90s' });
    });
  });
  return list;
}
function buildRunBlocks(kind, setup){
  const warm = { name:'Aquecimento', exs:[
    {name:'Caminhada leve', desc:'Ritmo natural, aumente gradualmente', min:5},
    {name:'Mobilidade dinâmica', desc:'Rotações + elevação de joelhos', min:2}
  ]};
  let main;
  if(kind==='Intervalado'){
    main = { name:'Principal', exs:[
      {name:'6× 400m rápido', desc:'85% do máximo, recuperação 90s trotando', min:20},
      {name:'Trote leve', desc:'Recuperação ativa', min:5}
    ]};
  } else if(kind==='Corrida Longa'){
    main = { name:'Principal', exs:[
      {name:'Corrida contínua', desc:'Ritmo confortável, converse sem fôlego', min:40}
    ]};
  } else if(kind==='Ritmo Constante'){
    main = { name:'Principal', exs:[
      {name:'Corrida em ritmo alvo', desc:'Zona 3-4, um pouco desconfortável', min:25}
    ]};
  } else {
    main = { name:'Principal', exs:[
      {name:'Corrida em ritmo leve', desc:'Zona 2, converse sem esforço', min:21}
    ]};
  }
  const cool = { name:'Desaquecimento', exs:[
    {name:'Caminhada leve', desc:'Normalize a FC gradualmente', min:5}
  ]};
  return [warm, main, cool];
}

// ---------- EXERCISE BANK (biblioteca) ----------
const EX_BANK = [
  { name:'Peito', emo:'💪', color:'', items:[
    {name:'Supino Reto com Barra',sub:'Peito'},{name:'Supino Inclinado com Halteres',sub:'Peito Superior'},
    {name:'Supino Declinado',sub:'Peito Inferior'},{name:'Crucifixo com Halteres',sub:'Peito'},
    {name:'Crucifixo Inclinado',sub:'Peito Superior'},{name:'Crossover no Cabo',sub:'Peito'},
    {name:'Flexão de Braço',sub:'Peito / Tríceps'},{name:'Pullover com Halter',sub:'Peito / Serrátil'}
  ]},
  { name:'Costas', emo:'🔙', color:'', items:[
    {name:'Puxada Frontal no Pulley',sub:'Costas Lats'},{name:'Puxada Aberta com Pegada Pronada',sub:'Costas Lats'},
    {name:'Puxada com Triângulo',sub:'Costas / Romboides'},{name:'Remada Curvada com Barra',sub:'Costas Média'},
    {name:'Remada Curvada com Halteres',sub:'Costas'},{name:'Remada Unilateral com Haltere',sub:'Costas'},
    {name:'Remada Cavalinho (T-Bar)',sub:'Costas Média'},{name:'Remada Baixa no Cabo',sub:'Costas Média'},
    {name:'Pulldown no Cabo',sub:'Costas'},{name:'Barra Fixa',sub:'Costas / Bíceps'},
    {name:'Levantamento Terra',sub:'Costas / Posterior'}
  ]},
  { name:'Ombro', emo:'⛰️', color:'', items:[
    {name:'Desenvolvimento com Barra',sub:'Ombro'},{name:'Desenvolvimento Arnold',sub:'Ombro'},
    {name:'Elevação Lateral com Halteres',sub:'Ombro Lateral'},{name:'Elevação Frontal',sub:'Ombro Frontal'},
    {name:'Elevação Posterior Curvado',sub:'Ombro Posterior'},{name:'Desenvolvimento Militar',sub:'Ombro'},
    {name:'Face Pull no Cabo',sub:'Ombro Posterior'}
  ]},
  { name:'Bíceps', emo:'💪', color:'', items:[
    {name:'Rosca Direta com Barra',sub:'Bíceps'},{name:'Rosca Alternada com Halteres',sub:'Bíceps'},
    {name:'Rosca Martelo com Halteres',sub:'Braquial / Bíceps'},{name:'Rosca Concentrada',sub:'Bíceps'},
    {name:'Rosca Scott',sub:'Bíceps'},{name:'Rosca Inversa',sub:'Antebraço'}
  ]},
  { name:'Tríceps', emo:'🔱', color:'orange', items:[
    {name:'Tríceps Pulley no Cabo',sub:'Tríceps'},{name:'Tríceps Francês com Halteres',sub:'Tríceps'},
    {name:'Tríceps Corda no Cabo',sub:'Tríceps'},{name:'Mergulho nas Paralelas',sub:'Tríceps / Peito'},
    {name:'Tríceps Coice com Haltere',sub:'Tríceps'},{name:'Tríceps Testa',sub:'Tríceps'}
  ]},
  { name:'Pernas', emo:'🦵', color:'orange', items:[
    {name:'Agachamento Livre com Barra',sub:'Quadríceps / Glúteos'},{name:'Agachamento Frontal',sub:'Quadríceps'},
    {name:'Leg Press 45°',sub:'Quadríceps'},{name:'Hack Machine',sub:'Quadríceps'},
    {name:'Afundo com Halteres',sub:'Quadríceps / Glúteos'},{name:'Agachamento Búlgaro',sub:'Quadríceps / Glúteos'},
    {name:'Cadeira Extensora',sub:'Quadríceps'},{name:'Stiff com Halteres',sub:'Posterior / Glúteos'},
    {name:'Stiff com Barra',sub:'Posterior / Glúteos'},{name:'Mesa Flexora',sub:'Posterior de Coxa'},
    {name:'Cadeira Flexora',sub:'Posterior de Coxa'}
  ]},
  { name:'Glúteos', emo:'🍑', color:'pink', items:[
    {name:'Elevação Pélvica (Hip Thrust)',sub:'Glúteos'},{name:'Glúteo no Cabo',sub:'Glúteos'},
    {name:'Glúteo 4 Apoios com Caneleira',sub:'Glúteos'},{name:'Coice na Polia Baixa',sub:'Glúteos'},
    {name:'Cadeira Abdutora',sub:'Abdutores / Glúteo Médio'},{name:'Adução na Máquina',sub:'Adutores'},
    {name:'Agachamento Sumô com Haltere',sub:'Glúteos / Quadríceps'}
  ]},
  { name:'Panturrilha', emo:'🦶', color:'teal', items:[
    {name:'Panturrilha em Pé',sub:'Panturrilha'},{name:'Panturrilha Sentado',sub:'Panturrilha Sóleo'},
    {name:'Panturrilha no Leg Press',sub:'Panturrilha'}
  ]},
  { name:'Trapézio', emo:'🦅', color:'', items:[
    {name:'Encolhimento com Halteres',sub:'Trapézio'},{name:'Encolhimento com Barra',sub:'Trapézio'}
  ]},
  { name:'Core', emo:'🎯', color:'', items:[
    {name:'Prancha (Plank)',sub:'Core'},{name:'Abdominal Crunch',sub:'Core'},
    {name:'Mountain Climber',sub:'Core / Cardio'},{name:'Abdominal Bicicleta',sub:'Core / Oblíquos'}
  ]}
];

// ---------- HELPERS ----------
function $(id){ return document.getElementById(id); }
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({top:0,behavior:'instant'});
}
function toast(msg){
  const t = document.createElement('div');
  t.className='toast'; t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 2200);
}
function getDayIdx(){ const d = new Date().getDay(); return d===0?7:d; }
function greetTime(){
  const h = new Date().getHours();
  if(h<12) return 'Bom dia';
  if(h<18) return 'Boa tarde';
  return 'Boa noite';
}
function trialDaysLeft(){
  if(!state.user) return 14;
  const ms = 14*24*3600*1000 - (Date.now() - state.user.trialStart);
  return Math.max(0, Math.ceil(ms/(24*3600*1000)));
}

// ---------- MODULE TOGGLE ----------
function renderModToggle(){
  const el = $('mod-toggle');
  const a = state.active;
  const cur = a==='lift' ? {emo:'🏋️', name:'Musculação', cls:'lift'} : {emo:'🏃', name:'Corrida', cls:'run'};
  const other = a==='lift' ? {emo:'🏃', name:'Corrida', to:'run'} : {emo:'🏋️', name:'Musculação', to:'lift'};
  el.innerHTML = `
    <div class="mod-cur ${cur.cls}"><span style="font-size:20px">${cur.emo}</span> <span>${cur.name}</span></div>
    <button class="mod-switch" onclick="switchModule('${other.to}')">⇄ Ir para <span style="font-size:16px">${other.emo}</span> ${other.name}</button>
  `;
}
function switchModule(to){
  if(!state.modules[to]){
    // needs setup
    state.active = to;
    save();
    showScreen('scr-setup-'+to);
    bindOpts('scr-setup-'+to);
    return;
  }
  state.active = to;
  save();
  goTab('home');
  toast('Trocado para '+(to==='lift'?'🏋️ Musculação':'🏃 Corrida'));
}
function switchModuleUI(){
  const to = state.active==='lift' ? 'run' : 'lift';
  switchModule(to);
}

// ---------- TAB NAVIGATION ----------
function goTab(tab){
  state.ui.tab = tab;
  save();
  // library only for lift
  $('tab-library').style.display = state.active==='lift' ? 'flex' : 'none';
  // sessions label
  $('tab-sess-lbl').textContent = 'Sessões';
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
  $('tabbar').classList.remove('hidden');
  const map = { home:'scr-home', sessions:'scr-sessions', library:'scr-library', perf:'scr-perf', history:'scr-history', plan:'scr-plan', profile:'scr-profile' };
  showScreen(map[tab] || 'scr-home');
  if(tab==='home') renderHome();
  if(tab==='sessions') renderSessions();
  if(tab==='library') renderLibrary();
  if(tab==='perf') renderPerf();
  if(tab==='history') renderHistory();
  if(tab==='plan') renderPlan();
  if(tab==='profile') renderProfile();
}

// ---------- HOME RENDER ----------
function renderHome(){
  renderModToggle();
  const mod = state.modules[state.active];
  if(!mod){ // fallback
    showScreen('scr-pick'); return;
  }
  const isLift = state.active==='lift';
  $('home-avatar').textContent = (state.user.name||'A').charAt(0).toUpperCase();
  $('home-hi').textContent = `${greetTime()}, ${state.user.name.split(' ')[0]}! 👋`;
  $('home-goal').textContent = 'Objetivo: ' + labelGoal(mod);
  $('daily-quote').textContent = QUOTES[new Date().getDate() % QUOTES.length];
  $('trial-msg').textContent = `Você tem ${trialDaysLeft()} dias grátis pra explorar tudo. Bora começar?`;

  // plan progress
  const wk = mod.week || 1;
  const total = mod.plan.totalWeeks;
  $('plan-week').textContent = `Semana ${wk} de ${total}`;
  $('plan-progress').style.width = Math.min(100, (wk/total)*100) + '%';
  const phase = wk<=Math.floor(total*0.6) ? 'BUILD' : wk<=Math.floor(total*0.85) ? 'PEAK' : 'TAPER';
  $('plan-phase').textContent = phase;
  const phaseTxt = phase==='BUILD' ? `🏗️ Fase de construção · ${isLift?'Ganhando base muscular':'Aumentando base aeróbica'}. ${total-wk} semanas até o pico.` :
                   phase==='PEAK' ? `🚀 Fase de pico · Alta intensidade. ${total-wk} semanas restantes.` :
                                   `🎯 Fase de taper · Recuperação e afinação final.`;
  $('plan-foot').textContent = phaseTxt;

  // today slot
  const today = getDayIdx();
  const todayWk = mod.plan.workouts.find(w=>w.dayIdx===today);
  const slot = $('today-slot');
  if(todayWk){
    slot.innerHTML = renderTodayWorkout(todayWk, isLift);
  } else {
    slot.innerHTML = renderRestDay(mod);
  }

  // week grid
  renderWeekGrid(mod);
  // your list
  renderYourList(mod);
}

function labelGoal(mod){
  if(!mod) return '—';
  if(mod.plan.type==='lift') return { hipertrofia:'Hipertrofia', forca:'Força', emagrecimento:'Emagrecimento', resistencia:'Resistência' }[mod.setup.goal] || '—';
  return { '5km':'5 km', '10km':'10 km', '21km':'Meia (21k)', '42km':'Maratona (42k)' }[mod.setup.goal] || '—';
}

function renderTodayWorkout(w, isLift){
  const desc = isLift ? liftDesc(w) : runDesc(w);
  const diffCls = isLift ? 'diff-med' : 'diff-easy';
  const diffLbl = isLift ? 'Foco' : 'Fácil';
  return `
    <div class="today">
      <div class="today-label">TREINO DE HOJE</div>
      <div class="today-diff ${diffCls}">${diffLbl}</div>
      <div class="today-title">${isLift ? `Treino ${w.k} — ${w.name}` : w.name}</div>
      <div class="today-desc">${desc}</div>
      <div class="today-meta">
        <span class="chip mono">⏱️ ${w.duration} min</span>
        ${w.distance?`<span class="chip mono">📍 ${w.distance}</span>`:''}
        ${isLift?`<span class="chip">💪 ${w.exercises.length} exercícios</span>`:''}
      </div>
      <div class="today-actions">
        <button class="btn btn-primary" onclick="openSession('${w.k||w.dayIdx}')">▶ Ver sessão</button>
        <button class="btn btn-ghost" onclick="markDone('${w.k||w.dayIdx}')">✓ Marcar feito</button>
      </div>
    </div>
  `;
}
function liftDesc(w){
  const parts = w.parts.join(' + ');
  return `🎯 Foco em ${parts.toLowerCase()}\n\nAqueça bem por 5-8 min. Faça séries progressivas priorizando técnica.\n\n💧 Hidrate-se durante e mantenha os intervalos de 60-90s.`;
}
function runDesc(w){
  return `🔥 Aquecimento: 5 min de caminhada leve para elevar a frequência cardíaca gradualmente\n\nRitmo de conversa (você consegue falar frases completas sem ficar sem ar). Caminhada + trote intercalado se for iniciante.\n\n🏁 Desaquecimento: 5 min de caminhada leve para normalizar a frequência cardíaca gradualmente`;
}

function renderRestDay(mod){
  const isLift = mod.plan.type==='lift';
  const ws = mod.plan.workouts.slice(0, 3);
  return `
    <div class="rest-card">
      <div class="rest-emoji">😴</div>
      <div class="rest-title">Dia de Descanso</div>
      <div class="rest-sub">Aproveite para recuperar. Você volta amanhã mais forte!</div>
      <div class="rest-divider">— ou —</div>
      <div style="font-weight:700;margin-top:2px">Quer antecipar algum treino?</div>
      <div class="anticipate">
        ${ws.map(w=>`
          <div class="antic-card" onclick="openSession('${w.k||w.dayIdx}')">
            <div class="antic-letter">${(w.k||'').charAt(0)||'S'}</div>
            <div class="antic-name">${isLift?'Treino '+w.k:w.name.split(' ')[0]}</div>
            <div class="antic-day">${w.dayName}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderWeekGrid(mod){
  const days = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const today = getDayIdx();
  const emo = mod.plan.type==='lift' ? '💪' : '🏃';
  const scheduled = new Set(mod.plan.workouts.map(w=>w.dayIdx));
  const doneToday = (mod.history||[]).filter(h=>{
    const d = new Date(h.at);
    const start = new Date(); start.setHours(0,0,0,0);
    return d >= new Date(start.getTime() - (today-1)*86400000);
  }).map(h=>{ const dd = new Date(h.at); return dd.getDay()===0?7:dd.getDay(); });
  const doneSet = new Set(doneToday);

  $('week-grid').innerHTML = days.map((n,i)=>{
    const idx = i+1;
    const has = scheduled.has(idx);
    const done = doneSet.has(idx);
    const isT = idx===today;
    return `
      <div class="day ${isT?'today':''} ${!has?'rest':''}">
        <div class="day-name">${n.slice(0,3)}</div>
        <div class="day-dot ${done?'done':has?'plan':''}"></div>
        <div class="day-emoji">${has?emo:'·'}</div>
      </div>
    `;
  }).join('');
}

function renderYourList(mod){
  const isLift = mod.plan.type==='lift';
  $('your-list').innerHTML = mod.plan.workouts.map(w=>`
    <div class="list-item" onclick="openSession('${w.k||w.dayIdx}')">
      ${isLift?`<div class="list-badge">${w.k}</div>`:`<div class="list-dot"></div>`}
      <div class="list-info">
        <div class="list-tag">${(w.dayName||'').toUpperCase()}</div>
        <div class="list-name">${isLift?'Treino '+w.k+' — '+w.name:w.name}</div>
      </div>
      <div class="list-right"><span class="mono">~${w.duration}min</span> ›</div>
    </div>
  `).join('');
}

// ---------- SESSIONS ----------
function renderSessions(){
  const mod = state.modules[state.active];
  const isLift = state.active==='lift';
  $('sessions-title').innerHTML = `${isLift?'🏋️':'🏃'} Sessões`;
  $('sessions-tag').textContent = `Sessões · ${isLift?'Musculação':'Corrida'}`;
  $('weekly-info').textContent = `${isLift?'Objetivo: '+labelGoal(mod):`Meta: ${labelGoal(mod)}`} · Semana ${mod.week}/${mod.plan.totalWeeks} · ${mod.plan.workouts.length}× por semana`;

  // chips of sessions
  const sel = state.ui.selectedSession || (mod.plan.workouts.find(w=>w.dayIdx===getDayIdx()) || mod.plan.workouts[0]);
  const chips = $('sessions-chips');
  chips.innerHTML = mod.plan.workouts.map(w=>{
    const on = (w.k||w.dayIdx)===(sel.k||sel.dayIdx);
    return `<div class="filter-chip ${on?'on':''}" onclick="selectSession('${w.k||w.dayIdx}')">
      <div style="font-size:11px;letter-spacing:1px;color:var(--text-dim);font-weight:700">${(w.dayName||'').toUpperCase()}</div>
      <div style="font-weight:700;margin-top:2px">${isLift?'Treino '+w.k:w.name.split('(')[0].trim()}</div>
    </div>`;
  }).join('');

  renderSessionDetail(sel);
}
function selectSession(id){
  const mod = state.modules[state.active];
  state.ui.selectedSession = mod.plan.workouts.find(w=>String(w.k||w.dayIdx)===String(id));
  save(); renderSessions();
}
function renderSessionDetail(w){
  if(!w){ $('session-detail-slot').innerHTML=''; return; }
  const isLift = state.active==='lift';
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
    <div class="card card-info card-row"><div class="card-icon">💡</div><div><div class="card-title info">Dicas para esta sessão</div><div class="card-sub">${isLift?'Mantenha técnica antes de aumentar carga. Descanso ativo entre séries.':'Mantenha um ritmo onde você consiga conversar sem dificuldade. FC entre 60-70% do máximo.'}</div></div></div>
    ${isLift ? renderLiftBlocks(w) : renderRunBlocks(w)}
    <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="markDone('${w.k||w.dayIdx}')">✓ Marcar sessão como feita</button>
  `;
  $('session-detail-slot').innerHTML = html;
}
function renderLiftBlocks(w){
  // group by muscle
  const groups = {};
  w.exercises.forEach(ex=>{
    // guess group from ex.sub
    const g = (ex.sub||'').split(/[\s\/]/)[0] || 'Principal';
    (groups[g] = groups[g] || []).push(ex);
  });
  return Object.entries(groups).map(([g,exs],i)=>`
    <div class="block ${i===0?'open':''}">
      <div class="block-head main" onclick="this.parentNode.classList.toggle('open')">
        <span style="font-size:20px">🔥</span>
        <div class="block-head-txt"><div class="block-name">${g}</div><div class="block-sub">${exs.length} exercícios</div></div>
        <div class="block-chev">▾</div>
      </div>
      <div class="block-body">
        ${exs.map((ex,j)=>`
          <div class="ex">
            <div class="ex-num">${j+1}</div>
            <div style="flex:1"><div class="ex-name">${ex.name}</div><div class="ex-desc">${ex.sub}</div></div>
            <div class="ex-meta">${ex.sets}×${ex.reps}<br><span style="color:var(--text-dim);font-weight:500">${ex.rest}</span></div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}
function renderRunBlocks(w){
  const cls = ['warm','main','cool'];
  const emos = ['🔥','🏃','🏁'];
  return w.blocks.map((b,i)=>`
    <div class="block ${i===1?'open':''}">
      <div class="block-head ${cls[i]}" onclick="this.parentNode.classList.toggle('open')">
        <span style="font-size:20px">${emos[i]}</span>
        <div class="block-head-txt"><div class="block-name">${b.name}</div><div class="block-sub">${b.exs.reduce((s,e)=>s+e.min,0)} min</div></div>
        <div class="block-chev">▾</div>
      </div>
      <div class="block-body">
        ${b.exs.map((ex,j)=>`
          <div class="ex">
            <div class="ex-num">${j+1}</div>
            <div style="flex:1"><div class="ex-name">${ex.name}</div><div class="ex-desc">${ex.desc}</div></div>
            <div class="ex-meta">${ex.min} min</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}
function openSession(id){
  const mod = state.modules[state.active];
  const w = mod.plan.workouts.find(w=>String(w.k||w.dayIdx)===String(id));
  state.ui.selectedSession = w;
  save();
  goTab('sessions');
}
function toggleWeeklyBlock(){ /* future: expand info */ }

// ---------- MARK DONE ----------
function markDone(id){
  const mod = state.modules[state.active];
  const w = mod.plan.workouts.find(w=>String(w.k||w.dayIdx)===String(id));
  if(!w) return;
  mod.history = mod.history || [];
  mod.history.push({ id: w.k||w.dayIdx, name:w.name, at:Date.now(), duration:w.duration, module:state.active });
  // advance week if all workouts of week done
  save();
  toast('✅ Treino marcado como feito!');
  goTab('home');
}

// ---------- HISTORY ----------
function renderHistory(){
  const mod = state.modules[state.active];
  const isLift = state.active==='lift';
  const h = mod.history || [];
  $('hist-title').textContent = `${isLift?'🏋️':'🏃'} Histórico${isLift?'':' de Corrida'}`;
  $('hist-tag').textContent = `Histórico · ${isLift?'Musculação':'Corrida'}`;
  $('h-icon').textContent = isLift?'🏋️':'🏃';
  $('h-lbl1').textContent = isLift?'Treinos':'Corridas';
  $('h-icon3').textContent = isLift?'⏱️':'📍';
  $('h-lbl3').textContent = isLift?'Total':'Total';
  $('h-count').textContent = h.length;
  $('h-streak').textContent = calcStreak(h)+'d';
  const totalHours = h.reduce((s,x)=>s+(x.duration||0),0)/60;
  $('h-total').textContent = totalHours < 1 ? '0h' : totalHours.toFixed(1)+'h';

  if(h.length===0){
    $('history-list').innerHTML = '';
    $('history-empty').classList.remove('hidden');
    $('he-title').textContent = isLift?'Nenhum treino registrado ainda':'Nenhuma corrida registrada';
    $('he-sub').textContent = isLift?'Cada treino que você finalizar vai aparecer aqui com data, duração e detalhes.':'Complete sua primeira sessão para ver o histórico';
  } else {
    $('history-empty').classList.add('hidden');
    $('history-list').innerHTML = h.slice().reverse().map(x=>{
      const d = new Date(x.at);
      return `
        <div class="list-item">
          <div class="list-dot"></div>
          <div class="list-info">
            <div class="list-tag">${d.toLocaleDateString('pt-BR')} · ${d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
            <div class="list-name">${x.name}</div>
          </div>
          <div class="list-right mono">${x.duration}min</div>
        </div>
      `;
    }).join('');
  }
}
function calcStreak(h){
  if(!h||!h.length) return 0;
  const days = new Set(h.map(x=>new Date(x.at).toDateString()));
  let s = 0;
  let cur = new Date();
  while(days.has(cur.toDateString())){ s++; cur.setDate(cur.getDate()-1); }
  return s;
}

// ---------- PERF ----------
function renderPerf(){
  const mod = state.modules[state.active];
  const isLift = state.active==='lift';
  const h = mod.history || [];
  const wkTarget = mod.plan.workouts.length;
  const start = new Date(); start.setDate(start.getDate()-7); start.setHours(0,0,0,0);
  const weekDone = h.filter(x=>x.at>=start.getTime()).length;
  $('s1-lbl').textContent = isLift?'Treinos':'Corridas';
  $('s1-val').innerHTML = `${weekDone}<small>/${wkTarget}</small>`;
  $('s1-note').textContent = Math.round(weekDone/wkTarget*100)+'%';
  $('s2-lbl').textContent = isLift?'Volume':'Km';
  $('s2-val').innerHTML = isLift?`0<small>kg</small>`:`0<small>km</small>`;
  $('s2-note').textContent = '↑ +0%';
  $('s3-val').textContent = h.length*220;
  $('m-streak').textContent = calcStreak(h);
  $('m-wk').innerHTML = `${weekDone}<small>/${wkTarget}</small>`;
  const totalMin = h.reduce((s,x)=>s+(x.duration||0),0);
  $('m-total').textContent = totalMin<60 ? totalMin+'min' : (totalMin/60).toFixed(1)+'h';
  $('m-best').textContent = calcStreak(h);

  // Real perf line based on history
  const line = document.getElementById('perf-line');
  if(line){
    if(h.length===0){
      line.setAttribute('points','40,170 140,170 240,170 340,170');
    } else {
      // basic: last 4 weeks completion %
      const now = Date.now();
      const pts = [];
      for(let i=3;i>=0;i--){
        const start = now - (i+1)*7*86400000;
        const end = now - i*7*86400000;
        const done = h.filter(x=>x.at>=start && x.at<end).length;
        const pct = Math.min(100, (done/wkTarget)*100);
        const y = 170 - (pct * 1.5);
        pts.push(`${40 + (3-i)*100},${y}`);
      }
      line.setAttribute('points', pts.join(' '));
    }
  }
}

// ---------- PLAN SCREEN ----------
function renderPlan(){
  const mod = state.modules[state.active];
  const isLift = state.active==='lift';
  const s = mod.setup;
  $('plan-title').textContent = `💎 Plano · ${isLift?'Musculação':'Corrida'}`;
  const rows = isLift ? [
    ['Objetivo', labelGoal(mod)],
    ['Dias de treino', s.days+' dias/semana'],
    ['Equipamento', {academia:'🏋️ Academia completa',halteres:'🎒 Só halteres',casa:'🏠 Peso do corpo',basico:'💪 Básico'}[s.equip]],
    ['Nível', s.level.charAt(0).toUpperCase()+s.level.slice(1)],
    ['Duração', mod.plan.totalWeeks+' semanas']
  ] : [
    ['Objetivo', labelGoal(mod)],
    ['Duração', mod.plan.totalWeeks+' semanas'],
    ['Sessões/semana', s.days+' dias'],
    ['Terreno', {asfalto:'🛣️ Asfalto',esteira:'🏃 Esteira',trilha:'⛰️ Trilha',pista:'🏟️ Pista'}[s.terrain]],
    ['Nível', s.level.charAt(0).toUpperCase()+s.level.slice(1)]
  ];
  $('plan-details').innerHTML = `
    <div class="card">
      ${rows.map(r=>`<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px dashed var(--border)"><span class="text-dim">${r[0]}</span><b>${r[1]}</b></div>`).join('')}
    </div>
  `;
  $('trial-days').textContent = trialDaysLeft()+' dias restantes';
}

function regenPlan(){
  showScreen('scr-setup-'+state.active);
  bindOpts('scr-setup-'+state.active);
}

// ---------- PROFILE ----------
function renderProfile(){
  const u = state.user;
  $('pf-avatar').textContent = (u.name||'A').charAt(0).toUpperCase();
  $('pf-name').textContent = u.name;
  $('pf-email').textContent = u.email;
  $('pf-trial').textContent = trialDaysLeft()+' dias restantes de teste';
  const isLift = state.active==='lift';
  const mod = state.modules[state.active];
  $('pf-mod').innerHTML = `
    <div class="icon">${isLift?'🏋️':'🏃'}</div>
    <div style="flex:1"><div class="name">${isLift?'Musculação':'Corrida'}</div><div class="goal">Objetivo: ${labelGoal(mod)}</div></div>
    <button class="btn btn-outline" onclick="switchModuleUI()">→ ${isLift?'🏃 Corrida':'🏋️ Musculação'}</button>
  `;
  $('pf-plan-lbl').textContent = `Plano de ${isLift?'Musculação':'Corrida'}`;
  const s = mod.setup;
  const rows = isLift ? [
    ['Objetivo', labelGoal(mod)],
    ['Dias de treino', s.days+' dias/semana'],
    ['Equipamento', {academia:'🏋️ Academia completa',halteres:'🎒 Só halteres',casa:'🏠 Peso do corpo',basico:'💪 Básico'}[s.equip]]
  ] : [
    ['Objetivo', labelGoal(mod)],
    ['Duração', mod.plan.totalWeeks+' semanas'],
    ['Sessões/semana', s.days+' dias'],
    ['Terreno', {asfalto:'🛣️ Asfalto',esteira:'🏃 Esteira',trilha:'⛰️ Trilha',pista:'🏟️ Pista'}[s.terrain]]
  ];
  $('pf-plan-card').innerHTML = rows.map(r=>`<div style="display:flex;justify-content:space-between;padding:8px 0"><span class="text-dim">${r[0]}</span><b>${r[1]}</b></div>`).join('');
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
  const cats = libFilter==='Todos' ? EX_BANK : EX_BANK.filter(c=>c.name===libFilter);
  $('lib-list').innerHTML = cats.map(cat=>{
    const items = cat.items.filter(x=>!q || x.name.toLowerCase().includes(q) || x.sub.toLowerCase().includes(q));
    if(!items.length) return '';
    return `
      <div class="lib-cat ${cat.color}">
        <div><div class="lib-cat-name">${cat.emo} ${cat.name}</div><div class="lib-cat-count">${items.length} exercícios</div></div>
      </div>
      ${items.map(ex=>`
        <div class="lib-item ${cat.color}" onclick="openExercise('${ex.name.replace(/'/g,"\\'")}')">
          <div class="lib-info"><div class="lib-name">${ex.name}</div><div class="lib-part">${ex.sub}</div></div>
          <div class="lib-play">▶</div>
        </div>
      `).join('')}
    `;
  }).join('');
}
function setLibFilter(c){ libFilter=c; renderLibrary(); }
function filterLib(){ renderLibrary(); }
function openExercise(name){
  const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent('como fazer '+name+' técnica correta');
  window.open(url, '_blank');
}

// ---------- MODALS ----------
const MODAL_CONTENT = {
  'partners':`<h3>👥 Profissionais parceiros</h3><p>Selecionamos profissionais parceiros (nutricionistas, fisioterapeutas, personal trainers) que podem complementar seu treino. Em breve você poderá agendar consultas direto pelo app.</p><button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal()">Entendi</button>`,
  'support-info':`<h3>⚕️ Ferramenta de apoio ao treino</h3><p>O MetaTreino é uma ferramenta de <b>apoio</b> ao seu treinamento. Ele não substitui:<br><br>· Avaliação médica<br>· Acompanhamento profissional presencial<br>· Consulta com fisioterapeuta ou nutricionista<br><br>Sempre procure orientação profissional em caso de dor, lesão ou dúvidas de saúde.</p><button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal()">Entendi</button>`,
  'contact':`<h3>✉️ Fale com a gente</h3><p>Envie suas dúvidas, sugestões ou reporte um problema. Responderemos em até 48h.</p><p style="margin-top:14px"><b>E-mail:</b> contato@metatreino.app</p><button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal()">Fechar</button>`,
  'faq':`<h3>❓ FAQ / Sobre</h3><p><b>MetaTreino</b> gera planos de treino inteligentes de musculação e corrida, personalizados com base em seus objetivos, nível e equipamentos disponíveis.<br><br><b>Como funciona?</b> Você escolhe o módulo (Corrida ou Musculação), responde algumas perguntas rápidas e recebe um plano progressivo.<br><br><b>Meus dados ficam salvos?</b> Sim, tudo é salvo localmente no seu dispositivo.</p><button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal()">Fechar</button>`,
  'privacy':`<h3>🔒 Privacidade</h3><p>Todos os seus dados de treino são armazenados <b>apenas no seu dispositivo</b>. Não coletamos, não compartilhamos e não vendemos suas informações.</p><button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal()">Fechar</button>`,
  'terms':`<h3>📄 Termos de uso</h3><p>Este app é fornecido "no estado em que se encontra", sem garantias. Use por sua conta e risco. Consulte um profissional de saúde antes de iniciar qualquer programa de exercícios.</p><button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal()">Fechar</button>`,
  'upgrade':`<h3>💳 MetaTreino Premium</h3><p style="margin-bottom:14px">Assine e ganhe acesso completo:</p><ul style="color:var(--text-dim);padding-left:20px;line-height:1.7"><li>Ambos os módulos (Corrida + Musculação)</li><li>Trocas ilimitadas de plano</li><li>Sincronização em nuvem</li><li>Vídeos completos dos exercícios</li><li>Suporte prioritário</li></ul><div class="row" style="gap:10px;margin-top:16px"><button class="btn btn-outline btn-block" onclick="closeModal()">Mais tarde</button><button class="btn btn-primary btn-block" onclick="toast('Em breve! 🚀');closeModal()">Assinar agora</button></div>`,
  'edit-profile':()=>`<h3>✏️ Editar perfil</h3><div class="field"><label>Nome</label><input class="input" id="ep-name" value="${state.user.name}"></div><div class="field"><label>E-mail</label><input class="input" id="ep-email" value="${state.user.email}" disabled></div><button class="btn btn-primary btn-block" style="margin-top:12px" onclick="saveProfile()">Salvar</button>`
};
function openModal(k){
  const c = MODAL_CONTENT[k];
  $('modal-inner').innerHTML = typeof c==='function' ? c() : c;
  $('modal-back').classList.add('on');
}
function closeModal(){ $('modal-back').classList.remove('on'); }
function saveProfile(){
  const n = $('ep-name').value.trim();
  if(!n) return toast('Nome não pode ficar vazio');
  state.user.name = n;
  saveAuth();
  toast('✅ Perfil atualizado');
  closeModal();
  goTab('profile');
}

// ---------- INIT ----------
window.addEventListener('DOMContentLoaded', ()=>{
  load();
  if(state.user){ bootAfterAuth(); }
  else { showScreen('scr-auth'); }
  // enter key on inputs
  ['lg-pass','sg-pass'].forEach(id=>{
    const el=$(id); if(el) el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ id==='lg-pass'?doLogin():doSignup(); } });
  });
});

// expose to window
Object.assign(window,{doLogin,doSignup,doLogout,showLogin,showSignup,pickModule,finishSetup,switchModule,switchModuleUI,goTab,openSession,markDone,selectSession,toggleWeeklyBlock,openModal,closeModal,saveProfile,regenPlan,setLibFilter,filterLib,openExercise});

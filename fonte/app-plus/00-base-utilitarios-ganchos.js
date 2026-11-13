// =====================================================================
// MetaTreino 2027.1 Beta 35 — app-plus.js
// Camada de evolução carregada DEPOIS do app.js. Não recria nada que já funciona:
// estende, corrige e acrescenta. Todas as funções do app.js continuam valendo.
//
// O que fica em cada parte: veja MAPA-DO-CODIGO.md (na raiz do projeto).
// Para montar este arquivo: python3 fonte/montar.py
// =====================================================================
'use strict';

const MTP = { versao: '2027.1-beta.35' };

// ---------- GANCHOS ----------
// Jeito único de acrescentar comportamento às funções de tela do app.js, sem
// empilhar camadas uma dentro da outra:
//   mtGancho('renderHome', { depois(){ ... } })   → roda depois da função
//   mtGancho('renderHome', { antes(){ ... } })    → roda antes
// Ordem igual à das antigas camadas: "antes" do mais novo para o mais antigo,
// "depois" do mais antigo para o mais novo (ordem dos arquivos). Cada gancho roda
// isolado: um erro num gancho é registrado no console e não derruba a tela.
// Funções com ganchos: ver MAPA-DO-CODIGO.md (seção "Ganchos").
const _MT_GANCHOS = {};
function mtGancho(nome, g){
  const atual = window[nome];
  if(typeof atual !== 'function') return;
  let reg = _MT_GANCHOS[nome];
  if(!reg || reg.fn !== atual){
    // primeira vez — ou alguém embrulhou a função por fora depois: abre uma nova camada
    const orig = atual; const R = { antes:[], depois:[] };
    const roda = (lista, ctx, args, onde)=>{ for(const f of lista){ try{ f.apply(ctx, args); }catch(e){ console.log(nome + ' (' + onde + '):', e); } } };
    const assinc = orig.constructor && orig.constructor.name === 'AsyncFunction';
    R.fn = assinc
      ? async function(){ roda(R.antes.slice().reverse(), this, arguments, 'antes'); const r = await orig.apply(this, arguments); roda(R.depois, this, arguments, 'depois'); return r; }
      : function(){ roda(R.antes.slice().reverse(), this, arguments, 'antes'); const r = orig.apply(this, arguments); roda(R.depois, this, arguments, 'depois'); return r; };
    window[nome] = R.fn; _MT_GANCHOS[nome] = reg = R;
  }
  if(g.antes) reg.antes.push(g.antes);
  if(g.depois) reg.depois.push(g.depois);
}
const DIA_MS = 86400000;
function mtNorm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function mtEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function mtJsStr(s){ return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
function mtDia0(t){ const d = new Date(t==null?Date.now():t); d.setHours(0,0,0,0); return d.getTime(); }
function mtLS(k, v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){ return null; } }
function mtAllHist(){ return [...((state.modules.lift&&state.modules.lift.history)||[]), ...((state.modules.run&&state.modules.run.history)||[])].filter(x=>x&&x.at).sort((a,b)=>a.at-b.at); }
// histórico unificado com o tipo de cada sessão: musculacao | corrida | caminhada | bike
function mtHist(){
  const L = ((state.modules.lift&&state.modules.lift.history)||[]).map(x=>Object.assign({}, x, {_t:'musculacao'}));
  const R = ((state.modules.run&&state.modules.run.history)||[]).map(x=>Object.assign({}, x, {_t: (!x.activity||x.activity==='corrida') ? 'corrida' : x.activity}));
  return [...L, ...R].filter(x=>x&&x.at).sort((a,b)=>a.at-b.at);
}
function mtDiasAtivos(desde, ate){ const s = new Set(); mtAllHist().forEach(x=>{ if(x.at>=desde && x.at<(ate||Infinity)) s.add(mtDia0(x.at)); }); return s; }
function mtFmtKm(v){ return (Math.round((+v||0)*10)/10).toLocaleString('pt-BR',{minimumFractionDigits:(Math.round(v*10)%10)?1:0, maximumFractionDigits:1}); }
function mtFmtData(t, opt){ return new Date(t).toLocaleDateString('pt-BR', opt||{day:'2-digit', month:'2-digit'}); }
function mtSemanaIni(t){ const d = new Date(mtDia0(t)); const wd = d.getDay()===0?7:d.getDay(); d.setDate(d.getDate()-(wd-1)); return d.getTime(); }
// administrador (principal ou secundário autorizado) — o Firestore confere de novo no servidor
function mtAdmin(){ return mtPrincipal() || !!(state.user && state.user.isAdmin); }
function mtPrincipal(){ return String((state.user&&state.user.email)||'').toLowerCase() === String(ADMIN_EMAIL).toLowerCase(); }
function mtPaceStr(minPorKm){ if(!isFinite(minPorKm) || minPorKm<=0) return '—'; const m = Math.floor(minPorKm); let s = Math.round((minPorKm-m)*60); let mm = m; if(s===60){ mm++; s=0; } return mm+':'+String(s).padStart(2,'0')+'/km'; }


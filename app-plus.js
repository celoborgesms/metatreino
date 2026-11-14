// =====================================================================
// MetaTreino 2027.1 Beta 36 — app-plus.js
// Camada de evolução carregada DEPOIS do app.js. Não recria nada que já funciona:
// estende, corrige e acrescenta. Todas as funções do app.js continuam valendo.
//
// O que fica em cada parte: veja MAPA-DO-CODIGO.md (na raiz do projeto).
// Para montar este arquivo: python3 fonte/montar.py
// =====================================================================
'use strict';

const MTP = { versao: '2027.1-beta.36' };

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

// ---------- ÍCONES (desenhados para o MetaTreino) ----------
const MUSCLE_SVG = {
"peito": "<g class=\"m-sil\"><ellipse cx=\"12\" cy=\"3.3\" rx=\"2\" ry=\"2.2\"/><path d=\"M9.8 6.2C8 6.3 6.3 6.8 5.4 8C4.7 9 4.5 10.5 4.4 12L3.9 17.3Q4 18.3 4.9 18.2L6 12.8L6.7 10.6L7.9 15.5L8.6 21.8H15.4L16.1 15.5L17.3 10.6L18 12.8L19.1 18.2Q20 18.3 20.1 17.3L19.6 12C19.5 10.5 19.3 9 18.6 8C17.7 6.8 16 6.3 14.2 6.2Q12 7.2 9.8 6.2Z\"/></g><g class=\"m-hl\"><path d=\"M8 9Q9.8 8.3 11.6 8.8L11.6 11.6Q9.6 12.5 7.9 11.3Z M16 9Q14.2 8.3 12.4 8.8L12.4 11.6Q14.4 12.5 16.1 11.3Z\"/></g>",
"costas": "<g class=\"m-sil\"><ellipse cx=\"12\" cy=\"3.3\" rx=\"2\" ry=\"2.2\"/><path d=\"M9.8 6.2C8 6.3 6.3 6.8 5.4 8C4.7 9 4.5 10.5 4.4 12L3.9 17.3Q4 18.3 4.9 18.2L6 12.8L6.7 10.6L7.9 15.5L8.6 21.8H15.4L16.1 15.5L17.3 10.6L18 12.8L19.1 18.2Q20 18.3 20.1 17.3L19.6 12C19.5 10.5 19.3 9 18.6 8C17.7 6.8 16 6.3 14.2 6.2Q12 7.2 9.8 6.2Z\"/></g><path class=\"m-ln\" d=\"M12 7.5V20M9.2 8.6Q10.4 10 10.6 12M14.8 8.6Q13.6 10 13.4 12\"/><g class=\"m-hl\"><path d=\"M7.9 10.2Q9.7 9.6 11.5 10.5L11.5 15.8Q9.6 15.6 8.3 14.4Z M16.1 10.2Q14.3 9.6 12.5 10.5L12.5 15.8Q14.4 15.6 15.7 14.4Z\"/></g>",
"ombros": "<g class=\"m-sil\"><ellipse cx=\"12\" cy=\"3.3\" rx=\"2\" ry=\"2.2\"/><path d=\"M9.8 6.2C8 6.3 6.3 6.8 5.4 8C4.7 9 4.5 10.5 4.4 12L3.9 17.3Q4 18.3 4.9 18.2L6 12.8L6.7 10.6L7.9 15.5L8.6 21.8H15.4L16.1 15.5L17.3 10.6L18 12.8L19.1 18.2Q20 18.3 20.1 17.3L19.6 12C19.5 10.5 19.3 9 18.6 8C17.7 6.8 16 6.3 14.2 6.2Q12 7.2 9.8 6.2Z\"/></g><g class=\"m-hl\"><path d=\"M5.7 8.2C6.3 7.1 7.6 6.7 8.7 6.6L8 9.7Q6.6 9.8 5.4 10.4Z M18.3 8.2C17.7 7.1 16.4 6.7 15.3 6.6L16 9.7Q17.4 9.8 18.6 10.4Z\"/></g>",
"biceps": "<g class=\"m-sil\"><ellipse cx=\"12\" cy=\"3.3\" rx=\"2\" ry=\"2.2\"/><path d=\"M9.8 6.2C8 6.3 6.3 6.8 5.4 8C4.7 9 4.5 10.5 4.4 12L3.9 17.3Q4 18.3 4.9 18.2L6 12.8L6.7 10.6L7.9 15.5L8.6 21.8H15.4L16.1 15.5L17.3 10.6L18 12.8L19.1 18.2Q20 18.3 20.1 17.3L19.6 12C19.5 10.5 19.3 9 18.6 8C17.7 6.8 16 6.3 14.2 6.2Q12 7.2 9.8 6.2Z\"/></g><g class=\"m-hl\"><path d=\"M4.8 10.2Q5.6 9.3 6.6 9.9L6.3 12.7Q5.4 13.4 4.5 12.9Z M19.2 10.2Q18.4 9.3 17.4 9.9L17.7 12.7Q18.6 13.4 19.5 12.9Z\"/></g>",
"triceps": "<g class=\"m-sil\"><ellipse cx=\"12\" cy=\"3.3\" rx=\"2\" ry=\"2.2\"/><path d=\"M9.8 6.2C8 6.3 6.3 6.8 5.4 8C4.7 9 4.5 10.5 4.4 12L3.9 17.3Q4 18.3 4.9 18.2L6 12.8L6.7 10.6L7.9 15.5L8.6 21.8H15.4L16.1 15.5L17.3 10.6L18 12.8L19.1 18.2Q20 18.3 20.1 17.3L19.6 12C19.5 10.5 19.3 9 18.6 8C17.7 6.8 16 6.3 14.2 6.2Q12 7.2 9.8 6.2Z\"/></g><path class=\"m-ln\" d=\"M12 7.5V20M9.2 8.6Q10.4 10 10.6 12M14.8 8.6Q13.6 10 13.4 12\"/><g class=\"m-hl\"><path d=\"M4.6 10Q5 9.2 6 9.3L6.6 10.3L6.3 12.9Q5.3 13.3 4.5 12.6Z M19.4 10Q19 9.2 18 9.3L17.4 10.3L17.7 12.9Q18.7 13.3 19.5 12.6Z\"/></g>",
"antebracos": "<g class=\"m-sil\"><ellipse cx=\"12\" cy=\"3.3\" rx=\"2\" ry=\"2.2\"/><path d=\"M9.8 6.2C8 6.3 6.3 6.8 5.4 8C4.7 9 4.5 10.5 4.4 12L3.9 17.3Q4 18.3 4.9 18.2L6 12.8L6.7 10.6L7.9 15.5L8.6 21.8H15.4L16.1 15.5L17.3 10.6L18 12.8L19.1 18.2Q20 18.3 20.1 17.3L19.6 12C19.5 10.5 19.3 9 18.6 8C17.7 6.8 16 6.3 14.2 6.2Q12 7.2 9.8 6.2Z\"/></g><g class=\"m-hl\"><path d=\"M4.4 13.4L5.9 13.2L4.95 17.9L4.05 17.5Z M19.6 13.4L18.1 13.2L19.05 17.9L19.95 17.5Z\"/></g>",
"abdomen": "<g class=\"m-sil\"><ellipse cx=\"12\" cy=\"3.3\" rx=\"2\" ry=\"2.2\"/><path d=\"M9.8 6.2C8 6.3 6.3 6.8 5.4 8C4.7 9 4.5 10.5 4.4 12L3.9 17.3Q4 18.3 4.9 18.2L6 12.8L6.7 10.6L7.9 15.5L8.6 21.8H15.4L16.1 15.5L17.3 10.6L18 12.8L19.1 18.2Q20 18.3 20.1 17.3L19.6 12C19.5 10.5 19.3 9 18.6 8C17.7 6.8 16 6.3 14.2 6.2Q12 7.2 9.8 6.2Z\"/></g><g class=\"m-hl\"><rect x=\"10.25\" y=\"12.4\" width=\"1.45\" height=\"1.5\" rx=\".45\"/><rect x=\"10.25\" y=\"14.2\" width=\"1.45\" height=\"1.5\" rx=\".45\"/><rect x=\"10.25\" y=\"16\" width=\"1.45\" height=\"1.5\" rx=\".45\"/><rect x=\"12.35\" y=\"12.4\" width=\"1.45\" height=\"1.5\" rx=\".45\"/><rect x=\"12.35\" y=\"14.2\" width=\"1.45\" height=\"1.5\" rx=\".45\"/><rect x=\"12.35\" y=\"16\" width=\"1.45\" height=\"1.5\" rx=\".45\"/></g>",
"trapezio": "<g class=\"m-sil\"><ellipse cx=\"12\" cy=\"3.3\" rx=\"2\" ry=\"2.2\"/><path d=\"M9.8 6.2C8 6.3 6.3 6.8 5.4 8C4.7 9 4.5 10.5 4.4 12L3.9 17.3Q4 18.3 4.9 18.2L6 12.8L6.7 10.6L7.9 15.5L8.6 21.8H15.4L16.1 15.5L17.3 10.6L18 12.8L19.1 18.2Q20 18.3 20.1 17.3L19.6 12C19.5 10.5 19.3 9 18.6 8C17.7 6.8 16 6.3 14.2 6.2Q12 7.2 9.8 6.2Z\"/></g><path class=\"m-ln\" d=\"M12 7.5V20M9.2 8.6Q10.4 10 10.6 12M14.8 8.6Q13.6 10 13.4 12\"/><g class=\"m-hl\"><path d=\"M9.6 6.5Q12 5.5 14.4 6.5L13.1 9.2L12 11.6L10.9 9.2Z\"/></g>",
"quadriceps": "<g class=\"m-sil\"><path d=\"M7 2.5H17L17.6 7Q17.8 9 17 12.5L16.6 14.2Q17 17 16.4 20.4L16.8 21.6Q16.8 22.3 16 22.3H13.9L13.8 21L13.4 14.2L12.6 9H11.4L10.6 14.2L10.2 21L10.1 22.3H8Q7.2 22.3 7.2 21.6L7.6 20.4Q7 17 7.4 14.2L7 12.5Q6.2 9 6.4 7Z\"/></g><g class=\"m-hl\"><path d=\"M7 4.8Q9 4.4 11.4 6.2L11.6 9.2L10.8 13.4Q9 13.9 7.6 13Q6.7 9.4 7 4.8Z M17 4.8Q15 4.4 12.6 6.2L12.4 9.2L13.2 13.4Q15 13.9 16.4 13Q17.3 9.4 17 4.8Z\"/></g>",
"posteriores": "<g class=\"m-sil\"><path d=\"M7 2.5H17L17.6 7Q17.8 9 17 12.5L16.6 14.2Q17 17 16.4 20.4L16.8 21.6Q16.8 22.3 16 22.3H13.9L13.8 21L13.4 14.2L12.6 9H11.4L10.6 14.2L10.2 21L10.1 22.3H8Q7.2 22.3 7.2 21.6L7.6 20.4Q7 17 7.4 14.2L7 12.5Q6.2 9 6.4 7Z\"/></g><path class=\"m-ln\" d=\"M12 2.8V6.6\"/><g class=\"m-hl\"><path d=\"M7.1 8.4Q9.2 8 11.4 8.8L10.9 13.4Q9 13.9 7.6 13Q7 10.8 7.1 8.4Z M16.9 8.4Q14.8 8 12.6 8.8L13.1 13.4Q15 13.9 16.4 13Q17 10.8 16.9 8.4Z\"/></g>",
"gluteos": "<g class=\"m-sil\"><path d=\"M7 2.5H17L17.6 7Q17.8 9 17 12.5L16.6 14.2Q17 17 16.4 20.4L16.8 21.6Q16.8 22.3 16 22.3H13.9L13.8 21L13.4 14.2L12.6 9H11.4L10.6 14.2L10.2 21L10.1 22.3H8Q7.2 22.3 7.2 21.6L7.6 20.4Q7 17 7.4 14.2L7 12.5Q6.2 9 6.4 7Z\"/></g><path class=\"m-ln\" d=\"M12 2.8V6.6\"/><g class=\"m-hl\"><path d=\"M7.1 3.2Q9.6 2.8 11.8 3.4L11.8 6.8Q11 8.5 9.2 8.4Q7.2 8.2 6.8 6.6Z M16.9 3.2Q14.4 2.8 12.2 3.4L12.2 6.8Q13 8.5 14.8 8.4Q16.8 8.2 17.2 6.6Z\"/></g>",
"panturrilhas": "<g class=\"m-sil\"><path d=\"M7 2.5H17L17.6 7Q17.8 9 17 12.5L16.6 14.2Q17 17 16.4 20.4L16.8 21.6Q16.8 22.3 16 22.3H13.9L13.8 21L13.4 14.2L12.6 9H11.4L10.6 14.2L10.2 21L10.1 22.3H8Q7.2 22.3 7.2 21.6L7.6 20.4Q7 17 7.4 14.2L7 12.5Q6.2 9 6.4 7Z\"/></g><path class=\"m-ln\" d=\"M12 2.8V6.6\"/><g class=\"m-hl\"><path d=\"M7.6 14.8Q9.3 14.1 10.6 14.7L10.4 18.8Q9 19.7 7.8 18.6Q7.2 16.8 7.6 14.8Z M16.4 14.8Q14.7 14.1 13.4 14.7L13.6 18.8Q15 19.7 16.2 18.6Q16.8 16.8 16.4 14.8Z\"/></g>"
};
const TROPHY_GLYPH = {
"uturn": "<path d=\"M7 20V10a5 5 0 0 1 10 0v4\"/><path d=\"M13.5 11.5L17 15l3.5-3.5\"/>",
"calseg": "<rect x=\"4\" y=\"5.5\" width=\"16\" height=\"14.5\" rx=\"2\"/><path d=\"M4 10h16M8.5 3.5v4M15.5 3.5v4\"/><text x=\"12\" y=\"17.6\" class=\"tg-t\" font-size=\"6\">SEG</text>",
"sunrise": "<path d=\"M3 18h18M6 21h12M7.5 18a4.5 4.5 0 0 1 9 0M12 7.5v3M5.6 11.3l1.8 1.5M18.4 11.3l-1.8 1.5M9.5 4.5L12 2l2.5 2.5\"/>",
"owl": "<path d=\"M6 7l1.6 2.2M18 7l-1.6 2.2M6.5 9.5C6.5 6.8 9 5.5 12 5.5s5.5 1.3 5.5 4V15c0 3.3-2.5 5.5-5.5 5.5S6.5 18.3 6.5 15z\"/><circle cx=\"9.6\" cy=\"10.6\" r=\"1.9\"/><circle cx=\"14.4\" cy=\"10.6\" r=\"1.9\"/><path d=\"M11.2 13.2L12 14.4l.8-1.2M9.5 17.2l1 1M14.5 17.2l-1 1\"/>",
"sofa": "<path d=\"M5 11V8.5A2.5 2.5 0 0 1 7.5 6h9A2.5 2.5 0 0 1 19 8.5V11\"/><path d=\"M3 12.5a1.8 1.8 0 0 1 3.6 0V14h10.8v-1.5a1.8 1.8 0 0 1 3.6 0V18H3z\"/><path d=\"M5 18v2M19 18v2\"/>",
"rain": "<path d=\"M7 14.5a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 5.5a4 4 0 0 1 .5 9\"/><path d=\"M9 17.5l-1 2.5M13 17.5l-1 2.5M17 17.5l-1 2.5\"/>",
"steps": "<path d=\"M3 19h4v-4h4v-4h4V7h4V3\"/><path d=\"M15.5 3H19v3.5\"/>",
"lotus": "<path d=\"M12 6c-2 2.2-2.8 4.4-2.8 6.6 0 2 1.2 3.6 2.8 4.6 1.6-1 2.8-2.6 2.8-4.6C14.8 10.4 14 8.2 12 6z\"/><path d=\"M9.3 11.4C7 10.4 4.8 10.6 3 11.6c.8 3.4 3.8 5.6 9 5.6M14.7 11.4c2.3-1 4.5-.8 6.3.2-.8 3.4-3.8 5.6-9 5.6M5 20.5h14\"/>",
"hourglass": "<path d=\"M6.5 3h11M6.5 21h11M8 3c0 4 3 5.5 4 9-1 3.5-4 5-4 9M16 3c0 4-3 5.5-4 9 1 3.5 4 5 4 9\"/><path d=\"M10 18.5h4\"/>",
"bolt": "<path d=\"M13 3L5.5 13.5H11L10 21l7.5-10.5H12L13 3z\"/>",
"digital": "<rect x=\"2.5\" y=\"6\" width=\"19\" height=\"12\" rx=\"2.5\"/><text x=\"12\" y=\"14.3\" class=\"tg-t\" font-size=\"6.2\" letter-spacing=\"-.2\">11:11</text>",
"pumpkin": "<path d=\"M12 7c-1-2-.5-3.5 1-4.5\"/><path d=\"M12 7.5c-4.5-1.4-8.5 1.2-8.5 6s3.6 6.5 8.5 6.5 8.5-1.7 8.5-6.5-4-7.4-8.5-6z\"/><path d=\"M8.6 7.9C7.3 10 7.3 16 9 19.6M15.4 7.9C16.7 10 16.7 16 15 19.6\"/>",
"fireworks": "<path d=\"M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8\"/><circle cx=\"12\" cy=\"12\" r=\"1.6\"/>",
"cake": "<path d=\"M4 20h16M5 20v-6.5a1.5 1.5 0 0 1 1.5-1.5h11a1.5 1.5 0 0 1 1.5 1.5V20\"/><path d=\"M5 15.5c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0 2.3 1 3.5 0 2.3-1 3.5 0M9 12V9M15 12V9M12 12V8\"/><path d=\"M12 4.5c.8.9.8 1.8 0 2.4-.8-.6-.8-1.5 0-2.4z\"/>",
"cal1": "<rect x=\"4\" y=\"5.5\" width=\"16\" height=\"14.5\" rx=\"2\"/><path d=\"M4 10h16M8.5 3.5v4M15.5 3.5v4\"/><text x=\"12\" y=\"18\" class=\"tg-t\" font-size=\"7.5\">1º</text>",
"double": "<path d=\"M3.5 9.5v5M6 8v8M6 12h5M11 8v8M13.5 9.5v5\"/><circle cx=\"18.5\" cy=\"6.5\" r=\"1.6\"/><path d=\"M15.5 20l2-4-1.6-1.6 1.6-3 2.4 1.4 1.6 1.7\"/>",
"clover": "<path d=\"M12 12c-3.5 0-5.5-1.6-5.5-3.8S8.2 5 9.6 5.2C10.8 5.4 12 6.6 12 8.5c0-1.9 1.2-3.1 2.4-3.3 1.4-.2 3.1 1 3.1 3S15.5 12 12 12zM12 12c0 3.5-1.6 5.5-3.8 5.5S5 15.8 5.2 14.4C5.4 13.2 6.6 12 8.5 12M12 12c0 3.5 1.6 5.5 3.8 5.5s3.2-1.7 3-3.1c-.2-1.2-1.4-2.4-3.3-2.4\"/><path d=\"M12 12c1 3 2.5 5.5 4.5 8.5\"/>",
"tree": "<path d=\"M12 3l1 2.2 2.3.2-1.8 1.5.6 2.2-2.1-1.2-2.1 1.2.6-2.2-1.8-1.5 2.3-.2z\"/><path d=\"M12 9l-4 5h2.2L7 18.5h10L13.8 14H16z\"/><path d=\"M12 18.5V21\"/>",
"juggle": "<circle cx=\"12\" cy=\"5.5\" r=\"2.4\"/><circle cx=\"5.5\" cy=\"16.5\" r=\"2.4\"/><circle cx=\"18.5\" cy=\"16.5\" r=\"2.4\"/><path d=\"M9.8 7l-2.6 7.2M14.2 7l2.6 7.2M8 16.5h8\"/>",
"star": "<path d=\"M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.8z\"/>",
"target": "<circle cx=\"12\" cy=\"12\" r=\"8\"/><circle cx=\"12\" cy=\"12\" r=\"4.5\"/><circle cx=\"12\" cy=\"12\" r=\"1.2\"/>",
"flame": "<path d=\"M12 3c.8 3 4.5 4.8 4.5 9a4.5 4.5 0 0 1-9 0c0-1.8.8-3 1.8-4 .3 1.2 1 1.8 1.7 2 .2-2 .3-4.5 1-7z\"/>",
"dumbbell": "<path d=\"M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11\"/>",
"crown": "<path d=\"M4 8l4 4 4-7 4 7 4-4-1.5 10h-13L4 8z\"/><path d=\"M6 20.5h12\"/>",
"prup": "<path d=\"M4 20h16M7 20V10M17 20v-6M12 20V5M9 8l3-3 3 3\"/>",
"shoe": "<path d=\"M3 16c0-3 2-4 4-5l3-5 3 3c1 1 3 2 5 2.5 1.5.4 2 1.4 2 2.5v2H3z\"/><path d=\"M3 19h18\"/>",
"road": "<path d=\"M8 21L10 3M16 21L14 3M12 6v2M12 11v2M12 16v2\"/>",
"flag": "<path d=\"M5 21V4M5 4h11l-2 4 2 4H5\"/>",
"ruler": "<path d=\"M3.5 15.5l12-12 5 5-12 12z\"/><path d=\"M9 9l2 2M12 6l1.5 1.5M6 12l1.5 1.5\"/>",
"stopwatch": "<circle cx=\"12\" cy=\"13.5\" r=\"7\"/><path d=\"M12 9.5v4l2.8 1.7M10 3h4M18.5 6.5l1.3-1.3\"/>",
"feet": "<path d=\"M8 3.5c1.7 0 2.6 2 2.6 4.4S9.8 12 8.2 12 5.6 10.4 5.6 8 6.3 3.5 8 3.5zM6.2 14h3.9l-.3 2.3a1.8 1.8 0 0 1-3.6 0zM16 8c1.7 0 2.4 2.2 2.4 4.5S17.6 16.5 16 16.5s-2.6-1.6-2.6-4S14.3 8 16 8zM14.1 18.5H18l-.3 1.9a1.8 1.8 0 0 1-3.6 0z\"/>",
"bike": "<circle cx=\"6\" cy=\"16\" r=\"3.5\"/><circle cx=\"18\" cy=\"16\" r=\"3.5\"/><path d=\"M6 16l4-8h5l3 8M10 8l3 8M9 6h3\"/>",
"gear": "<circle cx=\"12\" cy=\"12\" r=\"3.2\"/><path d=\"M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8\"/>",
"mountain": "<path d=\"M3 19l6-11 4 7 2-3 6 7H3z\"/><circle cx=\"12\" cy=\"17\" r=\"0\"/>",
"scaledn": "<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"3.5\"/><path d=\"M8.5 9.5a5 5 0 0 1 7 0M12 13V9.8\"/><path d=\"M12 14.5v4M10.2 16.8L12 18.6l1.8-1.8\"/>",
"scaleup": "<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"3.5\"/><path d=\"M8.5 9.5a5 5 0 0 1 7 0M12 13V9.8\"/><path d=\"M12 18.6v-4M10.2 16.3L12 14.5l1.8 1.8\"/>",
"medal": "<circle cx=\"12\" cy=\"14.5\" r=\"5.5\"/><path d=\"M8.5 3.5l3.5 5.5 3.5-5.5M12 12l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z\"/>",
"hundred": "<text x=\"12\" y=\"15.4\" class=\"tg-t\" font-size=\"10\">100</text><path d=\"M4 18.5h16\"/>"
};
const TROPHY_ICO = {"comeback":["uturn"],"monday":["calseg"],"early_bird":["sunrise"],"night_owl":["owl"],"weekend":["sofa"],"rain_check":["rain"],"consistent":["steps"],"century":["hundred"],"humble":["lotus"],"marathon_time":["hourglass"],"turbo":["bolt","15′"],"capicua":["digital"],"halloween":["pumpkin"],"newyear":["fireworks"],"bday_active":["cake"],"first_day":["cal1"],"double":["double"],"friday13":["clover"],"christmas":["tree"],"versatile":["juggle"],"first_workout":["star","1º"],"week_goal":["target"],"streak_3":["flame","3"],"streak_7":["flame","7"],"streak_14":["flame","14"],"streak_30":["flame","30"],"lift_10":["dumbbell","10"],"lift_25":["dumbbell","25"],"lift_50":["dumbbell","50"],"lift_100":["crown","100"],"first_pr":["prup","PR"],"pr_5":["prup","5"],"pr_20":["prup","20"],"run_1":["shoe","1º"],"run_10":["shoe","10"],"run_25":["shoe","25"],"run_50":["shoe","50"],"run_km_10":["road","10"],"run_km_50":["road","50"],"run_km_100":["road","100"],"run_km_500":["road","500"],"run_5k_run":["flag","5K"],"run_10k_run":["flag","10K"],"run_21k_run":["flag","21K"],"run_42k_run":["crown","42K"],"run_pr_distance":["ruler"],"run_pr_pace":["stopwatch"],"walk_1":["feet","1º"],"walk_10":["feet","10"],"walk_25":["feet","25"],"walk_km_10":["road","10"],"walk_km_50":["road","50"],"walk_km_100":["road","100"],"walk_3k":["flag","3K"],"walk_5k":["flag","5K"],"bike_1":["bike","1º"],"bike_10":["bike","10"],"bike_25":["mountain","25"],"bike_km_50":["road","50"],"bike_km_100":["road","100"],"bike_km_500":["road","500"],"bike_20k":["flag","20K"],"bike_50k":["flag","50K"],"weight_down_1":["scaledn","1"],"weight_down_3":["scaledn","3"],"weight_down_5":["scaledn","5"],"weight_down_10":["scaledn","10"],"weight_up_2":["scaleup","2"],"weight_up_5":["scaleup","5"],"weight_up_10":["scaleup","10"]};

// ---------- 1. ÍCONES ----------
const GRUPO_MUSCULO = { 'Peito':'peito', 'Costas':'costas', 'Ombro':'ombros', 'Ombros':'ombros', 'Bíceps':'biceps', 'Tríceps':'triceps', 'Pernas':'quadriceps', 'Quadríceps':'quadriceps', 'Posteriores':'posteriores', 'Glúteos':'gluteos', 'Panturrilha':'panturrilhas', 'Panturrilhas':'panturrilhas', 'Trapézio':'trapezio', 'Core':'abdomen', 'Abdômen':'abdomen', 'Antebraço':'antebracos', 'Antebraços':'antebracos' };
// o exercício pode ser mais específico que o grupo (ex.: Stiff → posteriores; Rosca Martelo → antebraço)
function musculoDoExercicio(ex, grupo){
  const t = mtNorm((ex && (ex.name+' '+(ex.sub||''))) || '');
  if(/posterior|isquio|flexora|stiff|terra romeno|good morning|nordic/.test(t)) return 'posteriores';
  if(/antebra|punho|farmer/.test(t)) return 'antebracos';
  if(/gluteo|hip thrust|elevacao pelvica|abducao|coice/.test(t) && grupo!=='Tríceps') return 'gluteos';
  if(/quadri|extensora|agacha|leg press|hack|afundo|bulgar|passada|avanco/.test(t)) return 'quadriceps';
  if(/panturr/.test(t)) return 'panturrilhas';
  if(/trapez|encolh/.test(t)) return 'trapezio';
  return GRUPO_MUSCULO[grupo] || 'abdomen';
}
function muscleIco(key, cls){
  const svg = MUSCLE_SVG[key] || MUSCLE_SVG.abdomen;
  return `<span class="mi-ico ${cls||''}" aria-hidden="true"><svg viewBox="0 0 24 24">${svg}</svg></span>`;
}
// Medalha desenhada: anel + glifo + rótulo. Cada conquista tem a sua.
function medalSvg(glyph, label, extra){
  const g = TROPHY_GLYPH[glyph] || TROPHY_GLYPH.medal;
  const yG = label ? 6.5 : 12;
  return `<svg viewBox="0 0 48 48">${extra||''}<circle class="tb-ring" cx="24" cy="24" r="22"/><circle class="tb-in" cx="24" cy="24" r="18.5"/><g class="tb-g" transform="translate(12 ${yG})">${g}</g>${label?`<text x="24" y="40.5" class="tb-l">${mtEsc(label)}</text>`:''}</svg>`;
}
function trophyIco(t, dim){
  if(!t) return '';
  const def = TROPHY_ICO[t.id] || ['medal'];
  const cat = t.secret ? 'secret' : (t.cat||'geral');
  return `<span class="tbadge ${cat}${dim?' dim':''}" role="img" aria-label="${mtEsc(t.name||'')}">${medalSvg(def[0], def[1])}</span>`;
}
function trophyIcoLocked(){
  return `<span class="tbadge lock" role="img" aria-label="Conquista secreta">${medalSvg('lock')}</span>`;
}
TROPHY_GLYPH.lock = '<rect x="6" y="10.5" width="12" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.2v2.2"/>';

// ---------- 2. BIBLIOTECA ----------
// Ficha técnica por padrão de movimento: cobre os 120+ exercícios sem texto genérico.
// Ordem importa: o primeiro padrão que casar com o nome vence.
const EX_FICHAS = [
  { re:/supino|press (de|no) peito|chest press|maquina \(hammer\)|supino na maquina/, m:'Peitoral maior, deltoide anterior e tríceps',
    ex:['Deite com os pés firmes no chão e as escápulas encaixadas para trás e para baixo.','Desça o peso controlado até a altura do meio do peito, cotovelos a cerca de 45–60° do tronco.','Empurre de volta sem tirar o quadril do banco e sem travar os cotovelos lá em cima.'],
    d:['Mantenha o punho alinhado com o antebraço.','No inclinado, o banco a 30–45° já é suficiente para enfatizar a parte superior.'], e:'Cotovelos muito abertos (90°) e ombros saindo do banco — sobrecarregam o ombro.' },
  { re:/crucifixo inverso|reverse fly|voador inverso|face pull/, m:'Deltoide posterior, romboides e trapézio médio',
    ex:['Comece com os braços estendidos à frente, cotovelos levemente flexionados.','Abra os braços puxando com a parte de trás do ombro até a linha do corpo.','Volte devagar, sem deixar o peso “cair”.'], d:['Use carga leve: o deltoide posterior é um músculo pequeno.','No face pull, puxe a corda em direção ao rosto separando as mãos.'], e:'Encolher os ombros e transformar o movimento em uma remada.' },
  { re:/crucifixo|peck deck|voador|crossover|fly/, m:'Peitoral maior (ênfase na adução) e deltoide anterior',
    ex:['Mantenha os cotovelos levemente flexionados durante todo o movimento.','Abra os braços em arco até sentir o alongamento do peito, sem passar da linha dos ombros.','Feche “abraçando” e segure meio segundo na contração.'], d:['O crossover alto enfatiza a parte inferior do peito; o baixo, a superior.'], e:'Dobrar e esticar os cotovelos, virando um supino.' },
  { re:/flexao|push-?up/, m:'Peitoral, tríceps, deltoide anterior e core',
    ex:['Mãos um pouco mais abertas que os ombros, corpo em linha reta da cabeça ao calcanhar.','Desça até o peito quase tocar o chão, cotovelos apontando para trás em diagonal.','Empurre o chão mantendo o abdômen contraído.'], d:['Se ainda não consegue com boa forma, apoie os joelhos ou as mãos num banco.'], e:'Quadril caindo ou empinado.' },
  { re:/pullover/, m:'Grande dorsal, peitoral e serrátil anterior',
    ex:['Deite com o halter seguro acima do peito, braços quase estendidos.','Leve o peso para trás da cabeça em arco até sentir o alongamento.','Retorne ao ponto inicial usando o peito e as costas.'], d:['Mantenha o quadril baixo e o core ativo.'], e:'Dobrar muito os cotovelos e transformar em tríceps.' },
  { re:/puxada|pulldown|barra fixa|chin-?up|pull-?up/, m:'Grande dorsal, redondo maior, bíceps e romboides',
    ex:['Peito alto e leve inclinação do tronco para trás.','Puxe levando os cotovelos para baixo e para trás, como se fosse colocá-los no bolso.','Suba controlando até os braços quase estenderem, sem soltar a escápula de vez.'], d:['Pense em puxar com os cotovelos, não com as mãos.'], e:'Balançar o corpo e puxar a barra atrás da nuca.' },
  { re:/remada|row/, m:'Grande dorsal, romboides, trapézio médio e bíceps',
    ex:['Coluna neutra e abdômen firme; no curvado, tronco inclinado entre 30 e 45°.','Puxe o peso em direção ao abdômen aproximando as escápulas.','Estenda os braços devagar, sentindo as costas alongarem.'], d:['Segure meio segundo com as escápulas fechadas.'], e:'Arredondar a lombar ou usar impulso do quadril.' },
  { re:/terra|deadlift|stiff|good morning|levantamento/, m:'Posteriores de coxa, glúteos e eretores da coluna',
    ex:['Pés na largura do quadril, barra ou halteres próximos das pernas.','Leve o quadril para trás mantendo a coluna neutra e os joelhos levemente flexionados.','Suba contraindo glúteos e posteriores, sem hiperestender a lombar no final.'], d:['O peso desce colado ao corpo.','Pare a descida quando sentir o alongamento atrás da coxa — não force amplitude com a coluna.'], e:'Arredondar as costas para alcançar o chão.' },
  { re:/flexora|leg curl|nordic/, m:'Posteriores de coxa (isquiotibiais)',
    ex:['Ajuste o rolo logo acima do tornozelo e o joelho alinhado ao eixo da máquina.','Flexione os joelhos trazendo o rolo em direção ao glúteo.','Volte devagar, sem deixar a carga bater.'], d:['Mantenha o quadril colado no banco.'], e:'Levantar o quadril para ganhar impulso.' },
  { re:/extensora|leg extension/, m:'Quadríceps',
    ex:['Costas apoiadas e joelho alinhado com o eixo da máquina.','Estenda as pernas até quase travar e segure meio segundo.','Desça controlando em 2–3 segundos.'], d:['Ótimo para finalizar o treino de pernas com boa conexão muscular.'], e:'Chutar o peso e deixar a carga cair.' },
  { re:/agachamento|squat|hack|leg press|afundo|bulgar|passada|avanco|lunge|step/, m:'Quadríceps, glúteos e adutores; core como estabilizador',
    ex:['Pés firmes, peso distribuído no meio do pé e calcanhar.','Desça flexionando quadril e joelhos juntos, joelhos acompanhando a direção dos pés.','Suba empurrando o chão e mantendo o tronco firme.'], d:['Desça até onde consegue manter a coluna neutra e o calcanhar no chão.','No leg press, não tire o quadril do banco no fundo do movimento.'], e:'Joelhos caindo para dentro e calcanhar saindo do chão.' },
  { re:/elevacao pelvica|hip thrust|ponte|gluteo|abducao|coice|kickback/, m:'Glúteo máximo e médio; posteriores como auxiliares',
    ex:['Posicione-se com a coluna neutra e o abdômen firme.','Empurre com os calcanhares (ou a lateral do quadril, na abdução) até a contração máxima do glúteo.','Segure um segundo em cima e desça controlando.'], d:['No hip thrust, a canela fica vertical no topo do movimento.'], e:'Hiperestender a lombar no topo em vez de contrair o glúteo.' },
  { re:/panturrilha|gemeos|calf/, m:'Gastrocnêmio e sóleo',
    ex:['Apoie a ponta dos pés com o calcanhar livre.','Desça o calcanhar até alongar bem a panturrilha.','Suba o mais alto possível e segure um segundo.'], d:['Amplitude completa vale mais que carga alta. Sentado enfatiza o sóleo.'], e:'Movimento curto e rápido, “quicando”.' },
  { re:/desenvolvimento|press militar|overhead|arnold|pike/, m:'Deltoides (anterior e médio) e tríceps',
    ex:['Tronco firme, glúteos e abdômen contraídos.','Empurre o peso acima da cabeça até quase estender os cotovelos.','Desça até a altura das orelhas ou do queixo, controlando.'], d:['Se sentir o ombro, use pegada neutra ou reduza a amplitude.'], e:'Arquear demais a lombar para empurrar.' },
  { re:/elevacao lateral|lateral raise/, m:'Deltoide médio',
    ex:['Cotovelos levemente flexionados e tronco estável.','Eleve os braços pelas laterais até a altura dos ombros.','Desça devagar, sem relaxar no fim.'], d:['Imagine que está levando os cotovelos para longe, não as mãos para cima.'], e:'Subir com impulso do tronco e encolher o trapézio.' },
  { re:/elevacao frontal|front raise/, m:'Deltoide anterior',
    ex:['Pegada firme e tronco imóvel.','Eleve o peso à frente até a altura dos ombros.','Desça controlando.'], d:['Costuma ser bem trabalhado nos supinos — volume moderado já basta.'], e:'Balançar o corpo.' },
  { re:/encolhimento|shrug/, m:'Trapézio superior',
    ex:['Braços estendidos ao lado do corpo.','Eleve os ombros em direção às orelhas, em linha reta.','Segure um segundo e desça devagar.'], d:['Sem girar os ombros: o movimento é para cima e para baixo.'], e:'Dobrar os cotovelos para ajudar.' },
  { re:/rosca martelo|hammer curl|rosca inversa/, m:'Braquial, braquiorradial (antebraço) e bíceps',
    ex:['Pegada neutra (palmas uma de frente para a outra).','Flexione os cotovelos sem mover os braços para a frente.','Desça até quase estender os braços.'], d:['Ótima para dar espessura ao braço e força de pegada.'], e:'Balançar o tronco.' },
  { re:/rosca|curl|chin/, m:'Bíceps braquial e braquial',
    ex:['Cotovelos colados ao lado do corpo durante todo o movimento.','Suba o peso contraindo o bíceps, sem levar o cotovelo à frente.','Desça em 2–3 segundos até quase estender.'], d:['Na rosca Scott e na concentrada o roubo fica quase impossível — boa para técnica.'], e:'Usar impulso do quadril e encurtar a descida.' },
  { re:/triceps|testa|frances|mergulho|paralela|coice com|fechada|diamante|extensao de triceps/, m:'Tríceps braquial (as três cabeças)',
    ex:['Cotovelos fixos — só o antebraço se move (exceto no mergulho e no supino fechado).','Estenda os braços completamente, contraindo o tríceps.','Volte devagar até um bom alongamento.'], d:['Exercícios acima da cabeça (francês, extensão na polia) enfatizam a cabeça longa.'], e:'Abrir os cotovelos e usar o ombro para empurrar.' },
  { re:/prancha|plank|dead bug|bird dog|hollow/, m:'Reto e transverso do abdômen, oblíquos e glúteos',
    ex:['Corpo alinhado, quadril na altura dos ombros.','Contraia abdômen e glúteos como se fosse levar um soco na barriga.','Respire de forma controlada mantendo a posição.'], d:['Qualidade vale mais que tempo: pare quando a postura cair.'], e:'Quadril caindo e lombar arqueada.' },
  { re:/abdominal|crunch|elevacao de pernas|russian|canivete|oblíquo|obliquo|roda|ab wheel|core/, m:'Reto do abdômen e oblíquos',
    ex:['Lombar estável e queixo levemente recolhido.','Contraia o abdômen aproximando costelas e quadril.','Volte devagar, sem relaxar completamente.'], d:['Expire durante a contração.'], e:'Puxar o pescoço com as mãos.' }
];
function fichaExercicio(ex, grupo){
  const t = mtNorm(ex.name + ' ' + (ex.sub||''));
  const f = EX_FICHAS.find(x=>x.re.test(t));
  if(f) return f;
  return { m: ex.sub || grupo, ex:['Ajuste o equipamento ao seu corpo antes de começar.','Faça o movimento completo e controlado, sem impulso.','Mantenha a respiração constante: solte o ar no esforço.'], d:['Comece com uma carga em que você consiga fazer todas as repetições com boa técnica.'], e:'Trocar técnica por carga.' };
}
const EQUIP_LBL = { academia:'Academia', halteres:'Halteres', casa:'Peso do corpo' };
let libEquip = 'todos';
function exPorNome(nome){ const n = mtNorm(nome); for(const c of EX_BANK){ const it = c.items.find(x=>mtNorm(x.name)===n); if(it) return {ex:it, grupo:c.name}; } return null; }
function userEquip(){ return (state.modules.lift && state.modules.lift.setup && state.modules.lift.setup.equip) || 'academia'; }
function setLibEquip(e){ libEquip = e; renderLibrary(); }
function renderLibrary(){
  const chipsEl = $('lib-chips'); if(!chipsEl) return;
  const grupos = ['Todos', ...EX_BANK.map(c=>c.name)];
  chipsEl.innerHTML = grupos.map(g=>`<div class="filter-chip ${g===libFilter?'on':''}" onclick="setLibFilter('${mtJsStr(g)}')">${g==='Todos'?'':muscleIco(GRUPO_MUSCULO[g]||'abdomen')}${mtEsc(g)}</div>`).join('');
  const eqEl = $('lib-equip');
  if(eqEl) eqEl.innerHTML = [['todos','Todos os equipamentos'],['academia','Academia'],['halteres','Halteres'],['casa','Peso do corpo']]
    .map(([k,l])=>`<div class="filter-chip ${k===libEquip?'on':''}" onclick="setLibEquip('${k}')">${l}</div>`).join('');
  const q = mtNorm(($('lib-search')||{}).value||'').trim();
  const termos = q.split(/\s+/).filter(Boolean);
  // quem treina em academia não vê, por padrão, as adaptações com objetos de casa (garrafa, toalha, mochila)
  const mostrarImprov = libEquip==='casa' || userEquip()==='casa';
  const cats = libFilter==='Todos' ? EX_BANK : EX_BANK.filter(c=>c.name===libFilter);
  let total = 0, html = '';
  cats.forEach(cat=>{
    const items = cat.items.filter(x=>{
      if(x.improv && !mostrarImprov) return false;
      if(libEquip!=='todos' && !(x.equip||[]).includes(libEquip)) return false;
      if(!termos.length) return true;
      const ficha = fichaExercicio(x, cat.name);
      const alvo = mtNorm([x.name, x.sub, cat.name, ficha.m, (x.equip||[]).map(e=>EQUIP_LBL[e]).join(' ')].join(' '));
      return termos.every(t=>alvo.includes(t));
    });
    if(!items.length) return;
    total += items.length;
    html += `<div class="lx-cat">${muscleIco(GRUPO_MUSCULO[cat.name]||'abdomen')}<div><b>${mtEsc(cat.name)}</b><small>${items.length} exercício${items.length>1?'s':''}</small></div></div>`;
    html += items.map(ex=>{
      const temVideo = !!(videoLinks && videoLinks[slug(ex.name)]);
      const tags = (ex.equip||[]).filter(e=>EQUIP_LBL[e]).map(e=>`<span class="lx-tag">${EQUIP_LBL[e]}</span>`).join('') + (temVideo?'<span class="lx-tag v">▶ vídeo</span>':'');
      const cred = temVideo ? creditosHtml(slug(ex.name), 'biblioteca') : '';
      return `<div class="lx-item" onclick="openExercise('${mtJsStr(ex.name)}')">${muscleIco(musculoDoExercicio(ex, cat.name))}<div class="lx-info"><div class="lx-name">${mtEsc(ex.name)}</div><div class="lx-sub">${mtEsc(ex.sub||'')}</div><div class="lx-tags">${tags}</div>${cred}</div><span class="lx-go">›</span></div>`;
    }).join('');
  });
  const totalCat = EX_BANK.reduce((s,c)=>s+c.items.length,0);
  const cnt = $('lib-count'); if(cnt) cnt.textContent = (termos.length || libFilter!=='Todos' || libEquip!=='todos') ? `${total} de ${totalCat} exercícios` : `Catálogo completo · ${totalCat} exercícios`;
  $('lib-list').innerHTML = html || `<div class="lx-empty">Nenhum exercício encontrado${q?` para “${mtEsc(q)}”`:''}.<br><span style="font-size:12px;color:var(--text-mute)">Tente outro termo ou limpe os filtros.</span></div>`;
}

// ---------- Beta 34: créditos do vídeo (parceiros) ----------
// O documento do vídeo guarda SÓ o que o administrador liberou para cada lugar (ficha e Biblioteca).
// Os dados completos do parceiro (inclusive contato privado) ficam em "parceiros", só para admins.
function _fmtFone(d){ d = String(d||'').replace(/\D/g,''); if(d.length===13 && d.startsWith('55')) d = d.slice(2);
  return d.length===11 ? `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}` : d.length===10 ? `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}` : d; }
function _waLink(d){ d = String(d||'').replace(/\D/g,''); if(!d) return ''; if(d.length<=11) d = '55' + d; return 'https://wa.me/' + d; }
function creditosHtml(k, onde){
  const c = (typeof videoCreditos==='object' && videoCreditos) ? videoCreditos[k] : null;
  if(!c || !c.nome) return '';
  const o = c[onde]; if(!o || typeof o !== 'object') return '';
  const nome = mtEsc(c.nome) + (o.empresa ? ` · ${mtEsc(o.empresa)}` : '');
  if(onde === 'biblioteca'){
    const ig = o.instagram ? ` · @${mtEsc(String(o.instagram).replace(/^@/,''))}` : '';
    return `<div class="lx-cred">🎥 Vídeo: ${nome}${ig}</div>`;
  }
  const linhas = [];
  if(o.texto) linhas.push(`<span class="vc-l">${mtEsc(o.texto)}</span>`);
  if(o.instagram){ const h = String(o.instagram).replace(/^@/,''); linhas.push(`<span class="vc-l">Instagram: <a href="https://instagram.com/${encodeURIComponent(h)}" target="_blank" rel="noopener">@${mtEsc(h)}</a></span>`); }
  if(o.contato) linhas.push(`<span class="vc-l">Contato profissional: <a href="${mtEsc(_waLink(o.contato))}" target="_blank" rel="noopener">${mtEsc(_fmtFone(o.contato))}</a></span>`);
  if(o.site && /^https?:\/\//i.test(o.site)) linhas.push(`<span class="vc-l"><a href="${mtEsc(o.site)}" target="_blank" rel="noopener">${mtEsc(String(o.site).replace(/^https?:\/\/(www\.)?/i,'').replace(/\/$/,''))} ↗</a></span>`);
  return `<div class="vc-cred"><div class="vc-t">Conteúdo demonstrativo</div>Créditos: <b>${nome}</b>${linhas.join('')}</div>`;
}

// ---------- 3. FICHA DO EXERCÍCIO + PLAYER IMERSIVO ----------
function _videoDoExercicio(name, idKey){
  const k = idKey || slug(name);
  const url = videoLinks[k] || null;
  const id = url ? ytVideoId(url) : null;
  return { k, url, id, vertical: !!(url && /\/shorts\//.test(String(url))), cred: videoCredits[k] || null };
}
function _palcoVideo(v){
  if(!v.id) return '';
  return `<div class="ex-stage ${v.vertical?'v':'h'}" id="ex-stage">
      <div class="ex-load" id="ex-load"><div class="ex-spin"></div><span>Carregando vídeo…</span></div>
      <div id="ex-yt"></div>
    </div>`;
}
// (mantidas por compatibilidade: o player agora é montado por mtMontarPlayer, em app-plus parte 12)
function exVideoOk(){ const s = $('ex-stage'); if(s) s.classList.add('ok'); clearTimeout(window.__exVidT); }
function exTelaCheia(){
  const s = $('ex-stage'); if(!s) return;
  const fn = s.requestFullscreen || s.webkitRequestFullscreen;
  if(fn){ try{ const r = fn.call(s); if(r && r.then) r.then(()=>{ try{ if(screen.orientation && screen.orientation.lock && !s.classList.contains('v')) screen.orientation.lock('landscape').catch(()=>{}); }catch(e){} }).catch(()=>{}); }catch(e){} }
}
document.addEventListener('fullscreenchange', ()=>{ if(!document.fullscreenElement){ try{ screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); }catch(e){} } });
// abre a ficha completa (biblioteca) ou só o vídeo em destaque (botão "ver como fazer" do treino)
function openExerciseSheet(name, idKey, opts){
  opts = opts || {};
  const achado = exPorNome(name);
  const ex = achado ? achado.ex : { name, sub:'' };
  const grupo = achado ? achado.grupo : '';
  const ficha = fichaExercicio(ex, grupo);
  const v = _videoDoExercicio(name, idKey);
  window.__exVidUrl = v.url;
  const info = v.cred ? socialInfo(v.cred) : null;
  const exId = slug(name);
  const temEvo = (typeof temEvolucaoEx==='function') && temEvolucaoEx(exId);
  const palco = v.id ? _palcoVideo(v)
    : exSemVideoHtml(ex, grupo, v);
  const mi = $('modal-inner');
  mi.classList.remove('modal-video','short'); mi.classList.add('modal-ex');
  $('modal-back').classList.add('ex-open');
  mi.innerHTML = `${palco}
    <div class="ex-scroll">
      <div class="ex-head"><div style="min-width:0"><h3>${mtEsc(ex.name)}</h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${grupo?`<span class="pill on">${mtEsc(grupo)}</span>`:''}${(ex.equip||[]).filter(e=>EQUIP_LBL[e]).map(e=>`<span class="pill">${EQUIP_LBL[e]}</span>`).join('')}</div></div>
        <button class="ex-x" onclick="closeModal()" aria-label="Fechar">✕</button></div>
      ${v.id?`<div class="ex-tools"><button class="btn btn-ghost" id="ex-som" onclick="mtAlternarSom()">${videoMudoPref()?'🔇 Sem som':'🔊 Com som'}</button><button class="btn btn-ghost" onclick="exTelaCheia()">⛶ Tela cheia</button>${mtAdmin()?`<a class="btn btn-ghost" href="${mtEsc(v.url)}" target="_blank" rel="noopener" title="Só administradores veem">YouTube ↗</a>`:''}${temEvo?`<button class="btn btn-ghost" onclick="closeModal();setTimeout(()=>openExProgress('${mtJsStr(exId)}'),80)">📈 Minha evolução</button>`:''}</div>`
        : (temEvo?`<div class="ex-tools"><button class="btn btn-ghost" onclick="closeModal();setTimeout(()=>openExProgress('${mtJsStr(exId)}'),80)">📈 Minha evolução</button></div>`:'')}
      <div class="ex-sec"><h4>Músculos trabalhados</h4><p>${mtEsc(ficha.m)}${ex.sub && !mtNorm(ficha.m).includes(mtNorm(ex.sub.split(/[(/]/)[0]).trim())?` · ênfase: ${mtEsc(ex.sub)}`:''}</p></div>
      <div class="ex-sec"><h4>Como executar</h4><ol>${ficha.ex.map(x=>`<li>${mtEsc(x)}</li>`).join('')}</ol></div>
      <div class="ex-sec"><h4>Dicas técnicas</h4><ul>${ficha.d.map(x=>`<li>${mtEsc(x)}</li>`).join('')}</ul></div>
      <div class="ex-sec"><h4>Erro comum</h4><p>${mtEsc(ficha.e)}</p></div>
      ${ex.improv?`<div class="note" style="margin-top:14px"><div class="note-line">Esta é uma adaptação para treinar em casa. Na academia, prefira a versão com equipamento.</div></div>`:''}
      ${/* Beta 34: créditos do vídeo no fim, depois das informações técnicas */ ''}${v.id && creditosHtml(v.k, 'ficha') ? creditosHtml(v.k, 'ficha') : (info?`<a class="ex-credit" href="${mtEsc(v.cred)}" target="_blank" rel="noopener">🎥 Demonstração por <b>${mtEsc(info.handle)}</b> <span>${info.icon}</span></a>`:'')}
      ${v.id?`<div style="text-align:center;margin-top:14px"><a href="#" onclick="mtReportarVideo('${mtJsStr(v.k)}','${mtJsStr(ex.name)}','manual');return false" style="font-size:12px;color:var(--text-mute)">O vídeo não abre ou está errado? Avisar o treinador</a></div>`:''}
      <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button>
    </div>`;
  $('modal-back').classList.add('on');
  if(v.id) mtMontarPlayer(v, {nome: ex.name, grupo, equip: ex.equip||[]});
}
function openExercise(name){ openExerciseSheet(name); }
// Sem vídeo: aviso discreto + busca no YouTube SÓ se o aluno tocar no botão. As instruções em texto
// continuam logo abaixo. Uma única função serve Treinos, Biblioteca e Meta Assistente.
function exBuscaYoutube(nome){ return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(String(nome||'').trim() + ' como fazer execução correta'); }
function exSemVideoHtml(ex, grupo, v){
  const outro = v && v.url && !v.id;   // o treinador cadastrou um link que não é vídeo do YouTube
  const href = outro ? v.url : exBuscaYoutube(ex.name);
  return `<div class="ex-noVideo">${muscleIco(musculoDoExercicio(ex, grupo))}
    <div class="exnv-t">Ainda não há vídeo disponível para este exercício.</div>
    <div class="exnv-s">${outro ? 'O treinador indicou uma demonstração fora do app. Ela abre em outra página.' : 'Se quiser ver uma demonstração, você será direcionado ao YouTube para buscar este exercício. As orientações estão logo abaixo.'}</div>
    <a class="btn btn-ghost exnv-b" href="${mtEsc(href)}" target="_blank" rel="noopener">${outro ? 'Abrir demonstração ↗' : 'Buscar vídeo no YouTube ↗'}</a></div>`;
}
// "Ver como fazer" (Treinos, assistente): abre sempre a ficha do exercício — com o vídeo quando existe,
// com o aviso e as instruções quando não existe. Nunca redireciona sozinho para o YouTube.
playExercise = function(name, idKey){
  const v = _videoDoExercicio(name, idKey);
  openExerciseSheet(name, idKey, v.id ? {video:true} : {});
};
const _closeModalOrig = closeModal;
closeModal = function(){
  const mi = $('modal-inner');
  const tinhaEx = mi && mi.classList.contains('modal-ex');
  if(tinhaEx){ try{ mtDestruirPlayer(); }catch(e){} const ifr = mi.querySelector('iframe'); if(ifr) ifr.src = 'about:blank'; mi.classList.remove('modal-ex'); clearTimeout(window.__exVidT); }
  if($('modal-back').classList.contains('ex-open')) $('modal-back').classList.remove('ex-open');
  if(document.fullscreenElement){ try{ document.exitFullscreen(); }catch(e){} }
  return _closeModalOrig.apply(this, arguments);
};

// fecha a ficha corretamente mesmo quando outro código fecha o modal "por fora"
(function(){
  const back = document.getElementById('modal-back'); if(!back || !window.MutationObserver) return;
  new MutationObserver(()=>{
    if(back.classList.contains('on')) return;
    if(back.classList.contains('ex-open')) back.classList.remove('ex-open');   // só mexe se precisar (senão o observer se realimenta)
    const mi = document.getElementById('modal-inner');
    if(mi && mi.classList.contains('modal-ex')){ try{ mtDestruirPlayer(); }catch(e){} const ifr = mi.querySelector('iframe'); if(ifr) ifr.src='about:blank'; mi.classList.remove('modal-ex'); }
  }).observe(back, {attributes:true, attributeFilter:['class']});
})();

// ---------- 4. FOTOS DE EVOLUÇÃO ----------
// Mantém a arquitetura atual (IndexedDB local, sem nuvem). O que muda:
// - cada miniatura tem o próprio botão de apagar (apaga SÓ aquela foto);
// - modo "Selecionar" para apagar várias escolhidas;
// - "Apagar todas" fica separado, com confirmação explícita digitando a palavra;
// - a exclusão é verificada: se o número de fotos restantes não bater, avisa.
const ICO_LIXO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7h15M9.5 3.5h5M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/></svg>';
let fotoSel = null;   // Set de ids quando o modo seleção está ligado
fotoApagarRec = async function(id){
  const db = await fotoDB();
  try{
    await new Promise((res,rej)=>{ const tx = db.transaction('fotos','readwrite'); tx.objectStore('fotos').delete(id); tx.oncomplete = ()=>res(); tx.onerror = ()=>rej(tx.error); tx.onabort = ()=>rej(tx.error); });
  } finally { try{ db.close(); }catch(e){} }
};
async function fotoApagarVarias(ids){
  const antes = (await fotoListar()).length;
  for(const id of ids) await fotoApagarRec(id);
  const depois = (await fotoListar()).length;
  if(antes - depois !== ids.length) throw new Error('contagem inesperada: '+antes+'→'+depois+' (esperado -'+ids.length+')');
}
openFotos = async function(pose){
  fotoLimpaURLs();
  let lista = [];
  try{ lista = await fotoListar(); }catch(e){ toast('Não consegui abrir as fotos neste aparelho'); return; }
  window.__fotoPose = pose || window.__fotoPose || 'todas';
  const filtro = window.__fotoPose === 'todas' ? lista : lista.filter(f=>f.pose===window.__fotoPose);
  const chips = [['todas','Todas'], ...Object.entries(FOTO_POSES)].map(([k,n])=>`<button type="button" class="nxchip ${k===window.__fotoPose?'on':''}" onclick="fotoSel=null;openFotos('${k}')">${n}</button>`).join('');
  // agrupa por mês
  const grupos = {};
  filtro.forEach(f=>{ const d = new Date(f.data); const k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); (grupos[k]=grupos[k]||[]).push(f); });
  const meses = Object.keys(grupos).sort().reverse();
  const nomeMes = k=>{ const [y,m] = k.split('-').map(Number); return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][m-1]+' '+y; };
  const sel = fotoSel;
  const tile = f=>`<div class="fg-tile${sel&&sel.has(f.id)?' sel':''}" style="background-image:url('${fotoURL(f)}')" onclick="${sel?`fotoToggleSel('${f.id}')`:`fotoVer('${f.id}')`}">
      <span class="fg-pose">${FOTO_POSES[f.pose]||''}</span>
      ${sel?'':`<button type="button" class="fg-del" aria-label="Apagar esta foto" onclick="event.stopPropagation();fotoApagarConfirma('${f.id}')">${ICO_LIXO}</button>`}
      <span class="fg-cap">${fotoDataTxt(f.data,true)}${f.peso?'<br>'+String(f.peso).replace('.',',')+' kg':''}</span></div>`;
  const grade = filtro.length ? meses.map(k=>`<div class="fg-month">${nomeMes(k)}</div><div class="fg-grid">${grupos[k].map(tile).join('')}</div>`).join('')
    : `<div class="text-dim" style="padding:22px 6px;text-align:center;font-size:13.5px;line-height:1.6">${lista.length?'Nenhuma foto nesta posição.':'Registre a primeira foto para começar a acompanhar sua evolução visual. Uma foto por mês, no mesmo local e com a mesma luz, já mostra bastante.'}</div>`;
  const barraSel = sel ? `<div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-ghost" style="flex:1" onclick="fotoSel=null;openFotos()">Cancelar</button>
      <button class="btn btn-primary" style="flex:1;${sel.size?'background:#ef4444!important;color:#fff!important':'opacity:.5'}" ${sel.size?'':'disabled'} onclick="fotoApagarSelConfirma()">Apagar ${sel.size||''} ${sel.size===1?'foto':'fotos'}</button></div>`
    : `<div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary" style="flex:1" onclick="fotoNova()">➕ Nova foto</button>
      <button class="btn btn-ghost" style="flex:1${lista.length<2?';opacity:.45':''}" onclick="openComparar()" ${lista.length<2?'disabled':''}>↔ Comparar</button></div>`;
  $('modal-inner').innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><h3 style="margin:0">📷 Fotos de evolução</h3>${lista.length&&!sel?`<button class="btn btn-ghost" style="padding:6px 11px;font-size:12px" onclick="fotoSel=new Set();openFotos()">Selecionar</button>`:''}</div>
    <p style="color:var(--text-mute);font-size:11.5px;line-height:1.5;margin:6px 0 10px">${sel?'Toque nas fotos que deseja apagar.':`${lista.length} foto${lista.length===1?'':'s'} · ficam só neste aparelho, não vão para nuvem. Se trocar de celular ou limpar os dados do site, elas somem — baixe as importantes.`}</p>
    <div class="nxchips" style="margin-bottom:6px">${chips}</div>
    <div style="max-height:50vh;overflow-y:auto;margin:0 -2px;padding:0 2px">${grade}</div>
    ${barraSel}
    ${lista.length&&!sel?`<button class="btn btn-ghost btn-block hl-danger" style="margin-top:14px;font-size:12px;padding:8px;border-top:1px solid var(--border)" onclick="fotoApagarTudoConfirma()">Apagar todas as fotos…</button>`:''}
    ${sel?'':`<button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="fotoLimpaURLs();closeModal()">Fechar</button>`}`;
  $('modal-back').classList.add('on');
};
function fotoToggleSel(id){ if(!fotoSel) return; fotoSel.has(id) ? fotoSel.delete(id) : fotoSel.add(id); openFotos(); }
function fotoApagarSelConfirma(){
  const ids = [...(fotoSel||[])]; if(!ids.length) return;
  appConfirm(`${ids.length===1?'A foto selecionada será apagada':'As '+ids.length+' fotos selecionadas serão apagadas'} deste aparelho. As outras continuam.`, async ()=>{
    try{ await fotoApagarVarias(ids); toast(ids.length===1?'Foto apagada':ids.length+' fotos apagadas'); }
    catch(e){ console.log(e); toast('⚠️ Algo não saiu como esperado. Confira a galeria.'); }
    fotoSel = null; openFotos();
  }, {title:'Apagar selecionadas?', emo:'🗑️', okLabel:'Apagar', danger:true, onCancel:()=>openFotos()});
}
fotoApagarConfirma = function(id){
  appConfirm('Só esta foto será apagada deste aparelho. As demais continuam salvas.', async ()=>{
    try{ await fotoApagarVarias([id]); toast('Foto apagada'); }
    catch(e){ console.log(e); toast('⚠️ Não consegui apagar essa foto. Tente de novo.'); }
    openFotos();
  }, {title:'Apagar esta foto?', emo:'🗑️', okLabel:'Apagar foto', danger:true, onCancel:()=>openFotos()});
};
fotoApagarTudoConfirma = async function(){
  let n = 0; try{ n = (await fotoListar()).length; }catch(e){}
  $('modal-inner').innerHTML = `<div style="text-align:center"><div style="font-size:40px">🗑️</div><h3 style="margin:8px 0 6px">Apagar TODAS as fotos?</h3>
    <p style="color:var(--text-dim);font-size:13.5px;line-height:1.5">Isso apaga as <b>${n}</b> fotos de evolução deste aparelho. Não dá para desfazer.<br>Para confirmar, digite <b>APAGAR</b>.</p></div>
    <input class="input" id="fd-conf" autocomplete="off" autocapitalize="characters" placeholder="APAGAR" style="text-align:center;margin-top:10px" oninput="document.getElementById('fd-ok').disabled = this.value.trim().toUpperCase()!=='APAGAR'">
    <button class="btn btn-primary btn-block" id="fd-ok" disabled style="margin-top:12px;background:#ef4444!important;color:#fff!important;box-shadow:none" onclick="fotoApagarTudoAgora()">Apagar todas</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openFotos()">Cancelar</button>`;
  $('modal-back').classList.add('on');
};
async function fotoApagarTudoAgora(){ try{ await fotoApagarTodas(); toast('Fotos apagadas'); }catch(e){ toast('Não consegui apagar agora'); } openFotos('todas'); }
const _fotoVerOrig = fotoVer;
fotoVer = async function(id){
  await _fotoVerOrig(id);
  const img = document.querySelector('#modal-inner img'); if(!img) return;
  img.classList.add('fv-img'); img.removeAttribute('style'); img.title = 'Toque para ampliar';
  img.onclick = ()=>{ const d = document.createElement('div'); d.className = 'fv-full'; d.innerHTML = `<img src="${img.src}" alt=""><button aria-label="Fechar">✕</button>`; d.onclick = ()=>d.remove(); document.body.appendChild(d); };
  const del = [...document.querySelectorAll('#modal-inner button')].find(b=>/Apagar/.test(b.textContent));
  if(del) del.textContent = '🗑️ Apagar só esta foto';
};

// ---------- 5. NAVEGAÇÃO ----------
mtGancho('renderSessions', { depois(){
  try{
    const ql = $('ql-lib'); if(ql) ql.style.display = state.modules.lift ? '' : 'none';
    const t = $('sessions-title'); if(t && /Sess/.test(t.textContent)) t.textContent = t.textContent.replace(/Sessões/,'Treinos');
  }catch(e){}
}});

// ---------- 6. APARÊNCIA ----------
const TEMAS_NOTURNOS = ['zepp','amoled','aurora','classico','oceano','rubi'];
function openAparencia(){
  const cur = currentTheme();
  const opt = k=>{ const t = THEMES[k], p = t.prev;
    return `<button type="button" class="ap-opt ${k===cur?'on':''}" onclick="setTheme('${k}');openAparencia()">
      <div class="ap-prev" style="background:${p.bg};${TEMAS_CLAROS.includes(k)?'border:1px solid '+p.c:''}"><b style="background:${p.a}"></b><i style="background:${p.a}"></i><i style="background:${p.b}"></i><i style="background:${p.c}"></i></div>
      <div class="ap-name"><span>${t.nome}</span>${k===cur?'<span style="color:var(--primary-2)">✓</span>':''}</div><small style="color:var(--text-mute);font-size:11px;margin-top:-4px">${t.sub}</small></button>`; };
  const sobrio = document.documentElement.classList.contains('sobrio');
  const pk = (typeof getPacote==='function') ? getPacote() : 'linha';
  const amostra = ['dumbbell','flame','trophy','calendar','heart'].map(n=>`<svg viewBox="0 0 24 24">${ICO_SVG[n]}</svg>`).join('');
  const pack = (k,nome,sub)=>`<div class="ap-pack ${k===pk?'on':''}" onclick="setPacote('${k}')"><div><b style="font-size:14px">${nome}</b>${k===pk?' <span style="color:var(--primary-2)">✓</span>':''}<div style="font-size:11.5px;color:var(--text-mute)">${sub}</div></div><div class="ap-sample ${k}">${amostra}</div></div>`;
  const deco = (typeof decoEnabled==='function') ? decoEnabled() : true;
  $('modal-inner').innerHTML = `<h3>Aparência</h3>
    <div class="mt-sec" style="margin-top:6px">Tema Noturno</div>
    <div class="ap-grid">${TEMAS_NOTURNOS.filter(k=>THEMES[k]).map(opt).join('')}</div>
    <div class="mt-sec">Tema Claro</div>
    <div class="ap-grid">${TEMAS_CLAROS.filter(k=>THEMES[k]).map(opt).join('')}</div>
    <div class="mt-sec">Ícones</div>
    <div class="mod-toggle" style="margin:0 0 10px">
      <button class="seg ${sobrio?'on':''}" style="font-size:12.5px;padding:9px 4px" onclick="${sobrio?'':"setEstiloIcones('sobrio')"}">Ícones de linha</button>
      <button class="seg ${!sobrio?'on':''}" style="font-size:12.5px;padding:9px 4px" onclick="${!sobrio?'':"setEstiloIcones('colorido')"}">Emojis coloridos</button>
    </div>
    ${sobrio ? pack('fina','Linha fina','Traço delicado e discreto') + pack('linha','Linha','Traço equilibrado e definido (padrão)') + pack('duo','Duotone','Contorno com preenchimento na cor do tema')
      : `<p class="mt-muted" style="margin:0 0 6px">Com emojis coloridos, os pacotes de ícones não se aplicam. <a href="#" onclick="openEmojiTone();return false" style="color:var(--primary-2)">Tom dos emojis ›</a></p>`}
    <div class="mt-sec">Detalhes</div>
    <div class="ap-switch" onclick="toggleDeco();openAparencia()"><div><b style="font-size:14px">Fundo decorativo</b><div style="font-size:11.5px;color:var(--text-mute)">Desenho discreto no fundo de cada aba</div></div><span class="ap-tog ${deco?'on':''}"></span></div>
    <button class="btn btn-primary btn-block" style="margin-top:14px" onclick="closeModal();renderProfile()">Pronto</button>`;
  $('modal-back').classList.add('on');
  const rv = $('theme-row-val'); if(rv) rv.textContent = (temaClaro(cur)?'Tema Claro':'Tema Noturno')+' · '+THEMES[cur].nome+' ›';
}
setPacote = function(k){
  try{ localStorage.setItem('metatreino_pack', k); }catch(e){}
  const r = document.documentElement.classList; r.toggle('ico-fina', k==='fina'); r.toggle('ico-duo', k==='duo');
  openAparencia();
};
// o toast antigo dizia "Tema X ativado" a cada toque — dentro da Aparência a prévia já mostra
const _setThemeOrig = setTheme;
setTheme = function(t){ applyTheme(t); const g=document.getElementById('theme-grid'); if(g) g.classList.add('hidden'); };
const _renderThemePickerOrig = renderThemePicker;
renderThemePicker = function(){
  _renderThemePickerOrig();
  const rv = document.getElementById('theme-row-val'); const cur = currentTheme();
  if(rv) rv.textContent = (temaClaro(cur)?'Tema Claro':'Tema Noturno')+' · '+THEMES[cur].nome+' ›';
};
openEstiloIcones = function(){ openAparencia(); };

// ---------- 7. DESAFIOS TEMÁTICOS ----------
// Cada período do ano tem um desafio principal. O calendário é calculado (não fica preso a mês):
// Carnaval e Páscoa usam a data real da Páscoa de cada ano (_pascoa, já existente no app).
// Meta = dias ativos no período, calculada a partir do PRÓPRIO histórico do aluno (sem metas exageradas)
// e congelada no momento em que ele decide participar. Qualquer modalidade conta.
const EV_ARTE = {
  anonovo:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round"><path d="M70 30v-12M70 42v12M58 36H46M82 36h12M61.5 27.5l-7-7M78.5 44.5l7 7M78.5 27.5l7-7M61.5 44.5l-7 7"/><circle cx="70" cy="36" r="3" fill="var(--ev)"/><path d="M34 62v-8M34 70v8M26 66h-8M42 66h8M28.5 60.5l-5-5M39.5 71.5l5 5M39.5 60.5l5-5M28.5 71.5l-5 5" opacity=".6"/></g>',
  carnaval:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M28 44c8-8 18-9 22-4 4-5 14-4 22 4-2 12-10 18-22 14-12 4-20-2-22-14z"/><circle cx="41" cy="46" r="4"/><circle cx="59" cy="46" r="4"/><path d="M72 40c6-10 14-14 20-12M74 46c8-4 14-3 18 0" opacity=".7"/></g><g fill="var(--ev)" opacity=".7"><circle cx="22" cy="24" r="2.5"/><circle cx="84" cy="70" r="2.5"/><rect x="60" y="72" width="5" height="5" rx="1" transform="rotate(20 62 74)"/><rect x="30" y="72" width="5" height="5" rx="1" transform="rotate(-25 32 74)"/></g>',
  consistencia:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="26" y="24" width="56" height="52" rx="8"/><path d="M26 38h56M40 18v10M68 18v10"/><path d="M34 50l3 3 5-6M50 50l3 3 5-6M66 50l3 3 5-6M34 64l3 3 5-6M50 64l3 3 5-6"/></g>',
  pascoa:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M56 20c13 0 22 22 22 36s-10 22-22 22-22-8-22-22 9-36 22-36z"/><path d="M35 50l7-5 7 5 7-5 7 5 7-5 7 5M36 62l7 5 7-5 7 5 7-5 7 5 6-4" opacity=".75"/></g>',
  equilibrio:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M56 22v54M40 76h32M28 34h56"/><path d="M28 34l-9 20h18zM84 34l-9 20h18z"/><path d="M19 54a9 5 0 0 0 18 0M75 54a9 5 0 0 0 18 0"/></g>',
  evolucao:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 76h64"/><rect x="30" y="58" width="10" height="18" rx="2"/><rect x="46" y="46" width="10" height="30" rx="2"/><rect x="62" y="34" width="10" height="42" rx="2"/><path d="M28 44l18-14 12 8 24-18M74 20h8v8"/></g>',
  arraia:'<g fill="none" stroke="var(--ev)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 22c26 12 54 12 80 0"/><path d="M22 26l4 12 5-10M38 30l3 12 5-11M54 32l2 12 5-12M70 30l1 12 6-11M84 26l-1 12 6-9"/><path d="M50 82l12-14 12 14M53 82h18M62 52c6 6 8 10 5 15-2 3-8 3-10 0-3-5 0-9 5-15z"/></g>',
  inverno:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M60 18v52M38 31l44 26M38 57l44-26"/><path d="M54 22l6 6 6-6M54 66l6-6 6 6M38 39l8-2-2-8M82 51l-8 2 2 8M38 49l8 2-2 8M82 39l-8-2 2-8"/></g>',
  superacao:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 80l26-38 14 18 12-16 26 36z"/><path d="M66 44V18l16 6-16 6"/><path d="M36 54l4-6 6 6" opacity=".6"/></g>',
  independencia:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M30 82V18"/><path d="M30 22c10-6 20 6 30 0s20-6 28 0v28c-8-6-18-6-28 0s-20-6-30 0"/><path d="M58 30l2.5 5 5.5.8-4 3.9 1 5.4-5-2.6-5 2.6 1-5.4-4-3.9 5.5-.8z"/></g>',
  primavera:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="60" cy="40" r="6"/><path d="M60 34c-4-10 4-16 0-16s4 6 0 16M66 40c10-4 16 4 16 0s-6 4-16 0M60 46c4 10-4 16 0 16s-4-6 0-16M54 40c-10 4-16-4-16 0s6-4 16 0"/><path d="M60 62v20M60 74c-6-6-14-6-18-2 6 4 12 4 18 2zM60 70c6-6 14-6 18-2-6 4-12 4-18 2z"/></g>',
  halloween:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M60 40c-2-6 0-10 5-12"/><path d="M60 42c-14-4-26 4-26 18s11 20 26 20 26-6 26-20-12-22-26-18z"/><path d="M50 56l4-4 4 4M62 56l4-4 4 4M50 68c6 4 14 4 20 0"/><path d="M20 26c4-2 6 0 8 3 2-3 4-5 8-3-3 1-5 4-8 8-3-4-5-7-8-8z" opacity=".7"/><path d="M86 18a10 10 0 1 0 6 16 8 8 0 0 1-6-16z" opacity=".55"/></g>',
  retafinal:'<g stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M28 84V18"/><path d="M28 20h52v34H28"/></g><g fill="var(--ev)"><rect x="28" y="20" width="13" height="8.5"/><rect x="54" y="20" width="13" height="8.5"/><rect x="41" y="28.5" width="13" height="8.5"/><rect x="67" y="28.5" width="13" height="8.5"/><rect x="28" y="37" width="13" height="8.5"/><rect x="54" y="37" width="13" height="8.5"/><rect x="41" y="45.5" width="13" height="8.5"/><rect x="67" y="45.5" width="13" height="8.5"/></g>',
  natal:'<g fill="none" stroke="var(--ev)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M60 14l3 6.5 7 .8-5.2 4.8 1.5 7-6.3-3.6-6.3 3.6 1.5-7-5.2-4.8 7-.8z"/><path d="M60 36L44 56h8L38 74h44L68 56h8z"/><path d="M60 74v10"/><circle cx="54" cy="62" r="1.6" fill="var(--ev)"/><circle cx="66" cy="66" r="1.6" fill="var(--ev)"/><circle cx="60" cy="50" r="1.6" fill="var(--ev)"/></g>'
};
// glifos das medalhas temáticas (grade 24)
Object.assign(TROPHY_GLYPH, {
  ev_anonovo: TROPHY_GLYPH.fireworks, ev_natal: TROPHY_GLYPH.tree, ev_halloween: TROPHY_GLYPH.pumpkin,
  ev_carnaval:'<path d="M3.5 10c3-3 6.5-3.4 8.5-1.6 2-1.8 5.5-1.4 8.5 1.6-.8 4.6-4 6.8-8.5 5.4C7.5 16.8 4.3 14.6 3.5 10z"/><circle cx="8.6" cy="11" r="1.5"/><circle cx="15.4" cy="11" r="1.5"/>',
  ev_consistencia:'<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4M8 14.5l1.5 1.5 2.5-3M13.5 14.5l1.5 1.5 2.5-3"/>',
  ev_pascoa:'<path d="M12 3c4 0 7 6.5 7 10.5S16 20 12 20s-7-2.5-7-6.5S8 3 12 3z"/><path d="M5.6 12l2.2-1.5 2.1 1.5 2.1-1.5 2.1 1.5 2.1-1.5 2.2 1.5"/>',
  ev_equilibrio:'<path d="M12 4v16M8 20h8M4.5 7.5h15M4.5 7.5L2 13h5zM19.5 7.5L17 13h5z"/>',
  ev_evolucao:'<path d="M4 20h16M6 20v-5M10.5 20v-8M15 20V8M5 11l5-4 3.5 2.5L20 4M16.5 4H20v3.5"/>',
  ev_arraia:'<path d="M2.5 5c6 3 13 3 19 0M4.5 6l1 4 1.5-3.4M10 7l.5 4 1.5-3.8M15.5 7l.2 4 1.8-3.6"/><path d="M8 21l4-4.5 4 4.5M12 10.5c2 2 2.6 3.4 1.6 5-.6.9-2.6.9-3.2 0-1-1.6 0-3 1.6-5z"/>',
  ev_inverno:'<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M10 4.5l2 2 2-2M10 19.5l2-2 2 2"/>',
  ev_superacao:'<path d="M2.5 20l7-10 3.5 4.5 3-4L21.5 20z"/><path d="M15 10.5V4l4.5 1.6L15 7.2"/>',
  ev_independencia:'<path d="M6 21V3.5"/><path d="M6 4.5c2.5-1.5 5 1.5 7.5 0s5-1.5 7 0v7.5c-2-1.5-4.5-1.5-7 0s-5-1.5-7.5 0"/>',
  ev_primavera:'<circle cx="12" cy="9" r="2"/><path d="M12 7c-1.2-3 1.2-4.5 0-4.5S13.2 4 12 7M14 9c3-1.2 4.5 1.2 4.5 0S17 10.2 14 9M12 11c1.2 3-1.2 4.5 0 4.5S10.8 14 12 11M10 9c-3 1.2-4.5-1.2-4.5 0S7 7.8 10 9M12 15.5V21M12 18.5c-2-2-4.5-2-5.5-.6 2 1.2 3.7 1.2 5.5.6z"/>',
  ev_retafinal:'<path d="M5 21V3.5"/><path d="M5 4h14v9.5H5"/><path d="M5 4h3.5v3.2H5zM12 4h3.5v3.2H12zM8.5 7.2H12v3.1H8.5zM15.5 7.2H19v3.1h-3.5zM5 10.3h3.5v3.2H5zM12 10.3h3.5v3.2H12z" fill="currentColor" stroke="none"/>'
});
const EV_CORES = {
  anonovo:{ev:'#f5c451', a:'rgba(245,196,81,.22)', b:'rgba(182,242,58,.10)'},
  carnaval:{ev:'#ff5fa2', a:'rgba(255,95,162,.24)', b:'rgba(255,214,10,.14)'},
  consistencia:{ev:'#b6f23a', a:'rgba(182,242,58,.20)', b:'rgba(61,224,255,.10)'},
  pascoa:{ev:'#f0b77a', a:'rgba(240,183,122,.24)', b:'rgba(192,132,252,.12)'},
  equilibrio:{ev:'#5ad1c8', a:'rgba(90,209,200,.22)', b:'rgba(182,242,58,.10)'},
  evolucao:{ev:'#b6f23a', a:'rgba(182,242,58,.22)', b:'rgba(90,200,250,.12)'},
  arraia:{ev:'#ff9f0a', a:'rgba(255,159,10,.24)', b:'rgba(255,69,58,.14)'},
  inverno:{ev:'#7cc7ff', a:'rgba(124,199,255,.24)', b:'rgba(255,255,255,.06)'},
  superacao:{ev:'#ff7a45', a:'rgba(255,122,69,.24)', b:'rgba(245,196,81,.12)'},
  independencia:{ev:'#34d399', a:'rgba(52,211,153,.22)', b:'rgba(245,196,81,.14)'},
  primavera:{ev:'#f472b6', a:'rgba(244,114,182,.22)', b:'rgba(182,242,58,.14)'},
  halloween:{ev:'#ff8a1f', a:'rgba(255,138,31,.26)', b:'rgba(168,85,247,.16)'},
  retafinal:{ev:'#b6f23a', a:'rgba(182,242,58,.20)', b:'rgba(255,255,255,.06)'},
  natal:{ev:'#ff5a5f', a:'rgba(255,90,95,.22)', b:'rgba(52,211,153,.16)'}
};
// meses: o desafio "da casa" de cada mês. Especiais (Carnaval, Páscoa, Halloween) têm prioridade enquanto acontecem.
const EV_MESES = [
  {arte:'anonovo', nome:'Projeto Ano Novo', desc:'Comece o ano construindo o hábito: aparecer com regularidade vale mais que começar forte.', fator:1.0, extra:['cedo']},
  {arte:'consistencia', nome:'Fevereiro em Ritmo', desc:'Mês curto, foco no ritmo: mantenha seus dias de treino, com ou sem feriado.', fator:1.0, extra:['sequencia']},
  {arte:'consistencia', nome:'Desafio Consistência', desc:'A rotina é a sua maior aliada. Construa semanas completas, uma de cada vez.', fator:1.0, extra:['semanaCheia']},
  {arte:'equilibrio', nome:'Abril em Equilíbrio', desc:'Treino, recuperação e constância andando juntos.', fator:0.95, extra:['longa']},
  {arte:'evolucao', nome:'Desafio Evolução', desc:'Mês de olhar para o próprio progresso: um pouco melhor que o mês passado já é vitória.', fator:1.05, extra:['recorde']},
  {arte:'arraia', nome:'Arraiá Fitness', desc:'Festa junina com movimento: aproveite o mês sem deixar o treino de lado.', fator:0.95, extra:['modalidades']},
  {arte:'inverno', nome:'Sem Desculpas', desc:'Frio, férias e preguiça: o desafio é manter a frequência mesmo assim.', fator:1.0, extra:['cedo']},
  {arte:'superacao', nome:'Desafio Superação', desc:'Busque um recorde pessoal ou uma sessão mais longa que o normal — com técnica e segurança.', fator:1.05, extra:['recorde','longa']},
  {arte:'independencia', nome:'Desafio Independência', desc:'Autonomia e disciplina: treine nos seus dias sem precisar de ninguém te lembrando.', fator:1.0, extra:['semanaCheia']},
  {arte:'primavera', nome:'Primavera Ativa', desc:'Renove a rotina: experimente uma atividade diferente e aproveite os dias mais longos.', fator:1.0, extra:['modalidades']},
  {arte:'retafinal', nome:'Reta Final', desc:'O ano está acabando e a consistência continua. Feche novembro em alta.', fator:1.0, extra:['semanaCheia']},
  {arte:'natal', nome:'Natal em Movimento', desc:'Encerre o ano celebrando o que você construiu — com treinos curtos e constantes nas festas.', fator:0.85, extra:['longa']}
];
// no Tema Claro, cores mais escuras para manter contraste
const EV_CLARO = { anonovo:'#a16207', carnaval:'#be185d', consistencia:'#4d7c0f', pascoa:'#b45309', equilibrio:'#0f766e', evolucao:'#4d7c0f', arraia:'#c2410c', inverno:'#0369a1', superacao:'#c2410c', independencia:'#047857', primavera:'#be185d', halloween:'#c2410c', retafinal:'#4d7c0f', natal:'#b91c1c' };
// desafios "da casa" (consistência, evolução, reta final) seguem a cor do tema; os festivos mantêm a própria paleta
const EV_DO_TEMA = ['consistencia','evolucao','retafinal'];
function evCor(arte){ if(EV_DO_TEMA.includes(arte)) return { ev:'var(--primary)', a:'rgba(var(--primary-rgb),.20)', b:'rgba(var(--primary-rgb),.06)' };
  const c = EV_CORES[arte] || EV_CORES.evolucao; try{ if(temaClaro()) return Object.assign({}, c, {ev: EV_CLARO[arte] || '#4d7c0f'}); }catch(e){} return c; }
function _d(y,m,d){ return new Date(y,m,d).getTime(); }
function eventosDoAno(Y){
  const out = [];
  EV_MESES.forEach((m,i)=>out.push({ key:'mes-'+Y+'-'+String(i+1).padStart(2,'0'), base:'mes-'+String(i+1).padStart(2,'0'), nome:m.nome, desc:m.desc, arte:m.arte, fator:m.fator, extra:m.extra, ini:_d(Y,i,1), fim:_d(Y,i+1,1), prioridade:1 }));
  const P = _pascoa(Y); const p0 = mtDia0(P.getTime());
  const carnSab = p0 - 50*DIA_MS;              // sábado de Carnaval
  out.push({ key:'carnaval-'+Y, base:'carnaval', nome:'Carnaval em Movimento', desc:'Folia e treino cabem no mesmo feriado. O desafio é não zerar a semana — qualquer modalidade conta.', arte:'carnaval', fator:0.8, extra:['feriado'], diaEspecial:carnSab+3*DIA_MS, diaEspecialNome:'na terça de Carnaval',
    ini: carnSab-1*DIA_MS, fim: carnSab+9*DIA_MS, prioridade:3 });
  out.push({ key:'pascoa-'+Y, base:'pascoa', nome:'Páscoa Ativa', desc:'Duas semanas para equilibrar chocolate e movimento, sem culpa e sem exagero.', arte:'pascoa', fator:0.9, extra:['feriado'], diaEspecial:p0-1*DIA_MS, diaEspecialNome:'no Sábado de Aleluia',
    ini: p0-13*DIA_MS, fim: p0+2*DIA_MS, prioridade:3 });
  out.push({ key:'halloween-'+Y, base:'halloween', nome:'Noite das Bruxas', desc:'Uma semana e pouco de “sustos” só para a preguiça. Inclui uma missão noturna opcional.', arte:'halloween', fator:0.95, extra:['noite'],
    ini:_d(Y,9,20), fim:_d(Y,10,1), prioridade:2 });
  return out;
}
let evCustom = [];   // desafios criados pelo administrador (Firestore: desafiosTematicos)
try{ evCustom = JSON.parse(mtLS('mt_ev_custom')||'[]'); }catch(e){ evCustom = []; }
async function loadEventosCustom(){
  try{
    const snap = await db.collection('desafiosTematicos').get();
    const arr = []; snap.forEach(d=>{ const x = d.data(); if(x && x.inicio && x.fim) arr.push(Object.assign({id:d.id}, x)); });
    evCustom = arr; mtLS('mt_ev_custom', JSON.stringify(arr));
  }catch(e){ /* offline: segue com o cache */ }
}
function _dataLocal(iso){ const [y,m,d] = String(iso).split('-').map(Number); return new Date(y, (m||1)-1, d||1).getTime(); }
function _evDeCustom(c){
  return { key:'adm-'+c.id, base:'adm', custom:true, idDoc:c.id, nome:c.nome||'Desafio', desc:c.descricao||'', arte:EV_ARTE[c.arte]?c.arte:'evolucao', fator:+c.fator||1, alvoFixo:+c.alvoFixo||0,
    extra:(c.missoes||[]).map(m=>m.tipo).filter(t=>EV_MISSOES[t]), recompensa:c.recompensa||'', ini:_dataLocal(c.inicio), fim:_dataLocal(c.fim)+DIA_MS, prioridade:4, ativo:c.ativo!==false, substitui:c.substitui||'' };
}
// todos os eventos relevantes (ano anterior, atual e próximo), já com as substituições do administrador
function todosEventos(){
  const Y = new Date().getFullYear();
  let lista = [...eventosDoAno(Y-1), ...eventosDoAno(Y), ...eventosDoAno(Y+1)];
  const custom = evCustom.map(_evDeCustom);
  const subst = new Set(custom.filter(c=>c.substitui).map(c=>c.substitui));
  lista = lista.filter(e=>!subst.has(e.key));
  return [...lista, ...custom.filter(c=>c.ativo)].sort((a,b)=>a.ini-b.ini);
}
function eventosAtivos(t){ t = t||Date.now(); return todosEventos().filter(e=>t>=e.ini && t<e.fim).sort((a,b)=>b.prioridade-a.prioridade || a.fim-b.fim); }
function eventoPrincipal(){ return eventosAtivos()[0] || null; }
function proximoEvento(){ const t = Date.now(); return todosEventos().filter(e=>e.ini>t).sort((a,b)=>a.ini-b.ini || b.prioridade-a.prioridade)[0] || null; }
function eventoPorKey(k){ return todosEventos().find(e=>e.key===k) || null; }
// frequência habitual (dias ativos por semana) nas 6 semanas antes do desafio
function frequenciaHabitual(antes){
  const ini = antes - 42*DIA_MS;
  const dias = mtDiasAtivos(ini, antes).size;
  const planejados = Math.max(((state.modules.lift&&state.modules.lift.setup&&+state.modules.lift.setup.days)||0), ((state.modules.run&&state.modules.run.setup&&+state.modules.run.setup.days)||0)) || 3;
  let base = dias/6;
  if(base < 0.75) base = Math.min(3, planejados*0.6);      // iniciante ou voltando de pausa: meta gentil
  return { base: Math.max(1.5, Math.min(5, base)), planejados };
}
function metaDoEvento(e){
  const reg = (state.eventos||{})[e.key];
  if(reg && reg.alvo) return reg.alvo;
  if(e.alvoFixo) return e.alvoFixo;
  const f = frequenciaHabitual(e.ini);
  const semanas = (e.fim - e.ini)/(7*DIA_MS);
  const teto = Math.round(Math.min(6, f.planejados+1) * semanas);   // nunca pede mais que ~1 dia além do planejado por semana
  return Math.max(2, Math.min(teto, Math.round(f.base * semanas * (e.fator||1))));
}
// missões: uma por semana (dias ativos) + as missões temáticas do evento
const EV_MISSOES = {
  cedo:{ titulo:'Treino cedo', desc:'Uma sessão antes das 9h', val:(e,h)=>h.some(x=>new Date(x.at).getHours()<9)?1:0, alvo:1 },
  noite:{ titulo:'Treino noturno', desc:'Uma sessão depois das 19h (opcional, com segurança)', val:(e,h)=>h.some(x=>new Date(x.at).getHours()>=19)?1:0, alvo:1 },
  longa:{ titulo:'Sessão longa', desc:'Uma sessão de 45 minutos ou mais', val:(e,h)=>h.some(x=>(+x.duration||0)>=45)?1:0, alvo:1 },
  modalidades:{ titulo:'Variar a rotina', desc:'Duas modalidades diferentes no período', val:(e,h)=>new Set(h.map(x=>x._t)).size, alvo:2, serve:()=>!!(state.modules.lift&&state.modules.run) || ((state.modules.run&&state.modules.run.history)||[]).some(x=>x.activity&&x.activity!=='corrida') },
  sequencia:{ titulo:'Três seguidos', desc:'Três dias seguidos com atividade', val:(e,h)=>{ const d=[...new Set(h.map(x=>mtDia0(x.at)))].sort((a,b)=>a-b); let b=0,c=0,p=null; d.forEach(x=>{ c=(p!==null && Math.round((x-p)/DIA_MS)===1)?c+1:1; b=Math.max(b,c); p=x; }); return b; }, alvo:3 },
  semanaCheia:{ titulo:'Semana completa', desc:'Uma semana cumprindo todos os dias do plano', val:(e,h)=>{ const f=frequenciaHabitual(e.ini); const alvo=Math.max(2,f.planejados); const porSem={}; h.forEach(x=>{ const k=mtSemanaIni(x.at); (porSem[k]=porSem[k]||new Set()).add(mtDia0(x.at)); }); return Object.values(porSem).some(s=>s.size>=alvo)?1:0; }, alvo:1 },
  recorde:{ titulo:'Novo recorde', desc:'Bater um recorde pessoal (carga ou corrida)', val:(e,h)=>{ const prs = Object.values(state.prs||{}).filter(p=>p&&p.at>=e.ini&&p.at<e.fim).length; return prs>0?1:0; }, alvo:1, serve:()=>!!state.modules.lift },
  feriado:{ titulo:'Dia da festa', desc:'Uma atividade no dia especial', val:(e,h)=>e.diaEspecial ? (h.some(x=>mtDia0(x.at)===e.diaEspecial)?1:0) : 0, alvo:1 }
};
function missoesDoEvento(e){
  const h = mtHist().filter(x=>x.at>=e.ini && x.at<e.fim);
  const f = frequenciaHabitual(e.ini);
  const out = [];
  // semanas (segunda a domingo) que cruzam o período
  let ws = mtSemanaIni(e.ini), n = 1; const agora = Date.now();
  while(ws < e.fim){
    const a = Math.max(ws, e.ini), b = Math.min(ws+7*DIA_MS, e.fim);
    const dias = Math.round((b-a)/DIA_MS);
    if(dias >= 2){
      const alvo = Math.max(1, Math.min(dias, Math.round(f.base*(e.fator||1)*dias/7)));
      const feito = new Set(h.filter(x=>x.at>=a && x.at<b).map(x=>mtDia0(x.at))).size;
      out.push({ id:'sem'+n, titulo:`Semana ${n}`, desc:`Ativo em ${alvo} ${alvo===1?'dia':'dias'} entre ${mtFmtData(a)} e ${mtFmtData(b-1)}`, val:feito, alvo, ok:feito>=alvo, agora:agora>=a&&agora<b, passou:agora>=b });
      n++;
    }
    ws += 7*DIA_MS;
  }
  (e.extra||[]).forEach(k=>{
    const m = EV_MISSOES[k]; if(!m || (m.serve && !m.serve())) return;
    const v = Math.min(m.alvo, m.val(e,h));
    out.push({ id:k, titulo:m.titulo, desc: k==='feriado' && e.diaEspecialNome ? `Uma atividade ${e.diaEspecialNome} (${mtFmtData(e.diaEspecial)})` : m.desc, val:v, alvo:m.alvo, ok:v>=m.alvo, agora: agora>=e.ini && agora<e.fim, passou: agora>=e.fim || (k==='feriado' && e.diaEspecial && agora>=e.diaEspecial+DIA_MS) });
  });
  return out;
}
function progressoEvento(e){
  const ate = Math.min(Date.now()+DIA_MS, e.fim);
  const dias = mtDiasAtivos(e.ini, e.fim).size;
  const alvo = metaDoEvento(e);
  const restam = Math.max(0, Math.round((e.fim - mtDia0())/DIA_MS) - 1);
  return { dias, alvo, pct: Math.min(1, dias/alvo), restam, terminou: Date.now()>=e.fim, comecou: Date.now()>=e.ini, _ate:ate };
}
function eventoMedalha(e, size){
  const c = evCor(e.arte);
  return `<span class="tbadge ev" style="--ev:${c.ev}${size?';width:'+size+'px;height:'+size+'px':''}" role="img" aria-label="Medalha ${mtEsc(e.nome)}">${medalSvg('ev_'+e.arte, String(new Date(e.ini).getFullYear()))}</span>`;
}
function participaEvento(key){
  const e = eventoPorKey(key); if(!e) return;
  state.eventos = state.eventos || {};
  if(state.eventos[key]) return;
  state.eventos[key] = { alvo: metaDoEvento(e), entrouEm: Date.now(), nome: e.nome, arte: e.arte, ini: e.ini, fim: e.fim };
  saveData();
  syncParticipacao(e);
  toast('Você está no desafio! Meta: '+state.eventos[key].alvo+' dias ativos.');
  checkEventos();
  if(state.ui.tab==='challenges') renderChallenges(); else if(state.ui.tab==='home') renderHome();
}
function sairDoEvento(key){
  appConfirm('Você deixa de participar deste desafio. Seus treinos continuam no histórico normalmente.', ()=>{
    if(state.eventos && state.eventos[key] && !state.eventos[key].concluidoEm){ delete state.eventos[key]; saveData(); try{ db.collection('desafiosTematicos').doc(key).collection('participantes').doc(uidDados()).delete().catch(()=>{}); }catch(e){} }
    renderChallenges();
  }, {title:'Sair do desafio?', emo:'🚪', okLabel:'Sair', onCancel:()=>renderChallenges()});
}
// grava a participação REAL do aluno (sem inventar números) para o painel do treinador
function syncParticipacao(e){
  try{
    if(!fbUser || !navigator.onLine) return;
    const reg = (state.eventos||{})[e.key]; if(!reg) return;
    const p = progressoEvento(e);
    const sig = [p.dias, reg.concluidoEm||0].join('|');
    if(reg._sig === sig) return;
    reg._sig = sig;
    db.collection('desafiosTematicos').doc(e.key).collection('participantes').doc(uidDados()).set({
      uid: uidDados(), email: (state.user&&state.user.email)||'', nome: (state.user&&state.user.profile&&state.user.profile.nickname)||(state.user&&state.user.name)||'',
      entrouEm: reg.entrouEm||Date.now(), alvo: reg.alvo, progresso: p.dias, concluidoEm: reg.concluidoEm||null, atualizadoEm: Date.now(), desafio: e.nome
    }, {merge:true}).catch(()=>{});
  }catch(err){}
}
function checkEventos(){
  try{
    state.eventos = state.eventos || {};
    let mudou = false;
    Object.keys(state.eventos).forEach(key=>{
      const reg = state.eventos[key]; if(!reg || reg.concluidoEm) return;
      const e = eventoPorKey(key) || (reg.ini ? {key, nome:reg.nome, arte:reg.arte, ini:reg.ini, fim:reg.fim} : null); if(!e) return;
      const dias = mtDiasAtivos(e.ini, e.fim).size;
      if(dias >= reg.alvo){
        reg.concluidoEm = Date.now(); mudou = true;
        state.medals = state.medals || [];
        const id = 'ev:'+key;
        if(!state.medals.some(m=>m.id===id)) state.medals.push({ id, month: monthKey(), at: reg.concluidoEm });
        try{ queueAward({ id:'ev_'+key, emo: eventoMedalha(e), tipo:'DESAFIO TEMÁTICO CONCLUÍDO', nome:e.nome, desc:`${dias} dias ativos — meta de ${reg.alvo} cumprida. A medalha ${e.nome} ${new Date(e.ini).getFullYear()} é sua.`, medalha:true }); }catch(err){}
        syncParticipacao(e);
      } else {
        const ev = eventoPorKey(key); if(ev) syncParticipacao(ev);
      }
    });
    if(mudou) saveData();
  }catch(e){ console.log('eventos:', e); }
}
const _checkMonthlyOrig = checkMonthly;
checkMonthly = function(){ const r = _checkMonthlyOrig.apply(this, arguments); checkEventos(); return r; };
// medalhas de eventos aparecem no arquivo de medalhas existente
const _desafioPorIdOrig = desafioPorId;
desafioPorId = function(id){
  if(String(id).startsWith('ev:')){
    const key = String(id).slice(3); const reg = (state.eventos||{})[key]; const e = eventoPorKey(key) || (reg && {key, nome:reg.nome, arte:reg.arte, ini:reg.ini, fim:reg.fim});
    if(!e) return { id, emo:'🎖️', nome:'Desafio temático', desc:'' };
    return { id, emo: eventoMedalha(e), nome:'Medalha '+e.nome, desc:`Desafio temático ${new Date(e.ini).getFullYear()} concluído` };
  }
  return _desafioPorIdOrig(id);
};
// os temas dos níveis mensais acompanham o calendário novo a partir de nov/2026 (meses anteriores mantêm o nome histórico)
const _mesTemaOrig = mesTema;
mesTema = function(mk){
  const t = _mesTemaOrig(mk);
  const k = mk || monthKey();
  if(String(k) < '2026-11') return t;
  const m = (parseInt(String(k).split('-')[1],10)-1+12)%12;
  return Object.assign({}, t, { nome: EV_MESES[m].nome, frase: EV_MESES[m].desc, emo: t.emo });
};

function mtPeriodo(e){
  const M = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  const a = new Date(e.ini), b = new Date(e.fim-1);
  return a.getMonth()===b.getMonth() ? `${a.getDate()}–${b.getDate()} ${M[b.getMonth()]}` : `${a.getDate()} ${M[a.getMonth()]} – ${b.getDate()} ${M[b.getMonth()]}`;
}
function _evHero(e, opts){
  opts = opts||{};
  const c = evCor(e.arte);
  const p = progressoEvento(e);
  const reg = (state.eventos||{})[e.key];
  const inscrito = !!reg;
  const tipo = e.custom ? 'Desafio especial' : (e.prioridade>=2 ? 'Desafio especial' : 'Desafio do mês');
  const periodo = mtPeriodo(e);
  const quando = !p.comecou ? `começa em ${Math.ceil((e.ini-Date.now())/DIA_MS)} dias` : p.terminou ? 'encerrado' : p.restam===0 ? 'último dia' : `${p.restam} ${p.restam===1?'dia restante':'dias restantes'}`;
  const concl = reg && reg.concluidoEm;
  return `<div class="ev-hero" style="--ev:${c.ev};--ev-a:${c.a};--ev-b:${c.b}">
    <div class="ev-art" aria-hidden="true"><svg viewBox="0 0 100 100">${EV_ARTE[e.arte]||''}</svg></div>
    <div class="ev-kicker">${tipo} · ${periodo}</div>
    <div class="ev-title">${mtEsc(e.nome)}</div>
    <div class="ev-desc">${mtEsc(e.desc)}</div>
    <div class="ev-stats">
      <div><div class="mt-num">${p.dias}<span style="font-size:15px;color:var(--text-dim)"> / ${p.alvo}</span></div><small>dias ativos${inscrito?'':' (meta prevista)'}</small></div>
      <div style="margin-left:auto;text-align:right"><div style="font-weight:800;font-size:15px">${quando}</div><small>${concl?'concluído em '+mtFmtData(reg.concluidoEm):(e.recompensa?mtEsc(e.recompensa):'medalha exclusiva')}</small></div>
    </div>
    <div class="mt-bar"><i style="width:${Math.round(p.pct*100)}%"></i></div>
    ${opts.semBotoes?'':`<div class="ev-cta">${concl?`<button class="btn btn-primary" onclick="shareEventoImagem('${e.key}')">📤 Compartilhar conquista</button>`
      : inscrito ? `<button class="btn btn-ghost" onclick="goTab('sessions')">Ir para o treino</button>`
      : p.terminou ? '' : `<button class="btn btn-primary" onclick="participaEvento('${e.key}')">Participar do desafio</button>`}</div>`}
  </div>`;
}
function renderChallenges(){
  const root = $('chal-root'); if(!root) return;
  checkEventos();
  const ativos = eventosAtivos();
  const e = ativos[0];
  let h = '';
  if(e){
    h += _evHero(e);
    const ms = missoesDoEvento(e);
    const proxima = ms.find(m=>!m.ok && !m.passou);
    h += `<div class="mt-sec">Missões</div><div class="card" style="padding:6px 14px">${ms.map(m=>`<div class="ev-mission ${m.ok?'ok':''} ${m.agora&&!m.ok?'now':''} ${m.passou?'past':''}" style="--ev:${evCor(e.arte).ev||'var(--primary)'}">
        <div class="ev-mcheck">${m.ok?'✓':''}</div><div class="ev-mt"><b>${mtEsc(m.titulo)}${m===proxima?' <span class="pill on" style="font-size:10px;padding:1px 7px;margin-left:4px">próxima</span>':''}</b><small>${mtEsc(m.desc)}</small></div><span class="ev-mv">${Math.min(m.val,m.alvo)}/${m.alvo}</span></div>`).join('')}</div>`;
    const reg = (state.eventos||{})[e.key];
    h += `<div class="mt-sec">Recompensa</div><div class="card ev-medal">${eventoMedalha(e, 58)}<div><b style="font-size:14.5px">Medalha ${mtEsc(e.nome)} ${new Date(e.ini).getFullYear()}</b><div class="mt-muted">${e.recompensa?mtEsc(e.recompensa)+' · ':''}Exclusiva deste período: depois que o desafio termina, não dá mais para conquistar.</div>
      ${reg && !reg.concluidoEm ? `<a href="#" onclick="sairDoEvento('${e.key}');return false" style="font-size:12px;color:var(--text-mute)">Sair do desafio</a>`:''}</div></div>`;
    if(ativos.length>1) h += `<div class="mt-sec">Também acontecendo</div>` + ativos.slice(1).map(x=>{ const p=progressoEvento(x); return `<div class="card ev-mini" onclick="mtEvFoco('${x.key}')">${eventoMedalha(x,44)}<div style="flex:1;min-width:0"><b style="font-size:14px">${mtEsc(x.nome)}</b><div class="mt-muted">${p.dias}/${p.alvo} dias · ${p.restam===0?'último dia':p.restam+' dias restantes'}</div></div><span style="color:var(--text-mute)">›</span></div>`; }).join('');
  } else {
    h += `<div class="card"><b>Nenhum desafio ativo agora.</b><div class="mt-muted">O próximo começa em breve.</div></div>`;
  }
  const prox = proximoEvento();
  if(prox) h += `<div class="mt-sec">Em breve</div><div class="card ev-mini">${eventoMedalha(prox,44)}<div style="flex:1;min-width:0"><b style="font-size:14px">${mtEsc(prox.nome)}</b><div class="mt-muted">Começa em ${mtFmtData(prox.ini,{day:'2-digit',month:'long'})}</div></div></div>`;
  // níveis do mês (sistema existente) + conquistas + medalhas
  try{
    ensureMonthly();
    const grupos = desafiosDoMes(); const total = grupos.length*NIVEIS_DESAFIO.length;
    const feitos = grupos.reduce((s,g)=>s+g.niveis.filter(c=>state.monthly.done.includes(c.id)).length,0);
    const tot = TROPHIES.length, tenho = (state.trophies||[]).length;
    const meds = (state.medals||[]).length + (state.monthly.done||[]).length;
    h += `<div class="mt-sec">Sua coleção</div><div class="chal-tiles">
      <div class="chal-tile" onclick="openMonthly()">${medalSvgInline('medal')}<b>Níveis do mês</b><small>${feitos} de ${total} · bronze, prata e ouro</small></div>
      <div class="chal-tile" onclick="openTrophies()">${medalSvgInline('star')}<b>Conquistas</b><small>${tenho} de ${tot} desbloqueadas</small></div>
      <div class="chal-tile" onclick="openMedals()">${medalSvgInline('crown')}<b>Medalhas</b><small>${meds} no arquivo</small></div>
      <div class="chal-tile" onclick="openHistoricoEventos()">${medalSvgInline('calendar')}<b>Histórico</b><small>Desafios temáticos anteriores</small></div>
    </div>`;
  }catch(err){}
  root.innerHTML = h;
  const dot = $('tab-dot-chal'); if(dot) dot.classList.remove('on');
  mtLS('mt_chal_visto', e ? e.key : '');
}
function medalSvgInline(g){ return `<span class="tbadge" style="width:34px;height:34px">${medalSvg(TROPHY_GLYPH[g]?g:'medal')}</span>`; }
TROPHY_GLYPH.calendar = '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>';
function mtEvFoco(key){
  const e = eventoPorKey(key); if(!e) return;
  $('modal-inner').innerHTML = _evHero(e) + `<div class="card" style="padding:6px 14px;margin-top:10px">${missoesDoEvento(e).map(m=>`<div class="ev-mission ${m.ok?'ok':''}"><div class="ev-mcheck">${m.ok?'✓':''}</div><div class="ev-mt"><b>${mtEsc(m.titulo)}</b><small>${mtEsc(m.desc)}</small></div><span class="ev-mv">${Math.min(m.val,m.alvo)}/${m.alvo}</span></div>`).join('')}</div><button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function openHistoricoEventos(){
  const regs = Object.entries(state.eventos||{}).sort((a,b)=>(b[1].ini||0)-(a[1].ini||0));
  const linhas = regs.map(([k,r])=>{
    const e = eventoPorKey(k) || {key:k, nome:r.nome, arte:r.arte, ini:r.ini, fim:r.fim};
    const dias = e.ini ? mtDiasAtivos(e.ini, e.fim).size : 0;
    const st = r.concluidoEm ? `<span class="pill on">concluído</span>` : (Date.now()>=e.fim ? `<span class="pill">não concluído</span>` : `<span class="pill">em andamento</span>`);
    return `<div class="ev-list-item">${eventoMedalha(e,40)}<div style="flex:1;min-width:0"><b style="font-size:13.5px">${mtEsc(e.nome)} ${e.ini?new Date(e.ini).getFullYear():''}</b><div class="mt-muted">${dias}/${r.alvo} dias${r.concluidoEm?' · '+mtFmtData(r.concluidoEm):''}</div></div>${st}</div>`;
  }).join('');
  $('modal-inner').innerHTML = `<h3>Desafios temáticos</h3><p class="mt-muted" style="margin:0 0 8px">Os desafios em que você participou, com o resultado real de cada um.</p>
    <div class="card" style="padding:8px 14px">${linhas || '<div class="mt-muted" style="padding:12px 0">Você ainda não participou de nenhum desafio temático.</div>'}</div>
    <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
// imagem para compartilhar (identidade MetaTreino)
async function shareEventoImagem(key){
  const e = eventoPorKey(key); const reg = (state.eventos||{})[key]; if(!e || !reg) return;
  const c = Object.assign({}, EV_CORES[e.arte] || EV_CORES.evolucao);   // imagem sempre escura
  if(EV_DO_TEMA.includes(e.arte)){ try{ const cs = getComputedStyle(document.documentElement); const pr = cs.getPropertyValue('--primary').trim(), rgb = cs.getPropertyValue('--primary-rgb').trim(); if(pr && !temaClaro()){ c.ev = pr; c.a = `rgba(${rgb},.22)`; c.b = `rgba(${rgb},.08)`; } }catch(err){} }
  const W = 1080, H = 1350; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = '#050505'; g.fillRect(0,0,W,H);
  const rg = g.createRadialGradient(W*0.85, H*0.1, 20, W*0.85, H*0.1, W*0.9); rg.addColorStop(0, c.a.replace(/[\d.]+\)$/,'0.55)')); rg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0,0,W,H);
  const rg2 = g.createRadialGradient(0, H, 20, 0, H, W*0.9); rg2.addColorStop(0, c.b.replace(/[\d.]+\)$/,'0.45)')); rg2.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = rg2; g.fillRect(0,0,W,H);
  const img = async (svg, x, y, w, h)=>{ const u = 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); const im = new Image(); await new Promise(r=>{ im.onload=r; im.onerror=r; im.src=u; }); try{ g.drawImage(im, x, y, w, h); }catch(err){} };
  const arte = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="--ev:${c.ev}">${(EV_ARTE[e.arte]||'').replace(/var\(--ev\)/g, c.ev)}</svg>`;
  await img(arte, W-560, 40, 520, 520);
  const medal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="none" stroke="${c.ev}" stroke-width="1.6"/><circle cx="24" cy="24" r="18.5" fill="${c.ev}" fill-opacity=".14"/><g transform="translate(12 6.5)" fill="none" stroke="${c.ev}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${(TROPHY_GLYPH['ev_'+e.arte]||TROPHY_GLYPH.medal).replace(/currentColor/g,c.ev)}</g><text x="24" y="40.5" fill="#fff" font-size="8.5" font-weight="800" text-anchor="middle" font-family="sans-serif">${new Date(e.ini).getFullYear()}</text></svg>`;
  await img(medal, 80, 560, 300, 300);
  g.fillStyle = c.ev; g.font = '800 34px Outfit, system-ui, sans-serif'; g.fillText('DESAFIO CONCLUÍDO', 80, 140);
  g.fillStyle = '#fff'; g.font = '800 92px Outfit, system-ui, sans-serif';
  const palavras = e.nome.split(' '); let linha = '', y = 250; palavras.forEach(p=>{ const t = linha ? linha+' '+p : p; if(g.measureText(t).width > 620 && linha){ g.fillText(linha, 80, y); y += 100; linha = p; } else linha = t; }); g.fillText(linha, 80, y);
  const dias = mtDiasAtivos(e.ini, e.fim).size;
  g.fillStyle = '#fff'; g.font = '300 150px Outfit, system-ui, sans-serif'; g.fillText(String(dias), 430, 760);
  g.fillStyle = 'rgba(255,255,255,.65)'; g.font = '600 38px Outfit, system-ui, sans-serif'; g.fillText('dias ativos · meta '+reg.alvo, 430, 820);
  g.fillText(mtFmtData(e.ini,{day:'2-digit',month:'short'})+' – '+mtFmtData(e.fim-1,{day:'2-digit',month:'short',year:'numeric'}), 80, 980);
  g.fillStyle = c.ev; g.fillRect(80, 1180, 70, 8);
  g.fillStyle = '#fff'; g.font = '800 44px Outfit, system-ui, sans-serif'; g.fillText('METATREINO', 80, 1250);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '500 30px Outfit, system-ui, sans-serif'; g.fillText('Treinos inteligentes que evoluem com você', 80, 1295);
  shareCanvas(cv, 'metatreino-'+e.key+'.png', `Concluí o desafio ${e.nome} no MetaTreino: ${dias} dias ativos!`);
}
// card da Home: o desafio temático encabeça o card de desafios do mês que já existia
mtGancho('renderMonthlyCard', { depois(){
  try{
    const card = $('card-monthly'); if(!card) return;
    card.setAttribute('onclick', "goTab('challenges')");
    const e = eventoPrincipal(); if(!e) return;
    try{ const mt = $('monthly-title'); if(mt) mt.textContent = 'Níveis do mês · ' + monthName(state.monthly.key).split('/')[0]; }catch(err){}
    const p = progressoEvento(e); const reg = (state.eventos||{})[e.key];
    let box = $('home-ev-row');
    if(!box){ box = document.createElement('div'); box.id = 'home-ev-row'; card.insertBefore(box, card.firstChild); }
    box.innerHTML = `<div class="ev-mini" style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)">${eventoMedalha(e,44)}<div style="flex:1;min-width:0"><div style="font-size:10.5px;font-weight:800;letter-spacing:1.1px;color:${evCor(e.arte).ev};text-transform:uppercase">${e.prioridade>=2?'Desafio especial':'Desafio do mês'}</div><b style="font-size:15px">${mtEsc(e.nome)}</b>
      <div class="mt-bar" style="margin-top:6px;height:6px"><i style="width:${Math.round(p.pct*100)}%;background:${evCor(e.arte).ev}"></i></div>
      <div class="mt-muted" style="font-size:11.5px;margin-top:4px">${reg?`${p.dias}/${p.alvo} dias ativos`:'Toque para participar'} · ${p.restam===0?'último dia':p.restam+' dias restantes'}</div></div></div>`;
    const visto = mtLS('mt_chal_visto'); const dot = $('tab-dot-chal'); if(dot) dot.classList.toggle('on', visto !== e.key);
  }catch(err){ console.log(err); }
}});

// ---------- 8. HOME INTELIGENTE ----------
// Um único card no topo que muda conforme o momento do aluno (iniciante, voltando, consistente,
// treino concluído, perto da prova). Não repete avisos que o app já mostra (dor, férias, pendências).
function contextoAluno(){
  const h = mtHist();
  const total = h.length;
  const last = total ? h[total-1].at : 0;
  const diasSem = last ? Math.round((mtDia0()-mtDia0(last))/DIA_MS) : null;
  const hojeFeito = h.some(x=>mtDia0(x.at)===mtDia0());
  // Beta 33: musculação + corrida contam os DIAS planejados das duas (antes: o maior dos dois números)
  const diasPlan = new Set(); ['lift','run'].forEach(m=>{ const mod = state.modules[m]; ((mod&&mod.plan&&mod.plan.workouts)||[]).forEach(w=>{ if(w && w.dayIdx) diasPlan.add(+w.dayIdx); }); });
  const planejados = diasPlan.size || Math.max(((state.modules.lift&&state.modules.lift.setup&&+state.modules.lift.setup.days)||0), ((state.modules.run&&state.modules.run.setup&&+state.modules.run.setup.days)||0)) || 3;
  const semIni = mtSemanaIni(Date.now());
  const semDias = mtDiasAtivos(semIni).size;
  const diaSemana = new Date().getDay()===0?7:new Date().getDay();
  let streak = 0; try{ streak = calcStreak(mtAllHist()); }catch(e){}
  let prova = null; try{ prova = daysToRace(); }catch(e){}
  const dor = !!(state.user && state.user.pain && state.user.pain.length);
  const ferias = (typeof vacationActive==='function') && vacationActive();
  const prs14 = Object.values(state.prs||{}).filter(p=>p && p.at >= Date.now()-14*DIA_MS).length;
  const hora = new Date().getHours();
  const nome = (typeof maName==='function') ? maName() : 'atleta';
  return { h, total, last, diasSem, hojeFeito, planejados, semDias, diaSemana, streak, prova, dor, ferias, prs14, hora, nome };
}
function _proxTreinoTxt(){
  try{
    const dias = ['segunda','terça','quarta','quinta','sexta','sábado','domingo'];
    const hoje = getDayIdx(); const set = new Set();
    ['lift','run'].forEach(m=>{ const mod = state.modules[m]; (mod&&mod.plan&&mod.plan.workouts||[]).forEach(w=>set.add(w.dayIdx)); });
    const ord = [...set].sort((a,b)=>a-b); if(!ord.length) return '';
    // Beta 33: o treino de hoje ainda não feito é o próximo (antes dizia "amanhã")
    const feitoHoje = mtHist().some(x=>mtDia0(x.at)===mtDia0());
    if(set.has(hoje) && !feitoHoje) return 'hoje';
    const prox = ord.find(d=>d>hoje) || ord[0];
    const dif = prox>hoje ? prox-hoje : prox+7-hoje;
    return dif===1 ? 'amanhã' : (dif<7 ? (prox===6||prox===7?'no ':'na ')+dias[prox-1] : 'na próxima semana');
  }catch(e){ return ''; }
}
function renderHomeSmart(){
  const wrap = document.querySelector('#scr-home .wrap'); if(!wrap) return;
  let el = $('home-smart');
  if(!el){ el = document.createElement('div'); el.id = 'home-smart'; wrap.appendChild(el); }
  const c = contextoAluno();
  const fechado = mtLS('mt_smart_fechado') === mtDia0()+'';
  if(c.ferias || c.dor || fechado){ el.innerHTML = ''; return; }
  let k = '', t = '', p = '', a = '', cls = '';
  const prox = _proxTreinoTxt();
  if(c.total === 0){
    k = 'Primeiros passos'; t = 'Seu primeiro treino é o mais importante';
    p = 'Comece com cargas leves e foque na técnica. Registre as séries: é com elas que o MetaTreino aprende o seu ritmo e ajusta as próximas sugestões.';
    a = `<button class="btn btn-primary" onclick="goTab('sessions')">Ver treino</button><button class="btn btn-ghost" onclick="goTab('library')">Como executar</button>`;
  } else if(c.hojeFeito){
    k = 'Treino concluído'; t = c.streak>=3 ? `Feito! São ${c.streak} dias seguidos.` : 'Feito por hoje. Agora é recuperação.';
    p = `Hidratação, uma refeição com proteína e uma boa noite de sono completam o treino.${prox?` Próxima sessão ${prox}.`:''}`;
    a = `<button class="btn btn-ghost" onclick="openWeekSummary()">Resumo da semana</button>`;
    cls = 'info';
  } else if(c.diasSem !== null && c.diasSem >= 4){
    k = 'Retomada'; t = `${c.diasSem} dias sem treinar — vamos voltar com calma`;
    p = 'Na primeira semana, use cerca de 70% das cargas de antes e menos séries. Voltar bem vale mais que voltar forte.';
    a = `<button class="btn btn-primary" onclick="goTab('sessions')">Treinar hoje</button><button class="btn btn-ghost" onclick="mtPergunta('retomada')">Plano de retomada</button>`;
    cls = 'alert';
  } else if(c.prova !== null && c.prova >= 0 && c.prova <= 21){
    k = 'Prova'; t = c.prova===0 ? 'É hoje! Boa prova.' : `Faltam ${c.prova} ${c.prova===1?'dia':'dias'} para a sua prova`;
    p = c.prova<=7 ? 'Semana de polimento: volume menor, sono em dia e nada de novidade no tênis ou na alimentação.' : 'Fase de manter: os treinos-chave continuam, o volume começa a cair perto da data.';
    a = `<button class="btn btn-ghost" onclick="mtPergunta('corrida_analise')">Como estou na corrida?</button>`;
    cls = 'warn';
  } else if(c.diaSemana >= 4 && c.semDias + (8-c.diaSemana) < c.planejados){
    k = 'Frequência'; t = `${c.semDias} de ${c.planejados} dias nesta semana`;
    p = 'A semana ainda dá para salvar parcialmente. Uma sessão hoje, mesmo curta, mantém o hábito vivo.';
    a = `<button class="btn btn-primary" onclick="goTab('sessions')">Treinar agora</button>`;
    cls = 'alert';
  } else if(c.prs14 > 0){
    k = 'Evolução'; t = `${c.prs14} ${c.prs14===1?'recorde pessoal':'recordes pessoais'} nas últimas duas semanas`;
    p = 'O trabalho está aparecendo. Mantenha a técnica e a progressão gradual — é ela que sustenta os próximos recordes.';
    a = `<button class="btn btn-ghost" onclick="mtPergunta('cargas')">Ver minhas cargas</button>`;
  } else if(c.semDias >= Math.min(c.planejados, c.diaSemana) || c.streak >= 3){
    k = 'Consistência'; t = c.streak>=3 ? `${c.streak} dias seguidos ativos` : `Semana em dia: ${c.semDias} de ${c.planejados}`;
    p = `Disciplina é isso: aparecer mesmo sem vontade.${prox&&!c.hojeFeito?` Seu próximo treino é ${prox}.`:''}`;
    a = `<button class="btn btn-ghost" onclick="mtPergunta('consistencia')">Ver minha consistência</button>`;
  } else {
    k = 'Para você hoje'; t = c.semDias ? `${c.semDias} ${c.semDias===1?'dia ativo':'dias ativos'} nesta semana` : 'Semana nova, página em branco';
    p = prox==='hoje' ? 'Seu treino de hoje ainda está em aberto. Mesmo uma sessão mais curta mantém o hábito.' : prox ? `Seu próximo treino é ${prox}. Se der para encaixar algo hoje, uma caminhada leve já ajuda na recuperação.` : 'Que tal começar hoje?';
    a = `<button class="btn btn-ghost" onclick="mtPergunta('analise_semana')">Análise da semana</button>`;
  }
  el.innerHTML = `<div class="smart ${cls}"><div style="display:flex;align-items:flex-start;gap:8px"><div class="smart-k" style="flex:1">${k}</div><button onclick="mtLS('mt_smart_fechado', String(mtDia0()));renderHomeSmart()" aria-label="Ocultar hoje" style="background:none;border:0;color:var(--text-mute);font-size:15px;padding:0 2px;cursor:pointer">✕</button></div><div class="smart-t">${t}</div><div class="smart-p">${p}</div><div class="smart-a">${a}</div></div>`;
}
function mtPergunta(key){
  try{ openAssistant(); }catch(e){}
  setTimeout(()=>{ try{ maAsk(key); }catch(e){} }, 350);
}
mtGancho('renderHome', { depois(){
  try{ renderHomeSmart(); }catch(e){ console.log('home smart:', e); }
}});

// ---------- 9. META ASSISTENTE ----------
// Tudo aqui é calculado por regras, com os dados reais do aluno. O assistente não finge
// ser uma IA externa (veja "quem é você", que já explica isso).
const MOTIVA = {
  retorno_longo:[
    'Faz {dias} dias desde o último treino, {nome}. Ninguém perde tudo nesse tempo: a memória muscular está aí, esperando.',
    'Pausa longa não apaga o que você já construiu. Hoje não é dia de recuperar o tempo perdido — é dia de reabrir a porta.',
    '{dias} dias parado? Acontece com todo mundo que treina de verdade. O que separa quem volta é só isto: voltar.',
    'O treino mais difícil é o primeiro depois da pausa. Depois dele, o segundo já parece normal.',
    'Volte pequeno, {nome}. Vinte minutos hoje valem mais que um treino perfeito que nunca acontece.',
    'Você já provou que consegue — são {n} treinos no histórico. Agora é só reconectar.',
    'O corpo lembra. Os primeiros minutos vão ser estranhos, os últimos vão parecer casa.'
  ],
  retorno_curto:[
    '{dias} dias sem treinar ainda é só uma pausa. Hoje é o dia de não deixar virar hábito.',
    'Dois ou três dias de descanso fazem bem. O quarto já começa a pesar — vamos quebrar isso hoje?',
    'Você não precisa de motivação para começar; a motivação aparece depois do aquecimento.',
    'Sem drama: retome do ponto onde parou. O plano continua te esperando.',
    'Um treino curto hoje mantém a corrente que você vem construindo.'
  ],
  consistente:[
    '{streak} dias seguidos ativos, {nome}. Isso não é sorte: é disciplina virando identidade.',
    'Semana com {sem} de {alvo} dias feitos. Você está fazendo o que a maioria só planeja.',
    'Consistência é o recurso mais subestimado do treino — e você está usando muito bem.',
    'Ninguém vê os dias em que você treinou sem vontade. Mas o resultado vai mostrar todos eles.',
    'Você está no ritmo. Agora o desafio é manter a qualidade, não aumentar a quantidade.',
    'Rotina construída é liberdade: você já não precisa decidir se vai treinar, só quando.',
    'Mais uma semana firme. O seu eu de três meses atrás ficaria orgulhoso.'
  ],
  evoluindo:[
    '{pr} {prTxt} nas últimas duas semanas. O progresso está deixando rastro, {nome}.',
    'Carga subindo com técnica é o melhor sinal que um treino pode dar. Continue assim.',
    'Você está mais forte do que estava no mês passado — e os números provam.',
    'Evolução não é linear, mas a sua linha está apontando para cima. Proteja isso com bom descanso.',
    'Cada recorde é a soma de treinos comuns bem feitos. Siga fazendo o comum muito bem.'
  ],
  iniciante:[
    'Todo atleta já esteve no treino número {n1}. O que importa é chegar ao próximo.',
    'No começo, o objetivo é um só: aprender o movimento e criar o hábito. A carga vem depois.',
    'Você está construindo a base, {nome}. Base bem feita é o que permite crescer sem se machucar.',
    'Os primeiros treinos ensinam mais sobre você do que sobre o exercício. Preste atenção em como o corpo responde.',
    'Comece leve e termine querendo mais. Essa é a receita para voltar amanhã.'
  ],
  treinou_hoje:[
    'Treino de hoje feito. A parte mais difícil já passou — agora é recuperar bem.',
    'Missão cumprida por hoje, {nome}. Água, comida de verdade e sono: é aí que o músculo cresce.',
    'Mais um treino no histórico. São {n} ao todo — cada um contou.',
    'Hoje você fez a sua parte. Amanhã o corpo faz a dele.',
    'Feito! Agora não estrague com uma noite mal dormida. 😉'
  ],
  desanimado:[
    'Dia sem vontade é normal. Combina comigo: faça só o aquecimento. Se depois dele quiser parar, pode.',
    'Motivação vai e volta; o plano fica. Hoje, cumpra a versão mínima do treino.',
    'Você não precisa estar animado para treinar — precisa só começar. A cabeça segue o corpo.',
    'Desânimo passa mais rápido em movimento do que no sofá. Dez minutos e a gente conversa.',
    'Treino ruim ainda é treino. Treino que não aconteceu não é nada.'
  ],
  prova:[
    'Faltam {prova} dias para a prova. O trabalho pesado já está guardado nas pernas — agora é chegar inteiro.',
    'Reta final para a prova: confie no treino que você fez. Não é hora de inventar.',
    'A prova é só a festa. O treino de verdade foi tudo o que você fez até aqui.'
  ],
  geral:[
    'O melhor treino é o que você faz, não o que você planeja.',
    'Pequeno hoje, grande amanhã. Confie no processo.',
    'Força não é só carga na barra: é aparecer quando ninguém está cobrando.',
    'Seu único adversário é quem você era no mês passado.',
    'Treinar é um presente que você dá para o seu futuro.',
    'Corpo forte, cabeça leve. Vamos?',
    'Disciplina é lembrar o que você quer de verdade.',
    'Um dia de cada vez. Hoje é o dia que importa.'
  ]
};
const MOTIVA_ACAO = {
  retorno_longo:'Sugestão prática: faça o treino de hoje com cerca de 70% das cargas de antes e 2 séries por exercício.',
  retorno_curto:'Sugestão prática: escolha o treino mais curto da semana e faça hoje.',
  consistente:'Sugestão prática: nesta semana, tente melhorar a técnica de um exercício em vez de subir carga em todos.',
  evoluindo:'Sugestão prática: mantenha a progressão pequena (2,5 a 5%) e respeite o descanso entre séries.',
  iniciante:'Sugestão prática: anote a carga de cada série — em duas semanas você vai ver a diferença.',
  treinou_hoje:'Sugestão prática: registre como se sentiu no treino; isso ajuda o app a ajustar as próximas sugestões.',
  desanimado:'Sugestão prática: coloque a roupa de treino agora. Só isso. O resto fica mais fácil.',
  prova:'Sugestão prática: durma bem nas duas noites antes da prova — a noite anterior costuma ser agitada.',
  geral:''
};
function _motivaCategorias(c){
  const out = [];
  let animo = null; try{ animo = (typeof maCtxGet==='function') ? maCtxGet('animo') : null; }catch(e){}
  if(animo === 'baixo') out.push('desanimado');
  if(c.hojeFeito) out.push('treinou_hoje');
  if(c.diasSem !== null && c.diasSem >= 8) out.push('retorno_longo');
  else if(c.diasSem !== null && c.diasSem >= 3) out.push('retorno_curto');
  if(c.prova !== null && c.prova >= 0 && c.prova <= 14) out.push('prova');
  if(c.prs14 > 0) out.push('evoluindo');
  if(c.total < 6) out.push('iniciante');
  if(c.streak >= 3 || (c.semDias >= Math.min(c.planejados, c.diaSemana) && c.semDias>0)) out.push('consistente');
  out.push('geral');
  return out;
}
function motivacaoContextual(){
  const c = contextoAluno();
  const cats = _motivaCategorias(c);
  let hist = []; try{ hist = JSON.parse(mtLS('mt_motiva_hist')||'[]'); }catch(e){}
  // primeira categoria é a mais relevante; às vezes (30%) usa a segunda, para variar sem perder contexto
  let cat = cats[0];
  if(cats.length > 2 && Math.random() < 0.3) cat = cats[1];
  const pool = MOTIVA[cat].map((m,i)=>({id:cat+':'+i, m})).filter(x=>!hist.includes(x.id));
  let escolha = pool.length ? pool[Math.floor(Math.random()*pool.length)] : null;
  if(!escolha){ // todas desta categoria já foram vistas: pega a menos recente
    const ids = MOTIVA[cat].map((m,i)=>cat+':'+i);
    const id = ids.sort((a,b)=>hist.indexOf(a)-hist.indexOf(b))[0];
    escolha = {id, m: MOTIVA[cat][+id.split(':')[1]]};
  }
  hist = [escolha.id, ...hist.filter(x=>x!==escolha.id)].slice(0, 40);
  mtLS('mt_motiva_hist', JSON.stringify(hist));
  const prTxt = c.prs14===1?'recorde pessoal':'recordes pessoais';
  const txt = escolha.m.replace(/\{nome\}/g, c.nome).replace(/\{dias\}/g, c.diasSem).replace(/\{streak\}/g, c.streak).replace(/\{sem\}/g, c.semDias).replace(/\{alvo\}/g, c.planejados)
    .replace(/\{n\}/g, c.total).replace(/\{n1\}/g, c.total+1).replace(/\{pr\}/g, c.prs14).replace(/\{prTxt\}/g, prTxt).replace(/\{prova\}/g, c.prova);
  let acao = MOTIVA_ACAO[cat];
  if(!acao){ const px = _proxTreinoTxt(); if(px && !c.hojeFeito) acao = 'Seu próximo treino é '+px+'. Deixe a roupa separada desde já.'; }
  return txt + (acao ? '<br><br>' + acao : '');
}
// --- análise do mês (mês atual até hoje × mesmo período do mês anterior) ---
function _resumoPeriodo(a, b){
  const h = mtHist().filter(x=>x.at>=a && x.at<b);
  const km = t=>h.filter(x=>x._t===t).reduce((s,x)=>s+(+x.distance||0),0);
  return { sessoes:h.length, dias:new Set(h.map(x=>mtDia0(x.at))).size, min:Math.round(h.reduce((s,x)=>s+(+x.duration||0),0)), lift:h.filter(x=>x._t==='musculacao').length,
    kmRun:km('corrida'), kmWalk:km('caminhada'), kmBike:km('bike'), prs:Object.values(state.prs||{}).filter(p=>p&&p.at>=a&&p.at<b).length };
}
function _seta(a, b, un){ if(!b && !a) return ''; const d = a-b; if(Math.abs(d) < 0.05) return ' <span style="color:var(--text-mute)">(igual)</span>'; const ad = Math.abs(d); const v = un==='km' ? mtFmtKm(ad)+' km' : un==='min' ? (ad>=60 ? Math.floor(ad/60)+'h'+String(Math.round(ad%60)).padStart(2,'0') : Math.round(ad)+' min') : Math.round(ad); return ` <span style="color:${d>0?'var(--accent)':'var(--text-mute)'}">(${d>0?'+':'−'}${v})</span>`; }
function analiseMes(){
  const now = new Date(); const ini = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const iniAnt = new Date(now.getFullYear(), now.getMonth()-1, 1).getTime();
  const decorrido = Date.now() - ini;
  const A = _resumoPeriodo(ini, Date.now()+1), B = _resumoPeriodo(iniAnt, Math.min(ini, iniAnt+decorrido));
  if(!A.sessoes && !B.sessoes) return 'Ainda não tenho treinos suficientes neste mês ou no anterior para comparar. Registre alguns treinos e me pergunte de novo. 📆';
  const mes = now.toLocaleDateString('pt-BR',{month:'long'});
  const planejados = contextoAluno().planejados;
  const semanas = Math.max(1, (Date.now()-ini)/(7*DIA_MS));
  const adesao = Math.min(100, Math.round(A.dias/(planejados*semanas)*100));
  let t = `<b>Análise de ${mes} até hoje</b> (comparando com o mesmo período do mês passado):<br><br>`;
  t += `• Dias ativos: <b>${A.dias}</b>${_seta(A.dias,B.dias)}<br>• Sessões: <b>${A.sessoes}</b>${_seta(A.sessoes,B.sessoes)}<br>• Tempo de treino: <b>${Math.floor(A.min/60)}h${String(A.min%60).padStart(2,'0')}</b>${_seta(A.min,B.min,'min')}<br>`;
  if(state.modules.lift) t += `• Musculação: <b>${A.lift}</b> treinos${_seta(A.lift,B.lift)} · recordes: <b>${A.prs}</b><br>`;
  if(A.kmRun||B.kmRun) t += `• Corrida: <b>${mtFmtKm(A.kmRun)} km</b>${_seta(A.kmRun,B.kmRun,'km')}<br>`;
  if(A.kmWalk||B.kmWalk) t += `• Caminhada: <b>${mtFmtKm(A.kmWalk)} km</b>${_seta(A.kmWalk,B.kmWalk,'km')}<br>`;
  if(A.kmBike||B.kmBike) t += `• Bike: <b>${mtFmtKm(A.kmBike)} km</b>${_seta(A.kmBike,B.kmBike,'km')}<br>`;
  t += `<br>Adesão ao plano: <b>${adesao}%</b> dos dias planejados (${planejados} por semana).`;
  t += '<br><br>' + (adesao>=85 ? 'Mês muito consistente. Se quiser evoluir mais, o caminho agora é qualidade: técnica, progressão de carga e sono.'
    : adesao>=60 ? 'Boa base. O próximo passo é proteger os dias de treino na agenda — os que mais falham costumam ser sempre os mesmos.'
    : 'A frequência está abaixo do planejado. Vale ajustar o plano para menos dias por semana e cumprir 100% deles, em vez de planejar muito e fazer pouco.');
  return t;
}
// --- cargas: evolução, manutenção e estagnação por exercício (dados reais das séries) ---
function _e1rm(peso, reps){ peso=+peso||0; reps=+reps||0; if(!peso||!reps) return 0; return peso*(1+Math.min(reps,12)/30); }
function analiseCargas(){
  const desde = Date.now() - 49*DIA_MS;
  const res = [];
  Object.keys(state.progress||{}).forEach(id=>{
    const sess = (state.progress[id]||[]).filter(p=>p.date>=desde && p.sets && p.sets.length).sort((a,b)=>a.date-b.date);
    if(sess.length < 3) return;
    const best = sess.map(p=>({d:p.date, v:Math.max(0,...p.sets.map(s=>_e1rm(s.peso,s.reps))), peso:Math.max(0,...p.sets.map(s=>+s.peso||0))})).filter(x=>x.v>0);
    if(best.length < 3) return;
    const ini = best.slice(0,2).reduce((s,x)=>s+x.v,0)/2, fim = best.slice(-2).reduce((s,x)=>s+x.v,0)/2;
    const dif = (fim-ini)/ini*100;
    const span = (best[best.length-1].d - best[0].d)/DIA_MS;
    let nome = id; try{ nome = nomeDoEx(id) || id; }catch(e){}
    res.push({ id, nome, dif, span, n:best.length, pesoIni:best[0].peso, pesoFim:best[best.length-1].peso });
  });
  if(!res.length) return 'Ainda não tenho séries suficientes para analisar suas cargas. Preciso de pelo menos 3 sessões do mesmo exercício nas últimas semanas, com carga e repetições registradas. 📒';
  const sobe = res.filter(r=>r.dif>=2.5).sort((a,b)=>b.dif-a.dif);
  const parado = res.filter(r=>r.dif>-2.5 && r.dif<2.5 && r.span>=21);
  const cai = res.filter(r=>r.dif<=-5);
  const fmt = r=>`${mtEsc(r.nome)} (${r.pesoIni}→${r.pesoFim} kg)`;
  let t = `Analisei <b>${res.length}</b> ${res.length===1?'exercício':'exercícios'} das últimas 7 semanas (força estimada pela carga × repetições):<br><br>`;
  if(sobe.length) t += `📈 <b>Evoluindo:</b> ${sobe.slice(0,4).map(fmt).join(', ')}.<br><br>`;
  if(parado.length) t += `➖ <b>Estáveis há 3+ semanas:</b> ${parado.slice(0,4).map(fmt).join(', ')}.<br>Para destravar: mude a faixa de repetições por 3 semanas (ex.: de 8–10 para 12–15), ou troque por uma variação do mesmo movimento. Se o sono ou a alimentação estiverem fracos, comece por eles.<br><br>`;
  if(cai.length) t += `📉 <b>Em queda:</b> ${cai.slice(0,3).map(fmt).join(', ')}.<br>Pode ser fadiga acumulada. Uma semana com cerca de 10% menos carga costuma resolver. Se houver dor, priorize a recuperação.<br><br>`;
  if(!sobe.length && !parado.length && !cai.length) t += 'Os exercícios ainda têm pouco tempo de histórico para dizer se estagnaram. Continue registrando. ';
  t += 'Regra de ouro: só suba a carga quando completar todas as séries com boa técnica e ainda sobrar 1–2 repetições.';
  return t;
}
function analiseRetomada(){
  const c = contextoAluno();
  if(c.diasSem === null) return 'Você ainda não tem treinos registrados — então não é retomada, é começo! Comece pelo treino de hoje com cargas leves. 💪';
  if(c.diasSem < 4) return `Seu último treino foi há ${c.diasSem===0?'menos de um dia':c.diasSem+' '+(c.diasSem===1?'dia':'dias')}. Isso é descanso normal, não precisa de plano de retomada. Siga o plano como está. ✅`;
  const longa = c.diasSem >= 21;
  let t = `Faz <b>${c.diasSem} dias</b> desde o seu último treino. Plano de retomada sugerido:<br><br>`;
  t += `<b>Semana 1</b> — ${longa?'2 a 3':'3'} sessões, cerca de ${longa?'60%':'70%'} das cargas de antes, 2 séries por exercício, terminando cada série com folga (dava para fazer mais 3–4 repetições).<br>`;
  t += `<b>Semana 2</b> — ${longa?'75 a 85%':'85 a 90%'} das cargas, volte ao número normal de séries.<br>`;
  t += `<b>Semana ${longa?'3–4':'3'}</b> — volta ao plano normal. Aumente a carga só quando o exercício estiver confortável.<br>`;
  if(state.modules.run) t += `<br>Na corrida/caminhada: comece com ${longa?'metade':'cerca de 70%'} do volume semanal de antes, em ritmo de conversa. Aumente no máximo 10% por semana.`;
  t += '<br><br>Dor muscular nos primeiros dias é esperada. Dor articular ou pontual não é — nesse caso, pare e use o “Estou com dor”.';
  return t;
}
function analiseConsistencia(){
  const c = contextoAluno();
  const semanas = []; let ws = mtSemanaIni(Date.now()) - 7*7*DIA_MS;
  for(let i=0;i<8;i++){ semanas.push(mtDiasAtivos(ws, ws+7*DIA_MS).size); ws += 7*DIA_MS; }
  const completas = semanas.slice(0,7).filter(n=>n>=c.planejados).length;
  if(!c.total) return 'Ainda não há treinos para medir consistência. Volte a me perguntar depois da primeira semana. 🙂';
  const porDia = [0,0,0,0,0,0,0]; c.h.filter(x=>x.at>=Date.now()-56*DIA_MS).forEach(x=>{ const d=new Date(x.at).getDay(); porDia[d===0?6:d-1]++; });
  const nomes = ['segunda','terça','quarta','quinta','sexta','sábado','domingo'];
  const melhor = porDia.indexOf(Math.max(...porDia));
  const media = semanas.slice(0,7).reduce((s,n)=>s+n,0)/7;
  let t = `<b>Consistência das últimas 7 semanas completas:</b><br><br>`;
  t += `• Semanas cumprindo o plano (${c.planejados} dias): <b>${completas} de 7</b><br>• Média: <b>${media.toLocaleString('pt-BR',{maximumFractionDigits:1})}</b> dias ativos por semana<br>• Sequência atual: <b>${c.streak}</b> ${c.streak===1?'dia':'dias'}<br>• Dia em que você mais treina: <b>${nomes[melhor]}</b><br>`;
  t += `• Semana atual: <b>${semanas[7]}</b> de ${c.planejados} dias<br><br>`;
  t += completas>=6 ? 'Excelente regularidade. Esse é o fator que mais pesa no resultado a longo prazo.'
    : completas>=4 ? 'Boa regularidade, com algumas semanas incompletas. Ver quais dias costumam falhar ajuda a ajustar o plano.'
    : `Mais da metade das semanas ficou abaixo do plano. Talvez ${Math.max(2, Math.round(media))} dias por semana seja um plano mais realista agora — e cumprir 100% motiva mais do que planejar demais.`;
  return t;
}
function analiseCorrida(){
  const runs = mtHist().filter(x=>x._t==='corrida' && +x.distance>0 && +x.duration>0);
  if(runs.length < 3) return 'Preciso de pelo menos 3 corridas registradas com distância e tempo para analisar seu desempenho. 🏃';
  const pace = x=>(+x.duration)/(+x.distance);
  const ult = runs.slice(-4), ant = runs.slice(-8,-4);
  const pU = ult.reduce((s,x)=>s+pace(x),0)/ult.length;
  const pA = ant.length ? ant.reduce((s,x)=>s+pace(x),0)/ant.length : null;
  const sem = t0=>runs.filter(x=>x.at>=t0 && x.at<t0+7*DIA_MS).reduce((s,x)=>s+(+x.distance),0);
  const agora = Date.now();
  const km7 = runs.filter(x=>x.at>=agora-7*DIA_MS).reduce((s,x)=>s+(+x.distance),0);
  const km28 = runs.filter(x=>x.at>=agora-28*DIA_MS && x.at<agora-7*DIA_MS).reduce((s,x)=>s+(+x.distance),0)/3;
  const longa = runs.reduce((m,x)=>(+x.distance>+m.distance?x:m), runs[0]);
  let t = `<b>Sua corrida em números</b> (${runs.length} corridas registradas):<br><br>`;
  t += `• Ritmo médio das últimas ${ult.length}: <b>${mtPaceStr(pU)}</b>`;
  if(pA){ const d = (pA-pU)*60; t += Math.abs(d)<3 ? ' (estável)' : d>0 ? ` — <span style="color:var(--accent)">${Math.round(d)}s/km mais rápido</span> que as ${ant.length} anteriores` : ` — ${Math.round(-d)}s/km mais lento que as anteriores`; }
  t += `<br>• Volume nos últimos 7 dias: <b>${mtFmtKm(km7)} km</b>${km28?` (média das 3 semanas anteriores: ${mtFmtKm(km28)} km)`:''}<br>• Corrida mais longa: <b>${mtFmtKm(longa.distance)} km</b> em ${mtFmtData(longa.at)}<br><br>`;
  if(km28 > 0 && km7 > km28*1.5 && km7 >= 10) t += '⚠️ O volume desta semana está bem acima do seu normal (mais de 50%). Aumentos bruscos são uma causa comum de lesão — segure o crescimento perto de 10% por semana.';
  else if(pA && pA-pU > 0.05) t += 'O ritmo está melhorando. Mantenha a maioria das corridas leves (ritmo de conversa) — é ela que sustenta essa evolução.';
  else t += 'Para evoluir o ritmo: 80% das corridas leves e 1 treino de qualidade por semana (tiros ou ritmo forte controlado).';
  let prova = null; try{ prova = daysToRace(); }catch(e){}
  if(prova !== null && prova >= 0) t += `<br><br>🏁 Faltam <b>${prova}</b> dias para a prova.${prova<=10?' Fase de polimento: reduza o volume e mantenha um pouco de intensidade.':''}`;
  return t;
}
function respostaDesafio(){
  const e = eventoPrincipal(); if(!e) return 'Nenhum desafio temático ativo agora. Os níveis do mês continuam valendo na aba Desafios. 🎖️';
  const p = progressoEvento(e); const reg = (state.eventos||{})[e.key];
  const prox = missoesDoEvento(e).find(m=>!m.ok && !m.passou);
  let t = `O desafio de agora é <b>${mtEsc(e.nome)}</b> (${p.restam===0?'último dia':p.restam+' dias restantes'}).<br><br>`;
  t += reg ? `Você está com <b>${p.dias} de ${p.alvo}</b> dias ativos.${p.dias>=p.alvo?' Meta cumprida! 🎉':` Faltam ${p.alvo-p.dias}.`}` : `Você ainda não está participando. A meta prevista para você é de <b>${p.alvo}</b> dias ativos, calculada a partir do seu histórico — qualquer modalidade conta.`;
  if(prox) t += `<br><br>Próxima missão: <b>${mtEsc(prox.titulo)}</b> — ${mtEsc(prox.desc)}.`;
  t += `<br><br><button class="btn btn-primary" style="padding:8px 14px;font-size:13px" onclick="closeAssistant();goTab('challenges')">Abrir desafios</button>`;
  return t;
}
function ajudaApp(){
  return `Como o app está organizado:<br><br><b>Início</b> — treino de hoje, semana e recomendações.<br><b>Treinos</b> — suas sessões, o plano e a <b>Biblioteca</b> de exercícios (com vídeos e ficha técnica).<br><b>Desafios</b> — desafio temático, níveis do mês, conquistas e medalhas.<br><b>Progresso</b> — desempenho, gráficos e histórico.<br><b>Perfil</b> — peso, fotos de evolução, aparência, backup e conta.<br><br>E eu fico no botão redondo do canto. Pode me perguntar “análise do mês”, “minhas cargas estagnaram?”, “plano de retomada” ou “me motive”.`;
}
Object.assign(MA_ANSWERS, {
  motiva: motivacaoContextual,
  analise_mes: analiseMes,
  cargas: analiseCargas,
  retomada: analiseRetomada,
  consistencia: analiseConsistencia,
  corrida_analise: analiseCorrida,
  desafio_tematico: respostaDesafio,
  ajuda_app: ajudaApp
});
MA_SUGGESTIONS.unshift(
  {lbl:'📆 Análise do mês', key:'analise_mes'},
  {lbl:'📉 Minhas cargas estagnaram?', key:'cargas'},
  {lbl:'🎯 Minha consistência', key:'consistencia'},
  {lbl:'🏃 Análise da corrida', key:'corrida_analise'},
  {lbl:'🔁 Plano de retomada', key:'retomada'},
  {lbl:'🎖️ Desafio temático', key:'desafio_tematico'}
);
MA_SUGGESTIONS.push({lbl:'🧭 Onde fica cada coisa?', key:'ajuda_app'});
const _maInterpretOrig = maInterpret;
maInterpret = function(txt){
  const t = mtNorm(txt);
  const has = (...w)=>w.some(x=>t.includes(x));
  if(has('analise do mes','analise mensal','resumo do mes','como foi meu mes','como foi o mes','relatorio do mes','relatorio mensal','meu mes')) return 'analise_mes';
  if(!has('aumentar','subir','quando aument') && has('estagn','cargas','minha carga','minhas cargas','travei','travado','parei de evoluir','nao evoluo','evolucao de carga','plato')) return 'cargas';
  if(has('retomada','voltar a treinar','voltando a treinar','voltei a treinar','fiquei parado','muito tempo parado','recomecar','recomeçar')) return 'retomada';
  if(!has('cardiac','batimento') && has('consistencia','frequencia','regularidade','quantas semanas')) return 'consistencia';
  if(has('analise da corrida','analise de corrida','meu pace','meu ritmo','ritmo melhorou','pace melhorou','evolucao na corrida','evolui na corrida')) return 'corrida_analise';
  if(has('desafio tematico','desafio do mes','desafio atual','qual o desafio','desafios')) return 'desafio_tematico';
  if(has('onde fica','onde encontro','como uso o app','como usar o app','onde esta a biblioteca','cade a biblioteca','onde ficou','mudou de lugar')) return 'ajuda_app';
  if(has('me motiva','me motive','motivacao','estou desanimad','to desanimad','sem vontade de treinar','preguica de treinar')) return 'motiva';
  return _maInterpretOrig(txt);
};
// proatividade discreta: só quando o assistente não tem nada mais importante para dizer (máx. 1x/dia, regra original)
const _maNudgeOrig = maNudge;
maNudge = function(){
  const n = _maNudgeOrig();
  if(n) return n;
  try{
    if((state.ui&&state.ui.nudgeSeen) === new Date().toDateString()) return null;
    const e = eventoPrincipal(); const reg = e && (state.eventos||{})[e.key];
    if(e && reg && !reg.concluidoEm){ const p = progressoEvento(e); const falta = p.alvo - p.dias; if(falta>0 && falta<=2 && p.restam>=falta) return {text:`🎖️ Falta${falta>1?'m':''} ${falta} ${falta===1?'dia':'dias'} para concluir ${e.nome}`, tone:'important', dica:{completa: respostaDesafio()}}; }
  }catch(err){}
  return null;
};

// ---------- 10. PAINEL ADMINISTRATIVO ----------
// Indicadores calculados a partir dos dados reais que o painel já carrega (usuarios.estadoApp).
function _admResumoAluno(u){
  const st = u && u.estadoApp; if(!st || !st.modules) return null;
  const h = [...((st.modules.lift&&st.modules.lift.history)||[]), ...((st.modules.run&&st.modules.run.history)||[])].filter(x=>x&&x.at);
  const ultimo = h.reduce((m,x)=>Math.max(m,x.at),0);
  return { ultimo, sem7: h.filter(x=>x.at>=Date.now()-7*DIA_MS).length, eventos: st.eventos||{} };
}
function renderAdminKpis(){
  const anchor = document.querySelector('#scr-admin .stat-grid'); if(!anchor) return;
  let box = $('adm-kpis'); if(!box){ box = document.createElement('div'); box.id = 'adm-kpis'; anchor.after(box); }
  const resumos = Object.values(usuariosCache||{}).map(_admResumoAluno).filter(Boolean);
  const ativos7 = resumos.filter(r=>r.ultimo>=Date.now()-7*DIA_MS).length;
  const parados = resumos.filter(r=>r.ultimo && r.ultimo<Date.now()-14*DIA_MS).length;
  const treinos7 = resumos.reduce((s,r)=>s+r.sem7,0);
  const e = eventoPrincipal();
  const noDesafio = e ? resumos.filter(r=>r.eventos[e.key]).length : 0;
  box.innerHTML = `<div class="section-lbl" style="margin:16px 0 0">Engajamento (dados reais)</div><div class="adm-kpis">
    <div class="adm-kpi"><b>${ativos7}</b><small>treinaram nos últimos 7 dias</small></div>
    <div class="adm-kpi"><b>${treinos7}</b><small>sessões registradas em 7 dias</small></div>
    <div class="adm-kpi"><b>${parados}</b><small>sem treinar há 14+ dias</small></div>
  </div>${e?`<div class="mt-muted" style="margin:6px 2px 0">${noDesafio} ${noDesafio===1?'aluno participa':'alunos participam'} de <b>${mtEsc(e.nome)}</b>.</div>`:''}`;
}
function renderAdminTools(){
  const rows = [...document.querySelectorAll('#scr-admin .list-row')];
  const ref = rows.find(r=>/Feedback|Mensagens dos alunos/.test(r.textContent)); if(!ref) return;
  if(!$('adm-ev-row')){
    const a = document.createElement('div'); a.className = 'list-row'; a.id = 'adm-ev-row'; a.onclick = openAdminEventos;
    a.innerHTML = '🎖️ <span>Desafios temáticos</span><span style="margin-left:auto;font-size:11px;color:var(--text-dim)">criar e acompanhar</span>';
    ref.after(a);
  }
  if(!$('adm-perm-row')){
    const b = document.createElement('div'); b.className = 'list-row'; b.id = 'adm-perm-row'; b.onclick = openAdminPermissoes;
    b.innerHTML = '🛡️ <span>Administradores e permissões</span>';
    $('adm-ev-row').after(b);
  }
  $('adm-perm-row').classList.toggle('hidden', !mtPrincipal());
}
mtGancho('goAdmin', { depois(){
  try{ renderAdminTools(); renderAdminKpis(); }catch(e){ console.log('admin extras:', e); }
}});
// --- desafios temáticos (admin) ---
async function openAdminEventos(){
  await loadEventosCustom();
  const Y = new Date().getFullYear(); const agora = Date.now();
  const lista = [...eventosDoAno(Y), ...eventosDoAno(Y+1)].filter(e=>e.fim>agora-30*DIA_MS).sort((a,b)=>a.ini-b.ini).slice(0,10);
  const custom = evCustom.map(_evDeCustom).sort((a,b)=>b.ini-a.ini);
  const subst = new Set(custom.map(c=>c.substitui).filter(Boolean));
  const linha = (e, extra)=>{ const ativo = agora>=e.ini && agora<e.fim; return `<div class="ev-list-item">${eventoMedalha(e,38)}<div style="flex:1;min-width:0"><b style="font-size:13.5px">${mtEsc(e.nome)}</b><div class="mt-muted" style="font-size:11.5px">${mtFmtData(e.ini)} – ${mtFmtData(e.fim-1)}${ativo?' · <span style="color:var(--accent)">em andamento</span>':''}${extra||''}</div></div>${_admEvBotoes(e)}</div>`; };
  const princ = mtAdmin();
  $('modal-inner').innerHTML = `<h3>Desafios temáticos</h3>
    <p class="mt-muted" style="margin:0 0 10px">O calendário anual é automático (inclusive Carnaval e Páscoa, que mudam de data). ${princ?'Você pode personalizar qualquer desafio, desativá-lo ou criar um novo — sem mexer no código.':'Somente administradores podem criar ou editar desafios.'}</p>
    ${princ?`<button class="btn btn-primary btn-block" onclick="openAdminEventoForm()">➕ Criar desafio</button>`:''}
    ${custom.length?`<div class="mt-sec">Criados ou personalizados</div><div class="card" style="padding:6px 12px">${custom.map(e=>linha(e, e.ativo?'':' · <b>desativado</b>')).join('')}</div>`:''}
    <div class="mt-sec">Calendário automático</div><div class="card" style="padding:6px 12px">${lista.map(e=>subst.has(e.key)?'':linha(e)).join('')}</div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function _admEvBotoes(e){
  const b = [`<button class="btn btn-ghost" style="padding:6px 9px;font-size:11.5px" onclick="openAdminEventoPart('${e.key}')">Participação</button>`];
  if(mtAdmin()) b.push(`<button class="btn btn-ghost" style="padding:6px 9px;font-size:11.5px" onclick="openAdminEventoForm('${e.key}')">${e.custom?'Editar':'Personalizar'}</button>`);
  return `<div style="display:flex;flex-direction:column;gap:4px">${b.join('')}</div>`;
}
function openAdminEventoForm(key){
  if(!mtAdmin()){ toast('🔒 Somente administradores.'); return; }
  const e = key ? eventoPorKey(key) || evCustom.map(_evDeCustom).find(x=>x.key===key) : null;
  const doc = e && e.custom ? evCustom.find(c=>'adm-'+c.id===key) : null;
  const iso = t=>{ const d = new Date(t); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  const v = doc || (e ? { nome:e.nome, descricao:e.desc, inicio:iso(e.ini), fim:iso(e.fim-1), arte:e.arte, fator:e.fator, alvoFixo:'', missoes:(e.extra||[]).map(t=>({tipo:t})), recompensa:'', ativo:true, substitui:e.key } : { nome:'', descricao:'', inicio:iso(Date.now()), fim:iso(Date.now()+13*DIA_MS), arte:'evolucao', fator:1, alvoFixo:'', missoes:[], recompensa:'', ativo:true, substitui:'' });
  const tiposM = (v.missoes||[]).map(m=>m.tipo);
  $('modal-inner').innerHTML = `<h3>${doc?'Editar desafio':e?'Personalizar desafio':'Novo desafio'}</h3>
    ${v.substitui?`<p class="mt-muted" style="margin:0">Substitui o desafio automático <b>${mtEsc(v.substitui)}</b>.</p>`:''}
    <div class="adm-form">
      <label>Nome</label><input class="input" id="ef-nome" maxlength="40" value="${mtEsc(v.nome)}">
      <label>Descrição / objetivo</label><textarea class="input" id="ef-desc" maxlength="220">${mtEsc(v.descricao||'')}</textarea>
      <div style="display:flex;gap:8px"><div style="flex:1"><label>Início</label><input class="input" type="date" id="ef-ini" value="${v.inicio}"></div><div style="flex:1"><label>Fim (inclusive)</label><input class="input" type="date" id="ef-fim" value="${v.fim}"></div></div>
      <label>Arte e cor</label><select class="input" id="ef-arte">${Object.keys(EV_ARTE).map(k=>`<option value="${k}" ${k===v.arte?'selected':''}>${k}</option>`).join('')}</select>
      <label>Intensidade da meta</label><select class="input" id="ef-fator">${[[0.8,'Leve (80% da frequência habitual)'],[0.9,'Moderada (90%)'],[1,'Padrão (100%)'],[1.1,'Puxada (110%)']].map(([f,l])=>`<option value="${f}" ${(+v.fator||1)===f?'selected':''}>${l}</option>`).join('')}</select>
      <label>Meta fixa de dias ativos (opcional)</label><input class="input" type="number" min="1" max="60" id="ef-alvo" placeholder="em branco = meta personalizada por aluno" value="${v.alvoFixo||''}">
      <label>Missões extras</label>${Object.entries(EV_MISSOES).map(([k,m])=>`<label style="display:flex;gap:8px;align-items:center;text-transform:none;letter-spacing:0;font-size:13px;color:var(--text);font-weight:600;margin:6px 0"><input type="checkbox" class="ef-m" value="${k}" ${tiposM.includes(k)?'checked':''}> ${m.titulo} <span style="color:var(--text-mute);font-weight:500">— ${m.desc}</span></label>`).join('')}
      <label>Recompensa (texto exibido)</label><input class="input" id="ef-rec" maxlength="80" value="${mtEsc(v.recompensa||'')}" placeholder="Ex.: medalha exclusiva + destaque no mural">
      <label style="display:flex;gap:8px;align-items:center;text-transform:none;letter-spacing:0;font-size:13.5px;color:var(--text)"><input type="checkbox" id="ef-ativo" ${v.ativo!==false?'checked':''}> Desafio ativo</label>
    </div>
    <p class="mt-muted" style="font-size:11.5px;margin-top:8px">A meta de cada aluno é calculada pela frequência real dele nas 6 semanas anteriores e não passa de 1 dia além do plano por semana. Participações e conclusões só existem quando o aluno entra e cumpre de verdade.</p>
    <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="salvarEventoAdmin('${doc?doc.id:''}','${mtJsStr(v.substitui||'')}')">Salvar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openAdminEventos()">Voltar</button>`;
  $('modal-back').classList.add('on');
}
async function salvarEventoAdmin(idDoc, substitui){
  if(!mtAdmin()){ toast('🔒 Somente administradores.'); return; }
  const nome = $('ef-nome').value.trim(); const ini = $('ef-ini').value, fim = $('ef-fim').value;
  if(!nome){ toast('Dê um nome ao desafio'); return; }
  if(!ini || !fim || fim < ini){ toast('Confira as datas de início e fim'); return; }
  const dados = { nome, descricao:$('ef-desc').value.trim(), inicio:ini, fim, arte:$('ef-arte').value, fator:+$('ef-fator').value||1,
    alvoFixo: Math.max(0, Math.min(60, parseInt($('ef-alvo').value,10)||0)) || null,
    missoes:[...document.querySelectorAll('.ef-m:checked')].map(x=>({tipo:x.value})), recompensa:$('ef-rec').value.trim(), ativo:$('ef-ativo').checked,
    substitui: substitui||'', atualizadoEm: Date.now(), atualizadoPor: (state.user&&state.user.email)||'' };
  try{
    const ref = idDoc ? db.collection('desafiosTematicos').doc(idDoc) : db.collection('desafiosTematicos').doc('d'+Date.now().toString(36));
    if(!idDoc) dados.criadoEm = Date.now();
    await ref.set(dados, {merge:true});
    toast('✅ Desafio salvo'); await loadEventosCustom(); openAdminEventos();
  }catch(e){ console.log(e); toast('⚠️ Não foi possível salvar. Confira as regras do Firestore (desafiosTematicos).'); }
}
async function openAdminEventoPart(key){
  $('modal-inner').innerHTML = `<h3>Participação</h3><div class="mt-muted">Carregando…</div>`;
  $('modal-back').classList.add('on');
  try{
    const snap = await db.collection('desafiosTematicos').doc(key).collection('participantes').get();
    // Beta 35: a mesma pessoa com dois logins podia aparecer duas vezes: fica o registro mais adiantado por e-mail
    const porEmail = {}; const arr = [];
    snap.forEach(d=>{ const x = d.data(); const k = String(x.email||'').toLowerCase() || d.id; const a = porEmail[k];
      if(!a || (x.concluidoEm && !a.concluidoEm) || ((+x.progresso||0) > (+a.progresso||0) && !a.concluidoEm)) porEmail[k] = x; });
    Object.values(porEmail).forEach(x=>arr.push(x));
    arr.sort((a,b)=>(b.progresso||0)-(a.progresso||0));
    const concl = arr.filter(x=>x.concluidoEm).length;
    const e = eventoPorKey(key);
    $('modal-inner').innerHTML = `<h3>${mtEsc(e?e.nome:key)}</h3>
      <div class="adm-kpis"><div class="adm-kpi"><b>${arr.length}</b><small>participantes</small></div><div class="adm-kpi"><b>${concl}</b><small>concluíram</small></div><div class="adm-kpi"><b>${arr.length?Math.round(concl/arr.length*100):0}%</b><small>taxa de conclusão</small></div></div>
      <div class="card" style="padding:6px 12px;margin-top:10px;max-height:46vh;overflow:auto">${arr.map(x=>`<div class="ev-list-item"><div style="flex:1;min-width:0"><b style="font-size:13px">${mtEsc(x.nome||x.email||'Aluno')}</b><div class="mt-muted" style="font-size:11.5px">${mtEsc(x.email||'')}</div></div><span class="mono" style="font-size:12px">${x.progresso||0}/${x.alvo||'?'}</span>${x.concluidoEm?' <span class="pill on">✓</span>':''}</div>`).join('') || '<div class="mt-muted" style="padding:10px 0">Ninguém entrou neste desafio ainda.</div>'}</div>
      <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openAdminEventos()">Voltar</button>`;
  }catch(err){
    $('modal-inner').innerHTML = `<h3>Participação</h3><p class="mt-muted">Não consegui ler os participantes. Publique as regras do Firestore incluídas nesta versão (firestore.rules).</p><button class="btn btn-ghost btn-block" onclick="openAdminEventos()">Voltar</button>`;
  }
}
// --- administradores (só o principal) ---
async function openAdminPermissoes(){
  if(!mtPrincipal()){ toast('🔒 Somente o administrador principal gerencia permissões.'); return; }
  $('modal-inner').innerHTML = `<h3>Administradores</h3><div class="mt-muted">Carregando…</div>`; $('modal-back').classList.add('on');
  let lista = [];
  try{ const snap = await db.collection('admins').get(); snap.forEach(d=>lista.push(Object.assign({email:d.id}, d.data()))); }
  catch(e){
    // diagnóstico real: mostra o motivo e a identificação que o Firestore recebeu desta conta
    const negado = e && (e.code==='permission-denied' || /permission/i.test(e.message||''));
    const uid = (fbUser && fbUser.uid) || '—'; const em = (fbUser && fbUser.email) || '—';
    const verif = fbUser && fbUser.emailVerified ? 'sim' : 'não';
    $('modal-inner').innerHTML = `<h3>Administradores</h3>
      <p class="mt-muted">${negado ? 'O Firestore recusou a leitura da coleção <b>admins</b> para esta conta. As regras reconhecem o administrador principal pelo UID ou pelo e-mail verificado — confira se batem com os dados abaixo.' : (navigator.onLine===false ? 'Sem conexão no momento.' : 'Não consegui ler a coleção <b>admins</b> agora ('+mtEsc((e&&e.code)||'erro')+').')}</p>
      <div class="card" style="font-size:12.5px;line-height:1.7;word-break:break-all"><b>UID desta conta:</b> ${mtEsc(uid)}<br><b>E-mail:</b> ${mtEsc(em)}<br><b>E-mail verificado:</b> ${verif}</div>
      <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="openAdminPermissoes()">Tentar de novo</button>
      <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
    return;
  }
  const principal = String(ADMIN_EMAIL).toLowerCase();
  if(!lista.some(a=>a.email===principal)) lista.unshift({email:principal, ativo:true});
  $('modal-inner').innerHTML = `<h3>Administradores</h3>
    <p class="mt-muted" style="margin:0 0 10px">Administradores autorizados acessam o painel e gerenciam alunos, exercícios, vídeos, desafios e conteúdo. Só o principal muda permissões e cuida da Conquista Especial — e isso é garantido pelas regras do Firestore, não só pela tela.</p>
    <div class="card" style="padding:6px 12px">${lista.map(a=>`<div class="ev-list-item"><div style="flex:1;min-width:0"><b style="font-size:13px">${mtEsc(a.email)}</b><div class="mt-muted" style="font-size:11.5px">${a.email===principal?'Administrador principal':(a.ativo?'Autorizado':'Removido')}</div></div>${a.email===principal?'<span class="pill on">principal</span>':`<button class="btn btn-ghost" style="padding:6px 10px;font-size:12px" onclick="admSetAdmin('${mtJsStr(a.email)}', ${a.ativo?'false':'true'})">${a.ativo?'Remover':'Reativar'}</button>`}</div>`).join('')}</div>
    <div class="adm-form"><label>Adicionar administrador (e-mail)</label><input class="input" id="adm-novo" type="email" autocomplete="off" placeholder="email@exemplo.com"></div>
    <button class="btn btn-primary btn-block" style="margin-top:10px" onclick="admSetAdmin(document.getElementById('adm-novo').value, true)">Autorizar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
}
async function admSetAdmin(email, ativo){
  email = String(email||'').trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ toast('E-mail inválido'); return; }
  if(email === String(ADMIN_EMAIL).toLowerCase()){ toast('O administrador principal não pode ser alterado'); return; }
  const go = async ()=>{
    try{ await db.collection('admins').doc(email).set({ ativo: !!ativo, atualizadoEm: Date.now(), atualizadoPor: state.user.email }, {merge:true}); toast(ativo?'✅ Administrador autorizado':'Permissão removida'); }
    catch(e){ toast('⚠️ O Firestore recusou. Confira as regras publicadas.'); }
    openAdminPermissoes();
  };
  if(!ativo) appConfirm(`${email} perde o acesso ao painel administrativo.`, go, {title:'Remover administrador?', emo:'🛡️', okLabel:'Remover', danger:true, onCancel:openAdminPermissoes});
  else go();
}

// ---------- 11. ATUALIZAÇÃO AUTOMÁTICA (sem botão) ----------
// O service worker novo é instalado em segundo plano. Ele é ativado:
//  • na hora, se o app acabou de abrir ou não há nada em andamento; ou
//  • quando o aluno sai do app (aba oculta) — nunca no meio de um treino ou de um formulário.
// Quando assume, o index.html recarrega a página uma vez (controllerchange).
const MT_UPD = { pendente:false, desde:0, avisou:false, abriuEm: Date.now() };
function _podeAtualizarAgora(){
  if(document.visibilityState === 'hidden') return true;
  const modal = document.getElementById('modal-back');
  const ocupado = (modal && modal.classList.contains('on')) || (state && state.ui && state.ui.tab==='sessions') ||
    (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) || !!document.getElementById('rest-timer-banner') || !!document.getElementById('rest-timer-on');   // Beta 33: o id certo do descanso
  // nos primeiros 20 s após abrir, ninguém começou nada ainda: pode aplicar
  return !ocupado || (Date.now() - MT_UPD.abriuEm < 20000 && !(modal && modal.classList.contains('on')));
}
async function mtAplicarAtualizacao(){
  try{
    if(!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration(); if(!reg || !reg.waiting) return;
    if(_podeAtualizarAgora()){ reg.waiting.postMessage('skipWaiting'); MT_UPD.pendente = false; }
    else {
      if(!MT_UPD.pendente){ MT_UPD.pendente = true; MT_UPD.desde = Date.now(); }
      // situação rara: atualização pronta há mais de 1 dia e o app nunca ficou livre — um aviso discreto, sem botão
      if(!MT_UPD.avisou && Date.now()-MT_UPD.desde > DIA_MS){ MT_UPD.avisou = true; toast('Uma atualização do MetaTreino está pronta e será aplicada quando você fechar o app.'); }
    }
  }catch(e){}
}
document.addEventListener('mt:update-available', ()=>mtAplicarAtualizacao());
document.addEventListener('visibilitychange', async ()=>{
  if(document.visibilityState === 'hidden'){ if(MT_UPD.pendente) mtAplicarAtualizacao(); return; }
  // voltou ao app (PWA instalada fica dias aberta): procura versão nova no máximo a cada 30 min
  try{ const ult = +mtLS('mt_upd_chk2')||0; if(Date.now()-ult > 30*60000){ mtLS('mt_upd_chk2', String(Date.now())); const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if(reg) reg.update().catch(()=>{}); } }catch(e){}
});
window.addEventListener('load', ()=>{ setTimeout(mtAplicarAtualizacao, 1500); });
setInterval(()=>{ if(MT_UPD.pendente) mtAplicarAtualizacao(); }, 60000);
// os antigos pontos de "atualizar" ficam inertes (compatibilidade com chamadas antigas)
renderUpdateCard = function(){};

// ---------- BOOT ----------
const _bootAfterAuthOrig = bootAfterAuth;
bootAfterAuth = function(){
  const r = _bootAfterAuthOrig.apply(this, arguments);
  setTimeout(()=>{ loadEventosCustom().then(()=>{ try{ checkEventos(); if(state.ui.tab==='challenges') renderChallenges(); else if(state.ui.tab==='home') renderMonthlyCard(); }catch(e){} }); }, 1800);
  return r;
};
Object.assign(window, { renderLibrary, setLibEquip, openExercise, openExerciseSheet, exTelaCheia, exVideoOk, openAparencia, setPacote, setTheme, openFotos, fotoToggleSel, fotoApagarSelConfirma, fotoApagarConfirma, fotoApagarTudoConfirma, fotoApagarTudoAgora, fotoVer,
  renderChallenges, participaEvento, sairDoEvento, shareEventoImagem, openHistoricoEventos, mtEvFoco, renderHomeSmart, mtPergunta, openAdminEventos, openAdminEventoForm, salvarEventoAdmin, openAdminEventoPart, openAdminPermissoes, admSetAdmin, trophyIco, trophyIcoLocked, mtLS, mtDia0 });

// =====================================================================
// 12. ÁUDIO DOS VÍDEOS + 13. VÍDEOS INDISPONÍVEIS (Beta 11)
// =====================================================================
// Preferência por aluno: fica em state.prefs (vai junto com o estadoApp para a nuvem,
// então vale em qualquer aparelho e depois de sair/entrar) e num cache local.
function videoMudoPref(){
  try{ const p = state.prefs && state.prefs.videoAudio; if(p) return p === 'mudo'; }catch(e){}
  return mtLS('mt_video_audio') === 'mudo';
}
function setVideoAudio(v){
  state.prefs = state.prefs || {};
  state.prefs.videoAudio = v === 'mudo' ? 'mudo' : 'som';
  mtLS('mt_video_audio', state.prefs.videoAudio);
  saveData();
  openAudioVideos();
  try{ renderProfile(); }catch(e){}
}
function openAudioVideos(){
  const mudo = videoMudoPref();
  const op = (k, t, d)=>`<div class="ap-pack ${((k==='mudo')===mudo)?'on':''}" onclick="setVideoAudio('${k}')"><div style="flex:1"><b style="font-size:14px">${t}</b>${((k==='mudo')===mudo)?' <span style="color:var(--primary-2)">✓</span>':''}<div style="font-size:12px;color:var(--text-mute);line-height:1.45;margin-top:2px">${d}</div></div></div>`;
  $('modal-inner').innerHTML = `<h3>Áudio dos vídeos</h3>
    <p class="mt-muted" style="margin:0 0 12px">Vale para os vídeos de demonstração dos exercícios. Você pode ligar ou desligar o som de cada vídeo a qualquer momento no próprio player.</p>
    ${op('mudo','Iniciar vídeos no mudo','O vídeo começa sem som. Ideal para continuar ouvindo sua música enquanto confere a execução.')}
    ${op('som','Manter áudio original','O vídeo toca normalmente, com o som do criador.')}
    <div class="note" style="margin-top:10px"><div class="note-line" style="font-size:12px">O MetaTreino não mexe no volume do celular. Com o vídeo no mudo, o Android normalmente mantém a música de outros apps tocando — mas isso depende do aparelho, da versão do Android e do navegador. Ao ligar o som de um vídeo, o sistema pode pausar a música.</div></div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal()">Pronto</button>`;
  $('modal-back').classList.add('on');
}

// --- Player com a API oficial do YouTube (IFrame Player API) ---
// Carrega https://www.youtube.com/iframe_api só quando um vídeo é aberto (nada no início do app).
let _ytApi = null;
function mtCarregarYTApi(){
  if(window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if(_ytApi) return _ytApi;
  _ytApi = new Promise((res, rej)=>{
    const anterior = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function(){ try{ anterior && anterior(); }catch(e){} res(window.YT); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
    s.onerror = ()=>{ _ytApi = null; s.remove(); rej(new Error('api')); };
    document.head.appendChild(s);
    setTimeout(()=>{ if(!(window.YT && window.YT.Player)){ _ytApi = null; rej(new Error('timeout')); } }, 9000);
  });
  return _ytApi;
}
const MT_PLAYER = { p:null, v:null, info:null, mudo:false, pronto:false, t:null, prog:null, vel:1 };
// Beta 34 — MODO LIMPO: o player do YouTube vem sem os controles dele (controls=0) e o MetaTreino mostra
// os seus, numa barra ABAIXO do vídeo (nada por cima da imagem): tocar/pausar, tempo, som, volume,
// velocidade e tela cheia. O vídeo repete sozinho (loop), então a tela final de "outros vídeos" não
// aparece. Tocar na imagem pausa/continua; o toque não vai para o YouTube, então o aluno não é levado
// para fora do app por engano. Limitação oficial: o YouTube não permite esconder o título e o
// logotipo por parâmetro (o "showinfo" foi desativado em 2018) — eles podem aparecer por alguns
// segundos no início ou ao pausar, sem dar para remover sem infringir os termos do YouTube.
function _mtPlayerVars(v, mudo){
  return { autoplay:1, playsinline:1, controls:0, rel:0, modestbranding:1, iv_load_policy:3, disablekb:1, fs:0, cc_load_policy:0,
    loop:1, playlist:v.id, mute: mudo ? 1 : 0, origin: location.origin };
}
const MTV_PAUSA = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
const MTV_PLAY = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
function _mtFmt(s){ s = Math.max(0, Math.floor(+s||0)); return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0'); }
function mtTocarPausar(){
  const p = MT_PLAYER.p; if(!p || !MT_PLAYER.pronto) return;
  try{ (p.getPlayerState && p.getPlayerState() === 1) ? p.pauseVideo() : p.playVideo(); }catch(e){}
}
function mtBuscar(frac){ const p = MT_PLAYER.p; if(!p || !MT_PLAYER.pronto) return; try{ const d = p.getDuration(); if(d > 0) p.seekTo(d * Math.max(0, Math.min(1, frac)), true); }catch(e){} }
function mtVolume(v){
  const p = MT_PLAYER.p; if(!p || !MT_PLAYER.pronto) return;
  try{ v = Math.max(0, Math.min(100, +v)); p.setVolume(v); if(v === 0){ p.mute(); MT_PLAYER.mudo = true; } else if(MT_PLAYER.mudo){ p.unMute(); MT_PLAYER.mudo = false; } }catch(e){}
  _mtBotaoSom();
}
function mtVelocidade(){
  const p = MT_PLAYER.p; if(!p || !MT_PLAYER.pronto) return;
  const ops = [1, 0.75, 0.5]; MT_PLAYER.vel = ops[(ops.indexOf(MT_PLAYER.vel) + 1) % ops.length];
  try{ p.setPlaybackRate(MT_PLAYER.vel); }catch(e){}
  const b = $('mtv-vel'); if(b) b.textContent = String(MT_PLAYER.vel).replace('.', ',') + '×';
}
function _mtAtualizaBarra(){
  const p = MT_PLAYER.p; if(!p || !MT_PLAYER.pronto) return;
  try{
    const t = p.getCurrentTime() || 0, d = p.getDuration() || 0, est = p.getPlayerState && p.getPlayerState();
    const i = document.querySelector('#mtv-barra i'); if(i) i.style.width = (d ? Math.min(100, t/d*100) : 0) + '%';
    const tt = $('mtv-tempo'); if(tt) tt.textContent = d ? `${_mtFmt(t)} / ${_mtFmt(d)}` : '';
    const bp = $('mtv-play'); if(bp){ const tocando = est === 1 || est === 3; if(bp.dataset.t !== String(tocando)){ bp.dataset.t = String(tocando); bp.innerHTML = tocando ? MTV_PAUSA : MTV_PLAY; } bp.setAttribute('aria-label', tocando ? 'Pausar o vídeo' : 'Tocar o vídeo'); }
  }catch(e){}
}
function _mtControlesHtml(){
  return `<div class="mtv-ctrl" id="mtv-ctrl">
      <button type="button" class="mtv-b" id="mtv-play" onclick="mtTocarPausar()" aria-label="Pausar o vídeo">${MTV_PAUSA}</button>
      <div class="mtv-barra" id="mtv-barra" role="slider" aria-label="Posição do vídeo" tabindex="0"><i></i></div>
      <span class="mtv-tempo" id="mtv-tempo"></span>
      <button type="button" class="mtv-b" id="mtv-vel" onclick="mtVelocidade()" aria-label="Velocidade do vídeo">1×</button>
      <input type="range" class="mtv-vol" id="mtv-vol" min="0" max="100" value="100" aria-label="Volume do vídeo" oninput="mtVolume(this.value)">
    </div>`;
}
function _mtLigaControles(){
  const stage = $('ex-stage'); if(!stage || stage.querySelector('#mtv-ctrl')) return;
  stage.insertAdjacentHTML('afterend', _mtControlesHtml());
  const barra = $('mtv-barra');
  if(barra){
    const ir = e=>{ const r = barra.getBoundingClientRect(); mtBuscar(((e.clientX||0) - r.left) / r.width); };
    barra.addEventListener('pointerdown', ir);
    barra.addEventListener('keydown', e=>{ const p = MT_PLAYER.p; if(!p) return; try{ if(e.key==='ArrowRight') p.seekTo(p.getCurrentTime()+5, true); if(e.key==='ArrowLeft') p.seekTo(Math.max(0, p.getCurrentTime()-5), true); }catch(x){} });
  }
  // tocar na imagem pausa/continua (o iframe não recebe o toque: veja .ex-stage iframe no CSS)
  stage.addEventListener('click', e=>{ if(e.target.closest('button,a')) return; mtTocarPausar(); });
  clearInterval(MT_PLAYER.prog); MT_PLAYER.prog = setInterval(_mtAtualizaBarra, 400);
}
function mtDestruirPlayer(){
  clearTimeout(MT_PLAYER.t); clearInterval(MT_PLAYER.prog); MT_PLAYER.prog = null; MT_PLAYER.vel = 1;
  try{ const c = $('mtv-ctrl'); if(c) c.remove(); }catch(e){}
  try{ MT_PLAYER.p && MT_PLAYER.p.destroy && MT_PLAYER.p.destroy(); }catch(e){}
  MT_PLAYER.p = null; MT_PLAYER.pronto = false; MT_PLAYER.v = null;
}
// Fallback sem a API (bloqueada/lenta): iframe simples; o parâmetro mute=1 ainda respeita a preferência.
function _mtIframeSimples(v, mudo){
  const alvo = $('ex-yt'); if(!alvo) return;
  // sem a API não há como pôr controles próprios: o player do YouTube fica com os dele, no modo mais enxuto permitido
  const src = `https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1&playsinline=1&autoplay=1&iv_load_policy=3&loop=1&playlist=${v.id}&mute=${mudo?1:0}`;
  const st = $('ex-stage'); if(st) st.classList.add('nativo');
  alvo.outerHTML = `<iframe src="${src}" title="Vídeo do exercício" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen onload="exVideoOk()"></iframe>`;
  const b = $('ex-som'); if(b){ b.disabled = true; b.title = 'Use o botão de som do próprio player'; b.style.opacity = '.5'; }
}
function mtMontarPlayer(v, info){
  mtDestruirPlayer();
  MT_PLAYER.v = v; MT_PLAYER.info = info; MT_PLAYER.mudo = videoMudoPref();
  if(navigator.onLine === false){ mtVideoFalha(v, 'offline'); return; }
  mtCarregarYTApi().then(YT=>{
    if(MT_PLAYER.v !== v || !$('ex-yt')) return;   // o aluno já fechou ou abriu outro
    MT_PLAYER.p = new YT.Player('ex-yt', {
      videoId: v.id,
      host: 'https://www.youtube-nocookie.com',
      playerVars: _mtPlayerVars(v, MT_PLAYER.mudo),
      events: {
        onReady: e=>{
          MT_PLAYER.pronto = true; clearTimeout(MT_PLAYER.t);
          try{ MT_PLAYER.mudo ? e.target.mute() : e.target.unMute(); e.target.playVideo(); }catch(err){}
          exVideoOk(); _mtBotaoSom(); _mtLigaControles();
          try{ const vol = $('mtv-vol'); if(vol) vol.value = MT_PLAYER.mudo ? 0 : (e.target.getVolume ? e.target.getVolume() : 100); }catch(err){}
        },
        onError: e=>{ clearTimeout(MT_PLAYER.t); mtVideoFalha(v, e && e.data); }
      }
    });
    const ifr = MT_PLAYER.p.getIframe && MT_PLAYER.p.getIframe(); if(ifr) ifr.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen');
    // pronto não chegou em 15 s: trata como conexão lenta, nunca como "vídeo removido"
    MT_PLAYER.t = setTimeout(()=>{ if(!MT_PLAYER.pronto && MT_PLAYER.v===v) mtVideoFalha(v, 'lento'); }, 15000);
  }).catch(()=>{
    if(MT_PLAYER.v !== v) return;
    if(navigator.onLine === false) mtVideoFalha(v, 'offline');
    else _mtIframeSimples(v, MT_PLAYER.mudo);   // API indisponível: mostra o vídeo do jeito antigo
  });
}
function _mtBotaoSom(){ const b = $('ex-som'); if(b) b.textContent = MT_PLAYER.mudo ? '🔇 Sem som' : '🔊 Com som'; const vol = $('mtv-vol'); if(vol && MT_PLAYER.mudo) vol.value = 0; }
// liga/desliga o som SÓ deste vídeo (a preferência geral continua a mesma)
function mtAlternarSom(){
  const p = MT_PLAYER.p; if(!p || !MT_PLAYER.pronto) return;
  try{ if(MT_PLAYER.mudo){ p.unMute(); if(p.getVolume && p.getVolume()===0) p.setVolume(100); MT_PLAYER.mudo = false; const vol = $('mtv-vol'); if(vol) vol.value = p.getVolume ? (p.getVolume()||100) : 100; } else { p.mute(); MT_PLAYER.mudo = true; } }catch(e){}
  _mtBotaoSom();
}
// Códigos oficiais de erro do player do YouTube:
//   2 = parâmetro/ID inválido · 5 = erro do player HTML5 (geralmente temporário)
//   100 = vídeo não encontrado (removido ou privado) · 101 e 150 = dono não permite incorporar
const VID_MOTIVO = {
  '2':   {lbl:'Link inválido', confirmado:true},
  '5':   {lbl:'Erro no player (pode ser temporário)', confirmado:false},
  '100': {lbl:'Removido ou privado', confirmado:true},
  '101': {lbl:'Incorporação desativada pelo dono', confirmado:true},
  '150': {lbl:'Incorporação desativada pelo dono', confirmado:true},
  'offline': {lbl:'Sem conexão', confirmado:false},
  'lento': {lbl:'Demorou para carregar', confirmado:false},
  'manual': {lbl:'Informado pelo aluno', confirmado:false}
};
function _buscaSemelhante(info){
  const eq = (info.equip||[]).includes('academia') ? '' : (info.equip||[]).includes('halteres') ? 'com halteres' : (info.equip||[]).includes('casa') ? 'em casa' : '';
  const q = ['como fazer', info.nome, info.grupo, eq, 'execução correta'].filter(Boolean).join(' ');
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
}
function mtVideoFalha(v, cod){
  const st = $('ex-stage'); if(!st) return;
  const info = MT_PLAYER.info || {nome:'', grupo:'', equip:[]};
  const m = VID_MOTIVO[String(cod)] || VID_MOTIVO['5'];
  const conexao = cod==='offline' || cod==='lento';
  st.classList.remove('ok'); st.classList.add('falha');
  st.innerHTML = `<div class="ex-fail">
    <div class="ex-fail-t">${conexao ? 'Não foi possível carregar o vídeo agora.' : 'Este vídeo não está disponível no momento.'}</div>
    <div class="ex-fail-s">${conexao ? (cod==='offline' ? 'Você parece estar sem internet. Isso não significa que o vídeo foi removido.' : 'A conexão está lenta. Tente de novo em instantes.') : m.lbl+'.'}</div>
    <div class="ex-fail-a">
      ${conexao ? `<button class="btn btn-primary" onclick="mtTentarVideo()">Tentar de novo</button>` : ''}
      <a class="btn ${conexao?'btn-ghost':'btn-primary'}" href="${mtEsc(_buscaSemelhante(info))}" target="_blank" rel="noopener">Buscar vídeo semelhante</a>
      ${conexao ? '' : `<button class="btn btn-ghost" id="ex-rep-btn" onclick="mtReportarVideo('${mtJsStr(v.k)}','${mtJsStr(info.nome)}','${mtJsStr(String(cod))}')">Avisar o treinador</button>`}
    </div></div>`;
  const b = $('ex-som'); if(b) b.style.display = 'none';
}
function mtTentarVideo(){
  const v = MT_PLAYER.v, info = MT_PLAYER.info; if(!v) return;
  const st = $('ex-stage'); if(!st) return;
  st.classList.remove('falha'); st.innerHTML = `<div class="ex-load" id="ex-load"><div class="ex-spin"></div><span>Carregando vídeo…</span></div><div id="ex-yt"></div>`;
  const b = $('ex-som'); if(b) b.style.display = '';
  mtMontarPlayer(v, info);
}

// --- Denúncia de vídeo indisponível ---
// Firestore:
//   videosReportados/{exId}               → 1 documento por exercício (agrupa as denúncias; sem dados pessoais)
//   videosReportados/{exId}/relatos/{uid} → 1 por aluno (o mesmo aluno não conta duas vezes no mesmo ciclo)
// "ciclo" aumenta quando o administrador principal marca como resolvido: um relato novo depois disso conta de novo.
async function mtReportarVideo(exId, nome, cod){
  const url = videoLinks[exId] || '';
  const chaveLocal = 'mt_vrep_'+exId+'_'+(ytVideoId(url)||'x');
  if(mtLS(chaveLocal)){ toast('Você já avisou o treinador sobre este vídeo. Obrigado!'); return; }
  if(!fbUser){ toast('Entre na sua conta para avisar o treinador.'); return; }
  if(navigator.onLine === false){ toast('Sem conexão agora. Tente avisar quando a internet voltar.'); return; }
  const aberto = $('modal-back').classList.contains('on');
  const btn = aberto ? $('ex-rep-btn') : null; if(btn){ if(btn.disabled){ toast('O aviso já foi enviado.'); return; } btn.disabled = true; btn.textContent = 'Enviando…'; }
  const ref = db.collection('videosReportados').doc(exId);
  try{
    const [pai, meu] = await Promise.all([ ref.get(), ref.collection('relatos').doc(fbUser.uid).get() ]);
    const d = pai.exists ? pai.data() : null;
    const ciclo = (d && d.ciclo) || 1;
    const jaContou = meu.exists && (meu.data().ciclo||1) === ciclo;
    const agora = Date.now();
    const achado = (typeof exPorNome==='function') ? exPorNome(nome) : null;
    const inc = firebase.firestore.FieldValue && firebase.firestore.FieldValue.increment;
    const batch = db.batch();
    batch.set(ref.collection('relatos').doc(fbUser.uid), {
      uid: fbUser.uid, email: (state.user&&state.user.email)||'', nome: (state.user&&state.user.profile&&state.user.profile.nickname)||(state.user&&state.user.name)||'',
      em: agora, ciclo, motivo: String(cod||'manual'), url
    });
    const dados = { exId, exercicio: nome, grupo: (achado&&achado.grupo)||'', url, videoId: ytVideoId(url)||'', status:'pendente', ultimoEm: agora, ultimoMotivo: String(cod||'manual') };
    if(!d){ dados.primeiroEm = agora; dados.ciclo = 1; dados.contagem = 1; }
    else if(!jaContou){ dados.contagem = inc ? inc(1) : ((d.contagem||0)+1); }
    batch.set(ref, dados, {merge:true});
    await batch.commit();
    mtLS(chaveLocal, String(agora));
    toast('✅ Treinador avisado. Obrigado por ajudar!');
    if(btn){ btn.textContent = 'Treinador avisado ✓'; }
  }catch(e){
    console.log('denúncia de vídeo:', e);
    toast('⚠️ Não consegui enviar agora. Tente de novo em instantes.');
    if(btn){ btn.disabled = false; btn.textContent = 'Avisar o treinador'; }
  }
}

// --- Painel do administrador: vídeos reportados ---
let vidRepCache = [];
async function loadVideosReportados(){
  const snap = await db.collection('videosReportados').get();
  const arr = []; snap.forEach(d=>arr.push(Object.assign({id:d.id}, d.data())));
  vidRepCache = arr; return arr;
}
function _admVidBadge(){
  const n = vidRepCache.filter(x=>x.status!=='resolvido').length;
  const el = $('adm-vid-badge'); if(el){ el.textContent = n; el.style.display = n ? '' : 'none'; }
}
async function openVideosReportados(filtro){
  filtro = filtro || window.__vrFiltro || 'pendente'; window.__vrFiltro = filtro;
  $('modal-inner').innerHTML = `<h3>Vídeos reportados</h3><div class="mt-loading"><div class="ex-spin"></div><span>Carregando ocorrências…</span></div>`;
  $('modal-back').classList.add('on');
  try{ await loadVideosReportados(); }
  catch(e){
    $('modal-inner').innerHTML = `<h3>Vídeos reportados</h3><p class="mt-muted">Não consegui ler as ocorrências. Confira a conexão e se as regras do Firestore desta versão foram publicadas (coleção <b>videosReportados</b>).</p><button class="btn btn-primary btn-block" onclick="openVideosReportados()">Tentar de novo</button><button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
    return;
  }
  _admVidBadge();
  const princ = mtAdmin();
  const lista = vidRepCache.filter(x=> filtro==='todos' ? true : filtro==='resolvido' ? x.status==='resolvido' : x.status!=='resolvido')
    .sort((a,b)=> (a.status==='resolvido') - (b.status==='resolvido') || (b.contagem||0)-(a.contagem||0) || (b.ultimoEm||0)-(a.ultimoEm||0));
  const pend = vidRepCache.filter(x=>x.status!=='resolvido').length;
  const chip = (k,l)=>`<button type="button" class="nxchip ${k===filtro?'on':''}" onclick="openVideosReportados('${k}')">${l}</button>`;
  const linha = x=>{
    const m = VID_MOTIVO[String(x.ultimoMotivo)] || {lbl:x.ultimoMotivo||'—'};
    const mudou = x.url && videoLinks[x.id] && videoLinks[x.id] !== x.url;
    return `<div class="vr-item">
      <div style="display:flex;gap:10px;align-items:flex-start">
        <div class="vr-n">${x.contagem||1}</div>
        <div style="flex:1;min-width:0"><b style="font-size:14px">${mtEsc(x.exercicio||x.id)}</b>
          <div class="mt-muted" style="font-size:11.5px">${mtEsc(x.grupo||'')}${x.grupo?' · ':''}${mtEsc(m.lbl)} · último aviso ${x.ultimoEm?mtFmtData(x.ultimoEm,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—'}</div>
          <div style="font-size:11.5px;margin-top:3px;word-break:break-all"><a href="${mtEsc(x.url||'#')}" target="_blank" rel="noopener" style="color:var(--primary-2)">${mtEsc(x.url||'sem link')}</a></div>
          ${mudou?`<div style="font-size:11.5px;color:var(--accent);margin-top:3px">O link deste exercício já foi trocado depois dos avisos.</div>`:''}
        </div>
        <span class="pill ${x.status==='resolvido'?'':'on'}">${x.status==='resolvido'?'resolvido':'pendente'}</span>
      </div>
      <div class="vr-a">
        <button class="btn btn-ghost" onclick="mtVerRelatos('${mtJsStr(x.id)}')">Quem avisou</button>
        <button class="btn btn-ghost" onclick="closeModal();setTimeout(()=>openExerciseSheet('${mtJsStr(x.exercicio||x.id)}','${mtJsStr(x.id)}'),80)">Abrir exercício</button>
        ${princ?`<button class="btn btn-ghost" onclick="mtEditarLinkVideo('${mtJsStr(x.id)}')">Trocar link</button>`:''}
        ${princ && x.status!=='resolvido'?`<button class="btn btn-primary" onclick="mtResolverVideo('${mtJsStr(x.id)}')">Marcar resolvido</button>`:''}
      </div></div>`;
  };
  $('modal-inner').innerHTML = `<h3>Vídeos reportados</h3>
    <p class="mt-muted" style="margin:0 0 10px">${pend ? `<b>${pend}</b> ${pend===1?'vídeo com problema':'vídeos com problema'}. Cada exercício aparece uma vez só, com o número de alunos que avisaram.` : 'Nenhum vídeo pendente. 👌'}</p>
    <div class="nxchips" style="margin-bottom:10px">${chip('pendente','Pendentes')}${chip('resolvido','Resolvidos')}${chip('todos','Todos')}</div>
    <div style="max-height:56vh;overflow-y:auto">${lista.map(linha).join('') || '<div class="mt-muted" style="padding:14px 0;text-align:center">Nada por aqui.</div>'}</div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
}
async function mtVerRelatos(exId){
  $('modal-inner').innerHTML = `<h3>Quem avisou</h3><div class="mt-loading"><div class="ex-spin"></div><span>Carregando…</span></div>`;
  try{
    const snap = await db.collection('videosReportados').doc(exId).collection('relatos').get();
    const arr = []; snap.forEach(d=>arr.push(d.data())); arr.sort((a,b)=>(b.em||0)-(a.em||0));
    const x = vidRepCache.find(v=>v.id===exId) || {};
    $('modal-inner').innerHTML = `<h3>${mtEsc(x.exercicio||exId)}</h3>
      <div class="card" style="padding:6px 12px;max-height:50vh;overflow:auto">${arr.map(r=>`<div class="ev-list-item"><div style="flex:1;min-width:0"><b style="font-size:13px">${mtEsc(r.nome||r.email||'Aluno')}</b><div class="mt-muted" style="font-size:11.5px">${mtEsc(r.email||'')} · ${r.em?mtFmtData(r.em,{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):''}</div></div><span class="pill">${mtEsc((VID_MOTIVO[String(r.motivo)]||{lbl:r.motivo}).lbl)}</span>${(r.ciclo||1)!==(x.ciclo||1)?'<span class="pill" style="margin-left:4px">antes da última correção</span>':''}</div>`).join('') || '<div class="mt-muted" style="padding:10px 0">Sem relatos.</div>'}</div>
      <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openVideosReportados()">Voltar</button>`;
  }catch(e){ toast('⚠️ Não consegui carregar os relatos.'); openVideosReportados(); }
}
function mtEditarLinkVideo(exId){
  if(!mtAdmin()){ toast('🔒 Somente administradores.'); return; }
  const x = vidRepCache.find(v=>v.id===exId) || {id:exId};
  $('modal-inner').innerHTML = `<h3>Trocar vídeo</h3><p class="mt-muted" style="margin:0 0 6px"><b>${mtEsc(x.exercicio||exId)}</b></p>
    <div class="adm-form"><label>Link atual</label><div style="font-size:12px;word-break:break-all;color:var(--text-dim)">${mtEsc(videoLinks[exId]||x.url||'—')}</div>
    <label>Novo link do YouTube</label><input class="input" id="vr-url" inputmode="url" placeholder="https://youtube.com/..." value="">
    <label>Perfil do criador (crédito, opcional)</label><input class="input" id="vr-cred" inputmode="url" value="${mtEsc(videoCredits[exId]||'')}"></div>
    <a class="btn btn-ghost btn-block" style="margin-top:10px" href="${mtEsc(_buscaSemelhante({nome:x.exercicio||exId, grupo:x.grupo, equip:(exPorNome(x.exercicio||'')||{ex:{}}).ex.equip||[]}))}" target="_blank" rel="noopener">Procurar no YouTube ↗</a>
    <button class="btn btn-primary btn-block" style="margin-top:8px" id="vr-salvar" onclick="mtSalvarLinkVideo('${mtJsStr(exId)}')">Salvar e marcar resolvido</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openVideosReportados()">Voltar</button>`;
}
async function mtSalvarLinkVideo(exId){
  if(!mtAdmin()) return;
  const url = $('vr-url').value.trim(), cred = $('vr-cred').value.trim();
  if(!ytVideoId(url)){ toast('⚠️ Cole um link de vídeo do YouTube válido'); return; }
  if(cred && !/^https?:\/\//i.test(cred)){ toast('⚠️ O link do perfil precisa começar com http:// ou https://'); return; }
  await mtComBotao('vr-salvar', 'Salvando…', async ()=>{
    const x = vidRepCache.find(v=>v.id===exId) || {};
    const data = { nome: x.exercicio || exId, url, atualizadoEm: Date.now() }; if(cred) data.credito = cred;
    await db.collection('videosExercicios').doc(exId).set(data, {merge:true});
    videoLinks[exId] = url; if(cred) videoCredits[exId] = cred;
    mtLS('metatreino_videos', JSON.stringify(videoLinks));
    await _resolver(exId, 'link substituído');
    toast('✅ Vídeo trocado e ocorrência resolvida');
    openVideosReportados();
  });
}
async function _resolver(exId, como){
  const x = vidRepCache.find(v=>v.id===exId) || {};
  await db.collection('videosReportados').doc(exId).set({ status:'resolvido', resolvidoEm: Date.now(), resolvidoPor: state.user.email, resolucao: como||'', ciclo: (x.ciclo||1)+1, contagem: 0, contagemAnterior: x.contagem||0 }, {merge:true});
}
function mtResolverVideo(exId){
  if(!mtAdmin()) return;
  appConfirm('Marque como resolvido depois de corrigir ou substituir o vídeo. Se algum aluno avisar de novo, a ocorrência volta como pendente.', async ()=>{
    try{ await _resolver(exId, 'marcado como resolvido'); toast('✅ Ocorrência resolvida'); }catch(e){ toast('⚠️ O Firestore recusou. Confira as regras publicadas.'); }
    openVideosReportados();
  }, {title:'Marcar como resolvido?', emo:'🎬', okLabel:'Resolvido', onCancel:()=>openVideosReportados()});
}
// (Beta 13) manutenção dos links volta a ser de todos os administradores — sem trava extra aqui.

// =====================================================================
// 14. CARREGAMENTOS · 15. HOME · 16. ALIMENTAÇÃO · 17. GRÁFICOS (Beta 11)
// =====================================================================

// ---------- 14. CARREGAMENTOS E OPERAÇÕES ----------
// Botão ocupado: desabilita, mostra o que está acontecendo e impede clique duplo.
async function mtComBotao(btn, rotulo, fn){
  const el = typeof btn==='string' ? $(btn) : btn;
  if(el && el.dataset.ocupado === '1') return;
  const antes = el ? el.innerHTML : '';
  if(el){ el.dataset.ocupado = '1'; el.disabled = true; el.innerHTML = `<span class="btn-spin"></span>${rotulo||'Aguarde…'}`; }
  try{ return await fn(); }
  catch(e){ console.log(e); toast(navigator.onLine===false ? '📴 Sem conexão. Nada foi perdido — tente de novo quando a internet voltar.' : '⚠️ Não foi possível concluir. Tente de novo.'); }
  finally{ if(el && document.body.contains(el)){ el.dataset.ocupado = ''; el.disabled = false; el.innerHTML = antes; } }
}
// Operações assíncronas do painel e do aluno: um segundo toque enquanto a primeira roda é ignorado.
function mtSemDuplicar(nome){
  const orig = window[nome]; if(typeof orig !== 'function' || orig.__semDup) return;
  let rodando = false;
  const w = async function(){ if(rodando) return; rodando = true; try{ return await orig.apply(this, arguments); } finally{ rodando = false; } };
  w.__semDup = true; window[nome] = w;
}
['doAddStudent','saveVideoLink','clearVideoLink','saveNewExercise','saveMural','saveCoachContact','saveSpecialAward','salvarEventoAdmin','admSetAdmin','adjustDays','toggleStudent','saveRunLog','saveActivityLog','saveHistoryEntry'].forEach(mtSemDuplicar);

// Indicador discreto de sincronização (só aparece quando há algo a dizer)
const MT_SYNC = { el:null, t:null };
function mtSyncPill(txt, tipo, ms){
  if(!MT_SYNC.el){ MT_SYNC.el = document.createElement('div'); MT_SYNC.el.id = 'mt-sync'; MT_SYNC.el.setAttribute('role','status'); document.body.appendChild(MT_SYNC.el); }
  clearTimeout(MT_SYNC.t);
  if(!txt){ MT_SYNC.el.classList.remove('on'); return; }
  MT_SYNC.el.className = 'on '+(tipo||'');
  MT_SYNC.el.innerHTML = (tipo==='sync'?'<span class="btn-spin"></span>':'') + txt;
  if(ms) MT_SYNC.t = setTimeout(()=>mtSyncPill(''), ms);
}
window.addEventListener('offline', ()=>{ if(fbUser) mtSyncPill('Sem conexão · suas alterações ficam salvas neste aparelho', 'off'); });
window.addEventListener('online', ()=>{
  if(!fbUser){ mtSyncPill(''); return; }
  mtSyncPill('Sincronizando suas informações…', 'sync');
  try{ syncToCloud(); }catch(e){}
  const fim = ()=>mtSyncPill('Informações sincronizadas', 'ok', 2200);
  try{ (db.waitForPendingWrites ? db.waitForPendingWrites() : Promise.resolve()).then(fim, fim); }catch(e){ fim(); }
});

// Montagem de planos: mesma função e mesmos passos REAIS de antes (buildingSteps), agora como lista
// que vai sendo concluída, nas cores do tema escolhido. A barra mostra etapas concluídas (não inventa %).
runBuildingScreen = function(m, steps, done, opts){
  opts = opts || {};
  if(steps.length > 6){
    const r = steps.map((x,idx)=>({x, idx, pri:x.pri||2})).sort((a,b)=>a.pri-b.pri || a.idx-b.idx).slice(0,6).map(o=>o.idx).sort((a,b)=>a-b);
    steps = r.map(i=>steps[i]);
  }
  let ov = document.getElementById('building-ov');
  if(!ov){ ov = document.createElement('div'); ov.id = 'building-ov'; document.body.appendChild(ov); }
  ov.className = 'mt-build'; ov.removeAttribute('style');
  const titulo = String(opts.titulo || (m==='lift' ? 'Preparando seu plano de treinamento' : 'Preparando seu plano de corrida')).replace(/^\S+\s(?=[A-ZÁÉÍÓÚ])/,'');
  ov.innerHTML = `<div class="mb-box"><div class="mb-spin"></div><div class="mb-t">${titulo}</div><div class="mb-s">${opts.sub || 'Organizando exercícios, dias e progressão com base nas suas escolhas.'}</div>
    <ol class="mb-list">${steps.map((s,i)=>`<li id="mb-${i}"><span class="mb-ck"></span><span class="mb-tx">${s.txt}</span></li>`).join('')}</ol>
    <div class="mb-bar"><i id="mb-bar"></i></div><div class="mb-n" id="mb-n">0 de ${steps.length} etapas</div></div>`;
  requestAnimationFrame(()=>ov.classList.add('on'));
  const passo = Math.min(opts.passo || 900, 1100);
  let i = 0;
  const tick = ()=>{
    if(i > 0){ const prev = $('mb-'+(i-1)); if(prev){ prev.classList.remove('now'); prev.classList.add('ok'); } }
    const bar = $('mb-bar'), n = $('mb-n');
    if(bar) bar.style.width = Math.round(i/steps.length*100)+'%';
    if(n) n.textContent = `${i} de ${steps.length} etapas`;
    if(i >= steps.length){
      setTimeout(()=>{ ov.classList.remove('on'); setTimeout(()=>{ ov.className=''; ov.innerHTML=''; ov.setAttribute('style','display:none'); if(typeof done==='function') done(); }, 260); }, 450);
      return;
    }
    const li = $('mb-'+i); if(li) li.classList.add('now');
    i++; setTimeout(tick, passo);
  };
  setTimeout(tick, 250);
};

// Painel admin: erro de carregamento vira mensagem clara com "Tentar de novo" (antes ficava "Carregando…")
mtGancho('goAdmin', { depois(){
  try{
    if(!admLoaded){
      $('adm-list').innerHTML = `<div class="card" style="text-align:center"><b>Não consegui carregar os alunos.</b><div class="mt-muted" style="margin:6px 0 12px">${navigator.onLine===false?'Você está sem internet.':'Pode ser conexão lenta ou permissão do Firestore.'}</div><button class="btn btn-primary" id="adm-retry" onclick="mtComBotao('adm-retry','Carregando…',()=>goAdmin())">Tentar de novo</button></div>`;
    }
    _admLinhaVideos();
    loadVideosReportados().then(_admVidBadge).catch(()=>{});
  }catch(e){}
}});
function _admLinhaVideos(){
  if($('adm-vid-row')) return;
  const ref = $('adm-ev-row') || [...document.querySelectorAll('#scr-admin .list-row')].find(r=>/Feedback|Mensagens dos alunos/.test(r.textContent)); if(!ref) return;
  const a = document.createElement('div'); a.className = 'list-row'; a.id = 'adm-vid-row'; a.onclick = ()=>openVideosReportados('pendente');
  a.innerHTML = '🎬 <span>Vídeos reportados</span><span id="adm-vid-badge" style="display:none;margin-left:auto;background:var(--danger);color:#fff;font-size:11px;font-weight:800;border-radius:99px;padding:2px 8px">0</span>';
  ref.after(a);
}

// ---------- 15. HOME: seções recolhíveis e avisos compactos ----------
function mtColAberto(k, padrao){ const v = mtLS('mt_col_'+k); return v===null || v===undefined ? padrao : v==='1'; }
function mtColToggle(k){ const novo = !mtColAberto(k, k!=='treinos'); mtLS('mt_col_'+k, novo?'1':'0'); _mtAplicaColapsos(); }
function _mtAplicaColapsos(){
  const wrap = document.querySelector('#scr-home .wrap'); if(!wrap) return;
  // "Seus treinos": o mesmo conteúdo da aba Treinos → começa recolhido, com um resumo
  const head = wrap.querySelector(':scope > .section-head'); const lista = $('your-list');
  if(head && lista){
    const aberto = mtColAberto('treinos', false);
    let resumo = $('home-tr-resumo');
    if(!resumo){ resumo = document.createElement('div'); resumo.id = 'home-tr-resumo'; resumo.className = 'col-resumo'; lista.after(resumo); }
    const mod = state.modules[state.active]; const n = (mod && mod.plan && (mod.plan.workouts||[]).length) || lista.children.length;
    resumo.innerHTML = aberto ? '' : `${n} ${n===1?'treino':'treinos'} no plano · toque em “Mostrar” para ver a lista`;
    resumo.style.display = aberto ? 'none' : '';
    lista.style.display = aberto ? '' : 'none';
    let b = head.querySelector('.col-btn');
    if(!b){ b = document.createElement('button'); b.type='button'; b.className = 'col-btn'; b.onclick = ()=>mtColToggle('treinos'); head.insertBefore(b, head.lastElementChild); }
    b.textContent = aberto ? 'Recolher' : 'Mostrar';
  }
  // Atividade da semana: pode recolher para só o título e o placar
  const q = $('home-quick');
  if(q && q.firstElementChild){
    const aberto = mtColAberto('semana', true);
    q.classList.toggle('mt-col', !aberto);
    let b = q.querySelector(':scope > .col-btn');
    if(!b){ b = document.createElement('button'); b.type='button'; b.className='col-btn col-abs'; b.onclick = e=>{ e.stopPropagation(); mtColToggle('semana'); }; q.appendChild(b); }
    b.textContent = aberto ? 'Recolher' : 'Mostrar';
    b.setAttribute('aria-expanded', aberto?'true':'false');
  }
  // avisos longos: 2 linhas + "ver mais"
  ['card-missed','card-weekrecap','card-coach-msg'].forEach(id=>{
    const c = $(id); if(!c || c.classList.contains('hidden')) return;
    const sub = c.querySelector('.card-sub'); if(!sub || sub.dataset.clamp) return;
    if((sub.textContent||'').length < 140) return;
    sub.dataset.clamp = '1'; sub.classList.add('clamp2');
    const mais = document.createElement('button'); mais.type='button'; mais.className='link-mais'; mais.textContent='ver mais';
    mais.onclick = e=>{ e.stopPropagation(); const fech = sub.classList.toggle('clamp2'); mais.textContent = fech ? 'ver mais' : 'ver menos'; };
    sub.after(mais);
  });
}

// ---------- 16. ALIMENTAÇÃO NA HOME ----------
// Usa o plano que o app já calcula (estimativa educativa, não substitui nutricionista). Nada é inventado:
// sem cadastro suficiente → estado vazio; refeições marcadas = as que o aluno marcou de verdade.
function nutriHoje(){
  if(!state.nutri) return { vazio:'novo' };
  let pl; try{ pl = nutriMontarPlano(getDayIdx()); }catch(e){ return { vazio:'erro' }; }
  if(!pl || pl.erro || !pl.refeicoes) return { vazio:'dados', msg: pl && pl.erro };
  const log = nutriLogDe(chaveDia(new Date()));
  const ref = pl.refeicoes.map(r=>Object.assign({}, r, { ok: log(r.id).ok }));
  const agoraMin = new Date().getHours()*60 + new Date().getMinutes();
  const min = h=>{ const [a,b] = String(h||'00:00').split(':').map(Number); return a*60+(b||0); };
  const prox = ref.find(r=>!r.ok && min(r.hora) >= agoraMin - 60) || ref.find(r=>!r.ok) || null;
  return { ref, feitas: ref.filter(r=>r.ok).length, total: ref.length, prox, kcal: pl.calc && pl.calc.kcal };
}
function nutriMarcarHome(id){
  const m = nutriMealLog(id, true, chaveDia(new Date())); m.ok = !m.ok;
  try{ Object.keys(state.nutriLog).sort().slice(0,-30).forEach(x=>delete state.nutriLog[x]); }catch(e){}
  try{ nutriLimpa(id); }catch(e){}
  saveData(); renderHomeMetrics();
  toast(m.ok ? '✅ Refeição marcada' : 'Marcação desfeita');
}
function _nutriTile(){
  const t = document.querySelector('#home-metrics .met[onclick="openNutri()"]'); if(!t) return;
  const h = nutriHoje();
  t.classList.add('met-nutri');
  if(h.vazio){
    const msg = h.msg==='menor' ? 'Plano alimentar disponível a partir de 18 anos' : h.vazio==='dados' ? 'Complete peso, altura, idade e sexo no perfil' : 'Nenhum plano alimentar disponível';
    t.innerHTML = `<div class="met-h"><i>🥗</i>Alimentação</div><div class="met-empty">${msg}</div><div class="met-s">${h.msg==='menor'?'Converse com um nutricionista':'Toque para ver detalhes'}</div>`;
    return;
  }
  const pct = h.total ? Math.round(h.feitas/h.total*100) : 0;
  t.innerHTML = `<div class="met-h"><i>🥗</i>Alimentação</div>
    ${h.prox ? `<div class="met-next"><small>Próxima · ${mtEsc(h.prox.hora||'')}</small><b>${mtEsc(h.prox.nome)}</b></div>` : `<div class="met-next"><small>Hoje</small><b>Refeições concluídas</b></div>`}
    <div class="act-bar" style="margin:0"><i style="width:${pct}%;background:var(--primary)"></i></div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><span class="met-s">${h.feitas} de ${h.total}</span>${h.prox?`<button class="aguabtn" onclick="event.stopPropagation();nutriMarcarHome('${h.prox.id}')" aria-label="Marcar ${mtEsc(h.prox.nome)} como feita">✓ Feita</button>`:''}</div>`;
}
mtGancho('renderHomeMetrics', { depois(){ try{ _nutriTile(); }catch(e){ console.log('nutri tile', e); } }});
// histórico honesto no plano alimentar: refeições MARCADAS (não marcar não quer dizer que não comeu)
const _openNutriB11 = openNutri;
window.openNutri = function(){
  const r = _openNutriB11.apply(this, arguments);
  try{
    const total = (state.nutri && state.nutri.refeicoes) || 5;
    const dias = []; for(let i=6;i>=0;i--){ const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-i); const dk = chaveDia(d); const dia = (state.nutriLog||{})[dk]||{}; const n = Object.values(dia).filter(x=>x===true || (x && x.ok)).length; dias.push({d, n}); }
    if(dias.some(x=>x.n>0)){
      const h3 = document.querySelector('#modal-inner h3');
      const box = document.createElement('div'); box.className = 'nutri-hist';
      box.innerHTML = `<div class="mt-muted" style="font-size:11.5px;margin-bottom:6px">Refeições marcadas nos últimos 7 dias</div><div class="nh-row">${dias.map(x=>`<div class="nh-d" title="${x.n} de ${total}"><i style="height:${Math.max(4, Math.round(Math.min(1,x.n/total)*36))}px;${x.n?'':'opacity:.25'}"></i><span>${['D','S','T','Q','Q','S','S'][x.d.getDay()]}</span></div>`).join('')}</div>`;
      if(h3) h3.after(box);
    }
  }catch(e){}
  return r;
};

// ---------- 17. GRÁFICOS ----------
// Componente único (SVG com proporção fixa, eixos com unidade, toque mostra o valor, cores do tema).
// Os dados vêm só dos registros reais. Períodos sem registro aparecem como zero em barras de contagem
// (zero treinos é um fato) — mas em peso e ritmo não se desenha ponto onde não houve medição.
const MT_MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
function _niceMax(v){ if(v<=0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v/p; return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p; }
function _fmtNum(v, dec){ return (+v).toLocaleString('pt-BR', {maximumFractionDigits: dec==null?1:dec, minimumFractionDigits:0}); }
function mtChart(cfg){
  // cfg: {tipo:'bar'|'line', pts:[{v, rot, tip}], un, meta, dec, fmt, inverter}
  const W = 340, H = 170, L = 34, R = 8, T = 12, B = 24;
  const pts = cfg.pts; const vals = pts.map(p=>p.v).filter(v=>v!=null);
  if(!vals.length) return '';
  let max = Math.max(...vals, cfg.meta||0), min = cfg.tipo==='line' ? Math.min(...vals) : 0;
  if(cfg.tipo==='line'){ const pad = Math.max((max-min)*0.15, (cfg.dec===0?1:0.5)); max += pad; min = Math.max(0, min-pad); }
  else { max = _niceMax(max); if(cfg.dec===0 && max>1 && max%2) max += 1; }
  const rng = (max-min) || 1;
  const x = i => L + (pts.length===1 ? (W-L-R)/2 : i*(W-L-R)/(pts.length-1));
  const y = v => T + (1-(v-min)/rng)*(H-T-B);
  const fmt = cfg.fmt || (v=>_fmtNum(v, cfg.dec));
  const axf = cfg.axFmt || fmt;
  let g = '';
  [0,0.5,1].forEach(f=>{ const v = min + rng*f; const yy = y(v); g += `<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" class="ch-grid"/><text x="${L-5}" y="${yy+3.5}" class="ch-ax" text-anchor="end">${axf(cfg.tipo==='line'?v:Math.round(v*10)/10)}</text>`; });
  const step = Math.max(1, Math.ceil(pts.length/5));
  pts.forEach((p,i)=>{ if(i%step===0 || i===pts.length-1 && (pts.length-1)%step>step/2) g += `<text x="${cfg.tipo==='bar'? L + (i+0.5)*(W-L-R)/pts.length : x(i)}" y="${H-7}" class="ch-ax" text-anchor="middle">${mtEsc(p.rot)}</text>`; });
  if(cfg.meta){ const ym = y(cfg.meta); g += `<line x1="${L}" x2="${W-R}" y1="${ym}" y2="${ym}" class="ch-meta"/><text x="${W-R}" y="${ym-4}" class="ch-ax" text-anchor="end">meta ${fmt(cfg.meta)}</text>`; }
  let marks = '';
  if(cfg.tipo==='bar'){
    const bw = (W-L-R)/pts.length;
    pts.forEach((p,i)=>{ const v = p.v||0; const h = Math.max(v>0?2:0, (H-T-B)*(v-min)/rng); const bx = L + i*bw + bw*0.18;
      marks += `<rect x="${bx}" y="${H-B-h}" width="${bw*0.64}" height="${h}" rx="${Math.min(4,bw*0.2)}" class="ch-bar${i===pts.length-1?' cur':''}"/><rect x="${L+i*bw}" y="${T}" width="${bw}" height="${H-T-B}" class="ch-hit" data-tip="${mtEsc(p.tip)}"/>`; });
  } else {
    const ok = pts.map((p,i)=>p.v==null?null:[x(i), y(p.v)]).filter(Boolean);
    if(ok.length>1) marks += `<path d="M${ok.map(c=>c.join(' ')).join('L')}" class="ch-line"/>`;
    pts.forEach((p,i)=>{ if(p.v==null) return; marks += `<circle cx="${x(i)}" cy="${y(p.v)}" r="3.2" class="ch-dot"/><circle cx="${x(i)}" cy="${y(p.v)}" r="12" class="ch-hit" data-tip="${mtEsc(p.tip)}"/>`; });
  }
  return `<div class="ch-tip" aria-live="polite">Toque no gráfico para ver os valores</div><svg class="mt-ch" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" onclick="mtChartTip(event)">${g}${marks}</svg>`;
}
function mtChartTip(ev){
  const t = ev.target.closest && ev.target.closest('.ch-hit'); if(!t) return;
  const svg = t.ownerSVGElement; svg.querySelectorAll('.ch-hit.sel').forEach(x=>x.classList.remove('sel')); t.classList.add('sel');
  const tip = svg.previousElementSibling; if(tip) tip.innerHTML = t.getAttribute('data-tip');
}
// períodos
const MT_PER = { semana:{n:7, passo:'dia', lbl:'Semana', dias:7}, mes:{n:5, passo:'semana', lbl:'Mês', dias:35}, tri:{n:13, passo:'semana', lbl:'Trimestre', dias:91}, ano:{n:12, passo:'mes', lbl:'Ano', dias:365} };
function _buckets(per, voltar){
  const P = MT_PER[per]; const out = [];
  if(P.passo==='dia'){ const fim = mtDia0()+DIA_MS - (voltar?7*DIA_MS:0); for(let i=P.n-1;i>=0;i--){ const a = fim-(i+1)*DIA_MS; const d = new Date(a); out.push({a, b:a+DIA_MS, rot:['D','S','T','Q','Q','S','S'][d.getDay()], nome:d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'})}); } }
  else if(P.passo==='semana'){ const s0 = mtSemanaIni(Date.now()) - (voltar?P.n*7*DIA_MS:0); for(let i=P.n-1;i>=0;i--){ const a = s0 - i*7*DIA_MS; out.push({a, b:a+7*DIA_MS, rot:mtFmtData(a), nome:'semana de '+mtFmtData(a)}); } }
  else { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); if(voltar) d.setMonth(d.getMonth()-12); for(let i=P.n-1;i>=0;i--){ const a = new Date(d.getFullYear(), d.getMonth()-i, 1).getTime(); const b = new Date(d.getFullYear(), d.getMonth()-i+1, 1).getTime(); const m = new Date(a).getMonth(); out.push({a, b, rot:MT_MESES[m], nome:MT_MESES[m]+'/'+new Date(a).getFullYear()}); } }
  return out;
}
function _volumeEntre(a, b){
  let v = 0;
  Object.values(state.progress||{}).forEach(arr=>(arr||[]).forEach(p=>{ if(p.date>=a && p.date<b) v += (p.sets||[]).reduce((t,s)=>t+(+s.peso||0)*(+s.reps||0),0); }));
  const vistos = new Set(); Object.values(state.progress||{}).forEach(arr=>(arr||[]).forEach(p=>vistos.add(p.date)));
  Object.values(state.progResumo||{}).forEach(arr=>(arr||[]).forEach(r=>{ if(r && r.d>=a && r.d<b && !vistos.has(r.d)) v += (+r.v||0); }));
  return Math.round(v);
}
// métricas disponíveis (só aparecem se fizer sentido para o aluno)
function mtMetricas(){
  const h = mtHist();
  const tem = t=>h.some(x=>x._t===t);
  const M = [];
  M.push({k:'freq', lbl:'Frequência', tipo:'bar', un:'dias ativos', dec:0, pers:['mes','tri','ano'], serie:(bs)=>bs.map(b=>({v: mtDiasAtivos(b.a,b.b).size, b})), soma:true, meta: ()=>contextoAluno().planejados, metaPasso:'semana', mais:'mais dias ativos'});
  M.push({k:'tempo', lbl:'Tempo de treino', tipo:'bar', un:'min', dec:0, pers:['semana','mes','tri','ano'], serie:(bs)=>bs.map(b=>({v: Math.round(h.filter(x=>x.at>=b.a&&x.at<b.b).reduce((s,x)=>s+(+x.duration||0),0)), b})), soma:true});
  if((state.weights||[]).length) M.push({k:'peso', lbl:'Peso', tipo:'line', un:'kg', dec:1, pers:['mes','tri','ano'], pontos:true});
  if(state.modules.lift) M.push({k:'volume', lbl:'Volume (musculação)', tipo:'bar', un:'kg', dec:0, pers:['semana','mes','tri','ano'], serie:(bs)=>bs.map(b=>({v:_volumeEntre(b.a,b.b), b})), soma:true, axFmt:v=>v>=1000?_fmtNum(v/1000,1)+' mil':_fmtNum(v,0)});
  const km = t=>(bs)=>bs.map(b=>({v: Math.round(h.filter(x=>x._t===t && x.at>=b.a && x.at<b.b).reduce((s,x)=>s+(+x.distance||0),0)*10)/10, b}));
  if(tem('corrida')){ M.push({k:'run', lbl:'Corrida (km)', tipo:'bar', un:'km', dec:1, pers:['semana','mes','tri','ano'], serie:km('corrida'), soma:true}); M.push({k:'pace', lbl:'Ritmo da corrida', tipo:'line', un:'min/km', dec:2, pers:['mes','tri','ano'], pontos:true, menorMelhor:true, fmt:v=>mtPaceStr(v).replace('/km','')}); }
  if(tem('caminhada')) M.push({k:'walk', lbl:'Caminhada (km)', tipo:'bar', un:'km', dec:1, pers:['semana','mes','tri','ano'], serie:km('caminhada'), soma:true});
  if(tem('bike')){ M.push({k:'bike', lbl:'Bike (km)', tipo:'bar', un:'km', dec:1, pers:['semana','mes','tri','ano'], serie:km('bike'), soma:true}); M.push({k:'bikev', lbl:'Velocidade na bike', tipo:'line', un:'km/h', dec:1, pers:['mes','tri','ano'], pontos:true}); }
  return M;
}
function _pontosLinha(k, a, b){
  if(k==='peso') return (state.weights||[]).filter(w=>w.weight>0 && w.date>=a && w.date<b).sort((x,y)=>x.date-y.date).map(w=>({t:w.date, v:+w.weight}));
  const h = mtHist();
  if(k==='pace') return h.filter(x=>x._t==='corrida' && +x.distance>0 && +x.duration>0 && x.at>=a && x.at<b).map(x=>({t:x.at, v:(+x.duration)/(+x.distance), extra:mtFmtKm(x.distance)+' km'}));
  if(k==='bikev') return h.filter(x=>x._t==='bike' && +x.distance>0 && +x.duration>0 && x.at>=a && x.at<b).map(x=>({t:x.at, v:(+x.distance)/((+x.duration)/60), extra:mtFmtKm(x.distance)+' km'}));
  return [];
}
function _desdeQuando(k){
  if(k==='peso'){ const w = (state.weights||[]).filter(x=>x.weight>0).map(x=>x.date); return w.length?Math.min(...w):null; }
  if(k==='volume'){ let m = Infinity; Object.values(state.progress||{}).forEach(a=>(a||[]).forEach(p=>m=Math.min(m,p.date))); Object.values(state.progResumo||{}).forEach(a=>(a||[]).forEach(r=>r&&(m=Math.min(m,r.d)))); return isFinite(m)?m:null; }
  const h = mtHist(); return h.length ? h[0].at : null;
}
function renderEvolucao(){
  const el = $('perf-evo'); if(!el) return;
  const M = mtMetricas();
  let k = mtLS('mt_evo_k') || 'freq'; if(!M.some(m=>m.k===k)) k = M[0].k;
  const m = M.find(x=>x.k===k);
  let per = mtLS('mt_evo_p') || 'mes'; if(!m.pers.includes(per)) per = m.pers.includes('mes') ? 'mes' : m.pers[0];
  const P = MT_PER[per];
  const fmt = m.fmt || (v=>_fmtNum(v, m.dec));
  const chips = M.map(x=>`<button type="button" class="nxchip ${x.k===k?'on':''}" onclick="mtLS('mt_evo_k','${x.k}');renderEvolucao()">${x.lbl}</button>`).join('');
  const pers = Object.keys(MT_PER).map(p=>`<button type="button" class="${p===per?'on':''}" ${m.pers.includes(p)?'':'disabled'} onclick="mtLS('mt_evo_p','${p}');renderEvolucao()">${MT_PER[p].lbl}</button>`).join('');
  const desde = _desdeQuando(k);
  const bs = _buckets(per), ant = _buckets(per, true);
  const ini = bs[0].a, fim = bs[bs.length-1].b;
  let corpo = '', comp = '', nota = '';
  const retencao = (m.k!=='peso' && m.k!=='volume' && per==='ano') ? (typeof arqNotaRetencao==='function' ? arqNotaRetencao() : '') : '';
  if(m.pontos){
    const ps = _pontosLinha(k, ini, fim);
    if(ps.length < 2){ corpo = _vazio(m, ps.length); }
    else {
      const pts = ps.map(p=>({v:p.v, rot: per==='ano' ? MT_MESES[new Date(p.t).getMonth()] : mtFmtData(p.t), tip:`<b>${fmt(p.v)} ${m.un}</b> · ${new Date(p.t).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})}${p.extra?' · '+p.extra:''}`}));
      corpo = mtChart({tipo:'line', pts, un:m.un, dec:m.dec, fmt});
      const d = ps[ps.length-1].v - ps[0].v;
      const rel = ps[0].v ? d/ps[0].v : 0;
      const lbl = m.k==='peso' ? `${d>0?'+':d<0?'−':''}${_fmtNum(Math.abs(d),1)} kg no período` : (Math.abs(rel)<0.02 ? 'estável no período' : ((m.menorMelhor ? d<0 : d>0) ? 'melhorando no período' : 'piorando no período'));
      const det = m.k==='pace' ? ` (${mtPaceStr(ps[0].v)} → ${mtPaceStr(ps[ps.length-1].v)})` : m.k==='peso' ? ` (${_fmtNum(ps[0].v,1)} → ${_fmtNum(ps[ps.length-1].v,1)} kg)` : ` (${fmt(ps[0].v)} → ${fmt(ps[ps.length-1].v)} ${m.un})`;
      comp = `<div class="ch-comp"><span class="ch-trend ${m.k==='peso'?'neu':(Math.abs(rel)<0.02?'neu':((m.menorMelhor ? d<0 : d>0)?'up':'dn'))}">${lbl}</span>${det}</div>`;
    }
  } else {
    const s = m.serie(bs), sa = m.serie(ant);
    const naoZero = s.filter(x=>x.v>0).length;
    if(naoZero < 2){ corpo = _vazio(m, naoZero); }
    else {
      const pts = s.map(x=>({v:x.v, rot:x.b.rot, tip:`<b>${fmt(x.v)} ${m.un}</b> · ${x.b.nome}`}));
      const meta = (m.meta && P.passo===m.metaPasso) ? m.meta() : null;
      corpo = mtChart({tipo:'bar', pts, un:m.un, dec:m.dec, fmt, meta, axFmt:m.axFmt});
      const tot = s.reduce((a,x)=>a+x.v,0), totA = sa.reduce((a,x)=>a+x.v,0);
      const temAnterior = desde && desde < ini - 3*DIA_MS;
      if(!temAnterior) comp = `<div class="ch-comp"><b>${fmt(tot)} ${m.un}</b> no período · ainda não há registros do período anterior para comparar</div>`;
      else { const rel = totA ? (tot-totA)/totA : 1; const cls = Math.abs(rel)<0.05 ? 'neu' : rel>0 ? 'up' : 'dn';
        comp = `<div class="ch-comp"><b>${fmt(tot)} ${m.un}</b> no período · <span class="ch-trend ${cls}">${cls==='neu'?'estável':(rel>0?'+':'−')+Math.round(Math.abs(rel)*100)+'%'}</span> vs. ${P.lbl==='Semana'?'semana':'período'} anterior (${fmt(totA)})</div>`; }
      if(meta) nota = `Linha tracejada: sua meta de ${meta} dias por semana.`;
    }
  }
  el.innerHTML = `<div class="chart-head" style="margin-bottom:8px"><div class="chart-title">Evolução</div></div>
    <div class="nxchips evo-chips">${chips}</div>
    <div class="seg-nav seg-sm">${pers}</div>
    <div class="ch-wrap">${corpo}</div>${comp}
    ${(nota||retencao)?`<div class="mt-muted" style="font-size:11.5px;margin-top:6px">${[nota, retencao].filter(Boolean).join(' ')}</div>`:''}`;
}
function _vazio(m, n){
  const quanto = m.k==='peso' ? 'pelo menos 2 pesagens' : m.pontos ? 'pelo menos 2 registros' : 'registros em pelo menos 2 '+'períodos';
  return `<div class="ch-empty"><b>Ainda não há dados suficientes</b><span>Para este gráfico são necessários ${quanto} neste intervalo${n?` (há ${n})`:''}. Isso não indica desempenho ruim — só falta histórico. Tente um período maior ou volte depois de registrar mais.</span></div>`;
}
mtGancho('renderPerf', { depois(){
  try{
    let el = $('perf-evo');
    if(!el){ el = document.createElement('div'); el.id = 'perf-evo'; el.className = 'chart-card'; const ref = document.querySelector('#scr-perf .chart-card'); if(ref) ref.before(el); }
    renderEvolucao();
  }catch(e){ console.log('evolução:', e); }
}});
// Perfil: gráfico do peso com o mesmo componente (período ajustável); o histórico completo continua a um toque
mtGancho('renderProfile', { depois(){
  try{
    const slot = $('pf-weight-chart-slot'); if(!slot) return;
    slot.removeAttribute('onclick');
    const per = mtLS('mt_pf_p') || 'tri';
    const ini = _buckets(per)[0].a;
    const ps = _pontosLinha('peso', ini, Date.now()+DIA_MS);
    const pers = ['mes','tri','ano'].map(p=>`<button type="button" class="${p===per?'on':''}" onclick="mtLS('mt_pf_p','${p}');renderProfile()">${MT_PER[p].lbl}</button>`).join('');
    const corpo = ps.length>=2 ? mtChart({tipo:'line', un:'kg', dec:1, pts: ps.map(p=>({v:p.v, rot: per==='ano'?MT_MESES[new Date(p.t).getMonth()]:mtFmtData(p.t), tip:`<b>${_fmtNum(p.v,1)} kg</b> · ${new Date(p.t).toLocaleDateString('pt-BR')}`}))})
      : _vazio({k:'peso', pontos:true}, ps.length);
    slot.innerHTML = `<div class="seg-nav seg-sm">${pers}</div><div class="ch-wrap">${corpo}</div><button type="button" class="btn btn-ghost btn-block" style="margin-top:8px;font-size:12.5px;padding:8px" onclick="openWeightHistory()">Ver todas as pesagens</button>`;
  }catch(e){ console.log('peso:', e); }
}});

// ---------- Tema: destaques que seguem a cor do tema ----------
// ✅ (feito) vira um "check" na cor do tema no modo de ícones de linha
try{
  ICO_SVG.check = '<path d="M5 12.5l4.2 4.2L19 7"/>';
  ICO_POR_EMOJI['✅'] = 'check'; ICO_POR_EMOJI['✔'] = 'check';
  ICO_MANTER.delete('✅'); ICO_MANTER.delete('✔');
  const _icoHtmlOrig = _icoHtml;
  _icoHtml = function(nome, extra){ return _icoHtmlOrig(nome, extra).replace('<i class="ico', `<i data-i="${nome}" class="ico`); };
}catch(e){}

// ---------- Perfil: Áudio dos vídeos ----------
mtGancho('renderProfile', { depois(){
  try{ const v = $('audio-row-val'); if(v) v.textContent = (videoMudoPref() ? 'Iniciar no mudo' : 'Áudio original') + ' ›'; }catch(e){}
}});

// ---------- Home: aplica os refinamentos depois de cada desenho ----------
mtGancho('renderHome', { depois(){
  try{ _mtAplicaColapsos(); }catch(e){ console.log('colapsos:', e); }
}});

Object.assign(window, { setVideoAudio, openAudioVideos, mtAlternarSom, mtTentarVideo, mtReportarVideo, openVideosReportados, mtVerRelatos, mtEditarLinkVideo, mtSalvarLinkVideo, mtResolverVideo,
  mtComBotao, mtColToggle, nutriMarcarHome, renderEvolucao, mtChartTip, videoMudoPref });

// =====================================================================
// 18. CALISTENIA (Beta 12)
// Modalidade completa dentro do módulo de treino de força (state.modules.lift):
//   setup.modalidade = 'musculacao' | 'calistenia' | 'hibrido'
// Reaproveita o registro de séries, histórico, sequência, conquistas, desafios e gráficos.
// O que é próprio da calistenia: cadeias de progressão, posição do aluno em cada cadeia,
// domínio verificado antes de avançar, pré-requisitos das habilidades, equipamentos próprios.
// =====================================================================
const CALI_NIVEL = ['', 'Iniciante', 'Intermediário', 'Avançado', 'Especialista'];
const CALI_EQUIP_LBL = { barra:'barra fixa', paralelas:'paralelas', argolas:'argolas', elastico:'elástico', apoios:'apoios de flexão', banco:'banco/caixa', espaldar:'espaldar ou poste' };
// Cada item: [nome, nível 1-4, unidade r|t, equipamentos (precisa de UM deles; vazio = chão), grupo, faixa própria ('' = usa a do objetivo), músculos, execução[], erro comum, segurança]
// A ordem dentro da cadeia é a ordem de progressão (fácil → difícil).
const CALI_CADEIAS = [
 {id:'flexao', pad:'empurrar_h', area:'Superior', titulo:'Flexões', itens:[
  ['Flexão na parede',1,'r',[],'Peito','','Peitoral, tríceps e deltoide anterior',['Mãos na parede na altura do peito, corpo reto.','Aproxime o peito da parede dobrando os cotovelos a ~45°.','Empurre de volta sem perder o alinhamento.'],'Quadril para trás (corpo em “V”).',''],
  ['Flexão inclinada',1,'r',['banco'],'Peito','','Peitoral, tríceps e deltoide anterior',['Mãos num banco ou caixa firme, corpo em prancha.','Desça até o peito quase tocar a borda.','Empurre mantendo abdômen e glúteos contraídos.'],'Deixar o quadril cair.','Use uma superfície que não deslize.'],
  ['Flexão com joelhos',1,'r',[],'Peito','','Peitoral, tríceps e deltoide anterior',['Joelhos no chão, linha reta de joelho a cabeça.','Desça até o peito quase tocar o chão.','Empurre de volta com os cotovelos a ~45°.'],'Quadril dobrado, deixando o tronco fora da linha.',''],
  ['Flexão tradicional',2,'r',[],'Peito','','Peitoral, tríceps, deltoide anterior e core',['Mãos um pouco mais abertas que os ombros, corpo em linha reta.','Desça até o peito ficar a um palmo do chão.','Empurre o chão afastando as escápulas no final.'],'Cotovelos abertos a 90° e cabeça caindo.',''],
  ['Flexão declinada',2,'r',['banco'],'Peito','','Peitoral superior, deltoide anterior e tríceps',['Pés elevados num banco, mãos no chão.','Desça controlando até quase tocar o chão.','Empurre mantendo o corpo rígido.'],'Arquear a lombar.',''],
  ['Flexão diamante',2,'r',[],'Tríceps','','Tríceps, peitoral e deltoide anterior',['Mãos juntas formando um losango sob o peito.','Desça com os cotovelos próximos ao corpo.','Empurre até estender os braços.'],'Cotovelos abrindo para os lados.','Se o punho incomodar, afaste um pouco as mãos.'],
  ['Flexão arqueiro',3,'r',[],'Peito','3-8','Peitoral (unilateral), tríceps e core',['Mãos bem afastadas, um braço faz o trabalho e o outro fica quase estendido.','Desça em direção à mão que dobra.','Empurre e alterne o lado a cada série.'],'Girar o quadril.','Faixa de repetições por lado.'],
  ['Flexão unilateral assistida',3,'r',['banco'],'Peito','3-6','Peitoral, tríceps e estabilizadores do core',['Uma mão no chão e a outra apoiada num banco baixo.','Desça devagar com o corpo firme.','Empurre usando ao máximo o braço de baixo.'],'Corpo torcendo durante a descida.',''],
  ['Flexão unilateral',4,'r',[],'Peito','2-5','Peitoral, tríceps, ombro e core',['Pés afastados, uma mão sob o peito.','Desça devagar sem girar o tronco.','Empurre mantendo quadril alinhado.'],'Rotação do tronco.','Só depois de dominar a versão assistida.']]},
 {id:'triceps', pad:'dips', area:'Superior', titulo:'Tríceps no chão', alt:true, itens:[
  ['Flexão fechada',1,'r',[],'Tríceps','','Tríceps e peitoral',['Mãos na largura dos ombros, cotovelos colados ao corpo.','Desça controlando.','Empurre até estender.'],'Cotovelos abrindo.',''],
  ['Flexão diamante',2,'r',[],'Tríceps','','Tríceps, peitoral e deltoide anterior',['Mãos juntas formando um losango sob o peito.','Desça com os cotovelos próximos ao corpo.','Empurre até estender os braços.'],'Cotovelos abrindo para os lados.',''],
  ['Extensão de tríceps no chão',3,'r',[],'Tríceps','5-10','Tríceps (cabeça longa)',['Em prancha alta, mãos um pouco à frente da cabeça.','Dobre os cotovelos até os antebraços tocarem o chão.','Empurre o chão estendendo os cotovelos.'],'Deixar o quadril cair.','Comece com joelhos no chão se for pesado.']]},
 {id:'dips', pad:'dips', area:'Superior', titulo:'Paralelas (dips)', itens:[
  ['Mergulho no banco',1,'r',['banco'],'Tríceps','','Tríceps, peitoral inferior e deltoide anterior',['Mãos na borda do banco, pernas dobradas.','Desça até os cotovelos chegarem a ~90°.','Empurre até estender os braços.'],'Descer demais e forçar o ombro.','Pare se sentir pinçar na frente do ombro.'],
  ['Dips negativo nas paralelas',2,'r',['paralelas'],'Tríceps','3-5','Tríceps, peitoral inferior e ombros',['Suba com um pulo e trave os braços.','Desça bem devagar (4–5 s) até ~90° de cotovelo.','Volte a subir com ajuda dos pés.'],'Descer rápido demais.','Ombros longe das orelhas o tempo todo.'],
  ['Dips nas paralelas',2,'r',['paralelas'],'Tríceps','','Tríceps, peitoral inferior e ombros',['Braços estendidos, tronco levemente inclinado à frente.','Desça até os ombros ficarem na altura dos cotovelos.','Empurre até estender sem travar.'],'Ombros subindo em direção às orelhas.','Não desça além do confortável para o ombro.'],
  ['Dips nas argolas',3,'r',['argolas'],'Tríceps','4-10','Tríceps, peitoral, ombros e estabilizadores',['Argolas próximas ao corpo, braços travados.','Desça controlando a instabilidade das argolas.','Suba girando levemente as palmas para fora no topo.'],'Argolas abrindo para os lados.','Domine 10+ dips nas paralelas antes.']]},
 {id:'hspu', pad:'empurrar_v', area:'Superior', titulo:'Empurrar acima da cabeça', itens:[
  ['Pike push-up inclinado',1,'r',['banco'],'Ombro','','Deltoides e tríceps',['Mãos num banco, quadril alto formando um “V” invertido.','Desça a cabeça à frente das mãos.','Empurre de volta.'],'Transformar em flexão comum (quadril baixo).',''],
  ['Pike push-up',2,'r',[],'Ombro','','Deltoides, tríceps e trapézio',['Mãos no chão, quadril alto, pernas quase estendidas.','Desça a cabeça formando um triângulo com as mãos.','Empurre o chão até estender os braços.'],'Cotovelos abrindo demais.',''],
  ['Pike push-up com pés elevados',2,'r',['banco'],'Ombro','','Deltoides e tríceps (mais carga)',['Pés num banco, quadril acima dos ombros.','Desça a cabeça em direção ao chão.','Empurre mantendo o tronco o mais vertical possível.'],'Pescoço forçando para olhar à frente.',''],
  ['Handstand push-up negativo na parede',3,'r',[],'Ombro','3-5','Deltoides, tríceps e trapézio',['Em parada de mão de frente ou de costas para a parede.','Desça a cabeça devagar (3–5 s) até um apoio macio.','Desça as pernas e recomece.'],'Despencar no final.','Use uma almofada sob a cabeça; pré-requisito: parada na parede por 30 s.'],
  ['Handstand push-up na parede',3,'r',[],'Ombro','3-8','Deltoides, tríceps e trapézio',['Parada de mão com apoio na parede.','Desça até a cabeça tocar levemente o apoio.','Empurre até estender os braços.'],'Arquear demais a lombar.','Pré-requisito: 5 negativas controladas.'],
  ['Handstand push-up livre',4,'r',[],'Ombro','1-5','Ombros, tríceps e equilíbrio',['Parada de mão livre e estável.','Desça controlando o equilíbrio.','Empurre mantendo a linha do corpo.'],'Perder a linha do corpo na subida.','Só com parada livre consistente de 30 s+.']]},
 {id:'barra', pad:'puxar_v', area:'Superior', titulo:'Barra fixa', itens:[
  ['Pendurar na barra',1,'t',['barra','argolas'],'Costas','','Antebraços, dorsais e ombros',['Pegada firme na largura dos ombros.','Pendure com os braços estendidos e ombros ativos.','Respire controlado durante a sustentação.'],'Ombros “soltos” encostando nas orelhas.',''],
  ['Retração escapular na barra',1,'r',['barra','argolas'],'Costas','8-12','Trapézio médio/inferior e dorsais',['Pendurado, braços estendidos.','Puxe as escápulas para baixo e para trás sem dobrar os cotovelos.','Volte devagar.'],'Dobrar os cotovelos.',''],
  ['Barra negativa',2,'r',['barra','argolas'],'Costas','3-5','Dorsais, bíceps e romboides',['Suba com ajuda de um apoio até o queixo passar a barra.','Desça devagar (4–5 s) até estender os braços.','Repita com pausa curta.'],'Descer rápido.',''],
  ['Barra com elástico',2,'r',['elastico'],'Costas','','Dorsais e bíceps (com assistência)',['Prenda o elástico na barra e apoie um pé/joelho nele.','Puxe até o queixo passar a barra.','Desça controlando.'],'Usar o elástico para dar impulso.','Confira se o elástico está bem preso. Precisa de barra também.'],
  ['Chin-up (pegada supinada)',2,'r',['barra','argolas'],'Costas','','Dorsais e bíceps',['Palmas viradas para você, mãos na largura dos ombros.','Puxe até o queixo passar a barra.','Desça até estender os braços.'],'Balançar o corpo.',''],
  ['Barra fixa pronada',2,'r',['barra','argolas'],'Costas','','Dorsais, redondo maior, bíceps e romboides',['Palmas para a frente, um pouco mais abertas que os ombros.','Puxe levando os cotovelos para baixo.','Desça até estender os braços.'],'Meia repetição e balanço.',''],
  ['Barra arqueiro',3,'r',['barra','argolas'],'Costas','3-6','Dorsais (unilateral) e bíceps',['Pegada bem aberta.','Puxe em direção a uma das mãos, com o outro braço quase reto.','Alterne os lados.'],'Puxar com os dois braços igualmente.','Faixa por lado.'],
  ['Barra unilateral assistida',4,'r',['barra','argolas'],'Costas','2-5','Dorsais, bíceps e antebraço',['Uma mão na barra e a outra segurando o próprio punho ou uma toalha mais abaixo.','Puxe usando principalmente o braço da barra.','Desça controlando.'],'Girar o corpo.','Pré-requisito: 12+ barras e arqueiro consistente.']]},
 {id:'puxar_elastico', pad:'puxar_v', area:'Superior', titulo:'Puxar com elástico', alt:true, itens:[
  ['Puxada com elástico',1,'r',['elastico'],'Costas','','Dorsais e bíceps',['Prenda o elástico no alto (porta).','Puxe levando os cotovelos em direção às costelas.','Volte devagar.'],'Encolher os ombros.','Confira a fixação do elástico.']]},
 {id:'remada_elastico', pad:'puxar_h', area:'Superior', titulo:'Remada com elástico', alt:true, itens:[
  ['Remada com elástico',1,'r',['elastico'],'Costas','','Romboides, dorsais e bíceps',['Elástico preso na altura do peito.','Puxe aproximando as escápulas.','Volte devagar.'],'Puxar só com os braços.','']]},
 {id:'escapulas', pad:'puxar_v', area:'Superior', titulo:'Costas sem equipamento', alt:true, itens:[
  ['Elevação Y-T-W deitado',1,'r',[],'Costas','10-15','Trapézio médio/inferior e romboides',['Deitado de barriga para baixo, braços à frente.','Eleve os braços formando Y, depois T, depois W.','Segure 1 s em cada posição.'],'Usar impulso da lombar.','Sem barra ou elástico, o treino de puxar fica limitado: uma barra de porta faz muita diferença.']]},
 {id:'remada', pad:'puxar_h', area:'Superior', titulo:'Remada invertida', itens:[
  ['Remada invertida alta',1,'r',['argolas','paralelas','barra'],'Costas','','Dorsais, romboides e bíceps',['Barra/argolas na altura do peito, corpo bem inclinado.','Puxe o peito até a barra mantendo o corpo reto.','Desça controlando.'],'Quadril caindo.','Use uma barra baixa e firme.'],
  ['Australian pull-up (remada invertida)',2,'r',['argolas','paralelas','barra'],'Costas','','Dorsais, romboides, trapézio médio e bíceps',['Barra na altura da cintura, corpo reto sob ela.','Puxe o peito até a barra.','Desça até estender os braços.'],'Pescoço indo à frente.',''],
  ['Remada invertida com pés elevados',2,'r',['argolas','paralelas','barra'],'Costas','','Dorsais e romboides (mais carga)',['Pés num apoio, corpo horizontal.','Puxe o peito até a barra.','Desça devagar.'],'Perder a linha do quadril.',''],
  ['Remada arqueiro',3,'r',['argolas','barra'],'Costas','4-8','Dorsais (unilateral), romboides e bíceps',['Corpo sob a barra, pegada aberta.','Puxe em direção a uma mão, outro braço estendido.','Alterne os lados.'],'Girar o tronco.','Faixa por lado.']]},
 {id:'agacha', pad:'agachar', area:'Inferior', titulo:'Agachamento', itens:[
  ['Agachamento com apoio',1,'r',[],'Pernas','','Quadríceps e glúteos',['Segure um batente de porta ou encosto firme.','Desça o quadril para trás e para baixo.','Suba empurrando o chão.'],'Joelhos caindo para dentro.',''],
  ['Agachamento livre',1,'r',[],'Pernas','','Quadríceps, glúteos e adutores',['Pés na largura dos ombros.','Desça até as coxas ficarem paralelas ao chão ou abaixo.','Suba mantendo o peito aberto.'],'Calcanhar saindo do chão.',''],
  ['Agachamento pausado',2,'r',[],'Pernas','10-15','Quadríceps e glúteos',['Desça até o fundo do agachamento.','Segure 3 s embaixo.','Suba com força.'],'Relaxar no fundo.',''],
  ['Agachamento com salto',2,'r',[],'Pernas','8-12','Quadríceps, glúteos e panturrilhas (potência)',['Agache até a metade.','Salte o mais alto possível.','Aterrisse suave e emende a próxima.'],'Aterrissar com os joelhos travados.','Evite se tiver dor no joelho ou se marcou “evitar saltos”.']]},
 {id:'unilateral', pad:'agachar_uni', area:'Inferior', titulo:'Pernas unilateral', itens:[
  ['Afundo estático',1,'r',[],'Pernas','','Quadríceps e glúteos',['Um pé à frente e outro atrás, tronco reto.','Desça até o joelho de trás quase tocar o chão.','Suba sem mudar os pés de lugar.'],'Joelho da frente ultrapassando muito a ponta do pé.','Faixa por perna.'],
  ['Avanço alternado',1,'r',[],'Pernas','','Quadríceps, glúteos e estabilizadores',['Dê um passo largo à frente.','Desça até os dois joelhos ficarem a ~90°.','Volte e alterne.'],'Tronco inclinando demais.','Faixa por perna.'],
  ['Bulgarian split squat',2,'r',['banco'],'Pernas','','Quadríceps e glúteos',['Pé de trás apoiado num banco.','Desça até a coxa da frente ficar paralela.','Suba empurrando com a perna da frente.'],'Pé da frente muito perto do banco.','Faixa por perna.'],
  ['Agachamento unilateral no banco',2,'r',['banco'],'Pernas','5-10','Quadríceps, glúteos e equilíbrio',['De costas para um banco, uma perna estendida à frente.','Sente devagar no banco com uma perna só.','Levante sem impulso.'],'Despencar no banco.','Faixa por perna.'],
  ['Pistol squat assistido',3,'r',[],'Pernas','4-8','Quadríceps, glúteos e equilíbrio',['Segure um batente de porta.','Desça numa perna só até o fundo.','Suba usando o mínimo de ajuda dos braços.'],'Joelho caindo para dentro.','Faixa por perna.'],
  ['Pistol squat',3,'r',[],'Pernas','3-6','Quadríceps, glúteos e equilíbrio',['Uma perna estendida à frente, braços à frente.','Desça até o fundo controlando.','Suba sem tocar o outro pé no chão.'],'Arredondar a lombar no fundo.','Faixa por perna. Pare se o joelho doer.'],
  ['Shrimp squat',4,'r',[],'Pernas','3-6','Quadríceps e glúteos',['Segure o pé de trás com a mão.','Desça até o joelho de trás tocar o chão.','Suba sem soltar o pé.'],'Perder o equilíbrio para a frente.','Faixa por perna.']]},
 {id:'gluteo', pad:'gluteo', area:'Inferior', titulo:'Glúteos', itens:[
  ['Ponte de glúteos',1,'r',[],'Glúteos','12-20','Glúteo máximo e posteriores',['Deitado, joelhos dobrados, pés no chão.','Eleve o quadril contraindo os glúteos.','Segure 1 s e desça.'],'Arquear a lombar no topo.',''],
  ['Elevação pélvica unilateral',2,'r',[],'Glúteos','','Glúteos e posteriores (unilateral)',['Uma perna no chão e a outra estendida no ar.','Eleve o quadril sem girar.','Desça devagar.'],'Quadril caindo para um lado.','Faixa por perna.'],
  ['Elevação pélvica unilateral com ombros no banco',3,'r',['banco'],'Glúteos','','Glúteos (maior amplitude)',['Costas apoiadas no banco, uma perna no chão.','Eleve o quadril até alinhar com o tronco.','Desça controlando.'],'Empurrar com a lombar.','Faixa por perna.']]},
 {id:'nordic', pad:'posterior', area:'Inferior', titulo:'Posteriores (nordic)', itens:[
  ['Ponte de glúteos com pés afastados',1,'r',[],'Pernas','12-20','Posteriores de coxa e glúteos',['Calcanhares mais longe do quadril que na ponte comum.','Eleve o quadril empurrando com os calcanhares.','Desça devagar.'],'Cãibra por subir rápido: vá devagar.',''],
  ['Nordic curl negativo assistido',2,'r',[],'Pernas','3-6','Posteriores de coxa',['Ajoelhado, pés presos sob um sofá firme ou por um parceiro.','Incline o corpo à frente o mais devagar possível.','Use as mãos para amortecer e voltar.'],'Dobrar o quadril em vez de manter o corpo reto.','Prenda bem os pés; tenha algo macio para as mãos.'],
  ['Nordic curl negativo',3,'r',[],'Pernas','3-5','Posteriores de coxa',['Mesma posição, sem ajuda.','Desça em 4–5 s até o chão.','Volte com as mãos.'],'Descer rápido no final.',''],
  ['Nordic curl',4,'r',[],'Pernas','2-5','Posteriores de coxa (excêntrico e concêntrico)',['Desça devagar.','Volte à posição inicial usando os posteriores.','Mantenha quadril estendido.'],'Quebrar no quadril.','Volume baixo: gera muita dor muscular.']]},
 {id:'panturrilha', pad:'panturrilha', area:'Inferior', titulo:'Panturrilhas', itens:[
  ['Elevação de panturrilha',1,'r',[],'Panturrilha','15-25','Gastrocnêmio e sóleo',['De pé, apoio leve na parede.','Suba na ponta dos pés o mais alto possível.','Desça devagar.'],'Movimento curto e rápido.',''],
  ['Elevação de panturrilha unilateral',2,'r',[],'Panturrilha','10-20','Gastrocnêmio e sóleo',['Uma perna só, apoio na parede.','Suba ao máximo e segure 1 s.','Desça devagar.'],'Dobrar o joelho para ajudar.','Faixa por perna.'],
  ['Panturrilha unilateral no degrau com pausa',3,'r',[],'Panturrilha','8-15','Gastrocnêmio e sóleo (amplitude total)',['Ponta do pé num degrau, calcanhar livre.','Desça até alongar e pause 2 s.','Suba ao máximo.'],'Quicar embaixo.','Faixa por perna.']]},
 {id:'core_anti', pad:'core_anti', area:'Core', titulo:'Core anti-extensão', itens:[
  ['Prancha',1,'t',[],'Core','','Reto e transverso do abdômen',['Antebraços no chão, corpo reto.','Contraia abdômen e glúteos.','Respire sem perder a posição.'],'Quadril caindo.',''],
  ['Hollow body grupado',1,'t',[],'Core','','Reto do abdômen e flexores do quadril',['Deitado, lombar colada no chão.','Joelhos dobrados e braços à frente, ombros fora do chão.','Segure sem a lombar descolar.'],'Lombar saindo do chão.',''],
  ['Hollow body hold',2,'t',[],'Core','','Reto do abdômen e flexores do quadril',['Lombar colada no chão.','Pernas estendidas e braços acima da cabeça, perto do chão.','Segure formando uma “canoa”.'],'Prender a respiração.',''],
  ['Dragon flag negativo',3,'r',['banco'],'Core','3-6','Core inteiro e dorsais',['Deitado no banco segurando atrás da cabeça.','Eleve o corpo reto até a vertical.','Desça devagar sem dobrar o quadril.'],'Dobrar o quadril na descida.','Pré-requisito: hollow body de 45 s.'],
  ['Dragon flag',4,'r',['banco'],'Core','3-6','Core inteiro e dorsais',['Mesma posição.','Desça e suba com o corpo rígido.','Controle total.'],'Perder a linha no meio.','']]},
 {id:'core_lat', pad:'core_lat', area:'Core', titulo:'Core lateral', itens:[
  ['Prancha lateral com joelhos',1,'t',[],'Core','','Oblíquos e glúteo médio',['Deitado de lado, apoio no antebraço e nos joelhos.','Eleve o quadril em linha reta.','Segure e troque de lado.'],'Quadril caindo.','Tempo por lado.'],
  ['Prancha lateral',1,'t',[],'Core','','Oblíquos e glúteo médio',['Apoio no antebraço e na lateral do pé.','Corpo reto, quadril alto.','Segure e troque de lado.'],'Girar o tronco.','Tempo por lado.'],
  ['Prancha lateral com elevação de perna',2,'t',[],'Core','','Oblíquos, glúteo médio e abdutores',['Em prancha lateral.','Eleve a perna de cima e segure.','Troque de lado.'],'Quadril caindo.','Tempo por lado.']]},
 {id:'core_ext', pad:'core_ext', area:'Core', titulo:'Core posterior', itens:[
  ['Arch hold (superman)',1,'t',[],'Core','','Eretores da coluna, glúteos e trapézio',['Deitado de barriga para baixo.','Eleve braços e pernas, alongando o corpo.','Segure olhando para o chão.'],'Forçar o pescoço para cima.','']]},
 {id:'core_flex', pad:'core_flex', area:'Core', titulo:'Elevação de pernas', itens:[
  ['Elevação de pernas deitado',1,'r',[],'Core','','Reto do abdômen (inferior) e flexores do quadril',['Deitado, mãos ao lado do corpo.','Eleve as pernas até a vertical.','Desça devagar sem a lombar descolar.'],'Lombar arqueando.',''],
  ['Hanging knee raises',2,'r',['barra','argolas'],'Core','','Abdômen e flexores do quadril',['Pendurado na barra, ombros ativos.','Eleve os joelhos até o peito.','Desça sem balançar.'],'Balanço do corpo.',''],
  ['Hanging leg raises',3,'r',['barra','argolas'],'Core','6-12','Abdômen e flexores do quadril',['Pendurado, pernas estendidas.','Eleve as pernas até a altura do quadril ou mais.','Desça controlando.'],'Usar impulso.',''],
  ['Toes to bar',3,'r',['barra'],'Core','5-10','Abdômen, flexores do quadril e dorsais',['Pendurado.','Leve a ponta dos pés até a barra.','Desça controlando o balanço.'],'Kipping descontrolado.','']]},
 {id:'lsit', pad:'core_flex', area:'Core', titulo:'L-sit', itens:[
  ['L-sit grupado',2,'t',[],'Core','10-20s','Abdômen, flexores do quadril e tríceps',['Mãos no chão (ou apoios) ao lado do quadril.','Empurre o chão e tire o quadril, joelhos no peito.','Segure com os ombros baixos.'],'Ombros encolhidos.','Apoios de flexão ou paralelas facilitam.'],
  ['L-sit com uma perna estendida',3,'t',[],'Core','10-20s','Abdômen e flexores do quadril',['Igual ao grupado, uma perna estendida.','Alterne a perna a cada série.','Segure.'],'Perna estendida caindo.',''],
  ['L-sit',3,'t',[],'Core','10-20s','Abdômen, flexores do quadril, tríceps e ombros',['Pernas estendidas à frente na altura do quadril.','Ombros baixos, braços travados.','Segure.'],'Joelhos dobrando.',''],
  ['V-sit',4,'t',[],'Core','5-10s','Abdômen, flexores do quadril e ombros',['A partir do L-sit, eleve as pernas acima do quadril.','Empurre o chão forte.','Segure.'],'Perder a compressão.','Pré-requisito: L-sit de 20 s.']]},
 // ---- habilidades (aparecem só com pré-requisitos cumpridos) ----
 {id:'handstand', pad:'skill', area:'Habilidades', titulo:'Parada de mão', skill:true, req:[['hspu',1],['core_anti',1]], itens:[
  ['Pike hold (suporte em pike)',1,'t',[],'Ombro','15-30s','Ombros e core',['Mãos no chão, quadril alto, pés próximos às mãos.','Empurre o chão levando o peso para os ombros.','Segure.'],'Ombros fugindo para trás.',''],
  ['Caminhada na parede',2,'r',[],'Ombro','3-5','Ombros, tríceps e core',['De costas para a parede, em prancha.','Suba os pés pela parede enquanto aproxima as mãos.','Volte devagar.'],'Subir mais do que controla.','Espaço livre e chão sem obstáculos.'],
  ['Parada de mão de frente para a parede',2,'t',[],'Ombro','20-40s','Ombros, trapézio e core',['Barriga para a parede, mãos a um palmo dela.','Corpo reto, empurre o chão.','Segure e desça como na caminhada.'],'Arquear a lombar (formato “banana”).','Aprenda a sair girando para o lado antes.'],
  ['Parada de mão de costas para a parede',3,'t',[],'Ombro','20-40s','Ombros, trapézio e equilíbrio',['Chute para cima com as costas para a parede.','Afaste os calcanhares da parede por instantes.','Segure.'],'Encostar o corpo todo na parede.',''],
  ['Handstand livre',4,'t',[],'Ombro','10-30s','Ombros, punhos e equilíbrio',['Entre na parada sem parede.','Corrija com os dedos das mãos.','Segure o máximo com boa linha.'],'Olhar entre as mãos com o pescoço dobrado.','Treine com espaço livre e saída segura.']]},
 {id:'muscleup', pad:'skill', area:'Habilidades', titulo:'Muscle-up', skill:true, req:[['barra',6],['dips',2]], itens:[
  ['Barra explosiva (peito na barra)',3,'r',['barra','argolas'],'Costas','3-6','Dorsais, bíceps e potência',['Puxe o mais rápido possível.','Leve o peito até a barra.','Desça controlando.'],'Perder a forma para ganhar altura.','Pré-requisito: 8+ barras e 10+ dips.'],
  ['Muscle-up com elástico',3,'r',['elastico'],'Costas','3-5','Dorsais, peitoral, tríceps',['Elástico preso na barra, pés nele.','Puxe explosivo e passe o peito por cima.','Empurre até estender.'],'Passar um braço de cada vez com o corpo torto.',''],
  ['Muscle-up negativo',3,'r',['barra','argolas'],'Costas','3-5','Dorsais, peitoral e tríceps',['Comece em cima da barra com os braços estendidos.','Desça devagar passando pela transição.','Termine pendurado.'],'Despencar na transição.',''],
  ['Muscle-up',4,'r',['barra','argolas'],'Costas','1-5','Dorsais, peitoral, tríceps e ombros',['Puxada explosiva com leve balanço controlado.','Transição rápida com os punhos por cima.','Empurre até o topo.'],'Kipping exagerado.','']]},
 {id:'frontlever', pad:'skill', area:'Habilidades', titulo:'Front lever', skill:true, req:[['barra',5],['core_anti',2]], itens:[
  ['Tuck front lever',3,'t',['barra','argolas'],'Costas','8-15s','Dorsais, core e ombros',['Pendurado, braços estendidos.','Leve os joelhos ao peito e o tronco à horizontal.','Segure com as escápulas para baixo.'],'Braços dobrando.','Pré-requisito: 8+ barras e hollow sólido.'],
  ['Advanced tuck front lever',3,'t',['barra','argolas'],'Costas','8-15s','Dorsais, core e ombros',['Igual ao tuck, com as costas retas e quadril mais aberto.','Segure.','Desça controlando.'],'Quadril caindo.',''],
  ['Front lever com uma perna',4,'t',['barra','argolas'],'Costas','5-10s','Dorsais, core e ombros',['Uma perna estendida e outra grupada.','Corpo na horizontal.','Alterne as pernas.'],'Perder a horizontal.',''],
  ['Straddle front lever',4,'t',['barra','argolas'],'Costas','5-10s','Dorsais, core e ombros',['Pernas abertas e estendidas.','Corpo na horizontal.','Segure.'],'Joelhos dobrando.',''],
  ['Front lever',4,'t',['barra','argolas'],'Costas','3-10s','Dorsais, core, ombros e antebraços',['Corpo inteiro reto na horizontal.','Braços travados.','Segure.'],'Quadril abaixo da linha.','']]},
 {id:'backlever', pad:'skill', area:'Habilidades', titulo:'Back lever', skill:true, req:[['barra',4],['core_anti',2]], itens:[
  ['Skin the cat',3,'r',['barra','argolas'],'Costas','3-5','Ombros (mobilidade), dorsais e core',['Pendurado, leve as pernas por entre os braços.','Desça devagar até onde o ombro permite.','Volte pelo mesmo caminho.'],'Forçar além da mobilidade do ombro.','Vá devagar: alonga muito o ombro.'],
  ['Tuck back lever',3,'t',['barra','argolas'],'Costas','8-15s','Ombros, bíceps e core',['A partir do skin the cat, pare com o tronco horizontal e joelhos grupados.','Braços travados.','Segure.'],'Braços dobrando.',''],
  ['Advanced tuck back lever',4,'t',['barra','argolas'],'Costas','8-12s','Ombros, bíceps e core',['Costas retas, quadril mais aberto.','Segure.','Volte devagar.'],'Arredondar as costas.',''],
  ['Back lever',4,'t',['barra','argolas'],'Costas','3-10s','Ombros, bíceps, peitoral e core',['Corpo reto na horizontal, de barriga para baixo.','Braços travados.','Segure.'],'Quadril caindo.','']]},
 {id:'planche', pad:'skill', area:'Habilidades', titulo:'Planche', skill:true, req:[['flexao',3],['dips',2]], itens:[
  ['Planche lean',2,'t',[],'Ombro','15-30s','Deltoide anterior, peitoral e punhos',['Em prancha alta, dedos para os lados ou para trás.','Incline o corpo à frente das mãos.','Segure com os braços travados.'],'Dobrar os cotovelos.','Aqueça bem os punhos.'],
  ['Tuck planche',3,'t',['apoios','paralelas'],'Ombro','5-12s','Deltoides, peitoral, tríceps e core',['Mãos nos apoios, joelhos grupados.','Incline e tire os pés do chão.','Segure com braços travados.'],'Ombros fugindo para trás.','Pré-requisito: lean de 30 s e flexão arqueiro.'],
  ['Advanced tuck planche',4,'t',['apoios','paralelas'],'Ombro','5-10s','Deltoides, peitoral e core',['Costas retas e quadril mais aberto.','Segure.','Desça controlando.'],'Arredondar as costas.',''],
  ['Straddle planche',4,'t',['apoios','paralelas'],'Ombro','3-8s','Ombros, peitoral e core',['Pernas abertas e estendidas.','Corpo paralelo ao chão.','Segure.'],'Quadril caindo.','']]},
 {id:'flag', pad:'skill', area:'Habilidades', titulo:'Human flag', skill:true, req:[['barra',5],['core_lat',2]], itens:[
  ['Flag vertical (suporte lateral)',3,'t',['espaldar'],'Core','5-15s','Oblíquos, dorsais e ombros',['Mãos no poste, uma em cima e outra embaixo.','Empurre com a de baixo e puxe com a de cima.','Eleve o corpo na vertical.'],'Braço de baixo dobrando.','Poste bem fixo, sem quinas.'],
  ['Tuck human flag',4,'t',['espaldar'],'Core','5-10s','Oblíquos, dorsais e ombros',['Mesma pegada.','Corpo lateral com joelhos grupados.','Segure.'],'Quadril caindo.',''],
  ['Human flag',4,'t',['espaldar'],'Core','3-8s','Oblíquos, dorsais, ombros e core',['Corpo reto paralelo ao chão.','Braços travados.','Segure.'],'Perder a linha lateral.','']]}
];
// índices rápidos
let CALI_EX = {};      // id → {nome, nivel, unit, equip, grupo, faixa, mus, exec, erro, seg, cadeia, idx}
function caliIndexar(){
  CALI_EX = {};
  CALI_CADEIAS.forEach(c=>c.itens.forEach((it,i)=>{
    const id = slug(it[0]);
    const prev = CALI_EX[id];
    const obj = { id, nome:it[0], nivel:it[1], unit:it[2], equip:it[3], grupo:it[4], faixa:it[5], mus:it[6], exec:it[7], erro:it[8], seg:it[9]||'', cadeia:c.id, idx:i, area:c.area, pad:c.pad, skill:!!c.skill, outras: prev ? [...(prev.outras||[]), prev.cadeia] : [] };
    if(!prev) CALI_EX[id] = obj; else prev.outras = [...(prev.outras||[]), c.id];
  }));
}
caliIndexar();
function caliCadeia(id){ return CALI_CADEIAS.find(c=>c.id===id) || null; }
function ehCali(exId){ return !!CALI_EX[exId]; }
function modalidadeAtual(){ const st = state.modules.lift && state.modules.lift.setup; return (st && st.modalidade) || 'musculacao'; }
function temCali(){ const m = modalidadeAtual(); return m==='calistenia' || m==='hibrido'; }

// ---- equipamentos e limitações ----
function caliEquipOk(item, st){
  const req = item[3] || item.equip || [];
  if(!req.length) return true;
  const tenho = (st && st.caliEquip) || [];
  if(req.includes('elastico') && req.length===1) return tenho.includes('elastico') && (tenho.includes('barra') || tenho.includes('argolas') || /puxada|remada/i.test(item[0]||item.nome));
  return req.some(r=>tenho.includes(r));
}
const CALI_PAIN = { 'Ombro':['empurrar_v','dips','skill'], 'Punho/Cotovelo':['skill','empurrar_v'], 'Joelho':['agachar_uni','agachar'], 'Tornozelo':['agachar'], 'Lombar':['posterior'] };
function caliPadroesBloqueados(st){
  const b = new Set();
  ((state.user && state.user.pain) || []).forEach(d=>(CALI_PAIN[d]||[]).forEach(p=>b.add(p)));
  const lim = (st && st.caliLimites) || [];
  if(lim.includes('ombro')) ['skill'].forEach(p=>b.add(p));
  return b;
}
function caliItemPermitido(item, st){
  const lim = (st && st.caliLimites) || [];
  const nome = item[0];
  if(lim.includes('semimpacto') && /salto|explosiv/i.test(nome)) return false;
  if(lim.includes('punho') && /planche|handstand|parada de mão|pike hold/i.test(nome)) return false;
  if(lim.includes('joelho') && /pistol|shrimp|salto/i.test(nome)) return false;
  if(lim.includes('ombro') && /dips nas argolas|skin the cat|back lever|handstand push/i.test(nome)) return false;
  return true;
}
// posição atual do aluno numa cadeia (índice), respeitando equipamento e limitações
function caliPos(st, cid){
  const c = caliCadeia(cid); if(!c) return -1;
  st.caliPos = st.caliPos || {};
  let i = st.caliPos[cid];
  if(i==null) i = caliPosInicial(st, cid);
  i = Math.max(0, Math.min(c.itens.length-1, i));
  // se o item atual não é possível (equipamento/limitação), desce até um possível; se nenhum abaixo, sobe
  for(let k=i; k>=0; k--) if(caliEquipOk(c.itens[k], st) && caliItemPermitido(c.itens[k], st)) return k;
  for(let k=i+1; k<c.itens.length; k++) if(caliEquipOk(c.itens[k], st) && caliItemPermitido(c.itens[k], st) && c.itens[k][1] <= (st.caliNivelDecl||1)+1) return k;
  return -1;
}
// posição inicial: nível declarado (no máximo Avançado para começar) + teste rápido quando informado
function caliPosInicial(st, cid){
  const c = caliCadeia(cid); const nv = Math.min(3, st.caliNivelDecl || 1);
  const t = st.caliTeste || {};
  const idxNome = n=>c.itens.findIndex(x=>x[0]===n);
  if(cid==='flexao' && t.flexao!=null){ const f=t.flexao; return idxNome(f<1?'Flexão inclinada':f<5?'Flexão com joelhos':f<15?'Flexão tradicional':f<30?'Flexão declinada':'Flexão arqueiro'); }
  if(cid==='barra' && t.barra!=null){ const b=t.barra; return idxNome(b<1?'Barra negativa':b<4?'Chin-up (pegada supinada)':b<12?'Barra fixa pronada':'Barra arqueiro'); }
  if(cid==='dips' && t.dips!=null){ const d=t.dips; return idxNome(d<1?'Mergulho no banco':d<6?'Dips negativo nas paralelas':d<15?'Dips nas paralelas':'Dips nas argolas'); }
  if(cid==='core_anti' && t.prancha!=null){ const p=t.prancha; return idxNome(p<30?'Prancha':p<60?'Hollow body grupado':'Hollow body hold'); }
  // primeiro item do nível declarado (ou o último abaixo dele)
  let i = c.itens.findIndex(x=>x[1]>=nv);
  if(i<0) i = c.itens.length-1;
  if(c.itens[i][1] > nv) i = Math.max(0, i-1);
  return i;
}
// pré-requisitos das habilidades (posição mínima em outras cadeias)
function caliReqOk(st, cid){
  const c = caliCadeia(cid); if(!c || !c.req) return true;
  return c.req.every(([outra, min])=>{ const p = caliPos(st, outra); return p >= min; });
}
function caliReqTexto(cid){
  const c = caliCadeia(cid); if(!c || !c.req) return '';
  return c.req.map(([o,min])=>{ const oc = caliCadeia(o); return `${oc.itens[min][0]} (${oc.titulo.toLowerCase()})`; }).join(' + ');
}

// ---- prescrição (séries, faixa, descanso) ----
const CALI_PRESC = {
  forca:          {sets:[0,4,4,5,5], r:'3-6',   t:'15-25s', rest:'2-3min'},
  hipertrofia:    {sets:[0,3,4,4,4], r:'6-12',  t:'25-40s', rest:'90s'},
  resistencia:    {sets:[0,3,3,3,4], r:'12-20', t:'40-60s', rest:'45-60s'},
  condicionamento:{sets:[0,3,3,3,3], r:'10-15', t:'30-45s', rest:'30-45s'},
  habilidades:    {sets:[0,3,3,4,4], r:'5-8',   t:'20-30s', rest:'2min'}
};
function caliPrescrever(item, st, slotSkill){
  const g = st.caliGoal || 'hipertrofia';
  const P = CALI_PRESC[g] || CALI_PRESC.hipertrofia;
  const nv = Math.min(4, Math.max(1, st.caliNivelDecl || 1));
  let sets = P.sets[nv];
  let faixa = item[5] || (item[2]==='t' ? P.t : P.r);
  if(item[2]==='t' && !/s$/.test(faixa)) faixa += 's';
  let rest = P.rest;
  if(slotSkill){ sets = item[2]==='t' ? 5 : 4; rest = '2min'; }
  if(item[5] && /negativ|explosiv|unilateral|arqueiro|pistol|shrimp|nordic|muscle/i.test(item[0])) rest = g==='condicionamento' ? '60s' : '2min';
  const porLado = /por (lado|perna)/i.test(item[9]||'') ? ' por lado' : '';
  return { sets, reps: faixa + porLado, rest };
}

// ---- sessões ----
const CALI_SESSOES = {
  full:     {nome:'Corpo inteiro', slots:['skill','empurrar_h','puxar_v','agachar_uni','dips','puxar_h','posterior','core_anti','core_flex','gluteo','core_lat']},
  superior: {nome:'Superior', slots:['skill','puxar_v','empurrar_h','empurrar_v','puxar_h','dips','core_flex','core_lat']},
  inferior: {nome:'Inferior + core', slots:['agachar_uni','agachar','posterior','gluteo','panturrilha','core_anti','core_lat','core_ext']},
  empurrar: {nome:'Empurrar', slots:['skill_push','empurrar_v','empurrar_h','dips','core_anti','core_lat']},
  puxar:    {nome:'Puxar', slots:['skill_pull','puxar_v','puxar_h','core_flex','core_ext','core_lat']},
  pernas:   {nome:'Pernas', slots:['agachar_uni','agachar','posterior','gluteo','panturrilha','core_anti']},
  habilid:  {nome:'Habilidades + core', slots:['skill','skill','core_flex','core_anti','empurrar_h','puxar_h']}
};
const CALI_SPLITS = {
  3:{nome:'Full Body', s:['full','full','full']},
  4:{nome:'Upper/Lower', s:['superior','inferior','superior','inferior']},
  5:{nome:'Push/Pull/Legs + Upper/Lower', s:['empurrar','puxar','pernas','superior','inferior']},
  6:{nome:'Push/Pull/Legs ×2', s:['empurrar','puxar','pernas','empurrar','puxar','pernas']}
};
// Híbrido: musculação cuida de pernas e volume; calistenia de puxar, empurrar e habilidades
const HIB_SPLITS = {
  3:[{c:'superior'},{g:['Pernas','Glúteos','Panturrilha'],n:'Pernas + Glúteos'},{c:'full'}],
  4:[{c:'superior'},{g:['Pernas','Glúteos','Panturrilha'],n:'Pernas + Glúteos'},{g:['Peito','Costas','Ombro'],n:'Peito + Costas + Ombro'},{c:'habilid'}],
  5:[{c:'empurrar'},{c:'puxar'},{g:['Pernas','Glúteos','Panturrilha'],n:'Pernas + Glúteos'},{g:['Peito','Costas','Ombro'],n:'Peito + Costas + Ombro'},{c:'habilid'}],
  6:[{c:'empurrar'},{c:'puxar'},{g:['Pernas','Glúteos','Panturrilha'],n:'Pernas + Glúteos'},{g:['Peito','Tríceps'],n:'Peito + Tríceps'},{g:['Costas','Bíceps'],n:'Costas + Bíceps'},{c:'habilid'}]
};
const SKILL_ORDEM = { skill:['handstand','frontlever','planche','muscleup','backlever','flag'], skill_push:['handstand','planche'], skill_pull:['frontlever','muscleup','backlever'] };
function caliEscolherCadeia(pad, st, usados){
  const bloqueados = caliPadroesBloqueados(st);
  if(pad.startsWith('skill')){
    if(bloqueados.has('skill')) return null;
    const querSkill = st.caliGoal==='habilidades' || (st.caliNivelDecl||1) >= 3;
    if(!querSkill) return null;
    const pref = (st.caliSkills && st.caliSkills.length) ? st.caliSkills : SKILL_ORDEM[pad];
    for(const cid of pref){ if(usados.has(cid) || !SKILL_ORDEM[pad].includes(cid) && pad!=='skill') continue; if(caliReqOk(st, cid) && caliPos(st, cid) >= 0){ return cid; } }
    // nenhuma habilidade liberada: treina a preparação do handstand (sem pré-requisito de força alto)
    if(!usados.has('handstand') && caliPos(st,'handstand')>=0 && !bloqueados.has('empurrar_v')) return caliReqOk(st,'handstand') ? 'handstand' : null;
    return null;
  }
  if(bloqueados.has(pad)) return null;
  const cands = CALI_CADEIAS.filter(c=>c.pad===pad && !c.skill);
  const pref = st.caliPref && st.caliPref[pad];
  const ord = [...cands].sort((a,b)=>(a.id===pref?-1:0)-(b.id===pref?-1:0) || (a.alt?1:0)-(b.alt?1:0));
  for(const c of ord){ if(usados.has(c.id)) continue; if(caliPos(st, c.id) >= 0) return c.id; }
  return null;
}
function caliMontarSessao(tipo, st, opts){
  opts = opts || {};
  const S = CALI_SESSOES[tipo];
  const max = ({30:4, 45:5, 60:6, 75:7})[st.caliTempo||45] || 5;
  const usados = new Set(); const ex = []; const avisos = [];
  for(const pad of S.slots){
    if(ex.length >= max) break;
    const cid = caliEscolherCadeia(pad, st, usados);
    if(!cid) continue;
    usados.add(cid);
    if(cid==='escapulas') avisos.push('Sem barra, argolas ou elástico, o treino de puxar fica limitado: uma barra de porta faz muita diferença.');
    const c = caliCadeia(cid); const i = caliPos(st, cid); const it = c.itens[i];
    const pr = caliPrescrever(it, st, pad.startsWith('skill'));
    let sets = pr.sets;
    if(opts.reduzir) sets = Math.max(2, sets-1);
    ex.push({ id:slug(it[0]), name:it[0], sub:`${c.titulo} · ${CALI_NIVEL[it[1]]}`, sets, reps:pr.reps, rest:pr.rest, part:it[4], equip:it[3], unit: it[2]==='t'?'tempo':'reps', cali:true, cadeia:cid, nivel:it[1] });
  }
  // respeita o tempo disponível: tira os últimos exercícios (os menos prioritários) e, se preciso, uma série de cada
  const limite = (st.caliTempo||45) + 5;
  const fam = e=>{ const c = caliCadeia(e.cadeia); const p = c ? c.pad : ''; return /^empurrar|^dips/.test(p)?'push':/^puxar/.test(p)?'pull':/agachar|posterior|gluteo|panturrilha/.test(p)?'legs':/^core/.test(p)?'core':'skill'; };
  const essencial = ()=>{ const vist = new Set(), idx = new Set(); ex.forEach((e,i)=>{ const f = fam(e); if(['push','pull','legs'].includes(f) && !vist.has(f)){ vist.add(f); idx.add(i); } if(f==='skill' && st.caliGoal==='habilidades' && !vist.has('skill')){ vist.add('skill'); idx.add(i); } }); return idx; };
  while(ex.length > 3 && caliDuracao(ex) > limite){
    const ess = essencial(); let k = -1;
    for(let i=ex.length-1;i>=0;i--) if(!ess.has(i)){ k = i; break; }
    if(k<0) break; ex.splice(k,1);
  }
  if(caliDuracao(ex) > limite) ex.forEach(e=>{ if(!/skill/.test(e.cadeia) && e.sets>3) e.sets--; });
  return { ex, avisos:[...new Set(avisos)] };
}
function caliDuracao(exs){
  const seg = exs.reduce((s,e)=>{ const rest = /3min/.test(e.rest)?150:/2min/.test(e.rest)?120:/90/.test(e.rest)?90:/60/.test(e.rest)?55:40; const work = e.unit==='tempo' ? (parseInt(String(e.reps).split('-')[1])||30) : 40; return s + (e.sets||3)*(rest+work); }, 0);
  return Math.max(20, Math.min(90, Math.round(seg/60 + 8)));
}
function caliGerarWorkouts(st, wkDays){
  const dayNames = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const d = Math.max(3, Math.min(6, st.days||3));
  const letras = 'ABCDEF';
  const mk = (tipo, i, extra)=>{
    // full body em dias seguidos: o segundo dia vem com uma série a menos (recuperação)
    const prevDay = wkDays[i-1], dia = wkDays[i];
    const reduzir = tipo==='full' && i>0 && dia-prevDay===1;
    const r = caliMontarSessao(tipo, st, {reduzir});
    const parts = [...new Set(r.ex.map(e=>e.part))];
    return Object.assign({ k:letras[i], name:'Calistenia · '+CALI_SESSOES[tipo].nome, parts, originalParts:[...parts], cali:true, caliTipo:tipo,
      dayIdx:dia, dayName:dayNames[dia-1], exercises:r.ex, duration:caliDuracao(r.ex), caliAvisos:r.avisos.concat(reduzir?['Dia seguido de outro corpo inteiro: uma série a menos em cada exercício.']:[]) }, extra||{});
  };
  if(st.modalidade==='hibrido'){
    return HIB_SPLITS[d].map((x,i)=>{
      if(x.c) return mk(x.c, i);
      const exercises = buildLiftExercises(x.g, st);
      return { k:letras[i], name:x.n, parts:x.g, dayIdx:wkDays[i], dayName:dayNames[wkDays[i]-1], duration:estimateLiftDuration(exercises, st.goal), exercises };
    });
  }
  const modelo = caliModeloAdmin(st, d);
  const tipos = modelo ? modelo.sessoes : CALI_SPLITS[d].s;
  return tipos.map((t,i)=>{
    if(typeof t === 'string') return mk(t, i);
    // modelo do administrador: lista própria de padrões
    CALI_SESSOES['adm_'+i] = { nome:t.nome||('Sessão '+(i+1)), slots:t.slots||[] };
    return mk('adm_'+i, i);
  });
}
function caliRegenWorkout(w, st){
  if(!w || !w.cali) return;
  if(w.caliTipo && w.caliTipo.startsWith('adm_') && !CALI_SESSOES[w.caliTipo]) w.caliTipo = 'full';
  const a = (typeof adaptMode==='function') ? adaptMode() : {};
  const r = caliMontarSessao(w.caliTipo || 'full', st, {reduzir: a.tpm || a.cramp || a.leve || (a.pain && a.pain.length)});
  w.exercises = r.ex; w.caliAvisos = r.avisos;
  w.parts = [...new Set(r.ex.map(e=>e.part))];
  w.duration = caliDuracao(r.ex);
}
function caliRegenTudo(){
  const mod = state.modules.lift; if(!mod || !mod.plan || !mod.setup) return;
  (mod.plan.workouts||[]).forEach(w=>{ if(w.cali) caliRegenWorkout(w, mod.setup); });
}

// ---- integração com o gerador e as rotinas existentes ----
const _generatePlanCali = generatePlan;
window.generatePlan = function(module, setup){
  if(module==='lift' && setup && window.__caliExtra){ Object.assign(setup, window.__caliExtra); window.__caliExtra = null; }
  if(module==='lift' && setup && (setup.modalidade==='calistenia' || setup.modalidade==='hibrido')){
    const days = Math.max(3, Math.min(6, setup.days||3));
    const wkDays = (setup.selectedDays && setup.selectedDays.length===days) ? setup.selectedDays : ({3:[1,3,5],4:[1,2,4,5],5:[1,2,3,5,6],6:[1,2,3,4,5,6]}[days]);
    return { type:'lift', goal:setup.goal, workouts: caliGerarWorkouts(setup, wkDays), totalWeeks:12, bloco:0, modalidade:setup.modalidade };
  }
  return _generatePlanCali.apply(this, arguments);
};
// rotinas da musculação (troca semanal, bloco, dor) não podem reescrever os treinos de calistenia
function _semCali(fn){
  return function(){
    const mod = state.modules.lift;
    if(!mod || !mod.plan || !(mod.plan.workouts||[]).some(w=>w.cali)) return fn.apply(this, arguments);
    const todos = mod.plan.workouts;
    mod.plan.workouts = todos.filter(w=>!w.cali);
    let r;
    try{ r = fn.apply(this, arguments); }
    finally{ mod.plan.workouts = todos; }
    caliRegenTudo();
    return r;
  };
}
window.regenLiftExercises = _semCali(regenLiftExercises);
window.variarLiftExercises = _semCali(variarLiftExercises);
const _restoreWorkoutCali = restoreWorkout;
window.restoreWorkout = function(k){
  const mod = state.modules.lift; const w = mod && mod.plan && (mod.plan.workouts||[]).find(x=>x.k===k);
  if(w && w.cali){ caliRegenWorkout(w, mod.setup); saveData(); renderSessions(); toast('Treino recalculado com suas progressões atuais.'); return; }
  return _restoreWorkoutCali.apply(this, arguments);
};
// "Trocar" num exercício de calistenia = progressão, regressão ou outra cadeia do mesmo padrão
const _openSwapCali = openSwapExercise;
window.openSwapExercise = function(exId){
  const mod = state.modules.lift; const w = mod && mod.plan && (mod.plan.workouts||[]).find(x=>(x.exercises||[]).some(e=>e.id===exId));
  const e = w && w.exercises.find(x=>x.id===exId);
  if(!(w && w.cali && e && e.cadeia)) return _openSwapCali.apply(this, arguments);
  caliAbrirTroca(e.cadeia);
};
function caliAbrirTroca(cid){
  const st = state.modules.lift.setup; const c = caliCadeia(cid); const i = caliPos(st, cid);
  const linha = (it, k)=>{ const ok = caliEquipOk(it, st) && caliItemPermitido(it, st); const atual = k===i;
    return `<div class="cl-step ${atual?'on':''} ${ok?'':'off'}"><span class="cl-nv n${it[1]}">${CALI_NIVEL[it[1]]}</span><div style="flex:1;min-width:0"><b>${mtEsc(it[0])}</b>${ok?'':`<small>precisa de: ${(it[3]||[]).map(x=>CALI_EQUIP_LBL[x]).join(' ou ')}</small>`}</div>${atual?'<span class="pill on">atual</span>':(ok && k<i?`<button class="btn btn-ghost" onclick="caliDefinirPos('${cid}',${k},true)">Voltar</button>`:'')}</div>`; };
  const prox = c.itens.slice(i+1).findIndex(it=>caliEquipOk(it,st) && caliItemPermitido(it,st));
  const proxIdx = prox<0 ? -1 : i+1+prox;
  const dom = caliDominio(slug(c.itens[i][0]));
  const outras = CALI_CADEIAS.filter(x=>x.pad===c.pad && x.id!==cid && !x.skill && caliPos(st, x.id)>=0);
  $('modal-inner').innerHTML = `<h3>${mtEsc(c.titulo)}</h3>
    <p class="mt-muted" style="margin:0 0 10px">Na calistenia, “trocar” é subir ou descer na progressão. Avançar só é liberado quando você domina a variação atual (2 sessões seguidas no topo da faixa, com execução limpa).</p>
    <div class="cl-steps">${c.itens.map(linha).join('')}</div>
    ${proxIdx>=0 ? (dom.ok ? `<button class="btn btn-primary btn-block" style="margin-top:12px" onclick="caliDefinirPos('${cid}',${proxIdx})">Avançar para ${mtEsc(c.itens[proxIdx][0])}</button>`
      : `<div class="note" style="margin-top:12px"><div class="note-line">${mtEsc(dom.motivo)}</div></div>`) : ''}
    ${outras.length?`<div class="mt-sec">Outra opção para o mesmo movimento</div>${outras.map(o=>`<div class="list-row" onclick="caliPreferir('${c.pad}','${o.id}')">${mtEsc(o.titulo)}<span style="margin-left:auto;color:var(--text-mute);font-size:12px">${mtEsc(o.itens[caliPos(st,o.id)][0])} ›</span></div>`).join('')}`:''}
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function caliPreferir(pad, cid){ const st = state.modules.lift.setup; st.caliPref = st.caliPref || {}; st.caliPref[pad] = cid; caliRegenTudo(); saveData(); closeModal(); renderSessions(); toast('Treinos atualizados.'); }

// ---- domínio e progressão (nada sobe sozinho sem domínio verificado) ----
function caliSessoesEx(exId){ return ((state.progress||{})[exId]||[]).filter(p=>p.sets && p.sets.length).sort((a,b)=>a.date-b.date); }
function caliDominio(exId){
  const sess = caliSessoesEx(exId);
  const plano = (state.modules.lift?.plan?.workouts||[]).flatMap(w=>w.exercises||[]).find(e=>e.id===exId);
  const range = (typeof repRangeFor==='function') ? repRangeFor(exId) : {lo:8, hi:12};
  const setsAlvo = plano ? (+plano.sets||3) : 3;
  const precisa = (state.config_cali && state.config_cali.sessoesDominio) || caliConfig.sessoesDominio || 2;
  if(sess.length < precisa) return { ok:false, motivo:`Registre esta variação em pelo menos ${precisa} sessões para o app avaliar o domínio.` };
  const ult = sess.slice(-precisa);
  const topo = s => s.sets.length >= setsAlvo && s.sets.every(x=>(+x.reps||0) >= range.hi);
  if(ult.some(s=>s.qual==='ajuste')) return { ok:false, motivo:'Você marcou a execução como “com ajustes” recentemente. Domine a técnica antes de avançar.' };
  if(!ult.every(topo)) return { ok:false, motivo:`Para avançar: ${setsAlvo} séries no topo da faixa (${range.hi}${plano && plano.unit==='tempo'?' s':' repetições'}) em ${precisa} sessões seguidas.` };
  return { ok:true, motivo:'Domínio confirmado.' };
}
function caliDificuldade(exId){
  const sess = caliSessoesEx(exId).slice(-2);
  if(sess.length < 2) return false;
  const range = repRangeFor(exId);
  return sess.every(s=>s.sets.filter(x=>(+x.reps||0) < range.lo).length >= Math.ceil(s.sets.length/2) || s.qual==='ajuste');
}
function caliDefinirPos(cid, idx, regressao){
  const mod = state.modules.lift; const st = mod.setup; const c = caliCadeia(cid);
  const de = caliPos(st, cid);
  if(!regressao && idx > de){
    const dom = caliDominio(slug(c.itens[de][0]));
    if(!dom.ok){ toast(dom.motivo); return; }
    // nunca pula etapas: vai para a PRÓXIMA variação possível com o equipamento do aluno
    const k = c.itens.slice(de+1).findIndex(it=>caliEquipOk(it,st) && caliItemPermitido(it,st));
    if(k<0){ toast('Não há próxima variação disponível com seus equipamentos.'); return; }
    idx = de+1+k;
  }
  st.caliPos = st.caliPos || {}; st.caliPos[cid] = idx;
  st.caliHist = st.caliHist || []; st.caliHist.push({ c:cid, de, para:idx, at:Date.now() }); st.caliHist = st.caliHist.slice(-200);
  caliRegenTudo(); saveData(); closeModal();
  toast(regressao ? `Ajustado para ${c.itens[idx][0]}. Volte a subir quando estiver sólido.` : `🎉 Progressão: ${c.itens[idx][0]}`);
  if(state.ui.tab==='sessions') renderSessions(); else if(state.ui.tab==='home') renderHome();
}
// dica no registro de séries + campo de qualidade da execução
const _hintCali = smartProgressionHint;
window.smartProgressionHint = function(exId){
  if(!ehCali(exId) || !state.modules.lift || !state.modules.lift.setup) return _hintCali.apply(this, arguments);
  const st = state.modules.lift.setup; const it0 = CALI_EX[exId];
  const noPlano = (state.modules.lift.plan && state.modules.lift.plan.workouts || []).flatMap(w=>w.exercises||[]).find(e=>e.id===exId && e.cadeia);
  const cid = noPlano ? noPlano.cadeia : it0.cadeia;
  const c = caliCadeia(cid); const i = caliPos(st, cid);
  const it = { nome: it0.nome, cadeia: cid };
  const dom = caliDominio(exId);
  const proxI = c.itens.slice(i+1).findIndex(x=>caliEquipOk(x,st) && caliItemPermitido(x,st));
  const prox = proxI<0 ? null : c.itens[i+1+proxI];
  if(dom.ok && prox) return { cls:'card-ok', txt:`📈 Domínio confirmado em <b>${mtEsc(it.nome)}</b>. Próxima variação: <b>${mtEsc(prox[0])}</b>. <button class="btn btn-primary" style="padding:6px 12px;font-size:12px;margin-top:6px" onclick="closeSetLog(true);setTimeout(()=>caliAbrirTroca('${it.cadeia}'),120)">Ver progressão</button>` };
  if(caliDificuldade(exId) && i>0) return { cls:'card-warn', txt:`⚖️ Nas 2 últimas sessões a maioria das séries ficou abaixo da faixa (ou com ajustes). Vale voltar para <b>${mtEsc(c.itens[i-1][0])}</b> e consolidar. <button class="btn btn-ghost" style="padding:6px 12px;font-size:12px;margin-top:6px" onclick="closeSetLog(true);setTimeout(()=>caliAbrirTroca('${it.cadeia}'),120)">Ajustar</button>` };
  const base = _hintCali.apply(this, arguments);
  return { cls: base.cls, txt: base.txt.replace(/uma variação mais (difícil|avançada)/,'avançar de variação quando o app confirmar o domínio') };
};
const _renderSetLogCali = renderSetLogModal;
window.renderSetLogModal = function(){
  _renderSetLogCali.apply(this, arguments);
  try{
    const { exId, entry } = curLog; if(!ehCali(exId)) return;
    const box = document.createElement('div'); box.className = 'cl-qual';
    const q = entry.qual || '';
    box.innerHTML = `<div class="mt-muted" style="font-size:12px;margin-bottom:6px">Como foi a execução hoje?</div><div class="mod-toggle" style="margin:0"><button class="seg ${q==='limpa'?'on':''}" onclick="caliQual('limpa')">Limpa, amplitude completa</button><button class="seg ${q==='ajuste'?'on':''}" onclick="caliQual('ajuste')">Com ajustes</button></div>`;
    const ref = [...document.querySelectorAll('#modal-inner .btn-block')].find(b=>/Nova série/.test(b.textContent));
    if(ref) ref.before(box);
  }catch(e){}
};
function caliQual(v){ if(!curLog) return; curLog.entry.qual = v; saveData(); renderSetLogModal(); }
// nome e "carga opcional" dos exercícios de calistenia
const _nomeDoExCali = nomeDoEx;
window.nomeDoEx = function(id){ return CALI_EX[id] ? CALI_EX[id].nome : _nomeDoExCali(id); };
const _cargaOpcCali = exCargaOpcional;
window.exCargaOpcional = function(id){ return CALI_EX[id] ? true : _cargaOpcCali(id); };

// ---- configuração (tela de montagem) ----
function caliMostrarSetup(){
  const m = readOpt('lift-modalidade') || 'musculacao';
  const box = $('cali-setup'); if(box) box.style.display = (m==='musculacao') ? 'none' : '';
  document.querySelectorAll('#scr-setup-lift .gym-only').forEach(el=>{
    const ehEquip = !!el.querySelector('#lift-equip'), ehNivel = !!el.querySelector('#lift-level');
    el.style.display = (m==='calistenia') ? 'none' : (m==='hibrido' ? ((ehEquip||ehNivel||true) ? '' : 'none') : '');
  });
  try{ const bn = document.querySelector('#scr-setup-lift .brand-name'); if(bn) bn.textContent = ({musculacao:'MUSCULAÇÃO', calistenia:'CALISTENIA', hibrido:'HÍBRIDO'})[m]; }catch(e){}
  const h = $('lift-modal-hint');
  if(h) h.textContent = m==='calistenia' ? 'Peso do corpo como base: progressões por variação, isometrias e habilidades.' : m==='hibrido' ? 'Musculação para pernas e volume; calistenia para puxar, empurrar e habilidades.' : 'Academia, halteres ou peso do corpo, com progressão de carga.';
}
function caliLerSetup(){
  const m = readOpt('lift-modalidade') || 'musculacao';
  if(m==='musculacao') return { modalidade:'musculacao' };
  const multi = id=>[...document.querySelectorAll('#'+id+' .opt-multi.on')].map(o=>o.dataset.val);
  const num = id=>{ const v = ($(id)||{}).value; return v===''||v==null ? null : Math.max(0, parseInt(v,10)||0); };
  const cg = readOpt('cali-goal') || 'hipertrofia';
  const goalGym = {forca:'forca', hipertrofia:'hipertrofia', resistencia:'resistencia', condicionamento:'emagrecimento', habilidades:'forca'}[cg];
  const nv = parseInt(readOpt('cali-nivel')||'1',10);
  const ex = { modalidade:m, caliGoal:cg, caliTempo:parseInt(readOpt('cali-tempo')||'45',10), caliNivelDecl:nv, caliEquip:multi('cali-equip'), caliLimites:multi('cali-limites'),
    caliTeste:{ flexao:num('ct-flexao'), barra:num('ct-barra'), dips:num('ct-dips'), prancha:num('ct-prancha') } };
  if(m==='calistenia'){ ex.goal = goalGym; ex.level = ['','iniciante','intermediario','avancado','avancado'][nv]; ex.equip = 'casa'; }
  // recriar: mantém posições e histórico de progressão já conquistados
  const prev = state.modules.lift && state.modules.lift.setup;
  if(prev && prev.caliPos){ ex.caliPos = prev.caliPos; ex.caliHist = prev.caliHist; ex.caliPref = prev.caliPref; }
  return ex;
}
const _finishSetupCali = finishSetup;
window.finishSetup = function(m){
  if(m==='lift'){ try{ window.__caliExtra = caliLerSetup(); }catch(e){ window.__caliExtra = null; } }
  return _finishSetupCali.apply(this, arguments);
};
const _buildingStepsCali = buildingSteps;
window.buildingSteps = function(m, setup, prev){
  if(m!=='lift' || !setup || !(setup.modalidade==='calistenia' || setup.modalidade==='hibrido')) return _buildingStepsCali.apply(this, arguments);
  const eq = (setup.caliEquip||[]).map(x=>CALI_EQUIP_LBL[x]);
  const d = Math.max(3, Math.min(6, setup.days||3));
  const steps = [
    {pri:1, txt:`Modalidade: <b>${setup.modalidade==='hibrido'?'Híbrido (musculação + calistenia)':'Calistenia'}</b>`},
    {pri:1, txt:`Objetivo: <b>${({forca:'Força',hipertrofia:'Hipertrofia',resistencia:'Resistência',condicionamento:'Condicionamento',habilidades:'Domínio de habilidades'})[setup.caliGoal]}</b> · ${setup.caliTempo} min por sessão`},
    {pri:2, txt:`Equipamentos: <b>${eq.length?eq.join(', '):'só o peso do corpo'}</b>`},
    {pri:1, txt:`Divisão: <b>${setup.modalidade==='hibrido'?d+' dias, alternando academia e calistenia':CALI_SPLITS[d].nome}</b>`},
    {pri:2, txt:`Ajustando cada movimento ao seu nível${setup.caliTeste && Object.values(setup.caliTeste).some(v=>v!=null)?' e ao seu <b>teste rápido</b>':''}`}
  ];
  if((setup.caliLimites||[]).length) steps.push({pri:1, txt:`Respeitando suas limitações: <b>${setup.caliLimites.map(x=>({semimpacto:'sem saltos',punho:'punhos',ombro:'ombros',joelho:'joelhos'})[x]).join(', ')}</b>`});
  if(prev) steps.push({pri:1, txt:`Preservando seu <b>histórico</b> e suas <b>progressões</b>`});
  steps.push({pri:1, txt:`<b>Seu plano de ${setup.modalidade==='hibrido'?'treino híbrido':'calistenia'} está pronto!</b>`});
  return steps;
};
const _openSetupCali = openSetupScreen;
window.openSetupScreen = function(m){
  const r = _openSetupCali.apply(this, arguments);
  if(m==='lift'){
    try{
      const st = state.modules.lift && state.modules.lift.setup;
      const setOn = (gid,val)=>{ const g=$(gid); if(!g||val==null) return; const t=g.querySelector(`.opt[data-val="${val}"]`); if(!t) return; g.querySelectorAll('.opt:not(.opt-multi)').forEach(o=>o.classList.remove('on')); t.classList.add('on'); };
      const pre = window.__caliPreMod || (st && st.modalidade) || 'musculacao'; window.__caliPreMod = null;
      setOn('lift-modalidade', pre);
      if(st && st.caliGoal){ setOn('cali-goal', st.caliGoal); setOn('cali-tempo', st.caliTempo); setOn('cali-nivel', st.caliNivelDecl);
        ['cali-equip','cali-limites'].forEach(id=>{ const lista = id==='cali-equip'?(st.caliEquip||[]):(st.caliLimites||[]); document.querySelectorAll('#'+id+' .opt-multi').forEach(o=>o.classList.toggle('on', lista.includes(o.dataset.val))); }); }
      document.querySelectorAll('#lift-modalidade .opt').forEach(o=>o.addEventListener('click', ()=>setTimeout(caliMostrarSetup, 0)));
      // equipamentos e limitações: seleção livre (o binding padrão da tela limita pelos dias da semana)
      document.querySelectorAll('#cali-equip .opt-multi, #cali-limites .opt-multi').forEach(o=>{ o.onclick = ()=>o.classList.toggle('on'); });
      caliMostrarSetup();
    }catch(e){ console.log('setup cali', e); }
  }
  return r;
};
// trocar de modalidade a qualquer momento (o histórico fica)
function openModalidade(){
  const m = modalidadeAtual();
  const op = (k, t, d)=>`<div class="ap-pack ${k===m?'on':''}" onclick="closeModal();window.__caliPreMod='${k}';openSetupScreen('lift')"><div style="flex:1"><b style="font-size:14px">${t}</b>${k===m?' <span style="color:var(--primary-2)">✓ atual</span>':''}<div style="font-size:12px;color:var(--text-mute);margin-top:2px">${d}</div></div></div>`;
  $('modal-inner').innerHTML = `<h3>Modalidade de treino</h3><p class="mt-muted" style="margin:0 0 10px">Ao trocar, o plano é refeito. Histórico, recordes, conquistas e progressões continuam salvos.</p>
    ${op('musculacao','Musculação tradicional','Academia, halteres ou casa, com progressão de carga.')}
    ${op('calistenia','Calistenia','Peso do corpo, progressões por variação e habilidades.')}
    ${op('hibrido','Híbrido','Academia para pernas e volume, calistenia para puxar, empurrar e habilidades.')}
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`;
  $('modal-back').classList.add('on');
}

// ---- nível real (pelas progressões registradas, não pelo cadastro) ----
function caliNivelReal(){
  const st = state.modules.lift && state.modules.lift.setup; if(!st) return null;
  const base = ['flexao','barra','dips','unilateral','core_anti','hspu'];
  const niveis = base.map(cid=>{ const i = caliPos(st, cid); return i>=0 ? caliCadeia(cid).itens[i][1] : null; }).filter(Boolean).sort((a,b)=>a-b);
  if(!niveis.length) return null;
  let nv = niveis[Math.floor(niveis.length/2)];
  const skillsAv = ['frontlever','planche','backlever','flag','muscleup','handstand'].filter(cid=>caliReqOk(st,cid) && caliPos(st,cid)>=0 && caliCadeia(cid).itens[caliPos(st,cid)][1]===4).length;
  if(nv>=3 && skillsAv>=2) nv = 4; else nv = Math.min(nv, 3);
  // só conta como "real" o que tem registro: sem séries registradas, mostra o nível de partida
  const registrou = Object.keys(state.progress||{}).some(id=>ehCali(id) && caliSessoesEx(id).length);
  return { nivel:nv, nome:CALI_NIVEL[nv], medido: registrou };
}
function caliResumoHabilidades(){
  const st = state.modules.lift.setup;
  return CALI_CADEIAS.filter(c=>c.skill).map(c=>{ const i = caliPos(st, c.id); const lib = caliReqOk(st, c.id) && i>=0; return { c, i, lib, total:c.itens.length, atual: i>=0 ? c.itens[i][0] : null }; });
}

// ---- Home, Progresso e textos da modalidade ----
const _renderModToggleCali = renderModToggle;
window.renderModToggle = function(){
  _renderModToggleCali.apply(this, arguments);
  try{ const m = modalidadeAtual(); if(m==='musculacao') return; const b = [...document.querySelectorAll('#mod-toggle .seg')].find(x=>/Muscula/.test(x.textContent)); if(b) b.innerHTML = b.innerHTML.replace('Musculação', m==='calistenia'?'Calistenia':'Híbrido'); }catch(e){}
};
function renderHomeCali(){
  const wrap = document.querySelector('#scr-home .wrap'); if(!wrap) return;
  let el = $('home-cali');
  if(!temCali() || !state.modules.lift || state.active!=='lift'){ if(el) el.remove(); return; }
  if(!el){ el = document.createElement('div'); el.id = 'home-cali'; el.className = 'card'; wrap.appendChild(el); }
  const nr = caliNivelReal();
  const hs = caliResumoHabilidades();
  const lib = hs.filter(h=>h.lib);
  const prox = hs.filter(h=>!h.lib).slice(0,2);
  el.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><div class="card-title" style="margin:0">Calistenia</div>${nr?`<span class="pill on">${nr.nome}${nr.medido?'':' (inicial)'}</span>`:''}</div>
    ${lib.length ? `<div class="cl-skills">${lib.map(h=>`<div class="cl-sk" onclick="caliAbrirTroca('${h.c.id}')"><div class="cl-sk-t">${mtEsc(h.c.titulo)}</div><div class="cl-dots">${h.c.itens.map((_,k)=>`<i class="${k<h.i?'ok':k===h.i?'now':''}"></i>`).join('')}</div><small>${mtEsc(h.atual)}</small></div>`).join('')}</div>`
      : `<div class="mt-muted" style="margin-top:6px">Nenhuma habilidade liberada ainda — a base de força vem primeiro.</div>`}
    ${prox.length?`<div class="mt-muted" style="font-size:11.5px;margin-top:8px">Para liberar ${prox.map(p=>`<b>${mtEsc(p.c.titulo)}</b>: ${mtEsc(caliReqTexto(p.c.id))}`).join(' · ')}</div>`:''}`;
}
mtGancho('renderHome', { depois(){ try{ renderHomeCali(); }catch(e){ console.log('home cali', e); } }});
// Progresso: métricas próprias (repetições e tempo de isometria em calistenia)
const _mtMetricasCali = mtMetricas;
window.mtMetricas = function(){
  const M = _mtMetricasCali.apply(this, arguments);
  if(!Object.keys(state.progress||{}).some(ehCali)) return M;
  const soma = (bs, unidade)=>bs.map(b=>{ let v = 0; Object.keys(state.progress||{}).forEach(id=>{ const it = CALI_EX[id]; if(!it || (it.unit==='t') !== (unidade==='t')) return; (state.progress[id]||[]).forEach(p=>{ if(p.date>=b.a && p.date<b.b) v += (p.sets||[]).reduce((t,s)=>t+(+s.reps||0),0); }); }); return {v, b}; });
  M.push({k:'cali_reps', lbl:'Calistenia (repetições)', tipo:'bar', un:'reps', dec:0, pers:['semana','mes','tri','ano'], serie:bs=>soma(bs,'r'), soma:true});
  M.push({k:'cali_iso', lbl:'Isometria (segundos)', tipo:'bar', un:'s', dec:0, pers:['semana','mes','tri','ano'], serie:bs=>soma(bs,'t'), soma:true});
  return M;
};
mtGancho('renderPerf', { depois(){
  try{
    let el = $('perf-cali');
    if(!temCali() || !state.modules.lift){ if(el) el.remove(); return; }
    if(!el){ el = document.createElement('div'); el.id = 'perf-cali'; el.className = 'chart-card'; const ev = $('perf-evo'); if(ev) ev.after(el); else return; }
    const st = state.modules.lift.setup;
    const base = CALI_CADEIAS.filter(c=>!c.alt && caliPos(st,c.id)>=0 && (!c.skill || caliReqOk(st,c.id)));
    const hist = (st.caliHist||[]).slice(-5).reverse();
    el.innerHTML = `<div class="chart-title" style="margin-bottom:10px">Progressões da calistenia</div>
      ${base.map(c=>{ const i = caliPos(st,c.id); return `<div class="cl-row" onclick="caliAbrirTroca('${c.id}')"><div style="flex:1;min-width:0"><b>${mtEsc(c.titulo)}</b><small>${mtEsc(c.itens[i][0])}</small></div><div class="cl-dots">${c.itens.map((_,k)=>`<i class="${k<i?'ok':k===i?'now':''}"></i>`).join('')}</div></div>`; }).join('')}
      ${hist.length?`<div class="mt-sec" style="margin-top:12px">Últimas mudanças</div>${hist.map(h=>{ const c = caliCadeia(h.c); return c?`<div class="mt-muted" style="font-size:12px;padding:3px 0">${mtFmtData(h.at)} · ${h.para>h.de?'↑':'↓'} ${mtEsc(c.itens[h.para][0])}</div>`:''; }).join('')}`:'<div class="mt-muted" style="font-size:12px;margin-top:8px">As mudanças de variação aparecem aqui conforme você evolui.</div>'}`;
  }catch(e){ console.log('perf cali', e); }
}});
// Treinos: avisos da sessão de calistenia (equipamento faltando, recuperação)
mtGancho('renderSessions', { depois(){
  try{
    const mod = state.modules.lift; if(state.active!=='lift' || !mod || !mod.plan) return;
    const t = $('sessions-title'); const m = modalidadeAtual();
    if(t && m!=='musculacao') t.textContent = t.textContent.replace(/Musculação|Treinos/,'').trim() + (m==='calistenia' ? ' Calistenia' : ' Híbrido');
    const avisos = [...new Set((mod.plan.workouts||[]).flatMap(w=>w.caliAvisos||[]))];
    let box = $('sess-cali-avisos');
    if(!avisos.length){ if(box) box.remove(); return; }
    if(!box){ box = document.createElement('div'); box.id = 'sess-cali-avisos'; const slot = $('session-detail-slot'); if(slot) slot.before(box); }
    box.innerHTML = `<div class="note" style="margin-top:10px">${avisos.map(a=>`<div class="note-line">${mtEsc(a)}</div>`).join('')}</div>`;
  }catch(e){}
}});
// Perfil: linha "Modalidade"
mtGancho('renderProfile', { depois(){
  try{
    if(!state.modules.lift) return;
    let row = $('pf-modalidade-row');
    if(!row){ const ref = [...document.querySelectorAll('#scr-profile .list-row')].find(x=>/Meu plano de treino/.test(x.textContent)); if(!ref) return;
      row = document.createElement('div'); row.className = 'list-row'; row.id = 'pf-modalidade-row'; row.onclick = openModalidade; ref.after(row); }
    const m = modalidadeAtual(); const nr = temCali() ? caliNivelReal() : null;
    row.innerHTML = `<span>🤸</span> <span>Modalidade</span><span style="margin-left:auto;color:var(--text-mute);font-size:12px">${({musculacao:'Musculação',calistenia:'Calistenia',hibrido:'Híbrido'})[m]}${nr?' · '+nr.nome:''} ›</span>`;
  }catch(e){}
}});

// ---- Biblioteca e ficha ----
const CALI_AREAS = ['Superior','Inferior','Core','Habilidades'];
const _exPorNomeCali = exPorNome;
window.exPorNome = function(nome){
  const r = _exPorNomeCali(nome); if(r) return r;
  const it = CALI_EX[slug(nome)]; if(!it) return null;
  return { ex:{ name:it.nome, sub:`${caliCadeia(it.cadeia).titulo} · ${CALI_NIVEL[it.nivel]}`, equip:[], caliEquip:it.equip }, grupo:it.grupo, cali:it };
};
const _musculoCali = musculoDoExercicio;
window.musculoDoExercicio = function(ex, grupo){
  const it = ex && CALI_EX[slug(ex.name||'')];
  if(it){ const map = {Peito:'peito', Costas:'costas', Ombro:'ombros', 'Tríceps':'triceps', Pernas:'quadriceps', 'Glúteos':'gluteos', Panturrilha:'panturrilhas', Core:'abdomen'}; if(it.cadeia==='nordic') return 'posteriores'; return map[it.grupo] || 'abdomen'; }
  return _musculoCali(ex, grupo);
};
const _fichaCali = fichaExercicio;
window.fichaExercicio = function(ex, grupo){
  const it = ex && CALI_EX[slug(ex.name||'')];
  if(!it) return _fichaCali(ex, grupo);
  return { m: it.mus, ex: it.exec, d: [it.seg || 'Qualidade antes de quantidade: amplitude completa e controle em toda repetição.'], e: it.erro };
};
// informação extra da calistenia na ficha (nível, prescrição, progressão, pré-requisitos, equipamentos)
const _openSheetCali = openExerciseSheet;
window.openExerciseSheet = function(name, idKey, opts){
  _openSheetCali.apply(this, arguments);
  try{
    const it = CALI_EX[slug(name)]; if(!it) return;
    const c = caliCadeia(it.cadeia); const st = (state.modules.lift && state.modules.lift.setup) || {caliGoal:'hipertrofia', caliNivelDecl:it.nivel};
    const pr = caliPrescrever(c.itens[it.idx], Object.assign({}, st, {caliGoal: st.caliGoal || 'hipertrofia'}), c.skill);
    const ant = it.idx>0 ? c.itens[it.idx-1][0] : null, prox = it.idx<c.itens.length-1 ? c.itens[it.idx+1][0] : null;
    const box = document.createElement('div');
    box.innerHTML = `<div class="ex-sec"><h4>Calistenia</h4>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="cl-nv n${it.nivel}">${CALI_NIVEL[it.nivel]}</span><span class="pill">${mtEsc(c.titulo)}</span><span class="pill">${it.equip.length?it.equip.map(x=>CALI_EQUIP_LBL[x]).join(' ou '):'sem equipamento'}</span></div>
      <p><b>Prescrição sugerida:</b> ${pr.sets} séries × ${mtEsc(pr.reps)} · descanso ${mtEsc(pr.rest)}</p>
      ${ant?`<p style="margin-top:6px"><b>Regressão:</b> <a href="#" onclick="openExerciseSheet('${mtJsStr(ant)}');return false" style="color:var(--primary-2)">${mtEsc(ant)}</a></p>`:''}
      ${prox?`<p style="margin-top:4px"><b>Progressão:</b> <a href="#" onclick="openExerciseSheet('${mtJsStr(prox)}');return false" style="color:var(--primary-2)">${mtEsc(prox)}</a></p>`:''}
      ${c.req && it.idx===0?`<p style="margin-top:6px"><b>Pré-requisitos:</b> ${mtEsc(caliReqTexto(c.id))}</p>`:''}</div>`;
    const ref = document.querySelector('#modal-inner .ex-sec'); if(ref) ref.before(box.firstElementChild);
  }catch(e){}
};
const _renderLibraryCali = renderLibrary;
window.renderLibrary = function(){
  // a Biblioteca ganha as categorias de calistenia (e o filtro por nível dentro delas)
  const cal = typeof libFilter==='string' && libFilter.startsWith('Calistenia');
  if(!cal){
    _renderLibraryCali.apply(this, arguments);
    const chips = $('lib-chips'); if(chips) chips.insertAdjacentHTML('beforeend', `<div class="filter-chip" onclick="setLibFilter('Calistenia')">🤸 Calistenia</div>`);
    const cnt = $('lib-count'); if(cnt && libFilter==='Todos' && !($('lib-search')||{}).value) cnt.textContent = cnt.textContent + ` + ${Object.keys(CALI_EX).length} de calistenia`;
    // busca também encontra calistenia
    const q = mtNorm(($('lib-search')||{}).value||'').trim();
    if(q){ const achados = Object.values(CALI_EX).filter(it=>mtNorm(it.nome+' '+it.mus+' '+caliCadeia(it.cadeia).titulo).includes(q));
      if(achados.length) $('lib-list').insertAdjacentHTML('beforeend', `<div class="lx-cat">${muscleIco('abdomen')}<div><b>Calistenia</b><small>${achados.length} exercício${achados.length>1?'s':''}</small></div></div>` + achados.map(_caliLibItem).join('')); }
    return;
  }
  const area = libFilter.split('·')[1] ? libFilter.split('·')[1].trim() : null;
  const nvSel = window.__caliNvLib || 0;
  $('lib-chips').innerHTML = `<div class="filter-chip" onclick="setLibFilter('Todos')">← Musculação</div>` + ['Calistenia', ...CALI_AREAS.map(a=>'Calistenia · '+a)].map(f=>`<div class="filter-chip ${f===libFilter?'on':''}" onclick="setLibFilter('${f}')">${f==='Calistenia'?'Todos':f.split('·')[1].trim()}</div>`).join('');
  const eq = $('lib-equip'); if(eq) eq.innerHTML = [0,1,2,3,4].map(n=>`<div class="filter-chip ${n===nvSel?'on':''}" onclick="window.__caliNvLib=${n};renderLibrary()">${n?CALI_NIVEL[n]:'Todos os níveis'}</div>`).join('');
  const q = mtNorm(($('lib-search')||{}).value||'').trim();
  let html = '', total = 0;
  CALI_CADEIAS.filter(c=>!area || c.area===area).forEach(c=>{
    const its = c.itens.map(it=>CALI_EX[slug(it[0])]).filter((it,k,arr)=>it && arr.indexOf(it)===k && it.cadeia===c.id && (!nvSel || it.nivel===nvSel) && (!q || mtNorm(it.nome+' '+it.mus).includes(q)));
    if(!its.length) return; total += its.length;
    html += `<div class="lx-cat">${muscleIco(window.musculoDoExercicio({name:its[0].nome}))}<div><b>${mtEsc(c.titulo)}</b><small>${c.area} · ${its.length} ${its.length===1?'variação':'variações'}${c.req?' · pré-requisitos: '+mtEsc(caliReqTexto(c.id)):''}</small></div></div>` + its.map(_caliLibItem).join('');
  });
  $('lib-count').textContent = `Calistenia · ${total} exercícios`;
  $('lib-list').innerHTML = html || `<div class="lx-empty">Nenhum exercício com esses filtros.</div>`;
};
function _caliLibItem(it){
  const temVideo = !!(videoLinks && videoLinks[it.id]);
  return `<div class="lx-item" onclick="openExercise('${mtJsStr(it.nome)}')">${muscleIco(window.musculoDoExercicio({name:it.nome}))}<div class="lx-info"><div class="lx-name">${mtEsc(it.nome)}</div><div class="lx-sub">${mtEsc(it.mus)}</div><div class="lx-tags"><span class="cl-nv n${it.nivel}">${CALI_NIVEL[it.nivel]}</span><span class="lx-tag">${it.equip.length?it.equip.map(x=>CALI_EQUIP_LBL[x]).join(' ou '):'sem equipamento'}</span>${temVideo?'<span class="lx-tag v">▶ vídeo</span>':''}</div></div><span class="lx-go">›</span></div>`;
}
// Admin: vídeos dos exercícios de calistenia entram no painel de vídeos existente
const _openVideoAdminCali = openVideoAdmin;
window.openVideoAdmin = async function(){
  const extra = { name:'Calistenia', emo:'🤸', color:'', items: Object.values(CALI_EX).map(it=>({name:it.nome, sub:`${caliCadeia(it.cadeia).titulo} · ${CALI_NIVEL[it.nivel]}`, equip:['casa'], _cali:true})) };
  EX_BANK.push(extra);
  try{ return await _openVideoAdminCali.apply(this, arguments); }
  finally{ const i = EX_BANK.indexOf(extra); if(i>=0) EX_BANK.splice(i,1); }
};

// ---- Meta Assistente ----
function caliAnalise(){
  if(!temCali()) return 'Você está na musculação tradicional. Se quiser treinar calistenia, troque em Perfil → Modalidade (seu histórico continua). 🤸';
  const st = state.modules.lift.setup; const nr = caliNivelReal();
  const linhas = []; const estag = []; const prontos = []; const dificeis = [];
  Object.values(CALI_EX).forEach(it=>{
    if(caliPos(st, it.cadeia) !== it.idx) return;
    const sess = caliSessoesEx(it.id); if(!sess.length) return;
    if(caliDominio(it.id).ok) prontos.push(it.nome);
    else if(caliDificuldade(it.id)) dificeis.push(it.nome);
    else if(sess.length >= 4 && sess[sess.length-1].date - sess[0].date > 21*DIA_MS){
      const tot = s=>s.sets.reduce((a,x)=>a+(+x.reps||0),0);
      const a = tot(sess[sess.length-4]), b = tot(sess[sess.length-1]);
      if(b <= a) estag.push(it.nome);
    }
  });
  let t = `<b>Sua calistenia</b>${nr?` — nível ${nr.medido?'atual':'de partida'}: <b>${nr.nome}</b>`:''}.<br><br>`;
  if(prontos.length) t += `📈 <b>Pronto para avançar:</b> ${prontos.map(mtEsc).join(', ')}. Abra o exercício no treino e toque em “Trocar” para ver a próxima variação.<br><br>`;
  if(estag.length) t += `➖ <b>Sem evolução há 3+ semanas:</b> ${estag.map(mtEsc).join(', ')}. Experimente pausas de 2 s no ponto mais difícil, descida em 3–4 s ou mais uma série — e confira sono e recuperação.<br><br>`;
  if(dificeis.length) t += `⚖️ <b>Abaixo da faixa nas últimas sessões:</b> ${dificeis.map(mtEsc).join(', ')}. Uma variação mais fácil por 1–2 semanas costuma destravar com segurança.<br><br>`;
  if(!prontos.length && !estag.length && !dificeis.length) t += 'Ainda não há registros suficientes para uma análise. Registre repetições (ou tempo) de cada série e me pergunte de novo depois de algumas sessões.<br><br>';
  t += 'Regra da casa: só avançamos de variação depois de 2 sessões no topo da faixa com execução limpa.';
  return t;
}
function caliMetas(){
  if(!temCali()) return caliAnalise();
  const hs = caliResumoHabilidades();
  return `<b>Suas habilidades</b><br><br>` + hs.map(h=>h.lib ? `✅ <b>${mtEsc(h.c.titulo)}</b>: etapa ${h.i+1} de ${h.total} (${mtEsc(h.atual)})` : `🔒 <b>${mtEsc(h.c.titulo)}</b>: libera com ${mtEsc(caliReqTexto(h.c.id))}${(h.c.itens[0][3]||[]).length && !caliEquipOk(h.c.itens[0], state.modules.lift.setup)?` (precisa de ${(h.c.itens[0][3]).map(x=>CALI_EQUIP_LBL[x]).join(' ou ')})`:''}`).join('<br>') + '<br><br>Os pré-requisitos existem por segurança: alavancas e paradas exigem força de base nos ombros, punhos e costas.';
}
function caliComoFazer(txt){
  const t = mtNorm(txt);
  const it = Object.values(CALI_EX).find(x=>t.includes(mtNorm(x.nome).replace(/\(.*\)/,'').trim())) || Object.values(CALI_EX).find(x=>{ const w = mtNorm(x.nome).split(' ').filter(p=>p.length>3); return w.length && w.every(p=>t.includes(p)); });
  if(!it) return null;
  const c = caliCadeia(it.cadeia);
  return `<b>${mtEsc(it.nome)}</b> (${CALI_NIVEL[it.nivel]} · ${mtEsc(c.titulo)})<br><br>${it.exec.map((x,i)=>`${i+1}. ${mtEsc(x)}`).join('<br>')}<br><br>⚠️ Erro comum: ${mtEsc(it.erro)}${it.seg?'<br>🛡️ '+mtEsc(it.seg):''}${it.idx>0?`<br><br>Mais fácil: ${mtEsc(c.itens[it.idx-1][0])}`:''}${it.idx<c.itens.length-1?` · Mais difícil: ${mtEsc(c.itens[it.idx+1][0])}`:''}<br><br><button class="btn btn-ghost" style="padding:7px 12px;font-size:12.5px" onclick="closeAssistant();openExercise('${mtJsStr(it.nome)}')">Abrir ficha e vídeo</button>`;
}
Object.assign(MA_ANSWERS, { cali_analise: caliAnalise, cali_metas: caliMetas });
const _maInterpretCali = maInterpret;
maInterpret = function(txt){
  const t = mtNorm(txt); const has = (...w)=>w.some(x=>t.includes(x));
  if(has('calistenia','progressao','progressão','regressao','proxima variacao','próxima variação') && has('como estou','analis','evolu','progress','regress','avanc','estagn')) return 'cali_analise';
  if(has('front lever','planche','muscle up','muscle-up','human flag','back lever','handstand','parada de mao','l-sit','habilidade') && has('quando','libera','falta','meta','pre-requisito','prerequisito','consigo','progresso')) return 'cali_metas';
  if(has('como faz','como fazer','como executar','execucao','execução','tecnica','técnica')){ const r = caliComoFazer(txt); if(r){ window.__caliResp = r; return 'cali_como'; } }
  return _maInterpretCali(txt);
};
MA_ANSWERS.cali_como = ()=>window.__caliResp || 'Me diga o nome do exercício.';
const _sugCali = MA_SUGGESTIONS.slice();
function caliAjustarSugestoes(){
  const tem = MA_SUGGESTIONS.some(s=>s.key==='cali_analise');
  if(temCali() && !tem) MA_SUGGESTIONS.splice(0, 0, {lbl:'🤸 Minha calistenia', key:'cali_analise'}, {lbl:'🎯 Minhas habilidades', key:'cali_metas'});
  if(!temCali() && tem){ for(let i=MA_SUGGESTIONS.length-1;i>=0;i--) if(/^cali_/.test(MA_SUGGESTIONS[i].key)) MA_SUGGESTIONS.splice(i,1); }
}
const _openAssistantCali = openAssistant;
window.openAssistant = function(){ try{ caliAjustarSugestoes(); }catch(e){} return _openAssistantCali.apply(this, arguments); };

// ---- Admin: exercícios, modelos, progressão e uso ----
const caliConfig = { sessoesDominio: 2 };
let caliModelos = [];
try{ caliModelos = JSON.parse(mtLS('mt_cali_modelos')||'[]'); }catch(e){}
function caliModeloAdmin(st, d){
  const m = caliModelos.find(x=>x.ativo!==false && +x.dias===d && (!x.objetivo || x.objetivo===st.caliGoal) && (x.sessoes||[]).length===d);
  return m || null;
}
async function loadCaliAdmin(){
  try{
    const [ex, mo, cf] = await Promise.all([ db.collection('caliExercicios').get(), db.collection('caliModelos').get(), db.collection('config').doc('calistenia').get() ]);
    const exs = []; ex.forEach(d=>exs.push(Object.assign({id:d.id}, d.data())));
    const mods = []; mo.forEach(d=>mods.push(Object.assign({id:d.id}, d.data())));
    caliModelos = mods; mtLS('mt_cali_modelos', JSON.stringify(mods));
    if(cf.exists && cf.data().sessoesDominio) caliConfig.sessoesDominio = Math.max(1, Math.min(4, +cf.data().sessoesDominio));
    mtLS('mt_cali_ex', JSON.stringify(exs)); caliAplicarAdmin(exs);
  }catch(e){ try{ caliAplicarAdmin(JSON.parse(mtLS('mt_cali_ex')||'[]')); }catch(err){} }
}
// exercícios do administrador entram na cadeia escolhida, na posição escolhida; também permite ajustar/desativar os padrões
const _CALI_ORIG = JSON.parse(JSON.stringify(CALI_CADEIAS.map(c=>c.itens)));
function caliAplicarAdmin(lista){
  CALI_CADEIAS.forEach((c,i)=>{ c.itens = JSON.parse(JSON.stringify(_CALI_ORIG[i])); });
  (lista||[]).forEach(x=>{
    const c = caliCadeia(x.cadeia); if(!c) return;
    const k = c.itens.findIndex(it=>slug(it[0])===x.id);
    if(k>=0){
      if(x.ativo===false && c.itens.length>1){ c.itens.splice(k,1); return; }
      if(x.nivel) c.itens[k][1] = +x.nivel;
      if(x.execucao) c.itens[k][7] = String(x.execucao).split('\n').filter(Boolean);
      if(x.erro) c.itens[k][8] = x.erro;
      return;
    }
    if(x.ativo===false || !x.nome) return;
    const it = [x.nome, +x.nivel||1, x.unidade==='t'?'t':'r', x.equip||[], x.grupo||c.itens[0][4], x.faixa||'', x.musculos||'', String(x.execucao||'').split('\n').filter(Boolean), x.erro||'', x.seguranca||''];
    const pos = Math.max(0, Math.min(c.itens.length, x.posicao==null ? c.itens.length : +x.posicao));
    c.itens.splice(pos, 0, it);
  });
  caliIndexar();
}
async function openCaliAdmin(){
  $('modal-inner').innerHTML = `<h3>Calistenia</h3><div class="mt-loading"><div class="ex-spin"></div><span>Carregando…</span></div>`; $('modal-back').classList.add('on');
  await loadCaliAdmin();
  const princ = mtAdmin();
  const us = Object.values(usuariosCache||{}).map(u=>u.estadoApp && u.estadoApp.modules && u.estadoApp.modules.lift && u.estadoApp.modules.lift.setup).filter(Boolean);
  const cont = {musculacao:0, calistenia:0, hibrido:0}; us.forEach(s=>cont[s.modalidade||'musculacao']++);
  const skills = {}; us.filter(s=>s.caliPos).forEach(s=>CALI_CADEIAS.filter(c=>c.skill).forEach(c=>{ if(s.caliPos[c.id]!=null) skills[c.titulo] = (skills[c.titulo]||0)+1; }));
  $('modal-inner').innerHTML = `<h3>Calistenia</h3>
    <div class="adm-kpis"><div class="adm-kpi"><b>${cont.calistenia}</b><small>em calistenia</small></div><div class="adm-kpi"><b>${cont.hibrido}</b><small>no híbrido</small></div><div class="adm-kpi"><b>${cont.musculacao}</b><small>só musculação</small></div></div>
    ${Object.keys(skills).length?`<div class="mt-muted" style="font-size:12px;margin:6px 2px 0">Habilidades em treino: ${Object.entries(skills).map(([k,v])=>`${mtEsc(k)} (${v})`).join(' · ')}</div>`:''}
    <div class="mt-sec">Ferramentas</div>
    <div class="list-row" onclick="openCaliCadeias()">🧗 <span>Exercícios e progressões</span><span style="margin-left:auto;font-size:12px;color:var(--text-mute)">${Object.keys(CALI_EX).length} ›</span></div>
    <div class="list-row" onclick="openCaliModelos()">🗂️ <span>Modelos de plano</span><span style="margin-left:auto;font-size:12px;color:var(--text-mute)">${caliModelos.length} ›</span></div>
    <div class="list-row" onclick="openVideoAdmin()">🎬 <span>Vídeos dos exercícios</span><span style="margin-left:auto;font-size:12px;color:var(--text-mute)">categoria Calistenia ›</span></div>
    ${princ?`<div class="list-row" onclick="caliConfigDominio()">⚙️ <span>Critério de domínio</span><span style="margin-left:auto;font-size:12px;color:var(--text-mute)">${caliConfig.sessoesDominio} sessões no topo ›</span></div>`:''}
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
}
function openCaliCadeias(){
  const princ = mtAdmin();
  $('modal-inner').innerHTML = `<h3>Exercícios e progressões</h3><p class="mt-muted" style="margin:0 0 8px">A ordem é a ordem de progressão. ${princ?'Toque num exercício para editar nível e textos, ou adicione um novo numa posição da cadeia.':'Somente administradores editam.'}</p>
    <div style="max-height:58vh;overflow:auto">${CALI_CADEIAS.map(c=>`<div class="mt-sec">${mtEsc(c.titulo)} · ${c.area}${c.req?' · pré-req.':''}</div>${c.itens.map((it,k)=>`<div class="cl-step" ${princ?`onclick="caliEditarEx('${c.id}',${k})"`:''}><span class="cl-nv n${it[1]}">${CALI_NIVEL[it[1]]}</span><b style="flex:1;font-size:13px">${k+1}. ${mtEsc(it[0])}</b></div>`).join('')}${princ?`<button class="btn btn-ghost" style="padding:6px 10px;font-size:12px;margin:4px 0 8px" onclick="caliEditarEx('${c.id}',-1)">+ Adicionar em ${mtEsc(c.titulo)}</button>`:''}`).join('')}</div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openCaliAdmin()">Voltar</button>`;
}
function caliEditarEx(cid, k){
  if(!mtAdmin()) return;
  const c = caliCadeia(cid); const it = k>=0 ? c.itens[k] : ['',1,'r',[],c.itens[0][4],'','',[],'',''];
  const novo = k<0;
  $('modal-inner').innerHTML = `<h3>${novo?'Novo exercício':'Editar exercício'}</h3><p class="mt-muted" style="margin:0">${mtEsc(c.titulo)}</p>
    <div class="adm-form">
      <label>Nome</label><input class="input" id="ce-nome" value="${mtEsc(it[0])}" ${novo?'':'disabled'}>
      <div style="display:flex;gap:8px"><div style="flex:1"><label>Nível</label><select class="input" id="ce-nivel">${[1,2,3,4].map(n=>`<option value="${n}" ${it[1]===n?'selected':''}>${CALI_NIVEL[n]}</option>`).join('')}</select></div>
      ${novo?`<div style="flex:1"><label>Unidade</label><select class="input" id="ce-un"><option value="r">Repetições</option><option value="t">Tempo (s)</option></select></div>`:''}</div>
      ${novo?`<label>Posição na progressão</label><select class="input" id="ce-pos">${c.itens.map((x,i)=>`<option value="${i+1}">depois de ${mtEsc(x[0])}</option>`).join('')}<option value="0">no início</option></select>
      <label>Equipamentos (precisa de um deles)</label><div style="display:flex;flex-wrap:wrap;gap:6px">${Object.entries(CALI_EQUIP_LBL).map(([kk,l])=>`<label style="text-transform:none;letter-spacing:0;font-size:12.5px;color:var(--text);margin:0"><input type="checkbox" class="ce-eq" value="${kk}"> ${l}</label>`).join('')}</div>
      <label>Músculos trabalhados</label><input class="input" id="ce-mus">`:''}
      <label>Como executar (uma etapa por linha)</label><textarea class="input" id="ce-exec">${mtEsc((it[7]||[]).join('\n'))}</textarea>
      <label>Erro comum</label><input class="input" id="ce-erro" value="${mtEsc(it[8]||'')}">
      ${novo?'':`<label style="display:flex;gap:8px;align-items:center;text-transform:none;letter-spacing:0;font-size:13px;color:var(--text)"><input type="checkbox" id="ce-off"> Desativar este exercício (sai dos planos novos)</label>`}
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" id="ce-salvar" onclick="caliSalvarEx('${cid}',${k})">Salvar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openCaliCadeias()">Voltar</button>`;
}
async function caliSalvarEx(cid, k){
  if(!mtAdmin()) return;
  const c = caliCadeia(cid); const novo = k<0;
  const nome = novo ? $('ce-nome').value.trim() : c.itens[k][0];
  if(nome.length < 3){ toast('Dê um nome ao exercício'); return; }
  const id = slug(nome);
  if(novo && CALI_EX[id]){ toast('Já existe um exercício com esse nome'); return; }
  const dados = { cadeia:cid, nivel:+$('ce-nivel').value, execucao:$('ce-exec').value.trim(), erro:$('ce-erro').value.trim(), atualizadoEm:Date.now(), atualizadoPor:state.user.email };
  if(novo) Object.assign(dados, { nome, unidade:$('ce-un').value, posicao:+$('ce-pos').value, equip:[...document.querySelectorAll('.ce-eq:checked')].map(x=>x.value), musculos:$('ce-mus').value.trim(), grupo:c.itens[0][4], ativo:true });
  else dados.ativo = !$('ce-off').checked;
  await mtComBotao('ce-salvar','Salvando…', async ()=>{
    await db.collection('caliExercicios').doc(id).set(dados, {merge:true});
    await loadCaliAdmin(); toast('✅ Salvo. Vale para os próximos planos gerados.'); openCaliCadeias();
  });
}
function openCaliModelos(){
  const princ = mtAdmin();
  $('modal-inner').innerHTML = `<h3>Modelos de plano</h3><p class="mt-muted" style="margin:0 0 8px">Quando existe um modelo ativo para o número de dias (e objetivo) do aluno, ele substitui a divisão padrão (${Object.entries(CALI_SPLITS).map(([d,s])=>d+' dias: '+s.nome).join(' · ')}).</p>
    ${caliModelos.map(m=>`<div class="list-row" ${princ?`onclick="caliEditarModelo('${m.id}')"`:''}>${mtEsc(m.nome||'Modelo')}<span style="margin-left:auto;font-size:12px;color:var(--text-mute)">${m.dias} dias${m.objetivo?' · '+m.objetivo:''}${m.ativo===false?' · inativo':''}</span></div>`).join('') || '<div class="mt-muted" style="padding:8px 0">Nenhum modelo criado. Os planos usam as divisões padrão.</div>'}
    ${princ?`<button class="btn btn-primary btn-block" style="margin-top:10px" onclick="caliEditarModelo()">+ Novo modelo</button>`:''}
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openCaliAdmin()">Voltar</button>`;
}
const CALI_PAD_LBL = { skill:'Habilidade', empurrar_h:'Empurrar horizontal (flexões)', empurrar_v:'Empurrar vertical (pike/HSPU)', dips:'Paralelas / tríceps', puxar_v:'Puxar vertical (barra)', puxar_h:'Puxar horizontal (remada)', agachar:'Agachamento', agachar_uni:'Perna unilateral', posterior:'Posteriores', gluteo:'Glúteos', panturrilha:'Panturrilhas', core_anti:'Core anti-extensão', core_lat:'Core lateral', core_flex:'Elevação de pernas / L-sit', core_ext:'Core posterior' };
function caliEditarModelo(id){
  if(!mtAdmin()) return;
  const m = caliModelos.find(x=>x.id===id) || { nome:'', dias:3, objetivo:'', ativo:true, sessoes:[] };
  window.__cmDias = +m.dias || 3;
  const sess = k=>{ const s = (m.sessoes||[])[k] || {nome:'Sessão '+(k+1), slots:[]};
    return `<div class="adm-ms"><input class="input cm-nome" value="${mtEsc(s.nome)}" style="margin-bottom:6px"><div style="display:flex;flex-wrap:wrap;gap:4px 10px">${Object.entries(CALI_PAD_LBL).map(([p,l])=>`<label style="font-size:12px;display:flex;gap:5px;align-items:center"><input type="checkbox" class="cm-p" data-s="${k}" value="${p}" ${(s.slots||[]).includes(p)?'checked':''}> ${l}</label>`).join('')}</div></div>`; };
  $('modal-inner').innerHTML = `<h3>${id?'Editar':'Novo'} modelo</h3><div class="adm-form">
    <label>Nome</label><input class="input" id="cm-nome" value="${mtEsc(m.nome)}" placeholder="Ex.: Full body 3x — iniciantes">
    <div style="display:flex;gap:8px"><div style="flex:1"><label>Dias</label><select class="input" id="cm-dias" onchange="window.__cmDias=+this.value;caliEditarModelo('${id||''}')">${[3,4,5,6].map(d=>`<option ${d===window.__cmDias?'selected':''}>${d}</option>`).join('')}</select></div>
    <div style="flex:1"><label>Objetivo</label><select class="input" id="cm-obj"><option value="">Qualquer</option>${Object.keys(CALI_PRESC).map(o=>`<option value="${o}" ${m.objetivo===o?'selected':''}>${o}</option>`).join('')}</select></div></div>
    <label>Sessões (a ordem de cima para baixo é a ordem dos exercícios; o tempo da sessão corta os últimos)</label>
    ${Array.from({length:window.__cmDias},(_,k)=>sess(k)).join('')}
    <label style="display:flex;gap:8px;align-items:center;text-transform:none;letter-spacing:0;font-size:13px;color:var(--text)"><input type="checkbox" id="cm-ativo" ${m.ativo!==false?'checked':''}> Ativo</label></div>
    <button class="btn btn-primary btn-block" style="margin-top:10px" id="cm-salvar" onclick="caliSalvarModelo('${id||''}')">Salvar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openCaliModelos()">Voltar</button>`;
}
async function caliSalvarModelo(id){
  if(!mtAdmin()) return;
  const dias = +$('cm-dias').value;
  const nomes = [...document.querySelectorAll('.cm-nome')].map(x=>x.value.trim());
  const ordem = Object.keys(CALI_PAD_LBL);
  const sessoes = nomes.map((n,k)=>({ nome:n||('Sessão '+(k+1)), slots: ordem.filter(p=>document.querySelector(`.cm-p[data-s="${k}"][value="${p}"]`).checked) }));
  if(sessoes.some(s=>s.slots.length<3)){ toast('Cada sessão precisa de pelo menos 3 movimentos'); return; }
  const dados = { nome:$('cm-nome').value.trim()||'Modelo', dias, objetivo:$('cm-obj').value, ativo:$('cm-ativo').checked, sessoes, atualizadoEm:Date.now(), atualizadoPor:state.user.email };
  await mtComBotao('cm-salvar','Salvando…', async ()=>{
    await db.collection('caliModelos').doc(id || ('m'+Date.now().toString(36))).set(dados, {merge:true});
    await loadCaliAdmin(); toast('✅ Modelo salvo. Vale para planos criados ou recriados a partir de agora.'); openCaliModelos();
  });
}
function caliConfigDominio(){
  if(!mtAdmin()) return;
  $('modal-inner').innerHTML = `<h3>Critério de domínio</h3><p class="mt-muted">Quantas sessões seguidas no topo da faixa (com execução limpa) o aluno precisa para liberar a próxima variação.</p>
    <select class="input" id="cd-n">${[1,2,3,4].map(n=>`<option ${n===caliConfig.sessoesDominio?'selected':''}>${n}</option>`).join('')}</select>
    <button class="btn btn-primary btn-block" style="margin-top:10px" id="cd-salvar" onclick="mtComBotao('cd-salvar','Salvando…',async()=>{ await db.collection('config').doc('calistenia').set({sessoesDominio:+$('cd-n').value, atualizadoEm:Date.now()}, {merge:true}); await loadCaliAdmin(); toast('✅ Salvo'); openCaliAdmin(); })">Salvar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openCaliAdmin()">Voltar</button>`;
}
mtGancho('goAdmin', { depois(){
  try{
    if(!$('adm-cali-row')){ const ref = $('adm-vid-row') || $('adm-ev-row'); if(ref){ const a = document.createElement('div'); a.className = 'list-row'; a.id = 'adm-cali-row'; a.onclick = openCaliAdmin; a.innerHTML = '🤸 <span>Calistenia</span><span style="margin-left:auto;font-size:11px;color:var(--text-dim)">exercícios, modelos e uso</span>'; ref.after(a); } }
  }catch(e){}
}});
const _bootCali = bootAfterAuth;
window.bootAfterAuth = function(){ const r = _bootCali.apply(this, arguments); setTimeout(()=>{ loadCaliAdmin().then(()=>{ try{ if(temCali()){ caliRegenTudo(); } }catch(e){} }); }, 2200); return r; };
try{ caliAplicarAdmin(JSON.parse(mtLS('mt_cali_ex')||'[]')); }catch(e){}

Object.assign(window, { caliAbrirTroca, caliDefinirPos, caliPreferir, caliQual, caliMostrarSetup, openModalidade, openCaliAdmin, openCaliCadeias, caliEditarEx, caliSalvarEx, openCaliModelos, caliEditarModelo, caliSalvarModelo, caliConfigDominio,
  caliGerarWorkouts, caliNivelReal, caliDominio, CALI_CADEIAS });

// =====================================================================
// 19. ESTADO DO TREINO (Beta 13) — uma única fonte para todas as recomendações
// Hierarquia (a maior prioridade vence em TODO o app):
//   1. retomada (pausa de 7+ dias, até 2 semanas depois da volta)
//   2. recuperação / fadiga elevada (exaustão, dor, ciclo de deload)
//   3. progressão (dados mostram que dá para subir)
//   4. normal
// =====================================================================
const RET = { PAUSA_MIN: 7, JANELA: 14 };
function estadoTreino(){
  const h = mtHist();
  const out = { tipo:'normal', prioridade:4 };
  if(!h.length) return out;
  const dias = [...new Set(h.map(x=>mtDia0(x.at)))].sort((a,b)=>a-b);
  const hoje = mtDia0();
  const ultimo = dias[dias.length-1];
  const desde = Math.round((hoje-ultimo)/DIA_MS);
  let pausa = 0, retorno = null, inicioPausa = null;
  if(desde >= RET.PAUSA_MIN){ pausa = desde; inicioPausa = ultimo; }
  else {
    for(let i=dias.length-1; i>0; i--){
      if(hoje - dias[i] >= RET.JANELA*DIA_MS) break;
      const gap = Math.round((dias[i]-dias[i-1])/DIA_MS);
      if(gap >= RET.PAUSA_MIN){ pausa = gap; retorno = dias[i]; inicioPausa = dias[i-1]; break; }
    }
  }
  if(pausa >= RET.PAUSA_MIN){
    // referência inicial de 70%, ajustada ao histórico e à experiência (nunca regra fixa)
    const antes = h.filter(x=>x.at < inicioPausa + DIA_MS && x.at >= inicioPausa - 42*DIA_MS).length;
    const lvl = (state.modules.lift && state.modules.lift.setup && state.modules.lift.setup.level) || 'intermediario';
    let pct = 70;
    if(antes >= 10) pct += 5;                 // vinha treinando com regularidade
    if(lvl === 'avancado') pct += 5;
    if(lvl === 'iniciante') pct -= 5;
    if(pausa >= 21) pct -= 5;
    if(pausa >= 42) pct -= 5;
    if(pausa >= 90) pct -= 5;
    pct = Math.max(55, Math.min(85, pct));
    const semana = !retorno ? 1 : ((hoje - retorno) < 7*DIA_MS ? 1 : 2);
    const sessoesVolta = retorno ? h.filter(x=>mtDia0(x.at) >= retorno).length : 0;
    return { tipo:'retomada', prioridade:1, pausa, retorno, inicioPausa, semana, sessoesVolta,
      pct: semana===1 ? pct : Math.min(95, pct+15), pctBase: pct, menosSeries: semana===1,
      ate: retorno ? retorno + RET.JANELA*DIA_MS : null };
  }
  // recuperação / fadiga
  const feels = ((state.modules.lift && state.modules.lift.history)||[]).filter(x=>x.feel).slice(-2);
  const exausto = feels.length && feels[feels.length-1].feel==='exausto';
  let deload = false; try{ const cic = cicloAtual(); deload = !!(cic && cic.nome==='Deload'); }catch(e){}
  const dor = !!(state.user && state.user.pain && state.user.pain.length);
  if(exausto || dor || deload) return { tipo:'recuperacao', prioridade:2, exausto, dor, deload };
  let prog = null; try{ prog = _progressionTipOrig(); }catch(e){}
  if(prog) return { tipo:'progressao', prioridade:3, dica:prog, desde };
  return Object.assign(out, { desde });
}
function cargaRetomada(exId, est){
  est = est || estadoTreino();
  const ref = est.inicioPausa ? est.inicioPausa + DIA_MS : Date.now();
  const antes = ((state.progress||{})[exId]||[]).filter(p=>p.date < ref && p.sets && p.sets.length);
  if(!antes.length) return null;
  const ult = antes[antes.length-1];
  const peso = Math.max(0, ...ult.sets.map(s=>+s.peso||0));
  if(!peso) return null;
  const alvo = peso * est.pct/100;
  const passo = peso < 20 ? 0.5 : peso < 60 ? 1 : 2.5;
  return { antes:peso, sugerido: Math.max(passo, Math.round(alvo/passo)*passo), series: ult.sets.length };
}
function textoRetomada(est){
  return est.semana===1
    ? `Retomada após ${est.pausa} dias: nesta primeira semana use cerca de <b>${est.pct}%</b> das cargas de antes e uma série a menos por exercício. Mesmo que fique fácil, não suba a carga ainda.`
    : `Retomada (2ª semana): cerca de <b>${est.pct}%</b> das cargas de antes, com o número normal de séries. A progressão volta depois desta semana, com base no que você fizer agora.`;
}
// "Sugestão de hoje" no card do treino
const _progressionTipOrig = progressionTip;
const _liftLoadSugB13 = liftLoadSuggestion;
window.liftLoadSuggestion = function(){
  const est = estadoTreino();
  if(est.tipo==='retomada') return { emo:'🔁', txt: textoRetomada(est).replace(/<\/?b>/g,'') };
  const s = _liftLoadSugB13.apply(this, arguments);
  // "treino puxado" não vira "mantenha a carga" automaticamente: segura a progressão e deixa espaço para reduzir
  if(s && /Último treino foi puxado/.test(s.txt)) return { emo:'⚖️', txt:'Último treino foi puxado. Não suba a carga hoje: se as primeiras séries pesarem mais que o normal, reduza ~5% e priorize a execução.' };
  return s;
};
window.progressionTip = function(){ const est = estadoTreino(); if(est.tipo==='retomada' || est.tipo==='recuperacao') return null; return _progressionTipOrig.apply(this, arguments); };
const _runSugB13 = runSmartSuggestion;
window.runSmartSuggestion = function(w){
  const est = estadoTreino();
  if(est.tipo==='retomada') return { emo:'🔁', txt:`Retomada após ${est.pausa} dias: corra em ritmo de conversa e faça cerca de ${est.semana===1?'60–70%':'80%'} da distância planejada. Sem tiros nesta ${est.semana===1?'primeira ':''}semana.` };
  return _runSugB13.apply(this, arguments);
};
// dica no registro de séries
const _hintB13 = window.smartProgressionHint;
window.smartProgressionHint = function(exId){
  const est = estadoTreino();
  if(est.tipo !== 'retomada') return _hintB13.apply(this, arguments);
  if(ehCali(exId)) return { cls:'card-warn', txt:`🔁 Retomada após ${est.pausa} dias: mantenha esta variação, faça ${est.menosSeries?'uma série a menos e ':''}pare 2–3 repetições antes da falha. Avançar de variação só depois da retomada.` };
  const c = cargaRetomada(exId, est);
  if(exExigeTempo(exId)) return { cls:'card-warn', txt:`🔁 Retomada: busque cerca de ${est.pct}% do tempo que você sustentava antes.` };
  if(!c) return { cls:'card-warn', txt:`🔁 Retomada após ${est.pausa} dias: comece leve (≈${est.pct}% do que usava) e priorize a técnica. Nada de subir carga nesta ${est.semana===1?'primeira ':''}semana.` };
  return { cls:'card-warn', txt:`🔁 Retomada após ${est.pausa} dias: antes você usava <b>${c.antes} kg</b>. Hoje, cerca de <b>${c.sugerido} kg</b> (≈${est.pct}%)${est.menosSeries?` e ${Math.max(2,c.series-1)} séries`:''}. Mesmo que fique fácil, mantenha — a carga volta a subir depois da retomada.` };
};
// primeira série do dia já vem com a carga de retomada (o aluno pode mudar)
const _addSetB13 = addSet;
window.addSet = function(){
  const vazio = curLog && curLog.entry && !curLog.entry.sets.length;
  const r = _addSetB13.apply(this, arguments);
  try{
    if(!vazio || !curLog) return r;
    const est = estadoTreino(); if(est.tipo!=='retomada' || ehCali(curLog.exId) || exExigeTempo(curLog.exId)) return r;
    const c = cargaRetomada(curLog.exId, est); if(!c) return r;
    const s0 = curLog.entry.sets[0]; if(s0 && (+s0.peso||0) >= c.antes){ s0.peso = c.sugerido; renderSetLogModal(); }
  }catch(e){}
  return r;
};
// Meta Assistente: plano de retomada usa o mesmo estado
analiseRetomada = function(){
  const est = estadoTreino();
  const c = contextoAluno();
  if(est.tipo !== 'retomada'){
    if(c.diasSem === null) return 'Você ainda não tem treinos registrados — então não é retomada, é começo! Comece pelo treino de hoje com cargas leves. 💪';
    return `Seu último treino foi há ${c.diasSem===0?'menos de um dia':c.diasSem+' '+(c.diasSem===1?'dia':'dias')}. Isso é ${c.diasSem>=4?'uma pausa curta: pode seguir o plano normal, só capriche no aquecimento':'descanso normal'}. Plano de retomada é para pausas de 7 dias ou mais. ✅`;
  }
  const exs = (state.modules.lift && state.modules.lift.plan && state.modules.lift.plan.workouts||[]).flatMap(w=>w.exercises||[]).filter((e,i,a)=>a.findIndex(x=>x.id===e.id)===i);
  const exemplos = exs.map(e=>({e, c:cargaRetomada(e.id, est)})).filter(x=>x.c).slice(0,4);
  let t = `${est.retorno?'Você voltou depois de':'Faz'} <b>${est.pausa} dias</b> ${est.retorno?'parado':'sem treinar'}. Plano de retomada (calculado para você — ${est.pctBase}% é a referência, ajustada à sua regularidade, nível e tamanho da pausa):<br><br>`;
  t += `<b>Semana 1</b> — ~${est.pctBase}% das cargas de antes, uma série a menos por exercício, parando com 2–3 repetições de folga.${est.semana===1?' ← <i>você está aqui</i>':''}<br>`;
  t += `<b>Semana 2</b> — ~${Math.min(95, est.pctBase+15)}% das cargas, séries normais.${est.semana===2?' ← <i>você está aqui</i>':''}<br>`;
  t += `<b>Depois</b> — o app reavalia pelas suas séries da semana 2 e só então volta a sugerir progressão.<br>`;
  if(exemplos.length) t += `<br>Exemplos com suas cargas: ${exemplos.map(x=>`${mtEsc(x.e.name)}: ${x.c.antes} → <b>${x.c.sugerido} kg</b>`).join(' · ')}.`;
  if(state.modules.run) t += `<br><br>Corrida/caminhada: ${est.semana===1?'60–70%':'cerca de 80%'} do volume de antes, em ritmo de conversa, sem tiros.`;
  t += '<br><br>Você não está começando do zero — o corpo recupera rápido o que já conquistou. Mas mesmo que fique fácil, não suba a carga durante a retomada.';
  return t;
};
MA_ANSWERS.retomada = analiseRetomada;
// perguntas como “fiquei 10 dias sem treinar, como volto?” vão para o plano de retomada
const _maInterpretB13 = maInterpret;
maInterpret = function(txt){
  const t = mtNorm(txt);
  if(/(\d+|uma|duas|tres|quatro|um|dois) (dias?|semanas?|mes(es)?) (sem treinar|parad|sem academia|sem ir)/.test(t) || /como (eu )?(volto|retomo|recomeco)|voltar (a treinar|pra academia|para a academia|depois)|depois de (uma )?pausa|depois de (\d+|uns|alguns) dias/.test(t)) return 'retomada';
  return _maInterpretB13.apply(this, arguments);
};
// rede de segurança: durante a retomada, nenhuma resposta do assistente pode mandar subir carga sem o aviso
(function(){
  const PROG = /(sub(a|ir)|aument(e|ar)) (a |um pouco a |sua )?carga|hora de progredir|tente <b>\d|\+\s?\d+([.,]\d)?\s?kg|subir a carga|progredir|mesma carga/i;
  Object.keys(MA_ANSWERS).forEach(k=>{
    if(k==='retomada' || k==='motiva' || typeof MA_ANSWERS[k] !== 'function') return;
    const f = MA_ANSWERS[k];
    MA_ANSWERS[k] = function(){
      const r = f.apply(this, arguments);
      try{
        if(typeof r !== 'string' || !PROG.test(r)) return r;
        const est = estadoTreino(); if(est.tipo!=='retomada') return r;
        return `🔁 <b>Antes de tudo: você está em retomada</b> (pausa de ${est.pausa} dias). Por ${est.semana===1?'esta semana e a próxima':'esta semana'}, a regra é ~${est.pct}% das cargas de antes e nada de subir carga — o que está abaixo vale para depois da retomada.<br><br>` + r;
      }catch(e){ return r; }
    };
  });
})();
const _maNudgeB13 = maNudge;
maNudge = function(){
  const n = _maNudgeB13.apply(this, arguments);
  try{
    const est = estadoTreino();
    if(est.tipo==='retomada' && n && /(sub|aument|progred|recorde|PR\b|\+\d)/i.test(n.text||'')) return { text:`🔁 Retomada: ~${est.pct}% das cargas por enquanto`, tone:'important', dica:{completa: analiseRetomada()} };
  }catch(e){}
  return n;
};
// Home: o card "Retomada" usa o mesmo estado (antes eram 4+ dias com 70% fixo)
const _renderHomeSmartB13 = renderHomeSmart;
renderHomeSmart = function(){
  _renderHomeSmartB13.apply(this, arguments);
  try{
    const el = $('home-smart'); if(!el || !el.firstElementChild) return;
    const est = estadoTreino(); const k = el.querySelector('.smart-k');
    if(est.tipo==='retomada'){
      el.innerHTML = `<div class="smart alert"><div style="display:flex;align-items:flex-start;gap:8px"><div class="smart-k" style="flex:1">Em retomada · semana ${est.semana}</div><button onclick="mtLS('mt_smart_fechado', String(mtDia0()));renderHomeSmart()" aria-label="Ocultar hoje" style="background:none;border:0;color:var(--text-mute);font-size:15px;padding:0 2px;cursor:pointer">✕</button></div>
        <div class="smart-t">${est.retorno?`De volta depois de ${est.pausa} dias`:`${est.pausa} dias sem treinar — vamos voltar com calma`}</div>
        <div class="smart-p">${textoRetomada(est)}</div>
        <div class="smart-a"><button class="btn btn-primary" onclick="goTab('sessions')">${contextoAluno().hojeFeito?'Ver treinos':'Treinar hoje'}</button><button class="btn btn-ghost" onclick="mtPergunta('retomada')">Plano de retomada</button></div></div>`;
    } else if(k && /Retomada/.test(k.textContent)){
      // pausa de 4–6 dias: não é retomada; recalcula sem esse cartão
      el.querySelector('.smart-k').textContent = 'Pausa curta';
      el.querySelector('.smart-p').textContent = 'Poucos dias parado não exigem reduzir carga. Siga o plano normal e capriche no aquecimento.';
    }
  }catch(e){}
};

// =====================================================================
// 20. FEEDBACK DOS ALUNOS (Beta 13)
// Verificado: os alunos enviam mensagens pelo Meta Assistente (“quero mandar uma sugestão”,
// frases como “seria legal se…”, e perguntas que o assistente não soube responder). A seção
// do painel mostra essas mensagens — então foi mantida, com nome e explicação claros, e o
// atalho “Enviar sugestão” ficou visível no assistente (sem formulário novo).
// =====================================================================
MA_ANSWERS.enviar_sugestao = function(){
  try{ maPending = {type:'sugestao'}; }catch(e){}
  return 'Manda ver! ✍️ Escreva na próxima mensagem o que você gostaria de sugerir, um problema que encontrou ou qualquer ideia. Eu envio direto para quem cuida do MetaTreino.';
};
if(!MA_SUGGESTIONS.some(s=>s.key==='enviar_sugestao')) MA_SUGGESTIONS.push({lbl:'✉️ Enviar sugestão', key:'enviar_sugestao'});
(function(){
  const row = [...document.querySelectorAll('#scr-admin .list-row')].find(r=>/Feedback dos alunos/.test(r.textContent));
  if(row){ const sp = row.querySelector('span'); if(sp) sp.textContent = 'Mensagens dos alunos'; row.title = 'Sugestões, problemas e perguntas enviadas pelo Meta Assistente'; }
})();
const _openSuggestionsB13 = openSuggestions;
window.openSuggestions = async function(){
  const r = await _openSuggestionsB13.apply(this, arguments);
  try{
    const h3 = document.querySelector('#modal-inner h3');
    if(h3 && /Feedback/.test(h3.textContent)){
      h3.textContent = '💬 Mensagens dos alunos';
      h3.insertAdjacentHTML('afterend', `<p class="mt-muted" style="margin:4px 0 10px;font-size:12px">Chegam pelo Meta Assistente: sugestões (“quero mandar uma sugestão” ou o atalho ✉️), relatos de problema e perguntas que ele não soube responder.</p>`);
    }
  }catch(e){}
  return r;
};

// =====================================================================
// 21. CONQUISTA ESPECIAL — apresentação animada e vídeo 9:16 (Beta 13)
// Uma única função desenha cada quadro; ela é usada na revelação para a pessoa,
// na prévia do administrador e na gravação do vídeo — o que se vê é o que se exporta.
// Exclusivo do administrador principal (ehDonoDoApp + regra do Firestore em config/specialAward).
// =====================================================================
const SA_DUR = 8.5;
const SA_COR = { ouro:'#f2c66d', ouroSoft:'rgba(242,198,109,', rosa:'rgba(255,128,160,', texto:'#f4f1ea', sub:'rgba(232,230,240,.78)', lime:'#b6f23a' };
function _ease(t){ t = Math.max(0, Math.min(1, t)); return 1 - Math.pow(1-t, 3); }
function _back(t){ t = Math.max(0, Math.min(1, t)); const c = 1.5; return 1 + (c+1)*Math.pow(t-1,3) + c*Math.pow(t-1,2); }
function _fase(t, a, b){ return _ease((t-a)/(b-a)); }
function _wrap(g, txt, maxW){ const out = []; String(txt||'').split('\n').forEach(par=>{ let l = ''; par.split(/\s+/).forEach(w=>{ const t = l ? l+' '+w : w; if(g.measureText(t).width > maxW && l){ out.push(l); l = w; } else l = t; }); if(l) out.push(l); }); return out; }
function _dataExtenso(sa){ const d = sa.data ? new Date(sa.data+'T12:00:00') : new Date(sa.atualizadoEm||Date.now()); return d.toLocaleDateString('pt-BR',{day:'numeric', month:'long', year:'numeric'}); }
function saFrame(g, W, H, t, sa){
  const u = W/1080;
  g.save();
  g.fillStyle = '#05060b'; g.fillRect(0,0,W,H);
  const cx = W/2, cy = H*0.34;
  // luz de fundo
  const a0 = _fase(t, 0, 1.4);
  let rg = g.createRadialGradient(cx, cy, 10*u, cx, cy, 760*u); rg.addColorStop(0, SA_COR.ouroSoft+(0.20*a0)+')'); rg.addColorStop(0.5, SA_COR.rosa+(0.06*a0)+')'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0,0,W,H);
  rg = g.createRadialGradient(cx, H*1.05, 10*u, cx, H*1.05, 900*u); rg.addColorStop(0, 'rgba(182,242,58,'+(0.07*a0)+')'); rg.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0,0,W,H);
  // partículas discretas (posições fixas, sobem devagar)
  const pa = _fase(t, 1.2, 2.6);
  for(let i=0;i<46;i++){
    const sx = ((i*397)%1000)/1000, sy = ((i*631)%1000)/1000, sp = 0.012 + ((i*53)%10)/1000;
    const y = ((sy - t*sp) % 1 + 1) % 1;
    const tw = 0.35 + 0.65*Math.abs(Math.sin(t*1.3 + i));
    g.fillStyle = (i%3===0 ? SA_COR.rosa : SA_COR.ouroSoft) + (0.55*pa*tw) + ')';
    g.beginPath(); g.arc(sx*W, y*H, (1.6 + (i%4))*u, 0, Math.PI*2); g.fill();
  }
  // anéis
  const R = 205*u;
  const r1 = _fase(t, 0.5, 1.8);
  g.lineCap = 'round';
  g.strokeStyle = SA_COR.ouro; g.lineWidth = 4*u; g.globalAlpha = 0.95;
  g.beginPath(); g.arc(cx, cy, R, -Math.PI/2, -Math.PI/2 + Math.PI*2*r1); g.stroke();
  g.globalAlpha = 0.35*_fase(t, 1.2, 2.2); g.lineWidth = 1.5*u; g.setLineDash([2*u, 12*u]); g.lineDashOffset = -t*30*u;
  g.beginPath(); g.arc(cx, cy, R+34*u, 0, Math.PI*2); g.stroke(); g.setLineDash([]);
  g.globalAlpha = 1;
  // emblema
  const e = _back((t-1.3)/0.9);
  if(t > 1.3){
    g.save(); g.translate(cx, cy); g.scale(Math.max(0.01,e), Math.max(0.01,e)); g.globalAlpha = Math.min(1, (t-1.3)/0.5);
    g.font = `${190*u}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(242,198,109,.55)'; g.shadowBlur = 50*u; g.fillText(sa.emo || '🏆', 0, 8*u);
    g.restore();
  }
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const txt = (s, y, font, cor, a, dy)=>{ if(a<=0) return; g.globalAlpha = a; g.font = font; g.fillStyle = cor; g.fillText(s, cx, y + (1-a)*(dy||24)*u); g.globalAlpha = 1; };
  // título superior
  const k = _fase(t, 2.0, 2.7);
  g.save(); g.globalAlpha = k; g.font = `800 ${30*u}px Outfit, system-ui, sans-serif`; g.fillStyle = SA_COR.ouro;
  const kick = 'C O N Q U I S T A   E S P E C I A L'; g.fillText(kick, cx, H*0.535); g.restore();
  // nome
  const nome = String(sa.nome || '').trim();
  if(nome){ let fs = 96; g.font = `800 ${fs*u}px Outfit, system-ui, sans-serif`; while(g.measureText(nome).width > W*0.86 && fs > 54){ fs -= 4; g.font = `800 ${fs*u}px Outfit, system-ui, sans-serif`; }
    txt(nome, H*0.60, g.font, '#ffffff', _fase(t, 2.6, 3.4)); }
  // divisor
  const dv = _fase(t, 3.2, 3.9); g.fillStyle = SA_COR.ouro; g.globalAlpha = dv; g.fillRect(cx - 90*u*dv, H*0.625, 180*u*dv, 3*u); g.globalAlpha = 1;
  // nome da conquista
  g.font = `700 ${58*u}px Outfit, system-ui, sans-serif`;
  const tl = _wrap(g, sa.titulo || '', W*0.84).slice(0,2);
  tl.forEach((l,i)=>txt(l, H*0.675 + i*68*u, g.font, SA_COR.texto, _fase(t, 3.6 + i*0.15, 4.4 + i*0.15)));
  // mensagem
  g.font = `400 ${36*u}px Outfit, system-ui, sans-serif`;
  const y0 = H*0.675 + tl.length*68*u + 30*u;
  const maxL = Math.max(1, Math.floor((H*0.885 - 70*u - y0)/(50*u)));
  let dl = _wrap(g, sa.descricao || '', W*0.78); if(dl.length > maxL){ dl = dl.slice(0,maxL); dl[maxL-1] = dl[maxL-1].replace(/\s*\S*$/,'') + '…'; }
  dl.forEach((l,i)=>txt(l, y0 + i*50*u, g.font, SA_COR.sub, _fase(t, 4.3 + i*0.12, 5.1 + i*0.12), 14));
  // data
  txt(_dataExtenso(sa), H*0.885, `600 ${30*u}px Outfit, system-ui, sans-serif`, 'rgba(242,198,109,.85)', _fase(t, 5.2, 5.9));
  // marca MetaTreino
  const b = _fase(t, 5.6, 6.3);
  if(b > 0){
    g.globalAlpha = b;
    const bw = 300*u, bx = cx - bw/2, by = H*0.93;
    g.fillStyle = SA_COR.lime; const s = 44*u; const r = 11*u; const lx = bx, ly = by - s + 8*u;
    g.beginPath(); g.moveTo(lx+r,ly); g.arcTo(lx+s,ly,lx+s,ly+s,r); g.arcTo(lx+s,ly+s,lx,ly+s,r); g.arcTo(lx,ly+s,lx,ly,r); g.arcTo(lx,ly,lx+s,ly,r); g.fill();
    g.fillStyle = '#0a0a0a'; g.font = `900 ${28*u}px Outfit, system-ui, sans-serif`; g.textAlign = 'center'; g.fillText('M', lx+s/2, ly+s*0.7);
    g.fillStyle = '#ffffff'; g.font = `800 ${32*u}px Outfit, system-ui, sans-serif`; g.textAlign = 'left'; g.fillText('METATREINO', lx + s + 18*u, ly + s*0.72);
    g.textAlign = 'center'; g.globalAlpha = 1;
  }
  g.restore();
}
function saNome(sa){
  if(sa.nome) return sa.nome;
  try{
    const alvo = String(sa.email||'').toLowerCase();
    const meu = String((state.user && state.user.email)||'').toLowerCase();
    if(alvo && alvo === meu) return ((state.user.profile && state.user.profile.nickname) || state.user.name || '').split(' ')[0];
    const u = Object.values(usuariosCache||{}).find(x=>String(x.email||'').toLowerCase()===alvo);
    const n = u && ((u.estadoApp && u.estadoApp.user && (u.estadoApp.user.profile && u.estadoApp.user.profile.nickname || u.estadoApp.user.name)) || u.nome || u.name);
    return n ? String(n).split(' ')[0] : '';
  }catch(e){ return ''; }
}
// palco animado em tela cheia (prévia do admin, conquista da pessoa e final da história).
// Um palco por vez; o requestAnimationFrame para ao fechar, quando o app vai para segundo plano
// e 30 s depois do fim da animação. Com "movimento reduzido" no aparelho, mostra direto o quadro final.
function _saReduz(){ try{ return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
function saPalco(sa, opts){
  opts = opts || {};
  document.querySelectorAll('.sa-stage').forEach(o=>{ try{ o.__parar && o.__parar(); }catch(e){} o.remove(); });
  const reduz = _saReduz(); const vel = opts.vel || 1;
  const ov = document.createElement('div'); ov.className = 'sa-stage'; ov.id = opts.id || 'sa-stage';
  ov.setAttribute('role','dialog'); ov.setAttribute('aria-label', 'Conquista especial: ' + (sa.titulo||''));
  ov.innerHTML = `<canvas aria-hidden="true"></canvas><div class="sr-only">${mtEsc((sa.emo||'')+' '+(sa.titulo||'')+'. '+(sa.descricao||''))}</div>${opts.topo||''}<div class="sa-actions">${opts.acoes||''}</div>`;
  document.body.appendChild(ov);
  const cv = ov.querySelector('canvas');
  const dpr = Math.min(2, window.devicePixelRatio||1);
  const g = cv.getContext('2d');
  const dados = Object.assign({}, sa, { nome: saNome(sa) });
  let raf = 0, vivo = true, pausa = 0, ocultoEm = null; const t0 = performance.now();
  const tempo = ()=> reduz ? SA_DUR : ((performance.now() - t0 - pausa)/1000) * vel;
  const desenha = ()=>{ const t = tempo(); saFrame(g, cv.width, cv.height, Math.min(t, SA_DUR+60), dados); if(t > (opts.acoesEm||6.3)) ov.classList.add('fim'); return t; };
  // os botões ficam ABAIXO do quadro quando há espaço; em telas baixas o quadro encolhe para não cobri-los
  const reserva = opts.reserva != null ? opts.reserva : 76;
  ov.style.flexDirection = 'column'; ov.style.justifyContent = 'flex-start';
  const fit = ()=>{ const H = window.innerHeight, util = Math.max(H*0.62, H - reserva); const w = Math.min(window.innerWidth, util*9/16); const h = w*16/9;
    cv.style.width = w+'px'; cv.style.height = h+'px'; cv.style.marginTop = Math.max(0, (util - h)/2)+'px'; cv.width = Math.round(w*dpr); cv.height = Math.round(h*dpr); if(!raf) desenha(); };
  const loop = ()=>{ raf = 0; if(!vivo || !document.body.contains(ov)){ parar(); return; } const t = desenha(); if(t < SA_DUR + 30) raf = requestAnimationFrame(loop); };
  const vis = ()=>{ if(!vivo) return; if(document.hidden){ if(raf){ cancelAnimationFrame(raf); raf = 0; } ocultoEm = performance.now(); } else { if(ocultoEm){ pausa += performance.now() - ocultoEm; ocultoEm = null; } if(!raf && !reduz) raf = requestAnimationFrame(loop); } };
  function parar(){ vivo = false; if(raf){ cancelAnimationFrame(raf); raf = 0; } window.removeEventListener('resize', fit); document.removeEventListener('visibilitychange', vis); }
  ov.__parar = parar; ov.__aoFechar = opts.aoFechar || null;
  window.addEventListener('resize', fit); document.addEventListener('visibilitychange', vis);
  fit();
  if(reduz){ desenha(); ov.classList.add('fim'); } else raf = requestAnimationFrame(loop);
  requestAnimationFrame(()=>ov.classList.add('on'));
  setTimeout(()=>{ const b = ov.querySelector('.sa-actions .btn, .sa-x'); try{ b && b.focus({preventScroll:true}); }catch(e){} }, 300);
  return ov;
}
function saFecharPalco(){
  document.querySelectorAll('.sa-stage').forEach(ov=>{ try{ ov.__parar && ov.__parar(); }catch(e){} const f = ov.__aoFechar; ov.classList.remove('on'); setTimeout(()=>ov.remove(), 400); try{ f && f(); }catch(e){} });
  try{ releaseWakeLock && releaseWakeLock(); }catch(e){}
}

// ---- história da conquista (frases pessoais) com pausar, velocidade e pular ----
// Um único timer por vez, com o tempo restante guardado: pausar congela de verdade, a velocidade
// muda a espera que está correndo e as transições. Ao sair, nada fica agendado.
let _saHist = null;
const SA_ICO_PAUSA = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
const SA_ICO_PLAY = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';
function _saDadosTrofeu(sp){
  sp = sp || state.specialTrophy || {};
  return { emo: sp.emo||'💍', titulo: sp.titulo||'', descricao: sp.descricao||'', nome: sp.nome || (((state.user && state.user.profile && state.user.profile.nickname) || (state.user && state.user.name) || '').split(' ')[0]), data: sp.data || '', atualizadoEm: sp.at || Date.now(), frases: (sp.frases||[]).slice() };
}
function _saHistParar(){
  const H = _saHist; if(!H) return;
  if(H.timer){ clearTimeout(H.timer); H.timer = null; }
  H.fn = null; H.vivo = false;
  document.removeEventListener('keydown', H.tecla);
  if(H.ov && H.ov.parentNode) H.ov.remove();
  _saHist = null;
}
function saHistoriaFechar(){ _saHistParar(); saFecharPalco(); }
showSpecialReveal = function(sa, opts){
  opts = opts || {};
  _saHistParar();
  try{ requestWakeLock && requestWakeLock(); }catch(e){}
  if(!opts.reviver){
    try{
      const ant = state.specialTrophy || {};
      state.specialTrophy = { emo: sa.emo||'💍', titulo: sa.titulo||'', descricao: sa.descricao||'', frases: (sa.frases && sa.frases.length) ? sa.frases.slice() : (ant.frases || []),
        nome: sa.nome || ant.nome || '', data: sa.data || ant.data || '', at: ant.at || Date.now(), revelada: opts.chave || ant.revelada || null };
      saveData();
    }catch(e){}
  }
  const dados = opts.reviver ? _saDadosTrofeu() : Object.assign({}, sa);
  const frases = (dados.frases && dados.frases.length) ? dados.frases : ['Toda jornada é melhor quando compartilhada...','E existem pessoas que transformam a nossa vida...','Hoje você desbloqueou a conquista mais importante de todas...'];
  const reduz = _saReduz();
  const ov = document.createElement('div'); ov.className = 'sa-intro'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-label','História da conquista especial');
  ov.innerHTML = `<button class="sa-x" aria-label="Fechar a história" title="Fechar">✕</button>
    <div class="sa-frase" aria-live="polite"></div>
    <div class="sa-ctrl" role="toolbar" aria-label="Controles da história">
      <div class="sa-prog" aria-hidden="true">${frases.map(()=>'<i></i>').join('')}</div>
      <div class="sa-ctrl-row">
        <button data-a="pausa" aria-label="Pausar">${SA_ICO_PAUSA}</button>
        <span class="sa-vel">${[1,1.5,2].map(v=>`<button data-v="${v}" class="${v===1?'on':''}" aria-label="Velocidade ${String(v).replace('.',',')}x">${String(v).replace('.',',')}x</button>`).join('')}</span>
        <button data-a="frase" aria-label="Pular frase">Pular frase ›</button>
        <button data-a="tudo" aria-label="Pular a história e ver a conquista">Pular história</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const ph = ov.querySelector('.sa-frase');
  const H = _saHist = { ov, i:-1, vel:1, pausado:false, timer:null, fn:null, restante:0, inicio:0, vivo:true, total:frases.length };
  const trans = ()=>{ const d = reduz ? 0 : 1/H.vel; ph.style.transitionDuration = d+'s'; ov.style.transitionDuration = (reduz ? 0 : 1.2/H.vel)+'s'; };
  const exec = ()=>{ H.timer = null; const f = H.fn; H.fn = null; if(H.vivo && f) f(); };
  const agenda = (fn, msBase)=>{ if(H.timer) clearTimeout(H.timer); H.timer = null; H.fn = fn; H.restante = msBase / H.vel; H.inicio = performance.now(); if(!H.pausado) H.timer = setTimeout(exec, H.restante); };
  const prog = ()=>{ ov.querySelectorAll('.sa-prog i').forEach((d,k)=>{ d.className = k < H.i ? 'ok' : k === H.i ? 'now' : ''; }); };
  const mostrar = ()=>{
    ph.classList.remove('on');
    agenda(()=>{ ph.textContent = frases[H.i]; ph.classList.add('on'); prog();
      agenda(proxima, Math.min(9000, Math.max(3000, (frases[H.i]||'').length*90))); }, reduz ? 50 : 700);
  };
  function proxima(){ if(!H.vivo) return; H.i++; if(H.i < frases.length) mostrar(); else final(); }
  function final(){
    if(!H.vivo) return;
    if(H.timer){ clearTimeout(H.timer); H.timer = null; } H.fn = null;
    H.pausado = false; ph.classList.remove('on'); ov.classList.add('saindo');
    setTimeout(()=>{ if(_saHist !== H) return; _saHistParar(); saFinalConquista(dados); }, reduz ? 50 : 650);
  }
  const pausar = ()=>{ if(H.pausado) return; H.pausado = true; if(H.timer){ clearTimeout(H.timer); H.timer = null; H.restante -= performance.now() - H.inicio; } ov.classList.add('pausado'); const b = ov.querySelector('[data-a=pausa]'); b.innerHTML = SA_ICO_PLAY; b.setAttribute('aria-label','Continuar'); };
  const continuar = ()=>{ if(!H.pausado) return; H.pausado = false; if(H.fn){ H.inicio = performance.now(); H.timer = setTimeout(exec, Math.max(0, H.restante)); } ov.classList.remove('pausado'); const b = ov.querySelector('[data-a=pausa]'); b.innerHTML = SA_ICO_PAUSA; b.setAttribute('aria-label','Pausar'); };
  const setVel = v=>{
    if(v === H.vel) return;
    if(H.fn){ let rest = H.restante; if(H.timer){ rest -= performance.now() - H.inicio; clearTimeout(H.timer); H.timer = null; } H.restante = Math.max(0, rest * H.vel / v); if(!H.pausado){ H.inicio = performance.now(); H.timer = setTimeout(exec, H.restante); } }
    H.vel = v; trans();
    ov.querySelectorAll('.sa-vel button').forEach(b=>b.classList.toggle('on', +b.dataset.v === v));
  };
  const pularFrase = ()=>{ if(H.timer){ clearTimeout(H.timer); H.timer = null; } H.fn = null; if(H.pausado) continuar(); proxima(); };
  H.pausar = pausar; H.continuar = continuar; H.setVel = setVel; H.pularFrase = pularFrase; H.pularTudo = final;
  ov.querySelector('.sa-x').onclick = saHistoriaFechar;
  ov.querySelector('[data-a=pausa]').onclick = ()=> H.pausado ? continuar() : pausar();
  ov.querySelector('[data-a=frase]').onclick = pularFrase;
  ov.querySelector('[data-a=tudo]').onclick = final;
  ov.querySelectorAll('.sa-vel button').forEach(b=>b.onclick = ()=>setVel(+b.dataset.v));
  H.tecla = e=>{ if(e.key==='Escape') saHistoriaFechar(); else if(e.key===' '){ e.preventDefault(); H.pausado ? continuar() : pausar(); } else if(e.key==='ArrowRight') pularFrase(); };
  document.addEventListener('keydown', H.tecla);
  trans();
  requestAnimationFrame(()=>ov.classList.add('on'));
  agenda(proxima, reduz ? 200 : 1200);
};
// final da história (e "pular história"): o mesmo palco animado, com guardar e compartilhar
function saFinalConquista(dados){
  const podeCompartilhar = !!(state.specialTrophy && typeof saFormatoVideo === 'function');
  saPalco(dados, { id:'special-reveal', topo:`<button class="sa-x" aria-label="Fechar" onclick="saFecharPalco()">✕</button>`,
    acoes:`<button class="btn btn-primary" onclick="saGuardarParaSempre()">Guardar para sempre</button>${podeCompartilhar ? `<button class="btn btn-ghost" onclick="saFecharPalco();setTimeout(openMinhaConquistaShare,350)">Compartilhar</button>` : ''}` });
}
function saGuardarParaSempre(){
  try{ if(state.specialTrophy){ state.specialTrophy.guardadaEm = state.specialTrophy.guardadaEm || Date.now(); saveData(); } }catch(e){}
  saFecharPalco(); toast('💛 Guardada para sempre nas suas conquistas');
}
// ---- vídeo 9:16 ----
function saFormatoVideo(){
  if(!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return null;
  const tipos = [['video/mp4;codecs=avc1.42E01E','mp4'],['video/mp4;codecs=avc1','mp4'],['video/mp4','mp4'],['video/webm;codecs=vp9','webm'],['video/webm;codecs=vp8','webm'],['video/webm','webm']];
  for(const [m,ext] of tipos){ try{ if(MediaRecorder.isTypeSupported(m)) return {mime:m, ext}; }catch(e){} }
  return null;
}
async function saGravarVideo(sa, onProg){
  const fmt = saFormatoVideo(); if(!fmt) throw new Error('sem-gravador');
  const W = 1080, H = 1920;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  cv.className = 'sa-rec-canvas'; document.body.appendChild(cv);   // anexado: alguns navegadores não capturam canvas fora da página
  const g = cv.getContext('2d');
  const dados = Object.assign({}, sa, { nome: saNome(sa) });
  saFrame(g, W, H, 0, dados);
  const stream = cv.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: fmt.mime, videoBitsPerSecond: 6000000 });
  const partes = []; rec.ondataavailable = e=>{ if(e.data && e.data.size) partes.push(e.data); };
  const fim = new Promise(res=>{ rec.onstop = res; });
  rec.start(250);
  const t0 = performance.now();
  await new Promise(res=>{
    const loop = ()=>{ const t = (performance.now()-t0)/1000; saFrame(g, W, H, Math.min(t, SA_DUR), dados); onProg && onProg(Math.min(1, t/SA_DUR)); if(t < SA_DUR + 0.3) requestAnimationFrame(loop); else res(); };
    requestAnimationFrame(loop);
  });
  rec.stop(); await fim; stream.getTracks().forEach(tr=>tr.stop()); cv.remove();
  const blob = new Blob(partes, { type: fmt.mime.split(';')[0] });
  if(!blob.size) throw new Error('video-vazio');
  return { blob, ext: fmt.ext };
}
async function saImagemFinal(sa){
  const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1920;
  saFrame(cv.getContext('2d'), 1080, 1920, SA_DUR, Object.assign({}, sa, { nome: saNome(sa) }));
  return await new Promise(r=>cv.toBlob(r, 'image/png'));
}
async function saCompartilharArquivo(blob, nome, texto){
  const file = new File([blob], nome, { type: blob.type });
  try{ if(navigator.canShare && navigator.canShare({ files:[file] })){ await navigator.share({ files:[file], text: texto }); return 'compartilhado'; } }catch(e){ if(e && e.name==='AbortError') return 'cancelado'; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  return 'baixado';
}
function openSpecialShare(){
  if(!ehDonoDoApp()){ toast('🔒 Recurso restrito ao administrador principal.'); return; }
  const sa = specialAward || {};
  if(!sa.titulo){ toast('Salve a conquista (com título) antes de compartilhar.'); return; }
  const fmt = saFormatoVideo();
  $('modal-inner').innerHTML = `<h3>Compartilhar conquista</h3>
    <p class="mt-muted" style="margin:0 0 10px">Vídeo vertical 9:16 (${SA_DUR.toString().replace('.',',')} s) com o nome, a conquista, a mensagem e a data — sem e-mail nem outros dados pessoais.</p>
    <div class="adm-form"><label>Nome que aparece</label><input class="input" id="sa-nome-sh" value="${mtEsc(saNome(sa))}" placeholder="Primeiro nome"></div>
    ${fmt ? `<button class="btn btn-primary btn-block" style="margin-top:12px" id="sa-vid-btn" onclick="saGerarECompartilhar()">🎬 Gerar vídeo${fmt.ext==='mp4'?' (MP4)':''}</button>`
      : `<div class="note" style="margin-top:12px"><div class="note-line">Este navegador não consegue gravar vídeo. Use a imagem abaixo — ou abra o MetaTreino no Chrome atualizado.</div></div>`}
    ${fmt && fmt.ext!=='mp4' ? `<p class="mt-muted" style="font-size:11.5px;margin-top:6px">Este navegador grava em WebM. O WhatsApp e o Instagram nem sempre aceitam WebM — se não abrir lá, use a imagem.</p>`:''}
    <div id="sa-prog" class="mt-muted" style="font-size:12px;margin-top:8px;min-height:18px"></div>
    <button class="btn btn-ghost btn-block" style="margin-top:6px" onclick="saCompartilharImagem()">🖼️ Compartilhar como imagem</button>
    <button class="btn btn-ghost btn-block" style="margin-top:6px" onclick="saPrevia()">▶ Ver apresentação</button>
    <button class="btn btn-ghost btn-block" style="margin-top:6px" onclick="openSpecialAwardAdmin()">Voltar</button>`;
  $('modal-back').classList.add('on');
}
function _saComNome(){ const sa = Object.assign({}, specialAward||{}); const n = ($('sa-nome-sh')||{}).value; if(n!=null) sa.nome = String(n).trim().slice(0,40); return sa; }
async function saGerarECompartilhar(){
  if(!ehDonoDoApp()) return;
  const sa = _saComNome();
  await mtComBotao('sa-vid-btn', 'Gravando vídeo…', async ()=>{
    const p = $('sa-prog');
    const r = await saGravarVideo(sa, f=>{ if(p) p.textContent = `Gravando… ${Math.round(f*SA_DUR*10)/10} de ${SA_DUR} s`; });
    if(p) p.textContent = `Vídeo pronto (${(r.blob.size/1048576).toFixed(1).replace('.',',')} MB, ${r.ext.toUpperCase()}).`;
    const res = await saCompartilharArquivo(r.blob, `conquista-metatreino.${r.ext}`, `${sa.titulo} — MetaTreino`);
    if(res==='baixado') toast('Vídeo salvo nos downloads do aparelho.');
  });
}
async function saCompartilharImagem(){
  if(!ehDonoDoApp()) return;
  const b = await saImagemFinal(_saComNome());
  const res = await saCompartilharArquivo(b, 'conquista-metatreino.png', `${(specialAward||{}).titulo||''} — MetaTreino`);
  if(res==='baixado') toast('Imagem salva nos downloads do aparelho.');
}
function saPrevia(){
  if(!ehDonoDoApp()) return;
  closeModal();
  saPalco(_saComNome(), { acoes:`<button class="btn btn-ghost" onclick="saFecharPalco();setTimeout(openSpecialShare,300)">Fechar prévia</button>` });
}
// formulário do admin: campo do nome + atalhos de prévia e compartilhamento
const _openSAAdminB13 = openSpecialAwardAdmin;
window.openSpecialAwardAdmin = function(){
  _openSAAdminB13.apply(this, arguments);
  if(!ehDonoDoApp()) return;
  try{
    const s = specialAward || {};
    const p = document.querySelector('#modal-inner > p');
    if(p) p.textContent = 'Uma conquista única, para uma pessoa, revelada numa apresentação especial: frases surgindo e, no fim, a conquista animada. Aparece uma vez só.';
    const f = $('sa-titulo') && $('sa-titulo').closest('.field');
    if(f) f.insertAdjacentHTML('beforebegin', `<div class="field"><label>Nome que aparece na apresentação</label><input class="input" id="sa-nome" maxlength="40" placeholder="Primeiro nome" value="${mtEsc(s.nome||saNome(s)||'')}"></div>`);
    const salvar = [...document.querySelectorAll('#modal-inner button')].find(b=>/Salvar conquista/.test(b.textContent));
    if(salvar && s.titulo) salvar.insertAdjacentHTML('afterend', `<div style="display:flex;gap:8px;margin-top:8px"><button class="btn btn-ghost" style="flex:1" onclick="saPrevia()">▶ Ver apresentação</button><button class="btn btn-ghost" style="flex:1" onclick="openSpecialShare()">📤 Compartilhar conquista</button></div>`);
  }catch(e){}
};
const _saveSAB13 = saveSpecialAward;
window.saveSpecialAward = async function(){
  if(!ehDonoDoApp()) return;
  const nome = (($('sa-nome')||{}).value||'').trim().slice(0,40);
  await _saveSAB13.apply(this, arguments);
  try{ if(specialAward && specialAward.atualizadoEm){ specialAward.nome = nome; await db.collection('config').doc('specialAward').set({ nome }, { merge:true }); mtLS('metatreino_special', JSON.stringify(specialAward)); } }catch(e){}
};

// =====================================================================
// 22. BOTÕES "RECOLHER" PADRONIZADOS NA HOME (Beta 13)
// Mesmo botão (chevron discreto ao lado do título), mesma direção (o conteúdo fecha
// para cima, em direção ao título) e mesma animação nas duas seções.
// =====================================================================
const CHEV = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>';
function _colBotao(k, aberto, rotulo){
  // Atividade da semana: texto "Ocultar"/"Mostrar" discreto ao lado do título. Seus treinos: seta.
  if(k === 'semana') return `<button type="button" class="col-txt" data-col="${k}" aria-expanded="${aberto}" aria-label="${aberto?'Ocultar':'Mostrar'} ${rotulo}" onclick="event.stopPropagation();mtColAnimar('${k}')">${aberto?'Ocultar':'Mostrar'}</button>`;
  return `<button type="button" class="col-chev ${aberto?'':'fechado'}" data-col="${k}" aria-expanded="${aberto}" aria-label="${aberto?'Recolher':'Mostrar'} ${rotulo}" title="${aberto?'Recolher':'Mostrar'}" onclick="event.stopPropagation();mtColAnimar('${k}')">${CHEV}</button>`;
}
function _colCorpo(k){
  if(k==='treinos') return $('your-list');
  if(k==='semana') return $('home-quick-body');
  return null;
}
function mtColAnimar(k){
  const abertoAntes = mtColAberto(k, k!=='treinos');
  const corpo = _colCorpo(k);
  mtLS('mt_col_'+k, abertoAntes ? '0' : '1');
  if(!corpo){ _mtAplicaColapsos(); return; }
  const btn = document.querySelector(`[data-col="${k}"]`);
  if(btn){
    btn.setAttribute('aria-expanded', String(!abertoAntes));
    if(btn.classList.contains('col-txt')){ btn.textContent = abertoAntes ? 'Mostrar' : 'Ocultar'; btn.setAttribute('aria-label', (abertoAntes ? 'Mostrar' : 'Ocultar') + ' Atividade da semana'); }
    else { btn.classList.toggle('fechado', abertoAntes); btn.title = abertoAntes ? 'Mostrar' : 'Recolher'; }
  }
  const resumo = k==='treinos' ? $('home-tr-resumo') : null;
  if(abertoAntes){
    corpo.style.maxHeight = corpo.scrollHeight + 'px'; corpo.offsetHeight;
    corpo.classList.add('col-anim'); corpo.style.maxHeight = '0px'; corpo.style.opacity = '0';
    setTimeout(()=>{ corpo.style.display = 'none'; corpo.classList.remove('col-anim'); corpo.style.maxHeight = ''; corpo.style.opacity = ''; if(resumo){ resumo.style.display = ''; } }, 260);
  } else {
    if(resumo) resumo.style.display = 'none';
    corpo.style.display = ''; corpo.style.maxHeight = '0px'; corpo.style.opacity = '0'; corpo.offsetHeight;
    corpo.classList.add('col-anim'); corpo.style.maxHeight = corpo.scrollHeight + 'px'; corpo.style.opacity = '1';
    setTimeout(()=>{ corpo.classList.remove('col-anim'); corpo.style.maxHeight = ''; corpo.style.opacity = ''; }, 280);
  }
}
_mtAplicaColapsos = function(){
  const wrap = document.querySelector('#scr-home .wrap'); if(!wrap) return;
  // Seus treinos
  const head = wrap.querySelector(':scope > .section-head'); const lista = $('your-list');
  if(head && lista){
    const aberto = mtColAberto('treinos', false);
    head.querySelectorAll('.col-btn, .col-chev').forEach(b=>b.remove());
    const tit = head.firstElementChild; if(tit) tit.insertAdjacentHTML('afterend', _colBotao('treinos', aberto, 'Seus treinos'));
    let resumo = $('home-tr-resumo');
    if(!resumo){ resumo = document.createElement('div'); resumo.id = 'home-tr-resumo'; resumo.className = 'col-resumo'; lista.after(resumo); }
    const mod = state.modules[state.active]; const n = (mod && mod.plan && (mod.plan.workouts||[]).length) || lista.children.length;
    resumo.textContent = `${n} ${n===1?'treino':'treinos'} no plano`;
    resumo.style.display = aberto ? 'none' : '';
    lista.style.display = aberto ? '' : 'none';
  }
  // Atividade da semana: o corpo fica num contêiner próprio e o botão vai ao lado do título
  const q = $('home-quick');
  if(q && q.firstElementChild){
    q.querySelectorAll(':scope > .col-btn').forEach(b=>b.remove());
    q.classList.remove('mt-col');
    let body = $('home-quick-body');
    if(!body || body.parentElement !== q){
      body = document.createElement('div'); body.id = 'home-quick-body';
      [...q.children].slice(1).forEach(ch=>body.appendChild(ch));
      q.appendChild(body);
    }
    const header = q.firstElementChild;
    header.querySelectorAll('.col-chev, .col-txt').forEach(b=>b.remove());
    header.classList.add('col-head');
    const aberto = mtColAberto('semana', true);
    const h3 = header.querySelector('h3');
    if(h3) h3.insertAdjacentHTML('afterend', _colBotao('semana', aberto, 'Atividade da semana'));
    else header.insertAdjacentHTML('beforeend', _colBotao('semana', aberto, 'Atividade da semana'));
    body.style.display = aberto ? '' : 'none';
    // os gráficos abrem só pela área dos anéis; o título e "X de Y treinos" são apenas informativos
    q.onclick = null; q.style.cursor = 'default';
    body.onclick = ()=>openAtividadeDetalhes();
    body.style.cursor = 'pointer'; body.setAttribute('role','button'); body.setAttribute('aria-label','Ver detalhes da atividade da semana');
  }
  // avisos longos: 2 linhas + "ver mais" (mesmo comportamento de antes)
  ['card-missed','card-weekrecap','card-coach-msg'].forEach(id=>{
    const c = $(id); if(!c || c.classList.contains('hidden')) return;
    const sub = c.querySelector('.card-sub'); if(!sub || sub.dataset.clamp) return;
    if((sub.textContent||'').length < 140) return;
    sub.dataset.clamp = '1'; sub.classList.add('clamp2');
    const mais = document.createElement('button'); mais.type='button'; mais.className='link-mais'; mais.textContent='ver mais';
    mais.onclick = e=>{ e.stopPropagation(); const fech = sub.classList.toggle('clamp2'); mais.textContent = fech ? 'ver mais' : 'ver menos'; };
    sub.after(mais);
  });
};

Object.assign(window, { estadoTreino, cargaRetomada, mtColAnimar, saHistoriaFechar, saGuardarParaSempre, saFinalConquista, openSpecialShare, saGerarECompartilhar, saCompartilharImagem, saPrevia, saFecharPalco, saFrame, saFormatoVideo, saGravarVideo });

// =====================================================================
// 23. CORRIDA — DO PRIMEIRO PASSO À PREPARAÇÃO PARA PROVAS (Beta 14)
// Camada sobre o módulo de corrida que já existia: mesmo formato de plano
// (workouts com blocks), mesmo histórico, mesmas telas. O plano passa a ser
// gerado SEMANA A SEMANA por um "motor" que avalia a semana anterior antes
// de mudar qualquer coisa. Tudo é calculado em MINUTOS de corrida (tempo em
// movimento); km e ritmos só aparecem quando há dados confiáveis do aluno.
// Hierarquia (igual ao resto do app): retomada > recuperação/fadiga > progressão > normal.
// =====================================================================
const RN = ['iniciante','iniciante_avancado','intermediario','intermediario_avancado','avancado','competitivo'];
const RN_NOME = ['Iniciante','Iniciante avançado','Intermediário','Intermediário avançado','Avançado','Competitivo'];
const RN_LEG = ['iniciante','iniciante','intermediario','intermediario','avancado','avancado'];
const RN_FOCO = [
  'criar o hábito e a resistência básica, alternando caminhada e corrida',
  'correr sem parar por mais tempo, sempre em ritmo de conversa',
  'resistência e distância, com os primeiros treinos de ritmo',
  'velocidade e limiar: sustentar ritmos mais fortes por mais tempo',
  'treinos estruturados, volume maior e preparação específica para provas',
  'metas de desempenho, com controle fino de volume, intensidade e recuperação'];
const RGOAL = { comecar:{nome:'Começar a correr', km:null}, condicionamento:{nome:'Condicionamento', km:null},
  '5km':{nome:'5 km', km:5}, '10km':{nome:'10 km', km:10}, '21km':{nome:'Meia maratona', km:21.0975}, '42km':{nome:'Maratona', km:42.195} };
const RFASE = {
  adaptacao:{nome:'Adaptação', desc:'acostumar o corpo e a rotina ao treino, sem pressa'},
  base:{nome:'Resistência', desc:'construir a base aeróbica: mais tempo correndo em ritmo leve'},
  desenvolvimento:{nome:'Velocidade e ritmo', desc:'treinos de qualidade para correr mais forte por mais tempo'},
  especifica:{nome:'Preparação para a prova', desc:'treinos no ritmo e na distância da prova'},
  taper:{nome:'Polimento', desc:'volume menor para chegar descansado e afiado na prova'},
  pos_prova:{nome:'Recuperação pós-prova', desc:'corridas leves para o corpo se recuperar da prova'},
  recuperacao:{nome:'Semana de recuperação', desc:'volume menor para o corpo assimilar as últimas semanas'},
  retomada:{nome:'Retomada', desc:'volta gradual depois da pausa: só treinos leves e volume reduzido'}
};
// estágios de caminhada + corrida (nível Iniciante). O 6 fecha com 10 min sem parar.
const RUN_EST = [
  {rep:0, corre:0, anda:0, cam:25, nome:'Caminhada ativa'},
  {rep:8, corre:1, anda:2}, {rep:6, corre:2, anda:2}, {rep:5, corre:3, anda:2},
  {rep:4, corre:4, anda:2}, {rep:4, corre:5, anda:2}, {rep:3, corre:7, anda:2}, {rep:2, corre:10, anda:2}
];
const RUN_DIAS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
const _clamp = (v,a,b)=>Math.max(a, Math.min(b, v));
const _r5 = v=>Math.round(v/5)*5;

// ---------- contexto (o mesmo motor serve para o aluno logado e para o painel do admin) ----------
function runCtx(data){
  data = data || state;
  const mods = (data && data.modules) || {};
  return { run: mods.run || null, lift: mods.lift || null, user: (data && data.user) || {}, stats: (data && data.corridaStats) || {}, agora: Date.now() };
}
function _ehCorrida(r){ return r && (!r.activity || r.activity==='corrida'); }
function rCorridas(ctx){ return (((ctx.run||{}).history)||[]).filter(r=>_ehCorrida(r) && r.at && (+r.duration||0)>0).sort((a,b)=>a.at-b.at); }
function rAtividades(ctx){ return (((ctx.run||{}).history)||[]).filter(r=>r && r.at && (+r.duration||0)>0).sort((a,b)=>a.at-b.at); }
function rSem(t){ return mtSemanaIni(t==null?Date.now():t); }
function rPace(r){ return (+r.distance>0 && +r.duration>0) ? (+r.duration)/(+r.distance) : null; }
function rContinua(r){
  if(r.continuo === false) return false;
  if(r.tipoSessao === 'camcorre' || r.tipoSessao === 'caminhada') return r.continuo === true;
  return true;   // registros antigos: corrida registrada como corrida
}
function rFmtSeg(seg){ seg = Math.round(seg||0); const h = Math.floor(seg/3600), m = Math.floor(seg%3600/60), s = seg%60; return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`; }
function rFmtMin(min){ return rFmtSeg((min||0)*60); }
function rKmh(paceMin){ return paceMin>0 ? (60/paceMin) : 0; }
function rFmtKmh(paceMin){ return rKmh(paceMin).toLocaleString('pt-BR',{maximumFractionDigits:1, minimumFractionDigits:1})+' km/h'; }
function rFmtDurCurta(min){ min = Math.round(min); return min>=60 ? `${Math.floor(min/60)}h${String(min%60).padStart(2,'0')}` : `${min} min`; }

// ---------- ciência do ritmo: VDOT (Jack Daniels) ----------
function _pctMax(t){ return 0.8 + 0.1894393*Math.exp(-0.012778*t) + 0.2989558*Math.exp(-0.1932605*t); }
function rVdot(km, min){ if(!(km>0 && min>0)) return null; const v = km*1000/min; const vo2 = -4.6 + 0.182258*v + 0.000104*v*v; return vo2/_pctMax(min); }
function _velVo2(vo2){ const a = 0.000104, b = 0.182258, c = -4.6 - vo2; return (-b + Math.sqrt(b*b - 4*a*c))/(2*a); } // m/min
function rPrevisto(vdot, km){ let t = km*6; for(let i=0;i<40;i++){ const v = _velVo2(vdot*_pctMax(t)); t = km*1000/v; } return t; }
function _paceFrac(vdot, f){ return 1000/_velVo2(vdot*f); } // min/km
// zonas a partir do VDOT (min/km) — faixas: [rápido, lento]
function rZonasDe(vdot){
  const M = rPrevisto(vdot, 42.195)/42.195, T = _paceFrac(vdot, 0.88), I = _paceFrac(vdot, 0.975), R = I*0.94;
  return {
    regenerativo:{ a:_paceFrac(vdot,0.60)+0.25, b:_paceFrac(vdot,0.56)+0.5 },
    leve:{ a:_paceFrac(vdot,0.74), b:_paceFrac(vdot,0.64) },
    maratona:{ a:M-0.05, b:M+0.05 },
    limiar:{ a:T-0.05, b:T+0.05 },
    intervalado:{ a:I-0.04, b:I+0.04 },
    velocidade:{ a:R-0.05, b:R+0.03 },
    meia:{ a:rPrevisto(vdot,21.0975)/21.0975-0.04, b:rPrevisto(vdot,21.0975)/21.0975+0.04 },
    p10:{ a:rPrevisto(vdot,10)/10-0.04, b:rPrevisto(vdot,10)/10+0.04 },
    p5:{ a:rPrevisto(vdot,5)/5-0.04, b:rPrevisto(vdot,5)/5+0.04 }
  };
}
const RZ_INFO = {
  regenerativo:{nome:'Regenerativo', rpe:'2–3', txt:'Muito leve, para soltar. Mais devagar que o seu leve.'},
  leve:{nome:'Leve / longão', rpe:'3–4', txt:'Ritmo de conversa: frases inteiras sem perder o fôlego.'},
  maratona:{nome:'Ritmo de maratona', rpe:'5–6', txt:'Firme mas controlado; dá para falar frases curtas.'},
  limiar:{nome:'Limiar', rpe:'7', txt:'"Confortavelmente difícil": fala só palavras soltas.'},
  intervalado:{nome:'Intervalado', rpe:'8–9', txt:'Forte, sustentável por 3–5 min. Sem fala.'},
  velocidade:{nome:'Velocidade', rpe:'9', txt:'Rápido e solto, em tiros curtos, sem travar a passada.'}
};
function rFaixa(z){ return z ? `${mtPaceStr(z.a).replace('/km','')}–${mtPaceStr(z.b)}` : ''; }

// ---------- perfil real do aluno (só dados registrados) ----------
function rPerfil(ctx){
  const runs = rCorridas(ctx), ativ = rAtividades(ctx);
  const agora = ctx.agora, s0 = rSem(agora);
  const p = { temHist: runs.length >= 3, nCorridas: runs.length };
  const semanas = [];
  for(let i=1;i<=6;i++){ const a = s0 - i*7*DIA_MS, b = a + 7*DIA_MS;
    const rs = runs.filter(r=>r.at>=a && r.at<b);
    semanas.push({ a, n: rs.length, min: rs.reduce((t,r)=>t+(+r.duration||0),0), km: rs.reduce((t,r)=>t+(+r.distance||0),0) }); }
  p.semanas = semanas;
  const comDados = semanas.filter(w=>w.n>0);
  p.regular = semanas.filter(w=>w.n>=2).length;                     // semanas com 2+ corridas (de 6)
  const ult4 = semanas.slice(0,4);
  p.minSemana = ult4.filter(w=>w.n>0).length >= 2 ? ult4.reduce((t,w)=>t+w.min,0)/Math.max(1, ult4.filter(w=>w.n>0).length) : null;
  p.kmSemana = ult4.filter(w=>w.n>0).length >= 2 ? ult4.reduce((t,w)=>t+w.km,0)/Math.max(1, ult4.filter(w=>w.n>0).length) : null;
  const rec = runs.filter(r=>r.at >= agora - 56*DIA_MS);
  p.contMin = rec.filter(rContinua).reduce((m,r)=>Math.max(m, +r.duration||0), 0);
  p.maiorKm = rec.reduce((m,r)=>Math.max(m, +r.distance||0), 0);
  const leves = rec.filter(r=>['leve','continua','longao','regenerativo'].includes(r.tipoSessao) || (!r.tipoSessao && (+r.rpe||5)<=5));
  p.rpeLeve = leves.length >= 3 ? leves.slice(-6).reduce((t,r)=>t+(+r.rpe||5),0)/Math.min(6, leves.length) : null;
  const paces = leves.map(rPace).filter(Boolean).slice(-8).sort((a,b)=>a-b);
  p.paceLeve = paces.length >= 3 ? paces[Math.floor(paces.length/2)] : null;
  p.ultima = runs.length ? runs[runs.length-1] : null;
  p.ultimaAtiv = ativ.length ? ativ[ativ.length-1] : null;
  p.diasSemCorrer = p.ultima ? Math.round((mtDia0(agora) - mtDia0(p.ultima.at))/DIA_MS) : null;
  return p;
}

// ---------- pausa e retomada (só corrida; caminhada conta para quem está no nível Iniciante) ----------
function rPausa(ctx, nivel){
  const lista = nivel===0 ? rAtividades(ctx).filter(r=>r.activity!=='bike') : rCorridas(ctx);
  if(!lista.length) return null;
  const dias = [...new Set(lista.map(r=>mtDia0(r.at)))].sort((a,b)=>a-b);
  const hoje = mtDia0(ctx.agora), ult = dias[dias.length-1];
  const desde = Math.round((hoje-ult)/DIA_MS);
  if(desde >= 7) return { pausa:desde, voltou:false, ultimoAntes:ult, retorno:null };
  for(let i=dias.length-1;i>0;i--){
    if(hoje - dias[i] > 35*DIA_MS) break;
    const gap = Math.round((dias[i]-dias[i-1])/DIA_MS);
    if(gap >= 7) return { pausa:gap, voltou:true, ultimoAntes:dias[i-1], retorno:dias[i] };
  }
  return null;
}
function rRetomadaSemanas(pausa){ return pausa>=60 ? 4 : pausa>=28 ? 3 : pausa>=14 ? 2 : 1; }
const RET_FAT = [[0.7],[0.6,0.8],[0.5,0.65,0.8],[0.4,0.55,0.7,0.85]];

// ---------- referência de ritmo (nunca inventada) ----------
// confiança: alta = prova ou tempo informado recente · média = treino forte registrado · baixa = ritmo dos treinos leves
function rReferencia(ctx){
  const runs = rCorridas(ctx); const agora = ctx.agora; const setup = (ctx.run||{}).setup||{}; const aval = setup.aval||{};
  const cand = [];
  if(aval.marca && aval.marca.km && aval.marca.seg && (!aval.em || agora - aval.em < 120*DIA_MS)){
    const v = rVdot(aval.marca.km, aval.marca.seg/60); if(v) cand.push({ vdot:v, conf:'alta', fonte:`do seu tempo informado de ${rFmtSeg(aval.marca.seg)} nos ${String(aval.marca.km).replace('.',',').replace(',0975','').replace(',195','')} km`, at:aval.em||agora });
  }
  const st = ctx.stats || {};
  (st.provas||[]).concat(runs.filter(r=>r.isRace).map(r=>({at:r.at, km:+r.distance, min:+r.duration}))).forEach(pv=>{
    if(pv.km>=1.5 && pv.min>0 && agora - pv.at < 140*DIA_MS){ const v = rVdot(pv.km, pv.min); if(v) cand.push({ vdot:v, conf:'alta', fonte:`da sua prova de ${mtFmtKm(pv.km)} km em ${mtFmtData(pv.at)}`, at:pv.at }); }
  });
  runs.filter(r=>!r.isRace && +r.distance>=3 && (+r.rpe||0)>=8 && agora - r.at < 70*DIA_MS && (!r.tipoSessao || ['tempo','limiar','ritmo_prova','leve','continua','longao'].includes(r.tipoSessao))).forEach(r=>{
    const v = rVdot(+r.distance, +r.duration); if(v) cand.push({ vdot:v, conf:'media', fonte:`do seu treino forte de ${mtFmtKm(r.distance)} km em ${mtFmtData(r.at)}`, at:r.at });
  });
  let best = null;
  cand.forEach(c=>{ if(!best || (c.conf==='alta' && best.conf!=='alta') || (c.conf===best.conf && c.vdot>best.vdot) || (c.conf==='media' && best.conf==='alta' && c.vdot > best.vdot*1.03)) best = c; });
  if(!best){
    const p = rPerfil(ctx);
    if(p.paceLeve){ // ritmo leve observado ≈ 66% do VO2max (aproximação)
      const vel = 1000/p.paceLeve; const vo2 = -4.6 + 0.182258*vel + 0.000104*vel*vel; const v = vo2/0.66;
      if(v>20 && v<80) best = { vdot:v, conf:'baixa', fonte:'do ritmo das suas corridas leves recentes', at:agora };
    }
  }
  if(!best || !(best.vdot>20 && best.vdot<85)) return null;
  // depois de pausas longas o condicionamento cai — a referência acompanha
  const pz = rPausa(ctx, 2);
  let fator = 1;
  if(pz && pz.ultimoAntes >= best.at - DIA_MS){ fator = pz.pausa>=56 ? 0.88 : pz.pausa>=28 ? 0.93 : pz.pausa>=14 ? 0.97 : 1; }
  return Object.assign({}, best, { vdot: best.vdot*fator, reduzida: fator<1, zonas: rZonasDe(best.vdot*fator) });
}

// ---------- nível ----------
const RUN_CONT_AVAL = { '0':0, '5':3, '10':7, '20':15, '30':25, '60':45, '90':70 };
function rNivelPotencial(ctx, aval){
  aval = aval || (((ctx.run||{}).setup||{}).aval) || {};
  const p = rPerfil(ctx);
  const cont = Math.max(RUN_CONT_AVAL[String(aval.continuo||'0')]||0, p.contMin||0);
  if(cont < 10) return 0;
  if(cont < 30) return 1;
  const exp = aval.exp || 'pouco';
  const kmAval = +aval.kmSemana || 0;
  const minSem = (p.minSemana!=null && p.temHist) ? p.minSemana : (kmAval ? kmAval*6.2 : cont*2);
  const ref = rReferencia(ctx);
  const regularOk = !p.temHist || p.regular >= 3;
  let n = 2;
  if(minSem >= 150 && cont >= 40 && ['regular','experiente'].includes(exp)) n = 3;
  if(n===3 && minSem >= 210 && cont >= 60 && regularOk) n = 4;
  if(n===4 && minSem >= 300 && cont >= 70 && exp==='experiente' && ref && ref.conf!=='baixa' && ref.vdot >= 45) n = 5;
  if(p.rpeLeve != null && p.rpeLeve >= 7 && n > 2) n--;   // treino leve vindo pesado = recuperação ainda não acompanha
  return n;
}
function rEstagioInicial(ctx, aval){
  const c = RUN_CONT_AVAL[String(aval.continuo||'0')]||0;
  if(c >= 7) return 5; if(c >= 3) return 3;
  const pr = ctx.user && ctx.user.profile; let imc = null; try{ const r = calcIMC(); imc = r ? parseFloat(r.value) : null; }catch(e){}
  if(aval.exp==='nunca' && ((imc && imc>=32) || (pr && pr.age>=60) || (aval.lim||[]).length)) return 0;
  return 1;
}

// ---------- metas de volume (minutos de corrida por semana) ----------
const RUN_PICO = { // [nível 0..5]
  comecar:[75,110,150,180,210,240], condicionamento:[75,120,160,200,240,280],
  '5km':[75,110,150,190,240,300], '10km':[75,120,175,220,280,350],
  '21km':[75,120,190,260,330,420], '42km':[75,120,190,280,390,500] };
const RUN_LONGO_CAP = { comecar:[30,40,60,75,80,90], condicionamento:[30,45,65,80,90,100], '5km':[30,40,60,75,90,90],
  '10km':[30,50,75,90,100,110], '21km':[30,50,90,120,135,150], '42km':[30,50,90,150,180,195] };
// semanas mínimas para chegar bem em cada prova, por nível
const RUN_PRAZO = { '5km':[10,6,4,4,3,3], '10km':[18,12,8,6,5,5], '21km':[30,22,16,12,10,10], '42km':[45,36,26,20,16,14] };
// nível mínimo para tratar a prova como objetivo específico (abaixo disso, o plano prepara a base primeiro)
const RUN_NIVEL_MIN = { '5km':0, '10km':1, '21km':2, '42km':3, comecar:0, condicionamento:0 };

function rGoal(setup){ return RGOAL[(setup||{}).goal] ? setup.goal : '5km'; }
function rTempos(setup){ const a = (setup||{}).aval||{}; const t = +a.tempo || 45; const tl = +a.tempoLongo || 0; return { sessao:t, longo: Math.max(t, tl || Math.round(t*1.35)) }; }
function rDiasPerna(ctx){
  const L = ctx.lift && ctx.lift.plan; if(!L) return [];
  return (L.workouts||[]).filter(w=>/Pernas|Glúteos|Inferior|Full|Corpo inteiro|Lower|Panturrilha/i.test(((w.parts||[]).join(' '))+' '+(w.name||''))).map(w=>w.dayIdx);
}

// fase da semana (sem retomada — ela é tratada antes)
function rFase(ctx, motor, semTs){
  const setup = (ctx.run||{}).setup||{}; const goal = rGoal(setup); const nv = motor.nivel;
  // depois de uma prova: recuperação
  const provas = ((ctx.stats||{}).provas||[]).concat(rCorridas(ctx).filter(r=>r.isRace).map(r=>({at:r.at, km:+r.distance})));
  const ultProva = provas.sort((a,b)=>b.at-a.at)[0];
  if(ultProva){ const semProva = rSem(ultProva.at); const n = ultProva.km>=30 ? 3 : ultProva.km>=15 ? 2 : 1;
    const k = Math.round((semTs - semProva)/(7*DIA_MS)); if(k>=1 && k<=n) return { fase:'pos_prova', k, n }; }
  const semanaDoPlano = Math.max(1, Math.round((semTs - (motor.inicio||semTs))/(7*DIA_MS))+1);
  const rd = setup.raceDate ? new Date(setup.raceDate+'T12:00:00').getTime() : null;
  // Beta 33: a prova marcada já passou (o aluno pode ter registrado no dia seguinte, sem marcar como prova,
  // e a data só é limpa no próximo login): a semana seguinte é de recuperação, não de "polimento" com longão.
  if(rd && rSem(rd) < semTs){
    const kmP = (RGOAL[goal]||{}).km || 5; const nP = kmP>=30 ? 3 : kmP>=15 ? 2 : 1;
    const kP = Math.round((semTs - rSem(rd))/(7*DIA_MS)); if(kP>=1 && kP<=nP) return { fase:'pos_prova', k:kP, n:nP };
  }
  if(rd && rSem(rd) >= semTs){
    const W = Math.round((rSem(rd) - semTs)/(7*DIA_MS));      // 0 = semana da prova
    const km = (RGOAL[goal]||{}).km || 5;
    const tap = km>=40 ? 3 : km>=20 ? 2 : 1, esp = km>=40 ? 6 : km>=20 ? 5 : km>=10 ? 4 : 3;
    if(W < tap) return { fase:'taper', W, tap };
    if(nv >= 2 && W < tap+esp && nv >= (RUN_NIVEL_MIN[goal]||0)) return { fase:'especifica', W };
    if(nv >= 2 && W < tap+esp+4) return { fase:'desenvolvimento', W };
    if(nv <= 1 || semanaDoPlano <= 2) return { fase: nv===0 ? 'adaptacao' : 'base', W };
    return { fase:'base', W };
  }
  if(nv === 0) return { fase:'adaptacao' };
  if(nv === 1) return { fase: semanaDoPlano<=2 ? 'adaptacao' : 'base' };
  if(semanaDoPlano <= 2) return { fase:'adaptacao' };
  if(motor.nivelDesde && semTs - motor.nivelDesde < 4*7*DIA_MS && semTs > motor.inicio) return { fase:'base' };
  // sem prova: blocos de 4 semanas — 2 de resistência, 1 de velocidade/ritmo, e repete
  const bloco = Math.floor((semanaDoPlano-3)/4) % 3;
  return { fase: bloco===2 ? 'desenvolvimento' : 'base' };
}

// ---------- motor ----------
function rMotorNovo(ctx, setup, inicioTs){
  let aval = setup.aval;
  if(!aval){ // plano criado antes da Beta 14: parte do nível antigo e do histórico real
    aval = ({ iniciante:{exp:'pouco', continuo:'5'}, intermediario:{exp:'regular', continuo:'60', kmSemana:15}, avancado:{exp:'regular', continuo:'90', kmSemana:42} })[setup.level||'iniciante'] || {exp:'pouco', continuo:'5'};
  }
  const nv = rNivelPotencial(ctx, aval);
  const p = rPerfil(ctx);
  const tempos = rTempos(setup);
  const m = { v:1, nivel:nv, nivelDesde: rSem(inicioTs), inicio: rSem(inicioTs), q:0, ultimaVar:'intensidade', semanas:{}, hist:[], estagio:null, contMin:null, vol:null, retomada:null };
  if(nv === 0) m.estagio = rEstagioInicial(ctx, aval);
  const cont = Math.max(RUN_CONT_AVAL[String(aval.continuo||'0')]||0, p.contMin||0);
  if(nv === 1) m.contMin = _clamp(_r5(cont*0.9), 10, 30);
  // volume inicial: o que a pessoa já faz (histórico > resposta), sem passar do que cabe na agenda
  const dias = setup.days || 3;
  let vol;
  if(p.minSemana && p.temHist) vol = p.minSemana;
  else if(+aval.kmSemana) vol = (+aval.kmSemana) * 6.2;
  else vol = cont * Math.min(dias, 3) * 0.8;
  const pico = RUN_PICO[rGoal(setup)][nv];
  m.vol = Math.round(_clamp(vol, nv<=1 ? 60 : 90, Math.max(90, Math.min(pico, (dias-1)*(tempos.sessao-11) + (tempos.longo-12)))));
  // parado agora (resposta) sem histórico que mostre outra coisa → começa em retomada
  const parado = +aval.parado || 0;
  if(parado >= 7 && !(p.diasSemCorrer!=null && p.diasSemCorrer < 7)) m.retomadaDecl = { pausa: parado, desde: rSem(inicioTs) };
  return m;
}
function _rPush(motor, item){ motor.hist = (motor.hist||[]).concat([item]).slice(-26); }

// avaliação da semana que terminou → decide UMA mudança (ou nenhuma)
function rAvaliarSemana(ctx, motor, semTs){
  const info = (motor.semanas||{})[semTs] || null;
  const a = semTs, b = semTs + 7*DIA_MS;
  const nv = motor.nivel;
  const ativ = rAtividades(ctx).filter(r=>r.at>=a && r.at<b && (r.activity!=='bike') && (nv===0 || _ehCorrida(r)));
  const planejado = info ? info.planejado : 0;
  const diasFeitos = new Set(ativ.map(r=>mtDia0(r.at))).size;
  const cump = planejado ? Math.min(1, diasFeitos/planejado) : (diasFeitos ? 1 : 0);
  const rpes = ativ.map(r=>+r.rpe||null).filter(Boolean);
  const rpeMed = rpes.length ? rpes.reduce((x,y)=>x+y,0)/rpes.length : null;
  const naoConc = ativ.filter(r=>r.concluiu==='nao').length;
  const parcial = ativ.filter(r=>r.concluiu==='parcial').length;
  const levesPesados = ativ.filter(r=>['leve','continua','longao','regenerativo','camcorre','caminhada'].includes(r.tipoSessao) && (+r.rpe||0) >= 8).length;
  const bikeCam = rAtividades(ctx).filter(r=>r.at>=a && r.at<b && (r.activity==='bike' || (r.activity==='caminhada' && nv>0)));
  const minComp = bikeCam.reduce((t,r)=>t+(+r.duration||0),0);
  const rpeTxt = rpeMed ? String(Math.round(rpeMed*10)/10).replace('.',',') : '';
  const res = { sem:semTs, planejado, feitos:diasFeitos, cump:Math.round(cump*100), rpe: rpeMed ? Math.round(rpeMed*10)/10 : null, naoConc, parcial, minComp: Math.round(minComp), decisao:'manter', motivo:'', mudou:'' };
  if(info && info.fase==='retomada'){ res.decisao = 'retomada'; res.motivo = 'semana de retomada: o volume segue a volta gradual, sem avaliação de progresso'; return res; }
  if(!planejado && !diasFeitos){ res.motivo = 'semana sem treinos planejados'; return res; }
  const anterior = (motor.hist||[]).slice(-1)[0];
  if(naoConc >= 2 || levesPesados >= 2 || (rpeMed && rpeMed >= 8 && nv <= 2) || (naoConc && rpeMed && rpeMed >= 7.5)){
    res.decisao = 'recuar';
    res.motivo = naoConc ? `${naoConc} treino${naoConc>1?'s':''} não ${naoConc>1?'foram completados':'foi completado'}` : levesPesados ? 'treinos leves saíram com esforço alto (8+ de 10)' : `esforço médio de ${rpeTxt}/10, acima do esperado`;
  } else if(cump < 0.5){
    res.decisao = (anterior && anterior.cump < 50 && anterior.decisao!=='recuar') ? 'recuar' : 'manter';
    res.motivo = `${diasFeitos} de ${planejado} treinos feitos — ${res.decisao==='recuar'?'segunda semana assim: o plano fica um pouco mais leve para caber na sua rotina':'a semana se repete, sem compensar o que faltou'}`;
  } else if(cump >= 0.75 && (rpeMed==null || rpeMed <= (nv>=3 ? 7 : 6.5)) && !naoConc && parcial <= 1 && info && info.fase!=='recuperacao' && info.fase!=='taper' && info.fase!=='pos_prova'){
    res.decisao = 'avancar';
    res.motivo = `${diasFeitos} de ${planejado} treinos completos${rpeMed?` com esforço médio de ${rpeTxt}/10`:''}`;
  } else {
    res.motivo = info && ['recuperacao','taper','pos_prova'].includes(info.fase) ? ({recuperacao:'semana de recuperação planejada', taper:'semana de polimento', pos_prova:'recuperação depois da prova'})[info.fase] : `${diasFeitos} de ${planejado} treinos${rpeMed?`, esforço ${rpeTxt}/10`:''}${parcial?`, ${parcial} incompleto${parcial>1?'s':''}`:''}`;
  }
  // bike e caminhada contam como carga complementar (não como corrida): muito volume extra + esforço alto segura a progressão
  if(res.decisao==='avancar' && minComp > 0 && minComp >= (info && info.vol || 60) && rpeMed && rpeMed >= 6){ res.decisao = 'manter'; res.motivo += `; ${Math.round(minComp)} min de bike/caminhada na semana somaram carga`; }
  return res;
}
// aplica a decisão: muda uma variável por vez
function rAplicarDecisao(ctx, motor, res){
  const setup = (ctx.run||{}).setup||{}; const goal = rGoal(setup); const nv = motor.nivel;
  const tempos = rTempos(setup); const dias = setup.days || 3;
  const pico = Math.min(RUN_PICO[goal][nv], Math.max(60, (dias-1)*(tempos.sessao-11) + (tempos.longo-12)));
  const rs = rCorridas(ctx).filter(r=>r.at>=res.sem && r.at<res.sem+7*DIA_MS);
  if(res.decisao==='avancar'){
    if(nv === 0){
      const noEstagio = rAtividades(ctx).filter(r=>r.at>=res.sem && r.at<res.sem+7*DIA_MS && (r.tipoSessao==='camcorre' || r.tipoSessao==='caminhada') && (r.estagio===motor.estagio) && r.concluiu!=='nao' && r.concluiu!=='parcial' && (+r.rpe||5)<=7).length;
      if(noEstagio >= 2 && motor.estagio < RUN_EST.length-1){ motor.estagio++; res.mudou = `próximo estágio: ${rEstagioTxt(motor.estagio)}`; }
      else if(noEstagio >= 2 && motor.estagio === RUN_EST.length-1){ motor.nivel = 1; motor.nivelDesde = res.sem+7*DIA_MS; motor.contMin = 12; res.mudou = `você correu 10 min sem parar: agora é ${RN_NOME[1]}`; }
      else { res.decisao = 'manter'; res.motivo = `para avançar de estágio são 2 treinos completos com esforço até 7/10 no estágio atual (feitos: ${noEstagio})`; }
    } else if(nv === 1){
      const ok = rs.filter(r=>rContinua(r) && (+r.duration||0) >= (motor.contMin||10)*0.95 && r.concluiu!=='nao' && (+r.rpe||5)<=6).length;
      if(ok >= 2){
        if((motor.contMin||10) >= 30){ motor.nivel = 2; motor.nivelDesde = res.sem+7*DIA_MS; motor.vol = Math.max(motor.vol||0, 100); res.mudou = `30 min contínuos com folga: agora é ${RN_NOME[2]}`; }
        else { const de = motor.contMin; motor.contMin = Math.min(30, (motor.contMin||10) + ((motor.contMin||10) < 20 ? 3 : 5)); res.mudou = `corrida contínua: ${de} → ${motor.contMin} min`; }
      } else { res.decisao = 'manter'; res.motivo = `para aumentar, são 2 corridas de ${motor.contMin} min sem parar com esforço até 6/10 (feitas: ${ok})`; }
    } else {
      const podeIntens = !['adaptacao','base'].includes((motor.semanas[res.sem]||{}).fase) || nv >= 3;
      if(motor.ultimaVar==='volume' && podeIntens && motor.q < 5){ motor.q++; motor.ultimaVar = 'intensidade'; res.mudou = 'treinos de qualidade um pouco mais longos (volume semanal mantido)'; }
      else if(motor.vol < pico){ const de = motor.vol; motor.vol = Math.round(Math.min(pico, motor.vol*1.08 + 2)); motor.ultimaVar = 'volume'; res.mudou = `volume semanal ${de} → ${motor.vol} min (+${Math.round((motor.vol/de-1)*100)}%)`; }
      else if(motor.q < 5){ motor.q++; motor.ultimaVar = 'intensidade'; res.mudou = 'volume no limite do seu objetivo/agenda: evolução pela qualidade'; }
      else { res.decisao = 'manter'; res.motivo += ' — você está no pico planejado para o seu nível e agenda'; }
    }
  } else if(res.decisao==='recuar'){
    if(nv === 0){ if(motor.estagio > 1){ motor.estagio--; res.mudou = `volta para ${rEstagioTxt(motor.estagio)}`; } else res.mudou = 'repete o estágio, sem pressa'; }
    else if(nv === 1){ const de = motor.contMin; motor.contMin = Math.max(10, (motor.contMin||10) - 3); res.mudou = de!==motor.contMin ? `corrida contínua ${de} → ${motor.contMin} min` : 'repete a semana'; }
    else { const de = motor.vol; motor.vol = Math.round(Math.max(60, motor.vol*0.88)); if(motor.q>0) motor.q--; res.mudou = `volume ${de} → ${motor.vol} min e qualidade mais leve`; }
  }
  // promoção de nível (≥2): só com evolução comprovada — nunca por tempo de uso
  if(nv >= 2 && res.decisao!=='recuar'){
    const crit = rCriteriosNivel(ctx, motor);
    const rdP = setup.raceDate ? new Date(setup.raceDate+'T12:00:00').getTime() : null;
    const pertoDaProva = rdP && rdP > res.sem && rdP - res.sem < 5*7*DIA_MS;
    if(crit && crit.todos && !pertoDaProva && (res.sem - (motor.nivelDesde||0)) >= 3*7*DIA_MS){ motor.nivel++; motor.nivelDesde = res.sem+7*DIA_MS; motor.q = Math.max(0, motor.q-2); res.mudou = (res.mudou?res.mudou+'; ':'') + `nível ${RN_NOME[motor.nivel]}`; }
  }
  return res;
}
function rEstagioTxt(i){ const e = RUN_EST[i]; return !e ? '' : e.rep ? `${e.rep}× (${e.corre} min correndo + ${e.anda} min caminhando)` : `${e.cam} min de caminhada ativa`; }
// critérios para subir de nível (também usados pelo Meta Assistente para explicar "quando avançar")
function rCriteriosNivel(ctx, motor){
  const nv = motor.nivel; const p = rPerfil(ctx); const ref = rReferencia(ctx);
  const runs8 = rCorridas(ctx).filter(r=>r.at >= ctx.agora - 56*DIA_MS);
  const longo = runs8.filter(rContinua).reduce((m,r)=>Math.max(m,+r.duration||0),0);
  const cumpr = rCumprimento(ctx, motor, 4);
  const sem3 = p.semanas.slice(0,4).filter(w=>w.n>=3).length;
  const C = [];
  if(nv === 0){ C.push({ok: motor.estagio>=RUN_EST.length-1, txt:`chegar ao último estágio (${rEstagioTxt(RUN_EST.length-1)})`}); C.push({ok:false, txt:'completar 2 treinos desse estágio com esforço até 7/10'}); }
  else if(nv === 1){ C.push({ok:(motor.contMin||0)>=30, txt:`corrida contínua prescrita de 30 min (hoje: ${motor.contMin} min)`}); C.push({ok:p.contMin>=30, txt:`correr 30 min sem parar com esforço até 6/10 (seu maior: ${Math.round(p.contMin)} min)`}); C.push({ok:p.regular>=3, txt:`3 semanas com 2+ corridas (das últimas 6: ${p.regular})`}); }
  else if(nv === 2){ C.push({ok:(p.minSemana||0)>=150, txt:`média de 150 min/semana nas últimas 4 (hoje: ${Math.round(p.minSemana||0)})`}); C.push({ok:longo>=60, txt:`longão de 60 min (maior recente: ${Math.round(longo)} min)`}); C.push({ok:sem3>=3, txt:`3 semanas com 3+ corridas (últimas 4: ${sem3})`}); C.push({ok:cumpr==null||cumpr>=75, txt:`cumprir 75% do plano (últimas 4 semanas: ${cumpr==null?'—':cumpr+'%'})`}); }
  else if(nv === 3){ C.push({ok:(p.minSemana||0)>=210, txt:`média de 210 min/semana (hoje: ${Math.round(p.minSemana||0)})`}); C.push({ok:longo>=80, txt:`longão de 80 min (maior recente: ${Math.round(longo)} min)`}); C.push({ok:cumpr!=null&&cumpr>=80, txt:`cumprir 80% do plano (últimas 4 semanas: ${cumpr==null?'—':cumpr+'%'})`}); }
  else if(nv === 4){ C.push({ok:(p.minSemana||0)>=300, txt:`média de 300 min/semana (hoje: ${Math.round(p.minSemana||0)})`}); C.push({ok:longo>=95, txt:`longão de 95 min (maior recente: ${Math.round(longo)} min)`}); C.push({ok:!!(ref && ref.conf!=='baixa' && ref.vdot>=45), txt:'resultado de prova ou teste que mostre nível competitivo'}); C.push({ok:cumpr!=null&&cumpr>=85, txt:`cumprir 85% do plano (hoje: ${cumpr==null?'—':cumpr+'%'})`}); const g = rGoal((ctx.run||{}).setup); C.push({ok:!!RGOAL[g].km, txt:'ter uma prova (5 a 42 km) como objetivo'}); }
  else return { todos:false, lista:[], topo:true };
  if(nv === 0) C[1].ok = C[0].ok && rAtividades(ctx).filter(r=>r.tipoSessao==='camcorre' && r.estagio===RUN_EST.length-1 && r.concluiu!=='nao' && r.concluiu!=='parcial' && (+r.rpe||5)<=7).length >= 2;
  return { todos: C.every(c=>c.ok), lista:C };
}
function rCumprimento(ctx, motor, n){
  const hs = (motor.hist||[]).filter(h=>h.planejado>0 && h.decisao!=='retomada').slice(-n);
  if(!hs.length) return null;
  const pl = hs.reduce((t,h)=>t+h.planejado,0), fe = hs.reduce((t,h)=>t+Math.min(h.feitos,h.planejado),0);
  return pl ? Math.round(fe/pl*100) : null;
}

// ---------- biblioteca de sessões ----------
const RT = {
  caminhada:{nome:'Caminhada ativa', int:'Leve', zona:null, obj:'criar o hábito e preparar articulações para o impacto da corrida'},
  camcorre:{nome:'Caminhada + corrida', int:'Leve', zona:null, obj:'ensinar o corpo a correr aos poucos, com pausas planejadas'},
  regenerativo:{nome:'Regenerativo', int:'Muito leve', zona:'regenerativo', obj:'soltar a musculatura e acelerar a recuperação'},
  continua:{nome:'Corrida contínua', int:'Leve', zona:'leve', obj:'aumentar o tempo que você corre sem parar'},
  leve:{nome:'Corrida leve', int:'Leve', zona:'leve', obj:'base aeróbica: o coração e as pernas ficam mais eficientes'},
  longao:{nome:'Longão', int:'Leve', zona:'leve', obj:'resistência: aguentar mais tempo correndo'},
  fartlek:{nome:'Fartlek', int:'Moderado', zona:null, q:true, obj:'primeiro contato com ritmo mais forte, de forma solta'},
  subida:{nome:'Treino de subida', int:'Forte', zona:null, q:true, obj:'força nas pernas e potência, com menos impacto que tiros no plano'},
  tempo:{nome:'Treino de ritmo (tempo run)', int:'Moderado a forte', zona:'limiar', q:true, obj:'sustentar um ritmo firme por mais tempo'},
  limiar:{nome:'Treino de limiar', int:'Forte', zona:'limiar', q:true, obj:'subir o limiar: o ritmo que você aguenta sem "estourar"'},
  tiros_longos:{nome:'Tiros longos', int:'Forte', zona:'intervalado', q:true, obj:'capacidade aeróbica máxima (VO2máx)'},
  tiros_curtos:{nome:'Tiros curtos', int:'Muito forte', zona:'intervalado', q:true, obj:'velocidade sustentada e economia de corrida'},
  velocidade:{nome:'Treino de velocidade', int:'Muito forte', zona:'velocidade', q:true, obj:'técnica e velocidade, com passada solta'},
  ritmo_prova:{nome:'Ritmo de prova', int:'Moderado a forte', zona:null, q:true, obj:'acostumar o corpo ao ritmo exato da prova'},
  prova:{nome:'Dia da prova', int:'Prova', zona:null, obj:'aplicar tudo o que você treinou'}
};
const RT_NIVEL_MIN = { caminhada:0, camcorre:0, regenerativo:1, continua:1, leve:1, longao:1, fartlek:2, subida:2, tempo:2, limiar:3, tiros_longos:3, velocidade:3, tiros_curtos:4, ritmo_prova:2, prova:0 };
const RT_IMPACTO = ['subida','velocidade','tiros_curtos'];
function _alvo(Z, k, fallback){
  if(Z && Z[k]) return `${rFaixa(Z[k])} · esforço ${RZ_INFO[k].rpe}/10`;
  const i = RZ_INFO[k]; return fallback || (i ? `esforço ${i.rpe}/10 — ${i.txt.toLowerCase()}` : '');
}
function _ritmoProva(Z, goal){ if(!Z) return null; return goal==='42km' ? Z.maratona : goal==='21km' ? Z.meia : goal==='10km' ? Z.p10 : Z.p5; }
function rSessao(tipo, o){
  // o: {min, nv, q, terreno, Z, est, goal, lim, strides, contMin, raceKm}
  const T = RT[tipo]; const Z = o.Z; const q = _clamp(o.q||0, 0, 5); const ter = o.terreno || 'asfalto';
  const pista = ter==='pista', esteira = ter==='esteira', trilha = ter==='trilha';
  let warm, main = [], cool, alvo = '', orient = [], kmMain = null;
  const warmLeve = n => ({name:'Aquecimento', exs:[{name:'Caminhada rápida', desc:'Comece andando e aumente o passo aos poucos.', min:n||5}, {name:'Mobilidade', desc:'10 círculos de tornozelo, 10 elevações de joelho e 10 balanços de perna para cada lado.', min:2}]});
  const warmQual = ()=>({name:'Aquecimento', exs:[{name:'Trote leve', desc:'Bem devagar no começo, soltando aos poucos.', min:o.nv>=4?15:10}, {name:'Educativos e acelerações', desc:'Skipping baixo, anfersen e dribling (20 m cada) e 4 acelerações progressivas de 20 s, voltando caminhando.', min:5}]});
  const coolLeve = ()=>({name:'Desaquecimento', exs:[{name:'Caminhada', desc:'Desacelere andando até a respiração normalizar.', min:5}]});
  const coolQual = ()=>({name:'Desaquecimento', exs:[{name:'Trote bem leve', desc:'Deixe o coração baixar aos poucos.', min:8}, {name:'Alongamento leve', desc:'Panturrilha, posterior de coxa, quadríceps e quadril: 30 s de cada lado, sem forçar.', min:4}]});
  const repTxt = (n, x)=>`${n}× ${x}`;
  if(tipo==='caminhada'){
    const m = Math.round(o.min||25);
    warm = {name:'Aquecimento', exs:[{name:'Caminhada leve', desc:'Ritmo natural, soltando o corpo.', min:5}]};
    main = [{name:`${m} min de caminhada em ritmo firme`, desc:'Passo rápido, braços acompanhando. Dá para conversar, mas a respiração fica mais acelerada.', min:m}];
    cool = {name:'Desaquecimento', exs:[{name:'Caminhada leve + alongamento', desc:'Diminua o passo e alongue panturrilha e coxas por 30 s.', min:4}]};
    alvo = 'caminhada firme · esforço 3–4/10';
    orient = ['O objetivo é constância: complete o tempo sem pressa.', 'Tênis confortável e superfície regular ajudam muito no começo.'];
  } else if(tipo==='camcorre'){
    const e = RUN_EST[_clamp(o.est||1,1,RUN_EST.length-1)];
    const curto = o.maxTotal && (e.rep*(e.corre+e.anda) + 12) > o.maxTotal;
    warm = curto ? {name:'Aquecimento', exs:[{name:'Caminhada rápida + mobilidade', desc:'Ande aumentando o passo e solte tornozelos e quadris.', min:3}]} : warmLeve(5);
    main = [{name:repTxt(e.rep, `(${e.corre} min correndo leve + ${e.anda} min caminhando)`), desc:`Corra devagar — tão devagar que daria para conversar. Se faltar ar, diminua a velocidade antes de parar. A caminhada faz parte do treino: mantenha o passo firme.`, min:e.rep*(e.corre+e.anda)}];
    cool = curto ? {name:'Desaquecimento', exs:[{name:'Caminhada', desc:'Desacelere andando.', min:3}]} : coolLeve();
    alvo = 'corrida em ritmo de conversa · esforço até 6/10';
    orient = ['Se não conseguir completar um bloco, caminhe e retome no próximo — registre como "quase todo".', 'Avança de estágio só depois de 2 treinos completos com esforço até 7/10.'];
  } else if(tipo==='regenerativo'){
    const m = Math.round(o.min||20);
    warm = {name:'Aquecimento', exs:[{name:'Caminhada', desc:'Solte o corpo andando.', min:3}]};
    main = [{name:`${m} min de trote muito leve`, desc:'Mais devagar que o seu leve. Serve para soltar, não para treinar — se estiver cansado, pode ser caminhada.', min:m}];
    cool = coolLeve(); alvo = _alvo(Z,'regenerativo');
    orient = ['Se terminar mais cansado do que começou, foi rápido demais.'];
    kmMain = Z ? m/((Z.regenerativo.a+Z.regenerativo.b)/2) : null;
  } else if(tipo==='continua' || tipo==='leve' || tipo==='longao'){
    const m = Math.round(o.min||30);
    warm = warmLeve(tipo==='longao'?5:4);
    const dica = trilha ? 'Na trilha vá por esforço, não por ritmo; atenção a raízes e pedras.' : esteira ? 'Na esteira use 1% de inclinação para simular a rua.' : pista ? 'Na pista, troque o sentido a cada 15 min.' : 'Escolha um percurso plano e seguro.';
    if(tipo==='longao' && o.mp){
      const mpMin = Math.min(Math.round(m*0.45), [15,20,25,30,35,40][q]);
      const zp = _ritmoProva(Z, o.goal);
      main = [{name:`${m-mpMin} min de corrida leve`, desc:`Comece mais devagar do que parece necessário. ${dica}`, min:m-mpMin},
        {name:`${mpMin} min no ritmo da prova`, desc:`Termine o longão no ritmo planejado para a prova${zp?` (${rFaixa(zp)})`:''}, sem acelerar além dele.`, min:mpMin}];
      alvo = _alvo(Z,'leve') + (zp ? ` · final: ${rFaixa(zp)}` : '');
    } else {
      main = [{name: tipo==='continua' ? `${m} min correndo sem parar` : `${m} min de corrida ${tipo==='longao'?'leve contínua':'leve'}`, desc:`Ritmo de conversa: você fala frases inteiras sem perder o fôlego. ${dica}`, min:m}];
      alvo = _alvo(Z,'leve','esforço 3–4/10 — ritmo de conversa');
    }
    if(o.strides) main.push({name:'4–6 acelerações de 20 s', desc:'No fim, acelere até uns 85% da velocidade, solto e sem tensionar; volte caminhando 40 s entre elas.', min:4});
    cool = coolLeve();
    kmMain = Z ? m/((Z.leve.a+Z.leve.b)/2) : null;
    orient = tipo==='longao'
      ? ['Hidrate-se a cada 20–25 min em treinos acima de 1 hora.', 'O longão é sobre tempo em movimento, não velocidade.']
      : tipo==='continua' ? ['Se precisar caminhar, tudo bem — registre "precisei caminhar" para o plano ajustar.'] : ['A maior parte da evolução vem de treinos leves feitos com regularidade.'];
  } else if(tipo==='fartlek'){
    const n = [5,6,7,8,9,10][q]; const forte = o.nv>=3 ? 2 : 1;
    warm = warmQual(); cool = coolQual();
    main = [{name:repTxt(n, `(${forte} min forte + 2 min leve)`), desc:'O "forte" é esforço 7/10 — firme, mas controlado. O leve é trote de recuperação, sem parar.', min:n*(forte+2)}];
    alvo = 'forte: esforço 7/10 · leve: 3/10';
    orient = ['Não precisa de ritmo exato: vá pela sensação.'];
  } else if(tipo==='subida'){
    const n = [5,6,7,8,9,10][q];
    warm = warmQual(); cool = coolQual();
    main = [{name:repTxt(n, esteira ? '45 s com 5–6% de inclinação, forte' : '45 s subindo forte'), desc: esteira ? 'Suba a inclinação e mantenha a velocidade; entre os tiros, volte para 1% e trote 90 s.' : 'Ladeira moderada (não íngreme). Suba com passada curta e braços ativos; volte descendo trotando devagar.', min:Math.round(n*2.2)}];
    alvo = 'subidas: esforço 8/10 · descida: trote leve';
    orient = ['Descer devagar protege joelhos e canelas.'];
  } else if(tipo==='tempo'){
    warm = warmQual(); cool = coolQual();
    if(o.nv <= 2){ const opts = [[2,6],[2,8],[3,7],[2,10],[1,15],[1,18]][q];
      main = [{name: opts[0]>1 ? repTxt(opts[0], `${opts[1]} min em ritmo firme (2 min trote entre)`) : `${opts[1]} min contínuos em ritmo firme`, desc:'Ritmo "confortavelmente difícil": você fala só palavras soltas. Não é tiro.', min:opts[0]*opts[1] + (opts[0]-1)*2}];
    } else { const m = [15,18,20,22,25,30][q]; main = [{name:`${m} min contínuos em ritmo de limiar`, desc:'Ritmo constante do início ao fim. Se o fim ficar muito difícil, você começou rápido demais.', min:m}]; }
    alvo = _alvo(Z,'limiar'); kmMain = Z ? main[0].min/((Z.limiar.a+Z.limiar.b)/2) : null;
    orient = trilha ? ['Na trilha, mantenha o ESFORÇO constante — o ritmo varia com o terreno.'] : ['Use um percurso plano ou a esteira para manter o ritmo estável.'];
  } else if(tipo==='limiar'){
    const [n, m] = [[3,6],[4,6],[3,8],[4,8],[5,8],[4,10]][q];
    warm = warmQual(); cool = coolQual();
    main = [{name:repTxt(n, `${m} min em ritmo de limiar (1 min de trote entre)`), desc:'Todos os blocos no mesmo ritmo. Recuperação curta de propósito.', min:n*m + (n-1)}];
    alvo = _alvo(Z,'limiar'); kmMain = Z ? n*m/((Z.limiar.a+Z.limiar.b)/2) : null;
    orient = ['Se o último bloco sair muito mais lento, reduza um bloco na próxima vez.'];
  } else if(tipo==='tiros_longos'){
    warm = warmQual(); cool = coolQual();
    if(pista && Z){ const [n, mt] = [[4,1000],[5,1000],[4,1200],[6,1000],[5,1200],[4,1600]][q]; const p = (Z.intervalado.a+Z.intervalado.b)/2; const tt = mt/1000*p;
      main = [{name:repTxt(n, `${mt} m (recuperação: ${rFmtMin(tt*0.8)} trotando)`), desc:`Cada tiro em ${rFmtMin(mt/1000*Z.intervalado.a)}–${rFmtMin(mt/1000*Z.intervalado.b)}.`, min:Math.round(n*tt*1.8)}]; kmMain = n*mt/1000;
    } else { const [n, m] = [[4,3],[5,3],[4,4],[6,3],[5,4],[4,5]][q];
      main = [{name:repTxt(n, `${m} min forte (${m} min de trote entre)`), desc: trilha ? 'Por esforço (8/10): o terreno muda muito o ritmo.' : 'Escolha um trecho plano e sem cruzamentos.', min:n*m*2}]; kmMain = Z ? n*m/((Z.intervalado.a+Z.intervalado.b)/2) : null; }
    alvo = _alvo(Z,'intervalado');
    orient = ['Os tiros têm que sair parecidos: o último não pode ser bem mais lento que o primeiro.'];
  } else if(tipo==='tiros_curtos'){
    warm = warmQual(); cool = coolQual();
    if(pista && Z){ const [n, mt] = [[8,400],[10,400],[12,400],[8,500],[10,500],[12,500]][q]; const p = (Z.intervalado.a*0.97);
      main = [{name:repTxt(n, `${mt} m (90 s trotando entre)`), desc:`Cada tiro em ~${rFmtMin(mt/1000*p)}.`, min:Math.round(n*(mt/1000*p + 1.5))}]; kmMain = n*mt/1000;
    } else { const n = [8,10,12,8,10,12][q], s = q>=3 ? 120 : 90;
      main = [{name:repTxt(n, `${s===120?'2 min':'1 min 30 s'} rápido (1 min 30 s de trote entre)`), desc:'Rápido e controlado (esforço 8–9/10). Pare a série se a técnica desmontar.', min:Math.round(n*(s/60+1.5))}]; kmMain = null; }
    alvo = _alvo(Z,'intervalado');
    orient = ['Tiro curto exige aquecimento completo — não pule.'];
  } else if(tipo==='velocidade'){
    warm = warmQual(); cool = coolQual();
    if(pista && Z){ const [n, mt] = [[6,200],[8,200],[10,200],[6,300],[8,300],[10,300]][q];
      main = [{name:repTxt(n, `${mt} m rápidos (${mt} m caminhando/trotando entre)`), desc:`Cada um em ~${rFmtMin(mt/1000*Z.velocidade.a)}. Passada solta, sem travar.`, min:Math.round(n*(mt/1000*Z.velocidade.a + 1.6))}]; kmMain = n*mt*2/1000;
    } else { const n = [6,8,10,6,8,10][q], s = q>=3 ? 45 : 30;
      main = [{name:repTxt(n, `${s} s rápidos (recuperação completa caminhando)`), desc:'Rápido, mas relaxado: ombros soltos, passada leve.', min:Math.round(n*(s/60+1.5))}]; }
    alvo = _alvo(Z,'velocidade');
    orient = ['Recuperação completa entre os tiros: a qualidade importa mais que o cansaço.'];
  } else if(tipo==='ritmo_prova'){
    warm = warmQual(); cool = coolQual(); const zp = _ritmoProva(Z, o.goal);
    if(o.taper){ main = [{name:'4× 2 min no ritmo da prova (2 min de trote entre)', desc:'Só para lembrar o corpo do ritmo. Termine com sensação de "podia mais".', min:14}]; }
    else if(o.goal==='21km' || o.goal==='42km'){ const [n, m] = [[2,10],[3,10],[2,15],[3,12],[2,20],[3,15]][q];
      main = [{name:repTxt(n, `${m} min no ritmo da prova (3 min de trote entre)`), desc:'Ritmo constante, o mesmo que você pretende sustentar na prova.', min:n*m + (n-1)*3}];
    } else if(o.nv <= 2){ const n = [4,5,6,6,7,8][q];
      main = [{name:repTxt(n, '2 min no ritmo que você quer na prova (2 min leve entre)'), desc:'Use para descobrir e treinar o seu ritmo de prova.', min:n*4}];
    } else { const [n, km] = [[3,1],[4,1],[3,2],[5,1],[4,2],[3,3]][q];
      main = [{name:repTxt(n, `${km} km no ritmo da prova (90 s de trote entre)`), desc:'Cada bloco no ritmo-alvo, sem acelerar no fim.', min:Math.round(n*km*(zp?(zp.a+zp.b)/2:6) + (n-1)*1.5)}]; kmMain = n*km; }
    alvo = zp ? `${rFaixa(zp)} (ritmo de prova estimado)` : 'ritmo que você pretende manter na prova';
    orient = zp ? ['O ritmo de prova é uma estimativa a partir dos seus dados — ajuste pela sensação.'] : ['Sem dados suficientes para um ritmo exato: vá pelo esforço que conseguiria sustentar na prova.'];
  } else if(tipo==='prova'){
    const km = o.raceKm || 5; const zp = _ritmoProva(Z, o.goal);
    warm = {name:'Aquecimento', exs:[{name:'Trote leve + 3 acelerações curtas', desc:'10–15 min antes da largada.', min:12}]};
    main = [{name:`Prova: ${mtFmtKm(km)} km`, desc: zp ? `Largue no ritmo-alvo (${rFaixa(zp)}), não mais rápido. Se sobrar energia, acelere na segunda metade.` : 'Largue mais devagar do que parece necessário; acelere só se sobrar energia na segunda metade.', min: Math.round(zp ? km*(zp.a+zp.b)/2 : km*6.5)}];
    cool = {name:'Depois da prova', exs:[{name:'Caminhada + hidratação', desc:'Caminhe 10 min, hidrate-se e coma algo em até 1 hora.', min:10}]};
    alvo = zp ? `${rFaixa(zp)} (estimativa)` : 'pelo esforço';
    orient = ['Nada de novo no dia da prova: tênis, roupa e café da manhã já testados.', 'Intercalar caminhada não é fracasso — é estratégia.'];
  }
  if(o.lim && (tipo!=='caminhada')) orient.push('Com a limitação que você informou: se a dor aparecer e mudar sua passada, pare e caminhe. Dor que persiste precisa de avaliação profissional.');
  const blocks = [warm, {name:'Principal', exs:main}, cool];
  const duration = blocks.reduce((s,b)=>s+b.exs.reduce((x,e)=>x+(e.min||0),0),0);
  let km = null;
  if(kmMain != null && Z){ const kmAq = (warm.exs.reduce((s,e)=>s+(/Trote/.test(e.name)?e.min:0),0) + cool.exs.reduce((s,e)=>s+(/Trote/.test(e.name)?e.min:0),0)) / ((Z.leve.a+Z.leve.b)/2); km = kmMain + kmAq; }
  return { tipo, blocks, duration, km, int:T.int, objetivo:T.obj, alvo, orient };
}

// ---------- semana ----------
function rSemanaFase(ctx, M, semTs){
  if(M.retomada && !M.retomada.cancelada){
    const k = Math.round((semTs - M.retomada.inicio)/(7*DIA_MS));
    if(k >= 0 && k < M.retomada.N) return { fase:'retomada', k:k+1, N:M.retomada.N, fator:RET_FAT[M.retomada.N-1][k], pausa:M.retomada.pausa };
  }
  const f = rFase(ctx, M, semTs);
  const semanaDoPlano = Math.max(1, Math.round((semTs - (M.inicio||semTs))/(7*DIA_MS))+1);
  if(M.nivel >= 2 && ['base','desenvolvimento','especifica'].includes(f.fase) && semanaDoPlano >= 4 && semanaDoPlano % 4 === 0 && !(f.W!=null && f.W <= 3)) return Object.assign({}, f, { fase:'recuperacao', faseBase:f.fase });
  return f;
}
function rComposicao(ctx, M, F, n, opts){
  const setup = (ctx.run||{}).setup||{}; const goal = rGoal(setup); const nv = M.nivel;
  const lim = ((setup.aval||{}).lim||[]).length > 0;
  const ter = setup.terrain || 'asfalto';
  const hib = !!(ctx.lift && ctx.lift.plan && (ctx.lift.plan.workouts||[]).length >= 3);
  if(nv === 0){
    const base = M.estagio === 0 ? 'caminhada' : 'camcorre';
    return Array.from({length:n}, (_,i)=> i < 3 ? base : 'caminhada');
  }
  if(nv === 1){
    const L = [];
    const semLongo = ['retomada','pos_prova'].includes(F.fase);
    if(n === 1) return ['continua'];
    L.push(semLongo ? 'continua' : 'longao');
    for(let i=1;i<n;i++) L.push(i <= 2 ? 'continua' : (i===3 ? 'regenerativo' : 'caminhada'));
    return L;
  }
  // nível 2+
  let Q = 0;
  const fase = F.fase;
  if(fase==='adaptacao' || fase==='retomada' || fase==='pos_prova') Q = 0;
  else if(fase==='taper') Q = (F.W===0 ? 0 : 1);
  else if(fase==='recuperacao') Q = nv >= 4 ? 1 : 0;
  else if(fase==='base') Q = nv >= 4 && n >= 5 ? 2 : 1;
  else Q = nv === 2 ? 1 : (nv === 3 ? (n >= 4 ? 2 : 1) : 2);
  if(n <= 2) Q = Math.min(Q, nv >= 3 ? 1 : 0);
  if(n === 3 && nv <= 3) Q = Math.min(Q, 1);
  if(hib && nv <= 3) Q = Math.min(Q, 1);
  if(lim) Q = Math.min(Q, 1);
  if(opts && opts.fadiga) Q = 0;
  // tipos de qualidade por fase / nível / objetivo (o rodízio semanal evita repetir sempre o mesmo)
  const listas = {
    base: nv===2 ? ['fartlek','subida'] : nv===3 ? ['subida','fartlek','tempo'] : ['subida','tempo','fartlek'],
    desenvolvimento: nv===2 ? ['fartlek','tempo','subida'] : nv===3 ? ['limiar','tiros_longos','tempo','velocidade'] : ['limiar','tiros_longos','tiros_curtos','tempo','velocidade'],
    especifica: nv===2 ? ['ritmo_prova','fartlek','tempo'] : ({ '5km':['tiros_curtos','tiros_longos','tempo','ritmo_prova'], '10km':['tiros_longos','limiar','ritmo_prova','tempo'], '21km':['limiar','ritmo_prova','tempo','tiros_longos'], '42km':['limiar','ritmo_prova','tempo'] })[goal] || ['limiar','tiros_longos','tempo'],
    taper:['ritmo_prova'], recuperacao:['fartlek']
  };
  let lista = (listas[fase] || listas.base).filter(t=>RT_NIVEL_MIN[t] <= nv && !(lim && RT_IMPACTO.includes(t)) && !(t==='subida' && ter==='pista'));
  if(!lista.length) lista = ['fartlek'];
  const rot = Math.round((M.semanaRef||0)/(7*DIA_MS)) % lista.length;
  lista = lista.slice(rot).concat(lista.slice(0, rot));
  const quals = []; for(let i=0;i<Q && i<lista.length;i++) quals.push(lista[i]);
  const L = [];
  if(n >= 2 || nv >= 3) L.push(fase==='taper' && F.W===0 ? 'leve' : 'longao');
  quals.forEach(t=>L.push(t));
  while(L.length < n) L.push(n >= 5 && nv <= 4 && !L.includes('regenerativo') && L.length === n-1 ? 'regenerativo' : 'leve');
  return L.slice(0, n);
}
function rAtribuirDias(tipos, dias, pernas, nota){
  // dias ordenados; pernas = dias com treino de pernas na musculação
  const livres = dias.slice();
  const out = {};
  const pen = d => (pernas.includes(d-1) || (d===1 && pernas.includes(7)) ? 3 : 0) + (pernas.includes(d) ? 2 : 0);
  const pega = (tipo, score)=>{ let best = null, bs = -1e9; livres.forEach(d=>{ const s = score(d); if(s > bs){ bs = s; best = d; } }); if(best==null) return null; livres.splice(livres.indexOf(best),1); out[best] = tipo; return best; };
  const iLongo = tipos.indexOf('longao');
  let dLongo = null;
  if(iLongo >= 0) dLongo = pega('longao', d=> (d>=6?3:0) + (d===dias[dias.length-1]?1:0) - pen(d)*1.5);
  const ocupados = ()=>Object.keys(out).map(Number);
  tipos.forEach((t,i)=>{ if(i===iLongo || !RT[t].q) return;
    pega(t, d=>{ const dist = Math.min(...ocupados().map(o=>Math.min(Math.abs(o-d), 7-Math.abs(o-d))), 7); return dist*2 - pen(d)*2 - (dist<=1?4:0); }); });
  tipos.forEach((t,i)=>{ if(i===iLongo || RT[t].q) return;
    if(t==='regenerativo' && dLongo){ const prox = dLongo===7 ? 1 : dLongo+1; if(livres.includes(prox)){ livres.splice(livres.indexOf(prox),1); out[prox] = t; return; } }
    pega(t, d=>-Math.abs(d-4)*0.1); });
  // Beta 34: dois treinos fortes em dias seguidos (qualidade colada no longão ou em outra qualidade, o que
  // acontece quando o aluno só tem dias seguidos): o segundo vira corrida leve, com aviso
  const forte = t => t==='longao' || (RT[t] && RT[t].q);
  Object.keys(out).map(Number).sort((a,b)=>a-b).forEach(d=>{
    const t = out[d]; if(!(RT[t] && RT[t].q)) return;
    const viz = [d-1, d+1].filter(x=>out[x] && forte(out[x]));
    if(viz.length){ nota[d] = `${RT[t].nome} virou corrida leve: com ${out[viz[0]]==='longao'?'o longão':'outro treino forte'} no dia ${viz[0]<d?'anterior':'seguinte'}, dois esforços seguidos aumentam o risco de lesão.`; out[d] = 'leve'; }
  });
  // conflito inevitável com pernas: troca a qualidade de impacto por leve e avisa
  Object.keys(out).forEach(k=>{ const d = +k; const t = out[d];
    if(RT[t].q && pen(d) >= 3){ nota[d] = `Ontem tem treino de pernas na musculação: ${RT[t].nome.toLowerCase()} virou corrida leve para não somar cansaço nas pernas.`; out[d] = 'leve'; }
    else if(RT[t].q && pen(d) >= 2){ nota[d] = 'Hoje também tem pernas na musculação: faça a corrida antes ou com pelo menos 6 horas de intervalo.'; }
    else if(t==='longao' && pen(d) >= 3){ nota[d] = 'Ontem foi dia de pernas: comece o longão bem leve e encurte se as pernas estiverem pesadas.'; } });
  return out;
}
function rMontarSemana(ctx, M, semTs, opts){
  opts = opts || {};
  const setup = (ctx.run||{}).setup||{}; const goal = rGoal(setup); const nv = M.nivel;
  const ref = rReferencia(ctx); const Z = (nv >= 2 && ref) ? ref.zonas : null;   // iniciantes treinam por esforço e tempo
  const tempos = rTempos(setup);
  const F = rSemanaFase(ctx, M, semTs);
  let dias = (setup.selectedDays && setup.selectedDays.length) ? setup.selectedDays.slice() : ({2:[3,6],3:[2,4,6],4:[1,3,5,7],5:[1,2,4,5,7],6:[1,2,3,4,5,6]}[setup.days] || [2,4,6]);
  // Beta 34: na semana com menos tempo, nenhum treino fica mais longo que o mesmo tipo de treino na semana normal
  // (os dias que sobram não compensam os que saíram)
  let tetoTipo = null;
  if(M.especial && M.especial.sem === semTs && (M.especial.dias||[]).length){
    dias = M.especial.dias.slice();
    try{ const S0 = rMontarSemana(ctx, Object.assign({}, M, { especial:null }), semTs, opts); tetoTipo = {};
      S0.workouts.forEach(w=>{ const t = w.motor && w.motor.tipo; const mn = (w.blocks && w.blocks[1]) ? w.blocks[1].exs.reduce((x,e)=>x+(e.min||0),0) : 0; if(t){ tetoTipo[t] = Math.max(tetoTipo[t]||0, mn); tetoTipo['dur_'+t] = Math.max(tetoTipo['dur_'+t]||0, +w.duration||0); } }); }catch(e){ tetoTipo = null; }
  }
  const teto = (t, v)=> (tetoTipo && tetoTipo[t]) ? Math.min(v, tetoTipo[t]) : v;
  dias.sort((a,b)=>a-b);
  // semana da prova
  const rd = setup.raceDate ? new Date(setup.raceDate+'T12:00:00') : null;
  let diaProva = null;
  if(rd && rSem(rd.getTime()) === semTs){ diaProva = rd.getDay()===0 ? 7 : rd.getDay(); dias = dias.filter(d=>d < diaProva-1 || d===diaProva); if(!dias.includes(diaProva)) dias.push(diaProva); dias.sort((a,b)=>a-b); }
  const diasTreino = diaProva ? dias.filter(d=>d!==diaProva) : dias;
  const tipos = rComposicao(ctx, M, F, diasTreino.length, opts);
  const nota = {};
  const mapa = rAtribuirDias(tipos, diasTreino, rDiasPerna(ctx), nota);
  if(diaProva) mapa[diaProva] = 'prova';
  // volume da semana
  let V = M.vol || 90;
  // o volume nunca passa do que cabe na agenda (tempo por treino × dias)
  const capAgenda = Object.keys(mapa).reduce((t,k)=>{ const ty = mapa[k]; return t + (ty==='longao' ? Math.min(RUN_LONGO_CAP[goal][nv], tempos.longo-12) : ty==='regenerativo' ? 40 : RT[ty].q ? 30 : ty==='prova' ? 0 : tempos.sessao-11); }, 0);
  V = Math.min(V, Math.max(60, capAgenda));
  // semanas mais leves partem do volume REAL planejado nas últimas semanas normais (não da meta teórica)
  const normais = Object.keys(M.semanas||{}).map(Number).filter(k=>k < semTs && k >= semTs - 6*7*DIA_MS && ['base','desenvolvimento','especifica'].includes((M.semanas[k]||{}).fase)).map(k=>M.semanas[k].vol||0).filter(v=>v>0);
  if(normais.length && ['recuperacao','taper','pos_prova'].includes(F.fase)) V = Math.min(V, Math.max(...normais));
  if(F.fase==='retomada') V = Math.min(M.retomada.volBase||V, Math.max(60, capAgenda)) * F.fator;
  else if(F.fase==='recuperacao') V *= 0.7;
  else if(F.fase==='taper') V *= ({1:[0.6], 2:[0.5,0.75], 3:[0.45,0.65,0.8]})[F.tap][F.W];
  else if(F.fase==='pos_prova') V *= [0.4,0.6,0.8][F.k-1] || 0.6;
  if(opts.fadiga) V *= 0.85;
  const lim = ((setup.aval||{}).lim||[]).length > 0;
  const q = F.fase==='recuperacao' || F.fase==='taper' ? 0 : M.q;
  const longCap = Math.min(RUN_LONGO_CAP[goal][nv], tempos.longo - 12);
  const share = (({2:0.45, 3:0.4, 4:0.34, 5:0.3, 6:0.27})[diasTreino.length] || 0.35) + (goal==='42km' ? 0.08 : goal==='21km' ? 0.05 : 0);
  const sess = {};
  // primeiro as fixas (qualidade, prova, iniciante), depois longão e leves com o que sobra
  let usado = 0;
  const base = { nv, q, terreno: setup.terrain, Z, est: M.estagio, goal, lim, raceKm: (RGOAL[goal]||{}).km };
  Object.keys(mapa).forEach(k=>{ const t = mapa[k];
    if(RT[t].q || t==='prova' || t==='camcorre'){
      let o = Object.assign({}, base, { taper: F.fase==='taper', maxTotal: tempos.sessao });
      let s = rSessao(t, o);
      while(RT[t].q && s.duration > tempos.sessao + 2 && o.q > 0){ o = Object.assign({}, o, { q:o.q-1 }); s = rSessao(t, o); }   // cabe no tempo disponível
      sess[k] = s; usado += s.blocks[1].exs.reduce((x,e)=>x+e.min,0); } });
  if(nv === 0){
    Object.keys(mapa).forEach(k=>{ if(mapa[k]==='caminhada') sess[k] = rSessao('caminhada', Object.assign({}, base, { min: Math.min(tempos.sessao-9, M.estagio===0 ? 25 : 30) })); });
  } else if(nv === 1){
    let c = M.contMin || 10; if(F.fase==='retomada') c = Math.max(Math.min(c, 15), _r5(c*Math.max(F.fator, 0.6))); if(opts.fadiga) c = Math.max(10, c-3);
    c = Math.min(c, tempos.sessao - 11);
    Object.keys(mapa).forEach(k=>{ const t = mapa[k];
      const min = t==='longao' ? Math.min(longCap, c + (c < 20 ? 5 : 10)) : t==='regenerativo' ? Math.max(12, Math.round(c*0.6)) : t==='caminhada' ? 30 : c;
      sess[k] = rSessao(t, Object.assign({}, base, { min })); });
  } else {
    const kLongo = Object.keys(mapa).find(k=>mapa[k]==='longao');
    let longo = 0;
    if(kLongo){ longo = teto('longao', _clamp(Math.round(V*share), 30, longCap)); if(opts.fadiga) longo = Math.round(longo*0.85);
      const mp = nv >= 3 && (goal==='42km' || goal==='21km') && F.fase==='especifica' && !opts.fadiga;
      sess[kLongo] = rSessao('longao', Object.assign({}, base, { min: longo, mp })); usado += longo; }
    const leves = Object.keys(mapa).filter(k=>mapa[k]==='leve' || mapa[k]==='regenerativo');
    const pesos = leves.map(k=>mapa[k]==='regenerativo' ? 0.6 : 1); const somaP = pesos.reduce((a,b)=>a+b,0) || 1;
    const resto = Math.max(0, V - usado);
    leves.forEach((k,i)=>{ const t = mapa[k];
      let min = Math.round(resto * pesos[i]/somaP);
      min = t==='regenerativo' ? _clamp(min, 20, 40) : _clamp(min, nv>=4 ? 30 : 20, Math.min(tempos.sessao - 11, longo ? longo-5 : 90));
      if(tetoTipo) min = Math.min(min, Math.max(tetoTipo.leve||0, tetoTipo.regenerativo||0, 20));
      const strides = t==='leve' && nv >= 2 && i===0 && ['adaptacao','base','recuperacao'].includes(F.fase) && !lim && !opts.fadiga;
      sess[k] = rSessao(t, Object.assign({}, base, { min: Math.round(min), strides }));
      const tetoDur = tetoTipo ? Math.max(tetoTipo.dur_leve||0, tetoTipo.dur_regenerativo||0) : 0;
      if(tetoDur && sess[k].duration > tetoDur){ sess[k] = rSessao(t, Object.assign({}, base, { min: Math.max(20, Math.round(min - (sess[k].duration - tetoDur))), strides })); } });
  }
  // por que cada treino
  const pernas = rDiasPerna(ctx);
  const dLongo = Object.keys(mapa).map(Number).find(d=>mapa[d]==='longao');
  const ws = Object.keys(sess).map(Number).sort((a,b)=>a-b).map((d,i)=>{
    const s = sess[d]; const t = s.tipo;
    let porque = `${RT[t].obj.charAt(0).toUpperCase()+RT[t].obj.slice(1)}.`;
    if(F.fase==='retomada') porque = `Semana ${F.k} de ${F.N} da retomada (pausa de ${F.pausa} dias): só ritmo leve e cerca de ${Math.round(F.fator*100)}% do volume de antes. ` + porque;
    else if(opts.fadiga && (d >= (opts.aPartir||1))) porque = `Ajustado pelo cansaço registrado (${opts.fadiga}). ` + porque;
    else if(t==='longao') porque = 'O treino mais longo da semana. ' + porque;
    else if(t==='regenerativo' && dLongo && (d===dLongo+1 || (dLongo===7 && d===1))) porque = 'Dia seguinte ao longão: só para soltar. ' + porque;
    else if(RT[t].q) porque = `Treino de qualidade da fase de ${RFASE[F.fase==='recuperacao'?(F.faseBase||'base'):F.fase].nome.toLowerCase()}. ` + porque;
    if(F.fase==='recuperacao') porque += ' Semana de recuperação: menos volume para o corpo assimilar o treino.';
    if(F.fase==='taper') porque += ' Polimento: menos volume, mantendo um pouco de ritmo.';
    if(t==='camcorre') porque += ` Estágio ${M.estagio} de ${RUN_EST.length-1}.`;
    const nm = t==='camcorre' ? `Caminhada + corrida · estágio ${M.estagio}` : t==='prova' ? `🏁 Prova — ${RGOAL[goal].nome}` : RT[t].nome;
    const km = s.km ? Math.round(s.km*2)/2 : null;
    return { k:'S'+(i+1), name:nm, dayIdx:d, dayName:RUN_DIAS[d-1], duration:Math.round(s.duration), distance: km ? '~'+String(km).replace('.',',')+' km' : '', targetKm: km || undefined, targetPace: s.alvo, blocks:s.blocks,
      motor:{ tipo:t, int:s.int, objetivo:s.objetivo, alvo:s.alvo, orient:s.orient, fase:F.fase, porque, nota: nota[d] || '', estagio: t==='camcorre'||t==='caminhada' ? M.estagio : undefined, pernasHoje: pernas.includes(d) } };
  });
  const volPlan = ws.reduce((t,w)=>t + (w.blocks[1].exs.reduce((x,e)=>x+e.min,0)), 0);
  return { workouts: ws, info:{ fase:F.fase, F, planejado: ws.filter(w=>w.motor.tipo!=='prova').length, vol: Math.round(volPlan), V: Math.round(V), nivel:nv, ref: ref ? { vdot: Math.round(ref.vdot*10)/10, conf: ref.conf } : null } };
}

// ---------- cansaço registrado (vale para o resto da semana) ----------
function rFadiga(ctx){
  const rs = rCorridas(ctx).filter(r=>!r.isRace && r.at >= ctx.agora - 5*DIA_MS);
  if(!rs.length) return null;
  const u = rs[rs.length-1], pen = rs[rs.length-2];
  const leve = t => ['leve','continua','longao','regenerativo','camcorre'].includes(t);
  if(u.concluiu==='nao') return { motivo:'treino não completado', at:u.at };
  if((+u.rpe||0) >= 9 && !(RT[u.tipoSessao]||{}).q) return { motivo:`esforço ${u.rpe}/10 num treino leve`, at:u.at };
  if((+u.rpe||0) >= 10) return { motivo:'esforço máximo no último treino', at:u.at };
  if(leve(u.tipoSessao) && (+u.rpe||0) >= 8) return { motivo:`treino leve com esforço ${u.rpe}/10`, at:u.at };
  if(pen && (+u.rpe||0) >= 8 && (+pen.rpe||0) >= 8) return { motivo:'dois treinos seguidos com esforço 8+', at:u.at };
  return null;
}

// ---------- estatísticas que sobrevivem à limpeza de 90 dias ----------
const RUN_REC_D = [{k:'3', km:3, nome:'3 km'}, {k:'5', km:5, nome:'5 km'}, {k:'10', km:10, nome:'10 km'}, {k:'21', km:21.0975, nome:'21 km'}, {k:'42', km:42.195, nome:'42 km'}];
function rRecordesDe(lista){
  const out = {};
  RUN_REC_D.forEach(D=>{
    lista.filter(r=>_ehCorrida(r) && +r.distance >= D.km*0.995 && +r.distance <= D.km*1.06 && +r.duration > 0).forEach(r=>{
      const cur = out[D.k]; if(!cur || +r.duration < cur.min) out[D.k] = { min:+r.duration, at:r.at, km:+r.distance, prova:!!r.isRace };
    });
  });
  return out;
}
function runAtualizaStats(){
  try{
    const run = state.modules.run; if(!run) return;
    const S = state.corridaStats = state.corridaStats || { recordes:{}, semanas:{}, provas:[] };
    const hist = (run.history||[]).filter(r=>r && r.at);
    const maisAntigo = hist.length ? Math.min(...hist.map(r=>r.at)) : Date.now();
    // recordes: os do histórico atual + os guardados de registros que já saíram da janela de 90 dias
    const atuais = rRecordesDe(hist); const novo = {};
    RUN_REC_D.forEach(D=>{ const g = (S.recordes||{})[D.k]; const a = atuais[D.k];
      const gValido = g && g.at < maisAntigo;    // o registro original já foi limpo: o guardado é a única fonte
      const c = [a, gValido ? g : null].filter(Boolean).sort((x,y)=>x.min-y.min)[0]; if(c) novo[D.k] = c; });
    S.recordes = novo;
    // provas
    const provasHist = hist.filter(r=>r.isRace && _ehCorrida(r)).map(r=>({ at:r.at, km:+r.distance||0, min:+r.duration||0 }));
    S.provas = (S.provas||[]).filter(p=>p.at < maisAntigo).concat(provasHist).sort((a,b)=>a.at-b.at).slice(-40);
    // semanas (km, minutos, corridas, maior corrida contínua, caminhada e bike)
    const sem = S.semanas || {};
    const ini = rSem(maisAntigo);
    Object.keys(sem).forEach(k=>{ if(+k >= ini) delete sem[k]; });
    hist.forEach(r=>{ const k = rSem(r.at); const w = sem[k] = sem[k] || { km:0, min:0, n:0, cont:0, kmP:0, minP:0, cam:0, bike:0 };
      if(_ehCorrida(r)){ w.km += +r.distance||0; w.min += +r.duration||0; w.n++; if(rContinua(r)) w.cont = Math.max(w.cont, +r.duration||0); if(+r.distance>0){ w.kmP += +r.distance; w.minP += +r.duration||0; } }
      else if(r.activity==='caminhada') w.cam += +r.duration||0; else if(r.activity==='bike') w.bike += +r.duration||0; });
    Object.keys(sem).forEach(k=>{ const w = sem[k]; ['km','min','kmP','minP','cam','bike','cont'].forEach(f=>w[f] = Math.round((w[f]||0)*100)/100); });
    const chaves = Object.keys(sem).map(Number).sort((a,b)=>a-b); chaves.slice(0, Math.max(0, chaves.length-110)).forEach(k=>delete sem[k]);
    S.semanas = sem;
    // metas conquistadas (ficam guardadas para sempre)
    S.metas = S.metas || {};
    const corr = hist.filter(r=>_ehCorrida(r) && +r.duration>0).sort((a,b)=>a.at-b.at);
    RUN_METAS.forEach(mt=>{
      if(S.metas[mt.k] || mt.tipo==='t5') return;
      const ok = corr.find(r=>mt.tipo==='cont' ? (rContinua(r) && +r.duration >= mt.alvo) : (+r.distance >= mt.alvo*0.98));
      if(ok) S.metas[mt.k] = ok.at;
    });
    const r5 = S.recordes['5'];
    if(r5 && !S.metas.t5base) S.metas.t5base = { min:r5.min, at:r5.at };
    if(r5 && S.metas.t5base && r5.min <= S.metas.t5base.min*0.97 && !S.metas.t5) S.metas.t5 = r5.at;
  }catch(e){ console.log('corrida stats', e); }
}

// ---------- sincronização semanal ----------
let _rSyncAt = 0;
// refazer (Beta 34): remonta a semana atual mantendo os dias que já passaram (usado pela "semana com menos tempo")
function runSync(force, refazer){
  const run = state && state.modules && state.modules.run;
  if(!run || !run.plan || run.plan.type!=='run' || (run.setup||{}).logOnly) return false;
  if(!force && !refazer && Date.now() - _rSyncAt < 1500) return false;
  _rSyncAt = Date.now();
  const ctx = runCtx();
  let M = run.plan.motor, mudou = false, rebuild = !!force || !!refazer;
  const semanaJaMontada = !!(M && M.semanaRef);   // conferido antes de avançar as semanas (abaixo)
  const inicioPlano = (typeof planStartTs==='function' && planStartTs(run)) || run.createdAt || Date.now();
  if(!M){ M = run.plan.motor = rMotorNovo(ctx, run.setup||{}, inicioPlano); M.migrado = !(run.setup||{}).aval; mudou = rebuild = true; }
  const semAtual = rSem(Math.max(Date.now(), inicioPlano));
  const eraEstaSemana = semanaJaMontada && M.semanaRef === semAtual;   // Beta 34: semana nova não herda os dias da anterior
  // 1) avalia cada semana que terminou
  let guard = 0;
  while(M.semanaRef && M.semanaRef < semAtual && guard++ < 60){
    const a = M.semanaRef;
    const teveAtiv = rAtividades(ctx).some(r=>r.at>=a && r.at<a+7*DIA_MS);
    const pz = rPausa(ctx, M.nivel);
    if(!teveAtiv && pz && pz.ultimoAntes < a){ _rPush(M, { sem:a, planejado:(M.semanas[a]||{}).planejado||0, feitos:0, cump:0, decisao:'pausa', motivo:'semana sem treinos (pausa)', mudou:'' }); }
    else _rPush(M, rAplicarDecisao(ctx, M, rAvaliarSemana(ctx, M, a)));
    M.semanaRef += 7*DIA_MS; mudou = rebuild = true;
  }
  // 2) retomada: pausa de 7+ dias de corrida tem prioridade sobre tudo
  const pz = rPausa(ctx, M.nivel);
  const chave = pz ? pz.ultimoAntes : null;
  if(pz && pz.pausa >= 7 && (!M.retomada || M.retomada.chave !== chave)){
    const N = rRetomadaSemanas(pz.pausa);
    const inicio = pz.voltou ? rSem(pz.retorno) : semAtual;
    if(semAtual < inicio + N*7*DIA_MS){
      const antes = { nivel:M.nivel, estagio:M.estagio, contMin:M.contMin, vol:M.vol };
      // pausas longas: o nível desce (o corpo perde parte do condicionamento), mas ninguém volta a ser "iniciante absoluto"
      if(M.nivel >= 2 && pz.pausa >= 90){ M.nivel = Math.max(1, M.nivel - (pz.pausa >= 180 ? 2 : 1)); if(M.nivel===1) M.contMin = 20; }
      if(M.nivel >= 2 && pz.pausa >= 28) M.q = 0;
      else if(M.nivel === 1 && pz.pausa >= 60){ M.contMin = Math.max(10, _r5((M.contMin||15)*0.7)); }
      else if(M.nivel === 0 && M.estagio > 1){ M.estagio = Math.max(1, M.estagio - (pz.pausa >= 60 ? 3 : pz.pausa >= 28 ? 2 : 1)); }
      M.retomada = { chave, pausa:pz.pausa, N, inicio, volBase: antes.vol || M.vol, antes, voltou: pz.voltou };
      M.nivelDesde = inicio;
      mudou = rebuild = true;
    }
  } else if(!pz && !M.retomada && M.retomadaDecl && !M.retomadaDecl.aplicada){
    const N = rRetomadaSemanas(M.retomadaDecl.pausa);
    M.retomada = { chave:'decl', pausa:M.retomadaDecl.pausa, N, inicio:M.retomadaDecl.desde, volBase:M.vol, antes:{ nivel:M.nivel }, declarada:true };
    M.retomadaDecl.aplicada = true; mudou = rebuild = true;
  }
  if(M.retomada && !M.retomada.fim && semAtual >= M.retomada.inicio + M.retomada.N*7*DIA_MS){
    M.retomada.fim = true; M.vol = Math.round((M.retomada.volBase||M.vol) * 0.85); mudou = rebuild = true;
  }
  // a data da prova mudou (marcada, trocada ou removida): refaz a semana na hora
  const rk = ((run.setup||{}).raceDate||'') + '|' + ((run.setup||{}).raceTime||'');
  if(M.raceKey === undefined) M.raceKey = rk;
  else if(M.raceKey !== rk){ M.raceKey = rk; mudou = rebuild = true; }
  // 3) cansaço registrado nesta semana: o resto da semana fica leve
  const fad = rFadiga(ctx);
  const infoSem = M.semanas[semAtual] || {};
  const fadKey = fad ? fad.at : null;
  if(fad && infoSem.fadigaAt !== fadKey && rSem(fad.at) === semAtual){ rebuild = true; }
  // 4) monta a semana
  if(rebuild || M.semanaRef !== semAtual || !(run.plan.workouts||[]).length || !(run.plan.workouts[0]||{}).motor){
    const mesmaSemana = eraEstaSemana && (run.plan.workouts||[]).length && (run.plan.workouts[0]||{}).motor;
    const hoje = getDayIdx();
    const fadAtiva = fad && rSem(fad.at) === semAtual;
    const S = rMontarSemana(ctx, Object.assign(M, { semanaRef: semAtual }), semAtual, fadAtiva ? { fadiga: fad.motivo, aPartir: hoje+1 } : {});
    let ws = S.workouts;
    if(mesmaSemana && !force){
      // não reescreve o passado: dias que já passaram (ou registrados hoje) continuam como estavam
      const feitosHoje = (run.history||[]).some(h=>mtDia0(h.at)===mtDia0());
      const velhos = run.plan.workouts.filter(w=>w.dayIdx < hoje || (w.dayIdx===hoje && feitosHoje));
      const novos = ws.filter(w=>!velhos.some(v=>v.dayIdx===w.dayIdx) && (w.dayIdx > hoje || (w.dayIdx===hoje && !feitosHoje)));
      ws = velhos.concat(novos).sort((a,b)=>a.dayIdx-b.dayIdx);
      if(fadAtiva) ws.forEach(w=>{ if(w.dayIdx > hoje && w.motor) w.motor.ajusteFadiga = fad.motivo; });
    }
    ws.forEach((w,i)=>w.k = 'S'+(i+1));
    run.plan.workouts = ws;
    M.semanas[semAtual] = Object.assign({}, S.info, { fadigaAt: fadAtiva ? fadKey : (infoSem.fadigaAt||null), planejado: ws.filter(w=>w.motor && w.motor.tipo!=='prova').length });
    const ks = Object.keys(M.semanas).map(Number).sort((a,b)=>a-b); ks.slice(0, Math.max(0, ks.length-30)).forEach(k=>delete M.semanas[k]);
    // número de semanas do plano (para a barra de progresso)
    const rdT = (run.setup||{}).raceDate ? new Date(run.setup.raceDate+'T12:00:00').getTime() : null;
    run.plan.totalWeeks = rdT && rdT > M.inicio ? Math.max(1, Math.round((rSem(rdT) - M.inicio)/(7*DIA_MS))+1) : 12;
    run.plan.level = RN_LEG[M.nivel]; if(run.setup) run.setup.level = RN_LEG[M.nivel];
    try{ regenRunPlan(); }catch(e){}
    mudou = true;
  }
  runAtualizaStats();
  if(mudou){ try{ saveData(); }catch(e){} }
  return mudou;
}

// =====================================================================
// 24. INTEGRAÇÃO COM AS TELAS E FUNÇÕES QUE JÁ EXISTIAM
// =====================================================================
function _runLerAval(){
  const multi = id=>[...document.querySelectorAll('#'+id+' .opt-multi.on')].map(o=>o.dataset.val);
  const exp = readOpt('run-exp') || 'caminho';
  const dist = parseFloat(($('run-marca-dist')||{}).value||'');
  const seg = (+($('run-marca-h')||{}).value||0)*3600 + (+($('run-marca-m')||{}).value||0)*60 + (+($('run-marca-s')||{}).value||0);
  const aval = { exp, continuo: readOpt('run-cont') || '0', kmSemana: ['regular','experiente'].includes(exp) ? (+readOpt('run-kmsem')||0) : 0,
    tempo: +readOpt('run-tempo') || 45, tempoLongo: +readOpt('run-tempolongo') || 0, parado: +readOpt('run-parado') || 0, lim: multi('run-lim'), em: Date.now() };
  if(dist > 0 && seg > 0 && exp!=='nunca'){
    const pace = seg/60/dist;
    if(pace >= 2.6 && pace <= 15) aval.marca = { km:dist, seg };
  }
  return aval;
}
function _runCtxSetup(setup){ const ctx = runCtx(); ctx.run = Object.assign({}, ctx.run||{ history:[] }, { setup }); return ctx; }
function runAtualizaDicaNivel(){
  const el = $('run-nivel-hint'); if(!el) return;
  const aval = _runLerAval(); const goal = readOpt('run-goal') || '5km';
  const exp = aval.exp;
  document.querySelectorAll('#scr-setup-run .run-exp-mais').forEach(f=>{
    const id = f.id;
    const mostra = id==='run-kmsem-wrap' ? ['regular','experiente'].includes(exp) : id==='run-marca-wrap' ? exp!=='nunca' && exp!=='caminho' : ['20','30','60','90'].includes(aval.continuo);
    f.style.display = mostra ? '' : 'none';
  });
  const setup = { goal, aval, days: parseInt(readOpt('run-days'))||3, terrain: readOpt('run-terrain'), raceDate: ($('run-race-date')||{}).value || null };
  const ctx = _runCtxSetup(setup);
  const nv = rNivelPotencial(ctx, aval);
  const linhas = [`Seu ponto de partida: <b>${RN_NOME[nv]}</b> — ${RN_FOCO[nv]}.`];
  if(nv === 0) linhas.push(`Primeira semana: ${rEstagioTxt(rEstagioInicial(ctx, aval))}${aval.continuo==='0' && aval.exp==='nunca' ? '' : ''}. Nada de treino difícil: o importante agora é constância.`);
  const minNv = RUN_NIVEL_MIN[goal] || 0;
  if(nv < minNv) linhas.push(`Para ${RGOAL[goal].nome.toLowerCase()}, primeiro vamos construir a base. Os treinos específicos da prova só entram quando você estiver pronto(a) — escolher a meta não pula etapas.`);
  if(setup.raceDate && RUN_PRAZO[goal]){
    const sem = Math.round((new Date(setup.raceDate+'T12:00:00') - Date.now())/(7*DIA_MS));
    const precisa = RUN_PRAZO[goal][nv];
    if(sem >= 0 && sem < precisa) linhas.push(`⚠️ Faltam ${sem} semana${sem===1?'':'s'} para a prova; para o seu nível, o ideal seriam ${precisa}. O plano não vai acelerar o volume para compensar — se for correr, intercalar caminhada é uma estratégia segura.`);
  }
  if(aval.lim.length) linhas.push('Com a limitação marcada, ficam fora subidas e tiros fortes, e o impacto cresce devagar.');
  el.innerHTML = linhas.map(l=>`<div>${l}</div>`).join('');
}
const _openSetupRunB14 = window.openSetupScreen;
window.openSetupScreen = function(m){
  const r = _openSetupRunB14.apply(this, arguments);
  if(m === 'run'){
    try{
      const st = (state.modules.run && state.modules.run.setup) || {}; const a = st.aval || {};
      const setOn = (gid,val)=>{ const g=$(gid); if(!g||val==null) return; const t=g.querySelector(`.opt[data-val="${val}"]`); if(!t) return; g.querySelectorAll('.opt:not(.opt-multi)').forEach(o=>o.classList.remove('on')); t.classList.add('on'); };
      if(st.goal) setOn('run-goal', st.goal);
      if(st.aval){ setOn('run-exp', a.exp); setOn('run-cont', a.continuo); setOn('run-kmsem', a.kmSemana); setOn('run-tempo', a.tempo); setOn('run-tempolongo', a.tempoLongo||0); setOn('run-parado', 0);
        document.querySelectorAll('#run-lim .opt-multi').forEach(o=>o.classList.toggle('on', (a.lim||[]).includes(o.dataset.val)));
        if(a.marca){ $('run-marca-dist').value = String(a.marca.km); $('run-marca-h').value = Math.floor(a.marca.seg/3600)||''; $('run-marca-m').value = Math.floor(a.marca.seg%3600/60); $('run-marca-s').value = a.marca.seg%60; } }
      else if(state.user && state.user.profile && state.user.profile.level==='sedentario') setOn('run-exp','nunca');
      // limitações: seleção livre (o padrão da tela limita pelos dias da semana)
      document.querySelectorAll('#run-lim .opt-multi').forEach(o=>{ o.onclick = ()=>{ o.classList.toggle('on'); runAtualizaDicaNivel(); }; });
      ['run-goal','run-exp','run-cont','run-kmsem','run-days','run-tempo','run-tempolongo','run-parado'].forEach(id=>{ const g = $(id); if(g && !g._b14){ g._b14 = true; g.addEventListener('click', ()=>setTimeout(runAtualizaDicaNivel, 20)); } });
      ['run-marca-dist','run-marca-h','run-marca-m','run-marca-s','run-race-date'].forEach(id=>{ const e = $(id); if(e && !e._b14){ e._b14 = true; e.addEventListener('input', runAtualizaDicaNivel); e.addEventListener('change', runAtualizaDicaNivel); } });
      runAtualizaDicaNivel();
    }catch(e){ console.log('setup corrida', e); }
  }
  return r;
};
const _finishSetupRunB14 = window.finishSetup;
window.finishSetup = function(m){
  if(m === 'run'){
    try{
      const aval = _runLerAval();
      const setup = { goal: readOpt('run-goal'), aval, days: parseInt(readOpt('run-days'))||3 };
      const nv = rNivelPotencial(_runCtxSetup(setup), aval);
      const g = $('run-level'); if(g){ g.querySelectorAll('.opt').forEach(o=>o.classList.toggle('on', o.dataset.val===RN_LEG[nv])); }
      window.__runAval = aval;
    }catch(e){ window.__runAval = null; }
  }
  return _finishSetupRunB14.apply(this, arguments);
};
const _generatePlanRunB14 = window.generatePlan;
window.generatePlan = function(module, setup){
  if(module !== 'run') return _generatePlanRunB14.apply(this, arguments);
  try{
    if(window.__runAval){ setup.aval = window.__runAval; window.__runAval = null; }
    const old = state.modules.run;
    const ctx = _runCtxSetup(setup);
    const si = $('run-start-date'); let ini = mtDia0();
    if(si && si.value){ const d = new Date(si.value+'T00:00:00'); if(!isNaN(d) && d.getTime() > ini) ini = d.getTime(); }
    const M = rMotorNovo(ctx, setup, ini);
    if(old && old.plan && old.plan.motor){ M.hist = (old.plan.motor.hist||[]).slice(-26); }
    const semAtual = rSem(Math.max(Date.now(), ini));
    M.semanaRef = semAtual;
    const S = rMontarSemana(ctx, M, semAtual, {});
    S.workouts.forEach((w,i)=>w.k = 'S'+(i+1));
    M.semanas[semAtual] = S.info;
    setup.level = RN_LEG[M.nivel];
    const rdT = setup.raceDate ? new Date(setup.raceDate+'T12:00:00').getTime() : null;
    return { type:'run', goal:setup.goal, terrain:setup.terrain, level:RN_LEG[M.nivel], workouts:S.workouts, totalWeeks: rdT && rdT > M.inicio ? Math.max(1, Math.round((rSem(rdT)-M.inicio)/(7*DIA_MS))+1) : 12, motor:M };
  }catch(e){ console.log('motor de corrida — usando o gerador antigo', e); return _generatePlanRunB14.apply(this, arguments); }
};
const _buildingStepsRunB14 = window.buildingSteps;
window.buildingSteps = function(m, setup, prev){
  if(m !== 'run' || !setup || !setup.aval) return _buildingStepsRunB14.apply(this, arguments);
  try{
    const ctx = _runCtxSetup(setup); const nv = rNivelPotencial(ctx, setup.aval); const ref = rReferencia(ctx);
    const steps = [
      {pri:1, txt:`Avaliando seu ponto de partida: <b>${RN_NOME[nv]}</b>`},
      {pri:1, txt:`Objetivo: <b>${RGOAL[rGoal(setup)].nome}</b>${setup.raceDate?` · prova em ${new Date(setup.raceDate+'T12:00:00').toLocaleDateString('pt-BR')}`:''}`},
      {pri:2, txt:`Organizando ${setup.days} treinos por semana, até ${rTempos(setup).sessao} min cada`},
      {pri:2, txt: ref ? `Calculando seus ritmos a partir ${ref.fonte}` : 'Treinos por esforço até eu ter dados seus para calcular ritmos'}
    ];
    if(rDiasPerna(ctx).length) steps.push({pri:2, txt:'Encaixando a corrida longe dos dias de pernas da musculação'});
    if((setup.aval.lim||[]).length) steps.push({pri:1, txt:'Respeitando suas limitações: <b>sem subidas nem tiros fortes</b>'});
    if(prev) steps.push({pri:1, txt:'Preservando seu <b>histórico</b> e seus <b>recordes</b>'});
    steps.push({pri:1, txt:'<b>Sua primeira semana está pronta!</b> As próximas se ajustam ao que você registrar.'});
    return steps;
  }catch(e){ return _buildingStepsRunB14.apply(this, arguments); }
};
const _currentWeekB14 = currentWeek;
window.currentWeek = function(mod){
  if(mod && mod.plan && mod.plan.type==='run' && mod.plan.motor){
    const M = mod.plan.motor; const n = Math.max(1, Math.round((rSem(Date.now()) - M.inicio)/(7*DIA_MS))+1); const tot = mod.plan.totalWeeks || 12;
    if((mod.setup||{}).raceDate) return { wk: Math.min(n, tot), total: tot, cycle:1 };
    return { wk: ((n-1)%tot)+1, total: tot, cycle: Math.floor((n-1)/tot)+1 };
  }
  return _currentWeekB14.apply(this, arguments);
};
const _labelGoalB14 = labelGoal;
window.labelGoal = function(mod){ if(mod && mod.plan && mod.plan.type==='run' && RGOAL[(mod.setup||{}).goal]) return RGOAL[mod.setup.goal].nome; return _labelGoalB14.apply(this, arguments); };
// descrição e blocos da sessão
const _runDescB14 = runDesc;
window.runDesc = function(w){
  if(!w || !w.motor) return _runDescB14.apply(this, arguments);
  const m = w.motor; const main = (w.blocks||[])[1]; const ex = main && main.exs[0];
  return `${ex ? `<b>${mtEsc(ex.name)}</b><br>` : ''}🎯 ${mtEsc(m.alvo||'')}${m.ajusteFadiga ? `<br>🟡 Ajustado: ${mtEsc(m.ajusteFadiga)} — se o corpo ainda estiver pesado, troque por caminhada.` : ''}${m.nota ? `<br>🦵 ${mtEsc(m.nota)}` : ''}`;
};
const _renderRunBlocksB14 = renderRunBlocks;
window.renderRunBlocks = function(w){
  if(!w || !w.motor) return _renderRunBlocksB14.apply(this, arguments);
  const m = w.motor;
  const topo = `<div class="run-why"><div class="run-why-row"><span class="run-int run-int-${mtNorm(m.int).replace(/[^a-z]/g,'')}">${mtEsc(m.int)}</span><span class="run-fase">${mtEsc((RFASE[m.fase]||{}).nome||'')}</span></div>
    <div class="run-why-t">Por que este treino</div><div class="run-why-p">${mtEsc(m.porque)}</div>
    <div class="run-why-t">Intensidade</div><div class="run-why-p">${mtEsc(m.alvo)}</div></div>`;
  const orient = (m.orient||[]).length ? `<div class="run-orient"><div class="run-why-t">Orientações</div>${m.orient.map(o=>`<div class="run-orient-l">• ${mtEsc(o)}</div>`).join('')}<div class="run-orient-l">• Dor que muda sua passada, tontura ou dor no peito: pare o treino.</div></div>` : '';
  return topo + _renderRunBlocksB14.apply(this, arguments) + orient;
};
// "Sugestão de hoje" no card do treino: a mesma hierarquia do resto do app
const _runSugB14 = window.runSmartSuggestion;
window.runSmartSuggestion = function(w){
  const run = state.modules.run; const M = run && run.plan && run.plan.motor;
  if(!M) return _runSugB14.apply(this, arguments);
  try{
    const ctx = runCtx(); const sem = rSem(); const F = rSemanaFase(ctx, M, sem);
    if(F.fase==='retomada') return { emo:'🔁', txt:`Retomada (semana ${F.k} de ${F.N}, depois de ${F.pausa} dias): só ritmo leve, cerca de ${Math.round(F.fator*100)}% do volume de antes. Mesmo que fique fácil, não acelere nem estique o treino.` };
    const fad = rFadiga(ctx);
    if(fad && rSem(fad.at)===sem) return { emo:'🟡', txt:`Último treino: ${fad.motivo}. O resto da semana ficou leve. Se ainda estiver cansado(a) ou com dor, troque por caminhada ou descanse — recuperar também é treino.` };
    if(w && w.motor && w.motor.nota) return { emo:'🦵', txt: w.motor.nota };
    // treino perdido: não compensa
    const hoje = getDayIdx();
    const ontem = (run.plan.workouts||[]).find(x=>x.dayIdx === hoje-1);
    if(ontem && !(run.history||[]).some(h=>mtDia0(h.at)===mtDia0(Date.now()-DIA_MS))){
      const eraLongo = ontem.motor && ontem.motor.tipo==='longao';
      return { emo:'📅', txt: eraLongo && w && w.motor && w.motor.tipo!=='longao' ? 'O longão de ontem ficou para trás. Se quiser, faça o longão hoje NO LUGAR deste treino — nunca os dois. Sem compensar volume.' : 'O treino de ontem ficou para trás — sem problema. Siga o de hoje normalmente, sem somar o que faltou.' };
    }
    if(F.fase==='recuperacao') return { emo:'🌿', txt:'Semana de recuperação: volume menor de propósito. É aqui que o corpo assimila o treino das últimas semanas.' };
    if(F.fase==='taper') return { emo:'🎯', txt:'Polimento: menos volume para chegar descansado(a). Não invente treino extra nesta reta.' };
    // leves rápidos demais (erro clássico): o perfil mostra se o ritmo leve está acima da faixa
    const ref = rReferencia(ctx); const p = rPerfil(ctx);
    if(ref && ref.conf!=='baixa' && p.paceLeve && p.paceLeve < ref.zonas.leve.a - 0.15 && w && w.motor && ['leve','longao','continua'].includes(w.motor.tipo))
      return { emo:'🐢', txt:`Seus treinos leves estão saindo rápidos (${mtPaceStr(p.paceLeve)}) para a sua faixa (${rFaixa(ref.zonas.leve)}). Leve de verdade rende mais evolução e menos lesão.` };
    return null;
  }catch(e){ return null; }
};
// ---------- registro com horas, minutos e segundos ----------
function _rlTipoPlan(dayIdx){ const run = state.modules.run; const w = run && run.plan ? (run.plan.workouts||[]).find(x=>String(x.dayIdx)===String(dayIdx)) : null; return w; }
const _openRunLogB14 = window.openRunLog;
window.openRunLog = function(dayIdx){
  const run = state.modules.run; if(!run) return _openRunLogB14.apply(this, arguments);
  const w = _rlTipoPlan(dayIdx); const livre = !w || String(dayIdx)==='livre';
  const t = w && w.motor ? w.motor.tipo : null;
  const tipoAtiv = t==='caminhada' ? 'caminhada' : 'corrida';
  const semKmOk = livre || t==='caminhada' || t==='camcorre' || (t && (state.modules.run.plan.motor||{}).nivel <= 1);
  const planejado = w ? `<b>${mtEsc(w.name)}</b> · planejado: ${rFmtDurCurta(w.duration)}${w.distance?' · '+w.distance:''}` : 'Corrida, caminhada ou pedalada — mesmo em dia de descanso, todo movimento conta.';
  $('modal-inner').innerHTML = `<h3>📝 Registrar atividade</h3>
    <p style="color:var(--text-dim);font-size:13px;margin:4px 0 10px">${planejado}</p>
    <div class="field"><label>O que você fez?</label><div class="radio-grid g3" id="rl-type">
      <div class="opt ${tipoAtiv==='corrida'?'on':''}" data-val="corrida">🏃 Corrida</div><div class="opt ${tipoAtiv==='caminhada'?'on':''}" data-val="caminhada">🚶 Caminhada</div><div class="opt" data-val="bike">🚴 Bike</div></div></div>
    <div class="field"><label>Tempo total</label>
      <div class="tempo-hms"><input class="input mono" type="number" min="0" max="23" inputmode="numeric" id="rl-h" placeholder="h" aria-label="horas"><span>:</span><input class="input mono" type="number" min="0" max="59" inputmode="numeric" id="rl-m" placeholder="min" aria-label="minutos"><span>:</span><input class="input mono" type="number" min="0" max="59" inputmode="numeric" id="rl-s" placeholder="seg" aria-label="segundos"></div></div>
    <div class="field"><label>Distância (km)</label><input class="input mono" type="text" inputmode="decimal" id="rl-km" placeholder="Ex: 5,25">
      ${semKmOk ? `<label class="rl-chk"><input type="checkbox" id="rl-semkm"> Não medi a distância</label>` : ''}</div>
    <div class="rl-calc" id="rl-calc">Preencha o tempo e a distância para ver ritmo e velocidade.</div>
    ${!livre ? `<div class="field"><label>Você completou o treino?</label><div class="radio-grid g3" id="rl-conc"><div class="opt on" data-val="sim">✅ Completo</div><div class="opt" data-val="parcial">🟡 Quase todo</div><div class="opt" data-val="nao">❌ Não consegui</div></div></div>` : ''}
    ${t!=='caminhada' ? `<div class="field" id="rl-cont-wrap"><label>Correu sem parar para caminhar?</label><div class="radio-grid g3" id="rl-cont"><div class="opt ${t==='camcorre'?'':'on'}" data-val="1">Sim</div><div class="opt ${t==='camcorre'?'on':''}" data-val="0">Precisei caminhar</div></div></div>` : ''}
    <div class="field"><label>Esforço percebido (1 a 10)</label>${rpeHtml(t && RT[t] && RT[t].q ? 7 : 4)}</div>
    <input type="hidden" id="rl-min">
    <div class="row" style="gap:8px;margin-top:14px"><button class="btn btn-ghost btn-block" onclick="closeModal()">Cancelar</button><button class="btn btn-primary btn-block" onclick="saveRunLog('${livre?'livre':dayIdx}')">💾 Salvar</button></div>`;
  $('modal-back').classList.add('on');
  bindOpts('modal-inner');
  const upd = ()=>runLogCalc();
  ['rl-h','rl-m','rl-s','rl-km'].forEach(id=>{ const e = $(id); if(e) e.addEventListener('input', upd); });
  const sk = $('rl-semkm'); if(sk) sk.addEventListener('change', ()=>{ $('rl-km').disabled = sk.checked; if(sk.checked) $('rl-km').value = ''; upd(); });
  document.querySelectorAll('#rl-type .opt').forEach(o=>o.addEventListener('click', ()=>setTimeout(()=>{ const ty = readOpt('rl-type'); const cw = $('rl-cont-wrap'); if(cw) cw.style.display = ty==='corrida' ? '' : 'none'; upd(); }, 10)));
};
function _rlSeg(){ return (+($('rl-h')||{}).value||0)*3600 + (+($('rl-m')||{}).value||0)*60 + (+($('rl-s')||{}).value||0); }
function _rlKm(){ const v = parseFloat(String(($('rl-km')||{}).value||'').replace(',','.')); return v > 0 ? v : 0; }
function runLogCalc(){
  const el = $('rl-calc'); if(!el) return;
  const seg = _rlSeg(), km = _rlKm(), ty = readOpt('rl-type') || 'corrida';
  if(!seg){ el.textContent = 'Preencha o tempo e a distância para ver ritmo e velocidade.'; return; }
  if(!km){ el.innerHTML = `Tempo: <b>${rFmtSeg(seg)}</b>${$('rl-semkm') && $('rl-semkm').checked ? ' · sem distância: o plano usa o tempo' : ''}`; return; }
  const pace = seg/60/km;
  el.innerHTML = ty==='bike' ? `Tempo <b>${rFmtSeg(seg)}</b> · <b>${mtFmtKm(km)} km</b> · velocidade <b>${rFmtKmh(pace)}</b>`
    : `Tempo <b>${rFmtSeg(seg)}</b> · ritmo médio <b>${mtPaceStr(pace)}</b> · <b>${rFmtKmh(pace)}</b>`;
}
const _saveRunLogB14 = window.saveRunLog;
window.saveRunLog = function(dayIdx){
  if(!$('rl-h')) return _saveRunLogB14.apply(this, arguments);
  const h = +$('rl-h').value||0, m = +$('rl-m').value||0, s = +$('rl-s').value||0;
  if(m > 59 || s > 59 || h < 0 || m < 0 || s < 0){ toast('Minutos e segundos vão de 0 a 59'); return; }
  const seg = h*3600 + m*60 + s;
  if(seg <= 0){ toast('Informe o tempo (horas, minutos e segundos)'); return; }
  const ty = readOpt('rl-type') || 'corrida';
  const semKm = $('rl-semkm') && $('rl-semkm').checked;
  const km = _rlKm();
  if(!semKm && !km){ toast($('rl-semkm') ? 'Informe a distância ou marque "Não medi a distância"' : 'Informe a distância'); return; }
  if(km){
    const pace = seg/60/km;
    if(ty==='corrida' && pace < 2.6){ toast('Confira os dados: esse ritmo é mais rápido que o recorde mundial'); return; }
    if(ty==='caminhada' && pace < 4.5){ toast('Confira os dados: ritmo rápido demais para caminhada — foi corrida?'); return; }
    if(ty==='bike' && km/(seg/3600) > 70){ toast('Confira os dados: velocidade acima de 70 km/h'); return; }
  }
  const w = _rlTipoPlan(dayIdx); const t = w && w.motor ? w.motor.tipo : null;
  const contV = readOpt('rl-cont');
  const extra = { durSeg: seg, concluiu: $('rl-conc') ? (readOpt('rl-conc')||'sim') : undefined, continuo: ty==='corrida' && contV!=null ? contV==='1' : undefined,
    tipoSessao: String(dayIdx)==='livre' ? undefined : (t || undefined), estagio: w && w.motor ? w.motor.estagio : undefined };
  $('rl-min').value = `${h}:${m}:${s}`;
  if(semKm){ _rSalvarSemKm(dayIdx, ty, seg/60, extra); return; }
  $('rl-km').value = String(km);
  window.__runLogExtra = extra;
  return _saveRunLogB14.apply(this, arguments);
};
function _rSalvarSemKm(dayIdx, type, min, extra){
  const mod = state.modules.run; const livre = String(dayIdx)==='livre';
  const w = livre ? null : _rlTipoPlan(dayIdx);
  const rpe = window.__rpe || 5; const rate = rpe<=3 ? 5 : (rpe<=7 ? 3 : 1);
  const meta = ACTIVITY_META[type] || ACTIVITY_META.corrida;
  mod.history = mod.history || [];
  const e = { id: w ? w.k : 'livre', name: (w && type!=='bike') ? w.name : `${meta.emo} ${meta.lbl} — ${rFmtDurCurta(min)}`, at:Date.now(), duration:min, distance:0, pace:'', rating:rate, rpe, module:'run', activity:type };
  Object.keys(extra).forEach(k=>{ if(extra[k]!==undefined) e[k] = extra[k]; });
  mod.history.push(e);
  ensureStats();
  try{ adjustStartIfEarly(mod); }catch(er){}
  window.__runLogExtra = null;
  recalibrateRunPlan();
  saveData(); closeModal();
  const linhas = [`<b>${rFmtSeg(min*60)}</b> de ${type==='caminhada'?'caminhada':type==='bike'?'pedalada':'treino'} registrados.`].concat(runFeedbackMotor(e));
  $('modal-inner').innerHTML = `<div style="text-align:center"><div style="font-size:44px;line-height:1">${meta.emo}</div><h3 style="margin:10px 0 4px">Atividade registrada!</h3></div>
    <div class="card" style="margin-top:12px;padding:13px 15px">${linhas.map(l=>`<div style="font-size:13.5px;line-height:1.6;color:var(--text-dim);margin:5px 0">${l}</div>`).join('')}</div>
    <button class="btn btn-primary btn-block" style="margin-top:16px" onclick="closeModal();goTab('home')">Continuar</button>`;
  try{ trofeuPendente = true; }catch(er){}
  $('modal-back').classList.add('on');
}
// depois que o registro original grava, os dados extras entram no mesmo item do histórico
const _recalB14 = window.recalibrateRunPlan;
window.recalibrateRunPlan = function(){
  const run = state.modules.run;
  try{
    const ex = window.__runLogExtra;
    if(ex && run && (run.history||[]).length){ const u = run.history[run.history.length-1]; if(Date.now() - u.at < 60000) Object.keys(ex).forEach(k=>{ if(ex[k]!==undefined) u[k] = ex[k]; }); }
    window.__runLogExtra = null;
  }catch(e){}
  if(run && run.plan && run.plan.motor){ _rSyncAt = 0; runSync(); return; }
  return _recalB14.apply(this, arguments);
};
// o que o registro significa para o plano (aparece no resumo depois de salvar)
function runFeedbackMotor(e){
  const out = [];
  try{
    const run = state.modules.run; const M = run && run.plan && run.plan.motor; if(!M) return out;
    const ctx = runCtx();
    if(e.distance > 0 && e.duration > 0 && e.activity!=='bike') out.push(`Velocidade média: <b>${rFmtKmh(e.duration/e.distance)}</b>.`);
    const fad = rFadiga(ctx);
    if(fad && fad.at === e.at) out.push(`🟡 Anotado: ${fad.motivo}. Os próximos treinos desta semana ficaram leves — sem compensar nada depois.`);
    if(e.tipoSessao==='camcorre' && M.nivel===0){
      const n = rAtividades(ctx).filter(r=>r.tipoSessao==='camcorre' && r.estagio===M.estagio && rSem(r.at)===rSem() && r.concluiu==='sim' && (+r.rpe||5)<=7).length;
      out.push(n >= 2 ? `✅ ${n} treinos completos no estágio ${M.estagio}: na próxima semana você avança.` : `Estágio ${M.estagio}: ${n} de 2 treinos completos (esforço até 7/10) para avançar.`);
    }
    if(M.nivel===1 && e.activity==='corrida' && e.continuo!==false && e.duration >= (M.contMin||10)*0.95 && (+e.rpe||5) <= 6) out.push(`✅ ${Math.round(e.duration)} min sem parar com esforço ${e.rpe}/10 — conta para aumentar a corrida contínua.`);
    if(e.continuo===false && M.nivel===1) out.push('Precisou caminhar? Normal. O plano só aumenta quando você completar o tempo sem parar.');
  }catch(er){}
  return out;
}
const _runFeedbackB14 = runFeedback;
window.runFeedback = function(km, min, type, ehProva){
  const fb = _runFeedbackB14.apply(this, arguments);
  try{
    const run = state.modules.run; const u = run && (run.history||[]).slice(-1)[0];
    const extra = u ? runFeedbackMotor(Object.assign({}, u, window.__runLogExtra||{})) : [];
    if(fb && extra.length) fb.linhas = fb.linhas.concat(extra);
  }catch(e){}
  return fb;
};
// os recordes e o resumo semanal são guardados antes da limpeza de 90 dias
const _cleanupB14 = cleanupOldHistory;
window.cleanupOldHistory = function(){ try{ runAtualizaStats(); }catch(e){} return _cleanupB14.apply(this, arguments); };

// ---------- metas progressivas (só se conquistam com registros reais) ----------
const RUN_METAS = [
  {k:'c10', nome:'Correr 10 min sem parar', tipo:'cont', alvo:10},
  {k:'c20', nome:'Correr 20 min sem parar', tipo:'cont', alvo:20},
  {k:'c30', nome:'Correr 30 min sem parar', tipo:'cont', alvo:30},
  {k:'k3', nome:'Completar os primeiros 3 km', tipo:'km', alvo:3},
  {k:'k5', nome:'Completar 5 km', tipo:'km', alvo:5},
  {k:'t5', nome:'Melhorar o tempo nos 5 km', tipo:'t5'},
  {k:'k10', nome:'Completar 10 km', tipo:'km', alvo:10},
  {k:'k21', nome:'Completar 21 km', tipo:'km', alvo:21.0975},
  {k:'k42', nome:'Completar 42 km', tipo:'km', alvo:42.195}
];
function rMetas(ctx){
  const S = ctx.stats || {}; const MS = S.metas || {}; const p = rPerfil(ctx);
  const runs = rCorridas(ctx); const recentes = runs.filter(r=>r.at >= ctx.agora - 42*DIA_MS);
  const longoMin = recentes.filter(rContinua).reduce((m,r)=>Math.max(m,+r.duration||0),0);
  const sem3 = p.semanas.slice(0,6).filter(w=>w.n>=3).length;
  const M = (((ctx.run||{}).plan)||{}).motor || {};
  const lista = RUN_METAS.map(mt=>{
    const o = Object.assign({}, mt, { feita: !!MS[mt.k], quando: MS[mt.k] || null });
    if(mt.tipo==='t5'){
      const r5 = (S.recordes||{})['5'];
      if(!MS.t5base){ o.req = [{ok:!!MS.k5, txt:'ter um 5 km registrado'}]; o.prog = 0; }
      else { o.alvoMin = MS.t5base.min*0.97; o.txtAlvo = `abaixo de ${rFmtMin(o.alvoMin)} (seu primeiro: ${rFmtMin(MS.t5base.min)})`; o.prog = r5 ? _clamp((MS.t5base.min - r5.min)/(MS.t5base.min - o.alvoMin), 0, 1) : 0; o.req = [{ok:true, txt:'treinar ritmo por algumas semanas (o plano cuida disso)'}]; }
      return o;
    }
    o.prog = mt.tipo==='cont' ? _clamp(p.contMin/mt.alvo, 0, 1) : _clamp(p.maiorKm/mt.alvo, 0, 1);
    // preparação exigida para tentar a meta com segurança (nunca liberada só por tempo de uso)
    if(mt.k==='k5') o.req = [{ok:!!MS.c30 || p.contMin>=30, txt:'correr 30 min sem parar'}];
    if(mt.k==='k10') o.req = [{ok:!!MS.k5, txt:'5 km concluídos'}, {ok:longoMin>=60, txt:`longão de 60 min nas últimas 6 semanas (maior: ${Math.round(longoMin)} min)`}];
    if(mt.k==='k21') o.req = [{ok:!!MS.k10, txt:'10 km concluídos'}, {ok:longoMin>=95, txt:`longão de 95 min nas últimas 6 semanas (maior: ${Math.round(longoMin)} min)`}, {ok:sem3>=3, txt:`3 semanas com 3+ corridas (últimas 6: ${sem3})`}];
    if(mt.k==='k42') o.req = [{ok:!!MS.k21, txt:'21 km concluídos'}, {ok:longoMin>=150, txt:`longão de 2h30 nas últimas 6 semanas (maior: ${Math.round(longoMin)} min)`}, {ok:(M.nivel||0)>=3, txt:'nível Intermediário avançado ou acima'}];
    return o;
  });
  const prox = lista.find(m=>!m.feita) || null;
  if(prox) prox.proxima = true;
  return { lista, prox };
}

// ---------- status no topo da tela de Treinos ----------
function runStatusCard(){
  const run = state.modules.run; const M = run && run.plan && run.plan.motor; if(!M) return '';
  const ctx = runCtx(); const F = rSemanaFase(ctx, M, rSem()); const info = M.semanas[rSem()] || {};
  const ref = rReferencia(ctx);
  const vol = info.vol ? (ref ? `~${rFmtDurCurta(info.vol)} correndo (≈${mtFmtKm(info.vol/((ref.zonas.leve.a+ref.zonas.leve.b)/2))} km)` : `~${rFmtDurCurta(info.vol)} de treino`) : '';
  const extra = M.nivel===0 ? `Estágio ${M.estagio} de ${RUN_EST.length-1}` : M.nivel===1 ? `Corrida contínua: ${M.contMin} min` : vol;
  const mig = M.migrado ? `<div class="run-st-mig">Seu plano agora evolui semana a semana. <button class="link-mais" onclick="openSetupScreen('run')">Refazer a avaliação</button> deixa tudo mais preciso.</div>` : '';
  return `<div class="run-st" id="run-st">
    <div class="run-st-top"><div><div class="run-st-k">Nível</div><div class="run-st-v">${RN_NOME[M.nivel]}</div></div><div><div class="run-st-k">Fase</div><div class="run-st-v">${RFASE[F.fase].nome}${F.fase==='retomada'?` ${F.k}/${F.N}`:''}</div></div></div>
    <div class="run-st-p">${RFASE[F.fase].desc.charAt(0).toUpperCase()+RFASE[F.fase].desc.slice(1)}. ${extra ? `<b>Esta semana:</b> ${extra}.` : ''}</div>
    ${mig}
    <div class="run-st-a"><button class="btn btn-primary" onclick="openRunPainel()">📈 Evolução</button><button class="btn btn-ghost" onclick="openRunSemana()">📅 Semana com menos tempo</button></div>
  </div>`;
}
function openRunSemana(){
  const run = state.modules.run; const M = run && run.plan && run.plan.motor; if(!M) return;
  const hoje = getDayIdx(); const atuais = (run.plan.workouts||[]).map(w=>w.dayIdx);
  $('modal-inner').innerHTML = `<h3>📅 Semana com menos tempo</h3>
    <p class="mt-muted" style="margin:4px 0 10px">Marque os dias em que você <b>consegue</b> treinar até domingo. Eu reorganizo a semana priorizando o mais importante — sem empilhar treinos e sem compensar depois.</p>
    <div class="radio-grid" id="rs-dias" style="grid-template-columns:repeat(4,1fr)">${RUN_DIAS.map((d,i)=>{ const di = i+1; const pass = di < hoje; return `<div class="opt opt-multi ${!pass && atuais.includes(di)?'on':''} ${pass?'opt-off':''}" data-val="${di}" ${pass?'aria-disabled="true"':''}>${d.slice(0,3)}</div>`; }).join('')}</div>
    <div class="row" style="gap:8px;margin-top:14px"><button class="btn btn-ghost btn-block" onclick="runSemanaNormal()">Voltar ao normal</button><button class="btn btn-primary btn-block" onclick="runSemanaPrevia()">Ver como fica</button></div>`;
  $('modal-back').classList.add('on');
  document.querySelectorAll('#rs-dias .opt-multi').forEach(o=>{ if(o.classList.contains('opt-off')) return; o.onclick = ()=>o.classList.toggle('on'); });
}
// Beta 34: antes de aplicar, mostra como a semana fica (o que continua, o que muda e o que sai).
// Antes, "Reorganizar" não remontava a semana (a mudança só aparecia num recálculo posterior).
function _rsDiasEscolhidos(){
  const hoje = getDayIdx();
  return [...document.querySelectorAll('#rs-dias .opt-multi.on')].map(o=>+o.dataset.val).filter(d=>d >= hoje).sort((a,b)=>a-b);
}
function _rsSessaoTxt(w){ const t = w.motor ? w.motor.tipo : ''; return `${(RT[t]||{}).nome || w.name} · ${w.duration} min${w.distance?` · ${w.distance}`:''}`; }
function runSemanaPrevia(){
  const run = state.modules.run; const M = run.plan.motor; const hoje = getDayIdx();
  const dias = _rsDiasEscolhidos();
  if(!dias.length){ toast('Marque pelo menos um dia a partir de hoje'); return; }
  const feitosHoje = (run.history||[]).some(h=>mtDia0(h.at)===mtDia0());
  const passados = (run.plan.workouts||[]).map(w=>w.dayIdx).filter(d=>d < hoje || (d===hoje && feitosHoje));
  const sem = rSem();
  const teste = JSON.parse(JSON.stringify(M)); teste.especial = { sem, dias: [...new Set(passados.concat(dias))] };
  let S; try{ S = rMontarSemana(runCtx(), teste, sem, {}); }catch(e){ console.log('prévia da semana:', e); toast('Não consegui montar a prévia agora'); return; }
  const futuro = ws => ws.filter(w=>w.dayIdx > hoje || (w.dayIdx===hoje && !feitosHoje));
  const antes = futuro(run.plan.workouts||[]), depois = futuro(S.workouts||[]);
  const tiposDepois = depois.map(w=>w.motor && w.motor.tipo);
  const saem = antes.filter(w=>w.motor && !tiposDepois.includes(w.motor.tipo));
  const minA = antes.reduce((t,w)=>t+(+w.duration||0),0), minD = depois.reduce((t,w)=>t+(+w.duration||0),0);
  const notas = depois.filter(w=>w.motor && w.motor.nota).map(w=>`${w.dayName}: ${w.motor.nota}`);
  window.__rsDias = teste.especial.dias;
  $('modal-inner').innerHTML = `<h3>📅 Como fica a semana</h3>
    <div class="section-lbl" style="margin:6px 0 4px">Antes</div>
    ${antes.length ? antes.map(w=>`<div class="mrow"><span>${w.dayName}</span><b style="text-align:right">${mtEsc(_rsSessaoTxt(w))}</b></div>`).join('') : '<p class="mt-muted">Nenhum treino restante.</p>'}
    <div class="section-lbl" style="margin:12px 0 4px">Depois</div>
    ${depois.length ? depois.map(w=>`<div class="mrow"><span>${w.dayName}</span><b style="text-align:right">${mtEsc(_rsSessaoTxt(w))}</b></div>`).join('') : '<p class="mt-muted">Nenhum treino.</p>'}
    <div class="note note-info" style="margin-top:12px"><div class="note-line" style="font-size:12.5px;line-height:1.55">
      ${tiposDepois.includes('longao') ? 'O <b>longão</b> continua: é o treino que mais sustenta a sua evolução. ' : ''}${tiposDepois.some(t=>RT[t]&&RT[t].q) ? 'O treino de <b>qualidade</b> continua, longe do longão. ' : ''}
      ${saem.length ? `Sai${saem.length>1?'em':''}: ${saem.map(w=>mtEsc((RT[w.motor.tipo]||{}).nome||w.name).toLowerCase()).join(', ')} — ${saem.length>1?'os de menor prioridade':'o de menor prioridade'}. ` : ''}
      Tempo total: ${minA} → ${minD} min. Os outros dias <b>não</b> ficam mais longos para compensar, e a semana que vem volta ao plano normal.
      ${notas.length ? '<br><br>' + notas.map(mtEsc).join('<br>') : ''}</div></div>
    <div class="row" style="gap:8px;margin-top:14px"><button class="btn btn-ghost btn-block" onclick="openRunSemana()">Escolher outros dias</button><button class="btn btn-primary btn-block" onclick="runSemanaAplicar()">Aplicar</button></div>`;
}
function runSemanaAplicar(){
  const run = state.modules.run; const M = run.plan.motor;
  const dias = window.__rsDias; if(!dias || !dias.length){ runSemanaPrevia(); return; }
  M.especial = { sem: rSem(), dias };
  window.__rsDias = null;
  runSync(false, true); closeModal(); toast('Semana reorganizada ✅'); try{ goTab(state.ui.tab||'sessions'); }catch(e){}
}
function runSemanaNormal(){ const M = state.modules.run.plan.motor; M.especial = null; runSync(false, true); closeModal(); toast('Semana normal de volta'); try{ goTab(state.ui.tab||'sessions'); }catch(e){} }

// ---------- painel de evolução ----------
function openRunPainel(dados){
  const ctx = runCtx(dados); const run = ctx.run; if(!run){ toast('Você ainda não tem o módulo de corrida.'); return; }
  if(!dados) runAtualizaStats();
  const S = (dados ? dados.corridaStats : state.corridaStats) || {}; const sem = S.semanas || {};
  const M = (run.plan||{}).motor || null; const p = rPerfil(ctx); const ref = rReferencia(ctx);
  const s0 = rSem(); const ks = []; for(let i=11;i>=0;i--) ks.push(s0 - i*7*DIA_MS);
  const W = k=>sem[k] || {km:0,min:0,n:0,cont:0,kmP:0,minP:0};
  const mes0 = new Date(); mes0.setDate(1); mes0.setHours(0,0,0,0);
  const hist = rCorridas(ctx);
  const doMes = hist.filter(r=>r.at >= mes0.getTime());
  const tot = Object.values(sem).reduce((t,w)=>({km:t.km+(w.km||0), min:t.min+(w.min||0), n:t.n+(w.n||0)}), {km:0,min:0,n:0});
  const freq = ks.slice(4).reduce((t,k)=>t+W(k).n,0)/8;
  const cump = M ? rCumprimento(ctx, M, 4) : null;
  const tile = (k,v,s)=>`<div class="rp-tile"><div class="rp-k">${k}</div><div class="rp-v">${v}</div>${s?`<div class="rp-s">${s}</div>`:''}</div>`;
  const tiles = `<div class="rp-tiles">
    ${tile('Esta semana', mtFmtKm(W(s0).km)+' km', rFmtDurCurta(W(s0).min)+' correndo')}
    ${tile('Este mês', mtFmtKm(doMes.reduce((t,r)=>t+(+r.distance||0),0))+' km', rFmtDurCurta(doMes.reduce((t,r)=>t+(+r.duration||0),0))+' correndo')}
    ${tile('Tempo total correndo', rFmtDurCurta(tot.min), `${tot.n} corridas registradas`)}
    ${tile('Frequência', freq.toLocaleString('pt-BR',{maximumFractionDigits:1})+'×/sem', 'média das últimas 8 semanas')}
    ${tile('Cumprimento do plano', cump==null?'—':cump+'%', cump==null?'aparece após a 1ª semana avaliada':'últimas 4 semanas')}
    ${tile('Maior corrida contínua', p.contMin ? rFmtDurCurta(p.contMin) : '—', 'últimas 8 semanas')}
  </div>`;
  const ptsKm = ks.map(k=>({v:Math.round(W(k).km*10)/10, rot:mtFmtData(k), tip:`<b>${mtFmtKm(W(k).km)} km</b> · ${rFmtDurCurta(W(k).min)} · ${W(k).n} corrida${W(k).n===1?'':'s'} · semana de ${mtFmtData(k)}`}));
  const comKm = ptsKm.filter(x=>x.v>0).length;
  const ptsPace = ks.map(k=>{ const w = W(k); const v = w.kmP>=1 ? w.minP/w.kmP : null; return {v, rot:mtFmtData(k), tip: v?`<b>${mtPaceStr(v)}</b> · ${rFmtKmh(v)} · semana de ${mtFmtData(k)}`:''}; });
  const ptsCont = ks.map(k=>{ const w = W(k); return {v: w.cont>0 ? Math.round(w.cont) : null, rot:mtFmtData(k), tip: w.cont>0 ? `<b>${Math.round(w.cont)} min</b> sem parar · semana de ${mtFmtData(k)}` : ''}; });
  const graf = (tit, corpo, nota)=>`<div class="rp-card"><div class="rp-t">${tit}</div>${corpo}${nota?`<div class="mt-muted" style="font-size:11.5px;margin-top:4px">${nota}</div>`:''}</div>`;
  const vazio = txt=>`<div class="ch-empty"><b>Ainda não há dados suficientes</b><span>${txt}</span></div>`;
  const charts = graf('Quilômetros por semana', comKm>=2 ? mtChart({tipo:'bar', pts:ptsKm, un:'km', dec:1}) : vazio('São necessárias corridas com distância em pelo menos 2 semanas.'))
    + graf('Ritmo médio por semana', ptsPace.filter(x=>x.v).length>=2 ? mtChart({tipo:'line', pts:ptsPace, un:'min/km', dec:2, fmt:v=>mtPaceStr(v).replace('/km',''), axFmt:v=>mtPaceStr(v).replace('/km','')}) : vazio('Aparece com corridas de 1 km ou mais em pelo menos 2 semanas.'), 'Ritmo mistura treinos leves e fortes; compare semanas parecidas.')
    + graf('Resistência — maior corrida sem parar', ptsCont.filter(x=>x.v).length>=2 ? mtChart({tipo:'line', pts:ptsCont, un:'min', dec:0}) : vazio('Aparece com corridas contínuas em pelo menos 2 semanas.'));
  // recordes x estimativas
  const rec = S.recordes || {};
  const linhasRec = RUN_REC_D.map(D=>{ const r = rec[D.k]; const est = ref && (D.km <= 21.1 || (M && M.nivel>=3)) ? rPrevisto(ref.vdot, D.km) : null;
    return `<tr><td>${D.nome}</td><td>${r ? `<b>${rFmtMin(r.min)}</b>${r.prova?' 🏅':''}<small>${mtFmtData(r.at,{day:'2-digit',month:'2-digit',year:'2-digit'})}${Math.abs(r.km-D.km)>0.05?` · ${mtFmtKm(r.km)} km`:''}</small>` : '<span class="mt-muted">—</span>'}</td><td>${est ? `${rFmtMin(est)}<small>estimativa</small>` : '<span class="mt-muted">—</span>'}</td></tr>`; }).join('');
  const recs = `<div class="rp-card"><div class="rp-t">Melhores marcas</div><table class="rp-tab"><tr><th></th><th>Registrado</th><th>Estimado</th></tr>${linhasRec}</table>
    <div class="mt-muted" style="font-size:11.5px;margin-top:6px">"Registrado" é só o que você correu de fato na distância (🏅 = prova). "Estimado" é cálculo${ref?` a partir ${ref.fonte}${ref.conf==='baixa'?' — aproximado':''}`:''}${ref && ref.reduzida?', já descontando a pausa recente':''}${ref?'':' e aparece quando houver dados confiáveis'}.</div></div>`;
  // zonas
  const zonas = ref ? `<div class="rp-card"><div class="rp-t">Seus ritmos de treino</div>${['regenerativo','leve','maratona','limiar','intervalado','velocidade'].map(k=>`<div class="rp-z"><div><b>${RZ_INFO[k].nome}</b><small>esforço ${RZ_INFO[k].rpe}/10 · ${RZ_INFO[k].txt}</small></div><div class="mono">${rFaixa(ref.zonas[k])}</div></div>`).join('')}
    <div class="mt-muted" style="font-size:11.5px;margin-top:6px">Calculados a partir ${ref.fonte}. Confiança: <b>${({alta:'alta',media:'média',baixa:'baixa (aproximação)'})[ref.conf]}</b>. Calor, subida e cansaço mudam o ritmo — nesses dias vale o esforço.</div></div>`
    : `<div class="rp-card"><div class="rp-t">Seus ritmos de treino</div><div class="run-orient-l">Ainda não há dados confiáveis para calcular ritmos — então os treinos vão por <b>esforço</b> (escala de 1 a 10) e pelo teste da conversa. Para liberar: registre algumas corridas leves com distância ou informe um tempo recente na avaliação.</div></div>`;
  // metas
  const MT = rMetas(ctx);
  const metas = `<div class="rp-card"><div class="rp-t">Metas</div>${MT.lista.map(m=>`<div class="rp-meta ${m.feita?'ok':''} ${m.proxima?'prox':''}"><div class="rp-meta-ic">${m.feita?'✓':m.proxima?'▶':''}</div><div style="flex:1"><div>${m.nome}${m.txtAlvo && !m.feita?` <small>${m.txtAlvo}</small>`:''}</div>${m.feita?`<small>conquistada em ${mtFmtData(m.quando,{day:'2-digit',month:'2-digit',year:'2-digit'})}</small>`:''}${m.proxima?`<div class="rp-bar"><i style="width:${Math.round((m.prog||0)*100)}%"></i></div>${(m.req||[]).length?`<div class="rp-req">${m.req.map(r=>`<span class="${r.ok?'ok':''}">${r.ok?'✓':'○'} ${r.txt}</span>`).join('')}</div>${m.req.every(r=>r.ok)?'<small style="color:var(--primary-2)">Preparação ok — o plano leva você até lá.</small>':''}`:''}`:''}</div></div>`).join('')}</div>`;
  // próximo nível
  let prox = '';
  if(M){ const c = rCriteriosNivel(ctx, M); if(c && !c.topo && c.lista.length) prox = `<div class="rp-card"><div class="rp-t">Para avançar para ${RN_NOME[Math.min(5, M.nivel+1)]}</div><div class="rp-req">${c.lista.map(r=>`<span class="${r.ok?'ok':''}">${r.ok?'✓':'○'} ${r.txt}</span>`).join('')}</div><div class="mt-muted" style="font-size:11.5px;margin-top:6px">O nível sobe por evolução comprovada nos registros — nunca só por tempo de uso.</div></div>`; }
  // provas e decisões
  const provas = (S.provas||[]).slice().reverse();
  const provasH = `<div class="rp-card"><div class="rp-t">Histórico de provas</div>${provas.length ? provas.map(pv=>`<div class="rp-z"><div><b>${mtFmtKm(pv.km)} km</b><small>${new Date(pv.at).toLocaleDateString('pt-BR')}</small></div><div class="mono">${rFmtMin(pv.min)}${pv.km>0?` · ${mtPaceStr(pv.min/pv.km)}`:''}</div></div>`).join('') : '<div class="mt-muted">Nenhuma prova registrada. No dia da prova, registre a corrida normalmente: ela entra aqui.</div>'}</div>`;
  const dec = M ? (M.hist||[]).slice(-6).reverse().filter(h=>h.decisao!=='pausa' || h===M.hist[M.hist.length-1]) : [];
  const decH = dec.length ? `<div class="rp-card"><div class="rp-t">Como o plano se ajustou</div>${dec.map(h=>`<div class="rp-dec"><small>semana de ${mtFmtData(h.sem)}</small><div>${({avancar:'⬆️ Avançou',manter:'➡️ Manteve',recuar:'⬇️ Aliviou',retomada:'🔁 Retomada',pausa:'⏸️ Pausa'})[h.decisao]||h.decisao}${h.mudou?`: ${mtEsc(h.mudou)}`:''}</div><small>${mtEsc(h.motivo||'')}</small></div>`).join('')}</div>` : '';
  const cab = M ? `<div class="rp-head"><div><small>Nível</small><b>${RN_NOME[M.nivel]}</b></div><div><small>Objetivo</small><b>${(RGOAL[rGoal(run.setup)]||{}).nome||'—'}</b></div></div>` : '';
  $('modal-inner').innerHTML = `<h3>📈 Evolução da corrida${dados?' — aluno':''}</h3>${cab}${tiles}${charts}${recs}${zonas}${metas}${prox}${provasH}${decH}
    <button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
// ---------- telas existentes ----------
// selos "Fácil" fixos (card do dia e detalhe da sessão) viram a intensidade real do treino
function _runSelos(){
  if(state.active !== 'run') return;
  const ws = ((state.modules.run||{}).plan||{}).workouts||[];
  document.querySelectorAll('.today, .detail-hero').forEach(card=>{
    const tit = card.querySelector('.today-title, h2'); if(!tit) return;
    const w = ws.find(x=>x.motor && x.name===tit.textContent.trim()); if(!w) return;
    card.querySelectorAll('.today-diff, .plan-badge').forEach(b=>{ b.textContent = w.motor.int; if(b.classList.contains('today-diff')) b.className = 'today-diff ' + (RT[w.motor.tipo].q ? 'diff-med' : 'diff-easy'); });
  });
}
function _runPosRender(){
  try{
    if(state.active !== 'run') return;
    const run = state.modules.run; const M = run && run.plan && run.plan.motor; if(!M) return;
    const ctx = runCtx(); const F = rSemanaFase(ctx, M, rSem());
    _runSelos();
    const ph = $('plan-phase'); if(ph) ph.textContent = RFASE[F.fase].nome;
    const pf = $('plan-foot');
    if(pf && !/primeiro treino|ainda não começou/.test(pf.textContent)){
      const rd = (run.setup||{}).raceDate; const dias = rd ? Math.round((new Date(rd+'T12:00:00') - Date.now())/DIA_MS) : null;
      pf.textContent = `${RN_NOME[M.nivel]} · ${RFASE[F.fase].desc}.${dias!=null && dias>=0 ? ` Prova em ${dias} dia${dias===1?'':'s'}.` : ''}`;
    }
  }catch(e){}
}
const _runSyncAntes = ()=>{ try{ if(state && state.modules && state.modules.run && state.modules.run.plan) runSync(); }catch(e){ console.log('runSync', e); } };
mtGancho('renderHome', { antes: _runSyncAntes, depois(){ _runPosRender(); } });
mtGancho('renderSessions', { antes: _runSyncAntes, depois(){
  try{
    const slot = $('sess-prestart');
    const velho = $('run-st'); if(velho) velho.remove();
    if(state.active==='run' && slot) slot.insertAdjacentHTML('afterend', runStatusCard());
    _runSelos();
  }catch(e){}
}});
// Progresso: atalho para o painel da corrida
mtGancho('renderPerf', { depois(){
  try{
    const old = $('perf-run-card'); if(old) old.remove();
    if(state.modules.run && ((state.modules.run.history||[]).length || state.modules.run.plan)){
      const evo = $('perf-evo');
      const html = `<div class="chart-card" id="perf-run-card" onclick="openRunPainel()" style="cursor:pointer"><div class="chart-head"><div class="chart-title">🏃 Evolução da corrida</div><span class="mt-muted" style="font-size:12px">abrir ›</span></div><div class="mt-muted" style="font-size:12.5px">Km por semana, ritmo, resistência, melhores marcas (registradas e estimadas), metas e provas.</div></div>`;
      if(evo) evo.insertAdjacentHTML('afterend', html);
    }
  }catch(e){}
}});

// =====================================================================
// 25. META ASSISTENTE — explica a corrida com os dados reais do aluno
// =====================================================================
function _rMA(){ const run = state.modules.run; const M = run && run.plan && run.plan.motor; if(!M) return null; const ctx = runCtx(); return { run, M, ctx, F: rSemanaFase(ctx, M, rSem()), p: rPerfil(ctx), ref: rReferencia(ctx) }; }
const RUN_SEM_PLANO = 'Você ainda não tem um plano de corrida. Em <b>Treinos → Montar plano de corrida</b> eu faço uma avaliação rápida e monto a primeira semana a partir do seu nível de hoje. 🏃';
function _rProximoTreino(run){
  const hoje = getDayIdx(); const ws = (run.plan.workouts||[]).slice().sort((a,b)=>a.dayIdx-b.dayIdx);
  return ws.find(w=>w.dayIdx===hoje) || ws.find(w=>w.dayIdx>hoje) || ws[0];
}
MA_ANSWERS.run_hoje = function(){
  const D = _rMA(); if(!D) return RUN_SEM_PLANO;
  const w = _rProximoTreino(D.run); if(!w || !w.motor) return 'Não há treino de corrida planejado para esta semana.';
  const ehHoje = w.dayIdx===getDayIdx();
  let t = `${ehHoje?'Hoje':`O próximo (${w.dayName.toLowerCase()})`} é <b>${mtEsc(w.name)}</b> — ${rFmtDurCurta(w.duration)}${w.distance?`, ${w.distance}`:''}.<br><br><b>Por quê:</b> ${mtEsc(w.motor.porque)}<br><br><b>Intensidade:</b> ${mtEsc(w.motor.alvo)}`;
  if(w.motor.nota) t += `<br><br>🦵 ${mtEsc(w.motor.nota)}`;
  if(w.motor.ajusteFadiga) t += `<br><br>🟡 Ajustado porque o último treino teve ${mtEsc(w.motor.ajusteFadiga)}.`;
  t += `<br><br>Você está no nível <b>${RN_NOME[D.M.nivel]}</b>, fase de <b>${RFASE[D.F.fase].nome.toLowerCase()}</b>.`;
  return t;
};
MA_ANSWERS.run_desenvolve = function(){
  const D = _rMA(); if(!D) return RUN_SEM_PLANO;
  const tipos = [...new Set((D.run.plan.workouts||[]).map(w=>w.motor && w.motor.tipo).filter(Boolean))];
  let t = `Agora você está desenvolvendo: <b>${RN_FOCO[D.M.nivel]}</b>.<br><br>Fase atual — <b>${RFASE[D.F.fase].nome}</b>: ${RFASE[D.F.fase].desc}.<br><br>Nesta semana:`;
  tipos.forEach(k=>{ t += `<br>• <b>${RT[k].nome}</b>: ${RT[k].obj}.`; });
  return t;
};
MA_ANSWERS.run_carga = function(){
  const D = _rMA(); if(!D) return RUN_SEM_PLANO;
  if(D.F.fase==='retomada') return `🔁 Você está em <b>retomada</b> (semana ${D.F.k} de ${D.F.N}, depois de ${D.F.pausa} dias sem correr). O volume está em ~${Math.round(D.F.fator*100)}% do que era antes e não tem treino forte. Isso vem antes de qualquer progressão: mesmo que fique fácil, a carga não sobe até a retomada terminar.`;
  const ult = (D.M.hist||[]).filter(h=>h.decisao!=='pausa').slice(-1)[0];
  if(!ult) return `Seu plano ainda está na primeira semana — a primeira avaliação acontece quando ela terminar. Eu olho: quantos treinos você fez, se completou, o esforço que marcou e se houve cansaço. Só então mudo <b>uma</b> coisa por vez (volume ou intensidade).`;
  const verbo = {avancar:'⬆️ subiu', manter:'➡️ ficou igual', recuar:'⬇️ ficou mais leve', retomada:'🔁 seguiu a retomada'}[ult.decisao] || ult.decisao;
  let t = `Na avaliação da semana de ${mtFmtData(ult.sem)}, a carga <b>${verbo}</b>.<br><br><b>Motivo:</b> ${mtEsc(ult.motivo)}.`;
  if(ult.mudou) t += `<br><b>O que mudou:</b> ${mtEsc(ult.mudou)}.`;
  t += `<br><br>Regra do plano: aumentos graduais (no máximo ~10% por semana), uma variável por vez, e nenhum aumento se o corpo mostrar cansaço.`;
  if(D.F.fase==='recuperacao') t += '<br><br>Esta semana é de <b>recuperação</b>: o volume menor é planejado, não é retrocesso.';
  return t;
};
MA_ANSWERS.run_avancar = function(){
  const D = _rMA(); if(!D) return RUN_SEM_PLANO;
  if(D.F.fase==='retomada') return `Primeiro termina a retomada (semana ${D.F.k} de ${D.F.N}). Depois disso eu volto a avaliar a sua evolução normalmente.`;
  const c = rCriteriosNivel(D.ctx, D.M);
  if(c.topo) return `Você já está no nível mais alto (<b>${RN_NOME[5]}</b>). A evolução agora vem de ajustes finos de volume, intensidade e recuperação.`;
  let t = `Você está no nível <b>${RN_NOME[D.M.nivel]}</b>. Para avançar para <b>${RN_NOME[D.M.nivel+1]}</b>:`;
  c.lista.forEach(r=>{ t += `<br>${r.ok?'✅':'⬜'} ${mtEsc(r.txt)}`; });
  if(D.M.nivel===0) t += `<br><br>Estágio atual: <b>${D.M.estagio}</b> de ${RUN_EST.length-1} (${rEstagioTxt(D.M.estagio)}). Cada estágio avança com 2 treinos completos e esforço até 7/10.`;
  if(D.M.nivel===1) t += `<br><br>Corrida contínua atual: <b>${D.M.contMin} min</b>. Ela aumenta quando você faz 2 corridas desse tempo sem parar, com esforço até 6/10.`;
  t += c.todos ? '<br><br>Tudo pronto: a mudança acontece na próxima avaliação semanal (mínimo de 3 semanas no nível).' : '<br><br>Não depende de tempo de app — depende do que os seus registros mostram.';
  return t;
};
MA_ANSWERS.run_recuperar = function(){
  const D = _rMA(); if(!D) return RUN_SEM_PLANO;
  const fad = rFadiga(D.ctx);
  if(D.F.fase==='retomada') return `Você está em retomada: já é uma fase de recuperação. Treinos leves, ~${Math.round(D.F.fator*100)}% do volume de antes.`;
  if(fad) return `Sim, agora é hora de <b>recuperar</b>: ${mtEsc(fad.motivo)}. O resto da semana já ficou leve. Se houver dor que muda sua passada ou que piora correndo, não corra — e procure avaliação se ela persistir.`;
  const ult = rCorridas(D.ctx).slice(-3);
  const rpe = ult.length ? ult.reduce((t,r)=>t+(+r.rpe||5),0)/ult.length : null;
  if(rpe && rpe >= 7.5) return `Seus últimos treinos ficaram com esforço médio de ${Math.round(rpe*10)/10}/10. Vale um dia extra de descanso ou um regenerativo curto antes do próximo treino forte.`;
  return `Pelos seus registros, não há sinal de cansaço acumulado${rpe?` (esforço médio recente: ${Math.round(rpe*10)/10}/10)`:''}. Siga o plano — ${D.F.fase==='recuperacao'?'e esta já é uma semana de recuperação planejada.':'a próxima semana de recuperação vem no ciclo.'}`;
};
MA_ANSWERS.run_meta = function(){
  const D = _rMA(); if(!D) return RUN_SEM_PLANO;
  const MT = rMetas(D.ctx); const goal = rGoal(D.run.setup);
  let t = `Objetivo: <b>${RGOAL[goal].nome}</b>.`;
  const rd = (D.run.setup||{}).raceDate;
  if(rd){ const dias = Math.round((new Date(rd+'T12:00:00') - Date.now())/DIA_MS); if(dias >= 0) t += ` Prova em <b>${dias} dia${dias===1?'':'s'}</b>.`; }
  if(MT.prox) t += `<br><br>Próxima meta: <b>${MT.prox.nome}</b> — ${Math.round((MT.prox.prog||0)*100)}% do caminho.${(MT.prox.req||[]).map(r=>`<br>${r.ok?'✅':'⬜'} ${mtEsc(r.txt)}`).join('')}`;
  const feitas = MT.lista.filter(m=>m.feita);
  if(feitas.length) t += `<br><br>Conquistadas: ${feitas.map(m=>m.nome.replace('Completar ','').replace('Correr ','')).join(' · ')}.`;
  if(D.ref && RGOAL[goal].km && D.M.nivel >= 2){ const est = rPrevisto(D.ref.vdot, RGOAL[goal].km); t += `<br><br>Estimativa hoje para ${RGOAL[goal].nome}: <b>${rFmtMin(est)}</b> (${mtPaceStr(est/RGOAL[goal].km)}) — calculada a partir ${D.ref.fonte}${D.ref.conf==='baixa'?', aproximada':''}.`; }
  else if(RGOAL[goal].km) t += '<br><br>Ainda não tenho dados confiáveis para estimar seu tempo de prova — nada de chute.';
  if(D.M.nivel < (RUN_NIVEL_MIN[goal]||0)) t += `<br><br>Para essa distância o plano ainda está construindo a base (nível atual: ${RN_NOME[D.M.nivel]}). Os treinos específicos entram quando você estiver pronto(a).`;
  return t;
};
MA_ANSWERS.run_ritmos = function(){
  const D = _rMA(); const ctx = D ? D.ctx : runCtx(); const ref = rReferencia(ctx);
  if(!ref) return 'Ainda não tenho dados confiáveis para calcular seus ritmos — e não vou inventar. Por enquanto: <b>leve</b> = você conversa em frases inteiras (esforço 3–4/10); <b>forte</b> = só palavras soltas (7–8/10). Registre corridas com distância e tempo, ou informe um tempo recente na avaliação, que eu calculo.';
  let t = `Seus ritmos (a partir ${ref.fonte}; confiança <b>${({alta:'alta',media:'média',baixa:'baixa — aproximação'})[ref.conf]}</b>):<br>`;
  ['regenerativo','leve','maratona','limiar','intervalado','velocidade'].forEach(k=>{ t += `<br>• <b>${RZ_INFO[k].nome}</b>: ${rFaixa(ref.zonas[k])} (esforço ${RZ_INFO[k].rpe}/10)`; });
  if(ref.reduzida) t += '<br><br>Já descontei a perda de condicionamento da sua pausa recente.';
  t += '<br><br>Calor, subida e cansaço mudam o ritmo: nesses dias, vale o esforço.';
  return t;
};
// perguntas em texto livre
const _maInterpretRunB14 = maInterpret;
maInterpret = function(txt){
  const t = mtNorm(txt);
  const run = /corr|longao|tiro|ritmo|pace|prova|5 ?km|10 ?km|21 ?km|42 ?km|maratona|caminhada/.test(t) || state.active==='run';
  if(run){
    if(/por ?que .*(treino|hoje)|por que (esse|este|o) treino|motivo do treino|explica.*treino/.test(t)) return 'run_hoje';
    if(/(o que|oque) (estou|to|eu estou) (desenvolvendo|trabalhando|treinando)|desenvolv/.test(t)) return 'run_desenvolve';
    if(/(aument|diminu|baix|sub|reduz)\w* (a |o )?(carga|volume|treino|km|minutos)|por que .*(mais leve|mais pesado|aumentou|diminuiu)/.test(t)) return 'run_carga';
    if(/quando .*(avanc|subir de nivel|proximo nivel|evoluir|aumentar)|hora de avancar|proximo estagio/.test(t)) return 'run_avancar';
    if(/(devo|preciso|hora de) (descansar|recuperar|parar)|estou cansad|to cansad|recupera/.test(t)) return 'run_recuperar';
    if(/(minha|a) meta|evolucao .*meta|falta .*(meta|prova)|como (estou|esta) .*(evolu|meta)/.test(t)) return 'run_meta';
    if(/zona|meus ritmos|qual (meu|o) ritmo|ritmo de treino|pace de treino/.test(t)) return 'run_ritmos';
  }
  return _maInterpretRunB14.apply(this, arguments);
};
[['🏃 Por que o treino de hoje?','run_hoje'],['📈 Quando vou avançar?','run_avancar'],['🎯 Como estou na meta?','run_meta'],['⏱️ Meus ritmos','run_ritmos']].forEach(([lbl,key])=>{ if(!MA_SUGGESTIONS.some(s=>s.key===key)) MA_SUGGESTIONS.push({lbl, key}); });

// =====================================================================
// 26. ADMINISTRAÇÃO — acompanhamento da corrida do aluno (somente leitura,
// mesmas permissões de antes: quem já via o aluno vê também isto)
// =====================================================================
mtGancho('openStudent', { depois(email){
  try{
    const u = usuariosCache[email]; const data = u && u.estadoApp; const run = data && data.modules && data.modules.run;
    const box = $('stud-content'); if(!box || !run) return;
    const ctx = runCtx(data); const M = run.plan && run.plan.motor; const p = rPerfil(ctx); const ref = rReferencia(ctx);
    const F = M ? rSemanaFase(ctx, M, rSem()) : null; const cump = M ? rCumprimento(ctx, M, 4) : null;
    const MT = rMetas(ctx); const fad = rFadiga(ctx);
    const lin = (k,v)=>`<div class="list-row" style="cursor:default"><span>${k}</span><b style="text-align:right">${mtEsc(v)}</b></div>`;   // Beta 33: dados do aluno escapados
    window.__admRunData = data;
    box.insertAdjacentHTML('beforeend', `<div class="section-lbl">🏃 Corrida</div><div class="card" style="padding:4px 12px">
      ${lin('Plano', run.plan ? `${(RGOAL[(run.setup||{}).goal]||{}).nome||'—'}${(run.setup||{}).raceDate?' · prova '+new Date(run.setup.raceDate+'T12:00:00').toLocaleDateString('pt-BR'):''}` : 'só registro de atividades')}
      ${M ? lin('Nível / fase', `${RN_NOME[M.nivel]} · ${RFASE[F.fase].nome}${F.fase==='retomada'?` ${F.k}/${F.N}`:''}`) : ''}
      ${M && M.nivel===0 ? lin('Estágio', `${M.estagio} de ${RUN_EST.length-1}`) : ''}${M && M.nivel===1 ? lin('Corrida contínua', `${M.contMin} min`) : ''}
      ${lin('Última corrida', p.ultima ? `${new Date(p.ultima.at).toLocaleDateString('pt-BR')} (${p.diasSemCorrer} dia${p.diasSemCorrer===1?'':'s'})` : '—')}
      ${lin('Média semanal (4 sem.)', p.minSemana!=null ? `${rFmtDurCurta(p.minSemana)}${p.kmSemana?` · ${mtFmtKm(p.kmSemana)} km`:''}` : '—')}
      ${lin('Cumprimento do plano', cump==null?'—':cump+'%')}
      ${lin('Próxima meta', MT.prox ? MT.prox.nome : 'todas conquistadas')}
      ${lin('Ritmos', ref ? `${({alta:'confiança alta',media:'confiança média',baixa:'aproximados'})[ref.conf]}` : 'por esforço (sem dados)')}
      ${fad ? lin('Alerta', `🟡 ${fad.motivo}`) : ''}
    </div><button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openRunPainel(window.__admRunData)">📈 Ver evolução da corrida</button>`);
  }catch(e){ console.log('admin corrida', e); }
}});

Object.assign(window, { runSync, openRunPainel, openRunSemana, runSemanaPrevia, runSemanaAplicar, runSemanaNormal, runLogCalc, runAtualizaDicaNivel, rMontarSemana, rNivelPotencial, rReferencia, rPerfil, rMetas, runCtx, rCriteriosNivel, rSemanaFase });
const _selectSessionRunB14 = window.selectSession;
window.selectSession = function(){ const r = _selectSessionRunB14.apply(this, arguments); try{ _runSelos(); }catch(e){} return r; };

// Retomada para quem está no módulo de corrida: o cartão da Home e o assistente usam o MESMO
// cálculo do plano de corrida (antes falavam em cargas e séries, que são da musculação).
function runTextoRetomada(F, M){
  return `Retomada da corrida depois de ${F.pausa} dias: semana ${F.k} de ${F.N}, com cerca de <b>${Math.round(F.fator*100)}%</b> do volume de antes e só ritmo leve, sem tiros. Mesmo que fique fácil, não acelere nem estique os treinos — a progressão volta depois da retomada.`;
}
const _renderHomeSmartRunB14 = renderHomeSmart;
renderHomeSmart = function(){
  _renderHomeSmartRunB14.apply(this, arguments);
  try{
    if(state.active !== 'run') return;
    const run = state.modules.run; const M = run && run.plan && run.plan.motor; if(!M) return;
    const el = $('home-smart'); if(!el) return;
    const F = rSemanaFase(runCtx(), M, rSem());
    const k = el.querySelector('.smart-k'), p = el.querySelector('.smart-p'), t = el.querySelector('.smart-t');
    if(F.fase === 'retomada'){
      if(!k || !/retomada/i.test(k.textContent)){
        el.innerHTML = `<div class="smart alert"><div style="display:flex;align-items:flex-start;gap:8px"><div class="smart-k" style="flex:1">Em retomada · semana ${F.k} de ${F.N}</div><button onclick="mtLS('mt_smart_fechado', String(mtDia0()));renderHomeSmart()" aria-label="Ocultar hoje" style="background:none;border:0;color:var(--text-mute);font-size:15px;padding:0 2px;cursor:pointer">✕</button></div>
          <div class="smart-t">De volta à corrida, com calma</div><div class="smart-p"></div>
          <div class="smart-a"><button class="btn btn-primary" onclick="goTab('sessions')">Ver treinos</button><button class="btn btn-ghost" onclick="mtPergunta('retomada')">Plano de retomada</button></div></div>`;
      } else if(k) k.textContent = `Em retomada · semana ${F.k} de ${F.N}`;
      const pp = el.querySelector('.smart-p'); if(pp) pp.innerHTML = runTextoRetomada(F, M);
    } else if(k && /retomada/i.test(k.textContent) && p){
      // retomada geral (musculação) mas a corrida já voltou ao normal: avisa sem contradizer o plano de corrida
      p.innerHTML = 'A corrida já saiu da retomada e segue o plano normal. ' + (state.modules.lift ? 'Na musculação, siga a orientação de cargas reduzidas desta semana.' : '');
    }
  }catch(e){}
};
const _maRetomadaRunB14 = MA_ANSWERS.retomada;
MA_ANSWERS.retomada = function(){
  try{
    const run = state.modules.run; const M = run && run.plan && run.plan.motor;
    if(M && (state.active === 'run' || !state.modules.lift)){
      const ctx = runCtx(); const F = rSemanaFase(ctx, M, rSem());
      if(F.fase !== 'retomada'){
        const p = rPerfil(ctx);
        return p.diasSemCorrer == null ? 'Você ainda não tem corridas registradas — então não é retomada, é começo! Siga a primeira semana do plano. 🏃'
          : `Sua última corrida foi há ${p.diasSemCorrer} dia${p.diasSemCorrer===1?'':'s'}. ${p.diasSemCorrer >= 4 ? 'É uma pausa curta: siga o plano normal, começando o primeiro treino bem leve.' : 'Isso é descanso normal.'} A retomada vale para pausas de 7 dias ou mais. ✅`;
      }
      const fat = RET_FAT[F.N-1];
      let t = `${M.retomada && M.retomada.voltou ? 'Você voltou depois de' : 'Faz'} <b>${F.pausa} dias</b> ${M.retomada && M.retomada.voltou ? 'sem correr' : 'sem correr'}. Plano de retomada da corrida:<br>`;
      fat.forEach((f,i)=>{ t += `<br><b>Semana ${i+1}</b> — ~${Math.round(f*100)}% do volume de antes, só treinos leves.${i+1===F.k?' ← <i>você está aqui</i>':''}`; });
      t += `<br><b>Depois</b> — eu avalio como foram essas semanas e só então volto a progredir, uma variável por vez.`;
      const ws = (run.plan.workouts||[]).filter(w=>w.motor);
      if(ws.length) t += `<br><br>Esta semana: ${ws.map(w=>`${w.dayName.toLowerCase()}, ${mtEsc(w.name.toLowerCase())} de ${rFmtDurCurta(w.duration)}`).join(' · ')}.`;
      if(M.retomada && M.retomada.antes && M.retomada.antes.nivel > M.nivel) t += `<br><br>Pela duração da pausa, o nível foi ajustado de ${RN_NOME[M.retomada.antes.nivel]} para ${RN_NOME[M.nivel]}. Você não começa do zero — o corpo recupera rápido o que já conquistou.`;
      else t += '<br><br>Você não começa do zero: o corpo recupera rápido o que já conquistou. Mas mesmo que fique fácil, não acelere nem estique os treinos durante a retomada.';
      if(state.modules.lift) t += '<br><br>Na musculação, a retomada tem regra própria de cargas — pergunte com o módulo de musculação ativo.';
      return t;
    }
  }catch(e){}
  return _maRetomadaRunB14.apply(this, arguments);
};

// =====================================================================
// 27. DATA DA PROVA REMOVÍVEL + ENCERRAR PLANO DE MUSCULAÇÃO (Beta 15)
// =====================================================================
// --- prova alvo: botão para tirar a data (no celular o campo de data não tem "limpar") ---
function runLimparProva(){
  const d = $('run-race-date'), t = $('run-race-time');
  if(d) d.value = ''; if(t) t.value = '';
  _runProvaBtn();
  try{ runAtualizaDicaNivel(); }catch(e){}
  toast('Data da prova removida. Ela sai do plano ao salvar.');
}
function _runProvaBtn(){
  const d = $('run-race-date'); if(!d) return;
  let b = $('run-race-clear');
  if(!b){
    b = document.createElement('button'); b.type = 'button'; b.id = 'run-race-clear'; b.className = 'run-race-clear';
    b.textContent = '✕ Sem prova (remover data)'; b.onclick = runLimparProva;
    const row = d.closest('.row'); if(row) row.after(b);
  }
  b.style.display = d.value ? '' : 'none';
}
const _openSetupProvaB15 = window.openSetupScreen;
window.openSetupScreen = function(m){
  const r = _openSetupProvaB15.apply(this, arguments);
  if(m === 'run'){ try{ const d = $('run-race-date'); if(d && !d._b15){ d._b15 = true; ['input','change'].forEach(ev=>d.addEventListener(ev, _runProvaBtn)); } _runProvaBtn(); }catch(e){} }
  return r;
};

// --- encerrar o plano de musculação (igual ao que a corrida já tinha) ---
// O plano sai; histórico, cargas, recordes, fotos e conquistas ficam.
function encerrarPlanoLift(){
  const lift = state.modules.lift;
  if(!lift || !lift.plan){ toast('Você não tem um plano de musculação ativo.'); return; }
  const temCorrida = !!(state.modules.run && state.modules.run.plan);
  appConfirm(`Seu histórico de treinos, cargas, recordes, fotos e conquistas são mantidos. ${temCorrida ? 'O app passa a mostrar o seu plano de corrida.' : 'Você pode montar um novo plano quando quiser.'}`, ()=>{
    lift.planoEncerrado = { at: Date.now(), setup: lift.setup ? JSON.parse(JSON.stringify(lift.setup)) : null };
    lift.plan = null;
    if(temCorrida) state.active = 'run';
    saveData();
    toast('✅ Plano de musculação encerrado. Seu histórico foi mantido. 💚');
    goTab('home');
  }, {title:'Encerrar plano de musculação?', emo:'🏋️', okLabel:'Sim, encerrar plano', danger:true});
}
// a tela "sem plano" era só da corrida: agora se adapta ao módulo
let _runlogHtmlOrig = null;
const _renderRunLogB15 = renderRunLogScreen;
window.renderRunLogScreen = function(){
  const scr = $('scr-runlog'); if(!scr) return _renderRunLogB15.apply(this, arguments);
  if(_runlogHtmlOrig === null) _runlogHtmlOrig = scr.innerHTML;
  if(state.active !== 'lift'){
    if(scr.dataset.modo === 'lift'){ scr.innerHTML = _runlogHtmlOrig; scr.dataset.modo = ''; }
    return _renderRunLogB15.apply(this, arguments);
  }
  const lift = state.modules.lift || {};
  const n = (lift.history||[]).length;
  const quando = lift.planoEncerrado ? new Date(lift.planoEncerrado.at).toLocaleDateString('pt-BR') : null;
  const temCorrida = !!(state.modules.run && state.modules.run.plan);
  scr.dataset.modo = 'lift';
  scr.innerHTML = `<div class="wrap" style="padding-left:16px;padding-right:16px"><div id="runlog-toggle-wrap"></div>
    <div style="text-align:center;margin-top:14px">
      <div style="font-size:52px">🏋️</div>
      <h2 style="margin:8px 0 4px">Musculação sem plano</h2>
      <p style="color:var(--text-dim);font-size:14px;line-height:1.5">${quando ? `Plano encerrado em ${quando}. ` : ''}${n ? `Seus ${n} treinos registrados, cargas, recordes e conquistas continuam salvos.` : 'Seu histórico e suas conquistas continuam salvos.'}</p>
    </div>
    <div class="card" style="margin-top:18px;padding:16px">
      <div class="card-title" style="margin-bottom:4px">🎯 Quer voltar a ter treinos guiados?</div>
      <div class="card-sub" style="margin-bottom:12px">Monte um novo plano de musculação, calistenia ou híbrido. A progressão parte das cargas que você já registrou.</div>
      <button class="btn btn-primary btn-block" onclick="openSetupScreen('lift')">🏋️ Montar plano de musculação</button>
    </div>
    <div class="card" style="margin-top:12px;padding:16px">
      <div class="card-title" style="margin-bottom:4px">📊 Seu histórico</div>
      <div class="card-sub" style="margin-bottom:12px">Treinos antigos, cargas e evolução continuam no Histórico e no Progresso.</div>
      <button class="btn btn-outline btn-block" style="border-color:rgba(var(--primary-rgb),.4)" onclick="goTab('history')">📅 Ver histórico</button>
    </div>
    ${temCorrida ? `<button class="btn btn-ghost btn-block" style="margin-top:14px;color:var(--text-dim)" onclick="switchModule('run')">🏃 Ir para o plano de corrida</button>` : ''}</div>`;
  try{ renderModToggle(); }catch(e){}
};
// Perfil: o botão de encerrar aparece para o módulo ativo (corrida ou musculação)
mtGancho('renderProfile', { depois(){
  try{
    const b = $('pf-cancel-run'); if(!b) return;
    const mod = state.modules[state.active];
    const tem = !!(mod && mod.plan);
    b.classList.toggle('hidden', !tem);
    if(state.active === 'lift'){ b.textContent = '🗑️ Encerrar plano de musculação (manter histórico)'; b.onclick = encerrarPlanoLift; }
    else { b.textContent = '🗑️ Encerrar plano de corrida (manter só registros)'; b.onclick = cancelRunPlan; }
  }catch(e){}
}});
Object.assign(window, { runLimparProva, encerrarPlanoLift });
// "qual meu treino de hoje?" / "treino de hoje" → mesma resposta de "qual o treino de hoje?"
const _maInterpretB15 = maInterpret;
maInterpret = function(txt){
  const t = mtNorm(txt);
  if(!/por ?que/.test(t) && /^(qual|qual e|o que|oque|que)?\s*(e\s*)?(o\s*|meu\s*|o meu\s*)?treino (de|pra|para) hoje\??$|qual (e )?(o )?meu treino (de|pra|para) hoje/.test(t.trim())) return 'proximo';
  return _maInterpretB15.apply(this, arguments);
};

// =====================================================================
// 28. CONQUISTAS — detalhe animado e Conquista Especial em duas etapas (Beta 17)
// Nada muda nos critérios, datas, ids ou no desbloqueio: só a apresentação.
// =====================================================================
// --- conquista normal: medalha entra com brilho discreto (não é a celebração de desbloqueio) ---
const _openTrophyDetailB17 = window.openTrophyDetail;
window.openTrophyDetail = function(id){
  const r = _openTrophyDetailB17.apply(this, arguments);
  try{
    const box = $('modal-inner'); const med = box && box.querySelector('.anim-check'); if(!med) return r;
    const t = TROPHIES.find(x=>x.id===id) || {};
    med.classList.remove('anim-check');
    const wrap = document.createElement('div');
    wrap.className = 'tr-medal' + (t.secret ? ' tr-secreta' : '');
    wrap.innerHTML = `<span class="tr-glow" aria-hidden="true"></span><span class="tr-ring" aria-hidden="true"></span>${Array.from({length:8},(_,i)=>`<i style="--a:${i*45+22}deg;--d:${(i%3)*60}ms" aria-hidden="true"></i>`).join('')}`;
    med.parentNode.insertBefore(wrap, med); wrap.appendChild(med); med.classList.add('tr-ico');
    const h3 = wrap.parentNode.querySelector('h3'); if(h3) h3.classList.add('tr-nome');
  }catch(e){}
  return r;
};

// --- Conquista Especial: primeiro a conquista; a história é opcional ---
function openSpecialTrophy(){
  const sp = state.specialTrophy; if(!sp){ toast('Nenhuma conquista especial por aqui.'); return; }
  try{ closeModal(); }catch(e){}
  const dados = _saDadosTrofeu(sp);
  saPalco(dados, { id:'special-view', vel: 2.2, acoesEm: 5.8, reserva: 150,
    topo:`<button class="sa-x" aria-label="Fechar" onclick="saFecharPalco()">✕</button>`,
    acoes:`<div class="sa-acoes-col"><button class="btn btn-primary sa-reviver" onclick="saReviverHistoria()">✨ Reviver minha história</button>
      <div class="sa-opc">A história completa é opcional — leva cerca de ${Math.max(1, Math.round(((dados.frases||[]).length||3) * 6 / 60))} min.</div>
      <div class="sa-acoes-row">${typeof saFormatoVideo==='function' ? `<button class="btn btn-ghost" onclick="saFecharPalco();setTimeout(openMinhaConquistaShare,350)">Compartilhar</button>` : ''}<button class="btn btn-ghost" onclick="saFecharPalco()">Fechar</button></div></div>` });
}
function saReviverHistoria(){
  document.querySelectorAll('.sa-stage').forEach(ov=>{ try{ ov.__parar && ov.__parar(); }catch(e){} ov.remove(); });
  showSpecialReveal(state.specialTrophy, { reviver:true });
}
// cartão na tela de Conquistas: abre a conquista, não a história
const _openTrophiesB17 = window.openTrophies;
window.openTrophies = function(){
  const r = _openTrophiesB17.apply(this, arguments);
  try{
    const card = [...document.querySelectorAll('#modal-inner [onclick*="showSpecialReveal"]')][0];
    if(card){
      card.setAttribute('onclick', 'openSpecialTrophy()'); card.setAttribute('role','button'); card.setAttribute('tabindex','0');
      card.classList.add('sa-card');
      card.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openSpecialTrophy(); } });
      const leg = [...card.querySelectorAll('div')].find(d=>/reviver este momento/i.test(d.textContent));
      if(leg) leg.textContent = 'Toque para ver sua conquista · a história completa é opcional';
    }
  }catch(e){}
  return r;
};
// a revelação automática acontece uma vez por conquista — também registrada na conta (não só no aparelho)
const _checkSpecialB17 = window.checkSpecialAward;
window.checkSpecialAward = function(trigger){
  try{
    const sa = specialAward;
    if(sa && sa.titulo){
      const chave = 'metatreino_special_shown_'+(sa.data||'now')+'_'+(sa.atualizadoEm||'');
      if(state.specialTrophy && state.specialTrophy.revelada === chave){ try{ localStorage.setItem(chave, '1'); }catch(e){} return; }
      window.__saChave = chave;
    }
  }catch(e){}
  return _checkSpecialB17.apply(this, arguments);
};
// a chave da revelação vai junto quando a revelação automática salva a conquista
const _showRevealB17 = showSpecialReveal;
showSpecialReveal = function(sa, opts){
  opts = Object.assign({}, opts||{});
  if(!opts.reviver && !opts.chave && window.__saChave) opts.chave = window.__saChave;
  return _showRevealB17.call(this, sa, opts);
};

// --- compartilhar a própria conquista (quem recebeu) ---
// Usa só o que é da conquista: símbolo, nome, título, mensagem e data. Sem e-mail ou outro dado pessoal.
function openMinhaConquistaShare(){
  const sp = state.specialTrophy; if(!sp){ return; }
  const dados = _saDadosTrofeu(sp); const fmt = saFormatoVideo();
  $('modal-inner').innerHTML = `<h3>Compartilhar conquista</h3>
    <p class="mt-muted" style="margin:0 0 10px">Vídeo vertical 9:16 (${String(SA_DUR).replace('.',',')} s) com seu nome, a conquista, a mensagem e a data — sem e-mail nem outros dados.</p>
    <div class="adm-form"><label>Nome que aparece</label><input class="input" id="sa-nome-minha" maxlength="40" value="${mtEsc(dados.nome)}"></div>
    ${fmt ? `<button class="btn btn-primary btn-block" style="margin-top:12px" id="sa-vid-minha" onclick="saMinhaVideo()">🎬 Gerar vídeo${fmt.ext==='mp4'?' (MP4)':''}</button>`
      : `<div class="note" style="margin-top:12px"><div class="note-line">Este navegador não consegue gravar vídeo. Use a imagem — ou abra o MetaTreino no Chrome atualizado.</div></div>`}
    ${fmt && fmt.ext!=='mp4' ? `<p class="mt-muted" style="font-size:11.5px;margin-top:6px">Este navegador grava em WebM. O WhatsApp e o Instagram nem sempre aceitam WebM — se não abrir lá, use a imagem.</p>`:''}
    <div id="sa-prog-minha" class="mt-muted" style="font-size:12px;margin-top:8px;min-height:18px"></div>
    <button class="btn btn-ghost btn-block" style="margin-top:6px" onclick="saMinhaImagem()">🖼️ Compartilhar como imagem</button>
    <button class="btn btn-ghost btn-block" style="margin-top:6px" onclick="closeModal();setTimeout(openSpecialTrophy,250)">Voltar à conquista</button>`;
  $('modal-back').classList.add('on');
}
function _saMinhaDados(){ const d = _saDadosTrofeu(); const n = ($('sa-nome-minha')||{}).value; if(n != null) d.nome = String(n).trim().slice(0,40); delete d.frases; return d; }
async function saMinhaVideo(){
  const d = _saMinhaDados();
  await mtComBotao('sa-vid-minha', 'Gravando vídeo…', async ()=>{
    const p = $('sa-prog-minha');
    const r = await saGravarVideo(d, f=>{ if(p) p.textContent = `Gravando… ${Math.round(f*SA_DUR*10)/10} de ${String(SA_DUR).replace('.',',')} s`; });
    if(p) p.textContent = `Vídeo pronto (${(r.blob.size/1048576).toFixed(1).replace('.',',')} MB, ${r.ext.toUpperCase()}).`;
    const res = await saCompartilharArquivo(r.blob, `minha-conquista-metatreino.${r.ext}`, `${d.titulo} — MetaTreino`);
    if(res==='baixado') toast('Vídeo salvo nos downloads do aparelho.');
  });
}
async function saMinhaImagem(){
  const d = _saMinhaDados(); const b = await saImagemFinal(d);
  const res = await saCompartilharArquivo(b, 'minha-conquista-metatreino.png', `${d.titulo} — MetaTreino`);
  if(res==='baixado') toast('Imagem salva nos downloads do aparelho.');
}
Object.assign(window, { openSpecialTrophy, saReviverHistoria, openMinhaConquistaShare, saMinhaVideo, saMinhaImagem });

// =====================================================================
// 29. AJUSTES DA BETA 18
//   a. balão do Meta Assistente: cada aviso aparece uma vez, por alguns segundos
//   b. mural e logo: enquadramento, prévias no tamanho real e proporções recomendadas
//   c. anotações automáticas do dia no calendário (calculadas, sem gravar nada novo)
// =====================================================================

// ---------- a. balão do Meta Assistente ----------
// Antes: o balão voltava a cada troca de aba (a função roda em toda navegação), ficando quase fixo.
// Agora: cada aviso aparece UMA vez por alguns segundos e some; o botão continua colorido e, ao tocar,
// o assistente abre começando pelo aviso.
const FAB_VISTOS_KEY = 'mt_fab_vistos';
function _fabVistos(){ try{ const o = JSON.parse(localStorage.getItem(FAB_VISTOS_KEY)||'{}'); const lim = Date.now() - 24*3600000; Object.keys(o).forEach(k=>{ if(o[k] < lim) delete o[k]; }); return o; }catch(e){ return {}; } }
function _fabEsconde(imediato){
  const b = document.getElementById('fab-bubble'); if(!b) return;
  clearTimeout(window._fabBubbleT);
  if(imediato){ b.classList.remove('on'); b.style.display = 'none'; return; }
  b.classList.remove('on'); setTimeout(()=>{ if(!b.classList.contains('on')) b.style.display = 'none'; }, 320);
}
window.updateFabNudge = function(){
  const fab = document.getElementById('ma-fab'); if(!fab) return;
  let n = null; try{ n = maNudge(); }catch(e){}
  fab.classList.remove('fab-curio','fab-important','fab-rare','fab-special','fab-alert');
  if(!n){ maNudgeAtivo = null; _fabEsconde(true); return; }
  fab.classList.add('fab-alert','fab-'+(n.tone||'important'));
  maNudgeAtivo = n;
  const naSessao = (state.ui && state.ui.tab) === 'sessions';
  const vistos = _fabVistos();
  const chave = String(n.text||'').slice(0,120);
  if(naSessao || vistos[chave]) return;               // já mostrado: só o botão colorido indica que há algo
  vistos[chave] = Date.now(); try{ localStorage.setItem(FAB_VISTOS_KEY, JSON.stringify(vistos)); }catch(e){}
  let bubble = document.getElementById('fab-bubble');
  if(!bubble){ bubble = document.createElement('div'); bubble.id = 'fab-bubble'; bubble.setAttribute('role','status'); document.body.appendChild(bubble); bubble.onclick = function(){ _fabEsconde(true); openAssistant(); }; }
  bubble.textContent = n.text;
  bubble.style.display = 'block';
  requestAnimationFrame(()=>bubble.classList.add('on'));
  clearTimeout(window._fabBubbleT);
  const dur = Math.min(9000, Math.max(5000, 3500 + String(n.text).length*45));   // tempo de leitura
  window._fabBubbleT = setTimeout(()=>_fabEsconde(false), dur);
};
// abrir o assistente também recolhe o balão
const _openAssistantB18 = window.openAssistant;
window.openAssistant = function(){ _fabEsconde(true); return _openAssistantB18.apply(this, arguments); };

// ---------- b. mural e logo ----------
const MUR = { LOGO:256, CAPA_W:1440, CAPA_H:600, CAPA_AR:2.4, LIMITE_KB:900 };
let _murEd = null;
function _murAtuais(){
  const m = coachMural || {};
  // dados antigos: uma única foto servia de logo e de capa
  const capa = m.capaFoto || (m.capa ? m.foto : null);
  const logo = m.capaFoto ? (m.foto || null) : (m.capa ? null : (m.foto || null));
  return { capa, logo, usarCapa: !!(m.capa && capa) };
}
window.openMuralAdmin = function(){
  const m = coachMural || {}; const at = _murAtuais();
  _murEd = { logo:{ img:null, out:undefined, atual:at.logo, modo:'preencher', zoom:1, x:50, y:50, w:0, h:0 },
             capa:{ img:null, out:undefined, atual:at.capa, zoom:1, x:50, y:50, w:0, h:0 }, usarCapa: at.usarCapa };
  const sl = (id, rot, min, max, val, step)=>`<label class="mur-sl"><span>${rot}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step||1}" value="${val}"></label>`;
  $('modal-inner').innerHTML = `
    <h3>📢 Mural e logo do app</h3>
    <p style="color:var(--text-dim);font-size:13px;line-height:1.5;margin-top:4px">A mensagem fica fixada na tela Hoje de todos os alunos. O logo substitui o "M" dos cabeçalhos; a capa (opcional) vira um banner na tela Hoje.</p>
    <div class="field" style="margin-top:12px"><label>Mensagem fixada (vazio = sem mensagem)</label><textarea class="input" id="mural-msg" rows="3" style="resize:vertical">${(m.mensagem||'').replace(/</g,'&lt;')}</textarea></div>

    <div class="mur-sec">
      <div class="mur-h">Logo do app</div>
      <div class="mur-logo-row">
        <div class="mur-logo-big" id="mur-logo-big"></div>
        <div class="mur-logo-real"><div class="mur-logo-mini" id="mur-logo-mini"></div><div class="mur-logo-hdr"><div class="mur-logo-mini sm" id="mur-logo-mini2"></div><b>METATREINO</b></div><small>como aparece no app</small></div>
      </div>
      <div class="mur-dica">📐 <b>Quadrada (1:1)</b>, de <b>512 × 512 px</b> ou maior. PNG com fundo transparente fica melhor. Abaixo de 160 × 160 px a imagem fica borrada.</div>
      <div class="mur-info" id="mur-logo-info"></div>
      <div id="mur-logo-aj" class="mur-aj" hidden>
        <div class="mod-toggle" style="margin:0 0 8px"><button class="seg on" id="mur-logo-m1" onclick="murLogoModo('preencher')">Preencher (corta)</button><button class="seg" id="mur-logo-m2" onclick="murLogoModo('inteira')">Inteira (sem cortar)</button></div>
        <div id="mur-logo-sls">${sl('mur-logo-z','Zoom',100,300,100)}${sl('mur-logo-x','Horizontal',0,100,50)}${sl('mur-logo-y','Vertical',0,100,50)}</div>
      </div>
      <div class="row" style="gap:8px;margin-top:8px"><button class="btn btn-ghost" style="flex:1" onclick="$('mur-logo-file').click()">📷 Escolher logo</button><button class="btn btn-ghost" id="mur-logo-rm" onclick="murRemover('logo')">🗑️ Remover</button></div>
      <input type="file" id="mur-logo-file" accept="image/*" style="display:none" onchange="murArquivo(event,'logo')">
    </div>

    <div class="mur-sec">
      <div class="list-row" style="margin:0;padding:10px 0;border:0;background:none" onclick="murToggleCapa()">
        <span style="font-size:17px">🖼️</span>
        <div style="flex:1"><div style="font-weight:700;font-size:13.5px">Capa larga na tela Hoje</div><div style="font-size:11.5px;color:var(--text-mute);line-height:1.45">Banner com a saudação por cima. Usa uma imagem própria, separada do logo.</div></div>
        <input type="checkbox" id="mur-capa-on" ${_murEd.usarCapa?'checked':''} style="pointer-events:none">
      </div>
      <div id="mur-capa-box" ${_murEd.usarCapa?'':'hidden'}>
        <div class="mur-capa-prev" id="mur-capa-prev"><div class="mur-capa-bg" id="mur-capa-bg"></div><div class="hero-scrim"></div><div class="mur-capa-txt"><b>Bom dia, ${mtEsc(((state.user&&state.user.name)||'Aluno').split(' ')[0])}! 👋</b><small>Treino de hoje: Peito e Tríceps</small></div></div>
        <div class="mur-dica">📐 <b>Horizontal, proporção 2,4 : 1</b> — por exemplo <b>1440 × 600 px</b> (2 : 1 também serve). Deixe o assunto principal no centro e no alto: a parte de baixo recebe a saudação, e as bordas podem variar um pouco entre celulares. Evite textos na imagem.</div>
        <div class="mur-info" id="mur-capa-info"></div>
        <div id="mur-capa-aj" class="mur-aj" hidden>${sl('mur-capa-z','Zoom',100,300,100)}${sl('mur-capa-x','Horizontal',0,100,50)}${sl('mur-capa-y','Vertical',0,100,50)}</div>
        <div class="row" style="gap:8px;margin-top:8px"><button class="btn btn-ghost" style="flex:1" onclick="$('mur-capa-file').click()">📷 Escolher capa</button><button class="btn btn-ghost" id="mur-capa-rm" onclick="murRemover('capa')">🗑️ Remover</button></div>
        <input type="file" id="mur-capa-file" accept="image/*" style="display:none" onchange="murArquivo(event,'capa')">
      </div>
    </div>
    <div class="mur-info" id="mur-peso" style="text-align:center"></div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="saveMural()">💾 Publicar para todos os alunos</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`;
  $('modal-back').classList.add('on');
  ['logo','capa'].forEach(t=>['z','x','y'].forEach(c=>{ const el = $(`mur-${t}-${c}`); if(el) el.addEventListener('input', ()=>{ const E = _murEd[t]; E[c==='z'?'zoom':c] = c==='z' ? (+el.value)/100 : +el.value; murProcessar(t); }); }));
  murPrevias();
};
function murToggleCapa(){ const c = $('mur-capa-on'); c.checked = !c.checked; _murEd.usarCapa = c.checked; $('mur-capa-box').hidden = !c.checked; murPrevias(); }
function murLogoModo(m){ _murEd.logo.modo = m; $('mur-logo-m1').classList.toggle('on', m==='preencher'); $('mur-logo-m2').classList.toggle('on', m==='inteira'); $('mur-logo-sls').style.display = m==='preencher' ? '' : 'none'; murProcessar('logo'); }
function murRemover(t){ const E = _murEd[t]; E.out = null; E.img = null; const aj = $(`mur-${t}-aj`); if(aj) aj.hidden = true; const i = $(`mur-${t}-info`); if(i) i.textContent = t==='logo' ? 'Logo removido: os cabeçalhos voltam a mostrar o "M".' : 'Capa removida.'; murPrevias(); }
function murArquivo(ev, t){
  const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{ const img = new Image(); img.onload = ()=>{ const E = _murEd[t]; E.img = img; E.w = img.naturalWidth; E.h = img.naturalHeight; E.png = /png|webp|gif|svg/i.test(f.type); E.zoom = 1; E.x = 50; E.y = 50;
      ['z','x','y'].forEach(c=>{ const el = $(`mur-${t}-${c}`); if(el) el.value = c==='z' ? 100 : 50; });
      const aj = $(`mur-${t}-aj`); if(aj) aj.hidden = false; murProcessar(t); };
    img.onerror = ()=>toast('Não consegui abrir essa imagem. Tente JPG ou PNG.'); img.src = r.result; };
  r.readAsDataURL(f);
}
// recorte: maior área com a proporção pedida (cobre), com zoom e posição escolhidos pelo admin
function _murRecorte(E, ar){
  let cw = E.w, ch = cw/ar; if(ch > E.h){ ch = E.h; cw = ch*ar; }
  cw /= E.zoom; ch /= E.zoom;
  return { sx:(E.w-cw)*E.x/100, sy:(E.h-ch)*E.y/100, cw, ch };
}
function _murTemAlfa(cv){ try{ const d = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data; for(let i=3;i<d.length;i+=16) if(d[i] < 250) return true; }catch(e){} return false; }
let _murT = null;
function murProcessar(t){ clearTimeout(_murT); _murT = setTimeout(()=>_murProcessarJa(t), 60); }
function _murProcessarJa(t){
  const E = _murEd && _murEd[t]; if(!E || !E.img) return;
  const cv = document.createElement('canvas'); const g = cv.getContext('2d');
  const info = $(`mur-${t}-info`); const msgs = [];
  if(t === 'logo'){
    cv.width = MUR.LOGO; cv.height = MUR.LOGO;
    if(E.modo === 'inteira'){
      const esc = Math.min(MUR.LOGO/E.w, MUR.LOGO/E.h); const w = E.w*esc, h = E.h*esc;
      g.drawImage(E.img, (MUR.LOGO-w)/2, (MUR.LOGO-h)/2, w, h);
      if(Math.min(E.w, E.h) < 160) msgs.push(`⚠️ Imagem pequena (${E.w} × ${E.h} px): pode ficar borrada. Ideal: 512 × 512 px ou maior.`);
    } else {
      const c = _murRecorte(E, 1); g.drawImage(E.img, c.sx, c.sy, c.cw, c.ch, 0, 0, MUR.LOGO, MUR.LOGO);
      if(c.cw < 160) msgs.push(`⚠️ A área usada tem ${Math.round(c.cw)} × ${Math.round(c.ch)} px: vai ficar borrada. Ideal: 512 × 512 px ou maior.`);
      if(Math.abs(E.w/E.h - 1) > 0.08) msgs.push(`ℹ️ A imagem não é quadrada (${E.w} × ${E.h} px): parte dela fica de fora. Ajuste o enquadramento ou use "Inteira".`);
    }
    const alfa = E.png && _murTemAlfa(cv);
    E.out = alfa ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.86);
    if(!msgs.length) msgs.push(`✅ Boa resolução (${E.w} × ${E.h} px)${alfa ? ' · fundo transparente mantido' : ''}.`);
  } else {
    const c = _murRecorte(E, MUR.CAPA_AR);
    const W = Math.round(Math.min(MUR.CAPA_W, Math.max(720, c.cw))), H = Math.round(W/MUR.CAPA_AR);
    cv.width = W; cv.height = H; g.drawImage(E.img, c.sx, c.sy, c.cw, c.ch, 0, 0, W, H);
    E.out = cv.toDataURL('image/jpeg', 0.80);
    if(c.cw < 900) msgs.push(`⚠️ A área usada tem ${Math.round(c.cw)} × ${Math.round(c.ch)} px: pode ficar borrada em telas maiores. Ideal: 1440 × 600 px ou maior.`);
    const ar = E.w/E.h;
    if(ar < 1.9) msgs.push(`ℹ️ Imagem ${ar < 1 ? 'vertical' : 'pouco larga'} (${E.w} × ${E.h} px): boa parte de cima e de baixo fica de fora. Use o ajuste vertical para escolher o trecho.`);
    else if(ar > 2.9) msgs.push(`ℹ️ Imagem muito larga (${E.w} × ${E.h} px): as laterais ficam de fora.`);
    if(!msgs.length) msgs.push(`✅ Boa resolução e proporção (${E.w} × ${E.h} px).`);
  }
  if(info) info.innerHTML = msgs.join('<br>');
  murPrevias();
}
function _murImgLogo(){ const E = _murEd.logo; return E.out === null ? null : (E.out || E.atual); }
function _murImgCapa(){ const E = _murEd.capa; return E.out === null ? null : (E.out || E.atual); }
function murPrevias(){
  if(!_murEd) return;
  const lg = _murImgLogo();
  const htmlLogo = lg ? `<img src="${lg}" alt="">` : 'M';
  ['mur-logo-big','mur-logo-mini','mur-logo-mini2'].forEach(id=>{ const el = $(id); if(el){ el.innerHTML = htmlLogo; el.classList.toggle('vazio', !lg); } });
  const rmL = $('mur-logo-rm'); if(rmL) rmL.disabled = !lg;
  const cp = _murImgCapa();
  const bg = $('mur-capa-bg'); if(bg) bg.style.backgroundImage = cp ? `url('${cp}')` : 'none';
  const pv = $('mur-capa-prev'); if(pv) pv.classList.toggle('vazio', !cp);
  const rmC = $('mur-capa-rm'); if(rmC) rmC.disabled = !cp;
  // tamanho total (o documento do Firestore aceita até 1 MB)
  const kb = Math.round(((lg||'').length + ((_murEd.usarCapa && cp) ? cp.length : 0) + 2000)/1024);
  const p = $('mur-peso'); if(p) p.innerHTML = kb > MUR.LIMITE_KB ? `⚠️ Total ${kb} KB — passa do limite. Use imagens menores ou aumente o zoom.` : `Tamanho total: ${kb} KB ✅`;
}
window.saveMural = async function(){
  if(!_murEd){ return; }
  const msg = $('mural-msg').value.trim();
  const logo = _murImgLogo(), capa = _murImgCapa();
  const usarCapa = !!(_murEd.usarCapa && capa);
  const kb = Math.round(((logo||'').length + (usarCapa ? capa.length : 0))/1024);
  if(kb > MUR.LIMITE_KB){ toast('⚠️ Imagens grandes demais para publicar. Ajuste e tente de novo.'); return; }
  const data = { mensagem: msg, atualizadoEm: Date.now(), foto: logo || null, capa: usarCapa, capaFoto: usarCapa ? capa : null };
  try{
    await db.collection('config').doc('mural').set(data);
    coachMural = data; _murEd = null;
    try{ localStorage.setItem('metatreino_mural', JSON.stringify(coachMural)); }catch(e){}
    renderCoachMural(); try{ applyHeroCapa(); }catch(e){}
    closeModal(); toast('📢 Mural publicado para todos os alunos!');
  }catch(e){ console.log('Erro ao salvar mural:', e); toast('⚠️ Não foi possível publicar. Confira a conexão e as regras do Firestore (coleção config).'); }
};
// capa e logo agora podem ser imagens diferentes
window.applyHeroCapa = function(){
  try{
    const hero = $('home-hero'); if(!hero) return;
    const foto = coachMural && (coachMural.capaFoto || coachMural.foto);
    const usar = !!(foto && coachMural && coachMural.capa);
    hero.classList.toggle('hidden', !usar);
    const brandRow = $('home-brand-row'), greetRow = $('home-greet-row');
    if(brandRow) brandRow.classList.toggle('hidden', usar);
    if(greetRow) greetRow.classList.toggle('hidden', usar);
    if(!usar) return;
    const bg = $('home-hero-bg'); if(bg) bg.style.backgroundImage = `url('${foto}')`;
    const hi = $('home-hi'), sub = $('home-goal');
    if(hi && $('hero-hi')) $('hero-hi').innerHTML = hi.innerHTML;
    if(sub && $('hero-sub')) $('hero-sub').innerHTML = sub.innerHTML;
  }catch(e){ console.log('Erro na capa:', e); }
};

// ---------- c. anotações automáticas do dia ----------
// Calculadas na hora a partir do que o app JÁ guarda (treinos, cargas, recordes, provas, conquistas, metas).
// Nada novo vai para o banco: só quando o aluno remove um destaque fica uma marca curta (ex.: "carga:supino").
function _dia0(t){ const d = new Date(t); d.setHours(0,0,0,0); return d.getTime(); }
function _nomeEx(id){ try{ return nomeDoEx(id); }catch(e){ return id; } }
function dayAutoNotes(ts){
  const out = []; const ini = _dia0(ts), fim = ini + DIA_MS;
  const noDia = t => t >= ini && t < fim;
  const lifts = ((state.modules.lift && state.modules.lift.history)||[]).filter(h=>h && noDia(h.at));
  const ativ = ((state.modules.run && state.modules.run.history)||[]).filter(h=>h && noDia(h.at));
  // modo adaptado registrado no próprio treino (TPM, cólica, dor, cansaço)
  const ad = lifts.map(h=>h.adaptedWith).filter(Boolean)[0];
  if(ad){
    const tpm = /TPM/.test(ad), col = /cólica/.test(ad), dor = /dor/.test(ad), cans = /cansaço/.test(ad);
    const emo = (tpm||col) ? '💗' : dor ? '🩹' : '😮‍💨';
    out.push({ k:'adapt', emo, txt: `Treinou ${[tpm?'em TPM':'', col?'com cólica':'', dor ? 'com '+((ad.match(/dor \([^)]*\)/)||['dor'])[0]) : '', cans?'cansado(a), no modo leve':''].filter(Boolean).join(' e ')} — e foi mesmo assim.` });
  }
  if(lifts.some(h=>h.feel==='exausto')) out.push({ k:'feel', emo:'🥵', txt:'Treino muito puxado: você marcou "exausto".' });
  // recordes e cargas
  const prs = state.prs || {}; const prHoje = new Set();
  Object.keys(prs).forEach(id=>{ const p = prs[id]; if(p && p.at && noDia(p.at)){ prHoje.add(id); out.push({ k:'pr:'+id, emo:'🏆', txt:`Recorde em ${_nomeEx(id)}: ${p.peso>0 ? String(p.peso).replace('.',',')+' kg × '+p.reps : p.reps+' repetições'}` }); } });
  const subidas = [];
  Object.keys(state.progress||{}).forEach(id=>{
    if(prHoje.has(id)) return;
    try{ if(typeof exBankIsIso==='function' && exBankIsIso(id)) return; }catch(e){}
    const arr = (state.progress[id]||[]).filter(p=>p && p.date && p.sets && p.sets.length);
    const hoje = arr.filter(p=>noDia(p.date)); if(!hoje.length) return;
    const antes = arr.filter(p=>p.date < ini).sort((a,b)=>b.date-a.date)[0]; if(!antes) return;
    const max = l => Math.max(0, ...l.sets.map(s=>+s.peso||0));
    const de = max(antes), para = Math.max(...hoje.map(max));
    if(de > 0 && para > de) subidas.push({ id, de, para });
  });
  subidas.slice(0,3).forEach(s=>out.push({ k:'carga:'+s.id, emo:'⬆️', txt:`Subiu carga em ${_nomeEx(s.id)}: ${String(s.de).replace('.',',')} → ${String(s.para).replace('.',',')} kg` }));
  if(subidas.length > 3) out.push({ k:'carga+', emo:'⬆️', txt:`Subiu carga em mais ${subidas.length-3} exercício${subidas.length-3>1?'s':''}: ${subidas.slice(3).map(s=>_nomeEx(s.id)).join(', ')}` });
  // corrida
  const S = state.corridaStats || {};
  ativ.filter(r=>r.isRace).forEach(r=>out.push({ k:'prova', emo:'🏅', txt:`Prova: ${mtFmtKm(r.distance)} km em ${typeof rFmtMin==='function' ? rFmtMin(r.duration) : Math.round(r.duration)+' min'}` }));
  [['3','3 km'],['5','5 km'],['10','10 km'],['21','21 km'],['42','42 km']].forEach(([k,n])=>{ const r = (S.recordes||{})[k]; if(r && noDia(r.at)) out.push({ k:'rec'+k, emo:'⏱️', txt:`Melhor marca nos ${n}: ${typeof rFmtMin==='function' ? rFmtMin(r.min) : Math.round(r.min)+' min'}` }); });
  const corr = ((state.modules.run && state.modules.run.history)||[]).filter(r=>(!r.activity || r.activity==='corrida') && +r.distance>0);
  const maiorHoje = Math.max(0, ...ativ.filter(r=>(!r.activity || r.activity==='corrida')).map(r=>+r.distance||0));
  const anteriores = corr.filter(r=>r.at < ini);
  if(maiorHoje >= 3 && anteriores.length >= 3 && maiorHoje > Math.max(...anteriores.map(r=>+r.distance))) out.push({ k:'maiorkm', emo:'📏', txt:`Sua maior distância até aqui: ${mtFmtKm(maiorHoje)} km` });
  if(typeof RUN_METAS !== 'undefined') RUN_METAS.forEach(m=>{ const at = (S.metas||{})[m.k]; if(at && typeof at === 'number' && noDia(at)) out.push({ k:'meta:'+m.k, emo:'🎯', txt:`Meta alcançada: ${m.nome}` }); });
  // volta depois de uma pausa (primeiro treino após 7+ dias)
  if(lifts.length || ativ.length){
    const todas = [...((state.modules.lift && state.modules.lift.history)||[]), ...((state.modules.run && state.modules.run.history)||[])].map(h=>h && h.at).filter(t=>t && t < ini);
    const ult = todas.length ? Math.max(...todas) : null;
    if(ult){ const dias = Math.round((ini - _dia0(ult))/DIA_MS); if(dias >= 7) out.push({ k:'volta', emo:'🔁', txt:`Voltou a treinar depois de ${dias} dias parado(a).` }); }
  }
  // conquistas
  const tds = state.trophyDates || {};
  const tHoje = Object.keys(tds).filter(id=>noDia(tds[id]));
  tHoje.slice(0,3).forEach(id=>{ const t = (typeof TROPHIES!=='undefined' ? TROPHIES.find(x=>x.id===id) : null); if(t) out.push({ k:'trofeu:'+id, emo:'🎖️', txt:`Conquista desbloqueada: ${t.name}` }); });
  if(tHoje.length > 3) out.push({ k:'trofeu+', emo:'🎖️', txt:`E mais ${tHoje.length-3} conquista${tHoje.length-3>1?'s':''} neste dia.` });
  const ocultas = new Set(((state.dayNotesOcultas||{})[ini])||[]);
  return out.map(n=>Object.assign(n, { oculta: ocultas.has(n.k) }));
}
let _dnPend = null;   // destaques passados para o texto (só valem se a anotação for salva)
const _openDayDetailB18 = window.openDayDetail;
window.openDayDetail = function(ts){
  const r = _openDayDetailB18.apply(this, arguments);
  try{ _dnRender(ts); }catch(e){ console.log('anotações automáticas', e); }
  return r;
};
function _dnRender(ts){
  const ini = _dia0(ts);
  _dnPend = _dnPend && _dnPend.ts === ini ? _dnPend : { ts:ini, ocultar:[] };
  const todas = dayAutoNotes(ini).filter(n=>!_dnPend.ocultar.includes(n.k));
  const vis = todas.filter(n=>!n.oculta), ocultas = todas.filter(n=>n.oculta);
  const area = $('day-note'); if(!area) return;
  const campo = area.closest('.field');
  let box = $('dn-auto'); if(box) box.remove();
  if(!vis.length && !ocultas.length) return;
  box = document.createElement('div'); box.id = 'dn-auto'; box.className = 'dn-auto';
  box.innerHTML = `<div class="dn-h">✨ Destaques do dia <small>automáticos</small></div>
    ${vis.map(n=>`<div class="dn-item"><span class="dn-emo">${n.emo}</span><span class="dn-txt">${mtEsc(n.txt)}</span>
      <button class="dn-b" title="Editar no texto" aria-label="Editar: ${mtEsc(n.txt)}" onclick="dnEditar(${ini},'${mtJsStr(n.k)}')">✏️</button><button class="dn-b" title="Remover" aria-label="Remover: ${mtEsc(n.txt)}" onclick="dnRemover(${ini},'${mtJsStr(n.k)}')">✕</button></div>`).join('')}
    ${ocultas.length ? `<button class="dn-rest" onclick="dnRestaurar(${ini})">Mostrar ${ocultas.length} destaque${ocultas.length>1?'s':''} removido${ocultas.length>1?'s':''}</button>` : ''}
    <div class="dn-nota">Gerados pelos seus registros. ✏️ leva o texto para a sua anotação, onde você edita e acrescenta.</div>`;
  campo.parentNode.insertBefore(box, campo);
  const lbl = campo.querySelector('label'); if(lbl) lbl.textContent = '📝 Sua anotação';
}
function _dnOcultar(ts, k, salvar){
  state.dayNotesOcultas = state.dayNotesOcultas || {};
  const l = state.dayNotesOcultas[ts] = state.dayNotesOcultas[ts] || [];
  if(!l.includes(k)) l.push(k);
  if(salvar) saveData();
}
function dnRemover(ts, k){ _dnOcultar(ts, k, true); _dnRender(ts); try{ renderCalendar(); }catch(e){} toast('Destaque removido. Dá para mostrar de novo aqui mesmo.'); }
function dnRestaurar(ts){ if(state.dayNotesOcultas){ delete state.dayNotesOcultas[ts]; saveData(); } _dnPend = null; _dnRender(ts); try{ renderCalendar(); }catch(e){} }
function dnEditar(ts, k){
  const n = dayAutoNotes(ts).find(x=>x.k===k); if(!n) return;
  const area = $('day-note'); const linha = `${n.emo} ${n.txt}`;
  area.value = area.value.trim() ? area.value.trim() + '\n' + linha : linha;
  _dnPend.ocultar.push(k);
  _dnRender(ts);
  area.focus(); try{ area.setSelectionRange(area.value.length, area.value.length); }catch(e){}
}
const _saveDayNoteB18 = window.saveDayNote;
window.saveDayNote = function(ts){
  try{ const ini = _dia0(ts); if(_dnPend && _dnPend.ts === ini && _dnPend.ocultar.length){ _dnPend.ocultar.forEach(k=>_dnOcultar(ini, k, false)); } }catch(e){}
  _dnPend = null;
  return _saveDayNoteB18.apply(this, arguments);
};
// marca discreta ✦ nos dias com destaque (quando não há anotação escrita)
const _renderCalendarB18 = window.renderCalendar;
window.renderCalendar = function(){
  const r = _renderCalendarB18.apply(this, arguments);
  try{
    document.querySelectorAll('.cal-day[onclick*="openDayDetail"]').forEach(c=>{
      const m = (c.getAttribute('onclick')||'').match(/openDayDetail\((\d+)\)/); if(!m) return;
      if(c.querySelector('.dn-mark')) return;
      if(((state.dayNotes||{})[+m[1]])) return;
      const vis = dayAutoNotes(+m[1]).filter(n=>!n.oculta);
      if(vis.length){ const s = document.createElement('span'); s.className = 'dn-mark'; s.textContent = '✦'; s.title = vis.length + ' destaque' + (vis.length>1?'s':''); c.appendChild(s); }
    });
  }catch(e){}
  return r;
};
Object.assign(window, { murToggleCapa, murLogoModo, murRemover, murArquivo, dayAutoNotes, dnRemover, dnRestaurar, dnEditar });

// =====================================================================
// 30. Beta 19 — arquivo anual (sem perder o passado), histórico completo,
//     relatório em PDF, "Seus dados" (espaço) e Início enxuto
// =====================================================================
// Como funciona o arquivo:
//  • O documento principal (usuarios/{uid}) continua leve: detalhe dos últimos 90 dias.
//  • ANTES da limpeza de 90 dias apagar algo, esse dado é gravado em
//    usuarios/{uid}/arquivo/{AAAA-S} (um documento por semestre). A regra
//    "usuarios/{userId}/{subdocumentos=**}" já cobre esse caminho: só o próprio
//    aluno e os administradores leem e gravam. Nenhuma regra nova.
//  • Só sai do app o que a nuvem CONFIRMOU que gravou. Se a gravação falhar
//    (sem internet etc.), o dado fica no app e tenta de novo depois. Se falhar
//    por muito tempo (365 dias) ou o documento passar de 85% do limite de 1 MB,
//    volta à limpeza original para proteger o documento.
//  • O arquivo só é lido quando o aluno pede (Histórico completo, gráficos do
//    ano, relatório em PDF) — não pesa na abertura do app.
const ARQ_FALLBACK_DIAS = 365;
const DOC_LIMITE = 1048576;            // 1 MiB por documento no Firestore
let _arqMem = null;                    // { uid, docs:{id:dados}, em }
let _arqRodando = false;

function _arqCol(uid){ return db.collection('usuarios').doc(uid).collection('arquivo'); }
function _arqSem(ts){ const d = new Date(ts); return d.getFullYear() + '-' + (d.getMonth() < 6 ? 1 : 2); }
function _arqInfo(){ if(!state.arquivo || typeof state.arquivo !== 'object' || Array.isArray(state.arquivo)) state.arquivo = {}; return state.arquivo; }
function _comPrazo(p, ms){ return Promise.race([p, new Promise((_, rej)=>setTimeout(()=>rej(new Error('tempo esgotado')), ms))]); }
function arqTemArquivo(){ const i = (state && state.arquivo) || {}; return !!((i.docs||[]).length); }
function _arqCarregado(){ return !!(_arqMem && fbUser && _arqMem.uid === uidDados()); }

// separa por semestre tudo o que é mais antigo que os cortes
function arqColetar(alvo, alvoResumo){
  const docs = {};
  const D = ts => { const k = _arqSem(ts); return docs[k] = docs[k] || { lift:{}, run:{}, prog:{}, resumo:{} }; };
  ['lift','run'].forEach(m=>{
    const vistos = {};
    ((((state.modules||{})[m])||{}).history||[]).forEach(x=>{
      if(!x || !(+x.at) || x.at >= alvo) return;
      let k = String(x.at); vistos[k] = (vistos[k]||0) + 1; if(vistos[k] > 1) k += '_' + vistos[k];
      D(x.at)[m][k] = x;
    });
  });
  Object.keys(state.progress||{}).forEach(ex=>{
    (state.progress[ex]||[]).forEach(p=>{ if(!p || !(+p.date) || p.date >= alvo) return; const o = D(p.date).prog; (o[ex] = o[ex] || {})[String(p.date)] = p; });
  });
  Object.keys(state.progResumo||{}).forEach(ex=>{
    (state.progResumo[ex]||[]).forEach(r=>{
      if(Array.isArray(r)) r = {d:r[0], p:r[1], v:r[2], r:r[3]};
      if(!r || !(+r.d) || r.d >= alvoResumo) return; const o = D(r.d).resumo; (o[ex] = o[ex] || {})[String(r.d)] = r;
    });
  });
  return docs;
}

// grava na nuvem e, só depois da confirmação, libera a limpeza
async function arqArquivar(){
  if(_arqRodando || !fbUser || !uidDados() || !state || !state.user || !state.modules) return false;
  const agora = Date.now();
  const alvo = agora - HISTORY_RETENTION_DAYS*DIA_MS, alvoR = agora - 730*DIA_MS;
  const info = _arqInfo();
  const docs = arqColetar(alvo, alvoR); const ids = Object.keys(docs);
  if(!ids.length){ info.ate = alvo; info.ateResumo = alvoR; return true; }   // nada a guardar
  _arqRodando = true; const uid = uidDados();
  try{
    const escritas = ids.map(id=>{
      return _arqCol(uid).doc(id).set(Object.assign(_arqCompacto(docs[id]), { periodo:id, v:2, atualizadoEm:agora }), { merge:true });
    });
    await _comPrazo(Promise.all(escritas), 45000);
    if(!fbUser || uidDados() !== uid) return false;            // trocou de conta no meio
    info.ate = alvo; info.ateResumo = alvoR; info.em = agora; info.falhas = 0; delete info.erro; delete info.pendDesde;
    info.docs = [...new Set([...(info.docs||[]), ...ids])].sort();
    if(_arqCarregado()) ids.forEach(id=>{ _arqMem.docs[id] = _arqMescla(_arqMem.docs[id], JSON.parse(JSON.stringify(docs[id]))); });
    _arqRodando = false;
    window.cleanupOldHistory();                                 // agora pode limpar (e salva)
    return true;
  }catch(e){
    info.falhas = (info.falhas||0) + 1; info.pendDesde = info.pendDesde || agora; info.erro = String((e && e.message) || e).slice(0, 120);
    console.log('arquivo anual: vai tentar de novo depois —', e);
    return false;
  }finally{ _arqRodando = false; }
}
// cada registro vira um texto JSON: o Firestore indexa 1 campo por registro (e não cada
// subcampo), longe do limite de 40 mil entradas de índice por documento
function _arqCompacto(d){
  const js = v=>JSON.stringify(limpaParaNuvem(v, 'arquivo', []));
  const out = { lift:{}, run:{}, prog:{}, resumo:{} };
  ['lift','run'].forEach(m=>Object.keys(d[m]||{}).forEach(k=>{ out[m][k] = js(d[m][k]); }));
  ['prog','resumo'].forEach(m=>Object.keys(d[m]||{}).forEach(ex=>{ out[m][ex] = {}; Object.keys(d[m][ex]).forEach(k=>{ out[m][ex][k] = js(d[m][ex][k]); }); }));
  return out;
}
function _arqV(v){ if(typeof v === 'string'){ try{ return JSON.parse(v); }catch(e){ return null; } } return v; }
function _arqMescla(a, b){
  a = a || {}; b = b || {};
  const out = Object.assign({}, a, b);
  ['lift','run'].forEach(m=>{ out[m] = Object.assign({}, a[m]||{}, b[m]||{}); });
  ['prog','resumo'].forEach(m=>{ out[m] = Object.assign({}, a[m]||{}); Object.keys(b[m]||{}).forEach(ex=>{ out[m][ex] = Object.assign({}, (a[m]||{})[ex]||{}, b[m][ex]); }); });
  return out;
}

// a limpeza de 90 dias passa a respeitar o arquivo
const _cleanupB19 = window.cleanupOldHistory;
window.cleanupOldHistory = function(){
  try{
    const info = _arqInfo(); const agora = Date.now();
    // Proteções: arquivamento falhando há mais de 365 dias, ou documento perto do limite (85% de 1 MB) → limpeza original
    const falhaLonga = !!(info.pendDesde && (agora - info.pendDesde) > ARQ_FALLBACK_DIAS*DIA_MS);
    const pesado = arqTamanhoDoc() > DOC_LIMITE*0.85;
    const r = (falhaLonga || pesado)
      ? _cleanupB19.call(this)
      : _cleanupB19.call(this, Math.max(1, Math.min(agora - HISTORY_RETENTION_DAYS*DIA_MS, +info.ate||1)), Math.max(1, Math.min(agora - 730*DIA_MS, +info.ateResumo||1)));
    if(!_arqRodando) setTimeout(()=>{ arqArquivar().catch(()=>{}); }, 6000);
    return r;
  }catch(e){ console.log('limpeza com arquivo:', e); return _cleanupB19.apply(this, arguments); }
};

async function arqCarregar(forcar){
  if(_arqCarregado() && !forcar) return _arqMem;
  if(!fbUser) throw new Error('sem login');
  const uid = uidDados();
  // direto do servidor: o cache local pode estar vazio e dar a falsa impressão de arquivo vazio
  const snap = await _comPrazo(_arqCol(uid).get({ source:'server' }), 20000);
  const docs = {}; snap.forEach(d=>{ docs[d.id] = d.data(); });
  _arqMem = { uid, docs, em:Date.now() };
  const info = _arqInfo(); const ids = Object.keys(docs).sort();
  if(ids.join() !== (info.docs||[]).join()) info.docs = ids;
  return _arqMem;
}
// apaga o arquivo (Começar do zero / Excluir conta). Dispara na hora, antes do login sair.
function arqApagarTudo(uid){
  if(!uid) return;
  const ids = new Set(((state && state.arquivo && state.arquivo.docs) || []));
  for(let a = 2025; a <= new Date().getFullYear(); a++){ ids.add(a+'-1'); ids.add(a+'-2'); }
  ids.forEach(id=>{ try{ _arqCol(uid).doc(id).delete().catch(()=>{}); }catch(e){} });
  if(_arqMem && _arqMem.uid === uid) _arqMem = null;
  try{ if(state && state.arquivo) state.arquivo = {}; }catch(e){}
}
function _arqLer(d){
  const out = { lift:{}, run:{}, prog:{}, resumo:{} }; d = d || {};
  ['lift','run'].forEach(m=>Object.keys(d[m]||{}).forEach(k=>{ const v = _arqV(d[m][k]); if(v) out[m][k] = v; }));
  ['prog','resumo'].forEach(m=>Object.keys(d[m]||{}).forEach(ex=>{ out[m][ex] = {}; Object.keys(d[m][ex]||{}).forEach(k=>{ const v = _arqV(d[m][ex][k]); if(v) out[m][ex][k] = v; }); }));
  return out;
}
// restaurar backup (.json) que trouxe o arquivo junto
function arqRestaurar(arq){
  if(!fbUser || !arq || typeof arq !== 'object') return;
  const uid = uidDados(); const ids = Object.keys(arq).filter(id=>/^\d{4}-[12]$/.test(id));
  ids.forEach(id=>{ try{ _arqCol(uid).doc(id).set(Object.assign(_arqCompacto(_arqLer(arq[id])), { periodo:id, v:2, atualizadoEm:Date.now() }), { merge:true }).catch(e=>console.log('restaurar arquivo', e)); }catch(e){} });
  const info = _arqInfo(); info.docs = [...new Set([...(info.docs||[]), ...ids])].sort();
  _arqMem = null; saveData();
}

// ---------- tudo junto: app + arquivo, sem duplicar ----------
function arqDados(){
  const lift = new Map(), run = new Map(), prog = {}, resumo = {};
  const addH = (map, x)=>{ if(x && +x.at) map.set(x.at + '|' + (x.name||'') + '|' + (x.duration||''), x); };
  const addP = (ex, p)=>{ if(p && +p.date) (prog[ex] = prog[ex] || new Map()).set(+p.date, p); };
  const addR = (ex, r)=>{ if(Array.isArray(r)) r = {d:r[0], p:r[1], v:r[2], r:r[3]}; if(r && +r.d) (resumo[ex] = resumo[ex] || new Map()).set(+r.d, r); };
  if(_arqCarregado()) Object.values(_arqMem.docs).forEach(d=>{
    Object.values(d.lift||{}).forEach(x=>addH(lift, _arqV(x))); Object.values(d.run||{}).forEach(x=>addH(run, _arqV(x)));
    Object.entries(d.prog||{}).forEach(([ex,o])=>Object.values(o||{}).forEach(p=>addP(ex, _arqV(p))));
    Object.entries(d.resumo||{}).forEach(([ex,o])=>Object.values(o||{}).forEach(r=>addR(ex, _arqV(r))));
  });
  (((state.modules.lift)||{}).history||[]).forEach(x=>addH(lift, x));
  (((state.modules.run)||{}).history||[]).forEach(x=>addH(run, x));
  Object.entries(state.progress||{}).forEach(([ex,a])=>(a||[]).forEach(p=>addP(ex, p)));
  Object.entries(state.progResumo||{}).forEach(([ex,a])=>(a||[]).forEach(r=>addR(ex, r)));
  const ord = m=>[...m.values()].sort((a,b)=>a.at-b.at);
  const P = {}, R = {};
  Object.keys(prog).forEach(ex=>{ P[ex] = [...prog[ex].values()].sort((a,b)=>a.date-b.date); });
  Object.keys(resumo).forEach(ex=>{ R[ex] = [...resumo[ex].values()].sort((a,b)=>a.d-b.d); });
  return { lift:ord(lift), run:ord(run), prog:P, resumo:R };
}
// pontos de um exercício: série completa quando existe, resumo quando não
function arqPontosEx(D, ex){
  const pts = []; const vistos = new Set();
  (D.prog[ex]||[]).filter(p=>p.sets && p.sets.length).forEach(p=>{ vistos.add(+p.date); pts.push({ date:+p.date, peso:Math.max(0, ...p.sets.map(s=>+s.peso||0)), vol:p.sets.reduce((t,x)=>t+(+x.peso||0)*(+x.reps||0), 0), reps:p.sets.reduce((t,x)=>t+(+x.reps||0), 0), sets:p.sets }); });
  (D.resumo[ex]||[]).forEach(r=>{ if(!vistos.has(+r.d)) pts.push({ date:+r.d, peso:+r.p||0, vol:+r.v||0, reps:+r.r||0, sets:null }); });
  return pts.sort((a,b)=>a.date-b.date);
}
function _volumeArq(D, a, b){
  let v = 0;
  Object.keys(D.prog).forEach(ex=>{ const vistos = new Set();
    D.prog[ex].forEach(p=>{ vistos.add(+p.date); if(p.date>=a && p.date<b) v += (p.sets||[]).reduce((t,s)=>t+(+s.peso||0)*(+s.reps||0), 0); });
    (D.resumo[ex]||[]).forEach(r=>{ if(r.d>=a && r.d<b && !vistos.has(+r.d)) v += (+r.v||0); });
  });
  Object.keys(D.resumo).forEach(ex=>{ if(D.prog[ex]) return; D.resumo[ex].forEach(r=>{ if(r.d>=a && r.d<b) v += (+r.v||0); }); });
  return Math.round(v);
}

// gráfico de evolução de carga do exercício: inclui o arquivo quando carregado
const _pontosExB19 = window._pontosEx;
window._pontosEx = function(exId){
  const base = _pontosExB19.apply(this, arguments);
  if(!_arqCarregado()) return base;
  try{
    const datas = new Set(base.map(p=>+p.date));
    const extra = arqPontosEx(arqDados(), exId).filter(p=>!datas.has(+p.date));
    return extra.length ? base.concat(extra).sort((a,b)=>a.date-b.date) : base;
  }catch(e){ return base; }
};
const _openExProgressB19 = window.openExProgress;
window.openExProgress = function(exId){
  const r = _openExProgressB19.apply(this, arguments);
  try{
    if(arqTemArquivo() && !_arqCarregado()){
      const mi = $('modal-inner'); const fechar = mi && [...mi.querySelectorAll('button')].pop();
      if(fechar && /Fechar/.test(fechar.textContent)){
        const b = document.createElement('button'); b.className = 'btn btn-outline btn-block'; b.style.marginTop = '10px';
        b.textContent = '📚 Incluir anos anteriores';
        b.onclick = ()=>{ b.disabled = true; b.textContent = '⏳ Buscando seu arquivo...';
          arqCarregar().then(()=>openExProgress(exId)).catch(()=>{ b.disabled = false; b.textContent = '📚 Incluir anos anteriores'; toast('📶 Sem conexão — tente de novo com internet'); }); };
        fechar.before(b);
      }
    }
  }catch(e){}
  return r;
};

// gráficos de Evolução (Progresso): no período "ano", usa o arquivo quando carregado
function arqNotaRetencao(){
  if(_arqCarregado()) return '';
  if(arqTemArquivo()) return `Treinos com mais de 90 dias estão no seu arquivo. <a href="#" onclick="arqCarregarEvo();return false" style="color:var(--primary);font-weight:600">Carregar arquivo</a>`;
  return 'Treinos com mais de 90 dias passam a ficar no seu arquivo anual (Histórico → Histórico completo).';
}
function arqCarregarEvo(){
  toast('📚 Buscando seu arquivo...');
  arqCarregar().then(()=>{ try{ renderEvolucao(); }catch(e){} }).catch(()=>toast('📶 Sem conexão — tente de novo com internet'));
}
const _renderEvolucaoB19 = window.renderEvolucao;
if(typeof _renderEvolucaoB19 === 'function') window.renderEvolucao = function(){
  if(!_arqCarregado()) return _renderEvolucaoB19.apply(this, arguments);
  const oH = window.mtHist, oV = window._volumeEntre, oA = window.mtAllHist;
  let D = null; try{ D = arqDados(); }catch(e){}
  if(!D) return _renderEvolucaoB19.apply(this, arguments);
  window.mtHist = function(){
    const L = D.lift.map(x=>Object.assign({}, x, {_t:'musculacao'}));
    const R = D.run.map(x=>Object.assign({}, x, {_t:(!x.activity || x.activity==='corrida') ? 'corrida' : x.activity}));
    return [...L, ...R].filter(x=>x && x.at).sort((a,b)=>a.at-b.at);
  };
  window.mtAllHist = function(){ return [...D.lift, ...D.run].filter(x=>x && x.at).sort((a,b)=>a.at-b.at); };
  window._volumeEntre = (a, b)=>_volumeArq(D, a, b);
  try{ return _renderEvolucaoB19.apply(this, arguments); }
  finally{ window.mtHist = oH; window._volumeEntre = oV; window.mtAllHist = oA; }
};

// ---------- Histórico: cartão "Histórico completo" ----------
mtGancho('renderHistory', { depois(){
  try{ arqCartaoHistorico(); }catch(e){ console.log('cartão do arquivo', e); }
}});
function arqCartaoHistorico(){
  const el = $('hist-arq'); if(!el || !state.user) return;
  const tem = arqTemArquivo();
  el.innerHTML = `<div class="arq-card">
    <h4>📚 Histórico completo</h4>
    <p>${tem ? 'Os treinos com mais de 90 dias ficam guardados no seu arquivo anual na nuvem. Veja ano a ano como você evoluiu.' : 'Aqui ficam os últimos 90 dias em detalhe. A partir desta versão, o que passar disso vai para o seu arquivo anual — nada se perde.'}</p>
    <div class="arq-btns">
      <button class="btn btn-outline" onclick="arqAbrirHistorico()">📈 Ver evolução ano a ano</button>
      <button class="btn btn-ghost" onclick="arqRelatorio()">📄 Relatório em PDF</button>
    </div></div>`;
}
function _anoDe(t){ return new Date(t).getFullYear(); }
function _fmtHoras(min){ min = Math.round(min||0); if(min < 60) return min + ' min'; const h = Math.floor(min/60), m = min%60; return h + 'h' + (m ? String(m).padStart(2,'0') : ''); }
function _fmtN(v, dec){ return (+v||0).toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits:dec||0}); }
function _ehCorr(r){ return r && (!r.activity || r.activity==='corrida'); }
function arqResumoAnos(D){
  const anos = {};
  const A = y => anos[y] = anos[y] || { y, lift:0, liftMin:0, vol:0, run:0, km:0, runMin:0, melhorPace:null, maiorKm:0, cam:0, bike:0, camKm:0, bikeKm:0, dias:new Set() };
  D.lift.forEach(x=>{ const a = A(_anoDe(x.at)); a.lift++; a.liftMin += +x.duration||0; a.dias.add(mtDia0(x.at)); });
  D.run.forEach(x=>{ const a = A(_anoDe(x.at)); a.dias.add(mtDia0(x.at));
    if(_ehCorr(x)){ a.run++; a.km += +x.distance||0; a.runMin += +x.duration||0; a.maiorKm = Math.max(a.maiorKm, +x.distance||0);
      if(+x.distance >= 3 && +x.duration > 0){ const p = x.duration/x.distance; if(!a.melhorPace || p < a.melhorPace) a.melhorPace = p; } }
    else if(x.activity==='caminhada'){ a.cam++; a.camKm += +x.distance||0; } else if(x.activity==='bike'){ a.bike++; a.bikeKm += +x.distance||0; } });
  Object.keys(anos).forEach(y=>{ anos[y].vol = _volumeArq(D, new Date(+y,0,1).getTime(), new Date(+y+1,0,1).getTime()); });
  // anos que só têm resumo de cargas (sem sessões) também aparecem
  Object.values(D.resumo).forEach(a=>a.forEach(r=>{ const y = _anoDe(r.d); if(!anos[y]){ A(y); anos[y].vol = _volumeArq(D, new Date(y,0,1).getTime(), new Date(y+1,0,1).getTime()); } }));
  return Object.values(anos).sort((a,b)=>b.y-a.y);
}
// exercícios com registro em mais de um ano: carga máxima do primeiro ano x do último
function arqEvolucaoCargas(D){
  const out = [];
  const exs = new Set([...Object.keys(D.prog), ...Object.keys(D.resumo)]);
  exs.forEach(ex=>{
    const pts = arqPontosEx(D, ex).filter(p=>p.peso > 0); if(pts.length < 2) return;
    const porAno = {}; pts.forEach(p=>{ const y = _anoDe(p.date); porAno[y] = Math.max(porAno[y]||0, p.peso); });
    const ys = Object.keys(porAno).map(Number).sort();
    const prim = pts[0], ult = pts[pts.length-1];
    const melhor = Math.max(...pts.map(p=>p.peso));
    out.push({ ex, nome:(typeof nomeDoEx==='function' ? nomeDoEx(ex) : ex), n:pts.length, ini:prim.peso, iniT:prim.date, fim:ult.peso, fimT:ult.date, melhor, anos:ys.length, porAno });
  });
  return out.sort((a,b)=>(b.anos - a.anos) || (b.n - a.n));
}
async function arqAbrirHistorico(){
  const mi = $('modal-inner'); if(!mi) return;
  mi.classList.remove('modal-video'); $('modal-back').classList.add('on');
  let aviso = '';
  if(arqTemArquivo() && !_arqCarregado()){
    mi.innerHTML = `<h3>📚 Histórico completo</h3><div class="rest-card"><div style="font-size:34px">⏳</div><div class="rest-sub">Buscando seu arquivo anual...</div></div>`;
    try{ await arqCarregar(); }catch(e){ aviso = '📶 Não deu para buscar o arquivo agora (sem conexão?). Mostrando o que está no aparelho.'; }
  }
  const D = arqDados(); const anos = arqResumoAnos(D); const evoTodos = arqEvolucaoCargas(D); const evo = evoTodos.slice(0, 6);
  const info = _arqInfo();
  const desde = (()=>{ const t = [D.lift[0]&&D.lift[0].at, D.run[0]&&D.run[0].at].filter(Boolean); Object.values(D.resumo).forEach(a=>a[0]&&t.push(a[0].d)); return t.length ? Math.min(...t) : null; })();
  const cartao = a=>`<div class="arq-ano"><h4>${a.y}<small>${a.dias.size} ${a.dias.size===1?'dia ativo':'dias ativos'}</small></h4>
    ${(a.lift || a.vol) ? `<div class="arq-sub">🏋️ Musculação</div><div class="arq-grid">
      <div class="qs"><div class="qs-v">${a.lift}</div><div class="qs-l">treinos</div></div>
      <div class="qs"><div class="qs-v">${_fmtHoras(a.liftMin)}</div><div class="qs-l">de treino</div></div>
      <div class="qs"><div class="qs-v">${a.vol>=1000?_fmtN(a.vol/1000,1)+' t':_fmtN(a.vol)+' kg'}</div><div class="qs-l">volume</div></div></div>` : ''}
    ${a.run ? `<div class="arq-sub">🏃 Corrida</div><div class="arq-grid">
      <div class="qs"><div class="qs-v">${a.run}</div><div class="qs-l">corridas</div></div>
      <div class="qs"><div class="qs-v">${_fmtN(a.km,1)} km</div><div class="qs-l">${_fmtHoras(a.runMin)}</div></div>
      <div class="qs"><div class="qs-v">${a.melhorPace ? fmtPaceMin(a.melhorPace).replace('/km','') : '–'}</div><div class="qs-l">melhor ritmo/km</div></div>
      <div class="qs"><div class="qs-v">${_fmtN(a.maiorKm,1)} km</div><div class="qs-l">maior corrida</div></div></div>` : ''}
    ${(a.cam || a.bike) ? `<div class="mt-muted" style="font-size:12px;margin-top:6px">${a.cam?`🚶 ${a.cam} caminhadas · ${_fmtN(a.camKm,1)} km`:''}${a.cam&&a.bike?' · ':''}${a.bike?`🚴 ${a.bike} pedais · ${_fmtN(a.bikeKm,1)} km`:''}</div>` : ''}
  </div>`;
  const linhaEvo = e=>{ const d = e.fim - e.ini; const pct = e.ini > 0 ? Math.round(d/e.ini*100) : 0;
    return `<div class="arq-evo" onclick="openExProgress('${String(e.ex).replace(/'/g,"\\'")}')"><b>${mtEsc(e.nome)}</b><span>${_fmtN(e.ini,1)} → ${_fmtN(e.fim,1)} kg ${d>0?`<span class="up">+${pct}%</span>`:(d<0?`${pct}%`:'')} ›</span></div>`; };
  mi.innerHTML = `<h3>📚 Histórico completo</h3>
    <p class="mt-muted" style="margin:0 0 6px;font-size:12.5px;line-height:1.5">${desde ? `Seus registros desde <b>${new Date(desde).toLocaleDateString('pt-BR',{month:'long', year:'numeric'})}</b>.` : 'Ainda não há registros.'} ${arqTemArquivo() ? 'Inclui o arquivo anual.' : 'O arquivo anual começa a guardar os treinos que passarem de 90 dias a partir desta versão (registros anteriores a isso já tinham sido resumidos — as cargas por exercício dos últimos 2 anos continuam nos gráficos).'}</p>
    ${aviso ? `<div class="mt-muted" style="font-size:12px;color:var(--accent-2);margin-bottom:6px">${aviso}</div>` : ''}
    ${evo.length ? `<div class="arq-sub" style="margin-top:12px">📈 Evolução de carga (primeiro → último registro)</div><div class="card" style="padding:4px 12px;margin-top:6px">${evo.map(linhaEvo).join('')}${evoTodos.length > evo.length ? `<div id="arq-evo-mais" style="display:none">${evoTodos.slice(6, 40).map(linhaEvo).join('')}</div><div class="arq-evo" style="justify-content:center;color:var(--primary);font-weight:600" onclick="this.previousElementSibling.style.display='';this.remove()">Ver mais ${Math.min(34, evoTodos.length - 6)} exercícios</div>` : ''}</div>` : ''}
    <div style="max-height:46vh;overflow-y:auto;margin-top:6px">${anos.map(cartao).join('') || '<div class="mt-muted" style="padding:14px 2px">Nenhum treino registrado ainda.</div>'}</div>
    ${info.em ? `<div class="mt-muted" style="font-size:11px;margin-top:8px">Último arquivamento: ${new Date(info.em).toLocaleDateString('pt-BR')}</div>` : ''}
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="arqRelatorio()">📄 Gerar relatório em PDF</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
}

// ---------- Seus dados (espaço usado) ----------
function _bytesDe(obj){ try{ return new Blob([JSON.stringify(obj)]).size; }catch(e){ return JSON.stringify(obj||{}).length; } }
function arqTamanhoDoc(){
  try{ return _bytesDe({ email:(fbUser&&fbUser.email)||'', nome:'', atualizadoEm:0, estadoApp:limpaParaNuvem(state, 'estadoApp', []) }); }catch(e){ return 0; }
}
// do que é feito o documento: quase tudo é custo fixo (plano e foto), que não cresce com o uso
function _composicaoDoc(){
  try{
    const st = limpaParaNuvem(state, 'estadoApp', []); const B = v=>_bytesDe(v||{});
    const total = B(st) || 1;
    const foto = ((st.user||{}).profile||{}).photo ? String(st.user.profile.photo).length : 0;
    const plano = ['lift','run'].reduce((s,m)=>s + (((st.modules||{})[m]||{}).plan ? B(st.modules[m].plan) : 0), 0);
    const hist = ['lift','run'].reduce((s,m)=>s + (((st.modules||{})[m]||{}).history ? B(st.modules[m].history) : 0), 0) + B(st.progress) + B(st.progResumo) + B(st.corridaStats) + B(st.weights);
    const outros = Math.max(0, total - foto - plano - hist);
    const linha = (n, v, d)=>`<div class="mrow" style="font-size:12.5px"><span>${n}${d?`<small style="display:block;color:var(--text-mute);font-size:11px">${d}</small>`:''}</span><span>${_fmtKB(v)}</span></div>`;
    return `<div class="arq-sub" style="margin-top:10px">Do que é feito</div>
      ${linha('Plano de treino', plano, 'exercícios, séries e descansos de cada treino (tamanho fixo)')}
      ${foto ? linha('Foto do perfil', foto, 'tamanho fixo') : ''}
      ${linha('Histórico, séries e pesos', hist, 'cresce com os treinos; o que passa de 90 dias vai para o arquivo')}
      ${linha('Configurações e o resto', outros, 'preferências, metas, conquistas, água, notas')}`;
  }catch(e){ return ''; }
}
function _fmtKB(b){ return b >= 1048576 ? _fmtN(b/1048576, 2) + ' MB' : _fmtN(Math.max(1, Math.round(b/1024))) + ' KB'; }
function _nivelTam(pct){ return pct >= 85 ? 'critico' : pct >= 60 ? 'alerta' : ''; }
function arqSeusDados(){
  const b = arqTamanhoDoc(); const pct = Math.min(100, Math.round(b/DOC_LIMITE*100));
  const info = _arqInfo(); const docs = info.docs || [];
  const nH = (((state.modules.lift)||{}).history||[]).length + (((state.modules.run)||{}).history||[]).length;
  const msg = pct >= 85 ? 'Perto do limite. O app arquiva automaticamente o que passa de 90 dias; se continuar alto, fale com o treinador.'
            : pct >= 60 ? 'Tudo certo, mas acima do normal. O arquivamento automático mantém o espaço sob controle.'
            : 'Tranquilo. Bem abaixo do limite.';
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `<h3>📦 Seus dados</h3>
    <p class="mt-muted" style="margin:0 0 10px;font-size:12.5px;line-height:1.55">Tudo fica salvo na nuvem, na sua conta. O app guarda <b>os últimos 90 dias em detalhe</b> no documento principal (é ele que abre junto com o app) e manda o que for mais antigo para o seu <b>arquivo anual</b>, que só é lido quando você pede. Assim o app continua leve e nada se perde.</p>
    <div class="card" style="padding:12px 14px">
      <div style="display:flex;justify-content:space-between;font-size:13px"><b>Documento principal</b><span>${_fmtKB(b)} de 1 MB</span></div>
      <div class="dados-barra ${_nivelTam(pct)}"><i style="width:${Math.max(2,pct)}%"></i></div>
      <div class="mt-muted" style="font-size:12px">${pct}% · ${msg}</div>
      ${_composicaoDoc()}
    </div>
    <div class="card" style="padding:12px 14px;margin-top:8px;font-size:13px;line-height:1.6">
      <div class="mrow"><span>Sessões nos últimos 90 dias</span><span>${nH}</span></div>
      <div class="mrow"><span>Arquivo anual</span><span>${docs.length ? (()=>{ const ys = [...new Set(docs.map(d=>d.slice(0,4)))]; return `${docs.length} ${docs.length===1?'semestre':'semestres'} (${ys[0]}${ys.length>1?'–'+ys[ys.length-1]:''})`; })() : 'ainda vazio'}</span></div>
      <div class="mrow"><span>Último arquivamento</span><span>${info.em ? new Date(info.em).toLocaleDateString('pt-BR') : '—'}</span></div>
      ${info.falhas ? `<div class="mrow"><span>Arquivamento pendente</span><span style="color:var(--accent-2)">tenta de novo ao abrir com internet</span></div>` : ''}
    </div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="arqRelatorio()">📄 Relatório em PDF (gráficos e dados)</button>
    <button class="btn btn-outline btn-block" style="margin-top:8px" onclick="exportMyData()">💾 Backup completo (.json, inclui o arquivo)</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}

// backup .json passa a levar o arquivo anual junto
window.exportMyData = async function(){
  let arquivo = null;
  if(arqTemArquivo()){
    toast('📦 Juntando seu arquivo anual...');
    try{ const docs = (await arqCarregar()).docs; arquivo = {}; Object.keys(docs).forEach(id=>{ arquivo[id] = _arqLer(docs[id]); }); }catch(e){ toast('📶 Sem conexão: o backup vai sem o arquivo anual (os últimos 90 dias vão completos)'); }
  }
  const data = { app:'MetaTreino', versao:APP_VERSION, exportadoEm:new Date().toISOString(), estado:state };
  if(arquivo) data.arquivo = arquivo;
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `metatreino-backup-${chaveDia(new Date())}.json`;
  a.click();
  toast('📥 Backup baixado — guarde em local seguro');
};

// ---------- Painel ADM: tamanho dos dados por aluno ----------
mtGancho('goAdmin', { depois(){
  try{
    if(!$('adm-tam-row')){
      const ref = $('adm-perm-row') || $('adm-ev-row') || [...document.querySelectorAll('#scr-admin .list-row')].find(r=>/Mensagens dos alunos|Feedback/.test(r.textContent));
      if(ref){ const d = document.createElement('div'); d.className = 'list-row'; d.id = 'adm-tam-row'; d.onclick = admTamanhos;
        d.innerHTML = '📦 <span>Tamanho dos dados</span><span style="margin-left:auto;font-size:11px;color:var(--text-dim)">limite e consumo</span>'; ref.after(d); }
    }
  }catch(e){}
}});
function admTamanhos(){
  const lista = Object.entries(usuariosCache||{}).map(([email,u])=>({ email, nome:(u && u.nome) || '', b:_bytesDe(u), sem:!admTemAcesso(email) })).sort((a,b)=>(b.sem - a.sem) || (b.b - a.b));
  const semAcesso = lista.filter(x=>x.sem); const princ = mtPrincipal();
  const total = lista.reduce((s,x)=>s+x.b, 0);
  const media = lista.length ? total/lista.length : 0;
  const alerta = lista.filter(x=>x.b/DOC_LIMITE >= .6).length;
  // estimativa grosseira de download mensal: cada aluno abre o app 2x/dia e baixa o próprio documento
  const mes = total*2*30; const gb = mes/1073741824;
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `<h3>📦 Tamanho dos dados</h3>
    <p class="mt-muted" style="margin:0 0 10px;font-size:12.5px;line-height:1.5">Cada aluno tem um documento principal (limite do Firestore: 1 MB por documento). Os treinos com mais de 90 dias vão para o arquivo anual do aluno, que só é lido sob demanda.</p>
    <div class="adm-kpis">
      <div class="adm-kpi"><b>${_fmtKB(total)}</b><small>somando ${lista.length} ${lista.length===1?'aluno':'alunos'}</small></div>
      <div class="adm-kpi"><b>${_fmtKB(media)}</b><small>média por aluno</small></div>
      <div class="adm-kpi"><b>${alerta}</b><small>acima de 60% do limite</small></div>
    </div>
    <div class="mt-muted" style="font-size:12px;margin:8px 2px 10px;line-height:1.5">Estimativa de download (se cada aluno abrir o app 2× por dia): <b>~${_fmtN(gb, 2)} GB/mês</b> de 10 GB gratuitos. Abrir este painel baixa todos os documentos (${_fmtKB(total)}) de uma vez.</div>
    ${semAcesso.length ? `<div class="mt-muted" style="font-size:12px;margin:0 2px 8px;line-height:1.5"><b>${semAcesso.length}</b> ${semAcesso.length===1?'aluno sem acesso ainda ocupa':'alunos sem acesso ainda ocupam'} ${_fmtKB(semAcesso.reduce((s,x)=>s+x.b,0))}.${princ ? ' Dá para apagar (com backup automático antes).' : ' Só o administrador principal pode apagar.'}</div>` : ''}
    <div style="max-height:46vh;overflow-y:auto">${lista.map(x=>{ const pct = Math.min(100, Math.round(x.b/DOC_LIMITE*100));
      return `<div class="adm-tam"><b>${mtEsc(x.nome || x.email)}${x.sem?' <span class="adm-sem">sem acesso</span>':''}</b><span>${_fmtKB(x.b)} · ${pct}%${x.sem && princ ? ` <button class="adm-apagar" title="Apagar dados" onclick="admApagarAluno('${String(x.email).replace(/'/g,"\\'")}')">Apagar</button>` : ''}</span><div class="dados-barra ${_nivelTam(pct)}"><i style="width:${Math.max(2,pct)}%"></i></div></div>`; }).join('') || '<div class="mt-muted">Nenhum aluno com dados ainda.</div>'}</div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}

// =====================================================================
// RELATÓRIO EM PDF (jsPDF 2.5.2, MIT — arquivo local jspdf.umd.min.js,
// carregado só quando o aluno pede o relatório)
// =====================================================================
let _pdfOpt = { per:'6m', lift:true, run:true, sess:true };
function _temLift(){ return !!(state.modules.lift || (((state.modules.lift)||{}).history||[]).length || Object.keys(state.progress||{}).length); }
function _temRun(){ return !!(state.modules.run || (((state.modules.run)||{}).history||[]).length); }
function arqRelatorio(){
  const L = _temLift(), R = _temRun();
  const per = [['3m','3 meses'],['6m','6 meses'],['1a','1 ano'],['tudo','Tudo']];
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `<h3>📄 Relatório em PDF</h3>
    <p class="mt-muted" style="margin:0 0 8px;font-size:12.5px;line-height:1.5">Gráficos e dados dos seus treinos para guardar, imprimir ou mandar para o treinador. Dá para salvar no Google Drive pelo botão Compartilhar.</p>
    <div class="arq-sub">Período</div>
    <div class="pdf-opts" id="pdf-per">${per.map(([k,l])=>`<button type="button" class="${_pdfOpt.per===k?'on':''}" onclick="_pdfOpt.per='${k}';document.querySelectorAll('#pdf-per button').forEach(b=>b.classList.toggle('on', b===this))">${l}</button>`).join('')}</div>
    <div class="arq-sub">Incluir</div>
    ${L ? `<label class="pdf-chk"><input type="checkbox" id="pdf-lift" ${_pdfOpt.lift?'checked':''}> 🏋️ Musculação (volume, cargas, recordes)</label>` : ''}
    ${R ? `<label class="pdf-chk"><input type="checkbox" id="pdf-run" ${_pdfOpt.run?'checked':''}> 🏃 Corrida (km, ritmo, recordes, provas)</label>` : ''}
    <label class="pdf-chk"><input type="checkbox" id="pdf-sess" ${_pdfOpt.sess?'checked':''}> 📋 Lista de todas as sessões</label>
    <div id="pdf-status" class="mt-muted" style="font-size:12px;min-height:16px;margin-top:4px"></div>
    <button class="btn btn-primary btn-block" id="pdf-go" style="margin-top:8px" onclick="arqGerarPDF()">📄 Gerar PDF</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function _carregaJsPDF(){
  if(window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  return _comPrazo(new Promise((res, rej)=>{
    const s = document.createElement('script'); s.src = './jspdf.umd.min.js?v=' + APP_VERSION; s.async = true;
    s.onload = ()=> (window.jspdf && window.jspdf.jsPDF) ? res(window.jspdf.jsPDF) : rej(new Error('jsPDF indisponível'));
    s.onerror = ()=>rej(new Error('não carregou o gerador de PDF'));
    document.head.appendChild(s);
  }), 25000);
}
async function arqGerarPDF(){
  const g = id=>document.getElementById(id);
  _pdfOpt.lift = g('pdf-lift') ? g('pdf-lift').checked : false;
  _pdfOpt.run = g('pdf-run') ? g('pdf-run').checked : false;
  _pdfOpt.sess = g('pdf-sess') ? g('pdf-sess').checked : false;
  const st = g('pdf-status'), bt = g('pdf-go');
  const fala = t=>{ if(st) st.textContent = t; };
  if(!_pdfOpt.lift && !_pdfOpt.run){ fala('Marque musculação ou corrida.'); return; }
  if(bt){ bt.disabled = true; bt.textContent = '⏳ Gerando...'; }
  let aviso = '';
  try{
    if(_pdfOpt.per !== '3m' && arqTemArquivo() && !_arqCarregado()){
      fala('Buscando seu arquivo anual...');
      try{ await arqCarregar(); }catch(e){ aviso = 'Sem conexão: o arquivo anual não entrou neste relatório.'; }
    }
    fala('Montando gráficos...');
    const jsPDF = await _carregaJsPDF();
    const { doc, nome } = arqMontarPDF(jsPDF, _pdfOpt, aviso);
    const blob = doc.output('blob');
    _pdfMostrar(blob, nome);
  }catch(e){
    console.log('PDF:', e);
    fala('⚠️ Não foi possível gerar o PDF' + (navigator.onLine ? '.' : ' — abra o app com internet uma vez para baixar o gerador.'));
    if(bt){ bt.disabled = false; bt.textContent = '📄 Gerar PDF'; }
  }
}
function _pdfMostrar(blob, nome){
  window._pdfUlt = { blob, nome };
  let podeComp = false;
  try{ podeComp = !!(navigator.canShare && navigator.canShare({ files:[new File([blob], nome, {type:'application/pdf'})] })); }catch(e){}
  $('modal-inner').innerHTML = `<h3>✅ Relatório pronto</h3>
    <p class="mt-muted" style="margin:0 0 10px;font-size:12.5px;line-height:1.5"><b>${mtEsc(nome)}</b> · ${_fmtKB(blob.size)}</p>
    <button class="btn btn-primary btn-block" onclick="pdfBaixar()">📥 Baixar PDF</button>
    ${podeComp ? `<button class="btn btn-outline btn-block" style="margin-top:8px" onclick="pdfCompartilhar()">📤 Compartilhar (Drive, WhatsApp, e-mail...)</button>` : ''}
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
}
function pdfBaixar(){
  const u = window._pdfUlt; if(!u) return;
  const a = document.createElement('a'); a.href = URL.createObjectURL(u.blob); a.download = u.nome;
  document.body.appendChild(a); a.click(); setTimeout(()=>{ try{ URL.revokeObjectURL(a.href); a.remove(); }catch(e){} }, 4000);
  toast('📥 PDF baixado');
}
function pdfCompartilhar(){
  const u = window._pdfUlt; if(!u) return;
  const f = new File([u.blob], u.nome, {type:'application/pdf'});
  navigator.share({ files:[f], title:'Relatório MetaTreino' }).catch(()=>{});
}

// texto seguro para as fontes padrão do PDF (Latin-1): sem emoji
function _T(s){
  return String(s==null?'':s).replace(/[\u2014\u2013]/g,'-').replace(/\u2026/g,'...').replace(/[\u201C\u201D]/g,'"').replace(/[\u2018\u2019]/g,"'").replace(/\u2192/g,'->')
    .replace(/[^\x00-\xFF]/g,'').replace(/\s{2,}/g,' ').trim();
}
// _niceMax: a mesma função dos gráficos da Beta 11 (08-home-alimentacao-graficos.js)
function _dataBR(t, ano){ return new Date(t).toLocaleDateString('pt-BR', ano ? {day:'2-digit', month:'2-digit', year:'2-digit'} : {day:'2-digit', month:'2-digit'}); }
const _MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function arqMontarPDF(jsPDF, opt, aviso){
  const doc = new jsPDF({ unit:'mm', format:'a4', compress:true });
  const PW = 210, PH = 297, M = 14, W = PW - 2*M;
  const C = { ink:[22,27,34], dim:[96,106,118], linha:[222,226,232], fundo:[245,247,249], lift:[86,130,20], run:[14,116,144], acc:[217,95,24], band:[11,15,20], lime:[182,242,58], peso:[124,58,237] };
  let y = 0;
  const cor = c=>doc.setTextColor(c[0], c[1], c[2]);
  const fonte = (tam, est)=>{ doc.setFont('helvetica', est||'normal'); doc.setFontSize(tam); };
  const nova = ()=>{ doc.addPage(); y = M + 2; };
  const precisa = h=>{ if(y + h > PH - 16) nova(); };
  const txt = (s, x, yy, o)=>doc.text(_T(s), x, yy, o);

  // ----- dados do período -----
  const agora = Date.now();
  const D = arqDados();
  const dias = { '3m':91, '6m':182, '1a':365 }[opt.per];
  const primeiro = (()=>{ const t = [D.lift[0]&&D.lift[0].at, D.run[0]&&D.run[0].at].filter(Boolean); if(opt.lift) Object.values(D.resumo).forEach(a=>a[0]&&t.push(a[0].d)); return t.length ? Math.min(...t) : agora; })();
  const ini = dias ? mtDia0(agora - dias*DIA_MS) : mtDia0(primeiro);
  const span = agora - ini;
  const mensal = span > 130*DIA_MS;
  const L = D.lift.filter(x=>x.at >= ini);
  const R = D.run.filter(x=>x.at >= ini);
  const corr = R.filter(_ehCorr);
  // baldes (semana ou mês)
  const baldes = [];
  if(mensal){ const d = new Date(ini); d.setDate(1); d.setHours(0,0,0,0); while(d.getTime() <= agora){ const a = d.getTime(); d.setMonth(d.getMonth()+1); baldes.push({ a, b:d.getTime(), rot:_MESES[new Date(a).getMonth()] + (span > 400*DIA_MS ? '/' + String(new Date(a).getFullYear()).slice(2) : '') }); } }
  else { let a = mtSemanaIni(ini); while(a <= agora){ baldes.push({ a, b:a + 7*DIA_MS, rot:_dataBR(a) }); a += 7*DIA_MS; } }
  const porBalde = (lista, f)=>baldes.map(b=>({ rot:b.rot, v:lista.filter(x=>x.at>=b.a && x.at<b.b).reduce((s,x)=>s+f(x), 0) }));
  const nomeAluno = (state.user && state.user.profile && state.user.profile.nickname) || state.user.name || (fbUser && fbUser.displayName) || 'Aluno';
  const perTxt = { '3m':'últimos 3 meses', '6m':'últimos 6 meses', '1a':'último ano', 'tudo':'todo o histórico' }[opt.per];

  // ----- componentes -----
  function secao(t, c){
    precisa(16); y += 2;
    doc.setFillColor(c[0], c[1], c[2]); doc.rect(M, y, 1.6, 7, 'F');
    fonte(13.5, 'bold'); cor(C.ink); txt(t, M + 4.5, y + 5.6);
    y += 11;
  }
  function tiles(itens, c){
    const n = itens.length, gap = 3, w = (W - gap*(n-1)) / n, h = 17;
    precisa(h + 4);
    itens.forEach((it, i)=>{
      const x = M + i*(w + gap);
      doc.setFillColor(...C.fundo); doc.roundedRect(x, y, w, h, 2.5, 2.5, 'F');
      doc.setFillColor(c[0], c[1], c[2]); doc.rect(x, y + 3, 0.9, h - 6, 'F');
      fonte(n > 4 ? 11.5 : 13, 'bold'); cor(C.ink); txt(it.v, x + 4, y + 8);
      fonte(7.5); cor(C.dim); txt(it.l, x + 4, y + 13);
    });
    y += h + 5;
  }
  function barras(dados, o){
    const h = o.h || 44, topo = 8;
    precisa(h + topo + 10);
    fonte(9.5, 'bold'); cor(C.ink); txt(o.titulo, M, y + 4);
    if(o.sub){ fonte(7.5); cor(C.dim); txt(o.sub, PW - M, y + 4, {align:'right'}); }
    const y0 = y + topo, x0 = M + 11, w = W - 11;
    const max = _niceMax(Math.max(0, ...dados.map(d=>d.v)));
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.2);
    fonte(6.5); cor(C.dim);
    for(let i = 0; i <= 4; i++){ const yy = y0 + h - h*i/4; doc.line(x0, yy, x0 + w, yy); txt(o.fmt ? o.fmt(max*i/4) : _fmtN(max*i/4, 1), x0 - 1.5, yy + 1.1, {align:'right'}); }
    const n = Math.max(1, dados.length), slot = w / n, bw = Math.min(10, slot*0.62);
    const passo = Math.ceil(n / 13);
    dados.forEach((d, i)=>{
      const bh = max ? h * d.v / max : 0; const x = x0 + slot*i + (slot - bw)/2;
      if(bh > 0){ doc.setFillColor(o.cor[0], o.cor[1], o.cor[2]); doc.rect(x, y0 + h - bh, bw, bh, 'F'); }
      if(n <= 14 && d.v > 0){ fonte(6.2); cor(C.ink); txt(o.fmt ? o.fmt(d.v) : _fmtN(d.v, 1), x + bw/2, y0 + h - bh - 1.2, {align:'center'}); }
      if(i % passo === 0){ fonte(6.2); cor(C.dim); txt(d.rot, x + bw/2, y0 + h + 4, {align:'center'}); }
    });
    y = y0 + h + 9;
  }
  function linhaGraf(pts, o){
    const h = o.h || 40, topo = 8, larg = o.w || W, x00 = o.x || M;
    if(!o.x) precisa(h + topo + 10);
    const yIni = o.y != null ? o.y : y;
    fonte(o.pequeno ? 8.5 : 9.5, 'bold'); cor(C.ink); txt(o.titulo, x00, yIni + 4);
    if(o.sub){ fonte(7); cor(C.dim); txt(o.sub, x00 + larg, yIni + 4, {align:'right'}); }
    const y0 = yIni + topo, x0 = x00 + 10, w = larg - 12;
    const vs = pts.map(p=>p.v); let lo = Math.min(...vs), hi = Math.max(...vs);
    if(hi === lo){ hi += 1; lo = Math.max(0, lo - 1); } const pad = (hi - lo)*0.12; lo = Math.max(0, lo - pad); hi += pad;
    const t0 = pts[0].t, t1 = pts[pts.length-1].t;
    const X = t=>x0 + (t1 === t0 ? w/2 : w*(t - t0)/(t1 - t0));
    const Y = v=>o.inverter ? y0 + h*(v - lo)/(hi - lo) : y0 + h - h*(v - lo)/(hi - lo);
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.2);
    fonte(6.2); cor(C.dim);
    [lo, (lo+hi)/2, hi].forEach(v=>{ const yy = Y(v); doc.line(x0, yy, x0 + w, yy); txt(o.fmt ? o.fmt(v) : _fmtN(v, (hi - lo) > 10 ? 0 : 1), x0 - 1.5, yy + 1.1, {align:'right'}); });
    doc.setDrawColor(o.cor[0], o.cor[1], o.cor[2]); doc.setLineWidth(0.7);
    for(let i = 1; i < pts.length; i++) doc.line(X(pts[i-1].t), Y(pts[i-1].v), X(pts[i].t), Y(pts[i].v));
    doc.setFillColor(o.cor[0], o.cor[1], o.cor[2]);
    if(pts.length <= 60) pts.forEach(p=>doc.circle(X(p.t), Y(p.v), 0.75, 'F'));
    fonte(6.2); cor(C.dim);
    const comAno = (t1 - t0) > 300*DIA_MS;
    txt(_dataBR(t0, comAno), x0, y0 + h + 4); txt(_dataBR(t1, comAno), x0 + w, y0 + h + 4, {align:'right'});
    if(!o.x) y = y0 + h + 9;
  }
  function tabela(cols, linhas, o){
    o = o || {};
    const larg = cols.map(c=>c.w); const tot = larg.reduce((a,b)=>a+b, 0); const k = W / tot;
    const xs = []; let acc = M; larg.forEach(w=>{ xs.push(acc); acc += w*k; });
    const cab = ()=>{ precisa(8); doc.setFillColor(...C.fundo); doc.rect(M, y, W, 6.5, 'F'); fonte(7.5, 'bold'); cor(C.dim);
      cols.forEach((c, i)=>txt(c.t, c.dir ? xs[i] + c.w*k - 1.5 : xs[i] + 1.5, y + 4.4, c.dir ? {align:'right'} : undefined)); y += 7.5; };
    cab();
    linhas.forEach(l=>{
      if(y + 6 > PH - 16){ nova(); cab(); }
      fonte(7.8); cor(C.ink);
      l.forEach((v, i)=>{ const c = cols[i]; let s = _T(v); const maxW = c.w*k - 3;
        while(s.length > 3 && doc.getTextWidth(s) > maxW) s = s.slice(0, -2);
        if(s !== _T(v)) s = s.replace(/.$/, '.');
        doc.text(s, c.dir ? xs[i] + c.w*k - 1.5 : xs[i] + 1.5, y + 3.6, c.dir ? {align:'right'} : undefined); });
      doc.setDrawColor(...C.linha); doc.setLineWidth(0.15); doc.line(M, y + 5.4, M + W, y + 5.4);
      y += 5.8;
    });
    y += 4;
  }
  function nota(s){ precisa(8); fonte(7.5, 'italic'); cor(C.dim); const ls = doc.splitTextToSize(_T(s), W); doc.text(ls, M, y + 3); y += ls.length*3.6 + 3; }

  // ----- capa -----
  doc.setFillColor(...C.band); doc.rect(0, 0, PW, 42, 'F');
  fonte(9, 'bold'); doc.setTextColor(...C.lime); txt('METATREINO', M, 13);
  fonte(21, 'bold'); doc.setTextColor(255, 255, 255); txt('Relatório de treinos', M, 25);
  fonte(9.5); doc.setTextColor(200, 206, 214);
  txt(`${nomeAluno} · ${perTxt} (${_dataBR(ini, true)} a ${_dataBR(agora, true)})`, M, 33);
  txt(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, PW - M, 13, {align:'right'});
  y = 50;
  if(aviso) nota(aviso);

  const diasAtivos = new Set([...(opt.lift ? L : []), ...(opt.run ? R : [])].map(x=>mtDia0(x.at))).size;
  const horas = [...(opt.lift ? L : []), ...(opt.run ? R : [])].reduce((s,x)=>s+(+x.duration||0), 0);
  const trofPer = Object.entries(state.trophyDates||{}).filter(([,t])=>t >= ini).length;
  tiles([
    { v:_fmtN(diasAtivos), l:'dias ativos' },
    { v:_fmtN((opt.lift ? L.length : 0) + (opt.run ? R.length : 0)), l:'sessões registradas' },
    { v:_fmtHoras(horas), l:'de treino' },
    { v:_fmtN(trofPer), l:'conquistas no período' }
  ], C.acc);

  // ----- musculação -----
  if(opt.lift){
    secao('Musculação', C.lift);
    const volTotal = _volumeArq(D, ini, agora + DIA_MS);
    const prsPer = Object.values(state.prs||{}).filter(p=>p && p.at >= ini).length;
    const exsPer = Object.keys(D.prog).filter(ex=>D.prog[ex].some(p=>p.date >= ini)).length || Object.keys(D.resumo).filter(ex=>D.resumo[ex].some(r=>r.d >= ini)).length;
    tiles([
      { v:_fmtN(L.length), l:'treinos' },
      { v:_fmtHoras(L.reduce((s,x)=>s+(+x.duration||0), 0)), l:'de musculação' },
      { v:volTotal >= 1000 ? _fmtN(volTotal/1000, 1) + ' t' : _fmtN(volTotal) + ' kg', l:'volume (carga x reps)' },
      { v:_fmtN(prsPer), l:'recordes pessoais' }
    ], C.lift);
    if(L.length || volTotal){
      barras(porBalde(L, ()=>1), { titulo:`Treinos por ${mensal?'mês':'semana'}`, cor:C.lift, h:34, fmt:v=>_fmtN(v) });
      const vb = baldes.map(b=>({ rot:b.rot, v:_volumeArq(D, b.a, b.b)/1000 }));
      if(vb.some(b=>b.v > 0)) barras(vb, { titulo:`Volume por ${mensal?'mês':'semana'}`, sub:'toneladas (carga x repetições)', cor:C.lift, h:38, fmt:v=>_fmtN(v, 1) });
      // evolução de carga
      const evo = Object.keys({...D.prog, ...D.resumo}).map(ex=>{
        const pts = arqPontosEx(D, ex).filter(p=>p.date >= ini && p.peso > 0);
        return pts.length ? { ex, nome:(typeof nomeDoEx==='function' ? nomeDoEx(ex) : ex), pts } : null;
      }).filter(Boolean).sort((a,b)=>b.pts.length - a.pts.length);
      if(evo.length){
        precisa(30);
        fonte(9.5, 'bold'); cor(C.ink); txt('Evolução de carga por exercício', M, y + 4); y += 7;
        tabela([{t:'Exercício', w:62}, {t:'Sessões', w:16, dir:1}, {t:'Primeira', w:20, dir:1}, {t:'Última', w:20, dir:1}, {t:'Melhor', w:20, dir:1}, {t:'Variação', w:20, dir:1}],
          evo.slice(0, 15).map(e=>{ const a = e.pts[0].peso, b = e.pts[e.pts.length-1].peso, m = Math.max(...e.pts.map(p=>p.peso)); const pct = a > 0 ? Math.round((b - a)/a*100) : 0;
            return [e.nome, e.pts.length, _fmtN(a,1) + ' kg', _fmtN(b,1) + ' kg', _fmtN(m,1) + ' kg', (pct > 0 ? '+' : '') + pct + '%']; }));
        const graf = evo.filter(e=>e.pts.length >= 2).slice(0, 4);
        for(let i = 0; i < graf.length; i += 2){
          const hh = 30; precisa(hh + 18); const w2 = (W - 6)/2; const yy = y;
          [graf[i], graf[i+1]].forEach((e, j)=>{ if(!e) return;
            linhaGraf(e.pts.map(p=>({t:p.date, v:p.peso})), { titulo:e.nome, sub:'carga máx. (kg)', cor:C.lift, h:hh, w:w2, x:M + j*(w2 + 6), y:yy, pequeno:true }); });
          y = yy + hh + 17;
        }
      }
    } else nota('Nenhum treino de musculação neste período.');
  }

  // ----- corrida -----
  if(opt.run){
    secao('Corrida', C.run);
    const km = corr.reduce((s,x)=>s+(+x.distance||0), 0), min = corr.reduce((s,x)=>s+(+x.duration||0), 0);
    const comPace = corr.filter(x=>+x.distance >= 1 && +x.duration > 0);
    const melhor = comPace.filter(x=>+x.distance >= 3).map(x=>x.duration/x.distance).sort((a,b)=>a-b)[0];
    tiles([
      { v:_fmtN(corr.length), l:'corridas' },
      { v:_fmtN(km, 1) + ' km', l:'percorridos' },
      { v:_fmtHoras(min), l:'correndo' },
      { v:melhor ? fmtPaceMin(melhor) : '-', l:'melhor ritmo (3 km+)' }
    ], C.run);
    if(corr.length){
      barras(porBalde(corr, x=>+x.distance||0), { titulo:`Quilômetros por ${mensal?'mês':'semana'}`, cor:C.run, h:36, fmt:v=>_fmtN(v, 1) });
      if(comPace.length >= 2) linhaGraf(comPace.map(x=>({ t:x.at, v:x.duration/x.distance })), { titulo:'Ritmo médio por corrida', sub:'min/km (mais alto no gráfico = mais rápido)', cor:C.run, h:36, inverter:true, fmt:v=>fmtPaceMin(v).replace('/km','') });
      const longas = porBalde(corr, x=>0).map((b, i)=>({ rot:b.rot, v:Math.max(0, ...corr.filter(x=>x.at>=baldes[i].a && x.at<baldes[i].b).map(x=>+x.distance||0)) }));
      if(longas.some(b=>b.v > 0)) barras(longas, { titulo:`Maior corrida de cada ${mensal?'mês':'semana'}`, sub:'km', cor:[56,152,180], h:30, fmt:v=>_fmtN(v, 1) });
    } else nota('Nenhuma corrida registrada neste período.');
    const recs = (state.corridaStats && state.corridaStats.recordes) || {};
    const RD = (typeof RUN_REC_D !== 'undefined') ? RUN_REC_D : [];
    const linhasRec = RD.filter(d=>recs[d.k]).map(d=>{ const r = recs[d.k]; return [d.nome, rFmtMin(r.min), fmtPaceMin(r.min/(r.km||d.km)), _dataBR(r.at, true), r.prova ? 'prova' : 'treino']; });
    if(linhasRec.length){ precisa(24); fonte(9.5, 'bold'); cor(C.ink); txt('Recordes pessoais (todos os tempos)', M, y + 4); y += 7;
      tabela([{t:'Distância', w:30}, {t:'Tempo', w:28, dir:1}, {t:'Ritmo', w:28, dir:1}, {t:'Data', w:26, dir:1}, {t:'Onde', w:24, dir:1}], linhasRec); }
    const provas = corr.filter(x=>x.isRace);
    if(provas.length){ precisa(20); fonte(9.5, 'bold'); cor(C.ink); txt('Provas no período', M, y + 4); y += 7;
      tabela([{t:'Data', w:24}, {t:'Prova', w:60}, {t:'Distância', w:22, dir:1}, {t:'Tempo', w:24, dir:1}, {t:'Ritmo', w:24, dir:1}],
        provas.map(p=>[_dataBR(p.at, true), p.name || 'Prova', _fmtN(p.distance, 2) + ' km', rFmtMin(p.duration), +p.distance > 0 ? fmtPaceMin(p.duration/p.distance) : '-'])); }
    const outras = R.filter(x=>!_ehCorr(x));
    if(outras.length){ const cam = outras.filter(x=>x.activity==='caminhada'), bk = outras.filter(x=>x.activity==='bike');
      nota(`Também no período: ${cam.length} caminhada(s) (${_fmtN(cam.reduce((s,x)=>s+(+x.distance||0),0),1)} km) e ${bk.length} pedal(is) de bike (${_fmtN(bk.reduce((s,x)=>s+(+x.distance||0),0),1)} km).`); }
  }

  // ----- peso corporal -----
  const pesos = (state.weights||[]).filter(w=>w.weight > 0 && w.date >= ini).sort((a,b)=>a.date-b.date);
  if(pesos.length >= 2){
    secao('Peso corporal', C.peso);
    linhaGraf(pesos.map(w=>({ t:w.date, v:+w.weight })), { titulo:'Peso registrado', sub:`${_fmtN(pesos[0].weight,1)} kg -> ${_fmtN(pesos[pesos.length-1].weight,1)} kg`, cor:C.peso, h:34 });
  }

  // ----- conquistas -----
  const trof = Object.entries(state.trophyDates||{}).filter(([,t])=>t >= ini).sort((a,b)=>b[1]-a[1]);
  if(trof.length){
    secao('Conquistas no período', C.acc);
    tabela([{t:'Conquista', w:80}, {t:'Descrição', w:76}, {t:'Data', w:24, dir:1}], trof.map(([id, t])=>{ const T0 = (TROPHIES||[]).find(x=>x.id===id) || {}; return [T0.name || id, T0.desc || '', _dataBR(t, true)]; }));
  }

  // ----- sessões -----
  if(opt.sess){
    const lista = [...(opt.lift ? L : []), ...(opt.run ? R : [])].sort((a,b)=>b.at-a.at);
    if(lista.length){
      secao('Todas as sessões', C.ink);
      const MAX = 600;
      tabela([{t:'Data', w:20}, {t:'Tipo', w:22}, {t:'Treino', w:70}, {t:'Duração', w:20, dir:1}, {t:'Detalhe', w:40, dir:1}],
        lista.slice(0, MAX).map(x=>{
          const isRun = x.module === 'run' || D.run.includes(x);
          const tipo = isRun ? (x.activity==='caminhada' ? 'Caminhada' : x.activity==='bike' ? 'Bike' : (x.isRace ? 'Prova' : 'Corrida')) : 'Musculação';
          const det = isRun ? (+x.distance > 0 ? `${_fmtN(x.distance, 2)} km · ${fmtPaceMin(x.duration/x.distance)}` : '') : ((x.exercisesDone||[]).length ? `${x.exercisesDone.length} exercícios` : '');
          return [_dataBR(x.at, true), tipo, x.name || '', x.duration ? _fmtHoras(x.duration) : '-', det];
        }));
      if(lista.length > MAX) nota(`Mostrando as ${MAX} sessões mais recentes de ${lista.length}.`);
    }
  }

  nota('Relatório gerado pelo MetaTreino a partir dos treinos registrados no app. É uma ferramenta de apoio e não substitui avaliação médica nem acompanhamento profissional.');

  // rodapé
  const n = doc.getNumberOfPages();
  for(let i = 1; i <= n; i++){
    doc.setPage(i); fonte(7); cor(C.dim);
    doc.setDrawColor(...C.linha); doc.setLineWidth(0.2); doc.line(M, PH - 11, PW - M, PH - 11);
    txt(`MetaTreino · ${nomeAluno}`, M, PH - 7); txt(`Página ${i} de ${n}`, PW - M, PH - 7, {align:'right'});
  }
  const nome = `metatreino-relatorio-${chaveDia(new Date())}.pdf`;
  return { doc, nome };
}

Object.assign(window, { arqArquivar, arqCarregar, arqApagarTudo, arqRestaurar, arqDados, arqAbrirHistorico, arqSeusDados, arqRelatorio, arqGerarPDF, arqCarregarEvo, arqNotaRetencao,
  pdfBaixar, pdfCompartilhar, admTamanhos, arqTamanhoDoc });

// =====================================================================
// 31. Beta 20 — Personalizar início + versão para computador
// =====================================================================

// ---------- Personalizar início ----------
// Cada bloco pode ser escondido. Os essenciais ficam sempre: treino de hoje, avisos
// (treinos pendentes, férias, recado do treinador, aniversário…), mural e aviso de saúde.
// Implementado só com CSS (uma <style> gerada): sobrevive a qualquer redesenho da tela.
const INICIO_BLOCOS = [
  { k:'atividade',   nome:'Atividade da semana', desc:'anéis de treinos, séries e metas', sel:['#home-quick'] },
  { k:'semana',      nome:'Semana',              desc:'os 7 dias com o status de cada treino', sel:['#scr-home .week'] },
  { k:'peso',        nome:'Peso',                grupo:'ind', sel:['#home-metrics .met[onclick*="add-weight"]'] },
  { k:'alimentacao', nome:'Alimentação',         grupo:'ind', sel:['#home-metrics .met-nutri', '#home-metrics .met[onclick*="openNutri"]'] },
  { k:'agua',        nome:'Água',                grupo:'ind', sel:['#home-metrics .met[onclick*="openAgua"]'] },
  { k:'conquistas',  nome:'Conquistas',          grupo:'ind', sel:['#home-metrics .met[onclick*="openTrophies"]', '#home-trofeus'] },
  { k:'plano',       nome:'Fase do plano',       desc:'semana do ciclo e fase atual', sel:['#scr-home .plan-card'] },
  { k:'sugestao',    nome:'Sugestão inteligente', desc:'dica do dia e plano de retomada', sel:['#home-smart'] },
  { k:'desafio',     nome:'Desafio do mês',      sel:['#card-monthly'] },
  { k:'evento',      nome:'Desafio temático',    desc:'quando houver um ativo', sel:['#home-event'] },
  { k:'treinos',     nome:'Seus treinos',        desc:'lista do plano (também na aba Treinos)', sel:['#scr-home .wrap > .section-head', '#your-list', '#home-tr-resumo'] },
  { k:'calistenia',  nome:'Calistenia',          desc:'nível e progressões, se você usa', sel:['#home-cali'] },
  { k:'frase',       nome:'Frase do dia',        sel:['#scr-home .quote'] },
  // 'ajuda' saiu na Beta 25: ajuda, FAQ, privacidade e termos agora ficam no Perfil
  { k:'acesso',      nome:'Aviso de acesso',     desc:'volta sozinho quando faltar 7 dias ou menos', sel:['#card-access-info.ac-ok'] }
];
const INICIO_ESSENCIAL = ['sugestao','desafio','evento','treinos','frase','acesso'];

function inicioOcultos(){
  if(!state) return [];
  // quem ligou o "Início enxuto" da Beta 19 continua com a mesma tela
  if(state.inicioEnxuto && !Array.isArray(state.inicioOcultos)){ state.inicioOcultos = INICIO_ESSENCIAL.slice(); delete state.inicioEnxuto; }
  if(!Array.isArray(state.inicioOcultos)) return [];
  return state.inicioOcultos.filter(k=>INICIO_BLOCOS.some(b=>b.k===k));
}
function aplicaInicio(){
  const oc = inicioOcultos();
  let st = document.getElementById('inicio-ocultos-css');
  if(!st){ st = document.createElement('style'); st.id = 'inicio-ocultos-css'; document.head.appendChild(st); }
  const sels = INICIO_BLOCOS.filter(b=>oc.includes(b.k)).flatMap(b=>b.sel);
  st.textContent = sels.length ? sels.join(',\n') + '{display:none!important}' : '';
  try{ const c = $('card-access-info'); if(c) c.classList.toggle('ac-ok', accessDaysLeft() > 7); }catch(e){}
  // indicadores: com número ímpar visível, o último ocupa a linha inteira; sem nenhum, some o bloco
  try{
    const m = $('home-metrics');
    if(m){
      const tiles = [...m.children]; tiles.forEach(t=>t.classList.remove('met-full'));
      const vis = tiles.filter(t=>getComputedStyle(t).display !== 'none');
      if(vis.length % 2 === 1 && vis.length > 1) vis[vis.length-1].classList.add('met-full');
      m.classList.toggle('met-vazio', tiles.length > 0 && !vis.length);
    }
  }catch(e){}
  // rodapé da Home: atalho discreto para personalizar
  try{
    const wrap = document.querySelector('#scr-home .wrap');
    if(wrap){
      let a = $('home-personalizar');
      if(!a){ a = document.createElement('div'); a.id = 'home-personalizar'; wrap.appendChild(a); }
      a.innerHTML = `<a href="#" onclick="openPersonalizarInicio();return false">⚙️ Personalizar início</a>${oc.length ? ` · ${oc.length} ${oc.length===1?'bloco oculto':'blocos ocultos'}` : ''}`;
    }
  }catch(e){}
  const v = $('inicio-val'); if(v) v.textContent = oc.length ? `${oc.length} ${oc.length===1?'oculto':'ocultos'} ›` : 'completo ›';
}
function openPersonalizarInicio(){
  const oc = inicioOcultos();
  const linha = b=>`<label class="pi-row"><span class="pi-txt"><b>${b.nome}</b>${b.desc?`<small>${b.desc}</small>`:''}</span>
      <input type="checkbox" class="pi-sw" data-k="${b.k}" ${oc.includes(b.k)?'':'checked'} onchange="piAlterar(this)"></label>`;
  const princ = INICIO_BLOCOS.filter(b=>b.grupo!=='ind'), ind = INICIO_BLOCOS.filter(b=>b.grupo==='ind');
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `<h3>🏠 Personalizar início</h3>
    <p class="mt-muted" style="margin:0 0 10px;font-size:12.5px;line-height:1.5">Escolha o que aparece na tela inicial. Vale na hora e é salvo na sua conta (aparece igual em outro aparelho).</p>
    <div class="pi-presets">
      <button type="button" onclick="piPreset('completo')">Tudo</button>
      <button type="button" onclick="piPreset('essencial')">Só o essencial</button>
    </div>
    <div class="pi-fixos">Sempre aparecem: <b>treino de hoje</b>, avisos importantes (treinos pendentes, férias, recado do treinador), mural e aviso de saúde.</div>
    <div class="arq-sub">Blocos</div>
    <div class="card pi-lista">${princ.map(linha).join('')}</div>
    <div class="arq-sub">Indicadores</div>
    <div class="card pi-lista">${ind.map(linha).join('')}</div>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal();goTab('home')">Pronto</button>`;
  $('modal-back').classList.add('on');
}
function piAlterar(el){
  const k = el.dataset.k; let oc = inicioOcultos();
  oc = el.checked ? oc.filter(x=>x!==k) : [...new Set([...oc, k])];
  state.inicioOcultos = oc; saveData(); aplicaInicio();
}
function piPreset(p){
  state.inicioOcultos = p === 'essencial' ? INICIO_ESSENCIAL.slice() : [];
  saveData(); aplicaInicio();
  document.querySelectorAll('.pi-sw').forEach(i=>{ i.checked = !state.inicioOcultos.includes(i.dataset.k); });
  toast(p === 'essencial' ? '🏠 Só o essencial na tela inicial' : '🏠 Tela inicial completa');
}
// compatibilidade com a Beta 19 (botões antigos)
function toggleInicioEnxuto(){ openPersonalizarInicio(); }

mtGancho('renderHome', { depois(){ try{ aplicaInicio(); mtDeskOrdenaHome(); }catch(e){ console.log('início', e); } }});
mtGancho('renderHomeMetrics', { depois(){ try{ aplicaInicio(); }catch(e){} }});
mtGancho('renderProfile', { depois(){
  try{ aplicaInicio(); const v = $('pf-dados-val'); if(v){ const pct = Math.round(arqTamanhoDoc()/DOC_LIMITE*100); v.textContent = pct + '% usado ›'; } }catch(e){}
}});

// ---------- Versão para computador ----------
// Só em tela larga com mouse (computador/notebook). Celular e tablet não mudam.
// Mesmo app, mesmos dados: só a disposição muda (menu lateral, colunas, gráficos maiores).
const MT_DESK_MQ = '(min-width: 1024px) and (hover: hover) and (pointer: fine)';
function mtDesk(){ return document.documentElement.classList.contains('mt-desk'); }
function mtDeskAplica(){
  let on = false; try{ on = window.matchMedia(MT_DESK_MQ).matches; }catch(e){}
  document.documentElement.classList.toggle('mt-desk', on);
  if(on) try{ mtDeskOrdenaHome(); }catch(e){}
}
// No celular a Home ordena os blocos com "order" do CSS (flex). No computador ela vira
// colunas, que seguem a ordem do HTML — então alinhamos a ordem do HTML à mesma ordem.
// (Mexe só na sequência dos irmãos; os blocos continuam no mesmo lugar da árvore.)
function mtDeskOrdenaHome(){
  if(!mtDesk()) return;
  const wrap = document.querySelector('#scr-home .wrap'); if(!wrap) return;
  const kids = [...wrap.children];
  const ord = kids.map((el, i)=>({ el, i, o: parseInt(getComputedStyle(el).order, 10) || 0 }));
  const sorted = ord.slice().sort((a,b)=>(a.o - b.o) || (a.i - b.i));
  if(sorted.every((x, i)=>x.el === kids[i])) return;
  sorted.forEach(x=>wrap.appendChild(x.el));
}
try{
  const mq = window.matchMedia(MT_DESK_MQ);
  if(mq.addEventListener) mq.addEventListener('change', mtDeskAplica); else if(mq.addListener) mq.addListener(mtDeskAplica);
}catch(e){}
mtDeskAplica();

Object.assign(window, { openPersonalizarInicio, piAlterar, piPreset, aplicaInicio, toggleInicioEnxuto, mtDeskAplica, mtDeskOrdenaHome });

// =====================================================================
// 32. Beta 21 — desafios (aviso final e resgate), apagar dados de ex-alunos,
//     foto do perfil mais leve
// =====================================================================

// ---------- Desafios: ninguém perde a medalha por esquecer de clicar ----------
// A contagem sempre valeu desde o 1º dia do desafio (inclusive antes de clicar em "Participar").
// Agora: (1) nos últimos 3 dias, quem ainda não entrou vê quanto já tem;
//        (2) até 7 dias depois do fim, quem cumpriu a meta sem ter entrado pode resgatar a medalha.
const EV_RESGATE_DIAS = 7;
function evResgataveis(){
  try{
    const t = Date.now();
    return todosEventos().filter(e=>t >= e.fim && t < e.fim + EV_RESGATE_DIAS*DIA_MS && !((state.eventos||{})[e.key]))
      .filter(e=>mtDiasAtivos(e.ini, e.fim).size >= metaDoEvento(e));
  }catch(err){ return []; }
}
function resgatarEvento(key){
  const e = eventoPorKey(key); if(!e) return;
  if(Date.now() >= e.fim + EV_RESGATE_DIAS*DIA_MS){ toast('O prazo para resgatar esta medalha acabou'); return; }
  participaEvento(key);   // a contagem é do período do desafio; a medalha sai na hora se a meta foi cumprida
}
function _evAvisoFinal(e){
  const reg = (state.eventos||{})[e.key]; if(reg) return '';
  const p = progressoEvento(e); if(p.terminou || !p.comecou || p.restam > 3) return '';
  const quando = p.restam === 0 ? 'Hoje é o último dia' : (p.restam === 1 ? 'Falta 1 dia' : `Faltam ${p.restam} dias`);
  return p.dias >= p.alvo
    ? `${quando}: você <b>já cumpriu a meta</b> (${p.dias} de ${p.alvo} dias). Entre no desafio para receber a medalha.`
    : `${quando}: você já tem <b>${p.dias} de ${p.alvo}</b> dias ativos. Entre no desafio para garantir a medalha — os treinos que já fez contam.`;
}
const _evHeroB21 = window._evHero;
window._evHero = function(e, opts){
  let h = _evHeroB21.apply(this, arguments);
  try{ const av = _evAvisoFinal(e); if(av && !(opts && opts.semBotoes)) h = h.replace('<div class="ev-cta">', `<div class="ev-aviso">⏳ ${av}</div><div class="ev-cta">`); }catch(err){}
  return h;
};
const _renderChallengesB21 = window.renderChallenges;
window.renderChallenges = function(){
  const r = _renderChallengesB21.apply(this, arguments);
  try{
    const root = $('chal-root'); const rs = evResgataveis();
    if(root && rs.length){
      const box = document.createElement('div'); box.id = 'ev-resgate';
      box.innerHTML = `<div class="mt-sec">Medalha para resgatar</div>` + rs.map(e=>{
        const ate = mtFmtData(e.fim + EV_RESGATE_DIAS*DIA_MS - 1);
        return `<div class="card ev-medal ev-resg">${eventoMedalha(e, 52)}<div style="flex:1;min-width:0"><b style="font-size:14.5px">${mtEsc(e.nome)}</b>
          <div class="mt-muted" style="font-size:12px;line-height:1.45">O desafio terminou e você cumpriu a meta (${mtDiasAtivos(e.ini, e.fim).size} dias ativos), mas não tinha entrado. Resgate até ${ate}.</div>
          <button class="btn btn-primary" style="margin-top:8px;padding:9px 14px;font-size:13px" onclick="resgatarEvento('${e.key}')">🏅 Resgatar medalha</button></div></div>`;
      }).join('');
      root.insertBefore(box, root.firstChild);
    }
  }catch(err){ console.log('resgate', err); }
  return r;
};
mtGancho('renderMonthlyCard', { depois(){
  try{
    const card = $('card-monthly'); if(!card) return;
    const e = eventoPrincipal(); const row = $('home-ev-row');
    const av = e && _evAvisoFinal(e);
    if(row){ let a = $('home-ev-aviso'); if(av){ if(!a){ a = document.createElement('div'); a.id = 'home-ev-aviso'; a.className = 'ev-aviso'; row.appendChild(a); } a.innerHTML = '⏳ ' + av; } else if(a) a.remove(); }
    const rs = evResgataveis(); let rb = $('home-ev-resgate');
    if(rs.length){
      if(!rb){ rb = document.createElement('div'); rb.id = 'home-ev-resgate'; card.insertBefore(rb, card.firstChild); }
      rb.innerHTML = `<div class="ev-aviso" style="margin:0 0 12px">🏅 Você cumpriu a meta de <b>${mtEsc(rs[0].nome)}</b>. <a href="#" onclick="event.stopPropagation();resgatarEvento('${rs[0].key}');return false">Resgatar medalha</a></div>`;
      card.classList.remove('hidden');
    } else if(rb) rb.remove();
  }catch(err){ console.log('aviso desafio', err); }
}});

// ---------- Painel ADM: apagar dados de quem não é mais aluno ----------
function admTemAcesso(email){
  const a = (typeof allowCache !== 'undefined' && allowCache) ? allowCache[email] : null;
  return !!(a && a.active && (!a.expiresAt || a.expiresAt > Date.now()));
}
function _semAcento(s){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim(); }
function admApagarAluno(email){
  if(!mtPrincipal()){ toast('🛡️ Só o administrador principal pode apagar dados'); return; }
  const u = usuariosCache[email]; if(!u || !u._uid){ toast('Aluno não encontrado'); return; }
  const meu = String((fbUser && fbUser.email) || '').toLowerCase();
  if(email === meu || email === String(ADMIN_EMAIL).toLowerCase()){ toast('🛡️ Esta conta não pode ser apagada'); return; }
  if(admTemAcesso(email)){ toast('Este aluno ainda tem acesso. Bloqueie ou remova o acesso antes.'); return; }
  const nome = u.nome || (u.estadoApp && u.estadoApp.user && u.estadoApp.user.profile && u.estadoApp.user.profile.nickname) || email;
  const st = u.estadoApp || {}; const nH = (((st.modules||{}).lift||{}).history||[]).length + (((st.modules||{}).run||{}).history||[]).length;
  window._admApagar = { email, nome };
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `<h3>🗑️ Apagar dados do aluno</h3>
    <div class="card" style="padding:12px 14px;font-size:13px;line-height:1.6">
      <div class="mrow"><span>Aluno</span><b>${mtEsc(nome)}</b></div>
      <div class="mrow"><span>E-mail</span><span>${mtEsc(email)}</span></div>
      <div class="mrow"><span>Sessões (últimos 90 dias)</span><span>${nH}</span></div>
      <div class="mrow"><span>Tamanho</span><span>${_fmtKB(_bytesDe(u))} + arquivo anual</span></div>
    </div>
    <p class="mt-muted" style="font-size:12.5px;line-height:1.55;margin:10px 0">
      1. O app <b>baixa um backup</b> completo neste aparelho (inclui o arquivo anual). Se o backup não sair, nada é apagado.<br>
      2. Apaga da nuvem: treinos, histórico, arquivo anual, participação nos desafios e o cadastro de acesso.<br>
      Se a pessoa voltar, é só liberar o acesso de novo e restaurar o backup no Perfil dela.<br>
      <b>O login</b> (e-mail/senha ou Google) só pode ser apagado no Console do Firebase → Authentication; sem acesso liberado, ele não entra em nada.</p>
    <div class="field"><label>Para confirmar, digite o nome: <b>${mtEsc(nome)}</b></label><input class="input" id="adm-apagar-conf" autocomplete="off"></div>
    <div id="adm-apagar-st" class="mt-muted" style="font-size:12px;min-height:16px"></div>
    <button class="btn btn-perigo btn-block" id="adm-apagar-go" style="margin-top:8px" onclick="admApagarConfirma()">Baixar backup e apagar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="admTamanhos()">Cancelar</button>`;
  $('modal-back').classList.add('on');
}
async function admApagarConfirma(){
  const ctx = window._admApagar; if(!ctx) return;
  const { email, nome } = ctx; const u = usuariosCache[email]; if(!u) return;
  const st = $('adm-apagar-st'), bt = $('adm-apagar-go'); const fala = t=>{ if(st) st.innerHTML = t; };
  if(_semAcento(($('adm-apagar-conf')||{}).value) !== _semAcento(nome)){ fala('O nome digitado não confere.'); return; }
  if(!mtPrincipal() || admTemAcesso(email)) return;
  const uid = u._uid;
  if(bt){ bt.disabled = true; bt.textContent = '⏳ Fazendo backup...'; }
  // 1) backup — sem backup, não apaga
  let docsArq = {};
  try{
    const snap = await _comPrazo(_arqCol(uid).get({ source:'server' }), 20000);
    snap.forEach(d=>{ docsArq[d.id] = d.data(); });
    const arquivo = {}; Object.keys(docsArq).forEach(id=>{ arquivo[id] = _arqLer(docsArq[id]); });
    const data = { app:'MetaTreino', versao:APP_VERSION, exportadoEm:new Date().toISOString(), aluno:{ email, nome }, estado:u.estadoApp || {}, arquivo };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `metatreino-backup-${_semAcento(nome).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'aluno'}-${chaveDia(new Date())}.json`;
    document.body.appendChild(a); a.click(); setTimeout(()=>{ try{ URL.revokeObjectURL(a.href); a.remove(); }catch(e){} }, 4000);
  }catch(e){
    console.log('backup do aluno', e);
    fala('⚠️ Não consegui fazer o backup (sem conexão?). <b>Nada foi apagado.</b>');
    if(bt){ bt.disabled = false; bt.textContent = 'Baixar backup e apagar'; }
    return;
  }
  // 2) apagar
  if(bt) bt.textContent = '⏳ Apagando...';
  const extras = [];
  Object.keys(docsArq).forEach(id=>extras.push(_arqCol(uid).doc(id).delete()));
  Object.keys((u.estadoApp && u.estadoApp.eventos) || {}).forEach(k=>extras.push(db.collection('desafiosTematicos').doc(k).collection('participantes').doc(uid).delete()));
  const resExtras = await Promise.allSettled(extras);
  const falhasExtras = resExtras.filter(x=>x.status === 'rejected').length;
  // Beta 35: a mesma pessoa pode ter outros documentos (um por forma de login): saem também, com o vínculo
  const outros = (u._uids || []).filter(x=>x && x !== uid);
  for(const o of outros){
    try{ const sn = await _comPrazo(_arqCol(o).get({ source:'server' }), 15000); const ps = []; sn.forEach(d=>ps.push(_arqCol(o).doc(d.id).delete())); Object.keys((u.estadoApp && u.estadoApp.eventos) || {}).forEach(k=>ps.push(db.collection('desafiosTematicos').doc(k).collection('participantes').doc(o).delete())); await Promise.allSettled(ps); }catch(e){}
    try{ await _comPrazo(db.collection('usuarios').doc(o).delete(), 15000); }catch(e){ console.log('documento antigo do aluno', e); }
  }
  try{ await db.collection('contas').doc(String(email).toLowerCase()).delete(); }catch(e){}
  try{
    await _comPrazo(db.collection('usuarios').doc(uid).delete(), 20000);
  }catch(e){
    console.log('apagar aluno', e);
    fala('⚠️ O backup foi baixado, mas não consegui apagar o documento principal. Confira a conexão e tente de novo.');
    if(bt){ bt.disabled = false; bt.textContent = 'Tentar de novo'; }
    return;
  }
  try{ if(allowCache[email]) await db.collection('usuariosAutorizados').doc(email).delete(); delete allowCache[email]; }catch(e){ console.log('acesso', e); }
  delete usuariosCache[email];
  window._admApagar = null;
  toast(`🗑️ Dados de ${nome} apagados. O backup foi baixado.` + (falhasExtras ? ' (algumas participações em desafios ficaram — publique as regras novas do Firestore)' : ''), 5000);
  try{ renderAdminStats(); renderAdminList(); renderAdminKpis(); }catch(e){}
  admTamanhos();
}
// no perfil do aluno (painel): botão de apagar para quem está sem acesso
mtGancho('openStudent', { depois(email){
  try{
    if(mtPrincipal() && !admTemAcesso(email) && usuariosCache[email]){
      const c = $('stud-content');
      if(c && !$('stud-apagar')){ const b = document.createElement('button'); b.id = 'stud-apagar'; b.className = 'btn btn-ghost btn-block'; b.style.cssText = 'margin-top:8px;color:var(--danger-soft);border-color:var(--line-danger)';
        b.textContent = '🧹 Apagar dados do aluno (com backup)'; b.onclick = ()=>admApagarAluno(email); c.appendChild(b); }
    }
  }catch(e){}
}});

// ---------- Foto do perfil mais leve ----------
// Aparece no máximo a ~80 px. 160 px já fica nítida em tela de alta densidade
// e ocupa cerca de metade da foto antiga de 240 px. Fotos novas já saem em 160 px
// (app.js); as antigas são reduzidas uma vez, ao abrir o Perfil.
function fotoPerfilLeve(data, cb){
  const img = new Image();
  img.onload = ()=>{
    try{
      const c = document.createElement('canvas'); const sz = 160; c.width = c.height = sz;
      const s = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width-s)/2, (img.height-s)/2, s, s, 0, 0, sz, sz);
      const out = c.toDataURL('image/jpeg', 0.82);
      cb(out.length < data.length ? out : data);
    }catch(e){ cb(data); }
  };
  img.onerror = ()=>cb(data);
  img.src = data;
}
function _encolheFotoAntiga(){
  try{
    const p = state && state.user && state.user.profile;
    if(!p || !p.photo || String(p.photo).length < 14000 || p.fotoLeve) return;
    fotoPerfilLeve(p.photo, nova=>{ if(state.user && state.user.profile === p){ p.photo = nova; p.fotoLeve = 1; saveData(); try{ renderProfile(); }catch(e){} } });
  }catch(e){}
}
mtGancho('renderProfile', { depois(){ setTimeout(_encolheFotoAntiga, 800); }});

Object.assign(window, { resgatarEvento, admApagarAluno, admApagarConfirma, admTemAcesso, evResgataveis });

// =====================================================================
// 33. Beta 22 — Perfil em grupos recolhíveis
// =====================================================================
// O Perfil tinha ~20 linhas soltas. Agora: dados do corpo e do plano em cima e
// quatro grupos (Ajustar plano, Treino, Aplicativo, Conta e dados) que abrem com um toque.
// O app lembra quais grupos o aluno deixou abertos (neste aparelho).
function _pfGruposAbertos(){ try{ return JSON.parse(localStorage.getItem('mt_pf_grupos') || '[]'); }catch(e){ return []; } }
function pfGruposInit(){
  const abertos = _pfGruposAbertos();
  document.querySelectorAll('#scr-profile details.pf-grp').forEach(d=>{
    if(d.dataset.ok) return; d.dataset.ok = '1';
    if(abertos.includes(d.id)) d.open = true;
    d.addEventListener('toggle', ()=>{
      try{ const s = new Set(_pfGruposAbertos()); d.open ? s.add(d.id) : s.delete(d.id); localStorage.setItem('mt_pf_grupos', JSON.stringify([...s])); }catch(e){}
    });
  });
}
function pfGruposStatus(){
  // dor ou férias ativos aparecem no cabeçalho do grupo Treino, mesmo fechado
  const st = $('pf-g-treino-st'); if(!st) return;
  const it = [];
  try{ if(((state.user && state.user.pain) || []).length) it.push('🩹 com dor'); }catch(e){}
  try{ if(typeof vacationActive === 'function' && vacationActive()) it.push('🌴 férias'); }catch(e){}
  st.textContent = it.join(' · ');
}
mtGancho('renderProfile', { depois(){
  try{ pfGruposInit(); pfGruposStatus(); }catch(e){ console.log('perfil grupos', e); }
}});
// abrir um item do Perfil por outro caminho (ex.: Meta Assistente) abre o grupo dele
function pfAbrirGrupoDe(id){ const el = $(id); const d = el && el.closest('details.pf-grp'); if(d) d.open = true; }
Object.assign(window, { pfGruposInit, pfAbrirGrupoDe });

// =====================================================================
// 34. Beta 23 — Desempenho e Histórico mais diretos
// =====================================================================
// Desempenho: resumo numa grade só → Evolução (gráficos) logo depois → calendário
// (recolhível) → recordes, metas e distribuição. Nada sai da tela: só muda a ordem.
// Histórico: sem o cabeçalho repetido; o gráfico de volume/km por semana começa recolhido.
function _secaoRecolhivel(el, chave, padraoAberto, titulo){
  if(!el) return;
  const aberto = (()=>{ const v = mtLS('mt_col_'+chave); return v===null || v===undefined ? padraoAberto : v==='1'; })();
  el.classList.toggle('sec-fechada', !aberto);
  let b = el.querySelector(':scope .sec-tg');
  if(!b){
    b = document.createElement('button'); b.type = 'button'; b.className = 'col-txt sec-tg';
    b.onclick = (ev)=>{ ev.stopPropagation(); const ab = el.classList.contains('sec-fechada'); mtLS('mt_col_'+chave, ab ? '1' : '0'); _secaoRecolhivel(el, chave, padraoAberto, titulo); };
    const alvo = el.querySelector('.sec-head') || el.firstElementChild; if(alvo) alvo.appendChild(b);
  }
  b.textContent = aberto ? 'Ocultar' : 'Mostrar';
  b.setAttribute('aria-expanded', String(aberto)); b.setAttribute('aria-label', (aberto?'Ocultar ':'Mostrar ') + titulo);
}
function perfReorganiza(){
  const wrap = document.querySelector('#scr-perf .wrap'); if(!wrap) return;
  const cal = $('calendar'); const calCard = cal && cal.closest('.card'); if(!calCard) return;
  // 1) resumo: as duas fileiras de números viram um bloco só
  let res = $('perf-resumo');
  if(!res){
    res = document.createElement('div'); res.id = 'perf-resumo';
    const grades = [...wrap.querySelectorAll(':scope > .stat-grid')];
    if(grades.length){ grades[0].before(res); grades.forEach(g=>res.appendChild(g)); }
  }
  const l3 = $('s3-lbl'); if(l3 && /Recordes/.test(l3.textContent)) l3.textContent = 'Recordes';
  // 2) ordem: resumo → evolução (e cartões ligados a ela) → calendário
  const evo = $('perf-evo');
  const empty = $('perf-empty');
  const ancora = empty || calCard;
  if(res.parentElement === wrap) ancora.after(res);
  let ult = res;
  [evo, $('perf-cali'), $('perf-run-card')].forEach(el=>{ if(el && el.parentElement === wrap){ ult.after(el); ult = el; } });
  if(calCard.previousElementSibling !== ult) ult.after(calCard);
  const rec = $('card-records'); if(rec && rec.previousElementSibling !== calCard) calCard.after(rec);
  // 3) calendário recolhível (aberto por padrão; a escolha fica lembrada)
  calCard.classList.add('cal-card');
  const head = calCard.firstElementChild; if(head) head.classList.add('sec-head');
  _secaoRecolhivel(calCard, 'calendario', true, 'calendário');
}
mtGancho('renderPerf', { depois(){ try{ perfReorganiza(); }catch(e){ console.log('desempenho', e); } }});

function histReorganiza(){
  const ev = $('hist-evo'); if(!ev) return;
  const t = $('hist-evo-title');
  if(t && !t.parentElement.classList.contains('sec-head')){
    const h = document.createElement('div'); h.className = 'sec-head'; t.before(h); h.appendChild(t);
  }
  _secaoRecolhivel(ev, 'hist_grafico', false, 'gráfico semanal');
  let link = $('hist-evo-mais');
  if(!link){ link = document.createElement('a'); link.id = 'hist-evo-mais'; link.href = '#'; link.className = 'hist-evo-mais'; link.textContent = 'Mais gráficos em Desempenho →'; link.onclick = (e)=>{ e.preventDefault(); goTab('perf'); }; ev.appendChild(link); }
}
mtGancho('renderHistory', { depois(){ try{ histReorganiza(); }catch(e){ console.log('histórico', e); } }});
Object.assign(window, { perfReorganiza, histReorganiza });

// =====================================================================
// 35. Beta 25 — Plano alimentar: excluir/editar sem voltar ao topo
// =====================================================================
// Toda ação do plano alimentar (remover, editar, adicionar, voltar ao recomendado)
// redesenha a janela com openNutri(). Antes a rolagem voltava ao início e o aluno
// tinha de procurar o jantar de novo a cada alimento. Agora:
//  • a posição da rolagem é guardada enquanto o aluno está na lista;
//  • ao voltar de uma edição (ou depois de remover), a lista reabre no mesmo ponto;
//  • a refeição continua aberta (já era guardada em __nutriAbertos);
//  • o foco volta para o item vizinho do que foi removido (ou para a refeição).
// Abrir o plano alimentar "do zero" (pela tela inicial) continua começando do topo.
let _nutriRol = [];          // rolagem da janela e das listas roláveis dentro dela (na ordem em que aparecem)
let _nutriFoco = null;
function _nutriMi(){ return document.getElementById('modal-inner'); }
function _nutriEmTela(){ const mi = _nutriMi(); return !!(mi && document.getElementById('modal-back').classList.contains('on') && (mi.dataset.tela === 'nutri' || mi.dataset.tela === 'nutri-sub')); }
function _nutriRolaveis(){
  const mi = _nutriMi(); if(!mi) return [];
  return [mi, ...[...mi.querySelectorAll('*')].filter(e=>/(auto|scroll)/.test(getComputedStyle(e).overflowY))];
}
function _nutriLeRol(){ return _nutriRolaveis().map(e=>e.scrollTop); }
function _nutriAplicaRol(pos){ const els = _nutriRolaveis(); (pos||[]).forEach((v,i)=>{ if(els[i]) els[i].scrollTop = v; }); }
(function(){
  const mi = _nutriMi(); if(!mi || mi.dataset.nutriRol) return; mi.dataset.nutriRol = '1';
  // "scroll" não sobe pela árvore, mas pode ser capturado: pega a janela e as listas internas
  mi.addEventListener('scroll', ()=>{ if(mi.dataset.tela === 'nutri') _nutriRol = _nutriLeRol(); }, { passive:true, capture:true });
})();
// guarda qual controle estava em foco (e de qual refeição) antes de redesenhar
function _nutriGuardaFoco(){
  const a = document.activeElement; const mi = _nutriMi();
  if(!a || !mi) { _nutriFoco = null; return; }
  const oc = a.getAttribute('onclick') || '';
  const m = oc.match(/'([^']+)'/);
  // vindo de uma tela interna (editar/adicionar), volta o foco para a refeição que estava sendo mexida
  const midSub = (window.__ned && window.__ned.mid) || window.__nutriAddMid || null;
  _nutriFoco = (m && /nutri(Remover|Editar|AddEditar|AddAbrir|ResetRefeicao)/.test(oc)) ? { oc, mid:m[1] } : { oc:null, mid:midSub };
}
function _nutriRestauraFoco(){
  const f = _nutriFoco; _nutriFoco = null; const mi = _nutriMi(); if(!f || !mi) return;
  let alvo = null;
  try{
    if(f.oc) alvo = [...mi.querySelectorAll('[onclick]')].find(e=>e.getAttribute('onclick') === f.oc);
    if(!alvo && f.mid) alvo = [...mi.querySelectorAll('[onclick]')].find(e=>(e.getAttribute('onclick')||'').includes("'"+f.mid+"'"));
  }catch(e){}
  if(alvo && alvo.focus) try{ alvo.focus({ preventScroll:true }); }catch(e){}
}
const _openNutriB25 = window.openNutri;
window.openNutri = function(){
  const voltando = _nutriEmTela();
  const pos = voltando ? _nutriRol.slice() : [];
  if(voltando) _nutriGuardaFoco();
  const mi = _nutriMi(); if(mi) mi.dataset.tela = 'nutri';
  const r = _openNutriB25.apply(this, arguments);
  if(mi){
    mi.dataset.tela = 'nutri';
    _nutriAplicaRol(pos); _nutriRol = pos;
    // o navegador pode recalcular a altura depois de desenhar: confirma no próximo quadro
    requestAnimationFrame(()=>{ if(mi.dataset.tela === 'nutri'){ _nutriAplicaRol(pos); _nutriRol = _nutriLeRol(); } _nutriRestauraFoco(); });
  }
  return r;
};
// telas internas do plano (editar quantidade, adicionar, alimento próprio): marcar ANTES de trocar o conteúdo
['nutriEdRender','nutriAddRender','nutriAddCustom','nutriListaCompras'].forEach(nome=>{
  const orig = window[nome]; if(typeof orig !== 'function') return;
  window[nome] = function(){ const mi = _nutriMi(); if(mi && _nutriEmTela()) mi.dataset.tela = 'nutri-sub'; const r = orig.apply(this, arguments); if(mi && mi.dataset.tela === 'nutri-sub') mi.scrollTop = 0; return r; };
});
// fechar a janela: a próxima abertura começa do topo
mtGancho('closeModal', { depois(){ const mi = _nutriMi(); if(mi) delete mi.dataset.tela; _nutriRol = []; } });

// =====================================================================
// 36. Beta 25 — Escala de esforço (RPE 1 a 10) redesenhada
// =====================================================================
// Mesma escala, mesmos textos (RPE_LBL / RPE_DESC) e o mesmo valor salvo
// (window.__rpe), usado pelos registros de musculação, corrida e outras atividades.
// Mudou só a aparência e a interação:
//  • uma régua contínua com 10 posições do mesmo tamanho (fácil de tocar);
//  • cores graduais e suaves (verde-água → âmbar → coral), sem efeito "semáforo";
//  • dá para tocar ou deslizar o dedo pela régua;
//  • teclado: setas, Home e End (acessível como grupo de opções).
const RPE_ZONA = n => n<=3 ? 'Leve' : n<=6 ? 'Moderado' : n<=8 ? 'Intenso' : 'Máximo';
function rpeCor(n){
  // de verde-água (165°) a coral (8°), saturação e luz contidas
  const t = (n-1)/9; const h = Math.round(165 - t*157); const s = Math.round(48 + t*14); const l = Math.round(50 - t*4);
  return `hsl(${h} ${s}% ${l}%)`;
}
window.rpeHtml = function(def, modo){
  // modo 'musc' (fim do treino de musculação) troca só as frases de baixo; o padrão é corrida/caminhada/bike
  window.__rpeModo = modo === 'musc' ? 'musc' : 'aero';
  def = Math.min(10, Math.max(1, Math.round(+def || 5)));
  window.__rpe = def;
  const cel = [1,2,3,4,5,6,7,8,9,10].map(n=>`<button type="button" role="radio" aria-checked="${n===def}" aria-label="${n}: ${RPE_LBL[n]}" tabindex="${n===def?0:-1}"
      class="rpe2-c ${n===def?'on':''} ${n<def?'abaixo':''}" data-n="${n}" style="--rc:${rpeCor(n)}" onclick="rpeSet(${n})"><span>${n}</span></button>`).join('');
  return `<div class="rpe rpe2" style="--rsel:${rpeCor(def)}">
    <div class="rpe2-trilho" id="rpe-bars" role="radiogroup" aria-label="Esforço percebido de 1 a 10">${cel}</div>
    <div class="rpe2-zonas" aria-hidden="true"><span>Leve</span><span>Moderado</span><span>Intenso</span><span>Máx.</span></div>
    <div class="rpe-lbl rpe2-lbl" id="rpe-lbl" aria-live="polite">${_rpeLbl(def)}</div>
  </div>`;
};
function _rpeLbl(n){ return `<span class="rpe2-num">${n}</span><span class="rpe2-txt"><b>${RPE_LBL[n]}</b><small>${rpeDesc(n)}</small></span><span class="rpe2-zona">${RPE_ZONA(n)}</span>`; }
window.rpeSet = function(n){
  n = Math.min(10, Math.max(1, Math.round(+n) || 5));
  window.__rpe = n;
  const tr = document.getElementById('rpe-bars');
  if(tr){
    tr.querySelectorAll('.rpe2-c, .rpe-b').forEach(b=>{ const v = +b.dataset.n; const on = v===n;
      b.classList.toggle('on', on); b.classList.toggle('abaixo', v<n);
      b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1;
      if(on){ b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } });
    const box = tr.closest('.rpe2'); if(box) box.style.setProperty('--rsel', rpeCor(n));
  }
  const l = document.getElementById('rpe-lbl'); if(l) l.innerHTML = _rpeLbl(n);
  try{ if(navigator.vibrate) navigator.vibrate(6); }catch(e){}
};
// deslizar o dedo e teclado
(function(){
  let arrastando = false;
  const valorEm = (tr, x)=>{ const r = tr.getBoundingClientRect(); return Math.min(10, Math.max(1, Math.floor((x - r.left) / (r.width/10)) + 1)); };
  document.addEventListener('pointerdown', e=>{ const tr = e.target.closest && e.target.closest('.rpe2-trilho'); if(!tr) return; arrastando = true; });
  document.addEventListener('pointermove', e=>{ if(!arrastando) return; const tr = document.getElementById('rpe-bars'); if(!tr || !tr.classList.contains('rpe2-trilho')) return;
    const n = valorEm(tr, e.clientX); if(n !== window.__rpe) rpeSet(n); }, { passive:true });
  document.addEventListener('pointerup', ()=>{ arrastando = false; });
  document.addEventListener('pointercancel', ()=>{ arrastando = false; });
  document.addEventListener('keydown', e=>{
    const tr = e.target.closest && e.target.closest('.rpe2-trilho'); if(!tr) return;
    const atual = window.__rpe || 5; let n = null;
    if(e.key==='ArrowRight' || e.key==='ArrowUp') n = atual+1; else if(e.key==='ArrowLeft' || e.key==='ArrowDown') n = atual-1;
    else if(e.key==='Home') n = 1; else if(e.key==='End') n = 10;
    if(n===null) return; e.preventDefault(); rpeSet(n);
    const b = tr.querySelector('.rpe2-c.on'); if(b) b.focus();
  });
})();

// =====================================================================
// 37. Beta 25 — Medalhas maiores e com profundidade; fundos decorativos novos
// =====================================================================

// ---------- Medalhas ----------
// Mesmo desenho de cada conquista (o glifo e o rótulo próprios de cada uma), agora:
//  • símbolo ~25% maior dentro da moldura;
//  • profundidade: brilho no alto do disco, sombra interna e aro duplo;
//  • três níveis visuais:
//      comum    → aro simples
//      rara     → aro duplo (as conquistas mais difíceis de cada categoria: o último terço)
//      especial → aro com ornamento dourado (conquistas secretas)
//  Nada muda nos critérios ou nos ids — só o desenho.
function medalNivel(t){
  if(!t) return 'comum';
  if(t.secret) return 'especial';
  const mesma = TROPHIES.filter(x=>!x.secret && x.cat===t.cat);
  const i = mesma.findIndex(x=>x.id===t.id);
  return (mesma.length >= 3 && i >= Math.ceil(mesma.length*2/3)) ? 'rara' : 'comum';
}
window.medalSvg = function(glyph, label, extra, nivel){
  const g = TROPHY_GLYPH[glyph] || TROPHY_GLYPH.medal;
  // glifo de 24 u. ampliado: 30 u. sem rótulo, 25 u. com rótulo (o número fica embaixo)
  const esc = label ? 1.05 : 1.25, tam = 24*esc;
  const gx = 24 - tam/2, gy = label ? 4.6 : 24 - tam/2;
  const aro = nivel === 'especial'
    ? `<circle class="tb-orn" cx="24" cy="24" r="23.2"/><circle class="tb-ring" cx="24" cy="24" r="21.6"/>`
    : nivel === 'rara'
      ? `<circle class="tb-ring" cx="24" cy="24" r="22.4"/><circle class="tb-ring2" cx="24" cy="24" r="20.3"/>`
      : `<circle class="tb-ring" cx="24" cy="24" r="22"/>`;
  return `<svg viewBox="0 0 48 48">${extra||''}${aro}<circle class="tb-in" cx="24" cy="24" r="18.5"/>`
    + `<path class="tb-luz" d="M8.2 21.5A16 16 0 0 1 39.8 21.5A19 14 0 0 0 8.2 21.5Z"/><circle class="tb-sombra" cx="24" cy="24" r="18"/>`
    + `<g class="tb-g" transform="translate(${gx.toFixed(2)} ${gy.toFixed(2)}) scale(${esc})">${g}</g>`
    + `${label?`<text x="24" y="41.6" class="tb-l">${mtEsc(label)}</text>`:''}</svg>`;
};
window.trophyIco = function(t, dim){
  if(!t) return '';
  const def = TROPHY_ICO[t.id] || ['medal'];
  const cat = t.secret ? 'secret' : (t.cat||'geral');
  const nv = medalNivel(t);
  return `<span class="tbadge ${cat} nv-${nv}${dim?' dim':''}" role="img" aria-label="${mtEsc(t.name||'')}">${medalSvg(def[0], def[1], '', nv)}</span>`;
};
// detalhe da conquista: medalha bem maior e selo do nível
mtGancho('openTrophyDetail', { depois(id){
  const t = TROPHIES.find(x=>x.id===id); const box = $('modal-inner'); if(!t || !box) return;
  const med = box.querySelector('.tr-medal'); if(med) med.classList.add('tr-grande');
  const nome = box.querySelector('h3'); const nv = medalNivel(t);
  if(nome && !box.querySelector('.tr-nivel')){
    const s = document.createElement('div'); s.className = 'tr-nivel nv-' + nv;
    s.textContent = nv === 'especial' ? 'Especial' : nv === 'rara' ? 'Rara' : 'Comum';
    nome.before(s);
  }
}});

// ---------- Fundos decorativos (Beta 36: nova linguagem visual e curadoria por aba) ----------
// Cada desenho fica numa "faixa" no topo da aba, à direita, entre o cabeçalho e o primeiro cartão:
// a altura é medida na hora (decoPosiciona), então o desenho nunca passa por trás de cartões, bandeiras
// ou listas. Linguagem comum: um disco suave na cor principal (profundidade), formas com preenchimento
// translúcido na cor do texto e um único detalhe na cor principal. SVG parado: sem animação, sem gasto
// de bateria, e some com a opção "Fundo decorativo".
// Curadoria (Beta 36):
//   Início ........ melhorado (cena do horário/clima, parte 28)
//   Treinos ....... substituído (barra e anilhas; corrida: pista em curva)
//   Biblioteca .... substituído (fichas empilhadas com o vídeo)
//   Plano ......... melhorado (calendário com os dias de treino)
//   Desafios ...... melhorado (medalha só na faixa do título; não cruza mais a bandeira do desafio)
//   Perfil ........ mantido (pessoa e arco de evolução), redesenhado na nova linguagem e só na faixa do topo
//   Histórico ..... mantido (relógio voltando no tempo), pequeno, ao lado do título
//   Progresso ..... mantido (gráfico subindo), pequeno, ao lado do título — nunca atrás dos gráficos
const DECO3 = (corpo, vb)=>`<svg viewBox="${vb||'0 0 220 120'}" preserveAspectRatio="xMaxYMid meet" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${corpo}</svg>`;
// classes: .d-fundo (disco na cor principal) · .d-fill (preenchimento translúcido) · .d-ac (traço na cor principal) · .d-acf (preenchimento na cor principal)
const DECO2_SVG = {
  musculacao: DECO3(`<circle class="d-fundo" cx="164" cy="60" r="50"/>
    <path class="d-linha" d="M70 60h142" stroke-width="3.2"/>
    <rect class="d-fill" x="98" y="30" width="14" height="60" rx="4.5"/><rect class="d-fill" x="114" y="39" width="9" height="42" rx="3.5"/>
    <rect class="d-fill" x="180" y="30" width="14" height="60" rx="4.5"/><rect class="d-fill" x="169" y="39" width="9" height="42" rx="3.5"/>
    <path class="d-ac" d="M105 40v40M187 40v40" stroke-width="2.2"/><path class="d-linha" d="M126 56v8M166 56v8" stroke-width="2.4"/>`),
  corrida: DECO3(`<circle class="d-fundo" cx="172" cy="64" r="48"/>
    <path class="d-fill" d="M96 120a124 124 0 0 1 124-124v26a98 98 0 0 0-98 98z"/>
    <path class="d-linha" d="M96 120a124 124 0 0 1 124-124M122 120a98 98 0 0 1 98-98"/>
    <path class="d-ac" d="M109 120a111 111 0 0 1 111-111" stroke-width="2.2" stroke-dasharray="2 7"/>
    <path class="d-linha" d="M150 30l14 8M141 41l14 8" stroke-opacity=".7"/><path class="d-ac" d="M176 8v24" stroke-width="2.2"/><path class="d-acf" d="M176 8h18l-5 6 5 6h-18z" stroke="none"/>`),
  biblioteca: DECO3(`<circle class="d-fundo" cx="160" cy="58" r="50"/>
    <rect class="d-fill" x="130" y="16" width="76" height="54" rx="10" transform="rotate(8 168 43)"/>
    <rect class="d-fill" x="116" y="28" width="80" height="58" rx="11"/>
    <path class="d-linha" d="M130 72h34M130 80h22" stroke-opacity=".7"/>
    <circle class="d-ac" cx="156" cy="50" r="13" stroke-width="2"/><path class="d-acf" d="M152 44l11 6-11 6z" stroke="none"/>`),
  plano: DECO3(`<circle class="d-fundo" cx="166" cy="60" r="50"/>
    <rect class="d-fill" x="112" y="22" width="96" height="80" rx="12"/><path class="d-linha" d="M112 42h96M134 14v16M186 14v16"/>
    <rect class="d-fill" x="124" y="54" width="14" height="12" rx="3"/><rect class="d-acf" x="146" y="54" width="14" height="12" rx="3" stroke="none"/><rect class="d-fill" x="168" y="54" width="14" height="12" rx="3"/><rect class="d-fill" x="190" y="54" width="10" height="12" rx="3"/>
    <rect class="d-acf" x="124" y="76" width="14" height="12" rx="3" stroke="none"/><rect class="d-fill" x="146" y="76" width="14" height="12" rx="3"/><rect class="d-acf" x="168" y="76" width="14" height="12" rx="3" stroke="none"/>`),
  desafios: DECO3(`<circle class="d-fundo" cx="168" cy="62" r="50"/>
    <path class="d-fill" d="M146 8h18l12 30h-18zM190 8h-18l-12 30h18z"/>
    <circle class="d-fill" cx="168" cy="70" r="30"/><circle class="d-ac" cx="168" cy="70" r="21" stroke-width="2"/>
    <path class="d-acf" stroke="none" d="M168 58.5l3.4 7 7.7 1.1-5.6 5.4 1.3 7.7-6.8-3.6-6.8 3.6 1.3-7.7-5.6-5.4 7.7-1.1z"/>`),
  perfil: DECO3(`<circle class="d-fundo" cx="166" cy="62" r="50"/>
    <circle class="d-fill" cx="166" cy="46" r="17"/><path class="d-fill" d="M134 104c3-20 16-32 32-32s29 12 32 32z"/>
    <path class="d-ac" d="M120 84a48 48 0 0 1 78-50" stroke-width="2.4"/><path class="d-acf" stroke="none" d="M203 28l1 15-14-5z"/>`),
  progresso: DECO3(`<circle class="d-fundo" cx="166" cy="60" r="48"/>
    <rect class="d-fill" x="128" y="66" width="14" height="30" rx="3"/><rect class="d-fill" x="150" y="52" width="14" height="44" rx="3"/><rect class="d-fill" x="172" y="38" width="14" height="58" rx="3"/>
    <path class="d-linha" d="M120 96h80" stroke-opacity=".6"/><path class="d-ac" d="M124 56l22-16 20 10 30-24" stroke-width="2.4"/><path class="d-acf" stroke="none" d="M203 21l-2 15-11-10z"/>`),
  historico: DECO3(`<circle class="d-fundo" cx="168" cy="60" r="48"/>
    <circle class="d-fill" cx="168" cy="60" r="32"/><path class="d-linha" d="M168 33v5M168 82v5M141 60h5M190 60h5" stroke-opacity=".7"/>
    <path class="d-ac" d="M168 44v17l11 7" stroke-width="2.4"/><path class="d-ac" d="M126 60a42 42 0 1 0 12-30" stroke-width="2.2"/><path class="d-acf" stroke="none" d="M131 20l11 14-15 3z"/>`)
};
// faixa do topo de cada aba: onde termina (o primeiro bloco de conteúdo) — o desenho fica acima dele
const DECO_FAIXA = {
  sessions:  { fim:'#sess-qlinks' },
  library:   { ini:'.brand', fim:'#lib-count' },
  plan:      { ini:'.brand', fim:'#plan-title' },
  challenges:{ fim:'#chal-root' },
  profile:   { fim:'.profile-head', fimBase:true },
  history:   { ini:'.seg-nav', fim:'.stat-grid' },
  perf:      { ini:'.seg-nav', fim:'#perf-resumo' },
  home:      { ini:'#home-brand-row', fim:'#home-greet-row', fimBase:true }
};
function decoPosiciona(tab){
  const el = document.getElementById('app-deco'); if(!el) return;
  const f = DECO_FAIXA[tab]; const tela = document.querySelector('.screen.active');
  if(!f || !tela || !el.innerHTML){ el.style.removeProperty('--deco-top'); el.style.removeProperty('--deco-h'); return; }
  const sy = window.scrollY || 0;
  const fimEl = tela.querySelector(f.fim), iniEl = f.ini ? tela.querySelector(f.ini) : null;
  if(!fimEl || !fimEl.offsetHeight){ el.style.removeProperty('--deco-top'); el.style.removeProperty('--deco-h'); return; }
  const rf = fimEl.getBoundingClientRect();
  const topo = iniEl && iniEl.offsetHeight ? iniEl.getBoundingClientRect().bottom + sy + 2 : 4;
  const fim = (f.fimBase ? rf.bottom + 4 : rf.top - 6) + sy;
  const h = Math.max(0, Math.round(fim - topo));
  // encosta na borda direita da coluna de conteúdo (no celular é a borda da tela; no computador e no tablet, a coluna)
  const wrap = tela.querySelector('.wrap'); const dir = wrap ? Math.max(0, Math.round(innerWidth - wrap.getBoundingClientRect().right)) : 0;
  el.style.setProperty('--deco-dir', dir + 'px');
  el.style.setProperty('--deco-top', Math.round(topo) + 'px');
  el.style.setProperty('--deco-h', h + 'px');
  el.classList.toggle('deco-baixa', h < 40);   // faixa muito baixa (fonte grande, tela pequena): o desenho some
}
function _decoAgenda(tab){ cancelAnimationFrame(window.__decoRaf); window.__decoRaf = requestAnimationFrame(()=>{ decoPosiciona(tab); setTimeout(()=>decoPosiciona(tab), 180); }); }
window.updateDeco = function(tab){
  const el = document.getElementById('app-deco'); if(!el) return;
  const on = decoEnabled();
  document.body.classList.toggle('no-deco', !on);
  el.classList.add('deco36');
  if(!on){ el.innerHTML = ''; delete el.dataset.k; return; }
  const corrida = state && state.active === 'run';
  const map = { sessions: corrida ? 'corrida' : 'musculacao', challenges:'desafios', library:'biblioteca', plan:'plano', profile:'perfil', history:'historico', perf:'progresso' };
  const k = map[tab];
  if(!k){ el.innerHTML = ''; el.dataset.k = 'sem'; decoPosiciona(tab); return; }   // abas sem desenho
  if(el.dataset.k !== k || !el.innerHTML){ el.dataset.k = k; el.innerHTML = DECO2_SVG[k]; }
  _decoAgenda(tab);
};
window.addEventListener('resize', ()=>{ try{ _decoAgenda(state.ui.tab || 'home'); }catch(e){} }, { passive:true });
Object.assign(window, { decoPosiciona });

// =====================================================================
// 38. Beta 25 — Janelas, botão Voltar do Android e auditoria de cliques
// =====================================================================

// ---------- Fechar janelas ----------
// • Tocar fora da janela já fechava; agora isso NÃO acontece se o aluno digitou algo
//   que ainda não salvou (o app avisa e mantém a janela aberta).
// • Botão Voltar do Android / gesto de voltar: fecha a janela aberta em vez de sair do app.
// • Janelas que já salvam na hora (Aparência, Personalizar início, Áudio dos vídeos) não
//   pedem mais "Pronto": têm um ✕ no canto e fecham tocando fora ou com Voltar.
let _janSuja = false;
let _janHist = false;          // há um registro no histórico do navegador para a janela aberta
let _janFechandoPorVoltar = false;
(function(){
  const back = document.getElementById('modal-back'), mi = document.getElementById('modal-inner'); if(!back || !mi) return;
  // qualquer digitação em campo marca a janela como "com alterações"
  mi.addEventListener('input', e=>{ if(e.target && e.target.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=search]):not([id*=busca]):not([placeholder^=Buscar]), textarea')) _janSuja = true; }, true);
  // conteúdo trocado = outra tela da janela: zera a marca
  new MutationObserver(()=>{ _janSuja = false; }).observe(mi, { childList:true });
  // tocar fora: protege dados digitados
  back.removeAttribute('onclick');
  back.addEventListener('click', e=>{
    if(e.target !== back) return;
    if(_janSuja){ mi.classList.remove('jan-avisa'); void mi.offsetWidth; mi.classList.add('jan-avisa'); toast('Você digitou algo que ainda não foi salvo. Use Salvar ou Cancelar.'); return; }
    closeModal();
  });
  // Voltar do Android: um registro no histórico enquanto a janela está aberta
  new MutationObserver(()=>{
    const aberta = back.classList.contains('on');
    if(aberta && !_janHist){ try{ history.pushState({ mtJanela:1 }, ''); _janHist = true; }catch(err){} }
    if(!aberta && _janHist){ _janHist = false; if(!_janFechandoPorVoltar){ try{ if(history.state && history.state.mtJanela) history.back(); }catch(err){} } _janFechandoPorVoltar = false; }
  }).observe(back, { attributes:true, attributeFilter:['class'] });
  window.addEventListener('popstate', ()=>{
    if(!back.classList.contains('on')) return;
    if(_janSuja){ try{ history.pushState({ mtJanela:1 }, ''); }catch(err){} toast('Você digitou algo que ainda não foi salvo. Use Salvar ou Cancelar.'); return; }
    _janHist = false; _janFechandoPorVoltar = true; closeModal();
  });
})();
// Beta 36: as janelas usam o histórico do navegador (para o Voltar do Android fechar a janela). Com a
// restauração automática, ao fechar, o navegador devolvia a tela para a posição de quando a janela ABRIU
// (às vezes no meio de uma rolagem) — a tela "pulava". A posição agora é só do app.
try{ if('scrollRestoration' in history) history.scrollRestoration = 'manual'; }catch(e){}
mtGancho('closeModal', { depois(){
  _janSuja = false;
  const mi = document.getElementById('modal-inner'); if(!mi) return;
  const ao = mi.dataset.aoFechar; delete mi.dataset.aoFechar;
  // Beta 36: redesenhar o Perfil ao fechar a janela mantém a posição da rolagem (durante o redesenho a página
  // fica curta por um instante e o navegador puxava a tela para cima)
  if(ao === 'perfil'){ const y = window.scrollY; try{ renderProfile(); }catch(e){} if(Math.abs(window.scrollY - y) > 1) window.scrollTo({ top:y, behavior:'instant' }); requestAnimationFrame(()=>{ if(Math.abs(window.scrollY - y) > 1) window.scrollTo({ top:y, behavior:'instant' }); }); }
}});
// janelas que salvam na hora: troca o "Pronto" por um ✕ discreto
function janelaInstantanea(aoFechar){
  const mi = document.getElementById('modal-inner'); if(!mi) return;
  [...mi.querySelectorAll('button')].filter(b=>/^\s*Pronto\s*$/.test(b.textContent)).forEach(b=>b.remove());
  if(!mi.querySelector(':scope > .modal-x')){
    const x = document.createElement('button'); x.type = 'button'; x.className = 'modal-x'; x.setAttribute('aria-label', 'Fechar'); x.textContent = '✕';
    x.onclick = ()=>closeModal(); mi.prepend(x);
  }
  if(!mi.querySelector('.jan-salvo')){
    const n = document.createElement('div'); n.className = 'jan-salvo'; n.textContent = 'As mudanças valem na hora e já ficam salvas.'; mi.appendChild(n);
  }
  if(aoFechar) mi.dataset.aoFechar = aoFechar;
}
mtGancho('openAparencia', { depois(){ janelaInstantanea('perfil'); } });
mtGancho('openPersonalizarInicio', { depois(){ janelaInstantanea(); } });
mtGancho('openAudioVideos', { depois(){ janelaInstantanea('perfil'); } });

// ---------- Histórico: gráfico semanal agora responde ao toque ----------
// As barras mostravam só um número solto e "S1…S8". Agora: toque mostra a semana
// (datas) e o valor; as cores dos textos seguem o tema (antes eram cinza fixo).
mtGancho('renderHistEvolution', { depois(isLift){
  const svg = document.getElementById('hist-evo-svg'); if(!svg || !svg.innerHTML) return;
  svg.innerHTML = svg.innerHTML.replace(/fill="#64748b"/g, 'fill="var(--text-mute)"');
  const rects = [...svg.querySelectorAll('rect')]; if(rects.length !== 8) return;
  const agora = Date.now(); const fmt = t=>new Date(t).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'});
  const vals = [...svg.querySelectorAll('text')].filter(t=>!/^S\d$/.test(t.textContent));
  rects.forEach((r, i)=>{
    const a = agora - (8-i)*7*DIA_MS, b = agora - (7-i)*7*DIA_MS - 1;
    const h = r.cloneNode(); h.setAttribute('class', 'ch-hit'); h.setAttribute('fill', 'transparent'); h.setAttribute('y', '8'); h.setAttribute('height', '140');
    const valTxt = (()=>{ const x = +r.getAttribute('x') + (+r.getAttribute('width'))/2; const t = vals.find(t=>Math.abs(+t.getAttribute('x') - x) < 1); return t ? t.textContent : '0'; })();
    h.setAttribute('data-tip', `${i===7?'Esta semana':'Semana de '+fmt(a)+' a '+fmt(b)}: <b>${valTxt} ${isLift?'kg':'km'}</b>`);
    h.setAttribute('tabindex', '0'); h.setAttribute('role', 'button'); h.setAttribute('aria-label', h.getAttribute('data-tip').replace(/<[^>]+>/g,''));
    svg.appendChild(h);
  });
  svg.style.cursor = 'pointer';
  if(!svg.dataset.tip){
    svg.dataset.tip = '1';
    const mostra = ev=>{ const t = ev.target.closest && ev.target.closest('.ch-hit'); if(!t) return;
      svg.querySelectorAll('.ch-hit.sel').forEach(x=>x.classList.remove('sel')); t.classList.add('sel');
      const sub = document.getElementById('hist-evo-sub'); if(sub) sub.innerHTML = t.getAttribute('data-tip'); };
    svg.addEventListener('click', mostra);
    svg.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); mostra(e); } });
  }
}});

// =====================================================================
// 39. Beta 25 — Histórico com páginas numeradas; desafios futuros com detalhes
// =====================================================================

// ---------- Histórico: ‹ 1 2 3 … 12 › ----------
// Continua com 10 registros por página e do mais recente para o mais antigo; só o
// rodapé mudou. Com muitas páginas, mostra a primeira, a última e as vizinhas da atual.
function histPaginasCompactas(atual, total){
  // atual e total começando em 1
  if(total <= 7) return Array.from({length:total}, (_,i)=>i+1);
  const s = new Set([1, total, atual, atual-1, atual+1]);
  if(atual <= 3){ s.add(2); s.add(3); s.add(4); }
  if(atual >= total-2){ s.add(total-1); s.add(total-2); s.add(total-3); }
  const nums = [...s].filter(n=>n>=1 && n<=total).sort((a,b)=>a-b);
  const out = []; nums.forEach((n,i)=>{ if(i && n - nums[i-1] > 1) out.push('…'); out.push(n); });
  return out;
}
mtGancho('renderHistory', { depois(){
  const pg = document.querySelector('#history-list .pager'); if(!pg) return;
  // "Página X de Y" fica no texto do <span>; "N registros" no <small> dentro dele
  const sp = pg.querySelector('span'); const sm = sp && sp.querySelector('small');
  const m = sp && String(sp.childNodes[0] && sp.childNodes[0].textContent || '').match(/Página\s+(\d+)\s+de\s+(\d+)/);
  const r = sm && sm.textContent.match(/(\d+)\s+registros/);
  if(!m) return;
  const atual = +m[1], total = +m[2], nreg = r ? +r[1] : null;
  const itens = histPaginasCompactas(atual, total).map(n=> n === '…'
    ? `<span class="hp-ret" aria-hidden="true">…</span>`
    : `<button type="button" class="hp-n ${n===atual?'on':''}" ${n===atual?'aria-current="page"':''} aria-label="Página ${n}" onclick="histGo(${n-1})">${n}</button>`).join('');
  const nav = document.createElement('nav'); nav.className = 'hist-pag'; nav.setAttribute('aria-label', 'Páginas do histórico');
  nav.innerHTML = `<div class="hp-linha">
      <button type="button" class="hp-seta" ${atual<=1?'disabled':''} aria-label="Página anterior (mais novos)" onclick="histGo(${atual-2})">‹</button>
      ${itens}
      <button type="button" class="hp-seta" ${atual>=total?'disabled':''} aria-label="Próxima página (mais antigos)" onclick="histGo(${atual})">›</button>
    </div>
    <div class="hp-info">Página ${atual} de ${total}${nreg!==null?` · ${nreg} registros`:''} · do mais recente para o mais antigo</div>`;
  pg.replaceWith(nav);
}});
// ao trocar de página, volta para o topo da lista (não do app inteiro)
window.histGo = function(p){
  histPage = p; renderHistory();
  try{ const t = document.getElementById('hist-title') || document.getElementById('history-list'); const y = t.getBoundingClientRect().top + window.scrollY - 12; window.scrollTo({ top: Math.max(0, y) }); }catch(e){ try{ window.scrollTo(0,0); }catch(_){} }
};

// ---------- Desafios futuros: tocar no "Em breve" abre os detalhes ----------
// Só informações reais do desafio cadastrado. Sem botão de participar antes da hora
// (a participação e a contagem continuam começando na data de início).
function evFuturoDetalhe(key){
  const e = eventoPorKey(key); if(!e){ toast('Desafio não encontrado.'); return; }
  const agora = Date.now();
  if(agora >= e.ini){ try{ mtEvFoco(key); }catch(err){ goTab('challenges'); } return; }
  const fmt = t=>new Date(t).toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'});
  const dias = Math.max(1, Math.round((e.fim - e.ini)/DIA_MS));
  const faltam = Math.ceil((mtDia0(e.ini) - mtDia0(agora))/DIA_MS);
  let meta = null; try{ meta = metaDoEvento(e); }catch(err){}
  const linha = (rot, val)=> val ? `<div class="mrow"><span>${rot}</span><b>${val}</b></div>` : '';
  let missoes = [];
  try{ missoes = (missoesDoEvento(e)||[]).map(m=>m.titulo).filter(Boolean); }catch(err){}
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `
    <div class="evf-topo">${eventoMedalha(e, 86)}<div class="evf-quando">${faltam <= 1 ? 'Começa amanhã' : `Começa em ${faltam} dias`}</div></div>
    <h3 style="text-align:center;margin:10px 0 4px">${mtEsc(e.nome)}</h3>
    ${e.desc ? `<p class="mt-muted" style="text-align:center;font-size:13px;line-height:1.55;margin:0 0 12px">${mtEsc(e.desc)}</p>` : ''}
    <div class="evf-aviso">⏳ Este desafio ainda não começou. A participação e a contagem dos dias abrem em ${fmt(e.ini)}.</div>
    <div class="card" style="padding:10px 14px;margin-top:10px;font-size:13px;line-height:1.6">
      ${linha('Início', fmt(e.ini))}
      ${linha('Término', fmt(e.fim - 1))}
      ${linha('Duração', dias + (dias===1?' dia':' dias'))}
      ${meta ? linha('Objetivo', `${meta} dias ativos no período`) : ''}
      ${e.recompensa ? linha('Recompensa', mtEsc(e.recompensa)) : linha('Recompensa', 'medalha exclusiva do desafio')}
    </div>
    ${missoes.length ? `<div class="arq-sub" style="margin-top:12px">Missões</div><div class="card" style="padding:4px 14px">${missoes.map(t=>`<div class="ev-mission"><div class="ev-mcheck"></div><div class="ev-mt"><b>${mtEsc(t)}</b></div></div>`).join('')}</div>` : ''}
    <div class="arq-sub" style="margin-top:12px">Como participar</div>
    <p class="mt-muted" style="font-size:12.5px;line-height:1.55;margin:4px 2px 0">No dia do início, ele aparece em <b>Desafios</b> com o botão "Participar". Os treinos contam a partir dessa data.</p>
    <button class="btn btn-ghost btn-block" style="margin-top:14px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
mtGancho('renderChallenges', { depois(){
  document.querySelectorAll('#chal-root .ev-mini').forEach(c=>{
    if(c.dataset.ok) return;
    // descobre qual desafio é pelo nome exibido
    const nome = (c.querySelector('b')||{}).textContent || '';
    let e = null; try{ e = todosEventos().find(x=>x.nome === nome.trim() && Date.now() < x.ini); }catch(err){}
    if(!e) return;
    c.dataset.ok = '1'; c.classList.add('evf-toque'); c.setAttribute('role','button'); c.setAttribute('tabindex','0');
    c.setAttribute('aria-label', `Ver detalhes do desafio ${e.nome}, que ainda não começou`);
    c.onclick = ()=>evFuturoDetalhe(e.key);
    c.addEventListener('keydown', ev=>{ if(ev.key==='Enter' || ev.key===' '){ ev.preventDefault(); evFuturoDetalhe(e.key); } });
    if(!c.querySelector('.evf-seta')){ const s = document.createElement('span'); s.className = 'evf-seta'; s.textContent = 'Ver detalhes ›'; c.appendChild(s); }
  });
}});
Object.assign(window, { evFuturoDetalhe, histPaginasCompactas });

// =====================================================================
// 40. Beta 25 — Treinos, Desafios e Progresso mais claros
// =====================================================================
// Sem mudar critérios nem cálculos: só deixa à vista o que já é calculado.

// ---------- Treinos: andamento do treino do dia ----------
// Um resumo logo acima dos grupos: quantos exercícios já foram registrados,
// barra de progresso e o estado (não iniciado / em andamento / concluído).
// Os números vêm dos próprios grupos (a mesma conta "n/m exercícios" de cada grupo).
function sessAndamento(){
  const slot = document.getElementById('session-detail-slot'); if(!slot) return;
  const velho = slot.querySelector('.tr-anda'); if(velho) velho.remove();
  const blocos = [...slot.querySelectorAll('.block')].filter(b=>!b.querySelector('.block-head.main') || !/extra/i.test(b.textContent.slice(0,60)));
  let feitos = 0, total = 0;
  blocos.forEach(b=>{ const s = b.querySelector('.block-sub'); const m = s && s.textContent.match(/(\d+)\s*\/\s*(\d+)/); if(m){ feitos += +m[1]; total += +m[2]; } });
  if(!total) return;
  const concluido = !!slot.querySelector('.card-ok') || feitos >= total;
  const est = concluido ? ['ok','Concluído'] : feitos ? ['and','Em andamento'] : ['pend','Não iniciado'];
  const pct = Math.round(Math.min(1, feitos/total)*100);
  const el = document.createElement('div'); el.className = 'tr-anda tr-' + est[0];
  el.innerHTML = `<div class="tr-anda-l"><b>${feitos} de ${total}</b> exercícios registrados hoje<span class="tr-anda-st">${est[1]}</span></div>
    <div class="tr-anda-b" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${feitos}" aria-label="Exercícios registrados"><i style="width:${pct}%"></i></div>`;
  const primeiro = slot.querySelector('.block'); if(primeiro) primeiro.before(el);
}
mtGancho('renderSessions', { depois(){ if(state.active !== 'run') sessAndamento(); } });

// ---------- Desafios: o que falta para concluir ----------
function evFalta(e){
  const p = progressoEvento(e); if(!p.comecou || p.terminou) return '';
  const faltam = Math.max(0, p.alvo - p.dias);
  if(!faltam) return `✓ Meta cumprida: ${p.dias} de ${p.alvo} dias ativos. Os próximos treinos contam para as missões.`;
  const hojeConta = mtDiasAtivos(e.ini, e.fim).has(mtDia0());
  const disp = p.restam + (hojeConta ? 0 : 1);
  if(faltam > disp) return `Faltam ${faltam} dias ativos e restam ${disp} ${disp===1?'dia':'dias'}: a meta não cabe mais neste desafio, mas cada treino ainda conta para as missões.`;
  const porSem = Math.min(7, Math.ceil(faltam / Math.max(1, disp/7)));
  return `Para concluir: <b>${faltam} ${faltam===1?'dia ativo':'dias ativos'}</b> nos próximos ${disp} ${disp===1?'dia':'dias'}${disp>=7?` (cerca de ${porSem} por semana)`:''}. Qualquer treino ou atividade registrada conta.`;
}
mtGancho('renderChallenges', { depois(){
  try{
    const e = eventoPrincipal(); const hero = document.querySelector('#chal-root .ev-hero'); if(!e || !hero) return;
    const txt = evFalta(e); if(!txt || hero.querySelector('.ev-falta')) return;
    const d = document.createElement('div'); d.className = 'ev-falta'; d.innerHTML = txt;
    const cta = hero.querySelector('.ev-cta'); if(cta) cta.before(d); else hero.appendChild(d);
  }catch(err){}
}});

// ---------- Progresso: o resumo diz de que período é cada número ----------
mtGancho('renderPerf', { depois(){
  const res = document.getElementById('perf-resumo'); if(!res) return;
  const grades = [...res.querySelectorAll(':scope > .stat-grid')];
  const rot = ['Últimos 7 dias', 'Desde o início'];
  grades.forEach((g,i)=>{ if(i>1) return; const ant = g.previousElementSibling; if(ant && ant.classList.contains('pr-per')) return;
    const c = document.createElement('div'); c.className = 'pr-per'; c.textContent = rot[i]; g.before(c); });
}});

// ---------- Tela "Preparando seu plano" ----------
// Os passos continuam os mesmos (reais). Antes havia dois indicadores girando ao mesmo
// tempo (o de cima e o do passo atual). Agora o de cima é um selo da modalidade com um
// anel que enche junto com as etapas concluídas; só o passo atual gira.
const _runBuildingB25 = window.runBuildingScreen;
window.runBuildingScreen = function(m, steps, done, opts){
  const r = _runBuildingB25.apply(this, arguments);
  try{
    const ov = document.getElementById('building-ov'); const sp = ov && ov.querySelector('.mb-spin'); if(!sp) return r;
    const ic = m === 'run'
      ? '<path d="M13 4.5a1.8 1.8 0 1 0 0-.01M10 21l2.2-6.2L9.5 12l2-5 3.5 3 3 1M6 12.5l2.5-4.5h4"/>'
      : '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>';
    const anel = document.createElement('div'); anel.className = 'mb-anel'; anel.setAttribute('aria-hidden','true');
    anel.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ic}</svg>`;
    sp.replaceWith(anel);
    const marca = document.createElement('div'); marca.className = 'mb-marca'; marca.textContent = 'METATREINO';
    ov.querySelector('.mb-box').prepend(marca);
    const bar = document.getElementById('mb-bar');
    if(bar) new MutationObserver(()=>{ anel.style.setProperty('--p', (parseFloat(bar.style.width)||0) + '%'); }).observe(bar, { attributes:true, attributeFilter:['style'] });
  }catch(e){}
  return r;
};

// =====================================================================
// 41. Beta 26 — Central de compartilhamento
// =====================================================================
// Um só sistema para todos os cards de compartilhar:
//   treino de musculação · corrida · bike · caminhada · conquista · conquista especial ·
//   desafio concluído · recorde · evolução de carga · resumo da semana.
// Os botões de compartilhar que já existiam passam a abrir a Central. O modelo antigo
// continua disponível ("Modelo clássico") e nada do que é salvo muda.
//
// Privacidade: o card só leva o que é do treino/conquista. Nunca e-mail, peso, medidas
// ou foto que o aluno não escolheu. O nome só aparece se o aluno ligar "Mostrar meu nome".
// Não existe mapa/percurso: o app não registra GPS, então nada é desenhado.

const MTS_FORMATOS = {
  story:   { w:1080, h:1920, nome:'Stories e Status', sub:'9:16' },
  feed:    { w:1080, h:1350, nome:'Feed', sub:'4:5' },
  quadrado:{ w:1080, h:1080, nome:'Quadrado', sub:'1:1' }
};
const MTS_ESTILOS = { escuro:'Escuro', claro:'Claro', tema:'Cores do meu tema' };
const MTS_DISP = { destaque:'Destaque', grade:'Números', compacto:'Faixa' };
const MTS_COR = { musculacao:'#ff7a3d', corrida:'#2fd4b5', bike:'#a78bfa', caminhada:'#34d399', conquista:'#f5c451', colecao:'#f5c451',
  especial:'#f2c66d', desafio:'#f5c451', recorde:'#f5c451', evolucao:'#5ac8fa', semana:'#8ea2ff' };
const MTS_KICKER = { musculacao:'Treino de musculação', corrida:'Corrida', bike:'Pedal', caminhada:'Caminhada', conquista:'Conquista desbloqueada', colecao:'Minhas conquistas',
  especial:'Conquista especial', desafio:'Desafio concluído', recorde:'Recorde pessoal', evolucao:'Evolução de carga', semana:'Minha semana' };

// estado da Central (só na memória; a escolha de formato/estilo fica lembrada no aparelho)
const MTS = { d:null, foto:null, zoom:1, px:0, py:0, escurecer:.45, nome:false, classico:null };
function _mtsPref(k, padrao){ try{ return localStorage.getItem('mt_share_'+k) || padrao; }catch(e){ return padrao; } }
function _mtsSalvaPref(k, v){ try{ localStorage.setItem('mt_share_'+k, v); }catch(e){} }

// ---------- utilidades ----------
const _mtsN = (v, dec)=> (+v||0).toLocaleString('pt-BR', {minimumFractionDigits:dec||0, maximumFractionDigits:dec||0});
function _mtsData(t){ return t ? new Date(t).toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'}).replace('.', '') : ''; }
function _mtsSemEmoji(s){ return String(s||'').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu,'').replace(/\s{2,}/g,' ').trim(); }
function _mtsPrimeiroNome(){
  const p = (state.user && state.user.profile) || {};
  const n = String(p.nickname || (state.user && state.user.name) || '').trim().split(/\s+/)[0] || '';
  return n.slice(0, 20);
}
function _mtsDur(min){ min = Math.round(+min||0); if(min < 60) return {v:String(min), u:'min'}; const h = Math.floor(min/60), m = min%60; return {v:`${h}h${m?String(m).padStart(2,'0'):''}`, u:''}; }
function _mtsPace(dur, km){ if(!(km > 0 && dur > 0)) return null; const p = dur/km; const mm = Math.floor(p), ss = Math.round((p-mm)*60); return `${mm}:${String(ss===60?0:ss).padStart(2,'0')}`; }
function _mtsCatCor(cat){ return { streak:'#ff8a3d', run:'#5ac8fa', walk:'#34d399', bike:'#a78bfa', body:'#e5e7eb', secret:'#f5c451', geral:'#f5c451', lift:'#ff7a3d' }[cat] || '#f5c451'; }
function _mtsCssCor(v){ try{ const el = document.createElement('span'); el.style.color = v; document.body.appendChild(el); const c = getComputedStyle(el).color; el.remove(); return c; }catch(e){ return v; } }

// medalha (SVG do app) como imagem para o canvas, com cores fixas
function _mtsMedalhaImg(svgHtml, cor, corTxt){
  return new Promise(res=>{
    try{
      const corpo = String(svgHtml).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      const css = `.tb-ring{fill:none;stroke:${cor};stroke-width:1.8}.tb-ring2{fill:none;stroke:${cor};stroke-width:.9;stroke-opacity:.7}.tb-orn{fill:none;stroke:${cor};stroke-width:1.6;stroke-dasharray:1.4 2.2}`
        + `.tb-in{fill:${cor};fill-opacity:.18}.tb-luz{fill:#fff;fill-opacity:.10}.tb-sombra{fill:none;stroke:#000;stroke-opacity:.25;stroke-width:1.1}`
        + `.tb-g{fill:none;stroke:${cor};stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.tb-l{fill:${corTxt||'#fff'};font-size:9px;font-weight:800;text-anchor:middle;font-family:Outfit,Arial,sans-serif}`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="480" height="480"><style>${css}</style>${corpo}</svg>`;
      const img = new Image(); img.onload = ()=>res(img); img.onerror = ()=>res(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }catch(e){ res(null); }
  });
}

// ---------- montagem dos dados (somente dados reais) ----------
function mtsDeHistorico(x){
  if(!x) return null;
  const run = x.module === 'run' || (x.module !== 'lift' && (((state.modules.run||{}).history||[]).includes(x) || x.distance != null || !!x.activity));
  if(run){
    const tipo = x.activity === 'bike' ? 'bike' : x.activity === 'caminhada' ? 'caminhada' : 'corrida';
    const km = +x.distance || 0, dur = +x.duration || 0;
    const nums = [];
    const d = _mtsDur(dur); nums.push({ l:'Tempo', v:d.v, u:d.u });
    if(tipo === 'bike'){ if(km && dur) nums.push({ l:'Velocidade média', v:_mtsN(km/(dur/60),1), u:'km/h' }); }
    else { const p = _mtsPace(dur, km) || (x.pace ? String(x.pace).replace(/\/?km$/,'') : null); if(p) nums.push({ l:'Ritmo médio', v:p, u:'/km' }); }
    if(tipo !== 'bike' && km && dur) nums.push({ l:'Velocidade', v:_mtsN(km/(dur/60),1), u:'km/h' });
    if(x.elev || x.elevacao) nums.push({ l:'Elevação', v:_mtsN(x.elev||x.elevacao), u:'m' });
    return { tipo, titulo:_mtsSemEmoji(x.name) || MTS_KICKER[tipo], data:x.at,
      hero: km ? { v:_mtsN(km, km<10?2:1), u:'km' } : { v:d.v, u:d.u||'' }, nums: km ? nums.slice(0,3) : nums.slice(1,4),
      extra: x.isRace ? ['Prova'] : [], texto:`${MTS_KICKER[tipo]} no MetaTreino` };
  }
  // musculação: séries e volume vêm dos registros de carga do mesmo dia
  const ids = (x.exercisesDone||[]).map(e=>e.id);
  let series = 0, vol = 0;
  const dia = mtDia0(x.at);
  ids.forEach(id=>{ (state.progress[id]||[]).forEach(p=>{ if(mtDia0(p.date) === dia){ (p.sets||[]).forEach(s=>{ series++; vol += (+s.peso||0)*(+s.reps||0); }); } }); });
  let partes = []; try{ partes = (typeof partsFromEntry==='function' ? partsFromEntry(x) : []).map(_mtsSemEmoji).filter(Boolean); }catch(e){}
  const d = _mtsDur(x.duration);
  const nums = [{ l:'Duração', v:d.v, u:d.u }];
  if(ids.length) nums.push({ l:'Exercícios', v:String(ids.length), u:'' });
  if(series) nums.push({ l:'Séries', v:String(series), u:'' });
  if(vol >= 100) nums.push({ l:'Volume', v: vol>=1000 ? _mtsN(vol/1000,1) : _mtsN(vol), u: vol>=1000 ? 't' : 'kg' });
  const hero = vol >= 1000 ? { v:_mtsN(vol/1000,1), u:'toneladas levantadas' } : ids.length ? { v:String(ids.length), u: ids.length===1?'exercício concluído':'exercícios concluídos' } : { v:d.v, u:d.u||'de treino' };
  return { tipo:'musculacao', titulo:_mtsSemEmoji(x.name) || 'Treino concluído', data:x.at, hero,
    nums: nums.filter(n=>!(hero.v===n.v && (n.l==='Duração' || /exerc|tonel/.test(hero.u)))).slice(0,3), extra: partes.slice(0,4), texto:'Treino concluído no MetaTreino' };
}
function mtsDeConquista(id){
  const t = TROPHIES.find(x=>x.id===id); if(!t) return null;
  const def = TROPHY_ICO[t.id] || ['medal'];
  const nv = typeof medalNivel==='function' ? medalNivel(t) : 'comum';
  return { tipo:'conquista', titulo:t.name, desc:t.desc, data:(state.trophyDates||{})[id] || null,
    medalha:{ svg:medalSvg(def[0], def[1], '', nv), cor:_mtsCatCor(t.secret ? 'secret' : t.cat) },
    nivel: nv==='especial' ? 'Especial' : nv==='rara' ? 'Rara' : '', texto:`Desbloqueei "${t.name}" no MetaTreino` };
}
function mtsDeColecao(){
  const tem = state.trophies || [];
  const des = TROPHIES.filter(t=>tem.includes(t.id)); if(!des.length) return null;
  const datas = state.trophyDates || {};
  // as mais recentes primeiro (pela data em que foram ganhas; sem data, a ordem da lista)
  const recentes = des.map((t,i)=>({ t, q: datas[t.id] || i })).sort((a,b)=>b.q - a.q).slice(0,5).map(x=>x.t);
  const niv = t=>typeof medalNivel==='function' ? medalNivel(t) : 'comum';
  const raras = des.filter(t=>niv(t)==='rara').length, esp = des.filter(t=>niv(t)==='especial').length;
  const nums = [{ l:'Coleção', v:String(Math.round(des.length/TROPHIES.length*100)), u:'%' }];
  if(raras) nums.push({ l:'Raras', v:String(raras), u:'' });
  if(esp) nums.push({ l:'Especiais', v:String(esp), u:'' });
  if(nums.length < 3){ const l = des.filter(t=>t.cat==='lift').length, r = des.filter(t=>t.cat==='run').length;
    if(l) nums.push({ l:'Musculação', v:String(l), u:'' }); if(r && nums.length < 3) nums.push({ l:'Corrida', v:String(r), u:'' }); }
  return { tipo:'colecao', titulo:'Coleção de medalhas', data:Date.now(),
    medalhas: recentes.map(t=>{ const def = TROPHY_ICO[t.id] || ['medal']; return { svg:medalSvg(def[0], def[1], '', niv(t)), cor:_mtsCatCor(t.secret ? 'secret' : t.cat) }; }),
    hero:{ v:String(des.length), u:`de ${TROPHIES.length} conquistas` }, nums:nums.slice(0,3), texto:'Minhas conquistas no MetaTreino' };
}
function mtsDeEspecial(){
  const sp = state.specialTrophy; if(!sp) return null;
  const d = typeof _saDadosTrofeu==='function' ? _saDadosTrofeu(sp) : sp;
  return { tipo:'especial', titulo:d.titulo || 'Conquista especial', desc:d.descricao || '', data: sp.guardadaEm || sp.at || null,
    emoji: d.emo || '', texto:`${d.titulo || 'Conquista especial'} — MetaTreino` };
}
function mtsDeDesafio(key){
  const e = eventoPorKey(key); const reg = (state.eventos||{})[key]; if(!e || !reg) return null;
  const dias = progressoEvento(e).dias;
  const cor = (()=>{ const c = evCor(e.arte).ev; return /var\(/.test(c) ? _mtsCssCor(c) : c; })();
  return { tipo:'desafio', kick: reg.concluidoEm ? 'Desafio concluído' : 'Desafio em andamento', titulo:e.nome, data: reg.concluidoEm || null, cor,
    medalha:{ svg: medalSvg('ev_'+e.arte, String(new Date(e.ini).getFullYear())), cor },
    hero:{ v:String(dias), u: dias===1?'dia ativo':'dias ativos' }, nums: reg.alvo ? [{ l:'Meta', v:String(reg.alvo), u:'dias' }] : [],
    texto:`Concluí o desafio ${e.nome} no MetaTreino` };
}
function mtsDeSemana(){
  const s = typeof weekStats==='function' ? weekStats() : null; if(!s || !s.total) return null;
  const km = (s.kmRun||0) + (s.kmWalk||0) + (s.kmBike||0);
  const nums = [];
  if(s.lift) nums.push({ l:'Musculação', v:String(s.lift), u: s.lift===1?'treino':'treinos' });
  if(s.runs) nums.push({ l:'Corridas', v:String(s.runs), u:'' });
  if(km) nums.push({ l:'Distância', v:_mtsN(km,1), u:'km' });
  if(s.totalMin) nums.push({ l:'Tempo', ..._mtsDur(s.totalMin) });
  return { tipo:'semana', titulo:'Esta semana', data:Date.now(), hero:{ v:String(s.total), u: s.total===1?'atividade':'atividades' }, nums:nums.slice(0,3), texto:'Minha semana no MetaTreino' };
}
function mtsDeRecorde(titulo, valor, quando, ehCorrida){
  const m = String(valor).match(/^([\d.,:]+)\s*(.*)$/);
  return { tipo:'recorde', titulo:_mtsSemEmoji(titulo), data:quando||null, hero: m ? { v:m[1], u:m[2] } : { v:String(valor), u:'' }, nums:[], kick: ehCorrida ? 'Recorde de corrida' : 'Recorde pessoal', texto:`Novo recorde no MetaTreino: ${_mtsSemEmoji(titulo)} — ${valor}` };
}
function mtsDeEvolucao(exId){
  let pts = []; try{ pts = (_pontosEx(exId)||[]).filter(p=>p.peso>0); }catch(e){}
  if(pts.length < 2) return null;
  const a = pts[0], b = pts[pts.length-1], melhor = Math.max(...pts.map(p=>p.peso));
  const pct = a.peso > 0 ? Math.round((b.peso - a.peso)/a.peso*100) : 0;
  const nome = (typeof nomeDoEx==='function' ? nomeDoEx(exId) : exId);
  return { tipo:'evolucao', titulo:_mtsSemEmoji(nome), data:b.date,
    hero:{ v:(pct>0?'+':'')+pct+'%', u:'de carga' },
    nums:[{ l:'Início', v:_mtsN(a.peso,1), u:'kg' }, { l:'Agora', v:_mtsN(b.peso,1), u:'kg' }, { l:'Melhor', v:_mtsN(melhor,1), u:'kg' }],
    periodo:`${_mtsData(a.date)} → ${_mtsData(b.date)}`, serie: pts.slice(-24).map(p=>p.peso), texto:`Minha evolução no ${_mtsSemEmoji(nome)} — MetaTreino` };
}

// ---------- desenho ----------
function _mtsPaleta(estilo, d, comFoto){
  const acc = d.cor || MTS_COR[d.tipo] || '#ff7a3d';
  if(comFoto) return { bg1:'#000', bg2:'#000', txt:'#fff', dim:'rgba(255,255,255,.78)', linha:'rgba(255,255,255,.22)', acc, painel:'rgba(10,12,16,.55)', marcaTxt:'#0b0e13' };
  if(estilo === 'claro') return { bg1:'#f6f4ef', bg2:'#ffffff', txt:'#12151a', dim:'rgba(18,21,26,.62)', linha:'rgba(18,21,26,.12)', acc: _mtsEscurece(acc, .32), painel:'rgba(18,21,26,.05)', marcaTxt:'#fff' };
  if(estilo === 'tema'){
    const cs = getComputedStyle(document.documentElement); const v = n=>cs.getPropertyValue(n).trim();
    const claro = typeof temaClaro==='function' && temaClaro();
    return { bg1: _mtsCssCor(v('--bg')), bg2: _mtsCssCor(v('--bg-2') || v('--bg')), txt: _mtsCssCor(v('--text-strong')), dim: _mtsCssCor(v('--text-dim')),
      linha: claro ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.12)', acc: _mtsCssCor(v('--primary')), painel: claro ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.05)', marcaTxt: claro ? '#fff' : '#0b0e13' };
  }
  return { bg1:'#0b0e13', bg2:'#171c25', txt:'#ffffff', dim:'rgba(255,255,255,.66)', linha:'rgba(255,255,255,.12)', acc, painel:'rgba(255,255,255,.05)', marcaTxt:'#0b0e13' };
}
function _mtsEscurece(cor, f){
  const c = _mtsCssCor(cor).match(/\d+(\.\d+)?/g); if(!c) return cor;
  return `rgb(${c.slice(0,3).map(x=>Math.round(+x*(1-f))).join(',')})`;
}
function _mtsRgba(cor, a){ const c = _mtsCssCor(cor).match(/\d+(\.\d+)?/g); if(!c) return cor; return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function _mtsQuebra(x, txt, maxW, maxL){
  const pal = String(txt||'').split(/\s+/); const linhas = []; let l = '';
  pal.forEach(p=>{ const t = l ? l+' '+p : p; if(x.measureText(t).width <= maxW || !l) l = t; else { linhas.push(l); l = p; } });
  if(l) linhas.push(l);
  if(linhas.length > maxL){ const r = linhas.slice(0, maxL); let u = r[maxL-1]; while(u.length > 1 && x.measureText(u+'…').width > maxW) u = u.slice(0,-1); r[maxL-1] = u+'…'; return r; }
  return linhas;
}
// contexto "de ensaio": mede textos com as mesmas fontes, mas não desenha nada (usado para medir a altura do bloco)
function _mtsMedidor(ctx){
  const nada = new Set(['fillText','strokeText','fill','stroke','fillRect','strokeRect','clearRect','drawImage','beginPath','moveTo','lineTo','arcTo','arc','rect','closePath','quadraticCurveTo','bezierCurveTo','save','restore']);
  return new Proxy(ctx, { get(t, k){ if(nada.has(k)) return ()=>{}; const v = Reflect.get(t, k, t); return typeof v === 'function' ? v.bind(t) : v; }, set(t, k, v){ t[k] = v; return true; } });
}
function _mtsRet(x, px, py, w, h, r){ x.beginPath(); x.moveTo(px+r,py); x.arcTo(px+w,py,px+w,py+h,r); x.arcTo(px+w,py+h,px,py+h,r); x.arcTo(px,py+h,px,py,r); x.arcTo(px,py,px+w,py,r); x.closePath(); }
// desenho de fundo por modalidade (traços discretos, sem fotos de terceiros)
function _mtsPadrao(x, W, H, tipo, cor){
  x.save(); x.strokeStyle = _mtsRgba(cor, .14); x.lineWidth = W*0.004; x.lineCap = 'round';
  if(tipo === 'corrida' || tipo === 'caminhada'){
    for(let i=0;i<5;i++){ x.beginPath(); x.arc(W*1.05, H*0.04, W*(0.45+i*0.11), Math.PI*0.5, Math.PI*1.02); x.stroke(); }
  } else if(tipo === 'bike'){
    [[0.82,0.16,0.16],[0.48,0.16,0.16]].forEach(([cx,cy,r])=>{ x.beginPath(); x.arc(W*cx, H*cy, W*r, 0, Math.PI*2); x.stroke(); x.beginPath(); x.arc(W*cx, H*cy, W*r*0.18, 0, Math.PI*2); x.stroke(); });
  } else if(tipo === 'musculacao'){
    x.lineWidth = W*0.006; const y = H*0.17;
    x.beginPath(); x.moveTo(W*0.38, y); x.lineTo(W*1.02, y); x.stroke();
    [[0.48,0.16],[0.55,0.12],[0.88,0.16],[0.81,0.12]].forEach(([cx,h])=>{ _mtsRet(x, W*cx - W*0.025, y - W*h/2, W*0.05, W*h, W*0.012); x.stroke(); });
  } else if(tipo === 'evolucao' || tipo === 'semana' || tipo === 'recorde'){
    for(let i=0;i<6;i++){ const bh = H*(0.05+i*0.03); _mtsRet(x, W*(0.45+i*0.09), H*0.30 - bh, W*0.05, bh, W*0.01); x.stroke(); }
  } else {
    for(let i=0;i<4;i++){ x.beginPath(); x.arc(W*0.86, H*0.12, W*(0.10+i*0.08), 0, Math.PI*2); x.stroke(); }
  }
  x.restore();
}
async function mtsDesenhar(cv, d, o){
  const F = MTS_FORMATOS[o.fmt] || MTS_FORMATOS.story; const W = F.w, H = F.h;
  cv.width = W; cv.height = H; const x = cv.getContext('2d');
  try{ await document.fonts.load('800 80px Outfit'); await document.fonts.load('300 80px Outfit'); }catch(e){}
  const foto = o.foto; const P = _mtsPaleta(o.estilo, d, !!foto);
  const pad = W*0.075; const FF = 'Outfit, system-ui, sans-serif';
  // fundo
  if(foto){
    const esc = Math.max(W/foto.width, H/foto.height) * (o.zoom||1);
    const iw = foto.width*esc, ih = foto.height*esc;
    const maxX = Math.max(0, (iw-W)/2), maxY = Math.max(0, (ih-H)/2);
    const ox = (W-iw)/2 + Math.max(-1, Math.min(1, o.px||0))*maxX, oy = (H-ih)/2 + Math.max(-1, Math.min(1, o.py||0))*maxY;
    x.drawImage(foto, ox, oy, iw, ih);
    const k = o.escurecer==null ? .45 : o.escurecer;
    x.fillStyle = `rgba(0,0,0,${k*0.45})`; x.fillRect(0,0,W,H);
    let g = x.createLinearGradient(0,0,0,H*0.22); g.addColorStop(0,`rgba(0,0,0,${Math.min(.75,.35+k*.4)})`); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0,0,W,H*0.22);
    g = x.createLinearGradient(0,H*0.42,0,H); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,`rgba(0,0,0,${Math.min(.92,.5+k*.5)})`); x.fillStyle = g; x.fillRect(0,H*0.42,W,H*0.58);
  } else {
    const g = x.createLinearGradient(0,0,W,H); g.addColorStop(0,P.bg1); g.addColorStop(1,P.bg2); x.fillStyle = g; x.fillRect(0,0,W,H);
    const rg = x.createRadialGradient(W*0.85, H*0.12, 0, W*0.85, H*0.12, W*0.9); rg.addColorStop(0, _mtsRgba(P.acc, o.estilo==='claro'?.14:.22)); rg.addColorStop(1, _mtsRgba(P.acc, 0));
    x.fillStyle = rg; x.fillRect(0,0,W,H);
    _mtsPadrao(x, W, H, d.tipo, P.acc);
  }
  // cabeçalho: marca + data
  const ms = W*0.075, my = pad*0.9;
  x.fillStyle = P.acc; _mtsRet(x, pad, my, ms, ms, ms*0.26); x.fill();
  x.fillStyle = P.marcaTxt; x.font = `800 ${ms*0.56}px ${FF}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('M', pad+ms/2, my+ms/2+ms*0.02);
  x.fillStyle = P.txt; x.textAlign = 'left'; x.font = `800 ${W*0.026}px ${FF}`;
  if(x.letterSpacing !== undefined) x.letterSpacing = `${W*0.006}px`;
  x.fillText('METATREINO', pad+ms+W*0.025, my+ms/2);
  if(x.letterSpacing !== undefined) x.letterSpacing = '0px';
  if(d.data){ x.textAlign = 'right'; x.fillStyle = P.dim; x.font = `500 ${W*0.028}px ${FF}`; x.fillText(_mtsData(d.data), W-pad, my+ms/2); }
  // medalha (conquista / desafio)
  const corLbl = (!foto && o.estilo==='claro') ? '#12151a' : (!foto && o.estilo==='tema' && typeof temaClaro==='function' && temaClaro()) ? P.txt : '#fff';
  let medImg = null; if(d.medalha) medImg = await _mtsMedalhaImg(d.medalha.svg, d.medalha.cor, corLbl);
  let medRow = []; if(d.medalhas) medRow = (await Promise.all(d.medalhas.map(m=>_mtsMedalhaImg(m.svg, m.cor, corLbl).then(img=>img ? { img, cor:m.cor } : null)))).filter(Boolean);
  // bloco de conteúdo
  const kick = (d.kick || MTS_KICKER[d.tipo] || '').toUpperCase();
  const disp = o.disp || 'destaque';
  const nums = d.nums || [];
  const maxW = W - pad*2;
  // mede alturas
  x.textBaseline = 'alphabetic';
  const tamTit = W*(disp==='compacto'?0.058:0.07);
  x.font = `800 ${tamTit}px ${FF}`; const linTit = _mtsQuebra(x, d.titulo, maxW, 2);
  const tamHero = W*(disp==='grade'?0.15:(disp==='compacto'?0.15:0.2));
  const temHero = !!(d.hero && d.hero.v);
  const tamNum = W*0.062, tamLbl = W*0.026;
  const altNums = nums.length ? tamNum + tamLbl + W*0.045 : 0;
  const tamDesc = W*0.034; x.font = `400 ${tamDesc}px ${FF}`; const linDesc = d.desc ? _mtsQuebra(x, d.desc, maxW, 3) : [];
  const rowGap = W*0.025, rowTam = medRow.length ? Math.min(o.fmt==='quadrado' ? W*0.13 : W*0.16, (maxW - rowGap*(medRow.length-1))/medRow.length) : 0;
  const medTam = medImg ? (o.fmt==='quadrado' ? W*(disp==='destaque'?0.26:0.2) : o.fmt==='feed' ? W*0.28 : W*0.34) : rowTam;
  const chipsH = (d.extra && d.extra.length) ? W*0.07 : 0;
  // Beta 36: o nome entra no bloco e a altura do bloco é MEDIDA (passada de ensaio sem desenhar). Antes era uma
  // estimativa que não contava o número grande, as fichas e as linhas extras: com "Faixa" + "Mostrar meu nome",
  // o nome caía fora da faixa ou colado na borda.
  const nomeTxt = (o.nome && _mtsPrimeiroNome()) ? 'por ' + _mtsPrimeiroNome() : '';
  const faixaX = pad*0.55, faixaW = W - pad*1.1;
  const padBaixo = (nomeTxt && disp==='compacto') ? W*0.04 : W*0.05;
  const desenhaBloco = (x, y)=>{
  const alinh = disp==='grade' ? 'center' : 'left'; const ax = disp==='grade' ? W/2 : pad;
    x.textAlign = alinh;
    // nível (rara/especial)
    if(d.nivel){ x.font = `800 ${W*0.024}px ${FF}`; if(x.letterSpacing !== undefined) x.letterSpacing = `${W*0.004}px`; x.fillStyle = P.acc; x.fillText(d.nivel.toUpperCase(), ax, y + W*0.026); if(x.letterSpacing !== undefined) x.letterSpacing = '0px'; y += W*0.05; }
    // kicker
    x.fillStyle = P.acc; x.font = `800 ${W*0.028}px ${FF}`; if(x.letterSpacing !== undefined) x.letterSpacing = `${W*0.005}px`;
    x.fillText(kick, ax, y + W*0.03); if(x.letterSpacing !== undefined) x.letterSpacing = '0px'; y += W*0.04;
    // título
    x.fillStyle = P.txt; x.font = `800 ${tamTit}px ${FF}`;
    linTit.forEach(l=>{ y += tamTit*1.08; x.fillText(l, ax, y); });
    // número principal
    if(temHero){
      y += tamHero*0.98; x.font = `800 ${tamHero}px ${FF}`; x.fillStyle = P.txt;
      const hv = String(d.hero.v); const wv = x.measureText(hv).width;
      const startX = alinh==='center' ? (W - wv - (d.hero.u ? x.measureText(' ').width : 0) - (()=>{ x.font = `600 ${W*0.045}px ${FF}`; const u = x.measureText(d.hero.u||'').width; x.font = `800 ${tamHero}px ${FF}`; return u; })())/2 : ax;
      x.textAlign = 'left'; x.fillText(hv, startX, y);
      if(d.hero.u){ x.font = `600 ${W*0.045}px ${FF}`; x.fillStyle = P.acc; x.fillText(' ' + d.hero.u, startX + wv, y); }
      x.textAlign = alinh; y += W*0.03;
    }
    if(d.periodo){ y += W*0.045; x.font = `500 ${W*0.03}px ${FF}`; x.fillStyle = P.dim; x.fillText(d.periodo, ax, y); }
    // minigráfico da evolução (valores reais da série)
    if(d.serie && d.serie.length >= 2){
      y += W*0.05; const gh = W*0.08, gw = disp==='grade' ? W*0.6 : maxW*0.75, gx = disp==='grade' ? (W-gw)/2 : pad;
      const lo = Math.min(...d.serie), hi = Math.max(...d.serie), rng = (hi-lo)||1;
      x.strokeStyle = P.acc; x.lineWidth = W*0.006; x.lineJoin = 'round'; x.beginPath();
      d.serie.forEach((v,i)=>{ const px2 = gx + gw*i/(d.serie.length-1), py2 = y + gh - gh*(v-lo)/rng; i ? x.lineTo(px2, py2) : x.moveTo(px2, py2); }); x.stroke();
      y += gh + W*0.01;
    }
    if(linDesc.length){ y += W*0.02; x.font = `400 ${tamDesc}px ${FF}`; x.fillStyle = P.dim; linDesc.forEach(l=>{ y += tamDesc*1.35; x.fillText(l, ax, y); }); }
    // números
    if(nums.length){
      y += W*0.05;
      x.strokeStyle = P.linha; x.lineWidth = 2; x.beginPath(); x.moveTo(pad, y - W*0.01); x.lineTo(W-pad, y - W*0.01); x.stroke();
      const col = maxW / nums.length;
      nums.forEach((n,i)=>{
        const cx = disp==='grade' ? pad + col*i + col/2 : pad + col*i;
        x.textAlign = disp==='grade' ? 'center' : 'left';
        x.font = `500 ${tamLbl}px ${FF}`; x.fillStyle = P.dim; x.fillText(String(n.l).toUpperCase(), cx, y + tamLbl + W*0.012);
        x.font = `800 ${tamNum}px ${FF}`; x.fillStyle = P.txt;
        const v = String(n.v); x.fillText(v, cx - (disp==='grade' && n.u ? (()=>{ x.font = `600 ${tamLbl*1.15}px ${FF}`; const uw = x.measureText(' '+n.u).width; x.font = `800 ${tamNum}px ${FF}`; return uw/2; })() : 0), y + tamLbl + tamNum + W*0.02);
        if(n.u){ const vw = x.measureText(v).width; x.font = `600 ${tamLbl*1.15}px ${FF}`; x.fillStyle = P.dim; x.textAlign = 'left';
          x.fillText(' ' + n.u, disp==='grade' ? (cx + vw/2 - x.measureText(' '+n.u).width/2) : cx + vw, y + tamLbl + tamNum + W*0.02); }
      });
      x.textAlign = alinh; y += altNums;
    }
    // grupos musculares (musculação) / marcações
    if(chipsH){
      y += W*0.01; x.font = `600 ${W*0.03}px ${FF}`; x.textAlign = 'left';
      const chips = d.extra.slice(0,4); const larg = chips.map(c=>x.measureText(c).width + W*0.05); const total = larg.reduce((a,b)=>a+b,0) + W*0.015*(chips.length-1);
      let cx = disp==='grade' ? (W-Math.min(total,maxW))/2 : pad;
      chips.forEach((c,i)=>{ if(cx + larg[i] > W - pad) return; x.fillStyle = _mtsRgba(P.acc, .16); _mtsRet(x, cx, y, larg[i], W*0.055, W*0.0275); x.fill();
        x.fillStyle = P.txt; x.fillText(c, cx + W*0.025, y + W*0.038); cx += larg[i] + W*0.015; });
      y += chipsH;
    }
  if(nomeTxt){
    if(disp === 'compacto'){
      // linha própria no pé da faixa, centralizada na largura da faixa e no espaço entre o divisor e a borda
      y += W*0.03;
      x.strokeStyle = _mtsRgba(P.txt, .14); x.lineWidth = Math.max(1.5, W*0.0016); x.beginPath(); x.moveTo(faixaX + pad*0.45, y); x.lineTo(faixaX + faixaW - pad*0.45, y); x.stroke();
      let tam = W*0.03; x.font = `600 ${tam}px ${FF}`;
      const maxN = faixaW - pad*0.9; while(tam > W*0.02 && x.measureText(nomeTxt).width > maxN){ tam -= W*0.001; x.font = `600 ${tam}px ${FF}`; }
      let txtN = nomeTxt; while(txtN.length > 4 && x.measureText(txtN).width > maxN) txtN = txtN.slice(0, -2) + '…';
      x.textAlign = 'center'; x.fillStyle = P.dim;
      y += W*0.04 + tam*0.72; x.fillText(txtN, faixaX + faixaW/2, y);
    } else {
      x.textAlign = alinh; let tam = W*0.03; x.font = `500 ${tam}px ${FF}`;
      while(tam > W*0.02 && x.measureText(nomeTxt).width > maxW){ tam -= W*0.001; x.font = `500 ${tam}px ${FF}`; }
      x.fillStyle = P.dim; y += W*0.02 + tam; x.fillText(nomeTxt, ax, y);
    }
  }
  return y;
  };
  const alturaBloco = desenhaBloco(_mtsMedidor(x), 0);
  const rodapeY = H - pad*0.75;
  let y;
  if(disp === 'grade' && !foto) y = Math.min(rodapeY - W*0.07 - alturaBloco, Math.max(my+ms+W*0.08 + medTam, (H - alturaBloco)/2 + medTam*0.4));
  else y = rodapeY - W*0.06 - padBaixo - alturaBloco;
  // faixa (compacto): painel atrás do bloco
  if(disp === 'compacto'){
    x.fillStyle = foto ? 'rgba(8,10,14,.62)' : P.painel; _mtsRet(x, faixaX, y - W*0.045, faixaW, alturaBloco + W*0.045 + padBaixo, W*0.04); x.fill();
  }
  if(medRow.length){
    const tot = medRow.length*rowTam + rowGap*(medRow.length-1);
    let mx = (disp==='grade' || (o.fmt!=='story' && disp!=='destaque')) ? (W-tot)/2 : pad;
    const my2 = Math.max(my+ms+W*0.03, y - rowTam - (disp==='compacto' ? W*0.08 : W*0.03));
    medRow.forEach(m=>{ x.save(); x.shadowColor = _mtsRgba(m.cor, .5); x.shadowBlur = W*0.03; x.drawImage(m.img, mx, my2, rowTam, rowTam); x.restore(); mx += rowTam + rowGap; });
  } else if(medImg){
    const mx = (disp==='grade' || o.fmt!=='story' && disp!=='destaque') ? (W-medTam)/2 : pad - medTam*0.06;
    const my2 = y - medTam - W*0.03;
    x.save(); x.shadowColor = _mtsRgba(d.medalha.cor, .55); x.shadowBlur = W*0.05; x.drawImage(medImg, mx, Math.max(my+ms+W*0.03, my2), medTam, medTam); x.restore();
  } else if(d.emoji){
    x.save(); x.globalAlpha = 1; x.fillStyle = '#000'; x.font = `${W*0.16}px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif`; x.textAlign = disp==='grade' ? 'center' : 'left';
    x.fillText(d.emoji, disp==='grade' ? W/2 : pad, y - (disp==='compacto' ? W*0.08 : W*0.04)); x.restore();
  }
  desenhaBloco(x, y);
  // assinatura
  x.textAlign = 'right'; x.font = `600 ${W*0.026}px ${FF}`; x.fillStyle = P.dim; x.fillText('metatreino.app', W - pad, rodapeY);
  return cv;
}

// ---------- tela da Central ----------
function mtsAbrir(d, classico){
  if(!d){ toast('Ainda não há dados para montar esse card.'); return; }
  // Beta 36: abrir OUTRO item começa limpo (a foto, o zoom e o enquadramento do card anterior não passam para o próximo).
  // Trocar formato/estilo/disposição reabre com o mesmo item (MTS.d) e mantém tudo.
  if(d !== MTS.d){ MTS.foto = null; MTS.zoom = 1; MTS.px = 0; MTS.py = 0; }
  MTS.d = d; MTS.classico = classico || null;
  MTS.fmt = _mtsPref('fmt', 'story'); MTS.estilo = _mtsPref('estilo', 'escuro'); MTS.disp = _mtsPref('disp', 'destaque');
  if(!MTS_FORMATOS[MTS.fmt]) MTS.fmt = 'story';
  const chips = (grupo, obj, atual, fn)=>`<div class="mts-chips" role="radiogroup" aria-label="${grupo}">${Object.entries(obj).map(([k,v])=>`<button type="button" role="radio" aria-checked="${k===atual}" class="${k===atual?'on':''}" onclick="${fn}('${k}')">${typeof v==='string'?v:`${v.nome} <small>${v.sub}</small>`}</button>`).join('')}</div>`;
  const video = d.tipo === 'especial' && typeof saFormatoVideo==='function' && saFormatoVideo();
  $('modal-inner').classList.remove('modal-video');
  $('modal-inner').innerHTML = `<button type="button" class="modal-x" aria-label="Fechar" onclick="closeModal()">✕</button>
    <h3>Compartilhar</h3>
    <div class="mts-prev" id="mts-prev"><canvas id="mts-cv" aria-label="Prévia do card"></canvas>${MTS.foto ? '<div class="mts-dica">Arraste para posicionar · pinça para ampliar</div>' : ''}</div>
    <div class="mts-sec">Formato</div>${chips('Formato', MTS_FORMATOS, MTS.fmt, 'mtsFmt')}
    <div class="mts-sec">Fundo</div>
    <div class="mts-foto">
      <button type="button" class="btn btn-outline" onclick="document.getElementById('mts-arq').click()">${MTS.foto ? 'Trocar foto' : 'Usar foto da galeria'}</button>
      ${MTS.foto ? `<button type="button" class="btn btn-ghost" onclick="mtsSemFoto()">Sem foto</button>` : ''}
      <input type="file" id="mts-arq" accept="image/*" hidden onchange="mtsFoto(event)">
    </div>
    ${MTS.foto ? `<label class="mts-sl">Zoom <input type="range" min="1" max="3" step="0.01" value="${MTS.zoom}" oninput="MTS.zoom=+this.value;mtsDesenhaPrev()"></label>
      <label class="mts-sl">Escurecer <input type="range" min="0" max="0.9" step="0.01" value="${MTS.escurecer}" oninput="MTS.escurecer=+this.value;mtsDesenhaPrev()"></label>`
      : `${chips('Estilo', MTS_ESTILOS, MTS.estilo, 'mtsEstilo')}`}
    <div class="mts-sec">Disposição</div>${chips('Disposição', MTS_DISP, MTS.disp, 'mtsDisp')}
    <label class="mts-nome"><input type="checkbox" ${MTS.nome?'checked':''} onchange="MTS.nome=this.checked;mtsDesenhaPrev()"> Mostrar meu primeiro nome</label>
    <div class="mts-acoes">
      <button class="btn btn-primary" id="mts-comp" onclick="mtsCompartilhar()">Compartilhar</button>
      <button class="btn btn-outline" onclick="mtsSalvar()">Salvar imagem</button>
    </div>
    ${video ? `<button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openMinhaConquistaShare()">Vídeo animado (${video.ext.toUpperCase()})</button>` : ''}
    <div class="mts-priv">O card mostra só o que está nele: sem e-mail, peso ou medidas.</div>`;
  $('modal-back').classList.add('on');
  mtsDesenhaPrev(); mtsArrasto();
}
let _mtsDesenhando = false, _mtsDenovo = false;
async function mtsDesenhaPrev(){
  if(_mtsDesenhando){ _mtsDenovo = true; return; }
  _mtsDesenhando = true;
  try{ const cv = document.getElementById('mts-cv'); if(cv && MTS.d) await mtsDesenhar(cv, MTS.d, MTS); }catch(e){ console.log('card', e); }
  _mtsDesenhando = false;
  if(_mtsDenovo){ _mtsDenovo = false; mtsDesenhaPrev(); }
}
function mtsFmt(k){ MTS.fmt = k; _mtsSalvaPref('fmt', k); mtsAbrir(MTS.d, MTS.classico); }
function mtsEstilo(k){ MTS.estilo = k; _mtsSalvaPref('estilo', k); mtsAbrir(MTS.d, MTS.classico); }
function mtsDisp(k){ MTS.disp = k; _mtsSalvaPref('disp', k); mtsAbrir(MTS.d, MTS.classico); }
function mtsSemFoto(){ MTS.foto = null; MTS.zoom = 1; MTS.px = 0; MTS.py = 0; mtsAbrir(MTS.d, MTS.classico); }
function mtsFoto(ev){
  const f = ev.target.files && ev.target.files[0]; if(!f) return;
  const url = URL.createObjectURL(f); const img = new Image();
  img.onload = ()=>{
    // fotos enormes são reduzidas (memória do celular), sem perder qualidade para o card
    const max = 2400, k = Math.min(1, max/Math.max(img.width, img.height));
    let fonte = img;
    if(k < 1){ const c = document.createElement('canvas'); c.width = Math.round(img.width*k); c.height = Math.round(img.height*k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); fonte = c; }
    MTS.foto = fonte; MTS.zoom = 1; MTS.px = 0; MTS.py = 0; URL.revokeObjectURL(url);
    mtsAbrir(MTS.d, MTS.classico);
  };
  img.onerror = ()=>{ URL.revokeObjectURL(url); toast('Não consegui abrir essa imagem.'); };
  img.src = url;
}
// arrastar e pinçar a foto na prévia
function mtsArrasto(){
  const cv = document.getElementById('mts-cv'); if(!cv || !MTS.foto) return;
  const pts = new Map(); let ini = null;
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e=>{ cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, {x:e.clientX, y:e.clientY}); ini = { px:MTS.px, py:MTS.py, zoom:MTS.zoom, pts:new Map(pts) }; });
  cv.addEventListener('pointermove', e=>{
    if(!pts.has(e.pointerId) || !ini) return; pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
    const r = cv.getBoundingClientRect();
    if(pts.size === 1){
      const p0 = ini.pts.get(e.pointerId); if(!p0) return;
      MTS.px = Math.max(-1, Math.min(1, ini.px + (e.clientX - p0.x)/(r.width/2)));
      MTS.py = Math.max(-1, Math.min(1, ini.py + (e.clientY - p0.y)/(r.height/2)));
    } else if(pts.size === 2 && ini.pts.size === 2){
      const a = [...pts.values()], b = [...ini.pts.values()];
      const d1 = Math.hypot(a[0].x-a[1].x, a[0].y-a[1].y), d0 = Math.hypot(b[0].x-b[1].x, b[0].y-b[1].y) || 1;
      MTS.zoom = Math.max(1, Math.min(3, ini.zoom * d1/d0));
    }
    mtsDesenhaPrev();
  });
  const fim = e=>{ pts.delete(e.pointerId); ini = { px:MTS.px, py:MTS.py, zoom:MTS.zoom, pts:new Map(pts) }; };
  cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', fim);
  cv.addEventListener('wheel', e=>{ e.preventDefault(); MTS.zoom = Math.max(1, Math.min(3, MTS.zoom * (e.deltaY < 0 ? 1.06 : 0.94))); mtsDesenhaPrev(); }, { passive:false });
}
async function mtsArquivo(){
  const cv = document.createElement('canvas'); await mtsDesenhar(cv, MTS.d, MTS);
  const tipo = MTS.foto ? 'image/jpeg' : 'image/png';
  const blob = await new Promise(r=>cv.toBlob(r, tipo, 0.92));
  const nome = `metatreino-${MTS.d.tipo}-${MTS.fmt}.${MTS.foto?'jpg':'png'}`;
  return { blob, nome, tipo };
}
async function mtsCompartilhar(){
  const b = document.getElementById('mts-comp'); if(b){ b.disabled = true; b.textContent = 'Gerando…'; }
  try{
    const { blob, nome, tipo } = await mtsArquivo(); if(!blob) throw new Error('sem imagem');
    const file = new File([blob], nome, { type:tipo });
    if(navigator.canShare && navigator.canShare({ files:[file] })){
      try{ await navigator.share({ files:[file], text: MTS.d.texto || 'MetaTreino' }); }catch(e){ /* cancelou */ }
    } else { _mtsBaixa(blob, nome); toast('Este navegador não abre o compartilhamento direto: a imagem foi salva. Envie pela galeria.'); }
  }catch(e){ toast('Não foi possível gerar a imagem.'); }
  if(b){ b.disabled = false; b.textContent = 'Compartilhar'; }
}
async function mtsSalvar(){ try{ const { blob, nome } = await mtsArquivo(); _mtsBaixa(blob, nome); toast('Imagem salva (galeria ou downloads).'); }catch(e){ toast('Não foi possível salvar a imagem.'); } }
function _mtsBaixa(blob, nome){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(()=>{ try{ URL.revokeObjectURL(a.href); a.remove(); }catch(e){} }, 4000); }
function mtsClassico(){ const f = MTS.classico; if(typeof f === 'function'){ closeModal(); setTimeout(f, 60); } }

// ---------- ligação com os botões que já existiam ----------
const _shareWorkoutImageB26 = window.shareWorkoutImage;
window.shareWorkoutImage = function(histIdx){
  const mod = state.modules[state.active]; const x = ((mod && mod.history)||[])[histIdx];
  const d = mtsDeHistorico(x); if(!d) return _shareWorkoutImageB26.apply(this, arguments);
  mtsAbrir(d, ()=>_shareWorkoutImageB26(histIdx));
};
const _shareTrophyImageB26 = window.shareTrophyImage;
// Beta 36: conquista abre SEMPRE a central atual. A interface antiga só aparecia por caminhos de exceção
// (link "Modelo clássico", erro ao montar o card); agora um erro vira aviso, sem trocar de interface.
window.shareTrophyImage = function(id){
  let d = null; try{ d = mtsDeConquista(id); }catch(e){ console.log('card da conquista', e); }
  if(!d){ toast('Não consegui montar o card desta conquista. Tente de novo.'); return; }
  mtsAbrir(d);
};
const _shareTrophiesImageB27 = window.shareTrophiesImage;
window.shareTrophiesImage = function(){ let d = null; try{ d = mtsDeColecao(); }catch(e){ console.log('card da coleção', e); } if(!d){ toast('Você ainda não tem conquistas para compartilhar.'); return; } mtsAbrir(d); };
const _shareWeekImageB26 = window.shareWeekImage;
window.shareWeekImage = function(){ const d = mtsDeSemana(); if(!d) return _shareWeekImageB26.apply(this, arguments); mtsAbrir(d, ()=>_shareWeekImageB26()); };
if(typeof window.shareWeekSummary === 'function'){ const _sws = window.shareWeekSummary; window.shareWeekSummary = function(){ const d = mtsDeSemana(); if(!d) return _sws.apply(this, arguments); mtsAbrir(d, ()=>_sws()); }; }
const _shareEventoImagemB26 = window.shareEventoImagem;
window.shareEventoImagem = function(key){ const d = mtsDeDesafio(key); if(!d) return _shareEventoImagemB26.apply(this, arguments); mtsAbrir(d, ()=>_shareEventoImagemB26(key)); };
// conquista especial: a janela de vídeo ganha a opção de card com foto e formatos
mtGancho('openMinhaConquistaShare', { depois(){
  const mi = $('modal-inner'); if(!mi || mi.querySelector('#mts-esp')) return;
  const b = document.createElement('button'); b.id = 'mts-esp'; b.className = 'btn btn-outline btn-block'; b.style.marginTop = '8px';
  b.textContent = 'Card com foto e formatos (Stories, Feed, Quadrado)'; b.onclick = ()=>mtsAbrir(mtsDeEspecial(), ()=>openMinhaConquistaShare());
  const img = [...mi.querySelectorAll('button')].find(x=>/como imagem/i.test(x.textContent)); (img || mi.lastElementChild).after(b);
}});
// recordes (Progresso): cada linha passa a poder ser compartilhada
mtGancho('renderRecords', { depois(){
  document.querySelectorAll('#records-list .rec-row').forEach(r=>{
    if(r.dataset.mts) return; r.dataset.mts = '1';
    const t = r.querySelector('div > div'); const sub = r.querySelector('div > div + div'); const val = r.querySelector('.rec-val');
    if(!t || !val) return;
    const quando = (()=>{ const m = (sub && sub.textContent || '').match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? new Date(+m[3], +m[2]-1, +m[1]).getTime() : null; })();
    const corrida = /dist|ritmo|pedal|caminhada/i.test(t.textContent);
    const bt = document.createElement('button'); bt.type = 'button'; bt.className = 'rec-share'; bt.setAttribute('aria-label', 'Compartilhar recorde: ' + t.textContent);
    bt.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>';
    bt.onclick = ()=>mtsAbrir(mtsDeRecorde(t.textContent, val.textContent.trim(), quando, corrida));
    r.appendChild(bt);
  });
}});
// evolução de um exercício: botão de compartilhar no gráfico
mtGancho('openExProgress', { depois(exId){
  const mi = $('modal-inner'); if(!mi || mi.querySelector('#mts-evo')) return;
  const d = mtsDeEvolucao(exId); if(!d) return;
  const fechar = [...mi.querySelectorAll('button')].reverse().find(b=>/Fechar/.test(b.textContent));
  const b = document.createElement('button'); b.id = 'mts-evo'; b.className = 'btn btn-outline btn-block'; b.style.marginTop = '10px';
  b.textContent = 'Compartilhar minha evolução'; b.onclick = ()=>mtsAbrir(mtsDeEvolucao(exId));
  if(fechar) fechar.before(b); else mi.appendChild(b);
}});

Object.assign(window, { MTS, mtsAbrir, mtsDesenhar, mtsDesenhaPrev, mtsFmt, mtsEstilo, mtsDisp, mtsFoto, mtsSemFoto, mtsCompartilhar, mtsSalvar, mtsClassico,
  mtsDeHistorico, mtsDeConquista, mtsDeColecao, mtsDeEspecial, mtsDeDesafio, mtsDeSemana, mtsDeRecorde, mtsDeEvolucao });

// =====================================================================
// 42. Beta 28 — Treinos sem exercício repetido + ficha do exercício em tela cheia
// =====================================================================

// ---------- 1. Treinos sem repetir o mesmo exercício ----------
// O gerador (buildLiftExercises) continua o mesmo: séries, repetições, descanso, quantidade
// por grupo e a ordem de prioridade não mudam. Depois que ele escolhe, esta etapa confere o
// treino do dia e troca só o que é, na prática, o mesmo exercício (ex.: "Flexão Diamante" no
// peito e "Flexão Fechada (diamante)" no tríceps) por outro do mesmo grupo, com o mesmo
// equipamento. Se não houver alternativa, o exercício repetido sai e o que ficou ganha uma série
// (o volume do grupo se mantém).
//
// "chave" = exercícios que são o mesmo movimento com outro nome ou outro aparelho.
// limite = quantos dessa chave cabem no mesmo treino.
const TREINO_CHAVES = [
  { k:'flexao-diamante', re:/diamante/i, max:1, igual:true },
  { k:'agachamento-sumo', re:/agachamento sum[oô]/i, max:1, igual:true },
  { k:'rosca-martelo', re:/rosca martelo/i, max:1, igual:true },
  { k:'elevacao-lateral', re:/eleva[cç][aã]o lateral/i, max:1, igual:true },
  { k:'supino-reto', re:/supino reto|supino na m[aá]quina \(hammer\)/i, max:1 },
  { k:'supino-inclinado', re:/supino inclinado|supino na m[aá]quina inclinado/i, max:1 },
  { k:'mergulho', re:/^mergulho|\(mergulho\)/i, max:1, igual:true },
  { k:'barra-fixa', re:/^barra fixa|chin-?up/i, max:2 },
  { k:'flexao', re:/^flex[aã]o(?! pike)/i, max:3, igual:true }
];
function treinoChaves(nome){ return TREINO_CHAVES.filter(c=>c.re.test(String(nome||''))); }
// agachamento sem carga ao lado de um agachamento com carga (goblet, barra, smith, leg press, hack) é redundante
const _AGACH_CARGA = /agachamento goblet|agachamento livre com barra|agachamento no smith|leg press|hack machine/i;
function _treinoPoolDoGrupo(p, setup){
  const cat = EX_BANK.find(c=>c.name===p); if(!cat) return [];
  const equip = setup.equip || 'academia';
  const equipFilter = equip==='basico' ? ['casa','halteres'] : equip==='academia' ? ['academia','halteres','casa'] : equip==='halteres' ? ['halteres','casa'] : ['casa'];
  if(equip === 'custom') return cat.items.filter(ex=>{ try{ return podeFazerCom(ex, setup.equipList || []); }catch(e){ return false; } });
  return cat.items.filter(ex => (ex.equip||[]).some(e => equipFilter.includes(e)) && (equip==='casa' || !ex.improv));
}
// devolve a lista corrigida (não altera exercícios fixados pelo aluno: "fixos" = ids)
function treinoSemRepeticao(lista, setup, fixos){
  if(!Array.isArray(lista) || lista.length < 2) return lista;
  fixos = fixos || new Set();
  const out = lista.map(e=>Object.assign({}, e));
  const conta = ()=>{ const c = {}; out.forEach(e=>treinoChaves(e.name).forEach(ch=>{ c[ch.k] = (c[ch.k]||0) + 1; })); return c; };
  const estoura = (nome, c)=>treinoChaves(nome).some(ch=>(c[ch.k]||0) >= ch.max);
  const iso = e=>exPattern(e.name)==='isolador';
  const trocar = (i)=>{
    const velho = out[i]; const c = conta();
    // tira o próprio exercício da contagem antes de testar candidatos
    treinoChaves(velho.name).forEach(ch=>{ c[ch.k]--; });
    const usados = new Set(out.map(e=>e.id));
    const padroesDoGrupo = new Set(out.filter((e,j)=>j!==i && e.part===velho.part).map(e=>exPattern(e.name)));
    const cands = _treinoPoolDoGrupo(velho.part, setup).filter(ex=>!usados.has(slug(ex.name)) && !estoura(ex.name, c) && !!ex.iso === (velho.unit==='tempo')
      && !(/peso corporal/i.test(ex.name) && /^agachamento/i.test(ex.name) && out.some(e=>_AGACH_CARGA.test(e.name))));
    if(!cands.length) return false;
    // preferências: mesmo tipo (composto/isolador) e um movimento que o grupo ainda não tem
    cands.sort((a,b)=>((iso(a)===iso(velho)?0:1) - (iso(b)===iso(velho)?0:1)) || ((padroesDoGrupo.has(exPattern(a.name))?1:0) - (padroesDoGrupo.has(exPattern(b.name))?1:0)));
    const n = cands[0];
    out[i] = Object.assign({}, velho, { id:slug(n.name), name:n.name, sub:n.sub, equip:n.equip });
    return true;
  };
  const tirar = (i, parceiro)=>{
    const velho = out.splice(i, 1)[0];
    if(parceiro){ const p = out.find(e=>e.id===parceiro.id); if(p) p.sets = Math.min(5, (parseInt(p.sets)||3) + 1); }
    return velho;
  };
  // 1) agachamento sem carga quando já existe um com carga
  for(let i=out.length-1;i>=0;i--){
    const e = out[i];
    if(fixos.has(e.id) || !/^agachamento livre \(peso corporal\)/i.test(e.name)) continue;
    if(!out.some((x,j)=>j!==i && _AGACH_CARGA.test(x.name))) continue;
    if(!trocar(i)){ const par = out.find((x,j)=>j!==i && _AGACH_CARGA.test(x.name)); tirar(i, par); }
  }
  // 2) chaves acima do limite: da última para a primeira (os primeiros são os prioritários do gerador)
  for(let volta=0; volta<3; volta++){
    let mudou = false; const c = conta();
    for(let i=out.length-1;i>=0;i--){
      const e = out[i]; if(fixos.has(e.id)) continue;
      const ch = treinoChaves(e.name).find(ch=>(c[ch.k]||0) > ch.max); if(!ch) continue;
      if(trocar(i)){ mudou = true; break; }
      if(ch.igual){ const par = out.find((x,j)=>j!==i && ch.re.test(x.name)); tirar(i, par); mudou = true; break; }
      // movimento parecido sem alternativa no equipamento do aluno: fica (é o que dá para fazer)
      c[ch.k]--;
    }
    if(!mudou) break;
  }
  return out;
}
const _buildLiftExercisesB28 = window.buildLiftExercises;
window.buildLiftExercises = function(parts, setup){
  const lista = _buildLiftExercisesB28.apply(this, arguments);
  try{ return treinoSemRepeticao(lista, setup || {}); }catch(e){ console.log('treino sem repetição', e); return lista; }
};
// Planos já salvos: corrige uma vez (só os treinos de musculação gerados pelo app; exercícios
// trocados à mão pelo aluno não mudam). O histórico fica igual: ele é guardado por exercício.
function treinoCorrigeSalvos(){
  try{
    const mod = state.modules && state.modules.lift; if(!mod || !mod.plan || !mod.setup || state.b28SemRepeticao) return;
    let n = 0;
    (mod.plan.workouts||[]).forEach(w=>{
      if(!w || w.cali || !Array.isArray(w.exercises)) return;
      const fixos = new Set((w.pins||[]).map(p=>p && (p.to || p.id || p.novo)).filter(Boolean));
      const antes = w.exercises.map(e=>e.id).join('|');
      const novo = treinoSemRepeticao(w.exercises, mod.setup, fixos);
      if(novo.map(e=>e.id).join('|') !== antes){ w.exercises = novo; w.duration = estimateLiftDuration(novo, mod.setup.goal); n++; }
    });
    state.b28SemRepeticao = true; saveData();
    if(n) setTimeout(()=>toast(`Ajustei ${n===1?'1 treino':n+' treinos'} para não repetir o mesmo exercício.`), 1800);
  }catch(e){ console.log('corrige planos', e); }
}
mtGancho('renderHome', { depois(){ treinoCorrigeSalvos(); }});

// ---------- 2. Ficha do exercício ("Ver como fazer") ----------
// Ocupa a tela toda: o vídeo fica no topo e o conteúdo ganha o espaço que sobrava em cima.
// O botão Fechar fica fixo embaixo (não corta mais depois de sair da tela cheia).
// A altura real da tela é medida de novo ao sair da tela cheia e ao girar o celular.
function mtMedeTela(){ try{ document.documentElement.style.setProperty('--mt-vh', (window.innerHeight/100) + 'px'); }catch(e){} }
mtMedeTela();
window.addEventListener('resize', mtMedeTela);
window.addEventListener('orientationchange', ()=>setTimeout(mtMedeTela, 250));
document.addEventListener('fullscreenchange', ()=>{
  [60, 300, 700].forEach(t=>setTimeout(()=>{
    mtMedeTela();
    const mi = $('modal-inner');
    if(!document.fullscreenElement && mi && mi.classList.contains('modal-ex')){ mi.style.transform = 'translateZ(0)'; void mi.offsetHeight; mi.style.transform = ''; }
  }, t));
});
mtGancho('openExerciseSheet', { depois(){
  const mi = $('modal-inner'); if(!mi || !mi.classList.contains('modal-ex')) return;
  const sc = mi.querySelector('.ex-scroll'); if(!sc) return;
  const fechar = [...sc.children].reverse().find(b=>b.tagName==='BUTTON' && /Fechar/.test(b.textContent));
  if(fechar && !mi.querySelector('.ex-rodape')){
    const rod = document.createElement('div'); rod.className = 'ex-rodape';
    fechar.style.marginTop = '0'; rod.appendChild(fechar); mi.appendChild(rod);
  }
  mtMedeTela();
}});

Object.assign(window, { treinoSemRepeticao, treinoCorrigeSalvos, mtMedeTela });

// =====================================================================
// 43. Beta 29 — Desenho do Início que acompanha o dia + ordem dos blocos do Início
// =====================================================================

// ---------- 1. Cena do Início ----------
// Beta 36: a cena virou uma paisagem em camadas numa "janela" à direita da saudação (a foto do perfil
// subiu para a linha do METATREINO, então nada mais cobre o sol, a lua ou as nuvens).
//   horário: amanhecer (5h–9h) · dia · fim de tarde (17h–19h) · noite (lua e estrelas)
//   clima (só com a localização liberada, com os mesmos dados da linha de clima, sem buscar nada a mais):
//   nublado, chuva, garoa, tempestade, névoa ou neve. Sem dados de clima: só o horário, nunca um clima inventado.
//   datas: dia da prova, véspera da prova, aniversário do aluno, Ano-Novo e Natal (nessa ordem).
// Camadas: céu (sol/lua/estrelas) → serra ao fundo → montanha da meta com a bandeira → trilha → clima na frente.
// Tudo é SVG parado: não gasta bateria e some com "Fundo decorativo". Coordenadas: 390 × 100, desenho à direita.
const CENA_VB = '0 0 390 100';
const CENA = {
  serraFundo: `<path class="c-serra1" d="M150 100V86c26-6 48-4 72-12s40-16 64-14 36 10 56 6 32-10 48-8v42z"/>`,
  montanha: `<path class="c-mont" d="M236 100l46-36 14 10 40-44 54 56v14z"/><path class="c-neve" d="M326 41l10-11 10 11-5-2-5 4-5-4z"/>`,
  frente: `<path class="c-frente" d="M196 100c22-8 44-9 66-6s46 3 70-4 40-7 58-3v13z"/>`,
  bandeira: `<path class="c-ac" d="M336 30V10" stroke-width="2"/><path class="c-acf" d="M336 10h17l-5 5 5 5h-17z"/>`,
  trilha: `<path class="c-ac" d="M286 100c10-6 18-12 24-20s12-16 18-24 6-14 8-24" stroke-width="1.8" stroke-dasharray="1.5 6" stroke-opacity=".75"/>`,
  sol: (x, y, r)=>`<circle class="c-halo" cx="${x}" cy="${y}" r="${r*1.9}"/><circle class="c-astro" cx="${x}" cy="${y}" r="${r}"/>`
    + `<path class="c-raio" d="${[0,45,90,135,180,225,270,315].map(g=>{ const a = g*Math.PI/180, r1 = r+5, r2 = r+9; return `M${(x+Math.cos(a)*r1).toFixed(1)} ${(y+Math.sin(a)*r1).toFixed(1)}L${(x+Math.cos(a)*r2).toFixed(1)} ${(y+Math.sin(a)*r2).toFixed(1)}`; }).join('')}"/>`,
  // sol no horizonte (amanhecer e fim de tarde): só a metade de cima, com o brilho espalhado na linha do horizonte
  solBaixo: (x, y, r)=>`<ellipse class="c-halo" cx="${x}" cy="${y}" rx="${r*3.2}" ry="${r*1.5}"/><path class="c-astro" d="M${x-r} ${y}a${r} ${r} 0 0 1 ${r*2} 0z"/>`
    + `<path class="c-raio" d="M${x} ${y-r-5}v-5M${x-r-3} ${y-r+3}l-4-4M${x+r+3} ${y-r+3}l4-4M${x-r-6} ${y-1}h-5M${x+r+6} ${y-1}h5"/><path class="c-linha" d="M${x-r*2.4} ${y}h${r*4.8}" stroke-opacity=".35"/>`,
  lua: (x, y)=>`<circle class="c-halo" cx="${x}" cy="${y}" r="20"/><path class="c-astro" d="M${x+3} ${y-12}a12.5 12.5 0 1 0 9.5 17 10 10 0 0 1-9.5-17z"/>`,
  estrela: (x, y, s)=>`<path class="c-estrela" d="M${x} ${y-s}Q${x} ${y} ${x+s} ${y}Q${x} ${y} ${x} ${y+s}Q${x} ${y} ${x-s} ${y}Q${x} ${y} ${x} ${y-s}z"/>`,
  nuvem: (x, y, k)=>{ k = k || 1; const f = n=>+(n*k).toFixed(1);
    return `<path class="c-nuvem" d="M${x-f(26)} ${y+f(10)}h${f(50)}a${f(11)} ${f(11)} 0 0 0 0-${f(22)}a${f(15)} ${f(15)} 0 0 0-${f(28)}-${f(5)}a${f(11)} ${f(11)} 0 0 0-${f(22)} ${f(27)}z"/>`; },
  chuva: (x, y)=>`<path class="c-chuva" d="M${x-14} ${y+16}l-3 9M${x-4} ${y+16}l-3 9M${x+6} ${y+16}l-3 9M${x+16} ${y+16}l-3 9M${x-9} ${y+29}l-2 6M${x+1} ${y+29}l-2 6M${x+11} ${y+29}l-2 6"/>`,
  garoa: (x, y)=>`<path class="c-chuva" d="M${x-12} ${y+16}v3M${x-2} ${y+18}v3M${x+8} ${y+16}v3M${x-7} ${y+26}v3M${x+3} ${y+28}v3M${x+13} ${y+25}v3"/>`,
  raio: (x, y)=>`<path class="c-acf" d="M${x+3} ${y+13}l-9 13h7l-4 12 11-15h-7l4-10z"/>`,
  neve: (x, y)=>`<g class="c-floco">${[[-12,18],[0,23],[12,18],[-6,31],[7,33]].map(([a,b])=>`<circle cx="${x+a}" cy="${y+b}" r="1.8"/>`).join('')}</g>`,
  nevoa: `<path class="c-nevoa" d="M232 70c16-4 28 4 44 0s28-4 44 0 28 4 44 0 20-3 26-2M216 82c16-4 28 4 44 0s28-4 44 0 28 4 44 0 28-4 42-2M244 94c16-4 28 4 44 0s28-4 44 0 28 4 44 0"/>`,
  // datas
  chegada: `<path class="c-linha" d="M276 100V34M366 100V34" stroke-width="2"/><rect class="c-fill" x="276" y="22" width="90" height="16" rx="3"/>
    <path class="c-acf" d="M282 26h8v4h-8zM298 26h8v4h-8zM314 26h8v4h-8zM330 26h8v4h-8zM346 26h8v4h-8zM290 30h8v4h-8zM306 30h8v4h-8zM322 30h8v4h-8zM338 30h8v4h-8zM354 30h8v4h-8z"/>`,
  cronometro: `<circle class="c-fill" cx="296" cy="42" r="18"/><path class="c-linha" d="M290 20h12M296 20v4M309 29l4-4"/><path class="c-ac" d="M296 42V31M296 42l7 5" stroke-width="2"/>`,
  baloes: `<path class="c-linha" d="M286 44c4 10 12 16 22 22M308 36v30M330 44c-4 10-10 16-22 22" stroke-opacity=".6"/>
    <ellipse class="c-fill" cx="286" cy="30" rx="10" ry="13"/><ellipse class="c-acf" cx="308" cy="22" rx="11" ry="14"/><ellipse class="c-fill" cx="330" cy="30" rx="10" ry="13"/>
    <g class="c-floco"><circle cx="262" cy="18" r="1.8"/><circle cx="354" cy="14" r="1.8"/><circle cx="372" cy="40" r="1.8"/><circle cx="252" cy="44" r="1.8"/></g>`,
  fogos: (x, y, r)=>`<path class="c-ac" stroke-width="2" d="${[0,45,90,135,180,225,270,315].map(g=>{ const a = g*Math.PI/180; return `M${(x+Math.cos(a)*r*0.45).toFixed(1)} ${(y+Math.sin(a)*r*0.45).toFixed(1)}L${(x+Math.cos(a)*r).toFixed(1)} ${(y+Math.sin(a)*r).toFixed(1)}`; }).join('')}"/>`,
  natal: `<path class="c-fill" d="M268 100l12-20h-6l10-16h-5l9-15 9 15h-5l10 16h-6l12 20z"/><path class="c-acf" d="M287 36l2 4.4 4.8.6-3.5 3.3.9 4.7-4.2-2.3-4.2 2.3.9-4.7-3.5-3.3 4.8-.6z"/>
    <g class="c-floco"><circle cx="280" cy="76" r="2"/><circle cx="292" cy="68" r="2"/><circle cx="296" cy="88" r="2"/></g>`
};
function _cenaData(){
  const d = new Date(), m = d.getMonth()+1, dia = d.getDate();
  try{
    const rd = state.modules && state.modules.run && state.modules.run.setup && state.modules.run.setup.raceDate;
    if(rd){
      const prova = new Date(rd + 'T00:00:00'); const hoje = new Date(); hoje.setHours(0,0,0,0);
      const dif = Math.round((prova - hoje)/86400000);
      if(dif === 0) return 'prova';
      if(dif === 1) return 'vespera';
    }
  }catch(e){}
  try{ if(typeof isBirthday==='function' && isBirthday()) return 'aniversario'; }catch(e){}
  if((m===12 && dia===31) || (m===1 && dia===1)) return 'anonovo';
  if(m===12 && (dia===24 || dia===25)) return 'natal';
  return null;
}
function _cenaHora(){ const h = new Date().getHours(); return h>=5 && h<9 ? 'amanhecer' : h>=9 && h<17 ? 'dia' : h>=17 && h<19 ? 'tarde' : 'noite'; }
function _cenaClima(){
  const w = (typeof weatherData!=='undefined') ? weatherData : null;
  if(!w || w.code==null || !w.at || Date.now() - w.at > 3*3600000) return null;
  const c = w.code;
  if(c>=95) return 'tempestade'; if((c>=61&&c<=67)||(c>=80&&c<=82)) return 'chuva'; if(c>=51&&c<=57) return 'garoa';
  if(c>=71&&c<=77) return 'neve'; if(c===45||c===48) return 'nevoa'; if(c>=2&&c<=3) return 'nublado';
  return 'limpo';
}
function _cenaSvg(corpo, k){ return `<svg viewBox="${CENA_VB}" preserveAspectRatio="xMaxYMax meet" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" data-cena="${k}">${corpo}</svg>`; }
function cenaInicio(){
  const hora = _cenaHora();
  const noite = hora === 'noite';
  const estrelas = CENA.estrela(262, 14, 3) + CENA.estrela(318, 8, 2.2) + CENA.estrela(372, 22, 2.6) + CENA.estrela(252, 6, 2);
  const paisagem = (comBandeira)=>CENA.serraFundo + CENA.montanha + (comBandeira ? CENA.bandeira : '') + CENA.trilha + CENA.frente;
  const data = _cenaData();
  if(data){
    const ceuData = noite ? estrelas : '';
    const corpo = {
      prova: ceuData + CENA.serraFundo + CENA.chegada + CENA.frente,
      vespera: ceuData + paisagem(true) + CENA.cronometro,
      aniversario: ceuData + paisagem(true) + CENA.baloes,
      anonovo: estrelas + CENA.fogos(272, 24, 13) + CENA.fogos(306, 12, 8) + CENA.fogos(372, 38, 10) + paisagem(true),
      natal: (noite ? estrelas : '') + CENA.serraFundo + CENA.montanha + CENA.bandeira + CENA.natal + CENA.frente
    }[data];
    return { k:'data-'+data, svg: corpo };
  }
  const clima = _cenaClima();
  let ceu = '';
  if(hora === 'amanhecer') ceu = CENA.solBaixo(296, 78, 11);
  else if(hora === 'dia') ceu = CENA.sol(290, 30, 11);
  else if(hora === 'tarde') ceu = CENA.solBaixo(292, 80, 10);
  else ceu = CENA.lua(292, 30) + estrelas;
  // nuvem na frente do astro (dá profundidade); chuva forte esconde o sol e a lua
  const nx = hora==='tarde' || hora==='amanhecer' ? 296 : 310, ny = hora==='tarde' || hora==='amanhecer' ? 46 : 38;
  let tempo = '';
  if(clima && clima !== 'limpo'){
    if(clima === 'nevoa') tempo = CENA.nevoa;
    else {
      tempo = CENA.nuvem(nx, ny);
      if(clima === 'nublado') tempo = CENA.nuvem(nx + 44, ny + 10, .7) + tempo;
      if(clima === 'chuva') tempo += CENA.chuva(nx, ny);
      if(clima === 'garoa') tempo += CENA.garoa(nx, ny);
      if(clima === 'tempestade') tempo += CENA.chuva(nx, ny) + CENA.raio(nx, ny);
      if(clima === 'neve') tempo += CENA.neve(nx, ny);
      if(clima === 'chuva' || clima === 'tempestade'){ if(hora === 'dia') ceu = ''; if(noite) ceu = estrelas; tempo = CENA.nuvem(nx + 42, ny + 6, .75) + tempo; }
    }
  }
  return { k:`${hora}-${clima||'semclima'}`, svg: ceu + paisagem(true) + tempo };
}
const _updateDecoB29 = window.updateDeco;
window.updateDeco = function(tab){
  const el = document.getElementById('app-deco');
  // Com a capa do mural ligada, a capa é a imagem do topo: a cena do céu não é desenhada (ficaria escondida atrás dela)
  const capaLigada = ()=>{ const h = document.getElementById('home-hero'); return !!(h && !h.classList.contains('hidden')); };
  if(tab === 'home' && el && decoEnabled() && capaLigada()){ document.body.classList.remove('no-deco'); el.classList.add('deco36'); el.innerHTML = ''; el.dataset.k = 'sem'; delete el.dataset.cena; return; }
  if(tab === 'home' && el && decoEnabled()){
    document.body.classList.remove('no-deco');
    el.classList.add('deco36');
    const c = cenaInicio();
    if(el.dataset.k !== 'inicio' || el.dataset.cena !== c.k || !el.innerHTML){
      el.dataset.k = 'inicio'; el.dataset.cena = c.k;
      el.innerHTML = _cenaSvg(c.svg, c.k);
    }
    try{ requestAnimationFrame(()=>{ decoPosiciona('home'); setTimeout(()=>decoPosiciona('home'), 200); }); }catch(e){}
    return;
  }
  if(el) delete el.dataset.cena;
  return _updateDecoB29.apply(this, arguments);
};
// o clima chega depois (internet) e a hora passa: confere de vez em quando, só redesenha se mudou
setInterval(()=>{ try{ if(state && state.ui && (state.ui.tab||'home')==='home' && document.visibilityState==='visible'){ updateDeco('home'); climaChip(); } }catch(e){} }, 60000);

// ---------- 2. Clima sem repetir ----------
// A temperatura sai da frase e vira um selo discreto no topo (ao lado do METATREINO),
// com o ícone do tempo de agora. A frase fica só com a dica ("tempo perfeito para treinar").
// Com a capa de foto do mural (sem a linha do METATREINO), tudo continua como antes.
const CLIMA_ICO = {
  sol:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>',
  lua:'<path d="M15.5 3.5a8.5 8.5 0 1 0 5 12.3 6.8 6.8 0 0 1-5-12.3z"/>',
  nuvem:'<path d="M7 18h10a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.7 1.3A3.4 3.4 0 0 0 7 18z"/>',
  chuva:'<path d="M7 14h10a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.7 1.3A3.4 3.4 0 0 0 7 14z"/><path d="M8.5 17l-1 3M12.5 17l-1 3M16.5 17l-1 3"/>',
  raio:'<path d="M7 14h10a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.7 1.3A3.4 3.4 0 0 0 7 14z"/><path d="M12.5 15l-2.5 4h3l-2 3"/>',
  nevoa:'<path d="M4 9h16M3 13h18M5 17h14"/>'
};
function _climaSeloVisivel(){
  const capa = (typeof coachMural!=='undefined') && coachMural && coachMural.capa && (coachMural.capaFoto || coachMural.foto);
  const br = $('home-brand-row');
  return !capa && br && getComputedStyle(br).display !== 'none';
}
function climaChip(){
  const br = $('home-brand-row'); if(!br) return;
  let chip = $('home-clima');
  const w = (typeof weatherData!=='undefined') ? weatherData : null;
  if(!w || w.temp == null || !_climaSeloVisivel()){ if(chip) chip.remove(); return; }
  const c = _cenaClima() || 'limpo', noite = _cenaHora() === 'noite';
  const ico = c==='tempestade' ? 'raio' : (c==='chuva'||c==='garoa') ? 'chuva' : c==='nevoa' ? 'nevoa' : c==='nublado' ? 'nuvem' : noite ? 'lua' : 'sol';
  if(!chip){ chip = document.createElement('div'); chip.id = 'home-clima'; br.appendChild(chip); }
  const desc = (typeof wmoDesc==='function') ? wmoDesc(w.code) : '';
  chip.setAttribute('aria-label', `Agora: ${Math.round(w.temp)} graus, ${desc}`);
  chip.title = `${Math.round(w.temp)}°C, ${desc}`;
  const curto = { tempestade:'Tempestade', chuva:'Chuva', garoa:'Garoa', neve:'Neve', nevoa:'Névoa', nublado:'Nublado' }[c] || (noite ? 'Céu limpo' : 'Ensolarado');
  chip.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CLIMA_ICO[ico]}</svg><b>${Math.round(w.temp)}°</b><span>${curto}</span>`;
  climaChipCabe();
}
const _weatherHomeLineB29 = window.weatherHomeLine;
window.weatherHomeLine = function(){
  const l = _weatherHomeLineB29.apply(this, arguments);
  if(!l || !_climaSeloVisivel()) return l;
  // "🌡️ 23°C, parcialmente nublado · tempo perfeito para treinar 💪" → "Tempo perfeito para treinar 💪"
  const dica = String(l).replace(/^🌡️\s*-?\d+°C,\s*[^·]*·\s*/, '');
  return dica ? dica.charAt(0).toUpperCase() + dica.slice(1) : l;
};
// Beta 36: o chip do clima nunca encosta no nome do app. Se a descrição ("Tempestade", "Céu limpo"…)
// não couber com folga, fica só o ícone e a temperatura (a descrição continua no toque longo/leitor de tela).
function climaChipCabe(){
  const br = $('home-brand-row'), chip = $('home-clima'); if(!br || !chip) return;
  chip.classList.remove('so-temp');
  const nome = [...br.children].find(e=>!e.classList.contains('brand-logo') && !e.classList.contains('avatar') && e.id!=='home-clima'); if(!nome) return;
  const r = document.createRange(); r.selectNodeContents(nome);
  const fim = Math.max(...[...r.getClientRects()].map(x=>x.right));
  if(chip.getBoundingClientRect().left - fim < 14) chip.classList.add('so-temp');
}
window.addEventListener('resize', ()=>{ try{ climaChipCabe(); }catch(e){} }, { passive:true });
// Beta 36: a foto do perfil sobe para a linha do METATREINO (à direita, depois do clima). Assim a janela
// ao lado da saudação fica livre para o desenho do céu. Tocar na foto abre o Perfil.
function inicioAvatarNoTopo(){
  const br = $('home-brand-row'), av = $('home-avatar'); if(!br || !av) return;
  if(av.parentElement !== br) br.appendChild(av);
  if(!av.dataset.toque){ av.dataset.toque = '1'; av.setAttribute('role', 'button'); av.setAttribute('tabindex', '0'); av.setAttribute('aria-label', 'Abrir meu perfil'); av.addEventListener('click', ()=>goTab('profile')); }
}
mtGancho('renderHome', { depois(){ try{ inicioAvatarNoTopo(); climaChip(); if(state.ui && state.ui.tab === 'home') updateDeco('home'); }catch(e){} }});

// ---------- 3. Ordem dos blocos do Início ----------
// Em "Personalizar início" cada bloco ganha uma alça (⠿) para arrastar para cima ou para baixo.
// Os avisos importantes (treino de hoje, recado do treinador, férias, aniversário…) continuam
// fixos no lugar deles. "Voltar ao padrão" desfaz ordem e blocos ocultos.
// Funciona só com CSS "order" (o HTML não muda), então sobrevive a qualquer redesenho.
const INICIO_ORDEM_PADRAO = ['sugestao','calistenia','evento','atividade','semana','indicadores','desafio','plano','treinos','frase','acesso'];
const INICIO_MOVEIS = {
  sugestao:['#home-smart'], calistenia:['#home-cali'], evento:['#home-event'], atividade:['#home-quick'], semana:['.week'],
  indicadores:['#home-metrics'], desafio:['#card-monthly'], plano:['.plan-card'], treinos:['.section-head','#your-list','#home-tr-resumo'],
  frase:['.quote'], acesso:['#card-access-info']
};
// posições originais desses blocos (as mesmas da tela padrão): os fixos ficam entre elas
const INICIO_SLOTS = [11,22,23,30,32,34,40,42,44,60,80];
const IND_PADRAO = INICIO_BLOCOS.filter(b=>b.grupo==='ind').map(b=>b.k);
function inicioOrdem(){
  const o = Array.isArray(state.inicioOrdem) ? state.inicioOrdem.filter(k=>INICIO_MOVEIS[k]) : [];
  INICIO_ORDEM_PADRAO.forEach(k=>{ if(!o.includes(k)) o.push(k); });
  return o;
}
function inicioOrdemInd(){
  const o = Array.isArray(state.inicioOrdemInd) ? state.inicioOrdemInd.filter(k=>IND_PADRAO.includes(k)) : [];
  IND_PADRAO.forEach(k=>{ if(!o.includes(k)) o.push(k); });
  return o;
}
function inicioAplicaOrdem(){
  let st = document.getElementById('inicio-ordem-css');
  if(!st){ st = document.createElement('style'); st.id = 'inicio-ordem-css'; document.head.appendChild(st); }
  const regras = [];
  if(Array.isArray(state.inicioOrdem) && state.inicioOrdem.length){
    inicioOrdem().forEach((k, i)=>{ regras.push(INICIO_MOVEIS[k].map(s=>'#scr-home .wrap > ' + s).join(',') + `{order:${INICIO_SLOTS[i]}!important}`); });
  }
  if(Array.isArray(state.inicioOrdemInd) && state.inicioOrdemInd.length){
    regras.push('#home-metrics > *{order:50}');
    inicioOrdemInd().forEach((k, i)=>{ const b = INICIO_BLOCOS.find(x=>x.k===k); if(b) regras.push(b.sel.filter(s=>s.startsWith('#home-metrics')).join(',') + `{order:${i+1}!important}`); });
  }
  st.textContent = regras.join('\n');
  // indicador que fica sozinho na última linha ocupa a largura toda (agora pela ordem que aparece)
  try{
    const m = $('home-metrics');
    if(m){
      const tiles = [...m.children]; tiles.forEach(t=>t.classList.remove('met-full'));
      const vis = tiles.filter(t=>getComputedStyle(t).display !== 'none').map((t,i)=>({t, o:parseInt(getComputedStyle(t).order,10)||0, i})).sort((a,b)=>(a.o-b.o)||(a.i-b.i)).map(x=>x.t);
      if(vis.length % 2 === 1 && vis.length > 1) vis[vis.length-1].classList.add('met-full');
    }
  }catch(e){}
  try{ mtDeskOrdenaHome(); }catch(e){}
}
mtGancho('aplicaInicio', { depois(){ try{ inicioAplicaOrdem(); }catch(e){ console.log('ordem do início', e); } }});

// janela "Personalizar início": alças de arrastar + "Voltar ao padrão"
function _piSalvaOrdem(lista){
  const ks = [...lista.querySelectorAll('[data-ordem]')].map(r=>r.dataset.ordem);
  if(lista.dataset.grupo === 'ind') state.inicioOrdemInd = ks; else state.inicioOrdem = ks;
  saveData(); aplicaInicio();
}
function _piMover(row, dir){
  const lista = row.parentElement;
  const irmao = dir < 0 ? row.previousElementSibling : row.nextElementSibling;
  if(!irmao || !irmao.dataset.ordem) return false;
  if(dir < 0) lista.insertBefore(row, irmao); else lista.insertBefore(irmao, row);
  try{ navigator.vibrate && navigator.vibrate(8); }catch(e){}
  return true;
}
function _piArrasto(lista){
  lista.querySelectorAll('.pi-alca').forEach(h=>{
    const row = h.closest('[data-ordem]');
    h.addEventListener('click', e=>{ e.preventDefault(); e.stopPropagation(); });
    h.addEventListener('keydown', e=>{
      if(e.key === 'ArrowUp' || e.key === 'ArrowDown'){ e.preventDefault(); if(_piMover(row, e.key==='ArrowUp'?-1:1)){ _piSalvaOrdem(lista); h.focus(); } }
    });
    h.addEventListener('contextmenu', e=>e.preventDefault());
    // Beta 31: a linha acompanha o dedo (transform), as vizinhas deslizam para o lugar,
    // e a janela rola sozinha perto das bordas. Ouvimos a janela inteira porque mover a
    // linha na lista solta a "captura" do dedo.
    h.addEventListener('pointerdown', e=>{
      e.preventDefault();
      const pid = e.pointerId, y0 = e.clientY, sc = lista.closest('.modal') || document.scrollingElement;
      let base = 0, mexeu = false, ultimoY = e.clientY, raf = 0;
      const sc0 = sc.scrollTop;
      row.classList.add('pi-arrastando'); lista.classList.add('pi-lista-arrastando');
      const desenha = ()=>{ raf = 0; row.style.transform = `translateY(${ultimoY - y0 + (sc.scrollTop - sc0) - base}px)`; };
      const desliza = (el, antes)=>{ const d = antes - el.getBoundingClientRect().top; if(!d) return; el.style.transition = 'none'; el.style.transform = `translateY(${d}px)`; requestAnimationFrame(()=>{ el.style.transition = 'transform .16s ease'; el.style.transform = ''; }); };
      const troca = dir=>{
        const viz = dir < 0 ? row.previousElementSibling : row.nextElementSibling; if(!viz || !viz.dataset.ordem) return false;
        const rAntes = row.getBoundingClientRect().top - (parseFloat((row.style.transform.match(/-?[\d.]+/)||[0])[0])||0);
        const vAntes = viz.getBoundingClientRect().top - (parseFloat(((viz.style.transform||'').match(/-?[\d.]+/)||[0])[0])||0);
        _piMover(row, dir);
        const rDepois = row.getBoundingClientRect().top - (parseFloat((row.style.transform.match(/-?[\d.]+/)||[0])[0])||0);
        base += rDepois - rAntes; mexeu = true; desliza(viz, vAntes); return true;
      };
      const mover = ev=>{
        if(ev.pointerId !== pid) return; ev.preventDefault(); ultimoY = ev.clientY;
        // rolagem automática perto das bordas da janela
        const box = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top:0, bottom:innerHeight };
        if(ev.clientY < box.top + 50) sc.scrollTop -= 8; else if(ev.clientY > box.bottom - 50) sc.scrollTop += 8;
        desenha();
        const r = row.getBoundingClientRect(), meio = r.top + r.height/2;
        const prev = row.previousElementSibling, next = row.nextElementSibling;
        if(prev && prev.dataset.ordem){ const p = prev.getBoundingClientRect(); if(meio < p.top + p.height/2){ troca(-1); desenha(); return; } }
        if(next && next.dataset.ordem){ const n = next.getBoundingClientRect(); if(meio > n.top + n.height/2){ troca(1); desenha(); } }
      };
      const fim = ev=>{
        if(ev.pointerId !== pid) return;
        window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', fim); window.removeEventListener('pointercancel', fim);
        if(raf) cancelAnimationFrame(raf);
        row.style.transition = 'transform .16s ease'; row.style.transform = '';
        setTimeout(()=>{ row.style.transition = ''; row.classList.remove('pi-arrastando'); lista.classList.remove('pi-lista-arrastando'); }, 170);
        if(mexeu) _piSalvaOrdem(lista);
      };
      window.addEventListener('pointermove', mover, { passive:false }); window.addEventListener('pointerup', fim); window.addEventListener('pointercancel', fim);
    });
  });
}
const PI_ALCA = '<span class="pi-alca" role="button" tabindex="0" aria-label="Arrastar para mudar a posição (ou use as setas do teclado)"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></span>';
mtGancho('openPersonalizarInicio', { depois(){
  const mi = $('modal-inner'); if(!mi) return;
  const listas = mi.querySelectorAll('.pi-lista'); if(listas.length < 2) return;
  const [princ, ind] = listas;
  // blocos: marca cada linha, inclui "Indicadores" (o bloco inteiro) e põe na ordem salva
  princ.dataset.grupo = 'princ'; ind.dataset.grupo = 'ind';
  princ.querySelectorAll('.pi-row').forEach(r=>{ const k = r.querySelector('.pi-sw') && r.querySelector('.pi-sw').dataset.k; if(INICIO_MOVEIS[k]) r.dataset.ordem = k; });
  if(!princ.querySelector('[data-ordem="indicadores"]')){
    const r = document.createElement('div'); r.className = 'pi-row pi-fixo-sw'; r.dataset.ordem = 'indicadores';
    r.innerHTML = `<span class="pi-txt"><b>Indicadores</b><small>peso, alimentação, água e conquistas (escolha quais logo abaixo)</small></span>`;
    princ.appendChild(r);
  }
  inicioOrdem().forEach(k=>{ const r = princ.querySelector(`[data-ordem="${k}"]`); if(r) princ.appendChild(r); });
  // linhas que não se movem (ex.: Ajuda, que saiu na Beta 25) ficam no fim
  [...princ.querySelectorAll('.pi-row:not([data-ordem])')].forEach(r=>princ.appendChild(r));
  ind.querySelectorAll('.pi-row').forEach(r=>{ const k = r.querySelector('.pi-sw') && r.querySelector('.pi-sw').dataset.k; if(IND_PADRAO.includes(k)) r.dataset.ordem = k; });
  inicioOrdemInd().forEach(k=>{ const r = ind.querySelector(`[data-ordem="${k}"]`); if(r) ind.appendChild(r); });
  [princ, ind].forEach(l=>{ l.querySelectorAll('[data-ordem]').forEach(r=>{ if(!r.querySelector('.pi-alca')) r.insertAdjacentHTML('afterbegin', PI_ALCA); }); _piArrasto(l); });
  // dica + voltar ao padrão
  const sub = mi.querySelector('.arq-sub');
  if(sub && !mi.querySelector('.pi-dica-ordem')) sub.insertAdjacentHTML('beforebegin', '<div class="pi-dica-ordem">Arraste pela alça <b>⠿</b> para mudar a ordem. Os avisos importantes e o treino de hoje ficam sempre no lugar.</div>');
  if(!mi.querySelector('#pi-padrao')){
    const b = document.createElement('button'); b.id = 'pi-padrao'; b.type = 'button'; b.className = 'btn btn-ghost btn-block'; b.style.marginTop = '12px';
    b.textContent = 'Voltar ao padrão'; b.onclick = inicioVoltarPadrao;
    ind.after(b);
  }
}});
function inicioVoltarPadrao(){
  appConfirm('A tela inicial volta para a ordem original, com todos os blocos visíveis.', ()=>{
    state.inicioOrdem = null; state.inicioOrdemInd = null; state.inicioOcultos = [];
    saveData(); aplicaInicio(); openPersonalizarInicio(); toast('Tela inicial no padrão');
  }, { title:'Voltar ao padrão?', okLabel:'Voltar ao padrão' });
}

Object.assign(window, { cenaInicio, climaChip, inicioOrdem, inicioOrdemInd, inicioAplicaOrdem, inicioVoltarPadrao });

// =====================================================================
// 44. Beta 30 — Modo computador de verdade
// =====================================================================
// Só vale com html.mt-desk (tela larga + mouse, parte 16). O celular não muda nada.
//
// Antes: o app do celular espalhado em duas colunas de jornal.
// Agora cada tela tem um layout de computador:
//   · Início: painel com números da semana no topo, coluna principal (treino de hoje, atividade,
//     semana, seus treinos) e coluna lateral (sugestão, indicadores, desafios, plano, frase).
//   · Treinos: o treino aberto ocupa a coluna principal; programação e ajuda ao lado.
//   · Progresso: gráficos de evolução largos; calendário e recordes ao lado.
//   · Histórico: lista em linhas (como uma tabela); números, gráfico e arquivo ao lado.
//   · Janelas abrem como painel lateral à direita (a tela de trás continua visível).
//   · Atalhos: teclas 1 a 5 trocam de aba, Esc fecha a janela.
//
// Como funciona: nenhum bloco muda de lugar no HTML (as funções que procuram os blocos continuam
// achando). Cada bloco ganha um papel (topo / principal / lateral) e a tela vira uma grade de
// duas colunas. A altura de cada bloco é medida e vira "linhas" da grade, o que deixa as duas
// colunas independentes (sem buracos) e respeita a ordem do Personalizar início.

const DK_LAYOUT = {
  'scr-home': {
    topo: ['#home-brand-row', '#home-hero', '#home-greet-row', '#desk-kpis'],
    lado: ['#home-smart', '#home-metrics', '#card-monthly', '#home-event', '.plan-card', '#home-cali', '.quote', '#home-trofeus', '.note', '#card-access-info',
           '#card-weekrecap', '#card-weight-reminder', '#card-install', '#card-coach-msg'],
    fim: ['#home-personalizar']
  },
  'scr-sessions': {
    topo: ['.brand', '.row', '#sess-qlinks', '#sessions-chips'],
    lado: ['.card-alert', '#sess-prestart', '.help']
  },
  'scr-perf': {
    topo: ['.seg-nav', ':scope > div:not([id]):not([class])', '#perf-empty'],
    lado: ['.cal-card', '#card-records', '.chart-card:not(#perf-evo):not(#perf-run-card)']
  },
  'scr-history': {
    topo: ['.seg-nav', '.brand', '#hist-title'],
    lado: ['.stat-grid', ':scope > .btn', '#hist-evo', '#hist-arq']
  }
};
const DK_PASSO = 4;      // altura de cada "linha" da grade, em px
const DK_VAO = 18;       // espaço entre blocos
const _dkObs = new Map();
function dkAtivo(){ return document.documentElement.classList.contains('mt-desk'); }
function _dkPapel(el, cfg){
  const m = sel=>{ try{ return sel.startsWith(':scope') ? el.matches(sel.replace(':scope > ', '')) && el.parentElement && [...el.parentElement.querySelectorAll(sel)].includes(el) : el.matches(sel); }catch(e){ return false; } };
  if((cfg.topo||[]).some(m)) return 'topo';
  if((cfg.fim||[]).some(m)) return 'fim';
  if((cfg.lado||[]).some(m)) return 'lado';
  return 'principal';
}
function _dkMede(el){
  if(!el.isConnected) return;
  const st = getComputedStyle(el);
  if(st.display === 'none'){ el.style.gridRowEnd = ''; return; }
  const h = el.getBoundingClientRect().height;
  el.style.gridRowEnd = 'span ' + Math.max(1, Math.ceil((h + DK_VAO) / DK_PASSO));
}
function dkMontar(id){
  const cfg = DK_LAYOUT[id]; const scr = document.getElementById(id); if(!cfg || !scr) return;
  const wrap = scr.querySelector('.wrap'); if(!wrap) return;
  let ro = _dkObs.get(id);
  if(!dkAtivo()){
    if(wrap.classList.contains('dk-grade')){
      wrap.classList.remove('dk-grade');
      [...wrap.children].forEach(c=>{ c.removeAttribute('data-dk'); c.style.gridRowEnd = ''; });
      if(ro){ ro.disconnect(); _dkObs.delete(id); }
    }
    return;
  }
  wrap.classList.add('dk-grade');
  if(!ro){ ro = new ResizeObserver(ents=>ents.forEach(e=>_dkMede(e.target))); _dkObs.set(id, ro); }
  [...wrap.children].forEach(c=>{
    const papel = _dkPapel(c, cfg);
    if(c.dataset.dk !== papel) c.dataset.dk = papel;
    if(!c.__dkObs){ ro.observe(c); c.__dkObs = true; }
    _dkMede(c);
  });
}
function dkMontarTudo(){ Object.keys(DK_LAYOUT).forEach(id=>{ try{ dkMontar(id); }catch(e){ console.log('modo computador', id, e); } }); }

// ---------- Início: faixa de números da semana (só no computador) ----------
function dkKpis(){
  const wrap = document.querySelector('#scr-home .wrap'); if(!wrap) return;
  let el = $('desk-kpis');
  if(!dkAtivo()){ if(el) el.remove(); return; }
  const mod = state.modules && state.modules[state.active]; if(!mod || !mod.plan){ if(el) el.remove(); return; }
  if(!el){ el = document.createElement('div'); el.id = 'desk-kpis'; const g = $('home-greet-row'); if(g) g.after(el); else wrap.prepend(el); }
  const ws = weekStats();
  const meta = (mod.plan.workouts||[]).length || 0;
  const lift = state.active === 'lift';
  const feitos = lift ? ws.lift : (ws.runs + ws.walks + ws.bikes);
  let seq = 0; try{ seq = calcStreak(mtAllHist()); }catch(e){}
  const seg = new Date(); seg.setHours(0,0,0,0); seg.setDate(seg.getDate() - (getDayIdx()-1));
  let vol = 0; try{ vol = Math.round(calcVolumeBetween(seg.getTime(), Date.now()+1)); }catch(e){}
  const km = (ws.kmRun||0) + (ws.kmWalk||0) + (ws.kmBike||0);
  const dur = ws.totalMin >= 60 ? `${Math.floor(ws.totalMin/60)}h${String(ws.totalMin%60).padStart(2,'0')}` : `${ws.totalMin}<small>min</small>`;
  const tiles = [
    { l: lift ? 'Treinos na semana' : 'Atividades na semana', v: `${feitos}<small>/${meta}</small>`, s: meta ? `${Math.min(100, Math.round(feitos/meta*100))}% da meta` : '', go:"goTab('perf')", bar: meta ? Math.min(1, feitos/meta) : 0 },
    { l:'Sequência', v:`${seq}<small>${seq===1?'dia':'dias'}</small>`, s:'dias seguidos com atividade', go:"goTab('perf')" },
    { l:'Tempo na semana', v: dur, s:`${ws.total} ${ws.total===1?'registro':'registros'} desde segunda`, go:"goTab('history')" },
    lift ? { l:'Volume na semana', v: vol >= 1000 ? `${(vol/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})}<small>t</small>` : `${vol}<small>kg</small>`, s:'peso × repetições registradas', go:"goTab('history')" }
         : { l:'Distância na semana', v:`${km.toLocaleString('pt-BR',{maximumFractionDigits:1})}<small>km</small>`, s:'corrida, caminhada e bike', go:"goTab('history')" },
    { l:'Conquistas', v:`${(state.trophies||[]).length}<small>/${TROPHIES.length}</small>`, s:'medalhas e selos', go:'openTrophies()' }
  ];
  el.innerHTML = tiles.map(t=>`<button type="button" class="dk-kpi" onclick="${t.go}"><span class="dk-kpi-l">${t.l}</span><span class="dk-kpi-v">${t.v}</span>${t.bar!=null && t.bar!==undefined && t.l.includes('semana') && t.s.includes('meta') ? `<span class="dk-kpi-bar"><i style="width:${Math.round(t.bar*100)}%"></i></span>` : ''}<span class="dk-kpi-s">${t.s}</span></button>`).join('');
}

// ---------- Menu lateral: aluno e atalhos ----------
function dkMenu(){
  const tb = $('tabbar'); if(!tb) return;
  let u = $('desk-user');
  if(!dkAtivo()){ if(u) u.remove(); return; }
  if(!u){ u = document.createElement('div'); u.id = 'desk-user'; tb.appendChild(u); }
  const nome = (typeof firstName==='function' ? firstName() : '') || '';
  u.innerHTML = `<button type="button" class="dk-user-btn" onclick="goTab('profile')"><span class="avatar" id="desk-avatar"></span><span><b>${mtEsc(nome)}</b><small>Ver perfil</small></span></button>
    <div class="dk-atalhos">Atalhos: <kbd>1</kbd>–<kbd>5</kbd> abas · <kbd>Esc</kbd> fecha</div>`;
  try{ renderAvatar('desk-avatar'); }catch(e){}
  [...tb.querySelectorAll('.tab')].forEach((t,i)=>{ if(i < 5 && !t.title) t.title = `Atalho: tecla ${i+1}`; });
}

// ---------- Janelas como painel lateral ----------
// Confirmações, medalhas e o vídeo do exercício continuam no centro.
function dkPainel(){
  const back = $('modal-back'); if(!back) return;
  const confirma = !!document.getElementById('appconfirm-ok');
  const painel = dkAtivo() && back.classList.contains('on') && !confirma && !back.classList.contains('award-dark') && !back.classList.contains('ex-open') && !back.classList.contains('video-open');
  back.classList.toggle('dk-painel', !!painel);
}
try{ new MutationObserver(dkPainel).observe(document.getElementById('modal-back'), { attributes:true, attributeFilter:['class'] });
  new MutationObserver(dkPainel).observe(document.getElementById('modal-inner'), { childList:true }); }catch(e){}

// ---------- Atalhos de teclado ----------
document.addEventListener('keydown', e=>{
  if(!dkAtivo() || e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target; if(t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  const back = $('modal-back');
  if(e.key === 'Escape'){ if(back && back.classList.contains('on')){ e.preventDefault(); closeModal(); } return; }
  if(back && back.classList.contains('on')) return;
  const n = parseInt(e.key, 10);
  if(n >= 1 && n <= 5){ const tabs = [...document.querySelectorAll('#tabbar .tab')]; const b = tabs[n-1]; if(b){ e.preventDefault(); b.click(); } }
});

// ---------- quando montar ----------
['renderHome','renderSessions','renderPerf','renderHistory'].forEach(f=>mtGancho(f, { depois(){
  try{ if(f === 'renderHome'){ dkKpis(); dkMenu(); } dkMontarTudo(); }catch(e){ console.log('modo computador', e); }
}}));
mtGancho('goTab', { depois(){ try{ dkMontarTudo(); }catch(e){} }});
const _mtDeskAplicaB30 = window.mtDeskAplica;
window.mtDeskAplica = function(){
  const r = _mtDeskAplicaB30.apply(this, arguments);
  try{ dkKpis(); dkMenu(); dkMontarTudo(); dkPainel(); }catch(e){}
  return r;
};
try{ const mq = window.matchMedia(MT_DESK_MQ); if(mq.addEventListener) mq.addEventListener('change', ()=>window.mtDeskAplica()); }catch(e){}

Object.assign(window, { dkMontar, dkMontarTudo, dkKpis, dkMenu, dkPainel });
// =====================================================================
// 44. Beta 33 — Auditoria geral: correção única das fichas já salvas
// =====================================================================
// O gerador de musculação (buildLiftExercises, app.js) passou a escolher por PAPEL de movimento
// (o principal do grupo primeiro), com descanso por tipo de exercício e teto de séries por sessão.
// Os planos criados antes disso podem ter, por exemplo, o peito começando por crossover, dois
// encolhimentos no mesmo treino ou mais de 30 séries numa sessão. Esta etapa confere UMA vez os
// planos salvos e só refaz quando há problema. Os exercícios principais que o aluno já usava
// (e a carga que ele vem evoluindo) continuam; as trocas feitas à mão também (applyPins).
// O histórico e os recordes não mudam: eles são guardados por exercício.
function b33FichaComProblema(w, level){
  const exs = (w && w.exercises) || []; if(!exs.length) return false;
  const porGrupo = {};
  exs.forEach(e=>{ (porGrupo[e.part] = porGrupo[e.part] || []).push(e); });
  const ruimGrupo = Object.keys(porGrupo).some(g=>{
    const lista = porGrupo[g];
    if(LIFT_GRANDES.includes(g) && lista[0] && !lista[0].pinned && exPapel(lista[0], g).tier !== 'principal') return true;
    if(lista.filter(e=>/encolhimento/i.test(e.name)).length > 1) return true;
    return false;
  });
  const series = exs.reduce((a,e)=>a+(+e.sets||0), 0);
  return ruimGrupo || series > (LIFT_TETO_SERIES[level] || 26) + 4;
}
function b33CorrigeFichas(){
  try{
    const mod = state.modules && state.modules.lift;
    if(!mod || !mod.plan || !mod.setup || state.b33Fichas || !Array.isArray(mod.plan.workouts)) return;
    const normais = mod.plan.workouts.filter(w=>w && !w.cali);
    const ruins = normais.filter(w=>b33FichaComProblema(w, mod.setup.level));
    state.b33Fichas = true;
    if(!ruins.length){ saveData(); return; }
    // principais bons de cada treino: continuam como o 1º do grupo (a carga segue evoluindo no mesmo exercício)
    const lideres = mod.plan.workouts.map(w=>{ const L = {}; ((w && w.exercises) || []).forEach(e=>{ if(!L[e.part] && exPapel(e, e.part).tier === 'principal') L[e.part] = e; }); return L; });
    regenLiftExercises();
    mod.plan.workouts.forEach((w, wi)=>{
      if(!w || w.cali) return;
      const L = lideres[wi] || {}, exs = w.exercises || [];
      Object.keys(L).forEach(part=>{
        const lead = L[part]; const idxs = exs.map((e,i)=>e.part===part ? i : -1).filter(i=>i>=0); if(!idxs.length) return;
        const first = idxs[0]; if(exs[first].pinned || exs[first].id === lead.id) return;
        const onde = exs.findIndex(e=>e.id === lead.id);
        if(onde >= 0){ const t = exs[onde]; exs[onde] = exs[first]; exs[first] = t; }
        else exs[first] = Object.assign({}, lead, { sets: exs[first].sets, rest: exs[first].rest, reps: exs[first].reps });
      });
      w.duration = estimateLiftDuration(exs, mod.setup.goal);
    });
    saveData();
    setTimeout(()=>toast(`Revisei a montagem dos seus treinos: cada grupo começa pelo exercício principal, o descanso agora varia por exercício e o volume ficou equilibrado. Seus principais foram mantidos.`, 6500), 2200);
  }catch(e){ console.log('correção das fichas (Beta 33)', e); }
}
mtGancho('renderHome', { depois(){ b33CorrigeFichas(); }});

Object.assign(window, { b33CorrigeFichas, b33FichaComProblema, restAjusta, restPausa, setRestVibrar, treinoAtivoIniciar, treinoAtivoEncerrar, telaLigadaPedir, telaLigadaSoltar });
// =====================================================================
// 45. Beta 34 — Sincronização entre aparelhos, vídeos e créditos de parceiros
// =====================================================================

// ---------- 1. Arquivo anual dos documentos antigos da mesma pessoa ----------
// Na unificação da conta (resolveContaUnica, app.js), o histórico RECENTE dos outros documentos já é
// juntado no carregamento. O histórico com mais de 90 dias fica no arquivo anual (usuarios/{uid}/arquivo):
// aqui ele é copiado, uma vez, para o arquivo do documento principal. Nada é apagado dos antigos.
async function syncJuntarArquivosAntigos(){
  const antigos = (window.__uidsAntigos || []).filter(u=>u && u !== uidDados());
  if(!antigos.length || !fbUser) return;
  window.__uidsAntigos = [];
  let n = 0;
  for(const velho of antigos){
    try{
      const snap = await _comPrazo(db.collection('usuarios').doc(velho).collection('arquivo').get(), 20000);
      const destino = db.collection('usuarios').doc(uidDados()).collection('arquivo');
      const escritas = [];
      snap.forEach(d=>{ if(/^\d{4}-[12]$/.test(d.id)){ escritas.push(destino.doc(d.id).set(d.data(), { merge:true })); n++; } });   // merge: registros com a mesma chave não duplicam
      await Promise.all(escritas);
      if(escritas.length){ const info = _arqInfo(); snap.forEach(d=>{ if(/^\d{4}-[12]$/.test(d.id)) info.docs = [...new Set([...(info.docs||[]), d.id])].sort(); }); _arqMem = null; saveData(); }
    }catch(e){ console.log('arquivo do outro login:', e); window.__uidsAntigos = (window.__uidsAntigos||[]).concat([velho]); }
  }
  if(n) toast('🔄 Histórico antigo dos seus outros logins reunido nesta conta.');
}
mtGancho('renderHome', { depois(){ if((window.__uidsAntigos||[]).length && !window.__arqJuntando){ window.__arqJuntando = true; setTimeout(()=>{ syncJuntarArquivosAntigos().finally(()=>{ window.__arqJuntando = false; }); }, 5000); } }});

// ---------- 2. Diagnóstico da sincronização (Perfil → Conta e dados) ----------
function _syncQuando(t){ if(!t) return 'nunca'; const d = Date.now() - t; if(d < 60000) return 'agora há pouco'; if(d < 3600000) return `há ${Math.round(d/60000)} min`; return new Date(t).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); }
function openSincronizacao(){
  if(!fbUser || !state.user) return;
  const ack = +mtLS('mt_nuvem_ok_' + uidDados()) || 0;
  const provedores = ((fbUser.providerData || []).map(p=>p && p.providerId) || []).map(p=>p==='google.com' ? 'Google' : p==='password' ? 'e-mail e senha' : p).filter(Boolean);
  const unificado = uidDados() !== fbUser.uid;
  const nL = (((state.modules||{}).lift||{}).history||[]).length, nR = (((state.modules||{}).run||{}).history||[]).length;
  const pend = (+state._savedAt||0) > ack;
  const linha = (k, v)=>`<div class="mrow"><span>${k}</span><b style="text-align:right">${v}</b></div>`;
  $('modal-inner').innerHTML = `<h3>🔄 Sincronização</h3>
    <p class="mt-muted" style="margin:0 0 10px">Seus treinos, perfil, conquistas e progresso ficam na sua conta na nuvem. Qualquer aparelho em que você entrar com este e-mail mostra os mesmos dados.</p>
    <div class="card" style="padding:6px 14px">
      ${linha('Conta', mtEsc(state.user.email || fbUser.email || '—'))}
      ${linha('Entrou com', mtEsc(provedores.join(' + ') || '—'))}
      ${linha('Documento de dados', `${mtEsc(String(uidDados()).slice(0,8))}…${unificado ? ' · unificado' : ''}`)}
      ${linha('Internet', navigator.onLine === false ? '📴 sem conexão' : '✅ conectado')}
      ${linha('Última gravação confirmada', _syncQuando(ack))}
      ${linha('Alterações aguardando envio', pend ? 'sim — serão enviadas assim que possível' : 'nenhuma')}
      ${linha('Registros no aparelho', `${nL} musculação · ${nR} corrida/bike/caminhada`)}
    </div>
    ${unificado ? `<div class="note note-info" style="margin-top:10px"><div class="note-line" style="font-size:12.5px">Você já entrou de mais de uma forma (Google e e-mail/senha). Os dados foram reunidos num único documento, usado em todos os aparelhos.</div></div>` : ''}
    <p class="mt-muted" style="font-size:12px;margin:10px 0 0">O Histórico mostra uma modalidade por vez (musculação ou corrida): troque no seletor do topo para ver a outra. Registros com mais de 90 dias ficam em Histórico → Histórico completo.</p>
    <button class="btn btn-primary btn-block" id="sync-agora" style="margin-top:12px" onclick="syncAgora()">Sincronizar agora</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
// envia o que falta e busca a versão da nuvem, juntando as duas (nada é apagado)
async function syncAgora(){
  const b = $('sync-agora'); if(b){ b.disabled = true; b.textContent = 'Sincronizando…'; }
  try{
    if(navigator.onLine === false){ toast('📴 Sem internet agora. Tudo fica guardado e sincroniza quando a conexão voltar.'); return; }
    const doc = await _comPrazo(db.collection('usuarios').doc(uidDados()).get({ source:'server' }), 15000);
    const remoto = doc.exists && doc.data().estadoApp;
    let novos = 0;
    if(remoto){
      if((+remoto._savedAt||0) > (+state._savedAt||0)){
        const base = JSON.parse(JSON.stringify(remoto)); novos = mesclaEstado(base, state).daOutra;
        state = Object.assign({}, state, base, { ui: state.ui, user: Object.assign({}, base.user||{}, { email: state.user.email, isAdmin: state.user.isAdmin }) });
      } else novos = mesclaEstado(state, remoto).daOutra;
    }
    try{ ensureStats(); }catch(e){}
    _assinaturaNuvem = ''; state._savedAt = Date.now(); saveData(); syncToCloud();
    toast('✅ Sincronizado com a nuvem.');
    closeModal(); goTab(state.ui.tab || 'home');
  }catch(e){ console.log('sincronizar agora:', e); toast('⚠️ A nuvem não respondeu. Tente de novo em instantes.'); }
  finally{ const b2 = $('sync-agora'); if(b2){ b2.disabled = false; b2.textContent = 'Sincronizar agora'; } }
}
// a internet voltou: envia o que ficou pendente (o Firestore também reenvia sozinho; isto cobre o
// caso em que o app foi aberto offline e nada foi gravado na nuvem ainda)
window.addEventListener('online', ()=>{ setTimeout(()=>{ try{ if(fbUser && state && state.user && !state.user.blocked){ _assinaturaNuvem = ''; syncToCloud(); ouveNuvem(); } }catch(e){} }, 2500); });
mtGancho('renderProfile', { depois(){ try{ const el = $('pf-sync-val'); if(el){ const ack = +mtLS('mt_nuvem_ok_' + uidDados()) || 0; el.textContent = navigator.onLine === false ? 'sem internet ›' : (ack ? 'sincronizado ' + _syncQuando(ack) + ' ›' : 'ver status ›'); } }catch(e){} }});

// ---------- 3. Parceiros e créditos dos vídeos (administradores) ----------
// parceiros/{id}: cadastro completo (inclui contato privado) — só administradores leem e gravam.
// videosExercicios/{exercicio}.creditos: o que os alunos veem — só os campos que o admin marcou para
// cada lugar (ficha do exercício e Biblioteca). Editar créditos nunca mexe no link do vídeo.
const PC_CAMPOS = [ ['empresa','Empresa ou marca'], ['instagram','Instagram'], ['contato','WhatsApp / telefone'], ['site','Site ou link'], ['texto','Texto do crédito'] ];
let _pcLista = [];
function _pcVideos(){
  const out = [];
  try{ Object.keys(MOB).forEach(k=>{ const id = 'mob-'+k; if(videoLinks[id]) out.push({ id, nome: MOB[k].nome }); }); }catch(e){}
  EX_BANK.forEach(c=>c.items.forEach(ex=>{ const id = slug(ex.name); if(videoLinks[id]) out.push({ id, nome: ex.name, grupo: c.name }); }));
  return out;
}
function _pcNormaliza(d){
  const ig = String(d.instagram||'').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/[/?#].*$/,'').replace(/^@/,'');
  const fone = String(d.whatsapp||'').replace(/\D/g,'');
  return { nome: String(d.nome||'').trim().replace(/\s+/g,' ').slice(0,80), empresa: String(d.empresa||'').trim().slice(0,80), instagram: ig.slice(0,40),
    whatsapp: fone.slice(0,15), site: String(d.site||'').trim().slice(0,200), texto: String(d.texto||'').trim().slice(0,160) };
}
// o que vai para o documento do vídeo (público para os alunos)
function pcProjecao(id, p){
  const vis = p.mostrar || {};
  const lugar = onde=>{
    if(!(p.onde||{})[onde]) return null;
    const o = {};
    if((vis.empresa||{})[onde] && p.empresa) o.empresa = p.empresa;
    if((vis.instagram||{})[onde] && p.instagram) o.instagram = p.instagram;
    if((vis.contato||{})[onde] && p.whatsapp) o.contato = p.whatsapp;
    if((vis.site||{})[onde] && /^https?:\/\//i.test(p.site||'')) o.site = p.site;
    if((vis.texto||{})[onde] && p.texto) o.texto = p.texto;
    return o;
  };
  return { parceiroId:id, nome:p.nome, ficha: lugar('ficha'), biblioteca: lugar('biblioteca'), atualizadoEm: Date.now() };
}
async function openParceiros(){
  if(!mtAdmin()){ toast('🔒 Recurso restrito a administradores.'); return; }
  $('modal-inner').innerHTML = `<h3>🤝 Parceiros e créditos</h3><p class="mt-muted">Carregando…</p>`; $('modal-back').classList.add('on');
  try{
    await loadVideoLinks();
    const snap = await _comPrazo(db.collection('parceiros').get(), 12000);
    _pcLista = []; snap.forEach(d=>_pcLista.push(Object.assign({ id:d.id }, d.data())));
    _pcLista.sort((a,b)=>String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
  }catch(e){ console.log('parceiros:', e); $('modal-inner').innerHTML = `<h3>🤝 Parceiros e créditos</h3><p class="mt-muted">Não foi possível carregar. Confira a internet e se as regras do Firestore da Beta 34 foram publicadas (coleção "parceiros").</p><button class="btn btn-ghost btn-block" onclick="openVideoAdmin()">Voltar</button>`; return; }
  const conta = id=>Object.values(videoCreditos).filter(c=>c && c.parceiroId===id).length;
  $('modal-inner').innerHTML = `<h3>🤝 Parceiros e créditos</h3>
    <p class="mt-muted" style="margin:0 0 10px">Cadastre uma vez quem gravou ou cedeu os vídeos e escolha em quais vídeos o crédito aparece. Os contatos só aparecem para os alunos se você marcar.</p>
    ${_pcLista.length ? _pcLista.map(p=>`<div class="list-row" onclick="openParceiroForm('${mtJsStr(p.id)}')"><span style="flex:1;min-width:0"><b>${mtEsc(p.nome)}</b>${p.empresa?` <span class="mt-muted">· ${mtEsc(p.empresa)}</span>`:''}</span><span style="color:var(--text-mute);font-size:12px">${conta(p.id)} vídeo${conta(p.id)===1?'':'s'} ›</span></div>`).join('') : '<p class="mt-muted">Nenhum parceiro cadastrado ainda.</p>'}
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="openParceiroForm(null)">➕ Novo parceiro</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openVideoAdmin()">Voltar aos vídeos</button>`;
}
function openParceiroForm(id){
  if(!mtAdmin()) return;
  const p = (id && _pcLista.find(x=>x.id===id)) || { nome:'', onde:{ ficha:true, biblioteca:false }, mostrar:{ empresa:{ficha:true,biblioteca:false}, instagram:{ficha:true,biblioteca:false}, contato:{ficha:false,biblioteca:false}, site:{ficha:true,biblioteca:false}, texto:{ficha:true,biblioteca:false} } };
  const vis = p.mostrar || {}; const onde = p.onde || {};
  const inp = (k, ph, extra)=>`<input class="input" id="pc-${k}" placeholder="${ph}" value="${mtEsc(p[k]||'')}" style="margin-top:8px" ${extra||''}>`;
  const marc = (k, o)=>`<input type="checkbox" id="pc-v-${k}-${o}" ${((vis[k]||{})[o])?'checked':''} aria-label="${k} na ${o}">`;
  const vids = _pcVideos();
  window.__pcId = id;
  $('modal-inner').innerHTML = `<h3>${id ? 'Editar parceiro' : 'Novo parceiro'}</h3>
    <div style="max-height:66vh;overflow-y:auto;padding-right:2px">
      <div class="section-lbl" style="margin:4px 0 0">Dados</div>
      ${inp('nome','Nome do profissional ou criador *')}
      ${inp('empresa','Empresa ou marca (opcional)')}
      ${inp('instagram','Instagram, ex.: @joaosilva (opcional)')}
      ${inp('whatsapp','WhatsApp ou telefone com DDD (opcional)', 'inputmode="tel"')}
      ${inp('site','Site ou outro link, com https:// (opcional)', 'inputmode="url"')}
      ${inp('texto','Texto do crédito, ex.: Personal trainer, CREF 000000 (opcional)')}
      <div class="section-lbl" style="margin:16px 0 6px">O que os alunos veem</div>
      <div class="pc-grade">
        <span></span><span class="h">Ficha</span><span class="h">Biblioteca</span>
        <span><b>Mostrar créditos</b> (nome)</span><input type="checkbox" id="pc-o-ficha" ${onde.ficha?'checked':''} aria-label="Créditos na ficha"><input type="checkbox" id="pc-o-biblioteca" ${onde.biblioteca?'checked':''} aria-label="Créditos na Biblioteca">
        ${PC_CAMPOS.map(([k,l])=>`<span>${l}</span>${marc(k,'ficha')}${marc(k,'biblioteca')}`).join('')}
      </div>
      <p class="mt-muted" style="font-size:11.5px;margin:6px 0 0">Campos vazios nunca aparecem. O WhatsApp só fica visível para os alunos se você marcar. Na Biblioteca aparece uma linha curta (nome, empresa e Instagram).</p>
      <div class="section-lbl" style="margin:16px 0 6px">Vídeos com este crédito · ${vids.length} vídeos cadastrados</div>
      <input class="input" id="pc-busca" placeholder="Filtrar vídeos…" oninput="pcFiltrar(this.value)">
      <div id="pc-vids" style="margin-top:6px">${vids.map(v=>{ const c = videoCreditos[v.id]; const outro = c && c.parceiroId && c.parceiroId !== id; return `<label class="pc-vid" data-n="${mtEsc(mtNorm(v.nome+' '+(v.grupo||'')))}"><input type="checkbox" class="pc-vchk" value="${mtEsc(v.id)}" ${c && id && c.parceiroId===id ? 'checked':''}><span style="flex:1">${mtEsc(v.nome)}${v.grupo?` <span class="mt-muted">· ${mtEsc(v.grupo)}</span>`:''}</span>${outro?`<span class="mt-muted" style="font-size:11px">de ${mtEsc(c.nome)}</span>`:''}</label>`; }).join('') || '<p class="mt-muted">Nenhum exercício tem vídeo cadastrado ainda.</p>'}</div>
    </div>
    <button class="btn btn-primary btn-block" id="pc-salvar" style="margin-top:12px" onclick="salvarParceiro()">💾 Salvar</button>
    ${id ? `<button class="btn btn-ghost btn-block hl-danger" style="margin-top:8px" onclick="excluirParceiro('${mtJsStr(id)}')">🗑️ Excluir parceiro e tirar os créditos</button>` : ''}
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openParceiros()">Voltar</button>`;
}
function pcFiltrar(q){ const n = mtNorm(q||''); document.querySelectorAll('#pc-vids .pc-vid').forEach(el=>{ el.style.display = !n || (el.dataset.n||'').includes(n) ? '' : 'none'; }); }
async function salvarParceiro(){
  if(!mtAdmin()) return;
  const id0 = window.__pcId;
  const d = _pcNormaliza({ nome:$('pc-nome').value, empresa:$('pc-empresa').value, instagram:$('pc-instagram').value, whatsapp:$('pc-whatsapp').value, site:$('pc-site').value, texto:$('pc-texto').value });
  if(d.nome.length < 2){ toast('⚠️ Informe o nome do profissional ou criador'); return; }
  if(d.site && !/^https?:\/\//i.test(d.site)){ toast('⚠️ O site precisa começar com http:// ou https://'); return; }
  if(d.whatsapp && d.whatsapp.length < 10){ toast('⚠️ Telefone incompleto: use DDD + número'); return; }
  if(d.instagram && !/^[A-Za-z0-9._]{1,30}$/.test(d.instagram)){ toast('⚠️ Instagram inválido: use só o @usuário'); return; }
  const p = Object.assign({}, d, {
    onde: { ficha: !!$('pc-o-ficha').checked, biblioteca: !!$('pc-o-biblioteca').checked },
    mostrar: Object.fromEntries(PC_CAMPOS.map(([k])=>[k, { ficha: !!$(`pc-v-${k}-ficha`).checked, biblioteca: !!$(`pc-v-${k}-biblioteca`).checked }])),
    atualizadoEm: Date.now(), atualizadoPor: (state.user && state.user.email) || ''
  });
  const marcados = new Set([...document.querySelectorAll('#pc-vids .pc-vchk:checked')].map(i=>i.value));
  await mtComBotao('pc-salvar', 'Salvando…', async ()=>{
    try{
      const ref = id0 ? db.collection('parceiros').doc(id0) : db.collection('parceiros').doc();
      const id = ref.id;
      const batch = db.batch();
      batch.set(ref, p);
      const proj = pcProjecao(id, p);
      const del = firebase.firestore.FieldValue.delete();
      Object.keys(videoLinks).forEach(vid=>{
        const atual = videoCreditos[vid];
        if(marcados.has(vid)) batch.set(db.collection('videosExercicios').doc(vid), { creditos: proj }, { merge:true });
        else if(atual && atual.parceiroId === id) batch.set(db.collection('videosExercicios').doc(vid), { creditos: del }, { merge:true });
      });
      await _comPrazo(batch.commit(), 20000);
      Object.keys(videoLinks).forEach(vid=>{ if(marcados.has(vid)) videoCreditos[vid] = proj; else if(videoCreditos[vid] && videoCreditos[vid].parceiroId === id) delete videoCreditos[vid]; });
      mtLS('metatreino_video_creditos', JSON.stringify(videoCreditos));
      toast(`✅ Créditos salvos em ${marcados.size} vídeo${marcados.size===1?'':'s'}`);
      openParceiros();
    }catch(e){ console.log('salvar parceiro:', e); toast('⚠️ Não foi possível salvar. Confira a internet e as regras do Firestore (Beta 34).'); }
  });
}
function excluirParceiro(id){
  if(!mtAdmin()) return;
  appConfirm('O cadastro sai e os créditos dele somem dos vídeos. Os vídeos e os links continuam.', async ()=>{
    try{
      const batch = db.batch(); const del = firebase.firestore.FieldValue.delete();
      Object.keys(videoCreditos).forEach(vid=>{ if(videoCreditos[vid] && videoCreditos[vid].parceiroId === id) batch.set(db.collection('videosExercicios').doc(vid), { creditos: del }, { merge:true }); });
      batch.delete(db.collection('parceiros').doc(id));
      await _comPrazo(batch.commit(), 20000);
      Object.keys(videoCreditos).forEach(vid=>{ if(videoCreditos[vid] && videoCreditos[vid].parceiroId === id) delete videoCreditos[vid]; });
      mtLS('metatreino_video_creditos', JSON.stringify(videoCreditos));
      toast('🗑️ Parceiro excluído'); openParceiros();
    }catch(e){ console.log('excluir parceiro:', e); toast('⚠️ Não foi possível excluir agora.'); }
  }, { title:'Excluir parceiro?', emo:'🗑️', okLabel:'Sim, excluir', danger:true });
}
// atalho no painel de vídeos
mtGancho('openVideoAdmin', { depois(){
  try{
    const mi = $('modal-inner'); if(!mi || mi.querySelector('#pc-atalho')) return;
    const h = mi.querySelector('h3'); if(!h) return;
    h.insertAdjacentHTML('afterend', `<button class="btn btn-outline btn-block" id="pc-atalho" style="margin:6px 0 4px" onclick="openParceiros()">🤝 Parceiros e créditos dos vídeos</button>`);
  }catch(e){}
}});

// ---------- 4. Descanso por exercício e intensidade nos planos já salvos (uma vez) ----------
// A regra nova (liftDescanso, app.js) olha o tipo do exercício e a faixa de repetições; os planos salvos
// recebem o descanso novo uma vez. Exercícios, séries e repetições não mudam. Calistenia tem regra própria.
function b34AtualizaDescansos(){
  try{
    const mod = state.modules && state.modules.lift;
    if(!mod || !mod.plan || !mod.setup || state.b34Descanso || !Array.isArray(mod.plan.workouts)) return;
    const prof = state.user && state.user.profile; const senior = !!(prof && prof.age >= 50); const goal = mod.setup.goal || 'hipertrofia';
    mod.plan.workouts.forEach(w=>{
      if(!w || w.cali || !Array.isArray(w.exercises)) return;
      w.exercises.forEach(e=>{
        if(!e || e.cali) return;
        if(['Core','Panturrilha','Trapézio'].includes(e.part)) e.rest = LIFT_DESC_PEQUENOS[senior?'senior':'adulto'][goal] || '45-60s';
        else e.rest = liftDescanso(exPapel(e, e.part).tier, goal, senior, e.unit==='tempo' ? null : e.reps);
      });
      w.duration = estimateLiftDuration(w.exercises, goal);
    });
    state.b34Descanso = true; saveData();
  }catch(e){ console.log('descansos (Beta 34)', e); }
}
mtGancho('renderHome', { depois(){ b34AtualizaDescansos(); }});

Object.assign(window, { b34AtualizaDescansos, exTipoRegistro, descansoDoExercicio, runSemanaPrevia, openSincronizacao, syncAgora, syncJuntarArquivosAntigos, openParceiros, openParceiroForm, salvarParceiro, excluirParceiro, pcFiltrar, pcProjecao, creditosHtml, mtTocarPausar, mtVelocidade, mtVolume, mtBuscar });
// =====================================================================
// 46. Beta 35 — Acessibilidade: nomes para botões só com ícone e teclado em elementos clicáveis
// =====================================================================
// Muitos botões do app mostram só um ícone (✕, 🗑️, ›...). Leitores de tela liam "botão" sem nome.
// Aqui cada botão sem texto ganha um nome (aria-label) a partir do title ou do ícone. Elementos que não
// são botões mas abrem algo ao tocar (cartões, linhas de menu) passam a ser alcançáveis pelo Tab e a
// responder a Enter/Espaço. Nada muda para quem usa o toque.
const A11Y_ICONES = [
  [/^(✕|×|✖|❌)$/, 'Fechar'], [/^🗑/, 'Excluir'], [/^✏/, 'Editar'], [/^(▶|⏵)/, 'Tocar'], [/^(⏸)/, 'Pausar'],
  [/^⚙/, 'Configurações'], [/^📤/, 'Compartilhar'], [/^(‹|←|⬅)/, 'Voltar'], [/^(›|→|➡)/, 'Avançar'], [/^(＋|\+)$/, 'Adicionar'],
  [/^(−|-)$/, 'Diminuir'], [/^🔔/, 'Ligar ou desligar o som'], [/^🔇/, 'Ligar o som'], [/^🔊/, 'Desligar o som'], [/^⛶/, 'Tela cheia'],
  [/^↩/, 'Desfazer'], [/^(✓|✅)$/, 'Confirmar'], [/^(⋮|⋯|…)$/, 'Mais opções'], [/^🔍/, 'Buscar'], [/^📋/, 'Copiar'], [/^🧹/, 'Limpar'],
  [/^📷/, 'Foto'], [/^💾/, 'Salvar'], [/^🔄/, 'Atualizar'], [/^❤/, 'Favoritar'], [/^ℹ/, 'Informações'], [/^❓/, 'Ajuda'], [/^💬/, 'Abrir o assistente'], [/^(➤|➜|⮕)$/, 'Enviar']
];
function _a11yTemTexto(el){ return /[A-Za-zÀ-ÿ0-9]{2,}/.test((el.textContent || '').trim()); }
function _a11yNome(el){
  const t = el.getAttribute('title'); if(t && t.trim()) return t.trim();
  const oc = el.getAttribute('onclick') || '', href = el.getAttribute('href') || '';
  if(/pickPhoto\(/.test(oc)) return 'Trocar foto de perfil';
  if(/^mailto:/.test(href)) return 'Enviar e-mail para o suporte';
  const tx = (el.textContent || '').trim();
  for(const [re, nome] of A11Y_ICONES) if(re.test(tx)) return nome;
  return '';
}
function a11yVarrer(raiz){
  try{
    (raiz || document).querySelectorAll('button:not([aria-label]):not([aria-labelledby]), a:not([aria-label])').forEach(el=>{
      if(_a11yTemTexto(el)) return;
      const n = _a11yNome(el); if(n) el.setAttribute('aria-label', n);
    });
    (raiz || document).querySelectorAll('[onclick]:not(button):not(a):not(input):not(select):not(textarea):not([role]):not(.screen)').forEach(el=>{
      const oc = el.getAttribute('onclick') || '';
      if(/event\.target\s*===?\s*this/.test(oc) || el.id === 'modal-back') return;   // fundo de janela: não é um botão
      el.setAttribute('role', 'button'); if(!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      if(!_a11yTemTexto(el)){ const n = _a11yNome(el); if(n) el.setAttribute('aria-label', n); }
    });
  }catch(e){}
}
// Enter ou Espaço num elemento clicável que não é botão de verdade
document.addEventListener('keydown', e=>{
  if((e.key !== 'Enter' && e.key !== ' ') || e.defaultPrevented) return;
  const el = e.target; if(!el || el.getAttribute('role') !== 'button' || /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
  e.preventDefault(); el.click();
});
let _a11yT = null;
try{
  new MutationObserver(()=>{ clearTimeout(_a11yT); _a11yT = setTimeout(()=>a11yVarrer(), 250); }).observe(document.body, { childList:true, subtree:true });
}catch(e){}
setTimeout(()=>a11yVarrer(), 1500);
Object.assign(window, { a11yVarrer });

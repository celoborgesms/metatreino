// =====================================================================
// MetaTreino 2027.1 Beta 12 — app-plus.js
// Camada de evolução carregada DEPOIS do app.js. Não recria nada que já funciona:
// estende, corrige e acrescenta. Todas as funções do app.js continuam valendo.
//
// Conteúdo:
//  1. Ícones (grupos musculares e medalhas das conquistas)
//  2. Biblioteca (busca, filtros, ficha técnica do exercício)
//  3. Player de vídeo imersivo
//  4. Fotos de evolução (galeria e exclusão individual)
//  5. Navegação (Treinos, Progresso, atalhos)
//  6. Aparência (Tema Noturno, ícones, detalhes)
//  7. Desafios temáticos (calendário anual, datas móveis, missões, medalhas)
//  8. Home inteligente
//  9. Meta Assistente (motivação contextual, análises, comandos novos)
// 10. Painel administrativo (indicadores, desafios, administradores)
// 11. Atualização automática (sem botão)
// =====================================================================
'use strict';

const MTP = { versao: '2027.1-beta.12' };
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
function _exBusca(){ const out = []; EX_BANK.forEach(c=>c.items.forEach(it=>out.push({ex:it, grupo:c.name}))); return out; }
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
      return `<div class="lx-item" onclick="openExercise('${mtJsStr(ex.name)}')">${muscleIco(musculoDoExercicio(ex, cat.name))}<div class="lx-info"><div class="lx-name">${mtEsc(ex.name)}</div><div class="lx-sub">${mtEsc(ex.sub||'')}</div><div class="lx-tags">${tags}</div></div><span class="lx-go">›</span></div>`;
    }).join('');
  });
  const totalCat = EX_BANK.reduce((s,c)=>s+c.items.length,0);
  const cnt = $('lib-count'); if(cnt) cnt.textContent = (termos.length || libFilter!=='Todos' || libEquip!=='todos') ? `${total} de ${totalCat} exercícios` : `Catálogo completo · ${totalCat} exercícios`;
  $('lib-list').innerHTML = html || `<div class="lx-empty">Nenhum exercício encontrado${q?` para “${mtEsc(q)}”`:''}.<br><span style="font-size:12px;color:var(--text-mute)">Tente outro termo ou limpe os filtros.</span></div>`;
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
function _exVideoTimeout(){}
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
    : `<div class="ex-noVideo">${muscleIco(musculoDoExercicio(ex, grupo))}<div>O treinador ainda não cadastrou um vídeo para este exercício.</div><a class="btn btn-ghost" style="padding:8px 14px;font-size:12.5px" href="${mtEsc(ytLink(name))}" target="_blank" rel="noopener">Buscar demonstração no YouTube ↗</a></div>`;
  const mi = $('modal-inner');
  mi.classList.remove('modal-video','short'); mi.classList.add('modal-ex');
  $('modal-back').classList.add('ex-open');
  mi.innerHTML = `${palco}
    <div class="ex-scroll">
      <div class="ex-head"><div style="min-width:0"><h3>${mtEsc(ex.name)}</h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${grupo?`<span class="pill on">${mtEsc(grupo)}</span>`:''}${(ex.equip||[]).filter(e=>EQUIP_LBL[e]).map(e=>`<span class="pill">${EQUIP_LBL[e]}</span>`).join('')}</div></div>
        <button class="ex-x" onclick="closeModal()" aria-label="Fechar">✕</button></div>
      ${v.id?`<div class="ex-tools"><button class="btn btn-ghost" id="ex-som" onclick="mtAlternarSom()">${videoMudoPref()?'🔇 Sem som':'🔊 Com som'}</button><button class="btn btn-ghost" onclick="exTelaCheia()">⛶ Tela cheia</button><a class="btn btn-ghost" href="${mtEsc(v.url)}" target="_blank" rel="noopener">YouTube ↗</a>${temEvo?`<button class="btn btn-ghost" onclick="closeModal();setTimeout(()=>openExProgress('${mtJsStr(exId)}'),80)">📈 Minha evolução</button>`:''}</div>`
        : (temEvo?`<div class="ex-tools"><button class="btn btn-ghost" onclick="closeModal();setTimeout(()=>openExProgress('${mtJsStr(exId)}'),80)">📈 Minha evolução</button></div>`:'')}
      ${info?`<a class="ex-credit" href="${mtEsc(v.cred)}" target="_blank" rel="noopener">🎥 Demonstração por <b>${mtEsc(info.handle)}</b> <span>${info.icon}</span></a>`:''}
      <div class="ex-sec"><h4>Músculos trabalhados</h4><p>${mtEsc(ficha.m)}${ex.sub && !mtNorm(ficha.m).includes(mtNorm(ex.sub.split(/[(/]/)[0]).trim())?` · ênfase: ${mtEsc(ex.sub)}`:''}</p></div>
      <div class="ex-sec"><h4>Como executar</h4><ol>${ficha.ex.map(x=>`<li>${mtEsc(x)}</li>`).join('')}</ol></div>
      <div class="ex-sec"><h4>Dicas técnicas</h4><ul>${ficha.d.map(x=>`<li>${mtEsc(x)}</li>`).join('')}</ul></div>
      <div class="ex-sec"><h4>Erro comum</h4><p>${mtEsc(ficha.e)}</p></div>
      ${ex.improv?`<div class="note" style="margin-top:14px"><div class="note-line">Esta é uma adaptação para treinar em casa. Na academia, prefira a versão com equipamento.</div></div>`:''}
      ${v.id?`<div style="text-align:center;margin-top:14px"><a href="#" onclick="mtReportarVideo('${mtJsStr(v.k)}','${mtJsStr(ex.name)}','manual');return false" style="font-size:12px;color:var(--text-mute)">O vídeo não abre ou está errado? Avisar o treinador</a></div>`:''}
      <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="closeModal()">Fechar</button>
    </div>`;
  $('modal-back').classList.add('on');
  if(v.id) mtMontarPlayer(v, {nome: ex.name, grupo, equip: ex.equip||[]});
}
function openExercise(name){ openExerciseSheet(name); }
// "Ver como fazer" (sessões, assistente): sem vídeo cadastrado, mantém o comportamento antigo (busca no YouTube)
const _playExerciseOrig = playExercise;
playExercise = function(name, idKey){
  const v = _videoDoExercicio(name, idKey);
  if(!v.id){ return _playExerciseOrig(name, idKey); }
  openExerciseSheet(name, idKey, {video:true});
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
    : `<div class="text-dim" style="padding:22px 6px;text-align:center;font-size:13.5px;line-height:1.6">${lista.length?'Nenhuma foto nesta posição.':'Registre a primeira foto pra começar a acompanhar sua evolução visual. Uma foto por mês, no mesmo local e com a mesma luz, já mostra bastante.'}</div>`;
  const barraSel = sel ? `<div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-ghost" style="flex:1" onclick="fotoSel=null;openFotos()">Cancelar</button>
      <button class="btn btn-primary" style="flex:1;${sel.size?'background:#ef4444!important;color:#fff!important':'opacity:.5'}" ${sel.size?'':'disabled'} onclick="fotoApagarSelConfirma()">Apagar ${sel.size||''} ${sel.size===1?'foto':'fotos'}</button></div>`
    : `<div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary" style="flex:1" onclick="fotoNova()">➕ Nova foto</button>
      <button class="btn btn-ghost" style="flex:1${lista.length<2?';opacity:.45':''}" onclick="openComparar()" ${lista.length<2?'disabled':''}>↔ Comparar</button></div>`;
  $('modal-inner').innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><h3 style="margin:0">📷 Fotos de evolução</h3>${lista.length&&!sel?`<button class="btn btn-ghost" style="padding:6px 11px;font-size:12px" onclick="fotoSel=new Set();openFotos()">Selecionar</button>`:''}</div>
    <p style="color:var(--text-mute);font-size:11.5px;line-height:1.5;margin:6px 0 10px">${sel?'Toque nas fotos que deseja apagar.':`${lista.length} foto${lista.length===1?'':'s'} · ficam só neste aparelho, não vão pra nuvem. Se trocar de celular ou limpar os dados do site, elas somem — baixe as importantes.`}</p>
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
    <p style="color:var(--text-dim);font-size:13.5px;line-height:1.5">Isso apaga as <b>${n}</b> fotos de evolução deste aparelho. Não dá pra desfazer.<br>Para confirmar, digite <b>APAGAR</b>.</p></div>
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
const _renderSessionsOrig = renderSessions;
renderSessions = function(){
  const r = _renderSessionsOrig.apply(this, arguments);
  try{
    const ql = $('ql-lib'); if(ql) ql.style.display = state.modules.lift ? '' : 'none';
    const t = $('sessions-title'); if(t && /Sess/.test(t.textContent)) t.textContent = t.textContent.replace(/Sessões/,'Treinos');
  }catch(e){}
  return r;
};

// ---------- 6. APARÊNCIA ----------
const TEMAS_NOTURNOS = ['zepp','amoled','aurora','classico','oceano'];
function openAparencia(){
  const cur = currentTheme();
  const opt = k=>{ const t = THEMES[k], p = t.prev;
    return `<button type="button" class="ap-opt ${k===cur?'on':''}" onclick="setTheme('${k}');openAparencia()">
      <div class="ap-prev" style="background:${p.bg};${k==='claro'?'border:1px solid #dfe2f2':''}"><b style="background:${p.a}"></b><i style="background:${p.a}"></i><i style="background:${p.b}"></i><i style="background:${p.c}"></i></div>
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
    <div class="ap-grid">${opt('claro')}</div>
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
  const rv = $('theme-row-val'); if(rv) rv.textContent = (cur==='claro'?'Tema Claro':'Tema Noturno')+' · '+THEMES[cur].nome+' ›';
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
  if(rv) rv.textContent = (cur==='claro'?'Tema Claro':'Tema Noturno')+' · '+THEMES[cur].nome+' ›';
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
  const c = EV_CORES[arte] || EV_CORES.evolucao; try{ if(currentTheme()==='claro') return Object.assign({}, c, {ev: EV_CLARO[arte] || '#4d7c0f'}); }catch(e){} return c; }
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
    if(state.eventos && state.eventos[key] && !state.eventos[key].concluidoEm){ delete state.eventos[key]; saveData(); try{ db.collection('desafiosTematicos').doc(key).collection('participantes').doc(fbUser.uid).delete().catch(()=>{}); }catch(e){} }
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
    db.collection('desafiosTematicos').doc(e.key).collection('participantes').doc(fbUser.uid).set({
      uid: fbUser.uid, email: (state.user&&state.user.email)||'', nome: (state.user&&state.user.profile&&state.user.profile.nickname)||(state.user&&state.user.name)||'',
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
  if(EV_DO_TEMA.includes(e.arte)){ try{ const cs = getComputedStyle(document.documentElement); const pr = cs.getPropertyValue('--primary').trim(), rgb = cs.getPropertyValue('--primary-rgb').trim(); if(pr && currentTheme()!=='claro'){ c.ev = pr; c.a = `rgba(${rgb},.22)`; c.b = `rgba(${rgb},.08)`; } }catch(err){} }
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
const _renderMonthlyCardOrig = renderMonthlyCard;
renderMonthlyCard = function(){
  _renderMonthlyCardOrig();
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
};

// ---------- 8. HOME INTELIGENTE ----------
// Um único card no topo que muda conforme o momento do aluno (iniciante, voltando, consistente,
// treino concluído, perto da prova). Não repete avisos que o app já mostra (dor, férias, pendências).
function contextoAluno(){
  const h = mtHist();
  const total = h.length;
  const last = total ? h[total-1].at : 0;
  const diasSem = last ? Math.round((mtDia0()-mtDia0(last))/DIA_MS) : null;
  const hojeFeito = h.some(x=>mtDia0(x.at)===mtDia0());
  const planejados = Math.max(((state.modules.lift&&state.modules.lift.setup&&+state.modules.lift.setup.days)||0), ((state.modules.run&&state.modules.run.setup&&+state.modules.run.setup.days)||0)) || 3;
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
    p = prox ? `Seu próximo treino é ${prox}. Se der para encaixar algo hoje, uma caminhada leve já ajuda na recuperação.` : 'Que tal começar hoje?';
    a = `<button class="btn btn-ghost" onclick="mtPergunta('analise_semana')">Análise da semana</button>`;
  }
  el.innerHTML = `<div class="smart ${cls}"><div style="display:flex;align-items:flex-start;gap:8px"><div class="smart-k" style="flex:1">${k}</div><button onclick="mtLS('mt_smart_fechado', String(mtDia0()));renderHomeSmart()" aria-label="Ocultar hoje" style="background:none;border:0;color:var(--text-mute);font-size:15px;padding:0 2px;cursor:pointer">✕</button></div><div class="smart-t">${t}</div><div class="smart-p">${p}</div><div class="smart-a">${a}</div></div>`;
}
function mtPergunta(key){
  try{ openAssistant(); }catch(e){}
  setTimeout(()=>{ try{ maAsk(key); }catch(e){} }, 350);
}
const _renderHomeOrig = renderHome;
renderHome = function(){
  const r = _renderHomeOrig.apply(this, arguments);
  try{ renderHomeSmart(); }catch(e){ console.log('home smart:', e); }
  return r;
};

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
    'Dois ou três dias de descanso fazem bem. O quarto já começa a pesar — bora quebrar isso hoje?',
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
    'Corpo forte, cabeça leve. Bora?',
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
  // primeira categoria é a mais relevante; às vezes (30%) usa a segunda, pra variar sem perder contexto
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
// proatividade discreta: só quando o assistente não tem nada mais importante pra dizer (máx. 1x/dia, regra original)
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
  const ref = rows.find(r=>/Feedback/.test(r.textContent)); if(!ref) return;
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
const _goAdminOrig = goAdmin;
goAdmin = async function(){
  const r = await _goAdminOrig.apply(this, arguments);
  try{ renderAdminTools(); renderAdminKpis(); }catch(e){ console.log('admin extras:', e); }
  return r;
};
// --- desafios temáticos (admin) ---
async function openAdminEventos(){
  await loadEventosCustom();
  const Y = new Date().getFullYear(); const agora = Date.now();
  const lista = [...eventosDoAno(Y), ...eventosDoAno(Y+1)].filter(e=>e.fim>agora-30*DIA_MS).sort((a,b)=>a.ini-b.ini).slice(0,10);
  const custom = evCustom.map(_evDeCustom).sort((a,b)=>b.ini-a.ini);
  const subst = new Set(custom.map(c=>c.substitui).filter(Boolean));
  const linha = (e, extra)=>{ const ativo = agora>=e.ini && agora<e.fim; return `<div class="ev-list-item">${eventoMedalha(e,38)}<div style="flex:1;min-width:0"><b style="font-size:13.5px">${mtEsc(e.nome)}</b><div class="mt-muted" style="font-size:11.5px">${mtFmtData(e.ini)} – ${mtFmtData(e.fim-1)}${ativo?' · <span style="color:var(--accent)">em andamento</span>':''}${extra||''}</div></div>${_admEvBotoes(e)}</div>`; };
  const princ = mtPrincipal();
  $('modal-inner').innerHTML = `<h3>Desafios temáticos</h3>
    <p class="mt-muted" style="margin:0 0 10px">O calendário anual é automático (inclusive Carnaval e Páscoa, que mudam de data). ${princ?'Você pode personalizar qualquer desafio, desativá-lo ou criar um novo — sem mexer no código.':'Somente o administrador principal pode criar ou editar desafios.'}</p>
    ${princ?`<button class="btn btn-primary btn-block" onclick="openAdminEventoForm()">➕ Criar desafio</button>`:''}
    ${custom.length?`<div class="mt-sec">Criados ou personalizados</div><div class="card" style="padding:6px 12px">${custom.map(e=>linha(e, e.ativo?'':' · <b>desativado</b>')).join('')}</div>`:''}
    <div class="mt-sec">Calendário automático</div><div class="card" style="padding:6px 12px">${lista.map(e=>subst.has(e.key)?'':linha(e)).join('')}</div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="closeModal()">Fechar</button>`;
  $('modal-back').classList.add('on');
}
function _admEvBotoes(e){
  const b = [`<button class="btn btn-ghost" style="padding:6px 9px;font-size:11.5px" onclick="openAdminEventoPart('${e.key}')">Participação</button>`];
  if(mtPrincipal()) b.push(`<button class="btn btn-ghost" style="padding:6px 9px;font-size:11.5px" onclick="openAdminEventoForm('${e.key}')">${e.custom?'Editar':'Personalizar'}</button>`);
  return `<div style="display:flex;flex-direction:column;gap:4px">${b.join('')}</div>`;
}
function openAdminEventoForm(key){
  if(!mtPrincipal()){ toast('🔒 Somente o administrador principal.'); return; }
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
  if(!mtPrincipal()){ toast('🔒 Somente o administrador principal.'); return; }
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
    const arr = []; snap.forEach(d=>arr.push(d.data()));
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
  catch(e){ $('modal-inner').innerHTML = `<h3>Administradores</h3><p class="mt-muted">Não consegui ler a coleção <b>admins</b>. Publique as regras do Firestore desta versão.</p><button class="btn btn-ghost btn-block" onclick="closeModal()">Fechar</button>`; return; }
  const principal = String(ADMIN_EMAIL).toLowerCase();
  if(!lista.some(a=>a.email===principal)) lista.unshift({email:principal, ativo:true});
  $('modal-inner').innerHTML = `<h3>Administradores</h3>
    <p class="mt-muted" style="margin:0 0 10px">Administradores autorizados acessam o painel e gerenciam alunos e exercícios. Só o principal cria desafios e muda permissões — e isso é garantido pelas regras do Firestore, não só pela tela.</p>
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
    (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) || !!document.getElementById('rest-timer-on');
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
const MT_PLAYER = { p:null, v:null, info:null, mudo:false, pronto:false, t:null };
function mtDestruirPlayer(){
  clearTimeout(MT_PLAYER.t);
  try{ MT_PLAYER.p && MT_PLAYER.p.destroy && MT_PLAYER.p.destroy(); }catch(e){}
  MT_PLAYER.p = null; MT_PLAYER.pronto = false; MT_PLAYER.v = null;
}
// Fallback sem a API (bloqueada/lenta): iframe simples; o parâmetro mute=1 ainda respeita a preferência.
function _mtIframeSimples(v, mudo){
  const alvo = $('ex-yt'); if(!alvo) return;
  const src = `https://www.youtube-nocookie.com/embed/${v.id}?rel=0&modestbranding=1&playsinline=1&autoplay=1&mute=${mudo?1:0}`;
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
      playerVars: { autoplay:1, playsinline:1, rel:0, modestbranding:1, mute: MT_PLAYER.mudo ? 1 : 0, origin: location.origin },
      events: {
        onReady: e=>{
          MT_PLAYER.pronto = true; clearTimeout(MT_PLAYER.t);
          try{ MT_PLAYER.mudo ? e.target.mute() : e.target.unMute(); e.target.playVideo(); }catch(err){}
          exVideoOk(); _mtBotaoSom();
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
function _mtBotaoSom(){ const b = $('ex-som'); if(b) b.textContent = MT_PLAYER.mudo ? '🔇 Sem som' : '🔊 Com som'; }
// liga/desliga o som SÓ deste vídeo (a preferência geral continua a mesma)
function mtAlternarSom(){
  const p = MT_PLAYER.p; if(!p || !MT_PLAYER.pronto) return;
  try{ if(MT_PLAYER.mudo){ p.unMute(); if(p.getVolume && p.getVolume()===0) p.setVolume(100); MT_PLAYER.mudo = false; } else { p.mute(); MT_PLAYER.mudo = true; } }catch(e){}
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
  const princ = mtPrincipal();
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
    <p class="mt-muted" style="margin:0 0 10px">${pend ? `<b>${pend}</b> ${pend===1?'vídeo com problema':'vídeos com problema'}. Cada exercício aparece uma vez só, com o número de alunos que avisaram.` : 'Nenhum vídeo pendente. 👌'}${princ?'':' Só o administrador principal troca links e resolve ocorrências.'}</p>
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
  if(!mtPrincipal()){ toast('🔒 Somente o administrador principal.'); return; }
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
  if(!mtPrincipal()) return;
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
  if(!mtPrincipal()) return;
  appConfirm('Marque como resolvido depois de corrigir ou substituir o vídeo. Se algum aluno avisar de novo, a ocorrência volta como pendente.', async ()=>{
    try{ await _resolver(exId, 'marcado como resolvido'); toast('✅ Ocorrência resolvida'); }catch(e){ toast('⚠️ O Firestore recusou. Confira as regras publicadas.'); }
    openVideosReportados();
  }, {title:'Marcar como resolvido?', emo:'🎬', okLabel:'Resolvido', onCancel:()=>openVideosReportados()});
}
// manutenção dos links: só o administrador principal (pedido do dono do app; as regras do Firestore garantem)
['saveVideoLink','clearVideoLink'].forEach(n=>{
  const orig = window[n]; if(typeof orig!=='function') return;
  const w = function(){ if(!mtPrincipal()){ toast('🔒 Só o administrador principal altera os links dos vídeos.'); return; } return orig.apply(this, arguments); };
  window[n] = w;
  try{ if(n==='saveVideoLink') saveVideoLink = w; else clearVideoLink = w; }catch(e){}
});

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
const _goAdminB11 = goAdmin;
window.goAdmin = async function(){
  const r = await _goAdminB11.apply(this, arguments);
  try{
    if(!admLoaded){
      $('adm-list').innerHTML = `<div class="card" style="text-align:center"><b>Não consegui carregar os alunos.</b><div class="mt-muted" style="margin:6px 0 12px">${navigator.onLine===false?'Você está sem internet.':'Pode ser conexão lenta ou permissão do Firestore.'}</div><button class="btn btn-primary" id="adm-retry" onclick="mtComBotao('adm-retry','Carregando…',()=>goAdmin())">Tentar de novo</button></div>`;
    }
    _admLinhaVideos();
    loadVideosReportados().then(_admVidBadge).catch(()=>{});
  }catch(e){}
  return r;
};
function _admLinhaVideos(){
  if($('adm-vid-row')) return;
  const ref = $('adm-ev-row') || [...document.querySelectorAll('#scr-admin .list-row')].find(r=>/Feedback/.test(r.textContent)); if(!ref) return;
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
const _renderHomeMetricsB11 = renderHomeMetrics;
window.renderHomeMetrics = function(){ const r = _renderHomeMetricsB11.apply(this, arguments); try{ _nutriTile(); }catch(e){ console.log('nutri tile', e); } return r; };
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
  const retencao = (m.k!=='peso' && m.k!=='volume' && per==='ano') ? 'O app guarda o detalhe dos treinos dos últimos 90 dias; meses anteriores aparecem sem registros.' : '';
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
const _renderPerfB11 = renderPerf;
window.renderPerf = function(){
  const r = _renderPerfB11.apply(this, arguments);
  try{
    let el = $('perf-evo');
    if(!el){ el = document.createElement('div'); el.id = 'perf-evo'; el.className = 'chart-card'; const ref = document.querySelector('#scr-perf .chart-card'); if(ref) ref.before(el); }
    renderEvolucao();
  }catch(e){ console.log('evolução:', e); }
  return r;
};
// Perfil: gráfico do peso com o mesmo componente (período ajustável); o histórico completo continua a um toque
const _renderProfileB11 = renderProfile;
window.renderProfile = function(){
  const r = _renderProfileB11.apply(this, arguments);
  try{
    const slot = $('pf-weight-chart-slot'); if(!slot) return r;
    slot.removeAttribute('onclick');
    const per = mtLS('mt_pf_p') || 'tri';
    const ini = _buckets(per)[0].a;
    const ps = _pontosLinha('peso', ini, Date.now()+DIA_MS);
    const pers = ['mes','tri','ano'].map(p=>`<button type="button" class="${p===per?'on':''}" onclick="mtLS('mt_pf_p','${p}');renderProfile()">${MT_PER[p].lbl}</button>`).join('');
    const corpo = ps.length>=2 ? mtChart({tipo:'line', un:'kg', dec:1, pts: ps.map(p=>({v:p.v, rot: per==='ano'?MT_MESES[new Date(p.t).getMonth()]:mtFmtData(p.t), tip:`<b>${_fmtNum(p.v,1)} kg</b> · ${new Date(p.t).toLocaleDateString('pt-BR')}`}))})
      : _vazio({k:'peso', pontos:true}, ps.length);
    slot.innerHTML = `<div class="seg-nav seg-sm">${pers}</div><div class="ch-wrap">${corpo}</div><button type="button" class="btn btn-ghost btn-block" style="margin-top:8px;font-size:12.5px;padding:8px" onclick="openWeightHistory()">Ver todas as pesagens</button>`;
  }catch(e){ console.log('peso:', e); }
  return r;
};

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
const _renderProfileB11b = window.renderProfile;
window.renderProfile = function(){
  const r = _renderProfileB11b.apply(this, arguments);
  try{ const v = $('audio-row-val'); if(v) v.textContent = (videoMudoPref() ? 'Iniciar no mudo' : 'Áudio original') + ' ›'; }catch(e){}
  return r;
};

// ---------- Home: aplica os refinamentos depois de cada desenho ----------
const _renderHomeB11 = renderHome;
window.renderHome = function(){
  const r = _renderHomeB11.apply(this, arguments);
  try{ _mtAplicaColapsos(); }catch(e){ console.log('colapsos:', e); }
  return r;
};

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
const _renderHomeCali = window.renderHome;
window.renderHome = function(){ const r = _renderHomeCali.apply(this, arguments); try{ renderHomeCali(); }catch(e){ console.log('home cali', e); } return r; };
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
const _renderPerfCali = window.renderPerf;
window.renderPerf = function(){
  const r = _renderPerfCali.apply(this, arguments);
  try{
    let el = $('perf-cali');
    if(!temCali() || !state.modules.lift){ if(el) el.remove(); return r; }
    if(!el){ el = document.createElement('div'); el.id = 'perf-cali'; el.className = 'chart-card'; const ev = $('perf-evo'); if(ev) ev.after(el); else return r; }
    const st = state.modules.lift.setup;
    const base = CALI_CADEIAS.filter(c=>!c.alt && caliPos(st,c.id)>=0 && (!c.skill || caliReqOk(st,c.id)));
    const hist = (st.caliHist||[]).slice(-5).reverse();
    el.innerHTML = `<div class="chart-title" style="margin-bottom:10px">Progressões da calistenia</div>
      ${base.map(c=>{ const i = caliPos(st,c.id); return `<div class="cl-row" onclick="caliAbrirTroca('${c.id}')"><div style="flex:1;min-width:0"><b>${mtEsc(c.titulo)}</b><small>${mtEsc(c.itens[i][0])}</small></div><div class="cl-dots">${c.itens.map((_,k)=>`<i class="${k<i?'ok':k===i?'now':''}"></i>`).join('')}</div></div>`; }).join('')}
      ${hist.length?`<div class="mt-sec" style="margin-top:12px">Últimas mudanças</div>${hist.map(h=>{ const c = caliCadeia(h.c); return c?`<div class="mt-muted" style="font-size:12px;padding:3px 0">${mtFmtData(h.at)} · ${h.para>h.de?'↑':'↓'} ${mtEsc(c.itens[h.para][0])}</div>`:''; }).join('')}`:'<div class="mt-muted" style="font-size:12px;margin-top:8px">As mudanças de variação aparecem aqui conforme você evolui.</div>'}`;
  }catch(e){ console.log('perf cali', e); }
  return r;
};
// Treinos: avisos da sessão de calistenia (equipamento faltando, recuperação)
const _renderSessionsCali = window.renderSessions;
window.renderSessions = function(){
  const r = _renderSessionsCali.apply(this, arguments);
  try{
    const mod = state.modules.lift; if(state.active!=='lift' || !mod || !mod.plan) return r;
    const t = $('sessions-title'); const m = modalidadeAtual();
    if(t && m!=='musculacao') t.textContent = t.textContent.replace(/Musculação|Treinos/,'').trim() + (m==='calistenia' ? ' Calistenia' : ' Híbrido');
    const avisos = [...new Set((mod.plan.workouts||[]).flatMap(w=>w.caliAvisos||[]))];
    let box = $('sess-cali-avisos');
    if(!avisos.length){ if(box) box.remove(); return r; }
    if(!box){ box = document.createElement('div'); box.id = 'sess-cali-avisos'; const slot = $('session-detail-slot'); if(slot) slot.before(box); }
    box.innerHTML = `<div class="note" style="margin-top:10px">${avisos.map(a=>`<div class="note-line">${mtEsc(a)}</div>`).join('')}</div>`;
  }catch(e){}
  return r;
};
// Perfil: linha "Modalidade"
const _renderProfileCali = window.renderProfile;
window.renderProfile = function(){
  const r = _renderProfileCali.apply(this, arguments);
  try{
    if(!state.modules.lift) return r;
    let row = $('pf-modalidade-row');
    if(!row){ const ref = [...document.querySelectorAll('#scr-profile .list-row')].find(x=>/Meu plano de treino/.test(x.textContent)); if(!ref) return r;
      row = document.createElement('div'); row.className = 'list-row'; row.id = 'pf-modalidade-row'; row.onclick = openModalidade; ref.after(row); }
    const m = modalidadeAtual(); const nr = temCali() ? caliNivelReal() : null;
    row.innerHTML = `<span>🤸</span> <span>Modalidade</span><span style="margin-left:auto;color:var(--text-mute);font-size:12px">${({musculacao:'Musculação',calistenia:'Calistenia',hibrido:'Híbrido'})[m]}${nr?' · '+nr.nome:''} ›</span>`;
  }catch(e){}
  return r;
};

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
  const princ = mtPrincipal();
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
  const princ = mtPrincipal();
  $('modal-inner').innerHTML = `<h3>Exercícios e progressões</h3><p class="mt-muted" style="margin:0 0 8px">A ordem é a ordem de progressão. ${princ?'Toque num exercício para editar nível e textos, ou adicione um novo numa posição da cadeia.':'Somente o administrador principal edita.'}</p>
    <div style="max-height:58vh;overflow:auto">${CALI_CADEIAS.map(c=>`<div class="mt-sec">${mtEsc(c.titulo)} · ${c.area}${c.req?' · pré-req.':''}</div>${c.itens.map((it,k)=>`<div class="cl-step" ${princ?`onclick="caliEditarEx('${c.id}',${k})"`:''}><span class="cl-nv n${it[1]}">${CALI_NIVEL[it[1]]}</span><b style="flex:1;font-size:13px">${k+1}. ${mtEsc(it[0])}</b></div>`).join('')}${princ?`<button class="btn btn-ghost" style="padding:6px 10px;font-size:12px;margin:4px 0 8px" onclick="caliEditarEx('${c.id}',-1)">+ Adicionar em ${mtEsc(c.titulo)}</button>`:''}`).join('')}</div>
    <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openCaliAdmin()">Voltar</button>`;
}
function caliEditarEx(cid, k){
  if(!mtPrincipal()) return;
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
  if(!mtPrincipal()) return;
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
  const princ = mtPrincipal();
  $('modal-inner').innerHTML = `<h3>Modelos de plano</h3><p class="mt-muted" style="margin:0 0 8px">Quando existe um modelo ativo para o número de dias (e objetivo) do aluno, ele substitui a divisão padrão (${Object.entries(CALI_SPLITS).map(([d,s])=>d+' dias: '+s.nome).join(' · ')}).</p>
    ${caliModelos.map(m=>`<div class="list-row" ${princ?`onclick="caliEditarModelo('${m.id}')"`:''}>${mtEsc(m.nome||'Modelo')}<span style="margin-left:auto;font-size:12px;color:var(--text-mute)">${m.dias} dias${m.objetivo?' · '+m.objetivo:''}${m.ativo===false?' · inativo':''}</span></div>`).join('') || '<div class="mt-muted" style="padding:8px 0">Nenhum modelo criado. Os planos usam as divisões padrão.</div>'}
    ${princ?`<button class="btn btn-primary btn-block" style="margin-top:10px" onclick="caliEditarModelo()">+ Novo modelo</button>`:''}
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openCaliAdmin()">Voltar</button>`;
}
const CALI_PAD_LBL = { skill:'Habilidade', empurrar_h:'Empurrar horizontal (flexões)', empurrar_v:'Empurrar vertical (pike/HSPU)', dips:'Paralelas / tríceps', puxar_v:'Puxar vertical (barra)', puxar_h:'Puxar horizontal (remada)', agachar:'Agachamento', agachar_uni:'Perna unilateral', posterior:'Posteriores', gluteo:'Glúteos', panturrilha:'Panturrilhas', core_anti:'Core anti-extensão', core_lat:'Core lateral', core_flex:'Elevação de pernas / L-sit', core_ext:'Core posterior' };
function caliEditarModelo(id){
  if(!mtPrincipal()) return;
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
  if(!mtPrincipal()) return;
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
  if(!mtPrincipal()) return;
  $('modal-inner').innerHTML = `<h3>Critério de domínio</h3><p class="mt-muted">Quantas sessões seguidas no topo da faixa (com execução limpa) o aluno precisa para liberar a próxima variação.</p>
    <select class="input" id="cd-n">${[1,2,3,4].map(n=>`<option ${n===caliConfig.sessoesDominio?'selected':''}>${n}</option>`).join('')}</select>
    <button class="btn btn-primary btn-block" style="margin-top:10px" id="cd-salvar" onclick="mtComBotao('cd-salvar','Salvando…',async()=>{ await db.collection('config').doc('calistenia').set({sessoesDominio:+$('cd-n').value, atualizadoEm:Date.now()}, {merge:true}); await loadCaliAdmin(); toast('✅ Salvo'); openCaliAdmin(); })">Salvar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="openCaliAdmin()">Voltar</button>`;
}
const _goAdminCali = window.goAdmin;
window.goAdmin = async function(){
  const r = await _goAdminCali.apply(this, arguments);
  try{
    if(!$('adm-cali-row')){ const ref = $('adm-vid-row') || $('adm-ev-row'); if(ref){ const a = document.createElement('div'); a.className = 'list-row'; a.id = 'adm-cali-row'; a.onclick = openCaliAdmin; a.innerHTML = '🤸 <span>Calistenia</span><span style="margin-left:auto;font-size:11px;color:var(--text-dim)">exercícios, modelos e uso</span>'; ref.after(a); } }
  }catch(e){}
  return r;
};
const _bootCali = bootAfterAuth;
window.bootAfterAuth = function(){ const r = _bootCali.apply(this, arguments); setTimeout(()=>{ loadCaliAdmin().then(()=>{ try{ if(temCali()){ caliRegenTudo(); } }catch(e){} }); }, 2200); return r; };
try{ caliAplicarAdmin(JSON.parse(mtLS('mt_cali_ex')||'[]')); }catch(e){}

Object.assign(window, { caliAbrirTroca, caliDefinirPos, caliPreferir, caliQual, caliMostrarSetup, openModalidade, openCaliAdmin, openCaliCadeias, caliEditarEx, caliSalvarEx, openCaliModelos, caliEditarModelo, caliSalvarModelo, caliConfigDominio,
  caliGerarWorkouts, caliNivelReal, caliDominio, CALI_CADEIAS });

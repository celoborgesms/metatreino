
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

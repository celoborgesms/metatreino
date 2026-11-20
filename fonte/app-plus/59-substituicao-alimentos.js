
// =====================================================================
// 59. Beta 55 — Substituição inteligente de alimentos (Alimentação)
// =====================================================================
// Ao tocar num alimento do cardápio, além de mudar a quantidade e de "não vou comer", aparece
// "Trocar por outro alimento". O app procura alimentos do MESMO grupo (fruta por fruta, proteína por
// proteína, carboidrato por carboidrato) que combinem com aquela refeição e calcula a quantidade que
// rende o mesmo nutriente principal (carboidrato da fruta, proteína da carne...). Só sugere quando a
// diferença de calorias fica pequena (até ~20% ou 25 kcal) e os outros nutrientes não destoam.
//  • Mostra: original × sugerido, as duas quantidades e a diferença de kcal, proteína, carbo e gordura.
//  • Só troca depois de confirmar. A troca vale para aquele dia e aquela refeição, só para a pessoa
//    (state.nutriLog é de cada um): o cardápio original, o prato da casa e a lista de compras não mudam.
//  • Respeita vegetariano, sem lactose e sem glúten. Não sugere salgados/doces de "fora da rotina".
//  • Sem troca equivalente, diz isso — não sugere qualquer coisa.
//  • Desfazer: tocar no alimento trocado → "Desfazer a troca" (o original volta).
// Modelo no registro do dia: original em adj[id] = {x:1, sub:novo}; o substituto em add[] = {id, q, subDe:id}.

const SUB_CARNES = ['presunto','frango','sobrecoxa','patinho','acem','lombo','figado','peixe','atum','sardinha','peru'];
// o que combina com cada tipo de refeição (proteínas e carboidratos); frutas, laticínios e o resto valem sempre
const SUB_REFEICAO = {
  leve: { proteinas:['ovo','presunto','peru','whey','atum','frango','tofu'], carbo:['pao','paoint','paoforma','paodq','tapioca','cuscuz','batata','mandioca','mandioquinha'], graos:['aveia','granola','milho'] },
  prato:{ proteinas:['frango','sobrecoxa','patinho','acem','lombo','figado','peixe','atum','sardinha','ovo','soja','tofu','peru'], carbo:['batata','batataing','mandioca','mandioquinha','cuscuz','pao','paoint'], graos:['arroz','arrozint','feijao','feijaopreto','lentilha','grao','macarrao','milho'] }
};
function _subCategoria(id){ for(const [k, v] of Object.entries(NUTRI_CATEG)){ if(k !== 'fora' && v[1].includes(id)) return k; } return null; }
function _subTipoRefeicao(mid){ return /almoco|jantar/.test(mid) ? 'prato' : 'leve'; }
function _subMacros(id, q){ const f = NUTRI_ALIMENTOS[id]; const g = f[5] ? q*f[5] : q; const k = g/100; return { kcal:f[1]*k, p:f[2]*k, c:f[3]*k, g:f[4]*k, gramas:g }; }
// nutriente que define a equivalência em cada grupo (índice no NUTRI_ALIMENTOS: 2 prot, 3 carbo, 4 gord, 1 kcal)
const SUB_CHAVE = { frutas:3, graos:3, carbo:3, proteinas:2, lat:2, outros:4, verduras:1 };
function _subArredonda(id, qBruta){
  const f = NUTRI_ALIMENTOS[id];
  if(f[5]) return Math.max(1, Math.round(qBruta));
  const passo = (id==='leite'||id==='iogurte') ? 50 : (f[6] && f[6].g <= 20 ? f[6].g : 5);
  return Math.max(passo, Math.round(qBruta/passo)*passo);
}
function subCandidatos(mid, fid, q0){
  const cat = _subCategoria(fid); if(!cat) return { cat:null, lista:[] };
  const n = nutriConfig();
  const proib = new Set([...(n.semLactose ? NUTRI_LACTOSE : []), ...(n.semGluten ? NUTRI_GLUTEN : []), ...(n.vegetariano ? SUB_CARNES : [])]);
  const fora = window.NUTRI_FORA_IDS || new Set();
  const o = _subMacros(fid, q0); const ci = SUB_CHAVE[cat] || 1;
  const permitidos = (SUB_REFEICAO[_subTipoRefeicao(mid)] || {})[cat];
  const alvoNut = ci === 1 ? o.kcal : [0, 0, o.p, o.c, o.g][ci];
  const out = [];
  NUTRI_CATEG[cat][1].forEach(id=>{
    if(id === fid || proib.has(id) || fora.has(id) || !NUTRI_ALIMENTOS[id]) return;
    if(id === 'whey' && fid !== 'whey') return;                       // suplemento só troca por suplemento
    if(permitidos && !permitidos.includes(id)) return;
    const f = NUTRI_ALIMENTOS[id]; const por = f[ci]; if(!por || por <= 0) return;
    const gramas = alvoNut / por * 100; const qB = f[5] ? gramas / f[5] : gramas;
    if(!isFinite(qB) || qB <= 0) return;
    const q = _subArredonda(id, qB);
    const s = _subMacros(id, q);
    // limites: quantidade que dá para comer de verdade e diferença pequena
    if(!f[5] && s.gramas > Math.max(400, o.gramas*3)) return;
    if(f[5] && q > 4) return;
    const dk = s.kcal - o.kcal, tolK = Math.max(25, o.kcal*0.2);
    if(Math.abs(dk) > tolK) return;
    if(cat === 'proteinas' && Math.abs(s.g - o.g) > Math.max(6, o.g*0.8)) return;     // carne magra × gordurosa
    if((cat === 'frutas' || cat === 'graos' || cat === 'carbo') && Math.abs(s.p - o.p) > Math.max(6, o.p)) return;
    const pena = Math.abs(dk)/Math.max(1, o.kcal) + Math.abs(s.p - o.p)/40 + Math.abs(s.g - o.g)/25 + Math.abs(s.c - o.c)/80;
    out.push({ id, q, s, dk, pena });
  });
  out.sort((a,b)=>a.pena - b.pena);
  return { cat, lista: out.slice(0, 5), o };
}
function _subFmtQ(id, q){ return nutriTextoQtd(id, q).replace(/^(\d+)\.5/, '$1,5'); }
function _subDif(v, u){ const r = Math.round(v); return r === 0 ? `±0${u}` : `${r > 0 ? '+' : '−'}${Math.abs(r)}${u}`; }

// botão no editor do alimento
mtGancho('nutriEdRender', { depois(){
  try{
    const e = window.__ned; const mi = $('modal-inner'); if(!e || !mi) return;
    if(e.mode === 'adj' && !mi.querySelector('#sub-btn')){
      const b = mi.querySelector('.btn.btn-primary'); if(!b) return;
      b.insertAdjacentHTML('afterend', `<button class="btn btn-outline btn-block" id="sub-btn" style="margin-top:8px" onclick="subAbrir('${e.mid}','${e.fid}')">🔄 Trocar por outro alimento</button>`);
    }
    // alimento que entrou numa troca: oferece desfazer
    if(e.mode === 'addedit'){
      const a = nutriMealLog(e.mid, false).add[e.idx];
      if(a && a.subDe && !mi.querySelector('#sub-desfaz')){
        const h = mi.querySelector('h3'); const orig = (NUTRI_ALIMENTOS[a.subDe]||[''])[0];
        if(h) h.insertAdjacentHTML('afterend', `<p class="sub-nota">🔄 Trocado no lugar de <b>${mtEsc(orig)}</b> só neste dia.</p>`);
        const b = mi.querySelector('.btn.btn-primary'); if(b) b.insertAdjacentHTML('afterend', `<button class="btn btn-ghost btn-block" id="sub-desfaz" style="margin-top:8px" onclick="subDesfazer('${e.mid}',${e.idx})">↩️ Desfazer a troca (volta ${mtEsc(orig)})</button>`);
      }
    }
  }catch(err){ console.log('substituição:', err); }
}});
function _subQAtual(mid, fid){
  const plano = nutriMontarPlano(nutriDiaSel()); if(plano.erro) return null;
  const meal = plano.refeicoes.find(m=>m.id === mid); const it = meal && meal.itens.find(i=>i.id === fid); if(!it) return null;
  const f = NUTRI_ALIMENTOS[fid]; const a = nutriMealLog(mid, false).adj[fid];
  const q = (a && a.q !== undefined) ? a.q : (f[5] ? Math.round(it.un*2)/2 : Math.round(it.gramas));
  return { q, meal };
}
function subAbrir(mid, fid){
  const A = _subQAtual(mid, fid); if(!A) return;
  const f = NUTRI_ALIMENTOS[fid]; const R = subCandidatos(mid, fid, A.q); const o = _subMacros(fid, A.q);
  window.__sub = { mid, fid, q:A.q, R };
  const linha = (c, i)=>`<button type="button" class="sub-op" onclick="subVer(${i})"><span class="sub-op-n"><b>${mtEsc(NUTRI_ALIMENTOS[c.id][0])}</b><small>${_subFmtQ(c.id, c.q)} · ${Math.round(c.s.kcal)} kcal <em class="${Math.abs(c.dk) < 10 ? 'ok' : ''}">(${_subDif(c.dk, ' kcal')})</em></small></span><span class="ii-seta">›</span></button>`;
  $('modal-inner').innerHTML = `<h3>🔄 Trocar ${mtEsc(f[0])}</h3>
    <p class="sub-p">No cardápio: <b>${_subFmtQ(fid, A.q)}</b> · ${Math.round(o.kcal)} kcal · P ${Math.round(o.p)} g · C ${Math.round(o.c)} g · G ${Math.round(o.g)} g</p>
    ${R.lista.length ? `<p class="sub-p">Opções do mesmo grupo, na quantidade que rende ${({3:'o mesmo carboidrato',2:'a mesma proteína',4:'a mesma gordura',1:'as mesmas calorias'})[SUB_CHAVE[R.cat]||1]}${R.cat==='frutas'?' da fruta':''}:</p>${R.lista.map(linha).join('')}
      <p class="sub-mini">A troca vale só para hoje${nutriDiaSel() !== ((typeof getDayIdx==='function') ? getDayIdx() : 1) ? ' (neste dia)' : ''}, só para você. O cardápio e a lista de compras continuam iguais.</p>`
      : `<div class="sub-vazio">Não encontrei uma troca equivalente para <b>${mtEsc(f[0])}</b> nesta refeição${(nutriConfig().semLactose || nutriConfig().semGluten || nutriConfig().vegetariano) ? ' com as suas restrições' : ''}. Em vez de sugerir qualquer alimento, prefiro não trocar: você pode ajustar a quantidade ou acrescentar outro alimento à refeição.</div>`}
    <button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="nutriEditar('${mid}','${fid}')">‹ Voltar</button>`;
  $('modal-back').classList.add('on');
}
function subVer(i){
  const S = window.__sub; if(!S) return; const c = S.R.lista[i]; if(!c) return;
  const o = S.R.o; const fo = NUTRI_ALIMENTOS[S.fid], fn = NUTRI_ALIMENTOS[c.id];
  const L = (n, a, b, u)=>`<tr><th>${n}</th><td>${Math.round(a)}${u}</td><td>${Math.round(b)}${u}</td><td class="${Math.abs(b-a) < (u===' kcal'?10:2) ? 'ok' : ''}">${_subDif(b - a, u)}</td></tr>`;
  $('modal-inner').innerHTML = `<h3>Confirmar a troca?</h3>
    <table class="sub-tab"><thead><tr><th></th><th>Original</th><th>Sugerido</th><th>Dif.</th></tr></thead><tbody>
      <tr><th>Alimento</th><td>${mtEsc(fo[0])}</td><td>${mtEsc(fn[0])}</td><td></td></tr>
      <tr><th>Qtd.</th><td>${_subFmtQ(S.fid, S.q)}</td><td>${_subFmtQ(c.id, c.q)}</td><td></td></tr>
      ${L('Calorias', o.kcal, c.s.kcal, ' kcal')}${L('Proteína', o.p, c.s.p, ' g')}${L('Carbo', o.c, c.s.c, ' g')}${L('Gordura', o.g, c.s.g, ' g')}
    </tbody></table>
    <p class="sub-mini">Só nesta refeição de hoje e só para você. Dá para desfazer tocando no alimento trocado.</p>
    <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="subConfirmar(${i})">✅ Trocar</button>
    <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="subAbrir('${S.mid}','${S.fid}')">‹ Ver outras opções</button>`;
}
function subConfirmar(i){
  const S = window.__sub; if(!S) return; const c = S.R.lista[i]; if(!c) return;
  const m = nutriMealLog(S.mid, true);
  m.add = (m.add||[]).filter(a=>a.subDe !== S.fid);              // uma troca por alimento
  m.adj[S.fid] = { x:1, sub:c.id };
  m.add.push({ id:c.id, q:c.q, subDe:S.fid });
  nutriLimpa(S.mid); nutriAbrirRef(S.mid); saveData(); window.__sub = null;
  toast(`🔄 ${NUTRI_ALIMENTOS[S.fid][0]} trocado por ${NUTRI_ALIMENTOS[c.id][0]}`);
  openNutri();
}
function subDesfazer(mid, idx){
  const m = nutriMealLog(mid, true); const a = m.add[idx]; if(!a || !a.subDe) return;
  m.add.splice(idx, 1); if(m.adj[a.subDe] && m.adj[a.subDe].sub) delete m.adj[a.subDe];
  nutriLimpa(mid); nutriAbrirRef(mid); saveData(); openNutri();
}
// tirar o substituto da refeição ou voltar o original pelo "não vou comer": a troca toda se desfaz junto
mtGancho('nutriEdSalvar', { antes(reset){
  try{ const e = window.__ned; if(!e || e.mode !== 'addedit' || !(reset || e.q === 0)) return;
    const m = nutriMealLog(e.mid, false); const a = m.add && m.add[e.idx]; if(a && a.subDe && m.adj[a.subDe] && m.adj[a.subDe].sub) delete m.adj[a.subDe]; }catch(err){}
}});
mtGancho('nutriRemover', { antes(mid, fid){
  try{ const m = nutriMealLog(mid, false); if(m.adj && m.adj[fid] && m.adj[fid].sub) m.add = (m.add||[]).filter(a=>a.subDe !== fid); }catch(err){}
}});
// o substituto aparece com "no lugar de …"
const _nutriItemExtraB55 = window.nutriItemExtra;
window.nutriItemExtra = function(a, idx){
  const r = _nutriItemExtraB55.apply(this, arguments);
  try{ if(r && a && a.subDe && NUTRI_ALIMENTOS[a.subDe]){ r.texto = `${r.texto} · no lugar de ${NUTRI_ALIMENTOS[a.subDe][0].toLowerCase()}`; r.troca = a.subDe; } }catch(e){}
  return r;
};

(function(){
  const st = document.createElement('style'); st.id = 'b55-sub-css';
  st.textContent = `
.sub-p{font-size:13px;color:var(--text-dim);line-height:1.5;margin:4px 0 10px}
.sub-op{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:12px 14px;margin-top:8px;border-radius:14px;border:1px solid var(--border);background:var(--surface-2,transparent);color:var(--text);font:inherit;cursor:pointer}
.sub-op-n{flex:1;min-width:0}.sub-op-n b{display:block;font-size:14px}.sub-op-n small{display:block;font-size:12.5px;color:var(--text-dim);margin-top:2px}
.sub-op em{font-style:normal;color:var(--accent-2,#f5b041)}.sub-op em.ok{color:var(--primary-2)}
.sub-mini{font-size:11.5px;color:var(--text-mute);line-height:1.5;margin-top:10px}
.sub-vazio{padding:14px;border-radius:14px;background:var(--surface-2,rgba(255,255,255,.04));font-size:13px;line-height:1.55;color:var(--text-dim)}
.sub-nota{font-size:12.5px;color:var(--text-dim);margin:4px 0 10px}
.sub-tab{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:6px;table-layout:fixed}
.sub-tab th,.sub-tab td{padding:7px 4px;border-bottom:1px solid var(--border);text-align:right;overflow-wrap:anywhere}
.sub-tab th:first-child{text-align:left;color:var(--text-dim);font-weight:600;width:24%;overflow-wrap:normal}
.sub-tab th:last-child,.sub-tab td:last-child{width:19%}
.sub-tab thead th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-mute)}
.sub-tab td.ok{color:var(--primary-2)}
`;
  document.head.appendChild(st);
})();
Object.assign(window, { subAbrir, subVer, subConfirmar, subDesfazer, subCandidatos });

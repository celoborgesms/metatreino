
// =====================================================================
// 75. RC 2 — Cardápio compartilhado: alcance das mudanças do administrador (sem perguntar toda vez)
// ---------------------------------------------------------------------
// Como era (parte 49): o administrador, ao TIRAR ou ACRESCENTAR alimento num prato compartilhado, respondia
// "todos ou só eu?" a cada vez. Já ao TROCAR O PRATO, valia para todos direto, sem perguntar e sem desfazer.
// O que muda:
//  • Dentro de cada refeição compartilhada (só para o administrador, só em dia editável) aparece a linha
//    "Suas mudanças valem para:  Perguntar | Só para mim | Grupo todo". A escolha fica guardada
//    (nutriConfig().famAlcance) e muda com um toque, no lugar onde a mudança acontece.
//  • Vale para: tirar alimento, acrescentar alimento e trocar o prato. "Perguntar" é o padrão (comportamento
//    antigo) e a pergunta ganhou "lembrar esta escolha".
//  • Toda mudança para o GRUPO mostra "Desfazer" por 7 segundos (tirar alimento e trocar prato). Tirar só para
//    mim também pode ser desfeito.
//  • Não mudam: quantidade/porção (sempre pessoal), "Comi" (pessoal), lista de compras (Só eu / Grupo todo já é
//    uma visão, não uma exclusão), quem não é administrador (continua sem mexer no prato do grupo; a regra do
//    Firestore também barra). Alimento digitado à mão continua só para quem acrescentou.
// =====================================================================
function famAlcance(){ const n = nutriConfig(); return n.famAlcance === 'eu' || n.famAlcance === 'grupo' ? n.famAlcance : null; }
function famAlcanceDefine(v){ const n = nutriConfig(); if(v === 'eu' || v === 'grupo') n.famAlcance = v; else delete n.famAlcance; saveData(); }
function famAlcanceToca(v){
  famAlcanceDefine(v);
  document.querySelectorAll('.fam-alc .fam-alc-b').forEach(b=>b.classList.toggle('on', b.dataset.v === (v || 'perguntar')));
  toast(v === 'grupo' ? 'Suas mudanças nas refeições compartilhadas valem para o grupo todo (com Desfazer).' : v === 'eu' ? 'Suas mudanças nas refeições compartilhadas valem só para você.' : 'O app vai perguntar a cada mudança.');
}
// "Desfazer" discreto
let _famDesfT = null;
function famDesfazer(txt, fn){
  let el = document.getElementById('mt-desfazer');
  if(!el){ el = document.createElement('div'); el.id = 'mt-desfazer'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  window.__famDesfFn = fn;
  el.innerHTML = `<span>${mtEsc(txt)}</span><button type="button" onclick="famDesfazerAgora()">Desfazer</button>`;
  el.classList.add('on'); clearTimeout(_famDesfT);
  _famDesfT = setTimeout(()=>{ el.classList.remove('on'); window.__famDesfFn = null; }, 7000);
}
function famDesfazerAgora(){
  const fn = window.__famDesfFn; window.__famDesfFn = null; clearTimeout(_famDesfT);
  const el = document.getElementById('mt-desfazer'); if(el) el.classList.remove('on');
  if(fn) try{ fn(); toast('Desfeito.'); }catch(e){ console.log('desfazer:', e); }
}
// pergunta com "lembrar"
function famPerguntaAlcance(titulo, texto, fGrupo, fEu, rotGrupo, rotEu){
  window.__famLembrar = true;
  famEscolha(titulo, texto + '<label class="fam-lembrar"><input type="checkbox" checked onchange="window.__famLembrar=this.checked"> Lembrar esta escolha (dá para mudar dentro da refeição)</label>', [
    { t:rotGrupo, f:()=>{ if(window.__famLembrar) famAlcanceDefine('grupo'); fGrupo(); } },
    { t:rotEu, f:()=>{ if(window.__famLembrar) famAlcanceDefine('eu'); fEu(); } }
  ]);
}
// ---------- tirar alimento ----------
function _famTiraGrupo(mid, fid){
  famTirarDaCasa(mid, fid);
  const nome = (NUTRI_ALIMENTOS[fid]||[''])[0];
  famDesfazer(`${nome} tirado do prato do grupo.`, ()=>famVoltarNaCasa(mid, fid));
}
function _famTiraEu(mid, fid){
  _nutriRemoverB49(mid, fid);
  const nome = (NUTRI_ALIMENTOS[fid]||[''])[0];
  famDesfazer(`${nome} tirado só do seu prato.`, ()=>{ _nutriRemoverB49(mid, fid); });
}
window.nutriRemover = function(mid, fid){
  if(!famSouAdm() || !famCompartilhada(mid)) return _nutriRemoverB49.apply(this, arguments);
  const m = nutriMealLog(mid, false);
  if(m && m.adj && m.adj[fid] && m.adj[fid].x) return _nutriRemoverB49.apply(this, arguments);     // desfazer o "só eu"
  const a = famAlcance();
  if(a === 'grupo') return _famTiraGrupo(mid, fid);
  if(a === 'eu') return _famTiraEu(mid, fid);
  const nome = (NUTRI_ALIMENTOS[fid]||[''])[0];
  famPerguntaAlcance('Tirar ' + nome, 'Você administra o cardápio compartilhado. Isso vale para todos ou só para você?',
    ()=>_famTiraGrupo(mid, fid), ()=>_famTiraEu(mid, fid), 'Tirar do prato do grupo (todos)', 'Só eu não vou comer');
};
// ---------- acrescentar alimento ----------
window.nutriAddAbrir = function(mid){
  window.__famAddCasa = false;
  if(!famSouAdm() || !famCompartilhada(mid)) return _nutriAddAbrirB49.apply(this, arguments);
  const a = famAlcance();
  if(a){ window.__famAddCasa = a === 'grupo'; return _nutriAddAbrirB49(mid); }
  famPerguntaAlcance('Acrescentar alimento', 'Acrescentar ao prato compartilhado (todos recebem, cada um na própria proporção) ou só para você?',
    ()=>{ window.__famAddCasa = true; _nutriAddAbrirB49(mid); }, ()=>{ window.__famAddCasa = false; _nutriAddAbrirB49(mid); },
    'Acrescentar ao prato do grupo', 'Só para mim');
};
// ---------- trocar o prato ----------
(function(){
  const _troca = window.nutriTrocar; if(typeof _troca !== 'function') return;
  window.nutriTrocar = function(chave){
    try{
      const mid = String(chave).replace(/v$/,''); const P = famParams(); const d = nutriDiaSel(), dk = nutriKeyDia(d);
      const grupoDoDia = P && P.casa && famSouAdm() && famDaCasaNoDia(P, mid, d, dk) && !famFora(dk, mid);
      if(grupoDoDia){
        const a = famAlcance();
        const soEu = ()=>{ const n = nutriConfig(); n.famFora = n.famFora || {}; n.famFora[_famForaKey(dk, mid)] = 1;
          try{ const dia = (state.nutriLog||{})[dk]; if(dia) delete dia[mid]; }catch(e){}
          nutriAbrirRef(chave); saveData(); openNutri(); famDesfazer('Prato trocado só para você neste dia.', ()=>famVoltarCasa(mid)); };
        const grupo = ()=>{
          const c = famCache() || {}; const antT = ((c.config||{}).trocas||{})[chave]; const antC = c.cardapio && c.cardapio[dk] ? c.cardapio[dk][mid] : undefined;
          _troca.call(this, chave);
          famDesfazer('Prato do grupo trocado para todos.', ()=>{
            const c2 = famCache(); c2.config = c2.config || {}; c2.config.trocas = c2.config.trocas || {};
            const campos = {};
            if(antT == null){ delete c2.config.trocas[chave]; campos['config.trocas.' + chave] = firebase.firestore.FieldValue.delete(); }
            else { c2.config.trocas[chave] = antT; campos['config.trocas.' + chave] = antT; }
            if(antC !== undefined){ c2.cardapio = c2.cardapio || {}; c2.cardapio[dk] = c2.cardapio[dk] || {}; c2.cardapio[dk][mid] = antC; campos['cardapio.' + dk + '.' + mid] = antC; }
            _famGuardaCache(c2); _famAtualiza(campos); famAgendaEnvio(); saveData(); openNutri();
          });
        };
        if(a === 'eu') return soEu();
        if(a === 'grupo') return grupo();
        return famPerguntaAlcance('Trocar o prato', `Você administra o cardápio compartilhado. Trocar o prato de ${NUTRI_DIAS[d-1].toLowerCase()} para todos ou só para você neste dia?`,
          grupo, soEu, 'Trocar para o grupo todo', 'Só para mim neste dia');
      }
    }catch(e){ console.log('trocar prato (alcance):', e); }
    return _troca.apply(this, arguments);
  };
})();
// ---------- a linha de alcance dentro das refeições compartilhadas ----------
mtGancho('openNutri', { depois(){
  try{
    if(typeof famAtiva !== 'function' || !famAtiva() || !famSouAdm()) return;
    if(nutriDiaSel() < getDayIdx()) return;
    const mi = $('modal-inner'); if(!mi) return;
    const a = famAlcance() || 'perguntar';
    mi.querySelectorAll('.fam-info').forEach(fi=>{
      if(fi.querySelector('.fam-alc') || !/Prato compartilhado/.test(fi.textContent)) return;
      fi.insertAdjacentHTML('beforeend', `<div class="fam-alc" role="group" aria-label="Suas mudanças valem para"><span>Suas mudanças valem para:</span>
        ${[['perguntar','Perguntar'],['eu','Só para mim'],['grupo','Grupo todo']].map(([v,t])=>`<button type="button" class="fam-alc-b ${v===a?'on':''}" data-v="${v}" onclick="famAlcanceToca(${v==='perguntar'?'null':`'${v}'`})">${t}</button>`).join('')}</div>`);
    });
  }catch(e){}
}});
(function(){ if(document.getElementById('fam-alc-css')) return; const s = document.createElement('style'); s.id = 'fam-alc-css';
s.textContent = `.fam-alc{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;font-size:12px;color:var(--text-dim)}
.fam-alc>span{width:100%}
.fam-alc-b{flex:1;min-height:34px;padding:4px 8px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text-dim);font:inherit;font-weight:700;font-size:12px;cursor:pointer}
.fam-alc-b.on{border-color:var(--primary);color:var(--text);background:rgba(var(--primary-rgb),.14)}
.fam-lembrar{display:flex;gap:8px;align-items:center;margin-top:10px;font-size:13px}
#mt-desfazer{position:fixed;left:12px;right:12px;bottom:calc(92px + env(safe-area-inset-bottom));z-index:500;max-width:480px;margin:0 auto;display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:14px;background:var(--text-strong,#fff);color:var(--bg,#000);font-size:13.5px;box-shadow:var(--shadow-md);transform:translateY(20px);opacity:0;pointer-events:none;transition:all .25s ease}
#mt-desfazer.on{transform:none;opacity:1;pointer-events:auto}
#mt-desfazer span{flex:1}
#mt-desfazer button{border:none;background:none;color:var(--primary-2,var(--primary));font:inherit;font-weight:900;cursor:pointer;padding:6px}`; document.head.appendChild(s); })();

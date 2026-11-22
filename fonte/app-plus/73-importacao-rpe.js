
// =====================================================================
// 73. RC 2 — Importação: esforço percebido (RPE), treino do plano certo e fim da importação de musculação
// ---------------------------------------------------------------------
// O que foi encontrado (parte 57):
//  • A atividade importada era salva SEM esforço. O motor da corrida usa (+r.rpe||5): toda importação
//    entrava como 5/10, sem o aluno ter dito nada.
//  • "Contar como o treino do plano deste dia" gravava o id do treino, mas não o tipo de sessão nem o
//    estágio. Para o iniciante (estágios caminhada + corrida) a importação NUNCA contava para avançar.
//  • Só dava para ligar ao treino do MESMO dia da semana: treino feito em outro dia virava avulso.
//  • Arquivo FIT: o formato tem campos próprios para o esforço que o aluno responde no relógio
//    (sessão, campos 192 "workout_feel" 0–100 e 193 "workout_rpe" 0–100 = RPE×10). O leitor usado
//    (fit-file-parser) não os entrega, então esta parte lê os bytes da mensagem de sessão.
//    O arquivo do Zepp (Amazfit T-Rex 3 Pro) enviado pelo aluno NÃO tem esses campos: traz "efeito de treino"
//    (4,3) e "carga" (113), que são cálculos do relógio e NÃO são esforço percebido — não são usados.
//    GPX e TCX não têm campo de esforço percebido.
// O que muda:
//  • Prévia da importação: se o arquivo trouxe workout_rpe válido (1–10), mostra "Esforço informado no relógio"
//    e não pergunta. Se não trouxe, mostra a MESMA régua 1–10 do registro manual, SEM nada marcado; salvar sem
//    responder continua valendo (fica sem esforço, como antes, sem valor inventado).
//  • Ligar a um treino do plano: escolha entre os treinos da semana ainda não feitos (o do dia vem marcado).
//    O registro leva tipo de sessão e estágio, como no registro manual.
//  • Depois de importar, dá para informar o esforço no detalhe da atividade (se ainda não tiver).
//  • Musculação: um arquivo de força não é mais importado (o relógio quase nunca grava séries/cargas e a
//    correspondência de exercícios era pobre). Registro manual, histórico e as importações antigas continuam.
// Registros antigos não são alterados.
// =====================================================================

// ---------- 1. FIT: esforço percebido na mensagem de sessão (global 18), campos 192/193 ----------
function atvFitRpe(buf){
  try{
    const b = new Uint8Array(buf); const dv = new DataView(buf instanceof ArrayBuffer ? buf : b.buffer);
    const hs = b[0]; if(hs !== 12 && hs !== 14) return null;
    if(String.fromCharCode(b[8], b[9], b[10], b[11]) !== '.FIT') return null;
    const tam = dv.getUint32(4, true); const fim = Math.min(b.length, hs + tam);
    const defs = {}; let p = hs; let achou = null;
    while(p < fim){
      const h = b[p++];
      if(h & 0x80){                                  // cabeçalho de horário comprimido: mensagem de dados
        const d = defs[(h >> 5) & 0x3]; if(!d) return achou; p += d.tam; continue;
      }
      const local = h & 0x0F;
      if(h & 0x40){                                  // definição
        const temDev = !!(h & 0x20);
        const le = b[p+1] === 0; const glob = le ? dv.getUint16(p+2, true) : dv.getUint16(p+2, false); const nf = b[p+4];
        let q = p + 5; const campos = []; let t = 0;
        for(let i=0; i<nf; i++){ campos.push({ n:b[q], s:b[q+1], off:t }); t += b[q+1]; q += 3; }
        if(temDev){ const nd = b[q]; q++; for(let i=0; i<nd; i++){ t += b[q+1]; q += 3; } }
        defs[local] = { glob, campos, tam:t }; p = q; continue;
      }
      const d = defs[local]; if(!d) return achou;
      if(d.glob === 18){
        const ler = n=>{ const c = d.campos.find(x=>x.n === n); if(!c || c.s !== 1) return null; const v = b[p + c.off]; return v === 0xFF ? null : v; };
        const rpe = ler(193), feel = ler(192);
        if(rpe != null || feel != null) achou = { rpe10: rpe, feel };
      }
      p += d.tam;
    }
    return achou;
  }catch(e){ return null; }
}
// RPE do arquivo: só aceita 1..10 (workout_rpe vem ×10; 0 = não respondido)
function atvRpeDoArquivo(info){
  if(!info || info.rpe10 == null) return null;
  const v = Math.round(info.rpe10 / 10);
  return (v >= 1 && v <= 10) ? v : null;
}

// ---------- 2. processar: lê o esforço; recusa musculação ----------
(function(){
  const _proc = window.atvProcessaArquivo; if(typeof _proc !== 'function') return;
  window.atvProcessaArquivo = async function(f){
    const R = await _proc.apply(this, arguments);
    if(R && R.A && R.A.esporte === 'musculacao'){
      throw { usuario:'Este arquivo é de um treino de musculação/força. A importação de musculação foi retirada: os relógios quase nunca gravam as séries e as cargas, e os exercícios não batiam com a biblioteca. Registre o treino em Treinos (fica certinho na evolução de carga).' };
    }
    try{
      R.rpe = null; R.rpeArq = null;
      if(R.A && R.A.formato === 'fit'){ const buf = R.buf || await f.arrayBuffer(); const v = atvRpeDoArquivo(atvFitRpe(buf)); if(v){ R.rpeArq = v; R.rpe = v; } }
    }catch(e){}
    return R;
  };
})();
// trocar a modalidade na prévia: musculação deixou de existir como opção
(function(){
  const _t = window.atvTrocaEsporte; if(typeof _t !== 'function') return;
  window.atvTrocaEsporte = function(e){ if(e === 'musculacao') return; return _t.apply(this, arguments); };
})();

// ---------- 3. treinos do plano desta semana ainda não feitos ----------
function atvTreinosAbertos(esporte, ts){
  try{
    if(esporte !== 'corrida' && esporte !== 'caminhada') return [];
    const mod = state.modules.run; if(!mod || !mod.plan) return [];
    const sem = (typeof rSem === 'function') ? rSem(ts) : null; if(sem == null || sem !== rSem()) return [];
    const ini = (typeof planStartTs === 'function' && planStartTs(mod)) || mod.createdAt || 0; if(ini && ts < _atvDia(ini)) return [];
    const feitos = new Set((mod.history||[]).filter(h=>h && h.at >= sem && h.at < sem + 7*86400000 && h.id).map(h=>h.id));
    return (mod.plan.workouts||[]).filter(w=>w && w.k && !feitos.has(w.k) && !(w.motor && w.motor.tipo === 'prova'));
  }catch(e){ return []; }
}

// ---------- 4. prévia: régua de esforço e escolha do treino ----------
(function(){
  const _prev = window.atvPrevia; if(typeof _prev !== 'function') return;
  window.atvPrevia = function(){
    const r = _prev.apply(this, arguments);
    try{
      const R = _atvAtual; const mi = $('modal-inner'); if(!R || !mi || !mi.querySelector('#integ-previa')) return r;
      const sel = $('ip-esp'); if(sel){ const o = sel.querySelector('option[value="musculacao"]'); if(o) o.remove(); }
      const A = R.A; const salvar = [...mi.querySelectorAll('.btn-primary')].find(b=>/Salvar atividade/.test(b.textContent));
      if(!salvar) return r;
      // treino do plano: lista os da semana ainda não feitos (o do dia, se houver, vem escolhido)
      const ab = atvTreinosAbertos(A.esporte, A.inicio);
      const doDia = (typeof _atvTreinoDoDia === 'function') ? _atvTreinoDoDia(A.esporte === 'caminhada' ? 'corrida' : A.esporte, A.inicio) : null;
      const velho = mi.querySelector('.ip-plano'); if(velho) velho.remove();
      if(ab.length){
        const marcado = R.planoK !== undefined ? R.planoK : (doDia ? doDia.k : '');
        salvar.insertAdjacentHTML('beforebegin', `<label class="ip-campo ip-plano2"><small>Este treino era do seu plano?</small>
          <select id="ip-plano2" onchange="_atvAtual.planoK=this.value">
            <option value="">Não: foi uma atividade extra</option>
            ${ab.map(w=>`<option value="${w.k}" ${w.k===marcado?'selected':''}>${mtEsc((RUN_DIAS && RUN_DIAS[w.dayIdx-1]) || '')} · ${mtEsc(w.name)}</option>`).join('')}
          </select></label>`);
        if(R.planoK === undefined) R.planoK = marcado;
      } else R.planoK = '';
      // esforço percebido
      let bloco;
      if(R.rpeArq){
        bloco = `<div class="ip-rpe"><small>Esforço percebido</small><div><b>${R.rpeArq}/10</b> · informado no relógio (${mtEsc(RPE_LBL[R.rpeArq] || '')})</div></div>`;
      } else {
        bloco = `<div class="ip-rpe" id="ip-rpe"><small>Quanto esforço você sentiu? <span class="mt-muted">(opcional — o arquivo não trouxe)</span></small>${rpeHtml(5)}
          <button type="button" class="link-mais" id="ip-rpe-limpa" onclick="atvRpeLimpa()" style="margin-top:4px">Não informar</button></div>`;
      }
      salvar.insertAdjacentHTML('beforebegin', bloco);
      if(!R.rpeArq){ if(R.rpe) rpeSet(R.rpe); else atvRpeLimpa(true); }
    }catch(e){ console.log('prévia RPE:', e); }
    return r;
  };
})();
function atvRpeLimpa(silencio){
  const R = _atvAtual; if(R) R.rpe = null; window.__rpe = null;
  const box = $('ip-rpe'); if(!box) return;
  box.querySelectorAll('.rpe2-c').forEach(b=>{ b.classList.remove('on','abaixo'); b.setAttribute('aria-checked','false'); });
  const l = box.querySelector('#rpe-lbl'); if(l) l.innerHTML = '<span class="rpe2-txt"><small>Toque num número para informar. Sem resposta, a atividade fica sem esforço (o plano não inventa um valor).</small></span>';
  const bt = $('ip-rpe-limpa'); if(bt) bt.style.display = 'none';
}
(function(){
  const _set = window.rpeSet; if(typeof _set !== 'function') return;
  window.rpeSet = function(n){
    const r = _set.apply(this, arguments);
    try{
      if($('ip-rpe') && _atvAtual){ _atvAtual.rpe = Math.min(10, Math.max(1, Math.round(+n)||5)); const bt = $('ip-rpe-limpa'); if(bt) bt.style.display = ''; }
      if($('rpe-depois') && window.__rpeDepois) window.__rpeDepois.v = Math.min(10, Math.max(1, Math.round(+n)||5));
    }catch(e){}
    return r;
  };
})();

// ---------- 5. salvar: esforço, tipo de sessão e estágio no registro ----------
(function(){
  const _salvar = window.atvSalvar; if(typeof _salvar !== 'function') return;
  window.atvSalvar = function(A, op){
    op = op || {};
    const R = _atvAtual;
    try{
      if(R && R.A === A && R.planoK !== undefined){
        const w = R.planoK ? ((state.modules.run||{}).plan||{}).workouts.find(x=>x.k === R.planoK) : null;
        op.plano = w || null;
      }
    }catch(e){}
    const res = _salvar.apply(this, arguments);
    try{
      if(res && res.id && A.esporte !== 'musculacao'){
        const e = ((state.modules.run||{}).history||[]).find(x=>x && x.imp && x.imp.id === res.id);
        if(e){
          const rpe = R && R.A === A ? R.rpe : null;
          if(rpe && !e.rpe){ e.rpe = rpe; e.rpeFonte = (R && R.rpeArq) ? 'relogio' : 'aluno'; }
          if(op.plano && op.plano.motor && !e.tipoSessao){
            e.tipoSessao = op.plano.motor.tipo;
            if(op.plano.motor.estagio !== undefined) e.estagio = op.plano.motor.estagio;
            if(e.id !== op.plano.k) e.id = op.plano.k;
          }
          try{ if(typeof _rSyncAt !== 'undefined'){ _rSyncAt = 0; runSync(); } }catch(x){}
        }
      }
    }catch(err){ console.log('importação (plano/RPE):', err); }
    return res;
  };
})();

// ---------- 6. detalhe: informar o esforço depois ----------
(function(){
  const _ab = window.openAtividade; if(typeof _ab !== 'function') return;
  window.openAtividade = function(mk, idx){
    const r = _ab.apply(this, arguments);
    Promise.resolve(r).then(()=>{ try{ _atvRpeNoDetalhe(mk, idx); }catch(e){} });
    return r;
  };
})();
function _atvRpeNoDetalhe(mk, idx){
    {
      const x = (((state.modules[mk]||{}).history)||[])[idx]; const mi = $('modal-inner'); if(!x || !mi || mk !== 'run' || mi.querySelector('#atv-rpe-det')) return;
      const alvo = [...mi.querySelectorAll('.btn')].pop(); if(!alvo) return;
      const linha = x.rpe ? `<p class="integ-mini" style="margin-top:10px">Esforço percebido: <b>${x.rpe}/10</b>${x.rpeFonte === 'relogio' ? ' (informado no relógio)' : ''} · <a href="#" onclick="atvRpeDepois('${mk}',${idx});return false">alterar</a></p>`
        : `<button type="button" class="btn btn-ghost btn-block" style="margin-top:10px" onclick="atvRpeDepois('${mk}',${idx})">Informar o esforço percebido</button>`;
      alvo.insertAdjacentHTML('beforebegin', '<div id="atv-rpe-det">' + linha + '</div>');
    }
}
function atvRpeDepois(mk, idx){
  const x = (((state.modules[mk]||{}).history)||[])[idx]; if(!x) return;
  window.__rpeDepois = { mk, idx, v: x.rpe || null };
  $('modal-inner').innerHTML = `<div id="rpe-depois"><h3>Esforço percebido</h3><p class="integ-mini">${mtEsc(String(x.name||'').replace(/^[^\wÀ-ú]+/,''))} · ${new Date(x.at).toLocaleDateString('pt-BR')}</p>
    ${rpeHtml(x.rpe || 5)}
    <div class="row" style="gap:8px;margin-top:14px"><button class="btn btn-ghost btn-block" onclick="openAtividade('${mk}',${idx})">Voltar</button>
    <button class="btn btn-primary btn-block" onclick="atvRpeDepoisSalva()">Salvar</button></div></div>`;
  window.__rpeDepois.v = window.__rpe;
  $('modal-back').classList.add('on');
}
function atvRpeDepoisSalva(){
  const d = window.__rpeDepois; if(!d) return;
  const x = (((state.modules[d.mk]||{}).history)||[])[d.idx]; if(!x) return;
  x.rpe = d.v || window.__rpe; x.rpeFonte = 'aluno'; window.__rpeDepois = null;
  saveData(); try{ if(typeof _rSyncAt !== 'undefined'){ _rSyncAt = 0; runSync(); } }catch(e){}
  toast('Esforço salvo. O plano passa a considerar esse treino.');
  openAtividade(d.mk, d.idx);
}
// textos da tela de integrações: FIT não promete mais musculação
mtGancho('openIntegracoes', { depois(){
  try{ const mi = $('modal-inner'); mi.querySelectorAll('.integ-fmt span').forEach(s=>{ if(/musculação com séries/.test(s.textContent)) s.textContent = 'O mais completo: frequência cardíaca, ritmo, altitude, cadência, voltas e, quando o relógio grava, o esforço que você respondeu no fim. Treinos de musculação: registre em Treinos.'; }); }catch(e){}
}});
(function(){ if(document.getElementById('imp-rpe-css')) return; const s = document.createElement('style'); s.id = 'imp-rpe-css';
s.textContent = `.ip-rpe{margin:12px 0 4px;padding:12px;border-radius:14px;border:1px solid var(--border);background:var(--surface)}
.ip-rpe>small{display:block;font-size:12.5px;color:var(--text-dim);margin-bottom:8px}
.ip-plano2{display:flex;flex-direction:column;gap:4px;margin:12px 0 0}
.ip-plano2 select{width:100%}`; document.head.appendChild(s); })();

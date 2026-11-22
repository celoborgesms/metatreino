
// =====================================================================
// 71. RC 1/RC 2 — vibração: pulsos que se sentem, diagnóstico e nenhum controle enganoso
// ---------------------------------------------------------------------
// RC 1: pulsos de 1–19 ms viram 25 ms (motores de celular não giram com 3–8 ms) e toques curtos não
// cortam mais o alarme do fim do descanso.
// RC 2 (relato: "Testar vibração" não vibra no Android, com economia de bateria, Não perturbe e perfil de
// som conferidos, e outros apps vibrando):
//  • O app chama navigator.vibrate de verdade (teste: o cronômetro chama 1 vez no fim, com a página visível).
//    Num toque direto do aluno (botão de teste) não há bloqueio do app. Se nada vibra, quem descarta é o
//    navegador/sistema. Há relato de que o Chrome no Android ignora vibração de sites no modo silencioso.
//  • O navegador NÃO diz se o motor girou: navigator.vibrate() devolve true mesmo sem efeito físico.
//    Por isso o teste pergunta ao aluno "Sentiu?" e guarda a resposta NESTE aparelho (localStorage
//    "mt_vib_ok": '1' sentiu, '0' não sentiu).
//  • Diagnóstico separa: (1) API inexistente → sem opção de vibrar; (2/3) chamada recusada pelo navegador
//    (retorno false ou sem interação ainda); (4) chamada aceita sem efeito físico (resposta "não senti");
//    (5) integração do cronômetro: registro das últimas chamadas em __vibDiag (o teste automático confere).
//  • Sem efeito físico confirmado ("não senti") ou sem API: os controles de vibração somem do Som do
//    cronômetro e do cronômetro, e o fim do descanso fica no som e na tela. "Testar de novo" volta a oferecer.
//  • O APK (TWA) usa o Chrome por dentro: tem o mesmo comportamento.
// =====================================================================
(function(){
  try{
    if(!('vibrate' in navigator) || navigator.__mtVibra) return;
    const orig = navigator.vibrate.bind(navigator);
    let alarmeAte = 0;
    const total = p => Array.isArray(p) ? p.reduce((t,x)=>t+(+x||0),0) : (+p||0);
    const reforca = p => {
      if(Array.isArray(p)) return p.map((x,i)=> (i % 2 === 0 && +x > 0 && +x < 20) ? 25 : x);
      return (+p > 0 && +p < 20) ? 25 : p;
    };
    const anota = (p, r)=>{ try{ const d = window.__vibDiag = window.__vibDiag || [];
      d.push({ em:Date.now(), p:JSON.stringify(p), ret:r, ativo: navigator.userActivation ? !!navigator.userActivation.hasBeenActive : null, vis:document.visibilityState });
      if(d.length > 12) d.shift(); }catch(e){} };
    const novo = function(p){
      const t = total(p);
      if(t <= 0) { alarmeAte = 0; const r = orig(p); anota(p, r); return r; }      // cancelar sempre passa
      const agora = Date.now();
      if(t < 120 && agora < alarmeAte) return true;                                // não corta o alarme do descanso
      if(t > 250) alarmeAte = agora + t;
      let r = false; try{ r = orig(reforca(p)); }catch(e){ r = false; }
      anota(p, r); return r;
    };
    navigator.vibrate = novo; navigator.__mtVibra = true;
  }catch(e){ console.log('vibração:', e); }
})();
// a vibração vale a pena oferecer NESTE aparelho?  'sem-api' | 'nao-sentiu' | 'ok' | 'nao-testado'
function mtVibEstado(){
  if(!('vibrate' in navigator)) return 'sem-api';
  let v = null; try{ v = localStorage.getItem('mt_vib_ok'); }catch(e){}
  return v === '0' ? 'nao-sentiu' : v === '1' ? 'ok' : 'nao-testado';
}
function mtVibOferecer(){ const e = mtVibEstado(); return e === 'ok' || e === 'nao-testado'; }
function mtTestarVibracao(){
  const st = document.getElementById('mt-vib-status');
  const est = mtVibEstado();
  if(est === 'sem-api'){
    if(st) st.innerHTML = 'Este navegador não oferece vibração (iPhone e alguns navegadores). O fim do descanso avisa pelo som e pela tela.';
    return 'sem-api';
  }
  const ativo = navigator.userActivation ? navigator.userActivation.hasBeenActive : true;
  let ret = false; try{ ret = !!navigator.vibrate(400); }catch(e){ ret = false; }
  if(!st) return ret ? 'enviado' : 'recusado';
  if(!ret){
    st.innerHTML = ativo ? '<b>O navegador recusou a vibração</b> (a chamada voltou negada). Abra o MetaTreino pelo Chrome atualizado e tente de novo.'
                         : '<b>O navegador ainda não liberou a vibração</b>: toque em qualquer lugar do app e tente de novo.';
    return 'recusado';
  }
  st.innerHTML = `O pedido de 400 ms foi aceito pelo navegador. <b>Sentiu o celular vibrar?</b>
    <span class="row" style="gap:8px;margin-top:8px;display:flex"><button type="button" class="btn btn-ghost btn-block" onclick="mtVibResposta(true)">Sim, vibrou</button>
    <button type="button" class="btn btn-ghost btn-block" onclick="mtVibResposta(false)">Não senti</button></span>`;
  return 'enviado';
}
function mtVibResposta(sentiu){
  try{ localStorage.setItem('mt_vib_ok', sentiu ? '1' : '0'); }catch(e){}
  if(!sentiu){ try{ localStorage.setItem('mt_descanso_vibrar', '0'); }catch(e){} }
  try{ if(typeof restDesenha === 'function' && restTimerInt) restDesenha(); }catch(e){}
  if(sentiu) toast('Vibração confirmada neste aparelho.');
  else toast('Entendido: neste aparelho o fim do descanso avisa pelo som e pela tela.');
  try{ openSomFim(); }catch(e){}
}
function mtVibTestarDeNovo(){ try{ localStorage.removeItem('mt_vib_ok'); }catch(e){} try{ openSomFim(); }catch(e){} }
mtGancho('openSomFim', { depois(){
  try{
    const mi = $('modal-inner'); if(!mi || mi.querySelector('#mt-vib-teste')) return;
    const est = mtVibEstado();
    // o par "Vibrar / Sem vibrar" (do núcleo): some quando a vibração não funciona neste aparelho
    const bts = [...mi.querySelectorAll('button, .opt, .seg')].filter(b=>/^\s*(Vibrar|Sem vibrar)\s*$/.test(b.textContent));
    const par = bts.length ? bts[0].parentElement : null;
    const ps = [...mi.querySelectorAll('p')]; const aviso = ps.find(p=>/vibração depende/.test(p.textContent));
    if(!mtVibOferecer()){
      if(par) par.style.display = 'none';
      if(aviso) aviso.textContent = 'No modo silencioso do celular o som pode não tocar.';
      const txt = est === 'sem-api' ? 'Este navegador não oferece vibração. O fim do descanso avisa pelo som e pela tela.'
        : 'Vibração: no teste, este aparelho não vibrou pelo navegador, então ela foi desligada aqui. O fim do descanso avisa pelo som e pela tela.';
      const bloco = `<div id="mt-vib-teste" class="mt-vib-off"><p class="mt-muted" style="font-size:12.5px;line-height:1.5;margin:10px 0 4px">${txt}</p>
        ${est === 'sem-api' ? '' : '<button type="button" class="link-mais" onclick="mtVibTestarDeNovo()">Testar de novo</button>'}</div>`;
      (par || aviso || mi.lastElementChild).insertAdjacentHTML('afterend', bloco);
      return;
    }
    const bloco = `<div id="mt-vib-teste" style="margin:10px 0 4px">
      ${est === 'nao-testado' ? '<p class="mt-muted" style="font-size:12.5px;margin:0 0 6px">A vibração depende do aparelho e do navegador. Teste uma vez para saber se ela funciona aqui.</p>' : ''}
      <button type="button" class="btn btn-ghost btn-block" onclick="mtTestarVibracao()">Testar vibração</button>
      <p id="mt-vib-status" class="mt-muted" style="font-size:12.5px;line-height:1.5;margin:8px 0 0"></p></div>`;
    (aviso || par || mi.lastElementChild).insertAdjacentHTML('afterend', bloco);
  }catch(e){}
}});
// cronômetro (parte 68): sem botão de vibração quando ela não funciona neste aparelho
(function(){
  const _d = window.restDesenha; if(typeof _d !== 'function') return;
  window.restDesenha = function(){
    const r = _d.apply(this, arguments);
    try{ const b = document.querySelector('#rest-timer-banner .rt2-vib'); if(b) b.style.display = mtVibOferecer() ? '' : 'none'; }catch(e){}
    return r;
  };
})();
// fim do descanso: só pede vibração quando ela é oferecida neste aparelho (senão o som e a tela bastam)
(function(){
  const _rv = window.restVibrarLigado; if(typeof _rv !== 'function') return;
  window.restVibrarLigado = function(){ return mtVibOferecer() && _rv.apply(this, arguments); };
})();

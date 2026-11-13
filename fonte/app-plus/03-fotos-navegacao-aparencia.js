
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

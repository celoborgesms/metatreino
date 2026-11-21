// =====================================================================
// 66. Beta 64 — mais alimentos e bebidas, busca melhor, "Meu grupo" no Perfil
// ---------------------------------------------------------------------
//  • Alimentos novos (valores aproximados da TACO 4ª ed. / IBGE POF, por 100 g ou 100 ml, prontos para
//    consumo). Bebidas vêm por unidade (copo, lata, taça, dose). Bebida alcoólica: as calorias do álcool
//    entram nas kcal, mas não em proteína/carbo/gordura — por isso a soma dos macros fica abaixo das kcal.
//  • Tipos de ovo (cozido, frito, mexido, omelete, clara, codorna) e misturas do dia a dia.
//  • Busca: sem acento, por qualquer palavra e por apelidos (refri, coca zero, pinga, chopp…), com o
//    que começa pelo termo primeiro.
//  • Perfil › Meu grupo: o vínculo da casa (cardápio e treino em dupla) num lugar só.
// =====================================================================
const NUTRI_MAIS = {
  // ovos
  ovocozido:   ['Ovo cozido', 146, 13.3, 0.6, 9.5, 50, null],
  ovofrito:    ['Ovo frito', 240, 15.6, 1.2, 18.6, 50, null],
  ovomexido:   ['Ovo mexido (com óleo)', 180, 12.5, 1.0, 14.0, 60, null],
  omelete:     ['Omelete simples (2 ovos)', 155, 11.0, 1.0, 11.5, 120, null],
  clara:       ['Clara de ovo', 52, 10.9, 0.7, 0.2, 33, null],
  codorna:     ['Ovo de codorna', 177, 13.7, 0.8, 12.7, 10, null],
  // misturas (peso do prato pronto)
  bifeacebolado:['Bife acebolado', 230, 27.0, 2.0, 12.5, null, null],
  carnepanela: ['Carne de panela', 210, 27.0, 1.5, 10.5, null, null],
  picanha:     ['Picanha grelhada', 290, 25.0, 0, 21.0, null, null],
  costela:     ['Costela bovina assada', 373, 28.0, 0, 28.9, null, null],
  carneseca:   ['Carne-seca refogada', 240, 32.0, 0, 12.0, null, null],
  hamburgcasa: ['Hambúrguer caseiro grelhado', 240, 22.0, 1.0, 16.0, 120, null],
  almondega:   ['Almôndega ao molho', 200, 14.0, 7.0, 13.0, null, null],
  frangofrito: ['Frango frito (coxa ou sobrecoxa)', 245, 25.0, 3.0, 14.5, null, null],
  frangoempan: ['Frango empanado (milanesa)', 260, 20.0, 12.0, 15.0, null, null],
  frangomolho: ['Frango desfiado ao molho', 150, 22.0, 3.0, 5.5, null, null],
  strogonoff:  ['Strogonoff de frango', 160, 13.0, 4.0, 10.0, null, null],
  linguica:    ['Linguiça toscana grelhada', 300, 18.0, 1.0, 25.0, 60, null],
  feijoada:    ['Feijoada', 140, 9.0, 8.0, 8.0, null, {g:200,nome:'concha grande'}],
  peixefrito:  ['Peixe frito (merluza ou pescada)', 230, 24.0, 6.0, 12.0, null, null],
  salmao:      ['Salmão grelhado', 230, 24.0, 0, 15.0, null, null],
  camarao:     ['Camarão cozido', 90, 19.0, 0, 1.0, null, null],
  // acompanhamentos
  farofa:      ['Farofa pronta', 406, 2.1, 80.3, 9.1, null, {g:15,nome:'col. de sopa'}],
  farinha:     ['Farinha de mandioca', 361, 1.6, 87.9, 0.3, null, {g:15,nome:'col. de sopa'}],
  pure:        ['Purê de batata', 90, 2.0, 13.0, 3.5, null, null],
  macarraomolho:['Macarrão ao molho de tomate', 120, 4.0, 22.0, 2.0, null, null],
  polenta:     ['Polenta cozida', 70, 1.5, 15.0, 0.5, null, null],
  mandiocafrita:['Mandioca frita', 300, 1.5, 40.0, 15.0, null, null],
  vinagrete:   ['Vinagrete', 30, 0.8, 5.0, 1.0, null, {g:30,nome:'col. de sopa'}, true],
  maionese:    ['Salada de maionese (com batata)', 180, 3.0, 12.0, 13.0, null, {g:60,nome:'col. de servir'}],
  queijocoalho:['Queijo coalho', 300, 22.0, 2.0, 22.0, 40, null],
  docedeleite: ['Doce de leite', 315, 7.0, 55.0, 7.5, null, {g:20,nome:'col. de sopa'}],
  goiabada:    ['Goiabada', 280, 0.4, 70.0, 0.1, null, {g:30,nome:'fatia'}],
  acucar:      ['Açúcar', 387, 0, 99.5, 0, null, {g:5,nome:'col. de chá'}],
  // bebidas (unidade = copo/lata/taça/dose)
  sucolaranja: ['Suco de laranja natural (copo 200 ml)', 45, 0.7, 10.4, 0.1, 200, null],
  sucouva:     ['Suco de uva integral (copo 200 ml)', 60, 0.3, 15.0, 0, 200, null],
  sucoverde:   ['Suco verde (couve, limão e maçã, 200 ml)', 25, 0.5, 6.0, 0.1, 200, null],
  refrizero:   ['Refrigerante zero (lata 350 ml)', 1, 0, 0.1, 0, 350, null],
  aguacoco:    ['Água de coco (copo 200 ml)', 22, 0, 5.3, 0, 200, null],
  caldocana:   ['Caldo de cana (copo 300 ml)', 67, 0.2, 17.0, 0, 300, null],
  cafe:        ['Café sem açúcar (xícara 50 ml)', 2, 0.1, 0.3, 0, 50, null],
  cafeacucar:  ['Café com açúcar (xícara 50 ml)', 42, 0.1, 10.3, 0, 50, null],
  cafeleite:   ['Café com leite (copo 200 ml)', 42, 2.2, 3.3, 2.2, 200, null],
  achocolatado:['Achocolatado com leite (copo 200 ml)', 75, 3.0, 11.0, 2.2, 200, null],
  cha:         ['Chá sem açúcar (xícara 200 ml)', 1, 0, 0.2, 0, 200, null],
  isotonico:   ['Isotônico (garrafa 500 ml)', 24, 0, 6.0, 0, 500, null],
  energetico:  ['Energético (lata 250 ml)', 45, 0, 11.0, 0, 250, null],
  energzero:   ['Energético zero (lata 250 ml)', 2, 0, 0.3, 0, 250, null],
  cervejazero: ['Cerveja sem álcool (lata 350 ml)', 20, 0.3, 4.4, 0, 350, null],
  chopp:       ['Chope (copo 300 ml)', 43, 0.4, 3.6, 0, 300, null],
  vinhobranco: ['Vinho branco (taça 150 ml)', 82, 0.1, 2.6, 0, 150, null],
  caipirinha:  ['Caipirinha (copo 200 ml)', 135, 0, 17.0, 0, 200, null],
  destilado:   ['Destilado: cachaça, vodca ou uísque (dose 50 ml)', 231, 0, 0, 0, 50, null]
};
(function(){ try{ Object.entries(NUTRI_MAIS).forEach(([id, v])=>{ if(!NUTRI_ALIMENTOS[id]) NUTRI_ALIMENTOS[id] = v; });
  const add = (k, ids)=>{ if(NUTRI_CATEG[k]) ids.forEach(id=>{ if(!NUTRI_CATEG[k][1].includes(id)) NUTRI_CATEG[k][1].push(id); }); };
  add('proteinas', ['ovocozido','ovofrito','ovomexido','omelete','clara','codorna']);
  add('carbo', ['farinha','pure','polenta','macarraomolho']);
  add('lat', ['queijocoalho']);
  add('outros', ['acucar','docedeleite','goiabada']);
  add('verduras', ['vinagrete']);
  if(!NUTRI_CATEG.pratos) NUTRI_CATEG.pratos = ['🍲 Pratos e misturas', ['bifeacebolado','carnepanela','picanha','costela','carneseca','hamburgcasa','almondega','frangofrito','frangoempan','frangomolho','strogonoff','linguica','feijoada','peixefrito','salmao','camarao','farofa','mandiocafrita','maionese']];
  if(!NUTRI_CATEG.bebidas) NUTRI_CATEG.bebidas = ['🥤 Bebidas', ['sucolaranja','sucouva','sucoverde','refrizero','refri','suco','aguacoco','caldocana','cafe','cafeacucar','cafeleite','achocolatado','cha','isotonico','energetico','energzero','cerveja','cervejazero','chopp','vinho','vinhobranco','caipirinha','destilado'].filter(id=>NUTRI_ALIMENTOS[id])];
  // lactose / glúten: o filtro do plano continua valendo para o que o app sugere
  ['cafeleite','achocolatado','queijocoalho','docedeleite','strogonoff','pure'].forEach(id=>{ if(!NUTRI_LACTOSE.includes(id)) NUTRI_LACTOSE.push(id); });
  ['frangoempan','macarraomolho','hamburgcasa','almondega'].forEach(id=>{ if(!NUTRI_GLUTEN.includes(id)) NUTRI_GLUTEN.push(id); });
}catch(e){ console.log('alimentos 64:', e); } })();

// apelidos para a busca
const NUTRI_APELIDOS = {
  refrizero:'refri coca zero guarana zero diet light', refri:'refri coca guarana soda', cerveja:'breja', chopp:'chopp chope', destilado:'pinga cachaca vodka vodca whisky uisque gin tequila',
  caipirinha:'caipiroska drink', caldocana:'garapa', sucolaranja:'suco natural', cafe:'cafezinho expresso', isotonico:'gatorade powerade', energetico:'red bull monster',
  ovocozido:'ovo', ovofrito:'ovo', ovomexido:'ovo', omelete:'ovo omelete', clara:'ovo clara', codorna:'ovo', feijoada:'feijao', farofa:'farinha', bifeacebolado:'bife carne',
  picanha:'carne churrasco', costela:'carne churrasco', linguica:'churrasco calabresa', frangofrito:'frango', frangoempan:'frango', frangomolho:'frango', strogonoff:'estrogonofe frango',
  pure:'batata', mandiocafrita:'aipim macaxeira', mandioca:'aipim macaxeira', mandioquinha:'batata baroa', aguacoco:'coco', achocolatado:'nescau toddy', acem:'carne moida', patinho:'carne'
};
const _nbSemAcento = t=>String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
window.nutriAddFiltra = function(){
  const q = _nbSemAcento((window.__nutriAddBusca||'').trim());
  const cat = window.__nutriAddCat || 'todos';
  const termos = q.split(/\s+/).filter(Boolean);
  const pont = id=>{ const f = NUTRI_ALIMENTOS[id]; const nome = _nbSemAcento(f[0]); const ap = _nbSemAcento(NUTRI_APELIDOS[id]||'');
    if(!termos.length) return 1;
    if(!termos.every(t=>nome.includes(t) || ap.includes(t))) return 0;
    return nome.startsWith(termos[0]) ? 3 : nome.split(/\s|\(/).some(w=>w.startsWith(termos[0])) ? 2 : 1; };
  const ids = Object.keys(NUTRI_ALIMENTOS).filter(id=>cat==='todos' || (NUTRI_CATEG[cat] && NUTRI_CATEG[cat][1].includes(id)))
    .map(id=>[id, pont(id)]).filter(([,p])=>p>0).sort((a,b)=>b[1]-a[1] || NUTRI_ALIMENTOS[a[0]][0].localeCompare(NUTRI_ALIMENTOS[b[0]][0],'pt')).map(([id])=>id);
  const el = $('nadd-lista'); if(!el) return;
  el.innerHTML = ids.length ? ids.map(id=>{ const f = NUTRI_ALIMENTOS[id]; const ref = f[5] ? `${Math.round(f[1]*f[5]/100)} kcal por unid.` : `${f[1]} kcal por 100 g`;
    return `<div class="mrow" style="cursor:pointer" onclick="nutriAddEscolher('${window.__nutriAddMid}','${id}')"><span class="n">${escHtml(f[0])}<br><small style="color:var(--text-mute)">${ref}</small></span><span class="q" style="color:var(--primary-2)">+</span></div>`; }).join('')
    : `<div style="padding:14px 4px;color:var(--text-dim);font-size:13px">Nada encontrado. Use "Outro alimento" para digitar as calorias.</div>`;
};

// ---------- Perfil › Meu grupo ----------
function openMinhaCasa(){ window.__casaDoPerfil = true; if(typeof openFamilia === 'function') openFamilia(); }
function mtPerfilCasa(){
  try{
    const lista = document.querySelector('#pf-sentado-row'); if(!lista || $('pf-casa-row')) return;
    lista.insertAdjacentHTML('afterend', `<div class="list-row" onclick="openMinhaCasa()" id="pf-casa-row">👥 <span>Meu grupo</span><span id="pf-casa-val" style="margin-left:auto;color:var(--text-mute);font-size:12px"></span></div>`);
  }catch(e){}
}
function mtPerfilCasaVal(){
  try{ const v = $('pf-casa-val'); if(!v) return;
    v.textContent = (typeof famAtiva === 'function' && famAtiva()) ? (n=>`${n} ${n===1?"pessoa":"pessoas"} ›`)(famMembros().length) : 'cardápio e treino em dupla ›'; }catch(e){}
}
mtPerfilCasa();
mtGancho('goTab', { depois(t){ if(t === 'profile'){ mtPerfilCasa(); mtPerfilCasaVal(); } } });

(function(){ if(document.getElementById('b64-css')) return; const s = document.createElement('style'); s.id = 'b64-css';
  s.textContent = `
.fam-bloco{ border:1px solid var(--border); border-radius:12px; padding:2px 12px 8px; margin:10px 0; }
.fam-bloco > summary{ display:flex; align-items:center; gap:8px; cursor:pointer; padding:10px 0; list-style:none; }
.fam-bloco > summary::-webkit-details-marker{ display:none; }
.fam-bloco > summary small{ margin-left:auto; color:var(--text-dim); font-size:12px; text-align:right; }
.fam-bloco > summary::after{ content:'›'; color:var(--text-dim); transition:transform .2s; }
.fam-bloco[open] > summary::after{ transform:rotate(90deg); }
.fam-2b{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.fam-2b .btn{ min-width:0; padding:11px 8px; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.fam-sair{ display:block; margin:16px auto 4px; background:none; border:0; color:var(--text-dim); font:600 12.5px inherit; text-decoration:underline; cursor:pointer; }
.fam-dica-perfil{ margin:2px 2px 10px; font-size:12.5px; color:var(--text-dim); text-align:center; }
.fam-dica-perfil a{ color:var(--primary-2, var(--primary)); font-weight:600; }
.maclg small{ color:var(--text-mute, var(--text-dim)); font-size:11px; margin-left:1px; }
`;
  document.head.appendChild(s); })();
Object.assign(window, { openMinhaCasa, NUTRI_MAIS });

// ---------- Dor / TPM / modo leve: ao voltar ao normal, devolve o MESMO treino de antes ----------
// Antes, "Estou sem dor" remontava o plano do zero: voltavam os grupos certos, mas com outros acessórios
// (perdia a troca semanal). Agora o plano de antes da adaptação fica guardado e volta igual, desde que seja a
// mesma semana e o plano não tenha sido refeito nesse meio-tempo. Trocas manuais feitas durante a dor continuam.
function _adFp(s){ s = s || {}; return JSON.stringify([s.goal, s.days, s.equip, s.level, s.selectedDays, s.tempo, s.prioridades, s.equipList, s.modalidade]); }
(function(){
  const _orig = window.regenLiftExercises;
  if(typeof _orig !== 'function') return;
  window.regenLiftExercises = function(){
    const mod = state.modules && state.modules.lift;
    let a = null; try{ a = adaptMode(); }catch(e){}
    if(mod && mod.plan && a && a.active && !mod.antesAdapt && !(mod.plan.workouts||[]).some(w=>w.adapted)){
      try{ mod.antesAdapt = { sem: semanaLocalId(), fp: _adFp(mod.setup), w: (mod.plan.workouts||[]).map(w=>({ k:w.k, cali:!!w.cali, parts:[...(w.parts||[])], name:w.name, exercises: JSON.parse(JSON.stringify(w.exercises||[])) })) }; }catch(e){}
    }
    const r = _orig.apply(this, arguments);
    try{
      const S = mod && mod.antesAdapt;
      if(S && a && !a.active){
        delete mod.antesAdapt;
        const W = mod.plan.workouts || [];
        if(S.sem === semanaLocalId() && S.fp === _adFp(mod.setup) && S.w.length === W.length && S.w.every((x,i)=>x.k === W[i].k)){
          W.forEach((w, i)=>{ const x = S.w[i]; if(w.cali || x.cali) return;
            w.parts = x.parts; w.name = x.name; w.exercises = x.exercises; w.reforcoParts = []; w.adapted = false;
            try{ applyPins(w, mod.setup); }catch(e){}
            w.duration = estimateLiftDuration(w.exercises, mod.setup.goal); });
        }
      } else if(S && (S.fp !== _adFp(mod.setup) || S.sem !== semanaLocalId())) delete mod.antesAdapt;   // plano refeito: o guardado não vale mais
    }catch(e){ console.log('voltar do modo adaptado:', e); }
    return r;
  };
})();

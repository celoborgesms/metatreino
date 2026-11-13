
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

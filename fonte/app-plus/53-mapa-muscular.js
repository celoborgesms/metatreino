
// =====================================================================
// 53. Beta 49 (2) — Mapa muscular (frente e costas, masculino e feminino) e etapas do treino
// =====================================================================
// • Desenho vetorial próprio: cada músculo é uma "placa" com contorno suave (Catmull-Rom → Bézier), lado
//   esquerdo desenhado e espelhado. O corpo feminino sai do mesmo desenho com outra proporção (ombros e
//   cintura mais estreitos, quadril mais largo) e cabelo — nada de figura genérica de clip-art.
// • Treinos › sessão de musculação: cartão "Músculos e etapas do treino" com
//   – Aquecimento / Parte principal / Desaquecimento (minutos e o que fazer, pelos músculos do dia);
//   – o mapa colorido por grupo, com legenda: tocar num músculo (ou na legenda) mostra o que ele faz, quais
//     exercícios de hoje o trabalham (principal ou auxiliar) e as séries da semana;
//   – aba "Semana": cor pela quantidade de séries dos últimos 7 dias, para ver a distribuição (ex.: muito peito
//     e pouco posterior de coxa).
// • Leve: o SVG de cada corpo é montado uma vez e guardado; tocar só troca cores/texto.

// ---------- 1. desenho ----------
// placas: m = músculo (null = parte sem músculo destacado), g = região (tronco/braco/perna/cabeca), c = centro (já
// tem os dois lados), p = pontos do lado esquerdo (x < 100)
// silhueta (atrás das placas, na cor do corpo): as linhas entre os músculos ficam finas, como costuras
const MM_SIL_TRONCO = [[100,45],[93,46],[92,58],[82,64],[70,69],[64,74],[66,88],[67,104],[69,120],[70,140],[71,160],[73,178],[71,194],[69,210],[67,232],[67,258],[69,284],[73,304],[74,318],[71,338],[72,362],[75,386],[77,402],[73,414],[72,426],[80,431],[92,431],[93,418],[92,404],[93,384],[94,360],[95,336],[94,318],[96,300],[98,276],[99,250],[100,234]];
const MM_SIL_BRACO = [[64,71],[56,74],[50,84],[48,98],[46,114],[45,130],[43,146],[40,164],[37,182],[35,196],[32,206],[31,218],[35,228],[41,232],[46,226],[47,214],[46,204],[48,196],[52,180],[56,164],[59,148],[62,132],[64,116],[66,100],[67,86]];
const MM_FRENTE = [
  { m:null, g:'cabeca', c:1, p:[[100,45],[93,46],[92,58],[96,64],[100,66]] },
  { m:'trapezio', g:'tronco', p:[[92,58],[84,63],[72,68],[80,71],[91,66]] },
  { m:'deltoide', g:'braco', p:[[72,68],[64,71],[56,75],[51,86],[49,100],[53,108],[60,100],[66,88],[71,78]] },
  { m:'peito', g:'tronco', p:[[99,70],[91,67],[80,71],[71,79],[67,92],[68,104],[74,112],[86,116],[99,113]] },
  { m:'serratil', g:'tronco', p:[[68,107],[66,113],[70,117],[73,112]] },
  { m:'serratil', g:'tronco', p:[[68,119],[67,125],[71,128],[74,122]] },
  { m:'serratil', g:'tronco', p:[[70,130],[69,136],[73,139],[75,133]] },
  { m:'abdomen', g:'tronco', p:[[99,117],[90,118],[89,130],[99,130]] },
  { m:'abdomen', g:'tronco', p:[[99,133],[89,133],[89,147],[99,147]] },
  { m:'abdomen', g:'tronco', p:[[99,150],[89,150],[90,164],[99,164]] },
  { m:'abdomen', g:'tronco', p:[[99,167],[90,167],[92,184],[99,195]] },
  { m:'obliquos', g:'tronco', p:[[88,118],[76,116],[73,130],[73,148],[75,166],[80,180],[88,190],[89,168],[88,140]] },
  { m:'biceps', g:'braco', p:[[60,102],[54,106],[49,118],[48,132],[51,144],[57,146],[62,136],[64,118]] },
  { m:'antebraco', g:'braco', p:[[50,148],[45,158],[41,172],[37,186],[36,195],[43,198],[47,196],[51,182],[56,166],[60,151]] },
  { m:null, g:'braco', p:[[37,198],[33,208],[32,219],[36,228],[42,231],[46,225],[47,212],[46,200]] },
  { m:null, g:'perna', p:[[74,190],[70,204],[70,216],[77,206],[80,194]] },
  { m:'quadriceps', g:'perna', p:[[76,204],[71,222],[69,246],[69,270],[72,292],[78,302],[84,296],[80,272],[78,246],[79,222]] },
  { m:'quadriceps', g:'perna', p:[[84,206],[80,222],[79,246],[81,270],[86,290],[90,272],[91,246],[89,222]] },
  { m:'quadriceps', g:'perna', p:[[92,262],[88,284],[87,298],[93,306],[97,292],[96,272]] },
  { m:'adutores', g:'perna', p:[[99,214],[93,214],[90,226],[91,248],[94,262],[98,244]] },
  { m:null, g:'perna', p:[[76,306],[75,316],[80,322],[90,320],[93,310],[86,304]] },
  { m:'tibial', g:'perna', p:[[75,322],[73,340],[73,362],[76,386],[80,396],[83,384],[82,358],[82,334]] },
  { m:'panturrilha', g:'perna', p:[[86,324],[85,346],[86,372],[91,366],[94,344],[93,324]] },
  { m:null, g:'perna', p:[[77,400],[73,414],[73,425],[80,429],[91,429],[92,416],[91,402]] }
];
const MM_COSTAS = [
  { m:null, g:'cabeca', c:1, p:[[100,45],[93,46],[92,58],[100,62]] },
  { m:'trapezio', g:'tronco', c:1, p:[[100,52],[93,56],[84,62],[72,68],[66,73],[74,78],[84,88],[92,104],[96,120],[100,134]] },
  { m:'deltoide', g:'braco', p:[[70,70],[62,72],[55,76],[50,88],[49,102],[54,108],[61,98],[67,86],[74,78]] },
  { m:'costas', g:'tronco', p:[[76,80],[70,88],[68,100],[74,108],[84,104],[90,96],[86,88]] },
  { m:'dorsal', g:'tronco', p:[[68,106],[68,124],[71,144],[77,162],[86,174],[95,178],[96,160],[94,138],[90,116],[84,108],[76,108]] },
  { m:'lombar', g:'tronco', p:[[99,136],[95,140],[93,160],[93,182],[96,192],[99,194]] },
  { m:'triceps', g:'braco', p:[[60,100],[54,104],[49,116],[48,132],[50,144],[56,148],[62,138],[64,120],[65,106]] },
  { m:'antebraco', g:'braco', p:[[50,148],[45,158],[41,172],[37,186],[36,195],[43,198],[47,196],[51,182],[56,166],[60,151]] },
  { m:null, g:'braco', p:[[37,198],[33,208],[32,219],[36,228],[42,231],[46,225],[47,212],[46,200]] },
  { m:'gluteos', g:'perna', p:[[99,192],[90,188],[79,193],[72,206],[72,226],[80,238],[92,242],[99,238]] },
  { m:'posteriores', g:'perna', p:[[74,240],[70,256],[70,278],[74,298],[80,306],[84,290],[83,266],[80,246]] },
  { m:'posteriores', g:'perna', p:[[86,244],[85,268],[86,292],[90,304],[95,288],[97,262],[96,246]] },
  { m:null, g:'perna', p:[[77,306],[76,316],[84,320],[93,316],[93,308],[86,304]] },
  { m:'panturrilha', g:'perna', p:[[76,320],[72,336],[73,354],[78,366],[84,360],[84,336],[82,322]] },
  { m:'panturrilha', g:'perna', p:[[86,322],[86,340],[87,362],[92,366],[95,346],[94,326]] },
  { m:null, g:'perna', p:[[78,368],[79,388],[81,400],[88,400],[90,384],[91,368],[85,366]] },
  { m:null, g:'perna', p:[[77,402],[74,414],[76,425],[90,425],[92,414],[91,402]] }
];
// proporção feminina: tronco (largura por altura), braços deslocados para dentro, pernas/quadril mais largos
function _mmLargura(y, g){
  if(g === 'braco' || g === 'cabeca') return 1;
  if(y < 70) return 0.9;
  if(y < 112) return 0.88;                                         // ombros e peito mais estreitos
  if(y < 186){ const t = (y-112)/74; return 0.88 - 0.08*Math.sin(Math.PI*Math.min(1, t*1.25)); }   // cintura marcada
  if(y < 250){ const t = (y-186)/64; return 0.95 + 0.13*Math.sin(Math.PI*Math.min(1, t*0.9)); }    // quadril
  if(y < 318) return 1.06 - 0.06*(y-250)/68;                       // coxas
  return 1.0;
}
function _mmWarp(p, sexo, g){
  if(sexo !== 'f') return p;
  return p.map(([x,y])=> g === 'braco' ? [x + 7 + (y > 150 ? 1 : 0), y] : [100 + (x - 100)*_mmLargura(y, g), y]);
}
// contorno suave fechado (Catmull-Rom centrípeto simplificado)
function _mmPath(pts){
  const n = pts.length; let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for(let i=0;i<n;i++){
    const p0 = pts[(i-1+n)%n], p1 = pts[i], p2 = pts[(i+1)%n], p3 = pts[(i+2)%n];
    const c1 = [p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6], c2 = [p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
const _mmCache = {};
function mmCorpoSVG(vista, sexo){
  const k = vista + sexo; if(_mmCache[k]) return _mmCache[k];
  const placas = vista === 'costas' ? MM_COSTAS : MM_FRENTE;
  const espelha = pts=>pts.map(([x,y])=>[200-x, y]);
  const centro = (pts)=>pts.concat(espelha(pts.slice(1, -1)).reverse());
  let h = '';
  const f = sexo === 'f';
  // cabelo atrás (feminino)
  if(f) h += vista === 'costas'
    ? `<path class="mm-cabelo" d="M82 28C82 6 118 6 118 28C121 46 117 66 108 74C104 70 96 70 92 74C83 66 79 46 82 28Z"/>`
    : `<path class="mm-cabelo" d="M82 30C80 6 120 6 118 30C121 46 120 60 115 70L107 60C104 50 96 50 93 60L85 70C80 60 79 46 82 30Z"/>`;
  // silhueta: tronco + pernas (centro) e os dois braços
  const tr = _mmWarp(MM_SIL_TRONCO, sexo, 'tronco').map(([x,y],i)=>[x,y]);
  h += `<path class="mm-sil" d="${_mmPath(centro(tr))}"/>`;
  const br = _mmWarp(MM_SIL_BRACO, sexo, 'braco');
  h += `<path class="mm-sil" d="${_mmPath(br)}"/><path class="mm-sil" d="${_mmPath(espelha(br))}"/>`;
  h += `<ellipse class="mm-sil" cx="100" cy="28" rx="${f ? 14.5 : 16}" ry="${f ? 18.5 : 19.5}"/>`;
  if(f && vista === 'costas') h += `<path class="mm-cabelo" d="M85 22C85 8 115 8 115 22C116 38 111 48 100 50C89 48 84 38 85 22Z"/>`;
  if(f && vista !== 'costas') h += `<path class="mm-cabelo" d="M85 22C87 9 113 9 115 22C110 17 104 15 100 15C95 15 89 17 85 22Z"/>`;
  // placas um pouco "infladas" a partir do centro e recortadas pela silhueta: preenchem o corpo, e a costura
  // (contorno na cor do corpo) separa os músculos com linhas finas
  const cid = 'mmc' + k;
  h += `<clipPath id="${cid}"><path d="${_mmPath(centro(tr))}"/><path d="${_mmPath(br)}"/><path d="${_mmPath(espelha(br))}"/><ellipse cx="100" cy="28" rx="16" ry="20"/></clipPath><g clip-path="url(#${cid})">`;
  const infla = (pts, m, g)=>{
    const fx = m === 'antebraco' ? 1.15 : (m === 'panturrilha' || m === 'tibial') ? 1.3 : m === 'abdomen' ? 1.06 : g === 'cabeca' ? 1 : 1.16;
    const fy = m === 'abdomen' ? 1.04 : g === 'cabeca' ? 1 : 1.07;
    const cx = pts.reduce((t,q)=>t+q[0],0)/pts.length, cy = pts.reduce((t,q)=>t+q[1],0)/pts.length;
    return pts.map(([x,y])=>[cx + (x-cx)*fx, cy + (y-cy)*fy]);
  };
  placas.forEach(pl=>{
    const pts = pl.c ? _mmWarp(pl.p, sexo, pl.g) : infla(_mmWarp(pl.p, sexo, pl.g), pl.m, pl.g);
    const cls = pl.m ? `mm-m" data-m="${pl.m}` : 'mm-base';
    if(pl.c) h += `<path class="${cls}" d="${_mmPath(centro(pts))}"/>`;
    else h += `<path class="${cls}" d="${_mmPath(pts)}"/><path class="${cls}" d="${_mmPath(espelha(pts))}"/>`;
  });
  h += '</g>';
  return _mmCache[k] = `<svg class="mm-svg" viewBox="24 4 152 432" role="img" aria-label="Corpo ${f ? 'feminino' : 'masculino'} ${vista === 'costas' ? 'de costas' : 'de frente'}">${h}</svg>`;
}

// ---------- 2. músculos: nomes, cores e o que fazem ----------
const MM_INFO = {
  peito:{ nome:'Peitoral', cor:'#ff6b2c', faz:'Empurra os braços para a frente e para dentro (supino, flexão, crucifixo).' },
  deltoide:{ nome:'Ombros (deltoide)', cor:'#ff9a3c', faz:'Eleva o braço para a frente, para o lado e para trás; estabiliza o ombro nos empurrões.' },
  trapezio:{ nome:'Trapézio', cor:'#a78bfa', faz:'Eleva e aproxima as escápulas; sustenta a postura do pescoço e dos ombros.' },
  costas:{ nome:'Costas média (romboides e infraespinal)', cor:'#8b7cf6', faz:'Puxa as escápulas para trás nas remadas; protege o ombro.' },
  dorsal:{ nome:'Grande dorsal', cor:'#7c6cf0', faz:'Puxa os braços para baixo e para trás (puxada, barra fixa, remada); dá a "largura" das costas.' },
  lombar:{ nome:'Lombar (eretores da espinha)', cor:'#f472b6', faz:'Mantém a coluna estendida no terra, agachamento e remadas.' },
  biceps:{ nome:'Bíceps', cor:'#c9a08a', faz:'Flexiona o cotovelo e gira o antebraço; ajuda nas puxadas.' },
  triceps:{ nome:'Tríceps', cor:'#e8916f', faz:'Estende o cotovelo; trabalha junto em supinos e desenvolvimentos.' },
  antebraco:{ nome:'Antebraço', cor:'#b9a493', faz:'Pegada e flexão do punho; trabalha em toda puxada e rosca.' },
  abdomen:{ nome:'Abdômen (reto abdominal)', cor:'#ffb38a', faz:'Flexiona o tronco e estabiliza a coluna em quase todos os exercícios.' },
  obliquos:{ nome:'Oblíquos externos', cor:'#ec4f9c', faz:'Giram e inclinam o tronco; evitam que o tronco torça sob carga.' },
  serratil:{ nome:'Serrátil anterior', cor:'#6f8ff7', faz:'Mantém a escápula colada às costelas ao empurrar e elevar os braços.' },
  gluteos:{ nome:'Glúteos', cor:'#f7d14a', faz:'Estendem e abrem o quadril (agachamento, terra, elevação pélvica, subida).' },
  quadriceps:{ nome:'Quadríceps', cor:'#f7a540', faz:'Estende o joelho (agachamento, leg press, extensora, avanço).' },
  adutores:{ nome:'Adutores', cor:'#4fc3a1', faz:'Aproximam as pernas e estabilizam o quadril no agachamento.' },
  posteriores:{ nome:'Posteriores de coxa', cor:'#f0b860', faz:'Flexionam o joelho e estendem o quadril (flexora, stiff, terra).' },
  panturrilha:{ nome:'Panturrilha', cor:'#d6a77a', faz:'Estende o tornozelo (ficar na ponta dos pés); essencial na corrida.' },
  tibial:{ nome:'Tibial anterior', cor:'#9fb7c9', faz:'Levanta a ponta do pé; protege a canela na corrida.' }
};
// músculos de cada exercício pelo grupo (part) e pela ênfase (sub) cadastrados no banco
function mmMusculosDe(ex){
  const part = ex.part || '', sub = mtNorm(ex.sub || ''), nome = mtNorm(ex.name || '');
  const P = new Set(), S = new Set(); const p = (...a)=>a.forEach(x=>P.add(x)), s = (...a)=>a.forEach(x=>S.add(x));
  if(part === 'Peito'){ p('peito'); s('deltoide','triceps'); if(/serratil/.test(sub)) p('serratil'); }
  else if(part === 'Costas'){
    if(/lombar/.test(sub)) p('lombar');
    else if(/cadeia posterior/.test(sub)){ p('lombar','gluteos','posteriores'); s('trapezio','antebraco'); }
    else if(/media|horizontal|espessura/.test(sub)){ p('costas','dorsal'); s('trapezio','biceps','deltoide'); }
    else { p('dorsal'); s('costas','biceps'); }
    if(/romboide/.test(sub)) p('costas'); if(/biceps|braquial/.test(sub)) s('biceps','antebraco');
  }
  else if(part === 'Ombro'){ p('deltoide'); if(/trapezio/.test(sub)) p('trapezio'); if(/posterior|postura/.test(sub)) s('costas','trapezio'); else if(/forca|completo|frontal|avancado/.test(sub) || /desenvolv/.test(nome)) s('triceps','trapezio'); }
  else if(part === 'Bíceps'){ p('biceps'); s('antebraco'); if(/braquial|antebraco/.test(sub)) p('antebraco'); }
  else if(part === 'Tríceps'){ p('triceps'); if(/peito/.test(sub)) s('peito','deltoide'); }
  else if(part === 'Pernas'){
    if(/quadriceps/.test(sub)){ p('quadriceps'); s('adutores'); }
    if(/gluteo/.test(sub)) (/quadriceps|posterior/.test(sub) ? p : p)('gluteos');
    if(/posterior/.test(sub)){ p('posteriores'); s('gluteos','lombar'); }
    if(/adutor/.test(sub)) p('adutores');
    if(/abdutor/.test(sub)) p('gluteos');
    if(!P.size) p('quadriceps','gluteos');
    if(/agach|leg press|avanco|afundo|passada|bulgaro/.test(nome)) s('gluteos','abdomen');
  }
  else if(part === 'Glúteos'){ p('gluteos'); s('posteriores'); if(/adutor/.test(sub)) p('adutores'); }
  else if(part === 'Panturrilha'){ p('panturrilha'); }
  else if(part === 'Trapézio'){ p('trapezio'); s('antebraco'); }
  else if(part === 'Core'){
    if(/obliquo|rotacao/.test(sub)) p('obliquos');
    if(/reto|inferior/.test(sub)) p('abdomen');
    if(!P.size){ p('abdomen'); s('obliquos','lombar'); }
    if(/pegada/.test(sub)) s('antebraco');
  }
  P.forEach(x=>S.delete(x));
  return { prim:[...P], sec:[...S] };
}
function _mmExDoBanco(id){ try{ for(const c of EX_BANK){ const it = c.items.find(x=>slug(x.name) === id); if(it) return Object.assign({ part:c.name, id }, it); } }catch(e){} return null; }
// séries dos últimos 7 dias por músculo (principal = 1 série; auxiliar = 0,5)
function mmSeriesSemana(){
  const ini = Date.now() - 7*DIA_MS; const out = {};
  Object.entries(state.progress || {}).forEach(([id, arr])=>{
    const n = (arr||[]).filter(p=>p.date >= ini).reduce((t,p)=>t + (p.sets||[]).length, 0); if(!n) return;
    const ex = _mmExDoBanco(id); if(!ex) return;
    const m = mmMusculosDe(ex);
    m.prim.forEach(k=>{ out[k] = (out[k]||0) + n; }); m.sec.forEach(k=>{ out[k] = (out[k]||0) + n*0.5; });
  });
  return out;
}

// ---------- 3. etapas do treino ----------
function mmEtapas(w){
  const dur = +w.duration || 45;
  const aq = dur >= 40 ? 8 : 5, des = dur >= 40 ? 6 : 4;
  return { aq, prin: Math.max(10, dur - aq - des), des };
}
function _mmMusculosDoTreino(w){
  const prim = {}, sec = {};
  (w.exercises||[]).forEach(e=>{ const m = mmMusculosDe(e); m.prim.forEach(k=>{ (prim[k] = prim[k] || []).push(e); }); m.sec.forEach(k=>{ (sec[k] = sec[k] || []).push(e); }); });
  Object.keys(prim).forEach(k=>delete sec[k]);
  return { prim, sec };
}
const MM_ALONGA = { peito:'peitoral no batente da porta', deltoide:'ombro cruzando o braço à frente', trapezio:'trapézio inclinando a cabeça para o lado', costas:'costas abraçando os joelhos', dorsal:'dorsal pendurado ou inclinado na lateral', lombar:'lombar em posição de criança', biceps:'bíceps com a mão apoiada na parede', triceps:'tríceps com o cotovelo acima da cabeça', antebraco:'antebraço puxando os dedos para trás', abdomen:'abdômen em cobra suave', obliquos:'inclinação lateral do tronco', serratil:'braços estendidos à frente, empurrando o chão', gluteos:'glúteo em figura 4 (deitado)', quadriceps:'quadríceps segurando o pé atrás', adutores:'adutores em borboleta sentado', posteriores:'posterior de coxa com a perna estendida', panturrilha:'panturrilha na parede, calcanhar no chão', tibial:'tibial sentado sobre os calcanhares' };
function mmEtapaTexto(fase, w){
  const M = _mmMusculosDoTreino(w); const principais = Object.keys(M.prim);
  const nomes = principais.map(k=>MM_INFO[k].nome.split(' (')[0].toLowerCase());
  const E = mmEtapas(w); const primeiro = (w.exercises||[])[0];
  if(fase === 'aq') return `<b>${E.aq} min.</b> 3–4 min de cardio leve (bicicleta, esteira ou polichinelo lento) para aquecer o corpo. Depois, mobilidade das articulações de hoje (${nomes.slice(0,3).join(', ') || 'corpo todo'}): 10 repetições lentas de cada movimento. Antes da 1ª série${primeiro ? ` de <b>${mtEsc(primeiro.name)}</b>` : ''}, faça 1–2 séries leves (cerca de 50% da carga, 10–12 repetições) — elas não contam no registro.`;
  if(fase === 'prin') return `<b>~${E.prin} min.</b> ${(w.exercises||[]).length} exercícios, na ordem da ficha. Músculos principais: <b>${nomes.join(', ') || '—'}</b>. Respeite o descanso de cada exercício e registre as séries; é com elas que o app ajusta as próximas cargas.`;
  const al = principais.slice(0,4).map(k=>MM_ALONGA[k]).filter(Boolean);
  return `<b>Volta à calma (desaquecimento), ${E.des} min.</b> 2–3 min de caminhada ou pedal bem leve até a respiração normalizar. Depois, alongamentos leves de 20–30 s, sem dor: ${al.join('; ') || 'músculos trabalhados'}. Hidrate-se e, se puder, faça uma refeição com proteína nas próximas horas.`;
}

// ---------- 4. cartão na sessão ----------
let _mmEstado = { modo:'hoje', sel:null, sexo:null };
function _mmAberto(){ try{ return localStorage.getItem('mt_mm_aberto') !== '0'; }catch(e){ return true; } }
function mmAberto(v){ try{ localStorage.setItem('mt_mm_aberto', v ? '1' : '0'); }catch(e){} }
function _mmSexo(){ return _mmEstado.sexo || (((state.user||{}).profile||{}).sex === 'f' ? 'f' : 'm'); }
function _mmTreinoAtual(){ try{ const mod = state.modules.lift; if(!mod || !mod.plan) return null; return (typeof currentSelectedWorkout === 'function' ? currentSelectedWorkout(mod) : null) || (mod.plan.workouts||[])[0] || null; }catch(e){ return null; } }
function mmCartaoHTML(w){
  const M = _mmMusculosDoTreino(w); const E = mmEtapas(w);
  return `<div class="card mm-card" id="mm-card">
    <div class="mm-fases" role="list" aria-label="Etapas do treino">
      <button class="mm-fase f-aq" role="listitem" onclick="mmFase('aq')"><i></i><span class="mm-f-ico">${MM_ICO.aq}</span><b>Aquecimento</b><small>${E.aq} min</small></button>
      <button class="mm-fase f-prin" role="listitem" onclick="mmFase('prin')"><i></i><span class="mm-f-ico">${MM_ICO.prin}</span><b>Principal</b><small>~${E.prin} min</small></button>
      <button class="mm-fase f-des" role="listitem" onclick="mmFase('des')"><i></i><span class="mm-f-ico">${MM_ICO.des}</span><b>Volta à calma</b><small>${E.des} min</small></button>
    </div>
    <div id="mm-fase-txt" class="mm-fase-txt" aria-live="polite" hidden></div>
    <details class="mm-det" ${_mmAberto() ? 'open' : ''} ontoggle="mmAberto(this.open)"><summary class="mm-sum"><span>Músculos trabalhados</span><small>${Object.keys(M.prim).length} principais ›</small></summary>
    <div class="mm-topo"><b class="mm-tit">${_mmEstado.modo === 'semana' ? 'Séries dos últimos 7 dias' : 'Treino de hoje'}</b>
      <div class="mm-modo" role="group" aria-label="Período"><button type="button" class="${_mmEstado.modo==='hoje'?'on':''}" aria-pressed="${_mmEstado.modo==='hoje'}" onclick="mmModo('hoje')">Hoje</button><button type="button" class="${_mmEstado.modo==='semana'?'on':''}" aria-pressed="${_mmEstado.modo==='semana'}" onclick="mmModo('semana')">Semana</button></div></div>
    <div class="mm-legenda" id="mm-legenda"></div>
    <div class="mm-corpos" onclick="mmToque(event)" aria-label="Mapa muscular: toque num músculo colorido para ver detalhes">${mmCorpoSVG('frente', _mmSexo())}${mmCorpoSVG('costas', _mmSexo())}</div>
    <div class="mm-rodape"><button type="button" class="mm-sexo" onclick="mmSexo()">${_mmSexo()==='f'?'Ver corpo masculino':'Ver corpo feminino'}</button><span>Toque num músculo</span></div>
    <div id="mm-info" class="mm-info" aria-live="polite" hidden></div></details>
  </div>`;
}
const MM_ICO = {
  aq:'<svg viewBox="0 0 24 24"><path d="M12 3c2 3-1 4 1 7 1.5-1 2-2.5 2-4 3 2.5 4 5 4 7.5A7 7 0 0 1 5 13.5c0-3 1.5-5 4-7 0 2 1 3 2.5 3.5C10 7 11 5 12 3z"/></svg>',
  prin:'<svg viewBox="0 0 24 24"><path d="M2.5 9.5v5M5.5 7.5v9M8.5 12h7M18.5 7.5v9M21.5 9.5v5"/></svg>',
  des:'<svg viewBox="0 0 24 24"><path d="M12 3v18M12 7l-4-3M12 7l4-3M12 17l-4 3M12 17l4 3M4 12h16"/></svg>'
};
function mmPintar(){
  const card = $('mm-card'); if(!card) return;
  const w = _mmTreinoAtual(); if(!w) return;
  const sem = _mmEstado.modo === 'semana';
  const M = _mmMusculosDoTreino(w); const S = sem ? mmSeriesSemana() : null;
  card.querySelectorAll('.mm-m').forEach(el=>{
    const k = el.dataset.m; const info = MM_INFO[k]; let op = 0, cor = info.cor;
    if(sem){ const v = S[k] || 0; op = !v ? 0 : v < 6 ? 0.5 : v < 10 ? 0.75 : 1; }
    else op = M.prim[k] ? 1 : M.sec[k] ? 0.55 : 0;
    el.style.fill = op ? cor : '';
    el.style.fillOpacity = op ? op : '';
    el.classList.toggle('on', !!op);
    el.classList.toggle('sel', _mmEstado.sel === k);
  });
  const leg = $('mm-legenda');
  if(leg){
    const ks = sem ? Object.keys(S).sort((a,b)=>S[b]-S[a]) : [...Object.keys(M.prim), ...Object.keys(M.sec)];
    leg.innerHTML = ks.length ? ks.map(k=>`<button type="button" class="mm-chip ${_mmEstado.sel===k?'sel':''} ${!sem && M.sec[k]?'sec':''}" onclick="mmSel('${k}')"><i style="background:${MM_INFO[k].cor}"></i>${MM_INFO[k].nome.split(' (')[0]}${sem?` <small>${_mmFmtS(S[k])}</small>`:''}</button>`).join('')
      : `<span class="mm-vazio">${sem ? 'Nenhuma série registrada nos últimos 7 dias.' : 'Este treino não tem exercícios de musculação.'}</span>`;
    if(!sem && ks.length) leg.insertAdjacentHTML('beforeend', `<span class="mm-leg-nota">cor cheia = principal · clara = auxiliar</span>`);
    if(sem && ks.length) leg.insertAdjacentHTML('beforeend', `<span class="mm-leg-nota">séries em 7 dias (auxiliar conta meia)</span>`);
  }
  const tit = card.querySelector('.mm-tit'); if(tit) tit.textContent = sem ? 'Séries dos últimos 7 dias' : 'Treino de hoje';
  if(_mmEstado.sel) mmInfo(_mmEstado.sel); else { const i = $('mm-info'); if(i) i.hidden = true; }
}
const _mmFmtS = v=>{ const r = Math.round((v||0)*2)/2; return String(r).replace('.5', ',5') + (r === 1 ? ' série' : ' séries'); };
function mmInfo(k){
  const box = $('mm-info'); if(!box || !MM_INFO[k]) return;
  const w = _mmTreinoAtual(); const M = w ? _mmMusculosDoTreino(w) : { prim:{}, sec:{} };
  const S = mmSeriesSemana(); const v = S[k] || 0;
  const exP = (M.prim[k]||[]).map(e=>mtEsc(e.name)), exS = (M.sec[k]||[]).map(e=>mtEsc(e.name));
  const faixa = v < 6 ? 'abaixo do que costuma dar resultado (referência comum para hipertrofia: 10 a 20 séries por semana)' : v < 10 ? 'perto do mínimo da referência (10 a 20 séries por semana)' : v <= 20 ? 'dentro da referência comum (10 a 20 séries por semana)' : 'acima da referência comum — se a recuperação estiver difícil, vale reduzir';
  box.innerHTML = `<div class="mm-info-t"><i style="background:${MM_INFO[k].cor}"></i><b>${MM_INFO[k].nome}</b><button type="button" class="mm-x" onclick="mmSel(null)" aria-label="Fechar">✕</button></div>
    <p>${MM_INFO[k].faz}</p>
    ${exP.length ? `<p><b>Hoje, principal:</b> ${exP.join(', ')}</p>` : ''}${exS.length ? `<p><b>Hoje, auxiliar:</b> ${exS.join(', ')}</p>` : ''}
    ${!exP.length && !exS.length ? '<p class="mm-mute">Não é trabalhado no treino de hoje.</p>' : ''}
    <p class="mm-mute">Últimos 7 dias: <b>${_mmFmtS(v)}</b>${v ? ` — ${faixa}` : (state.modules.lift ? ' — nenhuma série registrada para este músculo' : '')}.</p>`;
  box.hidden = false;
}
function mmSel(k){ _mmEstado.sel = (k && _mmEstado.sel !== k) ? k : null; mmPintar(); }
function mmToque(ev){ const el = ev.target.closest && ev.target.closest('.mm-m'); if(el) mmSel(el.dataset.m); }
function mmModo(m){ _mmEstado.modo = m; const c = $('mm-card'); if(c){ c.querySelectorAll('.mm-modo button').forEach(b=>{ const on = b.textContent.toLowerCase() === m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); } mmPintar(); }
function mmSexo(){ _mmEstado.sexo = _mmSexo() === 'f' ? 'm' : 'f'; mmRenderCartao(true); }
function mmFase(f){
  const box = $('mm-fase-txt'); const w = _mmTreinoAtual(); if(!box || !w) return;
  const aberta = box.dataset.f === f && !box.hidden;
  document.querySelectorAll('#mm-card .mm-fase').forEach(b=>b.classList.toggle('on', !aberta && b.classList.contains('f-' + f)));
  if(aberta){ box.hidden = true; box.dataset.f = ''; return; }
  box.dataset.f = f; box.className = 'mm-fase-txt f-' + f; box.innerHTML = mmEtapaTexto(f, w); box.hidden = false;
}
function mmRenderCartao(forcar){
  try{
    if(state.active !== 'lift') return;
    const slot = $('session-detail-slot'); if(!slot) return;
    const w = _mmTreinoAtual(); if(!w || !(w.exercises||[]).length) return;
    const velho = $('mm-card');
    if(velho && !forcar && velho.dataset.w === String(w.k || w.dayIdx)) return;
    const html = mmCartaoHTML(w);
    if(velho) velho.outerHTML = html;
    else {
      // treino pulado: o aviso "Voltar atrás" continua sendo o primeiro bloco da sessão
      const aviso = [...slot.children].find(c=>c.querySelector && c.querySelector('button[onclick^="unskipWorkout"]'));
      if(aviso) aviso.insertAdjacentHTML('afterend', html); else slot.insertAdjacentHTML('afterbegin', html);
    }
    const novo = $('mm-card'); if(novo){ novo.dataset.w = String(w.k || w.dayIdx); try{ if(typeof temaClaro === 'function' && temaClaro()) novo.classList.add('mm-claro'); }catch(e){} }
    mmPintar();
  }catch(e){ console.log('mapa muscular:', e); }
}
mtGancho('renderSessions', { depois(){ mmRenderCartao(); } });

(function(){ if(document.getElementById('mm-css')) return; const s = document.createElement('style'); s.id = 'mm-css';
  s.textContent = `
.mm-card.mm-claro{--mm-corpo:#9ea0aa;--mm-base:#c3c5cd;--mm-cabelo:#7d7f88}
.mm-card{padding:14px 14px 12px;--mm-corpo:#26262b;--mm-base:#3b3b42;--mm-cabelo:#3c3a40}
.mm-fases{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.mm-fase{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;min-width:0;text-align:left;background:rgba(127,127,127,.08);border:0;border-radius:12px;padding:12px 10px 10px;color:var(--text);font:inherit;cursor:pointer;overflow:hidden}
.mm-fase b{font-size:12px!important;letter-spacing:-.2px;line-height:1.2;max-width:100%;overflow-wrap:normal}
.mm-fase.on{background:rgba(127,127,127,.18)}
.mm-det{margin-top:10px}.mm-sum{list-style:none;display:flex;align-items:baseline;justify-content:space-between;gap:8px;cursor:pointer;padding:6px 0;font-weight:800;font-size:14px}
.mm-sum::-webkit-details-marker{display:none}.mm-det[open] .mm-sum small{opacity:.6}
.mm-tit{font-size:13px!important;font-weight:700}.mm-sum small{font-weight:400;font-size:11.5px;color:var(--text-mute)}
.mm-fase i{position:absolute;left:0;right:0;top:0;height:3px}
.mm-fase.f-aq i{background:#f5d547}.mm-fase.f-prin i{background:var(--primary,#ff6b2c)}.mm-fase.f-des i{background:#4dd6e0}
.mm-fase small{font-size:11.5px;color:var(--text-dim)}
.mm-f-ico svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;color:var(--text-dim)}
.mm-fase.f-aq .mm-f-ico svg{color:#f5d547}.mm-fase.f-prin .mm-f-ico svg{color:var(--primary,#ff6b2c)}.mm-fase.f-des .mm-f-ico svg{color:#4dd6e0}
.mm-fase-txt{font-size:12.5px;line-height:1.55;color:var(--text-dim);padding:10px 12px;border-radius:12px;background:rgba(127,127,127,.06);margin-top:6px;border-left:3px solid var(--primary)}
.mm-fase-txt.f-aq{border-color:#f5d547}.mm-fase-txt.f-des{border-color:#4dd6e0}
.mm-topo{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0 8px}
.mm-tit{font-size:15px;color:var(--primary-2,#ff8a4c)}
.mm-legenda{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-bottom:6px}
.mm-chip{display:inline-flex;align-items:center;gap:6px;background:none;border:0;padding:3px 2px;color:var(--text);font:inherit;font-size:13px;cursor:pointer;border-radius:8px}
.mm-chip i{width:10px;height:10px;border-radius:2px;flex:none}.mm-chip.sec{color:var(--text-dim)}.mm-chip.sec i{opacity:.5}
.mm-chip.sel{background:rgba(127,127,127,.16);padding:3px 8px}.mm-chip small{color:var(--text-mute);font-size:11px}
.mm-leg-nota,.mm-vazio{width:100%;font-size:11px;color:var(--text-mute)}
.mm-corpos{display:grid;grid-template-columns:1fr 1fr;gap:4px;align-items:start;max-width:420px;margin:0 auto;-webkit-tap-highlight-color:transparent}
.mm-svg{width:100%;height:auto;display:block;overflow:visible}
.mm-svg path,.mm-svg ellipse{stroke:var(--mm-corpo);stroke-width:1.5;stroke-linejoin:round}
.mm-svg .mm-sil{fill:var(--mm-corpo);stroke-width:2.2}.mm-svg .mm-base{fill:var(--mm-corpo);stroke:none}.mm-svg .mm-cabelo{fill:var(--mm-cabelo);stroke:none}
.mm-svg .mm-m{fill:var(--mm-base);cursor:pointer;transition:fill-opacity .2s}
.mm-svg .mm-m.sel{stroke:var(--text-strong,#fff);stroke-width:1.6}
.mm-rodape{display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:11px;color:var(--text-mute)}
.mm-modo{display:flex;gap:4px;padding:3px;border-radius:12px;background:var(--surface-2)}
.mm-modo button{border:0;background:transparent;color:var(--text-dim);font:inherit;font-size:12.5px;font-weight:700;padding:6px 12px;border-radius:9px;cursor:pointer}
.mm-modo button.on{background:var(--bg-2);color:var(--text-strong);box-shadow:var(--shadow-sm)}
.mm-sexo{background:none;border:0;color:var(--primary-2);font:inherit;font-size:12px;font-weight:700;padding:6px 0;cursor:pointer}
.mm-info{margin-top:8px;padding:10px 12px;border-radius:12px;background:rgba(127,127,127,.08);font-size:12.5px;line-height:1.5}
.mm-info p{margin:4px 0}.mm-mute{color:var(--text-mute)}
.mm-info-t{display:flex;align-items:center;gap:8px}.mm-info-t i{width:12px;height:12px;border-radius:3px}.mm-info-t b{flex:1;font-size:14px}
.mm-x{background:none;border:0;color:var(--text-mute);font-size:15px;cursor:pointer;padding:2px 4px}
@media (min-width:900px){.mm-corpos{max-width:360px}}
`; document.head.appendChild(s); })();

Object.assign(window, { mmAberto, mmCorpoSVG, mmMusculosDe, mmSeriesSemana, mmFase, mmModo, mmSel, mmToque, mmSexo, mmPintar, mmRenderCartao, MM_INFO });

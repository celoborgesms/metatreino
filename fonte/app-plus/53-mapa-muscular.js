
// =====================================================================
// 53. Beta 50 — Anatomia muscular (consulta) e orientações do treino
// =====================================================================
// • Treinos › sessão de musculação: só um cartão compacto "Orientações do treino" (Preparação · Sessão de
//   treino · Finalização), com textos montados a partir dos exercícios, músculos, equipamento e duração do dia,
//   e o link discreto "Ver músculos trabalhados". O mapa NÃO abre sozinho na aba Treinos.
// • Um único mapa (mmAbrir), aberto como janela a partir de: orientações do treino (treino de hoje),
//   Progresso › Desempenho › "Anatomia muscular" (semana / consulta livre) e a ficha do exercício ("Ver no mapa").
// • Desenho vetorial próprio em estilo de atlas: um corpo por vez (o do sexo do perfil; sem sexo no perfil, uma
//   versão neutra), vista Frente/Costas alternada, proporções fixas (não muda com peso e altura).
// • Músculos: principal (cor cheia), secundário (cor clara) e estabilizador (só contorno tracejado) — vêm do
//   grupo e da ênfase cadastrados no catálogo (EX_BANK), a mesma fonte da ficha do exercício.
// • Leve: cada corpo (vista × sexo) é montado uma vez e guardado; tocar só troca classes e cores.

// ---------- 1. desenho ----------
// Coordenadas do lado esquerdo da tela (x < 100); o lado direito é espelhado. viewBox 0 0 200 440,
// cânone de ~8 cabeças: queixo 62, mamilo 116, umbigo 166, virilha 218, joelho 316, pés 432.
const MM_CABECA = [[100,11],[91,13],[85,20],[82,30],[82.5,41],[85,50],[89,57],[95,62],[100,63]];
const MM_TRONCO = [[100,60],[92,61],[91,70],[84,75],[72,79],[63,83],[61,94],[62,110],[64,126],[66,142],[68,157],[69,170],[68,184],[65,198],[63,212],[62,232],[62.5,254],[64.5,276],[68,298],[71,312],[70.5,326],[69.5,344],[70,364],[72.5,386],[75,402],[73,413],[70,423],[76,430],[90,431],[93,423],[92,408],[93,388],[95,366],[96,344],[95,326],[95.5,312],[97,292],[98,266],[99,240],[100,220]];
const MM_BRACO = [[67,80],[58,81.5],[50.5,86],[46,96],[44,110],[42,126],[40,144],[37.5,160],[35,176],[31.5,194],[28,210],[25.5,224],[24,234],[20.5,243],[18.5,255],[20,266],[25.5,272],[31.5,268],[34,257],[35,246],[36,238],[39.5,224],[43.5,208],[47.5,192],[51,178],[54,165],[57,151],[60,137],[62,123],[63,108],[63,94]];
// placas: m = músculo (null = estrutura sem destaque: mãos, joelho, pés…), g = região, c = placa central
const MM_FRENTE = [
  { m:'trapezio', g:'tronco', p:[[91.5,64],[86,71],[76,77],[66,81],[74,83],[86,78],[92,73]] },
  { m:'deltoide', g:'braco', p:[[67,82],[58,83.5],[51.5,88],[47,98],[46,110],[48,121],[53,118],[58,110],[62.5,100],[66,90]] },
  { m:'peito', g:'tronco', p:[[98.6,82],[91,80],[80,81.5],[70,87],[65,97],[64,109],[67.5,120],[77,127],[89,129],[98.6,126]], pf:[[98.6,82],[91,80],[80,81.5],[70,87],[65,97],[64,110],[66.5,123],[73,132],[84,135],[93,132],[98.6,127]] },
  { m:'serratil', g:'tronco', p:[[65,122],[64.5,130],[70,134],[76,129]] },
  { m:'serratil', g:'tronco', p:[[65.5,134],[66,143],[71.5,146],[76.5,140]] },
  { m:'serratil', g:'tronco', p:[[66.5,146],[67.5,155],[72.5,157],[76.5,151]] },
  { m:'abdomen', g:'tronco', p:[[98.6,131],[90.5,131.5],[89.5,144],[98.6,145]] },
  { m:'abdomen', g:'tronco', p:[[98.6,148],[89.5,148],[89.5,161],[98.6,162]] },
  { m:'abdomen', g:'tronco', p:[[98.6,165],[89.5,165],[90,179],[98.6,180]] },
  { m:'abdomen', g:'tronco', p:[[98.6,183],[90,183],[91.5,198],[95,207],[98.6,213]] },
  { m:'obliquos', g:'tronco', p:[[87.5,132],[78,131],[75.5,143],[74,151],[87.5,149]] },
  { m:'obliquos', g:'tronco', p:[[87.5,152.5],[73.5,154.5],[70.5,165],[69.5,172],[87.5,171]] },
  { m:'obliquos', g:'tronco', p:[[87.5,174.5],[69,176],[67.5,186],[65.5,196],[74,203],[83,208],[89.5,210],[88,192]] },
  { m:'triceps', g:'braco', p:[[47,118],[44,132],[42,146],[41,157],[44,159],[46,146],[48.5,132],[51,121]] },
  { m:'biceps', g:'braco', p:[[58,116],[51.5,121],[46.5,132],[44,146],[43.5,158],[47,166],[52,163],[56,152],[59.5,138],[61.5,124]] },
  { m:'antebraco', g:'braco', p:[[41,158],[37,168],[34,182],[31,198],[28,214],[25.5,230],[29,231],[32.5,216],[36.5,200],[40.5,184],[44,172],[46,163]] },
  { m:'antebraco', g:'braco', p:[[46.5,164],[43,176],[39.5,192],[36,208],[32,224],[30.5,232],[35,234],[38.5,222],[43,206],[47.5,190],[51.5,176],[53.5,166],[50,162]] },
  { m:null, g:'mao', p:[[24.5,236],[20.5,244],[19,255],[20.5,265],[25.5,270],[31,266],[33,256],[34,246],[35,238]] },
  { m:null, g:'perna', p:[[65,198],[63,210],[63,222],[70,212],[78,206],[72,201]] },
  { m:'quadriceps', g:'perna', p:[[70,208],[64,222],[62.5,244],[63.5,268],[67,290],[72,304],[77,310],[77.5,292],[75,268],[74,244],[75,224]] },
  { m:'quadriceps', g:'perna', p:[[80,210],[76.5,226],[75.5,250],[77,274],[80.5,294],[85.5,302],[89,286],[89.5,258],[88,232],[85,214]] },
  { m:'quadriceps', g:'perna', p:[[92.5,264],[89.5,282],[88.5,298],[91.5,310],[96,306],[97.5,288],[97.5,270]] },
  { m:'adutores', g:'perna', p:[[99,222],[92,214],[88.5,232],[89.5,252],[92,266],[97,262],[99,244]] },
  { m:null, g:'perna', p:[[77,309],[76.5,318],[81,324],[89,323],[92.5,314],[87,307]] },
  { m:'tibial', g:'perna', p:[[71.5,326],[70.5,344],[71,366],[73.5,386],[77,398],[81,394],[81.5,370],[81,346],[79.5,328]] },
  { m:'panturrilha', g:'perna', p:[[85,326],[84,346],[85,368],[89,382],[94,370],[95.5,346],[94.5,328]] },
  { m:'panturrilha', g:'perna', p:[[84.5,386],[84,397],[88,404],[92,400],[93,389],[90,384]] },
  { m:null, g:'pe', p:[[76,404],[72.5,414],[71,424],[77,429.5],[89.5,429.5],[92,421],[91,407]] }
];
const MM_COSTAS = [
  { m:'trapezio', g:'tronco', c:1, p:[[100,58],[92.5,62],[86,71],[75,78],[64,83],[73,88],[84,99],[91,118],[96,138],[100,152]] },
  { m:'deltoide', g:'braco', p:[[66,82],[58,83.5],[51.5,88],[47,98],[46,110],[48,121],[53,118],[59,108],[64,98],[70,88]] },
  { m:'costas', g:'tronco', p:[[73,90],[66,98],[64.5,110],[69,119],[79,118],[86,108],[83,96]] },
  { m:'dorsal', g:'tronco', p:[[64.5,120],[64.5,136],[67,154],[68.5,170],[72,182],[82,190],[94.5,196],[95.5,174],[93,150],[89,130],[82,121],[72,121]] },
  { m:'lombar', g:'tronco', c:1, p:[[100,152],[95,156],[92.5,176],[92.5,196],[95.5,206],[100,209]] },
  { m:'obliquos', g:'tronco', p:[[68.5,176],[67,190],[65,200],[73,203],[82,197],[75,188]] },
  { m:'triceps', g:'braco', p:[[57,114],[50.5,120],[46,132],[44,146],[44,158],[48,164],[52,156],[54,142],[56,128]] },
  { m:'triceps', g:'braco', p:[[60,118],[57.5,132],[55,148],[52.5,162],[55,166],[58.5,152],[61,138],[62.5,124]] },
  { m:'antebraco', g:'braco', p:[[41,158],[37,168],[34,182],[31,198],[28,214],[25.5,230],[29,231],[32.5,216],[36.5,200],[40.5,184],[44,172],[46,163]] },
  { m:'antebraco', g:'braco', p:[[46.5,164],[43,176],[39.5,192],[36,208],[32,224],[30.5,232],[35,234],[38.5,222],[43,206],[47.5,190],[51.5,176],[53.5,166],[50,162]] },
  { m:null, g:'mao', p:[[24.5,236],[20.5,244],[19,255],[20.5,265],[25.5,270],[31,266],[33,256],[34,246],[35,238]] },
  { m:'gluteos', g:'perna', p:[[68,198],[64,206],[63.5,216],[70,212],[80,203],[76,198]] },
  { m:'gluteos', g:'perna', p:[[98.6,202],[90,198],[79,204],[70,214],[67,228],[71,240],[82,246],[92,247],[98.6,244]] },
  { m:'posteriores', g:'perna', p:[[68,240],[64,258],[63.5,280],[66.5,298],[72,308],[78,312],[80,296],[78,272],[76.5,252]] },
  { m:'posteriores', g:'perna', p:[[81.5,250],[80.5,274],[82,296],[87.5,310],[95,300],[97.5,276],[97,254],[90,250]] },
  { m:null, g:'perna', p:[[75,313],[74,320],[84,324],[93,320],[93,313],[86,311]] },
  { m:'panturrilha', g:'perna', p:[[72,322],[69.5,338],[70,356],[75,370],[81,372],[83.5,356],[83,336],[80,324]] },
  { m:'panturrilha', g:'perna', p:[[85.5,324],[85,342],[86,362],[90.5,374],[95.5,360],[96,338],[94,326]] },
  { m:'panturrilha', g:'perna', p:[[73.5,373],[74.5,386],[79,397],[90,399],[93,388],[93,376],[86,379],[80,377]] },
  { m:null, g:'pe', p:[[76,404],[73,414],[73,424],[78,429],[89.5,429],[92,420],[91,406]] }
];
// proporção: t = 0 masculino, 1 feminino, 0,5 neutro (perfil sem sexo). Nada muda com peso ou altura.
function _mmFator(y, t){
  let f;
  if(y < 64) f = 0.9;
  else if(y < 130) f = 0.82 + 0.02*(y-64)/66;                           // ombros e tórax mais estreitos
  else if(y < 192){ const u = (y-130)/62; f = 0.84 - 0.08*Math.sin(Math.PI*Math.min(1,u*1.25)); }   // cintura
  else if(y < 252){ const u = (y-192)/60; f = 0.88 + 0.26*Math.sin(Math.PI*Math.min(1, u*0.95)); }  // quadril
  else if(y < 320) f = 1.14 - 0.16*(y-252)/68;                          // coxas
  else f = 0.97;
  return 1 + (f - 1)*t;
}
function _mmWarp(pts, t, g){
  if(g === 'braco' || g === 'mao'){
    // braço: mais encorpado em torno da própria linha (no feminino, um pouco mais fino) e acompanha o ombro
    const dx = (100 - 63) * (1 - _mmFator(88, t));
    return pts.map(([x,y])=>{ const eixo = 53.5 - (y-90)*0.17; return [eixo + dx + (x - eixo)*(1.2 - 0.12*t), y]; });
  }
  if(!t) return pts;
  return pts.map(([x,y])=>[100 + (x - 100)*_mmFator(y, t), y]);
}
function _mmPath(pts){
  const n = pts.length; let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for(let i=0;i<n;i++){
    const p0 = pts[(i-1+n)%n], p1 = pts[i], p2 = pts[(i+1)%n], p3 = pts[(i+2)%n];
    const c1 = [p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6], c2 = [p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
const MM_INFLA = { antebraco:[1.1,1.02], abdomen:[1.04,1.03], serratil:[1.06,1.06], mao:[1,1], pe:[1,1] };
const _mmEsp = pts=>pts.map(([x,y])=>[200-x, y]);
const _mmCentro = pts=>pts.concat(_mmEsp(pts.slice(1,-1)).reverse());
const _mmCache = {};
function _mmT(sexo){ return sexo === 'f' ? 1 : sexo === 'm' ? 0 : 0.5; }
function mmCorpoSVG(vista, sexo){
  const k = vista + (sexo || 'n'); if(_mmCache[k]) return _mmCache[k];
  const t = _mmT(sexo), costas = vista === 'costas', f = sexo === 'f';
  const W = (p, g)=>_mmWarp(p, t, g);
  const tr = W(MM_TRONCO, 'tronco'), br = W(MM_BRACO, 'braco');
  const cab = MM_CABECA.map(([x,y])=>[100 + (x-100)*(1 - 0.05*t), 11 + (y-11)*(1 - 0.03*t)]);
  let h = '';
  // cabelo preso (feminino), atrás da cabeça
  if(f && costas) h += `<path class="mm-cab" d="M100 8C112 8 119 18 119 31C119 45 114 54 108 58C104 60 96 60 92 58C86 54 81 45 81 31C81 18 88 8 100 8Z"/><ellipse class="mm-cab" cx="100" cy="11" rx="7.5" ry="5.5"/>`;
  else if(f) h += `<ellipse class="mm-cab" cx="100" cy="9.5" rx="7" ry="5"/>`;
  h += `<path class="mm-sil" d="M${100-17*(1-0.05*t)} 31c-3.5-1-5 1.5-4.4 5.5c.5 3.6 2.3 6.4 4.9 6.6ZM${100+17*(1-0.05*t)} 31c3.5-1 5 1.5 4.4 5.5c-.5 3.6-2.3 6.4-4.9 6.6Z"/>`;
  // cada parte num caminho próprio: num caminho único, braço espelhado (sentido inverso) sobre o tronco abriria um "buraco"
  const silP = [_mmPath(_mmCentro(tr)), _mmPath(br), _mmPath(_mmEsp(br)), _mmPath(_mmCentro(cab))];
  const sil = silP.map(d=>`<path d="${d}"/>`).join('');
  h += silP.map(d=>`<path class="mm-sil" d="${d}"/>`).join('');
  if(f && costas) h += `<path class="mm-cab" d="M100 9C111 9 118 18 118 30C118 41 114 50 108 55C104 52 96 52 92 55C86 50 82 41 82 30C82 18 89 9 100 9Z"/>`;
  if(f && !costas) h += `<path class="mm-cab" d="M100 9.5C111 9.5 118 17 118.5 28C114 21 108 17.5 100 17.5C92 17.5 86 21 81.5 28C82 17 89 9.5 100 9.5Z"/>`;
  // placas levemente ampliadas a partir do centro e recortadas pela silhueta: preenchem o corpo e deixam
  // só a costura fina entre um músculo e outro
  const cid = 'mmc' + k;
  h += `<clipPath id="${cid}">${sil}</clipPath><g clip-path="url(#${cid})">`;
  const infla = (pts, pl)=>{
    const z = MM_INFLA[pl.m] || MM_INFLA[pl.g] || [1.06, 1.03];
    const cx = pts.reduce((a,q)=>a+q[0],0)/pts.length, cy = pts.reduce((a,q)=>a+q[1],0)/pts.length;
    return pts.map(([x,y])=>[cx + (x-cx)*z[0], cy + (y-cy)*z[1]]);
  };
  (costas ? MM_COSTAS : MM_FRENTE).forEach(pl=>{
    const base = (f && pl.pf) ? pl.pf : pl.p;
    const pts = pl.c ? W(base, pl.g) : infla(W(base, pl.g), pl);
    const cls = pl.m ? `mm-m" data-m="${pl.m}` : (pl.g === 'mao' || pl.g === 'pe') ? 'mm-ext' : 'mm-est';
    if(pl.c) h += `<path class="${cls}" d="${_mmPath(_mmCentro(pts))}"/>`;
    else h += `<path class="${cls}" d="${_mmPath(pts)}"/><path class="${cls}" d="${_mmPath(_mmEsp(pts))}"/>`;
  });
  h += '</g>';
  // linhas finas de referência (linha média, clavículas / espinha), como num atlas
  h += costas
    ? `<path class="mm-lin" d="M100 64V206"/>`
    : `<path class="mm-lin" d="M100 128V212M91 75C84 77 76 78 68 81M109 75C116 77 124 78 132 81"/>`;
  const rot = `Corpo ${f ? 'feminino' : sexo === 'm' ? 'masculino' : ''} ${costas ? 'de costas' : 'de frente'}`.replace('  ',' ');
  return _mmCache[k] = `<svg class="mm-svg" viewBox="12 2 176 434" role="img" aria-label="${rot}">${h}</svg>`;
}

// ---------- 2. músculos ----------
const MM_INFO = {
  peito:{ nome:'Peitoral maior', cor:'#ff6b2c', vista:'frente', local:'Frente do tórax, do esterno até o ombro.', faz:'Leva o braço para a frente e para dentro.', mov:['Empurrar à frente (supino, flexão)','Aproximar os braços (crucifixo, crossover)'] },
  deltoide:{ nome:'Deltoide (ombros)', cor:'#ff9a3c', vista:'frente', local:'Cobre a articulação do ombro, nas partes anterior, lateral e posterior.', faz:'Eleva o braço em todas as direções e estabiliza o ombro.', mov:['Elevar à frente e ao lado','Empurrar acima da cabeça','Levar o braço para trás (parte posterior)'] },
  trapezio:{ nome:'Trapézio', cor:'#a78bfa', vista:'costas', local:'Da base do crânio até o meio das costas, entre as escápulas.', faz:'Eleva, aproxima e abaixa as escápulas.', mov:['Encolher os ombros','Aproximar as escápulas nas remadas','Sustentar a postura dos ombros'] },
  costas:{ nome:'Romboides e infraespinal', cor:'#8b7cf6', vista:'costas', local:'Sobre e entre as escápulas.', faz:'Puxa as escápulas para trás e gira o ombro para fora.', mov:['Remadas','Rotação externa do ombro'] },
  dorsal:{ nome:'Grande dorsal', cor:'#7c6cf0', vista:'costas', local:'Laterais das costas, da axila até a cintura.', faz:'Puxa o braço para baixo e para trás, junto ao corpo.', mov:['Puxar de cima para baixo (puxada, barra fixa)','Puxar para trás (remada)'] },
  lombar:{ nome:'Eretores da espinha (lombar)', cor:'#f472b6', vista:'costas', local:'Ao longo da coluna, mais volumosos na região lombar.', faz:'Estende a coluna e a mantém firme sob carga.', mov:['Estender o tronco (hiperextensão)','Manter a coluna neutra no terra e no agachamento'] },
  biceps:{ nome:'Bíceps braquial', cor:'#d9a48f', vista:'frente', local:'Frente do braço, entre o ombro e o cotovelo.', faz:'Dobra o cotovelo e gira a palma para cima.', mov:['Roscas','Puxadas e remadas (auxiliar)'] },
  triceps:{ nome:'Tríceps braquial', cor:'#e8916f', vista:'costas', local:'Parte de trás do braço.', faz:'Estende o cotovelo.', mov:['Estender o braço (tríceps na polia, francês)','Supinos e desenvolvimentos (auxiliar)'] },
  antebraco:{ nome:'Antebraço', cor:'#c4ab97', vista:'frente', local:'Entre o cotovelo e o punho.', faz:'Segura a carga e movimenta o punho.', mov:['Pegada em puxadas, remadas e terra','Flexão e extensão do punho'] },
  abdomen:{ nome:'Reto abdominal', cor:'#ffb38a', vista:'frente', local:'Frente do abdômen, das costelas até a pelve.', faz:'Flexiona o tronco e estabiliza a coluna.', mov:['Encurtar o tronco (abdominal, elevação de pernas)','Manter o tronco firme (prancha)'] },
  obliquos:{ nome:'Oblíquos', cor:'#ec4f9c', vista:'frente', local:'Laterais do abdômen.', faz:'Gira e inclina o tronco; impede que ele torça sob carga.', mov:['Rotação e inclinação do tronco','Antirrotação (pallof, carregada)'] },
  serratil:{ nome:'Serrátil anterior', cor:'#6f8ff7', vista:'frente', local:'Lateral das costelas, abaixo da axila.', faz:'Mantém a escápula junto às costelas e ajuda a elevar o braço.', mov:['Empurrar até o fim do movimento','Elevar o braço acima da cabeça'] },
  gluteos:{ nome:'Glúteos', cor:'#f7d14a', vista:'costas', local:'Quadril, atrás e na lateral (glúteo máximo e médio).', faz:'Estende e abre o quadril; estabiliza a pelve.', mov:['Estender o quadril (elevação pélvica, terra)','Subir do agachamento','Abrir a perna (abdução)'] },
  quadriceps:{ nome:'Quadríceps', cor:'#f7a540', vista:'frente', local:'Frente da coxa.', faz:'Estende o joelho.', mov:['Agachamento e leg press','Cadeira extensora','Avanço e afundo'] },
  adutores:{ nome:'Adutores', cor:'#4fc3a1', vista:'frente', local:'Parte interna da coxa.', faz:'Aproxima as pernas e estabiliza o quadril.', mov:['Cadeira adutora','Agachamento amplo (auxiliar)'] },
  posteriores:{ nome:'Posteriores de coxa', cor:'#f0b860', vista:'costas', local:'Parte de trás da coxa.', faz:'Dobra o joelho e estende o quadril.', mov:['Mesa e cadeira flexora','Stiff e levantamento terra'] },
  panturrilha:{ nome:'Panturrilha (gastrocnêmio e sóleo)', cor:'#d6a77a', vista:'costas', local:'Parte de trás da perna, abaixo do joelho.', faz:'Estende o tornozelo (fica na ponta dos pés).', mov:['Elevação de panturrilha em pé e sentado','Impulsão na corrida e nos saltos'] },
  tibial:{ nome:'Tibial anterior', cor:'#9fb7c9', vista:'frente', local:'Frente da canela.', faz:'Levanta a ponta do pé.', mov:['Elevar a ponta do pé','Controle da pisada na corrida'] }
};
// músculos de cada exercício: principal, secundário e estabilizador, pelo grupo (part), ênfase (sub) e nome,
// como cadastrados no catálogo. Estabilizador nunca é marcado como principal.
function mmMusculosDe(ex){
  const part = ex.part || '', sub = mtNorm(ex.sub || ''), nome = mtNorm(ex.name || '');
  const P = new Set(), S = new Set(), E = new Set(); const p = (...a)=>a.forEach(x=>P.add(x)), s = (...a)=>a.forEach(x=>S.add(x)), e = (...a)=>a.forEach(x=>E.add(x));
  if(part === 'Peito'){ p('peito'); s('deltoide','triceps'); if(/serratil/.test(sub)) p('serratil'); if(/flexao/.test(nome)) e('abdomen','serratil'); }
  else if(part === 'Costas'){
    if(/lombar/.test(sub)){ p('lombar'); s('gluteos'); }
    else if(/cadeia posterior/.test(sub)){ p('lombar','gluteos','posteriores'); s('trapezio','antebraco'); e('abdomen'); }
    else if(/media|horizontal|espessura/.test(sub)){ p('costas','dorsal'); s('trapezio','biceps','deltoide'); }
    else { p('dorsal'); s('costas','biceps'); }
    if(/romboide/.test(sub)) p('costas'); if(/biceps|braquial/.test(sub)) s('biceps','antebraco');
    if(/curvad|cavalinho|serrote/.test(nome)) e('lombar','abdomen');
  }
  else if(part === 'Ombro'){ p('deltoide'); if(/trapezio/.test(sub)) p('trapezio'); if(/posterior|postura/.test(sub)) s('costas','trapezio'); else if(/forca|completo|frontal|avancado/.test(sub) || /desenvolv/.test(nome)) s('triceps','trapezio'); if(/em pe|militar/.test(nome)) e('abdomen','lombar'); }
  else if(part === 'Bíceps'){ p('biceps'); s('antebraco'); if(/braquial|antebraco/.test(sub)) p('antebraco'); }
  else if(part === 'Tríceps'){ p('triceps'); if(/peito/.test(sub)) s('peito','deltoide'); }
  else if(part === 'Pernas'){
    if(/quadriceps/.test(sub)){ p('quadriceps'); s('adutores'); }
    if(/gluteo/.test(sub)) p('gluteos');
    if(/posterior/.test(sub)){ p('posteriores'); s('gluteos'); e('lombar'); }
    if(/adutor/.test(sub)) p('adutores');
    if(/abdutor/.test(sub)) p('gluteos');
    if(!P.size) p('quadriceps','gluteos');
    if(/agach|leg press|avanco|afundo|passada|bulgaro|hack/.test(nome)) s('gluteos');
    if(/agach|avanco|afundo|passada|bulgaro|stiff|terra/.test(nome)) e('abdomen','lombar');
  }
  else if(part === 'Glúteos'){ p('gluteos'); s('posteriores'); if(/adutor/.test(sub)) p('adutores'); }
  else if(part === 'Panturrilha'){ p('panturrilha'); }
  else if(part === 'Trapézio'){ p('trapezio'); s('antebraco'); }
  else if(part === 'Core'){
    if(/obliquo|rotacao/.test(sub)) p('obliquos');
    if(/reto|inferior/.test(sub)) p('abdomen');
    if(!P.size){ p('abdomen'); e('obliquos','lombar'); }
    if(/pegada/.test(sub)) s('antebraco');
  }
  P.forEach(x=>{ S.delete(x); E.delete(x); }); S.forEach(x=>E.delete(x));
  return { prim:[...P], sec:[...S], est:[...E] };
}
function _mmExDoBanco(id){ try{ for(const c of EX_BANK){ const it = c.items.find(x=>slug(x.name) === id); if(it) return Object.assign({ part:c.name, id }, it); } }catch(e){} return null; }
function _mmExPorNome(nome){ try{ const a = exPorNome(nome); if(a) return Object.assign({ part:a.grupo }, a.ex); }catch(e){} return null; }
// séries dos últimos 7 dias por músculo (principal = 1; secundário = 0,5; estabilizador não conta)
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
// exercícios do catálogo que trabalham um músculo, por papel
function mmExerciciosDoMusculo(k){
  const out = { prim:[], sec:[], est:[] };
  try{ EX_BANK.forEach(c=>c.items.forEach(it=>{ const m = mmMusculosDe(Object.assign({ part:c.name }, it)); ['prim','sec','est'].forEach(r=>{ if(m[r].includes(k)) out[r].push(it.name); }); })); }catch(e){}
  return out;
}

// ---------- 3. orientações do treino (geradas pelo treino do dia) ----------
function _mmMusculosDoTreino(w){
  const prim = {}, sec = {}, est = {};
  (w.exercises||[]).forEach(e=>{ const m = mmMusculosDe(e); m.prim.forEach(k=>(prim[k] = prim[k] || []).push(e)); m.sec.forEach(k=>(sec[k] = sec[k] || []).push(e)); m.est.forEach(k=>(est[k] = est[k] || []).push(e)); });
  Object.keys(prim).forEach(k=>{ delete sec[k]; delete est[k]; }); Object.keys(sec).forEach(k=>delete est[k]);
  return { prim, sec, est };
}
const _mmCurto = k=>({ peito:'peito', deltoide:'ombros', trapezio:'trapézio', costas:'meio das costas', dorsal:'dorsais', lombar:'lombar', biceps:'bíceps', triceps:'tríceps', antebraco:'antebraços', abdomen:'abdômen', obliquos:'oblíquos', serratil:'serrátil', gluteos:'glúteos', quadriceps:'quadríceps', adutores:'adutores', posteriores:'posteriores de coxa', panturrilha:'panturrilhas', tibial:'tibial' })[k] || k;
const _mmLista = a=>a.length <= 1 ? (a[0]||'') : a.slice(0,-1).join(', ') + ' e ' + a[a.length-1];
// regiões do dia, pelos músculos principais
function _mmRegioes(M){
  const ks = Object.keys(M.prim);
  return {
    pernas: ks.some(k=>['quadriceps','gluteos','posteriores','adutores','panturrilha'].includes(k)),
    empurra: ks.some(k=>['peito','deltoide','triceps'].includes(k)),
    puxa: ks.some(k=>['dorsal','costas','biceps','trapezio','lombar'].includes(k)),
    core: ks.some(k=>['abdomen','obliquos'].includes(k))
  };
}
function _mmDescanso(w){
  // usa a faixa escrita na ficha ("45-60s", "90-120s", "2-3min"): menor início e maior fim
  let lo = Infinity, hi = 0;
  (w.exercises||[]).forEach(e=>{
    const t = String(e.rest || '').toLowerCase(); const ns = (t.match(/\d+(?:[.,]\d+)?/g) || []).map(x=>parseFloat(x.replace(',', '.'))); if(!ns.length) return;
    const k = /min/.test(t) && !/s\b|seg/.test(t.replace('min','')) ? 60 : 1;
    lo = Math.min(lo, ns[0]*k); hi = Math.max(hi, ns[ns.length-1]*k);
  });
  if(!hi) return '';
  const f = s=>s >= 120 && s % 60 === 0 ? (s/60) + ' min' : s >= 120 ? (s/60).toFixed(1).replace('.', ',') + ' min' : s + ' s';
  return lo === hi ? f(lo) : `${f(lo)} a ${f(hi)}`;
}
function mmEtapas(w){
  const dur = +w.duration || 45;
  const prep = dur >= 40 ? 8 : 5, fim = dur >= 40 ? 5 : 3;
  return { prep, sessao: Math.max(10, dur - prep - fim), fim, dur };
}
function _mmLocal(){ const eq = ((state.modules.lift||{}).setup||{}).equip || 'academia'; return eq; }
function mmGuia(w){
  const M = _mmMusculosDoTreino(w), R = _mmRegioes(M), E = mmEtapas(w), exs = w.exercises || [];
  const academia = _mmLocal() === 'academia';
  const prim = Object.keys(M.prim).sort((a,b)=>M.prim[b].length - M.prim[a].length);
  // preparação
  const leve = academia ? (R.pernas ? 'bicicleta ou esteira' : 'esteira, bicicleta ou elíptico') : (R.pernas ? 'marcha no lugar ou subir degraus' : 'marcha no lugar com giro de braços');
  const mob = [];
  if(R.pernas){ mob.push('quadril'); if(M.prim.quadriceps || M.prim.panturrilha) mob.push('tornozelos'); if(M.prim.gluteos) mob.push('ativação de glúteos'); }
  if(R.empurra){ mob.push('ombros'); if(M.prim.peito) mob.push('abertura do peito'); }
  if(R.puxa){ if(!mob.includes('ombros')) mob.push('ombros'); mob.push('coluna torácica'); }
  if(R.core && !mob.length) mob.push('coluna');
  const comCarga = exs.find(e=>{ try{ return !['corpo','improvisado','elastico'].includes(mtEquipClasse(e)); }catch(x){ return true; } });
  const prep = [
    `${E.prep <= 5 ? '2–3' : '3–5'} min de ${leve}, em ritmo leve.`,
    `Mobilidade de ${_mmLista(mob.slice(0,3)) || 'corpo todo'}: poucas repetições lentas, sem forçar.`,
    comCarga ? `Em <b>${mtEsc(comCarga.name)}</b>, faça 1–2 séries leves de aquecimento antes das séries do treino. Elas não são registradas e não entram na evolução de carga.` : 'Os exercícios de hoje usam peso do corpo: a primeira série, feita com calma, já serve de aquecimento.'
  ];
  // sessão
  const ordem = exs.map(e=>e.name);
  const desc = _mmDescanso(w);
  const sessao = [
    `<b>~${E.sessao} min · ${exs.length} exercício${exs.length === 1 ? '' : 's'}.</b> Foco em ${_mmLista(prim.slice(0,3).map(_mmCurto)) || 'corpo todo'}.`,
    `Siga a ordem da ficha: ${ordem.slice(0,3).map(mtEsc).join(' → ')}${ordem.length > 3 ? ` e mais ${ordem.length - 3}` : ''}.`,
    `Respeite os intervalos${desc ? ` (${desc})` : ''} e registre cada série. É com esse registro que o app ajusta as próximas cargas.`
  ];
  // finalização
  const alonga = prim.slice(0,2).map(_mmCurto);
  const fim = [
    `${E.fim} min reduzindo a intensidade: ${R.pernas ? 'caminhe' : 'caminhe ou pedale'} em ritmo leve até a respiração voltar ao normal.`,
    `Se quiser, alongue ${_mmLista(alonga) || 'os músculos trabalhados'} de forma confortável, sem forçar.`
  ];
  return { E, prep, sessao, fim };
}
// compatibilidade com quem chamava a versão anterior
function mmEtapaTexto(fase, w){ const g = mmGuia(w); const a = fase === 'aq' || fase === 'prep' ? g.prep : fase === 'prin' || fase === 'sessao' ? g.sessao : g.fim; return a.join(' '); }

// ---------- 4. cartão compacto na sessão ----------
const MM_ICO = {
  prep:'<svg viewBox="0 0 24 24"><path d="M4 14a8 8 0 0 1 16 0"/><path d="M12 14l4-4"/><circle cx="12" cy="14" r="1.2"/></svg>',
  sessao:'<svg viewBox="0 0 24 24"><path d="M2.5 9.5v5M5.5 7.5v9M8.5 12h7M18.5 7.5v9M21.5 9.5v5"/></svg>',
  fim:'<svg viewBox="0 0 24 24"><path d="M3 12h4l2-5 4 10 2-5h6"/></svg>'
};
let _mmGuiaAberta = null;
function _mmTreinoAtual(){ try{ const mod = state.modules.lift; if(!mod || !mod.plan) return null; return (typeof currentSelectedWorkout === 'function' ? currentSelectedWorkout(mod) : null) || (mod.plan.workouts||[])[0] || null; }catch(e){ return null; } }
function mmGuiaHTML(w){
  const g = mmGuia(w);
  const B = (f, nome, min)=>`<button type="button" class="mg-f f-${f} ${_mmGuiaAberta === f ? 'on' : ''}" aria-expanded="${_mmGuiaAberta === f}" onclick="mmGuiaFase('${f}')"><span class="mg-ico">${MM_ICO[f]}</span><span class="mg-tx"><b>${nome}</b><small>${min}</small></span></button>`;
  return `<div class="card mg-card" id="mg-card">
    <div class="mg-topo"><span class="mg-tit">Orientações do treino</span></div>
    <div class="mg-fases">${B('prep','Preparação', g.E.prep + ' min')}${B('sessao','Sessão de treino', '~' + g.E.sessao + ' min')}${B('fim','Finalização', g.E.fim + ' min')}</div>
    <div class="mg-txt f-${_mmGuiaAberta || ''}" id="mg-txt" aria-live="polite" ${_mmGuiaAberta ? '' : 'hidden'}>${_mmGuiaAberta ? _mmGuiaLista(g[_mmGuiaAberta]) : ''}</div>
    <button type="button" class="mg-mapa" onclick="mmAbrir({modo:'hoje'})">Ver músculos trabalhados ›</button>
  </div>`;
}
const _mmGuiaLista = a=>`<ul>${a.map(x=>`<li>${x}</li>`).join('')}</ul>`;
function mmGuiaFase(f){
  _mmGuiaAberta = _mmGuiaAberta === f ? null : f;
  const w = _mmTreinoAtual(); const c = $('mg-card'); if(!w || !c) return;
  c.querySelectorAll('.mg-f').forEach(b=>{ const on = b.classList.contains('f-' + _mmGuiaAberta); b.classList.toggle('on', on); b.setAttribute('aria-expanded', on); });
  const box = $('mg-txt'); box.className = 'mg-txt f-' + (_mmGuiaAberta || '');
  if(_mmGuiaAberta){ box.innerHTML = _mmGuiaLista(mmGuia(w)[_mmGuiaAberta]); box.hidden = false; } else box.hidden = true;
}
function mmRenderGuia(){
  try{
    const velho = $('mg-card');
    if(state.active !== 'lift'){ if(velho) velho.remove(); return; }
    const slot = $('session-detail-slot'); if(!slot) return;
    const w = _mmTreinoAtual(); if(!w || !(w.exercises||[]).length){ if(velho) velho.remove(); return; }
    const html = mmGuiaHTML(w);
    if(velho){ velho.outerHTML = html; return; }
    // depois do resumo do treino e da barra de progresso; antes dos exercícios
    const ancora = slot.querySelector(':scope > .tr-anda') || slot.querySelector(':scope > .detail-hero');
    if(ancora) ancora.insertAdjacentHTML('afterend', html); else slot.insertAdjacentHTML('afterbegin', html);
  }catch(e){ console.log('orientações do treino:', e); }
}
mtGancho('renderSessions', { depois(){ mmRenderGuia(); } });

// ---------- 5. o mapa (uma janela só) ----------
let _mm = { modo:'hoje', vista:'frente', sel:null, ex:null, volta:null };
function _mmSexo(){ const s = ((state.user||{}).profile||{}).sex; return s === 'f' ? 'f' : s === 'm' ? 'm' : null; }
// papéis por músculo no contexto aberto: { k: 'prim'|'sec'|'est' } e séries da semana
function _mmPapeis(){
  if(_mm.modo === 'ex'){ const ex = _mmExPorNome(_mm.ex) || { name:_mm.ex }; const m = mmMusculosDe(ex); const o = {}; m.est.forEach(k=>o[k]='est'); m.sec.forEach(k=>o[k]='sec'); m.prim.forEach(k=>o[k]='prim'); return o; }
  if(_mm.modo === 'semana'){ const S = mmSeriesSemana(); const o = {}; Object.keys(S).forEach(k=>{ o[k] = S[k] >= 10 ? 'prim' : 'sec'; }); return o; }
  const w = _mmTreinoAtual(); if(!w) return {}; const M = _mmMusculosDoTreino(w); const o = {};
  Object.keys(M.est).forEach(k=>o[k]='est'); Object.keys(M.sec).forEach(k=>o[k]='sec'); Object.keys(M.prim).forEach(k=>o[k]='prim'); return o;
}
function mmAbrir(opts){
  opts = opts || {};
  const temTreino = !!_mmTreinoAtual();
  _mm = { modo: opts.modo || (opts.ex ? 'ex' : temTreino ? 'hoje' : 'semana'), vista:'frente', sel:null, ex: opts.ex || null, volta: opts.volta || null };
  if(_mm.modo === 'hoje' && !temTreino) _mm.modo = 'semana';
  const P = _mmPapeis(); const ks = Object.keys(P);
  if(ks.length && !ks.some(k=>MM_INFO[k].vista === 'frente') ) _mm.vista = 'costas';
  else if(_mm.modo === 'ex'){ const pr = ks.filter(k=>P[k]==='prim'); if(pr.length && pr.every(k=>MM_INFO[k].vista === 'costas')) _mm.vista = 'costas'; }
  const mi = $('modal-inner');
  mi.classList.remove('modal-video','modal-ex','short'); $('modal-back').classList.remove('ex-open');
  mi.dataset.tela = 'anatomia';
  mi.innerHTML = `<div class="mm-jan" id="mm-jan">
    <div class="mm-cab-t"><div><h3>Mapa muscular</h3><small id="mm-sub"></small></div><button class="mm-x" onclick="${_mm.volta ? 'mmVoltar()' : 'closeModal()'}" aria-label="${_mm.volta ? 'Voltar' : 'Fechar'}">✕</button></div>
    <div class="mm-modos" role="tablist" aria-label="O que mostrar">
      ${_mm.ex ? `<button type="button" role="tab" data-modo="ex" onclick="mmModo('ex')">Exercício</button>` : ''}
      ${temTreino ? `<button type="button" role="tab" data-modo="hoje" onclick="mmModo('hoje')">Treino de hoje</button>` : ''}
      <button type="button" role="tab" data-modo="semana" onclick="mmModo('semana')">Últimos 7 dias</button>
      <button type="button" role="tab" data-modo="livre" onclick="mmModo('livre')">Explorar</button>
    </div>
    <div class="mm-vistas" role="group" aria-label="Vista"><button type="button" data-v="frente" onclick="mmVista('frente')">Frente</button><button type="button" data-v="costas" onclick="mmVista('costas')">Costas</button></div>
    <div class="mm-palco" id="mm-palco" onclick="mmToque(event)" aria-label="Mapa muscular: toque num músculo para ver a ficha"></div>
    <div class="mm-leg" id="mm-leg"></div>
    <div class="mm-chips" id="mm-chips"></div>
    <div class="mm-ficha" id="mm-ficha" aria-live="polite" hidden></div>
  </div>`;
  if(_mmTemaClaro()) $('mm-jan').classList.add('mm-claro');
  $('modal-back').classList.add('on');
  mmPintar(true);
}
function mmVoltar(){ const v = _mm.volta; if(typeof v === 'function') v(); else closeModal(); }
function mmModo(m){ _mm.modo = m; _mm.sel = null; mmPintar(); }
function mmVista(v){ _mm.vista = v; mmPintar(true); }
function mmSel(k){
  _mm.sel = (k && _mm.sel !== k) ? k : null;
  if(_mm.sel && MM_INFO[_mm.sel].vista !== _mm.vista && !$('mm-palco').querySelector(`[data-m="${_mm.sel}"]`)) _mm.vista = MM_INFO[_mm.sel].vista;
  mmPintar(true);
}
// toque: o músculo sob o dedo; se cair numa costura ou borda, procura o mais próximo num raio de ~14 px
function mmToque(ev){
  let el = ev.target.closest && ev.target.closest('.mm-m');
  if(!el && document.elementsFromPoint){
    for(const r of [6, 10, 14]) { for(let a = 0; a < 8 && !el; a++){ const x = ev.clientX + r*Math.cos(a*Math.PI/4), y = ev.clientY + r*Math.sin(a*Math.PI/4); el = document.elementsFromPoint(x, y).find(n=>n.classList && n.classList.contains('mm-m')) || null; } if(el) break; }
  }
  if(el) mmSel(el.dataset.m);
}
function mmPintar(redesenha){
  const jan = $('mm-jan'); if(!jan) return;
  const sexo = _mmSexo(); const P = _mmPapeis(); const sem = _mm.modo === 'semana', livre = _mm.modo === 'livre';
  const S = sem ? mmSeriesSemana() : null;
  jan.querySelectorAll('.mm-modos button').forEach(b=>{ const on = b.dataset.modo === _mm.modo; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  jan.querySelectorAll('.mm-vistas button').forEach(b=>{ const on = b.dataset.v === _mm.vista; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  const w = _mmTreinoAtual();
  $('mm-sub').textContent = _mm.modo === 'ex' ? _mm.ex : _mm.modo === 'hoje' ? (w ? w.name : '') : sem ? 'Séries registradas por músculo' : 'Toque em qualquer músculo';
  const palco = $('mm-palco');
  if(redesenha || !palco.firstChild) palco.innerHTML = mmCorpoSVG(_mm.vista, sexo);
  palco.classList.toggle('tem-sel', !!_mm.sel);
  palco.querySelectorAll('.mm-m').forEach(el=>{
    const k = el.dataset.m; const papel = livre ? null : P[k]; const cor = MM_INFO[k].cor;
    el.classList.remove('prim','sec','est');
    if(papel) el.classList.add(papel);
    el.style.fill = (papel === 'prim' || papel === 'sec' || (livre && _mm.sel === k)) ? cor : '';
    el.style.stroke = papel === 'est' ? cor : '';
    if(sem && papel){ const v = S[k] || 0; el.style.fillOpacity = v >= 10 ? 1 : v >= 6 ? 0.75 : 0.5; } else el.style.fillOpacity = '';
    el.classList.toggle('sel', _mm.sel === k);
  });
  // legenda
  const leg = $('mm-leg');
  leg.innerHTML = livre ? '<span>Toque num músculo para ver localização, função e exercícios.</span>'
    : sem ? '<span><i class="lg prim"></i>10 séries ou mais</span><span><i class="lg sec"></i>menos de 10</span><span class="mm-mute">secundário conta meia série</span>'
    : '<span><i class="lg prim"></i>Principal</span><span><i class="lg sec"></i>Secundário</span><span><i class="lg est"></i>Estabilizador</span>';
  // lista de músculos (toque acessível, também troca a vista)
  const ord = { prim:0, sec:1, est:2 };
  const ks = livre ? Object.keys(MM_INFO) : Object.keys(P).sort((a,b)=>ord[P[a]] - ord[P[b]] || (sem ? (S[b]||0) - (S[a]||0) : 0));
  const rot = { prim:'principal', sec:'secundário', est:'estabilizador' };
  $('mm-chips').innerHTML = ks.length ? ks.map(k=>`<button type="button" class="mm-chip ${livre ? '' : P[k]} ${_mm.sel === k ? 'sel' : ''}" onclick="mmSel('${k}')"><i style="--c:${MM_INFO[k].cor}"></i>${_mmCurto(k).replace(/^./, c=>c.toUpperCase())}${livre ? '' : sem ? ` <small>${_mmFmtS(S[k])}</small>` : ` <small>${rot[P[k]]}</small>`}</button>`).join('')
    : `<span class="mm-mute">${sem ? 'Nenhuma série registrada nos últimos 7 dias.' : 'Sem músculos para mostrar.'}</span>`;
  mmFicha();
}
const _mmFmtS = v=>{ const r = Math.round((v||0)*2)/2; return String(r).replace('.5', ',5') + (r === 1 ? ' série' : ' séries'); };
function mmFicha(){
  const box = $('mm-ficha'); if(!box) return; const k = _mm.sel;
  if(!k || !MM_INFO[k]){ box.hidden = true; return; }
  const I = MM_INFO[k]; const P = _mmPapeis(); const papel = _mm.modo === 'livre' ? null : P[k];
  const rot = { prim:'Principal', sec:'Secundário', est:'Estabilizador' };
  const lista = mmExerciciosDoMusculo(k);
  const w = _mmTreinoAtual(); const M = w ? _mmMusculosDoTreino(w) : { prim:{}, sec:{}, est:{} };
  const hoje = [['prim','principal'],['sec','secundário'],['est','estabilizador']].map(([r, n])=>(M[r][k]||[]).map(e=>`${mtEsc(e.name)} <small>(${n})</small>`)).flat();
  const cat = (a, n)=>a.length ? `<p><b>${n}:</b> ${a.slice(0,6).map(mtEsc).join(', ')}${a.length > 6 ? ` e mais ${a.length - 6}` : ''}</p>` : '';
  const S = mmSeriesSemana(); const v = S[k] || 0;
  box.innerHTML = `<div class="mm-f-t"><i style="--c:${I.cor}"></i><b>${I.nome}</b>${papel ? `<span class="mm-papel ${papel}">${rot[papel]}${_mm.modo === 'ex' ? '' : _mm.modo === 'hoje' ? ' hoje' : ''}</span>` : ''}</div>
    <dl><dt>Localização</dt><dd>${I.local}</dd><dt>Função</dt><dd>${I.faz}</dd><dt>Movimentos</dt><dd>${I.mov.join(' · ')}</dd></dl>
    ${hoje.length && _mm.modo !== 'ex' ? `<div class="mm-f-sec"><h5>No treino de hoje</h5><p>${hoje.join(', ')}</p></div>` : ''}
    <div class="mm-f-sec"><h5>Exercícios do MetaTreino</h5>${cat(lista.prim, 'Como principal')}${cat(lista.sec, 'Como secundário')}${cat(lista.est, 'Como estabilizador')}</div>
    <p class="mm-mute">Últimos 7 dias: <b>${_mmFmtS(v)}</b>${v ? (v < 10 ? ' (referência comum para hipertrofia: 10 a 20 por semana)' : v <= 20 ? ' (dentro da referência comum de 10 a 20)' : ' (acima da referência comum; observe a recuperação)') : ''}.</p>`;
  box.hidden = false;
}

// ---------- 6. entradas: Progresso › Desempenho e ficha do exercício ----------
function mmRenderEntradaProgresso(){
  try{
    const scr = $('scr-perf'); if(!scr) return; const velho = $('mm-entrada');
    if(state.active !== 'lift' || !state.modules.lift){ if(velho) velho.remove(); return; }
    if(velho) return;
    const evo = $('perf-evo');
    const html = `<button type="button" class="card mm-entrada${_mmTemaClaro() ? ' mm-claro' : ''}" id="mm-entrada" onclick="mmAbrir({modo:'semana'})"><span class="mm-ent-ico">${mmCorpoSVG('frente', _mmSexo())}</span><span class="mm-ent-tx"><b>Mapa muscular</b><small>Músculos trabalhados na semana, localização, função e exercícios</small></span><span class="mm-ent-seta">›</span></button>`;
    if(evo) evo.insertAdjacentHTML('beforebegin', html); else { const wrap = scr.querySelector('.wrap'); if(wrap) wrap.insertAdjacentHTML('beforeend', html); }
  }catch(e){}
}
mtGancho('renderPerf', { depois(){ mmRenderEntradaProgresso(); } });
// ficha do exercício: papéis dos músculos e "Ver no mapa" (abre o mesmo mapa, com volta para a ficha)
function mmFichaMusculosHTML(ex, grupo){
  const m = mmMusculosDe(Object.assign({ part:grupo || ex.part || '' }, ex));
  if(!m.prim.length && !m.sec.length) return '';
  const L = (a, n, c)=>a.length ? `<div class="mm-fx ${c}"><span>${n}</span>${a.map(k=>`<b><i style="--c:${MM_INFO[k].cor}"></i>${_mmCurto(k)}</b>`).join('')}</div>` : '';
  return `<div class="mm-fx-box">${L(m.prim,'Principal','prim')}${L(m.sec,'Secundário','sec')}${L(m.est,'Estabilizador','est')}
    <button type="button" class="mm-fx-mapa" onclick="mmAbrirDoExercicio('${mtJsStr(ex.name)}')">Ver no mapa muscular ›</button></div>`;
}
function mmAbrirDoExercicio(nome){ mmAbrir({ ex:nome, modo:'ex', volta:()=>openExerciseSheet(nome) }); }
mtGancho('openExerciseSheet', { depois(name){
  try{
    const sec = [...document.querySelectorAll('#modal-inner .ex-sec')].find(s=>/Músculos trabalhados/.test((s.querySelector('h4')||{}).textContent || ''));
    if(!sec || sec.querySelector('.mm-fx-box')) return;
    const a = exPorNome(name); const ex = a ? a.ex : { name }; const html = mmFichaMusculosHTML(ex, a ? a.grupo : '');
    if(html) sec.insertAdjacentHTML('beforeend', html);
  }catch(e){}
} });

(function(){ if(document.getElementById('mm-css')) return; const s = document.createElement('style'); s.id = 'mm-css';
  s.textContent = `
/* orientações do treino */
.mg-card{padding:12px 12px 10px}
.mg-topo{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.mg-tit{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text-mute)}
.mg-mapa{display:block;margin:8px 0 0 auto;background:none;border:0;padding:4px 0;color:var(--primary-2,#ff8a4c);font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}
.mg-fases{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.mg-f{display:flex;align-items:center;gap:7px;min-width:0;text-align:left;background:rgba(127,127,127,.08);border:1px solid transparent;border-radius:12px;padding:9px 8px;color:var(--text);font:inherit;cursor:pointer}
.mg-f.on{border-color:var(--mg-c);background:rgba(127,127,127,.14)}
.mg-f.f-prep{--mg-c:#e9c46a}.mg-f.f-sessao{--mg-c:var(--primary,#ff6b2c)}.mg-f.f-fim{--mg-c:#5cc8d4}
.mg-ico svg{width:20px;height:20px;fill:none;stroke:var(--mg-c);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;display:block}
.mg-tx{display:flex;flex-direction:column;min-width:0}.mg-tx b{font-size:12px;line-height:1.15}.mg-tx small{font-size:11px;color:var(--text-mute)}
.mg-txt{margin-top:8px;padding:9px 12px;border-radius:12px;background:rgba(127,127,127,.06);border-left:3px solid var(--primary);font-size:12.8px;line-height:1.5;color:var(--text-dim)}
.mg-txt.f-prep{border-color:#e9c46a}.mg-txt.f-fim{border-color:#5cc8d4}
.mg-txt ul{margin:0;padding-left:16px}.mg-txt li{margin:2px 0}.mg-txt b{color:var(--text)}
@media (max-width:370px){.mg-ico{display:none}}
/* mapa */
.mm-jan{--mm-corpo:#26262c;--mm-base:#474751;--mm-linha:#121215;--mm-cabelo:#3a383e}
.mm-jan.mm-claro,.mm-entrada.mm-claro{--mm-corpo:#c9cad0;--mm-base:#dcdde2;--mm-linha:#8d8f98;--mm-cabelo:#a9a7ad}
.mm-cab-t{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.mm-cab-t h3{margin:0}.mm-cab-t small{color:var(--text-mute);font-size:12.5px}
.mm-x{background:none;border:0;color:var(--text-mute);font-size:18px;cursor:pointer;padding:4px 6px}
.mm-modos{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:10px 0 8px;padding-bottom:2px}.mm-modos::-webkit-scrollbar{display:none}
.mm-modos button{flex:none;border:1px solid rgba(127,127,127,.25);background:none;color:var(--text-dim);font:inherit;font-size:12.5px;font-weight:700;padding:7px 12px;border-radius:999px;cursor:pointer}
.mm-modos button.on{background:var(--text-strong,#fff);color:var(--bg,#000);border-color:transparent}
.mm-vistas{display:flex;justify-content:center;gap:2px;margin:0 auto 6px;width:max-content;padding:3px;border-radius:10px;background:var(--surface-2)}
.mm-vistas button{border:0;background:none;color:var(--text-dim);font:inherit;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:6px 16px;border-radius:8px;cursor:pointer}
.mm-vistas button.on{background:var(--bg-2);color:var(--text-strong);box-shadow:var(--shadow-sm)}
.mm-palco{display:flex;justify-content:center;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.mm-svg{height:min(56vh,480px);width:auto;max-width:100%;display:block}
.mm-svg path,.mm-svg ellipse{stroke-linejoin:round}
.mm-svg .mm-sil{fill:var(--mm-corpo);stroke:var(--mm-linha);stroke-width:1.1}
.mm-svg .mm-cab{fill:var(--mm-cabelo);stroke:var(--mm-linha);stroke-width:.8}
.mm-svg .mm-ext{fill:var(--mm-corpo);stroke:var(--mm-linha);stroke-width:.8}
.mm-svg .mm-est{fill:var(--mm-corpo);stroke:var(--mm-linha);stroke-width:.8}
.mm-svg .mm-lin{fill:none;stroke:var(--mm-linha);stroke-width:.7;opacity:.8}
.mm-svg .mm-m{fill:var(--mm-base);stroke:var(--mm-linha);stroke-width:.9;cursor:pointer;transition:fill-opacity .15s,opacity .15s}
.mm-svg .mm-m.est{stroke-width:1.5;stroke-dasharray:2.2 1.6}
.mm-svg .mm-m.sec{fill-opacity:.5}
.mm-palco.tem-sel .mm-m:not(.sel){opacity:.6}
.mm-svg .mm-m.sel{opacity:1;stroke:var(--text-strong,#fff);stroke-width:1.6;stroke-dasharray:none}
.mm-leg{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 14px;margin:6px 0;font-size:11.5px;color:var(--text-dim)}
.mm-leg span{display:inline-flex;align-items:center;gap:5px}
.lg{width:14px;height:10px;border-radius:3px;display:inline-block}.lg.prim{background:var(--text-dim)}.lg.sec{background:var(--text-dim);opacity:.4}.lg.est{border:1.5px dashed var(--text-dim)}
.mm-chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 6px}
.mm-chip{display:inline-flex;align-items:center;gap:6px;min-height:34px;border:1px solid rgba(127,127,127,.22);background:none;color:var(--text);font:inherit;font-size:12.5px;padding:5px 10px;border-radius:10px;cursor:pointer}
.mm-chip i{width:10px;height:10px;border-radius:3px;background:var(--c);flex:none}.mm-chip.sec i{opacity:.5}.mm-chip.est i{background:none;border:1.5px dashed var(--c)}
.mm-chip small{color:var(--text-mute);font-size:11px}.mm-chip.sel{border-color:var(--text-strong,#fff);background:rgba(127,127,127,.14)}
.mm-ficha{margin-top:6px;padding:12px;border-radius:14px;background:rgba(127,127,127,.08);font-size:12.8px;line-height:1.5}
.mm-f-t{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.mm-f-t i{width:12px;height:12px;border-radius:3px;background:var(--c)}.mm-f-t b{font-size:15px}
.mm-papel{font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;background:rgba(127,127,127,.18)}
.mm-papel.prim{background:var(--primary,#ff6b2c);color:#fff}
.mm-ficha dl{display:grid;grid-template-columns:auto 1fr;gap:4px 10px;margin:8px 0}.mm-ficha dt{color:var(--text-mute);font-size:11.5px;padding-top:1px}.mm-ficha dd{margin:0}
.mm-f-sec h5{margin:8px 0 2px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--text-mute)}.mm-f-sec p{margin:3px 0}
.mm-mute{color:var(--text-mute)}
/* Progresso */
.mm-entrada{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:0;color:var(--text);font:inherit;cursor:pointer;padding:12px 14px;margin-bottom:14px}
.mm-ent-ico .mm-svg{height:58px;width:auto}.mm-ent-ico .mm-m{fill:var(--mm-base)}
.mm-entrada{--mm-corpo:#2b2b31;--mm-base:#4a4a53;--mm-linha:#17171b;--mm-cabelo:#3a383e}
.mm-ent-tx{flex:1;display:flex;flex-direction:column;gap:2px}.mm-ent-tx b{font-size:15px}.mm-ent-tx small{color:var(--text-mute);font-size:12px;line-height:1.35}.mm-ent-seta{color:var(--text-mute);font-size:20px}
/* ficha do exercício */
.mm-fx-box{margin-top:8px;display:flex;flex-direction:column;gap:5px}
.mm-fx{display:flex;flex-wrap:wrap;align-items:center;gap:5px 8px;font-size:12.5px}.mm-fx>span{width:92px;color:var(--text-mute);font-size:11.5px}
.mm-fx b{display:inline-flex;align-items:center;gap:5px;font-weight:600}.mm-fx b i{width:9px;height:9px;border-radius:2px;background:var(--c)}
.mm-fx.sec b i{opacity:.5}.mm-fx.est b i{background:none;border:1.5px dashed var(--c)}
.mm-fx-mapa{align-self:flex-start;background:none;border:0;padding:4px 0;color:var(--primary-2,#ff8a4c);font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}
`; document.head.appendChild(s); })();

function _mmTemaClaro(){ try{ return typeof temaClaro === 'function' && temaClaro(); }catch(e){ return false; } }

Object.assign(window, { mmCorpoSVG, mmMusculosDe, mmSeriesSemana, mmExerciciosDoMusculo, mmGuia, mmGuiaFase, mmRenderGuia, mmEtapaTexto, mmAbrir, mmVoltar, mmModo, mmVista, mmSel, mmToque, mmPintar, mmAbrirDoExercicio, mmRenderEntradaProgresso, MM_INFO });

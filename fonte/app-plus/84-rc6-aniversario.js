// =====================================================================
// 84. RC 6 — Cartão de aniversário do Início
// Antes: o emoji 🎂 do título, o 🎉 do fim da frase e o ícone do cartão viravam a mesma estrela (três estrelas
// no mesmo cartão) e a frase era sempre a mesma. Agora: um bolo desenhado no traço dos outros ícones (sem emoji),
// título e frase sem emoji, e cinco frases diferentes — cada ano de aniversário usa uma (o ano escolhe, então a
// frase não muda ao reabrir o app no mesmo dia e muda no ano seguinte).
// Nada muda em quando o cartão aparece (isBirthdayToday, no app.js).
// =====================================================================
const BDAY_FRASES_COM = [
  n=>`Mais um ano, e ${n} no MetaTreino. Que o novo ciclo venha com saúde e disposição. Hoje o treino é opcional; comemorar, não.`,
  n=>`Um ano novo começa hoje. Você já tem ${n} no app: a constância que trouxe você até aqui segue com você. Aproveite o dia.`,
  n=>`Parabéns! ${n.charAt(0).toUpperCase() + n.slice(1)} até aqui. Que este ano traga bons treinos, boas noites de sono e tempo para quem importa.`,
  n=>`Feliz aniversário! Foram ${n} no MetaTreino. Hoje vale celebrar sem culpa; o plano continua amanhã, no seu ritmo.`,
  n=>`Mais um ano de vida e ${n} registrados. Que o próximo ciclo seja de evolução tranquila e de muita saúde.`
];
const BDAY_FRASES_SEM = [
  ()=>'Que este novo ciclo venha com saúde e disposição. Seja qual for o seu objetivo, estamos juntos nessa.',
  ()=>'Um ano novo começa hoje. Que ele traga energia para cuidar de você, um treino de cada vez.',
  ()=>'Parabéns! Que este ano seja de saúde, bons treinos e tempo para o que importa.',
  ()=>'Feliz aniversário! Hoje é dia de comemorar. Quando quiser começar, o seu plano está pronto.',
  ()=>'Mais um ano de vida. Que o próximo ciclo seja leve, saudável e cheio de conquistas.'
];
const BDAY_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M4 20.5h16"/><path d="M5.5 20.5v-6a1.5 1.5 0 0 1 1.5-1.5h10a1.5 1.5 0 0 1 1.5 1.5v6"/>'
  + '<path d="M5.5 16.2c1.1.9 2.2.9 3.3 0s2.2-.9 3.2 0 2.2.9 3.2 0 2.2-.9 3.3 0"/>'
  + '<path d="M12 13V9.6"/><path d="M12 7.6c-.9-.8-.9-1.9 0-3.1.9 1.2.9 2.3 0 3.1z"/></svg>';
function mtAniversarioDesenha(){
  try{
    const card = $('card-birthday'); if(!card || card.classList.contains('hidden')) return;
    const prof = state.user && state.user.profile;
    const nome = (prof && prof.nickname) || (state.user && state.user.name) || 'atleta';
    const total = [...((state.modules.lift && state.modules.lift.history) || []), ...((state.modules.run && state.modules.run.history) || [])].length;
    const i = new Date().getFullYear() % 5;
    const n = `${total} ${total === 1 ? 'treino registrado' : 'treinos registrados'}`;
    const msg = total > 0 ? BDAY_FRASES_COM[i](n) : BDAY_FRASES_SEM[i]();
    const ic = card.querySelector('.card-icon'); if(ic && !ic.querySelector('.bday-bolo')) ic.innerHTML = `<span class="bday-bolo">${BDAY_SVG}</span>`;
    const t = $('bday-title'); if(t) t.textContent = `Feliz aniversário, ${nome}!`;
    const m = $('bday-msg'); if(m) m.textContent = msg;
  }catch(e){ console.log('aniversário:', e); }
}
mtGancho('renderHome', { depois(){ mtAniversarioDesenha(); } });
(function(){ if(document.getElementById('rc5-bday-css')) return; const s = document.createElement('style'); s.id = 'rc5-bday-css';
  s.textContent = `#card-birthday .bday-bolo{display:grid;place-items:center;width:100%;height:100%;color:var(--accent-2,var(--accent))}
#card-birthday .bday-bolo svg{width:28px;height:28px}`;
  document.head.appendChild(s); })();
Object.assign(window, { mtAniversarioDesenha });

// =====================================================================
// 46. Beta 35 — Acessibilidade: nomes para botões só com ícone e teclado em elementos clicáveis
// =====================================================================
// Muitos botões do app mostram só um ícone (✕, 🗑️, ›...). Leitores de tela liam "botão" sem nome.
// Aqui cada botão sem texto ganha um nome (aria-label) a partir do title ou do ícone. Elementos que não
// são botões mas abrem algo ao tocar (cartões, linhas de menu) passam a ser alcançáveis pelo Tab e a
// responder a Enter/Espaço. Nada muda para quem usa o toque.
const A11Y_ICONES = [
  [/^(✕|×|✖|❌)$/, 'Fechar'], [/^🗑/, 'Excluir'], [/^✏/, 'Editar'], [/^(▶|⏵)/, 'Tocar'], [/^(⏸)/, 'Pausar'],
  [/^⚙/, 'Configurações'], [/^📤/, 'Compartilhar'], [/^(‹|←|⬅)/, 'Voltar'], [/^(›|→|➡)/, 'Avançar'], [/^(＋|\+)$/, 'Adicionar'],
  [/^(−|-)$/, 'Diminuir'], [/^🔔/, 'Ligar ou desligar o som'], [/^🔇/, 'Ligar o som'], [/^🔊/, 'Desligar o som'], [/^⛶/, 'Tela cheia'],
  [/^↩/, 'Desfazer'], [/^(✓|✅)$/, 'Confirmar'], [/^(⋮|⋯|…)$/, 'Mais opções'], [/^🔍/, 'Buscar'], [/^📋/, 'Copiar'], [/^🧹/, 'Limpar'],
  [/^📷/, 'Foto'], [/^💾/, 'Salvar'], [/^🔄/, 'Atualizar'], [/^❤/, 'Favoritar'], [/^ℹ/, 'Informações'], [/^❓/, 'Ajuda'], [/^💬/, 'Abrir o assistente'], [/^(➤|➜|⮕)$/, 'Enviar']
];
function _a11yTemTexto(el){ return /[A-Za-zÀ-ÿ0-9]{2,}/.test((el.textContent || '').trim()); }
function _a11yNome(el){
  const t = el.getAttribute('title'); if(t && t.trim()) return t.trim();
  const oc = el.getAttribute('onclick') || '', href = el.getAttribute('href') || '';
  if(/pickPhoto\(/.test(oc)) return 'Trocar foto de perfil';
  if(/^mailto:/.test(href)) return 'Enviar e-mail para o suporte';
  const tx = (el.textContent || '').trim();
  for(const [re, nome] of A11Y_ICONES) if(re.test(tx)) return nome;
  return '';
}
function a11yVarrer(raiz){
  try{
    (raiz || document).querySelectorAll('button:not([aria-label]):not([aria-labelledby]), a:not([aria-label])').forEach(el=>{
      if(_a11yTemTexto(el)) return;
      const n = _a11yNome(el); if(n) el.setAttribute('aria-label', n);
    });
    (raiz || document).querySelectorAll('[onclick]:not(button):not(a):not(input):not(select):not(textarea):not([role]):not(.screen)').forEach(el=>{
      const oc = el.getAttribute('onclick') || '';
      if(/event\.target\s*===?\s*this/.test(oc) || el.id === 'modal-back') return;   // fundo de janela: não é um botão
      el.setAttribute('role', 'button'); if(!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      if(!_a11yTemTexto(el)){ const n = _a11yNome(el); if(n) el.setAttribute('aria-label', n); }
    });
  }catch(e){}
}
// Enter ou Espaço num elemento clicável que não é botão de verdade
document.addEventListener('keydown', e=>{
  if((e.key !== 'Enter' && e.key !== ' ') || e.defaultPrevented) return;
  const el = e.target; if(!el || el.getAttribute('role') !== 'button' || /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
  e.preventDefault(); el.click();
});
let _a11yT = null;
try{
  new MutationObserver(()=>{ clearTimeout(_a11yT); _a11yT = setTimeout(()=>a11yVarrer(), 250); }).observe(document.body, { childList:true, subtree:true });
}catch(e){}
setTimeout(()=>a11yVarrer(), 1500);
Object.assign(window, { a11yVarrer });

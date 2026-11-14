
// =====================================================================
// 33. Beta 22 — Perfil em grupos recolhíveis
// =====================================================================
// O Perfil tinha ~20 linhas soltas. Agora: dados do corpo e do plano em cima e
// quatro grupos (Ajustar plano, Treino, Aplicativo, Conta e dados) que abrem com um toque.
// Beta 37: o app lembra quais grupos ficaram abertos só enquanto está aberto (trocar de aba e voltar mantém);
// fechar o app e abrir de novo começa com todos fechados.
try{ localStorage.removeItem('mt_pf_grupos'); }catch(e){}
function _pfGruposAbertos(){ try{ return JSON.parse(sessionStorage.getItem('mt_pf_grupos') || '[]'); }catch(e){ return []; } }
function pfGruposInit(){
  const abertos = _pfGruposAbertos();
  document.querySelectorAll('#scr-profile details.pf-grp').forEach(d=>{
    if(d.dataset.ok) return; d.dataset.ok = '1';
    if(abertos.includes(d.id)) d.open = true;
    d.addEventListener('toggle', ()=>{
      try{ const s = new Set(_pfGruposAbertos()); d.open ? s.add(d.id) : s.delete(d.id); sessionStorage.setItem('mt_pf_grupos', JSON.stringify([...s])); }catch(e){}
    });
  });
}
function pfGruposStatus(){
  // dor ou férias ativos aparecem no cabeçalho do grupo Treino, mesmo fechado
  const st = $('pf-g-treino-st'); if(!st) return;
  const it = [];
  try{ if(((state.user && state.user.pain) || []).length) it.push('🩹 com dor'); }catch(e){}
  try{ if(typeof vacationActive === 'function' && vacationActive()) it.push('🌴 férias'); }catch(e){}
  st.textContent = it.join(' · ');
}
mtGancho('renderProfile', { depois(){
  try{ pfGruposInit(); pfGruposStatus(); }catch(e){ console.log('perfil grupos', e); }
}});
// abrir um item do Perfil por outro caminho (ex.: Meta Assistente) abre o grupo dele
function pfAbrirGrupoDe(id){ const el = $(id); const d = el && el.closest('details.pf-grp'); if(d) d.open = true; }
Object.assign(window, { pfGruposInit, pfAbrirGrupoDe });

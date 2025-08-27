(function(){
  // Handle delete actions on loan cards directly, using Delete.ask
  // Works independently of the table view.
  function getLoanById(id){
    try{ return (Array.isArray(window.state?.loans)? window.state.loans:[]).find(l=> String(l.id)===String(id)) || null; }catch{ return null; }
  }
  async function onClick(ev){
    try{
      const btn = ev.target && ev.target.closest && ev.target.closest('.loan-card button[data-act="del"]');
      if(!btn) return;
      // Ignore table buttons
      if(btn.closest('#loansTable')) return;
      // avoid duplicate handling
      if(btn._dkHandledDel) return; btn._dkHandledDel = true; setTimeout(()=>{ try{ btn._dkHandledDel=false; }catch{} }, 300);
      ev.preventDefault(); ev.stopPropagation();
      const card = btn.closest('.loan-card');
      const id = btn.getAttribute('data-id') || (card && card.getAttribute('data-id')) || '';
      if(!id) return;
      const loan = getLoanById(id);
      if(!loan) return;
      // permission
      try{ if(window.isLimitedUser && window.isLimitedUser()){ if(String(loan.creditor||'').trim()!=='سارا' && !(window.isAdminUser && window.isAdminUser())) return; } }catch{}
      try{ if(window.canModifyLoan && !window.canModifyLoan(loan) && !(window.isAdminUser && window.isAdminUser())) return; }catch{}
      // confirm
      const ok = await (window.Delete?.ask ? window.Delete.ask('این قرض') : (window.confirmFa? window.confirmFa('این قرض حذف شود؟') : Promise.resolve(!!window.confirm('این قرض حذف شود؟'))));
      if(!ok) return;
      // mutate
      try{
        const loans = (Array.isArray(window.state?.loans)? window.state.loans:[]).filter(l=> l.id!==id);
        const pays  = (Array.isArray(window.state?.pays)? window.state.pays:[]).filter(p=> p.loanId!==id);
        window.state.loans = loans; window.state.pays = pays;
      }catch{}
      // refresh UI
      try{ window.refreshLoansCards && window.refreshLoansCards(); }catch{}
      try{ window.refreshPaysTable && window.refreshPaysTable(); }catch{}
      try{ window.refreshLoansTable && window.refreshLoansTable(); }catch{}
      try{ window.updateSummary && window.updateSummary(); }catch{}
    }catch{}
  }
  function init(){ try{ if(document._dkDeleteCardBound) return; document.addEventListener('click', onClick, true); document._dkDeleteCardBound=true; }catch{} }
  try{ window.DeleteCard = { init }; }catch{}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

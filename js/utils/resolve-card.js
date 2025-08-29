(function(){
  // Handle resolve actions on loan cards independently of the table view
  function getLoanById(id){
    try{ return (Array.isArray(window.state?.loans)? window.state.loans:[]).find(l=> String(l.id)===String(id)) || null; }catch{ return null; }
  }
  function todayISO(){ try{ return new Date().toISOString().slice(0,10); }catch{ return ''; } }
  async function onClick(ev){
    try{
      const btn = ev.target && ev.target.closest && ev.target.closest('.loan-card button[data-act="resolve"]');
      if(!btn) return;
      // ignore table buttons
      if(btn.closest && btn.closest('#loansTable')) return;
      ev.preventDefault(); ev.stopPropagation();
      const card = btn.closest('.loan-card');
      const id = btn.getAttribute('data-id') || (card && card.getAttribute('data-id')) || '';
      if(!id) return;
      const loan = getLoanById(id); if(!loan) return;
      // compute derived
      let d = {};
      try{ if(typeof window.computeLoanDerived==='function') d = window.computeLoanDerived(loan)||{}; }catch{}
      const bal = Number(d && d.balance)||0;
      const due = (d && d.nextDue) ? String(d.nextDue) : '';
      const isOverdue = (bal>0) && due && due < todayISO();
      // action
      if(isOverdue){
        try{ if(typeof window.openPaymentFormForLoan==='function'){ window.openPaymentFormForLoan(String(id)); return; } }catch{}
      }
      const rem = Number(d && d.remainingInstallments)||0;
      if(rem===0){
        try{ if(typeof window.resolveZeroInstallments==='function'){ await window.resolveZeroInstallments(String(id)); return; } }catch{}
      }
      // Fallback: delegate to table action if available
      try{
        const sel = `#loansTable button[data-act="resolve"][data-id="${id}"]`;
        const tbtn = document.querySelector(sel); if(tbtn){ tbtn.click(); return; }
      }catch{}
    }catch{}
  }
  function init(){ try{ if(document._dkResolveCardBound) return; document.addEventListener('click', onClick, true); document._dkResolveCardBound=true; }catch{} }
  try{ window.ResolveCard = { init }; }catch{}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

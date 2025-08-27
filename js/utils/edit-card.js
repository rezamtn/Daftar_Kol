(function(){
  // Global module to handle Edit button on loan cards independent of table view
  // Safe defensive checks; works even if table is removed.
  function getLoanById(id){
    try{
      const loans = Array.isArray(window.state?.loans) ? window.state.loans : [];
      return loans.find(l => String(l.id) === String(id)) || null;
    }catch{ return null; }
  }
  async function handleEditClick(ev){
    try{
      const btn = ev.target && (ev.target.closest && ev.target.closest('button[data-act="edit"]'));
      if(!btn) return;
      // Ignore table edit buttons to avoid double-handling — table has its own handler
      try{ if(btn.closest && btn.closest('#loansTable')) return; }catch{}
      const card = btn.closest && btn.closest('.loan-card');
      const id = (btn.getAttribute && btn.getAttribute('data-id')) || (card && card.getAttribute && card.getAttribute('data-id')) || '';
      if(!id) return;
      const loan = getLoanById(id);
      if(!loan) return;
      // permission check
      try{ if(window.isAdminUser && !window.isAdminUser() && window.canModifyLoan && !window.canModifyLoan(loan)) return; }catch{}
      // confirm
      let ok = true;
      try{
        const isClosed = String(loan.status||'') === 'closed';
        const msg = isClosed ? 'این قرض کامل بازپرداخت شده است، آیا از ویرایش این قرض مطمئن هستید؟' : 'آیا از ویرایش این قرض مطمئن هستید؟';
        if(typeof window.confirmFa === 'function') ok = await window.confirmFa(msg);
      }catch{}
      if(!ok) return;
      // enter edit mode with retry in case editor isn't initialized yet
      const tryInvoke = ()=>{
        try{
          if(typeof window.enterEditMode === 'function'){
            window.enterEditMode(loan);
            const sel = (window.IDS && window.IDS.loanForm) ? window.IDS.loanForm : '#loanForm';
            const lf = document.querySelector(sel);
            if(lf) lf.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return true;
          }
        }catch{}
        return false;
      };
      if(!tryInvoke()){
        [80, 200, 450, 900].forEach((ms)=> setTimeout(tryInvoke, ms));
      }
    }catch{}
  }

  function init(){
    try{
      if(document._editCardBound) return;
      document.addEventListener('click', handleEditClick, true);
      document._editCardBound = true;
    }catch{}
  }

  // Expose and auto-init
  try{ window.EditCard = { init }; }catch{}
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

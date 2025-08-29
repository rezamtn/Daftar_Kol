(function(){
  // Handle resolve actions on loan cards independently of the table view
  function getLoanById(id){
    try{ return (Array.isArray(window.state?.loans)? window.state.loans:[]).find(l=> String(l.id)===String(id)) || null; }catch{ return null; }
  }
  function todayISO(){ try{ return new Date().toISOString().slice(0,10); }catch{ return ''; } }
  // Local helpers (fallbacks)
  function toISO(x){ try{ return (typeof window.toISO==='function') ? window.toISO(x) : new Date(x).toISOString().slice(0,10); }catch{ return ''; } }
  function monthsDiffISO(a,b){
    try{
      if(!a||!b) return 0; const s=new Date(a), e=new Date(b);
      let total=(e.getFullYear()-s.getFullYear())*12+(e.getMonth()-s.getMonth());
      if(e.getDate()>=s.getDate()) total+=1; return Math.max(0,total);
    }catch{ return 0; }
  }
  function addMonthsISO(dateStr, m){
    try{ const d=new Date(dateStr); const t=new Date(d.getTime()); t.setMonth(t.getMonth()+Number(m||0)); if(t.getDate()!==d.getDate()) t.setDate(0); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`; }catch{ return ''; }
  }
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
      // compute derived (always recompute locally to avoid stale values)
      let remInst = 0;
      let nextDue = '';
      try{
        const pays = Array.isArray(window.state?.pays) ? window.state.pays : [];
        const paidCount = pays.filter(p=> String(p.loanId)===String(loan.id) && String(p.type)==='interest').length;
        let mode = parseInt(String(loan.interestPayoutMode ?? 1),10);
        if(!Number.isFinite(mode)) mode = 1; // default only if NaN; keep 0 as-is
        const startISO = toISO(loan.startDate);
        const repayISO2 = toISO(loan.repaymentDate);
        const durationMonths = (parseInt(String(loan.interestEveryMonths||0),10) || monthsDiffISO(startISO, repayISO2) || 0);
        const totalInst = (mode===0) ? 1 : (durationMonths>0 ? Math.ceil(durationMonths/(mode||1)) : 0);
        remInst = Math.max(0, totalInst - paidCount);
        if(mode===0){ nextDue = repayISO2; }
        else if(totalInst>0 && paidCount < totalInst){
          const target = (mode||1) * (paidCount+1);
          nextDue = startISO ? addMonthsISO(startISO, target) : '';
          if(repayISO2 && nextDue > repayISO2) nextDue = repayISO2;
        }
      }catch{}
      // robust fallback: if nextDue is missing, use repaymentDate coerced to ISO
      let repayISO = '';
      try{ repayISO = toISO(loan.repaymentDate); }catch{}
      const baseDue = nextDue || repayISO || '';
      const isOverdue = (Number(remInst)>0) && baseDue && baseDue < todayISO();
      // action
      if(isOverdue){
        try{ if(typeof window.dk_quickAddInterestPayment==='function'){ window.dk_quickAddInterestPayment(String(id)); return; } }catch{}
        // fallback to legacy form
        try{ if(typeof window.openPaymentFormForLoan==='function'){ window.openPaymentFormForLoan(String(id)); return; } }catch{}
      }
      // If status explicitly says awaiting principal, allow resolve path directly
      try{
        if(String(loan.status||'').toLowerCase()==='awaiting'){
          if(typeof window.resolveZeroInstallments==='function'){ await window.resolveZeroInstallments(String(id)); return; }
        }
      }catch{}
      if(Number(remInst)===0){
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

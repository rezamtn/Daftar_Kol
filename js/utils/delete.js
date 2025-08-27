// utils/delete.js — standardized delete flow for the whole app
(function(){
  const Delete = {
    // Ask with unified labels (uses Confirm module under the hood)
    ask: function(name){
      const noun = (name || 'این مورد').toString();
      const msg = `آیا از حذف ${noun} مطمئن هستید؟`;
      // Prefer Confirm module (standard confirmation UI)
      try{
        if(window.Confirm && typeof window.Confirm.ask === 'function'){
          return window.Confirm.ask(msg, { okText: 'حذف', cancelText: 'انصراف' });
        }
      }catch{}
      // Fallback to info modal (still styled nicely)
      try{
        if(typeof window.infoFa === 'function'){
          return window.infoFa(`حذف ${noun}` , `<div>${msg}</div>`, { okText: 'حذف', cancelText: 'انصراف' })
            .then(res=> (res===true) || (res==='ok') || (res && res.ok===true));
        }
      }catch{}
      // Last resort: native confirm
      try{ return Promise.resolve(!!window.confirm(msg)); }catch{ return Promise.resolve(true); }
    },
    // Bind a click handler to a specific element
    bindClick: function(el, getName, onConfirm){
      if(!el || el._dkDelBound) return; el._dkDelBound = true;
      el.addEventListener('click', async (ev)=>{
        try{
          ev.preventDefault(); ev.stopPropagation();
          const name = typeof getName==='function' ? getName(el) : (getName||'این مورد');
          const ok = await Delete.ask(name);
          if(ok && typeof onConfirm==='function') await onConfirm(el);
        }catch{}
      });
    },
    // Delegate by selector on document (for dynamic content)
    delegate: function(selector, getName, onConfirm){
      if(!selector || typeof onConfirm!=='function') return;
      if(Delete._delegated && Delete._delegated.has(selector)) return;
      Delete._delegated = Delete._delegated || new Set();
      Delete._delegated.add(selector);
      document.addEventListener('click', function(ev){
        try{
          const btn = ev.target && (ev.target.closest && ev.target.closest(selector));
          if(!btn) return;
          ev.preventDefault(); ev.stopPropagation();
          const name = typeof getName==='function' ? getName(btn) : (getName||'این مورد');
          Delete.ask(name).then(async(ok)=>{ if(ok) await onConfirm(btn); });
        }catch{}
      });
    }
  };
  window.Delete = Delete;
})();

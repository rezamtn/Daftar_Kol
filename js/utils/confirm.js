// utils/confirm.js — unified confirmation module with FA labels
(function(){
  const Confirm = {
    ask: async function(message, opts){
      const o = Object.assign({ okText: 'بله!', cancelText: 'نه!' }, opts||{});
      try{
        if(typeof window.confirmFa === 'function'){
          const res = await window.confirmFa(message, { okText: o.okText, cancelText: o.cancelText });
          // confirmFa returns boolean or shape; normalize:
          return (res===true) || (res==='ok') || (res && res.ok===true);
        }
      }catch{}
      // Fallback: native confirm (no custom labels)
      try{ return !!window.confirm(message); }catch{ return true; }
    },
    // Convenience helper for destructive actions
    delete: function(name){
      const msg = name ? `آیا از حذف ${name} مطمئن هستید؟` : 'آیا از حذف این مورد مطمئن هستید؟';
      return Confirm.ask(msg, { okText: 'بله!', cancelText: 'نه!' });
    }
  };
  window.Confirm = Confirm;
})();

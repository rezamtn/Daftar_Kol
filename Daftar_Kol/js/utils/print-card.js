// utils/print-card.js — reusable card-to-image utility
(function(){
  const ns = {};
  let cssInjected = false;

  function injectCss(){
    if(cssInjected) return; cssInjected = true;
    try{
      const id = 'dk-print-card-css'; if(document.getElementById(id)) return;
      const css = `
        .loan-card.lc-v2{ position:relative; }
        .loan-card .btn.print-btn{ position:absolute; top:6px; left:6px; z-index:2; opacity:.9 }
        .loan-card .btn.print-btn:hover{ opacity:1 }
        /* Snapshot theme */
        .loan-card.print-snapshot{ background:#ffffff !important; color:#0b1220 !important; border:1px solid #e2e8f0 !important; box-shadow:none !important; border-radius:12px !important }
        .loan-card.print-snapshot .lc-info{ background:transparent !important }
        .loan-card.print-snapshot .muted{ color:#334155 !important }
        .loan-card.print-snapshot .val{ color:#0b1220 !important }
        .loan-card.print-snapshot .badge{ filter:none !important }
        /* Keep mini-progress visible with colors that work on white */
        .mini-progress{ height:6px; border-radius:999px; overflow:hidden; background:#e5e7eb }
        .mini-progress > span{ display:block; height:100% }
        .mini-progress.paid > span{ background:#22c55e }
        .mini-progress.remain > span{ background:#a855f7 }
        /* Hide non-content while printing */
        .loan-card.printing .btn,
        .loan-card.printing .lc-foot { display:none !important }
        /* Keep status badges visible, but hide any buttons inside */
        .loan-card.printing .status-badges .btn{ display:none !important }
        .loan-card.print-snapshot .status-badges .badge{ display:inline-block !important; background:#0ea5e9 !important; color:#ffffff !important; padding:2px 8px; border-radius:10px; font-weight:600 }
        .loan-card.print-snapshot .status-badges .badge.warn{ background:#dc3545 !important }
        /* Ensure white background for inner containers */
        .loan-card.print-snapshot * { background-color:transparent !important; box-shadow:none !important }
      `;
      const st = document.createElement('style'); st.id = id; st.type='text/css'; st.appendChild(document.createTextNode(css));
      document.head.appendChild(st);
    }catch{}
  }

  ns.init = function(){ injectCss(); };

  async function loadHtml2Canvas(){
    try{ if(window.html2canvas && typeof window.html2canvas==='function') return window.html2canvas; }catch{}
    return await new Promise((resolve, reject)=>{
      try{
        const id='html2canvas-cdn';
        if(document.getElementById(id)){ const chk=()=> window.html2canvas? resolve(window.html2canvas): setTimeout(chk,50); return chk(); }
        const s=document.createElement('script'); s.id=id;
        s.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'; s.async=true;
        s.onload=()=> resolve(window.html2canvas);
        s.onerror=(e)=> reject(e);
        document.head.appendChild(s);
      }catch(err){ reject(err); }
    });
  }

  ns.print = async function(cardEl){
    if(!cardEl) return;
    injectCss();
    try{
      const html2canvas = await loadHtml2Canvas();
      cardEl.classList.add('print-snapshot','printing');
      await new Promise(r=> setTimeout(r, 0));
      const scale = Math.min(window.devicePixelRatio || 2, 3);
      const canvas = await html2canvas(cardEl, { backgroundColor:'#ffffff', scale, useCORS:true, logging:false });
      const url = canvas.toDataURL('image/png');
      const id = cardEl.getAttribute('data-id') || 'card';
      const iso = new Date().toISOString().slice(0,10);
      const a = document.createElement('a'); a.href=url; a.download=`loan_${id}_${iso}.png`; document.body.appendChild(a); a.click(); a.remove();
      cardEl.classList.remove('print-snapshot','printing');
    }catch(err){ try{ console.error('[PrintCard] failed', err); }catch{} }
  };

  ns.printById = function(loanId){
    try{
      const card = document.querySelector(`.loan-card[data-id="${loanId}"]`);
      if(card) return ns.print(card);
    }catch{}
  };

  ns.ensureButton = function(cardEl){
    try{
      injectCss();
      if(!cardEl) return;
      if(cardEl.querySelector('.print-btn')) return;
      const id = cardEl.getAttribute('data-id')||'';
      const btn = document.createElement('button');
      btn.className = 'btn small ghost print-btn';
      btn.title = 'گرفتن تصویر کارت';
      btn.textContent = '🖼️';
      btn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); ns.print(cardEl); });
      cardEl.insertBefore(btn, cardEl.firstChild);
    }catch{}
  };

  window.PrintCard = ns;
})();

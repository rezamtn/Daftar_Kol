// utils/print-card.js — reusable card-to-image utility
(function(){
  const ns = {};
  let cssInjected = false;

  function injectCss(){
    if(cssInjected) return; cssInjected = true;
    try{
      const id = 'dk-print-card-css'; if(document.getElementById(id)) return;
      // Load a Persian webfont (Vazirmatn) for correct RTL shaping in snapshots
      try{
        if(!document.getElementById('dk-vazirmatn-font')){
          const l = document.createElement('link');
          l.id='dk-vazirmatn-font'; l.rel='stylesheet';
          l.href='https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800&display=swap';
          document.head.appendChild(l);
        }
      }catch{}
      const css = `
        .loan-card.lc-v2{ position:relative; }
        /* Move button up to increase gap from header content */
        .loan-card .btn.print-btn{
          position:absolute; top:8px; left:12px; z-index:2; opacity:.96;
          /* subtle background to improve affordance */
          background: rgba(167,139,250,.14) !important; /* violet */
          border:1px solid rgba(167,139,250,.45) !important;
          color:#eae4ff !important;
          border-radius:10px !important;
          box-shadow: 0 6px 18px rgba(0,0,0,.25), 0 0 0 1px rgba(167,139,250,.20) inset !important;
          backdrop-filter: saturate(110%);
        }
        .loan-card .btn.print-btn:hover{ filter:none; opacity:1; background: rgba(167,139,250,.20) !important; border-color: rgba(167,139,250,.60) !important; }
        .loan-card .btn.print-btn:focus-visible{ outline:none; box-shadow:0 0 0 3px rgba(167,139,250,.35), 0 6px 18px rgba(0,0,0,.25) !important; }
        .loan-card .btn.print-btn .ico{ display:inline-block; margin-inline-end:6px }
        .loan-card .btn.print-btn:hover{ opacity:1 }
        /* Snapshot theme (keep RTL and inherit badge colors) */
        .loan-card.print-snapshot{ background:#ffffff !important; color:#0b1220 !important; border:1px solid #e2e8f0 !important; box-shadow:none !important; border-radius:12px !important; direction:rtl; unicode-bidi: plaintext; font-family:'Vazirmatn', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif !important; font-variant-ligatures: contextual; }
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
        /* Print-optimized badges: solid high-contrast colors for readability on white */
        .loan-card.print-snapshot .status-badges .badge{
          display:inline-block !important; padding:3px 10px; border-radius:10px; font-weight:800; font-size:13px;
          -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
          background:#e2e8f0 !important; color:#0b1220 !important; border:1px solid #94a3b8 !important;
          font-family:'Vazirmatn', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif !important;
          letter-spacing: 0 !important; word-spacing: 0 !important; white-space: nowrap !important;
          text-rendering: optimizeLegibility;
          font-feature-settings: "liga" 1, "calt" 1, "kern" 1;
        }
        .loan-card.print-snapshot .status-badges .badge.warn{ background:#fecaca !important; color:#7f1d1d !important; border-color:#ef4444 !important }
        .loan-card.print-snapshot .status-badges .badge.awaiting{ background:#bae6fd !important; color:#0c4a6e !important; border-color:#38bdf8 !important }
        .loan-card.print-snapshot .status-badges .badge.done{ background:#e9d5ff !important; color:#581c87 !important; border-color:#a78bfa !important }
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
      // enforce RTL shaping during snapshot to keep Persian layout
      const prevDir = cardEl.getAttribute('dir');
      if(prevDir!=='rtl') cardEl.setAttribute('dir','rtl');
      cardEl.classList.add('print-snapshot','printing');
      // wait for webfonts to be ready to avoid fallback glyphs/letter splitting
      try{ if(document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, new Promise(res=>setTimeout(res,400))]); }catch{}
      await new Promise(r=> setTimeout(r, 20));
      const scale = 3; // max quality for crisp text
      const canvas = await html2canvas(cardEl, { backgroundColor:'#ffffff', scale, useCORS:true, logging:false, letterRendering:true });
      const url = canvas.toDataURL('image/png');
      const id = cardEl.getAttribute('data-id') || 'card';
      const iso = new Date().toISOString().slice(0,10);
      const a = document.createElement('a'); a.href=url; a.download=`loan_${id}_${iso}.png`; document.body.appendChild(a); a.click(); a.remove();
      cardEl.classList.remove('print-snapshot','printing');
      if(prevDir!==null) cardEl.setAttribute('dir', prevDir); else cardEl.removeAttribute('dir');
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
      btn.title = 'چاپ کارت';
      btn.setAttribute('aria-label','چاپ کارت');
      // Match other buttons style: icon + text
      btn.innerHTML = '<span class="ico">🖨️</span><span>چاپ</span>';
      btn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); ns.print(cardEl); });
      cardEl.insertBefore(btn, cardEl.firstChild);
    }catch{}
  };

  window.PrintCard = ns;
})();
